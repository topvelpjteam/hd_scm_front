import React from 'react';
import { 
  Phone, 
  PhoneCall, 
  Clock, 
  Users, 
  Target,
  Award,
  ArrowUpRight,
  ArrowDownRight,
  Star,
  CheckCircle,
  AlertCircle,
  Headphones
} from 'lucide-react';
import './AgentCallAnalyticsDashboard.css';

interface AgentData {
  id: string;
  name: string;
  department: string;
  experience: number; // 개월
  avatar: string;
  totalCalls: number;
  inboundCalls: number;
  outboundCalls: number;
  averageCallDuration: number; // 분
  callConversionRate: number;
  salesGenerated: number;
  averageOrderValue: number;
  customerSatisfaction: number;
  responseTime: number; // 분
  status: 'online' | 'busy' | 'offline';
  tier: 'JUNIOR' | 'SENIOR' | 'LEAD' | 'MANAGER';
}

interface CallMetrics {
  totalAgents: number;
  activeAgents: number;
  totalCalls: number;
  averageCallDuration: number;
  totalSales: number;
  conversionRate: number;
  customerSatisfaction: number;
  averageResponseTime: number;
}

interface HourlyCallDistribution {
  hour: string;
  inbound: number;
  outbound: number;
  total: number;
}

interface DailyPerformance {
  date: string;
  totalCalls: number;
  sales: number;
  conversionRate: number;
  satisfaction: number;
}

const AgentCallAnalyticsDashboard: React.FC = () => {
  // 상담원 데이터 (일관성 있는 샘플 데이터)
  const agentData: AgentData[] = [
    {
      id: '1',
      name: '김상담',
      department: '고객상담팀',
      experience: 24,
      avatar: '👨‍💼',
      totalCalls: 1240,
      inboundCalls: 890,
      outboundCalls: 350,
      averageCallDuration: 8.5,
      callConversionRate: 68.5,
      salesGenerated: 285000000,
      averageOrderValue: 325000,
      customerSatisfaction: 4.8,
      responseTime: 2.3,
      status: 'online',
      tier: 'LEAD'
    },
    {
      id: '2',
      name: '이상담',
      department: '영업상담팀',
      experience: 18,
      avatar: '👩‍💼',
      totalCalls: 1150,
      inboundCalls: 680,
      outboundCalls: 470,
      averageCallDuration: 12.3,
      callConversionRate: 72.1,
      salesGenerated: 342000000,
      averageOrderValue: 415000,
      customerSatisfaction: 4.6,
      responseTime: 3.1,
      status: 'busy',
      tier: 'SENIOR'
    },
    {
      id: '3',
      name: '박상담',
      department: '고객상담팀',
      experience: 36,
      avatar: '👨‍🎓',
      totalCalls: 1380,
      inboundCalls: 920,
      outboundCalls: 460,
      averageCallDuration: 9.2,
      callConversionRate: 74.8,
      salesGenerated: 298000000,
      averageOrderValue: 287000,
      customerSatisfaction: 4.9,
      responseTime: 1.8,
      status: 'online',
      tier: 'MANAGER'
    },
    {
      id: '4',
      name: '최상담',
      department: '영업상담팀',
      experience: 12,
      avatar: '👩‍🎨',
      totalCalls: 890,
      inboundCalls: 520,
      outboundCalls: 370,
      averageCallDuration: 10.7,
      callConversionRate: 65.2,
      salesGenerated: 185000000,
      averageOrderValue: 318000,
      customerSatisfaction: 4.4,
      responseTime: 4.2,
      status: 'online',
      tier: 'JUNIOR'
    },
    {
      id: '5',
      name: '정상담',
      department: '고객상담팀',
      experience: 8,
      avatar: '👨‍💻',
      totalCalls: 720,
      inboundCalls: 480,
      outboundCalls: 240,
      averageCallDuration: 7.8,
      callConversionRate: 58.9,
      salesGenerated: 142000000,
      averageOrderValue: 334000,
      customerSatisfaction: 4.2,
      responseTime: 5.1,
      status: 'offline',
      tier: 'JUNIOR'
    }
  ];

  // 콜 메트릭스
  const callMetrics: CallMetrics = {
    totalAgents: 24,
    activeAgents: 18,
    totalCalls: 12580,
    averageCallDuration: 9.8,
    totalSales: 4520000000,
    conversionRate: 68.7,
    customerSatisfaction: 4.6,
    averageResponseTime: 3.2
  };

  // 시간대별 콜 분포 (최근 7일)
  const hourlyCallDistribution: HourlyCallDistribution[] = [
    { hour: '08:00', inbound: 28, outbound: 8, total: 36 },
    { hour: '09:00', inbound: 52, outbound: 15, total: 67 },
    { hour: '10:00', inbound: 78, outbound: 22, total: 100 },
    { hour: '11:00', inbound: 95, outbound: 28, total: 123 },
    { hour: '12:00', inbound: 45, outbound: 12, total: 57 },
    { hour: '13:00', inbound: 35, outbound: 18, total: 53 },
    { hour: '14:00', inbound: 82, outbound: 25, total: 107 },
    { hour: '15:00', inbound: 108, outbound: 32, total: 140 },
    { hour: '16:00', inbound: 92, outbound: 35, total: 127 },
    { hour: '17:00', inbound: 68, outbound: 24, total: 92 },
    { hour: '18:00', inbound: 42, outbound: 16, total: 58 },
    { hour: '19:00', inbound: 25, outbound: 8, total: 33 }
  ];

  // 일별 성과 (최근 7일)
  const dailyPerformance: DailyPerformance[] = [
    { date: '1/15', totalCalls: 420, sales: 185000000, conversionRate: 68.5, satisfaction: 4.6 },
    { date: '1/16', totalCalls: 480, sales: 212000000, conversionRate: 72.1, satisfaction: 4.7 },
    { date: '1/17', totalCalls: 520, sales: 245000000, conversionRate: 74.8, satisfaction: 4.8 },
    { date: '1/18', totalCalls: 450, sales: 198000000, conversionRate: 69.2, satisfaction: 4.5 },
    { date: '1/19', totalCalls: 580, sales: 278000000, conversionRate: 76.3, satisfaction: 4.9 },
    { date: '1/20', totalCalls: 510, sales: 234000000, conversionRate: 71.8, satisfaction: 4.6 },
    { date: '1/21', totalCalls: 470, sales: 218000000, conversionRate: 70.4, satisfaction: 4.7 }
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

  const getTierColor = (tier: string): string => {
    switch (tier) {
      case 'MANAGER': return '#8B5CF6';
      case 'LEAD': return '#3B82F6';
      case 'SENIOR': return '#10B981';
      case 'JUNIOR': return '#F59E0B';
      default: return '#94a3b8';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'online':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'busy':
        return <AlertCircle className="w-4 h-4 text-yellow-500" />;
      case 'offline':
        return <AlertCircle className="w-4 h-4 text-gray-400" />;
      default:
        return <AlertCircle className="w-4 h-4 text-gray-400" />;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'online':
        return '온라인';
      case 'busy':
        return '통화중';
      case 'offline':
        return '오프라인';
      default:
        return '알 수 없음';
    }
  };

  return (
    <div className="agent-call-analytics-dashboard">
      <div className="dashboard-header">
        <div className="header-title">
          <Headphones className="w-8 h-8 text-blue-600" />
          <h1>상담원 콜 분석 대시보드</h1>
        </div>
        <div className="header-subtitle">
          상담원 콜 빈도와 매출 연결 KPI 분석
        </div>
      </div>

      {/* 핵심 지표 요약 */}
      <div className="call-summary">
        <div className="summary-card total-agents">
          <div className="card-icon">
            <Users className="w-8 h-8" />
          </div>
          <div className="card-content">
            <h3>총 상담원</h3>
            <div className="card-value">{callMetrics.totalAgents}</div>
            <div className="card-change positive">
              <ArrowUpRight className="w-4 h-4" />
              <span>+2명</span>
            </div>
          </div>
        </div>

        <div className="summary-card active-agents">
          <div className="card-icon">
            <Phone className="w-8 h-8" />
          </div>
          <div className="card-content">
            <h3>활성 상담원</h3>
            <div className="card-value">{callMetrics.activeAgents}</div>
            <div className="card-change positive">
              <ArrowUpRight className="w-4 h-4" />
              <span>75%</span>
            </div>
          </div>
        </div>

        <div className="summary-card total-calls">
          <div className="card-icon">
            <PhoneCall className="w-8 h-8" />
          </div>
          <div className="card-content">
            <h3>총 콜 수</h3>
            <div className="card-value">{formatNumber(callMetrics.totalCalls)}</div>
            <div className="card-change positive">
              <ArrowUpRight className="w-4 h-4" />
              <span>+15.2%</span>
            </div>
          </div>
        </div>

        <div className="summary-card total-sales">
          <div className="card-icon">
            <span className="text-2xl font-bold text-blue-600">₩</span>
          </div>
          <div className="card-content">
            <h3>총 매출</h3>
            <div className="card-value">{formatCurrency(callMetrics.totalSales)}</div>
            <div className="card-change positive">
              <ArrowUpRight className="w-4 h-4" />
              <span>+22.8%</span>
            </div>
          </div>
        </div>
      </div>

      {/* 상담원 성과 랭킹 */}
      <div className="agent-performance">
        <h2>상담원 성과 랭킹</h2>
        <div className="agent-cards">
          {agentData.map((agent, index) => (
            <div key={agent.id} className="agent-card">
              <div className="agent-header">
                <div className="agent-rank">
                  <span className="rank-number">#{index + 1}</span>
                  <div className="rank-badge">
                    {index === 0 && <Award className="w-5 h-5 text-yellow-500" />}
                    {index === 1 && <Award className="w-5 h-5 text-gray-400" />}
                    {index === 2 && <Award className="w-5 h-5 text-amber-600" />}
                  </div>
                </div>
                <div className="agent-info">
                  <div className="agent-avatar">{agent.avatar}</div>
                  <div className="agent-details">
                    <h3>{agent.name}</h3>
                    <div className="agent-meta">
                      <div 
                        className="tier-badge" 
                        style={{ backgroundColor: getTierColor(agent.tier) }}
                      >
                        <span>{agent.tier}</span>
                      </div>
                      <span className="department">{agent.department}</span>
                      <span className="experience">{agent.experience}개월</span>
                    </div>
                    <div className="agent-status">
                      {getStatusIcon(agent.status)}
                      <span>{getStatusText(agent.status)}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="agent-metrics">
                <div className="metrics-grid">
                  <div className="metric-item">
                    <span className="metric-label">총 콜 수</span>
                    <span className="metric-value">{formatNumber(agent.totalCalls)}</span>
                  </div>
                  <div className="metric-item">
                    <span className="metric-label">인바운드</span>
                    <span className="metric-value">{formatNumber(agent.inboundCalls)}</span>
                  </div>
                  <div className="metric-item">
                    <span className="metric-label">아웃바운드</span>
                    <span className="metric-value">{formatNumber(agent.outboundCalls)}</span>
                  </div>
                  <div className="metric-item">
                    <span className="metric-label">평균 통화시간</span>
                    <span className="metric-value">{agent.averageCallDuration}분</span>
                  </div>
                  <div className="metric-item">
                    <span className="metric-label">전환율</span>
                    <span className="metric-value">{agent.callConversionRate}%</span>
                  </div>
                  <div className="metric-item">
                    <span className="metric-label">매출</span>
                    <span className="metric-value">{formatCurrency(agent.salesGenerated)}</span>
                  </div>
                  <div className="metric-item">
                    <span className="metric-label">평균 주문액</span>
                    <span className="metric-value">{formatCurrency(agent.averageOrderValue)}</span>
                  </div>
                  <div className="metric-item">
                    <span className="metric-label">고객 만족도</span>
                    <span className="metric-value">{agent.customerSatisfaction}/5</span>
                  </div>
                  <div className="metric-item">
                    <span className="metric-label">응답시간</span>
                    <span className="metric-value">{agent.responseTime}분</span>
                  </div>
                </div>

                {/* <div className="agent-performance-chart">
                  <div className="performance-bars">
                    <div className="performance-bar">
                      <div className="bar-label">전환율</div>
                      <div className="bar-container">
                        <div 
                          className="bar-fill" 
                          style={{ 
                            width: `${agent.callConversionRate}%`,
                            backgroundColor: getTierColor(agent.tier)
                          }}
                        ></div>
                      </div>
                      <div className="bar-value">{agent.callConversionRate}%</div>
                    </div>
                    <div className="performance-bar">
                      <div className="bar-label">만족도</div>
                      <div className="bar-container">
                        <div 
                          className="bar-fill" 
                          style={{ 
                            width: `${(agent.customerSatisfaction / 5) * 100}%`,
                            backgroundColor: '#10B981'
                          }}
                        ></div>
                      </div>
                      <div className="bar-value">{agent.customerSatisfaction}/5</div>
                    </div>
                  </div>
                </div> */}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 시간대별 콜 분포 및 일별 성과 */}
      <div className="call-distribution-performance">
        <div className="hourly-distribution">
          <h3>시간대별 콜 분포</h3>
          <div className="distribution-chart">
            <div className="chart-legend">
              <div className="legend-item">
                <div className="legend-color inbound"></div>
                <span>인바운드</span>
              </div>
              <div className="legend-item">
                <div className="legend-color outbound"></div>
                <span>아웃바운드</span>
              </div>
            </div>
            <div className="chart-bars">
              {hourlyCallDistribution.map((hour, index) => (
                <div key={index} className="distribution-bar">
                  <div className="bar-group">
                    <div 
                      className="inbound-bar"
                      style={{ 
                        height: `${(hour.inbound / 100) * 100}%`,
                        backgroundColor: '#3B82F6'
                      }}
                    ></div>
                    <div 
                      className="outbound-bar"
                      style={{ 
                        height: `${(hour.outbound / 35) * 100}%`,
                        backgroundColor: '#10B981'
                      }}
                    ></div>
                  </div>
                  <div className="bar-label">{hour.hour}</div>
                  <div className="bar-total">{hour.total}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="daily-performance">
          <h3>일별 성과</h3>
          <div className="performance-chart">
            <div className="chart-header">
              <div className="chart-metrics">
                <div className="metric">
                  <span className="metric-label">평균 전환율</span>
                  <span className="metric-value">{callMetrics.conversionRate}%</span>
                </div>
                <div className="metric">
                  <span className="metric-label">평균 만족도</span>
                  <span className="metric-value">{callMetrics.customerSatisfaction}/5</span>
                </div>
                <div className="metric">
                  <span className="metric-label">전월대비 실적</span>
                  <span className="metric-value positive">+12.5%</span>
                </div>
                <div className="metric">
                  <span className="metric-label">3개월 평균실적</span>
                  <span className="metric-value">{callMetrics.conversionRate + 2.3}%</span>
                </div>
              </div>
            </div>
            <div className="performance-chart-container">
              {/* <div className="chart-legend">
                <div className="legend-item">
                  <div className="legend-color calls"></div>
                  <span>총 콜 수</span>
                </div>
                <div className="legend-item">
                  <div className="legend-color sales"></div>
                  <span>매출</span>
                </div>
                <div className="legend-item">
                  <div className="legend-color conversion"></div>
                  <span>전환율</span>
                </div>
              </div> */}
              {/* <div className="performance-bars">
                {dailyPerformance.map((day, index) => (
                  <div key={index} className="daily-bar">
                    <div className="bar-container">
                      <div className="bar-group">
                        <div 
                          className="calls-bar"
                          style={{ 
                            height: `${(day.totalCalls / 600) * 100}%`,
                            backgroundColor: '#3B82F6'
                          }}
                          title={`총 콜: ${day.totalCalls}`}
                        ></div>
                        <div 
                          className="sales-bar"
                          style={{ 
                            height: `${(day.sales / 300000000) * 100}%`,
                            backgroundColor: '#10B981'
                          }}
                          title={`매출: ${formatCurrency(day.sales)}`}
                        ></div>
                      </div>
                      <div 
                        className="conversion-indicator"
                        style={{
                          height: `${day.conversionRate}%`,
                          backgroundColor: '#F59E0B'
                        }}
                        title={`전환율: ${day.conversionRate}%`}
                      ></div>
                    </div>
                    <div className="bar-info">
                      <div className="bar-label">{day.date}</div>
                      <div className="bar-values">
                        <div className="calls-value">{day.totalCalls}</div>
                        <div className="sales-value">{formatCurrency(day.sales)}</div>
                      </div>
                      <div className="bar-conversion">
                        <span className="conversion-rate">{day.conversionRate}%</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div> */}
            </div>
          </div>
          
          {/* 일별 성과 요약 */}
          <div className="daily-performance-summary">
            <h4>주간 성과 요약</h4>
            <div className="summary-metrics">
              <div className="summary-metric">
                <div className="metric-icon">
                  <PhoneCall className="w-6 h-6" />
                </div>
                <div className="metric-content">
                  <div className="metric-label">총 콜 수</div>
                  <div className="metric-value">
                    {dailyPerformance.reduce((sum, day) => sum + day.totalCalls, 0).toLocaleString()}건
                  </div>
                  <div className="metric-change positive">
                    <ArrowUpRight className="w-4 h-4" />
                    <span>+8.2%</span>
                  </div>
                </div>
              </div>
              
              <div className="summary-metric">
                <div className="metric-icon">
                  <span className="text-lg font-bold text-blue-600">₩</span>
                </div>
                <div className="metric-content">
                  <div className="metric-label">총 매출</div>
                  <div className="metric-value">
                    {formatCurrency(dailyPerformance.reduce((sum, day) => sum + day.sales, 0))}
                  </div>
                  <div className="metric-change positive">
                    <ArrowUpRight className="w-4 h-4" />
                    <span>+15.7%</span>
                  </div>
                </div>
              </div>
              
              <div className="summary-metric">
                <div className="metric-icon">
                  <Target className="w-6 h-6" />
                </div>
                <div className="metric-content">
                  <div className="metric-label">평균 전환율</div>
                  <div className="metric-value">
                    {(dailyPerformance.reduce((sum, day) => sum + day.conversionRate, 0) / dailyPerformance.length).toFixed(1)}%
                  </div>
                  <div className="metric-change positive">
                    <ArrowUpRight className="w-4 h-4" />
                    <span>+2.3%</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 콜 품질 지표 */}
      <div className="call-quality-metrics">
        <h2>콜 품질 지표</h2>
        <div className="quality-grid">
          <div className="quality-card">
            <div className="quality-icon">
              <Clock className="w-8 h-8" />
            </div>
            <div className="quality-content">
              <h3>평균 응답시간</h3>
              <div className="quality-value">{callMetrics.averageResponseTime}분</div>
              <div className="quality-change positive">
                <ArrowDownRight className="w-4 h-4" />
                <span>-0.3분</span>
              </div>
            </div>
          </div>

          <div className="quality-card">
            <div className="quality-icon">
              <Clock className="w-8 h-8" />
            </div>
            <div className="quality-content">
              <h3>평균 통화시간</h3>
              <div className="quality-value">{callMetrics.averageCallDuration}분</div>
              <div className="quality-change positive">
                <ArrowUpRight className="w-4 h-4" />
                <span>+0.8분</span>
              </div>
            </div>
          </div>

          <div className="quality-card">
            <div className="quality-icon">
              <Target className="w-8 h-8" />
            </div>
            <div className="quality-content">
              <h3>전환율</h3>
              <div className="quality-value">{callMetrics.conversionRate}%</div>
              <div className="quality-change positive">
                <ArrowUpRight className="w-4 h-4" />
                <span>+2.1%</span>
              </div>
            </div>
          </div>

          <div className="quality-card">
            <div className="quality-icon">
              <Star className="w-8 h-8" />
            </div>
            <div className="quality-content">
              <h3>고객 만족도</h3>
              <div className="quality-value">{callMetrics.customerSatisfaction}/5</div>
              <div className="quality-change positive">
                <ArrowUpRight className="w-4 h-4" />
                <span>+0.2</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AgentCallAnalyticsDashboard;
