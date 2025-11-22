import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { resetAllStates, clearAllData } from './globalActions';

export interface CodeListState {
  searchTerm: string;
  selectedCategories: string[];
  selectedStatus: string;
  sortBy: string;
  selectedItems: string[];
  selectAll: boolean;
  showCategoryDropdown: boolean;
  categorySearchTerm: string;
}

const initialState: CodeListState = {
  searchTerm: '',
  selectedCategories: [],
  selectedStatus: 'all',
  sortBy: 'name',
  selectedItems: [],
  selectAll: false,
  showCategoryDropdown: false,
  categorySearchTerm: ''
};

const codeListSlice = createSlice({
  name: 'codeList',
  initialState,
  reducers: {
    setSearchTerm: (state, action: PayloadAction<string>) => {
      state.searchTerm = action.payload;
    },
    
    setSelectedCategories: (state, action: PayloadAction<string[]>) => {
      state.selectedCategories = action.payload;
    },
    
    setSelectedStatus: (state, action: PayloadAction<string>) => {
      state.selectedStatus = action.payload;
    },
    
    setSortBy: (state, action: PayloadAction<string>) => {
      state.sortBy = action.payload;
    },
    
    setSelectedItems: (state, action: PayloadAction<string[]>) => {
      state.selectedItems = action.payload;
    },
    
    setSelectAll: (state, action: PayloadAction<boolean>) => {
      state.selectAll = action.payload;
    },
    
    setShowCategoryDropdown: (state, action: PayloadAction<boolean>) => {
      state.showCategoryDropdown = action.payload;
    },
    
    setCategorySearchTerm: (state, action: PayloadAction<string>) => {
      state.categorySearchTerm = action.payload;
    },
    
    // 모든 상태를 한 번에 업데이트
    updateCodeListState: (state, action: PayloadAction<Partial<CodeListState>>) => {
      return { ...state, ...action.payload };
    },
    
    // 상태 초기화
    resetCodeListState: (state) => {
      return initialState;
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
  setSearchTerm,
  setSelectedCategories,
  setSelectedStatus,
  setSortBy,
  setSelectedItems,
  setSelectAll,
  setShowCategoryDropdown,
  setCategorySearchTerm,
  updateCodeListState,
  resetCodeListState
} = codeListSlice.actions;

export default codeListSlice.reducer;
