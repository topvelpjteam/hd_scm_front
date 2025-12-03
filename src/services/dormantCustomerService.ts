import { apiClient } from './apiClient';

/**
 * 휴면고객 분석 검색 파라미터
 */
export interface DormantCustomerSearchParams {
  agentId?: number;              // 매장코드 (단일)
  agentIds?: string[];           // 매장코드 (다중)
  brandId?: string;              // 브랜드코드
  dormantMonths?: number;        // 휴면 기준 개월수 (기본 6개월)
  custGbn?: string;              // 고객구분
  genderGbn?: string;            // 성별 (M/F)
  userId?: string;               // 사용자ID
}

/**
 * 요약 통계
 */
export interface DormantSummary {
  TOTAL_CUST_CNT: number;        // 전체 고객수
  ACTIVE_CUST_CNT: number;       // 활성 고객수
  DORMANT_CUST_CNT: number;      // 휴면 고객수
  DORMANT_MONTHS: number;        // 휴면 기준 개월수
  DORMANT_DATE: string;          // 휴면 기준일자
}

/**
 * 휴면기간별 분포
 */
export interface PeriodData {
  PERIOD_NM: string;             // 기간명
  PERIOD_GBN: number;            // 기간구분
  CUST_CNT: number;              // 고객수
  RATIO: number;                 // 비율
}

/**
 * 고객구분별 분포
 */
export interface CustGbnData {
  CUST_GBN: string;
  CUST_GBN_NM: string;
  CUST_CNT: number;
  RATIO: number;
}

/**
 * 성별 분포
 */
export interface GenderData {
  GENDER_GBN: string;
  GENDER_NM: string;
  CUST_CNT: number;
  RATIO: number;
}

/**
 * 월별 활성화 추이
 */
export interface MonthlyTrendData {
  SALE_MONTH: string;
  ACTIVE_CNT: number;
  PREV_ACTIVE_CNT: number;
  DIFF_CNT: number;
}

/**
 * 마지막 구매금액대별 분포
 */
export interface LastPurchaseData {
  AMT_GROUP: string;
  AMT_SORT: number;
  CUST_CNT: number;
  RATIO: number;
}

/**
 * 마케팅 대상
 */
export interface MarketingTargetData {
  CHANNEL: string;
  TARGET_CNT: number;
}

/**
 * 휴면고객 상세
 */
export interface DormantDetailItem {
  CUST_ID: number;
  CUST_NM: string;
  CUST_GBN: string;
  CUST_GBN_NM: string;
  GENDER_NM: string;
  CUST_BIRTH_D: string;
  REG_DATE: string;
  C_HP: string;
  C_EMAIL: string;
  LAST_SALE_D: string;
  DORMANT_DAYS: number;
  TOTAL_SALE_AMT: number;
  VISIT_CNT: number;
  STORE_NM: string;
  SMS_CHK: string;
  EMAIL_CHK: string;
  CALL_CHK: string;
}

/**
 * 휴면고객 분석 응답
 */
export interface DormantCustomerResponse {
  success: boolean;
  message?: string;
  summary?: DormantSummary;
  periodData?: PeriodData[];
  custGbnData?: CustGbnData[];
  genderData?: GenderData[];
  monthlyTrendData?: MonthlyTrendData[];
  lastPurchaseData?: LastPurchaseData[];
  marketingTargetData?: MarketingTargetData[];
  detailList?: DormantDetailItem[];
}

/**
 * 휴면고객 분석 서비스
 */
export const dormantCustomerService = {
  /**
   * 휴면고객 분석 데이터 조회
   */
  search: async (params: DormantCustomerSearchParams): Promise<DormantCustomerResponse> => {
    // agentIds 배열을 콤마 구분 문자열로 변환
    const payload = {
      ...params,
      agentIds: params.agentIds?.join(',') || undefined
    };
    return apiClient.postJson<DormantCustomerResponse>('/api/crm/dormant-customer/search', payload);
  },

  /**
   * 휴면고객 상세 목록 조회
   */
  getDetailList: async (params: DormantCustomerSearchParams): Promise<DormantCustomerResponse> => {
    // agentIds 배열을 콤마 구분 문자열로 변환
    const payload = {
      ...params,
      agentIds: params.agentIds?.join(',') || undefined
    };
    return apiClient.postJson<DormantCustomerResponse>('/api/crm/dormant-customer/detail', payload);
  }
};
