import {
    requireAuth,
    loadProfile,
    logout
} from "./js/auth.js";

import {
    supabase
} from "./js/supabase.js";

/* ==========================================================
                    GLOBAL STATE
========================================================== */

let currentUser = null;
let currentProfile = null;

let walletBalance = 0;

let rechargeRequests = [];

let withdrawRequests = [];

let tournaments = [];

let participants = [];

let walletTransactions = [];

const ui = {};

/* ==========================================================
                    CACHE DOM
========================================================== */

function cacheDom() {

    ui.userPanel =
        document.getElementById("user-panel");

    ui.adminPanel =
        document.getElementById("admin-panel");

    ui.username =
        document.getElementById("username");

    ui.email =
        document.getElementById("email");

    ui.wallet =
        document.getElementById("wallet");

    ui.logoutButton =
        document.getElementById("logout-button");

}

/* ==========================================================
                SHOW MESSAGE
========================================================== */

function showToast(message) {

    console.log(message);

}

/* ==========================================================
                AUTH CHECK
========================================================== */

async function checkAuthentication() {

    const ok =
        await requireAuth();

    if (!ok) {

        window.location.href =
            "login.html";

        return false;

    }

    return true;

}

/* ==========================================================
                LOAD PROFILE
========================================================== */

async function loadCurrentProfile() {

    currentProfile =
        await loadProfile();

    if (!currentProfile)
        return;

    currentUser = currentProfile;

    walletBalance =
        currentProfile.wallet_balance || 0;

    updateProfileUI();

}

/* ==========================================================
                UPDATE PROFILE UI
========================================================== */

function updateProfileUI() {

    if (!currentProfile)
        return;

    if (ui.username)
        ui.username.textContent =
            currentProfile.username;

    if (ui.email)
        ui.email.textContent =
            currentProfile.email;

    if (ui.wallet)
        ui.wallet.textContent =
            walletBalance;

}

/* ==========================================================
                PANEL CONTROL
========================================================== */

function showUserPanel() {

    if (ui.userPanel)
        ui.userPanel.classList.remove("hidden");

    if (ui.adminPanel)
        ui.adminPanel.classList.add("hidden");

}

function showAdminPanel() {

    if (ui.adminPanel)
        ui.adminPanel.classList.remove("hidden");

    if (ui.userPanel)
        ui.userPanel.classList.add("hidden");

}

/* ==========================================================
                ROLE CHECK
========================================================== */

function isAdmin() {

    return currentProfile?.role === "admin";

}
