import React, { useState, useEffect, useRef } from 'react';
import { AgGridReact } from 'ag-grid-react';
import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-alpine.css';
import { Printer, Download, Search, X } from 'lucide-react';
import { barcodeBookService, ProductData } from '../services/barcodeBookService';
import './BarcodeBook.css';

interface BarcodeBookProps {
  onClose: () => void;
}

const BarcodeBook: React.FC<BarcodeBookProps> = ({ onClose }) => {
  const [productData, setProductData] = useState<ProductData[]>([]);
  const [filteredData, setFilteredData] = useState<ProductData[]>([]);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedBrands, setSelectedBrands] = useState<string[]>([]);
  const [selectedGoodsGbn, setSelectedGoodsGbn] = useState<string[]>([]);
  const [selectedRows, setSelectedRows] = useState<ProductData[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  
  // AG-Grid ref
  const gridRef = useRef<AgGridReact>(null);

  // 컬럼 정의
  const columnDefs: any[] = [
    {
      headerName: '선택',
      field: 'selected',
      width: 60,
      checkboxSelection: true,
      headerCheckboxSelection: true,
      pinned: 'left'
    },
    {
      headerName: '상품코드',
      field: 'GOODS_ID',
      width: 100,
      pinned: 'left'
    },
    {
      headerName: '브랜드상품코드',
      field: 'GOODS_ID_BRAND',
      width: 120
    },
    {
      headerName: '상품명',
      field: 'GOODS_NM',
      width: 200,
      cellStyle: { fontWeight: '500', color: '#333' }
    },
    {
      headerName: '바코드',
      field: 'BAR_CODE',
      width: 150,
      cellRenderer: (params: any) => {
        if (!params.value) {
          return '<span style="color: #f44336; font-style: italic; font-size: 11px;">바코드 없음</span>';
        }
        return `<span style="font-family: Courier New, monospace; font-weight: bold; color: #1976d2; background: #f0f8ff; padding: 2px 6px; border-radius: 3px; border: 1px solid #e3f2fd;">${params.value}</span>`;
      }
    },
    {
      headerName: '공급단가',
      field: 'SUPPLY_DAN',
      width: 100,
      valueFormatter: (params: any) => {
        return params.value ? params.value.toLocaleString('ko-KR') : '-';
      }
    },
    {
      headerName: '브랜드',
      field: 'BRAND_ID',
      width: 80
    },
    {
      headerName: '상품구분',
      field: 'GOODS_GBN',
      width: 80
    },
    {
      headerName: '대분류',
      field: 'BTYPE_GBN',
      width: 80
    },
    {
      headerName: '재고관리',
      field: 'STOCK_YN',
      width: 80,
      cellRenderer: (params: any) => {
        return params.value === 'Y' ? '관리' : '미관리';
      }
    },
    {
      headerName: '시작일',
      field: 'RUN_D',
      width: 100
    },
    {
      headerName: '종료일',
      field: 'END_D',
      width: 100
    }
  ];

  // 기본 컬럼 설정
  const defaultColDef = {
    sortable: true,
    filter: true,
    resizable: true,
    cellStyle: { fontSize: '12px' }
  };

  // 상품 데이터 로드
  const loadProductData = async () => {
    setIsLoading(true);
    setError('');
    
    try {
      const response = await barcodeBookService.getProductData();
      
      if (response.success && response.data) {
        setProductData(response.data);
        setFilteredData(response.data);
        console.log('✅ 상품 데이터 로드 완료:', response.data.length, '건');
      } else {
        console.warn('⚠️ 상품 데이터 로드 실패:', response.message);
        setError(response.message || '데이터 로드에 실패했습니다.');
        // 실패 시 샘플 데이터 사용
        loadSampleData();
      }
    } catch (error) {
      console.error('❌ 상품 데이터 로드 실패:', error);
      setError('서버 연결에 실패했습니다. 샘플 데이터를 사용합니다.');
      // 오류 시 샘플 데이터 사용
      loadSampleData();
    } finally {
      setIsLoading(false);
    }
  };

  // 샘플 데이터 로드 (API 실패 시 사용)
  const loadSampleData = () => {
    const sampleData: ProductData[] = [
      {
        GOODS_ID: '31',
        GOODS_ID_BRAND: 'SAMPLE001',
        GOODS_NM: '샘플상품 1번',
        BAR_CODE: '8801051234560177',
        SUPPLY_DAN: 11000,
        BRAND_ID: 'AB',
        GOODS_GBN: '1',
        BTYPE_GBN: '10',
        STOCK_YN: 'Y',
        RUN_D: '2024-01-01',
        END_D: ''
      },
      {
        GOODS_ID: '32',
        GOODS_ID_BRAND: 'SAMPLE002',
        GOODS_NM: '샘플상품 2번',
        BAR_CODE: '88010512345602',
        SUPPLY_DAN: 12000,
        BRAND_ID: 'AE',
        GOODS_GBN: '2',
        BTYPE_GBN: '11',
        STOCK_YN: 'Y',
        RUN_D: '2024-01-01',
        END_D: ''
      },
      {
        GOODS_ID: '33',
        GOODS_ID_BRAND: 'SAMPLE003',
        GOODS_NM: '샘플상품 3번',
        BAR_CODE: '88010512345603',
        SUPPLY_DAN: 13000,
        BRAND_ID: 'AF',
        GOODS_GBN: '3',
        BTYPE_GBN: '10',
        STOCK_YN: 'Y',
        RUN_D: '2024-01-01',
        END_D: ''
      },
      {
        GOODS_ID: '90',
        GOODS_ID_BRAND: '9917',
        GOODS_NM: '펼치기만 해도 공부가 되는 책',
        BAR_CODE: '1111',
        SUPPLY_DAN: 0,
        BRAND_ID: 'AE',
        GOODS_GBN: '1',
        BTYPE_GBN: '10',
        STOCK_YN: 'Y',
        RUN_D: '2025-09-01',
        END_D: '2025-09-06'
      }
    ];

    setProductData(sampleData);
    setFilteredData(sampleData);
    console.log('📋 샘플 데이터 로드 완료:', sampleData.length, '건');
  };

  // 검색 및 필터링
  useEffect(() => {
    let filtered = productData;

    // 검색어 필터링
    if (searchTerm) {
      filtered = filtered.filter(item =>
        item.GOODS_NM.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.GOODS_ID_BRAND.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.BAR_CODE.includes(searchTerm)
      );
    }

    // 브랜드 필터링
    if (selectedBrands.length > 0) {
      filtered = filtered.filter(item => selectedBrands.includes(item.BRAND_ID));
    }

    // 상품구분 필터링
    if (selectedGoodsGbn.length > 0) {
      filtered = filtered.filter(item => selectedGoodsGbn.includes(item.GOODS_GBN));
    }

    setFilteredData(filtered);
  }, [productData, searchTerm, selectedBrands, selectedGoodsGbn]);

  // 브랜드 옵션 추출
  const brandOptions = Array.from(new Set(productData.map(item => item.BRAND_ID))).filter(Boolean);
  const goodsGbnOptions = Array.from(new Set(productData.map(item => item.GOODS_GBN))).filter(Boolean);

  // 선택된 행 변경 핸들러
  const onSelectionChanged = (event: any) => {
    const selectedNodes = event.api.getSelectedNodes();
    const selectedData = selectedNodes.map((node: any) => node.data);
    setSelectedRows(selectedData);
  };

  // 바코드책 인쇄
  const handlePrint = async () => {
    if (selectedRows.length === 0) {
      alert('인쇄할 상품을 선택해주세요.');
      return;
    }

    // 바코드가 없는 상품 필터링
    const validBarcodeItems = selectedRows.filter(item => item.BAR_CODE);
    
    if (validBarcodeItems.length === 0) {
      alert('선택된 상품 중 바코드가 있는 상품이 없습니다.');
      return;
    }

    try {
      const productIds = validBarcodeItems.map(item => item.GOODS_ID);
      const printData = await barcodeBookService.generatePrintData(productIds);
      
      console.log('✅ 바코드 인쇄 데이터 생성 완료:', printData);
      alert(`${validBarcodeItems.length}개 상품의 바코드책을 인쇄합니다.`);
      
      // 실제 인쇄 로직 (바코드 생성 라이브러리 사용)
      // window.print() 또는 바코드 프린터 API 호출
      
    } catch (error) {
      console.error('❌ 바코드 인쇄 실패:', error);
      alert('바코드 인쇄 중 오류가 발생했습니다.');
    }
  };

  // 바코드책 엑셀 다운로드
  const handleDownload = async () => {
    if (selectedRows.length === 0) {
      alert('다운로드할 상품을 선택해주세요.');
      return;
    }

    try {
      const productIds = selectedRows.map(item => item.GOODS_ID);
      const blob = await barcodeBookService.downloadExcel(productIds);
      
      // 파일 다운로드
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `바코드책_${new Date().toISOString().split('T')[0]}.xlsx`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      console.log('✅ 바코드책 엑셀 다운로드 완료');
      alert(`${selectedRows.length}개 상품의 바코드책을 엑셀로 다운로드했습니다.`);
      
    } catch (error) {
      console.error('❌ 바코드책 엑셀 다운로드 실패:', error);
      alert('엑셀 다운로드 중 오류가 발생했습니다.');
    }
  };

  // 전체 선택/해제
  const handleSelectAll = () => {
    if (gridRef.current?.api) {
      gridRef.current.api.selectAll();
      console.log('✅ 전체 선택 완료');
    }
  };

  const handleDeselectAll = () => {
    if (gridRef.current?.api) {
      gridRef.current.api.deselectAll();
      console.log('✅ 전체 선택 해제 완료');
    }
  };

  useEffect(() => {
    loadProductData();
  }, []);

  return (
    <div className="barcode-book-container">
      <div className="barcode-book-header">
        <h2>
          <Printer size={20} />
          바코드책 관리
        </h2>
        <button className="close-btn" onClick={onClose} title="닫기">
          <X size={16} />
        </button>
      </div>

      <div className="barcode-book-controls">
        <div className="search-section">
          <div className="search-input-group">
            <Search size={16} />
            <input
              type="text"
              placeholder="상품명, 상품코드, 바코드로 검색..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
          </div>
        </div>

        <div className="filter-section">
          <div className="filter-group">
            <label>브랜드:</label>
            <select
              multiple
              value={selectedBrands}
              onChange={(e) => setSelectedBrands(Array.from(e.target.selectedOptions, option => option.value))}
              className="filter-select"
            >
              {brandOptions.map(brand => (
                <option key={brand} value={brand}>{brand}</option>
              ))}
            </select>
          </div>

          <div className="filter-group">
            <label>상품구분:</label>
            <select
              multiple
              value={selectedGoodsGbn}
              onChange={(e) => setSelectedGoodsGbn(Array.from(e.target.selectedOptions, option => option.value))}
              className="filter-select"
            >
              {goodsGbnOptions.map(gbn => (
                <option key={gbn} value={gbn}>{gbn}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="action-section">
          <button className="action-btn select-all-btn" onClick={handleSelectAll}>
            전체선택
          </button>
          <button className="action-btn deselect-all-btn" onClick={handleDeselectAll}>
            선택해제
          </button>
          <button 
            className="action-btn print-btn" 
            onClick={handlePrint}
            disabled={selectedRows.length === 0}
          >
            <Printer size={16} />
            바코드책 인쇄 ({selectedRows.length})
          </button>
          <button 
            className="action-btn download-btn" 
            onClick={handleDownload}
            disabled={selectedRows.length === 0}
          >
            <Download size={16} />
            엑셀 다운로드
          </button>
        </div>
      </div>

      {/* 에러 메시지 표시 (그리드와 함께) */}
      {error && (
        <div className="error-banner">
          <div className="error-message">{error}</div>
          <button className="retry-btn" onClick={loadProductData}>
            다시 시도
          </button>
        </div>
      )}

      <div className="barcode-book-grid">
        {isLoading ? (
          <div className="loading-container">
            <div className="loading-spinner"></div>
            <div>상품 데이터를 불러오는 중...</div>
          </div>
        ) : (
          <AgGridReact
            ref={gridRef}
            rowData={filteredData}
            columnDefs={columnDefs}
            defaultColDef={defaultColDef}
            rowSelection="multiple"
            onSelectionChanged={onSelectionChanged}
            className="ag-theme-alpine"
            domLayout="normal"
            headerHeight={35}
            rowHeight={30}
            suppressRowClickSelection={true}
            noRowsOverlayComponent={() => (
              <div className="ag-overlay-no-rows-center">
                <div>조회된 데이터가 없습니다</div>
              </div>
            )}
          />
        )}
      </div>

      <div className="barcode-book-summary">
        <div className="summary-item">
          <span>전체 상품:</span>
          <strong>{productData.length}개</strong>
        </div>
        <div className="summary-item">
          <span>조회된 상품:</span>
          <strong>{filteredData.length}개</strong>
        </div>
        <div className="summary-item">
          <span>선택된 상품:</span>
          <strong>{selectedRows.length}개</strong>
        </div>
        <div className="summary-item">
          <span>바코드 보유 상품:</span>
          <strong>{selectedRows.filter(item => item.BAR_CODE).length}개</strong>
        </div>
      </div>
    </div>
  );
};

export default BarcodeBook;