import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { AgGridReact } from 'ag-grid-react';
import 'ag-grid-community/styles/ag-theme-alpine.css';
import CommonMultiSelect from './CommonMultiSelect';
import { userManagementService } from '../services/userManagementService';
import { 
  ValidationModal, 
  ConfirmationModal, 
  UnsavedChangesModal,
  SuccessModal,
  type ValidationError 
} from './common';
import { useGlobalLoading } from '../contexts/LoadingContext';
import { getMenuIcon } from '../utils/menuUtils';
import { 
  setSearchCondition, 
  resetSearchCondition,
  setUserList, 
  setSelectedUser, 
  setIsNewMode, 
  setIsLoading, 
  setCodeData, 
  updateUserDetail, 
  initializeScreen,
  resetUserDetail,
  setTotalCount,
  setCurrentPage,
  setError,
  setPermissions,
  setHasUnsavedChanges,
  type UserData, 
  type SearchCondition,
  type UserDetail,
  type CommonCodeOption
} from '../store/userManagementSlice';
import { RootState, AppDispatch } from '../store/store';
import { useButtonTextPermission } from '../hooks/usePermissions';
import { MENU_IDS } from '../constants/menuIds';
import './UserManagement.css';

const UserManagement: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { startLoading, stopLoading } = useGlobalLoading();
  
  // Redux 상태 선택
  const {
    userList,
    selectedUser,
    userDetail,
    searchCondition,
    roleOptions,
    agentOptions,
    storeOptions,
    isLoading,
    isNewMode,
    hasUnsavedChanges,
    totalCount,
    currentPage,
    totalPages,
    error,
    permissions
  } = useSelector((state: RootState) => state.userManagement);
  
  // 현재 활성 탭 정보 가져오기
  const { tabs, activeTabId } = useSelector((state: RootState) => state.tabs);
  const currentTab = tabs.find(tab => tab.id === activeTabId);

  // 권한 체크 (사용자관리 메뉴 ID 상수 사용)
  const viewPermission = useButtonTextPermission(MENU_IDS.USER_MANAGEMENT, '조회');
  const savePermission = useButtonTextPermission(MENU_IDS.USER_MANAGEMENT, '저장');
  const deletePermission = useButtonTextPermission(MENU_IDS.USER_MANAGEMENT, '삭제');
  const exportPermission = useButtonTextPermission(MENU_IDS.USER_MANAGEMENT, '내보내기');
  const personalInfoPermission = useButtonTextPermission(MENU_IDS.USER_MANAGEMENT, '개인정보');

  // 상태 관리
  const [showValidationModal, setShowValidationModal] = useState(false);
  const [showConfirmationModal, setShowConfirmationModal] = useState(false);
  const [showUnsavedChangesModal, setShowUnsavedChangesModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [validationErrors, setValidationErrors] = useState<ValidationError[]>([]);
  const [confirmationMessage, setConfirmationMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showUnlockModal, setShowUnlockModal] = useState(false);

  // 그리드 선택 변경 핸들러
  const onSelectionChanged = useCallback(() => {
    // 그리드에서 선택된 행이 있으면 처리
  }, []);

  // 계정 잠금 해제 핸들러
  const handleUnlockAccount = useCallback(async () => {
    if (!selectedUser) {
      alert('사용자를 선택해주세요.');
      return;
    }

    try {
      console.log('🔓 계정 잠금 해제 시작:', { 
        userId: selectedUser.user_id, 
        userName: selectedUser.user_name,
        userLoginId: selectedUser.user_login_id,
        selectedUser: selectedUser
      });
      
      // userId 검증
      if (!selectedUser.user_id) {
        alert('사용자 ID가 없습니다. 사용자를 다시 선택해주세요.');
        setShowUnlockModal(false);
        return;
      }
      
      startLoading('계정 잠금을 해제하는 중입니다...');
      
      const result = await userManagementService.unlockUserAccount(selectedUser.user_id);
      
      console.log('🔓 계정 잠금 해제 결과:', result);
      
      if (result.success) {
        setSuccessMessage(`사용자 "${selectedUser.user_name}"의 계정 잠금이 해제되었습니다.`);
        setShowSuccessModal(true);
        setShowUnlockModal(false);
        
        // 사용자 목록 새로고침 - 직접 API 호출
        try {
          const refreshResult = await userManagementService.getUserList({
            ...searchCondition,
            pageSize: 1000,
            pageNum: 1,
          });
          dispatch(setUserList(refreshResult.userList));
          dispatch(setTotalCount(refreshResult.totalCount));
        } catch (refreshError) {
          console.error('사용자 목록 새로고침 오류:', refreshError);
        }
      } else {
        alert(`계정 잠금 해제에 실패했습니다: ${result.message}`);
        setShowUnlockModal(false); // 실패 시에도 팝업 닫기
      }
    } catch (error) {
      console.error('계정 잠금 해제 오류:', error);
      alert(`계정 잠금 해제 중 오류가 발생했습니다: ${error instanceof Error ? error.message : String(error)}`);
      setShowUnlockModal(false); // 오류 시에도 팝업 닫기
    } finally {
      stopLoading();
    }
  }, [selectedUser, startLoading, stopLoading, searchCondition, dispatch]);

  // 사용자 상세 정보 로드
  const loadUserDetail = useCallback(async (userId: number) => {
    try {
      startLoading('사용자 정보를 조회 중입니다...');
      
      const userDetail = await userManagementService.getUserDetail(userId);
      dispatch(resetUserDetail());
      dispatch(updateUserDetail(userDetail));
      dispatch(setHasUnsavedChanges(false)); // 로드 시에는 변경사항 없음
      dispatch(setIsNewMode(false));
    } catch (error) {
      console.error('사용자 상세 정보 로드 오류:', error);
      dispatch(setError(error instanceof Error ? error.message : '사용자 상세 정보 로드에 실패했습니다.'));
    } finally {
      stopLoading();
    }
  }, [startLoading, stopLoading]);

  // 그리드 행 클릭 핸들러 (한 번 클릭)
  const onRowClicked = useCallback((event: any) => {
    const userData = event.data as UserData;
    dispatch(setSelectedUser(userData));
    loadUserDetail(userData.user_id);
  }, [loadUserDetail]);

  // 그리드 행 더블클릭 핸들러
  const onRowDoubleClicked = useCallback((event: any) => {
    const userData = event.data as UserData;
    dispatch(setSelectedUser(userData));
    loadUserDetail(userData.user_id);
  }, [loadUserDetail]);

  // 그리드 컬럼 정의
  const columnDefs = [
    {
      headerName: '사용자ID',
      field: 'user_id',
      width: 80,
      sortable: true,
      filter: true,
    },
    {
      headerName: '롤명',
      field: 'role_name',
      width: 100,
      sortable: true,
      filter: true,
    },
    {
      headerName: '로그인ID',
      field: 'user_login_id',
      width: 120,
      sortable: true,
      filter: true,
    },
    {
      headerName: '사용자명',
      field: 'user_name',
      width: 120,
      sortable: true,
      filter: true,
    },
    {
      headerName: '이메일',
      field: 'user_email',
      width: 180,
      sortable: true,
      filter: true,
    },
    {
      headerName: '전화번호',
      field: 'user_phone',
      width: 120,
      sortable: true,
      filter: true,
    },
    {
      headerName: '부서',
      field: 'user_department',
      width: 100,
      sortable: true,
      filter: true,
    },
    {
      headerName: '직급',
      field: 'user_position',
      width: 80,
      sortable: true,
      filter: true,
    },
    {
      headerName: '상태',
      field: 'user_status',
      width: 80,
      sortable: true,
      filter: true,
      cellRenderer: (params: any) => {
        const status = params.value;
        const statusClass = status === 'A' ? 'active' : status === 'I' ? 'inactive' : 'deleted';
        const statusText = status === 'A' ? '활성' : status === 'I' ? '비활성' : '삭제';
        
        // React 컴포넌트로 반환
        return React.createElement('span', {
          className: `status-badge ${statusClass}`,
          style: {
            padding: '4px 8px',
            borderRadius: '4px',
            fontSize: '12px',
            fontWeight: 'bold',
            color: status === 'A' ? '#28a745' : status === 'I' ? '#ffc107' : '#dc3545',
            backgroundColor: status === 'A' ? '#d4edda' : status === 'I' ? '#fff3cd' : '#f8d7da',
            border: `1px solid ${status === 'A' ? '#c3e6cb' : status === 'I' ? '#ffeaa7' : '#f5c6cb'}`
          }
        }, statusText);
      },
    },
            {
              headerName: '계정잠금',
              field: 'user_login_fail_count',
              width: 100,
              sortable: true,
              filter: true,
              cellRenderer: (params: any) => {
                const failCount = params.data?.user_login_fail_count || 0;
                const isLocked = failCount >= 5; // 5회 이상 실패 시 잠금으로 간주
                
                if (isLocked) {
                  return React.createElement('div', {
                    style: {
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '2px'
                    }
                  }, [
                    React.createElement('span', {
                      key: 'lock-status',
                      style: {
                        padding: '2px 6px',
                        borderRadius: '4px',
                        fontSize: '11px',
                        fontWeight: 'bold',
                        color: '#dc3545',
                        backgroundColor: '#f8d7da',
                        border: '1px solid #f5c6cb'
                      }
                    }, '🔒 잠김'),
                    React.createElement('span', {
                      key: 'lock-reason',
                      style: {
                        fontSize: '10px',
                        color: '#6c757d',
                        maxWidth: '90px',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap'
                      },
                      title: '로그인 실패 횟수 초과'
                    }, '실패횟수 초과'),
                    React.createElement('span', {
                      key: 'lock-count',
                      style: {
                        fontSize: '10px',
                        color: '#dc3545'
                      }
                    }, `실패 ${failCount}회`)
                  ]);
                } else if (failCount > 0) {
                  return React.createElement('div', {
                    style: {
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '2px'
                    }
                  }, [
                    React.createElement('span', {
                      key: 'warning-status',
                      style: {
                        padding: '2px 6px',
                        borderRadius: '4px',
                        fontSize: '11px',
                        fontWeight: 'bold',
                        color: '#856404',
                        backgroundColor: '#fff3cd',
                        border: '1px solid #ffeaa7'
                      }
                    }, '⚠️ 주의'),
                    React.createElement('span', {
                      key: 'fail-count',
                      style: {
                        fontSize: '10px',
                        color: '#856404'
                      }
                    }, `실패 ${failCount}회`)
                  ]);
                } else {
                  return React.createElement('span', {
                    style: {
                      padding: '2px 6px',
                      borderRadius: '4px',
                      fontSize: '11px',
                      fontWeight: 'bold',
                      color: '#28a745',
                      backgroundColor: '#d4edda',
                      border: '1px solid #c3e6cb'
                    }
                  }, '🔓 정상');
                }
              },
            },
    {
      headerName: '마지막 로그인',
      field: 'user_last_login_date',
      width: 140,
      sortable: true,
      filter: true,
      cellRenderer: (params: any) => {
        return params.value ? new Date(params.value).toLocaleString('ko-KR') : '-';
      },
    },
    {
      headerName: '생성일',
      field: 'user_created_date',
      width: 140,
      sortable: true,
      filter: true,
      cellRenderer: (params: any) => {
        return params.value ? new Date(params.value).toLocaleString('ko-KR') : '-';
      },
    },
  ];

  // 그리드 옵션
  const gridOptions = {
    rowSelection: 'single',
    onSelectionChanged: onSelectionChanged,
    onRowClicked: onRowClicked,
    onRowDoubleClicked: onRowDoubleClicked,
    pagination: true,
    paginationPageSize: 50,
    paginationPageSizeSelector: [10, 20, 50, 100],
  };

  // 컴포넌트 마운트 시 초기화
  useEffect(() => {
    // 강제로 상태 초기화
    dispatch(resetUserDetail());
    dispatch(setIsNewMode(true));
    dispatch(setSelectedUser(null));
    dispatch(setHasUnsavedChanges(false));
    
    initializeComponent();
  }, []);

  // 권한 설정
  useEffect(() => {
    loadPermissions();
  }, []);

  // 공통 코드 로드
  useEffect(() => {
    loadCommonCodes();
  }, []);

  // 초기화 함수
  const initializeComponent = async () => {
    dispatch(initializeScreen());
    dispatch(resetSearchCondition()); // 검색 조건 초기화 (모든 상태의 사용자 조회)
    await loadUserList();
  };

  // 권한 로드
  const loadPermissions = async () => {
    try {
      const userPermissions = await userManagementService.getUserPermissions();
      dispatch(setPermissions(userPermissions));
    } catch (error) {
      console.error('권한 로드 오류:', error);
    }
  };

  // 공통 코드 로드
  const loadCommonCodes = async () => {
    try {
      const [roleOptions, agentOptions, storeOptions] = await Promise.all([
        userManagementService.getRoleOptions(),
        userManagementService.getAgentOptions(),
        userManagementService.getStoreOptions(),
      ]);

      dispatch(setCodeData({
        roleOptions,
        agentOptions,
        storeOptions,
      }));
    } catch (error) {
      console.error('공통 코드 로드 오류:', error);
      // 공통 코드 로드 실패 시 빈 배열로 설정
      dispatch(setCodeData({
        roleOptions: [],
        agentOptions: [],
        storeOptions: [],
      }));
    }
  };

  // 사용자 목록 로드
  const loadUserList = useCallback(async () => {
    try {
      startLoading('사용자 목록을 조회 중입니다...');
      dispatch(setError(null));

      // AgGrid 내장 페이지네이션 사용으로 모든 데이터를 한 번에 로드
      const result = await userManagementService.getUserList({
        ...searchCondition,
        pageSize: 1000, // 큰 값으로 설정하여 모든 데이터 로드
        pageNum: 1,
      });
      
      dispatch(setUserList(result.userList));
      dispatch(setTotalCount(result.totalCount));
    } catch (error) {
      console.error('사용자 목록 로드 오류:', error);
      dispatch(setError(error instanceof Error ? error.message : '사용자 목록 로드에 실패했습니다.'));
    } finally {
      stopLoading();
    }
  }, [searchCondition, startLoading, stopLoading, dispatch]);

  // 검색 조건 변경 핸들러
  const handleSearchConditionChange = (field: keyof SearchCondition, value: any) => {
    dispatch(setSearchCondition({ [field]: value }));
  };

  // 검색 실행
  const handleSearch = useCallback(async () => {
    if (!viewPermission.hasPermission) {
      setValidationErrors([{ field: 'permission', message: '조회 권한이 없습니다.' }]);
      setShowValidationModal(true);
      return;
    }

    await loadUserList();
  }, [viewPermission.hasPermission, searchCondition]);

  // 새 사용자 모드
  const handleNew = useCallback(() => {
    if (hasUnsavedChanges) {
      setShowUnsavedChangesModal(true);
      return;
    }

    dispatch(resetUserDetail());
    dispatch(setSelectedUser(null));
    dispatch(setIsNewMode(true)); // 새 모드로 설정
  }, [hasUnsavedChanges]);

  // 사용자 삭제
  const handleDelete = useCallback(async () => {
    if (!selectedUser) {
      setValidationErrors([{ field: 'selection', message: '삭제할 사용자를 선택해주세요.' }]);
      setShowValidationModal(true);
      return;
    }

    if (!deletePermission.hasPermission) {
      setValidationErrors([{ field: 'permission', message: '삭제 권한이 없습니다.' }]);
      setShowValidationModal(true);
      return;
    }

    setConfirmationMessage(`사용자 "${selectedUser.user_name}"을(를) 삭제하시겠습니까?`);
    setShowConfirmationModal(true);
  }, [selectedUser, deletePermission.hasPermission]);

  // 삭제 확인
  const handleDeleteConfirm = async () => {
    if (!selectedUser) return;

    try {
      startLoading('사용자를 삭제 중입니다...');
      
      const success = await userManagementService.deleteUser(selectedUser.user_id, 1); // TODO: 실제 사용자 ID로 변경
      
      if (success) {
        setSuccessMessage('사용자가 성공적으로 삭제되었습니다.');
        setShowSuccessModal(true);
        await loadUserList();
        dispatch(setSelectedUser(null));
        dispatch(resetUserDetail());
      } else {
        throw new Error('사용자 삭제에 실패했습니다.');
      }
    } catch (error) {
      console.error('사용자 삭제 오류:', error);
      setValidationErrors([{ field: 'delete', message: error instanceof Error ? error.message : '사용자 삭제에 실패했습니다.' }]);
      setShowValidationModal(true);
    } finally {
      stopLoading();
      setShowConfirmationModal(false);
    }
  };

  // 사용자 저장
  const handleSave = useCallback(async () => {
    if (!savePermission.hasPermission) {
      setValidationErrors([{ field: 'permission', message: '저장 권한이 없습니다.' }]);
      setShowValidationModal(true);
      return;
    }

    // 유효성 검사
    const errors = validateUserDetail(userDetail);
    if (errors.length > 0) {
      setValidationErrors(errors);
      setShowValidationModal(true);
      return;
    }

    try {
      startLoading(isNewMode ? '사용자를 등록 중입니다...' : '사용자를 수정 중입니다...');

      if (isNewMode) {
        // 새 사용자 등록
        const userId = await userManagementService.createUser({
          ...userDetail,
          user_created_by: 1, // TODO: 실제 사용자 ID로 변경
        });
        
        setSuccessMessage('사용자가 성공적으로 등록되었습니다.');
      } else {
        // 사용자 수정
        const success = await userManagementService.updateUser({
          ...userDetail,
          user_updated_by: 1, // TODO: 실제 사용자 ID로 변경
        });
        
        if (!success) {
          throw new Error('사용자 수정에 실패했습니다.');
        }
        
        setSuccessMessage('사용자가 성공적으로 수정되었습니다.');
      }

      setShowSuccessModal(true);
      dispatch(setHasUnsavedChanges(false));
      await loadUserList();
    } catch (error) {
      console.error('사용자 저장 오류:', error);
      setValidationErrors([{ field: 'save', message: error instanceof Error ? error.message : '사용자 저장에 실패했습니다.' }]);
      setShowValidationModal(true);
    } finally {
      stopLoading();
    }
  }, [savePermission.hasPermission, userDetail, isNewMode, startLoading, stopLoading]);

  // 사용자 상세 정보 변경 핸들러
  const handleUserDetailChange = (field: keyof UserDetail, value: any) => {
    dispatch(updateUserDetail({ [field]: value }));
  };

  // 유효성 검사 함수
  const validateUserDetail = (userDetail: UserDetail): ValidationError[] => {
    const errors: ValidationError[] = [];

    if (!userDetail.user_role_id) {
      errors.push({ field: 'user_role_id', message: '롤을 선택해주세요.' });
    }

    if (!userDetail.user_login_id.trim()) {
      errors.push({ field: 'user_login_id', message: '로그인 ID를 입력해주세요.' });
    }

    if (!userDetail.user_name.trim()) {
      errors.push({ field: 'user_name', message: '사용자명을 입력해주세요.' });
    }

    if (!userDetail.user_email.trim()) {
      errors.push({ field: 'user_email', message: '이메일을 입력해주세요.' });
    } else if (!isValidEmail(userDetail.user_email)) {
      errors.push({ field: 'user_email', message: '올바른 이메일 형식을 입력해주세요.' });
    }

    if (isNewMode && !userDetail.user_password.trim()) {
      errors.push({ field: 'user_password', message: '비밀번호를 입력해주세요.' });
    }

    // 롤별 필수 필드 검사
    if (userDetail.user_role_id === 4 && !userDetail.Store_id) { // 매장직원
      errors.push({ field: 'Store_id', message: '소속 매장을 선택해주세요.' });
    }

    if (userDetail.user_role_id === 5 && !userDetail.Agent_id) { // 거래업체
      errors.push({ field: 'Agent_id', message: '소속 업체를 선택해주세요.' });
    }

    return errors;
  };

  // 이메일 유효성 검사
  const isValidEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  // 로그인 ID 중복 확인
  const handleLoginIdCheck = async () => {
    if (!userDetail.user_login_id.trim()) return;

    try {
      const isDuplicate = await userManagementService.checkLoginIdDuplicate(
        userDetail.user_login_id,
        userDetail.user_id || undefined
      );

      if (isDuplicate) {
        setValidationErrors([{ field: 'user_login_id', message: '이미 사용 중인 로그인 ID입니다.' }]);
        setShowValidationModal(true);
      } else {
        setSuccessMessage('사용 가능한 로그인 ID입니다.');
        setShowSuccessModal(true);
      }
    } catch (error) {
      console.error('로그인 ID 중복 확인 오류:', error);
      setValidationErrors([{ field: 'user_login_id', message: '로그인 ID 중복 확인에 실패했습니다.' }]);
      setShowValidationModal(true);
    }
  };

  // 비밀번호 표시/숨김 토글
  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  // 페이지 변경 핸들러 (AgGrid 내장 페이지네이션 사용으로 제거)
  // const handlePageChange = (newPage: number) => {
  //   dispatch(setCurrentPage(newPage));
  //   dispatch(setSearchCondition({ pageNum: newPage }));
  //   loadUserList();
  // };

  return (
    <div className="user-management">
      {/* 탑 구역 - 검색 조건 및 버튼 */}
      <div className="top-section">
        <h1 className="page-title">
          {currentTab?.menuIcon ? (
            React.createElement(getMenuIcon(currentTab.menuIcon), { size: 16 })
          ) : (
            <i className="fas fa-users"></i>
          )}
          사용자관리
        </h1>
        
        <div className="search-conditions">
          <div className="search-row">
            <div className="search-item">
              <CommonMultiSelect
                label="롤"
                options={roleOptions}
                selectedValues={searchCondition.userRoleId.map(String)}
                onSelectionChange={(values) => handleSearchConditionChange('userRoleId', values.map(Number))}
                placeholder="롤을 선택하세요"
              />
            </div>
            <div className="search-item">
              <CommonMultiSelect
                label="상태"
                options={[
                  { value: 'A', label: '활성' },
                  { value: 'I', label: '비활성' },
                  { value: 'D', label: '삭제' },
                ]}
                selectedValues={searchCondition.userStatus}
                onSelectionChange={(values) => handleSearchConditionChange('userStatus', values)}
                placeholder="상태를 선택하세요"
              />
            </div>
            <div className="search-item">
              <CommonMultiSelect
                label="업체"
                options={agentOptions}
                selectedValues={searchCondition.agentId}
                onSelectionChange={(values) => handleSearchConditionChange('agentId', values)}
                placeholder="업체를 선택하세요"
              />
            </div>
            <div className="search-item">
              <CommonMultiSelect
                label="매장"
                options={storeOptions}
                selectedValues={searchCondition.storeId}
                onSelectionChange={(values) => handleSearchConditionChange('storeId', values)}
                placeholder="매장을 선택하세요"
              />
            </div>
          </div>
          <div className="search-row">
            <div className="search-item inline-label">
              <label>사용자명:</label>
              <input 
                type="text" 
                value={searchCondition.userName}
                onChange={(e) => handleSearchConditionChange('userName', e.target.value)}
                placeholder="사용자명을 입력하세요"
              />
            </div>
            <div className="search-item inline-label">
              <label>로그인ID:</label>
              <input 
                type="text" 
                value={searchCondition.userLoginId}
                onChange={(e) => handleSearchConditionChange('userLoginId', e.target.value)}
                placeholder="로그인ID를 입력하세요"
              />
            </div>
          </div>
        </div>
        
        <div className="action-buttons">
          <div className="left-buttons">
            {/* 삭제 버튼 - 삭제 권한 체크 */}
            {deletePermission.hasPermission && (
              <button className="btn-delete" onClick={handleDelete}>
                <i className="fas fa-trash"></i> 삭제
              </button>
            )}
            {/* 계정 잠금 해제 버튼 - 저장 권한 체크 */}
            {savePermission.hasPermission && selectedUser && (selectedUser.user_login_fail_count || 0) >= 5 && (
              <button className="btn-unlock" onClick={() => setShowUnlockModal(true)}>
                <i className="fas fa-unlock"></i> 계정잠금해제
              </button>
            )}
          </div>
          <div className="right-buttons">
            {/* 초기화 버튼 - 권한 체크 없음 */}
            <button className="btn-new" onClick={handleNew}>
              <i className="fas fa-undo"></i> 초기화
            </button>
            {/* 조회 버튼 - 조회 권한 체크 */}
            {viewPermission.hasPermission && (
              <button className="btn-search" onClick={handleSearch}>
                <i className="fas fa-search"></i> 조회
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 메인 구역 - 레프트(그리드) + 라이트(상세정보) */}
      <div className="main-section">
        {/* 레프트 구역 - 사용자 목록 그리드 */}
        <div className="left-section">
          <h3>
            <i className="fas fa-list"></i>
            사용자 목록
          </h3>
          <div className="grid-container">
            <div className="ag-theme-alpine">
              <AgGridReact
                rowData={userList}
                columnDefs={columnDefs}
                gridOptions={gridOptions}
                animateRows={false}
                rowHeight={26}
                headerHeight={34}
                suppressMovableColumns={true}
                suppressHorizontalScroll={false}
                noRowsOverlayComponent={() => (
                  <div className="ag-overlay-no-rows-center">
                    <div>조회된 데이터가 없습니다</div>
                  </div>
                )}
              />
            </div>
          </div>
        </div>

        {/* 라이트 구역 - 사용자 상세 정보 */}
        <div className="right-section">
          <h3>
            <i className="fas fa-edit"></i>
            사용자 상세 정보
          </h3>
          <div className="user-detail-container">
            <div className="detail-section">
              <div className="form-row">
                <div className="form-item required">
                  <label>롤</label>
                  <select
                    value={userDetail.user_role_id || ''}
                    onChange={(e) => handleUserDetailChange('user_role_id', e.target.value ? Number(e.target.value) : null)}
                  >
                    <option value="">롤을 선택하세요</option>
                    {roleOptions.map(option => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="form-item">
                  <label>상태</label>
                  <select
                    value={userDetail.user_status}
                    onChange={(e) => handleUserDetailChange('user_status', e.target.value)}
                  >
                    <option value="A">활성</option>
                    <option value="I">비활성</option>
                    <option value="D">삭제</option>
                  </select>
                </div>
              </div>

            {/* 계정 잠금 정보 섹션 */}
            <div className="form-row">
              <div className="form-item full-width">
                <label>계정 잠금 상태</label>
                <div className="account-lock-info">
                  {(() => {
                    const failCount = userDetail.user_login_fail_count || 0;
                    const isLocked = failCount >= 5; // 5회 이상 실패 시 잠금으로 간주
                    
                    if (isLocked) {
                      return (
                        <div className="lock-status locked">
                          <div className="lock-header">
                            <span className="lock-icon">🔒</span>
                            <span className="lock-text">계정 잠김</span>
                          </div>
                          <div className="lock-reason">
                            <strong>잠금 사유:</strong> 로그인 실패 횟수 초과
                          </div>
                          <div className="lock-count">
                            <strong>로그인 실패:</strong> {failCount}회
                          </div>
                          {userDetail.user_last_login_date && (
                            <div className="lock-time">
                              <strong>마지막 로그인:</strong> {new Date(userDetail.user_last_login_date).toLocaleString('ko-KR')}
                            </div>
                          )}
                        </div>
                      );
                    } else if (failCount > 0) {
                      return (
                        <div className="lock-status warning">
                          <div className="lock-header">
                            <span className="lock-icon">⚠️</span>
                            <span className="lock-text">주의</span>
                          </div>
                          <div className="lock-count">
                            <strong>로그인 실패:</strong> {failCount}회
                          </div>
                          {userDetail.user_last_login_date && (
                            <div className="lock-time">
                              <strong>마지막 로그인:</strong> {new Date(userDetail.user_last_login_date).toLocaleString('ko-KR')}
                            </div>
                          )}
                        </div>
                      );
                    } else {
                      return (
                        <div className="lock-status normal">
                          <span className="lock-icon">🔓</span>
                          <span className="lock-text">정상</span>
                          {userDetail.user_last_login_date && (
                            <div className="lock-time">
                              <strong>마지막 로그인:</strong> {new Date(userDetail.user_last_login_date).toLocaleString('ko-KR')}
                            </div>
                          )}
                        </div>
                      );
                    }
                  })()}
                </div>
              </div>
            </div>

              <div className="form-row">
                <div className="form-item required">
                  <label>로그인 ID</label>
                  <input
                    type="text"
                    value={userDetail.user_login_id}
                    onChange={(e) => handleUserDetailChange('user_login_id', e.target.value)}
                    placeholder="로그인 ID를 입력하세요"
                    onBlur={handleLoginIdCheck}
                  />
                </div>
                <div className="form-item required">
                  <label>사용자명</label>
                  <input
                    type="text"
                    value={userDetail.user_name}
                    onChange={(e) => handleUserDetailChange('user_name', e.target.value)}
                    placeholder="사용자명을 입력하세요"
                  />
                </div>
              </div>

              <div className="form-row">
                 <div className="form-item required">
                   <label>이메일</label>
                   <input
                     type="email"
                     value={userDetail.user_email}
                     onChange={(e) => handleUserDetailChange('user_email', e.target.value)}
                     placeholder="이메일을 입력하세요"
                     autoComplete="off"
                   />
                 </div>
                <div className="form-item required">
                  <label>비밀번호</label>
                  <div className="password-field">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={userDetail.user_password}
                      onChange={(e) => handleUserDetailChange('user_password', e.target.value)}
                      placeholder="비밀번호를 입력하세요"
                      autoComplete="new-password"
                      key={`password-${isNewMode ? 'new' : 'edit'}`}
                    />
                    {/* <button
                      type="button"
                      className="password-toggle"
                      onClick={togglePasswordVisibility}
                    >
                      <i className={`fas ${showPassword ? 'fa-eye-slash' : 'fa-eye'}`}></i>
                    </button> */}
                  </div>
                </div>
              </div>

              <div className="form-row">
                <div className="form-item">
                  <label>전화번호</label>
                  <input
                    type="tel"
                    value={userDetail.user_phone}
                    onChange={(e) => handleUserDetailChange('user_phone', e.target.value)}
                    placeholder="전화번호를 입력하세요"
                  />
                </div>
                <div className="form-item">
                  <label>성별</label>
                  <select
                    value={userDetail.user_gender}
                    onChange={(e) => handleUserDetailChange('user_gender', e.target.value)}
                  >
                    <option value="">성별을 선택하세요</option>
                    <option value="M">남성</option>
                    <option value="F">여성</option>
                  </select>
                </div>
              </div>

              <div className="form-row">
                <div className="form-item">
                  <label>생년월일</label>
                  <input
                    type="date"
                    value={userDetail.user_birth_date}
                    onChange={(e) => handleUserDetailChange('user_birth_date', e.target.value)}
                  />
                </div>
                <div className="form-item">
                  <label>부서</label>
                  <input
                    type="text"
                    value={userDetail.user_department}
                    onChange={(e) => handleUserDetailChange('user_department', e.target.value)}
                    placeholder="부서를 입력하세요"
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-item">
                  <label>직급</label>
                  <input
                    type="text"
                    value={userDetail.user_position}
                    onChange={(e) => handleUserDetailChange('user_position', e.target.value)}
                    placeholder="직급을 입력하세요"
                  />
                </div>
                <div className="form-item">
                  <label>소속 업체</label>
                  <select
                    value={userDetail.Agent_id || ''}
                    onChange={(e) => handleUserDetailChange('Agent_id', e.target.value || null)}
                    disabled={userDetail.user_role_id !== 5}
                  >
                    <option value="">업체를 선택하세요</option>
                    {agentOptions.map(option => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="form-row">
                <div className="form-item">
                  <label>소속 매장</label>
                  <select
                    value={userDetail.Store_id || ''}
                    onChange={(e) => handleUserDetailChange('Store_id', e.target.value || null)}
                    disabled={userDetail.user_role_id !== 4}
                  >
                    <option value="">매장을 선택하세요</option>
                    {storeOptions.map(option => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="form-item">
                  <label>주소</label>
                  <input
                    type="text"
                    value={userDetail.user_address}
                    onChange={(e) => handleUserDetailChange('user_address', e.target.value)}
                    placeholder="주소를 입력하세요"
                  />
                </div>
              </div>


            </div>
          </div>
          
          {/* 하단 버튼 영역 */}
          <div className="bottom-buttons">
            <div className="left-buttons">
              {/* 추가 버튼들 (필요시) */}
            </div>
            <div className="right-buttons">
              {/* 저장 버튼 - 저장 권한 체크 */}
              {savePermission.hasPermission && (
                <button className="btn-save" onClick={handleSave}>
                  <i className="fas fa-save"></i> 저장
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 모달들 */}
      {/* <ValidationModal
        isOpen={showValidationModal}
        onClose={() => setShowValidationModal(false)}
        errors={validationErrors}
      />

      <ConfirmationModal
        isOpen={showConfirmationModal}
        onClose={() => setShowConfirmationModal(false)}
        onConfirm={handleDeleteConfirm}
        message={confirmationMessage}
      />

       <UnsavedChangesModal
         isOpen={showUnsavedChangesModal}
         onClose={() => setShowUnsavedChangesModal(false)}
         onConfirm={() => {
           setShowUnsavedChangesModal(false);
           dispatch(resetUserDetail());
           dispatch(setSelectedUser(null));
           dispatch(setIsNewMode(true)); // 새 모드로 설정
         }}
       />

      <SuccessModal
        isOpen={showSuccessModal}
        onClose={() => setShowSuccessModal(false)}
        message={successMessage}
      />

      {/* 계정 잠금 해제 확인 모달 */}
      <ConfirmationModal
        isOpen={showUnlockModal}
        onClose={() => setShowUnlockModal(false)}
        onConfirm={handleUnlockAccount}
        message={`사용자 "${selectedUser?.userName || ''}"의 계정 잠금을 해제하시겠습니까?`}
        type="unlock"
      />
    </div>
  );
};

export default UserManagement;
