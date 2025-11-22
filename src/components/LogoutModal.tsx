import React from 'react';
import { clearAllAppState } from '../utils/stateCleanup';
import Modal from './common/Modal';
import './common/LogoutModal.css';

interface LogoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  userName: string;
}

const LogoutModal: React.FC<LogoutModalProps> = ({ isOpen, onClose, onConfirm, userName }) => {
  const handleConfirm = () => {
    // 로그아웃 확인 시 모든 상태 초기화
    clearAllAppState();
    onConfirm();
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="로그아웃"
      size="small"
      className="logout-modal"
      closeOnOverlayClick={false}
    >
      <div className="logout-content">
        <div className="logout-icon">
          <i className="fas fa-sign-out-alt"></i>
        </div>
        
        <div className="logout-message">
          <p className="logout-user">
            <strong>{userName}</strong>님, 정말 로그아웃하시겠습니까?
          </p>
          <p className="logout-description">
            로그아웃하면 현재 세션이 종료되고 로그인 페이지로 이동합니다.
          </p>
        </div>
        
        <div className="logout-actions">
          <button 
            className="btn-logout-cancel"
            onClick={onClose}
          >
            <i className="fas fa-times"></i>
            취소
          </button>
          
          <button 
            className="btn-logout-confirm"
            onClick={handleConfirm}
          >
            <i className="fas fa-sign-out-alt"></i>
            로그아웃
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default LogoutModal;
