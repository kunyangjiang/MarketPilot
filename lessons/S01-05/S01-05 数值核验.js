// S01-05 数值核验脚本 · 内部文档，不进入发布目录
// 运行：node "lessons/S01-05/S01-05 数值核验.js"
// 无依赖。对应《S01-05 课程简报与研究计划》第 3 轮（2026-11-18）的精简利率比较（主表 2026-11-12 + 不同时期面板）。
// 只收可以公开再使用的序列；穆迪、ICE、Freddie Mac PMMS 的数值均已删除，不在此出现。
// 每个期望值都是手写的独立数字（四舍五入到课文要用的位数），不由被检验的公式生成。
'use strict';
const assert = require('node:assert');

const out = [];
function near(id, label, value, expect, tol) {
  assert.ok(Number.isFinite(value) && Math.abs(value - expect) <= tol,
    id + ' ' + label + ': got ' + value + ', expected ' + expect);
  out.push(id + '\t' + label + '\t' + value.toFixed(6) + ' ≈ ' + expect);
}
function is(id, label, cond) { assert.ok(cond, id + ' ' + label); out.push(id + '\t' + label + '\t成立'); }
const P = 0.005;   // 0.01 个百分点
const P4 = 0.00005; // 模型数据四位小数

// ---------- 一、主表 A：2026-11-12 当日（H.15 2026-11-18 发布版的 2026-11-12 列） ----------
// 第 3 轮按 PO 决定精简：只留论证需要的行；删除 PMMS 房贷（Freddie Mac 数据不上网站）、EFFR（归 S01-06）、
// 2 年、5 年、30 年、FDIC 储蓄（S01-04 已用）。DTB3 只作小题素材，不进表。
const A = {
  CMT3M: 4.32,      // DGS3MO：基准，最短期限的国债（课文只称「最短期限的基准」，与政策利率的关系归 S01-06）
  CMT10: 5.10,      // DGS10：期限
  TIPS10: 2.86,     // DFII10：实际收益率（通胀补偿的另一半）
  PRIME: 7.00,      // DPRIME：H.15 脚注定义的优惠利率（课文不说哪些贷款「常以它定价」）
};
const BILL3M = 4.14; // DTB3：写课文时删去该小题（0.18 不能只归因于报价口径），保留断言作记录
// ---------- 二、面板 B：不同观察期（单独分组，每行写明时期，不与主表画在同一张同日图里） ----------
const B = {
  HQM10_PAR_OCT: 5.92, GS10_OCT: 5.13,  // 2026 年 10 月月均：财政部 HQM（A 级及以上）对 H.15 10 年国债
  HQM10_SPOT_OCT: 6.02,                 // 同一曲线 10 年即期
  CARD_ALL_Q3: 21.19, CARD_INT_Q3: 22.36, PRIME_AUG: 6.75, // G.19 2026Q3（初值）；同期优惠利率
  NMDB_CC_PURCH_DEC25: 6.2, GS10_DEC25: 4.14, // FHFA NMDB：2025 年 12 月新发放常规合规购房贷款平均合同利率（按笔数加权，一位小数）；H.15 GS10 2025-12
};
const CLEV10 = 2.67; // 克利夫兰联储，只在文字中引用（CC BY-SA 4.0），不画图

near('S1', '期限：10 年 − 3 个月', A.CMT10 - A.CMT3M, 0.78, P);
near('S2', '记录（不进课文）：同一种三个月国债，两种口径之差', A.CMT3M - BILL3M, 0.18, P);
// 第 4 轮：NMDB 不进同日比较，只作「历史补充」（2025 年 12 月新发放、发放时合同利率、含可调利率贷款、一位小数）
near('S3', '历史补充：房贷（2025-12）− 同月 10 年国债月均', B.NMDB_CC_PURCH_DEC25 - B.GS10_DEC25, 2.06, P);
// 第 5 轮：同一组贷款（2025-12 常规合规购房，按笔数）的利率类型构成，FHFA NMDB PCT_ARM / PCT_TERM_FRM_15 / PCT_TERM_FRM_30（VALUE1）
const MIX = { ARM: 7.3, FRM15: 8.7, FRM_GT15: 84 };
near('S3', '历史补充：浮动 + 15 年及以下固定 + 15 年以上固定 = 100%', MIX.ARM + MIX.FRM15 + MIX.FRM_GT15, 100, P);
is('S3', '历史补充：6.2% 是含浮动利率贷款的混合平均，浮动利率贷款占比大于 0', MIX.ARM > 0);
near('S4', '优惠利率 − 3 个月国债', A.PRIME - A.CMT3M, 2.68, P);
near('S5', '10 年盈亏平衡通胀率（自算，不用 FRED T10YIE）', A.CMT10 - A.TIPS10, 2.24, P);
near('S6', '高质量公司债 10 年平价 − 10 年国债（2026 年 10 月月均）', B.HQM10_PAR_OCT - B.GS10_OCT, 0.79, P);
near('S6', '同名「10 年 HQM」：即期 − 平价（口径不同）', B.HQM10_SPOT_OCT - B.HQM10_PAR_OCT, 0.10, P);
near('S7', '信用卡（全部账户）− 同期优惠利率（示意，不等于 CFPB 口径）', B.CARD_ALL_Q3 - B.PRIME_AUG, 14.44, P);
near('S7', '被计息账户 − 全部账户', B.CARD_INT_Q3 - B.CARD_ALL_Q3, 1.17, P);
near('S8', '两个通胀「预期」之差：克利夫兰 − 盈亏平衡（文字引用）', CLEV10 - (A.CMT10 - A.TIPS10), 0.43, P);
is('S9', 'TIPS 实际收益率低于 3 个月名义国债（不能放在同一条名义轴上）', A.TIPS10 < A.CMT3M);

// ---------- 二、期限溢价：同日两套估计（2026-11-12） ----------
const ACM = { Y10: 5.065503989, TP10: 0.67514217, RNY10: 4.390361819 }; // NY Fed ACMTermPremium.xls，ACM Daily
const KW = { Y10: 5.0963, TP10: 0.9656 };                                // FRED THREEFY10、THREEFYTP10
near('T1', 'ACM：期限溢价 + 风险中性收益率 = 拟合收益率', ACM.TP10 + ACM.RNY10, 5.0655, P4 * 2);
near('T2', 'KW：预期平均短期利率 = 拟合收益率 − 期限溢价', KW.Y10 - KW.TP10, 4.1307, P4);
near('T3', '期限溢价之差 KW − ACM', KW.TP10 - ACM.TP10, 0.29, P);
near('T3', '预期短期利率之差 ACM − KW', ACM.RNY10 - (KW.Y10 - KW.TP10), 0.26, P);
near('T4', 'ACM 拟合（零息）与财政部平价 10 年之差', A.CMT10 - ACM.Y10, 0.03, P);
is('T4', 'KW 拟合 10 年四舍五入与平价 5.10 相同', Math.round(KW.Y10 * 100) / 100 === 5.10);

// ---------- 三、信用卡银行收入与支出（联储 2025 年报告表 2，2024 年，占平均季度资产 %） ----------
const CC = { intInc: 13.94, intExp: 3.78, nii: 10.16, nonIntInc: 6.34, nonIntExp: 9.03, netNonInt: -2.69, prov: 3.62, ret: 3.87 };
near('K1', '利息收入 − 利息支出 = 净利息收入', CC.intInc - CC.intExp, CC.nii, P);
near('K1', '非利息收入 − 非利息支出 = 净非利息收入', CC.nonIntInc - CC.nonIntExp, CC.netNonInt, P);
near('K2', '各项相加（四舍五入后）', CC.nii + CC.netNonInt - CC.prov, 3.85, P);
near('K2', '与报告的 3.87 相差 0.02：报告未列全部项目或四舍五入，课文不能说「正好相加」', CC.ret - (CC.nii + CC.netNonInt - CC.prov), 0.02, P);

// ---------- 四、写课文时新增（2026-11-18）：课文、表、图、小题里新出现的每个数字 ----------
const zero = (y, t) => 100 / Math.pow(1 + y / 100, t); // 年复利零息，教学示意
near('W1', '10 年零息 $100，5.10% 的现值', zero(5.10, 10), 60.81, 0.005);
near('W1', '同一张，利率升到 6.10% 的现值', zero(6.10, 10), 55.32, 0.005);
near('W1', '差额（美元）', zero(5.10, 10) - zero(6.10, 10), 5.49, 0.005);
near('W1', '跌幅约 9%', (1 - zero(6.10, 10) / zero(5.10, 10)) * 100, 9.04, 0.005);
near('W2', '3 个月零息 $100，5.10%', zero(5.10, 0.25), 98.76, 0.005);
near('W2', '同一张，6.10%', zero(6.10, 0.25), 98.53, 0.005);
near('W2', '差额约 $0.23', zero(5.10, 0.25) - zero(6.10, 0.25), 0.23, 0.005);
is('W2', '跌幅约 0.2%（不到 10 年期的 1/30）', (1 - zero(6.10, 0.25) / zero(5.10, 0.25)) * 100 < 0.25);
near('W3', '费雪式精确值：(1.0510/1.0286 − 1)', (1.0510 / 1.0286 - 1) * 100, 2.18, P);
// 2026-11-19 独立审阅 B3：财政部名义平价收益率按半年付息的债券等价口径报价（Treasury Interest Rates FAQ），课文并列按年与按半年两种算法
near('W3', '按半年复利：((1.0255/1.0143) − 1) × 2', ((1 + 0.0510 / 2) / (1 + 0.0286 / 2) - 1) * 2 * 100, 2.21, P);
is('W3', '两种算法都比减法 2.24 小（课文「都比 2.24% 小一点」）', ((1 + 0.0510 / 2) / (1 + 0.0286 / 2) - 1) * 200 < 2.24 && (1.0510 / 1.0286 - 1) * 100 < 2.24);
is('W3', '减法 2.24 与精确 2.18 不同：课文称近似', Math.abs((A.CMT10 - A.TIPS10) - (1.0510 / 1.0286 - 1) * 100) > 0.05);
// W4（PO 审阅后改写，2026-11-19）：删去「r ≈ 5.37%、高出 1.05 个百分点」——它依赖未写明的假设（4.32% 的 3 个月收益率当一年期利率、全损无回收、
// 违约在期末、风险中性、无成本），且把预期损失当成了利差。改为只算预期信用损失 = 违约概率 × 违约损失率 × 违约风险敞口（全部为假设）。
const ECL = { PD: 0.01, RECOVERY: 0.40, EAD: 100 };
const LGD = 1 - ECL.RECOVERY;
near('W4', '违约损失率 = 1 − 回收率 40%', LGD, 0.60, 1e-9);
near('W4', '预期信用损失（美元）= 1% × 60% × $100', ECL.PD * LGD * ECL.EAD, 0.60, 1e-9);
near('W4', '占借出金额 %', ECL.PD * LGD * ECL.EAD / ECL.EAD * 100, 0.6, 1e-9);
is('W4', '每家 $1 × 100 家 = 敞口 $100', 1 * 100 === ECL.EAD);
near('W5', '信用卡全部账户 ÷ 3 个月国债（将近五倍）', B.CARD_ALL_Q3 / A.CMT3M, 4.905, 0.0005);
is('W5', '「将近五倍」：介于 4.5 与 5 之间', B.CARD_ALL_Q3 / A.CMT3M > 4.5 && B.CARD_ALL_Q3 / A.CMT3M < 5);
near('W6', '粗略 APR 利差 14.44 → 课文「约 14.4」', Math.round((B.CARD_ALL_Q3 - B.PRIME_AUG) * 10) / 10, 14.4, 1e-9);
near('W6', 'CFPB：2013→2023 APR 利差上升', 14.3 - 9.6, 4.7, P);
is('W7', '税前资产回报率：信用卡银行 3.87% > 全部银行 1.38%', CC.ret > 1.38);
is('W7', '小题 4：三项支出（利息 3.78、非利息 9.03、拨备 3.62）中非利息支出最大', CC.nonIntExp > CC.intExp && CC.nonIntExp > CC.prov);
near('W8', '图 2 同日柱：期限 0.78 / 优惠利率 2.68 / 通胀补偿 2.24', (A.CMT10 - A.CMT3M) + (A.PRIME - A.CMT3M) + (A.CMT10 - A.TIPS10), 0.78 + 2.68 + 2.24, P);
near('W9', 'ACM 与 KW 期限溢价四舍五入到两位：0.68 / 0.97', Math.round(ACM.TP10 * 100) / 100 + Math.round(KW.TP10 * 100) / 100, 1.65, 1e-9);
near('W9', 'ACM 与 KW 预期短期利率：4.39 / 4.13', Math.round(ACM.RNY10 * 100) / 100 + Math.round((KW.Y10 - KW.TP10) * 100) / 100, 8.52, 1e-9);
const QUIZ = { 1: 'C', 2: '错', 3: 'B', 4: 'B', 5: 'C' };
is('Q', '小题答案：1 C、2 错、3 B、4 B、5 C（与课文核对）', Object.values(QUIZ).join('') === 'C错BBC');

console.log(out.join('\n'));
console.log('\n全部 ' + out.length + ' 项断言通过');
