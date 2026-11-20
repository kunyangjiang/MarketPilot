// 课程自动检查：node "lessons/工具/课程自动检查.js" <课号> [<课号> ...]
// 针对一课的五件交付物（课文、图与交互方案、数值核验脚本、核验记录、学术审阅包）做机器可判的检查。
// 任何一项失败，进程以 1 退出。检查不到的（文风、教学效果、史实判断）留给人工与独立审阅。
'use strict';
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');
const { count } = require('./正文字数.js');

const ROOT = path.resolve(__dirname, '..', '..');
const LESSONS = path.join(ROOT, 'lessons');
const { convert } = require(path.join(ROOT, 'site', 'tools', 'lesson-build', 'md2html.js'));

// 正文里不得出现的内容：开发痕迹、核验标记、已弃用的名字与行话
const BANNED = [
  [/[☐◐✔]/, '核验标记'], [/TODO|待 ?PO|待核|待定|占位/, '开发痕迹'],
  [/北岭银行/, '已弃用的虚构名（应为河岸银行）'], [/轧空/, '不用「轧空」（用「逼空」）'],
  [/盘口|扫货|吃单/, '行话不进正文'],
];

function read(f) { return fs.readFileSync(f, 'utf8').replace(/\r/g, ''); }
function bodyOf(md) { const L = md.split('\n'); const i = L.findIndex(l => /^---\s*$/.test(l)); return L.slice(i + 1).join('\n').trim(); }

function registerText() {
  // 本课及共享的来源登记（含 S01 共享登记、S02 各课来源登记、第二批各课来源登记）
  const out = [];
  for (const d of fs.readdirSync(LESSONS)) {
    const p = path.join(LESSONS, d);
    if (/来源登记/.test(d) && d.endsWith('.md')) out.push(read(p));
    else if (fs.statSync(p).isDirectory()) for (const f of fs.readdirSync(p)) if (/来源登记/.test(f)) out.push(read(path.join(p, f)));
  }
  return out.join('\n');
}

function check(id) {
  const dir = path.join(LESSONS, id);
  const F = {
    课文: `${id} 课文 v1 候选.md`, 图: `${id} 图与交互方案 v1 候选.md`, 脚本: `${id} 数值核验.js`,
    核验: `${id} 核验记录.md`, 审阅包: `${id} 学术审阅包.md`,
  };
  const res = []; const ok = (name, pass, note) => res.push({ name, pass: !!pass, note: note || '' });

  for (const [k, f] of Object.entries(F)) ok('文件：' + k, fs.existsSync(path.join(dir, f)), f);
  if (res.some(r => !r.pass)) return res;
  const md = read(path.join(dir, F.课文)), body = bodyOf(md);

  // 1 字数
  const c = count(path.join(dir, F.课文));
  ok('正文字数 5,000–8,000', c.body >= 5000 && c.body <= 8000, c.body + ' 字（其中中国对照 ' + c.china + '）');

  // 2 数值脚本
  let out = '', code = 0;
  try { out = execFileSync(process.execPath, [path.join(dir, F.脚本)], { cwd: dir, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }); }
  catch (e) { code = e.status || 1; out = (e.stdout || '') + (e.stderr || ''); }
  const failN = (out.match(/失败[：: ]*(\d+)/) || [])[1];
  ok('数值脚本通过', code === 0 && !(failN && +failN > 0), (out.trim().split('\n').pop() || '').slice(0, 80));
  const src = read(path.join(dir, F.脚本));
  ok('数值脚本读取课文核对数字', src.includes('课文 v1 候选'), '脚本须读课文文件，断言课文里出现的数字');

  // 3 课文可被页面组装工具解析
  let conv = null;
  try { conv = convert(md); ok('课文标记可解析（md2html）', true, conv.toc.length + ' 节'); }
  catch (e) { ok('课文标记可解析（md2html）', false, e.message); }

  // 4 正文不含开发痕迹与弃用词
  const hits = BANNED.filter(([re]) => re.test(body)).map(([re, why]) => why + '：' + (body.match(re) || [''])[0]);
  ok('正文无开发痕迹与弃用词', hits.length === 0, hits.join('；'));

  // 5 审阅包逐字收录课文
  const pkg = read(path.join(dir, F.审阅包));
  ok('审阅包逐字收录课文', pkg.includes(body), pkg.includes(body) ? '' : '审阅包 B 节须从课文第一条分隔线之后逐字照录到结尾');
  const pkgCount = (pkg.match(/教学正文字数[^\n]*?([\d,]{4,6}) ?字/) || [])[1];
  ok('审阅包字数与计数一致', pkgCount && +pkgCount.replace(/,/g, '') === c.body, '审阅包写 ' + pkgCount + '，计数 ' + c.body);

  // 6 图：课文里的每张图在图与交互方案里都有
  const figs = [...new Set((md.match(/【图 ?(\d+)(，续)?】/g) || []).map(s => s.match(/\d+/)[0]))];
  const figMd = read(path.join(dir, F.图));
  const missing = figs.filter(n => !new RegExp('图 ?' + n + '(?!\\d)').test(figMd));
  ok('课文中的图都在图与交互方案里', missing.length === 0, figs.length + ' 张' + (missing.length ? '，缺 图 ' + missing.join('、') : ''));

  // 7 小题：每道都有提示与答案
  const quizzes = body.split(/\n(?=> \*\*【小题)/).filter(b => /^> \*\*【小题/.test(b)).map(b => b.split(/\n(?!>)/)[0]);
  const badQ = quizzes.filter(q => !/\*\*提示：\*\*/.test(q) || !/\*\*答案：\*\*/.test(q)).length;
  ok('小题都有提示与答案', badQ === 0, quizzes.length + ' 道' + (badQ ? '，' + badQ + ' 道缺提示或答案' : ''));

  // 8 核验记录：课文论断与来源对照表无 ☐，来源编号都已登记
  const ver = read(path.join(dir, F.核验));
  const sec = ver.split(/\n## /).find(s => /^课文论断与来源对照/.test(s));
  if (!sec) ok('核验记录含「课文论断与来源对照」', false, '缺这一节');
  else {
    const rows = sec.split('\n').filter(l => /^\|/.test(l) && !/^\|\s*-/.test(l)).slice(1);
    const unverified = rows.filter(r => /☐/.test(r)).length;
    ok('课文论断无 ☐', unverified === 0, rows.length + ' 条论断' + (unverified ? '，' + unverified + ' 条 ☐' : ''));
    const reg = registerText();
    const ids = [...new Set((sec.match(/S\d{4}-R\w+/g) || []))];
    const notReg = ids.filter(x => !reg.includes(x));
    ok('论断引用的来源编号均已登记', notReg.length === 0, ids.length + ' 个编号' + (notReg.length ? '，未登记：' + notReg.join('、') : ''));
  }
  return res;
}

let failed = 0;
for (const id of process.argv.slice(2)) {
  const res = check(id);
  console.log('== ' + id);
  for (const r of res) { console.log((r.pass ? '  通过 ' : '  失败 ') + r.name + (r.note ? '：' + r.note : '')); if (!r.pass) failed++; }
}
console.log(failed ? '\n共 ' + failed + ' 项失败' : '\n全部通过');
process.exit(failed ? 1 : 0);
