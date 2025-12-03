import React from 'react';
import Modal from './Modal';
import './ValidationModal.css';

export interface ValidationError {
  field: string;
  fieldName?: string;
  message?: string;
  maxLength?: number;
  inputType?: string;
  example?: string;
  guidance?: string;
}

export interface ValidationModalProps {
  isOpen: boolean;
  onClose: () => void;
  errors: ValidationError[];
  title?: string;
  mainMessage?: string;
}

const ValidationModal: React.FC<ValidationModalProps> = ({
  isOpen,
  onClose,
  errors,
  title,
  mainMessage
}) => {
  const getInputGuide = (error: ValidationError) => {
    const guides = [];
    
    if (error.maxLength) {
      guides.push(`최대 ${error.maxLength}자`);
    }
    
    if (error.inputType) {
      switch (error.inputType) {
        case 'date':
          guides.push('날짜 형식 (YYYY-MM-DD)');
          break;
        case 'number':
          guides.push('숫자만 입력');
          break;
        case 'email':
          guides.push('이메일 형식');
          break;
        case 'phone':
          guides.push('전화번호 형식');
          break;
        default:
          if (error.inputType) {
            guides.push(error.inputType);
          }
      }
    }
    
    if (error.example) {
      guides.push(`예: ${error.example}`);
    }
    
    return guides.join(', ');
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title || "필수 입력 항목 확인"}
      size="medium"
      className="validation-modal"
    >
      <div className="validation-content">
        <div className="validation-icon">
          <i className="fas fa-exclamation-triangle"></i>
        </div>
        
        <div className="validation-message">
          <p className="validation-title">{mainMessage || '다음 항목들을 입력해주세요'}</p>
          
          <div className="validation-errors">
            {errors.map((error, index) => (
              <div key={index} className="validation-error-item">
                <div className="error-field-name">
                  <i className="fas fa-dot-circle"></i>
                  <strong>{error.fieldName}</strong>
                </div>
                
                {error.message && (
                  <div className="error-message">{error.message}</div>
                )}
                
                {(error.guidance || error.maxLength || error.inputType || error.example) && (
                  <div className="error-guide">
                    {error.guidance || getInputGuide(error)}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
        
        <div className="validation-actions">
          <button 
            className="btn-validation-confirm"
            onClick={onClose}
          >
            <i className="fas fa-check"></i>
            확인
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default ValidationModal;
