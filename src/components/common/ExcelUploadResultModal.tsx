import React from 'react';
import Modal from './Modal';
import './ExcelUploadResultModal.css';

export interface ExcelUploadResult {
  SUCCESS?: boolean;
  success?: boolean; // 하위 호환성을 위해 유지
  SUCCESS_COUNT?: number;
  successCount?: number; // 하위 호환성을 위해 유지
  FAIL_COUNT?: number;
  failCount?: number; // 하위 호환성을 위해 유지
  TOTAL_COUNT?: number;
  totalCount?: number; // 하위 호환성을 위해 유지
  ERROR_MESSAGES?: string[];
  errors?: string[]; // 하위 호환성을 위해 유지
  MESSAGE?: string;
  message?: string; // 하위 호환성을 위해 유지
}

export interface ExcelUploadResultModalProps {
  isOpen: boolean;
  onClose: () => void;
  result: ExcelUploadResult | null;
}

const ExcelUploadResultModal: React.FC<ExcelUploadResultModalProps> = ({
  isOpen,
  onClose,
  result
}) => {
  if (!result) return null;

  // 백엔드 응답 구조에 맞게 필드 매핑
  const success = result.SUCCESS ?? result.success ?? false;
  const successCount = result.SUCCESS_COUNT ?? result.successCount ?? 0;
  const failCount = result.FAIL_COUNT ?? result.failCount ?? 0;
  const totalCount = result.TOTAL_COUNT ?? result.totalCount ?? 0;
  const errors = result.ERROR_MESSAGES ?? result.errors ?? [];
  const message = result.MESSAGE ?? result.message ?? '';

  const isSuccess = success && successCount > 0;
  const hasErrors = failCount > 0;

  const getModalConfig = () => {
    if (isSuccess && !hasErrors) {
      return {
        title: '업로드 완료',
        icon: 'fas fa-check-circle',
        iconColor: '#10b981',
        statusClass: 'success'
      };
    } else if (isSuccess && hasErrors) {
      return {
        title: '업로드 부분 완료',
        icon: 'fas fa-exclamation-triangle',
        iconColor: '#f59e0b',
        statusClass: 'warning'
      };
    } else {
      return {
        title: '업로드 실패',
        icon: 'fas fa-times-circle',
        iconColor: '#ef4444',
        statusClass: 'error'
      };
    }
  };

  const config = getModalConfig();

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={config.title}
      size="medium"
      className={`excel-upload-result-modal ${config.statusClass}`}
      closeOnOverlayClick={true}
    >
      <div className="upload-result-content">
        {/* 상태 아이콘 */}
        <div className="result-icon">
          <i className={config.icon} style={{ color: config.iconColor }}></i>
        </div>
        
        {/* 결과 요약 */}
        <div className="result-summary">
          <div className="summary-stats">
            <div className="stat-item total">
              <span className="stat-label">전체</span>
              <span className="stat-value">{totalCount}개</span>
            </div>
            <div className="stat-item success">
              <span className="stat-label">성공</span>
              <span className="stat-value">{successCount}개</span>
            </div>
            <div className="stat-item fail">
              <span className="stat-label">실패</span>
              <span className="stat-value">{failCount}개</span>
            </div>
          </div>
          
          {/* 성공률 표시 */}
          <div className="success-rate">
            <div className="rate-bar">
              <div 
                className="rate-fill" 
                style={{ 
                  width: `${totalCount > 0 ? (successCount / totalCount) * 100 : 0}%`,
                  backgroundColor: config.iconColor
                }}
              ></div>
            </div>
            <span className="rate-text">
              {totalCount > 0 ? Math.round((successCount / totalCount) * 100) : 0}% 성공
            </span>
          </div>
        </div>

        {/* 메시지 */}
        {message && (
          <div className="result-message">
            <p>{message}</p>
          </div>
        )}

        {/* 오류 목록 */}
        {hasErrors && errors && errors.length > 0 && (
          <div className="error-details">
            <h4>오류 상세 내역</h4>
            <div className="error-list">
              {errors.slice(0, 10).map((error, index) => (
                <div key={index} className="error-item">
                  <i className="fas fa-exclamation-circle"></i>
                  <span>{error}</span>
                </div>
              ))}
              {errors.length > 10 && (
                <div className="error-item more">
                  <i className="fas fa-ellipsis-h"></i>
                  <span>외 {errors.length - 10}개 오류</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* 액션 버튼 */}
        <div className="result-actions">
          <button 
            className="btn btn-primary"
            onClick={onClose}
          >
            확인
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default ExcelUploadResultModal;
