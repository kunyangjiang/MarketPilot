/* 课文转换保真检查：
 * 正向——课文稿里每一段、每个列表项、每个表格单元格，去掉 Markdown 记号后都必须原样出现在页面正文里；
 * 反向——页面正文里不带 .add（本站补充）标记的 <p>/<li>，去掉标签后都必须能在课文稿里找到原文。
 * 比较时只忽略空白和 Markdown／HTML 记号，不忽略任何文字或标点。
 * 课文稿中的“制作说明（内部，不公开）”是给设计者的指令，不进入公开页面，在此跳过，并单独检查页面上没有它们。
 * 权威课文稿：S02-02 v5 终稿候选（2026-11-17）。 */
'use strict';
const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');

const MD = path.join(__dirname, '..', '..', 'lessons', 'S02-02', 'S02-02-课文-v5-终稿候选.md');
const HTML = path.join(__dirname, '..', 'lessons', 'S02-02', 'index.html');

const norm = s => s
  .replace(/&quot;/g, '"').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&nbsp;/g, ' ').replace(/&#39;/g, "'")
  .replace(/「/g, '“').replace(/」/g, '”') // 页面把课文的弯引号统一排成直角引号「」（两课一致），比较时还原
  .replace(/\s+/g, '');

function mdUnits(md) {
  const units = [];
  md.split(/\r?\n/).forEach((line, i) => {
    let t = line.replace(/^>\s?/, '').trim();
    if (!t || t === '---' || /^\|?-{3}/.test(t) || /^\|(\s*-+\s*\|)+$/.test(t)) return;
    if (/图示设计|制作说明（内部，不公开）/.test(t)) return; // 设计说明，不公开
    if (i < 4 && /^(MarketPilot|试写稿)/.test(t)) return;   // 稿件抬头，不在页面上显示
    t = t.replace(/^#+\s*/, '').replace(/^[-*]\s+/, '').replace(/^\d+\.\s+/, '');
    t = t.replace(/\*\*/g, '').replace(/(^|[^*])\*([^*]+)\*/g, '$1$2');
    t = t.replace(/\[([^\]]+)\]\([^)]*\)/g, '$1');      // 链接只保留文字
    // 结构标记【图 1】标题／【信息卡：标题】／【中国对照】：页面拆成"图号标签 + 标题"或卡片标题，分别核对
    const br = t.match(/^【(图 \d+)】(.+)$/) || t.match(/^【(小题 \d+)】\s*(.+)$/) ||
      t.match(/^【(?:选读)?信息卡：(.+?)】(（选读，可跳过）)?$/) || t.match(/^【(中国对照)】(（选读，可跳过）)?$/);
    if (br) { br.slice(1).filter(Boolean).forEach(x => units.push({ line: i + 1, text: x })); return; }
    if (t.startsWith('|')) {
      t.split('|').map(c => c.trim()).filter(Boolean).forEach(c => units.push({ line: i + 1, text: c }));
    } else {
      units.push({ line: i + 1, text: t });
    }
  });
  return units;
}

function bodyHtml(html) {
  const a = html.indexOf('id="lesson-body"');
  assert.ok(a > 0, '找不到 #lesson-body');
  const b = html.indexOf('</article>', a);
  return html.slice(a, b);
}

/** 删掉所有带 .add 类的元素（含其全部内容）：按同名标签配对找到结束位置。 */
function dropAdd(html) {
  const open = /<([a-z0-9]+)\b[^>]*\bclass="(?:[^"]*\s)?add(?:\s[^"]*)?"[^>]*>/i;
  let m;
  while ((m = open.exec(html))) {
    const tag = m[1].toLowerCase();
    const tagRe = new RegExp('<(/?)' + tag + '(?=[\\s>])[^>]*>', 'gi');
    tagRe.lastIndex = m.index + m[0].length;
    let depth = 1, t, end = html.length;
    while (depth && (t = tagRe.exec(html))) { depth += t[1] ? -1 : 1; if (!depth) end = t.index + t[0].length; }
    html = html.slice(0, m.index) + html.slice(end);
  }
  return html;
}
const stripTags = s => s.replace(/<sup[^>]*>[\s\S]*?<\/sup>/g, '').replace(/<[^>]+>/g, '');

test('正向：课文稿每一处文字都原样出现在页面上', () => {
  const md = fs.readFileSync(MD, 'utf8');
  const html = fs.readFileSync(HTML, 'utf8');
  const page = norm(stripTags(html));
  const missing = mdUnits(md).filter(u => !page.includes(norm(u.text)));
  assert.deepStrictEqual(missing.map(u => `第 ${u.line} 行：${u.text}`), []);
});

test('反向：页面正文里非补充内容的段落都来自课文稿', () => {
  const md = fs.readFileSync(MD, 'utf8');
  const mdText = norm(mdUnits(md).map(u => u.text).join(''));
  const body = dropAdd(bodyHtml(fs.readFileSync(HTML, 'utf8')));
  const extra = [];
  let checked = 0;
  const re = /<(p|li)(\s[^>]*)?>([\s\S]*?)<\/\1>/g;
  let m;
  while ((m = re.exec(body))) {
    const t = norm(stripTags(m[3]));
    if (t) checked++;
    if (t && !mdText.includes(t)) extra.push(stripTags(m[3]).trim().slice(0, 60));
  }
  assert.ok(checked >= 40, '只核对了 ' + checked + ' 段，检查范围可能失效');
  assert.deepStrictEqual(extra, []);
});

test('结构：五张图、九道小题，制作说明与厚薄对比不在本课页面上', () => {
  const html = fs.readFileSync(HTML, 'utf8');
  const body = bodyHtml(html);
  const figs = [...body.matchAll(/<figure class="pf" id="(fig\d)" data-fig="([a-z]+)"/g)].map(m => m[1] + ':' + m[2]);
  assert.deepStrictEqual(figs, ['fig1:queues', 'fig2:book', 'fig3:climb', 'fig4:cancel', 'fig5:venues']);
  const labs = [...body.matchAll(/<span class="flab">(图 \d)<\/span>/g)].map(m => m[1]);
  assert.deepStrictEqual(labs, ['图 1', '图 2', '图 3', '图 4', '图 5']);
  const quizzes = [...body.matchAll(/<div class="quiz" id="(q\d)" data-answer="(\d)">([\s\S]*?)\n<\/div>/g)];
  assert.strictEqual(quizzes.length, 9);
  quizzes.forEach(([, id, , inner], i) => {
    assert.strictEqual(id, 'q' + (i + 1));
    assert.match(inner, /class="qh">小题 \d+</);
    assert.match(inner, /class="qhint" hidden><b>提示：<\/b>/, id + ' 缺少提示');
    assert.match(inner, /class="qans" hidden><b>答案：<\/b>/, id + ' 缺少答案');
  });
  assert.ok(!/制作说明|内部，不公开|图示设计/.test(html), '页面上出现了内部制作说明');
  assert.ok(!/\$50,485|\$50,010|厚订单簿|薄订单簿/.test(body), '厚薄对比（留给 S02-03）不应出现在本课正文');
  assert.ok(!/未公开发布|待审核|审核版本/.test(html), '已编写的课程不再显示状态文字');
  assert.ok(!/试写稿|终稿候选/.test(html), '页面不应出现「试写稿 / 终稿候选」等草稿字样');
});

test('小题答案与课文稿一致：正确选项和“答案”一行对得上', () => {
  const html = fs.readFileSync(HTML, 'utf8');
  const md = fs.readFileSync(MD, 'utf8');
  const mdAns = [...md.matchAll(/【小题 (\d)】[\s\S]*?\*\*答案：\*\*\s*(.+)/g)].map(m => [+m[1], m[2].trim()]);
  assert.strictEqual(mdAns.length, 9);
  const quizzes = [...bodyHtml(html).matchAll(/<div class="quiz" id="q(\d)" data-answer="(\d)">([\s\S]*?)\n<\/div>/g)];
  quizzes.forEach(([, n, a, inner]) => {
    const opts = [...inner.matchAll(/<li[^>]*>([\s\S]*?)<\/li>/g)].map(m => stripTags(m[1]).trim());
    const ans = mdAns.find(x => x[0] === +n)[1];
    const pick = opts[+a];
    assert.ok(pick, '小题 ' + n + ' 没有正确选项');
    const letter = (pick.match(/^([A-C])\./) || [])[1];
    if (letter && /^[A-C]。/.test(ans)) assert.strictEqual(ans[0], letter, '小题 ' + n + ' 的正确选项与课文稿不一致');
    else if (pick === '对' || pick === '错') assert.ok(ans.startsWith(pick), '小题 ' + n + ' 判断题答案不一致');
    else { assert.ok(norm(ans).includes('H的100股全部成交') && /H.*100.*J.*100/.test(pick), '小题 ' + n + ' 选项与答案不一致'); assert.ok(!opts.some(o => /比例/.test(o)), '小题 ' + n + ' 不应出现在真实市场中也可能成立的按比例分配选项'); }
  });
});
