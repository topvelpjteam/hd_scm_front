import { store } from '../store';
import { apiClient } from './apiClient';

const API_BASE_URL = 'http://localhost:8080/api';

// 이전발주정보 조회 파라미터 인터페이스
export interface PreviousOrderSearchParams {
  mode: string;
  orderDateFrom?: string | null;
  orderDateTo?: string | null;
  shipmentRequestDateFrom?: string | null;
  shipmentRequestDateTo?: string | null;
  searchTerm?: string | null;
  unreceivedOnly?: string;
  agentId?: string | null;
}

// 이전발주정보 응답 인터페이스
export interface PreviousOrderItem {
  orderDate: string;
  warehouse: string;
  slip: string;
  customerName: string;
  category: string;
  orderQuantity: number;
  salesAmount: number;
  orderAmount: number;
}

// 이전발주정보 조회 응답 인터페이스
export interface PreviousOrderResponse {
  success: boolean;
  data: PreviousOrderItem[];
  message?: string;
}

// 이전발주정보 조회 (자동 로딩 적용)
export const getPreviousOrders = async (params: PreviousOrderSearchParams): Promise<PreviousOrderResponse> => {
  try {
    console.log('📤 [OrderService] 이전발주정보 조회 요청:', params);
    
    const data = await apiClient.postJson<PreviousOrderResponse>(
      `${API_BASE_URL}/orders/previous`, 
      params,
      { loadingMessage: '이전발주정보를 조회하는 중...' }
    );
    
    console.log('📥 [OrderService] 이전발주정보 조회 응답:', data);
    return data;
  } catch (error) {
    console.error('❌ [OrderService] 이전발주정보 조회 실패:', error);
    throw error;
  }
};

// 발주 마스터 저장
export const saveOrderMaster = async (params: any): Promise<any> => {
  try {
    console.log('📤 [OrderService] 발주 마스터 저장 요청:', params);
    
    const response = await fetch(`${API_BASE_URL}/orders/master`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(params),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    console.log('📥 [OrderService] 발주 마스터 저장 응답:', data);
    
    return data;
  } catch (error) {
    console.error('❌ [OrderService] 발주 마스터 저장 실패:', error);
    throw error;
  }
};

// 발주 상세 저장
export const saveOrderDetail = async (params: any): Promise<any> => {
  try {
    console.log('📤 [OrderService] 발주 상세 저장 요청:', params);
    
    const response = await fetch(`${API_BASE_URL}/orders/detail`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(params),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    console.log('📥 [OrderService] 발주 상세 저장 응답:', data);
    
    return data;
  } catch (error) {
    console.error('❌ [OrderService] 발주 상세 저장 실패:', error);
    throw error;
  }
};

// 발주 상세 조회 (자동 로딩 적용)
export const getOrderDetails = async (orderId: string): Promise<any> => {
  try {
    console.log('📤 [OrderService] 발주 상세 조회 요청:', orderId);
    
    // 로그인한 사용자 ID 가져오기 (Redux store에서)
    const state = store.getState();
    const userId = state.auth.user?.userId || '';
    
    console.log('👤 [OrderService] 로그인 사용자 ID:', userId);
    
    const data = await apiClient.getJson(
      `${API_BASE_URL}/orders/${orderId}/details`,
      { 
        loadingMessage: '발주 상세 정보를 불러오는 중...',
        headers: {
          'X-User-Id': String(userId), // 로그인한 사용자 ID를 헤더에 포함
        }
      }
    );
    
    console.log('📥 [OrderService] 발주 상세 조회 응답:', data);
    return data;
  } catch (error) {
    console.error('❌ [OrderService] 발주 상세 조회 실패:', error);
    throw error;
  }
};

// 발주 삭제
export const deleteOrder = async (orderId: string): Promise<any> => {
  try {
    console.log('📤 [OrderService] 발주 삭제 요청:', orderId);
    
    const response = await fetch(`${API_BASE_URL}/orders/${orderId}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    console.log('📥 [OrderService] 발주 삭제 응답:', data);
    
    return data;
  } catch (error) {
    console.error('❌ [OrderService] 발주 삭제 실패:', error);
    throw error;
  }
};

// 거래처 목록 조회
export const getAgents = async (): Promise<any> => {
  try {
    console.log('📤 [OrderService] 거래처 목록 조회 요청');
    
    const response = await fetch(`${API_BASE_URL}/orders/agents`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    console.log('📥 [OrderService] 거래처 목록 조회 응답:', data);
    
    return data;
  } catch (error) {
    console.error('❌ [OrderService] 거래처 목록 조회 실패:', error);
    throw error;
  }
};

// OrderService 클래스로 모든 메서드들을 그룹화 (다른 서비스들과 동일한 패턴)
export class OrderService {
  static async getPreviousOrders(params: PreviousOrderSearchParams) {
    return getPreviousOrders(params);
  }

  static async getOrderDetails(orderId: string) {
    return getOrderDetails(orderId);
  }

  static async deleteOrder(orderId: string) {
    return deleteOrder(orderId);
  }

  static async getAgents() {
    return getAgents();
  }

  // 발주 마스터 저장
  static async saveOrderMaster(params: any) {
    try {
      console.log('💾 [OrderService] 발주 마스터 저장 요청:', params);
      
      const response = await fetch('/api/orders/master', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(params),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      console.log('✅ [OrderService] 발주 마스터 저장 완료:', result);
      return result;
    } catch (error) {
      console.error('❌ [OrderService] 발주 마스터 저장 실패:', error);
      throw error;
    }
  }

  // 발주 마스터 수정
  static async updateOrderMaster(params: any) {
    try {
      console.log('✏️ [OrderService] 발주 마스터 수정 요청:', params);
      
      const response = await fetch('/api/orders/master', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(params),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      console.log('✅ [OrderService] 발주 마스터 수정 완료:', result);
      return result;
    } catch (error) {
      console.error('❌ [OrderService] 발주 마스터 수정 실패:', error);
      throw error;
    }
  }

  // 발주 상세 저장
  static async saveOrderDetail(params: any) {
    try {
      console.log('💾 [OrderService] 발주 상세 저장 요청:', params);
      
      const response = await fetch('/api/orders/detail', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(params),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      console.log('✅ [OrderService] 발주 상세 저장 완료:', result);
      return result;
    } catch (error) {
      console.error('❌ [OrderService] 발주 상세 저장 실패:', error);
      throw error;
    }
  }

  // 발주 상세 수정
  static async updateOrderDetail(params: any) {
    try {
      console.log('✏️ [OrderService] 발주 상세 수정 요청:', params);
      
      const response = await fetch('/api/orders/detail', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(params),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      console.log('✅ [OrderService] 발주 상세 수정 완료:', result);
      return result;
    } catch (error) {
      console.error('❌ [OrderService] 발주 상세 수정 실패:', error);
      throw error;
    }
  }

  /**
   * 발주 상세 삭제
   */
  async deleteOrderDetail(orderD: string, orderSequ: string, orderNo: string, userId: string): Promise<any> {
    try {
      console.log('🗑️ [OrderService] 발주 상세 삭제 요청:', { orderD, orderSequ, orderNo, userId });

      const requestBody = {
        orderD,
        orderSequ,
        orderNo,
        userId
      };
      
      console.log('📤 [OrderService] 요청 본문:', requestBody);
      console.log('📤 [OrderService] API URL:', `${API_BASE_URL}/orders/detail`);

      const response = await fetch(`${API_BASE_URL}/orders/detail`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody)
      });

      console.log('📥 [OrderService] 응답 상태:', response.status, response.statusText);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ [OrderService] HTTP 오류 응답:', errorText);
        throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
      }

      const result = await response.json();
      console.log('✅ [OrderService] 발주 상세 삭제 완료:', result);
      return result;
    } catch (error) {
      console.error('❌ [OrderService] 발주 상세 삭제 실패:', error);
      throw error;
    }
  }

  /**
   * 발주 마스터 삭제
   */
  async deleteOrderMaster(orderD: string, orderSequ: string, userId: string): Promise<any> {
    try {
      console.log('🗑️ [OrderService] 발주 마스터 삭제 요청:', { orderD, orderSequ, userId });

      const response = await fetch(`${API_BASE_URL}/orders/master`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          orderD,
          orderSequ,
          userId
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      console.log('✅ [OrderService] 발주 마스터 삭제 완료:', result);
      return result;
    } catch (error) {
      console.error('❌ [OrderService] 발주 마스터 삭제 실패:', error);
      throw error;
    }
  }
}

export const orderService = new OrderService();
