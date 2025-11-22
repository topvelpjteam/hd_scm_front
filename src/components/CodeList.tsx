import React, { useMemo, useCallback, useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { ColDef } from 'ag-grid-community';
import { RootState } from '../store/store';
import { useTabState } from '../hooks/useTabState';
import { useButtonTextPermission } from '../hooks/usePermissions';
import { MENU_IDS } from '../constants/menuIds';
import AgGridWrapper from './AgGridWrapper';
import CommonMultiSelect from './CommonMultiSelect';
import './CodeList.css';

interface GoodsItem {
  상품코드: string;
  상품명: string;
  소비자가격: number;
  등록일자: string;
  종료일자: string;
}

interface CategoryOption {
  value: string;
  label: string;
}

const CodeList: React.FC = () => {
  const activeTabId = useSelector((state: RootState) => state.tabs.activeTabId);
  const { state, setState } = useTabState(activeTabId || '');

  // 권한 체크 (코드목록 메뉴 ID 상수 사용 - 상품관리 하위)
  const viewPermission = useButtonTextPermission(MENU_IDS.PRODUCT_MANAGEMENT, '조회');

  // 상태에서 필터와 선택된 카테고리 가져오기
  const selectedCategories = state.selectedCategories || [];
  const filters = state.filters || {
    goodsId: '',
    goodsNm: '',
    minPrice: '',
    maxPrice: '',
    startDate: '',
    endDate: '',
    btypeGbn: ''
  };
  
  // 그리드 데이터 상태 관리 - 첫 로드 시에는 빈 배열로 시작
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const savedGoodsData = state.goodsData || [];

  // 상품 데이터 상태
  const [goodsData, setGoodsData] = useState<GoodsItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 대분류 데이터 상태
  const [categoryOptions, setCategoryOptions] = useState<CategoryOption[]>([
    { value: '01', label: '의류' },
    { value: '02', label: '신발' },
    { value: '03', label: '가방' },
    { value: '04', label: '액세서리' },
    { value: '05', label: '화장품' }
  ]);

    // 대분류 데이터 가져오기
  const fetchCategoryData = useCallback(async () => {
    try {
      console.log('대분류 데이터 요청 시작...');
      const response = await fetch('http://localhost:8080/api/database/btype-categories', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      console.log('대분류 API 응답 상태:', response.status);
      console.log('대분류 API 응답 헤더:', response.headers);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const result = await response.json();
      console.log('대분류 API 응답 데이터:', result);
      
      if (result.status === 'success' && result.data) {
        const options = result.data.map((item: any) => ({
          value: item.BTYPE_GBN,
          label: item.BTYPE_GBN_NM
        }));
        // 코드순으로 정렬
        options.sort((a: CategoryOption, b: CategoryOption) => a.value.localeCompare(b.value));
        setCategoryOptions(options);
        console.log('대분류 데이터 로드 성공 (코드순 정렬):', options);
      } else {
        console.error('대분류 데이터 로드 실패:', result.message);
        // API 실패 시 샘플 데이터 유지
        console.log('기존 샘플 데이터 유지');
      }
    } catch (err) {
      console.error('대분류 API 호출 오류:', err);
    }
  }, []);

  // 데이터베이스에서 상품 데이터 가져오기 (필터링 포함)
  const fetchGoodsData = useCallback(async (filterParams?: any) => {
    setLoading(true);
    setError(null);
    
    try {
      const params = new URLSearchParams();
      
      // 필터 파라미터 추가
      if (filterParams?.goodsId) params.append('goodsId', filterParams.goodsId);
      if (filterParams?.goodsNm) params.append('goodsNm', filterParams.goodsNm);
      if (filterParams?.minPrice) params.append('minPrice', filterParams.minPrice);
      if (filterParams?.maxPrice) params.append('maxPrice', filterParams.maxPrice);
      if (filterParams?.startDate) params.append('startDate', filterParams.startDate);
      if (filterParams?.endDate) params.append('endDate', filterParams.endDate);
      if (filterParams?.btypeGbn) params.append('btypeGbn', filterParams.btypeGbn);
      
      const url = `http://localhost:8080/api/database/goods?${params.toString()}`;
      console.log('API 요청 URL:', url);
      console.log('전송된 파라미터:', Object.fromEntries(params.entries()));
      
      const response = await fetch(url);
      const result = await response.json();
      
      console.log('API 응답 상태:', response.status);
      console.log('API 응답 데이터:', result);
      
                           if (result.status === 'success') {
                setGoodsData(result.data);
                // 그리드 데이터를 상태에 저장
                setState('goodsData', result.data);
                // 첫 로드 완료 표시
                setIsInitialLoad(false);
                console.log('상품 데이터 로드 성공:', result.data);
              } else {
         setError(result.message || '데이터 로드 실패');
         console.error('상품 데이터 로드 실패:', result.message);
       }
    } catch (err) {
      setError('API 호출 중 오류가 발생했습니다.');
      console.error('API 호출 오류:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // 샘플 데이터 메모이제이션
  const sampleCategories = useMemo(() => [
    { value: '01', label: '의류' },
    { value: '02', label: '신발' },
    { value: '03', label: '가방' },
    { value: '04', label: '액세서리' },
    { value: '05', label: '화장품' }
  ], []);



  // 컴포넌트 마운트 시 데이터 로드
  useEffect(() => {
    fetchCategoryData();
    
    // 저장된 데이터가 있으면 사용, 없으면 API 호출
    if (savedGoodsData.length > 0) {
      setGoodsData(savedGoodsData);
      setIsInitialLoad(false);
    } else {
      fetchGoodsData();
    }
  }, [fetchCategoryData, fetchGoodsData, savedGoodsData]);

  // 가격 포맷팅 렌더러
  const PriceRenderer = useCallback((params: any) => {
    const price = params.value;
    if (price === null || price === undefined) return '-';
    
    return new Intl.NumberFormat('ko-KR', {
      style: 'currency',
      currency: 'KRW'
    }).format(price);
  }, []);

  // 날짜 포맷팅 렌더러
  const DateRenderer = useCallback((params: any) => {
    const date = params.value;
    if (!date) return '-';
    
    try {
      return new Date(date).toLocaleDateString('ko-KR');
    } catch {
      return date;
    }
  }, []);

  // 컬럼 정의
  const columnDefs: ColDef[] = useMemo(() => [
    {
      headerName: '상품코드',
      field: '상품코드',
      width: 120,
      pinned: 'left',
      sortable: true,
      filter: true,
    },
    {
      headerName: '상품명',
      field: '상품명',
      width: 250,
      sortable: true,
      filter: true,
      cellStyle: { 
        whiteSpace: 'normal',
        lineHeight: '1.4',
        padding: '8px 12px'
      }
    },
    {
      headerName: '소비자가격',
      field: '소비자가격',
      width: 150,
      cellRenderer: PriceRenderer,
      sortable: true,
      filter: true,
      type: 'numericColumn',
    },
    {
      headerName: '등록일자',
      field: '등록일자',
      width: 120,
      cellRenderer: DateRenderer,
      sortable: true,
      filter: true,
    },
    {
      headerName: '종료일자',
      field: '종료일자',
      width: 120,
      cellRenderer: DateRenderer,
      sortable: true,
      filter: true,
    }
  ], [PriceRenderer, DateRenderer]);

  // 이벤트 핸들러
  const handleRowSelected = useCallback((event: any) => {
    console.log('선택된 행:', event.data);
  }, []);

  const handleCellClicked = useCallback((event: any) => {
    console.log('클릭된 셀:', event.data, event.column.getColId());
  }, []);

  const handleAdd = useCallback(() => {
    console.log('상품 추가');
    // 모달 또는 새 페이지로 이동
  }, []);

  const handleEdit = useCallback((data: GoodsItem) => {
    console.log('상품 수정:', data);
    // 수정 모달 또는 페이지로 이동
  }, []);

  const handleDelete = useCallback((data: GoodsItem) => {
    console.log('상품 삭제:', data);
    if (window.confirm(`"${data.상품명}" 상품을 삭제하시겠습니까?`)) {
      // 삭제 로직
    }
  }, []);

  const handleView = useCallback((data: GoodsItem) => {
    console.log('상품 상세보기:', data);
    // 상세보기 모달 또는 페이지로 이동
  }, []);

  // 필터 변경 핸들러
  const handleFilterChange = useCallback((field: string, value: string) => {
    const newFilters = {
      ...filters,
      [field]: value
    };
    setState('filters', newFilters);
  }, [filters, setState]);

  // 대분류 선택 변경 핸들러
  const handleCategoryChange = useCallback((values: string[]) => {
    setState('selectedCategories', values);
    // 선택된 모든 대분류를 콤마로 구분하여 필터에 설정
    const btypeGbn = values.join(',');
    const newFilters = {
      ...filters,
      btypeGbn
    };
    setState('filters', newFilters);
    console.log('대분류 선택 변경:', values, '필터 설정:', btypeGbn);
  }, [filters, setState]);

  // 조회 버튼 클릭 핸들러
  const handleSearch = useCallback(() => {
    console.log('=== 조회 요청 시작 ===');
    console.log('현재 필터 상태:', filters);
    console.log('선택된 대분류:', selectedCategories);
    console.log('전송할 파라미터:', {
      ...filters,
      btypeGbn: selectedCategories.join(',')
    });
    fetchGoodsData(filters);
  }, [fetchGoodsData, filters, selectedCategories]);

  // 초기화 버튼 클릭 핸들러
  const handleReset = useCallback(() => {
    const resetFilters = {
      goodsId: '',
      goodsNm: '',
      minPrice: '',
      maxPrice: '',
      startDate: '',
      endDate: '',
      btypeGbn: ''
    };
    setState('filters', resetFilters);
    setState('selectedCategories', []);
    fetchGoodsData();
  }, [fetchGoodsData, setState]);

  const handleGridSearch = useCallback((value: string) => {
    console.log('그리드 검색:', value);
    setState('searchTerm', value);
  }, [setState]);

  // 로딩 상태 표시
  if (loading) {
    return (
      <div className="code-list-container">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>상품 데이터를 불러오는 중...</p>
        </div>
      </div>
    );
  }

  // 에러 상태 표시
  if (error) {
    return (
      <div className="code-list-container">
        <div className="error-container">
          <h3>데이터 로드 오류</h3>
          <p>{error}</p>
          <button className="btn btn-primary" onClick={fetchGoodsData}>
            다시 시도
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="code-list-container">
      <div className="code-list-header">
        <h1>상품 목록</h1>
        <p>데이터베이스의 tb_cs_goods 테이블에서 상품 정보를 관리합니다.</p>
      </div>

      {/* 조회조건 영역 */}
      <div className="code-list-filters">
        <div className="filter-row">
          <div className="filter-group">
            <label>상품코드:</label>
            <input
              type="text"
              placeholder="상품코드를 입력하세요"
              className="filter-input"
              value={filters.goodsId}
              onChange={(e) => handleFilterChange('goodsId', e.target.value)}
            />
          </div>
          <div className="filter-group">
            <label>상품명:</label>
            <input
              type="text"
              placeholder="상품명을 입력하세요"
              className="filter-input"
              value={filters.goodsNm}
              onChange={(e) => handleFilterChange('goodsNm', e.target.value)}
            />
          </div>
          <div className="filter-group">
            <CommonMultiSelect
              options={categoryOptions}
              selectedValues={selectedCategories}
              onSelectionChange={handleCategoryChange}
              placeholder="대분류를 선택하세요"
              searchPlaceholder="대분류 검색..."
              label="대분류:"
            />
          </div>
        </div>
        <div className="filter-row">
          <div className="filter-group">
            <label>가격 범위:</label>
            <input
              type="number"
              placeholder="최소가격"
              className="filter-input"
              value={filters.minPrice}
              onChange={(e) => handleFilterChange('minPrice', e.target.value)}
            />
          </div>
          <div className="filter-group">
            <label>~</label>
            <input
              type="number"
              placeholder="최대가격"
              className="filter-input"
              value={filters.maxPrice}
              onChange={(e) => handleFilterChange('maxPrice', e.target.value)}
            />
          </div>
          <div className="filter-group">
            <label>등록일자:</label>
            <input
              type="date"
              className="filter-input"
              value={filters.startDate}
              onChange={(e) => handleFilterChange('startDate', e.target.value)}
            />
          </div>
          <div className="filter-group">
            <label>~</label>
            <input
              type="date"
              className="filter-input"
              value={filters.endDate}
              onChange={(e) => handleFilterChange('endDate', e.target.value)}
            />
          </div>
          <div className="filter-actions">
            <button 
              className="btn btn-primary" 
              onClick={handleSearch}
              disabled={!viewPermission.hasPermission}
            >
              조회
            </button>
            <button className="btn btn-secondary" onClick={handleReset}>초기화</button>
          </div>
        </div>
      </div>

      <AgGridWrapper
        rowData={goodsData}
        columnDefs={columnDefs}
        //menuId={2}
        enableMultiSelect={true}
        enableExcelExport={true}
        enableExcelImport={false}
        enableSearch={false}
        enableFilter={true}
        enablePagination={true}
        enableSorting={true}
        enableResizing={true}
        enableColumnMenu={true}
        enableRowSelection={false}
        enableRowGrouping={true}
        enableColumnPinning={true}
        height="600px"
        theme="alpine"
        onRowSelected={handleRowSelected}
        onCellClicked={handleCellClicked}
        showActionButtons={false}
        onAdd={handleAdd}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onView={handleView}
        searchPlaceholder="상품코드, 상품명으로 검색..."
        onSearch={handleGridSearch}
        paginationPageSize={20}
        paginationPageSizeSelector={[10, 20, 50, 100]}
        isCodeListMode={true}
        excelTitle="상품 목록"
      />
    </div>
  );
};

export default CodeList;
