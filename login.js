import { supabase } from "./js/supabase.js";

/* ==========================================================
                    DOM ELEMENTS
========================================================== */

const ui = {};

function cacheDom() {

    ui.loginForm =
        document.getElementById("login-form");

    ui.registerForm =
        document.getElementById("register-form");

    ui.email =
        document.getElementById("email");

    ui.password =
        document.getElementById("password");

    ui.username =
        document.getElementById("username");

    ui.phone =
        document.getElementById("phone");

    ui.ffUid =
        document.getElementById("ff-uid");

    ui.message =
        document.getElementById("message");

}

/* ==========================================================
                    TOAST
========================================================== */

function showToast(message, type = "info") {

    console.log(`[${type}] ${message}`);

    if (ui.message) {

        ui.message.textContent = message;

        ui.message.className = type;

    }

}

/* ==========================================================
                    VALIDATION
========================================================== */

function validateEmail(email) {

    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

}

function validatePassword(password) {

    return password.length >= 6;

}

function validateRegisterForm() {

    const email =
        ui.email.value.trim();

    const password =
        ui.password.value;

    if (!validateEmail(email)) {

        showToast(
            "Invalid Email",
            "error"
        );

        return false;

    }

    if (!validatePassword(password)) {

        showToast(
            "Password should be at least 6 characters",
            "error"
        );

        return false;

    }

    return true;

}
/* ==========================================================
                    REGISTER
========================================================== */

async function registerUser() {

    if (!validateRegisterForm())
        return;

    const email =
        ui.email.value.trim().toLowerCase();

    const password =
        ui.password.value;

    const username =
        ui.username.value.trim();

    const phone =
        ui.phone?.value.trim() || "";

    const ffUid =
        ui.ffUid?.value.trim() || "";

    showToast("Creating account...");

    const { data, error } =
        await supabase.auth.signUp({

            email: email,

            password: password,

            options: {

                data: {

                    username: username

                }

            }

        });

    if (error) {

        showToast(
            error.message,
            "error"
        );

        return;

    }

    if (!data.user) {

        showToast(
            "Registration failed.",
            "error"
        );

        return;

    }

    const { error: profileError } =
        await supabase
            .from("profiles")
            .insert({

                id:
                    data.user.id,

                email:
                    email,

                username:
                    username,

                phone:
                    phone,

                ff_uid:
                    ffUid,

                role:
                    "user",

                coins:
                    0,

                win_coins:
                    0,

                matches_played:
                    0,

                matches_won:
                    0,

                is_banned:
                    false

            });

    if (profileError) {

        console.error(profileError);

        showToast(
            profileError.message,
            "error"
        );

        return;

    }

    showToast(
        "Registration successful! Verify your email before logging in.",
        "success"
    );

    if (ui.registerForm)
        ui.registerForm.reset();

}

/* ==========================================================
                    LOGIN
========================================================== */

async function loginUser() {

    const email =
        ui.email.value.trim().toLowerCase();

    const password =
        ui.password.value;

    if (!validateEmail(email)) {

        showToast(
            "Invalid Email",
            "error"
        );

        return;

    }

    if (!password) {

        showToast(
            "Enter Password",
            "error"
        );

        return;

    }

    showToast(
        "Signing in..."
    );

    const { data, error } =
        await supabase.auth.signInWithPassword({

            email,

            password

        });

    if (error) {

        showToast(
            error.message,
            "error"
        );

        return;

    }

    const user =
        data.user;

    if (!user) {

        showToast(
            "Login Failed",
            "error"
        );

        return;

    }

    const { data: profile, error: profileError } =
        await supabase
            .from("profiles")
            .select("*")
            .eq("id", user.id)
            .single();

    if (profileError) {

        showToast(
            profileError.message,
            "error"
        );

        return;

    }

    if (profile.is_banned) {

        await supabase.auth.signOut();

        showToast(
            "Your account has been banned.",
            "error"
        );

        return;

    }

    showToast(
        "Login Successful",
        "success"
    );

    if (profile.role === "admin") {

        window.location.href =
            "index.html?admin=true";

    } else {

        window.location.href =
            "index.html";

    }

}

/* ==========================================================
                AUTO LOGIN CHECK
========================================================== */

async function checkExistingSession() {

    const {
        data: {
            session
        }
    } =
        await supabase.auth.getSession();

    if (!session)
        return;

    window.location.href =
        "index.html";

}

/* ==========================================================
                FORGOT PASSWORD
========================================================== */

async function forgotPassword() {

    const email =
        ui.email.value.trim().toLowerCase();

    if (!validateEmail(email)) {

        showToast(
            "Enter a valid email.",
            "error"
        );

        return;

    }

    const { error } =
        await supabase.auth.resetPasswordForEmail(

            email,

            {

                redirectTo:
                    window.location.origin +
                    "/reset-password.html"

            }

        );

    if (error) {

        showToast(
            error.message,
            "error"
        );

        return;

    }

    showToast(
        "Password reset email sent.",
        "success"
    );

}

/* ==========================================================
                    LOGOUT
========================================================== */

async function logoutUser() {

    const { error } =
        await supabase.auth.signOut();

    if (error) {

        showToast(
            error.message,
            "error"
        );

        return;

    }

    window.location.href =
        "login.html";

}

/* ==========================================================
            AUTH STATE LISTENER
========================================================== */

supabase.auth.onAuthStateChange(

    async (

        event,

        session

    ) => {

        console.log(

            "Auth Event :",

            event

        );

        switch (event) {

            case "SIGNED_IN":

                console.log(

                    "User Logged In"

                );

                break;

            case "SIGNED_OUT":

                console.log(

                    "User Logged Out"

                );

                break;

            case "TOKEN_REFRESHED":

                console.log(

                    "Token Refreshed"

                );

                break;

            case "PASSWORD_RECOVERY":

                console.log(

                    "Password Recovery"

                );

                break;

        }

    }

);

/* ==========================================================
                SESSION REFRESH
========================================================== */

async function refreshSession() {

    await supabase.auth.refreshSession();

}

/* ==========================================================
                    EVENT LISTENERS
========================================================== */

function bindEvents() {

    if (ui.loginForm) {

        ui.loginForm.addEventListener(

            "submit",

            async function (e) {

                e.preventDefault();

                await loginUser();

            }

        );

    }

    if (ui.registerForm) {

        ui.registerForm.addEventListener(

            "submit",

            async function (e) {

                e.preventDefault();

                await registerUser();

            }

        );

    }

    const forgotButton =
        document.getElementById(
            "forgot-password"
        );

    if (forgotButton) {

        forgotButton.addEventListener(

            "click",

            forgotPassword

        );

    }

    const logoutButton =
        document.getElementById(
            "logout-button"
        );

    if (logoutButton) {

        logoutButton.addEventListener(

            "click",

            logoutUser

        );

    }

}

/* ==========================================================
                    INITIALIZE
========================================================== */

async function initialize() {

    cacheDom();

    bindEvents();

    await checkExistingSession();

}

/* ==========================================================
                    START APP
========================================================== */

document.addEventListener(

    "DOMContentLoaded",

    initialize

);
