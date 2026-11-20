// S03-07 数值核验（研究阶段）：node "lessons/S03-07/S03-07 数值核验（研究阶段）.js"
// 独立复算研究简报第 8 节的全部数字。M7 是权利金假设值的合理性检查，只供内部，不进课文（期权定价属 S05-04）。
'use strict';
let pass = 0, fail = 0;
const ok = (id, d, c) => { if (c) pass++; else { fail++; console.log('失败 ' + id + '：' + d); } };
const near = (a, b, t = 1e-9) => Math.abs(a - b) <= t;
const K = 50, C = 3.00, P = 2.75, N = 100;
const lc = s => Math.max(s - K, 0) - C, sc = s => -lc(s), lp = s => Math.max(K - s, 0) - P, sp = s => -lp(s);
// M1 四种头寸的盈亏（每股）
const pts = [0, 30, 40, 45, 47.25, 50, 53, 55, 60, 70, 100, 150];
console.log('M1 每股盈亏（股价：买看涨 / 卖看涨 / 买看跌 / 卖看跌）');
for (const s of pts) console.log('  ' + s + '：' + [lc(s), sc(s), lp(s), sp(s)].map(x => x.toFixed(2)).join(' / '));
// M2 盈亏平衡点与极值
ok('M2a', '买看涨盈亏平衡 53', near(lc(53), 0));
ok('M2b', '买看跌盈亏平衡 47.25', near(lp(47.25), 0));
ok('M2c', '买看跌最大盈利 47.25（股价 0）', near(lp(0), 47.25));
ok('M2d', '卖看跌最大亏损每张 4,725', near(sp(0) * N, -4725));
ok('M2e', '卖看涨在 100、150 时每张亏 4,700、9,700', near(sc(100) * N, -4700) && near(sc(150) * N, -9700));
// M3 零和：每个整数价位上买卖双方盈亏相加为零
let z = true; for (let s = 0; s <= 200; s += 0.25) z = z && near(lc(s) + sc(s), 0) && near(lp(s) + sp(s), 0);
ok('M3', '零和（0–200，步长 0.25）', z);
// M4 保护性看跌：600 股，6 张
const sh = 600, n = sh / N;
const prot = (s, k, p) => (Math.max(s, k) - 50 - p) * sh;
console.log('M4 600 股 + 6 张看跌（相对今天 $50 的变化）');
for (const s of [30, 40, 45, 50, 60, 70]) console.log('  ' + s + '：不保 ' + ((s - 50) * sh) + '；K50 ' + prot(s, 50, 2.75).toFixed(0) + '；K45 ' + prot(s, 45, 0.90).toFixed(0));
ok('M4a', '6 张 K50 权利金 1,650', near(n * N * 2.75, 1650));
ok('M4b', '6 张 K45 权利金 540', near(n * N * 0.90, 540));
ok('M4c', 'K50 最坏 −1,650；K45 最坏 −3,540', near(prot(0, 50, 2.75), -1650) && near(prot(0, 45, 0.90), -3540));
// M5 有备兑的卖出看涨：持 100 股，卖 1 张 K50 @3
const cov = s => (Math.min(s, K) + C - 50) * N;
ok('M5', '备兑：股价 60 时 +300，不卖看涨时 +1,000', near(cov(60), 300) && near((60 - 50) * N, 1000));
// M6 FINRA 4210(f)(2)(E)(i)：上市股票期权空头
const req = (optVal, S, otm, minBase) => Math.max(optVal * N + 0.20 * S * N - otm * N, optVal * N + 0.10 * minBase * N);
ok('M6a', '卖 1 张 K50 看涨 @3，股价 50：1,300', near(req(3, 50, 0, 50), 1300));
ok('M6b', '卖 1 张 K50 看跌 @2.75，股价 50：1,275', near(req(2.75, 50, 0, 50), 1275));
// M7 合理性检查（不进课文）：Black-Scholes，3 个月，利率 4%，连续股息率按每季 0.25/50 折算
const cdf = x => { const t = 1 / (1 + 0.2316419 * Math.abs(x)); const d = 0.3989423 * Math.exp(-x * x / 2);
  const p = d * t * (0.3193815 + t * (-0.3565638 + t * (1.781478 + t * (-1.821256 + t * 1.330274)))); return x > 0 ? 1 - p : p; };
const bs = (S, k, T, r, q, v, call) => { const d1 = (Math.log(S / k) + (r - q + v * v / 2) * T) / (v * Math.sqrt(T)), d2 = d1 - v * Math.sqrt(T);
  return call ? S * Math.exp(-q * T) * cdf(d1) - k * Math.exp(-r * T) * cdf(d2) : k * Math.exp(-r * T) * cdf(-d2) - S * Math.exp(-q * T) * cdf(-d1); };
const q = 0.02;
let lo = 0.05, hi = 1; for (let i = 0; i < 60; i++) { const m = (lo + hi) / 2; if (bs(50, 50, 0.25, 0.04, q, m, true) > 3) hi = m; else lo = m; }
const vol = (lo + hi) / 2;
console.log('M7 使看涨 K50 = $3.00 的波动率 ≈ ' + (vol * 100).toFixed(1) + '%；同一参数下 看跌 K50 ≈ ' + bs(50, 50, 0.25, 0.04, q, vol, false).toFixed(2) + '，看跌 K45 ≈ ' + bs(50, 45, 0.25, 0.04, q, vol, false).toFixed(2));
ok('M7', '假设权利金与同一参数的模型值相差不超过 $0.15', Math.abs(bs(50, 50, 0.25, 0.04, q, vol, false) - 2.75) < 0.15 && Math.abs(bs(50, 45, 0.25, 0.04, q, vol, false) - 0.90) < 0.15);
console.log('通过 ' + pass + '，失败 ' + fail);
if (fail) process.exit(1);
