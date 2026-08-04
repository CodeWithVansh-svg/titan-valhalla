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

                    username,
                    phone,
                    ff_uid: ffUid

                }

            }

        });

    if (error)
        throw error;

    const user = data.user;

    if (!user)
        throw new Error("Unable to create account.");

    const { error: profileError } =
        await supabase
            .from("profiles")
            .update({

                username,
                phone,
                ff_uid: ffUid

            })
            .eq("id", user.id);

    if (profileError)
        console.log(profileError);

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

    const session =
        await getSession();

    if (!session) {

        window.location.href =
            "login.html";

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
