// S09-03 预检：史实时间线的 Markdown 表格结构（Blocker C）
// 每一行表格行都必须属于一张有表头和分隔行的表（旧版 v2.1、v2.2 已删除，只检查当前的 v2.3）。
'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const dir = path.join(__dirname, '..');
const read = f => fs.readFileSync(path.join(dir, f), 'utf8').split('\n');

function orphanRows(lines) {
  const bad = [];
  for (let i = 0; i < lines.length; i++) {
    if (!lines[i].startsWith('|')) continue;
    let j = i; while (j > 0 && lines[j - 1].startsWith('|')) j--;        // 这一段连续表格的第一行
    const sep = lines[j + 1] || '';
    if (!/^\|(\s*:?-+:?\s*\|)+\s*$/.test(sep)) bad.push(i + 1);
  }
  return bad;
}
const dateCell = l => l.split('|')[1].trim();

test('时间线 v2.3 候选：没有孤立表格行', () => {
  assert.deepEqual(orphanRows(read('S09-03-史实时间线-v2.3-候选.md')), []);
});

test('时间线 v2.3 候选：第五节主表的日期列从 10-22 到 1908 年 1 月前后', () => {
  const b = read('S09-03-史实时间线-v2.3-候选.md');
  const start = b.findIndex(l => l.startsWith('## 五')), end = b.findIndex(l => l.startsWith('## 六'));
  // 只取第五节第一张连续的表（主表），不含后面的提款数字对照表
  const h = b.findIndex((l, i) => i > start && i < end && l.startsWith('| 日期'));
  let k = h; while (b[k + 1].startsWith('|')) k++;
  const main = b.slice(h + 2, k + 1).map(dateCell);
  assert.equal(main[0], '10-22');
  assert.equal(main[main.length - 1], '1908 年 1 月前后');
  assert.equal(main.length, 21);
});
