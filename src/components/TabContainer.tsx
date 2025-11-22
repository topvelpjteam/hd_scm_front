import React, { useState, useEffect, useRef } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { RootState, AppDispatch } from '../store/store';
import { removeTab, setActiveTab, clearAllTabs } from '../store/tabSlice';
import { resetAllTabStates } from '../store/tabStateSlice';
import { X, List } from 'lucide-react';
import { getMenuIcon } from '../utils/menuUtils';
import TabContent from './TabContent';
import '../styles/TabContainer.css';

const TabContainer: React.FC = React.memo(() => {
  const dispatch = useDispatch<AppDispatch>();
  const { tabs, activeTabId } = useSelector((state: RootState) => state.tabs);
  const [showTabList, setShowTabList] = useState(false);
  const tabListRef = useRef<HTMLDivElement>(null);

  // 탭 컴포넌트에 따른 아이콘 매핑 (데이터베이스 아이콘 사용)
  const getTabIcon = (component: string, menuIcon?: string) => {
    // 디버깅 로그 추가
    console.log('🔍 [TabContainer] getTabIcon 호출:', { component, menuIcon });
    
    // 데이터베이스에서 가져온 아이콘이 있으면 사용
    if (menuIcon) {
      console.log('🔍 [TabContainer] menuIcon 사용:', menuIcon);
      const IconComponent = getMenuIcon(menuIcon);
      return <IconComponent size={12} />;
    }
    
    // 기본 컴포넌트별 아이콘 매핑 (fallback)
    switch (component) {
      case 'Dashboard': {
        const IconComponent = getMenuIcon('dashboard');
        return <IconComponent size={12} />;
      }
      case 'CodeList':
      case 'CodeHistory':
      case 'CodeCreate':
      case 'CodeEdit':
      case 'CodeCategory': {
        const IconComponent = getMenuIcon('code');
        return <IconComponent size={12} />;
      }
      case 'ProductManage':
      case 'PriceManage': {
        const IconComponent = getMenuIcon('package');
        return <IconComponent size={12} />;
      }
      case 'OrderList':
      case 'OrderCreate':
      case 'OrderDetail':
      case 'OrderListManagement': {
        const IconComponent = getMenuIcon('shopping-cart');
        return <IconComponent size={12} />;
      }
      case 'OrderOutStatus': {
        const IconComponent = getMenuIcon('truck');
        return <IconComponent size={12} />;
      }
      case 'CustomerList':
      case 'CustomerDetail': {
        const IconComponent = getMenuIcon('users');
        return <IconComponent size={12} />;
      }
      case 'SystemConfig':
      case 'UserManage': {
        const IconComponent = getMenuIcon('settings');
        return <IconComponent size={12} />;
      }
      case 'MenuManagement': {
        const IconComponent = getMenuIcon('list');
        return <IconComponent size={12} />;
      }
      case 'ReportSales':
      case 'ReportInventory': {
        const IconComponent = getMenuIcon('bar-chart-3');
        return <IconComponent size={12} />;
      }
      case 'NoticeList':
      case 'NoticeDetail': {
        const IconComponent = getMenuIcon('bell');
        return <IconComponent size={12} />;
      }
      case 'ScheduleManage': {
        const IconComponent = getMenuIcon('calendar');
        return <IconComponent size={12} />;
      }
      default: {
        const IconComponent = getMenuIcon('file-text');
        return <IconComponent size={12} />;
      }
    }
  };

  // 전체 탭 닫기
  const handleCloseAllTabs = () => {
    // 모든 탭 상태 초기화
    dispatch(resetAllTabStates());
    dispatch(clearAllTabs());
  };

  // 탭 닫기
  const handleCloseTab = (tabId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    
    // 탭 상태 초기화 (resetTabState는 tabStateSlice에서 import 필요)
    dispatch(resetAllTabStates());
    
    dispatch(removeTab(tabId));
  };

  // 탭 클릭
  const handleTabClick = (tabId: string) => {
    dispatch(setActiveTab(tabId));
  };

  // 탭 리스트 팝업 토글
  const toggleTabList = () => {
    setShowTabList(!showTabList);
  };

  // 탭 리스트에서 탭 선택
  const selectTabFromList = (tabId: string) => {
    dispatch(setActiveTab(tabId));
    setShowTabList(false);
  };

  // 팝업 외부 클릭 시 닫기
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (tabListRef.current && !tabListRef.current.contains(event.target as Node)) {
        setShowTabList(false);
      }
    };

    if (showTabList) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showTabList]);

  return (
    <div className="tab-container">
      {/* 탭 헤더 */}
      <div className="tab-header">
        {tabs.map((tab) => (
          <div
            key={tab.id}
            className={`tab-item ${activeTabId === tab.id ? 'active' : ''}`}
            onClick={() => handleTabClick(tab.id)}
          >
            <div className="tab-icon">
              {getTabIcon(tab.component, tab.menuIcon)}
            </div>
            <span className="tab-title">{tab.title}</span>
                         {tab.closable && (
               <button
                 className="tab-close-btn"
                 onClick={(e) => handleCloseTab(tab.id, e)}
                 title="탭 닫기"
               >
                 <img 
                   src="/images/icons/close-bk2.png" 
                   alt="닫기" 
                   className="close-icon"
                   onError={(e) => {
                     // 이미지 로드 실패 시 X 아이콘으로 대체
                     const target = e.target as HTMLImageElement;
                     target.style.display = 'none';
                     const fallback = document.createElement('span');
                     fallback.textContent = '×';
                     fallback.style.cssText = 'font-size: 14px; font-weight: bold; color: #374151;';
                     target.parentNode?.appendChild(fallback);
                   }}
                 />
               </button>
             )}
          </div>
        ))}
        
        {/* 탭 리스트 버튼 */}
        <div className="tab-list-container" ref={tabListRef}>
          <button 
            className="tab-list-btn" 
            onClick={toggleTabList} 
            title="탭 목록"
          >
            <List size={16} />
          </button>
          
          {/* 탭 리스트 팝업 */}
          {showTabList && (
            <div className="tab-list-popup">
              <div className="tab-list-header">
                <h3>탭 목록</h3>
                <button 
                  className="tab-list-close"
                  onClick={() => setShowTabList(false)}
                >
                  <X size={16} />
                </button>
              </div>
              <div className="tab-list-content">
                {tabs.map((tab) => (
                  <div
                    key={tab.id}
                    className={`tab-list-item ${activeTabId === tab.id ? 'active' : ''}`}
                    onClick={() => selectTabFromList(tab.id)}
                  >
                    <div className="tab-list-icon">
                      {getTabIcon(tab.component, tab.menuIcon)}
                    </div>
                    <span className="tab-list-title">{tab.title}</span>
                    {tab.closable && (
                       <button
                         className="tab-list-close-btn"
                         onClick={(e) => {
                           e.stopPropagation();
                           handleCloseTab(tab.id, e);
                         }}
                         title="탭 닫기"
                       >
                         <img 
                           src="/images/icons/close-bk2.png" 
                           alt="닫기" 
                           className="close-icon"
                           onError={(e) => {
                             // 이미지 로드 실패 시 X 아이콘으로 대체
                             const target = e.target as HTMLImageElement;
                             target.style.display = 'none';
                             const fallback = document.createElement('span');
                             fallback.textContent = '×';
                             fallback.style.cssText = 'font-size: 14px; font-weight: bold; color: #374151;';
                             target.parentNode?.appendChild(fallback);
                           }}
                         />
                       </button>
                     )}
                  </div>
                ))}
              </div>
              {tabs.length > 0 && (
                <div className="tab-list-footer">
                  <button 
                    className="close-all-tabs-btn"
                    onClick={() => {
                      handleCloseAllTabs();
                      setShowTabList(false);
                    }}
                  >
                    <X size={16} />
                    <span>전체 닫기</span>
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* 탭 콘텐츠 */}
      <div className="tab-content">
        {activeTabId ? (
          <TabContent tabId={activeTabId} />
        ) : (
          <div className="no-tab-selected">
            탭을 선택하거나 새 탭을 생성하세요.
          </div>
        )}
      </div>
    </div>
  );
});

export default TabContainer;
