// S01-02 数值核验：课文、图和小题里用到的每一个数字。内部文件，不进入发布目录
// 运行（在 E:\MarketPilot 下）：node "lessons/S01-02/S01-02 数值核验.js"
// 银行（河岸银行、松石银行）与人物（小周、小林）均为虚构教学数据。
// 起点 = 《S01-01 课文 v1 候选》第 6 节的河岸银行简化资产负债表，以及《S01-01 数值核验.js》book() 里的松石银行。
// 金额一律用美元（整数）记账；课文里以「亿」显示的数字在这里换算后核对（1 亿 = 100,000,000）。
// 每个期望值都是手写的独立数字，不由被检验的公式生成。
// 第 3 轮（2026-11-18）：资本规则改为 eCFR 截至 2026-11-01 的现行文本；T5 经 PO 批准。
// 第 5 轮（2026-11-18）：8% 教学资本模型改为只有贷款按 100% 风险权重（PO 决定），B1–B5 重算。
// 第 6 轮（2026-11-18）：信用损失改为「补记信用损失费用（PCL）→ 损失准备（ACL）增加、贷款净额减少」，与随后的核销分开；数字不变，新增 B4c。
// 2026-11-18 与 S01-01 统一：北岭银行 → 河岸银行，南湾银行 → 松石银行；整体表由「准备金 50 / 证券 150 / 贷款 800 ‖ 存款 900 / 权益 100（百万）」
// 改为 S01-01 的「准备金 1.2 亿 / 金库现金 0.1 亿 / 证券 2.7 亿 / 贷款 6 亿 ‖ 存款 9 亿 / 权益 1 亿」。改动清单见《S01-02 课程简报与大纲》。
'use strict';
const assert = require('node:assert/strict');

const out = [];
function rec(id, label, value, expect) {
  assert.deepStrictEqual(value, expect, id + ' ' + label);
  out.push(id + '\t' + label + '\t' + JSON.stringify(value));
}
function near(id, label, value, expect, tol) {
  assert.ok(Math.abs(value - expect) <= tol, id + ' ' + label + ': ' + value + ' vs ' + expect);
  out.push(id + '\t' + label + '\t' + value + ' ≈ ' + expect);
}
const YI = 100000000; // 1 亿美元
const sum = o => Object.values(o).reduce((a, b) => a + b, 0);
const balanced = b => sum(b.a) === sum(b.l);
const pct2 = x => Math.round(x * 10000) / 100; // 百分比，保留两位小数

// ---------- 起点：S01-01 的两家银行（美元；股东权益放在负债一侧，保证两边相等） ----------
function start() {
  return {
    river: { a: { reserves: 120000000, vaultCash: 10000000, securities: 270000000, loans: 600000000 }, l: { deposits: 900000000, equity: 100000000 } },
    pine: { a: { reserves: 80000000, vaultCash: 6000000, securities: 150000000, loans: 364000000 }, l: { deposits: 540000000, equity: 60000000 } }
  };
}
const S0 = start();
rec('B0', '河岸银行 资产合计 / 负债+权益（美元）', [sum(S0.river.a), sum(S0.river.l)], [1000000000, 1000000000]);
rec('B0', '松石银行 资产合计 / 负债+权益（美元）', [sum(S0.pine.a), sum(S0.pine.l)], [600000000, 600000000]);
rec('B0', '河岸银行 以亿显示：准备金/金库现金/证券/贷款/存款/权益',
  [S0.river.a.reserves / YI, S0.river.a.vaultCash / YI, S0.river.a.securities / YI, S0.river.a.loans / YI, S0.river.l.deposits / YI, S0.river.l.equity / YI],
  [1.2, 0.1, 2.7, 6, 9, 1]);
// 课文：现金加准备金 1.3 亿，约占资产 13%（S01-01 已给出）；准备金约为存款的 13.33%
rec('B0', '河岸 现金+准备金（亿）', (S0.river.a.reserves + S0.river.a.vaultCash) / YI, 1.3);
rec('B0', '河岸 现金+准备金占资产 (%)', pct2((S0.river.a.reserves + S0.river.a.vaultCash) / sum(S0.river.a)), 13);
rec('B0', '河岸 准备金占存款 (%)', pct2(S0.river.a.reserves / S0.river.l.deposits), 13.33);
rec('B0', '河岸 股东权益占资产 (%)', pct2(S0.river.l.equity / sum(S0.river.a)), 10);
rec('B0', '两家银行准备金合计（美元）', S0.river.a.reserves + S0.pine.a.reserves, 200000000);
rec('B0', '两家银行存款合计（美元）', S0.river.l.deposits + S0.pine.l.deposits, 1440000000);

// ---------- T1–T3 一笔 $30,000 车贷（图 1；小题 1、2） ----------
const LOAN = 30000;
const T = start();
// T1 河岸银行批准小周 $30,000 车贷：资产方「贷款」+30,000，负债方「小周的存款」+30,000
T.river.a.loans += LOAN; T.river.l.deposits += LOAN;
rec('T1', '河岸 贷款 / 存款（美元）', [T.river.a.loans, T.river.l.deposits], [600030000, 900030000]);
rec('T1', '河岸 两边仍相等', balanced(T.river), true);
rec('T1', '河岸 资产合计', sum(T.river.a), 1000030000);
rec('T1', '河岸 准备金此刻不变（小题 1：错）', T.river.a.reserves, 120000000);
rec('T1', '金库现金也不变', T.river.a.vaultCash, 10000000);

// T2 小周把 $30,000 付给在松石银行开户的车商：存款转走，河岸用准备金结算
T.river.l.deposits -= LOAN; T.river.a.reserves -= LOAN;
T.pine.l.deposits += LOAN; T.pine.a.reserves += LOAN;
rec('T2', '河岸 贷款 / 准备金 / 存款', [T.river.a.loans, T.river.a.reserves, T.river.l.deposits], [600030000, 119970000, 900000000]);
rec('T2', '松石 准备金 / 存款', [T.pine.a.reserves, T.pine.l.deposits], [80030000, 540030000]);
rec('T2', '两家都平衡', [balanced(T.river), balanced(T.pine)], [true, true]);
rec('T2', '体系 存款比贷款前多（小题 2：A）', (T.river.l.deposits + T.pine.l.deposits) - 1440000000, 30000);
rec('T2', '体系 准备金合计不变', T.river.a.reserves + T.pine.a.reserves, 200000000);
rec('T2', '河岸 资产合计回到 10 亿（贷款 +3 万、准备金 −3 万）', sum(T.river.a), 1000000000);

// T3 一年后小周还清本金 $30,000（假设他攒在河岸账户里；只看本金，利息另计）：贷款与存款同时减少
const T3 = { loans: 600030000, deposits: 900030000 }; // 还款前：小周账上又攒到 $30,000
T3.loans -= LOAN; T3.deposits -= LOAN;
rec('T3', '还款后 河岸 贷款 / 存款', [T3.loans, T3.deposits], [600000000, 900000000]);

// T5 同一天，松石银行也放一笔 $30,000 贷款，借款人把钱付给在河岸开户的人（图 2）
const U = start();
U.river.a.loans += LOAN; U.river.l.deposits += LOAN; // 河岸放给小周
U.pine.a.loans += LOAN; U.pine.l.deposits += LOAN;   // 松石放给另一位借款人
U.river.l.deposits -= LOAN; U.pine.l.deposits += LOAN; U.river.a.reserves -= LOAN; U.pine.a.reserves += LOAN; // 小周付给松石的车商
U.pine.l.deposits -= LOAN; U.river.l.deposits += LOAN; U.pine.a.reserves -= LOAN; U.river.a.reserves += LOAN; // 对方付给河岸的客户
rec('T5', '河岸 准备金 / 贷款 / 存款', [U.river.a.reserves, U.river.a.loans, U.river.l.deposits], [120000000, 600030000, 900030000]);
rec('T5', '松石 准备金 / 贷款 / 存款', [U.pine.a.reserves, U.pine.a.loans, U.pine.l.deposits], [80000000, 364030000, 540030000]);
rec('T5', '体系 存款多出', U.river.l.deposits + U.pine.l.deposits - 1440000000, 60000);
rec('T5', '两家都平衡', [balanced(U.river), balanced(U.pine)], [true, true]);

// ---------- T4 盈利（第 7 节；只作示意的利率） ----------
const loanInt = LOAN * 7 / 100;
rec('T4', '贷款利息 7%（一年，单利）', loanInt, 2100);
rec('T4', '存款利息 3% / 4%', [LOAN * 3 / 100, LOAN * 4 / 100], [900, 1200]);
rec('T4', '利差收入 3% 时 / 4% 时（未扣运营成本与损失）', [loanInt - 900, loanInt - 1200], [1200, 900]);
rec('T4', '利差收入减少', 1200 - 900, 300);
rec('T4', '政策利率作为价格：贷款利率上调 0.25 个百分点，一年多付', LOAN * 25 / 10000, 75);

// ---------- B2–B5 河岸银行整体资产负债表（第 7 节、图 4、小题 5） ----------
// 第 5 轮（2026-11-18，PO 决定）：教学资本模型改为「只有贷款计入风险加权资产」。假设：
//   以会计股东权益代替监管资本；贷款风险权重 100%；准备金、金库现金、证券（假设全部为美国国债）0%；
//   只看总资本 ≥ 风险加权资产 × 8%，不计 CET1、一级资本、杠杆率与缓冲。于是 风险加权资产 = 贷款，股东权益 ÷ 贷款 ≥ 8%。
//   零权重的依据：12 CFR 217.32(a)(1)(i)(A)（美国政府及其央行）、217.32(l)(1)(ii)（州会员银行持有的现金）；100%：217.32(l)(5)（未另行规定的资产）
const R = start().river;
const assets0 = sum(R.a);
const CAP = 0.08;
const ratio = (eq, loans) => pct2(eq / loans);           // 教学资本比率 = 股东权益 ÷ 贷款净额（图 4 读数）
const room = (eq, loans) => Math.round(eq / CAP - loans) / YI; // 还能新增的贷款（亿）
rec('B1', '起点 风险加权资产 = 贷款（亿）', R.a.loans / YI, 6);
rec('B1', '起点 教学资本比率 (%)', ratio(R.l.equity, R.a.loans), 16.67);
rec('B1', '起点 贷款上限（亿）= 1 ÷ 8%', R.l.equity / CAP / YI, 12.5);
rec('B1', '起点 还能新增贷款（亿）', room(R.l.equity, R.a.loans), 6.5);
// B2 新放 2 亿贷款，新存款暂时都留在本行：资产 12 亿，贷款 8 亿
const b2Loans = R.a.loans + 2 * YI;
rec('B2', '资产合计（亿）', (assets0 + 2 * YI) / YI, 12);
rec('B2', '贷款（亿）', b2Loans / YI, 8);
rec('B2', '教学资本比率 (%)', ratio(R.l.equity, b2Loans), 12.5);
rec('B2', '还能新增贷款（亿）', room(R.l.equity, b2Loans), 4.5);
rec('B2', '每 1 元贷款背后的股东权益：起点 / 新放后（元，三位小数）', [Math.round(R.l.equity / R.a.loans * 1000) / 1000, R.l.equity / b2Loans], [0.167, 0.125]);
// B3 新放 0.4 亿贷款，新存款全部付到别家银行：准备金 1.2 亿 → 0.8 亿
const b3Res = R.a.reserves - 0.4 * YI, b3Loans = R.a.loans + 0.4 * YI;
rec('B3', '准备金（亿）', b3Res / YI, 0.8);
rec('B3', '准备金占存款 (%)', pct2(b3Res / R.l.deposits), 8.89);
rec('B3', '资产合计不变（亿）', (R.a.vaultCash + R.a.securities + b3Loans + b3Res) / YI, 10);
rec('B3', '存款仍为 9 亿', R.l.deposits / YI, 9);
rec('B3', '每天如此，几天用完准备金', R.a.reserves / (0.4 * YI), 3);
rec('B3', '贷款（亿）', b3Loans / YI, 6.4);
rec('B3', '教学资本比率 (%)', ratio(R.l.equity, b3Loans), 15.63);
rec('B3', '还能新增贷款（亿）', room(R.l.equity, b3Loans), 6.1);
// B4 信用损失（第 6 轮改写）：0.2 亿贷款收不回来，原有损失准备（ACL）未覆盖 → 补记 0.2 亿信用损失费用（PCL）
//    → 损失准备 +0.2 亿，贷款净额 6 → 5.8 亿；利润 −0.2 亿，股东权益 1 → 0.8 亿；资产 9.8 亿；存款不变。
//    课文表里的「贷款」一律是扣除损失准备后的净额。之后的核销（charge-off）：贷款原值与损失准备各 −0.2 亿，净额与权益不变（B4c）。
const b4Eq = R.l.equity - 0.2 * YI, b4Assets = assets0 - 0.2 * YI, b4Loans = R.a.loans - 0.2 * YI;
rec('B4', '权益 / 资产 / 贷款净额（亿）', [b4Eq / YI, b4Assets / YI, b4Loans / YI], [0.8, 9.8, 5.8]);
rec('B4', '存款不变（小题 5：B）', R.l.deposits / YI, 9);
rec('B4', '教学资本比率 (%)', ratio(b4Eq, b4Loans), 13.79);
// B4c 补记拨备与随后核销的分录（只看这 0.2 亿；假设原有损失准备为 L0，与它无关的部分不动）
{
  const L0 = 0; // 起点表里的贷款已是净额；原值与原有准备抵消后不影响下面的差额
  let gross = R.a.loans + L0, acl = L0, eq = R.l.equity;
  acl += 0.2 * YI; eq -= 0.2 * YI;                       // 记 PCL：费用 → 权益减少；ACL 增加
  rec('B4c', '记拨备后 贷款净额 / 股东权益（亿）', [(gross - acl) / YI, eq / YI], [5.8, 0.8]);
  gross -= 0.2 * YI; acl -= 0.2 * YI;                    // 核销：原值与 ACL 同减
  rec('B4c', '核销后 贷款净额 / 股东权益（亿）不再变化', [(gross - acl) / YI, eq / YI], [5.8, 0.8]);
  rec('B4c', '核销后 损失准备回到原有水平（亿）', acl / YI, 0);
}
// B5 损失对放贷空间的影响
rec('B5', '损失后贷款上限（亿）= 0.8 ÷ 8%', Math.round(b4Eq / CAP) / YI, 10);
rec('B5', '损失后还能新增贷款（亿）', room(b4Eq, b4Loans), 4.2);
rec('B5', '放贷空间 6.5 → 4.2：少了（亿）', Math.round((6.5 - 4.2) * 10) / 10, 2.3);
rec('B5', '少掉的空间 = 0.2 × 12.5 − 0.2（贷款净额减少腾出的空间）（亿）', Math.round((0.2 / CAP - 0.2) * 10) / 10, 2.3);
rec('B5', '每 1 元资本支撑的贷款（元）', 1 / CAP, 12.5);
// 图 1 / 图 2「其他资产」一行 = 金库现金 + 证券
rec('F1', '其他资产 河岸 / 松石（亿）', [(R.a.vaultCash + R.a.securities) / YI, Math.round((start().pine.a.vaultCash + start().pine.a.securities) / YI * 100) / 100], [2.8, 1.56]);

// ---------- US 美国资本规则（eCFR 截至 2026-11-01 的文本；只核数字本身与河岸银行的比较） ----------
// 假设河岸银行为州注册会员银行（state member bank），适用联储 12 CFR 217；OCC 12 CFR 3.10 与 FDIC 12 CFR 324.10 的四项最低比例相同
const MIN = { cet1: 4.5, tier1: 6, total: 8, leverage: 4 };
rec('US', '217.10 / 3.10 / 324.10 四项最低比例 (%)', [MIN.cet1, MIN.tier1, MIN.total, MIN.leverage], [4.5, 6, 8, 4]);
rec('US', '217.11 资本留存缓冲 (%)', 2.5, 2.5);
rec('US', '社区银行杠杆率框架：资产门槛（亿美元）/ 杠杆率须高于 (%)', [100, 8], [100, 8]);
rec('US', '河岸 总资产 10 亿 < 100 亿（可属小银行）', assets0 / YI < 100, true);
rec('US', '河岸 权益占资产 10%（会计口径，不是监管一级资本）高于 4%', pct2(R.l.equity / assets0) > MIN.leverage, true);

// ---------- M1–M3 教科书货币乘数（第 6 节、图 3、小题 3） ----------
near('M1', '乘数 1 / 0.1', 1 / 0.10, 10, 1e-12);
near('M1', '$100 × 乘数（小题 3：C）', 100 / 0.10, 1000, 1e-9);
function rounds(n) { let s = 0, d = 100; for (let i = 0; i < n; i++) { s += d; d *= 0.9; } return s; }
near('M2', '第 1 轮', rounds(1), 100, 1e-9);
near('M2', '前 2 轮', rounds(2), 190, 1e-9);
near('M2', '前 3 轮', rounds(3), 271, 1e-9);
near('M2', '第 2 轮新增 / 第 3 轮新增', rounds(2) - rounds(1) + (rounds(3) - rounds(2)), 90 + 81, 1e-9);
near('M2', '前 10 轮', rounds(10), 651.32, 0.005);
near('M2', '前 50 轮', rounds(50), 994.85, 0.005);
// M3 美国 2020-03-26 起法定准备金率为 0：1 / 0 没有定义（JS 给出 Infinity，课文写「无法定义」）
assert.equal(1 / 0, Infinity);
out.push('M3\t1 / 0 在 JS 中\tInfinity（课文写「无法定义」）');

// ---------- CN 中国对照（只核算术；出处见核验记录） ----------
rec('CN', '外汇存款准备金率 4% + 2 个百分点', 4 + 2, 6);
rec('CN', '2025-05-15 下调 0.5 个百分点（汽车金融、金融租赁公司下调 5 个百分点）', [0.5, 5], [0.5, 5]);

console.log(out.join('\n'));
console.log('\nS01-02 数值核验：全部 ' + out.length + ' 项通过');
