/* S02-02 阅读体验：目录随滚动高亮当前一节、点目录平滑跳转并把焦点移到该节标题、顶部阅读进度条。
 * 系统开启“减少动态效果”时，跳转不做平滑滚动。
 * 各课共用：另把「读到哪一节、读了多少」记在本机浏览器（localStorage mp.lastRead），首页的「继续阅读」用它；存储不可用时什么也不做。 */
(function () {
  'use strict';
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)');
  const links = [...document.querySelectorAll('#toc a[href^="#"]')];
  const items = links.map(a => ({ a, el: document.getElementById(a.getAttribute('href').slice(1)) })).filter(x => x.el);
  const article = document.getElementById('lesson-body');
  const bar = document.getElementById('rprog');
  const OFFSET = 110; // 吸顶页头高度 + 余量

  /* ---------- 阅读进度：只存在本机 ---------- */
  const LESSON = (location.pathname.match(/lessons\/(S\d\d-\d\d)\//) || [])[1];
  const h1 = document.querySelector('h1');
  let prog = 0, saved = '';
  const secTitle = a => { const c = a.cloneNode(true); c.querySelectorAll('.n').forEach(n => n.remove()); return c.textContent.replace(/\s+/g, ' ').trim(); };
  function save() {
    if (!LESSON || !current) return;
    const rec = { id: LESSON, t: h1 ? h1.textContent.trim() : '', sec: current.a.getAttribute('href').slice(1), st: secTitle(current.a), p: Math.round(prog * 100) / 100, ts: Date.now() };
    const key = rec.sec + rec.p;
    if (key === saved) return;
    saved = key;
    try { localStorage.setItem('mp.lastRead', JSON.stringify(rec)); } catch (e) { /* 隐私模式等：不记录 */ }
  }
  let timer = 0;
  const saveSoon = () => { clearTimeout(timer); timer = setTimeout(save, 800); };
  addEventListener('pagehide', save);
  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'hidden') save(); });

  let current = null;
  function update() {
    // 当前一节：标题已经越过页头下沿的最后一节
    let cur = items[0];
    for (const it of items) { if (it.el.getBoundingClientRect().top - OFFSET <= 0) cur = it; else break; }
    if (cur !== current) {
      if (current) current.a.removeAttribute('aria-current');
      if (cur) cur.a.setAttribute('aria-current', 'location');
      current = cur;
    }
    if (bar && article) {
      const r = article.getBoundingClientRect();
      const total = r.height - window.innerHeight + OFFSET;
      const p = total > 0 ? Math.min(1, Math.max(0, (OFFSET - r.top) / total)) : 0;
      if (p > prog) prog = p;
      bar.style.transform = 'scaleX(' + p.toFixed(4) + ')';
    }
    saveSoon();
  }
  let ticking = false;
  const onScroll = () => { if (!ticking) { ticking = true; requestAnimationFrame(() => { ticking = false; update(); }); } };
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll);
  update();

  // 点目录：平滑滚动（减少动态效果时直接跳），滚完把焦点交给该节标题，方便键盘和读屏用户接着读。
  links.forEach(a => a.addEventListener('click', e => {
    const id = a.getAttribute('href').slice(1), sec = document.getElementById(id);
    if (!sec) return;
    e.preventDefault();
    const head = sec.querySelector('h2,h3') || sec;
    if (!head.hasAttribute('tabindex')) head.setAttribute('tabindex', '-1');
    sec.scrollIntoView({ behavior: reduce.matches ? 'auto' : 'smooth', block: 'start' });
    history.replaceState(null, '', '#' + id);
    const focusIt = () => head.focus({ preventScroll: true });
    if (reduce.matches) focusIt(); else setTimeout(focusIt, 450);
  }));
})();
