import XLSX from 'xlsx-js-style';

export async function exportProductPriceTemplateExcel(data: any[], headers: string[], fileName: string) {
  // 1. 헤더 + 데이터로 시트 생성
  const ws = XLSX.utils.aoa_to_sheet([headers, ...data]);

  // 2. 스타일 적용
  // 헤더 스타일
  for (let c = 0; c < headers.length; c++) {
    const cell = XLSX.utils.encode_cell({ r: 0, c });
    if (ws[cell]) {
      ws[cell].s = {
        font: { name: '맑은 고딕', sz: 11, bold: true, color: { rgb: 'FFFFFF' } },
        fill: { patternType: 'solid', fgColor: { rgb: '2563EB' } },
        alignment: { horizontal: 'center', vertical: 'center', wrapText: true },
        border: {
          top: { style: 'thin', color: { rgb: '000000' } },
          right: { style: 'thin', color: { rgb: '000000' } },
          bottom: { style: 'thin', color: { rgb: '000000' } },
          left: { style: 'thin', color: { rgb: '000000' } },
        },
      };
    }
  }
  // 데이터 행 스타일
  for (let r = 1; r <= data.length; r++) {
    for (let c = 0; c < headers.length; c++) {
      const cell = XLSX.utils.encode_cell({ r, c });
      if (ws[cell]) {
        ws[cell].s = {
          font: { name: '맑은 고딕', sz: 10 },
          alignment: { horizontal: c === 5 ? 'right' : 'left', vertical: 'center' },
          border: {
            top: { style: 'thin', color: { rgb: 'D0D0D0' } },
            right: { style: 'thin', color: { rgb: 'D0D0D0' } },
            bottom: { style: 'thin', color: { rgb: 'D0D0D0' } },
            left: { style: 'thin', color: { rgb: 'D0D0D0' } },
          },
        };
      }
    }
  }
  // 컬럼 너비
  ws['!cols'] = [
    { wch: 12 }, // 브랜드
    { wch: 12 }, // 상품코드
    { wch: 24 }, // 상품명
    { wch: 14 }, // 현재적용일자
    { wch: 14 }, // 현재종료일자
    { wch: 14 }, // 현재소비자가
    { wch: 20 }, // 적요
  ];
  // 헤더 고정 (첫번째 라인 고정)
  ws['!freeze'] = { xSplit: 0, ySplit: 1 };

  // 3. 워크북 생성 및 저장
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, '상품가격일괄등록');
  XLSX.writeFile(wb, fileName);
}
