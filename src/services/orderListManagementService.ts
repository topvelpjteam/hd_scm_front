/**
 * 발주 리스트 관리 서비스
 * 발주 리스트 조회, 취소, 통계 등의 기능을 제공합니다.
 */

import { apiClient } from './apiClient';

// 발주 리스트 조회 파라미터 타입
export interface OrderListSearchParams {
  orderDateFrom?: string;
  orderDateTo?: string;
  requireDateFrom?: string;
  requireDateTo?: string;
  searchText?: string;
  unreceivedOnly?: boolean;
  agentId?: string;                    // 단일 매장 선택
  agentIds?: string[];                 // 다중 매장 선택
  vendorId?: string;                   // 단일 납품업체 선택
  vendorIds?: string[];                // 다중 납품업체 선택
  orderStatus?: string[];
  emailStatus?: string[];
  pageSize?: number;
  pageNum?: number;
  sortColumn?: string;
  sortDirection?: 'ASC' | 'DESC';
}

// 발주 리스트 아이템 타입
export interface OrderListItem {
  orderD: string;                    // 발주일자
  orderSequ: number;                 // 일련번호
  slipNo: string;                    // 전표번호
  agentId: string;                   // 거래처코드
  customerName: string;              // 거래처명
  requireD: string;                  // 입고요구일
  recvAddr: string;                  // 배송지주소
  recvTel: string;                   // 배송지전화번호
  recvPerson: string;                // 받는사람
  recvMemo: string;                  // 배송지메모
  userId: string;                    // 등록유저
  sysTime: string;                   // 등록일시
  updUser: string;                   // 수정유저
  updTime: string;                   // 수정일시
  ioId: string;                      // 발주구분
  ioNm: string;                      // 발주구분명
  orderCount: number;                // 발주상품수
  totalQty: number;                  // 총발주수량
  orderAmount: number;               // 총발주금액
  salesAmount: number;               // 총판매금액
  unreceivedYn: string;              // 미입고 여부
  orderStatus: string;               // 발주상태 (대기중, 진행중, 완료, 취소됨)
  cancelReason?: string;             // 취소사유
  cancelDate?: string;               // 취소일자
}

// 발주 취소 파라미터 타입
export interface OrderCancelParams {
  orderD: string;
  orderSequ: number;
  cancelReason: string;
  cancelDetail?: string;
  userId: string;
}

// 발주 취소 사유 타입
export interface CancelReason {
  code: string;
  name: string;
}

// 발주 통계 타입
export interface OrderStatistics {
  totalCount: number;                // 전체 발주 건수
  pendingCount: number;              // 대기중 건수
  inProgressCount: number;           // 진행중 건수
  completedCount: number;            // 완료 건수
  cancelledCount: number;            // 취소 건수
  totalAmount: number;               // 총 발주 금액
  averageAmount: number;             // 평균 발주 금액
  cancelRate: number;                // 취소율
}

// 페이지네이션 결과 타입
export interface OrderListResponse {
  orderList: OrderListItem[];
  totalCount: number;
  pageNum: number;
  pageSize: number;
  totalPages: number;
}

/**
 * 발주 리스트 조회 (USP_ZA_OrderListManagement - SEARCH 모드)
 */
export const getOrderList = async (params: OrderListSearchParams): Promise<OrderListResponse> => {
  try {
    const response = await apiClient.post('/api/order-list-management', {
      mode: 'SEARCH',
      ...params
    });
    const data = await response.json();
    console.log('🔍 [OrderListService] 발주 리스트 응답 데이터:', data);
    return data;
  } catch (error: any) {
    console.error('발주 리스트 조회 실패:', error);
    throw error;
  }
};

/**
 * 발주 상세 정보 조회 (USP_ZA_OrderListManagement - GET_DETAILS 모드)
 */
export const getOrderDetails = async (orderD: string, orderSequ: number, vendorId?: string): Promise<any> => {
  try {
    const response = await apiClient.post('/api/order-list-management', {
      MODE: 'GET_DETAILS',
      ORDER_D: orderD,
      ORDER_SEQU: orderSequ,
      VENDOR_ID: vendorId
    });
    return await response.json();
  } catch (error) {
    console.error('발주 상세 정보 조회 실패:', error);
    throw error;
  }
};

/**
 * 발주 취소
 */
export const cancelOrder = async (params: OrderCancelParams): Promise<{ success: boolean; message: string }> => {
  try {
    const response = await apiClient.post('/api/order-list/cancel', params);
    return await response.json();
  } catch (error) {
    console.error('발주 취소 실패:', error);
    throw error;
  }
};

/**
 * 발주 취소 사유 목록 조회
 */
export const getCancelReasons = async (): Promise<CancelReason[]> => {
  try {
    const response = await apiClient.post('/api/order-list-management', {
      mode: 'GET_CANCEL_REASONS'
    });
    const data = await response.json();
    return data.cancelReasons || [];
  } catch (error: any) {
    console.error('취소 사유 목록 조회 실패:', error);
    throw error;
  }
};

/**
 * 발주 통계 조회 (USP_ZA_OrderListManagement - GET_STATISTICS 모드)
 */
export const getOrderStatistics = async (params: OrderListSearchParams): Promise<OrderStatistics> => {
  try {
    const response = await apiClient.post('/api/order-list-management', {
      mode: 'GET_STATISTICS',
      ...params
    });
    return await response.json();
  } catch (error: any) {
    console.error('발주 통계 조회 실패:', error);
    throw error;
  }
};

/**
 * 발주서 이메일 전송
 */
export const sendOrderEmail = async (orderD: string, orderSequ: number, vendorId?: string): Promise<{ success: boolean; message: string }> => {
  try {
    const response = await apiClient.post('/api/order-list/send-email', {
      orderD,
      orderSequ,
      vendorId
    });
    return await response.json();
  } catch (error) {
    console.error('발주서 이메일 전송 실패:', error);
    throw error;
  }
};

/**
 * 발주서 인쇄용 데이터 조회
 */
export const getOrderPrintData = async (orderD: string, orderSequ: number): Promise<any> => {
  try {
    const response = await apiClient.get(`/api/order-list/print/${orderD}/${orderSequ}`);
    return await response.json();
  } catch (error) {
    console.error('발주서 인쇄 데이터 조회 실패:', error);
    throw error;
  }
};

/**
 * 엑셀 다운로드
 */
export const downloadOrderListExcel = async (params: OrderListSearchParams): Promise<Blob> => {
  try {
    const response = await apiClient.post('/api/order-list/excel', params);
    return await response.blob();
  } catch (error) {
    console.error('엑셀 다운로드 실패:', error);
    throw error;
  }
};

/**
 * 발주 상태 일괄 변경
 */
export const updateOrderStatus = async (orderIds: string[], status: string, userId: string): Promise<{ success: boolean; message: string }> => {
  try {
    const response = await apiClient.post('/api/order-list/update-status', {
      orderIds,
      status,
      userId
    });
    return await response.json();
  } catch (error) {
    console.error('발주 상태 일괄 변경 실패:', error);
    throw error;
  }
};

/**
 * 발주 복사 (새 발주 생성)
 */
export const copyOrder = async (orderD: string, orderSequ: number, userId: string): Promise<{ success: boolean; message: string; newOrderD?: string; newOrderSequ?: number }> => {
  try {
    const response = await apiClient.post('/api/order-list/copy', {
      orderD,
      orderSequ,
      userId
    });
    return await response.json();
  } catch (error) {
    console.error('발주 복사 실패:', error);
    throw error;
  }
};

/**
 * 발주 이력 조회
 */
export const getOrderHistory = async (orderD: string, orderSequ: number): Promise<any[]> => {
  try {
    const response = await apiClient.get(`/api/order-list/history/${orderD}/${orderSequ}`);
    return await response.json();
  } catch (error) {
    console.error('발주 이력 조회 실패:', error);
    throw error;
  }
};

