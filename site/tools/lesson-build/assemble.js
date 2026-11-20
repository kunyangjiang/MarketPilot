/* 课程页组装：课文 Markdown + 课程页配置 → site/lessons/<课号>/index.html、lesson.css、steps.js
 * 适用：S01-01 至 S01-06、S02-01、S02-03、S02-04（S02-02 与 S09-03 的页面是手写的，不经过这里）
 * 阶段名、层级名从 site/assets/catalog.js 读取
 * 运行：node site/tools/lesson-build/assemble.js <课号> [输出目录]
 *   课文：lessons/<课号>/ 下的课文稿（由配置里的 md 指定）
 *   配置：lessons/<课号>/页面配置/config.js（开场照片、图、读图说明、来源说明）与 figs.css（本课的图的样式）
 *   共用：本目录的 md2html.js、base.css、steps.js
 * 不给输出目录时写入 site/lessons/<课号>/。只读仓库内的文件，同样的输入总是得到逐字节相同的输出。 */
'use strict';
const fs = require('fs'), path = require('path');
const { convert } = require('./md2html');
const ROOT = path.resolve(__dirname, '..', '..', '..');
const id = process.argv[2];
if (!/^S\d\d-\d\d$/.test(id || '')) throw new Error('用法：node site/tools/lesson-build/assemble.js <课号> [输出目录]');
const SRC = path.join(ROOT, 'lessons', id, '页面配置');
const cfg = require(path.join(SRC, 'config.js'));
const md = fs.readFileSync(cfg.md, 'utf8');
const r = convert(md);
let body = r.body.replace(/<!--FIG:(\w+)-->/g, (m, k) => { if (!cfg.figs[k]) throw new Error('缺图 ' + k); return cfg.figs[k]; });
if (/<!--FIG/.test(body)) throw new Error('图占位未替换');
for (const [a, b] of cfg.replace || []) { if (!body.includes(a)) throw new Error('替换目标不存在：' + a); body = body.replace(a, b); }
const h1 = md.match(/^# (.+)$/m)[1].trim();
const pad = n => String(n).padStart(2, '0');
const vm = require('vm'), cat = { window: {} };
vm.runInNewContext(fs.readFileSync(path.join(ROOT, 'site', 'assets', 'catalog.js'), 'utf8'), cat);
const lesson = cat.window.MP.lessons.find(l => l.id === id);
if (!lesson) throw new Error('目录里没有 ' + id);
const stage = lesson.stage, layer = cat.window.MP.layers[lesson.layer];
const stageLab = stage.id + ' ' + stage.name, layerLab = '第' + layer.n + '层 ' + layer.name;
const toc = r.toc.map((t, i) => '        <li><a href="#s' + (i + 1) + '"><span class="n">' + pad(i + 1) + '</span>' + t + '</a></li>').join('\n');
const html = `<!doctype html>
<html lang="zh-CN">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${h1} · ${id} · MarketPilot</title>
<meta name="description" content="${cfg.desc}">
<meta name="robots" content="noindex">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Schibsted+Grotesk:wght@400;600;700;900&family=Noto+Sans+SC:wght@400;500;700;900&family=Noto+Serif+SC:wght@600;900&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet">
<link rel="icon" href="data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 32 32%22%3E%3Ccircle cx=%2216%22 cy=%2216%22 r=%2212%22 fill=%22%23D4FF3A%22 stroke=%22%23111827%22 stroke-width=%227%22/%3E%3C/svg%3E">
<link rel="stylesheet" href="../../assets/site.css">
<link rel="stylesheet" href="lesson.css">
</head>
<body>
<a class="skip" href="#lesson-body">跳到正文</a>

<header class="top"><div class="w">
  <a class="logo" href="../../"><i></i>MarketPilot</a>
  <nav class="mainnav" aria-label="主导航">
    <a href="../../">首页</a>
    <a href="../../#courses" aria-current="page">课程</a>
    <a href="../../#stories">故事</a>
  </nav>
  <a class="sbtn" href="../../?search=" aria-label="搜索"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg><span>搜索</span></a>
</div>
<div class="rprog" aria-hidden="true"><i id="rprog"></i></div>
</header>

<main class="w" id="main">
  <div class="crumb"><a href="../../#courses">课程</a><span>/</span><a href="../../#layer-${lesson.layer + 1}">${layerLab}</a><span>/</span><a href="../../#${stage.id}">${stageLab}</a><span>/</span>第 ${cfg.n} 课</div>

  <section class="lhero" aria-labelledby="lesson-title">
    <div class="card l">
      <div class="lab">MarketPilot · ${stageLab} · 第 ${cfg.n} 课</div>
      <h1 id="lesson-title">${h1}</h1>
      <p class="q">${cfg.q}</p>
      <p class="goal"><b>学习目标</b>${cfg.goal}</p>
    </div>
${cfg.hero}
  </section>

  <div class="card reader">
    <nav class="ltoc" aria-label="本课章节">
      <div class="lab">本课 ${r.toc.length} 节</div>
      <ol id="toc">
${toc}
        <li><a href="#keys"><span class="n">··</span>本课要点</a></li>
        <li><a href="#srcs"><span class="n">··</span>来源</a></li>
      </ol>
    </nav>

    <article id="lesson-body" tabindex="-1">
${body}

<section id="keys" class="keys" aria-labelledby="h-keys"><h2 id="h-keys" tabindex="-1">本课要点</h2>
<ul>${r.keys}</ul></section>

<section class="srcs" id="srcs" aria-labelledby="h-srcs"><h2 id="h-srcs" tabindex="-1">来源</h2>
${cfg.srcNote || ''}<ul>${r.srcs}</ul></section>
    </article>

    <aside class="notesR" aria-label="读图说明">
${cfg.notes}
    </aside>
  </div>
</main>

<footer class="site"><div class="w">
  <div class="row"><b style="color:var(--ink)">MarketPilot</b><span>${id}</span></div>
${cfg.credits || ""}
</div></footer>

<button class="totop" id="totop" type="button" aria-label="回到顶部" title="回到顶部（长按可拖动，双击复位）">
  <svg class="ring" viewBox="0 0 62 62" aria-hidden="true"><circle cx="31" cy="31" r="28"/></svg>
  <svg class="ico-up" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 19V5M5 12l7-7 7 7"/></svg>
  <svg class="ico-move" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 3v18M3 12h18M12 3l-3 3M12 3l3 3M12 21l-3-3M12 21l3-3M3 12l3-3M3 12l3 3M21 12l-3-3M21 12l-3 3"/></svg>
</button>
<div class="totop-tip" id="totop-tip" role="status" aria-live="polite"></div>

<script src="../../assets/totop.js"></script>
${(cfg.scripts || []).map(s => '<script src="' + s + '"></script>').join('\n')}
<script src="steps.js"></script>
<script src="lesson.js"></script>
<script src="../S02-02/reader.js"></script>
</body>
</html>
`;
const out = process.argv[3] ? path.resolve(process.argv[3]) : path.join(ROOT, 'site', 'lessons', id);
fs.mkdirSync(out, { recursive: true });
fs.writeFileSync(path.join(out, 'index.html'), html);
fs.copyFileSync(path.join(__dirname, 'steps.js'), path.join(out, 'steps.js'));
fs.writeFileSync(path.join(out, 'lesson.css'), '/* ' + id + ' 课程页样式。通用部分沿用 S09-03 与 S02-02 的写法，本课的图在文件末尾 */\n' + fs.readFileSync(path.join(__dirname, 'base.css'), 'utf8') + '\n/* ---------- 本课的图 ---------- */\n' + fs.readFileSync(path.join(SRC, 'figs.css'), 'utf8'));
console.log(id, 'sections', r.toc.length, 'bytes', html.length);
