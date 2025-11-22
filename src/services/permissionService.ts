/**
 * 권한 체크 서비스
 * 메뉴별 권한과 버튼별 권한을 체크하는 서비스
 */

import permissionApiService from './permissionApi';

// 권한 타입 정의 (백엔드 DTO와 일치)
export interface MenuPermissions {
  viewPermission: 'Y' | 'N';      // 조회 권한
  savePermission: 'Y' | 'N';      // 저장 권한
  deletePermission: 'Y' | 'N';    // 삭제 권한
  exportPermission: 'Y' | 'N';    // 내보내기 권한
  personalInfoPermission: 'Y' | 'N'; // 개인정보 조회 권한
}

// 메뉴 권한 응답 타입 (백엔드 DTO와 일치)
export interface MenuPermissionResponse {
  menuId: number;
  menuName: string;
  menuUrl: string;
  permissions: MenuPermissions;
  permissionSource: 'ROLE' | 'USER'; // 권한 출처 (롤 권한 또는 사용자 개별 권한)
}

// 사용자 정보 타입 (authSlice에서 가져옴)
export interface UserInfo {
  userId: number;
  userName: string;
  userEmail: string;
  roleId: number;
  roleName: string;
  roleLevel: number;
  sessionId: string;
  agentId?: string;
}

class PermissionService {
  private baseUrl = '/api/permissions';

  /**
   * 사용자의 특정 메뉴 권한 조회
   * @param userId 사용자 ID
   * @param menuId 메뉴 ID
   * @returns 메뉴 권한 정보
   */
  async getUserMenuPermissions(userId: number, menuId: number): Promise<MenuPermissionResponse | null> {
    console.log(`🔍 [권한 서비스] 권한 조회 시작 - userId: ${userId}, menuId: ${menuId}`);
    
    // 백엔드 서버 상태 먼저 확인
    const isServerRunning = await permissionApiService.checkServerStatus();
    
    if (!isServerRunning) {
      console.warn(`⚠️ [권한 서비스] 백엔드 서버 미실행 - userId: ${userId}, menuId: ${menuId}`);
      return null;
    }

    console.log(`✅ [권한 서비스] 백엔드 서버 연결 확인 - userId: ${userId}, menuId: ${menuId}`);
    
    // 실제 API 서비스 사용
    const result = await permissionApiService.getUserMenuPermission(userId, menuId);
    
    if (result) {
      console.log(`✅ [권한 서비스] 권한 조회 완료 - userId: ${userId}, menuId: ${menuId}, source: ${result.permissionSource}`);
    } else {
      console.warn(`⚠️ [권한 서비스] 권한 조회 실패 - userId: ${userId}, menuId: ${menuId}`);
    }
    
    return result;
  }

  /**
   * 사용자의 모든 메뉴 권한 조회
   * @param userId 사용자 ID
   * @returns 모든 메뉴 권한 정보 배열
   */
  async getAllUserMenuPermissions(userId: number): Promise<MenuPermissionResponse[]> {
    //console.log(`🔍 [권한 서비스] 전체 권한 조회 시작 - userId: ${userId}`);
    
    // 백엔드 서버 상태 먼저 확인
    const isServerRunning = await permissionApiService.checkServerStatus();
    
    if (!isServerRunning) {
      console.warn(`⚠️ [권한 서비스] 백엔드 서버 미실행 - userId: ${userId}`);
      return [];
    }

    //console.log(`✅ [권한 서비스] 백엔드 서버 연결 확인 - userId: ${userId}`);
    
    // 실제 API 서비스 사용
    const result = await permissionApiService.getAllUserMenuPermissions(userId);
    
    //console.log(`📊 [권한 서비스] 전체 권한 조회 완료 - userId: ${userId}, 권한 개수: ${result.length}`);
    if (result.length > 0) {
      // console.log(`📋 [권한 서비스] 권한 요약:`, result.map(p => ({
      //   menuId: p.menuId,
      //   menuName: p.menuName,
      //   source: p.permissionSource,
      //   canView: p.permissions?.viewPermission === 'Y'
      // })));
    } else {
      // console.warn(`⚠️ [권한 서비스] 권한 데이터 없음 - userId: ${userId}`);
    }
    
    return result;
  }

  /**
   * 메뉴 접근 권한 체크 (권한 중 하나라도 Y이면 접근 가능)
   * @param permissions 메뉴 권한 정보
   * @returns 접근 가능 여부
   */
  canAccessMenu(permissions: MenuPermissions | null): boolean {
    if (!permissions) return false;
    
    return (
      permissions.viewPermission === 'Y' ||
      permissions.savePermission === 'Y' ||
      permissions.deletePermission === 'Y' ||
      permissions.exportPermission === 'Y' ||
      permissions.personalInfoPermission === 'Y'
    );
  }

  /**
   * 조회 권한 체크
   * @param permissions 메뉴 권한 정보
   * @returns 조회 권한 여부
   */
  canView(permissions: MenuPermissions | null): boolean {
    return permissions?.viewPermission === 'Y';
  }

  /**
   * 저장 권한 체크
   * @param permissions 메뉴 권한 정보
   * @returns 저장 권한 여부
   */
  canSave(permissions: MenuPermissions | null): boolean {
    return permissions?.savePermission === 'Y';
  }

  /**
   * 삭제 권한 체크
   * @param permissions 메뉴 권한 정보
   * @returns 삭제 권한 여부
   */
  canDelete(permissions: MenuPermissions | null): boolean {
    return permissions?.deletePermission === 'Y';
  }

  /**
   * 내보내기 권한 체크
   * @param permissions 메뉴 권한 정보
   * @returns 내보내기 권한 여부
   */
  canExport(permissions: MenuPermissions | null): boolean {
    return permissions?.exportPermission === 'Y';
  }

  /**
   * 개인정보 조회 권한 체크
   * @param permissions 메뉴 권한 정보
   * @returns 개인정보 조회 권한 여부
   */
  canViewPersonalInfo(permissions: MenuPermissions | null): boolean {
    return permissions?.personalInfoPermission === 'Y';
  }

  /**
   * 롤 레벨 기반 기본 권한 체크 (백엔드 API가 없을 때 사용)
   * @param roleLevel 사용자 롤 레벨
   * @param menuName 메뉴명
   * @returns 기본 권한 정보
   */
  getDefaultPermissionsByRole(roleLevel: number, menuName: string): MenuPermissions {
    // 시스템 관리자 (roleLevel = 1) - 모든 권한
    if (roleLevel === 1) {
      return {
        viewPermission: 'Y',
        savePermission: 'Y',
        deletePermission: 'Y',
        exportPermission: 'Y',
        personalInfoPermission: 'Y'
      };
    }

    // 일반 관리자 (roleLevel = 2) - 조회, 저장, 내보내기 권한
    if (roleLevel === 2) {
      return {
        viewPermission: 'Y',
        savePermission: 'Y',
        deletePermission: 'N',
        exportPermission: 'Y',
        personalInfoPermission: 'N'
      };
    }

    // 일반 사용자 (roleLevel = 3) - 조회, 내보내기 권한만
    if (roleLevel === 3) {
      return {
        viewPermission: 'Y',
        savePermission: 'N',
        deletePermission: 'N',
        exportPermission: 'Y',
        personalInfoPermission: 'N'
      };
    }

    // 매장 직원 (roleLevel = 4) - 발주, 재고 관련 메뉴만 저장 권한
    if (roleLevel === 4) {
      const isOrderOrInventoryMenu = 
        menuName.includes('발주') || 
        menuName.includes('주문') || 
        menuName.includes('재고') || 
        menuName.includes('입출고') ||
        menuName === '대시보드';

      return {
        viewPermission: 'Y',
        savePermission: isOrderOrInventoryMenu ? 'Y' : 'N',
        deletePermission: 'N',
        exportPermission: 'Y',
        personalInfoPermission: 'N'
      };
    }

    // 거래업체 (roleLevel = 5) - 상품, 발주 관련 메뉴만 조회 권한
    if (roleLevel === 5) {
      const isProductOrOrderMenu = 
        menuName.includes('상품') || 
        menuName.includes('발주') || 
        menuName.includes('주문') ||
        menuName === '대시보드';

      return {
        viewPermission: isProductOrOrderMenu ? 'Y' : 'N',
        savePermission: 'N',
        deletePermission: 'N',
        exportPermission: isProductOrOrderMenu ? 'Y' : 'N',
        personalInfoPermission: 'N'
      };
    }

    // 기본값 - 모든 권한 거부
    return {
      viewPermission: 'N',
      savePermission: 'N',
      deletePermission: 'N',
      exportPermission: 'N',
      personalInfoPermission: 'N'
    };
  }
}

// 싱글톤 인스턴스 생성
export const permissionService = new PermissionService();
export default permissionService;
