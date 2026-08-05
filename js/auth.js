import { supabase } from "./supabase.js";

/* ============================
   REGISTER
============================ */

export async function register(
    email,
    password,
    username,
    phone,
    ffUid
) {

    const { data, error } =
        await supabase.auth.signUp({

            email,
            password,

            options: {
                data: {
                    username
                }
            }

        });

    if (error) throw error;

    if (!data.user)
        throw new Error("Signup failed.");

    const { error: profileError } =
        await supabase
            .from("profiles")
            .upsert({

                id: data.user.id,

                username: username,

                phone: phone,

                ff_uid: ffUid,

                wallet_balance: 0,

                winnings: 0,

                total_matches: 0,

                created_at:
                    new Date().toISOString()

            });

    if (profileError)
        throw profileError;

    return data;

}

/* ============================
   LOGIN
============================ */

export async function login(
    email,
    password
) {

    const { data, error } =
        await supabase.auth.signInWithPassword({

            email,
            password

        });

    if (error)
        throw error;

    return data;

}

/* ============================
   LOGOUT
============================ */

export async function logout() {

    const { error } =
        await supabase.auth.signOut();

    if (error)
        throw error;

    window.location.href =
        "login.html";

}

/* ============================
   GET USER
============================ */

export async function getCurrentUser() {

    const { data } =
        await supabase.auth.getUser();

    return data.user;

}

/* ============================
   GET SESSION
============================ */

export async function getSession() {

    const { data } =
        await supabase.auth.getSession();

    return data.session;

}

/* ============================
   REQUIRE LOGIN
============================ */

export async function requireAuth() {

    const { data, error } = await supabase.auth.getSession();

    console.log("SESSION:", data.session);

    if (!data.session) {

        window.location.href = "login.html";
        return false;

    }

    return true;
}

/* ============================
   RESET PASSWORD
============================ */

export async function sendResetEmail(
    email
) {

    const { error } =
        await supabase.auth.resetPasswordForEmail(

            email,

            {

                redirectTo:

                window.location.origin +
                "/reset-password.html"

            }

        );

    if (error)
        throw error;

}

/* ============================
   CHANGE PASSWORD
============================ */

export async function updatePassword(
    password
) {

    const { error } =
        await supabase.auth.updateUser({

            password

        });

    if (error)
        throw error;

}

/* ============================
   UPDATE PROFILE
============================ */

export async function updateProfile(
    values
) {

    const user =
        await getCurrentUser();

    if (!user)
        return;

    const { error } =
        await supabase
            .from("profiles")
            .update(values)
            .eq("id", user.id);

    if (error)
        throw error;

}

/* ============================
   GET PROFILE
============================ */

export async function getProfile() {

    const user =
        await getCurrentUser();

    if (!user)
        return null;

    const { data, error } =
        await supabase
            .from("profiles")
            .select("*")
            .eq("id", user.id)
            .single();

    if (error)
        throw error;

    return data;

}

/* ============================
   AUTH LISTENER
============================ */

supabase.auth.onAuthStateChange(
    (event, session) => {

        console.log("AUTH:", event);

        console.log(session);

    }
);

export async function loadProfile() {

    const user =
        await getCurrentUser();

    if (!user)
        return null;

    const { data, error } =
        await supabase
            .from("profiles")
            .select("*")
            .eq("id", user.id)
            .single();

    if (error)
        throw error;

    return data;

}
