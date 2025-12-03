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
import CommonMultiSelect from './CommonMultiSelect';
import {
  AgentInfo,
  DailySalesStatusItem,
  DailySalesStatusResponse,
  DailySalesStatusSearchParams,
  AgentDayData,
  searchDailySalesStatus,
  parseAgentData,
} from '../services/dailySalesStatusService';
import { getMenuIcon } from '../utils/menuUtils';
import './OrderListManagement.css';
import './orderOutStatus.css';
import './dailySalesStatus.css';
import '../styles/designTokens.css';

// ✅ 검색 폼 상태 타입 정의
type SearchFormState = {
  saleMonth: string;
  agentIds: string[];
  custNmList: string;
  staffNmList: string;           // 판매직원명 콤마 구분 텍스트
  brandIds: string[];
  btypeGbnIds: string[];
  mtypeGbnIds: string[];
  stypeGbnIds: string[];
  goodsNmList: string;
};

// ✅ 조회 결과 상태 타입
type DailySalesStatusResult = {
  items: DailySalesStatusItem[];
  agents: AgentInfo[];
  saleMonth: string;
  // 전체 합계
  totalStoreAmt: number;
  totalOnlineAmt: number;
  totalSumAmt: number;
  totalCustCnt: number;
  // 전월 합계
  prevMonthStoreAmt: number;
  prevMonthOnlineAmt: number;
  prevMonthSumAmt: number;
  prevMonthCustCnt: number;
  // 전년 합계
  prevYearStoreAmt: number;
  prevYearOnlineAmt: number;
  prevYearSumAmt: number;
  prevYearCustCnt: number;
};

// ✅ 기본 연월 생성 헬퍼
const createDefaultMonth = () => {
  const date = new Date();
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
};

// ✅ 검색 파라미터 정규화 함수
const normalizeSearchParams = (
  params: SearchFormState,
): DailySalesStatusSearchParams => {
  const normalized: DailySalesStatusSearchParams = {
    mode: 'SEARCH',
    saleMonth: params.saleMonth || undefined,
    custNmList: params.custNmList.trim() || undefined,
    goodsNmList: params.goodsNmList.trim() || undefined,
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

const DailySalesStatus: React.FC = () => {
  const { user } = useSelector((state: RootState) => state.auth);
  const { tabs, activeTabId } = useSelector((state: RootState) => state.tabs);

  // ✅ 현재 탭 정보 파악 (아이콘 표시용)
  const currentTab = useMemo(
    () => tabs.find((tab) => tab.id === activeTabId),
    [tabs, activeTabId],
  );

  // ✅ 초기 검색 폼 상태 계산
  const computeInitialForm = useCallback((): SearchFormState => {
    return {
      saleMonth: createDefaultMonth(),
      agentIds: [],
      custNmList: '',
      staffNmList: '',            // 판매직원명 콤마 구분 텍스트
      brandIds: [],
      btypeGbnIds: [],
      mtypeGbnIds: [],
      stypeGbnIds: [],
      goodsNmList: '',
    };
  }, []);

  const [searchForm, setSearchForm] = useState<SearchFormState>(() =>
    computeInitialForm(),
  );
  const [result, setResult] = useState<DailySalesStatusResult>({
    items: [],
    agents: [],
    saleMonth: createDefaultMonth(),
    totalStoreAmt: 0,
    totalOnlineAmt: 0,
    totalSumAmt: 0,
    totalCustCnt: 0,
    prevMonthStoreAmt: 0,
    prevMonthOnlineAmt: 0,
    prevMonthSumAmt: 0,
    prevMonthCustCnt: 0,
    prevYearStoreAmt: 0,
    prevYearOnlineAmt: 0,
    prevYearSumAmt: 0,
    prevYearCustCnt: 0,
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
      const payload: DailySalesStatusSearchParams = {
        ...normalized,
        userRoleId: user.roleId,
        userAgentId: user.agentId ? String(user.agentId) : undefined,
      };

      try {
        const response: DailySalesStatusResponse =
          await searchDailySalesStatus(payload);

        if (!response.success) {
          setErrorMessage(response.message || '일일매출현황을 불러오지 못했습니다.');
          setResult((prev) => ({
            ...prev,
            items: [],
            agents: [],
          }));
          return;
        }

        // ✅ 수치 데이터 정규화
        const items: DailySalesStatusItem[] = (response.items || []).map((item) => ({
          ...item,
          TOTAL_STORE_AMT: Number(item.TOTAL_STORE_AMT ?? 0),
          TOTAL_ONLINE_AMT: Number(item.TOTAL_ONLINE_AMT ?? 0),
          TOTAL_SUM_AMT: Number(item.TOTAL_SUM_AMT ?? 0),
          TOTAL_CUST_CNT: Number(item.TOTAL_CUST_CNT ?? 0),
        }));

        setResult({
          items,
          agents: response.agents || [],
          saleMonth: response.saleMonth || merged.saleMonth,
          totalStoreAmt: Number(response.totalStoreAmt ?? 0),
          totalOnlineAmt: Number(response.totalOnlineAmt ?? 0),
          totalSumAmt: Number(response.totalSumAmt ?? 0),
          totalCustCnt: Number(response.totalCustCnt ?? 0),
          prevMonthStoreAmt: Number(response.prevMonthStoreAmt ?? 0),
          prevMonthOnlineAmt: Number(response.prevMonthOnlineAmt ?? 0),
          prevMonthSumAmt: Number(response.prevMonthSumAmt ?? 0),
          prevMonthCustCnt: Number(response.prevMonthCustCnt ?? 0),
          prevYearStoreAmt: Number(response.prevYearStoreAmt ?? 0),
          prevYearOnlineAmt: Number(response.prevYearOnlineAmt ?? 0),
          prevYearSumAmt: Number(response.prevYearSumAmt ?? 0),
          prevYearCustCnt: Number(response.prevYearCustCnt ?? 0),
        });
      } catch (error: unknown) {
        console.error('일일매출현황 조회 실패:', error);
        const errorObj = error as { message?: string };
        setErrorMessage(
          errorObj?.message || '일일매출현황을 조회하는 중 문제가 발생했습니다.',
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
    }));
  };

  // ✅ 폼 제출 처리기
  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    await executeSearch();
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
      case 'SUBTOTAL':
        return 'row-subtotal';
      case 'TARGET':
        return 'row-target';
      case 'ACHIEVE':
        return 'row-achieve';
      case 'PREV_MONTH':
        return 'row-prev-month';
      case 'PREV_MONTH_RATIO':
        return 'row-prev-month-ratio';
      case 'PREV_YEAR':
        return 'row-prev-year';
      case 'PREV_YEAR_RATIO':
        return 'row-prev-year-ratio';
      default:
        return 'row-day';
    }
  }, []);

  // ✅ 요일 클래스 결정
  const getDowClass = useCallback((dow: string) => {
    if (dow === 'SUN') return 'dow-sun';
    if (dow === 'SAT') return 'dow-sat';
    return '';
  }, []);

  // ✅ 매장별 헤더 색상 클래스
  const getAgentHeaderClass = useCallback((index: number) => {
    const classes = ['header-agent-1', 'header-agent-2', 'header-agent-3', 'header-agent-4'];
    return classes[index % classes.length];
  }, []);

  // ✅ 매장별 데이터 파싱 (캐시)
  const parsedAgentData = useMemo(() => {
    const parsed: Map<string, AgentDayData[]> = new Map();
    result.items.forEach((item, idx) => {
      const key = `${item.ROW_TYPE}-${item.DAY_NUM ?? idx}`;
      parsed.set(key, parseAgentData(item.AGENT_DATA));
    });
    return parsed;
  }, [result.items]);

  // ✅ 특정 행의 매장별 데이터 가져오기
  const getAgentDataForRow = useCallback((item: DailySalesStatusItem, idx: number): AgentDayData[] => {
    const key = `${item.ROW_TYPE}-${item.DAY_NUM ?? idx}`;
    return parsedAgentData.get(key) || [];
  }, [parsedAgentData]);

  // ✅ 엑셀 내보내기 처리
  const handleExportExcel = useCallback(async () => {
    if (result.items.length === 0) {
      alert('내보낼 데이터가 없습니다.');
      return;
    }

    try {
      const workbook = XLSX.utils.book_new();

      // 파스텔톤 스타일 정의
      const titleStyle = {
        font: { name: '맑은 고딕', bold: true, sz: 16, color: { rgb: '374151' } },
        alignment: { horizontal: 'center', vertical: 'center' },
        fill: { fgColor: { rgb: 'E0E7FF' } },
      };
      const headerStyle = {
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

      // 데이터 배열 구성
      const rows: (string | number)[][] = [];
      
      // 타이틀
      rows.push([`일일 매출 현황`]);
      rows.push([`판매년월 : ${result.saleMonth}`]);
      rows.push(['']);

      // 헤더 1행 - 그룹 헤더
      const header1: (string | number)[] = ['일', '요일', 'Total', '', '', ''];
      result.agents.forEach((agent) => {
        header1.push(agent.AGENT_NM, '', '', '');
      });
      rows.push(header1);

      // 헤더 2행 - 세부 헤더
      const header2: (string | number)[] = ['', '', '매장', '온라인', '합계', '고객수'];
      result.agents.forEach(() => {
        header2.push('매장', '온라인', '합계', '고객수');
      });
      rows.push(header2);

      // 데이터 행
      result.items.forEach((item, idx) => {
        const agentData = getAgentDataForRow(item, idx);
        const row: (string | number)[] = [
          item.DAY_NUM ?? '',
          item.DAY_OF_WEEK || '',
          item.TOTAL_STORE_AMT,
          item.TOTAL_ONLINE_AMT,
          item.TOTAL_SUM_AMT,
          item.TOTAL_CUST_CNT,
        ];

        result.agents.forEach((agent) => {
          const ad = agentData.find(a => a.AGENT_ID === agent.AGENT_ID);
          row.push(ad?.STORE_AMT ?? 0);
          row.push(ad?.ONLINE_AMT ?? 0);
          row.push(ad?.SUM_AMT ?? 0);
          row.push(ad?.CUST_CNT ?? 0);
        });

        rows.push(row);
      });

      // 시트 생성
      const worksheet = XLSX.utils.aoa_to_sheet(rows);

      // 컬럼 너비 설정
      const cols = [
        { width: 5 },   // 일
        { width: 6 },   // 요일
        { width: 12 },  // Total 매장
        { width: 12 },  // Total 온라인
        { width: 12 },  // Total 합계
        { width: 8 },   // Total 고객수
      ];
      result.agents.forEach(() => {
        cols.push({ width: 12 }, { width: 12 }, { width: 12 }, { width: 8 });
      });
      worksheet['!cols'] = cols;

      // 타이틀 스타일 적용
      if (worksheet['A1']) worksheet['A1'].s = titleStyle;

      // 헤더 스타일 적용 (4행, 5행)
      const totalCols = 6 + (result.agents.length * 4);
      for (let col = 0; col < totalCols; col++) {
        const colLetter = XLSX.utils.encode_col(col);
        const cell4 = worksheet[`${colLetter}4`];
        const cell5 = worksheet[`${colLetter}5`];
        if (cell4) cell4.s = headerStyle;
        if (cell5) cell5.s = headerStyle;
      }

      // 워크북에 시트 추가
      XLSX.utils.book_append_sheet(workbook, worksheet, '일일매출현황');

      // 파일명 생성
      const fileName = `일일매출현황_${result.saleMonth.replace('-', '')}.xlsx`;

      // 파일 다운로드
      XLSX.writeFile(workbook, fileName);

    } catch (error) {
      console.error('엑셀 다운로드 실패:', error);
      alert('엑셀 다운로드 중 오류가 발생했습니다.');
    }
  }, [result, getAgentDataForRow]);

  return (
    <div className="olm-container order-out-status-page daily-sales-status-page">
      <div className="top-section">
        <h1 className="page-title">
          {currentTab?.menuIcon
            ? React.createElement(getMenuIcon(currentTab.menuIcon), { size: 14 })
            : <i className="fas fa-chart-line"></i>}
          일일매출현황
        </h1>

        <form className="search-conditions" onSubmit={handleSubmit}>
          <div className="search-row">
            <div className="search-item">
              <label htmlFor="saleMonth">판매년월</label>
              <input
                type="month"
                id="saleMonth"
                className="month-picker"
                value={searchForm.saleMonth}
                onChange={(e) => handleInputChange('saleMonth', e.target.value)}
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
          일일 매출 현황 - {result.saleMonth}
        </h3>

        {/* 합계 정보 - 판매사원aus-ipt 스타일 */}
        <div className="olm-grid-summary">
          <div className="summary-group store-group">
            <span className="summary-label">매장매출:</span>
            <span className="summary-value">{formatNumber(result.totalStoreAmt)}원</span>
          </div>
          <div className="summary-group online-group">
            <span className="summary-label">온라인매출:</span>
            <span className="summary-value">{formatNumber(result.totalOnlineAmt)}원</span>
          </div>
          <div className="summary-group total-group">
            <span className="summary-label">합계:</span>
            <span className="summary-value">{formatNumber(result.totalSumAmt)}원</span>
          </div>
          <div className="summary-group cust-group">
            <span className="summary-label">고객수:</span>
            <span className="summary-value">{formatNumber(result.totalCustCnt)}명</span>
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
            <div className="daily-sales-table-wrapper">
              <table className="order-out-status-table daily-sales-table">
                <thead>
                  {/* 그룹 헤더 */}
                  <tr>
                    <th rowSpan={2} className="col-day">일</th>
                    <th rowSpan={2} className="col-dow">요일</th>
                    <th colSpan={4} className="header-total">Total</th>
                    {result.agents.map((agent, idx) => (
                      <th key={agent.AGENT_ID} colSpan={4} className={getAgentHeaderClass(idx)}>
                        {agent.AGENT_NM}
                      </th>
                    ))}
                  </tr>
                  {/* 세부 헤더 */}
                  <tr>
                    <th className="header-total">매장</th>
                    <th className="header-total">온라인</th>
                    <th className="header-total">합계</th>
                    <th className="header-total">고객수</th>
                    {result.agents.map((agent, idx) => (
                      <React.Fragment key={`sub-${agent.AGENT_ID}`}>
                        <th className={getAgentHeaderClass(idx)}>매장</th>
                        <th className={getAgentHeaderClass(idx)}>온라인</th>
                        <th className={getAgentHeaderClass(idx)}>합계</th>
                        <th className={getAgentHeaderClass(idx)}>고객수</th>
                      </React.Fragment>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {result.items.map((row, idx) => {
                    const agentData = getAgentDataForRow(row, idx);
                    return (
                      <tr key={`${row.ROW_TYPE}-${row.DAY_NUM ?? idx}`} className={getRowClass(row.ROW_TYPE)}>
                        <td className="col-day">{row.DAY_NUM ?? ''}</td>
                        <td className={`col-dow ${getDowClass(row.DAY_OF_WEEK)}`}>{row.DAY_OF_WEEK}</td>
                        <td className="numeric-cell amt-store">{formatNumber(row.TOTAL_STORE_AMT)}</td>
                        <td className="numeric-cell amt-online">{formatNumber(row.TOTAL_ONLINE_AMT)}</td>
                        <td className="numeric-cell amt-total">{formatNumber(row.TOTAL_SUM_AMT)}</td>
                        <td className="numeric-cell cnt-cust">{formatNumber(row.TOTAL_CUST_CNT)}</td>
                        {result.agents.map((agent) => {
                          const ad = agentData.find(a => a.AGENT_ID === agent.AGENT_ID);
                          return (
                            <React.Fragment key={`data-${agent.AGENT_ID}`}>
                              <td className="numeric-cell amt-store">{formatNumber(ad?.STORE_AMT ?? 0)}</td>
                              <td className="numeric-cell amt-online">{formatNumber(ad?.ONLINE_AMT ?? 0)}</td>
                              <td className="numeric-cell amt-total">{formatNumber(ad?.SUM_AMT ?? 0)}</td>
                              <td className="numeric-cell cnt-cust">{formatNumber(ad?.CUST_CNT ?? 0)}</td>
                            </React.Fragment>
                          );
                        })}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DailySalesStatus;
