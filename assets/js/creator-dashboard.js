(() => {
const $=id=>document.getElementById(id);let user=null,editing=null,apps=[];
const note=(t,k="")=>{$("notice").textContent=t;$("notice").className="notice "+k};
const esc=v=>String(v??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const slugify=v=>v.toLowerCase().trim().replace(/[^a-z0-9]+/g,"-").replace(/^-+|-+$/g,"").slice(0,48);
function reset(){editing=null;$("appForm").reset();$("tokenName").value="Tokens";$("tokenSymbol").value="TF";$("formTitle").textContent="Create a new app";$("saveBtn").textContent="Create app";$("cancelEdit").classList.add("hidden")}
async function load(){
$("appList").textContent="Loading apps…";
const {data,error}=await supabaseClient.from("tokenflow_apps").select("id,owner_id,name,slug,description,logo_url,token_name,token_symbol,allowed_origins,status,created_at").eq("owner_id",user.id).order("created_at",{ascending:false});
if(error){$("appList").textContent="Could not load apps: "+error.message;return}
apps=data||[];$("appCount").textContent=apps.length;$("activeCount").textContent=apps.filter(a=>a.status==="active").length;
if(!apps.length){$("appList").innerHTML='<div class="empty" style="grid-column:1/-1">No applications yet. Create your first app above.</div>';return}
$("appList").innerHTML=apps.map(a=>`<article class="app" data-id="${esc(a.id)}"><div class="row"><b>${esc(a.name)}</b><span class="pill">${esc(a.status)}</span></div><p>${esc(a.description||"No description")}</p><p><b>Slug:</b> ${esc(a.slug)}</p><p><b>Token:</b> ${esc(a.token_name)} (${esc(a.token_symbol)})</p><p class="muted small">${new Date(a.created_at).toLocaleDateString()}</p><div class="row"><button class="secondary" data-act="edit">Edit</button><button class="danger" data-act="delete">Delete</button></div></article>`).join("");
$("appList").querySelectorAll("[data-act]").forEach(b=>b.addEventListener("click",async()=>{
const a=apps.find(x=>x.id===b.closest("[data-id]").dataset.id);if(!a)return;
if(b.dataset.act==="edit"){editing=a.id;$("appName").value=a.name;$("appSlug").value=a.slug;$("tokenName").value=a.token_name;$("tokenSymbol").value=a.token_symbol;$("logoUrl").value=a.logo_url||"";$("origins").value=(a.allowed_origins||[]).join(", ");$("appDescription").value=a.description||"";$("formTitle").textContent="Edit application";$("saveBtn").textContent="Save changes";$("cancelEdit").classList.remove("hidden");$("formPanel").scrollIntoView({behavior:"smooth"});}
else if(confirm(`Delete "${a.name}"? This cannot be undone.`)){const r=await supabaseClient.from("tokenflow_apps").delete().eq("id",a.id).eq("owner_id",user.id);if(r.error)note("Delete failed: "+r.error.message,"error");else{note("Application deleted.","success");if(editing===a.id)reset();await load();}}
}));
}
async function save(e){e.preventDefault();const name=$("appName").value.trim(),slug=$("appSlug").value.trim().toLowerCase(),tn=$("tokenName").value.trim(),ts=$("tokenSymbol").value.trim(),logo=$("logoUrl").value.trim(),desc=$("appDescription").value.trim(),origins=$("origins").value.split(",").map(x=>x.trim()).filter(Boolean);
if(!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)){note("Slug must contain lowercase letters, numbers and hyphens only.","error");return}
for(const o of origins){try{const u=new URL(o);if(!["http:","https:"].includes(u.protocol)||u.origin!==o.replace(/\/$/,""))throw 0}catch{note("Invalid origin. Use https://example.com without a page path.","error");return}}
const payload={name,slug,token_name:tn,token_symbol:ts,logo_url:logo||null,description:desc||null,allowed_origins:origins};
const btn=$("saveBtn");btn.disabled=true;btn.textContent="Saving…";
try{const r=editing?await supabaseClient.from("tokenflow_apps").update(payload).eq("id",editing).eq("owner_id",user.id).select("id").single():await supabaseClient.from("tokenflow_apps").insert({...payload,owner_id:user.id}).select("id").single();
if(r.error)throw r.error;note(editing?"Application updated.":"Application created.","success");reset();await load();
}catch(err){note(err.code==="23505"?"You already use this slug. Choose another.":err.message||"Could not save app.","error")}
finally{btn.disabled=false;btn.textContent=editing?"Save changes":"Create app"}
}
async function start(){try{
if(typeof supabaseClient==="undefined")throw Error("Supabase client missing. Check assets/js/config.js.");
const s=await supabaseClient.auth.getSession();if(s.error)throw s.error;if(!s.data.session){location.href="login.html";return}user=s.data.session.user;
const p=await supabaseClient.from("tokenflow_profiles").select("account_tier").eq("user_id",user.id).single();if(p.error)throw p.error;
$("loading").classList.add("hidden");if(p.data.account_tier!=="advanced"){$("locked").classList.remove("hidden");return}
$("creatorArea").classList.remove("hidden");await load();
}catch(e){$("loading").textContent="Could not open Creator Dashboard: "+(e.message||"Unknown error")}}
$("appName").addEventListener("input",()=>{if(!editing)$("appSlug").value=slugify($("appName").value)});
$("appForm").addEventListener("submit",save);$("cancelEdit").addEventListener("click",reset);$("refreshBtn").addEventListener("click",load);
$("logoutBtn").addEventListener("click",async()=>{const r=await supabaseClient.auth.signOut();if(r.error)note(r.error.message,"error");else location.href="login.html"});start();
})();