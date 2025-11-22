import React from 'react';
import { 
  Heart, 
  Star, 
  Crown, 
  Gift, 
  Users, 
  TrendingUp, 
  TrendingDown,
  Award,
  Clock,
  Target
} from 'lucide-react';
import './CustomerLoyaltyDashboard.css';

interface LoyaltyTier {
  tier: string;
  name: string;
  description: string;
  minPoints: number;
  maxPoints: number;
  customerCount: number;
  percentage: number;
  benefits: string[];
  color: string;
  icon: React.ReactNode;
}

interface LoyaltyMetrics {
  totalMembers: number;
  activeMembers: number;
  averagePoints: number;
  redemptionRate: number;
  retentionRate: number;
  lifetimeValue: number;
}

interface PointActivity {
  date: string;
  earned: number;
  redeemed: number;
  expired: number;
  netPoints: number;
}

interface ChurnAnalysis {
  totalCustomers: number;
  churnedCustomers: number;
  churnRate: number;
  retentionRate: number;
  avgLifetimeMonths: number;
  churnByTier: {
    tier: string;
    churnRate: number;
    customerCount: number;
  }[];
  churnTrend: {
    month: string;
    churnRate: number;
    retentionRate: number;
  }[];
}

const CustomerLoyaltyDashboard: React.FC = () => {
  // 충성도 등급 데이터
  const loyaltyTiers: LoyaltyTier[] = [
    {
      tier: 'BRONZE',
      name: '브론즈',
      description: '신규 고객',
      minPoints: 0,
      maxPoints: 999,
      customerCount: 12500,
      percentage: 45.2,
      benefits: ['1% 적립', '생일 쿠폰'],
      color: '#CD7F32',
      icon: <Heart className="w-6 h-6" />
    },
    {
      tier: 'SILVER',
      name: '실버',
      description: '활성 고객',
      minPoints: 1000,
      maxPoints: 4999,
      customerCount: 8900,
      percentage: 32.1,
      benefits: ['2% 적립', '무료배송', '생일 쿠폰', '우선 상담'],
      color: '#C0C0C0',
      icon: <Star className="w-6 h-6" />
    },
    {
      tier: 'GOLD',
      name: '골드',
      description: 'VIP 고객',
      minPoints: 5000,
      maxPoints: 9999,
      customerCount: 4200,
      percentage: 15.2,
      benefits: ['3% 적립', '무료배송', '생일 쿠폰', '우선 상담', '전용 상품'],
      color: '#FFD700',
      icon: <Crown className="w-6 h-6" />
    },
    {
      tier: 'PLATINUM',
      name: '플래티넘',
      description: '프리미엄 고객',
      minPoints: 10000,
      maxPoints: 999999,
      customerCount: 2100,
      percentage: 7.5,
      benefits: ['5% 적립', '무료배송', '생일 쿠폰', '우선 상담', '전용 상품', '개인 상담사'],
      color: '#1a1a1a',
      icon: <Award className="w-6 h-6" />
    }
  ];

  // 충성도 메트릭스
  const loyaltyMetrics: LoyaltyMetrics = {
    totalMembers: 27700,
    activeMembers: 18900,
    averagePoints: 3240,
    redemptionRate: 68.5,
    retentionRate: 84.2,
    lifetimeValue: 2850000
  };

  // 포인트 활동 추이 (최근 6개월)
  const pointActivity: PointActivity[] = [
    { date: '8월', earned: 4500000, redeemed: 3200000, expired: 180000, netPoints: 1120000 },
    { date: '9월', earned: 5200000, redeemed: 3800000, expired: 220000, netPoints: 1180000 },
    { date: '10월', earned: 4800000, redeemed: 3500000, expired: 200000, netPoints: 1100000 },
    { date: '11월', earned: 6100000, redeemed: 4200000, expired: 250000, netPoints: 1650000 },
    { date: '12월', earned: 7800000, redeemed: 5800000, expired: 320000, netPoints: 1680000 },
    { date: '1월', earned: 6800000, redeemed: 4600000, expired: 280000, netPoints: 1920000 }
  ];

  // 고객 이탈율 분석 데이터
  const churnAnalysis: ChurnAnalysis = {
    totalCustomers: 27700,
    churnedCustomers: 3324,
    churnRate: 12.0,
    retentionRate: 88.0,
    avgLifetimeMonths: 18.5,
    churnByTier: [
      { tier: '브론즈', churnRate: 18.5, customerCount: 12500 },
      { tier: '실버', churnRate: 8.2, customerCount: 8900 },
      { tier: '골드', churnRate: 4.8, customerCount: 4200 },
      { tier: '플래티넘', churnRate: 2.1, customerCount: 2100 }
    ],
    churnTrend: [
      { month: '2024-01', churnRate: 14.2, retentionRate: 85.8 },
      { month: '2024-02', churnRate: 13.8, retentionRate: 86.2 },
      { month: '2024-03', churnRate: 12.5, retentionRate: 87.5 },
      { month: '2024-04', churnRate: 11.8, retentionRate: 88.2 },
      { month: '2024-05', churnRate: 12.3, retentionRate: 87.7 },
      { month: '2024-06', churnRate: 12.0, retentionRate: 88.0 }
    ]
  };

  // 충성도 프로그램 성과
  const loyaltyPerformance = [
    { metric: '신규 가입자', value: 3240, change: '+15.2%', trend: 'up' },
    { metric: '포인트 적립액', value: 6800000, change: '+8.7%', trend: 'up' },
    { metric: '포인트 사용액', value: 4600000, change: '+12.3%', trend: 'up' },
    { metric: '재구매율', value: 84.2, change: '+2.1%', trend: 'up' },
    { metric: '평균 구매주기', value: 28, change: '-5.2%', trend: 'down' },
    { metric: '고객 생애 가치', value: 2850000, change: '+18.9%', trend: 'up' }
  ];

  const formatNumber = (num: number): string => {
    if (num >= 10000000) {
      return (num / 10000000).toFixed(1) + '천만';
    } else if (num >= 10000) {
      return (num / 10000).toFixed(1) + '만';
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

  return (
    <div className="customer-loyalty-dashboard">
      {/* 대시보드 헤더 */}
      <div className="loyalty-dashboard-header">
        <div className="header-title">
          <Heart className="w-8 h-8 text-red-500" />
          <h1>고객 충성도 대시보드</h1>
        </div>
        <div className="header-subtitle">
          충성도 프로그램 성과 및 고객 등급 분석
        </div>
      </div>

      {/* 핵심 지표 요약 */}
      <div className="loyalty-summary">
        <div className="summary-card total-members">
          <div className="card-icon">
            <Users className="w-8 h-8" />
          </div>
          <div className="card-content">
            <h3>총 멤버 수</h3>
            <div className="card-value">{formatNumber(loyaltyMetrics.totalMembers)}</div>
            <div className="card-change positive">
              <TrendingUp className="w-4 h-4" />
              <span>+12.5%</span>
            </div>
          </div>
        </div>

        <div className="summary-card active-members">
          <div className="card-icon">
            <Target className="w-8 h-8" />
          </div>
          <div className="card-content">
            <h3>활성 멤버</h3>
            <div className="card-value">{formatNumber(loyaltyMetrics.activeMembers)}</div>
            <div className="card-change positive">
              <TrendingUp className="w-4 h-4" />
              <span>+8.3%</span>
            </div>
          </div>
        </div>

        <div className="summary-card average-points">
          <div className="card-icon">
            <Gift className="w-8 h-8" />
          </div>
          <div className="card-content">
            <h3>평균 포인트</h3>
            <div className="card-value">{formatNumber(loyaltyMetrics.averagePoints)}</div>
            <div className="card-change positive">
              <TrendingUp className="w-4 h-4" />
              <span>+15.7%</span>
            </div>
          </div>
        </div>

        <div className="summary-card lifetime-value">
          <div className="card-icon">
            <span className="text-2xl font-bold text-blue-600">₩</span>
          </div>
          <div className="card-content">
            <h3>고객 생애 가치</h3>
            <div className="card-value">{formatCurrency(loyaltyMetrics.lifetimeValue)}</div>
            <div className="card-change positive">
              <TrendingUp className="w-4 h-4" />
              <span>+18.9%</span>
            </div>
          </div>
        </div>
      </div>

      {/* 등급별 고객 분포 */}
      <div className="tier-distribution">
        <h2>충성도 등급별 고객 분포</h2>
        <div className="tier-cards">
          {loyaltyTiers.map((tier, index) => (
            <div key={index} className="tier-card" data-tier={tier.tier}>
              <div className="tier-header">
                <div className="tier-icon" style={{ backgroundColor: tier.color }}>
                  {tier.icon}
                </div>
                <div className="tier-info">
                  <h3>{tier.name}</h3>
                  <p>{tier.description}</p>
                </div>
                <div className="tier-percentage">
                  <span className="percentage-value">{tier.percentage}%</span>
                  <span className="percentage-label">전체 고객</span>
                </div>
              </div>

              <div className="tier-metrics">
                <div className="metric-row">
                  <span className="metric-label">고객 수</span>
                  <span className="metric-value">{formatNumber(tier.customerCount)}</span>
                </div>
                <div className="metric-row">
                  <span className="metric-label">포인트 범위</span>
                  <span className="metric-value">{tier.minPoints.toLocaleString()} - {tier.maxPoints.toLocaleString()}</span>
                </div>
              </div>

              <div className="tier-benefits">
                <h4>혜택</h4>
                <ul>
                  {tier.benefits.map((benefit, benefitIndex) => (
                    <li key={benefitIndex}>{benefit}</li>
                  ))}
                </ul>
              </div>

              <div className="tier-progress">
                <div className="progress-bar">
                  <div 
                    className="progress-fill" 
                    style={{ 
                      width: `${tier.percentage}%`,
                      backgroundColor: tier.color
                    }}
                  ></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
{/* 
      등급별 혜택 비교표
      <div className="benefit-comparison">
        <h2>등급별 혜택 비교</h2>
        <div className="comparison-table">
          <div className="comparison-header">
            <div className="tier-column header">등급</div>
            <div className="benefit-column header">적립률</div>
            <div className="benefit-column header">무료배송</div>
            <div className="benefit-column header">생일쿠폰</div>
            <div className="benefit-column header">우선상담</div>
            <div className="benefit-column header">전용상품</div>
            <div className="benefit-column header">개인상담사</div>
          </div>
          {loyaltyTiers.map((tier, index) => (
            <div key={index} className="comparison-row">
              <div className="tier-column">
                <div className="tier-badge" style={{ backgroundColor: tier.color }}>
                  <span className="tier-icon">{tier.icon}</span>
                  <span className="tier-name">{tier.name}</span>
                </div>
              </div>
              <div className="benefit-column">
                <div className={`benefit-item ${tier.benefits.some(b => b.includes('% 적립')) ? 'available' : 'unavailable'}`}>
                  {tier.benefits.find(b => b.includes('% 적립')) || '-'}
                </div>
              </div>
              <div className="benefit-column">
                <div className={`benefit-item ${tier.benefits.includes('무료배송') ? 'available' : 'unavailable'}`}>
                  {tier.benefits.includes('무료배송') ? '✓' : '✗'}
                </div>
              </div>
              <div className="benefit-column">
                <div className={`benefit-item ${tier.benefits.includes('생일 쿠폰') ? 'available' : 'unavailable'}`}>
                  {tier.benefits.includes('생일 쿠폰') ? '✓' : '✗'}
                </div>
              </div>
              <div className="benefit-column">
                <div className={`benefit-item ${tier.benefits.includes('우선 상담') ? 'available' : 'unavailable'}`}>
                  {tier.benefits.includes('우선 상담') ? '✓' : '✗'}
                </div>
              </div>
              <div className="benefit-column">
                <div className={`benefit-item ${tier.benefits.includes('전용 상품') ? 'available' : 'unavailable'}`}>
                  {tier.benefits.includes('전용 상품') ? '✓' : '✗'}
                </div>
              </div>
              <div className="benefit-column">
                <div className={`benefit-item ${tier.benefits.includes('개인 상담사') ? 'available' : 'unavailable'}`}>
                  {tier.benefits.includes('개인 상담사') ? '✓' : '✗'}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div> */}

      {/* 고객 이탈율 분석 */}
      <div className="churn-analysis">
        <h2>고객 이탈율 분석</h2>
        <div className="churn-overview">
          <div className="churn-metrics">
            <div className="churn-metric">
              <div className="metric-icon churn">
                <TrendingDown className="w-6 h-6" />
              </div>
              <div className="metric-content">
                <h3>전체 이탈율</h3>
                <div className="metric-value">{churnAnalysis.churnRate}%</div>
                <div className="metric-change positive">-2.2% 전월 대비</div>
              </div>
            </div>
            <div className="churn-metric">
              <div className="metric-icon retention">
                <TrendingUp className="w-6 h-6" />
              </div>
              <div className="metric-content">
                <h3>고객 유지율</h3>
                <div className="metric-value">{churnAnalysis.retentionRate}%</div>
                <div className="metric-change positive">+2.2% 전월 대비</div>
              </div>
            </div>
            <div className="churn-metric">
              <div className="metric-icon lifetime">
                <Clock className="w-6 h-6" />
              </div>
              <div className="metric-content">
                <h3>평균 고객 생애</h3>
                <div className="metric-value">{churnAnalysis.avgLifetimeMonths}개월</div>
                <div className="metric-change positive">+1.2개월 전월 대비</div>
              </div>
            </div>
          </div>
        </div>

        <div className="churn-details">
          <div className="churn-by-tier">
            <h3>등급별 이탈율</h3>
            <div className="tier-churn-list">
              {churnAnalysis.churnByTier.map((tierChurn, index) => (
                <div key={index} className="tier-churn-item">
                  <div className="tier-info">
                    <div className="tier-name">{tierChurn.tier}</div>
                    <div className="tier-count">{tierChurn.customerCount.toLocaleString()}명</div>
                  </div>
                  <div className="churn-rate">
                    <div className="rate-value">{tierChurn.churnRate}%</div>
                    <div className="rate-bar">
                      <div 
                        className="rate-fill" 
                        style={{ 
                          width: `${Math.min(tierChurn.churnRate * 4, 100)}%`,
                          backgroundColor: tierChurn.churnRate > 15 ? '#ef4444' : 
                                          tierChurn.churnRate > 10 ? '#f59e0b' : '#22c55e'
                        }}
                      ></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="churn-trend">
            <h3>이탈율 추이 (최근 6개월)</h3>
            <div className="trend-chart">
              <div className="chart-bars">
                {churnAnalysis.churnTrend.map((trend, index) => (
                  <div key={index} className="chart-bar-group">
                    <div className="bar-container">
                      <div 
                        className="churn-bar" 
                        style={{ height: `${(trend.churnRate / 20) * 100}%` }}
                      ></div>
                      <div 
                        className="retention-bar" 
                        style={{ height: `${(trend.retentionRate / 100) * 100}%` }}
                      ></div>
                    </div>
                    <div className="bar-label">{trend.month.split('-')[1]}월</div>
                    <div className="bar-values">
                      <div className="churn-value">{trend.churnRate}%</div>
                      <div className="retention-value">{trend.retentionRate}%</div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="chart-legend">
                <div className="legend-item">
                  <div className="legend-color churn"></div>
                  <span>이탈율</span>
                </div>
                <div className="legend-item">
                  <div className="legend-color retention"></div>
                  <span>유지율</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 포인트 활동 추이 */}
      <div className="point-activity">
        <h2>포인트 활동 추이</h2>
        <div className="activity-chart">
          <div className="chart-header">
            <div className="chart-legend">
              <div className="legend-item">
                <div className="legend-color earned"></div>
                <span>적립</span>
              </div>
              <div className="legend-item">
                <div className="legend-color redeemed"></div>
                <span>사용</span>
              </div>
              <div className="legend-item">
                <div className="legend-color expired"></div>
                <span>만료</span>
              </div>
            </div>
          </div>
          <div className="chart-bars">
            {pointActivity.map((activity, index) => (
              <div key={index} className="activity-bar">
                <div className="bar-group">
                  <div 
                    className="earned-bar"
                    style={{ 
                      height: `${(activity.earned / 8000000) * 100}%`,
                      backgroundColor: '#10B981'
                    }}
                  ></div>
                  <div 
                    className="redeemed-bar"
                    style={{ 
                      height: `${(activity.redeemed / 8000000) * 100}%`,
                      backgroundColor: '#3B82F6'
                    }}
                  ></div>
                  <div 
                    className="expired-bar"
                    style={{ 
                      height: `${(activity.expired / 8000000) * 100}%`,
                      backgroundColor: '#EF4444'
                    }}
                  ></div>
                </div>
                <div className="bar-label">{activity.date}</div>
                <div className="bar-net">
                  <span className="net-label">순증</span>
                  <span className="net-value">{formatNumber(activity.netPoints)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 성과 지표 */}
      <div className="loyalty-performance">
        <h2>충성도 프로그램 성과</h2>
        <div className="performance-grid">
          {loyaltyPerformance.map((performance, index) => (
            <div key={index} className="performance-card">
              <div className="performance-header">
                <h3>{performance.metric}</h3>
                <div className={`performance-trend ${performance.trend}`}>
                  {performance.trend === 'up' ? (
                    <TrendingUp className="w-4 h-4" />
                  ) : (
                    <TrendingUp className="w-4 h-4 rotate-180" />
                  )}
                </div>
              </div>
              <div className="performance-value">
                {typeof performance.value === 'number' && performance.value > 1000000 
                  ? formatCurrency(performance.value)
                  : typeof performance.value === 'number' && performance.value > 1000
                  ? formatNumber(performance.value)
                  : performance.value}
                {typeof performance.value === 'number' && performance.value < 1000 && performance.value > 0 && (
                  <span className="unit">{performance.metric.includes('주기') ? '일' : '%'}</span>
                )}
              </div>
              <div className="performance-change">
                <span className={`change-value ${performance.trend}`}>
                  {performance.change}
                </span>
                <span className="change-period">전월 대비</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 등급별 혜택 비교 */}
      <div className="benefits-comparison">
        <h2>등급별 혜택 비교</h2>
        <div className="benefits-table">
          <div className="table-header">
            <div className="header-cell benefit-name">혜택</div>
            {loyaltyTiers.map((tier, index) => (
              <div key={index} className="header-cell tier-header">
                <div className="tier-badge" style={{ backgroundColor: tier.color }}>
                  {tier.name}
                </div>
              </div>
            ))}
          </div>
          <div className="table-body">
            {['1% 적립', '2% 적립', '3% 적립', '5% 적립', '무료배송', '생일 쿠폰', '우선 상담', '전용 상품', '개인 상담사'].map((benefit, benefitIndex) => (
              <div key={benefitIndex} className="table-row">
                <div className="row-cell benefit-name">{benefit}</div>
                {loyaltyTiers.map((tier, tierIndex) => (
                  <div key={tierIndex} className="row-cell tier-cell">
                    {tier.benefits.includes(benefit) ? (
                      <div className="check-mark">✓</div>
                    ) : (
                      <div className="no-mark">-</div>
                    )}
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CustomerLoyaltyDashboard;
