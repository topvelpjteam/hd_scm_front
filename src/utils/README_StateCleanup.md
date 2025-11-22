# 상태 정리 기능 (State Cleanup)

## 개요
로그아웃 또는 브라우저 종료 시 모든 애플리케이션 상태를 안전하게 초기화하는 기능입니다.

## 주요 기능

### 1. 로그아웃 시 상태 초기화
- 사용자가 로그아웃 버튼을 클릭하거나 로그아웃 모달에서 확인할 때
- 모든 Redux 상태가 초기값으로 리셋됩니다
- localStorage와 sessionStorage의 모든 데이터가 삭제됩니다

### 2. 브라우저 종료 시 상태 정리
- 브라우저 창을 닫거나 탭을 닫을 때
- 다른 사이트로 이동할 때
- 모바일에서 앱을 완전히 종료할 때
- **새로고침 시에는 상태 유지** (F5, Ctrl+R 등)

### 3. 세션 타임아웃 처리
- 세션이 만료되었을 때 자동으로 상태를 정리하고 로그인 페이지로 리다이렉트

## 구현된 파일들

### 1. `src/store/globalActions.ts`
- 전역 상태 초기화를 위한 Redux 액션들
- `resetAllStates`: 로그아웃 시 사용
- `clearAllData`: 브라우저 종료 시 사용

### 2. `src/utils/stateCleanup.ts`
- 상태 정리를 위한 유틸리티 함수들
- `clearAllAppState()`: 로그아웃 시 모든 상태 초기화
- `handleBrowserClose()`: 브라우저 종료 시 데이터 정리
- `setupBrowserEventListeners()`: 브라우저 이벤트 리스너 설정
- `handleSessionTimeout()`: 세션 타임아웃 처리

### 3. 수정된 Redux 슬라이스들
- `authSlice.ts`: 인증 상태 초기화
- `tabSlice.ts`: 탭 상태 초기화
- `menuSlice.ts`: 메뉴 상태 초기화
- `codeListSlice.ts`: 코드 목록 상태 초기화
- `productRegistrationSlice.ts`: 상품 등록 상태 초기화
- `tabStateSlice.ts`: 탭별 상태 초기화

### 4. 수정된 컴포넌트들
- `MainApp.tsx`: 로그아웃 처리 시 상태 초기화 추가
- `LogoutModal.tsx`: 로그아웃 확인 시 상태 초기화 추가
- `App.tsx`: 앱 시작 시 브라우저 이벤트 리스너 설정

## 사용법

### 로그아웃 시 상태 초기화
```typescript
import { clearAllAppState } from '../utils/stateCleanup';

const handleLogout = () => {
  // 서버 로그아웃 처리 후
  clearAllAppState();
};
```

### 브라우저 이벤트 리스너 설정
```typescript
import { setupBrowserEventListeners } from '../utils/stateCleanup';

useEffect(() => {
  setupBrowserEventListeners();
}, []);
```

### 세션 타임아웃 처리
```typescript
import { handleSessionTimeout } from '../utils/stateCleanup';

// 세션 만료 감지 시
handleSessionTimeout();
```

## 보안 고려사항

1. **민감한 데이터 완전 삭제**: 로그아웃 시 localStorage와 sessionStorage의 모든 데이터를 완전히 삭제
2. **메모리 정리**: Redux 상태를 초기값으로 리셋하여 메모리에서 민감한 정보 제거
3. **브라우저 종료 감지**: 실제 브라우저 종료와 새로고침을 구분하여 적절한 처리
4. **새로고침 시 상태 유지**: 사용자 편의성을 위해 새로고침 시에는 로그인 상태 유지
5. **장시간 비활성 감지**: 30분 이상 비활성 시 자동 로그아웃으로 보안 강화

## 테스트 방법

1. **로그아웃 테스트**:
   - 로그인 후 로그아웃 버튼 클릭
   - 개발자 도구에서 localStorage/sessionStorage 확인
   - Redux DevTools에서 상태 확인

2. **브라우저 종료 테스트**:
   - 브라우저 탭 닫기 (상태 정리됨)
   - 다른 사이트로 이동 (상태 정리됨)
   - 콘솔에서 정리 메시지 확인

3. **새로고침 테스트**:
   - F5 키로 새로고침 (상태 유지됨)
   - Ctrl+R로 새로고침 (상태 유지됨)
   - 브라우저 새로고침 버튼 클릭 (상태 유지됨)
   - 로그인 상태가 유지되는지 확인

4. **모바일 테스트**:
   - 앱 전환 (pagehide 이벤트)
   - 백그라운드 전환 (visibilitychange 이벤트)
