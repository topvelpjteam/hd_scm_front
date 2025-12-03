import { apiClient } from './apiClient';

/**
 * 입출고 현황 검색 파라미터
 * 백엔드 InOutStatusRequest와 매핑
 */
export interface InOutStatusSearchParams {
  // 발주일자 범위 (YYYY-MM-DD)
  dateFrom?: string;
  dateTo?: string;
  // 입출고 상태 유형 ('전체', '출고', '입고')
  statusType?: string[];
  // 검색어 (발주번호, 매장명, 납품업체명)
  searchText?: string;
  // 필터
  agentIds?: string[];
  vendorIds?: string[];
  brandIds?: string[];
  // 페이징
  pageNum?: number;
  pageSize?: number;
  // 사용자 정보 (권한 체크용)
  userRoleId?: number;
  userAgentId?: string;
}

/**
 * 입출고 현황 목록 항목
 */
export interface InOutStatusItem {
  ORDER_D: string;
  ORDER_SEQU: number;
  SLIP_NO?: string;
  AGENT_ID: number;
  AGENT_NM: string;
  AGENT_TEL?: string;
  VENDOR_ID?: number;
  VENDOR_NM?: string;
  VENDOR_TEL?: string;
  BRAND_NM?: string;
  BRAND_ID?: string;
  IO_TYPE: string;            // '입고' | '출고'
  OUT_D?: string;             // FIRST_OUT_D or LAST_OUT_D
  IN_D?: string;              // FIRST_IN_D or LAST_IN_D
  // 저장프로시저 실제 필드명
  TOTAL_ORDER_QTY?: number;   // 총 발주수량
  TOTAL_OUT_QTY?: number;     // 총 출고수량
  TOTAL_IN_QTY?: number;      // 총 입고수량
  PENDING_QTY?: number;       // 미처리 수량
  IN_STATUS?: string;         // '입고대기' | '부분입고' | '입고완료'
  PROGRESS_RATE?: number;     // 입고 진행률 % (저장프로시저 반환 필드명)
  // 레거시 필드 (deprecated, 호환성 유지)
  TOTAL_QTY?: number;
  OUT_QTY?: number;
  IN_QTY?: number;
  STATUS?: string;
  MEMO?: string;
  USER_ID?: string;
  SYS_TIME?: string;
}

/**
 * 입출고 현황 목록 응답
 */
export interface InOutStatusResponse {
  success: boolean;
  items: InOutStatusItem[];
  totalCount: number;
  totalPages: number;
  pageNum: number;
  pageSize: number;
  message?: string;
}

/**
 * 입출고 현황 상세 항목
 * USP_ZA_inOutStatus DETAIL 모드 반환 필드
 */
export interface InOutStatusDetailItem {
  ORDER_D: string;
  ORDER_SEQU: number;
  ORDER_NO: number;
  GOODS_ID?: string;
  GOODS_NM?: string;
  BRAND_ID?: string;
  BRAND_NM?: string;
  ORDER_QTY: number;
  OUT_QTY?: number;
  OUT_D?: string;
  IN_QTY?: number;
  IN_D?: string;
  SOBIJA_DAN?: number;    // 소비자단가
  SOBIJA_TOT?: number;    // 소비자합계
  IN_MEMO?: string;       // 입고 메모
}

/**
 * 입출고 현황 상세 응답
 */
export interface InOutStatusDetailResponse {
  success: boolean;
  items: InOutStatusDetailItem[];
  message?: string;
}

/**
 * 입출고 현황 검색
 * 새로운 엔드포인트: /api/inout-status/search
 */
export const searchInOutStatus = async (
  params: InOutStatusSearchParams,
): Promise<InOutStatusResponse> => {
  try {
    const response = await apiClient.postJson<InOutStatusResponse>(
      '/api/inout-status/search',
      params,
    );
    return response;
  } catch (error: any) {
    console.error('입출고 현황 조회 실패:', error);
    throw error;
  }
};

/**
 * 입출고 현황 상세 조회
 * 새로운 엔드포인트: /api/inout-status/detail
 */
export const fetchInOutStatusDetails = async (params: {
  orderDate: string;
  orderSequ: number | string;
  vendorId: number | string;
}): Promise<InOutStatusDetailResponse> => {
  try {
    const response = await apiClient.postJson<InOutStatusDetailResponse>(
      '/api/inout-status/detail',
      {
        orderDate: params.orderDate,
        orderSequ: String(params.orderSequ),
        vendorId: String(params.vendorId),
      },
    );
    return response;
  } catch (error: any) {
    console.error('입출고 현황 상세 조회 실패:', error);
    throw error;
  }
};
