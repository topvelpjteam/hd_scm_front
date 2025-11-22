import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import type { OrderSummary } from '../services/orderConfirmService';
import type { OrderData, SearchCondition, ShipmentField } from '../types/orderConfirm';
import { createDefaultSearchCondition } from '../types/orderConfirm';
import { resetAllStates, clearAllData } from './globalActions';

interface OrderConfirmState {
  searchCondition: SearchCondition;
  orderSummaries: OrderSummary[];
  selectedSummary: OrderSummary | null;
  orderLines: OrderData[];
  originalOrderLines: OrderData[];
  isInitialized: boolean;
}

const initialState: OrderConfirmState = {
  searchCondition: createDefaultSearchCondition(),
  orderSummaries: [],
  selectedSummary: null,
  orderLines: [],
  originalOrderLines: [],
  isInitialized: false
};

const orderConfirmSlice = createSlice({
  name: 'orderConfirm',
  initialState,
  reducers: {
    setSearchCondition: (state, action: PayloadAction<Partial<SearchCondition>>) => {
      state.searchCondition = {
        ...state.searchCondition,
        ...action.payload
      };
    },
    setOrderSummaries: (state, action: PayloadAction<OrderSummary[]>) => {
      state.orderSummaries = action.payload;
    },
    setSelectedSummary: (state, action: PayloadAction<OrderSummary | null>) => {
      state.selectedSummary = action.payload;
    },
    updateSelectedSummary: (state, action: PayloadAction<Partial<OrderSummary>>) => {
      if (state.selectedSummary) {
        state.selectedSummary = {
          ...state.selectedSummary,
          ...action.payload
        };
      }
    },
    setOrderLines: (state, action: PayloadAction<OrderData[]>) => {
      state.orderLines = action.payload;
    },
    setOriginalOrderLines: (state, action: PayloadAction<OrderData[]>) => {
      state.originalOrderLines = action.payload;
    },
    updateOrderLine: (state, action: PayloadAction<{ index: number; changes: Partial<OrderData> }>) => {
      const { index, changes } = action.payload;
      if (state.orderLines[index]) {
        state.orderLines[index] = {
          ...state.orderLines[index],
          ...changes
        };
      }
    },
    updateOrderLinesField: (state, action: PayloadAction<{ field: ShipmentField; value: string }>) => {
      const { field, value } = action.payload;
      state.orderLines = state.orderLines.map(line => ({
        ...line,
        [field]: value
      }));
    },
    resetSelection: (state) => {
      state.selectedSummary = null;
      state.orderLines = [];
      state.originalOrderLines = [];
    },
    initializeScreen: (state) => {
      state.isInitialized = true;
    },
    resetInitialization: (state) => {
      state.isInitialized = false;
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(resetAllStates, () => initialState)
      .addCase(clearAllData, (state) => state);
  }
});

export const {
  setSearchCondition,
  setOrderSummaries,
  setSelectedSummary,
  updateSelectedSummary,
  setOrderLines,
  setOriginalOrderLines,
  updateOrderLine,
  updateOrderLinesField,
  resetSelection,
  initializeScreen,
  resetInitialization
} = orderConfirmSlice.actions;

export type { OrderConfirmState };

export default orderConfirmSlice.reducer;

