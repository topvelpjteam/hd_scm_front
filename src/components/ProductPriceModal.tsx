
import React, { useEffect, useState, useRef } from 'react';
import { Modal, Button, Input, DatePicker } from 'antd';
import { getGoodsList } from '../services/productService';
import CommonMultiSelect from './CommonMultiSelect';
import './ProductPriceModal.css';
import dayjs, { Dayjs } from 'dayjs';

interface GoodsItem {
  GOODS_ID: number;
  GOODS_NM: string;
  BRAND_ID: string;
  BRAND_GBN_NM: string;
  LAST_OPEN_D?: string;
  LAST_CLOSE_D?: string;
  LAST_SOBIJA_DAN?: number;
  newStartDate?: string;
  newEndDate?: string;
  newPrice?: number;
  remark?: string; // 적요
  selected?: boolean;
}

interface SearchCondition {
  brandIds: string[];
  btypeGbns: string[];
  mtypeGbns: string[];
  stypeGbns: string[];
  goodsNm: string;
  openDateFrom: string;
  openDateTo: string;
}

interface ProductPriceModalProps {
  open: boolean;
  onClose: () => void;
  onSave: (data: GoodsItem[]) => void;
  searchCondition: SearchCondition;
}


const ProductPriceModal: React.FC<ProductPriceModalProps> = ({ open, onClose, onSave, searchCondition }) => {
  const [goodsList, setGoodsList] = useState<GoodsItem[]>([]);
  const [selectAll, setSelectAll] = useState(false);
  const [loading, setLoading] = useState(false);
  const [allStartDate, setAllStartDate] = useState<Dayjs | null>(null);
  const [allEndDate, setAllEndDate] = useState<Dayjs | null>(null);
  const startDateInputRef = useRef<any>(null);
  const endDateInputRef = useRef<any>(null);
  // 팝업 내 검색조건 상태 (적용일자 제외)
  const [modalBrandIds, setModalBrandIds] = useState<string[]>([]);
  const [modalBtypeGbns, setModalBtypeGbns] = useState<string[]>([]);
  const [modalMtypeGbns, setModalMtypeGbns] = useState<string[]>([]);
  const [modalStypeGbns, setModalStypeGbns] = useState<string[]>([]);
  const [modalGoodsNm, setModalGoodsNm] = useState<string>('');

  // 재조회 및 최초조회 공통 함수 (팝업 내 검색조건 사용)
  const fetchGoodsList = () => {
    setLoading(true);
    let agentId = '';
    try {
      const userStr = sessionStorage.getItem('user');
      if (userStr) {
        const userObj = JSON.parse(userStr);
        agentId = userObj.agentId || '';
      }
    } catch {}
    const params: any = {
      searchAgentId: agentId,
      searchBrandId: modalBrandIds.join(',') || undefined,
      searchBtypeGbn: modalBtypeGbns.join(',') || undefined,
      searchMtypeGbn: modalMtypeGbns.join(',') || undefined,
      searchStypeGbn: modalStypeGbns.join(',') || undefined,
      searchGoodsNm: modalGoodsNm || undefined,
    };
    getGoodsList(params)
      .then((data: any[]) => {
        // ensure selected flag exists
        const mapped = (data || []).map((it: any) => ({ ...it, selected: false }));
        setGoodsList(mapped);
      })
      .finally(() => setLoading(false));
  };

  // 팝업 오픈 시 부모 검색조건을 기본값으로 세팅
  useEffect(() => {
    if (open) {
      setModalBrandIds(searchCondition.brandIds || []);
      setModalBtypeGbns(searchCondition.btypeGbns || []);
      setModalMtypeGbns(searchCondition.mtypeGbns || []);
      setModalStypeGbns(searchCondition.stypeGbns || []);
      setModalGoodsNm(searchCondition.goodsNm || '');
      // 최초 조회
      setTimeout(() => fetchGoodsList(), 0);
    }
    // eslint-disable-next-line
  }, [open]);

  const handleAllStartDateApply = () => {
    if (!allStartDate) return;
    setGoodsList((prev) => prev.map((item) => ({ ...item, newStartDate: allStartDate.format('YYYY-MM-DD') })));
  };
  const handleAllEndDateApply = () => {
    if (!allEndDate) return;
    setGoodsList((prev) => prev.map((item) => ({ ...item, newEndDate: allEndDate.format('YYYY-MM-DD') })));
  };

  const handleItemChange = (idx: number, key: keyof GoodsItem, value: any) => {
    setGoodsList((prev) => {
      const next = [...prev];
      next[idx] = { ...next[idx], [key]: value, selected: true };
      return next;
    });
  };

  const toggleSelectItem = (idx: number) => {
    setGoodsList(prev => {
      const next = [...prev];
      next[idx] = { ...next[idx], selected: !next[idx].selected };
      setSelectAll(next.every(x => x.selected));
      return next;
    });
  };

  const toggleSelectAll = () => {
    setSelectAll(prev => {
      const next = !prev;
      setGoodsList(g => g.map(x => ({ ...x, selected: next })));
      return next;
    });
  };

  // Bulk discount and remark
  const [bulkDiscount, setBulkDiscount] = useState<string>(''); // percent as string
  const [bulkRemark, setBulkRemark] = useState<string>('');

  const handleBulkDiscountApply = () => {
    const pct = Number(bulkDiscount);
    if (isNaN(pct)) {
      alert('유효한 할인율을 입력하세요.');
      return;
    }
    setGoodsList(prev => prev.map(item => {
      const base = item.LAST_SOBIJA_DAN ?? 0;
      const newPrice = Math.round(base * (100 - pct) / 100);
      return { ...item, newPrice, selected: true };
    }));
  };

  const handleBulkDiscountCancel = () => {
    setGoodsList(prev => prev.map(item => ({ ...item, newPrice: undefined })));
  };

  const handleBulkRemarkApply = () => {
    setGoodsList(prev => prev.map(item => ({ ...item, remark: bulkRemark })));
  };

  const handleBulkRemarkCancel = () => {
    setGoodsList(prev => prev.map(item => ({ ...item, remark: undefined })));
  };

  const handleAllStartDateCancel = () => {
    setGoodsList(prev => prev.map(item => ({ ...item, newStartDate: undefined })));
  };

  const handleAllEndDateCancel = () => {
    setGoodsList(prev => prev.map(item => ({ ...item, newEndDate: undefined })));
  };

  // 저장 전 유효성 검사 및 변경 내역 체크
  const handleSave = () => {
    // 필수 입력 및 변경된 행만 추출
    const changedRows = goodsList.filter(item => {
      // 필수값: 상품코드, 신규적용일자, 신규적용소비자가
      if (!item.GOODS_ID || !item.newStartDate || item.newPrice === undefined || item.newPrice === null) {
        return false;
      }
      // 변경 여부: 신규적용일자, 신규종료일자, 신규적용소비자가 중 하나라도 기존값과 다르면 변경
      const changed =
        (item.newStartDate && item.newStartDate !== item.LAST_OPEN_D) ||
        (item.newEndDate && item.newEndDate !== item.LAST_CLOSE_D) ||
        (item.newPrice !== undefined && item.newPrice !== null && item.newPrice !== item.LAST_SOBIJA_DAN);
      return changed;
    });

    // 필수값 누락 행 체크
    const missingRequired = goodsList.filter(item => {
      return (
        (item.newStartDate || item.newEndDate || item.newPrice !== undefined) &&
        (!item.GOODS_ID || !item.newStartDate || item.newPrice === undefined || item.newPrice === null)
      );
    });

    if (missingRequired.length > 0) {
      alert('필수 입력값(상품코드, 신규적용일자, 신규적용소비자가)이 누락된 행이 있습니다.');
      return;
    }
    if (changedRows.length === 0) {
      alert('변경되거나 입력된 내역이 없습니다.');
      return;
    }
    // 전달형식: 부모 컴포넌트(`ProductPriceRegistration`)가 `remark`를 `memo`로 변환합니다.
    onSave(changedRows);
  };




  // DatePicker input에서 8자리 숫자 입력 시 dayjs로 파싱해서 바로 반영
  const handleDateInputChange = (type: 'start' | 'end', e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    if (/^\d{8}$/.test(raw)) {
      const parsed = dayjs(raw, 'YYYYMMDD');
      if (parsed.isValid()) {
        if (type === 'start') setAllStartDate(parsed);
        if (type === 'end') setAllEndDate(parsed);
        return;
      }
    }
    // fallback: 빈 값 또는 잘못된 값은 null 처리
    if (type === 'start') setAllStartDate(null);
    if (type === 'end') setAllEndDate(null);
  };

  return (
    <Modal
      open={open}
      onCancel={onClose}
      onOk={handleSave}
      okText="저장"
      title={
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <i className="fas fa-tags" style={{ color: '#0f172a', fontSize: 18 }} />
          <span style={{ fontSize: 16, fontWeight: 700, color: '#0f172a' }}>상품 가격 신규 등록</span>
        </div>
      }
      width={1440}
      style={{ top: 30, minHeight: 640 }}
      className="project-popup-style modern-modal product-price-modal-root"
      confirmLoading={loading}
      styles={{ body: { fontSize: 13, minHeight: 560, background: '#f6f8fb', padding: 18, borderRadius: 12 } }}
    >
      <div className="product-price-modal-root" style={{ width: '100%' }}>
        {/* 검색 파트 */}
        <div className="modal-section">
          <div className="modal-section-title">
            <i className="fas fa-search"></i> 상품 검색조건
          </div>
          <div className="modal-search-row">
            <CommonMultiSelect
              commonCodeType="brands"
              selectedValues={modalBrandIds}
              onSelectionChange={setModalBrandIds}
              placeholder="브랜드 선택"
            />
            <CommonMultiSelect
              commonCodeType="btypes"
              selectedValues={modalBtypeGbns}
              onSelectionChange={setModalBtypeGbns}
              placeholder="대분류 선택"
            />
            <CommonMultiSelect
              commonCodeType="mtypes"
              selectedValues={modalMtypeGbns}
              onSelectionChange={setModalMtypeGbns}
              placeholder="중분류 선택"
            />
            <CommonMultiSelect
              commonCodeType="stypes"
              selectedValues={modalStypeGbns}
              onSelectionChange={setModalStypeGbns}
              placeholder="소분류 선택"
            />
            <Input
              value={modalGoodsNm}
              onChange={e => setModalGoodsNm(e.target.value)}
              placeholder="상품명"
              allowClear
            />
            <div className="modal-btn-group">
              <Button onClick={fetchGoodsList} loading={loading} className="olm-btn olm-btn-primary">
                <i className="fas fa-sync-alt"></i> 재검색
              </Button>
            </div>
          </div>
        </div>
        {/* 일괄적용 파트 */}
        <div className="modal-section">
          <div className="modal-section-title">
            <i className="fas fa-calendar-plus"></i> 신규 적용/종료일자 일괄적용
          </div>
          <div className="modal-header-row modern-header-row" style={{ width: '100%', margin: 0 }}>
            <div className="price-bulk-row-practical">
              <div className="price-bulk-group">
                <div className="price-bulk-label">신규적용일자</div>
                <div className="price-bulk-control-wrap">
                  <DatePicker
                    value={allStartDate}
                    onChange={(date) => setAllStartDate(date)}
                    format="YYYY-MM-DD"
                    placeholder="일자입력"
                    allowClear
                    className="price-bulk-datepicker"
                    inputReadOnly={false}
                    ref={startDateInputRef}
                    onInput={e => handleDateInputChange('start', e as React.ChangeEvent<HTMLInputElement>)}
                  />
                  <Button onClick={handleAllStartDateApply} className="olm-btn olm-btn-sm">전체적용</Button>
                  <Button onClick={handleAllStartDateCancel} className="olm-btn olm-btn-sm olm-btn-secondary">적용취소</Button>
                </div>
              </div>

              <div className="price-bulk-group">
                <div className="price-bulk-label">신규종료일자</div>
                <div className="price-bulk-control-wrap">
                  <DatePicker
                    value={allEndDate}
                    onChange={(date) => setAllEndDate(date)}
                    format="YYYY-MM-DD"
                    placeholder="일자입력"
                    allowClear
                    className="price-bulk-datepicker"
                    inputReadOnly={false}
                    ref={endDateInputRef}
                    onInput={e => handleDateInputChange('end', e as React.ChangeEvent<HTMLInputElement>)}
                  />
                  <Button onClick={handleAllEndDateApply} className="olm-btn olm-btn-sm">전체적용</Button>
                  <Button onClick={handleAllEndDateCancel} className="olm-btn olm-btn-sm olm-btn-secondary">적용취소</Button>
                </div>
              </div>

              <div className="price-bulk-group">
                <div className="price-bulk-label">할인율(%)</div>
                <div className="price-bulk-control-wrap">
                  <Input size="small" className="price-bulk-input" value={bulkDiscount} onChange={e => setBulkDiscount(e.target.value)} placeholder="예:10" />
                  <Button onClick={handleBulkDiscountApply} className="olm-btn olm-btn-sm">전체적용</Button>
                  <Button onClick={handleBulkDiscountCancel} className="olm-btn olm-btn-sm olm-btn-secondary">적용취소</Button>
                </div>
              </div>

              <div className="price-bulk-group">
                <div className="price-bulk-label">적요</div>
                <div className="price-bulk-control-wrap">
                  <Input size="small" className="price-bulk-input" value={bulkRemark} onChange={e => setBulkRemark(e.target.value)} placeholder="적요 입력" />
                  <Button onClick={handleBulkRemarkApply} className="olm-btn olm-btn-sm">전체적용</Button>
                  <Button onClick={handleBulkRemarkCancel} className="olm-btn olm-btn-sm olm-btn-secondary">적용취소</Button>
                </div>
              </div>
            </div>
          </div>
        </div>
        {/* 테이블 파트 */}
        <div className="modal-section" style={{ paddingTop: 10 }}>
          <div className="modal-section-title">
            <i className="fas fa-table"></i> 상품 가격 목록
          </div>
          <div className="modal-table-wrapper modern-table-wrapper" style={{ width: '100%', overflowX: 'auto', margin: 0 }}>
            <table className="modal-table modern-table" style={{ minWidth: 1000 }}>
              <thead>
                <tr>
                  <th style={{ width: 40, textAlign: 'center' }}>
                    <input type="checkbox" checked={selectAll} onChange={toggleSelectAll} />
                  </th>
                  <th>브랜드</th>
                  <th>상품코드</th>
                  <th>상품명</th>
                  <th>현재적용일자</th>
                  <th>현재종료일자</th>
                  <th>현재소비자가</th>
                  <th>신규적용일자</th>
                  <th>신규종료일자</th>
                  <th>신규적용소비자가</th>
                  <th>적요</th>
                </tr>
              </thead>
              <tbody>
                {goodsList.map((item, idx) => {
                  // 브랜드별 색상 클래스 (간단 예시: BRAND_ID 기준)
                  const brandClass = item.BRAND_ID ? `brand-row-${item.BRAND_ID}` : '';
                  return (
                    <tr key={item.GOODS_ID} className={brandClass}>
                              <td style={{ textAlign: 'center' }}>
                                <input type="checkbox" checked={!!item.selected} onChange={() => toggleSelectItem(idx)} />
                              </td>
                              <td>{item.BRAND_GBN_NM}</td>
                      <td>{item.GOODS_ID}</td>
                      <td>{item.GOODS_NM}</td>
                              <td>{item.LAST_OPEN_D || ''}</td>
                              <td>{item.LAST_CLOSE_D || ''}</td>
                              <td style={{ textAlign: 'right' }}>{item.LAST_SOBIJA_DAN != null ? Number(item.LAST_SOBIJA_DAN).toLocaleString() : ''}</td>
                      <td>
                        <DatePicker
                          value={item.newStartDate ? dayjs(item.newStartDate) : null}
                          onChange={(date) => handleItemChange(idx, 'newStartDate', date ? date.format('YYYY-MM-DD') : undefined)}
                          format="YYYY-MM-DD"
                          placeholder="일자입력"
                          allowClear
                          style={{ width: 120, background: '#fff9db' }}
                          inputReadOnly={false}
                          onInput={e => {
                            const raw = (e.target as HTMLInputElement).value;
                            if (/^\d{8}$/.test(raw)) {
                              const parsed = dayjs(raw, 'YYYYMMDD');
                              if (parsed.isValid()) {
                                handleItemChange(idx, 'newStartDate', parsed.format('YYYY-MM-DD'));
                              }
                            }
                          }}
                        />
                      </td>
                      <td>
                        <DatePicker
                          value={item.newEndDate ? dayjs(item.newEndDate) : null}
                          onChange={(date) => handleItemChange(idx, 'newEndDate', date ? date.format('YYYY-MM-DD') : undefined)}
                          format="YYYY-MM-DD"
                          placeholder="일자입력"
                          allowClear
                          style={{ width: 120 }}
                          inputReadOnly={false}
                          onInput={e => {
                            const raw = (e.target as HTMLInputElement).value;
                            if (/^\d{8}$/.test(raw)) {
                              const parsed = dayjs(raw, 'YYYYMMDD');
                              if (parsed.isValid()) {
                                handleItemChange(idx, 'newEndDate', parsed.format('YYYY-MM-DD'));
                              }
                            }
                          }}
                        />
                      </td>
                      <td>
                        <Input
                          size="small"
                          type="text"
                          inputMode="numeric"
                          value={item.newPrice !== undefined && item.newPrice !== null ? item.newPrice.toLocaleString() : ''}
                          onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                            // 숫자만 추출
                            const raw = e.target.value.replace(/[^\d]/g, '');
                            handleItemChange(idx, 'newPrice', raw ? Number(raw) : undefined);
                          }}
                          style={{ width: 'auto', minWidth: 110, textAlign: 'right', background: '#fff9db' }}
                        />
                      </td>
                      <td>
                        <Input
                          size="small"
                          style={{ width: '100%' }}
                          value={item.remark || ''}
                          maxLength={100}
                          placeholder="적요 입력"
                          onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                            handleItemChange(idx, 'remark', e.target.value);
                          }}
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {/* 테이블 하단 조회건수 */}
          <div style={{ display: 'flex', alignItems: 'center', marginTop: 4 }}>
            <div style={{ flex: 1, textAlign: 'left', fontSize: 13, color: '#2563eb', fontWeight: 600 }}>
              총 <b>{goodsList.length}</b>건
            </div>
          </div>
        </div>
      </div>
    </Modal>
  );
};

export default ProductPriceModal;
