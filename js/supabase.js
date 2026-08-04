const SUPABASE_URL = "https://zodcxxowdneqqbdiqwic.supabase.co";
const SUPABASE_ANON_KEY = "YOUR_PUBLISHABLE_KEY";

const supabase = window.supabase.createClient(
    SUPABASE_URL,
    SUPABASE_ANON_KEY
);