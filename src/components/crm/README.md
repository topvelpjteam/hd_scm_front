# CRM 대시보드 컴포넌트

이 폴더는 CRM 관련 대시보드 컴포넌트들을 포함하고 있습니다. 전문가 수준의 분석 도구부터 기본적인 CRM 기능까지 다양한 대시보드를 제공합니다.

## 컴포넌트 목록

### 🏢 기본 CRM 대시보드

#### 1. CRMDashboard (메인 대시보드)
- 모든 CRM 기능을 통합한 메인 대시보드
- 사이드바 네비게이션과 전체 개요 제공

#### 2. CustomerIntegrationDashboard
- 각 채널의 고객 유입 및 통합 현황
- 모바일 앱, 웹사이트, 직영점, 대리점별 분석

#### 3. CampaignAnalyticsDashboard
- 이메일, SMS, 전화, 푸시 알림 캠페인 성과
- 전환율, ROI, 매출 연결 분석

#### 4. CustomerLoyaltyDashboard
- 브론즈, 실버, 골드, 플래티넘 등급별 분석
- 포인트 활동 추이 및 충성도 프로그램 성과

#### 5. ReferralAnalyticsDashboard
- 소개인/소개받은고객 매출 분석
- 등급별 소개인 성과 랭킹 및 수수료 현황

#### 6. AgentCallAnalyticsDashboard
- 상담원별 콜 빈도와 매출 연결 KPI
- 시간대별 콜 분포 및 콜 품질 지표

#### 7. DemographicAnalyticsDashboard
- 계절별, 연령별, 성별 매출 분석
- 월별 인구통계 추이 및 성별/연령대별 분포

#### 8. ChannelAnalyticsDashboard
- 직영점, 대리점, 쇼핑몰 등 채널별 매출 분석
- 채널별 성과 비교 및 매출 분포

### 🚀  분석 대시보드

#### 9. AdvancedGrowthAnalyticsDashboard
- **기간별, 채널별, 연도별, 연령, 성별, 지역별 매출 성장율 심층 분석**
- 신뢰도 기반 예측 모델
- 성장률 분포 히스토그램
- 성장률 상관관계 매트릭스
- 지역별 성장 지도 시각화

#### 10. AdvancedDistributionCharts
- **다차원 데이터 분포 분석 및 시각화**
- 파이 차트 (고객 등급별, 채널별 분포)
- 막대 차트 (연령대별, 지역별 분포)
- 히트맵 (월별 x 채널별 매출)
- 산점도 (고객 수 vs 매출)
- 박스플롯 (채널별 주문액 분포)
- 샌키 다이어그램 (고객 유입 경로)

#### 11. ProfessionalAnalyticsDashboard
- **전문가 수준의 종합 분석 대시보드**
- 핵심 성과 지표 (KPI) 모니터링
- 머신러닝 기반 예측 모델
- 이상 탐지 및 알림 시스템
- 업계 벤치마킹 분석
- 실시간 모니터링 시스템
- 임원진/운영진/분석가 뷰 모드

## 🎯 주요 기능

### 기본 CRM 기능
- **다양한 차트와 그래프**: 막대차트, 파이차트, 진행바, 라인차트 등
- **일관성 있는 데이터**: 모든 컴포넌트에서 동일한 숫자 체계 사용
- **반응형 디자인**: 모바일, 태블릿, 데스크톱 지원
- **모던 UI/UX**: 카드 기반 레이아웃과 그라데이션 효과
- **인터랙티브 요소**: 호버 효과, 클릭 상호작용, 새로고침 기능

###  분석 기능
- **AI 기반 예측**: 머신러닝 모델을 통한 매출, 이탈, 수요 예측
- **실시간 이상 탐지**: 비정상적인 패턴 자동 감지 및 알림
- **벤치마킹**: 업계 평균 대비 성과 비교
- **다차원 시각화**: 히트맵, 산점도, 박스플롯, 샌키 다이어그램
- **성장률 분석**: 기간별, 채널별, 지역별, 인구통계별 성장 추이
- **분포도 분석**: 고객, 매출, 채널별 분포 패턴 분석

## 📊 사용 방법

### 기본 사용법
```tsx
import { CRMDashboard } from './components/crm';

function App() {
  return <CRMDashboard />;
}
```

###  분석 대시보드 사용법
```tsx
import { 
  AdvancedGrowthAnalyticsDashboard,
  AdvancedDistributionCharts,
  ProfessionalAnalyticsDashboard 
} from './components/crm';

function App() {
  return (
    <div>
      {/* 성장률 분석 */}
      <AdvancedGrowthAnalyticsDashboard />
      
      {/* 분포도 차트 */}
      <AdvancedDistributionCharts />
      
      {/* 전문가 분석 */}
      <ProfessionalAnalyticsDashboard />
    </div>
  );
}
```

### 개별 컴포넌트 사용법
```tsx
import { 
  CustomerIntegrationDashboard,
  CampaignAnalyticsDashboard,
  CustomerLoyaltyDashboard 
} from './components/crm';

function MyDashboard() {
  return (
    <div>
      <CustomerIntegrationDashboard />
      <CampaignAnalyticsDashboard />
      <CustomerLoyaltyDashboard />
    </div>
  );
}
```

## 🎨 디자인 특징

### 시각적 요소
- **그라데이션 배경**: 전문적이고 모던한 느낌
- **글래스모피즘**: 반투명 효과와 블러 처리
- **애니메이션**: 부드러운 호버 효과와 전환
- **색상 코딩**: 데이터 유형별 일관된 색상 체계
- **아이콘**: Lucide React의 직관적인 아이콘 사용

### 사용자 경험
- **직관적 네비게이션**: 명확한 메뉴 구조
- **반응형 레이아웃**: 모든 디바이스에서 최적화
- **실시간 업데이트**: 자동 새로고침 기능
- **필터링**: 기간별, 지표별 데이터 필터
- **내보내기**: 분석 결과 다운로드 기능

## 🔧 기술 스택

- **React 18**: 최신 React 기능 활용
- **TypeScript**: 타입 안전성 보장
- **CSS Modules**: 스코프된 스타일링
- **Lucide React**: 일관된 아이콘 시스템
- **CSS Grid & Flexbox**: 반응형 레이아웃
- **CSS Custom Properties**: 테마 시스템
- **Backdrop Filter**: 모던 블러 효과

## 📈 데이터 구조

모든 컴포넌트는 일관된 데이터 구조를 사용합니다:

```typescript
interface MetricData {
  label: string;
  value: number;
  previousValue: number;
  change: number;
  changePercent: number;
  trend: 'up' | 'down' | 'stable';
  color: string;
}
```

## 🚀 성능 최적화

- **컴포넌트 지연 로딩**: 필요한 시점에 컴포넌트 로드
- **메모이제이션**: 불필요한 리렌더링 방지
- **가상화**: 대용량 데이터 효율적 렌더링
- **이미지 최적화**: WebP 포맷 및 지연 로딩
- **번들 분할**: 코드 스플리팅으로 초기 로딩 최적화

## 📱 반응형 지원

- **모바일**: 320px ~ 768px
- **태블릿**: 768px ~ 1024px  
- **데스크톱**: 1024px 이상
- **대형 화면**: 1440px 이상

## 🎯 사용 사례

### 비즈니스 임원진
- 전체 비즈니스 성과 모니터링
- 전략적 의사결정 지원
- 업계 벤치마킹 분석

### 마케팅 팀
- 캠페인 성과 분석
- 고객 세그먼트별 인사이트
- ROI 및 전환율 추적

### 운영 팀
- 실시간 운영 지표 모니터링
- 이상 상황 조기 감지
- 효율성 개선 포인트 식별

### 데이터 분석가
- 심층 통계 분석
- 예측 모델링
-  시각화 도구

이 CRM 대시보드 시스템은 모든 레벨의 사용자가 비즈니스 인사이트를 얻을 수 있도록 설계되었습니다.