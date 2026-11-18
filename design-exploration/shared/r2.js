/* MarketPilot 设计探索 · 第 2 轮 · 共用辅助
 * 只提供数据和"语义化 HTML"，不带任何外观。六个方向各自用 CSS 决定样子。
 * 课程标题来自 catalog-data.js（只读摘自课程体系 v1.0）。
 * 注释来源取自 lessons/S02-02/S02-02-核验记录与自评.md 第四部分，状态标记照抄该文件。 */
(function () {
  const T = window.MP_TITLES || {};
  const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;');

  /* 课文注释（S02-02 核验记录中的来源与状态） */
  MP.notes = [
    { n: 1, mark: '✔', x: 'SEC, Atkins, <i>Statement Regarding Minimum Pricing Increments and Access Fee Caps</i>, 2026-06-11.', url: 'https://www.sec.gov/newsroom/speeches-statements/atkins-statement-minimum-pricing-increments-access-fee-caps-061126' },
    { n: 2, mark: '◐', x: '"真实交易所的连续交易大多以价格时间优先为基础"：依据 Nasdaq 文件中的价格/时间优先描述；"大多"尚未找到概括性来源，发布前须再核。', url: '' }
  ];
  MP.notesHTML = function (cls) {
    return '<ol class="' + (cls || 'notes') + '">' + MP.notes.map(n =>
      '<li id="fn' + n.n + '"><span class="fn-mark" title="核验状态">' + n.mark + '</span> ' + n.x +
      (n.url ? ' <a href="' + n.url + '" target="_blank" rel="noopener">原文</a>' : '') + '</li>').join('') + '</ol>';
  };
  MP.fn = n => '<sup class="fn"><a href="#fn' + n + '">' + n + '</a></sup>';

  /* 课文正文：开篇一节 + "屏幕上其实有三个数字"一节（均为原文）。figure 由各方向提供。 */
  MP.readerHTML = function (o) {
    o = o || {};
    let h = '<h2 id="sec1">一个被自己改写的"股价"</h2>' + MP.opening.filter(p => !/^-{3,}$/.test(p.trim())).map((p, i) => '<p' + (i === 0 && o.dropcap ? ' class="lead"' : '') + '>' + p + '</p>').join('');
    h += MP.lessonBlocks.map(b => {
      if (b.t === 'h2') return '<h2>' + b.x + '</h2>';
      if (b.t === 'p') return '<p>' + b.x + '</p>';
      if (b.t === 'ul') return '<ul>' + b.x.map(i => '<li>' + i + '</li>').join('') + '</ul>';
      if (b.t === 'pull') return o.pull ? o.pull(b.x) : '<p class="pull">' + b.x + '</p>';
      if (b.t === 'model') return '<aside class="kind kind-model"><span class="kind-tag">模型假设</span><p>' + b.x + MP.fn(2) + '</p></aside>';
      if (b.t === 'reg') return '<aside class="kind kind-reg"><span class="kind-tag">时效性规则 · 截至 ' + b.date + '</span><p>' + b.x + MP.fn(1) + '</p></aside>';
      if (b.t === 'figure') return o.figure ? o.figure() : '';
      return '';
    }).join('\n');
    return h;
  };

  /* 章节目录 */
  MP.tocHTML = function (cls) {
    return '<ol class="' + (cls || 'toc') + '">' + MP.lesson.toc.map((t, i) =>
      '<li' + (i === MP.lesson.tocActive ? ' aria-current="true"' : '') + '><span class="toc-n">' + String(i + 1).padStart(2, '0') + '</span><span class="toc-t">' + t + '</span></li>').join('') + '</ol>';
  };

  /* 全部课程：平静的目录。阶段用 <details>，默认只展开 S02、S09。 */
  MP.courseList = function (o) {
    o = o || {};
    const open = o.open || ['S02', 'S09'];
    let h = '<div class="cl">';
    MP.layers.forEach((L, li) => {
      const rows = MP.all.filter(r => r.stage.layer === li);
      h += '<section class="cl-layer" data-layer="' + li + '"><header class="cl-lh"><span class="cl-ln">第' + L.n + '层</span><h3>' + esc(L.name) + '</h3><span class="cl-lc">' + rows.reduce((s, r) => s + r.lessons.length, 0) + ' 课</span></header>';
      rows.forEach(r => {
        const readable = r.lessons.filter(l => l.status !== 'unpublished').length;
        h += '<details class="cl-stage"' + (open.indexOf(r.stage.id) > -1 ? ' open' : '') + '><summary><span class="cl-sid">' + r.stage.id + '</span><span class="cl-sn">' + esc(r.stage.name) + '</span><span class="cl-meta">' + (readable ? '<b>' + readable + ' 可读</b> · ' : '') + r.lessons.length + ' 课</span><span class="cl-chev" aria-hidden="true"></span></summary><ol>';
        r.lessons.forEach(l => {
          const t = T[l.id] ? T[l.id].t : '', f = T[l.id] ? T[l.id].f : '';
          const inner = '<span class="cl-id">' + l.id + '</span><span class="cl-t">' + esc(t) + '</span><span class="cl-f">' + esc(f) + '</span><span class="cl-st">' + MP.statusLabel[l.status] + '</span>';
          h += '<li class="' + l.status + '">' + (l.status === 'published' ? '<a href="#lesson">' + inner + '</a>' : l.status === 'preview' ? '<a href="#panel">' + inner + '</a>' : '<span aria-disabled="true">' + inner + '</span>') + '</li>';
        });
        h += '</ol></details>';
      });
      h += '</section>';
    });
    return h + '</div>';
  };
  MP.courseSummary = '61 课 · 已发布 1 · 预览 1 · 其余在写作中';

  /* 面板第 3 步的文字版 */
  MP.stepText = '小林的市价买单 600 股，第 3 步：已与 B 成交 200 股（$50.02）、与 C 成交 100 股（$50.03）、与 G 成交 200 股（$50.03），累计 500 股、$25,013，均价 $50.0260。还剩 100 股，下一笔将与 D 在 $50.04 成交。最新成交价现在是 $50.03（刚刚与 G 成交）。';

  MP.liqName = ['不能变现', '恐慌中要打大折', '恐慌中要打折', '能立即变现'];
})();
