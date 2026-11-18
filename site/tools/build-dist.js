/* 生成静态发布目录（无依赖，Node 18+）：只放网站运行时需要的文件。
 *
 *   node site/tools/build-dist.js            → 输出到 E:\MarketPilot\dist\
 *   node site/tools/build-dist.js <目录>     → 输出到指定目录（测试用）
 *
 * 做法：
 *   1. 先重新生成搜索索引（assets/search-index.js），保证发布的是最新索引；
 *   2. 从入口页面 index.html 出发，顺着 HTML 里的站内 href / src 收集文件：
 *      链接到目录（lessons/S02-02/）就收它的 index.html，HTML 页面继续往下找；
 *   3. 把收集到的文件原样复制到输出目录（不改写、不压缩），并打印清单和总哈希。
 * 没有被任何页面引用的文件不会进入发布目录：tests/、tools/、shots/、README.md、课文原稿、
 * 核验记录、设计样稿、旧原型都因此被排除。下面的 EXCLUDE 再做一道检查，万一被引用就直接报错。
 * 源目录 site/ 不会被修改（搜索索引除外，它本来就是生成文件）。 */
'use strict';
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');

const SITE = path.resolve(__dirname, '..');
const DEFAULT_OUT = path.resolve(SITE, '..', 'dist');
/* 404.html：Cloudflare Pages 对找不到的地址返回它（状态 404），它可能出现在任意深度，所以只用内联样式、链接用根路径 */
const ENTRIES = ['index.html', '404.html'];
const ROOT_LINKS_OK = new Set(['404.html']);
const EXCLUDE = [/^tests\//, /^tools\//, /^shots\//, /\.md$/i, /\.pdf$/i, /(^|\/)proto/i, /\.test\.js$/, /(^|\/)\./];

/* 一个 HTML 文件里的站内引用（相对路径），去掉 ?查询 和 #片段。rootOk：允许并跳过根路径链接（只给 404.html） */
function localRefs(html, rootOk) {
  const out = [];
  for (const m of html.matchAll(/\s(?:href|src)="([^"]*)"/g)) {
    const u = m[1];
    if (!u || /^(?:[a-z]+:|\/\/|#|\?)/i.test(u)) continue;   // 外链、data:、mailto:、页内锚点、只有查询串
    if (u.startsWith('/') && rootOk) continue;
    if (u.startsWith('/')) throw new Error('不允许根相对路径（子路径部署会失效）：' + u);
    out.push(u.split('#')[0].split('?')[0]);
  }
  return out;
}

/* 入口：首页，加上目录里每一节可阅读的课（它们的链接由 shell.js 生成，静态 HTML 里看不到） */
function entries() {
  global.window = {};
  delete require.cache[require.resolve('../assets/catalog.js')];
  require('../assets/catalog.js');
  const MP = global.window.MP; delete global.window;
  return [...ENTRIES, ...Object.values(MP.readable).map(r => path.posix.join(r.href, 'index.html'))];
}

function collect() {
  const files = new Set(), queue = entries();
  while (queue.length) {
    const rel = queue.shift();
    if (files.has(rel)) continue;
    const abs = path.join(SITE, rel);
    if (!fs.existsSync(abs) || !fs.statSync(abs).isFile()) throw new Error('引用的文件不存在：' + rel);
    files.add(rel);
    if (!rel.endsWith('.html')) continue;
    const base = path.posix.dirname(rel);
    for (const u of localRefs(fs.readFileSync(abs, 'utf8'), ROOT_LINKS_OK.has(rel))) {
      if (!u) continue;
      let r = path.posix.normalize(path.posix.join(base, u));
      if (r.startsWith('..')) throw new Error(rel + ' 引用了 site/ 之外的文件：' + u);
      if (u.endsWith('/') || r === '.' || fs.existsSync(path.join(SITE, r)) && fs.statSync(path.join(SITE, r)).isDirectory()) r = path.posix.join(r === '.' ? '' : r, 'index.html');
      queue.push(r);
    }
  }
  const list = [...files].sort();
  for (const f of list) for (const re of EXCLUDE) if (re.test(f)) throw new Error('发布目录里不应有：' + f);
  return list;
}

function build(out) {
  out = path.resolve(out || DEFAULT_OUT);
  if (out === SITE || out.startsWith(SITE + path.sep)) throw new Error('输出目录不能在 site/ 里面');
  // 1. 搜索索引
  const idx = require('./build-search-index.js');
  const fresh = idx.build();
  const changed = !fs.existsSync(idx.OUT) || fs.readFileSync(idx.OUT, 'utf8') !== fresh;
  if (changed) fs.writeFileSync(idx.OUT, fresh);
  // 2. 收集
  const list = collect();
  // 3. 清空并复制（输出目录是生成物，整个重建）
  // 只清空里面的内容、保留目录本身：Windows 上目录被别的程序占用（例如本地预览服务器）时也能重建
  fs.mkdirSync(out, { recursive: true });
  for (const e of fs.readdirSync(out)) fs.rmSync(path.join(out, e), { recursive: true, force: true });
  const hash = crypto.createHash('sha256'), rows = [];
  for (const f of list) {
    const buf = fs.readFileSync(path.join(SITE, f));
    fs.mkdirSync(path.dirname(path.join(out, f)), { recursive: true });
    fs.writeFileSync(path.join(out, f), buf);
    const h = crypto.createHash('sha256').update(buf).digest('hex');
    hash.update(f + '\0' + h + '\n');
    rows.push({ file: f, bytes: buf.length, sha256: h });
  }
  return { out, files: rows, digest: hash.digest('hex'), indexRegenerated: changed };
}

module.exports = { build, collect, localRefs, SITE, DEFAULT_OUT, EXCLUDE, ROOT_LINKS_OK };
if (require.main === module) {
  const r = build(process.argv[2]);
  for (const f of r.files) console.log(f.sha256.slice(0, 12), String(f.bytes).padStart(8), f.file);
  console.log('\n' + r.files.length + ' 个文件，共 ' + r.files.reduce((s, f) => s + f.bytes, 0) + ' 字节 → ' + r.out);
  console.log('总哈希 ' + r.digest + (r.indexRegenerated ? '（搜索索引已重新生成）' : ''));
}
