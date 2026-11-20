// S05-04 数值核验（研究阶段）：node "S05-04 数值核验（研究阶段）.js"
// 用逐节点解两元一次方程（股数 Δ、现金 B）独立算出研究简报第 8 节的全部数字。不读课文，不依赖网络。
'use strict';
const S0 = 50, u = 1.2, d = 0.8, R = 1.01, K = 50;
let pass = 0, fail = 0;
const near = (n, x, y, t = 5e-5) => { if (Math.abs(x - y) <= t) pass++; else { fail++; console.log('失败 ' + n + '：' + x + ' vs ' + y); } };
// 在股价 s 处，用 Δ 股与现金 B 复制下一期的 Vu、Vd
function rep(s, Vu, Vd) {
  const D = (Vu - Vd) / (s * u - s * d);
  const B = (Vd - D * s * d) / R;
  return { D, B, V: D * s + B };
}
const call = s => Math.max(s - K, 0), put = s => Math.max(K - s, 0);
// 一期
const c1 = rep(S0, call(60), call(40)), p1 = rep(S0, put(60), put(40));
near('看涨 Δ', c1.D, 0.5); near('借款', -c1.B, 19.80198); near('看涨价', c1.V, 5.19802);
near('看跌 Δ', p1.D, -0.5); near('存款', p1.B, 29.70297); near('看跌价', p1.V, 4.70297);
near('平价自检', c1.V - p1.V, S0 - K / R);
near('$6 套利', 6 - c1.V, 0.80198); near('$4.50 套利', c1.V - 4.5, 0.69802); near('$5.50 套利', 5.5 - c1.V, 0.30198);
near('$55/$45', 25 - 22.5 / R, 2.72277);
// 两期
const cu = rep(60, call(72), call(48)), cd = rep(40, call(48), call(32)), c0 = rep(S0, cu.V, cd.V);
const pu = rep(60, put(72), put(48)), pd = rep(40, put(48), put(32)), p0 = rep(S0, pu.V, pd.V);
near('Δu 看涨', cu.D, 0.91667); near('Δd 看涨', cd.D, 0); near('Δ0 看涨', c0.D, 0.57178);
near('Δu 看跌', pu.D, -0.08333); near('Δd 看跌', pd.D, -1); near('Δ0 看跌', p0.D, -0.42822);
near('Cu', cu.V, 11.43564); near('Pu', pu.V, 0.94059); near('Pd', pd.V, 9.50495);
for (const [a, b, n] of [[cu, pu, 'u'], [cd, pd, 'd'], [c0, p0, '0']]) near('Δ 差为 1（' + n + '）', a.D - b.D, 1);
// 静态不调整
const owe = -c0.B * R * R;
near('静态 $72', c0.D * 72 - owe, 18.06832, 1e-4); near('静态 $48', c0.D * 48 - owe, 4.34560, 1e-4); near('静态 $32', c0.D * 32 - owe, -4.80292, 1e-4);
// 合成保护性看跌
near('$40 节点全现金', 40 + pd.V, 50 / R); near('起点股数', 1 + p0.D, 0.57178);
// 跳空
const jump = (1 + p0.D) * 32 + p0.B * R;
if (jump < 50 / R) pass++; else { fail++; console.log('失败 跳空未破底'); }
console.log('跳空后价值', jump.toFixed(4), '对照', (50 / R).toFixed(4));
console.log('通过 ' + pass + '，失败 ' + fail);
if (fail) process.exit(1);
