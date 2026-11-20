// 把课文 Markdown 转成课程页 <article> 正文。图用占位符 <!--FIG:n--> 留给手写的图替换。
'use strict';
const fs = require('fs');
const esc = s => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const quotes = s => s.replace(/“/g, '「').replace(/”/g, '」').replace(/‘/g, '『').replace(/’/g, '』');
function inline(s) {
  s = esc(quotes(s));
  s = s.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>').replace(/\*(.+?)\*/g, '<em>$1</em>').replace(/`([^`]+)`/g, '<code>$1</code>');
  return s;
}
function table(lines) {
  const rows = lines.filter(l => !/^\|\s*-/.test(l)).map(l => l.replace(/^\||\|$/g, '').split('|').map(c => c.trim()));
  const [h, ...b] = rows;
  const num = c => /^[\d$,.\s−+%]+$/.test(c.replace(/<\/?strong>/g, '').replace(/\*\*/g, '')) && /\d/.test(c);
  return '<div class="tblw"><table class="bs"><thead><tr>' + h.map(c => '<th>' + inline(c) + '</th>').join('') + '</tr></thead><tbody>' +
    b.map(r => '<tr' + (/合计/.test(r[0]) ? ' class="tot"' : '') + '>' + r.map(c => '<td' + (num(c) ? ' class="n"' : '') + '>' + inline(c) + '</td>').join('') + '</tr>').join('') + '</tbody></table></div>';
}
function quiz(block, n) {
  const q = block.find(l => /^\*\*【小题/.test(l)).replace(/^\*\*【小题 (\d+)】\*\*\s*/, '');
  const opts = block.filter(l => /^[A-D]\. /.test(l)).map(l => l.slice(3));
  const hint = (block.find(l => /^\*\*提示：\*\*/.test(l)) || '').replace(/^\*\*提示：\*\*\s*/, '');
  const ans = (block.find(l => /^\*\*答案：\*\*/.test(l)) || '').replace(/^\*\*答案：\*\*\s*/, '');
  let ol, right;
  if (opts.length) { ol = opts.map(o => '<li>' + inline(o) + '</li>'); right = 'ABCD'.indexOf(ans[0]); }
  else if (/^判断/.test(q)) { ol = ['<li class="add">对</li>', '<li class="add">错</li>']; right = /^错/.test(ans) ? 1 : 0; }
  else return { open: true, html: '<div class="quiz open" id="q' + n + '">\n  <p class="qq"><span class="qh">小题 ' + n + ' · 想一想</span>' + inline(q) + '</p>\n  <p class="qhint" hidden><b>提示：</b>' + inline(hint) + '</p>\n  <p class="qans" hidden><b>参考答案：</b>' + inline(ans) + '</p>\n</div>' };
  if (right < 0) throw new Error('答案无法解析：' + q);
  return { html: '<div class="quiz" id="q' + n + '" data-answer="' + right + '">\n  <p class="qq"><span class="qh">小题 ' + n + '</span>' + inline(q) + '</p>\n  <ul class="opts">' + ol.join('') + '</ul>\n  <p class="qhint" hidden><b>提示：</b>' + inline(hint) + '</p>\n  <p class="qans" hidden><b>答案：</b>' + inline(ans) + '</p>\n</div>' };
}
function convert(md) {
  const L = md.replace(/\r/g, '').split('\n');
  let i = 0, out = [], sec = 0, toc = [], keys = '', srcs = '', mode = 'body';
  const startH = L.findIndex(l => /^## /.test(l));
  i = startH;
  let openSec = false;
  const close = () => { if (openSec) out.push('</section>\n'); openSec = false; };
  while (i < L.length) {
    let l = L[i];
    if (/^## /.test(l)) {
      close(); sec++; const t = l.slice(3).trim(); toc.push(t);
      out.push('<section id="s' + sec + '" aria-labelledby="h-s' + sec + '"><h2 id="h-s' + sec + '" tabindex="-1"><span class="hn">第 ' + String(sec).padStart(2, '0') + ' 节</span>' + inline(t) + '</h2>');
      openSec = true; i++; continue;
    }
    if (/^### 本课要点/.test(l)) { close(); mode = 'keys'; i++; continue; }
    if (/^### 参考来源/.test(l)) { mode = 'srcs'; i++; continue; }
    if (l.trim() === '' || l.trim() === '---') { i++; continue; }
    if (mode !== 'body') {
      const items = [];
      while (i < L.length && !/^### /.test(L[i])) { if (/^- /.test(L[i])) items.push(L[i].slice(2)); i++; }
      if (mode === 'keys') keys = items.map(x => '<li>' + inline(x) + '</li>').join('');
      else srcs = items.map(x => '<li>' + inline(x) + '</li>').join('');
      continue;
    }
    if (/^>/.test(l)) {
      const block = [];
      while (i < L.length && /^>/.test(L[i])) { block.push(L[i].replace(/^>\s?/, '')); i++; }
      const nonEmpty = block.filter(x => x.trim());
      const first = nonEmpty[0] || '';
      let m;
      if ((m = first.match(/^\*\*【图 (\d+)(，续)?】/))) out.push('<!--FIG:' + m[1] + (m[2] ? 'b' : '') + '-->');
      else if (/^\*\*【开场图】/.test(first)) { /* 开场另做 */ }
      else if ((m = first.match(/^\*\*【小题 (\d+)】/))) out.push(quiz(nonEmpty, +m[1]).html);
      else if (/^\*\*【中国对照】/.test(first)) out.push('<aside class="cn" aria-label="中国对照"><b>中国对照</b>' + nonEmpty.slice(1).map(x => '<p>' + inline(x) + '</p>').join('') + '</aside>');
      else if ((m = first.match(/^\*\*历史补充[：:](.+)\*\*$/))) {
        const rows = nonEmpty.filter(x => /^\|/.test(x));
        out.push('<aside class="cn hist" aria-label="历史补充"><b>历史补充 · ' + inline(m[1].trim()) + '</b>' + nonEmpty.slice(1).filter(x => !/^\|/.test(x)).map(x => '<p>' + inline(x) + '</p>').join('') + (rows.length ? table(rows) : '') + '</aside>');
      }
      else if (/^\|/.test(first)) out.push(table(nonEmpty));
      else throw new Error('未知引用块：' + first);
      continue;
    }
    if (/^```/.test(l)) {
      i++; const lines = [];
      while (!/^```/.test(L[i])) { lines.push(L[i]); i++; }
      i++;
      const steps = lines.filter(x => x.trim() && !/^\s*↓\s*$/.test(x)).map(x => x.trim());
      out.push('<ol class="flow">' + steps.map(s => '<li>' + inline(s) + '</li>').join('') + '</ol>');
      continue;
    }
    if (/^\| /.test(l)) { const t = []; while (i < L.length && /^\|/.test(L[i])) { t.push(L[i]); i++; } out.push(table(t)); continue; }
    if (/^(- |\d+\. )/.test(l)) {
      const ordered = /^\d+\. /.test(l), items = [];
      while (i < L.length && /^(- |\d+\. )/.test(L[i])) { items.push(L[i].replace(/^(- |\d+\. )/, '')); i++; }
      out.push((ordered ? '<ol>' : '<ul>') + items.map(x => '<li>' + inline(x) + '</li>').join('') + (ordered ? '</ol>' : '</ul>'));
      continue;
    }
    out.push('<p>' + inline(l) + '</p>'); i++;
  }
  close();
  return { body: out.join('\n'), toc, keys, srcs };
}
module.exports = { convert, inline };
if (require.main === module) {
  const r = convert(fs.readFileSync(process.argv[2], 'utf8'));
  console.log(r.toc); console.log(r.body.slice(0, 3000));
}
