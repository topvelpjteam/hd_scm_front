import { apiClient } from './apiClient';

export interface OrderOutStatusSearchParams {
  orderDateFrom?: string;
  orderDateTo?: string;
  requireDateFrom?: string;
  requireDateTo?: string;
  searchText?: string;
  unreceivedOnly?: boolean;
  agentId?: string;
  agentIds?: string[];
  vendorId?: string;
  vendorIds?: string[];
  orderStatus?: string[];
  pageNum?: number;
  pageSize?: number;
  userRoleId?: number;
  userAgentId?: string;
}

export interface OrderOutStatusItem {
  ORDER_D: string;
  ORDER_SEQU: number;
  SLIP_NO: string;
  AGENT_ID: number;
  STORE_NM: string;
  STORE_TEL?: string;
  STORE_ADDR?: string;
  VENDOR_ID: number;
  VENDOR_NM: string;
  VENDOR_TEL?: string;
  VENDOR_ADDR?: string;
  FIRST_OUT_D?: string;
  LAST_OUT_D?: string;
  TOTAL_ORDER_QTY: number;
  TOTAL_OUT_QTY: number;
  ITEM_COUNT: number;
  UN_SHIPPED_ITEM_COUNT: number;
  OUT_STATUS: string;
  OUT_PROGRESS_RATE: number;
}

export interface OrderOutStatusResponse {
  success: boolean;
  items: OrderOutStatusItem[];
  totalCount: number;
  totalPages: number;
  pageNum: number;
  pageSize: number;
  message?: string;
}

export interface OrderOutStatusDetailItem {
  ORDER_D: string;
  ORDER_SEQU: number;
  ORDER_NO: number;
  VENDOR_ID: number;
  VENDOR_NM?: string;
  GOODS_ID?: string;
  GOODS_ID_BRAND?: string;
  GOODS_NM?: string;
  BRAND_ID?: string;
  BRAND_NM?: string;
  ORDER_QTY: number;
  OUT_QTY: number;
  IN_TOT_QTY: number;
  ORDER_DAN?: number;
  ORDER_TOT?: number;
  OUT_D?: string;
  IN_D?: string;
}

export interface OrderOutStatusDetailResponse {
  success: boolean;
  items: OrderOutStatusDetailItem[];
  message?: string;
}

/**
 * 출고 현황 조회 서비스
 */
export const searchOrderOutStatus = async (
  params: OrderOutStatusSearchParams
): Promise<OrderOutStatusResponse> => {
  try {
    const response = await apiClient.postJson<OrderOutStatusResponse>(
      '/api/order-out-status/search',
      params
    );
    return response;
  } catch (error: any) {
    console.error('출고 현황 조회 실패:', error);
    throw error;
  }
};

/**
 * 출고 현황 상세 품목 조회
 */
export const fetchOrderOutStatusDetails = async (params: {
  orderDate: string;
  orderSequ: number | string;
  vendorId?: number | string;
}): Promise<OrderOutStatusDetailResponse> => {
  try {
    const response = await apiClient.postJson<OrderOutStatusDetailResponse>(
      '/api/order-out-status/detail',
      {
        orderDate: params.orderDate,
        orderSequ: params.orderSequ,
        vendorId: params.vendorId,
      }
    );
    return response;
  } catch (error: any) {
    console.error('출고 현황 상세 조회 실패:', error);
    throw error;
  }
};

