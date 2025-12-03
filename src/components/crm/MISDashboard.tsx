import React, { useState } from 'react';
import { 
  TrendingUp, 
  AlertTriangle, 
  CheckCircle, 
  Target, 
  Users, 
  ShoppingCart,
  BarChart3,
  Activity,
  Clock,
  ArrowUp,
  ArrowDown,
  Minus,
  Eye,
  RefreshCw,
  Filter,
  Download,
  Settings,
  Maximize2
} from 'lucide-react';
import './MISDashboard.css';

interface ActionIndicator {
  id: string;
  title: string;
  category: string;
  currentValue: number;
  previousValue: number;
  targetValue: number;
  unit: string;
  trend: 'up' | 'down' | 'stable';
  status: 'critical' | 'warning' | 'good' | 'excellent';
  priority: 'high' | 'medium' | 'low';
  description: string;
  actionRequired: string;
  responsible: string;
  deadline: string;
  icon: React.ReactNode;
  color: string;
}

interface StrategicGoal {
  id: string;
  title: string;
  progress: number;
  target: number;
  status: 'on-track' | 'at-risk' | 'behind';
  deadline: string;
  owner: string;
}

const MISDashboard: React.FC = () => {
  const [selectedPeriod, setSelectedPeriod] = useState('current');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [isRefreshing, setIsRefreshing] = useState(false);

  // 행동지표 데이터
  const actionIndicators: ActionIndicator[] = [
    {
      id: 'revenue-growth',
      title: '매출 성장률',
      category: 'revenue',
      currentValue: 12.5,
      previousValue: 8.3,
      targetValue: 15.0,
      unit: '%',
      trend: 'up',
      status: 'good',
      priority: 'high',
      description: '전년 대비 매출 성장률',
      actionRequired: '신제품 출시 및 마케팅 강화 필요',
      responsible: '마케팅팀',
      deadline: '2024-03-31',
      icon: <TrendingUp className="w-5 h-5" />,
      color: '#10B981'
    },
    {
      id: 'customer-acquisition',
      title: '신규 고객 획득',
      category: 'customer',
      currentValue: 1250,
      previousValue: 980,
      targetValue: 1500,
      unit: '명',
      trend: 'up',
      status: 'good',
      priority: 'high',
      description: '월 신규 고객 획득 수',
      actionRequired: '온라인 광고 예산 증액 및 리드 생성 캠페인',
      responsible: '영업팀',
      deadline: '2024-02-28',
      icon: <Users className="w-5 h-5" />,
      color: '#3B82F6'
    },
    {
      id: 'conversion-rate',
      title: '전환율',
      category: 'marketing',
      currentValue: 3.2,
      previousValue: 4.1,
      targetValue: 5.0,
      unit: '%',
      trend: 'down',
      status: 'warning',
      priority: 'high',
      description: '웹사이트 방문자 대비 구매 전환율',
      actionRequired: '웹사이트 UX 개선 및 A/B 테스트 실시',
      responsible: '개발팀',
      deadline: '2024-02-15',
      icon: <Target className="w-5 h-5" />,
      color: '#F59E0B'
    },
    {
      id: 'customer-satisfaction',
      title: '고객 만족도',
      category: 'customer',
      currentValue: 4.2,
      previousValue: 4.0,
      targetValue: 4.5,
      unit: '/5.0',
      trend: 'up',
      status: 'good',
      priority: 'medium',
      description: '고객 만족도 조사 결과',
      actionRequired: '고객 서비스 교육 강화 및 피드백 시스템 개선',
      responsible: '고객서비스팀',
      deadline: '2024-03-15',
      icon: <CheckCircle className="w-5 h-5" />,
      color: '#8B5CF6'
    },
    {
      id: 'inventory-turnover',
      title: '재고 회전율',
      category: 'operations',
      currentValue: 6.8,
      previousValue: 7.2,
      targetValue: 8.0,
      unit: '회/년',
      trend: 'down',
      status: 'warning',
      priority: 'medium',
      description: '재고 회전 속도',
      actionRequired: '재고 최적화 및 판매 촉진 전략 수립',
      responsible: '물류팀',
      deadline: '2024-02-28',
      icon: <ShoppingCart className="w-5 h-5" />,
      color: '#EF4444'
    },
    {
      id: 'employee-productivity',
      title: '직원 생산성',
      category: 'hr',
      currentValue: 85,
      previousValue: 82,
      targetValue: 90,
      unit: '%',
      trend: 'up',
      status: 'good',
      priority: 'low',
      description: '직원당 매출 기여도',
      actionRequired: '직원 교육 프로그램 확대 및 업무 효율성 개선',
      responsible: '인사팀',
      deadline: '2024-04-30',
      icon: <Activity className="w-5 h-5" />,
      color: '#06B6D4'
    }
  ];

  // 전략적 목표 데이터
  const strategicGoals: StrategicGoal[] = [
    {
      id: 'digital-transformation',
      title: '디지털 전환 프로젝트',
      progress: 65,
      target: 100,
      status: 'on-track',
      deadline: '2024-06-30',
      owner: 'IT팀'
    },
    {
      id: 'market-expansion',
      title: '신시장 진출',
      progress: 30,
      target: 100,
      status: 'at-risk',
      deadline: '2024-05-31',
      owner: '사업개발팀'
    },
    {
      id: 'cost-optimization',
      title: '비용 최적화',
      progress: 80,
      target: 100,
      status: 'on-track',
      deadline: '2024-03-31',
      owner: '재무팀'
    }
  ];

  // 상태별 색상
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'critical': return '#EF4444';
      case 'warning': return '#F59E0B';
      case 'good': return '#10B981';
      case 'excellent': return '#059669';
      default: return '#6B7280';
    }
  };

  // 우선순위별 색상
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return '#EF4444';
      case 'medium': return '#F59E0B';
      case 'low': return '#10B981';
      default: return '#6B7280';
    }
  };

  // 트렌드 아이콘
  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up': return <ArrowUp className="w-4 h-4 text-green-500" />;
      case 'down': return <ArrowDown className="w-4 h-4 text-red-500" />;
      case 'stable': return <Minus className="w-4 h-4 text-gray-500" />;
      default: return <Minus className="w-4 h-4 text-gray-500" />;
    }
  };

  // 필터링된 데이터
  const filteredIndicators = selectedCategory === 'all' 
    ? actionIndicators 
    : actionIndicators.filter(indicator => indicator.category === selectedCategory);

  // 새로고침 시뮬레이션
  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => setIsRefreshing(false), 2000);
  };

  return (
    <div className="mis-dashboard">
      {/* 대시보드 헤더 */}
      <div className="dashboard-header">
        <div className="header-title">
          <BarChart3 className="w-8 h-8 text-blue-600" />
          <h1>MIS 대시보드</h1>
          <div className="dashboard-badge">
            <Eye className="w-4 h-4" />
            <span>실시간 모니터링</span>
          </div>
        </div>
        <div className="header-subtitle">
          핵심 행동지표 및 전략적 목표 추적
        </div>
      </div>

      {/* 컨트롤 패널 */}
      <div className="control-panel">
        <div className="control-group">
          <label>기간</label>
          <select 
            value={selectedPeriod} 
            onChange={(e) => setSelectedPeriod(e.target.value)}
            className="control-select"
          >
            <option value="current">현재</option>
            <option value="monthly">월별</option>
            <option value="quarterly">분기별</option>
            <option value="yearly">연간</option>
          </select>
        </div>
        
        <div className="control-group">
          <label>카테고리</label>
          <select 
            value={selectedCategory} 
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="control-select"
          >
            <option value="all">전체</option>
            <option value="revenue">매출</option>
            <option value="customer">고객</option>
            <option value="marketing">마케팅</option>
            <option value="operations">운영</option>
            <option value="hr">인사</option>
          </select>
        </div>

        <div className="control-actions">
          <button 
            className={`refresh-btn ${isRefreshing ? 'active' : ''}`}
            onClick={handleRefresh}
            disabled={isRefreshing}
            title={isRefreshing ? '업데이트 중...' : '새로고침'}
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          </button>
          
          <button className="filter-btn" title="필터">
            <Filter className="w-4 h-4" />
          </button>
          
          <button className="export-btn" title="내보내기">
            <Download className="w-4 h-4" />
          </button>
          
          <button className="settings-btn" title="설정">
            <Settings className="w-4 h-4" />
          </button>
          
          <button className="fullscreen-btn" title="전체화면">
            <Maximize2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 핵심 지표 요약 */}
      <div className="kpi-summary">
        <div className="summary-card critical">
          <div className="summary-icon">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div className="summary-content">
            <h3>긴급 조치 필요</h3>
            <p className="summary-count">2</p>
            <p className="summary-label">지표</p>
          </div>
        </div>
        
        <div className="summary-card warning">
          <div className="summary-icon">
            <Clock className="w-6 h-6" />
          </div>
          <div className="summary-content">
            <h3>주의 관찰</h3>
            <p className="summary-count">3</p>
            <p className="summary-label">지표</p>
          </div>
        </div>
        
        <div className="summary-card good">
          <div className="summary-icon">
            <CheckCircle className="w-6 h-6" />
          </div>
          <div className="summary-content">
            <h3>양호</h3>
            <p className="summary-count">1</p>
            <p className="summary-label">지표</p>
          </div>
        </div>
      </div>

      {/* 행동지표 카드 그리드 */}
      <div className="indicators-grid">
        {filteredIndicators.map((indicator) => (
          <div key={indicator.id} className={`indicator-card ${indicator.status}`}>
            <div className="card-header">
              <div className="indicator-icon" style={{ backgroundColor: indicator.color }}>
                {indicator.icon}
              </div>
              <div className="indicator-title">
                <h3>{indicator.title}</h3>
                <p>{indicator.description}</p>
              </div>
              <div className="indicator-status">
                <span 
                  className="status-badge" 
                  style={{ backgroundColor: getStatusColor(indicator.status) }}
                >
                  {indicator.status.toUpperCase()}
                </span>
                <span 
                  className="priority-badge" 
                  style={{ backgroundColor: getPriorityColor(indicator.priority) }}
                >
                  {indicator.priority.toUpperCase()}
                </span>
              </div>
            </div>

            <div className="card-metrics">
              <div className="metric-row">
                <span className="metric-label">현재값</span>
                <span className="metric-value">
                  {indicator.currentValue.toLocaleString()}{indicator.unit}
                </span>
                <div className="trend-indicator">
                  {getTrendIcon(indicator.trend)}
                </div>
              </div>
              
              <div className="metric-row">
                <span className="metric-label">이전값</span>
                <span className="metric-value">
                  {indicator.previousValue.toLocaleString()}{indicator.unit}
                </span>
              </div>
              
              <div className="metric-row">
                <span className="metric-label">목표값</span>
                <span className="metric-value target">
                  {indicator.targetValue.toLocaleString()}{indicator.unit}
                </span>
              </div>
            </div>

            <div className="card-progress">
              <div className="progress-bar">
                <div 
                  className="progress-fill" 
                  style={{ 
                    width: `${(indicator.currentValue / indicator.targetValue) * 100}%`,
                    backgroundColor: indicator.color
                  }}
                ></div>
              </div>
              <span className="progress-text">
                {((indicator.currentValue / indicator.targetValue) * 100).toFixed(1)}%
              </span>
            </div>

            <div className="card-actions">
              <div className="action-required">
                <h4>필요 조치</h4>
                <p>{indicator.actionRequired}</p>
              </div>
              
              <div className="action-details">
                <div className="detail-row">
                  <span className="detail-label">담당자:</span>
                  <span className="detail-value">{indicator.responsible}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">마감일:</span>
                  <span className="detail-value">{indicator.deadline}</span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* 전략적 목표 */}
      <div className="strategic-goals">
        <h2>전략적 목표</h2>
        <div className="goals-grid">
          {strategicGoals.map((goal) => (
            <div key={goal.id} className={`goal-card ${goal.status}`}>
              <div className="goal-header">
                <h3>{goal.title}</h3>
                <span className={`goal-status ${goal.status}`}>
                  {goal.status === 'on-track' ? '정상 진행' : 
                   goal.status === 'at-risk' ? '위험' : '지연'}
                </span>
              </div>
              
              <div className="goal-progress">
                <div className="progress-info">
                  <span className="progress-label">진행률</span>
                  <span className="progress-percentage">{goal.progress}%</span>
                </div>
                <div className="progress-bar">
                  <div 
                    className="progress-fill" 
                    style={{ 
                      width: `${goal.progress}%`,
                      backgroundColor: goal.status === 'on-track' ? '#10B981' : 
                                     goal.status === 'at-risk' ? '#F59E0B' : '#EF4444'
                    }}
                  ></div>
                </div>
              </div>
              
              <div className="goal-details">
                <div className="detail-row">
                  <span className="detail-label">담당자:</span>
                  <span className="detail-value">{goal.owner}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">마감일:</span>
                  <span className="detail-value">{goal.deadline}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default MISDashboard;
