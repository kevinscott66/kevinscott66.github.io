(function(){const t=document.createElement("link").relList;if(t&&t.supports&&t.supports("modulepreload"))return;for(const n of document.querySelectorAll('link[rel="modulepreload"]'))o(n);new MutationObserver(n=>{for(const s of n)if(s.type==="childList")for(const i of s.addedNodes)i.tagName==="LINK"&&i.rel==="modulepreload"&&o(i)}).observe(document,{childList:!0,subtree:!0});function a(n){const s={};return n.integrity&&(s.integrity=n.integrity),n.referrerPolicy&&(s.referrerPolicy=n.referrerPolicy),n.crossOrigin==="use-credentials"?s.credentials="include":n.crossOrigin==="anonymous"?s.credentials="omit":s.credentials="same-origin",s}function o(n){if(n.ep)return;n.ep=!0;const s=a(n);fetch(n.href,s)}})();const G="modulepreload",Y=function(e){return"/invitik/"+e},H={},g=function(t,a,o){let n=Promise.resolve();if(a&&a.length>0){let i=function(c){return Promise.all(c.map(m=>Promise.resolve(m).then(h=>({status:"fulfilled",value:h}),h=>({status:"rejected",reason:h}))))};document.getElementsByTagName("link");const r=document.querySelector("meta[property=csp-nonce]"),l=(r==null?void 0:r.nonce)||(r==null?void 0:r.getAttribute("nonce"));n=i(a.map(c=>{if(c=Y(c),c in H)return;H[c]=!0;const m=c.endsWith(".css"),h=m?'[rel="stylesheet"]':"";if(document.querySelector(`link[href="${c}"]${h}`))return;const v=document.createElement("link");if(v.rel=m?"stylesheet":G,m||(v.as="script"),v.crossOrigin="",v.href=c,l&&v.setAttribute("nonce",l),document.head.appendChild(v),m)return new Promise((w,k)=>{v.addEventListener("load",w),v.addEventListener("error",()=>k(new Error(`Unable to preload CSS for ${c}`)))})}))}function s(i){const r=new Event("vite:preloadError",{cancelable:!0});if(r.payload=i,window.dispatchEvent(r),!r.defaultPrevented)throw i}return n.then(i=>{for(const r of i||[])r.status==="rejected"&&s(r.reason);return t().catch(s)})},C="/invitik/";function _(e,t=C){return typeof e!="string"||!e.startsWith("/")||e.startsWith("//")||t==="/"||e.startsWith(t)?e:t+e.slice(1)}function Z(e,t,a=C){return`${e}${a}#invite=${t}`}const J="/invitik/api",R="invitik-owned-v1";function z(){const e=crypto.getRandomValues(new Uint8Array(32));return btoa(String.fromCharCode(...e)).replaceAll("+","-").replaceAll("/","_").replaceAll("=","")}async function D(e,{auth:t,body:a}={}){const o=await fetch(J+e,{signal:AbortSignal.timeout(15e3),method:a?"POST":"GET",headers:{...t?{Authorization:"Bearer "+t}:{},...a?{"Content-Type":"application/json"}:{}},...a?{body:JSON.stringify(a)}:{}});let n;try{n=await o.json()}catch{throw new Error("Сервис ответов недоступен. Попробуйте ещё раз.")}if(!o.ok)throw new Error(n.error||"Не удалось сохранить ответ");return n}function q(){try{return JSON.parse(localStorage.getItem(R)||"[]")}catch{return[]}}function F(e,t){return`${location.origin}${C}#results=${e}.${t}`}async function K(e){const t=crypto.randomUUID(),a=z(),o=z(),n={id:t,ownerToken:a,title:e.question,createdAt:new Date().toISOString()},s=q();await D("/invitations",{body:{id:t,ownerToken:a,submitToken:o,title:e.question,activities:e.activities.map(i=>i.name).filter(i=>i.trim())}});try{localStorage.setItem(R,JSON.stringify([n,...s].slice(0,100)))}catch{}return{tracking:{id:t,submitToken:o},ownerUrl:F(t,a)}}function Q(e,t){try{localStorage.setItem(R,JSON.stringify(q().map(a=>a.id===e?{...a,href:t}:a)))}catch{}}function X(e){const t=q();if(!t.length)return;const a=document.createElement("section");a.className="owner-library";const o=document.createElement("h2");o.textContent="Мои приглашения",a.append(o);for(const n of t){const s=document.createElement("a");s.className="btn ghost",s.href=n.href||F(n.id,n.ownerToken),s.textContent=n.title||"Посмотреть ответы",a.append(s)}e.append(a)}function ee(){const e=location.hash.slice(9).split(".");document.title="Ответы гостей";const t=document.createElement("main");t.className="wrap results-page",t.innerHTML='<section class="card panel"><h1>Ответы гостей</h1><p class="results-title"></p><p>Это личная ссылка автора. Не отправляйте её гостям.</p><button class="btn" id="refreshResults">Обновить ответы</button><p role="status" id="resultsStatus"></p><div id="resultsList"></div><a class="btn ghost" id="backToEditor">К редактору</a></section>',document.getElementById("app").replaceChildren(t),t.querySelector("#backToEditor").href=C;const a=async()=>{const o=t.querySelector("#resultsStatus"),n=t.querySelector("#resultsList"),s=t.querySelector("#refreshResults");s.disabled=!0,o.textContent="Загружаем ответы…";try{const i=await D(`/invitations/${e[0]}/responses`,{auth:e[1]});t.querySelector(".results-title").textContent=i.title,n.replaceChildren(),o.textContent=i.responses.length?`Ответов: ${i.responses.length}`:"Пока никто не ответил. Отправьте гостю ссылку на приглашение.";for(const r of i.responses){const l=document.createElement("article");l.className="response-card";const c=document.createElement("h2");c.textContent=r.name||"Гость";const m=document.createElement("p");m.textContent=`Согласие: да · ${new Date(r.date+"T12:00").toLocaleDateString("ru-RU")} в ${r.time} · ${r.activity}`;const h=document.createElement("small");h.textContent="Обновлено: "+new Date(r.updated_at.replace(" ","T")+"Z").toLocaleString("ru-RU"),l.append(c,m,h),n.append(l)}}catch(i){o.textContent=i.message}finally{s.disabled=!1}};t.querySelector("#refreshResults").onclick=a,a()}async function te(e){var i;const t=!e.tracking;if(t){const r=new Uint8Array(await crypto.subtle.digest("SHA-256",new TextEncoder().encode("invitik-shared:"+location.hash))),l=Array.from(r,h=>h.toString(16).padStart(2,"0")).join(""),c=`${l.slice(0,8)}-${l.slice(8,12)}-${l.slice(12,16)}-${l.slice(16,20)}-${l.slice(20,32)}`,m=btoa(String.fromCharCode(...r)).replaceAll("+","-").replaceAll("/","_").replaceAll("=","");e.tracking={id:c,submitToken:m}}const o="invitik-guest-"+Array.from(new Uint8Array(await crypto.subtle.digest("SHA-256",new TextEncoder().encode(((i=e.tracking)==null?void 0:i.id)||location.hash))),r=>r.toString(16).padStart(2,"0")).join("");let n;try{n=JSON.parse(localStorage.getItem(o)||"null")}catch{}n||(n={responseId:crypto.randomUUID()});const s=()=>{try{return localStorage.setItem(o,JSON.stringify(n)),!0}catch{return!1}};if(s(),e.tracking){const r=await fetch(J+`/invitations/${e.tracking.id}/result`,{signal:AbortSignal.timeout(15e3),headers:{Authorization:"Bearer "+e.tracking.submitToken}});if(r.ok){const l=await r.json();n=l.pending?{responseId:n.responseId}:{...n,...l,saved:!0},s()}else if(r.status===404&&t)await D("/invitations",{body:{id:e.tracking.id,ownerToken:e.tracking.submitToken,submitToken:e.tracking.submitToken,title:e.question,activities:e.activities.map(l=>l.name).filter(l=>l.trim())}}),n={responseId:n.responseId},s();else throw new Error("Не удалось загрузить результат. Обновите страницу.")}return{get data(){return n},save(r){return n={...n,...r},s()},async send(r){return e.tracking&&await D(`/invitations/${e.tracking.id}/responses`,{auth:e.tracking.submitToken,body:{...r,responseId:n.responseId}}),n={...n,...r,saved:!0},s()}}}const ne=["1f30a","1f32e","1f338","1f339","1f34b","1f354","1f355","1f35d","1f366","1f375","1f377","1f379","1f37d_fe0f","1f37f","1f381","1f383","1f389","1f3ac","1f3ad","1f3b2","1f3b3","1f3e0","1f47b","1f480","1f48c","1f495","1f496","1f498","1f49d","1f525","1f52e","1f602","1f608","1f60d","1f618","1f63b","1f680","1f6b2","1f942","1f957","1f970","1f987","1f9cb","2615","26a1","2728","2764_fe0f"],ae=`
  
  <main class="wrap">
    
    <a class="edit-back" id="editBack" href="/" hidden>← Вернуться в кабинет</a>

    
    
    <div class="wizard-tabs" id="wizTabs">
      <button class="wtab" data-step="0" type="button" title="Экран 1" aria-label="Шаг 1 — экран приглашения"><b>1</b></button>
      <button class="wtab" data-step="1" type="button" title="Экран 2" aria-label="Шаг 2 — экран подтверждения"><b>2</b></button>
      <button class="wtab" data-step="2" type="button" title="Дата и время" aria-label="Шаг 3 — дата и время"><b>3</b></button>
      <button class="wtab" data-step="3" type="button" title="Активность" aria-label="Шаг 4 — активность"><b>4</b></button>
      <button class="wtab" data-step="4" type="button" title="Финал" aria-label="Шаг 5 — финал"><b>5</b></button>
    </div>

    <div class="wizard-grid">
      
      <div class="card panel" id="panelCard">
        <form id="form" autocomplete="off">

          
          <section class="wstep" data-step="0">
            <h2>Экран 1 — приглашение 💌</h2>
            <p class="muted mb">Что увидит человек, открыв ссылку. Меняйте — превью обновляется.</p>

            <div class="subhead">🌈 Вайб (живой фон)</div>
            <p class="muted mb" style="margin-top:-6px">У каждого вайба — свой анимированный фон: лепестки, звёзды, боке, северное сияние…</p>
            <div class="theme-grid" id="themeGrid" style="margin-bottom:8px"></div>
            <p class="hint" id="vibeName">Вайб: Лепестки</p>

            <div class="subhead" id="openingLabel">Как откроется приглашение</div>
            <p class="muted mb">Маленький сюрприз перед первым экраном. Выберите и попробуйте в превью.</p>
            <div class="opening-picker" id="openingPicker" role="group" aria-labelledby="openingLabel">
              <button type="button" data-opening="ribbon" aria-pressed="true"><span aria-hidden="true">🎀</span><b>Развязать ленту</b><small>Зажать узел в центре бантика и потянуть вправо</small></button>
              <button type="button" data-opening="heart" aria-pressed="false"><span aria-hidden="true">♥</span><b>Согреть сердечко</b><small>Прикоснуться и подержать</small></button>
              <button type="button" data-opening="fog" aria-pressed="false"><span aria-hidden="true">☁</span><b>Запотевшее стекло</b><small>Стереть дымку пальцем</small></button>
              <button type="button" data-opening="note" aria-pressed="false"><span aria-hidden="true">💌</span><b>Вытянуть записку</b><small>Потянуть карточку вверх</small></button>
              <button type="button" data-opening="scheduled" aria-pressed="false" class="opening-scheduled"><span aria-hidden="true">⏳</span><b>В назначенное время</b><small>Откроется в выбранные вами дату и время</small></button>
              <button type="button" data-opening="none" aria-pressed="false" class="opening-none">Без вступления</button>
            </div>
            <div class="opening-copy-fields" id="openingCopyFields">
              <div class="opening-copy-head"><span aria-hidden="true">✎</span><b>Текст вступления</b><small>Сразу виден в предпросмотре</small></div>
              <label class="field"><span class="lbl" id="openingTitleLabel">Заголовок вступления</span>
                <textarea class="input" id="openingTitle" maxlength="160" rows="2"></textarea></label>
              <label class="field"><span class="lbl" id="openingHintLabel">Подсказка к жесту</span>
                <input class="input" id="openingHint" maxlength="220" /></label>
            </div>
            <div class="scheduled-opening-fields" id="scheduledOpeningFields" hidden>
              <div class="lbl">Стикер на экране ожидания</div>
              <p class="hint scheduled-sticker-hint">Он заменит открытку и останется на экране, когда время придёт.</p>
              <div class="imgpick opening-sticker-pick" data-imgkey="scheduledSticker" data-sticker-only="true"></div>
              <div class="row2">
                <label class="field"><span class="lbl">Дата открытия</span><input class="input" id="openingDate" type="date" /></label>
                <label class="field"><span class="lbl">Время открытия</span><input class="input" id="openingTime" type="time" /></label>
              </div>
              <p class="hint">Указывайте своё местное время. Получатель увидит отсчёт, а затем кнопку открытия.</p>
              <div class="scheduled-preview-switch" id="scheduledPreviewSwitch" role="group" aria-label="Состояние предпросмотра">
                <button type="button" data-scheduled-preview="countdown" aria-pressed="true">До открытия</button>
                <button type="button" data-scheduled-preview="ready" aria-pressed="false">Время пришло</button>
              </div>
            </div>

            <div class="subhead">🎵 Музыка на странице</div>
            <p class="muted mb" style="margin-top:-6px">Мягко заиграет, когда гость нажмёт «Да».</p>
            <div class="track-slider">
              <button class="track-arrow" id="trackPrev" type="button" aria-label="Предыдущий трек">‹</button>
              <div class="track-list" id="trackList"></div>
              <button class="track-arrow" id="trackNext" type="button" aria-label="Следующий трек">›</button>
            </div>
            <div class="img-actions">
              <button type="button" class="btn ghost mini" id="musicUpload">🎵 Загрузить свой трек</button>
              <span class="hint" id="musicHint">mp3, m4a, ogg, wav — до 20 МБ</span>
            </div>
            <input type="file" id="musicInput" accept="audio/*,.mp3,.m4a,.ogg,.wav,.flac,.aac" hidden />

            <div class="subhead">🖼️ Экран 1 — приглашение</div>
            <div class="lbl">Картинка / гифка</div>
            <div class="imgpick" data-imgkey="image1"></div>

            <label class="field"><span class="lbl">Вопрос (заголовок)</span>
              <textarea class="input" id="question" maxlength="300" placeholder="Пойдёшь со мной на свидание? 💌"></textarea></label>
            <div class="row2">
              <label class="field"><span class="lbl">Кнопка «Да»</span><input class="input" id="yesText" maxlength="40" placeholder="Да! 😍" /></label>
              <label class="field"><span class="lbl">Кнопка «Нет»</span><input class="input" id="noText" maxlength="40" placeholder="Нет" /></label>
            </div>
            <div class="lbl">Анимация «Да»</div>
            <div class="seg mb" id="yesAnimSeg">
              <button type="button" class="chip" data-a="hearts" aria-pressed="true">Взрыв сердец 💥</button>
              <button type="button" class="chip" data-a="none" aria-pressed="false">Без анимации</button>
            </div>
            <div class="lbl">Кнопка «Нет» ведёт себя как…</div>
            <div class="seg mb" id="noAnimSeg">
              <button type="button" class="chip" data-a="runaway" aria-pressed="true">Убегает 🏃</button>
              <button type="button" class="chip" data-a="shrink" aria-pressed="false">Уменьшается 🔎</button>
              <button type="button" class="chip" data-a="multiply" aria-pressed="false">Размножается 👯</button>
              <button type="button" class="chip" data-a="kiss" aria-pressed="false">Исчезает с 😘</button>
            </div>

          </section>

          
          <section class="wstep" data-step="1" hidden>
            <h2>Экран 2 — подтверждение 😍</h2>
            <p class="muted mb">Дразнящий экран сразу после «Да».</p>
            <label class="field"><span class="lbl">Подзаголовок</span>
              <textarea class="input" id="confirmTitle" maxlength="300" placeholder="Подожди, ты действительно сказала «да»? 😍"></textarea></label>
            <label class="field"><span class="lbl">Вторая строка (необязательно)</span>
              <input class="input" id="confirmSub" maxlength="300" placeholder="А я так волновался 😄" /></label>
            <label class="field"><span class="lbl">Кнопка подтверждения</span>
              <input class="input" id="confirmBtn" maxlength="40" placeholder="Да, да, ДА!" /></label>
            <div class="lbl">Картинка экрана 2 (необязательно)</div>
            <div class="imgpick" data-imgkey="image2"></div>
          </section>

          
          <section class="wstep" data-step="2" hidden>
            <h2>Дата и время 📅</h2>
            <p class="muted mb">Предложите удобное время или оставьте выбор получателю.</p>
            <div class="date-mode" id="dateMode" role="radiogroup" aria-label="Кто предлагает время?">
              <label class="date-mode-card">
                <input type="radio" name="dateMode" value="recipient" checked>
                <span class="date-mode-icon" aria-hidden="true">♡</span>
                <span class="date-mode-copy"><strong>Довериться получателю</strong><span>Он сам выберет дату и время</span></span>
                <span class="date-mode-check" aria-hidden="true"></span>
              </label>
              <label class="date-mode-card">
                <input type="radio" name="dateMode" value="suggested">
                <span class="date-mode-icon" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M7 3v3m10-3v3M4 10h16M6 5h12a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2Z"/></svg></span>
                <span class="date-mode-copy"><strong>Предложить варианты</strong><span>Одно время или несколько на выбор</span></span>
                <span class="date-mode-check" aria-hidden="true"></span>
              </label>
            </div>
            <div id="dateOptionsEditor" hidden>
              <div class="date-options-heading"><span class="lbl">Когда встретимся?</span><span id="dateOptionsCount" class="date-options-count"></span></div>
              <div id="dateOptionsList" class="date-options-editor"></div>
              <button class="date-option-add" type="button" id="addDateOption"><span aria-hidden="true">+</span> Добавить вариант</button>
              <p class="date-options-hint"><span aria-hidden="true">♡</span> Если планы не совпадут, получатель сможет предложить своё время.</p>
            </div>
            <label class="field"><span class="lbl">Заголовок экрана</span>
              <textarea class="input" id="dateTitle" maxlength="200" placeholder="Когда тебе удобно? 🗓️"></textarea></label>
            <label class="field"><span class="lbl">Текст кнопки</span>
              <input class="input" id="dateBtn" maxlength="40" placeholder="Подтвердить 💫" /></label>
            <div class="lbl">Картинка экрана (необязательно)</div>
            <div class="imgpick" data-imgkey="imageDate"></div>
          </section>

          
          <section class="wstep" data-step="3" hidden>
            <h2>Активность 🎯</h2>
            <p class="muted mb">Чем займёмся? Получатель выберет один вариант. От 1 до 6.</p>
            <label class="field"><span class="lbl">Заголовок экрана</span>
              <textarea class="input" id="actTitle" maxlength="200" placeholder="Чем займёмся? 😋"></textarea></label>
            <label class="field"><span class="lbl">Подзаголовок (необязательно)</span>
              <input class="input" id="actSub" maxlength="200" placeholder="Выбирай, что по душе" /></label>
            <div class="act-heading"><span class="lbl">Варианты</span><span id="actCount" class="muted"></span></div>
            <details class="act-presets" id="actPresets">
              <summary>
                <span class="act-presets-icon" aria-hidden="true">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="m12 3 2.4 6.6L21 12l-6.6 2.4L12 21l-2.4-6.6L3 12l6.6-2.4L12 3Z"/><path d="M20 3v4m-2-2h4"/></svg>
                </span>
                <span class="act-presets-copy"><strong>Готовые идеи</strong><span>Для вашего свидания</span></span>
                <span class="act-presets-toggle"><span class="act-presets-open-label">Открыть</span><span class="act-presets-close-label">Свернуть</span><svg class="act-presets-chevron" aria-hidden="true" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="m6 8 4 4 4-4"/></svg></span>
              </summary>
              <div class="act-presets-body">
                <div id="actCategories" class="act-categories" role="group" aria-label="Категории заготовок"></div>
                <p class="act-preset-hint" id="actPresetHint">Нажмите на вариант, чтобы добавить его.</p>
                <div id="actPresetList" class="act-preset-list" role="group" aria-label="Заготовки"></div>
              </div>
            </details>
            <div id="actList" class="act-list"></div>
            <button type="button" class="btn ghost" id="addAct" style="margin-top:6px">+ Свой вариант</button>
            <span id="actStatus" class="act-status" role="status"></span>
            <div class="lbl" style="margin-top:20px">Картинка экрана (необязательно)</div>
            <div class="imgpick" data-imgkey="imageAct"></div>
          </section>

          
          <section class="wstep" data-step="4" hidden>
            <h2>Финальный экран 🎉</h2>
            <p class="muted mb">Получатель увидит этот экран, когда выберет дату, время и занятие.</p>
            <label class="field"><span class="lbl">Заголовок</span>
              <textarea class="input" id="finalTitle" maxlength="300" placeholder="Ура! Это свидание 💛"></textarea></label>
            <label class="field"><span class="lbl">Описание</span>
              <textarea class="input" id="finalDesc" maxlength="500" aria-describedby="finalDescHint" placeholder="Жду тебя {Дата} в {Время}. Нас ждёт {Занятие} 💫"></textarea></label>
            <p class="hint final-desc-hint" id="finalDescHint">Вместо слов в скобках автоматически появятся дата, время и занятие, выбранные получателем. Добавьте их в текст кнопками ниже.</p>
            <div class="var-chips">
              <span class="muted" style="font-size:13px">Вставить:</span>
              <button type="button" class="varchip" data-var="{Дата}" aria-label="Вставить выбранную дату">Дата</button>
              <button type="button" class="varchip" data-var="{Время}" aria-label="Вставить выбранное время">Время</button>
              <button type="button" class="varchip" data-var="{Занятие}" aria-label="Вставить выбранное занятие">Занятие</button>
            </div>
            <div class="lbl" style="margin-top:16px">Картинка финала (необязательно)</div>
            <div class="imgpick" data-imgkey="imageFinal"></div>

            <div class="subhead">📸 Фотоальбом «наши моменты»</div>
            <p class="muted mb" style="margin-top:-6px">Несколько фото с подписями — получатель пролистает их на финальном экране.</p>
            <div class="album-grid" id="albumGrid"></div>
            <button type="button" class="btn ghost mini" id="albumAdd">📷 Добавить фото</button>
            <p class="hint" id="albumHint">До 12 фото, каждое до 8 МБ. Уменьшаем перед отправкой, чтобы страница не тормозила.</p>

            <div class="subhead">🎤 Голосовое сообщение</div>
            <p class="muted mb" style="margin-top:-6px">Запишите пару слов голосом — прозвучит на финальном экране.</p>
            <div class="voice-box" id="voiceBox"></div>
            <p class="hint" id="voiceHint">До 60 секунд. Нужен доступ к микрофону.</p>

            <div class="subhead">🎁 Секретное сообщение-сюрприз</div>
            <p class="muted mb" style="margin-top:-6px">Спрятанный конверт на финальном экране — гость откроет его и увидит ваши слова.</p>
            <label class="field"><span class="lbl">Текст сюрприза (необязательно)</span>
              <textarea class="input" id="secretMsg" maxlength="600" placeholder="P.S. Я влюбился в тебя ещё в тот день, когда…"></textarea></label>

            
          </section>

          
          <div class="wizard-nav">
            <button class="btn ghost" type="button" id="backBtn" style="visibility:hidden">← Назад</button>
            <button class="btn" type="button" id="nextBtn">Далее →</button>
            <button class="btn" type="submit" id="submitBtn" style="display:none">Создать приглашение 💌</button>
          </div>
        </form>
      </div>

      
      <div class="preview-col">
        <div class="phone">
          <div class="notch"></div>
          <div class="screen" id="pvScreen">
            <div class="pv-tabs" id="pvTabs" style="display:none">
              <button class="pv-tab" data-s="ask" aria-pressed="true" type="button">Экран 1</button>
              <button class="pv-tab" data-s="confirm" aria-pressed="false" type="button">Экран 2</button>
            </div>
            <div class="pv-content" id="pvContent">
              <div class="pv-image" id="pvImage" style="display:none"></div>
              <div class="q" id="pvTitle"></div>
              <div class="pv-sub" id="pvSub" style="display:none"></div>
              <div class="pv-body" id="pvBody"></div>
            </div>
          </div>
        </div>
        <p class="muted" style="text-align:center;margin-top:14px;font-size:14px" id="pvCaption">Так увидит получатель</p>
        <button type="button" class="btn ghost mini opening-replay" id="openingReplay">Попробовать вступление</button>
      </div>
    </div>
    <a class="mobile-form-cue" id="mobileFormCue" href="#panelCard" aria-label="Перейти к настройкам текущего шага">
      <span><b id="mobileFormCueText">Заполните шаг ниже</b><small>листайте вниз или нажмите</small></span>
      <span class="mobile-form-cue-arrow" aria-hidden="true">↓</span>
    </a>
  </main>

  
  <input type="file" id="fileInput" accept="image/*" style="display:none" />
  <input type="file" id="albumInput" accept="image/*" multiple style="display:none" />

  
  

  <aside class="draft-bar" id="draftBar" aria-labelledby="draftTitle" hidden>
    <strong id="draftTitle">Нашли ваш черновик</strong>
    <p id="draftStatus" role="status" aria-live="polite">Загрузить его или начать новое приглашение?</p>
    <div class="draft-offer" id="draftOffer" hidden><button type="button" id="draftResume">Загрузить черновик</button><button type="button" class="secondary" id="draftDiscard">Начать заново</button></div>
  </aside>
  <aside class="draft-bar recent-invite-bar" id="recentInviteBar" aria-labelledby="recentInviteTitle" hidden>
    <strong id="recentInviteTitle">У вас уже есть приглашение</strong>
    <p id="recentInviteStatus" role="status" aria-live="polite"></p>
    <div class="draft-offer">
      <button type="button" id="recentInviteResume">Вернуться к оплате</button>
      <button type="button" class="secondary" id="recentInviteDismiss">Создать новое</button>
    </div>
  </aside>
  <div class="toast" id="toast"></div>
`,se="invitik-local-v1",ie=()=>new Promise((e,t)=>{const a=indexedDB.open(se,1);a.onupgradeneeded=()=>a.result.createObjectStore("records"),a.onsuccess=()=>e(a.result),a.onerror=()=>t(new Error("Браузер не разрешил сохранить приглашение"))});async function L(e,t,a=!1){const o=await ie();try{return await new Promise((n,s)=>{const i=o.transaction("records",t===void 0&&!a?"readonly":"readwrite"),r=i.objectStore("records"),l=a?r.delete(e):t===void 0?r.get(e):r.put(t,e);i.oncomplete=()=>n(l.result),i.onerror=()=>s(new Error("Не хватает места для сохранения. Попробуйте уменьшить файлы.")),i.onabort=()=>s(new Error("Не удалось сохранить данные"))})}finally{o.close()}}const E=(e,t=200)=>new Response(JSON.stringify(e),{status:t,headers:{"Content-Type":"application/json"}}),oe=e=>new Promise((t,a)=>{const o=new FileReader;o.onload=()=>t(o.result),o.onerror=a,o.readAsDataURL(e)});function re(){const e=window.fetch.bind(window);window.fetch=async(t,a={})=>{const o=new URL(typeof t=="string"?t:t.url,location.href);if(o.origin!==location.origin||!o.pathname.startsWith("/api/"))return e(t,a);try{if(o.pathname==="/api/music")return e(_("/music.json"));if(o.pathname.startsWith("/api/drafts")){const n=o.pathname.split("/")[3]||crypto.randomUUID(),s=`draft:${n}`;if(a.method==="DELETE")return await L(s,null,!0),E({ok:!0});if(a.method==="POST"||a.method==="PUT")return await L(s,JSON.parse(a.body)),E({token:n});const i=await L(s);return i?E(i):E({error:"Черновик не найден"},404)}if(o.pathname.startsWith("/api/upload/")){const n=a.body;return!(n instanceof Blob)||n.size>20*1024*1024?E({error:"Файл слишком большой"},413):E({url:await oe(n)})}return E({error:"Недоступно в локальном редакторе"},404)}catch(n){return E({error:n.message},500)}}}async function le(e){const t=new TextEncoder().encode(JSON.stringify({version:1,settings:e})),a=new Uint8Array(await new Response(new Blob([t]).stream().pipeThrough(new CompressionStream("gzip"))).arrayBuffer());let o="";for(const n of a)o+=String.fromCharCode(n);return btoa(o).replaceAll("+","-").replaceAll("/","_").replaceAll("=","")}function W(e){if(!e||e.version!==1||typeof e.settings!="object"||!e.settings)throw new Error("Неверный файл приглашения");const t=e.settings;if(typeof t.question!="string"||t.question.length>300||!Array.isArray(t.activities)||t.activities.length>6||!Array.isArray(t.album)||t.album.length>12)throw new Error("Неверный формат приглашения");const a=JSON.parse(JSON.stringify(t),(n,s)=>["__proto__","constructor","prototype"].includes(n)?void 0:s);if(a.tracking){if(!/^[a-f0-9-]{36}$/.test(a.tracking.id||"")||!/^[A-Za-z0-9_-]{43}$/.test(a.tracking.submitToken||""))throw new Error("Неверные данные сохранения ответов");a.tracking={id:a.tracking.id,submitToken:a.tracking.submitToken}}const o=[a.image1,a.image2,a.imageDate,a.imageAct,a.imageFinal,a.scheduledSticker,a.music,a.voice,...a.album.map(n=>n.url)];for(const n of o)if(n&&(typeof n!="string"||!/^(?:\/(?!\/)|https?:\/\/|data:(?:image|audio)\/)/i.test(n)))throw new Error("Неподдерживаемая ссылка на файл");for(const n of a.activities)if(!n||typeof n.name!="string"||typeof n.emoji!="string")throw new Error("Неверный список занятий");return a}async function ce(){const e=location.hash.slice(8).replaceAll("-","+").replaceAll("_","/");if(e.length>4e7)throw new Error("Приглашение слишком большое");const t=Uint8Array.from(atob(e),i=>i.charCodeAt(0)),o=new Blob([t]).stream().pipeThrough(new DecompressionStream("gzip")).getReader();let n=0;const s=[];for(;;){const{value:i,done:r}=await o.read();if(r)break;if(n+=i.length,n>5e7)throw await o.cancel(),new Error("Приглашение слишком большое");s.push(i)}return W(JSON.parse(await new Blob(s).text()))}function de(e,t){const a=URL.createObjectURL(e),o=document.createElement("a");o.href=a,o.download=t,o.click(),setTimeout(()=>URL.revokeObjectURL(a),3e3)}async function pe(e){var l;const t=structuredClone(e),a=await K(t);t.tracking=a.tracking,await L("last-invite",t);const o=await le(t),n=Z(location.origin,o);(l=document.getElementById("createdDialog"))==null||l.remove();const s=document.createElement("dialog");s.id="createdDialog",s.className="created-dialog",s.innerHTML='<div class="created-media"></div><h2>Приглашение готово!</h2><p class="muted">Всё сохранено в этом браузере. Откройте приглашение и попробуйте его как получатель.</p><div class="created-actions"><a class="btn" id="openInvite" target="_blank" rel="noopener">Открыть приглашение 💌</a><button class="btn ghost" id="copyInvite" type="button">Скопировать ссылку</button><button class="btn ghost" id="exportInvite" type="button">Скачать приглашение</button><button class="btn ghost" id="closeCreated" type="button">Продолжить редактирование</button></div><p class="hint" id="shareHint"></p><p role="status" id="createdStatus"></p>',document.body.append(s),window.renderMedia(s.querySelector(".created-media"),"/stickers/s1.json"),s.querySelector("#openInvite").href=n,Q(a.tracking.id,n);const i=["localhost","127.0.0.1"].includes(location.hostname);s.querySelector("#shareHint").textContent=i?"Сейчас ссылка открывается на этом компьютере. Для отправки другому человеку проект нужно разместить в интернете.":"Отправьте эту ссылку получателю. После прохождения вы оба увидите по ней сохранённые дату, время и занятие.",n.length>6e4&&(s.querySelector("#copyInvite").disabled=!0,s.querySelector("#shareHint").textContent+=" С добавленными файлами ссылка слишком длинная — скачайте приглашение."),s.querySelector("#copyInvite").onclick=async()=>{try{await navigator.clipboard.writeText(n),s.querySelector("#createdStatus").textContent="Ссылка скопирована ✓"}catch{s.querySelector("#createdStatus").textContent="Браузер не разрешил копирование. Откройте приглашение и скопируйте адрес."}},s.querySelector("#exportInvite").onclick=()=>de(new Blob([JSON.stringify({version:1,settings:t},null,2)],{type:"application/json"}),"приглашение.invitik.json"),s.querySelector("#closeCreated").onclick=()=>s.close(),s.addEventListener("close",()=>{window.renderMedia(s.querySelector(".created-media"),""),s.remove(),document.getElementById("submitBtn").focus()},{once:!0}),s.showModal()}function ue(){const e=document.createElement("div");e.className="local-tools",e.innerHTML='<button type="button" class="btn ghost mini" id="importInvite">Открыть сохранённое приглашение</button><input type="file" accept=".json" hidden id="importFile"><span class="hint" role="status" id="importStatus"></span>',document.querySelector("main.wrap").append(e),X(document.querySelector("main.wrap"));const t=e.querySelector("input");e.querySelector("button").onclick=()=>t.click(),t.onchange=async()=>{try{const a=t.files[0];if(!a)return;if(a.size>5e7)throw new Error("Файл слишком большой");const o=W(JSON.parse(await a.text()));window.InviteEditor.hydrate(o),window.InviteEditor.goStep(0),e.querySelector("#importStatus").textContent="Приглашение загружено"}catch(a){e.querySelector("#importStatus").textContent=a.message}t.value=""}}async function me(e){var M,V;const t=await te(e),a=window.InviteEditor;a.hydrate(e),document.body.classList.add("recipient-mode"),document.title=e.question||"Для тебя 💌";const o=d=>document.getElementById(d),n=o("pvScreen"),s=o("pvContent"),i=o("pvBody");let r=t.data.date||"",l=t.data.time||"",c=t.data.activity||"",m=!!t.data.saved,h;const v=document.createElement("button");v.className="guest-music",v.type="button",v.textContent="Выключить музыку",v.hidden=!e.music,v.onclick=()=>{window.Music.muted=!window.Music.muted,window.Music._fadeTo(window.Music.muted?0:window.Music.volume,250),v.textContent=window.Music.muted?"Включить музыку":"Выключить музыку"},document.body.append(v);const w=(d,f)=>{const u=document.createElement("button");return u.className="mini-btn mini-yes",u.type="button",u.textContent=d,u.onclick=f,u},k=d=>{let f=i.querySelector(".guest-status");f||(f=document.createElement("p"),f.className="guest-status",f.role="status",i.append(f)),f.textContent=d};function T(d){const f=a.state.opening;if(d===0&&(a.state.opening="none"),a.goStep(d),a.state.opening=f,window.spawnVibe(n,e.theme,!1),s.scrollTop=0,s.animate([{opacity:0,transform:"translateY(12px)"},{opacity:1,transform:"translateY(0)"}],{duration:350,easing:"ease-out"}),d===0){const u=i.querySelector(".pv-answers"),p=u.cloneNode(!0);u.replaceWith(p),window.wireAnswers({yes:p.querySelector(".mini-yes"),no:p.querySelector(".mini-no"),zone:p,bounds:n,yesAnim:e.yesAnim,noAnim:e.noAnim,onYes:()=>{window.Music.start(e.music),setTimeout(()=>T(1),350)}})}else if(d===1)i.querySelector("button").onclick=()=>T(2);else if(d===2){i.replaceChildren();const u=window.DateOptions.normalize(e.dateOptions);if(e.dateMode==="suggested"&&u.length){const p=document.createElement("div");p.className="guest-options";for(const y of u){const I=w(window.DateOptions.label(y),()=>{[r,l]=y.split("T"),p.querySelectorAll("button").forEach(x=>x.setAttribute("aria-pressed",String(x===I)))});I.setAttribute("aria-pressed","false"),p.append(I)}i.append(p),i.append(w("Предложить своё время",()=>{i.replaceChildren(),U()})),i.append(w(e.dateBtn||"Подтвердить 💫",$))}else U()}else if(d===3){i.replaceChildren();const u=document.createElement("div");u.className="act-cards";for(const p of e.activities.filter(y=>y.name.trim())){const y=window.activityCard(p,!0);y.onclick=()=>{c=p.name,T(4)},u.append(y)}i.append(u)}else{const u=r?new Date(r+"T12:00").toLocaleDateString("ru-RU",{weekday:"long",day:"numeric",month:"long"}):"";if(o("pvSub").textContent=(e.finalDesc||"").replaceAll("{date}",u).replaceAll("{time}",l).replaceAll("{activity}",c),i.replaceChildren(),window.heartsBurst(n),e.album.length){const b=document.createElement("div");b.className="guest-album",b.setAttribute("aria-label","Наши моменты"),b.tabIndex=0;for(const S of e.album){const A=document.createElement("figure"),N=document.createElement("img");N.src=S.url,N.alt=S.caption||"Наш момент";const j=document.createElement("figcaption");j.textContent=S.caption||"",A.append(N,j),b.append(A)}i.append(b)}if(e.voice){const b=document.createElement("audio");b.src=e.voice,b.controls=!0,b.className="guest-audio",b.setAttribute("aria-label","Голосовое сообщение"),i.append(b)}if(e.secretMsg){const b=document.createElement("details");b.className="guest-secret";const S=document.createElement("summary");S.textContent="Открыть секретное сообщение 💌";const A=document.createElement("p");A.textContent=e.secretMsg,b.append(S,A),i.append(b)}i.append(w("Добавить в календарь",()=>be(e.finalTitle,r,l,c)));const p=w("Изменить ответ",()=>{m=!1,T(2)});i.append(p);const y={name:t.data.name||"",date:r,time:l,activity:c},I=e.tracking?"Договорённость сохранена. Вы оба видите этот результат по той же ссылке.":"Результат сохранён на этом устройстве. У этой старой ссылки нет отправки ответа автору.",x=async()=>{p.disabled=!0,k("Сохраняем ваш ответ…"),t.save({...y,saved:!1});try{const b=await t.send(y);k(I+(b?" Можно закрыть страницу — результат останется по этой ссылке.":" Браузер запретил сохранение на устройстве: после перезагрузки результат может не восстановиться."))}catch(b){k("Ответ не отправлен: "+b.message);const S=w("Повторить сохранение",()=>{S.remove(),x()});i.append(S)}finally{p.disabled=!1}};m?(k(I),m=!1):x()}}function U(){const d=document.createElement("div");d.className="guest-dates",d.innerHTML='<label>Дата<input class="input" type="date" id="guestDate" required></label><label>Время<input class="input" type="time" id="guestTime" required></label>',i.append(d);const f=new Date,u=p=>String(p).padStart(2,"0");o("guestDate").min=`${f.getFullYear()}-${u(f.getMonth()+1)}-${u(f.getDate())}`,o("guestDate").value=r,o("guestTime").value=l,o("guestDate").oninput=p=>r=p.target.value,o("guestTime").oninput=p=>l=p.target.value,i.append(w(e.dateBtn||"Подтвердить 💫",$))}function $(){if(!window.DateOptions.valid(`${r}T${l}`)){k("Выберите дату и время встречи");return}const d=window.DateOptions.error({dateMode:"suggested",dateOptions:[`${r}T${l}`]});if(d){k(d);return}T(3)}const B=r&&l&&c&&window.DateOptions.valid(`${r}T${l}`)&&e.activities.some(d=>d.name===c);T(B?4:0),document.documentElement.classList.add("recipient-page");const P=getComputedStyle(n).backgroundImage;document.documentElement.style.backgroundImage=P;const O=(M=P.match(/rgba?\([^)]+\)/))==null?void 0:M[0];if(O&&(document.documentElement.style.backgroundColor=O,(V=document.querySelector('meta[name="theme-color"]'))==null||V.setAttribute("content",O)),!B)if(e.opening==="scheduled"){o("pvImage").style.display="none",o("pvTitle").style.display="none";const d=()=>{const f=Date.parse(e.openAt)-Date.now();Number.isFinite(f)&&f>0?(i.querySelector(".schedule-lock")||window.ScheduledOpening.mount(i,{ready:!1,sticker:e.scheduledSticker,title:e.openingTitle,hint:e.openingHint}),window.ScheduledOpening.update(i,f)):(clearInterval(h),window.ScheduledOpening.mount(i,{ready:!0,sticker:e.scheduledSticker,title:e.openingTitle,hint:e.openingHint}),i.querySelector("[data-schedule-open]").onclick=()=>T(0))};h=setInterval(d,1e3),d()}else e.opening!=="none"&&window.InviteOpening.mount(n,{variant:e.opening,theme:e.theme,target:s,title:e.openingTitle,hint:e.openingHint,onOpen:()=>{}})}function be(e,t,a,o){const n=h=>String(h||"").replaceAll("\\","\\\\").replaceAll(`
`,"\\n").replaceAll(",","\\,").replaceAll(";","\\;").replaceAll("\r",""),s=new Date(`${t}T${a}`),i=new Date(s.getTime()+36e5),r=h=>h.toISOString().replaceAll("-","").replaceAll(":","").replace(/\.\d{3}/,""),l=["BEGIN:VCALENDAR","VERSION:2.0","PRODID:-//Invitik Local//RU","BEGIN:VEVENT",`UID:${crypto.randomUUID()}@invitik-local`,`DTSTAMP:${r(new Date)}`,`DTSTART:${r(s)}`,`DTEND:${r(i)}`,`SUMMARY:${n(e)}`,`DESCRIPTION:${n(o)}`,"END:VEVENT","END:VCALENDAR",""].join(`\r
`),c=URL.createObjectURL(new Blob([l],{type:"text/calendar;charset=utf-8"})),m=document.createElement("a");m.href=c,m.download="свидание.ics",m.click(),setTimeout(()=>URL.revokeObjectURL(c),3e3)}async function fe(){if(location.hash.startsWith("#results=")){ee();return}if(window.assetURL=_,window.LOCAL_EMOJI=new Set(ne),document.getElementById("app").innerHTML=ae,document.querySelectorAll('a[href="/"]').forEach(e=>e.href=_("/")),window.goal=()=>{},window.INVITIK_LANG="ru",window.INVITIK_LOCALE="ru-RU",window.INVITE_GUEST=location.hash.startsWith("#invite="),window.LocalInvites={created:pe},re(),await g(()=>import("./vibe-BL8P8MK5.js"),[]),await g(()=>import("./answers-BrfyQBTs.js"),[]),await g(()=>import("./scroll-cue-CZBRWbMV.js"),[]),await g(()=>import("./scheduled-opening-DwdNxG5q.js"),[]),await g(()=>import("./opening-C4a7Wq2X.js"),[]),await g(()=>import("./recent-invites-DP5SCVSd.js"),[]),await g(()=>import("./drafts-CqbIBGQV.js"),[]),await g(()=>import("./creator-kit-Bukfhq1C.js"),[]),await g(()=>import("./date-options-BX8C4rUX.js"),[]),await g(()=>import("./date-time-fields-PxFQD5l1.js"),[]),await g(()=>import("./create-Cfe3pRRt.js"),[]),window.INVITE_GUEST)try{await me(await ce())}catch{document.getElementById("app").innerHTML=`<main class="wrap"><section class="card panel"><h2>Не удалось открыть приглашение</h2><p>Не удалось загрузить приглашение или сохранённый результат. Проверьте соединение и обновите страницу.</p><a class="btn" href="${_("/create/")}">Создать приглашение</a></section></main>`}else{ue();const{mountHalloween:e}=await g(async()=>{const{mountHalloween:t}=await import("./halloween-1RQFUe5o.js");return{mountHalloween:t}},[]);e()}}fe().catch(e=>{console.error(e),document.getElementById("app").textContent="Не удалось запустить редактор. Перезагрузите страницу."});
