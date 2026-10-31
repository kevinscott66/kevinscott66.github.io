(function(){const a=document.createElement("link").relList;if(a&&a.supports&&a.supports("modulepreload"))return;for(const t of document.querySelectorAll('link[rel="modulepreload"]'))i(t);new MutationObserver(t=>{for(const s of t)if(s.type==="childList")for(const o of s.addedNodes)o.tagName==="LINK"&&o.rel==="modulepreload"&&i(o)}).observe(document,{childList:!0,subtree:!0});function n(t){const s={};return t.integrity&&(s.integrity=t.integrity),t.referrerPolicy&&(s.referrerPolicy=t.referrerPolicy),t.crossOrigin==="use-credentials"?s.credentials="include":t.crossOrigin==="anonymous"?s.credentials="omit":s.credentials="same-origin",s}function i(t){if(t.ep)return;t.ep=!0;const s=n(t);fetch(t.href,s)}})();const P="modulepreload",B=function(e){return"/invitik/"+e},C={},h=function(a,n,i){let t=Promise.resolve();if(n&&n.length>0){let o=function(m){return Promise.all(m.map(p=>Promise.resolve(p).then(b=>({status:"fulfilled",value:b}),b=>({status:"rejected",reason:b}))))};document.getElementsByTagName("link");const l=document.querySelector("meta[property=csp-nonce]"),g=(l==null?void 0:l.nonce)||(l==null?void 0:l.getAttribute("nonce"));t=o(n.map(m=>{if(m=B(m),m in C)return;C[m]=!0;const p=m.endsWith(".css"),b=p?'[rel="stylesheet"]':"";if(document.querySelector(`link[href="${m}"]${b}`))return;const v=document.createElement("link");if(v.rel=p?"stylesheet":P,p||(v.as="script"),v.crossOrigin="",v.href=m,g&&v.setAttribute("nonce",g),document.head.appendChild(v),p)return new Promise((w,_)=>{v.addEventListener("load",w),v.addEventListener("error",()=>_(new Error(`Unable to preload CSS for ${m}`)))})}))}function s(o){const l=new Event("vite:preloadError",{cancelable:!0});if(l.payload=o,window.dispatchEvent(l),!l.defaultPrevented)throw o}return t.then(o=>{for(const l of o||[])l.status==="rejected"&&s(l.reason);return a().catch(s)})},R="/invitik/";function x(e,a=R){return typeof e!="string"||!e.startsWith("/")||e.startsWith("//")||a==="/"||e.startsWith(a)?e:a+e.slice(1)}function q(e,a,n=R){return`${e}${n}#invite=${a}`}const M=["1f30a","1f32e","1f338","1f339","1f34b","1f354","1f355","1f35d","1f366","1f375","1f377","1f379","1f37d_fe0f","1f37f","1f381","1f383","1f389","1f3ac","1f3ad","1f3b2","1f3b3","1f3e0","1f47b","1f480","1f48c","1f495","1f496","1f498","1f49d","1f525","1f52e","1f602","1f608","1f60d","1f618","1f63b","1f680","1f6b2","1f942","1f957","1f970","1f987","1f9cb","2615","26a1","2728","2764_fe0f"],U=`
  
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
`,V="invitik-local-v1",$=()=>new Promise((e,a)=>{const n=indexedDB.open(V,1);n.onupgradeneeded=()=>n.result.createObjectStore("records"),n.onsuccess=()=>e(n.result),n.onerror=()=>a(new Error("Браузер не разрешил сохранить приглашение"))});async function k(e,a,n=!1){const i=await $();try{return await new Promise((t,s)=>{const o=i.transaction("records",a===void 0&&!n?"readonly":"readwrite"),l=o.objectStore("records"),g=n?l.delete(e):a===void 0?l.get(e):l.put(a,e);o.oncomplete=()=>t(g.result),o.onerror=()=>s(new Error("Не хватает места для сохранения. Попробуйте уменьшить файлы.")),o.onabort=()=>s(new Error("Не удалось сохранить данные"))})}finally{i.close()}}const E=(e,a=200)=>new Response(JSON.stringify(e),{status:a,headers:{"Content-Type":"application/json"}}),H=e=>new Promise((a,n)=>{const i=new FileReader;i.onload=()=>a(i.result),i.onerror=n,i.readAsDataURL(e)});function j(){const e=window.fetch.bind(window);window.fetch=async(a,n={})=>{const i=new URL(typeof a=="string"?a:a.url,location.href);if(i.origin!==location.origin||!i.pathname.startsWith("/api/"))return e(a,n);try{if(i.pathname==="/api/music")return e(x("/music.json"));if(i.pathname.startsWith("/api/drafts")){const t=i.pathname.split("/")[3]||crypto.randomUUID(),s=`draft:${t}`;if(n.method==="DELETE")return await k(s,null,!0),E({ok:!0});if(n.method==="POST"||n.method==="PUT")return await k(s,JSON.parse(n.body)),E({token:t});const o=await k(s);return o?E(o):E({error:"Черновик не найден"},404)}if(i.pathname.startsWith("/api/upload/")){const t=n.body;return!(t instanceof Blob)||t.size>20*1024*1024?E({error:"Файл слишком большой"},413):E({url:await H(t)})}return E({error:"Недоступно в локальном редакторе"},404)}catch(t){return E({error:t.message},500)}}}async function z(e){const a=new TextEncoder().encode(JSON.stringify({version:1,settings:e})),n=new Uint8Array(await new Response(new Blob([a]).stream().pipeThrough(new CompressionStream("gzip"))).arrayBuffer());let i="";for(const t of n)i+=String.fromCharCode(t);return btoa(i).replaceAll("+","-").replaceAll("/","_").replaceAll("=","")}function N(e){if(!e||e.version!==1||typeof e.settings!="object"||!e.settings)throw new Error("Неверный файл приглашения");const a=e.settings;if(typeof a.question!="string"||a.question.length>300||!Array.isArray(a.activities)||a.activities.length>6||!Array.isArray(a.album)||a.album.length>12)throw new Error("Неверный формат приглашения");const n=JSON.parse(JSON.stringify(a),(t,s)=>["__proto__","constructor","prototype"].includes(t)?void 0:s),i=[n.image1,n.image2,n.imageDate,n.imageAct,n.imageFinal,n.scheduledSticker,n.music,n.voice,...n.album.map(t=>t.url)];for(const t of i)if(t&&(typeof t!="string"||!/^(?:\/(?!\/)|https?:\/\/|data:(?:image|audio)\/)/i.test(t)))throw new Error("Неподдерживаемая ссылка на файл");for(const t of n.activities)if(!t||typeof t.name!="string"||typeof t.emoji!="string")throw new Error("Неверный список занятий");return n}async function F(){const e=location.hash.slice(8).replaceAll("-","+").replaceAll("_","/");if(e.length>4e7)throw new Error("Приглашение слишком большое");const a=Uint8Array.from(atob(e),o=>o.charCodeAt(0)),i=new Blob([a]).stream().pipeThrough(new DecompressionStream("gzip")).getReader();let t=0;const s=[];for(;;){const{value:o,done:l}=await i.read();if(l)break;if(t+=o.length,t>5e7)throw await i.cancel(),new Error("Приглашение слишком большое");s.push(o)}return N(JSON.parse(await new Blob(s).text()))}function J(e,a){const n=URL.createObjectURL(e),i=document.createElement("a");i.href=n,i.download=a,i.click(),setTimeout(()=>URL.revokeObjectURL(n),3e3)}async function W(e){var l;const a=structuredClone(e);await k("last-invite",a);const n=await z(a),i=q(location.origin,n);(l=document.getElementById("createdDialog"))==null||l.remove();const t=document.createElement("dialog");t.id="createdDialog",t.className="created-dialog",t.innerHTML='<div class="created-media"></div><h2>Приглашение готово!</h2><p class="muted">Всё сохранено в этом браузере. Откройте приглашение и попробуйте его как получатель.</p><div class="created-actions"><a class="btn" id="openInvite" target="_blank" rel="noopener">Открыть приглашение 💌</a><button class="btn ghost" id="copyInvite" type="button">Скопировать ссылку</button><button class="btn ghost" id="exportInvite" type="button">Скачать приглашение</button><button class="btn ghost" id="closeCreated" type="button">Продолжить редактирование</button></div><p class="hint" id="shareHint"></p><p role="status" id="createdStatus"></p>',document.body.append(t),window.renderMedia(t.querySelector(".created-media"),"/stickers/s1.json"),t.querySelector("#openInvite").href=i;const s=["localhost","127.0.0.1"].includes(location.hostname);t.querySelector("#shareHint").textContent=s?"Сейчас ссылка открывается на этом компьютере. Для отправки другому человеку проект нужно разместить в интернете.":"В ссылке содержится само приглашение. Её можно отправить получателю.",i.length>6e4&&(t.querySelector("#copyInvite").disabled=!0,t.querySelector("#shareHint").textContent+=" С добавленными файлами ссылка слишком длинная — скачайте приглашение."),t.querySelector("#copyInvite").onclick=async()=>{try{await navigator.clipboard.writeText(i),t.querySelector("#createdStatus").textContent="Ссылка скопирована ✓"}catch{t.querySelector("#createdStatus").textContent="Браузер не разрешил копирование. Откройте приглашение и скопируйте адрес."}},t.querySelector("#exportInvite").onclick=()=>J(new Blob([JSON.stringify({version:1,settings:a},null,2)],{type:"application/json"}),"приглашение.invitik.json"),t.querySelector("#closeCreated").onclick=()=>t.close(),t.addEventListener("close",()=>{window.renderMedia(t.querySelector(".created-media"),""),t.remove(),document.getElementById("submitBtn").focus()},{once:!0}),t.showModal()}function G(){const e=document.createElement("div");e.className="local-tools",e.innerHTML='<button type="button" class="btn ghost mini" id="importInvite">Открыть сохранённое приглашение</button><input type="file" accept=".json" hidden id="importFile"><span class="hint" role="status" id="importStatus"></span>',document.querySelector("main.wrap").append(e);const a=e.querySelector("input");e.querySelector("button").onclick=()=>a.click(),a.onchange=async()=>{try{const n=a.files[0];if(!n)return;if(n.size>5e7)throw new Error("Файл слишком большой");const i=N(JSON.parse(await n.text()));window.InviteEditor.hydrate(i),window.InviteEditor.goStep(0),e.querySelector("#importStatus").textContent="Приглашение загружено"}catch(n){e.querySelector("#importStatus").textContent=n.message}a.value=""}}function Y(e){var L,D;const a=window.InviteEditor;a.hydrate(e),document.body.classList.add("recipient-mode"),document.title=e.question||"Для тебя 💌";const n=c=>document.getElementById(c),i=n("pvScreen"),t=n("pvContent"),s=n("pvBody");let o="",l="",g="",m;const p=document.createElement("button");p.className="guest-music",p.type="button",p.textContent="Выключить музыку",p.hidden=!e.music,p.onclick=()=>{window.Music.muted=!window.Music.muted,window.Music._fadeTo(window.Music.muted?0:window.Music.volume,250),p.textContent=window.Music.muted?"Включить музыку":"Выключить музыку"},document.body.append(p);const b=(c,u)=>{const d=document.createElement("button");return d.className="mini-btn mini-yes",d.type="button",d.textContent=c,d.onclick=u,d},v=c=>{let u=s.querySelector(".guest-status");u||(u=document.createElement("p"),u.className="guest-status",u.role="status",s.append(u)),u.textContent=c};function w(c){const u=a.state.opening;if(c===0&&(a.state.opening="none"),a.goStep(c),a.state.opening=u,window.spawnVibe(i,e.theme,!1),t.scrollTop=0,t.animate([{opacity:0,transform:"translateY(12px)"},{opacity:1,transform:"translateY(0)"}],{duration:350,easing:"ease-out"}),c===0){const d=s.querySelector(".pv-answers"),r=d.cloneNode(!0);d.replaceWith(r),window.wireAnswers({yes:r.querySelector(".mini-yes"),no:r.querySelector(".mini-no"),zone:r,bounds:i,yesAnim:e.yesAnim,noAnim:e.noAnim,onYes:()=>{window.Music.start(e.music),setTimeout(()=>w(1),350)}})}else if(c===1)s.querySelector("button").onclick=()=>w(2);else if(c===2){s.replaceChildren();const d=window.DateOptions.normalize(e.dateOptions);if(e.dateMode==="suggested"&&d.length){const r=document.createElement("div");r.className="guest-options";for(const f of d){const y=b(window.DateOptions.label(f),()=>{[o,l]=f.split("T"),r.querySelectorAll("button").forEach(S=>S.setAttribute("aria-pressed",String(S===y)))});y.setAttribute("aria-pressed","false"),r.append(y)}s.append(r),s.append(b("Предложить своё время",()=>{s.replaceChildren(),_()})),s.append(b(e.dateBtn||"Подтвердить 💫",I))}else _()}else if(c===3){s.replaceChildren();const d=document.createElement("div");d.className="act-cards";for(const r of e.activities.filter(f=>f.name.trim())){const f=window.activityCard(r,!0);f.onclick=()=>{g=r.name,w(4)},d.append(f)}s.append(d)}else{const d=o?new Date(o+"T12:00").toLocaleDateString("ru-RU",{weekday:"long",day:"numeric",month:"long"}):"";if(n("pvSub").textContent=(e.finalDesc||"").replaceAll("{date}",d).replaceAll("{time}",l).replaceAll("{activity}",g),s.replaceChildren(),window.heartsBurst(i),e.album.length){const r=document.createElement("div");r.className="guest-album",r.setAttribute("aria-label","Наши моменты"),r.tabIndex=0;for(const f of e.album){const y=document.createElement("figure"),S=document.createElement("img");S.src=f.url,S.alt=f.caption||"Наш момент";const O=document.createElement("figcaption");O.textContent=f.caption||"",y.append(S,O),r.append(y)}s.append(r)}if(e.voice){const r=document.createElement("audio");r.src=e.voice,r.controls=!0,r.className="guest-audio",r.setAttribute("aria-label","Голосовое сообщение"),s.append(r)}if(e.secretMsg){const r=document.createElement("details");r.className="guest-secret";const f=document.createElement("summary");f.textContent="Открыть секретное сообщение 💌";const y=document.createElement("p");y.textContent=e.secretMsg,r.append(f,y),s.append(r)}s.append(b("Добавить в календарь",()=>K(e.finalTitle,o,l,g))),v("Ваш выбор готов. До встречи!")}}function _(){const c=document.createElement("div");c.className="guest-dates",c.innerHTML='<label>Дата<input class="input" type="date" id="guestDate" required></label><label>Время<input class="input" type="time" id="guestTime" required></label>',s.append(c);const u=new Date,d=r=>String(r).padStart(2,"0");n("guestDate").min=`${u.getFullYear()}-${d(u.getMonth()+1)}-${d(u.getDate())}`,n("guestDate").value=o,n("guestTime").value=l,n("guestDate").oninput=r=>o=r.target.value,n("guestTime").oninput=r=>l=r.target.value,s.append(b(e.dateBtn||"Подтвердить 💫",I))}function I(){if(!window.DateOptions.valid(`${o}T${l}`)){v("Выберите дату и время встречи");return}const c=window.DateOptions.error({dateMode:"suggested",dateOptions:[`${o}T${l}`]});if(c){v(c);return}w(3)}w(0),document.documentElement.classList.add("recipient-page");const A=getComputedStyle(i).backgroundImage;document.documentElement.style.backgroundImage=A;const T=(L=A.match(/rgba?\([^)]+\)/))==null?void 0:L[0];if(T&&(document.documentElement.style.backgroundColor=T,(D=document.querySelector('meta[name="theme-color"]'))==null||D.setAttribute("content",T)),e.opening==="scheduled"){n("pvImage").style.display="none",n("pvTitle").style.display="none";const c=()=>{const u=Date.parse(e.openAt)-Date.now();Number.isFinite(u)&&u>0?(s.querySelector(".schedule-lock")||window.ScheduledOpening.mount(s,{ready:!1,sticker:e.scheduledSticker,title:e.openingTitle,hint:e.openingHint}),window.ScheduledOpening.update(s,u)):(clearInterval(m),window.ScheduledOpening.mount(s,{ready:!0,sticker:e.scheduledSticker,title:e.openingTitle,hint:e.openingHint}),s.querySelector("[data-schedule-open]").onclick=()=>w(0))};m=setInterval(c,1e3),c()}else e.opening!=="none"&&window.InviteOpening.mount(i,{variant:e.opening,theme:e.theme,target:t,title:e.openingTitle,hint:e.openingHint,onOpen:()=>{}})}function K(e,a,n,i){const t=b=>String(b||"").replaceAll("\\","\\\\").replaceAll(`
`,"\\n").replaceAll(",","\\,").replaceAll(";","\\;").replaceAll("\r",""),s=new Date(`${a}T${n}`),o=new Date(s.getTime()+36e5),l=b=>b.toISOString().replaceAll("-","").replaceAll(":","").replace(/\.\d{3}/,""),g=["BEGIN:VCALENDAR","VERSION:2.0","PRODID:-//Invitik Local//RU","BEGIN:VEVENT",`UID:${crypto.randomUUID()}@invitik-local`,`DTSTAMP:${l(new Date)}`,`DTSTART:${l(s)}`,`DTEND:${l(o)}`,`SUMMARY:${t(e)}`,`DESCRIPTION:${t(i)}`,"END:VEVENT","END:VCALENDAR",""].join(`\r
`),m=URL.createObjectURL(new Blob([g],{type:"text/calendar;charset=utf-8"})),p=document.createElement("a");p.href=m,p.download="свидание.ics",p.click(),setTimeout(()=>URL.revokeObjectURL(m),3e3)}async function Z(){if(window.assetURL=x,window.LOCAL_EMOJI=new Set(M),document.getElementById("app").innerHTML=U,document.querySelectorAll('a[href="/"]').forEach(e=>e.href=x("/")),window.goal=()=>{},window.INVITIK_LANG="ru",window.INVITIK_LOCALE="ru-RU",window.INVITE_GUEST=location.hash.startsWith("#invite="),window.LocalInvites={created:W},j(),await h(()=>import("./vibe-BL8P8MK5.js"),[]),await h(()=>import("./answers-BrfyQBTs.js"),[]),await h(()=>import("./scroll-cue-CZBRWbMV.js"),[]),await h(()=>import("./scheduled-opening-DwdNxG5q.js"),[]),await h(()=>import("./opening-C4a7Wq2X.js"),[]),await h(()=>import("./recent-invites-DP5SCVSd.js"),[]),await h(()=>import("./drafts-CqbIBGQV.js"),[]),await h(()=>import("./creator-kit-Bukfhq1C.js"),[]),await h(()=>import("./date-options-BX8C4rUX.js"),[]),await h(()=>import("./date-time-fields-PxFQD5l1.js"),[]),await h(()=>import("./create-Cfe3pRRt.js"),[]),window.INVITE_GUEST)try{Y(await F())}catch{document.getElementById("app").innerHTML=`<main class="wrap"><section class="card panel"><h2>Не удалось открыть приглашение</h2><p>Ссылка повреждена или скопирована не полностью.</p><a class="btn" href="${x("/create/")}">Создать приглашение</a></section></main>`}else{G();const{mountHalloween:e}=await h(async()=>{const{mountHalloween:a}=await import("./halloween-1RQFUe5o.js");return{mountHalloween:a}},[]);e()}}Z().catch(e=>{console.error(e),document.getElementById("app").textContent="Не удалось запустить редактор. Перезагрузите страницу."});
