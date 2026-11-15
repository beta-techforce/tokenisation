// TokenFlow Supabase Configuration
// Replace both values with credentials from your NEW TokenFlow Supabase project.
// Use the publishable key (or legacy anon key), NEVER the service_role secret.

const SUPABASE_URL = "YOUR_SUPABASE_PROJECT_URL";
const SUPABASE_ANON_KEY = "YOUR_SUPABASE_PUBLISHABLE_KEY";

const supabaseClient = window.supabase.createClient(
  SUPABASE_URL,
  SUPABASE_ANON_KEY
);
