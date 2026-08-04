// js/auth.js

import { supabase } from "./supabase.js";

/* ==========================
   REGISTER
========================== */

export async function register(email, password, username) {
    const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
            data: {
                username: username
            }
        }
    });

    if (error) throw error;

    return data;
}

/* ==========================
   LOGIN
========================== */

export async function login(email, password) {

    const { data, error } =
        await supabase.auth.signInWithPassword({
            email,
            password
        });

    if (error) throw error;

    return data;
}

/* ==========================
   LOGOUT
========================== */

export async function logout() {

    const { error } =
        await supabase.auth.signOut();

    if (error) throw error;

    window.location.href = "login.html";

}

/* ==========================
   CURRENT USER
========================== */

export async function getCurrentUser() {

    const { data, error } =
        await supabase.auth.getUser();

    if (error) return null;

    return data.user;

}

/* ==========================
   SESSION
========================== */

export async function getSession() {

    const { data, error } =
        await supabase.auth.getSession();

    if (error) return null;

    return data.session;

}

/* ==========================
   CHECK LOGIN
========================== */

export async function requireAuth() {

    const session =
        await getSession();

    if (!session) {

        window.location.href = "login.html";

        return false;
    }

    return true;

}

/* ==========================
   RESET PASSWORD
========================== */

export async function resetPassword(email) {

    const { error } =
        await supabase.auth.resetPasswordForEmail(email, {

            redirectTo:
            window.location.origin +
            "/reset-password.html"

        });

    if (error) throw error;

}

/* ==========================
   UPDATE PROFILE
========================== */

export async function updateProfile(values) {

    const { error } =
        await supabase.auth.updateUser(values);

    if (error) throw error;

}

/* ==========================
   LISTENER
========================== */

supabase.auth.onAuthStateChange(
    (event, session) => {

        console.log("Auth Event :", event);

        console.log(session);

    }
);
