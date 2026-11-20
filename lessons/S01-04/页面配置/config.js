// S01-04 课程页配置：课文之外的部分（开场、图、读图说明、来源说明）。由 site/tools/lesson-build/assemble.js 读取
// 图 3 是静态图：柱高与标注在这里由 1980 年的 12 个月数值直接生成（宽屏竖柱、窄屏横条各一份）
const TB80 = [12.00, 12.86, 15.20, 13.20, 8.58, 7.07, 8.06, 9.13, 10.27, 11.62, 13.73, 15.49];
const CAP = 5.25, CPI80 = 12.52, MAX = 16;
const f2 = v => v.toFixed(2);

function fig3Wide() {
  const L = 44, R = 548, T = 22, B = 238, W = 640, H = 276;
  const y = v => B - v / MAX * (B - T), cw = (R - L) / 12;
  const g = [];
  for (const v of [0, 5, 10, 15]) g.push(`<line class="g" x1="${L}" x2="${R}" y1="${y(v)}" y2="${y(v)}"/><text class="ax" x="${L - 8}" y="${y(v) + 4}" text-anchor="end">${v}%</text>`);
  TB80.forEach((v, i) => {
    const x = L + i * cw + 6, w = cw - 12;
    g.push(`<rect class="bar" x="${x.toFixed(1)}" y="${y(v).toFixed(1)}" width="${w.toFixed(1)}" height="${(B - y(v)).toFixed(1)}" rx="3"/>`);
    g.push(`<text class="bv" x="${(x + w / 2).toFixed(1)}" y="${(y(v) - 6).toFixed(1)}" text-anchor="middle">${f2(v)}</text>`);
    g.push(`<text class="ax" x="${(x + w / 2).toFixed(1)}" y="${B + 18}" text-anchor="middle">${i + 1} 月</text>`);
  });
  g.push(`<line class="caph" x1="${L}" x2="${R}" y1="${y(CAP)}" y2="${y(CAP)}"/>`);
  g.push(`<line class="cap" x1="${L}" x2="${R}" y1="${y(CAP)}" y2="${y(CAP)}"/>`);
  g.push(`<text class="capl" x="${R + 8}" y="${y(CAP) - 4}">存折上限</text><text class="capv" x="${R + 8}" y="${y(CAP) + 14}">5.25%</text>`);
  g.push(`<line class="cpi" x1="${R + 2}" x2="${R + 14}" y1="${y(CPI80)}" y2="${y(CPI80)}"/>`);
  g.push(`<text class="cpil" x="${R + 18}" y="${y(CPI80) - 4}">全年物价</text><text class="cpiv" x="${R + 18}" y="${y(CPI80) + 14}">+12.52%</text>`);
  return `<svg class="f3w" viewBox="0 0 ${W} ${H}" aria-hidden="true">${g.join('')}</svg>`;
}
function fig3Tall() {
  const L = 44, R = 300, T = 28, rh = 26, W = 360, B = T + rh * 12, H = B + 66;
  const x = v => L + v / MAX * (R - L);
  const g = [];
  for (const v of [0, 5, 10, 15]) g.push(`<line class="g" x1="${x(v)}" x2="${x(v)}" y1="${T - 6}" y2="${B}"/><text class="ax" x="${x(v)}" y="${T - 12}" text-anchor="middle">${v}%</text>`);
  TB80.forEach((v, i) => {
    const yy = T + i * rh + 4;
    g.push(`<text class="ax" x="${L - 6}" y="${yy + 13}" text-anchor="end">${i + 1} 月</text>`);
    g.push(`<rect class="bar" x="${L}" y="${yy}" width="${(x(v) - L).toFixed(1)}" height="${rh - 8}" rx="3"/>`);
    g.push(`<text class="bv" x="${(x(v) + 5).toFixed(1)}" y="${yy + 13}">${f2(v)}</text>`);
  });
  g.push(`<line class="caph" x1="${x(CAP)}" x2="${x(CAP)}" y1="${T - 6}" y2="${B + 8}"/>`);
  g.push(`<line class="cap" x1="${x(CAP)}" x2="${x(CAP)}" y1="${T - 6}" y2="${B + 8}"/>`);
  g.push(`<text class="capl" x="${x(CAP)}" y="${B + 24}" text-anchor="middle">存折上限 5.25%</text>`);
  g.push(`<line class="cpi" x1="${x(CPI80)}" x2="${x(CPI80)}" y1="${B + 2}" y2="${B + 34}"/>`);
  g.push(`<text class="cpil" x="${x(CPI80)}" y="${B + 50}" text-anchor="middle">全年物价 +12.52%</text>`);
  return `<svg class="f3t" viewBox="0 0 ${W} ${H}" aria-hidden="true">${g.join('')}</svg>`;
}
const M = ['1 月', '2 月', '3 月', '4 月', '5 月', '6 月', '7 月', '8 月', '9 月', '10 月', '11 月', '12 月'];

module.exports = {
  md: require('path').join(__dirname, '..', 'S01-04 课文 v1 候选.md'),
  n: 4,
  q: '通胀侵蚀的是什么？名义与实际差在哪里？',
  goal: '能区分名义回报与实际回报，并解释意外通胀对借款人和储户的影响方向相反',
  desc: 'MarketPilot S01-04：存款利率 3%、物价也涨 3%，多的是美元不是东西。名义与实际回报、费雪关系、CPI，以及意外通胀为什么让借款人和储户一得一失。',
  hero: `    <figure class="pbk" aria-labelledby="pbk-t">
      <div class="pbk-hd"><span id="pbk-t">储蓄存折 · 1980</span><span class="pbk-no">SAVINGS · PASSBOOK</span></div>
      <dl class="pbk-rows">
        <div class="pbk-r"><dt>1980 年 · 存折利率上限</dt><dd>5.25%</dd></div>
        <div class="pbk-r up"><dt>同年物价</dt><dd>+12.52%</dd></div>
      </dl>
      <p class="pbk-sum">按年初价格，<span class="nw">$1,052.50</span> 只值约 <b class="nw">$935</b></p>
      <p class="pbk-src">联储 1980 年统计年鉴表 8；劳工统计局 CPI-U（未季调）</p>
    </figure>`,
  credits: `  <p class="credits"><b>数据</b> 消费者价格指数：美国劳工统计局 · 三个月国库券利率：联储 H.15，经圣路易斯联储 FRED · 存款利率上限：联储 1980 年统计年鉴 · 开场与图均为原创排版</p>`,
  notes: `      <div><b>读图</b><span class="sw" style="border-top:3px solid var(--ink)"></span>墨黑：美元、利率<br><span class="sw" style="border-top:3px solid var(--vio)"></span>紫色：物价<br><span class="sw" style="border-top:8px solid var(--lime)"></span>荧光：多出或少掉的部分<br><span class="sw" style="border-top:2px dashed var(--ink2)"></span>虚线：基准、上限</div>
      <div><b>史实与模型</b>开场的储户、图 1 的小林和图 2 的合同都是假设的教学例子。图 3 是 1980 年的真实月度数据</div>`,
  figs: {
    1: `<figure class="pf" id="fig1" aria-labelledby="fig1-t">
  <figcaption class="pf-hd"><span class="flab">图 1</span><span id="fig1-t">多了美元，还是多了篮子</span><span class="kind model">简化例子</span></figcaption>
  <p class="pf-desc">存款 $10,000，年利率 3%；年初一个篮子 $100，正好买 100 个。选这一年的通胀</p>
  <div class="ctl"><span class="seg" role="group" aria-label="这一年的通胀" id="fig1-seg"><button type="button" data-k="0" aria-pressed="false">通胀 1%</button><button type="button" data-k="1" aria-pressed="true">通胀 3%</button><button type="button" data-k="2" aria-pressed="false">通胀 6%</button></span></div>
  <div class="pf-stage f1">
    <div class="f1-usd">
      <p class="k">账上的美元</p>
      <b class="m">$10,300</b>
      <p class="t">名义回报 3%<br>三种通胀下都一样</p>
    </div>
    <div class="f1-bk">
      <p class="k">能买几个篮子 <span class="px">年底一个 <b id="fig1-px">$103</b></span></p>
      <p class="f1-n"><b class="m" id="fig1-n">100.00 个</b><span class="d" id="fig1-d">不多不少</span></p>
      <svg id="fig1-svg" viewBox="0 0 400 128" aria-hidden="true"></svg>
      <p class="t">按年初价格算，相当于 <b id="fig1-pp">$10,000.00</b> · 实际回报 <b id="fig1-r">0</b></p>
    </div>
  </div>
  <p class="sr" id="fig1-out" aria-live="polite"></p>
  <details class="tbl"><summary>表格：三种通胀下的结果</summary><div class="tblw"><table class="bs"><thead><tr><th>通胀</th><th>年底一个篮子</th><th>$10,300 能买</th><th>按年初价格</th><th>实际回报</th></tr></thead><tbody>
    <tr><td>1%</td><td class="n">$101</td><td class="n">101.98 个</td><td class="n">$10,198.02</td><td class="n">+1.98%</td></tr>
    <tr><td>3%</td><td class="n">$103</td><td class="n">100.00 个</td><td class="n">$10,000.00</td><td class="n">0</td></tr>
    <tr><td>6%</td><td class="n">$106</td><td class="n">97.17 个</td><td class="n">$9,716.98</td><td class="n">−2.83%</td></tr>
  </tbody></table></div></details>
</figure>`,
    2: `<figure class="pf" id="fig2" aria-labelledby="fig2-t">
  <figcaption class="pf-hd"><span class="flab">图 2</span><span id="fig2-t">一笔合同，两个人</span><span class="kind model">简化例子</span></figcaption>
  <div class="ctl"><span class="seg" role="group" aria-label="这一年实际的通胀" id="fig2-seg"><button type="button" data-k="0" aria-pressed="true">通胀如预期 2%</button><button type="button" data-k="1" aria-pressed="false">意外高 6%</button><button type="button" data-k="2" aria-pressed="false">意外低 1%</button></span></div>
  <div class="pf-stage f2">
    <div class="f2-who lend"><p class="k">小林<small>借出方</small></p><p class="lab">与预期相比</p><b class="m" id="fig2-l">0</b><p class="t" id="fig2-lt">得到了想要的</p></div>
    <div class="f2-ct">
      <p class="k">合同</p>
      <p class="ct-m">$10,000 · 一年 · 固定 5%</p>
      <p class="ct-m">到期还 <b>$10,500</b></p>
      <p class="ct-e">签约时双方预期通胀 2%</p>
      <div class="ct-now"><span>这 $10,500 按年初价格值</span><b id="fig2-v">$10,294.12</b></div>
    </div>
    <div class="f2-who borr"><p class="k">朋友<small>借款方</small></p><p class="lab">与预期相比</p><b class="m" id="fig2-b">0</b><p class="t" id="fig2-bt">付出了预想的</p></div>
    <p class="f2-flow" id="fig2-f">购买力没有转移</p>
  </div>
  <p class="sr" id="fig2-out" aria-live="polite"></p>
  <details class="tbl"><summary>表格：三种通胀下的结果</summary><div class="tblw"><table class="bs"><thead><tr><th>通胀</th><th>$10,500 按年初价格</th><th>小林与预期之差</th><th>朋友与预期之差</th></tr></thead><tbody>
    <tr><td>2%（如预期）</td><td class="n">$10,294.12</td><td class="n">0</td><td class="n">0</td></tr>
    <tr><td>6%（意外高）</td><td class="n">$9,905.66</td><td class="n">−$388.46</td><td class="n">+$388.46</td></tr>
    <tr><td>1%（意外低）</td><td class="n">$10,396.04</td><td class="n">+$101.92</td><td class="n">−$101.92</td></tr>
  </tbody></table></div></details>
  <p class="pf-note">差额都按年初价格的购买力算</p>
</figure>`,
    3: `<figure class="pf" id="fig3" aria-labelledby="fig3-t">
  <figcaption class="pf-hd"><span class="flab">图 3</span><span id="fig3-t">1980 年：存折、国库券和物价</span><span class="kind">史实 · 月度数据</span></figcaption>
  <p class="pf-desc">柱：三个月国库券的月均市场利率（银行贴现率口径）；虚线：商业银行储蓄存款利率上限</p>
  <div class="pf-stage f3">${fig3Wide()}${fig3Tall()}</div>
  <p class="sr">1980 年三个月国库券月均利率每个月都高于存折上限 5.25%：最低 6 月 7.07%，最高 12 月 15.49%；这一年物价上涨 12.52%。各月数值见下表</p>
  <p class="pf-note f3-src">数据：联储 H.15（经 FRED 序列 TB3MS）；劳工统计局 CPI-U，未季调，1979 年 12 月至 1980 年 12 月；联储《Annual Statistical Digest 1980》表 8</p>
  <details class="tbl"><summary>表格：1980 年各月数值</summary><div class="tblw"><table class="bs"><thead><tr><th>月份</th><th>三个月国库券</th><th>存折上限</th></tr></thead><tbody>
${TB80.map((v, i) => `    <tr><td>${M[i]}</td><td class="n">${f2(v)}%</td><td class="n">5.25%</td></tr>`).join('\n')}
  </tbody></table></div></details>
</figure>`
  }
};
