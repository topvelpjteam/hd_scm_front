import React, {
  Fragment,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '../store/store';
import Pagination from './Pagination';
import DateRangePicker from './common/DateRangePicker';
import CommonMultiSelect from './CommonMultiSelect';
import {
  InOutStatusDetailItem,
  InOutStatusDetailResponse,
  InOutStatusItem,
  InOutStatusResponse,
  InOutStatusSearchParams,
  fetchInOutStatusDetails,
  searchInOutStatus,
} from '../services/inOutStatusService';
import { getMenuIcon } from '../utils/menuUtils';
import { exportInOutStatusToExcel } from '../utils/exportInOutStatusExcel';
import './inOutStatus.css';
import './OrderListManagement.css';
import './orderOutStatus.css';

// ✅ 검색 폼 상태 타입 정의
type SearchFormState = {
  dateFrom: string;
  dateTo: string;
  searchText: string;
  statusType: string[];
  agentIds: string[];
  vendorIds: string[];
  brandIds: string[];
  pageNum: number;
  pageSize: number;
};

// ✅ 조회 결과 상태 타입
type InOutStatusResult = {
  items: InOutStatusItem[];
  totalCount: number;
  totalPages: number;
  pageNum: number;
  pageSize: number;
};

// ✅ 입출고 상태 옵션 리스트 (저장프로시저의 IO_TYPE 값과 매핑)
const STATUS_TYPE_OPTIONS = [
  { value: '전체', label: '전체' },
  { value: '발주', label: '발주' },
  { value: '출고', label: '출고' },
  { value: '입고', label: '입고' },
];

// ✅ 기본 날짜 생성 헬퍼
const createDefaultDate = (offsetDays: number) => {
  const date = new Date();
  date.setDate(date.getDate() + offsetDays);
  return date.toISOString().slice(0, 10);
};

// ✅ 검색 파라미터 정규화 함수 (백엔드 InOutStatusRequest에 맞게 변환)
const normalizeSearchParams = (
  params: SearchFormState,
): InOutStatusSearchParams => {
  const normalized: InOutStatusSearchParams = {
    // 발주일자 범위
    dateFrom: params.dateFrom || undefined,
    dateTo: params.dateTo || undefined,
    searchText: params.searchText.trim() || undefined,
    pageNum: params.pageNum,
    pageSize: params.pageSize,
  };

  // 입출고 상태 유형 필터
  if (params.statusType.length > 0) {
    normalized.statusType = params.statusType;
  }

  if (params.agentIds.length > 0) {
    normalized.agentIds = params.agentIds;
  }

  if (params.vendorIds.length > 0) {
    normalized.vendorIds = params.vendorIds;
  }

  if (params.brandIds.length > 0) {
    normalized.brandIds = params.brandIds;
  }

  return normalized;
};

const InOutStatus: React.FC = () => {
  const { user } = useSelector((state: RootState) => state.auth);
  const { tabs, activeTabId } = useSelector((state: RootState) => state.tabs);

  // ✅ 현재 탭 정보 파악
  const currentTab = useMemo(
    () => tabs.find((tab) => tab.id === activeTabId),
    [tabs, activeTabId],
  );

  // ✅ 초기 검색 폼 상태 계산
  const computeInitialForm = useCallback((): SearchFormState => {
    const defaultFrom = createDefaultDate(-30);
    const defaultTo = createDefaultDate(0);

    return {
      dateFrom: defaultFrom,
      dateTo: defaultTo,
      searchText: '',
      statusType: [],
      agentIds: [],
      vendorIds: [],
      brandIds: [],
      pageNum: 1,
      pageSize: 20,
    };
  }, []);

  const [searchForm, setSearchForm] = useState<SearchFormState>(() =>
    computeInitialForm(),
  );
  const [result, setResult] = useState<InOutStatusResult>({
    items: [],
    totalCount: 0,
    totalPages: 0,
    pageNum: 1,
    pageSize: 20,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const executeSearchRef = useRef<
    (override?: Partial<SearchFormState>) => Promise<void>
  >();
  const initialLoadRef = useRef(false);
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const [detailMap, setDetailMap] = useState<
    Map<string, InOutStatusDetailItem[]>
  >(new Map());
  const [detailLoadingRows, setDetailLoadingRows] = useState<Set<string>>(
    new Set(),
  );
  const [detailErrors, setDetailErrors] = useState<Map<string, string>>(
    new Map(),
  );

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
      const payload: InOutStatusSearchParams = {
        ...normalized,
        userRoleId: user.roleId,
        userAgentId: user.agentId ? String(user.agentId) : undefined,
      };

      try {
        const response: InOutStatusResponse = await searchInOutStatus(payload);

        if (!response.success) {
          setErrorMessage(response.message || '입출고 현황을 불러오지 못했습니다.');
          setResult((prev) => ({
            ...prev,
            items: [],
            totalCount: 0,
            totalPages: 0,
          }));
          return;
        }

        // ✅ 수치 데이터 정규ud654 (실제 SP 필드명 사용)
        const items = (response.items || []).map((item) => ({
          ...item,
          TOTAL_ORDER_QTY: Number(item.TOTAL_ORDER_QTY ?? item.TOTAL_QTY ?? 0),
          TOTAL_OUT_QTY: Number(item.TOTAL_OUT_QTY ?? item.OUT_QTY ?? 0),
          TOTAL_IN_QTY: Number(item.TOTAL_IN_QTY ?? item.IN_QTY ?? 0),
          PENDING_QTY: Number(item.PENDING_QTY ?? 0),
          PROGRESS_RATE: Number(item.PROGRESS_RATE ?? 0),
          IN_STATUS: item.IN_STATUS ?? item.STATUS ?? '',
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
        });
      } catch (error: any) {
        console.error('입출고 현황 조회 실패:', error);
        setErrorMessage(
          error?.message || '입출고 현황을 조회하는 중 문제가 발생했습니다.',
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
    setExpandedRows(new Set());
    setDetailMap(new Map());
    setDetailErrors(new Map());
    setDetailLoadingRows(new Set());
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

    setExpandedRows(new Set());
    setDetailMap(new Map());
    setDetailErrors(new Map());
    setDetailLoadingRows(new Set());

    await executeSearch({ pageNum: 1 });
  };

  // ✅ 페이지 이동 처리기
  const handlePageChange = async (page: number, pageSize: number) => {
    setSearchForm((prev) => ({
      ...prev,
      pageNum: page,
      pageSize,
    }));

    setExpandedRows(new Set());
    setDetailMap(new Map());
    setDetailErrors(new Map());
    setDetailLoadingRows(new Set());

    await executeSearch({ pageNum: page, pageSize });
  };

  // ✅ 최초 진입 시 자동 조회
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

  // ✅ 요약 정보 계산 (실제 SP 필드명 사용)
  const summary = useMemo(() => {
    if (!result.items.length) {
      return {
        totalOrderQty: 0,
        totalOutQty: 0,
        totalInQty: 0,
        totalPendingQty: 0,
        averageProgress: 0,
      };
    }

    const totals = result.items.reduce(
      (acc, item) => {
        // 실제 SP 필드명 사용 (TOTAL_ORDER_QTY, TOTAL_OUT_QTY, TOTAL_IN_QTY, PENDING_QTY)
        const orderQty = Number(item.TOTAL_ORDER_QTY ?? item.TOTAL_QTY ?? 0);
        const outQty = Number(item.TOTAL_OUT_QTY ?? item.OUT_QTY ?? 0);
        const inQty = Number(item.TOTAL_IN_QTY ?? item.IN_QTY ?? 0);
        const pendingQty = Number(item.PENDING_QTY ?? Math.max(0, orderQty - inQty));
        const progressRate = Number(item.PROGRESS_RATE ?? 0);

        acc.totalOrderQty += orderQty;
        acc.totalOutQty += outQty;
        acc.totalInQty += inQty;
        acc.totalPendingQty += pendingQty;
        acc.progressSum += progressRate;
        return acc;
      },
      { totalOrderQty: 0, totalOutQty: 0, totalInQty: 0, totalPendingQty: 0, progressSum: 0 },
    );

    const averageProgress =
      result.items.length === 0
        ? 0
        : Math.round((totals.progressSum / result.items.length) * 10) / 10;

    return {
      totalOrderQty: totals.totalOrderQty,
      totalOutQty: totals.totalOutQty,
      totalInQty: totals.totalInQty,
      totalPendingQty: totals.totalPendingQty,
      averageProgress,
    };
  }, [result.items]);

  // ✅ 검색 조건 초기화
  const handleReset = useCallback(() => {
    const resetState = computeInitialForm();
    setSearchForm(resetState);
    initialLoadRef.current = true;
    setExpandedRows(new Set());
    setDetailMap(new Map());
    setDetailErrors(new Map());
    setDetailLoadingRows(new Set());

    executeSearchRef.current?.({
      ...resetState,
    });
  }, [computeInitialForm]);

  // ✅ 엑셀 다운로드 핸들러
  const handleExportExcel = useCallback(() => {
    if (result.items.length === 0) {
      window.alert('엑셀로 내보낼 데이터가 없습니다.');
      return;
    }

    const today = new Date();
    const dateStr = `${today.getFullYear()}${String(today.getMonth() + 1).padStart(2, '0')}${String(today.getDate()).padStart(2, '0')}`;
    const fileName = `입출고현황_${dateStr}.xlsx`;

    try {
      exportInOutStatusToExcel({
        items: result.items,
        dateFrom: searchForm.dateFrom,
        dateTo: searchForm.dateTo,
        generatedAt: today,
        totalCount: result.totalCount,
        fileName,
      });
    } catch (error) {
      console.error('입출고 현황 엑셀 내보내기 실패:', error);
      window.alert('엑셀 파일 생성 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.');
    }
  }, [result.items, result.totalCount, searchForm.dateFrom, searchForm.dateTo]);

  // ✅ 행 고유 키 생성
  const getRowKey = useCallback(
    (item: InOutStatusItem, index?: number) => {
      // 가능한 모든 고유 식별자를 조합하여 중복 방지
      const parts = [
        item.ORDER_D,
        item.ORDER_SEQU,
        item.IO_TYPE ?? 'none',
        item.SLIP_NO ?? '',
        item.AGENT_ID ?? '',
      ];
      // index가 제공되면 추가하여 완전한 고유성 보장
      if (index !== undefined) {
        parts.push(String(index));
      }
      return parts.join('-');
    },
    [],
  );

  // ✅ 상세 조회 실행
  const loadRowDetails = useCallback(
    async (item: InOutStatusItem, index: number) => {
      const rowKey = getRowKey(item, index);
      if (detailMap.has(rowKey) || detailLoadingRows.has(rowKey)) {
        return;
      }

      setDetailLoadingRows((prev) => {
        const next = new Set(prev);
        next.add(rowKey);
        return next;
      });

      setDetailErrors((prev) => {
        const next = new Map(prev);
        next.delete(rowKey);
        return next;
      });

      try {
        const response: InOutStatusDetailResponse =
          await fetchInOutStatusDetails({
            orderDate: item.ORDER_D,
            orderSequ: item.ORDER_SEQU,
            vendorId: item.VENDOR_ID ?? 0,
          });

        if (!response.success) {
          setDetailErrors((prev) => {
            const next = new Map(prev);
            next.set(
              rowKey,
              response.message || '상세 품목 정보를 불러오지 못했습니다.',
            );
            return next;
          });
          return;
        }

        const normalizedItems = (response.items || []).map((detail) => ({
          ...detail,
          ORDER_QTY: Number(detail.ORDER_QTY ?? 0),
          OUT_QTY: Number(detail.OUT_QTY ?? 0),
          IN_QTY: Number(detail.IN_QTY ?? 0),
        }));

        setDetailMap((prev) => {
          const next = new Map(prev);
          next.set(rowKey, normalizedItems);
          return next;
        });
      } catch (error: any) {
        console.error('입출고 현황 상세 조회 실패:', error);
        setDetailErrors((prev) => {
          const next = new Map(prev);
          next.set(
            rowKey,
            error?.message || '상세 품목 정보를 불러오는 중 오류가 발생했습니다.',
          );
          return next;
        });
      } finally {
        setDetailLoadingRows((prev) => {
          const next = new Set(prev);
          next.delete(rowKey);
          return next;
        });
      }
    },
    [detailLoadingRows, detailMap, getRowKey],
  );

  // ✅ 행 확장 토글
  const handleToggleRow = useCallback(
    (item: InOutStatusItem, index: number) => {
      const rowKey = getRowKey(item, index);
      const isExpanded = expandedRows.has(rowKey);

      setExpandedRows((prev) => {
        const next = new Set(prev);
        if (next.has(rowKey)) {
          next.delete(rowKey);
        } else {
          next.add(rowKey);
        }
        return next;
      });

      if (!isExpanded) {
        void loadRowDetails(item, index);
      }
    },
    [expandedRows, getRowKey, loadRowDetails],
  );

  // ✅ 상태 배지 색상 결정
  const getStatusClass = useCallback((status: string) => {
    switch (status) {
      case '입고':
        return 'ios-status-in';
      case '출고':
        return 'ios-status-out';
      default:
        return 'ios-status-pending';
    }
  }, []);

  const { totalOutQty, totalInQty, totalPendingQty, averageProgress } = summary;

  return (
    <div className="olm-container order-out-status-page ios-page">
      <div className="top-section">
        <h1 className="page-title">
          {currentTab?.menuIcon
            ? React.createElement(getMenuIcon(currentTab.menuIcon), { size: 14 })
            : <i className="fas fa-exchange-alt"></i>}
          입출고 현황
        </h1>

        <form className="search-conditions" onSubmit={handleSubmit}>
          <div className="search-row">
            <div className="search-item">
              <label htmlFor="dateRange">날짜 범위</label>
              <DateRangePicker
                startDate={searchForm.dateFrom}
                endDate={searchForm.dateTo}
                onStartDateChange={(value) =>
                  handleInputChange('dateFrom', value)
                }
                onEndDateChange={(value) =>
                  handleInputChange('dateTo', value)
                }
                placeholder="조회 날짜를 선택하세요"
                className="olm-date-range-picker"
              />
            </div>

            <div className="search-item">
              <label htmlFor="statusTypeSelector">입출고 상태</label>
              <CommonMultiSelect
                options={STATUS_TYPE_OPTIONS}
                selectedValues={searchForm.statusType}
                onSelectionChange={(values) =>
                  handleInputChange('statusType', values)
                }
                placeholder="입출고 상태를 선택하세요"
                className="olm-multi-select"
                showLoading={false}
              />
            </div>

            <div className="search-item">
              <label htmlFor="agentSelector">매장</label>
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
              <label htmlFor="vendorSelector">납품업체</label>
              <CommonMultiSelect
                commonCodeType="vendors"
                selectedValues={searchForm.vendorIds}
                onSelectionChange={(values) =>
                  handleInputChange('vendorIds', values)
                }
                placeholder="납품업체를 선택하세요"
                className="olm-multi-select"
              />
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
              <label htmlFor="searchText">검색어</label>
              <div className="field-control">
                <input
                  id="searchText"
                  type="text"
                  className="olm-form-control"
                  value={searchForm.searchText}
                  onChange={(event) =>
                    handleInputChange('searchText', event.target.value)
                  }
                  placeholder="발주번호, 매장명, 납품업체명을 검색하세요"
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
                  className="olm-btn olm-btn-excel"
                  onClick={handleExportExcel}
                  disabled={isLoading || result.items.length === 0}
                >
                  <i className="fas fa-file-excel"></i>
                  엑셀다운로드
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

      <div className="olm-main-section ios-main-section">
        <h3>
          <i className="fas fa-exchange-alt"></i>
          입출고 현황 목록 ({formatNumber(result.totalCount)}건)
        </h3>

        <div className="olm-grid-summary">
          <span>총 건수: <strong>{formatNumber(result.totalCount)}</strong>건</span>
          <span>출고 수량: <strong>{formatNumber(totalOutQty)}</strong>개</span>
          <span>입고 수량: <strong>{formatNumber(totalInQty)}</strong>개</span>
          <span>미입/미출 합계: <strong>{formatNumber(totalPendingQty)}</strong>개</span>
          <span>평균 완료율: <strong>{String(averageProgress)}%</strong></span>
        </div>

        {errorMessage && (
          <div className="ios-error-banner" role="alert">
            <i className="fas fa-exclamation-triangle"></i>
            <span>{errorMessage}</span>
          </div>
        )}

        <div className="ios-table-container">
          {isLoading ? (
            <div className="ios-no-data-message">
              <i className="fas fa-spinner fa-spin"></i>
              <p>데이터를 불러오는 중입니다...</p>
            </div>
          ) : result.items.length === 0 ? (
            <div className="ios-no-data-message">
              <i className="fas fa-inbox"></i>
              <p>조건에 해당하는 입출고 데이터가 없습니다.</p>
            </div>
          ) : (
            <div className="ios-table-wrapper">
              <table className="ios-table">
                <thead>
                  <tr>
                    <th scope="col">발주번호</th>
                    <th scope="col">매장</th>
                    <th scope="col">납품업체</th>
                    <th scope="col">구분</th>
                    <th scope="col">출고/입고일</th>
                    <th scope="col">수량</th>
                    <th scope="col">상태</th>
                  </tr>
                </thead>
                <tbody>
                  {(() => {
                    // 발주번호별 그룹 인덱스 계산 (같은 발주번호끼리 같은 색상)
                    const orderGroupMap = new Map<string, number>();
                    let groupIndex = 0;
                    let prevOrderKey = '';
                    
                    result.items.forEach((item) => {
                      const orderKey = `${item.ORDER_D}-${item.ORDER_SEQU}`;
                      if (!orderGroupMap.has(orderKey)) {
                        // 이전 발주번호와 다르면 그룹 인덱스 증가
                        if (prevOrderKey !== '' && prevOrderKey !== orderKey) {
                          groupIndex++;
                        }
                        orderGroupMap.set(orderKey, groupIndex);
                        prevOrderKey = orderKey;
                      }
                    });

                    return result.items.map((item, index) => {
                    const rowKey = getRowKey(item, index);
                    const isExpanded = expandedRows.has(rowKey);
                    const detailItems = detailMap.get(rowKey) ?? [];
                    const isDetailLoading = detailLoadingRows.has(rowKey);
                    const detailErrorMessage = detailErrors.get(rowKey);
                    
                    // 발주번호 그룹 인덱스로 짝수/홀수 구분
                    const orderKey = `${item.ORDER_D}-${item.ORDER_SEQU}`;
                    const orderGroupIdx = orderGroupMap.get(orderKey) ?? 0;
                    const isEvenGroup = orderGroupIdx % 2 === 0;

                    return (
                      <Fragment key={rowKey}>
                        <tr
                          className={`ios-row-expandable${isExpanded ? ' is-expanded' : ''}${isEvenGroup ? ' ios-row-even-group' : ' ios-row-odd-group'}`}
                          onClick={() => handleToggleRow(item, index)}
                          role="button"
                          tabIndex={0}
                          onKeyDown={(event) => {
                            if (event.key === 'Enter' || event.key === ' ') {
                              event.preventDefault();
                              handleToggleRow(item, index);
                            }
                          }}
                          aria-expanded={isExpanded}
                        >
                          <td>
                            <div className="ios-cell-group">
                              <span className="ios-cell-primary">{item.SLIP_NO || item.ORDER_SEQU}</span>
                              <span className="ios-cell-secondary">{item.ORDER_D}</span>
                            </div>
                          </td>
                          <td>
                            <div className="ios-cell-group">
                              <span className="ios-cell-primary">{item.AGENT_NM}</span>
                              {item.AGENT_TEL && (
                                <span className="ios-cell-secondary">{item.AGENT_TEL}</span>
                              )}
                            </div>
                          </td>
                          <td>
                            <div className="ios-cell-group">
                              <span className="ios-cell-primary">{item.VENDOR_NM || '-'}</span>
                              {item.VENDOR_TEL && (
                                <span className="ios-cell-secondary">{item.VENDOR_TEL}</span>
                              )}
                            </div>
                          </td>
                          <td>
                            <span className={`ios-status-badge ${getStatusClass(item.IO_TYPE)}`}>
                              {item.IO_TYPE}
                            </span>
                          </td>
                          <td>
                            <div className="ios-cell-group">
                              <span className="ios-cell-primary">
                                {item.IO_TYPE === '출고' ? item.OUT_D : item.IN_D || '-'}
                              </span>
                            </div>
                          </td>
                          <td className="ios-numeric-cell">{formatNumber(item.TOTAL_ORDER_QTY ?? item.TOTAL_QTY ?? 0)}</td>
                          <td>
                            <span className={`ios-status-badge ${getStatusClass(item.IN_STATUS ?? item.STATUS ?? '')}`}>
                              {item.IN_STATUS ?? item.STATUS ?? '-'}
                            </span>
                          </td>
                        </tr>
                        {isExpanded && (
                          <tr className="ios-detail-row">
                            <td colSpan={7}>
                              <div className="ios-detail-grid">
                                <div className="ios-detail-section">
                                  <h4>발주 정보</h4>
                                  <ul>
                                    <li>
                                      <strong>발주 일자</strong>
                                      <span>{item.ORDER_D}</span>
                                    </li>
                                    <li>
                                      <strong>일련번호</strong>
                                      <span>{item.ORDER_SEQU}</span>
                                    </li>
                                  </ul>
                                </div>
                                <div className="ios-detail-section">
                                  <h4>매장 정보</h4>
                                  <ul>
                                    <li>
                                      <strong>매장명</strong>
                                      <span>{item.AGENT_NM}</span>
                                    </li>
                                    <li>
                                      <strong>매장 ID</strong>
                                      <span>{item.AGENT_ID}</span>
                                    </li>
                                  </ul>
                                </div>
                                <div className="ios-detail-section">
                                  <h4>납품업체 정보</h4>
                                  <ul>
                                    <li>
                                      <strong>업체명</strong>
                                      <span>{item.VENDOR_NM || '-'}</span>
                                    </li>
                                    {item.VENDOR_ID && (
                                      <li>
                                        <strong>업체 ID</strong>
                                        <span>{item.VENDOR_ID}</span>
                                      </li>
                                    )}
                                  </ul>
                                </div>
                                <div className="ios-detail-section">
                                  <h4>수량 정보</h4>
                                  <ul>
                                    <li>
                                      <strong>발주 수량</strong>
                                      <span>{formatNumber(item.TOTAL_ORDER_QTY ?? item.TOTAL_QTY ?? 0)}</span>
                                    </li>
                                    <li>
                                      <strong>출고 수량</strong>
                                      <span>{formatNumber(item.TOTAL_OUT_QTY ?? item.OUT_QTY ?? 0)}</span>
                                    </li>
                                    <li>
                                      <strong>입고 수량</strong>
                                      <span>{formatNumber(item.TOTAL_IN_QTY ?? item.IN_QTY ?? 0)}</span>
                                    </li>
                                    <li>
                                      <strong>미입고 수량</strong>
                                      <span>{formatNumber(item.PENDING_QTY ?? 0)}</span>
                                    </li>
                                    <li>
                                      <strong>입고율</strong>
                                      <span>{item.PROGRESS_RATE ?? 0}%</span>
                                    </li>
                                  </ul>
                                </div>
                              </div>

                              <div className="ios-detail-items-section">
                                <h4>품목 리스트</h4>
                                {isDetailLoading ? (
                                  <div className="ios-detail-items-placeholder">
                                    <i className="fas fa-spinner fa-spin" />
                                    <span>품목 정보를 불러오는 중입니다...</span>
                                  </div>
                                ) : detailErrorMessage ? (
                                  <div className="ios-detail-items-error">
                                    <i className="fas fa-exclamation-triangle" />
                                    <span>{detailErrorMessage}</span>
                                  </div>
                                ) : detailItems.length === 0 ? (
                                  <div className="ios-detail-items-placeholder">
                                    <i className="fas fa-inbox" />
                                    <span>표시할 품목 데이터가 없습니다.</span>
                                  </div>
                                ) : (
                                  <table className="ios-detail-items-table">
                                    <thead>
                                      <tr>
                                        <th scope="col">순번</th>
                                        <th scope="col">상품명</th>
                                        <th scope="col">발주</th>
                                        <th scope="col">출고</th>
                                        <th scope="col">입고</th>
                                        <th scope="col">단가</th>
                                        <th scope="col">금액</th>
                                        <th scope="col">출고일</th>
                                        <th scope="col">입고일</th>
                                      </tr>
                                    </thead>
                                    <tbody>
                                      {detailItems.map((detail) => {
                                        const key = `${detail.ORDER_D}-${detail.ORDER_SEQU}-${detail.ORDER_NO}`;

                                        return (
                                          <tr key={key}>
                                            <td>{detail.ORDER_NO}</td>
                                            <td>{detail.GOODS_NM || '-'}</td>
                                            <td className="ios-numeric-cell">
                                              {formatNumber(Number(detail.ORDER_QTY ?? 0))}
                                            </td>
                                            <td className="ios-numeric-cell">
                                              {formatNumber(Number(detail.OUT_QTY ?? 0))}
                                            </td>
                                            <td className="ios-numeric-cell">
                                              {formatNumber(Number(detail.IN_QTY ?? 0))}
                                            </td>
                                            <td className="ios-numeric-cell">
                                              {formatNumber(Number(detail.SOBIJA_DAN ?? 0))}
                                            </td>
                                            <td className="ios-numeric-cell">
                                              {formatNumber(Number(detail.SOBIJA_TOT ?? 0))}
                                            </td>
                                            <td>{detail.OUT_D || '-'}</td>
                                            <td>{detail.IN_D || '-'}</td>
                                          </tr>
                                        );
                                      })}
                                    </tbody>
                                  </table>
                                )}
                              </div>
                            </td>
                          </tr>
                        )}
                      </Fragment>
                    );
                  });
                  })()}
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
          className="ios-pagination"
        />
      </div>
    </div>
  );
};

export default InOutStatus;
