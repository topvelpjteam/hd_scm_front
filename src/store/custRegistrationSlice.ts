import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { resetAllStates, clearAllData } from './globalActions';

// 고객 데이터 타입 정의 (TB_ZA_CUSTOMER 테이블 기준)
interface CustomerData {
  CUST_ID?: number;
  AGENT_ID?: number;
  CUST_NM: string;
  CUST_GBN?: string;
  NATION_ID?: string;
  C_HP?: string;
  C_EMAIL?: string;
  ZIP_ID?: string;
  C_ADDR1?: string;
  C_ADDR2?: string;
  CUST_BIRTH_D?: string;
  CUST_D_GBN?: string;
  CUST_OPEN_D?: string;
  CUST_HOBB?: string;
  CUST_DATA?: string;
  EMAIL_CHK?: string;
  DM_CHK?: string;
  SMS_CHK?: string;
  CALL_CHK?: string;
  GENDER_GBN?: string;
  MNG_STAFF?: string;
  USER_ID?: string;
  SYS_TIME?: string;
  UPD_USER?: string;
  UPD_TIME?: string;
  // 인덱스 시그니처 추가 (동적 필드 접근용)
  [key: string]: any;
}

// 검색 조건 타입
interface SearchCondition {
  custName: string;
  custGbn: string[];
  genderGbn: string;
  openDateFrom: string;
  openDateTo: string;
  phoneOrEmail: string;
}

// 코드 데이터 타입
interface CodeData {
  custGbn: CommonCodeOption[];
  nationGbn: CommonCodeOption[];
}

// 공통 코드 옵션 타입
interface CommonCodeOption {
  value: string;
  label: string;
}

// 고객등록 화면 상태
interface CustRegistrationState {
  // 검색 조건
  searchCondition: SearchCondition;
  // 고객 데이터
  customerData: CustomerData;
  // 선택된 고객
  selectedCustomer: CustomerData | null;
  // 신규 등록 모드 여부
  isNewMode: boolean;
  // 그리드 데이터
  gridData: CustomerData[];
  // 코드 데이터
  codeData: CodeData;
  // 화면 초기화 여부
  isInitialized: boolean;
}

// 초기 상태
const initialState: CustRegistrationState = {
  searchCondition: {
    custName: '',
    custGbn: [],
    genderGbn: '',
    openDateFrom: '',
    openDateTo: '',
    phoneOrEmail: ''
  },
  customerData: {
    CUST_NM: '',
    CUST_GBN: 'Z',
    GENDER_GBN: 'M',
    EMAIL_CHK: 'N',
    DM_CHK: 'N',
    SMS_CHK: 'N',
    CALL_CHK: 'N'
  },
  selectedCustomer: null,
  isNewMode: false,
  gridData: [],
  codeData: {
    custGbn: [],
    nationGbn: []
  },
  isInitialized: false
};

// 고객등록 slice 생성
const custRegistrationSlice = createSlice({
  name: 'custRegistration',
  initialState,
  reducers: {
    // 검색 조건 설정
    setSearchCondition: (state, action: PayloadAction<Partial<SearchCondition>>) => {
      state.searchCondition = { ...state.searchCondition, ...action.payload };
    },
    // 고객 데이터 설정
    setCustomerData: (state, action: PayloadAction<Partial<CustomerData>>) => {
      state.customerData = { ...state.customerData, ...action.payload };
    },
    // 선택된 고객 설정
    setSelectedCustomer: (state, action: PayloadAction<CustomerData | null>) => {
      state.selectedCustomer = action.payload;
    },
    // 신규 등록 모드 설정
    setIsNewMode: (state, action: PayloadAction<boolean>) => {
      state.isNewMode = action.payload;
    },
    // 그리드 데이터 설정
    setGridData: (state, action: PayloadAction<CustomerData[]>) => {
      state.gridData = action.payload;
    },
    // 코드 데이터 설정
    setCodeData: (state, action: PayloadAction<Partial<CodeData>>) => {
      state.codeData = { ...state.codeData, ...action.payload };
    },
    // 고객 상세 정보 업데이트
    updateCustomerDetail: (state, action: PayloadAction<{ field: keyof CustomerData; value: string }>) => {
      if (state.selectedCustomer) {
        state.selectedCustomer = {
          ...state.selectedCustomer,
          [action.payload.field]: action.payload.value
        };
      }
    },
    // 상태 초기화
    resetState: (state) => {
      state.searchCondition = initialState.searchCondition;
      state.customerData = initialState.customerData;
      state.selectedCustomer = null;
      state.isNewMode = false;
      state.gridData = [];
      state.isInitialized = false;
    },
    // 전체 상태 복원
    restoreState: (_state, action: PayloadAction<CustRegistrationState>) => {
      return action.payload;
    },
    // 화면 초기화
    initializeScreen: (state) => {
      state.isInitialized = true;
    }
  },
  extraReducers: (builder) => {
    builder
      // 글로벌 상태 초기화 처리 (로그아웃 시에만)
      .addCase(resetAllStates, () => initialState)
      // 브라우저 종료 시 데이터 정리 (상태 유지)
      .addCase(clearAllData, (state) => state);
  }
});

// 액션 생성자들 export
export const {
  setSearchCondition,
  setCustomerData,
  setSelectedCustomer,
  setIsNewMode,
  setGridData,
  setCodeData,
  updateCustomerDetail,
  resetState,
  restoreState,
  initializeScreen
} = custRegistrationSlice.actions;

// 타입들 export
export type { CustomerData, SearchCondition, CodeData, CommonCodeOption, CustRegistrationState };

// 리듀서 export
export default custRegistrationSlice.reducer;
