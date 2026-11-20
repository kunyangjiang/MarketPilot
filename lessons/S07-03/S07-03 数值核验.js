// S07-03 数值核验：node "lessons/S07-03/S07-03 数值核验.js"
// 读取《S07-03 课文 v1 候选.md》与《S07-03 图与交互方案 v1 候选.md》。
// 罐子计数、瀑布形成、瀑布概率、价格版路径：先独立重算（含对全部 2^8 种球序列的穷举与精确概率递推），
// 再断言课文（及图方案）里确实以该写法出现。
// 论文报告的统计量（安德森与霍尔特 1997；西普里亚尼与瓜里诺 2005 工作论文）：做能做的一致性检查（加总、大小关系），并断言原值出现；出处见核验记录。
// 不依赖网络与临时目录。
'use strict';
const fs = require('fs');
const path = require('path');

const LESSON = fs.readFileSync(path.join(__dirname, 'S07-03 课文 v1 候选.md'), 'utf8').replace(/\r/g, '');
const FIG = fs.readFileSync(path.join(__dirname, 'S07-03 图与交互方案 v1 候选.md'), 'utf8').replace(/\r/g, '');

let pass = 0, fail = 0;
function ok(id, cond, msg) { if (cond) pass++; else { fail++; console.log('失败 ' + id + '：' + (msg || '')); } }
const near = (a, b, tol) => Math.abs(a - b) < (tol || 1e-9);
const inL = (id, s) => ok(id + ' 课文出现', LESSON.includes(s), `课文里没有「${s}」`);
const inF = (id, s) => ok(id + ' 图方案出现', FIG.includes(s), `图方案里没有「${s}」`);
function num(id, got, want, dp, text, fig) {
  const r = Number(got.toFixed(dp));
  ok(id + ' 重算', near(r, want), `重算 ${got} → ${r}，应为 ${want}`);
  if (text) inL(id, text);
  if (fig) inF(id, fig === true ? text : fig);
}

// ---------- 模型 ----------
const q = 2 / 3;                       // 一个球指向正确罐子的可能性（甲罐 2 浅 1 深）
const postA = d => Math.pow(2, d) / (Math.pow(2, d) + 1);   // 净多 d 个浅球时甲罐的可能性（计数法）
// 直接用贝叶斯法则算（独立于计数法）：n 个浅、m 个深
function bayesA(n, m) { const la = Math.pow(q, n) * Math.pow(1 - q, m), lb = Math.pow(1 - q, n) * Math.pow(q, m); return la / (la + lb); }
const value = d => 40 + 20 * postA(d); // 价格版：甲 $60、乙 $40
const fmtPct = x => { const v = x * 100; return near(v, Math.round(v), 1e-9) ? Math.round(v) + '%' : '约 ' + Math.round(v) + '%'; };
const fmtUsd = x => { const v = Math.round(x * 100) / 100; return Number.isInteger(v) ? '$' + v : '约 $' + v.toFixed(2); };
const C = { L: '浅', D: '深' };

// 价格固定：按安德森与霍尔特的打平规则（打平按自己的球）；返回猜测、瀑布起点（第几人）
function fixedRun(balls) {
  let d = 0, cas = 0; const guesses = [], posts = [], before = [];
  balls.forEach((b, i) => {
    const s = b === 'L' ? 1 : -1;
    before.push(d);
    const e = d + s; posts.push(postA(e));
    let g;
    if (cas) g = d > 0 ? '甲' : '乙';
    else g = e > 0 ? '甲' : e < 0 ? '乙' : (s > 0 ? '甲' : '乙');
    guesses.push(g);
    if (!cas) { d += g === '甲' ? 1 : -1; if (Math.abs(d) >= 2) cas = i + 2; }
  });
  return { guesses, cas, posts, before };
}
// 价格会动：价格 = 公开信息下的平均价值；每人比较自己的估计与价格
function flexRun(balls) {
  let d = 0; const rows = [];
  balls.forEach(b => {
    const s = b === 'L' ? 1 : -1;
    const price = value(d), est = value(d + s);
    const act = est > price ? '买' : est < price ? '卖' : '不交易';
    rows.push({ b, price, est, act });
    // 做市商从买卖推出球（每个人都按球交易，所以买 = 浅、卖 = 深）
    d += act === '买' ? 1 : act === '卖' ? -1 : 0;
  });
  return { rows, final: value(d), d };
}

// ---------- A 组：开场（班纳吉的餐馆） ----------
inL('A1 先验', '甲更好的可能性是 51%，乙是 49%');
inL('A2 人数', '九十九条说乙更好，只有一条说甲更好');
// 第二个人：自己的乙信号与第一个人的甲信号抵消，回到 51 对 49，选甲
ok('A3 抵消后回到先验仍选甲', 0.51 > 0.49);
inL('A4 回到先验', '回到事先那个 51 对 49');

// ---------- B 组：罐子与计数（图 1、小题 1） ----------
num('B1 一个浅：甲 9 次中', 9 * q, 6, 6, '9 次里大约 6 次摸到浅色');
num('B2 一个浅：乙 9 次中', 9 * (1 - q), 3, 6, '9 次里大约 3 次摸到浅色');
num('B3 一个浅 → 甲罐', 6 / 9, bayesA(1, 0), 9, '甲罐的可能性是三分之二，约 67%');
num('B4 两个浅：甲', 9 * q * q, 4, 6, '甲罐的 9 次里约有 4 次');
num('B5 两个浅：乙', 9 * (1 - q) * (1 - q), 1, 6, '乙罐的 9 次里约有 1 次');
num('B6 两个浅 → 80%', 4 / 5, 0.8, 9, '甲罐的可能性是五分之四，也就是 80%');
num('B7 一浅一深：甲', 9 * q * (1 - q), 2, 6, '甲罐里约 2 次，乙罐里也约 2 次');
num('B8 一浅一深 → 一半', bayesA(1, 1), 0.5, 9, '正好一半一半');
// 计数法与贝叶斯法则一致：对所有 n、m ≤ 8
let agree = true; for (let n = 0; n <= 8; n++) for (let m = 0; m <= 8; m++) if (!near(postA(n - m), bayesA(n, m), 1e-12)) agree = false;
ok('B9 只看个数之差（计数法 = 贝叶斯法则，n、m ≤ 8）', agree);
num('B10 净多一个 2:1', postA(1) / (1 - postA(1)), 2, 9, '净多出一个浅球，甲罐的可能性就是 2 比 1，约 67%');
num('B11 净多两个 4:1', postA(2), 0.8, 9, '净多出两个，就是 4 比 1，即 80%');
num('B12 净多三个 8:1 约 89%', postA(3) * 100, 89, 0, '净多出三个，是 8 比 1，约 89%');
inL('B13 图 1 表 一个浅', '> | 一个浅 | 6 | 3 | 约 67% |');
inL('B14 图 1 表 两个浅', '> | 两个浅 | 4 | 1 | 80% |');
inL('B15 图 1 表 一浅一深', '> | 一浅一深 | 2 | 2 | 50% |');
inF('B16 图方案 图 1 第 ② 步', '6 比 3，甲罐约 67%');
inF('B17 图方案 图 1 第 ③ 步', '4 比 1，甲罐 80%');
inF('B18 图方案 图 1 第 ④ 步', '2 比 2，甲罐 50%');
num('B19 图方案 d = 4', postA(4) * 100, 94.1, 1, null, 'd = 4 约 94.1%');
// 小题 1：浅、深、浅、浅
num('B20 小题 1', bayesA(3, 1), 0.8, 9, '净多两个浅球，甲罐和乙罐是 4 比 1，即 80%');
ok('B21 小题 1 干扰项 75% 是比例', near(3 / 4, 0.75));
inL('B22 小题 1 选项', '> A. 75%');
// S06-03 的模型：知情者 20%（好日子全买），流动性交易者 80%（一半买）；100 张买单里来自好日子的 = (20 + 40) / (60 + 40)
num('B23 S06-03 回顾 60%', (20 + 40) / ((20 + 40) + (0 + 40)), 0.6, 9, '把「消息是好的」的可能从一半调到 60%');
inL('B24 实验奖金', '猜对的人得 2 美元');
inL('B25 骰子', '掷出 1、2、3 用甲罐，掷出 4、5、6 用乙罐');
ok('B26 骰子对半', 3 / 6 === 0.5);

// ---------- C 组：顺序猜测与瀑布（图 2、小题 2） ----------
const SC = [
  { name: '一', urn: '甲', balls: 'LLDLLDLL', cas: 3 },
  { name: '二', urn: '乙', balls: 'LLDDDDDL', cas: 3 },
  { name: '三', urn: '甲', balls: 'LDLLDLDL', cas: 5 },
];
for (const s of SC) {
  const r = fixedRun([...s.balls]);
  ok(`C-${s.name} 瀑布起点`, r.cas === s.cas, `算出第 ${r.cas} 人，应为第 ${s.cas} 人`);
  const ballsZh = [...s.balls].map(b => C[b]).join(' ');
  const row = `> | ${s.name} | ${s.urn} | ${ballsZh} | ${r.guesses.join(' ')} | 第 ${r.cas} 人 |`;
  inL(`C-${s.name} 图 2 情景行`, row);
  // 图方案的逐人表
  [...s.balls].forEach((b, i) => {
    const d = r.before[i];
    const dStr = d > 0 ? '+' + d : String(d);
    const p = r.posts[i];
    const pStr = near(p * 100, Math.round(p * 100), 1e-9) ? Math.round(p * 100) + '%' : '约 ' + Math.round(p * 100) + '%';
    inF(`C-${s.name} 第 ${i + 1} 人`, `| ${i + 1} | ${C[b]} | ${dStr} | ${pStr} | ${r.guesses[i]} |`);
  });
  const nL = [...s.balls].filter(b => b === 'L').length;
  inF(`C-${s.name} 球数`, `八个球：浅 ${nL}、深 ${8 - nL}`);
}
// 情景二：用乙罐，五个深球，八人全错
const r2 = fixedRun([...'LLDDDDDL']);
ok('C1 情景二全猜甲', r2.guesses.every(g => g === '甲'));
ok('C2 情景二深球 5 个', [...'LLDDDDDL'].filter(b => b === 'D').length === 5);
inL('C3 情景二', '八个人里有五个摸到了深色球，可八个人全猜了甲');
inL('C4 情景二后六人', '后面六个人里有五个手里拿着指向乙的证据');
// 第三个人：两个推出来的浅球 + 自己的深球 → 约 67%，猜甲
num('C5 第三人', bayesA(2, 1), 2 / 3, 9, '还净多一个浅球，甲罐的可能性是三分之二，他应该猜甲');
// 小题 2：五个甲 → 两个浅球；加深球约 67%
const rq2 = fixedRun([...'LLLDL']);
ok('C6 小题 2 五个甲', rq2.guesses.join('') === '甲甲甲甲甲' && rq2.cas === 3);
num('C7 小题 2 概率', postA(2 - 1), 2 / 3, 9, '净多一个浅球，甲罐约 67%，所以猜甲');
// 规则：净差到 2，下一个人起进入瀑布；穷举 2^8 种球序列验证「进入瀑布后猜测与自己的球无关」
let ruleOK = true;
for (let k = 0; k < 256; k++) {
  const balls = [...Array(8)].map((_, i) => ((k >> i) & 1) ? 'L' : 'D');
  const r = fixedRun(balls);
  if (r.cas) for (let i = r.cas - 1; i < 8; i++) {
    // 换掉这个人的球，他的猜测不变
    const alt = balls.slice(); alt[i] = alt[i] === 'L' ? 'D' : 'L';
    if (fixedRun(alt).guesses[i] !== r.guesses[i]) ruleOK = false;
  }
}
ok('C8 穷举：进入瀑布后猜测不取决于自己的球', ruleOK);
inL('C9 规则', '某一种颜色净多出两个，下一个人起就进入瀑布');

// ---------- D 组：瀑布的概率 ----------
num('D1 两人都对', q * q, 4 / 9, 12, '即九分之四，于是形成方向对的瀑布');
num('D2 两人都错', (1 - q) * (1 - q), 1 / 9, 12, '即九分之一，于是形成方向错的瀑布');
num('D3 一对一错', 2 * q * (1 - q), 4 / 9, 12, '一对一错，可能性是九分之四');
const wrong = p => (1 - p) ** 2 / (p * p + (1 - p) ** 2);
num('D4 错的瀑布 20%', wrong(q), 0.2, 12, '即五分之一，也就是 20%');
// 独立方法：精确递推（马尔可夫链，走 400 人），确认最终错的瀑布概率
function exactWrong(p, N) {
  let dist = { 0: 1 }, right = 0, wr = 0;
  for (let t = 0; t < N; t++) {
    const nd = {};
    for (const [ks, pr] of Object.entries(dist)) {
      const d = +ks;
      // 打平时按自己的球：d=0 → ±1；d=±1 → 同向成瀑布、反向回 0
      for (const [s, ps] of [[1, p], [-1, 1 - p]]) {
        const e = d + s; const nd2 = e;  // 猜测与自己的球同向（打平或同向）
        if (Math.abs(nd2) >= 2) { if (nd2 > 0) right += pr * ps; else wr += pr * ps; }
        else nd[nd2] = (nd[nd2] || 0) + pr * ps;
      }
    }
    dist = nd;
  }
  return { wr: wr / (wr + right), none: Object.values(dist).reduce((a, b) => a + b, 0) };
}
num('D5 精确递推 = 20%', exactWrong(q, 400).wr, 0.2, 9);
const none = k => Math.pow(4 / 9, k);
num('D6 两人后未成瀑布', none(1) * 100, 44, 0, '两个人之后约 44%');
num('D7 四人后', none(2) * 100, 20, 0, '四个人之后约 20%');
num('D8 六人后', none(3) * 100, 8.8, 1, '六个人之后约 8.8%');
num('D9 十人后', none(5) * 100, 1.7, 1, '十个人之后只剩约 1.7%');
num('D10 精确递推十人后', exactWrong(q, 10).none * 100, 1.7, 1);
num('D11 表 60%', wrong(0.6) * 100, 31, 0, '> | 60% | 约 31% |');
num('D12 表 2/3', wrong(q) * 100, 20, 0, '> | 三分之二（本课的罐子） | 20% |');
num('D13 表 75%', wrong(0.75) * 100, 10, 0, '> | 75% | 10% |');
num('D14 表 90%', wrong(0.9) * 100, 1.2, 1, '> | 90% | 约 1.2% |');
ok('D15 信号越准错得越少', wrong(0.6) > wrong(q) && wrong(q) > wrong(0.75) && wrong(0.75) > wrong(0.9));
// 比赫昌达尼等（打平掷硬币）：p → 1/2 时，十人后未成瀑布的可能 (p − p²)^5 → (1/4)^5 < 0.1%
ok('D16 BHW 极端情形 < 千分之一', Math.pow(0.25, 5) < 0.001 && Math.pow(0.5001 - 0.5001 ** 2, 5) < 0.001);
inL('D17 BHW 极端情形', '十个人之后还没有形成瀑布的可能也不到千分之一');
inL('D18 本课要点', '十个人之后还没形成瀑布的可能只有约 1.7%');

// ---------- E 组：安德森与霍尔特的实验数字 ----------
ok('E1 41 ≤ 56，13 ≤ 41', 41 <= 56 && 13 <= 41);
inL('E2 41/56', '一共有 56 局出现了「推出来的球压过一个人自己的球」的局面，其中 41 局形成了瀑布');
inL('E3 13 局反向', '这 41 局里有 13 局是方向错的反向瀑布');
inL('E4 26%', '大约 26% 的决定还是按自己的球做的');
inL('E5 95%', '95% 的第二个人按自己的球猜了');
ok('E6 57/68 过半', 57 / 68 > 0.5);
inL('E7 57/68', '在算下来正好一半一半、自己的球又和前一个人的猜测相反的 68 个场合里，有 57 次参与者按自己的球猜');
inL('E8 每场十五局', '每场十五局');
inL('E9 情景二在实验里出现过', '后面四个人摸到的都是深色，却全都跟着猜了甲');

// ---------- F 组：脆弱性（小题 3） ----------
// 十个甲：只有前两个有信息；公开深球 + 自己深球 → 打平 → 按自己的球猜乙
const dPublic = 2 - 1, dQ3 = dPublic - 1;
ok('F1 小题 3 打平', dQ3 === 0 && near(postA(dQ3), 0.5));
inL('F2 小题 3 答案', '公开的深球和他自己的深球把它们全部抵掉，正好打平，他按自己的球猜乙');
// 公开一个深球后，下一人的猜测重新取决于他的球
ok('F3 公开深球后下一人的猜测取决于自己的球', (dPublic + 1 > 0) && (dPublic - 1 === 0));
inL('F4 账上变化', '账上就从净多两个浅球，变成净多一个');
inL('F5 一千个甲', '这一千个「甲」，在账上值多少？仍然只是两个浅球');

// ---------- G 组：价格版（图 3、小题 4） ----------
num('G1 第一人估计', 60 * (2 / 3) + 40 * (1 / 3), 53.33, 2, '$60 × 三分之二 + $40 × 三分之一，约 $53.33');
num('G2 两个浅 $56', value(2), 56, 6, '甲罐 80%，股票值 $56');
num('G3 第三人估计', value(1), 53.33, 2, '净多一个浅球，股票值约 $53.33');
inL('G4 第三人卖', '可价格已经是 $56');
const levels = [[1, '约 $53.33', '净多一个浅球约 $53.33'], [2, '$56', '两个 $56'], [3, '约 $57.78', '三个约 $57.78'], [4, '约 $58.82', '四个约 $58.82'],
  [-1, '约 $46.67', '净多一个深球约 $46.67'], [-2, '$44', '两个 $44'], [-3, '约 $42.22', '三个约 $42.22'], [0, '$50', '打平 $50']];
for (const [d, s, phrase] of levels) {
  ok(`G5 价格 d=${d}`, fmtUsd(value(d)) === s, `算出 ${fmtUsd(value(d))}，应为 ${s}`);
  inL(`G5 价格 d=${d}`, phrase);
}
inF('G6 图方案价格层级', '+1 约 $53.33，+2 $56，+3 约 $57.78，+4 约 $58.82；−1 约 $46.67，−2 $44，−3 约 $42.22；0 为 $50');
const urnValue = { 甲: '$60', 乙: '$40' };
for (const s of SC) {
  const f = flexRun([...s.balls]);
  // 价格会动时：每个人的决定都与自己的球一致（不跟风）
  ok(`G-${s.name} 人人按球交易`, f.rows.every(r => (r.b === 'L') === (r.act === '买')));
  const fixedActs = fixedRun([...s.balls]).guesses.map(g => (g === '甲' ? '买' : '卖'));
  const fixedStr = fixedActs.every(a => a === '买') ? '买 ×8' : fixedActs.join(' ');
  const row = `> | ${s.name}（${s.urn}罐，值 ${urnValue[s.urn]}） | ${fixedStr} | ${f.rows.map(r => r.act).join(' ')} | ${fmtUsd(f.final)} |`;
  inL(`G-${s.name} 图 3 对比行`, row);
  f.rows.forEach((r, i) => inF(`G-${s.name} 第 ${i + 1} 人`, `| ${i + 1} | ${C[r.b]} | ${fmtUsd(r.price)} | ${fmtUsd(r.est)} | ${r.act} | ${fmtUsd(value(f.rows.slice(0, i + 1).reduce((a, x) => a + (x.act === '买' ? 1 : -1), 0)))} |`));
}
num('G7 情景二最后 $44', flexRun([...'LLDDDDDL']).final, 44, 6, '价格会动的市场八笔之后停在 $44');
inL('G8 情景二固定价', '八个人全在 $50 买进');
inF('G9 图方案固定价情景三', '情景三为买、卖、买、买、买、买、买、买');
// 穷举 2^8：价格会动时没有任何人与自己的球反着做；价格固定时有序列出现反着做（瀑布）
let flexClean = true, fixedHerd = false;
for (let k = 0; k < 256; k++) {
  const balls = [...Array(8)].map((_, i) => ((k >> i) & 1) ? 'L' : 'D');
  if (!flexRun(balls).rows.every(r => (r.b === 'L') === (r.act === '买'))) flexClean = false;
  const g = fixedRun(balls).guesses; if (g.some((x, i) => (x === '甲') !== (balls[i] === 'L'))) fixedHerd = true;
}
ok('G10 穷举：价格会动时无人跟风', flexClean);
ok('G11 穷举：价格固定时存在跟风', fixedHerd);
// 小题 4
ok('G12 小题 4 卖', value(1) < value(2));
inL('G13 小题 4 答案', '股票值约 $53.33，低于眼前的 $56，卖出划算');

// ---------- H 组：西普里亚尼与瓜里诺（2005 工作论文） ----------
ok('H1 固定价三项加总 100', 52 + 26 + 22 === 100);
ok('H2 可变价三项加总 100', 12 + 42 + 46 === 100);
inL('H3 固定价', '在前面的买卖已经一边倒、而自己的信号指向另一边的 58 个场合里，52% 的人跟着前面的人走，26% 不交易，22% 按自己的信号');
inL('H4 可变价', '在 66 个同样的场合里，跟着前面的人走的只有 12%，42% 不交易，46% 按自己的信号');
inL('H5 设定', '资产值 0 或 100，每人得到一个对的可能性为 70% 的信号，每轮十二人依次交易');
inL('H6 本课要点', '跟着前人走的比例从 52% 降到 12%');

// ---------- I 组：本课要点与课文一致 ----------
inL('I1 要点 计数', '净多一个是 2 比 1（约 67%），净多两个是 4 比 1（80%）');
inL('I2 要点 20%', '瀑布形成后方向错的可能是 20%');
inL('I3 要点 实验', '56 局可能形成瀑布，41 局形成了，其中 13 局方向错了');

console.log(`通过 ${pass}，失败 ${fail}`);
if (fail) process.exit(1);
