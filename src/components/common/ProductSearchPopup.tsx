import React, { useState, useRef } from 'react';
import { Modal, Input, Button, Table } from 'antd';
import type { InputRef } from 'antd';
import { popupSearchService, PopupSearchResult } from '../../services/popupSearchService';
import '../../styles/ProductSearchPopup.css';

interface ProductSearchPopupProps {
  visible: boolean;
  onClose: () => void;
  onSelect: (product: { GOODS_ID: number; GOODS_NM: string }) => void;
}

const columns = [
  {
    title: 'No',
    key: 'rowNumber',
    width: 60,
    align: 'center' as const,
    render: (_text: any, _record: any, index: number) => index + 1,
  },
  { title: '상품구분', dataIndex: 'GOODS_GBN_NM', key: 'GOODS_GBN_NM', width: 100 },
  { title: '상품명', dataIndex: 'GOODS_NM', key: 'GOODS_NM', width: 220, render: (_: any, record: any) => (
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        <div style={{ fontWeight: 600 }}>{record.GOODS_NM}</div>
        <div style={{ fontSize: 12, color: '#64748b' }}>{[record.GOODS_ID || '', record.BAR_CODE, record.BRAND_NM].filter(Boolean).join(' · ')}</div>
      </div>
    ) },
  { title: '등록일자', dataIndex: 'OPEN_D', key: 'OPEN_D', width: 110 },
  { title: '종료일자', dataIndex: 'CLOSE_D', key: 'CLOSE_D', width: 110 },
  { title: '상품코드', dataIndex: 'GOODS_ID', key: 'GOODS_ID', width: 120 },
];

const ProductSearchPopup: React.FC<ProductSearchPopupProps> = ({ visible, onClose, onSelect }) => {
  const [searchText, setSearchText] = useState('');
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<PopupSearchResult[]>([]);
  const [selectedRow, setSelectedRow] = useState<PopupSearchResult | null>(null);
  const inputRef = useRef<InputRef>(null);

  const handleSearch = async () => {
    setLoading(true);
    try {
      const result = await popupSearchService.searchProductsForPopup({
        searchText,
        excludeEndedProducts: false,
      });
      setData(result);
    } finally {
      setLoading(false);
    }
  };

  const handleOk = () => {
    if (selectedRow) {
      onSelect({ GOODS_ID: selectedRow.GOODS_ID, GOODS_NM: selectedRow.GOODS_NM });
      onClose();
    }
  };

  return (
    <Modal
      open={visible}
      centered
      wrapClassName="product-search-popup-wrap"
      footer={null}
      width={900}
      destroyOnClose
      afterClose={() => setData([])}
      className="product-search-popup-modal product-price-modal-root sales-product-search-modal"
      onCancel={onClose}
      styles={{
        body: { padding: 0, background: '#f4f6fb', borderRadius: 12 },
      }}
    >
      <div className="sales-product-search-modal-content">
        <div className="sales-product-search-modal-header" style={{ display: 'flex', alignItems: 'center' }}>
          <i className="fas fa-search" style={{ fontSize: 20, marginRight: 8 }}></i>
          <span style={{ fontSize: 18, fontWeight: 700, letterSpacing: '-0.4px', lineHeight: 1.1 }}>상품검색</span>
        </div>
        <div className="sales-product-search-modal-body">
          <div className="sales-product-search-toolbar">
            <div className="sales-product-search-input-group">
              <Input
                ref={inputRef}
                placeholder="상품명, 상품코드, 바코드로 검색"
                value={searchText}
                onChange={e => setSearchText(e.target.value)}
                onPressEnter={handleSearch}
                allowClear
                className="sales-product-search-input"
                style={{ width: 320 }}
              />
              <Button
                type="primary"
                onClick={handleSearch}
                loading={loading}
                className="sales-product-search-btn-modal"
              >
                <i className="fas fa-search" style={{ fontSize: 14, marginRight: 6 }} /> 조회
              </Button>
            </div>
          </div>
          <div style={{ flex: 1 }} />
          {/* 검색건수 표시 */}
          <span style={{ color: '#2563eb', fontWeight: 600, fontSize: 15, alignSelf: 'center', marginRight: 8 }}>
            {data.length > 0 ? `검색결과 ${data.length}건` : ''}
          </span>
        </div>
        <div className="product-search-popup-table sales-product-search-grid-wrapper" style={{ background: '#fff', borderRadius: 8, border: '1.5px solid #e0e7ef', boxShadow: '0 1px 4px rgba(30,41,59,0.06)', fontSize: 13, color: '#222', marginBottom: 0 }}>
          <Table
            rowKey="GOODS_ID"
            columns={columns}
            dataSource={data}
            loading={loading}
            size="small"
            bordered
            pagination={{ pageSize: 20, showSizeChanger: false }}
            rowSelection={{
              type: 'radio',
              selectedRowKeys: selectedRow ? [selectedRow.GOODS_ID] : [],
              onChange: (_selectedRowKeys, selectedRows) => {
                setSelectedRow(selectedRows[0] || null);
              },
            }}
            onRow={record => ({
              onDoubleClick: () => {
                // 전달은 하지만 팝업은 닫지 않음
                setSelectedRow(record);
                onSelect({ GOODS_ID: record.GOODS_ID, GOODS_NM: record.GOODS_NM });
              },
            })}
            scroll={{ x: 900, y: 640 }}
            style={{ background: '#fff', borderRadius: 8 }}
            rowClassName={() => 'product-search-popup-row'}
          />
        </div>
          <div className="sales-product-search-modal-footer" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 8 }}>
            <div className="selected-count" style={{ color: '#2563eb', fontWeight: 600, fontSize: 15 }}>
              {data.length > 0 ? `검색결과 ${data.length}건` : ''}
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
              <Button
                onClick={onClose}
                className="modal-btn modal-btn-outline sales-add-products-btn sales-cancel-btn"
                style={{
                  minWidth: 80,
                  fontWeight: 600,
                  border: '1.5px solid #2563eb',
                  color: '#2563eb',
                  background: '#fff',
                  borderRadius: 5,
                  height: 44,
                  fontSize: 16
                }}
              >
                닫기
              </Button>
              <Button
                type="primary"
                className="modal-btn modal-btn-export sales-add-products-btn"
                style={{
                  minWidth: 80,
                  fontWeight: 700,
                  borderRadius: 5,
                  height: 44,
                  fontSize: 16,
                  background: 'linear-gradient(90deg,#059669 60%,#34d399 100%)',
                  border: 'none',
                  color: '#fff',
                  boxShadow: '0 1px 4px rgba(16,185,129,0.08)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6
                }}
                onClick={handleOk}
                disabled={!selectedRow}
              >
                <i className="fas fa-check-circle" style={{ fontSize: 17, marginRight: 2 }} /> 선택
              </Button>
            </div>
          </div>
      </div>
    </Modal>
  );
};

export default ProductSearchPopup;
