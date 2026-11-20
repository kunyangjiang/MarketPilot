// S01-03 课程页配置：课文之外的部分（开场、图、读图说明、来源说明）。由 site/tools/lesson-build/assemble.js 读取
const ctrl = '<div class="pf-ctrl"><button type="button" data-a="prev">上一步</button><button type="button" class="pri" data-a="next">下一步</button><button type="button" data-a="again">重来</button><span class="cnt"></span></div>';
module.exports = {
  md: require('path').join(__dirname, '..', 'S01-03 课文 v1 候选.md'),
  n: 3,
  q: '未来的钱怎样换算成今天的钱？',
  goal: '能手算单笔现金流的复利与折现，并解释折现率的含义',
  desc: 'MarketPilot S01-03：复利与折现是同一条路的两个方向；折现率是机会成本；从一场 52 周国库券拍卖看银行贴现率、持有期回报与投资利率的区别。',
  hero: `    <figure class="tb03" aria-labelledby="tb03-cap">
      <p class="tb-big" aria-hidden="true"><span class="a">$95.66</span><span class="arr">→</span><span class="b">$100</span></p>
      <p class="tb-days" aria-hidden="true">364 天</p>
      <p class="tb-date" aria-hidden="true">2026 年 10 月 27 日 · 美国财政部 52 周国库券拍卖</p>
      <p class="tb-src" aria-hidden="true">TreasuryDirect 拍卖结果，CUSIP 912797WT0</p>
      <figcaption class="sr" id="tb03-cap">2026 年 10 月 27 日美国财政部 52 周国库券拍卖：每 $100 面值约卖 $95.66，364 天后付 $100。来源：TreasuryDirect 拍卖结果，CUSIP 912797WT0</figcaption>
    </figure>`,
  credits: `  <p class="credits"><b>数据</b> 开场与图 4 的国库券数字来自 TreasuryDirect 公布的 2026 年 10 月 27 日 52 周国库券拍卖结果（CUSIP 912797WT0）。课文中的小林和他的朋友是虚构的</p>`,
  notes: `      <div><b>读图</b><span class="sw" style="border-top:3px solid var(--ink)"></span>墨黑：本金、事实<br><span class="sw" style="border-top:3px solid var(--vio)"></span>紫色：利息、辅助的数<br><span class="sw" style="border-top:8px solid var(--lime)"></span>荧光：此刻这一步<br><span class="sw" style="border-top:2px dashed var(--ink2)"></span>虚线：单利对照、记录</div>
      <div><b>数字从哪里来</b>图 1 至图 3 按每年 5%、每年计息一次计算，5% 是教学用的利率。图 4 是一场真实拍卖的结果</div>`,
  figs: {
    1: `<figure class="pf" id="fig1" aria-labelledby="fig1-t">
  <figcaption class="pf-hd"><span class="flab">图 1</span><span id="fig1-t">复利的台阶</span></figcaption>
  <p class="pf-desc">$100 按每年 5% 存着不取，每根柱是一年末的余额；虚线是单利</p>
  <p class="f1-key" aria-hidden="true"><span class="pr">本金 $100</span><span class="in">累计利息</span><span class="hl">这一步</span><span class="sl">单利</span></p>
  <div class="pf-stage f1"><svg id="fig1-svg" role="img" aria-labelledby="fig1-alt"><title id="fig1-alt">复利余额柱状图</title></svg></div>
  <div class="pf-now" aria-live="polite"></div>
  ${ctrl}
  <ol class="pf-steps"></ol>
</figure>`,
    2: `<figure class="pf" id="fig2" aria-labelledby="fig2-t">
  <figcaption class="pf-hd"><span class="flab">图 2</span><span id="fig2-t">72 法则准不准</span></figcaption>
  <div class="ctl"><span class="seg f2-rates" role="radiogroup" aria-label="年利率">
    <button type="button" role="radio" data-r="0">1%</button><button type="button" role="radio" data-r="1">3%</button><button type="button" role="radio" data-r="2">5%</button><button type="button" role="radio" data-r="3">8%</button><button type="button" role="radio" data-r="4">10%</button><button type="button" role="radio" data-r="5">20%</button>
  </span></div>
  <div class="pf-stage f2">
    <div class="f2-row"><span class="k">72 法则</span><span class="trk"><i id="fig2-a"></i></span><b class="v" id="fig2-av"></b></div>
    <div class="f2-row ex"><span class="k">精确</span><span class="trk"><i id="fig2-b"></i></span><b class="v" id="fig2-bv"></b></div>
    <p class="f2-out" id="fig2-out" aria-live="polite"></p>
  </div>
  <p class="pf-note">精确值按每年计息一次计算</p>
</figure>`,
    3: `<figure class="pf" id="fig3" aria-labelledby="fig3-t">
  <figcaption class="pf-hd"><span class="flab">图 3</span><span id="fig3-t">时间轴上的折现</span></figcaption>
  <div class="ctl"><span class="seg" role="group" aria-label="从哪一笔开始"><button type="button" data-g="0" aria-pressed="true">1 年后的 $100</button><button type="button" data-g="3" aria-pressed="false">10 年后的 $100</button></span></div>
  <div class="pf-stage f3">
    <ol class="f3-axis" id="fig3-axis" aria-hidden="true"></ol>
    <p class="f3-eq" id="fig3-eq"></p>
    <div class="f3-static" hidden><p>100 ÷ 1.05 = 95.24</p><p>100 ÷ 1.05¹⁰ = 61.39</p></div>
  </div>
  <div class="pf-now" aria-live="polite"></div>
  ${ctrl}
  <ol class="pf-steps"></ol>
  <p class="pf-note">按每年 5% 折现</p>
</figure>`,
    4: `<figure class="pf" id="fig4" aria-labelledby="fig4-t">
  <figcaption class="pf-hd"><span class="flab">图 4</span><span id="fig4-t">同一个价格，四种报价与回报口径</span><span class="kind">2026 年 10 月 27 日 · 52 周国库券</span></figcaption>
  <p class="f4-fix">付 <b>$95.662333</b> <span class="arr">→</span> 364 天后拿回 <b>$100</b></p>
  <div class="ctl"><span class="seg f4-tabs" role="radiogroup" aria-label="四种口径">
    <button type="button" role="radio" data-k="0">银行贴现率</button><button type="button" role="radio" data-k="1">持有期回报</button><button type="button" role="radio" data-k="2">单利年化</button><button type="button" role="radio" data-k="3">投资利率</button>
  </span></div>
  <div class="pf-stage f4">
    <div class="f4-den" id="fig4-den"><span class="k">分母</span><span class="chip" data-d="face">面值 $100</span><span class="chip" data-d="price">价格 $95.662333</span></div>
    <div class="f4-p" data-k="0">
      <h4>银行贴现率</h4>
      <p class="eq">$4.337667 ÷ <span class="den">面值 $100</span> × 360 ÷ 364 = <b>4.290%</b></p>
      <p class="tags"><span>一年按 360 天</span><span>报价与投标用的数，不是买家的回报</span></p>
    </div>
    <div class="f4-p" data-k="1" hidden>
      <h4>持有期回报</h4>
      <p class="eq">$4.337667 ÷ <span class="den">价格 $95.662333</span> = <b>4.534%</b></p>
      <p class="tags"><span>364 天，不年化</span><span>买家的持有期回报</span></p>
    </div>
    <div class="f4-p" data-k="2" hidden>
      <h4>单利年化</h4>
      <p class="eq">4.5344% × 365 ÷ 364 ≈ <b>4.547%</b></p>
      <p class="sub">4.5344% 是持有期回报（分母是<span class="den">价格 $95.662333</span>）没有四舍五入的值；用 4.534% 去乘只得 4.546%</p>
      <p class="tags"><span>365 天，单利</span><span>同一笔回报写成年率，不是另一笔收益</span></p>
    </div>
    <div class="f4-p" data-k="3" hidden>
      <h4>投资利率（等价息票收益率，coupon-equivalent yield）</h4>
      <p class="eq">95.662333 × [1 + (364 − 365 ÷ 2) × i ÷ 365] × (1 + i ÷ 2) = 100</p>
      <p class="sub">解出 i ≈ <b>4.496%</b>（要解二次方程，不要求手算）· 31 CFR Part 356 附录 B，到期期限超过半年的国库券</p>
      <div class="f4-tl" role="img" aria-label="假想的两段时间线：前半年 182.5 天按年利率的一半增长，剩下的 181.5 天按单利计算">
        <div class="seg1"><b>182.5 天</b><span>假想的前半年：按年利率的一半增长，× (1 + i ÷ 2)</span></div>
        <div class="seg2"><b>181.5 天</b><span>剩下的天数按单利</span></div>
      </div>
      <p class="tags"><span>365 天，假设半年复利</span><span>标准化的换算口径，国库券不付息票，半年时没有任何付款</span></p>
    </div>
    <div class="f4-line" aria-hidden="true"><div class="f4-ax" id="fig4-ax"></div></div>
    <p class="sr" id="fig4-out" aria-live="polite"></p>
  </div>
  <p class="pf-note">四个数从小到大：4.290% &lt; 4.496% &lt; 4.534% &lt; 4.547%。半年复利让一部分增长由利息生利息完成，所以投资利率低于单利年化的 4.547%</p>
</figure>`
  }
};
