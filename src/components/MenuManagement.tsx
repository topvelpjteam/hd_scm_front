import React, { useEffect, useState, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { 
  ValidationModal, 
  ConfirmationModal, 
  UnsavedChangesModal,
  SuccessModal,
  IconSelectorModal,
  type ValidationError 
} from './common';
import { getMenuIcon } from '../utils/menuUtils';
import { useGlobalLoading } from '../contexts/LoadingContext';
import { convertKoreanToEnglishWithTranslate, convertKoreanToEnglish } from '../utils/koreanToEnglish';
import { 
  setMenuTree,
  setSelectedMenu,
  setMenuForm,
  setHasUnsavedChanges,
  setMenuPermissions,
  setRoles,
  setIsLoading,
  setError,
  selectMenu,
  initializeNewMenu,
  setIsNewMenuMode
} from '../store/menuManagementSlice';
import { RootState } from '../store';
import { menuManagementService } from '../services/menuManagementService';
import './MenuManagement.css';

// 타입 정의
interface MenuData {
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


const MenuManagement: React.FC = () => {
  const dispatch = useDispatch();
  const { startLoading, stopLoading } = useGlobalLoading();
  
  // Redux 상태
  const {
    menuTree,
    selectedMenu,
    menuPermissions,
    isNewMenuMode,
    hasUnsavedChanges,
    menuForm,
    roles
  } = useSelector((state: RootState) => state.menuManagement);
  
  // 현재 활성 탭 정보 가져오기
  const { tabs, activeTabId } = useSelector((state: RootState) => state.tabs);
  const currentTab = tabs.find(tab => tab.id === activeTabId);
  
  // 권한 체크 (메뉴 관리 메뉴 ID: 24) - 현재는 임시로 사용하지 않음
  
  // 임시로 권한을 항상 허용하도록 설정 (테스트용)
  const tempSavePermission = { hasPermission: true };
  const tempDeletePermission = { hasPermission: true };

  // 모달 상태
  const [showValidationModal, setShowValidationModal] = useState(false);
  const [showConfirmationModal, setShowConfirmationModal] = useState(false);
  const [showUnsavedChangesModal, setShowUnsavedChangesModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showIconSelector, setShowIconSelector] = useState(false);
  const [validationErrors, setValidationErrors] = useState<ValidationError[]>([]);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [confirmationMessage, setConfirmationMessage] = useState('');
  const [confirmationAction, setConfirmationAction] = useState<(() => void) | null>(null);
  const [toggleResetKey, setToggleResetKey] = useState(0);
  
  // 드래그 앤 드롭 상태
  const [draggedMenu, setDraggedMenu] = useState<MenuData | null>(null);
  const [dragOverMenu, setDragOverMenu] = useState<number | null>(null);
  const [dropPosition, setDropPosition] = useState<'before' | 'after' | 'inside' | null>(null);

  // 새 메뉴 등록 상태
  const [newMenuForm, setNewMenuForm] = useState({
    menu_name: '',
    menu_description: '',
    menu_url: '',
    menu_icon: 'fas fa-folder',
    menu_order: 1,
    menu_level: 1,
    menu_parent_id: null as number | null,
    menu_type: 'MENU',
    menu_status: 'ACTIVE',
    permissions: {} as { [roleId: number]: { view_permission: string; save_permission: string; delete_permission: string; export_permission: string; personal_info_permission: string; } }
  });


  // 한글을 영문으로 변환하는 함수
  const convertKoreanToEnglish = (korean: string): string => {
    const koreanToEnglish: { [key: string]: string } = {
      // 자주 사용되는 메뉴명 매핑
      '사용자': 'user',
      '관리': 'management',
      '메뉴': 'menu',
      '권한': 'permission',
      '상품': 'product',
      '발주': 'order',
      '등록': 'registration',
      '조회': 'search',
      '수정': 'edit',
      '삭제': 'delete',
      '설정': 'settings',
      '시스템': 'system',
      '마스터': 'master',
      '코드': 'code',
      '공통': 'common',
      '업무': 'business',
      '관리자': 'admin',
      '일반': 'general',
      '고객': 'customer',
      '주문': 'order',
      '결제': 'payment',
      '배송': 'delivery',
      '재고': 'inventory',
      '매출': 'sales',
      '통계': 'statistics',
      '리포트': 'report',
      '알림': 'notification',
      '메시지': 'message',
      '파일': 'file',
      '업로드': 'upload',
      '다운로드': 'download',
      '내보내기': 'export',
      '가져오기': 'import',
      '백업': 'backup',
      '복원': 'restore',
      '로그': 'log',
      '이력': 'history',
      '변경': 'change',
      '이동': 'move',
      '복사': 'copy',
      '붙여넣기': 'paste',
      '새로고침': 'refresh',
      '초기화': 'reset',
      '저장': 'save',
      '취소': 'cancel',
      '확인': 'confirm',
      '닫기': 'close',
      '열기': 'open',
      '추가': 'add',
      '제거': 'remove',
      '선택': 'select',
      '검색': 'search',
      '필터': 'filter',
      '정렬': 'sort',
      '그룹': 'group',
      '분류': 'category',
      '태그': 'tag',
      '라벨': 'label',
      '이름': 'name',
      '제목': 'title',
      '내용': 'content',
      '설명': 'description',
      '비고': 'remark',
      '메모': 'memo',
      '주석': 'comment',
      '날짜': 'date',
      '시간': 'time',
      '시작': 'start',
      '종료': 'end',
      '완료': 'complete',
      '진행': 'progress',
      '대기': 'waiting',
      '승인': 'approve',
      '거부': 'reject',
      '활성': 'active',
      '비활성': 'inactive',
      '사용': 'use',
      '미사용': 'unused',
      '공개': 'public',
      '비공개': 'private',
      '전체': 'all',
      '부분': 'partial',
      '상세': 'detail',
      '요약': 'summary',
      '목록': 'list',
      '보기': 'view',
      '편집': 'edit',
      '생성': 'create',
      '복제': 'duplicate',
      '출력': 'print',
      '미리보기': 'preview',
      '불러오기': 'load',
      '첨부': 'attach',
      '복구': 'recovery',
      '구성': 'configure',
      '옵션': 'option',
      '환경': 'environment',
      '역할': 'role',
      '조직': 'organization',
      '부서': 'department',
      '팀': 'team',
      '직급': 'position',
      '직책': 'title',
      '업무-': 'task',
      '프로젝트': 'project',
      '일정': 'schedule',
      '계획': 'plan',
      '실행': 'execute',
      '보류': 'hold',
      '재시작': 'restart',
      '업데이트': 'update',
      '동기화': 'sync',
      '연결': 'connect',
      '연동': 'integration',
      '인터페이스': 'interface',
      'API': 'api',
      '서비스': 'service',
      '모듈': 'module',
      '컴포넌트': 'component',
      '페이지': 'page',
      '화면': 'screen',
      '폼': 'form',
      '테이블': 'table',
      '그리드': 'grid',
      '차트': 'chart',
      '그래프': 'graph',
      '대시보드': 'dashboard',
      '홈': 'home',
      '메인': 'main',
      '서브': 'sub',
      '상위': 'parent',
      '하위': 'child',
      '최상위': 'root',
      '최하위': 'leaf',
      '트리': 'tree',
      '노드': 'node',
      '브랜치': 'branch',
      '레벨': 'level',
      '깊이': 'depth',
      '순서': 'order',
      '우선순위': 'priority',
      '중요도': 'importance',
      '상태': 'status',
      '타입': 'type',
      '종류': 'kind',
      '구분': 'division',
      'ID': 'id',
      '번호': 'number',
      '키워드': 'keyword',
      '검색어': 'searchterm',
      '조건': 'condition',
      '기준': 'criteria',
      '규칙': 'rule',
      '정책': 'policy',
      '절차': 'procedure',
      '프로세스': 'process',
      '워크플로우': 'workflow',
      '단계': 'step',
      '단계별': 'stepwise',
      '순차': 'sequential',
      '병렬': 'parallel',
      '동시': 'concurrent',
      '실시간': 'realtime',
      '배치': 'batch',
      '스케줄': 'schedule',
      '크론': 'cron',
      '자동': 'auto',
      '수동': 'manual',
      '즉시': 'immediate',
      '지연': 'delay',
      '예약': 'reserve',
      '경고': 'warning',
      '오류': 'error',
      '예외': 'exception',
      '실패': 'failure',
      '성공': 'success',
      '진행중': 'processing',
      '대기중': 'waiting',
      '준비': 'ready',
      '중지': 'stop',
      '일시정지': 'pause',
      '재개': 'resume',
      '리셋': 'reset',
      '클리어': 'clear',
      '삽입': 'insert',
      '수정-': 'modify',
      '변경-': 'change',
      '보정': 'correct',
      '교정': 'calibrate',
      '조정': 'adjust',
      '설정-': 'set',
      '설치': 'install',
      '제거-': 'uninstall',
      '업그레이드': 'upgrade',
      '다운그레이드': 'downgrade',
      '마이그레이션': 'migration',
      '이전': 'migrate',
      '전환': 'switch',
      '교체': 'replace',
      '대체': 'substitute',
      '대신': 'instead',
      '대표': 'representative',
      '대리': 'proxy',
      '위임': 'delegate',
      '위탁': 'entrust',
      '거절': 'decline',
      '중단': 'abort',
      '정지': 'halt',
      '기다림': 'waiting',
      '늦음': 'late',
      '빠름': 'fast',
      '빠른': 'quick',
      '느림': 'slow',
      '느린': 'slow',
      '당장': 'rightnow',
      '지금': 'now',
      '현재': 'current',
      '라이브': 'live',
      '온라인': 'online',
      '오프라인': 'offline',
      '연결됨': 'connected',
      '연결안됨': 'disconnected',
      '끊어짐': 'disconnected',
      '끊김': 'disconnected',
      '연결끊김': 'disconnected',
      '연결실패': 'connectionfailed',
      '연결성공': 'connectionsuccess',
      '연결중': 'connecting',
      '연결시도': 'attempting',
      '재연결': 'reconnect',
      '재시도': 'retry',
      '다시시도': 'retry'
    };

    // 한글을 영문으로 변환
    let result = korean.toLowerCase();
    
    // 매핑된 단어가 있으면 변환
    Object.keys(koreanToEnglish).forEach(koreanWord => {
      const regex = new RegExp(koreanWord, 'g');
      result = result.replace(regex, koreanToEnglish[koreanWord]);
    });
    
    // 남은 한글은 제거하고 공백을 하이픈으로 변환
    result = result
      .replace(/[가-힣]/g, '') // 한글 제거
      .replace(/\s+/g, '-') // 공백을 하이픈으로
      .replace(/[^a-z0-9\-]/g, '') // 영문, 숫자, 하이픈만 남김
      .replace(/-+/g, '-') // 연속된 하이픈을 하나로
      .replace(/^-|-$/g, ''); // 앞뒤 하이픈 제거
    
    return result || 'menu'; // 빈 문자열이면 기본값
  };

  // 컴포넌트 마운트 시 초기화
  useEffect(() => {
    console.log('MenuManagement 컴포넌트 마운트됨');
    initializeComponent();
  }, []);

  // 초기화 함수
  const initializeComponent = async () => {
    console.log('MenuManagement 초기화 시작');
    try {
      // 메뉴 트리와 롤 목록 로드
      await loadMenuTree();
      await loadRoles();
    } catch (error) {
      console.error('MenuManagement 초기화 오류:', error);
    }
  };

  // 메뉴 트리 로드
  const loadMenuTree = async () => {
    try {
      startLoading('메뉴 목록을 조회 중입니다...');
      dispatch(setIsLoading(true));
      
      const menuTreeData = await menuManagementService.getMenuTree();
      dispatch(setMenuTree(menuTreeData));
    } catch (error) {
      console.error('메뉴 트리 로드 오류:', error);
      const errorMessage = error instanceof Error ? error.message : '메뉴 목록 조회에 실패했습니다.';
      dispatch(setError(errorMessage));
      setValidationErrors([{ field: 'load', message: errorMessage }]);
      setShowValidationModal(true);
    } finally {
      stopLoading();
      dispatch(setIsLoading(false));
    }
  };

  // 롤 목록 로드
  const loadRoles = async () => {
    try {
      const rolesData = await menuManagementService.getRoles();
      dispatch(setRoles(rolesData));
    } catch (error) {
      console.error('롤 목록 로드 오류:', error);
      const errorMessage = error instanceof Error ? error.message : '롤 목록 조회에 실패했습니다.';
      dispatch(setError(errorMessage));
    }
  };

  // 메뉴 선택 시 권한 로드
  const loadMenuPermissions = async (menuId: number) => {
    try {
      startLoading('메뉴 권한을 조회 중입니다...');
      dispatch(setIsLoading(true));
      
      const permissionsData = await menuManagementService.getMenuPermissions(menuId);
      dispatch(setMenuPermissions(permissionsData));
    } catch (error) {
      console.error('메뉴 권한 로드 오류:', error);
      const errorMessage = error instanceof Error ? error.message : '메뉴 권한 조회에 실패했습니다.';
      dispatch(setError(errorMessage));
      setValidationErrors([{ field: 'permissions', message: errorMessage }]);
      setShowValidationModal(true);
    } finally {
      stopLoading();
      dispatch(setIsLoading(false));
    }
  };

  // 메뉴 클릭 핸들러
  const handleMenuClick = useCallback((menu: MenuData) => {
    console.log('메뉴 클릭:', menu);
    dispatch(selectMenu(menu));
    // 메뉴 선택 시 권한도 함께 로드
    loadMenuPermissions(menu.menu_id);
  }, [dispatch]);

  // 권한 변경 핸들러
  const handlePermissionChange = useCallback((roleId: number, permissionType: string, value: string) => {
    console.log('권한 변경:', { roleId, permissionType, value });
    
    // 현재 권한 목록에서 해당 롤의 권한을 찾아서 업데이트
    const updatedPermissions = menuPermissions.map(permission => {
      if (permission.role_id === roleId) {
        return {
          ...permission,
          [permissionType]: value
        };
      }
      return permission;
    });
    
    dispatch(setMenuPermissions(updatedPermissions));
    dispatch(setHasUnsavedChanges(true));
  }, [menuPermissions, dispatch]);

  // 전체 롤 권한 변경 핸들러 (기존 메뉴 조회 시)
  const handleAllRolesPermissionChange = useCallback((value: string) => {
    console.log('전체 롤 권한 변경:', value);
    
    const updatedPermissions = menuPermissions.map(permission => ({
      ...permission,
      view_permission: value,
      save_permission: value,
      export_permission: value,
      delete_permission: value,
      personal_info_permission: value
    }));
    
    dispatch(setMenuPermissions(updatedPermissions));
    dispatch(setHasUnsavedChanges(true));
  }, [menuPermissions, dispatch]);

  // 각 권한별 전체 변경 핸들러 (기존 메뉴 조회 시)
  const handleAllPermissionChange = useCallback((permissionType: string, value: string) => {
    console.log('권한별 전체 변경:', { permissionType, value });
    
    const updatedPermissions = menuPermissions.map(permission => ({
      ...permission,
      [permissionType]: value
    }));
    
    dispatch(setMenuPermissions(updatedPermissions));
    dispatch(setHasUnsavedChanges(true));
  }, [menuPermissions, dispatch]);

  // 롤별 전체 권한 토글 핸들러
  const handleRoleAllPermissionsToggle = useCallback((roleId: number, isAllOn: boolean) => {
    console.log('롤별 전체 권한 토글 시작:', { roleId, isAllOn });
    console.log('현재 권한 목록:', menuPermissions);
    
    const value = isAllOn ? 'Y' : 'N';
    
    // 현재 권한 목록에서 해당 롤의 모든 권한을 업데이트
    const updatedPermissions = menuPermissions.map(permission => {
      console.log('권한 비교:', { 
        permissionRoleId: permission.role_id, 
        targetRoleId: roleId, 
        isMatch: permission.role_id === roleId 
      });
      
      if (permission.role_id === roleId) {
        console.log('권한 업데이트:', { roleId, value });
        return {
          ...permission,
          view_permission: value,
          save_permission: value,
          delete_permission: value,
          export_permission: value,
          personal_info_permission: value
        };
      }
      return permission;
    });
    
    console.log('업데이트된 권한 목록:', updatedPermissions);
    dispatch(setMenuPermissions(updatedPermissions));
    dispatch(setHasUnsavedChanges(true));
  }, [menuPermissions, dispatch]);

  // 롤의 모든 권한이 켜져있는지 확인하는 함수
  const isRoleAllPermissionsOn = useCallback((roleId: number) => {
    const permission = menuPermissions.find(p => p.role_id === roleId);
    if (!permission) return false;
    
    return permission.view_permission === 'Y' &&
           permission.save_permission === 'Y' &&
           permission.delete_permission === 'Y' &&
           permission.export_permission === 'Y' &&
           permission.personal_info_permission === 'Y';
  }, [menuPermissions]);


  // 새 메뉴 모드
  const handleNewMenu = useCallback(() => {
    if (hasUnsavedChanges) {
      setShowUnsavedChangesModal(true);
      return;
    }

    // 새 메뉴 등록 모드로 전환
    dispatch(initializeNewMenu());
    setNewMenuForm({
      menu_name: '',
      menu_description: '',
      menu_url: '',
      menu_icon: 'fas fa-folder',
      menu_order: 1,
      menu_level: 1,
      menu_parent_id: null,
      menu_type: 'MENU',
      menu_status: 'ACTIVE',
      permissions: {}
    });
    
    // 토글 버튼 상태 초기화를 위해 key 변경
    setToggleResetKey(prev => prev + 1);
    
    console.log('새 메뉴 등록 모드로 전환');
  }, [hasUnsavedChanges, dispatch]);

  // 메뉴 폼 변경 핸들러
  const handleMenuFormChange = (field: string, value: any) => {
    dispatch(setMenuForm({ [field]: value }));
  };

  // 아이콘 선택 핸들러
  const handleIconSelect = (iconName: string) => {
    handleMenuFormChange('menu_icon', iconName);
  };

  // 새 메뉴 폼 변경 핸들러
  const handleNewMenuFormChange = (field: string, value: any) => {
    setNewMenuForm(prev => {
      const newForm = { ...prev, [field]: value };
      
      // 메뉴명이 변경되면 자동으로 URL 생성
      if (field === 'menu_name' && value) {
        // Google Translate를 사용한 변환 (비동기)
        convertKoreanToEnglishWithTranslate(value).then(englishUrl => {
          console.log(`메뉴명 변환: "${value}" -> "${englishUrl}"`);
          
          // 부모 메뉴가 있으면 부모 URL + 하위 경로, 없으면 루트 경로
          let newUrl;
          if (newForm.menu_parent_id) {
            const parentMenu = menuTree.find(menu => menu.menu_id === newForm.menu_parent_id);
            newUrl = parentMenu ? `${parentMenu.menu_url}/${englishUrl}` : `/${englishUrl}`;
          } else {
            newUrl = `/${englishUrl}`;
          }
          
          setNewMenuForm(prevForm => ({
            ...prevForm,
            menu_url: newUrl
          }));
        }).catch(error => {
          console.warn('번역 실패, 로컬 매핑 사용:', error);
          // 번역 실패 시 로컬 매핑 사용
          const englishUrl = convertKoreanToEnglish(value);
          
          // 부모 메뉴가 있으면 부모 URL + 하위 경로, 없으면 루트 경로
          let newUrl;
          if (newForm.menu_parent_id) {
            const parentMenu = menuTree.find(menu => menu.menu_id === newForm.menu_parent_id);
            newUrl = parentMenu ? `${parentMenu.menu_url}/${englishUrl}` : `/${englishUrl}`;
          } else {
            newUrl = `/${englishUrl}`;
          }
          
          setNewMenuForm(prevForm => ({
            ...prevForm,
            menu_url: newUrl
          }));
        });
      }
      
      // 메뉴 타입이 변경되면 메뉴 레벨과 부모 메뉴 자동 조정
      if (field === 'menu_type') {
        if (value === 'PAGE') {
          // 페이지 타입은 최소 레벨 2 이상, 부모 메뉴 필요
          newForm.menu_level = Math.max(2, newForm.menu_level);
          // 부모 메뉴가 없으면 첫 번째 대메뉴를 자동 선택
          if (!newForm.menu_parent_id) {
            const firstParentMenu = menuTree.find(menu => menu.menu_level === 1 && menu.menu_type === 'M');
            if (firstParentMenu) {
              newForm.menu_parent_id = firstParentMenu.menu_id;
            }
          }
        } else if (value === 'MENU') {
          // 메뉴 타입은 레벨 1 가능, 부모 메뉴 없음
          newForm.menu_level = Math.max(1, newForm.menu_level);
          // 대메뉴(MENU)는 부모 메뉴가 없어야 함
          if (newForm.menu_level === 1) {
            newForm.menu_parent_id = null;
          }
        }
      }
      
      // 부모 메뉴가 변경되면 메뉴 레벨과 URL 자동 조정
      if (field === 'menu_parent_id') {
        if (value) {
          // 부모 메뉴가 있으면 부모 메뉴의 레벨 + 1
          const parentMenu = menuTree.find(menu => menu.menu_id === value);
          if (parentMenu) {
            newForm.menu_level = parentMenu.menu_level + 1;
            
            // 부모 메뉴의 URL을 기반으로 하위 URL 생성
            if (newForm.menu_name) {
              // 메뉴명이 있으면 메뉴명 기반으로 URL 생성
              convertKoreanToEnglishWithTranslate(newForm.menu_name).then(englishUrl => {
                const newUrl = `${parentMenu.menu_url}/${englishUrl}`;
                setNewMenuForm(prevForm => ({
                  ...prevForm,
                  menu_url: newUrl
                }));
              }).catch(error => {
                console.warn('번역 실패, 로컬 매핑 사용:', error);
                const englishUrl = convertKoreanToEnglish(newForm.menu_name);
                const newUrl = `${parentMenu.menu_url}/${englishUrl}`;
                setNewMenuForm(prevForm => ({
                  ...prevForm,
                  menu_url: newUrl
                }));
              });
            } else {
              // 메뉴명이 없으면 기본 하위 경로로 설정
              const newUrl = `${parentMenu.menu_url}/submenu`;
              setNewMenuForm(prevForm => ({
                ...prevForm,
                menu_url: newUrl
              }));
            }
          }
        } else {
          // 부모 메뉴가 없으면 레벨 1, URL도 루트 경로로
          newForm.menu_level = 1;
          if (newForm.menu_name) {
            convertKoreanToEnglishWithTranslate(newForm.menu_name).then(englishUrl => {
              setNewMenuForm(prevForm => ({
                ...prevForm,
                menu_url: `/${englishUrl}`
              }));
            }).catch(error => {
              console.warn('번역 실패, 로컬 매핑 사용:', error);
              const englishUrl = convertKoreanToEnglish(newForm.menu_name);
              setNewMenuForm(prevForm => ({
                ...prevForm,
                menu_url: `/${englishUrl}`
              }));
            });
          }
        }
      }
      
      return newForm;
    });
  };

  // 새 메뉴 권한 변경 핸들러
  const handleNewMenuPermissionChange = (roleId: number, permissionType: string, value: string) => {
    console.log('새 메뉴 권한 변경:', { roleId, permissionType, value });
    setNewMenuForm(prev => ({
      ...prev,
      permissions: {
        ...prev.permissions,
        [roleId]: {
          view_permission: prev.permissions[roleId]?.view_permission || 'N',
          save_permission: prev.permissions[roleId]?.save_permission || 'N',
          delete_permission: prev.permissions[roleId]?.delete_permission || 'N',
          export_permission: prev.permissions[roleId]?.export_permission || 'N',
          personal_info_permission: prev.permissions[roleId]?.personal_info_permission || 'N',
          [permissionType]: value
        }
      }
    }));
  };

  // 새 메뉴 전체 권한 변경 핸들러
  const handleNewMenuAllPermissionChange = (permissionType: string, value: string) => {
    console.log('새 메뉴 전체 권한 변경:', { permissionType, value });
    setNewMenuForm(prev => {
      const newPermissions = { ...prev.permissions };
      
      roles.forEach(role => {
        newPermissions[role.role_id] = {
          view_permission: newPermissions[role.role_id]?.view_permission || 'N',
          save_permission: newPermissions[role.role_id]?.save_permission || 'N',
          delete_permission: newPermissions[role.role_id]?.delete_permission || 'N',
          export_permission: newPermissions[role.role_id]?.export_permission || 'N',
          personal_info_permission: newPermissions[role.role_id]?.personal_info_permission || 'N',
          [permissionType]: value
        };
      });
      
      return {
        ...prev,
        permissions: newPermissions
      };
    });
  };

  // 새 메뉴 전체 롤 권한 변경 핸들러 (세로 토글)
  const handleNewMenuAllRolesPermissionChange = (value: string) => {
    console.log('새 메뉴 전체 롤 권한 변경:', { value });
    setNewMenuForm(prev => {
      const newPermissions = { ...prev.permissions };
      
      roles.forEach(role => {
        newPermissions[role.role_id] = {
          view_permission: value,
          save_permission: value,
          export_permission: value,
          delete_permission: value,
          personal_info_permission: value
        };
      });
      
      return {
        ...prev,
        permissions: newPermissions
      };
    });
  };

  // 새 메뉴 롤별 전체 권한 확인 함수
  const isNewMenuRoleAllPermissionsOn = (roleId: number): boolean => {
    const permission = newMenuForm.permissions?.[roleId];
    return Boolean(permission && 
      (permission.view_permission || 'N') === 'Y' && 
      (permission.save_permission || 'N') === 'Y' && 
      (permission.export_permission || 'N') === 'Y' && 
      (permission.delete_permission || 'N') === 'Y' && 
      (permission.personal_info_permission || 'N') === 'Y');
  };

  // 새 메뉴 롤별 전체 권한 토글 핸들러
  const handleNewMenuRoleAllPermissionsToggle = (roleId: number, isAllOn: boolean) => {
    const value = isAllOn ? 'Y' : 'N';
    console.log('새 메뉴 롤별 전체 권한 토글:', { roleId, isAllOn, value });
    
    setNewMenuForm(prev => ({
      ...prev,
      permissions: {
        ...prev.permissions,
        [roleId]: {
          ...prev.permissions[roleId],
          view_permission: value,
          save_permission: value,
          export_permission: value,
          delete_permission: value,
          personal_info_permission: value
        }
      }
    }));
  };

  // 드래그 앤 드롭 핸들러들
  const handleDragStart = (e: React.DragEvent, menu: MenuData) => {
    // 레벨 2 이상의 메뉴만 드래그 가능
    if (menu.menu_level < 2) {
      e.preventDefault();
      return;
    }
    
    setDraggedMenu(menu);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', menu.menu_id.toString());
  };

  const handleDragOver = (e: React.DragEvent, targetMenu: MenuData) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    
    if (!draggedMenu || targetMenu.menu_id === draggedMenu.menu_id) {
      return;
    }

    const rect = e.currentTarget.getBoundingClientRect();
    const y = e.clientY - rect.top;
    const height = rect.height;
    
    // 드롭 위치 결정
    let position: 'before' | 'after' | 'inside' | null = null;
    
    if (targetMenu.menu_level === 1 && targetMenu.menu_type === 'M') {
      // 대메뉴인 경우: inside (하위 메뉴로)
      position = 'inside';
    } else if (targetMenu.menu_parent_id === draggedMenu.menu_parent_id) {
      // 같은 부모인 경우: before/after (순서 변경)
      position = y < height / 2 ? 'before' : 'after';
    } else if (draggedMenu.menu_level >= 2) {
      // 다른 부모의 대메뉴인 경우: inside (부모 변경)
      if (targetMenu.menu_level === 1 && targetMenu.menu_type === 'M') {
        position = 'inside';
      }
    }
    
    if (position) {
      setDragOverMenu(targetMenu.menu_id);
      setDropPosition(position);
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    // 자식 요소로 이동하는 경우는 무시
    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
      setDragOverMenu(null);
    }
  };

  const handleDrop = async (e: React.DragEvent, targetMenu: MenuData) => {
    e.preventDefault();
    setDragOverMenu(null);
    setDropPosition(null);
    
    if (!draggedMenu || targetMenu.menu_id === draggedMenu.menu_id) {
      setDraggedMenu(null);
      return;
    }

    try {
      startLoading('메뉴 구조를 변경 중입니다...');
      
      let response;
      
      if (dropPosition === 'inside') {
        // 부모 변경
        response = await menuManagementService.updateMenuParent(
          draggedMenu.menu_id,
          targetMenu.menu_id
        );
      } else if (dropPosition === 'before' || dropPosition === 'after') {
        // 순서 변경
        response = await menuManagementService.updateMenuOrder(
          draggedMenu.menu_id,
          targetMenu.menu_id,
          dropPosition
        );
      } else {
        throw new Error('유효하지 않은 드롭 위치입니다.');
      }
      
      if (response.success) {
        // 메뉴 트리 새로고침
        await loadMenuTree();
        setSuccessMessage('메뉴 구조가 성공적으로 변경되었습니다.');
        setShowSuccessModal(true);
      } else {
        throw new Error(response.message || '메뉴 구조 변경에 실패했습니다.');
      }
    } catch (error) {
      console.error('메뉴 구조 변경 실패:', error);
      setErrorMessage(error instanceof Error ? error.message : '메뉴 구조 변경에 실패했습니다.');
      setShowErrorModal(true);
    } finally {
      stopLoading();
      setDraggedMenu(null);
    }
  };

  const handleDragEnd = () => {
    setDraggedMenu(null);
    setDragOverMenu(null);
    setDropPosition(null);
  };

  // 중복 검사 함수
  const checkDuplicateMenu = (menuName: string, menuUrl: string, menuTree: any[], excludeMenuId?: number): { nameExists: boolean; urlExists: boolean; duplicateMenu?: any } => {
    const nameExists = menuTree.some(menu => 
      menu.menu_name === menuName && menu.menu_id !== excludeMenuId
    );
    
    const urlExists = menuTree.some(menu => 
      menu.menu_url === menuUrl && menu.menu_id !== excludeMenuId
    );
    
    const duplicateMenu = menuTree.find(menu => 
      (menu.menu_name === menuName || menu.menu_url === menuUrl) && menu.menu_id !== excludeMenuId
    );
    
    return { nameExists, urlExists, duplicateMenu };
  };

  // 새 메뉴 저장
  const handleSaveNewMenu = async () => {
    try {
      startLoading('새 메뉴를 저장하는 중입니다...');
      
      // 유효성 검사
      const errors = validateMenuForm(newMenuForm);
      if (errors.length > 0) {
        setValidationErrors(errors);
        setShowValidationModal(true);
        return;
      }

      // 중복 검사
      const { nameExists, urlExists, duplicateMenu } = checkDuplicateMenu(
        newMenuForm.menu_name, 
        newMenuForm.menu_url,
        menuTree
      );
      
      if (nameExists || urlExists) {
        let errorMsg = '다음과 같은 중복이 발견되었습니다:\n';
        if (nameExists) {
          errorMsg += `• 메뉴명: "${newMenuForm.menu_name}"\n`;
        }
        if (urlExists) {
          errorMsg += `• 메뉴 URL: "${newMenuForm.menu_url}"\n`;
        }
        if (duplicateMenu) {
          errorMsg += `\n중복된 메뉴: "${duplicateMenu.menu_name}" (ID: ${duplicateMenu.menu_id})`;
        }
        errorMsg += '\n\n다른 메뉴명이나 URL을 사용해주세요.';
        
        setErrorMessage(errorMsg);
        setShowErrorModal(true);
        return;
      }

      // 새 메뉴와 권한을 함께 생성
      console.log('새 메뉴 폼 데이터:', newMenuForm);
      console.log('권한 데이터:', newMenuForm.permissions);
      
      const permissionsArray = Object.keys(newMenuForm.permissions).length > 0 
        ? Object.keys(newMenuForm.permissions).map(roleId => ({
            role_id: parseInt(roleId),
            ...newMenuForm.permissions[parseInt(roleId)]
          }))
        : []; // 빈 배열로 초기화
      
      console.log('변환된 권한 배열:', permissionsArray);
      
      const menuWithPermissions = {
        ...newMenuForm,
        permissions: permissionsArray
      };
      
      console.log('전송할 메뉴 데이터:', menuWithPermissions);
      
      const menuId = await menuManagementService.createMenuWithPermissions(menuWithPermissions);
      
      console.log('메뉴 등록 결과 - menuId:', menuId);
      
      if (menuId && menuId > 0) {
        setSuccessMessage('새 메뉴가 성공적으로 등록되었습니다.');
        setShowSuccessModal(true);
        
        // 새 메뉴 모드 종료 (Redux 상태 초기화)
        dispatch(setIsNewMenuMode(false));
        
        // 토글 버튼 상태 초기화
        setToggleResetKey(prev => prev + 1);
        
        // 메뉴 트리 새로고침
        await loadMenuTree();
      } else {
        console.error('메뉴 등록 실패 - menuId가 유효하지 않음:', menuId);
        setErrorMessage('메뉴 등록에 실패했습니다. 서버에서 유효한 메뉴 ID를 반환하지 않았습니다.');
        setShowErrorModal(true);
      }
    } catch (error) {
      console.error('새 메뉴 저장 오류:', error);
      console.error('오류 상세:', {
        message: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        name: error instanceof Error ? error.name : undefined
      });
      
      const errorMessage = error instanceof Error ? error.message : String(error);
      setErrorMessage(`메뉴 등록 중 오류가 발생했습니다: ${errorMessage}`);
      setShowErrorModal(true);
    } finally {
      stopLoading();
    }
  };

  // 새 메뉴 취소
  const handleCancelNewMenu = () => {
    // 새 메뉴 모드 종료 (Redux 상태 초기화)
    dispatch(setIsNewMenuMode(false));
    setNewMenuForm({
      menu_name: '',
      menu_description: '',
      menu_url: '',
      menu_icon: 'fas fa-folder',
      menu_order: 1,
      menu_level: 1,
      menu_parent_id: null,
      menu_type: 'MENU',
      menu_status: 'ACTIVE',
      permissions: {}
    });
    
    // 토글 버튼 상태 초기화
    setToggleResetKey(prev => prev + 1);
  };

  // 메뉴 폼 유효성 검사
  const validateMenuForm = (form: any): ValidationError[] => {
    const errors: ValidationError[] = [];

    if (!form.menu_name || form.menu_name.trim() === '') {
      errors.push({ field: 'menu_name', message: '메뉴명을 입력해주세요.' });
    }

    if (!form.menu_url || form.menu_url.trim() === '') {
      errors.push({ field: 'menu_url', message: '메뉴 URL을 입력해주세요.' });
    }

    if (form.menu_order === null || form.menu_order === undefined || form.menu_order < 0) {
      errors.push({ field: 'menu_order', message: '순서를 올바르게 입력해주세요.' });
    }

    // 페이지 타입일 때 부모 메뉴 검증
    if (form.menu_type === 'PAGE' && !form.menu_parent_id) {
      errors.push({ field: 'menu_parent_id', message: '페이지 타입의 메뉴는 부모 메뉴를 선택해야 합니다.' });
    }

    // 메뉴 레벨 검증
    if (form.menu_type === 'PAGE' && form.menu_level < 2) {
      errors.push({ field: 'menu_level', message: '페이지 타입의 메뉴는 레벨 2 이상이어야 합니다.' });
    }

    return errors;
  };

  // 메뉴 저장 (권한과 함께)
  const handleSaveMenu = async () => {
    try {
      if (!tempSavePermission.hasPermission) {
        setValidationErrors([{ field: 'permission', message: '저장 권한이 없습니다.' }]);
        setShowValidationModal(true);
        return;
      }

      // 유효성 검사
      const errors = validateMenuForm(menuForm);
      if (errors.length > 0) {
        setValidationErrors(errors);
        setShowValidationModal(true);
        return;
      }

      // 중복 검사 (기존 메뉴 수정 시)
      if (!isNewMenuMode && selectedMenu) {
        const { nameExists, urlExists, duplicateMenu } = checkDuplicateMenu(
          menuForm.menu_name, 
          menuForm.menu_url,
          menuTree,
          selectedMenu.menu_id // 현재 수정 중인 메뉴는 제외
        );
        
        if (nameExists || urlExists) {
          let errorMsg = '다음과 같은 중복이 발견되었습니다:\n';
          if (nameExists) {
            errorMsg += `• 메뉴명: "${menuForm.menu_name}"\n`;
          }
          if (urlExists) {
            errorMsg += `• 메뉴 URL: "${menuForm.menu_url}"\n`;
          }
          if (duplicateMenu) {
            errorMsg += `\n중복된 메뉴: "${duplicateMenu.menu_name}" (ID: ${duplicateMenu.menu_id})`;
          }
          errorMsg += '\n\n다른 메뉴명이나 URL을 사용해주세요.';
          
          setErrorMessage(errorMsg);
          setShowErrorModal(true);
          return;
        }
      }

      startLoading('메뉴를 저장 중입니다...');
      dispatch(setIsLoading(true));

      // 메뉴와 권한을 함께 저장
      const menuWithPermissions = {
        ...menuForm,
        permissions: menuPermissions.map(permission => ({
          role_id: permission.role_id,
          view_permission: permission.view_permission,
          save_permission: permission.save_permission,
          delete_permission: permission.delete_permission,
          export_permission: permission.export_permission,
          personal_info_permission: permission.personal_info_permission
        }))
      };

      if (isNewMenuMode) {
        await menuManagementService.createMenuWithPermissions(menuWithPermissions);
      } else {
        await menuManagementService.updateMenuWithPermissions(selectedMenu!.menu_id, menuWithPermissions);
      }

      setSuccessMessage('메뉴가 성공적으로 저장되었습니다.');
      setShowSuccessModal(true);
      dispatch(setHasUnsavedChanges(false));
      await loadMenuTree();
    } catch (error) {
      console.error('메뉴 저장 오류:', error);
      const errorMessage = error instanceof Error ? error.message : '메뉴 저장에 실패했습니다.';
      dispatch(setError(errorMessage));
      setValidationErrors([{ field: 'save', message: errorMessage }]);
      setShowValidationModal(true);
    } finally {
      stopLoading();
      dispatch(setIsLoading(false));
    }
  };

  // 메뉴 삭제
  const handleDeleteMenu = async () => {
    if (!selectedMenu) return;

    try {
      if (!tempDeletePermission.hasPermission) {
        setValidationErrors([{ field: 'permission', message: '삭제 권한이 없습니다.' }]);
        setShowValidationModal(true);
        return;
      }

      startLoading('메뉴를 삭제 중입니다...');
      dispatch(setIsLoading(true));

      // 메뉴 삭제 (권한도 함께 삭제됨 - 외래키 제약조건에 의해)
      await menuManagementService.deleteMenu(selectedMenu.menu_id);

      setSuccessMessage('메뉴가 성공적으로 삭제되었습니다.');
      setShowSuccessModal(true);
      dispatch(setSelectedMenu(null));
      dispatch(setMenuPermissions([]));
      await loadMenuTree();
    } catch (error) {
      console.error('메뉴 삭제 오류:', error);
      const errorMessage = error instanceof Error ? error.message : '메뉴 삭제에 실패했습니다.';
      dispatch(setError(errorMessage));
      setValidationErrors([{ field: 'delete', message: errorMessage }]);
      setShowValidationModal(true);
    } finally {
      stopLoading();
      dispatch(setIsLoading(false));
    }
  };


  // 메뉴 트리 렌더링 (계층 구조 지원)
  const renderMenuTree = (menus: MenuData[], level: number = 0) => {
    return menus.map((menu) => (
      <div key={menu.menu_id} className="mm-menu-tree-item">
        <div 
          className={`mm-menu-item ${selectedMenu?.menu_id === menu.menu_id ? 'selected' : ''} ${menu.menu_type === 'M' ? 'mm-menu-type-menu' : 'mm-menu-type-page'} ${dragOverMenu === menu.menu_id ? `mm-drag-over mm-drop-${dropPosition}` : ''} ${draggedMenu?.menu_id === menu.menu_id ? 'mm-dragging' : ''}`}
          style={{ paddingLeft: `${level * 20}px` }}
          onClick={() => handleMenuClick(menu)}
          draggable={menu.menu_level >= 2}
          onDragStart={(e) => handleDragStart(e, menu)}
          onDragOver={(e) => handleDragOver(e, menu)}
          onDragLeave={handleDragLeave}
          onDrop={(e) => handleDrop(e, menu)}
          onDragEnd={handleDragEnd}
        >
          <i className={`fas fa-${menu.menu_icon || 'folder'} mm-menu-icon`}></i>
          <span className="mm-menu-name">{menu.menu_name}</span>
          <span className="mm-menu-type-badge">{menu.menu_type === 'M' ? '메뉴' : '페이지'}</span>
          {menu.menu_level >= 2 && (
            <i className="fas fa-grip-vertical mm-drag-handle" title="드래그하여 메뉴 순서 변경 또는 부모 메뉴 변경"></i>
          )}
        </div>
        {/* 하위 메뉴가 있는 경우 재귀적으로 렌더링 */}
        {menu.children && menu.children.length > 0 && renderMenuTree(menu.children, level + 1)}
      </div>
    ));
  };

  // 메뉴 트리 구조 변환 (플랫 리스트를 계층 구조로)
  const buildMenuTree = (flatMenus: MenuData[]): MenuData[] => {
    const menuMap = new Map<number, MenuData>();
    const rootMenus: MenuData[] = [];

    // 모든 메뉴를 맵에 저장
    flatMenus.forEach(menu => {
      menuMap.set(menu.menu_id, { ...menu, children: [] });
    });

    // 계층 구조 구성
    flatMenus.forEach(menu => {
      const menuWithChildren = menuMap.get(menu.menu_id)!;
      
      if (menu.menu_parent_id === null) {
        // 최상위 메뉴
        rootMenus.push(menuWithChildren);
      } else {
        // 하위 메뉴
        const parent = menuMap.get(menu.menu_parent_id);
        if (parent) {
          parent.children!.push(menuWithChildren);
        }
      }
    });

    return rootMenus;
  };

  console.log('MenuManagement 렌더링 중...', { menuTree, selectedMenu, isNewMenuMode });

  return (
    <div className="mm-menu-management">
      {/* 탑 구역 - 제목 및 버튼 */}
      <div className="mm-top-section">
        <div className="mm-page-title">
          {currentTab?.menuIcon ? (
            React.createElement(getMenuIcon(currentTab.menuIcon), { size: 16 })
          ) : (
            <i className="fas fa-list"></i>
          )}
          메뉴 관리
        </div>
        
        <div className="mm-action-buttons">
          {/* 새 메뉴 버튼만 상단에 유지 */}
          {tempSavePermission.hasPermission && (
            <button className="mm-btn-new" onClick={handleNewMenu}>
              <i className="fas fa-plus"></i> 새 메뉴
            </button>
          )}
        </div>
      </div>

      {/* 메인 콘텐츠 영역 */}
      <div className="mm-main-content">
        {/* 좌측 - 메뉴 트리 */}
        <div className="mm-left-section">
          <div className="mm-section-header">
            <h2>
              <i className="fas fa-sitemap"></i>
              메뉴 구조
            </h2>
          </div>
          
          <div className="mm-menu-tree">
            {menuTree.length > 0 ? (
              renderMenuTree(buildMenuTree(menuTree))
            ) : (
              <div className="mm-no-data">메뉴가 없습니다.</div>
            )}
          </div>
        </div>

        {/* 우측 - 메뉴 상세 및 권한 관리 */}
        <div className="mm-right-section">
          {isNewMenuMode ? (
            <>
              {/* 새 메뉴 등록 폼 */}
              <div className="mm-section-header">
                <h2>
                  <i className="fas fa-plus"></i>
                  새 메뉴 등록
                </h2>
              </div>
              
              <div className="mm-menu-detail-form">
                <div className="mm-form-row">
                  <div className="mm-form-item required">
                    <label>메뉴명 <span className="required-mark">*</span></label>
                    <input
                      type="text"
                      value={newMenuForm.menu_name}
                      onChange={(e) => handleNewMenuFormChange('menu_name', e.target.value)}
                      placeholder="메뉴명을 입력하세요"
                    />
                  </div>
                  <div className="mm-form-item">
                    <label>부모 메뉴</label>
                    <select
                      value={newMenuForm.menu_parent_id || ''}
                      onChange={(e) => {
                        const parentId = e.target.value ? parseInt(e.target.value) : null;
                        handleNewMenuFormChange('menu_parent_id', parentId);
                      }}
                    >
                      <option value="">부모 메뉴 선택 (선택사항)</option>
                      {menuTree
                        .filter(menu => menu.menu_level === 1 && menu.menu_type === 'M')
                        .map(menu => (
                          <option key={menu.menu_id} value={menu.menu_id}>
                            {menu.menu_name}
                          </option>
                        ))}
                    </select>
                  </div>
                  <div className="mm-form-item">
                    <label>메뉴 URL</label>
                    <input
                      type="text"
                      value={newMenuForm.menu_url}
                      onChange={(e) => handleNewMenuFormChange('menu_url', e.target.value)}
                      placeholder="/menu-path (메뉴명 입력 시 자동 생성)"
                      className="mm-url-input"
                    />
                    {/* <div className="mm-url-help">
                      💡 메뉴명을 입력하면 자동으로 영문 URL이 생성됩니다. 부모 메뉴 선택 시 하위 경로로 구성됩니다.
                    </div> */}
                  </div>
                </div>
                
                <div className="mm-form-row">
                  <div className="mm-form-item">
                    <label>메뉴 설명</label>
                    <textarea
                      value={newMenuForm.menu_description}
                      onChange={(e) => handleNewMenuFormChange('menu_description', e.target.value)}
                      placeholder="메뉴 설명을 입력하세요"
                      rows={3}
                    />
                  </div>
                </div>
                
                <div className="mm-form-row">
                  <div className="mm-form-item">
                    <label>아이콘</label>
                    <input
                      type="text"
                      value={newMenuForm.menu_icon}
                      onChange={(e) => handleNewMenuFormChange('menu_icon', e.target.value)}
                      placeholder="fas fa-folder"
                    />
                  </div>
                  <div className="mm-form-item">
                    <label>메뉴 순서</label>
                    <input
                      type="number"
                      value={newMenuForm.menu_order}
                      onChange={(e) => handleNewMenuFormChange('menu_order', parseInt(e.target.value) || 1)}
                      min="1"
                    />
                  </div>
                  <div className="mm-form-item">
                    <label>메뉴 타입</label>
                    <select
                      value={newMenuForm.menu_type}
                      onChange={(e) => handleNewMenuFormChange('menu_type', e.target.value)}
                    >
                      <option value="MENU">메뉴</option>
                      <option value="PAGE">페이지</option>
                    </select>
                  </div>
                </div>
                
                <div className="mm-form-row">
                  <div className="mm-form-item">
                    <label>상태</label>
                    <select
                      value={newMenuForm.menu_status}
                      onChange={(e) => handleNewMenuFormChange('menu_status', e.target.value)}
                    >
                      <option value="ACTIVE">활성</option>
                      <option value="INACTIVE">비활성</option>
                    </select>
                  </div>
                  <div className="mm-form-item">
                    <label>메뉴 레벨</label>
                    <input
                      type="number"
                      value={newMenuForm.menu_level}
                      onChange={(e) => handleNewMenuFormChange('menu_level', parseInt(e.target.value) || 1)}
                      min="1"
                      max="5"
                    />
                  </div>
                </div>
              </div>
              
              {/* 롤별 메뉴권한 설정 */}
              <div className="mm-section-header">
                <h2>
                  <i className="fas fa-shield-alt"></i>
                  롤별 메뉴 권한
                </h2>
              </div>
              
              <div className="mm-permission-table-container">
                <div className="mm-permission-table-wrapper">
                  <table key={`new-menu-permissions-${toggleResetKey}`} className="mm-permission-table">
                    <thead>
                      <tr>
                        <th>
                          <div className="mm-permission-header">
                            <span>롤명</span>
                            <div className="mm-permission-switch">
                              <input
                                type="checkbox"
                                id="new-all-roles-toggle"
                                checked={roles.length > 0 && roles.every(role => {
                                  const permission = newMenuForm.permissions?.[role.role_id];
                                  return permission && 
                                    (permission.view_permission || 'N') === 'Y' && 
                                    (permission.save_permission || 'N') === 'Y' && 
                                    (permission.delete_permission || 'N') === 'Y' && 
                                    (permission.export_permission || 'N') === 'Y' && 
                                    (permission.personal_info_permission || 'N') === 'Y';
                                })}
                                onChange={(e) => handleNewMenuAllRolesPermissionChange(e.target.checked ? 'Y' : 'N')}
                              />
                              <label htmlFor="new-all-roles-toggle" className="mm-switch-label">
                                <span className="mm-switch-slider"></span>
                              </label>
                            </div>
                          </div>
                        </th>
                        <th>전체</th>
                        <th>
                          <div className="mm-permission-header">
                            <span>조회</span>
                            <div className="mm-permission-switch">
                              <input
                                type="checkbox"
                                id="new-all-view"
                                checked={roles.length > 0 && roles.every(role => (newMenuForm.permissions?.[role.role_id]?.view_permission || 'N') === 'Y')}
                                onChange={(e) => handleNewMenuAllPermissionChange('view_permission', e.target.checked ? 'Y' : 'N')}
                              />
                              <label htmlFor="new-all-view" className="mm-switch-label">
                                <span className="mm-switch-slider"></span>
                              </label>
                            </div>
                          </div>
                        </th>
                        <th>
                          <div className="mm-permission-header">
                            <span>저장</span>
                            <div className="mm-permission-switch">
                              <input
                                type="checkbox"
                                id="new-all-save"
                                checked={roles.length > 0 && roles.every(role => (newMenuForm.permissions?.[role.role_id]?.save_permission || 'N') === 'Y')}
                                onChange={(e) => handleNewMenuAllPermissionChange('save_permission', e.target.checked ? 'Y' : 'N')}
                              />
                              <label htmlFor="new-all-save" className="mm-switch-label">
                                <span className="mm-switch-slider"></span>
                              </label>
                            </div>
                          </div>
                        </th>
                        <th>
                          <div className="mm-permission-header">
                            <span>내보내기</span>
                            <div className="mm-permission-switch">
                              <input
                                type="checkbox"
                                id="new-all-export"
                                checked={roles.length > 0 && roles.every(role => (newMenuForm.permissions?.[role.role_id]?.export_permission || 'N') === 'Y')}
                                onChange={(e) => handleNewMenuAllPermissionChange('export_permission', e.target.checked ? 'Y' : 'N')}
                              />
                              <label htmlFor="new-all-export" className="mm-switch-label">
                                <span className="mm-switch-slider"></span>
                              </label>
                            </div>
                          </div>
                        </th>
                        <th>
                          <div className="mm-permission-header">
                            <span>삭제</span>
                            <div className="mm-permission-switch">
                              <input
                                type="checkbox"
                                id="new-all-delete"
                                checked={roles.length > 0 && roles.every(role => (newMenuForm.permissions?.[role.role_id]?.delete_permission || 'N') === 'Y')}
                                onChange={(e) => handleNewMenuAllPermissionChange('delete_permission', e.target.checked ? 'Y' : 'N')}
                              />
                              <label htmlFor="new-all-delete" className="mm-switch-label">
                                <span className="mm-switch-slider"></span>
                              </label>
                            </div>
                          </div>
                        </th>
                        <th>
                          <div className="mm-permission-header">
                            <span>개인정보조회</span>
                            <div className="mm-permission-switch">
                              <input
                                type="checkbox"
                                id="new-all-personal"
                                checked={roles.length > 0 && roles.every(role => (newMenuForm.permissions?.[role.role_id]?.personal_info_permission || 'N') === 'Y')}
                                onChange={(e) => handleNewMenuAllPermissionChange('personal_info_permission', e.target.checked ? 'Y' : 'N')}
                              />
                              <label htmlFor="new-all-personal" className="mm-switch-label">
                                <span className="mm-switch-slider"></span>
                              </label>
                            </div>
                          </div>
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {roles.map(role => (
                        <tr key={role.role_id}>
                          <td className="mm-role-name">{role.role_name}</td>
                          <td className="mm-permission-cell">
                            <div className="mm-permission-switch mm-all-permission-switch">
                              <input
                                type="checkbox"
                                id={`new-all-${role.role_id}`}
                                checked={isNewMenuRoleAllPermissionsOn(role.role_id)}
                                onChange={(e) => handleNewMenuRoleAllPermissionsToggle(role.role_id, e.target.checked)}
                              />
                              <label htmlFor={`new-all-${role.role_id}`} className="mm-switch-label">
                                <span className="mm-switch-slider"></span>
                              </label>
                            </div>
                          </td>
                          <td className="mm-permission-cell">
                            <div className="mm-permission-switch">
                              <input
                                type="checkbox"
                                id={`new-view-${role.role_id}`}
                                checked={newMenuForm.permissions?.[role.role_id]?.view_permission === 'Y' || false}
                                onChange={(e) => handleNewMenuPermissionChange(role.role_id, 'view_permission', e.target.checked ? 'Y' : 'N')}
                              />
                              <label htmlFor={`new-view-${role.role_id}`} className="mm-switch-label">
                                <span className="mm-switch-slider"></span>
                              </label>
                            </div>
                          </td>
                          <td className="mm-permission-cell">
                            <div className="mm-permission-switch">
                              <input
                                type="checkbox"
                                id={`new-save-${role.role_id}`}
                                checked={newMenuForm.permissions?.[role.role_id]?.save_permission === 'Y' || false}
                                onChange={(e) => handleNewMenuPermissionChange(role.role_id, 'save_permission', e.target.checked ? 'Y' : 'N')}
                              />
                              <label htmlFor={`new-save-${role.role_id}`} className="mm-switch-label">
                                <span className="mm-switch-slider"></span>
                              </label>
                            </div>
                          </td>
                          <td className="mm-permission-cell">
                            <div className="mm-permission-switch">
                              <input
                                type="checkbox"
                                id={`new-delete-${role.role_id}`}
                                checked={newMenuForm.permissions?.[role.role_id]?.delete_permission === 'Y' || false}
                                onChange={(e) => handleNewMenuPermissionChange(role.role_id, 'delete_permission', e.target.checked ? 'Y' : 'N')}
                              />
                              <label htmlFor={`new-delete-${role.role_id}`} className="mm-switch-label">
                                <span className="mm-switch-slider"></span>
                              </label>
                            </div>
                          </td>
                          <td className="mm-permission-cell">
                            <div className="mm-permission-switch">
                              <input
                                type="checkbox"
                                id={`new-export-${role.role_id}`}
                                checked={newMenuForm.permissions?.[role.role_id]?.export_permission === 'Y' || false}
                                onChange={(e) => handleNewMenuPermissionChange(role.role_id, 'export_permission', e.target.checked ? 'Y' : 'N')}
                              />
                              <label htmlFor={`new-export-${role.role_id}`} className="mm-switch-label">
                                <span className="mm-switch-slider"></span>
                              </label>
                            </div>
                          </td>
                          <td className="mm-permission-cell">
                            <div className="mm-permission-switch">
                              <input
                                type="checkbox"
                                id={`new-personal-${role.role_id}`}
                                checked={newMenuForm.permissions?.[role.role_id]?.personal_info_permission === 'Y' || false}
                                onChange={(e) => handleNewMenuPermissionChange(role.role_id, 'personal_info_permission', e.target.checked ? 'Y' : 'N')}
                              />
                              <label htmlFor={`new-personal-${role.role_id}`} className="mm-switch-label">
                                <span className="mm-switch-slider"></span>
                              </label>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
              
              {/* 새 메뉴 등록 버튼 */}
              <div className="mm-menu-action-panel">
                <div className="mm-panel-buttons">
                  {/* 취소 버튼 - 왼쪽 */}
                  <button 
                    className="mm-btn-cancel" 
                    onClick={handleCancelNewMenu}
                  >
                    <i className="fas fa-times"></i> 취소
                  </button>
                  
                  {/* 저장 버튼 - 오른쪽 */}
                  <button 
                    className="mm-btn-save" 
                    onClick={handleSaveNewMenu}
                  >
                    <i className="fas fa-save"></i> 저장
                  </button>
                </div>
              </div>
            </>
          ) : selectedMenu ? (
            <>
              {/* 메뉴 상세 정보 */}
              <div className="mm-section-header">
                <h2>
                  <i className="fas fa-edit"></i>
                  메뉴 상세 정보
                </h2>
              </div>
              
              <div className="mm-menu-detail-form">
                <div className="mm-form-row">
                  <div className="mm-form-item required">
                    <label>메뉴명</label>
                    <input
                      type="text"
                      value={menuForm.menu_name}
                      onChange={(e) => handleMenuFormChange('menu_name', e.target.value)}
                      placeholder="메뉴명을 입력하세요"
                    />
                  </div>
                  <div className="mm-form-item required">
                    <label>메뉴 URL</label>
                    <input
                      type="text"
                      value={menuForm.menu_url}
                      onChange={(e) => handleMenuFormChange('menu_url', e.target.value)}
                      placeholder="메뉴 URL을 입력하세요"
                    />
                  </div>
                </div>
                
                <div className="mm-form-row">
                  <div className="mm-form-item">
                    <label>메뉴 설명</label>
                    <textarea
                      value={menuForm.menu_description}
                      onChange={(e) => handleMenuFormChange('menu_description', e.target.value)}
                      placeholder="메뉴 설명을 입력하세요"
                      rows={3}
                    />
                  </div>
                </div>
                
                <div className="mm-form-row">
                  <div className="mm-form-item">
                    <label>아이콘</label>
                    <div className="mm-icon-selector">
                      <button
                        type="button"
                        className="mm-icon-select-btn"
                        onClick={() => setShowIconSelector(true)}
                      >
                        {menuForm.menu_icon ? (
                          <>
                            {React.createElement(getMenuIcon(menuForm.menu_icon), { size: 16 })}
                            <span>{menuForm.menu_icon}</span>
                          </>
                        ) : (
                          <span>아이콘을 선택하세요</span>
                        )}
                      </button>
                    </div>
                  </div>
                  <div className="mm-form-item">
                    <label>순서</label>
                    <input
                      type="number"
                      value={menuForm.menu_order}
                      onChange={(e) => handleMenuFormChange('menu_order', parseInt(e.target.value) || 0)}
                      min="0"
                    />
                  </div>
                </div>
                
                <div className="mm-form-row">
                  <div className="mm-form-item">
                    <label>메뉴 타입</label>
                    <select
                      value={menuForm.menu_type}
                      onChange={(e) => handleMenuFormChange('menu_type', e.target.value)}
                    >
                      <option value="M">메뉴</option>
                      <option value="P">페이지</option>
                    </select>
                  </div>
                  <div className="mm-form-item">
                    <label>상태</label>
                    <select
                      value={menuForm.menu_status}
                      onChange={(e) => handleMenuFormChange('menu_status', e.target.value)}
                    >
                      <option value="A">활성</option>
                      <option value="I">비활성</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* 롤별 권한 관리 */}
              <div className="mm-section-header">
                <h2>
                  <i className="fas fa-shield-alt"></i>
                  롤별 메뉴 권한
                </h2>
              </div>
              
              <div className="mm-permission-table-container">
                {menuPermissions && menuPermissions.length > 0 ? (
                  <div className="mm-permission-table-wrapper">
                    <table key={`existing-menu-permissions-${selectedMenu?.menu_id || 'none'}`} className="mm-permission-table">
                      <thead>
                        <tr>
                          <th>
                            <div className="mm-permission-header">
                              <span>롤명</span>
                              <div className="mm-permission-switch">
                                <input
                                  type="checkbox"
                                  id="all-roles-toggle"
                                  checked={menuPermissions.length > 0 && menuPermissions.every(permission => 
                                    (permission.view_permission || 'N') === 'Y' && 
                                    (permission.save_permission || 'N') === 'Y' && 
                                    (permission.export_permission || 'N') === 'Y' && 
                                    (permission.delete_permission || 'N') === 'Y' && 
                                    (permission.personal_info_permission || 'N') === 'Y'
                                  )}
                                  onChange={(e) => handleAllRolesPermissionChange(e.target.checked ? 'Y' : 'N')}
                                />
                                <label htmlFor="all-roles-toggle" className="mm-switch-label">
                                  <span className="mm-switch-slider"></span>
                                </label>
                              </div>
                            </div>
                          </th>
                          <th>전체</th>
                          <th>
                            <div className="mm-permission-header">
                              <span>조회</span>
                              <div className="mm-permission-switch">
                                <input
                                  type="checkbox"
                                  id="existing-all-view"
                                  checked={menuPermissions.length > 0 && menuPermissions.every(permission => (permission.view_permission || 'N') === 'Y')}
                                  onChange={(e) => handleAllPermissionChange('view_permission', e.target.checked ? 'Y' : 'N')}
                                />
                                <label htmlFor="existing-all-view" className="mm-switch-label">
                                  <span className="mm-switch-slider"></span>
                                </label>
                              </div>
                            </div>
                          </th>
                          <th>
                            <div className="mm-permission-header">
                              <span>저장</span>
                              <div className="mm-permission-switch">
                                <input
                                  type="checkbox"
                                  id="existing-all-save"
                                  checked={menuPermissions.length > 0 && menuPermissions.every(permission => (permission.save_permission || 'N') === 'Y')}
                                  onChange={(e) => handleAllPermissionChange('save_permission', e.target.checked ? 'Y' : 'N')}
                                />
                                <label htmlFor="existing-all-save" className="mm-switch-label">
                                  <span className="mm-switch-slider"></span>
                                </label>
                              </div>
                            </div>
                          </th>
                          <th>
                            <div className="mm-permission-header">
                              <span>내보내기</span>
                              <div className="mm-permission-switch">
                                <input
                                  type="checkbox"
                                  id="existing-all-export"
                                  checked={menuPermissions.length > 0 && menuPermissions.every(permission => (permission.export_permission || 'N') === 'Y')}
                                  onChange={(e) => handleAllPermissionChange('export_permission', e.target.checked ? 'Y' : 'N')}
                                />
                                <label htmlFor="existing-all-export" className="mm-switch-label">
                                  <span className="mm-switch-slider"></span>
                                </label>
                              </div>
                            </div>
                          </th>
                          <th>
                            <div className="mm-permission-header">
                              <span>삭제</span>
                              <div className="mm-permission-switch">
                                <input
                                  type="checkbox"
                                  id="existing-all-delete"
                                  checked={menuPermissions.length > 0 && menuPermissions.every(permission => (permission.delete_permission || 'N') === 'Y')}
                                  onChange={(e) => handleAllPermissionChange('delete_permission', e.target.checked ? 'Y' : 'N')}
                                />
                                <label htmlFor="existing-all-delete" className="mm-switch-label">
                                  <span className="mm-switch-slider"></span>
                                </label>
                              </div>
                            </div>
                          </th>
                          <th>
                            <div className="mm-permission-header">
                              <span>개인정보조회</span>
                              <div className="mm-permission-switch">
                                <input
                                  type="checkbox"
                                  id="existing-all-personal"
                                  checked={menuPermissions.length > 0 && menuPermissions.every(permission => (permission.personal_info_permission || 'N') === 'Y')}
                                  onChange={(e) => handleAllPermissionChange('personal_info_permission', e.target.checked ? 'Y' : 'N')}
                                />
                                <label htmlFor="existing-all-personal" className="mm-switch-label">
                                  <span className="mm-switch-slider"></span>
                                </label>
                              </div>
                            </div>
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {menuPermissions.map((permission, index) => (
                          <tr key={permission.role_id || index}>
                            <td className="mm-role-name">{permission.role_name}</td>
                            <td className="mm-permission-cell">
                              <div className="mm-permission-switch mm-all-permission-switch">
                                <input
                                  type="checkbox"
                                  id={`all-${permission.role_id}`}
                                  checked={isRoleAllPermissionsOn(permission.role_id)}
                                  onChange={(e) => handleRoleAllPermissionsToggle(permission.role_id, e.target.checked)}
                                />
                                <label htmlFor={`all-${permission.role_id}`} className="mm-switch-label">
                                  <span className="mm-switch-slider"></span>
                                </label>
                              </div>
                            </td>
                            <td className="mm-permission-cell">
                              <div className="mm-permission-switch">
                                <input
                                  type="checkbox"
                                  id={`view-${permission.role_id}`}
                                  checked={(permission.view_permission || 'N') === 'Y'}
                                  onChange={(e) => handlePermissionChange(permission.role_id, 'view_permission', e.target.checked ? 'Y' : 'N')}
                                />
                                <label htmlFor={`view-${permission.role_id}`} className="mm-switch-label">
                                  <span className="mm-switch-slider"></span>
                                </label>
                              </div>
                            </td>
                            <td className="mm-permission-cell">
                              <div className="mm-permission-switch">
                                <input
                                  type="checkbox"
                                  id={`save-${permission.role_id}`}
                                  checked={(permission.save_permission || 'N') === 'Y'}
                                  onChange={(e) => handlePermissionChange(permission.role_id, 'save_permission', e.target.checked ? 'Y' : 'N')}
                                />
                                <label htmlFor={`save-${permission.role_id}`} className="mm-switch-label">
                                  <span className="mm-switch-slider"></span>
                                </label>
                              </div>
                            </td>
                            <td className="mm-permission-cell">
                              <div className="mm-permission-switch">
                                <input
                                  type="checkbox"
                                  id={`export-${permission.role_id}`}
                                  checked={(permission.export_permission || 'N') === 'Y'}
                                  onChange={(e) => handlePermissionChange(permission.role_id, 'export_permission', e.target.checked ? 'Y' : 'N')}
                                />
                                <label htmlFor={`export-${permission.role_id}`} className="mm-switch-label">
                                  <span className="mm-switch-slider"></span>
                                </label>
                              </div>
                            </td>
                            <td className="mm-permission-cell">
                              <div className="mm-permission-switch">
                                <input
                                  type="checkbox"
                                  id={`delete-${permission.role_id}`}
                                  checked={(permission.delete_permission || 'N') === 'Y'}
                                  onChange={(e) => handlePermissionChange(permission.role_id, 'delete_permission', e.target.checked ? 'Y' : 'N')}
                                />
                                <label htmlFor={`delete-${permission.role_id}`} className="mm-switch-label">
                                  <span className="mm-switch-slider"></span>
                                </label>
                              </div>
                            </td>
                            <td className="mm-permission-cell">
                              <div className="mm-permission-switch">
                                <input
                                  type="checkbox"
                                  id={`personal-${permission.role_id}`}
                                  checked={(permission.personal_info_permission || 'N') === 'Y'}
                                  onChange={(e) => handlePermissionChange(permission.role_id, 'personal_info_permission', e.target.checked ? 'Y' : 'N')}
                                />
                                <label htmlFor={`personal-${permission.role_id}`} className="mm-switch-label">
                                  <span className="mm-switch-slider"></span>
                                </label>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="mm-no-data">
                    <i className="fas fa-info-circle"></i>
                    <span>권한 데이터가 없습니다</span>
                  </div>
                )}
              </div>

              {/* 메뉴 관리 버튼 패널 */}
              <div className="mm-menu-action-panel">
                <div className="mm-panel-buttons">
                  {/* 삭제 버튼 - 왼쪽 */}
                  {tempDeletePermission.hasPermission && selectedMenu && (
                    <button 
                      className="mm-btn-delete" 
                      onClick={() => {
                        setConfirmationMessage(`"${selectedMenu.menu_name}" 메뉴를 삭제하시겠습니까?`);
                        setConfirmationAction(() => handleDeleteMenu);
                        setShowConfirmationModal(true);
                      }}
                    >
                      <i className="fas fa-trash"></i> 삭제
                    </button>
                  )}
                  
                  {/* 저장 버튼 - 오른쪽 */}
                  {tempSavePermission.hasPermission && (
                    <button 
                      className={`mm-btn-save ${!hasUnsavedChanges ? 'mm-btn-disabled' : ''}`}
                      onClick={handleSaveMenu}
                      disabled={!hasUnsavedChanges}
                    >
                      <i className="fas fa-save"></i> 저장
                    </button>
                  )}
                </div>
              </div>
            </>
          ) : (
            <div className="mm-no-selection">
              <i className="fas fa-mouse-pointer"></i>
              <p>좌측에서 메뉴를 선택하거나 새 메뉴를 추가하세요.</p>
            </div>
          )}
        </div>
      </div>

      {/* 모달들 */}
      <ValidationModal
        isOpen={showValidationModal}
        onClose={() => setShowValidationModal(false)}
        errors={validationErrors}
      />

      <ConfirmationModal
        isOpen={showConfirmationModal}
        onConfirm={() => {
          if (confirmationAction) {
            confirmationAction();
          }
          setShowConfirmationModal(false);
        }}
        onCancel={() => setShowConfirmationModal(false)}
        message={confirmationMessage}
        type="delete"
      />

      <UnsavedChangesModal
        isOpen={showUnsavedChangesModal}
        onCancel={() => setShowUnsavedChangesModal(false)}
        onDiscard={() => {
          setShowUnsavedChangesModal(false);
          setHasUnsavedChanges(false);
        }}
        onSave={() => {
          setShowUnsavedChangesModal(false);
          handleSaveMenu();
        }}
      />

      <SuccessModal
        isOpen={showSuccessModal}
        onClose={() => setShowSuccessModal(false)}
        message={successMessage}
        type="save"
      />

      <ValidationModal
        isOpen={showErrorModal}
        onClose={() => setShowErrorModal(false)}
        errors={[{ field: 'error', message: errorMessage }]}
      />

      {/* 아이콘 선택 모달 */}
      <IconSelectorModal
        isOpen={showIconSelector}
        onClose={() => setShowIconSelector(false)}
        onSelect={handleIconSelect}
        currentIcon={menuForm.menu_icon}
      />
    </div>
  );
};

export default MenuManagement;
