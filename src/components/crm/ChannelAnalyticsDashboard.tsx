import React from 'react';
import { 
  Store, 
  ShoppingBag, 
  Monitor, 
  Smartphone, 
  TrendingUp, 
  Target,
  BarChart3,
  PieChart,
  ArrowUpRight,
  ArrowDownRight,
  Users,
  Package,
  CreditCard,
  MapPin,
  Globe,
  Headphones
} from 'lucide-react';
import './ChannelAnalyticsDashboard.css';

interface ChannelData {
  id: string;
  name: string;
  type: 'direct' | 'franchise' | 'online' | 'external';
  description: string;
  revenue: number;
  orders: number;
  averageOrderValue: number;
  growthRate: number;
  customerCount: number;
  conversionRate: number;
  marketShare: number;
  color: string;
  icon: React.ReactNode;
  status: 'active' | 'inactive' | 'maintenance';
}

interface ChannelMetrics {
  totalChannels: number;
  totalRevenue: number;
  totalOrders: number;
  averageOrderValue: number;
  totalCustomers: number;
  growthRate: number;
  conversionRate: number;
}

interface MonthlyChannelPerformance {
  month: string;
  directStore: number;
  franchise: number;
  ownMall: number;
  externalMall: number;
  mobileApp: number;
  website: number;
}

interface ChannelComparison {
  channel: string;
  revenue: number;
  orders: number;
  customers: number;
  satisfaction: number;
  returnRate: number;
  averageDeliveryTime: number;
}

const ChannelAnalyticsDashboard: React.FC = () => {
  // 채널 데이터 (일관성 있는 샘플 데이터)
  const channelData: ChannelData[] = [
    {
      id: '1',
      name: '직영점',
      type: 'direct',
      description: '본사 직영 매장',
      revenue: 2840000000,
      orders: 7850,
      averageOrderValue: 362000,
      growthRate: 18.5,
      customerCount: 12400,
      conversionRate: 78.2,
      marketShare: 32.5,
      color: '#3B82F6',
      icon: <Store className="w-6 h-6" />,
      status: 'active'
    },
    {
      id: '2',
      name: '대리점',
      type: 'franchise',
      description: '가맹점 및 대리점',
      revenue: 1980000000,
      orders: 5420,
      averageOrderValue: 365000,
      growthRate: 12.3,
      customerCount: 8900,
      conversionRate: 72.8,
      marketShare: 22.7,
      color: '#10B981',
      icon: <ShoppingBag className="w-6 h-6" />,
      status: 'active'
    },
    {
      id: '3',
      name: '자사 쇼핑몰',
      type: 'online',
      description: '공식 온라인 쇼핑몰',
      revenue: 3420000000,
      orders: 12850,
      averageOrderValue: 266000,
      growthRate: 28.7,
      customerCount: 18900,
      conversionRate: 65.4,
      marketShare: 39.2,
      color: '#F59E0B',
      icon: <Monitor className="w-6 h-6" />,
      status: 'active'
    },
    {
      id: '4',
      name: '모바일 앱',
      type: 'online',
      description: '모바일 애플리케이션',
      revenue: 1560000000,
      orders: 6800,
      averageOrderValue: 229000,
      growthRate: 35.2,
      customerCount: 15600,
      conversionRate: 71.5,
      marketShare: 17.9,
      color: '#8B5CF6',
      icon: <Smartphone className="w-6 h-6" />,
      status: 'active'
    },
    {
      id: '5',
      name: '외부 쇼핑몰',
      type: 'external',
      description: '쿠팡, 네이버쇼핑 등',
      revenue: 890000000,
      orders: 3240,
      averageOrderValue: 275000,
      growthRate: 15.8,
      customerCount: 7200,
      conversionRate: 58.9,
      marketShare: 10.2,
      color: '#EF4444',
      icon: <Globe className="w-6 h-6" />,
      status: 'active'
    },
    {
      id: '6',
      name: '전화주문',
      type: 'direct',
      description: '콜센터 전화주문',
      revenue: 420000000,
      orders: 1850,
      averageOrderValue: 227000,
      growthRate: -5.2,
      customerCount: 3200,
      conversionRate: 82.3,
      marketShare: 4.8,
      color: '#06B6D4',
      icon: <Headphones className="w-6 h-6" />,
      status: 'active'
    }
  ];

  // 채널 메트릭스
  const channelMetrics: ChannelMetrics = {
    totalChannels: 6,
    totalRevenue: 8910000000,
    totalOrders: 38010,
    averageOrderValue: 234000,
    totalCustomers: 66200,
    growthRate: 22.8,
    conversionRate: 69.2
  };

  // 월별 채널 성과 (최근 6개월)
  const monthlyChannelPerformance: MonthlyChannelPerformance[] = [
    { month: '8월', directStore: 680000000, franchise: 480000000, ownMall: 820000000, externalMall: 220000000, mobileApp: 420000000, website: 580000000 },
    { month: '9월', directStore: 720000000, franchise: 520000000, ownMall: 890000000, externalMall: 240000000, mobileApp: 480000000, website: 620000000 },
    { month: '10월', directStore: 780000000, franchise: 560000000, ownMall: 950000000, externalMall: 260000000, mobileApp: 520000000, website: 680000000 },
    { month: '11월', directStore: 820000000, franchise: 580000000, ownMall: 1020000000, externalMall: 280000000, mobileApp: 560000000, website: 720000000 },
    { month: '12월', directStore: 920000000, franchise: 680000000, ownMall: 1280000000, externalMall: 340000000, mobileApp: 640000000, website: 820000000 },
    { month: '1월', directStore: 890000000, franchise: 620000000, ownMall: 1150000000, externalMall: 310000000, mobileApp: 580000000, website: 780000000 }
  ];

  // 채널별 상세 비교
  const channelComparison: ChannelComparison[] = [
    { channel: '직영점', revenue: 2840000000, orders: 7850, customers: 12400, satisfaction: 4.8, returnRate: 12.5, averageDeliveryTime: 0 },
    { channel: '대리점', revenue: 1980000000, orders: 5420, customers: 8900, satisfaction: 4.6, returnRate: 15.2, averageDeliveryTime: 0 },
    { channel: '자사 쇼핑몰', revenue: 3420000000, orders: 12850, customers: 18900, satisfaction: 4.5, returnRate: 18.7, averageDeliveryTime: 2.5 },
    { channel: '모바일 앱', revenue: 1560000000, orders: 6800, customers: 15600, satisfaction: 4.7, returnRate: 14.3, averageDeliveryTime: 2.2 },
    { channel: '외부 쇼핑몰', revenue: 890000000, orders: 3240, customers: 7200, satisfaction: 4.3, returnRate: 22.8, averageDeliveryTime: 3.8 },
    { channel: '전화주문', revenue: 420000000, orders: 1850, customers: 3200, satisfaction: 4.9, returnRate: 8.9, averageDeliveryTime: 1.2 }
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

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <div className="status-indicator active"></div>;
      case 'inactive':
        return <div className="status-indicator inactive"></div>;
      case 'maintenance':
        return <div className="status-indicator maintenance"></div>;
      default:
        return <div className="status-indicator inactive"></div>;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'active':
        return '활성';
      case 'inactive':
        return '비활성';
      case 'maintenance':
        return '점검중';
      default:
        return '알 수 없음';
    }
  };

  return (
    <div className="channel-analytics-dashboard">
      <div className="dashboard-header">
        <div className="header-title">
          <BarChart3 className="w-8 h-8 text-green-600" />
          <h1>채널별 매출 분석 대시보드</h1>
        </div>
        <div className="header-subtitle">
          직영점, 대리점, 쇼핑몰 등 채널별 매출 분석
        </div>
      </div>

      {/* 핵심 지표 요약 */}
      <div className="channel-summary">
        <div className="summary-card total-channels">
          <div className="card-icon">
            <Store className="w-8 h-8" />
          </div>
          <div className="card-content">
            <h3>총 채널 수</h3>
            <div className="card-value">{channelMetrics.totalChannels}</div>
            <div className="card-change positive">
              <ArrowUpRight className="w-4 h-4" />
              <span>+1개</span>
            </div>
          </div>
        </div>

        <div className="summary-card total-revenue">
          <div className="card-icon">
            <span className="text-2xl font-bold text-blue-600">₩</span>
          </div>
          <div className="card-content">
            <h3>총 매출</h3>
            <div className="card-value">{formatCurrency(channelMetrics.totalRevenue)}</div>
            <div className="card-change positive">
              <ArrowUpRight className="w-4 h-4" />
              <span>+{channelMetrics.growthRate}%</span>
            </div>
          </div>
        </div>

        <div className="summary-card total-orders">
          <div className="card-icon">
            <Package className="w-8 h-8" />
          </div>
          <div className="card-content">
            <h3>총 주문 수</h3>
            <div className="card-value">{formatNumber(channelMetrics.totalOrders)}</div>
            <div className="card-change positive">
              <ArrowUpRight className="w-4 h-4" />
              <span>+18.5%</span>
            </div>
          </div>
        </div>

        <div className="summary-card total-customers">
          <div className="card-icon">
            <Users className="w-8 h-8" />
          </div>
          <div className="card-content">
            <h3>총 고객 수</h3>
            <div className="card-value">{formatNumber(channelMetrics.totalCustomers)}</div>
            <div className="card-change positive">
              <ArrowUpRight className="w-4 h-4" />
              <span>+25.3%</span>
            </div>
          </div>
        </div>
      </div>

      {/* 채널별 상세 분석 */}
      <div className="channel-details">
        <h2>채널별 상세 분석</h2>
        <div className="channel-cards">
          {channelData.map((channel, index) => (
            <div key={channel.id} className="channel-card">
              <div className="channel-header">
                <div className="channel-icon" style={{ backgroundColor: channel.color }}>
                  {channel.icon}
                </div>
                <div className="channel-info">
                  <h3>{channel.name}</h3>
                  <p>{channel.description}</p>
                  <div className="channel-status">
                    {getStatusIcon(channel.status)}
                    <span>{getStatusText(channel.status)}</span>
                  </div>
                </div>
                <div className="channel-growth">
                  <span className={`growth-rate ${channel.growthRate > 0 ? 'positive' : 'negative'}`}>
                    {channel.growthRate > 0 ? (
                      <ArrowUpRight className="w-4 h-4" />
                    ) : (
                      <ArrowDownRight className="w-4 h-4" />
                    )}
                    {Math.abs(channel.growthRate)}%
                  </span>
                </div>
              </div>

              <div className="channel-metrics">
                <div className="metrics-grid">
                  <div className="metric-item">
                    <span className="metric-label">매출</span>
                    <span className="metric-value">{formatCurrency(channel.revenue)}</span>
                  </div>
                  <div className="metric-item">
                    <span className="metric-label">주문 수</span>
                    <span className="metric-value">{formatNumber(channel.orders)}</span>
                  </div>
                  <div className="metric-item">
                    <span className="metric-label">평균 주문액</span>
                    <span className="metric-value">{formatCurrency(channel.averageOrderValue)}</span>
                  </div>
                  <div className="metric-item">
                    <span className="metric-label">고객 수</span>
                    <span className="metric-value">{formatNumber(channel.customerCount)}</span>
                  </div>
                  <div className="metric-item">
                    <span className="metric-label">전환율</span>
                    <span className="metric-value">{channel.conversionRate}%</span>
                  </div>
                  <div className="metric-item">
                    <span className="metric-label">시장점유율</span>
                    <span className="metric-value">{channel.marketShare}%</span>
                  </div>
                </div>

                <div className="channel-performance">
                  <div className="performance-bar">
                    <div className="bar-label">시장점유율</div>
                    <div className="bar-container">
                      <div 
                        className="bar-fill" 
                        style={{ 
                          width: `${channel.marketShare}%`,
                          backgroundColor: channel.color
                        }}
                      ></div>
                    </div>
                    <div className="bar-value">{channel.marketShare}%</div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 월별 채널 성과 */}
      <div className="monthly-channel-performance">
        <h2>월별 채널 성과</h2>
        <div className="performance-chart">
          <div className="chart-legend">
            <div className="legend-item">
              <div className="legend-color direct-store"></div>
              <span>직영점</span>
            </div>
            <div className="legend-item">
              <div className="legend-color franchise"></div>
              <span>대리점</span>
            </div>
            <div className="legend-item">
              <div className="legend-color own-mall"></div>
              <span>자사 쇼핑몰</span>
            </div>
            <div className="legend-item">
              <div className="legend-color external-mall"></div>
              <span>외부 쇼핑몰</span>
            </div>
            <div className="legend-item">
              <div className="legend-color mobile-app"></div>
              <span>모바일 앱</span>
            </div>
          </div>
          <div className="chart-bars">
            {monthlyChannelPerformance.map((month, index) => (
              <div key={index} className="monthly-bar">
                <div className="bar-group">
                  <div 
                    className="direct-store-bar"
                    style={{ 
                      height: `${(month.directStore / 1000000000) * 100}%`,
                      backgroundColor: '#3B82F6'
                    }}
                  ></div>
                  <div 
                    className="franchise-bar"
                    style={{ 
                      height: `${(month.franchise / 1000000000) * 100}%`,
                      backgroundColor: '#10B981'
                    }}
                  ></div>
                  <div 
                    className="own-mall-bar"
                    style={{ 
                      height: `${(month.ownMall / 1000000000) * 100}%`,
                      backgroundColor: '#F59E0B'
                    }}
                  ></div>
                  <div 
                    className="external-mall-bar"
                    style={{ 
                      height: `${(month.externalMall / 1000000000) * 100}%`,
                      backgroundColor: '#EF4444'
                    }}
                  ></div>
                  <div 
                    className="mobile-app-bar"
                    style={{ 
                      height: `${(month.mobileApp / 1000000000) * 100}%`,
                      backgroundColor: '#8B5CF6'
                    }}
                  ></div>
                </div>
                <div className="bar-label">{month.month}</div>
                <div className="bar-total">
                  {formatCurrency(month.directStore + month.franchise + month.ownMall + month.externalMall + month.mobileApp)}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 채널별 상세 비교 */}
      <div className="channel-comparison">
        <h2>채널별 상세 비교</h2>
        <div className="comparison-table">
          <div className="table-header">
            <div className="header-cell channel-name">채널</div>
            <div className="header-cell">매출</div>
            <div className="header-cell">주문 수</div>
            <div className="header-cell">고객 수</div>
            <div className="header-cell">만족도</div>
            <div className="header-cell">반품률</div>
            <div className="header-cell">배송시간</div>
          </div>
          <div className="table-body">
            {channelComparison.map((channel, index) => (
              <div key={index} className="table-row">
                <div className="row-cell channel-name">
                  <div className="channel-badge" style={{ backgroundColor: channelData[index]?.color }}>
                    {channelData[index]?.icon}
                  </div>
                  <span>{channel.channel}</span>
                </div>
                <div className="row-cell">{formatCurrency(channel.revenue)}</div>
                <div className="row-cell">{formatNumber(channel.orders)}</div>
                <div className="row-cell">{formatNumber(channel.customers)}</div>
                <div className="row-cell">
                  <div className="satisfaction-score">
                    <span>{channel.satisfaction}</span>
                    <div className="satisfaction-stars">
                      {[...Array(5)].map((_, i) => (
                        <span key={i} className={`star ${i < Math.floor(channel.satisfaction) ? 'filled' : ''}`}>★</span>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="row-cell">
                  <span className={`return-rate ${channel.returnRate > 15 ? 'high' : channel.returnRate > 10 ? 'medium' : 'low'}`}>
                    {channel.returnRate}%
                  </span>
                </div>
                <div className="row-cell">
                  {channel.averageDeliveryTime > 0 ? `${channel.averageDeliveryTime}일` : '당일'}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 채널별 매출 분포 파이차트 */}
      <div className="channel-distribution">
        <h2>채널별 매출 분포</h2>
        <div className="distribution-chart">
          <div className="pie-chart-container">
            <div className="pie-chart">
              {(() => {
                const totalRevenue = channelData.reduce((sum, c) => sum + c.revenue, 0);
                let currentAngle = 0;
                const colors = ['#3B82F6', '#10B981', '#F59E0B', '#8B5CF6', '#EF4444', '#06B6D4'];
                
                // conic-gradient를 위한 각도 계산
                const gradientStops = channelData.map((channel, index) => {
                  const percentage = (channel.revenue / totalRevenue) * 100;
                  const startAngle = currentAngle;
                  const endAngle = currentAngle + (percentage / 100) * 360;
                  currentAngle = endAngle;
                  
                  return `${colors[index]} ${startAngle}deg ${endAngle}deg`;
                }).join(', ');
                
                return (
                  <div 
                    className="pie-chart-svg"
                    style={{
                      background: `conic-gradient(${gradientStops})`
                    }}
                  ></div>
                );
              })()}
            </div>
            <div className="pie-center">
              <div className="total-revenue">{formatCurrency(channelMetrics.totalRevenue)}</div>
              <div className="total-label">총 매출</div>
            </div>
          </div>
          <div className="pie-legend">
            {channelData.map((channel, index) => {
              const totalRevenue = channelData.reduce((sum, c) => sum + c.revenue, 0);
              const percentage = (channel.revenue / totalRevenue) * 100;
              const colors = ['#3B82F6', '#10B981', '#F59E0B', '#8B5CF6', '#EF4444', '#06B6D4'];
              
              return (
                <div key={index} className="legend-item">
                  <div 
                    className="legend-color" 
                    style={{ backgroundColor: colors[index] }}
                  ></div>
                  <span className="legend-label">{channel.name}</span>
                  <span className="legend-value">{percentage.toFixed(1)}%</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChannelAnalyticsDashboard;
