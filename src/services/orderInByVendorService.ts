import { apiClient } from './apiClient';

/**
 * 매입처별 발주/입고내역 검색 파라미터
 */
export interface OrderInByVendorSearchParams {
  startDate?: string;            // 발주 시작일 (YYYY-MM-DD)
  endDate?: string;              // 발주 종료일 (YYYY-MM-DD)
  loginAgentId?: string;         // 로그인한 벤더의 AGENT_ID
  vendorIds?: string;            // 매입처(벤더) 코드 (콤마 구분)
  brandIds?: string;             // 브랜드 코드 (콤마 구분)
  storeIds?: string;             // 매장 코드 (콤마 구분)
  goodsNm?: string;              // 상품명 검색
  inStatus?: string;             // 입고상태: ALL, COMPLETE, PARTIAL, PENDING
}

/**
 * 발주/입고 상세 데이터 (로우데이터)
 */
export interface OrderInDetailData {
  ROW_NUM: number;
  // 벤더(매입처) 정보
  VENDOR_ID: number;
  VENDOR_NM: string;
  VENDOR_SHORT_NM: string;
  // 브랜드 정보
  BRAND_ID: string;
  BRAND_NM: string;
  // 매장 정보
  STORE_ID: number;
  STORE_NM: string;
  STORE_SHORT_NM: string;
  // 발주 정보
  ORDER_D: string;
  ORDER_SEQU: number;
  ORDER_NO: number;
  REQUIRE_D: string;
  CANCEL_GBN: string;
  CANCEL_GBN_NM: string;
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
  // 발주수량/금액
  ORDER_QTY: number;
  ORDER_DAN: number;
  ORDER_AMT: number;
  ORDER_TOT: number;
  // 출고 정보
  OUT_D: string | null;
  OUT_QTY: number;
  // 입고 정보
  IN_D: string | null;
  IN_TOT_QTY: number;
  IN_GOOD_QTY: number;
  IN_BAD_QTY: number;
  IN_BAD_MEMO: string | null;
  IN_AMT: number;
  IN_TOT: number;
  // 계산 필드
  NOT_IN_QTY: number;           // 미입고수량
  IN_RATE: number;              // 입고율(%)
  IN_STATUS: string;            // PENDING, PARTIAL, COMPLETE
  IN_STATUS_NM: string;         // 미입고, 부분입고, 입고완료
  // 배송 정보
  SHIP_METHOD: string | null;
  SHIP_LOGIS_GBN: string | null;
  SHIP_TRANS_NO: string | null;
  SHIP_MEMO: string | null;
  // 메모
  ORDER_MEMO: string | null;
  IN_MEMO: string | null;
  // 조회기간
  START_DATE: string;
  END_DATE: string;
}

/**
 * 매입처별 합산 데이터
 */
export interface VendorSummaryData {
  ROW_NUM: number;
  VENDOR_ID: number;
  VENDOR_NM: string;
  VENDOR_SHORT_NM: string;
  STORE_CNT: number;            // 발주매장수
  GOODS_CNT: number;            // 상품수
  ORDER_CNT: number;            // 발주건수
  ORDER_QTY: number;            // 발주수량
  ORDER_TOT: number;            // 발주금액
  OUT_QTY: number;              // 출고수량
  IN_TOT_QTY: number;           // 입고수량
  IN_GOOD_QTY: number;          // 양호수량
  IN_BAD_QTY: number;           // 불량수량
  IN_TOT: number;               // 입고금액
  NOT_IN_QTY: number;           // 미입고수량
  IN_RATE: number;              // 입고율(%)
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
  VENDOR_CNT: number;           // 매입처수
  STORE_CNT: number;            // 발주매장수
  GOODS_CNT: number;            // 상품수
  ORDER_CNT: number;            // 발주건수
  ORDER_QTY: number;            // 발주수량
  ORDER_TOT: number;            // 발주금액
  IN_TOT_QTY: number;           // 입고수량
  IN_TOT: number;               // 입고금액
  NOT_IN_QTY: number;           // 미입고수량
  IN_RATE: number;              // 입고율(%)
  START_DATE: string;
  END_DATE: string;
}

/**
 * API 응답 타입
 */
export interface OrderInByVendorResponse<T> {
  success: boolean;
  data?: T[];
  totalCount?: number;
  message?: string;
}

/**
 * 매입처별 발주/입고내역 서비스
 */
export const orderInByVendorService = {
  /**
   * 발주/입고내역 조회 (로우데이터)
   */
  search: (params: OrderInByVendorSearchParams): Promise<OrderInByVendorResponse<OrderInDetailData>> => {
    return apiClient.postJson('/api/orderInByVendor/search', params);
  },

  /**
   * 매입처별 합산 조회
   */
  summaryByVendor: (params: OrderInByVendorSearchParams): Promise<OrderInByVendorResponse<VendorSummaryData>> => {
    return apiClient.postJson('/api/orderInByVendor/summaryByVendor', params);
  },

  /**
   * 브랜드별 합산 조회
   */
  summaryByBrand: (params: OrderInByVendorSearchParams): Promise<OrderInByVendorResponse<BrandSummaryData>> => {
    return apiClient.postJson('/api/orderInByVendor/summaryByBrand', params);
  },
};

export default orderInByVendorService;
