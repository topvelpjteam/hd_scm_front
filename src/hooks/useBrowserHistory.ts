import { useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '../store/store';
import { addTab, setActiveTab, removeTab } from '../store/tabSlice';

/**
 * 브라우저 히스토리와 탭 상태를 동기화하는 훅
 */
export const useBrowserHistory = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { tabs, activeTabId } = useSelector((state: RootState) => state.tabs);
  const isInitialized = useRef(false);

  // 탭 상태를 URL에 반영
  const updateURL = (tabId: string | null) => {
    if (tabId) {
      const tab = tabs.find(t => t.id === tabId);
      if (tab) {
        const newUrl = `${window.location.pathname}#tab=${tabId}`;
        if (window.location.href !== newUrl) {
          window.history.pushState({ tabId }, '', newUrl);
        }
      }
    } else {
      // 활성 탭이 없으면 해시 제거
      const newUrl = window.location.pathname;
      if (window.location.href !== newUrl) {
        window.history.pushState({ tabId: null }, '', newUrl);
      }
    }
  };

  // URL에서 탭 ID 추출
  const getTabIdFromURL = (): string | null => {
    const hash = window.location.hash;
    const match = hash.match(/#tab=(.+)/);
    return match ? match[1] : null;
  };

  // 초기 로드 시 URL에서 탭 상태 복원
  useEffect(() => {
    if (!isInitialized.current) {
      const urlTabId = getTabIdFromURL();
      if (urlTabId) {
        // URL에 있는 탭이 현재 탭 목록에 있는지 확인
        const existingTab = tabs.find(tab => tab.id === urlTabId);
        if (existingTab) {
          dispatch(setActiveTab(urlTabId));
        }
      }
      isInitialized.current = true;
    }
  }, [dispatch, tabs]);

  // 활성 탭이 변경될 때 URL 업데이트
  useEffect(() => {
    if (isInitialized.current) {
      updateURL(activeTabId);
    }
  }, [activeTabId, tabs]);

  // 브라우저 뒤로가기/앞으로가기 처리
  useEffect(() => {
    const handlePopState = (event: PopStateEvent) => {
      const tabId = event.state?.tabId || getTabIdFromURL();
      
      if (tabId) {
        // 해당 탭이 존재하는지 확인
        const existingTab = tabs.find(tab => tab.id === tabId);
        if (existingTab) {
          dispatch(setActiveTab(tabId));
        } else {
          // 탭이 존재하지 않으면 대시보드로 이동
          dispatch(setActiveTab('dashboard'));
        }
      } else {
        // 탭 ID가 없으면 대시보드로 이동
        dispatch(setActiveTab('dashboard'));
      }
    };

    window.addEventListener('popstate', handlePopState);
    
    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, [dispatch, tabs]);

  // 탭 추가 시 히스토리 업데이트
  const addTabWithHistory = (tab: any) => {
    dispatch(addTab(tab));
    // URL 업데이트는 useEffect에서 자동으로 처리됨
  };

  // 탭 제거 시 히스토리 업데이트
  const removeTabWithHistory = (tabId: string) => {
    dispatch(removeTab(tabId));
    // URL 업데이트는 useEffect에서 자동으로 처리됨
  };

  return {
    addTabWithHistory,
    removeTabWithHistory,
    updateURL
  };
};
