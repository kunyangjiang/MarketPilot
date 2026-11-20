// S07-05 数值核验：用固定随机种子实际运行 Franke 与 Westerhoff（BERG 工作论文 78，2011）的 DCA-HPM 模型，
// 重算课文与《图与交互方案》里的每个统计量，并断言它们确实出现在这两份文件里。
// 运行：node "S07-05 数值核验.js"（在本目录或仓库根目录均可）。不依赖网络与临时目录。
'use strict';
const fs = require('fs');
const path = require('path');
const DIR = __dirname;
const read = f => fs.readFileSync(path.join(DIR, f), 'utf8').replace(/\r/g, '');
const lesson = read('S07-05 课文 v1 候选.md');
const plan = read('S07-05 图与交互方案 v1 候选.md');
const body = lesson.split('\n').slice(lesson.split('\n').findIndex(l => /^---\s*$/.test(l)) + 1).join('\n');

let pass = 0, fail = 0;
function ok(name, cond, note) { if (cond) pass++; else { fail++; console.log('失败：' + name + (note ? '（' + note + '）' : '')); } }
const inText = (s, where = body, label = '课文') => ok(label + '含「' + s + '」', where.includes(s));
const inBoth = s => { inText(s); inText(s, plan, '方案'); };
const f = (x, d = 2) => { const s = x.toFixed(d); return /^-0\.0*$/.test(s) ? s.slice(1) : s; };

// ===== 模型（规格见《图与交互方案》「模型规格」一节，逐条一致）=====
const BASE = Object.freeze({ mu: 0.01, beta: 1, phi: 0.12, chi: 1.50, ao: -0.327, an: 1.79, ap: 18.43, sf: 0.758, sc: 2.087, pstar: 0 });
function mulberry32(seed) { let a = seed >>> 0; return () => { a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
function simulate(P, opt = {}) {
  const T = opt.T || 10000, burn = opt.burn == null ? 1000 : opt.burn, seed = opt.seed == null ? 1 : opt.seed;
  const U = mulberry32(seed);
  let p = 0, pPrev = 0, nf = P.fixedNc == null ? 0.5 : 1 - P.fixedNc;
  const r = new Float64Array(T), nc = new Float64Array(T);
  for (let t = 0; t < burn + T; t++) {
    const u1 = 1 - U(), u2 = U(), R = Math.sqrt(-2 * Math.log(u1));
    const ef = R * Math.cos(2 * Math.PI * u2), ec = R * Math.sin(2 * Math.PI * u2);
    const df = P.phi * (P.pstar - p) + P.sf * ef;          // 基本面型的平均订单
    const dc = P.chi * (p - pPrev) + P.sc * ec;            // 趋势型的平均订单
    const pNew = p + P.mu * (nf * df + (1 - nf) * dc);     // 做市商定价
    if (t >= burn) { r[t - burn] = 100 * (pNew - p); nc[t - burn] = 1 - nf; }
    if (P.fixedNc == null) {                                // 收盘后按吸引力重新分组
      const a = P.ao + P.an * (2 * nf - 1) + P.ap * (p - P.pstar) ** 2;
      nf = 1 / (1 + Math.exp(-P.beta * a));
    }
    pPrev = p; p = pNew;
  }
  return { r, nc };
}
const mean = x => { let s = 0; for (const v of x) s += v; return s / x.length; };
const sd = x => { const m = mean(x); let s = 0; for (const v of x) s += (v - m) ** 2; return Math.sqrt(s / x.length); };
function exKurt(x) { const m = mean(x); let m2 = 0, m4 = 0; for (const v of x) { const d = (v - m) ** 2; m2 += d; m4 += d * d; } m2 /= x.length; m4 /= x.length; return m4 / (m2 * m2) - 3; }
function acf(x, L) { const m = mean(x); let num = 0, den = 0; for (let i = 0; i < x.length; i++) { const d = x[i] - m; den += d * d; if (i >= L) num += d * (x[i - L] - m); } return num / den; }
const absOf = x => Float64Array.from(x, Math.abs);
function tail(x, k) { const m = mean(x), s = sd(x); let c = 0; for (const v of x) if (Math.abs(v - m) > k * s) c++; return c; }
const LAGS = [1, 5, 10, 25, 50];
function summary(r) {
  const v = absOf(r);
  return { k: exKurt(r), r1: acf(r, 1), a: Object.fromEntries([1, 2, 5, 10, 25, 50, 99, 100, 101].map(L => [L, acf(v, L)])), t3: tail(r, 3), t4: tail(r, 4) };
}
function cell(P, seeds = [1, 2, 3, 4, 5]) {
  let k = 0; const a = Object.fromEntries(LAGS.map(L => [L, 0]));
  for (const s of seeds) { const o = simulate(P, { seed: s }); k += exKurt(o.r); const v = absOf(o.r); for (const L of LAGS) a[L] += acf(v, L); }
  for (const L of LAGS) a[L] /= seeds.length;
  return { k: k / seeds.length, a10: a[10], amin: Math.min(...LAGS.map(L => a[L])), amax: Math.max(...LAGS.map(L => Math.abs(a[L]))) };
}
const yes = s => s.k > 0.5 && LAGS.every(L => s.a[L] > 0.05);          // 本课的「两样都有」
const no = (s, lim = 0.03) => Math.abs(s.k) < 0.2 && LAGS.every(L => Math.abs(s.a[L]) < lim); // 「两样都没有」
const cls = c => (c.k >= 0.5 && c.amin > 0.05) ? '有' : (Math.abs(c.k) < 0.2 && c.amax < 0.03) ? '无' : '微弱';

// ===== 0 正态分布基准（与 S05-01 一致）=====
const erfc = x => { // Numerical Recipes 的 erfc 切比雪夫近似，相对误差小于 1.2e-7
  const z = Math.abs(x), t = 1 / (1 + 0.5 * z);
  const r = t * Math.exp(-z * z - 1.26551223 + t * (1.00002368 + t * (0.37409196 + t * (0.09678418 + t * (-0.18628806 + t * (0.27886807 + t * (-1.13520398 + t * (1.48851587 + t * (-0.82215223 + t * 0.17087277)))))))));
  return x >= 0 ? r : 2 - r;
};
const twoSided = k => erfc(k / Math.SQRT2);
ok('正态：每一万天超出 4σ 约 0.63 天', f(twoSided(4) * 1e4) === '0.63'); inBoth('0.63 天');
ok('正态：每一万天超出 3σ 约 27.0 天', f(twoSided(3) * 1e4, 1) === '27.0'); inText('正态分布预测约 27.0 天');

// ===== 1 原文参数（表 1 DCA-HPM）出现在课文与方案 =====
for (const s of ['0.12', '1.50', '2.087', '0.758', '0.01', '−0.327', '1.79', '18.43']) inBoth(s);

// ===== 2 噪声带来的每日晃动、确定部分的大小、走一遍的例子、小题 1 =====
const noiseSd = (nc, sf = BASE.sf, sc = BASE.sc) => Math.sqrt((1 - nc) ** 2 * sf * sf + nc * nc * sc * sc);
ok('全是基本面型 0.76%', f(noiseSd(0)) === '0.76'); inText('全是基本面型时，约 0.76%');
ok('各占一半 1.11%', f(noiseSd(0.5)) === '1.11'); inText('各占一半时，约 1.11%');
ok('全是趋势型 2.09%', f(noiseSd(1)) === '2.09'); inText('全是趋势型时，约 2.09%');
ok('偏离 20% 时一天回拉约 0.024%', f(100 * BASE.mu * BASE.phi * 0.20, 3) === '0.024'); inText('约 0.024%');
ok('趋势型每天延续前一天涨跌约 1.5%', f(100 * BASE.mu * BASE.chi, 1) === '1.5'); inText('延续约 1.5%');
{ // 走一遍：价格高于价值 10%、今天涨 1%、基本面型 70%、噪声 +0.5 / −1.0
  const df = BASE.phi * (-0.10) + 0.5, dc = BASE.chi * 0.01 - 1.0, agg = 0.7 * df + 0.3 * dc;
  ok('例子：基本面型订单 0.488', f(df, 3) === '0.488'); inText('−0.012 + 0.5 = 0.488');
  ok('例子：趋势型订单 −0.985', f(dc, 3) === '-0.985'); inText('0.015 − 1.0 = −0.985');
  ok('例子：加总 0.0461', f(agg, 4) === '0.0461'); inText('≈ 0.0461');
  ok('例子：价格调高约 0.046%', f(100 * BASE.mu * agg, 3) === '0.046'); inText('约 0.046%');
  const det = 0.7 * BASE.phi * (-0.10) + 0.3 * BASE.chi * 0.01;
  ok('例子：去掉噪声 −0.0039', f(det, 4) === '-0.0039'); inText('= −0.0039'); inText('下调约 0.0039%');
  ok('例子：去掉噪声后的价格变动', f(100 * BASE.mu * det, 4) === '-0.0039');
}
{ // 小题 1
  const a = 0.4 * BASE.sf, b = 0.6 * BASE.sc;
  ok('小题 1：0.303', f(a, 3) === '0.303'); ok('小题 1：1.252', f(b, 3) === '1.252');
  ok('小题 1：0.092 与 1.568', f(a * a, 3) === '0.092' && f(b * b, 3) === '1.568');
  ok('小题 1：1.660', f(a * a + b * b, 3) === '1.660'); ok('小题 1：1.29%', f(noiseSd(0.6)) === '1.29');
  for (const s of ['0.4 × 0.758 ≈ 0.303', '0.6 × 2.087 ≈ 1.252', '0.092 和 1.568', '相加约 1.660', '开平方约 1.29%']) inText(s);
}

// ===== 3 种子 1：原文参数（B 段）与比例固定（A 段）=====
const B1 = simulate(BASE, { seed: 1 }), sB = summary(B1.r);
ok('B 段两样都有（超额峰度 > 0.5，绝对回报滞后 1–50 天自相关都 > 0.05）', yes(sB));
ok('B 段超额峰度 1.85', f(sB.k) === '1.85'); inBoth('超额峰度约 1.85');
ok('B 段超出 4σ 22 天', sB.t4 === 22); inBoth('22 天');
ok('B 段 |r| 滞后 1 天 0.17', f(sB.a[1]) === '0.17'); inText('滞后 1 天约 0.17');
ok('B 段 |r| 滞后 10 天 0.16', f(sB.a[10]) === '0.16'); inText('滞后 10 天约 0.16'); inText('相隔 10 天的自相关约 0.16', plan, '方案'); inText('相隔 10 天的自相关约 0.16');
ok('B 段 |r| 滞后 50 天 0.11', f(sB.a[50]) === '0.11'); inText('滞后 50 天约 0.11');
ok('B 段 |r| 滞后 100 天 0.075', f(sB.a[100], 3) === '0.075'); inText('滞后 100 天仍有约 0.075');
ok('B 段 回报本身滞后 1 天 0.018', f(sB.r1, 3) === '0.018'); inText('约 0.018');
ok('B 段 |r| 自相关随滞后递减（1 > 10 > 50 > 100）', sB.a[1] > sB.a[10] && sB.a[10] > sB.a[50] && sB.a[50] > sB.a[100] && sB.a[100] > 0);
{ // 与标普 500 的对照：相邻滞后平均（论文脚注 5：滞后 1 取第 1、2 个的平均；其余取 τ−1、τ、τ+1 三个的平均）
  const sm1 = (sB.a[1] + sB.a[2]) / 2, sm100 = (sB.a[99] + sB.a[100] + sB.a[101]) / 3;
  ok('B 段平滑后滞后 1 天 0.17', f(sm1) === '0.17'); ok('B 段平滑后滞后 100 天 0.066', f(sm100, 3) === '0.066');
  inText('分别约为 0.17 和 0.066');
  inText('滞后 1 天约 0.19，滞后 100 天约 0.07'); // 论文表 A1：0.193、0.074（论文统计量，非本脚本计算）
  ok('表 A1 数字四舍五入', f(0.193) === '0.19' && f(0.074) === '0.07');
}
ok('日元每一万天超出 4σ 约 53.5 天（S05-01：6,735 天中 36 天）', f(36 / 6735 * 1e4, 1) === '53.5'); inText('约有 53.5 天');
ok('B 段平均趋势型比例 35.5%', f(100 * mean(B1.nc), 1) === '35.5'); inText('约 35.5%');
{ // 图 3：动荡时谁在市场上
  const hi = [], lo = []; for (let i = 0; i < B1.r.length; i++) { const v = Math.abs(B1.r[i]); if (B1.nc[i] > 0.5) hi.push(v); else if (B1.nc[i] < 0.2) lo.push(v); }
  ok('趋势型过半 3,123 天', hi.length === 3123); ok('趋势型不到两成 4,455 天', lo.length === 4455);
  ok('过半日平均 |r| 1.23%', f(mean(hi)) === '1.23'); ok('不到两成日平均 |r| 0.57%', f(mean(lo)) === '0.57');
  const top = [...B1.r.keys()].sort((a, b) => Math.abs(B1.r[b]) - Math.abs(B1.r[a])).slice(0, 100);
  ok('最大的 100 天全部在趋势型过半的日子', top.filter(i => B1.nc[i] > 0.5).length === 100);
  for (const s of ['3,123 天', '4,455 天', '约 1.23%', '约 0.57%', '最大的 100 天']) inBoth(s);
}
const A1 = simulate({ ...BASE, an: 0, ap: 0 }, { seed: 1 }), sA = summary(A1.r);
ok('A 段两样都没有（|超额峰度| < 0.2，各滞后 |自相关| < 0.03）', no(sA));
ok('A 段趋势型固定 58.1%', f(100 * A1.nc[0], 1) === '58.1' && A1.nc.every(x => x === A1.nc[0])); inText('约 58.1%');
ok('A 段超额峰度约 0.00', f(sA.k) === '0.00'); inText('超额峰度约 0.00'); inText('超额峰度约 0.00', plan, '方案');
ok('A 段超出 4σ 0 天', sA.t4 === 0); inBoth('超出 4 个标准差的日子 0 天');
ok('A 段超出 3σ 28 天', sA.t3 === 28); inText('超出 3 个标准差的 28 天');
ok('A 段 |r| 滞后 10 天 −0.01', f(sA.a[10]) === '-0.01'); inBoth('相隔 10 天的自相关约 −0.01');
{ const vals = [1, 5, 10, 25, 50, 100].map(L => sA.a[L]);
  ok('A 段各滞后自相关在 −0.011 到 0.006 之间', f(Math.min(...vals), 3) === '-0.011' && f(Math.max(...vals), 3) === '0.006');
  inText('都在 −0.011 到 0.006 之间'); }

// ===== 4 换种子：1 到 100 =====
{
  const kB = [], kA = []; let nYes = 0, nNo = 0;
  for (let s = 1; s <= 100; s++) {
    const b = summary(simulate(BASE, { seed: s }).r); kB.push(b.k); if (yes(b)) nYes++;
    const a = summary(simulate({ ...BASE, an: 0, ap: 0 }, { seed: s }).r); kA.push(a.k); if (no(a, 0.05)) nNo++;
  }
  kB.sort((x, y) => x - y); kA.sort((x, y) => x - y);
  ok('原文参数 100 个种子：超额峰度 1.20 到 2.53', f(kB[0]) === '1.20' && f(kB[99]) === '2.53'); inText('在 1.20 到 2.53 之间');
  ok('原文参数 100 个种子：中位数 1.80', f((kB[49] + kB[50]) / 2) === '1.80'); inText('中位数约 1.80');
  ok('原文参数 100 个种子中 98 个两样都有', nYes === 98); inBoth('98 个'); inText('100 次里有 98 次');
  ok('比例固定 100 个种子：超额峰度都在 −0.10 到 0.10 之间', kA[0] > -0.105 && kA[99] < 0.105 && f(kA[0]) === '-0.10' && f(kA[99]) === '0.10'); inText('都在 −0.10 到 0.10 之间');
  ok('比例固定 100 个种子全部「两样都没有」（自相关容差 0.05）', nNo === 100);
}

// ===== 5 参数地图（种子 1–5 平均）=====
const AN = [0, 0.5, 1.0, 1.5, 1.79, 2.0, 2.5], SC = [0.758, 1.2, 1.6, 2.087, 2.6];
const grid = SC.map(sc => AN.map(an => cell({ ...BASE, an, sc })));
// 方案里的两张表逐格核对
function planTable(title) {
  const i = plan.indexOf('**' + title); if (i < 0) return null;
  const rows = plan.slice(i).split('\n').filter(l => /^\| *[\d.]+ *\|/.test(l)).slice(0, SC.length);
  return rows.map(l => l.replace(/^\||\|$/g, '').split('|').map(c => c.trim().replace(/^−/, '-').replace(/[（(].*$/, '').trim()).slice(1));
}
const tk = planTable('表 4-1'), ta = planTable('表 4-2'), tc = planTable('表 4-3');
ok('方案有表 4-1、4-2、4-3', tk && ta && tc && tk.length === 5 && ta.length === 5 && tc.length === 5);
if (tk && ta && tc) for (let r = 0; r < SC.length; r++) for (let c = 0; c < AN.length; c++) {
  const g = grid[r][c], tag = `σc=${SC[r]}, αn=${AN[c]}`;
  ok('表 4-1 超额峰度 ' + tag, tk[r][c] === f(g.k), tk[r][c] + ' vs ' + f(g.k));
  ok('表 4-2 滞后 10 天自相关 ' + tag, ta[r][c] === f(g.a10), ta[r][c] + ' vs ' + f(g.a10));
  ok('表 4-3 分类 ' + tag, tc[r][c] === cls(g), tc[r][c] + ' vs ' + cls(g));
}
const G = (sc, an) => grid[SC.indexOf(sc)][AN.indexOf(an)];
ok('原文参数格「有」', cls(G(2.087, 1.79)) === '有');
ok('噪声相同一行：超额峰度都不超过 0.05', grid[0].every(c => +f(c.k) <= 0.05)); inText('超额峰度都不超过 0.05');
ok('噪声相同一行：滞后 10 天约 0.01', grid[0].every(c => f(c.a10) === '0.01')); inText('滞后 10 天的自相关约 0.01');
ok('噪声相同一行全部「无」', grid[0].every(c => cls(c) === '无'));
ok('从众 0：超额峰度 0.44、滞后 10 天 0.06', f(G(2.087, 0).k) === '0.44' && f(G(2.087, 0).a10) === '0.06'); inText('超额峰度降到约 0.44'); inText('滞后 10 天的自相关约 0.06');
ok('从众 0 为「微弱」', cls(G(2.087, 0)) === '微弱');
ok('从众 2.5：超额峰度 3.01', f(G(2.087, 2.5).k) === '3.01'); inText('超额峰度升到约 3.01');
ok('「有」只出现在右下方：每个「有」格的右边和下边也都是「有」', grid.every((row, r) => row.every((c, j) => cls(c) !== '有' || ((j + 1 >= AN.length || cls(row[j + 1]) === '有') && (r + 1 >= SC.length || cls(grid[r + 1][j]) === '有')))));
{ // 比例固定的横条
  const fx = [0, 0.25, 0.5, 0.75, 1].map(x => cell({ ...BASE, fixedNc: x }));
  ok('比例固定横条全部「无」', fx.every(c => cls(c) === '无'));
  const ks = fx.map(c => c.k);
  ok('比例固定：超额峰度在 −0.05 到 0.01 之间', f(Math.min(...ks)) === '-0.05' && f(Math.max(...ks)) === '0.01'); inText('超额峰度都在 −0.05 到 0.01 之间');
  const row = plan.split('\n').find(l => /^\| 比例固定（/.test(l));
  ok('方案「比例固定」行逐格一致', row && row.replace(/^\||\|$/g, '').split('|').slice(1).map(s => s.trim().replace(/^−/, '-')).join(' ') === ks.map(k => f(k)).join(' '));
}
{ // 偏好
  const c0 = cell({ ...BASE, ao: 0 }), c3 = cell({ ...BASE, ao: 0.3 });
  ok('偏好 0：超额峰度 0.24、滞后 10 天 0.03', f(c0.k) === '0.24' && f(c0.a10) === '0.03'); inText('超额峰度降到约 0.24'); inText('滞后 10 天的自相关约 0.03');
  ok('偏好 0.3：两样都没有', cls(c3) === '无'); inText('改成 0.3，两样都消失了');
  const row = plan.split('\n').find(l => /^\| 偏好/.test(l));
  const want = [-0.6, -0.327, 0, 0.3].map(ao => f(cell({ ...BASE, ao }).k)).join(' ');
  ok('方案「偏好」行逐格一致', row && row.replace(/^\||\|$/g, '').split('|').slice(1).map(s => s.trim().replace(/^−/, '-')).join(' ') === want, want);
}
{ // 趋势型反应强度
  const c0 = cell({ ...BASE, chi: 0 }), c3 = cell({ ...BASE, chi: 3 }), c15 = cell(BASE);
  ok('反应强度 0 与 3：超额峰度 1.77 与 1.79', f(c0.k) === '1.77' && f(c3.k) === '1.79'); inText('超额峰度约 1.77 和 1.79');
  ok('反应强度几乎不改变结果（与 1.50 相差不到 0.05）', Math.abs(c0.k - c15.k) < 0.05 && Math.abs(c3.k - c15.k) < 0.05);
  const row = plan.split('\n').find(l => /^\| 反应强度/.test(l));
  ok('方案「反应强度」行逐格一致', row && row.replace(/^\||\|$/g, '').split('|').slice(1).map(s => s.trim()).join(' ') === [c0, c15, c3].map(c => f(c.k)).join(' '));
}
{ // 偏离回归为 0
  const c = cell({ ...BASE, ap: 0 });
  const row = plan.split('\n').find(l => /^\| 偏离回归为 0/.test(l));
  ok('方案「偏离回归为 0」行一致', row && row.includes(f(c.k)) && cls(c) === '无');
}

// ===== 6 方案「模型规格」与本脚本一致 =====
for (const s of ['mulberry32', '0x6D2B79F5', '1 − U()', '11,000', '1,000', '10,000', '随机种子 1', '种子 1 到 5']) inText(s, plan, '方案');

console.log(`\n通过 ${pass}，失败 ${fail}`);
if (fail) process.exit(1);
