import React, { useState } from 'react';
import { 
  TrendingUp, 
  TrendingDown,
  Activity,
  Target,
  Zap,
  Award,
  Brain,
  Eye,
  Users,
  Filter,
  Download,
  RefreshCw,
  Settings,
  Maximize2,
  Minimize2
} from 'lucide-react';
import './ProfessionalAnalyticsDashboard.css';

interface KPIMetric {
  id: string;
  name: string;
  value: number;
  previousValue: number;
  change: number;
  changePercent: number;
  trend: 'up' | 'down' | 'stable';
  target: number;
  achievement: number;
  unit: string;
  category: string;
  importance: 'high' | 'medium' | 'low';
  icon: React.ReactNode;
  color: string;
}

interface PredictiveModel {
  name: string;
  accuracy: number;
  confidence: number;
  prediction: number;
  trend: 'up' | 'down' | 'stable';
  factors: string[];
  lastUpdated: string;
}

interface AnomalyDetection {
  id: string;
  type: 'revenue' | 'customer' | 'channel' | 'product';
  severity: 'high' | 'medium' | 'low';
  description: string;
  detectedAt: string;
  impact: number;
  recommendation: string;
}

interface BenchmarkData {
  metric: string;
  ourValue: number;
  industryAverage: number;
  topQuartile: number;
  percentile: number;
  gap: number;
}

const ProfessionalAnalyticsDashboard: React.FC = () => {
  const [selectedPeriod, setSelectedPeriod] = useState('12months');
  const [selectedView, setSelectedView] = useState('executive');
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [fullscreen, setFullscreen] = useState(false);

  // 핵심 KPI 메트릭스
  const kpiMetrics: KPIMetric[] = [
    {
      id: 'revenue-growth',
      name: '매출 성장률',
      value: 18.5,
      previousValue: 15.2,
      change: 3.3,
      changePercent: 21.7,
      trend: 'up',
      target: 20.0,
      achievement: 92.5,
      unit: '%',
      category: 'financial',
      importance: 'high',
      icon: <TrendingUp className="w-5 h-5" />,
      color: '#10B981'
    },
    {
      id: 'customer-lifetime-value',
      name: '고객 생애 가치',
      value: 2850000,
      previousValue: 2650000,
      change: 200000,
      changePercent: 7.5,
      trend: 'up',
      target: 3000000,
      achievement: 95.0,
      unit: '원',
      category: 'customer',
      importance: 'high',
      icon: <Users className="w-5 h-5" />,
      color: '#3B82F6'
    },
    {
      id: 'conversion-rate',
      name: '전환율',
      value: 12.8,
      previousValue: 11.5,
      change: 1.3,
      changePercent: 11.3,
      trend: 'up',
      target: 15.0,
      achievement: 85.3,
      unit: '%',
      category: 'marketing',
      importance: 'high',
      icon: <Target className="w-5 h-5" />,
      color: '#8B5CF6'
    },
    {
      id: 'churn-rate',
      name: '이탈률',
      value: 8.2,
      previousValue: 9.1,
      change: -0.9,
      changePercent: -9.9,
      trend: 'down',
      target: 7.0,
      achievement: 85.4,
      unit: '%',
      category: 'customer',
      importance: 'high',
      icon: <TrendingDown className="w-5 h-5" />,
      color: '#EF4444'
    },
    {
      id: 'market-share',
      name: '시장점유율',
      value: 12.8,
      previousValue: 11.6,
      change: 1.2,
      changePercent: 10.3,
      trend: 'up',
      target: 15.0,
      achievement: 85.3,
      unit: '%',
      category: 'competitive',
      importance: 'high',
      icon: <Award className="w-5 h-5" />,
      color: '#F59E0B'
    },
    {
      id: 'operational-efficiency',
      name: '운영 효율성',
      value: 87.3,
      previousValue: 84.7,
      change: 2.6,
      changePercent: 3.1,
      trend: 'up',
      target: 90.0,
      achievement: 97.0,
      unit: '%',
      category: 'operational',
      importance: 'medium',
      icon: <Zap className="w-5 h-5" />,
      color: '#06B6D4'
    }
  ];

  // 예측 모델 데이터
  const predictiveModels: PredictiveModel[] = [
    {
      name: '매출 예측 모델',
      accuracy: 94.2,
      confidence: 91.5,
      prediction: 12500000000,
      trend: 'up',
      factors: ['계절성', '마케팅 지출', '경쟁사 동향', '경제 지표'],
      lastUpdated: '2024-01-21 14:30'
    },
    {
      name: '고객 이탈 예측',
      accuracy: 89.7,
      confidence: 87.3,
      prediction: 8.1,
      trend: 'down',
      factors: ['구매 빈도', '고객 만족도', '경쟁사 활동', '서비스 품질'],
      lastUpdated: '2024-01-21 14:25'
    },
    {
      name: '수요 예측 모델',
      accuracy: 92.8,
      confidence: 89.1,
      prediction: 156000,
      trend: 'up',
      factors: ['과거 판매', '마케팅 캠페인', '경제 상황', '고객 행동'],
      lastUpdated: '2024-01-21 14:20'
    }
  ];

  // 이상 탐지 데이터
  const anomalyDetections: AnomalyDetection[] = [
    {
      id: '1',
      type: 'revenue',
      severity: 'high',
      description: '직영점 매출이 예상 대비 23% 급증',
      detectedAt: '2024-01-21 15:45',
      impact: 1200000000,
      recommendation: '인벤토리 충분성 확인 및 직원 교육 강화'
    },
    {
      id: '2',
      type: 'customer',
      severity: 'medium',
      description: '30대 고객층 이탈률이 평균 대비 15% 증가',
      detectedAt: '2024-01-21 14:20',
      impact: 450000000,
      recommendation: '30대 타겟 리텐션 캠페인 즉시 실행'
    },
    {
      id: '3',
      type: 'channel',
      severity: 'low',
      description: '모바일 앱 전환율이 일시적으로 하락',
      detectedAt: '2024-01-21 13:15',
      impact: 180000000,
      recommendation: '앱 성능 모니터링 및 사용자 경험 개선'
    }
  ];

  // 벤치마크 데이터
  const benchmarkData: BenchmarkData[] = [
    {
      metric: '매출 성장률',
      ourValue: 18.5,
      industryAverage: 12.3,
      topQuartile: 22.7,
      percentile: 78,
      gap: 4.2
    },
    {
      metric: '고객 만족도',
      ourValue: 4.6,
      industryAverage: 4.2,
      topQuartile: 4.8,
      percentile: 85,
      gap: 0.2
    },
    {
      metric: '전환율',
      ourValue: 12.8,
      industryAverage: 9.5,
      topQuartile: 15.2,
      percentile: 82,
      gap: 2.4
    },
    {
      metric: '이탈률',
      ourValue: 8.2,
      industryAverage: 11.7,
      topQuartile: 6.8,
      percentile: 76,
      gap: -1.4
    }
  ];

  const formatNumber = (num: number): string => {
    if (num >= 1000000000) {
      return (num / 1000000000).toFixed(1) + 'B';
    } else if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    } else if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    }
    return num.toFixed(1);
  };

  const formatCurrency = (num: number): string => {
    return new Intl.NumberFormat('ko-KR', {
      style: 'currency',
      currency: 'KRW',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(num);
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up':
        return <TrendingUp className="w-4 h-4 text-green-500" />;
      case 'down':
        return <TrendingDown className="w-4 h-4 text-red-500" />;
      default:
        return <Activity className="w-4 h-4 text-gray-500" />;
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high':
        return '#EF4444';
      case 'medium':
        return '#F59E0B';
      case 'low':
        return '#10B981';
      default:
        return '#6B7280';
    }
  };

  const getPercentileColor = (percentile: number) => {
    if (percentile >= 90) return '#059669';
    if (percentile >= 75) return '#10B981';
    if (percentile >= 50) return '#F59E0B';
    return '#EF4444';
  };

  const executiveView = selectedView === 'executive';
  const operationalView = selectedView === 'operational';

  return (
    <div className={`professional-analytics-dashboard ${fullscreen ? 'fullscreen' : ''}`}>
      <div className="dashboard-header">
        <div className="header-content">
          <div className="header-title">
            <Brain className="w-8 h-8 text-purple-600" />
            <h1>분석 대시보드</h1>
            <div className="dashboard-badge">
              <Eye className="w-4 h-4" />
              <span>실시간 모니터링</span>
            </div>
          </div>
          
          <div className="header-controls">
            <div className="control-group">
              <label>분석 기간</label>
              <select 
                value={selectedPeriod} 
                onChange={(e) => setSelectedPeriod(e.target.value)}
                className="period-selector"
              >
                <option value="1month">최근 1개월</option>
                <option value="3months">최근 3개월</option>
                <option value="6months">최근 6개월</option>
                <option value="12months">최근 12개월</option>
                <option value="24months">최근 24개월</option>
              </select>
            </div>
            
            <div className="control-group">
              <label>뷰 모드</label>
              <select 
                value={selectedView} 
                onChange={(e) => setSelectedView(e.target.value)}
                className="view-selector"
              >
                <option value="executive">임원진 뷰</option>
                <option value="operational">운영진 뷰</option>
                <option value="analyst">분석가 뷰</option>
              </select>
            </div>

            <div className="control-actions">
              <button 
                className={`refresh-btn ${autoRefresh ? 'active' : ''}`}
                onClick={() => setAutoRefresh(!autoRefresh)}
                title="자동 새로고침"
              >
                <RefreshCw className="w-4 h-4" />
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
              <button 
                className="fullscreen-btn"
                onClick={() => setFullscreen(!fullscreen)}
                title={fullscreen ? "창 모드" : "전체화면"}
              >
                {fullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 핵심 KPI 대시보드 */}
      <div className="kpi-dashboard">
        <h2>핵심 성과 지표 (KPI)</h2>
        <div className="kpi-grid">
          {kpiMetrics.map((metric) => (
            <div key={metric.id} className={`kpi-card ${metric.importance} ${executiveView ? 'executive' : ''}`}>
              <div className="kpi-header">
                <div className="kpi-icon" style={{ backgroundColor: metric.color }}>
                  {metric.icon}
                </div>
                <div className="kpi-info">
                  <h3>{metric.name}</h3>
                  <div className="kpi-category">{metric.category}</div>
                </div>
                <div className="kpi-trend">
                  {getTrendIcon(metric.trend)}
                  <span className={`trend-value ${metric.trend}`}>
                    {metric.changePercent > 0 ? '+' : ''}{metric.changePercent}%
                  </span>
                </div>
              </div>

              <div className="kpi-metrics">
                <div className="kpi-value">
                  {metric.unit === '원' ? formatCurrency(metric.value) : `${metric.value}${metric.unit}`}
                </div>
                <div className="kpi-change">
                  {metric.unit === '원' ? formatCurrency(metric.change) : `${metric.change}${metric.unit}`}
                </div>
              </div>

              <div className="kpi-progress">
                <div className="progress-bar">
                  <div 
                    className="progress-fill" 
                    style={{ 
                      width: `${metric.achievement}%`,
                      backgroundColor: metric.color
                    }}
                  ></div>
                </div>
                <div className="progress-text">
                  <span>목표 달성률</span>
                  <span>{metric.achievement}%</span>
                </div>
              </div>

              {operationalView && (
                <div className="kpi-details">
                  <div className="detail-row">
                    <span>이전 값</span>
                    <span>{metric.unit === '원' ? formatCurrency(metric.previousValue) : `${metric.previousValue}${metric.unit}`}</span>
                  </div>
                  <div className="detail-row">
                    <span>목표</span>
                    <span>{metric.unit === '원' ? formatCurrency(metric.target) : `${metric.target}${metric.unit}`}</span>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* 예측 분석 */}
      <div className="predictive-analysis">
        <h2>예측 분석 및 머신러닝 모델</h2>
        <div className="models-grid">
          {predictiveModels.map((model, index) => (
            <div key={index} className="model-card">
              <div className="model-header">
                <div className="model-icon">
                  <Brain className="w-6 h-6" />
                </div>
                <div className="model-info">
                  <h3>{model.name}</h3>
                  <div className="model-meta">
                    <span className="accuracy">정확도: {model.accuracy}%</span>
                    <span className="confidence">신뢰도: {model.confidence}%</span>
                  </div>
                </div>
                <div className="model-trend">
                  {getTrendIcon(model.trend)}
                </div>
              </div>

              <div className="model-prediction">
                <div className="prediction-value">
                  {model.name.includes('매출') ? formatCurrency(model.prediction) : 
                   model.name.includes('이탈') ? `${model.prediction}%` : 
                   formatNumber(model.prediction)}
                </div>
                <div className="prediction-label">예측값</div>
              </div>

              <div className="model-factors">
                <h4>주요 영향 요인</h4>
                <div className="factors-list">
                  {model.factors.map((factor, factorIndex) => (
                    <span key={factorIndex} className="factor-tag">{factor}</span>
                  ))}
                </div>
              </div>

              <div className="model-footer">
                <span className="last-updated">최종 업데이트: {model.lastUpdated}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 이상 탐지 */}
      <div className="prof-analytics-anomaly-detection">
        <h2>이상 탐지 및 알림</h2>
        <div className="prof-analytics-anomalies-list">
          {anomalyDetections.map((anomaly) => (
            <div key={anomaly.id} className={`prof-analytics-anomaly-card ${anomaly.severity}`}>
              <div className="prof-analytics-anomaly-header">
                <div className="prof-analytics-severity-indicator" style={{ backgroundColor: getSeverityColor(anomaly.severity) }}>
                  {anomaly.severity.toUpperCase()}
                </div>
                <div className="prof-analytics-anomaly-info">
                  <h3>{anomaly.description}</h3>
                  <div className="prof-analytics-anomaly-meta">
                    <span className="type">{anomaly.type}</span>
                    <span className="detected-at">{anomaly.detectedAt}</span>
                  </div>
                </div>
                <div className="prof-analytics-impact-value">
                  {formatCurrency(anomaly.impact)}
                </div>
              </div>

              <div className="prof-analytics-anomaly-recommendation">
                <h4>권장 조치</h4>
                <p>{anomaly.recommendation}</p>
              </div>

              <div className="prof-analytics-anomaly-actions">
                <button className="prof-analytics-action-btn primary">조치 실행</button>
                <button className="prof-analytics-action-btn secondary">상세 분석</button>
                <button className="prof-analytics-action-btn tertiary">무시</button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 벤치마킹 */}
      <div className="benchmarking">
        <h2>업계 벤치마킹</h2>
        <div className="benchmark-grid">
          {benchmarkData.map((benchmark, index) => (
            <div key={index} className="benchmark-card">
              <div className="benchmark-header">
                <h3>{benchmark.metric}</h3>
                <div className="percentile-badge" style={{ backgroundColor: getPercentileColor(benchmark.percentile) }}>
                  상위 {benchmark.percentile}%
                </div>
              </div>

              <div className="benchmark-values">
                <div className="value-row our-value">
                  <span className="label">우리 값</span>
                  <span className="value">{benchmark.metric.includes('만족도') ? benchmark.ourValue : `${benchmark.ourValue}%`}</span>
                </div>
                <div className="value-row industry">
                  <span className="label">업계 평균</span>
                  <span className="value">{benchmark.metric.includes('만족도') ? benchmark.industryAverage : `${benchmark.industryAverage}%`}</span>
                </div>
                <div className="value-row top-quartile">
                  <span className="label">상위 25%</span>
                  <span className="value">{benchmark.metric.includes('만족도') ? benchmark.topQuartile : `${benchmark.topQuartile}%`}</span>
                </div>
              </div>

              <div className="benchmark-gap">
                <div className="gap-label">업계 평균 대비</div>
                <div className={`gap-value ${benchmark.gap > 0 ? 'positive' : 'negative'}`}>
                  {benchmark.gap > 0 ? '+' : ''}{benchmark.metric.includes('만족도') ? benchmark.gap : `${benchmark.gap}%p`}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 실시간 모니터링 */}
      <div className="realtime-monitoring">
        <h2>실시간 모니터링</h2>
        <div className="monitoring-grid">
          <div className="monitoring-card">
            <div className="monitoring-header">
              <h3>시스템 상태</h3>
              <div className="status-indicator online">온라인</div>
            </div>
            <div className="monitoring-metrics">
              <div className="metric">
                <span>API 응답시간</span>
                <span className="value good">142ms</span>
              </div>
              <div className="metric">
                <span>데이터베이스 연결</span>
                <span className="value good">정상</span>
              </div>
              <div className="metric">
                <span>데이터 업데이트</span>
                <span className="value good">실시간</span>
              </div>
            </div>
          </div>

          <div className="monitoring-card">
            <div className="monitoring-header">
              <h3>데이터 품질</h3>
              <div className="status-indicator good">우수</div>
            </div>
            <div className="monitoring-metrics">
              <div className="metric">
                <span>데이터 완성도</span>
                <span className="value good">98.7%</span>
              </div>
              <div className="metric">
                <span>중복 데이터</span>
                <span className="value good">0.3%</span>
              </div>
              <div className="metric">
                <span>데이터 신선도</span>
                <span className="value good">실시간</span>
              </div>
            </div>
          </div>

          <div className="monitoring-card">
            <div className="monitoring-header">
              <h3>성능 지표</h3>
              <div className="status-indicator good">양호</div>
            </div>
            <div className="monitoring-metrics">
              <div className="metric">
                <span>페이지 로드시간</span>
                <span className="value good">1.2s</span>
              </div>
              <div className="metric">
                <span>차트 렌더링</span>
                <span className="value good">0.8s</span>
              </div>
              <div className="metric">
                <span>데이터 처리</span>
                <span className="value good">즉시</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfessionalAnalyticsDashboard;
