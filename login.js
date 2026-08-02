const STORAGE_KEY = 'login-users-db';
const CURRENT_USER_KEY = 'logged-in-user';
const REMEMBER_KEY = 'remembered-login';
const ADMINS = [
    { email: 'dudhevansh8@gmail.com', password: '2345678910$$', username: 'Thevansh', phone: '8989921991', ffUid: '9571892213' },
    { email: 'samarthkhamele@gmail.com', password: 'samarth333', username: 'Samarth', phone: '', ffUid: '1861297996' }
];

function findAdminByEmail(email) {
    const normalizedEmail = (email || '').trim().toLowerCase();
    return ADMINS.find((admin) => admin.email.toLowerCase() === normalizedEmail) || null;
}

function loadUsers() {
    try {
        const savedUsers = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
        return Array.isArray(savedUsers) ? savedUsers : [];
    } catch (error) {
        console.warn('Unable to load users:', error);
        return [];
    }
}

function saveUsers(users) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(users));
}

function registerUser(username, email, password, phone, ffUid) {
    const users = loadUsers();
    const normalizedEmail = email.trim().toLowerCase();
    const normalizedUsername = username.trim().toLowerCase();
    const normalizedPhone = phone.trim();
    const normalizedFfUid = (ffUid || '').trim();

    const emailExists = users.some((user) => user.email === normalizedEmail);
    const usernameExists = users.some((user) => user.username.trim().toLowerCase() === normalizedUsername);
    const phoneExists = users.some((user) => user.phone === normalizedPhone);
    const ffUidExists = users.some((user) => user.ffUid === normalizedFfUid);
    const clashesWithAdmin = ADMINS.some((admin) => admin.email.toLowerCase() === normalizedEmail || admin.username.toLowerCase() === normalizedUsername);

    if (!normalizedPhone) {
        return { success: false, message: 'Phone number is required.' };
    }

    if (!/^[0-9]{6,12}$/.test(normalizedFfUid)) {
        return { success: false, message: 'Enter a valid Free Fire UID (6-12 digits).' };
    }

    if (clashesWithAdmin) {
        return { success: false, message: 'That email or username is reserved and cannot be used.' };
    }

    if (emailExists && usernameExists) {
        return { success: false, message: 'That email and username are already registered.' };
    }

    if (emailExists) {
        return { success: false, message: 'An account with that email already exists.' };
    }

    if (usernameExists) {
        return { success: false, message: 'That Free Fire IGN is already registered.' };
    }

    if (phoneExists) {
        return { success: false, message: 'That phone number is already registered.' };
    }

    if (ffUidExists) {
        return { success: false, message: 'That Free Fire UID is already linked to another account.' };
    }

    users.push({
        id: Date.now(),
        username: username.trim(),
        email: normalizedEmail,
        phone: normalizedPhone,
        ffUid: normalizedFfUid,
        password,
        coins: 0,
        winCoins: 0,
        totalEarnings: 0,
        matchesPlayed: 0,
        upiId: '',
        participated: false,
        roomName: '',
        roomPassword: '',
        matches: {
            lonewolf: { participated: false, roomName: '', roomPassword: '' },
            cs1v1: { participated: false, roomName: '', roomPassword: '' }
        }
    });

    saveUsers(users);
    return { success: true, message: 'Account created successfully. You can now log in.' };
}

function loginUser(email, password) {
    const users = loadUsers();
    const normalizedEmail = email.trim().toLowerCase();

    const admin = findAdminByEmail(normalizedEmail);
    if (admin && password === admin.password) {
        localStorage.setItem(CURRENT_USER_KEY, JSON.stringify({
            username: admin.username,
            email: admin.email,
            phone: admin.phone || '',
            ffUid: admin.ffUid || ''
        }));

        return { success: true, message: `Welcome back, ${admin.username}!` };
    }

    if (admin) {
        return { success: false, message: 'Invalid email or password.' };
    }

    const user = users.find((entry) => entry.email === normalizedEmail && entry.password === password);

    if (!user) {
        return { success: false, message: 'Invalid email or password.' };
    }

    localStorage.setItem(CURRENT_USER_KEY, JSON.stringify({
        username: user.username,
        email: user.email
    }));

    return { success: true, message: `Welcome back, ${user.username}!` };
}

function resetPassword(email, newPassword, confirmPassword) {
    const users = loadUsers();
    const normalizedEmail = email.trim().toLowerCase();
    const user = users.find((entry) => entry.email === normalizedEmail);

    if (!user) {
        return { success: false, message: 'No account found with that email.' };
    }

    if (newPassword.length < 4) {
        return { success: false, message: 'Password must be at least 4 characters long.' };
    }

    if (newPassword !== confirmPassword) {
        return { success: false, message: 'Passwords do not match.' };
    }

    user.password = newPassword;
    saveUsers(users);

    return { success: true, message: 'Password updated successfully. You can now log in.' };
}

function saveRememberedLogin(email, password) {
    try {
        localStorage.setItem(REMEMBER_KEY, JSON.stringify({ email, password }));
    } catch (error) {
        console.warn('Unable to save remembered login:', error);
    }
}

function clearRememberedLogin() {
    localStorage.removeItem(REMEMBER_KEY);
}

function loadRememberedLogin() {
    try {
        return JSON.parse(localStorage.getItem(REMEMBER_KEY) || 'null');
    } catch (error) {
        console.warn('Unable to load remembered login:', error);
        return null;
    }
}

function prefillRememberedLogin() {
    const loginForm = document.getElementById('login-form');
    if (!loginForm) {
        return;
    }
    const remembered = loadRememberedLogin();
    if (!remembered) {
        return;
    }
    if (loginForm.email) {
        loginForm.email.value = remembered.email || '';
    }
    if (loginForm.password) {
        loginForm.password.value = remembered.password || '';
    }
    const rememberCheckbox = document.getElementById('remember-me');
    if (rememberCheckbox) {
        rememberCheckbox.checked = true;
    }
}

function showMessage(messageElement, message, type = 'info') {
    if (!messageElement) {
        return;
    }

    messageElement.textContent = message;
    messageElement.className = `message ${type}`;
}

function attachFormHandlers() {
    const loginForm = document.getElementById('login-form');
    const registerForm = document.getElementById('register-form');
    const forgotPasswordForm = document.getElementById('forgot-password-form');
    const messageBox = document.getElementById('message');

    if (loginForm) {
        loginForm.addEventListener('submit', (event) => {
            event.preventDefault();
            const email = loginForm.email.value;
            const password = loginForm.password.value;
            const rememberMe = document.getElementById('remember-me')?.checked || false;
            const result = loginUser(email, password);
            showMessage(messageBox, result.message, result.success ? 'success' : 'error');

            if (result.success) {
                if (rememberMe) {
                    saveRememberedLogin(email.trim(), password);
                } else {
                    clearRememberedLogin();
                }

                loginForm.reset();
                const normalizedEmail = email.trim().toLowerCase();
                window.location.href = `index.html?user=${encodeURIComponent(normalizedEmail)}`;
            }
        });
    }

    if (registerForm) {
        registerForm.addEventListener('submit', (event) => {
            event.preventDefault();
            const username = registerForm.username.value;
            const email = registerForm.email.value;
            const phone = registerForm.phone.value;
            const password = registerForm.password.value;
            const ffUid = registerForm.ffUid.value;
            const result = registerUser(username, email, password, phone, ffUid);
            showMessage(messageBox, result.message, result.success ? 'success' : 'error');

            if (result.success) {
                registerForm.reset();
                const normalizedEmail = email.trim().toLowerCase();
                window.location.href = `index.html?user=${encodeURIComponent(normalizedEmail)}`;
            }
        });
    }

    if (forgotPasswordForm) {
        forgotPasswordForm.addEventListener('submit', (event) => {
            event.preventDefault();
            const email = forgotPasswordForm.email.value;
            const newPassword = forgotPasswordForm.newPassword.value;
            const confirmPassword = forgotPasswordForm.confirmPassword.value;
            const result = resetPassword(email, newPassword, confirmPassword);
            showMessage(messageBox, result.message, result.success ? 'success' : 'error');

            if (result.success) {
                forgotPasswordForm.reset();
            }
        });
    }
}

document.addEventListener('DOMContentLoaded', () => {
    attachFormHandlers();
    prefillRememberedLogin();
});
