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
              ? "Я Александр Павлович. С начала 2025 года создаю собственные цифровые проекты: формулирую требования, разбиваю задачи на шаги, выбираю интерфейс и проверяю пользовательские сценарии вместе с ИИ."
              : "I am Alexander Pavlovich. Since early 2025 I have built personal digital projects: requirements, task breakdown, interface choices and user-scenario checks with AI."}
          </p>
          <p>
            {ru
              ? "Значительную часть кода создают Codex, Claude Code и другие AI-инструменты. Коммерческого IT-стажа и опыта работы в IT-команде пока нет; стек проекта не означает самостоятельное профессиональное владение им. Ищу оплачиваемые junior-задачи с техническим ревью и обучением."
              : "AI tools produce a substantial part of the code. I have no commercial IT or IT-team experience yet; project stacks do not imply independent professional mastery. I am seeking paid junior tasks with technical review and learning opportunities."}
          </p>
          <Out
            href={
              ru
                ? "/assets/resume-alexander-pavlovich-ru.pdf"
                : "/assets/resume-alexander-pavlovich-en.pdf"
            }
          >
            {ru ? "Резюме в PDF" : "Resume PDF"}
          </Out>
        </div>
      </section>
    </>
  );
}
