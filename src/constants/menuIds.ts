/**
 * 메뉴 ID 상수 정의
 * 메뉴 ID가 변경되면 이 파일만 수정하면 됩니다.
 */

export const MENU_IDS = {
  // 1단계 메뉴
  DASHBOARD: 1,
  PRODUCT_MANAGEMENT: 2,
  ORDER_MANAGEMENT: 3,
  INVENTORY_MANAGEMENT: 4,
  SETTLEMENT_REPORTS: 5,
  AGENT_MANAGEMENT: 6,
  PERMISSION_MANAGEMENT: 7,
  
  // 2단계 메뉴 - 상품관리
  PRODUCT_REGISTRATION: 8,
  PRODUCT_PRICING: 9,
  
  // 2단계 메뉴 - 발주관리
  NEW_ORDER_CONFIRMATION: 10,
  ORDER_REGISTRATION: 11,
  ORDER_LIST_MANAGEMENT: 30,
  ORDER_OUT_STATUS: 31,
  SHIPMENT_PROCESSING: 12,
  ORDER_HISTORY_SEARCH: 13,
  TRACKING: 14,
  
  // 2단계 메뉴 - 재고관리
  REAL_TIME_INVENTORY: 15,
  INVENTORY_HISTORY: 16,
  
  // 2단계 메뉴 - 정산/리포트
  TRANSACTION_HISTORY: 17,
  PERIODIC_REPORTS: 18,
  
  // 2단계 메뉴 - 거래처관리
  AGENT_REGISTRATION: 19,
  
  // 2단계 메뉴 - 권한관리
  USER_MANAGEMENT: 20,
  ROLE_MANAGEMENT: 21,
  MENU_PERMISSION_MANAGEMENT: 22,
  EMAIL_HISTORY: 23,
  MENU_MANAGEMENT: 24,
} as const;

/**
 * 메뉴 ID 타입 정의
 */
export type MenuId = typeof MENU_IDS[keyof typeof MENU_IDS];

/**
 * 메뉴 이름으로 메뉴 ID를 조회하는 함수
 * @param menuName 메뉴 이름
 * @returns 메뉴 ID 또는 null
 */
export const getMenuIdByName = (menuName: string): number | null => {
  const menuNameToId: Record<string, number> = {
    '대시보드': MENU_IDS.DASHBOARD,
    '상품관리': MENU_IDS.PRODUCT_MANAGEMENT,
    '발주관리': MENU_IDS.ORDER_MANAGEMENT,
    '재고관리': MENU_IDS.INVENTORY_MANAGEMENT,
    '정산/리포트': MENU_IDS.SETTLEMENT_REPORTS,
    '거래처관리': MENU_IDS.AGENT_MANAGEMENT,
    '권한관리': MENU_IDS.PERMISSION_MANAGEMENT,
    '상품 등록': MENU_IDS.PRODUCT_REGISTRATION,
    '상품 가격 관리': MENU_IDS.PRODUCT_PRICING,
    '신규 발주 확인': MENU_IDS.NEW_ORDER_CONFIRMATION,
    '발주 등록': MENU_IDS.ORDER_REGISTRATION,
    '발주 리스트 관리': MENU_IDS.ORDER_LIST_MANAGEMENT,
    '출고 현황': MENU_IDS.ORDER_OUT_STATUS,
    '출고 처리': MENU_IDS.SHIPMENT_PROCESSING,
    '발주 내역 검색': MENU_IDS.ORDER_HISTORY_SEARCH,
    '송장번호 배송추적': MENU_IDS.TRACKING,
    '실시간 매장 재고 확인': MENU_IDS.REAL_TIME_INVENTORY,
    '입출고 현황': MENU_IDS.INVENTORY_HISTORY,
    '거래 내역': MENU_IDS.TRANSACTION_HISTORY,
    '월별/분기별 주문/출고 내역': MENU_IDS.PERIODIC_REPORTS,
    '거래처 등록': MENU_IDS.AGENT_REGISTRATION,
    '사용자 관리': MENU_IDS.USER_MANAGEMENT,
    '역할 관리': MENU_IDS.ROLE_MANAGEMENT,
    '메뉴 권한 관리': MENU_IDS.MENU_PERMISSION_MANAGEMENT,
    '이메일 히스토리': MENU_IDS.EMAIL_HISTORY,
    '메뉴 관리': MENU_IDS.MENU_MANAGEMENT,
  };
  
  return menuNameToId[menuName] || null;
};

/**
 * 메뉴 ID로 메뉴 이름을 조회하는 함수
 * @param menuId 메뉴 ID
 * @returns 메뉴 이름 또는 null
 */
export const getMenuNameById = (menuId: number): string | null => {
  const idToMenuName: Record<number, string> = {
    [MENU_IDS.DASHBOARD]: '대시보드',
    [MENU_IDS.PRODUCT_MANAGEMENT]: '상품관리',
    [MENU_IDS.ORDER_MANAGEMENT]: '발주관리',
    [MENU_IDS.INVENTORY_MANAGEMENT]: '재고관리',
    [MENU_IDS.SETTLEMENT_REPORTS]: '정산/리포트',
    [MENU_IDS.AGENT_MANAGEMENT]: '거래처관리',
    [MENU_IDS.PERMISSION_MANAGEMENT]: '권한관리',
    [MENU_IDS.PRODUCT_REGISTRATION]: '상품 등록',
    [MENU_IDS.PRODUCT_PRICING]: '상품 가격 관리',
    [MENU_IDS.NEW_ORDER_CONFIRMATION]: '신규 발주 확인',
    [MENU_IDS.ORDER_REGISTRATION]: '발주 등록',
    [MENU_IDS.ORDER_LIST_MANAGEMENT]: '발주 리스트 관리',
    [MENU_IDS.ORDER_OUT_STATUS]: '출고 현황',
    [MENU_IDS.SHIPMENT_PROCESSING]: '출고 처리',
    [MENU_IDS.ORDER_HISTORY_SEARCH]: '발주 내역 검색',
    [MENU_IDS.TRACKING]: '송장번호 배송추적',
    [MENU_IDS.REAL_TIME_INVENTORY]: '실시간 매장 재고 확인',
    [MENU_IDS.INVENTORY_HISTORY]: '입출고 현황',
    [MENU_IDS.TRANSACTION_HISTORY]: '거래 내역',
    [MENU_IDS.PERIODIC_REPORTS]: '월별/분기별 주문/출고 내역',
    [MENU_IDS.AGENT_REGISTRATION]: '거래처 등록',
    [MENU_IDS.USER_MANAGEMENT]: '사용자 관리',
    [MENU_IDS.ROLE_MANAGEMENT]: '역할 관리',
    [MENU_IDS.MENU_PERMISSION_MANAGEMENT]: '메뉴 권한 관리',
    [MENU_IDS.EMAIL_HISTORY]: '이메일 히스토리',
    [MENU_IDS.MENU_MANAGEMENT]: '메뉴 관리',
  };
  
  return idToMenuName[menuId] || null;
};
