import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '../store/store';
import { Search, RefreshCw } from 'lucide-react';
import { 
  purchasePatternService, 
  PurchasePatternResponse
} from '../services/purchasePatternService';
import CommonMultiSelect from './CommonMultiSelect';
import { getMenuIcon } from '../utils/menuUtils';
import './PurchasePatternAnalysis.css';
import './OrderListManagement.css';
import './orderOutStatus.css';

/**
 * 구매패턴 분석 컴포넌트
 * CRM 분석 - 구매주기, 객단가, 요일별/시간대별 분석
 */
const PurchasePatternAnalysis: React.FC = () => {
  const { tabs, activeTabId } = useSelector((state: RootState) => state.tabs);

  const currentTab = useMemo(
    () => tabs.find((tab) => tab.id === activeTabId),
    [tabs, activeTabId],
  );

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<PurchasePatternResponse | null>(null);
  
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
      const response = await purchasePatternService.search({
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
  const pastelColors = {
    blue: '#a8d4ff',
    green: '#b8e6c1',
    orange: '#ffd4a8',
    pink: '#ffb8d4',
    purple: '#d4b8ff',
    red: '#ffb8b8',
    yellow: '#fff4b8',
    teal: '#b8e6e6'
  };

  const summary = data?.summary;

  // 데이터 검증 (개발용)
  useEffect(() => {
    if (data) {
      console.log('📊 [구매패턴분석] 데이터 검증:');
      console.log('  - summary:', data.summary);
      
      // 요일별 매출 합계 검증
      if (data.weekdayData && data.weekdayData.length > 0) {
        const weekdayTotalSaleAmt = data.weekdayData.reduce((sum, d) => sum + (d.saleAmt || 0), 0);
        const weekdayTotalTrCnt = data.weekdayData.reduce((sum, d) => sum + (d.trCnt || 0), 0);
        console.log('  - 요일별 매출 합계:', weekdayTotalSaleAmt.toLocaleString(), '원');
        console.log('  - 요일별 거래건수 합계:', weekdayTotalTrCnt.toLocaleString(), '건');
        if (data.summary) {
          console.log('  - Summary 총매출액:', data.summary.totalSaleAmt?.toLocaleString(), '원');
          console.log('  - Summary 총거래건수:', data.summary.totalTrCnt?.toLocaleString(), '건');
          console.log('  - 매출액 차이:', (weekdayTotalSaleAmt - (data.summary.totalSaleAmt || 0)).toLocaleString(), '원');
          console.log('  - 거래건수 차이:', (weekdayTotalTrCnt - (data.summary.totalTrCnt || 0)).toLocaleString(), '건');
        }
      }
      
      // 시간대별 매출 합계 검증
      if (data.timezoneData && data.timezoneData.length > 0) {
        const timezoneTotalSaleAmt = data.timezoneData.reduce((sum, d) => sum + (d.saleAmt || 0), 0);
        console.log('  - 시간대별 매출 합계:', timezoneTotalSaleAmt.toLocaleString(), '원');
      }
      
      // 객단가 구간별 매출 합계 검증
      if (data.amtRangeData && data.amtRangeData.length > 0) {
        const amtRangeTotalSaleAmt = data.amtRangeData.reduce((sum, d) => sum + (d.saleAmt || 0), 0);
        console.log('  - 객단가구간별 매출 합계:', amtRangeTotalSaleAmt.toLocaleString(), '원');
      }
      
      // 월별 추이 매출 합계 검증
      if (data.monthlyTrendData && data.monthlyTrendData.length > 0) {
        const monthlyTotalSaleAmt = data.monthlyTrendData.reduce((sum, d) => sum + (d.saleAmt || 0), 0);
        console.log('  - 월별추이 매출 합계:', monthlyTotalSaleAmt.toLocaleString(), '원');
      }
    }
  }, [data]);

  // 최대값 계산
  const maxWeekdaySaleAmt = useMemo(() => {
    if (!data?.weekdayData) return 1;
    return Math.max(...data.weekdayData.map(d => d.saleAmt), 1);
  }, [data?.weekdayData]);

  const maxTimezoneSaleAmt = useMemo(() => {
    if (!data?.timezoneData) return 1;
    return Math.max(...data.timezoneData.map(d => d.saleAmt), 1);
  }, [data?.timezoneData]);

  const maxAmtRangeCnt = useMemo(() => {
    if (!data?.amtRangeData) return 1;
    return Math.max(...data.amtRangeData.map(d => d.trCnt), 1);
  }, [data?.amtRangeData]);

  const maxCycleCnt = useMemo(() => {
    if (!data?.purchaseCycleData) return 1;
    return Math.max(...data.purchaseCycleData.map(d => d.custCnt), 1);
  }, [data?.purchaseCycleData]);

  return (
    <div className="olm-container order-out-status-page pp-page">
      {/* 상단 섹션 - 고객판매일보와 동일한 구조 */}
      <div className="top-section">
        <h1 className="page-title">
          {currentTab?.menuIcon
            ? React.createElement(getMenuIcon(currentTab.menuIcon), { size: 14 })
            : <i className="fas fa-shopping-cart"></i>}
          구매패턴분석
        </h1>
        
        {/* 검색 조건 - 고객판매일보와 동일한 구조 */}
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
          <div className="pp-error">
            <i className="fas fa-exclamation-circle"></i> {error}
          </div>
        )}

        {/* 요약 카드 */}
        {summary && (
          <div className="pp-summary">
            <div className="pp-card" style={{ borderLeftColor: pastelColors.blue }}>
              <div className="pp-card-icon" style={{ background: pastelColors.blue }}>
                <i className="fas fa-shopping-cart"></i>
              </div>
              <div className="pp-card-info">
                <span className="pp-card-label">총 거래건수</span>
                <span className="pp-card-value">{formatNumber(summary.totalTrCnt)}건</span>
              </div>
            </div>
            <div className="pp-card" style={{ borderLeftColor: pastelColors.green }}>
              <div className="pp-card-icon" style={{ background: pastelColors.green }}>
                <i className="fas fa-users"></i>
              </div>
              <div className="pp-card-info">
                <span className="pp-card-label">구매 고객수</span>
                <span className="pp-card-value">{formatNumber(summary.totalCustCnt)}명</span>
              </div>
            </div>
            <div className="pp-card" style={{ borderLeftColor: pastelColors.orange }}>
              <div className="pp-card-icon" style={{ background: pastelColors.orange }}>
                <i className="fas fa-won-sign"></i>
              </div>
              <div className="pp-card-info">
                <span className="pp-card-label">총 매출액</span>
                <span className="pp-card-value">{formatCurrency(summary.totalSaleAmt)}</span>
              </div>
            </div>
            <div className="pp-card" style={{ borderLeftColor: pastelColors.pink }}>
              <div className="pp-card-icon" style={{ background: pastelColors.pink }}>
                <i className="fas fa-chart-line"></i>
              </div>
              <div className="pp-card-info">
                <span className="pp-card-label">평균 객단가</span>
                <span className="pp-card-value">{formatCurrency(summary.avgTrAmt)}</span>
              </div>
            </div>
            <div className="pp-card" style={{ borderLeftColor: pastelColors.purple }}>
              <div className="pp-card-icon" style={{ background: pastelColors.purple }}>
                <i className="fas fa-redo"></i>
              </div>
              <div className="pp-card-info">
                <span className="pp-card-label">재구매율</span>
                <span className="pp-card-value">{data?.repurchaseData?.repurchaseRate?.toFixed(1) || 0}%</span>
              </div>
            </div>
            <div className="pp-card" style={{ borderLeftColor: pastelColors.red }}>
              <div className="pp-card-icon" style={{ background: pastelColors.red }}>
                <i className="fas fa-percent"></i>
              </div>
              <div className="pp-card-info">
                <span className="pp-card-label">평균 할인율</span>
                <span className="pp-card-value">{summary.avgDiscountRate?.toFixed(1) || 0}%</span>
              </div>
            </div>
          </div>
        )}

        {/* 차트 그리드 */}
        <div className="pp-grid">
          {/* 요일별 분석 */}
          <div className="pp-box">
            <div className="pp-box-header">
              <i className="fas fa-calendar-alt"></i> 요일별 분석
            </div>
            <div className="pp-box-body">
              {data?.weekdayData && data.weekdayData.length > 0 ? (
                <div className="pp-bars">
                  {data.weekdayData.map((item, idx) => (
                    <div key={item.weekdayNum} className="pp-bar-row">
                      <span className="pp-bar-name">{item.weekdayNm}</span>
                      <div className="pp-bar-track">
                        <div 
                          className="pp-bar-fill"
                          style={{ 
                            width: `${(item.saleAmt / maxWeekdaySaleAmt) * 100}%`,
                            background: [pastelColors.red, pastelColors.blue, pastelColors.green, pastelColors.orange, pastelColors.purple, pastelColors.teal, pastelColors.red][idx % 7]
                          }}
                        />
                      </div>
                      <span className="pp-bar-amt">{formatCurrency(item.saleAmt)}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="pp-empty">데이터가 없습니다</div>
              )}
            </div>
          </div>

          {/* 시간대별 분석 */}
          <div className="pp-box">
            <div className="pp-box-header">
              <i className="fas fa-clock"></i> 시간대별 분석
            </div>
            <div className="pp-box-body">
              {data?.timezoneData && data.timezoneData.length > 0 ? (
                <div className="pp-bars">
                  {data.timezoneData.map((item, idx) => (
                    <div key={item.timeZoneNum} className="pp-bar-row">
                      <span className="pp-bar-name">{item.timeZoneNm}</span>
                      <div className="pp-bar-track">
                        <div 
                          className="pp-bar-fill"
                          style={{ 
                            width: `${(item.saleAmt / maxTimezoneSaleAmt) * 100}%`,
                            background: [pastelColors.yellow, pastelColors.green, pastelColors.blue, pastelColors.purple, pastelColors.teal][idx % 5]
                          }}
                        />
                      </div>
                      <span className="pp-bar-amt">{formatCurrency(item.saleAmt)}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="pp-empty">데이터가 없습니다</div>
              )}
            </div>
          </div>

          {/* 객단가 구간별 */}
          <div className="pp-box">
            <div className="pp-box-header">
              <i className="fas fa-won-sign"></i> 객단가 구간별
            </div>
            <div className="pp-box-body">
              {data?.amtRangeData && data.amtRangeData.length > 0 ? (
                <div className="pp-bars">
                  {data.amtRangeData.map((item, idx) => (
                    <div key={item.amtRangeNum} className="pp-bar-row">
                      <span className="pp-bar-name">{item.amtRangeNm}</span>
                      <div className="pp-bar-track">
                        <div 
                          className="pp-bar-fill"
                          style={{ 
                            width: `${(item.trCnt / maxAmtRangeCnt) * 100}%`,
                            background: [pastelColors.teal, pastelColors.green, pastelColors.blue, pastelColors.purple, pastelColors.orange, pastelColors.pink][idx % 6]
                          }}
                        />
                      </div>
                      <span className="pp-bar-amt">{formatNumber(item.trCnt)}건</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="pp-empty">데이터가 없습니다</div>
              )}
            </div>
          </div>

          {/* 구매주기별 */}
          <div className="pp-box">
            <div className="pp-box-header">
              <i className="fas fa-redo"></i> 구매주기별
            </div>
            <div className="pp-box-body">
              {data?.purchaseCycleData && data.purchaseCycleData.length > 0 ? (
                <div className="pp-bars">
                  {data.purchaseCycleData.map((item, idx) => (
                    <div key={item.cycleGbn} className="pp-bar-row">
                      <span className="pp-bar-name">{item.cycleNm}</span>
                      <div className="pp-bar-track">
                        <div 
                          className="pp-bar-fill"
                          style={{ 
                            width: `${(item.custCnt / maxCycleCnt) * 100}%`,
                            background: [pastelColors.teal, pastelColors.green, pastelColors.blue, pastelColors.purple, pastelColors.orange, pastelColors.pink, pastelColors.red][idx % 7]
                          }}
                        />
                      </div>
                      <span className="pp-bar-amt">{formatNumber(item.custCnt)}명</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="pp-empty">데이터가 없습니다</div>
              )}
            </div>
          </div>
        </div>

        {/* 월별 추이 */}
        <div className="pp-box pp-box-wide">
          <div className="pp-box-header">
            <i className="fas fa-chart-bar"></i> 월별 매출 추이
          </div>
          <div className="pp-box-body pp-trend-body">
            {data?.monthlyTrendData && data.monthlyTrendData.length > 0 ? (
              <div className="pp-trend">
                {data.monthlyTrendData.map((item) => {
                  const maxAmt = Math.max(...data.monthlyTrendData!.map(d => d.saleAmt), 1);
                  return (
                    <div key={item.saleMonth} className="pp-trend-col">
                      <div 
                        className="pp-trend-bar"
                        style={{ height: `${(item.saleAmt / maxAmt) * 100}%`, background: pastelColors.blue }}
                        title={formatCurrency(item.saleAmt)}
                      />
                      <span className="pp-trend-label">{item.saleMonth.slice(5)}</span>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="pp-empty">데이터가 없습니다</div>
            )}
          </div>
        </div>

        {/* 테이블 영역 */}
        <div className="pp-tables">
          {/* 인기 상품 */}
          <div className="pp-box pp-box-table">
            <div className="pp-box-header">
              <i className="fas fa-trophy"></i> 인기 상품 TOP 10
            </div>
            <div className="pp-box-body">
              {data?.topProducts && data.topProducts.length > 0 ? (
                <table className="pp-table">
                  <thead>
                    <tr>
                      <th>순위</th>
                      <th>상품명</th>
                      <th>건수</th>
                      <th>수량</th>
                      <th>매출액</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.topProducts.map((item, index) => (
                      <tr key={item.goodsId}>
                        <td className="center">{index + 1}</td>
                        <td className="ellipsis">{item.goodsNm}</td>
                        <td className="right">{formatNumber(item.trCnt)}</td>
                        <td className="right">{formatNumber(item.saleQty)}</td>
                        <td className="right">{formatCurrency(item.saleAmt)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div className="pp-empty">데이터가 없습니다</div>
              )}
            </div>
          </div>

          {/* 고객구분별 */}
          <div className="pp-box pp-box-half">
            <div className="pp-box-header">
              <i className="fas fa-users"></i> 고객구분별
            </div>
            <div className="pp-box-body">
              {data?.custGbnData && data.custGbnData.length > 0 ? (
                <table className="pp-table small">
                  <thead>
                    <tr>
                      <th>구분</th>
                      <th>고객수</th>
                      <th>매출액</th>
                      <th>평균</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.custGbnData.map((item) => (
                      <tr key={item.custGbn}>
                        <td>{item.custGbnNm}</td>
                        <td className="right">{formatNumber(item.custCnt)}</td>
                        <td className="right">{formatCurrency(item.saleAmt)}</td>
                        <td className="right">{formatCurrency(item.avgCustAmt)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div className="pp-empty">데이터가 없습니다</div>
              )}
            </div>
          </div>

          {/* 할인율별 */}
          <div className="pp-box pp-box-half">
            <div className="pp-box-header">
              <i className="fas fa-percent"></i> 할인율별
            </div>
            <div className="pp-box-body">
              {data?.discountData && data.discountData.length > 0 ? (
                <table className="pp-table small">
                  <thead>
                    <tr>
                      <th>구간</th>
                      <th>건수</th>
                      <th>매출액</th>
                      <th>할인액</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.discountData.map((item) => (
                      <tr key={item.discountGbn}>
                        <td>{item.discountNm}</td>
                        <td className="right">{formatNumber(item.trCnt)}</td>
                        <td className="right">{formatCurrency(item.saleAmt)}</td>
                        <td className="right">{formatCurrency(item.discountAmt)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div className="pp-empty">데이터가 없습니다</div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PurchasePatternAnalysis;
