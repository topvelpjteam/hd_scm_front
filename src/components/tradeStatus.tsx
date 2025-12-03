/**
 * 거래 내역 컴포넌트
 * 거래 이력, 이메일 전송 관리, 거래 상태 관리 기능을 제공합니다.
 * OrderListManagement의 코드를 완전히 복사하여 독립적으로 구현합니다.
 */

import React, { useState, useEffect, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '../store/store';
import { getMenuIcon } from '../utils/menuUtils';
import DateRangePicker from './common/DateRangePicker';
import CommonMultiSelect from './CommonMultiSelect';
import Pagination from './Pagination';

// Redux 관련 - tradeStatusSlice에서 import
import {
  searchTradeList,
  getTradeCancelReasons,
  cancelTrade,
  setSearchParams,
  setPage,
  setPageSize,
  setSelectedTrades,
  setShowCancelModal,
  clearError,
  saveState,
} from '../store/tradeStatusSlice';
import {
  selectSearchParams,
  selectTradeList,
  selectSelectedTrades,
  selectError,
  selectPagination,
  selectModalStates,
} from '../store/tradeStatusSlice';

// 타입 정의 - 슬라이스의 TradeCancelParams와 일치
interface TradeCancelParams {
  orderD: string;
  orderSequ: number;
  cancelReason: string;
  cancelDetail?: string;
  userId: string;
}

// 날짜 유틸리티 함수
const getDefaultDateRange = () => {
  const today = new Date();
  const thirtyDaysAgo = new Date(today);
  thirtyDaysAgo.setDate(today.getDate() - 120);
  
  const thirtyDaysLater = new Date(today);
  thirtyDaysLater.setDate(today.getDate() + 30);
  
  return {
    from: thirtyDaysAgo.toISOString().split('T')[0],
    to: thirtyDaysLater.toISOString().split('T')[0]
  };
};

// 스타일
import './tradeStatus.css';

const formatCurrency = (amount: number): string => {
  if (!amount) return '0';
  return new Intl.NumberFormat('ko-KR').format(amount);
};

const formatNumber = (num: number): string => {
  if (!num) return '0';
  return new Intl.NumberFormat('ko-KR').format(num);
};

const TradeStatus: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  
  // Redux 상태
  const searchParams = useSelector(selectSearchParams) || {};
  const tradeList = useSelector(selectTradeList) || [];
  const selectedTrades = useSelector(selectSelectedTrades) || [];
  const error = useSelector(selectError);
  const pagination = useSelector(selectPagination) || { pageNum: 1, pageSize: 20, totalCount: 0, totalPages: 1 };
  const modalStates = useSelector(selectModalStates) || {};
  
  const { tabs, activeTabId } = useSelector((state: RootState) => state.tabs);
  const currentTab = tabs.find(tab => tab.id === activeTabId);
  
  const defaultDateRange = getDefaultDateRange();
  
  const [searchForm, setSearchForm] = useState<any>(() => {
    const defaultForm = {
      tradeDateFrom: defaultDateRange.from,
      tradeDateTo: defaultDateRange.to,
      requireDateFrom: '',
      requireDateTo: '',
      searchText: '',
      unreceivedOnly: false,
      agentId: '',
      vendorId: '',
      emailStatus: [],
      tradeStatus: [],
      pageSize: 20,
      pageNum: 1,
      sortColumn: 'tradeD',
      sortDirection: 'DESC',
    };
    
    const cleanSearchParams = { ...searchParams };
    if (cleanSearchParams.searchText === 'admin') {
      cleanSearchParams.searchText = '';
    }
    
    return { ...defaultForm, ...cleanSearchParams };
  });
  
  const [collapsedCards, setCollapsedCards] = useState<Set<string>>(new Set());
  const [allCollapsed, setAllCollapsed] = useState(true);
  const [cancelForm, setCancelForm] = useState<TradeCancelParams>({
    orderD: '',
    orderSequ: 0,
    cancelReason: '',
    cancelDetail: '',
    userId: '',
  });

  useEffect(() => {
    const newCollapsedCards = new Set(tradeList.map((trade: any, index) => 
      `${trade.TRADE_D || 'unknown'}-${trade.TRADE_SEQU || index}-${trade.VENDOR_ID || 'unknown'}`
    ));
    setCollapsedCards(newCollapsedCards);
  }, [tradeList]);

  useEffect(() => {
    dispatch(getTradeCancelReasons());
    handleSearch();
  }, [dispatch]);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      dispatch(saveState());
    }, 500);
    return () => clearTimeout(timeoutId);
  }, [searchParams, pagination.pageNum, pagination.pageSize, dispatch]);

  const handleSearch = useCallback(() => {
    const mergedParams = { ...searchForm, ...searchParams, pageNum: 1 };
    setSearchForm((prev: any) => ({ ...prev, pageNum: 1 }));
    dispatch(setPage(1));

    const normalizedParams = normalizeSearchParams(mergedParams);
    dispatch(searchTradeList(normalizedParams));
  }, [dispatch, searchForm, searchParams]);

  const handleSearchFormChange = (field: string, value: any) => {
    setSearchForm((prev: any) => {
      const next = { ...prev, [field]: value };
      if (field !== 'pageNum') next.pageNum = 1;
      return next;
    });

    const updates: Record<string, any> = { [field]: value };
    if (field !== 'pageNum') {
      updates.pageNum = 1;
      dispatch(setPage(1));
    }
    dispatch(setSearchParams(updates));
  };

  const handleResetSearch = () => {
    const currentDefaultDateRange = getDefaultDateRange();
    const resetForm = {
      tradeDateFrom: currentDefaultDateRange.from,
      tradeDateTo: currentDefaultDateRange.to,
      requireDateFrom: '',
      requireDateTo: '',
      searchText: '',
      unreceivedOnly: false,
      agentId: '',
      agentIds: [],
      vendorId: '',
      vendorIds: [],
      emailStatus: [],
      tradeStatus: [],
      pageSize: 20,
      pageNum: 1,
      sortColumn: 'tradeD',
      sortDirection: 'DESC' as const,
    };
    setSearchForm(resetForm);
    dispatch(setSearchParams(resetForm as any));
    dispatch(setPageSize(20));
    dispatch(setPage(1));
  };

  const handleRowSelect = (tradeId: string, isMainRow: boolean) => {
    if (!isMainRow) return;
    const isSelected = selectedTrades.includes(tradeId);
    if (isSelected) {
      dispatch(setSelectedTrades(selectedTrades.filter(id => id !== tradeId)));
    } else {
      dispatch(setSelectedTrades([...selectedTrades, tradeId]));
    }
  };

  const toggleCardCollapse = (tradeId: string) => {
    const newCollapsed = new Set(collapsedCards);
    if (newCollapsed.has(tradeId)) {
      newCollapsed.delete(tradeId);
    } else {
      newCollapsed.add(tradeId);
    }
    setCollapsedCards(newCollapsed);
  };

  const collapseAllCards = () => {
    const allTradeIds = tradeList.map((trade: any, index: number) => 
      `${trade.TRADE_D || 'unknown'}-${trade.TRADE_SEQU || index}-${trade.VENDOR_ID || 'unknown'}`
    );
    setCollapsedCards(new Set(allTradeIds));
    setAllCollapsed(true);
  };

  const expandAllCards = () => {
    setCollapsedCards(new Set());
    setAllCollapsed(false);
  };

  const renderStatusBadge = (status: string) => {
    const statusClassMap: Record<string, string> = {
      '주문접수': 'ts-status-pending',
      '진행중': 'ts-status-progress',
      '완료': 'ts-status-completed',
      '취소됨': 'ts-status-cancelled',
    };
    return (
      <span className={`ts-status-badge ${statusClassMap[status] || 'ts-status-default'}`}>
        {status}
      </span>
    );
  };

  if (error) {
    return (
      <div className="ts-container">
        <div style={{padding: '20px', textAlign: 'center', color: '#dc3545', backgroundColor: '#f8d7da', border: '1px solid #f5c6cb', borderRadius: '4px', margin: '20px'}}>
          <h3>오류가 발생했습니다</h3>
          <p>{error}</p>
          <button className="ts-btn ts-btn-primary" onClick={() => dispatch(clearError())}>다시 시도</button>
        </div>
      </div>
    );
  }
  
  return (
    <div className="ts-container">
      <div className="ts-top-section">
        <h1 className="ts-page-title">
          {currentTab?.menuIcon ? React.createElement(getMenuIcon(currentTab.menuIcon), { size: 16 }) : <i className="fas fa-list"></i>}
          거래 내역
        </h1>
        
        <div className="ts-search-conditions">
          <div className="ts-search-row">
            <div className="ts-search-item">
              <label>거래일자:</label>
              <DateRangePicker
                startDate={searchForm.tradeDateFrom || ''}
                endDate={searchForm.tradeDateTo || ''}
                onStartDateChange={(date) => handleSearchFormChange('tradeDateFrom', date)}
                onEndDateChange={(date) => handleSearchFormChange('tradeDateTo', date)}
                placeholder="거래일자 범위를 선택하세요"
              />
            </div>
            <div className="ts-search-item">
              <label>매장:</label>
              <CommonMultiSelect
                commonCodeType="stores"
                selectedValues={searchForm.agentIds || []}
                onSelectionChange={(values) => handleSearchFormChange('agentIds', values)}
                placeholder="매장을 선택하세요"
              />
            </div>
            <div className="ts-search-item">
              <label>거래처:</label>
              <CommonMultiSelect
                commonCodeType="vendors"
                selectedValues={searchForm.vendorIds || []}
                onSelectionChange={(values) => handleSearchFormChange('vendorIds', values)}
                placeholder="거래처를 선택하세요"
              />
            </div>
            <div className="ts-search-item">
              <label>거래상태:</label>
              <CommonMultiSelect
                options={[
                  { value: '주문접수', label: '주문접수' },
                  { value: '진행중', label: '진행중' },
                  { value: '완료', label: '완료' },
                  { value: '취소됨', label: '취소됨' },
                ]}
                selectedValues={searchForm.tradeStatus || []}
                onSelectionChange={(values) => handleSearchFormChange('tradeStatus', values)}
                placeholder="거래상태를 선택하세요"
              />
            </div>
          </div>
          <div className="ts-search-row">
            <div className="ts-search-item">
              <label>키워드:</label>
              <input
                type="text"
                className="ts-form-control"
                placeholder="거래번호, 매장명, 거래처명 검색"
                value={searchForm.searchText || ''}
                onChange={(e) => handleSearchFormChange('searchText', e.target.value)}
              />
            </div>
            <div className="ts-search-item checkbox">
              <label>
                <input type="checkbox" checked={searchForm.unreceivedOnly || false} onChange={(e) => handleSearchFormChange('unreceivedOnly', e.target.checked)} />
                미완료자료만
              </label>
            </div>
          </div>
        </div>
        
        <div className="ts-action-buttons">
          <button className="ts-btn ts-btn-secondary" onClick={handleResetSearch}><i className="fas fa-undo"></i> 초기화</button>
          <button className="ts-btn ts-btn-primary" onClick={handleSearch}><i className="fas fa-search"></i> 조회</button>
        </div>
      </div>
      
      <div className="ts-main-section">
        <h3><i className="fas fa-list"></i> 거래 리스트 ({tradeList.length}건)</h3>
        
        <div className="ts-grid-summary">
          <span>선택된 건수: {selectedTrades.length}건</span>
          <span>총 건수: {formatNumber(tradeList.length)}건</span>
          <span>페이지: {pagination.pageNum}/{pagination.totalPages}</span>
          <button className="ts-btn-collapse" onClick={collapseAllCards} disabled={allCollapsed}><i className="fas fa-chevron-up"></i> 전체 접기</button>
          <button className="ts-btn-expand" onClick={expandAllCards} disabled={!allCollapsed && collapsedCards.size === 0}><i className="fas fa-chevron-down"></i> 전체 펼치기</button>
        </div>
        
        <div className="ts-trade-list-container">
          {tradeList.length === 0 ? (
            <div className="ts-no-data"><i className="fas fa-inbox"></i> <p>조회된 거래 데이터가 없습니다.</p></div>
          ) : (
            <div className="ts-trade-list">
              {tradeList.map((trade: any, index: number) => {
                const tradeId = `${trade.TRADE_D || 'unknown'}-${trade.TRADE_SEQU || index}-${trade.VENDOR_ID || 'unknown'}`;
                return (
                  <div key={tradeId} id={`trade-${tradeId}`} className={`ts-trade-item ${selectedTrades.includes(tradeId) ? 'selected' : ''} ${!collapsedCards.has(tradeId) ? 'expanded' : ''}`}>
                    <div className="ts-trade-header" onClick={() => toggleCardCollapse(tradeId)}>
                      <input type="checkbox" checked={selectedTrades.includes(tradeId)} onChange={(e) => { e.stopPropagation(); handleRowSelect(tradeId, true); }} onClick={(e) => e.stopPropagation()} />
                      <span className="ts-trade-no">{trade.SLIP_NO || 'N/A'}</span>
                      {renderStatusBadge(trade.TRADE_STATUS || '미정')}
                      <span className="ts-vendor">{trade.VENDOR_NM || '미정'}</span>
                      <span className="ts-store">{trade.STORE_NM || '미정'}</span>
                      <span className="ts-amount">{formatCurrency(trade.TOTAL_AMOUNT || 0)}원</span>
                      <span className="ts-qty">{formatNumber(trade.TOTAL_QTY || 0)}개</span>
                      <button className="ts-toggle-btn" onClick={(e) => { e.stopPropagation(); toggleCardCollapse(tradeId); }}>
                        <i className={`fas fa-chevron-${collapsedCards.has(tradeId) ? 'right' : 'down'}`}></i>
                      </button>
                    </div>
                    {!collapsedCards.has(tradeId) && (
                      <div className="ts-trade-details">
                        <div className="ts-detail-section">
                          <h4><i className="fas fa-building"></i> 거래처</h4>
                          <p><strong>{trade.VENDOR_NM}</strong> ({trade.VENDOR_ID})</p>
                          <p>{trade.VENDOR_EMAIL || 'N/A'}</p>
                        </div>
                        <div className="ts-detail-section">
                          <h4><i className="fas fa-store"></i> 매장</h4>
                          <p><strong>{trade.STORE_NM}</strong></p>
                          <p>{trade.STORE_ADDR || '미정'}</p>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
        
        <Pagination
          totalCount={pagination.totalCount}
          currentPage={pagination.pageNum}
          pageSize={pagination.pageSize}
          onPageChange={(page: number, pageSize: number) => {
            const isPageSizeChanged = pageSize !== searchParams.pageSize;
            const nextPage = isPageSizeChanged ? 1 : page;
            const mergedParams = { ...searchForm, ...searchParams, pageNum: nextPage, pageSize };
            const normalizedParams = normalizeSearchParams(mergedParams);
            setSearchForm((prev: any) => ({ ...prev, pageNum: nextPage, pageSize }));
            if (isPageSizeChanged) {
              dispatch(setPageSize(pageSize));
              dispatch(setPage(1));
            } else {
              dispatch(setPage(page));
            }
            dispatch(searchTradeList(normalizedParams));
          }}
          pageSizeOptions={[10, 20, 50, 100]}
          showPageSizeSelector={true}
          showPageInfo={true}
        />
      </div>
      
      {modalStates.showCancelModal && (
        <div className="ts-modal-overlay">
          <div className="ts-modal">
            <div className="ts-modal-header"><h3>거래 취소</h3></div>
            <div className="ts-modal-body">
              <label>취소 사유:</label>
              <select className="ts-form-control" value={cancelForm.cancelReason || ''} onChange={(e) => setCancelForm(prev => ({ ...prev, cancelReason: e.target.value }))}>
                <option value="">선택해주세요</option>
                <option value="CUSTOMER_REQUEST">고객 요청</option>
                <option value="INVENTORY_SHORTAGE">재고 부족</option>
                <option value="OTHER">기타</option>
              </select>
              <label>상세 사유:</label>
              <textarea className="ts-form-control" value={cancelForm.cancelDetail || ''} onChange={(e) => setCancelForm(prev => ({ ...prev, cancelDetail: e.target.value }))} rows={3} />
            </div>
            <div className="ts-modal-footer">
              <button className="ts-btn ts-btn-secondary" onClick={() => dispatch(setShowCancelModal(false))}>취소</button>
              <button className="ts-btn ts-btn-primary" onClick={() => dispatch(cancelTrade(cancelForm))}>확인</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const normalizeSearchParams = (rawParams: Record<string, any>) => {
  const normalized = { ...rawParams };
  if (!normalized.agentId) delete normalized.agentId;
  if (!normalized.vendorId) delete normalized.vendorId;
  if (!Array.isArray(normalized.tradeStatus) || normalized.tradeStatus.length === 0) delete normalized.tradeStatus;
  if (!Array.isArray(normalized.emailStatus) || normalized.emailStatus.length === 0) delete normalized.emailStatus;
  if (!Array.isArray(normalized.agentIds) || normalized.agentIds.length === 0) delete normalized.agentIds;
  if (!Array.isArray(normalized.vendorIds) || normalized.vendorIds.length === 0) delete normalized.vendorIds;
  if (!normalized.searchText) delete normalized.searchText;
  return normalized;
};

export default TradeStatus;
