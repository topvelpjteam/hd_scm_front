import React from 'react';
import Modal from './Modal';
import './ConfirmationModal.css';

export type ConfirmationType = 'save' | 'update' | 'delete' | 'custom';

export interface ConfirmationModalProps {
  isOpen: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  type: ConfirmationType;
  title?: string;
  message?: string;
  confirmText?: string;
  cancelText?: string;
  itemName?: string;
}

const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  isOpen,
  onConfirm,
  onCancel,
  type,
  title,
  message,
  confirmText,
  cancelText = '취소',
  itemName = '항목'
}) => {
  const getModalConfig = () => {
    switch (type) {
      case 'save':
        return {
          title: title || '저장 확인',
          message: message || `${itemName}을(를) 저장하시겠습니까?`,
          confirmText: confirmText || '저장',
          icon: 'fas fa-save',
          iconColor: '#10b981',
          confirmButtonClass: 'btn-confirm-save'
        };
      case 'update':
        return {
          title: title || '수정 확인',
          message: message || `${itemName}을(를) 수정하시겠습니까?`,
          confirmText: confirmText || '수정',
          icon: 'fas fa-edit',
          iconColor: '#3b82f6',
          confirmButtonClass: 'btn-confirm-update'
        };
      case 'delete':
        return {
          title: title || '삭제 확인',
          message: message || `${itemName}을(를) 삭제하시겠습니까?\n삭제된 데이터는 복구할 수 없습니다.`,
          confirmText: confirmText || '삭제',
          icon: 'fas fa-trash-alt',
          iconColor: '#ef4444',
          confirmButtonClass: 'btn-confirm-delete'
        };
      default:
        return {
          title: title || '확인',
          message: message || '작업을 진행하시겠습니까?',
          confirmText: confirmText || '확인',
          icon: 'fas fa-question-circle',
          iconColor: '#6366f1',
          confirmButtonClass: 'btn-confirm-custom'
        };
    }
  };

  const config = getModalConfig();

  return (
    <Modal
      isOpen={isOpen}
      onClose={onCancel}
      title={config.title}
      size="small"
      className={`confirmation-modal confirmation-${type}`}
      closeOnOverlayClick={false}
    >
      <div className="confirmation-content">
        <div className="confirmation-icon">
          <i className={config.icon} style={{ color: config.iconColor }}></i>
        </div>
        
        <div className="confirmation-message">
          <p>{config.message}</p>
        </div>
        
        <div className="confirmation-actions">
          <button 
            className="btn-confirmation-cancel"
            onClick={onCancel}
          >
            <i className="fas fa-times"></i>
            {cancelText}
          </button>
          
          <button 
            className={`btn-confirmation-confirm ${config.confirmButtonClass}`}
            onClick={onConfirm}
          >
            <i className={config.icon}></i>
            {config.confirmText}
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default ConfirmationModal;
