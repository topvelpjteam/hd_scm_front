import React, { useMemo } from 'react';
import './Modal.css';
import type { OrderData } from '../../types/orderConfirm';

interface CancelShipmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  outDate: string; // YYYY-MM-DD
  lines: OrderData[];
  hasInboundLines: boolean;
  selection: Set<string>; // ORDER_NO (stringified) selection
  onToggleLine: (orderNo: string) => void;
  onSelectAll: () => void;
  onClearSelection: () => void;
  onConfirm: () => void;
}

const CancelShipmentModal: React.FC<CancelShipmentModalProps> = ({
  isOpen,
  onClose,
  outDate,
  lines,
  hasInboundLines,
  selection,
  onToggleLine,
  onSelectAll,
  onClearSelection,
  onConfirm
}) => {
  const allSelected = useMemo(() => selection.size === lines.length && lines.length > 0, [selection, lines]);
  if (!isOpen) return null;

  return (
    <div className="modal-overlay" role="dialog" aria-modal="true">
      <div className="modal-container modal-large cancel-shipment-modal">
        <div className="modal-header">
          <h3 className="modal-title">
            <i className="fas fa-undo" style={{ marginRight: 8 }} /> 출고취소 확인
          </h3>
          <button className="modal-close-btn" onClick={onClose} aria-label="닫기">
            <i className="fas fa-times" />
          </button>
        </div>
        <div className="modal-content">
          {hasInboundLines ? (
            <div className="cancel-blocked" style={{
              background:'#fee2e2', border:'1px solid #fca5a5', padding:'12px 16px', borderRadius:12, marginBottom:16, color:'#b91c1c', fontWeight:500
            }}>
              <i className="fas fa-exclamation-triangle" style={{ marginRight: 6 }} /> 이미 입고 처리된 품목이 있어 해당 출고일자({outDate}) 전체 취소가 불가능합니다.
            </div>
          ) : (
            <div className="cancel-warning" style={{
              background:'#fef3c7', border:'1px solid #fcd34d', padding:'12px 16px', borderRadius:12, marginBottom:16, color:'#92400e', fontWeight:500
            }}>
              <i className="fas fa-exclamation-circle" style={{ marginRight: 6 }} /> 출고일자 <strong>{outDate}</strong> 의 출고내역은 <strong>전체취소</strong> 됩니다. 부분취소는 지원되지 않습니다.
              선택은 사용자 확인용이며 모든 라인을 선택해야 진행 가능합니다.
            </div>
          )}

          <div style={{ display:'flex', justifyContent:'space-between', marginBottom:12 }}>
            <div style={{ fontSize:14, color:'#475569' }}>
              총 <strong>{lines.length}</strong>개 품목 / 선택 <strong>{selection.size}</strong>개
            </div>
            {!hasInboundLines && (
              <div style={{ display:'flex', gap:8 }}>
                <button type="button" onClick={onSelectAll} disabled={allSelected} style={btnStyle}>전체선택</button>
                <button type="button" onClick={onClearSelection} disabled={selection.size === 0} style={btnStyle}>선택해제</button>
              </div>
            )}
          </div>

          <div style={{ maxHeight:'45vh', overflowY:'auto', border:'1px solid #e2e8f0', borderRadius:8 }}>
            <table style={{ width:'100%', borderCollapse:'collapse' }}>
              <thead>
                <tr style={theadRowStyle}>
                  <th style={thStyle}>선택</th>
                  <th style={thStyle}>상품명</th>
                  <th style={thStyle}>출고수량</th>
                  <th style={thStyle}>유통기한 상세</th>
                </tr>
              </thead>
              <tbody>
                {lines.map(line => {
                  const orderNoKey = String(line.ORDER_NO);
                  const checked = selection.has(orderNoKey);
                  return (
                    <tr key={orderNoKey} style={tbodyRowStyle}>
                      <td style={tdStyleCenter}>
                        <input
                          type="checkbox"
                          checked={checked}
                          disabled={hasInboundLines}
                          onChange={() => onToggleLine(orderNoKey)}
                        />
                      </td>
                      <td style={tdStyleLeft}>{line.GOODS_NM}</td>
                      <td style={tdStyleRight}>{line.OUT_QTY ?? 0}</td>
                      <td style={tdStyleLeft}>
                        {(line.expiryDetails || []).length === 0 ? (
                          <span style={{ color:'#94a3b8', fontStyle:'italic' }}>없음</span>
                        ) : (
                          <ul style={{ listStyle:'disc', paddingLeft:16, margin:0 }}>
                            {line.expiryDetails!.map((exp: any, idx: number) => (
                              <li key={idx} style={{ fontSize:12 }}>
                                {exp.expD ? `${exp.expD}` : '유통기한미입력'} / {exp.outQty ?? exp.OUT_QTY ?? 0}
                                {exp.lotNo ? ` (LOT:${exp.lotNo})` : ''}
                              </li>
                            ))}
                          </ul>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div style={{ marginTop:20, fontSize:12, color:'#64748b', lineHeight:1.5 }}>
            • 출고취소 시 해당 출고일자의 모든 라인 출고정보(OUT_D, OUT_QTY 등) 및 유통기한 등록정보가 삭제됩니다.<br />
            • 이미 입고(IN_D) 처리된 품목이 존재하면 취소할 수 없습니다.<br />
            • 재확정 시 출고정보와 유통기한을 다시 입력해야 합니다.
          </div>

          <div style={{ display:'flex', justifyContent:'flex-end', marginTop:24, gap:12 }}>
            <button type="button" onClick={onClose} style={secondaryBtnStyle}>닫기</button>
            <button
              type="button"
              onClick={onConfirm}
              disabled={hasInboundLines || !allSelected}
              style={{
                ...primaryBtnStyle,
                opacity: hasInboundLines || !allSelected ? 0.5 : 1,
                cursor: hasInboundLines || !allSelected ? 'not-allowed' : 'pointer'
              }}
            >
              <i className="fas fa-undo" style={{ marginRight:6 }} /> 전체취소 진행
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Inline styles (kept minimal & consistent with existing palette)
const btnStyle: React.CSSProperties = {
  background:'#f1f5f9', border:'1px solid #cbd5e1', padding:'6px 12px', borderRadius:6, cursor:'pointer', fontSize:12
};
const primaryBtnStyle: React.CSSProperties = {
  background:'#dc2626', color:'#fff', border:'none', padding:'10px 18px', borderRadius:8, fontWeight:600, fontSize:14, boxShadow:'0 2px 4px rgba(0,0,0,0.1)'
};
const secondaryBtnStyle: React.CSSProperties = {
  background:'#e2e8f0', color:'#334155', border:'none', padding:'10px 18px', borderRadius:8, fontWeight:500, fontSize:14
};
const theadRowStyle: React.CSSProperties = { background:'#f8fafc' };
const thStyle: React.CSSProperties = { padding:'8px 10px', fontSize:12, color:'#475569', borderBottom:'1px solid #e2e8f0', textAlign:'left', position:'sticky', top:0, background:'#f8fafc' };
const tbodyRowStyle: React.CSSProperties = { borderBottom:'1px solid #f1f5f9' };
const tdStyleLeft: React.CSSProperties = { padding:'6px 10px', fontSize:12, color:'#334155', textAlign:'left', verticalAlign:'top' };
const tdStyleRight: React.CSSProperties = { padding:'6px 10px', fontSize:12, color:'#334155', textAlign:'right', verticalAlign:'top' };
const tdStyleCenter: React.CSSProperties = { padding:'6px 10px', fontSize:12, textAlign:'center', verticalAlign:'middle' };

export default CancelShipmentModal;
