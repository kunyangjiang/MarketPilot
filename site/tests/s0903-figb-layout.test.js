/* 图 B 布局检查（宽、窄两套坐标 × 每一步）：节点框不重叠；连线不穿过无关节点框；
 * 会员在圈内、非会员在圈外；不出界；圈名 / 圈外说明 / 状态标记不压住节点。 */
'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const H = require('../lessons/S09-03/history.js');
function check(lay, STEP) {
const P = H.POS[lay], ring = P.ring;
  
  const box = id => H.boxOf(id, lay, STEP);
  const ids = Object.keys(H.NODES);
  const B = {}; ids.forEach(id => { B[id] = box(id); });
  const probs = [];
  const inter = (a, b, m) => a.x - a.w / 2 - m < b.x + b.w / 2 && b.x - b.w / 2 - m < a.x + a.w / 2 && a.y - a.h / 2 - m < b.y + b.h / 2 && b.y - b.h / 2 - m < a.y + a.h / 2;
  for (let i = 0; i < ids.length; i++) for (let j = i + 1; j < ids.length; j++) if (inter(B[ids[i]], B[ids[j]], 8)) probs.push('重叠 ' + ids[i] + ' ' + ids[j]);
  const corners = b => [[b.x - b.w / 2, b.y - b.h / 2], [b.x + b.w / 2, b.y - b.h / 2], [b.x - b.w / 2, b.y + b.h / 2], [b.x + b.w / 2, b.y + b.h / 2]];
  const inRing = ([x, y], m) => Math.hypot(x - ring.x, y - ring.y) <= ring.r - (m || 0);
  ids.forEach(id => {
    const n = H.NODES[id], b = B[id];
    if (b.x - b.w / 2 < 2 || b.x + b.w / 2 > P.w - 2 || b.y - b.h / 2 < 2 || b.y + b.h / 2 > P.h - 2) probs.push('出界 ' + id);
    const cs = corners(b);
    if (n.m === 'member' || n.m === 'hub') { if (!cs.every(c => inRing(c, 6))) probs.push('应在圈内 ' + id); }
    else if (!n.ghost && cs.some(c => inRing(c, -6))) probs.push('应在圈外 ' + id);
  });
  // 线段与矩形相交
  function segRect(a, b, r) {
    const x0 = r.x - r.w / 2 - 3, x1 = r.x + r.w / 2 + 3, y0 = r.y - r.h / 2 - 3, y1 = r.y + r.h / 2 + 3;
    let t0 = 0, t1 = 1; const dx = b[0] - a[0], dy = b[1] - a[1];
    for (const [p, q] of [[-dx, a[0] - x0], [dx, x1 - a[0]], [-dy, a[1] - y0], [dy, y1 - a[1]]]) {
      if (p === 0) { if (q < 0) return false; } else { const t = q / p; if (p < 0) { if (t > t1) return false; if (t > t0) t0 = t; } else { if (t < t0) return false; if (t < t1) t1 = t; } }
    }
    return t0 <= t1;
  }
  H.EDGES.forEach(e => {
    const segs = H.edgeGeom(e, lay, B);
    segs.pts.forEach((a, k) => { if (k === segs.pts.length - 1) return; const b = segs.pts[k + 1];
      ids.forEach(id => { if (id === e.from || id === e.to) return; if (H.NODES[id].ghost && e.to !== id) {} if (segRect(a, b, B[id])) probs.push('线 ' + e.id + ' 穿过 ' + id); }); });
  });
  // 标签
  const labs = H.labelBoxes(lay, B, STEP);
  labs.forEach(l => ids.forEach(id => { if (id !== l.own && inter(l, B[id], 1)) probs.push('标签 ' + l.t + ' 压住 ' + id); }));
  // 连线文字（清算代理线的"已宣布终止 / 实际停止时间未核实"）：不压住节点、状态标记，不出界
  const el = H.edgeLabelBoxes(lay, STEP);
  el.forEach(l => {
    ids.forEach(id => { if (H.NODES[id].ghost && STEP < 11) return; if (inter(l, B[id], 1)) probs.push('连线文字 ' + l.t + ' 压住 ' + id); });
    labs.forEach(m => { if (inter(l, m, 1)) probs.push('连线文字 ' + l.t + ' 压住 ' + m.t); });
    if (l.x - l.w / 2 < 2 || l.x + l.w / 2 > P.w - 2 || l.y - l.h / 2 < (P.vy || 0) + 2 || l.y + l.h / 2 > P.h - 2) probs.push('连线文字出界 ' + l.t);
  });
  el.forEach((a, i) => el.slice(i + 1).forEach(b => { if (inter(a, b, 1)) probs.push('连线文字互相压住 ' + a.t + ' ' + b.t); }));
  
  return probs;
}
for (const lay of ['wide', 'narrow']) {
  test('图 B 布局（' + lay + '）：每一步都没有重叠和穿线', () => {
    for (let st = 0; st < H.GSTEPS.length; st++) assert.deepEqual(check(lay, st), [], lay + ' 第 ' + (st + 1) + ' 步');
  });
}
