import React, { useEffect, useState, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { AgGridReact } from 'ag-grid-react';
import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-alpine.css';
import CommonMultiSelect from './CommonMultiSelect';
import { commonCodeService, CommonCodeOption } from '../services/commonCodeService';
import { agentService } from '../services/agentService';
import { 
  ValidationModal, 
  ConfirmationModal, 
  UnsavedChangesModal,
  SuccessModal,
  ExcelUploadResultModal,
  type ValidationError 
} from './common';
import { getMenuIcon } from '../utils/menuUtils';
import AgentBatchUploadModal from './common/AgentBatchUploadModal';
import ExcelPreviewModal, { ExcelDataRow as BaseExcelDataRow } from './common/ExcelPreviewModal';
import { useButtonTextPermission } from '../hooks/usePermissions';
import { MENU_IDS } from '../constants/menuIds';

// 거래처등록용 ExcelDataRow 타입 확장 (TB_CS_AGENT.SQL 필드 기준)
export interface ExcelDataRow extends BaseExcelDataRow {
  거래처명?: string;
  거래처영문명?: string;
  거래처단축명?: string;
  거래처구분?: string;
  채널구분?: string;
  대표자명?: string;
  사업자번호?: string;
  전화번호?: string;
  팩스?: string;
  우편번호?: string;
  우편번호주소?: string;
  상세주소?: string;
  업태?: string;
  종목?: string;
  거래제한미수금액?: string;
  할인율?: string;
  소수점반올림구분?: string;
  반올림자릿수?: string;
  은행명?: string;
  계좌번호?: string;
  계좌주?: string;
  담당부서?: string;
  담당사원?: string;
  특이사항?: string;
  거래처대표이메일?: string;
  결제기간?: string;
  부가세구분?: string;
  세금계산서수신이메일1?: string;
  세금계산서담당자1?: string;
  세금계산서수신이메일2?: string;
  세금계산서담당자2?: string;
  거래시작일자?: string;
  거래종료일자?: string;
  // 중복 확인 관련 필드
  existingAgentId?: number; // 중복된 거래처의 ID
  existingAgentData?: any; // 중복된 거래처의 전체 데이터
}
import { ExcelUploadResult } from './common/ExcelUploadResultModal';
import { useAgentSimpleFileUpload } from './AgentSimpleFileUpload';
import { 
  setSearchCondition, 
  setAgentData, 
  setSelectedAgent, 
  setIsNewMode, 
  setGridData,
  updateAgentDetail, 
  initializeScreen 
} from '../store/agentRegistrationSlice';
import type { AgentData, SearchCondition } from '../store/agentRegistrationSlice';
import { RootState, AppDispatch } from '../store/store';
import './AgentRegistration.css';



const AgentRegistration: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  
  // 버튼별 권한 체크 (거래처등록 메뉴 ID 상수 사용)
  const savePermission = useButtonTextPermission(MENU_IDS.AGENT_REGISTRATION, '저장');
  const deletePermission = useButtonTextPermission(MENU_IDS.AGENT_REGISTRATION, '삭제');
  const viewPermission = useButtonTextPermission(MENU_IDS.AGENT_REGISTRATION, '조회');
  const exportPermission = useButtonTextPermission(MENU_IDS.AGENT_REGISTRATION, '내보내기');
  const batchUploadPermission = useButtonTextPermission(MENU_IDS.AGENT_REGISTRATION, '일괄등록');
  
  // 권한 디버깅 로그
  console.log('🔐 [거래처등록] 버튼별 권한 체크 결과:', {
    menuId: MENU_IDS.AGENT_REGISTRATION,
    menuName: '거래처등록',
    savePermission: savePermission.hasPermission,
    deletePermission: deletePermission.hasPermission,
    viewPermission: viewPermission.hasPermission,
    exportPermission: exportPermission.hasPermission,
    batchUploadPermission: batchUploadPermission.hasPermission,
    loading: savePermission.loading,
    error: savePermission.error
  });
  
  // Redux 상태 가져오기 (상품등록과 동일한 방식)
  const {
    searchCondition,
    agentData,
    selectedAgent,
    isNewMode,
    gridData
  } = useSelector((state: RootState) => state.agentRegistration);

  // 현재 로그인한 사용자 정보 가져오기
  const { user } = useSelector((state: RootState) => state.auth);
  const currentAgentId = user?.agentId;
  const currentUserRole = user?.roleLevel || 0;
  
  // 현재 활성 탭 정보 가져오기
  const { tabs, activeTabId } = useSelector((state: RootState) => state.tabs);
  const currentTab = tabs.find(tab => tab.id === activeTabId);
  
  // 브랜드 옵션 상태
  const [brandOptions, setBrandOptions] = useState<CommonCodeOption[]>([]);
  
  // 시스템 관리자 여부 확인 (roleLevel이 1인 경우 시스템 관리자)
  const isSystemAdmin = currentUserRole === 1;
  
  // 디버깅: 사용자 정보 확인
  console.log('=== 사용자 정보 디버깅 ===');
  console.log('전체 사용자 정보:', user);
  console.log('현재 agentId:', currentAgentId);
  console.log('현재 사용자 역할 레벨:', currentUserRole);
  console.log('시스템 관리자 여부:', isSystemAdmin);

  // 공통코드 라벨을 가져오는 헬퍼 함수
  const getCommonCodeLabel = (options: CommonCodeOption[], value: string) => {
    if (!options || !value) return '';
    const option = options.find(opt => opt.value === value);
    return option ? option.label : value;
  };

  // 변경된 필드를 비교하는 함수
  const getChangedFields = (original: any, current: any) => {
    try {
      console.log('🔍 getChangedFields 호출:', {
        original: original,
        current: current,
        originalKeys: Object.keys(original || {}),
        currentKeys: Object.keys(current || {}),
        originalType: typeof original,
        currentType: typeof current,
        agentGbnOptionsLength: agentGbnOptions.length,
        channGbnOptionsLength: channGbnOptions.length,
        bankGbnOptionsLength: bankGbnOptions.length
      });
    
    const fieldNameMap: {[key: string]: string} = {
      'AGENT_NM': '거래처명',
      'AGENT_ENG_NM': '거래처명(영문)',
      'SHORT_NM': '약칭',
      'AGENT_GBN': '거래처구분',
      'CHANN_GBN': '채널구분',
      'AGENT_CEO': '대표자명',
      'AGENT_BNO': '사업자번호',
      'AGENT_TEL': '전화번호',
      'AGENT_FAX': '팩스번호',
      'AGENT_EMAIL': '이메일',
      'AGENT_ADDR1': '주소',
      'AGENT_ADDR2': '상세주소',
      'ZIP_ID': '우편번호',
      'AGENT_YUP': '업태',
      'AGENT_JONG': '종목',
      'TRADE_LIM': '거래제한금액',
      'SALE_RATE': '할인율',
      'ROUND_GBN': '소수점반올림구분',
      'UPDN_CNT': '반올림자릿수',
      'BANK_ID': '은행',
      'ACCOUNT_NO': '계좌번호',
      'ACCOUNT_OWNER': '계좌주',
      'DEPT_ID': '담당부서',
      'PERSON_ID': '담당사원',
      'VAT_TYPE': '부가세구분',
      'PAYMENT_TERM': '결제기간',
      'TAX_EMAIL1': '세금계산서이메일1',
      'TAX_DAMDANG1': '담당자1',
      'TAX_EMAIL2': '세금계산서이메일2',
      'TAX_DAMDANG2': '담당자2',
      'OPEN_D': '거래시작일자',
      'CLOSE_D': '거래종료일자',
      'BRAND_ID_LIST': '취급브랜드',
      'TRADE_MEMO': '특이사항'
    };

    const changes: Array<{field: string, name: string, oldValue: any, newValue: any}> = [];
    
    console.log('🔍 필드 비교 시작:', { 
      original: original,
      current: current,
      originalType: typeof original,
      currentType: typeof current,
      originalKeys: Object.keys(original || {}),
      currentKeys: Object.keys(current || {}),
      originalAGENT_ID: original?.AGENT_ID,
      currentAGENT_ID: current?.AGENT_ID
    });
    
    Object.keys(fieldNameMap).forEach(field => {
      const oldValue = original?.[field];
      const newValue = current?.[field];
      
      // 값이 실제로 다른 경우만 변경으로 간주 (null, undefined, 빈 문자열 정규화)
      const normalizeValue = (val: any) => {
        if (val === null || val === undefined || val === '') return '';
        
        // 숫자 필드는 콤마 제거 후 비교
        if (field === 'TRADE_LIM' || field === 'SALE_RATE' || field === 'UPDN_CNT' || field === 'PAYMENT_TERM') {
          const cleanValue = String(val).replace(/,/g, '').trim();
          return cleanValue;
        }
        
        // 날짜 필드는 스토어드프로시저가 이미 yyyy-mm-dd 형식으로 반환
        if (field === 'OPEN_D' || field === 'CLOSE_D') {
          if (val && typeof val === 'string') {
            // yyyy-mm-dd 형식인지 확인하고 그대로 사용
            if (/^\d{4}-\d{2}-\d{2}$/.test(val)) {
              return val;
            }
            // 기타 형식은 trim 처리
            return String(val).trim();
          }
        }
        return String(val).trim();
      };
      
      const normalizedOld = normalizeValue(oldValue);
      const normalizedNew = normalizeValue(newValue);
      
      if (normalizedOld !== normalizedNew) {
        console.log(`🔍 변경 감지: ${field} (${fieldNameMap[field]})`, {
          oldValue: oldValue,
          newValue: newValue,
          normalizedOld: normalizedOld,
          normalizedNew: normalizedNew,
          isChanged: normalizedOld !== normalizedNew
        });
        // 공통코드 필드의 경우 실제 값 대신 라벨을 표시하도록 개선
        let displayOldValue = normalizedOld || '(없음)';
        let displayNewValue = normalizedNew || '(없음)';
        
        // 공통코드 필드들의 경우 실제 값 대신 의미있는 텍스트로 표시
        if (field === 'AGENT_GBN') {
          console.log('🔍 AGENT_GBN 라벨 변환:', {
            normalizedOld,
            normalizedNew,
            agentGbnOptionsLength: agentGbnOptions.length,
            agentGbnOptions: agentGbnOptions
          });
          displayOldValue = getCommonCodeLabel(agentGbnOptions, normalizedOld) || normalizedOld || '(없음)';
          displayNewValue = getCommonCodeLabel(agentGbnOptions, normalizedNew) || normalizedNew || '(없음)';
        } else if (field === 'CHANN_GBN') {
          console.log('🔍 CHANN_GBN 라벨 변환:', {
            normalizedOld,
            normalizedNew,
            channGbnOptionsLength: channGbnOptions.length,
            channGbnOptions: channGbnOptions
          });
          displayOldValue = getCommonCodeLabel(channGbnOptions, normalizedOld) || normalizedOld || '(없음)';
          displayNewValue = getCommonCodeLabel(channGbnOptions, normalizedNew) || normalizedNew || '(없음)';
        } else if (field === 'BANK_ID') {
          console.log('🔍 BANK_ID 라벨 변환:', {
            normalizedOld,
            normalizedNew,
            bankGbnOptionsLength: bankGbnOptions.length,
            bankGbnOptions: bankGbnOptions
          });
          displayOldValue = getCommonCodeLabel(bankGbnOptions, normalizedOld) || normalizedOld || '(없음)';
          displayNewValue = getCommonCodeLabel(bankGbnOptions, normalizedNew) || normalizedNew || '(없음)';
        }
        
        changes.push({
          field,
          name: fieldNameMap[field],
          oldValue: displayOldValue,
          newValue: displayNewValue
        });
        console.log(`🔄 변경된 필드 발견: ${fieldNameMap[field]}`, {
          oldValue: displayOldValue,
          newValue: displayNewValue
        });
      }
    });
    
      console.log('📊 총 변경된 필드 수:', changes.length);
      console.log('📋 변경된 필드 목록:', changes);
      return changes;
    } catch (error) {
      console.error('❌ getChangedFields 함수 오류:', error);
      return [];
    }
  };

  // 공통코드 로드 함수
  const loadCommonCodes = useCallback(async () => {
    try {
      const [agentGbnData, channGbnData, bankGbnData, brandData] = await Promise.all([
        commonCodeService.getAgentGbn(),
        commonCodeService.getChannGbn(),
        commonCodeService.getBankGbn(),
        commonCodeService.getBrands() // 브랜드 데이터 추가
      ]);

      setAgentGbnOptions(agentGbnData);
      setChannGbnOptions(channGbnData);
      setBankGbnOptions(bankGbnData);
      setBrandOptions(brandData); // 브랜드 옵션 설정
      
      console.log('브랜드 데이터 로드 완료:', brandData);
    } catch (error) {
      console.error('공통코드 로드 오류:', error);
    }
  }, []);

  // 로컬 상태로 관리할 항목들 (상품등록과 동일한 방식)
  const [isGridReady, setIsGridReady] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  // 공통코드 옵션 상태 (상품등록과 동일한 방식)
  const [agentGbnOptions, setAgentGbnOptions] = useState<CommonCodeOption[]>([]);
  const [channGbnOptions, setChannGbnOptions] = useState<CommonCodeOption[]>([]);
  const [bankGbnOptions, setBankGbnOptions] = useState<CommonCodeOption[]>([]);

  // 그리드 행 클릭 시 원본 데이터 저장을 위한 상태
  const [originalData, setOriginalData] = useState<AgentData | null>(null);


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
    changedFields?: Array<{field: string, name: string, oldValue: any, newValue: any}>;
  }>({ isOpen: false, type: 'save' });

  // 일괄등록 모달 상태
  const [batchUploadModal, setBatchUploadModal] = useState<{
    isOpen: boolean;
  }>({ isOpen: false });

  // 엑셀 미리보기 모달 상태
  const [excelPreviewModal, setExcelPreviewModal] = useState<{
    isOpen: boolean;
    data: ExcelDataRow[];
  }>({ isOpen: false, data: [] });

  // 엑셀 업로드 결과 모달 상태
  const [uploadResultModal, setUploadResultModal] = useState<{
    isOpen: boolean;
    result: ExcelUploadResult | null;
  }>({ isOpen: false, result: null });

  // 간단한 파일 업로드 훅 사용
  const { handleFileUpload: handleSimpleFileUpload } = useAgentSimpleFileUpload({
    onDataParsed: (data: ExcelDataRow[]) => {
      console.log('📊 파싱된 데이터 받음:', data);
      // 일괄 업로드 모달 닫고 미리보기 모달 열기
      setBatchUploadModal({ isOpen: false });
      setExcelPreviewModal({ 
        isOpen: true, 
        data: data 
      });
    }
  });

  // 그리드 컬럼 정의
  const columnDefs: any[] = [
    { 
      headerName: '거래처구분명', 
      field: 'AGENT_GBN_NM', 
      width: 90, 
      minWidth: 80,
      sortable: true,
      filter: true
    },
    { 
      headerName: '거래처명', 
      field: 'AGENT_NM', 
      width: 200, 
      minWidth: 150, 
      flex: 1,
      sortable: true,
      filter: true
    },
    { 
      headerName: '채널명', 
      field: 'CHANN_GBN_NM', 
      width: 90, 
      minWidth: 80,
      sortable: true,
      filter: true
    },
    { 
      headerName: '대표자명', 
      field: 'AGENT_CEO', 
      width: 100, 
      minWidth: 80,
      sortable: true,
      filter: true
    },
    { 
      headerName: '사업자번호', 
      field: 'AGENT_BNO', 
      width: 120, 
      minWidth: 100,
      sortable: true,
      filter: true
    },
    { 
      headerName: '거래시작일자', 
      field: 'OPEN_D', 
      width: 100, 
      minWidth: 90,
      sortable: true,
      filter: true,
      valueFormatter: (params: any) => {
        // 여러 필드명 시도
        const openDateValue = params.data.OPEN_D || params.data.open_d || params.data.OPEN_DATE || params.data.openDate;
        const formatted = formatDateToYYYYMMDD(openDateValue);
        console.log('🔍 그리드 거래시작일자 포맷팅:', {
          원본값: openDateValue,
          원본타입: typeof openDateValue,
          변환값: formatted,
          전체데이터: params.data
        });
        return formatted;
      }
    },
    { 
      headerName: '거래종료일자', 
      field: 'CLOSE_D', 
      width: 100, 
      minWidth: 90,
      sortable: true,
      filter: true,
      valueFormatter: (params: any) => {
        // 여러 필드명 시도
        const closeDateValue = params.data.CLOSE_D || params.data.close_d || params.data.CLOSE_DATE || params.data.closeDate;
        const formatted = formatDateToYYYYMMDD(closeDateValue);
        console.log('🔍 그리드 거래종료일자 포맷팅:', {
          원본값: closeDateValue,
          원본타입: typeof closeDateValue,
          변환값: formatted,
          전체데이터: params.data
        });
        return formatted;
      }
    },
    { 
      headerName: '거래처코드', 
      field: 'AGENT_ID', 
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
        // 공통코드 로드
        await loadCommonCodes();
        
        // CSS 로딩 완료 후 그리드 초기화
        setTimeout(() => {
          setIsGridReady(true);
        }, 100);
      } catch (error) {
        console.error('데이터 초기화 실패:', error);
      }
    };

    initializeData();
    
    // 화면 초기화
      console.log('거래처등록 화면 초기화 - 신규 모드로 전환');
      dispatch(initializeScreen()); // 초기화 완료 표시
      // 신규 모드로 전환 (초기화 시에는 미저장 변경사항 체크 불필요)
      dispatch(setIsNewMode(true));
      
      // selectedAgent 초기화
      dispatch(setSelectedAgent({
        AGENT_ID: 0,
        AGENT_NM: '',
        AGENT_ENG_NM: '',
        SHORT_NM: '',
        AGENT_GBN: '',
        CHANN_GBN: '',
        AGENT_CEO: '',
        AGENT_BNO: '',
        AGENT_TEL: '',
        AGENT_FAX: '',
        AGENT_EMAIL: '',
        AGENT_ADDR1: '',
        AGENT_ADDR2: '',
        ZIP_ID: '',
        AGENT_YUP: '',
        AGENT_JONG: '',
        TRADE_LIM: '',
        SALE_RATE: '',
        ROUND_GBN: '',
        UPDN_CNT: '',
        BANK_ID: '',
        ACCOUNT_NO: '',
        ACCOUNT_OWNER: '',
        DEPT_ID: '',
        PERSON_ID: '',
        VAT_TYPE: '',
        PAYMENT_TERM: '',
        TAX_EMAIL1: '',
        TAX_DAMDANG1: '',
        TAX_EMAIL2: '',
        TAX_DAMDANG2: '',
        OPEN_D: new Date().toISOString().split('T')[0], // 현재 날짜로 자동 설정
        CLOSE_D: '',
        BRAND_ID_LIST: '',
        TRADE_MEMO: ''
      }));
      
      // agentData도 함께 초기화
      dispatch(setAgentData({
        AGENT_ID: 0,
        AGENT_NM: '',
        AGENT_ENG_NM: '',
        SHORT_NM: '',
        AGENT_GBN: '',
        CHANN_GBN: '',
        AGENT_CEO: '',
        AGENT_BNO: '',
        AGENT_TEL: '',
        AGENT_FAX: '',
        AGENT_EMAIL: '',
        AGENT_ADDR1: '',
        AGENT_ADDR2: '',
        ZIP_ID: '',
        AGENT_YUP: '',
        AGENT_JONG: '',
        TRADE_LIM: '',
        SALE_RATE: '',
        ROUND_GBN: '',
        UPDN_CNT: '',
        BANK_ID: '',
        ACCOUNT_NO: '',
        ACCOUNT_OWNER: '',
        DEPT_ID: '',
        PERSON_ID: '',
        VAT_TYPE: '',
        PAYMENT_TERM: '',
        TAX_EMAIL1: '',
        TAX_DAMDANG1: '',
        TAX_EMAIL2: '',
        TAX_DAMDANG2: '',
        OPEN_D: new Date().toISOString().split('T')[0], // 현재 날짜로 자동 설정
        CLOSE_D: '',
        BRAND_ID_LIST: '',
        TRADE_MEMO: ''
      }));
      
      setOriginalData(null);
  }, [dispatch, loadCommonCodes]);


  // 변경사항 확인 함수 (거래처등록에 맞게 수정)
  const hasUnsavedChanges = useCallback(() => {
    if (!agentData) return false;
    
    // 신규 모드에서 필드에 값이 입력되어 있는지 확인
    const hasData = agentData.AGENT_NM?.trim() || 
                   agentData.AGENT_GBN?.trim() || 
                   agentData.CHANN_GBN?.trim() ||
                   agentData.AGENT_CEO?.trim() ||
                   agentData.AGENT_BNO?.trim() ||
                   agentData.AGENT_TEL?.trim() ||
                   agentData.AGENT_FAX?.trim() ||
                   agentData.AGENT_EMAIL?.trim() ||
                   agentData.AGENT_ADDR1?.trim() ||
                   agentData.AGENT_ADDR2?.trim() ||
                   agentData.ZIP_ID?.trim() ||
                   agentData.AGENT_YUP?.trim() ||
                   agentData.AGENT_JONG?.trim() ||
                   agentData.TRADE_LIM?.trim() ||
                   agentData.SALE_RATE?.trim() ||
                   agentData.ROUND_GBN?.trim() ||
                   agentData.UPDN_CNT?.trim() ||
                   agentData.BANK_ID?.trim() ||
                   agentData.ACCOUNT_NO?.trim() ||
                   agentData.ACCOUNT_OWNER?.trim() ||
                   agentData.DEPT_ID?.trim() ||
                   agentData.PERSON_ID?.trim() ||
                   agentData.VAT_TYPE?.trim() ||
                   agentData.PAYMENT_TERM?.trim() ||
                   agentData.TAX_EMAIL1?.trim() ||
                   agentData.TAX_DAMDANG1?.trim() ||
                   agentData.TAX_EMAIL2?.trim() ||
                   agentData.TAX_DAMDANG2?.trim() ||
                   agentData.OPEN_D?.trim() ||
                   agentData.CLOSE_D?.trim() ||
                   agentData.BRAND_ID_LIST?.trim() ||
                   agentData.TRADE_MEMO?.trim();
    
    return isNewMode && hasData;
  }, [agentData, isNewMode]);

  // 실제 신규 작업 수행 (거래처등록에 맞게 수정)
  const performNew = useCallback(() => {
    dispatch(setIsNewMode(true));
    
    // selectedAgent 초기화
    dispatch(setSelectedAgent({
      AGENT_ID: 0,
      AGENT_NM: '',
      AGENT_ENG_NM: '',
      SHORT_NM: '',
      AGENT_GBN: '',
      CHANN_GBN: '',
      AGENT_CEO: '',
      AGENT_BNO: '',
      AGENT_TEL: '',
      AGENT_FAX: '',
      AGENT_EMAIL: '',
      AGENT_ADDR1: '',
      AGENT_ADDR2: '',
      ZIP_ID: '',
      AGENT_YUP: '',
      AGENT_JONG: '',
      TRADE_LIM: '',
      SALE_RATE: '',
      ROUND_GBN: '',
      UPDN_CNT: '',
      BANK_ID: '',
      ACCOUNT_NO: '',
      ACCOUNT_OWNER: '',
      DEPT_ID: '',
      PERSON_ID: '',
      VAT_TYPE: '',
      PAYMENT_TERM: '',
      TAX_EMAIL1: '',
      TAX_DAMDANG1: '',
      TAX_EMAIL2: '',
      TAX_DAMDANG2: '',
      OPEN_D: new Date().toISOString().split('T')[0], // 현재 날짜로 자동 설정
      CLOSE_D: '',
      BRAND_ID_LIST: '',
      TRADE_MEMO: ''
    }));
    
    // agentData도 함께 초기화
    dispatch(setAgentData({
      AGENT_ID: 0,
      AGENT_NM: '',
      AGENT_ENG_NM: '',
      SHORT_NM: '',
      AGENT_GBN: '',
      CHANN_GBN: '',
      AGENT_CEO: '',
      AGENT_BNO: '',
      AGENT_TEL: '',
      AGENT_FAX: '',
      AGENT_EMAIL: '',
      AGENT_ADDR1: '',
      AGENT_ADDR2: '',
      ZIP_ID: '',
      AGENT_YUP: '',
      AGENT_JONG: '',
      TRADE_LIM: '',
      SALE_RATE: '',
      ROUND_GBN: '',
      UPDN_CNT: '',
      BANK_ID: '',
      ACCOUNT_NO: '',
      ACCOUNT_OWNER: '',
      DEPT_ID: '',
      PERSON_ID: '',
      VAT_TYPE: '',
      PAYMENT_TERM: '',
      TAX_EMAIL1: '',
      TAX_DAMDANG1: '',
      TAX_EMAIL2: '',
      TAX_DAMDANG2: '',
      OPEN_D: new Date().toISOString().split('T')[0], // 현재 날짜로 자동 설정
      CLOSE_D: '',
      BRAND_ID_LIST: '',
      TRADE_MEMO: ''
    }));
    
    // 신규 모드로 전환 시 원본 데이터 초기화
    setOriginalData(null);
  }, [dispatch]);

  // 신규 버튼 클릭 - 미저장 변경사항 확인 (상품등록과 동일한 방식)
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
  const handleSearchConditionChange = (field: keyof SearchCondition, value: string | boolean | string[]) => {
    dispatch(setSearchCondition({ [field]: value }));
  };



  // 그리드에서 날짜 값을 추출하는 함수 (valueFormatter와 동일한 로직)
  const extractDateFromGridData = (data: any, fieldName: string): any => {
    // 여러 필드명을 시도하여 날짜 값 찾기
    const possibleFields = [
      fieldName, // OPEN_D, CLOSE_D
      fieldName.toLowerCase(), // open_d, close_d
      fieldName.replace('_D', '_DATE'), // OPEN_DATE, CLOSE_DATE
      fieldName.replace('_D', 'Date').replace('_', '') // openDate, closeDate
    ];
    
    for (const field of possibleFields) {
      if (data[field] !== undefined && data[field] !== null && data[field] !== '') {
        console.log(`🔍 ${fieldName} 필드에서 ${field}로 값 발견:`, data[field]);
        return data[field];
      }
    }
    
    console.log(`🔍 ${fieldName} 필드에서 값 없음, 시도한 필드들:`, possibleFields);
    return null;
  };

  // 일자 데이터를 yyyy-mm-dd 형식으로 변환하는 함수 (스토어드프로시저가 이미 yyyy-mm-dd 형태로 반환)
  const formatDateToYYYYMMDD = (dateValue: any): string => {
    console.log('🔍 formatDateToYYYYMMDD 호출:', {
      입력값: dateValue,
      입력타입: typeof dateValue,
      null체크: dateValue === null,
      undefined체크: dateValue === undefined,
      빈문자열체크: dateValue === '',
      공백문자열체크: typeof dateValue === 'string' && dateValue.trim() === ''
    });
    
    // null, undefined, 빈 문자열, 공백만 있는 문자열 처리
    if (!dateValue || (typeof dateValue === 'string' && dateValue.trim() === '')) {
      console.log('🔍 빈 값으로 인한 빈 문자열 반환');
      return '';
    }
    
    try {
      // 스토어드프로시저가 이미 yyyy-mm-dd 형태로 반환하므로 직접 사용
      if (typeof dateValue === 'string') {
        const trimmedValue = dateValue.trim();
        console.log('🔍 문자열 처리:', { 원본: dateValue, trim후: trimmedValue });
        
        // yyyy-mm-dd 형식인지 확인
        if (/^\d{4}-\d{2}-\d{2}$/.test(trimmedValue)) {
          console.log('🔍 yyyy-mm-dd 형식으로 인식, 그대로 반환:', trimmedValue);
          return trimmedValue;
        }
        
        // yyyymmdd 형식인 경우 (8자리 숫자) - 기존 호환성 유지
        if (trimmedValue.length === 8 && /^\d{8}$/.test(trimmedValue)) {
          const year = trimmedValue.substring(0, 4);
          const month = trimmedValue.substring(4, 6);
          const day = trimmedValue.substring(6, 8);
          const result = `${year}-${month}-${day}`;
          console.log('🔍 yyyymmdd 형식으로 인식, 변환:', { 원본: trimmedValue, 결과: result });
          return result;
        }
        
        // 기타 형식은 Date 객체로 변환 시도
        const date = new Date(trimmedValue);
        if (!isNaN(date.getTime())) {
          const year = date.getFullYear();
          const month = String(date.getMonth() + 1).padStart(2, '0');
          const day = String(date.getDate()).padStart(2, '0');
          const result = `${year}-${month}-${day}`;
          console.log('🔍 Date 객체로 변환:', { 원본: trimmedValue, 결과: result });
          return result;
        }
        
        console.log('🔍 변환 실패, 빈 문자열 반환');
      }
      
      return '';
    } catch (error) {
      console.error('날짜 변환 중 오류 발생:', error, '원본 값:', dateValue);
      return '';
    }
  };

  // 숫자 포맷팅 함수 (천단위 콤마 추가)
  const formatNumber = (value: string | number): string => {
    if (!value || value === '') return '';
    const numValue = typeof value === 'string' ? parseFloat(value) : value;
    if (isNaN(numValue)) return '';
    return numValue.toLocaleString('ko-KR');
  };

  // 숫자 포맷팅 제거 함수 (콤마 제거)
  const removeNumberFormat = (value: string): string => {
    return value.replace(/,/g, '');
  };

  // 거래처 데이터 변경 핸들러
  const handleAgentDataChange = (field: keyof AgentData, value: any) => {
    // 거래종료일자 변경 시 특별한 로그
    if (field === 'CLOSE_D') {
      console.log('🔍 거래종료일자 변경 처리:', {
        필드: field,
        새값: value,
        새값타입: typeof value,
        현재agentData: agentData.CLOSE_D,
        현재selectedAgent: selectedAgent?.CLOSE_D
      });
    }
    
    // agentData와 selectedAgent 모두 업데이트
    dispatch(setAgentData({ [field]: value }));
    if (selectedAgent) {
      dispatch(updateAgentDetail({ field, value }));
    }
    
    // 거래종료일자 변경 후 상태 확인
    if (field === 'CLOSE_D') {
      console.log('🔍 거래종료일자 변경 완료 후 상태:', {
        agentData_CLOSE_D: agentData.CLOSE_D,
        selectedAgent_CLOSE_D: selectedAgent?.CLOSE_D
      });
    }
  };

  // 검색 실행
  const handleSearch = async () => {
    try {
      setIsLoading(true);
      console.log('검색 조건:', searchCondition);
      
      let allResults: any[] = [];
      
      // 거래처구분과 채널구분의 조합으로 검색
      const agentGbnList = searchCondition.agentGbn.length > 0 ? searchCondition.agentGbn : [undefined];
      const channGbnList = searchCondition.channGbn.length > 0 ? searchCondition.channGbn : [undefined];
      
      console.log('검색할 조합:', { agentGbnList, channGbnList });
      
      // 모든 조합에 대해 검색 실행
      for (const agentGbn of agentGbnList) {
        for (const channGbn of channGbnList) {
          console.log('검색 실행:', { agentGbn, channGbn });
          
          const searchResults = await agentService.searchAgents({
            agentNm: searchCondition.agentName,        // 거래처명
            agentGbn: agentGbn,                        // 거래처구분
            channGbn: channGbn,                        // 채널구분
            excludeTerminated: searchCondition.excludeTerminated, // 종료 거래처 제외 여부
            userId: 'ADMIN' // 임시로 ADMIN 사용 (실제로는 로그인한 사용자 ID 사용)
          });
          
          allResults = allResults.concat(searchResults);
        }
      }
      
      // 중복 제거 (AGENT_ID 기준)
      const uniqueResults = allResults.filter((item, index, self) => 
        index === self.findIndex(t => t.AGENT_ID === item.AGENT_ID)
      );
      
      // 검색 결과를 Redux store에 저장
      dispatch(setGridData(uniqueResults));
      
      console.log('검색 완료. 총 결과 개수:', uniqueResults.length);
      
      // 날짜 데이터 확인을 위한 로그
      if (uniqueResults.length > 0) {
        console.log('🔍 첫 번째 검색 결과의 날짜 데이터:', {
          OPEN_D: uniqueResults[0].OPEN_D,
          OPEN_D_Type: typeof uniqueResults[0].OPEN_D,
          CLOSE_D: uniqueResults[0].CLOSE_D,
          CLOSE_D_Type: typeof uniqueResults[0].CLOSE_D,
          전체데이터: uniqueResults[0]
        });
      }
      
      // 검색 결과 로그만 출력 (팝업창 제거)
      if (uniqueResults.length === 0) {
        console.log('검색 조건에 맞는 거래처가 없습니다.');
      } else {
        console.log(`검색이 완료되었습니다. 총 ${uniqueResults.length}건의 거래처를 찾았습니다.`);
      }
      
    } catch (error) {
      console.error('검색 실패:', error);
      
      // 검색 실패 시 에러 모달 표시
      setValidationModal({
        isOpen: true,
        errors: [{ field: 'general', message: `검색에 실패했습니다: ${error instanceof Error ? error.message : '알 수 없는 오류'}` }]
      });
    } finally {
      setIsLoading(false);
    }
  };

  // 저장 버튼 클릭 - 필수입력 체크 후 확인 모달 표시
  const handleSave = () => {
    console.log('🚀 handleSave 함수 호출됨');
    if (!agentData) {
      alert('저장할 거래처 정보가 없습니다.');
      return;
    }

    // 1단계: 필수입력 체크
    const requiredFields = [
      { field: 'AGENT_NM', name: '거래처명' },
      { field: 'AGENT_GBN', name: '거래처구분' },
      { field: 'CHANN_GBN', name: '채널구분' }
    ];

    const errors: ValidationError[] = [];
    
    requiredFields.forEach(({ field, name }) => {
      const value = (agentData as any)[field];
      if (!value || (typeof value === 'string' && value.trim() === '')) {
        errors.push({
          field,
          fieldName: name,
          message: `${name}은(는) 필수 입력 항목입니다.`
        });
      }
    });

    // 필수입력 누락이 있으면 ValidationModal 표시
    if (errors.length > 0) {
      setValidationModal({
        isOpen: true,
        errors
      });
      return;
    }

         // 2단계: 필수입력이 모두 완료되면 확인 모달 표시 (AGENT_ID는 숫자 타입으로 처리)
     const isUpdate = agentData.AGENT_ID && Number(agentData.AGENT_ID) > 0;
    setConfirmationModal({
      isOpen: true,
      type: isUpdate ? 'update' : 'save',
      onConfirm: performSave
    });
  };

  // 실제 저장 로직 (필수입력 체크는 handleSave에서 이미 완료됨)
  const performSave = async () => {
    console.log('🚀 performSave 함수 호출됨');
    if (!agentData) {
      alert('저장할 거래처 정보가 없습니다.');
      return;
    }
    
    try {
      console.log('💾 거래처 저장 시작:', agentData);
      
      // 저장할 데이터 준비 (USER_ID 추가)
      const saveData = {
        ...agentData,
        USER_ID: currentAgentId || 'ADMIN'
      };
      
      console.log('💾 전송할 데이터:', saveData);
      
      // AgentService를 사용하여 거래처 저장
      const result = await agentService.saveAgent(saveData);
      
      console.log('💾 저장 결과:', result);
      
      if (result.SUCCESS) {
        // 성공 모달 표시 (AGENT_ID는 숫자 타입으로 처리)
        const isUpdate = agentData.AGENT_ID && Number(agentData.AGENT_ID) > 0;
        
        console.log('🔍 성공 후 isUpdate 판단:', {
          agentDataAGENT_ID: agentData.AGENT_ID,
          agentDataAGENT_IDType: typeof agentData.AGENT_ID,
          agentDataAGENT_IDNumber: Number(agentData.AGENT_ID),
          isUpdate: isUpdate,
          originalData: !!originalData,
          originalDataKeys: originalData ? Object.keys(originalData) : []
        });
        
                 // 디버깅: isUpdate 판단 과정 확인 (AGENT_ID는 숫자 타입으로 처리)
         console.log('🔍 isUpdate 판단 과정:', {
           agentDataAGENT_ID: agentData.AGENT_ID,
           agentDataAGENT_IDType: typeof agentData.AGENT_ID,
           agentDataAGENT_IDValue: agentData.AGENT_ID,
           agentDataAGENT_IDGreaterThan0: agentData.AGENT_ID ? Number(agentData.AGENT_ID) > 0 : false,
           isUpdate: isUpdate,
           selectedAgentExists: !!selectedAgent,
           selectedAgentAGENT_ID: selectedAgent?.AGENT_ID
         });
        
        // 업데이트인 경우 변경된 필드 추적
        let changedFields: Array<{field: string, name: string, oldValue: any, newValue: any}> = [];
        console.log('🔍 변경된 필드 추적 조건 확인:', {
          isUpdate: isUpdate,
          originalData: !!originalData,
          originalDataKeys: originalData ? Object.keys(originalData) : [],
          agentDataKeys: Object.keys(agentData || {}),
          conditionMet: isUpdate && originalData
        });
        
        if (isUpdate) {
          console.log('🔍 수정 모드 - originalData 확인:', {
            originalData: originalData,
            agentData: agentData,
            isUpdate: isUpdate,
            originalDataKeys: Object.keys(originalData || {}),
            agentDataKeys: Object.keys(agentData || {}),
            originalDataAGENT_ID: originalData?.AGENT_ID,
            agentDataAGENT_ID: agentData?.AGENT_ID
          });
          
          // 변경된 필드 추적 실행 (originalData와 agentData 비교)
          console.log('🚀 getChangedFields 함수 호출 시작');
          changedFields = getChangedFields(originalData, agentData);
          console.log('✅ getChangedFields 함수 호출 완료, 결과:', changedFields);
          console.log('🔍 변경된 필드 추적 결과:', {
            originalData: originalData,
            agentData: agentData,
            changedFields: changedFields,
            changedFieldsLength: changedFields.length,
            changedFieldsType: typeof changedFields,
            changedFieldsIsArray: Array.isArray(changedFields),
            changedFieldsContent: changedFields.map(field => ({
              field: field.field,
              name: field.name,
              oldValue: field.oldValue,
              newValue: field.newValue
            }))
          });
        } else {
          console.log('⚠️ 수정 모드가 아니거나 originalData가 없음:', {
            isUpdate: isUpdate,
            originalData: originalData,
            agentData: agentData,
            originalDataType: typeof originalData,
            agentDataType: typeof agentData,
            originalDataIsNull: originalData === null,
            originalDataIsUndefined: originalData === undefined
          });
        }
        
        // 성공 모달 표시
        const successModalData = {
          isOpen: true,
          type: (isUpdate ? 'update' : 'save') as 'update' | 'save',
          message: result.MESSAGE || '거래처가 성공적으로 저장되었습니다.',
          details: isUpdate ? 
            (changedFields.length > 0 ? `${changedFields.length}개 항목이 변경되었습니다.` : '거래처 정보가 업데이트되었습니다.') : 
            '새로운 거래처가 등록되었습니다.',
          changedFields: isUpdate ? changedFields : undefined
        };
        
        // 디버깅: 성공 모달 데이터 확인
        console.log('✅ 성공 모달 데이터 설정 완료:', {
          isUpdate,
          changedFields,
          changedFieldsLength: changedFields?.length,
          successModalData
        });
        
        console.log('✅ 성공 모달 설정:', successModalData);
        console.log('🔍 changedFields 상세 확인:', {
          isUpdate: isUpdate,
          changedFields: changedFields,
          changedFieldsLength: changedFields?.length,
          changedFieldsType: typeof changedFields,
          changedFieldsIsArray: Array.isArray(changedFields)
        });
        setSuccessModal(successModalData);
        
        // 확인 모달 닫기 (수정 완료 후 팝업이 계속 뜨는 문제 해결)
        setConfirmationModal({ isOpen: false, type: 'save', onConfirm: () => {} });
        
        // 신규 등록인 경우 목록 새로고침 후 신규 모드 유지
        if (isNewMode) {
          await handleSearch(); // 목록 새로고침
          // 저장 후에도 신규 모드 유지하여 연속 등록 가능
        } else {
          // 수정인 경우 목록 새로고침
          await handleSearch();
        }
      } else {
        alert('저장에 실패했습니다: ' + (result.MESSAGE || '알 수 없는 오류'));
        // 실패 시에도 확인 모달 닫기
        setConfirmationModal({ isOpen: false, type: 'save', onConfirm: () => {} });
      }
    } catch (error) {
      console.error('💾 저장 오류:', error);
      
      // 에러 모달 표시
      setValidationModal({
        isOpen: true,
        errors: [{ field: 'general', message: `저장 중 오류가 발생했습니다: ${error instanceof Error ? error.message : '알 수 없는 오류'}` }]
      });
      
      // 에러 발생 시에도 확인 모달 닫기
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

  // 실제 삭제 로직
  const performDelete = async () => {
    if (!agentData || !agentData.AGENT_ID) {
      alert('삭제할 거래처 정보가 없습니다.');
      return;
    }

    try {
      console.log('🗑️ 거래처 삭제 시작:', agentData.AGENT_ID);
      
             // AgentService를 사용하여 거래처 삭제 (AGENT_ID는 숫자 문자열로 전달)
       const result = await agentService.deleteAgent(Number(agentData.AGENT_ID).toString(), currentAgentId || 'ADMIN');
      
      if (result.SUCCESS) {
        // 삭제 성공 모달 표시
        setSuccessModal({
          isOpen: true,
          type: 'delete',
          message: result.MESSAGE || '거래처가 성공적으로 삭제되었습니다.'
        });
        
        // 확인 모달 닫기 (삭제 완료 후 팝업이 계속 뜨는 문제 해결)
        setConfirmationModal({ isOpen: false, type: 'save', onConfirm: () => {} });
        
        // 목록 새로고침
        await handleSearch();
        
        // 신규 모드로 전환
        dispatch(setIsNewMode(true));
        dispatch(setAgentData({
          AGENT_NM: '',
          AGENT_GBN: '',
          CHANN_GBN: ''
        }));
      } else {
        alert('삭제에 실패했습니다: ' + (result.MESSAGE || '알 수 없는 오류'));
        // 실패 시에도 확인 모달 닫기
        setConfirmationModal({ isOpen: false, type: 'save', onConfirm: () => {} });
      }
    } catch (error) {
      console.error('🗑️ 삭제 오류:', error);
      
      // 서버 에러 정보 표시
      let errorMessage = '삭제 중 오류가 발생했습니다.';
      
      if (error instanceof Error) {
        const serverError = (error as any).serverError;
        
        if (serverError) {
          console.error('🔍 서버 오류 상세:', serverError);
          
          // 서버에서 반환한 상세 오류 메시지 표시
          if (serverError.message || serverError.MESSAGE) {
            errorMessage = `삭제 실패:\n${serverError.message || serverError.MESSAGE}`;
          }
          
          // 추가 디버깅 정보 콘솔 출력
          if (serverError.errorType) {
            console.error('🏷️ 오류 타입:', serverError.errorType);
          }
        } else {
          errorMessage = `삭제 실패:\n${error.message}`;
        }
      }
      
      // 에러 모달 표시
      setValidationModal({
        isOpen: true,
        errors: [{ field: 'general', message: errorMessage }]
      });
      
      // 에러 발생 시에도 확인 모달 닫기
      setConfirmationModal({ isOpen: false, type: 'save', onConfirm: () => {} });
    }
  };

  // 템플릿 다운로드 핸들러 (거래처등록은 유저 정보 불필요)
  const handleTemplateDownload = useCallback(async (event?: React.MouseEvent) => {
    // 이벤트 버블링 방지
    if (event) {
      event.stopPropagation();
      event.preventDefault();
    }
    
    console.log('📥 엑셀 템플릿 다운로드 시작 - handleTemplateDownload 함수 호출됨');
    console.log('현재 selectedAgent:', selectedAgent);
    console.log('현재 agentData:', agentData);
    
    try {
      // 거래처등록은 유저 정보가 필요 없음
      const downloadUrl = '/api/agents/download-template';
      console.log('요청 URL:', downloadUrl);
      
      // 백엔드 API 호출하여 템플릿 다운로드
      const response = await fetch(downloadUrl, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      // 파일 다운로드 처리
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', '거래처일괄등록_템플릿.xlsx');
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      
      console.log('✅ 엑셀 템플릿 다운로드 완료');
      
    } catch (error) {
      console.error('❌ 엑셀 템플릿 다운로드 오류:', error);
      alert('템플릿 다운로드 중 오류가 발생했습니다.');
    }
  }, []);


  // 엑셀 미리보기 모달 핸들러들
  const handleExcelPreviewSave = useCallback(async (selectedRows: ExcelDataRow[]) => {
    console.log('📤 선택된 거래처 데이터 저장 시작:', selectedRows.length);
    
    try {
      // 선택된 데이터를 서버 형식으로 변환 (TB_CS_AGENT.SQL 영문 필드명 기준)
      const agentsToSave = selectedRows.map(row => {
        // Excel 데이터 상세 로깅
        console.log(`🔍 Excel 데이터 상세 분석 - ${row.거래처명}:`);
        console.log(`  - row.종목: "${row.종목}" (타입: ${typeof row.종목})`);
        console.log(`  - row.거래제한미수금액: "${row.거래제한미수금액}" (타입: ${typeof row.거래제한미수금액})`);
        console.log(`  - row.할인율: "${row.할인율}" (타입: ${typeof row.할인율})`);
        console.log(`  - row.소수점반올림구분: "${row.소수점반올림구분}" (타입: ${typeof row.소수점반올림구분})`);
        console.log(`  - 전체 row 객체:`, row);
        
        const agentData: any = {
          AGENT_ID: undefined, // 기본값 설정
          AGENT_NM: row.거래처명,
          AGENT_ENG_NM: row.거래처영문명,
          SHORT_NM: row.거래처단축명,
          AGENT_GBN: row.거래처구분,
          CHANN_GBN: row.채널구분,
          AGENT_CEO: row.대표자명,
          AGENT_BNO: row.사업자번호,
          AGENT_TEL: row.전화번호,
          AGENT_FAX: row.팩스,
          ZIP_ID: row.우편번호,
          AGENT_ADDR1: row.우편번호주소,
          AGENT_ADDR2: row.상세주소,
          AGENT_YUP: row.업태,
          AGENT_JONG: row.종목,
          TRADE_LIM: row.거래제한미수금액,
          SALE_RATE: row.할인율,
          ROUND_GBN: row.소수점반올림구분,
          UPDN_CNT: row.반올림자릿수,
          BANK_ID: row.은행명,
          ACCOUNT_NO: row.계좌번호,
          ACCOUNT_OWNER: row.계좌주,
          DEPT_ID: row.담당부서,
          PERSON_ID: row.담당사원,
          TRADE_MEMO: row.특이사항,
          AGENT_EMAIL: row.거래처대표이메일,
          PAYMENT_TERM: row.결제기간,
          VAT_TYPE: row.부가세구분,
          TAX_EMAIL1: row.세금계산서수신이메일1,
          TAX_DAMDANG1: row.세금계산서담당자1,
          TAX_EMAIL2: row.세금계산서수신이메일2,
          TAX_DAMDANG2: row.세금계산서담당자2,
          OPEN_D: row.거래시작일자,
          CLOSE_D: row.거래종료일자
        };
        
        // 중복된 거래처인 경우 기존 ID를 포함하여 UPDATE 모드로 처리
        if (row.isDuplicate && row.existingAgentId && row.existingAgentData) {
          agentData.AGENT_ID = row.existingAgentId;
          
          // 기존 거래처의 데이터와 Excel 데이터를 병합
          // Excel에 값이 있으면 Excel 값 사용, 없으면 기존 값 유지
          const existingData = row.existingAgentData;
          
          // 값이 있는지 확인하는 헬퍼 함수
          const hasValue = (value: any) => {
            return value !== null && value !== undefined && value !== '';
          };
          
          // 필수 필드는 Excel 데이터 사용
          agentData.AGENT_NM = hasValue(row.거래처명) ? row.거래처명 : existingData.AGENT_NM;
          agentData.AGENT_GBN = hasValue(row.거래처구분) ? row.거래처구분 : existingData.AGENT_GBN;
          agentData.CHANN_GBN = hasValue(row.채널구분) ? row.채널구분 : existingData.CHANN_GBN;
          
          // 선택적 필드는 Excel에 값이 있으면 Excel 값, 없으면 기존 값 유지
          agentData.AGENT_ENG_NM = hasValue(row.거래처영문명) ? row.거래처영문명 : existingData.AGENT_ENG_NM;
          agentData.SHORT_NM = hasValue(row.거래처단축명) ? row.거래처단축명 : existingData.SHORT_NM;
          agentData.AGENT_CEO = hasValue(row.대표자명) ? row.대표자명 : existingData.AGENT_CEO;
          agentData.AGENT_BNO = hasValue(row.사업자번호) ? row.사업자번호 : existingData.AGENT_BNO;
          agentData.AGENT_TEL = hasValue(row.전화번호) ? row.전화번호 : existingData.AGENT_TEL;
          agentData.AGENT_FAX = hasValue(row.팩스) ? row.팩스 : existingData.AGENT_FAX;
          agentData.ZIP_ID = hasValue(row.우편번호) ? row.우편번호 : existingData.ZIP_ID;
          agentData.AGENT_ADDR1 = hasValue(row.우편번호주소) ? row.우편번호주소 : existingData.AGENT_ADDR1;
          agentData.AGENT_ADDR2 = hasValue(row.상세주소) ? row.상세주소 : existingData.AGENT_ADDR2;
          agentData.AGENT_YUP = hasValue(row.업태) ? row.업태 : existingData.AGENT_YUP;
          // 종목 필드 특별 처리 - Excel에 값이 있으면 반드시 Excel 값 사용
          if (hasValue(row.종목)) {
            agentData.AGENT_JONG = row.종목;
            console.log(`🔧 종목 필드 강제 처리: Excel 값 "${row.종목}" 사용`);
          } else {
            agentData.AGENT_JONG = existingData.AGENT_JONG;
            console.log(`🔧 종목 필드 기본 처리: 기존 값 "${existingData.AGENT_JONG}" 사용`);
          }
          agentData.TRADE_LIM = hasValue(row.거래제한미수금액) ? row.거래제한미수금액 : existingData.TRADE_LIM;
          agentData.SALE_RATE = hasValue(row.할인율) ? row.할인율 : existingData.SALE_RATE;
          agentData.ROUND_GBN = hasValue(row.소수점반올림구분) ? row.소수점반올림구분 : existingData.ROUND_GBN;
          agentData.UPDN_CNT = hasValue(row.반올림자릿수) ? row.반올림자릿수 : existingData.UPDN_CNT;
          agentData.BANK_ID = hasValue(row.은행명) ? row.은행명 : existingData.BANK_ID;
          agentData.ACCOUNT_NO = hasValue(row.계좌번호) ? row.계좌번호 : existingData.ACCOUNT_NO;
          agentData.ACCOUNT_OWNER = hasValue(row.계좌주) ? row.계좌주 : existingData.ACCOUNT_OWNER;
          agentData.DEPT_ID = hasValue(row.담당부서) ? row.담당부서 : existingData.DEPT_ID;
          agentData.PERSON_ID = hasValue(row.담당사원) ? row.담당사원 : existingData.PERSON_ID;
          agentData.TRADE_MEMO = hasValue(row.특이사항) ? row.특이사항 : existingData.TRADE_MEMO;
          agentData.AGENT_EMAIL = hasValue(row.거래처대표이메일) ? row.거래처대표이메일 : existingData.AGENT_EMAIL;
          agentData.PAYMENT_TERM = hasValue(row.결제기간) ? row.결제기간 : existingData.PAYMENT_TERM;
          agentData.VAT_TYPE = hasValue(row.부가세구분) ? row.부가세구분 : existingData.VAT_TYPE;
          agentData.TAX_EMAIL1 = hasValue(row.세금계산서수신이메일1) ? row.세금계산서수신이메일1 : existingData.TAX_EMAIL1;
          agentData.TAX_DAMDANG1 = hasValue(row.세금계산서담당자1) ? row.세금계산서담당자1 : existingData.TAX_DAMDANG1;
          agentData.TAX_EMAIL2 = hasValue(row.세금계산서수신이메일2) ? row.세금계산서수신이메일2 : existingData.TAX_EMAIL2;
          agentData.TAX_DAMDANG2 = hasValue(row.세금계산서담당자2) ? row.세금계산서담당자2 : existingData.TAX_DAMDANG2;
          agentData.OPEN_D = hasValue(row.거래시작일자) ? row.거래시작일자 : existingData.OPEN_D;
          agentData.CLOSE_D = hasValue(row.거래종료일자) ? row.거래종료일자 : existingData.CLOSE_D;
          
          console.log(`🔄 중복 거래처 UPDATE 모드: ${row.거래처명} (ID: ${row.existingAgentId})`);
          console.log(`📊 데이터 병합 상세 정보:`);
          console.log(`  - 종목: Excel(${row.종목}) + 기존(${existingData.AGENT_JONG}) = 최종(${agentData.AGENT_JONG})`);
          console.log(`  - 할인율: Excel(${row.할인율}) + 기존(${existingData.SALE_RATE}) = 최종(${agentData.SALE_RATE})`);
          console.log(`  - 소수점반올림구분: Excel(${row.소수점반올림구분}) + 기존(${existingData.ROUND_GBN}) = 최종(${agentData.ROUND_GBN})`);
          console.log(`  - 거래제한미수금액: Excel(${row.거래제한미수금액}) + 기존(${existingData.TRADE_LIM}) = 최종(${agentData.TRADE_LIM})`);
          console.log(`  - 반올림자릿수: Excel(${row.반올림자릿수}) + 기존(${existingData.UPDN_CNT}) = 최종(${agentData.UPDN_CNT})`);
          console.log(`  - 결제기간: Excel(${row.결제기간}) + 기존(${existingData.PAYMENT_TERM}) = 최종(${agentData.PAYMENT_TERM})`);
          console.log(`  - 부가세구분: Excel(${row.부가세구분}) + 기존(${existingData.VAT_TYPE}) = 최종(${agentData.VAT_TYPE})`);
          console.log(`  - 거래시작일자: Excel(${row.거래시작일자}) + 기존(${existingData.OPEN_D}) = 최종(${agentData.OPEN_D})`);
          console.log(`  - 거래종료일자: Excel(${row.거래종료일자}) + 기존(${existingData.CLOSE_D}) = 최종(${agentData.CLOSE_D})`);
          
          // 종목 필드 상세 분석
          console.log(`🔍 종목 필드 상세 분석:`);
          console.log(`  - Excel 종목 값: "${row.종목}" (타입: ${typeof row.종목})`);
          console.log(`  - Excel 종목 hasValue: ${hasValue(row.종목)}`);
          console.log(`  - 기존 종목 값: "${existingData.AGENT_JONG}" (타입: ${typeof existingData.AGENT_JONG})`);
          console.log(`  - 최종 종목 값: "${agentData.AGENT_JONG}" (타입: ${typeof agentData.AGENT_JONG})`);
        } else {
          console.log(`➕ 신규 거래처 INSERT 모드: ${row.거래처명}`);
          console.log(`  - 거래시작일자: ${agentData.OPEN_D}`);
          console.log(`  - 거래종료일자: ${agentData.CLOSE_D}`);
        }
        
        return agentData;
      });
      
      console.log('📤 변환된 거래처 데이터:', agentsToSave);
      
      // 백엔드 API 호출 (거래처 등록은 사용자 정보 불필요)
      const response = await fetch('/api/agents/batch-upload', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          agents: agentsToSave
        }),
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const result = await response.json();
      console.log('📤 일괄 업로드 결과:', result);
      
      // 미리보기 모달 닫기
      setExcelPreviewModal({ isOpen: false, data: [] });
      
      // 결과 모달 표시
      setUploadResultModal({
        isOpen: true,
        result: result
      });
      
      // 성공한 경우 목록 새로고침
      if (result.SUCCESS) {
        await handleSearch();
      }
      
    } catch (error) {
      console.error('❌ 일괄 업로드 오류:', error);
      
      // 에러 결과 생성
      const errorResult: ExcelUploadResult = {
        SUCCESS: false,
        TOTAL_COUNT: selectedRows.length,
        SUCCESS_COUNT: 0,
        FAIL_COUNT: selectedRows.length,
        MESSAGE: `일괄 업로드 중 오류가 발생했습니다: ${error instanceof Error ? error.message : '알 수 없는 오류'}`,
        ERROR_MESSAGES: selectedRows.map((row) => 
          `행 ${row.rowIndex}: 서버 오류로 인한 업로드 실패`
        )
      };
      
      // 미리보기 모달 닫기
      setExcelPreviewModal({ isOpen: false, data: [] });
      
      // 에러 결과 모달 표시
      setUploadResultModal({
        isOpen: true,
        result: errorResult
      });
    }
  }, [handleSearch]);

  const handleExcelPreviewCancel = useCallback(() => {
    setExcelPreviewModal({ isOpen: false, data: [] });
  }, []);

  // 그리드 준비 완료
  const onGridReady = () => {
    console.log('AG Grid 준비 완료');
  };

  // 그리드 행 클릭
  const onRowClicked = async (event: any) => {
    try {
      const selectedData = event.data;
      console.log('=== 거래처 상세 조회 시작 ===');
      console.log('선택된 거래처 데이터:', selectedData);
      console.log('AGENT_ID 타입:', typeof selectedData.AGENT_ID);
      console.log('AGENT_ID 값:', selectedData.AGENT_ID);
      
             if (selectedData.AGENT_ID) {
         // AGENT_ID를 숫자 타입으로 처리하되, API 호출 시에는 문자열로 변환
         const agentId = Number(selectedData.AGENT_ID);
         console.log('전송할 AGENT_ID:', agentId);
         
         // 백엔드에서 상세 정보 조회 (종료된 거래처도 조회)
         const detailData = await agentService.getAgentDetail(agentId.toString(), false);
        console.log('백엔드 응답 데이터:', detailData);
        
        // 그리드 데이터의 날짜 정보도 함께 확인
        console.log('📅 그리드 선택된 데이터의 날짜:', {
          그리드_OPEN_D: selectedData.OPEN_D,
          그리드_OPEN_D_Type: typeof selectedData.OPEN_D,
          그리드_CLOSE_D: selectedData.CLOSE_D,
          그리드_CLOSE_D_Type: typeof selectedData.CLOSE_D
        });
        
        // 일자 데이터를 yyyy-mm-dd 형식으로 변환 (스토어드프로시저가 이미 yyyy-mm-dd 형태로 반환)
        console.log('📅 백엔드 원본 날짜 데이터:', {
          OPEN_D: detailData.OPEN_D,
          OPEN_D_Type: typeof detailData.OPEN_D,
          CLOSE_D: detailData.CLOSE_D,
          CLOSE_D_Type: typeof detailData.CLOSE_D
        });
        
        // 그리드에서 날짜 값을 추출 (valueFormatter와 동일한 로직 사용)
        const gridOpenDate = extractDateFromGridData(selectedData, 'OPEN_D');
        const gridCloseDate = extractDateFromGridData(selectedData, 'CLOSE_D');
        
        console.log('📅 그리드에서 추출한 날짜:', {
          gridOpenDate,
          gridCloseDate
        });
        
        // 백엔드 데이터를 기본으로 하되, 그리드의 날짜 데이터가 더 정확한 경우 사용
        const formattedData = {
          ...detailData,
          OPEN_D: formatDateToYYYYMMDD(detailData.OPEN_D || gridOpenDate),
          CLOSE_D: formatDateToYYYYMMDD(detailData.CLOSE_D || gridCloseDate)
        };
        
        console.log('📅 변환된 날짜 데이터:', {
          OPEN_D: formattedData.OPEN_D,
          CLOSE_D: formattedData.CLOSE_D
        });
        
        // 날짜 필드가 빈 값인 경우 기본값 설정
        if (!formattedData.OPEN_D) {
          formattedData.OPEN_D = new Date().toISOString().split('T')[0];
          console.log('📅 거래시작일자 기본값 설정:', formattedData.OPEN_D);
        }
        
        // 거래종료일자는 빈 값이 정상이지만, 폼에서 표시되지 않는 문제 해결을 위해 명시적으로 설정
        if (formattedData.CLOSE_D === undefined || formattedData.CLOSE_D === null) {
          formattedData.CLOSE_D = '';
          console.log('📅 거래종료일자 빈 값으로 설정:', formattedData.CLOSE_D);
        }
        
        // Redux store에 선택된 거래처와 거래처 데이터 저장
        dispatch(setSelectedAgent(formattedData));
        dispatch(setAgentData(formattedData));
        dispatch(setIsNewMode(false));
        
        // 백엔드에서 받은 정확한 데이터를 originalData로 저장 (변경 추적용)
        setOriginalData({ ...formattedData });
        
        console.log('📅 최종 설정된 agentData:', {
          OPEN_D: formattedData.OPEN_D,
          CLOSE_D: formattedData.CLOSE_D
        });
         console.log('상세 정보 로드 완료:', formattedData);
         console.log('🔍 selectedAgent 설정 완료:', formattedData);
         console.log('🔍 AGENT_ID 확인:', {
           formattedDataAGENT_ID: formattedData.AGENT_ID,
           formattedDataAGENT_IDType: typeof formattedData.AGENT_ID,
           formattedDataAGENT_IDGreaterThan0: formattedData.AGENT_ID ? Number(formattedData.AGENT_ID) > 0 : false
         });
      } else {
        console.log('AGENT_ID가 없음 - 기본 데이터 사용');
        // AGENT_ID가 없는 경우 기본 데이터 사용
        console.log('📅 그리드 선택 날짜 데이터:', {
          OPEN_D: selectedData.OPEN_D,
          OPEN_D_Type: typeof selectedData.OPEN_D,
          CLOSE_D: selectedData.CLOSE_D,
          CLOSE_D_Type: typeof selectedData.CLOSE_D
        });
        
        // 그리드에서 날짜 값을 추출 (valueFormatter와 동일한 로직 사용)
        const gridOpenDate = extractDateFromGridData(selectedData, 'OPEN_D');
        const gridCloseDate = extractDateFromGridData(selectedData, 'CLOSE_D');
        
        console.log('📅 그리드에서 추출한 날짜 (AGENT_ID 없음):', {
          gridOpenDate,
          gridCloseDate
        });
        
        const formattedData = {
          ...selectedData,
          OPEN_D: formatDateToYYYYMMDD(gridOpenDate),
          CLOSE_D: formatDateToYYYYMMDD(gridCloseDate)
        };
        
        console.log('📅 그리드 변환된 날짜 데이터:', {
          OPEN_D: formattedData.OPEN_D,
          CLOSE_D: formattedData.CLOSE_D
        });
        
        // 날짜 필드가 빈 값인 경우 기본값 설정
        if (!formattedData.OPEN_D) {
          formattedData.OPEN_D = new Date().toISOString().split('T')[0];
          console.log('📅 그리드 거래시작일자 기본값 설정:', formattedData.OPEN_D);
        }
        
        // 거래종료일자는 빈 값이 정상이지만, 폼에서 표시되지 않는 문제 해결을 위해 명시적으로 설정
        if (formattedData.CLOSE_D === undefined || formattedData.CLOSE_D === null) {
          formattedData.CLOSE_D = '';
          console.log('📅 그리드 거래종료일자 빈 값으로 설정:', formattedData.CLOSE_D);
        }
        
        // Redux store에 선택된 거래처와 거래처 데이터 저장
        dispatch(setSelectedAgent(formattedData));
        dispatch(setAgentData(formattedData));
        dispatch(setIsNewMode(false));
        
        console.log('📅 그리드 최종 설정된 agentData:', {
          OPEN_D: formattedData.OPEN_D,
          CLOSE_D: formattedData.CLOSE_D
        });
      }
    } catch (error) {
      console.error('=== 거래처 상세 정보 조회 실패 ===');
      console.error('에러 객체:', error);
      console.error('에러 메시지:', error instanceof Error ? error.message : '알 수 없는 오류');
      console.error('에러 스택:', error instanceof Error ? error.stack : '스택 없음');
      
      // 에러 발생 시 기본 데이터라도 표시
      const selectedData = event.data;
      console.log('📅 에러 시 그리드 날짜 데이터:', {
        OPEN_D: selectedData.OPEN_D,
        OPEN_D_Type: typeof selectedData.OPEN_D,
        CLOSE_D: selectedData.CLOSE_D,
        CLOSE_D_Type: typeof selectedData.CLOSE_D
      });
      
      // 그리드에서 날짜 값을 추출 (valueFormatter와 동일한 로직 사용)
      const gridOpenDate = extractDateFromGridData(selectedData, 'OPEN_D');
      const gridCloseDate = extractDateFromGridData(selectedData, 'CLOSE_D');
      
      console.log('📅 에러 시 그리드에서 추출한 날짜:', {
        gridOpenDate,
        gridCloseDate
      });
      
      const formattedData = {
        ...selectedData,
        OPEN_D: formatDateToYYYYMMDD(gridOpenDate),
        CLOSE_D: formatDateToYYYYMMDD(gridCloseDate)
      };
      
      console.log('📅 에러 시 변환된 날짜 데이터:', {
        OPEN_D: formattedData.OPEN_D,
        CLOSE_D: formattedData.CLOSE_D
      });
      
      // 날짜 필드가 빈 값인 경우 기본값 설정
      if (!formattedData.OPEN_D) {
        formattedData.OPEN_D = new Date().toISOString().split('T')[0];
        console.log('📅 에러 시 거래시작일자 기본값 설정:', formattedData.OPEN_D);
      }
      
      // 거래종료일자는 빈 값이 정상이지만, 폼에서 표시되지 않는 문제 해결을 위해 명시적으로 설정
      if (formattedData.CLOSE_D === undefined || formattedData.CLOSE_D === null) {
        formattedData.CLOSE_D = '';
        console.log('📅 에러 시 거래종료일자 빈 값으로 설정:', formattedData.CLOSE_D);
      }
      
      // Redux store에 선택된 거래처와 거래처 데이터 저장
      dispatch(setSelectedAgent(formattedData));
      dispatch(setAgentData(formattedData));
      dispatch(setIsNewMode(false));
      
      console.log('📅 에러 시 최종 설정된 agentData:', {
        OPEN_D: formattedData.OPEN_D,
        CLOSE_D: formattedData.CLOSE_D
      });
      
      // 에러 모달 표시
      setValidationModal({
        isOpen: true,
        errors: [{ field: 'general', message: `거래처 상세 정보 조회에 실패했습니다: ${error instanceof Error ? error.message : '알 수 없는 오류'}` }]
      });
    }
  };

  // 그리드 행 선택 (기존 함수 유지)
  const onRowSelected = (event: any) => {
    if (event.node.isSelected()) {
      const selectedData = event.data;
      console.log('🔍 onRowSelected - 선택된 데이터:', selectedData);
      
      // 원본 데이터 저장 (수정 시 변경된 필드 추적용)
      setOriginalData({ ...selectedData });
      
      dispatch(setSelectedAgent(selectedData));
      dispatch(setAgentData(selectedData));
      dispatch(setIsNewMode(false));
      console.log('🔍 onRowSelected - 상태 설정 완료');
             console.log('🔍 onRowSelected - AGENT_ID 확인:', {
         selectedDataAGENT_ID: selectedData.AGENT_ID,
         selectedDataAGENT_IDType: typeof selectedData.AGENT_ID,
         selectedDataAGENT_IDGreaterThan0: selectedData.AGENT_ID ? Number(selectedData.AGENT_ID) > 0 : false
       });
    }
  };

  return (
    <div className="agent-registration">
      {/* TOP 구역 - 검색 조건 및 버튼 */}
      <div className="agent-top-section">
        <div className="agent-page-title">
          {currentTab?.menuIcon ? (
            React.createElement(getMenuIcon(currentTab.menuIcon), { size: 16 })
          ) : (
            <i className="fas fa-building"></i>
          )}
          거래처등록
        </div>
        
        {/* 검색 조건 */}
        <div className="agent-search-conditions">
          {/* 1라인: 거래처구분, 채널구분 */}
          <div className="agent-search-row">
            <div className="agent-search-item">
              <CommonMultiSelect
                label="거래처구분"
                options={agentGbnOptions}
                selectedValues={searchCondition.agentGbn}
                onSelectionChange={(values) => handleSearchConditionChange('agentGbn', values)}
                placeholder="거래처구분을 선택하세요"
              />
            </div>
            <div className="agent-search-item">
              <CommonMultiSelect
                label="채널구분"
                options={channGbnOptions}
                selectedValues={searchCondition.channGbn}
                onSelectionChange={(values) => handleSearchConditionChange('channGbn', values)}
                placeholder="채널구분을 선택하세요"
              />
            </div>
          </div>
          
          {/* 2라인: 거래처명, 종료된거래처제외 */}
          <div className="agent-search-row">
            <div className="agent-search-item">
              <label>거래처명</label>
              <input
                type="text"
                placeholder="거래처명을 입력하세요"
                value={searchCondition.agentName || ''}
                onChange={(e) => handleSearchConditionChange('agentName', e.target.value)}
              />
            </div>
            <div className="agent-search-item">
              <label className="agent-checkbox-label">
                <input
                  type="checkbox"
                  checked={searchCondition.excludeTerminated || false}
                  onChange={(e) => handleSearchConditionChange('excludeTerminated', e.target.checked)}
                />
                종료된거래처제외
              </label>
            </div>
          </div>
          
                     {/* 액션 버튼 */}
           <div className="agent-action-buttons">
             <div className="agent-left-buttons">
               {/* 삭제 버튼 - 삭제 권한 체크 */}
               {deletePermission.hasPermission && (
                 <button className="agent-btn-delete" onClick={handleDelete}>
                   <i className="fas fa-trash"></i> 삭제
                 </button>
               )}
             </div>
             <div className="agent-right-buttons">
               {/* 초기화 버튼 - 권한 체크 없음 */}
               <button className="agent-btn-new" onClick={handleNew}>
                 <i className="fas fa-undo"></i> 초기화
               </button>
               {/* 조회 버튼 - 조회 권한 체크 */}
               {viewPermission.hasPermission && (
                 <button 
                   className="agent-btn-search" 
                   onClick={handleSearch}
                   disabled={isLoading}
                 >
                   <i className={isLoading ? "fas fa-spinner fa-spin" : "fas fa-search"}></i> 
                   {isLoading ? '검색중...' : '조회'}
                 </button>
               )}

             </div>
           </div>
        </div>
      </div>

      {/* LEFT & RIGHT 구역 컨테이너 */}
      <div className="agent-content-container">
                 {/* LEFT 구역 - 거래처 목록 그리드 */}
         <div className="agent-left-section">
            <h3>
              <i className="fas fa-list"></i>
               거래처 목록
            </h3>
            <div className="grid-container">
              {isGridReady && (
                 <div className="ag-theme-alpine">
                <AgGridReact
                    columnDefs={columnDefs}
                    rowData={gridData}
                    onGridReady={onGridReady}
                    onRowClicked={onRowClicked}
                    onRowSelected={onRowSelected}
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
             <span>총 {gridData.length}개 거래처</span>
           </div>
           
           
        </div>

                 {/* RIGHT 구역 - 거래처 상세 정보 */}
         <div className="agent-right-section">
           <h3>
             <i className="fas fa-edit"></i>
             거래처 상세 정보
           </h3>
           <div className="agent-detail-container">
            
            {/* 기본 정보 */}
            <div className="agent-detail-section">
              <h4>기본 정보</h4>
              <div className="agent-form-row">
                                 <div className="agent-form-item">
                   <label>거래처코드</label>
                   <input
                     type="text"
                     value={agentData.AGENT_ID || ''}
                     disabled
                     placeholder="자동생성"
                   />
                 </div>
                <div className="agent-form-item required">
                  <label>거래처명 <span className="required-mark">*</span></label>
                  <input
                    type="text"
                    value={agentData.AGENT_NM || ''}
                    onChange={(e) => handleAgentDataChange('AGENT_NM', e.target.value)}
                    placeholder="거래처명을 입력하세요"
                    required
                  />
                </div>
              </div>
              
              <div className="agent-form-row">
                <div className="agent-form-item">
                  <label>영문명</label>
                  <input
                    type="text"
                    value={agentData.AGENT_ENG_NM || ''}
                    onChange={(e) => handleAgentDataChange('AGENT_ENG_NM', e.target.value)}
                    placeholder="영문명을 입력하세요"
                  />
                </div>
                <div className="agent-form-item">
                  <label>단축명</label>
                  <input
                    type="text"
                    value={agentData.SHORT_NM || ''}
                    onChange={(e) => handleAgentDataChange('SHORT_NM', e.target.value)}
                    placeholder="단축명을 입력하세요"
                  />
                </div>
              </div>
              
              <div className="agent-form-row">
                                 <div className="agent-form-item required">
                   <label>거래처구분 <span className="required-mark">*</span></label>
                   <select 
                     value={agentData.AGENT_GBN || ''}
                     onChange={(e) => handleAgentDataChange('AGENT_GBN', e.target.value)}
                     required
                   >
                     <option value="">선택하세요</option>
                     {agentGbnOptions.map((item: CommonCodeOption) => (
                       <option key={item.value} value={item.value}>
                         {item.label}
                       </option>
                     ))}
                   </select>
                 </div>
                  <div className="agent-form-item required">
                   <label>채널구분 <span className="required-mark">*</span></label>
                   <select 
                     value={agentData.CHANN_GBN || ''}
                     onChange={(e) => handleAgentDataChange('CHANN_GBN', e.target.value)}
                     required
                   >
                     <option value="">선택하세요</option>
                                                          {channGbnOptions.map((item: CommonCodeOption) => (
                       <option key={item.value} value={item.value}>
                         {item.label}
                       </option>
                     ))}
                   </select>
                 </div>
              </div>
            </div>

                         {/* 대표자 정보 */}
             <div className="agent-detail-section">
               <h4>대표자 정보</h4>
               <div className="agent-form-row">
                 <div className="agent-form-item">
                   <label>대표자명</label>
                   <input
                     type="text"
                     value={agentData.AGENT_CEO || ''}
                     onChange={(e) => handleAgentDataChange('AGENT_CEO', e.target.value)}
                     placeholder="대표자명을 입력하세요"
                   />
                 </div>
                 <div className="agent-form-item">
                   <label>사업자번호</label>
                   <input
                     type="text"
                     value={agentData.AGENT_BNO || ''}
                     onChange={(e) => handleAgentDataChange('AGENT_BNO', e.target.value)}
                     placeholder="사업자번호를 입력하세요"
                   />
                 </div>
               </div>
               
               <div className="agent-form-row">
                 <div className="agent-form-item">
                   <label>전화번호</label>
                   <input
                     type="text"
                     value={agentData.AGENT_TEL || ''}
                     onChange={(e) => handleAgentDataChange('AGENT_TEL', e.target.value)}
                     placeholder="전화번호를 입력하세요"
                   />
                 </div>
                 <div className="agent-form-item">
                   <label>팩스</label>
                   <input
                     type="text"
                     value={agentData.AGENT_FAX || ''}
                     onChange={(e) => handleAgentDataChange('AGENT_FAX', e.target.value)}
                     placeholder="팩스번호를 입력하세요"
                   />
                 </div>
               </div>
               
               <div className="agent-form-row">
                 <div className="agent-form-item">
                   <label>거래처대표이메일</label>
                   <input
                     type="email"
                     value={agentData.AGENT_EMAIL || ''}
                     onChange={(e) => handleAgentDataChange('AGENT_EMAIL', e.target.value)}
                     placeholder="이메일을 입력하세요"
                   />
                 </div>
               </div>
             </div>

            {/* 주소 정보 */}
            <div className="agent-detail-section">
              <h4>주소 정보</h4>
              <div className="agent-form-row">
                <div className="agent-form-item">
                  <label>우편번호</label>
                  <input
                    type="text"
                    value={agentData.ZIP_ID || ''}
                    onChange={(e) => handleAgentDataChange('ZIP_ID', e.target.value)}
                    placeholder="우편번호를 입력하세요"
                  />
                </div>
              </div>
              
              <div className="agent-form-row">
                <div className="agent-form-item full-width">
                  <label>주소</label>
                  <input
                    type="text"
                    value={agentData.AGENT_ADDR1 || ''}
                    onChange={(e) => handleAgentDataChange('AGENT_ADDR1', e.target.value)}
                    placeholder="주소를 입력하세요"
                  />
                </div>
              </div>
              
              <div className="agent-form-row">
                <div className="agent-form-item full-width">
                  <label>상세주소</label>
                  <input
                    type="text"
                    value={agentData.AGENT_ADDR2 || ''}
                    onChange={(e) => handleAgentDataChange('AGENT_ADDR2', e.target.value)}
                    placeholder="상세주소를 입력하세요"
                  />
                </div>
              </div>
            </div>

            {/* 업태/종목 */}
            <div className="agent-detail-section">
              <h4>업태/종목</h4>
              <div className="agent-form-row">
                <div className="agent-form-item">
                  <label>업태</label>
                  <input
                    type="text"
                    value={agentData.AGENT_YUP || ''}
                    onChange={(e) => handleAgentDataChange('AGENT_YUP', e.target.value)}
                    placeholder="업태를 입력하세요"
                  />
                </div>
                <div className="agent-form-item">
                  <label>종목</label>
                  <input
                    type="text"
                    value={agentData.AGENT_JONG || ''}
                    onChange={(e) => handleAgentDataChange('AGENT_JONG', e.target.value)}
                    placeholder="종목을 입력하세요"
                  />
                </div>
              </div>
            </div>

            {/* 거래 조건 */}
            <div className="agent-detail-section">
              <h4>거래 조건</h4>
              <div className="agent-form-row">
                <div className="agent-form-item">
                  <label>거래제한미수금액</label>
                  <div className="agent-number-input-container">
                    <input
                      type="text"
                      value={formatNumber(agentData.TRADE_LIM || '')}
                      onChange={(e) => {
                        const cleanValue = removeNumberFormat(e.target.value);
                        handleAgentDataChange('TRADE_LIM', cleanValue);
                      }}
                      placeholder="거래제한금액을 입력하세요"
                      className="agent-number-input-field"
                    />
                    <div className="agent-custom-spinner">
                      <button 
                        type="button"
                        className="agent-spinner-btn agent-spinner-up"
                        onClick={() => {
                          const currentValue = Number(agentData.TRADE_LIM || 0);
                          handleAgentDataChange('TRADE_LIM', (currentValue + 1000).toString());
                        }}
                      >
                        <svg width="8" height="6" viewBox="0 0 8 6" fill="none">
                          <path d="M4 0L8 6H0L4 0Z" fill="currentColor"/>
                        </svg>
                      </button>
                      <button 
                        type="button"
                        className="agent-spinner-btn agent-spinner-down"
                        onClick={() => {
                          const currentValue = Number(agentData.TRADE_LIM || 0);
                          if (currentValue > 0) {
                            handleAgentDataChange('TRADE_LIM', Math.max(0, currentValue - 1000).toString());
                          }
                        }}
                      >
                        <svg width="8" height="6" viewBox="0 0 8 6" fill="none">
                          <path d="M4 6L0 0H8L4 6Z" fill="currentColor"/>
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
                <div className="agent-form-item">
                  <label>할인율 (%)</label>
                  <div className="agent-number-input-container">
                    <input
                      type="text"
                      value={formatNumber(agentData.SALE_RATE || '')}
                      onChange={(e) => {
                        const cleanValue = removeNumberFormat(e.target.value);
                        handleAgentDataChange('SALE_RATE', cleanValue);
                      }}
                      placeholder="할인율을 입력하세요"
                      className="agent-number-input-field"
                    />
                    <div className="agent-custom-spinner">
                      <button 
                        type="button"
                        className="agent-spinner-btn agent-spinner-up"
                        onClick={() => {
                          const currentValue = Number(agentData.SALE_RATE || 0);
                          handleAgentDataChange('SALE_RATE', currentValue + 0.1);
                        }}
                      >
                        <svg width="8" height="6" viewBox="0 0 8 6" fill="none">
                          <path d="M4 0L8 6H0L4 0Z" fill="currentColor"/>
                        </svg>
                      </button>
                      <button 
                        type="button"
                        className="agent-spinner-btn agent-spinner-down"
                        onClick={() => {
                          const currentValue = Number(agentData.SALE_RATE || 0);
                          if (currentValue > 0) {
                            handleAgentDataChange('SALE_RATE', Math.max(0, currentValue - 0.1));
                          }
                        }}
                      >
                        <svg width="8" height="6" viewBox="0 0 8 6" fill="none">
                          <path d="M4 6L0 0H8L4 6Z" fill="currentColor"/>
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="agent-form-row">
                <div className="agent-form-item">
                  <label>소수점반올림구분</label>
                  <div className="agent-radio-group">
                    <label>
                      <input
                        type="radio"
                        name="roundGbn"
                        value="Y"
                        checked={agentData.ROUND_GBN === 'Y'}
                        onChange={(e) => handleAgentDataChange('ROUND_GBN', e.target.value)}
                      />
                      YES
                    </label>
                    <label>
                      <input
                        type="radio"
                        name="roundGbn"
                        value="N"
                        checked={agentData.ROUND_GBN === 'N'}
                        onChange={(e) => handleAgentDataChange('ROUND_GBN', e.target.value)}
                      />
                      NO
                    </label>
                  </div>
                </div>
                                 <div className="agent-form-item">
                   <label>반올림자릿수</label>
                   <div className="agent-number-input-container">
                     <input
                       type="number"
                       value={agentData.UPDN_CNT || ''}
                       onChange={(e) => handleAgentDataChange('UPDN_CNT', Number(e.target.value))}
                       placeholder="반올림자릿수를 입력하세요"
                       className="agent-number-input-field"
                     />
                     <div className="agent-custom-spinner">
                       <button 
                         type="button"
                         className="agent-spinner-btn agent-spinner-up"
                         onClick={() => {
                           const currentValue = Number(agentData.UPDN_CNT || 0);
                           handleAgentDataChange('UPDN_CNT', currentValue + 1);
                         }}
                       >
                         <svg width="8" height="6" viewBox="0 0 8 6" fill="none">
                           <path d="M4 0L8 6H0L4 0Z" fill="currentColor"/>
                         </svg>
                       </button>
                       <button 
                         type="button"
                         className="agent-spinner-btn agent-spinner-down"
                         onClick={() => {
                           const currentValue = Number(agentData.UPDN_CNT || 0);
                           if (currentValue > 0) {
                             handleAgentDataChange('UPDN_CNT', Math.max(0, currentValue - 1));
                           }
                         }}
                       >
                         <svg width="8" height="6" viewBox="0 0 8 6" fill="none">
                           <path d="M4 6L0 0H8L4 6Z" fill="currentColor"/>
                         </svg>
                       </button>
                     </div>
                   </div>
                 </div>
              </div>
            </div>

            {/* 계좌 정보 */}
            <div className="agent-detail-section">
              <h4>계좌 정보</h4>
              <div className="agent-form-row">
                                 <div className="agent-form-item">
                   <label>은행</label>
                   <select 
                     value={agentData.BANK_ID || ''}
                     onChange={(e) => handleAgentDataChange('BANK_ID', e.target.value)}
                   >
                     <option value="">선택하세요</option>
                     {bankGbnOptions.map((item: CommonCodeOption) => (
                       <option key={item.value} value={item.value}>
                         {item.label}
                       </option>
                     ))}
                   </select>
                 </div>
                <div className="agent-form-item">
                  <label>계좌번호</label>
                  <input
                    type="text"
                    value={agentData.ACCOUNT_NO || ''}
                    onChange={(e) => handleAgentDataChange('ACCOUNT_NO', e.target.value)}
                    placeholder="계좌번호를 입력하세요"
                  />
                </div>
              </div>
              
              <div className="agent-form-row">
                <div className="agent-form-item">
                  <label>계좌주</label>
                  <input
                    type="text"
                    value={agentData.ACCOUNT_OWNER || ''}
                    onChange={(e) => handleAgentDataChange('ACCOUNT_OWNER', e.target.value)}
                    placeholder="계좌주를 입력하세요"
                  />
                </div>
              </div>
            </div>

            {/* 담당자 정보 */}
            <div className="agent-detail-section">
              <h4>담당자 정보</h4>
              <div className="agent-form-row">
                <div className="agent-form-item">
                  <label>담당부서</label>
                  <input
                    type="text"
                    value={agentData.DEPT_ID || ''}
                    onChange={(e) => handleAgentDataChange('DEPT_ID', e.target.value)}
                    placeholder="담당부서를 입력하세요"
                  />
                </div>
                <div className="agent-form-item">
                  <label>담당사원</label>
                  <input
                    type="text"
                    value={agentData.PERSON_ID || ''}
                    onChange={(e) => handleAgentDataChange('PERSON_ID', e.target.value)}
                    placeholder="담당사원을 입력하세요"
                  />
                </div>
              </div>
            </div>

            {/* 세금계산서 정보 */}
            <div className="agent-detail-section">
              <h4>세금계산서 정보</h4>
              <div className="agent-form-row">
                <div className="agent-form-item">
                  <label>부가세구분</label>
                  <div className="agent-radio-group">
                    <label>
                      <input
                        type="radio"
                        name="vatType"
                        value="과세"
                        checked={agentData.VAT_TYPE === '과세'}
                        onChange={(e) => handleAgentDataChange('VAT_TYPE', e.target.value)}
                      />
                      과세
                    </label>
                    <label>
                      <input
                        type="radio"
                        name="vatType"
                        value="면세"
                        checked={agentData.VAT_TYPE === '면세'}
                        onChange={(e) => handleAgentDataChange('VAT_TYPE', e.target.value)}
                      />
                      면세
                    </label>
                  </div>
                </div>
                                 <div className="agent-form-item">
                   <label>결제기간 (일)</label>
                   <div className="agent-number-input-container">
                     <input
                       type="number"
                       value={agentData.PAYMENT_TERM || ''}
                       onChange={(e) => handleAgentDataChange('PAYMENT_TERM', Number(e.target.value))}
                       placeholder="결제기간을 입력하세요"
                       className="agent-number-input-field"
                     />
                     <div className="agent-custom-spinner">
                       <button 
                         type="button"
                         className="agent-spinner-btn agent-spinner-up"
                         onClick={() => {
                           const currentValue = Number(agentData.PAYMENT_TERM || 0);
                           handleAgentDataChange('PAYMENT_TERM', currentValue + 1);
                         }}
                       >
                         <svg width="8" height="6" viewBox="0 0 8 6" fill="none">
                           <path d="M4 0L8 6H0L4 0Z" fill="currentColor"/>
                         </svg>
                       </button>
                       <button 
                         type="button"
                         className="agent-spinner-btn agent-spinner-down"
                         onClick={() => {
                           const currentValue = Number(agentData.PAYMENT_TERM || 0);
                           if (currentValue > 0) {
                             handleAgentDataChange('PAYMENT_TERM', Math.max(0, currentValue - 1));
                           }
                         }}
                       >
                         <svg width="8" height="6" viewBox="0 0 8 6" fill="none">
                           <path d="M4 6L0 0H8L4 6Z" fill="currentColor"/>
                         </svg>
                       </button>
                     </div>
                   </div>
                 </div>
              </div>
              
              <div className="agent-form-row">
                <div className="agent-form-item">
                  <label>세금계산서수신이메일1</label>
                  <input
                    type="email"
                    value={agentData.TAX_EMAIL1 || ''}
                    onChange={(e) => handleAgentDataChange('TAX_EMAIL1', e.target.value)}
                    placeholder="이메일을 입력하세요"
                  />
                </div>
                <div className="agent-form-item">
                  <label>담당자1</label>
                  <input
                    type="text"
                    value={agentData.TAX_DAMDANG1 || ''}
                    onChange={(e) => handleAgentDataChange('TAX_DAMDANG1', e.target.value)}
                    placeholder="담당자명을 입력하세요"
                  />
                </div>
              </div>
              
              <div className="agent-form-row">
                <div className="agent-form-item">
                  <label>세금계산서수신이메일2</label>
                  <input
                    type="email"
                    value={agentData.TAX_EMAIL2 || ''}
                    onChange={(e) => handleAgentDataChange('TAX_EMAIL2', e.target.value)}
                    placeholder="이메일을 입력하세요"
                  />
                </div>
                <div className="agent-form-item">
                  <label>담당자2</label>
                  <input
                    type="text"
                    value={agentData.TAX_DAMDANG2 || ''}
                    onChange={(e) => handleAgentDataChange('TAX_DAMDANG2', e.target.value)}
                    placeholder="담당자명을 입력하세요"
                  />
                </div>
              </div>
            </div>

                         {/* 기타 정보 */}
             <div className="agent-detail-section">
               <h4>기타 정보</h4>
               <div className="agent-form-row">
                <div className="agent-form-item">
                  <label>거래시작일자</label>
                  <input
                    type="date"
                    value={agentData.OPEN_D || ''}
                    onChange={(e) => {
                      console.log('📅 거래시작일자 변경:', e.target.value);
                      handleAgentDataChange('OPEN_D', e.target.value);
                    }}
                  />
                  {/* 디버깅용 - 개발 완료 후 제거 */}
                  {/* <small style={{color: '#666', fontSize: '10px'}}>
                    값: {agentData.OPEN_D || '(없음)'}
                  </small> */}
                </div>
                <div className="agent-form-item">
                  <label>거래종료일자</label>
                  <input
                    type="date"
                    value={agentData.CLOSE_D || ''}
                    onChange={(e) => {
                      console.log('📅 거래종료일자 변경:', e.target.value);
                      handleAgentDataChange('CLOSE_D', e.target.value);
                    }}
                  />
                  {/* 디버깅용 - 개발 완료 후 제거 */}
                  {/* <small style={{color: '#666', fontSize: '10px'}}>
                    값: {agentData.CLOSE_D || '(없음)'}
                  </small> */}
                </div>
              </div>
              
              <div className="agent-form-row">
                <div className="agent-form-item full-width">
                  <label>취급브랜드</label>
                  <CommonMultiSelect
                    options={brandOptions}
                    selectedValues={agentData.BRAND_ID_LIST ? agentData.BRAND_ID_LIST.split(',').filter(Boolean) : []}
                    onSelectionChange={(values) => handleAgentDataChange('BRAND_ID_LIST', values.join(','))}
                    placeholder="브랜드를 선택하세요"
                  />
                </div>
              </div>
              
              <div className="agent-form-row">
                <div className="agent-form-item full-width">
                  <label>특이사항</label>
                  <textarea
                    value={agentData.TRADE_MEMO || ''}
                    onChange={(e) => handleAgentDataChange('TRADE_MEMO', e.target.value)}
                    placeholder="특이사항을 입력하세요"
                    rows={3}
                  />
                </div>
              </div>
            </div>
          </div>
          
          {/* RIGHT 섹션 하단 버튼 */}
          <div className="agent-detail-bottom-buttons">
            <div className="left-buttons">
              <button className="agent-btn-help">
                <i className="fas fa-question-circle"></i> 도움말
              </button>
              {/* 일괄등록 버튼 - 저장 권한 체크 */}
              {savePermission.hasPermission && (
                <button className="agent-btn-batch" onClick={() => setBatchUploadModal({ isOpen: true })}>
                  <i className="fas fa-upload"></i> 일괄등록
                </button>
              )}
            </div>
            <div className="right-buttons">
              {/* 저장 버튼 - 저장 권한 체크 */}
              {savePermission.hasPermission && (
                <button className="agent-btn-save" onClick={handleSave}>
                  <i className="fas fa-save"></i> 저장
                </button>
              )}
            </div>
          </div>


          {/* 상품등록의 하단 버튼 샘플 참조용 */}
          {/* <div className="detail-bottom-buttons">
            <button className="btn-help">
              <i className="fas fa-question-circle"></i> 도움말
            </button>
            <button className="btn-batch" onClick={() => setBatchUploadModal({ isOpen: true })}>
              <i className="fas fa-upload"></i> 일괄등록
            </button>
          </div> */}



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
          // 저장 로직 구현
          setUnsavedChangesModal({ isOpen: false, onProceed: () => {} });
        }}
        onDiscard={unsavedChangesModal.onProceed}
        onCancel={() => setUnsavedChangesModal({ isOpen: false, onProceed: () => {} })}
      />
      
      <SuccessModal
        isOpen={successModal.isOpen}
        type={successModal.type}
        message={successModal.message}
        details={successModal.details}
        changedFields={successModal.changedFields}
        onClose={() => {
          setSuccessModal({ isOpen: false, type: 'save', details: undefined, changedFields: undefined });
          // 성공 모달 닫힐 때 확인 모달도 함께 정리
          setConfirmationModal({ isOpen: false, type: 'save', onConfirm: () => {} });
        }}
      />

      <AgentBatchUploadModal
        isOpen={batchUploadModal.isOpen}
        onClose={() => setBatchUploadModal({ isOpen: false })}
        onTemplateDownload={handleTemplateDownload}
        onFileUpload={handleSimpleFileUpload}
      />

      <ExcelPreviewModal
        isOpen={excelPreviewModal.isOpen}
        onClose={() => setExcelPreviewModal({ isOpen: false, data: [] })}
        data={excelPreviewModal.data}
        onSave={handleExcelPreviewSave}
        onCancel={handleExcelPreviewCancel}
        type="agent"
      />

      {/* 엑셀 업로드 결과 모달 */}
      <ExcelUploadResultModal
        isOpen={uploadResultModal.isOpen}
        onClose={() => setUploadResultModal({ isOpen: false, result: null })}
        result={uploadResultModal.result}
      />
    </div>
  );
};

export default AgentRegistration;
