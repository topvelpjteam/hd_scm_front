import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '../store';
import Pagination from './Pagination';
import DateRangePicker from './common/DateRangePicker';
import CommonMultiSelect from './CommonMultiSelect';
import {
  OrderOutStatusDetailItem,
  OrderOutStatusItem,
  OrderOutStatusResponse,
  OrderOutStatusSearchParams,
  fetchOrderOutStatusDetails,
  searchOrderOutStatus,
} from '../services/orderOutStatusService';
import { getMenuIcon } from '../utils/menuUtils';
import './OrderListManagement.css';
import './orderOutStatus.css';

type SearchFormState = {
  orderDateFrom: string;
  orderDateTo: string;
  requireDateFrom: string;
  requireDateTo: string;
  searchText: string;
  unreceivedOnly: boolean;
  agentId: string;
  agentIds: string[];
  vendorId: string;
  vendorIds: string[];
  orderStatus: string[];
  pageNum: number;
  pageSize: number;
};

type OrderOutStatusResult = {
  items: OrderOutStatusItem[];
  totalCount: number;
  totalPages: number;
  pageNum: number;
  pageSize: number;
};

const OUT_STATUS_OPTIONS = [
  { value: '미출고', label: '미출고' },
  { value: '부분출고', label: '부분출고' },
  { value: '출고완료', label: '출고완료' },
];

const createDefaultDate = (offsetDays: number) => {
  const date = new Date();
  date.setDate(date.getDate() + offsetDays);
  return date.toISOString().slice(0, 10);
};

const normalizeSearchParams = (
  params: SearchFormState,
): OrderOutStatusSearchParams => {
  const normalized: OrderOutStatusSearchParams = {
    orderDateFrom: params.orderDateFrom || undefined,
    orderDateTo: params.orderDateTo || undefined,
    requireDateFrom: params.requireDateFrom || undefined,
    requireDateTo: params.requireDateTo || undefined,
    searchText: params.searchText.trim() || undefined,
    unreceivedOnly: params.unreceivedOnly,
    pageNum: params.pageNum,
    pageSize: params.pageSize,
  };

  if (params.agentId.trim()) {
    normalized.agentId = params.agentId.trim();
  }

  if (params.agentIds.length > 0) {
    normalized.agentIds = params.agentIds;
  }

  if (params.vendorId.trim()) {
    normalized.vendorId = params.vendorId.trim();
  }

  if (params.vendorIds.length > 0) {
    normalized.vendorIds = params.vendorIds;
  } else if (params.vendorId.trim()) {
    normalized.vendorIds = [params.vendorId.trim()];
  }

  if (params.orderStatus.length > 0) {
    normalized.orderStatus = params.orderStatus;
  }

  return normalized;
};

const OrderOutStatus: React.FC = () => {
  const { user } = useSelector((state: RootState) => state.auth);
  const { tabs, activeTabId } = useSelector((state: RootState) => state.tabs);

  const currentTab = useMemo(
    () => tabs.find((tab) => tab.id === activeTabId),
    [tabs, activeTabId],
  );

  const computeInitialForm = useCallback((): SearchFormState => {
    const defaultOrderFrom = createDefaultDate(-30);
    const defaultOrderTo = createDefaultDate(0);
    const isVendorUser = user?.roleId === 5 && user.agentId;
    const vendorId = isVendorUser ? String(user?.agentId ?? '') : '';

    return {
      orderDateFrom: defaultOrderFrom,
      orderDateTo: defaultOrderTo,
      requireDateFrom: '',
      requireDateTo: '',
      searchText: '',
      unreceivedOnly: false,
      agentId: '',
      agentIds: [],
      vendorId,
      vendorIds: vendorId ? [vendorId] : [],
      orderStatus: [],
      pageNum: 1,
      pageSize: 20,
    };
  }, [user?.agentId, user?.roleId]);

  const [searchForm, setSearchForm] = useState<SearchFormState>(() =>
    computeInitialForm(),
  );
  const [result, setResult] = useState<OrderOutStatusResult>({
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
  const vendorInitializedRef = useRef(false);
  const initialLoadRef = useRef(false);
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const [detailMap, setDetailMap] = useState<
    Map<string, OrderOutStatusDetailItem[]>
  >(new Map());
  const [detailLoadingRows, setDetailLoadingRows] = useState<Set<string>>(
    new Set(),
  );
  const [detailErrors, setDetailErrors] = useState<Map<string, string>>(
    new Map(),
  );

  const formatNumber = useCallback((value: number) => {
    return new Intl.NumberFormat('ko-KR').format(Number.isFinite(value) ? value : 0);
  }, []);

  const clampProgress = useCallback((progress: number) => {
    if (!Number.isFinite(progress)) return 0;
    return Math.max(0, Math.min(100, Number(progress)));
  }, []);

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
      const payload: OrderOutStatusSearchParams = {
        ...normalized,
        userRoleId: user.roleId,
        userAgentId: user.agentId ? String(user.agentId) : undefined,
      };

      try {
        const response: OrderOutStatusResponse = await searchOrderOutStatus(payload);

        if (!response.success) {
          setErrorMessage(response.message || '출고 현황을 불러오지 못했습니다.');
          setResult((prev) => ({
            ...prev,
            items: [],
            totalCount: 0,
            totalPages: 0,
          }));
          return;
        }

        // ✅ 백엔드 수치값을 숫자로 정규화
        const items = (response.items || []).map((item) => ({
          ...item,
          TOTAL_ORDER_QTY: Number(item.TOTAL_ORDER_QTY ?? 0),
          TOTAL_OUT_QTY: Number(item.TOTAL_OUT_QTY ?? 0),
          ITEM_COUNT: Number(item.ITEM_COUNT ?? 0),
          UN_SHIPPED_ITEM_COUNT: Number(item.UN_SHIPPED_ITEM_COUNT ?? 0),
          OUT_PROGRESS_RATE: Number(item.OUT_PROGRESS_RATE ?? 0),
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
        console.error('출고 현황 조회 실패:', error);
        setErrorMessage(
          error?.message || '출고 현황을 조회하는 중 문제가 발생했습니다.',
        );
      } finally {
        setIsLoading(false);
      }
    },
    [searchForm, user],
  );

  useEffect(() => {
    executeSearchRef.current = executeSearch;
  }, [executeSearch]);

  useEffect(() => {
    const resetState = computeInitialForm();
    setSearchForm(resetState);
    vendorInitializedRef.current = false;
    initialLoadRef.current = false;
    setExpandedRows(new Set());
    setDetailMap(new Map());
    setDetailErrors(new Map());
    setDetailLoadingRows(new Set());
  }, [computeInitialForm]);

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

  useEffect(() => {
    if (!user) {
      initialLoadRef.current = false;
      return;
    }

    if (user.roleId === 5 && user.agentId) {
      initialLoadRef.current = false;
      return;
    }

    if (initialLoadRef.current) {
      return;
    }

    initialLoadRef.current = true;
    executeSearchRef.current?.();
  }, [user]);

  useEffect(() => {
    if (user?.roleId === 5 && user.agentId) {
      const vendorId = String(user.agentId);
      setSearchForm((prev) => {
        if (
          prev.vendorId === vendorId &&
          prev.vendorIds.length === 1 &&
          prev.vendorIds[0] === vendorId &&
          prev.pageNum === 1
        ) {
          return prev;
        }

        return {
          ...prev,
          vendorId,
          vendorIds: [vendorId],
          pageNum: 1,
        };
      });

      if (!vendorInitializedRef.current) {
        vendorInitializedRef.current = true;
        executeSearchRef.current?.({
          vendorId,
          vendorIds: [vendorId],
          pageNum: 1,
          pageSize: searchForm.pageSize,
        });
      }
    } else {
      vendorInitializedRef.current = false;
      initialLoadRef.current = false;
    }
  }, [searchForm.pageSize, user?.agentId, user?.roleId]);

  const summary = useMemo(() => {
    if (!result.items.length) {
      return {
        totalOrderQty: 0,
        totalOutQty: 0,
        totalUnshippedItems: 0,
        completionRate: 0,
      };
    }

    const totals = result.items.reduce(
      (acc, item) => {
        acc.totalOrderQty += Number(item.TOTAL_ORDER_QTY ?? 0);
        acc.totalOutQty += Number(item.TOTAL_OUT_QTY ?? 0);
        acc.totalUnshippedItems += Number(item.UN_SHIPPED_ITEM_COUNT ?? 0);
        return acc;
      },
      { totalOrderQty: 0, totalOutQty: 0, totalUnshippedItems: 0 },
    );

    const completionRate =
      totals.totalOrderQty === 0
        ? 0
        : Math.round((totals.totalOutQty / totals.totalOrderQty) * 1000) / 10;

    return {
      totalOrderQty: totals.totalOrderQty,
      totalOutQty: totals.totalOutQty,
      totalUnshippedItems: totals.totalUnshippedItems,
      completionRate,
    };
  }, [result.items]);

  const handleReset = useCallback(() => {
    const resetState = computeInitialForm();
    setSearchForm(resetState);

    if (user?.roleId === 5 && user.agentId) {
      vendorInitializedRef.current = true;
    } else {
      initialLoadRef.current = true;
    }

    setExpandedRows(new Set());
    setDetailMap(new Map());
    setDetailErrors(new Map());
    setDetailLoadingRows(new Set());

    executeSearchRef.current?.({
      ...resetState,
    });
  }, [computeInitialForm, user?.agentId, user?.roleId]);

  const getRowKey = useCallback(
    (item: OrderOutStatusItem) => `${item.ORDER_D}-${item.ORDER_SEQU}-${item.VENDOR_ID}`,
    [],
  );

  const loadRowDetails = useCallback(
    async (item: OrderOutStatusItem) => {
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
        const response = await fetchOrderOutStatusDetails({
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
          IN_TOT_QTY: Number(detail.IN_TOT_QTY ?? 0),
        }));

        setDetailMap((prev) => {
          const next = new Map(prev);
          next.set(rowKey, normalizedItems);
          return next;
        });
      } catch (error: any) {
        console.error('출고 현황 상세 조회 실패:', error);
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
    [detailMap, detailLoadingRows, getRowKey],
  );

  const handleToggleRow = useCallback(
    (item: OrderOutStatusItem) => {
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

  const getStatusClass = useCallback((status: string) => {
    switch (status) {
      case '출고완료':
        return 'status-complete';
      case '부분출고':
        return 'status-partial';
      default:
        return 'status-pending';
    }
  }, []);

  const { totalOrderQty, totalOutQty, totalUnshippedItems, completionRate } = summary;
  const isVendorUser = user?.roleId === 5;

  return (
    <div className="olm-container order-out-status-page">
      <div className="top-section">
        <h1 className="page-title">
          {currentTab?.menuIcon
            ? React.createElement(getMenuIcon(currentTab.menuIcon), { size: 14 })
            : <i className="fas fa-truck"></i>}
          출고 현황
        </h1>

        <form className="search-conditions" onSubmit={handleSubmit}>
          <div className="search-row">
            <div className="search-item">
              <label htmlFor="orderDateRange">발주일자</label>
              <DateRangePicker
                startDate={searchForm.orderDateFrom}
                endDate={searchForm.orderDateTo}
                onStartDateChange={(value) =>
                  handleInputChange('orderDateFrom', value)
                }
                onEndDateChange={(value) => handleInputChange('orderDateTo', value)}
                placeholder="발주일자를 선택하세요"
                className="olm-date-range-picker"
              />
            </div>

            <div className="search-item">
              <label htmlFor="requireDateRange">납기일자</label>
              <DateRangePicker
                startDate={searchForm.requireDateFrom}
                endDate={searchForm.requireDateTo}
                onStartDateChange={(value) =>
                  handleInputChange('requireDateFrom', value)
                }
                onEndDateChange={(value) =>
                  handleInputChange('requireDateTo', value)
                }
                placeholder="납기일자를 선택하세요"
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
              {/* <span className="search-hint">미선택 시 전체 매장을 조회합니다.</span> */}
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
                disabled={isVendorUser}
              />
              {/* <span className="search-hint">
                {isVendorUser
                  ? '거래업체 권한은 본인 업체만 조회 가능합니다.'
                  : '미선택 시 전체 납품업체를 조회합니다.'}
              </span> */}
            </div>
          </div>

          <div className="search-row">
            <div className="search-item">
              <label htmlFor="orderStatus">출고상태</label>
              <CommonMultiSelect
                options={OUT_STATUS_OPTIONS}
                selectedValues={searchForm.orderStatus}
                onSelectionChange={(values) =>
                  handleInputChange('orderStatus', values)
                }
                placeholder="출고 상태를 선택하세요"
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
              <label htmlFor="unreceivedOnly">미출고 필터</label>
              <div className="field-control checkbox-control">
                <label className="checkbox-label">
                  <input
                    id="unreceivedOnly"
                    type="checkbox"
                    checked={searchForm.unreceivedOnly}
                    onChange={(event) =>
                      handleInputChange('unreceivedOnly', event.target.checked)
                    }
                  />
                  <span>미출고·부분출고만 보기</span>
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
          <i className="fas fa-truck"></i>
          출고 현황 목록 ({formatNumber(result.totalCount)}건)
        </h3>

        <div className="olm-grid-summary">
          <span>총 건수: {formatNumber(result.totalCount)}건</span>
          <span>발주수량: {formatNumber(totalOrderQty)}개</span>
          <span>출고수량: {formatNumber(totalOutQty)}개</span>
          <span>미출고 품목: {formatNumber(totalUnshippedItems)}개</span>
          <span>평균 진행률: {completionRate.toFixed(1)}%</span>
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
              <p>조건에 해당하는 출고 데이터가 없습니다.</p>
            </div>
          ) : (
            <div className="order-out-status-table-wrapper">
              <table className="order-out-status-table">
                <thead>
                  <tr>
                    <th scope="col">발주번호</th>
                    <th scope="col">매장</th>
                    <th scope="col">납품업체</th>
                    <th scope="col">출고일(최초/최종)</th>
                    <th scope="col">발주수량</th>
                    <th scope="col">출고수량</th>
                    <th scope="col">미출고 품목</th>
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
                    return (
                      <React.Fragment key={rowKey}>
                        <tr
                          className={isExpanded ? 'row-expandable is-expanded' : 'row-expandable'}
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
                              <span className="cell-secondary">D+{item.ORDER_SEQU}</span>
                            </div>
                          </td>
                          <td>
                            <div className="cell-group">
                              <span className="cell-primary">{item.STORE_NM}</span>
                              {item.STORE_TEL && (
                                <span className="cell-secondary">{item.STORE_TEL}</span>
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
                              <span className="cell-secondary">{item.LAST_OUT_D || '-'}</span>
                            </div>
                          </td>
                          <td className="numeric-cell">{formatNumber(item.TOTAL_ORDER_QTY)}</td>
                          <td className="numeric-cell">{formatNumber(item.TOTAL_OUT_QTY)}</td>
                          <td className="numeric-cell">{formatNumber(item.UN_SHIPPED_ITEM_COUNT)}</td>
                          <td>
                            <div className="progress-indicator">
                              <div className="progress-track">
                                <span
                                  className="progress-fill"
                                  style={{
                                    width: `${clampProgress(item.OUT_PROGRESS_RATE)}%`,
                                  }}
                                />
                              </div>
                              <span className="progress-value">
                                {clampProgress(item.OUT_PROGRESS_RATE)}%
                              </span>
                            </div>
                          </td>
                          <td>
                            <span className={`status-badge ${getStatusClass(item.OUT_STATUS)}`}>
                              {item.OUT_STATUS}
                            </span>
                          </td>
                        </tr>
                        {isExpanded && (
                          <tr className="order-out-status-detail-row">
                            <td colSpan={9}>
                              <div className="detail-grid">
                                <div className="detail-section">
                                  <h4>매장 정보</h4>
                                  <ul>
                                    <li>
                                      <strong>매장 ID</strong>
                                      <span>{item.AGENT_ID}</span>
                                    </li>
                                    <li>
                                      <strong>매장 주소</strong>
                                      <span>{item.STORE_ADDR || '-'}</span>
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
                                      <strong>업체 주소</strong>
                                      <span>{item.VENDOR_ADDR || '-'}</span>
                                    </li>
                                  </ul>
                                </div>
                                <div className="detail-section">
                                  <h4>출고 현황</h4>
                                  <ul>
                                    <li>
                                      <strong>총 발주수량</strong>
                                      <span>{formatNumber(item.TOTAL_ORDER_QTY)} 개</span>
                                    </li>
                                    <li>
                                      <strong>총 출고수량</strong>
                                      <span>{formatNumber(item.TOTAL_OUT_QTY)} 개</span>
                                    </li>
                                    <li>
                                      <strong>미출고 품목</strong>
                                      <span>{formatNumber(item.UN_SHIPPED_ITEM_COUNT)} 개</span>
                                    </li>
                                    <li>
                                      <strong>출고 진행률</strong>
                                      <span>{clampProgress(item.OUT_PROGRESS_RATE)}%</span>
                                    </li>
                                  </ul>
                                </div>
                                <div className="detail-section">
                                  <h4>출고 일자</h4>
                                  <ul>
                                    <li>
                                      <strong>최초 출고일</strong>
                                      <span>{item.FIRST_OUT_D || '-'}</span>
                                    </li>
                                    <li>
                                      <strong>최종 출고일</strong>
                                      <span>{item.LAST_OUT_D || '-'}</span>
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
                                        <th scope="col">브랜드</th>
                                        <th scope="col">발주 수량</th>
                                        <th scope="col">출고 수량</th>
                                        <th scope="col">미출 수량</th>
                                        <th scope="col">출고일</th>
                                        <th scope="col">입고일</th>
                                      </tr>
                                    </thead>
                                    <tbody>
                                      {detailItems.map((detail) => {
                                        const remainingQty = Math.max(
                                          Number(detail.ORDER_QTY ?? 0) - Number(detail.OUT_QTY ?? 0),
                                          0,
                                        );
                                        return (
                                          <tr key={`${detail.ORDER_D}-${detail.ORDER_SEQU}-${detail.ORDER_NO}`}>
                                            <td>{detail.ORDER_NO}</td>
                                            <td>{detail.GOODS_ID_BRAND || detail.GOODS_ID || '-'}</td>
                                            <td>{detail.GOODS_NM || '-'}</td>
                                            <td>{detail.BRAND_NM || '-'}</td>
                                            <td className="numeric-cell">
                                              {formatNumber(Number(detail.ORDER_QTY ?? 0))}
                                            </td>
                                            <td className="numeric-cell">
                                              {formatNumber(Number(detail.OUT_QTY ?? 0))}
                                            </td>
                                            <td className="numeric-cell">
                                              {formatNumber(remainingQty)}
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
                      </React.Fragment>
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

export default OrderOutStatus;
