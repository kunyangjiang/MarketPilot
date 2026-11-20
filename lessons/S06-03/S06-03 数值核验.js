// S06-03 数值核验：node "lessons/S06-03/S06-03 数值核验.js"
// 读取《S06-03 课文 v1 候选.md》与《S06-03 图与交互方案 v1 候选.md》。
// 教学模型与论文例子的数字：先独立重算，再断言课文（及图方案）里确实以该写法出现。
// 论文报告的统计量：重算其中的和、比，并断言原值出现；原值出处见核验记录。
// 不依赖网络与临时目录。
'use strict';
const fs = require('fs');
const path = require('path');

const LESSON = fs.readFileSync(path.join(__dirname, 'S06-03 课文 v1 候选.md'), 'utf8').replace(/\r/g, '');
const FIG = fs.readFileSync(path.join(__dirname, 'S06-03 图与交互方案 v1 候选.md'), 'utf8').replace(/\r/g, '');

let pass = 0, fail = 0;
function ok(id, cond, msg) { if (cond) pass++; else { fail++; console.log('失败 ' + id + '：' + (msg || '')); } }
const near = (a, b, tol) => Math.abs(a - b) < (tol || 1e-9);
function num(id, got, want, dp, text, fig) {
  const r = Number(got.toFixed(dp));
  ok(id + ' 重算', near(r, want), `重算 ${got} → ${r}，应为 ${want}`);
  if (text) ok(id + ' 课文出现', LESSON.includes(text), `课文里没有「${text}」`);
  if (fig) ok(id + ' 图方案出现', FIG.includes(fig === true ? text : fig), `图方案里没有「${fig === true ? text : fig}」`);
}
const inL = (id, s) => ok(id + ' 课文出现', LESSON.includes(s), `课文里没有「${s}」`);
const inF = (id, s) => ok(id + ' 图方案出现', FIG.includes(s), `图方案里没有「${s}」`);
const money = x => '$' + x.toFixed(2);

// ---------- A 组：开场（教学假设） ----------
num('A1 卖价比中间价多一美分', 50.01 - 50.00, 0.01, 2, '比起中间价 $50.00，你每股多收了一美分');
num('A2 次日 $52 少收', 52 - 50.01, 1.99, 2, '你每股等于少收了 $1.99');
inL('A3 报价', '按 $49.99 买，按 $50.01 卖');

// ---------- B 组：阿克洛夫二手车（S0603-R01 第 490–491 页，单位 ×$1,000） ----------
const VMAX = 2000, MULT = 1.5;
// 对称信息：买方对每辆车的估值 1.5x > 车主的 x，全部成交
ok('B0 对称信息全部成交', MULT > 1, '买方估值倍数须大于 1');
inL('B0 课文', '所有的车都会成交');
// 不对称信息：价格 p 时只有 x < p 的车卖出，平均 p/2，买方愿付 1.5 × p/2 = 0.75p < p
for (const p of [100, 500, 1000, 1500, 1999, 2000, 2999]) {
  const avg = Math.min(p, VMAX) / 2;
  ok('B1 任何价格都不成交 p=' + p, MULT * avg < p, `p=${p} 时买方愿付 ${MULT * avg}`);
}
num('B2 原文价格区间上限 3（×1000）', MULT * VMAX, 3000, 0, '在 $0 到 $3,000 之间的任何一个价格上');
inL('B2b 区间', '车主心里的价值从 $0 到 $2,000 不等');
inL('B2c 1.5 倍', '买方愿意付的都是车主心里价值的 1.5 倍');
const rounds = []; let p = MULT * VMAX / 2; // 第 1 轮按全部车的平均出价
num('B3 第一轮出价', p, 1500, 0, '那就出 $1,500');
inL('B3b 平均 $1,000', '车的平均价值是 $1,000');
for (let k = 1; k <= 10; k++) { const avg = p / 2, pay = MULT * avg; rounds.push({ k, p, share: p / VMAX * 100, avg, pay }); p = pay; }
const R = rounds;
// 表格四行
const rowText = r => {
  const pStr = r.k === 1 ? '$1,500' : r.k === 2 ? '$1,125' : money(r.p);
  return pStr;
};
num('B4 第1轮 平均', R[0].avg, 750, 2); num('B4 第1轮 愿付', R[0].pay, 1125, 2);
num('B5 第2轮 平均', R[1].avg, 562.5, 2); num('B5 第2轮 愿付', R[1].pay, 843.75, 2);
num('B6 第3轮 平均', R[2].avg, 421.88, 2); num('B6 第3轮 愿付', R[2].pay, 632.81, 2);
num('B7 第4轮 平均', R[3].avg, 316.41, 2); num('B7 第4轮 愿付', R[3].pay, 474.61, 2);
num('B8 比例 1', R[0].share, 75, 2); num('B8 比例 2', R[1].share, 56.25, 2);
num('B8 比例 3', R[2].share, 42.2, 1); num('B8 比例 4', R[3].share, 31.6, 1);
num('B9 第10轮出价', R[9].p, 112.63, 2, null, '第 10 轮出价约 $112.63');
const rowsL = [
  '| 1 | $1,500 | 车主心里值 $0–$1,500 | 75% | $750 | $1,125 |',
  '| 2 | $1,125 | 车主心里值 $0–$1,125 | 约 56.3% | $562.50 | $843.75 |',
  '| 3 | $843.75 | 车主心里值 $0–$843.75 | 约 42.2% | $421.88 | $632.81 |',
  '| 4 | $632.81 | 车主心里值 $0–$632.81 | 约 31.6% | $316.41 | $474.61 |',
];
rowsL.forEach((s, i) => inL('B10 图1 第' + (i + 1) + '行', s));
['| 1 | $1,500 | $0–$1,500 | 75% | $750 | $1,125 |', '| 4 | $632.81 | $0–$632.81 | 约 31.6% | $316.41 | $474.61 |']
  .forEach((s, i) => inF('B11 图方案行' + i, s));
ok('B12 每轮 0.75', R.every((r, i) => i === 0 || near(r.p, R[i - 1].p * 0.75, 1e-6)), '出价比');
inL('B12b 四分之三', '每一轮，买方愿付的价格都只有上一轮出价的四分之三');
inL('B13 正文 $750 $1,125', '还肯卖的车，平均只值 $750，买方只愿意为它们付 $1,125');
// 小题 1：出价 $1,800
num('B14 小题1 平均', 1800 / 2, 900, 0, '平均值 $900');
num('B15 小题1 愿付', MULT * 1800 / 2, 1350, 0, '也就是 $1,350，低于 $1,800');

// ---------- C 组：格洛斯滕–米尔格罗姆式模型，流动性交易者一定来（教学假设） ----------
const VH = 60, VL = 40, PI = 0.5, E0 = PI * VH + (1 - PI) * VL;
num('C0 公开信息价值', E0, 50, 2, '按公开信息，它值 $50');
function inelastic(a) { // 返回 [卖价, 买价]
  const pBuyH = a + (1 - a) / 2, pBuyL = (1 - a) / 2;
  const qH = PI * pBuyH / (PI * pBuyH + (1 - PI) * pBuyL);
  const pSellH = (1 - a) / 2, pSellL = a + (1 - a) / 2;
  const rH = PI * pSellH / (PI * pSellH + (1 - PI) * pSellL);
  return [VL + (VH - VL) * qH, VL + (VH - VL) * rH];
}
// 100 人计数法（图 2）
const N = 100, a20 = 0.2;
const goodBuy = N * a20 + N * (1 - a20) / 2, badBuy = N * (1 - a20) / 2;
num('C1 好日子买单', goodBuy, 60, 0, '其中 60 张来自好消息的日子', '60 人买，40 人卖');
num('C2 坏日子买单', badBuy, 40, 0, '40 张来自坏消息的日子');
num('C3 卖价 $52', (goodBuy * VH + badBuy * VL) / (goodBuy + badBuy), 52, 2, '(60 × $60 + 40 × $40) ÷ 100 = $52', true);
num('C4 买价 $48', (badBuy * VH + goodBuy * VL) / (goodBuy + badBuy), 48, 2, '一张卖单背后，股票的平均价值是 $48');
const [A20, B20] = inelastic(0.2);
num('C5 贝叶斯卖价', A20, 52, 6); num('C6 贝叶斯买价', B20, 48, 6);
inL('C7 报价', '卖价 $52，买价 $48，价差 $4');
// 零利润验算
const infTake = N * a20 * (VH - A20), liqPay = N * (1 - a20) * (A20 - E0);
num('C8 知情者拿走', infTake, 160, 2, '20 个知情的买家共拿走 $160');
num('C9 流动性多付', liqPay, 160, 2, '80 个流动性买家共多付 $160');
num('C10 每个知情者 $8', VH - A20, 8, 2, '做市商亏 $8');
num('C11 每个流动性 $2', A20 - E0, 2, 2, '每人多收 $2');
num('C12 两日合计利润为零', goodBuy * (A20 - VH) + badBuy * (A20 - VL), 0, 6);
// 价差 = α × $20
for (const [a, s] of [[0.2, 4], [0.1, 2], [0, 0]]) { const [A, B] = inelastic(a); num('C13 价差 α=' + a, A - B, s, 6); num('C13b 公式', a * (VH - VL), s, 6); }
inL('C14 正文', '占 20% 时是 $4，占 10% 时是 $2，没有知情者时为零');
// 小题 2：α = 10%
const gb10 = N * 0.1 + N * 0.9 / 2, bb10 = N * 0.9 / 2;
num('C15 小题2 好日子', gb10, 55, 0, '共 55 张买单');
num('C16 小题2 卖价', (gb10 * VH + bb10 * VL) / N, 51, 2, '(55 × $60 + 45 × $40) ÷ 100 = $51');
num('C17 小题2 买价', inelastic(0.1)[1], 49, 6, '卖价 $51，买价 $49，价差 $2');
// 极端：全是知情者
{ const [A, B] = inelastic(1); num('C18 α=1 卖价', A, 60, 6); num('C18 α=1 买价', B, 40, 6); }
inL('C18b', '卖价要定到 $60，买价要定到 $40');
// 90% 时仍开着
{ const [A, B] = inelastic(0.9); num('C19 α=0.9 价差', A - B, 18, 6, '价差 $18，卖价 $59'); num('C19b 知情者赚 $1', VH - A, 1, 6, '知情者买一股仍能赚 $1'); inF('C19c', '「一定来」在 90% 时卖价 $59、买价 $41、价差 $18'); }
// 第一笔买单之后的更新
const post1 = (PI * (a20 + (1 - a20) / 2)) / 0.5;
num('C20 后验 60%', post1 * 100, 60, 6, '从一半升到 60%');
const hh = 0.6 * 0.6, ll = 0.4 * 0.4;
num('C21 两买 好日子个数', 100 * hh, 36, 6, '好日子里有 36 个，坏日子里有 16 个');
num('C22 新卖价', (36 * 60 + 16 * 40) / 52, 53.85, 2, '(36 × $60 + 16 × $40) ÷ 52，约 $53.85');
num('C22b 贝叶斯新卖价', VL + (VH - VL) * (post1 * 0.6) / (post1 * 0.6 + (1 - post1) * 0.4), 53.85, 2);
num('C23 一买一卖 各 24', 100 * 0.6 * 0.4, 24, 6, '好日子和坏日子里各有 24 个，平均值 $50');
num('C23b 新买价', VL + (VH - VL) * (post1 * 0.4) / (post1 * 0.4 + (1 - post1) * 0.6), 50, 6);

// ---------- D 组：流动性交易者嫌贵会走（教学假设，上限 t ~ U[$0, $10]） ----------
const T = 10;
function elastic(a) { // 返回半价差 s；无解返回 null
  if (a >= 0.5) return null;
  return T * a / (1 - a);
}
function profit(a, s) { // 做市商卖出一侧的期望利润（每位来客，乘以 2 为对称两侧）
  const liqStay = Math.max(0, 1 - s / T);
  return (1 - a) * liqStay * s - a * (T - s); // 已约去公共因子 1/2
}
// 解的检验
for (const a of [0.05, 0.1, 0.2, 0.3, 0.4, 0.45]) {
  const s = elastic(a);
  ok('D1 不亏不赚 α=' + a, near(profit(a, s), 0, 1e-9), 'profit=' + profit(a, s));
  ok('D1b 是最小可行报价 α=' + a, profit(a, s - 1e-4) < 0, '更低的报价应亏损');
}
// α ≥ 0.5：任何 s < 10 都亏
for (const a of [0.5, 0.55, 0.6, 0.8]) {
  let maxP = -Infinity; for (let s = 0; s <= 9.99; s += 0.001) maxP = Math.max(maxP, profit(a, s));
  ok('D2 α=' + a + ' 任何低于 $60 的卖价都亏', maxP < 0, 'max=' + maxP);
}
// 表格
const tbl = [
  [0, '| 0 | $50 / $50 / $0 | $50 / $50 / $0 | 100% |'],
  [0.1, '| 10% | $51 / $49 / $2 | $51.11 / $48.89 / $2.22 | 约 88.9% |'],
  [0.2, '| 20% | $52 / $48 / $4 | $52.50 / $47.50 / $5.00 | 75% |'],
  [0.3, '| 30% | $53 / $47 / $6 | $54.29 / $45.71 / $8.57 | 约 57.1% |'],
  [0.4, '| 40% | $54 / $46 / $8 | $56.67 / $43.33 / $13.33 | 约 33.3% |'],
  [0.5, '| 50% | $55 / $45 / $10 | 停止报价 | 0 |'],
  [0.6, '| 60% | $56 / $44 / $12 | 停止报价 | 0 |'],
];
for (const [a, row] of tbl) {
  const [Ai, Bi] = inelastic(a);
  const cells = row.split('|').map(x => x.trim()).filter(Boolean);
  const inel = cells[1].split(' / ').map(x => +x.replace('$', ''));
  ok('D3 一定来 α=' + a, near(inel[0], +Ai.toFixed(2)) && near(inel[1], +Bi.toFixed(2)) && near(inel[2], +(Ai - Bi).toFixed(2)), cells[1]);
  const s = elastic(a);
  if (s === null) ok('D4 嫌贵会走 停止 α=' + a, cells[2] === '停止报价' && cells[3] === '0', cells[2]);
  else {
    const el = cells[2].split(' / ').map(x => +x.replace('$', ''));
    ok('D4 嫌贵会走 α=' + a, near(el[0], +(E0 + s).toFixed(2)) && near(el[1], +(E0 - s).toFixed(2)) && near(el[2], +(2 * s).toFixed(2)), cells[2] + ' vs ' + (E0 + s) + '/' + (E0 - s));
    const stay = (1 - s / T) * 100, stayF = (1 - 2 * a) / (1 - a) * 100;
    ok('D5 留下比例两式一致 α=' + a, near(stay, stayF, 1e-9));
    const shown = +cells[3].replace(/[约%\s]/g, '');
    ok('D5b 留下比例 α=' + a, near(shown, +stay.toFixed(1)), cells[3] + ' vs ' + stay);
  }
  inL('D6 课文表 α=' + a, row); inF('D6 图方案表 α=' + a, row);
}
// 20% 的逐轮加价与验算
const s20 = elastic(0.2);
num('D7 α=20% 半价差', s20, 2.5, 6, '最后停在 $2.50：卖价 $52.50，买价 $47.50，价差 $5');
num('D8 宽了 $1', 2 * s20 - 4, 1, 6, '比所有人都留下时宽了 $1');
num('D9 留下四分之三', 1 - s20 / T, 0.75, 6, '留下来的流动性交易者是原来的四分之三');
num('D10 第一轮走掉五分之一', 2 / T, 0.2, 6, '占他们的五分之一，走了');
const iter = (a, n) => { const out = [T * a]; for (let k = 1; k < n; k++) out.push(T * a / (a + (1 - a) * (1 - out[k - 1] / T))); return out; };
const it20 = iter(0.2, 60);
num('D11 迭代 2', it20[1], 2.38, 2, '多收 $2.38'); num('D12 迭代 3', it20[2], 2.47, 2, '再加到 $2.47');
num('D12b 迭代 4', it20[3], 2.49, 2, null, '$2.00 → $2.38 → $2.47 → $2.49 → … → $2.50');
num('D13 迭代收敛', it20[59], 2.5, 6);
const inf20 = N * 0.2 * PI, liqB20 = N * 0.8 * 0.75 / 2;
num('D14 平均每天 10 个知情买家', inf20, 10, 6, '平均每天 10 个');
num('D15 每人拿走 $7.50', VH - (E0 + s20), 7.5, 6, '$60 − $52.50 = $7.50，共 $75');
num('D16 知情共 $75', inf20 * (VH - E0 - s20), 75, 6);
num('D17 留下 60 人', N * 0.8 * 0.75, 60, 6, '留下的流动性交易者 60 人');
num('D18 30 个买家共 $75', liqB20 * s20, 75, 6, '30 人每人比平均价值多付 $2.50，也是 $75');
// 40% 与 50%
num('D19 40% 价差', 2 * elastic(0.4), 13.33, 2, '价差已经是 $13.33，三分之二的流动性交易者离开了');
ok("D19b 40% 留下三分之一", near(1 - elastic(0.4) / T, 1 / 3, 1e-9));
const it50 = iter(0.5, 2000);
num('D20 50% 迭代 1', it50[0], 5, 6); num('D21 50% 迭代 2', it50[1], 6.67, 2); num('D22 50% 迭代 3', it50[2], 7.5, 6); num('D23 50% 迭代 4', it50[3], 8, 6);
num('D23b 50% 迭代 5', it50[4], 8.33, 2, null, '$5.00 → $6.67 → $7.50 → $8.00 → $8.33');
inL('D24 课文迭代', '做市商先多收 $5，然后是 $6.67、$7.50、$8');
ok('D25 50% 迭代逼近 $10 且不越过', it50.every(x => x < 10) && it50[1999] > 9.99, String(it50[1999]));
inL('D26 门槛', '到了 50%，做市商找不到任何一个低于 $60 的卖价');
inL('D27 要点', '模型里知情者占 20% 时价差 $5、留下四分之三，占 40% 时价差 $13.33、留下三分之一，占到一半时市场停止报价');
// 小题 4 的方向（比较静态）：在 α=20% 附近
const sAt = (a, Tm, gap) => { // 一般化：上限 U[0,Tm]，半价值差 gap
  // 解 a(gap - s) = (1-a)(1 - s/Tm) s 的较小根
  const A2 = (1 - a) / Tm, B2 = -((1 - a) + a), C2 = a * gap;
  const disc = B2 * B2 - 4 * A2 * C2; if (disc < 0) return null;
  return (-B2 - Math.sqrt(disc)) / (2 * A2);
};
const base = sAt(0.2, 10, 10);
ok('D28 小题4 A 流动性交易者多 → 变窄', sAt(0.15, 10, 10) < base);
ok('D28 小题4 B 知情者多 → 变宽', sAt(0.25, 10, 10) > base);
ok('D28 小题4 C 更不耐烦 → 变宽', sAt(0.2, 8, 10) > base);
ok('D28 小题4 D 涨跌幅更大 → 变宽', sAt(0.2, 10, 12) > base);
num('D28b 一般式复现基准', base, 2.5, 6);

// ---------- E 组：格洛斯滕与哈里斯（1988）第 135 页（论文统计量，S0603-R04） ----------
const c0 = 0.0242, z1 = 0.0133;
const rt = v => 2 * (c0 + z1 * v / 1000), adv = v => 2 * z1 * v / 1000;
num('E1 1,000 股价差', rt(1000), 0.075, 3, '| 1,000 股 | 约 $0.075 | 约 $0.027 | 约三分之一 |');
num('E2 1,000 股逆向选择', adv(1000), 0.027, 3);
num('E3 1,000 股占比', adv(1000) / rt(1000), 0.35, 2);
ok('E3b 约三分之一', Math.abs(adv(1000) / rt(1000) - 1 / 3) < 0.03, String(adv(1000) / rt(1000)));
num('E4 10,000 股价差', rt(10000), 0.31, 2, '| 10,000 股 | 约 $0.31 | 约 $0.27 | 八成以上 |');
num('E5 10,000 股逆向选择', adv(10000), 0.27, 2);
ok('E6 八成以上', adv(10000) / rt(10000) > 0.8 && adv(10000) / rt(10000) < 0.9, String(adv(10000) / rt(10000)));
inF('E7 图方案公式', '2 × ($0.0242 + $0.0133 × 交易股数 ÷ 1,000)');
inL('E8 样本期', '纽约证券交易所 1981 年 12 月到 1983 年 1 月');
inL('E9 20 只股票', '按股票代码字母顺序选出的 20 只股票');

// ---------- F 组：乔治、考尔与尼马伦德兰（1991，S0603-R05） ----------
inL('F1 8% 到 13%', '估计逆向选择只占报价价差的 8% 到 13%');
ok('F2 不到四成的三分之一', 13 < 40 / 3, '13 < 13.33');
inL('F3 四成以上', '不到此前文献所报告的四成以上的三分之一');

// ---------- G 组：年份与卷期 ----------
inL('G1 Akerlof', 'Quarterly Journal of Economics* 84(3), August 1970, pp. 488–500');
inL('G2 GM', 'Journal of Financial Economics* 14(1), 1985, pp. 71–100');
inL('G3 GH', 'Journal of Financial Economics* 21, 1988, pp. 123–142');
inL('G4 GKN', 'Review of Financial Studies* 4(4), 1991, pp. 623–656');
inL('G5 Bagehot', 'Financial Analysts Journal* 27(2), 1971, pp. 12–14');
inL('G6 正文 1971', '1971 年，《金融分析师杂志》');
inL('G7 正文 1970', '1970 年，经济学家阿克洛夫');

console.log(`通过 ${pass}，失败 ${fail}`);
if (fail) process.exit(1);
