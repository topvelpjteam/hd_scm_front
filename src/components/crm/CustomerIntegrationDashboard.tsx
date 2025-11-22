import React from 'react';
import { 
  Users, 
  TrendingUp, 
  Smartphone, 
  Monitor, 
  Store, 
  ShoppingBag,
  ArrowUpRight,
  ArrowDownRight,
  Activity
} from 'lucide-react';
import './CustomerIntegrationDashboard.css';

interface ChannelData {
  channel: string;
  totalCustomers: number;
  newCustomers: number;
  growthRate: number;
  conversionRate: number;
  revenue: number;
  icon: React.ReactNode;
  color: string;
}

interface IntegrationMetrics {
  totalIntegratedCustomers: number;
  duplicateCustomers: number;
  integrationRate: number;
  dataQuality: number;
}

const CustomerIntegrationDashboard: React.FC = () => {
  // 채널별 고객 데이터 (일관성 있는 샘플 데이터)
  const channelData: ChannelData[] = [
    {
      channel: '모바일 앱',
      totalCustomers: 15420,
      newCustomers: 1240,
      growthRate: 8.7,
      conversionRate: 12.3,
      revenue: 2845000000,
      icon: <Smartphone className="w-6 h-6" />,
      color: '#3B82F6'
    },
    {
      channel: '웹사이트',
      totalCustomers: 18500,
      newCustomers: 1240,
      growthRate: 7.4,
      conversionRate: 9.8,
      revenue: 3850000000,
      icon: <Monitor className="w-6 h-6" />,
      color: '#10B981'
    },
    {
      channel: '직영점',
      totalCustomers: 8750,
      newCustomers: 520,
      growthRate: 6.3,
      conversionRate: 15.2,
      revenue: 1890000000,
      icon: <Store className="w-6 h-6" />,
      color: '#F59E0B'
    },
    {
      channel: '대리점',
      totalCustomers: 6520,
      newCustomers: 380,
      growthRate: 6.2,
      conversionRate: 11.5,
      revenue: 1420000000,
      icon: <ShoppingBag className="w-6 h-6" />,
      color: '#EF4444'
    }
  ];

  // 통합 메트릭스
  const integrationMetrics: IntegrationMetrics = {
    totalIntegratedCustomers: 43540,
    duplicateCustomers: 1240,
    integrationRate: 94.2,
    dataQuality: 87.5
  };

  // 월별 고객 유입 추이 (최근 6개월) - 더 명확한 차이를 위한 데이터
  const monthlyTrend = [
    { month: '8월', total: 6800, new: 320, color: '#3B82F6', trend: 'up' },
    { month: '9월', total: 7200, new: 480, color: '#10B981', trend: 'up' },
    { month: '10월', total: 7800, new: 640, color: '#F59E0B', trend: 'up' },
    { month: '11월', total: 8200, new: 780, color: '#EF4444', trend: 'up' },
    { month: '12월', total: 8600, new: 920, color: '#8B5CF6', trend: 'up' },
    { month: '1월', total: 9100, new: 1080, color: '#06B6D4', trend: 'up' }
  ];

  // 통합 품질 지표 - 더 풍부한 아이콘과 상태 정보
  const qualityMetrics = [
    { 
      label: '이메일 정확도', 
      value: 92.5, 
      color: '#10B981',
      icon: '📧',
      status: 'excellent'
    },
    { 
      label: '전화번호 정확도', 
      value: 89.3, 
      color: '#3B82F6',
      icon: '📱',
      status: 'good'
    },
    { 
      label: '주소 정확도', 
      value: 85.7, 
      color: '#F59E0B',
      icon: '📍',
      status: 'good'
    },
    { 
      label: '중복 제거율', 
      value: 94.2, 
      color: '#EF4444',
      icon: '🔄',
      status: 'excellent'
    }
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

  // 색상 밝기 조정 함수
  const adjustColorBrightness = (color: string, amount: number): string => {
    const hex = color.replace('#', '');
    const r = Math.max(0, Math.min(255, parseInt(hex.substr(0, 2), 16) + amount));
    const g = Math.max(0, Math.min(255, parseInt(hex.substr(2, 2), 16) + amount));
    const b = Math.max(0, Math.min(255, parseInt(hex.substr(4, 2), 16) + amount));
    return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
  };

  return (
    <div className="customer-integration-dashboard">
      <div className="dashboard-header">
        <div className="header-title">
          <Users className="w-8 h-8 text-blue-600" />
          <h1>고객 통합 대시보드</h1>
        </div>
        <div className="header-subtitle">
          채널별 고객 유입 및 통합 현황
        </div>
      </div>

      {/* 전체 요약 카드 */}
      <div className="summary-cards">
        <div className="summary-card total-customers">
          <div className="card-icon">
            <Users className="w-8 h-8" />
          </div>
          <div className="card-content">
            <h3>전체 고객 수</h3>
            <div className="card-value">{formatNumber(integrationMetrics.totalIntegratedCustomers)}</div>
            <div className="card-change positive">
              <ArrowUpRight className="w-4 h-4" />
              <span>+12.5%</span>
            </div>
          </div>
        </div>

        <div className="summary-card integration-rate">
          <div className="card-icon">
            <Activity className="w-8 h-8" />
          </div>
          <div className="card-content">
            <h3>통합률</h3>
            <div className="card-value">{integrationMetrics.integrationRate}%</div>
            <div className="card-change positive">
              <ArrowUpRight className="w-4 h-4" />
              <span>+2.1%</span>
            </div>
          </div>
        </div>

        <div className="summary-card duplicate-removal">
          <div className="card-icon">
            <TrendingUp className="w-8 h-8" />
          </div>
          <div className="card-content">
            <h3>중복 제거</h3>
            <div className="card-value">{formatNumber(integrationMetrics.duplicateCustomers)}</div>
            <div className="card-change positive">
              <ArrowUpRight className="w-4 h-4" />
              <span>+8.3%</span>
            </div>
          </div>
        </div>

        <div className="summary-card data-quality">
          <div className="card-icon">
            <Monitor className="w-8 h-8" />
          </div>
          <div className="card-content">
            <h3>데이터 품질</h3>
            <div className="card-value">{integrationMetrics.dataQuality}%</div>
            <div className="card-change negative">
              <ArrowDownRight className="w-4 h-4" />
              <span>-1.2%</span>
            </div>
          </div>
        </div>
      </div>

      {/* 채널별 상세 분석 */}
      <div className="channel-analysis">
        <h2>채널별 고객 현황</h2>
        <div className="channel-cards">
          {channelData.map((channel, index) => (
            <div key={index} className="channel-card">
              <div className="channel-header">
                <div className="channel-icon" style={{ backgroundColor: channel.color }}>
                  {channel.icon}
                </div>
                <div className="channel-info">
                  <h3>{channel.channel}</h3>
                  <div className="channel-growth">
                    <span className="growth-rate">
                      {channel.growthRate > 0 ? (
                        <ArrowUpRight className="w-4 h-4 text-green-500" />
                      ) : (
                        <ArrowDownRight className="w-4 h-4 text-red-500" />
                      )}
                      {Math.abs(channel.growthRate)}%
                    </span>
                  </div>
                </div>
              </div>
              
              <div className="channel-metrics">
                <div className="metric-row">
                  <span className="metric-label">총 고객 수</span>
                  <span className="metric-value">{formatNumber(channel.totalCustomers)}</span>
                </div>
                <div className="metric-row">
                  <span className="metric-label">신규 고객</span>
                  <span className="metric-value">{formatNumber(channel.newCustomers)}</span>
                </div>
                <div className="metric-row">
                  <span className="metric-label">전환율</span>
                  <span className="metric-value">{channel.conversionRate}%</span>
                </div>
                <div className="metric-row">
                  <span className="metric-label">매출</span>
                  <span className="metric-value">{formatCurrency(channel.revenue)}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 월별 추이 및 품질 지표 */}
      <div className="trend-and-quality">
        <div className="trend-section">
          <h3>월별 고객 유입 추이</h3>
          
          {/* 왼쪽 차트 영역 */}
          <div className="trend-chart-container">
            <div className="trend-chart-visual">
              <div className="chart-bars">
                {monthlyTrend.map((data, index) => {
                  const maxValue = Math.max(...monthlyTrend.map(item => item.new));
                  const minValue = Math.min(...monthlyTrend.map(item => item.new));
                  // 최소값을 기준으로 한 상대적 비율 계산 - 더 극적인 차이
                  const relativePercentage = ((data.new - minValue) / (maxValue - minValue)) * 80 + 15;
                  return (
                    <div key={index} className="chart-bar-item">
                      <div className="chart-bar-label">{data.month}</div>
                      <div 
                        className="chart-bar"
                        style={{
                          height: `${relativePercentage}%`,
                          background: `linear-gradient(135deg, ${data.color} 0%, ${adjustColorBrightness(data.color, -20)} 100%)`
                        }}
                      ></div>
                      <div className="chart-bar-value">{formatNumber(data.new)}</div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* 오른쪽 데이터 목록 */}
          <div className="trend-data-list">
            {monthlyTrend.map((data, index) => {
              const maxValue = Math.max(...monthlyTrend.map(item => item.new));
              const percentage = (data.new / maxValue) * 100;
              return (
                <div key={index} className="trend-item">
                  <div className="trend-label">{data.month}</div>
                  <div className="trend-progress">
                    <div 
                      className="trend-progress-fill" 
                      style={{ 
                        width: `${percentage}%`,
                        background: `linear-gradient(135deg, ${data.color} 0%, ${adjustColorBrightness(data.color, -20)} 100%)`
                      }}
                    ></div>
                  </div>
                  <div className="trend-value">
                    {formatNumber(data.new)}
                    <span style={{ color: data.color, fontSize: '12px', marginLeft: '4px' }}>
                      {data.trend === 'up' ? '↗' : '↘'}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="quality-section">
          <h3>데이터 품질 지표</h3>
          <div className="quality-metrics">
            {qualityMetrics.map((metric, index) => (
              <div key={index} className="quality-item">
                <div className="quality-label">
                  <span style={{ marginRight: '8px', fontSize: '16px' }}>{metric.icon}</span>
                  {metric.label}
                  <span style={{ 
                    marginLeft: '8px', 
                    fontSize: '11px', 
                    padding: '2px 6px', 
                    borderRadius: '4px',
                    backgroundColor: metric.status === 'excellent' ? '#dcfce7' : '#dbeafe',
                    color: metric.status === 'excellent' ? '#166534' : '#1e40af'
                  }}>
                    {metric.status === 'excellent' ? '우수' : '양호'}
                  </span>
                </div>
                <div className="quality-progress">
                  <div 
                    className="quality-progress-fill"
                    style={{ 
                      width: `${metric.value}%`,
                      background: `linear-gradient(135deg, ${metric.color} 0%, ${adjustColorBrightness(metric.color, -20)} 100%)`
                    }}
                  ></div>
                </div>
                <div className="quality-value">
                  {metric.value}%
                  <span style={{ color: metric.color, fontSize: '12px', marginLeft: '4px' }}>
                    {metric.value >= 90 ? '⭐' : metric.value >= 80 ? '👍' : '⚠️'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 채널별 매출 비교 */}
      <div className="revenue-comparison">
        <h3>채널별 매출 비교</h3>
        <div className="revenue-table">
          <table className="channel-table">
            <thead>
              <tr>
                <th>채널</th>
                <th>총 고객 수</th>
                <th>신규 고객</th>
                <th>성장률</th>
                <th>전환율</th>
                <th>매출</th>
                <th>비율</th>
              </tr>
            </thead>
            <tbody>
              {channelData.map((channel, index) => {
                const maxRevenue = Math.max(...channelData.map(c => c.revenue));
                const percentage = (channel.revenue / maxRevenue) * 100;
                
                return (
                  <tr key={index} className="channel-row">
                    <td className="channel-name">
                      <div className="channel-info">
                        <div className="channel-icon" style={{ backgroundColor: channel.color }}>
                          {channel.icon}
                        </div>
                        <span>{channel.channel}</span>
                      </div>
                    </td>
                    <td className="channel-customers">{formatNumber(channel.totalCustomers)}명</td>
                    <td className="channel-new">{formatNumber(channel.newCustomers)}명</td>
                    <td className="channel-growth">
                      <span className={`growth-rate ${channel.growthRate > 0 ? 'positive' : 'negative'}`}>
                        {channel.growthRate > 0 ? '+' : ''}{channel.growthRate}%
                      </span>
                    </td>
                    <td className="channel-conversion">{channel.conversionRate}%</td>
                    <td className="channel-revenue">{formatCurrency(channel.revenue)}</td>
                    <td className="channel-percentage">
                      <div className="percentage-bar">
                        <div 
                          className="percentage-fill" 
                          style={{ 
                            width: `${percentage}%`,
                            backgroundColor: channel.color
                          }}
                        ></div>
                        <span className="percentage-text">{percentage.toFixed(1)}%</span>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default CustomerIntegrationDashboard;
