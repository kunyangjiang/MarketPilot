// 按《课程制作标准 v1.0》计正文字数：只数汉字；从抬头后的第一条分隔线起，到「### 本课要点」为止；
// 「中国对照」信息卡计入正文（与 S01 各课的口径一致）；不计各级标题、其他引用块（图、小题、历史补充等）、表格行。
'use strict';
const fs = require('fs');
const han = s => (s.match(/[一-鿿㐀-䶿]/g) || []).length;
function count(file) {
  const md = fs.readFileSync(file, 'utf8').replace(/\r/g, '');
  const L = md.split('\n');
  const start = L.findIndex(l => /^---\s*$/.test(l));
  let body = 0, quote = 0, table = 0, china = 0, inChina = false;
  for (const l of L.slice(start + 1)) {
    if (/^###\s*本课要点/.test(l)) break;
    if (/^#/.test(l)) continue;
    if (/^>/.test(l)) {
      if (/【中国对照】/.test(l)) inChina = true;
      if (inChina && !/^>\s*\|/.test(l)) china += han(l); else quote += han(l);
      continue;
    }
    inChina = false;
    if (/^\|/.test(l)) { table += han(l); continue; }
    body += han(l);
  }
  return { body: body + china, china, quote, table };
}
module.exports = { count };
if (require.main === module) for (const f of process.argv.slice(2)) console.log(f.split(/[\/]/).pop(), JSON.stringify(count(f)));
