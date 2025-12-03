import { apiClient } from './apiClient';

/**
 * 일일매출현황 검색 파라미터
 */
export interface DailySalesStatusSearchParams {
  mode?: 'SEARCH';
  saleMonth?: string;            // 조회 연월 (YYYY-MM)
  agentIds?: string[];           // 매장코드 목록
  custNmList?: string;           // 고객명 목록 (콤마 구분)
  staffNmList?: string;          // 판매직원명 목록 (콤마 구분)
  brandIds?: string[];           // 브랜드 목록
  btypeGbnIds?: string[];        // 대분류 목록
  mtypeGbnIds?: string[];        // 중분류 목록
  stypeGbnIds?: string[];        // 소분류 목록
  goodsNmList?: string;          // 상품명 목록 (콤마 구분)
  userRoleId?: number;
  userAgentId?: string;
}

/**
 * 매장 정보
 */
export interface AgentInfo {
  AGENT_ID: number;
  AGENT_NM: string;
  SORT_ORDER?: number;
}

/**
 * 일일매출현황 조회 결과 항목
 */
export interface DailySalesStatusItem {
  ROW_TYPE: string;               // 행 유형 (DAY, SUBTOTAL, TARGET, ACHIEVE, PREV_MONTH, PREV_MONTH_RATIO, PREV_YEAR, PREV_YEAR_RATIO)
  DAY_NUM: number | null;         // 일
  DAY_OF_WEEK: string;            // 요일
  DISPLAY_ORDER: number;          // 정렬 순서
  SALE_MONTH: string;             // 조회 연월
  // Total 컬럼
  TOTAL_STORE_AMT: number;        // 전체 매장 합계
  TOTAL_ONLINE_AMT: number;       // 전체 온라인 합계
  TOTAL_SUM_AMT: number;          // 전체 합계
  TOTAL_CUST_CNT: number;         // 전체 고객수
  // 매장별 데이터 (XML 형태로 반환됨, 파싱 필요)
  AGENT_DATA?: string;
}

/**
 * 매장별 일자 데이터 (파싱 후)
 */
export interface AgentDayData {
  AGENT_ID: number;
  AGENT_NM: string;
  STORE_AMT: number;
  ONLINE_AMT: number;
  SUM_AMT: number;
  CUST_CNT: number;
}

/**
 * 일일매출현황 조회 응답
 */
export interface DailySalesStatusResponse {
  success: boolean;
  message?: string;
  saleMonth?: string;
  items: DailySalesStatusItem[];
  agents: AgentInfo[];
  // 전체 합계 정보
  totalStoreAmt?: number;
  totalOnlineAmt?: number;
  totalSumAmt?: number;
  totalCustCnt?: number;
  // 전월 합계 정보
  prevMonthStoreAmt?: number;
  prevMonthOnlineAmt?: number;
  prevMonthSumAmt?: number;
  prevMonthCustCnt?: number;
  // 전년 합계 정보
  prevYearStoreAmt?: number;
  prevYearOnlineAmt?: number;
  prevYearSumAmt?: number;
  prevYearCustCnt?: number;
}

/**
 * 일일매출현황 목록 조회
 */
export const searchDailySalesStatus = async (
  params: DailySalesStatusSearchParams,
): Promise<DailySalesStatusResponse> => {
  try {
    const response = await apiClient.postJson<DailySalesStatusResponse>(
      '/api/sales-report/daily-sales-status/search',
      params,
    );
    return response;
  } catch (error: unknown) {
    console.error('일일매출현황 조회 실패:', error);
    throw error;
  }
};

/**
 * AGENT_DATA XML 문자열 파싱
 */
export const parseAgentData = (xmlString: string | null | undefined): AgentDayData[] => {
  if (!xmlString) return [];
  
  try {
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(xmlString, 'text/xml');
    const agents = xmlDoc.getElementsByTagName('AGENT');
    const result: AgentDayData[] = [];
    
    for (let i = 0; i < agents.length; i++) {
      const agent = agents[i];
      result.push({
        AGENT_ID: parseInt(agent.getElementsByTagName('AGENT_ID')[0]?.textContent || '0', 10),
        AGENT_NM: agent.getElementsByTagName('AGENT_NM')[0]?.textContent || '',
        STORE_AMT: parseInt(agent.getElementsByTagName('STORE_AMT')[0]?.textContent || '0', 10),
        ONLINE_AMT: parseInt(agent.getElementsByTagName('ONLINE_AMT')[0]?.textContent || '0', 10),
        SUM_AMT: parseInt(agent.getElementsByTagName('SUM_AMT')[0]?.textContent || '0', 10),
        CUST_CNT: parseInt(agent.getElementsByTagName('CUST_CNT')[0]?.textContent || '0', 10),
      });
    }
    
    return result;
  } catch (e) {
    console.error('XML 파싱 오류:', e);
    return [];
  }
};
