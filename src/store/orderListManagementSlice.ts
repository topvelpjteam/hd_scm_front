/**
 * 발주 리스트 관리 Redux Slice
 * 발주 리스트 조회, 취소, 통계 등의 상태를 관리합니다.
 */

import { createSlice, createAsyncThunk, PayloadAction, createSelector } from '@reduxjs/toolkit';
import { 
  OrderListItem, 
  OrderListSearchParams, 
  OrderCancelParams, 
  CancelReason, 
  OrderStatistics 
} from '../services/orderListManagementService';
import * as orderListService from '../services/orderListManagementService';

// 상태 타입 정의
interface OrderListManagementState {
  // 조회 관련
  orderList: OrderListItem[];
  totalCount: number;
  pageNum: number;
  pageSize: number;
  totalPages: number;
  
  // 검색 조건
  searchParams: OrderListSearchParams;
  
  // 선택된 발주
  selectedOrders: string[];
  
  // 통계 정보
  statistics: OrderStatistics | null;
  
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
  selectedOrderForCancel: OrderListItem | null;
  selectedOrderForDetail: OrderListItem | null;
}

// 상태 복원을 위한 키
const OLM_STATE_KEY = 'olm_state';

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
const defaultInitialState: OrderListManagementState = {
  orderList: [],
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
  
  selectedOrders: [],
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
  selectedOrderForCancel: null,
  selectedOrderForDetail: null,
};

// 상태 저장 함수
const saveStateToStorage = (state: OrderListManagementState) => {
  try {
    const stateToSave = {
      searchParams: state.searchParams,
      pageNum: state.pageNum,
      pageSize: state.pageSize,
      // 모달 상태는 저장하지 않음 (사용자 경험상 모달은 닫힌 상태로 복원)
      showCancelModal: false,
      showDetailModal: false,
      showStatisticsModal: false,
      selectedOrderForCancel: null,
      selectedOrderForDetail: null,
    };
    localStorage.setItem(OLM_STATE_KEY, JSON.stringify(stateToSave));
  } catch (error) {
    console.warn('OLM 상태 저장 실패:', error);
  }
};

// 상태 복원 함수
const loadStateFromStorage = (): Partial<OrderListManagementState> => {
  try {
    const savedState = localStorage.getItem(OLM_STATE_KEY);
    if (savedState) {
      const parsedState = JSON.parse(savedState);
      if (parsedState?.searchParams) {
        parsedState.searchParams = {
          ...parsedState.searchParams,
          orderDateFrom: defaultDateRange.from,
          orderDateTo: defaultDateRange.to,
        };
      }
      return parsedState;
    }
  } catch (error) {
    console.warn('OLM 상태 복원 실패:', error);
  }
  return {};
};

// 저장된 상태를 복원한 초기 상태
const initialState: OrderListManagementState = {
  ...defaultInitialState,
  ...loadStateFromStorage(),
};

// 비동기 액션들
export const searchOrderList = createAsyncThunk(
  'orderListManagement/searchOrderList',
  async (params: OrderListSearchParams, { rejectWithValue }) => {
    try {
      const response = await orderListService.getOrderList(params);
      return response;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || '발주 리스트 조회에 실패했습니다.');
    }
  }
);

export const getOrderStatistics = createAsyncThunk(
  'orderListManagement/getOrderStatistics',
  async (params: OrderListSearchParams, { rejectWithValue }) => {
    try {
      const statistics = await orderListService.getOrderStatistics(params);
      return statistics;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || '통계 조회에 실패했습니다.');
    }
  }
);

export const getCancelReasons = createAsyncThunk(
  'orderListManagement/getCancelReasons',
  async (_, { rejectWithValue }) => {
    try {
      const reasons = await orderListService.getCancelReasons();
      return reasons;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || '취소 사유 조회에 실패했습니다.');
    }
  }
);

export const cancelOrder = createAsyncThunk(
  'orderListManagement/cancelOrder',
  async (params: OrderCancelParams, { rejectWithValue }) => {
    try {
      const result = await orderListService.cancelOrder(params);
      return { result, orderD: params.orderD, orderSequ: params.orderSequ };
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || '발주 취소에 실패했습니다.');
    }
  }
);

export const sendOrderEmail = createAsyncThunk(
  'orderListManagement/sendOrderEmail',
  async ({ orderD, orderSequ, vendorId }: { orderD: string; orderSequ: number; vendorId?: string }, { rejectWithValue }) => {
    try {
      const result = await orderListService.sendOrderEmail(orderD, orderSequ, vendorId);
      return { result, orderD, orderSequ };
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || '이메일 전송에 실패했습니다.');
    }
  }
);

export const updateOrderStatus = createAsyncThunk(
  'orderListManagement/updateOrderStatus',
  async ({ orderIds, status, userId }: { orderIds: string[]; status: string; userId: string }, { rejectWithValue }) => {
    try {
      const result = await orderListService.updateOrderStatus(orderIds, status, userId);
      return { result, orderIds, status };
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || '상태 변경에 실패했습니다.');
    }
  }
);

export const copyOrder = createAsyncThunk(
  'orderListManagement/copyOrder',
  async ({ orderD, orderSequ, userId }: { orderD: string; orderSequ: number; userId: string }, { rejectWithValue }) => {
    try {
      const result = await orderListService.copyOrder(orderD, orderSequ, userId);
      return { result, orderD, orderSequ };
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || '발주 복사에 실패했습니다.');
    }
  }
);

// Slice 생성
const orderListManagementSlice = createSlice({
  name: 'orderListManagement',
  initialState,
  reducers: {
    // 검색 조건 설정
    setSearchParams: (state, action: PayloadAction<Partial<OrderListSearchParams>>) => {
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
    
    // 선택된 발주 설정
    setSelectedOrders: (state, action: PayloadAction<string[]>) => {
      state.selectedOrders = action.payload;
    },
    
    // 발주 선택/해제
    toggleOrderSelection: (state, action: PayloadAction<string>) => {
      const orderId = action.payload;
      const index = state.selectedOrders.indexOf(orderId);
      if (index > -1) {
        state.selectedOrders.splice(index, 1);
      } else {
        state.selectedOrders.push(orderId);
      }
    },
    
    // 전체 선택/해제
    toggleAllOrdersSelection: (state) => {
      if (state.selectedOrders.length === state.orderList.length) {
        state.selectedOrders = [];
      } else {
        state.selectedOrders = state.orderList.map(order => `${order.orderD}-${order.orderSequ}`);
      }
    },
    
    // 취소 모달 표시/숨김
    setShowCancelModal: (state, action: PayloadAction<boolean>) => {
      state.showCancelModal = action.payload;
      if (!action.payload) {
        state.selectedOrderForCancel = null;
      }
    },
    
    // 상세 모달 표시/숨김
    setShowDetailModal: (state, action: PayloadAction<boolean>) => {
      state.showDetailModal = action.payload;
      if (!action.payload) {
        state.selectedOrderForDetail = null;
      }
    },
    
    // 통계 모달 표시/숨김
    setShowStatisticsModal: (state, action: PayloadAction<boolean>) => {
      state.showStatisticsModal = action.payload;
    },
    
    // 취소할 발주 설정
    setSelectedOrderForCancel: (state, action: PayloadAction<OrderListItem | null>) => {
      state.selectedOrderForCancel = action.payload;
    },
    
    // 상세보기할 발주 설정
    setSelectedOrderForDetail: (state, action: PayloadAction<OrderListItem | null>) => {
      state.selectedOrderForDetail = action.payload;
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
      // 발주 리스트 조회
      .addCase(searchOrderList.pending, (state) => {
        state.isSearching = true;
        state.error = null;
      })
      .addCase(searchOrderList.fulfilled, (state, action) => {
        console.log('🔍 [Redux] searchOrderList.fulfilled - action.payload:', action.payload);
        state.isSearching = false;
        state.orderList = action.payload.orderList;
        state.totalCount = action.payload.totalCount;
        state.pageNum = action.payload.pageNum || 1;
        // pageSize는 현재 설정된 값을 유지 (서버 응답으로 덮어쓰지 않음)
        state.totalPages = action.payload.totalPages;
        state.selectedOrders = [];
        console.log('🔍 [Redux] state 업데이트 후:', {
          orderListLength: state.orderList.length,
          totalCount: state.totalCount,
          pageNum: state.pageNum,
          pageSize: state.pageSize,
          totalPages: state.totalPages
        });
      })
      .addCase(searchOrderList.rejected, (state, action) => {
        state.isSearching = false;
        state.error = action.payload as string;
      })
      
      // 통계 조회
      .addCase(getOrderStatistics.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(getOrderStatistics.fulfilled, (state, action) => {
        state.isLoading = false;
        state.statistics = action.payload;
      })
      .addCase(getOrderStatistics.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      
      // 취소 사유 조회
      .addCase(getCancelReasons.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(getCancelReasons.fulfilled, (state, action) => {
        state.isLoading = false;
        state.cancelReasons = action.payload;
      })
      .addCase(getCancelReasons.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      
      // 발주 취소
      .addCase(cancelOrder.pending, (state) => {
        state.isCancelling = true;
        state.error = null;
      })
      .addCase(cancelOrder.fulfilled, (state, action) => {
        state.isCancelling = false;
        state.showCancelModal = false;
        state.selectedOrderForCancel = null;
        // 취소된 발주의 상태를 업데이트
        const { orderD, orderSequ } = action.payload;
        const orderIndex = state.orderList.findIndex(
          order => order.orderD === orderD && order.orderSequ === orderSequ
        );
        if (orderIndex > -1) {
          state.orderList[orderIndex].orderStatus = '취소됨';
        }
      })
      .addCase(cancelOrder.rejected, (state, action) => {
        state.isCancelling = false;
        state.error = action.payload as string;
      })
      
      // 이메일 전송
      .addCase(sendOrderEmail.pending, (state) => {
        state.isUpdating = true;
        state.error = null;
      })
      .addCase(sendOrderEmail.fulfilled, (state) => {
        state.isUpdating = false;
      })
      .addCase(sendOrderEmail.rejected, (state, action) => {
        state.isUpdating = false;
        state.error = action.payload as string;
      })
      
      // 상태 변경
      .addCase(updateOrderStatus.pending, (state) => {
        state.isUpdating = true;
        state.error = null;
      })
      .addCase(updateOrderStatus.fulfilled, (state, action) => {
        state.isUpdating = false;
        state.selectedOrders = [];
        // 상태가 변경된 발주들을 업데이트
        const { orderIds, status } = action.payload;
        orderIds.forEach(orderId => {
          const [orderD, orderSequ] = orderId.split('-');
          const orderIndex = state.orderList.findIndex(
            order => order.orderD === orderD && order.orderSequ === parseInt(orderSequ)
          );
          if (orderIndex > -1) {
            state.orderList[orderIndex].orderStatus = status;
          }
        });
      })
      .addCase(updateOrderStatus.rejected, (state, action) => {
        state.isUpdating = false;
        state.error = action.payload as string;
      })
      
      // 발주 복사
      .addCase(copyOrder.pending, (state) => {
        state.isUpdating = true;
        state.error = null;
      })
      .addCase(copyOrder.fulfilled, (state) => {
        state.isUpdating = false;
      })
      .addCase(copyOrder.rejected, (state, action) => {
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
  setSelectedOrders,
  toggleOrderSelection,
  toggleAllOrdersSelection,
  setShowCancelModal,
  setShowDetailModal,
  setShowStatisticsModal,
  setSelectedOrderForCancel,
  setSelectedOrderForDetail,
  clearError,
  resetState,
  saveState,
} = orderListManagementSlice.actions;

// 리듀서 내보내기
export default orderListManagementSlice.reducer;

// 셀렉터들
export const selectOrderList = (state: { orderListManagement: OrderListManagementState }) => 
  state.orderListManagement.orderList;

export const selectSearchParams = (state: { orderListManagement: OrderListManagementState }) => 
  state.orderListManagement.searchParams;

export const selectSelectedOrders = (state: { orderListManagement: OrderListManagementState }) => 
  state.orderListManagement.selectedOrders;

export const selectStatistics = (state: { orderListManagement: OrderListManagementState }) => 
  state.orderListManagement.statistics;

export const selectCancelReasons = (state: { orderListManagement: OrderListManagementState }) => 
  state.orderListManagement.cancelReasons;

export const selectIsLoading = (state: { orderListManagement: OrderListManagementState }) => 
  state.orderListManagement.isLoading;

export const selectIsSearching = (state: { orderListManagement: OrderListManagementState }) => 
  state.orderListManagement.isSearching;

export const selectError = (state: { orderListManagement: OrderListManagementState }) => 
  state.orderListManagement.error;

// 메모이제이션된 selector들
export const selectPagination = createSelector(
  [(state: { orderListManagement: OrderListManagementState }) => state.orderListManagement],
  (orderListManagement) => ({
    pageNum: orderListManagement.pageNum,
    pageSize: orderListManagement.pageSize,
    totalCount: orderListManagement.totalCount,
    totalPages: orderListManagement.totalPages,
  })
);

export const selectModalStates = createSelector(
  [(state: { orderListManagement: OrderListManagementState }) => state.orderListManagement],
  (orderListManagement) => ({
    showCancelModal: orderListManagement.showCancelModal,
    showDetailModal: orderListManagement.showDetailModal,
    showStatisticsModal: orderListManagement.showStatisticsModal,
    selectedOrderForCancel: orderListManagement.selectedOrderForCancel,
    selectedOrderForDetail: orderListManagement.selectedOrderForDetail,
  })
);
