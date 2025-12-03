import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Input, Button, Table } from 'antd';
import type { InputRef } from 'antd';
import { popupSearchService, PopupSearchResult } from '../services/popupSearchService';
import '../styles/ProductSearchPopup.css';

interface SalesProductSearchPopupProps {
  visible: boolean;
  onClose: () => void;
  onSelect: (product: { GOODS_ID: number; GOODS_NM: string; CONSUMER_PRICE?: number; BRAND_NM?: string; BAR_CODE?: string; EXP_D?: string; P_MAIL_AMT?: number | null; P_MAIL_POINT?: number | null }) => void;
  saleDate?: string; // 'YYYY-MM-DD'
  // selected sales store id (will be sent as `store_id` to search-with-price)
  storeId?: string | number;
  initialSearchText?: string;
}

const columns = [
  {
    title: <span style={{ fontSize: 11 }}>No</span>,
    key: 'rowNumber',
    width: 50,
    align: 'center' as const,
    render: (_text: any, _record: any, index: number) => (
      <span style={{ fontSize: 11, color: '#64748b' }}>{index + 1}</span>
    ),
  },
  { 
    title: <span style={{ fontSize: 11 }}>상품구분</span>, 
    dataIndex: 'GOODS_GBN_NM', 
    key: 'GOODS_GBN_NM', 
    width: 80,
    render: (text: any) => <span style={{ fontSize: 11 }}>{text}</span>
  },
  { 
    title: <span style={{ fontSize: 11 }}>상품명</span>,
    dataIndex: 'GOODS_NM', 
    key: 'GOODS_NM', 
    width: 300, 
    render: (_: any, record: any) => (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
        <div style={{ fontWeight: 600, fontSize: 11, color: '#1e293b' }}>{record.GOODS_NM}</div>
        <div style={{ fontSize: 10, color: '#94a3b8' }}>
          {[record.GOODS_ID || '', record.BAR_CODE, record.BRAND_NM].filter(Boolean).join(' · ')}
        </div>
      </div>
    ) 
  },
  { 
    title: <span style={{ fontSize: 11 }}>유통기한</span>, 
    dataIndex: 'EXPIRY_D', 
    key: 'EXPIRY_D', 
    width: 100, 
    align: 'center' as const, 
    render: (_: any, record: any) => {
      const d = record.EXP_D ?? record.EXPIRY_D ?? record.expiry ?? record.expireDate ?? '';
      const full = d ? String(d) : '';
      if (!full) return <span style={{ fontSize: 11, color: '#cbd5e1' }}>-</span>;
      return <span style={{ fontSize: 11, color: '#64748b' }}>{full}</span>;
    } 
  },
  { 
    title: <span style={{ fontSize: 11 }}>재고</span>, 
    dataIndex: 'STORE_QTY', 
    key: 'STORE_QTY', 
    width: 55, 
    align: 'right' as const, 
    render: (_: any, record: any) => {
      const stock = record.STORE_QTY ?? record.STOCK_QTY ?? record.AVAIL_QTY ?? record.INV_QTY ?? record.STORE_STOCK ?? record.QTY ?? 0;
      const n = Number(stock) || 0;
      return (
        <span style={{ 
          color: n > 0 ? '#ef4444' : '#94a3b8', 
          fontWeight: n > 0 ? 700 : 400, 
          fontSize: 11 
        }}>
          {n > 0 ? n.toLocaleString() : '-'}
        </span>
      );
    } 
  },
  { 
    title: <span style={{ fontSize: 11 }}>소비자가</span>, 
    dataIndex: 'CONSUMER_PRICE', 
    key: 'CONSUMER_PRICE', 
    width: 90, 
    align: 'right' as const, 
    render: (_: any, record: any) => {
      const price = record.CONSUMER_PRICE ?? record.SOBIJA_DAN ?? record.consumerPrice ?? null;
      return <span style={{ fontSize: 11, fontWeight: 500 }}>{price != null ? Number(price).toLocaleString() : '-'}</span>;
    } 
  },
  { 
    title: <span style={{ fontSize: 11 }}>특별마일</span>, 
    key: 'SPECIAL_MILEAGE', 
    width: 75, 
    align: 'center' as const, 
    render: (_: any, record: any) => {
      const pMailAmt = record.P_MAIL_AMT ?? null;
      const pMailPoint = record.P_MAIL_POINT ?? null;
      if (pMailAmt != null && pMailPoint != null && Number(pMailAmt) > 0) {
        const multiplier = Math.floor(Number(pMailPoint) * 1000 / Number(pMailAmt));
        return (
          <span style={{ 
            color: '#f59e0b', 
            fontWeight: 700, 
            fontSize: 11,
            background: '#fef3c7',
            padding: '1px 6px',
            borderRadius: 3
          }}>
            {multiplier}x
          </span>
        );
      }
      return <span style={{ fontSize: 11, color: '#cbd5e1' }}>-</span>;
    } 
  },
  { 
    title: <span style={{ fontSize: 11 }}>등록일</span>, 
    dataIndex: 'OPEN_D', 
    key: 'OPEN_D', 
    width: 95,
    render: (text: any) => <span style={{ fontSize: 11, color: '#64748b' }}>{text}</span>
  },
  { 
    title: <span style={{ fontSize: 11 }}>종료일</span>, 
    dataIndex: 'CLOSE_D', 
    key: 'CLOSE_D', 
    width: 95,
    render: (text: any) => <span style={{ fontSize: 11, color: '#64748b' }}>{text}</span>
  },
  { 
    title: <span style={{ fontSize: 11 }}>상품코드</span>, 
    dataIndex: 'GOODS_ID', 
    key: 'GOODS_ID', 
    width: 90,
    render: (text: any) => <span style={{ fontSize: 11, color: '#64748b', fontFamily: 'monospace' }}>{text}</span>
  },
];

const SalesProductSearchPopup: React.FC<SalesProductSearchPopupProps> = ({ visible, onClose, onSelect, saleDate, storeId, initialSearchText }) => {
  const [searchText, setSearchText] = useState('');
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<PopupSearchResult[]>([]);
  const [selectedRow, setSelectedRow] = useState<PopupSearchResult | null>(null);
  const inputRef = useRef<InputRef>(null);
  const [, setIsNarrow] = useState<boolean>(typeof window !== 'undefined' ? window.innerWidth < 640 : false);
  const [position, setPosition] = useState({ x: 100, y: 100 });
  const [isDragging, setIsDragging] = useState(false);
  const dragOffset = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const onResize = () => setIsNarrow(window.innerWidth < 640);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  // 팝업 열릴 때 중앙 위치로 초기화
  useEffect(() => {
    if (visible) {
      const popupWidth = 1100;
      const popupHeight = 600;
      const centerX = Math.max(50, (window.innerWidth - popupWidth) / 2);
      const centerY = Math.max(50, (window.innerHeight - popupHeight) / 4);
      setPosition({ x: centerX, y: centerY });
    }
  }, [visible]);

  // If opened with an initial search text (e.g., barcode quick search), trigger a search
  useEffect(() => {
    if (!visible) return;
    if (initialSearchText && initialSearchText.trim() !== '') {
      setSearchText(initialSearchText);
      setTimeout(() => handleSearch(initialSearchText), 50);
      return;
    }
    // default initial search when opened
    handleSearch('');
  }, [visible]);

  // 드래그 핸들러
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    if (target.closest('.sales-product-search-modal-header') && !target.closest('button')) {
      e.preventDefault();
      setIsDragging(true);
      dragOffset.current = {
        x: e.clientX - position.x,
        y: e.clientY - position.y
      };
    }
  }, [position]);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDragging) return;
    requestAnimationFrame(() => {
      const newX = e.clientX - dragOffset.current.x;
      const newY = e.clientY - dragOffset.current.y;
      // 화면 경계 제한
      const maxX = window.innerWidth - 800;
      const maxY = window.innerHeight - 400;
      setPosition({
        x: Math.max(0, Math.min(newX, maxX)),
        y: Math.max(0, Math.min(newY, maxY))
      });
    });
  }, [isDragging]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove as any);
      document.addEventListener('mouseup', handleMouseUp);
      document.body.style.userSelect = 'none';
      document.body.style.cursor = 'grabbing';
      return () => {
        document.removeEventListener('mousemove', handleMouseMove as any);
        document.removeEventListener('mouseup', handleMouseUp);
        document.body.style.userSelect = '';
        document.body.style.cursor = '';
      };
    }
  }, [isDragging, handleMouseMove, handleMouseUp]);

  const handleSearch = async (term?: string) => {
    const q = typeof term === 'string' ? term : searchText;
    setLoading(true);
    try {
      console.debug('[SalesProductSearchPopup] handleSearch', { q, saleDate, storeId });
      const result = await popupSearchService.searchProductsForPopup({
        searchText: q,
        excludeEndedProducts: false,
        saleDate: saleDate,
        storeId: storeId
      } as any);
      // attach a stable row index to each result so we can build a unique rowKey
      setData((result || []).map((r: any, idx: number) => ({ ...r, __rowIndex: idx })));
    } finally {
      setLoading(false);
    }
  };

  const handleOk = () => {
      if (selectedRow) {
      onSelect({
        GOODS_ID: selectedRow.GOODS_ID,
        GOODS_NM: selectedRow.GOODS_NM,
        CONSUMER_PRICE: (selectedRow as any).CONSUMER_PRICE || (selectedRow as any).consumerPrice,
        BRAND_NM: (selectedRow as any).BRAND_NM ?? (selectedRow as any).BRAND_GBN_NM ?? '',
        BAR_CODE: (selectedRow as any).BAR_CODE ?? '',
        P_MAIL_AMT: (selectedRow as any).P_MAIL_AMT ?? null,
        P_MAIL_POINT: (selectedRow as any).P_MAIL_POINT ?? null
      } as any);
      onClose();
    }
  };

  if (!visible) return null;

  return (
    <div className="sales-popup-overlay-transparent" style={{ position: 'fixed', inset: 0, zIndex: 9998, pointerEvents: 'none' }}>
      <div 
        className="sales-product-search-popup-container"
        style={{
          position: 'fixed',
          left: `${position.x}px`,
          top: `${position.y}px`,
          width: '900px',
          maxWidth: '90vw',
          maxHeight: '75vh',
          background: 'linear-gradient(to bottom, #ffffff 0%, #f8fafc 100%)',
          borderRadius: '16px',
          //boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25), 0 0 0 1px rgba(148,163,184,0.1)',
          display: 'flex',
          flexDirection: 'column',
          zIndex: 9999,
          pointerEvents: 'all',
          cursor: isDragging ? 'grabbing' : 'default',
          overflow: 'hidden'
        }}
        onMouseDown={handleMouseDown}
      >
        <div
          className="sales-product-search-modal-header"
          style={{ 
            display: 'flex', 
            alignItems: 'center', 
            cursor: isDragging ? 'grabbing' : 'grab',
            padding: '8px 14px',
            //background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
            color: '#fff',
            borderBottom: '2px solid #334155',
            userSelect: 'none'
          }}
        >
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            width: 28,
            height: 28,
            borderRadius: 6,
            background: 'rgba(255,255,255,0.1)',
            marginRight: 8
          }}>
            <i className="fas fa-search" style={{ fontSize: 13 }}></i>
          </div>
          <span style={{ fontSize: 13, fontWeight: 700, letterSpacing: '-0.3px', lineHeight: 1.2, flex: 1 }}>
            상품 검색{data.length > 0 ? ` · ${data.length}건` : ''}
          </span>
          <button 
            onClick={onClose}
            style={{
              background: 'rgba(255,255,255,0.1)',
              border: '1px solid rgba(255,255,255,0.2)',
              borderRadius: '6px',
              width: '28px',
              height: '28px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              color: '#fff',
              fontSize: '14px',
              transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(239,68,68,0.9)';
              e.currentTarget.style.borderColor = 'rgba(239,68,68,1)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(255,255,255,0.1)';
              e.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)';
            }}
          >
            <i className="fas fa-times"></i>
          </button>
        </div>
        <div className="sales-product-search-modal-body" style={{ 
          padding: '6px 12px 6px', 
          background: '#ffffff',
          borderBottom: '1px solid #cbd5e1' 
        }}>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <Input
              ref={inputRef}
              placeholder="상품명, 상품코드, 바코드로 검색하세요"
              value={searchText}
              onChange={e => setSearchText(e.target.value)}
              onPressEnter={() => handleSearch(searchText)}
              allowClear
              style={{ 
                flex: 1,
                height: 32, 
                fontSize: 12,
                borderRadius: 6,
                border: '2px solid #cbd5e1',
                boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
              }}
            />
            <Button
              type="primary"
              onClick={() => handleSearch(searchText)}
              loading={loading}
              style={{ 
                height: 32, 
                fontSize: 12, 
                fontWeight: 600, 
                padding: '0 16px',
                borderRadius: 6,
                background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                border: 'none',
                boxShadow: '0 4px 6px -1px rgba(37,99,235,0.3)'
              }}
            >
              <i className="fas fa-search" style={{ fontSize: 12, marginRight: 6 }} /> 검색
            </Button>
          </div>
        </div>
        <div className="product-search-popup-table" style={{ 
          flex: 1, 
          padding: '0 12px 12px', 
          background: '#fff', 
          overflow: 'auto' 
        }}>
          <Table
            rowKey={(record: any) => `${record.GOODS_ID}_${((record as any).EXP_D || (record as any).EXPIRY_D || (record as any).expiry || '').toString()}_${record.__rowIndex}`}
            columns={columns}
            dataSource={data}
            loading={loading}
            size="small"
            bordered
            pagination={{ 
              pageSize: 1000, 
              showSizeChanger: false, 
              size: 'small',
              style: { marginTop: 8, marginBottom: 0 }
            }}
            rowSelection={{
              type: 'radio',
              selectedRowKeys: selectedRow ? [
                `${(selectedRow as any).GOODS_ID}_${((selectedRow as any).EXP_D || (selectedRow as any).EXPIRY_D || (selectedRow as any).expiry || '')}_${(selectedRow as any).__rowIndex}`
              ] : [],
              onChange: (_selectedRowKeys, selectedRows) => {
                setSelectedRow(selectedRows[0] || null);
              },
            }}
            onRow={record => ({
              onClick: () => setSelectedRow(record),
              onDoubleClick: () => {
                setSelectedRow(record);
                setSelectedRow(record);
                onSelect({
                  GOODS_ID: record.GOODS_ID,
                  GOODS_NM: record.GOODS_NM,
                  CONSUMER_PRICE: (record as any).CONSUMER_PRICE || (record as any).consumerPrice,
                  BRAND_NM: (record as any).BRAND_NM ?? (record as any).BRAND_GBN_NM ?? '',
                  BAR_CODE: (record as any).BAR_CODE ?? '',
                  EXP_D: (record as any).EXP_D ?? (record as any).EXPIRY_D ?? (record as any).expiry ?? '',
                  P_MAIL_AMT: (record as any).P_MAIL_AMT ?? null,
                  P_MAIL_POINT: (record as any).P_MAIL_POINT ?? null
                } as any);
              },
            })}
            scroll={{ y: 400 }}
            style={{ 
              fontSize: 11,
              borderRadius: 12,
              overflow: 'hidden',
              boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
            }}
          />
        </div>
        <div className="sales-product-search-modal-footer" style={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between',
          padding: '8px 12px',
          background: 'linear-gradient(to top, #f1f5f9 0%, #ffffff 100%)',
          borderTop: '2px solid #e2e8f0',
          gap: '12px'
        }}>
          <div style={{ 
            fontSize: 13, 
            color: '#64748b', 
            fontWeight: 600 
          }}>
            {selectedRow ? (
              <span style={{ color: '#3b82f6' }}>
                <i className="fas fa-check-circle" style={{ marginRight: 6 }}></i>
                1건 선택됨
              </span>
            ) : (
              <span>상품을 선택해주세요</span>
            )}
          </div>
          <div style={{ display: 'flex', gap: '10px' }}>
            <Button
              onClick={onClose}
              style={{
                minWidth: 80,
                height: 32,
                fontWeight: 600,
                border: '2px solid #e2e8f0',
                color: '#64748b',
                background: '#fff',
                borderRadius: 6,
                fontSize: 12,
                boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
              }}
            >
              닫기
            </Button>
            <Button
              type="primary"
              style={{
                minWidth: 80,
                height: 32,
                fontWeight: 700,
                borderRadius: 6,
                fontSize: 12,
                background: selectedRow 
                  ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)' 
                  : 'linear-gradient(135deg, #94a3b8 0%, #64748b 100%)',
                border: 'none',
                boxShadow: selectedRow 
                  ? '0 4px 6px -1px rgba(16,185,129,0.4)' 
                  : '0 1px 2px rgba(0,0,0,0.05)',
                cursor: selectedRow ? 'pointer' : 'not-allowed'
              }}
              onClick={handleOk}
              disabled={!selectedRow}
            >
              <i className="fas fa-check" style={{ fontSize: 12, marginRight: 6 }} />
              선택 확정
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SalesProductSearchPopup;
