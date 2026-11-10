import { other } from "../projects.js";
import { ImageAsset } from "./ImageAsset.jsx";
import { ArrowUpRight } from "lucide-react";
export function ProjectGallery({ lang, ru, filter, setFilter }) {
  return (
    <>
      <section id="work" className="work section">
        <div className="section-heading">
          <h2>{ru ? "Ещё пять миров." : "Five more worlds."}</h2>
          <div
            className="filters"
            role="group"
            aria-label={ru ? "Фильтр работ" : "Filter work"}
          >
            {[
              ["all", ru ? "Все" : "All"],
              ["own", ru ? "Свои продукты" : "Own products"],
              ["test", ru ? "Тестовые" : "Assignments"],
            ].map(([id, label]) => (
              <button
                key={id}
                aria-pressed={filter === id}
                onClick={() => setFilter(id)}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
        <p className="result-count" role="status">
          {ru ? "Показано" : "Showing"}{" "}
          {other.filter((p) => filter === "all" || p.type === filter).length} /
          5
        </p>
        <div className="other-grid">
          {other
            .filter((p) => filter === "all" || p.type === filter)
            .map((p) => (
              <a
                id={p.id}
                className="other-project"
                href={p.link}
                target="_blank"
                rel="noreferrer"
                key={p.id}
              >
                <div className="other-image">
                  <ImageAsset
                    src={"/assets/media/" + p.image}
                    sizes="(max-width: 390px) 88vw, (max-width: 1100px) 41vw, 28vw"
                    alt={p.name}
                    loading="lazy"
                  />
                </div>
                <div>
                  <h3>{p.name}</h3>
                  <ArrowUpRight size={24} />
                </div>
                <p>{p[lang]}</p>
              </a>
            ))}
        </div>
      </section>
    </>
  );
}
