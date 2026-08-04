// js/supabase.js

import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm";

const SUPABASE_URL = "https://zodcxxowdneqqbdiqwic.supabase.co";

const SUPABASE_ANON_KEY = "sb_publishable_bnlfWGCM0Kz-zOwLJdRU0w_tAswB4jc";

export const supabase = createClient(
    SUPABASE_URL,
    SUPABASE_ANON_KEY,
    {
        auth: {
            persistSession: true,
            autoRefreshToken: true,
            detectSessionInUrl: true,
            flowType: "pkce"
        }
    }
);
