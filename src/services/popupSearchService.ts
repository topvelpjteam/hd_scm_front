// 팝업용 공통검색 서비스
const API_BASE_URL = 'http://localhost:8080/api';

export interface PopupSearchRequest {
  mode: string;
  searchGoodsGbn?: string;      // 상품구분
  searchBrandId?: string;       // 브랜드
  searchBtypeGbn?: string;      // 대분류
  searchMtypeGbn?: string;      // 중분류
  searchStypeGbn?: string;      // 소분류
  searchText?: string;          // 검색어
  searchAgentId?: string;       // 거래처코드(로그인한 사용자의 AGENT_ID)
  searchExpireYn?: string;      // 종료상품 제외 여부
}

export interface PopupSearchResult {
  GOODS_ID: number;
  GOODS_ID_BRAND: string;
  GOODS_NM: string;
  GOODS_NM_EN?: string;
  GOODS_NM_JP?: string;
  GOODS_NM_CN?: string;
  BAR_CODE?: string;
  GOODS_NO?: string;
  FOREIGN_ID?: string;
  FOREIGN_NM?: string;
  GOODS_GBN: string;
  GOODS_GBN_NM?: string;
  BRAND_ID: string;
  BRAND_NM?: string;
  MAKER_GBN?: string;
  COLLECTION_GBN?: string;
  NATION_GBN?: string;
  HS_CODE?: string;
  BTYPE_GBN: string;
  MTYPE_GBN?: string;
  STYPE_GBN?: string;
  USE_GBN?: string;
  SET_GBN?: string;
  CHANN_GBN?: string;
  MANA_GBN?: string;
  FUNC_GBN?: string;
  BOX_GBN?: string;
  ABC_CLASS?: string;
  GOODS_CAPA?: string;
  GOODS_UNIT?: string;
  PACKING_SIZE?: string;
  STORAGE_CONDITION?: string;
  EXPIRY_PERIOD?: number;
  SUPPLY_DAN?: number;
  BUY_DAN?: number;
  MONEY_GBN?: string;
  VAT_YN?: string;
  TAX_RATE?: number;
  SUPPLIER_ID?: string;
  LEAD_TIME?: number;
  SAFETY_STOCK?: number;
  MAX_STOCK?: number;
  REORDER_POINT?: number;
  ORDER_UNIT_QTY?: number;
  MIN_ORDER_QTY?: number;
  WAREHOUSE_LOCATION?: string;
  LOT_MANAGEMENT_YN?: string;
  STOCK_YN?: string;
  QUALITY_GRADE?: string;
  INSPECTION_CYCLE?: number;
  RETURN_POLICY?: string;
  WARRANTY_PERIOD?: number;
  RUN_D?: string;
  END_D?: string;
  OPEN_D?: string;
  CLOSE_D?: string;
  ACCOUNT_CODE?: string;
  COST_CENTER?: string;
  PROFIT_CENTER?: string;
  REMARKS?: string;
  USER_ID?: string;
  SYS_TIME?: string;
  UPD_USER?: string;
  UPD_TIME?: string;
  BRAND_GBN_NM: string;
  BTYPE_GBN_NM: string;
  MTYPE_GBN_NM?: string;
  STYPE_GBN_NM?: string;
  VENDOR_ID?: string;    // 납품처코드
  VENDOR_NM?: string;    // 납품처명
  brand?: string;
}

class PopupSearchService {
  /**
   * 팝업용 상품 검색
   * @param request 검색 요청 파라미터
   * @returns 검색 결과 배열
   */
  async searchProducts(request: PopupSearchRequest): Promise<PopupSearchResult[]> {
    try {
      console.log('🔍 팝업 상품 검색 요청:', request);
      
      const response = await fetch(`${API_BASE_URL}/popup/search`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const results = await response.json();
      console.log('🔍 팝업 상품 검색 결과:', results);
      return results;
    } catch (error) {
      console.error('❌ 팝업 상품 검색 중 오류 발생:', error);
      throw error;
    }
  }

  /**
   * 상품검색 팝업용 검색 (간편 메서드)
   * @param params 검색 파라미터
   * @returns 검색 결과 배열
   */
  async searchProductsForPopup(params: {
    selectedGoodsGbn?: string[];
    selectedBrands?: string[];
    selectedBtypes?: string[];
    searchText?: string;
    brandProductCode?: string; // 브랜드상품코드
    brandId?: string; // 브랜드코드
    goodsId?: string; // 상품코드
    excludeEndedProducts?: boolean;
    userId?: string;
  }): Promise<PopupSearchResult[]> {
    console.log('🔍 searchProductsForPopup 파라미터:', params);
    
    // 더블클릭으로 인한 상세 정보 조회인지 확인
    const isDetailedSearch = params.brandProductCode || params.brandId || params.goodsId;
    console.log('🔍 상세 정보 조회 여부:', isDetailedSearch);
    
    const normalizeValues = (values?: string[]) =>
      values
        ?.map((value) => value?.trim())
        .filter((value): value is string => !!value) ?? [];

    const joinValues = (values?: string[]) => normalizeValues(values).join(',');

    const normalizedSearchAgentId = params.userId?.trim() ?? '';

    const searchBrandId = isDetailedSearch
      ? (params.brandId?.trim() ?? '')
      : joinValues(params.selectedBrands);
    const searchText = isDetailedSearch
      ? params.brandProductCode || params.goodsId || ''
      : params.searchText?.trim() || '';
    
    if (isDetailedSearch) {
      console.log('🔍 상세 조회 파라미터:', { searchBrandId, searchText });
    } else {
      console.log('🔍 일반 검색 파라미터:', { searchBrandId, searchText });
    }
    
    const request: PopupSearchRequest = {
      mode: 'GOODS',
      // 더블클릭일 때는 상품구분을 공백으로 설정 (구체적인 상품 정보로만 검색)
      searchGoodsGbn: isDetailedSearch ? '' : joinValues(params.selectedGoodsGbn),
      searchBrandId: searchBrandId,
      // 더블클릭일 때는 대분류를 공백으로 설정 (구체적인 상품 정보로만 검색)
      searchBtypeGbn: isDetailedSearch ? '' : joinValues(params.selectedBtypes),
      searchText: searchText,
      searchAgentId: normalizedSearchAgentId, // 로그인한 사용자의 agent_id 전달
      searchExpireYn: params.excludeEndedProducts ? 'Y' : 'N'
    };
    
    console.log('🔍 최종 요청 객체:', request);

    return this.searchProducts(request);
  }
}

export const popupSearchService = new PopupSearchService();
