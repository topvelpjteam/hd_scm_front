import { store } from '../store/store';
import { resetAllStates, clearAllData } from '../store/globalActions';

/**
 * 로그아웃 시 모든 상태를 초기화하는 함수
 */
export const clearAllAppState = () => {
  // Redux 상태 초기화
  store.dispatch(resetAllStates());
  
  // 로컬 스토리지 및 세션 스토리지 정리
  localStorage.clear();
  sessionStorage.clear();
  
  console.log('모든 애플리케이션 상태가 초기화되었습니다.');
};

/**
 * 브라우저 종료 시 데이터 정리 함수
 * 참고: sessionStorage는 브라우저 종료 시 자동으로 삭제되므로 별도 처리 불필요
 */
export const handleBrowserClose = () => {
  // Redux 상태 초기화
  store.dispatch(clearAllData());
  
  // 필요시 localStorage만 정리 (sessionStorage는 자동 삭제됨)
  localStorage.clear();
  
  console.log('브라우저 종료로 인한 데이터 정리가 완료되었습니다.');
};

/**
 * 브라우저 이벤트 리스너 설정
 */
export const setupBrowserEventListeners = () => {
  let isRefreshing = false;
  let isNavigating = false;
  
  // 브라우저 세션 관리를 위한 타임스탬프 기반 방식 (단순화)
  const updateSessionTimestamp = () => {
    // sessionStorage만 사용하여 브라우저 종료 시 자동 삭제되도록 함
    const now = Date.now();
    sessionStorage.setItem('last_activity', now.toString());
    sessionStorage.setItem('session_start', sessionStorage.getItem('session_start') || now.toString());
  };
  
  const checkSessionValidity = () => {
    // sessionStorage에만 사용자 정보를 저장하여 브라우저 종료 시 자동 삭제되도록 함
    const user = sessionStorage.getItem('user');
    
    // 사용자 정보가 없으면 세션 무효
    if (!user) {
      console.log('사용자 정보가 없음 - 세션 무효');
      return false;
    }
    
    // sessionStorage에 사용자 정보가 있으면 유효한 세션으로 간주
    console.log('sessionStorage에서 사용자 정보 확인됨 - 세션 유효');
    return true;
  };
  
  // 페이지 로드 시 세션 유효성 검사 (로그인 페이지 제외)
  if (window.location.pathname !== '/' && !checkSessionValidity()) {
    // 세션이 만료된 경우 로그인 페이지로 리다이렉트
    console.log('세션 유효성 검사 실패 - 로그인 페이지로 리다이렉트');
    // 모든 세션 데이터 정리
    sessionStorage.removeItem('user');
    sessionStorage.removeItem('last_activity');
    sessionStorage.removeItem('session_start');
    localStorage.removeItem('user');
    localStorage.removeItem('last_activity');
    localStorage.removeItem('session_start');
    store.dispatch(resetAllStates());
    window.location.href = '/';
    return;
  }
  
  // 세션 타임스탬프 업데이트
  updateSessionTimestamp();

  // 페이지 로드 시 새로고침 여부 확인
  const wasRefreshing = sessionStorage.getItem('is_refreshing') === 'true';
  const isNavigationRefresh = performance.navigation && performance.navigation.type === 1; // 새로고침
  
  if (wasRefreshing || isNavigationRefresh) {
    isRefreshing = true;
    // is_refreshing 플래그를 즉시 삭제하지 않고, 페이지 로드 완료 후 삭제
    setTimeout(() => {
      sessionStorage.removeItem('is_refreshing');
    }, 100);
    console.log('새로고침으로 인한 페이지 로드 - 상태 유지', { wasRefreshing, isNavigationRefresh });
  }

  // 새로고침 감지 (F5, Ctrl+R, Ctrl+Shift+R 등)
  window.addEventListener('keydown', (event) => {
    if (
      event.key === 'F5' || 
      (event.ctrlKey && event.key === 'r') ||
      (event.ctrlKey && event.key === 'R') ||
      (event.ctrlKey && event.shiftKey && event.key === 'R')
    ) {
      isRefreshing = true;
      // 새로고침 플래그를 세션 스토리지에 저장
      sessionStorage.setItem('is_refreshing', 'true');
      console.log('새로고침이 감지되었습니다. 상태를 유지합니다.');
    }
  });

  // 페이지 내 네비게이션 감지
  window.addEventListener('popstate', () => {
    isNavigating = true;
  });

  // 페이지 언로드 시 - 브라우저 종료 시 세션 삭제
  window.addEventListener('beforeunload', () => {
    // 브라우저 새로고침 버튼 클릭 감지 (추가적인 방법)
    if (performance.navigation && performance.navigation.type === 1) {
      isRefreshing = true;
      sessionStorage.setItem('is_refreshing', 'true');
      console.log('브라우저 새로고침 버튼 감지');
    }

    // 새로고침이나 페이지 내 네비게이션인 경우에만 세션 유지
    if (isRefreshing || isNavigating) {
      console.log('새로고침 또는 네비게이션으로 인한 언로드 - 상태 유지');
      // isRefreshing과 isNavigating을 리셋하지 않음 (페이지 로드 시 체크용)
      return;
    }

    // 그 외의 경우 (탭 종료, 브라우저 종료 등) 로그인 세션 삭제
    console.log('탭 종료 또는 브라우저 종료 감지 - 로그인 세션 삭제');
    
    // 브라우저를 닫으면 로그인 세션 삭제 (sessionStorage는 브라우저 종료 시 자동 삭제되지만 명시적으로 삭제)
    sessionStorage.removeItem('user');
    sessionStorage.removeItem('last_activity');
    sessionStorage.removeItem('session_start');
    // localStorage도 정리 (혹시 모를 경우를 대비)
    localStorage.removeItem('user');
    localStorage.removeItem('last_activity');
    localStorage.removeItem('session_start');
  });

  // 페이지 언로드 완료 시 (추가 보장)
  window.addEventListener('unload', () => {
    // 새로고침이 아닌 경우에만 세션 삭제
    if (!isRefreshing && !isNavigating) {
      console.log('페이지 언로드 완료 - 로그인 세션 삭제');
      sessionStorage.removeItem('user');
      sessionStorage.removeItem('last_activity');
      sessionStorage.removeItem('session_start');
      localStorage.removeItem('user');
      localStorage.removeItem('last_activity');
      localStorage.removeItem('session_start');
    }
  });

  // 페이지 숨김 시 (모바일에서 앱 전환 등) - 조건부 처리
  window.addEventListener('pagehide', (event) => {
    // 새로고침이 아닌 경우에만 처리
    if (!isRefreshing && event.persisted === false) {
      console.log('페이지 숨김 감지 - 로그인 세션 삭제');
      // 브라우저를 닫으면 로그인 세션 삭제
      sessionStorage.removeItem('user');
      sessionStorage.removeItem('last_activity');
      sessionStorage.removeItem('session_start');
      localStorage.removeItem('user');
      localStorage.removeItem('last_activity');
      localStorage.removeItem('session_start');
    }
  });

  // 페이지 표시 시 (새로고침 후 복원)
  window.addEventListener('pageshow', (event) => {
    if (event.persisted || isRefreshing) {
      console.log('페이지 복원 감지 - 상태 복원');
      // 새로고침 후 상태 리셋
      setTimeout(() => {
        isRefreshing = false;
        isNavigating = false;
      }, 100);
    }
  });

  // 페이지 가시성 변경 시
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') {
      // 페이지가 다시 보일 때 숨김 시간 확인
      const hiddenTime = sessionStorage.getItem('app_hidden_time');
      if (hiddenTime) {
        const timeDiff = Date.now() - parseInt(hiddenTime);
        // 30분 이상 숨겨져 있었다면 보안상 로그아웃 처리
        if (timeDiff > 30 * 60 * 1000) {
          console.log('장시간 비활성으로 인한 자동 로그아웃');
          clearAllAppState();
          window.location.href = '/';
        }
        sessionStorage.removeItem('app_hidden_time');
      }
    } else if (document.visibilityState === 'hidden') {
      // 페이지가 숨겨질 때 시간 기록
      sessionStorage.setItem('app_hidden_time', Date.now().toString());
      console.log('페이지가 숨겨졌습니다.');
    }
  });

  // localStorage 변경 감지 (다른 탭에서의 로그아웃 감지)
  window.addEventListener('storage', (event) => {
    if (event.key === 'user' && event.newValue === null) {
      // 다른 탭에서 로그아웃했을 때 현재 탭도 로그아웃 처리
      console.log('다른 탭에서 로그아웃이 감지되었습니다.');
      sessionStorage.removeItem('user');
      localStorage.removeItem('last_activity');
      localStorage.removeItem('session_start');
      // Redux 상태도 초기화
      store.dispatch(resetAllStates());
      window.location.href = '/';
    }
  });

  // 주기적으로 세션 타임스탬프 업데이트 (사용자 활동 감지)
  const activityEvents = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];
  let lastUpdateTime = Date.now();
  
  const handleUserActivity = () => {
    const now = Date.now();
    // 30초마다 한 번씩만 업데이트 (성능 최적화)
    if (now - lastUpdateTime > 30 * 1000) {
      updateSessionTimestamp();
      lastUpdateTime = now;
    }
  };

  // 사용자 활동 이벤트 리스너 등록
  activityEvents.forEach(event => {
    document.addEventListener(event, handleUserActivity, { passive: true });
  });

  // 주기적으로 세션 유효성 검사 (1분마다) - 주석처리
  // const sessionCheckInterval = setInterval(() => {
  //   if (!checkSessionValidity()) {
  //     clearInterval(sessionCheckInterval);
  //     sessionStorage.removeItem('user');
  //     store.dispatch(resetAllStates());
  //     window.location.href = '/';
  //   }
  // }, 1 * 60 * 1000); // 1분마다 체크
};

/**
 * 세션 타임아웃 처리
 */
export const handleSessionTimeout = () => {
  console.log('세션이 만료되었습니다.');
  clearAllAppState();
  
  // 로그인 페이지로 리다이렉트
  window.location.href = '/';
};
