import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '../store';
import Sidebar from './Sidebar';
import Header from './Header';
import TabContainer from './TabContainer';
import Footer from './Footer';
import '../styles/MainLayout.css';

const MainLayout: React.FC = () => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const user = useSelector((state: RootState) => state.auth.user);

  // 모바일 감지 및 반응형 처리
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
      if (window.innerWidth <= 768) {
        setSidebarCollapsed(true);
      }
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // 사이드바 토글
  const toggleSidebar = () => {
    setSidebarCollapsed(!sidebarCollapsed);
  };

  // 모바일에서 사이드바 닫기
  const closeSidebar = () => {
    if (isMobile) {
      setSidebarCollapsed(true);
    }
  };

  if (!user) {
    return <div>로그인이 필요합니다.</div>;
  }

  return (
    <div className="main-layout">
      {/* 사이드바 */}
      <Sidebar 
        collapsed={sidebarCollapsed}
        onToggle={toggleSidebar}
        onClose={closeSidebar}
        isMobile={isMobile}
      />
      
      {/* 메인 콘텐츠 영역 */}
      <div className={`main-content ${sidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
        {/* 헤더 */}
        <Header 
          user={{
            userName: user.userName,
            userEmail: user.userEmail,
            roleName: user.roleName
          }}
          onSidebarToggle={toggleSidebar}
          sidebarCollapsed={sidebarCollapsed}
        />
        
        {/* 탭 컨테이너 */}
        <TabContainer />
        
        {/* 하단 영역 (main_bottom) */}
        <Footer />
      </div>

    </div>
  );
};

export default MainLayout;
