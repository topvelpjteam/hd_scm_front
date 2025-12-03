import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { 
  Users, Search, RefreshCw, PieChart, BarChart3, TrendingUp, 
  MessageSquare, Mail, Phone, FileText
} from 'lucide-react';
import { customerSegmentService, CustomerSegmentResponse } from '../services/customerSegmentService';
import './CustomerSegmentStatus.css';
import './OrderListManagement.css';
import './orderOutStatus.css';

/** 고객구분 코드 타입 */
interface CustGbnItem {
  CUST_GBN: string;
  CUST_GBN_NM: string;
  SORT_KEY: number;
}

/**
 * 고객구분현황 컴포넌트
 * CRM 분석 - 고객 세그먼트 분석 (기존 메뉴 스타일 적용)
 */
const CustomerSegmentStatus: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<CustomerSegmentResponse | null>(null);
  const [custGbnList, setCustGbnList] = useState<CustGbnItem[]>([]);
  
  // 검색 필터
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [custGbn, setCustGbn] = useState('');
  const [genderGbn, setGenderGbn] = useState('');
  const [activeTab, setActiveTab] = useState<'overview' | 'marketing'>('overview');

  useEffect(() => {
    loadCustGbnList();
    handleSearch();
  }, []);

  const loadCustGbnList = async () => {
    try {
      const list = await customerSegmentService.getCustGbnList();
      setCustGbnList(list);
    } catch (err) {
      console.error('고객구분 목록 로드 오류:', err);
    }
  };

  const handleSearch = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await customerSegmentService.search({
        fromDate: fromDate || undefined,
        toDate: toDate || undefined,
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
  }, [fromDate, toDate, custGbn, genderGbn]);

  const handleReset = () => {
    setFromDate('');
    setToDate('');
    setCustGbn('');
    setGenderGbn('');
  };

  const formatNumber = (num: number | null | undefined): string => {
    if (num === null || num === undefined) return '0';
    return num.toLocaleString('ko-KR');
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

  const getCustGbnColor = (gbn: string): string => {
    const colors: Record<string, string> = {
      '1': pastelColors.blue, '2': pastelColors.green, '3': pastelColors.orange, '4': pastelColors.purple, '0': '#d5d8dc'
    };
    return colors[gbn] || colors['0'];
  };

  const getGenderColor = (gender: string): string => {
    const colors: Record<string, string> = { 'M': pastelColors.blue, 'F': pastelColors.pink, 'U': '#d5d8dc' };
    return colors[gender] || colors['U'];
  };

  const getAgeColor = (ageSort: number): string => {
    const colors: Record<number, string> = {
      10: pastelColors.purple, 20: pastelColors.blue, 30: pastelColors.green, 40: pastelColors.orange,
      50: pastelColors.pink, 60: pastelColors.red, 70: pastelColors.teal, 99: '#d5d8dc'
    };
    return colors[ageSort] || '#d5d8dc';
  };

  const maxAgeCnt = useMemo(() => {
    if (!data?.ageData) return 100;
    return Math.max(...data.ageData.map(d => d.CUST_CNT), 1);
  }, [data?.ageData]);

  const maxMonthlyCnt = useMemo(() => {
    if (!data?.monthlyData || data.monthlyData.length === 0) return 1;
    return Math.max(...data.monthlyData.map(d => d.CUST_CNT), 1);
  }, [data?.monthlyData]);

  const totalMonthlyCnt = useMemo(() => {
    if (!data?.monthlyData || data.monthlyData.length === 0) return 0;
    return data.monthlyData.reduce((sum, d) => sum + (d.CUST_CNT || 0), 0);
  }, [data?.monthlyData]);

  const summary = data?.summary;

  return (
    <div className="olm-container order-out-status-page cust-seg-page">
      {/* 상단 섹션 - 고객판매일보와 동일한 구조 */}
      <div className="top-section">
        <h1 className="page-title">
          <PieChart size={14} />
          고객구분현황
        </h1>
        
        {/* 검색 조건 - 고객판매일보와 동일한 구조 */}
        <div className="search-conditions">
          <div className="search-row">
            <div className="search-item">
              <label>가입일(시작)</label>
              <input 
                type="date" 
                className="olm-form-control"
                value={fromDate} 
                onChange={(e) => setFromDate(e.target.value)}
              />
            </div>
            <div className="search-item">
              <label>가입일(종료)</label>
              <input 
                type="date" 
                className="olm-form-control"
                value={toDate} 
                onChange={(e) => setToDate(e.target.value)}
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
                {custGbnList.map((item) => (
                  <option key={item.CUST_GBN} value={item.CUST_GBN}>
                    {item.CUST_GBN_NM}
                  </option>
                ))}
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
                <button 
                  type="button"
                  className="olm-btn olm-btn-primary" 
                  onClick={handleSearch} 
                  disabled={isLoading}
                >
                  <Search size={12} /> {isLoading ? '조회중...' : '조회'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 요약 바 */}
      {summary && (
        <div className="cust-seg-summary-bar">
          <div className="cust-seg-summary-item">
            <span className="cust-seg-summary-label">전체고객</span>
            <span className="cust-seg-summary-value">{formatNumber(summary.TOTAL_CUST_CNT)}</span>
          </div>
          <div className="cust-seg-summary-item male">
            <span className="cust-seg-summary-label">남성</span>
            <span className="cust-seg-summary-value">{formatNumber(summary.MALE_CNT)}</span>
            <span className="cust-seg-summary-ratio">
              ({((summary.MALE_CNT || 0) / Math.max(summary.TOTAL_CUST_CNT || 1, 1) * 100).toFixed(1)}%)
            </span>
          </div>
          <div className="cust-seg-summary-item female">
            <span className="cust-seg-summary-label">여성</span>
            <span className="cust-seg-summary-value">{formatNumber(summary.FEMALE_CNT)}</span>
            <span className="cust-seg-summary-ratio">
              ({((summary.FEMALE_CNT || 0) / Math.max(summary.TOTAL_CUST_CNT || 1, 1) * 100).toFixed(1)}%)
            </span>
          </div>
          <div className="cust-seg-summary-item sms">
            <span className="cust-seg-summary-label">SMS동의</span>
            <span className="cust-seg-summary-value">{formatNumber(summary.SMS_AGREE_CNT)}</span>
            <span className="cust-seg-summary-ratio">
              ({((summary.SMS_AGREE_CNT || 0) / Math.max(summary.TOTAL_CUST_CNT || 1, 1) * 100).toFixed(1)}%)
            </span>
          </div>
        </div>
      )}

      {/* 탭 */}
      <div className="cust-seg-tabs">
        <button 
          className={`cust-seg-tab-btn ${activeTab === 'overview' ? 'active' : ''}`}
          onClick={() => setActiveTab('overview')}
        >
          <BarChart3 size={12} /> 분석현황
        </button>
        <button 
          className={`cust-seg-tab-btn ${activeTab === 'marketing' ? 'active' : ''}`}
          onClick={() => setActiveTab('marketing')}
        >
          <Mail size={12} /> 마케팅동의
        </button>
      </div>

      {/* 로딩 상태 */}
      {isLoading && (
        <div className="cust-seg-loading">
          <div className="cust-seg-loading-spinner"></div>
          데이터를 조회하고 있습니다...
        </div>
      )}

      {/* 에러 상태 */}
      {error && !isLoading && (
        <div className="cust-seg-error">
          <FileText size={20} />
          {error}
        </div>
      )}

      {/* 메인 콘텐츠 */}
      {!isLoading && !error && data && activeTab === 'overview' && (
        <div className="cust-seg-content">
          {/* 왼쪽 패널 - 고객구분 & 성별 */}
          <div className="cust-seg-left-panel">
            {/* 고객구분별 */}
            <div className="cust-seg-chart-card">
              <h3 className="cust-seg-chart-title"><PieChart size={14} /> 고객구분별</h3>
              <div className="cust-seg-donut-container">
                <div className="cust-seg-donut-wrapper">
                  <svg viewBox="0 0 100 100">
                    {data.custGbnData && data.custGbnData.length > 0 ? (
                      (() => {
                        let offset = 0;
                        const circumference = 2 * Math.PI * 40; // 251.33
                        return data.custGbnData.map((item, idx) => {
                          const pct = item.RATIO || 0;
                          const dash = (pct / 100) * circumference;
                          const gap = circumference - dash;
                          const el = (
                            <circle
                              key={idx}
                              cx="50" cy="50" r="40"
                              fill="none"
                              stroke={getCustGbnColor(item.CUST_GBN)}
                              strokeWidth="12"
                              strokeDasharray={`${dash} ${gap}`}
                              strokeDashoffset={-offset}
                              transform="rotate(-90 50 50)"
                            />
                          );
                          offset += dash;
                          return el;
                        });
                      })()
                    ) : (
                      <circle cx="50" cy="50" r="40" fill="none" stroke="#e2e8f0" strokeWidth="12" />
                    )}
                  </svg>
                  <div className="cust-seg-donut-center">
                    <div className="cust-seg-donut-center-value">{formatNumber(summary?.TOTAL_CUST_CNT)}</div>
                    <div className="cust-seg-donut-center-label">전체</div>
                  </div>
                </div>
                <div className="cust-seg-legend">
                  {data.custGbnData?.map((item, idx) => (
                    <div key={idx} className="cust-seg-legend-item">
                      <div className="cust-seg-legend-color" style={{ backgroundColor: getCustGbnColor(item.CUST_GBN) }}></div>
                      <span className="cust-seg-legend-label">{item.CUST_GBN_NM}</span>
                      <span className="cust-seg-legend-value">{formatNumber(item.CUST_CNT)}</span>
                      <span className="cust-seg-legend-ratio">{item.RATIO?.toFixed(1)}%</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* 성별 분포 */}
            <div className="cust-seg-chart-card">
              <h3 className="cust-seg-chart-title"><Users size={14} /> 성별분포</h3>
              <div className="cust-seg-donut-container">
                <div className="cust-seg-donut-wrapper">
                  <svg viewBox="0 0 100 100">
                    {data.genderData && data.genderData.length > 0 ? (
                      (() => {
                        let offset = 0;
                        const circumference = 2 * Math.PI * 40; // 251.33
                        return data.genderData.map((item, idx) => {
                          const pct = item.RATIO || 0;
                          const dash = (pct / 100) * circumference;
                          const gap = circumference - dash;
                          const el = (
                            <circle
                              key={idx}
                              cx="50" cy="50" r="40"
                              fill="none"
                              stroke={getGenderColor(item.GENDER_GBN)}
                              strokeWidth="12"
                              strokeDasharray={`${dash} ${gap}`}
                              strokeDashoffset={-offset}
                              transform="rotate(-90 50 50)"
                            />
                          );
                          offset += dash;
                          return el;
                        });
                      })()
                    ) : (
                      <circle cx="50" cy="50" r="40" fill="none" stroke="#e2e8f0" strokeWidth="12" />
                    )}
                  </svg>
                  <div className="cust-seg-donut-center">
                    <div className="cust-seg-donut-center-value">{formatNumber(summary?.TOTAL_CUST_CNT)}</div>
                    <div className="cust-seg-donut-center-label">전체</div>
                  </div>
                </div>
                <div className="cust-seg-legend">
                  {data.genderData?.map((item, idx) => (
                    <div key={idx} className="cust-seg-legend-item">
                      <div className="cust-seg-legend-color" style={{ backgroundColor: getGenderColor(item.GENDER_GBN) }}></div>
                      <span className="cust-seg-legend-label">{item.GENDER_NM}</span>
                      <span className="cust-seg-legend-value">{formatNumber(item.CUST_CNT)}</span>
                      <span className="cust-seg-legend-ratio">{item.RATIO?.toFixed(1)}%</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* 오른쪽 패널 - 연령대 & 월별 추이 */}
          <div className="cust-seg-right-panel">
            {/* 연령대별 */}
            <div className="cust-seg-chart-card">
              <h3 className="cust-seg-chart-title"><BarChart3 size={14} /> 연령대별</h3>
              <div className="cust-seg-bar-container">
                {data.ageData?.map((item, idx) => (
                  <div key={idx} className="cust-seg-bar-item">
                    <span className="cust-seg-bar-label">{item.AGE_GROUP}</span>
                    <div className="cust-seg-bar-track">
                      <div 
                        className="cust-seg-bar-fill"
                        style={{ 
                          width: `${(item.CUST_CNT / maxAgeCnt) * 100}%`,
                          backgroundColor: getAgeColor(item.AGE_SORT)
                        }}
                      >
                        {(item.CUST_CNT / maxAgeCnt) > 0.2 && <span>{formatNumber(item.CUST_CNT)}</span>}
                      </div>
                    </div>
                    <span className="cust-seg-bar-value">{formatNumber(item.CUST_CNT)}</span>
                    <span className="cust-seg-bar-ratio">{item.RATIO?.toFixed(1)}%</span>
                  </div>
                ))}
              </div>
            </div>

            {/* 월별 추이 */}
            <div className="cust-seg-chart-card">
              <h3 className="cust-seg-chart-title"><TrendingUp size={14} /> 월별가입추이</h3>
              <div className="cust-seg-monthly-container">
                {(!data.monthlyData || data.monthlyData.length === 0) ? (
                  <div className="cust-seg-empty">월별 데이터가 없습니다</div>
                ) : (
                  <>
                    <div className="cust-seg-monthly-legend">
                      <span className="cust-seg-monthly-legend-label">총 가입자</span>
                      <span className="cust-seg-monthly-legend-value">{formatNumber(totalMonthlyCnt)}명</span>
                      <span className="cust-seg-monthly-legend-max">최대: {formatNumber(maxMonthlyCnt)}명/월</span>
                    </div>
                    <div className="cust-seg-monthly-chart">
                      {data.monthlyData.slice(0, 12).reverse().map((item, idx) => {
                        const heightPct = Math.max((item.CUST_CNT / maxMonthlyCnt) * 100, 10);
                        return (
                          <div key={idx} className="cust-seg-monthly-bar-group">
                            <span className="cust-seg-monthly-bar-value">{formatNumber(item.CUST_CNT)}</span>
                            <div 
                              className="cust-seg-monthly-bar"
                              style={{ height: `${heightPct}%` }}
                            >
                              <div className="bar-tooltip">
                                {item.REG_MONTH}: {formatNumber(item.CUST_CNT)}명
                              </div>
                            </div>
                            <span className="cust-seg-monthly-label">
                              {item.REG_MONTH?.substring(5)}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 마케팅 동의 탭 */}
      {!isLoading && !error && data && activeTab === 'marketing' && (
        <div className="cust-seg-marketing-content">
          <div className="cust-seg-chart-card cust-seg-marketing-card">
            <h3 className="cust-seg-chart-title"><Mail size={14} /> 마케팅 동의 현황</h3>
            <div className="cust-seg-marketing-grid">
              {data.marketingData?.map((item, idx) => (
                <div key={idx} className={`cust-seg-marketing-item ${item.CHANNEL.toLowerCase()}`}>
                  <div className="channel-icon">
                    {item.CHANNEL === 'SMS' && <><MessageSquare size={18} /> SMS</>}
                    {item.CHANNEL === 'EMAIL' && <><Mail size={18} /> 이메일</>}
                    {item.CHANNEL === 'DM' && <><FileText size={18} /> DM</>}
                    {item.CHANNEL === 'CALL' && <><Phone size={18} /> 전화</>}
                  </div>
                  <div className="ratio-value">{item.AGREE_RATIO?.toFixed(1)}%</div>
                  <div className="count-value">
                    {formatNumber(item.AGREE_CNT)} / {formatNumber(item.TOTAL_CNT)}명
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CustomerSegmentStatus;
