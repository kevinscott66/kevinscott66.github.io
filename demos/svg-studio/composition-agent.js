/* Слойра — © 2026 Павлович Александр Кириллович / dobropalm. Code: MIT. */
// Local agent: interpretation -> spatial constraints -> validation. No network,
// generated code or persistent prompt collection is involved.
class LocalCompositionAgent {
  plan(prompt, catalogue) {
    const empty = {mode: "clarify", assets: [], layout: [], unknown: []};
    if (typeof prompt !== "string" || prompt.length > 2000)
      return {...empty, question: "Сократите описание до 2000 символов."};
    let plan = parseComposition(prompt, catalogue);
    const text = normalize(prompt), words = intentWords(text);
    const matches = componentMatcher(catalogue)(words);
    // A scene followed only by exclusions still has semantic intent:
    // «рабочее место без цветов» is not a request to create zero objects.
    const excluded = matches.filter((m,i) => {
      const before = words.slice(i ? matches[i-1].position + matches[i-1].length : 0,m.position);
      return before.slice(-2).includes("без") || before.slice(-2).includes("не");
    });
    if (!plan.assets.length && excluded.length === matches.length && excluded.length) {
      const omitted = new Set(excluded.flatMap(m => Array.from({length:m.length},(_,i)=>m.position+i)));
      const fallback = parseComposition(words.filter((_,i)=>!omitted.has(i)).join(" "),catalogue);
      const banned = new Set(excluded.map(m=>m.asset.id));
      plan = {...fallback,assets:fallback.assets.filter(a=>!banned.has(a.id))};
    }
    plan.layout ??= plan.assets.map(() => ({}));
    if (matches.length === 1) {
      if (/слева/.test(text) && /справа/.test(text))
        return {...plan, question: "Этот предмет поставить слева или справа?"};
      if (/(сверху|вверху)/.test(text) && /(снизу|внизу)/.test(text))
        return {...plan, question: "Этот предмет поставить сверху или снизу?"};
    }
    if (plan.unknown.length || plan.tooMany) return plan;
    if (words.some(word => ["несколько", "много", "немного"].includes(word)) && matches.length)
      return {...plan, question: "Сколько предметов нужно? Укажите число, например: три цветка."};
    if (words.some(word => ["перед", "позади", "сзади"].includes(word)) ||
        (words.includes("за") && !plan.surface))
      return {...plan, question: "Уточните расположение: слева, справа, выше, ниже или между двумя предметами. Порядок наложения можно изменить в списке «Предметы»."};
    const relation = text.match(/(?:слева от|справа от|выше|ниже|между)/);
    if (relation && matches.length >= 2) {
      const tokens = [...text.matchAll(/[а-яa-z0-9]+/g)];
      const before = matches.filter(m => tokens[m.position].index < relation.index).at(-1);
      const after = matches.filter(m => tokens[m.position].index > relation.index);
      if (before && after.length) {
        const subject = plan.assets.findIndex(a => a.id === before.asset.id);
        const targets = plan.assets.map((a,i) => after.some(m => m.asset.id === a.id) ? i : -1).filter(i=>i>=0);
        if (subject >= 0 && targets.includes(subject))
          return {...plan, question: "Какой из одинаковых предметов нужно расположить относительно другого?"};
        if (subject >= 0 && relation[0] === "между") {
          if (targets.length !== 2) return {...plan, question: "Между какими двумя предметами поставить элемент?"};
          plan.layout[subject] = {x:.5,y:.5};
          plan.layout[targets[0]] = {x:.2,y:.5};
          plan.layout[targets[1]] = {x:.8,y:.5};
        } else if (subject >= 0 && targets.length === 1) {
          const horizontal = relation[0].includes("от");
          const first = ["слева от", "выше"].includes(relation[0]) ? .25 : .75;
          plan.layout[subject] = horizontal ? {x:first,y:.5} : {x:.5,y:first};
          plan.layout[targets[0]] = horizontal ? {x:1-first,y:.5} : {x:.5,y:1-first};
        } else return {...plan, question: "Уточните, какие два предмета нужно расположить друг относительно друга."};
      }
    }
    for (const part of componentListParts(text, componentMatcher(catalogue))) {
      if (/слева/.test(part) && /справа/.test(part) && !/от/.test(part))
        return {...plan, question: "Этот предмет поставить слева или справа?"};
      if (/(сверху|вверху)/.test(part) && /(снизу|внизу)/.test(part))
        return {...plan, question: "Этот предмет поставить сверху или снизу?"};
    }
    if (!plan.assets.length)
      return {...plan, question: "Какие предметы нужны? Например: два телефона и цветы в центре."};
    return {...plan, status: "ready"};
  }
}
const compositionAgent = new LocalCompositionAgent();
function planComposition(prompt, catalogue) {
  return compositionAgent.plan(prompt, catalogue);
}

