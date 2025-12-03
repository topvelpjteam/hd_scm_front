import { apiClient } from './apiClient';

/**
 * 고객구분현황 검색 파라미터
 */
export interface CustomerSegmentSearchParams {
  agentId?: number;              // 매장코드
  brandId?: string;              // 브랜드코드
  fromDate?: string;             // 시작일자 (YYYY-MM-DD)
  toDate?: string;               // 종료일자 (YYYY-MM-DD)
  custGbn?: string;              // 고객구분
  genderGbn?: string;            // 성별 (M/F)
  userId?: string;               // 사용자ID
}

/**
 * 요약 통계
 */
export interface CustomerSegmentSummary {
  TOTAL_CUST_CNT: number;        // 전체 고객수
  NEW_CUST_CNT: number;          // 신규고객
  REVISIT_CUST_CNT: number;      // 재방문
  FREE_CUST_CNT: number;         // 프리
  VIP_CUST_CNT: number;          // VIP
  MALE_CNT: number;              // 남성
  FEMALE_CNT: number;            // 여성
  UNKNOWN_GENDER_CNT: number;    // 성별미입력
  SMS_AGREE_CNT: number;         // SMS동의
  EMAIL_AGREE_CNT: number;       // 이메일동의
  DM_AGREE_CNT: number;          // DM동의
  CALL_AGREE_CNT: number;        // 전화동의
}

/**
 * 고객구분별 데이터
 */
export interface CustGbnData {
  CUST_GBN: string;
  CUST_GBN_NM: string;
  CUST_CNT: number;
  RATIO: number;
}

/**
 * 성별 데이터
 */
export interface GenderData {
  GENDER_GBN: string;
  GENDER_NM: string;
  CUST_CNT: number;
  RATIO: number;
}

/**
 * 연령대별 데이터
 */
export interface AgeData {
  AGE_GROUP: string;
  AGE_SORT: number;
  CUST_CNT: number;
  RATIO: number;
}

/**
 * 월별 가입추이 데이터
 */
export interface MonthlyData {
  REG_MONTH: string;
  CUST_CNT: number;
  NEW_CNT: number;
  REVISIT_CNT: number;
  FREE_CNT: number;
  MALE_CNT: number;
  FEMALE_CNT: number;
}

/**
 * 마케팅 동의 현황
 */
export interface MarketingData {
  CHANNEL: string;
  AGREE_CNT: number;
  DISAGREE_CNT: number;
  TOTAL_CNT: number;
  AGREE_RATIO: number;
}

/**
 * 매장별 고객 현황
 */
export interface StoreData {
  AGENT_ID: number;
  STORE_NM: string;
  CUST_CNT: number;
  NEW_CNT: number;
  REVISIT_CNT: number;
  FREE_CNT: number;
  MALE_CNT: number;
  FEMALE_CNT: number;
  SMS_AGREE_CNT: number;
}

/**
 * 상세 고객 목록
 */
export interface CustomerDetail {
  CUST_ID: number;
  CUST_NM: string;
  CUST_GBN: string;
  CUST_GBN_NM: string;
  GENDER_GBN: string;
  GENDER_NM: string;
  CUST_BIRTH_D: string;
  AGE: number | null;
  CUST_OPEN_D: string;
  STORE_NM: string;
  SMS_CHK: string;
  EMAIL_CHK: string;
  DM_CHK: string;
  CALL_CHK: string;
}

/**
 * 고객구분현황 조회 응답
 */
export interface CustomerSegmentResponse {
  success: boolean;
  message: string;
  summary?: CustomerSegmentSummary;
  custGbnData?: CustGbnData[];
  genderData?: GenderData[];
  ageData?: AgeData[];
  monthlyData?: MonthlyData[];
  marketingData?: MarketingData[];
  storeData?: StoreData[];
  detailList?: CustomerDetail[];
}

/**
 * 고객구분현황 API 서비스
 */
export const customerSegmentService = {
  /**
   * 고객구분현황 전체 데이터 조회
   * 요약, 고객구분별, 성별, 연령대별, 월별 추이, 마케팅 동의 현황 한번에 조회
   */
  search: async (params: CustomerSegmentSearchParams): Promise<CustomerSegmentResponse> => {
    try {
      const response = await apiClient.postJson<CustomerSegmentResponse>(
        '/api/crm/customer-segment/search',
        params
      );
      return response;
    } catch (error) {
      console.error('[customerSegmentService] search 오류:', error);
      throw error;
    }
  },

  /**
   * 매장별 고객 현황 조회
   */
  getStoreData: async (params: CustomerSegmentSearchParams): Promise<CustomerSegmentResponse> => {
    try {
      const response = await apiClient.postJson<CustomerSegmentResponse>(
        '/api/crm/customer-segment/store',
        params
      );
      return response;
    } catch (error) {
      console.error('[customerSegmentService] getStoreData 오류:', error);
      throw error;
    }
  },

  /**
   * 상세 고객 목록 조회
   */
  getDetailList: async (params: CustomerSegmentSearchParams): Promise<CustomerSegmentResponse> => {
    try {
      const response = await apiClient.postJson<CustomerSegmentResponse>(
        '/api/crm/customer-segment/detail',
        params
      );
      return response;
    } catch (error) {
      console.error('[customerSegmentService] getDetailList 오류:', error);
      throw error;
    }
  },

  /**
   * 고객구분 코드 목록 조회 (VW_CUST_GBN)
   */
  getCustGbnList: async (): Promise<Array<{ CUST_GBN: string; CUST_GBN_NM: string; SORT_KEY: number }>> => {
    try {
      const response = await apiClient.postJson<Array<{ CUST_GBN: string; CUST_GBN_NM: string; SORT_KEY: number }>>(
        '/api/crm/customer-segment/cust-gbn-list',
        {}
      );
      return response;
    } catch (error) {
      console.error('[customerSegmentService] getCustGbnList 오류:', error);
      return [];
    }
  }
};

export default customerSegmentService;
