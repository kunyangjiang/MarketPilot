// S05-02 数值核验：node "S05-02 数值核验.js"
// 读取《S05-02 课文 v1 候选.md》与《S05-02 图与交互方案 v1 候选.md》，重算课文与图中的每个关键数字，
// 并断言这些数字确实出现在文件里。每组数字尽量用两种互不依赖的算法得到（逐个年景枚举 / 公式；协方差矩阵逐项求和 / 闭式）。
// 不依赖网络，不依赖 scratchpad。论文里报告的统计量（F 组）来自原文，不重算，只断言课文写法与来源登记一致。
'use strict';
const fs = require('fs');
const path = require('path');
const dir = __dirname;
const lesson = fs.readFileSync(path.join(dir, 'S05-02 课文 v1 候选.md'), 'utf8').replace(/\r/g, '');
const figs = fs.readFileSync(path.join(dir, 'S05-02 图与交互方案 v1 候选.md'), 'utf8').replace(/\r/g, '');

let pass = 0, fail = 0;
function ok(name, cond, note) {
  if (cond) pass++; else { fail++; console.log('失败 ' + name + (note ? '：' + note : '')); }
}
function near(name, x, y, tol) { ok(name, Math.abs(x - y) <= (tol === undefined ? 0.005 : tol), x + ' vs ' + y); }
function inL(s) { ok('课文含「' + s + '」', lesson.includes(s)); }
function inF(s) { ok('图方案含「' + s + '」', figs.includes(s)); }
const r2 = x => (Math.round(x * 100 + 1e-9) / 100).toFixed(2);
const r3 = x => (Math.round(x * 1000 + 1e-9) / 1000).toFixed(3);

// ---------- 工具：按概率加权的均值、标准差、协方差（枚举年景） ----------
function stats(states) { // states: [{p, a, b}]
  const m = k => states.reduce((s, x) => s + x.p * x[k], 0);
  const ma = m('a'), mb = m('b');
  const va = states.reduce((s, x) => s + x.p * (x.a - ma) ** 2, 0);
  const vb = states.reduce((s, x) => s + x.p * (x.b - mb) ** 2, 0);
  const cov = states.reduce((s, x) => s + x.p * (x.a - ma) * (x.b - mb), 0);
  const port = states.map(x => ({ p: x.p, r: (x.a + x.b) / 2 }));
  const mp = port.reduce((s, x) => s + x.p * x.r, 0);
  const vp = port.reduce((s, x) => s + x.p * (x.r - mp) ** 2, 0);
  return { ma, mb, sa: Math.sqrt(va), sb: Math.sqrt(vb), cov, rho: cov / Math.sqrt(va * vb), mp, sp: Math.sqrt(vp), port };
}
const U = 40, D = -20;
const same = stats([{ p: .5, a: U, b: U }, { p: .5, a: D, b: D }]);
const opp = stats([{ p: .5, a: U, b: D }, { p: .5, a: D, b: U }]);
const ind = stats([{ p: .25, a: U, b: U }, { p: .25, a: U, b: D }, { p: .25, a: D, b: U }, { p: .25, a: D, b: D }]);
const eight = stats([{ p: 3 / 8, a: U, b: U }, { p: 3 / 8, a: D, b: D }, { p: 1 / 8, a: U, b: D }, { p: 1 / 8, a: D, b: U }]);

// ===== A 组：四张年景表（第 2 节、图 1） =====
for (const [k, s] of [['同步', same], ['反向', opp], ['不相干', ind], ['八种', eight]]) {
  near('A ' + k + ' 单只平均 10', s.ma, 10, 1e-12); near('A ' + k + ' 单只波动 30', s.sa, 30, 1e-12);
  near('A ' + k + ' 组合平均 10', s.mp, 10, 1e-12);
}
ok('A 同步 30.00', r2(same.sp) === '30.00'); ok('A 反向 0', r2(opp.sp) === '0.00');
ok('A 不相干 21.21', r2(ind.sp) === '21.21'); ok('A 八种 25.98', r2(eight.sp) === '25.98');
near('A 21.21 = 30/√2', ind.sp, 30 / Math.SQRT2, 1e-12);
ok('A 反向每年 10%', opp.port.every(x => x.r === 10)); inL('（40% − 20%）÷ 2 = 10%');
ok('A 不相干组合回报 40/10/10/-20', ind.port.map(x => x.r).join(',') === '40,10,10,-20');
ok('A 一起涨跌的年景占一半', ind.port.filter(x => x.r !== 10).length / 4 === 0.5); inL('仍然占了一半的可能');
inL('涨 40%，或者跌 20%'); inL('平均回报都是 10%'); inL('正好 30 个百分点，波动率就是 30%');
inL('波动率却降到约 21.21%'); inL('组合的波动率约 25.98%'); inL('它是 30% 除以 2 的平方根'); inL('变成 15%');
inL('三次一起涨，三次一起跌，各有一次一涨一跌');
inF('波动率 21.21%'); inF('波动率 25.98%'); inF('波动率 30%'); inF('波动率 0');
inL('组合的波动率（30%、0、21.21%、25.98%）');

// ===== B 组：协方差与相关系数（第 3 节） =====
ok('B 协方差 900/-900/0/450', [same, opp, ind, eight].map(s => Math.round(s.cov)).join(',') === '900,-900,0,450');
ok('B 相关系数 1/-1/0/0.5', [same, opp, ind, eight].map(s => +s.rho.toFixed(6)).join(',') === '1,-1,0,0.5');
inL('| 完全同步 | +900、+900 | 900 | 1 |'); inL('| 完全反向 | −900、−900 | −900 | −1 |');
inL('| 互不相干 | +900、−900、−900、+900 | 0 | 0 |'); inL('| 八种年景 | 六次 +900，两次 −900 | 450 | 0.5 |');
inL('涨 40% 的年份偏离是 +30，跌 20% 的年份是 −30');
inL('乘积是 900，于是四种情形的相关系数分别是 1、−1、0 和 0.5');
// 相关系数不管幅度：超市股只动一半（同方向）、或幅度是 3 倍，相关系数仍为 1
const half = stats([{ p: .5, a: U, b: 10 + 15 }, { p: .5, a: D, b: 10 - 15 }]);
const triple = stats([{ p: .5, a: U, b: 10 + 90 }, { p: .5, a: D, b: 10 - 90 }]);
near('B 一半幅度 ρ=1', half.rho, 1, 1e-12); near('B 三倍幅度 ρ=1', triple.rho, 1, 1e-12);
inL('只涨跌一半的幅度，两者的相关系数仍然是 1'); inL('相关系数是 1。');
ok('B 小题 1 答案 错', /【小题 1】[\s\S]*?\*\*答案：\*\* 错。/.test(lesson));
inL('相关系数是 −0.82');

// ===== C 组：两只股票的组合（第 4 节、图 2、小题 2） =====
const twoF = (w, s1, s2, rho) => Math.sqrt(w * w * s1 * s1 + (1 - w) ** 2 * s2 * s2 + 2 * w * (1 - w) * rho * s1 * s2);
// 方法二：用年景枚举得到的协方差直接算
near('C 公式=枚举 ρ=0', twoF(.5, 30, 30, 0), ind.sp, 1e-12);
near('C 公式=枚举 ρ=0.5', twoF(.5, 30, 30, .5), eight.sp, 1e-12);
near('C 公式=枚举 ρ=1', twoF(.5, 30, 30, 1), same.sp, 1e-12);
near('C 公式=枚举 ρ=-1', twoF(.5, 30, 30, -1), opp.sp, 1e-9);
const rhos = [-1, -0.75, -0.5, -0.25, 0, 0.25, 0.5, 0.75, 1];
const nine = ['0.00', '10.61', '15.00', '18.37', '21.21', '23.72', '25.98', '28.06', '30.00'];
rhos.forEach((r, i) => {
  const v = twoF(.5, 30, 30, r);
  near('C 闭式 30√((1+ρ)/2) ρ=' + r, v, 30 * Math.sqrt((1 + r) / 2), 1e-9);
  ok('C ρ=' + r + ' → ' + nine[i], r2(v) === nine[i], r2(v));
});
inL('组合波动率：' + nine.map(x => x + '%').join('、'));
inF('| 组合波动率 | ' + nine.map(x => x + '%').join(' | ') + ' |');
inL('前两项各是 0.25 × 900 = 225'); inL('450 × 相关系数'); inL('组合方差是 450，开平方约 21.21%'); inL('为 0.5 时是 675，约 25.98%');
ok('C 只要 ρ<1，组合波动率 < 30', rhos.filter(r => r < 1).every(r => twoF(.5, 30, 30, r) < 30 - 1e-9));
inL('相关系数 −0.5 时组合波动率只有 15%');
// 80/20，ρ=0
const w82 = twoF(.8, 30, 30, 0);
ok('C 80/20 方差 612', Math.round(w82 * w82) === 612); ok('C 80/20 → 24.74', r2(w82) === '24.74');
ok('C 降了 5 个多百分点', 30 - w82 > 5 && 30 - w82 < 6);
inL('0.64 × 900 + 0.04 × 900 = 612，波动率约 24.74%'); inL('降了 5 个多百分点');
ok('C 小题 2 答案 C', /【小题 2】[\s\S]*?\*\*答案：\*\* C。/.test(lesson)); inL('组合方差 = 225 + 225 + 0 = 450，开平方约 21.21%');

// ===== D 组：N 只股票（第 5–7 节、图 3、小题 3） =====
const nF = (N, rho, s) => Math.sqrt((s * s) * (1 / N + (1 - 1 / N) * rho));
// 方法二：协方差矩阵逐项求和（等权重 1/N）
function nSum(N, rho, s) {
  let v = 0; const w = 1 / N;
  for (let i = 0; i < N; i++) for (let j = 0; j < N; j++) v += w * w * (i === j ? s * s : rho * s * s);
  return Math.sqrt(v);
}
const Ns = [1, 2, 5, 10, 20, 50, 100];
const tab = {
  0.1: ['30.00', '22.25', '15.87', '13.08', '11.42', '10.31', '9.90', '9.49'],
  0.2: ['30.00', '23.24', '18.00', '15.87', '14.70', '13.94', '13.68', '13.42'],
  0.4: ['30.00', '25.10', '21.63', '20.35', '19.67', '19.26', '19.12', '18.97'],
};
for (const rho of [0.1, 0.2, 0.4]) {
  Ns.forEach((N, i) => {
    const a = nF(N, rho, 30), b = nSum(N, rho, 30);
    near('D 两法一致 ρ=' + rho + ' N=' + N, a, b, 1e-9);
    ok('D ρ=' + rho + ' N=' + N + ' → ' + tab[rho][i], r2(a) === tab[rho][i], r2(a));
  });
  const fl = 30 * Math.sqrt(rho);
  ok('D 下限 ρ=' + rho, r2(fl) === tab[rho][7]);
  near('D N→∞ 趋于下限 ρ=' + rho, nF(1e9, rho, 30), fl, 1e-6);
  inF('| ' + rho + ' | ' + tab[rho].map(x => x + '%').join(' | ') + ' |');
}
inL('| 组合波动率（相关系数 0.2） | ' + tab[0.2].slice(0, 7).map(x => x + '%').join(' | ') + ' |');
inL('下限是 30% × √0.2，约 13.42%'); inL('0.1 时 9.49%，0.2 时 13.42%，0.4 时 18.97%');
ok('D 1→10 只差不多降一半', Math.abs(nF(10, .2, 30) / 30 - 0.5) < 0.05); inL('从 1 只到 10 只，波动率差不多降了一半');
ok('D 10→100 只约降 2 个百分点', Math.abs(nF(10, .2, 30) - nF(100, .2, 30) - 2.19) < 0.01); inL('只再降了约 2 个百分点');
ok('D ρ=0 时 100 只 3%', r2(nF(100, 0, 30)) === '3.00'); inL('30% ÷ √100 = 3%');
// 方差分解
ok('D 共同 180、自己 720', 0.2 * 900 === 180 && Math.round(0.8 * 900) === 720); inL('900 的方差，180 是共同的，720 是自己的');
ok('D 共同 13.42、自己 26.83', r2(Math.sqrt(180)) === '13.42' && r2(Math.sqrt(720)) === '26.83');
ok('D 标准差不能相加', Math.abs(Math.sqrt(180) + Math.sqrt(720) - 30) > 1); inL('共同部分的标准差约 13.42%，自己部分的约 26.83%');
const v100 = nF(100, .2, 30) ** 2;
ok('D 100 只方差约 187、自己约 7', Math.round(v100) === 187 && Math.round(720 / 100) === 7 && Math.abs(v100 - (180 + 7.2)) < 1e-9);
inL('组合方差约 187，其中自己的部分只剩 7 左右，共同的部分还是 180');
// 图 3 方差柱两段
const own = Ns.map(N => +(720 / N).toFixed(1));
ok('D 自己的部分 720/360/144/72/36/14.4/7.2', own.join(',') === '720,360,144,72,36,14.4,7.2');
inF('自己的部分 N=1 时 720、2 时 360、5 时 144、10 时 72、20 时 36、50 时 14.4、100 时 7.2');
// 小题 3
const qa = nF(20, .6, 30), qb = nF(5, .2, 30);
ok('D 小题3 甲方差 558', Math.round(qa * qa) === 558); ok('D 小题3 甲 23.62', r2(qa) === '23.62');
ok('D 小题3 乙方差 324', Math.round(qb * qb) === 324); ok('D 小题3 乙 18.00', r2(qb) === '18.00');
ok('D 小题3 甲下限 23.24', r2(30 * Math.sqrt(.6)) === '23.24');
ok('D 小题3 答案 B', /【小题 3】[\s\S]*?\*\*答案：\*\* B。/.test(lesson));
inL('900 ×（1 ÷ 20 + 0.95 × 0.6）= 558，波动率约 23.62%'); inL('900 ×（1 ÷ 5 + 0.8 × 0.2）= 324，约 18.00%'); inL('约 23.24%');
// 第 6 节：离下限不到 1 个百分点所需只数
function need(rho) { const t = 30 * Math.sqrt(rho) + 1; let N = 1; while (nF(N, rho, 30) >= t) N++; return N; }
ok('D ρ=0.2 要 26 只', need(.2) === 26, need(.2)); ok('D ρ=0.1 要 41 只', need(.1) === 41, need(.1));
inL('相关系数 0.2 时，要 26 只'); inL('却要 41 只才能贴近它');
// 第 7 节：下限 0.2 → 0.4
const up = 30 * Math.sqrt(.4) / (30 * Math.sqrt(.2)) - 1;
ok('D 下限高出约 41%', Math.round(up * 100) === 41, (up * 100).toFixed(2));
inL('下限就从约 13.42% 升到约 18.97%，高出约 41%');

// ===== G 组：Boyer、Gibson 与 Loretan 的测量陷阱（第 7 节、图 4） =====
const phi = z => Math.exp(-z * z / 2) / Math.sqrt(2 * Math.PI);
function Phi(z) { // 数值积分（Simpson），不用近似公式
  if (z < 0) return 1 - Phi(-z);
  const n = 20000, h = z / n; let s = phi(0) + phi(z);
  for (let i = 1; i < n; i++) s += (i % 2 ? 4 : 2) * phi(i * h);
  return 0.5 + s * h / 3;
}
let lo = 0, hi = 5; for (let i = 0; i < 80; i++) { const mid = (lo + hi) / 2; if (1 - Phi(mid) > 0.05) lo = mid; else hi = mid; }
const z = (lo + hi) / 2;
ok('G 两侧 10% 的临界值 1.6449', z.toFixed(4) === '1.6449', z);
// 方法一：截断正态方差的闭式
const vTail = 1 + z * phi(z) / 0.05;
const vMid = 1 - 2 * z * phi(z) / 0.9;
// 方法二：直接数值积分 E[x²| A]
function integ(f, a, b, n) { n = n || 200000; const h = (b - a) / n; let s = f(a) + f(b); for (let i = 1; i < n; i++) s += (i % 2 ? 4 : 2) * f(a + i * h); return s * h / 3; }
const vTail2 = 2 * integ(x => x * x * phi(x), z, 12) / 0.1;
const vMid2 = integ(x => x * x * phi(x), -z, z) / 0.9;
near('G 尾部条件方差两法一致', vTail, vTail2, 1e-6); near('G 中部条件方差两法一致', vMid, vMid2, 1e-6);
ok('G 尾部条件方差 4.393', vTail.toFixed(3) === '4.393', vTail); ok('G 中部条件方差 0.623', vMid.toFixed(3) === '0.623', vMid);
const condRho = (rho, ratio) => rho / Math.sqrt(rho * rho + (1 - rho * rho) / ratio);
const rT = condRho(.5, vTail), rM = condRho(.5, vMid);
ok('G 尾部 0.771', r3(rT) === '0.771', rT); ok('G 其余 0.415', r3(rM) === '0.415', rM);
ok('G 分样本不改变符号、尾部高于整体高于中部', rT > .5 && .5 > rM && rM > 0);
inL('资产甲涨跌最大的 10% 的日子，0.771；其余 90% 的日子，0.415；全部日子，0.5');
inF('条件方差 4.393，算出的相关系数 0.771'); inF('条件方差 0.623，算出的相关系数 0.415'); inF('|z| > 1.6449');

// ===== F 组：论文与官方文件里的数字（来自原文，不重算；断言课文写法与来源登记一致） =====
inL('1990 年 12 月 7 日');
inL('至少需要十几只精心挑选的个股'); inL('只买四五只股票谈不上分散');
inL('借钱投资的人至少要 30 只，把钱借出的人至少要 40 只'); inL('「组合有 10 只左右，分散的好处就几乎用尽」');
inL('才能把它降到约 10%'); inL('在 1963 年到 1985 年的数据里，20 只就够了'); inL('在 1986 年到 1997 年的数据里，要 50 只');
inL('从 1960 年代初的不到 30%，升到 1997 年的接近 50%');
inL('在 1990 年代末约占 95%，在他们最新的数据里约占 80%');
inL('2008 年到 2009 年的金融危机和 2020 年到 2021 年的新冠疫情');
inL('1963 年 7 月到 1998 年 12 月'); inL('相关性平均约为 87.6%'); inL('应当只有约 76%');
inL('1997 年东亚危机、1994 年墨西哥比索危机和 1987 年美国股市崩盘');
inL('全市场指数基金持有几千家公司的股票');
ok('F 87.6 − 76 ≈ 11.6 个百分点（与 R08 第 464 页一致）', Math.abs(87.6 - 76 - 11.6) < 1e-9);
// 模型参数与 CLMX 2022 的量级比较：模型中自己的部分占 80%
ok('F 模型自己的部分占 80%', Math.abs(720 / 900 - 0.8) < 1e-12); inL('相当于每只股票方差里有 20% 来自共同部分，80% 来自自己的部分');

// ===== H 组：禁用内容、图方案一致性、结尾问题 =====
const body = lesson.split('\n').slice(lesson.split('\n').findIndex(l => /^---\s*$/.test(l)) + 1).join('\n');
ok('H 正文无核验标记与开发痕迹', !/[☐◐✔]|TODO|待 ?PO|待核|待定|占位|北岭银行|轧空|盘口|扫货|吃单/.test(body));
ok('H 正文不出现 beta、CAPM、因子', !/beta|贝塔|CAPM|资本资产定价|因子/i.test(body));
ok('H 课文图 1–4 都在图方案里', [1, 2, 3, 4].every(n => lesson.includes('【图 ' + n + '】') && figs.includes('图 ' + n)));
ok('H 图方案不含指数数据', !/标普|S&P 500|纳斯达克指数|MSCI|罗素|道琼斯/.test(figs));
ok('H 结尾问题', body.includes('分散不掉的那部分风险，市场会不会为它付钱？'));
ok('H 三道小题', (body.match(/【小题 \d】/g) || []).length === 3);

console.log('通过 ' + pass + '，失败 ' + fail);
if (fail) process.exit(1);
