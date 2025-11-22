import XLSX from 'xlsx-js-style';
import type { AgentStockColumn } from '../services/agentStockService';

type AgentStockRow = Record<string, string | number | null>;

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

interface ExportAgentStockOptions {
  columns: AgentStockColumn[];
  rows: AgentStockRow[];
  targetMonthLabel: string;
  generatedAt: Date;
  totalRowCount: number;
  storeColumnCount: number;
  fileName: string;
}

const TITLE_TEXT = '매장 재고 보고서';

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

const toDisplayString = (value: string | number | null | undefined): string => {
  if (value === null || value === undefined) {
    return '';
  }
  if (typeof value === 'number') {
    return value.toString();
  }
  return value;
};

const parseNumeric = (value: string | number | null | undefined): number | null => {
  if (value === null || value === undefined) {
    return null;
  }
  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : null;
  }
  const trimmed = value.replace(/,/g, '').trim();
  if (trimmed.length === 0) {
    return null;
  }
  const numeric = Number(trimmed);
  return Number.isFinite(numeric) ? numeric : null;
};

const buildInfoRow = (
  columnCount: number,
  targetMonthDisplay: string,
  generatedAt: Date,
  totalRowCount: number,
  storeColumnCount: number,
): (string | number)[] => {
  const infoRow = new Array<string | number>(columnCount).fill('');
  const infoPairs: Array<[string, string]> = [
    ['생성일시', generatedAt.toLocaleString('ko-KR')],
    ['기준월', targetMonthDisplay],
    ['총 건수', totalRowCount.toLocaleString('ko-KR')],
    ['매장 컬럼 수', storeColumnCount.toLocaleString('ko-KR')],
  ];

  infoPairs.forEach(([label, value], index) => {
    const columnIndex = index * 2;
    if (columnIndex < columnCount) {
      infoRow[columnIndex] = label;
    }
    if (columnIndex + 1 < columnCount) {
      infoRow[columnIndex + 1] = value;
    }
  });

  return infoRow;
};

const applyStyle = (worksheet: XLSX.WorkSheet, row: number, column: number, style: CellStyle) => {
  const cellAddress = XLSX.utils.encode_cell({ r: row, c: column });
  const cell = worksheet[cellAddress] as ExcelCell | undefined;
  if (!cell) {
    return;
  }
  cell.s = mergeCellStyles({ border: defaultBorder }, style);
  if (style.numFmt) {
    cell.z = style.numFmt;
  }
};

const setColumnWidths = (worksheet: XLSX.WorkSheet, data: (string | number)[][]) => {
  if (!data.length) {
    return;
  }
  const columnCount = data[0].length;
  const widths = Array.from({ length: columnCount }, (_, columnIndex) => {
    let maxLength = 0;
    data.forEach((row) => {
      const cellValue = row[columnIndex];
      const cellText = toDisplayString(cellValue);
      maxLength = Math.max(maxLength, cellText.length);
    });
    const baseWidth = Math.min(Math.max(maxLength + 2, 12), 40);
    return { wch: baseWidth };
  });
  worksheet['!cols'] = widths;
};

export const exportAgentStockToExcel = ({
  columns,
  rows,
  targetMonthLabel,
  generatedAt,
  totalRowCount,
  storeColumnCount,
  fileName,
}: ExportAgentStockOptions) => {
  if (columns.length === 0) {
    throw new Error('엑셀로 내보낼 컬럼 정보가 없습니다.');
  }

  const columnCount = columns.length;
  const blankRow = new Array<string | number>(columnCount).fill('');
  const titleRow = new Array<string | number>(columnCount).fill('');
  titleRow[0] = TITLE_TEXT;

  const infoRow = buildInfoRow(columnCount, targetMonthLabel, generatedAt, totalRowCount, storeColumnCount);
  const headerRow = columns.map((column) => column.label);

  const dataRows = rows.map((row) =>
    columns.map((column) => {
      const rawValue = row[column.key];
      if (column.storeColumn || column.totalColumn) {
        const numericValue = parseNumeric(rawValue);
        if (numericValue !== null) {
          return numericValue;
        }
      }
      if (rawValue === null || rawValue === undefined) {
        return '';
      }
      return rawValue;
    }),
  );

  const worksheetData: (string | number)[][] = [titleRow, infoRow, blankRow, headerRow, ...dataRows];
  const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);

  const headerRowIndex = 3;
  const dataStartRowIndex = headerRowIndex + 1;

  worksheet['!merges'] = [
    ...(worksheet['!merges'] ?? []),
    {
      s: { r: 0, c: 0 },
      e: { r: 0, c: columnCount - 1 },
    },
  ];

  worksheet['!freeze'] = {
    ySplit: headerRowIndex + 1,
    xSplit: 0,
  };

  const lastDataRowIndex = dataStartRowIndex + dataRows.length - 1;
  if (dataRows.length > 0) {
    worksheet['!autofilter'] = {
      ref: XLSX.utils.encode_range({
        s: { r: headerRowIndex, c: 0 },
        e: { r: lastDataRowIndex, c: columnCount - 1 },
      }),
    };
  }

  setColumnWidths(worksheet, worksheetData);

  const titleStyle: CellStyle = {
    font: { name: '맑은 고딕', sz: 16, bold: true, color: { rgb: 'FFFFFFFF' } },
    fill: { patternType: 'solid', fgColor: { rgb: 'FF1F2937' } },
    alignment: { horizontal: 'center', vertical: 'center' },
  };

  applyStyle(worksheet, 0, 0, titleStyle);
  for (let columnIndex = 1; columnIndex < columnCount; columnIndex += 1) {
    applyStyle(worksheet, 0, columnIndex, titleStyle);
  }

  const infoLabelStyle: CellStyle = {
    font: { name: '맑은 고딕', bold: true, color: { rgb: 'FF000000' } },
    alignment: { horizontal: 'left', vertical: 'center' },
    fill: { patternType: 'solid', fgColor: { rgb: 'FFFFFFFF' } },
  };

  const infoValueStyle: CellStyle = {
    font: { name: '맑은 고딕', color: { rgb: 'FF000000' } },
    alignment: { horizontal: 'left', vertical: 'center' },
    fill: { patternType: 'solid', fgColor: { rgb: 'FFFFFFFF' } },
  };

  infoRow.forEach((cellValue, columnIndex) => {
    const isLabelCell = columnIndex % 2 === 0;
    if (toDisplayString(cellValue).length === 0) {
      return;
    }
    applyStyle(worksheet, 1, columnIndex, isLabelCell ? infoLabelStyle : infoValueStyle);
  });

  const headerBaseStyle: CellStyle = {
    font: { name: '맑은 고딕', bold: true, color: { rgb: 'FFFFFFFF' } },
    alignment: { horizontal: 'center', vertical: 'center' },
  };

  const headerStoreStyle: CellStyle = {
    fill: { patternType: 'solid', fgColor: { rgb: 'FFE2E8F0' } },
    font: { name: '맑은 고딕', bold: true, color: { rgb: 'FF1F2937' } },
  };

  const headerTotalStyle: CellStyle = {
    fill: { patternType: 'solid', fgColor: { rgb: 'FFFDEAD7' } },
    font: { name: '맑은 고딕', bold: true, color: { rgb: 'FF9A3412' } },
  };

  columns.forEach((column, columnIndex) => {
    const headerStyle = column.totalColumn
      ? mergeCellStyles(headerBaseStyle, headerTotalStyle)
      : mergeCellStyles(headerBaseStyle, headerStoreStyle);
    applyStyle(worksheet, headerRowIndex, columnIndex, headerStyle);
  });

  const baseDataStyle: CellStyle = {
    font: { name: '맑은 고딕', color: { rgb: 'FF000000' } },
    alignment: { horizontal: 'left', vertical: 'center' },
    fill: { patternType: 'solid', fgColor: { rgb: 'FFFFFFFF' } },
  };

  const numericDataStyle: CellStyle = {
    alignment: { horizontal: 'right', vertical: 'center' },
    numFmt: '#,##0',
    fill: { patternType: 'solid', fgColor: { rgb: 'FFFFFFFF' } },
    font: { name: '맑은 고딕', color: { rgb: 'FF000000' } },
  };

  const totalColumnStyle: CellStyle = {
    fill: { patternType: 'solid', fgColor: { rgb: 'FFFFF4E5' } },
    font: { name: '맑은 고딕', bold: true, color: { rgb: 'FF9A3412' } },
    alignment: { horizontal: 'right', vertical: 'center' },
  };

  const grandTotalRowStyle: CellStyle = {
    fill: { patternType: 'solid', fgColor: { rgb: 'FFEFF4FB' } },
    font: { name: '맑은 고딕', bold: true, color: { rgb: 'FF1F2937' } },
  };

  dataRows.forEach((dataRow, dataRowIndex) => {
    const worksheetRowIndex = dataStartRowIndex + dataRowIndex;
    const isGrandTotalRow = toDisplayString(rows[dataRowIndex]?.['상품명']) === '총계';

    columns.forEach((column, columnIndex) => {
      const cellAddress = XLSX.utils.encode_cell({ r: worksheetRowIndex, c: columnIndex });
      const cell = worksheet[cellAddress] as ExcelCell | undefined;
      if (!cell) {
        return;
      }

      const isNumericCell = typeof dataRow[columnIndex] === 'number';
      const styles: CellStyle[] = [baseDataStyle];
      if (isNumericCell) {
        styles.push(numericDataStyle);
      }
      if (column.totalColumn) {
        styles.push(totalColumnStyle);
      }
      if (isGrandTotalRow) {
        styles.push(grandTotalRowStyle);
      }

      cell.s = mergeCellStyles({ border: defaultBorder }, ...styles);
      if (isNumericCell) {
        cell.t = 'n';
        cell.z = numericDataStyle.numFmt;
      }
    });
  });

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, '매장재고');
  XLSX.writeFile(workbook, fileName, { compression: true });
};


