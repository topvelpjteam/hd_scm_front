import apiClient from './apiClient';
import type { CustomerData, SearchCondition } from '../store/custRegistrationSlice';

export interface CustomerSearchResult {
  CUST_ID: number;
  CUST_NM: string;
  CUST_GBN: string;
  CUST_GBN_NM: string;
  NATION_ID: string;
  C_HP: string;
  C_EMAIL: string;
  ZIP_ID: string;
  C_ADDR1: string;
  C_ADDR2: string;
  CUST_BIRTH_D: string;
  CUST_D_GBN: string;
  CUST_OPEN_D: string;
  CUST_HOBB: string;
  CUST_DATA: string;
  EMAIL_CHK: string;
  DM_CHK: string;
  SMS_CHK: string;
  CALL_CHK: string;
  GENDER_GBN: string;
  MNG_STAFF: string;
}

export interface CustomerSaveRequest {
  CUST_ID?: number;
  AGENT_ID?: number;
  CUST_NM: string;
  CUST_GBN: string;
  NATION_ID?: string;
  C_HP?: string;
  C_EMAIL?: string;
  ZIP_ID?: string;
  C_ADDR1?: string;
  C_ADDR2?: string;
  CUST_BIRTH_D?: string;
  CUST_D_GBN?: string;
  CUST_OPEN_D?: string;
  CUST_HOBB?: string;
  CUST_DATA?: string;
  EMAIL_CHK?: string;
  DM_CHK?: string;
  SMS_CHK?: string;
  CALL_CHK?: string;
  GENDER_GBN?: string;
  MNG_STAFF?: string;
  USER_ID: string;
}

export interface CustomerSaveResponse {
  success: boolean;
  message: string;
  custId?: number;
}

export interface CustomerDeleteResponse {
  success: boolean;
  message: string;
}

class CustomerService {
  /**
   * 고객 검색
   * @param searchCondition 검색 조건
   * @returns 고객 목록
   */
  async searchCustomers(searchCondition: SearchCondition): Promise<CustomerSearchResult[]> {
    try {
      const response = await apiClient.postJson<CustomerSearchResult[]>(
        '/api/customers/search',
        {
          custName: searchCondition.custName || '',
          custGbn: searchCondition.custGbn || [],
          genderGbn: searchCondition.genderGbn || '',
          openDateFrom: searchCondition.openDateFrom || '',
          openDateTo: searchCondition.openDateTo || '',
          phoneOrEmail: searchCondition.phoneOrEmail || ''
        }
      );
      return response;
    } catch (error) {
      console.error('고객 검색 오류:', error);
      throw error;
    }
  }

  /**
   * 고객 상세 정보 조회
   * @param custId 고객 ID
   * @returns 고객 상세 정보
   */
  async getCustomerDetail(custId: number): Promise<CustomerData> {
    try {
      const response = await apiClient.postJson<CustomerData>(
        '/api/customers/detail',
        { custId }
      );
      return response;
    } catch (error) {
      console.error('고객 상세 정보 조회 오류:', error);
      throw error;
    }
  }

  /**
   * 고객 저장 (신규 등록 또는 수정)
   * @param customerData 고객 데이터
   * @returns 저장 결과
   */
  async saveCustomer(customerData: CustomerSaveRequest): Promise<CustomerSaveResponse> {
    try {
      const response = await apiClient.postJson<CustomerSaveResponse>(
        '/api/customers/save',
        customerData
      );
      return response;
    } catch (error) {
      console.error('고객 저장 오류:', error);
      throw error;
    }
  }

  /**
   * 고객 삭제
   * @param custId 고객 ID
   * @param userId 사용자 ID
   * @returns 삭제 결과
   */
  async deleteCustomer(custId: number, userId: string): Promise<CustomerDeleteResponse> {
    try {
      const response = await apiClient.postJson<CustomerDeleteResponse>(
        '/api/customers/delete',
        { custId, userId }
      );
      return response;
    } catch (error) {
      console.error('고객 삭제 오류:', error);
      throw error;
    }
  }
}

export const customerService = new CustomerService();
export default customerService;
