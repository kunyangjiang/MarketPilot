/* S09-03 分步控件（本课专用，不是共享框架）。
 * 结构约定：<figure class="pf" id="…"> 内有 .pf-stage、.pf-now（aria-live）、.pf-ctrl（上一步 / 下一步 / 重来）、.pf-steps（静态版列表）。
 * 不自动播放。静态模式（减少动态效果、打印、手动切换）下一次显示全部内容，并列出全部步骤。 */
(function () {
  'use strict';
  const reduceMq = window.matchMedia('(prefers-reduced-motion: reduce)');
  let MODE = reduceMq.matches ? 'static' : 'step';
  const all = [];

  /**
   * @param {HTMLElement} el   figure.pf
   * @param {object} cfg       steps: [{label, what, why, learn}]；render(step, isStatic)
   */
  function stepper(el, cfg) {
    const n = cfg.steps.length;
    const now = el.querySelector('.pf-now');
    const cnt = el.querySelector('.pf-ctrl .cnt');
    const prev = el.querySelector('[data-a=prev]'), next = el.querySelector('[data-a=next]'), again = el.querySelector('[data-a=again]');
    const list = el.querySelector('.pf-steps');
    let step = 0;
    if (list) list.innerHTML = cfg.steps.map((s, i) => '<li><b>' + (i + 1) + '</b><span><strong>' + s.label + '</strong>　' + s.what + ' ' + s.why + '<em>' + s.learn + '</em></span></li>').join('');
    function explain(i) {
      const s = cfg.steps[i];
      return '<span class="nb">' + (i + 1) + '</span><strong>' + s.label + '</strong>　' +
        '<span class="w1"><b>发生了什么</b>' + s.what + '</span>' +
        '<span class="w1"><b>为什么</b>' + s.why + '</span>' +
        '<span class="w1 lrn"><b>要看出什么</b>' + s.learn + '</span>';
    }
    function show(i) {
      step = Math.max(0, Math.min(n - 1, i));
      el.dataset.step = String(step + 1);
      cfg.render(step, false);
      if (now) now.innerHTML = explain(step);
      if (cnt) cnt.textContent = (step + 1) + ' / ' + n;
      if (prev) prev.disabled = step === 0;
      if (next) next.disabled = step === n - 1;
    }
    if (prev) prev.addEventListener('click', () => show(step - 1));
    if (next) next.addEventListener('click', () => show(step + 1));
    if (again) again.addEventListener('click', () => { show(0); next && next.focus(); });
    const api = {
      el, show, get step() { return step; },
      apply() { if (MODE === 'static') { el.dataset.step = 'static'; cfg.render(n - 1, true); } else show(step); }
    };
    all.push(api); api.apply();
    return api;
  }

  const modeBtn = document.getElementById('modebtn');
  function setMode(m) {
    MODE = m;
    document.body.classList.toggle('static', m === 'static');
    if (modeBtn) { modeBtn.setAttribute('aria-pressed', String(m === 'static')); modeBtn.textContent = m === 'static' ? '改看分步版' : '改看静态版'; }
    all.forEach(s => s.apply());
  }
  if (modeBtn) modeBtn.addEventListener('click', () => setMode(MODE === 'static' ? 'step' : 'static'));
  reduceMq.addEventListener('change', e => setMode(e.matches ? 'static' : 'step'));
  let before = null;
  window.addEventListener('beforeprint', () => { before = MODE; if (MODE !== 'static') setMode('static'); });
  window.addEventListener('afterprint', () => { if (before && before !== 'static') setMode(before); before = null; });
  document.body.classList.toggle('static', MODE === 'static');

  window.S0903Steps = { stepper, setMode, mode: () => MODE, all };
})();
