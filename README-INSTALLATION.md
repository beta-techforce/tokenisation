# TokenFlow Stage 2 — Authentication starter

## Included
- Email/password registration
- Email/password login
- Email verification landing page
- Google OAuth button (requires provider configuration)
- Protected starter dashboard
- Logout

## Setup
1. Open `assets/js/config.js`.
2. Replace `YOUR_SUPABASE_PROJECT_URL` with the Project URL from the NEW TokenFlow Supabase project.
3. Replace `YOUR_SUPABASE_PUBLISHABLE_KEY` with that project's publishable key (or legacy anon key).
4. Never place the `service_role` secret key in frontend code or GitHub.
5. In Supabase Authentication URL Configuration, set the deployed website as Site URL and add the deployed `verify-email.html` and `index.html` URLs to Redirect URLs.
6. Configure Google OAuth in Supabase before using the Google login button.

## Important
This is the Stage 2 authentication starter only. Do not upload it over or mix it into PageForge. The dashboard is a basic authentication test page, not the final TokenFlow dashboard.
