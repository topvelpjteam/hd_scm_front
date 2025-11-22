// 거래처 서비스
import { apiClient } from './apiClient';

export interface AgentData {
  AGENT_ID?: number;
  AGENT_NM: string;
  AGENT_ENG_NM?: string;
  SHORT_NM?: string;
  AGENT_GBN: string;
  CHANN_GBN: string;
  AGENT_CEO?: string;
  AGENT_BNO?: string;
  AGENT_TEL?: string;
  AGENT_FAX?: string;
  ZIP_ID?: string;
  AGENT_ADDR1?: string;
  AGENT_ADDR2?: string;
  AGENT_YUP?: string;
  AGENT_JONG?: string;
  TRADE_LIM?: number;
  SALE_RATE?: number;
  ROUND_GBN?: string;
  UPDN_CNT?: number;
  BANK_ID?: string;
  ACCOUNT_NO?: string;
  ACCOUNT_OWNER?: string;
  DEPT_ID?: string;
  PERSON_ID?: string;
  TRADE_MEMO?: string;
  AGENT_EMAIL?: string;
  PAYMENT_TERM?: number;
  VAT_TYPE?: string;
  TAX_EMAIL1?: string;
  TAX_DAMDANG1?: string;
  TAX_EMAIL2?: string;
  TAX_DAMDANG2?: string;
  BRAND_ID_LIST?: string;
  OPEN_D?: string;
  CLOSE_D?: string;
}

export interface SearchCondition {
  agentNm?: string;           // @SEARCH_AGENT_NM
  agentGbn?: string;          // @SEARCH_AGENT_GBN (콤마로 구분된 문자열)
  channGbn?: string;          // @SEARCH_CHANN_GBN (콤마로 구분된 문자열)
  excludeTerminated?: boolean; // @SEARCH_EXPIRE_YN
  userId?: string;             // @SEARCH_USER_ID
}

export interface ApiResponse<T> {
  SUCCESS: boolean;
  MESSAGE: string;
  DATA?: T;
  ERROR?: string;
}

class AgentService {
  private baseUrl = 'http://localhost:8080/api/agents';

  /**
   * 거래처 검색 (자동 로딩 적용)
   * @param searchCondition 검색 조건
   * @returns 거래처 목록
   */
  async searchAgents(searchCondition: SearchCondition): Promise<AgentData[]> {
    try {
      const data = await apiClient.postJson<AgentData[]>(
        `${this.baseUrl}/search`,
        searchCondition,
        { loadingMessage: '거래처를 검색하는 중...' }
      );
      
      console.log('🔍 검색 결과 전체:', data);
      
      // 날짜 필드 확인
      if (data && data.length > 0) {
        console.log('🔍 첫 번째 검색 결과의 모든 필드:', Object.keys(data[0]));
        console.log('🔍 첫 번째 검색 결과의 날짜 관련 필드:', {
          OPEN_D: data[0].OPEN_D,
          CLOSE_D: data[0].CLOSE_D
        });
      }
      
      return data;
    } catch (error) {
      console.error('거래처 검색 오류:', error);
      throw new Error('거래처 검색에 실패했습니다.');
    }
  }

  /**
   * 거래처 상세 정보 조회
   * @param agentId 거래처 ID
   * @param excludeTerminated 종료 거래처 제외 여부 (기본값: false - 종료된 거래처도 조회)
   * @returns 거래처 상세 정보
   */
  async getAgentDetail(agentId: string, excludeTerminated: boolean = false): Promise<AgentData> {
    try {
      const url = `${this.baseUrl}/${agentId}?excludeTerminated=${excludeTerminated}`;
      console.log('🔍 거래처 상세 조회 요청:', { agentId, excludeTerminated, url });
      
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log('🔍 거래처 상세 조회 응답:', data);
      return data;
    } catch (error) {
      console.error('거래처 상세 조회 오류:', error);
      throw new Error('거래처 상세 조회에 실패했습니다.');
    }
  }

  /**
   * 거래처 저장 (신규 등록 또는 수정)
   * @param agentData 거래처 데이터
   * @returns 저장 결과
   */
  async saveAgent(agentData: AgentData): Promise<ApiResponse<AgentData>> {
    try {
      const response = await fetch(`${this.baseUrl}/save`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(agentData),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      return result;
    } catch (error) {
      console.error('거래처 저장 오류:', error);
      throw new Error('거래처 저장에 실패했습니다.');
    }
  }

  /**
   * 거래처 삭제
   * @param agentId 거래처 ID
   * @param userId 사용자 ID
   * @returns 삭제 결과
   */
  async deleteAgent(agentId: string, userId: string): Promise<{ SUCCESS: boolean; MESSAGE: string }> {
    try {
      console.log('🗑️ 거래처 삭제 요청:', { agentId, userId });
      
      const response = await fetch(`${this.baseUrl}/${agentId}?userId=${userId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      console.log('🗑️ 삭제 응답 상태:', response.status);

      // 응답이 JSON 형태인지 확인
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        // JSON이 아닌 경우 빈 응답으로 처리 (삭제 성공으로 간주)
        if (response.ok) {
          console.log('🗑️ 삭제 성공 (JSON 응답 없음)');
          return { SUCCESS: true, MESSAGE: '거래처가 성공적으로 삭제되었습니다.' };
        } else {
          throw new Error(`서버에서 JSON 응답을 받지 못했습니다. Content-Type: ${contentType}`);
        }
      }

      const result = await response.json();
      console.log('🗑️ 삭제 응답 데이터:', result);

      // 서버에서 에러 응답을 보낸 경우 (HTTP 500 등)
      if (!response.ok) {
        const errorMessage = result.message || result.MESSAGE || `HTTP error! status: ${response.status}`;
        const error = new Error(errorMessage);
        (error as any).serverError = result;
        throw error;
      }

      return result;
    } catch (error) {
      console.error('❌ 거래처 삭제 실패:', error);
      
      // 서버 에러 정보가 있으면 그대로 전달
      if ((error as any).serverError) {
        throw error;
      }
      
      // 네트워크 에러 등의 경우
      throw new Error(`거래처 삭제에 실패했습니다: ${error instanceof Error ? error.message : '알 수 없는 오류'}`);
    }
  }
}

export const agentService = new AgentService();
