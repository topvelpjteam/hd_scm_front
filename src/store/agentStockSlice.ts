import { createAsyncThunk, createSlice, PayloadAction } from '@reduxjs/toolkit';
import {
  AgentStockColumn,
  AgentStockResponse,
  AgentStockSearchParams,
  fetchAgentStock as fetchAgentStockApi,
} from '../services/agentStockService';

/**
 * YYYYMM 포맷 기준월 생성
 */
const getCurrentYyyymm = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = (now.getMonth() + 1).toString().padStart(2, '0');
  return `${year}${month}`;
};

/**
 * 스토어에 보관할 검색 조건 타입
 */
type AgentStockSearchState = Required<Pick<AgentStockSearchParams, 'targetMonth'>> &
  Omit<AgentStockSearchParams, 'targetMonth'>;

/**
 * 매장 재고 Slice 상태
 */
interface AgentStockState {
  searchParams: AgentStockSearchState;
  columns: AgentStockColumn[];
  rows: Array<Record<string, string | number | null>>;
  isLoading: boolean;
  error: string | null;
  lastUpdatedAt: string | null;
}

const initialState: AgentStockState = {
  searchParams: {
    targetMonth: getCurrentYyyymm(),
    brandIds: [],
    goodsGbns: [],
    mtypeList: [],
    stypeList: [],
    goodsIds: [],
    channelGbns: [],
    storeIds: [],
    loginAgentId: undefined,
  },
  columns: [],
  rows: [],
  isLoading: false,
  error: null,
  lastUpdatedAt: null,
};

/**
 * 매장 재고 조회 비동기 액션
 */
export const loadAgentStock = createAsyncThunk<
  AgentStockResponse,
  AgentStockSearchParams,
  { rejectValue: string }
>('agentStock/load', async (params, { rejectWithValue }) => {
  try {
    return await fetchAgentStockApi(params);
  } catch (error: any) {
    console.error('❌ 매장 재고 조회 실패:', error);
    const message = error?.message ?? '매장 재고 조회에 실패했습니다.';
    return rejectWithValue(message);
  }
});

/**
 * 배열 파라미터 정규화
 */
const normalizeArray = (values?: string[]) => {
  if (!values || values.length === 0) return [];
  return values
    .map((item) => item?.trim())
    .filter((item): item is string => !!item);
};

/**
 * Slice 정의
 */
const agentStockSlice = createSlice({
  name: 'agentStock',
  initialState,
  reducers: {
    /**
     * 검색 조건 갱신
     */
    setAgentStockSearchParams: (state, action: PayloadAction<AgentStockSearchParams>) => {
      const payload = action.payload;
      if (payload.targetMonth) {
        const digits = payload.targetMonth.replace(/[^0-9]/g, '');
        if (digits.length >= 6) {
          state.searchParams.targetMonth = digits.substring(0, 6);
        }
      }
      if (payload.brandIds) state.searchParams.brandIds = normalizeArray(payload.brandIds);
      if (payload.goodsGbns) state.searchParams.goodsGbns = normalizeArray(payload.goodsGbns);
      if (payload.mtypeList) state.searchParams.mtypeList = normalizeArray(payload.mtypeList);
      if (payload.stypeList) state.searchParams.stypeList = normalizeArray(payload.stypeList);
      if (payload.goodsIds) state.searchParams.goodsIds = normalizeArray(payload.goodsIds);
      if (payload.channelGbns)
        state.searchParams.channelGbns = normalizeArray(payload.channelGbns);
      if (payload.storeIds) state.searchParams.storeIds = normalizeArray(payload.storeIds);
      if (payload.loginAgentId !== undefined) {
        const trimmed = payload.loginAgentId?.trim();
        state.searchParams.loginAgentId = trimmed && trimmed.length > 0 ? trimmed : undefined;
      }
    },
    /**
     * 오류 상태 초기화
     */
    clearAgentStockError: (state) => {
      state.error = null;
    },
    /**
     * 데이터 초기화
     */
    resetAgentStockState: () => ({
      ...initialState,
      searchParams: { ...initialState.searchParams },
    }),
  },
  extraReducers: (builder) => {
    builder
      .addCase(loadAgentStock.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(loadAgentStock.fulfilled, (state, action) => {
        state.isLoading = false;
        const payload = action.payload;
        if (!payload.success) {
          state.error = payload.message || '매장 재고 조회에 실패했습니다.';
          state.columns = [];
          state.rows = [];
          return;
        }
        state.columns = payload.columns;
        state.rows = payload.rows;
        state.error = null;
        state.lastUpdatedAt = new Date().toISOString();
      })
      .addCase(loadAgentStock.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload || '매장 재고 조회에 실패했습니다.';
      });
  },
});

export const {
  setAgentStockSearchParams,
  clearAgentStockError,
  resetAgentStockState,
} = agentStockSlice.actions;

export default agentStockSlice.reducer;

// 셀렉터 정의
export const selectAgentStockState = (state: { agentStock: AgentStockState }) => state.agentStock;
export const selectAgentStockColumns = (state: { agentStock: AgentStockState }) =>
  state.agentStock.columns;
export const selectAgentStockRows = (state: { agentStock: AgentStockState }) =>
  state.agentStock.rows;
export const selectAgentStockSearchParams = (state: { agentStock: AgentStockState }) =>
  state.agentStock.searchParams;
export const selectAgentStockLoading = (state: { agentStock: AgentStockState }) =>
  state.agentStock.isLoading;
export const selectAgentStockError = (state: { agentStock: AgentStockState }) =>
  state.agentStock.error;
export const selectAgentStockLastUpdated = (state: { agentStock: AgentStockState }) =>
  state.agentStock.lastUpdatedAt;

