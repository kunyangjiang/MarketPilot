// S07-05 数值核验（研究阶段）：按《图与交互方案》「模型规格」独立重写一遍模型（不复用《S07-05 数值核验.js》的任何代码），
// 检查规格写得足够明确：另一个人照规格实现，能得到同样的数字。同时记录选模型时做的几项探查。
// 运行：node "S07-05 数值核验（研究阶段）.js"
'use strict';

// —— 照规格独立实现 ——
class Mulberry {
  constructor(seed) { this.s = seed >>> 0; }
  next() {
    this.s = (this.s + 0x6D2B79F5) | 0;
    let t = Math.imul(this.s ^ (this.s >>> 15), 1 | this.s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }
}
function run(params, seed) {
  const g = new Mulberry(seed);
  const { mu, phi, chi, sf, sc, ao, an, ap, fixedNc } = params;
  const logp = [0, 0];               // p_{-1}, p_0
  let share = fixedNc === undefined ? 0.5 : 1 - fixedNc; // n^f
  const ret = [], chartist = [];
  for (let day = 0; day < 11000; day++) {
    const x = 1 - g.next(), y = g.next();
    const rad = Math.sqrt(-2 * Math.log(x)), ang = 2 * Math.PI * y;
    const pt = logp[logp.length - 1], pt1 = logp[logp.length - 2];
    const demandF = phi * (0 - pt) + sf * rad * Math.cos(ang);
    const demandC = chi * (pt - pt1) + sc * rad * Math.sin(ang);
    const next = pt + mu * (share * demandF + (1 - share) * demandC);
    if (day >= 1000) { ret.push(100 * (next - pt)); chartist.push(1 - share); }
    if (fixedNc === undefined) share = 1 / (1 + Math.exp(-(ao + an * (share - (1 - share)) + ap * pt * pt)));
    logp.push(next); if (logp.length > 2) logp.shift();
  }
  return { ret, chartist };
}
function moments(xs) {
  const n = xs.length, m = xs.reduce((a, b) => a + b, 0) / n;
  const c = xs.map(v => v - m);
  const v2 = c.reduce((a, b) => a + b * b, 0) / n, v4 = c.reduce((a, b) => a + b ** 4, 0) / n;
  return { m, sd: Math.sqrt(v2), exk: v4 / v2 / v2 - 3 };
}
function autocorr(xs, lag) {
  const n = xs.length, m = xs.reduce((a, b) => a + b, 0) / n;
  let top = 0, bot = 0;
  for (let i = 0; i < n; i++) bot += (xs[i] - m) ** 2;
  for (let i = lag; i < n; i++) top += (xs[i] - m) * (xs[i - lag] - m);
  return top / bot;
}

const P = { mu: 0.01, phi: 0.12, chi: 1.5, sf: 0.758, sc: 2.087, ao: -0.327, an: 1.79, ap: 18.43 };
let pass = 0, fail = 0;
const ok = (name, c) => { if (c) pass++; else { fail++; console.log('失败：' + name); } };
const r2 = x => (Math.round(x * 100) / 100).toFixed(2);

// 与生产脚本的结果对照（数字取自课文）
{
  const { ret, chartist } = run(P, 1), mo = moments(ret), ab = ret.map(Math.abs);
  ok('种子 1 超额峰度 1.85', r2(mo.exk) === '1.85');
  ok('种子 1 超出 4σ 22 天', ret.filter(v => Math.abs(v - mo.m) > 4 * mo.sd).length === 22);
  ok('种子 1 |r| 滞后 1/10/50 天 0.17/0.16/0.11', [1, 10, 50].map(L => r2(autocorr(ab, L))).join() === '0.17,0.16,0.11');
  ok('种子 1 平均趋势型比例 35.5%', (100 * chartist.reduce((a, b) => a + b, 0) / chartist.length).toFixed(1) === '35.5');
  ok('趋势型过半 3,123 天', chartist.filter(x => x > 0.5).length === 3123);
}
{
  const { ret } = run({ ...P, an: 0, ap: 0 }, 1), mo = moments(ret);
  ok('比例固定 种子 1 超额峰度约 0.00', Math.abs(mo.exk) < 0.005);
  ok('比例固定 种子 1 超出 3σ 28 天', ret.filter(v => Math.abs(v - mo.m) > 3 * mo.sd).length === 28);
}

// 研究阶段的探查（选模型时用；结论写进研究简报第 8 节）
// 1) 均值回复与趋势延续的日度力度：μφ = 0.0012（半衰期约 ln2 / 0.0012 ≈ 578 天），μχ = 0.015
ok('基本面回拉半衰期约 578 天', Math.round(Math.log(2) / (P.mu * P.phi)) === 578);
// 2) 两组噪声相同、但保留换组时，噪声标准差仍随比例在 0.536 与 0.758 之间变化（不是常数），但模拟不出特征
ok('噪声相同时各占一半 0.536', (0.758 * Math.sqrt(0.5)).toFixed(3) === '0.536');
{
  const { ret } = run({ ...P, sc: 0.758 }, 1), mo = moments(ret);
  ok('噪声相同（种子 1）超额峰度 < 0.2', Math.abs(mo.exk) < 0.2);
}

console.log(`\n通过 ${pass}，失败 ${fail}`);
if (fail) process.exit(1);
