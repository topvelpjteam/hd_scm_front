import React from 'react';
import Modal from './Modal';
import './UnsavedChangesModal.css';

export interface UnsavedChangesModalProps {
  isOpen: boolean;
  onSave: () => void;
  onDiscard: () => void;
  onCancel: () => void;
  title?: string;
  message?: string;
}

const UnsavedChangesModal: React.FC<UnsavedChangesModalProps> = ({
  isOpen,
  onSave,
  onDiscard,
  onCancel,
  title = '저장되지 않은 변경사항',
  message = '입력 중인 내용이 있습니다.\n저장하지 않고 계속하시겠습니까?'
}) => {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onCancel}
      title={title}
      size="medium"
      className="unsaved-changes-modal"
      closeOnOverlayClick={false}
    >
      <div className="unsaved-changes-content">
        <div className="unsaved-changes-icon">
          <i className="fas fa-exclamation-circle"></i>
        </div>
        
        <div className="unsaved-changes-message">
          <p>{message}</p>
        </div>
        
        <div className="unsaved-changes-actions">
          <button 
            className="btn-unsaved-cancel"
            onClick={onCancel}
          >
            <i className="fas fa-arrow-left"></i>
            계속 작업
          </button>
          
          <button 
            className="btn-unsaved-save"
            onClick={onSave}
          >
            <i className="fas fa-save"></i>
            저장 후 계속
          </button>
          
          <button 
            className="btn-unsaved-discard"
            onClick={onDiscard}
          >
            <i className="fas fa-trash-alt"></i>
            저장하지 않고 계속
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default UnsavedChangesModal;
