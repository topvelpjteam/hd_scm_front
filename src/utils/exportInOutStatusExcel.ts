import XLSX from 'xlsx-js-style';
import type { InOutStatusItem } from '../services/inOutStatusService';

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

export interface ExportInOutStatusOptions {
  items: InOutStatusItem[];
  dateFrom: string;
  dateTo: string;
  generatedAt: Date;
  totalCount: number;
  fileName: string;
}

const TITLE_TEXT = '입출고 현황 보고서';

const defaultBorder: CellBorder = {
  top: { style: 'thin', color: { rgb: 'FFE2E8F0' } },
  right: { style: 'thin', color: { rgb: 'FFE2E8F0' } },
  bottom: { style: 'thin', color: { rgb: 'FFE2E8F0' } },
  left: { style: 'thin', color: { rgb: 'FFE2E8F0' } },
};

const mergeCellStyles = (...styles: CellStyle[]): CellStyle => {
  return styles.reduce<CellStyle>(
    (accumulator, style) => ({
      font: { ...accumulator.font, ...style.font },
      fill: { ...accumulator.fill, ...style.fill },
      alignment: { ...accumulator.alignment, ...style.alignment },
      border: style.border ?? accumulator.border,
      numFmt: style.numFmt ?? accumulator.numFmt,
    }),
    {},
  );
};

const formatDate = (dateStr?: string): string => {
  if (!dateStr) return '-';
  // YYYY-MM-DD 형식으로 반환
  if (dateStr.length === 8) {
    return `${dateStr.slice(0, 4)}-${dateStr.slice(4, 6)}-${dateStr.slice(6, 8)}`;
  }
  return dateStr;
};

// 컬럼 정의
const columns = [
  { key: 'ORDER_D', label: '발주일자', width: 12, align: 'center' as HorizontalAlignment },
  { key: 'ORDER_SEQU', label: '발주순번', width: 10, align: 'center' as HorizontalAlignment },
  { key: 'SLIP_NO', label: '전표번호', width: 12, align: 'center' as HorizontalAlignment },
  { key: 'AGENT_NM', label: '매장명', width: 20, align: 'left' as HorizontalAlignment },
  { key: 'VENDOR_NM', label: '납품업체', width: 20, align: 'left' as HorizontalAlignment },
  { key: 'BRAND_NM', label: '브랜드', width: 15, align: 'left' as HorizontalAlignment },
  { key: 'IO_TYPE', label: '구분', width: 8, align: 'center' as HorizontalAlignment },
  { key: 'OUT_D', label: '출고일', width: 12, align: 'center' as HorizontalAlignment },
  { key: 'IN_D', label: '입고일', width: 12, align: 'center' as HorizontalAlignment },
  { key: 'TOTAL_ORDER_QTY', label: '발주수량', width: 12, align: 'right' as HorizontalAlignment, numeric: true },
  { key: 'TOTAL_OUT_QTY', label: '출고수량', width: 12, align: 'right' as HorizontalAlignment, numeric: true },
  { key: 'TOTAL_IN_QTY', label: '입고수량', width: 12, align: 'right' as HorizontalAlignment, numeric: true },
  { key: 'PENDING_QTY', label: '미처리수량', width: 12, align: 'right' as HorizontalAlignment, numeric: true },
  { key: 'PROGRESS_RATE', label: '진행률(%)', width: 10, align: 'right' as HorizontalAlignment, numeric: true },
  { key: 'IN_STATUS', label: '상태', width: 12, align: 'center' as HorizontalAlignment },
];

export const exportInOutStatusToExcel = (options: ExportInOutStatusOptions): void => {
  const { items, dateFrom, dateTo, generatedAt, totalCount, fileName } = options;

  const workbook = XLSX.utils.book_new();
  const sheetData: ExcelCell[][] = [];

  // 스타일 정의
  const titleStyle: CellStyle = {
    font: { name: '맑은 고딕', sz: 16, bold: true, color: { rgb: 'FF1F2937' } },
    alignment: { horizontal: 'center', vertical: 'center' },
  };

  const subtitleStyle: CellStyle = {
    font: { name: '맑은 고딕', sz: 11, color: { rgb: 'FF6B7280' } },
    alignment: { horizontal: 'center', vertical: 'center' },
  };

  const headerStyle: CellStyle = {
    font: { name: '맑은 고딕', sz: 11, bold: true, color: { rgb: 'FFFFFFFF' } },
    fill: { patternType: 'solid', fgColor: { rgb: 'FF667EEA' } },
    alignment: { horizontal: 'center', vertical: 'center', wrapText: true },
    border: {
      top: { style: 'thin', color: { rgb: 'FF5568D3' } },
      right: { style: 'thin', color: { rgb: 'FF5568D3' } },
      bottom: { style: 'medium', color: { rgb: 'FF5568D3' } },
      left: { style: 'thin', color: { rgb: 'FF5568D3' } },
    },
  };

  const dataStyle: CellStyle = {
    font: { name: '맑은 고딕', sz: 10 },
    alignment: { vertical: 'center' },
    border: defaultBorder,
  };

  const numericStyle: CellStyle = {
    alignment: { horizontal: 'right' },
    numFmt: '#,##0',
  };

  const inboundStyle: CellStyle = {
    fill: { patternType: 'solid', fgColor: { rgb: 'FFD4EDDA' } },
    font: { color: { rgb: 'FF155724' } },
  };

  const outboundStyle: CellStyle = {
    fill: { patternType: 'solid', fgColor: { rgb: 'FFCCE5FF' } },
    font: { color: { rgb: 'FF004085' } },
  };

  // 1행: 제목
  const titleRow: ExcelCell[] = Array(columns.length).fill({ v: '', t: 's' });
  titleRow[0] = { v: TITLE_TEXT, t: 's', s: titleStyle };
  sheetData.push(titleRow);

  // 2행: 부제목 (날짜 범위 및 생성 시간)
  const subtitleRow: ExcelCell[] = Array(columns.length).fill({ v: '', t: 's' });
  const dateRange = `조회 기간: ${formatDate(dateFrom)} ~ ${formatDate(dateTo)}`;
  const genTime = `생성: ${generatedAt.toLocaleString('ko-KR')}`;
  subtitleRow[0] = { v: `${dateRange}  |  총 ${totalCount.toLocaleString()}건  |  ${genTime}`, t: 's', s: subtitleStyle };
  sheetData.push(subtitleRow);

  // 3행: 빈 행
  sheetData.push(Array(columns.length).fill({ v: '', t: 's' }));

  // 4행: 헤더
  const headerRow: ExcelCell[] = columns.map((col) => ({
    v: col.label,
    t: 's' as const,
    s: headerStyle,
  }));
  sheetData.push(headerRow);

  // 5행~: 데이터
  items.forEach((item, rowIndex) => {
    const isEvenRow = rowIndex % 2 === 0;
    const rowFill: CellStyle = isEvenRow
      ? { fill: { patternType: 'solid', fgColor: { rgb: 'FFF8F9FA' } } }
      : {};

    const row: ExcelCell[] = columns.map((col) => {
      let value: string | number = '-';
      let cellStyle = mergeCellStyles(dataStyle, rowFill, { alignment: { horizontal: col.align } });

      const rawValue = item[col.key as keyof InOutStatusItem];

      if (col.key === 'ORDER_D' || col.key === 'OUT_D' || col.key === 'IN_D') {
        value = formatDate(rawValue as string);
      } else if (col.numeric) {
        const numVal = rawValue as number | undefined;
        if (numVal !== null && numVal !== undefined) {
          value = numVal;
          cellStyle = mergeCellStyles(cellStyle, numericStyle);
        }
      } else if (col.key === 'IO_TYPE') {
        value = (rawValue as string) || '-';
        if (value === '입고') {
          cellStyle = mergeCellStyles(cellStyle, inboundStyle);
        } else if (value === '출고') {
          cellStyle = mergeCellStyles(cellStyle, outboundStyle);
        }
      } else if (col.key === 'IN_STATUS') {
        value = (rawValue as string) || '-';
        if (value === '입고완료') {
          cellStyle = mergeCellStyles(cellStyle, inboundStyle);
        }
      } else {
        value = rawValue !== null && rawValue !== undefined ? String(rawValue) : '-';
      }

      return {
        v: value,
        t: typeof value === 'number' ? ('n' as const) : ('s' as const),
        s: cellStyle,
      };
    });

    sheetData.push(row);
  });

  // 요약 행 추가
  const totals = items.reduce(
    (acc, item) => ({
      orderQty: acc.orderQty + (item.TOTAL_ORDER_QTY ?? 0),
      outQty: acc.outQty + (item.TOTAL_OUT_QTY ?? 0),
      inQty: acc.inQty + (item.TOTAL_IN_QTY ?? 0),
      pendingQty: acc.pendingQty + (item.PENDING_QTY ?? 0),
    }),
    { orderQty: 0, outQty: 0, inQty: 0, pendingQty: 0 },
  );

  const summaryStyle: CellStyle = {
    font: { name: '맑은 고딕', sz: 10, bold: true, color: { rgb: 'FF1F2937' } },
    fill: { patternType: 'solid', fgColor: { rgb: 'FFE2E8F0' } },
    alignment: { vertical: 'center' },
    border: {
      top: { style: 'medium', color: { rgb: 'FFCBD5E1' } },
      right: { style: 'thin', color: { rgb: 'FFCBD5E1' } },
      bottom: { style: 'medium', color: { rgb: 'FFCBD5E1' } },
      left: { style: 'thin', color: { rgb: 'FFCBD5E1' } },
    },
  };

  const summaryRow: ExcelCell[] = columns.map((col, colIndex) => {
    if (colIndex === 0) {
      return { v: '합계', t: 's' as const, s: mergeCellStyles(summaryStyle, { alignment: { horizontal: 'center' } }) };
    }
    if (col.key === 'TOTAL_ORDER_QTY') {
      return { v: totals.orderQty, t: 'n' as const, s: mergeCellStyles(summaryStyle, numericStyle) };
    }
    if (col.key === 'TOTAL_OUT_QTY') {
      return { v: totals.outQty, t: 'n' as const, s: mergeCellStyles(summaryStyle, numericStyle) };
    }
    if (col.key === 'TOTAL_IN_QTY') {
      return { v: totals.inQty, t: 'n' as const, s: mergeCellStyles(summaryStyle, numericStyle) };
    }
    if (col.key === 'PENDING_QTY') {
      return { v: totals.pendingQty, t: 'n' as const, s: mergeCellStyles(summaryStyle, numericStyle) };
    }
    return { v: '', t: 's' as const, s: summaryStyle };
  });
  sheetData.push(summaryRow);

  // 워크시트 생성
  const worksheet = XLSX.utils.aoa_to_sheet(sheetData);

  // 셀 병합 (제목, 부제목)
  worksheet['!merges'] = [
    { s: { r: 0, c: 0 }, e: { r: 0, c: columns.length - 1 } },
    { s: { r: 1, c: 0 }, e: { r: 1, c: columns.length - 1 } },
  ];

  // 컬럼 너비 설정
  worksheet['!cols'] = columns.map((col) => ({ wch: col.width }));

  // 행 높이 설정
  worksheet['!rows'] = [
    { hpt: 28 }, // 제목
    { hpt: 20 }, // 부제목
    { hpt: 12 }, // 빈 행
    { hpt: 24 }, // 헤더
    ...Array(items.length).fill({ hpt: 20 }), // 데이터 행
    { hpt: 24 }, // 합계 행
  ];

  // 워크북에 시트 추가
  XLSX.utils.book_append_sheet(workbook, worksheet, '입출고현황');

  // 파일 다운로드
  XLSX.writeFile(workbook, fileName);
};
