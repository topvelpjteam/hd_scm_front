import { apiClient } from './apiClient';

/**
 * 입출고 현황 검색 파라미터
 */
export interface InOutStatusSearchParams {
  dateFrom?: string;
  dateTo?: string;
  searchText?: string;
  statusType?: string[];      // '입고', '출고', '전체'
  agentIds?: string[];
  vendorIds?: string[];
  brandIds?: string[];
  pageNum?: number;
  pageSize?: number;
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
  OUT_D?: string;
  IN_D?: string;
  TOTAL_QTY: number;
  OUT_QTY?: number;
  IN_QTY?: number;
  STATUS: string;
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
 */
export interface InOutStatusDetailItem {
  ORDER_D: string;
  ORDER_SEQU: number;
  ORDER_NO: number;
  GOODS_ID?: string;
  GOODS_NM?: string;
  BRAND_NM?: string;
  ORDER_QTY: number;
  OUT_QTY?: number;
  OUT_D?: string;
  IN_QTY?: number;
  IN_D?: string;
  MEMO?: string;
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
 */
export const searchInOutStatus = async (
  params: InOutStatusSearchParams,
): Promise<InOutStatusResponse> => {
  try {
    const response = await apiClient.postJson<InOutStatusResponse>(
      '/api/inventory/store-inbound/status/search',
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
 */
export const fetchInOutStatusDetails = async (params: {
  orderDate: string;
  orderSequ: number | string;
}): Promise<InOutStatusDetailResponse> => {
  try {
    const response = await apiClient.postJson<InOutStatusDetailResponse>(
      '/api/inventory/store-inbound/status/detail',
      {
        orderDate: params.orderDate,
        orderSequ: params.orderSequ,
      },
    );
    return response;
  } catch (error: any) {
    console.error('입출고 현황 상세 조회 실패:', error);
    throw error;
  }
};
