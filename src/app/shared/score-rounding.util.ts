export function floorToHalf(value: number): number {
  return Math.floor(value * 2) / 2;
}

export function floorToWholeForMatrix(value: number): number {
  return Math.floor(value);
}

export function scoresMatchMatrixCell(
  processScore: number,
  outcomeScore: number,
  matrixProcessY: number,
  matrixOutcomeX: number,
): boolean {
  return (
    floorToWholeForMatrix(processScore) === matrixProcessY &&
    floorToWholeForMatrix(outcomeScore) === matrixOutcomeX
  );
}
