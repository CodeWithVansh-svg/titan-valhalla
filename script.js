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

/* ==========================================================
                    WALLET
========================================================== */

async function loadWallet() {

    if (!currentProfile) return;

    const { data, error } =
        await supabase
            .from("profiles")
            .select("coins, win_coins")
            .eq("id", currentProfile.id)
            .single();

    if (error) {

        console.error("Wallet Error:", error);

        return;

    }

    walletBalance =
        Number(data.coins) || 0;

    winCoins =
        Number(data.win_coins) || 0;

    updateWalletUI();

}

function updateWalletUI() {

    if (ui.wallet)
        ui.wallet.textContent =
            walletBalance;

    if (ui.winWallet)
        ui.winWallet.textContent =
            winCoins;

}

/* ==========================================================
                WALLET TRANSACTIONS
========================================================== */

async function loadTransactions() {

    if (!currentProfile)
        return;

    const { data, error } =
        await supabase
            .from("wallet_transactions")
            .select("*")
            .eq("user_id", currentProfile.id)
            .order("created_at", {
                ascending: false
            });

    if (error) {

        console.error(
            "Transaction Error:",
            error
        );

        return;

    }

    walletTransactions =
        data || [];

    renderTransactions();

}

function renderTransactions() {

    const container =
        document.getElementById(
            "transaction-list"
        );

    if (!container)
        return;

    container.innerHTML = "";

    if (
        walletTransactions.length === 0
    ) {

        container.innerHTML =
            "<p>No Transactions Found</p>";

        return;

    }

    walletTransactions.forEach(tx => {

        const div =
            document.createElement("div");

        div.className =
            "transaction-item";

        div.innerHTML = `

            <div class="transaction-type">
                ${tx.transaction_type}
            </div>

            <div class="transaction-wallet">
                ${tx.wallet}
            </div>

            <div class="transaction-amount">
                ${tx.amount}
            </div>

            <div class="transaction-date">
                ${new Date(
                    tx.created_at
                ).toLocaleString()}
            </div>

        `;

        container.appendChild(div);

    });

}

/* ==========================================================
            REFRESH WALLET
========================================================== */

async function refreshWallet() {

    await loadWallet();

    await loadTransactions();

}

/* ==========================================================
                RECHARGE REQUEST
========================================================== */

async function submitRecharge(
    amount,
    utrNumber,
    screenshotUrl = ""
) {

    if (!currentProfile)
        return false;

    const { error } =
        await supabase
            .from("recharge_requests")
            .insert({

                user_id:
                    currentProfile.id,

                amount:
                    Number(amount),

                utr_number:
                    utrNumber,

                screenshot_url:
                    screenshotUrl,

                status:
                    "pending"

            });

    if (error) {

        console.error(error);

        showToast(
            error.message,
            "error"
        );

        return false;

    }

    showToast(
        "Recharge request submitted.",
        "success"
    );

    return true;

}

/* ==========================================================
                WITHDRAW REQUEST
========================================================== */

async function submitWithdraw(
    amount,
    upiId
) {

    if (!currentProfile)
        return false;

    if (
        Number(amount) >
        walletBalance
    ) {

        showToast(
            "Insufficient Coins",
            "error"
        );

        return false;

    }

    const { error } =
        await supabase
            .from("withdraw_requests")
            .insert({

                user_id:
                    currentProfile.id,

                amount:
                    Number(amount),

                upi_id:
                    upiId,

                status:
                    "pending"

            });

    if (error) {

        console.error(error);

        showToast(
            error.message,
            "error"
        );

        return false;

    }

    showToast(
        "Withdraw request submitted.",
        "success"
    );

    return true;

}

/* ==========================================================
            BUTTON EVENTS
========================================================== */

function bindRechargeButton() {

    const form =
        document.getElementById(
            "recharge-form"
        );

    if (!form)
        return;

    form.addEventListener(
        "submit",
        async function (e) {

            e.preventDefault();

            const amount =
                form.amount.value;

            const utr =
                form.utr.value;

            await submitRecharge(

                amount,

                utr

            );

        }

    );

}

function bindWithdrawButton() {

    const form =
        document.getElementById(
            "withdraw-form"
        );

    if (!form)
        return;

    form.addEventListener(
        "submit",
        async function (e) {

            e.preventDefault();

            const amount =
                form.amount.value;

            const upi =
                form.upi.value;

            await submitWithdraw(

                amount,

                upi

            );

        }

    );

}
