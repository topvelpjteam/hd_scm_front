import React, { useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { RootState, AppDispatch } from './store';
import { initializeAuth } from './store/authSlice';
import { setupBrowserEventListeners } from './utils/stateCleanup';
import { LoadingProvider, useGlobalLoading } from './contexts/LoadingContext';
import { setLoadingContext } from './services/apiClient';
import LoginPage from './components/LoginPage';
import MainLayout from './components/MainLayout';
import './App.css';

// 로딩 컨텍스트 설정을 위한 내부 컴포넌트
const AppContent: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const isAuthenticated = useSelector((state: RootState) => state.auth.isAuthenticated);
  const loadingContext = useGlobalLoading();

  // 컴포넌트 마운트 시 로그인 상태 초기화 및 브라우저 이벤트 설정
  useEffect(() => {
    dispatch(initializeAuth());
    
    // 브라우저 종료 시 상태 정리 이벤트 리스너 설정
    setupBrowserEventListeners();
    
    // API 클라이언트에 로딩 컨텍스트 설정
    setLoadingContext(loadingContext);
  }, [dispatch, loadingContext]);

  return (
    <div className="App">
      {isAuthenticated ? (
        <MainLayout />
      ) : (
        <LoginPage />
      )}
    </div>
  );
};

const App: React.FC = () => {
  return (
    <LoadingProvider>
      <AppContent />
    </LoadingProvider>
  );
};

export default App;
