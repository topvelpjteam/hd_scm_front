/**
 * 거래 내역(Trade Status) 서비스 (OrderListManagement를 기반으로 복사)
 * 프론트엔드 전용 서비스로 기존 백엔드 API를 그대로 사용합니다.
 */

import { apiClient } from './apiClient';

export interface TradeListSearchParams {
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
  emailStatus?: string[];
  pageSize?: number;
  pageNum?: number;
  sortColumn?: string;
  sortDirection?: 'ASC' | 'DESC';
}

export interface TradeListItem {
  orderD: string;
  orderSequ: number;
  slipNo: string;
  agentId: string;
  customerName: string;
  requireD: string;
  recvAddr: string;
  recvTel: string;
  recvPerson: string;
  recvMemo: string;
  userId: string;
  sysTime: string;
  updUser: string;
  updTime: string;
  ioId: string;
  ioNm: string;
  orderCount: number;
  totalQty: number;
  orderAmount: number;
  salesAmount: number;
  unreceivedYn: string;
  orderStatus: string;
  cancelReason?: string;
  cancelDate?: string;
}

export interface TradeListResponse {
  orderList: TradeListItem[];
  totalCount: number;
  pageNum: number;
  pageSize: number;
  totalPages: number;
}

export const getTradeList = async (params: TradeListSearchParams): Promise<TradeListResponse> => {
  try {
    const response = await apiClient.post('/api/order-list-management', {
      mode: 'SEARCH',
      ...params
    });
    const data = await response.json();
    return data;
  } catch (error: any) {
    console.error('거래 리스트 조회 실패:', error);
    throw error;
  }
};

export const getTradeDetails = async (orderD: string, orderSequ: number, vendorId?: string): Promise<any> => {
  try {
    const response = await apiClient.post('/api/order-list-management', {
      MODE: 'GET_DETAILS',
      ORDER_D: orderD,
      ORDER_SEQU: orderSequ,
      VENDOR_ID: vendorId
    });
    return await response.json();
  } catch (error) {
    console.error('거래 상세 정보 조회 실패:', error);
    throw error;
  }
};

export const cancelTrade = async (params: { orderD: string; orderSequ: number; cancelReason: string; cancelDetail?: string; userId: string }) => {
  try {
    const response = await apiClient.post('/api/order-list/cancel', params);
    return await response.json();
  } catch (error) {
    console.error('거래 취소 실패:', error);
    throw error;
  }
};

export const getTradeCancelReasons = async (): Promise<any[]> => {
  try {
    const response = await apiClient.post('/api/order-list-management', {
      mode: 'GET_CANCEL_REASONS'
    });
    const data = await response.json();
    return data.cancelReasons || [];
  } catch (error: any) {
    console.error('거래 취소 사유 조회 실패:', error);
    throw error;
  }
};

export const getTradeStatistics = async (params: TradeListSearchParams): Promise<any> => {
  try {
    const response = await apiClient.post('/api/order-list-management', {
      mode: 'GET_STATISTICS',
      ...params
    });
    return await response.json();
  } catch (error: any) {
    console.error('거래 통계 조회 실패:', error);
    throw error;
  }
};

export const sendTradeEmail = async (orderD: string, orderSequ: number, vendorId?: string) => {
  try {
    const response = await apiClient.post('/api/order-list/send-email', {
      orderD,
      orderSequ,
      vendorId
    });
    return await response.json();
  } catch (error) {
    console.error('거래 이메일 전송 실패:', error);
    throw error;
  }
};

export const getTradePrintData = async (orderD: string, orderSequ: string) => {
  try {
    const response = await apiClient.get(`/api/order-list/print/${orderD}/${orderSequ}`);
    return await response.json();
  } catch (error) {
    console.error('거래 인쇄용 데이터 조회 실패:', error);
    throw error;
  }
};
