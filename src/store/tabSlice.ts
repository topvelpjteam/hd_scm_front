import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { resetAllStates, clearAllData } from './globalActions';

export interface Tab {
  id: string;
  title: string;
  component: string;
  url?: string;
  closable?: boolean;
  menuIcon?: string; // 메뉴 아이콘 (데이터베이스에서 가져온 값)
  openedAt?: number; // 탭이 열린 시간
  closedAt?: number; // 탭이 닫힌 시간
}

interface TabState {
  tabs: Tab[];
  activeTabId: string | null;
  closedTabHistory: Tab[]; // 닫힌 탭 히스토리
  expandedGroups: string[]; // Dashboard에서 펼쳐진 그룹들
}

const initialState: TabState = {
  tabs: [],
  activeTabId: null,
  closedTabHistory: [],
  expandedGroups: []
};

const tabSlice = createSlice({
  name: 'tabs',
  initialState,
  reducers: {
    addTab: (state, action: PayloadAction<Tab>) => {
      // 이미 같은 탭이 있는지 확인 (ID, 컴포넌트, URL 모두 체크)
      const existingTab = state.tabs.find(tab => 
        tab.id === action.payload.id || 
        (tab.component === action.payload.component && tab.url === action.payload.url)
      );
      if (existingTab) {
        // 기존 탭을 활성화
        state.activeTabId = existingTab.id;
        return;
      }
      
      // 닫힌 탭 히스토리에서 해당 탭 제거 (다시 열었으므로)
      state.closedTabHistory = state.closedTabHistory.filter(tab => tab.id !== action.payload.id);
      
      // 탭에 열린 시간 추가
      const newTab = {
        ...action.payload,
        openedAt: Date.now()
      };
      
      state.tabs.push(newTab);
      state.activeTabId = newTab.id;
    },
    
    removeTab: (state, action: PayloadAction<string>) => {
      const tabIndex = state.tabs.findIndex(tab => tab.id === action.payload);
      if (tabIndex !== -1) {
        const removedTab = state.tabs[tabIndex];
        
        // 닫힌 탭에 닫힌 시간 추가
        const closedTab = {
          ...removedTab,
          closedAt: Date.now()
        };
        
        // 닫힌 탭을 히스토리에 추가 (최대 20개)
        state.closedTabHistory.unshift(closedTab);
        if (state.closedTabHistory.length > 20) {
          state.closedTabHistory = state.closedTabHistory.slice(0, 20);
        }
        
        state.tabs.splice(tabIndex, 1);
        
        // 활성 탭이 삭제된 경우, 이전 탭을 활성화
        if (state.activeTabId === action.payload) {
          if (state.tabs.length > 0) {
            const newActiveTab = state.tabs[tabIndex - 1] || state.tabs[0];
            state.activeTabId = newActiveTab.id;
          } else {
            state.activeTabId = null;
          }
        }
      }
    },
    
    setActiveTab: (state, action: PayloadAction<string>) => {
      state.activeTabId = action.payload;
    },
    
    clearAllTabs: (state) => {
      state.tabs = [];
      state.activeTabId = null;
    },
    
    clearClosedTabHistory: (state) => {
      state.closedTabHistory = [];
    },
    
    // Dashboard 그룹 펼치기/접기 관리
    toggleGroup: (state, action: PayloadAction<string>) => {
      const groupId = action.payload;
      if (state.expandedGroups.includes(groupId)) {
        state.expandedGroups = state.expandedGroups.filter(id => id !== groupId);
      } else {
        state.expandedGroups.push(groupId);
      }
    },
    
    setExpandedGroups: (state, action: PayloadAction<string[]>) => {
      state.expandedGroups = action.payload;
    },
    
    clearExpandedGroups: (state) => {
      state.expandedGroups = [];
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
  addTab, 
  removeTab, 
  setActiveTab, 
  clearAllTabs, 
  toggleGroup, 
  setExpandedGroups, 
  clearExpandedGroups 
} = tabSlice.actions;
export default tabSlice.reducer;
