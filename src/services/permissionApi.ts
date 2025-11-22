/**
 * 권한 관련 API 서비스
 * 백엔드 권한 API와 통신하는 서비스
 */

// API 응답 타입 (백엔드 응답과 일치)
interface ApiResponse<T> {
  resultCode: number;
  resultMessage: string;
  data?: T;
}

// 권한 정보 타입 (백엔드 DTO와 일치)
export interface PermissionInfo {
  viewPermission: 'Y' | 'N';
  savePermission: 'Y' | 'N';
  deletePermission: 'Y' | 'N';
  exportPermission: 'Y' | 'N';
  personalInfoPermission: 'Y' | 'N';
}

// 메뉴 권한 응답 타입 (백엔드 DTO와 일치)
export interface MenuPermissionResponse {
  menuId: number;
  menuName: string;
  menuUrl: string;
  permissions: PermissionInfo;
  permissionSource: 'ROLE' | 'USER';
}

class PermissionApiService {
  private baseUrl = '/api/permissions';

  /**
   * 백엔드 서버 연결 상태 확인
   * @returns 서버 연결 상태
   */
  async checkServerStatus(): Promise<boolean> {
    try {
      const response = await fetch('/api/test/ping', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        return true;
      } else {
        console.error('❌ [권한 API] 백엔드 서버 연결 실패:', response.status, response.statusText);
        return false;
      }
    } catch (error) {
      console.error('❌ [권한 API] 백엔드 서버 연결 오류:', error);
      return false;
    }
  }

  /**
   * 사용자의 특정 메뉴 권한 조회
   * @param userId 사용자 ID
   * @param menuId 메뉴 ID
   * @returns 메뉴 권한 정보
   */
  async getUserMenuPermission(userId: number, menuId: number): Promise<MenuPermissionResponse | null> {
    try {
      const response = await fetch(`${this.baseUrl}/user/${userId}/menu/${menuId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        console.error(`❌ [권한 API] HTTP 오류: ${response.status} ${response.statusText}`);
        return null;
      }

      const data: ApiResponse<MenuPermissionResponse> = await response.json();
      
      if (data.resultCode === 0) {
        console.log(`✅ [권한 API] 권한 조회 성공:`, data.data);
        return data.data || null;
      } else {
        console.error(`❌ [권한 API] 서버 오류: ${data.resultMessage || '데이터없음'}`, data);
        return null;
      }
    } catch (error) {
      console.error(`❌ [권한 API] 네트워크 오류:`, error);
      return null;
    }
  }

  /**
   * 사용자의 모든 메뉴 권한 조회
   * @param userId 사용자 ID
   * @returns 모든 메뉴 권한 정보 배열
   */
  async getAllUserMenuPermissions(userId: number): Promise<MenuPermissionResponse[]> {
    try {
      const response = await fetch(`${this.baseUrl}/user/${userId}/menus`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        console.error(`❌ [권한 API] 전체 권한 조회 실패: ${response.status} ${response.statusText}`);
        return [];
      }

      const data: ApiResponse<MenuPermissionResponse[]> = await response.json();
      
      if (data.resultCode === 0) {
        const permissions = data.data || [];
        console.log(`✅ [권한 API] 전체 권한 조회 성공 - 권한 개수: ${permissions.length}`, permissions);
        return permissions;
      } else {
        console.error(`❌ [권한 API] 전체 권한 조회 API 오류: ${data.resultMessage || '알 수 없는 오류'}`, data);
        return [];
      }
    } catch (error) {
      console.error(`❌ [권한 API] 전체 권한 조회 중 오류 발생:`, error);
      return [];
    }
  }

  /**
   * 사용자별 메뉴 권한 부여/제한
   * @param userId 사용자 ID
   * @param menuId 메뉴 ID
   * @param permissions 권한 정보
   * @param permissionType 권한 타입 (G: 부여, R: 제한)
   * @param expireDate 만료일 (선택사항)
   * @returns 성공 여부
   */
  async setUserMenuPermission(
    userId: number, 
    menuId: number, 
    permissions: PermissionInfo,
    permissionType: 'G' | 'R' = 'G',
    expireDate?: string
  ): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/user/${userId}/menu/${menuId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          permissions,
          permission_type: permissionType,
          expire_date: expireDate
        }),
      });

      if (!response.ok) {
        console.error('권한 설정 실패:', response.status, response.statusText);
        return false;
      }

      const data: ApiResponse<any> = await response.json();
      
      if (data.resultCode === 0) {
        return true;
      } else {
        console.error('권한 설정 API 오류:', data.resultMessage);
        return false;
      }
    } catch (error) {
      console.error('권한 설정 중 오류 발생:', error);
      return false;
    }
  }

  /**
   * 사용자별 메뉴 권한 삭제
   * @param userId 사용자 ID
   * @param menuId 메뉴 ID
   * @returns 성공 여부
   */
  async removeUserMenuPermission(userId: number, menuId: number): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/user/${userId}/menu/${menuId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        console.error('권한 삭제 실패:', response.status, response.statusText);
        return false;
      }

      const data: ApiResponse<any> = await response.json();
      
      if (data.resultCode === 0) {
        return true;
      } else {
        console.error('권한 삭제 API 오류:', data.resultMessage);
        return false;
      }
    } catch (error) {
      console.error('권한 삭제 중 오류 발생:', error);
      return false;
    }
  }

  /**
   * 롤별 메뉴 권한 조회
   * @param roleId 롤 ID
   * @returns 롤별 메뉴 권한 정보 배열
   */
  async getRoleMenuPermissions(roleId: number): Promise<MenuPermissionResponse[]> {
    try {
      const response = await fetch(`${this.baseUrl}/role/${roleId}/menus`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        console.error('롤 권한 조회 실패:', response.status, response.statusText);
        return [];
      }

      const data: ApiResponse<MenuPermissionResponse[]> = await response.json();
      
      if (data.resultCode === 0) {
        return data.data || [];
      } else {
        console.error('롤 권한 조회 API 오류:', data.resultMessage);
        return [];
      }
    } catch (error) {
      console.error('롤 권한 조회 중 오류 발생:', error);
      return [];
    }
  }

  /**
   * 롤별 메뉴 권한 설정
   * @param roleId 롤 ID
   * @param menuId 메뉴 ID
   * @param permissions 권한 정보
   * @returns 성공 여부
   */
  async setRoleMenuPermission(
    roleId: number, 
    menuId: number, 
    permissions: PermissionInfo
  ): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/role/${roleId}/menu/${menuId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          permissions
        }),
      });

      if (!response.ok) {
        console.error('롤 권한 설정 실패:', response.status, response.statusText);
        return false;
      }

      const data: ApiResponse<any> = await response.json();
      
      if (data.resultCode === 0) {
        return true;
      } else {
        console.error('롤 권한 설정 API 오류:', data.resultMessage);
        return false;
      }
    } catch (error) {
      console.error('롤 권한 설정 중 오류 발생:', error);
      return false;
    }
  }
}

// 싱글톤 인스턴스 생성
export const permissionApiService = new PermissionApiService();
export default permissionApiService;
