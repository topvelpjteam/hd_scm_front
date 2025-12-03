import React, { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '../store/store';
import { Search, RefreshCw, Download } from 'lucide-react';
import { 
  orderInByVendorService, 
  OrderInDetailData,
  OrderInByVendorSearchParams
} from '../services/orderInByVendorService';
import CommonMultiSelect from './CommonMultiSelect';
import { getMenuIcon } from '../utils/menuUtils';
import XLSX from 'xlsx-js-style';
import './OrderInByVendor.css';
import './OrderListManagement.css';
import './orderOutStatus.css';

/**
 * 매입처별 발주/입고내역 컴포넌트
 * /reports/orderInByVendor
 * 발주수량 대비 입고수량 비교, 미입고수량 확인
 */
const OrderInByVendor: React.FC = () => {
  const { tabs, activeTabId } = useSelector((state: RootState) => state.tabs);
  const user = useSelector((state: RootState) => state.auth.user);

  const currentTab = useMemo(
    () => tabs.find((tab) => tab.id === activeTabId),
    [tabs, activeTabId],
  );

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // 로우데이터
  const [rowData, setRowData] = useState<OrderInDetailData[]>([]);
  
  // 검색 필터
  const [startDate, setStartDate] = useState<string>(() => {
    const date = new Date();
    date.setMonth(date.getMonth() - 1);
    return date.toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState<string>(() => {
    return new Date().toISOString().split('T')[0];
  });
  const [vendorIds, setVendorIds] = useState<string[]>([]);
  const [brandIds, setBrandIds] = useState<string[]>([]);
  const [storeIds, setStoreIds] = useState<string[]>([]);
  const [goodsNm, setGoodsNm] = useState<string>('');
  const [inStatus, setInStatus] = useState<string>('ALL');

  // 로그인한 유저의 AGENT_ID (벤더용)
  const loginAgentId = user?.agentId;

  const buildSearchParams = useCallback((): OrderInByVendorSearchParams => {
    return {
      startDate,
      endDate,
      loginAgentId: loginAgentId || undefined,
      vendorIds: vendorIds.length > 0 ? vendorIds.join(',') : undefined,
      brandIds: brandIds.length > 0 ? brandIds.join(',') : undefined,
      storeIds: storeIds.length > 0 ? storeIds.join(',') : undefined,
      goodsNm: goodsNm || undefined,
      inStatus: inStatus || 'ALL',
    };
  }, [startDate, endDate, loginAgentId, vendorIds, brandIds, storeIds, goodsNm, inStatus]);

  const handleSearch = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const params = buildSearchParams();
      const response = await orderInByVendorService.search(params);

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
    setVendorIds([]);
    setBrandIds([]);
    setStoreIds([]);
    setGoodsNm('');
    setInStatus('ALL');
  };

  const formatNumber = (num: number | null | undefined): string => {
    if (num === null || num === undefined) return '0';
    return num.toLocaleString('ko-KR');
  };

  const formatDate = (dateStr: string | null | undefined): string => {
    if (!dateStr) return '-';
    // YYYYMMDD -> YYYY-MM-DD
    if (dateStr.length === 8 && !dateStr.includes('-')) {
      return `${dateStr.slice(0, 4)}-${dateStr.slice(4, 6)}-${dateStr.slice(6, 8)}`;
    }
    return dateStr;
  };

  const getInRateClass = (rate: number): string => {
    if (rate >= 100) return 'highlight';
    return '';
  };

  // 합계 계산
  const totals = useMemo(() => {
    return rowData.reduce((acc, row) => ({
      ORDER_QTY: acc.ORDER_QTY + (row.ORDER_QTY || 0),
      ORDER_TOT: acc.ORDER_TOT + (row.ORDER_TOT || 0),
      OUT_QTY: acc.OUT_QTY + (row.OUT_QTY || 0),
      IN_TOT_QTY: acc.IN_TOT_QTY + (row.IN_TOT_QTY || 0),
      IN_GOOD_QTY: acc.IN_GOOD_QTY + (row.IN_GOOD_QTY || 0),
      IN_BAD_QTY: acc.IN_BAD_QTY + (row.IN_BAD_QTY || 0),
      NOT_IN_QTY: acc.NOT_IN_QTY + (row.NOT_IN_QTY || 0),
      IN_TOT: acc.IN_TOT + (row.IN_TOT || 0),
    }), { ORDER_QTY: 0, ORDER_TOT: 0, OUT_QTY: 0, IN_TOT_QTY: 0, IN_GOOD_QTY: 0, IN_BAD_QTY: 0, NOT_IN_QTY: 0, IN_TOT: 0 });
  }, [rowData]);

  // 전체 입고율 계산
  const totalInRate = useMemo(() => {
    if (totals.ORDER_QTY === 0) return 0;
    return Math.round((totals.IN_TOT_QTY / totals.ORDER_QTY) * 1000) / 10;
  }, [totals]);

  // 매입처별로 정렬된 데이터와 소계 계산
  const sortedDataWithSubtotals = useMemo((): { 
    sorted: OrderInDetailData[]; 
    vendorSubtotals: Record<number, { 
      ORDER_QTY: number; ORDER_TOT: number; OUT_QTY: number; 
      IN_TOT_QTY: number; IN_GOOD_QTY: number; IN_BAD_QTY: number; 
      NOT_IN_QTY: number; IN_TOT: number 
    }> 
  } => {
    if (rowData.length === 0) return { sorted: [], vendorSubtotals: {} };

    // 매입처 > 발주일 > 상품명 순으로 정렬
    const sorted = [...rowData].sort((a, b) => {
      if (a.VENDOR_ID !== b.VENDOR_ID) return a.VENDOR_ID - b.VENDOR_ID;
      if (a.ORDER_D !== b.ORDER_D) return b.ORDER_D.localeCompare(a.ORDER_D); // 최신순
      return (a.GOODS_NM || '').localeCompare(b.GOODS_NM || '');
    });

    // 매입처별 소계 계산
    const vendorSubtotals: Record<number, { 
      ORDER_QTY: number; ORDER_TOT: number; OUT_QTY: number; 
      IN_TOT_QTY: number; IN_GOOD_QTY: number; IN_BAD_QTY: number; 
      NOT_IN_QTY: number; IN_TOT: number 
    }> = {};
    sorted.forEach(row => {
      if (!vendorSubtotals[row.VENDOR_ID]) {
        vendorSubtotals[row.VENDOR_ID] = { 
          ORDER_QTY: 0, ORDER_TOT: 0, OUT_QTY: 0, 
          IN_TOT_QTY: 0, IN_GOOD_QTY: 0, IN_BAD_QTY: 0, 
          NOT_IN_QTY: 0, IN_TOT: 0 
        };
      }
      vendorSubtotals[row.VENDOR_ID].ORDER_QTY += row.ORDER_QTY || 0;
      vendorSubtotals[row.VENDOR_ID].ORDER_TOT += row.ORDER_TOT || 0;
      vendorSubtotals[row.VENDOR_ID].OUT_QTY += row.OUT_QTY || 0;
      vendorSubtotals[row.VENDOR_ID].IN_TOT_QTY += row.IN_TOT_QTY || 0;
      vendorSubtotals[row.VENDOR_ID].IN_GOOD_QTY += row.IN_GOOD_QTY || 0;
      vendorSubtotals[row.VENDOR_ID].IN_BAD_QTY += row.IN_BAD_QTY || 0;
      vendorSubtotals[row.VENDOR_ID].NOT_IN_QTY += row.NOT_IN_QTY || 0;
      vendorSubtotals[row.VENDOR_ID].IN_TOT += row.IN_TOT || 0;
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

  // 테이블 행 렌더링은 return 함수 내 renderTableRows 함수 내에서 처리
  
  // 엑셀 다운로드
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
      
      // 숫자 형식이 포함된 스타일
      const dataStyleRightNum = { 
        ...dataStyleRight, 
        numFmt: '#,##0' 
      };
      
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
      const subtotalStyleRightNum = { 
        ...subtotalStyleRight, 
        numFmt: '#,##0' 
      };
      
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
      const totalStyleRightNum = { 
        ...totalStyleRight, 
        numFmt: '#,##0' 
      };
      
      const infoStyle = {
        font: { sz: 9, color: { rgb: "595959" } },
        alignment: { vertical: "center" }
      };

      // 컬럼 헤더 정의
      const headers = ['번호', '매입처코드', '매입처명', '브랜드코드', '브랜드명', '발주일', '매장명', 
                       '상품코드', '상품명', '입고요구일', '발주수량', '발주금액', '출고일', '출고수량', 
                       '입고일', '입고수량', '양호수량', '불량수량', '입고금액', '미입고수량', '입고율(%)', '입고상태'];
      
      // 매입처별로 정렬된 데이터 사용
      const { sorted, vendorSubtotals } = sortedDataWithSubtotals;

      // 엑셀용 데이터 배열
      type CellValue = string | number | { v: string | number; t?: string; s?: Record<string, unknown> };
      const excelRows: CellValue[][] = [];
      
      // 1. 제목 행
      const titleRow: CellValue[] = [{ v: '매입처별 발주/입고내역', s: titleStyle }];
      for (let i = 1; i < 22; i++) titleRow.push({ v: '', s: titleStyle });
      excelRows.push(titleRow);
      
      // 2. 빈 행
      excelRows.push([]);
      
      // 3. 조회기간 정보
      const infoRow: CellValue[] = [{ v: `발주기간: ${startDate} ~ ${endDate}`, s: infoStyle }];
      for (let i = 1; i < 21; i++) infoRow.push({ v: '', s: infoStyle });
      infoRow.push({ v: `출력일: ${new Date().toLocaleDateString('ko-KR')}`, s: { ...infoStyle, alignment: { horizontal: "right", vertical: "center" } } });
      excelRows.push(infoRow);
      
      // 4. 빈 행
      excelRows.push([]);
      
      // 5. 헤더 행
      const headerRow: CellValue[] = headers.map(h => ({ v: h, s: headerStyle }));
      excelRows.push(headerRow);

      let currentVendorId: number | null = null;
      let rowNum = 0;

      // 6. 데이터 행들
      sorted.forEach((row, idx) => {
        // 매입처가 바뀌면 이전 매입처의 소계 추가
        if (currentVendorId !== null && currentVendorId !== row.VENDOR_ID) {
          const subtotal = vendorSubtotals[currentVendorId];
          const subInRate = subtotal.ORDER_QTY > 0 
            ? Math.round((subtotal.IN_TOT_QTY / subtotal.ORDER_QTY) * 1000) / 10 
            : 0;
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
            { v: subtotal.ORDER_QTY, s: { ...subtotalStyleRightNum } },
            { v: subtotal.ORDER_TOT, s: { ...subtotalStyleRightNum } },
            { v: '', s: subtotalStyle },
            { v: subtotal.OUT_QTY, s: { ...subtotalStyleRightNum } },
            { v: '', s: subtotalStyle },
            { v: subtotal.IN_TOT_QTY, s: { ...subtotalStyleRightNum } },
            { v: subtotal.IN_GOOD_QTY, s: { ...subtotalStyleRightNum } },
            { v: subtotal.IN_BAD_QTY, s: { ...subtotalStyleRightNum } },
            { v: subtotal.IN_TOT, s: { ...subtotalStyleRightNum } },
            { v: subtotal.NOT_IN_QTY, s: { ...subtotalStyleRightNum } },
            { v: subInRate.toFixed(1), s: subtotalStyleRight },
            { v: '', s: subtotalStyle }
          ]);
        }

        currentVendorId = row.VENDOR_ID;
        rowNum++;

        excelRows.push([
          { v: rowNum, s: dataStyleCenter },
          { v: row.VENDOR_ID, s: dataStyleCenter },
          { v: row.VENDOR_NM || '', s: dataStyle },
          { v: row.BRAND_ID || '', s: dataStyleCenter },
          { v: row.BRAND_NM || '', s: dataStyle },
          { v: formatDate(row.ORDER_D), s: dataStyleCenter },
          { v: row.STORE_NM || '', s: dataStyle },
          { v: row.GOODS_ID_BRAND || row.GOODS_ID || '', s: dataStyleCenter },
          { v: row.GOODS_NM || '', s: dataStyle },
          { v: formatDate(row.REQUIRE_D), s: dataStyleCenter },
          { v: row.ORDER_QTY || 0, s: { ...dataStyleRightNum } },
          { v: row.ORDER_TOT || 0, s: { ...dataStyleRightNum } },
          { v: formatDate(row.OUT_D), s: dataStyleCenter },
          { v: row.OUT_QTY || 0, s: { ...dataStyleRightNum } },
          { v: formatDate(row.IN_D), s: dataStyleCenter },
          { v: row.IN_TOT_QTY || 0, s: { ...dataStyleRightNum } },
          { v: row.IN_GOOD_QTY || 0, s: { ...dataStyleRightNum } },
          { v: row.IN_BAD_QTY || 0, s: { ...dataStyleRightNum } },
          { v: row.IN_TOT || 0, s: { ...dataStyleRightNum } },
          { v: row.NOT_IN_QTY || 0, s: { ...dataStyleRightNum } },
          { v: row.IN_RATE?.toFixed(1) || '0.0', s: dataStyleRight },
          { v: row.IN_STATUS_NM || '', s: dataStyleCenter }
        ]);

        // 마지막 행이면 마지막 매입처 소계 추가
        if (idx === sorted.length - 1) {
          const subtotal = vendorSubtotals[currentVendorId];
          const subInRate = subtotal.ORDER_QTY > 0 
            ? Math.round((subtotal.IN_TOT_QTY / subtotal.ORDER_QTY) * 1000) / 10 
            : 0;
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
            { v: subtotal.ORDER_QTY, s: { ...subtotalStyleRightNum } },
            { v: subtotal.ORDER_TOT, s: { ...subtotalStyleRightNum } },
            { v: '', s: subtotalStyle },
            { v: subtotal.OUT_QTY, s: { ...subtotalStyleRightNum } },
            { v: '', s: subtotalStyle },
            { v: subtotal.IN_TOT_QTY, s: { ...subtotalStyleRightNum } },
            { v: subtotal.IN_GOOD_QTY, s: { ...subtotalStyleRightNum } },
            { v: subtotal.IN_BAD_QTY, s: { ...subtotalStyleRightNum } },
            { v: subtotal.IN_TOT, s: { ...subtotalStyleRightNum } },
            { v: subtotal.NOT_IN_QTY, s: { ...subtotalStyleRightNum } },
            { v: subInRate.toFixed(1), s: subtotalStyleRight },
            { v: '', s: subtotalStyle }
          ]);
        }
      });

      // 7. 빈 행
      excelRows.push([]);

      // 8. 총합계 행
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
        { v: totals.ORDER_QTY, s: { ...totalStyleRightNum } },
        { v: totals.ORDER_TOT, s: { ...totalStyleRightNum } },
        { v: '', s: totalStyle },
        { v: totals.OUT_QTY, s: { ...totalStyleRightNum } },
        { v: '', s: totalStyle },
        { v: totals.IN_TOT_QTY, s: { ...totalStyleRightNum } },
        { v: totals.IN_GOOD_QTY, s: { ...totalStyleRightNum } },
        { v: totals.IN_BAD_QTY, s: { ...totalStyleRightNum } },
        { v: totals.IN_TOT, s: { ...totalStyleRightNum } },
        { v: totals.NOT_IN_QTY, s: { ...totalStyleRightNum } },
        { v: totalInRate.toFixed(1), s: totalStyleRight },
        { v: '', s: totalStyle }
      ]);

      // 워크시트 생성
      const ws = XLSX.utils.aoa_to_sheet(excelRows);

      // 컬럼 너비 설정
      ws['!cols'] = [
        { wch: 6 },   // 번호
        { wch: 10 },  // 매입처코드
        { wch: 18 },  // 매입처명
        { wch: 12 },  // 브랜드코드
        { wch: 15 },  // 브랜드명
        { wch: 12 },  // 발주일
        { wch: 18 },  // 매장명
        { wch: 14 },  // 상품코드
        { wch: 22 },  // 상품명
        { wch: 12 },  // 입고요구일
        { wch: 10 },  // 발주수량
        { wch: 12 },  // 발주금액
        { wch: 12 },  // 출고일
        { wch: 10 },  // 출고수량
        { wch: 12 },  // 입고일
        { wch: 10 },  // 입고수량
        { wch: 10 },  // 양호수량
        { wch: 10 },  // 불량수량
        { wch: 12 },  // 입고금액
        { wch: 10 },  // 미입고수량
        { wch: 10 },  // 입고율
        { wch: 10 },  // 입고상태
      ];

      // 제목 행 병합
      ws['!merges'] = [
        { s: { r: 0, c: 0 }, e: { r: 0, c: 21 } },
      ];

      // 행 높이 설정
      ws['!rows'] = [
        { hpt: 28 },
      ];

      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, '발주입고내역');
      XLSX.writeFile(wb, `매입처별_발주입고내역_${startDate}_${endDate}.xlsx`);
    } catch (err) {
      console.error('엑셀 다운로드 오류:', err);
      alert('엑셀 다운로드 중 오류가 발생했습니다.');
    }
  };

  return (
    <div className="olm-container order-out-status-page oiv-page">
      {/* 상단 섹션 */}
      <div className="top-section">
        <h1 className="page-title">
          {currentTab?.menuIcon
            ? React.createElement(getMenuIcon(currentTab.menuIcon), { size: 14 })
            : <i className="fas fa-truck"></i>}
          매입처별 발주/입고내역
        </h1>
        
        {/* 검색 조건 */}
        <form className="search-conditions" onSubmit={handleSubmit}>
          <div className="search-row">
            <div className="search-item">
              <label>발주시작일</label>
              <input 
                type="date" 
                className="olm-form-control"
                value={startDate} 
                onChange={(e) => setStartDate(e.target.value)} 
              />
            </div>
            <div className="search-item">
              <label>발주종료일</label>
              <input 
                type="date" 
                className="olm-form-control"
                value={endDate} 
                onChange={(e) => setEndDate(e.target.value)} 
              />
            </div>
            <div className="search-item">
              <label>입고상태</label>
              <select 
                className="olm-form-control"
                value={inStatus}
                onChange={(e) => setInStatus(e.target.value)}
              >
                <option value="ALL">전체</option>
                <option value="COMPLETE">입고완료</option>
                <option value="PARTIAL">부분입고</option>
                <option value="PENDING">미입고</option>
              </select>
            </div>
            <div className="search-item">
              <label>매입처</label>
              <CommonMultiSelect
                commonCodeType="vendors"
                selectedValues={vendorIds}
                onSelectionChange={setVendorIds}
                placeholder="전체"
                className="olm-multi-select"
              />
            </div>
          </div>
          <div className="search-row">
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
      <div className="oiv-content">
        {/* 에러 */}
        {error && (
          <div className="oiv-error">
            <i className="fas fa-exclamation-circle"></i> {error}
          </div>
        )}

        {/* 데이터 건수 */}
        <div className="oiv-info-bar">
          <span className="oiv-count">조회결과: <strong>{formatNumber(rowData.length)}</strong>건</span>
          {rowData.length > 0 && (
            <span className="oiv-period">| 발주기간: {startDate} ~ {endDate}</span>
          )}
        </div>

        {/* 로우데이터 테이블 */}
        <div className="oiv-table-wrapper">
          <div 
            className="oiv-table-container" 
            ref={tableContainerRef}
            onScroll={handleTableScroll}
          >
            <table className="oiv-table">
            <thead>
              <tr>
                <th>번호</th>
                <th>매입처코드</th>
                <th>매입처명</th>
                <th>브랜드코드</th>
                <th>브랜드명</th>
                <th>발주일</th>
                <th>매장명</th>
                <th>상품코드</th>
                <th>상품명</th>
                <th>입고요구일</th>
                <th>발주수량</th>
                <th>발주금액</th>
                <th>출고일</th>
                <th>출고수량</th>
                <th>입고일</th>
                <th>입고수량</th>
                <th>양호수량</th>
                <th>불량수량</th>
                <th>입고금액</th>
                <th>미입고수량</th>
                <th>입고율</th>
                <th>입고상태</th>
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
                        const subInRate = subtotal.ORDER_QTY > 0 
                          ? Math.round((subtotal.IN_TOT_QTY / subtotal.ORDER_QTY) * 1000) / 10 
                          : 0;
                        rows.push(
                          <tr key={`subtotal-${currentVendorId}`} className="subtotal-row">
                            <td colSpan={10} className="center">【소계】</td>
                            <td className="right">{formatNumber(subtotal.ORDER_QTY)}</td>
                            <td className="right">{formatNumber(subtotal.ORDER_TOT)}</td>
                            <td></td>
                            <td className="right">{formatNumber(subtotal.OUT_QTY)}</td>
                            <td></td>
                            <td className="right">{formatNumber(subtotal.IN_TOT_QTY)}</td>
                            <td className="right">{formatNumber(subtotal.IN_GOOD_QTY)}</td>
                            <td className="right">{formatNumber(subtotal.IN_BAD_QTY)}</td>
                            <td className="right">{formatNumber(subtotal.IN_TOT)}</td>
                            <td className="right">{formatNumber(subtotal.NOT_IN_QTY)}</td>
                            <td className="right highlight">{subInRate.toFixed(1)}%</td>
                            <td></td>
                          </tr>
                        );
                      }

                      currentVendorId = row.VENDOR_ID;
                      rowNum++;

                      rows.push(
                        <tr key={`${row.ORDER_D}-${row.ORDER_SEQU}-${row.ORDER_NO}`}>
                          <td className="center">{rowNum}</td>
                          <td className="center">{row.VENDOR_ID}</td>
                          <td>{row.VENDOR_NM}</td>
                          <td className="center">{row.BRAND_ID}</td>
                          <td>{row.BRAND_NM}</td>
                          <td className="center">{formatDate(row.ORDER_D)}</td>
                          <td>{row.STORE_NM}</td>
                          <td className="center">{row.GOODS_ID_BRAND || row.GOODS_ID}</td>
                          <td>{row.GOODS_NM}</td>
                          <td className="center">{formatDate(row.REQUIRE_D)}</td>
                          <td className="right">{formatNumber(row.ORDER_QTY)}</td>
                          <td className="right">{formatNumber(row.ORDER_TOT)}</td>
                          <td className="center">{formatDate(row.OUT_D)}</td>
                          <td className="right">{formatNumber(row.OUT_QTY)}</td>
                          <td className="center">{formatDate(row.IN_D)}</td>
                          <td className="right">{formatNumber(row.IN_TOT_QTY)}</td>
                          <td className="right">{formatNumber(row.IN_GOOD_QTY)}</td>
                          <td className="right">{formatNumber(row.IN_BAD_QTY)}</td>
                          <td className="right">{formatNumber(row.IN_TOT)}</td>
                          <td className="right">{formatNumber(row.NOT_IN_QTY)}</td>
                          <td className="right highlight">{row.IN_RATE.toFixed(1)}%</td>
                          <td className="center">{row.IN_STATUS_NM}</td>
                        </tr>
                      );

                      // 마지막 행이면 마지막 매입처의 소계 추가
                      if (idx === sortedDataWithSubtotals.sorted.length - 1) {
                        const subtotal = sortedDataWithSubtotals.vendorSubtotals[currentVendorId];
                        const subInRate = subtotal.ORDER_QTY > 0 
                          ? Math.round((subtotal.IN_TOT_QTY / subtotal.ORDER_QTY) * 1000) / 10 
                          : 0;
                        rows.push(
                          <tr key={`subtotal-${currentVendorId}-last`} className="subtotal-row">
                            <td colSpan={10} className="center">【소계】</td>
                            <td className="right">{formatNumber(subtotal.ORDER_QTY)}</td>
                            <td className="right">{formatNumber(subtotal.ORDER_TOT)}</td>
                            <td></td>
                            <td className="right">{formatNumber(subtotal.OUT_QTY)}</td>
                            <td></td>
                            <td className="right">{formatNumber(subtotal.IN_TOT_QTY)}</td>
                            <td className="right">{formatNumber(subtotal.IN_GOOD_QTY)}</td>
                            <td className="right">{formatNumber(subtotal.IN_BAD_QTY)}</td>
                            <td className="right">{formatNumber(subtotal.IN_TOT)}</td>
                            <td className="right">{formatNumber(subtotal.NOT_IN_QTY)}</td>
                            <td className="right highlight">{subInRate.toFixed(1)}%</td>
                            <td></td>
                          </tr>
                        );
                      }
                    });

                    return rows;
                  })()}
                </>
              ) : (
                <tr>
                  <td colSpan={22} className="empty">
                    {isLoading ? '데이터를 조회 중입니다...' : '조회 버튼을 클릭하여 데이터를 조회하세요.'}
                  </td>
                </tr>
              )}
            </tbody>
            {rowData.length > 0 && (
              <tfoot>
                <tr className="total-row">
                  <td colSpan={10} className="center">합계</td>
                  <td className="right">{formatNumber(totals.ORDER_QTY)}</td>
                  <td className="right">{formatNumber(totals.ORDER_TOT)}</td>
                  <td></td>
                  <td className="right">{formatNumber(totals.OUT_QTY)}</td>
                  <td></td>
                  <td className="right">{formatNumber(totals.IN_TOT_QTY)}</td>
                  <td className="right">{formatNumber(totals.IN_GOOD_QTY)}</td>
                  <td className="right">{formatNumber(totals.IN_BAD_QTY)}</td>
                  <td className="right">{formatNumber(totals.IN_TOT)}</td>
                  <td className="right">{formatNumber(totals.NOT_IN_QTY)}</td>
                  <td className="right highlight">{totalInRate.toFixed(1)}%</td>
                  <td></td>
                </tr>
              </tfoot>
            )}
          </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderInByVendor;
