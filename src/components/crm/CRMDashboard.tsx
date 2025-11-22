import React, { useState } from 'react';
import { 
  Users, 
  BarChart3, 
  Heart, 
  Share2, 
  Headphones, 
  Store, 
  TrendingUp,
  Target,
  Settings,
  RefreshCw,
  ArrowUpRight,
  ArrowDownRight,
  Activity,
  Zap,
  Eye,
  Clock,
  Package,
  Brain,
  Briefcase
} from 'lucide-react';
import ProductAnalysisDashboard from './ProductAnalysisDashboard';
import CustomerIntegrationDashboard from './CustomerIntegrationDashboard';
import CampaignAnalyticsDashboard from './CampaignAnalyticsDashboard';
import CustomerLoyaltyDashboard from './CustomerLoyaltyDashboard';
import ReferralAnalyticsDashboard from './ReferralAnalyticsDashboard';
import AgentCallAnalyticsDashboard from './AgentCallAnalyticsDashboard';
import DemographicAnalyticsDashboard from './DemographicAnalyticsDashboard';
import ChannelAnalyticsDashboard from './ChannelAnalyticsDashboard';
import AdvancedGrowthAnalyticsDashboard from './AdvancedGrowthAnalyticsDashboard';
import ProfessionalAnalyticsDashboard from './ProfessionalAnalyticsDashboard';
import MISDashboard from './MISDashboard';
import './CRMDashboard.css';

interface DashboardTab {
  id: string;
  name: string;
  icon: React.ReactNode;
  component: React.ComponentType;
  description: string;
  color: string;
}

const CRMDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [refreshKey, setRefreshKey] = useState(0);
  const [lastUpdateTime, setLastUpdateTime] = useState(new Date());

  console.log('CRMDashboard 컴포넌트가 렌더링되었습니다.');

  const dashboardTabs: DashboardTab[] = [
    {
      id: 'overview',
      name: '전체 개요',
      icon: <BarChart3 className="w-5 h-5" />,
      component: () => <DashboardOverview formatUpdateTime={formatUpdateTime} lastUpdateTime={lastUpdateTime} />,
      description: 'CRM 전체 현황 및 핵심 지표',
      color: '#3B82F6'
    },
    {
      id: 'customer-integration',
      name: '고객 통합',
      icon: <Users className="w-5 h-5" />,
      component: CustomerIntegrationDashboard,
      description: '채널별 고객 유입 및 통합 현황',
      color: '#10B981'
    },
    {
      id: 'campaign-analytics',
      name: '캠페인 분석',
      icon: <Target className="w-5 h-5" />,
      component: CampaignAnalyticsDashboard,
      description: '마케팅 캠페인 성과 및 KPI 분석',
      color: '#8B5CF6'
    },
    {
      id: 'customer-loyalty',
      name: '고객 충성도',
      icon: <Heart className="w-5 h-5" />,
      component: CustomerLoyaltyDashboard,
      description: '충성도 프로그램 성과 및 고객 등급 분석',
      color: '#EF4444'
    },
    {
      id: 'referral-analytics',
      name: '소개인 분석',
      icon: <Share2 className="w-5 h-5" />,
      component: ReferralAnalyticsDashboard,
      description: '소개인/소개받은고객 매출 분석 및 KPI',
      color: '#F59E0B'
    },
    {
      id: 'agent-call-analytics',
      name: '상담원 콜 분석',
      icon: <Headphones className="w-5 h-5" />,
      component: AgentCallAnalyticsDashboard,
      description: '상담원 콜 빈도와 매출 연결 KPI 분석',
      color: '#06B6D4'
    },
    {
      id: 'demographic-analytics',
      name: '인구통계 분석',
      icon: <Users className="w-5 h-5" />,
      component: DemographicAnalyticsDashboard,
      description: '계절별, 연령별, 성별 매출 분석',
      color: '#8B5CF6'
    },
    {
      id: 'channel-analytics',
      name: '채널별 분석',
      icon: <Store className="w-5 h-5" />,
      component: ChannelAnalyticsDashboard,
      description: '직영점, 대리점, 쇼핑몰 등 채널별 매출 분석',
      color: '#10B981'
    },
    {
      id: 'product-analysis',
      name: '상품 분석',
      icon: <Package className="w-5 h-5" />,
      component: ProductAnalysisDashboard,
      description: '상품별 매출 및 성과 분석',
      color: '#F97316'
    },
    {
      id: 'advanced-growth-analytics',
      name: '고급 성장 분석',
      icon: <TrendingUp className="w-5 h-5" />,
      component: AdvancedGrowthAnalyticsDashboard,
      description: '고급 성장 지표 및 예측 분석',
      color: '#EC4899'
    },
    {
      id: 'professional-analytics',
      name: '전문가 분석',
      icon: <Briefcase className="w-5 h-5" />,
      component: ProfessionalAnalyticsDashboard,
      description: '전문가 수준의 심화 분석 및 인사이트',
      color: '#6366F1'
    },
    {
      id: 'mis-dashboard',
      name: 'MIS 대시보드',
      icon: <Brain className="w-5 h-5" />,
      component: MISDashboard,
      description: '경영정보시스템 및 행동지표 분석',
      color: '#8B5CF6'
    }
  ];

  const handleRefresh = () => {
    setRefreshKey(prev => prev + 1);
    setLastUpdateTime(new Date());
  };

  const formatUpdateTime = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    
    if (minutes < 1) return '방금 전';
    if (minutes < 60) return `${minutes}분 전`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}시간 전`;
    return date.toLocaleDateString('ko-KR');
  };

  const activeDashboard = dashboardTabs.find(tab => tab.id === activeTab);

  return (
    <div className="crm-dashboard">
      <div className="crm-dashboard-header">
        <div className="crm-dashboard-header-content">
          <div className="crm-dashboard-header-title">
            <div className="crm-dashboard-title-icon">
              <BarChart3 className="w-8 h-8" />
            </div>
            <div className="crm-dashboard-title-content">
              <h1>CRM 통합 대시보드</h1>
              {/* <span className="crm-dashboard-title-badge">v2.0</span> */}
            </div>
          </div>
          <div className="crm-dashboard-header-actions">
            <button className="crm-dashboard-refresh-btn" onClick={handleRefresh}>
              <RefreshCw className="w-4 h-4" />
              새로고침
            </button>
            <button className="crm-dashboard-settings-btn">
              <Settings className="w-4 h-4" />
              설정
            </button>
          </div>
        </div>
      </div>

      <div className="crm-dashboard-content">
        <div className="crm-dashboard-sidebar">
          <div className="crm-dashboard-sidebar-header">
            <h3>대시보드 메뉴</h3>
          </div>
          <div className="crm-dashboard-sidebar-tabs">
            {dashboardTabs.map((tab) => (
              <button
                key={tab.id}
                className={`crm-dashboard-sidebar-tab ${activeTab === tab.id ? 'active' : ''}`}
                onClick={() => setActiveTab(tab.id)}
                style={{ '--tab-color': tab.color } as React.CSSProperties}
              >
                <div className="crm-dashboard-tab-icon">{tab.icon}</div>
                <div className="crm-dashboard-tab-content">
                  <span className="crm-dashboard-tab-name">{tab.name}</span>
                  <span className="crm-dashboard-tab-description">{tab.description}</span>
                </div>
              </button>
            ))}
          </div>
        </div>

        <div className="crm-dashboard-main">
          <div className="crm-dashboard-main-content" key={refreshKey}>
            <div className="crm-dashboard-content-card">
              {activeDashboard && (
                <activeDashboard.component />
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// 전체 개요 컴포넌트
const DashboardOverview: React.FC<{ formatUpdateTime: (date: Date) => string; lastUpdateTime: Date }> = ({ formatUpdateTime, lastUpdateTime }) => {
  const overviewMetrics = [
    {
      title: '총 고객 수',
      value: '127,540',
      change: '+12.5%',
      trend: 'up',
      icon: <Users className="w-6 h-6" />,
      color: '#3B82F6',
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-200',
      subtitle: '활성 고객',
      additionalInfo: '신규 가입: 1,240명',
      progress: 85,
      titleColor: '#3B82F6',
      titleGradient: 'linear-gradient(135deg, #3B82F6 0%, #1D4ED8 100%)'
    },
    {
      title: '총 매출',
      value: '₩45.2B',
      change: '+22.8%',
      trend: 'up',
      icon: <BarChart3 className="w-6 h-6" />,
      color: '#10B981',
      bgColor: 'bg-green-50',
      borderColor: 'border-green-200',
      subtitle: '이번 달',
      additionalInfo: '목표 대비 108%',
      progress: 92,
      titleColor: '#10B981',
      titleGradient: 'linear-gradient(135deg, #10B981 0%, #059669 100%)'
    },
    {
      title: '활성 캠페인',
      value: '24',
      change: '+4개',
      trend: 'up',
      icon: <Target className="w-6 h-6" />,
      color: '#8B5CF6',
      bgColor: 'bg-purple-50',
      borderColor: 'border-purple-200',
      subtitle: '진행 중',
      additionalInfo: '완료: 18개',
      progress: 75,
      titleColor: '#8B5CF6',
      titleGradient: 'linear-gradient(135deg, #8B5CF6 0%, #7C3AED 100%)'
    },
    {
      title: '상담원 수',
      value: '18/24',
      change: '75%',
      trend: 'stable',
      icon: <Headphones className="w-6 h-6" />,
      color: '#F59E0B',
      bgColor: 'bg-amber-50',
      borderColor: 'border-amber-200',
      subtitle: '근무 중',
      additionalInfo: '평균 응답시간: 2.3분',
      progress: 75,
      titleColor: '#F59E0B',
      titleGradient: 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)'
    },
    {
      title: '채널 수',
      value: '6',
      change: '+1개',
      trend: 'up',
      icon: <Store className="w-6 h-6" />,
      color: '#EF4444',
      bgColor: 'bg-red-50',
      borderColor: 'border-red-200',
      subtitle: '운영 중',
      additionalInfo: '신규: 온라인 스토어',
      progress: 100,
      titleColor: '#EF4444',
      titleGradient: 'linear-gradient(135deg, #EF4444 0%, #DC2626 100%)'
    },
    {
      title: '소개인 수',
      value: '2,840',
      change: '+24.8%',
      trend: 'up',
      icon: <Share2 className="w-6 h-6" />,
      color: '#06B6D4',
      bgColor: 'bg-cyan-50',
      borderColor: 'border-cyan-200',
      subtitle: '활성 소개인',
      additionalInfo: '이번 달 신규: 680명',
      progress: 88,
      titleColor: '#06B6D4',
      titleGradient: 'linear-gradient(135deg, #06B6D4 0%, #0891B2 100%)'
    }
  ];

  const recentActivities = [
    { 
      type: 'campaign', 
      message: '신상품 출시 이메일 캠페인이 시작되었습니다.', 
      time: '2시간 전', 
      color: '#8B5CF6',
      icon: <Target className="w-4 h-4" />,
      bgColor: 'bg-purple-50'
    },
    { 
      type: 'customer', 
      message: '새로운 VIP 고객이 가입했습니다.', 
      time: '4시간 전', 
      color: '#10B981',
      icon: <Users className="w-4 h-4" />,
      bgColor: 'bg-green-50'
    },
    { 
      type: 'referral', 
      message: '소개 프로그램에서 새로운 소개인이 등록되었습니다.', 
      time: '6시간 전', 
      color: '#F59E0B',
      icon: <Share2 className="w-4 h-4" />,
      bgColor: 'bg-amber-50'
    },
    { 
      type: 'channel', 
      message: '모바일 앱에서 매출이 급증했습니다.', 
      time: '8시간 전', 
      color: '#3B82F6',
      icon: <Store className="w-4 h-4" />,
      bgColor: 'bg-blue-50'
    },
    { 
      type: 'agent', 
      message: '상담원 성과 목표를 달성했습니다.', 
      time: '10시간 전', 
      color: '#06B6D4',
      icon: <Headphones className="w-4 h-4" />,
      bgColor: 'bg-cyan-50'
    }
  ];

  return (
    <div className="crm-dashboard-overview">
      <div className="crm-dashboard-overview-header">
        <div className="crm-dashboard-overview-header-content">
          <div className="crm-dashboard-overview-header-title">
            <Activity className="w-8 h-8 text-blue-600" />
            <div>
              <h2>CRM 전체 개요</h2>
              <p>고객 관계 관리 및 마케팅 성과 종합 현황</p>
            </div>
          </div>
          <div className="crm-dashboard-overview-header-stats">
            <div className="crm-dashboard-overview-stat-item">
              <span className="crm-dashboard-overview-stat-label">마지막 업데이트</span>
              <span className="crm-dashboard-overview-stat-value">{formatUpdateTime(lastUpdateTime)}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="crm-dashboard-overview-metrics">
        {overviewMetrics.map((metric, index) => (
          <div key={index} className={`crm-dashboard-metric-card ${metric.bgColor} ${metric.borderColor}`}>
            <div className="crm-dashboard-metric-header">
              <div className="crm-dashboard-metric-title-section">
                <h3 
                  style={{ 
                    color: metric.titleColor,
                    borderColor: metric.titleColor + '40',
                    backgroundColor: metric.titleColor + '10'
                  }}
                >
                  {metric.title}
                </h3>
                <span 
                  className="crm-dashboard-metric-subtitle"
                  style={{ 
                    color: metric.titleColor,
                    borderColor: metric.titleColor + '40',
                    backgroundColor: metric.titleColor + '10'
                  }}
                >
                  {metric.subtitle}
                </span>
              </div>
              <div className="crm-dashboard-metric-header-right">
                <div className="crm-dashboard-metric-icon" style={{ backgroundColor: metric.color }}>
                  {metric.icon}
                </div>
                <div className={`crm-dashboard-trend-indicator ${metric.trend}`}>
                  {metric.trend === 'up' ? (
                    <ArrowUpRight className="w-4 h-4" />
                  ) : metric.trend === 'down' ? (
                    <ArrowDownRight className="w-4 h-4" />
                  ) : (
                    <Activity className="w-4 h-4" />
                  )}
                </div>
              </div>
            </div>
            <div className="crm-dashboard-metric-content">
              <div className="crm-dashboard-metric-value">{metric.value}</div>
              <div className="crm-dashboard-metric-progress-section">
                <div className="crm-dashboard-metric-progress-bar">
                  <div 
                    className="crm-dashboard-metric-progress-fill" 
                    style={{ 
                      width: `${metric.progress}%`,
                      backgroundColor: metric.color 
                    }}
                  ></div>
                </div>
                <span className="crm-dashboard-metric-progress-text">{metric.progress}%</span>
              </div>
              <div className="crm-dashboard-metric-additional-info">
                <span className="crm-dashboard-additional-text">{metric.additionalInfo}</span>
              </div>
              <div className={`crm-dashboard-metric-change ${metric.trend}`}>
                <span>{metric.change}</span>
                <span className="crm-dashboard-change-label">전월 대비</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="crm-dashboard-overview-charts">
        <div className="crm-dashboard-chart-section">
          <div className="crm-dashboard-chart-header">
            <div className="crm-dashboard-chart-title">
              <BarChart3 className="w-6 h-6 text-blue-600" />
              <h3>월별 성과 추이</h3>
            </div>
            <div className="crm-dashboard-chart-actions">
              <button className="crm-dashboard-chart-action-btn">
                <Eye className="w-3 h-3" />
                상세보기
              </button>
            </div>
          </div>
          <div className="crm-dashboard-performance-chart">
            <div className="crm-dashboard-chart-placeholder">
              <BarChart3 className="w-16 h-16 text-gray-300" />
              <p>성과 추이 차트</p>
              <span className="crm-dashboard-chart-subtitle">최근 12개월 데이터</span>
            </div>
          </div>
        </div>

        <div className="crm-dashboard-chart-section">
          <div className="crm-dashboard-chart-header">
            <div className="crm-dashboard-chart-title">
              <Zap className="w-6 h-6 text-green-600" />
              <h3>채널별 매출 분포</h3>
            </div>
            <div className="crm-dashboard-chart-actions">
              <button className="crm-dashboard-chart-action-btn">
                <Eye className="w-3 h-3" />
                상세보기
              </button>
            </div>
          </div>
          <div className="crm-dashboard-distribution-chart">
            <div className="crm-dashboard-chart-placeholder">
              <span className="text-6xl font-bold text-gray-300">₩</span>
              <p>매출 분포 차트</p>
              <span className="crm-dashboard-chart-subtitle">실시간 매출 현황</span>
            </div>
          </div>
        </div>
      </div>

      <div className="crm-dashboard-recent-activities">
        <div className="crm-dashboard-activities-header">
          <div className="crm-dashboard-activities-title">
            <Clock className="w-6 h-6 text-purple-600" />
            <h3>최근 활동</h3>
          </div>
          <div className="crm-dashboard-activities-count">
            <span className="crm-dashboard-count-badge">5개</span>
          </div>
        </div>
        <div className="crm-dashboard-activity-list">
          {recentActivities.map((activity, index) => (
            <div key={index} className={`crm-dashboard-activity-item ${activity.bgColor}`}>
              <div className="crm-dashboard-activity-icon" style={{ backgroundColor: activity.color }}>
                {activity.icon}
              </div>
              <div className="crm-dashboard-activity-content">
                <p>{activity.message}</p>
                <div className="crm-dashboard-activity-meta">
                  <Clock className="w-3 h-3" />
                  <span className="crm-dashboard-activity-time">{activity.time}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default CRMDashboard;
