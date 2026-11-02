/* 可复用的实验配置与纯计算函数。不读取页面，方便其他实验复用。 */
const experimentConfig = {
  storageKey: 'bridge-experiment-v1',
  // 阈值包含上边界：3% 为 A，5% 为 B，7% 为 C，其余 D。
  grades: [{ max: 3, label: 'A' }, { max: 5, label: 'B' }, { max: 7, label: 'C' }],
  fallbackGrade: 'D',
  // 当前 demo 的计算订正容差：0.01 Ω 或正确值的 0.1%，取较大者。
  absoluteTolerance: 0.01,
  relativeTolerance: 0.001
};
function calculateRx(lengthA, lengthB, resistance) {
  return resistance * lengthA / lengthB;
}
function mean(values) {
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}
function deviation(value, reference) {
  return Math.abs(value - reference) / reference * 100;
}
function grade(error) {
  return experimentConfig.grades.find(band => error <= band.max)?.label || experimentConfig.fallbackGrade;
}
function isClose(value, expected) {
  return Math.abs(value - expected) <= Math.max(experimentConfig.absoluteTolerance, Math.abs(expected) * experimentConfig.relativeTolerance);
}
