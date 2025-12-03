/**
 * 메뉴 관리 서비스
 * 메뉴 CRUD 및 롤별 권한 관리 API 호출
 */

// 타입 정의
export interface MenuData {
  menu_id: number;
  menu_name: string;
  menu_description: string;
  menu_url: string;
  menu_icon: string;
  menu_order: number;
  menu_level: number;
  menu_parent_id: number | null;
  parent_menu_name?: string;
  menu_type: string;
  menu_status: string;
  menu_created_date: string;
  menu_created_by: number;
  menu_updated_date: string | null;
  menu_updated_by: number | null;
  menu_path?: string;
  depth?: number;
  children?: MenuData[];
}

export interface MenuPermissionData {
  menu_role_permission_id: number;
  menu_id: number;
  menu_name: string;
  role_id: number;
  role_name: string;
  role_level: number;
  view_permission: string;
  save_permission: string;
  delete_permission: string;
  export_permission: string;
  personal_info_permission: string;
  menu_role_permission_status: string;
}

export interface RoleData {
  role_id: number;
  role_name: string;
  role_level: number;
}

export interface MenuFormData {
  menu_name: string;
  menu_description: string;
  menu_url: string;
  menu_icon: string;
  menu_order: number;
  menu_level: number;
  menu_parent_id: number | null;
  menu_type: string;
  menu_status: string;
}

export interface MenuWithPermissionsData extends MenuFormData {
  permissions?: PermissionData[];
}

export interface PermissionData {
  role_id: number;
  view_permission: string;
  save_permission: string;
  delete_permission: string;
  export_permission: string;
  personal_info_permission: string;
}

export interface PermissionUpdateData {
  permissionId: number;
  field: string;
  value: string;
}

// API 응답 타입
interface ApiResponse<T> {
  result_code: number;
  result_message: string;
  data: T;
}

class MenuManagementService {
  private baseUrl = '/api/menu-management';

  /**
   * HTTP 요청 헬퍼
   */
  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    
    const defaultOptions: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
      },
    };

    console.log(`API 요청: ${url}`, options);

    try {
      const response = await fetch(url, { ...defaultOptions, ...options });

      console.log(`API 응답 상태: ${response.status} ${response.statusText}`);

      if (!response.ok) {
        let errorData;
        try {
          errorData = await response.json();
        } catch (parseError) {
          console.error('JSON 파싱 실패:', parseError);
          errorData = { result_message: `HTTP error! status: ${response.status}` };
        }
        console.error('API 에러 응답:', errorData);
        throw new Error(errorData.result_message || `HTTP error! status: ${response.status}`);
      }

      const result: ApiResponse<T> = await response.json();
      console.log('API 응답 데이터:', result);
      
      if (result.result_code !== 0) {
        console.error('API 비즈니스 로직 에러:', result);
        throw new Error(result.result_message || 'API 요청 실패');
      }

      return result.data;
    } catch (error) {
      console.error('HTTP 요청 중 오류 발생:', error);
      if (error instanceof Error) {
        throw error;
      } else {
        throw new Error(`알 수 없는 오류: ${String(error)}`);
      }
    }
  }

  /**
   * 메뉴 트리 구조 조회
   */
  async getMenuTree(): Promise<MenuData[]> {
    try {
      // 기존 메뉴 컨트롤러의 메뉴 트리 조회 API 사용
      const response = await fetch('/api/menus/tree');
      const result = await response.json();
      
      if (result.result_code !== 0) {
        throw new Error(result.result_message || '메뉴 트리 조회 실패');
      }
      
      return result.menus;
    } catch (error) {
      console.error('메뉴 트리 조회 오류:', error);
      throw error;
    }
  }

  /**
   * 메뉴 목록 조회 (페이지네이션)
   */
  async getMenuList(params: {
    menuLevel?: number;
    menuParentId?: number;
    menuType?: string;
    menuStatus?: string;
    searchKeyword?: string;
    pageSize?: number;
    pageNum?: number;
    sortColumn?: string;
    sortDirection?: string;
  } = {}): Promise<{
    menuList: MenuData[];
    totalCount: number;
    currentPage: number;
    totalPages: number;
  }> {
    try {
      const response = await this.request<{
        menuList: MenuData[];
        totalCount: number;
        currentPage: number;
        totalPages: number;
      }>('/menus', {
        method: 'POST',
        body: JSON.stringify(params),
      });

      return response;
    } catch (error) {
      console.error('메뉴 목록 조회 오류:', error);
      throw error;
    }
  }

  /**
   * 특정 메뉴 상세 조회
   */
  async getMenuDetail(menuId: number): Promise<MenuData> {
    try {
      return await this.request<MenuData>(`/menu/${menuId}`);
    } catch (error) {
      console.error('메뉴 상세 조회 오류:', error);
      throw error;
    }
  }

  /**
   * 메뉴 등록
   */
  async createMenu(menuData: MenuFormData): Promise<number> {
    try {
      const response = await this.request<{ menu_id: number }>('/menu', {
        method: 'POST',
        body: JSON.stringify(menuData),
      });

      return response.menu_id;
    } catch (error) {
      console.error('메뉴 등록 오류:', error);
      throw error;
    }
  }

  /**
   * 메뉴와 권한을 함께 등록
   */
  async createMenuWithPermissions(menuData: MenuWithPermissionsData): Promise<number> {
    try {
      console.log('메뉴와 권한 등록 요청 데이터:', menuData);
      
      const response = await this.request<{ menu_id: number }>('/menu-with-permissions', {
        method: 'POST',
        body: JSON.stringify(menuData),
      });

      console.log('메뉴와 권한 등록 응답:', response);
      return response.menu_id;
    } catch (error) {
      console.error('메뉴와 권한 등록 오류:', error);
      console.error('오류 상세:', {
        message: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        name: error instanceof Error ? error.name : undefined
      });
      throw error;
    }
  }

  /**
   * 메뉴 수정
   */
  async updateMenu(menuId: number, menuData: MenuFormData): Promise<number> {
    try {
      const response = await this.request<{ affected_rows: number }>(`/menu/${menuId}`, {
        method: 'PUT',
        body: JSON.stringify(menuData),
      });

      return response.affected_rows;
    } catch (error) {
      console.error('메뉴 수정 오류:', error);
      throw error;
    }
  }

  /**
   * 메뉴와 권한을 함께 수정
   */
  async updateMenuWithPermissions(menuId: number, menuData: MenuWithPermissionsData): Promise<number> {
    try {
      const response = await this.request<{ affected_rows: number }>(`/menu-with-permissions/${menuId}`, {
        method: 'PUT',
        body: JSON.stringify(menuData),
      });

      return response.affected_rows;
    } catch (error) {
      console.error('메뉴와 권한 수정 오류:', error);
      throw error;
    }
  }

  /**
   * 메뉴 삭제
   */
  async deleteMenu(menuId: number): Promise<number> {
    try {
      const response = await this.request<{ affected_rows: number }>(`/menu/${menuId}`, {
        method: 'DELETE',
      });

      return response.affected_rows;
    } catch (error) {
      console.error('메뉴 삭제 오류:', error);
      throw error;
    }
  }

  /**
   * 롤 목록 조회
   */
  async getRoles(): Promise<RoleData[]> {
    try {
      // 임시로 기존 메뉴 컨트롤러의 롤 조회 API 사용
      const response = await fetch('/api/menus/roles');
      const result = await response.json();
      
      if (result.result_code !== 0) {
        throw new Error(result.result_message || '롤 목록 조회 실패');
      }
      
      // MenuItem을 RoleData로 변환
      const roles: RoleData[] = result.menus.map((menu: any) => ({
        role_id: menu.menu_id,
        role_name: menu.menu_name,
        role_level: menu.menu_level
      }));
      
      return roles;
    } catch (error) {
      console.error('롤 목록 조회 오류:', error);
      throw error;
    }
  }

  /**
   * 기본 롤 데이터 초기화 (개발/테스트용)
   */
  async initializeRoles(): Promise<number> {
    try {
      const response = await this.request<{ affected_rows: number }>('/roles/init', {
        method: 'POST',
      });

      return response.affected_rows;
    } catch (error) {
      console.error('롤 초기화 오류:', error);
      throw error;
    }
  }

  /**
   * 메뉴별 롤 권한 조회
   */
  async getMenuPermissions(menuId: number): Promise<MenuPermissionData[]> {
    try {
      // 기존 메뉴 컨트롤러의 메뉴 권한 조회 API 사용
      const response = await fetch('/api/menus/permissions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ menuId }),
      });
      
      const result = await response.json();
      
      if (result.result_code !== 0) {
        throw new Error(result.result_message || '메뉴 권한 조회 실패');
      }
      
      // MenuItem을 MenuPermissionData로 변환
      const permissions: MenuPermissionData[] = result.menus.map((menu: any) => ({
        menu_role_permission_id: menu.menu_order || 0, // menu_order에 저장된 permission_id 사용
        menu_id: menuId,
        menu_name: '', // 메뉴명은 별도로 조회 필요
        role_id: menu.menu_id, // menu_id에 저장된 role_id 사용 (백엔드에서 role_id를 menu_id에 저장)
        role_name: menu.menu_name, // menu_name에 저장된 role_name 사용
        role_level: menu.menu_level, // menu_level에 저장된 role_level 사용
        view_permission: menu.menu_type || 'N', // menu_type에 저장된 view_permission 사용
        save_permission: menu.menu_status || 'N', // menu_status에 저장된 save_permission 사용
        delete_permission: menu.menu_url || 'N', // menu_url에 저장된 delete_permission 사용
        export_permission: menu.menu_icon || 'N', // menu_icon에 저장된 export_permission 사용
        personal_info_permission: menu.menu_description || 'N', // menu_description에 저장된 personal_info_permission 사용
        menu_role_permission_status: 'A'
      }));
      
      console.log('변환된 권한 데이터:', permissions);
      
      return permissions;
    } catch (error) {
      console.error('메뉴 권한 조회 오류:', error);
      throw error;
    }
  }

  /**
   * 메뉴와 권한을 함께 조회
   */
  async getMenusWithPermissions(params: {
    menuLevel?: number;
    menuParentId?: number;
    menuType?: string;
    menuStatus?: string;
    searchKeyword?: string;
    roleIdFilter?: number;
    permissionType?: string;
    pageSize?: number;
    pageNum?: number;
    sortColumn?: string;
    sortDirection?: string;
  } = {}): Promise<{
    menuList: (MenuData & { permissions?: MenuPermissionData[] })[];
    totalCount: number;
    currentPage: number;
    totalPages: number;
  }> {
    try {
      const response = await this.request<{
        menuList: (MenuData & { permissions?: MenuPermissionData[] })[];
        totalCount: number;
        currentPage: number;
        totalPages: number;
      }>('/menus-with-permissions', {
        method: 'POST',
        body: JSON.stringify(params),
      });

      return response;
    } catch (error) {
      console.error('메뉴와 권한 조회 오류:', error);
      throw error;
    }
  }

  /**
   * 메뉴 권한 수정 (개별 권한 업데이트)
   */
  async updateMenuPermission(permissionId: number, permissionData: {
    viewPermission?: string;
    savePermission?: string;
    deletePermission?: string;
    exportPermission?: string;
    personalInfoPermission?: string;
    menuRolePermissionStatus?: string;
  }): Promise<number> {
    try {
      const response = await this.request<{ affected_rows: number }>(`/permission/${permissionId}`, {
        method: 'PUT',
        body: JSON.stringify(permissionData),
      });

      return response.affected_rows;
    } catch (error) {
      console.error('메뉴 권한 수정 오류:', error);
      throw error;
    }
  }

  /**
   * 메뉴 부모 변경 (드래그 앤 드롭)
   */
  async updateMenuParent(menuId: number, newParentId: number): Promise<{ success: boolean; message?: string }> {
    try {
      await this.request<{ affected_rows: number }>(`/menu/${menuId}/parent`, {
        method: 'PUT',
        body: JSON.stringify({ menu_parent_id: newParentId }),
      });

      return { success: true };
    } catch (error) {
      console.error('메뉴 부모 변경 오류:', error);
      return { 
        success: false, 
        message: error instanceof Error ? error.message : '메뉴 부모 변경에 실패했습니다.' 
      };
    }
  }

  /**
   * 메뉴 순서 변경 (드래그 앤 드롭)
   */
  async updateMenuOrder(menuId: number, targetMenuId: number, position: 'before' | 'after'): Promise<{ success: boolean; message?: string }> {
    try {
      await this.request<{ affected_rows: number }>(`/menu/${menuId}/order`, {
        method: 'PUT',
        body: JSON.stringify({ 
          target_menu_id: targetMenuId,
          position: position
        }),
      });

      return { success: true };
    } catch (error) {
      console.error('메뉴 순서 변경 오류:', error);
      return { 
        success: false, 
        message: error instanceof Error ? error.message : '메뉴 순서 변경에 실패했습니다.' 
      };
    }
  }
}

// 싱글톤 인스턴스 생성 및 내보내기
export const menuManagementService = new MenuManagementService();
export default menuManagementService;
