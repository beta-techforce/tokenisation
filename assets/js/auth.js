// TokenFlow Authentication
(async function () {
  const message = (text, type = "info") => {
    const box = document.getElementById("message");
    if (!box) return;
    box.textContent = text;
    box.className = "message " + type;
  };

  const redirectUrl = (page) =>
    new URL(page, window.location.href).href;

  // Registration
  const registerForm = document.getElementById("registerForm");
  if (registerForm) {
    registerForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const name = document.getElementById("name").value.trim();
      const email = document.getElementById("email").value.trim();
      const password = document.getElementById("password").value;

      if (password.length < 8) {
        return message("Password must be at least 8 characters.", "error");
      }

      message("Creating account...");
      const { data, error } = await supabaseClient.auth.signUp({
        email,
        password,
        options: {
          data: { full_name: name },
          emailRedirectTo: redirectUrl("verify-email.html")
        }
      });

      if (error) return message(error.message, "error");

      if (data.session) {
        window.location.href = "index.html";
      } else {
        message("Account created! Check your email and click the verification link.", "success");
      }
    });
  }

  // Login
  const loginForm = document.getElementById("loginForm");
  if (loginForm) {
    loginForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const email = document.getElementById("email").value.trim();
      const password = document.getElementById("password").value;

      message("Signing in...");
      const { error } = await supabaseClient.auth.signInWithPassword({
        email,
        password
      });

      if (error) return message(error.message, "error");
      window.location.href = "index.html";
    });
  }

  // Google login button: requires Google OAuth setup in Supabase first.
  const googleButton = document.getElementById("googleLogin");
  if (googleButton) {
    googleButton.addEventListener("click", async () => {
      message("Connecting to Google...");
      const { error } = await supabaseClient.auth.signInWithOAuth({
        provider: "google",
        options: { redirectTo: redirectUrl("index.html") }
      });
      if (error) message(error.message, "error");
    });
  }

  // Protect dashboard
  const dashboard = document.getElementById("dashboard");
  if (dashboard) {
    const { data: { session }, error } =
      await supabaseClient.auth.getSession();

    if (error || !session) {
      window.location.replace("login.html");
      return;
    }

    const emailElement = document.getElementById("userEmail");
    if (emailElement) emailElement.textContent = session.user.email || "No email";
  }

  // Logout
  const logoutButton = document.getElementById("logout");
  if (logoutButton) {
    logoutButton.addEventListener("click", async () => {
      const { error } = await supabaseClient.auth.signOut();
      if (error) return message(error.message, "error");
      window.location.href = "login.html";
    });
  }

  // Verification landing page
  if (window.location.pathname.endsWith("verify-email.html")) {
    const { data: { session } } =
      await supabaseClient.auth.getSession();

    if (session) {
      message("Email verified! You can now continue to TokenFlow.", "success");
    } else {
      message("Check your email and open the verification link. If you already verified, try signing in.", "info");
    }
  }
})();
