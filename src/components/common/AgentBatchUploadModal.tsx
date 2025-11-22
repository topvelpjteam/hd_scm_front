import React, { useState, useRef } from 'react';
import Modal from './Modal';
import './AgentBatchUploadModal.css';

export interface AgentBatchUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onTemplateDownload: (event?: React.MouseEvent) => void;
  onFileUpload: (file: File) => void;
}

const AgentBatchUploadModal: React.FC<AgentBatchUploadModalProps> = ({
  isOpen,
  onClose,
  onTemplateDownload,
  onFileUpload
}) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // 엑셀 파일 확장자 검증
      const allowedExtensions = ['.xlsx', '.xls'];
      const fileExtension = file.name.toLowerCase().substring(file.name.lastIndexOf('.'));
      
      if (!allowedExtensions.includes(fileExtension)) {
        alert('엑셀 파일(.xlsx, .xls)만 업로드 가능합니다.');
        return;
      }
      
      // 파일 크기 검증 (10MB 제한)
      const maxSize = 10 * 1024 * 1024; // 10MB
      if (file.size > maxSize) {
        alert('파일 크기는 10MB를 초과할 수 없습니다.');
        return;
      }
      
      setSelectedFile(file);
    }
  };

  const handleUpload = () => {
    if (selectedFile) {
      onFileUpload(selectedFile);
      setSelectedFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleCancel = () => {
    setSelectedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="거래처 일괄등록"
      size="medium"
      className="agent-batch-upload-modal"
      closeOnOverlayClick={false}
    >
      <div className="agent-batch-upload-content">
        <div className="upload-info">
          <p className="info-title">엑셀 파일로 거래처를 일괄등록할 수 있습니다.</p>
        </div>

        {/* 템플릿 다운로드 섹션 */}
        <div className="template-section">
          <h4 className="section-title">
            <i className="fas fa-download"></i>
            템플릿 다운로드
          </h4>
          <div className="template-content">
            <button 
              className="btn-template-download"
              onClick={(e) => onTemplateDownload(e)}
            >
              <i className="fas fa-file-excel"></i>
              다운로드
            </button>
            <p className="template-description">
              템플릿을 다운로드하여 데이터를 입력하세요.
            </p>
          </div>
        </div>

        {/* 파일 업로드 섹션 */}
        <div className="upload-section">
          <h4 className="section-title">
            <i className="fas fa-file-upload"></i>
            파일 업로드
          </h4>
          
          <div className="file-upload-area">
            <div className="file-input-wrapper">
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx,.xls"
                onChange={handleFileSelect}
                className="file-input"
                id="agent-batch-file-input"
              />
              <label htmlFor="agent-batch-file-input" className="file-input-label">
                <i className="fas fa-file-excel"></i>
                파일 선택
              </label>
            </div>
            
            {selectedFile && (
              <div className="selected-file">
                <div className="file-info">
                  <i className="fas fa-file-excel"></i>
                  <span className="file-name">{selectedFile.name}</span>
                  <span className="file-size">
                    ({(selectedFile.size / 1024).toFixed(1)}KB)
                  </span>
                </div>
              </div>
            )}
            
            <p className="file-requirements">
              .xlsx, .xls (최대 10MB)
            </p>
          </div>
        </div>

        {/* 버튼 영역 */}
        <div className="agent-batch-upload-actions">
          <button 
            className="btn-cancel"
            onClick={handleCancel}
          >
            <i className="fas fa-times"></i>
            취소
          </button>
          <button 
            className="btn-upload"
            onClick={handleUpload}
            disabled={!selectedFile}
          >
            <i className="fas fa-upload"></i>
            업로드
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default AgentBatchUploadModal;
