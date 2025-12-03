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
  SalesPersonausiptItem,
  SalesPersonausiptResponse,
  SalesPersonausiptSearchParams,
  searchSalesPersonausipt,
} from '../services/salesPersonausiptService';
import { getMenuIcon } from '../utils/menuUtils';
import './OrderListManagement.css';
import './orderOutStatus.css';
import './salesPersonausipt.css';
import '../styles/designTokens.css';

// ✅ 검색 폼 상태 타입 정의 (브랜드 제거됨)
type SearchFormState = {
  saleDateFrom: string;
  saleDateTo: string;
  agentIds: string[];
  custNmList: string;
  staffNmList: string;           // 판매직원명 콤마 구분 텍스트
  btypeGbnIds: string[];
  mtypeGbnIds: string[];
  stypeGbnIds: string[];
  goodsNmList: string;
  pageNum: number;
  pageSize: number;
};

// ✅ 조회 결과 상태 타입 (가입후미구매 합계 추가)
type SalesPersonausiptResult = {
  items: SalesPersonausiptItem[];
  totalCount: number;
  totalPages: number;
  pageNum: number;
  pageSize: number;
  // 전체 합계 정보
  sumNopurCnt: number;
  sumNewCustCnt: number;
  sumNewSaleAmt: number;
  sumNewSaleQty: number;
  sumRevCustCnt: number;
  sumRevSaleAmt: number;
  sumRevSaleQty: number;
  sumFreeCustCnt: number;
  sumFreeSaleAmt: number;
  sumFreeSaleQty: number;
  sumTotalCustCnt: number;
  sumTotalSaleAmt: number;
  sumTotalSaleQty: number;
};

// ✅ 기본 날짜 생성 헬퍼 (offsetDays 만큼 이동)
const createDefaultDate = (offsetDays: number) => {
  const date = new Date();
  date.setDate(date.getDate() + offsetDays);
  return date.toISOString().slice(0, 10);
};

// ✅ 검색 파라미터 정규화 함수 (브랜드 제거됨)
const normalizeSearchParams = (
  params: SearchFormState,
): SalesPersonausiptSearchParams => {
  const normalized: SalesPersonausiptSearchParams = {
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

const SalesPersonausipt: React.FC = () => {
  const { user } = useSelector((state: RootState) => state.auth);
  const { tabs, activeTabId } = useSelector((state: RootState) => state.tabs);

  // ✅ 현재 탭 정보 파악 (아이콘 표시용)
  const currentTab = useMemo(
    () => tabs.find((tab) => tab.id === activeTabId),
    [tabs, activeTabId],
  );

  // ✅ 초기 검색 폼 상태 계산 (브랜드 제거됨)
  const computeInitialForm = useCallback((): SearchFormState => {
    const defaultDateFrom = createDefaultDate(-30);
    const defaultDateTo = createDefaultDate(0);

    return {
      saleDateFrom: defaultDateFrom,
      saleDateTo: defaultDateTo,
      agentIds: [],
      custNmList: '',
      staffNmList: '',
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
  const [result, setResult] = useState<SalesPersonausiptResult>({
    items: [],
    totalCount: 0,
    totalPages: 0,
    pageNum: 1,
    pageSize: 100,
    // 전체 합계 초기값
    sumNopurCnt: 0,
    sumNewCustCnt: 0,
    sumNewSaleAmt: 0,
    sumNewSaleQty: 0,
    sumRevCustCnt: 0,
    sumRevSaleAmt: 0,
    sumRevSaleQty: 0,
    sumFreeCustCnt: 0,
    sumFreeSaleAmt: 0,
    sumFreeSaleQty: 0,
    sumTotalCustCnt: 0,
    sumTotalSaleAmt: 0,
    sumTotalSaleQty: 0,
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

  // ✅ 소수점 포맷 헬퍼
  const formatDecimal = useCallback((value: number, decimals: number = 1) => {
    return Number.isFinite(value) ? value.toFixed(decimals) : '0.0';
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
      const payload: SalesPersonausiptSearchParams = {
        ...normalized,
        userRoleId: user.roleId,
        userAgentId: user.agentId ? String(user.agentId) : undefined,
      };

      try {
        const response: SalesPersonausiptResponse =
          await searchSalesPersonausipt(payload);

        if (!response.success) {
          setErrorMessage(response.message || '판매사원 AUS-IPT를 불러오지 못했습니다.');
          setResult((prev) => ({
            ...prev,
            items: [],
            totalCount: 0,
            totalPages: 0,
          }));
          return;
        }

        // ✅ 수치 데이터 정규화 (NaN 방지)
        const items: SalesPersonausiptItem[] = (response.items || []).map((item) => ({
          ...item,
          NOPUR_CNT: Number(item.NOPUR_CNT ?? 0),
          NEW_CUST_CNT: Number(item.NEW_CUST_CNT ?? 0),
          NEW_RATIO: Number(item.NEW_RATIO ?? 0),
          NEW_SALE_AMT: Number(item.NEW_SALE_AMT ?? 0),
          NEW_SALE_QTY: Number(item.NEW_SALE_QTY ?? 0),
          NEW_AUS: Number(item.NEW_AUS ?? 0),
          NEW_IPT: Number(item.NEW_IPT ?? 0),
          REV_CUST_CNT: Number(item.REV_CUST_CNT ?? 0),
          REV_RATIO: Number(item.REV_RATIO ?? 0),
          REV_SALE_AMT: Number(item.REV_SALE_AMT ?? 0),
          REV_SALE_QTY: Number(item.REV_SALE_QTY ?? 0),
          REV_AUS: Number(item.REV_AUS ?? 0),
          REV_IPT: Number(item.REV_IPT ?? 0),
          FREE_CUST_CNT: Number(item.FREE_CUST_CNT ?? 0),
          FREE_RATIO: Number(item.FREE_RATIO ?? 0),
          FREE_SALE_AMT: Number(item.FREE_SALE_AMT ?? 0),
          FREE_SALE_QTY: Number(item.FREE_SALE_QTY ?? 0),
          FREE_AUS: Number(item.FREE_AUS ?? 0),
          FREE_IPT: Number(item.FREE_IPT ?? 0),
          TOTAL_CUST_CNT: Number(item.TOTAL_CUST_CNT ?? 0),
          TOTAL_RATIO: Number(item.TOTAL_RATIO ?? 0),
          TOTAL_SALE_AMT: Number(item.TOTAL_SALE_AMT ?? 0),
          TOTAL_SALE_QTY: Number(item.TOTAL_SALE_QTY ?? 0),
          TOTAL_AUS: Number(item.TOTAL_AUS ?? 0),
          TOTAL_IPT: Number(item.TOTAL_IPT ?? 0),
        }));

        const pageNum = Number(
          response.pageNum ?? payload.pageNum ?? merged.pageNum ?? 1,
        );
        const pageSize = Number(
          response.pageSize ?? payload.pageSize ?? merged.pageSize ?? 100,
        );

        setResult({
          items,
          totalCount: Number(response.totalCount ?? 0),
          totalPages: Number(response.totalPages ?? 0),
          pageNum,
          pageSize,
          // 전체 합계 정보 (서버에서 전달)
          sumNopurCnt: Number(response.sumNopurCnt ?? 0),
          sumNewCustCnt: Number(response.sumNewCustCnt ?? 0),
          sumNewSaleAmt: Number(response.sumNewSaleAmt ?? 0),
          sumNewSaleQty: Number(response.sumNewSaleQty ?? 0),
          sumRevCustCnt: Number(response.sumRevCustCnt ?? 0),
          sumRevSaleAmt: Number(response.sumRevSaleAmt ?? 0),
          sumRevSaleQty: Number(response.sumRevSaleQty ?? 0),
          sumFreeCustCnt: Number(response.sumFreeCustCnt ?? 0),
          sumFreeSaleAmt: Number(response.sumFreeSaleAmt ?? 0),
          sumFreeSaleQty: Number(response.sumFreeSaleQty ?? 0),
          sumTotalCustCnt: Number(response.sumTotalCustCnt ?? 0),
          sumTotalSaleAmt: Number(response.sumTotalSaleAmt ?? 0),
          sumTotalSaleQty: Number(response.sumTotalSaleQty ?? 0),
        });
      } catch (error: unknown) {
        console.error('판매사원 AUS-IPT 조회 실패:', error);
        const errorObj = error as { message?: string };
        setErrorMessage(
          errorObj?.message || '판매사원 AUS-IPT를 조회하는 중 문제가 발생했습니다.',
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

  // ✅ 검색 조건 초기화
  const handleReset = useCallback(() => {
    const resetState = computeInitialForm();
    setSearchForm(resetState);
    initialLoadRef.current = true;

    executeSearchRef.current?.({
      ...resetState,
    });
  }, [computeInitialForm]);

  // ✅ 행 클래스 결정
  const getRowClass = useCallback((rowType: string) => {
    switch (rowType) {
      case 'STORE_SUBTOTAL':
        return 'row-store-subtotal';
      case 'TOTAL':
        return 'row-total';
      default:
        return 'row-detail';
    }
  }, []);

  // ✅ 엑셀 내보내기 처리 (전체 데이터 다운로드) - 브랜드 제거됨
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
      // 전체 데이터 조회를 위한 파라미터
      const normalized = normalizeSearchParams(searchForm);
      const exportParams: SalesPersonausiptSearchParams = {
        ...normalized,
        pageNum: 1,
        pageSize: 100000,
        userRoleId: user.roleId,
        userAgentId: user.agentId ? String(user.agentId) : undefined,
      };

      // 전체 데이터 조회
      const exportResponse = await searchSalesPersonausipt(exportParams);

      if (!exportResponse.success || !exportResponse.items.length) {
        alert('내보낼 데이터가 없습니다.');
        return;
      }

      const exportItems = exportResponse.items.map((item) => ({
        ...item,
        NOPUR_CNT: Number(item.NOPUR_CNT ?? 0),
        NEW_CUST_CNT: Number(item.NEW_CUST_CNT ?? 0),
        NEW_RATIO: Number(item.NEW_RATIO ?? 0),
        NEW_SALE_AMT: Number(item.NEW_SALE_AMT ?? 0),
        NEW_SALE_QTY: Number(item.NEW_SALE_QTY ?? 0),
        NEW_AUS: Number(item.NEW_AUS ?? 0),
        NEW_IPT: Number(item.NEW_IPT ?? 0),
        REV_CUST_CNT: Number(item.REV_CUST_CNT ?? 0),
        REV_RATIO: Number(item.REV_RATIO ?? 0),
        REV_SALE_AMT: Number(item.REV_SALE_AMT ?? 0),
        REV_SALE_QTY: Number(item.REV_SALE_QTY ?? 0),
        REV_AUS: Number(item.REV_AUS ?? 0),
        REV_IPT: Number(item.REV_IPT ?? 0),
        FREE_CUST_CNT: Number(item.FREE_CUST_CNT ?? 0),
        FREE_RATIO: Number(item.FREE_RATIO ?? 0),
        FREE_SALE_AMT: Number(item.FREE_SALE_AMT ?? 0),
        FREE_SALE_QTY: Number(item.FREE_SALE_QTY ?? 0),
        FREE_AUS: Number(item.FREE_AUS ?? 0),
        FREE_IPT: Number(item.FREE_IPT ?? 0),
        TOTAL_CUST_CNT: Number(item.TOTAL_CUST_CNT ?? 0),
        TOTAL_RATIO: Number(item.TOTAL_RATIO ?? 0),
        TOTAL_SALE_AMT: Number(item.TOTAL_SALE_AMT ?? 0),
        TOTAL_SALE_QTY: Number(item.TOTAL_SALE_QTY ?? 0),
        TOTAL_AUS: Number(item.TOTAL_AUS ?? 0),
        TOTAL_IPT: Number(item.TOTAL_IPT ?? 0),
      }));

      const workbook = XLSX.utils.book_new();

      // 파스텔톤 스타일 정의
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const titleStyle: any = {
        font: { name: '맑은 고딕', bold: true, sz: 16, color: { rgb: '374151' } },
        alignment: { horizontal: 'center', vertical: 'center' },
        fill: { fgColor: { rgb: 'E0E7FF' } },
      };
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const groupHeaderStyle: any = {
        font: { name: '맑은 고딕', bold: true, color: { rgb: '374151' } },
        alignment: { horizontal: 'center', vertical: 'center' },
        fill: { fgColor: { rgb: 'C7D2FE' } },
        border: {
          top: { style: 'thin', color: { rgb: 'A5B4FC' } },
          bottom: { style: 'thin', color: { rgb: 'A5B4FC' } },
          left: { style: 'thin', color: { rgb: 'A5B4FC' } },
          right: { style: 'thin', color: { rgb: 'A5B4FC' } },
        },
      };
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const detailHeaderStyle: any = {
        font: { name: '맑은 고딕', bold: true, color: { rgb: '374151' }, sz: 10 },
        alignment: { horizontal: 'center', vertical: 'center' },
        fill: { fgColor: { rgb: 'DDD6FE' } },
        border: {
          top: { style: 'thin', color: { rgb: 'BBBBBB' } },
          bottom: { style: 'thin', color: { rgb: 'BBBBBB' } },
          left: { style: 'thin', color: { rgb: 'BBBBBB' } },
          right: { style: 'thin', color: { rgb: 'BBBBBB' } },
        },
      };
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const tableCellStyle: any = {
        font: { name: '맑은 고딕', sz: 10 },
        alignment: { horizontal: 'center', vertical: 'center' },
        border: {
          top: { style: 'thin', color: { rgb: 'EEEEEE' } },
          bottom: { style: 'thin', color: { rgb: 'EEEEEE' } },
          left: { style: 'thin', color: { rgb: 'EEEEEE' } },
          right: { style: 'thin', color: { rgb: 'EEEEEE' } },
        },
      };
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const tableRightStyle: any = {
        ...tableCellStyle,
        alignment: { horizontal: 'right', vertical: 'center' },
      };
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const subtotalStyle: any = {
        font: { name: '맑은 고딕', bold: true, sz: 10 },
        fill: { fgColor: { rgb: 'E0F2FE' } },
        alignment: { horizontal: 'center', vertical: 'center' },
        border: {
          top: { style: 'thin', color: { rgb: '000000' } },
          bottom: { style: 'thin', color: { rgb: '000000' } },
          left: { style: 'thin', color: { rgb: '000000' } },
          right: { style: 'thin', color: { rgb: '000000' } },
        },
      };
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const totalStyle: any = {
        font: { name: '맑은 고딕', bold: true, sz: 10 },
        fill: { fgColor: { rgb: 'D1FAE5' } },
        alignment: { horizontal: 'center', vertical: 'center' },
        border: {
          top: { style: 'medium', color: { rgb: '000000' } },
          bottom: { style: 'medium', color: { rgb: '000000' } },
          left: { style: 'thin', color: { rgb: '000000' } },
          right: { style: 'thin', color: { rgb: '000000' } },
        },
      };
      const numberFmt = '#,##0';
      const decimalFmt = '0.0';

      // 데이터 배열 구성 - 브랜드 제거됨
      const rows: (string | number)[][] = [];
      
      // 타이틀
      rows.push(['판매사원AUS-IPT']);
      rows.push(['']);
      
      // 조회 조건 정보
      rows.push(['조회기간', `${searchForm.saleDateFrom} ~ ${searchForm.saleDateTo}`]);
      rows.push(['생성일시', new Date().toLocaleString('ko-KR')]);
      rows.push(['총 건수', `${formatNumber(exportResponse.totalCount)}건`]);
      rows.push(['']);

      // 그룹 헤더 (Row 7) - 브랜드 제거됨
      rows.push([
        '매장명', '사원명', '가입후미구매',
        '신규고객', '', '', '', '', '',
        '재방문고객', '', '', '', '', '',
        '프리고객', '', '', '', '', '',
        'TOTAL', '', '', '', '', ''
      ]);

      // 세부 헤더 (Row 8)
      rows.push([
        '', '', '',
        '고객수', '비율', '매출금액', '매출수량', 'AUS', 'IPT',
        '고객수', '비율', '매출금액', '매출수량', 'AUS', 'IPT',
        '고객수', '비율', '매출금액', '매출수량', 'AUS', 'IPT',
        '고객수', '비율', '매출금액', '매출수량', 'AUS', 'IPT'
      ]);

      // 데이터 행 - 브랜드 제거됨
      exportItems.forEach((item) => {
        rows.push([
          item.AGENT_NM || '',
          item.STAFF_NM || '',
          item.NOPUR_CNT,
          item.NEW_CUST_CNT,
          item.NEW_RATIO,
          item.NEW_SALE_AMT,
          item.NEW_SALE_QTY,
          item.NEW_AUS,
          item.NEW_IPT,
          item.REV_CUST_CNT,
          item.REV_RATIO,
          item.REV_SALE_AMT,
          item.REV_SALE_QTY,
          item.REV_AUS,
          item.REV_IPT,
          item.FREE_CUST_CNT,
          item.FREE_RATIO,
          item.FREE_SALE_AMT,
          item.FREE_SALE_QTY,
          item.FREE_AUS,
          item.FREE_IPT,
          item.TOTAL_CUST_CNT,
          item.TOTAL_RATIO,
          item.TOTAL_SALE_AMT,
          item.TOTAL_SALE_QTY,
          item.TOTAL_AUS,
          item.TOTAL_IPT
        ]);
      });

      // 시트 생성
      const worksheet = XLSX.utils.aoa_to_sheet(rows);

      // 컬럼 너비 설정 - 브랜드 제거됨
      worksheet['!cols'] = [
        { width: 14 },   // 매장명
        { width: 10 },   // 사원명
        { width: 10 },   // 가입후미구매
        { width: 8 },    // 신규-고객수
        { width: 6 },    // 신규-비율
        { width: 12 },   // 신규-매출금액
        { width: 8 },    // 신규-매출수량
        { width: 10 },   // 신규-AUS
        { width: 6 },    // 신규-IPT
        { width: 8 },    // 재방문-고객수
        { width: 6 },    // 재방문-비율
        { width: 12 },   // 재방문-매출금액
        { width: 8 },    // 재방문-매출수량
        { width: 10 },   // 재방문-AUS
        { width: 6 },    // 재방문-IPT
        { width: 8 },    // 프리-고객수
        { width: 6 },    // 프리-비율
        { width: 12 },   // 프리-매출금액
        { width: 8 },    // 프리-매출수량
        { width: 10 },   // 프리-AUS
        { width: 6 },    // 프리-IPT
        { width: 8 },    // TOTAL-고객수
        { width: 6 },    // TOTAL-비율
        { width: 12 },   // TOTAL-매출금액
        { width: 8 },    // TOTAL-매출수량
        { width: 10 },   // TOTAL-AUS
        { width: 6 },    // TOTAL-IPT
      ];

      // 타이틀 병합 및 스타일 - 브랜드 제거됨
      worksheet['!merges'] = [
        { s: { r: 0, c: 0 }, e: { r: 0, c: 26 } },
        // 그룹 헤더 병합
        { s: { r: 6, c: 3 }, e: { r: 6, c: 8 } },   // 신규고객
        { s: { r: 6, c: 9 }, e: { r: 6, c: 14 } },  // 재방문고객
        { s: { r: 6, c: 15 }, e: { r: 6, c: 20 } }, // 프리고객
        { s: { r: 6, c: 21 }, e: { r: 6, c: 26 } }, // TOTAL
      ];
      if (worksheet['A1']) worksheet['A1'].s = titleStyle;

      // 그룹 헤더 스타일 (Row 7)
      for (let c = 0; c < 27; c++) {
        const addr = XLSX.utils.encode_cell({ r: 6, c });
        if (worksheet[addr]) worksheet[addr].s = groupHeaderStyle;
      }

      // 세부 헤더 스타일 (Row 8)
      for (let c = 0; c < 27; c++) {
        const addr = XLSX.utils.encode_cell({ r: 7, c });
        if (worksheet[addr]) worksheet[addr].s = detailHeaderStyle;
      }

      // 데이터 행 스타일
      const lastRowIdx = rows.length;
      const numericCols = [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26];
      const amountCols = [5, 11, 17, 23]; // 매출금액
      const ratioCols = [4, 8, 10, 14, 16, 20, 22, 26]; // 비율, IPT

      for (let r = 9; r <= lastRowIdx; r++) {
        const rowData = exportItems[r - 9];
        if (!rowData) continue;

        for (let c = 0; c < 27; c++) {
          const addr = XLSX.utils.encode_cell({ r: r - 1, c });
          if (!worksheet[addr]) continue;

          let style;
          if (rowData.ROW_TYPE === 'TOTAL') {
            style = { ...totalStyle };
          } else if (rowData.ROW_TYPE === 'STORE_SUBTOTAL') {
            style = { ...subtotalStyle };
          } else if (numericCols.includes(c)) {
            style = { ...tableRightStyle };
          } else {
            style = { ...tableCellStyle };
          }

          if (amountCols.includes(c)) {
            worksheet[addr].z = numberFmt;
          } else if (ratioCols.includes(c)) {
            worksheet[addr].z = decimalFmt;
          }

          worksheet[addr].s = style;
        }
      }

      // 워크북에 시트 추가
      XLSX.utils.book_append_sheet(workbook, worksheet, '판매사원AUS-IPT');

      // 파일명 생성
      const dateRange = `${searchForm.saleDateFrom.replace(/-/g, '')}_${searchForm.saleDateTo.replace(/-/g, '')}`;
      const fileName = `판매사원AUS-IPT_${dateRange}.xlsx`;

      // 파일 다운로드
      XLSX.writeFile(workbook, fileName);

    } catch (error) {
      console.error('엑셀 다운로드 실패:', error);
      alert('엑셀 다운로드 중 오류가 발생했습니다.');
    }
  }, [result.totalCount, searchForm, user, formatNumber]);

  return (
    <div className="olm-container order-out-status-page sales-person-ausipt-page">
      <div className="top-section">
        <h1 className="page-title">
          {currentTab?.menuIcon
            ? React.createElement(getMenuIcon(currentTab.menuIcon), { size: 14 })
            : <i className="fas fa-chart-bar"></i>}
          판매사원AUS-IPT
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
          <i className="fas fa-chart-bar"></i>
          판매사원AUS-IPT 분석 ({formatNumber(result.totalCount)}건)
        </h3>

        {/* 합계 정보 - 가입후미구매 추가 */}
        <div className="olm-grid-summary">
          <div className="summary-group nopur-group">
            <span className="summary-label">가입후미구매:</span>
            <span className="summary-value">{formatNumber(result.sumNopurCnt)}명</span>
          </div>
          <div className="summary-group new-group">
            <span className="summary-label">신규고객:</span>
            <span className="summary-value">{formatNumber(result.sumNewCustCnt)}명</span>
            <span className="summary-value amt">{formatNumber(result.sumNewSaleAmt)}원</span>
          </div>
          <div className="summary-group revisit-group">
            <span className="summary-label">재방문:</span>
            <span className="summary-value">{formatNumber(result.sumRevCustCnt)}명</span>
            <span className="summary-value amt">{formatNumber(result.sumRevSaleAmt)}원</span>
          </div>
          <div className="summary-group free-group">
            <span className="summary-label">프리:</span>
            <span className="summary-value">{formatNumber(result.sumFreeCustCnt)}명</span>
            <span className="summary-value amt">{formatNumber(result.sumFreeSaleAmt)}원</span>
          </div>
          <div className="summary-group total-group">
            <span className="summary-label">TOTAL:</span>
            <span className="summary-value">{formatNumber(result.sumTotalCustCnt)}명</span>
            <span className="summary-value amt">{formatNumber(result.sumTotalSaleAmt)}원</span>
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
              <p>조건에 해당하는 데이터가 없습니다.</p>
            </div>
          ) : (
            <div className="order-out-status-table-wrapper sales-person-ausipt-table-wrapper">
              <table className="order-out-status-table sales-person-ausipt-table">
                <thead>
                  {/* 브랜드 컬럼 제거됨, 파스텔톤 색상 적용 */}
                  <tr className="header-group">
                    <th rowSpan={2} className="col-store">매장명</th>
                    <th rowSpan={2} className="col-staff">사원명</th>
                    <th rowSpan={2} className="col-nopur">가입후<br/>미구매</th>
                    <th colSpan={6} className="header-new">신규고객</th>
                    <th colSpan={6} className="header-revisit">재방문고객</th>
                    <th colSpan={6} className="header-free">프리고객</th>
                    <th colSpan={6} className="header-total">TOTAL</th>
                  </tr>
                  <tr className="header-detail">
                    {/* 신규고객 */}
                    <th className="header-new">고객수</th>
                    <th className="header-new">비율</th>
                    <th className="header-new">매출금액</th>
                    <th className="header-new">매출수량</th>
                    <th className="header-new">AUS</th>
                    <th className="header-new">IPT</th>
                    {/* 재방문고객 */}
                    <th className="header-revisit">고객수</th>
                    <th className="header-revisit">비율</th>
                    <th className="header-revisit">매출금액</th>
                    <th className="header-revisit">매출수량</th>
                    <th className="header-revisit">AUS</th>
                    <th className="header-revisit">IPT</th>
                    {/* 프리고객 */}
                    <th className="header-free">고객수</th>
                    <th className="header-free">비율</th>
                    <th className="header-free">매출금액</th>
                    <th className="header-free">매출수량</th>
                    <th className="header-free">AUS</th>
                    <th className="header-free">IPT</th>
                    {/* TOTAL */}
                    <th className="header-total">고객수</th>
                    <th className="header-total">비율</th>
                    <th className="header-total">매출금액</th>
                    <th className="header-total">매출수량</th>
                    <th className="header-total">AUS</th>
                    <th className="header-total">IPT</th>
                  </tr>
                </thead>
                <tbody>
                  {result.items.map((row, idx) => (
                    <tr 
                      key={`${row.AGENT_ID}-${row.STAFF_ID}-${idx}`}
                      className={getRowClass(row.ROW_TYPE)}
                    >
                      <td className="col-store">{row.AGENT_NM || '-'}</td>
                      <td className="col-staff">{row.STAFF_NM || '-'}</td>
                      <td className="numeric-cell col-nopur">{formatNumber(row.NOPUR_CNT)}</td>
                      {/* 신규고객 */}
                      <td className="numeric-cell">{formatNumber(row.NEW_CUST_CNT)}</td>
                      <td className="numeric-cell ratio-cell">{formatDecimal(row.NEW_RATIO)}</td>
                      <td className="numeric-cell amount-cell">{formatNumber(row.NEW_SALE_AMT)}</td>
                      <td className="numeric-cell">{formatNumber(row.NEW_SALE_QTY)}</td>
                      <td className="numeric-cell aus-value">{formatNumber(row.NEW_AUS)}</td>
                      <td className="numeric-cell ipt-value">{formatDecimal(row.NEW_IPT)}</td>
                      {/* 재방문고객 */}
                      <td className="numeric-cell">{formatNumber(row.REV_CUST_CNT)}</td>
                      <td className="numeric-cell ratio-cell">{formatDecimal(row.REV_RATIO)}</td>
                      <td className="numeric-cell amount-cell">{formatNumber(row.REV_SALE_AMT)}</td>
                      <td className="numeric-cell">{formatNumber(row.REV_SALE_QTY)}</td>
                      <td className="numeric-cell aus-value">{formatNumber(row.REV_AUS)}</td>
                      <td className="numeric-cell ipt-value">{formatDecimal(row.REV_IPT)}</td>
                      {/* 프리고객 */}
                      <td className="numeric-cell">{formatNumber(row.FREE_CUST_CNT)}</td>
                      <td className="numeric-cell ratio-cell">{formatDecimal(row.FREE_RATIO)}</td>
                      <td className="numeric-cell amount-cell">{formatNumber(row.FREE_SALE_AMT)}</td>
                      <td className="numeric-cell">{formatNumber(row.FREE_SALE_QTY)}</td>
                      <td className="numeric-cell aus-value">{formatNumber(row.FREE_AUS)}</td>
                      <td className="numeric-cell ipt-value">{formatDecimal(row.FREE_IPT)}</td>
                      {/* TOTAL */}
                      <td className="numeric-cell">{formatNumber(row.TOTAL_CUST_CNT)}</td>
                      <td className="numeric-cell ratio-cell">{formatDecimal(row.TOTAL_RATIO)}</td>
                      <td className="numeric-cell amount-cell">{formatNumber(row.TOTAL_SALE_AMT)}</td>
                      <td className="numeric-cell">{formatNumber(row.TOTAL_SALE_QTY)}</td>
                      <td className="numeric-cell aus-value">{formatNumber(row.TOTAL_AUS)}</td>
                      <td className="numeric-cell ipt-value">{formatDecimal(row.TOTAL_IPT)}</td>
                    </tr>
                  ))}
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

export default SalesPersonausipt;
