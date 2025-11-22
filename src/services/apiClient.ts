/**
 * API 클라이언트 - 자동 로딩 시스템
 * 모든 API 요청을 자동으로 감지하여 로딩 상태를 관리
 */

import { useGlobalLoading } from '../contexts/LoadingContext';

// 로딩 카운터 - 동시 요청 수를 추적
let loadingCount = 0;
let loadingContext: ReturnType<typeof useGlobalLoading> | null = null;

// 로딩 지연 타이머
let loadingTimer: NodeJS.Timeout | null = null;
const LOADING_DELAY = 2000; // 2초 후 로딩 표시

/**
 * 로딩 컨텍스트 설정 (앱 초기화 시 호출)
 */
export const setLoadingContext = (context: ReturnType<typeof useGlobalLoading>) => {
  loadingContext = context;
};

/**
 * 로딩 시작 (2초 지연)
 */
const startLoading = (message: string = '데이터를 불러오는 중...') => {
  if (loadingCount === 0 && loadingContext) {
    // 2초 후에 로딩 표시
    loadingTimer = setTimeout(() => {
      if (loadingCount > 0 && loadingContext) {
        loadingContext.startLoading(message);
      }
    }, LOADING_DELAY);
  }
  loadingCount++;
};

/**
 * 로딩 종료
 */
const stopLoading = () => {
  loadingCount = Math.max(0, loadingCount - 1);
  
  // 타이머가 있다면 취소
  if (loadingTimer) {
    clearTimeout(loadingTimer);
    loadingTimer = null;
  }
  
  // 로딩이 표시되어 있다면 종료
  if (loadingCount === 0 && loadingContext) {
    loadingContext.stopLoading();
  }
};

/**
 * API 요청 타입 정의
 */
interface ApiRequestOptions extends RequestInit {
  skipLoading?: boolean; // 로딩을 건너뛸지 여부
  loadingMessage?: string; // 커스텀 로딩 메시지
}

/**
 * 향상된 fetch 함수 - 자동 로딩 관리
 */
export const apiClient = {
  /**
   * GET 요청
   */
  async get(url: string, options: ApiRequestOptions = {}): Promise<Response> {
    return this.request(url, { ...options, method: 'GET' });
  },

  /**
   * POST 요청 (Response 객체 반환)
   */
  async post(url: string, data?: any, options: ApiRequestOptions = {}): Promise<Response> {
    return this.request(url, {
      ...options,
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });
  },

  /**
   * PUT 요청
   */
  async put(url: string, data?: any, options: ApiRequestOptions = {}): Promise<Response> {
    return this.request(url, {
      ...options,
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });
  },

  /**
   * DELETE 요청
   */
  async delete(url: string, options: ApiRequestOptions = {}): Promise<Response> {
    return this.request(url, { ...options, method: 'DELETE' });
  },

  /**
   * 기본 요청 메서드
   */
  async request(url: string, options: ApiRequestOptions = {}): Promise<Response> {
    const { skipLoading = false, loadingMessage, ...fetchOptions } = options;

    // 로딩 시작 (건너뛰기 옵션이 없을 때만)
    if (!skipLoading) {
      startLoading(loadingMessage);
    }

    try {
      console.log(`🌐 [API Client] 요청 시작: ${fetchOptions.method || 'GET'} ${url}`);
      
      const response = await fetch(url, fetchOptions);
      
      console.log(`📡 [API Client] 응답 완료: ${response.status} ${response.statusText} - ${url}`);
      
      // 404 오류인 경우 특별 처리
      if (response.status === 404) {
        const error = new Error(`API 엔드포인트를 찾을 수 없습니다: ${url}`);
        (error as any).status = 404;
        throw error;
      }
      
      return response;
    } catch (error) {
      console.error(`❌ [API Client] 요청 실패: ${url}`, error);
      throw error;
    } finally {
      // 로딩 종료 (건너뛰기 옵션이 없을 때만)
      if (!skipLoading) {
        stopLoading();
      }
    }
  },

  /**
   * JSON 응답을 자동으로 파싱하는 GET 요청
   */
  async getJson<T>(url: string, options: ApiRequestOptions = {}): Promise<T> {
    const response = await this.get(url, options);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    return response.json();
  },

  /**
   * JSON 응답을 자동으로 파싱하는 POST 요청
   */
  async postJson<T>(url: string, data?: any, options: ApiRequestOptions = {}): Promise<T> {
    const response = await this.post(url, data, options);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    return response.json();
  },

  /**
   * JSON 응답을 자동으로 파싱하는 PUT 요청
   */
  async putJson<T>(url: string, data?: any, options: ApiRequestOptions = {}): Promise<T> {
    const response = await this.put(url, data, options);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    return response.json();
  },

  /**
   * JSON 응답을 자동으로 파싱하는 DELETE 요청
   */
  async deleteJson<T>(url: string, options: ApiRequestOptions = {}): Promise<T> {
    const response = await this.delete(url, options);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    return response.json();
  }
};

/**
 * 기존 fetch를 대체하는 래퍼 함수
 * 기존 코드를 최소한으로 수정하면서 자동 로딩 적용
 */
export const fetchWithLoading = (url: string, options: ApiRequestOptions = {}): Promise<Response> => {
  return apiClient.request(url, options);
};

export default apiClient;
