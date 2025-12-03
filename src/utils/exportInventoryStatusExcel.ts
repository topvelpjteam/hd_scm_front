import XLSX from 'xlsx-js-style';
import { StoreInventoryStatusItem, StoreInventoryStatusRawItem } from '../services/storeInventoryStatusService';

type HorizontalAlignment = 'left' | 'center' | 'right';
type VerticalAlignment = 'top' | 'center' | 'bottom';
type BorderStyle = 'thin' | 'medium';

interface CellFont {
  name?: string;
  sz?: number;
  bold?: boolean;
  color?: { rgb: string };
}

interface CellFill {
  patternType?: 'solid';
  fgColor?: { rgb: string };
  bgColor?: { rgb: string };
}

interface CellAlignment {
  horizontal?: HorizontalAlignment;
  vertical?: VerticalAlignment;
  wrapText?: boolean;
}

interface CellBorderSide {
  style: BorderStyle;
  color?: { rgb: string };
}

interface CellBorder {
  top?: CellBorderSide;
  right?: CellBorderSide;
  bottom?: CellBorderSide;
  left?: CellBorderSide;
}

interface CellStyle {
  font?: CellFont;
  fill?: CellFill;
  alignment?: CellAlignment;
  border?: CellBorder;
  numFmt?: string;
}

interface ExcelCell extends XLSX.CellObject {
  s?: CellStyle;
  z?: string;
}

const headerStyle: CellStyle = {
  font: { name: '맑은 고딕', sz: 11, bold: true, color: { rgb: 'FFFFFF' } },
  fill: { patternType: 'solid', fgColor: { rgb: '4472C4' }, bgColor: { rgb: '4472C4' } },
  alignment: { horizontal: 'center', vertical: 'center', wrapText: true },
  border: {
    top: { style: 'thin', color: { rgb: '000000' } },
    right: { style: 'thin', color: { rgb: '000000' } },
    bottom: { style: 'thin', color: { rgb: '000000' } },
    left: { style: 'thin', color: { rgb: '000000' } },
  },
};

const dataCellStyle: CellStyle = {
  font: { name: '맑은 고딕', sz: 10 },
  alignment: { horizontal: 'left', vertical: 'center' },
  border: {
    top: { style: 'thin', color: { rgb: 'D0D0D0' } },
    right: { style: 'thin', color: { rgb: 'D0D0D0' } },
    bottom: { style: 'thin', color: { rgb: 'D0D0D0' } },
    left: { style: 'thin', color: { rgb: 'D0D0D0' } },
  },
};

const numberCellStyle: CellStyle = {
  ...dataCellStyle,
  alignment: { horizontal: 'right', vertical: 'center' },
  numFmt: '#,##0',
};

const percentCellStyle: CellStyle = {
  ...dataCellStyle,
  alignment: { horizontal: 'right', vertical: 'center' },
  numFmt: '0.0"%"',
};

/**
 * 마스터(집계) 모드 엑셀 내보내기
 */
export function exportMasterToExcel(
  items: StoreInventoryStatusItem[],
  searchParams: {
    inboundDateFrom?: string;
    inboundDateTo?: string;
    outboundDateFrom?: string;
    outboundDateTo?: string;
  },
) {
  // 필터 정보 행 생성
  const filterInfo: any[][] = [
    ['매장 입고현황 - 집계 모드'],
    ['조회 조건:'],
  ];

  if (searchParams.inboundDateFrom || searchParams.inboundDateTo) {
    filterInfo.push([
      `입고일: ${searchParams.inboundDateFrom || ''} ~ ${searchParams.inboundDateTo || ''}`,
    ]);
  }
  if (searchParams.outboundDateFrom || searchParams.outboundDateTo) {
    filterInfo.push([
      `출고일: ${searchParams.outboundDateFrom || ''} ~ ${searchParams.outboundDateTo || ''}`,
    ]);
  }
  filterInfo.push(['']); // 빈 행 추가

  const headers = [
    '발주번호',
    '매장ID',
    '매장명',
    '납품업체ID',
    '납품업체명',
    '브랜드',
    '입고요구일',
    '출고일(최초)',
    '출고일(최종)',
    '입고일(최초)',
    '입고일(최종)',
    '발주수량',
    '출고수량',
    '입고양호',
    '입고불량',
    '총입고',
    '미입고',
    '진행률(%)',
    '상태',
  ];

  const data: any[][] = [...filterInfo, headers];

  items.forEach((item) => {
    const row = [
      item.SLIP_NO || `${item.ORDER_D}-${item.ORDER_SEQU}`,
      item.AGENT_ID,
      item.AGENT_NM,
      item.VENDOR_ID || '',
      item.VENDOR_NM || '',
      item.BRAND_NM || '',
      item.REQUIRE_D || '',
      item.FIRST_OUT_D || '',
      item.LAST_OUT_D || '',
      item.FIRST_IN_D || '',
      item.LAST_IN_D || '',
      item.TOTAL_ORDER_QTY,
      item.TOTAL_OUT_QTY || 0,
      item.TOTAL_IN_GOOD_QTY || 0,
      item.TOTAL_IN_BAD_QTY || 0,
      item.TOTAL_IN_QTY || 0,
      item.PENDING_QTY,
      item.IN_PROGRESS_RATE || 0,
      item.IN_STATUS,
    ];
    data.push(row);
  });

  // 합계 행 추가
  const totals = items.reduce(
    (acc, item) => {
      acc.totalOrderQty += item.TOTAL_ORDER_QTY || 0;
      acc.totalOutQty += item.TOTAL_OUT_QTY || 0;
      acc.totalInGoodQty += item.TOTAL_IN_GOOD_QTY || 0;
      acc.totalInBadQty += item.TOTAL_IN_BAD_QTY || 0;
      acc.totalInQty += item.TOTAL_IN_QTY || 0;
      acc.totalPendingQty += item.PENDING_QTY || 0;
      acc.progressSum += item.IN_PROGRESS_RATE || 0;
      return acc;
    },
    { totalOrderQty: 0, totalOutQty: 0, totalInGoodQty: 0, totalInBadQty: 0, totalInQty: 0, totalPendingQty: 0, progressSum: 0 },
  );
  const averageProgress = items.length > 0 ? totals.progressSum / items.length : 0;

  data.push([
    '',
    '',
    '',
    '',
    '',
    '',
    '',
    '',
    '',
    '',
    '합계:',
    totals.totalOrderQty,
    totals.totalOutQty,
    totals.totalInGoodQty,
    totals.totalInBadQty,
    totals.totalInQty,
    totals.totalPendingQty,
    averageProgress,
    '',
  ]);

  const ws = XLSX.utils.aoa_to_sheet(data);
  const wb = XLSX.utils.book_new();

  const range = XLSX.utils.decode_range(ws['!ref'] || 'A1');
  const headerRowIndex = filterInfo.length; // 필터 정보 행 이후가 헤더

  // 헤더 스타일 적용
  for (let C = range.s.c; C <= range.e.c; ++C) {
    const cellAddress = XLSX.utils.encode_cell({ r: headerRowIndex, c: C });
    if (!ws[cellAddress]) continue;
    (ws[cellAddress] as ExcelCell).s = headerStyle;
  }

  // 오토필터 설정 (헤더 행부터)
  ws['!autofilter'] = {
    ref: XLSX.utils.encode_range({
      s: { r: headerRowIndex, c: 0 },
      e: { r: range.e.r, c: range.e.c },
    }),
  };

  // 데이터 행 스타일 적용
  for (let R = headerRowIndex + 1; R <= range.e.r; ++R) {
    const isSummaryRow = R === range.e.r; // 마지막 행이 합계 행
    for (let C = range.s.c; C <= range.e.c; ++C) {
      const cellAddress = XLSX.utils.encode_cell({ r: R, c: C });
      if (!ws[cellAddress]) continue;
      const cell = ws[cellAddress] as ExcelCell;

      if (isSummaryRow) {
        // 합계 행 스타일 (굵게)
        if (C >= 11 && C <= 16) {
          cell.s = { ...numberCellStyle, font: { ...numberCellStyle.font, bold: true } };
        } else if (C === 17) {
          cell.s = { ...percentCellStyle, font: { ...percentCellStyle.font, bold: true } };
        } else {
          cell.s = { ...dataCellStyle, font: { ...dataCellStyle.font, bold: true } };
        }
      } else {
        // 일반 데이터 행 스타일
        if (C >= 11 && C <= 16) {
          cell.s = numberCellStyle;
        } else if (C === 17) {
          cell.s = percentCellStyle;
        } else {
          cell.s = dataCellStyle;
        }
      }
    }
  }

  // 컬럼 너비 설정
  ws['!cols'] = [
    { wch: 15 }, // 발주번호
    { wch: 10 }, // 매장ID
    { wch: 20 }, // 매장명
    { wch: 12 }, // 납품업체ID
    { wch: 20 }, // 납품업체명
    { wch: 15 }, // 브랜드
    { wch: 12 }, // 입고요구일
    { wch: 12 }, // 출고일(최초)
    { wch: 12 }, // 출고일(최종)
    { wch: 12 }, // 입고일(최초)
    { wch: 12 }, // 입고일(최종)
    { wch: 12 }, // 발주수량
    { wch: 12 }, // 출고수량
    { wch: 12 }, // 입고양호
    { wch: 12 }, // 입고불량
    { wch: 12 }, // 총입고
    { wch: 12 }, // 미입고
    { wch: 12 }, // 진행률
    { wch: 12 }, // 상태
  ];

  XLSX.utils.book_append_sheet(wb, ws, '입고현황_집계');

  const dateRange = [
    searchParams.inboundDateFrom || '',
    searchParams.inboundDateTo || '',
  ]
    .filter(Boolean)
    .join('_');
  const fileName = `입고현황_마스터_${dateRange || new Date().toISOString().slice(0, 10)}.xlsx`;

  XLSX.writeFile(wb, fileName);
}

/**
 * RAW(로우데이터) 모드 엑셀 내보내기
 */
export function exportRawToExcel(
  items: StoreInventoryStatusRawItem[],
  searchParams: {
    inboundDateFrom?: string;
    inboundDateTo?: string;
    outboundDateFrom?: string;
    outboundDateTo?: string;
  },
) {
  // 필터 정보 행 생성
  const filterInfo: any[][] = [
    ['매장 입고현황 - RAW 모드 (상세 데이터)'],
    ['조회 조건:'],
  ];

  if (searchParams.inboundDateFrom || searchParams.inboundDateTo) {
    filterInfo.push([
      `입고일: ${searchParams.inboundDateFrom || ''} ~ ${searchParams.inboundDateTo || ''}`,
    ]);
  }
  if (searchParams.outboundDateFrom || searchParams.outboundDateTo) {
    filterInfo.push([
      `출고일: ${searchParams.outboundDateFrom || ''} ~ ${searchParams.outboundDateTo || ''}`,
    ]);
  }
  filterInfo.push(['']); // 빈 행 추가

  const headers = [
    '발주번호',
    '순번',
    '매장ID',
    '매장명',
    '납품업체ID',
    '납품업체명',
    '상품코드',
    '상품명',
    '상품구분',
    '브랜드',
    '입고요구일',
    '출고일',
    '입고일',
    '발주수량',
    '출고수량',
    '입고양호',
    '입고불량',
    '총입고',
    '미입고',
    '진행률(%)',
    '상태',
  ];

  const data: any[][] = [...filterInfo, headers];

  items.forEach((item) => {
    const row = [
      item.SLIP_NO || `${item.ORDER_D}-${item.ORDER_SEQU}`,
      item.ORDER_NO,
      item.AGENT_ID,
      item.AGENT_NM,
      item.VENDOR_ID || '',
      item.VENDOR_NM || '',
      item.GOODS_ID_BRAND || item.GOODS_ID || '',
      item.GOODS_NM || '',
      item.GOODS_GBN_NM || '',
      item.BRAND_NM || '',
      item.REQUIRE_D || '',
      item.OUT_D || '',
      item.IN_D || '',
      item.ORDER_QTY,
      item.OUT_QTY,
      item.IN_GOOD_QTY,
      item.IN_BAD_QTY,
      item.IN_TOT_QTY,
      item.PENDING_QTY,
      item.IN_PROGRESS_RATE || 0,
      item.IN_STATUS,
    ];
    data.push(row);
  });

  // 합계 행 추가
  const totals = items.reduce(
    (acc, item) => {
      acc.totalOrderQty += item.ORDER_QTY || 0;
      acc.totalOutQty += item.OUT_QTY || 0;
      acc.totalInGoodQty += item.IN_GOOD_QTY || 0;
      acc.totalInBadQty += item.IN_BAD_QTY || 0;
      acc.totalInQty += item.IN_TOT_QTY || 0;
      acc.totalPendingQty += item.PENDING_QTY || 0;
      acc.progressSum += item.IN_PROGRESS_RATE || 0;
      return acc;
    },
    { totalOrderQty: 0, totalOutQty: 0, totalInGoodQty: 0, totalInBadQty: 0, totalInQty: 0, totalPendingQty: 0, progressSum: 0 },
  );
  const averageProgress = items.length > 0 ? totals.progressSum / items.length : 0;

  data.push([
    '',
    '',
    '',
    '',
    '',
    '',
    '',
    '',
    '',
    '',
    '',
    '',
    '합계:',
    totals.totalOrderQty,
    totals.totalOutQty,
    totals.totalInGoodQty,
    totals.totalInBadQty,
    totals.totalInQty,
    totals.totalPendingQty,
    averageProgress,
    '',
  ]);

  const ws = XLSX.utils.aoa_to_sheet(data);
  const wb = XLSX.utils.book_new();

  const range = XLSX.utils.decode_range(ws['!ref'] || 'A1');
  const headerRowIndex = filterInfo.length; // 필터 정보 행 이후가 헤더

  // 헤더 스타일 적용
  for (let C = range.s.c; C <= range.e.c; ++C) {
    const cellAddress = XLSX.utils.encode_cell({ r: headerRowIndex, c: C });
    if (!ws[cellAddress]) continue;
    (ws[cellAddress] as ExcelCell).s = headerStyle;
  }

  // 오토필터 설정 (헤더 행부터)
  ws['!autofilter'] = {
    ref: XLSX.utils.encode_range({
      s: { r: headerRowIndex, c: 0 },
      e: { r: range.e.r, c: range.e.c },
    }),
  };

  // 데이터 행 스타일 적용
  for (let R = headerRowIndex + 1; R <= range.e.r; ++R) {
    const isSummaryRow = R === range.e.r; // 마지막 행이 합계 행
    for (let C = range.s.c; C <= range.e.c; ++C) {
      const cellAddress = XLSX.utils.encode_cell({ r: R, c: C });
      if (!ws[cellAddress]) continue;
      const cell = ws[cellAddress] as ExcelCell;

      if (isSummaryRow) {
        // 합계 행 스타일 (굵게)
        if (C >= 13 && C <= 18) {
          cell.s = { ...numberCellStyle, font: { ...numberCellStyle.font, bold: true } };
        } else if (C === 19) {
          cell.s = { ...percentCellStyle, font: { ...percentCellStyle.font, bold: true } };
        } else {
          cell.s = { ...dataCellStyle, font: { ...dataCellStyle.font, bold: true } };
        }
      } else {
        // 일반 데이터 행 스타일
        if (C >= 13 && C <= 18) {
          cell.s = numberCellStyle;
        } else if (C === 19) {
          cell.s = percentCellStyle;
        } else {
          cell.s = dataCellStyle;
        }
      }
    }
  }

  // 컬럼 너비 설정
  ws['!cols'] = [
    { wch: 15 }, // 발주번호
    { wch: 8 },  // 순번
    { wch: 10 }, // 매장ID
    { wch: 20 }, // 매장명
    { wch: 12 }, // 납품업체ID
    { wch: 20 }, // 납품업체명
    { wch: 15 }, // 상품코드
    { wch: 30 }, // 상품명
    { wch: 12 }, // 상품구분
    { wch: 15 }, // 브랜드
    { wch: 12 }, // 입고요구일
    { wch: 12 }, // 출고일
    { wch: 12 }, // 입고일
    { wch: 12 }, // 발주수량
    { wch: 12 }, // 출고수량
    { wch: 12 }, // 입고양호
    { wch: 12 }, // 입고불량
    { wch: 12 }, // 총입고
    { wch: 12 }, // 미입고
    { wch: 12 }, // 진행률
    { wch: 12 }, // 상태
  ];

  XLSX.utils.book_append_sheet(wb, ws, '입고현황_로우데이터');

  const dateRange = [
    searchParams.inboundDateFrom || '',
    searchParams.inboundDateTo || '',
  ]
    .filter(Boolean)
    .join('_');
  const fileName = `입고현황_로우데이터_${dateRange || new Date().toISOString().slice(0, 10)}.xlsx`;

  XLSX.writeFile(wb, fileName);
}
