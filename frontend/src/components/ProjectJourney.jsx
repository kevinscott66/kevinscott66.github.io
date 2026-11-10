import { mainProjects } from "../projects.js";
import { Out } from "./Out.jsx";
import { ImageAsset } from "./ImageAsset.jsx";
import { MoveUpRight, ArrowDown } from "lucide-react";
export function ProjectJourney({ lang, ru }) {
  return (
    <>
      {mainProjects.map((p, i) => (
        <section
          className={`chapter chapter-${p.id}`}
          id={p.id}
          key={p.id}
          style={{ "--project": p.color }}
        >
          <div className="chapter-copy">
            <h2 id={p.id + "-title"} tabIndex="-1">
              {p.name}
            </h2>
            <h3>{p[lang][0]}</h3>
            <p>{p[lang][1]}</p>
            <p className="contribution">{p[lang][2]}</p>
            <div className="chapter-actions">
              <Out
                href={`https://dobropalm.tech/${ru ? "ru/" : ""}case-studies/${p.case}/`}
                className="button primary"
              >
                {ru ? "Разобрать кейс" : "Read the case"}
              </Out>
              <Out href={p.source}>{ru ? "Исходники" : "Source"}</Out>
              {p.live && (
                <Out href={p.live}>
                  {ru ? "Открыть приложение" : "Open app"}
                </Out>
              )}
            </div>
            {p.id === "kom17" && (
              <p className="disclosure">
                {ru
                  ? "Скриншот реальной сборки мини-приложения. Пользователь, группы и суммы вымышлены."
                  : "Actual Mini App build. The user, groups and balances are fictional."}
              </p>
            )}
          </div>
          <a
            className="project-screen"
            href={"/assets/media/" + p.image}
            target="_blank"
            rel="noreferrer"
            aria-label={
              ru
                ? `Увеличить интерфейс ${p.name}`
                : `Enlarge ${p.name} screenshot`
            }
          >
            <ImageAsset
              src={"/assets/media/" + p.image}
              alt={
                ru
                  ? `Реальный интерфейс ${p.name}${p.id === "kom17" ? " с демонстрационными данными" : ""}`
                  : `Actual ${p.name} interface${p.id === "kom17" ? " with fictional data" : ""}`
              }
              width={p.id === "kom17" ? 1148 : 590}
              height={p.id === "kom17" ? 1824 : 1280}
              loading="lazy"
            />
            <span>
              {ru ? "Открыть полный экран" : "View full screenshot"}
              <MoveUpRight size={16} />
            </span>
          </a>
          <a
            className="next-chapter"
            href={i < 2 ? "#" + mainProjects[i + 1].id : "#work"}
          >
            {i < 2
              ? mainProjects[i + 1].name
              : ru
                ? "Другие проекты"
                : "More work"}
            <ArrowDown size={17} />
          </a>
        </section>
      ))}
    </>
  );
}
