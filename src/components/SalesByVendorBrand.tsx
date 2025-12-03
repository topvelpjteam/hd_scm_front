import React, { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '../store/store';
import { Search, RefreshCw, Download } from 'lucide-react';
import { 
  salesByVendorBrandService, 
  SalesDetailData,
  SalesByVendorBrandSearchParams
} from '../services/salesByVendorBrandService';
import CommonMultiSelect from './CommonMultiSelect';
import { getMenuIcon } from '../utils/menuUtils';
import XLSX from 'xlsx-js-style';
import './SalesByVendorBrand.css';
import './OrderListManagement.css';
import './orderOutStatus.css';

/**
 * 매입처(벤더) 브랜드별 매출내역 컴포넌트
 * /reports/salesByVendorBrand
 * 로우데이터 형태 - 매장별/품목별 매출 원본 데이터 표시
 * 정산금액 = 매출금액 - (매출금액 * 할인율/100)
 */
const SalesByVendorBrand: React.FC = () => {
  const { tabs, activeTabId } = useSelector((state: RootState) => state.tabs);
  const user = useSelector((state: RootState) => state.auth.user);

  const currentTab = useMemo(
    () => tabs.find((tab) => tab.id === activeTabId),
    [tabs, activeTabId],
  );

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // 로우데이터
  const [rowData, setRowData] = useState<SalesDetailData[]>([]);
  
  // 검색 필터
  const [startDate, setStartDate] = useState<string>(() => {
    const date = new Date();
    date.setMonth(date.getMonth() - 1);
    return date.toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState<string>(() => {
    return new Date().toISOString().split('T')[0];
  });
  const [brandIds, setBrandIds] = useState<string[]>([]);
  const [storeIds, setStoreIds] = useState<string[]>([]);
  const [goodsNm, setGoodsNm] = useState<string>('');

  // 로그인한 유저의 AGENT_ID (벤더용)
  const loginAgentId = user?.agentId;

  const buildSearchParams = useCallback((): SalesByVendorBrandSearchParams => {
    return {
      startDate,
      endDate,
      loginAgentId: loginAgentId || undefined,
      brandIds: brandIds.length > 0 ? brandIds.join(',') : undefined,
      storeIds: storeIds.length > 0 ? storeIds.join(',') : undefined,
      goodsNm: goodsNm || undefined,
    };
  }, [startDate, endDate, loginAgentId, brandIds, storeIds, goodsNm]);

  const handleSearch = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const params = buildSearchParams();
      const response = await salesByVendorBrandService.search(params);

      if (response.success) {
        setRowData(response.data || []);
      } else {
        setError(response.message || '데이터 조회 실패');
      }
    } catch (err) {
      console.error('검색 오류:', err);
      setError('서버 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  }, [buildSearchParams]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    await handleSearch();
  };

  const handleReset = () => {
    const date = new Date();
    date.setMonth(date.getMonth() - 1);
    setStartDate(date.toISOString().split('T')[0]);
    setEndDate(new Date().toISOString().split('T')[0]);
    setBrandIds([]);
    setStoreIds([]);
    setGoodsNm('');
  };

  const handleExcelDownload = () => {
    try {
      if (rowData.length === 0) {
        alert('다운로드할 데이터가 없습니다. 먼저 조회해주세요.');
        return;
      }
      
      // 스타일 정의
      const titleStyle = {
        font: { bold: true, sz: 16, color: { rgb: "1F4E79" } },
        alignment: { horizontal: "center", vertical: "center" },
        fill: { fgColor: { rgb: "D6DCE4" } }
      };
      
      const headerStyle = {
        font: { bold: true, sz: 10, color: { rgb: "FFFFFF" } },
        alignment: { horizontal: "center", vertical: "center" },
        fill: { fgColor: { rgb: "4472C4" } },
        border: {
          top: { style: "thin", color: { rgb: "000000" } },
          bottom: { style: "thin", color: { rgb: "000000" } },
          left: { style: "thin", color: { rgb: "000000" } },
          right: { style: "thin", color: { rgb: "000000" } }
        }
      };
      
      const dataStyle = {
        font: { sz: 9 },
        alignment: { vertical: "center" },
        border: {
          top: { style: "thin", color: { rgb: "D0D0D0" } },
          bottom: { style: "thin", color: { rgb: "D0D0D0" } },
          left: { style: "thin", color: { rgb: "D0D0D0" } },
          right: { style: "thin", color: { rgb: "D0D0D0" } }
        }
      };
      
      const dataStyleCenter = { ...dataStyle, alignment: { horizontal: "center", vertical: "center" } };
      const dataStyleRight = { ...dataStyle, alignment: { horizontal: "right", vertical: "center" } };
      
      const subtotalStyle = {
        font: { bold: true, sz: 9, color: { rgb: "C65911" } },
        alignment: { vertical: "center" },
        fill: { fgColor: { rgb: "FFF2CC" } },
        border: {
          top: { style: "thin", color: { rgb: "ED7D31" } },
          bottom: { style: "thin", color: { rgb: "ED7D31" } },
          left: { style: "thin", color: { rgb: "ED7D31" } },
          right: { style: "thin", color: { rgb: "ED7D31" } }
        }
      };
      
      const subtotalStyleRight = { ...subtotalStyle, alignment: { horizontal: "right", vertical: "center" } };
      
      const totalStyle = {
        font: { bold: true, sz: 10, color: { rgb: "1F4E79" } },
        alignment: { vertical: "center" },
        fill: { fgColor: { rgb: "BDD7EE" } },
        border: {
          top: { style: "medium", color: { rgb: "2F5496" } },
          bottom: { style: "medium", color: { rgb: "2F5496" } },
          left: { style: "thin", color: { rgb: "2F5496" } },
          right: { style: "thin", color: { rgb: "2F5496" } }
        }
      };
      
      const totalStyleRight = { ...totalStyle, alignment: { horizontal: "right", vertical: "center" } };
      
      const infoStyle = {
        font: { sz: 9, color: { rgb: "595959" } },
        alignment: { vertical: "center" }
      };

      // 컬럼 헤더 정의
      const headers = ['번호', '매입처코드', '매입처명', '할인율(%)', '브랜드코드', '브랜드명', 
                       '매장코드', '매장명', '상품코드', '상품명', '대분류', '중분류', '소분류',
                       '거래건수', '판매수량', '총금액', '할인금액', '매출금액', '정산금액'];
      
      // 매입처별로 정렬된 데이터 사용
      const sortedData = [...rowData].sort((a, b) => {
        if (a.VENDOR_ID !== b.VENDOR_ID) return a.VENDOR_ID - b.VENDOR_ID;
        if (a.BRAND_ID !== b.BRAND_ID) return a.BRAND_ID.localeCompare(b.BRAND_ID);
        return (a.GOODS_NM || '').localeCompare(b.GOODS_NM || '');
      });

      // 소계 행 위치 추적
      const subtotalRows: number[] = [];
      let totalRowIndex = 0;

      // 엑셀용 데이터 배열 (AOA - Array of Arrays 방식)
      type CellValue = string | number | { v: string | number; t?: string; s?: Record<string, unknown> };
      const excelRows: CellValue[][] = [];
      
      // 1. 제목 행 (병합될 영역)
      const titleRow: CellValue[] = [{ v: '매입처(벤더) 브랜드별 매출내역', s: titleStyle }];
      for (let i = 1; i < 19; i++) titleRow.push({ v: '', s: titleStyle });
      excelRows.push(titleRow);
      
      // 2. 빈 행
      excelRows.push([]);
      
      // 3. 조회기간 정보
      const infoRow: CellValue[] = [{ v: `조회기간: ${startDate} ~ ${endDate}`, s: infoStyle }];
      for (let i = 1; i < 18; i++) infoRow.push({ v: '', s: infoStyle });
      infoRow.push({ v: `출력일: ${new Date().toLocaleDateString('ko-KR')}`, s: { ...infoStyle, alignment: { horizontal: "right", vertical: "center" } } });
      excelRows.push(infoRow);
      
      // 4. 빈 행
      excelRows.push([]);
      
      // 5. 헤더 행
      const headerRow: CellValue[] = headers.map(h => ({ v: h, s: headerStyle }));
      excelRows.push(headerRow);

      let currentVendorId: number | null = null;
      let vendorSubtotal = { TR_CNT: 0, SALE_QTY: 0, TOT_AMT: 0, DISCOUNT_AMT: 0, SALE_AMT: 0, SETTLE_AMT: 0 };
      let rowNum = 0;

      // 6. 데이터 행들
      sortedData.forEach((row, idx) => {
        // 매입처가 바뀌면 이전 매입처의 소계 추가
        if (currentVendorId !== null && currentVendorId !== row.VENDOR_ID) {
          subtotalRows.push(excelRows.length);
          excelRows.push([
            { v: '', s: subtotalStyle },
            { v: '', s: subtotalStyle },
            { v: '【소계】', s: subtotalStyle },
            { v: '', s: subtotalStyle },
            { v: '', s: subtotalStyle },
            { v: '', s: subtotalStyle },
            { v: '', s: subtotalStyle },
            { v: '', s: subtotalStyle },
            { v: '', s: subtotalStyle },
            { v: '', s: subtotalStyle },
            { v: '', s: subtotalStyle },
            { v: '', s: subtotalStyle },
            { v: '', s: subtotalStyle },
            { v: vendorSubtotal.TR_CNT, s: subtotalStyleRight },
            { v: vendorSubtotal.SALE_QTY, s: subtotalStyleRight },
            { v: vendorSubtotal.TOT_AMT, s: subtotalStyleRight },
            { v: vendorSubtotal.DISCOUNT_AMT, s: subtotalStyleRight },
            { v: vendorSubtotal.SALE_AMT, s: subtotalStyleRight },
            { v: vendorSubtotal.SETTLE_AMT, s: subtotalStyleRight }
          ]);
          vendorSubtotal = { TR_CNT: 0, SALE_QTY: 0, TOT_AMT: 0, DISCOUNT_AMT: 0, SALE_AMT: 0, SETTLE_AMT: 0 };
        }

        currentVendorId = row.VENDOR_ID;
        rowNum++;
        
        // 소계 누적
        vendorSubtotal.TR_CNT += row.TR_CNT || 0;
        vendorSubtotal.SALE_QTY += row.SALE_QTY || 0;
        vendorSubtotal.TOT_AMT += row.TOT_AMT || 0;
        vendorSubtotal.DISCOUNT_AMT += row.DISCOUNT_AMT || 0;
        vendorSubtotal.SALE_AMT += row.SALE_AMT || 0;
        vendorSubtotal.SETTLE_AMT += row.SETTLE_AMT || 0;

        excelRows.push([
          { v: rowNum, s: dataStyleCenter },
          { v: row.VENDOR_ID, s: dataStyleCenter },
          { v: row.VENDOR_NM || '', s: dataStyle },
          { v: row.SALE_RATE || 0, s: dataStyleRight },
          { v: row.BRAND_ID || '', s: dataStyleCenter },
          { v: row.BRAND_NM || '', s: dataStyle },
          { v: row.STORE_ID, s: dataStyleCenter },
          { v: row.STORE_NM || '', s: dataStyle },
          { v: row.GOODS_ID_BRAND || row.GOODS_ID || '', s: dataStyleCenter },
          { v: row.GOODS_NM || '', s: dataStyle },
          { v: row.BTYPE_GBN_NM || '', s: dataStyle },
          { v: row.MTYPE_GBN_NM || '', s: dataStyle },
          { v: row.STYPE_GBN_NM || '', s: dataStyle },
          { v: row.TR_CNT || 0, s: dataStyleRight },
          { v: row.SALE_QTY || 0, s: dataStyleRight },
          { v: row.TOT_AMT || 0, s: dataStyleRight },
          { v: row.DISCOUNT_AMT || 0, s: dataStyleRight },
          { v: row.SALE_AMT || 0, s: dataStyleRight },
          { v: row.SETTLE_AMT || 0, s: dataStyleRight }
        ]);

        // 마지막 행이면 마지막 매입처 소계 추가
        if (idx === sortedData.length - 1) {
          subtotalRows.push(excelRows.length);
          excelRows.push([
            { v: '', s: subtotalStyle },
            { v: '', s: subtotalStyle },
            { v: '【소계】', s: subtotalStyle },
            { v: '', s: subtotalStyle },
            { v: '', s: subtotalStyle },
            { v: '', s: subtotalStyle },
            { v: '', s: subtotalStyle },
            { v: '', s: subtotalStyle },
            { v: '', s: subtotalStyle },
            { v: '', s: subtotalStyle },
            { v: '', s: subtotalStyle },
            { v: '', s: subtotalStyle },
            { v: '', s: subtotalStyle },
            { v: vendorSubtotal.TR_CNT, s: subtotalStyleRight },
            { v: vendorSubtotal.SALE_QTY, s: subtotalStyleRight },
            { v: vendorSubtotal.TOT_AMT, s: subtotalStyleRight },
            { v: vendorSubtotal.DISCOUNT_AMT, s: subtotalStyleRight },
            { v: vendorSubtotal.SALE_AMT, s: subtotalStyleRight },
            { v: vendorSubtotal.SETTLE_AMT, s: subtotalStyleRight }
          ]);
        }
      });

      // 7. 빈 행
      excelRows.push([]);

      // 8. 총합계 행
      totalRowIndex = excelRows.length;
      excelRows.push([
        { v: '', s: totalStyle },
        { v: '', s: totalStyle },
        { v: '【총합계】', s: totalStyle },
        { v: '', s: totalStyle },
        { v: '', s: totalStyle },
        { v: '', s: totalStyle },
        { v: '', s: totalStyle },
        { v: '', s: totalStyle },
        { v: '', s: totalStyle },
        { v: '', s: totalStyle },
        { v: '', s: totalStyle },
        { v: '', s: totalStyle },
        { v: '', s: totalStyle },
        { v: totals.TR_CNT, s: totalStyleRight },
        { v: totals.SALE_QTY, s: totalStyleRight },
        { v: totals.TOT_AMT, s: totalStyleRight },
        { v: totals.DISCOUNT_AMT, s: totalStyleRight },
        { v: totals.SALE_AMT, s: totalStyleRight },
        { v: totals.SETTLE_AMT, s: totalStyleRight }
      ]);

      // 워크시트 생성
      const ws = XLSX.utils.aoa_to_sheet(excelRows);

      // 컬럼 너비 설정
      ws['!cols'] = [
        { wch: 6 },   // 번호
        { wch: 10 },  // 매입처코드
        { wch: 20 },  // 매입처명
        { wch: 10 },  // 할인율
        { wch: 12 },  // 브랜드코드
        { wch: 15 },  // 브랜드명
        { wch: 10 },  // 매장코드
        { wch: 20 },  // 매장명
        { wch: 15 },  // 상품코드
        { wch: 25 },  // 상품명
        { wch: 12 },  // 대분류
        { wch: 12 },  // 중분류
        { wch: 12 },  // 소분류
        { wch: 10 },  // 거래건수
        { wch: 10 },  // 판매수량
        { wch: 14 },  // 총금액
        { wch: 12 },  // 할인금액
        { wch: 14 },  // 매출금액
        { wch: 14 },  // 정산금액
      ];

      // 제목 행 병합 (A1:S1)
      ws['!merges'] = [
        { s: { r: 0, c: 0 }, e: { r: 0, c: 18 } }, // 제목 병합
      ];

      // 행 높이 설정
      ws['!rows'] = [
        { hpt: 28 }, // 제목 행 높이
      ];

      // 숫자 형식 지정 (모든 숫자 컬럼에 천단위 콤마)
      const numFmt = '#,##0';
      const range = XLSX.utils.decode_range(ws['!ref'] || 'A1');
      
      // 각 셀에 숫자 형식 적용
      for (let R = 0; R <= range.e.r; R++) {
        for (let C = 0; C <= range.e.c; C++) {
          const cellRef = XLSX.utils.encode_cell({ r: R, c: C });
          if (ws[cellRef]) {
            // 기존 스타일 유지하면서 numFmt 추가
            if (typeof ws[cellRef].v === 'number') {
              if (!ws[cellRef].s) {
                ws[cellRef].s = {};
              }
              ws[cellRef].s.numFmt = numFmt;
            }
          }
        }
      }

      // 소계 행 추적 로그 (디버깅용, 필요시 제거)
      console.log('소계 행 위치:', subtotalRows);
      console.log('총합계 행 위치:', totalRowIndex);

      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, '매입처브랜드별매출내역');
      XLSX.writeFile(wb, `매입처브랜드별매출내역_${startDate}_${endDate}.xlsx`);
    } catch (err) {
      console.error('엑셀 다운로드 오류:', err);
      alert('엑셀 다운로드 중 오류가 발생했습니다.');
    }
  };

  const formatNumber = (num: number | null | undefined): string => {
    if (num === null || num === undefined) return '0';
    return num.toLocaleString('ko-KR');
  };

  // 합계 계산
  const totals = useMemo(() => {
    return rowData.reduce((acc, row) => ({
      TR_CNT: acc.TR_CNT + (row.TR_CNT || 0),
      SALE_QTY: acc.SALE_QTY + (row.SALE_QTY || 0),
      TOT_AMT: acc.TOT_AMT + (row.TOT_AMT || 0),
      DISCOUNT_AMT: acc.DISCOUNT_AMT + (row.DISCOUNT_AMT || 0),
      SALE_AMT: acc.SALE_AMT + (row.SALE_AMT || 0),
      SETTLE_AMT: acc.SETTLE_AMT + (row.SETTLE_AMT || 0),
    }), { TR_CNT: 0, SALE_QTY: 0, TOT_AMT: 0, DISCOUNT_AMT: 0, SALE_AMT: 0, SETTLE_AMT: 0 });
  }, [rowData]);

  // 매입처별로 정렬된 데이터와 소계 계산
  const sortedDataWithSubtotals = useMemo((): { sorted: SalesDetailData[]; vendorSubtotals: Record<number, { TR_CNT: number; SALE_QTY: number; TOT_AMT: number; DISCOUNT_AMT: number; SALE_AMT: number; SETTLE_AMT: number }> } => {
    if (rowData.length === 0) return { sorted: [], vendorSubtotals: {} };

    // 매입처 > 브랜드 > 상품명 순으로 정렬
    const sorted = [...rowData].sort((a, b) => {
      if (a.VENDOR_ID !== b.VENDOR_ID) return a.VENDOR_ID - b.VENDOR_ID;
      if (a.BRAND_ID !== b.BRAND_ID) return a.BRAND_ID.localeCompare(b.BRAND_ID);
      return (a.GOODS_NM || '').localeCompare(b.GOODS_NM || '');
    });

    // 매입처별 소계 계산
    const vendorSubtotals: Record<number, { TR_CNT: number; SALE_QTY: number; TOT_AMT: number; DISCOUNT_AMT: number; SALE_AMT: number; SETTLE_AMT: number }> = {};
    sorted.forEach(row => {
      if (!vendorSubtotals[row.VENDOR_ID]) {
        vendorSubtotals[row.VENDOR_ID] = { TR_CNT: 0, SALE_QTY: 0, TOT_AMT: 0, DISCOUNT_AMT: 0, SALE_AMT: 0, SETTLE_AMT: 0 };
      }
      vendorSubtotals[row.VENDOR_ID].TR_CNT += row.TR_CNT || 0;
      vendorSubtotals[row.VENDOR_ID].SALE_QTY += row.SALE_QTY || 0;
      vendorSubtotals[row.VENDOR_ID].TOT_AMT += row.TOT_AMT || 0;
      vendorSubtotals[row.VENDOR_ID].DISCOUNT_AMT += row.DISCOUNT_AMT || 0;
      vendorSubtotals[row.VENDOR_ID].SALE_AMT += row.SALE_AMT || 0;
      vendorSubtotals[row.VENDOR_ID].SETTLE_AMT += row.SETTLE_AMT || 0;
    });

    return { sorted, vendorSubtotals };
  }, [rowData]);

  // 스크롤 동기화를 위한 ref
  const tableContainerRef = useRef<HTMLDivElement>(null);
  const bottomScrollRef = useRef<HTMLDivElement>(null);
  const scrollContentRef = useRef<HTMLDivElement>(null);

  // 테이블 너비 동기화
  useEffect(() => {
    const updateScrollWidth = () => {
      if (tableContainerRef.current && scrollContentRef.current) {
        const tableWidth = tableContainerRef.current.scrollWidth;
        scrollContentRef.current.style.width = `${tableWidth}px`;
      }
    };
    updateScrollWidth();
    window.addEventListener('resize', updateScrollWidth);
    return () => window.removeEventListener('resize', updateScrollWidth);
  }, [rowData]);

  // 스크롤 동기화 핸들러
  const handleTableScroll = useCallback(() => {
    if (tableContainerRef.current && bottomScrollRef.current) {
      bottomScrollRef.current.scrollLeft = tableContainerRef.current.scrollLeft;
    }
  }, []);

  const handleBottomScroll = useCallback(() => {
    if (tableContainerRef.current && bottomScrollRef.current) {
      tableContainerRef.current.scrollLeft = bottomScrollRef.current.scrollLeft;
    }
  }, []);

  return (
    <div className="olm-container order-out-status-page svb-page">
      {/* 상단 섹션 */}
      <div className="top-section">
        <h1 className="page-title">
          {currentTab?.menuIcon
            ? React.createElement(getMenuIcon(currentTab.menuIcon), { size: 14 })
            : <i className="fas fa-chart-bar"></i>}
          매입처(벤더)브랜드별매출내역
        </h1>
        
        {/* 검색 조건 */}
        <form className="search-conditions" onSubmit={handleSubmit}>
          <div className="search-row">
            <div className="search-item">
              <label>시작일</label>
              <input 
                type="date" 
                className="olm-form-control"
                value={startDate} 
                onChange={(e) => setStartDate(e.target.value)} 
              />
            </div>
            <div className="search-item">
              <label>종료일</label>
              <input 
                type="date" 
                className="olm-form-control"
                value={endDate} 
                onChange={(e) => setEndDate(e.target.value)} 
              />
            </div>
            <div className="search-item">
              <label>브랜드</label>
              <CommonMultiSelect
                commonCodeType="brands"
                selectedValues={brandIds}
                onSelectionChange={setBrandIds}
                placeholder="전체"
                className="olm-multi-select"
              />
            </div>
            <div className="search-item">
              <label>매장</label>
              <CommonMultiSelect
                commonCodeType="stores"
                selectedValues={storeIds}
                onSelectionChange={setStoreIds}
                placeholder="전체"
                className="olm-multi-select"
              />
            </div>
            <div className="search-item">
              <label>상품명</label>
              <input 
                type="text" 
                className="olm-form-control"
                value={goodsNm}
                onChange={(e) => setGoodsNm(e.target.value)}
                placeholder="상품명 검색"
              />
            </div>

          </div>
            <div className="action-buttons">
              <div className="right-buttons">
                <button type="button" className="olm-btn olm-btn-secondary" onClick={handleReset}>
                  <RefreshCw size={12} /> 초기화
                </button>
                <button type="button" className="olm-btn olm-btn-success" onClick={handleExcelDownload} disabled={isLoading || rowData.length === 0}>
                  <Download size={12} /> 엑셀다운로드
                </button>
                <button type="submit" className="olm-btn olm-btn-primary" disabled={isLoading}>
                  <Search size={12} /> {isLoading ? '조회중...' : '조회'}
                </button>
              </div>
            </div>


        </form>
      </div>

      {/* 본문 - 로우데이터 테이블 */}
      <div className="svb-content">
        {/* 에러 */}
        {error && (
          <div className="svb-error">
            <i className="fas fa-exclamation-circle"></i> {error}
          </div>
        )}

        {/* 데이터 건수 */}
        <div className="svb-info-bar">
          <span className="svb-count">조회결과: <strong>{formatNumber(rowData.length)}</strong>건</span>
          {rowData.length > 0 && (
            <span className="svb-period">| 조회기간: {startDate} ~ {endDate}</span>
          )}
        </div>

        {/* 로우데이터 테이블 */}
        <div className="svb-table-wrapper">
          <div 
            className="svb-table-container" 
            ref={tableContainerRef}
            onScroll={handleTableScroll}
          >
            <table className="svb-table">
            <thead>
              <tr>
                <th>No</th>
                <th>매입처코드</th>
                <th>매입처명</th>
                <th>할인율(%)</th>
                <th>브랜드코드</th>
                <th>브랜드명</th>
                <th>매장코드</th>
                <th>매장명</th>
                <th>상품코드</th>
                <th>상품명</th>
                <th>대분류</th>
                <th>중분류</th>
                <th>소분류</th>
                <th>거래건수</th>
                <th>판매수량</th>
                <th>총금액</th>
                <th>할인금액</th>
                <th>매출금액</th>
                <th>정산금액</th>
              </tr>
            </thead>
            <tbody>
              {sortedDataWithSubtotals.sorted && sortedDataWithSubtotals.sorted.length > 0 ? (
                <>
                  {(() => {
                    const rows: React.ReactNode[] = [];
                    let currentVendorId: number | null = null;
                    let rowNum = 0;

                    sortedDataWithSubtotals.sorted.forEach((row, idx) => {
                      // 매입처가 바뀌면 이전 매입처의 소계 행 추가
                      if (currentVendorId !== null && currentVendorId !== row.VENDOR_ID) {
                        const subtotal = sortedDataWithSubtotals.vendorSubtotals[currentVendorId];
                        rows.push(
                          <tr key={`subtotal-${currentVendorId}`} className="subtotal-row">
                            <td colSpan={13} className="center">【소계】</td>
                            <td className="right">{formatNumber(subtotal.TR_CNT)}</td>
                            <td className="right">{formatNumber(subtotal.SALE_QTY)}</td>
                            <td className="right">{formatNumber(subtotal.TOT_AMT)}</td>
                            <td className="right">{formatNumber(subtotal.DISCOUNT_AMT)}</td>
                            <td className="right">{formatNumber(subtotal.SALE_AMT)}</td>
                            <td className="right highlight">{formatNumber(subtotal.SETTLE_AMT)}</td>
                          </tr>
                        );
                      }

                      currentVendorId = row.VENDOR_ID;
                      rowNum++;

                      rows.push(
                        <tr key={`${row.STORE_ID}-${row.GOODS_ID}-${idx}`}>
                          <td className="center">{rowNum}</td>
                          <td className="center">{row.VENDOR_ID}</td>
                          <td>{row.VENDOR_NM}</td>
                          <td className="right">{row.SALE_RATE > 0 ? row.SALE_RATE.toFixed(2) : '-'}</td>
                          <td className="center">{row.BRAND_ID}</td>
                          <td>{row.BRAND_NM}</td>
                          <td className="center">{row.STORE_ID}</td>
                          <td>{row.STORE_SHORT_NM || row.STORE_NM}</td>
                          <td className="center">{row.GOODS_ID_BRAND || row.GOODS_ID}</td>
                          <td>{row.GOODS_NM}</td>
                          <td>{row.BTYPE_GBN_NM}</td>
                          <td>{row.MTYPE_GBN_NM}</td>
                          <td>{row.STYPE_GBN_NM}</td>
                          <td className="right">{formatNumber(row.TR_CNT)}</td>
                          <td className="right">{formatNumber(row.SALE_QTY)}</td>
                          <td className="right">{formatNumber(row.TOT_AMT)}</td>
                          <td className="right">{formatNumber(row.DISCOUNT_AMT)}</td>
                          <td className="right">{formatNumber(row.SALE_AMT)}</td>
                          <td className="right highlight">{formatNumber(row.SETTLE_AMT)}</td>
                        </tr>
                      );

                      // 마지막 행이면 마지막 매입처의 소계 추가
                      if (idx === sortedDataWithSubtotals.sorted.length - 1) {
                        const subtotal = sortedDataWithSubtotals.vendorSubtotals[currentVendorId];
                        rows.push(
                          <tr key={`subtotal-${currentVendorId}-last`} className="subtotal-row">
                            <td colSpan={13} className="center">【소계】</td>
                            <td className="right">{formatNumber(subtotal.TR_CNT)}</td>
                            <td className="right">{formatNumber(subtotal.SALE_QTY)}</td>
                            <td className="right">{formatNumber(subtotal.TOT_AMT)}</td>
                            <td className="right">{formatNumber(subtotal.DISCOUNT_AMT)}</td>
                            <td className="right">{formatNumber(subtotal.SALE_AMT)}</td>
                            <td className="right highlight">{formatNumber(subtotal.SETTLE_AMT)}</td>
                          </tr>
                        );
                      }
                    });

                    return rows;
                  })()}
                </>
              ) : (
                <tr>
                  <td colSpan={19} className="empty">
                    {isLoading ? '데이터를 조회 중입니다...' : '조회 버튼을 클릭하여 데이터를 조회하세요.'}
                  </td>
                </tr>
              )}
            </tbody>
            {rowData.length > 0 && (
              <tfoot>
                <tr className="total-row">
                  <td colSpan={13} className="center">합계</td>
                  <td className="right">{formatNumber(totals.TR_CNT)}</td>
                  <td className="right">{formatNumber(totals.SALE_QTY)}</td>
                  <td className="right">{formatNumber(totals.TOT_AMT)}</td>
                  <td className="right">{formatNumber(totals.DISCOUNT_AMT)}</td>
                  <td className="right">{formatNumber(totals.SALE_AMT)}</td>
                  <td className="right highlight">{formatNumber(totals.SETTLE_AMT)}</td>
                </tr>
              </tfoot>
            )}
          </table>
          </div>
          {/* 하단 고정 가로 스크롤바 */}
          <div 
            className="svb-horizontal-scroll" 
            ref={bottomScrollRef}
            onScroll={handleBottomScroll}
          >
            <div ref={scrollContentRef} style={{ height: '1px' }}></div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SalesByVendorBrand;
