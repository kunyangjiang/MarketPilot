/* MarketPilot 站点外壳：首页、课程目录、故事与路由。
 * 渲染逻辑取自统一样稿 design-exploration/index.html，改动：
 *   - 已写好的课（catalog.js 的 MP.readable）链接到课程页 lessons/<课号>/；其余的课只列标题、不链接，不挂任何状态标签；
 *   - 地址片段可以直接定位：#courses、#layer-1…#layer-4、#S01…#S11（阶段）、#S02-02（某一课所在的行）；
 *   - 所有链接都是相对路径，站点部署在根路径或子路径下都成立。 */
(function () {
  const MP = window.MP, PH = window.PH;
  const $ = id => document.getElementById(id);
  const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;');
  const readable = MP.lessons.filter(l => l.readable);
  const toneCls = k => PH[k].tone === 'color' ? 'col' : '';
  const img = (id, k, pos) => { const e = $(id); e.src = PH[k].src; if (toneCls(k)) e.classList.add('col'); if (pos) e.style.objectPosition = pos; };
  const lessonNo = id => Number(id.slice(4));

  /* ===== 首页 ===== */
  $('h-intro').textContent = MP.lessons.length + ' 课，按四个层级展开。每一课都从一个具体的故事开始，落到一个可以验证的机制上。';
  img('h-p1', 'tuna', '40% 50%');
  $('h-all').textContent = '全部 ' + MP.lessons.length + ' 课 →';
  const cover = {
    'S01-01': l => '<div class="shot"><img src="' + PH.abbottRoof.src + '" alt="" style="object-position:50% 55%"></div>',
    'S09-03': l => '<div class="shot"><img src="' + PH.panic1907.src + '" alt="" style="object-position:50% 40%"></div>'
  };
  // 首页「从这里开始」：S01-01 是第一课，S09-03 从一个故事读起；其余已写好的课从课程目录和搜索进入
  $('h-now').innerHTML = readable.filter(l => cover[l.id]).map(l => '<a href="' + MP.readable[l.id].href + '">' + cover[l.id](l) +
    '<div class="tx"><span class="lab">' + l.id + ' · ' + l.stage.id + ' ' + esc(l.stage.name) + '</span><b>' + esc(l.t) + '</b><p>' + esc(MP.readable[l.id].q) + '</p></div></a>').join('');
  /* 继续阅读：课程页把「读到哪一节、读了多少」记在本机（localStorage mp.lastRead）。没有记录或存储不可用时整块不显示；
     读完一课（进度 ≥ 97%）时改为推荐目录顺序里的下一课 */
  function renderContinue() {
    let rec = null;
    try { rec = JSON.parse(localStorage.getItem('mp.lastRead') || 'null'); } catch (e) { rec = null; }
    const sec = $('h-cont-sec'), box = $('h-cont');
    const l = rec && MP.lessons.find(x => x.id === rec.id && x.readable);
    if (!l) { sec.hidden = true; return; }
    const done = rec.p >= 0.97, next = done && readable[readable.indexOf(l) + 1];
    const pct = Math.round(Math.min(1, Math.max(0, +rec.p || 0)) * 100);
    const secOk = /^[\w-]+$/.test(rec.sec || '');
    let go, lab, title, line, cta;
    if (next) {
      go = MP.readable[next.id].href; lab = '上次读完了 ' + l.id + ' · 下一课'; title = next.t; line = MP.readable[next.id].q; cta = '开始下一课 →';
    } else {
      go = MP.readable[l.id].href + (secOk && !done ? '#' + rec.sec : ''); lab = l.id + ' · ' + l.stage.id + ' ' + l.stage.name; title = l.t;
      line = done ? '已经读完' : (rec.st ? '读到：' + rec.st : '');
      cta = done ? '再读一遍 →' : '从这里继续 →';
    }
    box.innerHTML = '<a class="cont" href="' + esc(go) + '"><span class="lab">' + esc(lab) + '</span><b>' + esc(title) + '</b>' +
      (line ? '<p>' + esc(line) + '</p>' : '') +
      (next ? '' : '<span class="cbar" role="img" aria-label="已读约 ' + pct + '%"><i style="width:' + pct + '%"></i></span>') +
      '<span class="go">' + cta + '</span></a>';
    sec.hidden = false;
  }
  renderContinue();
  addEventListener('pageshow', e => { if (e.persisted) renderContinue(); });
  $('h-lsum').textContent = MP.layers.length + ' 层 · ' + MP.stages.length + ' 个阶段 · ' + MP.lessons.length + ' 课';
  $('h-layers').innerHTML = MP.layers.map((L, i) => {
    const ls = MP.lessons.filter(l => l.layer === i);
    return '<a class="lrow" href="#layer-' + (i + 1) + '"><span class="n">' + MP.layerLabel(i) + '</span><span><b>' + esc(L.name) + '</b><small>' + L.stages.map(s => s.id + ' ' + esc(s.name)).join(' · ') + '</small></span><span class="c">' + L.stages.length + ' 个阶段 · ' + ls.length + ' 课' + '</span><span class="ar" aria-hidden="true">→</span></a>';
  }).join('');
  img('h-p2', 'strand1915', '50% 84%'); $('h-p2cap').textContent = PH.strand1915.cap;
  $('h-cr').innerHTML = PH.credits(['tuna', 'abbottRoof', 'panic1907', 'strand1915']);

  /* ===== 故事 ===== */
  img('s-p1', 'strand1915', '50% 84%'); $('s-p1cap').textContent = PH.strand1915.cap;
  $('s-cr').innerHTML = PH.credits(['strand1915']);

  /* ===== 课程目录 ===== */
  img('c-p1', 'abbottRoof', '50% 40%');
  const bands = ['melons', 'abbottSkyline', 'crowd29c', 'chicagoTrains'], bandPos = ['50% 52%', '50% 45%', '50% 45%', '50% 30%'];
  $('c-list').innerHTML = MP.layers.map((L, li) => {
    const n = MP.lessons.filter(l => l.layer === li).length, k = bands[li];
    return '<section class="cl-layer" id="layer-' + (li + 1) + '" aria-labelledby="layer-' + (li + 1) + '-h">' +
      '<div class="cl-band"><img class="' + toneCls(k) + '" src="' + PH[k].src + '" alt="" style="object-position:' + bandPos[li] + '"><span class="credit">' + PH[k].lic + '</span>' +
      '<header class="cl-lh"><span class="cl-ln">' + MP.layerLabel(li) + '</span><h2 id="layer-' + (li + 1) + '-h">' + esc(L.name) + '</h2><span class="cl-lc">' + n + ' 课</span></header></div>' +
      '<div class="cl-body">' + L.stages.map(s => {
        return '<details class="cl-stage" id="' + s.id + '"><summary><span class="cl-sid">' + s.id + '</span><span class="cl-sn">' + esc(s.name) + '</span><span class="cl-meta">' + s.lessons.length + ' 课</span><span class="cl-chev" aria-hidden="true"></span></summary><ol>' +
          s.lessons.map(l => {
            const inner = '<span class="cl-id">' + l.id + '</span><span class="cl-t">' + esc(l.t) + '</span><span class="cl-f">' + esc(l.f) + '</span>';
            return l.readable
              ? '<li class="on" id="' + l.id + '"><a href="' + MP.readable[l.id].href + '" data-stage="' + s.id + '">' + inner + '</a></li>'
              : '<li class="plan" id="' + l.id + '"><span>' + inner + '</span></li>';
          }).join('') + '</ol></details>';
      }).join('') + '</div></section>';
  }).join('');
  $('c-jump').innerHTML = MP.layers.map((L, i) => '<a href="#layer-' + (i + 1) + '">' + MP.layerLabel(i) + ' · ' + esc(L.name) + '</a>').join('');
  $('c-cr').innerHTML = PH.credits(['abbottRoof', ...bands]);
  /* 从目录进入一课前，把当前地址换成该课所在的阶段：读完按"返回"会回到这个阶段（阶段保持收起） */
  $('c-list').addEventListener('click', e => {
    const a = e.target.closest('a[data-stage]');
    if (a) history.replaceState(null, '', '#' + a.dataset.stage);
  });


  /* ===== 路由 ===== */
  const TITLE = { home: 'MarketPilot', courses: '课程 · MarketPilot', stories: '故事 · MarketPilot' };
  function route(hash) {
    const id = decodeURIComponent((hash || '').replace(/^#/, ''));
    if (!id || id === 'home' || id === 'main') return { scr: 'home' };
    if (id === 'courses' || id === 'stories') return { scr: id };
    if (/^layer-[1-4]$/.test(id)) return { scr: 'courses', target: id };
    const st = MP.stages.find(s => s.id === id);
    if (st) return { scr: 'courses', target: id, stage: id };
    const ls = MP.lessons.find(l => l.id === id);
    if (ls) return { scr: 'courses', target: id, stage: ls.stage.id, lesson: id };
    return { scr: 'home' };
  }
  MP.route = route;
  function show(e) {
    const r = route(location.hash);
    const first = !e || e.type === 'pageshow'; // 直接打开带 # 的地址：立即定位；页内点击：沿用页面的平滑滚动（减少动态效果时为立即）
    document.querySelectorAll('[data-screen]').forEach(s => { s.hidden = s.dataset.screen !== r.scr; });
    document.querySelectorAll('.mainnav a').forEach(a => a.toggleAttribute('aria-current', a.dataset.sec === r.scr));
    document.title = TITLE[r.scr];
    document.querySelectorAll('.cl-stage li.hit').forEach(li => li.classList.remove('hit'));
    /* 阶段默认全部收起：刷新、返回都一样。只有指向某一课的地址（如 #S02-02）才展开它所在的阶段，好让那一行看得见 */
    if (!e || e.type === 'pageshow') document.querySelectorAll('.cl-stage[open]').forEach(d => { if (d.id !== (r.lesson && r.stage)) d.open = false; });
    if (r.lesson) $(r.stage).open = true;
    if (r.lesson) $(r.lesson).classList.add('hit');
    const t = r.target && $(r.target);
    if (t) requestAnimationFrame(() => t.scrollIntoView(first ? { block: 'start', behavior: 'instant' } : { block: 'start' }));
    else window.scrollTo({ top: 0, behavior: 'instant' });
  }
  addEventListener('hashchange', show);
  /* 从课程页按「返回」时浏览器可能直接恢复旧页面（连同展开状态）：重新按地址收起 */
  addEventListener('pageshow', e => { if (e.persisted) show(e); });
  /* "跳到正文"不改地址（否则会切回首页），只把焦点移到当前栏目 */
  document.querySelector('.skip').addEventListener('click', e => {
    e.preventDefault();
    const m = document.querySelector('[data-screen]:not([hidden])');
    m.setAttribute('tabindex', '-1'); m.focus();
  });
  show();
})();
