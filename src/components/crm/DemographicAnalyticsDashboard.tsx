import React from 'react';
import { 
  Users, 
  ArrowUpRight,
  ArrowDownRight,
  Flower2,
  Sun,
  Leaf,
  Snowflake,
  GraduationCap,
  Briefcase,
  Home,
  Crown,
  TreePine
} from 'lucide-react';
import './DemographicAnalyticsDashboard.css';

// 커스텀 Male 아이콘 컴포넌트
const MaleIcon: React.FC<{ className?: string }> = ({ className = "w-4 h-4" }) => (
  <svg 
    className={className} 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round"
  >
    <circle cx="10" cy="14" r="8"/>
    <path d="m15 9 6-6"/>
    <path d="m21 3-6 6"/>
    <path d="m17 3h4v4"/>
  </svg>
);

// 커스텀 Female 아이콘 컴포넌트
const FemaleIcon: React.FC<{ className?: string }> = ({ className = "w-4 h-4" }) => (
  <svg 
    className={className} 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round"
  >
    <circle cx="12" cy="8" r="7"/>
    <path d="m12 15v6"/>
    <path d="m9 18h6"/>
  </svg>
);

interface SeasonalData {
  season: string;
  quarter: string;
  revenue: number;
  orders: number;
  averageOrderValue: number;
  growthRate: number;
  color: string;
  icon: React.ReactNode;
}

interface AgeGroupData {
  ageGroup: string;
  customerCount: number;
  revenue: number;
  orders: number;
  averageOrderValue: number;
  growthRate: number;
  percentage: number;
  color: string;
  icon: React.ReactNode;
}

interface GenderData {
  gender: string;
  customerCount: number;
  revenue: number;
  orders: number;
  averageOrderValue: number;
  growthRate: number;
  percentage: number;
  color: string;
  icon: React.ReactNode;
}

interface MonthlyTrend {
  month: string;
  revenue: number;
  orders: number;
  maleRevenue: number;
  femaleRevenue: number;
  ageGroup20s: number;
  ageGroup30s: number;
  ageGroup40s: number;
  ageGroup50s: number;
  ageGroup60s: number;
}

const DemographicAnalyticsDashboard: React.FC = () => {
  // 계절별 데이터
  const seasonalData: SeasonalData[] = [
    {
      season: '봄',
      quarter: 'Q1 (3-5월)',
      revenue: 1280000000,
      orders: 3420,
      averageOrderValue: 374000,
      growthRate: 12.5,
      color: '#10B981',
      icon: <Flower2 className="w-6 h-6" />
    },
    {
      season: '여름',
      quarter: 'Q2 (6-8월)',
      revenue: 1560000000,
      orders: 4180,
      averageOrderValue: 373000,
      growthRate: 21.9,
      color: '#3B82F6',
      icon: <Sun className="w-6 h-6" />
    },
    {
      season: '가을',
      quarter: 'Q3 (9-11월)',
      revenue: 1340000000,
      orders: 3850,
      averageOrderValue: 348000,
      growthRate: -14.1,
      color: '#F59E0B',
      icon: <Leaf className="w-6 h-6" />
    },
    {
      season: '겨울',
      quarter: 'Q4 (12-2월)',
      revenue: 1780000000,
      orders: 4920,
      averageOrderValue: 362000,
      growthRate: 32.8,
      color: '#8B5CF6',
      icon: <Snowflake className="w-6 h-6" />
    }
  ];

  // 연령대별 데이터
  const ageGroupData: AgeGroupData[] = [
    {
      ageGroup: '20대',
      customerCount: 12400,
      revenue: 1890000000,
      orders: 5120,
      averageOrderValue: 369000,
      growthRate: 18.7,
      percentage: 28.5,
      color: '#3B82F6',
      icon: <GraduationCap className="w-5 h-5" />
    },
    {
      ageGroup: '30대',
      customerCount: 15600,
      revenue: 2340000000,
      orders: 6280,
      averageOrderValue: 373000,
      growthRate: 22.3,
      percentage: 35.9,
      color: '#10B981',
      icon: <Briefcase className="w-5 h-5" />
    },
    {
      ageGroup: '40대',
      customerCount: 9800,
      revenue: 1780000000,
      orders: 4150,
      averageOrderValue: 429000,
      growthRate: 15.8,
      percentage: 22.5,
      color: '#F59E0B',
      icon: <Home className="w-5 h-5" />
    },
    {
      ageGroup: '50대',
      customerCount: 4200,
      revenue: 890000000,
      orders: 1820,
      averageOrderValue: 489000,
      growthRate: 8.9,
      percentage: 9.7,
      color: '#8B5CF6',
      icon: <Crown className="w-5 h-5" />
    },
    {
      ageGroup: '60대+',
      customerCount: 1600,
      revenue: 320000000,
      orders: 680,
      averageOrderValue: 471000,
      growthRate: 5.2,
      percentage: 3.7,
      color: '#EF4444',
      icon: <TreePine className="w-5 h-5" />
    }
  ];

  // 성별 데이터
  const genderData: GenderData[] = [
    {
      gender: '남성',
      customerCount: 18600,
      revenue: 2980000000,
      orders: 7850,
      averageOrderValue: 380000,
      growthRate: 16.8,
      percentage: 42.8,
      color: '#3B82F6',
      icon: <MaleIcon className="w-4 h-4" />
    },
    {
      gender: '여성',
      customerCount: 24800,
      revenue: 4150000000,
      orders: 11200,
      averageOrderValue: 371000,
      growthRate: 24.5,
      percentage: 57.2,
      color: '#EC4899',
      icon: <FemaleIcon className="w-4 h-4" />
    }
  ];

  // 월별 추이 (최근 12개월)
  const monthlyTrend: MonthlyTrend[] = [
    { month: '2월', revenue: 620000000, orders: 1680, maleRevenue: 280000000, femaleRevenue: 340000000, ageGroup20s: 180000000, ageGroup30s: 220000000, ageGroup40s: 140000000, ageGroup50s: 60000000, ageGroup60s: 20000000 },
    { month: '3월', revenue: 580000000, orders: 1580, maleRevenue: 260000000, femaleRevenue: 320000000, ageGroup20s: 170000000, ageGroup30s: 200000000, ageGroup40s: 130000000, ageGroup50s: 55000000, ageGroup60s: 25000000 },
    { month: '4월', revenue: 640000000, orders: 1720, maleRevenue: 290000000, femaleRevenue: 350000000, ageGroup20s: 190000000, ageGroup30s: 230000000, ageGroup40s: 150000000, ageGroup50s: 55000000, ageGroup60s: 15000000 },
    { month: '5월', revenue: 680000000, orders: 1820, maleRevenue: 310000000, femaleRevenue: 370000000, ageGroup20s: 200000000, ageGroup30s: 240000000, ageGroup40s: 160000000, ageGroup50s: 60000000, ageGroup60s: 20000000 },
    { month: '6월', revenue: 720000000, orders: 1920, maleRevenue: 320000000, femaleRevenue: 400000000, ageGroup20s: 210000000, ageGroup30s: 260000000, ageGroup40s: 170000000, ageGroup50s: 65000000, ageGroup60s: 15000000 },
    { month: '7월', revenue: 780000000, orders: 2080, maleRevenue: 350000000, femaleRevenue: 430000000, ageGroup20s: 230000000, ageGroup30s: 280000000, ageGroup40s: 180000000, ageGroup50s: 70000000, ageGroup60s: 20000000 },
    { month: '8월', revenue: 820000000, orders: 2180, maleRevenue: 370000000, femaleRevenue: 450000000, ageGroup20s: 240000000, ageGroup30s: 290000000, ageGroup40s: 190000000, ageGroup50s: 75000000, ageGroup60s: 25000000 },
    { month: '9월', revenue: 760000000, orders: 2020, maleRevenue: 340000000, femaleRevenue: 420000000, ageGroup20s: 220000000, ageGroup30s: 270000000, ageGroup40s: 175000000, ageGroup50s: 70000000, ageGroup60s: 25000000 },
    { month: '10월', revenue: 740000000, orders: 1980, maleRevenue: 330000000, femaleRevenue: 410000000, ageGroup20s: 210000000, ageGroup30s: 260000000, ageGroup40s: 170000000, ageGroup50s: 68000000, ageGroup60s: 32000000 },
    { month: '11월', revenue: 680000000, orders: 1820, maleRevenue: 300000000, femaleRevenue: 380000000, ageGroup20s: 190000000, ageGroup30s: 240000000, ageGroup40s: 155000000, ageGroup50s: 65000000, ageGroup60s: 30000000 },
    { month: '12월', revenue: 920000000, orders: 2480, maleRevenue: 410000000, femaleRevenue: 510000000, ageGroup20s: 270000000, ageGroup30s: 320000000, ageGroup40s: 210000000, ageGroup50s: 90000000, ageGroup60s: 30000000 },
    { month: '1월', revenue: 880000000, orders: 2380, maleRevenue: 390000000, femaleRevenue: 490000000, ageGroup20s: 260000000, ageGroup30s: 310000000, ageGroup40s: 200000000, ageGroup50s: 85000000, ageGroup60s: 25000000 }
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

  return (
    <div className="demographic-analytics-dashboard">
      <div className="dashboard-header">
        <div className="header-title">
          <Users className="w-8 h-8 text-purple-600" />
          <h1>계절/연령/성별통계 분석</h1>
        </div>
        <div className="header-subtitle">
          계절별, 연령별, 성별 매출 분석
        </div>
      </div>

      {/* 계절별 분석 */}
      <div className="seasonal-analysis">
        <h2>계절별 매출 분석</h2>
        <div className="seasonal-cards">
          {seasonalData.map((season, index) => (
            <div key={index} className="seasonal-card">
              <div className="seasonal-header">
                <div className="seasonal-icon" style={{ backgroundColor: season.color }}>
                  {season.icon}
                </div>
                <div className="seasonal-info">
                  <h3>{season.season}</h3>
                  <p>{season.quarter}</p>
                </div>
                <div className="seasonal-growth">
                  <span className={`growth-rate ${season.growthRate > 0 ? 'positive' : 'negative'}`}>
                    {season.growthRate > 0 ? (
                      <ArrowUpRight className="w-4 h-4" />
                    ) : (
                      <ArrowDownRight className="w-4 h-4" />
                    )}
                    {Math.abs(season.growthRate)}%
                  </span>
                </div>
              </div>

              <div className="seasonal-metrics">
                <div className="metric-row">
                  <span className="metric-label">매출</span>
                  <span className="metric-value">{formatCurrency(season.revenue)}</span>
                </div>
                <div className="metric-row">
                  <span className="metric-label">주문 수</span>
                  <span className="metric-value">{formatNumber(season.orders)}</span>
                </div>
                <div className="metric-row">
                  <span className="metric-label">평균 주문액</span>
                  <span className="metric-value">{formatCurrency(season.averageOrderValue)}</span>
                </div>
              </div>

              <div className="seasonal-progress">
                <div className="progress-bar">
                  <div 
                    className="progress-fill" 
                    style={{ 
                      width: `${(season.revenue / 1800000000) * 100}%`,
                      backgroundColor: season.color
                    }}
                  ></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 연령대별 분석 */}
      <div className="age-group-analysis">
        <h2>연령대별 고객 분석</h2>
        <div className="age-group-chart">
          <div className="age-group-bars">
            {ageGroupData.map((ageGroup, index) => (
              <div key={index} className="age-group-bar">
                <div className="bar-group">
                  <div 
                    className="customer-bar"
                    style={{ 
                      height: `${(ageGroup.customerCount / 16000) * 100}%`,
                      backgroundColor: ageGroup.color
                    }}
                  ></div>
                  <div 
                    className="revenue-bar"
                    style={{ 
                      height: `${(ageGroup.revenue / 2400000000) * 100}%`,
                      backgroundColor: ageGroup.color,
                      opacity: 0.7
                    }}
                  ></div>
                </div>
                <div className="bar-label">{ageGroup.ageGroup}</div>
                <div className="bar-values">
                  <div className="customer-value">{formatNumber(ageGroup.customerCount)}</div>
                  <div className="revenue-value">{formatCurrency(ageGroup.revenue)}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="age-group-details">
          {ageGroupData.map((ageGroup, index) => (
            <div key={index} className="age-group-card">
              <div className="age-group-header">
                <div className="age-group-icon" style={{ backgroundColor: ageGroup.color }}>
                  {ageGroup.icon}
                </div>
                <div className="age-group-info">
                  <h3>{ageGroup.ageGroup}</h3>
                  <span className="percentage">{ageGroup.percentage}%</span>
                </div>
                <div className="age-group-growth">
                  <span className="growth-rate positive">
                    <ArrowUpRight className="w-4 h-4" />
                    {ageGroup.growthRate}%
                  </span>
                </div>
              </div>

              <div className="age-group-metrics">
                <div className="metric-item">
                  <span className="metric-label">고객 수</span>
                  <span className="metric-value">{formatNumber(ageGroup.customerCount)}</span>
                </div>
                <div className="metric-item">
                  <span className="metric-label">매출</span>
                  <span className="metric-value">{formatCurrency(ageGroup.revenue)}</span>
                </div>
                <div className="metric-item">
                  <span className="metric-label">주문 수</span>
                  <span className="metric-value">{formatNumber(ageGroup.orders)}</span>
                </div>
                <div className="metric-item">
                  <span className="metric-label">평균 주문액</span>
                  <span className="metric-value">{formatCurrency(ageGroup.averageOrderValue)}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 성별 분석 */}
      <div className="gender-analysis">
        <h2>성별 고객 분석</h2>
        <div className="gender-comparison">
          <div className="gender-pie-chart">
            <div className="pie-chart">
              <svg width="200" height="200" viewBox="0 0 200 200">
                {(() => {
                  const totalCustomers = genderData.reduce((sum, g) => sum + g.customerCount, 0);
                  const colors = ['#3B82F6', '#EC4899'];
                  let cumulativePercentage = 0;
                  const radius = 80;
                  const centerX = 100;
                  const centerY = 100;
                  
                  return genderData.map((gender, index) => {
                    const percentage = (gender.customerCount / totalCustomers) * 100;
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
            <div className="pie-center">
              <div className="total-revenue">{formatCurrency(7130000000)}</div>
              <div className="total-label">총 매출</div>
            </div>
          </div>

          <div className="gender-details">
            {genderData.map((gender, index) => (
              <div key={index} className="gender-card">
                <div className="gender-header">
                  <div className="gender-icon" style={{ backgroundColor: gender.color }}>
                    {gender.icon}
                  </div>
                  <div className="gender-info">
                    <h3>{gender.gender}</h3>
                    <span className="percentage">{gender.percentage}%</span>
                  </div>
                </div>

                <div className="gender-metrics">
                  <div className="metric-row">
                    <span className="metric-label">고객 수</span>
                    <span className="metric-value">{formatNumber(gender.customerCount)}</span>
                  </div>
                  <div className="metric-row">
                    <span className="metric-label">매출</span>
                    <span className="metric-value">{formatCurrency(gender.revenue)}</span>
                  </div>
                  <div className="metric-row">
                    <span className="metric-label">주문 수</span>
                    <span className="metric-value">{formatNumber(gender.orders)}</span>
                  </div>
                  <div className="metric-row">
                    <span className="metric-label">평균 주문액</span>
                    <span className="metric-value">{formatCurrency(gender.averageOrderValue)}</span>
                  </div>
                </div>

                <div className="gender-growth">
                  <span className="growth-rate positive">
                    <ArrowUpRight className="w-4 h-4" />
                    {gender.growthRate}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 월별 추이 분석 */}
      <div className="monthly-trend-analysis">
        <h2>월별 인구통계 추이</h2>
        <div className="trend-charts">
          <div className="gender-trend">
            <h3>성별 매출 추이</h3>
            <div className="trend-chart">
              {monthlyTrend.map((month, index) => (
                <div key={index} className="trend-item">
                  <div className="trend-label">{month.month}</div>
                  <div className="trend-bars">
                    <div className="gender-bar-container">
                      <div className="bar-label">남성</div>
                      <div className="bar-track">
                        <div 
                          className="male-bar"
                          style={{ 
                            width: `${(month.maleRevenue / 500000000) * 100}%`,
                            backgroundColor: '#3B82F6'
                          }}
                        ></div>
                      </div>
                      <div className="bar-value">{formatCurrency(month.maleRevenue)}</div>
                    </div>
                    <div className="gender-bar-container">
                      <div className="bar-label">여성</div>
                      <div className="bar-track">
                        <div 
                          className="female-bar"
                          style={{ 
                            width: `${(month.femaleRevenue / 500000000) * 100}%`,
                            backgroundColor: '#EC4899'
                          }}
                        ></div>
                      </div>
                      <div className="bar-value">{formatCurrency(month.femaleRevenue)}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="age-trend">
            <h3>연령대별 매출 추이</h3>
            <div className="age-trend-chart">
              {monthlyTrend.map((month, index) => {
                const totalAgeRevenue = month.ageGroup20s + month.ageGroup30s + month.ageGroup40s + month.ageGroup50s + month.ageGroup60s;
                const ageGroups = [
                  { value: month.ageGroup20s, label: '20대', color: '#3B82F6' },
                  { value: month.ageGroup30s, label: '30대', color: '#10B981' },
                  { value: month.ageGroup40s, label: '40대', color: '#F59E0B' },
                  { value: month.ageGroup50s, label: '50대', color: '#8B5CF6' },
                  { value: month.ageGroup60s, label: '60대+', color: '#EF4444' }
                ];
                
                return (
                  <div key={index} className="age-trend-item">
                    <div className="age-trend-label">{month.month}</div>
                    <div className="age-stack-bar">
                      {ageGroups.map((group, groupIndex) => {
                        const percentage = (group.value / totalAgeRevenue) * 100;
                        return (
                          <div
                            key={groupIndex}
                            className="age-segment"
                            style={{
                              width: `${percentage}%`,
                              backgroundColor: group.color
                            }}
                            title={`${group.label}: ${formatCurrency(group.value)} (${percentage.toFixed(1)}%)`}
                          ></div>
                        );
                      })}
                    </div>
                    <div className="age-total">{formatCurrency(totalAgeRevenue)}</div>
                  </div>
                );
              })}
            </div>
            <div className="age-legend">
              <div className="legend-item">
                <div className="legend-color" style={{ backgroundColor: '#3B82F6' }}></div>
                <span>20대</span>
              </div>
              <div className="legend-item">
                <div className="legend-color" style={{ backgroundColor: '#10B981' }}></div>
                <span>30대</span>
              </div>
              <div className="legend-item">
                <div className="legend-color" style={{ backgroundColor: '#F59E0B' }}></div>
                <span>40대</span>
              </div>
              <div className="legend-item">
                <div className="legend-color" style={{ backgroundColor: '#8B5CF6' }}></div>
                <span>50대</span>
              </div>
              <div className="legend-item">
                <div className="legend-color" style={{ backgroundColor: '#EF4444' }}></div>
                <span>60대+</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DemographicAnalyticsDashboard;
