import { SceneBoundary } from "./components/SceneBoundary.jsx";
import { About } from "./components/About.jsx";
import { Evidence } from "./components/Evidence.jsx";
import { ProjectGallery } from "./components/ProjectGallery.jsx";
import { ProjectJourney } from "./components/ProjectJourney.jsx";
import { Out } from "./components/Out.jsx";
import { useState, useEffect, useCallback, lazy, Suspense } from "react";
import { ArrowUpRight, ArrowRight, Menu, X, ArrowDown } from "lucide-react";
const Scene = lazy(() =>
  import("./Scene.jsx").then((m) => ({ default: m.Scene })),
);
import { mainProjects } from "./projects.js";
import { ImageAsset } from "./components/ImageAsset.jsx";
export function App({ initialLang = "en" }) {
  const [lang] = useState(initialLang),
    [menu, setMenu] = useState(false),
    [filter, setFilter] = useState("all"),
    [simple, setSimple] = useState(false),
    [failed, setFailed] = useState(false),
    [ready, setReady] = useState(false);
  const ru = lang === "ru";
  const fail = useCallback(() => setFailed(true), []);
  useEffect(() => {
    document.documentElement.lang = lang;
    document.title = ru
      ? "DOBROPALM — COREVERSE · Александр Павлович"
      : "DOBROPALM — COREVERSE · Alexander Pavlovich";
  }, [lang, ru]);
  useEffect(() => {
    setReady(true);
    const mq = matchMedia("(prefers-reduced-motion: reduce)");
    const change = () => setSimple(mq.matches);
    change();
    mq.addEventListener("change", change);
    return () => mq.removeEventListener("change", change);
  }, []);
  function skip() {
    setSimple(true);
    setMenu(false);
    setTimeout(() => {
      document.getElementById("agent")?.scrollIntoView({ behavior: "instant" });
      document.getElementById("agent-title")?.focus({ preventScroll: true });
    }, 0);
  }
  const nav = () => (
    <>
      <a href="#agent" onClick={() => setMenu(false)}>
        {ru ? "Проекты" : "Projects"}
      </a>
      <a href="#about" onClick={() => setMenu(false)}>
        {ru ? "Обо мне" : "About"}
      </a>
      <a href="#contact" onClick={() => setMenu(false)}>
        {ru ? "Контакт" : "Contact"}
      </a>
    </>
  );
  return (
    <>
      <a className="skip-link" href="#main">
        {ru ? "К содержимому" : "Skip to content"}
      </a>
      <header className="header">
        <a href="#top" className="brand">
          dobropalm
        </a>
        <span className="universe">COREVERSE</span>
        <nav
          className="desktop-nav"
          aria-label={ru ? "Основная навигация" : "Main navigation"}
        >
          {nav()}
        </nav>
        <a
          className="lang language"
          href={ru ? "/" : "/ru/"}
          aria-label={ru ? "Switch to English" : "Переключить на русский"}
        >
          <span className={ru ? "selected" : ""}>RU</span>
          <span>·</span>
          <span className={!ru ? "selected" : ""}>EN</span>
        </a>
        <button
          className="menu-button"
          onClick={() => setMenu(!menu)}
          aria-label={ru ? "Меню" : "Menu"}
          aria-expanded={menu}
        >
          {menu ? <X /> : <Menu />}
        </button>
        {menu && <nav className="mobile-menu">{nav()}</nav>}
      </header>
      <main id="main">
        <div
          className={`journey ${!ready || simple || failed ? "simple" : ""}`}
        >
          {ready && !simple && !failed && (
            <SceneBoundary onFailure={fail}>
              <Suspense
                fallback={
                  <div className="scene-loading" role="status">
                    {ru ? "Подготавливаю 3D…" : "Preparing 3D…"}
                  </div>
                }
              >
                <Scene still={false} onFailure={fail} />
              </Suspense>
            </SceneBoundary>
          )}
          <section className="hero" id="top">
            <div className="hero-art-fallback" aria-hidden="true">
              <ImageAsset src="/assets/media/agent-dashboard.jpg" alt="Agent" />
            </div>
            <div className="hero-copy">
              <h1>
                {ru ? (
                  <>
                    Из идеи —<br />в работающий
                    <br />
                    <em>продукт.</em>
                  </>
                ) : (
                  <>
                    From idea
                    <br />
                    to a working
                    <br />
                    <em>product.</em>
                  </>
                )}
              </h1>
              <p>
                {ru
                  ? "Александр Павлович. Продуктовая логика, сценарии и проверка. Разработка с AI."
                  : "Alexander Pavlovich. Product logic, workflows and validation. AI-assisted development."}
              </p>
              <div className="hero-actions">
                <a className="button primary" href="#agent">
                  {ru ? "Смотреть проекты" : "Explore projects"}
                  <ArrowRight size={21} />
                </a>
                <a className="button secondary" href="#contact">
                  {ru ? "Связаться" : "Get in touch"}
                </a>
              </div>
              <button className="skip-experience" onClick={skip}>
                {ru ? "Пропустить 3D" : "Skip experience"}
              </button>
              {failed && (
                <p className="fallback-notice">
                  {ru
                    ? "3D недоступно. Все проекты доступны ниже."
                    : "3D is unavailable. All projects are available below."}
                </p>
              )}
            </div>
            <nav
              className="world-nav"
              aria-label={ru ? "Главы проектов" : "Project chapters"}
            >
              {mainProjects.map((p) => (
                <a
                  href={"#" + p.id}
                  key={p.id}
                  style={{ "--project": p.color }}
                >
                  <span className="slash">//</span>
                  <span>
                    <strong>{p.name}</strong>
                    <small>{p[lang][0]}</small>
                  </span>
                  <ArrowDown size={18} />
                </a>
              ))}
            </nav>
          </section>
          <ProjectJourney lang={lang} ru={ru} />
        </div>
        <ProjectGallery
          lang={lang}
          ru={ru}
          filter={filter}
          setFilter={setFilter}
        />
        <Evidence lang={lang} ru={ru} />
        <About lang={lang} ru={ru} />
        <section className="section approach" id="services">
          <h2>
            {ru ? "От задачи до проверки." : "From brief to verification."}
          </h2>
          <p>
            {ru
              ? "Требования → сценарии → архитектурные решения → реализация с AI → проверка результата."
              : "Requirements → workflows → architecture decisions → AI-assisted implementation → validation."}
          </p>
          <div id="collaboration">
            <h3>{ru ? "Форматы сотрудничества" : "Ways to collaborate"}</h3>
            <p>
              {ru
                ? "Junior-задачи с техническим ревью, небольшие проекты и партнёрство. Объём и критерии приёмки согласуем до старта."
                : "Junior tasks with technical review, small projects and partnerships. Scope and acceptance criteria are agreed before work begins."}
            </p>
          </div>
        </section>
        <section className="contact section" id="contact">
          <h2>
            {ru ? (
              <>
                Что создадим
                <br />
                <em>дальше?</em>
              </>
            ) : (
              <>
                What shall we
                <br />
                <em>build next?</em>
              </>
            )}
          </h2>
          <div>
            <p>
              {ru
                ? "Расскажите о задаче, идее или проекте."
                : "Tell me about a problem, idea or project."}
            </p>
            <Out href="https://t.me/dobropalm" className="contact-link">
              Telegram
            </Out>
            <a className="contact-link" href="mailto:hello@dobropalm.tech">
              hello@dobropalm.tech
              <ArrowUpRight />
            </a>
          </div>
        </section>
      </main>
      <footer>
        <a className="brand" href="#top">
          dobropalm
        </a>
        <span>COREVERSE · 2026</span>
        <Out href="https://github.com/kevinscott66">GitHub</Out>
        <button className="mode" onClick={() => setSimple(!simple)}>
          {simple
            ? ru
              ? "Включить 3D"
              : "Enable 3D"
            : ru
              ? "Обычный режим"
              : "Simple mode"}
        </button>
      </footer>
    </>
  );
}
