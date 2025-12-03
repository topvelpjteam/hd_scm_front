import React from 'react';
import { 
  Package, 
  TrendingUp, 
  TrendingDown, 
  Star, 
  ShoppingCart, 
  BarChart3,
  Zap,
  Droplets,
  Utensils,
  Pill,
  Circle,
  ShoppingBag,
  Plus,
  Edit,
  AlertTriangle,
  Minus,
  ArrowUpRight,
  ArrowDownRight,
  Activity
} from 'lucide-react';
import './ProductAnalysisDashboard.css';

interface ProductSummary {
  id: string;
  name: string;
  category: string;
  revenue: number;
  orders: number;
  growthRate: number;
  color: string;
  icon: React.ReactNode;
}

interface CampaignResponse {
  productName: string;
  category: string;
  campaignType: string;
  responseRate: number;
  conversionRate: number;
  revenue: number;
  orders: number;
  color: string;
  icon: React.ReactNode;
  trend: 'up' | 'down' | 'stable';
}

interface ProductAward {
  productName: string;
  category: string;
  awardType: string;
  awardTitle: string;
  revenue: number;
  growthRate: number;
  color: string;
  icon: React.ReactNode;
  badge: string;
  description: string;
}

const ProductAnalysisDashboard: React.FC = () => {
  // 핵심 상품 요약 데이터
  const productSummaries: ProductSummary[] = [
    {
      id: 'insan-jukyeom',
      name: '인산죽염',
      category: '핵심상품',
      revenue: 32000000000,
      orders: 15800,
      growthRate: 12.5,
      color: '#3B82F6',
      icon: <Droplets className="w-5 h-5" />
    },
    {
      id: 'jukyeom-jangryu',
      name: '죽염장류',
      category: '전통식품',
      revenue: 14200000000,
      orders: 8900,
      growthRate: 8.4,
      color: '#10B981',
      icon: <Utensils className="w-5 h-5" />
    },
    {
      id: 'jinaek-go',
      name: '진액/고',
      category: '건강식품',
      revenue: 11200000000,
      orders: 6700,
      growthRate: 16.7,
      color: '#F59E0B',
      icon: <Pill className="w-5 h-5" />
    },
    {
      id: 'hwan-bunmal',
      name: '환/분말',
      category: '건강식품',
      revenue: 9200000000,
      orders: 5200,
      growthRate: 17.9,
      color: '#8B5CF6',
      icon: <Circle className="w-5 h-5" />
    },
    {
      id: 'gita-sikpum',
      name: '기타식품',
      category: '기타상품',
      revenue: 7800000000,
      orders: 4200,
      growthRate: 6.8,
      color: '#EF4444',
      icon: <ShoppingBag className="w-5 h-5" />
    },
    {
      id: 'saenghwal-yongpum',
      name: '생활용품',
      category: '생활용품',
      revenue: 6200000000,
      orders: 3800,
      growthRate: 8.8,
      color: '#06B6D4',
      icon: <ShoppingCart className="w-5 h-5" />
    }
  ];

  // 캠페인 호응도 데이터
  const campaignResponses: CampaignResponse[] = [
    {
      productName: '인산죽염',
      category: '핵심상품',
      campaignType: '신제품 런칭',
      responseRate: 85.2,
      conversionRate: 12.8,
      revenue: 4500000000,
      orders: 2800,
      color: '#3B82F6',
      icon: <Droplets className="w-5 h-5" />,
      trend: 'up'
    },
    {
      productName: '죽염장류',
      category: '전통식품',
      campaignType: '할인 프로모션',
      responseRate: 72.4,
      conversionRate: 8.9,
      revenue: 2100000000,
      orders: 1200,
      color: '#10B981',
      icon: <Utensils className="w-5 h-5" />,
      trend: 'up'
    },
    {
      productName: '진액/고',
      category: '건강식품',
      campaignType: '건강 캠페인',
      responseRate: 91.7,
      conversionRate: 15.3,
      revenue: 3200000000,
      orders: 1900,
      color: '#F59E0B',
      icon: <Pill className="w-5 h-5" />,
      trend: 'up'
    },
    {
      productName: '환/분말',
      category: '건강식품',
      campaignType: '시즌 프로모션',
      responseRate: 68.9,
      conversionRate: 9.7,
      revenue: 1800000000,
      orders: 1100,
      color: '#8B5CF6',
      icon: <Circle className="w-5 h-5" />,
      trend: 'stable'
    },
    {
      productName: '기타식품',
      category: '기타상품',
      campaignType: '번들 오퍼',
      responseRate: 45.3,
      conversionRate: 6.2,
      revenue: 950000000,
      orders: 580,
      color: '#EF4444',
      icon: <ShoppingBag className="w-5 h-5" />,
      trend: 'down'
    },
    {
      productName: '생활용품',
      category: '생활용품',
      campaignType: '리뉴얼 캠페인',
      responseRate: 78.6,
      conversionRate: 11.4,
      revenue: 1400000000,
      orders: 850,
      color: '#06B6D4',
      icon: <ShoppingCart className="w-5 h-5" />,
      trend: 'up'
    }
  ];

  // 전체 통계
  const totalRevenue = productSummaries.reduce((sum, product) => sum + product.revenue, 0);
  const totalOrders = productSummaries.reduce((sum, product) => sum + product.orders, 0);
  const averageGrowthRate = productSummaries.reduce((sum, product) => sum + product.growthRate, 0) / productSummaries.length;
  
  // 캠페인 통계
  const totalCampaignRevenue = campaignResponses.reduce((sum, campaign) => sum + campaign.revenue, 0);
  const averageResponseRate = campaignResponses.reduce((sum, campaign) => sum + campaign.responseRate, 0) / campaignResponses.length;
  const averageConversionRate = campaignResponses.reduce((sum, campaign) => sum + campaign.conversionRate, 0) / campaignResponses.length;

  // 상품별 매출 어워드 데이터
  const productAwards: ProductAward[] = [
    {
      productName: '인산죽염',
      category: '핵심상품',
      awardType: 'gold',
      awardTitle: '🏆 매출 1위',
      revenue: 32000000000,
      growthRate: 12.5,
      color: '#FFD700',
      icon: <Droplets className="w-6 h-6" />,
      badge: 'GOLD',
      description: '전체 매출의 35%를 차지하는 핵심 상품'
    },
    {
      productName: '진액/고',
      category: '건강식품',
      awardType: 'silver',
      awardTitle: '🥈 성장률 1위',
      revenue: 11200000000,
      growthRate: 16.7,
      color: '#C0C0C0',
      icon: <Pill className="w-6 h-6" />,
      badge: 'SILVER',
      description: '전년 대비 16.7% 성장한 건강식품'
    },
    {
      productName: '환/분말',
      category: '건강식품',
      awardType: 'bronze',
      awardTitle: '🥉 신상품 어워드',
      revenue: 9200000000,
      growthRate: 17.9,
      color: '#CD7F32',
      icon: <Circle className="w-6 h-6" />,
      badge: 'BRONZE',
      description: '신규 출시 상품 중 최고 성과'
    },
    {
      productName: '죽염장류',
      category: '전통식품',
      awardType: 'special',
      awardTitle: '⭐ 전통 브랜드 어워드',
      revenue: 14200000000,
      growthRate: 8.4,
      color: '#8B5CF6',
      icon: <Utensils className="w-6 h-6" />,
      badge: 'SPECIAL',
      description: '전통 식품 카테고리 리더'
    },
    {
      productName: '생활용품',
      category: '생활용품',
      awardType: 'rising',
      awardTitle: '🚀 신흥 강자',
      revenue: 6200000000,
      growthRate: 8.8,
      color: '#06B6D4',
      icon: <ShoppingCart className="w-6 h-6" />,
      badge: 'RISING',
      description: '지속적인 성장세를 보이는 상품'
    },
    {
      productName: '기타식품',
      category: '기타상품',
      awardType: 'potential',
      awardTitle: '💎 잠재력 상품',
      revenue: 7800000000,
      growthRate: 6.8,
      color: '#EF4444',
      icon: <ShoppingBag className="w-6 h-6" />,
      badge: 'POTENTIAL',
      description: '향후 성장 가능성이 높은 상품'
    }
  ];

  // 유틸리티 함수들
  const formatNumber = (num: number): string => {
    if (num >= 100000000) {
      return (num / 100000000).toFixed(1) + '억';
    } else if (num >= 10000) {
      return (num / 10000).toFixed(1) + '만';
    }
    return num.toLocaleString();
  };

  const formatCurrency = (num: number): string => {
    if (num >= 100000000) {
      return '₩' + (num / 100000000).toFixed(1) + '억';
    } else if (num >= 10000) {
      return '₩' + (num / 10000).toFixed(1) + '만';
    }
    return '₩' + num.toLocaleString();
  };

  const getGrowthIcon = (rate: number) => {
    return rate >= 0 ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />;
  };

  const getGrowthColor = (rate: number) => {
    return rate >= 0 ? '#059669' : '#dc2626';
  };

  return (
    <div className="product-dashboard">
      {/* 대시보드 헤더 */}
      <div className="dashboard-header">
        <h1>상품분석 대시보드</h1>
        <p>핵심 상품 성과 요약</p>
      </div>

      {/* 핵심 지표 카드들 */}
      <div className="metrics-grid">
        <div className="metric-card primary">
          <div className="metric-icon">
            <span className="text-2xl font-bold text-blue-600">₩</span>
          </div>
          <div className="metric-content">
            <h3>총 매출</h3>
            <p className="metric-value">{formatCurrency(totalRevenue)}</p>
            <div className="metric-trend">
              <TrendingUp className="w-4 h-4" />
              <span>+12.5%</span>
            </div>
          </div>
        </div>

        <div className="metric-card secondary">
          <div className="metric-icon">
            <BarChart3 className="w-8 h-8" />
          </div>
          <div className="metric-content">
            <h3>총 주문수</h3>
            <p className="metric-value">{formatNumber(totalOrders)}</p>
            <div className="metric-trend">
              <TrendingUp className="w-4 h-4" />
              <span>+8.3%</span>
            </div>
          </div>
        </div>

        <div className="metric-card success">
          <div className="metric-icon">
            <TrendingUp className="w-8 h-8" />
          </div>
          <div className="metric-content">
            <h3>평균 성장률</h3>
            <p className="metric-value">{averageGrowthRate.toFixed(1)}%</p>
            <div className="metric-trend">
              <TrendingUp className="w-4 h-4" />
              <span>+2.1%</span>
            </div>
          </div>
        </div>

        <div className="metric-card warning">
          <div className="metric-icon">
            <Star className="w-8 h-8" />
          </div>
          <div className="metric-content">
            <h3>고객 만족도</h3>
            <p className="metric-value">4.6/5</p>
            <div className="metric-trend">
              <TrendingUp className="w-4 h-4" />
              <span>+0.2</span>
            </div>
          </div>
        </div>
      </div>

      {/* 관련 자료 섹션 */}
      <div className="related-info-section">
        {/* 인기 상품 순위 */}
        <div className="info-card trending-products">
          <div className="card-header">
            <TrendingUp className="w-5 h-5 text-green-600" />
            <h3>인기 상품 순위</h3>
          </div>
          <div className="trending-list">
            {productSummaries.slice(0, 5).map((product, index) => (
              <div key={product.id} className="trending-item">
                <span className="rank">#{index + 1}</span>
                <div className="product-info">
                  <span className="product-name">{product.name}</span>
                  <span className="product-revenue">{formatCurrency(product.revenue)}</span>
                </div>
                <div className="growth-badge" style={{ color: getGrowthColor(product.growthRate) }}>
                  {getGrowthIcon(product.growthRate)}
                  <span>{product.growthRate}%</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 재고 상태 */}
        <div className="info-card inventory-status">
          <div className="card-header">
            <Package className="w-5 h-5 text-blue-600" />
            <h3>재고 상태</h3>
          </div>
          <div className="inventory-list">
            {productSummaries.slice(0, 4).map((product) => {
              const stockLevel = Math.floor(Math.random() * 100) + 1;
              const stockStatus = stockLevel > 70 ? 'high' : stockLevel > 30 ? 'medium' : 'low';
              return (
                <div key={product.id} className="inventory-item">
                  <div className="product-info">
                    <span className="product-name">{product.name}</span>
                    <span className="stock-level">{stockLevel}%</span>
                  </div>
                  <div className={`stock-indicator ${stockStatus}`}>
                    <div className="stock-bar" style={{ width: `${stockLevel}%` }}></div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* 이번 주 트렌드 */}
        <div className="info-card weekly-trends">
          <div className="card-header">
            <Activity className="w-5 h-5 text-purple-600" />
            <h3>이번 주 트렌드</h3>
          </div>
          <div className="trends-list">
            <div className="trend-item positive">
              <TrendingUp className="w-4 h-4" />
              <span>인산죽염 매출 +18% 급증</span>
            </div>
            <div className="trend-item positive">
              <TrendingUp className="w-4 h-4" />
              <span>죽염장류 주문량 +25% 증가</span>
            </div>
            <div className="trend-item negative">
              <TrendingDown className="w-4 h-4" />
              <span>진액/고 수요 -8% 감소</span>
            </div>
            <div className="trend-item stable">
              <Minus className="w-4 h-4" />
              <span>환/분말 판매 안정</span>
            </div>
            <div className="trend-item positive">
              <TrendingUp className="w-4 h-4" />
              <span>생활용품 신규 고객 유입</span>
            </div>
          </div>
        </div>

        {/* 빠른 액션 */}
        <div className="info-card quick-actions">
          <div className="card-header">
            <Zap className="w-5 h-5 text-orange-600" />
            <h3>빠른 액션</h3>
          </div>
          <div className="actions-distribution">
            <button className="action-btn primary center">
              <Plus className="w-6 h-6" />
              <span>새 상품 추가</span>
            </button>
            <button className="action-btn success top">
              <TrendingUp className="w-5 h-5" />
              <span>프로모션 시작</span>
            </button>
            <button className="action-btn warning right">
              <AlertTriangle className="w-4 h-4" />
              <span>재고 알림</span>
            </button>
            <button className="action-btn secondary bottom">
              <Edit className="w-4 h-4" />
              <span>가격 조정</span>
            </button>
            <button className="action-btn info left">
              <Package className="w-4 h-4" />
              <span>재고 관리</span>
            </button>
          </div>
        </div>
      </div>

      {/* 상품별 성과 요약 */}
      <div className="products-section">
        <h2>상품별 성과 요약</h2>
        <div className="products-grid">
          {productSummaries.map((product) => (
            <div key={product.id} className="product-card">
              <div className="product-header">
                <div className="product-icon" style={{ backgroundColor: product.color }}>
                  {product.icon}
                </div>
                <div className="product-info">
                  <h3>{product.name}</h3>
                  <span className="category">{product.category}</span>
                </div>
                <div className="growth-indicator" style={{ color: getGrowthColor(product.growthRate) }}>
                  {getGrowthIcon(product.growthRate)}
                  <span>{product.growthRate}%</span>
                </div>
              </div>
              
              <div className="product-metrics">
                <div className="metric-row">
                  <span className="label">매출</span>
                  <span className="value">{formatCurrency(product.revenue)}</span>
                </div>
                <div className="metric-row">
                  <span className="label">주문수</span>
                  <span className="value">{formatNumber(product.orders)}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 캠페인 호응도 분석 */}
      <div className="campaign-section">
        <div className="campaign-header">
          <h2>캠페인 호응도 분석</h2>
          <div className="campaign-stats">
            <div className="stat-item">
              <span className="stat-label">총 캠페인 매출</span>
              <span className="stat-value">{formatCurrency(totalCampaignRevenue)}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">평균 응답률</span>
              <span className="stat-value">{averageResponseRate.toFixed(1)}%</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">평균 전환율</span>
              <span className="stat-value">{averageConversionRate.toFixed(1)}%</span>
            </div>
          </div>
        </div>
        
        <div className="campaign-grid">
          {campaignResponses.map((campaign, index) => (
            <div key={index} className="campaign-card">
              <div className="campaign-card-header">
                <div className="product-info">
                  <div className="product-icon" style={{ backgroundColor: campaign.color }}>
                    {campaign.icon}
                  </div>
                  <div className="product-details">
                    <h3>{campaign.productName}</h3>
                    <span className="campaign-type">{campaign.campaignType}</span>
                  </div>
                </div>
                <div className={`trend-indicator ${campaign.trend}`}>
                  {campaign.trend === 'up' && <TrendingUp className="w-4 h-4" />}
                  {campaign.trend === 'down' && <TrendingDown className="w-4 h-4" />}
                  {campaign.trend === 'stable' && <BarChart3 className="w-4 h-4" />}
                </div>
              </div>
              
              <div className="campaign-metrics">
                <div className="metric-row">
                  <span className="label">응답률</span>
                  <span className="value response-rate">{campaign.responseRate}%</span>
                </div>
                <div className="metric-row">
                  <span className="label">전환율</span>
                  <span className="value conversion-rate">{campaign.conversionRate}%</span>
                </div>
                <div className="metric-row">
                  <span className="label">매출</span>
                  <span className="value revenue">{formatCurrency(campaign.revenue)}</span>
                </div>
                <div className="metric-row">
                  <span className="label">주문수</span>
                  <span className="value orders">{formatNumber(campaign.orders)}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 상품별 매출 어워드 */}
      <div className="awards-section">
        <div className="awards-header">
          <h2>🏆 상품별 매출 어워드</h2>
          <p>2024년 상반기 성과 기반 어워드</p>
        </div>
        <div className="awards-grid">
          {productAwards.map((award, index) => (
            <div key={index} className={`award-card ${award.awardType}`}>
              <div className="award-badge">
                <span className="badge-text">{award.badge}</span>
              </div>
              <div className="award-content">
                <div className="award-header">
                  <div className="product-icon" style={{ backgroundColor: award.color }}>
                    {award.icon}
                  </div>
                  <div className="award-info">
                    <h3 className="award-title">{award.awardTitle}</h3>
                    <span className="product-name">{award.productName}</span>
                    <span className="category-tag">{award.category}</span>
                  </div>
                </div>
                <div className="award-metrics">
                  <div className="metric-row">
                    <span className="label">매출</span>
                    <span className="value">{formatCurrency(award.revenue)}</span>
                  </div>
                  <div className="metric-row">
                    <span className="label">성장률</span>
                    <span className="value growth">{award.growthRate}%</span>
                  </div>
                </div>
                <div className="award-description">
                  <p>{award.description}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 카테고리별 성과 */}
      <div className="category-section">
        <h2>카테고리별 성과</h2>
        <div className="category-chart">
          <div className="category-item">
            <div className="category-header">
              <div className="category-icon" style={{ backgroundColor: '#3B82F6' }}>
                <Droplets className="w-5 h-5" />
              </div>
              <span className="category-name">핵심상품</span>
              <span className="category-percentage">35.2%</span>
            </div>
            <div className="category-bar">
              <div className="bar-fill" style={{ width: '35.2%', backgroundColor: '#3B82F6' }}></div>
            </div>
          </div>
          
          <div className="category-item">
            <div className="category-header">
              <div className="category-icon" style={{ backgroundColor: '#10B981' }}>
                <Utensils className="w-5 h-5" />
              </div>
              <span className="category-name">전통식품</span>
              <span className="category-percentage">15.6%</span>
            </div>
            <div className="category-bar">
              <div className="bar-fill" style={{ width: '15.6%', backgroundColor: '#10B981' }}></div>
            </div>
          </div>
          
          <div className="category-item">
            <div className="category-header">
              <div className="category-icon" style={{ backgroundColor: '#F59E0B' }}>
                <Pill className="w-5 h-5" />
              </div>
              <span className="category-name">건강식품</span>
              <span className="category-percentage">22.4%</span>
            </div>
            <div className="category-bar">
              <div className="bar-fill" style={{ width: '22.4%', backgroundColor: '#F59E0B' }}></div>
            </div>
          </div>
          
          <div className="category-item">
            <div className="category-header">
              <div className="category-icon" style={{ backgroundColor: '#8B5CF6' }}>
                <Circle className="w-5 h-5" />
              </div>
              <span className="category-name">기타상품</span>
              <span className="category-percentage">26.8%</span>
            </div>
            <div className="category-bar">
              <div className="bar-fill" style={{ width: '26.8%', backgroundColor: '#8B5CF6' }}></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductAnalysisDashboard;