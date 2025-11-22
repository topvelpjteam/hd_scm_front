import { UserData, UserDetail, SearchCondition, CommonCodeOption } from '../store/userManagementSlice';

// API 응답 타입 정의 (백엔드 ApiResponse와 일치)
interface ApiResponse<T> {
  resultCode: number;
  resultMessage: string;
  data: T;
}

// 사용자관리 서비스 클래스
export class UserManagementService {
  private baseUrl = '/api/user-management';

  // 사용자 목록 조회
  async getUserList(searchCondition: SearchCondition): Promise<{
    userList: UserData[];
    totalCount: number;
  }> {
    try {
      // 백엔드 서버 연결 상태 확인
      try {
        const healthCheck = await fetch(`${this.baseUrl}/common-codes/role`, {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
        });
        
        if (!healthCheck.ok) {
          throw new Error(`백엔드 서버 연결 실패: ${healthCheck.status}`);
        }
      } catch (error) {
        console.error('백엔드 서버 연결 오류:', error);
        throw new Error('백엔드 서버에 연결할 수 없습니다. 서버가 실행 중인지 확인해주세요.');
      }

      const response = await fetch(`${this.baseUrl}/list`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userRoleId: searchCondition.userRoleId.length > 0 ? searchCondition.userRoleId.join(',') : null,
          userStatus: searchCondition.userStatus.length > 0 ? searchCondition.userStatus.join(',') : null,
          userName: searchCondition.userName || null,
          userLoginId: searchCondition.userLoginId || null,
          agentId: searchCondition.agentId.length > 0 ? searchCondition.agentId.join(',') : null,
          storeId: searchCondition.storeId.length > 0 ? searchCondition.storeId.join(',') : null,
          pageSize: searchCondition.pageSize,
          pageNum: searchCondition.pageNum,
          sortColumn: searchCondition.sortColumn,
          sortDirection: searchCondition.sortDirection,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('API Error Response:', errorText);
        throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
      }

      const result: ApiResponse<{
        userList: UserData[];
        totalCount: number;
        currentPage: number;
        totalPages: number;
      }> = await response.json();
      
      if (result.resultCode !== 0) {
        throw new Error(result.resultMessage || '사용자 목록 조회에 실패했습니다.');
      }

      return {
        userList: result.data.userList,
        totalCount: result.data.totalCount,
      };
    } catch (error) {
      console.error('사용자 목록 조회 오류:', error);
      throw error;
    }
  }

  // 사용자 상세 조회
  async getUserDetail(userId: number): Promise<UserDetail> {
    try {
      const response = await fetch(`${this.baseUrl}/detail/${userId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result: ApiResponse<UserDetail> = await response.json();
      
      if (result.resultCode !== 0) {
        throw new Error(result.resultMessage || '사용자 상세 조회에 실패했습니다.');
      }

      return result.data;
    } catch (error) {
      console.error('사용자 상세 조회 오류:', error);
      throw error;
    }
  }

  // 사용자 등록
  async createUser(userDetail: UserDetail): Promise<number> {
    try {
      const response = await fetch(`${this.baseUrl}/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userRoleId: userDetail.user_role_id,
          agentId: userDetail.Agent_id,
          storeId: userDetail.Store_id,
          userLoginId: userDetail.user_login_id,
          userName: userDetail.user_name,
          userEmail: userDetail.user_email,
          userPassword: userDetail.user_password,
          userPhone: userDetail.user_phone,
          userAddress: userDetail.user_address,
          userBirthDate: userDetail.user_birth_date,
          userGender: userDetail.user_gender,
          userDepartment: userDetail.user_department,
          userPosition: userDetail.user_position,
          userStatus: userDetail.user_status,
          userCreatedBy: userDetail.user_created_by,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result: ApiResponse<number> = await response.json();
      
      if (result.resultCode !== 0) {
        throw new Error(result.resultMessage || '사용자 등록에 실패했습니다.');
      }

      return result.data;
    } catch (error) {
      console.error('사용자 등록 오류:', error);
      throw error;
    }
  }

  // 사용자 수정
  async updateUser(userDetail: UserDetail): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/update`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: userDetail.user_id,
          userRoleId: userDetail.user_role_id,
          agentId: userDetail.Agent_id,
          storeId: userDetail.Store_id,
          userLoginId: userDetail.user_login_id,
          userName: userDetail.user_name,
          userEmail: userDetail.user_email,
          userPassword: userDetail.user_password,
          userPhone: userDetail.user_phone,
          userAddress: userDetail.user_address,
          userBirthDate: userDetail.user_birth_date,
          userGender: userDetail.user_gender,
          userDepartment: userDetail.user_department,
          userPosition: userDetail.user_position,
          userStatus: userDetail.user_status,
          userUpdatedBy: userDetail.user_updated_by,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result: ApiResponse<number> = await response.json();
      
      if (result.resultCode !== 0) {
        throw new Error(result.resultMessage || '사용자 수정에 실패했습니다.');
      }

      return result.data > 0;
    } catch (error) {
      console.error('사용자 수정 오류:', error);
      throw error;
    }
  }

  // 사용자 삭제
  async deleteUser(userId: number, updatedBy: number): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/delete/${userId}?updatedBy=${updatedBy}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result: ApiResponse<number> = await response.json();
      
      if (result.resultCode !== 0) {
        throw new Error(result.resultMessage || '사용자 삭제에 실패했습니다.');
      }

      return result.data > 0;
    } catch (error) {
      console.error('사용자 삭제 오류:', error);
      throw error;
    }
  }

  // 로그인 ID 중복 확인
  async checkLoginIdDuplicate(userLoginId: string, userId?: number): Promise<boolean> {
    try {
      const url = userId 
        ? `${this.baseUrl}/check-login-id?userLoginId=${encodeURIComponent(userLoginId)}&userId=${userId}`
        : `${this.baseUrl}/check-login-id?userLoginId=${encodeURIComponent(userLoginId)}`;
        
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result: ApiResponse<boolean> = await response.json();
      
      if (result.resultCode !== 0) {
        throw new Error(result.resultMessage || '로그인 ID 중복 확인에 실패했습니다.');
      }

      return result.data;
    } catch (error) {
      console.error('로그인 ID 중복 확인 오류:', error);
      throw error;
    }
  }

  // 사용자 로그인
  async loginUser(userLoginId: string, userPassword: string): Promise<{
    loginResult: number;
    message: string;
  }> {
    try {
      const response = await fetch(`${this.baseUrl}/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userLoginId,
          userPassword,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result: ApiResponse<number> = await response.json();
      
      if (result.resultCode !== 0) {
        throw new Error(result.resultMessage || '로그인 처리에 실패했습니다.');
      }

      return {
        loginResult: result.data,
        message: result.resultMessage,
      };
    } catch (error) {
      console.error('로그인 오류:', error);
      throw error;
    }
  }

  // 비밀번호 재설정
  async resetPassword(userId: number, newPassword: string, updatedBy: number): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/reset-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          newPassword,
          updatedBy,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result: ApiResponse<number> = await response.json();
      
      if (result.resultCode !== 0) {
        throw new Error(result.resultMessage || '비밀번호 재설정에 실패했습니다.');
      }

      return result.data > 0;
    } catch (error) {
      console.error('비밀번호 재설정 오류:', error);
      throw error;
    }
  }

  // 롤 목록 조회
  async getRoleOptions(): Promise<CommonCodeOption[]> {
    try {
      const response = await fetch(`${this.baseUrl}/common-codes/role`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result: ApiResponse<CommonCodeOption[]> = await response.json();
      
      if (result.resultCode !== 0) {
        throw new Error(result.resultMessage || '롤 목록 조회에 실패했습니다.');
      }

      return result.data;
    } catch (error) {
      console.error('롤 목록 조회 오류:', error);
      throw error;
    }
  }

  // 업체 목록 조회
  async getAgentOptions(): Promise<CommonCodeOption[]> {
    try {
      const response = await fetch(`${this.baseUrl}/common-codes/agent`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result: ApiResponse<CommonCodeOption[]> = await response.json();
      
      if (result.resultCode !== 0) {
        throw new Error(result.resultMessage || '업체 목록 조회에 실패했습니다.');
      }

      return result.data;
    } catch (error) {
      console.error('업체 목록 조회 오류:', error);
      throw error;
    }
  }

  // 매장 목록 조회
  async getStoreOptions(): Promise<CommonCodeOption[]> {
    try {
      const response = await fetch(`${this.baseUrl}/common-codes/store`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result: ApiResponse<CommonCodeOption[]> = await response.json();
      
      if (result.resultCode !== 0) {
        throw new Error(result.resultMessage || '매장 목록 조회에 실패했습니다.');
      }

      return result.data;
    } catch (error) {
      console.error('매장 목록 조회 오류:', error);
      throw error;
    }
  }

  // 사용자 권한 조회
  async getUserPermissions(): Promise<{
    view: boolean;
    save: boolean;
    delete: boolean;
    export: boolean;
    personalInfo: boolean;
  }> {
    try {
      // 임시로 모든 권한을 true로 반환 (실제로는 서버에서 권한 체크)
      return {
        view: true,
        save: true,
        delete: true,
        export: true,
        personalInfo: true,
      };
    } catch (error) {
      console.error('사용자 권한 조회 오류:', error);
      throw error;
    }
  }

  // 계정 잠금 해제
  async unlockUserAccount(userId: number): Promise<{
    success: boolean;
    message: string;
  }> {
    try {
      console.log('🔓 계정 잠금 해제 요청 시작:', { userId, baseUrl: this.baseUrl });
      
      const requestBody = {
        userId: userId
      };
      
      console.log('📤 요청 데이터:', requestBody);
      
      const response = await fetch(`${this.baseUrl}/unlock-account`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      console.log('📡 응답 상태:', response.status, response.statusText);
      console.log('📡 응답 헤더:', Object.fromEntries(response.headers.entries()));

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ HTTP 오류 응답:', errorText);
        throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
      }

      const result: ApiResponse<any> = await response.json();
      console.log('📥 응답 데이터:', result);
      
      if (result.resultCode === 0) {
        console.log('✅ 계정 잠금 해제 성공');
        return {
          success: true,
          message: result.resultMessage || '계정 잠금이 해제되었습니다.'
        };
      } else {
        console.log('❌ 계정 잠금 해제 실패:', result.resultMessage);
        return {
          success: false,
          message: result.resultMessage || '계정 잠금 해제에 실패했습니다.'
        };
      }
    } catch (error) {
      console.error('💥 계정 잠금 해제 오류:', error);
      console.error('💥 오류 스택:', error instanceof Error ? error.stack : 'No stack trace');
      return {
        success: false,
        message: error instanceof Error ? error.message : '계정 잠금 해제 중 오류가 발생했습니다.'
      };
    }
  }
}

// 싱글톤 인스턴스 생성 및 내보내기
export const userManagementService = new UserManagementService();