import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { MenuData, MenuPermissionData, RoleData } from '../services/menuManagementService';

// 상태 타입 정의
interface MenuManagementState {
  // 메뉴 관련
  menuTree: MenuData[];
  selectedMenu: MenuData | null;
  isNewMenuMode: boolean;
  hasUnsavedChanges: boolean;
  
  // 메뉴 폼 데이터
  menuForm: {
    menu_name: string;
    menu_description: string;
    menu_url: string;
    menu_icon: string;
    menu_order: number;
    menu_level: number;
    menu_parent_id: number | null;
    menu_type: string;
    menu_status: string;
  };
  
  // 권한 관련
  menuPermissions: MenuPermissionData[];
  roles: RoleData[];
  
  // UI 상태
  isLoading: boolean;
  error: string | null;
  
  // 검색 조건
  searchCondition: {
    menuLevel: number | null;
    menuParentId: number | null;
    menuType: string | null;
    menuStatus: string | null;
    searchKeyword: string;
    pageSize: number;
    pageNum: number;
    sortColumn: string;
    sortDirection: string;
  };
  
  // 페이지네이션
  totalCount: number;
  currentPage: number;
}

// 초기 상태
const initialState: MenuManagementState = {
  // 메뉴 관련
  menuTree: [],
  selectedMenu: null,
  isNewMenuMode: false,
  hasUnsavedChanges: false,
  
  // 메뉴 폼 데이터
  menuForm: {
    menu_name: '',
    menu_description: '',
    menu_url: '',
    menu_icon: '',
    menu_order: 0,
    menu_level: 1,
    menu_parent_id: null,
    menu_type: 'M',
    menu_status: 'A'
  },
  
  // 권한 관련
  menuPermissions: [],
  roles: [],
  
  // UI 상태
  isLoading: false,
  error: null,
  
  // 검색 조건
  searchCondition: {
    menuLevel: null,
    menuParentId: null,
    menuType: null,
    menuStatus: null,
    searchKeyword: '',
    pageSize: 50,
    pageNum: 1,
    sortColumn: 'MENU_ORDER',
    sortDirection: 'ASC',
  },
  
  // 페이지네이션
  totalCount: 0,
  currentPage: 1,
};

// 슬라이스 생성
const menuManagementSlice = createSlice({
  name: 'menuManagement',
  initialState,
  reducers: {
    // 메뉴 트리 관련
    setMenuTree: (state, action: PayloadAction<MenuData[]>) => {
      state.menuTree = action.payload;
    },
    
    setSelectedMenu: (state, action: PayloadAction<MenuData | null>) => {
      state.selectedMenu = action.payload;
    },
    
    // 메뉴 폼 관련
    setMenuForm: (state, action: PayloadAction<Partial<typeof initialState.menuForm>>) => {
      state.menuForm = { ...state.menuForm, ...action.payload };
      state.hasUnsavedChanges = true;
    },
    
    resetMenuForm: (state) => {
      state.menuForm = {
        menu_name: '',
        menu_description: '',
        menu_url: '',
        menu_icon: '',
        menu_order: 0,
        menu_level: 1,
        menu_parent_id: null,
        menu_type: 'M',
        menu_status: 'A'
      };
      state.hasUnsavedChanges = false;
    },
    
    // 모드 관련
    setIsNewMenuMode: (state, action: PayloadAction<boolean>) => {
      state.isNewMenuMode = action.payload;
    },
    
    setHasUnsavedChanges: (state, action: PayloadAction<boolean>) => {
      state.hasUnsavedChanges = action.payload;
    },
    
    // 권한 관련
    setMenuPermissions: (state, action: PayloadAction<MenuPermissionData[]>) => {
      state.menuPermissions = action.payload;
    },
    
    setRoles: (state, action: PayloadAction<RoleData[]>) => {
      state.roles = action.payload;
    },
    
    // UI 상태
    setIsLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },
    
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },
    
    // 검색 조건
    setSearchCondition: (state, action: PayloadAction<Partial<typeof initialState.searchCondition>>) => {
      state.searchCondition = { ...state.searchCondition, ...action.payload };
    },
    
    resetSearchCondition: (state) => {
      state.searchCondition = {
        menuLevel: null,
        menuParentId: null,
        menuType: null,
        menuStatus: null,
        searchKeyword: '',
        pageSize: 50,
        pageNum: 1,
        sortColumn: 'MENU_ORDER',
        sortDirection: 'ASC',
      };
    },
    
    // 페이지네이션
    setTotalCount: (state, action: PayloadAction<number>) => {
      state.totalCount = action.payload;
    },
    
    setCurrentPage: (state, action: PayloadAction<number>) => {
      state.currentPage = action.payload;
    },
    
    // 메뉴 선택 시 폼 데이터 로드
    loadMenuToForm: (state, action: PayloadAction<MenuData>) => {
      const menu = action.payload;
      state.menuForm = {
        menu_name: menu.menu_name,
        menu_description: menu.menu_description || '',
        menu_url: menu.menu_url || '',
        menu_icon: menu.menu_icon || '',
        menu_order: menu.menu_order,
        menu_level: menu.menu_level,
        menu_parent_id: menu.menu_parent_id,
        menu_type: menu.menu_type,
        menu_status: menu.menu_status
      };
      state.hasUnsavedChanges = false;
    },
    
    // 새 메뉴 모드 초기화
    initializeNewMenu: (state) => {
      state.isNewMenuMode = true;
      state.selectedMenu = null;
      state.menuPermissions = [];
      state.menuForm = {
        menu_name: '',
        menu_description: '',
        menu_url: '',
        menu_icon: '',
        menu_order: 0,
        menu_level: 1,
        menu_parent_id: null,
        menu_type: 'M',
        menu_status: 'A'
      };
      state.hasUnsavedChanges = false;
    },
    
    // 메뉴 선택 시 초기화
    selectMenu: (state, action: PayloadAction<MenuData>) => {
      state.selectedMenu = action.payload;
      state.isNewMenuMode = false;
      state.menuForm = {
        menu_name: action.payload.menu_name,
        menu_description: action.payload.menu_description || '',
        menu_url: action.payload.menu_url || '',
        menu_icon: action.payload.menu_icon || '',
        menu_order: action.payload.menu_order,
        menu_level: action.payload.menu_level,
        menu_parent_id: action.payload.menu_parent_id,
        menu_type: action.payload.menu_type,
        menu_status: action.payload.menu_status
      };
      state.hasUnsavedChanges = false;
    },
    
    // 권한 업데이트
    updatePermission: (state, action: PayloadAction<{
      permissionId: number;
      field: string;
      value: string;
    }>) => {
      const { permissionId, field, value } = action.payload;
      const permission = state.menuPermissions.find(p => p.menu_role_permission_id === permissionId);
      if (permission) {
        (permission as any)[field] = value;
      }
    },
    
    // 전체 상태 초기화
    resetState: () => initialState,
  },
});

// 액션 내보내기
export const {
  setMenuTree,
  setSelectedMenu,
  setMenuForm,
  resetMenuForm,
  setIsNewMenuMode,
  setHasUnsavedChanges,
  setMenuPermissions,
  setRoles,
  setIsLoading,
  setError,
  setSearchCondition,
  resetSearchCondition,
  setTotalCount,
  setCurrentPage,
  loadMenuToForm,
  initializeNewMenu,
  selectMenu,
  updatePermission,
  resetState,
} = menuManagementSlice.actions;

// 리듀서 내보내기
export default menuManagementSlice.reducer;

// 셀렉터
export const selectMenuManagement = (state: { menuManagement: MenuManagementState }) => state.menuManagement;
export const selectMenuTree = (state: { menuManagement: MenuManagementState }) => state.menuManagement.menuTree;
export const selectSelectedMenu = (state: { menuManagement: MenuManagementState }) => state.menuManagement.selectedMenu;
export const selectMenuForm = (state: { menuManagement: MenuManagementState }) => state.menuManagement.menuForm;
export const selectIsNewMenuMode = (state: { menuManagement: MenuManagementState }) => state.menuManagement.isNewMenuMode;
export const selectHasUnsavedChanges = (state: { menuManagement: MenuManagementState }) => state.menuManagement.hasUnsavedChanges;
export const selectMenuPermissions = (state: { menuManagement: MenuManagementState }) => state.menuManagement.menuPermissions;
export const selectRoles = (state: { menuManagement: MenuManagementState }) => state.menuManagement.roles;
export const selectIsLoading = (state: { menuManagement: MenuManagementState }) => state.menuManagement.isLoading;
export const selectError = (state: { menuManagement: MenuManagementState }) => state.menuManagement.error;
export const selectSearchCondition = (state: { menuManagement: MenuManagementState }) => state.menuManagement.searchCondition;
export const selectTotalCount = (state: { menuManagement: MenuManagementState }) => state.menuManagement.totalCount;
export const selectCurrentPage = (state: { menuManagement: MenuManagementState }) => state.menuManagement.currentPage;
