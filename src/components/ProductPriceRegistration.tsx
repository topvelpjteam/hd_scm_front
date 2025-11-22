import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useSelector } from 'react-redux';
import { AgGridReact } from 'ag-grid-react';
import 'ag-grid-community/styles/ag-theme-alpine.css';
import DateRangePicker from './common/DateRangePicker';
import CommonMultiSelect from './CommonMultiSelect';
import { getMenuIcon } from '../utils/menuUtils';
import { RootState } from '../store/store';
import './ProductPriceRegistration.css';

// 상품 소비자가 데이터 타입
interface ProductPriceData {
  GOODS_ID: string;        // 상품코드
  OPEN_D: string;          // 적용일자(시작일자)
  CLOSE_D: string;         // 종료일자
  SOBIJA_DAN: number;      // 소비자단가(매가)
  MEMO: string;            // 적요
  USER_ID?: string;        // 등록유저아이디
  SYS_TIME?: string;       // 등록일시
  UPD_USER?: string;       // 수정유저아이디
  UPD_TIME?: string;       // 수정일시
}

// 검색 조건 타입
interface SearchCondition {
  brandIds: string[];      // 브랜드 (다중선택)
  btypeGbns: string[];     // 대분류 (다중선택)
  mtypeGbns: string[];     // 중분류 (다중선택)
  stypeGbns: string[];     // 소분류 (다중선택)
  goodsNm: string;         // 상품명
  openDateFrom: string;    // 적용일자(시작)
  openDateTo: string;      // 적용일자(종료)
}

const ProductPriceRegistration: React.FC = React.memo(() => {
  // 날짜 범위 기본값 설정 (최근 30일)
  const getDefaultDateRange = () => {
    const today = new Date();
    const thirtyDaysAgo = new Date(today);
    thirtyDaysAgo.setDate(today.getDate() - 30);
    
    return {
      from: thirtyDaysAgo.toISOString().split('T')[0],
      to: today.toISOString().split('T')[0]
    };
  };

  const defaultDateRange = getDefaultDateRange();

  // 검색 조건 상태
  const [searchCondition, setSearchCondition] = useState<SearchCondition>({
    brandIds: [],
    btypeGbns: [],
    mtypeGbns: [],
    stypeGbns: [],
    goodsNm: '',
    openDateFrom: defaultDateRange.from,
    openDateTo: defaultDateRange.to
  });

  // 현재 활성 탭 정보 가져오기
  const { tabs, activeTabId } = useSelector((state: RootState) => state.tabs);
  const currentTab = tabs.find(tab => tab.id === activeTabId);

  // 그리드 데이터 상태
  const [priceData, setPriceData] = useState<ProductPriceData[]>([]);
  
  // 선택된 상품가격 정보
  const [selectedPrice, setSelectedPrice] = useState<ProductPriceData | null>(null);
  
  // 신규 등록 모드
  const [isNewMode, setIsNewMode] = useState(false);
  
  // 로딩 상태
  const [isLoading, setIsLoading] = useState(false);

  // AG Grid 참조
  const gridRef = useRef<AgGridReact>(null);

  // AG Grid API 상태
  const [, setGridApi] = useState<any>(null);

  // 컬럼 정의 - TB_ZA_GOODSPRICE 기준 (상품등록과 동일한 스타일)
  const columnDefs: any[] = [
    { headerName: '상품코드', field: 'GOODS_ID', width: 120, minWidth: 100 },
    { headerName: '상품명', field: 'GOODS_NM', width: 200, minWidth: 150, flex: 1 },
    { headerName: '적용일자', field: 'OPEN_D', width: 100, minWidth: 90 },
    { headerName: '종료일자', field: 'CLOSE_D', width: 100, minWidth: 90 },
    { headerName: '소비자단가', field: 'SOBIJA_DAN', width: 120, minWidth: 100 },
    { headerName: '적요', field: 'MEMO', width: 200, minWidth: 150 }
  ];

  // AG Grid 준비 완료 이벤트
  const onGridReady = useCallback((params: any) => {
    setGridApi(params.api);
    console.log('✅ AG Grid 준비 완료');
  }, []);

  // 그리드 행 클릭 이벤트 (상품등록과 동일)
  const onRowClicked = useCallback((event: any) => {
    if (event.data) {
      setSelectedPrice(event.data);
      setIsNewMode(false);
    }
  }, []);

  // 검색 조건 변경 핸들러
  const handleSearchConditionChange = (field: keyof SearchCondition, value: string | string[]) => {
    setSearchCondition(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // 조회 버튼 클릭 핸들러
  const handleSearch = async () => {
    try {
      setIsLoading(true);
      // TODO: API 호출하여 데이터 조회
      console.log('🔍 조회 조건:', searchCondition);
      
      // 임시 데이터 (실제로는 API에서 가져옴)
      const mockData: ProductPriceData[] = [
        {
          GOODS_ID: 'PROD001',
          OPEN_D: '20250101',
          CLOSE_D: '20251231',
          SOBIJA_DAN: 50000,
          MEMO: '2025년 상품가격'
        },
        {
          GOODS_ID: 'PROD002',
          OPEN_D: '20250101',
          CLOSE_D: '20251231',
          SOBIJA_DAN: 75000,
          MEMO: '프리미엄 상품가격'
        }
      ];
      
      setPriceData(mockData);
    } catch (error) {
      console.error('❌ 조회 중 오류:', error);
      alert('조회 중 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  // 신규 버튼 클릭 핸들러
  const handleNew = () => {
    setIsNewMode(true);
    setSelectedPrice({
      GOODS_ID: '',
      OPEN_D: '',
      CLOSE_D: '',
      SOBIJA_DAN: 0,
      MEMO: ''
    });
    // 그리드 선택 해제
    gridRef.current?.api.deselectAll();
  };

  // 저장 버튼 클릭 핸들러
  const handleSave = async () => {
    if (!selectedPrice) {
      alert('저장할 데이터가 없습니다.');
      return;
    }

    // 유효성 검사
    if (!selectedPrice.GOODS_ID) {
      alert('상품코드를 입력해주세요.');
      return;
    }
    if (!selectedPrice.OPEN_D) {
      alert('적용일자를 입력해주세요.');
      return;
    }
    if (!selectedPrice.SOBIJA_DAN) {
      alert('소비자단가를 입력해주세요.');
      return;
    }

    try {
      setIsLoading(true);
      // TODO: API 호출하여 데이터 저장
      console.log('💾 저장 데이터:', selectedPrice);
      
      if (isNewMode) {
        alert('신규 등록되었습니다.');
      } else {
        alert('수정되었습니다.');
      }
      
      // 조회 새로고침
      await handleSearch();
      setIsNewMode(false);
    } catch (error) {
      console.error('❌ 저장 중 오류:', error);
      alert('저장 중 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  // 삭제 버튼 클릭 핸들러
  const handleDelete = async () => {
    if (!selectedPrice || isNewMode) {
      alert('삭제할 데이터를 선택해주세요.');
      return;
    }

    if (!window.confirm('정말 삭제하시겠습니까?')) {
      return;
    }

    try {
      setIsLoading(true);
      // TODO: API 호출하여 데이터 삭제
      console.log('🗑️ 삭제 데이터:', selectedPrice);
      
      alert('삭제되었습니다.');
      
      // 조회 새로고침
      await handleSearch();
      setSelectedPrice(null);
      setIsNewMode(false);
    } catch (error) {
      console.error('❌ 삭제 중 오류:', error);
      alert('삭제 중 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  // 상세 정보 변경 핸들러
  const handleDetailChange = (field: keyof ProductPriceData, value: any) => {
    setSelectedPrice(prev => {
      if (!prev) return null;
      return {
        ...prev,
        [field]: value
      };
    });
  };

  // 날짜 포맷 변환 (YYYY-MM-DD -> YYYYMMDD)
  const formatDateToString = (dateStr: string): string => {
    if (!dateStr) return '';
    return dateStr.replace(/-/g, '');
  };

  // 날짜 포맷 변환 (YYYYMMDD -> YYYY-MM-DD)
  const formatStringToDate = (str: string): string => {
    if (!str || str.length !== 8) return '';
    return `${str.substring(0, 4)}-${str.substring(4, 6)}-${str.substring(6, 8)}`;
  };

  // 컴포넌트 마운트 시 초기화
  useEffect(() => {
    console.log('📦 ProductPriceRegistration 컴포넌트 마운트');
  }, []);

  return (
    <div className="price-registration">
      {/* 로딩 오버레이 */}
      {isLoading && (
        <div className="price-loading-overlay">
          <div className="price-loading-spinner"></div>
          <div className="price-loading-text">처리 중...</div>
        </div>
      )}
      
      {/* TOP 섹션 - 검색 조건 및 버튼 */}
      <div className="price-top-section">
        <h1 className="price-page-title">
          {currentTab?.menuIcon ? (
            React.createElement(getMenuIcon(currentTab.menuIcon), { size: 16 })
          ) : (
            <i className="fas fa-tag"></i>
          )}
          {currentTab?.title || '상품 소비자가(매가) 관리'}
        </h1>

        {/* 검색 조건 */}
        <div className="price-search-conditions">
          <div className="price-search-row">
            <div className="price-search-item">
              <label>브랜드</label>
              <CommonMultiSelect
                commonCodeType="brands"
                selectedValues={searchCondition.brandIds}
                onSelectionChange={(values: string[]) => handleSearchConditionChange('brandIds', values)}
                placeholder="브랜드 선택"
              />
            </div>
            <div className="price-search-item">
              <label>대분류</label>
              <CommonMultiSelect
                commonCodeType="btypes"
                selectedValues={searchCondition.btypeGbns}
                onSelectionChange={(values: string[]) => handleSearchConditionChange('btypeGbns', values)}
                placeholder="대분류 선택"
              />
            </div>
            <div className="price-search-item">
              <label>중분류</label>
              <CommonMultiSelect
                commonCodeType="mtypes"
                selectedValues={searchCondition.mtypeGbns}
                onSelectionChange={(values: string[]) => handleSearchConditionChange('mtypeGbns', values)}
                placeholder="중분류 선택"
              />
            </div>
            <div className="price-search-item">
              <label>소분류</label>
              <CommonMultiSelect
                commonCodeType="stypes"
                selectedValues={searchCondition.stypeGbns}
                onSelectionChange={(values: string[]) => handleSearchConditionChange('stypeGbns', values)}
                placeholder="소분류 선택"
              />
            </div>
          </div>
          <div className="price-search-row">
            <div className="price-search-item">
              <label>상품명</label>
              <input
                type="text"
                placeholder="상품명"
                value={searchCondition.goodsNm}
                onChange={(e) => handleSearchConditionChange('goodsNm', e.target.value)}
              />
            </div>
            <div className="price-search-item">
              <label>적용일자</label>
              <DateRangePicker
                startDate={searchCondition.openDateFrom}
                endDate={searchCondition.openDateTo}
                onStartDateChange={(date: string) => handleSearchConditionChange('openDateFrom', date)}
                onEndDateChange={(date: string) => handleSearchConditionChange('openDateTo', date)}
              />
            </div>
          </div>
        </div>

        {/* 액션 버튼 - 상품등록과 동일한 구조 */}
        <div className="price-action-buttons">
          <div className="price-left-buttons">
            <button className="price-btn-delete" onClick={handleDelete}>
              <i className="fas fa-trash"></i> 삭제
            </button>
          </div>
          <div className="price-right-buttons">
            <button className="price-btn-new" onClick={handleNew}>
              <i className="fas fa-undo"></i> 초기화
            </button>
            <button className="price-btn-search" onClick={handleSearch}>
              <i className="fas fa-search"></i> 조회
            </button>
          </div>
        </div>
      </div>

      {/* MAIN 섹션 - LEFT(그리드) + RIGHT(상세정보) */}
      <div className="price-main-section">
        {/* LEFT 섹션 - 상품 가격 목록 그리드 */}
        <div className="price-left-section">
          <h3>
            <i className="fas fa-list"></i>
            상품 가격 목록
          </h3>
          
          <div className="price-grid-container">
            <div className="ag-theme-alpine">
              <AgGridReact
                ref={gridRef}
                columnDefs={columnDefs}
                rowData={priceData}
                onGridReady={onGridReady}
                onRowClicked={onRowClicked}
                pagination={true}
                paginationPageSize={50}
                animateRows={false}
                suppressMovableColumns={true}
                headerHeight={34}
                rowHeight={26}
                suppressHorizontalScroll={false}
                noRowsOverlayComponent={() => (
                  <div className="ag-overlay-no-rows-center">
                    <div>조회된 데이터가 없습니다</div>
                  </div>
                )}
              />
            </div>
          </div>

          {/* 그리드 하단 상태 정보 */}
          <div className="price-grid-status-info">
            <span>총 <strong>{priceData.length}</strong>건</span>
            {selectedPrice && !isNewMode && (
              <span>선택: <strong>1</strong>건</span>
            )}
          </div>
        </div>

        {/* RIGHT 섹션 - 상품 가격 상세 정보 */}
        <div className="price-right-section">
          <h3>
            <i className="fas fa-info-circle"></i>
            상품 가격 상세정보
          </h3>

          <div className="price-product-detail">
            {/* 기본 정보 섹션 */}
            <div className="price-detail-section">
              <h4>기본 정보</h4>
              
              <div className="price-form-row">
                <div className="price-form-item price-required">
                  <label>
                    상품코드
                    <span className="price-required-mark">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="상품코드 입력"
                    value={selectedPrice?.GOODS_ID || ''}
                    onChange={(e) => handleDetailChange('GOODS_ID', e.target.value.toUpperCase())}
                    disabled={!isNewMode && !!selectedPrice}
                  />
                </div>
                <div className="price-form-item price-required">
                  <label>
                    적용일자
                    <span className="price-required-mark">*</span>
                  </label>
                  <input
                    type="date"
                    value={formatStringToDate(selectedPrice?.OPEN_D || '')}
                    onChange={(e) => handleDetailChange('OPEN_D', formatDateToString(e.target.value))}
                    disabled={!isNewMode && !!selectedPrice}
                  />
                </div>
              </div>

              <div className="price-form-row">
                <div className="price-form-item">
                  <label>종료일자</label>
                  <input
                    type="date"
                    value={formatStringToDate(selectedPrice?.CLOSE_D || '')}
                    onChange={(e) => handleDetailChange('CLOSE_D', formatDateToString(e.target.value))}
                  />
                </div>
                <div className="price-form-item price-required">
                  <label>
                    소비자단가
                    <span className="price-required-mark">*</span>
                  </label>
                  <input
                    type="number"
                    placeholder="0"
                    value={selectedPrice?.SOBIJA_DAN || ''}
                    onChange={(e) => handleDetailChange('SOBIJA_DAN', Number(e.target.value))}
                    min="0"
                    step="1"
                  />
                </div>
              </div>

              <div className="price-form-row">
                <div className="price-form-item price-full-width">
                  <label>적요</label>
                  <textarea
                    placeholder="적요 입력"
                    value={selectedPrice?.MEMO || ''}
                    onChange={(e) => handleDetailChange('MEMO', e.target.value)}
                    rows={3}
                  />
                </div>
              </div>
            </div>

            {/* 시스템 정보 섹션 */}
            {selectedPrice && !isNewMode && (
              <div className="price-detail-section">
                <h4>시스템 정보</h4>
                
                <div className="price-form-row">
                  <div className="price-form-item">
                    <label>등록유저</label>
                    <input
                      type="text"
                      value={selectedPrice?.USER_ID || ''}
                      readOnly
                    />
                  </div>
                  <div className="price-form-item">
                    <label>등록일시</label>
                    <input
                      type="text"
                      value={selectedPrice?.SYS_TIME || ''}
                      readOnly
                    />
                  </div>
                </div>

                <div className="price-form-row">
                  <div className="price-form-item">
                    <label>수정유저</label>
                    <input
                      type="text"
                      value={selectedPrice?.UPD_USER || ''}
                      readOnly
                    />
                  </div>
                  <div className="price-form-item">
                    <label>수정일시</label>
                    <input
                      type="text"
                      value={selectedPrice?.UPD_TIME || ''}
                      readOnly
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* 하단 버튼 - 상품등록과 동일한 구조 */}
          <div className="price-detail-bottom-buttons">
            <div className="price-left-buttons">
              <button className="price-btn-help">
                <i className="fas fa-question-circle"></i> 도움말
              </button>
              <button className="price-btn-batch">
                <i className="fas fa-upload"></i> 일괄등록
              </button>
            </div>
            <div className="price-right-buttons">
              <button className="price-btn-save" onClick={handleSave}>
                <i className="fas fa-save"></i> 저장
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});

ProductPriceRegistration.displayName = 'ProductPriceRegistration';

export default ProductPriceRegistration;

