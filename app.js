/* 页面控制：生成三张测量卡片、保存输入、提交核算和回看订正。 */
const form = document.querySelector('#experiment');
const fields = [['la', 'Lₐ 长度（mm）'], ['lb', 'Lᵦ 长度（mm）'], ['r', '比较电阻 R（Ω）'], ['rx', '你计算的 Rₓ（Ω）']];
for (let i = 1; i <= 3; i++) {
  const card = document.createElement('section');
  card.innerHTML = `<h2>${i === 1 ? '03 / ' : ''}第 ${i} 次测量</h2><span class="badge">请使用与其他两次不同的比较电阻 R</span><div class="fields">${fields.map(([key,label]) => `<label>${label}<input name="${key}${i}" type="number" min="0" step="any" inputmode="decimal" required></label>`).join('')}</div>`;
  document.querySelector('#measurements').append(card);
}
let submitted = false;
function readValues() {
  return Object.fromEntries(new FormData(form));
}
// 存储失败也允许继续实验，页面会明确提示。
function save(values) {
  try {
    localStorage.setItem(experimentConfig.storageKey, JSON.stringify({values, submitted}));
    document.querySelector('#save-status').textContent = '已保存到当前浏览器，可关闭后回来继续查看。';
  } catch {
    document.querySelector('#save-status').textContent = '浏览器无法保存记录，请勿关闭页面。';
  }
}
function feedback(name, expected) {
  const input = form.elements[name];
  const note = document.createElement('span');
  const correct = isClose(Number(input.value), expected);
  note.className = 'feedback ' + (correct ? 'correct' : 'wrong');
  note.textContent = correct ? '✓ 计算正确（在允许的舍入范围内）' : `✗ 请订正；正确计算值：${expected.toFixed(4)} Ω`;
  input.after(note);
}
function review(values) {
  document.querySelectorAll('.feedback').forEach(node => node.remove());
  const expected = [1,2,3].map(i => calculateRx(+values['la'+i], +values['lb'+i], +values['r'+i]));
  expected.forEach((value,i) => feedback('rx'+(i+1), value));
  feedback('average', mean(expected));
  const error = deviation(+values.average, +values.reference);
  const result = document.querySelector('#result');
  result.hidden = false;
  result.innerHTML = `<h2>实验评阅</h2><p class="grade">${grade(error)}</p><p>相对偏差 ${error.toFixed(4)}%</p><p>按你提交的平均值与参考值比较评级。</p><p class="muted">A ≤ 3% · B ≤ 5% · C ≤ 7% · D ＞ 7%</p><p class="muted">计算订正容差：0.01 Ω 或正确值的 0.1%，取较大者。正确平均值由原始测量数据重新计算。</p>`;
  // 提交后锁定原始答案，保证回看时不会悄悄改变评分依据。
  [...form.elements].forEach(element => element.disabled = true);
}
form.addEventListener('input', () => save(readValues()));
form.addEventListener('submit', event => {
  event.preventDefault();
  const values = readValues();
  const message = document.querySelector('#message');
  if (Object.values(values).some(value => !Number.isFinite(Number(value)) || Number(value) <= 0)) {
    message.textContent = '请填写完整，所有数据须为大于零的有限数值。'; return;
  }
  if (new Set([+values.r1,+values.r2,+values.r3]).size !== 3) {
    message.textContent = '三次比较电阻 R 应各不相同，请检查。'; return;
  }
  const results = [1,2,3].map(i => calculateRx(+values['la'+i],+values['lb'+i],+values['r'+i]));
  if (![...results, mean(results), deviation(+values.average,+values.reference)].every(Number.isFinite)) {
    message.textContent = '数据过大或过小，无法计算，请检查单位与数值。'; return;
  }
  message.textContent = '';
  submitted = true;
  save(values);
  review(values);
  document.querySelector('#result').scrollIntoView({behavior:'smooth'});
});
// 重新打开页面时，恢复草稿或已提交的评阅。
try {
  const record = JSON.parse(localStorage.getItem(experimentConfig.storageKey));
  if (record?.values) {
    for (const [name,value] of Object.entries(record.values)) {
      if (form.elements[name]) form.elements[name].value = value;
    }
    if (record.submitted) { submitted = true; review(record.values); }
  }
} catch { document.querySelector('#save-status').textContent = '旧记录无法读取，可开始新实验。'; }
document.querySelector('#restart').addEventListener('click', () => {
  if (!confirm('清空当前实验的输入、答案和成绩？')) return;
  try { localStorage.removeItem(experimentConfig.storageKey); } catch { /* 不影响清空当前页面。 */ }
  submitted = false;
  [...form.elements].forEach(element => element.disabled = false);
  form.reset();
  document.querySelectorAll('.feedback').forEach(node => node.remove());
  document.querySelector('#result').hidden = true;
  document.querySelector('#message').textContent = '';
  document.querySelector('#save-status').textContent = '已开始新实验。填写内容自动保存在当前浏览器。';
});
