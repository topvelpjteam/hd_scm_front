import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { 
  Users, Search, RefreshCw, UserX, TrendingDown,
  MessageSquare, Mail, Phone, AlertTriangle, List, BarChart3,
  DollarSign, Clock
} from 'lucide-react';
import { 
  dormantCustomerService, 
  DormantCustomerResponse, 
  DormantDetailItem 
} from '../services/dormantCustomerService';
import CommonMultiSelect from './CommonMultiSelect';
import './DormantCustomerAnalysis.css';
import './OrderListManagement.css';
import './orderOutStatus.css';

/**
 * 휴면고객 분석 컴포넌트
 * CRM 분석 - 휴면고객 리스트 및 분석 화면
 */
const DormantCustomerAnalysis: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<DormantCustomerResponse | null>(null);
  const [detailList, setDetailList] = useState<DormantDetailItem[]>([]);
  
  // 검색 필터
  const [dormantMonths, setDormantMonths] = useState<number>(6);
  const [agentIds, setAgentIds] = useState<string[]>([]);
  const [custGbn, setCustGbn] = useState('');
  const [genderGbn, setGenderGbn] = useState('');
  
  // 탭 상태
  const [activeTab, setActiveTab] = useState<'analysis' | 'list'>('analysis');

  useEffect(() => {
    handleSearch();
  }, []);

  const handleSearch = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await dormantCustomerService.search({
        dormantMonths,
        agentIds: agentIds.length > 0 ? agentIds : undefined,
        custGbn: custGbn || undefined,
        genderGbn: genderGbn || undefined
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
  }, [dormantMonths, agentIds, custGbn, genderGbn]);

  const handleDetailSearch = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await dormantCustomerService.getDetailList({
        dormantMonths,
        agentIds: agentIds.length > 0 ? agentIds : undefined,
        custGbn: custGbn || undefined,
        genderGbn: genderGbn || undefined
      });
      if (response.success) {
        setDetailList(response.detailList || []);
      } else {
        setError(response.message || '데이터 조회 실패');
      }
    } catch (err) {
      console.error('상세 조회 오류:', err);
      setError('서버 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  }, [dormantMonths, agentIds, custGbn, genderGbn]);

  const handleTabChange = (tab: 'analysis' | 'list') => {
    setActiveTab(tab);
    if (tab === 'list' && detailList.length === 0) {
      handleDetailSearch();
    }
  };

  const handleReset = () => {
    setDormantMonths(6);
    setAgentIds([]);
    setCustGbn('');
    setGenderGbn('');
  };

  const formatNumber = (num: number | null | undefined): string => {
    if (num === null || num === undefined) return '0';
    return num.toLocaleString('ko-KR');
  };

  const formatCurrency = (num: number | null | undefined): string => {
    if (num === null || num === undefined) return '0원';
    return num.toLocaleString('ko-KR') + '원';
  };

  // 파스텔톤 색상 (구매패턴분석과 통일)
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

  // 기간별 색상 (파스텔톤)
  const getPeriodColor = (periodGbn: number): string => {
    const colors: Record<number, string> = {
      0: pastelColors.green, // 활성
      1: pastelColors.yellow, // 3~6개월
      2: pastelColors.orange, // 6~12개월
      3: pastelColors.pink, // 12~24개월
      4: pastelColors.red, // 24개월이상
      5: '#d5d8dc'  // 구매이력없음
    };
    return colors[periodGbn] || '#d5d8dc';
  };

  // 금액대별 색상 (파스텔톤)
  const getAmtColor = (amtSort: number): string => {
    const colors: Record<number, string> = {
      0: '#d5d8dc', // 구매이력없음
      1: pastelColors.green, // 5만원미만
      2: pastelColors.blue, // 5~10만원
      3: pastelColors.purple, // 10~30만원
      4: pastelColors.orange, // 30~50만원
      5: pastelColors.red  // 50만원이상
    };
    return colors[amtSort] || '#d5d8dc';
  };

  const summary = data?.summary;

  // 휴면율 계산
  const dormantRate = useMemo(() => {
    if (!summary || !summary.TOTAL_CUST_CNT) return 0;
    return ((summary.DORMANT_CUST_CNT || 0) / summary.TOTAL_CUST_CNT * 100).toFixed(1);
  }, [summary]);

  // 기간별 최대값
  const maxPeriodCnt = useMemo(() => {
    if (!data?.periodData) return 1;
    return Math.max(...data.periodData.map(d => d.CUST_CNT), 1);
  }, [data?.periodData]);

  // 금액대별 최대값
  const maxAmtCnt = useMemo(() => {
    if (!data?.lastPurchaseData) return 1;
    return Math.max(...data.lastPurchaseData.map(d => d.CUST_CNT), 1);
  }, [data?.lastPurchaseData]);

  return (
    <div className="olm-container order-out-status-page dormant-page">
      {/* 상단 섹션 - 고객판매일보와 동일한 구조 */}
      <div className="top-section">
        <h1 className="page-title">
          <UserX size={14} />
          휴면고객분석
        </h1>
        
        {/* 검색 조건 - 고객판매일보와 동일한 구조 */}
        <div className="search-conditions">
          <div className="search-row">
            <div className="search-item">
              <label>휴면기준</label>
              <select 
                className="olm-form-control olm-select"
                value={dormantMonths} 
                onChange={(e) => setDormantMonths(Number(e.target.value))}
              >
                <option value={3}>3개월</option>
                <option value={6}>6개월</option>
                <option value={12}>12개월</option>
                <option value={24}>24개월</option>
              </select>
            </div>
            <div className="search-item">
              <label>매장</label>
              <CommonMultiSelect
                commonCodeType="stores"
                selectedValues={agentIds}
                onSelectionChange={(values) => setAgentIds(values)}
                placeholder="매장을 선택하세요"
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
            <div className="search-item">
              <label>성별</label>
              <select 
                className="olm-form-control olm-select"
                value={genderGbn} 
                onChange={(e) => setGenderGbn(e.target.value)}
              >
                <option value="">전체</option>
                <option value="M">남성</option>
                <option value="F">여성</option>
              </select>
            </div>
            <div className="action-buttons">
              <div className="right-buttons">
                <button type="button" className="olm-btn olm-btn-secondary" onClick={handleReset}>
                  <RefreshCw size={12} /> 초기화
                </button>
                <button type="button" className="olm-btn olm-btn-primary" onClick={handleSearch}>
                  <Search size={12} /> 조회
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 요약 카드 */}
      {summary && (
        <div className="dormant-summary-cards">
          <div className="dormant-summary-card total">
            <div className="dormant-card-icon"><Users size={20} /></div>
            <div className="dormant-card-content">
              <span className="dormant-card-label">전체고객</span>
              <span className="dormant-card-value">{formatNumber(summary.TOTAL_CUST_CNT)}</span>
            </div>
          </div>
          <div className="dormant-summary-card active">
            <div className="dormant-card-icon"><TrendingDown size={20} /></div>
            <div className="dormant-card-content">
              <span className="dormant-card-label">활성고객</span>
              <span className="dormant-card-value">{formatNumber(summary.ACTIVE_CUST_CNT)}</span>
            </div>
          </div>
          <div className="dormant-summary-card dormant">
            <div className="dormant-card-icon"><UserX size={20} /></div>
            <div className="dormant-card-content">
              <span className="dormant-card-label">휴면고객 ({dormantMonths}개월)</span>
              <span className="dormant-card-value">{formatNumber(summary.DORMANT_CUST_CNT)}</span>
            </div>
          </div>
          <div className="dormant-summary-card rate">
            <div className="dormant-card-icon"><AlertTriangle size={20} /></div>
            <div className="dormant-card-content">
              <span className="dormant-card-label">휴면율</span>
              <span className="dormant-card-value">{dormantRate}%</span>
            </div>
          </div>
        </div>
      )}

      {/* 탭 */}
      <div className="dormant-tabs">
        <button 
          className={`dormant-tab-btn ${activeTab === 'analysis' ? 'active' : ''}`}
          onClick={() => handleTabChange('analysis')}
        >
          <BarChart3 size={12} /> 분석현황
        </button>
        <button 
          className={`dormant-tab-btn ${activeTab === 'list' ? 'active' : ''}`}
          onClick={() => handleTabChange('list')}
        >
          <List size={12} /> 휴면고객목록
        </button>
      </div>

      {/* 로딩 상태 */}
      {isLoading && (
        <div className="dormant-loading">
          <div className="dormant-loading-spinner"></div>
          데이터를 조회하고 있습니다...
        </div>
      )}

      {/* 에러 상태 */}
      {error && !isLoading && (
        <div className="dormant-error">
          <AlertTriangle size={20} />
          {error}
        </div>
      )}

      {/* 분석 탭 */}
      {!isLoading && !error && data && activeTab === 'analysis' && (
        <div className="dormant-content">
          {/* 상단 차트 영역 */}
          <div className="dormant-chart-row">
            {/* 휴면기간별 분포 */}
            <div className="dormant-chart-card">
              <h3 className="dormant-chart-title"><Clock size={14} /> 휴면기간별 분포</h3>
              <div className="dormant-bar-container">
                {data.periodData?.map((item, idx) => (
                  <div key={idx} className="dormant-bar-item">
                    <span className="dormant-bar-label">{item.PERIOD_NM}</span>
                    <div className="dormant-bar-track">
                      <div 
                        className="dormant-bar-fill"
                        style={{ 
                          width: `${Math.max((item.CUST_CNT / maxPeriodCnt) * 100, 5)}%`,
                          backgroundColor: getPeriodColor(item.PERIOD_GBN)
                        }}
                      />
                    </div>
                    <span className="dormant-bar-value">{formatNumber(item.CUST_CNT)}</span>
                    <span className="dormant-bar-ratio">{item.RATIO}%</span>
                  </div>
                ))}
              </div>
            </div>

            {/* 마지막 구매금액별 분포 */}
            <div className="dormant-chart-card">
              <h3 className="dormant-chart-title"><DollarSign size={14} /> 마지막 구매금액별</h3>
              <div className="dormant-bar-container">
                {data.lastPurchaseData?.map((item, idx) => (
                  <div key={idx} className="dormant-bar-item">
                    <span className="dormant-bar-label">{item.AMT_GROUP}</span>
                    <div className="dormant-bar-track">
                      <div 
                        className="dormant-bar-fill"
                        style={{ 
                          width: `${Math.max((item.CUST_CNT / maxAmtCnt) * 100, 5)}%`,
                          backgroundColor: getAmtColor(item.AMT_SORT)
                        }}
                      />
                    </div>
                    <span className="dormant-bar-value">{formatNumber(item.CUST_CNT)}</span>
                    <span className="dormant-bar-ratio">{item.RATIO}%</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* 하단 차트 영역 */}
          <div className="dormant-chart-row">
            {/* 고객구분별 휴면 */}
            <div className="dormant-chart-card small">
              <h3 className="dormant-chart-title"><Users size={14} /> 고객구분별 휴면</h3>
              <div className="dormant-pie-legend">
                {data.custGbnData?.map((item, idx) => (
                  <div key={idx} className="dormant-legend-item">
                    <div className="dormant-legend-color" style={{ backgroundColor: getPeriodColor(idx + 1) }}></div>
                    <span className="dormant-legend-label">{item.CUST_GBN_NM}</span>
                    <span className="dormant-legend-value">{formatNumber(item.CUST_CNT)}</span>
                    <span className="dormant-legend-ratio">{item.RATIO}%</span>
                  </div>
                ))}
              </div>
            </div>

            {/* 성별 휴면 */}
            <div className="dormant-chart-card small">
              <h3 className="dormant-chart-title"><Users size={14} /> 성별 휴면</h3>
              <div className="dormant-pie-legend">
                {data.genderData?.map((item, idx) => (
                  <div key={idx} className="dormant-legend-item">
                    <div className="dormant-legend-color" style={{ 
                      backgroundColor: item.GENDER_GBN === 'M' ? pastelColors.blue : item.GENDER_GBN === 'F' ? pastelColors.pink : '#d5d8dc' 
                    }}></div>
                    <span className="dormant-legend-label">{item.GENDER_NM}</span>
                    <span className="dormant-legend-value">{formatNumber(item.CUST_CNT)}</span>
                    <span className="dormant-legend-ratio">{item.RATIO}%</span>
                  </div>
                ))}
              </div>
            </div>

            {/* 마케팅 대상 */}
            <div className="dormant-chart-card small">
              <h3 className="dormant-chart-title"><Mail size={14} /> 마케팅 가능 대상</h3>
              <div className="dormant-marketing-grid">
                {data.marketingTargetData?.map((item, idx) => (
                  <div key={idx} className={`dormant-marketing-item ${item.CHANNEL.toLowerCase()}`}>
                    <div className="channel-icon">
                      {item.CHANNEL === 'SMS' && <MessageSquare size={16} />}
                      {item.CHANNEL === 'EMAIL' && <Mail size={16} />}
                      {item.CHANNEL === 'CALL' && <Phone size={16} />}
                    </div>
                    <div className="channel-name">{item.CHANNEL}</div>
                    <div className="target-cnt">{formatNumber(item.TARGET_CNT)}명</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 목록 탭 */}
      {!isLoading && !error && activeTab === 'list' && (
        <div className="dormant-list-container">
          <div className="dormant-list-header">
            <span className="dormant-list-count">
              총 <strong>{formatNumber(detailList.length)}</strong>명
            </span>
            <button className="olm-btn olm-btn-secondary dormant-btn-refresh" onClick={handleDetailSearch}>
              <RefreshCw size={12} /> 새로고침
            </button>
          </div>
          <div className="dormant-table-wrapper">
            <table className="dormant-table">
              <thead>
                <tr>
                  <th>고객명</th>
                  <th>전화번호</th>
                  <th>이메일</th>
                  <th>고객구분</th>
                  <th>성별</th>
                  <th>가입일</th>
                  <th>마지막구매일</th>
                  <th>휴면일수</th>
                  <th>누적구매액</th>
                  <th>방문횟수</th>
                  <th>매장</th>
                  <th>SMS</th>
                  <th>EMAIL</th>
                  <th>CALL</th>
                </tr>
              </thead>
              <tbody>
                {detailList.length === 0 ? (
                  <tr>
                    <td colSpan={14} className="dormant-no-data">
                      휴면고객 데이터가 없습니다.
                    </td>
                  </tr>
                ) : (
                  detailList.map((item, idx) => (
                    <tr key={idx}>
                      <td className="text-left">{item.CUST_NM || '-'}</td>
                      <td className="text-left">{item.C_HP || '-'}</td>
                      <td className="text-left">{item.C_EMAIL || '-'}</td>
                      <td>{item.CUST_GBN_NM}</td>
                      <td>{item.GENDER_NM}</td>
                      <td>{item.REG_DATE || '-'}</td>
                      <td>{item.LAST_SALE_D || '-'}</td>
                      <td className={`dormant-days ${item.DORMANT_DAYS > 365 ? 'danger' : item.DORMANT_DAYS > 180 ? 'warning' : ''}`}>
                        {item.DORMANT_DAYS || 0}일
                      </td>
                      <td className="text-right">{formatCurrency(item.TOTAL_SALE_AMT)}</td>
                      <td className="text-center">{item.VISIT_CNT}회</td>
                      <td>{item.STORE_NM || '-'}</td>
                      <td className={`chk-cell ${item.SMS_CHK === 'O' ? 'yes' : 'no'}`}>{item.SMS_CHK}</td>
                      <td className={`chk-cell ${item.EMAIL_CHK === 'O' ? 'yes' : 'no'}`}>{item.EMAIL_CHK}</td>
                      <td className={`chk-cell ${item.CALL_CHK === 'O' ? 'yes' : 'no'}`}>{item.CALL_CHK}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default DormantCustomerAnalysis;
