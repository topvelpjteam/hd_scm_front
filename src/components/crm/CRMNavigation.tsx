import React, { useState } from 'react';
import { useDispatch } from 'react-redux';
import { AppDispatch } from '../../store/store';
import { addTab, setActiveTab } from '../../store/tabSlice';
import { 
  BarChart3, 
  TrendingUp, 
  Users, 
  Target, 
  Award, 
  Phone, 
  UserCheck, 
  Building2,
  Brain,
  PieChart,
  Activity,
  ChevronDown,
  ChevronRight,
  Home,
  ShoppingBag,
  Megaphone,
  Zap,
  ArrowRight
} from 'lucide-react';
import './CRMNavigation.css';

interface CRMMenu {
  id: string;
  title: string;
  component: string;
  description: string;
  icon: React.ReactNode;
  color: string;
  category?: string;
}

interface DashboardGroup {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  color: string;
  menus: CRMMenu[];
}

const CRMNavigation: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const [expandedGroups, setExpandedGroups] = useState<string[]>(['kpi', 'customer']);

  // 분석 종류별 대시보드 그룹 정의
  const dashboardGroups: DashboardGroup[] = [
    {
      id: 'kpi',
      title: '핵심 성과 지표 (KPI)',
      description: '비즈니스 핵심 지표와 종합 분석',
      icon: <Home className="w-6 h-6" />,
      color: '#3B82F6',
      menus: [
        {
          id: 'crm-main',
          title: 'CRM 통합 대시보드',
          component: 'CRMDashboard',
          description: '모든 CRM 기능을 통합한 메인 대시보드',
          icon: <BarChart3 className="w-5 h-5" />,
          color: '#3B82F6',
          category: 'kpi'
        },
        {
          id: 'professional-analytics',
          title: '전문가 분석 대시보드',
          component: 'ProfessionalAnalyticsDashboard',
          description: '전문가 수준의 종합 분석 및 AI 기반 예측',
          icon: <Brain className="w-5 h-5" />,
          color: '#8B5CF6',
          category: 'kpi'
        },
        {
          id: 'mis-dashboard',
          title: 'MIS 대시보드',
          component: 'MISDashboard',
          description: '핵심 행동지표 및 전략적 목표 실시간 모니터링',
          icon: <BarChart3 className="w-5 h-5" />,
          color: '#1E40AF',
          category: 'kpi'
        }
      ]
    },
    {
      id: 'customer',
      title: '고객 분석',
      description: '고객 세그먼트별 심층 분석',
      icon: <Users className="w-6 h-6" />,
      color: '#10B981',
      menus: [
        {
          id: 'customer-integration',
          title: '고객 통합 분석',
          component: 'CustomerIntegrationDashboard',
          description: '각 채널의 고객 유입 및 통합 현황',
          icon: <Users className="w-5 h-5" />,
          color: '#10B981',
          category: 'customer'
        },
        {
          id: 'customer-loyalty',
          title: '고객 충성도',
          component: 'CustomerLoyaltyDashboard',
          description: '브론즈, 실버, 골드, 플래티넘 등급별 분석',
          icon: <Award className="w-5 h-5" />,
          color: '#8B5CF6',
          category: 'customer'
        },
        {
          id: 'demographic-analytics',
          title: '인구통계 분석',
          component: 'DemographicAnalyticsDashboard',
          description: '계절별, 연령별, 성별 매출 분석',
          icon: <PieChart className="w-5 h-5" />,
          color: '#84CC16',
          category: 'customer'
        },
        {
          id: 'referral-analytics',
          title: '소개인 분석',
          component: 'ReferralAnalyticsDashboard',
          description: '소개인/소개받은고객 매출 분석',
          icon: <UserCheck className="w-5 h-5" />,
          color: '#EF4444',
          category: 'customer'
        }
      ]
    },
    {
      id: 'marketing',
      title: '마케팅 & 채널',
      description: '마케팅 캠페인과 채널 성과 분석',
      icon: <Megaphone className="w-6 h-6" />,
      color: '#F59E0B',
      menus: [
        {
          id: 'campaign-analytics',
          title: '캠페인 분석',
          component: 'CampaignAnalyticsDashboard',
          description: '이메일, SMS, 전화, 푸시 알림 캠페인 성과',
          icon: <Target className="w-5 h-5" />,
          color: '#F59E0B',
          category: 'marketing'
        },
        {
          id: 'channel-analytics',
          title: '채널별 분석',
          component: 'ChannelAnalyticsDashboard',
          description: '직영점, 대리점, 쇼핑몰 등 채널별 매출 분석',
          icon: <Building2 className="w-5 h-5" />,
          color: '#F97316',
          category: 'marketing'
        },
        {
          id: 'agent-call-analytics',
          title: '상담원 콜 분석',
          component: 'AgentCallAnalyticsDashboard',
          description: '상담원별 콜 빈도와 매출 연결 KPI',
          icon: <Phone className="w-5 h-5" />,
          color: '#06B6D4',
          category: 'marketing'
        }
      ]
    },
    {
      id: 'product',
      title: '상품 분석',
      description: '상품별 성과와 트렌드 분석',
      icon: <ShoppingBag className="w-6 h-6" />,
      color: '#EC4899',
      menus: [
        {
          id: 'product-analysis',
          title: '상품분석 대시보드',
          component: 'ProductAnalysisDashboard',
          description: '10개 품목별 매출, 성과, 트렌드 분석',
          icon: <ShoppingBag className="w-5 h-5" />,
          color: '#EC4899',
          category: 'product'
        }
      ]
    },
    {
      id: 'advanced',
      title: '분석',
      description: 'AI 기반 예측 및 심층 통계 분석',
      icon: <Zap className="w-6 h-6" />,
      color: '#6366F1',
      menus: [
        {
          id: 'professional-analytics',
          title: '예측 분석 대시보드',
          component: 'ProfessionalAnalyticsDashboard',
          description: '예측 분석 및 실시간 모니터링',
          icon: <Brain className="w-5 h-5" />,
          color: '#8B5CF6',
          category: 'advanced'
        },
        {
          id: 'advanced-growth',
          title: '성장률 분석',
          component: 'AdvancedGrowthAnalyticsDashboard',
          description: '기간별, 채널별, 지역별 매출 성장율 분석',
          icon: <TrendingUp className="w-5 h-5" />,
          color: '#EC4899',
          category: 'advanced'
        },
        {
          id: 'distribution-charts',
          title: '분포도 차트',
          component: 'AdvancedDistributionCharts',
          description: '다차원 데이터 분포 분석 및 시각화',
          icon: <Activity className="w-5 h-5" />,
          color: '#6366F1',
          category: 'advanced'
        }
      ]
    }
  ];

  // 그룹 토글 기능
  const toggleGroup = (groupId: string) => {
    setExpandedGroups(prev => 
      prev.includes(groupId) 
        ? prev.filter(id => id !== groupId)
        : [...prev, groupId]
    );
  };

  const handleMenuClick = (menu: CRMMenu) => {
    // 이미 같은 컴포넌트의 탭이 열려있는지 확인
    const existingTab = document.querySelector(`[data-component="${menu.component}"]`);
    
    if (!existingTab) {
      // 새 탭 추가 및 활성화
      dispatch(addTab({
        id: menu.id,
        title: menu.title,
        component: menu.component,
        url: `/crm/${menu.id}`,
        closable: true
      }));
      
      dispatch(setActiveTab(menu.id));
    } else {
      // 기존 탭 활성화
      dispatch(setActiveTab(menu.id));
    }
  };

  return (
    <div className="crm-navigation">
      <div className="navigation-header">
        <h1>CRM 분석 도구</h1>
        <p>다양한 CRM 분석 도구를 선택하여 비즈니스 인사이트를 얻으세요</p>
      </div>
      
      <div className="navigation-grid">
        {dashboardGroups.map((group) => (
          <div key={group.id} className="dashboard-group">
            <div className="group-header" onClick={() => toggleGroup(group.id)}>
              <div className="group-icon" style={{ backgroundColor: group.color }}>
                {group.icon}
              </div>
              <div className="group-content">
                <h2>{group.title}</h2>
                <p>{group.description}</p>
              </div>
              <div className="group-toggle">
                {expandedGroups.includes(group.id) ? 
                  <ChevronDown className="w-5 h-5" /> : 
                  <ChevronRight className="w-5 h-5" />
                }
              </div>
            </div>
            
            {expandedGroups.includes(group.id) && (
              <div className="group-menus">
                {group.menus.map((menu) => (
                  <div 
                    key={menu.id} 
                    className="navigation-card"
                    onClick={() => handleMenuClick(menu)}
                  >
                    <div className="card-icon" style={{ backgroundColor: menu.color }}>
                      {menu.icon}
                    </div>
                    <div className="card-content">
                      <h3>{menu.title}</h3>
                      <p>{menu.description}</p>
                    </div>
                    <div className="card-arrow">
                      <ArrowRight className="w-4 h-4" />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
      
      <div className="navigation-footer">
        <div className="footer-info">
          <h3>📊 총 11개의 전문 분석 도구</h3>
          <p>기본 CRM 기능부터 AI 기반 예측 분석까지 모든 도구가 준비되어 있습니다.</p>
        </div>
      </div>
    </div>
  );
};

export default CRMNavigation;
