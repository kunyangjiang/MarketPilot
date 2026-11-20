// S03-04 数值核验（研究阶段）· 2026-11-19 · 内部文件，不进入发布目录
// 运行：node "S03-04 数值核验（研究阶段）.js"
// 两个模型：A 股票 ETF 溢价申购套利（含无套利区间）；B 债券 ETF 折价赎回套利（两种解读，同一个折价）。
// 所有数字都是教学假设，不对应任何真实 ETF。来源依据见《S03-04 来源登记与证据核验表》。

const assert = require('assert');
const r2 = (x) => Math.round(x * 100) / 100;
const near = (a, b, eps = 1e-6) => Math.abs(a - b) < eps;

// ---------------- 模型 A：股票 ETF 溢价 → 申购套利 ----------------
// 申赎单位 50,000 份（Investor.gov 公告举的例子）。篮子 3 只股票（名称待 PO 定）。
const UNIT = 50000;
const basket = [
  { name: '股票甲', qty: 10000, price: 50.00, halfSpread: 0.01 },
  { name: '股票乙', qty: 5000, price: 100.00, halfSpread: 0.02 },
  { name: '股票丙', qty: 12500, price: 20.00, halfSpread: 0.01 },
];
const basketValue = basket.reduce((s, b) => s + b.qty * b.price, 0);      // 按中间价
const navPerShare = basketValue / UNIT;                                    // 假设无现金差额、无负债
const basketHalfSpreadCost = basket.reduce((s, b) => s + b.qty * b.halfSpread, 0);
const creationFee = 500;            // 申购费（固定），落在 BIS QR 2021-03 脚注 7 所说 $250–1,000 区间
const sec31Rate = 20.60 / 1e6;      // 第 31 条费率：每百万美元卖出 $20.60（2026-04-04 起；S02-03 P1）
const etfBid = 25.09, etfAsk = 25.11;
const etfMid = (etfBid + etfAsk) / 2;
const premiumMid = (etfMid - navPerShare) / navPerShare;

const buyBasket = basketValue + basketHalfSpreadCost;
const sellEtf = UNIT * etfBid;
const sec31 = sellEtf * sec31Rate;
const grossOnMid = UNIT * (etfMid - navPerShare);
const netA = sellEtf - buyBasket - creationFee - sec31;

// 无套利上界：净利润 = 0 时的 ETF 买一
const breakEvenBid = (buyBasket + creationFee) / (UNIT * (1 - sec31Rate));
const breakEvenMid = breakEvenBid + (etfAsk - etfBid) / 2;
const breakEvenPremium = (breakEvenMid - navPerShare) / navPerShare;

assert(near(basketValue, 1250000));
assert(near(navPerShare, 25));
assert(near(basketHalfSpreadCost, 325));
assert(near(premiumMid, 0.004));
console.log('--- 模型 A：股票 ETF 溢价申购套利 ---');
console.log('篮子价值（中间价）', basketValue, '；每份净值', navPerShare);
console.log('ETF 买一/卖一', etfBid, etfAsk, '；中间价', etfMid.toFixed(2), '；溢价（按中间价）', (premiumMid * 100).toFixed(2) + '%');
console.log('按中间价算的毛利', r2(grossOnMid));
console.log('买入篮子（含半个价差）', r2(buyBasket), '；其中价差成本', basketHalfSpreadCost);
console.log('卖出 50,000 份 ETF（按买一）', r2(sellEtf), '；第 31 条费用', r2(sec31));
console.log('申购费', creationFee);
console.log('净利润', r2(netA));
console.log('盈亏平衡：ETF 买一', breakEvenBid.toFixed(5), '；中间价', breakEvenMid.toFixed(5), '；溢价', (breakEvenPremium * 100).toFixed(4) + '%');
assert(near(r2(sec31), 25.84));
assert(near(r2(netA), 3649.16));

// 对称的折价情形（赎回）：ETF 买一/卖一 24.89/24.91（中间价折价 0.40%），买 ETF、赎回、按买一卖篮子
const redemptionFee = 500;
const etfAskD = 24.91;
const buyEtf = UNIT * etfAskD;
const sellBasket = basketValue - basketHalfSpreadCost;
const sec31D = sellBasket * sec31Rate;
const netAD = sellBasket - buyEtf - redemptionFee - sec31D;
const breakEvenAskD = (sellBasket - redemptionFee - sec31D) / UNIT;
const breakEvenMidD = breakEvenAskD - 0.01;
const breakEvenDiscount = (navPerShare - breakEvenMidD) / navPerShare;
console.log('对称折价：买 ETF', r2(buyEtf), '；卖篮子', r2(sellBasket), '；第 31 条', r2(sec31D), '；净利润', r2(netAD));
console.log('折价盈亏平衡：ETF 卖一', breakEvenAskD.toFixed(5), '；中间价', breakEvenMidD.toFixed(5), '；折价', (breakEvenDiscount * 100).toFixed(4) + '%');
assert(near(r2(netAD), 3649.26));

// 滑块边界测试：溢价从 -1% 到 +1%，判断"申购 / 赎回 / 不动"
function decideEquity(premium, p = {}) {
  const fee = p.fee ?? 500, hs = p.basketHalfSpreadPct ?? (325 / 1250000), etfHalf = p.etfHalfSpread ?? 0.01;
  const mid = navPerShare * (1 + premium);
  const createNet = UNIT * (mid - etfHalf) * (1 - sec31Rate) - basketValue * (1 + hs) - fee;
  const redeemNet = basketValue * (1 - hs) * (1 - sec31Rate) - UNIT * (mid + etfHalf) - fee;
  if (createNet > 0) return { act: '申购', net: createNet };
  if (redeemNet > 0) return { act: '赎回', net: redeemNet };
  return { act: '不动', net: Math.max(createNet, redeemNet) };
}
for (const pr of [-0.01, -0.004, -0.0015, -0.001, 0, 0.001, 0.0011, 0.004, 0.01]) {
  const d = decideEquity(pr);
  console.log('  溢价', (pr * 100).toFixed(2) + '%', '→', d.act, r2(d.net));
}
assert.strictEqual(decideEquity(0).act, '不动');
assert.strictEqual(decideEquity(0.004).act, '申购');
assert.strictEqual(decideEquity(-0.004).act, '赎回');
assert.strictEqual(decideEquity(0.001).act, '不动');   // 区间内
assert.strictEqual(decideEquity(0.0011).act, '申购');  // 刚越过上界约 0.108%

// ---------------- 模型 B：债券 ETF 折价 → 赎回套利，两种解读 ----------------
// 公布的每份净值 $100（按评估价格算）；ETF 买一/卖一 94.95/95.05（中间价折价 5%）。
// 5% 只是"超过 5%"量级的示意（BIS Bulletin 6：3 月中旬部分最大的 IG/HY ETF 折价超过 5%），不是某只 ETF 某天的数。
const UNIT_B = 50000;
const navB = 100.00;
const statedValue = UNIT_B * navB;      // 5,000,000
const etfAskB = 95.05;
const buyEtfB = UNIT_B * etfAskB;       // 4,752,500
const redFeeB = 1000;

function bondArb({ staleGap, halfSpread, impact, carry }) {
  // staleGap：评估价格高于真实可成交中间价的幅度；halfSpread：债券半个价差；
  // impact：在几天内卖出这么大一篮子债券的额外冲击；carry：占用资产负债表/持有期风险的成本（都按公布净值的比例）
  const realizable = statedValue * (1 - staleGap - halfSpread - impact - carry);
  return { realizable, net: realizable - buyEtfB - redFeeB };
}
// 解读一（套利受阻）：净值准确（staleGap = 0），但卖债很贵、资产负债表很紧
const s1 = bondArb({ staleGap: 0.00, halfSpread: 0.010, impact: 0.015, carry: 0.020 });
// 解读二（净值陈旧）：卖债成本平常一些，但评估价格比真实可成交价高 4%
const s2 = bondArb({ staleGap: 0.04, halfSpread: 0.010, impact: 0.000, carry: 0.000 });
console.log('--- 模型 B：债券 ETF 折价 5%（示意）---');
console.log('买入 50,000 份 ETF（按卖一）', buyEtfB, '；赎回费', redFeeB, '；拿到的债券按净值算', statedValue);
console.log('解读一 套利受阻：可变现', r2(s1.realizable), '；净利润', r2(s1.net));
console.log('解读二 净值陈旧：可变现', r2(s2.realizable), '；净利润', r2(s2.net));
assert(near(s1.realizable, 4775000));
assert(near(s1.net, 21500));
assert(near(s2.realizable, 4750000));
assert(near(s2.net, -3500));
// 解读一里，只要持有期多跌 0.5%（25,000 美元）以上，正利润就会被吃掉：
const s1Risk = bondArb({ staleGap: 0.00, halfSpread: 0.010, impact: 0.015, carry: 0.025 });
console.log('解读一 若持有期成本再高 0.5 个百分点：净利润', r2(s1Risk.net));
assert(near(s1Risk.net, -3500));

// 折价盈亏平衡：ETF 卖一 = (可变现 − 赎回费) / 份数
const be1 = (s1.realizable - redFeeB) / UNIT_B, be2 = (s2.realizable - redFeeB) / UNIT_B;
console.log('盈亏平衡卖一：解读一', be1.toFixed(2), '（折价约', ((navB - (be1 - 0.05)) / navB * 100).toFixed(2) + '%）',
  '；解读二', be2.toFixed(2), '（折价约', ((navB - (be2 - 0.05)) / navB * 100).toFixed(2) + '%）');

// ---------------- 引用数字的口径复核 ----------------
// BIS Bulletin 6：3 月 19 日，久期 < 3 年的 IG ETF 平均折价 6.9%，全部 IG ETF 平均 5.3%（原文数字，不复算）
// SEC 6c-11 采纳文件表 2（回测）：按 2018 年数据，若规则当时已生效，会触发披露（折溢价 >2% 且连续超过 7 个交易日）的 ETF 共 49 只；>5% 共 5 只；>10% 为 0（不是"2018 年实际发生"）
const table2_7day = { Alternative: 11, InternationalEquity: 20, SectorEquity: 2, TaxableBond: 1, USEquity: 15 };
const sum7 = Object.values(table2_7day).reduce((a, b) => a + b, 0);
assert.strictEqual(sum7, 49);
const table2_3day2pct = [2, 15, 48, 10, 3, 29];
assert.strictEqual(table2_3day2pct.reduce((a, b) => a + b, 0), 107);
// SEC DERA 2020-10：3 月债券共同基金净流出 2,550 亿，债券 ETF 210 亿；公司债成交 1.08 万亿，日均 492 亿
console.log('DERA 交易额 / 基金流出 =', (1080 / (255 + 21)).toFixed(2), '（原文说"超过三倍"）');
assert(1080 / (255 + 21) > 3);
console.log('DERA 1.08 万亿 / 492 亿 =', (1080 / 49.2).toFixed(1), '个交易日（2020 年 3 月有 22 个交易日）');
console.log('全部断言通过');
