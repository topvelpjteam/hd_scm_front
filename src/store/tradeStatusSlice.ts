/**
 * 거래 내역 Redux Slice
 * 거래 내역 조회, 취소, 통계 등의 상태를 관리합니다.
 */

import { createSlice, createAsyncThunk, PayloadAction, createSelector } from '@reduxjs/toolkit';
import { 
  TradeListItem, 
  TradeListSearchParams
} from '../services/tradeStatusService';
import * as tradeStatusService from '../services/tradeStatusService';

// 추가 타입 정의
interface CancelReason {
  code: string;
  name: string;
}

interface TradeStatistics {
  totalOrders: number;
  totalAmount: number;
  cancelledOrders: number;
  completedOrders: number;
}

interface TradeCancelParams {
  orderD: string;
  orderSequ: number;
  cancelReason: string;
  cancelDetail?: string;
  userId: string;
}

// 상태 타입 정의
interface TradeStatusState {
  // 조회 관련
  tradeList: TradeListItem[];
  totalCount: number;
  pageNum: number;
  pageSize: number;
  totalPages: number;
  
  // 검색 조건
  searchParams: TradeListSearchParams;
  
  // 선택된 거래
  selectedTrades: string[];
  
  // 통계 정보
  statistics: TradeStatistics | null;
  
  // 취소 사유 목록
  cancelReasons: CancelReason[];
  
  // 로딩 상태
  isLoading: boolean;
  isSearching: boolean;
  isCancelling: boolean;
  isUpdating: boolean;
  
  // 에러 상태
  error: string | null;
  
  // UI 상태
  showCancelModal: boolean;
  showDetailModal: boolean;
  showStatisticsModal: boolean;
  selectedTradeForCancel: TradeListItem | null;
  selectedTradeForDetail: TradeListItem | null;
}

// 상태 복원을 위한 키
const TS_STATE_KEY = 'ts_state';

// 기본 날짜 범위 함수
const getDefaultDateRange = () => {
  const today = new Date();
  const oneHundredTwentyDaysAgo = new Date(today);
  oneHundredTwentyDaysAgo.setDate(today.getDate() - 120);

  const thirtyDaysLater = new Date(today);
  thirtyDaysLater.setDate(today.getDate() + 30);

  return {
    from: oneHundredTwentyDaysAgo.toISOString().split('T')[0], // YYYY-MM-DD 형식
    to: thirtyDaysLater.toISOString().split('T')[0],
  };
};

// 기본 날짜 범위 가져오기
const defaultDateRange = getDefaultDateRange();

// 기본 초기 상태
const defaultInitialState: TradeStatusState = {
  tradeList: [],
  totalCount: 0,
  pageNum: 1,
  pageSize: 20,
  totalPages: 0,
  
  searchParams: {
    pageSize: 20,
    pageNum: 1,
    sortColumn: 'orderD',
    sortDirection: 'DESC',
    orderDateFrom: defaultDateRange.from,
    orderDateTo: defaultDateRange.to
  },
  
  selectedTrades: [],
  statistics: null,
  cancelReasons: [],
  
  isLoading: false,
  isSearching: false,
  isCancelling: false,
  isUpdating: false,
  
  error: null,
  
  showCancelModal: false,
  showDetailModal: false,
  showStatisticsModal: false,
  selectedTradeForCancel: null,
  selectedTradeForDetail: null,
};

// 상태 저장 함수
const saveStateToStorage = (state: TradeStatusState) => {
  try {
    const stateToSave = {
      searchParams: state.searchParams,
      pageNum: state.pageNum,
      pageSize: state.pageSize,
      // 모달 상태는 저장하지 않음 (사용자 경험상 모달은 닫힌 상태로 복원)
      showCancelModal: false,
      showDetailModal: false,
      showStatisticsModal: false,
      selectedTradeForCancel: null,
      selectedTradeForDetail: null,
    };
    localStorage.setItem(TS_STATE_KEY, JSON.stringify(stateToSave));
  } catch (error) {
    console.warn('TS 상태 저장 실패:', error);
  }
};

// 상태 복원 함수
const loadStateFromStorage = (): Partial<TradeStatusState> => {
  try {
    const savedState = localStorage.getItem(TS_STATE_KEY);
    if (savedState) {
      const parsedState = JSON.parse(savedState);
      if (parsedState?.searchParams) {
        parsedState.searchParams = {
          ...parsedState.searchParams,
          tradeDateFrom: defaultDateRange.from,
          tradeDateTo: defaultDateRange.to,
        };
      }
      return parsedState;
    }
  } catch (error) {
    console.warn('TS 상태 복원 실패:', error);
  }
  return {};
};

// 저장된 상태를 복원한 초기 상태
const initialState: TradeStatusState = {
  ...defaultInitialState,
  ...loadStateFromStorage(),
};

// 비동기 액션들
export const searchTradeList = createAsyncThunk(
  'tradeStatus/searchTradeList',
  async (params: TradeListSearchParams, { rejectWithValue }) => {
    try {
      const response = await tradeStatusService.getTradeList(params);
      return response;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || '거래 리스트 조회에 실패했습니다.');
    }
  }
);

export const getTradeStatistics = createAsyncThunk(
  'tradeStatus/getTradeStatistics',
  async (params: TradeListSearchParams, { rejectWithValue }) => {
    try {
      const statistics = await tradeStatusService.getTradeStatistics(params);
      return statistics;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || '통계 조회에 실패했습니다.');
    }
  }
);

export const getTradeCancelReasons = createAsyncThunk(
  'tradeStatus/getTradeCancelReasons',
  async (_, { rejectWithValue }) => {
    try {
      const reasons = await tradeStatusService.getTradeCancelReasons();
      return reasons;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || '취소 사유 조회에 실패했습니다.');
    }
  }
);

export const cancelTrade = createAsyncThunk(
  'tradeStatus/cancelTrade',
  async (params: TradeCancelParams, { rejectWithValue }) => {
    try {
      const result = await tradeStatusService.cancelTrade(params);
      return { result, tradeD: params.orderD, tradeSequ: params.orderSequ };
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || '거래 취소에 실패했습니다.');
    }
  }
);

export const sendTradeEmail = createAsyncThunk(
  'tradeStatus/sendTradeEmail',
  async ({ tradeD, tradeSequ, vendorId }: { tradeD: string; tradeSequ: number; vendorId?: string }, { rejectWithValue }) => {
    try {
      const result = await tradeStatusService.sendTradeEmail(tradeD, tradeSequ, vendorId);
      return { result, tradeD, tradeSequ };
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || '이메일 전송에 실패했습니다.');
    }
  }
);

export const updateTradeStatus = createAsyncThunk(
  'tradeStatus/updateTradeStatus',
  async ({ tradeIds, status, userId }: { tradeIds: string[]; status: string; userId: string }, { rejectWithValue }) => {
    try {
      // TODO: 백엔드 API 구현 후 활성화
      console.log('updateTradeStatus called:', { tradeIds, status, userId });
      return { result: { success: true }, tradeIds, status };
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || '상태 변경에 실패했습니다.');
    }
  }
);

export const copyTrade = createAsyncThunk(
  'tradeStatus/copyTrade',
  async ({ tradeD, tradeSequ, userId }: { tradeD: string; tradeSequ: number; userId: string }, { rejectWithValue }) => {
    try {
      // TODO: 백엔드 API 구현 후 활성화
      console.log('copyTrade called:', { tradeD, tradeSequ, userId });
      return { result: { success: true }, tradeD, tradeSequ };
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || '거래 복사에 실패했습니다.');
    }
  }
);

// Slice 생성
const tradeStatusSlice = createSlice({
  name: 'tradeStatus',
  initialState,
  reducers: {
    // 검색 조건 설정
    setSearchParams: (state, action: PayloadAction<Partial<TradeListSearchParams>>) => {
      state.searchParams = { ...state.searchParams, ...action.payload };
    },
    
    // 페이지 설정
    setPage: (state, action: PayloadAction<number>) => {
      state.pageNum = action.payload;
      state.searchParams.pageNum = action.payload;
    },
    
    // 페이지 크기 설정
    setPageSize: (state, action: PayloadAction<number>) => {
      state.pageSize = action.payload;
      state.searchParams.pageSize = action.payload;
      state.pageNum = 1;
      state.searchParams.pageNum = 1;
    },
    
    // 정렬 설정
    setSorting: (state, action: PayloadAction<{ column: string; direction: 'ASC' | 'DESC' }>) => {
      state.searchParams.sortColumn = action.payload.column;
      state.searchParams.sortDirection = action.payload.direction;
    },
    
    // 선택된 거래 설정
    setSelectedTrades: (state, action: PayloadAction<string[]>) => {
      state.selectedTrades = action.payload;
    },
    
    // 거래 선택/해제
    toggleTradeSelection: (state, action: PayloadAction<string>) => {
      const tradeId = action.payload;
      const index = state.selectedTrades.indexOf(tradeId);
      if (index > -1) {
        state.selectedTrades.splice(index, 1);
      } else {
        state.selectedTrades.push(tradeId);
      }
    },
    
    // 전체 선택/해제
    toggleAllTradesSelection: (state) => {
      if (state.selectedTrades.length === state.tradeList.length) {
        state.selectedTrades = [];
      } else {
        state.selectedTrades = state.tradeList.map(trade => `${trade.orderD}-${trade.orderSequ}`);
      }
    },
    
    // 취소 모달 표시/숨김
    setShowCancelModal: (state, action: PayloadAction<boolean>) => {
      state.showCancelModal = action.payload;
      if (!action.payload) {
        state.selectedTradeForCancel = null;
      }
    },
    
    // 상세 모달 표시/숨김
    setShowDetailModal: (state, action: PayloadAction<boolean>) => {
      state.showDetailModal = action.payload;
      if (!action.payload) {
        state.selectedTradeForDetail = null;
      }
    },
    
    // 통계 모달 표시/숨김
    setShowStatisticsModal: (state, action: PayloadAction<boolean>) => {
      state.showStatisticsModal = action.payload;
    },
    
    // 취소할 거래 설정
    setSelectedTradeForCancel: (state, action: PayloadAction<TradeListItem | null>) => {
      state.selectedTradeForCancel = action.payload;
    },
    
    // 상세보기할 거래 설정
    setSelectedTradeForDetail: (state, action: PayloadAction<TradeListItem | null>) => {
      state.selectedTradeForDetail = action.payload;
    },
    
    // 에러 초기화
    clearError: (state) => {
      state.error = null;
    },
    
    // 상태 초기화
    resetState: () => defaultInitialState,
    
    // 상태 저장 (수동)
    saveState: (state) => {
      saveStateToStorage(state);
    },
  },
  extraReducers: (builder) => {
    builder
      // 거래 리스트 조회
      .addCase(searchTradeList.pending, (state) => {
        state.isSearching = true;
        state.error = null;
      })
      .addCase(searchTradeList.fulfilled, (state, action) => {
        console.log('🔍 [Redux] searchTradeList.fulfilled - action.payload:', action.payload);
        state.isSearching = false;
        state.tradeList = action.payload.orderList;
        state.totalCount = action.payload.totalCount;
        state.pageNum = action.payload.pageNum || 1;
        // pageSize는 현재 설정된 값을 유지 (서버 응답으로 덮어쓰지 않음)
        state.totalPages = action.payload.totalPages;
        state.selectedTrades = [];
        console.log('🔍 [Redux] state 업데이트 후:', {
          tradeListLength: state.tradeList.length,
          totalCount: state.totalCount,
          pageNum: state.pageNum,
          pageSize: state.pageSize,
          totalPages: state.totalPages
        });
      })
      .addCase(searchTradeList.rejected, (state, action) => {
        state.isSearching = false;
        state.error = action.payload as string;
      })
      
      // 통계 조회
      .addCase(getTradeStatistics.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(getTradeStatistics.fulfilled, (state, action) => {
        state.isLoading = false;
        state.statistics = action.payload;
      })
      .addCase(getTradeStatistics.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      
      // 취소 사유 조회
      .addCase(getTradeCancelReasons.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(getTradeCancelReasons.fulfilled, (state, action) => {
        state.isLoading = false;
        state.cancelReasons = action.payload;
      })
      .addCase(getTradeCancelReasons.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      
      // 거래 취소
      .addCase(cancelTrade.pending, (state) => {
        state.isCancelling = true;
        state.error = null;
      })
      .addCase(cancelTrade.fulfilled, (state, action) => {
        state.isCancelling = false;
        state.showCancelModal = false;
        state.selectedTradeForCancel = null;
        // 취소된 거래의 상태를 업데이트
        const { tradeD, tradeSequ } = action.payload;
        const tradeIndex = state.tradeList.findIndex(
          trade => trade.orderD === tradeD && trade.orderSequ === tradeSequ
        );
        if (tradeIndex !== -1) {
          state.tradeList[tradeIndex].orderStatus = '취소됨';
        }
      })
      .addCase(cancelTrade.rejected, (state, action) => {
        state.isCancelling = false;
        state.error = action.payload as string;
      })
      
      // 이메일 전송
      .addCase(sendTradeEmail.pending, (state) => {
        state.isUpdating = true;
        state.error = null;
      })
      .addCase(sendTradeEmail.fulfilled, (state) => {
        state.isUpdating = false;
      })
      .addCase(sendTradeEmail.rejected, (state, action) => {
        state.isUpdating = false;
        state.error = action.payload as string;
      })
      
      // 상태 변경
      .addCase(updateTradeStatus.pending, (state) => {
        state.isUpdating = true;
        state.error = null;
      })
      .addCase(updateTradeStatus.fulfilled, (state, action) => {
        state.isUpdating = false;
        state.selectedTrades = [];
        // 상태가 변경된 거래들을 업데이트
        const { tradeIds, status } = action.payload;
        tradeIds.forEach(tradeId => {
          const [tradeD, tradeSequ] = tradeId.split('-');
          const tradeIndex = state.tradeList.findIndex(
            trade => trade.orderD === tradeD && trade.orderSequ === parseInt(tradeSequ)
          );
          if (tradeIndex !== -1) {
            state.tradeList[tradeIndex].orderStatus = status;
          }
        });
      })
      .addCase(updateTradeStatus.rejected, (state, action) => {
        state.isUpdating = false;
        state.error = action.payload as string;
      })
      
      // 거래 복사
      .addCase(copyTrade.pending, (state) => {
        state.isUpdating = true;
        state.error = null;
      })
      .addCase(copyTrade.fulfilled, (state) => {
        state.isUpdating = false;
      })
      .addCase(copyTrade.rejected, (state, action) => {
        state.isUpdating = false;
        state.error = action.payload as string;
      });
  },
});

// 액션 내보내기
export const {
  setSearchParams,
  setPage,
  setPageSize,
  setSorting,
  setSelectedTrades,
  toggleTradeSelection,
  toggleAllTradesSelection,
  setShowCancelModal,
  setShowDetailModal,
  setShowStatisticsModal,
  setSelectedTradeForCancel,
  setSelectedTradeForDetail,
  clearError,
  resetState,
  saveState,
} = tradeStatusSlice.actions;

// 리듀서 내보내기
export default tradeStatusSlice.reducer;

// 셀렉터들
export const selectTradeList = (state: { tradeStatus: TradeStatusState }) => 
  state.tradeStatus.tradeList;

export const selectSearchParams = (state: { tradeStatus: TradeStatusState }) => 
  state.tradeStatus.searchParams;

export const selectSelectedTrades = (state: { tradeStatus: TradeStatusState }) => 
  state.tradeStatus.selectedTrades;

export const selectStatistics = (state: { tradeStatus: TradeStatusState }) => 
  state.tradeStatus.statistics;

export const selectCancelReasons = (state: { tradeStatus: TradeStatusState }) => 
  state.tradeStatus.cancelReasons;

export const selectIsLoading = (state: { tradeStatus: TradeStatusState }) => 
  state.tradeStatus.isLoading;

export const selectIsSearching = (state: { tradeStatus: TradeStatusState }) => 
  state.tradeStatus.isSearching;

export const selectError = (state: { tradeStatus: TradeStatusState }) => 
  state.tradeStatus.error;

// 메모이제이션된 selector들
export const selectPagination = createSelector(
  [(state: { tradeStatus: TradeStatusState }) => state.tradeStatus],
  (tradeStatus) => ({
    pageNum: tradeStatus.pageNum,
    pageSize: tradeStatus.pageSize,
    totalCount: tradeStatus.totalCount,
    totalPages: tradeStatus.totalPages,
  })
);

export const selectModalStates = createSelector(
  [(state: { tradeStatus: TradeStatusState }) => state.tradeStatus],
  (tradeStatus) => ({
    showCancelModal: tradeStatus.showCancelModal,
    showDetailModal: tradeStatus.showDetailModal,
    showStatisticsModal: tradeStatus.showStatisticsModal,
    selectedTradeForCancel: tradeStatus.selectedTradeForCancel,
    selectedTradeForDetail: tradeStatus.selectedTradeForDetail,
  })
);
