import { Out } from "./Out.jsx";
export function About({ lang, ru }) {
  return (
    <>
      <section className="about section" id="about">
        <h2>
          {ru ? (
            <>
              Любопытство.
              <br />
              Логика. Результат.
            </>
          ) : (
            <>
              Curiosity.
              <br />
              Logic. Outcomes.
            </>
          )}
        </h2>
        <div>
          <p>
            {ru
              ? "Я Александр Павлович. Развиваю собственные цифровые продукты: определяю задачи и требования, выбираю интерфейсные и архитектурные решения, проверяю пользовательские сценарии."
              : "I am Alexander Pavlovich. I develop my own digital products: I define problems and requirements, choose interface and architecture decisions, and validate user workflows."}
          </p>
          <p>
            {ru
              ? "Значительную часть реализации выполняют Codex и Claude Code. Коммерческого IT-опыта пока нет. Открыт к оплачиваемым junior-задачам с техническим ревью, небольшим проектам и партнёрству."
              : "A substantial part of implementation is created with Codex and Claude Code. I do not yet have commercial IT experience. I am open to paid junior tasks with technical review, small projects and partnerships."}
          </p>
          <Out
            href={
              ru
                ? "/assets/alexander-pavlovich-ru.pdf"
                : "/assets/alexander-pavlovich-en.pdf"
            }
          >
            {ru ? "Профиль в PDF" : "Profile PDF"}
          </Out>
        </div>
      </section>
    </>
  );
}
