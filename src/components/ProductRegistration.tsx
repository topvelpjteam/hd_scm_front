import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { AgGridReact } from 'ag-grid-react';
import 'ag-grid-community/styles/ag-theme-alpine.css';
import CommonMultiSelect from './CommonMultiSelect';
import { commonCodeService, CommonCodeOption } from '../services/commonCodeService';
import { ProductService } from '../services/productService';
import { 
  ValidationModal, 
  ConfirmationModal, 
  UnsavedChangesModal,
  SuccessModal,
  BatchUploadModal,
  ExcelUploadResultModal,
  type ValidationError 
} from './common';
import { getMenuIcon } from '../utils/menuUtils';
import ExcelPreviewModal, { ExcelDataRow } from './common/ExcelPreviewModal';
import { ExcelUploadResult } from './common/ExcelUploadResultModal';
import { useSimpleFileUpload } from './SimpleFileUpload';
import { 
  setSearchCondition, 
  setProductData, 
  setSelectedProduct, 
  setIsNewMode, 
  setIsLoading, 
  setCodeData, 
  updateProductDetail, 
  initializeScreen 
} from '../store/productRegistrationSlice';
import type { ProductData, SearchCondition } from '../store/productRegistrationSlice';
import { RootState, AppDispatch } from '../store/store';
import { useButtonTextPermission } from '../hooks/usePermissions';
import { MENU_IDS } from '../constants/menuIds';
import './ProductRegistration.css';

// 타이머 관련 코드 제거됨 - 포커스 해제 시에만 중복체크 실행

const ProductRegistration: React.FC = React.memo(() => {
  const dispatch = useDispatch<AppDispatch>();
  
  // 상품코드 입력 필드 참조
  const goodsCodeInputRef = useRef<HTMLInputElement>(null);

  // 버튼별 권한 체크 (상품등록 메뉴 ID 상수 사용)
  const savePermission = useButtonTextPermission(MENU_IDS.PRODUCT_REGISTRATION, '저장');
  const deletePermission = useButtonTextPermission(MENU_IDS.PRODUCT_REGISTRATION, '삭제');
  const viewPermission = useButtonTextPermission(MENU_IDS.PRODUCT_REGISTRATION, '조회');
  const exportPermission = useButtonTextPermission(MENU_IDS.PRODUCT_REGISTRATION, '내보내기');
  const batchUploadPermission = useButtonTextPermission(MENU_IDS.PRODUCT_REGISTRATION, '일괄등록');
  
  // 권한 디버깅 로그
  console.log('🔐 [상품등록] 버튼별 권한 체크 결과:', {
    menuId: MENU_IDS.PRODUCT_REGISTRATION,
    menuName: '상품 등록',
    savePermission: savePermission.hasPermission,
    deletePermission: deletePermission.hasPermission,
    viewPermission: viewPermission.hasPermission,
    exportPermission: exportPermission.hasPermission,
    batchUploadPermission: batchUploadPermission.hasPermission,
    loading: savePermission.loading,
    error: savePermission.error
  });

  // 상품코드 입력 제한 함수 (영문대문자, 숫자, 특수문자만 허용)
  const validateProductCode = (value: string): string => {
    // 허용되는 문자: 영문대문자(A-Z), 숫자(0-9), 특수문자(-_.)
    const allowedPattern = /[^A-Z0-9\-_.]/g;
    return value.toUpperCase().replace(allowedPattern, '');
  };
  
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
  const { handleFileUpload: handleSimpleFileUpload } = useSimpleFileUpload({
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

  // 업데이트 시 원본 데이터 추적용
  const [originalData, setOriginalData] = useState<any>(null);

  // 변경된 필드를 비교하는 함수
  const getChangedFields = (original: any, current: any) => {
    console.log('🔍 getChangedFields 호출:', {
      original: original,
      current: current,
      originalKeys: Object.keys(original || {}),
      currentKeys: Object.keys(current || {}),
      originalType: typeof original,
      currentType: typeof current
    });
    
    const fieldNameMap: {[key: string]: string} = {
      'GOODS_ID_BRAND': '상품코드',
      'GOODS_NM': '상품명',
      'GOODS_KOR': '상품명(한글)',
      'GOODS_NM_EN': '상품명(영문)',
      'GOODS_NM_JP': '상품명(일문)',
      'GOODS_NM_CN': '상품명(중문)',
      'BAR_CODE': '바코드',
      'GOODS_NO': '상품번호',
      'FOREIGN_ID': '해외상품ID',
      'FOREIGN_NM': '해외상품명',
      'GOODS_GBN': '상품구분',
      'BRAND_ID': '브랜드',
      'MAKER_GBN': '제조사구분',
      'COLLECTION_GBN': '컬렉션구분',
      'COUNTRY_OF_ORIGIN': '원산지',
      'HS_CODE': 'HS코드',
      'BTYPE_GBN': '대분류',
      'MTYPE_GBN': '중분류',
      'STYPE_GBN': '소분류',
      'USE_GBN': '용도구분',
      'SET_GBN': '세트구분',
      'GWP_GBN': 'GWP구분',
      'MANA_GBN': '관리구분',
      'FUNC_GBN': '기능구분',
      'BOX_GBN': '박스구분',
      'ABC_CLASS': 'ABC등급',
      'GOODS_CAPA': '상품용량',
      'GOODS_UNIT': '상품단위',
      'PACKING_SIZE': '포장크기',
      'STORAGE_CONDITION': '보관조건',
      'EXPIRY_PERIOD': '유통기한',
      'SUPPLY_DAN': '공급단가',
      'BUY_DAN': '매입단가',
      'MONEY_GBN': '통화구분',
      'TAX_RATE': '세율',
      'VAT_YN': 'VAT여부',
      'SUPPLIER_ID': '공급업체ID',
      'LEAD_TIME': '리드타임',
      'SAFETY_STOCK': '안전재고',
      'MAX_STOCK': '최대재고',
      'REORDER_POINT': '재주문점',
      'ORDER_UNIT_QTY': '주문단위수량',
      'MIN_ORDER_QTY': '최소주문수량',
      'WAREHOUSE_LOCATION': '창고위치',
      'LOT_MANAGEMENT_YN': '로트관리여부',
      'STOCK_YN': '재고관리여부',
      'QUALITY_GRADE': '품질등급',
      'INSPECTION_CYCLE': '검사주기',
      'RETURN_POLICY': '반품정책',
      'WARRANTY_PERIOD': '보증기간',
      'RUN_D': '운영시작일',
      'END_D': '운영종료일',
      'OPEN_D': '등록일자',
      'CLOSE_D': '종료일자',
      'ACCOUNT_CODE': '계정코드',
      'COST_CENTER': '비용센터',
      'PROFIT_CENTER': '수익센터',
      'REMARKS': '비고'
    };

    const changes: Array<{field: string, name: string, oldValue: any, newValue: any}> = [];
    
    Object.keys(fieldNameMap).forEach(field => {
      const oldValue = original?.[field];
      const newValue = current?.[field];
      
      // 값이 실제로 다른 경우만 변경으로 간주 (null, undefined, 빈 문자열 정규화)
      const normalizeValue = (val: any) => {
        if (val === null || val === undefined || val === '') return '';
        
        // 숫자 필드는 콤마 제거 후 비교
        if (field === 'GOODS_CAPA' || field === 'SUPPLY_PRICE' || field === 'PURCHASE_PRICE' || 
            field === 'TAX_RATE' || field === 'LEAD_TIME' || field === 'SAFETY_STOCK' || 
            field === 'MAX_STOCK' || field === 'REORDER_POINT' || field === 'ORDER_UNIT_QTY' || 
            field === 'MIN_ORDER_QTY' || field === 'INSPECTION_CYCLE' || field === 'WARRANTY_PERIOD') {
          const cleanValue = String(val).replace(/,/g, '').trim();
          return cleanValue;
        }
        
        return String(val).trim();
      };
      
      const normalizedOld = normalizeValue(oldValue);
      const normalizedNew = normalizeValue(newValue);
      
      if (normalizedOld !== normalizedNew) {
        changes.push({
          field,
          name: fieldNameMap[field],
          oldValue: normalizedOld || '(없음)',
          newValue: normalizedNew || '(없음)'
        });
      }
    });
    
    return changes;
  };
  
  // 공통 코드 옵션 상태
  const [goodsGbnOptions, setGoodsGbnOptions] = useState<CommonCodeOption[]>([]);
  const [brandOptions, setBrandOptions] = useState<CommonCodeOption[]>([]);
  const [btypeOptions, setBtypeOptions] = useState<CommonCodeOption[]>([]);
  const [mtypeOptions, setMtypeOptions] = useState<CommonCodeOption[]>([]);
  const [stypeOptions, setStypeOptions] = useState<CommonCodeOption[]>([]);
  const [nationOptions, setNationOptions] = useState<CommonCodeOption[]>([]);
  const [makerOptions, setMakerOptions] = useState<CommonCodeOption[]>([]);
  const [collectionOptions, setCollectionOptions] = useState<CommonCodeOption[]>([]);
  const [channOptions, setChannOptions] = useState<CommonCodeOption[]>([]);
  const [manaOptions, setManaOptions] = useState<CommonCodeOption[]>([]);
  const [boxOptions, setBoxOptions] = useState<CommonCodeOption[]>([]);
  const [moneyOptions, setMoneyOptions] = useState<CommonCodeOption[]>([]);
  
  // AG Grid API 상태
  const [, setGridApi] = useState<any>(null);
  
  // Redux 상태 가져오기
  const {
    searchCondition,
    productData,
    selectedProduct,
    isNewMode,
    isInitialized
  } = useSelector((state: RootState) => state.productRegistration);

  // 현재 로그인한 사용자의 agentId 가져오기
  const { user } = useSelector((state: RootState) => state.auth);
  const currentAgentId = user?.agentId;
  const currentUserId = user?.userId;
  const currentUserRole = user?.roleLevel || 0;
  
  // 현재 활성 탭 정보 가져오기
  const { tabs, activeTabId } = useSelector((state: RootState) => state.tabs);
  const currentTab = tabs.find(tab => tab.id === activeTabId);
  
  // 시스템 관리자 여부 확인 (roleLevel이 1인 경우 시스템 관리자)
  const isSystemAdmin = currentUserRole === 1;
  
  // 디버깅: 사용자 정보 확인
  console.log('=== 사용자 정보 디버깅 ===');
  console.log('전체 사용자 정보:', user);
  console.log('현재 agentId:', currentAgentId);
  console.log('현재 사용자 역할 레벨:', currentUserRole);
  console.log('시스템 관리자 여부:', isSystemAdmin);

  // 🆕 완전히 새로운 간단한 그리드 설정 - 초기에는 빈 데이터
  const [gridData, setGridData] = useState<any[]>([]);
  
  // 그리드 컬럼 정의
  const columnDefs: any[] = [
    { headerName: '상품구분명', field: 'GOODS_GBN_NM', width: 90, minWidth: 80 },
    { headerName: '브랜드명', field: 'BRAND_GBN_NM', width: 100, minWidth: 80 },
    { headerName: '상품명', field: 'GOODS_NM', width: 200, minWidth: 150, flex: 1 }, // 가변 너비
    { headerName: '상품코드', field: 'GOODS_ID_BRAND', width: 120, minWidth: 100 },
    { headerName: '대분류명', field: 'BTYPE_GBN_NM', width: 90, minWidth: 80 },
    { headerName: '중분류명', field: 'MTYPE_GBN_NM', width: 90, minWidth: 80 },
    { headerName: '소분류명', field: 'STYPE_GBN_NM', width: 90, minWidth: 80 },
    { headerName: '등록일자', field: 'OPEN_D', width: 100, minWidth: 90 },
    { headerName: '종료일자', field: 'CLOSE_D', width: 100, minWidth: 90 },
    { headerName: '상품고유키', field: 'GOODS_ID', width: 90, minWidth: 80 }
  ];
  
  // productData가 변경되면 gridData 업데이트 (빈 배열도 포함)
  useEffect(() => {
    if (productData && Array.isArray(productData)) {
      console.log('✅ 그리드 데이터 업데이트:', productData.length, '개');
      setGridData(productData);
    }
  }, [productData]);



  // 변경사항 확인 함수
  const hasUnsavedChanges = useCallback(() => {
    if (!selectedProduct) return false;
    
    // 신규 모드에서 필드에 값이 입력되어 있는지 확인
    const hasData = selectedProduct.GOODS_ID_BRAND?.trim() || 
                   selectedProduct.GOODS_NM?.trim() || 
                   selectedProduct.BRAND_ID?.trim() ||
                   selectedProduct.GOODS_GBN?.trim();
    
    return isNewMode && hasData;
  }, [selectedProduct, isNewMode]);

  // 실제 신규 작업 수행
  const performNew = useCallback(() => {
    dispatch(setIsNewMode(true));
    dispatch(setSelectedProduct({
      GOODS_ID: 0,
      GOODS_ID_BRAND: '',
      GOODS_NM: '',
      GOODS_KOR: '',
      GOODS_NM_EN: '',
      GOODS_NM_JP: '',
      GOODS_NM_CN: '',
      BAR_CODE: '',
      GOODS_NO: '',
      FOREIGN_ID: '',
      FOREIGN_NM: '',
      GOODS_GBN: '',
      GOODS_GBN_NM: '',
      BRAND_ID: '',
      BRAND_GBN_NM: '',
      MAKER_GBN: '',
      MAKER_GBN_NM: '',
      COLLECTION_GBN: '',
      COLLECTION_GBN_NM: '',
      COUNTRY_OF_ORIGIN: '',
      HS_CODE: '',
      BTYPE_GBN: '',
      BTYPE_GBN_NM: '',
      MTYPE_GBN: '',
      MTYPE_GBN_NM: '',
      STYPE_GBN: '',
      STYPE_GBN_NM: '',
      USE_GBN: '',
      SET_GBN: '',
      GWP_GBN: '',
      CHANN_GBN: '',
      MANA_GBN: '',
      FUNC_GBN: '',
      BOX_GBN: '',
      ABC_CLASS: '',
      GOODS_CAPA: '',
      GOODS_UNIT: '',
      PACKING_SIZE: '',
      STORAGE_CONDITION: '',
      EXPIRY_PERIOD: '',
      SUPPLY_DAN: '',
      BUY_DAN: '',
      MONEY_GBN: '',
      TAX_RATE: '',
      VAT_YN: '',
      SUPPLIER_ID: '',
      LEAD_TIME: '',
      SAFETY_STOCK: '',
      MAX_STOCK: '',
      REORDER_POINT: '',
      ORDER_UNIT_QTY: '',
      MIN_ORDER_QTY: '',
      WAREHOUSE_LOCATION: '',
      LOT_MANAGEMENT_YN: '',
      STOCK_YN: '',
      QUALITY_GRADE: '',
      INSPECTION_CYCLE: '',
      RETURN_POLICY: '',
      WARRANTY_PERIOD: '',
      RUN_D: '',
      END_D: '',
      OPEN_D: new Date().toISOString().split('T')[0], // 현재 날짜로 자동 설정
      CLOSE_D: '',
      ACCOUNT_CODE: '',
      COST_CENTER: '',
      PROFIT_CENTER: '',
      REMARKS: '',
      USER_ID: '',
      SYS_TIME: '',
      UPD_USER: '',
      UPD_TIME: ''
    }));
  }, [dispatch]);

  // 신규 버튼 클릭 - 미저장 변경사항 확인
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

  // 코드 데이터 로드 (한 번만 실행)
  useEffect(() => {
    loadCodeData();
    loadAllCommonCodeData();
  }, []); // 의존성 배열을 빈 배열로 변경

  // 화면 초기화 (한 번만 실행)
  useEffect(() => {
    if (!isInitialized) {
      console.log('상품등록 화면 초기화 - 신규 모드로 전환');
      dispatch(initializeScreen()); // 초기화 완료 표시
      performNew(); // 신규 모드로 전환 (초기화 시에는 미저장 변경사항 체크 불필요)
    } else {
      console.log('상품등록 화면 재접근 - 기존 상태 유지');
    }
  }, [isInitialized]); // performNew 의존성 제거

  // 코드 데이터 로드 함수
  const loadCodeData = async () => {
    try {
      // 실제로는 API 호출로 대체
      const mockCodeData = {
        goodsGbn: [
          { code: '1', codeNm: '화장품' },
          { code: '2', codeNm: '의류' },
          { code: '3', codeNm: '액세서리' }
        ],
        brandGbn: [
          { code: 'BR001', codeNm: '브랜드A' },
          { code: 'BR002', codeNm: '브랜드B' },
          { code: 'BR003', codeNm: '브랜드C' }
        ],
        btypeGbn: [
          { code: 'BT001', codeNm: '스킨케어' },
          { code: 'BT002', codeNm: '메이크업' },
          { code: 'BT003', codeNm: '헤어케어' }
        ],
        mtypeGbn: [
          { code: 'MT001', codeNm: '토너' },
          { code: 'MT002', codeNm: '크림' },
          { code: 'MT003', codeNm: '세럼' }
        ],
        stypeGbn: [
          { code: 'ST001', codeNm: '보습' },
          { code: 'ST002', codeNm: '미백' },
          { code: 'ST003', codeNm: '안티에이징' }
        ],
        makerGbn: [
          { code: 'MK001', codeNm: '제조사A' },
          { code: 'MK002', codeNm: '제조사B' },
          { code: 'MK003', codeNm: '제조사C' }
        ],
        collectionGbn: [
          { code: 'CL001', codeNm: '봄컬렉션' },
          { code: 'CL002', codeNm: '여름컬렉션' },
          { code: 'CL003', codeNm: '가을컬렉션' }
        ]
      };
      dispatch(setCodeData(mockCodeData));
    } catch (error) {
      console.error('코드 데이터 로드 실패:', error);
    }
  };

  // 모든 공통 코드 데이터 로드 함수
  const loadAllCommonCodeData = async () => {
    try {
      // 상품구분 데이터 로드
      const goodsGbnData = await commonCodeService.getGoodsGbn();
      setGoodsGbnOptions(goodsGbnData);
      
      // 브랜드 데이터 로드
      console.log('브랜드 조회 - 현재 agentId:', currentAgentId);
      console.log('브랜드 조회 - 사용자 정보:', user);
      
      // agentId가 없어도 브랜드 목록을 가져오도록 수정
      const brandData = await commonCodeService.getBrands(currentAgentId);
      console.log('브랜드 조회 결과:', brandData);
      console.log('브랜드 옵션 개수:', brandData.length);
      setBrandOptions(brandData);
      
      // 대분류 데이터 로드
      const btypeData = await commonCodeService.getBTypes();
      setBtypeOptions(btypeData);
      
      // 중분류 데이터 로드
      const mtypeData = await commonCodeService.getMTypes();
      setMtypeOptions(mtypeData);
      
      // 소분류 데이터 로드
      const stypeData = await commonCodeService.getSTypes();
      setStypeOptions(stypeData);
      
      // 원산지 국가 데이터 로드
      const nationData = await commonCodeService.getNations();
      setNationOptions(nationData);
      
      // 메이커구분 데이터 로드
      const makerData = await commonCodeService.getMakerGbn();
      setMakerOptions(makerData);
      
      // 컬렉션구분 데이터 로드
      const collectionData = await commonCodeService.getCollectionGbn();
      setCollectionOptions(collectionData);
      
      // 채널구분 데이터 로드
      const channData = await commonCodeService.getChannGbn();
      setChannOptions(channData);
      
      // 운용구분 데이터 로드
      const manaData = await commonCodeService.getManaGbn();
      setManaOptions(manaData);
      
      // 포장단위 데이터 로드
      const boxData = await commonCodeService.getBoxGbn();
      setBoxOptions(boxData);
      
      // 화폐구분 데이터 로드
      const moneyData = await commonCodeService.getMoneyGbn();
      setMoneyOptions(moneyData);
      
    } catch (error) {
      console.error('공통 코드 데이터 로드 실패:', error);
      alert(`공통 코드 데이터 로드 실패: ${error instanceof Error ? error.message : String(error)}`);
    }
  };

  // 검색 조건 변경 핸들러
  const handleSearchConditionChange = (field: keyof SearchCondition, value: any) => {
    dispatch(setSearchCondition({ [field]: value }));
  };



  // 조회 버튼 클릭
  const handleSearch = async () => {
    console.log('🔍 === 조회 시작 ===');
    console.log('📋 검색 조건:', JSON.stringify(searchCondition, null, 2));
    console.log('👤 현재 사용자 ID:', currentAgentId);
    
    // API URL 확인
    const apiUrl = 'http://localhost:8080/api/products/search';
    console.log('🌐 API URL:', apiUrl);
    
    dispatch(setIsLoading(true));
    
    // 조회 시작 시 이전 데이터 초기화
    dispatch(setProductData([]));
    setGridData([]); // 그리드 데이터도 직접 초기화
    console.log('🧹 이전 조회 데이터 및 그리드 초기화');
    
    try {
      // 검색 파라미터 생성
      // role이 5가 아니면 userId를 null로 설정 (전체 조회)
      const searchUserId = currentUserRole === 5 ? (currentAgentId || 'ADMIN') : null;
      console.log(`🔐 사용자 권한 확인: roleLevel=${currentUserRole}, searchUserId=${searchUserId}`);
      
      const searchParams = {
        goodsGbn: searchCondition.goodsGbn.join(','),
        brandId: searchCondition.brandId.join(','),
        btypeGbn: searchCondition.btypeGbn.join(','),
        mtypeGbn: searchCondition.mtypeGbn.join(','),
        stypeGbn: searchCondition.stypeGbn.join(','),
        goodsNm: searchCondition.goodsNm || '',
        excludeClosed: searchCondition.excludeClosed,
        userId: searchUserId
      };
      
      console.log('📤 전송할 파라미터:', JSON.stringify(searchParams, null, 2));
      
      // 직접 fetch로 API 호출 테스트
      console.log('🚀 API 호출 시작...');
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(searchParams),
      });
      
      console.log('📡 응답 상태:', response.status, response.statusText);
      console.log('📡 응답 헤더:', Object.fromEntries(response.headers.entries()));
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ HTTP 오류:', response.status, errorText);
        throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
      }
      
      const rawData = await response.text();
      console.log('📥 원시 응답 데이터:', rawData);
      
      let products;
      try {
        products = JSON.parse(rawData);
        console.log('✅ JSON 파싱 성공');
      } catch (parseError) {
        console.error('❌ JSON 파싱 실패:', parseError);
        throw new Error('응답 데이터가 유효한 JSON이 아닙니다: ' + rawData);
      }
      
      console.log('📊 조회 결과 타입:', typeof products);
      console.log('📊 조회 결과 길이:', Array.isArray(products) ? products.length : 'Not Array');
      console.log('📊 조회 결과 데이터:', products);
      
      if (Array.isArray(products)) {
        // 데이터 변환 - 그리드 컬럼에 맞게 필드 매핑
        const transformedProducts = products.map(item => ({
          GOODS_ID: String(item.GOODS_ID || 0), // 상품고유키
          GOODS_GBN_NM: item.GOODS_GBN_NM || '', // 상품구분명
          BRAND_GBN_NM: item.BRAND_NM || item.BRAND_GBN_NM || '', // 브랜드명
          GOODS_NM: item.GOODS_NM || '', // 상품명
          GOODS_ID_BRAND: item.GOODS_ID_BRAND || '', // 상품코드
          BTYPE_GBN_NM: item.BTYPE_GBN_NM || '', // 대분류명
          MTYPE_GBN_NM: item.MTYPE_GBN_NM || '', // 중분류명
          STYPE_GBN_NM: item.STYPE_GBN_NM || '', // 소분류명
          OPEN_D: item.OPEN_D || '', // 등록일자 (원본 형식 유지)
          CLOSE_D: item.CLOSE_D || '', // 종료일자 (원본 형식 유지)
          // 필요한 다른 필드들 추가
          ...item
        }));
        
        dispatch(setProductData(transformedProducts));
        console.log('✅ Redux에 데이터 저장 완료, 개수:', transformedProducts.length);
        
        // 알럿 제거 - 콘솔 로그로만 확인
        if (transformedProducts.length === 0) {
          console.log('📋 조회된 데이터가 없습니다.');
        } else {
          console.log(`📊 ${transformedProducts.length}개의 상품이 조회되었습니다.`);
        }
      } else {
        console.error('❌ 조회 결과가 배열이 아닙니다:', products);
        dispatch(setProductData([]));
        console.error('📋 조회 결과 형식이 올바르지 않습니다.');
      }
    } catch (error) {
      console.error('💥 상품 조회 실패:', error);
      console.error('💥 에러 스택:', (error as Error)?.stack);
      console.error('💥 상품 조회에 실패했습니다: ' + (error instanceof Error ? error.message : String(error)));
      dispatch(setProductData([]));
    } finally {
      dispatch(setIsLoading(false));
      console.log('🏁 === 조회 완료 ===');
    }
  };

  // 실제 저장 로직 (필수입력 체크는 handleSave에서 이미 완료됨)
  const performSave = async () => {
    if (!selectedProduct) {
      alert('저장할 상품 정보가 없습니다.');
      return;
    }
    
    try {
      console.log('💾 상품 저장 시작:', selectedProduct);
      
      // 저장할 데이터 준비 (USER_ID는 로그인한 사용자의 userId, agent 필터는 SEARCH_AGENT_ID로 별도 전달)
      const saveData = {
        ...selectedProduct,
        USER_ID: currentUserId != null ? String(currentUserId) : 'SYSTEM',
        // 원산지 필드명 매핑 (COUNTRY_OF_ORIGIN -> NATION_GBN)
        NATION_GBN: selectedProduct.COUNTRY_OF_ORIGIN || selectedProduct.NATION_GBN
      };
      
      // 빈 문자열을 null로 변환 (숫자 필드들)
      const numericFields = [
        'GOODS_CAPA', 'EXPIRY_PERIOD', 'SUPPLY_DAN', 'BUY_DAN', 'TAX_RATE',
        'LEAD_TIME', 'SAFETY_STOCK', 'MAX_STOCK', 'REORDER_POINT',
        'ORDER_UNIT_QTY', 'MIN_ORDER_QTY', 'INSPECTION_CYCLE', 'WARRANTY_PERIOD'
      ];
      
      numericFields.forEach(field => {
        if ((saveData as any)[field] === '' || (saveData as any)[field] === undefined) {
          (saveData as any)[field] = null;
        }
      });
      
      console.log('💾 전송할 데이터:', saveData);
      
      // ProductService를 사용하여 상품 저장
      // 두번째 인자: 로그인한 userId (string), 세번째 인자: agentId (선택)
      const result = await ProductService.saveProduct(saveData, saveData.USER_ID, currentAgentId);
      
      console.log('💾 저장 결과:', result);
      
      if (result.success) {
        // 성공 모달 표시
        const isUpdate = selectedProduct.GOODS_ID && selectedProduct.GOODS_ID > 0;
        
        // 업데이트인 경우 변경된 필드 추적
        let changedFields: Array<{field: string, name: string, oldValue: any, newValue: any}> = [];
        if (isUpdate && originalData) {
          changedFields = getChangedFields(originalData, selectedProduct);
        }
        
        setSuccessModal({
          isOpen: true,
          type: isUpdate ? 'update' : 'save',
          message: result.message,
          details: isUpdate ? 
            (changedFields.length > 0 ? `${changedFields.length}개 항목이 변경되었습니다.` : '상품 정보가 업데이트되었습니다.') : 
            '새로운 상품이 등록되었습니다.',
          changedFields: isUpdate ? changedFields : undefined
        });
        
        // 신규 등록인 경우 목록 새로고침 후 신규 모드 유지
        if (isNewMode) {
          await handleSearch(); // 목록 새로고침
          // 저장 후에도 신규 모드 유지하여 연속 등록 가능
        } else {
          // 수정인 경우 목록 새로고침
          await handleSearch();
        }
      } else {
        alert('저장에 실패했습니다: ' + result.message);
      }
    } catch (error) {
      console.error('💾 저장 오류:', error);
      
      // 데이터베이스 원본 오류 메시지 표시
      let errorMessage = '저장 중 오류가 발생했습니다.';
      
      if (error instanceof Error) {
        const serverError = (error as any).serverError;
        
        if (serverError) {
          console.error('🔍 서버 오류 상세:', serverError);
          
          // 데이터베이스 원본 오류 메시지 우선 표시
          if (serverError.rootCause) {
            errorMessage = `데이터베이스 오류:\n${serverError.rootCause}`;
            console.error('💾 DB 루트 원인:', serverError.rootCause);
          } else if (serverError.originalMessage) {
            errorMessage = `서버 오류:\n${serverError.originalMessage}`;
            console.error('📋 원본 메시지:', serverError.originalMessage);
          } else {
            errorMessage = error.message;
          }
          
          // 추가 디버깅 정보 콘솔 출력
          if (serverError.errorType) {
            console.error('🏷️ 오류 타입:', serverError.errorType);
          }
          
          // 모든 오류 정보를 콘솔에 출력
          console.error('📊 전체 오류 정보:', {
            message: serverError.message,
            originalMessage: serverError.originalMessage,
            rootCause: serverError.rootCause,
            errorType: serverError.errorType
          });
        } else {
          errorMessage = error.message;
        }
      }
      
      alert(errorMessage);
    }
  };

  // 저장 버튼 클릭 - 필수입력 체크 후 확인 모달 표시
  const handleSave = () => {
    if (!selectedProduct) {
      alert('저장할 상품 정보가 없습니다.');
      return;
    }

    // 1단계: 필수입력 체크
    const requiredFields = [
      { field: 'GOODS_ID_BRAND', name: '상품코드' },
      { field: 'GOODS_NM', name: '상품명' },
      { field: 'BRAND_ID', name: '브랜드' },
      { field: 'GOODS_GBN', name: '상품구분' },
      { field: 'BTYPE_GBN', name: '대분류' },
      { field: 'MTYPE_GBN', name: '중분류' },
      { field: 'STYPE_GBN', name: '소분류' },
      { field: 'OPEN_D', name: '등록일자' }
    ];

    const errors: ValidationError[] = [];
    
    requiredFields.forEach(({ field, name }) => {
      const value = (selectedProduct as any)[field];
      if (!value || (typeof value === 'string' && value.trim() === '')) {
        errors.push({
          field,
          fieldName: name,
          message: `${name}은(는) 필수 입력 항목입니다.`,
          guidance: field === 'GOODS_ID_BRAND' ? '영문, 숫자, 특수문자(-_.)만 입력 가능합니다.' :
                   field === 'GOODS_NM' ? '최대 100자까지 입력 가능합니다.' :
                   field === 'OPEN_D' ? 'YYYY-MM-DD 형식으로 입력하세요.' :
                   '올바른 값을 선택하세요.'
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

    // 2단계: 필수입력이 모두 완료되면 확인 모달 표시
    const isUpdate = selectedProduct.GOODS_ID && selectedProduct.GOODS_ID > 0;
    setConfirmationModal({
      isOpen: true,
      type: isUpdate ? 'update' : 'save',
      onConfirm: performSave
    });
  };

  // 실제 삭제 로직
  const performDelete = useCallback(async () => {
    if (!selectedProduct || !selectedProduct.GOODS_ID) {
      return;
    }

    try {
              // USP_ZA_ProductRegistration 저장프로시저를 호출하여 상품 삭제 (종료일자 설정)
      const userIdForCall = currentUserId != null ? String(currentUserId) : 'SYSTEM';
      const result = await ProductService.deleteProduct(selectedProduct.GOODS_ID, userIdForCall, currentAgentId);
      
      if (result.success) {
        // 삭제 성공 모달 표시
        setSuccessModal({
          isOpen: true,
          type: 'delete',
          message: result.message,
          details: '상품이 시스템에서 제거되었습니다.'
        });
        handleSearch(); // 목록 새로고침
      } else {
        // 삭제 실패 시 상세 메시지 표시
        console.error('🗑️ 삭제 실패 응답:', result);
        alert(`삭제에 실패했습니다.\n\n${result.message}`);
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
          if (serverError.message) {
            errorMessage = `삭제 실패:\n${serverError.message}`;
          }
          
          // 추가 디버깅 정보 콘솔 출력
          if (serverError.errorType) {
            console.error('🏷️ 오류 타입:', serverError.errorType);
          }
        } else {
          errorMessage = `삭제 실패:\n${error.message}`;
        }
      }
      
      alert(errorMessage);
    }
  }, [selectedProduct, currentAgentId, handleSearch]);

  // 삭제 버튼 클릭 - 확인 모달 표시
  const handleDelete = useCallback(() => {
    if (!selectedProduct || !selectedProduct.GOODS_ID) {
      alert('삭제할 상품을 선택해주세요.');
      return;
    }

    setConfirmationModal({
      isOpen: true,
      type: 'delete',
      onConfirm: performDelete
    });
  }, [selectedProduct, performDelete]);

  // 템플릿 다운로드 핸들러 (백엔드 API 사용)
  const handleTemplateDownload = useCallback(async () => {
    console.log('📥 엑셀 템플릿 다운로드 시작');
    
    try {
      // 유저 정보 가져오기
      const userInfo = JSON.parse(sessionStorage.getItem('user') || '{}');
      const userId = userInfo.userId;
      const agentId = userInfo.agentId;
      
      console.log('유저 정보:', { userId, agentId });
      
      // URL 파라미터 구성
      const params = new URLSearchParams();
      if (userId) params.append('userId', userId.toString());
      if (agentId) params.append('agentId', agentId);
      
      const downloadUrl = `/api/products/download-template${params.toString() ? '?' + params.toString() : ''}`;
      console.log('요청 URL:', downloadUrl);
      
      // 백엔드 API 호출하여 템플릿 다운로드
      const response = await fetch(downloadUrl, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        if (response.status === 405) {
          throw new Error('템플릿 다운로드 API가 아직 준비되지 않았습니다. 백엔드 서버를 재시작해주세요.');
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      // 파일 다운로드 처리
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', '상품일괄등록_템플릿.xlsx');
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      
      console.log('✅ 엑셀 템플릿 다운로드 완료');
      
    } catch (error) {
      console.error('❌ 엑셀 템플릿 다운로드 오류:', error);
      alert(`템플릿 다운로드 중 오류가 발생했습니다.\n\n${error instanceof Error ? error.message : String(error)}`);
    }
  }, []);

  // 파일 업로드 핸들러 (미리보기 모달 표시)
  const handleFileUpload = useCallback(async (file: File) => {
    console.log('📤 엑셀 파일 업로드 시작:', file.name);
    
    try {
      // 동적 import로 xlsx 라이브러리 로드
      const XLSX = await import('xlsx');
      
      // 파일을 ArrayBuffer로 읽기
      const arrayBuffer = await file.arrayBuffer();
      
      // 엑셀 파일 파싱
      const workbook = XLSX.read(arrayBuffer, { type: 'array' });
      
      // 첫 번째 시트 (상품데이터) 가져오기
      const firstSheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[firstSheetName];
      
      // 시트를 JSON 배열로 변환
      const jsonData = XLSX.utils.sheet_to_json(worksheet, { 
        header: 1, // 배열 형태로 반환
        defval: '' // 빈 셀은 빈 문자열로
      });
      
      if (jsonData.length < 2) {
        alert('파일에 데이터가 없습니다.');
        return;
      }

      // 헤더 행과 데이터 행 분리
      const headers = jsonData[0] as string[];
      const dataRows = jsonData.slice(1).filter(row => {
        // 빈 행이나 참고사항 행 제외
        const firstCell = (row as any[])[0];
        return firstCell && 
               typeof firstCell === 'string' && 
               firstCell.trim() !== '' && 
               !firstCell.startsWith('※') &&
               !firstCell.startsWith('=') &&
               !firstCell.startsWith('-');
      }) as any[][];

      console.log('📊 파싱된 데이터:', { 
        headers: headers.slice(0, 10), 
        dataRowCount: dataRows.length,
        sampleRow: dataRows[0]?.slice(0, 10)
      });

      // 헤더 검증
      const requiredHeaders = ['상품코드*', '상품명*', '브랜드*', '상품구분*', '대분류*', '중분류*', '소분류*'];
      
      const missingHeaders = requiredHeaders.filter(required => 
        !headers.some(header => 
          header && header.toString().includes(required.replace('*', ''))
        )
      );
      
      if (missingHeaders.length > 0) {
        alert(`필수 헤더가 누락되었습니다:\n${missingHeaders.join(', ')}`);
        return;
      }

      // 필수 필드 검증 및 데이터 변환
      const errors: string[] = [];
      const processedRows: any[][] = [];
      
      dataRows.forEach((row, index) => {
        const rowNum = index + 2; // 헤더 다음 행부터
        const processedRow = [...row];
        
        // 상품코드 검증 (첫 번째 컬럼)
        if (!row[0] || row[0].toString().trim() === '') {
          errors.push(`${rowNum}행: 상품코드가 누락되었습니다.`);
        }
        
        // 상품명 검증 (두 번째 컬럼)
        if (!row[1] || row[1].toString().trim() === '') {
          errors.push(`${rowNum}행: 상품명이 누락되었습니다.`);
        }
        
        // 브랜드 검증 및 코드 추출 (세 번째 컬럼)
        if (!row[2] || row[2].toString().trim() === '') {
          errors.push(`${rowNum}행: 브랜드가 누락되었습니다.`);
        } else {
          // "코드 명칭" 형태에서 코드만 추출
          const brandValue = row[2].toString().trim();
          const brandCode = brandValue.split(' ')[0]; // 첫 번째 공백 앞의 코드만
          processedRow[2] = brandCode;
        }
        
        // 상품구분 검증 및 코드 추출 (네 번째 컬럼)
        if (!row[3] || row[3].toString().trim() === '') {
          errors.push(`${rowNum}행: 상품구분이 누락되었습니다.`);
        } else {
          const goodsGbnValue = row[3].toString().trim();
          const goodsGbnCode = goodsGbnValue.split(' ')[0];
          processedRow[3] = goodsGbnCode;
        }
        
        // 대분류 검증 및 코드 추출 (다섯 번째 컬럼)
        if (!row[4] || row[4].toString().trim() === '') {
          errors.push(`${rowNum}행: 대분류가 누락되었습니다.`);
        } else {
          const btypeValue = row[4].toString().trim();
          const btypeCode = btypeValue.split(' ')[0];
          processedRow[4] = btypeCode;
        }
        
        // 중분류 검증 및 코드 추출 (여섯 번째 컬럼)
        if (!row[5] || row[5].toString().trim() === '') {
          errors.push(`${rowNum}행: 중분류가 누락되었습니다.`);
        } else {
          const mtypeValue = row[5].toString().trim();
          const mtypeCode = mtypeValue.split(' ')[0];
          processedRow[5] = mtypeCode;
        }
        
        // 소분류 검증 및 코드 추출 (일곱 번째 컬럼)
        if (!row[6] || row[6].toString().trim() === '') {
          errors.push(`${rowNum}행: 소분류가 누락되었습니다.`);
        } else {
          const stypeValue = row[6].toString().trim();
          const stypeCode = stypeValue.split(' ')[0];
          processedRow[6] = stypeCode;
        }
        
        processedRows.push(processedRow);
      });

      if (errors.length > 0) {
        alert(`필수 항목이 누락되었습니다:\n\n${errors.slice(0, 10).join('\n')}${errors.length > 10 ? `\n... 외 ${errors.length - 10}개` : ''}`);
        return;
      }

      // 중복 검증 및 저장 처리
      console.log(`✅ 엑셀 파일 검증 완료. ${processedRows.length}개 행 처리 예정`);
      console.log('📊 처리된 데이터 샘플:', processedRows[0]?.slice(0, 10));
      
      // 데이터를 ExcelDataRow 형태로 변환
      const excelData: ExcelDataRow[] = processedRows.map((row, index) => {
        const rowData: any = {};
        headers.forEach((header, colIndex) => {
          const cleanHeader = header.replace('*', ''); // * 제거
          rowData[cleanHeader] = row[colIndex] || '';
        });
        
        // 필수 필드 검증
        let hasError = false;
        let errorMessage = '';
        
        if (!rowData['상품코드'] || !rowData['상품명']) {
          hasError = true;
          errorMessage = '상품코드와 상품명은 필수입니다.';
        } else if (!rowData['브랜드'] || !rowData['상품구분'] || !rowData['대분류'] || !rowData['중분류'] || !rowData['소분류']) {
          hasError = true;
          errorMessage = '브랜드, 상품구분, 대분류, 중분류, 소분류는 필수입니다.';
        }
        
        return {
          ...rowData,
          rowIndex: index + 2, // 엑셀 행 번호 (헤더 제외)
          hasError,
          errorMessage,
          isDuplicate: false,
          duplicateInfo: '미확인',
          isSelected: !hasError
        } as ExcelDataRow;
      });
      
      console.log('✅ 변환된 엑셀 데이터:', excelData);
      
      // 일괄 업로드 모달 닫고 미리보기 모달 열기
      setBatchUploadModal({ isOpen: false });
      setExcelPreviewModal({ 
        isOpen: true, 
        data: excelData 
      });
      
    } catch (error) {
      console.error('❌ 엑셀 파일 업로드 오류:', error);
      alert('엑셀 파일 처리 중 오류가 발생했습니다.');
    }
  }, []);

  // 엑셀 미리보기 모달 핸들러들
  const handleExcelPreviewSave = useCallback(async (selectedRows: ExcelDataRow[]) => {
    console.log('📤 선택된 데이터 저장 시작:', selectedRows.length);
    
    try {
      // 선택된 데이터를 서버 형식으로 변환
      const productsToSave = selectedRows.map(row => ({
        상품코드: row.상품코드,
        상품명: row.상품명,
        브랜드: row.브랜드,
        상품구분: row.상품구분,
        대분류: row.대분류,
        중분류: row.중분류,
        소분류: row.소분류,
        바코드: row.바코드,
        상품번호: row.상품번호,
        해외상품ID: row.해외상품ID,
        해외상품명: row.해외상품명,
        원산지: row.원산지,
        HS코드: row.HS코드,
        용량: row.용량,
        용량단위: row.용량단위,
        포장크기: row.포장크기,
        보관조건: row.보관조건,
        유통기한: row.유통기한,
        공급단가: row.공급단가,
        매입단가: row.매입단가,
        통화구분: row.통화구분,
        VAT여부: row.VAT여부,
        세율: row.세율,
        공급업체ID: row.공급업체ID,
        리드타임: row.리드타임,
        안전재고: row.안전재고,
        최대재고: row.최대재고,
        재주문점: row.재주문점,
        발주단위량: row.발주단위량,
        발주최소단위: row.발주최소단위,
        창고위치: row.창고위치,
        로트관리여부: row.로트관리여부,
        품질등급: row.품질등급,
        검사주기: row.검사주기,
        반품정책: row.반품정책,
        보증기간: row.보증기간,
        운영시작일: row.운영시작일,
        운영종료일: row.운영종료일,
        등록일자: row.등록일자,
        비고: row.비고
      }));
      
      // 일괄 저장 API 호출
      const response = await fetch('/api/products/batch-save', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(productsToSave),
      });
      
      const result = await response.json();
      
      // 미리보기 모달 닫기
      setExcelPreviewModal({ isOpen: false, data: [] });
      
      // 결과 모달 표시
      const uploadResult: ExcelUploadResult = {
        success: result.success,
        successCount: result.successCount || 0,
        failCount: result.failCount || 0,
        totalCount: selectedRows.length,
        errors: result.errors || [],
        message: result.success 
          ? `총 ${selectedRows.length}개 중 ${result.successCount}개가 성공적으로 처리되었습니다.`
          : result.message || '업로드 중 오류가 발생했습니다.'
      };
      
      setUploadResultModal({
        isOpen: true,
        result: uploadResult
      });
      
      // 성공 시 검색 새로고침
      if (result.success && result.successCount > 0) {
        handleSearch();
      }
      
    } catch (error) {
      console.error('❌ 일괄 저장 오류:', error);
      
      // 미리보기 모달 닫기
      setExcelPreviewModal({ isOpen: false, data: [] });
      
      // 오류 결과 모달 표시
      const errorResult: ExcelUploadResult = {
        success: false,
        successCount: 0,
        failCount: selectedRows.length,
        totalCount: selectedRows.length,
        errors: [error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다.'],
        message: '네트워크 오류 또는 서버 오류가 발생했습니다.'
      };
      
      setUploadResultModal({
        isOpen: true,
        result: errorResult
      });
    }
  }, [handleSearch]);

  const handleExcelPreviewCancel = useCallback(() => {
    setExcelPreviewModal({ isOpen: false, data: [] });
  }, []);

  // 그리드 행 선택 이벤트
  // 🆕 새로운 그리드 이벤트 핸들러
  const onGridReady = (params: any) => {
    console.log('✅ 그리드 초기화 완료');
    setGridApi(params.api);
    params.api.sizeColumnsToFit();
  };

  const onRowClicked = (event: any) => {
    console.log('✅ 상품 선택:', event.data);
    dispatch(setSelectedProduct(event.data));
    dispatch(setIsNewMode(false)); // 기존 상품 선택 시 신규 모드 해제
    
    // 업데이트 추적을 위해 원본 데이터 저장 (깊은 복사)
    setOriginalData(JSON.parse(JSON.stringify(event.data)));
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

  // 상품 상세 정보 변경 핸들러
  const handleProductDetailChange = useCallback((field: keyof ProductData, value: string) => {
    if (!selectedProduct) {
      console.warn('선택된 상품이 없습니다.');
      return;
    }
    
    console.log(`상품 상세 정보 변경: ${field} = ${value}`);
    
    dispatch(updateProductDetail({ field, value }));
  }, [selectedProduct, dispatch]);

  // 브랜드와 상품코드 중복 체크 함수 (스마트 체크)
  const handleBrandCodeCheckSmart = useCallback(async (trigger: 'brand_change' | 'code_blur') => {
    const currentBrandId = selectedProduct?.BRAND_ID;
    const currentGoodsCode = selectedProduct?.GOODS_ID_BRAND;
    
    // 신규 모드가 아니거나 필수 값이 없으면 체크하지 않음
    if (!isNewMode || !currentBrandId || !currentGoodsCode?.trim()) {
      console.log('🔍 중복 체크 건너뜀:', {
        trigger,
        isNewMode,
        hasBrandId: !!currentBrandId,
        hasGoodsCode: !!currentGoodsCode?.trim(),
        reason: !isNewMode ? '신규모드 아님' : !currentBrandId ? '브랜드 미선택' : '상품코드 미입력'
      });
      return;
    }

    try {
      console.log('🔍 브랜드-상품코드 중복 체크 시작:', {
        trigger,
        brandId: currentBrandId,
        goodsIdBrand: currentGoodsCode.trim()
      });

      const result = await ProductService.checkProductExists(currentBrandId, currentGoodsCode.trim(), 'P1111'); // TODO: 실제 사용자 ID 사용
      
      console.log('🔍 중복 체크 결과:', result);

      if (result.exists && result.productData) {
        console.log('⚠️ 중복된 상품 발견, 상세 정보 로드');
        
        // 중복된 상품의 상세 정보를 폼에 설정
        dispatch(setSelectedProduct(result.productData));
        dispatch(setIsNewMode(false)); // 편집 모드로 변경
        
        // alert(`이미 존재하는 상품입니다.\n브랜드: ${currentBrandId}\n상품코드: ${currentGoodsCode.trim()}`);
      } else {
        console.log('✅ 중복되지 않은 상품코드');
      }
    } catch (error) {
      console.error('❌ 브랜드-상품코드 중복 체크 오류:', error);
    }
  }, [selectedProduct, isNewMode, dispatch]);

  // 브랜드와 상품코드 중복 체크 함수 (브랜드 ID를 직접 받는 버전) - 호환성 유지
  const handleBrandCodeCheckWithBrand = useCallback(async (goodsIdBrand: string, brandId: string) => {
    // 신규 모드가 아니거나 필수 값이 없으면 체크하지 않음
    if (!isNewMode || !brandId || !goodsIdBrand.trim()) {
      console.log('🔍 중복 체크 건너뜀 (브랜드 직접 전달):', {
        isNewMode,
        hasBrandId: !!brandId,
        hasGoodsCode: !!goodsIdBrand.trim()
      });
      return;
    }

    try {
      console.log('🔍 브랜드-상품코드 중복 체크 시작 (브랜드 직접 전달):', {
        brandId,
        goodsIdBrand: goodsIdBrand.trim()
      });

      const result = await ProductService.checkProductExists(brandId, goodsIdBrand.trim(), 'P1111'); // TODO: 실제 사용자 ID 사용
      
      console.log('🔍 중복 체크 결과:', result);

      if (result.exists && result.productData) {
        console.log('⚠️ 중복된 상품 발견, 상세 정보 로드');
        
        // 중복된 상품의 상세 정보를 폼에 설정
        dispatch(setSelectedProduct(result.productData));
        dispatch(setIsNewMode(false)); // 편집 모드로 변경
        
        // alert(`이미 존재하는 상품입니다.\n브랜드: ${brandId}\n상품코드: ${goodsIdBrand.trim()}`);
      } else {
        console.log('✅ 중복되지 않은 상품코드');
      }
    } catch (error) {
      console.error('❌ 브랜드-상품코드 중복 체크 오류:', error);
    }
  }, [isNewMode, dispatch]);

  // 브랜드와 상품코드 중복 체크 함수 (기존 버전 - Redux 상태 사용)
  const handleBrandCodeCheck = useCallback(async (goodsIdBrand: string) => {
    if (!selectedProduct?.BRAND_ID) {
      console.log('🔍 중복 체크 건너뜀: 브랜드 ID가 없음');
      return;
    }
    
    // 새로운 함수로 위임
    await handleBrandCodeCheckWithBrand(goodsIdBrand, selectedProduct.BRAND_ID);
  }, [selectedProduct?.BRAND_ID, handleBrandCodeCheckWithBrand]);



  return (
    <div className="product-registration">
      {/* 탑 구역 - 검색 조건 및 버튼 */}
      <div className="top-section">
                 <h1 className="page-title">
           {currentTab?.menuIcon ? (
             React.createElement(getMenuIcon(currentTab.menuIcon), { size: 16 })
           ) : (
             <i className="fas fa-box"></i>
           )}
           상품등록
         </h1>
        <div className="search-conditions">
          <div className="search-row">
            <div className="search-item">
              <CommonMultiSelect
                label="상품구분"
                options={goodsGbnOptions}
                selectedValues={searchCondition.goodsGbn}
                onSelectionChange={(values) => handleSearchConditionChange('goodsGbn', values)}
                placeholder="상품구분을 선택하세요"
              />
            </div>
            <div className="search-item">
              <CommonMultiSelect
                label="브랜드"
                options={brandOptions}
                selectedValues={searchCondition.brandId}
                onSelectionChange={(values) => handleSearchConditionChange('brandId', values)}
                placeholder="브랜드를 선택하세요"
              />
            </div>
            <div className="search-item">
              <CommonMultiSelect
                label="대분류"
                options={btypeOptions}
                selectedValues={searchCondition.btypeGbn}
                onSelectionChange={(values) => handleSearchConditionChange('btypeGbn', values)}
                placeholder="대분류를 선택하세요"
              />
            </div>
          </div>
          <div className="search-row">
            <div className="search-item">
              <CommonMultiSelect
                label="중분류"
                options={mtypeOptions}
                selectedValues={searchCondition.mtypeGbn}
                onSelectionChange={(values) => handleSearchConditionChange('mtypeGbn', values)}
                placeholder="중분류를 선택하세요"
              />
            </div>
            <div className="search-item">
              <CommonMultiSelect
                label="소분류"
                options={stypeOptions}
                selectedValues={searchCondition.stypeGbn}
                onSelectionChange={(values) => handleSearchConditionChange('stypeGbn', values)}
                placeholder="소분류를 선택하세요"
              />
            </div>
            <div className="search-item">
              <label>상품명:</label>
              <input 
                type="text" 
                value={searchCondition.goodsNm}
                onChange={(e) => handleSearchConditionChange('goodsNm', e.target.value)}
                placeholder="상품명을 입력하세요"
              />
            </div>
            <div className="search-item checkbox">
              <label>
                <input 
                  type="checkbox" 
                  checked={searchCondition.excludeClosed}
                  onChange={(e) => handleSearchConditionChange('excludeClosed', e.target.checked)}
                />
                종료 상품 제외
              </label>
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
        {/* 레프트 구역 - 상품 목록 그리드 */}
        <div className="left-section">
          <h3>
            <i className="fas fa-list"></i>
            상품 목록
          </h3>
          {/* 🆕 완전히 새로운 간단한 그리드 */}
          <div className="grid-container">
            <div className="ag-theme-alpine">
            <AgGridReact
                columnDefs={columnDefs}
                rowData={gridData}
                onGridReady={onGridReady}
                onRowClicked={onRowClicked}
                pagination={true}
                paginationPageSize={50}
                animateRows={false}
                suppressMovableColumns={true}
                headerHeight={34}
                rowHeight={26}
                suppressHorizontalScroll={false}
                noRowsOverlayComponent={() => (
                  <div className="ag-overlay-no-rows-center">
                    <div>조회된 데이터가 없습니다</div>
                  </div>
                )}
            />
          </div>
          </div>
          {/* 그리드 상태 정보 */}
          <div className="grid-status-info">
            <span>총 {gridData.length}개 상품</span>
          </div>
          
          {/* 상품목록 하단 버튼 (상품상세정보와 동일한 높이) */}
          {/* <div className="left-bottom-buttons">
            <button className="btn-export">
              <i className="fas fa-download"></i> 내보내기
            </button>
            <button className="btn-import">
              <i className="fas fa-upload"></i> 가져오기
            </button>
          </div> */}
        </div>

        {/* 라이트 구역 - 상품 상세 정보 */}
        <div className="right-section">
          <h3>
            <i className="fas fa-edit"></i>
            상품 상세 정보
          </h3>
          <div className="product-detail">
            {/* 기본 정보 (Basic Information) */}
            <div className="detail-section">
              <h4>기본 정보</h4>
              <div className="form-row">
                <div className="form-item">
                  <label>상품고유키</label>
                  <input 
                    type="text" 
                    value={selectedProduct?.GOODS_ID || ''} 
                    readOnly 
                  />
                </div>
                <div className="form-item required">
                  {/* <label>브랜드 <span className="required-mark">*</span>:</label>
                  <select 
                    value={selectedProduct?.BRAND_ID || ''}
                    onChange={(e) => handleProductDetailChange('BRAND_ID', e.target.value)}
                  >
                    <option value="">선택하세요</option>
                    {brandOptions.map(item => (
                      <option key={item.value} value={item.value}>
                        {item.label}
                      </option>
                    ))}
                  </select> */}
                </div>
              </div>
              <div className="form-row">
                <div className="form-item required">
                  <label>브랜드 <span className="required-mark">*</span></label>
                  <select 
                    value={selectedProduct?.BRAND_ID || ''}
                    onChange={(e) => {
                      const newBrandId = e.target.value;
                      handleProductDetailChange('BRAND_ID', newBrandId);
                      
                      // 상품코드 입력 필드의 실제 값을 직접 확인 (useRef 사용)
                      const currentGoodsCode = goodsCodeInputRef.current?.value?.trim() || selectedProduct?.GOODS_ID_BRAND?.trim();
                      
                      console.log('🔍 브랜드 선택 시 상태 확인:', {
                        newBrandId,
                        currentGoodsCode,
                        fromInput: goodsCodeInputRef.current?.value?.trim(),
                        fromRedux: selectedProduct?.GOODS_ID_BRAND?.trim()
                      });
                      
                      // 브랜드 선택 시 상품코드가 이미 입력되어 있으면 즉시 중복체크
                      if (currentGoodsCode && newBrandId) {
                        console.log('🔍 브랜드 선택 시 중복체크 (상품코드 이미 입력됨)');
                        setTimeout(() => handleBrandCodeCheckWithBrand(currentGoodsCode, newBrandId), 200);
                      } else {
                        console.log('🔍 브랜드 선택됨:', {
                          newBrandId,
                          currentGoodsCode,
                          message: '상품코드 입력 완료 후 포커스 해제 시 중복체크 실행됩니다.'
                        });
                      }
                    }}
                    disabled={!isNewMode} // 신규 모드가 아닐 때 비활성화
                    required
                  >
                    <option value="">선택하세요</option>
                    {brandOptions.length === 0 ? (
                      <option value="" disabled>브랜드 로딩 중...</option>
                    ) : (
                      brandOptions.map(item => (
                        <option key={item.value} value={item.value}>
                          {item.label}
                        </option>
                      ))
                    )}
                  </select>
                  {/* 디버깅 정보 */}
                  <div style={{fontSize: '12px', color: '#666', marginTop: '4px'}}>
                    브랜드 옵션 개수: {brandOptions.length}개
                  </div>
                </div>
                <div className="form-item required">
                  <label>상품코드 <span className="required-mark">*</span></label>
                  <input 
                    ref={goodsCodeInputRef}
                    type="text" 
                    value={selectedProduct?.GOODS_ID_BRAND || ''}
                    onChange={(e) => {
                      // 상품코드 입력 제한 적용 (영문대문자, 숫자, 특수문자만)
                      const validatedValue = validateProductCode(e.target.value);
                      
                      // 입력값이 변경되었다면 커서 위치 조정
                      if (validatedValue !== e.target.value) {
                        const cursorPosition = e.target.selectionStart;
                        e.target.value = validatedValue;
                        e.target.setSelectionRange(cursorPosition, cursorPosition);
                      }
                      
                      // 상품코드 입력 시 실시간 업데이트
                      handleProductDetailChange('GOODS_ID_BRAND', validatedValue);
                      // 실시간 중복체크 제거 - 포커스 해제 시에만 체크
                    }}
                    onKeyDown={(e) => {
                      // 허용되지 않는 키 입력 방지
                      const allowedKeys = [
                        'Backspace', 'Delete', 'Tab', 'Escape', 'Enter',
                        'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown',
                        'Home', 'End', 'PageUp', 'PageDown'
                      ];
                      
                      // Ctrl/Cmd + A, C, V, X 등 허용
                      if (e.ctrlKey || e.metaKey) {
                        return;
                      }
                      
                      // 허용된 특수 키들
                      if (allowedKeys.includes(e.key)) {
                        return;
                      }
                      
                      // 허용되는 문자 패턴 체크
                      const allowedPattern = /^[A-Za-z0-9\-_.]$/;
                      if (!allowedPattern.test(e.key)) {
                        e.preventDefault();
                        console.log('🚫 허용되지 않는 문자:', e.key);
                      }
                    }}
                    onBlur={(e) => {
                      // 상품코드 포커스 해제 시 중복 체크 (LOSTFOCUS)
                      if (selectedProduct?.BRAND_ID && e.target.value.trim()) {
                        console.log('🔍 상품코드 포커스 해제 시 중복체크 (LOSTFOCUS)');
                        handleBrandCodeCheckSmart('code_blur');
                      } else {
                        console.log('🔍 상품코드 포커스 해제 - 중복체크 조건 미충족:', {
                          hasBrand: !!selectedProduct?.BRAND_ID,
                          hasCode: !!e.target.value.trim()
                        });
                      }
                    }}
                    placeholder="상품코드를 입력하세요"
                    maxLength={60}
                    disabled={!isNewMode} // 신규 모드가 아닐 때 비활성화
                  />
                </div>
              </div>
              <div className="form-row">
                <div className="form-item required">
                  <label>상품명 <span className="required-mark">*</span></label>
                  <input 
                    type="text" 
                    value={selectedProduct?.GOODS_NM || ''}
                    onChange={(e) => handleProductDetailChange('GOODS_NM', e.target.value)}
                    placeholder="상품명 (최대 200자)"
                    maxLength={200}
                  />
                </div>
              </div>




              <div className="form-row">
                {/* <div className="form-item">
                  <label>상품한글명:</label>
                  <input 
                    type="text" 
                    value={selectedProduct?.GOODS_KOR || ''}
                    onChange={(e) => handleProductDetailChange('GOODS_KOR', e.target.value)}
                    placeholder="상품한글명 (최대 200자)"
                    maxLength={200}
                  />
                </div> */}
                <div className="form-item">
                  <label>영문 상품명</label>
                  <input 
                    type="text" 
                    value={selectedProduct?.GOODS_NM_EN || ''}
                    onChange={(e) => handleProductDetailChange('GOODS_NM_EN', e.target.value)}
                    placeholder="영문 상품명 (최대 200자)"
                    maxLength={200}
                  />
                </div>
              </div>
              <div className="form-row">
                <div className="form-item">
                  <label>일문 상품명</label>
                  <input 
                    type="text" 
                    value={selectedProduct?.GOODS_NM_JP || ''}
                    onChange={(e) => handleProductDetailChange('GOODS_NM_JP', e.target.value)}
                    placeholder="일문 상품명 (최대 200자)"
                    maxLength={200}
                  />
                </div>
                <div className="form-item">
                  <label>중문 상품명</label>
                  <input 
                    type="text" 
                    value={selectedProduct?.GOODS_NM_CN || ''}
                    onChange={(e) => handleProductDetailChange('GOODS_NM_CN', e.target.value)}
                    placeholder="중문 상품명 (최대 200자)"
                    maxLength={200}
                  />
                </div>
              </div>
              <div className="form-row">
                <div className="form-item">
                  <label>바코드</label>
                  <input 
                    type="text" 
                    value={selectedProduct?.BAR_CODE || ''}
                    onChange={(e) => handleProductDetailChange('BAR_CODE', e.target.value)}
                    placeholder="바코드 (최대 50자)"
                    maxLength={50}
                  />
                </div>
                <div className="form-item">
                  <label>호수</label>
                  <input 
                    type="text" 
                    value={selectedProduct?.GOODS_NO || ''}
                    onChange={(e) => handleProductDetailChange('GOODS_NO', e.target.value)}
                    placeholder="호수 (최대 20자)"
                    maxLength={20}
                  />
                </div>
              </div>
              <div className="form-row">
                <div className="form-item">
                  <label>본사코드</label>
                  <input 
                    type="text" 
                    value={selectedProduct?.FOREIGN_ID || ''}
                    onChange={(e) => handleProductDetailChange('FOREIGN_ID', e.target.value)}
                    placeholder="본사코드 (최대 30자)"
                    maxLength={30}
                  />
                </div>
                <div className="form-item">
                  <label>본사상품명</label>
                  <input 
                    type="text" 
                    value={selectedProduct?.FOREIGN_NM || ''}
                    onChange={(e) => handleProductDetailChange('FOREIGN_NM', e.target.value)}
                    placeholder="본사상품명 (최대 200자)"
                    maxLength={200}
                  />
                </div>
              </div>
            </div>

            {/* 분류 정보 (Classification) */}
            <div className="detail-section">
              <h4>분류 정보</h4>
              <div className="form-row">
                <div className="form-item required">
                  <label>상품구분 <span className="required-mark">*</span></label>
                  <select 
                    value={selectedProduct?.GOODS_GBN || ''}
                    onChange={(e) => handleProductDetailChange('GOODS_GBN', e.target.value)}
                    key={`goodsGbn-${selectedProduct?.GOODS_GBN || 'empty'}`}
                  >
                    <option value="">선택하세요</option>
                    {goodsGbnOptions.map(item => (
                      <option key={item.value} value={item.value}>
                        {item.label}
                      </option>
                    ))}
                  </select>
                </div>
                {isSystemAdmin && (
                <div className="form-item">
                  <label>메이커코드</label>
                  <select 
                    value={selectedProduct?.MAKER_GBN || ''}
                    onChange={(e) => handleProductDetailChange('MAKER_GBN', e.target.value)}
                    key={`makerGbn-${selectedProduct?.MAKER_GBN || 'empty'}`}
                  >
                    <option value="">선택하세요</option>
                      {makerOptions.map(item => (
                        <option key={item.value} value={item.value}>
                          {item.label}
                      </option>
                    ))}
                  </select>
                </div>
                )}
              </div>
              <div className="form-row">
                {isSystemAdmin && (
                <div className="form-item">
                  <label>컬렉션구분</label>
                  <select 
                    value={selectedProduct?.COLLECTION_GBN || ''}
                    onChange={(e) => handleProductDetailChange('COLLECTION_GBN', e.target.value)}
                    key={`collectionGbn-${selectedProduct?.COLLECTION_GBN || 'empty'}`}
                  >
                    <option value="">선택하세요</option>
                      {collectionOptions.map(item => (
                        <option key={item.value} value={item.value}>
                          {item.label}
                      </option>
                    ))}
                  </select>
                </div>
                )}                
              </div>

              <div className="form-row">
                <div className="form-item required">
                  <label>대분류 <span className="required-mark">*</span></label>
                  <select 
                    value={selectedProduct?.BTYPE_GBN || ''}
                    onChange={(e) => handleProductDetailChange('BTYPE_GBN', e.target.value)}
                    key={`btype-${selectedProduct?.BTYPE_GBN || 'empty'}`}
                  >
                    <option value="">선택하세요</option>
                    {btypeOptions.map(item => (
                      <option key={item.value} value={item.value}>
                        {item.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="form-row">
                <div className="form-item required">
                  <label>중분류 <span className="required-mark">*</span></label>
                  <select 
                    value={selectedProduct?.MTYPE_GBN || ''}
                    onChange={(e) => handleProductDetailChange('MTYPE_GBN', e.target.value)}
                    key={`mtype-${selectedProduct?.MTYPE_GBN || 'empty'}`}
                  >
                    <option value="">선택하세요</option>
                    {mtypeOptions.map(item => (
                      <option key={item.value} value={item.value}>
                        {item.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="form-row">
                <div className="form-item required">
                  <label>소분류 <span className="required-mark">*</span></label>
                  <select 
                    value={selectedProduct?.STYPE_GBN || ''}
                    onChange={(e) => handleProductDetailChange('STYPE_GBN', e.target.value)}
                    key={`stype-${selectedProduct?.STYPE_GBN || 'empty'}`}
                  >
                    <option value="">선택하세요</option>
                    {stypeOptions.map(item => (
                      <option key={item.value} value={item.value}>
                        {item.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="form-row">
                <div className="form-item">
                   <label>원산지 국가</label>
                                     <select 
                    value={selectedProduct?.COUNTRY_OF_ORIGIN || ''}
                    onChange={(e) => handleProductDetailChange('COUNTRY_OF_ORIGIN', e.target.value)}
                    key={`country-${selectedProduct?.COUNTRY_OF_ORIGIN || 'empty'}`}
                  >
                    <option value="">선택하세요</option>
                    {nationOptions.map(item => (
                      <option key={item.value} value={item.value}>
                        {item.label}
                      </option>
                    ))}
                  </select>
                </div>                
                <div className="form-item">
                  <label>HS 코드</label>
                  <input 
                    type="text" 
                    value={selectedProduct?.HS_CODE || ''}
                    onChange={(e) => handleProductDetailChange('HS_CODE', e.target.value)}
                    placeholder="HS 코드 (관세)"
                    maxLength={20}
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-item">
                  <label>사용자구분</label>
                  <input 
                    type="text" 
                    value={selectedProduct?.USE_GBN || ''}
                    onChange={(e) => handleProductDetailChange('USE_GBN', e.target.value)}
                    placeholder="사용자구분"
                    maxLength={50}
                  />
                </div>
                <div className="form-item">
                  <label>셋트구분</label>
                  <div className="radio-group">
                    <label className="radio-label">
                      <input 
                        type="radio" 
                        name="SET_GBN" 
                        value="Y"
                        checked={selectedProduct?.SET_GBN === 'Y'}
                    onChange={(e) => handleProductDetailChange('SET_GBN', e.target.value)}
                      />
                      <span className="radio-text">셋트</span>
                    </label>
                    <label className="radio-label">
                      <input 
                        type="radio" 
                        name="SET_GBN" 
                        value="N"
                        checked={selectedProduct?.SET_GBN === 'N' || !selectedProduct?.SET_GBN}
                        onChange={(e) => handleProductDetailChange('SET_GBN', e.target.value)}
                      />
                      <span className="radio-text">단품</span>
                    </label>
                  </div>
                </div>
              </div>
              <div className="form-row">
                <div className="form-item">
                  {/* <label>GWP구분</label>
                  <select 
                    value={selectedProduct?.GWP_GBN || ''}
                    onChange={(e) => handleProductDetailChange('GWP_GBN', e.target.value)}
                    key={`gwpGbn-${selectedProduct?.GWP_GBN || 'empty'}`}
                  >
                    <option value="">선택하세요</option>
                    <option value="Y">GWP</option>
                    <option value="N">일반</option>
                  </select> */}
                </div>
                {isSystemAdmin && (
                <div className="form-item">
                  <label>채널코드</label>
                  <select 
                    value={selectedProduct?.CHANN_GBN || ''}
                    onChange={(e) => handleProductDetailChange('CHANN_GBN', e.target.value)}
                    key={`channGbn-${selectedProduct?.CHANN_GBN || 'empty'}`}
                  >
                    <option value="">선택하세요</option>
                      {channOptions.map(item => (
                        <option key={item.value} value={item.value}>
                          {item.label}
                        </option>
                      ))}
                  </select>
                </div>
                )}
              </div>
              <div className="form-row">
                <div className="form-item">
                  <label>운용구분</label>
                  <select 
                    value={selectedProduct?.MANA_GBN || ''}
                    onChange={(e) => handleProductDetailChange('MANA_GBN', e.target.value)}
                    key={`manaGbn-${selectedProduct?.MANA_GBN || 'empty'}`}
                  >
                    <option value="">선택하세요</option>
                    {manaOptions.map(item => (
                      <option key={item.value} value={item.value}>
                        {item.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="form-item">
                  <label>기능성구분</label>
                  <input 
                    type="text" 
                    value={selectedProduct?.FUNC_GBN || ''}
                    onChange={(e) => handleProductDetailChange('FUNC_GBN', e.target.value)}
                    placeholder="기능성구분"
                    maxLength={3}
                  />
                </div>
              </div>
              <div className="form-row">
                <div className="form-item">
                  <label>포장단위</label>
                  <select 
                    value={selectedProduct?.BOX_GBN || ''}
                    onChange={(e) => handleProductDetailChange('BOX_GBN', e.target.value)}
                    key={`boxGbn-${selectedProduct?.BOX_GBN || 'empty'}`}
                  >
                    <option value="">선택하세요</option>
                    {boxOptions.map(item => (
                      <option key={item.value} value={item.value}>
                        {item.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="form-item">
                  <label>ABC 분석 등급</label>
                  <select 
                    value={selectedProduct?.ABC_CLASS || ''}
                    onChange={(e) => handleProductDetailChange('ABC_CLASS', e.target.value)}
                    key={`abcClass-${selectedProduct?.ABC_CLASS || 'empty'}`}
                  >
                    <option value="">선택하세요</option>
                    <option value="A">A등급</option>
                    <option value="B">B등급</option>
                    <option value="C">C등급</option>
                  </select>
                </div>
              </div>
            </div>

            {/* 물리적 특성 (Physical Characteristics) */}
            <div className="detail-section">
              <h4>물리적 특성</h4>
              <div className="form-row">
                <div className="form-item">
                  <label>용량</label>
                  <div className="number-input-container">
                  <input 
                    type="text" 
                    value={formatNumber(selectedProduct?.GOODS_CAPA || '')}
                    onChange={(e) => {
                      const cleanValue = removeNumberFormat(e.target.value);
                      handleProductDetailChange('GOODS_CAPA', cleanValue);
                    }}
                    placeholder="용량"
                      className="number-input-field"
                    />
                    <div className="custom-spinner">
                      <button 
                        type="button"
                        className="spinner-btn spinner-up"
                        onClick={() => {
                          const currentValue = parseFloat(selectedProduct?.GOODS_CAPA || '0');
                          handleProductDetailChange('GOODS_CAPA', (currentValue + 0.1).toFixed(3));
                        }}
                      >
                        <svg width="8" height="6" viewBox="0 0 8 6" fill="none">
                          <path d="M4 0L8 6H0L4 0Z" fill="currentColor"/>
                        </svg>
                      </button>
                      <button 
                        type="button"
                        className="spinner-btn spinner-down"
                        onClick={() => {
                          const currentValue = parseFloat(selectedProduct?.GOODS_CAPA || '0');
                          if (currentValue > 0) {
                            handleProductDetailChange('GOODS_CAPA', Math.max(0, currentValue - 0.1).toFixed(3));
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
                <div className="form-item">
                  <label>용량단위</label>
                  <input 
                    type="text" 
                    value={selectedProduct?.GOODS_UNIT || ''}
                    onChange={(e) => handleProductDetailChange('GOODS_UNIT', e.target.value)}
                    placeholder="용량단위 (예: ml, g, 개)"
                    maxLength={5}
                  />
                </div>
              </div>
              <div className="form-row">
                <div className="form-item">
                  <label>포장 크기</label>
                  <input 
                    type="text" 
                    value={selectedProduct?.PACKING_SIZE || ''}
                    onChange={(e) => handleProductDetailChange('PACKING_SIZE', e.target.value)}
                    placeholder="포장 크기 (가x세x높이)"
                    maxLength={50}
                  />
                </div>
                <div className="form-item">
                  <label>보관 조건</label>
                  <select 
                    value={selectedProduct?.STORAGE_CONDITION || ''}
                    onChange={(e) => handleProductDetailChange('STORAGE_CONDITION', e.target.value)}
                    key={`storageCondition-${selectedProduct?.STORAGE_CONDITION || 'empty'}`}
                  >
                    <option value="">선택하세요</option>
                    <option value="상온">상온</option>
                    <option value="냉장">냉장</option>
                    <option value="냉동">냉동</option>
                  </select>
                </div>
              </div>
              <div className="form-row">
                <div className="form-item">
                  <label>유통기한 (일수)</label>
                  <div className="number-input-container">
                  <input 
                    type="number" 
                    value={selectedProduct?.EXPIRY_PERIOD || ''}
                    onChange={(e) => handleProductDetailChange('EXPIRY_PERIOD', e.target.value)}
                    placeholder="유통기한 일수"
                      className="number-input-field"
                    />
                    <div className="custom-spinner">
                      <button 
                        type="button"
                        className="spinner-btn spinner-up"
                        onClick={() => {
                          const currentValue = parseInt(selectedProduct?.EXPIRY_PERIOD || '0');
                          handleProductDetailChange('EXPIRY_PERIOD', (currentValue + 1).toString());
                        }}
                      >
                        <svg width="8" height="6" viewBox="0 0 8 6" fill="none">
                          <path d="M4 0L8 6H0L4 0Z" fill="currentColor"/>
                        </svg>
                      </button>
                      <button 
                        type="button"
                        className="spinner-btn spinner-down"
                        onClick={() => {
                          const currentValue = parseInt(selectedProduct?.EXPIRY_PERIOD || '0');
                          if (currentValue > 0) {
                            handleProductDetailChange('EXPIRY_PERIOD', (currentValue - 1).toString());
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

            {/* 가격 정보 (Pricing) */}
            <div className="detail-section">
              <h4>가격 정보</h4>
              <div className="form-row">
                <div className="form-item">
                  <label>소비자가격</label>
                  <div className="number-input-container">
                  <input 
                    type="text" 
                    value={formatNumber(selectedProduct?.SUPPLY_DAN || '')}
                    onChange={(e) => {
                      const cleanValue = removeNumberFormat(e.target.value);
                      handleProductDetailChange('SUPPLY_DAN', cleanValue);
                    }}
                    placeholder="소비자가격"
                      className="number-input-field"
                    />
                    <div className="custom-spinner">
                      <button 
                        type="button"
                        className="spinner-btn spinner-up"
                        onClick={() => {
                          const currentValue = parseInt(selectedProduct?.SUPPLY_DAN || '0');
                          handleProductDetailChange('SUPPLY_DAN', (currentValue + 1).toString());
                        }}
                      >
                        <svg width="8" height="6" viewBox="0 0 8 6" fill="none">
                          <path d="M4 0L8 6H0L4 0Z" fill="currentColor"/>
                        </svg>
                      </button>
                      <button 
                        type="button"
                        className="spinner-btn spinner-down"
                        onClick={() => {
                          const currentValue = parseInt(selectedProduct?.SUPPLY_DAN || '0');
                          if (currentValue > 0) {
                            handleProductDetailChange('SUPPLY_DAN', (currentValue - 1).toString());
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
                <div className="form-item">
                  <label>구매단가</label>
                  <div className="number-input-container">
                  <input 
                    type="text" 
                    value={formatNumber(selectedProduct?.BUY_DAN || '')}
                    onChange={(e) => {
                      const cleanValue = removeNumberFormat(e.target.value);
                      handleProductDetailChange('BUY_DAN', cleanValue);
                    }}
                    placeholder="구매단가"
                      className="number-input-field"
                    />
                    <div className="custom-spinner">
                      <button 
                        type="button"
                        className="spinner-btn spinner-up"
                        onClick={() => {
                          const currentValue = parseFloat(selectedProduct?.BUY_DAN || '0');
                          handleProductDetailChange('BUY_DAN', (currentValue + 0.01).toFixed(2));
                        }}
                      >
                        <svg width="8" height="6" viewBox="0 0 8 6" fill="none">
                          <path d="M4 0L8 6H0L4 0Z" fill="currentColor"/>
                        </svg>
                      </button>
                      <button 
                        type="button"
                        className="spinner-btn spinner-down"
                        onClick={() => {
                          const currentValue = parseFloat(selectedProduct?.BUY_DAN || '0');
                          if (currentValue > 0) {
                            handleProductDetailChange('BUY_DAN', Math.max(0, currentValue - 0.01).toFixed(2));
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
              <div className="form-row">
                <div className="form-item">
                  <label>화폐구분</label>
                  <select 
                    value={selectedProduct?.MONEY_GBN || ''}
                    onChange={(e) => handleProductDetailChange('MONEY_GBN', e.target.value)}
                    key={`moneyGbn-${selectedProduct?.MONEY_GBN || 'empty'}`}
                  >
                    <option value="">선택하세요</option>
                    {moneyOptions.map(item => (
                      <option key={item.value} value={item.value}>
                        {item.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="form-item">
                  <label>세율 (%)</label>
                  <div className="number-input-container">
                  <input 
                    type="number" 
                    step="0.01"
                    value={selectedProduct?.TAX_RATE || ''}
                    onChange={(e) => handleProductDetailChange('TAX_RATE', e.target.value)}
                    placeholder="세율"
                      className="number-input-field"
                    />
                    <div className="custom-spinner">
                      <button 
                        type="button"
                        className="spinner-btn spinner-up"
                        onClick={() => {
                          const currentValue = parseFloat(selectedProduct?.TAX_RATE || '0');
                          handleProductDetailChange('TAX_RATE', Math.min(100, currentValue + 0.1).toFixed(1));
                        }}
                      >
                        <svg width="8" height="6" viewBox="0 0 8 6" fill="none">
                          <path d="M4 0L8 6H0L4 0Z" fill="currentColor"/>
                        </svg>
                      </button>
                      <button 
                        type="button"
                        className="spinner-btn spinner-down"
                        onClick={() => {
                          const currentValue = parseFloat(selectedProduct?.TAX_RATE || '0');
                          if (currentValue > 0) {
                            handleProductDetailChange('TAX_RATE', Math.max(0, currentValue - 0.1).toFixed(1));
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
              <div className="form-row">
                <div className="form-item">
                  <label>부가세 적용</label>
                  <div className="radio-group">
                    <label className="radio-label">
                      <input 
                        type="radio" 
                        name="VAT_YN" 
                        value="Y"
                        checked={selectedProduct?.VAT_YN === 'Y' || !selectedProduct?.VAT_YN}
                    onChange={(e) => handleProductDetailChange('VAT_YN', e.target.value)}
                      />
                      <span className="radio-text">적용</span>
                    </label>
                    <label className="radio-label">
                      <input 
                        type="radio" 
                        name="VAT_YN" 
                        value="N"
                        checked={selectedProduct?.VAT_YN === 'N'}
                        onChange={(e) => handleProductDetailChange('VAT_YN', e.target.value)}
                      />
                      <span className="radio-text">미적용</span>
                    </label>
                  </div>
                </div>
              </div>
            </div>

            {/* 공급망 관리 (Supply Chain Management) */}
            <div className="detail-section">
              <h4>공급망 관리</h4>
              <div className="form-row">
                <div className="form-item">
                  <label>공급업체 코드</label>
                  <input 
                    type="text" 
                    value={selectedProduct?.SUPPLIER_ID || ''}
                    onChange={(e) => handleProductDetailChange('SUPPLIER_ID', e.target.value)}
                    placeholder="공급업체 코드"
                    maxLength={20}
                  />
                </div>
                <div className="form-item">
                  <label>리드타임 (일수)</label>
                  <div className="number-input-container">
                  <input 
                    type="number" 
                    value={selectedProduct?.LEAD_TIME || ''}
                    onChange={(e) => handleProductDetailChange('LEAD_TIME', e.target.value)}
                    placeholder="리드타임 일수"
                      className="number-input-field"
                    />
                    <div className="custom-spinner">
                      <button 
                        type="button"
                        className="spinner-btn spinner-up"
                        onClick={() => {
                          const currentValue = parseInt(selectedProduct?.LEAD_TIME || '0');
                          handleProductDetailChange('LEAD_TIME', (currentValue + 1).toString());
                        }}
                      >
                        <svg width="8" height="6" viewBox="0 0 8 6" fill="none">
                          <path d="M4 0L8 6H0L4 0Z" fill="currentColor"/>
                        </svg>
                      </button>
                      <button 
                        type="button"
                        className="spinner-btn spinner-down"
                        onClick={() => {
                          const currentValue = parseInt(selectedProduct?.LEAD_TIME || '0');
                          if (currentValue > 0) {
                            handleProductDetailChange('LEAD_TIME', (currentValue - 1).toString());
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
              <div className="form-row">
                <div className="form-item">
                  <label>안전재고량</label>
                  <div className="number-input-container">
                  <input 
                    type="number" 
                    value={selectedProduct?.SAFETY_STOCK || ''}
                    onChange={(e) => handleProductDetailChange('SAFETY_STOCK', e.target.value)}
                    placeholder="안전재고량"
                      className="number-input-field"
                    />
                    <div className="custom-spinner">
                      <button 
                        type="button"
                        className="spinner-btn spinner-up"
                        onClick={() => {
                          const currentValue = parseInt(selectedProduct?.SAFETY_STOCK || '0');
                          handleProductDetailChange('SAFETY_STOCK', (currentValue + 1).toString());
                        }}
                      >
                        <svg width="8" height="6" viewBox="0 0 8 6" fill="none">
                          <path d="M4 0L8 6H0L4 0Z" fill="currentColor"/>
                        </svg>
                      </button>
                      <button 
                        type="button"
                        className="spinner-btn spinner-down"
                        onClick={() => {
                          const currentValue = parseInt(selectedProduct?.SAFETY_STOCK || '0');
                          if (currentValue > 0) {
                            handleProductDetailChange('SAFETY_STOCK', (currentValue - 1).toString());
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
                <div className="form-item">
                  <label>최대재고량</label>
                  <div className="number-input-container">
                  <input 
                    type="number" 
                    value={selectedProduct?.MAX_STOCK || ''}
                    onChange={(e) => handleProductDetailChange('MAX_STOCK', e.target.value)}
                    placeholder="최대재고량"
                      className="number-input-field"
                    />
                    <div className="custom-spinner">
                      <button 
                        type="button"
                        className="spinner-btn spinner-up"
                        onClick={() => {
                          const currentValue = parseInt(selectedProduct?.MAX_STOCK || '0');
                          handleProductDetailChange('MAX_STOCK', (currentValue + 10).toString());
                        }}
                      >
                        <svg width="8" height="6" viewBox="0 0 8 6" fill="none">
                          <path d="M4 0L8 6H0L4 0Z" fill="currentColor"/>
                        </svg>
                      </button>
                      <button 
                        type="button"
                        className="spinner-btn spinner-down"
                        onClick={() => {
                          const currentValue = parseInt(selectedProduct?.MAX_STOCK || '0');
                          if (currentValue > 0) {
                            handleProductDetailChange('MAX_STOCK', Math.max(0, currentValue - 10).toString());
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
              <div className="form-row">
                <div className="form-item">
                  <label>재주문점</label>
                  <div className="number-input-container">
                  <input 
                    type="number" 
                    value={selectedProduct?.REORDER_POINT || ''}
                    onChange={(e) => handleProductDetailChange('REORDER_POINT', e.target.value)}
                    placeholder="재주문점"
                      className="number-input-field"
                    />
                    <div className="custom-spinner">
                      <button 
                        type="button"
                        className="spinner-btn spinner-up"
                        onClick={() => {
                          const currentValue = parseInt(selectedProduct?.REORDER_POINT || '0');
                          handleProductDetailChange('REORDER_POINT', (currentValue + 5).toString());
                        }}
                      >
                        <svg width="8" height="6" viewBox="0 0 8 6" fill="none">
                          <path d="M4 0L8 6H0L4 0Z" fill="currentColor"/>
                        </svg>
                      </button>
                      <button 
                        type="button"
                        className="spinner-btn spinner-down"
                        onClick={() => {
                          const currentValue = parseInt(selectedProduct?.REORDER_POINT || '0');
                          if (currentValue > 0) {
                            handleProductDetailChange('REORDER_POINT', Math.max(0, currentValue - 5).toString());
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
                <div className="form-item">
                  <label>발주단위량</label>
                  <div className="number-input-container">
                  <input 
                    type="number" 
                    value={selectedProduct?.ORDER_UNIT_QTY || ''}
                    onChange={(e) => handleProductDetailChange('ORDER_UNIT_QTY', e.target.value)}
                    placeholder="발주단위량"
                      className="number-input-field"
                    />
                    <div className="custom-spinner">
                      <button 
                        type="button"
                        className="spinner-btn spinner-up"
                        onClick={() => {
                          const currentValue = parseInt(selectedProduct?.ORDER_UNIT_QTY || '0');
                          handleProductDetailChange('ORDER_UNIT_QTY', (currentValue + 10).toString());
                        }}
                      >
                        <svg width="8" height="6" viewBox="0 0 8 6" fill="none">
                          <path d="M4 0L8 6H0L4 0Z" fill="currentColor"/>
                        </svg>
                      </button>
                      <button 
                        type="button"
                        className="spinner-btn spinner-down"
                        onClick={() => {
                          const currentValue = parseInt(selectedProduct?.ORDER_UNIT_QTY || '0');
                          if (currentValue > 0) {
                            handleProductDetailChange('ORDER_UNIT_QTY', Math.max(0, currentValue - 10).toString());
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
              <div className="form-row">
                <div className="form-item">
                  <label>발주최소단위</label>
                  <div className="number-input-container">
                  <input 
                    type="number" 
                    value={selectedProduct?.MIN_ORDER_QTY || ''}
                    onChange={(e) => handleProductDetailChange('MIN_ORDER_QTY', e.target.value)}
                    placeholder="발주최소단위"
                      className="number-input-field"
                    />
                    <div className="custom-spinner">
                      <button 
                        type="button"
                        className="spinner-btn spinner-up"
                        onClick={() => {
                          const currentValue = parseInt(selectedProduct?.MIN_ORDER_QTY || '0');
                          handleProductDetailChange('MIN_ORDER_QTY', (currentValue + 1).toString());
                        }}
                      >
                        <svg width="8" height="6" viewBox="0 0 8 6" fill="none">
                          <path d="M4 0L8 6H0L4 0Z" fill="currentColor"/>
                        </svg>
                      </button>
                      <button 
                        type="button"
                        className="spinner-btn spinner-down"
                        onClick={() => {
                          const currentValue = parseInt(selectedProduct?.MIN_ORDER_QTY || '0');
                          if (currentValue > 0) {
                            handleProductDetailChange('MIN_ORDER_QTY', (currentValue - 1).toString());
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

            {/* 물류/창고 관리 (Logistics/Warehouse) */}
            <div className="detail-section">
              <h4>물류/창고 관리</h4>
              <div className="form-row">
                <div className="form-item">
                  <label>창고 위치</label>
                  <input 
                    type="text" 
                    value={selectedProduct?.WAREHOUSE_LOCATION || ''}
                    onChange={(e) => handleProductDetailChange('WAREHOUSE_LOCATION', e.target.value)}
                    placeholder="창고 위치"
                    maxLength={50}
                  />
                </div>
                <div className="form-item">
                  <label>로트 관리:</label>
                  <div className="radio-group">
                    <label className="radio-label">
                      <input 
                        type="radio" 
                        name="LOT_MANAGEMENT_YN" 
                        value="Y"
                        checked={selectedProduct?.LOT_MANAGEMENT_YN === 'Y'}
                    onChange={(e) => handleProductDetailChange('LOT_MANAGEMENT_YN', e.target.value)}
                      />
                      <span className="radio-text">사용</span>
                    </label>
                    <label className="radio-label">
                      <input 
                        type="radio" 
                        name="LOT_MANAGEMENT_YN" 
                        value="N"
                        checked={selectedProduct?.LOT_MANAGEMENT_YN === 'N' || !selectedProduct?.LOT_MANAGEMENT_YN}
                        onChange={(e) => handleProductDetailChange('LOT_MANAGEMENT_YN', e.target.value)}
                      />
                      <span className="radio-text">미사용</span>
                    </label>
                  </div>
                </div>
              </div>
              <div className="form-row">
                {isSystemAdmin && (
                <div className="form-item">
                  <label>수불여부</label>
                    <div className="radio-group">
                      <label className="radio-label">
                        <input 
                          type="radio" 
                          name="STOCK_YN" 
                          value="Y"
                          checked={selectedProduct?.STOCK_YN === 'Y' || !selectedProduct?.STOCK_YN}
                    onChange={(e) => handleProductDetailChange('STOCK_YN', e.target.value)}
                        />
                        <span className="radio-text">사용</span>
                      </label>
                      <label className="radio-label">
                        <input 
                          type="radio" 
                          name="STOCK_YN" 
                          value="N"
                          checked={selectedProduct?.STOCK_YN === 'N'}
                          onChange={(e) => handleProductDetailChange('STOCK_YN', e.target.value)}
                        />
                        <span className="radio-text">미사용</span>
                      </label>
                </div>
                  </div>
                )}
              </div>
            </div>

            {/* 품질 관리 (Quality Management) */}
            <div className="detail-section">
              <h4>품질 관리</h4>
              <div className="form-row">
                <div className="form-item">
                  <label>품질 등급</label>
                  <select 
                    value={selectedProduct?.QUALITY_GRADE || ''}
                    onChange={(e) => handleProductDetailChange('QUALITY_GRADE', e.target.value)}
                    key={`qualityGrade-${selectedProduct?.QUALITY_GRADE || 'empty'}`}
                  >
                    <option value="">선택하세요</option>
                    <option value="A">A등급</option>
                    <option value="B">B등급</option>
                    <option value="C">C등급</option>
                  </select>
                </div>
                <div className="form-item">
                  <label>검사 주기 (일수)</label>
                  <div className="number-input-container">
                  <input 
                    type="number" 
                    value={selectedProduct?.INSPECTION_CYCLE || ''}
                    onChange={(e) => handleProductDetailChange('INSPECTION_CYCLE', e.target.value)}
                    placeholder="검사 주기"
                      className="number-input-field"
                    />
                    <div className="custom-spinner">
                      <button 
                        type="button"
                        className="spinner-btn spinner-up"
                        onClick={() => {
                          const currentValue = parseInt(selectedProduct?.INSPECTION_CYCLE || '0');
                          handleProductDetailChange('INSPECTION_CYCLE', (currentValue + 1).toString());
                        }}
                      >
                        <svg width="8" height="6" viewBox="0 0 8 6" fill="none">
                          <path d="M4 0L8 6H0L4 0Z" fill="currentColor"/>
                        </svg>
                      </button>
                      <button 
                        type="button"
                        className="spinner-btn spinner-down"
                        onClick={() => {
                          const currentValue = parseInt(selectedProduct?.INSPECTION_CYCLE || '0');
                          if (currentValue > 0) {
                            handleProductDetailChange('INSPECTION_CYCLE', (currentValue - 1).toString());
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
              <div className="form-row">
                <div className="form-item">
                  <label>반품 정책</label>
                  <input 
                    type="text" 
                    value={selectedProduct?.RETURN_POLICY || ''}
                    onChange={(e) => handleProductDetailChange('RETURN_POLICY', e.target.value)}
                    placeholder="반품 정책"
                    maxLength={100}
                  />
                </div>
                <div className="form-item">
                  <label>보증 기간 (일수)</label>
                  <div className="number-input-container">
                  <input 
                    type="number" 
                    value={selectedProduct?.WARRANTY_PERIOD || ''}
                    onChange={(e) => handleProductDetailChange('WARRANTY_PERIOD', e.target.value)}
                    placeholder="보증 기간"
                      className="number-input-field"
                    />
                    <div className="custom-spinner">
                      <button 
                        type="button"
                        className="spinner-btn spinner-up"
                        onClick={() => {
                          const currentValue = parseInt(selectedProduct?.WARRANTY_PERIOD || '0');
                          handleProductDetailChange('WARRANTY_PERIOD', (currentValue + 30).toString());
                        }}
                      >
                        <svg width="8" height="6" viewBox="0 0 8 6" fill="none">
                          <path d="M4 0L8 6H0L4 0Z" fill="currentColor"/>
                        </svg>
                      </button>
                      <button 
                        type="button"
                        className="spinner-btn spinner-down"
                        onClick={() => {
                          const currentValue = parseInt(selectedProduct?.WARRANTY_PERIOD || '0');
                          if (currentValue > 0) {
                            handleProductDetailChange('WARRANTY_PERIOD', Math.max(0, currentValue - 30).toString());
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

            {/* 생명주기 관리 (Lifecycle Management) */}
            <div className="detail-section">
              <h4>생명주기 관리</h4>
              <div className="form-row">
                <div className="form-item date-item">
                  <label>런닝일자</label>
                  <input 
                    type="date" 
                    value={selectedProduct?.RUN_D || ''}
                    onChange={(e) => handleProductDetailChange('RUN_D', e.target.value)}
                  />
                </div>
                <div className="form-item date-item">
                  <label>단종일자</label>
                  <input 
                    type="date" 
                    value={selectedProduct?.END_D || ''}
                    onChange={(e) => handleProductDetailChange('END_D', e.target.value)}
                  />
                </div>
              </div>
              <div className="form-row">
                <div className="form-item date-item required">
                  <label>등록일자 <span className="required-mark">*</span></label>
                  <input 
                    type="date" 
                    value={selectedProduct?.OPEN_D || ''}
                    onChange={(e) => handleProductDetailChange('OPEN_D', e.target.value)}
                  />
                </div>
                <div className="form-item date-item">
                  <label>종료일자</label>
                  <input 
                    type="date" 
                    value={selectedProduct?.CLOSE_D || ''}
                    onChange={(e) => handleProductDetailChange('CLOSE_D', e.target.value)}
                  />
                </div>
              </div>
            </div>

            {/* ERP/회계 정보 (ERP/Accounting) */}
            {isSystemAdmin && (
            <div className="detail-section">
              <h4>ERP/회계 정보</h4>
              <div className="form-row">
                <div className="form-item">
                  <label>계정과목 코드</label>
                  <input 
                    type="text" 
                    value={selectedProduct?.ACCOUNT_CODE || ''}
                    onChange={(e) => handleProductDetailChange('ACCOUNT_CODE', e.target.value)}
                    placeholder="계정과목 코드"
                    maxLength={20}
                  />
                </div>
                <div className="form-item">
                  <label>원가센터</label>
                  <input 
                    type="text" 
                    value={selectedProduct?.COST_CENTER || ''}
                    onChange={(e) => handleProductDetailChange('COST_CENTER', e.target.value)}
                    placeholder="원가센터"
                    maxLength={20}
                  />
                </div>
              </div>
              <div className="form-row">
                <div className="form-item">
                  <label>손익센터</label>
                  <input 
                    type="text" 
                    value={selectedProduct?.PROFIT_CENTER || ''}
                    onChange={(e) => handleProductDetailChange('PROFIT_CENTER', e.target.value)}
                    placeholder="손익센터"
                    maxLength={20}
                  />
                </div>
              </div>
            </div>
            )}

            {/* 기타 정보 (Other Information) */}
            <div className="detail-section">
              <h4>기타 정보</h4>
              <div className="form-row">
                <div className="form-item memo-item">
                  <label>메모</label>
                  <textarea 
                    value={selectedProduct?.REMARKS || ''}
                    onChange={(e) => handleProductDetailChange('REMARKS', e.target.value)}
                    placeholder="메모를 입력하세요"
                    maxLength={500}
                    rows={4}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* 상품 상세 정보 하단 버튼 */}
          <div className="detail-bottom-buttons">
            <div className="left-buttons">
              <button className="btn-help">
                <i className="fas fa-question-circle"></i> 도움말
              </button>
              {/* 일괄등록 버튼 - 저장 권한 체크 */}
              {batchUploadPermission.hasPermission && (
                <button className="btn-batch" onClick={() => setBatchUploadModal({ isOpen: true })}>
                  <i className="fas fa-upload"></i> 일괄등록
                </button>
              )}
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
      <ValidationModal
        isOpen={validationModal.isOpen}
        onClose={() => setValidationModal({ isOpen: false, errors: [] })}
        errors={validationModal.errors}
      />

      <ConfirmationModal
        isOpen={confirmationModal.isOpen}
        onConfirm={() => {
          setConfirmationModal({ isOpen: false, type: 'save', onConfirm: () => {} });
          confirmationModal.onConfirm();
        }}
        onCancel={() => setConfirmationModal({ isOpen: false, type: 'save', onConfirm: () => {} })}
        type={confirmationModal.type}
        itemName="상품"
      />

      <UnsavedChangesModal
        isOpen={unsavedChangesModal.isOpen}
        onSave={() => {
          setUnsavedChangesModal({ isOpen: false, onProceed: () => {} });
          handleSave();
        }}
        onDiscard={() => {
          setUnsavedChangesModal({ isOpen: false, onProceed: () => {} });
          unsavedChangesModal.onProceed();
        }}
        onCancel={() => setUnsavedChangesModal({ isOpen: false, onProceed: () => {} })}
      />

      <SuccessModal
        isOpen={successModal.isOpen}
        onClose={() => setSuccessModal({ isOpen: false, type: 'save' })}
        type={successModal.type}
        message={successModal.message}
        details={successModal.details}
        itemName="상품"
        changedFields={successModal.changedFields}
      />

      <BatchUploadModal
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
      />

      {/* 엑셀 업로드 결과 모달 */}
      <ExcelUploadResultModal
        isOpen={uploadResultModal.isOpen}
        onClose={() => setUploadResultModal({ isOpen: false, result: null })}
        result={uploadResultModal.result}
      />
    </div>
  );
});

export default ProductRegistration;
