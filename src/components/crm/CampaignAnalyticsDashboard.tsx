import React from 'react';
import { 
  Mail, 
  MessageSquare, 
  Phone, 
  TrendingUp, 
  Target,
  Clock,
  CheckCircle,
  AlertCircle,
  BarChart3
} from 'lucide-react';
import './CampaignAnalyticsDashboard.css';

interface CampaignData {
  id: string;
  name: string;
  type: 'email' | 'sms' | 'call' | 'push';
  status: 'active' | 'completed' | 'paused';
  startDate: string;
  endDate: string;
  targetAudience: number;
  sent: number;
  delivered: number;
  opened: number;
  clicked: number;
  converted: number;
  revenue: number;
  cost: number;
  roi: number;
  icon: React.ReactNode;
  color: string;
}

interface KPIMetrics {
  totalCampaigns: number;
  activeCampaigns: number;
  totalRevenue: number;
  averageROI: number;
  conversionRate: number;
  engagementRate: number;
}

const CampaignAnalyticsDashboard: React.FC = () => {
  // 캠페인 데이터 (일관성 있는 샘플 데이터)
  const campaignData: CampaignData[] = [
    {
      id: '1',
      name: '신상품 출시 이메일 캠페인',
      type: 'email',
      status: 'active',
      startDate: '2024-01-01',
      endDate: '2024-01-31',
      targetAudience: 50000,
      sent: 48000,
      delivered: 45600,
      opened: 18240,
      clicked: 5472,
      converted: 1094,
      revenue: 328200000,
      cost: 2400000,
      roi: 135.75,
      icon: <Mail className="w-5 h-5" />,
      color: '#3B82F6'
    },
    {
      id: '2',
      name: '할인 알림 SMS 캠페인',
      type: 'sms',
      status: 'completed',
      startDate: '2023-12-15',
      endDate: '2023-12-25',
      targetAudience: 30000,
      sent: 28500,
      delivered: 28200,
      opened: 28200,
      clicked: 5640,
      converted: 1128,
      revenue: 169200000,
      cost: 855000,
      roi: 196.84,
      icon: <MessageSquare className="w-5 h-5" />,
      color: '#10B981'
    },
    {
      id: '3',
      name: 'VIP 고객 전화 상담',
      type: 'call',
      status: 'active',
      startDate: '2024-01-10',
      endDate: '2024-02-10',
      targetAudience: 5000,
      sent: 4500,
      delivered: 4500,
      opened: 4500,
      clicked: 2700,
      converted: 900,
      revenue: 270000000,
      cost: 2250000,
      roi: 119.00,
      icon: <Phone className="w-5 h-5" />,
      color: '#F59E0B'
    },
    {
      id: '4',
      name: '모바일 앱 푸시 알림',
      type: 'push',
      status: 'paused',
      startDate: '2023-12-01',
      endDate: '2023-12-31',
      targetAudience: 80000,
      sent: 72000,
      delivered: 64800,
      opened: 25920,
      clicked: 7776,
      converted: 1555,
      revenue: 233250000,
      cost: 1440000,
      roi: 160.90,
      icon: <Target className="w-5 h-5" />,
      color: '#8B5CF6'
    }
  ];

  // KPI 메트릭스
  const kpiMetrics: KPIMetrics = {
    totalCampaigns: 24,
    activeCampaigns: 8,
    totalRevenue: 998650000,
    averageROI: 153.12,
    conversionRate: 12.3,
    engagementRate: 28.7
  };

  // 월별 캠페인 성과 (최근 6개월)
  const monthlyPerformance = [
    { month: '8월', campaigns: 4, revenue: 156000000, roi: 142.5 },
    { month: '9월', campaigns: 5, revenue: 189000000, roi: 158.2 },
    { month: '10월', campaigns: 6, revenue: 234000000, roi: 165.8 },
    { month: '11월', campaigns: 4, revenue: 198000000, roi: 152.3 },
    { month: '12월', campaigns: 8, revenue: 312000000, roi: 168.9 },
    { month: '1월', campaigns: 6, revenue: 287000000, roi: 171.4 }
  ];

  // 채널별 성과 분석
  const channelPerformance = [
    { channel: '이메일', campaigns: 8, revenue: 456000000, conversion: 8.5, cost: 4800000 },
    { channel: 'SMS', campaigns: 6, revenue: 234000000, conversion: 12.3, cost: 1800000 },
    { channel: '전화', campaigns: 4, revenue: 189000000, conversion: 18.7, cost: 3200000 },
    { channel: '푸시', campaigns: 6, revenue: 119650000, conversion: 6.8, cost: 2400000 }
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
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-blue-500" />;
      case 'paused':
        return <AlertCircle className="w-4 h-4 text-yellow-500" />;
      default:
        return <Clock className="w-4 h-4 text-gray-500" />;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'active':
        return '진행중';
      case 'completed':
        return '완료';
      case 'paused':
        return '일시정지';
      default:
        return '대기';
    }
  };

  return (
    <div className="campaign-analytics-dashboard">
      <div className="dashboard-header">
        <div className="header-title">
          <BarChart3 className="w-8 h-8 text-purple-600" />
          <h1>캠페인 분석 대시보드</h1>
        </div>
        <div className="header-subtitle">
          마케팅 캠페인 성과 및 KPI 분석
        </div>
      </div>

      {/* KPI 요약 카드 */}
      <div className="kpi-summary">
        <div className="kpi-card total-campaigns">
          <div className="kpi-icon">
            <Target className="w-8 h-8" />
          </div>
          <div className="kpi-content">
            <h3>총 캠페인</h3>
            <div className="kpi-value">{kpiMetrics.totalCampaigns}</div>
            <div className="kpi-change positive">
              <TrendingUp className="w-4 h-4" />
              <span>+4개</span>
            </div>
          </div>
        </div>

        <div className="kpi-card active-campaigns">
          <div className="kpi-icon">
            <CheckCircle className="w-8 h-8" />
          </div>
          <div className="kpi-content">
            <h3>진행중 캠페인</h3>
            <div className="kpi-value">{kpiMetrics.activeCampaigns}</div>
            <div className="kpi-change positive">
              <TrendingUp className="w-4 h-4" />
              <span>+2개</span>
            </div>
          </div>
        </div>

        <div className="kpi-card total-revenue">
          <div className="kpi-icon">
            <span className="text-2xl font-bold text-blue-600">₩</span>
          </div>
          <div className="kpi-content">
            <h3>총 매출</h3>
            <div className="kpi-value">{formatCurrency(kpiMetrics.totalRevenue)}</div>
            <div className="kpi-change positive">
              <TrendingUp className="w-4 h-4" />
              <span>+23.5%</span>
            </div>
          </div>
        </div>

        <div className="kpi-card average-roi">
          <div className="kpi-icon">
            <TrendingUp className="w-8 h-8" />
          </div>
          <div className="kpi-content">
            <h3>평균 ROI</h3>
            <div className="kpi-value">{kpiMetrics.averageROI}%</div>
            <div className="kpi-change positive">
              <TrendingUp className="w-4 h-4" />
              <span>+8.2%</span>
            </div>
          </div>
        </div>
      </div>

      {/* 캠페인 상세 목록 */}
      <div className="campaign-list">
        <h2>캠페인 상세 현황</h2>
        <div className="campaign-cards">
          {campaignData.map((campaign) => (
            <div key={campaign.id} className="campaign-card">
              <div className="campaign-header">
                <div className="campaign-icon" style={{ backgroundColor: campaign.color }}>
                  {campaign.icon}
                </div>
                <div className="campaign-info">
                  <h3>{campaign.name}</h3>
                  <div className="campaign-status">
                    {getStatusIcon(campaign.status)}
                    <span>{getStatusText(campaign.status)}</span>
                  </div>
                </div>
                <div className="campaign-roi">
                  <span className="roi-value">{campaign.roi}%</span>
                  <span className="roi-label">ROI</span>
                </div>
              </div>

              <div className="campaign-metrics">
                <div className="metric-grid">
                  <div className="metric-item">
                    <span className="metric-label">타겟</span>
                    <span className="metric-value">{formatNumber(campaign.targetAudience)}</span>
                  </div>
                  <div className="metric-item">
                    <span className="metric-label">발송</span>
                    <span className="metric-value">{formatNumber(campaign.sent)}</span>
                  </div>
                  <div className="metric-item">
                    <span className="metric-label">전환</span>
                    <span className="metric-value">{formatNumber(campaign.converted)}</span>
                  </div>
                  <div className="metric-item">
                    <span className="metric-label">매출</span>
                    <span className="metric-value">{formatCurrency(campaign.revenue)}</span>
                  </div>
                </div>

                <div className="conversion-funnel">
                  <div className="funnel-step">
                    <span className="step-label">전달률</span>
                    <div className="step-bar">
                      <div 
                        className="step-fill" 
                        style={{ 
                          width: `${(campaign.delivered / campaign.sent) * 100}%`,
                          backgroundColor: campaign.color
                        }}
                      ></div>
                    </div>
                    <span className="step-value">{((campaign.delivered / campaign.sent) * 100).toFixed(1)}%</span>
                  </div>
                  <div className="funnel-step">
                    <span className="step-label">오픈률</span>
                    <div className="step-bar">
                      <div 
                        className="step-fill" 
                        style={{ 
                          width: `${(campaign.opened / campaign.delivered) * 100}%`,
                          backgroundColor: campaign.color
                        }}
                      ></div>
                    </div>
                    <span className="step-value">{((campaign.opened / campaign.delivered) * 100).toFixed(1)}%</span>
                  </div>
                  <div className="funnel-step">
                    <span className="step-label">클릭률</span>
                    <div className="step-bar">
                      <div 
                        className="step-fill" 
                        style={{ 
                          width: `${(campaign.clicked / campaign.opened) * 100}%`,
                          backgroundColor: campaign.color
                        }}
                      ></div>
                    </div>
                    <span className="step-value">{((campaign.clicked / campaign.opened) * 100).toFixed(1)}%</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 월별 성과 및 채널 분석 */}
      <div className="performance-analysis">
        <div className="monthly-performance">
          <h3>월별 캠페인 성과</h3>
          <div className="performance-chart">
            {monthlyPerformance.map((data, index) => (
              <div key={index} className="performance-item">
                <div className="performance-label">{data.month}</div>
                <div className="performance-bars">
                  <div className="performance-bar-container">
                    <div className="bar-label">매출</div>
                    <div className="bar-track">
                      <div 
                        className="revenue-bar"
                        style={{ 
                          width: `${Math.min((data.revenue / 350000000) * 90 + 10, 95)}%`,
                          backgroundColor: '#3B82F6'
                        }}
                      ></div>
                    </div>
                    <div className="bar-value">{formatCurrency(data.revenue)}</div>
                  </div>
                  <div className="performance-bar-container">
                    <div className="bar-label">ROI</div>
                    <div className="bar-track">
                      <div 
                        className="roi-bar"
                        style={{ 
                          width: `${Math.min((data.roi / 180) * 85 + 15, 95)}%`,
                          backgroundColor: '#10B981'
                        }}
                      ></div>
                    </div>
                    <div className="bar-value">{data.roi}%</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="channel-performance">
          <h3>채널별 성과 분석</h3>
          <div className="channel-stats">
            {channelPerformance.map((channel, index) => (
              <div key={index} className="channel-stat">
                <div className="channel-header">
                  <h4>{channel.channel}</h4>
                  <span className="channel-conversion">{channel.conversion}%</span>
                </div>
                <div className="channel-metrics">
                  <div className="channel-metric">
                    <span className="metric-label">캠페인 수</span>
                    <span className="metric-value">{channel.campaigns}</span>
                  </div>
                  <div className="channel-metric">
                    <span className="metric-label">매출</span>
                    <span className="metric-value">{formatCurrency(channel.revenue)}</span>
                  </div>
                  <div className="channel-metric">
                    <span className="metric-label">비용</span>
                    <span className="metric-value">{formatCurrency(channel.cost)}</span>
                  </div>
                </div>
                <div className="channel-roi">
                  <span className="roi-label">ROI</span>
                  <span className="roi-value">
                    {(((channel.revenue - channel.cost) / channel.cost) * 100).toFixed(1)}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 채널별 파이 차트 */}
      <div className="channel-distribution">
        <h3>채널별 매출 분포</h3>
        <div className="pie-chart-container">
          <div className="pie-chart">
            <svg width="200" height="200" viewBox="0 0 200 200">
              {(() => {
                const totalRevenue = channelPerformance.reduce((sum, c) => sum + c.revenue, 0);
                const colors = ['#3B82F6', '#10B981', '#F59E0B', '#8B5CF6'];
                let cumulativePercentage = 0;
                const radius = 80;
                const centerX = 100;
                const centerY = 100;
                
                return channelPerformance.map((channel, index) => {
                  const percentage = (channel.revenue / totalRevenue) * 100;
                  const startAngle = (cumulativePercentage * 360) / 100;
                  const endAngle = ((cumulativePercentage + percentage) * 360) / 100;
                  cumulativePercentage += percentage;
                  
                  const startAngleRad = (startAngle - 90) * Math.PI / 180;
                  const endAngleRad = (endAngle - 90) * Math.PI / 180;
                  
                  const x1 = centerX + radius * Math.cos(startAngleRad);
                  const y1 = centerY + radius * Math.sin(startAngleRad);
                  const x2 = centerX + radius * Math.cos(endAngleRad);
                  const y2 = centerY + radius * Math.sin(endAngleRad);
                  
                  const largeArcFlag = percentage > 50 ? 1 : 0;
                  
                  const pathData = [
                    `M ${centerX} ${centerY}`,
                    `L ${x1} ${y1}`,
                    `A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2}`,
                    'Z'
                  ].join(' ');
                  
                  return (
                    <path
                      key={index}
                      d={pathData}
                      fill={colors[index]}
                      stroke="white"
                      strokeWidth="2"
                    />
                  );
                });
              })()}
            </svg>
          </div>
          <div className="pie-legend">
            {channelPerformance.map((channel, index) => {
              const totalRevenue = channelPerformance.reduce((sum, c) => sum + c.revenue, 0);
              const percentage = (channel.revenue / totalRevenue) * 100;
              const colors = ['#3B82F6', '#10B981', '#F59E0B', '#8B5CF6'];
              
              return (
                <div key={index} className="legend-item">
                  <div 
                    className="legend-color" 
                    style={{ backgroundColor: colors[index] }}
                  ></div>
                  <span className="legend-label">{channel.channel}</span>
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

export default CampaignAnalyticsDashboard;
