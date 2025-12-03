import React, { useState, useEffect } from 'react';
import { X, Mail, Eye, EyeOff, AlertCircle, CheckCircle } from 'lucide-react';
import './EmailPasswordModal.css';

interface EmailPasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (password: string) => void;
  emailAddress: string;
  loading?: boolean;
}

/**
 * 이메일 패스워드 입력 모달 컴포넌트
 * 이메일 전송 시 패스워드를 안전하게 입력받는 모달
 */
const EmailPasswordModal: React.FC<EmailPasswordModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  emailAddress,
  loading = false
}) => {
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 모달이 열릴 때마다 상태 초기화
  useEffect(() => {
    if (isOpen) {
      setPassword('');
      setShowPassword(false);
      setError(null);
    }
  }, [isOpen]);

  // 패스워드 입력 유효성 검사
  const validatePassword = (pwd: string): string | null => {
    if (!pwd || pwd.trim().length === 0) {
      return '패스워드를 입력해주세요.';
    }
    if (pwd.length < 4) {
      return '패스워드는 최소 4자 이상이어야 합니다.';
    }
    return null;
  };

  // 확인 버튼 클릭 핸들러
  const handleConfirm = () => {
    const validationError = validatePassword(password);
    if (validationError) {
      setError(validationError);
      return;
    }

    setError(null);
    onConfirm(password);
  };

  // 취소 버튼 클릭 핸들러
  const handleCancel = () => {
    setPassword('');
    setError(null);
    onClose();
  };

  // 엔터키 처리
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !loading) {
      handleConfirm();
    } else if (e.key === 'Escape') {
      handleCancel();
    }
  };

  // 이메일 완전 마스킹 함수
  const maskEmailCompletely = (email: string): string => {
    if (!email) return '***';
    
    const parts = email.split('@');
    if (parts.length !== 2) return '***';
    
    const [localPart, domain] = parts;
    
    // 로컬 부분과 도메인 모두 마스킹
    const maskedLocal = '*'.repeat(Math.max(3, Math.min(localPart.length, 8)));
    const domainParts = domain.split('.');
    const maskedDomain = domainParts
      .map((part, idx) => {
        if (idx === domainParts.length - 1) {
          // 확장자(예: com, kr)는 그대로 유지
          return part;
        }
        // 나머지는 마스킹
        return '*'.repeat(Math.max(1, part.length));
      })
      .join('.');
    
    return `${maskedLocal}@${maskedDomain}`;
  };

  // 패스워드 표시/숨김 토글
  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  if (!isOpen) return null;

  return (
    <div className="email-password-modal-overlay">
      <div className="email-password-modal">
        {/* 헤더 */}
        <div className="email-password-modal-header">
          <div className="email-password-modal-title">
            <Mail className="email-password-modal-icon" />
            <h3>이메일 전송 인증</h3>
          </div>
          <button 
            className="email-password-modal-close" 
            onClick={handleCancel}
            disabled={loading}
          >
            <X size={20} />
          </button>
        </div>

        {/* 내용 */}
        <div className="email-password-modal-content">
          <div className="email-password-modal-info">
            <div className="email-password-modal-info-item">
              <span className="email-password-modal-label">이메일 계정:</span>
              <span className="email-password-modal-value">{maskEmailCompletely(emailAddress)}</span>
            </div>
            <p className="email-password-modal-description">
              이메일 전송을 위해 계정 패스워드를 입력해주세요.
            </p>
          </div>

          {/* 패스워드 입력 */}
          <div className="email-password-modal-input-group">
            <label className="email-password-modal-input-label">
              패스워드
            </label>
            <div className="email-password-modal-input-container">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (error) setError(null); // 입력 시 에러 메시지 제거
                }}
                onKeyPress={handleKeyPress}
                placeholder="이메일 계정 패스워드를 입력하세요"
                className={`email-password-modal-input ${error ? 'error' : ''}`}
                disabled={loading}
                autoFocus
              />
              <button
                type="button"
                className="email-password-modal-toggle-password"
                onClick={togglePasswordVisibility}
                disabled={loading}
                title={showPassword ? '패스워드 숨기기' : '패스워드 보기'}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            
            {/* 에러 메시지 */}
            {error && (
              <div className="email-password-modal-error">
                <AlertCircle size={14} />
                <span>{error}</span>
              </div>
            )}
          </div>

          {/* 보안 안내 */}
          <div className="email-password-modal-security-notice">
            <div className="email-password-modal-security-icon">
              <CheckCircle size={16} />
            </div>
            <div className="email-password-modal-security-text">
              <strong>보안 안내</strong>
              <p>입력하신 패스워드는 이메일 전송에만 사용되며 저장되지 않습니다.</p>
            </div>
          </div>
        </div>

        {/* 푸터 */}
        <div className="email-password-modal-footer">
          <button 
            className="email-password-modal-btn-cancel" 
            onClick={handleCancel}
            disabled={loading}
          >
            취소
          </button>
          <button 
            className="email-password-modal-btn-confirm" 
            onClick={handleConfirm}
            disabled={loading || !password.trim()}
          >
            {loading ? (
              <>
                <div className="email-password-modal-spinner"></div>
                전송 중...
              </>
            ) : (
              <>
                <Mail size={16} />
                이메일 전송
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default EmailPasswordModal;
