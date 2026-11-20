// S02-05 数值核验（内部，不进入发布目录）· 2026-11-19
// 运行：node "lessons/S02-05/S02-05 数值核验.js"
// 所有数字都是教学模型的假设值，不代表任何真实券商的利率、费率或北岭电池的真实行情。
// 口径：美元；利息与借券费按 实际天数/365 单利计算；不计佣金和税。
'use strict';
const assert = require('assert');
const r2 = (x) => Math.round(x * 100) / 100;
const near = (a, b, eps = 0.005) => Math.abs(a - b) <= eps;
let ok = 0;
function check(name, got, want, eps) {
  assert(near(got, want, eps), `${name}: got ${got}, want ${want}`);
  ok++;
  console.log(`✔ ${name} = ${r2(got)}`);
}

// ───────────────────────── 一、融资买入（margin purchase） ─────────────────────────
// 假设：买入 400 股北岭电池，每股 $50（教学假设的价格，与 S02-02 的 $50 价位相近，但不是其中任何一笔成交）
// Reg T 初始保证金 50%（12 CFR 220.12(a)）；FINRA 4210(c)(1) 维持保证金 25%；券商自定的更高要求取 30% 作对照。
// 融资利率年 8%（假设值）。
const L = { shares: 400, p0: 50, imr: 0.5, mmFinra: 0.25, mmHouse: 0.30, rate: 0.08 };
L.cost = L.shares * L.p0;                 // 20,000
L.deposit = L.cost * L.imr;               // 10,000
L.loan = L.cost - L.deposit;              // 10,000
check('融资买入：总价', L.cost, 20000);
check('融资买入：自有资金（Reg T 50%）', L.deposit, 10000);
check('融资买入：借款（借方余额）', L.loan, 10000);

const equityLong = (p, debit = L.loan) => L.shares * p - debit;
// 30 天利息
L.interest30 = L.loan * L.rate * 30 / 365;
check('融资买入：30 天利息', L.interest30, 65.75);

// 涨到 $60 与跌到 $40：与全额现金买入对比（先不计利息，再计利息）
for (const p of [60, 40]) {
  const eq = equityLong(p);
  const retMargin = (eq - L.deposit) / L.deposit;
  const retCash = (p - L.p0) / L.p0;
  console.log(`  价格 $${p}: 权益 ${r2(eq)}；融资收益率 ${(retMargin * 100).toFixed(1)}%；全额现金收益率 ${(retCash * 100).toFixed(1)}%；计 30 天利息后融资收益率 ${(((eq - L.interest30) - L.deposit) / L.deposit * 100).toFixed(2)}%`);
}
check('融资买入：$60 时权益', equityLong(60), 14000);
check('融资买入：$40 时权益', equityLong(40), 6000);
check('融资买入：$60 时扣 30 天利息后收益率(%)', ((equityLong(60) - L.interest30) - L.deposit) / L.deposit * 100, 39.34);
check('融资买入：$40 时扣 30 天利息后收益率(%)', ((equityLong(40) - L.interest30) - L.deposit) / L.deposit * 100, -40.66);

// 维持保证金触发价：shares*P - loan = m * shares*P  →  P* = loan / (shares*(1-m))
const triggerLong = (m, debit = L.loan) => debit / (L.shares * (1 - m));
check('融资买入：触发价（25%）', triggerLong(L.mmFinra), 33.33);
check('融资买入：触发价（30%）', triggerLong(L.mmHouse), 35.71);
// 计入 30 天利息记入借方后的触发价
check('融资买入：触发价（25%，借方含 30 天利息）', triggerLong(L.mmFinra, L.loan + L.interest30), 33.55);
// 边界：触发价上权益恰好等于要求
{
  const p = triggerLong(L.mmFinra);
  assert(near(equityLong(p), L.mmFinra * L.shares * p, 1e-9)); ok++;
}
// 跌到 $30（按 25%）：追缴金额，以及若被卖出需卖多少股
{
  const p = 30, m = L.mmFinra;
  const mv = L.shares * p, eq = equityLong(p), req = m * mv, call = req - eq;
  check('融资买入：$30 时市值', mv, 12000);
  check('融资买入：$30 时权益', eq, 2000);
  check('融资买入：$30 时维持要求', req, 3000);
  check('融资买入：$30 时追缴金额（存现金）', call, 1000);
  // 不补钱、卖股还债：卖 x 股，权益不变，要求变为 m*(shares-x)*p
  const xExact = call / (m * p);                     // 133.33
  const x = Math.ceil(xExact);                       // 134
  check('融资买入：需卖出股数（精确）', xExact, 133.33);
  assert.strictEqual(x, 134); ok++;
  const eqAfter = eq;                                // 不计成本时卖股不改变权益
  const reqAfter = m * (L.shares - x) * p;
  assert(eqAfter >= reqAfter); ok++;
  console.log(`  卖出 ${x} 股（$${x * p}）后：借方 ${L.loan - x * p}，权益 ${eqAfter}，要求 ${reqAfter}`);
  // 为什么不是卖 $1,000：卖 $1,000 只让要求下降 25% × $1,000 = $250
  check('融资买入：卖出 $1,000 股票只降低要求', m * 1000, 250);
}
// 权益归零价：P = loan / shares = 25；跌破后欠券商钱
check('融资买入：权益归零价', L.loan / L.shares, 25);
check('融资买入：跌到 $15 时欠券商（不计利息）', -(equityLong(15)), 4000);
// 与中国“维持担保比例”口径互换：股票市值/负债 = 1/(1-m)
check('口径互换：25% 维持保证金 ↔ 维持担保比例(%)', 100 / (1 - 0.25), 133.33);
check('口径互换：30% ↔ 维持担保比例(%)', 100 / (1 - 0.30), 142.86);
// A 股“融资保证金比例”= 保证金 / 融资买入金额（上交所细则第三十九条）。
// 假设保证金全部是现金、自有现金另行全部买入：最大融资额 = E / 比例，总持仓 = E + E/比例，自有占比 = 1/(1+1/比例)
const ownShare = (ratio) => 1 / (1 + 1 / ratio);
check('口径互换：A 股融资保证金比例 100% ↔ 自有资金占总持仓(%)', ownShare(1.0) * 100, 50);
check('口径互换：A 股融资保证金比例 80% ↔ 自有资金占总持仓(%)', ownShare(0.8) * 100, 44.44);

// ───────────────────────── 二、卖空（short sale） ─────────────────────────
// 假设：卖空 200 股北岭电池，每股 $50。
// Reg T 220.12(c)(1)：初始要求 150% 市值；卖空所得 100% 留在账户里，另交 50%。
// FINRA 4210(c)(3)：股价 ≥ $5 时，维持要求取 $5/股 与 30% 市值 中较大者。
// 借券费年 3%（假设，按每日市值计；示例按 $50 不变计 30 天）；
// 持仓期间北岭电池派息每股 $0.25（假设值；须与 S03-01 协调），卖空者向出借方付等额的替代款（payment in lieu）。
const S = { shares: 200, p0: 50, initial: 1.5, mm: 0.30, perShareMin: 5, fee: 0.03, div: 0.25 };
S.proceeds = S.shares * S.p0;                    // 10,000
S.required = S.initial * S.proceeds;             // 15,000
S.deposit = S.required - S.proceeds;             // 5,000
S.credit = S.proceeds + S.deposit;               // 15,000
check('卖空：卖出所得', S.proceeds, 10000);
check('卖空：Reg T 150% 要求总额', S.required, 15000);
check('卖空：需另交', S.deposit, 5000);
check('卖空：账户贷方余额', S.credit, 15000);
assert(S.deposit >= 2000); ok++;                 // FINRA $2,000 最低权益已满足

S.fee30 = S.proceeds * S.fee * 30 / 365;
S.pil = S.shares * S.div;
check('卖空：30 天借券费', S.fee30, 24.66);
check('卖空：股息替代款', S.pil, 50);
const shortReq = (p) => Math.max(S.perShareMin * S.shares, S.mm * S.shares * p);
const equityShort = (p, credit = S.credit) => credit - S.shares * p;  // FINRA 4210(a)(5)
// 触发价：credit - n*P = 0.3*n*P → P = credit/(1.3 n)（P ≥ $16.67 时 30% 大于 $5/股）
const triggerShort = (credit = S.credit) => credit / ((1 + S.mm) * S.shares);
check('卖空：触发价（不计费用）', triggerShort(), 57.69);
const creditAfterCosts = S.credit - S.fee30 - S.pil;
check('卖空：扣借券费与替代款后的贷方余额', creditAfterCosts, 14925.34);
check('卖空：触发价（扣 30 天费用后）', triggerShort(creditAfterCosts), 57.41);
assert(S.mm * S.shares * triggerShort() > S.perShareMin * S.shares); ok++;
// $60 时：追缴
{
  const p = 60, eq = equityShort(p), req = shortReq(p), call = req - eq;
  check('卖空：$60 时权益', eq, 3000);
  check('卖空：$60 时维持要求', req, 3600);
  check('卖空：$60 时追缴金额', call, 600);
  const yExact = call / (S.mm * p);               // 回补股数：权益不变，要求降 0.3*p 每股
  check('卖空：需回补股数（精确）', yExact, 33.33);
  const y = Math.ceil(yExact);
  assert(eq >= S.mm * (S.shares - y) * p); ok++;
  console.log(`  回补 ${y} 股（$${y * p}）后：空头 ${S.shares - y} 股，权益 ${eq}，要求 ${S.mm * (S.shares - y) * p}`);
}
// 盈亏：价格跌到 $40 回补
{
  const p = 40;
  const gross = (S.p0 - p) * S.shares;
  const net = gross - S.fee30 - S.pil;
  check('卖空：$40 回补毛利', gross, 2000);
  check('卖空：$40 回补净利（扣 30 天借券费与替代款）', net, 1925.34);
  check('卖空：净利 / 另交的 $5,000(%)', net / S.deposit * 100, 38.51);
}
// 价格涨到 $55 回补（未触发追缴）、$75（另交的钱亏光）、$90（倒欠）
check('卖空：$55 回补亏损（不计费用）', (S.p0 - 55) * S.shares, -1000);
check('卖空：权益归零价', S.credit / S.shares, 75);
check('卖空：$90 时倒欠（不计费用）', -equityShort(90), 3000);
// 损失没有上限：每涨 $1 亏 $200
check('卖空：每涨 $1 的亏损', S.shares * 1, 200);

// ───────────────────────── 三、借券的回扣利率（rebate）示意 ─────────────────────────
// 机构借券、以现金作抵押时：出借方把现金抵押的利息按“回扣利率”付给借券方；回扣利率 ≈ 参考利率 − 借券费率。
// 参考利率取 4.00%（整数假设，不是任何一天的真实 OBFR）。
const ref = 0.04;
for (const [name, fee, want] of [['容易借的股票', 0.0025, 3.75], ['难借的股票', 0.30, -26]]) {
  const rebate = ref - fee;
  check(`回扣利率：${name}(%)`, rebate * 100, want);
}
// $1,000,000 现金抵押、30 天：负回扣意味着借券方付钱
check('回扣：难借股票 30 天借券方净付', 1e6 * 0.26 * 30 / 365, 21369.86);

console.log(`\n全部 ${ok} 项断言通过`);
