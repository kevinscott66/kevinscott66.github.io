window.ScheduledOpening=(()=>{const c="/stickers/s8.webp",r=e=>String(e??"").replace(/[&<>"']/g,t=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"})[t]),d=e=>r(e).replace(/\r?\n/g,"<br>");function u({ready:e=!1,compact:t=!1,title:s="",hint:l=""}={}){var o;const a=((o=window.InviteOpening)==null?void 0:o.defaults("scheduled"))||{title:"Скоро ты увидишь кое-что особенное…",hint:"Оно откроется в назначенный момент"},i=e?"Время пришло!":s||a.title,n=e?"Приглашение уже можно открыть":l||a.hint;return`<section class="schedule-lock${t?" schedule-lock-compact":""}${e?" is-ready":""}" aria-live="polite">
      <div class="schedule-art"><div class="schedule-sticker" data-schedule-sticker aria-hidden="true"></div><span class="schedule-orbit" aria-hidden="true"></span></div>
      <div class="schedule-copy">
        <h2>${d(i)}</h2>
        <p>${d(n)}</p>
      </div>
      ${e?'<button type="button" class="schedule-open-button" data-schedule-open>Открыть приглашение 💌</button>':`<div class="schedule-digits" role="timer" aria-label="До открытия приглашения">
          <span><b data-schedule-unit="days">00</b><small>дней</small></span><i>:</i>
          <span><b data-schedule-unit="hours">00</b><small>часов</small></span><i>:</i>
          <span><b data-schedule-unit="minutes">00</b><small>минут</small></span><i>:</i>
          <span><b data-schedule-unit="seconds">00</b><small>секунд</small></span>
        </div>`}
      <p class="schedule-foot">invitik <span aria-hidden="true">💌</span></p>
    </section>`}function h(e,t={}){e.innerHTML=u(t);const s=e.querySelector("[data-schedule-sticker]");return s&&window.renderMedia(s,t.sticker||c),e.querySelector(".schedule-lock")}function p(e,t){if(!e)return;const s=Math.max(0,Number(t)||0),l={days:Math.floor(s/864e5),hours:Math.floor(s/36e5)%24,minutes:Math.floor(s/6e4)%60,seconds:Math.floor(s/1e3)%60};for(const[a,i]of Object.entries(l)){const n=e.querySelector(`[data-schedule-unit="${a}"]`);n&&(n.textContent=String(i).padStart(2,"0"))}}return{markup:u,mount:h,update:p,DEFAULT_STICKER:c}})();
