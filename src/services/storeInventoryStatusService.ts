import { apiClient } from './apiClient';

export interface StoreInventoryStatusSearchParams {
  mode?: 'SEARCH' | 'RAW';
  inboundDateFrom?: string;
  inboundDateTo?: string;
  outboundDateFrom?: string;
  outboundDateTo?: string;
  searchText?: string;
  pendingOnly?: boolean;
  agentIds?: string[];
  vendorIds?: string[];
  brandIds?: string[];
  inboundStatus?: string[];
  pageNum?: number;
  pageSize?: number;
  userRoleId?: number;
  userAgentId?: string;
}

// RAW 모드 개별 행 인터페이스
export interface StoreInventoryStatusRawItem {
  ORDER_D: string;
  ORDER_SEQU: number;
  SLIP_NO: string;
  ORDER_NO: number;
  AGENT_ID: number;
  AGENT_NM: string;
  AGENT_TEL?: string;
  VENDOR_ID?: number;
  VENDOR_NM?: string;
  VENDOR_TEL?: string;
  GOODS_ID?: string;
  GOODS_ID_BRAND?: string;
  GOODS_NM?: string;
  GOODS_GBN?: string;
  GOODS_GBN_NM?: string;
  BRAND_ID?: string;
  BRAND_NM?: string;
  REQUIRE_D?: string;
  ORDER_SEND_YN?: string;
  EST_D?: string;
  OUT_D?: string;
  IN_D?: string;
  ORDER_QTY: number;
  OUT_QTY: number;
  IN_GOOD_QTY: number;
  IN_BAD_QTY: number;
  IN_TOT_QTY: number;
  PENDING_QTY: number;
  IN_PROGRESS_RATE: number;
  IN_STATUS: string;
}

export interface StoreInventoryStatusItem {
  ORDER_D: string;
  ORDER_SEQU: number;
  SLIP_NO?: string;
  AGENT_ID: number;
  AGENT_NM: string;
  AGENT_TEL?: string;
  VENDOR_ID?: number;
  VENDOR_NM?: string;
  VENDOR_TEL?: string;
  BRAND_ID?: string;
  BRAND_NM?: string;
  EST_D?: string;
  FIRST_OUT_D?: string;
  LAST_OUT_D?: string;
  FIRST_IN_D?: string;
  LAST_IN_D?: string;
  REQUIRE_D?: string;
  ORDER_SEND_YN?: string;
  TOTAL_ORDER_QTY: number;
  TOTAL_OUT_QTY?: number;
  TOTAL_IN_GOOD_QTY?: number;
  TOTAL_IN_BAD_QTY?: number;
  TOTAL_IN_QTY?: number;
  TOTAL_IN?: number;
  PENDING_QTY: number;
  IN_PROGRESS_RATE?: number;
  IN_STATUS: string;
}

export interface StoreInventoryStatusResponse {
  success: boolean;
  items: (StoreInventoryStatusItem | StoreInventoryStatusRawItem)[];
  totalCount: number;
  totalPages: number;
  pageNum: number;
  pageSize: number;
  message?: string;
}

export interface StoreInventoryStatusDetailItem {
  ORDER_D: string;
  ORDER_SEQU: number;
  ORDER_NO: number;
  GOODS_ID?: string;
  GOODS_ID_BRAND?: string;
  GOODS_NM?: string;
  GOODS_GBN_NM?: string;
  BRAND_ID?: string;
  BRAND_NM?: string;
  VENDOR_ID?: number;
  VENDOR_NM?: string;
  ORDER_QTY: number;
  OUT_QTY: number;
  IN_GOOD_QTY: number;
  IN_BAD_QTY: number;
  IN_TOT_QTY: number;
  OUT_D?: string;
  IN_D?: string;
  EST_D?: string;
  IN_STATUS?: string;
  RECEIVED_QTY?: number;
  UN_RECEIVED_QTY?: number;
  IN_MEMO?: string;
  IN_BAD_MEMO?: string;
  IN_USER?: string;
  IN_TIME?: string;
}

export interface StoreInventoryStatusDetailResponse {
  success: boolean;
  items: StoreInventoryStatusDetailItem[];
  message?: string;
}

/**
 * 입고 현황 목록 조회
 */
export const searchStoreInventoryStatus = async (
  params: StoreInventoryStatusSearchParams,
): Promise<StoreInventoryStatusResponse> => {
  try {
    const response = await apiClient.postJson<StoreInventoryStatusResponse>(
      '/api/inventory/store-inbound/status/search',
      params,
    );
    return response;
  } catch (error: any) {
    console.error('입고 현황 조회 실패:', error);
    throw error;
  }
};

/**
 * 입고 현황 상세 품목 조회
 */
export const fetchStoreInventoryStatusDetails = async (params: {
  orderDate: string;
  orderSequ: number | string;
  vendorId?: number | string;
}): Promise<StoreInventoryStatusDetailResponse> => {
  try {
    const payload: any = {
      mode: 'DETAIL',
      orderDate: params.orderDate,
      orderSequ: String(params.orderSequ),
    };
    
    // 공급업체 ID가 있으면 추가 (선택적 필터)
    if (params.vendorId !== undefined && params.vendorId !== null) {
      payload.vendorId = String(params.vendorId);
    }
    
    const response = await apiClient.postJson<StoreInventoryStatusDetailResponse>(
      '/api/inventory/store-inbound/status/detail',
      payload,
    );
    return response;
  } catch (error: any) {
    console.error('입고 현황 상세 조회 실패:', error);
    throw error;
  }
};
