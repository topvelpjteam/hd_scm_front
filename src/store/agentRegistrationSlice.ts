import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { resetAllStates, clearAllData } from './globalActions';

// 거래처 데이터 타입 정의
interface AgentData {
  AGENT_ID?: number;
  AGENT_NM: string;
  AGENT_ENG_NM?: string;
  SHORT_NM?: string;
  AGENT_GBN: string;
  CHANN_GBN: string;
  AGENT_CEO?: string;
  AGENT_BNO?: string;
  AGENT_TEL?: string;
  AGENT_FAX?: string;
  AGENT_EMAIL?: string;
  AGENT_ADDRESS?: string;
  BANK_GBN?: string;
  ACCOUNT_NO?: string;
  ACCOUNT_HOLDER?: string;
  BRAND_ID_LIST?: string;
  OPEN_D?: string;
  CLOSE_D?: string;
  TRADE_MEMO?: string;
  USE_YN?: string;
  USER_ID?: string;
  SYS_TIME?: string;
  UPD_USER?: string;
  UPD_TIME?: string;
  // 인덱스 시그니처 추가 (동적 필드 접근용)
  [key: string]: any;
}

// 검색 조건 타입
interface SearchCondition {
  agentName: string;
  agentGbn: string[];
  channGbn: string[];
  excludeTerminated: boolean;
}

// 코드 데이터 타입
interface CodeData {
  agentGbn: CommonCodeOption[];
  channGbn: CommonCodeOption[];
  bankGbn: CommonCodeOption[];
}

// 공통 코드 옵션 타입
interface CommonCodeOption {
  value: string;
  label: string;
}

// 거래처등록 화면 상태
interface AgentRegistrationState {
  // 검색 조건
  searchCondition: SearchCondition;
  // 거래처 데이터
  agentData: AgentData;
  // 선택된 거래처
  selectedAgent: AgentData | null;
  // 신규 등록 모드 여부
  isNewMode: boolean;
  // 그리드 데이터
  gridData: AgentData[];
  // 코드 데이터
  codeData: CodeData;
  // 화면 초기화 여부
  isInitialized: boolean;
}

// 초기 상태
const initialState: AgentRegistrationState = {
  searchCondition: {
    agentName: '',
    agentGbn: [],
    channGbn: [],
    excludeTerminated: true
  },
  agentData: {
    AGENT_NM: '',
    AGENT_GBN: '',
    CHANN_GBN: ''
  },
  selectedAgent: null,
  isNewMode: false,
  gridData: [],
  codeData: {
    agentGbn: [],
    channGbn: [],
    bankGbn: []
  },
  isInitialized: false
};

// 거래처등록 slice 생성
const agentRegistrationSlice = createSlice({
  name: 'agentRegistration',
  initialState,
  reducers: {
    // 검색 조건 설정
    setSearchCondition: (state, action: PayloadAction<Partial<SearchCondition>>) => {
      state.searchCondition = { ...state.searchCondition, ...action.payload };
    },
    // 거래처 데이터 설정
    setAgentData: (state, action: PayloadAction<Partial<AgentData>>) => {
      state.agentData = { ...state.agentData, ...action.payload };
    },
    // 선택된 거래처 설정
    setSelectedAgent: (state, action: PayloadAction<AgentData | null>) => {
      state.selectedAgent = action.payload;
    },
    // 신규 등록 모드 설정
    setIsNewMode: (state, action: PayloadAction<boolean>) => {
      state.isNewMode = action.payload;
    },
    // 그리드 데이터 설정
    setGridData: (state, action: PayloadAction<AgentData[]>) => {
      state.gridData = action.payload;
    },

    // 코드 데이터 설정
    setCodeData: (state, action: PayloadAction<Partial<CodeData>>) => {
      state.codeData = { ...state.codeData, ...action.payload };
    },
    // 거래처 상세 정보 업데이트
    updateAgentDetail: (state, action: PayloadAction<{ field: keyof AgentData; value: string }>) => {
      if (state.selectedAgent) {
        state.selectedAgent = {
          ...state.selectedAgent,
          [action.payload.field]: action.payload.value
        };
      }
    },
    // 상태 초기화
    resetState: (state) => {
      state.searchCondition = initialState.searchCondition;
      state.agentData = initialState.agentData;
      state.selectedAgent = null;
      state.isNewMode = false;
      state.gridData = [];
      state.isInitialized = false;
    },
    // 전체 상태 복원
    restoreState: (state, action: PayloadAction<AgentRegistrationState>) => {
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
  setAgentData,
  setSelectedAgent,
  setIsNewMode,
  setGridData,
  setCodeData,
  updateAgentDetail,
  resetState,
  restoreState,
  initializeScreen
} = agentRegistrationSlice.actions;

// 타입들 export
export type { AgentData, SearchCondition, CodeData, CommonCodeOption, AgentRegistrationState };

// 리듀서 export
export default agentRegistrationSlice.reducer;
