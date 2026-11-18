/* S02 第一批（S02-01、S02-03、S02-04）课程页的内容检查：不开浏览器，只读 HTML 与数据文件。
 *   - 开场照片：公有领域档案照片，链接到 Wikimedia Commons，页脚写明来源；照片只作氛围；
 *   - 关键数字逐字出现（招股书、订单簿、结算链条的数字）；
 *   - 默认隐藏的答案用 hidden 属性；不残留开发痕迹。
 * 运行：node --test site/tests/s02-batch01-content.test.js */
'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const SITE = path.resolve(__dirname, '..');
const read = (id, f) => fs.readFileSync(path.join(SITE, 'lessons', id, f || 'index.html'), 'utf8');
const IDS = ['S02-01', 'S02-03', 'S02-04'];
const PHOTO = {
  'S02-01': { file: 'Broad_Street_and_Curb_Brokers', year: '1908', color: true },
  'S02-03': { file: 'LCCN2006685051', year: '1907', color: false },
  'S02-04': { file: 'LCCN94509160', year: '1920', color: false }
};
const data = (id, name) => { const ctx = { window: {} }; vm.createContext(ctx); vm.runInContext(read(id, 'data.js'), ctx); return ctx.window[name]; };

test('开场照片：公有领域档案照片；Commons 链接；页脚写明来源与处理方式；不声称与课文公司有关', () => {
  for (const id of IDS) {
    const h = read(id), p = PHOTO[id];
    const fig = h.match(/<figure class="shot"[\s\S]*?<\/figure>/);
    assert.ok(fig, id + ' 缺开场照片');
    const f = fig[0];
    assert.match(f, /<img src="https:\/\/upload\.wikimedia\.org\/wikipedia\/commons\/thumb\//, id + ' 照片应来自 Wikimedia Commons');
    assert.ok(f.includes(p.file), id + ' 照片文件不对');
    assert.equal((f.match(/class="hot/g) || []).length, 2, id + ' 应有两个标注');
    assert.match(f, /<a class="credit" href="https:\/\/commons\.wikimedia\.org\/wiki\/File:[^"]+">[^<]*Public domain<\/a>/);
    assert.match(f, /<figcaption class="sr">[^<]*照片仅作开场氛围，与课文中的虚构公司无关。<\/figcaption>/);
    assert.match(f, /alt="[^"]{12,}"/, id + ' 缺照片描述');
    assert.ok(f.includes(p.year), id + ' 标注或说明里应有拍摄年代');
    assert.equal(/filter:none/.test(f), p.color, id + (p.color ? ' 早期彩色明信片不去色' : ' 黑白照片沿用全站的去色处理'));
    const cr = h.match(/<p class="credits">([\s\S]*?)<\/p>/);
    assert.ok(cr, id + ' 页脚缺照片来源');
    assert.match(cr[1], /Public domain/); assert.match(cr[1], /Wikimedia Commons/); assert.match(cr[1], /仅作开场氛围/);
    assert.match(cr[1], p.color ? /照片经裁切，/ : /照片经裁切、去色处理/);
    if (!p.color) assert.match(cr[1], /美国国会图书馆，LCCN \d+/);
    assert.ok(!h.includes('class="ph'), id + ' 不应再有纯文字开场');
  }
});

test('S02-01：招股书数字逐字一致；四个决定（总额、折扣、开放题、先猜后看）都在', () => {
  const h = read('S02-01');
  for (const s of ['$1,666,429,420', '19,605,052', '14,142,135', '5,462,917', '$1,202,081,475', '$464,347,945', '$2.3839', '$1,168,368,039', '$451,324,897', '14,159,265', '$4,114,328,427', '$302.09'])
    assert.ok(h.includes(s), 'S02-01 缺 ' + s);
  // 两条线的计算互相印证：每股 $85，扣承销折扣 $2.3839
  assert.equal(Math.round(14142135 * (85 - 2.3839)), 1168368039);
  assert.equal(Math.round(5462917 * (85 - 2.3839)), 451324897);
  assert.equal(14142135 * 85 + 5462917 * 85, 1666429420);
  assert.ok(h.includes('class="quiz open"'), '小题 4 应是开放题');
  assert.match(h, /<div class="predict" id="fig1-pre">/, '图 1 应先猜后看');
  assert.match(h, /<p class="pans" hidden>/, '图 1 的答案默认用 hidden 属性隐藏');
  assert.match(h, /<div class="f1-body" id="fig1-body" hidden>/);
});

test('S02-03：订单簿数据与课文一致；价差、深度、冲击分开讲；SEC 第 31 条费率注明生效日', () => {
  const D = data('S02-03', 'S0203Data');
  assert.equal(JSON.stringify(D.book.asks.map(a => a[0])), "[10002,10012,10028,10045,10063]");
  assert.equal(D.book.asks.reduce((a, [p, q]) => a + p * q, 0), 10030000, '买 1,000 股合计 $100,300');
  assert.equal(D.sec31PerMillion, 20.60);
  const h = read('S02-03');
  for (const s of ['$100.30', '$100,300', '价差', '深度', '价格冲击', '$20.60']) assert.ok(h.includes(s), 'S02-03 缺 ' + s);
  assert.ok(/2026 年 4 月 4 日|2026-04-04/.test(h), '费率应写明生效日');
  assert.equal((h.match(/<figure class="pf" id="fig\d"/g) || []).length, 6);
});

test('S02-04：与 S02-02 的 600 股、$30,017 衔接；轧差算术；保证金数字卡', () => {
  const D = data('S02-04', 'S0204Data');
  assert.equal(D.fills.reduce((a, [p, q]) => a + p * q, 0), 3001700);
  assert.equal(D.fills.reduce((a, f) => a + f[1], 0), 600);
  assert.equal(D.trades.reduce((a, t) => a + t.side * t.qty, 0), -100);
  assert.equal(D.trades.reduce((a, t) => a - t.side * t.cents, 0), 502100);
  assert.equal(D.call.mtm + D.call.special, D.call.total);
  const h = read('S02-04');
  for (const s of ['600 股', '$30,017', 'NSCC', 'DTC', 'T+1', '中央对手方', '36 个', '69 亿美元', '255 亿美元', 'Release No. 34-83748'])
    assert.ok(h.includes(s), 'S02-04 缺 ' + s);
  assert.match(h, /2024 年 5 月 28 日/);
  assert.match(h, /具体比例和步骤以 NSCC 现行规则为准/, '历史规则与现行要求要分开说');
});

test('成品页：五道小题；隐藏答案都用 hidden 属性；没有开发痕迹；noindex 保留', () => {
  for (const id of IDS) {
    const h = read(id);
    assert.equal((h.match(/<div class="quiz/g) || []).length, 5, id + ' 小题数');
    assert.ok(!/候选|modebtn|改看静态版|试写稿|待审核|TODO|占位/.test(h.replace(/<script[\s\S]*?<\/script>/g, '')), id + ' 有开发痕迹');
    assert.match(h, /<meta name="robots" content="noindex">/);
    for (const m of h.matchAll(/<p class="(qans|qhint|pans)"([^>]*)>/g)) assert.match(m[2], /\bhidden\b/, id + ' 的 ' + m[1] + ' 应默认 hidden');
    assert.ok(h.includes('../S02-02/reader.js'), id + ' 应复用 S02-02 的阅读脚本');
  }
});
