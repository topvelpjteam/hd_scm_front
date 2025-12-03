import { apiClient } from './apiClient';

/**
 * 판매사원 성과 분석 검색 파라미터
 */
export interface StaffPerformanceSearchParams {
  agentId?: number;              // 매장코드 (단일)
  agentIds?: string[];           // 매장코드 (다중)
  staffId?: string;              // 사원ID
  startDate?: string;            // 조회 시작일 (yyyy-mm-dd)
  endDate?: string;              // 조회 종료일 (yyyy-mm-dd)
  userId?: string;               // 사용자ID
}

/**
 * 요약 통계
 */
export interface StaffSummary {
  totalStaffCnt: number;         // 총 사원수
  totalTrCnt: number;            // 총 거래건수
  totalCustCnt: number;          // 총 고객수
  totalSaleAmt: number;          // 총 매출액
  avgTrAmt: number;              // 평균 객단가
  startDate: string;             // 조회 시작일
  endDate: string;               // 조회 종료일
}

/**
 * 사원별 매출 순위
 */
export interface StaffRankData {
  rankNum: number;               // 순위
  staffId: string;               // 사원ID
  staffNm: string;               // 사원명
  agentNm: string;               // 매장명
  trCnt: number;                 // 거래건수
  custCnt: number;               // 고객수
  saleAmt: number;               // 매출액
  avgTrAmt: number;              // 평균객단가
  avgCustAmt: number;            // 평균고객단가
}

/**
 * 매장별 성과
 */
export interface AgentData {
  agentId: number;               // 매장ID
  agentNm: string;               // 매장명
  staffCnt: number;              // 사원수
  trCnt: number;                 // 거래건수
  custCnt: number;               // 고객수
  saleAmt: number;               // 매출액
  avgStaffSaleAmt: number;       // 사원당 평균매출
}

/**
 * 월별 추이
 */
export interface MonthlyTrendData {
  saleMonth: string;             // 판매월
  staffCnt: number;              // 사원수
  trCnt: number;                 // 거래건수
  custCnt: number;               // 고객수
  saleAmt: number;               // 매출액
}

/**
 * 고객구분별 실적
 */
export interface CustGbnData {
  custGbn: string;               // 고객구분코드
  custGbnNm: string;             // 고객구분명
  custCnt: number;               // 고객수
  trCnt: number;                 // 거래건수
  saleAmt: number;               // 매출액
  avgCustAmt: number;            // 평균고객단가
}

/**
 * 신규고객 유치 실적
 */
export interface NewCustData {
  rankNum: number;               // 순위
  staffId: string;               // 사원ID
  staffNm: string;               // 사원명
  newCustCnt: number;            // 신규고객수
  newCustSaleAmt: number;        // 신규고객매출액
  totalCustCnt: number;          // 총고객수
  totalSaleAmt: number;          // 총매출액
  newCustRate: number;           // 신규고객비율
}

/**
 * 요일별 성과
 */
export interface WeekdayData {
  weekdayNum: number;            // 요일번호
  weekdayNm: string;             // 요일명
  trCnt: number;                 // 거래건수
  custCnt: number;               // 고객수
  saleAmt: number;               // 매출액
  avgTrAmt: number;              // 평균객단가
}

/**
 * 판매사원 성과 분석 응답
 */
export interface StaffPerformanceResponse {
  success: boolean;
  message?: string;
  summary?: StaffSummary;
  staffRankData?: StaffRankData[];
  agentData?: AgentData[];
  monthlyTrendData?: MonthlyTrendData[];
  custGbnData?: CustGbnData[];
  newCustData?: NewCustData[];
  weekdayData?: WeekdayData[];
}

/**
 * 판매사원 성과 분석 서비스
 */
export const staffPerformanceService = {
  /**
   * 판매사원 성과 분석 데이터 조회
   */
  search: async (params: StaffPerformanceSearchParams): Promise<StaffPerformanceResponse> => {
    const payload: Record<string, unknown> = {
      startDate: params.startDate,
      endDate: params.endDate,
      staffId: params.staffId,
      userId: params.userId,
    };

    // 매장 ID 처리
    if (params.agentIds && params.agentIds.length > 0) {
      payload.agentIds = params.agentIds.join(',');
    } else if (params.agentId) {
      payload.agentId = params.agentId;
    }

    return apiClient.postJson<StaffPerformanceResponse>('/api/crm/staff-performance/search', payload);
  },
};
