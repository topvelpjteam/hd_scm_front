import React from 'react';
import './Modal.css';

interface PartialConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  missingOrderNos: number[]; // 출고수량 미입력 라인 ORDER_NO 목록
  totalSelectedCount: number; // 사용자가 선택한 전체 라인 수
  confirmableCount: number;   // 실제 확정 처리될 라인 수 (OUT_QTY > 0)
  onProceed: () => void;      // 부분 확정 진행
}

const PartialConfirmModal: React.FC<PartialConfirmModalProps> = ({
  isOpen,
  onClose,
  missingOrderNos,
  totalSelectedCount,
  confirmableCount,
  onProceed
}) => {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay" role="dialog" aria-modal="true">
      <div className="modal-container modal-medium" style={{ maxWidth: 560 }}>
        <div className="modal-header">
          <h3 className="modal-title">
            <i className="fas fa-info-circle" style={{ marginRight: 8 }} /> 부분 출고확정 안내
          </h3>
          <button className="modal-close-btn" onClick={onClose} aria-label="닫기">
            <i className="fas fa-times" />
          </button>
        </div>
        <div className="modal-content">
          <div style={{
            background:'#fef3c7', border:'1px solid #fcd34d', padding:'12px 16px', borderRadius:12,
            color:'#92400e', fontSize:14, lineHeight:1.5, marginBottom:16
          }}>
            선택한 {totalSelectedCount}개 라인 중 <strong>{confirmableCount}</strong>개만 출고수량이 입력되어
            출고확정 처리됩니다. 출고수량이 없는 라인은 <strong>미출고(PENDING)</strong> 상태로 유지됩니다.
          </div>

          {missingOrderNos.length > 0 && (
            <div style={{ marginBottom:16 }}>
              <div style={{ fontSize:13, fontWeight:600, color:'#475569', marginBottom:6 }}>
                출고수량 미입력 라인 ({missingOrderNos.length}):
              </div>
              <div style={{
                border:'1px solid #e2e8f0', borderRadius:8, padding:'8px 10px', maxHeight:160, overflowY:'auto', fontSize:12,
                background:'#fff'
              }}>
                <ul style={{ margin:0, paddingLeft:18 }}>
                  {missingOrderNos.map(no => (
                    <li key={no} style={{ color:'#334155' }}>ORDER_NO: {no}</li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          <div style={{ fontSize:12, color:'#64748b', lineHeight:1.6 }}>
            • 출고수량을 입력하지 않은 라인은 나중에 다시 선택하여 추가 출고확정 가능합니다.<br />
            • 유통기한 정보는 출고수량이 있는 라인에 대해서만 검증/저장됩니다.<br />
            • 부분확정 후 "출고내역서전송"은 이미 출고된 라인 기준으로 생성됩니다.
          </div>

          <div style={{ display:'flex', justifyContent:'flex-end', marginTop:24, gap:12 }}>
            <button type="button" onClick={onClose} style={secondaryBtnStyle}>취소</button>
            <button type="button" onClick={onProceed} style={primaryBtnStyle}>
              <i className="fas fa-check" style={{ marginRight:6 }} /> 부분확정 진행
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const primaryBtnStyle: React.CSSProperties = {
  background:'#2563eb', color:'#fff', border:'none', padding:'10px 18px', borderRadius:8,
  fontWeight:600, fontSize:14, boxShadow:'0 2px 4px rgba(0,0,0,0.1)', cursor:'pointer'
};
const secondaryBtnStyle: React.CSSProperties = {
  background:'#e2e8f0', color:'#334155', border:'none', padding:'10px 18px', borderRadius:8,
  fontWeight:500, fontSize:14, cursor:'pointer'
};

export default PartialConfirmModal;
