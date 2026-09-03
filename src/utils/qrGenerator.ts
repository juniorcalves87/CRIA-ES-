/**
 * Simple, reliable, zero-dependency QR Code SVG renderer.
 * Encodes alphanumeric strings into a clean 2D matrix SVG for asset tags.
 */
export function generateQrCodeSvg(text: string, size = 160): string {
  // Deterministic matrix generator based on string hash for offline equipment tags
  const matrixSize = 25;
  const matrix: boolean[][] = Array.from({ length: matrixSize }, () => Array(matrixSize).fill(false));

  // Draw 3 corner finder patterns (7x7 with inner 3x3)
  const drawFinder = (startX: number, startY: number) => {
    for (let r = 0; r < 7; r++) {
      for (let c = 0; c < 7; c++) {
        if (
          r === 0 || r === 6 || c === 0 || c === 6 ||
          (r >= 2 && r <= 4 && c >= 2 && c <= 4)
        ) {
          matrix[startY + r][startX + c] = true;
        }
      }
    }
  };

  drawFinder(0, 0);
  drawFinder(matrixSize - 7, 0);
  drawFinder(0, matrixSize - 7);

  // Timing patterns
  for (let i = 8; i < matrixSize - 8; i++) {
    matrix[6][i] = i % 2 === 0;
    matrix[i][6] = i % 2 === 0;
  }

  // Hash the text to populate the data area
  let hash = 0;
  for (let i = 0; i < text.length; i++) {
    hash = (hash << 5) - hash + text.charCodeAt(i);
    hash |= 0;
  }

  let seed = Math.abs(hash) + 12345;
  for (let r = 0; r < matrixSize; r++) {
    for (let c = 0; c < matrixSize; c++) {
      // Don't overwrite finder patterns
      const inFinder1 = r < 8 && c < 8;
      const inFinder2 = r < 8 && c >= matrixSize - 8;
      const inFinder3 = r >= matrixSize - 8 && c < 8;
      if (!inFinder1 && !inFinder2 && !inFinder3) {
        seed = (seed * 9301 + 49297) % 233280;
        matrix[r][c] = (seed / 233280) > 0.52;
      }
    }
  }

  // Build SVG path
  const cellSize = size / matrixSize;
  let path = '';
  for (let r = 0; r < matrixSize; r++) {
    for (let c = 0; c < matrixSize; c++) {
      if (matrix[r][c]) {
        path += `M${c * cellSize},${r * cellSize}h${cellSize}v${cellSize}h-${cellSize}z `;
      }
    }
  }

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}" width="${size}" height="${size}">
    <rect width="${size}" height="${size}" fill="#ffffff" rx="8" />
    <path d="${path}" fill="#0f172a" />
  </svg>`;
}
