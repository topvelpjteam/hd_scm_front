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
  StoreInventoryStatusDetailItem,
  StoreInventoryStatusDetailResponse,
  StoreInventoryStatusItem,
  StoreInventoryStatusResponse,
  StoreInventoryStatusSearchParams,
  fetchStoreInventoryStatusDetails,
  searchStoreInventoryStatus,
} from '../services/storeInventoryStatusService';
import { getMenuIcon } from '../utils/menuUtils';
import './OrderListManagement.css';
import './orderOutStatus.css';
import './storeInventoryStatus.css';

// ✅ 검색 폼 상태 타입 정의 (입고 현황 전용)
type SearchFormState = {
  inboundDateFrom: string;
  inboundDateTo: string;
  outboundDateFrom: string;
  outboundDateTo: string;
  searchText: string;
  pendingOnly: boolean;
  agentIds: string[];
  vendorIds: string[];
  brandIds: string[];
  inboundStatus: string[];
  pageNum: number;
  pageSize: number;
};

// ✅ 조회 결과 상태 타입
type StoreInventoryStatusResult = {
  items: StoreInventoryStatusItem[];
  totalCount: number;
  totalPages: number;
  pageNum: number;
  pageSize: number;
};

// ✅ 입고 상태 옵션 리스트
const IN_STATUS_OPTIONS = [
  { value: '입고대기', label: '입고대기' },
  { value: '부분입고', label: '부분입고' },
  { value: '입고완료', label: '입고완료' },
];

// ✅ 기본 날짜 생성 헬퍼 (offsetDays 만큼 이동)
const createDefaultDate = (offsetDays: number) => {
  const date = new Date();
  date.setDate(date.getDate() + offsetDays);
  return date.toISOString().slice(0, 10);
};

// ✅ 검색 파라미터 정규화 함수
const normalizeSearchParams = (
  params: SearchFormState,
): StoreInventoryStatusSearchParams => {
  const normalized: StoreInventoryStatusSearchParams = {
    inboundDateFrom: params.inboundDateFrom || undefined,
    inboundDateTo: params.inboundDateTo || undefined,
    outboundDateFrom: params.outboundDateFrom || undefined,
    outboundDateTo: params.outboundDateTo || undefined,
    searchText: params.searchText.trim() || undefined,
    pendingOnly: params.pendingOnly,
    pageNum: params.pageNum,
    pageSize: params.pageSize,
  };

  if (params.agentIds.length > 0) {
    normalized.agentIds = params.agentIds;
  }

  if (params.vendorIds.length > 0) {
    normalized.vendorIds = params.vendorIds;
  }

  if (params.brandIds.length > 0) {
    normalized.brandIds = params.brandIds;
  }

  if (params.inboundStatus.length > 0) {
    normalized.inboundStatus = params.inboundStatus;
  }

  return normalized;
};

const StoreInventoryStatus: React.FC = () => {
  const { user } = useSelector((state: RootState) => state.auth);
  const { tabs, activeTabId } = useSelector((state: RootState) => state.tabs);

  // ✅ 현재 탭 정보 파악 (아이콘 표시용)
  const currentTab = useMemo(
    () => tabs.find((tab) => tab.id === activeTabId),
    [tabs, activeTabId],
  );

  // ✅ 초기 검색 폼 상태 계산
  const computeInitialForm = useCallback((): SearchFormState => {
    const defaultInboundFrom = createDefaultDate(-30);
    const defaultInboundTo = createDefaultDate(0);

    return {
      inboundDateFrom: defaultInboundFrom,
      inboundDateTo: defaultInboundTo,
      outboundDateFrom: '',
      outboundDateTo: '',
      searchText: '',
      pendingOnly: false,
      agentIds: [],
      vendorIds: [],
      brandIds: [],
      inboundStatus: [],
      pageNum: 1,
      pageSize: 20,
    };
  }, []);

  const [searchForm, setSearchForm] = useState<SearchFormState>(() =>
    computeInitialForm(),
  );
  const [result, setResult] = useState<StoreInventoryStatusResult>({
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
    Map<string, StoreInventoryStatusDetailItem[]>
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

  // ✅ 진행률 클램프 헬퍼
  const clampProgress = useCallback((progress: number) => {
    if (!Number.isFinite(progress)) return 0;
    return Math.max(0, Math.min(100, Number(progress)));
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
      const payload: StoreInventoryStatusSearchParams = {
        ...normalized,
        userRoleId: user.roleId,
        userAgentId: user.agentId ? String(user.agentId) : undefined,
      };

      try {
        const response: StoreInventoryStatusResponse =
          await searchStoreInventoryStatus(payload);

        if (!response.success) {
          setErrorMessage(response.message || '입고 현황을 불러오지 못했습니다.');
          setResult((prev) => ({
            ...prev,
            items: [],
            totalCount: 0,
            totalPages: 0,
          }));
          return;
        }

        // ✅ 수치 데이터 정규화 (NaN 방지)
        const items = (response.items || []).map((item) => ({
          ...item,
          TOTAL_ORDER_QTY: Number(item.TOTAL_ORDER_QTY ?? 0),
          TOTAL_OUT_QTY: Number(item.TOTAL_OUT_QTY ?? 0),
          TOTAL_IN_GOOD_QTY: Number(item.TOTAL_IN_GOOD_QTY ?? 0),
          TOTAL_IN_BAD_QTY: Number(item.TOTAL_IN_BAD_QTY ?? 0),
          TOTAL_IN_QTY: Number(item.TOTAL_IN_QTY ?? 0),
          PENDING_QTY: Number(item.PENDING_QTY ?? 0),
          IN_PROGRESS_RATE: Number(item.IN_PROGRESS_RATE ?? 0),
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
        console.error('입고 현황 조회 실패:', error);
        setErrorMessage(
          error?.message || '입고 현황을 조회하는 중 문제가 발생했습니다.',
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
        totalOrderQty: 0,
        totalOutQty: 0,
        totalInQty: 0,
        totalPendingQty: 0,
        averageProgress: 0,
      };
    }

    const totals = result.items.reduce(
      (acc, item) => {
        acc.totalOrderQty += Number(item.TOTAL_ORDER_QTY ?? 0);
        acc.totalOutQty += Number(item.TOTAL_OUT_QTY ?? 0);
        acc.totalInQty += Number(item.TOTAL_IN_QTY ?? 0);
        acc.totalPendingQty += Number(item.PENDING_QTY ?? 0);
        acc.progressSum += clampProgress(item.IN_PROGRESS_RATE);
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
  }, [clampProgress, result.items]);

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

  // ✅ 행 고유 키 생성
  const getRowKey = useCallback(
    (item: StoreInventoryStatusItem) =>
      `${item.ORDER_D}-${item.ORDER_SEQU}-${item.VENDOR_ID}`,
    [],
  );

  // ✅ 상세 조회 실행
  const loadRowDetails = useCallback(
    async (item: StoreInventoryStatusItem) => {
      const rowKey = getRowKey(item);
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
        const response: StoreInventoryStatusDetailResponse =
          await fetchStoreInventoryStatusDetails({
            orderDate: item.ORDER_D,
            orderSequ: item.ORDER_SEQU,
            vendorId: item.VENDOR_ID,
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
          IN_GOOD_QTY: Number(detail.IN_GOOD_QTY ?? 0),
          IN_BAD_QTY: Number(detail.IN_BAD_QTY ?? 0),
          IN_TOT_QTY: Number(detail.IN_TOT_QTY ?? 0),
        }));

        setDetailMap((prev) => {
          const next = new Map(prev);
          next.set(rowKey, normalizedItems);
          return next;
        });
      } catch (error: any) {
        console.error('입고 현황 상세 조회 실패:', error);
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
    (item: StoreInventoryStatusItem) => {
      const rowKey = getRowKey(item);
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
        void loadRowDetails(item);
      }
    },
    [expandedRows, getRowKey, loadRowDetails],
  );

  // ✅ 상태 배지 색상 결정
  const getStatusClass = useCallback((status: string) => {
    switch (status) {
      case '입고완료':
        return 'status-complete';
      case '부분입고':
        return 'status-partial';
      default:
        return 'status-pending';
    }
  }, []);

  const {
    totalOrderQty,
    totalOutQty,
    totalInQty,
    totalPendingQty,
    averageProgress,
  } = summary;

  return (
    <div className="olm-container order-in-status-page">
      <div className="top-section">
        <h1 className="page-title">
          {currentTab?.menuIcon
            ? React.createElement(getMenuIcon(currentTab.menuIcon), { size: 14 })
            : <i className="fas fa-warehouse"></i>}
          입고 현황
        </h1>

        <form className="search-conditions" onSubmit={handleSubmit}>
          <div className="search-row">
            <div className="search-item">
              <label htmlFor="inboundDateRange">입고일자</label>
              <DateRangePicker
                startDate={searchForm.inboundDateFrom}
                endDate={searchForm.inboundDateTo}
                onStartDateChange={(value) =>
                  handleInputChange('inboundDateFrom', value)
                }
                onEndDateChange={(value) =>
                  handleInputChange('inboundDateTo', value)
                }
                placeholder="입고일자를 선택하세요"
                className="olm-date-range-picker"
              />
            </div>

            <div className="search-item">
              <label htmlFor="outboundDateRange">출고일자</label>
              <DateRangePicker
                startDate={searchForm.outboundDateFrom}
                endDate={searchForm.outboundDateTo}
                onStartDateChange={(value) =>
                  handleInputChange('outboundDateFrom', value)
                }
                onEndDateChange={(value) =>
                  handleInputChange('outboundDateTo', value)
                }
                placeholder="출고일자를 선택하세요"
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
              <label htmlFor="inboundStatus">입고상태</label>
              <CommonMultiSelect
                options={IN_STATUS_OPTIONS}
                selectedValues={searchForm.inboundStatus}
                onSelectionChange={(values) =>
                  handleInputChange('inboundStatus', values)
                }
                placeholder="입고 상태를 선택하세요"
                className="olm-multi-select"
                showLoading={false}
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

            <div className="search-item">
              <label htmlFor="pendingOnly">미입고 필터</label>
              <div className="field-control checkbox-control">
                <label className="checkbox-label">
                  <input
                    id="pendingOnly"
                    type="checkbox"
                    checked={searchForm.pendingOnly}
                    onChange={(event) =>
                      handleInputChange('pendingOnly', event.target.checked)
                    }
                  />
                  <span>입고대기·부분입고만 보기</span>
                </label>
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
          <i className="fas fa-warehouse"></i>
          입고 현황 목록 ({formatNumber(result.totalCount)}건)
        </h3>

        <div className="olm-grid-summary">
          <span>총 건수: {formatNumber(result.totalCount)}건</span>
          <span>발주수량: {formatNumber(totalOrderQty)}개</span>
          <span>출고수량: {formatNumber(totalOutQty)}개</span>
          <span>입고수량: {formatNumber(totalInQty)}개</span>
          <span>미입고 수량: {formatNumber(totalPendingQty)}개</span>
          <span>평균 진행률: {averageProgress.toFixed(1)}%</span>
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
              <p>조건에 해당하는 입고 데이터가 없습니다.</p>
            </div>
          ) : (
            <div className="order-out-status-table-wrapper">
              <table className="order-out-status-table">
                <thead>
                  <tr>
                    <th scope="col">발주번호</th>
                    <th scope="col">매장</th>
                    <th scope="col">납품업체</th>
                    <th scope="col">출고/입고일</th>
                    <th scope="col">발주수량</th>
                    <th scope="col">출고수량</th>
                    <th scope="col">입고수량</th>
                    <th scope="col">미입고 수량</th>
                    <th scope="col">진행률</th>
                    <th scope="col">상태</th>
                  </tr>
                </thead>
                <tbody>
                  {result.items.map((item) => {
                    const rowKey = getRowKey(item);
                    const isExpanded = expandedRows.has(rowKey);
                    const detailItems = detailMap.get(rowKey) ?? [];
                    const isDetailLoading = detailLoadingRows.has(rowKey);
                    const detailErrorMessage = detailErrors.get(rowKey);

                    const progressValue = clampProgress(item.IN_PROGRESS_RATE);
                    const inboundQty = Number(item.TOTAL_IN_QTY ?? 0);

                    return (
                      <Fragment key={rowKey}>
                        <tr
                          className={
                            isExpanded ? 'row-expandable is-expanded' : 'row-expandable'
                          }
                          onClick={() => handleToggleRow(item)}
                          role="button"
                          tabIndex={0}
                          onKeyDown={(event) => {
                            if (event.key === 'Enter' || event.key === ' ') {
                              event.preventDefault();
                              handleToggleRow(item);
                            }
                          }}
                          aria-expanded={isExpanded}
                        >
                          <td>
                            <div className="cell-group">
                              <span className="cell-primary">{item.SLIP_NO}</span>
                              <span className="cell-secondary">{item.ORDER_D}</span>
                            </div>
                          </td>
                          <td>
                            <div className="cell-group">
                              <span className="cell-primary">{item.AGENT_NM}</span>
                              {item.AGENT_TEL && (
                                <span className="cell-secondary">{item.AGENT_TEL}</span>
                              )}
                            </div>
                          </td>
                          <td>
                            <div className="cell-group">
                              <span className="cell-primary">{item.VENDOR_NM}</span>
                              {item.VENDOR_TEL && (
                                <span className="cell-secondary">{item.VENDOR_TEL}</span>
                              )}
                            </div>
                          </td>
                          <td>
                            <div className="cell-group">
                              <span className="cell-primary">{item.FIRST_OUT_D || '-'}</span>
                              <span className="cell-secondary">{item.FIRST_IN_D || '-'}</span>
                            </div>
                          </td>
                          <td className="numeric-cell">{formatNumber(item.TOTAL_ORDER_QTY)}</td>
                          <td className="numeric-cell">{formatNumber(item.TOTAL_OUT_QTY)}</td>
                          <td className="numeric-cell">{formatNumber(inboundQty)}</td>
                          <td className="numeric-cell">{formatNumber(item.PENDING_QTY)}</td>
                          <td>
                            <div className="progress-indicator">
                              <div className="progress-track">
                                <span
                                  className="progress-fill"
                                  style={{ width: `${progressValue}%` }}
                                />
                              </div>
                              <span className="progress-value">{progressValue}%</span>
                            </div>
                          </td>
                          <td>
                            <span className={`status-badge ${getStatusClass(item.IN_STATUS)}`}>
                              {item.IN_STATUS}
                            </span>
                          </td>
                        </tr>
                        {isExpanded && (
                          <tr className="order-out-status-detail-row">
                            <td colSpan={10}>
                              <div className="detail-grid">
                                <div className="detail-section">
                                  <h4>매장 정보</h4>
                                  <ul>
                                    <li>
                                      <strong>매장 ID</strong>
                                      <span>{item.AGENT_ID}</span>
                                    </li>
                                    <li>
                                      <strong>입고 예정일</strong>
                                      <span>{item.EST_D || '-'}</span>
                                    </li>
                                  </ul>
                                </div>
                                <div className="detail-section">
                                  <h4>납품업체 정보</h4>
                                  <ul>
                                    <li>
                                      <strong>업체 ID</strong>
                                      <span>{item.VENDOR_ID}</span>
                                    </li>
                                    <li>
                                      <strong>브랜드</strong>
                                      <span>{item.BRAND_NM || '-'}</span>
                                    </li>
                                  </ul>
                                </div>
                                <div className="detail-section">
                                  <h4>수량 현황</h4>
                                  <ul>
                                    <li>
                                      <strong>발주 수량</strong>
                                      <span>{formatNumber(item.TOTAL_ORDER_QTY)} 개</span>
                                    </li>
                                    <li>
                                      <strong>출고 수량</strong>
                                      <span>{formatNumber(item.TOTAL_OUT_QTY)} 개</span>
                                    </li>
                                    <li>
                                      <strong>입고 수량</strong>
                                      <span>{formatNumber(inboundQty)} 개</span>
                                    </li>
                                    <li>
                                      <strong>미입고 수량</strong>
                                      <span>{formatNumber(item.PENDING_QTY)} 개</span>
                                    </li>
                                  </ul>
                                </div>
                                <div className="detail-section">
                                  <h4>입고 일자</h4>
                                  <ul>
                                    <li>
                                      <strong>최초 입고일</strong>
                                      <span>{item.FIRST_IN_D || '-'}</span>
                                    </li>
                                    <li>
                                      <strong>최종 입고일</strong>
                                      <span>{item.LAST_IN_D || '-'}</span>
                                    </li>
                                  </ul>
                                </div>
                              </div>

                              <div className="detail-items-section">
                                <h4>품목 리스트</h4>
                                {isDetailLoading ? (
                                  <div className="detail-items-placeholder">
                                    <i className="fas fa-spinner fa-spin" />
                                    <span>품목 정보를 불러오는 중입니다...</span>
                                  </div>
                                ) : detailErrorMessage ? (
                                  <div className="detail-items-error">
                                    <i className="fas fa-exclamation-triangle" />
                                    <span>{detailErrorMessage}</span>
                                  </div>
                                ) : detailItems.length === 0 ? (
                                  <div className="detail-items-placeholder">
                                    <i className="fas fa-inbox" />
                                    <span>표시할 품목 데이터가 없습니다.</span>
                                  </div>
                                ) : (
                                  <table className="detail-items-table">
                                    <thead>
                                      <tr>
                                        <th scope="col">순번</th>
                                        <th scope="col">상품 코드</th>
                                        <th scope="col">상품명</th>
                                        <th scope="col">상품구분</th>
                                        <th scope="col">브랜드</th>
                                        <th scope="col">발주 수량</th>
                                        <th scope="col">출고 수량</th>
                                        <th scope="col">입고 양호</th>
                                        <th scope="col">입고 불량</th>
                                        <th scope="col">총 입고</th>
                                        <th scope="col">출고일</th>
                                        <th scope="col">입고일</th>
                                      </tr>
                                    </thead>
                                    <tbody>
                                      {detailItems.map((detail) => {
                                        const totalInQty = Number(detail.IN_TOT_QTY ?? 0);
                                        const key = `${detail.ORDER_D}-${detail.ORDER_SEQU}-${detail.ORDER_NO}`;

                                        return (
                                          <tr key={key}>
                                            <td>{detail.ORDER_NO}</td>
                                            <td>{detail.GOODS_ID_BRAND || detail.GOODS_ID || '-'}</td>
                                            <td>{detail.GOODS_NM || '-'}</td>
                                            <td>{detail.GOODS_GBN_NM || '-'}</td>
                                            <td>{detail.BRAND_NM || '-'}</td>
                                            <td className="numeric-cell">
                                              {formatNumber(Number(detail.ORDER_QTY ?? 0))}
                                            </td>
                                            <td className="numeric-cell">
                                              {formatNumber(Number(detail.OUT_QTY ?? 0))}
                                            </td>
                                            <td className="numeric-cell">
                                              {formatNumber(Number(detail.IN_GOOD_QTY ?? 0))}
                                            </td>
                                            <td className="numeric-cell">
                                              {formatNumber(Number(detail.IN_BAD_QTY ?? 0))}
                                            </td>
                                            <td className="numeric-cell">
                                              {formatNumber(totalInQty)}
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
                  })}
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

export default StoreInventoryStatus;
