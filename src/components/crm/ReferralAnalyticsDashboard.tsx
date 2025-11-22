import React from 'react';
import { 
  Users, 
  UserPlus, 
  Share2, 
  Gift, 
  TrendingUp, 
  Target,
  Award,
  Calendar,
  BarChart3,
  PieChart,
  ArrowUpRight,
  ArrowDownRight,
  Star
} from 'lucide-react';
import './ReferralAnalyticsDashboard.css';

interface ReferralData {
  id: string;
  referrerName: string;
  referrerTier: 'BRONZE' | 'SILVER' | 'GOLD' | 'PLATINUM';
  referralCount: number;
  successfulReferrals: number;
  totalRevenue: number;
  customerSatisfaction: number;
  averageOrderValue: number;
  conversionRate: number;
  joinDate: string;
  lastActivity: string;
  status: 'active' | 'inactive';
  avatar: string;
  repeatCustomers: number;
  averageLifetimeValue: number;
}

interface ReferralMetrics {
  totalReferrers: number;
  totalReferrals: number;
  successfulReferrals: number;
  totalRevenue: number;
  averageCustomerSatisfaction: number;
  averageReferralValue: number;
  conversionRate: number;
  growthRate: number;
  repeatCustomerRate: number;
  averageLifetimeValue: number;
}

interface MonthlyTrend {
  month: string;
  newReferrers: number;
  newReferrals: number;
  revenue: number;
  customerSatisfaction: number;
  repeatCustomers: number;
}

const ReferralAnalyticsDashboard: React.FC = () => {
  // 소개인 데이터 (일관성 있는 샘플 데이터)
  const referralData: ReferralData[] = [
    {
      id: '1',
      referrerName: '김민수',
      referrerTier: 'PLATINUM',
      referralCount: 45,
      successfulReferrals: 32,
      totalRevenue: 156000000,
      customerSatisfaction: 4.8,
      averageOrderValue: 4875000,
      conversionRate: 71.1,
      joinDate: '2023-03-15',
      lastActivity: '2024-01-20',
      status: 'active',
      avatar: '👨‍💼',
      repeatCustomers: 28,
      averageLifetimeValue: 5200000
    },
    {
      id: '2',
      referrerName: '이지은',
      referrerTier: 'GOLD',
      referralCount: 28,
      successfulReferrals: 21,
      totalRevenue: 98000000,
      customerSatisfaction: 4.6,
      averageOrderValue: 4667000,
      conversionRate: 75.0,
      joinDate: '2023-05-22',
      lastActivity: '2024-01-18',
      status: 'active',
      avatar: '👩‍💼',
      repeatCustomers: 18,
      averageLifetimeValue: 4800000
    },
    {
      id: '3',
      referrerName: '박준호',
      referrerTier: 'SILVER',
      referralCount: 18,
      successfulReferrals: 12,
      totalRevenue: 67000000,
      customerSatisfaction: 4.4,
      averageOrderValue: 5583000,
      conversionRate: 66.7,
      joinDate: '2023-08-10',
      lastActivity: '2024-01-15',
      status: 'active',
      avatar: '👨‍🎓',
      repeatCustomers: 14,
      averageLifetimeValue: 4200000
    },
    {
      id: '4',
      referrerName: '최수진',
      referrerTier: 'BRONZE',
      referralCount: 8,
      successfulReferrals: 5,
      totalRevenue: 28000000,
      customerSatisfaction: 4.2,
      averageOrderValue: 5600000,
      conversionRate: 62.5,
      joinDate: '2023-11-05',
      lastActivity: '2024-01-12',
      status: 'active',
      avatar: '👩‍🎨',
      repeatCustomers: 10,
      averageLifetimeValue: 3800000
    },
    {
      id: '5',
      referrerName: '정민호',
      referrerTier: 'GOLD',
      referralCount: 35,
      successfulReferrals: 28,
      totalRevenue: 128000000,
      customerSatisfaction: 4.7,
      averageOrderValue: 4571000,
      conversionRate: 80.0,
      joinDate: '2023-04-18',
      lastActivity: '2024-01-10',
      status: 'inactive',
      avatar: '👨‍💻',
      repeatCustomers: 22,
      averageLifetimeValue: 5100000
    }
  ];

  // 소개 메트릭스
  const referralMetrics: ReferralMetrics = {
    totalReferrers: 2840,
    totalReferrals: 15670,
    successfulReferrals: 11230,
    totalRevenue: 4580000000,
    averageCustomerSatisfaction: 4.5,
    averageReferralValue: 407800,
    conversionRate: 71.7,
    growthRate: 24.8,
    repeatCustomerRate: 68.2,
    averageLifetimeValue: 4850000
  };

  // 월별 추이 (최근 6개월)
  const monthlyTrend: MonthlyTrend[] = [
    { month: '8월', newReferrers: 180, newReferrals: 980, revenue: 680000000, customerSatisfaction: 4.3, repeatCustomers: 650 },
    { month: '9월', newReferrers: 220, newReferrals: 1150, revenue: 720000000, customerSatisfaction: 4.4, repeatCustomers: 720 },
    { month: '10월', newReferrers: 190, newReferrals: 1080, revenue: 750000000, customerSatisfaction: 4.5, repeatCustomers: 780 },
    { month: '11월', newReferrers: 280, newReferrals: 1420, revenue: 890000000, customerSatisfaction: 4.6, repeatCustomers: 920 },
    { month: '12월', newReferrers: 320, newReferrals: 1680, revenue: 1020000000, customerSatisfaction: 4.7, repeatCustomers: 1050 },
    { month: '1월', newReferrers: 290, newReferrals: 1560, revenue: 980000000, customerSatisfaction: 4.5, repeatCustomers: 980 }
  ];

  // 등급별 성과 분석
  const tierPerformance = [
    { tier: 'PLATINUM', referrers: 180, avgReferrals: 42, avgRevenue: 158000000, conversionRate: 78.5 },
    { tier: 'GOLD', referrers: 520, avgReferrals: 28, avgRevenue: 98000000, conversionRate: 72.3 },
    { tier: 'SILVER', referrers: 890, avgReferrals: 16, avgRevenue: 52000000, conversionRate: 68.7 },
    { tier: 'BRONZE', referrers: 1250, avgReferrals: 8, avgRevenue: 28000000, conversionRate: 62.1 }
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
      case 'PLATINUM': return '#E5E4E2';
      case 'GOLD': return '#FFD700';
      case 'SILVER': return '#C0C0C0';
      case 'BRONZE': return '#CD7F32';
      default: return '#94a3b8';
    }
  };

  const getTierIcon = (tier: string) => {
    switch (tier) {
      case 'PLATINUM': return <Award className="w-4 h-4" />;
      case 'GOLD': return <Star className="w-4 h-4" />;
      case 'SILVER': return <Target className="w-4 h-4" />;
      case 'BRONZE': return <Users className="w-4 h-4" />;
      default: return <Users className="w-4 h-4" />;
    }
  };

  return (
    <div className="referral-analytics-dashboard">
      <div className="dashboard-header">
        <div className="header-title">
          <Share2 className="w-8 h-8 text-green-600" />
          <h1>소개인 분석 대시보드</h1>
        </div>
        <div className="header-subtitle">
          소개인/소개받은고객 매출 분석 및 KPI
        </div>
      </div>

      {/* 핵심 지표 요약 */}
      <div className="referral-summary">
        <div className="summary-card total-referrers">
          <div className="card-icon">
            <Users className="w-8 h-8" />
          </div>
          <div className="card-content">
            <h3>총 소개인</h3>
            <div className="card-value">{formatNumber(referralMetrics.totalReferrers)}</div>
            <div className="card-change positive">
              <ArrowUpRight className="w-4 h-4" />
              <span>+{referralMetrics.growthRate}%</span>
            </div>
          </div>
        </div>

        <div className="summary-card total-referrals">
          <div className="card-icon">
            <UserPlus className="w-8 h-8" />
          </div>
          <div className="card-content">
            <h3>총 소개 건수</h3>
            <div className="card-value">{formatNumber(referralMetrics.totalReferrals)}</div>
            <div className="card-change positive">
              <ArrowUpRight className="w-4 h-4" />
              <span>+18.5%</span>
            </div>
          </div>
        </div>

        <div className="summary-card total-revenue">
          <div className="card-icon">
            <span className="text-2xl font-bold text-blue-600">₩</span>
          </div>
          <div className="card-content">
            <h3>총 매출</h3>
            <div className="card-value">{formatCurrency(referralMetrics.totalRevenue)}</div>
            <div className="card-change positive">
              <ArrowUpRight className="w-4 h-4" />
              <span>+22.3%</span>
            </div>
          </div>
        </div>

        <div className="summary-card conversion-rate">
          <div className="card-icon">
            <Target className="w-8 h-8" />
          </div>
          <div className="card-content">
            <h3>전환율</h3>
            <div className="card-value">{referralMetrics.conversionRate}%</div>
            <div className="card-change positive">
              <ArrowUpRight className="w-4 h-4" />
              <span>+3.2%</span>
            </div>
          </div>
        </div>
      </div>

      {/* 탑 소개인 랭킹 */}
      <div className="top-referrers">
        <h2>탑 소개인 랭킹</h2>
        <div className="referrer-cards">
          {referralData.map((referrer, index) => (
            <div key={referrer.id} className="referrer-card">
              <div className="referrer-header">
                <div className="referrer-rank">
                  <span className="rank-number">#{index + 1}</span>
                  <div className="rank-badge">
                    {index === 0 && <Award className="w-5 h-5 text-yellow-500" />}
                    {index === 1 && <Award className="w-5 h-5 text-gray-400" />}
                    {index === 2 && <Award className="w-5 h-5 text-amber-600" />}
                  </div>
                </div>
                <div className="referrer-info">
                  <div className="referrer-avatar">{referrer.avatar}</div>
                  <div className="referrer-details">
                    <h3>{referrer.referrerName}</h3>
                    <div className="referrer-tier">
                      <div 
                        className="tier-badge" 
                        style={{ backgroundColor: getTierColor(referrer.referrerTier) }}
                      >
                        {getTierIcon(referrer.referrerTier)}
                        <span>{referrer.referrerTier}</span>
                      </div>
                      <span className="status-badge">
                        {referrer.status === 'active' ? '활성' : '비활성'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="referrer-metrics">
                <div className="metrics-grid">
                  <div className="metric-item">
                    <span className="metric-label">소개 건수</span>
                    <span className="metric-value">{referrer.referralCount}</span>
                  </div>
                  <div className="metric-item">
                    <span className="metric-label">성공 건수</span>
                    <span className="metric-value">{referrer.successfulReferrals}</span>
                  </div>
                  <div className="metric-item">
                    <span className="metric-label">전환율</span>
                    <span className="metric-value">{referrer.conversionRate}%</span>
                  </div>
                  <div className="metric-item">
                    <span className="metric-label">총 매출</span>
                    <span className="metric-value">{formatCurrency(referrer.totalRevenue)}</span>
                  </div>
                  <div className="metric-item">
                    <span className="metric-label">고객만족도</span>
                    <span className="metric-value">{referrer.customerSatisfaction}/5.0</span>
                  </div>
                  <div className="metric-item">
                    <span className="metric-label">재구매고객</span>
                    <span className="metric-value">{referrer.repeatCustomers}명</span>
                  </div>
                  <div className="metric-item">
                    <span className="metric-label">평생가치</span>
                    <span className="metric-value">{formatCurrency(referrer.averageLifetimeValue)}</span>
                  </div>
                  <div className="metric-item">
                    <span className="metric-label">평균 주문액</span>
                    <span className="metric-value">{formatCurrency(referrer.averageOrderValue)}</span>
                  </div>
                </div>

                <div className="referrer-performance">
                  <div className="performance-bar">
                    <div className="bar-label">성공률</div>
                    <div className="bar-container">
                      <div 
                        className="bar-fill" 
                        style={{ 
                          width: `${referrer.conversionRate}%`,
                          backgroundColor: getTierColor(referrer.referrerTier)
                        }}
                      ></div>
                    </div>
                    <div className="bar-value">{referrer.conversionRate}%</div>
                  </div>
                </div>
              </div>

              <div className="referrer-footer">
                <div className="join-date">
                  <Calendar className="w-4 h-4" />
                  <span>가입: {referrer.joinDate}</span>
                </div>
                <div className="last-activity">
                  <TrendingUp className="w-4 h-4" />
                  <span>최근: {referrer.lastActivity}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 월별 추이 및 등급별 성과 */}
      <div className="trend-and-tier-analysis">
        <div className="monthly-trend">
          <h3>월별 소개 추이</h3>
          <div className="trend-chart">
            <div className="chart-legend">
              <div className="legend-item">
                <div className="legend-color referrers"></div>
                <span>신규 소개인</span>
              </div>
              <div className="legend-item">
                <div className="legend-color referrals"></div>
                <span>신규 소개</span>
              </div>
            </div>
            <div className="chart-bars">
              {monthlyTrend.map((data, index) => (
                <div key={index} className="trend-bar">
                  <div className="bar-group">
                    <div 
                      className="referrers-bar"
                      style={{ 
                        height: `${(data.newReferrers / 350) * 100}%`,
                        backgroundColor: '#3B82F6'
                      }}
                    ></div>
                    <div 
                      className="referrals-bar"
                      style={{ 
                        height: `${(data.newReferrals / 1800) * 100}%`,
                        backgroundColor: '#10B981'
                      }}
                    ></div>
                  </div>
                  <div className="bar-label">{data.month}</div>
                  <div className="bar-values">
                    <div className="referrers-value">{data.newReferrers}</div>
                    <div className="referrals-value">{data.newReferrals}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="tier-performance">
          <h3>등급별 성과 분석</h3>
          <div className="tier-stats">
            {tierPerformance.map((tier, index) => (
              <div key={index} className="tier-stat">
                <div className="tier-header">
                  <div 
                    className="tier-icon" 
                    style={{ backgroundColor: getTierColor(tier.tier) }}
                  >
                    {getTierIcon(tier.tier)}
                  </div>
                  <div className="tier-info">
                    <h4>{tier.tier}</h4>
                    <span className="tier-count">{tier.referrers}명</span>
                  </div>
                  <div className="tier-conversion">
                    <span className="conversion-rate">{tier.conversionRate}%</span>
                  </div>
                </div>
                <div className="tier-metrics">
                  <div className="tier-metric">
                    <span className="metric-label">평균 소개 건수</span>
                    <span className="metric-value">{tier.avgReferrals}</span>
                  </div>
                  <div className="tier-metric">
                    <span className="metric-label">평균 매출</span>
                    <span className="metric-value">{formatCurrency(tier.avgRevenue)}</span>
                  </div>
                </div>
                <div className="tier-progress">
                  <div className="progress-bar">
                    <div 
                      className="progress-fill" 
                      style={{ 
                        width: `${(tier.avgReferrals / 45) * 100}%`,
                        backgroundColor: getTierColor(tier.tier)
                      }}
                    ></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 매출 및 고객 품질 분석 */}
      <div className="revenue-quality-analysis">
        <div className="revenue-trend">
          <h3>매출 및 고객 품질 추이</h3>
          <div className="chart-container">
            <div className="chart-header">
              <div className="chart-legend">
                <div className="legend-item">
                  <div className="legend-color revenue-color"></div>
                  <span>매출</span>
                </div>
                <div className="legend-item">
                  <div className="legend-color quality-color"></div>
                  <span>고객만족도</span>
                </div>
                <div className="legend-item">
                  <div className="legend-color repeat-color"></div>
                  <span>재구매고객</span>
                </div>
              </div>
            </div>
            <div className="revenue-chart">
              {monthlyTrend.map((data, index) => (
                <div key={index} className="chart-column">
                  <div className="column-header">
                    <div className="month-label">{data.month}</div>
                  </div>
                  <div className="bars-container">
                    <div className="bar-group">
                      <div className="bar-wrapper">
                        <div 
                          className="revenue-bar-fill"
                          style={{ 
                            height: `${(data.revenue / 1200000000) * 100}%`,
                            background: 'linear-gradient(180deg, #3B82F6 0%, #1D4ED8 100%)'
                          }}
                        ></div>
                        <div className="bar-label">매출</div>
                        <div className="bar-value">{formatCurrency(data.revenue)}</div>
                      </div>
                    </div>
                    <div className="bar-group">
                      <div className="bar-wrapper">
                        <div 
                          className="quality-bar-fill"
                          style={{ 
                            height: `${(data.customerSatisfaction / 5.0) * 100}%`,
                            background: 'linear-gradient(180deg, #10B981 0%, #059669 100%)'
                          }}
                        ></div>
                        <div className="bar-label">만족도</div>
                        <div className="bar-value">{data.customerSatisfaction}/5.0</div>
                      </div>
                    </div>
                    <div className="bar-group">
                      <div className="bar-wrapper">
                        <div 
                          className="repeat-bar-fill"
                          style={{ 
                            height: `${(data.repeatCustomers / 1200) * 100}%`,
                            background: 'linear-gradient(180deg, #F59E0B 0%, #D97706 100%)'
                          }}
                        ></div>
                        <div className="bar-label">재구매</div>
                        <div className="bar-value">{data.repeatCustomers}명</div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="customer-quality-summary">
          <h3>고객 품질 현황</h3>
          <div className="quality-cards">
            <div className="quality-card">
              <div className="quality-icon">
                <Star className="w-6 h-6" />
              </div>
              <div className="quality-content">
                <h4>평균 고객만족도</h4>
                <div className="quality-value">{referralMetrics.averageCustomerSatisfaction}/5.0</div>
                <div className="quality-rate">전체 고객 기준</div>
              </div>
            </div>
            <div className="quality-card">
              <div className="quality-icon">
                <Users className="w-6 h-6" />
              </div>
              <div className="quality-content">
                <h4>재구매 고객율</h4>
                <div className="quality-value">{referralMetrics.repeatCustomerRate}%</div>
                <div className="quality-rate">소개 고객 중</div>
              </div>
            </div>
            <div className="quality-card">
              <div className="quality-icon">
                <span className="text-lg font-bold text-blue-600">₩</span>
              </div>
              <div className="quality-content">
                <h4>평균 평생가치</h4>
                <div className="quality-value">{formatCurrency(referralMetrics.averageLifetimeValue)}</div>
                <div className="quality-rate">고객당 평균</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReferralAnalyticsDashboard;
