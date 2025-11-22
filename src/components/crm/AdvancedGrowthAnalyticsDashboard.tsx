import React, { useState } from 'react';
import { 
  TrendingUp, 
  Users,
  Target,
  ArrowUpRight,
  ArrowDownRight,
  Activity,
  Building2
} from 'lucide-react';
import './AdvancedGrowthAnalyticsDashboard.css';

interface GrowthData {
  period: string;
  currentValue: number;
  previousValue: number;
  growthRate: number;
  absoluteGrowth: number;
  trend: 'up' | 'down' | 'stable';
  confidence: number;
}

interface RegionalGrowthData {
  region: string;
  revenue: number;
  growthRate: number;
  marketShare: number;
  customerCount: number;
  avgOrderValue: number;
  color: string;
  coordinates: { x: number; y: number };
}

interface ChannelGrowthData {
  channel: string;
  currentPeriod: number;
  previousPeriod: number;
  growthRate: number;
  marketShare: number;
  customerGrowth: number;
  orderGrowth: number;
  color: string;
}

interface DemographicGrowthData {
  category: string;
  value: string;
  currentRevenue: number;
  previousRevenue: number;
  growthRate: number;
  customerCount: number;
  avgOrderValue: number;
  color: string;
}

const AdvancedGrowthAnalyticsDashboard: React.FC = () => {
  const [selectedPeriod, setSelectedPeriod] = useState('12months');
  const [selectedMetric, setSelectedMetric] = useState('revenue');

  // 기간별 매출 성장 데이터 (최근 5년)
  const periodGrowthData: GrowthData[] = [
    { period: '2024 Q1', currentValue: 12800000000, previousValue: 11500000000, growthRate: 11.3, absoluteGrowth: 1300000000, trend: 'up', confidence: 95 },
    { period: '2023 Q4', currentValue: 11500000000, previousValue: 10800000000, growthRate: 6.5, absoluteGrowth: 700000000, trend: 'up', confidence: 92 },
    { period: '2023 Q3', currentValue: 10800000000, previousValue: 10200000000, growthRate: 5.9, absoluteGrowth: 600000000, trend: 'up', confidence: 89 },
    { period: '2023 Q2', currentValue: 10200000000, previousValue: 9800000000, growthRate: 4.1, absoluteGrowth: 400000000, trend: 'up', confidence: 87 },
    { period: '2023 Q1', currentValue: 9800000000, previousValue: 9500000000, growthRate: 3.2, absoluteGrowth: 300000000, trend: 'up', confidence: 85 }
  ];

  // 채널별 성장 데이터
  const channelGrowthData: ChannelGrowthData[] = [
    { channel: '직영점', currentPeriod: 2840000000, previousPeriod: 2450000000, growthRate: 15.9, marketShare: 32.5, customerGrowth: 18.2, orderGrowth: 22.1, color: '#3B82F6' },
    { channel: '대리점', currentPeriod: 1980000000, previousPeriod: 1820000000, growthRate: 8.8, marketShare: 22.7, customerGrowth: 12.5, orderGrowth: 15.3, color: '#10B981' },
    { channel: '자사 쇼핑몰', currentPeriod: 3420000000, previousPeriod: 2890000000, growthRate: 18.3, marketShare: 39.2, customerGrowth: 25.7, orderGrowth: 28.9, color: '#F59E0B' },
    { channel: '모바일 앱', currentPeriod: 1560000000, previousPeriod: 1240000000, growthRate: 25.8, marketShare: 17.9, customerGrowth: 31.2, orderGrowth: 35.4, color: '#8B5CF6' },
    { channel: '외부 쇼핑몰', currentPeriod: 890000000, previousPeriod: 780000000, growthRate: 14.1, marketShare: 10.2, customerGrowth: 16.8, orderGrowth: 19.2, color: '#EF4444' },
    { channel: '전화주문', currentPeriod: 420000000, previousPeriod: 450000000, growthRate: -6.7, marketShare: 4.8, customerGrowth: -8.2, orderGrowth: -5.1, color: '#06B6D4' }
  ];

  // 지역별 성장 데이터
  const regionalGrowthData: RegionalGrowthData[] = [
    { region: '서울', revenue: 3420000000, growthRate: 18.5, marketShare: 39.2, customerCount: 45600, avgOrderValue: 75000, color: '#3B82F6', coordinates: { x: 50, y: 30 } },
    { region: '경기', revenue: 1890000000, growthRate: 15.2, marketShare: 21.7, customerCount: 28400, avgOrderValue: 66500, color: '#10B981', coordinates: { x: 45, y: 35 } },
    { region: '인천', revenue: 890000000, growthRate: 12.8, marketShare: 10.2, customerCount: 15600, avgOrderValue: 57000, color: '#F59E0B', coordinates: { x: 40, y: 32 } },
    { region: '부산', revenue: 780000000, growthRate: 14.7, marketShare: 8.9, customerCount: 12800, avgOrderValue: 61000, color: '#8B5CF6', coordinates: { x: 75, y: 75 } },
    { region: '대구', revenue: 560000000, growthRate: 11.3, marketShare: 6.4, customerCount: 9800, avgOrderValue: 57100, color: '#EF4444', coordinates: { x: 70, y: 65 } },
    { region: '광주', revenue: 420000000, growthRate: 9.8, marketShare: 4.8, customerCount: 7200, avgOrderValue: 58300, color: '#06B6D4', coordinates: { x: 35, y: 80 } },
    { region: '대전', revenue: 380000000, growthRate: 13.2, marketShare: 4.4, customerCount: 6800, avgOrderValue: 55900, color: '#84CC16', coordinates: { x: 55, y: 55 } },
    { region: '울산', revenue: 290000000, growthRate: 8.9, marketShare: 3.3, customerCount: 5200, avgOrderValue: 55800, color: '#F97316', coordinates: { x: 80, y: 70 } },
    { region: '기타', revenue: 890000000, growthRate: 16.7, marketShare: 10.2, customerCount: 15200, avgOrderValue: 58500, color: '#8B5CF6', coordinates: { x: 25, y: 50 } }
  ];

  // 연령대별 성장 데이터
  const ageGroupGrowthData: DemographicGrowthData[] = [
    { category: 'age', value: '20대', currentRevenue: 1890000000, previousRevenue: 1580000000, growthRate: 19.6, customerCount: 12400, avgOrderValue: 152400, color: '#3B82F6' },
    { category: 'age', value: '30대', currentRevenue: 2340000000, previousRevenue: 1980000000, growthRate: 18.2, customerCount: 15600, avgOrderValue: 150000, color: '#10B981' },
    { category: 'age', value: '40대', currentRevenue: 1780000000, previousRevenue: 1520000000, growthRate: 17.1, customerCount: 9800, avgOrderValue: 181600, color: '#F59E0B' },
    { category: 'age', value: '50대', currentRevenue: 890000000, previousRevenue: 780000000, growthRate: 14.1, customerCount: 4200, avgOrderValue: 211900, color: '#8B5CF6' },
    { category: 'age', value: '60대+', currentRevenue: 320000000, previousRevenue: 290000000, growthRate: 10.3, customerCount: 1600, avgOrderValue: 200000, color: '#EF4444' }
  ];

  // 성별 성장 데이터
  const genderGrowthData: DemographicGrowthData[] = [
    { category: 'gender', value: '남성', currentRevenue: 2980000000, previousRevenue: 2560000000, growthRate: 16.4, customerCount: 18600, avgOrderValue: 160200, color: '#3B82F6' },
    { category: 'gender', value: '여성', currentRevenue: 4150000000, previousRevenue: 3520000000, growthRate: 17.9, customerCount: 24800, avgOrderValue: 167300, color: '#EC4899' }
  ];

  const formatNumber = (num: number): string => {
    if (num >= 1000000000) {
      return (num / 1000000000).toFixed(1) + 'B';
    } else if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    } else if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
  };

  const formatCurrency = (num: number): string => {
    return new Intl.NumberFormat('ko-KR', {
      style: 'currency',
      currency: 'KRW',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(num);
  };

  const getGrowthIcon = (trend: string) => {
    switch (trend) {
      case 'up':
        return <ArrowUpRight className="w-4 h-4 text-green-500" />;
      case 'down':
        return <ArrowDownRight className="w-4 h-4 text-red-500" />;
      default:
        return <Activity className="w-4 h-4 text-gray-500" />;
    }
  };

  const getGrowthColor = (growthRate: number) => {
    if (growthRate > 15) return '#059669';
    if (growthRate > 10) return '#10B981';
    if (growthRate > 5) return '#F59E0B';
    if (growthRate > 0) return '#EF4444';
    return '#6B7280';
  };

  return (
    <div className="advanced-growth-analytics-dashboard">
      <div className="dashboard-header">
        <div className="header-title">
          <TrendingUp className="w-8 h-8 text-emerald-600" />
          <h1>성장률 분석 대시보드</h1>
        </div>
        <div className="header-subtitle">
          기간별, 채널별, 연도별, 연령, 성별, 지역별 매출 성장율 분석
        </div>
        
        <div className="header-controls">
          <div className="control-group">
            <label>분석 기간</label>
            <select 
              value={selectedPeriod} 
              onChange={(e) => setSelectedPeriod(e.target.value)}
              className="period-selector"
            >
              <option value="12months">최근 12개월</option>
              <option value="24months">최근 24개월</option>
              <option value="5years">최근 5년</option>
              <option value="quarterly">분기별</option>
            </select>
          </div>
          
          <div className="control-group">
            <label>분석 지표</label>
            <select 
              value={selectedMetric} 
              onChange={(e) => setSelectedMetric(e.target.value)}
              className="metric-selector"
            >
              <option value="revenue">매출</option>
              <option value="orders">주문 수</option>
              <option value="customers">고객 수</option>
              <option value="aov">평균 주문액</option>
            </select>
          </div>
        </div>
      </div>

      {/* 핵심 성장 지표 */}
      <div className="growth-summary">
        <div className="summary-card total-growth">
          <div className="card-icon">
            <TrendingUp className="w-8 h-8" />
          </div>
          <div className="card-content">
            <h3>전체 성장률</h3>
            <div className="card-value">+18.5%</div>
            <div className="card-change positive">
              <ArrowUpRight className="w-4 h-4" />
              <span>전년 대비</span>
            </div>
          </div>
        </div>

        <div className="summary-card revenue-growth">
          <div className="card-icon">
            <span className="text-2xl font-bold text-blue-600">₩</span>
          </div>
          <div className="card-content">
            <h3>매출 성장</h3>
            <div className="card-value">+₩7.1B</div>
            <div className="card-change positive">
              <ArrowUpRight className="w-4 h-4" />
              <span>절대 성장</span>
            </div>
          </div>
        </div>

        <div className="summary-card customer-growth">
          <div className="card-icon">
            <Users className="w-8 h-8" />
          </div>
          <div className="card-content">
            <h3>고객 성장</h3>
            <div className="card-value">+25.3%</div>
            <div className="card-change positive">
              <ArrowUpRight className="w-4 h-4" />
              <span>신규 고객</span>
            </div>
          </div>
        </div>

        <div className="summary-card market-share">
          <div className="card-icon">
            <Target className="w-8 h-8" />
          </div>
          <div className="card-content">
            <h3>시장점유율</h3>
            <div className="card-value">12.8%</div>
            <div className="card-change positive">
              <ArrowUpRight className="w-4 h-4" />
              <span>+1.2%p</span>
            </div>
          </div>
        </div>
      </div>

      {/* 기간별 성장 추이 */}
      <div className="period-growth-analysis">
        <h2>기간별 성장 추이</h2>
        <div className="growth-timeline">
          {periodGrowthData.map((period, index) => (
            <div key={index} className="period-card">
              <div className="period-header">
                <h3>{period.period}</h3>
                <div className="confidence-badge">
                  <span>신뢰도: {period.confidence}%</span>
                </div>
              </div>
              
              <div className="period-metrics">
                <div className="metric-row">
                  <span className="metric-label">현재 매출</span>
                  <span className="metric-value">{formatCurrency(period.currentValue)}</span>
                </div>
                <div className="metric-row">
                  <span className="metric-label">이전 매출</span>
                  <span className="metric-value">{formatCurrency(period.previousValue)}</span>
                </div>
                <div className="metric-row">
                  <span className="metric-label">성장률</span>
                  <span className={`metric-value growth ${period.trend}`} style={{ color: getGrowthColor(period.growthRate) }}>
                    {getGrowthIcon(period.trend)}
                    {period.growthRate}%
                  </span>
                </div>
                <div className="metric-row">
                  <span className="metric-label">절대 성장</span>
                  <span className="metric-value">{formatCurrency(period.absoluteGrowth)}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 채널별 성장 분석 */}
      <div className="channel-growth-analysis">
        <h2>채널별 성장 분석</h2>
        <div className="channel-growth-grid">
          {channelGrowthData.map((channel, index) => (
            <div key={index} className="channel-growth-card">
              <div className="channel-header">
                <div className="channel-icon" style={{ backgroundColor: channel.color }}>
                  <Building2 className="w-5 h-5" />
                </div>
                <div className="channel-info">
                  <h3>{channel.channel}</h3>
                  <span className="market-share">{channel.marketShare}% 시장점유율</span>
                </div>
                <div className="growth-rate" style={{ color: getGrowthColor(channel.growthRate) }}>
                  {getGrowthIcon(channel.growthRate > 0 ? 'up' : 'down')}
                  {channel.growthRate}%
                </div>
              </div>

              <div className="channel-metrics">
                <div className="metric-grid">
                  <div className="metric-item">
                    <span className="metric-label">현재 매출</span>
                    <span className="metric-value">{formatCurrency(channel.currentPeriod)}</span>
                  </div>
                  <div className="metric-item">
                    <span className="metric-label">이전 매출</span>
                    <span className="metric-value">{formatCurrency(channel.previousPeriod)}</span>
                  </div>
                  <div className="metric-item">
                    <span className="metric-label">고객 성장</span>
                    <span className="metric-value">{channel.customerGrowth}%</span>
                  </div>
                  <div className="metric-item">
                    <span className="metric-label">주문 성장</span>
                    <span className="metric-value">{channel.orderGrowth}%</span>
                  </div>
                </div>

                <div className="growth-chart">
                  <div className="chart-bar">
                    <div 
                      className="bar-fill" 
                      style={{ 
                        width: `${Math.min(channel.growthRate * 2, 100)}%`,
                        backgroundColor: channel.color
                      }}
                    ></div>
                  </div>
                  <span className="chart-label">성장률: {channel.growthRate}%</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 지역별 성장 분석 */}
      <div className="regional-growth-analysis">
        <h2>지역별 성장 분석</h2>
        <div className="regional-content">
          <div className="regional-map">
            <div className="map-container">
              {regionalGrowthData.map((region, index) => (
                <div 
                  key={index} 
                  className="region-marker"
                  style={{ 
                    left: `${region.coordinates.x}%`, 
                    top: `${region.coordinates.y}%`,
                    backgroundColor: region.color
                  }}
                  title={`${region.region}: ${region.growthRate}% 성장`}
                >
                  <span className="marker-label">{region.region}</span>
                  <span className="marker-growth">{region.growthRate}%</span>
                </div>
              ))}
            </div>
          </div>

          <div className="regional-stats">
            {regionalGrowthData.map((region, index) => (
              <div key={index} className="region-stat-card">
                <div className="region-header">
                  <div className="region-color" style={{ backgroundColor: region.color }}></div>
                  <h3>{region.region}</h3>
                  <span className="growth-rate" style={{ color: getGrowthColor(region.growthRate) }}>
                    {getGrowthIcon(region.growthRate > 0 ? 'up' : 'down')}
                    {region.growthRate}%
                  </span>
                </div>
                
                <div className="region-metrics">
                  <div className="metric-row">
                    <span className="metric-label">매출</span>
                    <span className="metric-value">{formatCurrency(region.revenue)}</span>
                  </div>
                  <div className="metric-row">
                    <span className="metric-label">고객 수</span>
                    <span className="metric-value">{formatNumber(region.customerCount)}</span>
                  </div>
                  <div className="metric-row">
                    <span className="metric-label">평균 주문액</span>
                    <span className="metric-value">{formatCurrency(region.avgOrderValue)}</span>
                  </div>
                  <div className="metric-row">
                    <span className="metric-label">시장점유율</span>
                    <span className="metric-value">{region.marketShare}%</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 인구통계별 성장 분석 */}
      <div className="demographic-growth-analysis">
        <h2>인구통계별 성장 분석</h2>
        
        <div className="demographic-sections">
          <div className="age-group-analysis">
            <h3>연령대별 성장</h3>
            <div className="age-group-chart">
              {ageGroupGrowthData.map((age, index) => (
                <div key={index} className="age-group-bar">
                  <div className="bar-group">
                    <div 
                      className="current-bar"
                      style={{ 
                        height: `${(age.currentRevenue / 2500000000) * 100}%`,
                        backgroundColor: age.color
                      }}
                    ></div>
                    <div 
                      className="previous-bar"
                      style={{ 
                        height: `${(age.previousRevenue / 2500000000) * 100}%`,
                        backgroundColor: age.color,
                        opacity: 0.6
                      }}
                    ></div>
                  </div>
                  <div className="bar-label">{age.value}</div>
                  <div className="bar-growth" style={{ color: getGrowthColor(age.growthRate) }}>
                    {age.growthRate}%
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="gender-analysis">
            <h3>성별 성장</h3>
            <div className="gender-growth-cards">
              {genderGrowthData.map((gender, index) => (
                <div key={index} className="gender-growth-card">
                  <div className="gender-header">
                    <div className="gender-icon" style={{ backgroundColor: gender.color }}>
                      <Users className="w-6 h-6" />
                    </div>
                    <div className="gender-info">
                      <h4>{gender.value}</h4>
                      <span className="growth-rate" style={{ color: getGrowthColor(gender.growthRate) }}>
                        {getGrowthIcon(gender.growthRate > 0 ? 'up' : 'down')}
                        {gender.growthRate}%
                      </span>
                    </div>
                  </div>
                  
                  <div className="gender-metrics">
                    <div className="metric-row">
                      <span className="metric-label">현재 매출</span>
                      <span className="metric-value">{formatCurrency(gender.currentRevenue)}</span>
                    </div>
                    <div className="metric-row">
                      <span className="metric-label">이전 매출</span>
                      <span className="metric-value">{formatCurrency(gender.previousRevenue)}</span>
                    </div>
                    <div className="metric-row">
                      <span className="metric-label">고객 수</span>
                      <span className="metric-value">{formatNumber(gender.customerCount)}</span>
                    </div>
                    <div className="metric-row">
                      <span className="metric-label">평균 주문액</span>
                      <span className="metric-value">{formatCurrency(gender.avgOrderValue)}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* 성장률 분포 분석 */}
      <div className="growth-distribution-analysis">
        <h2>성장률 분포 분석</h2>
        <div className="distribution-charts">
          <div className="growth-histogram">
            <h3>성장률 히스토그램</h3>
            <div className="histogram-chart">
              {[0, 5, 10, 15, 20, 25].map((range, index) => (
                <div key={index} className="histogram-bar">
                  <div 
                    className="bar-fill"
                    style={{ 
                      height: `${[15, 25, 35, 20, 4, 1][index] * 2}px`,
                      backgroundColor: range > 15 ? '#059669' : range > 10 ? '#10B981' : range > 5 ? '#F59E0B' : '#EF4444'
                    }}
                  ></div>
                  <div className="bar-label">{range}-{range + 5}%</div>
                </div>
              ))}
            </div>
          </div>

          <div className="growth-correlation">
            <h3>성장률 상관관계</h3>
            <div className="correlation-matrix">
              <div className="matrix-header">
                <span>매출</span>
                <span>고객</span>
                <span>주문</span>
                <span>채널</span>
              </div>
              <div className="matrix-row">
                <span className="row-label">매출</span>
                <div className="correlation-cell high">1.00</div>
                <div className="correlation-cell medium">0.78</div>
                <div className="correlation-cell medium">0.82</div>
                <div className="correlation-cell low">0.45</div>
              </div>
              <div className="matrix-row">
                <span className="row-label">고객</span>
                <div className="correlation-cell medium">0.78</div>
                <div className="correlation-cell high">1.00</div>
                <div className="correlation-cell high">0.89</div>
                <div className="correlation-cell medium">0.67</div>
              </div>
              <div className="matrix-row">
                <span className="row-label">주문</span>
                <div className="correlation-cell medium">0.82</div>
                <div className="correlation-cell high">0.89</div>
                <div className="correlation-cell high">1.00</div>
                <div className="correlation-cell medium">0.71</div>
              </div>
              <div className="matrix-row">
                <span className="row-label">채널</span>
                <div className="correlation-cell low">0.45</div>
                <div className="correlation-cell medium">0.67</div>
                <div className="correlation-cell medium">0.71</div>
                <div className="correlation-cell high">1.00</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdvancedGrowthAnalyticsDashboard;
