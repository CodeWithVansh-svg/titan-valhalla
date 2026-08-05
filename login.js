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
