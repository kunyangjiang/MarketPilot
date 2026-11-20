// S01-06 课程页配置：课文之外的部分（开场、图、读图说明、页脚）。由 site/tools/lesson-build/assemble.js 读取
const ctrl = (p, n) => '<div class="pf-ctrl"><button type="button" data-a="prev">' + (p || '上一步') + '</button><button type="button" class="pri" data-a="next">' + (n || '下一步') + '</button><button type="button" data-a="again">重来</button><span class="cnt"></span></div>';
const TOU_EFFR = '<p class="pf-tou" lang="en">The Effective Federal Funds Rate is subject to the Terms of Use posted at newyorkfed.org. The New York Fed is not responsible for publication of the EFFR by MarketPilot, does not sanction or endorse any particular republication, and has no liability for your use.</p>';
const TOU_BOTH = '<p class="pf-tou" lang="en">The Effective Federal Funds Rate and SOFR are subject to the Terms of Use posted at newyorkfed.org. The New York Fed is not responsible for publication of the EFFR and SOFR by MarketPilot, does not sanction or endorse any particular republication, and has no liability for your use.</p>\n  <p class="pf-tou" lang="en">The Secured Overnight Financing Rate (SOFR) Data are calculated using data provided under a license granted to the New York Fed by DTCC Solutions LLC (“Solutions”), an affiliate of The Depository Trust &amp; Clearing Corporation.</p>';
module.exports = {
  md: require('path').join(__dirname, '..', 'S01-06 课文 v1 候选.md'),
  n: 6,
  q: '政策利率通过什么渠道变成市场利率？',
  goal: '能说明央行如何让隔夜利率落在目标区间，以及为什么长端利率不由央行直接决定',
  desc: 'MarketPilot S01-06：美联储定的是联邦基金利率的目标区间，靠几个自己挂出的利率把隔夜利率留在框里；框一动，短端当天跟上，长端由市场定价。',
  hero: `    <figure class="h6" aria-labelledby="h6-cap">
      <div class="h6-date">2026 年 11 月 12 日</div>
      <div class="h6-plot" aria-hidden="true">
        <div class="h6-out" style="top:29.47%"><b>4.32%</b><span>3 个月期国债收益率</span></div>
        <div class="h6-gap" style="top:29.47%;height:33.69%"><span>高出 0.32</span></div>
        <div class="h6-box" style="top:63.16%;height:26.31%"><span class="bu">4.00%</span><span class="bt">联储的目标区间</span><span class="bl">3.75%</span></div>
      </div>
      <figcaption id="h6-cap" class="sr">2026 年 11 月 12 日，联储的目标区间是 3.75% 到 4.00%，3 个月期国债收益率是 4.32%，比区间上限高出 0.32 个百分点</figcaption>
    </figure>`,
  credits: `  <p class="credits">开场与图均为原创；利率数据来自联储理事会与纽约联储，见各图下方</p>`,
  notes: `      <div><b>读图</b><span class="sw" style="border-top:3px solid var(--ink)"></span>墨黑：联储挂出的利率<br><span class="sw" style="border-top:3px solid var(--vio)"></span>紫色：不由联储挂出的利率<br><span class="sw" style="border-top:8px solid var(--lime)"></span>荧光：区间、此刻这一步<br><span class="sw" style="border-top:2px dashed var(--ink2)"></span>虚线：联储只能影响</div>
      <div><b>数字</b>图上的利率都是公布值，单位是年利率（%），变化单位是百分点。图 3 的刻度中间断开，好放下 5.25%</div>`,
  figs: {
    1: `<figure class="pf" id="fig1" aria-labelledby="fig1-t">
  <figcaption class="pf-hd"><span class="flab">图 1</span><span id="fig1-t">联储的框，和框里的成交价</span><span class="kind">2026 年 11 月 12 日</span></figcaption>
  <div class="pf-stage f1" role="img" aria-label="利率刻度 3.70% 到 4.05%：目标区间 3.75% 到 4.00%；隔夜逆回购利率 3.75%，在下沿；准备金余额利率 3.90%；常设回购操作利率 4.00%，在上沿；有效联邦基金利率 3.88%，在区间里，比准备金余额利率低 0.02 个百分点">
    <div class="f1-plot">
      <div class="f1-ax"></div>
      <div class="f1-band" data-s="1" style="top:14.29%;height:71.43%"><span>目标区间 3.75%–4.00%</span></div>
      <div class="f1-ln lo" data-s="2" style="top:85.71%"><b>3.75%</b><span>隔夜逆回购利率 · 非银行机构的保底去处</span></div>
      <div class="f1-ln mid" data-s="3" style="top:42.86%"><b>3.90%</b><span>准备金余额利率 · 银行的保底去处</span></div>
      <div class="f1-ln hi" data-s="4" style="top:14.29%"><b>4.00%</b><span>常设回购操作利率 · 缺钱时的后备来源</span></div>
      <div class="f1-dot" data-s="5" style="top:48.57%"><i></i><span><b>3.88%</b>有效联邦基金利率</span></div>
    </div>
  </div>
  <div class="pf-now" aria-live="polite"></div>
  ${ctrl()}
  <ol class="pf-steps"></ol>
  <div class="pf-src">
  <p class="pf-note">来源：联储 2026 年 10 月 28 日实施说明；纽约联储（有效联邦基金利率）</p>
  ${TOU_EFFR}
  </div>
</figure>`,
    2: `<figure class="pf" id="fig2" aria-labelledby="fig2-t">
  <figcaption class="pf-hd"><span class="flab">图 2</span><span id="fig2-t">加息前后的一天</span><span class="kind">2026 年 9 月 16 日 → 17 日</span></figcaption>
  <div class="ctl"><span class="seg" role="group" aria-label="日期"><button type="button" data-d="16" aria-pressed="true">9 月 16 日</button><button type="button" data-d="17" aria-pressed="false">9 月 17 日</button></span></div>
  <div class="pf-stage f2" id="fig2-rows"></div>
  <p class="verdict" id="fig2-v" aria-live="polite"></p>
  <details class="tbl"><summary>看表格</summary>
    <div class="tblw"><table class="bs"><thead><tr><th>利率</th><th>9 月 16 日</th><th>9 月 17 日</th><th>变化</th></tr></thead><tbody id="fig2-tb"></tbody></table></div>
  </details>
  <div class="pf-src">
  <p class="pf-note">每条刻度一样长，同样的变化画出来一样长；优惠利率的刻度另起。来源：联储理事会 H.15、2026 年 9 月 16 日实施说明；纽约联储（EFFR、SOFR）</p>
  ${TOU_BOTH}
  </div>
</figure>`,
    3: `<figure class="pf" id="fig3" aria-labelledby="fig3-t">
  <figcaption class="pf-hd"><span class="flab">图 3</span><span id="fig3-t">2019 年 9 月的一周</span><span class="kind">史实</span></figcaption>
  <div class="pf-stage f3">
    <div class="f3-key" aria-hidden="true"><span><i class="bd"></i>当日目标区间</span><span><i class="ef"></i>有效联邦基金利率</span><span><i class="so"></i>SOFR</span></div>
    <div class="f3-scale" aria-hidden="true" id="fig3-scale"></div>
    <ol class="f3-days" id="fig3-days"></ol>
  </div>
  <div class="pf-now" aria-live="polite"></div>
  ${ctrl('前一天', '下一天')}
  <ol class="pf-steps"></ol>
  <details class="tbl"><summary>看表格</summary>
    <div class="tblw"><table class="bs"><thead><tr><th>日期</th><th>目标区间上限</th><th>有效联邦基金利率</th><th>SOFR</th></tr></thead><tbody id="fig3-tb"></tbody></table></div>
  </details>
  <div class="pf-src">
  <p class="pf-note">9 月 19 日起区间下调 0.25 个百分点，是 9 月 18 日会议的决定。来源：纽约联储（EFFR、SOFR）；联储理事会（目标区间）</p>
  ${TOU_BOTH}
  </div>
</figure>`,
    4: `<figure class="pf" id="fig4" aria-labelledby="fig4-t">
  <figcaption class="pf-hd"><span class="flab">图 4</span><span id="fig4-t">从一个隔夜利率到整个经济</span><span class="kind model">示意</span></figcaption>
  <p class="pf-desc">线越粗，联系越直接。点一段，看本课的证据</p>
  <div class="pf-stage f4">
    <ol class="chain">
      <li class="seg1"><button type="button" data-k="0" aria-expanded="false" aria-controls="fig4-ev"><span class="tag">联储直接设定</span><span class="nd">FOMC 决定区间</span><span class="nd">联储挂出 IORB、ON RRP、常设回购操作利率</span></button></li>
      <li class="seg2"><button type="button" data-k="1" aria-expanded="false" aria-controls="fig4-ev"><span class="tag">当天跟随，有数据为证</span><span class="nd">隔夜市场的成交价（EFFR、SOFR）</span><span class="nd">以它们为基准的短期贷款利率（如优惠利率）</span></button></li>
      <li class="seg3"><button type="button" data-k="2" aria-expanded="false" aria-controls="fig4-ev"><span class="tag">通过预期和市场定价，联储只能影响</span><span class="nd">对未来短期利率的预期 + 期限溢价</span><span class="nd">10 年期国债、房贷等长期利率</span><span class="nd">借款与支出</span></button></li>
    </ol>
    <div class="f4-ev" id="fig4-ev" aria-live="polite"></div>
    <ol class="f4-all" id="fig4-all"></ol>
  </div>
  <div class="pf-src">
  <p class="pf-note">示意图，只表示联系的直接程度。证据来自图 1、图 2 和上一课</p>
  ${TOU_BOTH}
  </div>
</figure>`
  }
};
