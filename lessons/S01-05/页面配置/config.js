// S01-05 课程页配置：课文之外的部分（开场、图、读图说明）。由 site/tools/lesson-build/assemble.js 读取
const ctrl = '<div class="pf-ctrl"><button type="button" data-a="prev">上一步</button><button type="button" class="pri" data-a="next">下一步</button><button type="button" data-a="again">重来</button><button type="button" data-a="all">全部显示</button><span class="cnt"></span></div>';
const ACM_CR = '© 2026 Federal Reserve Bank of New York. Content from the New York Fed subject to the Terms of Use at newyorkfed.org.';
module.exports = {
  md: require('path').join(__dirname, '..', 'S01-05 课文 v1 候选.md'),
  n: 5,
  q: '利率之间的差可以归因于哪些因素？',
  goal: '能用时间价值、通胀预期、违约风险、期限、流动性解释利率差，并说明这些因素无法从市场利率中精确、唯一地拆分',
  desc: 'MarketPilot S01-05：同一天，国债、优惠利率和信用卡的利率差得很远。期限、通胀、违约风险、流动性和成本怎样让利率不同，以及为什么这些成分拆不成零件。',
  hero: `    <figure class="s5h" aria-labelledby="s5h-cap">
      <p class="s5h-d">2026 年 11 月 12 日 · 借一美元，一年的利息</p>
      <div class="s5h-pair">
        <p class="s5h-a"><b>4.32<small>%</small></b><span>美国财政部<br>借 3 个月</span></p>
        <p class="s5h-x" aria-hidden="true">将近<br>五倍</p>
        <p class="s5h-b"><b><small>约 </small>21<small>%</small></b><span>信用卡<br>2026 年第三季度</span></p>
      </div>
      <div class="s5h-ruler" aria-hidden="true">
        <i class="gap"></i><i class="mk a"></i><i class="mk b"></i>
        <span style="left:0">0</span><span style="left:22.727%">5</span><span style="left:45.455%">10</span><span style="left:68.182%">15</span><span style="left:90.909%">20%</span>
      </div>
      <figcaption id="s5h-cap">同一个美元，最便宜和最贵的两个价钱<br><small>信用卡是季度数，不是同一天的数</small></figcaption>
    </figure>`,
  credits: `  <p class="credits"><b>图与数据</b> 开场与图均为原创绘制。数据：联储理事会 H.15、G.19；纽约联储 ACM 期限溢价；联储理事会 Kim–Wright 模型（经 FRED）；美国财政部 HQM 公司债收益率曲线</p>`,
  notes: `      <div><b>读图</b><span class="sw" style="background:var(--ink)"></span>墨色：看得见的利率与差<br><span class="sw hatch"></span>斜线：只能估计的部分<br><span class="sw" style="background:var(--lime)"></span>荧光：此刻在看的这一段</div>
      <div><b>看得见与看不见</b>图上每个「高出」都是两个市场利率直接相减。高出的部分里各种因素各占多少，只能用模型估计，不同模型给出的答案不同</div>`,
  // 表下的来源说明在课文里与表同在一个引用块，转出来会成为表的最后一行；这里移到表下，作普通说明
  replace: [
    ["<td>约 21%</td>", "<td class=\"n\">约 21%</td>"],
    ["<tr><td>来源：联储理事会 H.15（2026 年 11 月 18 日发布版中 11 月 12 日一列）；信用卡为联储 G.19（2026 年 11 月 6 日发布），是季度数，不是同一天的数。</td></tr></tbody></table></div>", "</tbody></table></div><p class=\"tsrc\">来源：联储理事会 H.15（2026 年 11 月 18 日发布版中 11 月 12 日一列）；信用卡为联储 G.19（2026 年 11 月 6 日发布），是季度数，不是同一天的数。</p>"],
    ["<tr><td>这是 10 月的月平均，不是 11 月 12 日的数。来源：美国财政部 HQM 公司债收益率曲线；联储理事会 H.15。</td></tr></tbody></table></div>", "</tbody></table></div><p class=\"tsrc\">这是 10 月的月平均，不是 11 月 12 日的数。来源：美国财政部 HQM 公司债收益率曲线；联储理事会 H.15。</p>"],
    ["<tr><td>来源：联储理事会，<em>Report to the Congress on the Profitability of Credit Card Operations of Depository Institutions</em>（2025 年），表 2。</td></tr></tbody></table></div>", "</tbody></table></div><p class=\"tsrc\">来源：联储理事会，<em>Report to the Congress on the Profitability of Credit Card Operations of Depository Institutions</em>（2025 年），表 2。</p>"]
  ],
  figs: {
    1: `<figure class="pf" id="fig1" aria-labelledby="fig1-t">
  <figcaption class="pf-hd"><span class="flab">图 1</span><span id="fig1-t">同一个 10 年，两种分法</span><span class="kind model">模型估计</span></figcaption>
  <p class="pf-desc">2026 年 11 月 12 日的 10 年期国债收益率，被两个联储模型分成两段</p>
  <div class="ctl"><span class="seg" role="group" aria-label="高亮哪一段" id="fig1-seg"><button type="button" data-v="all" aria-pressed="true">两段都看</button><button type="button" data-v="exp" aria-pressed="false" tabindex="-1">看预期部分</button><button type="button" data-v="tp" aria-pressed="false" tabindex="-1">看期限溢价</button></span></div>
  <div class="pf-stage f1">
    <svg id="fig1-svg" viewBox="0 0 320 372" role="img" aria-label="两根竖柱。纽约联储 ACM 模型：预期平均短期利率 4.39%，期限溢价 0.68%。联储理事会 Kim–Wright 模型：预期平均短期利率 4.13%，期限溢价 0.97%。期限溢价相差 0.29 个百分点，预期部分相差 0.26 个百分点"></svg>
    <div class="f1-cr">
      <p><b>ACM</b>${ACM_CR}</p>
      <p><b>Kim–Wright</b>来源：联储理事会，Kim–Wright 三因子期限结构模型（经 FRED）</p>
    </div>
  </div>
  <p class="verdict" id="fig1-v" aria-live="polite"></p>
  <p class="pf-note">柱顶是两个模型各自拟合的零息收益率（约 5.07% 和 5.10%），和财政部公布的 5.10% 口径略有不同</p>
</figure>`,
    2: `<figure class="pf" id="fig2" aria-labelledby="fig2-t">
  <figcaption class="pf-hd"><span class="flab">图 2</span><span id="fig2-t">以国债为尺子：同一天高出多少</span><span class="kind">2026 年 11 月 12 日</span></figcaption>
  <div class="pf-stage f2">
    <p class="f2-k">每根条只画「高出」的部分 · 单位：百分点</p>
    <div class="f2-ax" aria-hidden="true"><span style="left:0">0</span><span style="left:33.333%">1</span><span style="left:66.667%">2</span><span style="left:100%">3</span></div>
    <ol class="f2-bars">
      <li data-s="1"><div class="f2-lab"><b>10 年期国债比 3 个月期国债</b><span>5.10% − 4.32%</span></div>
        <div class="f2-tr"><i style="--w:.26"></i><em>0.78</em></div>
        <p class="f2-why"><span class="est">这一段的归因是估计</span>可能涉及：期限与预期</p></li>
      <li data-s="2"><div class="f2-lab"><b>优惠利率比 3 个月期国债</b><span>7.00% − 4.32%</span></div>
        <div class="f2-tr"><i style="--w:.89333"></i><em>2.68</em></div>
        <p class="f2-why"><span class="est">这一段的归因是估计</span>可能涉及：违约风险、成本与利润</p></li>
      <li data-s="3"><div class="f2-lab"><b>10 年期国债比 10 年期 TIPS</b><span>5.10% − 2.86% · 用减法得到的近似值</span></div>
        <div class="f2-tr"><i style="--w:.74667"></i><em>2.24</em></div>
        <p class="f2-why"><span class="est">这一段的归因是估计</span>可能涉及：预期通胀、通胀风险溢价与流动性</p></li>
    </ol>
  </div>
  <div class="f2-oth" data-s="4">
    <p class="f2-ot">各行观察期不同，不与上图同列</p>
    <div class="f2-ax" aria-hidden="true"><span style="left:0">0</span><span style="left:33.333%">5</span><span style="left:66.667%">10</span><span style="left:100%">15</span></div>
    <ol class="f2-bars">
      <li><div class="f2-lab"><b>高质量公司债比 10 年期国债</b><span>2026 年 10 月月平均 · 5.92% − 5.13%</span></div>
        <div class="f2-tr"><i style="--w:.05267"></i><em>0.79</em></div></li>
      <li><div class="f2-lab"><b>信用卡全部账户比优惠利率</b><span>2026 年第三季度对 8 月 · 示意</span></div>
        <div class="f2-tr"><i style="--w:.96"></i><em>约 14.4</em></div></li>
    </ol>
    <p class="f2-sc">刻度和上图不同：0 到 15 个百分点</p>
  </div>
  <div class="pf-now" aria-live="polite"></div>
  ${ctrl}
  <ol class="pf-steps"></ol>
  <details class="tbl"><summary>看数值表</summary>
    <table class="bs"><caption>同一天：2026 年 11 月 12 日</caption><thead><tr><th>比较</th><th>高出（百分点）</th></tr></thead><tbody>
      <tr><td>10 年期国债 5.10% − 3 个月期国债 4.32%</td><td class="n">0.78</td></tr>
      <tr><td>优惠利率 7.00% − 3 个月期国债 4.32%</td><td class="n">2.68</td></tr>
      <tr><td>10 年期国债 5.10% − 10 年期 TIPS 2.86%（近似值）</td><td class="n">2.24</td></tr>
    </tbody></table>
    <table class="bs"><caption>观察期不同的两组</caption><thead><tr><th>比较</th><th>高出（百分点）</th></tr></thead><tbody>
      <tr><td>高质量公司债 5.92% − 10 年期国债 5.13%（2026 年 10 月月平均）</td><td class="n">0.79</td></tr>
      <tr><td>信用卡全部账户 21.19% − 优惠利率 6.75%（2026 年第三季度对 8 月，示意）</td><td class="n">约 14.4</td></tr>
    </tbody></table>
  </details>
  <p class="pf-note">来源：联储理事会 H.15、G.19；美国财政部 HQM</p>
</figure>`
  }
};
