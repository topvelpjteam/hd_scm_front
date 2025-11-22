import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '../store/store';
import { setActiveTab, toggleGroup, setExpandedGroups } from '../store/tabSlice';
import { useBrowserHistory } from '../hooks/useBrowserHistory';
import { getMenuIcon } from '../utils/menuUtils';
import { 
  Package, 
  TrendingUp,
  Users,
  BarChart3,
  Calendar,
  Activity,
  Brain,
  PieChart,
  Target,
  Award,
  UserCheck,
  Phone,
  Building2,
  Eye,
  ChevronDown,
  ChevronRight,
  Home,
  ShoppingBag,
  Megaphone,
  Zap,
  Maximize2,
  Minimize2
} from 'lucide-react';
import './Dashboard.css';

const Dashboard: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const tabs = useSelector((state: RootState) => state.tabs.tabs);
  const expandedGroups = useSelector((state: RootState) => state.tabs.expandedGroups);
  const { addTabWithHistory } = useBrowserHistory();
  
  // 현재 활성 탭 정보 가져오기
  const { activeTabId } = useSelector((state: RootState) => state.tabs);
  const currentTab = tabs.find(tab => tab.id === activeTabId);

  // 분석 종류별 CRM 도구 그룹 정의
  const crmToolGroups = [
    {
      id: 'customer',
      title: '고객 분석',
      description: '고객 세그먼트별 심층 분석',
      icon: <Users className="w-5 h-5" />,
      color: '#10B981',
      tools: [
        {
          id: 'customer-integration',
          title: '고객 통합 분석',
          description: '각 채널의 고객 유입 및 통합 현황',
          icon: <Users className="w-4 h-4" />,
          color: '#10B981',
          component: 'CustomerIntegrationDashboard'
        },
        {
          id: 'customer-loyalty',
          title: '고객 충성도',
          description: '브론즈, 실버, 골드, 플래티넘 등급별 분석',
          icon: <Award className="w-4 h-4" />,
          color: '#8B5CF6',
          component: 'CustomerLoyaltyDashboard'
        },
        {
          id: 'demographic-analytics',
          title: '계절/연령/성별통계 분석',
          description: '계절별, 연령별, 성별 매출 분석',
          icon: <PieChart className="w-4 h-4" />,
          color: '#84CC16',
          component: 'DemographicAnalyticsDashboard'
        },
        {
          id: 'referral-analytics',
          title: '소개인 분석',
          description: '소개인/소개받은고객 매출 분석',
          icon: <UserCheck className="w-4 h-4" />,
          color: '#EF4444',
          component: 'ReferralAnalyticsDashboard'
        }
      ]
    },
    {
      id: 'marketing',
      title: '마케팅 & 채널',
      description: '마케팅 캠페인과 채널 성과 분석',
      icon: <Megaphone className="w-5 h-5" />,
      color: '#F59E0B',
      tools: [
        {
          id: 'campaign-analytics',
          title: '캠페인 분석',
          description: '이메일, SMS, 전화, 푸시 알림 캠페인 성과',
          icon: <Target className="w-4 h-4" />,
          color: '#F59E0B',
          component: 'CampaignAnalyticsDashboard'
        },
        {
          id: 'channel-analytics',
          title: '채널별 분석',
          description: '직영점, 대리점, 쇼핑몰 등 채널별 매출 분석',
          icon: <Building2 className="w-4 h-4" />,
          color: '#F97316',
          component: 'ChannelAnalyticsDashboard'
        },
        {
          id: 'agent-call-analytics',
          title: '상담원 콜 분석',
          description: '상담원별 콜 빈도와 매출 연결 KPI',
          icon: <Phone className="w-4 h-4" />,
          color: '#06B6D4',
          component: 'AgentCallAnalyticsDashboard'
        }
      ]
    },
    {
      id: 'product',
      title: '상품 분석',
      description: '상품별 성과와 트렌드 분석',
      icon: <ShoppingBag className="w-5 h-5" />,
      color: '#EC4899',
      tools: [
        {
          id: 'product-analysis',
          title: '상품분석 대시보드',
          description: '10개 품목별 매출, 성과, 트렌드 분석',
          icon: <Package className="w-4 h-4" />,
          color: '#3B82F6',
          component: 'ProductAnalysisDashboard'
        }
      ]
    },
    {
      id: 'advanced',
      title: '분석',
      description: '예측 및 심층 통계 분석',
      icon: <Zap className="w-5 h-5" />,
      color: '#6366F1',
      tools: [
        {
          id: 'advanced-growth',
          title: '성장률 분석',
          description: '기간별, 채널별, 지역별 매출 성장율 분석',
          icon: <TrendingUp className="w-4 h-4" />,
          color: '#EC4899',
          component: 'AdvancedGrowthAnalyticsDashboard'
        },
        {
          id: 'distribution-charts',
          title: '분포도 차트',
          description: '다차원 데이터 분포 분석 및 시각화',
          icon: <PieChart className="w-4 h-4" />,
          color: '#6366F1',
          component: 'AdvancedDistributionCharts'
        }
      ]
    },
    {
      id: 'kpi',
      title: '핵심 성과 지표 (KPI)',
      description: '비즈니스 핵심 지표와 종합 분석',
      icon: <Home className="w-5 h-5" />,
      color: '#3B82F6',
      tools: [

        {
          id: 'professional-analytics',
          title: '예측 분석 대시보드',
          description: '예측 분석 및 실시간 모니터링',
          icon: <Brain className="w-4 h-4" />,
          color: '#8B5CF6',
          component: 'ProfessionalAnalyticsDashboard'
        },
        {
          id: 'mis-dashboard',
          title: 'MIS 대시보드',
          description: '핵심 행동지표 및 전략적 목표 실시간 모니터링',
          icon: <BarChart3 className="w-4 h-4" />,
          color: '#1E40AF',
          component: 'MISDashboard'
        },
        {
          id: 'crm-main',
          title: 'CRM 통합 대시보드',
          description: '모든 CRM 기능을 통합한 메인 대시보드',
          icon: <BarChart3 className="w-4 h-4" />,
          color: '#3B82F6',
          component: 'CRMDashboard'
        },
      ]
    }
  ];

  // 그룹 토글 기능
  const handleToggleGroup = (groupId: string) => {
    dispatch(toggleGroup(groupId));
  };

  // CRM 도구 클릭 핸들러
  const handleCRMToolClick = (tool: any) => {
    console.log('CRM 도구 클릭:', tool);
    console.log('현재 탭들:', tabs);
    
    // Redux 상태에서 기존 탭 확인
    const existingTab = tabs.find(tab => tab.id === tool.id || tab.component === tool.component);
    
    if (!existingTab) {
      // 새 탭 추가 및 활성화 (히스토리와 함께)
      console.log('새 탭 생성:', tool.id, tool.title, tool.component);
      addTabWithHistory({
        id: tool.id,
        title: tool.title,
        component: tool.component,
        url: `/crm/${tool.id}`,
        closable: true
      });
      
      dispatch(setActiveTab(tool.id));
    } else {
      // 기존 탭 활성화
      console.log('기존 탭 활성화:', existingTab.id);
      dispatch(setActiveTab(existingTab.id));
    }
  };

  // 전체 펼치기/닫기 함수들
  const handleExpandAll = () => {
    const allGroupIds = crmToolGroups.map(group => group.id);
    console.log('전체 펼치기 클릭됨');
    console.log('crmToolGroups:', crmToolGroups);
    console.log('allGroupIds:', allGroupIds);
    dispatch(setExpandedGroups(allGroupIds));
    console.log('expandedGroups 설정됨:', allGroupIds);
  };

  const handleCollapseAll = () => {
    console.log('전체 닫기 클릭됨');
    dispatch(setExpandedGroups([]));
    console.log('expandedGroups 초기화됨');
  };



  return (
    <div className="dashboard-container">
      {/* 헤더 */}
      <div className="dashboard-header">
        <div className="header-left">
          <h1 className="page-title">
            {currentTab?.menuIcon ? (
              React.createElement(getMenuIcon(currentTab.menuIcon), { size: 28 })
            ) : (
              <Activity size={28} />
            )}
            CRM 대시보드
          </h1>
        </div>
        <div className="header-right">
          <div className="date-info">
            <Calendar size={16} />
            <span>{new Date().toLocaleDateString('ko-KR', { 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric',
              weekday: 'long'
            })}</span>
          </div>
        </div>
      </div>

      {/* 주요 지표 카드들 - 주석처리됨 */}

      {/* 상세 정보 섹션 - 주석처리됨 */}

      {/* CRM 분석 도구 섹션 */}
      <div className="crm-tools-section">
        <div className="section-header">
          <div className="header-left">
            <h2 className="section-title">
              <Eye size={24} />
              CRM 대시보드 섹션별 정리해 봅니다..  @_@
            </h2>
          </div>
          <div className="header-right">
            <div className="tools-count">
              <span className="count-number">{crmToolGroups.reduce((total, group) => total + group.tools.length, 0)}</span>
              <span className="count-label">개 도구</span>
            </div>
            <div className="expand-controls">
              <button 
                className="expand-btn expand-all-btn"
                onClick={handleExpandAll}
                title="모든 그룹 펼치기"
              >
                <Maximize2 size={16} />
                <span>전체펼치기</span>
              </button>
              <button 
                className="expand-btn collapse-all-btn"
                onClick={handleCollapseAll}
                title="모든 그룹 닫기"
              >
                <Minimize2 size={16} />
                <span>전체닫기</span>
              </button>
            </div>
          </div>
        </div>

        <div className="crm-tool-groups">
          {crmToolGroups.map((group) => (
            <div key={group.id} className="tool-group">
              {/* 그룹 헤더 */}
              <div 
                className={`group-header ${expandedGroups.includes(group.id) ? 'expanded' : ''}`}
                onClick={() => handleToggleGroup(group.id)}
              >
                <div className="group-title">
                  <div className="group-icon" style={{ backgroundColor: group.color }}>
                    {group.icon}
                  </div>
                  <div className="group-info">
                    <h3>{group.title}</h3>
                    <p>{group.description}</p>
                  </div>
                </div>
                <div className="group-toggle">
                  {expandedGroups.includes(group.id) ? (
                    <ChevronDown size={20} />
                  ) : (
                    <ChevronRight size={20} />
                  )}
                </div>
              </div>

              {/* 그룹 도구들 */}
              {expandedGroups.includes(group.id) && (
                <div className="group-tools">
                  <div className="tools-grid">
                    {group.tools.map((tool) => (
                      <div 
                        key={tool.id}
                        className="crm-tool-card"
                        onClick={() => handleCRMToolClick(tool)}
                      >
                        <div className="tool-icon" style={{ backgroundColor: tool.color }}>
                          {tool.icon}
                        </div>
                        <div className="tool-content">
                          <h4>{tool.title}</h4>
                          <p>{tool.description}</p>
                        </div>
                        <div className="tool-arrow">
                          →
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
