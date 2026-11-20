// 跨课引用检查：node "lessons/工具/跨课引用检查.js" <课号>...
// 找出课文里「第 N 阶段第 M 课」「本阶段第 M 课」「上一课」，列出指向本课之后的课的引用，供人工判断是不是「留到以后讲」的预告。
'use strict';
const fs = require('fs'), path = require('path');
const CN = { 一: 1, 二: 2, 三: 3, 四: 4, 五: 5, 六: 6, 七: 7, 八: 8, 九: 9, 十: 10, 十一: 11 };
const num = s => /\d/.test(s) ? +s : CN[s];
const key = (st, l) => st * 100 + l;
let issues = 0;
for (const id of process.argv.slice(2)) {
  const [st, l] = id.slice(1).split('-').map(Number);
  const f = path.join(__dirname, '..', id, `${id} 课文 v1 候选.md`);
  const md = fs.readFileSync(f, 'utf8').split('---').slice(1).join('---');
  const re = /(第 ?(\d+|[一二三四五六七八九十]+) ?阶段第 ?(\d+|[一二三四五六七八九十]+) ?课|本阶段第 ?(\d+|[一二三四五六七八九十]+) ?课)/g;
  let m;
  while ((m = re.exec(md))) {
    const ts = m[2] ? num(m[2]) : st, tl = num(m[3] || m[4]);
    if (key(ts, tl) >= key(st, l)) {
      const ctx = md.slice(Math.max(0, m.index - 30), m.index + 40).replace(/\n/g, ' ');
      const forward = key(ts, tl) > key(st, l);
      const preview = /留|再讲|以后|之后|后面|将|会讲|下一|的内容|的问题|的话题|会接着|见第|要展开|要等/.test(ctx);
      if (forward && !preview) { issues++; console.log(`${id} → S${String(ts).padStart(2, '0')}-${String(tl).padStart(2, '0')}（未见预告措辞）：…${ctx}…`); }
      else if (!forward) { issues++; console.log(`${id} → 指向本课自己：…${ctx}…`); }
    }
  }
}
console.log(issues ? `\n共 ${issues} 处需人工看` : '没有发现指向后续课的「已讲」式引用');
