// S09-03 Phase 1B：候选文件的一致性检查（旧版 v2.1、v2.2 与修订建议已删除，只检查当前候选稿）
'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const dir = path.join(__dirname, '..');
const read = f => fs.readFileSync(path.join(dir, f), 'utf8');
const count = (hay, needle) => hay.split(needle).length - 1;

test('时间线 v2.3 候选：MT99 贷款数据单列一行；8-22 至 12-19 行不把 38 家与 36% 合成一句；10-25 行不用"保证金卖出"', () => {
  const b = read('S09-03-史实时间线-v2.3-候选.md').split('\n');
  const added = b.filter(l => l.startsWith('| 1907 年恐慌期间（MT99 未给出起止日期） |'));
  assert.equal(added.length, 1);
  assert.match(added[0], /\*\*贷款\*\*下降近 37%/);
  assert.match(added[0], /☐ 时间窗口/);
  const row = b.find(l => l.startsWith('| 1907-08-22 至 12-19 |'));
  assert.ok(!row.split('|')[2].includes('38'), '事件列仍出现 38 家');
  assert.match(row, /−32\.1%/); assert.match(row, /不能与 FRH 的"超过 36%"合成一句/);
  const all = b.join('\n');
  assert.ok(!all.includes('（MT99："近 37%"）'), '仍把 MT99 的 37% 当作存款数据');
  assert.ok(all.includes('八家银行和两家信托公司'));
  const r1025 = b.find(l => l.startsWith('| 10-25（周五） |')).split('|')[2];
  assert.ok(!r1025.includes('例如不得用于保证金卖出'));
  assert.match(r1025, /不许保证金交易/);
});

test('交互方案 v2.2 候选：M5 四个分支与模型测试的期望值一致', () => {
  const spec = read('S09-03-交互方案-v2.2-候选.md');
  const rows = spec.split('\n').filter(l => /^\| [①②③④] \| (25|40) → 借/.test(l));
  assert.equal(rows.length, 4);
  const nw = rows.map(r => r.split('|')[8].replace(/\*/g, '').trim());
  assert.deepEqual(nw, ['＋6', '−9', '＋7.5', '−7.5']);
  const gap = rows.map(r => r.split('|')[9].trim().split(/[（ ]/)[0].replace(/\*/g, ''));
  assert.deepEqual(gap, ['0', '0', '0', '5']);
  assert.match(spec, /乙没有额外的借款渠道/);
  assert.match(spec, /只借当日所需/);
});

test('交互方案 v2.2 候选：10-21 宣布与 10-22 暂停营业分开，不画切断时刻；美国信托、林肯信托标"清算代理关系未确立"', () => {
  const spec = read('S09-03-交互方案-v2.2-候选.md');
  assert.match(spec, /10-21[^\n]*已宣布终止/);
  assert.match(spec, /10-22[^\n]*暂停营业/);
  assert.match(spec, /不显示终止的具体时刻/);
  assert.match(spec, /\| 美国信托公司 \| "\*\*清算代理关系未确立\*\*"/);
  assert.match(spec, /\| 林肯信托 \| "\*\*清算代理关系未确立\*\*"/);
  assert.match(spec, /纽约清算所会员身份：本课未核实/);
  assert.ok(!/拖到 10-21：国民商业银行与尼克博克之间的实线断开/.test(spec), '旧的 10-21 断开动画仍在');
  assert.ok(!/圈外："无清算安排的信托公司"/.test(spec), '旧的"无清算安排"分层仍在');
});

