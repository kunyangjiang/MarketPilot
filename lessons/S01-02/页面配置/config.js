// S01-02 课程页配置：课文之外的部分（开场原创图、图、读图说明、来源说明）。由 site/tools/lesson-build/assemble.js 读取
const ctrl = '<div class="pf-ctrl"><button type="button" data-a="prev">上一步</button><button type="button" class="pri" data-a="next">下一步</button><button type="button" data-a="again">重来</button><span class="cnt"></span></div>';
module.exports = {
  md: require('path').join(__dirname, '..', 'S01-02 课文 v1 候选.md'),
  n: 2,
  q: '银行是借出存款，还是放贷时创造了新存款？',
  goal: '能逐步演示一笔贷款如何同时产生一笔存款，并说出限制放贷的主要约束',
  desc: 'MarketPilot S01-02：银行批准贷款时，在借款人账户里记下一笔新存款；钱付到别家、贷款还清时账怎样变，以及什么在限制银行放贷。',
  hero: `    <figure class="card th" aria-labelledby="th-cap">
      <p class="th-k" id="th-cap">批准贷款的那一刻</p>
      <div class="th-bank">河岸银行</div>
      <div class="th-t" role="img" aria-label="河岸银行的 T 型账户：左边资产，贷款增加 30,000 美元；右边负债，小周的存款增加 30,000 美元，两条一样长；准备金一行为 0，没有变化">
        <div class="th-side a">
          <span class="th-h">资产</span>
          <div class="th-row"><span class="nm">贷款<small>小周欠银行</small></span><b>+$30,000</b><i class="bar"></i></div>
          <div class="th-row zero"><span class="nm">准备金</span><b>0</b></div>
        </div>
        <div class="th-side l">
          <span class="th-h">负债</span>
          <div class="th-row"><span class="nm">小周的存款<small>银行欠小周</small></span><b>+$30,000</b><i class="bar"></i></div>
        </div>
      </div>
      <p class="th-ft"><span>左 +$30,000</span><span class="eq">=</span><span>右 +$30,000</span></p>
    </figure>`,
  credits: `  <p class="credits">开场图与课内各图均为原创示意；河岸银行、松石银行和小周、小林都是虚构的。</p>`,
  notes: `      <div><b>读图</b><span class="sw" style="border-top:3px solid var(--ink)"></span>墨黑：账上的事实<br><span class="sw" style="border-top:3px solid var(--vio)"></span>紫色：减少、收紧<br><span class="sw" style="border-top:8px solid var(--lime)"></span>荧光：这一步变化的行<br><span class="sw" style="border-top:2px dashed var(--ink2)"></span>虚线：待结算、教学模型</div>
      <div><b>虚构与模型</b>河岸银行、松石银行和小周都是虚构的教学例子，账只保留最核心的几行。图 4 的 8% 是简化教学模型，不是真实的资本监管计算。</div>`,
  figs: {
    1: `<figure class="pf" id="fig1" aria-labelledby="fig1-t">
  <figcaption class="pf-hd"><span class="flab">图 1</span><span id="fig1-t">一笔贷款的三步</span><span class="kind model">虚构银行 · 简化账户</span></figcaption>
  <p class="pf-desc">金库现金和证券合成「其他资产」；数字上悬停可看完整金额（美元）</p>
  <div class="pf-stage tb-stage" id="fig1-stage"></div>
  <div class="pf-now" aria-live="polite"></div>
  ${ctrl}
  <ol class="pf-steps"></ol>
  <details class="tbl" id="fig1-tbl"><summary>表格视图：三步汇总</summary>
    <div class="tblx"><table>
      <thead><tr><th>步骤</th><th>河岸银行</th><th>联储</th><th>松石银行</th><th>整个体系（相对起点）</th></tr></thead>
      <tbody>
        <tr><td>① 批准贷款</td><td>贷款 +$30,000；小周的存款 +$30,000；准备金不动</td><td>不动</td><td>不动</td><td>存款 +$30,000；准备金 0</td></tr>
        <tr><td>② 付给松石银行的车商</td><td>小周的存款 −$30,000；准备金 −$30,000（1.2 亿 → 119,970,000）</td><td>欠河岸 −$30,000；欠松石 +$30,000；合计仍 2 亿</td><td>准备金 +$30,000（80,030,000）；车商的存款 +$30,000（540,030,000）</td><td>存款 +$30,000（合计 1,440,030,000）；准备金合计 2 亿不变</td></tr>
        <tr><td>③ 一年后攒下工资，还清本金</td><td>先：小周的存款 +$30,000、准备金 +$30,000（工资从图外的别家银行转入）；再：贷款 −$30,000、小周的存款 −$30,000；最后贷款 600,000,000、存款 900,000,000</td><td>欠河岸 +$30,000（从图外那家银行转来的准备金），图中合计 2 亿 + $30,000</td><td>不动</td><td>存款 +$30,000（车商的那笔还在）；准备金 +$30,000（从图外转入）</td></tr>
      </tbody>
    </table></div>
  </details>
</figure>`,
    2: `<figure class="pf" id="fig2" aria-labelledby="fig2-t">
  <figcaption class="pf-hd"><span class="flab">图 2</span><span id="fig2-t">一家放贷和大家一起放贷</span><span class="kind model">虚构银行 · 简化账户</span></figcaption>
  <div class="ctl"><span class="seg" role="group" aria-label="放贷的银行"><button type="button" data-m="one" aria-pressed="true">只有河岸银行放贷</button><button type="button" data-m="two" aria-pressed="false">两家同时放贷</button></span></div>
  <p class="f2-ind" id="fig2-ind" hidden>两家银行各自独立决定放贷，互不商量</p>
  <div class="pf-stage tb-stage" id="fig2-stage"></div>
  <div class="f2-run" data-m="one"><p class="f2-rh">只有河岸银行放贷</p><div class="pf-now" aria-live="polite"></div>${ctrl}<ol class="pf-steps"></ol></div>
  <div class="f2-run idle" data-m="two"><p class="f2-rh">两家同时放贷</p><div class="pf-now" aria-live="polite"></div>${ctrl}<ol class="pf-steps"></ol></div>
  <details class="tbl" id="fig2-tbl"><summary>表格视图：两种情形结束时的变化</summary>
    <div class="tblx"><table>
      <thead><tr><th>相对起点</th><th>只有河岸银行放贷</th><th>两家同时放贷</th></tr></thead>
      <tbody>
        <tr><td>河岸 准备金</td><td>−$30,000</td><td>0（回到 1.2 亿）</td></tr>
        <tr><td>河岸 贷款</td><td>+$30,000</td><td>+$30,000</td></tr>
        <tr><td>河岸 存款</td><td>0</td><td>+$30,000</td></tr>
        <tr><td>松石 准备金</td><td>+$30,000</td><td>0（回到 0.8 亿）</td></tr>
        <tr><td>松石 贷款</td><td>0</td><td>+$30,000</td></tr>
        <tr><td>松石 存款</td><td>+$30,000</td><td>+$30,000</td></tr>
        <tr><td>体系 存款</td><td>+$30,000</td><td>+$60,000</td></tr>
        <tr><td>体系 准备金</td><td>0</td><td>0</td></tr>
      </tbody>
    </table></div>
  </details>
</figure>`,
    3: `<figure class="pf" id="fig3" aria-labelledby="fig3-t">
  <figcaption class="pf-hd"><span class="flab">图 3</span><span id="fig3-t">乘数是怎样「乘」出来的</span><span class="kind model">教科书的算法</span></figcaption>
  <p class="pf-desc">法定准备金率 10%：央行注入 $100 准备金，每一轮留下 10%，其余借出去</p>
  <div class="ctl f3-btns" role="group" aria-label="乘数的轮次">
    <button type="button" class="pri" data-a="more">再借一轮</button>
    <button type="button" data-a="r10">跳到第 10 轮</button>
    <button type="button" data-a="r50">跳到第 50 轮</button>
    <button type="button" data-a="zero" aria-pressed="false">美国 2020-03-26 之后：准备金率 0%</button>
    <button type="button" data-a="reset">重来</button>
  </div>
  <div class="pf-stage mx" id="fig3-stage">
    <div class="mx-plot" aria-hidden="true">
      <div class="mx-bars" id="fig3-bars"></div>
      <div class="mx-sum"><span class="mx-lim">极限 $1,000</span><div class="mx-col"><i id="fig3-fill"></i></div><span class="mx-cl">累计</span></div>
    </div>
    <p class="mx-f" id="fig3-f">乘数 = 1 ÷ 10% = 10　·　$100 × 10 = $1,000</p>
  </div>
  <p class="verdict" id="fig3-out" aria-live="polite">第 1 轮新增 $100，累计 $100</p>
  <div class="f3-two" id="fig3-two" hidden>
    <p>乘数故事的两个前提：准备金的数量是银行放贷的硬约束；央行直接决定准备金的数量</p>
    <p>英格兰银行的研究者认为这两个前提都不是现实的准确描述</p>
  </div>
  <details class="tbl" id="fig3-tbl"><summary>表格视图：累计存款</summary>
    <div class="tblx"><table>
      <thead><tr><th>轮次</th><th>这一轮新增</th><th>累计存款</th></tr></thead>
      <tbody>
        <tr><td>第 1 轮</td><td class="n">$100</td><td class="n">$100</td></tr>
        <tr><td>第 2 轮</td><td class="n">$90</td><td class="n">$190</td></tr>
        <tr><td>第 3 轮</td><td class="n">$81</td><td class="n">$271</td></tr>
        <tr><td>前 10 轮</td><td></td><td class="n">约 $651.32</td></tr>
        <tr><td>前 50 轮</td><td></td><td class="n">约 $994.85</td></tr>
        <tr><td>极限</td><td></td><td class="n">$1,000</td></tr>
        <tr><td>准备金率 0%</td><td></td><td>1 ÷ 0：无法定义</td></tr>
      </tbody>
    </table></div>
  </details>
</figure>`,
    4: `<figure class="pf" id="fig4" aria-labelledby="fig4-t">
  <figcaption class="pf-hd"><span class="flab">图 4</span><span id="fig4-t">河岸银行的约束仪表</span><span class="kind model">简化教学模型</span></figcaption>
  <div class="ctl"><span class="seg f4-seg" role="group" aria-label="情形（每次从起点出发）">
    <button type="button" data-c="b1" aria-pressed="true">回到起点</button>
    <button type="button" data-c="b2" aria-pressed="false">新放 2 亿，存款留在本行</button>
    <button type="button" data-c="b3" aria-pressed="false">新放 0.4 亿，存款全部付到别家</button>
    <button type="button" data-c="b4" aria-pressed="false">确认 0.2 亿信用损失</button>
  </span></div>
  <div class="pf-stage f4">
    <div class="f4-bs">
      <p class="f4-cap">河岸银行（亿美元）</p>
      <div class="f4-t">
        <div class="f4-side"><span class="th-h">资产</span>
          <div class="f4-row" data-k="res"><span>准备金</span><b id="fig4-res"></b></div>
          <div class="f4-row" data-k="cash"><span>金库现金</span><b>0.1</b></div>
          <div class="f4-row" data-k="sec"><span>证券（国债）</span><b>2.7</b></div>
          <div class="f4-row" data-k="loan"><span>贷款净额</span><b id="fig4-loan"></b></div>
          <div class="f4-row tot" data-k="ta"><span>合计</span><b id="fig4-ta"></b></div>
        </div>
        <div class="f4-side"><span class="th-h">负债与股东权益</span>
          <div class="f4-row" data-k="dep"><span>存款</span><b id="fig4-dep"></b></div>
          <div class="f4-row" data-k="eq"><span>股东权益</span><b id="fig4-eq"></b></div>
          <div class="f4-row tot" data-k="tl"><span>合计</span><b id="fig4-tl"></b></div>
        </div>
      </div>
      <p class="f4-ev" id="fig4-ev"></p>
    </div>
    <div class="f4-gs" id="fig4-out" aria-live="polite">
      <div class="gx" data-g="cap"><p class="gk">股东权益 ÷ 贷款净额</p><p class="gv" id="fig4-cap"></p>
        <div class="gt" aria-hidden="true"><i id="fig4-capb"></i><span class="g8"><em>8%</em></span></div>
        <p class="gm">教学模型：股东权益 ≥ 贷款净额的 8%</p></div>
      <div class="gx" data-g="rr"><p class="gk">准备金占存款</p><p class="gv" id="fig4-rr"></p>
        <div class="gt" aria-hidden="true"><i id="fig4-rrb"></i></div></div>
      <div class="gx" data-g="room"><p class="gk">按教学模型还能新增的贷款</p><p class="gv" id="fig4-room"></p>
        <div class="gt room" aria-hidden="true"><i class="ln" id="fig4-lb"></i><i class="rm" id="fig4-rb"></i></div>
        <p class="gs" id="fig4-cap2"></p></div>
      <p class="f4-say" id="fig4-say"></p>
    </div>
  </div>
  <p class="f4-model">简化教学模型，不是完整的资本监管计算：贷款按 100%、准备金和国债按 0% 风险权重，以股东权益代替监管资本，只看 8% 总资本比率</p>
  <details class="tbl" id="fig4-tbl"><summary>表格视图：起点与三种情形</summary>
    <div class="tblx"><table>
      <thead><tr><th>情形</th><th>股东权益 ÷ 贷款净额</th><th>准备金占存款</th><th>还能新增的贷款</th></tr></thead>
      <tbody>
        <tr><td>起点</td><td class="n">约 16.67%</td><td class="n">约 13.33%</td><td class="n">6.5 亿</td></tr>
        <tr><td>新放 2 亿，存款留在本行</td><td class="n">12.5%</td><td>准备金 1.2 亿未动，存款 11 亿</td><td class="n">4.5 亿</td></tr>
        <tr><td>新放 0.4 亿，存款全部付到别家</td><td class="n">约 15.63%</td><td class="n">约 8.89%</td><td class="n">6.1 亿</td></tr>
        <tr><td>确认 0.2 亿信用损失</td><td class="n">约 13.79%</td><td class="n">约 13.33%</td><td class="n">4.2 亿</td></tr>
      </tbody>
    </table></div>
  </details>
  <p class="pf-note">教学模型用会计上的股东权益，只把贷款计入风险加权资产；真实规则用按监管口径算出的资本，各类资产按规则分别给权重，各比率分母不同。以联储监管的州注册会员银行为例：普通股一级资本 4.5%、一级资本 6%、总资本 8%（分母是风险加权资产），杠杆率 4%（分母是平均总合并资产减去扣除项）（eCFR，截至 2026-11-01）</p>
</figure>`
  }
};
