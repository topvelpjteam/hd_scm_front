import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { resetAllStates, clearAllData } from './globalActions';

// 로그인 요청 타입 정의
interface LoginRequest {
  loginId: string;
  password: string;
  ipAddress?: string;
  userAgent?: string;
}

// 로그인 응답 타입 정의
interface LoginResponse {
  result_code: number;
  result_message: string;
  user_id?: number;
  user_name?: string;
  user_email?: string;
  role_id?: number;
  role_name?: string;
  role_level?: number;
  session_id?: string;
  agent_id?: string; // AGENT_ID 추가
  store_id?: string; // STORE_ID 추가
  user_gender?: string; // USER_GENDER 추가
  store_name?: string; // STORE_NAME 추가
  agent_name?: string; // AGENT_NAME 추가
}

// 사용자 정보 타입 정의
interface UserInfo {
  userId: number;
  userName: string;
  userEmail: string;
  roleId: number;
  roleName: string;
  roleLevel: number;
  sessionId: string;
  agentId?: string; // AGENT_ID 추가
  storeId?: string; // STORE_ID 추가
  userGender?: string; // USER_GENDER 추가
  storeName?: string; // STORE_NAME 추가
  agentName?: string; // AGENT_NAME 추가
}

// 인증 상태 타입 정의
interface AuthState {
  isAuthenticated: boolean;
  user: UserInfo | null;
  loading: boolean;
  error: string | null;
  loginAttempts: number;
}

// 초기 상태
const initialState: AuthState = {
  isAuthenticated: false,
  user: null,
  loading: false,
  error: null,
  loginAttempts: 0,
};

// 로그인 API 호출 (비동기 액션)
export const loginUser = createAsyncThunk(
  'auth/loginUser',
  async (loginData: LoginRequest, { rejectWithValue }) => {
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(loginData),
      });

      const data: LoginResponse = await response.json();
      
      // 디버깅을 위한 로그 출력
      console.log('🔍 로그인 응답 전체:', data);
      console.log('🔍 agent_id 값:', data.agent_id);
      console.log('🔍 agent_id 타입:', typeof data.agent_id);
      console.log('🔍 store_id 값:', data.store_id);
      console.log('🔍 store_id 타입:', typeof data.store_id);
      console.log('🔍 user_gender 값:', data.user_gender);
      console.log('🔍 user_gender 타입:', typeof data.user_gender);
      console.log('🔍 store_name 값:', data.store_name);
      console.log('🔍 store_name 타입:', typeof data.store_name);
      console.log('🔍 agent_name 값:', data.agent_name);
      console.log('🔍 agent_name 타입:', typeof data.agent_name);

      if (data.result_code === 0) {
        // 로그인 성공
        const userInfo = {
          userId: data.user_id!,
          userName: data.user_name!,
          userEmail: data.user_email!,
          roleId: data.role_id!,
          roleName: data.role_name!,
          roleLevel: data.role_level!,
          sessionId: data.session_id!,
          agentId: data.agent_id, // AGENT_ID 추가
          storeId: data.store_id, // STORE_ID 추가
          userGender: data.user_gender, // USER_GENDER 추가
          storeName: data.store_name, // STORE_NAME 추가
          agentName: data.agent_name, // AGENT_NAME 추가
        };
        
        console.log('🔍 생성된 사용자 정보:', userInfo);
        return userInfo;
      } else {
        // 로그인 실패 - 구체적인 에러 메시지 반환
        let errorMessage = data.result_message;
        
        // 보안을 위해 모든 로그인 실패를 동일한 메시지로 처리
        // (아이디 존재 여부를 노출하지 않음)
        if (data.result_code === 1 || data.result_code === 4) {
          errorMessage = '아이디/패스워드가 일치하지 않습니다.';
        }
        // 계정 잠금, 비활성화, 시스템 오류는 구체적인 메시지 유지
        
        return rejectWithValue(errorMessage);
      }
    } catch (error) {
      return rejectWithValue('서버 연결 오류가 발생했습니다.');
    }
  }
);

// 로그아웃 API 호출 (비동기 액션)
export const logoutUser = createAsyncThunk(
  'auth/logoutUser',
  async (sessionId: string, { rejectWithValue }) => {
    try {
      const response = await fetch('/api/auth/logout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ sessionId }),
      });

      const data = await response.json();

      if (data.result_code === 0) {
        return true;
      } else {
        return rejectWithValue(data.result_message);
      }
    } catch (error) {
      return rejectWithValue('로그아웃 처리 중 오류가 발생했습니다.');
    }
  }
);

// 인증 Slice 생성
const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    // 로그인 시도 횟수 증가
    incrementLoginAttempts: (state) => {
      state.loginAttempts += 1;
    },
    // 로그인 시도 횟수 초기화
    resetLoginAttempts: (state) => {
      state.loginAttempts = 0;
    },
    // 에러 메시지 초기화
    clearError: (state) => {
      state.error = null;
    },
    // 로그인 상태 초기화 (페이지 새로고침 시)
    initializeAuth: (state) => {
      // sessionStorage에서만 사용자 정보 확인 (브라우저 종료 시 자동 삭제)
      const savedUser = sessionStorage.getItem('user');
      
      if (savedUser) {
        try {
          state.user = JSON.parse(savedUser);
          state.isAuthenticated = true;
        } catch (error) {
          // 오류 발생 시 sessionStorage에서 제거
          sessionStorage.removeItem('user');
          sessionStorage.removeItem('session_start');
          sessionStorage.removeItem('last_activity');
        }
      }
    },
    // 로그아웃 (동기 액션)
    logout: (state) => {
      state.isAuthenticated = false;
      state.user = null;
      state.loginAttempts = 0;
      state.error = null;
      // sessionStorage에서 사용자 정보 제거
      sessionStorage.removeItem('user');
      sessionStorage.removeItem('last_activity');
      sessionStorage.removeItem('session_start');
      // localStorage도 정리 (혹시 모를 경우를 대비)
      localStorage.removeItem('user');
      localStorage.removeItem('last_activity');
      localStorage.removeItem('session_start');
    },
    
    // 전체 상태 초기화 (로그아웃 시 모든 상태 정리)
    clearAllState: (state) => {
      // 인증 상태 초기화
      state.isAuthenticated = false;
      state.user = null;
      state.loginAttempts = 0;
      state.error = null;
      state.loading = false;
      
      // 로컬 스토리지 및 세션 스토리지 전체 정리
      localStorage.clear();
      sessionStorage.clear();
    },
  },
  extraReducers: (builder) => {
    builder
      // 로그인 처리 중
      .addCase(loginUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      // 로그인 성공
      .addCase(loginUser.fulfilled, (state, action: PayloadAction<UserInfo>) => {
        state.loading = false;
        state.isAuthenticated = true;
        state.user = action.payload;
        state.loginAttempts = 0;
        state.error = null;
        // sessionStorage에만 사용자 정보 저장 (브라우저 종료 시 자동 삭제)
        const userInfo = JSON.stringify(action.payload);
        sessionStorage.setItem('user', userInfo);
        // 세션 시작 시간 기록 (sessionStorage에만 저장)
        const now = Date.now();
        sessionStorage.setItem('session_start', now.toString());
        sessionStorage.setItem('last_activity', now.toString());
      })
      // 로그인 실패
      .addCase(loginUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
        state.loginAttempts += 1;
      })
      // 로그아웃 처리 중
      .addCase(logoutUser.pending, (state) => {
        state.loading = true;
      })
      // 로그아웃 성공
      .addCase(logoutUser.fulfilled, (state) => {
        state.loading = false;
        state.isAuthenticated = false;
        state.user = null;
        state.loginAttempts = 0;
        state.error = null;
        // 로컬 스토리지 및 세션 스토리지 전체 정리
        localStorage.clear();
        sessionStorage.clear();
      })
      // 로그아웃 실패
      .addCase(logoutUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // 글로벌 상태 초기화 처리 (로그아웃 시에만)
      .addCase(resetAllStates, () => {
        // 로컬 스토리지 및 세션 스토리지 정리
        localStorage.clear();
        sessionStorage.clear();
        return initialState;
      })
      // 브라우저 종료 시 데이터 정리 (세션 스토리지만 정리)
      .addCase(clearAllData, (state) => {
        // 세션 스토리지만 정리 (로컬 스토리지는 새로고침 시 복원을 위해 유지)
        sessionStorage.clear();
        // Redux 상태는 유지 (새로고침 시 initializeAuth에서 복원)
        return state;
      });
  },
});

// 액션 생성자 내보내기
export const {
  incrementLoginAttempts,
  resetLoginAttempts,
  clearError,
  initializeAuth,
  logout,
  clearAllState,
} = authSlice.actions;

// 리듀서 내보내기
export default authSlice.reducer;
