import React from 'react';
import Modal from './Modal';
import './ConfirmationModal.css';

export type ConfirmationType = 'save' | 'update' | 'delete' | 'custom' | 'reset';

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
  changedFields?: Array<{field: string, name: string, oldValue: any, newValue: any}>;
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
  itemName = '항목',
  changedFields
}) => {
  const getModalConfig = () => {
    switch (type) {
      case 'reset':
        return {
          title: title || '초기화 확인',
          message: message || '현재 화면을 초기화하시겠습니까?\n선택된 자료나 입력중인 자료는 화면 초기화 됩니다.\n 확인하시고 작업하세요.',
          confirmText: confirmText || '초기화',
          icon: 'fas fa-redo',
          iconColor: '#3b82f6',
          confirmButtonClass: 'btn-confirm-reset'
        };
      
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
  // 아이콘 클래스 및 컬러를 상품등록과 완전히 동일하게 보정
  const iconClass = config.icon;
  const iconColor = config.iconColor;
  // 버튼 아이콘(저장: 체크, 수정: 연필, 삭제: 휴지통)
  const buttonIconClass =
    type === 'save' ? 'fas fa-check' :
    type === 'update' ? 'fas fa-edit' :
    type === 'delete' ? 'fas fa-trash-alt' :
    type === 'reset' ? 'fas fa-redo' :
    'fas fa-question-circle';

  // Show a larger modal if there are changed fields (for update/save)
  const showDiffTable = (type === 'update' || type === 'save' || type === 'delete') && changedFields && changedFields.length > 0;
  return (
    <Modal
      isOpen={isOpen}
      onClose={onCancel}
      title={config.title}
      size={showDiffTable ? 'large' : 'small'}
      className={`confirmation-modal confirmation-${type}`}
      closeOnOverlayClick={false}
    >
      <div className="confirmation-content">
        <div className="confirmation-icon">
          <i className={iconClass} style={{ color: iconColor, fontSize: 44, marginBottom: 8 }}></i>
        </div>
        <div className="confirmation-message">
          <p>{config.message}</p>
        </div>
        {showDiffTable && (
          <div className="changed-fields-section">
            <>
              <h4 className="changed-fields-title">
                <i className="fas fa-edit"></i>
                변경될 항목 ({changedFields.length}개)
              </h4>
              <div className="changed-fields-table-container">
                <table className="changed-fields-table">
                  <thead>
                    <tr>
                      <th>항목명</th>
                      <th>변경 전</th>
                      <th>변경 후</th>
                    </tr>
                  </thead>
                  <tbody>
                    {changedFields.slice(0, 10).map((field, index) => (
                      <tr key={index} className="changed-field-row">
                        <td className="field-name-cell">{field.name}</td>
                        <td className="old-value-cell">
                          <span className="old-value">{field.oldValue}</span>
                        </td>
                        <td className="new-value-cell">
                          <span className="new-value">{field.newValue}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {changedFields.length > 10 && (
                  <div className="more-changes">
                    <i className="fas fa-ellipsis-h"></i>
                    외 {changedFields.length - 10}개 항목 더 변경됨
                  </div>
                )}
              </div>
            </>
          </div>
        )}
        <div className="confirmation-actions" role="group" aria-label="확인 및 취소 버튼">
          <button
            type="button"
            className="btn-confirmation-cancel"
            onClick={onCancel}
          >
            <i className="fas fa-times"></i>
            {cancelText}
          </button>
          <button
            type="button"
            className={`btn-confirmation-confirm ${config.confirmButtonClass}`}
            onClick={onConfirm}
          >
            <i className={buttonIconClass}></i>
            {config.confirmText}
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default ConfirmationModal;
