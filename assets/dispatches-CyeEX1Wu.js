(function(){const i=document.createElement("link").relList;if(i&&i.supports&&i.supports("modulepreload"))return;for(const e of document.querySelectorAll('link[rel="modulepreload"]'))r(e);new MutationObserver(e=>{for(const s of e)if(s.type==="childList")for(const n of s.addedNodes)n.tagName==="LINK"&&n.rel==="modulepreload"&&r(n)}).observe(document,{childList:!0,subtree:!0});function c(e){const s={};return e.integrity&&(s.integrity=e.integrity),e.referrerPolicy&&(s.referrerPolicy=e.referrerPolicy),e.crossOrigin==="use-credentials"?s.credentials="include":e.crossOrigin==="anonymous"?s.credentials="omit":s.credentials="same-origin",s}function r(e){if(e.ep)return;e.ep=!0;const s=c(e);fetch(e.href,s)}})();const o="https://api.finnslandzunge.com";async function l(){const t=document.getElementById("dispatches-teaser-list");if(t)try{const i=await fetch(`${o}/api/dispatches`);if(!i.ok)throw new Error;const c=await i.json();if(c.length===0){t.innerHTML='<p class="dispatches-empty">// NO DISPATCHES FILED.</p>';return}t.innerHTML=c.slice(0,3).map(r=>`
      <div class="dispatch-teaser">
        <div class="dispatch-teaser__date retro">${p(r.created_at)}</div>
        <h3 class="dispatch-teaser__title">${a(r.title)}</h3>
        <p class="dispatch-teaser__excerpt">${a(r.excerpt)}</p>
      </div>
    `).join("")}catch{t.innerHTML='<p class="dispatches-empty">// UPLINK FAILED.</p>'}}async function d(){const t=document.getElementById("dispatches-list");if(t)try{const i=await fetch(`${o}/api/dispatches`);if(!i.ok)throw new Error;const c=await i.json();if(c.length===0){t.innerHTML='<p class="dispatches-empty">// NO DISPATCHES FILED. STANDBY.</p>';return}t.innerHTML=c.map(r=>`
      <article class="dispatch">
        <div class="dispatch__date retro">${p(r.created_at)}</div>
        <h2 class="dispatch__title">${a(r.title)}</h2>
        <p class="dispatch__excerpt">${a(r.excerpt)}</p>
        <hr class="divider" />
      </article>
    `).join("")}catch{t.innerHTML='<p class="dispatches-empty">// UPLINK FAILED.</p>'}}function a(t){return String(t).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&#39;")}function p(t){return new Date(t).toLocaleDateString("en-GB",{day:"2-digit",month:"short",year:"numeric"})}export{d as a,l as i};
