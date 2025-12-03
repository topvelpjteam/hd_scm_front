import { apiClient } from './apiClient';

/**
 * 판매사원 AUS-IPT 검색 파라미터
 */
export interface SalesPersonausiptSearchParams {
  mode?: 'SEARCH';
  saleDateFrom?: string;         // 판매일자 시작 (YYYY-MM-DD)
  saleDateTo?: string;           // 판매일자 종료 (YYYY-MM-DD)
  agentIds?: string[];           // 매장코드 목록
  custNmList?: string;           // 고객명 목록 (콤마 구분)
  staffNmList?: string;          // 판매직원명 목록 (콤마 구분)
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
 * 판매사원 AUS-IPT 조회 결과 항목
 */
export interface SalesPersonausiptItem {
  ROW_TYPE: string;               // 행 유형 (DETAIL, STORE_SUBTOTAL, TOTAL)
  AGENT_ID: number;               // 매장 ID
  AGENT_NM: string;               // 매장명
  STAFF_ID: number;               // 판매사원 ID
  STAFF_NM: string;               // 판매사원명
  NOPUR_CNT: number;              // 가입후미구매 고객수
  // 신규고객
  NEW_CUST_CNT: number;           // 신규고객수
  NEW_RATIO: number;              // 신규 비율
  NEW_SALE_AMT: number;           // 신규 매출금액
  NEW_SALE_QTY: number;           // 신규 매출수량
  NEW_AUS: number;                // 신규 AUS
  NEW_IPT: number;                // 신규 IPT
  // 재방문고객
  REV_CUST_CNT: number;           // 재방문고객수
  REV_RATIO: number;              // 재방문 비율
  REV_SALE_AMT: number;           // 재방문 매출금액
  REV_SALE_QTY: number;           // 재방문 매출수량
  REV_AUS: number;                // 재방문 AUS
  REV_IPT: number;                // 재방문 IPT
  // 프리고객
  FREE_CUST_CNT: number;          // 프리고객수
  FREE_RATIO: number;             // 프리 비율
  FREE_SALE_AMT: number;          // 프리 매출금액
  FREE_SALE_QTY: number;          // 프리 매출수량
  FREE_AUS: number;               // 프리 AUS
  FREE_IPT: number;               // 프리 IPT
  // TOTAL
  TOTAL_CUST_CNT: number;         // 전체고객수
  TOTAL_RATIO: number;            // 전체 비율
  TOTAL_SALE_AMT: number;         // 전체 매출금액
  TOTAL_SALE_QTY: number;         // 전체 매출수량
  TOTAL_AUS: number;              // 전체 AUS
  TOTAL_IPT: number;              // 전체 IPT
}

/**
 * 판매사원 AUS-IPT 조회 응답
 */
export interface SalesPersonausiptResponse {
  success: boolean;
  items: SalesPersonausiptItem[];
  totalCount: number;
  totalPages: number;
  pageNum: number;
  pageSize: number;
  message?: string;
  // 전체 합계 정보 - 가입후미구매
  sumNopurCnt?: number;
  // 전체 합계 정보 - 신규고객
  sumNewCustCnt?: number;
  sumNewSaleAmt?: number;
  sumNewSaleQty?: number;
  // 전체 합계 정보 - 재방문고객
  sumRevCustCnt?: number;
  sumRevSaleAmt?: number;
  sumRevSaleQty?: number;
  // 전체 합계 정보 - 프리고객
  sumFreeCustCnt?: number;
  sumFreeSaleAmt?: number;
  sumFreeSaleQty?: number;
  // 전체 합계 정보 - TOTAL
  sumTotalCustCnt?: number;
  sumTotalSaleAmt?: number;
  sumTotalSaleQty?: number;
}

/**
 * 판매사원 AUS-IPT 목록 조회
 */
export const searchSalesPersonausipt = async (
  params: SalesPersonausiptSearchParams,
): Promise<SalesPersonausiptResponse> => {
  try {
    const response = await apiClient.postJson<SalesPersonausiptResponse>(
      '/api/sales-report/sales-person-ausipt/search',
      params,
    );
    return response;
  } catch (error: unknown) {
    console.error('판매사원 AUS-IPT 조회 실패:', error);
    throw error;
  }
};
