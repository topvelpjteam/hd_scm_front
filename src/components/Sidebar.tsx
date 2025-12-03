import React, { useState, useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { 
  ChevronRight,
  ChevronLeft
} from 'lucide-react';
import { setActiveTab } from '../store/tabSlice';
import { fetchUserMenus } from '../store/menuSlice';
import { getMenuIcon, buildMenuHierarchy } from '../utils/menuUtils';
//import { MENU_IDS } from '../constants/menuIds';
import { RootState, AppDispatch } from '../store/store';
import { useAllMenuPermissions } from '../hooks/usePermissions';
import { useBrowserHistory } from '../hooks/useBrowserHistory';
import '../styles/Sidebar.css';

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
  onClose: () => void;
  isMobile: boolean;
}

// 메뉴 아이템 컴포넌트 (Sidebar 외부에 정의하여 재생성 방지)
const MenuItemWithPermission = React.memo<{
  item: any;
  level: number;
  onMenuClick: (itemId: string, component: string, menuName: string, menuUrl?: string, menuIcon?: string) => void;
  onToggle: (itemId: string) => void;
  expandedItems: string[];
  collapsed: boolean;
  isMobile: boolean;
  allPermissions: any[];
  permissionsLoading: boolean;
  activeMenuIds: string[];
}>(({ item, level, onMenuClick, onToggle, expandedItems, collapsed, isMobile, allPermissions, permissionsLoading, activeMenuIds }) => {
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const itemId = item.id || item.menu_id;
  const menuName = item.name || item.menu_name;
  
  // 권한 체크 (allPermissions에서 해당 메뉴 권한 찾기)
  const menuPermission = allPermissions.find(p => p.menuId === item.menu_id);
  const canAccess = menuPermission && (
    menuPermission.permissions.viewPermission === 'Y' ||
    menuPermission.permissions.savePermission === 'Y' ||
    menuPermission.permissions.deletePermission === 'Y' ||
    menuPermission.permissions.exportPermission === 'Y' ||
    menuPermission.permissions.personalInfoPermission === 'Y'
  );

  // 권한 로딩 중이면 로딩 표시
  if (permissionsLoading) {
    return null;
  }

  // 권한이 없으면 메뉴를 렌더링하지 않음
  if (!canAccess) {
    return null;
  }

  const hasChildren = item.children && item.children.length > 0;
  const isExpanded = expandedItems.includes(itemId);
  
  // 현재 메뉴 또는 하위 메뉴가 활성화되어 있는지 확인
  const isActive = activeMenuIds.includes(String(itemId));
  const hasActiveChild = hasChildren && item.children.some((child: any) => 
    activeMenuIds.includes(String(child.id || child.menu_id)) ||
    (child.children && child.children.some((grandChild: any) => 
      activeMenuIds.includes(String(grandChild.id || grandChild.menu_id))
    ))
  );

  // 드롭다운 외부 클릭 시 닫기
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };
    if (showDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showDropdown]);

  // 접힘 상태에서 드롭다운 메뉴 렌더링
  const renderDropdownMenu = (items: any[], parentLevel: number = 0): React.ReactNode => {
    return items.map((child: any) => {
      const childId = child.id || child.menu_id;
      const childName = child.name || child.menu_name;
      const childHasChildren = child.children && child.children.length > 0;
      const childPermission = allPermissions.find(p => p.menuId === child.menu_id);
      const childCanAccess = childPermission && (
        childPermission.permissions.viewPermission === 'Y' ||
        childPermission.permissions.savePermission === 'Y' ||
        childPermission.permissions.deletePermission === 'Y' ||
        childPermission.permissions.exportPermission === 'Y' ||
        childPermission.permissions.personalInfoPermission === 'Y'
      );

      if (!childCanAccess) return null;

      return (
        <div key={childId} className="dropdown-item-wrapper">
          <div 
            className={`dropdown-item level-${parentLevel} ${activeMenuIds.includes(String(childId)) ? 'active' : ''}`}
            onClick={(e) => {
              e.stopPropagation();
              if (!childHasChildren) {
                const componentName = child.menu_name.replace(/\s+/g, '');
                onMenuClick(child.menu_id.toString(), componentName, child.menu_name, child.menu_url, child.menu_icon);
                setShowDropdown(false);
              }
            }}
          >
            {React.createElement(getMenuIcon(child.menu_icon), { className: "dropdown-icon", size: 14 })}
            <span className="dropdown-name">{childName}</span>
            {childHasChildren && <ChevronRight size={12} className="dropdown-arrow" />}
          </div>
          {childHasChildren && (
            <div className="dropdown-submenu">
              {renderDropdownMenu(child.children, parentLevel + 1)}
            </div>
          )}
        </div>
      );
    });
  };

  return (
    <div className="menu-item-wrapper" ref={dropdownRef}>
      <div
        className={`menu-item level-${level} ${isExpanded ? 'expanded' : ''} ${hasChildren ? 'has-children' : ''} ${isActive || hasActiveChild ? 'menu-active' : ''}`}
        onClick={() => {
          if (collapsed && hasChildren) {
            // 접힘 상태에서는 드롭다운 토글
            setShowDropdown(!showDropdown);
          } else if (hasChildren) {
            onToggle(itemId);
          } else {
            const componentName = item.menu_name.replace(/\s+/g, '');
            onMenuClick(item.menu_id.toString(), componentName, item.menu_name, item.menu_url, item.menu_icon);
          }
        }}
      >
        <div className="menu-item-content">
          {React.createElement(getMenuIcon(item.menu_icon), { className: "menu-icon", size: 18 })}
          {!collapsed && <span className="menu-name">{menuName}</span>}
          {!collapsed && hasChildren && (
            <ChevronRight 
              className={`expand-icon ${isExpanded ? 'expanded' : ''}`} 
              size={16} 
            />
          )}
        </div>
      </div>

      {/* 접힘 상태에서 드롭다운 메뉴 */}
      {collapsed && hasChildren && showDropdown && (
        <div className="collapsed-dropdown">
          <div className="dropdown-header">{menuName}</div>
          <div className="dropdown-content">
            {renderDropdownMenu(item.children)}
          </div>
        </div>
      )}

      {/* 하위 메뉴 렌더링 (펼침 상태) */}
      {hasChildren && !collapsed && (
        <div className={`submenu ${isExpanded ? 'expanded' : 'collapsed'}`}>
          {item.children.map((child: any) => (
            <MenuItemWithPermission
              key={child.id || child.menu_id}
              item={child}
              level={level + 1}
              onMenuClick={onMenuClick}
              onToggle={onToggle}
              expandedItems={expandedItems}
              collapsed={collapsed}
              isMobile={isMobile}
              allPermissions={allPermissions}
              permissionsLoading={permissionsLoading}
              activeMenuIds={activeMenuIds}
            />
          ))}
        </div>
      )}
    </div>
  );
});

MenuItemWithPermission.displayName = 'MenuItemWithPermission';

const Sidebar: React.FC<SidebarProps> = ({ collapsed, onToggle, onClose, isMobile }) => {
  const dispatch = useDispatch<AppDispatch>();
  const [expandedItems, setExpandedItems] = useState<string[]>([]);
  const sidebarRef = useRef<HTMLDivElement>(null);
  const [, setScrollPosition] = useState<number>(0);
  const { addTabWithHistory } = useBrowserHistory();

  // Redux 상태 가져오기
  const { user } = useSelector((state: RootState) => state.auth);
  const { menus, loading } = useSelector((state: RootState) => state.menu);
  const { tabs, activeTabId } = useSelector((state: RootState) => state.tabs);

  // 모든 메뉴 권한 조회
  const { allPermissions, loading: permissionsLoading } = useAllMenuPermissions();

  // 현재 활성 탭의 메뉴 ID만 (가장 위에 떠있는 탭)
  const activeMenuIds = React.useMemo(() => {
    return activeTabId ? [activeTabId] : [];
  }, [activeTabId]);

  // 동적 높이 계산을 위한 상태
  const [sidebarHeight, setSidebarHeight] = useState<string>('calc(100vh - 64px)');

  // 뷰포트 크기와 푸터 높이를 고려한 동적 높이 계산
  useEffect(() => {
    const updateSidebarHeight = () => {
      const headerHeight = isMobile ? 56 : 64;
      
      // 사이드바 높이 계산 - 헤더 높이만 제외하고 전체 뷰포트 사용
      const height = `calc(100vh - ${headerHeight}px)`;
      
      setSidebarHeight(height);
      
      // CSS 변수 업데이트
      if (sidebarRef.current) {
        sidebarRef.current.style.setProperty('--sidebar-height', height);
        sidebarRef.current.style.setProperty('--header-height', `${headerHeight}px`);
      }
    };

    // 초기 계산
    updateSidebarHeight();

    // ResizeObserver로 뷰포트 크기 변화 감지
    const resizeObserver = new ResizeObserver(() => {
      updateSidebarHeight();
    });

    // MutationObserver로 DOM 변화 감지 (푸터 렌더링 등)
    const mutationObserver = new MutationObserver(() => {
      updateSidebarHeight();
    });

    // 관찰 시작
    resizeObserver.observe(document.body);
    mutationObserver.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['style', 'class']
    });

    // 이벤트 리스너
    window.addEventListener('resize', updateSidebarHeight);
    window.addEventListener('scroll', updateSidebarHeight);

    return () => {
      resizeObserver.disconnect();
      mutationObserver.disconnect();
      window.removeEventListener('resize', updateSidebarHeight);
      window.removeEventListener('scroll', updateSidebarHeight);
    };
  }, [isMobile]);

  // 사용자 메뉴 데이터 가져오기 (최초 1회만)
  useEffect(() => {
    // 이미 메뉴가 로드되어 있으면 다시 조회하지 않음
    if (menus && menus.length > 0) {
      console.log('메뉴가 이미 로드되어 있음. 재조회 생략:', menus.length, '개');
      return;
    }

    console.log('사용자 정보 확인:', user);
    if (user && user.userId !== undefined && user.userId !== null) {
      console.log('메뉴 데이터 최초 요청:', user.userId);
      dispatch(fetchUserMenus(user.userId));
    } else {
      console.log('사용자 정보가 없어서 메뉴 데이터를 요청하지 않음');
    }
  }, [dispatch, user?.userId]); // user 전체가 아닌 userId만 의존

  // 메뉴 데이터 처리 (권한 체크 포함)
  const processedMenus = React.useMemo(() => {
    if (!menus || menus.length === 0) {
      return [];
    }
    
    // 메뉴 계층 구조 구성 (한 번만 실행)
    const hierarchicalMenus = buildMenuHierarchy(menus);
    console.log('✅ 메뉴 계층 구조 생성:', hierarchicalMenus.length, '개');

    return hierarchicalMenus;
  }, [menus]); // user.roleLevel 의존성 제거

  // 샘플 메뉴 (맨 하단에 표시) - 주석처리
  /*
  const sampleMenu = {
    id: 'sample',
    name: '샘플',
    icon: Code,
    children: [
      {
        id: 'code-management',
        name: '코드관리',
        icon: Code,
        children: [
          { id: 'code-list', name: '코드 목록', component: 'CodeList' },
          { id: 'code-history', name: '코드 이력', component: 'CodeHistory' },
          { id: 'code-category', name: '코드 분류', component: 'CodeCategory' }
        ]
      },
      {
        id: 'order-management',
        name: '주문관리',
        icon: Code,
        children: [
          { id: 'order-list', name: '주문 목록', component: 'OrderList' },
          { id: 'order-status', name: '주문 상태', component: 'OrderStatus' },
          { id: 'order-history', name: '주문 이력', component: 'OrderHistory' }
        ]
      },
      {
        id: 'sales-info',
        name: '매장매출정보',
        icon: Code,
        children: [
          { id: 'sales-daily', name: '일별 매출', component: 'SalesDaily' },
          { id: 'sales-monthly', name: '월별 매출', component: 'SalesMonthly' },
          { id: 'sales-analysis', name: '매출 분석', component: 'SalesAnalysis' }
        ]
      },
      {
        id: 'inventory-info',
        name: '재고정보',
        icon: Code,
        children: [
          { id: 'inventory-list', name: '재고 목록', component: 'InventoryList' },
          { id: 'inventory-status', name: '재고 상태', component: 'InventoryStatus' },
          { id: 'inventory-alert', name: '재고 알림', component: 'InventoryAlert' }
        ]
      }
    ]
  };
  */

  // 전체 메뉴 아이템 (실제 메뉴만 사용)
  const menuItems = processedMenus;
  //console.log('최종 메뉴 아이템:', menuItems);

  // 메뉴 데이터가 로드되면 스크롤 위치 복원
  useEffect(() => {
    if (!loading && !permissionsLoading && menuItems.length > 0) {
      // 약간의 지연을 두고 스크롤 위치 복원
      setTimeout(() => {
        restoreScrollPosition();
      }, 100);
    }
  }, [loading, permissionsLoading, menuItems.length]);

  // 스크롤 이벤트 리스너 추가
  useEffect(() => {
    const sidebarElement = sidebarRef.current;
    if (!sidebarElement) return;

    const handleScroll = () => {
      const scrollTop = sidebarElement.scrollTop;
      setScrollPosition(scrollTop);
      localStorage.setItem('sidebar-scroll-position', scrollTop.toString());
    };

    sidebarElement.addEventListener('scroll', handleScroll, { passive: true });
    
    return () => {
      sidebarElement.removeEventListener('scroll', handleScroll);
    };
  }, []);

  // 메뉴 아이템 토글
  const toggleMenuItem = (itemId: string) => {
    setExpandedItems(prev => 
      prev.includes(itemId) 
        ? prev.filter(id => id !== itemId)
        : [...prev, itemId]
    );
  };

  // URL을 기반으로 컴포넌트명을 매핑하는 함수
  const getComponentFromUrl = (url: string): string => {
    const urlMappings: { [key: string]: string } = {
      '/products/ProductRegistration': 'ProductManage',
      '/products/ProductPriceRegistration': 'PriceManage',
      '/dashboard': 'Dashboard',
      '/orders/new': 'OrderCheck',
      '/orders/OrderRegistration': 'OrderRegistration',
      '/orders/order-list-management': 'OrderListManagement',
      '/orders/order-out-status': 'OrderOutStatus',
      '/orders/orderOutStatus': 'OrderOutStatus',
      '/orders/orderConfirm': 'OrderConfirm',
      '/orders/history': 'OrderHistory',
      '/orders/tracking': 'OrderStatus',      
      '/inventory/agentStock': 'AgentStock',
      '/in/store-inventory-management': 'StoreInventoryManagement',
      '/in/storeInventoryStatus': 'StoreInventoryStatus',
      '/reports/tradeStatus': 'TradeStatus',
      '/code/list': 'CodeList',
      '/code/history': 'CodeHistory',
      '/code/create': 'CodeCreate',
      '/code/edit': 'CodeEdit',
      '/code/category': 'CodeCategory',
      '/agent/AgentRegistration': 'AgentRegistration',
      '/store-management/customer-registration': 'CustRegistration',
      '/store-management/sales-registration': 'SalesRegistration',
      '/permission/users': 'UserManagement',
      '/permission/menus': 'MenuManagement'
    };
    
    return urlMappings[url] || 'WelcomeMessage';
  };

  // 스크롤 위치 저장 (localStorage 사용)
  const saveScrollPosition = () => {
    if (sidebarRef.current) {
      const scrollTop = sidebarRef.current.scrollTop;
      setScrollPosition(scrollTop);
      localStorage.setItem('sidebar-scroll-position', scrollTop.toString());
    }
  };

  // 스크롤 위치 복원 (localStorage 사용)
  const restoreScrollPosition = () => {
    const savedPosition = localStorage.getItem('sidebar-scroll-position');
    if (sidebarRef.current && savedPosition) {
      const position = parseInt(savedPosition, 10);
      sidebarRef.current.scrollTop = position;
      setScrollPosition(position);
    }
  };

  // 메뉴 클릭 처리
  const handleMenuClick = (itemId: string, component: string, menuName: string, menuUrl?: string, menuIcon?: string) => {
    // 스크롤 위치 저장
    saveScrollPosition();
    
    console.log('🔍 [Sidebar] 메뉴 클릭:', { menuName, itemId, component, menuUrl, menuIcon });
    
    // URL이 있으면 URL 기반으로 컴포넌트명 결정
    // 단, URL 매핑이 실패(기본값 'WelcomeMessage')하면 원래 component 값을 fallback으로 사용
    let finalComponent = menuUrl ? getComponentFromUrl(menuUrl) : component;
    if ((!finalComponent || finalComponent === 'WelcomeMessage') && component) {
      finalComponent = component;
    }
    const normalizedComponent = (() => {
      if (!finalComponent) return finalComponent;
      //const lower = finalComponent.toLowerCase();
      // if (
      //   finalComponent === 'AgentStock' ||
      //   lower.includes('agentstock') ||
      //   lower.includes('realtimeinventory') ||
      //   menuName.replace(/\s+/g, '').includes('실시간매장재고') ||
      //   itemId === String(MENU_IDS.REAL_TIME_INVENTORY)
      // ) {
      //   return 'AgentStock';
      // }
      // if (
      //   finalComponent === '출고현황' ||
      //   lower.includes('orderoutstatus')
      // ) {
      //   return 'OrderOutStatus';
      // }
      // if (
      //   finalComponent === 'StoreInventoryManagement' ||
      //   lower.includes('storeinventorymanagement') ||
      //   menuName.replace(/\s+/g, '').includes('입고관리')
      // ) {
      //   return 'StoreInventoryManagement';
      // }
      // if (
      //   finalComponent === 'StoreInventoryStatus' ||
      //   lower.includes('storeinventorystatus') ||
      //   menuName.replace(/\s+/g, '').includes('입고현황')
      // ) {
      //   return 'StoreInventoryStatus';
      // }
      // 거래 내역(Trade Status) 매핑 허용
      // if (
      //   finalComponent === 'TradeStatus' ||
      //   lower.includes('tradestatus') ||
      //   menuName.replace(/\s+/g, '').includes('거래내역') ||
      //   menuName.replace(/\s+/g, '').includes('거래 내역')
      // ) {
      //   return 'TradeStatus';
      // }
      return finalComponent;
    })();
    
    //console.log('최종 컴포넌트명:', finalComponent);
    //console.log('getComponentFromUrl 결과:', getComponentFromUrl(menuUrl || ''));
    
    // 기존 탭이 있는지 확인 (ID, 컴포넌트, URL 모두 체크)
    const existingTab = tabs.find(tab => 
      tab.id === itemId || 
      (tab.component === normalizedComponent && tab.url === menuUrl)
    );
    
    if (existingTab) {
      // 기존 탭이 있으면 해당 탭으로 이동
      //console.log('기존 탭으로 이동:', existingTab.title, 'ID:', existingTab.id);
      dispatch(setActiveTab(existingTab.id));
    } else {
      // 새 탭 추가 (히스토리와 함께)
      console.log('🔍 [Sidebar] 새 탭 추가:', { menuName, itemId, finalComponent, menuIcon });
      addTabWithHistory({
        id: itemId,
        title: menuName,
        component: normalizedComponent,
        url: menuUrl || `/${itemId}`,
        menuIcon: menuIcon, // 메뉴 아이콘 정보 추가
        closable: true
      });
      
      // 활성 탭 설정
      dispatch(setActiveTab(itemId));
    }
    
    // 모바일에서 사이드바 닫기
    if (isMobile) {
      onClose();
    }
  };

  return (
    <>
      <div 
        ref={sidebarRef}
        className={`sidebar ${collapsed ? 'collapsed' : ''}`}
        style={{ height: sidebarHeight }}
      >
        {/* 사이드바 헤더 */}
        <div className="sidebar-header">
          {!collapsed && <h2 className="sidebar-title">HYUNDAI</h2>}
          <button 
            className="sidebar-toggle"
            onClick={onToggle}
            aria-label={collapsed ? "사이드바 펼치기" : "사이드바 접기"}
            title={collapsed ? "메뉴 펼치기" : "메뉴 접기"}
          >
            {collapsed ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
          </button>
        </div>

        {/* 사이드바 메뉴 */}
        <div className="sidebar-menu" ref={sidebarRef}>
          <div className="menu-item-container">
            {(loading || permissionsLoading) && (
              <div className="menu-loading">
                <div className="menu-loading-spinner"></div>
                <div className="loading-text">
                  {loading ? '메뉴 로딩 중...' : '권한 확인 중...'}
                </div>
              </div>
            )}
            {!loading && !permissionsLoading && menuItems.length === 0 && (
              <div className="menu-empty">
                <div className="empty-text">접근 가능한 메뉴가 없습니다.</div>
                <div className="empty-subtext">관리자에게 문의하세요.</div>
              </div>
            )}
            {!loading && !permissionsLoading && menuItems.length > 0 && menuItems.map((item) => (
              <MenuItemWithPermission
                key={item.id || item.menu_id}
                item={item}
                level={0}
                onMenuClick={handleMenuClick}
                onToggle={toggleMenuItem}
                expandedItems={expandedItems}
                collapsed={collapsed}
                isMobile={isMobile}
                allPermissions={allPermissions}
                permissionsLoading={permissionsLoading}
                activeMenuIds={activeMenuIds}
              />
            ))}
          </div>
        </div>
      </div>

      {/* 모바일 오버레이 */}
      {isMobile && !collapsed && (
        <div className="sidebar-overlay" onClick={onClose} />
      )}
    </>
  );
};

export default Sidebar;
