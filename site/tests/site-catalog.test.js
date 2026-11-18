/* 站点课程目录：与冻结的课程体系 v1.0 逐条核对。
 *   - 4 个层级、11 个阶段、61 课：层名、阶段号、阶段名、课数、课号、标题、顺序都与课程体系一致；
 *   - 只有 S02-01、S02-02、S02-03、S02-04 与 S09-03 有课程页；其余 56 课只列标题，不带链接，也没有任何状态标签。
 * 运行：node --test site/tests/site-catalog.test.js */
'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.resolve(__dirname, '..', '..');
const SITE = path.join(ROOT, 'site');
const CUR = fs.readFileSync(path.join(ROOT, 'MarketPilot-课程体系-v1.0.md'), 'utf8').replace(/\r/g, '');
global.window = {};
require('../assets/catalog.js');
const MP = global.window.MP;
delete global.window;

const sect = (a, b) => CUR.slice(CUR.indexOf(a), CUR.indexOf(b));
const cells = l => l.split('|').slice(1, -1).map(c => c.trim());

test('层级与阶段：与课程体系第 1 节「整体结构」一致', () => {
  const rows = sect('## 1. 整体结构', '## 2.').split('\n').filter(l => /^\| [^|]*\| S\d\d /.test(l)).map(cells);
  assert.equal(rows.length, 11);
  let layer = -1;
  const want = [];
  for (const [ln, sid, name, n] of rows) {
    if (ln) { layer++; want.push({ name: ln.replace(/^[一二三四]、/, ''), n: ln[0], stages: [] }); }
    want[layer].stages.push({ id: sid, name, count: Number(n) });
  }
  assert.deepEqual(MP.layers.map(L => ({ name: L.name, n: L.n, stages: L.stages.map(s => ({ id: s.id, name: s.name, count: s.lessons.length })) })), want);
});

test('61 课：课号、标题、顺序与课程体系第 2 节「完整课程表」逐字一致', () => {
  const rows = sect('## 2. 完整课程表', '## 3.').split('\n').filter(l => /^\| S\d\d-\d\d \|/.test(l)).map(cells);
  assert.equal(rows.length, 61);
  assert.deepEqual(MP.lessons.map(l => l.id), rows.map(r => r[0]), '课号或顺序不一致');
  rows.forEach((r, i) => assert.equal(MP.lessons[i].t, r[1], r[0] + ' 标题不一致'));
  assert.equal(new Set(MP.lessons.map(l => l.id)).size, 61);
  // 阶段小标题里的阶段名与课数
  const heads = [...sect('## 2. 完整课程表', '## 3.').matchAll(/^### (S\d\d) — (.+)（(\d+) 课）$/gm)];
  assert.equal(heads.length, 11);
  heads.forEach(([, id, name, n]) => { const s = MP.stages.find(x => x.id === id); assert.equal(s.name, name); assert.equal(s.lessons.length, Number(n)); });
});

test('已写好的课：S02-01 至 S02-04 与 S09-03，各有课程页；核心问题与课程页一致', () => {
  assert.deepEqual(MP.lessons.filter(l => l.readable).map(l => l.id), ['S02-01', 'S02-02', 'S02-03', 'S02-04', 'S09-03']);
  assert.equal(MP.lessons.filter(l => !l.readable).length, 56);
  for (const [id, r] of Object.entries(MP.readable)) {
    assert.equal(r.href, 'lessons/' + id + '/');
    const html = fs.readFileSync(path.join(SITE, r.href, 'index.html'), 'utf8');
    assert.ok(html.includes('<p class="q">' + r.q + '</p>'), id + ' 核心问题与课程页不一致');
    const h1 = html.match(/<h1[^>]*>([^<]*)<\/h1>/)[1];
    assert.equal(h1, MP.lessons.find(l => l.id === id).t, id + ' 课程页标题与目录不一致');
  }
});

test('不显示任何状态标签：外壳和目录数据里没有「可阅读 / 筹备中 / 写作中 / 已发布 / 预览 / 未发布」', () => {
  assert.equal(MP.status, undefined);
  for (const f of ['index.html', 'assets/shell.js', 'assets/search.js', 'assets/catalog.js']) {
    const s = fs.readFileSync(path.join(SITE, f), 'utf8').replace(/\/\*[\s\S]*?\*\//g, '');
    for (const bad of ['可阅读', '筹备中', '写作中', '开发中', '已发布', '未发布', '预览']) assert.ok(!s.includes(bad), f + ' 仍有「' + bad + '」');
  }
});
