import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';

// 메뉴 아이템 타입 정의
export interface MenuItem {
  menu_id: number;
  menu_name: string;
  menu_description: string;
  menu_url: string;
  menu_icon: string;
  menu_order: number;
  menu_level: number;
  menu_parent_id: number | null;
  menu_type: string;
  menu_status: string;
}

// 메뉴 상태 타입 정의
interface MenuState {
  menus: MenuItem[];
  loading: boolean;
  error: string | null;
}

// 초기 상태
const initialState: MenuState = {
  menus: [],
  loading: false,
  error: null,
};

// 사용자 메뉴 조회 API 호출
export const fetchUserMenus = createAsyncThunk(
  'menu/fetchUserMenus',
  async (userId: number, { rejectWithValue }) => {
    try {
      //console.log('메뉴 조회 시작 - userId:', userId);
      
      const response = await fetch(`/api/menus/user/${userId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        // API 응답 실패 시 에러 반환
        //console.log('API 응답 실패. Status:', response.status, response.statusText);
        return rejectWithValue(`메뉴 데이터를 불러올 수 없습니다: ${response.status} ${response.statusText}`);
      }

      // 실제 API 데이터 사용
      const data = await response.json();
      console.log('API 응답 데이터:', data);

      if (data.result_code === 0) {
        //console.log('✅ DB에서 메뉴 데이터를 성공적으로 가져왔습니다:', data.menus);
        //console.log('메뉴 개수:', data.menus?.length || 0);
        return data.menus;
      } else {
        //console.log('❌ API 응답 에러:', data.result_message);
        return rejectWithValue(data.result_message);
      }
    } catch (error) {
      //console.log('API 호출 실패:', error);
      // 에러 발생 시 에러 반환
      return rejectWithValue('메뉴 데이터를 불러올 수 없습니다.');
    }
  }
);


// 메뉴 Slice 생성
const menuSlice = createSlice({
  name: 'menu',
  initialState,
  reducers: {
    // 메뉴 초기화
    clearMenus: (state) => {
      state.menus = [];
      state.error = null;
    },
    // 에러 초기화
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // 메뉴 조회 시작
      .addCase(fetchUserMenus.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      // 메뉴 조회 성공
      .addCase(fetchUserMenus.fulfilled, (state, action: PayloadAction<MenuItem[]>) => {
        state.loading = false;
        state.menus = action.payload;
        state.error = null;
        //console.log('메뉴 데이터 저장 완료:', action.payload);
      })
      // 메뉴 조회 실패
      .addCase(fetchUserMenus.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
        //console.log('메뉴 데이터 로드 실패:', action.payload);
      });
  },
});

// 액션 내보내기
export const { clearMenus, clearError } = menuSlice.actions;

// 리듀서 내보내기
export default menuSlice.reducer;