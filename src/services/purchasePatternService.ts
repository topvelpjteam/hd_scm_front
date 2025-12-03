import { apiClient } from './apiClient';

/**
 * 구매패턴 분석 검색 파라미터
 */
export interface PurchasePatternSearchParams {
  agentId?: number;              // 매장코드 (단일)
  agentIds?: string[];           // 매장코드 (다중)
  brandId?: string;              // 브랜드코드
  startDate?: string;            // 조회 시작일 (yyyy-mm-dd)
  endDate?: string;              // 조회 종료일 (yyyy-mm-dd)
  custGbn?: string;              // 고객구분
  userId?: string;               // 사용자ID
}

/**
 * 요약 통계
 */
export interface PurchaseSummary {
  totalTrCnt: number;            // 총 거래 건수
  totalCustCnt: number;          // 총 고객수
  totalSaleAmt: number;          // 총 매출액
  avgTrAmt: number;              // 평균 객단가 (거래당)
  avgCustAmt: number;            // 평균 구매액 (고객당)
  avgQty: number;                // 평균 구매수량
  totalDiscountAmt: number;      // 총 할인액
  avgDiscountRate: number;       // 평균 할인율
  startDate: string;             // 조회 시작일
  endDate: string;               // 조회 종료일
}

/**
 * 요일별 분석
 */
export interface WeekdayData {
  weekdayNum: number;            // 요일번호 (1=일, 2=월, ...)
  weekdayNm: string;             // 요일명
  trCnt: number;                 // 거래건수
  custCnt: number;               // 고객수
  saleAmt: number;               // 매출액
  avgTrAmt: number;              // 평균객단가
}

/**
 * 시간대별 분석
 */
export interface HourData {
  hourNum: number;               // 시간
  hourNm: string;                // 시간명
  timeZone: string;              // 시간대
  trCnt: number;                 // 거래건수
  custCnt: number;               // 고객수
  saleAmt: number;               // 매출액
  avgTrAmt: number;              // 평균객단가
}

/**
 * 시간대 그룹별 분석
 */
export interface TimezoneData {
  timeZoneNum: number;           // 시간대번호
  timeZoneNm: string;            // 시간대명
  trCnt: number;                 // 거래건수
  custCnt: number;               // 고객수
  saleAmt: number;               // 매출액
  avgTrAmt: number;              // 평균객단가
}

/**
 * 객단가 구간별 분석
 */
export interface AmtRangeData {
  amtRangeNum: number;           // 구간번호
  amtRangeNm: string;            // 구간명
  trCnt: number;                 // 거래건수
  saleAmt: number;               // 매출액
  avgTrAmt: number;              // 평균객단가
}

/**
 * 구매주기별 분석
 */
export interface PurchaseCycleData {
  cycleGbn: number;              // 주기구분
  cycleNm: string;               // 주기명
  custCnt: number;               // 고객수
  totalSaleAmt: number;          // 총매출액
  avgCustAmt: number;            // 평균고객매출
  avgPurchaseCnt: number;        // 평균구매횟수
}

/**
 * 월별 추이
 */
export interface MonthlyTrendData {
  saleMonth: string;             // 판매월
  trCnt: number;                 // 거래건수
  custCnt: number;               // 고객수
  saleAmt: number;               // 매출액
  avgTrAmt: number;              // 평균객단가
  avgCustAmt: number;            // 평균고객매출
}

/**
 * 재구매율 분석
 */
export interface RepurchaseData {
  totalCustCnt: number;          // 총 고객수
  repurchaseCustCnt: number;     // 재구매 고객수
  singleCustCnt: number;         // 1회 구매 고객수
  repurchaseRate: number;        // 재구매율
}

/**
 * 할인 분석
 */
export interface DiscountData {
  discountGbn: number;           // 할인구분
  discountNm: string;            // 할인명
  trCnt: number;                 // 거래건수
  saleAmt: number;               // 매출액
  discountAmt: number;           // 할인액
}

/**
 * 인기 상품 TOP 10
 */
export interface TopProductData {
  goodsId: number;               // 상품코드
  goodsNm: string;               // 상품명
  goodsGbn: string;              // 상품구분
  trCnt: number;                 // 거래건수
  saleQty: number;               // 판매수량
  saleAmt: number;               // 매출액
}

/**
 * 고객구분별 분석
 */
export interface CustGbnData {
  custGbn: string;               // 고객구분
  custGbnNm: string;             // 고객구분명
  custCnt: number;               // 고객수
  trCnt: number;                 // 거래건수
  saleAmt: number;               // 매출액
  avgCustAmt: number;            // 평균고객매출
  avgTrAmt: number;              // 평균객단가
}

/**
 * 구매패턴 분석 응답
 */
export interface PurchasePatternResponse {
  success: boolean;
  message?: string;
  summary?: PurchaseSummary;
  weekdayData?: WeekdayData[];
  hourData?: HourData[];
  timezoneData?: TimezoneData[];
  amtRangeData?: AmtRangeData[];
  purchaseCycleData?: PurchaseCycleData[];
  monthlyTrendData?: MonthlyTrendData[];
  repurchaseData?: RepurchaseData;
  discountData?: DiscountData[];
  topProducts?: TopProductData[];
  custGbnData?: CustGbnData[];
}

/**
 * 구매패턴 분석 서비스
 */
export const purchasePatternService = {
  /**
   * 구매패턴 분석 데이터 조회
   */
  search: async (params: PurchasePatternSearchParams): Promise<PurchasePatternResponse> => {
    // agentIds 배열을 콤마 구분 문자열로 변환
    const payload = {
      ...params,
      agentIds: params.agentIds?.join(',') || undefined
    };
    return apiClient.postJson<PurchasePatternResponse>('/api/crm/purchase-pattern/search', payload);
  }
};
