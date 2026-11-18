/* 本课的分步控件与小题（由 S09-03 的 steps.js 和 S02-02 的小题改写，每课各存一份，不是共享框架）。
 * 分步图：<figure class="pf"> 内有 .pf-stage、.pf-now（aria-live）、.pf-ctrl（上一步 / 下一步 / 重来）、.pf-steps（静态版列表）。
 * 不自动播放。系统开启“减少动态效果”、打印或导出 PDF 时，一次显示全部内容，并列出全部步骤。 */
(function () {
  'use strict';
  const reduceMq = window.matchMedia('(prefers-reduced-motion: reduce)');
  let MODE = reduceMq.matches ? 'static' : 'step';
  const all = [];

  /**
   * @param {HTMLElement} el  figure.pf
   * @param {object} cfg      steps: [{label, what, why, learn}]；render(step, isStatic)；可选 first（第一步的编号）、after(step)
   */
  function stepper(el, cfg) {
    const n = cfg.steps.length, first = cfg.first || 1;
    const now = el.querySelector('.pf-now');
    const cnt = el.querySelector('.pf-ctrl .cnt');
    const prev = el.querySelector('[data-a=prev]'), next = el.querySelector('[data-a=next]'), again = el.querySelector('[data-a=again]');
    const list = el.querySelector('.pf-steps');
    let step = 0;
    if (list) list.innerHTML = cfg.steps.map((s, i) => '<li><b>' + (i + first) + '</b><span><strong>' + s.label + '</strong>　' + s.what + ' ' + s.why + ' <em>' + s.learn + '</em></span></li>').join('');
    function explain(i) {
      const s = cfg.steps[i];
      return '<span class="nb">' + (i + first) + '</span><strong>' + s.label + '</strong>' +
        '<span class="w1"><b>发生了什么</b>' + s.what + '</span>' +
        '<span class="w1"><b>为什么</b>' + s.why + '</span>' +
        '<span class="w1 lrn"><b>要看出什么</b>' + s.learn + '</span>';
    }
    function show(i) {
      step = Math.max(0, Math.min(n - 1, i));
      el.dataset.step = String(step + 1);
      cfg.render(step, false);
      if (now) now.innerHTML = explain(step);
      if (cnt) cnt.textContent = (step + first) + ' / ' + (n + first - 1);
      if (prev) prev.disabled = step === 0;
      if (next) next.disabled = step === n - 1;
      if (cfg.after) cfg.after(step, { prev, next });
    }
    if (prev) prev.addEventListener('click', () => show(step - 1));
    if (next) next.addEventListener('click', () => show(step + 1));
    if (again) again.addEventListener('click', () => { if (cfg.reset) cfg.reset(); show(0); if (next) next.focus(); });
    const api = {
      el, show, get step() { return step; },
      apply() { if (MODE === 'static') { el.dataset.step = 'static'; cfg.render(n - 1, true); } else show(step); }
    };
    all.push(api); api.apply();
    return api;
  }

  /* 按步显示：[data-s] 的元素在第 s 步之前变淡，在第 s 步高亮 */
  function reveal(root, step1, isStatic) {
    root.querySelectorAll('[data-s]').forEach(e => {
      const s = +e.dataset.s;
      e.classList.toggle('off', !isStatic && step1 < s);
      e.classList.toggle('cur', !isStatic && step1 === s);
    });
  }

  const listeners = [];
  function setMode(m) {
    MODE = m;
    document.body.classList.toggle('static', m === 'static');
    all.forEach(s => s.apply());
    listeners.forEach(f => f(m === 'static'));
  }
  reduceMq.addEventListener('change', e => setMode(e.matches ? 'static' : 'step'));
  let before = null;
  window.addEventListener('beforeprint', () => { before = MODE; if (MODE !== 'static') setMode('static'); });
  window.addEventListener('afterprint', () => { if (before && before !== 'static') setMode(before); before = null; });
  document.body.classList.toggle('static', MODE === 'static');

  /* ---------- 小题：题干、提示、答案都取自页面上的课文原文 ---------- */
  function quiz(el, qi) {
    const right = +el.dataset.answer;
    const opts = [...el.querySelectorAll('.opts li')];
    const hint = el.querySelector('.qhint'), ans = el.querySelector('.qans');
    const name = 'quiz-' + (el.id || qi);
    const qq = el.querySelector('.qq');
    qq.id = qq.id || name + '-q';
    const group = document.createElement('div');
    group.className = 'opts'; group.setAttribute('role', 'radiogroup'); group.setAttribute('aria-labelledby', qq.id);
    group.innerHTML = opts.map((li, i) => '<label><input type="radio" name="' + name + '" value="' + i + '"> <span>' + li.innerHTML + '</span></label>').join('');
    el.querySelector('ul.opts').replaceWith(group);
    const bar = document.createElement('div'); bar.className = 'qa';
    bar.innerHTML = '<button type="button" data-a="check">提交</button><button type="button" class="ghost" data-a="show">看答案</button>';
    group.after(bar);
    const fb = document.createElement('p'); fb.className = 'fb'; fb.setAttribute('aria-live', 'polite'); fb.hidden = true;
    bar.after(fb);
    const labels = [...group.querySelectorAll('label')];
    el.classList.add('js');
    const showAns = () => { hint.hidden = true; ans.hidden = false; labels[right].classList.add('right'); };
    el.addEventListener('click', e => {
      const b = e.target.closest('button'); if (!b) return;
      const sel = group.querySelector('input:checked');
      labels.forEach(l => l.classList.remove('right', 'wrong'));
      if (b.dataset.a === 'show') { fb.hidden = true; showAns(); el.dataset.state = 'shown'; return; }
      if (!sel) { fb.hidden = false; fb.textContent = '先选一个答案。'; return; }
      if (+sel.value === right) {
        fb.hidden = false; fb.innerHTML = '<b>答对了。</b>';
        showAns(); el.dataset.state = 'right';
      } else {
        sel.closest('label').classList.add('wrong');
        ans.hidden = true; hint.hidden = false;
        fb.hidden = false; fb.innerHTML = '<b>不对，再想想。</b>看看下面的提示，改选后再点「提交」；想直接看答案，点「看答案」。';
        el.dataset.state = 'wrong';
      }
    });
    group.addEventListener('change', () => { labels.forEach(l => l.classList.remove('wrong')); });
  }

  /* 开放题：不判对错。输入框只留在本页，不提交、不保存 */
  function openQuiz(el) {
    const hint = el.querySelector('.qhint'), ans = el.querySelector('.qans');
    const qq = el.querySelector('.qq');
    qq.id = qq.id || el.id + '-q';
    const box = document.createElement('div');
    box.innerHTML = '<textarea id="' + el.id + '-t" aria-labelledby="' + qq.id + '" placeholder="可以先写下你的想法（可不填）"></textarea><p class="tnote">写下的内容只留在这个页面上，不会提交或保存。</p>';
    qq.after(box);
    const bar = document.createElement('div'); bar.className = 'qa';
    bar.innerHTML = '<button type="button" class="ghost" data-a="hint" aria-expanded="false">看提示</button><button type="button" data-a="show" aria-expanded="false">看参考答案</button>';
    box.after(bar);
    el.classList.add('js');
    el.addEventListener('click', e => {
      const b = e.target.closest('button'); if (!b) return;
      const t = b.dataset.a === 'hint' ? hint : ans;
      t.hidden = !t.hidden;
      b.setAttribute('aria-expanded', String(!t.hidden));
      if (!t.hidden) el.dataset.state = b.dataset.a === 'hint' ? 'hint' : 'shown';
    });
  }

  document.querySelectorAll('.quiz[data-answer]').forEach(quiz);
  document.querySelectorAll('.quiz.open').forEach(openQuiz);

  window.LessonSteps = { stepper, reveal, setMode, mode: () => MODE, isStatic: () => MODE === 'static', onMode: f => listeners.push(f), all };
})();
