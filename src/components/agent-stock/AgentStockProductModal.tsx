import React, { useCallback, useEffect, useMemo, useState } from 'react';
import Modal from '../common/Modal';
import {
  popupSearchService,
  PopupSearchResult,
} from '../../services/popupSearchService';
import './AgentStockProductModal.css';

export interface SelectedGood {
  goodsId: string;
  goodsNm: string;
  brandNm?: string;
  goodsGbnNm?: string;
}

interface AgentStockProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialSelectedGoods: SelectedGood[];
  onConfirm: (selected: SelectedGood[]) => void;
  filters: {
    goodsGbns: string[];
    brandIds: string[];
    mtypeList: string[];
    availableBrandIds?: string[];
    loginAgentId?: string;
  };
}

const mapPopupResultToSelectedGood = (item: PopupSearchResult): SelectedGood => ({
  goodsId: String(item.GOODS_ID),
  goodsNm: item.GOODS_NM || item.GOODS_ID_BRAND || String(item.GOODS_ID),
  brandNm: item.brand || item.BRAND_NM || item.BRAND_GBN_NM || item.GOODS_ID_BRAND,
  goodsGbnNm: item.GOODS_GBN_NM,
});

const AgentStockProductModal: React.FC<AgentStockProductModalProps> = ({
  isOpen,
  onClose,
  initialSelectedGoods,
  onConfirm,
  filters,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [results, setResults] = useState<PopupSearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [selectionMap, setSelectionMap] = useState<Map<string, SelectedGood>>(new Map());

  useEffect(() => {
    if (isOpen) {
      setSelectionMap(
        new Map(
          initialSelectedGoods.map((item) => [
            item.goodsId,
            item,
          ]),
        ),
      );
      setSearchTerm('');
      setResults([]);
      setSearchError(null);
    }
  }, [isOpen, initialSelectedGoods]);

  const executeSearch = useCallback(
    async (keyword: string) => {
      setIsSearching(true);
      setSearchError(null);
      try {
        const effectiveBrandIds =
          (filters.brandIds?.length ?? 0) > 0
            ? filters.brandIds
            : filters.availableBrandIds ?? [];

        const normalizedBrandIds = effectiveBrandIds
          .map((brandId) => brandId?.trim())
          .filter((brandId): brandId is string => !!brandId);

        const normalizedGoodsGbns = filters.goodsGbns
          .map((goodsGbn) => goodsGbn?.trim())
          .filter((goodsGbn): goodsGbn is string => !!goodsGbn);

        const normalizedMtypes = filters.mtypeList
          .map((mtype) => mtype?.trim())
          .filter((mtype): mtype is string => !!mtype);

        const response = await popupSearchService.searchProductsForPopup({
          selectedGoodsGbn: normalizedGoodsGbns,
          selectedBrands: normalizedBrandIds,
          selectedBtypes: normalizedMtypes,
          searchText: keyword,
          userId: filters.loginAgentId,
        });
        setResults(response);
      } catch (error) {
        console.error('상품 검색 중 오류', error);
        setSearchError('상품을 검색하는 중 오류가 발생했습니다.');
        setResults([]);
      } finally {
        setIsSearching(false);
      }
    },
    [
      filters.brandIds,
      filters.goodsGbns,
      filters.mtypeList,
      filters.availableBrandIds,
      filters.loginAgentId,
    ],
  );

  const handleSearch = useCallback(() => {
    void executeSearch(searchTerm);
  }, [executeSearch, searchTerm]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }
    void executeSearch('');
  }, [isOpen, executeSearch]);

  const toggleSelection = useCallback((goods: SelectedGood) => {
    setSelectionMap((prev) => {
      const next = new Map(prev);
      if (next.has(goods.goodsId)) {
        next.delete(goods.goodsId);
      } else {
        next.set(goods.goodsId, goods);
      }
      return next;
    });
  }, []);

  const handleSelectAll = useCallback(() => {
    if (results.length === 0) return;
    setSelectionMap((prev) => {
      const next = new Map(prev);
      results.forEach((item) => {
        const goods = mapPopupResultToSelectedGood(item);
        next.set(goods.goodsId, goods);
      });
      return next;
    });
  }, [results]);

  const handleClearSelection = useCallback(() => {
    setSelectionMap(new Map());
  }, []);

  const handleConfirm = useCallback(() => {
    onConfirm(Array.from(selectionMap.values()));
  }, [onConfirm, selectionMap]);

  const selectedCount = useMemo(() => selectionMap.size, [selectionMap]);

  const areAllResultsSelected = useMemo(() => {
    if (results.length === 0) {
      return false;
    }
    return results.every((result) => selectionMap.has(String(result.GOODS_ID)));
  }, [results, selectionMap]);

  const isIndeterminateSelection = useMemo(() => {
    if (results.length === 0) {
      return false;
    }
    return selectionMap.size > 0 && selectionMap.size < results.length;
  }, [results.length, selectionMap.size]);

  const isSelected = useCallback(
    (goodsId: string) => selectionMap.has(goodsId),
    [selectionMap],
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="상품 선택"
      size="large"
      className="agent-stock-product-modal"
    >
      <div className="product-modal-toolbar">
        <div className="toolbar-left">
          <input
            type="text"
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            placeholder="상품명 또는 상품코드를 입력하세요"
            onKeyDown={(event) => {
              if (event.key === 'Enter') {
                event.preventDefault();
                handleSearch();
              }
            }}
          />
          <button
            type="button"
            className="olm-btn olm-btn-primary"
            onClick={handleSearch}
            disabled={isSearching}
          >
            <i className="fas fa-search" /> 검색
          </button>
        </div>
        <div className="toolbar-right">
          <span className="selection-counter">선택 {selectedCount.toLocaleString()}개</span>
          <button
            type="button"
            className="olm-btn olm-btn-secondary olm-btn-sm"
            onClick={handleSelectAll}
            disabled={results.length === 0}
          >
            전체 선택
          </button>
          <button
            type="button"
            className="olm-btn olm-btn-secondary olm-btn-sm"
            onClick={handleClearSelection}
            disabled={selectedCount === 0}
          >
            선택 초기화
          </button>
        </div>
      </div>

      {searchError && <div className="product-modal-error">{searchError}</div>}

      <div className="product-modal-results">
        {isSearching ? (
          <div className="product-modal-empty">
            <i className="fas fa-spinner fa-spin" />
            <p>상품을 조회하는 중입니다...</p>
          </div>
        ) : results.length === 0 ? (
          <div className="product-modal-empty">
            <i className="fas fa-box-open" />
            <p>검색 결과가 없습니다. 조건을 조정해 다시 시도하세요.</p>
          </div>
        ) : (
          <div className="product-modal-table-wrapper">
            <div className="product-modal-table-scroll">
              <table className="product-modal-table">
                <thead>
                  <tr>
                    <th style={{ width: '48px' }}>
                      <label className="sr-only" htmlFor="agent-stock-modal-select-all">
                        전체 선택
                      </label>
                      <input
                        id="agent-stock-modal-select-all"
                        type="checkbox"
                        checked={areAllResultsSelected}
                        onChange={(event) => {
                          if (event.target.checked) {
                            handleSelectAll();
                          } else {
                            handleClearSelection();
                          }
                        }}
                        aria-checked={isIndeterminateSelection ? 'mixed' : areAllResultsSelected}
                        ref={(element) => {
                          if (!element) return;
                          element.indeterminate = isIndeterminateSelection;
                        }}
                      />
                    </th>
                    <th>상품코드</th>
                    <th>상품명</th>
                    <th>브랜드명</th>
                    <th>상품구분</th>
                  </tr>
                </thead>
                <tbody>
                  {results.map((result) => {
                    const goods = mapPopupResultToSelectedGood(result);
                    const checked = isSelected(goods.goodsId);
                    return (
                      <tr
                        key={goods.goodsId}
                        className={checked ? 'is-selected' : undefined}
                        onClick={() => toggleSelection(goods)}
                      >
                        <td onClick={(event) => event.stopPropagation()}>
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() => toggleSelection(goods)}
                            aria-label={`${goods.goodsNm} 선택`}
                          />
                        </td>
                        <td>{goods.goodsId}</td>
                        <td>{goods.goodsNm}</td>
                        <td>{goods.brandNm || '-'}</td>
                        <td>{goods.goodsGbnNm || '-'}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      <div className="product-modal-footer">
        <button
          type="button"
          className="olm-btn olm-btn-secondary"
          onClick={onClose}
        >
          닫기
        </button>
        <button
          type="button"
          className="olm-btn olm-btn-primary"
          onClick={handleConfirm}
          disabled={selectedCount === 0}
        >
          <i className="fas fa-check" /> 선택 적용
        </button>
      </div>
    </Modal>
  );
};

export default AgentStockProductModal;

