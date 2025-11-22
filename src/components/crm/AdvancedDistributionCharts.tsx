import React, { useState } from 'react';
import { 
  BarChart3
} from 'lucide-react';
import './AdvancedDistributionCharts.css';

interface DistributionData {
  label: string;
  value: number;
  percentage: number;
  color: string;
  trend?: 'up' | 'down' | 'stable';
  change?: number;
}

interface HeatmapData {
  x: string;
  y: string;
  value: number;
  intensity: number;
}

interface ScatterData {
  x: number;
  y: number;
  size: number;
  color: string;
  label: string;
  category: string;
}

interface BoxPlotData {
  category: string;
  min: number;
  q1: number;
  median: number;
  q3: number;
  max: number;
  outliers: number[];
}

interface SankeyData {
  source: string;
  target: string;
  value: number;
}

const AdvancedDistributionCharts: React.FC = () => {
  const [selectedChart, setSelectedChart] = useState('all');
  const [selectedTimeframe, setSelectedTimeframe] = useState('12months');

  // 고객 등급별 분포 데이터
  const customerTierDistribution: DistributionData[] = [
    { label: '플래티넘', value: 2100, percentage: 7.6, color: '#E5E4E2', trend: 'up', change: 12.5 },
    { label: '골드', value: 4200, percentage: 15.2, color: '#FFD700', trend: 'up', change: 8.7 },
    { label: '실버', value: 8900, percentage: 32.1, color: '#C0C0C0', trend: 'stable', change: 2.1 },
    { label: '브론즈', value: 12500, percentage: 45.1, color: '#CD7F32', trend: 'down', change: -3.2 }
  ];

  // 채널별 매출 분포 데이터
  const channelRevenueDistribution: DistributionData[] = [
    { label: '자사 쇼핑몰', value: 3420000000, percentage: 39.2, color: '#F59E0B', trend: 'up', change: 18.3 },
    { label: '직영점', value: 2840000000, percentage: 32.5, color: '#3B82F6', trend: 'up', change: 15.9 },
    { label: '대리점', value: 1980000000, percentage: 22.7, color: '#10B981', trend: 'up', change: 8.8 },
    { label: '모바일 앱', value: 1560000000, percentage: 17.9, color: '#8B5CF6', trend: 'up', change: 25.8 },
    { label: '외부 쇼핑몰', value: 890000000, percentage: 10.2, color: '#EF4444', trend: 'up', change: 14.1 },
    { label: '전화주문', value: 420000000, percentage: 4.8, color: '#06B6D4', trend: 'down', change: -6.7 }
  ];

  // 연령대별 고객 분포 데이터
  const ageGroupDistribution: DistributionData[] = [
    { label: '20대', value: 8500, percentage: 18.2, color: '#3B82F6', trend: 'up', change: 12.5 },
    { label: '30대', value: 12000, percentage: 25.7, color: '#10B981', trend: 'up', change: 15.8 },
    { label: '40대', value: 14500, percentage: 31.0, color: '#F59E0B', trend: 'up', change: 22.3 },
    { label: '50대', value: 9800, percentage: 21.0, color: '#8B5CF6', trend: 'up', change: 18.7 },
    { label: '60대+', value: 1900, percentage: 4.1, color: '#EF4444', trend: 'up', change: 8.9 }
  ];

  // 지역별 고객 분포 데이터
  const regionalDistribution: DistributionData[] = [
    { label: '서울', value: 45600, percentage: 39.2, color: '#3B82F6', trend: 'up', change: 18.5 },
    { label: '경기', value: 28400, percentage: 21.7, color: '#10B981', trend: 'up', change: 15.2 },
    { label: '인천', value: 15600, percentage: 10.2, color: '#F59E0B', trend: 'up', change: 12.8 },
    { label: '부산', value: 12800, percentage: 8.9, color: '#8B5CF6', trend: 'up', change: 14.7 },
    { label: '대구', value: 9800, percentage: 6.4, color: '#EF4444', trend: 'up', change: 11.3 },
    { label: '기타', value: 15200, percentage: 10.2, color: '#06B6D4', trend: 'up', change: 16.7 }
  ];

  // 히트맵 데이터 (월별 x 채널별 매출)
  const heatmapData: HeatmapData[] = [
    { x: '1월', y: '직영점', value: 890000000, intensity: 0.9 },
    { x: '1월', y: '대리점', value: 620000000, intensity: 0.7 },
    { x: '1월', y: '자사쇼핑몰', value: 1150000000, intensity: 0.95 },
    { x: '1월', y: '모바일앱', value: 580000000, intensity: 0.8 },
    { x: '2월', y: '직영점', value: 920000000, intensity: 0.95 },
    { x: '2월', y: '대리점', value: 680000000, intensity: 0.8 },
    { x: '2월', y: '자사쇼핑몰', value: 1280000000, intensity: 1.0 },
    { x: '2월', y: '모바일앱', value: 640000000, intensity: 0.85 },
    { x: '3월', y: '직영점', value: 880000000, intensity: 0.85 },
    { x: '3월', y: '대리점', value: 650000000, intensity: 0.75 },
    { x: '3월', y: '자사쇼핑몰', value: 1200000000, intensity: 0.9 },
    { x: '3월', y: '모바일앱', value: 610000000, intensity: 0.8 }
  ];

  // 산점도 데이터 (고객 수 x 매출)
  const scatterData: ScatterData[] = [
    { x: 8500, y: 1890000000, size: 75, color: '#3B82F6', label: '20대', category: 'age' },
    { x: 12000, y: 2340000000, size: 85, color: '#10B981', label: '30대', category: 'age' },
    { x: 14500, y: 2850000000, size: 95, color: '#F59E0B', label: '40대', category: 'age' },
    { x: 9800, y: 1950000000, size: 80, color: '#8B5CF6', label: '50대', category: 'age' },
    { x: 1900, y: 320000000, size: 35, color: '#EF4444', label: '60대+', category: 'age' }
  ];

  // 박스플롯 데이터 (채널별 주문액 분포)
  const boxPlotData: BoxPlotData[] = [
    { category: '직영점', min: 150000, q1: 280000, median: 350000, q3: 450000, max: 680000, outliers: [750000, 820000] },
    { category: '대리점', min: 120000, q1: 250000, median: 320000, q3: 410000, max: 590000, outliers: [650000, 720000] },
    { category: '자사쇼핑몰', min: 80000, q1: 180000, median: 240000, q3: 320000, max: 480000, outliers: [520000, 580000] },
    { category: '모바일앱', min: 70000, q1: 160000, median: 220000, q3: 290000, max: 420000, outliers: [450000, 490000] }
  ];

  // 샌키 다이어그램 데이터 (고객 유입 경로)
  const sankeyData: SankeyData[] = [
    { source: '온라인 광고', target: '웹사이트', value: 4500 },
    { source: '온라인 광고', target: '모바일앱', value: 3200 },
    { source: '소셜미디어', target: '웹사이트', value: 2800 },
    { source: '소셜미디어', target: '모바일앱', value: 2100 },
    { source: '검색엔진', target: '웹사이트', value: 3800 },
    { source: '추천', target: '직영점', value: 1500 },
    { source: '추천', target: '대리점', value: 1200 },
    { source: '웹사이트', target: '구매', value: 11100 },
    { source: '모바일앱', target: '구매', value: 5300 },
    { source: '직영점', target: '구매', value: 1500 },
    { source: '대리점', target: '구매', value: 1200 }
  ];

  // 노드별 총 유입량 계산
  const nodeTotals: { [key: string]: number } = {};
  sankeyData.forEach(flow => {
    nodeTotals[flow.source] = (nodeTotals[flow.source] || 0) + flow.value;
    nodeTotals[flow.target] = (nodeTotals[flow.target] || 0) + flow.value;
  });

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

  const getHeatmapColor = (intensity: number): string => {
    const colors = [
      '#fef2f2', '#fee2e2', '#fecaca', '#fca5a5', '#f87171', 
      '#ef4444', '#dc2626', '#b91c1c', '#991b1b', '#7f1d1d'
    ];
    const index = Math.floor(intensity * (colors.length - 1));
    return colors[index];
  };


  return (
    <div className="advanced-distribution-charts">
      <div className="dashboard-header">
        <div className="header-title">
          <BarChart3 className="w-8 h-8 text-indigo-600" />
          <h1>분포도 차트 대시보드</h1>
        </div>
        <div className="header-subtitle">
          다차원 데이터 분포 분석 및 시각화
        </div>
        
        <div className="header-controls">
          <div className="control-group">
            <label>차트 유형</label>
            <select 
              value={selectedChart} 
              onChange={(e) => setSelectedChart(e.target.value)}
              className="chart-selector"
            >
              <option value="all">전체 보기</option>
              <option value="pie">파이 차트</option>
              <option value="bar">막대 차트</option>
              <option value="heatmap">히트맵</option>
              <option value="scatter">산점도</option>
              <option value="boxplot">박스플롯</option>
              <option value="sankey">샌키 다이어그램</option>
            </select>
          </div>
          
          <div className="control-group">
            <label>분석 기간</label>
            <select 
              value={selectedTimeframe} 
              onChange={(e) => setSelectedTimeframe(e.target.value)}
              className="timeframe-selector"
            >
              <option value="12months">최근 12개월</option>
              <option value="6months">최근 6개월</option>
              <option value="quarterly">분기별</option>
              <option value="monthly">월별</option>
            </select>
          </div>
        </div>
      </div>

      {/* 파이 차트 섹션 */}
      {(selectedChart === 'all' || selectedChart === 'pie') && (
        <div className="pie-charts-section">
          <h2>분포도 파이 차트</h2>
          <div className="pie-charts-grid">
            <div className="pie-chart-container">
              <h3>고객 등급별 분포</h3>
              <div className="pie-chart">
                <div className="pie-center">
                  <div className="center-value">{customerTierDistribution.reduce((sum, item) => sum + item.value, 0).toLocaleString()}</div>
                  <div className="center-label">총 고객</div>
                </div>
                <svg className="pie-svg" viewBox="0 0 100 100">
                  {customerTierDistribution.map((item, index) => {
                    const total = customerTierDistribution.reduce((sum, tier) => sum + tier.value, 0);
                    const percentage = (item.value / total) * 100;
                    const startAngle = customerTierDistribution.slice(0, index).reduce((sum, tier) => sum + (tier.value / total) * 360, 0);
                    const endAngle = startAngle + percentage * 3.6;
                    
                    const startAngleRad = (startAngle - 90) * Math.PI / 180;
                    const endAngleRad = (endAngle - 90) * Math.PI / 180;
                    
                    const x1 = 50 + 40 * Math.cos(startAngleRad);
                    const y1 = 50 + 40 * Math.sin(startAngleRad);
                    const x2 = 50 + 40 * Math.cos(endAngleRad);
                    const y2 = 50 + 40 * Math.sin(endAngleRad);
                    
                    const largeArcFlag = percentage > 50 ? 1 : 0;
                    
                    const pathData = [
                      `M 50 50`,
                      `L ${x1} ${y1}`,
                      `A 40 40 0 ${largeArcFlag} 1 ${x2} ${y2}`,
                      `Z`
                    ].join(' ');
                    
                    return (
                      <path
                        key={index}
                        d={pathData}
                        fill={item.color}
                        stroke="white"
                        strokeWidth="0.5"
                      />
                    );
                  })}
                </svg>
              </div>
              <div className="pie-legend">
                {customerTierDistribution.map((item, index) => (
                  <div key={index} className="legend-item">
                    <div className="legend-color" style={{ backgroundColor: item.color }}></div>
                    <span className="legend-label">{item.label}</span>
                    <span className="legend-value">{item.percentage}%</span>
                    <span className={`legend-trend ${item.trend}`}>
                      {item.trend === 'up' ? '↗' : item.trend === 'down' ? '↘' : '→'} {item.change}%
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="pie-chart-container">
              <h3>채널별 매출 분포</h3>
              <div className="pie-chart">
                <div className="pie-center">
                  <div className="center-value">{formatCurrency(channelRevenueDistribution.reduce((sum, item) => sum + item.value, 0))}</div>
                  <div className="center-label">총 매출</div>
                </div>
                <svg className="pie-svg" viewBox="0 0 100 100">
                  {channelRevenueDistribution.map((item, index) => {
                    const total = channelRevenueDistribution.reduce((sum, channel) => sum + channel.value, 0);
                    const percentage = (item.value / total) * 100;
                    const startAngle = channelRevenueDistribution.slice(0, index).reduce((sum, channel) => sum + (channel.value / total) * 360, 0);
                    const endAngle = startAngle + percentage * 3.6;
                    
                    const startAngleRad = (startAngle - 90) * Math.PI / 180;
                    const endAngleRad = (endAngle - 90) * Math.PI / 180;
                    
                    const x1 = 50 + 40 * Math.cos(startAngleRad);
                    const y1 = 50 + 40 * Math.sin(startAngleRad);
                    const x2 = 50 + 40 * Math.cos(endAngleRad);
                    const y2 = 50 + 40 * Math.sin(endAngleRad);
                    
                    const largeArcFlag = percentage > 50 ? 1 : 0;
                    
                    const pathData = [
                      `M 50 50`,
                      `L ${x1} ${y1}`,
                      `A 40 40 0 ${largeArcFlag} 1 ${x2} ${y2}`,
                      `Z`
                    ].join(' ');
                    
                    return (
                      <path
                        key={index}
                        d={pathData}
                        fill={item.color}
                        stroke="white"
                        strokeWidth="0.5"
                      />
                    );
                  })}
                </svg>
              </div>
              <div className="pie-legend">
                {channelRevenueDistribution.map((item, index) => (
                  <div key={index} className="legend-item">
                    <div className="legend-color" style={{ backgroundColor: item.color }}></div>
                    <span className="legend-label">{item.label}</span>
                    <span className="legend-value">{item.percentage}%</span>
                    <span className={`legend-trend ${item.trend}`}>
                      {item.trend === 'up' ? '↗' : item.trend === 'down' ? '↘' : '→'} {item.change}%
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 막대 차트 섹션 */}
      {(selectedChart === 'all' || selectedChart === 'bar') && (
        <div className="bar-charts-section">
          <h2>분포도 막대 차트</h2>
          <div className="bar-charts-grid">
            <div className="bar-chart-container">
              <h3>연령대별 고객 분포</h3>
              <div className="bar-chart">
                {ageGroupDistribution.map((item, index) => (
                  <div key={index} className="bar-group">
                    <div 
                      className="bar-fill"
                      style={{ 
                        height: `${(item.value / Math.max(...ageGroupDistribution.map(age => age.value))) * 100}%`,
                        backgroundColor: item.color
                      }}
                    ></div>
                    <div className="bar-label">{item.label}</div>
                    <div className="bar-value">{formatNumber(item.value)}</div>
                    <div className="bar-percentage">{item.percentage}%</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bar-chart-container">
              <h3>지역별 고객 분포</h3>
              <div className="bar-chart">
                {regionalDistribution.map((item, index) => (
                  <div key={index} className="bar-group">
                    <div 
                      className="bar-fill"
                      style={{ 
                        height: `${(item.value / Math.max(...regionalDistribution.map(region => region.value))) * 100}%`,
                        backgroundColor: item.color
                      }}
                    ></div>
                    <div className="bar-label">{item.label}</div>
                    <div className="bar-value">{formatNumber(item.value)}</div>
                    <div className="bar-percentage">{item.percentage}%</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 히트맵 섹션 */}
      {(selectedChart === 'all' || selectedChart === 'heatmap') && (
        <div className="heatmap-section">
          <h2>히트맵 분석</h2>
          <div className="heatmap-container">
            <h3>월별 x 채널별 매출 히트맵</h3>
            <div className="heatmap">
              <div className="heatmap-header">
                <div className="header-cell"></div>
                {Array.from(new Set(heatmapData.map(item => item.y))).map(channel => (
                  <div key={channel} className="header-cell">{channel}</div>
                ))}
              </div>
              {Array.from(new Set(heatmapData.map(item => item.x))).map(month => (
                <div key={month} className="heatmap-row">
                  <div className="row-label">{month}</div>
                  {Array.from(new Set(heatmapData.map(item => item.y))).map(channel => {
                    const cellData = heatmapData.find(item => item.x === month && item.y === channel);
                    return (
                      <div 
                        key={channel}
                        className="heatmap-cell"
                        style={{ 
                          backgroundColor: cellData ? getHeatmapColor(cellData.intensity) : '#f8fafc'
                        }}
                        title={cellData ? `${month} ${channel}: ${formatCurrency(cellData.value)}` : ''}
                      >
                        {cellData && (
                          <div className="cell-content">
                            <div className="cell-value">{formatCurrency(cellData.value)}</div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
            <div className="heatmap-legend">
              <span>낮음</span>
              <div className="legend-gradient"></div>
              <span>높음</span>
            </div>
          </div>
        </div>
      )}

      {/* 산점도 섹션 */}
      {(selectedChart === 'all' || selectedChart === 'scatter') && (
        <div className="scatter-section">
          <h2>연령대별 고객-매출 상관관계 분석</h2>
          <div className="scatter-container">
            <div className="scatter-description">
              <h3>연령대별 고객-매출 상관관계</h3>
              <p className="chart-explanation">
                연령대별 고객 수와 매출의 관계를 분석합니다. 
                오른쪽 위로 갈수록 고객 수와 매출이 높은 연령대입니다.
              </p>
            </div>
            <div className="scatter-plot">
              {/* 격자 배경 */}
              <div className="scatter-grid">
                <div className="grid-lines-horizontal">
                  {[0, 25, 50, 75, 100].map((percent, index) => (
                    <div key={index} className="grid-line" style={{ bottom: `${percent}%` }}>
                      <span className="grid-label">
                        {Math.round((Math.max(...scatterData.map(p => p.y)) * percent) / 100).toLocaleString()}원
                      </span>
                    </div>
                  ))}
                </div>
                <div className="grid-lines-vertical">
                  {[0, 25, 50, 75, 100].map((percent, index) => (
                    <div key={index} className="grid-line" style={{ left: `${percent}%` }}>
                      <span className="grid-label">
                        {Math.round((Math.max(...scatterData.map(p => p.x)) * percent) / 100).toLocaleString()}명
                      </span>
                    </div>
                  ))}
                </div>
              </div>
              
              {/* 데이터 포인트 */}
              {scatterData.map((point, index) => (
                <div 
                  key={index}
                  className="scatter-point"
                  style={{ 
                    left: `${(point.x / Math.max(...scatterData.map(p => p.x))) * 75 + 12.5}%`,
                    bottom: `${(point.y / Math.max(...scatterData.map(p => p.y))) * 75 + 12.5}%`,
                    backgroundColor: point.color,
                    width: `${Math.min(point.size * 1.2, 60)}px`,
                    height: `${Math.min(point.size * 1.2, 60)}px`
                  }}
                  title={`${point.label}: 고객 ${formatNumber(point.x)}명, 매출 ${formatCurrency(point.y)}`}
                >
                  <div className="point-label">{point.label}</div>
                </div>
              ))}
            </div>
            <div className="scatter-axes">
              <div className="x-axis">
                <span>고객 수 (명)</span>
              </div>
              <div className="y-axis">
                <span>매출 (원)</span>
              </div>
            </div>
            <div className="scatter-legend">
              <div className="legend-title">연령대별 분석 결과:</div>
              <div className="legend-items">
                {scatterData.map((point, index) => (
                  <div key={index} className="legend-item">
                    <div 
                      className="legend-color" 
                      style={{ backgroundColor: point.color }}
                    ></div>
                    <span className="legend-label">{point.label}</span>
                    <span className="legend-detail">
                      {formatNumber(point.x)}명, {formatCurrency(point.y)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 박스플롯 섹션 */}
      {(selectedChart === 'all' || selectedChart === 'boxplot') && (
        <div className="boxplot-section">
          <h2>박스플롯 분석</h2>
          <div className="boxplot-container">
            <h3>채널별 주문액 분포 박스플롯</h3>
            <div className="boxplot">
              {boxPlotData.map((box, index) => (
                <div key={index} className="boxplot-group">
                  <div className="boxplot-box">
                    <div 
                      className="whisker"
                      style={{ 
                        height: `${((box.max - box.min) / Math.max(...boxPlotData.map(b => b.max - b.min))) * 200}px`
                      }}
                    ></div>
                    <div 
                      className="box"
                      style={{ 
                        height: `${((box.q3 - box.q1) / Math.max(...boxPlotData.map(b => b.q3 - b.q1))) * 100}px`,
                        bottom: `${((box.q1 - Math.min(...boxPlotData.map(b => b.min))) / Math.max(...boxPlotData.map(b => b.max - b.min))) * 200}px`
                      }}
                    ></div>
                    <div 
                      className="median"
                      style={{ 
                        bottom: `${((box.median - Math.min(...boxPlotData.map(b => b.min))) / Math.max(...boxPlotData.map(b => b.max - b.min))) * 200}px`
                      }}
                    ></div>
                  </div>
                  <div className="boxplot-label">{box.category}</div>
                  <div className="boxplot-stats">
                    <div>Min: {formatCurrency(box.min)}</div>
                    <div>Q1: {formatCurrency(box.q1)}</div>
                    <div>Median: {formatCurrency(box.median)}</div>
                    <div>Q3: {formatCurrency(box.q3)}</div>
                    <div>Max: {formatCurrency(box.max)}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 샌키 다이어그램 섹션 */}
      {(selectedChart === 'all' || selectedChart === 'sankey') && (
        <div className="sankey-section">
          <h2>고객 유입 경로 분석</h2>
          <div className="sankey-container">
            <div className="sankey-description">
              <h3>고객 유입 경로 흐름도</h3>
              <p className="chart-explanation">
                고객이 어떤 경로를 통해 유입되어 최종 구매로 이어지는지 보여주는 흐름도입니다. 
                선의 굵기는 해당 경로의 고객 수를 나타냅니다.
              </p>
            </div>
            <div className="sankey-diagram">
              <div className="sankey-nodes">
                <div className="node-group source">
                  <div className="node" style={{ 
                    backgroundColor: '#3B82F6',
                    height: `${(nodeTotals['온라인 광고'] / Math.max(...Object.values(nodeTotals))) * 80 + 20}px`
                  }}>
                    <span className="node-label">온라인 광고</span>
                    <span className="node-value">{formatNumber(nodeTotals['온라인 광고'])}</span>
                  </div>
                  <div className="node" style={{ 
                    backgroundColor: '#10B981',
                    height: `${(nodeTotals['소셜미디어'] / Math.max(...Object.values(nodeTotals))) * 80 + 20}px`
                  }}>
                    <span className="node-label">소셜미디어</span>
                    <span className="node-value">{formatNumber(nodeTotals['소셜미디어'])}</span>
                  </div>
                  <div className="node" style={{ 
                    backgroundColor: '#F59E0B',
                    height: `${(nodeTotals['검색엔진'] / Math.max(...Object.values(nodeTotals))) * 80 + 20}px`
                  }}>
                    <span className="node-label">검색엔진</span>
                    <span className="node-value">{formatNumber(nodeTotals['검색엔진'])}</span>
                  </div>
                  <div className="node" style={{ 
                    backgroundColor: '#8B5CF6',
                    height: `${(nodeTotals['추천'] / Math.max(...Object.values(nodeTotals))) * 80 + 20}px`
                  }}>
                    <span className="node-label">추천</span>
                    <span className="node-value">{formatNumber(nodeTotals['추천'])}</span>
                  </div>
                </div>
                
                <div className="node-group middle">
                  <div className="node" style={{ 
                    backgroundColor: '#EF4444',
                    height: `${(nodeTotals['웹사이트'] / Math.max(...Object.values(nodeTotals))) * 80 + 20}px`
                  }}>
                    <span className="node-label">웹사이트</span>
                    <span className="node-value">{formatNumber(nodeTotals['웹사이트'])}</span>
                  </div>
                  <div className="node" style={{ 
                    backgroundColor: '#06B6D4',
                    height: `${(nodeTotals['모바일앱'] / Math.max(...Object.values(nodeTotals))) * 80 + 20}px`
                  }}>
                    <span className="node-label">모바일앱</span>
                    <span className="node-value">{formatNumber(nodeTotals['모바일앱'])}</span>
                  </div>
                  <div className="node" style={{ 
                    backgroundColor: '#84CC16',
                    height: `${(nodeTotals['직영점'] / Math.max(...Object.values(nodeTotals))) * 80 + 20}px`
                  }}>
                    <span className="node-label">직영점</span>
                    <span className="node-value">{formatNumber(nodeTotals['직영점'])}</span>
                  </div>
                  <div className="node" style={{ 
                    backgroundColor: '#F97316',
                    height: `${(nodeTotals['대리점'] / Math.max(...Object.values(nodeTotals))) * 80 + 20}px`
                  }}>
                    <span className="node-label">대리점</span>
                    <span className="node-value">{formatNumber(nodeTotals['대리점'])}</span>
                  </div>
                </div>
                
                <div className="node-group target">
                  <div className="node" style={{ 
                    backgroundColor: '#059669',
                    height: `${(nodeTotals['구매'] / Math.max(...Object.values(nodeTotals))) * 80 + 20}px`
                  }}>
                    <span className="node-label">구매</span>
                    <span className="node-value">{formatNumber(nodeTotals['구매'])}</span>
                  </div>
                </div>
              </div>
              
              <div className="sankey-flows">
                {sankeyData.map((flow, index) => (
                  <div 
                    key={index}
                    className="flow"
                    style={{ 
                      width: `${(flow.value / Math.max(...sankeyData.map(f => f.value))) * 8 + 2}px`,
                      backgroundColor: `rgba(59, 130, 246, ${0.4 + (flow.value / Math.max(...sankeyData.map(f => f.value))) * 0.6})`
                    }}
                    title={`${flow.source} → ${flow.target}: ${formatNumber(flow.value)}명`}
                  >
                    <span className="flow-value">{formatNumber(flow.value)}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="sankey-legend">
              <div className="legend-title">유입 경로별 분석:</div>
              <div className="legend-items">
                {sankeyData.slice(0, 7).map((flow, index) => (
                  <div key={index} className="legend-item">
                    <div className="legend-flow" style={{ 
                      width: `${(flow.value / Math.max(...sankeyData.map(f => f.value))) * 20 + 2}px`,
                      backgroundColor: `rgba(59, 130, 246, ${0.4 + (flow.value / Math.max(...sankeyData.map(f => f.value))) * 0.6})`
                    }}></div>
                    <span className="legend-label">{flow.source} → {flow.target}</span>
                    <span className="legend-value">{formatNumber(flow.value)}명</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdvancedDistributionCharts;
