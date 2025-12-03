// 팝업용 공통검색 서비스
// use relative `/api` so Vite dev-proxy or same-origin deploy works (avoids CORS issues)
const API_BASE_URL = '/api';

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
    agentId?: string; // 거래처코드(로그인한 사용자의 AGENT_ID)
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

    // For USP_ZA_PopupSearchWithPrice the @agent_id should be the login user's agent id.
    // Prefer params.agentId if explicitly provided; otherwise fall back to sessionStorage.
    let normalizedSearchAgentId = '';
    
    // 1순위: 명시적으로 전달된 params.agentId 사용
    if (params.agentId) {
      normalizedSearchAgentId = String(params.agentId).trim();
    } else {
      // 2순위: sessionStorage에서 가져오기 (agentId 우선, storeId는 제외)
      try {
        const userStr = (typeof sessionStorage !== 'undefined') ? sessionStorage.getItem('user') : null;
        if (userStr) {
          const u = JSON.parse(userStr);
          const userAgentId = u.agentId || u.AGENT_ID || u.agent_id;
          if (userAgentId) normalizedSearchAgentId = String(userAgentId);
        }
      } catch (e) {
        // ignore session parse errors
      }
      // 3순위: params.userId 사용
      if (!normalizedSearchAgentId && params.userId) {
        normalizedSearchAgentId = params.userId.trim();
      }
    }

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

    // If saleDate provided, call backend popup endpoint that already returns CONSUMER_PRICE in one query
    const saleDate = (params as any).saleDate; // expected format 'YYYYMMDD' or 'YYYY-MM-DD'
    const storeIdParam = (params as any).storeId ?? (params as any).store_id ?? null;

    if (saleDate) {
      try {
        // Ensure saleDate is sent in 'YYYY-MM-DD' form. Accept either 'YYYYMMDD' or 'YYYY-MM-DD' input.
        const fmtSaleDate = (() => {
          if (!saleDate) return null;
          const s = String(saleDate);
          if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
          const digits = s.replace(/[^0-9]/g, '');
          if (digits.length === 8) return digits.replace(/(\d{4})(\d{2})(\d{2})/, '$1-$2-$3');
          return s;
        })();
        // The stored proc expects @store_id (selected sales store) and @AGENT_ID (login user's agent id)
        const loginAgentId = normalizedSearchAgentId || '';
        const body: any = { searchText };
        if (fmtSaleDate) body.saleDate = fmtSaleDate;
        if (storeIdParam) body.store_id = String(storeIdParam);
        if (loginAgentId) body.agentId = String(loginAgentId);
        console.debug('[popupSearchService] calling search-with-price with body:', body);

        const res = await fetch(`${API_BASE_URL}/popup/products/search-with-price`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body)
        });
        if (!res.ok) {
          console.warn('popup search-with-price failed', res.status);
          return [];
        }
        const json = await res.json();
        const rows = Array.isArray(json.rows) ? json.rows : (Array.isArray(json) ? json : []);

        console.debug('[popupSearchService] search-with-price response rows count=', rows.length);

        // Normalize common fields for frontend: price, brand name, barcode, stock, expiry
        const findFirstKey = (obj: any, candidates: string[]) => {
          if (!obj) return undefined;
          const keys = Object.keys(obj);
          for (const c of candidates) {
            const found = keys.find(k => k.toLowerCase() === c.toLowerCase());
            if (found) return obj[found];
          }
          return undefined;
        };

        rows.forEach((r: any) => {
          const price = r.CONSUMER_PRICE ?? r.SOBIJA_DAN ?? r.SOBIJA_DANGA ?? r.consumerPrice ?? null;
          if (price != null) {
            r.CONSUMER_PRICE = Number(price);
            r.consumerPrice = Number(price);
          }

          r.BRAND_NM = r.BRAND_NM ?? r.BRAND_GBN_NM ?? r.brand ?? '';
          r.BAR_CODE = r.BAR_CODE ?? r.BARCODE ?? r.bar_code ?? '';

          // Normalize store-level stock quantity to `STORE_QTY` for frontend convenience
          const stockVal = r.STORE_QTY ?? r.STOCK_QTY ?? r.AVAIL_QTY ?? r.INV_QTY ?? r.STORE_STOCK ?? r.QTY ?? r.QTY_AVAIL ?? findFirstKey(r, ['store_qty','stock_qty','avail_qty','inv_qty','qty','qty_avail']);
          r.STORE_QTY = Number(stockVal || 0);

          // Normalize expiry / 유통기한 field into `EXPIRY_D` (format to YYYY-MM-DD when possible)
          const rawExp = r.EXPIRY_D ?? r.EXPIRY_DATE ?? r.EXPIRE_D ?? r.EXPIRE_DATE ?? r.expiry ?? r.expireDate ?? r.EXP_D ?? r.EXP ?? findFirstKey(r, ['exp_d','exp','expiry','expire','expiry_d']);
          if (rawExp) {
            const s = String(rawExp).replace(/[^0-9]/g, '');
            if (s.length === 8) {
              r.EXPIRY_D = s.replace(/(\d{4})(\d{2})(\d{2})/, '$1-$2-$3');
            } else {
              r.EXPIRY_D = String(rawExp);
            }
          } else {
            r.EXPIRY_D = '';
          }

          // Normalize special mileage fields (P_MAIL_AMT and P_MAIL_POINT from TB_ZA_SPECMAIL)
          r.P_MAIL_AMT = r.P_MAIL_AMT ?? r.p_mail_amt ?? r.MAIL_AMT ?? r.mail_amt ?? null;
          r.P_MAIL_POINT = r.P_MAIL_POINT ?? r.p_mail_point ?? r.MAIL_POINT ?? r.mail_point ?? null;
          if (r.P_MAIL_AMT != null) r.P_MAIL_AMT = Number(r.P_MAIL_AMT);
          if (r.P_MAIL_POINT != null) r.P_MAIL_POINT = Number(r.P_MAIL_POINT);
        });

        return rows as PopupSearchResult[];
      } catch (e) {
        console.warn('Failed to call search-with-price endpoint', e);
        return [];
      }
    }

    // Fallback: use original popup search endpoint
    const products = await this.searchProducts(request);
    return products;
  }
}

export const popupSearchService = new PopupSearchService();
