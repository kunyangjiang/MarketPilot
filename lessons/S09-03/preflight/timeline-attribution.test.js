// S09-03 预检：史实时间线 v2.3 候选的来源归属保护（2026-11-17 补回）
// 取代已删除的「版本链 v2.1 → v2.2 → v2.3」与「已接受原件未被改动」两项测试。
// 旧版 v2.1 已删除，无法再逐行对照，所以把 v2.3 当前的日期行、来源代号与页码、英文引文冻结成清单：
// 今后修改时间线，若误删其中任何一项，这里会失败；确需删改，要同时更新清单并在变更记录里说明。
'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const dir = path.join(__dirname, '..');
const ROOT = path.join(dir, '..', '..');
const read = f => fs.readFileSync(path.join(dir, f), 'utf8').replace(/\r/g, '');
const TL = read('S09-03-史实时间线-v2.3-候选.md');
const L = TL.split('\n');

const DATES = ['1897–1907', '1903', '1907-08-22', '1906', '1906 年春', '1906 年末', '1907 年夏', '1907 年 5 月', '1907 年 2 月', '1907 年初',
  '10-12（周六）', '10-14（周一）', '10-15（周二）', '10-16（周三）', '10-16 前后', '10-17（周四）', '10-17 前后', '10-19（周六）', '10-20（周日）',
  '10-21（周一）', '10-18（周五）', '10-21（周一）', '10-21 晚', '10-21 晚', '10-22（周二）', '10-22', '—', '1907-11-14', '1908 年 3 月', '10-22',
  '10-23（周三）', '10-23 凌晨起', '10-23', '10-23', '10-23 晚', '10-24（周四）上午', '10-23/24', '10-24（周四）', '10-23 至约 11 月初', '10-24',
  '10-25（周五）', '10-26（周六）', '10-26 之后', '10-28/29', '11-2 至 11-4', '11-4 / 11-6', '—', '1908 年 1 月前后', '10-22', '10-23（周三）',
  '10-24（周四）', '1907-08-22 至 12-19', '1907 年恐慌期间（MT99 未给出起止日期）', '1908', '—', '1908-05-30', '1909–1910', '1910 年 11 月',
  '1911-01 / 1912', '1913-12-23', '1914-11-16', '1914'];
const REFS = ['FHZ', 'FRH', 'LSE', 'MT99', 'OCC', 'SPR', 'T-CHLC', 'TM90', 'WP', 'YPFS', 'p.1', 'p.11', 'p.12', 'p.178', 'p.249', 'p.250',
  'p.250–251', 'p.251', 'p.252', 'p.252–253', 'p.253', 'p.255', 'p.256–257', 'p.258', 'p.5', 'p.69–70', 'p.70', 'p.9', 'p.91'];
const QUOTES = ['considerably larger', 'the most important exception', 'three hours', 'just after noon', 'nearly $8 million',
  'closed its doors on October 22', 'partly funded by the U.S. Treasury', 'no margin sales were allowed—only cash sales for investment',
  'available only to members', 'some $34,000,000',
  'the massive withdrawal of over 36 percent of deposits from New York City trust companies… between August 22 and December 19, 1907',
  'During the Panic of 1907, loans at New York City trust companies fell precipitously by nearly 37 percent. In contrast, loans at New York City national banks increased by over 8 percent.'];

test('时间线 v2.3 候选：62 个日期行都还在（含重复出现的日期）', () => {
  const now = L.filter(l => /^\| (1[0-9]{3}|10-|11-|—)/.test(l)).map(l => l.split('|')[1].trim());
  const cnt = a => a.reduce((m, d) => (m[d] = (m[d] || 0) + 1, m), {});
  const want = cnt(DATES), have = cnt(now);
  for (const d of Object.keys(want)) assert.ok((have[d] || 0) >= want[d], '日期行丢失：' + d);
});

test('时间线 v2.3 候选：来源代号、页码与英文原文引文都还在', () => {
  for (const r of REFS) assert.ok(new RegExp('(^|[^\\w.])' + r.replace(/[.]/g, '\\.') + '(?![\\d–])').test(TL), '来源标记丢失：' + r);
  for (const q of QUOTES) assert.ok(TL.includes('"' + q + '"'), '英文引文丢失：' + q);
});

test('来源归属一致：图 A / 图 B 用到的每个来源代号，都列在课程页「来源」一节，也出现在时间线里', () => {
  const H = require(path.join(ROOT, 'site/lessons/S09-03/history.js'));
  const page = fs.readFileSync(path.join(ROOT, 'site/lessons/S09-03/index.html'), 'utf8');
  const used = new Set();
  [...H.T, ...H.RATES, H.DEPOSITS, ...H.EDGES, ...Object.values(H.NODES)].forEach(e => (e.src || []).forEach(c => used.add(c)));
  assert.ok(used.size >= 8, '图用到的来源太少：' + [...used]);
  for (const c of used) {
    assert.ok(page.includes('id="src-' + c + '"'), '课程页「来源」缺少 ' + c);
    assert.ok(TL.includes(c), '时间线中没有来源代号 ' + c);
  }
});

test('当前候选文件没有被其他版本覆盖：四份文件的版本行', () => {
  assert.match(read('S09-03-课文-v2.2-候选.md').split('\n')[2], /^> 阶段 09 · 试写稿 v2\.2 候选（= v2\.1 \+ 已批准的 R1–R6）/);
  assert.match(read('S09-03-史实时间线-v2.3-候选.md').split('\n')[2], /^版本：v2\.3 候选（/);
  assert.match(read('S09-03-交互方案-v2.2-候选.md').split('\n')[2], /^版本：v2\.2 候选（/);
  assert.match(read('S09-03-核验记录与自评-v2.2-候选.md').split('\n')[2], /^版本：v2\.2 候选（/);
});
