import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '../store/store';
import {
  clearAgentStockError,
  loadAgentStock,
  selectAgentStockColumns,
  selectAgentStockError,
  selectAgentStockLastUpdated,
  selectAgentStockLoading,
  selectAgentStockRows,
  selectAgentStockSearchParams,
  setAgentStockSearchParams,
} from '../store/agentStockSlice';
import CommonMultiSelect from './CommonMultiSelect';
import { AgentStockSearchParams } from '../services/agentStockService';
import { commonCodeService, CommonCodeOption } from '../services/commonCodeService';
import { getMenuIcon } from '../utils/menuUtils';
import AgentStockProductModal, { SelectedGood } from './agent-stock/AgentStockProductModal';
import Pagination from './Pagination';
import { exportAgentStockToExcel } from '../utils/exportAgentStockExcel';
import './AgentStock.css';

interface AgentStockFormState {
  targetMonth: string;
  brandIds: string[];
  goodsGbns: string[];
  mtypeList: string[];
  stypeList: string[];
  channelGbns: string[];
  storeIds: string[];
}

const formatMonthForInput = (yyyymm?: string) => {
  if (!yyyymm || yyyymm.length < 6) return '';
  return `${yyyymm.slice(0, 4)}-${yyyymm.slice(4, 6)}`;
};

const parseMonthInput = (value: string) => (value ? value.replace(/[^0-9]/g, '').slice(0, 6) : undefined);

const getTodayYyyymm = () => {
  const today = new Date();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  return `${today.getFullYear()}${month}`;
};

const AgentStock: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();

  const columns = useSelector(selectAgentStockColumns);
  const rows = useSelector(selectAgentStockRows);
  const searchParams = useSelector(selectAgentStockSearchParams);
  const isLoading = useSelector(selectAgentStockLoading);
  const error = useSelector(selectAgentStockError);
  const lastUpdated = useSelector(selectAgentStockLastUpdated);
  const { tabs, activeTabId } = useSelector((state: RootState) => state.tabs);
  const currentTab = tabs.find((tab) => tab.id === activeTabId);
  const { user } = useSelector((state: RootState) => state.auth);

  const [formState, setFormState] = useState<AgentStockFormState>(() => ({
    targetMonth: formatMonthForInput(searchParams.targetMonth),
    brandIds: [...(searchParams.brandIds || [])],
    goodsGbns: [...(searchParams.goodsGbns || [])],
    mtypeList: [...(searchParams.mtypeList || [])],
    stypeList: [...(searchParams.stypeList || [])],
    channelGbns: [...(searchParams.channelGbns || [])],
    storeIds: [...(searchParams.storeIds || [])],
  }));
  const [selectedGoods, setSelectedGoods] = useState<SelectedGood[]>(() =>
    (searchParams.goodsIds || []).map((goodsId) => ({
      goodsId,
      goodsNm: goodsId,
    })),
  );
  const [isProductModalOpen, setProductModalOpen] = useState(false);
  const [vendorBrandOptions, setVendorBrandOptions] = useState<CommonCodeOption[]>([]);
  const lastSearchKeyRef = useRef<string | null>(null);
  const previousLoginAgentRef = useRef<string | null>(null);
  const [paginationState, setPaginationState] = useState<{ currentPage: number; pageSize: number }>({
    currentPage: 1,
    pageSize: 20,
  });

  useEffect(() => {
    setFormState({
      targetMonth: formatMonthForInput(searchParams.targetMonth),
      brandIds: [...(searchParams.brandIds || [])],
      goodsGbns: [...(searchParams.goodsGbns || [])],
      mtypeList: [...(searchParams.mtypeList || [])],
      stypeList: [...(searchParams.stypeList || [])],
      channelGbns: [...(searchParams.channelGbns || [])],
      storeIds: [...(searchParams.storeIds || [])],
    });

    setSelectedGoods((prev) => {
      const goodsIds = searchParams.goodsIds || [];
      if (goodsIds.length === 0) {
        return [];
      }
      return goodsIds.map((goodsId) => {
        const existing = prev.find((item) => item.goodsId === goodsId);
        return existing ?? { goodsId, goodsNm: goodsId };
      });
    });
    setPaginationState((prev) => ({
      ...prev,
      currentPage: 1,
    }));
  }, [searchParams]);

  useEffect(() => {
    if (user?.roleId !== 5) {
      previousLoginAgentRef.current = null;
      return;
    }

    const trimmedAgentId = user.agentId?.trim() ?? '';

    if (previousLoginAgentRef.current === trimmedAgentId) {
      return;
    }
    previousLoginAgentRef.current = trimmedAgentId;

    setFormState((prev) => ({
      ...prev,
      brandIds: [],
    }));
    setSelectedGoods([]);

    const payload: AgentStockSearchParams = {
      targetMonth: searchParams.targetMonth,
      brandIds: [],
      goodsGbns: [...(searchParams.goodsGbns || [])],
      mtypeList: [...(searchParams.mtypeList || [])],
      stypeList: [...(searchParams.stypeList || [])],
      goodsIds: [],
      channelGbns: [...(searchParams.channelGbns || [])],
      storeIds: [...(searchParams.storeIds || [])],
      loginAgentId: trimmedAgentId,
    };

    const payloadKey = JSON.stringify(payload);
    lastSearchKeyRef.current = payloadKey;

    dispatch(setAgentStockSearchParams(payload));
    dispatch(loadAgentStock(payload));
  }, [user?.roleId, user?.agentId, dispatch, searchParams]);

  useEffect(() => {
    let cancelled = false;

    const loadVendorBrands = async () => {
      if (user?.roleId !== 5) {
        setVendorBrandOptions([]);
        return;
      }

      const trimmedAgentId = user.agentId?.trim();
      if (!trimmedAgentId) {
        setVendorBrandOptions([]);
        return;
      }

      setVendorBrandOptions([]);

      try {
        const brandOptions = await commonCodeService.getBrands(trimmedAgentId);
        if (cancelled) {
          return;
        }

        const normalizedOptions = brandOptions.map((option) => ({
          value: option.value,
          label:
            option.label && option.label.trim().length > 0 ? option.label : option.value,
        }));

        setVendorBrandOptions(normalizedOptions);
      } catch (error) {
        console.error('매장재고 취급 브랜드 조회 실패:', error);
        if (!cancelled) {
          setVendorBrandOptions([]);
        }
      }
    };

    loadVendorBrands();

    return () => {
      cancelled = true;
    };
  }, [user?.roleId, user?.agentId]);

  useEffect(() => {
    const autoSearchPayload: AgentStockSearchParams = {
      ...searchParams,
      loginAgentId: user?.roleId === 5 ? user.agentId?.trim() ?? '' : '',
    };
    const payloadKey = JSON.stringify(autoSearchPayload);
    if (lastSearchKeyRef.current === payloadKey) {
      return;
    }
    lastSearchKeyRef.current = payloadKey;
    dispatch(loadAgentStock(autoSearchPayload));
  }, [dispatch, searchParams, user?.roleId, user?.agentId]);

  const handleSearch = useCallback(() => {
    const payload: AgentStockSearchParams = {
      targetMonth: parseMonthInput(formState.targetMonth),
      brandIds: formState.brandIds,
      goodsGbns: formState.goodsGbns,
      mtypeList: formState.mtypeList,
      stypeList: formState.stypeList,
      goodsIds: selectedGoods.map((item) => item.goodsId),
      channelGbns: formState.channelGbns,
      storeIds: formState.storeIds,
      loginAgentId: user?.roleId === 5 ? user.agentId?.trim() ?? '' : '',
    };

    dispatch(setAgentStockSearchParams(payload));
    const payloadKey = JSON.stringify(payload);
    lastSearchKeyRef.current = payloadKey;
    dispatch(loadAgentStock(payload));
    setPaginationState((prev) => ({
      ...prev,
      currentPage: 1,
    }));
  }, [dispatch, formState, selectedGoods, user?.roleId, user?.agentId]);

  const handleReset = useCallback(() => {
    const defaultMonth = formatMonthForInput(getTodayYyyymm());

    setFormState({
      targetMonth: defaultMonth,
      brandIds: [],
      goodsGbns: [],
      mtypeList: [],
      stypeList: [],
      channelGbns: [],
      storeIds: [],
    });
    setSelectedGoods([]);
    const payload: AgentStockSearchParams = {
      targetMonth: parseMonthInput(defaultMonth),
      brandIds: [],
      goodsGbns: [],
      mtypeList: [],
      stypeList: [],
      goodsIds: [],
      channelGbns: [],
      storeIds: [],
      loginAgentId: user?.roleId === 5 ? user.agentId?.trim() ?? '' : '',
    };
    dispatch(setAgentStockSearchParams(payload));
    const payloadKey = JSON.stringify(payload);
    lastSearchKeyRef.current = payloadKey;
    dispatch(loadAgentStock(payload));
    setPaginationState((prev) => ({
      ...prev,
      currentPage: 1,
    }));
  }, [dispatch, user?.roleId, user?.agentId]);

  const handleMonthChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setFormState((prev) => ({
      ...prev,
      targetMonth: event.target.value,
    }));
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      handleSearch();
    }
  };

  const handleClearError = () => {
    dispatch(clearAgentStockError());
  };

  const handleOpenProductModal = useCallback(() => {
    setProductModalOpen(true);
  }, []);

  const handleConfirmProductSelection = useCallback((goods: SelectedGood[]) => {
    setSelectedGoods(goods);
    setProductModalOpen(false);
  }, []);

  const handleRemoveSelectedGoods = useCallback((goodsId: string) => {
    setSelectedGoods((prev) => prev.filter((item) => item.goodsId !== goodsId));
  }, []);

  const handleClearSelectedGoods = useCallback(() => {
    setSelectedGoods([]);
  }, []);

  const formatValue = useCallback((value: unknown): React.ReactNode => {
    if (value === null || value === undefined) return '-';
    if (typeof value === 'number') {
      return value.toLocaleString('ko-KR');
    }
    if (typeof value === 'string') {
      if (value !== '' && !Number.isNaN(Number(value))) {
        const numericValue = Number(value);
        if (Number.isFinite(numericValue)) {
          return numericValue.toLocaleString('ko-KR');
        }
      }
      return value;
    }
    if (value instanceof Date) {
      return value.toLocaleString('ko-KR');
    }
    if (typeof value === 'boolean') {
      return value ? 'Y' : 'N';
    }
    return String(value);
  }, []);

  const storeColumnCount = useMemo(
    () => columns.filter((column) => column.storeColumn).length,
    [columns],
  );

  const totalRowCount = rows.length;

  const handleExportExcel = useCallback(() => {
    if (columns.length === 0 || rows.length === 0) {
      window.alert('엑셀로 내보낼 데이터가 없습니다.');
      return;
    }

    const resolvedTargetMonthDigits =
      parseMonthInput(formState.targetMonth) ??
      searchParams.targetMonth ??
      getTodayYyyymm();

    const resolvedTargetMonthLabel =
      formatMonthForInput(resolvedTargetMonthDigits) ||
      formState.targetMonth ||
      formatMonthForInput(getTodayYyyymm());

    const fileName = `agent-stock-${resolvedTargetMonthDigits || getTodayYyyymm()}.xlsx`;

    try {
      exportAgentStockToExcel({
        columns,
        rows,
        targetMonthLabel: resolvedTargetMonthLabel,
        generatedAt: new Date(),
        totalRowCount,
        storeColumnCount,
        fileName,
      });
    } catch (error) {
      console.error('매장 재고 엑셀 내보내기 실패:', error);
      window.alert('엑셀 파일 생성 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.');
    }
  }, [
    columns,
    rows,
    formState.targetMonth,
    searchParams.targetMonth,
    totalRowCount,
    storeColumnCount,
  ]);

  const totalPages = Math.max(1, Math.ceil(totalRowCount / paginationState.pageSize));

  useEffect(() => {
    setPaginationState((prev) => ({
      currentPage: Math.min(prev.currentPage, totalPages),
      pageSize: prev.pageSize,
    }));
  }, [totalPages]);

  const paginatedRows = useMemo(() => {
    const startIndex = (paginationState.currentPage - 1) * paginationState.pageSize;
    const endIndex = startIndex + paginationState.pageSize;
    return rows.slice(startIndex, endIndex);
  }, [rows, paginationState]);

  const handlePageChange = useCallback((page: number, pageSize: number) => {
    setPaginationState({
      currentPage: page,
      pageSize,
    });
  }, []);

  const MenuIcon = currentTab?.menuIcon ? getMenuIcon(currentTab.menuIcon) : null;

  return (
    <div className="olm-container agent-stock-page">
      <div className="top-section">
        <h1 className="page-title">
          {MenuIcon
            ? React.createElement(MenuIcon, { size: 14 })
            : <i className="fas fa-warehouse" />}
          매장 재고
        </h1>

        <div className="search-conditions" onKeyDown={handleKeyDown}>
          <div className="search-row">
            <div className="search-item">
              <label htmlFor="filter-month">기준월</label>
              <input
                id="filter-month"
                type="month"
                value={formState.targetMonth}
                onChange={handleMonthChange}
              />
            </div>
            <div className="search-item">
              <label>채널구분</label>
              <CommonMultiSelect
                commonCodeType="channGbn"
                selectedValues={formState.channelGbns}
                onSelectionChange={(values) =>
                  setFormState((prev) => ({
                    ...prev,
                    channelGbns: values,
                  }))
                }
                placeholder="채널을 선택하세요"
                className="olm-multi-select"
              />
            </div>
            <div className="search-item">
              <label>매장</label>
              <CommonMultiSelect
                commonCodeType="stores"
                selectedValues={formState.storeIds}
                onSelectionChange={(values) =>
                  setFormState((prev) => ({
                    ...prev,
                    storeIds: values,
                  }))
                }
                placeholder="매장을 선택하세요"
                className="olm-multi-select"
              />
            </div>
            <div className="search-item">
              <label>브랜드</label>
              <CommonMultiSelect
                options={user?.roleId === 5 ? vendorBrandOptions : undefined}
                commonCodeType={user?.roleId === 5 ? undefined : 'brands'}
                selectedValues={formState.brandIds}
                agentId={user?.roleId === 5 ? user.agentId?.trim() : undefined}
                onSelectionChange={(values) =>
                  setFormState((prev) => ({
                    ...prev,
                    brandIds: values,
                  }))
                }
                placeholder="브랜드를 선택하세요"
                className="olm-multi-select"
              />
            </div>
          </div>

          <div className="search-row">
            <div className="search-item">
              <label>상품구분</label>
              <CommonMultiSelect
                commonCodeType="goodsGbn"
                selectedValues={formState.goodsGbns}
                onSelectionChange={(values) =>
                  setFormState((prev) => ({
                    ...prev,
                    goodsGbns: values,
                  }))
                }
                placeholder="상품구분을 선택하세요"
                className="olm-multi-select"
              />
            </div>
            <div className="search-item">
              <label>중분류</label>
              <CommonMultiSelect
                commonCodeType="mtypes"
                selectedValues={formState.mtypeList}
                onSelectionChange={(values) =>
                  setFormState((prev) => ({
                    ...prev,
                    mtypeList: values,
                  }))
                }
                placeholder="중분류를 선택하세요"
                className="olm-multi-select"
              />
            </div>
            <div className="search-item">
              <label>소분류</label>
              <CommonMultiSelect
                commonCodeType="stypes"
                selectedValues={formState.stypeList}
                onSelectionChange={(values) =>
                  setFormState((prev) => ({
                    ...prev,
                    stypeList: values,
                  }))
                }
                placeholder="소분류를 선택하세요"
                className="olm-multi-select"
              />
            </div>
          </div>

          <div className="search-row">
            <div className="search-item">
              <label>상품코드</label>
              <div className="product-selector-actions">
                <button
                  type="button"
                  className="olm-btn olm-btn-info"
                  onClick={handleOpenProductModal}
                >
                  <i className="fas fa-tag" /> 상품 선택
                </button>
              </div>
            </div>
          </div>

      <div className="selected-goods">
        {selectedGoods.length === 0 ? (
          <span className="selected-goods-empty">선택된 상품이 없습니다.</span>
        ) : (
          <div className="selected-goods-scroll">
            <div className="selected-goods-toolbar">
              <span className="selected-goods-count">
                선택 {selectedGoods.length.toLocaleString()}개
              </span>
              <button
                type="button"
                className="olm-btn olm-btn-secondary olm-btn-sm"
                onClick={handleClearSelectedGoods}
              >
                <i className="fas fa-trash-alt" /> 전체 제거
              </button>
            </div>
            <div className="selected-goods-grid">
              {selectedGoods.map((item) => (
                <span className="selected-good-chip" key={item.goodsId}>
                  <strong>{item.goodsNm}</strong>
                  <span className="selected-good-code">{item.goodsId}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveSelectedGoods(item.goodsId)}
                    aria-label={`${item.goodsNm} 제거`}
                  >
                    <i className="fas fa-times" />
                  </button>
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
        </div>

        <div className="action-buttons">
          <div className="right-buttons">
            <button
              type="button"
              className="olm-btn olm-btn-secondary"
              onClick={handleReset}
              disabled={isLoading}
            >
              <i className="fas fa-undo" /> 초기화
            </button>
            <button
              type="button"
              className="olm-btn olm-btn-primary"
              onClick={handleSearch}
              disabled={isLoading}
            >
              <i className="fas fa-search" /> 조회
            </button>
            <button
              type="button"
              className="olm-btn olm-btn-excel"
              onClick={handleExportExcel}
              disabled={isLoading || rows.length === 0 || columns.length === 0}
            >
              <i className="fas fa-file-excel" /> 엑셀
            </button>
          </div>
        </div>
      </div>

      {error && (
        <div className="olm-error-banner" role="alert">
          <i className="fas fa-exclamation-triangle" />
          <span>{error}</span>
          <button
            type="button"
            className="olm-btn olm-btn-secondary olm-btn-sm"
            onClick={handleClearError}
          >
            닫기
          </button>
        </div>
      )}

      <div className="olm-main-section agent-stock-main">
        <h3>
          <i className="fas fa-warehouse" />
          실시간 매장 재고 ({totalRowCount.toLocaleString()}건)
        </h3>

        <div className="olm-grid-summary">
          <span>총 건수: {totalRowCount.toLocaleString()}건</span>
          <span>매장 컬럼: {storeColumnCount.toLocaleString()}개</span>
          {lastUpdated && (
            <span>업데이트: {new Date(lastUpdated).toLocaleString()}</span>
          )}
        </div>

        <div className="agent-stock-table-container">
          {columns.length === 0 ? (
            <div className="no-data-message">
              <i className="fas fa-inbox" />
              <p>{isLoading ? '재고 데이터를 불러오는 중입니다...' : '조회 가능한 매장 재고 데이터가 없습니다.'}</p>
            </div>
          ) : rows.length === 0 ? (
            <div className="no-data-message">
              <i className="fas fa-inbox" />
              <p>{isLoading ? '재고 데이터를 불러오는 중입니다...' : '조회된 재고 데이터가 없습니다.'}</p>
            </div>
          ) : (
            <div className="agent-stock-table-wrapper">
              <table className="agent-stock-table">
                <thead>
                  <tr>
                    {columns.map((column) => {
                      const headerClassNames = [
                        column.totalColumn ? 'is-total' : '',
                        column.storeColumn || column.totalColumn ? 'is-numeric' : 'is-text',
                      ]
                        .filter(Boolean)
                        .join(' ');

                      return (
                        <th key={column.key} className={headerClassNames}>
                          {column.label}
                        </th>
                      );
                    })}
                  </tr>
                </thead>
                <tbody>
                  {paginatedRows.map((row, rowIndex) => {
                    // 총계 행은 브랜드와 상품명이 모두 '총계'로 내려오므로 이를 기준으로 배경색을 적용
                    const isGrandTotalRow =
                      row['상품명'] === '총계';
                    const rowClassName = isGrandTotalRow ? 'grand-total-row' : undefined;
                    return (
                      <tr
                        key={`agent-stock-row-${paginationState.currentPage}-${rowIndex}`}
                        className={rowClassName}
                      >
                        {columns.map((column) => {
                          const isNumericColumn = column.storeColumn || column.totalColumn;
                          const cellClassNames = [
                            isNumericColumn ? 'is-numeric' : 'is-text',
                            column.totalColumn ? 'is-total-column' : '',
                            isGrandTotalRow ? 'is-grand-total-cell' : '',
                          ]
                            .filter(Boolean)
                            .join(' ');
                          return (
                            <td
                              key={`${paginationState.currentPage}-${rowIndex}-${column.key}`}
                              className={cellClassNames}
                            >
                              {formatValue(row[column.key])}
                            </td>
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

        <Pagination
          totalCount={totalRowCount}
          currentPage={paginationState.currentPage}
          pageSize={paginationState.pageSize}
          onPageChange={handlePageChange}
          pageSizeOptions={[10, 20, 50, 100]}
          showPageSizeSelector
          showPageInfo
          className="olm-pagination agent-stock-pagination"
        />
      </div>

      <AgentStockProductModal
        isOpen={isProductModalOpen}
        onClose={() => setProductModalOpen(false)}
        initialSelectedGoods={selectedGoods}
        onConfirm={handleConfirmProductSelection}
        filters={{
          goodsGbns: formState.goodsGbns,
          brandIds: formState.brandIds,
          mtypeList: formState.mtypeList,
          availableBrandIds:
            user?.roleId === 5 ? vendorBrandOptions.map((option) => option.value) : undefined,
          loginAgentId: user?.roleId === 5 ? user.agentId?.trim() ?? undefined : undefined,
        }}
      />
    </div>
  );
};

export default AgentStock;

