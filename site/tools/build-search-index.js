/* 生成站内搜索索引 assets/search-index.js（无依赖，Node 18+）。
 * 只读已发布的课程页面（site/lessons/<课号>/index.html）的读者可见正文：
 *   开场（标题、核心问题、学习目标）＋ <article> 里每一个带 id 的 <section>。
 * 不读课文原稿、核验记录、交互方案等 Markdown 文件，也不读设计样稿。
 * 课程页有改动后运行：  node site/tools/build-search-index.js
 * tests/site-search.test.js 会重新生成一遍并与磁盘上的文件逐字比较，索引过期即失败。 */
'use strict';
const fs = require('node:fs');
const path = require('node:path');

const SITE = path.resolve(__dirname, '..');
const OUT = path.join(SITE, 'assets', 'search-index.js');

const decode = s => s.replace(/&nbsp;/g, ' ').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&amp;/g, '&');
const text = html => decode(html
  .replace(/<script[\s\S]*?<\/script>/g, ' ').replace(/<noscript[\s\S]*?<\/noscript>/g, ' ').replace(/<style[\s\S]*?<\/style>/g, ' ')
  .replace(/<svg[\s\S]*?<\/svg>/g, ' ')
  .replace(/<span class="hn">[\s\S]*?<\/span>/g, ' ')
  .replace(/<\/?(strong|em|b|i|a|span|sup|sub|code|mark|abbr|small|dfn|q)\b[^>]*>/g, '') // 行内标签直接去掉，不留空格
  .replace(/<[^>]+>/g, ' ')).replace(/\s+/g, ' ').trim();
/* 去掉带 hidden 属性的元素（连同里面的内容）：小题的提示与答案、沙盘的揭晓与预测结果等，
   读者要先作答或操作才看得到，不能从搜索摘要里提前看到。按同名标签的嵌套层数找到配对的结束标签。 */
function dropHidden(html) {
  for (;;) {
    /* hidden 属性；或 class 含 free-only（只在「自由实验」模式里出现的实验控件，初始看不到，也不是正文） */
    const m = html.match(/<([a-z][a-z0-9]*)\b(?:[^>]*?\s)(?:hidden(?=[\s>=])|class="(?:[^"]*\s)?free-only(?=[\s"]))[^>]*>/i);
    if (!m) return html;
    const tag = m[1].toLowerCase(), start = m.index;
    const re = new RegExp('<(/?)' + tag + '\\b[^>]*>', 'gi');
    re.lastIndex = start + m[0].length;
    let depth = 1, end = html.length, t;
    while (depth && (t = re.exec(html))) { depth += t[1] ? -1 : 1; if (!depth) end = t.index + t[0].length; }
    html = html.slice(0, start) + ' ' + html.slice(end);
  }
}
/* 去掉图的表格视图（<details class="tbl">）：那是图的数据替代版，只有数字和代号，放进摘要只会是一串数字 */
const dropTables = html => html.replace(/<details class="tbl[^"]*">[\s\S]*?<\/details>/g, ' ');
const pick = (html, re) => { const m = html.match(re); return m ? text(m[1]) : ''; };

function lessonEntries(id, stageLabel) {
  const html = fs.readFileSync(path.join(SITE, 'lessons', id, 'index.html'), 'utf8').replace(/\r/g, '');
  const href = 'lessons/' + id + '/';
  const title = pick(html, /<h1[^>]*>([\s\S]*?)<\/h1>/);
  const q = pick(html, /<p class="q">([\s\S]*?)<\/p>/);
  const goal = pick(html, /<p class="goal"><b>[^<]*<\/b>([\s\S]*?)<\/p>/);
  if (!title || !q) throw new Error(id + '：找不到标题或核心问题');
  const out = [{ id, sec: '', title: id + ' ' + title, where: stageLabel, text: q + ' ' + goal, href }];
  const a = html.indexOf('<article'), b = html.indexOf('</article>');
  if (a < 0 || b < 0) throw new Error(id + '：找不到 <article>');
  const art = dropTables(dropHidden(html.slice(a, b)));
  const re = /<section\b[^>]*\bid="([^"]+)"[^>]*>([\s\S]*?)<\/section>/g;
  let m;
  while ((m = re.exec(art))) {
    const [, sec, body] = m;
    const h = pick(body, /<h[23][^>]*>([\s\S]*?)<\/h[23]>/);
    if (!h) continue;
    const t = text(body.replace(/<h[23][^>]*>[\s\S]*?<\/h[23]>/, ' '));
    out.push({ id, sec, title: h, where: id + ' · ' + title, text: t, href: href + '#' + sec });
  }
  return out;
}

function build() {
  global.window = {};
  delete require.cache[require.resolve('../assets/catalog.js')];
  require('../assets/catalog.js');
  const MP = global.window.MP;
  delete global.window;
  const entries = [];
  for (const l of MP.lessons.filter(x => x.readable)) {
    entries.push(...lessonEntries(l.id, '课程 · ' + l.stage.id + ' ' + l.stage.name + ' · 第 ' + Number(l.id.slice(4)) + ' 课'));
  }
  return '/* 自动生成，请勿手改。来源：site/lessons/<课号>/index.html 的读者可见正文。\n' +
    ' * 重新生成：node site/tools/build-search-index.js */\n' +
    'window.MP_SEARCH = ' + JSON.stringify(entries, null, 1) + ';\n';
}

module.exports = { build, OUT, dropHidden, dropTables };
if (require.main === module) {
  fs.writeFileSync(OUT, build());
  console.log('已写入', path.relative(process.cwd(), OUT));
}
