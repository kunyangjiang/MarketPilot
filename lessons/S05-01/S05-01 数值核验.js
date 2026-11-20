// S05-01 数值核验：node "S05-01 数值核验.js"（在本课文件夹或任意位置运行均可）
// 读取《S05-01 课文 v1 候选.md》《S05-01 图与交互方案 v1 候选.md》和本课文件夹内的联储 H.10 日元汇率数据，
// 对课文与图里出现的每个关键数字独立重算，并断言它确实写在课文（或方案）里。不依赖网络与临时目录。
'use strict';
const fs = require('fs');
const path = require('path');
const DIR = __dirname;
const read = f => fs.readFileSync(path.join(DIR, f), 'utf8').replace(/\r/g, '');
const lesson = read('S05-01 课文 v1 候选.md');
const plan = read('S05-01 图与交互方案 v1 候选.md');
const csv = read('S05-01 联储H.10 日元汇率 2000-2026.csv');

let pass = 0, fail = 0;
function ok(name, cond, note) { if (cond) pass++; else { fail++; console.log('失败：' + name + (note ? '（' + note + '）' : '')); } }
function near(name, x, y, tol) { ok(name, Math.abs(x - y) <= tol, '算得 ' + x + '，应为 ' + y); }
function inL(s) { ok('课文含「' + s + '」', lesson.includes(s)); }
function inP(s) { ok('方案含「' + s + '」', plan.includes(s)); }
const fmt = (x, d) => x.toFixed(d);
const pct = (x, d) => (x * 100).toFixed(d);

// ---------- A 四年成绩单 ----------
const R = [0.40, 0.30, -0.50, 0.12];
let v = 10000, peak = 10000, mdd = 0; const vals = [];
for (const r of R) { v *= 1 + r; vals.push(v); peak = Math.max(peak, v); mdd = Math.max(mdd, 1 - v / peak); }
near('年末价值 1', vals[0], 14000, 1e-6); near('年末价值 2', vals[1], 18200, 1e-6);
near('年末价值 3', vals[2], 9100, 1e-6); near('年末价值 4', vals[3], 10192, 1e-6);
['$14,000', '$18,200', '$9,100', '$10,192', '$192', '+40%', '+30%', '−50%', '+12%'].forEach(inL);
near('最大回撤 50%', mdd, 0.5, 1e-12); inL('最大回撤 50%');
near('第 2 年末买入者到第 4 年末', 1 - 10192 / 18200, 0.44, 0.0005); inL('少了 44%');
const A = R.reduce((a, b) => a + b) / 4; near('算术平均', A, 0.08, 1e-12); inL('平均每年 8%'); inL('32%');
const G = Math.pow(1.0192, 1 / 4) - 1; ok('几何平均 0.48%', pct(G, 2) === '0.48', pct(G, 3)); inL('约为 0.48%'); inL('0.48%'); inL('1.0192');
const dev = R.map(r => Math.round((r - A) * 100)); ok('偏离 +32 +22 −58 +4', dev.join() === '32,22,-58,4'); inL('+32、+22、−58、+4 个百分点');
const sq = dev.map(x => x * x); ok('平方 1024 484 3364 16', sq.join() === '1024,484,3364,16'); inL('1,024、484、3,364、16');
ok('平方平均 1222', sq.reduce((a, b) => a + b) / 4 === 1222); inL('平均是 1,222');
const sdp = Math.sqrt(R.reduce((a, b) => a + (b - A) ** 2, 0) / 4), sds = Math.sqrt(R.reduce((a, b) => a + (b - A) ** 2, 0) / 3);
ok('总体标准差 35.0', fmt(sdp * 100, 1) === '35.0'); inL('约 35.0 个百分点');
ok('样本标准差 40.4', fmt(sds * 100, 1) === '40.4'); inL('约 40.4%'); inP('约 40.4%');
ok('−58 的平方占一半以上', 3364 / 4888 > 0.5); inL('占了总数的一大半');
ok('甲四年后 13,605', Math.round(10000 * 1.08 ** 4) === 13605); inL('约 $13,605'); inP('约 $13,605');
ok('近似式：8%−35%²/2≈1.9%', fmt((0.08 - sdp * sdp / 2) * 100, 1) === '1.9'); inL('约等于 1.9%');
ok('近似式：8%−20%²/2=6%', Math.abs(0.08 - 0.2 * 0.2 / 2 - 0.06) < 1e-12); inL('近似得到 6%');

// ---------- B 回本与小题 ----------
near('+50% −50%', 100 * 1.5 * 0.5, 75, 1e-9); inL('只剩 $75'); inL('亏了 25%');
near('−50% +50%', 100 * 0.5 * 1.5, 75, 1e-9); inL('先跌到 $50');
const rec = L => 1 / (1 - L) - 1;
ok('亏 10% 回本 11.1%', fmt(rec(0.1) * 100, 1) === '11.1'); inL('约 11.1%');
ok('亏 20% 回本 25%', Math.abs(rec(0.2) - 0.25) < 1e-12); inL('| 20% | 25% |');
ok('亏 30% 回本 42.9%', fmt(rec(0.3) * 100, 1) === '42.9'); inL('约 42.9%');
ok('亏 50% 回本 100%', Math.abs(rec(0.5) - 1) < 1e-12); inL('| 50% | 100% |');
ok('亏 80% 回本 400%', Math.abs(rec(0.8) - 4) < 1e-9); inL('| 80% | 400% |');
near('小题 1：1.2×0.8', 1.2 * 0.8, 0.96, 1e-12); inL('1.2 × 0.8 = 0.96'); inL('跌掉的 24 比第一年涨的 20 多');
const q2 = [100, 120, 90, 130, 104, 140]; let pk = 0, m2 = 0; for (const x of q2) { pk = Math.max(pk, x); m2 = Math.max(m2, 1 - x / pk); }
near('小题 2 最大回撤', m2, 0.25, 1e-12); inL('$100、$120、$90、$130、$104、$140');
near('小题 2 第二次下跌 20%', 1 - 104 / 130, 0.2, 1e-12);
ok('小题 2 干扰项 30.8%', fmt((1 - 90 / 130) * 100, 1) === '30.8'); inL('约 30.8%');
near('小题 2 干扰项 10%', 1 - 90 / 100, 0.1, 1e-12);

// ---------- C 三十年模型（对数正态，各年独立） ----------
function mulberry32(a) { return function () { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
function Phi(x) { // 数值积分求标准正态分布函数
  let s = 0; const N = 200000, a = -40, h = (x - a) / N;
  for (let i = 0; i < N; i++) { const t = a + (i + 0.5) * h; s += Math.exp(-t * t / 2) * h; }
  return s / Math.sqrt(2 * Math.PI);
}
const model = {};
for (const sig of [0, 0.1, 0.2, 0.3, 0.4]) {
  const s2 = Math.log(1 + sig * sig / 1.08 / 1.08), m = Math.log(1.08) - s2 / 2, s = Math.sqrt(s2);
  const medG = Math.exp(m) - 1, med30 = Math.exp(30 * m);
  const pBelow = sig === 0 ? 0 : Phi(-30 * m / (s * Math.sqrt(30)));
  const rnd = mulberry32(20261120); const N = 10000; let dd50 = 0, below = 0, sum = 0; const fin = [];
  for (let p = 0; p < N; p++) {
    let x = 1, hi = 1, md = 0;
    for (let y = 0; y < 30; y++) {
      const u1 = rnd(), u2 = rnd();
      const z = Math.sqrt(-2 * Math.log(u1 || 1e-12)) * Math.cos(2 * Math.PI * u2);
      x *= Math.exp(m + s * z); hi = Math.max(hi, x); md = Math.max(md, 1 - x / hi);
    }
    fin.push(x); sum += x; if (x < 1) below++; if (md >= 0.5) dd50++;
  }
  fin.sort((a, b) => a - b);
  model[sig] = { medG, med30, pBelow, dd50: dd50 / N, simMed: fin[N / 2], simBelow: below / N };
  // 均值 E[(1+R)^30] = 1.08^30（解析），与 σ 无关
  near('σ=' + sig + ' 解析均值 = 1.08^30', Math.exp(30 * (m + s2 / 2)), Math.pow(1.08, 30), 1e-9);
  ok('σ=' + sig + ' 模拟中位数与解析值相差 < 3%', Math.abs(fin[N / 2] / med30 - 1) < 0.03, fin[N / 2] + ' vs ' + med30);
  if (sig > 0) ok('σ=' + sig + ' 模拟「不到 $1」概率与解析值相差 < 1 个百分点', Math.abs(below / N - pBelow) < 0.01);
}
ok('1.08^30 = 10.06', fmt(Math.pow(1.08, 30), 2) === '10.06'); inL('$10.06'); inL('1.08 的 30 次方');
const expMedG = { 0: '8.00', 0.1: '7.54', 0.2: '6.19', 0.3: '4.06', 0.4: '1.28' };
const expMed30 = { 0: '10.06', 0.1: '8.85', 0.2: '6.07', 0.3: '3.30', 0.4: '1.46' };
for (const k of Object.keys(expMedG)) {
  ok('σ=' + k + ' 中位数增长 ' + expMedG[k], pct(model[k].medG, 2) === expMedG[k], pct(model[k].medG, 3));
  ok('σ=' + k + ' 30 年中位数 ' + expMed30[k], fmt(model[k].med30, 2) === expMed30[k], fmt(model[k].med30, 3));
  inL((k === '0' ? '' : '约 ') + expMedG[k] + '%'); inL('$' + expMed30[k]); inP(expMedG[k] + '%'); inP('$' + expMed30[k]);
}
ok('σ=10% 不到 $1 概率几乎为 0', model[0.1].pBelow < 0.0005); inL('几乎为 0');
ok('σ=20% 不到 $1 约 3.7%', pct(model[0.2].pBelow, 1) === '3.7', pct(model[0.2].pBelow, 2)); inL('约 3.7%');
ok('σ=30% 不到 $1 约 21%', pct(model[0.3].pBelow, 0) === '21'); inL('约 21%');
ok('σ=40% 不到 $1 约 42%', pct(model[0.4].pBelow, 0) === '42'); inL('约 42%');
ok('σ=10% 回撤一半以上几乎没有', model[0.1].dd50 < 0.001); inL('几乎没有');
ok('σ=20% 回撤一半以上约 25%', pct(model[0.2].dd50, 0) === '25', pct(model[0.2].dd50, 2)); inL('约 25%');
ok('σ=30% 回撤一半以上约 79%', pct(model[0.3].dd50, 0) === '79'); inL('约 79%'); inL('大约八成');
ok('σ=40% 回撤一半以上约 96%', pct(model[0.4].dd50, 0) === '96'); inL('约 96%');
ok('方案：模拟回撤比例两位小数', [pct(model[0.2].dd50, 2), pct(model[0.3].dd50, 2), pct(model[0.4].dd50, 2)].join() === '24.93,78.94,96.19');
['24.93%', '78.94%', '96.19%'].forEach(inP);
ok('方案：模拟中位数', [0.1, 0.2, 0.3, 0.4].map(k => fmt(model[k].simMed, 2)).join() === '8.80,6.00,3.25,1.43');
inP('$8.80、$6.00、$3.25、$1.43');
ok('典型结果差将近七倍', model[0][`med30`] / model[0.4].med30 > 6.5 && model[0].med30 / model[0.4].med30 < 7); inL('差了将近七倍');
inL('10,000 条 30 年的路径'); inL('相差不到 3%'); inP('种子 20261120');

// ---------- D 正态分布与肥尾模型 ----------
const nt = k => 2 * (1 - Phi(k)); // 两侧尾部，方法一：数值积分
function ntail2(k) { // 方法二：互补误差函数的连分式 / 级数，独立于方法一
  const x = k / Math.SQRT2; // erfc(x) 用连分式
  let f = 0; for (let n = 60; n >= 1; n--) f = n / 2 / (x + f);
  return Math.exp(-x * x) / Math.sqrt(Math.PI) / (x + f);
}
for (const k of [3, 4, 5]) ok('正态尾部两种方法一致 k=' + k, Math.abs(nt(k) / ntail2(k) - 1) < 1e-4);
ok('1σ 内 68.3%', pct(1 - nt(1), 1) === '68.3'); inL('约 68.3%'); ok('1σ 外 31.7%', pct(nt(1), 1) === '31.7'); inL('约 31.7%');
ok('2σ 内 95.4%', pct(1 - nt(2), 1) === '95.4'); inL('约 95.4%'); ok('2σ 外 4.6%', pct(nt(2), 1) === '4.6'); inL('约 4.6%');
ok('3σ 内 99.7%', pct(1 - nt(3), 1) === '99.7'); inL('约 99.7%'); ok('3σ 外 0.27%', pct(ntail2(3), 2) === '0.27'); inL('约 0.27%');
ok('4σ 外 0.0063%', pct(ntail2(4), 4) === '0.0063'); inL('约 0.0063%');
ok('5σ 外 0.000057%', pct(ntail2(5), 6) === '0.000057'); inL('约 0.000057%');
ok('每万日 3σ 27 天', fmt(1e4 * ntail2(3), 1) === '27.0'); inL('约有 27 天'); inP('27.0');
ok('每万日 4σ 0.63 天', fmt(1e4 * ntail2(4), 2) === '0.63'); inP('0.63');
ok('每万日 5σ 0.0057 天', fmt(1e4 * ntail2(5), 4) === '0.0057'); inL('0.0057'); inP('0.0057');
ok('4σ 约 63 年一次', Math.round(1 / ntail2(4) / 252) === 63); inL('约 63 年');
ok('5σ 约 6,900 年一次', Math.round(1 / ntail2(5) / 252 / 100) * 100 === 6900); inL('约 6,900 年');
ok('10,000 交易日约 40 年', Math.round(10000 / 252) === 40); inL('大约 40 年');
// t 分布（自由度 4）标准化到同一标准差：方差 = 4/(4−2) = 2，k 个标准差对应 t = k√2
const t4cf = t => 1 - t * (t * t + 6) / Math.pow(t * t + 4, 1.5); // 两侧尾部闭式
function t4num(a) { let s = 0; const N = 400000, b = a + 2000, h = (b - a) / N; for (let i = 0; i < N; i++) { const x = a + (i + 0.5) * h; s += 0.375 / Math.pow(1 + x * x / 4, 2.5) * h; } return 2 * s; }
const t4exp = { 3: '132.4', 4: '48.1', 5: '21.1' };
for (const k of [3, 4, 5]) {
  const t = k * Math.SQRT2;
  ok('t4 闭式与数值积分一致 k=' + k, Math.abs(t4cf(t) / t4num(t) - 1) < 1e-3, t4cf(t) + ' vs ' + t4num(t));
  ok('t4 每万日 k=' + k, fmt(1e4 * t4cf(t), 1) === t4exp[k], fmt(1e4 * t4cf(t), 2)); inL(t4exp[k]); inP(t4exp[k]);
}

// ---------- E 联储 H.10 日元数据 ----------
const rows = csv.trim().split('\n').slice(1).map(l => l.split(','));
ok('数据 7,010 行', rows.length === 7010); inP('7,010 行');
ok('ND 274 行', rows.filter(r => r[1] === 'ND').length === 274); inP('274 行为 ND');
const d = rows.filter(r => r[1] !== 'ND').map(([s, x]) => ({ s, rate: +x, usd: 1 / +x }));
ok('起止日期', d[0].s === '2000-01-03' && d[d.length - 1].s === '2026-11-13'); inL('2000 年 1 月 3 日到 2026 年 11 月 13 日');
// 回撤：日元按美元算的价值
let hi = d[0], best = { dd: 0 };
for (const x of d) { if (x.usd > hi.usd) hi = x; const dd = 1 - x.usd / hi.usd; if (dd > best.dd) best = { dd, pk: hi, tr: x }; }
ok('最高点 2011-10-28 75.72', best.pk.s === '2011-10-28' && best.pk.rate === 75.72); inL('2011 年 10 月 28 日'); inL('75.72 日元');
ok('最低点 2026-07-29 163.86', best.tr.s === '2026-07-29' && best.tr.rate === 163.86); inL('2026 年 7 月 29 日'); inL('163.86 日元');
ok('最大回撤 53.8%', pct(best.dd, 1) === '53.8'); inL('约 53.8%'); inP('约 53.8%');
ok('只剩约 46%', pct(75.72 / 163.86, 0) === '46'); inL('约 46%'); ok('方案 $0.462', fmt(75.72 / 163.86, 3) === '0.462'); inP('约 $0.462');
const last = d[d.length - 1]; ok('末值 159.93', last.rate === 159.93); inL('159.93 日元');
ok('末端回撤 52.7%', pct(1 - 75.72 / 159.93, 1) === '52.7'); inL('约 52.7%'); ok('方案 $0.473', fmt(75.72 / 159.93, 3) === '0.473'); inP('约 $0.473');
ok('回本需涨 116%', pct(163.86 / 75.72 - 1, 0) === '116'); inL('约 116%'); inP('约 116%');
ok('数据中 75.72 是日元最值钱的一天', d.every(x => x.rate >= 75.72));
ok('2011-10-28 之后再没有回到 75.72', d.filter(x => x.s > '2011-10-28').every(x => x.rate > 75.72)); inL('还没有回本');
ok('方案起点值 0.745', fmt(75.72 / d[0].rate, 3) === '0.745'); inP('≈ $0.745');
inL('十五年过去');
// 日回报（简单百分比变化），相邻有报价日之间
const r = []; for (let i = 1; i < d.length; i++) r.push({ s: d[i].s, r: d[i].usd / d[i - 1].usd - 1 });
const n = r.length, mu = r.reduce((a, b) => a + b.r, 0) / n, sd = Math.sqrt(r.reduce((a, b) => a + (b.r - mu) ** 2, 0) / (n - 1));
ok('日回报 6,735 个', n === 6735); inL('6,735 个日回报'); inP('6,735');
ok('日标准差 0.62%', pct(sd, 2) === '0.62'); inL('约 0.62%');
ok('年化 9.8%', pct(sd * Math.sqrt(252), 1) === '9.8'); inL('约合每年 9.8%'); inL('年化不到 10%'); inP('年化约 9.8%');
ok('3σ≈1.86%', pct(3 * sd, 2) === '1.86'); inL('约 1.86%');
ok('4σ≈2.48%', pct(4 * sd, 2) === '2.48'); inL('约 2.48%');
ok('5σ≈3.1%', pct(5 * sd, 1) === '3.1'); inL('约 3.1%');
const cnt = k => r.filter(x => Math.abs(x.r - mu) > k * sd).length;
ok('超 3σ 92 天', cnt(3) === 92); inL('超出 3 个标准差的有 92 天');
ok('超 4σ 36 天', cnt(4) === 36); inL('超出 4 个标准差的有 36 天');
ok('超 5σ 7 天', cnt(5) === 7); inL('超出 5 个标准差的有 7 天'); inL('仍有 7 天超出 5 个标准差');
ok('正态预测 3σ 约 18 天', Math.round(n * ntail2(3)) === 18); inL('应有约 18 天');
ok('正态预测 4σ 约 0.43 天', fmt(n * ntail2(4), 2) === '0.43'); inL('约 0.43 天');
ok('正态预测 5σ 约 0.004 天', fmt(n * ntail2(5), 3) === '0.004'); inL('约 0.004 天');
const perTen = { 3: '136.6', 4: '53.5', 5: '10.4' };
for (const k of [3, 4, 5]) { ok('日元每万日 k=' + k, fmt(cnt(k) / n * 1e4, 1) === perTen[k]); inL(perTen[k]); inP(perTen[k]); }
const top = [...r].sort((a, b) => Math.abs(b.r - mu) - Math.abs(a.r - mu))[0];
ok('最大一天 2008-10-24 +5.35%', top.s === '2008-10-24' && pct(top.r, 2) === '5.35'); inL('2008 年 10 月 24 日'); inL('约 5.35%');
ok('相当于 8.6 个标准差', fmt((top.r - mu) / sd, 1) === '8.6'); inL('8.6 个标准差');
// 波动聚集
const idx = r.map((x, i) => Math.abs(x.r - mu) > 3 * sd ? i : -1).filter(i => i >= 0);
const by = {}; idx.forEach(i => { const y = r[i].s.slice(0, 4); by[y] = (by[y] || 0) + 1; });
ok('2008 年 14 天', by['2008'] === 14); inL('2008 年有 14 天');
ok('2016 年 12 天', by['2016'] === 12); inL('2016 年有 12 天');
ok('2022 年 10 天', by['2022'] === 10); inL('2022 年有 10 天');
ok('2009 年 7 天', by['2009'] === 7); inL('2009 年有 7 天');
const zeroYears = ['2003', '2006', '2012', '2018', '2019', '2021'];
ok('六个年份为 0', zeroYears.every(y => !by[y])); inL('2003、2006、2012、2018、2019、2021');
const allZero = []; for (let y = 2000; y <= 2026; y++) if (!by[y]) allZero.push(String(y));
ok('为 0 的年份正好是这六个', allZero.join() === zeroYears.join(), allZero.join());
const four = r.filter(x => Math.abs(x.r - mu) > 4 * sd);
ok('超 4σ 中 2008 年 10 月 5 天', four.filter(x => x.s.startsWith('2008-10')).length === 5); inL('有 5 天挤在 2008 年 10 月');
let nearN = 0; for (const i of idx) if (idx.some(j => j !== i && Math.abs(j - i) <= 20)) nearN++;
ok('20 日内有相邻极端日 59 个', nearN === 59); inL('92 个日子里有 59 个');
ok('约 64%', pct(nearN / idx.length, 0) === '64'); inL('约 64%');
const iid = 1 - Math.pow(1 - (idx.length - 1) / (n - 1), 40);
ok('随机撒布时约 42%', pct(iid, 0) === '42', pct(iid, 1)); inL('大约是 42%');
ok('近 27 年', (new Date('2026-11-13') - new Date('2000-01-03')) / 365.25 / 864e5 > 26.8); inL('近 27 年');

// ---------- F 法玛（1965）表 1、表 2 的平均行 ----------
// 表 1 正态一行：3.0 S 内 0.9973；5.0 S 外 0.0000006。表 2 平均行：3.0 S −0.0086；>5.0 S 0.0011632；0.5 S 0.0837
const beyond3 = (1 - 0.9973) + 0.0086; ok('法玛 超 3σ 约 1.1%', pct(beyond3, 1) === '1.1', pct(beyond3, 2)); inL('约占 1.1%'); inP('约 1.1%');
inL('正态分布预测是 0.27%');
ok('法玛 超 5σ 多出约 0.12%', pct(0.0011632, 2) === '0.12'); inL('约 0.12%');
ok('法玛 约 2,000 倍', Math.abs(0.0011632 / 0.0000006 / 2000 - 1) < 0.05); inL('约 2,000 倍'); inL('0.00006%');
ok('法玛 半个标准差内多 8.4 个百分点', fmt(0.0837 * 100, 1) === '8.4'); inL('约 8.4 个百分点');
inL('1,200 到 1,700 个日回报'); inL('1962 年 9 月 26 日'); inL('30 只成分股');

// ---------- G 其他 ----------
near('涨跌停两天最多 19%', 1 - 0.9 * 0.9, 0.19, 1e-12); inL('1 − 0.9 × 0.9 = 19%');
inL('10%'); inL('20%'); inL('前 5 个交易日'); inL('2026 年 7 月 6 日');
inL('下跌 508 点，跌幅 22.6%');
ok('√252', Math.abs(Math.sqrt(252) - 15.87) < 0.01); inL('252 的平方根');

console.log('通过 ' + pass + '，失败 ' + fail);
if (fail) process.exit(1);
