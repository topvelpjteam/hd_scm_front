# 자동 로딩 API 클라이언트 사용 가이드

## 개요
모든 API 요청에 자동으로 로딩 상태를 표시하는 시스템입니다. 개발자가 매번 수동으로 로딩을 추가할 필요 없이, API 호출 시 자동으로 로딩이 표시됩니다.

## 주요 특징

### 1. **지연 로딩 관리 (2초 지연)**
- API 요청이 2초 이상 걸릴 때만 로딩 표시
- 짧은 요청에서는 깜빡거리지 않아 부드러운 UX 제공
- 동시 요청 수를 추적하여 중복 로딩 방지
- 요청 완료 시 자동으로 로딩 종료

### 2. **커스텀 로딩 메시지**
- 각 API 호출마다 다른 로딩 메시지 설정 가능
- 기본 메시지: "데이터를 불러오는 중..."

### 3. **로딩 건너뛰기 옵션**
- 특정 요청에서 로딩을 표시하지 않을 수 있음
- `skipLoading: true` 옵션 사용

## 사용 방법

### 기본 사용법

```typescript
import { apiClient } from './services/apiClient';

// GET 요청 (자동 로딩)
const data = await apiClient.getJson<UserData>('/api/users');

// POST 요청 (커스텀 로딩 메시지)
const result = await apiClient.postJson<CreateResult>(
  '/api/users', 
  userData,
  { loadingMessage: '사용자를 생성하는 중...' }
);

// 로딩 건너뛰기
const config = await apiClient.getJson<Config>(
  '/api/config',
  { skipLoading: true }
);
```

### 기존 fetch 코드를 apiClient로 변경

**변경 전:**
```typescript
const response = await fetch('/api/orders', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(orderData)
});
const data = await response.json();
```

**변경 후:**
```typescript
const data = await apiClient.postJson('/api/orders', orderData, {
  loadingMessage: '발주를 저장하는 중...'
});
```

## 서비스별 적용 예시

### OrderService
```typescript
// 이전발주정보 조회
export const getPreviousOrders = async (params: PreviousOrderSearchParams) => {
  const data = await apiClient.postJson<PreviousOrderResponse>(
    `${API_BASE_URL}/orders/previous`, 
    params,
    { loadingMessage: '이전발주정보를 조회하는 중...' }
  );
  return data;
};

// 발주 상세 조회
export const getOrderDetails = async (orderId: string) => {
  const data = await apiClient.getJson(
    `${API_BASE_URL}/orders/${orderId}/details`,
    { loadingMessage: '발주 상세 정보를 불러오는 중...' }
  );
  return data;
};
```

### AgentService
```typescript
// 거래처 검색
async searchAgents(searchCondition: SearchCondition): Promise<AgentData[]> {
  const data = await apiClient.postJson<AgentData[]>(
    `${this.baseUrl}/search`,
    searchCondition,
    { loadingMessage: '거래처를 검색하는 중...' }
  );
  return data;
}
```

### CommonCodeService
```typescript
// 상품구분 조회
async getGoodsGbn(): Promise<CommonCodeOption[]> {
  const data = await apiClient.getJson<any[]>(
    `${this.baseUrl}/goods-gbn`,
    { loadingMessage: '상품구분을 불러오는 중...' }
  );
  return data;
}
```

## 컴포넌트에서 사용

### 기존 방식 (수동 로딩)
```typescript
const [isLoading, setIsLoading] = useState(false);

const handleSearch = async () => {
  setIsLoading(true);
  try {
    const data = await getPreviousOrders(params);
    // 처리 로직
  } finally {
    setIsLoading(false);
  }
};
```

### 새로운 방식 (자동 로딩)
```typescript
const handleSearch = async () => {
  // 로딩이 자동으로 표시됨
  const data = await getPreviousOrders(params);
  // 처리 로직
};
```

## 장점

### 1. **개발 효율성**
- 매번 로딩 상태를 수동으로 관리할 필요 없음
- 코드 중복 제거
- 일관된 사용자 경험

### 2. **시스템 리소스 최적화**
- 2초 지연으로 불필요한 로딩 표시 방지
- 동시 요청 수 추적으로 중복 로딩 방지
- 메모리 효율적인 로딩 관리
- 자동 정리 메커니즘

### 3. **사용자 경험 개선**
- 짧은 요청에서는 깜빡거리지 않음
- 긴 요청에서만 로딩 표시로 집중도 향상
- 부드럽고 자연스러운 인터랙션

### 4. **유지보수성**
- 중앙화된 로딩 관리
- 일관된 로딩 UI
- 쉬운 디버깅

## 설정

### App.tsx에서 초기화
```typescript
import { LoadingProvider, useGlobalLoading } from './contexts/LoadingContext';
import { setLoadingContext } from './services/apiClient';

const AppContent: React.FC = () => {
  const loadingContext = useGlobalLoading();

  useEffect(() => {
    // API 클라이언트에 로딩 컨텍스트 설정
    setLoadingContext(loadingContext);
  }, [loadingContext]);

  return <div>...</div>;
};

const App: React.FC = () => {
  return (
    <LoadingProvider>
      <AppContent />
    </LoadingProvider>
  );
};
```

## 주의사항

1. **로딩 컨텍스트 설정**: 앱 초기화 시 반드시 `setLoadingContext` 호출
2. **2초 지연**: 2초 미만의 요청에서는 로딩이 표시되지 않음
3. **동시 요청**: 여러 API가 동시에 호출되어도 로딩은 하나만 표시
4. **에러 처리**: API 에러 시에도 로딩이 자동으로 종료됨
5. **성능**: 로딩 카운터와 타이머로 인한 최소한의 오버헤드만 발생

## 동작 방식

### 2초 지연 로딩
1. **API 요청 시작**: 요청 카운터 증가, 2초 타이머 시작
2. **2초 미만 완료**: 타이머 취소, 로딩 표시 안함
3. **2초 이상 소요**: 타이머 실행, 로딩 표시
4. **요청 완료**: 로딩 종료, 카운터 감소

이제 2초 이상 걸리는 API 호출에서만 로딩이 표시되어 더 부드러운 사용자 경험을 제공합니다!
