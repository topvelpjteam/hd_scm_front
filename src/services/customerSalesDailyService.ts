import { apiClient } from './apiClient';

/**
 * 고객판매일보 검색 파라미터
 */
export interface CustomerSalesDailySearchParams {
  mode?: 'SEARCH';
  saleDateFrom?: string;         // 판매일자 시작 (YYYY-MM-DD)
  saleDateTo?: string;           // 판매일자 종료 (YYYY-MM-DD)
  agentIds?: string[];           // 매장코드 목록
  custNmList?: string;           // 고객명 목록 (콤마 구분)
  staffNmList?: string;          // 판매직원명 목록 (콤마 구분)
  brandIds?: string[];           // 브랜드 목록
  btypeGbnIds?: string[];        // 대분류 목록
  mtypeGbnIds?: string[];        // 중분류 목록
  stypeGbnIds?: string[];        // 소분류 목록
  goodsNmList?: string;          // 상품명 목록 (콤마 구분)
  pageNum?: number;
  pageSize?: number;
  userRoleId?: number;
  userAgentId?: string;
}

/**
 * 고객판매일보 조회 결과 항목
 */
export interface CustomerSalesDailyItem {
  BRAND_NM: string;            // 브랜드명
  CUST_GBN_NM: string;         // 고객구분
  CUST_ID: number;             // 고객코드
  CUST_NM: string;             // 고객명
  CUST_AGENT_NM: string;       // 소속매장
  SALE_D: string;              // 판매일자
  SALE_AGENT_NM: string;       // 판매매장
  STAFF_NM: string;            // 판매사원
  GOODS_CD: string;            // 상품코드
  GOODS_NM: string;            // 상품명
  EXP_D: string;               // 유통기한
  SALE_QTY: number;            // 수량
  UNIT_PRICE: number;          // 단가
  TOT_AMT: number;             // 판매금액
  DISCOUNT_AMT: number;        // 할인금액
  SALE_AMT: number;            // 매출금액
  MAIL_POINT: number;          // 마일리지
  SMS_CHK: string;             // SMS수신
  C_HP: string;                // 핸드폰
  // 추가 정보
  TR_NO?: string;              // 영수증번호
  SALE_SEQU?: number;          // 순번
  AGENT_ID?: number;           // 판매매장코드
  STAFF_ID?: number;           // 판매사원코드
  GOODS_ID?: number;           // 상품ID
  BRAND_ID?: string;           // 브랜드ID
  CUST_AGENT_ID?: number;      // 소속매장코드
  CUST_GBN?: string;           // 고객구분코드
  DISCOUNT_RATE?: number;      // 할인율
}

/**
 * 고객판매일보 조회 응답
 */
export interface CustomerSalesDailyResponse {
  success: boolean;
  items: CustomerSalesDailyItem[];
  totalCount: number;
  totalPages: number;
  pageNum: number;
  pageSize: number;
  message?: string;
  // 전체 합계 정보
  totalQty?: number;
  totalTotAmt?: number;
  totalDiscountAmt?: number;
  totalSaleAmt?: number;
  totalMailPoint?: number;
}

/**
 * 고객판매일보 목록 조회
 */
export const searchCustomerSalesDaily = async (
  params: CustomerSalesDailySearchParams,
): Promise<CustomerSalesDailyResponse> => {
  try {
    const response = await apiClient.postJson<CustomerSalesDailyResponse>(
      '/api/sales-report/customer-sales-daily/search',
      params,
    );
    return response;
  } catch (error: unknown) {
    console.error('고객판매일보 조회 실패:', error);
    throw error;
  }
};
