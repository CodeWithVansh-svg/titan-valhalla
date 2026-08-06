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
let winCoins = 0;

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

    ui.winWallet =
        document.getElementById("win-wallet");

    ui.logoutButton =
        document.getElementById("logout-button");

}

/* ==========================================================
                        TOAST
========================================================== */

function showToast(message, type = "info") {

    console.log(`[${type}] ${message}`);

}

/* ==========================================================
                    AUTH CHECK
========================================================== */

async function checkAuthentication() {

    const authenticated =
        await requireAuth();

    if (!authenticated) {

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

    if (!currentProfile) {

        window.location.href =
            "login.html";

        return;

    }

    currentUser = currentProfile;

    walletBalance =
        Number(currentProfile.coins) || 0;

    winCoins =
        Number(currentProfile.win_coins) || 0;

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
            currentProfile.username || "";

    if (ui.email)
        ui.email.textContent =
            currentProfile.email || "";

    if (ui.wallet)
        ui.wallet.textContent =
            walletBalance;

    if (ui.winWallet)
        ui.winWallet.textContent =
            winCoins;

}

/* ==========================================================
                    PANEL CONTROL
========================================================== */

function showUserPanel() {

    ui.userPanel?.classList.remove("hidden");

    ui.adminPanel?.classList.add("hidden");

}

function showAdminPanel() {

    ui.adminPanel?.classList.remove("hidden");

    ui.userPanel?.classList.add("hidden");

}

/* ==========================================================
                    ROLE CHECK
========================================================== */

function isAdmin() {

    return (
        currentProfile?.role === "admin" ||
        currentProfile?.role_name === "admin"
    );

}
