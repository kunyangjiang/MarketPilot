// S05-04 数值核验：node "S05-04 数值核验.js"
// 读取《S05-04 课文 v1 候选.md》与《S05-04 图与交互方案 v1 候选.md》，重算课文与图里的每个关键数字，
// 并断言这些数字确实出现在文件里。每组数字用两种互不依赖的算法得到：
//   甲法：在每个节点解「Δ 股 + 现金 B」的两元一次方程（复制法）；
//   乙法：用 p = (R − d) ÷ (u − d) 加权回推（只在脚本里自检，课文不出现）。
// 对冲与合成的交易再逐条路径结算，确认现金流两清。不依赖网络，不依赖 scratchpad。
'use strict';
const fs = require('fs');
const path = require('path');
const dir = __dirname;
const lesson = fs.readFileSync(path.join(dir, 'S05-04 课文 v1 候选.md'), 'utf8').replace(/\r/g, '');
const figs = fs.readFileSync(path.join(dir, 'S05-04 图与交互方案 v1 候选.md'), 'utf8').replace(/\r/g, '');
const body = lesson.split('\n').slice(lesson.split('\n').findIndex(l => /^---\s*$/.test(l)) + 1).join('\n');

let pass = 0, fail = 0;
function ok(name, cond, note) { if (cond) pass++; else { fail++; console.log('失败 ' + name + (note ? '：' + note : '')); } }
function near(name, x, y, tol) { ok(name, Math.abs(x - y) <= (tol === undefined ? 1e-9 : tol), x + ' vs ' + y); }
function inL(s) { ok('课文含「' + s + '」', lesson.includes(s)); }
function inF(s) { ok('图方案含「' + s + '」', figs.includes(s)); }
const f2 = x => (Math.round(x * 100 + 1e-9) / 100).toFixed(2);
const f1 = x => (Math.round(x * 10 + 1e-9) / 10).toFixed(1);

// ---------- 模型参数（课文第 0、2 部分写明的假设） ----------
const S0 = 50, u = 1.2, d = 0.8, R = 1.01, K = 50;
const call = s => Math.max(s - K, 0), put = s => Math.max(K - s, 0);
inL('股价涨到 $60'); inL('跌到 $40'); inL('三个月的利率是 1%'); inL('今天借 $100，三个月后还 $101');
inL('涨 20% 或跌 20%'); inL('利率每三个月仍是 1%');

// 甲法：复制
function rep(s, Vu, Vd) { const D = (Vu - Vd) / (s * u - s * d); const B = (Vd - D * s * d) / R; return { D, B, V: D * s + B }; }
// 乙法：加权回推
const p = (R - d) / (u - d);
const back = (Vu, Vd) => (p * Vu + (1 - p) * Vd) / R;
near('p 自检 0.525', p, 0.525, 1e-12);

// ===== A 组：一期复制（第 1 部分、图 1、小题 1、2） =====
const c1 = rep(S0, call(60), call(40)), p1 = rep(S0, put(60), put(40));
near('A 看涨 Δ = 0.5', c1.D, 0.5); near('A 两法一致：看涨', c1.V, back(10, 0));
near('A 看跌 Δ = −0.5', p1.D, -0.5); near('A 两法一致：看跌', p1.V, back(0, 10));
ok('A 借款 19.80', f2(-c1.B) === '19.80'); ok('A 看涨 5.20', f2(c1.V) === '5.20'); ok('A 看涨 5.198', c1.V.toFixed(3) === '5.198');
ok('A 存款 29.70', f2(p1.B) === '29.70'); ok('A 看跌 4.70', f2(p1.V) === '4.70');
near('A 复制表：$60 时 30 − 20 = 10', 0.5 * 60 - 20, call(60)); near('A 复制表：$40 时 20 − 20 = 0', 0.5 * 40 - 20, call(40));
near('A 看跌复制：$60 时 −30 + 30 = 0', -0.5 * 60 + 30, put(60)); near('A 看跌复制：$40 时 −20 + 30 = 10', -0.5 * 40 + 30, put(40));
inL('$20 ÷ 1.01 ≈ $19.80'); inL('$25 − $19.80 = $5.20'); inL('约 $5.198'); inL('(10 − 0) ÷ (60 − 40) = 0.5');
inL('| 股价 $60 | $30 | −$20 | $10 | $10 |'); inL('| 股价 $40 | $20 | −$20 | $0 | $0 |');
inL('$30 ÷ 1.01 ≈ $29.70'); inL('净成本约 $4.70'); inL('(0 − 10) ÷ (60 − 40) = −0.5');
// 套利三例
ok('A $6 → 0.80', f2(6 - c1.V) === '0.80'); inL('今天多出的 $0.80');
ok('A $4.50 → 0.70', f2(25 - 19.80 - 4.5) === '0.70' && f2(c1.V - 4.5) === '0.70'); inL('$25 − $19.80 − $4.50 = $0.70');
// 反向套利逐结果两清：买期权、卖空半股、借出 19.80（到期收回 20）
for (const s of [60, 40]) near('A 反向套利到期两清 ' + s, call(s) - 0.5 * s + (-c1.B) * R, 0, 1e-9);
ok('A 小题 1：$5.50 → 0.30', f2(5.5 - c1.V) === '0.30'); inL('今天留下 $0.30'); inL('在股价 $60 时会亏 $10');
// 概率无关
for (const q of [0.1, 0.3, 0.5, 0.9]) near('A 概率 ' + q + ' 不改变复制成本', rep(S0, 10, 0).V, c1.V);
near('A 九成 → $9', 0.9 * 10, 9); near('A 三成 → $3', 0.3 * 10, 3); ok('A 稳赚 3.80', f2(9 - c1.V) === '3.80');
inL('0.9 × $10 = $9'); inL('0.3 × $10 = $3'); inL('稳赚 $3.80');
inF('90% 时 $9'); inF('30% 时 $3'); inF('复制成本都是 $5.20'); inF('$25 − $19.80 = $5.20');
// 幅度起作用
const c55 = (() => { const D = (5 - 0) / (55 - 45); return D * 50 - (D * 45 - 0) / R; })();
ok('A $55/$45 → 2.72', f2(c55) === '2.72'); near('A $55/$45 两法一致', c55, (((R - 0.9) / 0.2) * 5) / R); inL('约 $2.72');
ok('A 平价自检（不进课文）', Math.abs(c1.V - p1.V - (S0 - K / R)) < 1e-12);

// ===== B 组：两期树 delta（第 2 部分、图 2） =====
const cu = rep(60, call(72), call(48)), cd = rep(40, call(48), call(32)), c0 = rep(S0, cu.V, cd.V);
const pu = rep(60, put(72), put(48)), pd = rep(40, put(48), put(32)), p0 = rep(S0, pu.V, pd.V);
ok('B 股价 72/48/32', [S0 * u * u, S0 * u * d, S0 * d * d].map(x => x.toFixed(6)).join() === '72.000000,48.000000,32.000000');
near('B 两法：Cu', cu.V, back(22, 0)); near('B 两法：Pd', pd.V, back(2, 18)); near('B 两法：C0', c0.V, back(back(22, 0), back(0, 0)));
ok('B Δu 0.92 = 22/24', f2(cu.D) === '0.92' && cu.D === 22 / 24); ok('B Δd 0', cd.D === 0); ok('B Δ0 0.57', f2(c0.D) === '0.57');
ok('B 看跌 Δu −0.08', f2(pu.D) === '-0.08'); ok('B 看跌 Δd −1', pd.D === -1); ok('B 看跌 Δ0 −0.43', f2(p0.D) === '-0.43');
for (const [a, b, n] of [[cu, pu, 'u'], [cd, pd, 'd'], [c0, p0, '0']]) near('B 每节点看涨 Δ − 看跌 Δ = 1（' + n + '）', a.D - b.D, 1, 1e-12);
ok('B delta 随股价上升（看涨）', cd.D < c0.D && c0.D < cu.D); ok('B delta 随股价上升（看跌）', pd.D < p0.D && p0.D < pu.D);
inL('$72（涨两次）、$48（一涨一跌，不论先后）、$32（跌两次）'); inL('分别值 $22 和 $0'); inL('delta = 22 ÷ 24 ≈ 0.92');
inL('delta = 0'); inL('只给结果：约 0.57'); inL('起点约 −0.43，涨到 $60 后约 −0.08'); inL('跌到 $40 后是 −1');
inF('$72 / $48 / $32'); inF('$22 / $0 / $0'); inF('0.92（$22 ÷ $24）'); inF('−0.43、−0.08、−1'); inF('约 0.57');
// 不调整的偏差（静态组合）
const owe2 = -c0.B * R * R;
const st = s => c0.D * s - owe2;
ok('B 静态 $72 → 18.07', f2(st(72)) === '18.07'); ok('B 静态 $72 少 3.93', f2(22 - st(72)) === '3.93');
ok('B 静态 $48 → 4.35', f2(st(48)) === '4.35'); ok('B 静态 $32 → −4.80', f2(st(32)) === '-4.80');
inL('组合只值约 $18.07，少了约 $3.93'); inL('组合却还值约 $4.35'); inL('倒欠约 $4.80');
// 自融资：节点上旧组合价值 = 新组合成本（甲、乙两法）
for (const [s, node] of [[60, cu], [40, cd]]) near('B 自融资 ' + s, c0.D * s + c0.B * R, node.V, 1e-9);
for (const [s, node] of [[60, pu], [40, pd]]) near('B 自融资（看跌）' + s, p0.D * s + p0.B * R, node.V, 1e-9);
// 课文不出现两期期权价格
for (const v of [c0.V, p0.V, cu.V, pu.V, pd.V]) ok('B 两期价格不进课文 ' + f2(v), !body.includes('$' + f2(v)) && !figs.includes('$' + f2(v)));

// ===== C 组：对冲方向（第 3 部分、小题 3、图 3） =====
const sh = x => f1(100 * x); // 每张合约 100 股
ok('C 57.2', sh(c0.D) === '57.2'); ok('C 91.7', sh(cu.D) === '91.7'); ok('C 34.5', sh(cu.D - c0.D) === '34.5');
ok('C 42.8', sh(-p0.D) === '42.8'); ok('C 8.3', sh(-pu.D) === '8.3'); ok('C 看跌上涨 34.5', sh(pu.D - p0.D) === '34.5');
ok('C 看跌下跌 57.2', sh(p0.D - pd.D) === '57.2');
ok('C 一位小数相减一致', (91.7 - 57.2).toFixed(1) === '34.5' && (42.8 - 8.3).toFixed(1) === '34.5' && (100 - 42.8).toFixed(1) === '57.2');
// 多头对冲（持期权、卖空 Δ）：上涨卖、下跌买；空头对冲：相反
const longHedgeTrade = (D0, D1) => -(D1 - D0); // 正 = 买入股票
ok('C 看涨多头上涨卖出', longHedgeTrade(c0.D, cu.D) < 0); ok('C 看涨多头下跌买入', longHedgeTrade(c0.D, cd.D) > 0);
ok('C 看涨空头上涨买入', -longHedgeTrade(c0.D, cu.D) > 0); ok('C 看涨空头下跌卖出', -longHedgeTrade(c0.D, cd.D) < 0);
ok('C 看跌多头上涨卖出', longHedgeTrade(p0.D, pu.D) < 0); ok('C 看跌多头下跌买入', longHedgeTrade(p0.D, pd.D) > 0);
inL('他要把卖空加到 91.7 股，也就是再**卖出** 34.5 股'); inL('要把 57.2 股全部**买回**'); inL('于是**买入** 34.5 股');
inL('于是**卖出**全部 57.2 股'); inL('起点持有 42.8 股'); inL('只需持有 8.3 股，卖出 34.5 股'); inL('要持有 100 股，买入 57.2 股');
inL('看涨从 0 到 0.57 再到 0.92，看跌从 −1 到 −0.43 再到 −0.08');
inL('买入约 34.5 股'); inL('相当于持有 42.8 股'); inL('只需卖空 8.3 股，于是买回 34.5 股');
// 卖方：收下权利金、按复制组合对冲，四条路径逐一结算为 0
function writerPath(path, Vfn) {
  const n0 = rep(S0, ...(Vfn === call ? [cu.V, cd.V] : [pu.V, pd.V]));
  let cash = n0.V - n0.D * S0; let shares = n0.D; let s = S0; // 收权利金 = n0.V，买 Δ 股
  for (let i = 0; i < 2; i++) {
    cash *= R; s = path[i] === 'u' ? s * u : s * d;
    if (i === 0) { const nn = rep(s, Vfn(s * u), Vfn(s * d)); cash -= (nn.D - shares) * s; shares = nn.D; }
  }
  return cash + shares * s - Vfn(s);
}
for (const pth of ['uu', 'ud', 'du', 'dd']) { near('C 卖看涨对冲两清 ' + pth, writerPath(pth, call), 0, 1e-9); near('C 卖看跌对冲两清 ' + pth, writerPath(pth, put), 0, 1e-9); }
inL('这笔权利金正好够支付这套对冲从头到尾的净成本');

// ===== D 组：三行表与合成保护性看跌（第 4 部分、图 3） =====
const syn0 = 1 + p0.D, synU = 1 + pu.D, synD = 1 + pd.D;
ok('D 合成起点 0.57 股', f2(syn0) === '0.57' && sh(syn0) === '57.2'); ok('D 跌到 $40 后 0 股', synD === 0);
ok('D 合成上涨 91.7', sh(synU) === '91.7'); ok('D 合成上涨买入 34.5', sh(synU - syn0) === '34.5');
near('D 合成者交易 = 卖看跌对冲者交易（下跌）', synD - syn0, pd.D - p0.D, 1e-12);
near('D 合成者交易 = 卖看跌对冲者交易（上涨）', synU - syn0, pu.D - p0.D, 1e-12);
near('D 买卖双方对冲相抵（下跌）', (p0.D - pd.D) + (pd.D - p0.D), 0, 1e-12);
ok('D $40 节点全现金 49.50 保住 50', f2(40 + pd.V) === '49.50' && Math.abs((40 + pd.V) * R - 50) < 1e-9);
for (const s of [48, 32]) near('D $40 出发到期正好 $50（' + s + '）', s + put(s), 50, 1e-12);
inL('卖空 0.43 股'); inL('合计持有约 0.57 股');
inL('| 持有看跌期权，并做 delta 对冲 | 抵消手中看跌期权的敏感度 | 持有 42.8 股 | 持有 100 股 | 买入 57.2 股 |');
inL('| 卖出看跌期权，并做 delta 对冲 | 抵消卖出的看跌期权的敏感度 | 卖空 42.8 股 | 卖空 100 股 | 卖出 57.2 股 |');
inL('| 制造一份看跌期权多头 | 持有 57.2 股，其余现金 | 0 股，全部现金 | 卖出 57.2 股 |');
inL('$50 ÷ 1.01 ≈ $49.50');
inL('下跌时依次是买入 57.2 股、卖出 57.2 股、卖出 57.2 股；上涨时依次是卖出 34.5 股、买入 34.5 股、买入 34.5 股');
inF('42.8 → 100 股，买入 57.2 股'); inF('卖空 42.8 → 100 股，卖出 57.2 股'); inF('57.2 → 0 股，卖出 57.2 股');
inF('42.8 → 8.3 股，卖出 34.5 股'); inF('卖空 42.8 → 8.3 股，买入 34.5 股'); inF('57.2 → 91.7 股，买入 34.5 股');
inF('卖空 57.2 → 91.7 股，卖出 34.5 股'); inF('57.2 → 91.7 股，买入 34.5 股');

// ===== E 组：假设失效（结尾、小题 4） =====
// 三种结果：0.5 股 − 借款在 $50 时 = 5 ≠ 0
near('E $50 时组合 $5', 0.5 * 50 - 20, 5); ok('E 期权 $0', call(50) === 0); inL('组合值 $25 − $20 = $5');
// 三种结果下一般无解：用 $60 与 $40 解出的 Δ、B 必然在 $50 处给出 5
const D3 = (10 - 0) / 20, B3 = (0 - D3 * 40); ok('E 三方程无解', Math.abs(D3 * 50 + B3 - 0) > 1);
// 跳空：合成者在 $50 处持 0.5718 股 + 现金，股价跳到 $32 后低于保底现值
const cash0 = p0.B; // 合成保护性看跌 = 1 股 + 复制看跌（Δ0 股 + 现金 B）
const jumpV = syn0 * 32 + cash0 * R;
ok('E 跳到 $32 时保底被击穿', jumpV < 50 / R, jumpV.toFixed(4)); inL('他手里还拿着 57.2 股，保险的底就破了');

// ===== H 组：禁用内容、术语顺序、范围 =====
ok('H 正文无核验标记与开发痕迹', !/[☐◐✔]|TODO|待 ?PO|待核|待定|占位|北岭银行|轧空|盘口|扫货|吃单/.test(body));
ok('H 不出现 Black–Scholes', !/Black|Scholes|布莱克|斯科尔斯/i.test(body));
ok('H 不出现风险中性', !/风险中性/.test(body));
ok('H 方向讲清之后才出现 gamma', body.indexOf('gamma') > body.indexOf('他的对冲交易与价格走势同向'));
ok('H gamma 为正 / 为负 都出现', body.includes('**gamma 为正**') && body.includes('**gamma 为负**'));
ok('H 明说一期推不出', body.includes('一期模型推不出'));
ok('H 否定笼统说法', body.includes('「期权卖方追涨杀跌」「做市商追涨杀跌」这类笼统的说法站不住'));
ok('H 1987 只出现在结尾与要点', (body.match(/1987/g) || []).length === 2);
ok('H 不写 Brady 报告的道指数字', !/508|22\.6/.test(body));
ok('H 课文图 1–3 都在图方案里', [1, 2, 3].every(n => lesson.includes('【图 ' + n + '】') && figs.includes('图 ' + n)));
ok('H 四道小题', (body.match(/【小题 \d】/g) || []).length === 4);
ok('H 图方案写明不自动播放', figs.includes('绝不自动播放'));

console.log('通过 ' + pass + '，失败 ' + fail);
if (fail) process.exit(1);
