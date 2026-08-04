import {
    loadProfile,
    logout
} from "./js/auth.js";

import {
    supabase
} from "./js/supabase.js";
const STORAGE_KEY = 'login-users-db';
const CURRENT_USER_KEY = 'logged-in-user';
const ADMINS = [
    { email: 'dudhevansh8@gmail.com', username: 'Thevansh', phone: '8989921991', ffUid: '9571892213' },
    { email: 'samarthkhamele@gmail.com', username: 'Samarth', phone: '', ffUid: '1861297996' }
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

const WITHDRAWAL_REQUESTS_KEY = 'lonewolf-withdrawal-requests';

function loadWithdrawalRequests() {
    try {
        const saved = JSON.parse(localStorage.getItem(WITHDRAWAL_REQUESTS_KEY) || '[]');
        return Array.isArray(saved) ? saved : [];
    } catch (error) {
        console.warn('Unable to load withdrawal requests:', error);
        return [];
    }
}

function saveWithdrawalRequests(requests) {
    localStorage.setItem(WITHDRAWAL_REQUESTS_KEY, JSON.stringify(requests));
}

const WALLET_TRANSACTIONS_KEY = 'lonewolf-wallet-transactions';

function loadWalletTransactions() {
    try {
        const saved = JSON.parse(localStorage.getItem(WALLET_TRANSACTIONS_KEY) || '[]');
        return Array.isArray(saved) ? saved : [];
    } catch (error) {
        console.warn('Unable to load wallet transactions:', error);
        return [];
    }
}

function saveWalletTransactions(transactions) {
    localStorage.setItem(WALLET_TRANSACTIONS_KEY, JSON.stringify(transactions));
}

function logWalletTransaction(email, note, amount) {
    const transactions = loadWalletTransactions();
    transactions.push({
        id: Date.now() + Math.floor(Math.random() * 1000),
        email,
        note,
        amount,
        ts: Date.now()
    });
    saveWalletTransactions(transactions);
}

function escapeHtml(value) {
    const div = document.createElement('div');
    div.textContent = String(value ?? '');
    return div.innerHTML;
}

function formatDeadline(timeValue) {
    if (!timeValue) {
        return '';
    }
    const [hoursStr, minutesStr] = timeValue.split(':');
    const hours = Number(hoursStr);
    const minutes = Number(minutesStr);
    if (Number.isNaN(hours) || Number.isNaN(minutes)) {
        return '';
    }
    const period = hours >= 12 ? 'PM' : 'AM';
    const displayHours = (hours % 12) || 12;
    return `${displayHours}:${String(minutes).padStart(2, '0')} ${period}`;
}

const MATCHES = [
    { id: 'lonewolf', label: 'Lonewolf 1v1 Custom' },
    { id: 'cs1v1', label: 'CS 1v1 Custom' }
];

function getMatchState(user, matchId) {
    if (user.matches && user.matches[matchId]) {
        return user.matches[matchId];
    }
    if (matchId === 'lonewolf' && user.participated) {
        return { participated: true, roomName: user.roomName || '', roomPassword: user.roomPassword || '' };
    }
    return { participated: false, roomName: '', roomPassword: '' };
}

function setMatchState(user, matchId, state) {
    if (!user.matches) {
        user.matches = {};
    }
    user.matches[matchId] = state;
    if (matchId === 'lonewolf') {
        user.participated = state.participated;
        user.roomName = state.roomName;
        user.roomPassword = state.roomPassword;
    }
}

function getMatchDeadlineDate(matchId) {
    const value = localStorage.getItem(`${matchId}-room-deadline`) || '';
    if (!/^\d{2}:\d{2}$/.test(value)) {
        return null;
    }
    const [hoursStr, minutesStr] = value.split(':');
    const hours = Number(hoursStr);
    const minutes = Number(minutesStr);
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), now.getDate(), hours, minutes, 0, 0);
}

function isMatchRoomRevealed(matchId) {
    const deadlineDate = getMatchDeadlineDate(matchId);
    if (!deadlineDate) {
        return true;
    }
    const revealAt = deadlineDate.getTime() - 5 * 60 * 1000;
    return Date.now() >= revealAt;
}

function getCurrentUser() {
    try {
        return JSON.parse(localStorage.getItem(CURRENT_USER_KEY) || 'null');
    } catch (error) {
        console.warn('Unable to load current user:', error);
        return null;
    }
}

function getCurrentUserFromUrl() {
    const params = new URLSearchParams(window.location.search);
    const email = params.get('user')?.trim().toLowerCase();
    if (!email) {
        return null;
    }
    const admin = findAdminByEmail(email);
    if (admin) {
        return { username: admin.username, email: admin.email, phone: admin.phone || '' };
    }
    const users = loadUsers();
    const user = users.find((entry) => entry.email === email);
    return user ? { username: user.username, email: user.email } : null;
}

function setCurrentUser(user) {
    try {
        localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user));
    } catch (error) {
        console.warn('Unable to save current user:', error);
    }
}

function clearUrlState() {
    if (window.history && window.history.replaceState) {
        const cleanUrl = window.location.protocol === 'file:'
            ? window.location.pathname + window.location.hash
            : window.location.origin + window.location.pathname + window.location.hash;
        window.history.replaceState(null, '', cleanUrl);
    }
}

function renderDashboard() {
    let currentUser = getCurrentUser();

    if (!currentUser) {
        const urlUser = getCurrentUserFromUrl();
        if (urlUser) {
            setCurrentUser(urlUser);
            clearUrlState();
            currentUser = urlUser;
        }
    }

    const currentUserEmail = currentUser?.email?.trim().toLowerCase() || '';
    const isAdmin = Boolean(findAdminByEmail(currentUserEmail));

    const adminPanel = document.getElementById('admin-panel');
    const userPanel = document.getElementById('user-panel');
    const guestPanel = document.getElementById('guest-panel');
    const userWelcome = document.getElementById('user-welcome');
    const userEmail = document.getElementById('user-email');
    const userCoins = document.getElementById('user-coins');
    const registeredUsersList = document.getElementById('registered-users');
    const tournamentButton = document.getElementById('tournament-button');
    const logoutButton = document.getElementById('logout-button');
    const roomStatus = document.getElementById('room-status');
    const userRoomName = document.getElementById('user-room-name');
    const userRoomPassword = document.getElementById('user-room-password');

    adminPanel.classList.remove('active');
    userPanel.classList.remove('active');
    guestPanel.classList.remove('active');
    adminPanel.classList.add('hidden');
    userPanel.classList.add('hidden');
    guestPanel.classList.add('hidden');
    if (tournamentButton) {
        tournamentButton.classList.add('hidden');
    }
    if (logoutButton) {
        logoutButton.classList.add('hidden');
    }
    if (roomStatus) {
        roomStatus.textContent = '';
    }
    if (userRoomName) {
        userRoomName.textContent = '';
    }
    if (userRoomPassword) {
        userRoomPassword.textContent = '';
    }

    if (!currentUser) {
        guestPanel.classList.remove('hidden');
        guestPanel.classList.add('active');
        return;
    }

    if (logoutButton) {
        logoutButton.classList.remove('hidden');
    }

    if (isAdmin) {
        const users = loadUsers();
        adminPanel.classList.remove('hidden');
        adminPanel.classList.add('active');

        const adminContactPhone = document.getElementById('admin-contact-phone');
        if (adminContactPhone) {
            const activeAdmin = findAdminByEmail(currentUserEmail);
            const phoneText = activeAdmin?.phone ? ` · 📞 ${activeAdmin.phone}` : '';
            adminContactPhone.textContent = `Logged in as ${activeAdmin?.username || 'Admin'}${phoneText}`;
        }

        const dangerResetButton = document.getElementById('danger-reset-btn');
        const dangerResetMessage = document.getElementById('danger-reset-message');
        const RESET_PASSCODE = '082013';

        if (dangerResetButton) {
            dangerResetButton.addEventListener('click', () => {
                const passcode = window.prompt('⚠️ WARNING: This will permanently delete ALL registered accounts, emails, and coins from Local Storage. This cannot be undone.\n\nEnter the admin passcode to confirm:');

                if (passcode === null) {
                    return;
                }

                if (passcode !== RESET_PASSCODE) {
                    if (dangerResetMessage) {
                        dangerResetMessage.textContent = '❌ Incorrect passcode. Local storage was NOT reset.';
                        dangerResetMessage.className = 'mt-3 text-sm font-medium text-red-600';
                    }
                    return;
                }

                localStorage.removeItem(STORAGE_KEY);
                localStorage.removeItem(CURRENT_USER_KEY);
                localStorage.removeItem('lonewolf-room-name');
                localStorage.removeItem('lonewolf-room-password');
                localStorage.removeItem('lonewolf-room-deadline');
                localStorage.removeItem('lonewolf-description');
                localStorage.removeItem('cs1v1-room-name');
                localStorage.removeItem('cs1v1-room-password');
                localStorage.removeItem('cs1v1-room-deadline');
                localStorage.removeItem('cs1v1-description');
                localStorage.removeItem('remembered-login');

                if (dangerResetMessage) {
                    dangerResetMessage.textContent = '✅ All local storage data has been deleted.';
                    dangerResetMessage.className = 'mt-3 text-sm font-medium text-green-700';
                }

                window.alert('✅ All user data has been deleted. You will be logged out.');
                window.location.href = 'login.html';
            });
        }

        if (tournamentButton) {
            tournamentButton.classList.remove('hidden');
        }

        function setupRoomConfig(matchId, label) {
            const roomNameInput = document.getElementById(`${matchId}-room-name-input`);
            const roomPassInput = document.getElementById(`${matchId}-room-pass-input`);
            const roomDeadlineInput = document.getElementById(`${matchId}-room-deadline-input`);
            const roomDescInput = document.getElementById(`${matchId}-room-description-input`);
            const roomSavedMessage = document.getElementById(`${matchId}-room-saved-message`);
            const saveRoomButton = document.getElementById(`${matchId}-save-room-btn`);
            const storedRoomName = localStorage.getItem(`${matchId}-room-name`) || '';
            const storedRoomPass = localStorage.getItem(`${matchId}-room-password`) || '';
            const storedRoomDeadline = localStorage.getItem(`${matchId}-room-deadline`) || '';
            const storedDescription = localStorage.getItem(`${matchId}-description`) || '';

            if (roomNameInput) {
                roomNameInput.value = storedRoomName;
            }
            if (roomPassInput) {
                roomPassInput.value = storedRoomPass;
            }
            if (roomDeadlineInput) {
                roomDeadlineInput.value = storedRoomDeadline;
            }
            if (roomDescInput) {
                roomDescInput.value = storedDescription;
            }
            if (roomSavedMessage) {
                if (storedRoomName && storedRoomDeadline) {
                    roomSavedMessage.textContent = `Room settings are saved. Join before ${formatDeadline(storedRoomDeadline)}. Room ID & password auto-reveal to joined players 5 minutes before that time.`;
                } else if (storedRoomName) {
                    roomSavedMessage.textContent = 'Room settings are saved. No join deadline set — room ID & password show as soon as a player joins.';
                } else {
                    roomSavedMessage.textContent = 'No room configured yet.';
                }
            }
            if (saveRoomButton) {
                saveRoomButton.addEventListener('click', () => {
                    const name = roomNameInput?.value.trim() || '';
                    const pass = roomPassInput?.value.trim() || '';
                    const deadline = roomDeadlineInput?.value || '';
                    const description = roomDescInput?.value.trim() || '';
                    if (!name || !pass) {
                        roomSavedMessage.textContent = 'Room name and password are required.';
                        return;
                    }
                    if (deadline && !/^\d{2}:\d{2}$/.test(deadline)) {
                        roomSavedMessage.textContent = 'Please enter a valid join time.';
                        return;
                    }
                    localStorage.setItem(`${matchId}-room-name`, name);
                    localStorage.setItem(`${matchId}-room-password`, pass);
                    if (deadline) {
                        localStorage.setItem(`${matchId}-room-deadline`, deadline);
                    } else {
                        localStorage.removeItem(`${matchId}-room-deadline`);
                    }
                    if (description) {
                        localStorage.setItem(`${matchId}-description`, description);
                    } else {
                        localStorage.removeItem(`${matchId}-description`);
                    }
                    roomSavedMessage.textContent = deadline
                        ? `Room settings saved. Join before ${formatDeadline(deadline)}. Room ID & password auto-reveal to joined players 5 minutes before that time.`
                        : 'Room settings saved. No join deadline set — room ID & password show as soon as a player joins.';
                    renderDashboard();
                });
            }

            const resetRoomButton = document.getElementById(`${matchId}-reset-room-btn`);
            if (resetRoomButton) {
                resetRoomButton.addEventListener('click', () => {
                    localStorage.removeItem(`${matchId}-room-name`);
                    localStorage.removeItem(`${matchId}-room-password`);
                    localStorage.removeItem(`${matchId}-room-deadline`);
                    localStorage.removeItem(`${matchId}-description`);
                    const usersToReset = loadUsers();
                    usersToReset.forEach((user) => {
                        const state = getMatchState(user, matchId);
                        if (state.participated) {
                            user.matchesPlayed = (Number(user.matchesPlayed) || 0) + 1;
                        }
                        setMatchState(user, matchId, { participated: false, roomName: '', roomPassword: '' });
                    });
                    saveUsers(usersToReset);
                    if (roomNameInput) {
                        roomNameInput.value = '';
                    }
                    if (roomPassInput) {
                        roomPassInput.value = '';
                    }
                    if (roomDeadlineInput) {
                        roomDeadlineInput.value = '';
                    }
                    if (roomDescInput) {
                        roomDescInput.value = '';
                    }
                    if (roomSavedMessage) {
                        roomSavedMessage.textContent = `${label} room settings and all participations have been reset.`;
                    }
                    renderDashboard();
                });
            }
        }

        setupRoomConfig('lonewolf', 'Lonewolf 1v1');
        setupRoomConfig('cs1v1', 'CS 1v1 Custom');

        const withdrawalRequestsList = document.getElementById('withdrawal-requests-list');
        if (withdrawalRequestsList) {
            const withdrawalRequests = loadWithdrawalRequests().slice().reverse();
            if (withdrawalRequests.length === 0) {
                withdrawalRequestsList.innerHTML = '<li class="text-gray-600 text-sm p-4 bg-gray-50 rounded-lg border border-gray-200">No withdrawal requests yet.</li>';
            } else {
                withdrawalRequestsList.innerHTML = withdrawalRequests.map((request) => {
                    const requestedDate = new Date(request.requestedAt);
                    const formattedDate = Number.isNaN(requestedDate.getTime())
                        ? ''
                        : requestedDate.toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' });
                    const isPaid = request.status === 'paid';
                    return `
                        <li class="flex flex-wrap items-center gap-3 p-4 bg-white border ${isPaid ? 'border-green-200 bg-green-50' : 'border-gray-200'} rounded-xl shadow-sm">
                            <div class="flex-1 min-w-[180px]">
                                <p class="font-semibold text-gray-900 leading-tight">${escapeHtml(request.username)} <span class="text-gray-400 font-normal">(${escapeHtml(request.email)})</span></p>
                                <p class="text-sm text-gray-600 leading-tight">UPI ID: <span class="font-semibold">${escapeHtml(request.upiId)}</span></p>
                                <p class="text-xs text-gray-400 leading-tight">${formattedDate}</p>
                            </div>
                            <span class="text-sm font-semibold text-blue-600 bg-blue-50 px-3 py-1 rounded-full whitespace-nowrap">${request.coins} coins → ₹${request.rupees}</span>
                            ${isPaid
                                ? '<span class="text-sm font-semibold text-green-700 bg-green-100 px-3 py-1 rounded-full">✅ Paid</span>'
                                : `<button type="button" data-request-id="${request.id}" class="mark-paid-btn px-4 py-2 text-sm bg-gradient-to-r from-green-600 to-emerald-600 text-white font-semibold rounded-lg shadow hover:shadow-md hover:-translate-y-0.5 transition-all duration-300">Mark as Paid</button>`
                            }
                        </li>
                    `;
                }).join('');

                withdrawalRequestsList.querySelectorAll('.mark-paid-btn').forEach((button) => {
                    button.addEventListener('click', () => {
                        const requestId = button.dataset.requestId;
                        const requests = loadWithdrawalRequests();
                        const target = requests.find((request) => String(request.id) === String(requestId));
                        if (target) {
                            target.status = 'paid';
                            saveWithdrawalRequests(requests);
                            renderDashboard();
                        }
                    });
                });
            }
        }

        registeredUsersList.innerHTML = '';
        if (users.length === 0) {
            registeredUsersList.innerHTML = '<li class="text-gray-600 text-sm p-4 bg-gray-50 rounded-lg border border-gray-200">No registered users yet.</li>';
            return;
        }

        users.forEach((user) => {
            const safeEmail = escapeHtml(user.email);
            const safePhone = escapeHtml(user.phone || 'Not provided');
            const safeFfUid = escapeHtml(user.ffUid || 'Not linked');
            const inputId = `coin-input-${safeEmail.replace(/[^a-zA-Z0-9]/g, '')}`;
            const listItem = document.createElement('li');
            listItem.className = 'flex flex-wrap items-center gap-3 p-4 bg-white border border-gray-200 rounded-xl shadow-sm hover:shadow-md';
            listItem.innerHTML = `
                <div class="flex-1 min-w-[160px]">
                    <p class="font-semibold text-gray-900 leading-tight">${escapeHtml(user.username)}</p>
                    <p class="text-sm text-gray-500 leading-tight">${safeEmail}</p>
                    <p class="text-sm text-gray-500 leading-tight">📞 ${safePhone}</p>
                    <p class="text-sm text-gray-500 leading-tight">🎮 UID: ${safeFfUid}</p>
                </div>
                <span class="text-sm font-semibold text-blue-600 bg-blue-50 px-3 py-1 rounded-full whitespace-nowrap">${user.coins ?? 0} coins</span>
                <span class="text-sm font-semibold text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full whitespace-nowrap">🏆 ${user.winCoins ?? 0} win coins</span>

                <label for="${inputId}" class="sr-only">Set coins for ${safeEmail}</label>
                <input
                    id="${inputId}"
                    type="number"
                    min="0"
                    value="${user.coins ?? 0}"
                    data-email="${safeEmail}"
                    aria-label="Set coins for ${safeEmail}"
                    class="coin-input w-24 px-3 py-2 border-2 border-gray-300 rounded-lg bg-gray-50 text-gray-900 text-sm focus:border-blue-600 focus:bg-white transition-all duration-300"
                />

                <div class="flex gap-2 flex-wrap">
                    <button
                        type="button"
                        data-email="${safeEmail}"
                        aria-label="Save coin amount for ${safeEmail}"
                        class="save-coin-btn px-4 py-2 text-sm bg-gradient-to-r from-blue-600 to-blue-700 text-white font-semibold rounded-lg shadow hover:shadow-md hover:-translate-y-0.5 transition-all duration-300"
                    >Save</button>
                    <button
                        type="button"
                        data-email="${safeEmail}"
                        aria-label="Add 10 winning coins to ${safeEmail}"
                        class="win-coin-btn px-4 py-2 text-sm bg-gradient-to-r from-green-600 to-emerald-600 text-white font-semibold rounded-lg shadow hover:shadow-md hover:-translate-y-0.5 transition-all duration-300"
                    >Win +15</button>
                    <button
                        type="button"
                        data-email="${safeEmail}"
                        aria-label="Reset coins to zero for ${safeEmail}"
                        class="reset-coin-btn px-4 py-2 text-sm bg-gray-100 text-gray-900 font-semibold rounded-lg border-2 border-gray-300 hover:bg-white hover:border-red-500 hover:text-red-600 transition-all duration-300"
                    >Reset</button>
                </div>
            `;
            registeredUsersList.appendChild(listItem);
        });

        const saveButtons = registeredUsersList.querySelectorAll('.save-coin-btn');
        saveButtons.forEach((button) => {
            button.addEventListener('click', () => {
                const targetEmail = button.dataset.email;
                const listItem = button.closest('li');
                const input = listItem ? listItem.querySelector('.coin-input') : null;
                const newCoins = Number(input?.value ?? 0);
                if (Number.isNaN(newCoins) || newCoins < 0) {
                    return;
                }
                const usersToUpdate = loadUsers();
                const userToUpdate = usersToUpdate.find((user) => user.email === targetEmail);
                if (!userToUpdate) {
                    return;
                }
                userToUpdate.coins = newCoins;
                userToUpdate.winCoins = Math.min(Number(userToUpdate.winCoins) || 0, newCoins);
                saveUsers(usersToUpdate);
                logWalletTransaction(targetEmail, `Admin set your balance to ${newCoins} coins`, null);
                renderDashboard();
            });
        });

        const winButtons = registeredUsersList.querySelectorAll('.win-coin-btn');
        winButtons.forEach((button) => {
            button.addEventListener('click', () => {
                const targetEmail = button.dataset.email;
                const usersToUpdate = loadUsers();
                const userToUpdate = usersToUpdate.find((user) => user.email === targetEmail);
                if (!userToUpdate) {
                    return;
                }
                userToUpdate.coins = (Number(userToUpdate.coins) || 0) + 15;
                userToUpdate.winCoins = (Number(userToUpdate.winCoins) || 0) + 15;
                userToUpdate.totalEarnings = (Number(userToUpdate.totalEarnings) || 0) + 15;
                saveUsers(usersToUpdate);
                logWalletTransaction(targetEmail, 'Admin credited 15 coins to your account', 15);
                renderDashboard();
            });
        });

        const resetCoinButtons = registeredUsersList.querySelectorAll('.reset-coin-btn');
        resetCoinButtons.forEach((button) => {
            button.addEventListener('click', () => {
                const targetEmail = button.dataset.email;
                const usersToUpdate = loadUsers();
                const userToUpdate = usersToUpdate.find((user) => user.email === targetEmail);
                if (!userToUpdate) {
                    return;
                }
                userToUpdate.coins = 0;
                userToUpdate.winCoins = 0;
                saveUsers(usersToUpdate);
                logWalletTransaction(targetEmail, 'Admin reset your coin balance to 0', null);
                renderDashboard();
            });
        });
        return;
    }

    userPanel.classList.remove('hidden');
    userPanel.classList.add('active');
    const users = loadUsers();
    const user = users.find((entry) => entry.email === currentUser.email);
    if (userWelcome) {
        userWelcome.textContent = `Welcome back, ${currentUser.username}!`;
    }
    if (userEmail) {
        userEmail.textContent = user ? `Email: ${user.email}` : '';
    }
    if (userCoins) {
        userCoins.textContent = user ? String(user.coins ?? 0) : '0';
    }

    const joinedMatches = user ? MATCHES.filter((m) => getMatchState(user, m.id).participated) : [];

    if (joinedMatches.length > 0) {
        if (roomStatus) {
            roomStatus.textContent = `Participating in: ${joinedMatches.map((m) => m.label).join(', ')}`;
        }
        const lines = joinedMatches.map((m) => {
            const state = getMatchState(user, m.id);
            if (!isMatchRoomRevealed(m.id)) {
                const deadlineDate = getMatchDeadlineDate(m.id);
                const revealTimeStr = deadlineDate
                    ? new Date(deadlineDate.getTime() - 5 * 60 * 1000).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })
                    : null;
                return `${m.label}: Room details reveal ${revealTimeStr ? `at ${revealTimeStr}` : 'shortly'} (5 min before match).`;
            }
            return `${m.label} — Room: ${state.roomName || 'N/A'} | Password: ${state.roomPassword || 'N/A'}`;
        });
        if (userRoomName) {
            userRoomName.innerHTML = lines.map((line) => escapeHtml(line)).join('<br>');
        }
        if (userRoomPassword) {
            userRoomPassword.textContent = '';
        }
    } else {
        if (roomStatus) {
            roomStatus.textContent = 'Visit the Tournament page to join a match.';
        }
        if (userRoomName) {
            userRoomName.textContent = '';
        }
        if (userRoomPassword) {
            userRoomPassword.textContent = '';
        }
    }
}

function setupRechargeModal() {
    const rechargeButton = document.getElementById('recharge-button');
    const modal = document.getElementById('recharge-modal');
    const modalBody = document.getElementById('recharge-modal-body');
    const modalTitle = document.getElementById('recharge-modal-title');
    const closeButton = document.getElementById('recharge-modal-close');

    if (!rechargeButton || !modal || !modalBody || !modalTitle) {
        return;
    }

    const RECHARGE_OFFERS = [
        { coins: 10, price: 10 },
        { coins: 50, price: 50 },
        { coins: 100, price: 100 },
        { coins: 500, price: 400, badge: '🔥 Mega Saving Offer' }
    ];

    function renderOfferList() {
        modalTitle.textContent = '⚡ Recharge Coins';
        modalBody.innerHTML = RECHARGE_OFFERS.map((offer, index) => `
            <div class="border-2 ${offer.badge ? 'border-amber-400 bg-amber-50' : 'border-gray-200 bg-white'} rounded-xl p-5 flex items-center justify-between gap-4 flex-wrap">
                <div>
                    ${offer.badge ? `<span class="inline-block mb-1 text-xs font-bold text-amber-700 bg-amber-200 px-2 py-1 rounded-full">${offer.badge}</span>` : ''}
                    <p class="text-lg font-bold text-gray-900">${offer.coins} coins</p>
                    <p class="text-sm text-gray-600">₹${offer.price}</p>
                </div>
                <button type="button" data-index="${index}" class="purchase-offer-btn px-5 py-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white font-semibold rounded-lg shadow hover:shadow-md hover:-translate-y-0.5 transition-all duration-300">Purchase</button>
            </div>
        `).join('');
    }

    function renderPaymentDetails(offer) {
        modalTitle.textContent = `Pay ₹${offer.price} for ${offer.coins} coins`;
        modalBody.innerHTML = `
            <div class="flex flex-col items-center text-center space-y-4">
                <div class="w-56 h-56 rounded-xl border-2 border-gray-200 bg-white p-2 shadow-md overflow-hidden flex items-center justify-center">
                    <img src="payment-qr.jpg" alt="Payment QR code" class="w-full h-full object-contain rounded-lg" />
                </div>
                <p class="text-sm text-gray-700 bg-amber-50 border-l-4 border-amber-500 p-4 rounded-lg text-left">
                    <strong>Note:</strong> When you're doing payment, enter your username, phone number, or email — any one of them — in the message section when you are paying.
                </p>
                <button type="button" id="recharge-back-btn" class="px-5 py-2 bg-gray-100 text-gray-900 font-semibold rounded-lg border-2 border-gray-300 hover:bg-white hover:border-blue-600 hover:text-blue-600 transition-all duration-300">← Back to offers</button>
            </div>
        `;

        const backButton = document.getElementById('recharge-back-btn');
        if (backButton) {
            backButton.addEventListener('click', renderOfferList);
        }
    }

    modalBody.addEventListener('click', (event) => {
        const purchaseBtn = event.target.closest('.purchase-offer-btn');
        if (purchaseBtn) {
            const offer = RECHARGE_OFFERS[Number(purchaseBtn.dataset.index)];
            if (offer) {
                renderPaymentDetails(offer);
            }
        }
    });

    function closeModal() {
        modal.classList.add('hidden');
    }

    rechargeButton.addEventListener('click', () => {
        renderOfferList();
        modal.classList.remove('hidden');
    });

    if (closeButton) {
        closeButton.addEventListener('click', closeModal);
    }

    modal.addEventListener('click', (event) => {
        if (event.target === modal) {
            closeModal();
        }
    });

    document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape' && !modal.classList.contains('hidden')) {
            closeModal();
        }
    });
}

function setupWithdrawModal() {
    const withdrawButton = document.getElementById('withdraw-button');
    const modal = document.getElementById('withdraw-modal');
    const modalBody = document.getElementById('withdraw-modal-body');
    const modalTitle = document.getElementById('withdraw-modal-title');
    const closeButton = document.getElementById('withdraw-modal-close');

    if (!withdrawButton || !modal || !modalBody || !modalTitle) {
        return;
    }

    const WITHDRAW_OPTIONS = [30, 50, 100];
    const WITHDRAW_NOTE = "The coins were deducted from your account. It will reach your bank account in 4-5 hours. You can only withdraw win coins. Withdrawal timing: 2:00 PM – 9:00 PM.";

    function getCurrentAppUser() {
        const currentUser = getCurrentUser();
        if (!currentUser) {
            return null;
        }
        const users = loadUsers();
        return users.find((entry) => entry.email === currentUser.email) || null;
    }

    function isWithinWithdrawWindow() {
        const now = new Date();
        const minutesNow = now.getHours() * 60 + now.getMinutes();
        return minutesNow >= (14 * 60) && minutesNow < (21 * 60);
    }

    function renderUpiStep() {
        const user = getCurrentAppUser();
        modalTitle.textContent = '💸 Withdraw Coins';

        if (!user) {
            modalBody.innerHTML = '<p class="text-sm text-red-600">Unable to find your account. Please log in again.</p>';
            return;
        }

        modalBody.innerHTML = `
            <p class="text-sm text-gray-600">Your win coins: <strong class="text-emerald-600">${user.winCoins ?? 0}</strong></p>
            <label class="block">
                <span class="block text-gray-900 font-semibold mb-2">Your UPI ID</span>
                <input id="withdraw-upi-input" type="text" value="${escapeHtml(user.upiId || '')}" placeholder="e.g. yourname@upi" class="w-full px-4 py-3 border-2 border-gray-300 rounded-lg bg-gray-50 text-gray-900 text-sm focus:border-blue-600 focus:bg-white transition-all duration-300" />
            </label>
            <p id="withdraw-upi-error" class="text-sm text-red-600 hidden"></p>
            <button type="button" id="withdraw-upi-continue" class="w-full px-4 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-semibold rounded-lg shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all duration-300">Continue</button>
        `;

        const continueButton = document.getElementById('withdraw-upi-continue');
        const upiInput = document.getElementById('withdraw-upi-input');
        const upiError = document.getElementById('withdraw-upi-error');

        continueButton.addEventListener('click', () => {
            const upiId = upiInput.value.trim();
            const upiPattern = /^[\w.\-]{2,}@[a-zA-Z]{2,}$/;
            if (!upiPattern.test(upiId)) {
                upiError.textContent = 'Please enter a valid UPI ID (e.g. yourname@upi).';
                upiError.classList.remove('hidden');
                return;
            }

            const users = loadUsers();
            const userToUpdate = users.find((entry) => entry.email === user.email);
            if (userToUpdate) {
                userToUpdate.upiId = upiId;
                saveUsers(users);
            }

            renderOfferStep(upiId);
        });
    }

    function renderOfferStep(upiId) {
        const user = getCurrentAppUser();
        if (!user) {
            renderUpiStep();
            return;
        }

        modalTitle.textContent = '💸 Choose Withdrawal Amount';
        modalBody.innerHTML = `
            <p class="text-sm text-gray-600">UPI ID: <strong>${escapeHtml(upiId)}</strong> · Win coins available: <strong class="text-emerald-600">${user.winCoins ?? 0}</strong></p>
            <div class="space-y-3">
                ${WITHDRAW_OPTIONS.map((coins) => `
                    <div class="border-2 border-gray-200 bg-white rounded-xl p-5 flex items-center justify-between gap-4 flex-wrap">
                        <div>
                            <p class="text-lg font-bold text-gray-900">${coins} coins</p>
                            <p class="text-sm text-gray-600">₹${coins}</p>
                        </div>
                        <button type="button" data-coins="${coins}" class="withdraw-offer-btn px-5 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-semibold rounded-lg shadow hover:shadow-md hover:-translate-y-0.5 transition-all duration-300">Withdraw</button>
                    </div>
                `).join('')}
            </div>
            <p id="withdraw-offer-error" class="text-sm text-red-600 hidden"></p>
            <p class="text-xs text-gray-500 bg-gray-50 border-l-4 border-gray-300 p-3 rounded-lg">${WITHDRAW_NOTE}</p>
            <button type="button" id="withdraw-back-btn" class="px-5 py-2 bg-gray-100 text-gray-900 font-semibold rounded-lg border-2 border-gray-300 hover:bg-white hover:border-blue-600 hover:text-blue-600 transition-all duration-300">← Change UPI ID</button>
        `;

        document.getElementById('withdraw-back-btn').addEventListener('click', renderUpiStep);

        modalBody.querySelectorAll('.withdraw-offer-btn').forEach((button) => {
            button.addEventListener('click', () => {
                const coins = Number(button.dataset.coins);
                const errorEl = document.getElementById('withdraw-offer-error');
                const latestUser = getCurrentAppUser();

                if (!latestUser) {
                    return;
                }
                if (!isWithinWithdrawWindow()) {
                    errorEl.textContent = 'Withdrawals are only available between 2:00 PM and 9:00 PM.';
                    errorEl.classList.remove('hidden');
                    return;
                }
                if (MATCHES.some((m) => getMatchState(latestUser, m.id).participated)) {
                    errorEl.textContent = "You can't withdraw while you're participating in a match.";
                    errorEl.classList.remove('hidden');
                    return;
                }
                if ((Number(latestUser.winCoins) || 0) < coins) {
                    errorEl.textContent = "You don't have enough win coins for this withdrawal.";
                    errorEl.classList.remove('hidden');
                    return;
                }

                const users = loadUsers();
                const userToUpdate = users.find((entry) => entry.email === latestUser.email);
                if (!userToUpdate) {
                    return;
                }
                userToUpdate.coins = (Number(userToUpdate.coins) || 0) - coins;
                userToUpdate.winCoins = (Number(userToUpdate.winCoins) || 0) - coins;
                saveUsers(users);

                const requests = loadWithdrawalRequests();
                requests.push({
                    id: Date.now(),
                    username: userToUpdate.username,
                    email: userToUpdate.email,
                    upiId,
                    coins,
                    rupees: coins,
                    requestedAt: new Date().toISOString(),
                    status: 'pending'
                });
                saveWithdrawalRequests(requests);
                logWalletTransaction(userToUpdate.email, `You withdrew ${coins} coins (₹${coins}) via UPI`, -coins);

                renderConfirmation(coins);
                renderDashboard();
            });
        });
    }

    function renderConfirmation(coins) {
        modalTitle.textContent = '✅ Withdrawal Requested';
        modalBody.innerHTML = `
            <p class="text-sm font-semibold text-green-700 bg-green-50 border-l-4 border-green-600 p-4 rounded-lg">Your request to withdraw ${coins} coins (₹${coins}) has been submitted.</p>
            <p class="text-sm text-gray-700 bg-amber-50 border-l-4 border-amber-500 p-4 rounded-lg"><strong>Note:</strong> ${WITHDRAW_NOTE}</p>
            <button type="button" id="withdraw-done-btn" class="w-full px-4 py-3 bg-gray-100 text-gray-900 font-semibold rounded-lg border-2 border-gray-300 hover:bg-white hover:border-blue-600 hover:text-blue-600 transition-all duration-300">Done</button>
        `;
        document.getElementById('withdraw-done-btn').addEventListener('click', () => {
            modal.classList.add('hidden');
        });
    }

    function closeModal() {
        modal.classList.add('hidden');
    }

    withdrawButton.addEventListener('click', () => {
        renderUpiStep();
        modal.classList.remove('hidden');
    });

    if (closeButton) {
        closeButton.addEventListener('click', closeModal);
    }

    modal.addEventListener('click', (event) => {
        if (event.target === modal) {
            closeModal();
        }
    });

    document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape' && !modal.classList.contains('hidden')) {
            closeModal();
        }
    });
}

function setupWalletHistoryModal() {
    const historyButton = document.getElementById('wallet-history-button');
    const modal = document.getElementById('wallet-history-modal');
    const modalBody = document.getElementById('wallet-history-modal-body');
    const closeButton = document.getElementById('wallet-history-modal-close');

    if (!historyButton || !modal || !modalBody) {
        return;
    }

    function formatWalletTimestamp(ts) {
        const date = new Date(ts);
        return Number.isNaN(date.getTime()) ? '' : date.toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' });
    }

    function renderHistory() {
        const currentUser = getCurrentUser();
        if (!currentUser) {
            modalBody.innerHTML = '<p class="text-sm text-red-600">Unable to find your account. Please log in again.</p>';
            return;
        }

        const myTransactions = loadWalletTransactions()
            .filter((t) => t.email === currentUser.email)
            .sort((a, b) => b.ts - a.ts);

        if (myTransactions.length === 0) {
            modalBody.innerHTML = '<p class="text-gray-600 text-sm p-4 bg-gray-50 rounded-lg border border-gray-200">No wallet activity yet.</p>';
            return;
        }

        modalBody.innerHTML = myTransactions.map((t) => {
            const isPositive = typeof t.amount === 'number' && t.amount > 0;
            const isNegative = typeof t.amount === 'number' && t.amount < 0;
            const badgeClass = isPositive ? 'text-emerald-600 bg-emerald-50' : (isNegative ? 'text-red-600 bg-red-50' : 'text-gray-600 bg-gray-100');
            const amountBadge = typeof t.amount === 'number'
                ? '<span class="text-sm font-semibold ' + badgeClass + ' px-3 py-1 rounded-full whitespace-nowrap">' + (isPositive ? '+' : '') + t.amount + '</span>'
                : '';
            return '<div class="flex items-center justify-between gap-3 p-4 bg-white border border-gray-200 rounded-xl shadow-sm">'
                + '<div><p class="text-gray-900 font-medium">' + escapeHtml(t.note) + '</p>'
                + '<p class="text-xs text-gray-400 mt-1">' + formatWalletTimestamp(t.ts) + '</p></div>'
                + amountBadge
                + '</div>';
        }).join('');
    }

    function closeModal() {
        modal.classList.add('hidden');
    }

    historyButton.addEventListener('click', () => {
        renderHistory();
        modal.classList.remove('hidden');
    });

    if (closeButton) {
        closeButton.addEventListener('click', closeModal);
    }

    modal.addEventListener('click', (event) => {
        if (event.target === modal) {
            closeModal();
        }
    });

    document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape' && !modal.classList.contains('hidden')) {
            closeModal();
        }
    });
}

function setupPlayerStatsModal() {
    const openButton = document.getElementById('profile-open-btn');
    const modal = document.getElementById('player-stats-modal');
    const modalBody = document.getElementById('player-stats-modal-body');
    const closeButton = document.getElementById('player-stats-modal-close');

    if (!openButton || !modal || !modalBody) {
        return;
    }

    function renderStats() {
        const currentUser = getCurrentUser();
        if (!currentUser) {
            modalBody.innerHTML = '<p class="text-sm text-red-600">Unable to find your account. Please log in again.</p>';
            return;
        }
        const users = loadUsers();
        const user = users.find((entry) => entry.email === currentUser.email);
        if (!user) {
            modalBody.innerHTML = '<p class="text-sm text-red-600">Unable to find your account. Please log in again.</p>';
            return;
        }

        const matchesPlayed = Number(user.matchesPlayed) || 0;
        const totalEarnings = Number(user.totalEarnings) || 0;

        modalBody.innerHTML = ''
            + '<div class="flex items-center gap-4 mb-2">'
            + '<span class="w-14 h-14 flex items-center justify-center rounded-full bg-gradient-to-r from-[#2563eb] to-[#38bdf8] text-white text-2xl font-bold shadow-md">👤</span>'
            + '<div><p class="text-lg font-bold text-gray-900">' + escapeHtml(user.username) + '</p>'
            + '<p class="text-sm text-gray-500">' + escapeHtml(user.email) + '</p></div></div>'
            + '<div class="p-4 bg-blue-50 border border-blue-200 rounded-xl">'
            + '<p class="text-xs font-semibold text-gray-500 uppercase mb-1">Free Fire Identity</p>'
            + '<p class="text-gray-900 font-medium">IGN: ' + escapeHtml(user.username) + '</p>'
            + '<p class="text-gray-900 font-medium">UID: ' + escapeHtml(user.ffUid || 'Not provided') + '</p></div>'
            + '<div class="grid grid-cols-2 gap-3">'
            + '<div class="p-4 bg-white border border-gray-200 rounded-xl text-center">'
            + '<p class="text-2xl font-bold text-[#2563eb]">' + matchesPlayed + '</p>'
            + '<p class="text-xs text-gray-500 font-semibold mt-1">Matches Played</p></div>'
            + '<div class="p-4 bg-white border border-gray-200 rounded-xl text-center">'
            + '<p class="text-2xl font-bold text-emerald-600">₹' + totalEarnings + '</p>'
            + '<p class="text-xs text-gray-500 font-semibold mt-1">Total Earnings</p></div></div>';
    }

    function closeModal() {
        modal.classList.add('hidden');
    }

    openButton.addEventListener('click', () => {
        renderStats();
        modal.classList.remove('hidden');
    });

    if (closeButton) {
        closeButton.addEventListener('click', closeModal);
    }

    modal.addEventListener('click', (event) => {
        if (event.target === modal) {
            closeModal();
        }
    });

    document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape' && !modal.classList.contains('hidden')) {
            closeModal();
        }
    });
}

async function loadCurrentProfile() {

    try {

        const profile = await loadProfile();

        if (!profile) {

            window.location.href = "login.html";
            return null;

        }

        const username =
            document.getElementById("username");

        if (username)
            username.textContent =
                profile.username ?? "-";

        const wallet =
            document.getElementById("wallet");

        if (wallet)
            wallet.textContent =
                profile.wallet_balance ?? 0;

        const phone =
            document.getElementById("phone");

        if (phone)
            phone.textContent =
                profile.phone ?? "-";

        const ffuid =
            document.getElementById("ffuid");

        if (ffuid)
            ffuid.textContent =
                profile.ff_uid ?? "-";

        return profile;

    } catch (err) {

        console.error(err);

        return null;

    }

}

document.addEventListener('DOMContentLoaded', () => {
    renderDashboard();
    setupRechargeModal();
    setupWithdrawModal();
    setupWalletHistoryModal();
    setupPlayerStatsModal();

    const tournamentButton = document.getElementById('tournament-button');
    const logoutButton = document.getElementById('logout-button');
    if (tournamentButton) {
        tournamentButton.addEventListener('click', () => {
            window.location.href = 'tournament.html';
        });
    }
    if (logoutButton) {
        logoutButton.addEventListener('click', () => {
            localStorage.removeItem(CURRENT_USER_KEY);
            clearUrlState();
            window.location.href = 'login.html';
        });
    }

    const profile = await loadProfile();

document.getElementById("username").textContent = profile.username;
document.getElementById("wallet").textContent = profile.wallet_balance;
});
