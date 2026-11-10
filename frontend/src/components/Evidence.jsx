import optimized from "../optimized-images.json";
import { Out } from "./Out.jsx";
export function Evidence({ lang, ru }) {
  return (
    <>
      <section id="demos" className="evidence section">
        <div>
          <h2>{ru ? "Внутри — работающие вещи." : "Working things inside."}</h2>
          <p>
            {ru
              ? "Реальный интерфейс Agent: задачи, согласования и роли. Демонстрационные данные. Локальная задача выполняется в браузере, затем проходит согласование."
              : "Actual Agent interface: tasks, approvals and roles. Sample data. A local task runs in the browser, then goes through approval."}
          </p>
          <p>
            {ru
              ? "Не только картинка: откройте кейсы и исходники, чтобы увидеть решения и их ограничения."
              : "Go beyond the visuals: read the cases and source code for decisions and limitations."}
          </p>
          <Out href="/demos/agent/">
            {ru ? "Попробовать живое демо" : "Try the live demo"}
          </Out>
        </div>
        <video
          controls
          preload="none"
          poster="/assets/media/agent-demo-20261110.webp"
          aria-label={ru ? "Демонстрация Agent" : "Agent demo"}
        >
          <source
            src="/assets/media/agent-demo-20261110.mp4"
            type="video/mp4"
          />
          <track
            kind="captions"
            src={"/assets/media/agent-demo-20261110-" + lang + ".vtt"}
            srcLang={lang}
            label={ru ? "Русский" : "English"}
            default
          />
        </video>
      </section>
      <section className="evidence section">
        <div>
          <h2>
            {ru ? "DeLabs · архив интерфейса" : "DeLabs · interface archive"}
          </h2>
          <p>
            {ru
              ? "Запись предыдущего интерфейса. Актуальная версия доступна по ссылке проекта выше."
              : "A recording of the previous interface. The current version is linked in the project gallery above."}
          </p>
        </div>
        <video
          controls
          preload="none"
          poster={optimized["/assets/media/delabs-walkthrough.png"].src}
        >
          <source src="/assets/media/delabs-walkthrough.mp4" type="video/mp4" />
          <track
            kind="captions"
            src={"/assets/media/delabs-walkthrough-" + lang + ".vtt"}
            srcLang={lang}
            label={ru ? "Русский" : "English"}
            default
          />
        </video>
      </section>
    </>
  );
}
