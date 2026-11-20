// S03-01 数值核验（研究阶段）· 2026-11-19 · 内部文件
// 运行：node "S03-01 数值核验（研究阶段）.js"
// 单位：金额为美元；"亿" = 1e8，"万" = 1e4。
// 沿用的已上线数字：北岭电池 1,000 万股（S02-01 课文第 34 行）；小林 600 股、成本 $30,017（S02-02 课文第 12、14 行；S02-04 课文第 159 行）。
// 其余数字全部是本课新增的教学假设：每股 $50、债务 3 亿、公司价值 8 亿、现金 1 亿、分红 / 回购 5,000 万、增发 100 万股、激励 50 万股。
// 模型假设：一期、无税、无交易成本、无信息效应；"每股价值" = 股东权益价值 ÷ 已发行股数（模型值，不是市场价格）。

const assert = require('assert');
const Y = 1e8, W = 1e4;
const close = (a, b, tol = 1e-6) => Math.abs(a - b) < tol;

const N0 = 1000 * W;         // 已发行股数
const D = 3 * Y;             // 债务面值（假设，清算日到期）
const V0 = 8 * Y;            // 公司全部资产的价值（假设）
const XL = 600;              // 小林持股
const XL_COST = 30017;       // 小林买入总成本（S02-02）

const out = [];
const log = (...a) => { console.log(...a); out.push(a.join(' ')); };

// ---------- A. 清算思想实验：公司价值在债权人与股东之间的分配 ----------
const equity = V => Math.max(V - D, 0);
const debtGets = V => Math.min(V, D);
log('A. 清算分配（债务 3 亿，1,000 万股）');
log('V(亿) | 债权人(亿) | 债权人收回率 | 股东合计(亿) | 每股($) | 小林600股($)');
const scen = [12, 8, 4, 3, 2, 0];
const expectA = { 12: [3, 9, 90], 8: [3, 5, 50], 4: [3, 1, 10], 3: [3, 0, 0], 2: [2, 0, 0], 0: [0, 0, 0] };
for (const v of scen) {
  const V = v * Y, d = debtGets(V), e = equity(V), ps = e / N0;
  log(`${v} | ${d / Y} | ${(D ? d / D * 100 : 0).toFixed(1)}% | ${e / Y} | ${ps.toFixed(2)} | ${(ps * XL).toFixed(2)}`);
  assert(close(d + e, V));                        // 守恒：两者之和 = 公司价值
  assert(e >= 0);                                 // 有限责任：股东所得不为负
  assert.deepStrictEqual([d / Y, e / Y, ps], expectA[v]);
}
// 有限责任：小林最大损失 = 买入成本
log(`小林最大损失 = 买入成本 $${XL_COST}（V≤3亿时 600 股价值为 0，不需另行出资）`);
// 对照：若股东须对公司债务承担无限责任（反事实），V=2 亿时股东须补 1 亿，按持股分摊到小林：
const shortfall = D - 2 * Y;
log(`反事实（无限责任、按持股比例分摊）：V=2亿 时缺口 ${shortfall / Y} 亿，小林分摊 $${(shortfall * XL / N0).toFixed(2)}`);
assert(close(shortfall * XL / N0, 6000));

// ---------- B. 分红 ----------
const DIV = 0.5 * Y;           // 分红总额 5,000 万
const E0 = equity(V0);         // 5 亿
const P0 = E0 / N0;            // $50
assert(close(P0, 50));
const V_div = V0 - DIV, E_div = equity(V_div), P_div = E_div / N0, dps = DIV / N0;
log('\nB. 分红 5,000 万');
log(`每股分红 $${dps}；分红后每股价值 $${P_div}；小林：股票 $${P_div * XL} + 现金 $${dps * XL} = $${P_div * XL + dps * XL}`);
assert(close(dps, 5)); assert(close(P_div, 45)); assert(close(P_div * XL + dps * XL, 30000));
log(`资产对债务的覆盖：分红前 ${(V0 / D).toFixed(4)} 倍，分红后 ${(V_div / D).toFixed(4)} 倍`);
assert(close(V0 / D, 8 / 3)); assert(close(V_div / D, 2.5));

// ---------- C. 回购（同样 5,000 万） ----------
function buyback(price, amount = DIV) {
  const bought = amount / price, N1 = N0 - bought, E1 = equity(V0 - amount), P1 = E1 / N1;
  return { bought, N1, E1, P1 };
}
log('\nC. 回购 5,000 万');
for (const price of [50, 62.5, 40]) {
  const r = buyback(price);
  log(`回购价 $${price}：买回 ${r.bought / W} 万股，剩 ${r.N1 / W} 万股，每股价值 $${r.P1.toFixed(4)}，小林 600 股 $${(r.P1 * XL).toFixed(2)}，持股比例 ${(XL / r.N1 * 100).toFixed(6)}%`);
}
const fair = buyback(50);
assert(close(fair.bought, 100 * W)); assert(close(fair.N1, 900 * W)); assert(close(fair.P1, 50));
assert(close(XL / N0 * 100, 0.006)); assert(close(XL / fair.N1 * 100, 0.006666666667, 1e-9));
const hi = buyback(62.5); assert(close(hi.bought, 80 * W)); assert(close(hi.P1, 4.5 * Y / (920 * W)));
const lo = buyback(40); assert(close(lo.bought, 125 * W)); assert(close(lo.P1, 4.5 * Y / (875 * W)));
// 自制分红：小林按比例（10%）卖 60 股给公司
const sold = XL * (fair.bought / N0);           // 60 股
log(`自制分红：小林按比例卖出 ${sold} 股得 $${sold * 50}，剩 ${XL - sold} 股值 $${(XL - sold) * fair.P1}，合计 $${sold * 50 + (XL - sold) * fair.P1}；持股比例 ${((XL - sold) / fair.N1 * 100).toFixed(6)}%`);
assert(close(sold, 60)); assert(close(sold * 50 + (XL - sold) * fair.P1, 30000));
assert(close((XL - sold) / fair.N1, XL / N0));   // 比例与回购前相同
// 价值转移：高价回购时卖出者多得、留下者少得，总额相抵
const transferHi = hi.bought * (62.5 - 50);      // 卖出者相对回购前每股价值 $50 多得的部分
const lossStay = hi.N1 * (50 - hi.P1);           // 留下的股东每股损失 × 股数
log(`高价回购价值转移：卖出者多得 $${transferHi.toFixed(2)}，留下者少了 $${lossStay.toFixed(2)}`);
assert(close(transferHi, lossStay, 1e-3));

// ---------- D. 稀释 ----------
log('\nD. 稀释');
function issue(newShares, price) {
  const V1 = V0 + newShares * price, E1 = equity(V1), N1 = N0 + newShares;
  return { V1, E1, N1, P1: E1 / N1 };
}
const d1 = issue(100 * W, 50);
log(`D1 按 $50 增发 100 万股：筹资 ${100 * W * 50 / Y} 亿，每股 $${d1.P1}，小林比例 ${(XL / N0 * 100).toFixed(6)}% → ${(XL / d1.N1 * 100).toFixed(6)}%，小林价值 $${d1.P1 * XL}`);
assert(close(d1.P1, 50)); assert(close(d1.P1 * XL, 30000));
const d2 = issue(100 * W, 40);
const gainNew = 100 * W * (d2.P1 - 40), lossOld = N0 * (50 - d2.P1);
log(`D2 按 $40 增发 100 万股：每股 $${d2.P1.toFixed(4)}，小林 $${(d2.P1 * XL).toFixed(2)}；新股东得 $${gainNew.toFixed(2)}，老股东失 $${lossOld.toFixed(2)}`);
assert(close(d2.P1, 5.4 * Y / (1100 * W))); assert(close(gainNew, lossOld, 1e-3));
// D3 股权激励：发给员工 50 万股，不收现金；假设公司价值仍为 8 亿（员工服务的价值已含在 8 亿里、不因发股再增加）
const N3 = N0 + 50 * W, P3 = E0 / N3;
log(`D3 股权激励 50 万股（公司价值不变的假设下）：每股 $${P3.toFixed(4)}，小林 $${(P3 * XL).toFixed(2)}，比例 ${(XL / N3 * 100).toFixed(6)}%`);
assert(close(P3, 5 * Y / (1050 * W)));
// 对照：同样付给员工 2,500 万现金
const P3c = equity(V0 - 0.25 * Y) / N0;
log(`D3 对照：改付 2,500 万现金工资：每股 $${P3c}`);
assert(close(P3c, 47.5));

log('\n全部断言通过。');
