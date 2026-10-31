(function(){const t=document.createElement("link").relList;if(t&&t.supports&&t.supports("modulepreload"))return;for(const a of document.querySelectorAll('link[rel="modulepreload"]'))i(a);new MutationObserver(a=>{for(const o of a)if(o.type==="childList")for(const s of o.addedNodes)s.tagName==="LINK"&&s.rel==="modulepreload"&&i(s)}).observe(document,{childList:!0,subtree:!0});function n(a){const o={};return a.integrity&&(o.integrity=a.integrity),a.referrerPolicy&&(o.referrerPolicy=a.referrerPolicy),a.crossOrigin==="use-credentials"?o.credentials="include":a.crossOrigin==="anonymous"?o.credentials="omit":o.credentials="same-origin",o}function i(a){if(a.ep)return;a.ep=!0;const o=n(a);fetch(a.href,o)}})();const W="modulepreload",G=function(e){return"/invitik/"+e},V={},y=function(t,n,i){let a=Promise.resolve();if(n&&n.length>0){let s=function(c){return Promise.all(c.map(b=>Promise.resolve(b).then(f=>({status:"fulfilled",value:f}),f=>({status:"rejected",reason:f}))))};document.getElementsByTagName("link");const r=document.querySelector("meta[property=csp-nonce]"),l=(r==null?void 0:r.nonce)||(r==null?void 0:r.getAttribute("nonce"));a=s(n.map(c=>{if(c=G(c),c in V)return;V[c]=!0;const b=c.endsWith(".css"),f=b?'[rel="stylesheet"]':"";if(document.querySelector(`link[href="${c}"]${f}`))return;const v=document.createElement("link");if(v.rel=b?"stylesheet":W,b||(v.as="script"),v.crossOrigin="",v.href=c,l&&v.setAttribute("nonce",l),document.head.appendChild(v),b)return new Promise((w,E)=>{v.addEventListener("load",w),v.addEventListener("error",()=>E(new Error(`Unable to preload CSS for ${c}`)))})}))}function o(s){const r=new Event("vite:preloadError",{cancelable:!0});if(r.payload=s,window.dispatchEvent(r),!r.defaultPrevented)throw s}return a.then(s=>{for(const r of s||[])r.status==="rejected"&&o(r.reason);return t().catch(o)})},C="/invitik/";function A(e,t=C){return typeof e!="string"||!e.startsWith("/")||e.startsWith("//")||t==="/"||e.startsWith(t)?e:t+e.slice(1)}function Y(e,t,n=C){return`${e}${n}#invite=${t}`}const Z="/invitik/api",j="invitik-owned-v1";function H(){const e=crypto.getRandomValues(new Uint8Array(32));return btoa(String.fromCharCode(...e)).replaceAll("+","-").replaceAll("/","_").replaceAll("=","")}async function N(e,{auth:t,body:n}={}){const i=await fetch(Z+e,{signal:AbortSignal.timeout(15e3),method:n?"POST":"GET",headers:{...t?{Authorization:"Bearer "+t}:{},...n?{"Content-Type":"application/json"}:{}},...n?{body:JSON.stringify(n)}:{}});let a;try{a=await i.json()}catch{throw new Error("Сервис ответов недоступен. Попробуйте ещё раз.")}if(!i.ok)throw new Error(a.error||"Не удалось сохранить ответ");return a}function z(){try{return JSON.parse(localStorage.getItem(j)||"[]")}catch{return[]}}function J(e,t){return`${location.origin}${C}#results=${e}.${t}`}async function K(e){const t=crypto.randomUUID(),n=H(),i=H(),a={id:t,ownerToken:n,title:e.question,createdAt:new Date().toISOString()},o=z();await N("/invitations",{body:{id:t,ownerToken:n,submitToken:i,title:e.question,activities:e.activities.map(s=>s.name).filter(s=>s.trim())}});try{localStorage.setItem(j,JSON.stringify([a,...o].slice(0,100)))}catch{}return{tracking:{id:t,submitToken:i},ownerUrl:J(t,n)}}function Q(e){const t=z();if(!t.length)return;const n=document.createElement("section");n.className="owner-library";const i=document.createElement("h2");i.textContent="Мои приглашения и ответы",n.append(i);for(const a of t){const o=document.createElement("a");o.className="btn ghost",o.href=J(a.id,a.ownerToken),o.textContent=a.title||"Посмотреть ответы",n.append(o)}e.append(n)}function X(){const e=location.hash.slice(9).split(".");document.title="Ответы гостей";const t=document.createElement("main");t.className="wrap results-page",t.innerHTML='<section class="card panel"><h1>Ответы гостей</h1><p class="results-title"></p><p>Это личная ссылка автора. Не отправляйте её гостям.</p><button class="btn" id="refreshResults">Обновить ответы</button><p role="status" id="resultsStatus"></p><div id="resultsList"></div><a class="btn ghost" id="backToEditor">К редактору</a></section>',document.getElementById("app").replaceChildren(t),t.querySelector("#backToEditor").href=C;const n=async()=>{const i=t.querySelector("#resultsStatus"),a=t.querySelector("#resultsList"),o=t.querySelector("#refreshResults");o.disabled=!0,i.textContent="Загружаем ответы…";try{const s=await N(`/invitations/${e[0]}/responses`,{auth:e[1]});t.querySelector(".results-title").textContent=s.title,a.replaceChildren(),i.textContent=s.responses.length?`Ответов: ${s.responses.length}`:"Пока никто не ответил. Отправьте гостю ссылку на приглашение.";for(const r of s.responses){const l=document.createElement("article");l.className="response-card";const c=document.createElement("h2");c.textContent=r.name||"Гость";const b=document.createElement("p");b.textContent=`Согласие: да · ${new Date(r.date+"T12:00").toLocaleDateString("ru-RU")} в ${r.time} · ${r.activity}`;const f=document.createElement("small");f.textContent="Обновлено: "+new Date(r.updated_at.replace(" ","T")+"Z").toLocaleString("ru-RU"),l.append(c,b,f),a.append(l)}}catch(s){i.textContent=s.message}finally{o.disabled=!1}};t.querySelector("#refreshResults").onclick=n,n()}async function ee(e){var o;const n="invitik-guest-"+Array.from(new Uint8Array(await crypto.subtle.digest("SHA-256",new TextEncoder().encode(((o=e.tracking)==null?void 0:o.id)||location.hash))),s=>s.toString(16).padStart(2,"0")).join("");let i;try{i=JSON.parse(localStorage.getItem(n)||"null")}catch{}i||(i={responseId:crypto.randomUUID()});const a=()=>{try{return localStorage.setItem(n,JSON.stringify(i)),!0}catch{return!1}};return a(),{get data(){return i},save(s){return i={...i,...s},a()},async send(s){return e.tracking&&await N(`/invitations/${e.tracking.id}/responses`,{auth:e.tracking.submitToken,body:{...s,responseId:i.responseId}}),i={...i,...s,saved:!0},a()}}}const te=["1f30a","1f32e","1f338","1f339","1f34b","1f354","1f355","1f35d","1f366","1f375","1f377","1f379","1f37d_fe0f","1f37f","1f381","1f383","1f389","1f3ac","1f3ad","1f3b2","1f3b3","1f3e0","1f47b","1f480","1f48c","1f495","1f496","1f498","1f49d","1f525","1f52e","1f602","1f608","1f60d","1f618","1f63b","1f680","1f6b2","1f942","1f957","1f970","1f987","1f9cb","2615","26a1","2728","2764_fe0f"],ne=`
  
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
`,ae="invitik-local-v1",se=()=>new Promise((e,t)=>{const n=indexedDB.open(ae,1);n.onupgradeneeded=()=>n.result.createObjectStore("records"),n.onsuccess=()=>e(n.result),n.onerror=()=>t(new Error("Браузер не разрешил сохранить приглашение"))});async function L(e,t,n=!1){const i=await se();try{return await new Promise((a,o)=>{const s=i.transaction("records",t===void 0&&!n?"readonly":"readwrite"),r=s.objectStore("records"),l=n?r.delete(e):t===void 0?r.get(e):r.put(t,e);s.oncomplete=()=>a(l.result),s.onerror=()=>o(new Error("Не хватает места для сохранения. Попробуйте уменьшить файлы.")),s.onabort=()=>o(new Error("Не удалось сохранить данные"))})}finally{i.close()}}const k=(e,t=200)=>new Response(JSON.stringify(e),{status:t,headers:{"Content-Type":"application/json"}}),ie=e=>new Promise((t,n)=>{const i=new FileReader;i.onload=()=>t(i.result),i.onerror=n,i.readAsDataURL(e)});function oe(){const e=window.fetch.bind(window);window.fetch=async(t,n={})=>{const i=new URL(typeof t=="string"?t:t.url,location.href);if(i.origin!==location.origin||!i.pathname.startsWith("/api/"))return e(t,n);try{if(i.pathname==="/api/music")return e(A("/music.json"));if(i.pathname.startsWith("/api/drafts")){const a=i.pathname.split("/")[3]||crypto.randomUUID(),o=`draft:${a}`;if(n.method==="DELETE")return await L(o,null,!0),k({ok:!0});if(n.method==="POST"||n.method==="PUT")return await L(o,JSON.parse(n.body)),k({token:a});const s=await L(o);return s?k(s):k({error:"Черновик не найден"},404)}if(i.pathname.startsWith("/api/upload/")){const a=n.body;return!(a instanceof Blob)||a.size>20*1024*1024?k({error:"Файл слишком большой"},413):k({url:await ie(a)})}return k({error:"Недоступно в локальном редакторе"},404)}catch(a){return k({error:a.message},500)}}}async function re(e){const t=new TextEncoder().encode(JSON.stringify({version:1,settings:e})),n=new Uint8Array(await new Response(new Blob([t]).stream().pipeThrough(new CompressionStream("gzip"))).arrayBuffer());let i="";for(const a of n)i+=String.fromCharCode(a);return btoa(i).replaceAll("+","-").replaceAll("/","_").replaceAll("=","")}function F(e){if(!e||e.version!==1||typeof e.settings!="object"||!e.settings)throw new Error("Неверный файл приглашения");const t=e.settings;if(typeof t.question!="string"||t.question.length>300||!Array.isArray(t.activities)||t.activities.length>6||!Array.isArray(t.album)||t.album.length>12)throw new Error("Неверный формат приглашения");const n=JSON.parse(JSON.stringify(t),(a,o)=>["__proto__","constructor","prototype"].includes(a)?void 0:o);if(n.tracking){if(!/^[a-f0-9-]{36}$/.test(n.tracking.id||"")||!/^[A-Za-z0-9_-]{43}$/.test(n.tracking.submitToken||""))throw new Error("Неверные данные сохранения ответов");n.tracking={id:n.tracking.id,submitToken:n.tracking.submitToken}}const i=[n.image1,n.image2,n.imageDate,n.imageAct,n.imageFinal,n.scheduledSticker,n.music,n.voice,...n.album.map(a=>a.url)];for(const a of i)if(a&&(typeof a!="string"||!/^(?:\/(?!\/)|https?:\/\/|data:(?:image|audio)\/)/i.test(a)))throw new Error("Неподдерживаемая ссылка на файл");for(const a of n.activities)if(!a||typeof a.name!="string"||typeof a.emoji!="string")throw new Error("Неверный список занятий");return n}async function le(){const e=location.hash.slice(8).replaceAll("-","+").replaceAll("_","/");if(e.length>4e7)throw new Error("Приглашение слишком большое");const t=Uint8Array.from(atob(e),s=>s.charCodeAt(0)),i=new Blob([t]).stream().pipeThrough(new DecompressionStream("gzip")).getReader();let a=0;const o=[];for(;;){const{value:s,done:r}=await i.read();if(r)break;if(a+=s.length,a>5e7)throw await i.cancel(),new Error("Приглашение слишком большое");o.push(s)}return F(JSON.parse(await new Blob(o).text()))}function ce(e,t){const n=URL.createObjectURL(e),i=document.createElement("a");i.href=n,i.download=t,i.click(),setTimeout(()=>URL.revokeObjectURL(n),3e3)}async function de(e){var f;const t=structuredClone(e),n=await K(t);t.tracking=n.tracking,await L("last-invite",t);const i=await re(t),a=Y(location.origin,i);(f=document.getElementById("createdDialog"))==null||f.remove();const o=document.createElement("dialog");o.id="createdDialog",o.className="created-dialog",o.innerHTML='<div class="created-media"></div><h2>Приглашение готово!</h2><p class="muted">Всё сохранено в этом браузере. Откройте приглашение и попробуйте его как получатель.</p><div class="created-actions"><a class="btn" id="openInvite" target="_blank" rel="noopener">Открыть приглашение 💌</a><button class="btn ghost" id="copyInvite" type="button">Скопировать ссылку</button><button class="btn ghost" id="exportInvite" type="button">Скачать приглашение</button><button class="btn ghost" id="closeCreated" type="button">Продолжить редактирование</button></div><p class="hint" id="shareHint"></p><p role="status" id="createdStatus"></p>',document.body.append(o),window.renderMedia(o.querySelector(".created-media"),"/stickers/s1.json"),o.querySelector("#openInvite").href=a;const s=document.createElement("a");s.className="btn ghost",s.href=n.ownerUrl,s.target="_blank",s.rel="noopener",s.textContent="Посмотреть ответы гостей";const r=document.createElement("p");r.className="hint",r.textContent="Сохраните личную ссылку на ответы. Она также доступна в разделе «Мои приглашения и ответы» на этом устройстве.";const l=document.createElement("button");l.type="button",l.className="btn ghost",l.textContent="Скопировать личную ссылку на ответы",l.onclick=async()=>{try{await navigator.clipboard.writeText(n.ownerUrl),o.querySelector("#createdStatus").textContent="Личная ссылка скопирована. Сохраните её только для себя."}catch{o.querySelector("#createdStatus").textContent="Откройте ответы и скопируйте адрес страницы."}},o.querySelector(".created-actions").append(s,l,r);const c=["localhost","127.0.0.1"].includes(location.hostname);o.querySelector("#shareHint").textContent=c?"Сейчас ссылка открывается на этом компьютере. Для отправки другому человеку проект нужно разместить в интернете.":"В ссылке содержится само приглашение. Её можно отправить получателю.",a.length>6e4&&(o.querySelector("#copyInvite").disabled=!0,o.querySelector("#shareHint").textContent+=" С добавленными файлами ссылка слишком длинная — скачайте приглашение."),o.querySelector("#copyInvite").onclick=async()=>{try{await navigator.clipboard.writeText(a),o.querySelector("#createdStatus").textContent="Ссылка скопирована ✓"}catch{o.querySelector("#createdStatus").textContent="Браузер не разрешил копирование. Откройте приглашение и скопируйте адрес."}},o.querySelector("#exportInvite").onclick=()=>ce(new Blob([JSON.stringify({version:1,settings:t},null,2)],{type:"application/json"}),"приглашение.invitik.json"),o.querySelector("#closeCreated").onclick=()=>o.close(),o.addEventListener("close",()=>{window.renderMedia(o.querySelector(".created-media"),""),o.remove(),document.getElementById("submitBtn").focus()},{once:!0}),o.showModal()}function pe(){const e=document.createElement("div");e.className="local-tools",e.innerHTML='<button type="button" class="btn ghost mini" id="importInvite">Открыть сохранённое приглашение</button><input type="file" accept=".json" hidden id="importFile"><span class="hint" role="status" id="importStatus"></span>',document.querySelector("main.wrap").append(e),Q(document.querySelector("main.wrap"));const t=e.querySelector("input");e.querySelector("button").onclick=()=>t.click(),t.onchange=async()=>{try{const n=t.files[0];if(!n)return;if(n.size>5e7)throw new Error("Файл слишком большой");const i=F(JSON.parse(await n.text()));window.InviteEditor.hydrate(i),window.InviteEditor.goStep(0),e.querySelector("#importStatus").textContent="Приглашение загружено"}catch(n){e.querySelector("#importStatus").textContent=n.message}t.value=""}}async function ue(e){var B,$;const t=await ee(e),n=window.InviteEditor;n.hydrate(e),document.body.classList.add("recipient-mode"),document.title=e.question||"Для тебя 💌";const i=d=>document.getElementById(d),a=i("pvScreen"),o=i("pvContent"),s=i("pvBody");let r=t.data.date||"",l=t.data.time||"",c=t.data.activity||"",b=!!t.data.saved,f;const v=document.createElement("button");v.className="guest-music",v.type="button",v.textContent="Выключить музыку",v.hidden=!e.music,v.onclick=()=>{window.Music.muted=!window.Music.muted,window.Music._fadeTo(window.Music.muted?0:window.Music.volume,250),v.textContent=window.Music.muted?"Включить музыку":"Выключить музыку"},document.body.append(v);const w=(d,h)=>{const u=document.createElement("button");return u.className="mini-btn mini-yes",u.type="button",u.textContent=d,u.onclick=h,u},E=d=>{let h=s.querySelector(".guest-status");h||(h=document.createElement("p"),h.className="guest-status",h.role="status",s.append(h)),h.textContent=d};function x(d){const h=n.state.opening;if(d===0&&(n.state.opening="none"),n.goStep(d),n.state.opening=h,window.spawnVibe(a,e.theme,!1),o.scrollTop=0,o.animate([{opacity:0,transform:"translateY(12px)"},{opacity:1,transform:"translateY(0)"}],{duration:350,easing:"ease-out"}),d===0){const u=s.querySelector(".pv-answers"),p=u.cloneNode(!0);u.replaceWith(p),window.wireAnswers({yes:p.querySelector(".mini-yes"),no:p.querySelector(".mini-no"),zone:p,bounds:a,yesAnim:e.yesAnim,noAnim:e.noAnim,onYes:()=>{window.Music.start(e.music),setTimeout(()=>x(1),350)}})}else if(d===1)s.querySelector("button").onclick=()=>x(2);else if(d===2){s.replaceChildren();const u=window.DateOptions.normalize(e.dateOptions);if(e.dateMode==="suggested"&&u.length){const p=document.createElement("div");p.className="guest-options";for(const g of u){const T=w(window.DateOptions.label(g),()=>{[r,l]=g.split("T"),p.querySelectorAll("button").forEach(_=>_.setAttribute("aria-pressed",String(_===T)))});T.setAttribute("aria-pressed","false"),p.append(T)}s.append(p),s.append(w("Предложить своё время",()=>{s.replaceChildren(),R()})),s.append(w(e.dateBtn||"Подтвердить 💫",q))}else R()}else if(d===3){s.replaceChildren();const u=document.createElement("div");u.className="act-cards";for(const p of e.activities.filter(g=>g.name.trim())){const g=window.activityCard(p,!0);g.onclick=()=>{c=p.name,x(4)},u.append(g)}s.append(u)}else{const u=r?new Date(r+"T12:00").toLocaleDateString("ru-RU",{weekday:"long",day:"numeric",month:"long"}):"";if(i("pvSub").textContent=(e.finalDesc||"").replaceAll("{date}",u).replaceAll("{time}",l).replaceAll("{activity}",c),s.replaceChildren(),window.heartsBurst(a),e.album.length){const m=document.createElement("div");m.className="guest-album",m.setAttribute("aria-label","Наши моменты"),m.tabIndex=0;for(const S of e.album){const I=document.createElement("figure"),O=document.createElement("img");O.src=S.url,O.alt=S.caption||"Наш момент";const M=document.createElement("figcaption");M.textContent=S.caption||"",I.append(O,M),m.append(I)}s.append(m)}if(e.voice){const m=document.createElement("audio");m.src=e.voice,m.controls=!0,m.className="guest-audio",m.setAttribute("aria-label","Голосовое сообщение"),s.append(m)}if(e.secretMsg){const m=document.createElement("details");m.className="guest-secret";const S=document.createElement("summary");S.textContent="Открыть секретное сообщение 💌";const I=document.createElement("p");I.textContent=e.secretMsg,m.append(S,I),s.append(m)}s.append(w("Добавить в календарь",()=>me(e.finalTitle,r,l,c)));const p=w("Изменить ответ",()=>{b=!1,x(2)});s.append(p);const g={name:t.data.name||"",date:r,time:l,activity:c},T=e.tracking?"Ответ сохранён и доступен автору приглашения.":"Результат сохранён на этом устройстве. У этой старой ссылки нет отправки ответа автору.",_=async()=>{p.disabled=!0,E("Сохраняем ваш ответ…"),t.save({...g,saved:!1});try{const m=await t.send(g);E(T+(m?" Можно закрыть страницу — результат останется по этой ссылке.":" Браузер запретил сохранение на устройстве: после перезагрузки результат может не восстановиться."))}catch(m){E("Ответ не отправлен: "+m.message);const S=w("Повторить сохранение",()=>{S.remove(),_()});s.append(S)}finally{p.disabled=!1}};b?(E(T),b=!1):_()}}function R(){const d=document.createElement("div");d.className="guest-dates",d.innerHTML='<label>Дата<input class="input" type="date" id="guestDate" required></label><label>Время<input class="input" type="time" id="guestTime" required></label>',s.append(d);const h=new Date,u=p=>String(p).padStart(2,"0");i("guestDate").min=`${h.getFullYear()}-${u(h.getMonth()+1)}-${u(h.getDate())}`,i("guestDate").value=r,i("guestTime").value=l,i("guestDate").oninput=p=>r=p.target.value,i("guestTime").oninput=p=>l=p.target.value,s.append(w(e.dateBtn||"Подтвердить 💫",q))}function q(){if(!window.DateOptions.valid(`${r}T${l}`)){E("Выберите дату и время встречи");return}const d=window.DateOptions.error({dateMode:"suggested",dateOptions:[`${r}T${l}`]});if(d){E(d);return}x(3)}const U=r&&l&&c&&window.DateOptions.valid(`${r}T${l}`)&&e.activities.some(d=>d.name===c);x(U?4:0),document.documentElement.classList.add("recipient-page");const P=getComputedStyle(a).backgroundImage;document.documentElement.style.backgroundImage=P;const D=(B=P.match(/rgba?\([^)]+\)/))==null?void 0:B[0];if(D&&(document.documentElement.style.backgroundColor=D,($=document.querySelector('meta[name="theme-color"]'))==null||$.setAttribute("content",D)),!U)if(e.opening==="scheduled"){i("pvImage").style.display="none",i("pvTitle").style.display="none";const d=()=>{const h=Date.parse(e.openAt)-Date.now();Number.isFinite(h)&&h>0?(s.querySelector(".schedule-lock")||window.ScheduledOpening.mount(s,{ready:!1,sticker:e.scheduledSticker,title:e.openingTitle,hint:e.openingHint}),window.ScheduledOpening.update(s,h)):(clearInterval(f),window.ScheduledOpening.mount(s,{ready:!0,sticker:e.scheduledSticker,title:e.openingTitle,hint:e.openingHint}),s.querySelector("[data-schedule-open]").onclick=()=>x(0))};f=setInterval(d,1e3),d()}else e.opening!=="none"&&window.InviteOpening.mount(a,{variant:e.opening,theme:e.theme,target:o,title:e.openingTitle,hint:e.openingHint,onOpen:()=>{}})}function me(e,t,n,i){const a=f=>String(f||"").replaceAll("\\","\\\\").replaceAll(`
`,"\\n").replaceAll(",","\\,").replaceAll(";","\\;").replaceAll("\r",""),o=new Date(`${t}T${n}`),s=new Date(o.getTime()+36e5),r=f=>f.toISOString().replaceAll("-","").replaceAll(":","").replace(/\.\d{3}/,""),l=["BEGIN:VCALENDAR","VERSION:2.0","PRODID:-//Invitik Local//RU","BEGIN:VEVENT",`UID:${crypto.randomUUID()}@invitik-local`,`DTSTAMP:${r(new Date)}`,`DTSTART:${r(o)}`,`DTEND:${r(s)}`,`SUMMARY:${a(e)}`,`DESCRIPTION:${a(i)}`,"END:VEVENT","END:VCALENDAR",""].join(`\r
`),c=URL.createObjectURL(new Blob([l],{type:"text/calendar;charset=utf-8"})),b=document.createElement("a");b.href=c,b.download="свидание.ics",b.click(),setTimeout(()=>URL.revokeObjectURL(c),3e3)}async function be(){if(location.hash.startsWith("#results=")){X();return}if(window.assetURL=A,window.LOCAL_EMOJI=new Set(te),document.getElementById("app").innerHTML=ne,document.querySelectorAll('a[href="/"]').forEach(e=>e.href=A("/")),window.goal=()=>{},window.INVITIK_LANG="ru",window.INVITIK_LOCALE="ru-RU",window.INVITE_GUEST=location.hash.startsWith("#invite="),window.LocalInvites={created:de},oe(),await y(()=>import("./vibe-BL8P8MK5.js"),[]),await y(()=>import("./answers-BrfyQBTs.js"),[]),await y(()=>import("./scroll-cue-CZBRWbMV.js"),[]),await y(()=>import("./scheduled-opening-DwdNxG5q.js"),[]),await y(()=>import("./opening-C4a7Wq2X.js"),[]),await y(()=>import("./recent-invites-DP5SCVSd.js"),[]),await y(()=>import("./drafts-CqbIBGQV.js"),[]),await y(()=>import("./creator-kit-Bukfhq1C.js"),[]),await y(()=>import("./date-options-BX8C4rUX.js"),[]),await y(()=>import("./date-time-fields-PxFQD5l1.js"),[]),await y(()=>import("./create-Cfe3pRRt.js"),[]),window.INVITE_GUEST)try{await ue(await le())}catch{document.getElementById("app").innerHTML=`<main class="wrap"><section class="card panel"><h2>Не удалось открыть приглашение</h2><p>Ссылка повреждена или скопирована не полностью.</p><a class="btn" href="${A("/create/")}">Создать приглашение</a></section></main>`}else{pe();const{mountHalloween:e}=await y(async()=>{const{mountHalloween:t}=await import("./halloween-1RQFUe5o.js");return{mountHalloween:t}},[]);e()}}be().catch(e=>{console.error(e),document.getElementById("app").textContent="Не удалось запустить редактор. Перезагрузите страницу."});
