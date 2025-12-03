import { apiClient } from './apiClient';

/**
 * 고객 구매 여정 분석 검색 파라미터
 */
export interface CustomerJourneySearchParams {
  agentId?: number;              // 매장코드 (단일)
  agentIds?: string[];           // 매장코드 (다중)
  custId?: number;               // 고객코드
  custGbn?: string;              // 고객구분
  startDate?: string;            // 조회 시작일 (yyyy-mm-dd)
  endDate?: string;              // 조회 종료일 (yyyy-mm-dd)
  userId?: string;               // 사용자ID
}

/**
 * 요약 통계
 */
export interface CustomerJourneySummary {
  totalCustCnt: number;          // 총 고객수
  totalTrCnt: number;            // 총 거래건수
  totalSaleAmt: number;          // 총 매출액
  avgCustAmt: number;            // 평균 고객당 매출
  avgTrAmt: number;              // 평균 객단가
  newCustCnt: number;            // 신규고객수
  repeatCustCnt: number;         // 재구매고객수
  startDate: string;             // 조회 시작일
  endDate: string;               // 조회 종료일
}

/**
 * 라이프사이클 데이터
 */
export interface LifecycleData {
  lifecycleStage: string;        // 라이프사이클 단계
  stageOrder: number;            // 순서
  custCnt: number;               // 고객수
  trCnt: number;                 // 거래건수
  saleAmt: number;               // 매출액
  avgCustAmt: number;            // 평균고객단가
}

/**
 * 구매 빈도 데이터
 */
export interface PurchaseFreqData {
  freqGroup: string;             // 빈도 그룹
  groupOrder: number;            // 순서
  custCnt: number;               // 고객수
  totalTrCnt: number;            // 총 거래건수
  totalSaleAmt: number;          // 총 매출액
  avgCustAmt: number;            // 평균고객단가
}

/**
 * 월별 추이 데이터
 */
export interface MonthlyTrendData {
  saleMonth: string;             // 판매월
  custCnt: number;               // 고객수
  trCnt: number;                 // 거래건수
  saleAmt: number;               // 매출액
  newCustSaleAmt: number;        // 신규고객매출
  newCustCnt: number;            // 신규고객수
}

/**
 * 고객구분 데이터
 */
export interface CustGbnData {
  custGbn: string;               // 고객구분코드
  custGbnNm: string;             // 고객구분명
  custCnt: number;               // 고객수
  trCnt: number;                 // 거래건수
  saleAmt: number;               // 매출액
  avgCustAmt: number;            // 평균고객단가
  avgTrAmt: number;              // 평균객단가
}

/**
 * 첫 구매 후 행동 데이터
 */
export interface FirstPurchaseData {
  repeatPeriod: string;          // 재구매 기간
  periodOrder: number;           // 순서
  custCnt: number;               // 고객수
}

/**
 * 마일리지 데이터
 */
export interface MileageData {
  saleMonth: string;             // 판매월
  custCnt: number;               // 고객수
  totalQty: number;              // 총 수량
  totalAmt: number;              // 총 금액
  totalMailPrd: number;          // 적립 마일리지
  totalMailUse: number;          // 사용 마일리지
  mailUseCustCnt: number;        // 마일리지 사용 고객수
  mailUseRate: number;           // 마일리지 사용률
}

/**
 * 상위 고객 데이터
 */
export interface TopCustomer {
  rankNum: number;               // 순위
  custId: number;                // 고객코드
  custNm: string;                // 고객명
  custGbnNm: string;             // 고객구분명
  genderNm: string;              // 성별
  custOpenD: string;             // 가입일
  trCnt: number;                 // 거래건수
  saleAmt: number;               // 매출액
  avgTrAmt: number;              // 평균객단가
  firstPurchaseD: string;        // 첫구매일
  lastPurchaseD: string;         // 마지막구매일
}

/**
 * 응답 데이터
 */
export interface CustomerJourneyResponse {
  success: boolean;
  message: string;
  summary?: CustomerJourneySummary;
  lifecycleData?: LifecycleData[];
  purchaseFreqData?: PurchaseFreqData[];
  monthlyTrendData?: MonthlyTrendData[];
  custGbnData?: CustGbnData[];
  firstPurchaseData?: FirstPurchaseData[];
  mileageData?: MileageData[];
  topCustomers?: TopCustomer[];
}

/**
 * 고객 구매 여정 분석 서비스
 */
export const customerJourneyService = {
  /**
   * 고객 구매 여정 분석 데이터 조회
   */
  search: async (params: CustomerJourneySearchParams): Promise<CustomerJourneyResponse> => {
    const requestBody = {
      ...params,
      agentIds: params.agentIds?.join(',') || null,
    };
    return apiClient.postJson<CustomerJourneyResponse>('/api/crm/customer-journey/search', requestBody);
  }
};

export default customerJourneyService;
