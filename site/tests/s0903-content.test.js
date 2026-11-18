/* S09-03 内容一致性：
 *   1. 页面正文 = 课文 v2.2 候选（逐段核对，不允许改写）；R1–R6 的新句在、旧句不在；
 *   2. 图 A / 图 B 的每条史实都能在《史实时间线》v2.3 候选中唯一定位，来源代号出现在该行；
 *   3. 模型界面不含真实机构名与被禁止的措辞。 */
'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const ROOT = path.resolve(__dirname, '..', '..');
const rd = p => fs.readFileSync(path.join(ROOT, p), 'utf8').replace(/\r/g, '');
const MS = rd('lessons/S09-03/S09-03-课文-v2.2-候选.md');
const TL = rd('lessons/S09-03/S09-03-史实时间线-v2.3-候选.md');
const HTML = rd('site/lessons/S09-03/index.html');
const H = require('../lessons/S09-03/history.js');

const dec = s => s.replace(/<[^>]+>/g, '').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&amp;/g, '&')
  .replace(/[「」]/g, '"'); // 页面把课文的引号统一排成直角引号「」（两课一致），比较时还原
const article = dec(HTML.slice(HTML.indexOf('<article'), HTML.indexOf('</article>')));
const flat = s => s.replace(/\s+/g, '');

test('正文与课文 v2.2 候选逐段一致（标题、段落、列表）', () => {
  const body = MS.split('\n').slice(5);
  let n = 0;
  for (const l of body) {
    if (!l.trim() || l.startsWith('>') || l === '---' || l.startsWith('*本课中')) continue;
    let t = l.replace(/^## /, '').replace(/^- /, '').replace(/^\d+\. /, '').replace(/\*\*/g, '');
    if (/^[一二三四五六七八九十]、/.test(t)) t = t.split('、').slice(1).join('、');
    assert.ok(flat(article).includes(flat(t)), '页面缺少或改写了：' + t.slice(0, 40));
    n++;
  }
  assert.ok(n > 60, '核对的段落太少：' + n);
});

test('图 1、图 2、图 3、图 4 的文字与课文一致', () => {
  for (const s of ['金库现金', '存在其他银行的款项', '能叫回，但在恐慌中要打折', '能卖，但在恐慌中要打大折', '抵押贷款与其他长期贷款']) assert.ok(article.includes(s), s);
  for (const s of ['存款人提款', '信托公司现金不足', '叫回通知贷款', '经纪商找不到新的贷款', '卖出作抵押的股票', '股价下跌', '其他贷款的抵押品价值也下降', '出借人更不敢借、更想叫回']) assert.ok(article.includes(s), s);
  const rows = MS.split('\n').filter(l => /^> \| \*\*/.test(l));
  assert.equal(rows.length, 6); // 表头 + 五层
  for (const r of rows) for (const c of r.replace(/^> \|/, '').replace(/\|\s*$/, '').split('|')) assert.ok(flat(article).includes(flat(c.replace(/\*\*/g, ''))), '图 4 缺：' + c.trim().slice(0, 20));
});

const R = [
  ['纽约没有一家信托公司是会员', '1907 年，纽约的信托公司普遍不在会员之列。'],
  ['而且都不是清算所会员', '而且普遍不是清算所会员'],
  ['研究者统计，1907 年 8 月 22 日到 12 月 19 日，纽约 38 家信托公司', '据联储史料网站，1907 年 8 月 22 日到 12 月 19 日，纽约信托公司的存款减少了三分之一以上；Frydman、Hilt 与 Zhou 的研究还发现'],
  ['而且钱附有条件，不许用于保证金投机', '而且钱还附有限制，用意是抑制投机：只许用于现金交易，不许用于保证金交易。'],
  ['Tallman 与 Moen 引用当时的观察者说', 'Tallman 与 Moen 写道，知情的观察者普遍认为，同样的事放在一个好一些的经济环境里，很可能不会酿成恐慌。'],
  ['芝加哥的清算所当时就接纳了大信托公司', '（在芝加哥，较大的信托公司当时已经是清算所会员）']
];
test('R1–R6：新句在页面与 v2.2 候选中，旧句都不在', () => {
  R.forEach(([before, after], i) => {
    assert.ok(MS.includes(after), 'v2.2 候选缺 R' + (i + 1)); assert.ok(article.includes(after), '页面缺 R' + (i + 1));
    assert.ok(!MS.includes(before) && !article.includes(before), 'R' + (i + 1) + ' 的旧句仍在');
  });
});

const tlRows = TL.split('\n').filter(l => /^\| /.test(l));
const findRow = (row, match) => tlRows.filter(l => l.startsWith('| ' + row + ' |') && l.includes(match));
test('图 A：每条事件都能在时间线 v2.3 中唯一定位，来源代号都在该行', () => {
  for (const e of [...H.T, ...H.RATES, H.DEPOSITS]) {
    const hits = findRow(e.row, e.match);
    assert.equal(hits.length, 1, '无法唯一定位：' + e.row + ' / ' + e.match);
    for (const c of e.src) assert.ok(hits[0].includes(c), e.row + ' 行中没有来源 ' + c);
    if (e.st === '✔') assert.ok(/\| ✔/.test(hits[0]), e.row + ' 在时间线中不是 ✔，不能标 ✔');
  }
});

test('图 A：没有 ☐ 条目；◐ 条目都写明差异', () => {
  for (const e of H.T) { assert.ok(['✔', '◐'].includes(e.st)); if (e.st === '◐') assert.ok(e.diff, e.date + ' 缺差异说明'); }
});

test('图 B：关系分类分开；未知关系不画线；援助线都有来源', () => {
  assert.equal(H.NODES.TCA.agent, '清算代理关系未确立');
  assert.equal(H.NODES.LIN.agent, '清算代理关系未确立');
  assert.equal(H.NODES.BRK.m, 'unk');
  assert.ok(!H.EDGES.some(e => e.type === 'agency' && ['TCA', 'LIN'].includes(e.from)));
  const ag = H.EDGES.find(e => e.id === 'ag1'); assert.equal(ag.ann, 6); assert.equal(ag.end, 7);
  assert.ok(H.EDGES.every(e => e.src && e.src.length));
  assert.ok(H.EDGES.every(e => ['person', 'agency', 'aid', 'aidi'].includes(e.type)));
  for (const id of ['MER', 'NBC', 'NCB', 'FNB', 'OMB']) assert.equal(H.NODES[id].m, 'member');
  for (const id of ['KNI', 'TCA', 'LIN', 'OTC']) assert.equal(H.NODES[id].m, 'non');
});

test('沙盘区域（页面源码）不含真实名字与被禁止的措辞', () => {
  const sb = dec(HTML.slice(HTML.indexOf('id="sim-model"'), HTML.indexOf('<aside class="hist"')));
  for (const bad of ['尼克博克', '摩根', '斯特朗', '国民', '美国信托', '林肯', '纽约', '1907', '无清算安排', '出借人损失', '资不抵债'])
    assert.ok(!sb.includes(bad), '沙盘出现了"' + bad + '"');
  const js = rd('site/lessons/S09-03/liquidity.js');
  for (const bad of ['尼克博克', '摩根', 'Knickerbocker', '资不抵债']) assert.ok(!js.includes(bad));
});

test('已编写的课程不显示「待审核 / 未公开发布」等状态文字', () => {
  assert.ok(!/未公开发布|待审核|审核版本/.test(HTML));
  assert.ok(!/试写稿|候选/.test(dec(HTML)), '页面不应出现「试写稿 / 候选」等草稿字样');
});

/* 开场照片：NYPL 馆藏「Manhattan: Wall Street / Wall Street during the money panic」，1907 年（馆藏推定），Image ID 723882F。
   页面上显示的是 Commons 上同一张照片的数字化版本（1907_Panic.png，去掉了卡纸边框）。
   照片只作氛围：说明文字不能把它说成 10 月 22 日尼克博克挤兑的现场，也不能声称版权已经清楚。 */
const NYPL = 'https://old-digitalcollections.nypl.org/items/510d47dd-5b2c-a3d9-e040-e00a18064a99';
const CAP = '华尔街金融恐慌时期的人群。纽约公共图书馆馆藏，1907 年（馆藏推定）。';
test('开场照片：只有一张，是 1907 年华尔街人群照；说明文字与链接正确；年份写明「馆藏推定」；不指认具体事件；不声称版权已清', () => {
  const imgs = [...HTML.matchAll(/<img\s[^>]*>/g)].map(m => m[0]);
  assert.equal(imgs.length, 1, '页面应只有开场这一张照片');
  const img = imgs[0];
  assert.match(img, /class="ph-img"/);
  assert.ok(img.includes('src="https://upload.wikimedia.org/wikipedia/commons/thumb/1/18/1907_Panic.png/960px-1907_Panic.png"'), '开场照片地址不对');
  // 无障碍：有描述画面的替代文字；替代文字只描述画面，不指认日期或机构
  const alt = img.match(/alt="([^"]*)"/)[1];
  assert.ok(alt.length >= 8, '替代文字太短：' + alt);
  assert.ok(!/尼克博克|Knickerbocker|10 月 22|挤兑/.test(alt), '替代文字不应指认具体事件：' + alt);
  // 照片在开场 figure 里，文字（日期、数字、说明）照旧
  const fig = HTML.slice(HTML.indexOf('<figure class="ph has-photo"'), HTML.indexOf('</figure>', HTML.indexOf('<figure class="ph has-photo"')));
  assert.ok(fig.includes(img));
  assert.ok(fig.includes('<p class="ph-date">1907 · 10 · 22　星期二</p>'));
  assert.ok(fig.includes('<p class="ph-big">约<em>三个小时</em>，<br>约 800 万美元现金，<br>中午刚过，暂停营业。</p>'));
  assert.ok(fig.includes('尼克博克信托公司被挤兑的那个上午。数字据亚特兰大联储研究者整理的记录（TM90）。'));
  // 照片说明：原文一字不差，链接到 NYPL 馆藏条目
  const cap = fig.match(/<figcaption class="ph-cap"><a href="([^"]+)" rel="noopener">([^<]+)<\/a><\/figcaption>/);
  assert.ok(cap, '缺少照片说明');
  assert.equal(cap[1], NYPL); assert.equal(cap[2], CAP);
  assert.match(cap[2], /1907 年（馆藏推定）/);
  assert.ok(!/尼克博克|Knickerbocker|10 月 22|挤兑|现场/.test(cap[2]), '照片说明不应指认具体事件');
  // 页脚来源：同一条馆藏记录；全页不声称这张照片版权已清
  const credits = HTML.match(/<p class="credits">([\s\S]*?)<\/p>/)[1];
  assert.ok(credits.includes('723882F') && credits.includes(NYPL) && credits.includes('1907 年（馆藏推定）'));
  assert.ok(!/Public domain|公有领域|无版权|版权已清|已获授权|rights[- ]cleared/i.test(fig + credits), '不应声称版权已清');
  // 不出现开发状态或审阅标记
  for (const x of ['档案照片待核实', 'review-only', '内部审阅', '预留给一张档案照片', 'ph-tag', '版权未定', '待核实']) assert.ok(!HTML.includes(x), '页面仍有：' + x);
  assert.ok(!/review/.test(rd('site/lessons/S09-03/lesson.js')), 'lesson.js 仍有 review 开关');
});
