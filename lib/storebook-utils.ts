export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('ko-KR', { style: 'currency', currency: 'KRW' })
    .format(amount)
    .replace('₩', '') + '원';
}

export function numberToKorean(num: number): string {
  if (num === 0) return '영 원';
  if (isNaN(num) || !isFinite(num)) return '';

  const units = ['', '만', '억', '조'];
  const nums = ['', '일', '이', '삼', '사', '오', '육', '칠', '팔', '구'];
  const positions = ['', '십', '백', '천'];

  let result: string[] = [];
  let unitIdx = 0;
  let absNum = Math.abs(num);

  while (absNum > 0) {
    let chunk = absNum % 10000;
    absNum = Math.floor(absNum / 10000);

    if (chunk === 0) {
      unitIdx++;
      continue;
    }

    let chunkStr: string[] = [];
    let temp = chunk;
    for (let i = 0; i < 4; i++) {
      let digit = temp % 10;
      temp = Math.floor(temp / 10);

      if (digit > 0) {
        let numWord = nums[digit];
        if (digit === 1 && i > 0) {
          numWord = '';
        }
        chunkStr.unshift(numWord + positions[i]);
      }
    }

    if (chunkStr.length > 0) {
      result.unshift(chunkStr.join('') + units[unitIdx]);
    }
    unitIdx++;
  }

  const prefix = num < 0 ? '마이너스 ' : '';
  return prefix + result.join(' ') + ' 원';
}

export function getPrevMonthString(yearMonthStr: string): string {
  const [y, m] = yearMonthStr.split('-').map(Number);
  if (m === 1) {
    return `${y - 1}-12`;
  } else {
    const prevM = m - 1;
    return `${y}-${prevM < 10 ? '0' + prevM : prevM}`;
  }
}

export function getNextMonthString(yearMonthStr: string): string {
  const [y, m] = yearMonthStr.split('-').map(Number);
  if (m === 12) {
    return `${y + 1}-01`;
  } else {
    const nextM = m + 1;
    return `${y}-${nextM < 10 ? '0' + nextM : nextM}`;
  }
}
