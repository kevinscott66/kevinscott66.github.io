/* Слойра — © 2026 Павлович Александр Кириллович / dobropalm. Code: MIT. */
// Local agent: interpretation -> spatial constraints -> validation. No network,
// generated code or persistent prompt collection is involved.
// One-edit correction is deliberately bounded: never rewrite short words,
// numbers, exact catalogue names or an ambiguous object/command family.
function oneTypoApart(a, b) {
  if (Math.abs(a.length-b.length)>1) return false;
  if (a.length===b.length) {
    const different=[];
    for(let i=0;i<a.length;i++) if(a[i]!==b[i]) different.push(i);
    return different.length===1 || (different.length===2 && different[1]===different[0]+1 &&
      a[different[0]]===b[different[1]] && a[different[1]]===b[different[0]]);
  }
  const shorter=a.length<b.length?a:b, longer=a.length<b.length?b:a;
  let i=0,j=0;
  while(i<shorter.length&&j<longer.length) {
    if(shorter[i]===longer[j]) {i++;j++;}
    else {j++;if(j-i>1)return false;}
  }
  return true;
}
function correctCompositionTypos(text, catalogue) {
  const commands = ["слева","справа","сверху","снизу","вверху","внизу","посередине","посредине",
    "центре","центру","бокам","краям","между","рядом","горизонтали","вертикали","столбик",
    "сеткой","симметрично","третей","диагонали","кольцом","кругу","оставь","оставить",
    "свободное","место","текста","пожалуйста","столом","столе"];
  const known = new Map();
  for(const asset of catalogue) for(const word of componentForms[asset.id] || [])
    known.set(normalize(word),{word:normalize(word),family:asset.id,canonical:normalize(word)===normalize(asset.name)});
  for(const word of commands) known.set(word,{word,family:"command:"+word});
  for(const word of Object.keys(countWords)) known.set(word,{word,family:"count:"+countWords[word]});
  const protectedWords = new Set(["палка","лапка","шапка","маска","марка","рамка","почка","слова","слава","цвета","планы","плана","плане"]);
  const tokens=[...text.matchAll(/[а-яa-z0-9]+/g)];
  const exact=componentMatcher(catalogue)(tokens.map(t=>t[0]));
  const protectedIndexes=new Set(exact.flatMap(m=>Array.from({length:m.length},(_,i)=>m.position+i)));
  const aliases={цвты:"цветы",телф:"телефон"};
  const corrections=[], ambiguous=[];
  let cursor=0, result="";
  tokens.forEach((token,index)=>{
    const word=token[0];let replacement=word;
    if(!protectedIndexes.has(index)&&!known.has(word)&&!protectedWords.has(word)) {
      const compact=word.match(/^(\d+)([а-я]+)$/);
      if(compact && known.has(compact[2]) && !known.get(compact[2]).family.startsWith("command:") && !known.get(compact[2]).family.startsWith("count:"))
        replacement=compact[1]+" "+compact[2];
      else if(aliases[word]) replacement=aliases[word];
      else if(word.length>=5&&word.length<=32&&!/\d/.test(word)) {
        const candidates=[...known.values()].filter(c=>oneTypoApart(word,c.word));
        const families=new Set(candidates.map(c=>c.family));
        if(families.size===1) replacement=candidates.sort((a,b)=>Number(Boolean(b.canonical))-Number(Boolean(a.canonical))||Math.abs(a.word.length-word.length)-Math.abs(b.word.length-word.length)||a.word.localeCompare(b.word))[0].word;
        else if(families.size>1) ambiguous.push(word);
      }
    }
    result+=text.slice(cursor,token.index)+replacement;cursor=token.index+word.length;
    if(replacement!==word)corrections.push({from:word,to:replacement});
  });
  return {text:result+text.slice(cursor),corrections,ambiguous};
}

class LocalCompositionAgent {
  plan(prompt, catalogue) {
    const empty = {mode: "clarify", assets: [], layout: [], unknown: []};
    if (typeof prompt !== "string" || prompt.length > 2000)
      return {...empty, question: "Сократите описание до 2000 символов."};
    const spelling = correctCompositionTypos(normalize(prompt), catalogue);
    if(spelling.ambiguous.length)
      return {...empty,question:`Уточните слово «${spelling.ambiguous[0]}»: возможны разные исправления.`};
    const original = spelling.text;
    const arrangement = {};
    const modes = [
      ["row", /(?:в (?:один )?ряд|по горизонтали)/g],
      ["column", /(?:в столбик|по вертикали)/g],
      ["grid", /(?:сеткой|в виде сетки)/g],
      ["symmetric", /симметрично/g],
      ["thirds", /по правилу третей/g],
      ["circle", /(?:по кругу|кольцом)/g],
      ["diagonal", /по диагонали/g],
    ].filter(([,pattern]) => { pattern.lastIndex=0; return pattern.test(original); });
    if (modes.length > 1) return {...empty,question:"Выберите один способ расположения, например: в ряд, по кругу или сеткой."};
    if (modes.length) arrangement.mode = modes[0][0];
    const whitespacePattern = /(?:оставь|оставить) (?:свободное )?место для текста (справа|слева)/g;
    const emptySides = [...original.matchAll(whitespacePattern)].map(match=>match[1]);
    if (new Set(emptySides).size>1) return {...empty,question:"С какой стороны оставить место для текста — слева или справа?"};
    if (emptySides.length) arrangement.emptySide=emptySides[0]==="справа"?"right":"left";
    let text = original.replace(whitespacePattern, "");
    for (const [,pattern] of modes) { pattern.lastIndex=0; text=text.replace(pattern,""); }
    text=text.replace(/^[,;\s]+|[,;\s]+$/g,"");
    let plan = parseComposition(text, catalogue);
    const words = intentWords(text);
    plan.arrangement = arrangement;
    const matches = componentMatcher(catalogue)(words);
    if (/(?:^|\s)-\d|\d[.,]\d/.test(text))
      return {...plan, question: "Количество предметов должно быть целым числом от 0 до 100."};
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
      plan = {...fallback,assets:fallback.assets.filter(a=>!banned.has(a.id)),arrangement};
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
    const sideIndexes = plan.layout.map((d,i)=>d.sides?i:-1).filter(i=>i>=0);
    if (sideIndexes.length) {
      if (sideIndexes.length !== 2 || plan.assets[sideIndexes[0]].id !== plan.assets[sideIndexes[1]].id)
        return {...plan,question:"Для расположения по бокам укажите два одинаковых предмета, например: два телефона по бокам."};
      plan.layout[sideIndexes[0]]={x:.2,y:.5};
      plan.layout[sideIndexes[1]]={x:.8,y:.5};
    }
    const relation = text.match(/(?:слева от|справа от|рядом с|выше|ниже|между|над |под )/);
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
          const relationName=relation[0].trim();
          const horizontal = relationName.includes("от") || relationName === "рядом с";
          const first = relationName === "рядом с" ? .3 : ["слева от", "выше", "над"].includes(relationName) ? .25 : .75;
          plan.layout[subject] = horizontal ? {x:first,y:.5} : {x:.5,y:first};
          plan.layout[targets[0]] = horizontal ? {x:1-first,y:.5} : {x:.5,y:1-first};
          if(relationName === "рядом с") {
            plan.layout[subject].scale=.9;
            plan.layout[targets[0]].scale=.9;
          }
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
    if (arrangement.mode === "thirds" && plan.assets.length>4)
      return {...plan,question:"Для этой раскладки по третям выберите не больше четырёх предметов."};
    if ((arrangement.mode || arrangement.emptySide) && plan.layout.some(d=>d.x!=null||d.y!=null))
      return {...plan,question:"Оставить общую раскладку или отдельные указания о положении предметов? Укажите один вариант."};
    return {...plan, status: "ready", corrections: spelling.corrections};
  }
}
const compositionAgent = new LocalCompositionAgent();
function planComposition(prompt, catalogue) {
  return compositionAgent.plan(prompt, catalogue);
}

