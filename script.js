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

/* ==========================================================
                RECHARGE HISTORY
========================================================== */

async function loadRechargeRequests() {

    if (!currentProfile)
        return;

    const { data, error } =
        await supabase
            .from("recharge_requests")
            .select("*")
            .eq("user_id", currentProfile.id)
            .order("created_at", {
                ascending: false
            });

    if (error) {

        console.error(error);

        return;

    }

    rechargeRequests =
        data || [];

    renderRechargeHistory();

}

function renderRechargeHistory() {

    const container =
        document.getElementById(
            "recharge-history"
        );

    if (!container)
        return;

    container.innerHTML = "";

    if (rechargeRequests.length === 0) {

        container.innerHTML =
            "<p>No Recharge Requests</p>";

        return;

    }

    rechargeRequests.forEach(request => {

        const div =
            document.createElement("div");

        div.className =
            "history-card";

        div.innerHTML = `

            <h4>₹${request.amount}</h4>

            <p>UTR :
            ${request.utr_number}</p>

            <p>Status :
            ${request.status}</p>

            <small>
            ${new Date(
                request.created_at
            ).toLocaleString()}
            </small>

        `;

        container.appendChild(div);

    });

}

/* ==========================================================
                WITHDRAW HISTORY
========================================================== */

async function loadWithdrawRequests() {

    if (!currentProfile)
        return;

    const { data, error } =
        await supabase
            .from("withdraw_requests")
            .select("*")
            .eq("user_id", currentProfile.id)
            .order("created_at", {
                ascending: false
            });

    if (error) {

        console.error(error);

        return;

    }

    withdrawRequests =
        data || [];

    renderWithdrawHistory();

}

function renderWithdrawHistory() {

    const container =
        document.getElementById(
            "withdraw-history"
        );

    if (!container)
        return;

    container.innerHTML = "";

    if (withdrawRequests.length === 0) {

        container.innerHTML =
            "<p>No Withdraw Requests</p>";

        return;

    }

    withdrawRequests.forEach(request => {

        const div =
            document.createElement("div");

        div.className =
            "history-card";

        div.innerHTML = `

            <h4>₹${request.amount}</h4>

            <p>
            ${request.upi_id}
            </p>

            <p>
            ${request.status}
            </p>

            <small>
            ${new Date(
                request.created_at
            ).toLocaleString()}
            </small>

        `;

        container.appendChild(div);

    });

}

/* ==========================================================
                REFRESH REQUESTS
========================================================== */

async function refreshRequests() {

    await loadRechargeRequests();

    await loadWithdrawRequests();

}

/* ==========================================================
                    ADMIN DASHBOARD
========================================================== */

let users = [];
let pendingRecharges = [];
let pendingWithdraws = [];

/* ==========================================================
                    LOAD ALL USERS
========================================================== */

async function loadUsers() {

    const { data, error } =
        await supabase
            .from("profiles")
            .select("*")
            .order("created_at", {
                ascending: false
            });

    if (error) {

        console.error(
            "Users Error:",
            error
        );

        return;

    }

    users = data || [];

    renderUsers();

}

/* ==========================================================
                    RENDER USERS
========================================================== */

function renderUsers() {

    const container =
        document.getElementById(
            "admin-users"
        );

    if (!container)
        return;

    container.innerHTML = "";

    users.forEach(user => {

        const div =
            document.createElement("div");

        div.className =
            "admin-user-card";

        div.innerHTML = `

            <h3>${user.username}</h3>

            <p>${user.email}</p>

            <p>Coins :
            ${user.coins}</p>

            <p>Win Coins :
            ${user.win_coins}</p>

            <p>Role :
            ${user.role}</p>

        `;

        container.appendChild(div);

    });

}

/* ==========================================================
            LOAD PENDING RECHARGES
========================================================== */

async function loadPendingRecharges() {

    const { data, error } =
        await supabase
            .from("recharge_requests")
            .select("*")
            .eq("status", "pending")
            .order("created_at", {
                ascending: false
            });

    if (error) {

        console.error(error);

        return;

    }

    pendingRecharges =
        data || [];

    renderPendingRecharges();

}

/* ==========================================================
        LOAD PENDING WITHDRAWS
========================================================== */

async function loadPendingWithdraws() {

    const { data, error } =
        await supabase
            .from("withdraw_requests")
            .select("*")
            .eq("status", "pending")
            .order("created_at", {
                ascending: false
            });

    if (error) {

        console.error(error);

        return;

    }

    pendingWithdraws =
        data || [];

    renderPendingWithdraws();

}
