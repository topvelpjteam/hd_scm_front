import { createSlice, PayloadAction } from '@reduxjs/toolkit';

// 사용자 데이터 타입 정의
export interface UserData {
  user_id: number;
  user_role_id: number;
  role_name: string;
  Agent_id: string | null;
  VENDOR_NAME: string | null;
  Store_id: string | null;
  STORE_NAME: string | null;
  user_login_id: string;
  user_name: string;
  user_email: string;
  user_phone: string;
  user_address: string;
  user_birth_date: string | null;
  user_gender: string | null;
  user_department: string | null;
  user_position: string | null;
  user_status: string;
  user_login_fail_count: number;
  user_last_login_date: string | null;
  user_created_date: string;
  user_created_by: number;
  user_updated_date: string | null;
  user_updated_by: number | null;
  user_deleted_date: string | null;
}

// 검색 조건 타입 정의
export interface SearchCondition {
  userRoleId: number[];
  userStatus: string[];
  userName: string;
  userLoginId: string;
  agentId: string[];
  storeId: string[];
  pageSize: number;
  pageNum: number;
  sortColumn: string;
  sortDirection: string;
}

// 사용자 상세 정보 타입 정의
export interface UserDetail {
  user_id: number | null;
  user_role_id: number | null;
  role_name: string;
  Agent_id: string | null;
  VENDOR_NAME: string | null;
  Store_id: string | null;
  STORE_NAME: string | null;
  user_login_id: string;
  user_name: string;
  user_email: string;
  user_password: string;
  user_phone: string;
  user_address: string;
  user_birth_date: string;
  user_gender: string;
  user_department: string;
  user_position: string;
  user_status: string;
  user_login_fail_count: number;
  user_last_login_date: string | null;
  user_created_date: string | null;
  user_created_by: number | null;
  user_updated_date: string | null;
  user_updated_by: number | null;
  user_deleted_date: string | null;
}

// 공통 코드 옵션 타입 정의
export interface CommonCodeOption {
  value: string;
  label: string;
}

// 사용자관리 상태 타입 정의
export interface UserManagementState {
  // 데이터
  userList: UserData[];
  selectedUser: UserData | null;
  userDetail: UserDetail;
  totalCount: number;
  
  // 검색 조건
  searchCondition: SearchCondition;
  
  // 공통 코드 데이터
  roleOptions: CommonCodeOption[];
  agentOptions: CommonCodeOption[];
  storeOptions: CommonCodeOption[];
  
  // UI 상태
  isLoading: boolean;
  isNewMode: boolean;
  hasUnsavedChanges: boolean;
  
  // 페이지네이션
  currentPage: number;
  totalPages: number;
  
  // 에러 상태
  error: string | null;
  
  // 권한 상태
  permissions: {
    view: boolean;
    save: boolean;
    delete: boolean;
    export: boolean;
    personalInfo: boolean;
  };
}

// 초기 상태
const initialState: UserManagementState = {
  // 데이터
  userList: [],
  selectedUser: null,
  userDetail: {
    user_id: null,
    user_role_id: null,
    role_name: '',
    Agent_id: null,
    VENDOR_NAME: null,
    Store_id: null,
    STORE_NAME: null,
    user_login_id: '',
    user_name: '',
    user_email: '',
    user_password: '',
    user_phone: '',
    user_address: '',
    user_birth_date: '',
    user_gender: '',
    user_department: '',
    user_position: '',
    user_status: 'A',
    user_login_fail_count: 0,
    user_last_login_date: null,
    user_created_date: null,
    user_created_by: null,
    user_updated_date: null,
    user_updated_by: null,
    user_deleted_date: null,
  },
  totalCount: 0,
  
  // 검색 조건
  searchCondition: {
    userRoleId: [],
    userStatus: [], // 기본값: 모든 상태의 사용자 조회
    userName: '',
    userLoginId: '',
    agentId: [],
    storeId: [],
    pageSize: 50,
    pageNum: 1,
    sortColumn: 'USER_ID',
    sortDirection: 'ASC',
  },
  
  // 공통 코드 데이터
  roleOptions: [],
  agentOptions: [],
  storeOptions: [],
  
  // UI 상태
  isLoading: false,
  isNewMode: true,
  hasUnsavedChanges: false,
  
  // 페이지네이션
  currentPage: 1,
  totalPages: 0,
  
  // 에러 상태
  error: null,
  
  // 권한 상태
  permissions: {
    view: false,
    save: false,
    delete: false,
    export: false,
    personalInfo: false,
  },
};

// 사용자관리 슬라이스 생성
const userManagementSlice = createSlice({
  name: 'userManagement',
  initialState,
  reducers: {
    // 검색 조건 설정
    setSearchCondition: (state, action: PayloadAction<Partial<SearchCondition>>) => {
      state.searchCondition = { ...state.searchCondition, ...action.payload };
    },
    
    // 검색 조건 초기화
    resetSearchCondition: (state) => {
      state.searchCondition = {
        userRoleId: [],
        userStatus: [], // 모든 상태의 사용자 조회
        userName: '',
        userLoginId: '',
        agentId: [],
        storeId: [],
        pageSize: 50,
        pageNum: 1,
        sortColumn: 'USER_ID',
        sortDirection: 'ASC',
      };
    },
    
    // 사용자 목록 설정
    setUserList: (state, action: PayloadAction<UserData[]>) => {
      state.userList = action.payload;
    },
    
    // 선택된 사용자 설정
    setSelectedUser: (state, action: PayloadAction<UserData | null>) => {
      state.selectedUser = action.payload;
    },
    
    // 사용자 상세 정보 설정
    setUserDetail: (state, action: PayloadAction<Partial<UserDetail>>) => {
      state.userDetail = { ...state.userDetail, ...action.payload };
    },
    
    // 사용자 상세 정보 업데이트
    updateUserDetail: (state, action: PayloadAction<Partial<UserDetail>>) => {
      state.userDetail = { ...state.userDetail, ...action.payload };
      state.hasUnsavedChanges = true;
    },
    
    // 새 모드 설정
    setIsNewMode: (state, action: PayloadAction<boolean>) => {
      state.isNewMode = action.payload;
    },
    
    // 로딩 상태 설정
    setIsLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },
    
    // 공통 코드 데이터 설정
    setCodeData: (state, action: PayloadAction<{
      roleOptions?: CommonCodeOption[];
      agentOptions?: CommonCodeOption[];
      storeOptions?: CommonCodeOption[];
    }>) => {
      if (action.payload.roleOptions) {
        state.roleOptions = action.payload.roleOptions;
      }
      if (action.payload.agentOptions) {
        state.agentOptions = action.payload.agentOptions;
      }
      if (action.payload.storeOptions) {
        state.storeOptions = action.payload.storeOptions;
      }
    },
    
    // 총 개수 설정
    setTotalCount: (state, action: PayloadAction<number>) => {
      state.totalCount = action.payload;
      state.totalPages = Math.ceil(action.payload / state.searchCondition.pageSize);
    },
    
    // 현재 페이지 설정
    setCurrentPage: (state, action: PayloadAction<number>) => {
      state.currentPage = action.payload;
      state.searchCondition.pageNum = action.payload;
    },
    
    // 에러 설정
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },
    
    // 권한 설정
    setPermissions: (state, action: PayloadAction<{
      view?: boolean;
      save?: boolean;
      delete?: boolean;
      export?: boolean;
      personalInfo?: boolean;
    }>) => {
      state.permissions = { ...state.permissions, ...action.payload };
    },
    
    // 저장되지 않은 변경사항 설정
    setHasUnsavedChanges: (state, action: PayloadAction<boolean>) => {
      state.hasUnsavedChanges = action.payload;
    },
    
    // 화면 초기화
    initializeScreen: (state) => {
      state.userList = [];
      state.selectedUser = null;
      state.userDetail = {
        user_id: null,
        user_role_id: null,
        role_name: '',
        Agent_id: null,
        VENDOR_NAME: null,
        Store_id: null,
        STORE_NAME: null,
        user_login_id: '',
        user_name: '',
        user_email: '',
        user_password: '',
        user_phone: '',
        user_address: '',
        user_birth_date: '',
        user_gender: '',
        user_department: '',
        user_position: '',
        user_status: 'A',
        user_login_fail_count: 0,
        user_last_login_date: null,
        user_created_date: null,
        user_created_by: null,
        user_updated_date: null,
        user_updated_by: null,
        user_deleted_date: null,
      };
      state.totalCount = 0;
      state.currentPage = 1;
      state.totalPages = 0;
      state.isNewMode = true;
      state.hasUnsavedChanges = false;
      state.error = null;
    },
    
    // 사용자 상세 정보 초기화
    resetUserDetail: (state) => {
      state.userDetail = {
        user_id: null,
        user_role_id: null,
        role_name: '',
        Agent_id: null,
        VENDOR_NAME: null,
        Store_id: null,
        STORE_NAME: null,
        user_login_id: '',
        user_name: '',
        user_email: '',
        user_password: '',
        user_phone: '',
        user_address: '',
        user_birth_date: '',
        user_gender: '',
        user_department: '',
        user_position: '',
        user_status: 'A',
        user_login_fail_count: 0,
        user_last_login_date: null,
        user_created_date: null,
        user_created_by: null,
        user_updated_date: null,
        user_updated_by: null,
        user_deleted_date: null,
      };
      state.isNewMode = true;
      state.hasUnsavedChanges = false;
    },
  },
});

// 액션 내보내기
export const {
  setSearchCondition,
  resetSearchCondition,
  setUserList,
  setSelectedUser,
  setUserDetail,
  updateUserDetail,
  setIsNewMode,
  setIsLoading,
  setCodeData,
  setTotalCount,
  setCurrentPage,
  setError,
  setPermissions,
  setHasUnsavedChanges,
  initializeScreen,
  resetUserDetail,
} = userManagementSlice.actions;

// 리듀서 내보내기
export default userManagementSlice.reducer;

// 셀렉터 함수들
export const selectUserManagement = (state: { userManagement: UserManagementState }) => state.userManagement;
export const selectUserList = (state: { userManagement: UserManagementState }) => state.userManagement.userList;
export const selectSelectedUser = (state: { userManagement: UserManagementState }) => state.userManagement.selectedUser;
export const selectUserDetail = (state: { userManagement: UserManagementState }) => state.userManagement.userDetail;
export const selectSearchCondition = (state: { userManagement: UserManagementState }) => state.userManagement.searchCondition;
export const selectIsLoading = (state: { userManagement: UserManagementState }) => state.userManagement.isLoading;
export const selectIsNewMode = (state: { userManagement: UserManagementState }) => state.userManagement.isNewMode;
export const selectHasUnsavedChanges = (state: { userManagement: UserManagementState }) => state.userManagement.hasUnsavedChanges;
export const selectPermissions = (state: { userManagement: UserManagementState }) => state.userManagement.permissions;
export const selectTotalCount = (state: { userManagement: UserManagementState }) => state.userManagement.totalCount;
export const selectCurrentPage = (state: { userManagement: UserManagementState }) => state.userManagement.currentPage;
export const selectTotalPages = (state: { userManagement: UserManagementState }) => state.userManagement.totalPages;
export const selectError = (state: { userManagement: UserManagementState }) => state.userManagement.error;
