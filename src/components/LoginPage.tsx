import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState, AppDispatch } from '../store/store';
import { loginUser, clearError } from '../store/authSlice';
import { Eye, EyeOff, Lock, User, Shield } from 'lucide-react';
import { useGlobalLoading } from '../contexts/LoadingContext';
import './LoginPage.css';

const LoginPage: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { loading, error, loginAttempts } = useSelector((state: RootState) => state.auth);
  const { startLoading, stopLoading } = useGlobalLoading();

  const [loginId, setLoginId] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // 컴포넌트 마운트 시 에러 초기화 (한 번만 실행)
  useEffect(() => {
    // 페이지 첫 로드 시에만 에러 초기화
    if (!error) {
      dispatch(clearError());
    }
  }, []); // 빈 의존성 배열로 한 번만 실행

  // 로그인 폼 제출 처리
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!loginId.trim() || !password.trim()) {
      return;
    }

    // 전역 로딩 시작
    startLoading('로그인 중...');

    // IP 주소와 User Agent 정보 가져오기
    const ipAddress = '127.0.0.1'; // 실제 환경에서는 서버에서 IP를 가져와야 함
    const userAgent = navigator.userAgent;

    try {
      await dispatch(loginUser({
        loginId: loginId.trim(),
        password,
        ipAddress,
        userAgent,
      }));
    } finally {
      // 전역 로딩 종료
      stopLoading();
    }
  };
  
  // 비밀번호 표시/숨김 토글
  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  // 에러 타입 결정 함수
  const getErrorType = (errorMessage: string) => {
    if (errorMessage.includes('계정이 잠겼습니다') || errorMessage.includes('로그인 실패 횟수 초과')) {
      return 'account-locked';
    } else if (errorMessage.includes('아이디/패스워드가 일치하지 않습니다')) {
      return 'wrong-password';
    } else if (errorMessage.includes('비활성화된 계정') || errorMessage.includes('계정이 비활성화')) {
      return 'account-inactive';
    } else if (errorMessage.includes('시스템 오류')) {
      return 'system-error';
    }
    return 'general-error';
  };

  // 사용자 친화적 메시지 변환 함수
  const getUserFriendlyMessage = (errorMessage: string) => {
    if (errorMessage.includes('계정이 잠겼습니다') || errorMessage.includes('로그인 실패 횟수 초과')) {
      return '🔒 계정이 잠겼습니다';
    } else if (errorMessage.includes('아이디/패스워드가 일치하지 않습니다')) {
      return '🔑 아이디/패스워드가 올바르지 않습니다';
    } else if (errorMessage.includes('비활성화된 계정') || errorMessage.includes('계정이 비활성화')) {
      return '⏸️ 비활성화된 계정입니다';
    } else if (errorMessage.includes('시스템 오류')) {
      return '⚠️ 시스템 오류가 발생했습니다';
    }
    return errorMessage; // 기본 메시지 반환
  };


  // 로딩 상태는 전역 로더로 처리되므로 Redux loading 상태만 사용
  const isLoading = loading;

  return (
    <div className="login-container">
      {/* 🦌 브라우저 테두리를 따라 뛰는 귀여운 꽃사슴 - 임시 주석처리
      <div className="rudolph-track">
        <div className="rudolph">
          <div className="deer-character">
            <div className="santa-hat">
              <div className="hat-base"></div>
              <div className="hat-tip"></div>
              <div className="hat-ball"></div>
              <div className="hat-fur"></div>
            </div>
            <div className="deer-head">
              <div className="ear left-ear"></div>
              <div className="ear right-ear"></div>
              <div className="inner-ear left-inner"></div>
              <div className="inner-ear right-inner"></div>
              <div className="face">
                <div className="eye left-eye">
                  <div className="pupil"></div>
                  <div className="eye-shine"></div>
                </div>
                <div className="eye right-eye">
                  <div className="pupil"></div>
                  <div className="eye-shine"></div>
                </div>
                <div className="blush left-blush"></div>
                <div className="blush right-blush"></div>
                <div className="nose"></div>
                <div className="mouth"></div>
              </div>
              <div className="spot spot1"></div>
              <div className="spot spot2"></div>
            </div>
            <div className="deer-body">
              <div className="body-spot spot3"></div>
              <div className="body-spot spot4"></div>
              <div className="body-spot spot5"></div>
            </div>
            <div className="deer-tail"></div>
            <div className="legs-container">
              <div className="deer-leg front-left"></div>
              <div className="deer-leg front-right"></div>
              <div className="deer-leg back-left"></div>
              <div className="deer-leg back-right"></div>
            </div>
          </div>
        </div>
      </div>
      */}
      
      <div className="login-form">
        {/* 로고 및 제목 */}
        <div className="login-header">
          <div className="logo-container">
            <div className="logo-icon">
              <Shield size={32} />
            </div>
          </div>
          <h1 className="login-title">HD Sync</h1>
          <p className="login-subtitle">시스템에 로그인하세요</p>
        </div>

        {/* 로그인 폼 */}
        <form onSubmit={handleSubmit}>
          {/* 로그인 ID 입력 */}
          <div className="form-group">
            <label className="form-label">로그인 ID</label>
            <div className="input-wrapper">
              <User size={20} className="input-icon" />
              <input
                type="text"
                value={loginId}
                onChange={(e) => {
                  setLoginId(e.target.value);
                  // 입력 시 에러 초기화하지 않음 (사용자가 에러 메시지를 볼 수 있도록)
                }}
                placeholder="로그인 ID를 입력하세요"
                className="form-input"
                disabled={isLoading}
                autoComplete="username"
              />
            </div>
          </div>

          {/* 비밀번호 입력 */}
          <div className="form-group">
            <label className="form-label">비밀번호</label>
            <div className="input-wrapper">
              <Lock size={20} className="input-icon" />
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  // 입력 시 에러 초기화하지 않음 (사용자가 에러 메시지를 볼 수 있도록)
                }}
                placeholder="비밀번호를 입력하세요"
                className="form-input"
                disabled={isLoading}
                autoComplete="current-password"
              />
              <button
                type="button"
                onClick={togglePasswordVisibility}
                className="password-toggle"
                disabled={isLoading}
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>

          {/* 에러 메시지 */}
          {error && (
            <div className={`error-message ${getErrorType(error)}`}>
              <div className="error-icon">
                {getErrorType(error) === 'account-locked' ? '🔒' : 
                 getErrorType(error) === 'wrong-password' ? '🔑' : 
                 getErrorType(error) === 'account-inactive' ? '⏸️' : 
                 getErrorType(error) === 'system-error' ? '⚠️' : '❌'}
              </div>
              <div className="error-content">
                <span>{getUserFriendlyMessage(error)}</span>
              </div>
            </div>
          )}

          {/* 로그인 시도 횟수 경고 */}
          {loginAttempts >= 3 && !error?.includes('계정이 잠겼습니다') && !error?.includes('로그인 실패 횟수 초과') && (
            <div className="error-message warning">
              <div className="error-icon">⚠️</div>
              <div className="error-content">
                <span>⚠️ 로그인 시도 {loginAttempts}회 - 5회 실패 시 계정 잠금</span>
              </div>
            </div>
          )}

          {/* 로그인 버튼 */}
          <button
            type="submit"
            className="login-button"
            disabled={isLoading || !loginId.trim() || !password.trim()}
          >
            로그인
          </button>
        </form>

        {/* 비밀번호 찾기 링크 */}
        {/* <a href="#" className="forgot-password">
          비밀번호를 잊으셨나요?
        </a> */}

        {/* 구분선 */}
        {/* <div className="divider">
          <span>또는</span>
        </div> */}

        {/* 소셜 로그인 */}
        {/* <div className="social-login">
          <button type="button" className="social-button">
            <img src="https://www.google.com/favicon.ico" alt="Google" />
            Google로 로그인
          </button>
          <button type="button" className="social-button">
            <img src="https://github.com/favicon.ico" alt="GitHub" />
            GitHub로 로그인
          </button>
        </div> */}

        {/* 회원가입 링크 */}
        {/* <div className="signup-link">
          계정이 없으신가요?
          <a href="#">회원가입</a>
        </div> */}

        {/* 테스트 계정 정보 */}
        {/* <div className="test-accounts">
          <h3>테스트 계정</h3>
          <div className="account-list">
            <div className="account-item">
              <strong>시스템 관리자:</strong> admin / admin123!
            </div>
            <div className="account-item">
              <strong>일반 관리자:</strong> manager1 / manager123!
            </div>
            <div className="account-item">
              <strong>일반 사용자:</strong> user1 / user123!
            </div>
            <div className="account-item">
              <strong>벤더 사용자:</strong> vendor2 / vendor123!
            </div>

          </div>
        </div> */}
      </div>
    </div>
  );
};

export default LoginPage;
