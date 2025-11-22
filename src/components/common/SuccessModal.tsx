import React from 'react';
import Modal from './Modal';
import './SuccessModal.css';

export type SuccessType = 'save' | 'update' | 'delete' | 'custom';

export interface SuccessModalProps {
  isOpen: boolean;
  onClose: () => void;
  type: SuccessType;
  title?: string;
  message?: string;
  itemName?: string;
  details?: string;
  changedFields?: Array<{field: string, name: string, oldValue: any, newValue: any}>;
}

const SuccessModal: React.FC<SuccessModalProps> = ({
  isOpen,
  onClose,
  type,
  title,
  message,
  itemName = '항목',
  details,
  changedFields
}) => {
  // 디버깅: props 확인
  // console.log('🔍 SuccessModal props:', {
  //   isOpen,
  //   type,
  //   message,
  //   details,
  //   changedFields,
  //   changedFieldsLength: changedFields?.length,
  //   changedFieldsIsArray: Array.isArray(changedFields),
  //   changedFieldsType: typeof changedFields,
  //   changedFieldsContent: changedFields?.map(field => ({
  //     field: field.field,
  //     name: field.name,
  //     oldValue: field.oldValue,
  //     newValue: field.newValue
  //   }))
  // });
  const getModalConfig = () => {
    switch (type) {
      case 'save':
        return {
          title: title || '저장 완료',
          message: message || `${itemName}이(가) 성공적으로 저장되었습니다.`,
          icon: 'fas fa-check-circle',
          iconColor: '#10b981'
        };
      case 'update':
        return {
          title: title || '수정 완료',
          message: message || `${itemName}이(가) 성공적으로 수정되었습니다.`,
          icon: 'fas fa-edit',
          iconColor: '#3b82f6'
        };
      case 'delete':
        return {
          title: title || '삭제 완료',
          message: message || `${itemName}이(가) 성공적으로 삭제되었습니다.`,
          icon: 'fas fa-trash-alt',
          iconColor: '#ef4444'
        };
      default:
        return {
          title: title || '작업 완료',
          message: message || '작업이 성공적으로 완료되었습니다.',
          icon: 'fas fa-check-circle',
          iconColor: '#10b981'
        };
    }
  };

  const config = getModalConfig();

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={config.title}
      size={type === 'update' && changedFields && changedFields.length > 0 ? "large" : "medium"}
      className={`success-modal success-${type}`}
      closeOnOverlayClick={true}
    >
      <div className="success-content">
        <div className="success-icon">
          <i className={config.icon} style={{ color: config.iconColor }}></i>
        </div>
        
        <div className="success-message">
          <p className="success-main-message">{config.message}</p>
          {details && (
            <p className="success-details">{details}</p>
          )}
          
        </div>
        
        <div className="success-actions">
          <button 
            className="btn-success-confirm"
            onClick={onClose}
          >
            <i className="fas fa-check"></i>
            확인
          </button>
        </div>
        
        {/* 업데이트 시 변경된 필드 표시 - 테이블 형태 (아래로 이동) */}
        {type === 'update' && changedFields && changedFields.length > 0 ? (
          <div className="changed-fields-section">
            <h4 className="changed-fields-title">
              <i className="fas fa-edit"></i>
              변경된 항목 ({changedFields.length}개)
            </h4>
            {(() => {
              console.log('🔍 변경된 필드 섹션 렌더링:', { 
                changedFields,
                changedFieldsLength: changedFields.length,
                changedFieldsType: typeof changedFields,
                changedFieldsIsArray: Array.isArray(changedFields)
              });
              return null;
            })()}
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
          </div>
        ) : (
          <div style={{display: 'none'}}>
            {(() => {
              // console.log('⚠️ 변경된 필드 섹션이 표시되지 않음:', {
              //   type,
              //   changedFields,
              //   changedFieldsLength: changedFields?.length,
              //   changedFieldsType: typeof changedFields,
              //   changedFieldsIsArray: Array.isArray(changedFields),
              //   condition1: type === 'update',
              //   condition2: changedFields,
              //   condition3: (changedFields?.length ?? 0) > 0,
              //   condition1Result: type === 'update',
              //   condition2Result: !!changedFields,
              //   condition3Result: changedFields && changedFields.length > 0
              // });
              return null;
            })()}
          </div>
        )}
      </div>
    </Modal>
  );
};

export default SuccessModal;
