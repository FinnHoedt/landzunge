import"./style-CklJ_Ni7.js";const s="https://api.finnslandzunge.com";async function n(){const t=document.getElementById("dispatches-list");if(t)try{const i=await fetch(`${s}/api/dispatches`);if(!i.ok)throw new Error;const c=await i.json();if(c.length===0){t.innerHTML='<p class="dispatch-empty">// NO DISPATCHES FILED. STANDBY.</p>';return}t.innerHTML=c.map(e=>`
      <article class="dispatch-item">
        <time class="dispatch-item__date" datetime="${a(e.created_at)}">${r(e.created_at)}</time>
        <h2 class="dispatch-item__title">${a(e.title)}</h2>
        <p class="dispatch-item__excerpt">${a(e.excerpt)}</p>
        <hr class="dispatch-divider" />
      </article>
    `).join("")}catch{t.innerHTML='<p class="dispatch-empty">// UPLINK FAILED.</p>'}}function a(t){return String(t).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&#39;")}function r(t){return new Date(t).toLocaleDateString("en-GB",{day:"2-digit",month:"short",year:"numeric"})}n();
