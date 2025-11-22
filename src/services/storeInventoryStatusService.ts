import { apiClient } from './apiClient';

export interface StoreInventoryStatusSearchParams {
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
  BRAND_NM?: string;
  BRAND_ID?: string;
  EST_D?: string;
  FIRST_OUT_D?: string;
  LAST_OUT_D?: string;
  FIRST_IN_D?: string;
  LAST_IN_D?: string;
  TOTAL_ORDER_QTY: number;
  TOTAL_OUT_QTY?: number;
  TOTAL_IN_GOOD_QTY?: number;
  TOTAL_IN_BAD_QTY?: number;
  TOTAL_IN_QTY?: number;
  TOTAL_IN: number;
  PENDING_QTY: number;
  IN_PROGRESS_RATE?: number;
  IN_STATUS: string;
  RECEIVED_ITEM_COUNT?: number;
  TOTAL_ITEM_COUNT?: number;
  REQUIRE_D?: string;
  ORDER_SEND_YN?: string;
}

export interface StoreInventoryStatusResponse {
  success: boolean;
  items: StoreInventoryStatusItem[];
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
  BRAND_NM?: string;
  ORDER_QTY: number;
  OUT_QTY: number;
  IN_GOOD_QTY: number;
  IN_BAD_QTY: number;
  IN_TOT_QTY: number;
  OUT_D?: string;
  IN_D?: string;
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
    const response = await apiClient.postJson<StoreInventoryStatusDetailResponse>(
      '/api/inventory/store-inbound/status/detail',
      {
        orderDate: params.orderDate,
        orderSequ: params.orderSequ,
        vendorId: params.vendorId,
      },
    );
    return response;
  } catch (error: any) {
    console.error('입고 현황 상세 조회 실패:', error);
    throw error;
  }
};
