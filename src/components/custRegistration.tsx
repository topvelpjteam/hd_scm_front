import React, { useEffect, useState, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { AgGridReact } from 'ag-grid-react';
import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-alpine.css';
import CommonMultiSelect from './CommonMultiSelect';
import { commonCodeService, CommonCodeOption } from '../services/commonCodeService';
import { 
  ValidationModal, 
  ConfirmationModal, 
  UnsavedChangesModal,
  SuccessModal,
  type ValidationError 
} from './common';
import { getMenuIcon } from '../utils/menuUtils';
import { 
  setSearchCondition, 
  setCustomerData, 
  setSelectedCustomer, 
  setIsNewMode, 
  setGridData,
  updateCustomerDetail, 
  initializeScreen 
} from '../store/custRegistrationSlice';
import type { CustomerData, SearchCondition } from '../store/custRegistrationSlice';
import { RootState, AppDispatch } from '../store/store';
import './custRegistration.css';

const CustRegistration: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  
  // Redux 상태 가져오기
  const {
    searchCondition,
    customerData,
    selectedCustomer,
    isNewMode,
    gridData
  } = useSelector((state: RootState) => state.custRegistration);

  // 현재 로그인한 사용자 정보
  // const { user } = useSelector((state: RootState) => state.auth);
  // const currentUserId = user?.userId || 'ADMIN'; // TODO: 백엔드 연동 시 사용
  
  // 현재 활성 탭 정보
  const { tabs, activeTabId } = useSelector((state: RootState) => state.tabs);
  const currentTab = tabs.find(tab => tab.id === activeTabId);
  
  // 로컬 상태 관리
  const [isGridReady, setIsGridReady] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  // 공통코드 옵션 상태
  const [custGbnOptions, setCustGbnOptions] = useState<CommonCodeOption[]>([]);
  const [nationGbnOptions, setNationGbnOptions] = useState<CommonCodeOption[]>([]);

  // 원본 데이터 저장 (변경 추적용)
  const [_originalData, setOriginalData] = useState<CustomerData | null>(null);

  // 모달 상태 관리
  const [validationModal, setValidationModal] = useState<{
    isOpen: boolean;
    errors: ValidationError[];
  }>({ isOpen: false, errors: [] });
  
  const [confirmationModal, setConfirmationModal] = useState<{
    isOpen: boolean;
    type: 'save' | 'update' | 'delete';
    onConfirm: () => void;
  }>({ isOpen: false, type: 'save', onConfirm: () => {} });
  
  const [unsavedChangesModal, setUnsavedChangesModal] = useState<{
    isOpen: boolean;
    onProceed: () => void;
  }>({ isOpen: false, onProceed: () => {} });
  
  const [successModal, setSuccessModal] = useState<{
    isOpen: boolean;
    type: 'save' | 'update' | 'delete';
    message?: string;
    details?: string;
  }>({ isOpen: false, type: 'save' });

  // 공통코드 로드 함수
  const loadCommonCodes = useCallback(async () => {
    try {
      const [custGbnData, nationGbnData] = await Promise.all([
        commonCodeService.getCustGbn(),
        commonCodeService.getNationGbn()
      ]);

      setCustGbnOptions(custGbnData);
      setNationGbnOptions(nationGbnData);
      
      console.log('공통코드 로드 완료:', { custGbnData, nationGbnData });
    } catch (error) {
      console.error('공통코드 로드 오류:', error);
    }
  }, []);

  // 이메일 관련 상태
  const [emailId, setEmailId] = useState('');
  const [emailDomain, setEmailDomain] = useState('');
  const [isCustomDomain, setIsCustomDomain] = useState(false);

  // 이메일 도메인 옵션
  const emailDomainOptions = [
    { value: 'naver.com', label: 'naver.com' },
    { value: 'gmail.com', label: 'gmail.com' },
    { value: 'daum.net', label: 'daum.net' },
    { value: 'hanmail.net', label: 'hanmail.net' },
    { value: 'kakao.com', label: 'kakao.com' },
    { value: 'nate.com', label: 'nate.com' },
    { value: 'hotmail.com', label: 'hotmail.com' },
    { value: 'outlook.com', label: 'outlook.com' },
    { value: 'yahoo.com', label: 'yahoo.com' },
    { value: 'custom', label: '직접입력' }
  ];

  // 휴대폰 번호 포맷 함수
  const formatPhoneNumber = (value: string) => {
    // 숫자만 추출
    const numbers = value.replace(/[^0-9]/g, '');
    
    // 길이에 따라 포맷 적용
    if (numbers.length <= 3) {
      return numbers;
    } else if (numbers.length <= 7) {
      return `${numbers.slice(0, 3)}-${numbers.slice(3)}`;
    } else if (numbers.length <= 11) {
      return `${numbers.slice(0, 3)}-${numbers.slice(3, 7)}-${numbers.slice(7)}`;
    }
    // 11자리 초과시 11자리까지만
    return `${numbers.slice(0, 3)}-${numbers.slice(3, 7)}-${numbers.slice(7, 11)}`;
  };

  // 휴대폰 번호 변경 핸들러
  const handlePhoneChange = (value: string) => {
    const formatted = formatPhoneNumber(value);
    handleCustomerDataChange('C_HP', formatted);
  };

  // 이메일 조합 함수
  const combineEmail = useCallback((id: string, domain: string) => {
    if (id && domain) {
      return `${id}@${domain}`;
    }
    return '';
  }, []);

  // 이메일 아이디 변경
  const handleEmailIdChange = (value: string) => {
    setEmailId(value);
    const fullEmail = combineEmail(value, emailDomain);
    handleCustomerDataChange('C_EMAIL', fullEmail);
  };

  // 이메일 도메인 선택 변경
  const handleEmailDomainSelectChange = (value: string) => {
    if (value === 'custom') {
      setIsCustomDomain(true);
      setEmailDomain('');
      handleCustomerDataChange('C_EMAIL', emailId ? `${emailId}@` : '');
    } else {
      setIsCustomDomain(false);
      setEmailDomain(value);
      const fullEmail = combineEmail(emailId, value);
      handleCustomerDataChange('C_EMAIL', fullEmail);
    }
  };

  // 이메일 도메인 직접 입력 변경
  const handleEmailDomainInputChange = (value: string) => {
    setEmailDomain(value);
    const fullEmail = combineEmail(emailId, value);
    handleCustomerDataChange('C_EMAIL', fullEmail);
  };

  // 우편번호 검색 함수
  const handleSearchZipCode = useCallback(() => {
    new (window as any).daum.Postcode({
      oncomplete: function(data: any) {
        // 우편번호와 주소 정보를 받아서 상태 업데이트
        let fullAddress = data.address; // 기본 주소
        let extraAddress = ''; // 참고 항목

        // 건물명이 있고, 공동주택일 경우 추가
        if (data.addressType === 'R') {
          if (data.bname !== '') {
            extraAddress += data.bname;
          }
          if (data.buildingName !== '') {
            extraAddress += (extraAddress !== '' ? ', ' + data.buildingName : data.buildingName);
          }
          // 참고항목이 있을 경우 괄호 추가
          fullAddress += (extraAddress !== '' ? ' (' + extraAddress + ')' : '');
        }

        // 우편번호와 주소를 상태에 저장
        handleCustomerDataChange('ZIP_ID', data.zonecode);
        handleCustomerDataChange('C_ADDR1', fullAddress);
        
        console.log('우편번호 검색 완료:', {
          zonecode: data.zonecode,
          address: fullAddress
        });
      },
      theme: {
        bgColor: '#FFFFFF',
        searchBgColor: '#0B65C8',
        contentBgColor: '#FFFFFF',
        pageBgColor: '#FFFFFF',
        textColor: '#333333',
        queryTextColor: '#FFFFFF',
        postcodeTextColor: '#FA4256',
        emphTextColor: '#008BD3',
        outlineColor: '#E0E0E0'
      },
      width: '100%',
      height: '100%'
    }).open();
  }, []);  // handleCustomerDataChange는 안정적이므로 의존성 제외

  // 그리드 컬럼 정의
  const columnDefs: any[] = [
    { 
      headerName: '고객구분명', 
      field: 'CUST_GBN_NM', 
      width: 90, 
      minWidth: 80,
      sortable: true,
      filter: true
    },
    { 
      headerName: '고객명', 
      field: 'CUST_NM', 
      width: 150, 
      minWidth: 120, 
      flex: 1,
      sortable: true,
      filter: true
    },
    { 
      headerName: '성별', 
      field: 'GENDER_GBN', 
      width: 70, 
      minWidth: 60,
      sortable: true,
      filter: true,
      valueFormatter: (params: any) => params.value === 'M' ? '남성' : params.value === 'F' ? '여성' : ''
    },
    { 
      headerName: '휴대폰', 
      field: 'C_HP', 
      width: 120, 
      minWidth: 100,
      sortable: true,
      filter: true
    },
    { 
      headerName: '이메일', 
      field: 'C_EMAIL', 
      width: 180, 
      minWidth: 150,
      sortable: true,
      filter: true
    },
    { 
      headerName: '가입일자', 
      field: 'CUST_OPEN_D', 
      width: 100, 
      minWidth: 90,
      sortable: true,
      filter: true,
      valueFormatter: (params: any) => {
        const dateValue = params.value;
        if (!dateValue) return '';
        if (typeof dateValue === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(dateValue)) {
          return dateValue;
        }
        return '';
      }
    },
    { 
      headerName: '고객코드', 
      field: 'CUST_ID', 
      width: 90, 
      minWidth: 80,
      sortable: true,
      filter: true
    }
  ];

  // 공통코드 로드 및 AG Grid 초기화
  useEffect(() => {
    const initializeData = async () => {
      try {
        await loadCommonCodes();
        setTimeout(() => {
          setIsGridReady(true);
        }, 100);
      } catch (error) {
        console.error('데이터 초기화 실패:', error);
      }
    };

    initializeData();
    
    // 화면 초기화
    dispatch(initializeScreen());
    dispatch(setIsNewMode(true));
    
    // 초기 데이터 설정
    dispatch(setSelectedCustomer({
      CUST_ID: 0,
      CUST_NM: '',
      CUST_GBN: 'Z',
      NATION_ID: '',
      C_HP: '',
      C_EMAIL: '',
      ZIP_ID: '',
      C_ADDR1: '',
      C_ADDR2: '',
      CUST_BIRTH_D: '',
      CUST_D_GBN: 'S',
      CUST_OPEN_D: new Date().toISOString().split('T')[0],
      CUST_HOBB: '',
      CUST_DATA: '',
      EMAIL_CHK: 'N',
      DM_CHK: 'N',
      SMS_CHK: 'N',
      CALL_CHK: 'N',
      GENDER_GBN: 'M',
      MNG_STAFF: ''
    }));
    
    dispatch(setCustomerData({
      CUST_ID: 0,
      CUST_NM: '',
      CUST_GBN: 'Z',
      GENDER_GBN: 'M',
      EMAIL_CHK: 'N',
      DM_CHK: 'N',
      SMS_CHK: 'N',
      CALL_CHK: 'N',
      CUST_OPEN_D: new Date().toISOString().split('T')[0]
    }));
    
    setOriginalData(null);
  }, [dispatch, loadCommonCodes]);

  // 변경사항 확인 함수
  const hasUnsavedChanges = useCallback(() => {
    if (!customerData) return false;
    if (!isNewMode) return false;
    
    // 의미있는 데이터가 입력되었는지 체크 (기본값 제외)
    const hasData = (customerData.CUST_NM?.trim() && customerData.CUST_NM !== '') || 
                   (customerData.C_HP?.trim() && customerData.C_HP !== '') || 
                   (customerData.C_EMAIL?.trim() && customerData.C_EMAIL !== '') ||
                   (customerData.C_ADDR1?.trim() && customerData.C_ADDR1 !== '') ||
                   (customerData.C_ADDR2?.trim() && customerData.C_ADDR2 !== '') ||
                   (customerData.ZIP_ID?.trim() && customerData.ZIP_ID !== '') ||
                   (customerData.CUST_HOBB?.trim() && customerData.CUST_HOBB !== '') ||
                   (customerData.CUST_DATA?.trim() && customerData.CUST_DATA !== '') ||
                   (customerData.MNG_STAFF?.trim() && customerData.MNG_STAFF !== '') ||
                   (customerData.CUST_BIRTH_D && customerData.CUST_BIRTH_D !== '') ||
                   // 기본값이 아닌 경우만 체크
                   (customerData.CUST_GBN && customerData.CUST_GBN !== 'Z') ||
                   (customerData.GENDER_GBN && customerData.GENDER_GBN !== 'M') ||
                   (customerData.EMAIL_CHK === 'Y') ||
                   (customerData.DM_CHK === 'Y') ||
                   (customerData.SMS_CHK === 'Y') ||
                   (customerData.CALL_CHK === 'Y');
    
    return hasData;
  }, [customerData, isNewMode]);

  // 신규 작업 수행
  const performNew = useCallback(() => {
    dispatch(setIsNewMode(true));
    
    dispatch(setSelectedCustomer({
      CUST_ID: 0,
      CUST_NM: '',
      CUST_GBN: 'Z',
      GENDER_GBN: 'M',
      EMAIL_CHK: 'N',
      DM_CHK: 'N',
      SMS_CHK: 'N',
      CALL_CHK: 'N',
      CUST_OPEN_D: new Date().toISOString().split('T')[0]
    }));
    
    dispatch(setCustomerData({
      CUST_ID: 0,
      CUST_NM: '',
      CUST_GBN: 'Z',
      GENDER_GBN: 'M',
      EMAIL_CHK: 'N',
      DM_CHK: 'N',
      SMS_CHK: 'N',
      CALL_CHK: 'N',
      CUST_OPEN_D: new Date().toISOString().split('T')[0]
    }));
    
    setOriginalData(null);
    
    // 이메일 필드 초기화
    setEmailId('');
    setEmailDomain('');
    setIsCustomDomain(false);
  }, [dispatch]);

  // 신규 버튼 클릭
  const handleNew = useCallback(() => {
    if (hasUnsavedChanges()) {
      setUnsavedChangesModal({
        isOpen: true,
        onProceed: performNew
      });
    } else {
      performNew();
    }
  }, [hasUnsavedChanges, performNew]);

  // 검색 조건 변경 핸들러
  const handleSearchConditionChange = (field: keyof SearchCondition, value: string | string[]) => {
    dispatch(setSearchCondition({ [field]: value }));
  };

  // 고객 데이터 변경 핸들러
  const handleCustomerDataChange = (field: keyof CustomerData, value: any) => {
    dispatch(setCustomerData({ [field]: value }));
    if (selectedCustomer) {
      dispatch(updateCustomerDetail({ field, value }));
    }
  };

  // 검색 실행 (백엔드 연동은 나중에 구현)
  const handleSearch = async () => {
    try {
      setIsLoading(true);
      console.log('검색 조건:', searchCondition);
      
      // TODO: 백엔드 API 호출
      // const results = await customerService.searchCustomers(searchCondition);
      // dispatch(setGridData(results));
      
      // 임시: 빈 배열 설정
      dispatch(setGridData([]));
      
      console.log('검색 완료');
    } catch (error) {
      console.error('검색 실패:', error);
      setValidationModal({
        isOpen: true,
        errors: [{ field: 'general', message: `검색에 실패했습니다: ${error instanceof Error ? error.message : '알 수 없는 오류'}` }]
      });
    } finally {
      setIsLoading(false);
    }
  };

  // 저장 버튼 클릭
  const handleSave = () => {
    if (!customerData) {
      alert('저장할 고객 정보가 없습니다.');
      return;
    }

    // 필수입력 체크
    const requiredFields = [
      { field: 'CUST_NM', name: '고객명' }
    ];

    const errors: ValidationError[] = [];
    
    requiredFields.forEach(({ field, name }) => {
      const value = (customerData as any)[field];
      if (!value || (typeof value === 'string' && value.trim() === '')) {
        errors.push({
          field,
          fieldName: name,
          message: `${name}은(는) 필수 입력 항목입니다.`
        });
      }
    });

    if (errors.length > 0) {
      setValidationModal({
        isOpen: true,
        errors
      });
      return;
    }

    const isUpdate = customerData.CUST_ID && Number(customerData.CUST_ID) > 0;
    setConfirmationModal({
      isOpen: true,
      type: isUpdate ? 'update' : 'save',
      onConfirm: performSave
    });
  };

  // 실제 저장 로직 (백엔드 연동은 나중에 구현)
  const performSave = async () => {
    if (!customerData) {
      alert('저장할 고객 정보가 없습니다.');
      return;
    }
    
    try {
      console.log('고객 저장 시작:', customerData);
      
      // TODO: 백엔드 API 호출
      // const result = await customerService.saveCustomer({
      //   ...customerData,
      //   USER_ID: currentUserId
      // });
      
      // 임시: 성공 처리
      const isUpdate = customerData.CUST_ID && Number(customerData.CUST_ID) > 0;
      
      setSuccessModal({
        isOpen: true,
        type: isUpdate ? 'update' : 'save',
        message: '고객이 성공적으로 저장되었습니다.',
        details: isUpdate ? '고객 정보가 업데이트되었습니다.' : '새로운 고객이 등록되었습니다.'
      });
      
      setConfirmationModal({ isOpen: false, type: 'save', onConfirm: () => {} });
      
      if (isNewMode) {
        await handleSearch();
      } else {
        await handleSearch();
      }
    } catch (error) {
      console.error('저장 오류:', error);
      setValidationModal({
        isOpen: true,
        errors: [{ field: 'general', message: `저장 중 오류가 발생했습니다: ${error instanceof Error ? error.message : '알 수 없는 오류'}` }]
      });
      setConfirmationModal({ isOpen: false, type: 'save', onConfirm: () => {} });
    }
  };

  // 삭제
  const handleDelete = () => {
    if (isNewMode) {
      setValidationModal({
        isOpen: true,
        errors: [{ field: 'general', message: '신규 등록 모드에서는 삭제할 수 없습니다.' }]
      });
      return;
    }

    setConfirmationModal({
      isOpen: true,
      type: 'delete',
      onConfirm: performDelete
    });
  };

  // 실제 삭제 로직 (백엔드 연동은 나중에 구현)
  const performDelete = async () => {
    if (!customerData || !customerData.CUST_ID) {
      alert('삭제할 고객 정보가 없습니다.');
      return;
    }

    try {
      console.log('고객 삭제 시작:', customerData.CUST_ID);
      
      // TODO: 백엔드 API 호출
      // const result = await customerService.deleteCustomer(customerData.CUST_ID, currentUserId);
      
      setSuccessModal({
        isOpen: true,
        type: 'delete',
        message: '고객이 성공적으로 삭제되었습니다.'
      });
      
      setConfirmationModal({ isOpen: false, type: 'save', onConfirm: () => {} });
      await handleSearch();
      
      dispatch(setIsNewMode(true));
      dispatch(setCustomerData({
        CUST_NM: '',
        CUST_GBN: 'Z',
        GENDER_GBN: 'M',
        EMAIL_CHK: 'N',
        DM_CHK: 'N',
        SMS_CHK: 'N',
        CALL_CHK: 'N'
      }));
    } catch (error) {
      console.error('삭제 오류:', error);
      setValidationModal({
        isOpen: true,
        errors: [{ field: 'general', message: `삭제 중 오류가 발생했습니다: ${error instanceof Error ? error.message : '알 수 없는 오류'}` }]
      });
      setConfirmationModal({ isOpen: false, type: 'save', onConfirm: () => {} });
    }
  };

  // 그리드 초기화
  const onGridReady = (_params: any) => {
    console.log('그리드 준비 완료');
  };

  // 그리드 행 클릭
  const onRowClicked = async (event: any) => {
    try {
      const selectedData = event.data;
      console.log('선택된 고객:', selectedData);
      
      // TODO: 백엔드에서 상세 정보 조회
      // const detailData = await customerService.getCustomerDetail(selectedData.CUST_ID);
      
      // 임시: 그리드 데이터 사용
      dispatch(setSelectedCustomer(selectedData));
      dispatch(setCustomerData(selectedData));
      dispatch(setIsNewMode(false));
      setOriginalData({ ...selectedData });

      // 이메일 파싱
      if (selectedData.C_EMAIL) {
        const emailParts = selectedData.C_EMAIL.split('@');
        if (emailParts.length === 2) {
          setEmailId(emailParts[0]);
          const domain = emailParts[1];
          const domainExists = emailDomainOptions.some(opt => opt.value === domain);
          if (domainExists) {
            setEmailDomain(domain);
            setIsCustomDomain(false);
          } else {
            setEmailDomain(domain);
            setIsCustomDomain(true);
          }
        }
      }
    } catch (error) {
      console.error('고객 상세 정보 조회 실패:', error);
    }
  };

  return (
    <div className="cust-registration">
      {/* TOP 구역 - 검색 조건 및 버튼 */}
      <div className="cust-top-section">
        <div className="cust-page-title">
          {currentTab?.menuIcon ? (
            React.createElement(getMenuIcon(currentTab.menuIcon), { size: 16 })
          ) : (
            <i className="fas fa-user"></i>
          )}
          고객등록
        </div>
        
        {/* 검색 조건 */}
        <div className="cust-search-conditions">
          {/* 1라인: 고객구분, 성별 */}
          <div className="cust-search-row">
            <div className="cust-search-item">
              <CommonMultiSelect
                label="고객구분"
                options={custGbnOptions}
                selectedValues={searchCondition.custGbn}
                onSelectionChange={(values) => handleSearchConditionChange('custGbn', values)}
                placeholder="고객구분을 선택하세요"
              />
            </div>
            <div className="cust-search-item">
              <label>성별</label>
              <select
                value={searchCondition.genderGbn || ''}
                onChange={(e) => handleSearchConditionChange('genderGbn', e.target.value)}
              >
                <option value="">전체</option>
                <option value="M">남성</option>
                <option value="F">여성</option>
              </select>
            </div>
          </div>
          
          {/* 2라인: 고객명, 휴대폰/이메일 */}
          <div className="cust-search-row">
            <div className="cust-search-item">
              <label>고객명</label>
              <input
                type="text"
                placeholder="고객명을 입력하세요"
                value={searchCondition.custName || ''}
                onChange={(e) => handleSearchConditionChange('custName', e.target.value)}
              />
            </div>
            <div className="cust-search-item">
              <label>휴대폰/이메일</label>
              <input
                type="text"
                placeholder="휴대폰 또는 이메일을 입력하세요"
                value={searchCondition.phoneOrEmail || ''}
                onChange={(e) => handleSearchConditionChange('phoneOrEmail', e.target.value)}
              />
            </div>
          </div>
          
          {/* 액션 버튼 */}
          <div className="cust-action-buttons">
            <div className="cust-left-buttons">
              <button className="cust-btn-delete" onClick={handleDelete}>
                <i className="fas fa-trash"></i> 삭제
              </button>
            </div>
            <div className="cust-right-buttons">
              <button className="cust-btn-new" onClick={handleNew}>
                <i className="fas fa-undo"></i> 초기화
              </button>
              <button 
                className="cust-btn-search" 
                onClick={handleSearch}
                disabled={isLoading}
              >
                <i className={isLoading ? "fas fa-spinner fa-spin" : "fas fa-search"}></i> 
                {isLoading ? '검색중...' : '조회'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* LEFT & RIGHT 구역 컨테이너 */}
      <div className="cust-content-container">
        {/* LEFT 구역 - 고객 목록 그리드 */}
        <div className="cust-left-section">
          <h3>
            <i className="fas fa-list"></i>
            고객 목록
          </h3>
          <div className="grid-container">
            {isGridReady && (
              <div className="ag-theme-alpine">
                <AgGridReact
                  columnDefs={columnDefs}
                  rowData={gridData}
                  onGridReady={onGridReady}
                  onRowClicked={onRowClicked}
                  rowSelection="single"
                  suppressRowClickSelection={true}
                  pagination={true}
                  paginationPageSize={50}
                  animateRows={true}
                  suppressMovableColumns={true}
                  headerHeight={34}
                  rowHeight={26}
                  suppressHorizontalScroll={false}
                  defaultColDef={{
                    sortable: true,
                    filter: true,
                    resizable: true,
                    minWidth: 60
                  }}
                  domLayout="normal"
                  noRowsOverlayComponent={() => (
                    <div className="ag-overlay-no-rows-center">
                      <div>조회된 데이터가 없습니다</div>
                    </div>
                  )}
                />
              </div>
            )}
          </div>
          
          {/* 그리드 상태 정보 */}
          <div className="grid-status-info">
            <span>총 {gridData.length}개 고객</span>
          </div>
        </div>

        {/* RIGHT 구역 - 고객 상세 정보 */}
        <div className="cust-right-section">
          <h3>
            <i className="fas fa-edit"></i>
            고객 상세 정보
          </h3>
          <div className="cust-detail-container">
            
            {/* 기본 정보 */}
            <div className="cust-detail-section">
              <h4>기본 정보</h4>
              <div className="cust-form-row">
                <div className="cust-form-item">
                  <label>고객코드</label>
                  <input
                    type="text"
                    value={customerData.CUST_ID || ''}
                    disabled
                    placeholder="자동생성"
                  />
                </div>
                <div className="cust-form-item required">
                  <label>고객명 <span className="required-mark">*</span></label>
                  <input
                    type="text"
                    value={customerData.CUST_NM || ''}
                    onChange={(e) => handleCustomerDataChange('CUST_NM', e.target.value)}
                    placeholder="고객명을 입력하세요"
                  />
                </div>
              </div>
              
              <div className="cust-form-row">
                <div className="cust-form-item">
                  <label>고객구분</label>
                  <select 
                    value={customerData.CUST_GBN || ''}
                    onChange={(e) => handleCustomerDataChange('CUST_GBN', e.target.value)}
                  >
                    <option value="">선택하세요</option>
                    {custGbnOptions.map((item: CommonCodeOption) => (
                      <option key={item.value} value={item.value}>
                        {item.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="cust-form-item">
                  <label>국가</label>
                  <select 
                    value={customerData.NATION_ID || ''}
                    onChange={(e) => handleCustomerDataChange('NATION_ID', e.target.value)}
                  >
                    <option value="">선택하세요</option>
                    {nationGbnOptions.map((item: CommonCodeOption) => (
                      <option key={item.value} value={item.value}>
                        {item.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="cust-form-row">
                <div className="cust-form-item">
                  <label>성별</label>
                  <div className="cust-radio-group">
                    <label>
                      <input
                        type="radio"
                        name="genderGbn"
                        value="M"
                        checked={customerData.GENDER_GBN === 'M'}
                        onChange={(e) => handleCustomerDataChange('GENDER_GBN', e.target.value)}
                      />
                      남성
                    </label>
                    <label>
                      <input
                        type="radio"
                        name="genderGbn"
                        value="F"
                        checked={customerData.GENDER_GBN === 'F'}
                        onChange={(e) => handleCustomerDataChange('GENDER_GBN', e.target.value)}
                      />
                      여성
                    </label>
                  </div>
                </div>
                <div className="cust-form-item">
                  <label>생년월일</label>
                  <input
                    type="date"
                    value={customerData.CUST_BIRTH_D || ''}
                    onChange={(e) => handleCustomerDataChange('CUST_BIRTH_D', e.target.value)}
                  />
                </div>
              </div>
            </div>

            {/* 연락처 정보 */}
            <div className="cust-detail-section">
              <h4>연락처 정보</h4>
              <div className="cust-form-row">
                <div className="cust-form-item">
                  <label>휴대폰</label>
                  <input
                    type="text"
                    value={customerData.C_HP || ''}
                    onChange={(e) => handlePhoneChange(e.target.value)}
                    placeholder="010-0000-0000"
                    maxLength={13}
                  />
                </div>
              </div>
              
              <div className="cust-form-row">
                <div className="cust-form-item full-width">
                  <label>이메일</label>
                  <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                    <input
                      type="text"
                      value={emailId}
                      onChange={(e) => handleEmailIdChange(e.target.value)}
                      placeholder="이메일 아이디"
                      style={{ flex: 1 }}
                    />
                    <span style={{ fontSize: '14px', fontWeight: 'bold', color: '#495057' }}>@</span>
                    {isCustomDomain ? (
                      <input
                        type="text"
                        value={emailDomain}
                        onChange={(e) => handleEmailDomainInputChange(e.target.value)}
                        placeholder="도메인 입력"
                        style={{ flex: 1 }}
                      />
                    ) : (
                      <input
                        type="text"
                        value={emailDomain}
                        readOnly
                        placeholder="도메인 선택"
                        style={{ flex: 1, backgroundColor: '#f8f9fa', cursor: 'not-allowed' }}
                      />
                    )}
                    <select
                      value={isCustomDomain ? 'custom' : emailDomain}
                      onChange={(e) => handleEmailDomainSelectChange(e.target.value)}
                      style={{ 
                        width: '130px',
                        padding: '2px 3px',
                        border: '1px solid #adb5bd',
                        borderRadius: '3px',
                        fontSize: '12px',
                        height: '26px',
                        backgroundColor: '#ffffff'
                      }}
                    >
                      <option value="">도메인 선택</option>
                      {emailDomainOptions.map(option => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            </div>

            {/* 주소 정보 */}
            <div className="cust-detail-section">
              <h4>주소 정보</h4>
              <div className="cust-form-row">
                <div className="cust-form-item" style={{ position: 'relative' }}>
                  <label>우편번호</label>
                  <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                    <input
                      type="text"
                      value={customerData.ZIP_ID || ''}
                      onChange={(e) => handleCustomerDataChange('ZIP_ID', e.target.value)}
                      placeholder="우편번호를 입력하세요"
                      readOnly
                      style={{ flex: 1, cursor: 'pointer' }}
                      onClick={handleSearchZipCode}
                    />
                    <button
                      type="button"
                      onClick={handleSearchZipCode}
                      style={{
                        padding: '5px 12px',
                        border: '1px solid #adb5bd',
                        borderRadius: '3px',
                        backgroundColor: '#0B65C8',
                        color: 'white',
                        fontSize: '11px',
                        fontWeight: '500',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                        height: '26px',
                        whiteSpace: 'nowrap'
                      }}
                      onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#094a96'}
                      onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#0B65C8'}
                    >
                      <i className="fas fa-search" style={{ marginRight: '4px' }}></i>
                      우편번호
                    </button>
                  </div>
                </div>
              </div>
              
              <div className="cust-form-row">
                <div className="cust-form-item full-width">
                  <label>주소</label>
                  <input
                    type="text"
                    value={customerData.C_ADDR1 || ''}
                    onChange={(e) => handleCustomerDataChange('C_ADDR1', e.target.value)}
                    placeholder="주소를 입력하세요"
                  />
                </div>
              </div>
              
              <div className="cust-form-row">
                <div className="cust-form-item full-width">
                  <label>상세주소</label>
                  <input
                    type="text"
                    value={customerData.C_ADDR2 || ''}
                    onChange={(e) => handleCustomerDataChange('C_ADDR2', e.target.value)}
                    placeholder="상세주소를 입력하세요"
                  />
                </div>
              </div>
            </div>

            {/* 마케팅 동의 */}
            <div className="cust-detail-section">
              <h4>마케팅 동의</h4>
              <div className="cust-form-row">
                <div className="cust-form-item">
                  <label className="cust-checkbox-label">
                    <input
                      type="checkbox"
                      checked={customerData.EMAIL_CHK === 'Y'}
                      onChange={(e) => handleCustomerDataChange('EMAIL_CHK', e.target.checked ? 'Y' : 'N')}
                    />
                    이메일 수신
                  </label>
                </div>
                <div className="cust-form-item">
                  <label className="cust-checkbox-label">
                    <input
                      type="checkbox"
                      checked={customerData.SMS_CHK === 'Y'}
                      onChange={(e) => handleCustomerDataChange('SMS_CHK', e.target.checked ? 'Y' : 'N')}
                    />
                    SMS 수신
                  </label>
                </div>
              </div>
              
              <div className="cust-form-row">
                <div className="cust-form-item">
                  <label className="cust-checkbox-label">
                    <input
                      type="checkbox"
                      checked={customerData.DM_CHK === 'Y'}
                      onChange={(e) => handleCustomerDataChange('DM_CHK', e.target.checked ? 'Y' : 'N')}
                    />
                    DM 수신
                  </label>
                </div>
                <div className="cust-form-item">
                  <label className="cust-checkbox-label">
                    <input
                      type="checkbox"
                      checked={customerData.CALL_CHK === 'Y'}
                      onChange={(e) => handleCustomerDataChange('CALL_CHK', e.target.checked ? 'Y' : 'N')}
                    />
                    전화 수신
                  </label>
                </div>
              </div>
            </div>

            {/* 기타 정보 */}
            <div className="cust-detail-section">
              <h4>기타 정보</h4>
              <div className="cust-form-row">
                <div className="cust-form-item">
                  <label>가입일자</label>
                  <input
                    type="date"
                    value={customerData.CUST_OPEN_D || ''}
                    onChange={(e) => handleCustomerDataChange('CUST_OPEN_D', e.target.value)}
                  />
                </div>
                <div className="cust-form-item">
                  <label>담당사원</label>
                  <input
                    type="text"
                    value={customerData.MNG_STAFF || ''}
                    onChange={(e) => handleCustomerDataChange('MNG_STAFF', e.target.value)}
                    placeholder="담당사원을 입력하세요"
                  />
                </div>
              </div>
              
              <div className="cust-form-row">
                <div className="cust-form-item full-width">
                  <label>취미</label>
                  <input
                    type="text"
                    value={customerData.CUST_HOBB || ''}
                    onChange={(e) => handleCustomerDataChange('CUST_HOBB', e.target.value)}
                    placeholder="취미를 입력하세요"
                  />
                </div>
              </div>
              
              <div className="cust-form-row">
                <div className="cust-form-item full-width">
                  <label>메모</label>
                  <textarea
                    value={customerData.CUST_DATA || ''}
                    onChange={(e) => handleCustomerDataChange('CUST_DATA', e.target.value)}
                    placeholder="메모를 입력하세요"
                    rows={3}
                  />
                </div>
              </div>
            </div>
          </div>
          
          {/* RIGHT 섹션 하단 버튼 */}
          <div className="cust-detail-bottom-buttons">
            <div className="left-buttons">
              <button className="cust-btn-help">
                <i className="fas fa-question-circle"></i> 도움말
              </button>
            </div>
            <div className="right-buttons">
              <button className="cust-btn-save" onClick={handleSave}>
                <i className="fas fa-save"></i> 저장
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 모달들 */}
      <ValidationModal
        isOpen={validationModal.isOpen}
        errors={validationModal.errors}
        onClose={() => setValidationModal({ isOpen: false, errors: [] })}
      />
      
      <ConfirmationModal
        isOpen={confirmationModal.isOpen}
        type={confirmationModal.type}
        onConfirm={confirmationModal.onConfirm}
        onCancel={() => setConfirmationModal({ isOpen: false, type: 'save', onConfirm: () => {} })}
      />
      
      <UnsavedChangesModal
        isOpen={unsavedChangesModal.isOpen}
        onSave={() => {
          setUnsavedChangesModal({ isOpen: false, onProceed: () => {} });
        }}
        onDiscard={() => {
          setUnsavedChangesModal({ isOpen: false, onProceed: () => {} });
          unsavedChangesModal.onProceed();
        }}
        onCancel={() => setUnsavedChangesModal({ isOpen: false, onProceed: () => {} })}
      />
      
      <SuccessModal
        isOpen={successModal.isOpen}
        type={successModal.type}
        message={successModal.message}
        details={successModal.details}
        onClose={() => {
          setSuccessModal({ isOpen: false, type: 'save', details: undefined });
          setConfirmationModal({ isOpen: false, type: 'save', onConfirm: () => {} });
        }}
      />
    </div>
  );
};

export default CustRegistration;
