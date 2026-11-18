/* 站内搜索索引：
 *   - 新鲜：重新从课程页生成一遍，必须与 assets/search-index.js 逐字相同；
 *   - 路由：每条结果都指向正式课程页，小节锚点在页面里存在；
 *   - 范围：只收可阅读课程的读者可见正文，不收筹备中的课、原稿、核验记录、内部说明或样稿的文字；
 *   筹备中的课在搜索面板里的行为（只按标题、标「筹备中」、只链接到目录行）由 site-browser.test.js 在真实浏览器里检查。
 * 运行：node --test site/tests/site-search.test.js */
'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const SITE = path.resolve(__dirname, '..');
const { build, OUT, dropHidden, dropTables } = require('../tools/build-search-index.js');
const ctx = { window: {} }; vm.createContext(ctx);
vm.runInContext(fs.readFileSync(path.join(SITE, 'assets/catalog.js'), 'utf8'), ctx);
vm.runInContext(fs.readFileSync(OUT, 'utf8'), ctx);
const MP = ctx.window.MP, IDX = ctx.window.MP_SEARCH;

test('索引是新鲜的：与从当前课程页重新生成的结果逐字相同', () => {
  assert.equal(fs.readFileSync(OUT, 'utf8'), build(), '课程页改过但索引没有重新生成：运行 node site/tools/build-search-index.js');
});

test('每条结果都指向正式课程页，锚点在页面中存在', () => {
  const ids = new Set(Object.keys(MP.readable));
  for (const e of IDX) {
    assert.ok(ids.has(e.id), '索引收了不可阅读的课：' + e.id);
    const [p, frag] = e.href.split('#');
    assert.equal(p, MP.readable[e.id].href);
    const html = fs.readFileSync(path.join(SITE, p, 'index.html'), 'utf8');
    if (frag) assert.ok(html.includes('id="' + frag + '"'), e.href + ' 的锚点不存在');
  }
  for (const id of ids) {
    assert.ok(IDX.some(e => e.id === id && e.href === MP.readable[id].href), id + ' 缺课程条目');
    assert.ok(IDX.filter(e => e.id === id).length >= 10, id + ' 小节太少');
  }
});

test('索引文字都来自课程页正文；不含草稿、审阅或样稿的字样', () => {
  const pages = {};
  const KEEP = /[^\p{L}\p{N}]/gu; // 只比较文字和数字，不管标点、实体与空白
  const flat = h => h.replace(/<[^>]+>/g, ' ').replace(/&[a-z]+;|&#\d+;/g, '').replace(KEEP, '');
  for (const id of Object.keys(MP.readable)) {
    const h = fs.readFileSync(path.join(SITE, MP.readable[id].href, 'index.html'), 'utf8');
    // 索引把每节的标题单独作为结果标题、不放进正文，隐藏元素也不收；所以同时比较去掉标题、去掉隐藏元素的页面文字
    pages[id] = [h, dropHidden(h), dropTables(dropHidden(h))].map(x => flat(x) + '|' + flat(x.replace(/<h[23][^>]*>[\s\S]*?<\/h[23]>/g, ' '))).join('|');
  }
  for (const e of IDX) {
    // 每条结果里抽出的几段文字（每段 10 个字）都能在课程页里找到：证明来自页面，而不是原稿或样稿
    const t = e.text.replace(KEEP, '');
    for (let i = 0; i + 10 <= t.length && i < 2000; i += 97)
      assert.ok(pages[e.id].includes(t.slice(i, i + 10)), e.href + ' 的文字不在课程页里：' + t.slice(i, i + 10));
    for (const bad of ['试写稿', '候选', '待审核', '未公开发布', '审核版本', '占位', '示意卡片', '.md', 'design-exploration', '设计样稿'])
      assert.ok(!(e.title + e.text).includes(bad), e.href + ' 含有「' + bad + '」');
  }
  // 默认隐藏的内容（小题提示与答案、沙盘揭晓）不进索引，搜索摘要不会提前透露答案
  const allText = IDX.map(e => e.text).join(' ');
  // 正文里可以有「最直白的答案：」这样的句子；小题的「答案：」「提示：」是独立的开头，前面不接文字
  for (const bad of ['答案：', '提示：']) assert.ok(!new RegExp('(?<!\\p{L})' + bad, 'u').test(allText), '索引收了隐藏的「' + bad + '」');
  for (const id of Object.keys(MP.readable)) {
    const h = fs.readFileSync(path.join(SITE, MP.readable[id].href, 'index.html'), 'utf8');
    for (const m of h.matchAll(/<p class="q(?:ans|hint)" hidden>([\s\S]*?)<\/p>/g)) {
      const s = m[1].replace(/<[^>]+>/g, '').replace(/^(答案|提示)：/, '').trim().slice(0, 40); // 取足够长的一段：提示常以正文里的半句话开头，只比 16 个字会误报
      assert.ok(!allText.includes(s), id + ' 的隐藏答案或提示进了索引：' + s);
    }
  }
  // 样稿里过期的 S02-02 v2 文字不在索引里
  const all = IDX.map(e => e.text).join(' ');
  assert.ok(!all.includes('试写稿 v2'));
});


test('不进索引的部分：hidden、free-only 实验控件（含嵌套）、<noscript>、图的表格视图', () => {
  const h = '<div><p>正文一</p><div hidden><div>答案<div>深层</div></div></div><label class="x free-only">控件<span>W：60</span></label><p>正文二</p></div>';
  assert.equal(dropHidden(h).replace(/\s+/g, ''), '<div><p>正文一</p><p>正文二</p></div>');
  assert.equal(dropTables('<p>a</p><details class="tbl add"><summary>表格视图</summary><table><tr><td>$1</td></tr></table></details><p>b</p>').replace(/\s+/g, ''), '<p>a</p><p>b</p>');
  const all = IDX.map(e => e.title + ' ' + e.text).join(' ');
  for (const bad of ['表格视图', '需要启用 JavaScript', '当天提款需求 W', '出借人对抵押贷款的评估值']) assert.ok(!all.includes(bad), '索引收了「' + bad + '」');
  // 筹备中的 56 课不在这份索引里（它们只在 search.js 里按课号和标题出现）
  const ids = new Set(IDX.map(e => e.id));
  assert.deepEqual([...ids].sort(), Object.keys(MP.readable).sort());
});
