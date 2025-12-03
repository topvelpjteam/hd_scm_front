import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '../store/store';
import { Search, RefreshCw } from 'lucide-react';
import { 
  customerJourneyService, 
  CustomerJourneyResponse
} from '../services/customerJourneyService';
import CommonMultiSelect from './CommonMultiSelect';
import { getMenuIcon } from '../utils/menuUtils';
import './CustomerJourneyAnalysis.css';
import './OrderListManagement.css';
import './orderOutStatus.css';

/**
 * 고객 구매 여정 분석 컴포넌트
 * CRM 분석 - 라이프사이클, 구매빈도, 첫구매후 재구매, 마일리지, 상위고객
 */
const CustomerJourneyAnalysis: React.FC = () => {
  const { tabs, activeTabId } = useSelector((state: RootState) => state.tabs);

  const currentTab = useMemo(
    () => tabs.find((tab) => tab.id === activeTabId),
    [tabs, activeTabId],
  );

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<CustomerJourneyResponse | null>(null);
  
  // 검색 필터
  const [agentIds, setAgentIds] = useState<string[]>([]);
  const [startDate, setStartDate] = useState<string>(() => {
    const date = new Date();
    date.setFullYear(date.getFullYear() - 1);
    return date.toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState<string>(() => {
    return new Date().toISOString().split('T')[0];
  });
  const [custGbn, setCustGbn] = useState('');

  useEffect(() => {
    handleSearch();
  }, []);

  const handleSearch = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await customerJourneyService.search({
        startDate,
        endDate,
        agentIds: agentIds.length > 0 ? agentIds : undefined,
        custGbn: custGbn || undefined
      });
      if (response.success) {
        setData(response);
      } else {
        setError(response.message || '데이터 조회 실패');
      }
    } catch (err) {
      console.error('검색 오류:', err);
      setError('서버 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  }, [startDate, endDate, agentIds, custGbn]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    await handleSearch();
  };

  const handleReset = () => {
    const date = new Date();
    date.setFullYear(date.getFullYear() - 1);
    setStartDate(date.toISOString().split('T')[0]);
    setEndDate(new Date().toISOString().split('T')[0]);
    setAgentIds([]);
    setCustGbn('');
  };

  const formatNumber = (num: number | null | undefined): string => {
    if (num === null || num === undefined) return '0';
    return num.toLocaleString('ko-KR');
  };

  const formatCurrency = (num: number | null | undefined): string => {
    if (num === null || num === undefined) return '0원';
    return num.toLocaleString('ko-KR') + '원';
  };

  // 파스텔톤 색상
  const barColors = ['blue', 'green', 'orange', 'pink', 'purple', 'teal', 'yellow'];

  const summary = data?.summary;

  // 최대값 계산
  const maxLifecycleCnt = useMemo(() => {
    if (!data?.lifecycleData) return 1;
    return Math.max(...data.lifecycleData.map(d => d.custCnt), 1);
  }, [data?.lifecycleData]);

  const maxPurchaseFreqCnt = useMemo(() => {
    if (!data?.purchaseFreqData) return 1;
    return Math.max(...data.purchaseFreqData.map(d => d.custCnt), 1);
  }, [data?.purchaseFreqData]);

  const maxMonthlyAmt = useMemo(() => {
    if (!data?.monthlyTrendData) return 1;
    return Math.max(...data.monthlyTrendData.map(d => d.saleAmt), 1);
  }, [data?.monthlyTrendData]);

  const maxFirstPurchaseCnt = useMemo(() => {
    if (!data?.firstPurchaseData) return 1;
    return Math.max(...data.firstPurchaseData.map(d => d.custCnt), 1);
  }, [data?.firstPurchaseData]);

  // 랭크 배지 색상
  const getRankBadgeClass = (rank: number): string => {
    if (rank === 1) return 'gold';
    if (rank === 2) return 'silver';
    if (rank === 3) return 'bronze';
    return 'normal';
  };

  return (
    <div className="olm-container order-out-status-page cj-page">
      {/* 상단 섹션 */}
      <div className="top-section">
        <h1 className="page-title">
          {currentTab?.menuIcon
            ? React.createElement(getMenuIcon(currentTab.menuIcon), { size: 14 })
            : <i className="fas fa-route"></i>}
          고객구매여정
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
              <label>매장</label>
              <CommonMultiSelect
                commonCodeType="stores"
                selectedValues={agentIds}
                onSelectionChange={setAgentIds}
                placeholder="전체"
                className="olm-multi-select"
              />
            </div>
            <div className="search-item">
              <label>고객구분</label>
              <select 
                className="olm-form-control olm-select"
                value={custGbn} 
                onChange={(e) => setCustGbn(e.target.value)}
              >
                <option value="">전체</option>
                <option value="1">신규</option>
                <option value="2">재방문</option>
                <option value="3">프리</option>
                <option value="4">VIP</option>
              </select>
            </div>
            <div className="action-buttons">
              <div className="right-buttons">
                <button type="button" className="olm-btn olm-btn-secondary" onClick={handleReset}>
                  <RefreshCw size={12} /> 초기화
                </button>
                <button type="submit" className="olm-btn olm-btn-primary" disabled={isLoading}>
                  <Search size={12} /> {isLoading ? '조회중...' : '조회'}
                </button>
              </div>
            </div>
          </div>
        </form>
      </div>

      {/* 본문 스크롤 영역 */}
      <div className="pp-content">
        {/* 에러 */}
        {error && (
          <div className="cj-error">
            <i className="fas fa-exclamation-circle"></i> {error}
          </div>
        )}

        {/* 로딩 */}
        {isLoading && (
          <div className="cj-loading">
            <i className="fas fa-spinner fa-spin"></i> 데이터를 불러오는 중...
          </div>
        )}

        {/* 요약 카드 */}
        {!isLoading && summary && (
          <div className="cj-summary-section">
            <div className="cj-summary-cards">
              <div className="cj-summary-card highlight">
                <div className="cj-summary-label">총 고객수</div>
                <div className="cj-summary-value">{formatNumber(summary.totalCustCnt)}명</div>
              </div>
              <div className="cj-summary-card">
                <div className="cj-summary-label">총 거래건수</div>
                <div className="cj-summary-value">{formatNumber(summary.totalTrCnt)}건</div>
              </div>
              <div className="cj-summary-card">
                <div className="cj-summary-label">총 매출액</div>
                <div className="cj-summary-value currency">{formatCurrency(summary.totalSaleAmt)}</div>
              </div>
              <div className="cj-summary-card">
                <div className="cj-summary-label">평균 객단가</div>
                <div className="cj-summary-value">{formatCurrency(summary.avgTrAmt)}</div>
              </div>
              <div className="cj-summary-card">
                <div className="cj-summary-label">신규 고객수</div>
                <div className="cj-summary-value">{formatNumber(summary.newCustCnt)}명</div>
                <div className="cj-summary-sub">
                  {summary.totalCustCnt > 0 
                    ? `신규비율 ${((summary.newCustCnt / summary.totalCustCnt) * 100).toFixed(1)}%`
                    : '신규비율 0%'}
                </div>
              </div>
              <div className="cj-summary-card">
                <div className="cj-summary-label">재구매 고객수</div>
                <div className="cj-summary-value">{formatNumber(summary.repeatCustCnt)}명</div>
                <div className="cj-summary-sub">
                  {summary.totalCustCnt > 0 
                    ? `재구매율 ${((summary.repeatCustCnt / summary.totalCustCnt) * 100).toFixed(1)}%`
                    : '재구매율 0%'}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 차트 영역 - 2열 그리드 */}
        {!isLoading && data && (
          <>
            <div className="cj-charts-section">
              {/* 라이프사이클 분석 */}
              <div className="cj-chart-box">
                <div className="cj-chart-title">
                  <i className="fas fa-heartbeat"></i> 고객 라이프사이클 분석
                </div>
                {data.lifecycleData && data.lifecycleData.length > 0 ? (
                  <div className="cj-bar-chart">
                    {data.lifecycleData.map((item, idx) => (
                      <div key={item.lifecycleStage} className="cj-bar-item">
                        <span className="cj-bar-label">{item.lifecycleStage}</span>
                        <div className="cj-bar-wrapper">
                          <div 
                            className={`cj-bar ${barColors[idx % barColors.length]}`}
                            style={{ width: `${Math.max((item.custCnt / maxLifecycleCnt) * 100, 5)}%` }}
                          >
                            {(item.custCnt / maxLifecycleCnt) * 100 > 20 && (
                              <span className="cj-bar-value">{formatNumber(item.custCnt)}명</span>
                            )}
                          </div>
                          {(item.custCnt / maxLifecycleCnt) * 100 <= 20 && (
                            <span className="cj-bar-value outside">{formatNumber(item.custCnt)}명</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="cj-empty">데이터가 없습니다</div>
                )}
              </div>

              {/* 구매빈도 분석 */}
              <div className="cj-chart-box">
                <div className="cj-chart-title">
                  <i className="fas fa-shopping-bag"></i> 구매빈도 분석
                </div>
                {data.purchaseFreqData && data.purchaseFreqData.length > 0 ? (
                  <div className="cj-bar-chart">
                    {data.purchaseFreqData.map((item, idx) => (
                      <div key={item.freqGroup} className="cj-bar-item">
                        <span className="cj-bar-label">{item.freqGroup}</span>
                        <div className="cj-bar-wrapper">
                          <div 
                            className={`cj-bar ${barColors[(idx + 2) % barColors.length]}`}
                            style={{ width: `${Math.max((item.custCnt / maxPurchaseFreqCnt) * 100, 5)}%` }}
                          >
                            {(item.custCnt / maxPurchaseFreqCnt) * 100 > 20 && (
                              <span className="cj-bar-value">{formatNumber(item.custCnt)}명</span>
                            )}
                          </div>
                          {(item.custCnt / maxPurchaseFreqCnt) * 100 <= 20 && (
                            <span className="cj-bar-value outside">{formatNumber(item.custCnt)}명</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="cj-empty">데이터가 없습니다</div>
                )}
              </div>

              {/* 고객구분별 현황 */}
              <div className="cj-chart-box">
                <div className="cj-chart-title">
                  <i className="fas fa-users"></i> 고객구분별 현황
                </div>
                {data.custGbnData && data.custGbnData.length > 0 ? (
                  <div className="cj-pie-chart">
                    {data.custGbnData.map((item, idx) => {
                      const total = data.custGbnData!.reduce((sum, d) => sum + d.custCnt, 0);
                      const percent = total > 0 ? (item.custCnt / total) * 100 : 0;
                      const colors = ['#93c5fd', '#86efac', '#fdba74', '#f9a8d4', '#c4b5fd'];
                      return (
                        <div key={item.custGbn} className="cj-pie-item">
                          <div className="cj-pie-color" style={{ background: colors[idx % colors.length] }}></div>
                          <span className="cj-pie-label">{item.custGbnNm}</span>
                          <span className="cj-pie-value">{formatNumber(item.custCnt)}명</span>
                          <span className="cj-pie-percent">{percent.toFixed(1)}%</span>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="cj-empty">데이터가 없습니다</div>
                )}
              </div>

              {/* 첫구매 후 재구매 기간 */}
              <div className="cj-chart-box">
                <div className="cj-chart-title">
                  <i className="fas fa-calendar-check"></i> 첫구매 후 재구매 기간
                </div>
                {data.firstPurchaseData && data.firstPurchaseData.length > 0 ? (
                  <div className="cj-bar-chart">
                    {data.firstPurchaseData.map((item, idx) => (
                      <div key={item.repeatPeriod} className="cj-bar-item">
                        <span className="cj-bar-label">{item.repeatPeriod}</span>
                        <div className="cj-bar-wrapper">
                          <div 
                            className={`cj-bar ${barColors[(idx + 4) % barColors.length]}`}
                            style={{ width: `${Math.max((item.custCnt / maxFirstPurchaseCnt) * 100, 5)}%` }}
                          >
                            {(item.custCnt / maxFirstPurchaseCnt) * 100 > 20 && (
                              <span className="cj-bar-value">{formatNumber(item.custCnt)}명</span>
                            )}
                          </div>
                          {(item.custCnt / maxFirstPurchaseCnt) * 100 <= 20 && (
                            <span className="cj-bar-value outside">{formatNumber(item.custCnt)}명</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="cj-empty">데이터가 없습니다</div>
                )}
              </div>
            </div>

            {/* 월별 추이 (넓은 차트) */}
            <div className="cj-chart-box" style={{ marginBottom: 20 }}>
              <div className="cj-chart-title">
                <i className="fas fa-chart-line"></i> 월별 매출 추이
              </div>
              {data.monthlyTrendData && data.monthlyTrendData.length > 0 ? (
                <div className="cj-trend-chart">
                  {data.monthlyTrendData.map((item) => (
                    <div key={item.saleMonth} className="cj-trend-row">
                      <span className="cj-trend-month">{item.saleMonth}</span>
                      <div className="cj-trend-bar-wrapper">
                        <div 
                          className="cj-trend-bar"
                          style={{ width: `${(item.saleAmt / maxMonthlyAmt) * 100}%` }}
                        />
                      </div>
                      <span className="cj-trend-value">{formatCurrency(item.saleAmt)}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="cj-empty">데이터가 없습니다</div>
              )}
            </div>

            {/* 테이블 영역 */}
            <div className="cj-tables-section">
              {/* 마일리지 현황 */}
              <div className="cj-table-box">
                <div className="cj-table-title">
                  <i className="fas fa-coins"></i> 월별 마일리지 현황
                </div>
                <div className="cj-table-wrapper">
                  {data.mileageData && data.mileageData.length > 0 ? (
                    <table className="cj-table">
                      <thead>
                        <tr>
                          <th>월</th>
                          <th>고객수</th>
                          <th>적립포인트</th>
                          <th>사용포인트</th>
                          <th>사용률</th>
                        </tr>
                      </thead>
                      <tbody>
                        {data.mileageData.map((item) => (
                          <tr key={item.saleMonth}>
                            <td>{item.saleMonth}</td>
                            <td className="text-right">{formatNumber(item.custCnt)}</td>
                            <td className="text-right">{formatNumber(item.totalMailPrd)}P</td>
                            <td className="text-right">{formatNumber(item.totalMailUse)}P</td>
                            <td className="text-right">{item.mailUseRate?.toFixed(1) || 0}%</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  ) : (
                    <div className="cj-empty">데이터가 없습니다</div>
                  )}
                </div>
              </div>

              {/* 상위 고객 */}
              <div className="cj-table-box">
                <div className="cj-table-title">
                  <i className="fas fa-trophy"></i> 상위 고객 TOP 10
                </div>
                <div className="cj-table-wrapper">
                  {data.topCustomers && data.topCustomers.length > 0 ? (
                    <table className="cj-table">
                      <thead>
                        <tr>
                          <th>순위</th>
                          <th>고객명</th>
                          <th>구분</th>
                          <th>구매건수</th>
                          <th>구매금액</th>
                        </tr>
                      </thead>
                      <tbody>
                        {data.topCustomers.map((item, index) => (
                          <tr key={item.custId}>
                            <td>
                              <span className={`rank-badge ${getRankBadgeClass(index + 1)}`}>
                                {index + 1}
                              </span>
                            </td>
                            <td className="text-left">{item.custNm}</td>
                            <td>{item.custGbnNm}</td>
                            <td className="text-right">{formatNumber(item.trCnt)}건</td>
                            <td className="text-right">{formatCurrency(item.saleAmt)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  ) : (
                    <div className="cj-empty">데이터가 없습니다</div>
                  )}
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default CustomerJourneyAnalysis;
