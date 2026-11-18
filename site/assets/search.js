/* 全站搜索：沿用统一样稿的搜索面板（Ctrl K / ⌘ K，↑↓ 选择，Enter 打开，Esc 关闭；?search=词 直接打开）。
 * 索引来源：
 *   - 已写好的课：assets/search-index.js，由 tools/build-search-index.js 从课程页的读者可见正文生成，
 *     结果链接到课程页（标「课程」）及其中的小节（标「小节」，lessons/<课号>/#<小节>）；
 *   - 其余的课：只收课号和标题（catalog.js），标「目录」，没有摘要，选中后只跳到课程目录里它所在的那一行。
 * 结果按去向标注，不显示任何写作或开放状态。
 * 不收课文原稿、核验记录、内部说明或设计样稿里的文字。 */
(function () {
  const MP = window.MP;
  const $ = id => document.getElementById(id);
  const IDX = [];
  (window.MP_SEARCH || []).forEach(e => IDX.push({ type: 'c', ty: e.sec ? '小节' : '课程', title: e.title, where: e.where, text: e.text, href: e.href }));
  MP.lessons.filter(l => !l.readable).forEach(l => IDX.push({
    type: 'p', ty: '目录', title: l.id + ' ' + l.t,
    where: l.stage.id + ' ' + l.stage.name,
    text: l.t, href: '#' + l.id
  }));
  MP.searchIndex = IDX;
  let SEL = 0, RES = [];
  const dlg = $('search'), qi = $('s-q');
  const esc = s => String(s).replace(/[&<]/g, c => c === '&' ? '&amp;' : '&lt;');
  const norm = s => s.toLowerCase();
  function hl(s, q) { if (!q) return esc(s); const i = norm(s).indexOf(norm(q)); return i < 0 ? esc(s) : esc(s.slice(0, i)) + '<mark>' + esc(s.slice(i, i + q.length)) + '</mark>' + esc(s.slice(i + q.length)); }
  function excerpt(t, q) { const i = norm(t).indexOf(norm(q)); if (i < 0) return t.slice(0, 70) + (t.length > 70 ? '…' : ''); const a = Math.max(0, i - 28); return (a ? '…' : '') + t.slice(a, i + q.length + 46) + (i + q.length + 46 < t.length ? '…' : ''); }
  function find(q) {
    const k = norm(q);
    const hits = IDX.filter(r => norm(r.title + ' ' + r.text).includes(k));
    /* 课程正文的结果排在目录条目前面；同类里标题命中的排在前面 */
    const score = r => (r.type === 'c' ? 0 : 2) + (norm(r.title).includes(k) ? 0 : 1);
    return hits.map((r, i) => [r, i]).sort((a, b) => score(a[0]) - score(b[0]) || a[1] - b[1]).map(x => x[0]);
  }
  MP.searchFind = find;
  const SUG = ['订单簿', '最新成交价', '1907', '挤兑', '清算所'];
  function runSearch() {
    const q = qi.value.trim();
    const hits = q ? find(q) : [];
    RES = hits; SEL = 0;
    if (!q) {
      $('s-state').innerHTML = '<h3>搜索课程</h3><div class="s-sug">' + SUG.map(x => '<button type="button" data-q="' + x + '">' + x + '</button>').join('') + '</div>';
      $('s-list').innerHTML = ''; $('s-live').textContent = ''; qi.removeAttribute('aria-activedescendant'); return;
    }
    if (!RES.length) {
      $('s-state').innerHTML = '<h3>没有找到「' + esc(q) + '」</h3>' +
        '<div class="s-sug">' + ['订单簿', '1907', '价差'].map(x => '<button type="button" data-q="' + x + '">' + x + '</button>').join('') + '<a class="btn" href="#courses" style="padding:5px 12px;font-size:13px" data-close>浏览课程目录</a></div>';
      $('s-list').innerHTML = ''; $('s-live').textContent = '没有结果'; qi.removeAttribute('aria-activedescendant'); return;
    }
    $('s-state').innerHTML = '';
    $('s-list').innerHTML = RES.map((r, i) => '<li role="option" id="sr-' + i + '" class="' + (r.type === 'p' ? 'plan' : '') + '" aria-selected="' + (i === SEL) + '" data-i="' + i + '" data-href="' + esc(r.href) + '"><span class="ty ' + r.type + '">' + r.ty + '</span><span><b>' + hl(r.title, q) + '</b><span class="where">' + esc(r.where) + '</span>' + (r.type === 'c' ? '<p>' + hl(excerpt(r.text, q), q) + '</p>' : '') + '</span></li>').join('');
    qi.setAttribute('aria-activedescendant', 'sr-0'); $('s-live').textContent = RES.length + ' 条结果';
  }
  function move(d) { if (!RES.length) return; SEL = (SEL + d + RES.length) % RES.length; $('s-list').querySelectorAll('li').forEach((li, i) => li.setAttribute('aria-selected', i === SEL)); qi.setAttribute('aria-activedescendant', 'sr-' + SEL); $('sr-' + SEL).scrollIntoView({ block: 'nearest' }); }
  function go(i) {
    const r = RES[i]; if (!r) return;
    dlg.close();
    if (r.href.charAt(0) === '#') location.hash = r.href; else location.href = r.href;
  }
  let opener = null;
  function openSearch(q) { opener = document.activeElement; if (!dlg.open) dlg.showModal(); if (q != null) qi.value = q; runSearch(); qi.focus(); qi.select(); }
  MP.openSearch = openSearch;
  dlg.addEventListener('close', () => { opener && opener.focus && opener.focus(); });
  $('s-open').onclick = () => openSearch();
  $('s-close').onclick = () => dlg.close();
  dlg.addEventListener('click', e => {
    if (e.target === dlg) { dlg.close(); return; }
    const b = e.target.closest('button,li,a'); if (!b) return;
    if (b.dataset.q) { qi.value = b.dataset.q; runSearch(); qi.focus(); }
    else if (b.matches('li[role=option]')) go(+b.dataset.i);
    else if (b.hasAttribute('data-close')) dlg.close();
  });
  qi.addEventListener('input', runSearch);
  qi.addEventListener('keydown', e => { if (e.key === 'ArrowDown') { e.preventDefault(); move(1); } else if (e.key === 'ArrowUp') { e.preventDefault(); move(-1); } else if (e.key === 'Enter') { e.preventDefault(); go(SEL); } });
  addEventListener('keydown', e => { if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); dlg.open ? dlg.close() : openSearch(); } });
  if (/Mac|iPhone|iPad/.test(navigator.platform || navigator.userAgent)) { $('kbd').textContent = '⌘ K'; $('s-open').setAttribute('aria-keyshortcuts', 'Meta+K'); }
  /* 课程页页头的搜索按钮链接到 ../../?search= ，在这里打开面板 */
  const P = new URLSearchParams(location.search);
  if (P.has('search')) {
    openSearch(P.get('search'));
    /* 打开后把 ?search= 从地址里去掉，刷新页面时不会再次弹出 */
    history.replaceState(null, '', location.pathname + location.hash);
  }
})();
