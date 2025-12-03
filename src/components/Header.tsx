import React, { useState, useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '../store/store';
import { Search, User, LogOut, ChevronDown, List, Store, Building2 } from 'lucide-react';
import { logout } from '../store/authSlice';
import { addTab, setActiveTab } from '../store/tabSlice';
import { fetchUserMenus } from '../store/menuSlice';
import { useBrowserHistory } from '../hooks/useBrowserHistory';
import LogoutModal from './LogoutModal';
import { getAvatarImagePath, getUserInitials } from '../utils/avatarUtils';
import '../styles/Header.css';

interface HeaderProps {
  user: {
    userName: string;
    userEmail: string;
    roleName: string;
  };
  onSidebarToggle: () => void;
  sidebarCollapsed: boolean;
}

const Header: React.FC<HeaderProps> = ({ user, onSidebarToggle, sidebarCollapsed }) => {
  const dispatch = useDispatch<AppDispatch>();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const { addTabWithHistory } = useBrowserHistory();
  const [showRecentTabs, setShowRecentTabs] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLDivElement>(null);
  const recentTabsRef = useRef<HTMLDivElement>(null);
  
  // Redux 상태 가져오기
  const { menus } = useSelector((state: RootState) => state.menu);
  const { user: authUser } = useSelector((state: RootState) => state.auth);
  const { tabs, closedTabHistory } = useSelector((state: RootState) => state.tabs);
  
  // 메뉴 데이터 로드 (최초 1회만)
  useEffect(() => {
    // 이미 메뉴가 로드되어 있으면 다시 조회하지 않음
    if (menus && menus.length > 0) {
      return;
    }
    
    if (authUser?.userId) {
      dispatch(fetchUserMenus(authUser.userId));
    }
  }, [authUser?.userId, dispatch]); // menus 의존성 제거하여 무한 루프 방지

  // 외부 클릭 시 드롭다운 메뉴 및 검색 결과 닫기
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setShowUserMenu(false);
      }
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowSearchResults(false);
      }
      if (recentTabsRef.current && !recentTabsRef.current.contains(event.target as Node)) {
        setShowRecentTabs(false);
      }
    };

    if (showUserMenu || showSearchResults || showRecentTabs) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showUserMenu, showSearchResults, showRecentTabs]);

  // 로그아웃 모달 열기
  const handleLogoutClick = () => {
    setShowLogoutModal(true);
    setShowUserMenu(false); // 드롭다운 메뉴 닫기
  };

  // 로그아웃 처리
  const handleLogoutConfirm = () => {
    // 클라이언트 로그아웃 처리
    dispatch(logout());
  };

  // 홈 버튼 클릭 처리
  const handleHomeClick = () => {
    // 대시보드 탭 추가 및 활성화
    dispatch(addTab({
      id: 'dashboard',
      title: '대시보드',
      component: 'Dashboard',
      url: '/dashboard',
      closable: true
    }));
    
    // 대시보드 탭을 활성 탭으로 설정
    dispatch(setActiveTab('dashboard'));
  };

  // 사용자 아바타 이미지 경로 가져오기
  const getAvatarPath = () => {
    return getAvatarImagePath(authUser?.userGender);
  };

  // 메뉴 검색 함수
  const searchMenus = (term: string) => {
    if (!term.trim() || !menus) {
      setSearchResults([]);
      setShowSearchResults(false);
      return;
    }

    const results: any[] = [];
    const searchTerm = term.toLowerCase();

    // 모든 메뉴를 검색 (계층 구조 고려)
    const searchInMenus = (menuList: any[]) => {
      menuList.forEach(menu => {
        const menuName = menu.menu_name?.toLowerCase() || '';
        
        // 하위 메뉴가 있는지 확인
        const hasChildren = menuList.some(otherMenu => otherMenu.menu_parent_id === menu.menu_id);
        
        // 부모 메뉴 경로 구성
        let fullPath = menu.menu_name;
        let level = 0;
        
        if (menu.menu_parent_id) {
          const parentMenu = menuList.find(m => m.menu_id === menu.menu_parent_id);
          if (parentMenu) {
            fullPath = `${parentMenu.menu_name} > ${menu.menu_name}`;
            level = 1;
          }
        }
        
        if (menuName.includes(searchTerm)) {
          const resultItem = {
            ...menu,
            fullPath: fullPath,
            matchedText: menu.menu_name,
            level: level,
            hasChildren: hasChildren
          };
          
          results.push(resultItem);
        }
      });
    };

    searchInMenus(menus);
    console.log('🔍 검색 결과:', results);
    setSearchResults(results);
    setShowSearchResults(results.length > 0);
  };

  // 검색어 변경 처리
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchTerm(value);
    searchMenus(value);
  };

  // 검색 처리 (엔터키 또는 검색 버튼 클릭)
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    searchMenus(searchTerm);
  };

  // 메뉴 URL을 기반으로 컴포넌트명 매핑
  const getComponentFromUrl = (url: string) => {
    if (url.includes('ProductRegistration')) return 'ProductRegistration';
    if (url.includes('AgentRegistration')) return 'AgentRegistration';
    if (url.includes('/orders/OrderRegistration')) return 'OrderRegistration';
    if (url.includes('/dashboard')) return 'Dashboard';
    if (url.includes('CodeList')) return 'CodeList';
    if (url.includes('CodeHistory')) return 'CodeHistory';
    if (url.includes('/permission/users')) return 'UserManagement';
    if (url.includes('/permission/menus')) return 'MenuManagement';
    // 기본값
    return 'Dashboard';
  };

  // 검색 결과 메뉴 클릭 처리
  const handleSearchResultClick = (menu: any) => {
    // 최하위 메뉴가 아니면 클릭 불가
    if (menu.hasChildren) {
      return;
    }
    
    const componentName = getComponentFromUrl(menu.menu_url);
    const tabId = menu.menu_id.toString();
    
    // 이미 같은 메뉴의 탭이 열려있는지 확인
    const existingTab = tabs.find(tab => 
      tab.id === tabId || 
      (tab.component === componentName && tab.url === menu.menu_url)
    );
    
    if (existingTab) {
      // 기존 탭을 활성화
      dispatch(setActiveTab(existingTab.id));
    } else {
      // 새 탭 추가 및 활성화 (히스토리와 함께)
      addTabWithHistory({
        id: tabId,
        title: menu.menu_name,
        component: componentName,
        url: menu.menu_url,
        menuIcon: menu.menu_icon, // 메뉴 아이콘 정보 추가
        closable: true
      });
    }
    
    // 검색어와 결과 초기화
    setSearchTerm('');
    setSearchResults([]);
    setShowSearchResults(false);
  };

  // 검색어 하이라이트 함수
  const highlightText = (text: string, searchTerm: string) => {
    if (!searchTerm.trim()) return text;
    
    const regex = new RegExp(`(${searchTerm})`, 'gi');
    const parts = text.split(regex);
    
    return parts.map((part, index) => 
      regex.test(part) ? (
        <mark key={index} className="search-highlight">{part}</mark>
      ) : part
    );
  };

  // 최근 탭 클릭 처리
  const handleRecentTabClick = (tab: any, isClosedTab: boolean = false) => {
    console.log('🔍 탭 클릭:', { tab, isClosedTab });
    
    if (isClosedTab) {
      // 닫힌 탭을 클릭한 경우 새로운 탭으로 다시 열기
      console.log('🔍 닫힌 탭 재열기:', tab);
      dispatch(addTab({
        id: tab.id,
        title: tab.title,
        component: tab.component,
        url: tab.url,
        menuIcon: tab.menuIcon, // 메뉴 아이콘 정보 추가
        closable: true
      }));
      dispatch(setActiveTab(tab.id));
    } else {
      // 열린 탭을 클릭한 경우 기존 탭 활성화
      console.log('🔍 열린 탭 활성화:', tab);
      dispatch(setActiveTab(tab.id));
    }
    setShowRecentTabs(false);
  };

  // 최근 탭 목록 토글
  const toggleRecentTabs = () => {
    setShowRecentTabs(!showRecentTabs);
    setShowSearchResults(false); // 검색 결과 닫기
  };

  // 시간 포맷팅 함수
  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMinutes < 1) {
      return '방금 전';
    } else if (diffMinutes < 60) {
      return `${diffMinutes}분 전`;
    } else if (diffHours < 24) {
      return `${diffHours}시간 전`;
    } else if (diffDays < 7) {
      return `${diffDays}일 전`;
    } else {
      return date.toLocaleDateString('ko-KR', { 
        month: 'short', 
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    }
  };

  return (
    <header className="header">
      {/* 좌측 영역 - 회사 로고 + 햄버거 메뉴 */}
      <div className="header-left">
        {/* 회사 로고 (홈 버튼) */}
        <button 
          className="home-logo-btn"
          onClick={handleHomeClick}
          aria-label="홈으로 이동"
        >
          <img 
            src="/images/icons/HD_TEXT_LOGO_6.jpg" 
            alt="HD 로고" 
            width="120" 
            height="32"
            onError={(e) => {
              // 이미지 로드 실패 시 텍스트 로고 표시
              const target = e.target as HTMLImageElement;
              target.style.display = 'none';
              const fallback = target.nextElementSibling as HTMLElement;
              if (fallback) {
                fallback.style.display = 'flex';
              }
            }}
          />
          <div className="logo-fallback" style={{ display: 'none', alignItems: 'center', justifyContent: 'center', color: '#0369a1', fontWeight: 'bold', fontSize: '16px' }}>
            HD SYNC
          </div>
        </button>

        {/* 햄버거 메뉴 버튼 */}
        <button 
          className={`sidebar-toggle-btn ${sidebarCollapsed ? 'collapsed' : ''}`}
          onClick={onSidebarToggle}
          aria-label="사이드바 토글"
        >
          <div className="hamburger-icon">
            <div className="hamburger-line"></div>
            <div className="hamburger-line"></div>
            <div className="hamburger-line"></div>
          </div>
        </button>
      </div>

      {/* 중앙 영역 - 빈 공간 */}
      <div className="header-center">
      </div>

      {/* 우측 영역 - 탭관리 + 검색창 + 아바타 */}
      <div className="header-right">

        {/* 최근 탭 버튼 */}
        <div className="recent-tabs-container" ref={recentTabsRef}>
          <button 
            className="recent-tabs-btn"
            onClick={toggleRecentTabs}
            aria-label="최근 탭 목록"
          >
            <List size={16} />
            <span className="recent-tabs-count">{tabs.length}</span>
          </button>
          
          {/* 최근 탭 드롭다운 */}
          {showRecentTabs && (
            <div className="recent-tabs-dropdown">
              <div className="recent-tabs-header">
                <span>최근 메뉴 ({tabs.length + closedTabHistory.length}개)</span>
              </div>
              <div className="recent-tabs-list">
                {/* 열린 탭 */}
                {tabs.length > 0 && (
                  <>
                    <div className="recent-tabs-section-header">
                      <span>열린 탭 ({tabs.length}개)</span>
                    </div>
                    {tabs.map((tab) => (
                      <div
                        key={tab.id}
                        className="recent-tab-item active-tab"
                        onClick={() => handleRecentTabClick(tab, false)}
                      >
                        <div className="recent-tab-title">
                          {tab.title}
                        </div>
                        <div className="recent-tab-url">
                          {tab.url}
                        </div>
                      </div>
                    ))}
                  </>
                )}
                
                {/* 닫힌 탭 */}
                {closedTabHistory.length > 0 && (
                  <>
                    <div className="recent-tabs-section-header">
                      <span>최근 닫힌 탭 ({closedTabHistory.length}개)</span>
                    </div>
                    {closedTabHistory.map((tab) => (
                      <div
                        key={`closed-${tab.id}`}
                        className="recent-tab-item closed-tab"
                        onClick={() => handleRecentTabClick(tab, true)}
                      >
                        <div className="recent-tab-title">
                          {tab.title}
                        </div>
                        <div className="recent-tab-url">
                          {tab.url}
                        </div>
                        <div className="recent-tab-time">
                          {tab.openedAt && `열림: ${formatTime(tab.openedAt)}`}
                          {tab.closedAt && ` • 닫힘: ${formatTime(tab.closedAt)}`}
                        </div>
                      </div>
                    ))}
                  </>
                )}
                
                {/* 빈 상태 */}
                {tabs.length === 0 && closedTabHistory.length === 0 && (
                  <div className="recent-tabs-empty">
                    <span>열린 탭이 없습니다.</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* 검색창 */}
        <div className="search-container" ref={searchRef}>
          <form onSubmit={handleSearch} className="search-bar">
            <input
              type="text"
              placeholder="메뉴를 검색하세요..."
              value={searchTerm}
              onChange={handleSearchChange}
              aria-label="메뉴 검색"
            />
            <button type="submit" className="search-submit" aria-label="검색 실행">
              <Search size={16} />
            </button>
          </form>
        
        {/* 검색 결과 드롭다운 */}
        {showSearchResults && searchResults.length > 0 && (
          <div className="search-results">
            <div className="search-results-header">
              <span>검색 결과 ({searchResults.length}개)</span>
            </div>
            <div className="search-results-list">
              {searchResults.map((menu, index) => (
                <div
                  key={`${menu.menu_id}-${index}`}
                  className={`search-result-item ${menu.hasChildren ? 'non-clickable' : 'clickable'}`}
                  onClick={() => handleSearchResultClick(menu)}
                  style={{ paddingLeft: `${12 + (menu.level * 16)}px` }}
                >
                  <div className="search-result-title">
                    {highlightText(menu.menu_name, searchTerm)}
                    {menu.hasChildren && <span className="has-children-indicator"> (폴더)</span>}
                  </div>
                  <div className="search-result-path">
                    {menu.fullPath}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        
        {/* 검색 결과가 없을 때 */}
        {showSearchResults && searchResults.length === 0 && searchTerm.trim() && (
          <div className="search-results">
            <div className="search-no-results">
              <span>검색 결과가 없습니다.</span>
            </div>
          </div>
        )}
        </div>

        <div className="user-profile" ref={userMenuRef}>
          <button 
            className={`user-menu-btn ${showUserMenu ? 'active' : ''}`}
            onClick={() => setShowUserMenu(!showUserMenu)}
            aria-label="사용자 메뉴"
          >
            <div className="user-avatar">
              <img 
                src={getAvatarPath()} 
                alt={user.userName}
                onError={(e) => {
                  // 이미지 로드 실패 시 초기화 표시
                  const target = e.target as HTMLImageElement;
                  target.style.display = 'none';
                  const fallback = target.nextElementSibling as HTMLElement;
                  if (fallback) {
                    fallback.style.display = 'flex';
                  }
                }}
              />
              <span className="avatar-fallback" style={{ display: 'none' }}>
                {getUserInitials(user.userName)}
              </span>
            </div>
            <span className="user-name">{user.userName}</span>
            <ChevronDown size={16} className={`dropdown-icon ${showUserMenu ? 'rotated' : ''}`} />
          </button>

          {showUserMenu && (
            <div className="user-dropdown">
              <div className="dropdown-header">
                <div className="dropdown-avatar">
                  <img 
                    src={getAvatarPath()} 
                    alt={user.userName}
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.style.display = 'none';
                      const fallback = target.nextElementSibling as HTMLElement;
                      if (fallback) {
                        fallback.style.display = 'flex';
                      }
                    }}
                  />
                  <span className="avatar-fallback" style={{ display: 'none' }}>
                    {getUserInitials(user.userName)}
                  </span>
                </div>
                <div className="dropdown-user-info">
                  <span className="dropdown-name">{user.userName}</span>
                  <span className="dropdown-email">{user.userEmail}</span>
                  <span className="dropdown-role">{user.roleName}</span>
                  {/* 매장명 또는 거래처명 표시 */}
                  {authUser?.storeName && (
                    <span className="dropdown-store">
                      <Store size={14} />
                      {authUser.storeName}
                    </span>
                  )}
                  {authUser?.agentName && (
                    <span className="dropdown-agent">
                      <Building2 size={14} />
                      {authUser.agentName}
                    </span>
                  )}
                </div>
              </div>
              
              <div className="dropdown-menu">
                <button className="dropdown-item">
                  <User size={16} />
                  <span>로그인 정보 변경</span>
                </button>
                <div className="dropdown-divider"></div>
                <button 
                  className="dropdown-item logout-item"
                  onClick={handleLogoutClick}
                >
                  <LogOut size={16} />
                  <span>로그아웃</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 오버레이 (메뉴 닫기용) */}
      {showUserMenu && (
        <div 
          className="header-overlay"
          onClick={() => {
            setShowUserMenu(false);
          }}
        />
      )}

      {/* 로그아웃 모달 */}
      <LogoutModal
        isOpen={showLogoutModal}
        onClose={() => setShowLogoutModal(false)}
        onConfirm={handleLogoutConfirm}
        userName={user.userName}
      />
    </header>
  );
};

export default Header;
