/* TokenFlow Stage 3 — Access Management
   Uses the existing Stage 2 supabaseClient from assets/js/config.js.
*/
(() => {
  const $ = (id) => document.getElementById(id);
  const messageBox = $("message");
  const showMessage = (text, type = "") => {
    messageBox.textContent = text;
    messageBox.className = "notice" + (type ? " " + type : "");
  };
  const hideMessage = () => { messageBox.className = "notice hidden"; };
  const setBusy = (button, busy, label) => {
    button.disabled = busy;
    if (busy) {
      button.dataset.oldLabel = button.textContent;
      button.textContent = label || "Please wait…";
    } else if (button.dataset.oldLabel) {
      button.textContent = button.dataset.oldLabel;
      delete button.dataset.oldLabel;
    }
  };
  const escapeHtml = (value) => String(value ?? "").replace(/[&<>"']/g, (c) => ({
    "&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;", "'":"&#39;"
  }[c]));

  async function callFunction(body) {
    const { data, error } = await supabaseClient.functions.invoke(
      "tokenflow-access-requests", { body }
    );
    if (error) {
      let detail = error.message || "Function request failed";
      if (data && data.error) detail = data.error;
      throw new Error(detail);
    }
    if (data && data.error) throw new Error(data.error);
    return data;
  }

  function statusBadge(status) {
    const s = String(status || "unknown").toLowerCase();
    return `<span class="status ${escapeHtml(s)}">${escapeHtml(s)}</span>`;
  }

  async function loadOwnRequests(userId) {
    const target = $("ownRequestList");
    const { data, error } = await supabaseClient
      .from("tokenflow_access_requests")
      .select("id,status,message,created_at,reviewed_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });
    if (error) {
      target.textContent = "Could not load request history: " + error.message;
      return;
    }
    if (!data || !data.length) {
      target.textContent = "You have not submitted an access request yet.";
      return;
    }
    target.innerHTML = data.map((r) => `
      <article class="item">
        <div class="row" style="justify-content:space-between">
          ${statusBadge(r.status)}
          <span class="muted small">${new Date(r.created_at).toLocaleString()}</span>
        </div>
        ${r.message ? `<p>${escapeHtml(r.message)}</p>` : ""}
      </article>`).join("");
  }

  async function loadAdminRequests() {
    const target = $("adminRequestList");
    target.textContent = "Loading…";
    try {
      const result = await callFunction({ action: "list" });
      const requests = result.requests || [];
      if (!requests.length) {
        target.innerHTML = '<p class="muted">There are no pending requests.</p>';
        return;
      }
      target.innerHTML = requests.map((r) => `
        <article class="item" data-request-id="${escapeHtml(r.id)}">
          <div class="row" style="justify-content:space-between">
            <strong>Access request</strong>
            <span class="muted small">${new Date(r.created_at).toLocaleString()}</span>
          </div>
          <p><strong>User ID:</strong> ${escapeHtml(r.user_id)}</p>
          <p>${r.message ? escapeHtml(r.message) : '<span class="muted">No message provided.</span>'}</p>
          <div class="row">
            <button class="approve" data-decision="approved" type="button">Approve</button>
            <button class="reject" data-decision="rejected" type="button">Reject</button>
          </div>
        </article>`).join("");
      target.querySelectorAll("button[data-decision]").forEach((button) => {
        button.addEventListener("click", async () => {
          const card = button.closest("[data-request-id]");
          const requestId = card.dataset.requestId;
          const decision = button.dataset.decision;
          if (!confirm(`Are you sure you want to ${decision} this request?`)) return;
          const buttons = card.querySelectorAll("button");
          buttons.forEach((b) => b.disabled = true);
          try {
            await callFunction({ action: "review", request_id: requestId, decision });
            showMessage(`Request ${decision} successfully.`, "success");
            await loadAdminRequests();
          } catch (err) {
            buttons.forEach((b) => b.disabled = false);
            showMessage(err.message, "error");
          }
        });
      });
    } catch (err) {
      target.textContent = "Could not load requests: " + err.message;
    }
  }

  async function start() {
    try {
      if (typeof supabaseClient === "undefined") {
        throw new Error("Supabase client not found. Check assets/js/config.js and its project keys.");
      }
      const { data: sessionData, error: sessionError } = await supabaseClient.auth.getSession();
      if (sessionError) throw sessionError;
      const session = sessionData.session;
      if (!session) {
        window.location.href = "login.html";
        return;
      }

      const { data: profile, error: profileError } = await supabaseClient
        .from("tokenflow_profiles")
        .select("email,display_name,account_tier,is_platform_admin")
        .eq("user_id", session.user.id)
        .single();
      if (profileError) throw profileError;

      $("loading").classList.add("hidden");
      $("userPanel").classList.remove("hidden");
      $("tierBadge").textContent = profile.account_tier || "regular";
      $("userIntro").textContent = `Signed in as ${profile.display_name || profile.email || session.user.email}.`;

      if (profile.account_tier === "advanced" || profile.is_platform_admin) {
        $("requestForm").innerHTML = '<div class="notice success">Your account already has the required platform access. You do not need to request Advanced access.</div>';
      }

      await loadOwnRequests(session.user.id);

      if (profile.is_platform_admin) {
        $("adminPanel").classList.remove("hidden");
        await loadAdminRequests();
      }
    } catch (err) {
      $("loading").textContent = "Could not load Access Management: " + (err.message || "Unknown error");
      showMessage("Check that Stage 2 config.js is correctly uploaded and your session is active.", "error");
    }
  }

  $("submitRequest").addEventListener("click", async () => {
    hideMessage();
    const button = $("submitRequest");
    setBusy(button, true, "Submitting…");
    try {
      const message = $("requestMessage").value.trim();
      await callFunction({ action: "submit", message });
      $("requestMessage").value = "";
      showMessage("Your Advanced access request was submitted.", "success");
      const { data } = await supabaseClient.auth.getUser();
      if (data.user) await loadOwnRequests(data.user.id);
    } catch (err) {
      showMessage(err.message, "error");
    } finally {
      setBusy(button, false);
    }
  });

  $("refreshBtn").addEventListener("click", loadAdminRequests);
  $("logoutBtn").addEventListener("click", async () => {
    const { error } = await supabaseClient.auth.signOut();
    if (error) showMessage(error.message, "error");
    else window.location.href = "login.html";
  });

  start();
})();
