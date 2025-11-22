import React, { useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { RootState, AppDispatch } from '../store/store';
import { logoutUser } from '../store/authSlice';
import { addTab, setActiveTab } from '../store/tabSlice';
import { fetchUserMenus } from '../store/menuSlice';
import { clearAllAppState, setupBrowserEventListeners } from '../utils/stateCleanup';
import { useBrowserHistory } from '../hooks/useBrowserHistory';
import Sidebar from './Sidebar';
import TabContainer from './TabContainer';
import { LogOut, User, Settings } from 'lucide-react';
import './MainApp.css';

const MainApp: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { user } = useSelector((state: RootState) => state.auth);
  const { tabs } = useSelector((state: RootState) => state.tabs);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  
  // 브라우저 히스토리와 탭 상태 동기화
  useBrowserHistory();

  // 로그아웃 처리
  const handleLogout = async () => {
    try {
      // 서버에 로그아웃 요청
      if (user?.sessionId) {
        await dispatch(logoutUser(user.sessionId));
      }
      
      // 모든 상태 초기화
      clearAllAppState();
      
      console.log('로그아웃이 완료되었습니다.');
    } catch (error) {
      console.error('로그아웃 처리 중 오류 발생:', error);
      
      // 오류가 발생해도 상태는 초기화
      clearAllAppState();
    }
  };

  // 사용자 정보가 없으면 로그인 페이지로 리다이렉트
  useEffect(() => {
    if (!user) {
      window.location.href = '/';
    }
  }, [user]);

  // 로그인 후 자동으로 대시보드 탭 생성 및 메뉴 데이터 로드
  useEffect(() => {
    if (user) {
      // 대시보드 탭이 이미 있는지 확인하고 없으면 생성
      const dashboardTab = tabs.find(tab => tab.id === 'dashboard');
      
      if (!dashboardTab) {
        dispatch(addTab({
          id: 'dashboard',
          title: '대시보드',
          component: 'Dashboard',
          url: '/dashboard',
          closable: true
        }));
        
        dispatch(setActiveTab('dashboard'));
      }


      // 사용자 메뉴 데이터 로드
      if (user.userId) {
        dispatch(fetchUserMenus(user.userId));
      }
    }
  }, [user, tabs, dispatch]);

  // 모바일 감지 및 브라우저 이벤트 리스너 설정
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    // 브라우저 종료 시 상태 정리 이벤트 리스너 설정
    setupBrowserEventListeners();
    
    return () => {
      window.removeEventListener('resize', checkMobile);
    };
  }, []);

  if (!user) {
    return null;
  }

  return (
    <div className="main-app">
      {/* 헤더 */}
      <header className="app-header">
        <div className="header-left">
          <h1 className="app-title">HD Sync</h1>
        </div>
        
        <div className="header-right">
          {/* 사용자 정보 */}
          <div className="user-info">
            <div className="user-avatar">
              <User size={20} />
            </div>
            <div className="user-details">
              <span className="user-name">{user.userName}</span>
              <span className="user-role">{user.roleName}</span>
            </div>
          </div>

          {/* 설정 버튼 */}
          <button className="header-button">
            <Settings size={20} />
          </button>

          {/* 로그아웃 버튼 */}
          <button className="header-button logout-button" onClick={handleLogout}>
            <LogOut size={20} />
            <span>로그아웃</span>
          </button>
        </div>
      </header>

      {/* 메인 컨텐츠 */}
      <div className="app-content">
        {/* 사이드바 */}
        <aside className="app-sidebar">
          <Sidebar 
            collapsed={sidebarCollapsed}
            onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
            onClose={() => setSidebarCollapsed(true)}
            isMobile={isMobile}
          />
        </aside>

        {/* 탭 컨테이너 */}
        <main className="app-main">
          <TabContainer />
        </main>
      </div>
    </div>
  );
};

export default MainApp;
