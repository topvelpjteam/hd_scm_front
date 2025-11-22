import React, { useState, useEffect, useCallback, useRef } from 'react';
import Modal from './Modal';
import './ExcelPreviewModal.css';

export interface ExcelDataRow {
  rowIndex: number;
  상품코드: string;
  상품명: string;
  브랜드: string;
  상품구분: string;
  대분류: string;
  중분류: string;
  소분류: string;
  바코드?: string;
  상품번호?: string;
  해외상품ID?: string;
  해외상품명?: string;
  원산지?: string;
  HS코드?: string;
  용량?: string;
  용량단위?: string;
  포장크기?: string;
  보관조건?: string;
  유통기한?: string;
  공급단가?: string;
  매입단가?: string;
  통화구분?: string;
  VAT여부?: string;
  세율?: string;
  공급업체ID?: string;
  리드타임?: string;
  안전재고?: string;
  최대재고?: string;
  재주문점?: string;
  발주단위량?: string;
  발주최소단위?: string;
  창고위치?: string;
  로트관리여부?: string;
  품질등급?: string;
  검사주기?: string;
  반품정책?: string;
  보증기간?: string;
  운영시작일?: string;
  운영종료일?: string;
  등록일자?: string;
  비고?: string;
  isDuplicate?: boolean;
  duplicateInfo?: string;
  hasError?: boolean;
  errorMessage?: string;
  isSelected?: boolean;
  isBrandUnauthorized?: boolean;
}

export interface ExcelPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: ExcelDataRow[];
  onSave: (selectedRows: ExcelDataRow[]) => void;
  onCancel: () => void;
  type?: 'product' | 'agent'; // 상품 또는 거래처 구분
}

const ExcelPreviewModal: React.FC<ExcelPreviewModalProps> = ({
  isOpen,
  onClose,
  data,
  onSave,
  onCancel,
  type = 'product' // 기본값은 상품
}) => {
  const [previewData, setPreviewData] = useState<ExcelDataRow[]>([]);
  const [selectAll, setSelectAll] = useState(true);
  const [loading, setLoading] = useState(false);
  const [duplicateCheckCompleted, setDuplicateCheckCompleted] = useState(false);
  const hasAutoCheckedRef = useRef(false);

  // 타입에 따른 헤더 정의
  const getHeaders = () => {
    if (type === 'agent') {
      return [
        { key: '거래처명', label: '거래처명*', required: true },
        { key: '거래처영문명', label: '거래처영문명', required: false },
        { key: '거래처단축명', label: '거래처단축명', required: false },
        { key: '거래처구분', label: '거래처구분*', required: true },
        { key: '채널구분', label: '채널구분*', required: true },
        { key: '대표자명', label: '대표자명', required: false },
        { key: '사업자번호', label: '사업자번호', required: false },
        { key: '전화번호', label: '전화번호', required: false },
        { key: '팩스', label: '팩스', required: false },
        { key: '우편번호', label: '우편번호', required: false },
        { key: '우편번호주소', label: '우편번호주소', required: false },
        { key: '상세주소', label: '상세주소', required: false },
        { key: '업태', label: '업태', required: false },
        { key: '종목', label: '종목', required: false },
        { key: '거래제한미수금액', label: '거래제한미수금액', required: false },
        { key: '할인율', label: '할인율', required: false },
        { key: '소수점반올림구분', label: '소수점반올림구분', required: false },
        { key: '반올림자릿수', label: '반올림자릿수', required: false },
        { key: '은행명', label: '은행명', required: false },
        { key: '계좌번호', label: '계좌번호', required: false },
        { key: '계좌주', label: '계좌주', required: false },
        { key: '담당부서', label: '담당부서', required: false },
        { key: '담당사원', label: '담당사원', required: false },
        { key: '특이사항', label: '특이사항', required: false },
        { key: '거래처대표이메일', label: '거래처대표이메일', required: false },
        { key: '결제기간', label: '결제기간', required: false },
        { key: '부가세구분', label: '부가세구분', required: false },
        { key: '세금계산서수신이메일1', label: '세금계산서수신이메일1', required: false },
        { key: '세금계산서담당자1', label: '세금계산서담당자1', required: false },
        { key: '세금계산서수신이메일2', label: '세금계산서수신이메일2', required: false },
        { key: '세금계산서담당자2', label: '세금계산서담당자2', required: false },
        { key: '거래시작일자', label: '거래시작일자', required: false },
        { key: '거래종료일자', label: '거래종료일자', required: false }
      ];
    } else {
      // 상품 기본 헤더
      return [
        { key: '상품코드', label: '상품코드*', required: true },
        { key: '상품명', label: '상품명*', required: true },
        { key: '브랜드', label: '브랜드*', required: true },
        { key: '상품구분', label: '상품구분*', required: true },
        { key: '대분류', label: '대분류*', required: true },
        { key: '중분류', label: '중분류*', required: true },
        { key: '소분류', label: '소분류*', required: true },
        { key: '바코드', label: '바코드', required: false },
        { key: '등록일자', label: '등록일자', required: false }
      ];
    }
  };

  // 중복 확인 실행
  const checkDuplicates = useCallback(async () => {
    setLoading(true);
    try {
      const updatedData = await Promise.all(
        previewData.map(async (row) => {
          if (row.hasError) return row;
          
          if (type === 'agent') {
            // 거래처 중복 확인
            const agentName = (row as any).거래처명 ? String((row as any).거래처명).trim() : '';
            const businessNumber = (row as any).사업자번호 ? String((row as any).사업자번호).trim() : '';
            
            if (!agentName) {
              return { ...row, duplicateInfo: '거래처명 누락으로 확인 불가' };
            }
            
            try {
              const response = await fetch('/api/agents/check-exists', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ agentName, businessNumber }),
              });

              if (!response.ok) {
                throw new Error(`API 오류: ${response.status}`);
              }

              const result = await response.json();
              
              return {
                ...row,
                isDuplicate: result.exists,
                existingAgentId: result.exists ? result.agentData?.AGENT_ID : undefined,
                existingAgentData: result.exists ? result.agentData : undefined, // 기존 거래처 전체 데이터 저장
                duplicateInfo: result.exists ? 
                  `중복 - ${result.agentData?.AGENT_NM || '기존 거래처'} (ID: ${result.agentData?.AGENT_ID || 'N/A'})` : 
                  '신규 거래처'
              };
            } catch (error) {
              return {
                ...row,
                duplicateInfo: `확인 실패: ${error instanceof Error ? error.message : '알 수 없는 오류'}`
              };
            }
          } else {
            // 상품 중복 확인 (기존 로직)
            const userInfo = JSON.parse(sessionStorage.getItem('user') || '{}');
            const userId = userInfo.userId || 'ADMIN';
            
            // 데이터 검증 및 타입 변환
            const brandId = (row.브랜드 !== null && row.브랜드 !== undefined) ? String(row.브랜드).trim() : '';
            const goodsIdBrand = (row.상품코드 !== null && row.상품코드 !== undefined) ? String(row.상품코드).trim() : '';
            
            if (!brandId || !goodsIdBrand) {
              return { ...row, duplicateInfo: '데이터 누락으로 확인 불가' };
            }
            
            try {
              const response = await fetch('/api/products/check-exists', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ brandId, goodsIdBrand, userId }),
              });

              if (!response.ok) {
                throw new Error(`API 오류: ${response.status}`);
              }

              const result = await response.json();
              
              return {
                ...row,
                isDuplicate: result.exists,
                duplicateInfo: result.exists ? 
                  `중복 - ${result.productData?.GOODS_NM || '기존 상품'} (ID: ${result.productData?.GOODS_ID || 'N/A'})` : 
                  '신규 상품'
              };
            } catch (error) {
              return {
                ...row,
                duplicateInfo: `확인 실패: ${error instanceof Error ? error.message : '알 수 없는 오류'}`
              };
            }
          }
        })
      );
      
      setPreviewData(updatedData);
      setDuplicateCheckCompleted(true); // 중복 확인 완료 상태 설정
    } catch (error) {
      console.error('중복 확인 중 오류:', error);
      alert('중복 확인 중 오류가 발생했습니다.');
      setDuplicateCheckCompleted(false); // 오류 시 미완료 상태
    } finally {
      setLoading(false);
    }
  }, [previewData]);

  useEffect(() => {
    console.log('📊 ExcelPreviewModal - 받은 데이터:', data);
    
    if (data && data.length > 0) {
      // 모달이 열릴 때마다 자동 확인 플래그 리셋
      hasAutoCheckedRef.current = false;
      setDuplicateCheckCompleted(false); // 중복 확인 완료 상태 리셋
      
      // 초기에는 오류가 없는 행들만 선택
      const initialData = data.map((row) => ({
        ...row,
        isSelected: !row.hasError
      }));
      
      setPreviewData(initialData);
      
      // 전체 선택 상태 업데이트
      const validRows = initialData.filter(row => !row.hasError);
      setSelectAll(validRows.length > 0 && validRows.every(row => row.isSelected));
      
      // 자동 중복 확인 제거 - 사용자가 수동으로 버튼을 클릭해야 함
      console.log('📊 데이터 로드 완료 - 중복 확인 버튼을 클릭하여 확인하세요');
    } else {
      setPreviewData([]);
      hasAutoCheckedRef.current = false; // 데이터가 없으면 리셋
    }
  }, [data]);

  // 전체 선택/해제
  const handleSelectAll = () => {
    const newSelectAll = !selectAll;
    setSelectAll(newSelectAll);
    
    setPreviewData(prev => prev.map(row => ({
      ...row,
      isSelected: row.hasError ? false : newSelectAll
    })));
  };

  // 개별 행 선택/해제
  const handleRowSelect = (rowIndex: number) => {
    setPreviewData(prev => {
      const updated = prev.map(row => 
        row.rowIndex === rowIndex 
          ? { ...row, isSelected: !row.isSelected }
          : row
      );
      
      // 전체 선택 상태 업데이트
      const validRows = updated.filter(row => !row.hasError);
      setSelectAll(validRows.length > 0 && validRows.every(row => row.isSelected));
      
      return updated;
    });
  };

  // 저장 처리
  const handleSave = () => {
    const selectedRows = previewData.filter(row => row.isSelected && !row.hasError);
    onSave(selectedRows);
  };

  // 통계 계산
  const totalRows = previewData.length;
  const errorRows = previewData.filter(row => row.hasError).length;
  const duplicateRows = previewData.filter(row => row.isDuplicate && !row.hasError).length;
  const selectedRows = previewData.filter(row => row.isSelected && !row.hasError).length;

  // 모달 닫기 핸들러 (플래그 리셋 포함)
  const handleModalClose = () => {
    console.log('📊 ExcelPreviewModal 닫힘 - 플래그 리셋');
    hasAutoCheckedRef.current = false; // 모달이 닫힐 때 플래그 리셋
    setDuplicateCheckCompleted(false); // 중복 확인 완료 상태 리셋
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleModalClose}
      title="엑셀 데이터 미리보기"
      size="large"
      className="excel-preview-modal"
      closeOnOverlayClick={false}
    >
      <div className="preview-content">
        {/* 상단 통계 및 액션 */}
        <div className="preview-header">
          <div className="preview-stats">
            <div className="stat-item">
              <span className="stat-label">전체</span>
              <span className="stat-value">{totalRows}개</span>
            </div>
            <div className="stat-item error">
              <span className="stat-label">오류</span>
              <span className="stat-value">{errorRows}개</span>
            </div>
            <div className="stat-item duplicate">
              <span className="stat-label">중복</span>
              <span className="stat-value">{duplicateRows}개</span>
            </div>
            <div className="stat-item selected">
              <span className="stat-label">선택</span>
              <span className="stat-value">{selectedRows}개</span>
            </div>
          </div>
          
          <div className="preview-actions">
            <button 
              className="btn-check-duplicate"
              onClick={checkDuplicates}
              disabled={loading}
            >
              <i className="fas fa-search"></i>
              {loading ? '확인 중...' : '중복 확인'}
            </button>
          </div>
        </div>

        {/* 데이터 테이블 */}
        <div className="preview-table-container">
          <table className="preview-table">
            <thead>
              <tr>
                <th className="select-column">
                  <input
                    type="checkbox"
                    checked={selectAll}
                    onChange={handleSelectAll}
                    disabled={loading}
                  />
                </th>
                <th>행</th>
                <th>상태</th>
                {getHeaders().map((header) => (
                  <th key={header.key}>{header.label}</th>
                ))}
                <th>중복 확인</th>
                <th>오류 메시지</th>
              </tr>
            </thead>
            <tbody>
              {previewData.length === 0 ? (
                <tr>
                  <td colSpan={getHeaders().length + 5} style={{ textAlign: 'center', padding: '40px', color: '#6b7280' }}>
                    데이터가 없습니다. 엑셀 파일을 다시 업로드해주세요.
                  </td>
                </tr>
              ) : (
                previewData.map((row) => (
                <tr 
                  key={row.rowIndex} 
                  className={`
                    ${row.hasError ? (
                      row.errorMessage?.includes('관리 권한이 없는 브랜드') ? 'row-unauthorized' : 'row-error'
                    ) : ''}
                    ${row.isDuplicate ? 'row-duplicate' : ''}
                    ${row.isSelected ? 'row-selected' : ''}
                  `}
                >
                  <td className="select-column">
                    <input
                      type="checkbox"
                      checked={row.isSelected || false}
                      onChange={() => handleRowSelect(row.rowIndex)}
                      disabled={row.hasError || loading}
                      title={row.hasError ? row.errorMessage : ''}
                    />
                  </td>
                  <td>{row.rowIndex}</td>
                  <td className="status-column">
                    {row.hasError ? (
                      row.errorMessage?.includes('관리 권한이 없는 브랜드') ? (
                        <span className="status-unauthorized">
                          <i className="fas fa-ban"></i>
                          권한없음
                        </span>
                      ) : (
                        <span className="status-error">
                          <i className="fas fa-exclamation-triangle"></i>
                          오류
                        </span>
                      )
                    ) : row.isDuplicate ? (
                      <span className="status-duplicate">
                        <i className="fas fa-copy"></i>
                        중복
                      </span>
                    ) : (
                      <span className="status-ok">
                        <i className="fas fa-check"></i>
                        정상
                      </span>
                    )}
                  </td>
                  {getHeaders().map((header) => (
                    <td key={header.key} title={`${header.label}: ${(row as any)[header.key]}`}>
                      {(row as any)[header.key] || '-'}
                    </td>
                  ))}
                  <td className="duplicate-info">
                    {row.duplicateInfo || '미확인'}
                  </td>
                  <td className="error-message">
                    {row.errorMessage}
                  </td>
                </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* 하단 액션 버튼 */}
        <div className="preview-footer">
          <button 
            className="btn-cancel"
            onClick={() => {
              console.log('📊 ExcelPreviewModal 취소 - 플래그 리셋');
              hasAutoCheckedRef.current = false;
              setDuplicateCheckCompleted(false);
              onCancel();
            }}
            disabled={loading}
          >
            <i className="fas fa-times"></i>
            취소
          </button>
          <button 
            className="btn-save"
            onClick={handleSave}
            disabled={loading || selectedRows === 0 || !duplicateCheckCompleted}
            title={!duplicateCheckCompleted ? "중복 확인을 먼저 완료해주세요" : ""}
          >
            <i className="fas fa-save"></i>
            선택 항목 저장 ({selectedRows}개)
            {!duplicateCheckCompleted && <span className="btn-warning"> - 중복 확인 필요</span>}
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default ExcelPreviewModal;