// S01-01 课程页配置：课文之外的部分（开场插图、图、读图说明）。由 site/tools/lesson-build/assemble.js 读取
const ctrl = '<div class="pf-ctrl"><button type="button" data-a="prev">上一步</button><button type="button" class="pri" data-a="next">下一步</button><button type="button" data-a="again">重来</button><span class="cnt"></span></div>';
const ink = 'stroke="currentColor" fill="none" stroke-width="3" stroke-linejoin="round" stroke-linecap="round"';
/* 一张 $100 纸币的线稿：只有边框、椭圆和面额，不仿印任何真实票面 */
const note = (x, y, r) => `<g transform="translate(${x} ${y}) rotate(${r})"><rect width="150" height="70" rx="4" class="nt"/><rect x="7" y="7" width="136" height="56" rx="2" ${ink} stroke-width="1.6"/><ellipse cx="75" cy="35" rx="17" ry="21" ${ink} stroke-width="1.6"/><text x="14" y="25" class="nv">$100</text><text x="136" y="58" class="nv" text-anchor="end">100</text></g>`;
module.exports = {
  md: require('path').join(__dirname, '..', 'S01-01 课文 v1 候选.md'),
  n: 1,
  q: '存款是实物保管，还是一笔债权？',
  goal: '能用 T 型账户说明存款是银行的负债，并区分现金、准备金与存款',
  desc: 'MarketPilot S01-01：存进银行的钱归银行所有，存款是银行欠你的一笔债。用 T 型账户看清现金、存款、准备金各是谁的负债，以及取现和转账时账上发生了什么。',
  scripts: [],
  hero: `    <figure class="h01 card" aria-labelledby="h01-cap">
      <div class="h01-pair">
        <div class="h01-it">
          <svg viewBox="0 -14 240 214" role="img" aria-label="一只钱包，露出两张 $100 纸币，合计 $200">
            ${note(38, 22, -9)}${note(62, 30, 5)}
            <path d="M22 92h196a10 10 0 0 1 10 10v78a10 10 0 0 1-10 10H22a10 10 0 0 1-10-10v-78a10 10 0 0 1 10-10z" class="wb"/>
            <path d="M12 118h146a16 16 0 0 1 16 16v4a16 16 0 0 1-16 16H12" ${ink}/>
            <circle cx="154" cy="136" r="5" fill="currentColor"/>
            <text x="200" y="176" class="wt" text-anchor="end">$200</text>
          </svg>
          <p class="h01-tag"><span>钱包里的 $200</span><b>联储欠持有人</b></p>
        </div>
        <div class="h01-ne" aria-hidden="true">≠</div>
        <div class="h01-it">
          <svg viewBox="0 -14 240 214" role="img" aria-label="一部手机，屏幕上写着：河岸银行，余额 $3,500">
            <rect x="66" y="6" width="108" height="188" rx="18" class="wb"/>
            <rect x="75" y="24" width="90" height="152" rx="6" ${ink} stroke-width="1.6"/>
            <path d="M108 14h24" ${ink} stroke-width="2.4"/>
            <text x="120" y="56" class="ps" text-anchor="middle">河岸银行</text>
            <path d="M84 66h72" ${ink} stroke-width="1.2"/>
            <text x="120" y="94" class="ps2" text-anchor="middle">余额</text>
            <rect x="82" y="104" width="76" height="30" rx="6" class="hl"/>
            <text x="120" y="126" class="pv" text-anchor="middle">$3,500</text>
            <circle cx="120" cy="184" r="4" ${ink} stroke-width="1.6"/>
          </svg>
          <p class="h01-tag"><span>手机里的 $3,500</span><b>河岸银行欠小林</b></p>
        </div>
      </div>
      <figcaption id="h01-cap">同样叫美元，欠债的人不同</figcaption>
    </figure>`,
  credits: `  <p class="credits">开场插图与本课的图均为原创示意。小林、河岸银行、松石银行是虚构的教学例子。</p>`,
  notes: `      <div><b>读图</b><span class="sw" style="background:var(--ink)"></span>墨黑：账上的数<br><span class="sw" style="background:var(--lime);box-shadow:inset 0 0 0 1px var(--ink)"></span>荧光：这一步变动的行<br><span class="sw" style="background:var(--vio)"></span>紫色：减少的数</div>
      <div><b>T 型账户</b>左边是资产，右边是负债和权益，两边永远相等。同一笔钱，在持有人账上记左边，在欠债人账上记右边</div>
      <div><b>例子</b>小林、河岸银行、松石银行都是虚构的教学例子。银行的科目经过简化，比例只作示意</div>`,
  figs: {
    1: `<figure class="pf" id="fig1" aria-labelledby="fig1-t">
  <figcaption class="pf-hd"><span class="flab">图 1</span><span id="fig1-t">谁欠谁</span><span class="kind">分类练习</span></figcaption>
  <p class="pf-desc" id="fig1-d">先点一张卡片，再点它的欠债人。用键盘时：Tab 选到卡片按 Enter，再 Tab 到欠债人按 Enter</p>
  <div class="f1-play" id="fig1-play">
    <div class="pf-stage f1-cards" role="group" aria-label="六张卡片" aria-describedby="fig1-d"></div>
    <div class="f1-bins" role="group" aria-label="四个欠债人"></div>
    <p class="f1-fb" id="fig1-fb" aria-live="polite">先选一张卡片</p>
    <div class="pf-ctrl"><button type="button" class="pri" data-a="key" hidden>看答案</button><button type="button" data-a="again">重来</button><span class="cnt" id="fig1-cnt"></span></div>
  </div>
  <div class="f1-key" id="fig1-key" hidden>
    <div class="tblw"><table class="bs"><caption class="sr">六张卡片各是谁的负债</caption><thead><tr><th>联储</th><th>财政部</th><th>河岸银行</th><th>松石银行</th></tr></thead><tbody><tr><td>钱包里的 $20 纸币<br>河岸银行在联储的准备金<br>河岸银行金库里的一沓纸币</td><td>一枚 25 美分硬币</td><td>小林在河岸银行的存款</td><td>房东在松石银行的存款</td></tr></tbody></table></div>
  </div>
  <p class="pf-note">易错的一张：金库里的纸币由河岸银行持有，欠债的却是联储</p>
</figure>`,
    2: `<figure class="pf" id="fig2" aria-labelledby="fig2-t">
  <figcaption class="pf-hd"><span class="flab">图 2</span><span id="fig2-t">四张账一起动</span><span class="kind model">简化模型</span></figcaption>
  <p class="pf-desc">小林这个月的四笔账。每一步只有亮起的行在变，单位：美元</p>
  <div class="pf-stage f2" aria-label="四张 T 型账户">
    <p class="f2-say" id="fig2-say"></p>
    <div class="f2-sw"><button type="button" id="fig2-alt" aria-pressed="false" hidden>如果房东也在河岸银行</button></div>
    <div class="f2-tier one"><section class="ta" id="ta-xl" aria-label="小林的账"></section></div>
    <div class="f2-tier two"><section class="ta" id="ta-river" aria-label="河岸银行的账"></section><section class="ta" id="ta-pine" aria-label="松石银行的账"></section></div>
    <div class="f2-tier one"><section class="ta" id="ta-fed" aria-label="联储的账"></section></div>
  </div>
  <div class="pf-now" aria-live="polite"></div>
  ${ctrl}
  <ol class="pf-steps"></ol>
  <details class="tbl" id="fig2-tbl"><summary>四步汇总表</summary><div class="tblw" id="fig2-sum"></div></details>
  <p class="pf-note">银行只列与本例有关的行，证券和贷款合成「其他资产」；联储只列本例两家银行的准备金和本例换出的纸币</p>
</figure>`,
    3: `<figure class="pf" id="fig3" aria-labelledby="fig3-t">
  <figcaption class="pf-hd"><span class="flab">图 3</span><span id="fig3-t">一家银行的资产负债表</span><span class="kind model">虚构银行</span></figcaption>
  <p class="pf-desc">河岸银行，总资产 10 亿美元。点按或悬停每一段，看它是谁欠谁的</p>
  <div class="pf-stage f3">
    <div class="f3-col"><p class="f3-h">资产</p><div class="f3-bar" id="fig3-a"><div class="f3-liq" aria-hidden="true"><span>随时可用：13%</span></div></div></div>
    <div class="f3-col"><p class="f3-h">负债与股东权益</p><div class="f3-bar" id="fig3-l"></div></div>
  </div>
  <p class="verdict" id="fig3-out" aria-live="polite">点一段，看它是谁欠谁的</p>
  <ul class="f3-all" id="fig3-all"></ul>
  <p class="pf-note">虚构银行，简化科目，比例只作示意</p>
</figure>`
  }
};
