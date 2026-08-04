import {
    login,
    register,
    sendResetEmail,
    requireAuth
} from "./js/auth.js";

const CURRENT_USER_KEY = "logged-in-user";
const REMEMBER_KEY = "remembered-login";

/* ==========================
   MESSAGE
========================== */

function showMessage(element, message, type = "info") {

    if (!element) return;

    element.textContent = message;
    element.className = `message ${type}`;

}

/* ==========================
   REMEMBER ME
========================== */

function saveRememberedLogin(email) {

    localStorage.setItem(
        REMEMBER_KEY,
        JSON.stringify({ email })
    );

}

function loadRememberedLogin() {

    try {

        return JSON.parse(
            localStorage.getItem(REMEMBER_KEY)
        );

    } catch {

        return null;

    }

}

function clearRememberedLogin() {

    localStorage.removeItem(
        REMEMBER_KEY
    );

}

function prefillRememberedLogin() {

    const form =
        document.getElementById("login-form");

    if (!form) return;

    const remembered =
        loadRememberedLogin();

    if (!remembered) return;

    form.email.value =
        remembered.email || "";

    const remember =
        document.getElementById("remember-me");

    if (remember)
        remember.checked = true;

}

/* ==========================
   LOGIN
========================== */

async function handleLogin(form, messageBox) {

    const email =
        form.email.value.trim();

    const password =
        form.password.value;

    const remember =
        document.getElementById("remember-me")
        ?.checked;

    try {

        const data =
            await login(email, password);

        localStorage.setItem(
            CURRENT_USER_KEY,
            JSON.stringify({

                id: data.user.id,
                email: data.user.email

            })
        );

        if (remember)
            saveRememberedLogin(email);

        else
            clearRememberedLogin();

        showMessage(
            messageBox,
            "Login Successful!",
            "success"
        );

        setTimeout(() => {

            window.location.href =
                "index.html";

        }, 700);

    }

    catch (error) {

        showMessage(

            messageBox,

            error.message,

            "error"

        );

    }

}

/* ==========================
   REGISTER
========================== */

async function handleRegister(
    form,
    messageBox
) {

    const username =
        form.username.value.trim();

    const email =
        form.email.value.trim();

    const phone =
        form.phone.value.trim();

    const ffUid =
        form.ffUid.value.trim();

    const password =
        form.password.value;

    try {

        await register(

            email,
            password,
            username,
            phone,
            ffUid

        );

        showMessage(

            messageBox,

            "Account created successfully. Please verify your email.",

            "success"

        );

        form.reset();

    }

    catch (error) {

        showMessage(

            messageBox,

            error.message,

            "error"

        );

    }

}
/* ==========================
   FORGOT PASSWORD
========================== */

async function handleForgotPassword(form, messageBox) {

    const email = form.email.value.trim();

    try {

        await sendResetEmail(email);

        showMessage(
            messageBox,
            "Password reset email sent successfully.",
            "success"
        );

        form.reset();

    } catch (error) {

        showMessage(
            messageBox,
            error.message,
            "error"
        );

    }

}

/* ==========================
   FORM HANDLERS
========================== */

function attachFormHandlers() {

    const loginForm =
        document.getElementById("login-form");

    const registerForm =
        document.getElementById("register-form");

    const forgotPasswordForm =
        document.getElementById("forgot-password-form");

    const messageBox =
        document.getElementById("message");

    if (loginForm) {

        loginForm.addEventListener(
            "submit",
            async (event) => {

                event.preventDefault();

                await handleLogin(
                    loginForm,
                    messageBox
                );

            }
        );

    }

    if (registerForm) {

        registerForm.addEventListener(
            "submit",
            async (event) => {

                event.preventDefault();

                await handleRegister(
                    registerForm,
                    messageBox
                );

            }
        );

    }

    if (forgotPasswordForm) {

        forgotPasswordForm.addEventListener(
            "submit",
            async (event) => {

                event.preventDefault();

                await handleForgotPassword(
                    forgotPasswordForm,
                    messageBox
                );

            }
        );

    }

}

/* ==========================
   SESSION CHECK
========================== */

async function checkSession() {

    try {

        const loggedIn =
            await requireAuth();

        if (
            loggedIn &&
            window.location.pathname
                .includes("login.html")
        ) {

            window.location.href =
                "index.html";

        }

    } catch (error) {

        console.log(error);

    }

}

/* ==========================
   START
========================== */

document.addEventListener("DOMContentLoaded", () => {

    prefillRememberedLogin();

    attachFormHandlers();

    // Login page par auth check mat karo.
    // Sirf protected pages par requireAuth() use karo.

});
