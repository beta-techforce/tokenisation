// TokenFlow Supabase Configuration
// Replace both values with credentials from your NEW TokenFlow Supabase project.
// Use the publishable key (or legacy anon key), NEVER the service_role secret.

const SUPABASE_URL = "https://onwxnojouvwdtcbyghwa.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_lq3Qz0lATo1YRv83Xms9Lg_hItnAMAN";

const supabaseClient = window.supabase.createClient(
  SUPABASE_URL,
  SUPABASE_ANON_KEY
);
