import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '../store/store';
import { Search, RefreshCw } from 'lucide-react';
import { 
  staffPerformanceService, 
  StaffPerformanceResponse
} from '../services/staffPerformanceService';
import CommonMultiSelect from './CommonMultiSelect';
import { getMenuIcon } from '../utils/menuUtils';
import './StaffPerformanceAnalysis.css';
import './OrderListManagement.css';
import './orderOutStatus.css';

/**
 * 판매사원 성과 분석 컴포넌트
 * CRM 분석 - 사원별 매출 순위, 신규고객 유치, 요일별 분석
 */
const StaffPerformanceAnalysis: React.FC = () => {
  const { tabs, activeTabId } = useSelector((state: RootState) => state.tabs);

  const currentTab = useMemo(
    () => tabs.find((tab) => tab.id === activeTabId),
    [tabs, activeTabId],
  );

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<StaffPerformanceResponse | null>(null);
  
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

  useEffect(() => {
    handleSearch();
  }, []);

  const handleSearch = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await staffPerformanceService.search({
        startDate,
        endDate,
        agentIds: agentIds.length > 0 ? agentIds : undefined,
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
  }, [startDate, endDate, agentIds]);

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

  // 최대값 계산 (차트 표시용)
  const maxAgentSaleAmt = useMemo(() => {
    if (!data?.agentData) return 1;
    return Math.max(...data.agentData.map(d => d.saleAmt), 1);
  }, [data?.agentData]);

  const maxWeekdaySaleAmt = useMemo(() => {
    if (!data?.weekdayData) return 1;
    return Math.max(...data.weekdayData.map(d => d.saleAmt), 1);
  }, [data?.weekdayData]);

  const getRankClass = (rank: number): string => {
    if (rank === 1) return 'sp-rank sp-rank-1';
    if (rank === 2) return 'sp-rank sp-rank-2';
    if (rank === 3) return 'sp-rank sp-rank-3';
    return 'sp-rank sp-rank-other';
  };

  return (
    <div className="olm-container order-out-status-page sp-page">
      {/* 상단 섹션 - 고객판매일보와 동일한 구조 */}
      <div className="top-section">
        <h1 className="page-title">
          {currentTab?.menuIcon
            ? React.createElement(getMenuIcon(currentTab.menuIcon), { size: 14 })
            : <i className="fas fa-user-tie"></i>}
          판매사원성과분석
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
      <div className="sp-content">
        {/* 에러 */}
        {error && (
          <div className="sp-error">
            <i className="fas fa-exclamation-circle"></i> {error}
          </div>
        )}

        {/* 요약 카드 */}
        {summary && (
          <div className="sp-summary">
            <div className="sp-card" style={{ borderLeftColor: pastelColors.blue }}>
              <div className="sp-card-icon" style={{ background: pastelColors.blue }}>
                <i className="fas fa-user-tie"></i>
              </div>
              <div className="sp-card-info">
                <span className="sp-card-label">판매사원수</span>
                <span className="sp-card-value">{formatNumber(summary.totalStaffCnt)}명</span>
              </div>
            </div>
            <div className="sp-card" style={{ borderLeftColor: pastelColors.green }}>
              <div className="sp-card-icon" style={{ background: pastelColors.green }}>
                <i className="fas fa-shopping-cart"></i>
              </div>
              <div className="sp-card-info">
                <span className="sp-card-label">총 거래건수</span>
                <span className="sp-card-value">{formatNumber(summary.totalTrCnt)}건</span>
              </div>
            </div>
            <div className="sp-card" style={{ borderLeftColor: pastelColors.orange }}>
              <div className="sp-card-icon" style={{ background: pastelColors.orange }}>
                <i className="fas fa-users"></i>
              </div>
              <div className="sp-card-info">
                <span className="sp-card-label">구매 고객수</span>
                <span className="sp-card-value">{formatNumber(summary.totalCustCnt)}명</span>
              </div>
            </div>
            <div className="sp-card" style={{ borderLeftColor: pastelColors.pink }}>
              <div className="sp-card-icon" style={{ background: pastelColors.pink }}>
                <i className="fas fa-won-sign"></i>
              </div>
              <div className="sp-card-info">
                <span className="sp-card-label">총 매출액</span>
                <span className="sp-card-value">{formatCurrency(summary.totalSaleAmt)}</span>
              </div>
            </div>
            <div className="sp-card" style={{ borderLeftColor: pastelColors.purple }}>
              <div className="sp-card-icon" style={{ background: pastelColors.purple }}>
                <i className="fas fa-chart-line"></i>
              </div>
              <div className="sp-card-info">
                <span className="sp-card-label">평균 객단가</span>
                <span className="sp-card-value">{formatCurrency(summary.avgTrAmt)}</span>
              </div>
            </div>
          </div>
        )}

        {/* 차트 그리드 */}
        <div className="sp-grid">
          {/* 매장별 성과 */}
          <div className="sp-box">
            <div className="sp-box-header">
              <i className="fas fa-store"></i> 매장별 성과
            </div>
            <div className="sp-box-body">
              {data?.agentData && data.agentData.length > 0 ? (
                <div className="sp-bars">
                  {data.agentData.slice(0, 10).map((item, idx) => (
                    <div key={item.agentId} className="sp-bar-row">
                      <span className="sp-bar-name">{item.agentNm}</span>
                      <div className="sp-bar-track">
                        <div 
                          className="sp-bar-fill"
                          style={{ 
                            width: `${(item.saleAmt / maxAgentSaleAmt) * 100}%`,
                            background: [pastelColors.blue, pastelColors.green, pastelColors.orange, pastelColors.pink, pastelColors.purple, pastelColors.teal][idx % 6]
                          }}
                        />
                      </div>
                      <span className="sp-bar-amt">{formatCurrency(item.saleAmt)}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="sp-empty">데이터가 없습니다</div>
              )}
            </div>
          </div>

          {/* 요일별 성과 */}
          <div className="sp-box">
            <div className="sp-box-header">
              <i className="fas fa-calendar-alt"></i> 요일별 성과
            </div>
            <div className="sp-box-body">
              {data?.weekdayData && data.weekdayData.length > 0 ? (
                <div className="sp-bars">
                  {data.weekdayData.map((item, idx) => (
                    <div key={item.weekdayNum} className="sp-bar-row">
                      <span className="sp-bar-name">{item.weekdayNm}</span>
                      <div className="sp-bar-track">
                        <div 
                          className="sp-bar-fill"
                          style={{ 
                            width: `${(item.saleAmt / maxWeekdaySaleAmt) * 100}%`,
                            background: [pastelColors.red, pastelColors.blue, pastelColors.green, pastelColors.orange, pastelColors.purple, pastelColors.teal, pastelColors.red][idx % 7]
                          }}
                        />
                      </div>
                      <span className="sp-bar-amt">{formatCurrency(item.saleAmt)}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="sp-empty">데이터가 없습니다</div>
              )}
            </div>
          </div>
        </div>

        {/* 월별 추이 */}
        <div className="sp-box sp-box-wide">
          <div className="sp-box-header">
            <i className="fas fa-chart-bar"></i> 월별 매출 추이
          </div>
          <div className="sp-box-body sp-trend-body">
            {data?.monthlyTrendData && data.monthlyTrendData.length > 0 ? (
              <div className="sp-trend">
                {data.monthlyTrendData.map((item) => {
                  const maxAmt = Math.max(...data.monthlyTrendData!.map(d => d.saleAmt), 1);
                  return (
                    <div key={item.saleMonth} className="sp-trend-col">
                      <div 
                        className="sp-trend-bar"
                        style={{ height: `${(item.saleAmt / maxAmt) * 100}%`, background: pastelColors.blue }}
                        title={formatCurrency(item.saleAmt)}
                      />
                      <span className="sp-trend-label">{item.saleMonth.slice(4)}</span>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="sp-empty">데이터가 없습니다</div>
            )}
          </div>
        </div>

        {/* 테이블 영역 */}
        <div className="sp-tables">
          {/* 사원별 매출 순위 TOP 20 */}
          <div className="sp-box sp-box-table">
            <div className="sp-box-header">
              <i className="fas fa-trophy"></i> 사원별 매출 순위 TOP 20
            </div>
            <div className="sp-box-body">
              {data?.staffRankData && data.staffRankData.length > 0 ? (
                <table className="sp-table">
                  <thead>
                    <tr>
                      <th>순위</th>
                      <th>사원명</th>
                      <th>매장</th>
                      <th>거래건수</th>
                      <th>고객수</th>
                      <th>매출액</th>
                      <th>평균객단가</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.staffRankData.map((item) => (
                      <tr key={item.staffId}>
                        <td className="center">
                          <span className={getRankClass(item.rankNum)}>{item.rankNum}</span>
                        </td>
                        <td>{item.staffNm}</td>
                        <td className="ellipsis">{item.agentNm}</td>
                        <td className="right">{formatNumber(item.trCnt)}</td>
                        <td className="right">{formatNumber(item.custCnt)}</td>
                        <td className="right">{formatCurrency(item.saleAmt)}</td>
                        <td className="right">{formatCurrency(item.avgTrAmt)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div className="sp-empty">데이터가 없습니다</div>
              )}
            </div>
          </div>

          {/* 신규고객 유치 실적 */}
          <div className="sp-box sp-box-half">
            <div className="sp-box-header">
              <i className="fas fa-user-plus"></i> 신규고객 유치 TOP 10
            </div>
            <div className="sp-box-body">
              {data?.newCustData && data.newCustData.length > 0 ? (
                <table className="sp-table small">
                  <thead>
                    <tr>
                      <th>순위</th>
                      <th>사원명</th>
                      <th>신규고객</th>
                      <th>신규매출</th>
                      <th>비율</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.newCustData.slice(0, 10).map((item) => (
                      <tr key={item.staffId}>
                        <td className="center">
                          <span className={getRankClass(item.rankNum)}>{item.rankNum}</span>
                        </td>
                        <td>{item.staffNm}</td>
                        <td className="right">{formatNumber(item.newCustCnt)}명</td>
                        <td className="right">{formatCurrency(item.newCustSaleAmt)}</td>
                        <td className="right">{item.newCustRate?.toFixed(1)}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div className="sp-empty">데이터가 없습니다</div>
              )}
            </div>
          </div>

          {/* 고객구분별 실적 */}
          <div className="sp-box sp-box-half">
            <div className="sp-box-header">
              <i className="fas fa-users"></i> 고객구분별 실적
            </div>
            <div className="sp-box-body">
              {data?.custGbnData && data.custGbnData.length > 0 ? (
                <table className="sp-table small">
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
                        <td className="right">{formatNumber(item.custCnt)}명</td>
                        <td className="right">{formatCurrency(item.saleAmt)}</td>
                        <td className="right">{formatCurrency(item.avgCustAmt)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div className="sp-empty">데이터가 없습니다</div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StaffPerformanceAnalysis;
