import { apiClient } from './apiClient';

/**
 * 매입처(벤더) 브랜드별 매출내역 검색 파라미터
 */
export interface SalesByVendorBrandSearchParams {
  startDate?: string;            // 조회 시작일 (YYYY-MM-DD)
  endDate?: string;              // 조회 종료일 (YYYY-MM-DD)
  loginAgentId?: string;         // 로그인한 벤더의 AGENT_ID (string)
  brandIds?: string;             // 브랜드 코드 (콤마 구분)
  storeIds?: string;             // 매장 코드 (콤마 구분)
  goodsNm?: string;              // 상품명 검색
}

/**
 * 매장별 상품별 매출 데이터
 */
export interface SalesDetailData {
  ROW_NUM: number;
  // 매장 정보
  STORE_ID: number;
  STORE_NM: string;
  STORE_SHORT_NM: string;
  // 브랜드 정보
  BRAND_ID: string;
  BRAND_NM: string;
  // 벤더(매입처) 정보
  VENDOR_ID: number;
  VENDOR_NM: string;
  SALE_RATE: number;              // 할인율
  // 상품 정보
  GOODS_ID: number;
  GOODS_ID_BRAND: string;
  GOODS_NM: string;
  BTYPE_GBN: string;
  BTYPE_GBN_NM: string;
  MTYPE_GBN: string;
  MTYPE_GBN_NM: string;
  STYPE_GBN: string;
  STYPE_GBN_NM: string;
  // 매출 집계
  TR_CNT: number;                 // 거래건수
  SALE_QTY: number;               // 판매수량
  TOT_AMT: number;                // 총금액
  DISCOUNT_AMT: number;           // 할인금액
  SALE_AMT: number;               // 실판매금액
  SETTLE_AMT: number;             // 정산금액 (할인율 적용)
  // 조회기간
  START_DATE: string;
  END_DATE: string;
}

/**
 * 브랜드별 합산 데이터
 */
export interface BrandSummaryData {
  ROW_NUM: number;
  BRAND_ID: string;
  BRAND_NM: string;
  VENDOR_ID: number;
  VENDOR_NM: string;
  SALE_RATE: number;
  STORE_CNT: number;              // 매장수
  GOODS_CNT: number;              // 상품수
  TR_CNT: number;                 // 거래건수
  SALE_QTY: number;               // 판매수량
  SALE_AMT: number;               // 실판매금액
  SETTLE_AMT: number;             // 정산금액
  START_DATE: string;
  END_DATE: string;
}

/**
 * 전체 합계 데이터
 */
export interface TotalSummaryData {
  STORE_CNT: number;              // 매장수
  BRAND_CNT: number;              // 브랜드수
  GOODS_CNT: number;              // 상품수
  TR_CNT: number;                 // 거래건수
  SALE_QTY: number;               // 판매수량
  TOT_AMT: number;                // 총금액
  DISCOUNT_AMT: number;           // 할인금액
  SALE_AMT: number;               // 실판매금액
  START_DATE: string;
  END_DATE: string;
}

/**
 * 일별 추이 데이터
 */
export interface DailyTrendData {
  SALE_D: string;
  BRAND_ID: string;
  BRAND_NM: string;
  STORE_CNT: number;
  TR_CNT: number;
  SALE_QTY: number;
  SALE_AMT: number;
}

/**
 * 매출내역 조회 응답
 */
export interface SalesSearchResponse {
  success: boolean;
  message: string;
  data: SalesDetailData[];
  totalCount: number;
}

/**
 * 브랜드별 합산 응답
 */
export interface BrandSummaryResponse {
  success: boolean;
  message: string;
  data: BrandSummaryData[];
}

/**
 * 전체 합계 응답
 */
export interface TotalSummaryResponse {
  success: boolean;
  message: string;
  summary: TotalSummaryData;
}

/**
 * 일별 추이 응답
 */
export interface DailyTrendResponse {
  success: boolean;
  message: string;
  data: DailyTrendData[];
}

/**
 * 매입처(벤더) 브랜드별 매출내역 서비스
 */
export const salesByVendorBrandService = {
  /**
   * 매장별 상품별 매출 상세 조회
   */
  search: (params: SalesByVendorBrandSearchParams) => 
    apiClient.postJson<SalesSearchResponse>('/api/reports/salesByVendorBrand/search', params),

  /**
   * 브랜드별 합산 조회
   */
  getSummaryByBrand: (params: SalesByVendorBrandSearchParams) => 
    apiClient.postJson<BrandSummaryResponse>('/api/reports/salesByVendorBrand/summary/brand', params),

  /**
   * 전체 합계 조회
   */
  getSummaryTotal: (params: SalesByVendorBrandSearchParams) => 
    apiClient.postJson<TotalSummaryResponse>('/api/reports/salesByVendorBrand/summary/total', params),

  /**
   * 일별 추이 조회
   */
  getDailyTrend: (params: SalesByVendorBrandSearchParams) => 
    apiClient.postJson<DailyTrendResponse>('/api/reports/salesByVendorBrand/trend/daily', params),

  /**
   * 엑셀 다운로드용 전체 데이터 조회
   */
  exportData: (params: SalesByVendorBrandSearchParams) => 
    apiClient.postJson<SalesDetailData[]>('/api/reports/salesByVendorBrand/export', params),
};

export default salesByVendorBrandService;
