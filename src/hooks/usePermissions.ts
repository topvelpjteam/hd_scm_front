/**
 * 권한 체크 커스텀 훅
 * 메뉴별 권한과 버튼별 권한을 체크하는 훅
 */

import { useState, useEffect, useCallback } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '../store/store';
import permissionService, { MenuPermissions, MenuPermissionResponse } from '../services/permissionService';

// 권한 체크 결과 타입
export interface PermissionCheckResult {
  canAccess: boolean;        // 메뉴 접근 가능 여부
  canView: boolean;          // 조회 권한
  canSave: boolean;          // 저장 권한
  canDelete: boolean;        // 삭제 권한
  canExport: boolean;        // 내보내기 권한
  canViewPersonalInfo: boolean; // 개인정보 조회 권한
  loading: boolean;          // 로딩 상태
  error: string | null;      // 오류 메시지
}

/**
 * 특정 메뉴의 권한을 체크하는 훅
 * @param menuId 메뉴 ID
 * @param menuName 메뉴명 (기본 권한 체크용)
 * @returns 권한 체크 결과
 */
export const useMenuPermissions = (menuId: number, menuName?: string): PermissionCheckResult => {
  const { user } = useSelector((state: RootState) => state.auth);
  const [permissions, setPermissions] = useState<MenuPermissions | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 권한 데이터 로드
  const loadPermissions = useCallback(async () => {
    if (!user?.userId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // API를 통한 권한 조회 시도
      console.log(`🔍 [권한 훅] 권한 조회 시작 - userId: ${user.userId}, menuId: ${menuId}, menuName: ${menuName}`);
      const apiPermissions = await permissionService.getUserMenuPermissions(user.userId, menuId);
      
      if (apiPermissions && apiPermissions.permissions) {
        // API에서 권한 정보를 가져온 경우
        console.log(`✅ [권한 훅] 권한 조회 성공 - menuId: ${menuId}, source: ${apiPermissions.permissionSource}`);
        console.log(`📊 [권한 훅] 권한 상세:`, {
          view: apiPermissions.permissions.viewPermission,
          save: apiPermissions.permissions.savePermission,
          delete: apiPermissions.permissions.deletePermission,
          export: apiPermissions.permissions.exportPermission,
          personal: apiPermissions.permissions.personalInfoPermission
        });
        setPermissions(apiPermissions.permissions);
      } else {
        // API에서 권한 정보가 없는 경우 접근 차단 (보안 강화)
        console.warn(`🚫 [권한 훅] 권한 정보 없음, 접근 차단 - userId: ${user.userId}, menuId: ${menuId}, menuName: ${menuName}`);
        setPermissions(null); // 권한 없음으로 설정하여 접근 차단
      }
      
    } catch (err) {
      console.error('❌ 권한 로드 중 오류:', err);
      setError('권한 정보를 불러올 수 없습니다. (백엔드 서버 연결 실패)');
      
      // 오류 발생 시 접근 차단 (보안 강화)
      console.warn(`🚫 권한 조회 오류로 인해 접근 차단: roleLevel=${user?.roleLevel}, menuName=${menuName}`);
      setPermissions(null); // 권한 없음으로 설정하여 접근 차단
    } finally {
      setLoading(false);
    }
  }, [user?.userId, user?.roleLevel, menuId, menuName]);

  // 권한 데이터 로드
  useEffect(() => {
    loadPermissions();
  }, [loadPermissions]);

  // 권한 체크 결과 계산
  const result: PermissionCheckResult = {
    canAccess: permissionService.canAccessMenu(permissions),
    canView: permissionService.canView(permissions),
    canSave: permissionService.canSave(permissions),
    canDelete: permissionService.canDelete(permissions),
    canExport: permissionService.canExport(permissions),
    canViewPersonalInfo: permissionService.canViewPersonalInfo(permissions),
    loading,
    error
  };

  return result;
};

/**
 * 사용자의 모든 메뉴 권한을 체크하는 훅
 * @returns 모든 메뉴 권한 정보
 */
export const useAllMenuPermissions = () => {
  const { user } = useSelector((state: RootState) => state.auth);
  const [allPermissions, setAllPermissions] = useState<MenuPermissionResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 모든 권한 데이터 로드
  const loadAllPermissions = useCallback(async () => {
    if (!user?.userId) {
      setLoading(false);
      return;
    }

    // 캐시된 권한 데이터 확인 (세션 동안 유지)
    const cacheKey = `menu_permissions_${user.userId}`;
    const cachedData = sessionStorage.getItem(cacheKey);
    
    if (cachedData) {
      try {
        const permissions = JSON.parse(cachedData);
        console.log(`✅ [권한 훅] 캐시된 권한 데이터 사용 - userId: ${user.userId}, 권한 개수: ${permissions.length}`);
        setAllPermissions(permissions);
        setLoading(false);
        return;
      } catch (e) {
        console.warn('캐시 데이터 파싱 실패, API 재호출');
      }
    }

    try {
      setLoading(true);
      setError(null);

      // 실제 API 호출로 권한 데이터 가져오기
      console.log(`🔍 [권한 훅] 전체 권한 조회 시작 - userId: ${user.userId}`);
      const permissions = await permissionService.getAllUserMenuPermissions(user.userId);
      
      // console.log(`🔍 [권한 훅] API 응답 원본 데이터:`, permissions);
      // console.log(`🔍 [권한 훅] 권한 데이터 타입:`, typeof permissions);
      // console.log(`🔍 [권한 훅] 권한 데이터 길이:`, permissions?.length);
      // console.log(`🔍 [권한 훅] 권한 데이터 상세 분석:`, {
      //   isArray: Array.isArray(permissions),
      //   hasData: !!permissions,
      //   dataType: typeof permissions,
      //   length: permissions?.length,
      //   firstItem: permissions?.[0],
      //   allItems: permissions
      // });
      
      if (permissions && permissions.length > 0) {
        console.log(`✅ [권한 훅] 전체 권한 조회 성공 - userId: ${user.userId}, 권한 개수: ${permissions.length}`);
        // 권한 데이터 캐싱 (세션 동안 유지)
        sessionStorage.setItem(cacheKey, JSON.stringify(permissions));
        setAllPermissions(permissions);
      } else {
        // 권한 데이터가 없으면 빈 배열 (접근 차단)
        setAllPermissions([]);
      }
      
    } catch (err) {
      console.error('❌ 전체 권한 로드 중 오류:', err);
      setError('권한 정보를 불러올 수 없습니다.');
      // 오류 발생 시 빈 배열 (접근 차단)
      setAllPermissions([]);
    } finally {
      setLoading(false);
    }
  }, [user?.userId]);

  // 권한 데이터 로드
  useEffect(() => {
    loadAllPermissions();
  }, [loadAllPermissions]);

  return {
    allPermissions,
    loading,
    error,
    refetch: loadAllPermissions
  };
};


/**
 * 버튼별 권한을 체크하는 훅
 * @param menuId 메뉴 ID
 * @param menuName 메뉴명
 * @returns 버튼별 권한 체크 결과
 */
export const useButtonPermissions = (menuId: number, _menuName?: string) => {
  const { allPermissions, loading, error } = useAllMenuPermissions();
  
  // allPermissions에서 해당 메뉴의 권한 찾기
  const menuPermission = allPermissions.find(p => p.menuId === menuId);
  
  // 권한 체크 결과 계산
  const canView = menuPermission?.permissions.viewPermission === 'Y';
  const canSave = menuPermission?.permissions.savePermission === 'Y';
  const canDelete = menuPermission?.permissions.deletePermission === 'Y';
  const canExport = menuPermission?.permissions.exportPermission === 'Y';
  const canViewPersonalInfo = menuPermission?.permissions.personalInfoPermission === 'Y';
  
  // console.log(`🔐 [버튼권한] 메뉴 ID ${menuId} 권한 체크:`, {
  //   menuPermission,
  //   canView,
  //   canSave,
  //   canDelete,
  //   canExport,
  //   canViewPersonalInfo
  // });
  
  // console.log(`🔐 [버튼권한] 메뉴 ID ${menuId} 권한 상세 분석:`, {
  //   menuPermissionFound: !!menuPermission,
  //   permissionsObject: menuPermission?.permissions,
  //   viewPermissionValue: menuPermission?.permissions?.viewPermission,
  //   savePermissionValue: menuPermission?.permissions?.savePermission,
  //   deletePermissionValue: menuPermission?.permissions?.deletePermission,
  //   exportPermissionValue: menuPermission?.permissions?.exportPermission,
  //   personalInfoPermissionValue: menuPermission?.permissions?.personalInfoPermission,
  //   canViewCalculation: `${menuPermission?.permissions?.viewPermission} === 'Y' = ${canView}`,
  //   canSaveCalculation: `${menuPermission?.permissions?.savePermission} === 'Y' = ${canSave}`,
  //   canDeleteCalculation: `${menuPermission?.permissions?.deletePermission} === 'Y' = ${canDelete}`
  // });
  
  return {
    // 조회 관련 버튼
    canView,
    canSearch: canView,
    canRefresh: canView,
    
    // 저장 관련 버튼
    canSave,
    canAdd: canSave,
    canEdit: canSave,
    canUpdate: canSave,
    
    // 삭제 관련 버튼
    canDelete,
    canRemove: canDelete,
    
    // 내보내기 관련 버튼
    canExport,
    canDownload: canExport,
    canPrint: canExport,
    
    // 개인정보 관련 버튼
    canViewPersonalInfo,
    
    // 공통
    loading,
    error
  };
};

/**
 * 버튼 텍스트 기반 권한 체크 훅
 * @param menuId 메뉴 ID
 * @param buttonText 버튼 텍스트 ("조회", "저장", "삭제", "내보내기", "개인정보" 등)
 * @returns 해당 버튼의 권한 여부
 */
export const useButtonTextPermission = (menuId: number, buttonText: string) => {
  const { allPermissions, loading, error } = useAllMenuPermissions();
  
  // allPermissions에서 해당 메뉴의 권한 찾기
  const menuPermission = allPermissions.find(p => p.menuId === menuId);
  
  console.log(`🔐 [버튼텍스트권한] 메뉴 ID ${menuId} 권한 검색:`, {
    allPermissionsCount: allPermissions.length,
    allPermissions: allPermissions.map(p => ({ menuId: p.menuId, menuName: p.menuName })),
    menuPermission,
    loading,
    error
  });
  
  if (!menuPermission) {
    console.log(`🔐 [버튼텍스트권한] 메뉴 ID ${menuId} 권한 없음`);
    return { hasPermission: false, loading, error };
  }
  
  // 버튼 텍스트에 따른 권한 매핑
  let hasPermission = false;
  
  switch (buttonText) {
    case '조회':
    case '검색':
    case '새로고침':
      hasPermission = menuPermission.permissions.viewPermission === 'Y';
      break;
    case '저장':
    case '추가':
    case '수정':
    case '일괄등록':
      hasPermission = menuPermission.permissions.savePermission === 'Y';
      break;
    case '삭제':
    case '제거':
      hasPermission = menuPermission.permissions.deletePermission === 'Y';
      break;
    case '내보내기':
    case '다운로드':
    case '인쇄':
      hasPermission = menuPermission.permissions.exportPermission === 'Y';
      break;
    case '개인정보':
      hasPermission = menuPermission.permissions.personalInfoPermission === 'Y';
      break;
    default:
      console.warn(`🔐 [버튼텍스트권한] 알 수 없는 버튼 텍스트: ${buttonText}`);
      hasPermission = false;
  }
  
  console.log(`🔐 [버튼텍스트권한] 메뉴 ID ${menuId}, 버튼 "${buttonText}": ${hasPermission}`, {
    menuPermission,
    buttonText,
    hasPermission,
    loading,
    error
  });
  
  return { hasPermission, loading, error };
};


export default useMenuPermissions;
