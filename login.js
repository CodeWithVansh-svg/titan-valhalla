import {
    login,
    register,
    sendResetEmail
} from "./js/auth.js";

const REMEMBER_KEY = "remembered-login";

function showMessage(messageBox, message, type = "info") {

    if (!messageBox) return;

    messageBox.textContent = message;
    messageBox.className = `message ${type}`;

}

function saveRememberedLogin(email) {

    localStorage.setItem(
        REMEMBER_KEY,
        JSON.stringify({
            email
        })
    );

}

function clearRememberedLogin() {

    localStorage.removeItem(
        REMEMBER_KEY
    );

}

function loadRememberedLogin() {

    try {

        return JSON.parse(

            localStorage.getItem(
                REMEMBER_KEY
            )

        );

    }

    catch {

        return null;

    }

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
        document.getElementById(
            "remember-me"
        );

    if (remember)
        remember.checked = true;

}

// part 2

async function handleLogin(form, messageBox) {

    const email =
        form.email.value.trim();

    const password =
        form.password.value;

    const remember =
        document.getElementById(
            "remember-me"
        )?.checked;

    try {

        const data =
            await login(
                email,
                password
            );

        if (remember) {

            saveRememberedLogin(
                email
            );

        }

        else {

            clearRememberedLogin();

        }

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

async function handleRegister(
    form,
    messageBox
) {

    const username =
        form.username.value.trim();

    const email =
        form.email.value.trim();

    const password =
        form.password.value;

    const phone =
        form.phone?.value.trim() || "";

    const ffUid =
        form.ffUid?.value.trim() || "";

    try {

        await register({

            username,
            email,
            password,
            phone,
            ffUid

        });

        showMessage(

            messageBox,

            "Account created successfully!",

            "success"

        );

        setTimeout(() => {

            window.location.href =
                "login.html";

        }, 1000);

    }

    catch (error) {

        showMessage(

            messageBox,

            error.message,

            "error"

        );

    }

}

// part 3

async function handleForgotPassword(
    form,
    messageBox
) {

    const email =
        form.email.value.trim();

    try {

        await sendResetEmail(email);

        showMessage(

            messageBox,

            "Password reset email sent successfully.",

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

document.addEventListener(
    "DOMContentLoaded",
    () => {

        prefillRememberedLogin();

        const messageBox =
            document.getElementById(
                "message"
            );

        const loginForm =
            document.getElementById(
                "login-form"
            );

        const registerForm =
            document.getElementById(
                "register-form"
            );

        const forgotForm =
            document.getElementById(
                "forgot-password-form"
            );

        if (loginForm) {

            loginForm.addEventListener(
                "submit",
                async (e) => {

                    e.preventDefault();

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
                async (e) => {

                    e.preventDefault();

                    await handleRegister(

                        registerForm,

                        messageBox

                    );

                }

            );

        }

        if (forgotForm) {

            forgotForm.addEventListener(
                "submit",
                async (e) => {

                    e.preventDefault();

                    await handleForgotPassword(

                        forgotForm,

                        messageBox

                    );

                }

            );

        }

    }
);
