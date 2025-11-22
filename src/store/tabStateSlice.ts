import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { resetAllStates, clearAllData } from './globalActions';

// 각 탭의 상태를 저장하는 인터페이스
export interface TabState {
  [tabId: string]: {
    [key: string]: any; // 동적 상태 저장
  };
}

const initialState: TabState = {};

const tabStateSlice = createSlice({
  name: 'tabState',
  initialState,
  reducers: {
    // 특정 탭의 상태 업데이트
    updateTabState: (state, action: PayloadAction<{
      tabId: string;
      key: string;
      value: any;
    }>) => {
      const { tabId, key, value } = action.payload;
      if (!state[tabId]) {
        state[tabId] = {};
      }
      state[tabId][key] = value;
    },
    
    // 특정 탭의 여러 상태를 한 번에 업데이트
    updateTabStates: (state, action: PayloadAction<{
      tabId: string;
      states: { [key: string]: any };
    }>) => {
      const { tabId, states } = action.payload;
      if (!state[tabId]) {
        state[tabId] = {};
      }
      Object.assign(state[tabId], states);
    },
    
    // 특정 탭의 상태 초기화
    resetTabState: (state, action: PayloadAction<string>) => {
      const tabId = action.payload;
      delete state[tabId];
    },
    
    // 모든 탭 상태 초기화
    resetAllTabStates: (state) => {
      return {};
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

export const {
  updateTabState,
  updateTabStates,
  resetTabState,
  resetAllTabStates
} = tabStateSlice.actions;

export default tabStateSlice.reducer;
