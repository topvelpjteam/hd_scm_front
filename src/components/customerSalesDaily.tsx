import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '../store/store';
import * as XLSX from 'xlsx-js-style';
import Pagination from './Pagination';
import DateRangePicker from './common/DateRangePicker';
import CommonMultiSelect from './CommonMultiSelect';
import {
  CustomerSalesDailyItem,
  CustomerSalesDailyResponse,
  CustomerSalesDailySearchParams,
  searchCustomerSalesDaily,
} from '../services/customerSalesDailyService';
import { getMenuIcon } from '../utils/menuUtils';
import './OrderListManagement.css';
import './orderOutStatus.css';
import './customerSalesDaily.css';
import '../styles/designTokens.css';

// ✅ 검색 폼 상태 타입 정의
type SearchFormState = {
  saleDateFrom: string;
  saleDateTo: string;
  agentIds: string[];
  custNmList: string;
  staffNmList: string;  // 판매직원명 콤마 구분 텍스트로 변경
  brandIds: string[];
  btypeGbnIds: string[];
  mtypeGbnIds: string[];
  stypeGbnIds: string[];
  goodsNmList: string;
  pageNum: number;
  pageSize: number;
};

// ✅ 조회 결과 상태 타입
type CustomerSalesDailyResult = {
  items: CustomerSalesDailyItem[];
  totalCount: number;
  totalPages: number;
  pageNum: number;
  pageSize: number;
  // 전체 합계 정보
  totalQty: number;
  totalTotAmt: number;
  totalDiscountAmt: number;
  totalSaleAmt: number;
  totalMailPoint: number;
};

// ✅ 기본 날짜 생성 헬퍼 (offsetDays 만큼 이동)
const createDefaultDate = (offsetDays: number) => {
  const date = new Date();
  date.setDate(date.getDate() + offsetDays);
  return date.toISOString().slice(0, 10);
};

// ✅ 검색 파라미터 정규화 함수
const normalizeSearchParams = (
  params: SearchFormState,
): CustomerSalesDailySearchParams => {
  const normalized: CustomerSalesDailySearchParams = {
    mode: 'SEARCH',
    saleDateFrom: params.saleDateFrom || undefined,
    saleDateTo: params.saleDateTo || undefined,
    custNmList: params.custNmList.trim() || undefined,
    goodsNmList: params.goodsNmList.trim() || undefined,
    pageNum: params.pageNum,
    pageSize: params.pageSize,
  };

  if (params.agentIds.length > 0) {
    normalized.agentIds = params.agentIds;
  }

  if (params.staffNmList.trim()) {
    normalized.staffNmList = params.staffNmList.trim();
  }

  if (params.brandIds.length > 0) {
    normalized.brandIds = params.brandIds;
  }

  if (params.btypeGbnIds.length > 0) {
    normalized.btypeGbnIds = params.btypeGbnIds;
  }

  if (params.mtypeGbnIds.length > 0) {
    normalized.mtypeGbnIds = params.mtypeGbnIds;
  }

  if (params.stypeGbnIds.length > 0) {
    normalized.stypeGbnIds = params.stypeGbnIds;
  }

  return normalized;
};

const CustomerSalesDaily: React.FC = () => {
  const { user } = useSelector((state: RootState) => state.auth);
  const { tabs, activeTabId } = useSelector((state: RootState) => state.tabs);

  // ✅ 현재 탭 정보 파악 (아이콘 표시용)
  const currentTab = useMemo(
    () => tabs.find((tab) => tab.id === activeTabId),
    [tabs, activeTabId],
  );

  // ✅ 초기 검색 폼 상태 계산
  const computeInitialForm = useCallback((): SearchFormState => {
    const defaultDateFrom = createDefaultDate(-30);
    const defaultDateTo = createDefaultDate(0);

    return {
      saleDateFrom: defaultDateFrom,
      saleDateTo: defaultDateTo,
      agentIds: [],
      custNmList: '',
      staffNmList: '',
      brandIds: [],
      btypeGbnIds: [],
      mtypeGbnIds: [],
      stypeGbnIds: [],
      goodsNmList: '',
      pageNum: 1,
      pageSize: 100,
    };
  }, []);

  const [searchForm, setSearchForm] = useState<SearchFormState>(() =>
    computeInitialForm(),
  );
  const [result, setResult] = useState<CustomerSalesDailyResult>({
    items: [],
    totalCount: 0,
    totalPages: 0,
    pageNum: 1,
    pageSize: 100,
    // 전체 합계 초기값
    totalQty: 0,
    totalTotAmt: 0,
    totalDiscountAmt: 0,
    totalSaleAmt: 0,
    totalMailPoint: 0,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const executeSearchRef = useRef<
    (override?: Partial<SearchFormState>) => Promise<void>
  >();
  const initialLoadRef = useRef(false);

  // ✅ 숫자 포맷 헬퍼
  const formatNumber = useCallback((value: number) => {
    return new Intl.NumberFormat('ko-KR').format(
      Number.isFinite(value) ? value : 0,
    );
  }, []);

  // ✅ 검색 실행 함수
  const executeSearch = useCallback(
    async (override?: Partial<SearchFormState>) => {
      if (!user) {
        setErrorMessage('로그인 정보가 필요합니다.');
        return;
      }

      setIsLoading(true);
      setErrorMessage(null);

      const merged: SearchFormState = {
        ...searchForm,
        ...(override ?? {}),
      };

      const normalized = normalizeSearchParams(merged);
      const payload: CustomerSalesDailySearchParams = {
        ...normalized,
        userRoleId: user.roleId,
        userAgentId: user.agentId ? String(user.agentId) : undefined,
      };

      try {
        const response: CustomerSalesDailyResponse =
          await searchCustomerSalesDaily(payload);

        if (!response.success) {
          setErrorMessage(response.message || '고객판매일보를 불러오지 못했습니다.');
          setResult((prev) => ({
            ...prev,
            items: [],
            totalCount: 0,
            totalPages: 0,
          }));
          return;
        }

        // ✅ 수치 데이터 정규화 (NaN 방지)
        const items: CustomerSalesDailyItem[] = (response.items || []).map((item) => ({
          ...item,
          SALE_QTY: Number(item.SALE_QTY ?? 0),
          UNIT_PRICE: Number(item.UNIT_PRICE ?? 0),
          TOT_AMT: Number(item.TOT_AMT ?? 0),
          DISCOUNT_AMT: Number(item.DISCOUNT_AMT ?? 0),
          SALE_AMT: Number(item.SALE_AMT ?? 0),
          MAIL_POINT: Number(item.MAIL_POINT ?? 0),
        }));

        const pageNum = Number(
          response.pageNum ?? payload.pageNum ?? merged.pageNum ?? 1,
        );
        const pageSize = Number(
          response.pageSize ?? payload.pageSize ?? merged.pageSize ?? 20,
        );

        setResult({
          items,
          totalCount: Number(response.totalCount ?? 0),
          totalPages: Number(response.totalPages ?? 0),
          pageNum,
          pageSize,
          // 전체 합계 정보 (서버에서 전달)
          totalQty: Number(response.totalQty ?? 0),
          totalTotAmt: Number(response.totalTotAmt ?? 0),
          totalDiscountAmt: Number(response.totalDiscountAmt ?? 0),
          totalSaleAmt: Number(response.totalSaleAmt ?? 0),
          totalMailPoint: Number(response.totalMailPoint ?? 0),
        });
      } catch (error: unknown) {
        console.error('고객판매일보 조회 실패:', error);
        const errorObj = error as { message?: string };
        setErrorMessage(
          errorObj?.message || '고객판매일보를 조회하는 중 문제가 발생했습니다.',
        );
      } finally {
        setIsLoading(false);
      }
    },
    [searchForm, user],
  );

  // ✅ 실행 함수 ref 최신화
  useEffect(() => {
    executeSearchRef.current = executeSearch;
  }, [executeSearch]);

  // ✅ 컴포넌트 마운트 시 상태 초기화
  useEffect(() => {
    const reset = computeInitialForm();
    setSearchForm(reset);
    initialLoadRef.current = false;
  }, [computeInitialForm]);

  // ✅ 입력 변경 처리기
  const handleInputChange = (
    field: keyof SearchFormState,
    value: string | number | string[] | boolean,
  ) => {
    setSearchForm((prev) => ({
      ...prev,
      [field]: value,
      pageNum: field === 'pageSize' ? 1 : prev.pageNum,
    }));
  };

  // ✅ 폼 제출 처리기
  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    setSearchForm((prev) => ({
      ...prev,
      pageNum: 1,
    }));

    await executeSearch({ pageNum: 1 });
  };

  // ✅ 페이지 이동 처리기
  const handlePageChange = async (page: number, pageSize: number) => {
    setSearchForm((prev) => ({
      ...prev,
      pageNum: page,
      pageSize,
    }));

    await executeSearch({ pageNum: page, pageSize });
  };

  // ✅ 최초 진입 시 자동 조회 (권한 확인 후)
  useEffect(() => {
    if (!user) {
      initialLoadRef.current = false;
      return;
    }

    if (initialLoadRef.current) {
      return;
    }

    initialLoadRef.current = true;
    executeSearchRef.current?.();
  }, [user]);

  // ✅ 요약 정보 계산
  const summary = useMemo(() => {
    if (!result.items.length) {
      return {
        totalQty: 0,
        totalTotAmt: 0,
        totalDiscountAmt: 0,
        totalSaleAmt: 0,
        totalMailPoint: 0,
      };
    }

    const totals = result.items.reduce(
      (acc, item) => {
        acc.totalQty += Number(item.SALE_QTY ?? 0);
        acc.totalTotAmt += Number(item.TOT_AMT ?? 0);
        acc.totalDiscountAmt += Number(item.DISCOUNT_AMT ?? 0);
        acc.totalSaleAmt += Number(item.SALE_AMT ?? 0);
        acc.totalMailPoint += Number(item.MAIL_POINT ?? 0);
        return acc;
      },
      { totalQty: 0, totalTotAmt: 0, totalDiscountAmt: 0, totalSaleAmt: 0, totalMailPoint: 0 },
    );

    return totals;
  }, [result.items]);

  // ✅ 검색 조건 초기화
  const handleReset = useCallback(() => {
    const resetState = computeInitialForm();
    setSearchForm(resetState);
    initialLoadRef.current = true;

    executeSearchRef.current?.({
      ...resetState,
    });
  }, [computeInitialForm]);

  const {
    totalQty,
    totalTotAmt,
    totalDiscountAmt,
    totalSaleAmt,
    totalMailPoint,
  } = summary;

  // ✅ 엑셀 내보내기 처리 (전체 데이터 다운로드)
  const handleExportExcel = useCallback(async () => {
    if (result.totalCount === 0) {
      alert('내보낼 데이터가 없습니다.');
      return;
    }

    if (!user) {
      alert('로그인 정보가 필요합니다.');
      return;
    }

    try {
      // 전체 데이터 조회를 위한 파라미터 (페이지 크기를 매우 크게 설정)
      const normalized = normalizeSearchParams(searchForm);
      const exportParams: CustomerSalesDailySearchParams = {
        ...normalized,
        pageNum: 1,
        pageSize: 100000, // 전체 데이터 조회
        userRoleId: user.roleId,
        userAgentId: user.agentId ? String(user.agentId) : undefined,
      };

      // 전체 데이터 조회
      const exportResponse = await searchCustomerSalesDaily(exportParams);

      if (!exportResponse.success || !exportResponse.items.length) {
        alert('내보낼 데이터가 없습니다.');
        return;
      }

      const exportItems = exportResponse.items.map((item) => ({
        ...item,
        SALE_QTY: Number(item.SALE_QTY ?? 0),
        UNIT_PRICE: Number(item.UNIT_PRICE ?? 0),
        TOT_AMT: Number(item.TOT_AMT ?? 0),
        DISCOUNT_AMT: Number(item.DISCOUNT_AMT ?? 0),
        SALE_AMT: Number(item.SALE_AMT ?? 0),
        MAIL_POINT: Number(item.MAIL_POINT ?? 0),
      }));

      // 합계 계산
      const exportTotals = exportItems.reduce(
        (acc, item) => {
          acc.totalQty += Number(item.SALE_QTY ?? 0);
          acc.totalTotAmt += Number(item.TOT_AMT ?? 0);
          acc.totalDiscountAmt += Number(item.DISCOUNT_AMT ?? 0);
          acc.totalSaleAmt += Number(item.SALE_AMT ?? 0);
          acc.totalMailPoint += Number(item.MAIL_POINT ?? 0);
          return acc;
        },
        { totalQty: 0, totalTotAmt: 0, totalDiscountAmt: 0, totalSaleAmt: 0, totalMailPoint: 0 },
      );

      const workbook = XLSX.utils.book_new();

      // 공통 스타일 정의 (xlsx-js-style은 CellStyle을 내보내지 않으므로 any 사용)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const titleStyle: any = {
        font: { name: '맑은 고딕', bold: true, sz: 16, color: { rgb: 'FFFFFF' } },
        alignment: { horizontal: 'center', vertical: 'center' },
        fill: { fgColor: { rgb: '4A90E2' } },
      };
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const tableHeaderStyle: any = {
        font: { name: '맑은 고딕', bold: true, color: { rgb: 'FFFFFF' } },
        alignment: { horizontal: 'center', vertical: 'center' },
        fill: { fgColor: { rgb: '6B9BD2' } },
        border: {
          top: { style: 'thin', color: { rgb: 'BBBBBB' } },
          bottom: { style: 'thin', color: { rgb: 'BBBBBB' } },
          left: { style: 'thin', color: { rgb: 'BBBBBB' } },
          right: { style: 'thin', color: { rgb: 'BBBBBB' } },
        },
      };
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const tableCellStyle: any = {
        font: { name: '맑은 고딕' },
        alignment: { horizontal: 'center', vertical: 'center' },
        border: {
          top: { style: 'thin', color: { rgb: 'EEEEEE' } },
          bottom: { style: 'thin', color: { rgb: 'EEEEEE' } },
          left: { style: 'thin', color: { rgb: 'EEEEEE' } },
          right: { style: 'thin', color: { rgb: 'EEEEEE' } },
        },
      };
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const tableLeftStyle: any = {
        ...tableCellStyle,
        alignment: { horizontal: 'left', vertical: 'center' },
      };
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const tableRightStyle: any = {
        ...tableCellStyle,
        alignment: { horizontal: 'right', vertical: 'center' },
      };
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const totalStyle: any = {
        font: { name: '맑은 고딕', bold: true },
        fill: { fgColor: { rgb: 'CCFFCC' } },
        alignment: { horizontal: 'center', vertical: 'center' },
        border: {
          top: { style: 'medium', color: { rgb: '000000' } },
          bottom: { style: 'medium', color: { rgb: '000000' } },
          left: { style: 'thin', color: { rgb: '000000' } },
          right: { style: 'thin', color: { rgb: '000000' } },
        },
      };
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const totalRightStyle: any = {
        ...totalStyle,
        alignment: { horizontal: 'right', vertical: 'center' },
      };
      const numberFmt = '#,##0';

      // 데이터 배열 구성
      const rows: (string | number)[][] = [];
      
      // 타이틀
      rows.push(['고객판매일보']);
      rows.push(['']);
      
      // 조회 조건 정보
      rows.push(['조회기간', `${searchForm.saleDateFrom} ~ ${searchForm.saleDateTo}`]);
      rows.push(['생성일시', new Date().toLocaleString('ko-KR')]);
      rows.push(['총 건수', `${formatNumber(exportResponse.totalCount)}건`]);
      rows.push(['']);

      // 테이블 헤더
      const headers = [
        'NO.',
        '브랜드명',
        '고객구분',
        '고객코드',
        '고객명',
        '소속매장',
        '판매일자',
        '판매매장',
        '판매사원',
        '상품코드',
        '상품명',
        '유통기한',
        '수량',
        '단가',
        '판매금액',
        '할인금액',
        '매출금액',
        '마일리지',
        'SMS수신',
        '핸드폰',
      ];
      rows.push(headers);

      // 데이터 행 (전체 데이터)
      exportItems.forEach((item, idx) => {
        rows.push([
          idx + 1,
          item.BRAND_NM || '',
          item.CUST_GBN_NM || '',
          item.CUST_ID || '',
          item.CUST_NM || '',
          item.CUST_AGENT_NM || '',
          item.SALE_D || '',
          item.SALE_AGENT_NM || '',
          item.STAFF_NM || '',
          item.GOODS_CD || '',
          item.GOODS_NM || '',
          item.EXP_D || '',
          Number(item.SALE_QTY ?? 0),
          Number(item.UNIT_PRICE ?? 0),
          Number(item.TOT_AMT ?? 0),
          Number(item.DISCOUNT_AMT ?? 0),
          Number(item.SALE_AMT ?? 0),
          Number(item.MAIL_POINT ?? 0),
          item.SMS_CHK === 'Y' ? '수신' : item.SMS_CHK === 'N' ? '거부' : '',
          item.C_HP || '',
        ]);
      });

      // 합계 행 (전체 데이터 기준)
      rows.push([
        '합계',
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
        exportTotals.totalQty,
        '',
        exportTotals.totalTotAmt,
        exportTotals.totalDiscountAmt,
        exportTotals.totalSaleAmt,
        exportTotals.totalMailPoint,
        '',
        '',
      ]);

      // 시트 생성
      const worksheet = XLSX.utils.aoa_to_sheet(rows);

      // 컬럼 너비 설정
      worksheet['!cols'] = [
        { width: 6 },   // NO.
        { width: 12 },  // 브랜드명
        { width: 10 },  // 고객구분
        { width: 10 },  // 고객코드
        { width: 14 },  // 고객명
        { width: 14 },  // 소속매장
        { width: 12 },  // 판매일자
        { width: 14 },  // 판매매장
        { width: 10 },  // 판매사원
        { width: 14 },  // 상품코드
        { width: 24 },  // 상품명
        { width: 12 },  // 유통기한
        { width: 10 },  // 수량
        { width: 12 },  // 단가
        { width: 14 },  // 판매금액
        { width: 12 },  // 할인금액
        { width: 14 },  // 매출금액
        { width: 10 },  // 마일리지
        { width: 8 },   // SMS수신
        { width: 14 },  // 핸드폰
      ];

      // 타이틀 병합 및 스타일
      worksheet['!merges'] = [{ s: { r: 0, c: 0 }, e: { r: 0, c: 19 } }];
      if (worksheet['A1']) worksheet['A1'].s = titleStyle;

      // 조회 조건 스타일 (Row 3~5)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const labelStyle: any = {
        font: { name: '맑은 고딕', bold: true },
        fill: { fgColor: { rgb: 'F2F4F7' } },
        alignment: { horizontal: 'left', vertical: 'center' },
      };
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const valueStyle: any = {
        font: { name: '맑은 고딕' },
        alignment: { horizontal: 'left', vertical: 'center' },
      };
      for (let r = 3; r <= 5; r++) {
        const labelAddr = XLSX.utils.encode_cell({ r: r - 1, c: 0 });
        const valueAddr = XLSX.utils.encode_cell({ r: r - 1, c: 1 });
        if (worksheet[labelAddr]) worksheet[labelAddr].s = labelStyle;
        if (worksheet[valueAddr]) worksheet[valueAddr].s = valueStyle;
      }

      // 테이블 헤더 스타일 (Row 7)
      const headerRow = 7;
      for (let c = 0; c < headers.length; c++) {
        const addr = XLSX.utils.encode_cell({ r: headerRow - 1, c });
        if (worksheet[addr]) worksheet[addr].s = tableHeaderStyle;
      }

      // 데이터 행 스타일 (Row 8부터)
      const lastRowIdx = rows.length;
      const numericCols = [0, 12, 13, 14, 15, 16, 17]; // NO., 수량, 단가, 판매금액, 할인금액, 매출금액, 마일리지
      const leftAlignCols = [4, 10]; // 고객명, 상품명

      for (let r = 8; r <= lastRowIdx; r++) {
        const isLastRow = r === lastRowIdx;
        for (let c = 0; c < headers.length; c++) {
          const addr = XLSX.utils.encode_cell({ r: r - 1, c });
          if (!worksheet[addr]) continue;

          if (isLastRow) {
            // 합계 행 스타일
            if (numericCols.includes(c) && c !== 0) {
              worksheet[addr].s = { ...totalRightStyle };
              if ([12, 14, 15, 16, 17].includes(c)) {
                worksheet[addr].z = numberFmt;
              }
            } else {
              worksheet[addr].s = totalStyle;
            }
          } else {
            // 일반 데이터 행 스타일
            if (leftAlignCols.includes(c)) {
              worksheet[addr].s = tableLeftStyle;
            } else if (numericCols.includes(c)) {
              worksheet[addr].s = tableRightStyle;
              if ([12, 13, 14, 15, 16, 17].includes(c)) {
                worksheet[addr].z = numberFmt;
              }
            } else {
              worksheet[addr].s = tableCellStyle;
            }
          }
        }
      }

      // 워크북에 시트 추가
      XLSX.utils.book_append_sheet(workbook, worksheet, '고객판매일보');

      // 파일명 생성 (조회기간 포함)
      const dateRange = `${searchForm.saleDateFrom.replace(/-/g, '')}_${searchForm.saleDateTo.replace(/-/g, '')}`;
      const fileName = `고객판매일보_${dateRange}.xlsx`;

      // 파일 다운로드
      XLSX.writeFile(workbook, fileName);

    } catch (error) {
      console.error('엑셀 다운로드 실패:', error);
      alert('엑셀 다운로드 중 오류가 발생했습니다.');
    }
  }, [result.totalCount, searchForm, user, formatNumber]);

  return (
    <div className="olm-container order-out-status-page customer-sales-daily-page">
      <div className="top-section">
        <h1 className="page-title">
          {currentTab?.menuIcon
            ? React.createElement(getMenuIcon(currentTab.menuIcon), { size: 14 })
            : <i className="fas fa-chart-line"></i>}
          고객판매일보
        </h1>

        <form className="search-conditions" onSubmit={handleSubmit}>
          <div className="search-row">
            <div className="search-item">
              <label htmlFor="saleDateRange">판매일자</label>
              <DateRangePicker
                startDate={searchForm.saleDateFrom}
                endDate={searchForm.saleDateTo}
                onStartDateChange={(value) =>
                  handleInputChange('saleDateFrom', value)
                }
                onEndDateChange={(value) =>
                  handleInputChange('saleDateTo', value)
                }
                placeholder="판매일자를 선택하세요"
                className="olm-date-range-picker"
              />
            </div>

            <div className="search-item">
              <label htmlFor="storeSelector">매장</label>
              <CommonMultiSelect
                commonCodeType="stores"
                selectedValues={searchForm.agentIds}
                onSelectionChange={(values) =>
                  handleInputChange('agentIds', values)
                }
                placeholder="매장을 선택하세요"
                className="olm-multi-select"
              />
            </div>

            <div className="search-item">
              <label htmlFor="custNmList">고객명</label>
              <div className="field-control">
                <input
                  id="custNmList"
                  type="text"
                  className="olm-form-control"
                  value={searchForm.custNmList}
                  onChange={(event) =>
                    handleInputChange('custNmList', event.target.value)
                  }
                  placeholder="고객명 (콤마로 구분)"
                />
              </div>
            </div>

            <div className="search-item">
              <label htmlFor="staffNmList">판매직원</label>
              <div className="field-control">
                <input
                  id="staffNmList"
                  type="text"
                  className="olm-form-control"
                  value={searchForm.staffNmList}
                  onChange={(event) =>
                    handleInputChange('staffNmList', event.target.value)
                  }
                  placeholder="판매직원명 (콤마로 구분)"
                />
              </div>
            </div>
          </div>

          <div className="search-row">
            <div className="search-item">
              <label htmlFor="brandSelector">브랜드</label>
              <CommonMultiSelect
                commonCodeType="brands"
                selectedValues={searchForm.brandIds}
                onSelectionChange={(values) =>
                  handleInputChange('brandIds', values)
                }
                placeholder="브랜드를 선택하세요"
                className="olm-multi-select"
              />
            </div>

            <div className="search-item">
              <label htmlFor="btypeSelector">대분류</label>
              <CommonMultiSelect
                commonCodeType="btypes"
                selectedValues={searchForm.btypeGbnIds}
                onSelectionChange={(values) =>
                  handleInputChange('btypeGbnIds', values)
                }
                placeholder="대분류를 선택하세요"
                className="olm-multi-select"
              />
            </div>

            <div className="search-item">
              <label htmlFor="mtypeSelector">중분류</label>
              <CommonMultiSelect
                commonCodeType="mtypes"
                selectedValues={searchForm.mtypeGbnIds}
                onSelectionChange={(values) =>
                  handleInputChange('mtypeGbnIds', values)
                }
                placeholder="중분류를 선택하세요"
                className="olm-multi-select"
              />
            </div>

            <div className="search-item">
              <label htmlFor="stypeSelector">소분류</label>
              <CommonMultiSelect
                commonCodeType="stypes"
                selectedValues={searchForm.stypeGbnIds}
                onSelectionChange={(values) =>
                  handleInputChange('stypeGbnIds', values)
                }
                placeholder="소분류를 선택하세요"
                className="olm-multi-select"
              />
            </div>
          </div>

          <div className="search-row">
            <div className="search-item search-item-wide">
              <label htmlFor="goodsNmList">상품명</label>
              <div className="field-control">
                <input
                  id="goodsNmList"
                  type="text"
                  className="olm-form-control"
                  value={searchForm.goodsNmList}
                  onChange={(event) =>
                    handleInputChange('goodsNmList', event.target.value)
                  }
                  placeholder="상품명 (콤마로 구분하여 여러개 검색 가능)"
                />
              </div>
            </div>
          </div>

          <div className="action-buttons">
            <div className="right-buttons">
              <button
                type="button"
                className="olm-btn olm-btn-secondary"
                onClick={handleReset}
              >
                <i className="fas fa-undo"></i>
                초기화
              </button>
              <button
                type="button"
                className="olm-btn olm-btn-success"
                onClick={handleExportExcel}
                disabled={isLoading || result.items.length === 0}
              >
                <i className="fas fa-file-excel"></i>
                엑셀 다운로드
              </button>
              <button
                type="submit"
                className="olm-btn olm-btn-primary"
                disabled={isLoading}
              >
                <i className="fas fa-search"></i>
                {isLoading ? '조회 중...' : '조회'}
              </button>
            </div>
          </div>
        </form>
      </div>

      <div className="olm-main-section">
        <h3>
          <i className="fas fa-chart-line"></i>
          고객판매일보 ({formatNumber(result.totalCount)}건)
        </h3>

        {/* 합계 정보 - 판매사원aus-ipt 스타일 */}
        <div className="olm-grid-summary">
          <div className="summary-group count-group">
            <span className="summary-label">전체건수:</span>
            <span className="summary-value">{formatNumber(result.totalCount)}건</span>
          </div>
          <div className="summary-group qty-group">
            <span className="summary-label">수량합계:</span>
            <span className="summary-value">{formatNumber(result.totalQty)}개</span>
          </div>
          <div className="summary-group tot-group">
            <span className="summary-label">판매금액:</span>
            <span className="summary-value">{formatNumber(result.totalTotAmt)}원</span>
          </div>
          <div className="summary-group discount-group">
            <span className="summary-label">할인금액:</span>
            <span className="summary-value">{formatNumber(result.totalDiscountAmt)}원</span>
          </div>
          <div className="summary-group sale-group">
            <span className="summary-label">매출금액:</span>
            <span className="summary-value">{formatNumber(result.totalSaleAmt)}원</span>
          </div>
          <div className="summary-group point-group">
            <span className="summary-label">마일리지:</span>
            <span className="summary-value">{formatNumber(result.totalMailPoint)}P</span>
          </div>
        </div>

        {errorMessage && (
          <div className="olm-error-banner" role="alert">
            <i className="fas fa-exclamation-triangle"></i>
            <span>{errorMessage}</span>
          </div>
        )}

        <div className="order-table-container order-out-status-table-container">
          {isLoading ? (
            <div className="no-data-message">
              <i className="fas fa-spinner fa-spin"></i>
              <p>데이터를 불러오는 중입니다...</p>
            </div>
          ) : result.items.length === 0 ? (
            <div className="no-data-message">
              <i className="fas fa-inbox"></i>
              <p>조건에 해당하는 판매 데이터가 없습니다.</p>
            </div>
          ) : (
            <div className="order-out-status-table-wrapper customer-sales-daily-table-wrapper">
              <table className="order-out-status-table customer-sales-daily-table">
                <thead>
                  <tr>
                    <th scope="col">브랜드명</th>
                    <th scope="col">고객구분</th>
                    <th scope="col">고객코드</th>
                    <th scope="col">고객명</th>
                    <th scope="col">소속매장</th>
                    <th scope="col">판매일자</th>
                    <th scope="col">판매매장</th>
                    <th scope="col">판매사원</th>
                    <th scope="col">상품코드</th>
                    <th scope="col">상품명</th>
                    <th scope="col">유통기한</th>
                    <th scope="col">수량</th>
                    <th scope="col">단가</th>
                    <th scope="col">판매금액</th>
                    <th scope="col">할인금액</th>
                    <th scope="col">매출금액</th>
                    <th scope="col">마일리지</th>
                    <th scope="col">SMS수신</th>
                    <th scope="col">핸드폰</th>
                  </tr>
                </thead>
                <tbody>
                  {result.items.map((row, idx) => (
                    <tr key={`${row.TR_NO}-${row.SALE_SEQU}-${idx}`}>
                      <td>{row.BRAND_NM || '-'}</td>
                      <td>{row.CUST_GBN_NM || '-'}</td>
                      <td>{row.CUST_ID || '-'}</td>
                      <td>{row.CUST_NM || '-'}</td>
                      <td>{row.CUST_AGENT_NM || '-'}</td>
                      <td>{row.SALE_D || '-'}</td>
                      <td>{row.SALE_AGENT_NM || '-'}</td>
                      <td>{row.STAFF_NM || '-'}</td>
                      <td>{row.GOODS_CD || '-'}</td>
                      <td>{row.GOODS_NM || '-'}</td>
                      <td>{row.EXP_D || '-'}</td>
                      <td className="numeric-cell">{formatNumber(Number(row.SALE_QTY ?? 0))}</td>
                      <td className="numeric-cell">{formatNumber(Number(row.UNIT_PRICE ?? 0))}</td>
                      <td className="numeric-cell">{formatNumber(Number(row.TOT_AMT ?? 0))}</td>
                      <td className="numeric-cell">{formatNumber(Number(row.DISCOUNT_AMT ?? 0))}</td>
                      <td className="numeric-cell">{formatNumber(Number(row.SALE_AMT ?? 0))}</td>
                      <td className="numeric-cell">{formatNumber(Number(row.MAIL_POINT ?? 0))}</td>
                      <td>{row.SMS_CHK === 'Y' ? '수신' : row.SMS_CHK === 'N' ? '거부' : '-'}</td>
                      <td>{row.C_HP || '-'}</td>
                    </tr>
                  ))}
                  <tr className="summary-row">
                    <td colSpan={11} style={{ textAlign: 'right', fontWeight: 'bold' }}>합계:</td>
                    <td className="numeric-cell" style={{ fontWeight: 'bold' }}>{formatNumber(totalQty)}</td>
                    <td className="numeric-cell" style={{ fontWeight: 'bold' }}>-</td>
                    <td className="numeric-cell" style={{ fontWeight: 'bold' }}>{formatNumber(totalTotAmt)}</td>
                    <td className="numeric-cell" style={{ fontWeight: 'bold' }}>{formatNumber(totalDiscountAmt)}</td>
                    <td className="numeric-cell" style={{ fontWeight: 'bold' }}>{formatNumber(totalSaleAmt)}</td>
                    <td className="numeric-cell" style={{ fontWeight: 'bold' }}>{formatNumber(totalMailPoint)}</td>
                    <td colSpan={2}></td>
                  </tr>
                </tbody>
              </table>
            </div>
          )}
        </div>

        <Pagination
          totalCount={result.totalCount}
          currentPage={result.pageNum}
          pageSize={result.pageSize}
          onPageChange={handlePageChange}
          pageSizeOptions={[10, 20, 50, 100]}
          showPageSizeSelector
          showPageInfo
          className="olm-pagination"
        />
      </div>
    </div>
  );
};

export default CustomerSalesDaily;
