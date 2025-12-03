import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { commonCodeService, CommonCodeOption } from '../services/commonCodeService';
import { useDispatch, useSelector } from 'react-redux';
import { AgGridReact } from 'ag-grid-react';
import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-alpine.css';
import { 
  Users, ShoppingCart, MessageSquare, Package,
  DollarSign, Award, TrendingUp, Search, Plus,
  X, Receipt, CreditCard, Banknote,
  Gift, Phone, Mail, Calendar, BarChart3, History,
  MapPin, Heart, Megaphone, FileText, Globe, Building2, Tag, Copy, Send, RefreshCw
} from 'lucide-react';
import { 
  ValidationModal, 
  ConfirmationModal, 
  SuccessModal,
  type ValidationError 
} from './common';
import CommonAgGrid from './CommonAgGrid';
import { getMenuIcon } from '../utils/menuUtils';
import { popupSearchService } from '../services/popupSearchService';
import salesService from '../services/salesService';
import customerService from '../services/customerService';
import { agentService, type AgentData as AgentServiceData } from '../services/agentService';
import { 
  setActiveTab,
  setSalesHeader,
  setSelectedCustomer,
  setCustomerSearchCondition,
  setCustomerSearchResults,
  setProductSearchCondition,
  setProductSearchResults,
  addSalesItem,
  updateSalesItem,
  removeSalesItem,
  calculateSaleSummary,
  setPaymentInfo,
  setUsedMileage,
  setPurchaseHistory,
  setConsultationHistory,
  setMileageHistory,
  setDailySalesStatus,
  setIsLoading,
  initializeNewSale,
  resetSalesRegistration,
  type TabType,
  type SalesItem,
  type CustomerInfo,
  type PaymentInfo
} from '../store/salesRegistrationSlice';
import { RootState, AppDispatch } from '../store/store';
import './salesRegistration.css';
import SalesProductSearchPopup from './salesProductSearchPopup';

const SalesRegistration: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { tabs, activeTabId } = useSelector((state: RootState) => state.tabs);
  const currentTab = useMemo(() => tabs.find(t => t.id === activeTabId), [tabs, activeTabId]);
  
  // Redux 상태
  const {
    activeTab,
    selectedCustomer,
    customerSearchCondition,
    customerSearchResults,
    productSearchCondition,
    productSearchResults,
    salesHeader,
    salesItems,
    saleSummary,
    purchaseHistory,
    consultationHistory,
    mileageHistory,
    dailySalesStatus
  } = useSelector((state: RootState) => state.salesRegistration);
  
  // 로그인 사용자 정보 가져오기 (agent_id 필요)
  const authUser = useSelector((state: RootState) => state.auth.user);

  // 로컬 상태
  const [barcodeInput, setBarcodeInput] = useState('');
  const [quantityInput, setQuantityInput] = useState('1');
  const [discountRate, setDiscountRate] = useState('0');
  const [receiptNumber, setReceiptNumber] = useState('');
  const [isReceiptLoaded, setIsReceiptLoaded] = useState(false);
  const [mileageInput, setMileageInput] = useState('0');
  const [paymentMethod, setPaymentMethod] = useState('CASH');
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  // SMS 모달 상태
  const [isSmsModalOpen, setIsSmsModalOpen] = useState(false);
  const [smsMessage, setSmsMessage] = useState('');
  // 상담이력 관련 상태
  const [isConsultModalOpen, setIsConsultModalOpen] = useState(false);
  const [consultTypeList, setConsultTypeList] = useState<{CONSULT_TYPE: string; CONSULT_TYPE_NM: string}[]>([]);
  const [procStatusList, setProcStatusList] = useState<{PROC_STATUS: string; PROC_STATUS_NM: string}[]>([]);
  const [consultFormData, setConsultFormData] = useState({
    CONSULT_ID: 0,
    CONSULT_D: '',
    CONSULT_TYPE: '',
    CONSULT_TITLE: '',
    CONSULT_CONTENT: '',
    PROC_STATUS: 'P',
    PROC_CONTENT: '',
    REL_TR_NO: ''
  });
  const [consultFilterStatus, setConsultFilterStatus] = useState('');
  const [consultFilterType, setConsultFilterType] = useState('');
  const [isConsultEditMode, setIsConsultEditMode] = useState(false);
  // 상담 처리 모달 상태
  const [isProcessModalOpen, setIsProcessModalOpen] = useState(false);
  const [processFormData, setProcessFormData] = useState({
    CONSULT_ID: 0,
    CONSULT_TITLE: '',
    CONSULT_CONTENT: '',
    CONSULT_TYPE_NM: '',
    CONSULT_D: '',
    PROC_STATUS: '',
    PROC_CONTENT: ''
  });
  // 매장 목록 및 고정 여부
  const [agents, setAgents] = useState<AgentServiceData[]>([]);
  const [isAgentFixed, setIsAgentFixed] = useState(false);
  const [includeOtherStore, setIncludeOtherStore] = useState(false);
  const agentSelectRef = useRef<HTMLSelectElement | null>(null);
  const saleDateInputRef = useRef<HTMLInputElement | null>(null);
  const staffSelectRef = useRef<HTMLSelectElement | null>(null);
  const lastCustomerIdRef = useRef<number | null>(null);
  const selectedAgentName = useMemo(() => {
    const id = salesHeader?.AGENT_ID;
    if (!id) return '';
    const found = agents.find(a => String(a.AGENT_ID) === String(id));
    return found?.AGENT_NM ?? String(id);
  }, [agents, salesHeader?.AGENT_ID]);
  
  // 구매이력 검색 필터 상태 (2년 전 ~ 오늘)
  // 한국 시간대(KST) 기준으로 날짜 포맷팅
  const formatDateLocal = (d: Date) => {
    const kstDate = new Date(d.toLocaleString('en-US', { timeZone: 'Asia/Seoul' }));
    const y = kstDate.getFullYear();
    const m = ('0' + (kstDate.getMonth() + 1)).slice(-2);
    const day = ('0' + kstDate.getDate()).slice(-2);
    return `${y}-${m}-${day}`;
  };

  // 판매일자(SALE_D)를 API에 보낼 때는 'YYYY-MM-DD' 형태로 그대로 보냄.
  // 내부적으로는 'YYYYMMDD' 또는 'YYYY-MM-DD' 둘 다 허용하되,
  // API 전송 전에는 항상 하이픈 포함 형식으로 정규화한다.
  const normalizeSaleDForApi = (raw?: string) => {
    if (!raw) return formatDateLocal(new Date());
    // 숫자만 추출
    const digits = String(raw).replace(/[^0-9]/g, '');
    if (digits.length === 8) {
      return digits.replace(/(\d{4})(\d{2})(\d{2})/, '$1-$2-$3');
    }
    // 이미 하이픈 포함된 경우 간단 검증
    if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) return raw;
    // 그 외: 오늘 날짜 반환(안정성)
    return formatDateLocal(new Date());
  };

  // 숫자 포맷 헬퍼: 천 단위 콤마 표시
  const formatNumber = (n: number | undefined | null) => {
    try {
      return (n ?? 0).toLocaleString();
    } catch (e) {
      return String(n ?? 0);
    }
  };

  // 입력 문자열에서 숫자만 추출해 정수로 반환 (콤마/공백 무시)
  const parseIntegerFromString = (s: string) => {
    if (!s) return 0;
    const digits = String(s).replace(/[^0-9\-]/g, '');
    const num = Number(digits);
    return Number.isNaN(num) ? 0 : Math.floor(num);
  };

  // 고객구분이 백엔드에서 오지 않을 경우를 위해 클라이언트 측 폴백 라벨 제공
  const mapCustGbnLabel = (c?: string) => {
    if (!c) return '-';
    const map: Record<string, string> = { A: '일반', B: '도매', C: '임직원', D: 'VIP', '9': '프리' };
    return map[c] ?? c;
  };

  // NOTE: 고객구분 표시는 백엔드의 `CUST_GBN_NM`을 우선 사용합니다.

  const getDefaultStartDate = () => {
    const date = new Date();
    date.setFullYear(date.getFullYear() - 2);
    return formatDateLocal(date);
  };
  const getDefaultEndDate = () => {
    return formatDateLocal(new Date());
  };
  
  const [purchaseStartDate, setPurchaseStartDate] = useState(getDefaultStartDate());
  const [purchaseEndDate, setPurchaseEndDate] = useState(getDefaultEndDate());
  const [purchaseProductName, setPurchaseProductName] = useState('');
  const [purchaseRangePreset, setPurchaseRangePreset] = useState<'today'|'week'|'monthThis'|'1m'|'2m'|'3m'|'6m'|'1y'|'2y'|'custom'>('custom');

  // Ref for unified 화면의 구매이력 테이블 (컬럼 리사이즈용)
  const unifiedPurchaseTableRef = useRef<HTMLTableElement | null>(null);

  // 컬럼 리사이저 초기화: unified 탭의 구매이력 테이블에서 컬럼 너비를 드래그로 조정 가능하게 함
  useEffect(() => {
    const table = unifiedPurchaseTableRef.current;
    if (!table) return;
    // only enable when unified tab is active
    if (activeTab !== 'unified') return;

    const thead = table.querySelector('thead');
    if (!thead) return;
    const ths = Array.from(thead.querySelectorAll('th')) as HTMLTableCellElement[];

    // create or reset colgroup
    let colgroup = table.querySelector('colgroup') as HTMLTableColElement | null;
    if (!colgroup) {
      colgroup = document.createElement('colgroup');
      table.insertBefore(colgroup, table.firstChild);
    }
    colgroup.innerHTML = '';

    const handlers: Array<() => void> = [];

    ths.forEach((th, idx) => {
      const w = th.getBoundingClientRect().width;
      const col = document.createElement('col');
      col.style.width = `${Math.max(40, Math.round(w))}px`;
      colgroup!.appendChild(col);

      // skip adding handle to last column
      if (idx === ths.length - 1) return;

      th.style.position = 'relative';
      // create handle
      let handle = th.querySelector('.col-resizer') as HTMLDivElement | null;
      if (!handle) {
        handle = document.createElement('div');
        handle.className = 'col-resizer';
        handle.style.position = 'absolute';
        handle.style.right = '0px';
        handle.style.top = '0px';
        handle.style.height = '100%';
        handle.style.width = '8px';
        handle.style.cursor = 'col-resize';
        handle.style.userSelect = 'none';
        handle.style.zIndex = '20';
        th.appendChild(handle);
      }

      const onMouseDown = (e: MouseEvent) => {
        e.preventDefault();
        const startX = e.clientX;
        const startWidth = col.offsetWidth;

        const onMouseMove = (ev: MouseEvent) => {
          const delta = ev.clientX - startX;
          const newW = Math.max(40, Math.round(startWidth + delta));
          col.style.width = newW + 'px';
        };

        const onMouseUp = () => {
          document.removeEventListener('mousemove', onMouseMove);
          document.removeEventListener('mouseup', onMouseUp);
        };

        document.addEventListener('mousemove', onMouseMove);
        document.addEventListener('mouseup', onMouseUp);
      };

      handle.addEventListener('mousedown', onMouseDown);
      handlers.push(() => handle.removeEventListener('mousedown', onMouseDown));
    });

    // ensure table-layout fixed so col widths apply
    const prevTableLayout = table.style.tableLayout;
    table.style.tableLayout = 'fixed';

    return () => {
      // cleanup handlers
      handlers.forEach(fn => fn());
      // remove colgroup
      if (colgroup && colgroup.parentNode) colgroup.parentNode.removeChild(colgroup);
      table.style.tableLayout = prevTableLayout || '';
    };
  }, [activeTab, purchaseHistory]);

  const formatDate = (d: Date) => formatDateLocal(d);

  const applyRangePreset = (preset: string) => {
    const today = new Date();
    let start = new Date();
    let end = new Date();

    switch (preset) {
      case 'today':
        start = new Date(today);
        end = new Date(today);
        break;
      case 'week':
        start = new Date(today);
        start.setDate(start.getDate() - 7);
        end = new Date(today);
        break;
      case 'monthThis':
        start = new Date(today.getFullYear(), today.getMonth(), 1);
        end = new Date(today);
        break;
      case '1m':
        start = new Date(today);
        start.setMonth(start.getMonth() - 1);
        end = new Date(today);
        break;
      case '2m':
        start = new Date(today);
        start.setMonth(start.getMonth() - 2);
        end = new Date(today);
        break;
      case '3m':
        start = new Date(today);
        start.setMonth(start.getMonth() - 3);
        end = new Date(today);
        break;
      case '6m':
        start = new Date(today);
        start.setMonth(start.getMonth() - 6);
        end = new Date(today);
        break;
      case '1y':
        start = new Date(today);
        start.setFullYear(start.getFullYear() - 1);
        end = new Date(today);
        break;
      case '2y':
        start = new Date(today);
        start.setFullYear(start.getFullYear() - 2);
        end = new Date(today);
        break;
      default:
        // custom: do not change dates
        setPurchaseRangePreset('custom');
        return;
    }

    const s = formatDate(start);
    const e = formatDate(end);
    setPurchaseStartDate(s);
    setPurchaseEndDate(e);
    setPurchaseRangePreset(preset as any);
    // trigger search after state updates
    setTimeout(() => handlePurchaseHistorySearch(), 0);
  };

  // 고객 검색 이력 모달 상태 (TB_ZA_CUST_FIND 기반)
  type CustFindRow = {
    AGENT_ID: string;
    FIND_TIME: string; // yyyy-MM-dd HH:mm:ss
    FIND_CUST: string; // 검색어
    FIND_CNT: number;  // 검색된 수
    P_GBN?: string;    // 포함구분 (ALL 등)
    USER_ID?: string | number;
    USER_NAME?: string;
  };
  const [showCustFindModal, setShowCustFindModal] = useState(false);
  const [custFindRows, setCustFindRows] = useState<CustFindRow[]>([]);
    const openCustFindModal = () => {
    (async () => {
      try {
        const saleD = normalizeSaleDForApi(salesHeader?.SALE_D);
        const agentId = salesHeader?.AGENT_ID || '';
        const rows = await (await import('../services/salesService')).fetchCustomerSearchHistory({ SALE_D: saleD, AGENT_ID: agentId });
        // normalize fields returned by backend
        const normalized = (rows || []).map((r: any) => ({
          AGENT_ID: r.AGENT_ID ?? r.agent_id ?? '',
          FIND_TIME: r.FIND_TIME ?? r.find_time ?? r.FIND_TIME,
          FIND_CUST: r.FIND_CUST ?? r.find_cust ?? r.FIND_CUST,
          FIND_CNT: r.FIND_CNT ?? r.find_cnt ?? 0,
          P_GBN: r.P_GBN ?? r.p_gbn ?? r.P_GBN,
          USER_ID: r.USER_ID ?? r.user_id ?? r.USER_ID,
          USER_NAME: r.user_name ?? r.USER_NAME ?? r.USER_NAME
        }));
        setCustFindRows(normalized);
        setShowCustFindModal(true);
      } catch (e) {
        console.error('검색 이력 조회 실패', e);
        setCustFindRows([]);
        setShowCustFindModal(true);
      }
    })();
  };
  const closeCustFindModal = () => setShowCustFindModal(false);

  // 상품검색 모달 상태
  const [showProductSearchModal, setShowProductSearchModal] = useState(false);
  const [productSearchTerm, setProductSearchTerm] = useState('');
  const [modalProductResults, setModalProductResults] = useState<any[]>([]);
  const [selectedProductsForAdd, setSelectedProductsForAdd] = useState<any[]>([]);
  const [modalPosition, setModalPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const productSearchInputRef = useRef<HTMLInputElement>(null);
  const productSearchGridRef = useRef<any>(null);

  // 모달 상태
  const [validationModal, setValidationModal] = useState<{
    isOpen: boolean;
    errors: ValidationError[];
  }>({ isOpen: false, errors: [] });
  
  const [confirmationModal, setConfirmationModal] = useState<{
    isOpen: boolean;
    type: 'save' | 'update' | 'delete' | 'custom' | 'reset';
    onConfirm?: () => void;
    title?: string;
    message?: string;
    confirmText?: string;
  }>({ isOpen: false, type: 'save', onConfirm: () => {} });
  
  const [successModal, setSuccessModal] = useState<{
    isOpen: boolean;
    type: 'save' | 'update' | 'delete';
    message?: string;
    details?: string;
  }>({ isOpen: false, type: 'save' });

  // 반품 모달 상태
  const [refundModal, setRefundModal] = useState<{
    isOpen: boolean;
    items: any[]; // 반품 대상 영수증 라인들
    trNo: string;
    saleD: string;
  }>({ isOpen: false, items: [], trNo: '', saleD: '' });
  
  // 반품 항목별 수량 및 마일리지 환불 선택 상태
  const [refundSelections, setRefundSelections] = useState<{
    [key: string]: { 
      selected: boolean; 
      refundQty: number; 
      maxQty: number;
      wantMileageRefund: boolean; // 마일리지로 환불을 원할 경우 선택 (기본: false)
    };
  }>({});

  // 마일리지 관련 특수 상품코드 상수
  const MILEAGE_GOODS = {
    CREDIT: { GOODS_ID: 102, GOODS_ID_BRAND: '9999999998', GOODS_NM: '마일리지적립' }, // 환불 마일리지 적립
    DEBIT: { GOODS_ID: 103, GOODS_ID_BRAND: '9999999999', GOODS_NM: '마일리지차감' }   // 판매 시 마일리지 사용
  };

  // AG Grid 한글 로케일 설정
  const localeText = useMemo(() => ({
    page: '',
    of: '/',
    to: '-',
    more: '더보기',
    next: '다음',
    last: '마지막',
    first: '처음',
    previous: '이전',
    loadingOoo: '로딩 중...',
    noRowsToShow: '조회된 데이터가 없습니다',
  }), []);

  // 탭 정의 (책 인덱스 스타일)
  const uiTabs = useMemo(() => [
    { id: 'unified' as TabType, name: '판매등록', icon: BarChart3, color: '#14b8a6' },
    { id: 'customer' as TabType, name: '고객정보', icon: Users, color: '#667eea' },
    { id: 'purchase' as TabType, name: '구매이력', icon: ShoppingCart, color: '#10b981' },
    { id: 'consultation' as TabType, name: '상담이력', icon: MessageSquare, color: '#f59e0b' },
    { id: 'mileage' as TabType, name: '마일리지', icon: Award, color: '#8b5cf6' },
    { id: 'daily' as TabType, name: '당일판매', icon: TrendingUp, color: '#ef4444' }
  ], []);

  // 탭 변경은 loadCustomerHistory 선언 이후로 이동

  // 초기화
  useEffect(() => {
    dispatch(initializeNewSale());
    // TODO: 로그인 사원 정보로 초기화
  }, [dispatch]);

  // 탭 변경
  const handleTabChange = useCallback((tabId: TabType) => {
    dispatch(setActiveTab(tabId));
  }, [dispatch, salesHeader]);

  // 매장 목록 로드 및 로그인 사용자 소속 매장 고정 처리
  useEffect(() => {
    const loadAgents = async () => {
      try {
        const data = await agentService.searchAgents({ channGbn: '1', excludeTerminated: true });
        const list = data || [];
        
        let isAgentFixedLocal = false;
        
        // 로그인 사용자 정보 가져오기
        const userStr = sessionStorage.getItem('user');
        let userStoreId: any = undefined;
        let roleName: string | undefined = undefined;
        let roleLevel: any = undefined;
        
        if (userStr) {
          try {
            const u = JSON.parse(userStr);
            roleName = u.roleName || u.ROLE_NAME || u.role || u.role_name;
            roleLevel = u.roleLevel || u.ROLE_LEVEL || u.role_level;
            userStoreId = u.storeId || u.store_id || u.STORE_ID;
          } catch (e) {
            // ignore parse error
          }
        }

        // 매장직원(rolename에 '매장' 포함 또는 role_level === 4)인 경우 자기 소속 매장만 보이도록 고정
        // role_level === 4 : 매장 직원 (refer to sql-script/00.role_구분.txt)
        const isStoreStaff = (roleName && String(roleName).includes('매장')) || (roleLevel && Number(roleLevel) === 4);
        
        if (isStoreStaff && userStoreId) {
          // 문자열/숫자 타입 정규화하여 비교
          const found = list.find(a => String(a.AGENT_ID) === String(userStoreId));
          if (found) {
            setAgents([found]);
            // 판매전표 헤더의 매장코드를 자동 설정
            const now = new Date();
            const localYmd = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}`;
            dispatch(setSalesHeader({ 
              AGENT_ID: String(found.AGENT_ID),
              SALE_D: localYmd
            }));
            isAgentFixedLocal = true;
            console.log('매장직원 로그인: 매장 고정 완료', found.AGENT_NM, found.AGENT_ID);
          } else {
            // 해당 매장이 목록에 없으면 빈리스트로 처리
            setAgents([]);
            isAgentFixedLocal = true;
          }
        } else {
          // 일반 사용자: 전체 매장 리스트를 노출
          setAgents(list);
        }
        
        setIsAgentFixed(isAgentFixedLocal);
        console.log('매장 목록 로드:', list.length, '고정여부:', isAgentFixedLocal);
      } catch (error) {
        console.error('매장 목록 로드 실패:', error);
        setAgents([]);
      }
    };

    loadAgents();
  }, [dispatch]);

  // 판매사원 리스트 (매장별)
  const [staffList, setStaffList] = useState<Array<{ STAFF_ID: number; STAFF_NM: string; STORE_ID?: any; user_status?: any }>>([]);

  // load staff list whenever AGENT_ID (salesHeader.AGENT_ID) changes
  useEffect(() => {
    (async () => {
      try {
        const svc = await import('../services/salesService');
        const storeId = salesHeader?.AGENT_ID || '';
        const rows = await svc.fetchStaffList({ AGENT_ID: storeId });
        const normalized = Array.isArray(rows) ? rows.map((r: any) => ({ STAFF_ID: r.STAFF_ID ?? r.staff_id ?? r.STAFF_ID, STAFF_NM: r.STAFF_NM ?? r.staff_nm ?? r.STAFF_NM, STORE_ID: r.STORE_ID ?? r.store_id, user_status: r.user_status })) : [];
        setStaffList(normalized);

        // Do NOT auto-select a staff by default; leave initial selection empty so user chooses explicitly.
      } catch (e) {
        console.warn('판매사원 리스트 로드 실패', e);
        setStaffList([]);
      }
    })();
  }, [salesHeader?.AGENT_ID, dispatch]);

  // 합계 자동 계산
  useEffect(() => {
    dispatch(calculateSaleSummary());
  }, [salesItems, dispatch]);


  // ========== 고객 관련 함수 ==========
  const handleCustomerSearch = useCallback(async () => {
    try {
      // 실제 백엔드 호출: MODE = CUST_SEARCH
      // 포맷: backend는 'YYYY-MM-DD'를 기대하므로 saleD를 하이픈 포함 형태로 보냄
      const saleD = normalizeSaleDForApi(salesHeader?.SALE_D);
      // 우선순위: 고정된 매장일 경우 반드시 salesHeader.AGENT_ID 사용
      const agentFromHeader = salesHeader?.AGENT_ID;
      const agentFromSelect = agentSelectRef.current ? agentSelectRef.current.value : undefined;
      let agentForApi: string | number = '';
      if (isAgentFixed && agentFromHeader) {
        agentForApi = agentFromHeader;
      } else {
        // 일반 상황: header 값 우선, 그 다음 select 값
        agentForApi = agentFromHeader || agentFromSelect || '';
      }
      // 숫자 문자열이면 숫자로 변환하여 전송 (프로시저의 numeric 파라미터와 일치시키기 위함)
      if (typeof agentForApi === 'string' && agentForApi.trim() !== '' && /^\d+$/.test(agentForApi)) {
        agentForApi = Number(agentForApi);
      }
      const requestBody = { MODE: 'CUST_SEARCH', SALE_D: saleD, AGENT_ID: agentForApi, SEARCH: customerSearchCondition.searchText, INCLUDE_OTHER_STORE: includeOtherStore };
      console.log('[salesRegistration] customerSearch request body:', requestBody, 'salesHeader:', salesHeader, 'selectValue:', agentSelectRef.current?.value, 'isAgentFixed:', isAgentFixed);
      const results = await salesService.customerSearch(requestBody);
      // 백엔드는 결과를 배열로 반환해야 함
      dispatch(setCustomerSearchResults(results || []));

      // 검색어가 있을 경우 검색 이력 저장 (MODE = CUST_SEARCH_HIST)
      if (customerSearchCondition.searchText && customerSearchCondition.searchText.trim()) {
        try {
          // 사용자 ID 추출 (sessionStorage에 저장된 로그인 정보에서 가져오기)
          const userStr = sessionStorage.getItem('user');
          let userIdForApi: string | number | undefined = undefined;
          if (userStr) {
            try {
              const u = JSON.parse(userStr);
              userIdForApi = u.userId || u.USER_ID || u.id || u.user_id || u.uid;
            } catch (e) {
              // ignore
            }
          }
          if (typeof userIdForApi === 'string' && /^\d+$/.test(userIdForApi)) userIdForApi = Number(userIdForApi);

          // 검색 결과 건수(FIND_CNT)를 전달
          const findCnt = Array.isArray(results) ? results.length : (results ? 1 : 0);

          const histBody: any = { MODE: 'CUST_SEARCH_HIST', SALE_D: saleD, AGENT_ID: agentForApi, SEARCH: customerSearchCondition.searchText.trim(), FIND_CNT: findCnt, INCLUDE_OTHER_STORE: includeOtherStore };
          if (userIdForApi !== undefined) histBody.USER_ID = userIdForApi;
          console.log('[salesRegistration] saveCustomerSearchHistory request body:', histBody);
          await salesService.saveCustomerSearchHistory(histBody);
        } catch (e) {
          // 히스토리 저장 실패는 치명적하지 않으므로 로그만 남김
          console.warn('검색 이력 저장 실패', e);
        }
      }
    } catch (error) {
      console.error('고객 검색 실패:', error);
    }
  }, [customerSearchCondition, dispatch, includeOtherStore, salesHeader, isAgentFixed]);

  const handleCustomerSelect = useCallback((customer: CustomerInfo) => {
    (async () => {
      try {
        // 고객등록에서 사용하는 상세 조회 서비스 사용
        const detail = await customerService.getCustomerDetail(customer.CUST_ID);
        console.debug('[salesRegistration] customerDetail response for CUST_ID', customer.CUST_ID, detail);

        // CustomerData를 CustomerInfo 형태로 변환
        const customerInfo: CustomerInfo = {
          CUST_ID: detail.CUST_ID!,
          CUST_NM: detail.CUST_NM,
          C_HP: detail.C_HP,
          C_EMAIL: detail.C_EMAIL,
          CUST_GBN: detail.CUST_GBN,
          GENDER_GBN: detail.GENDER_GBN,
          CUST_BIRTH_D: detail.CUST_BIRTH_D,
          CUST_GBN_NM: detail.CUST_GBN_NM,
          // 마일리지: 그리드 데이터의 MAIL_P 또는 MAIL_POINT 필드 사용
          MAIL_POINT: (customer as any).MAIL_P ?? customer.MAIL_POINT ?? 0,
          AGENT_ID: detail.AGENT_ID,
          // 소속매장명: 그리드(선택된 customer) 우선, 없으면 상세응답에서 추출
          AGENT_NM: (customer as any).AGENT_NM || (detail as any).AGENT_NM || (customer as any).STORE_NM || undefined,
          OPEN_D: detail.CUST_OPEN_D,
          C_BIRTH: detail.CUST_BIRTH_D,
          C_ADDR1: detail.C_ADDR1,
          C_ADDR2: detail.C_ADDR2,
          C_REMARK: detail.CUST_DATA,
          NATION_ID: detail.NATION_ID,
          ZIP_ID: detail.ZIP_ID,
          CUST_D_GBN: detail.CUST_D_GBN,
          CUST_HOBB: detail.CUST_HOBB,
          EMAIL_CHK: detail.EMAIL_CHK,
          DM_CHK: detail.DM_CHK,
          SMS_CHK: detail.SMS_CHK,
          CALL_CHK: detail.CALL_CHK,
          MNG_STAFF: detail.MNG_STAFF
        };

        dispatch(setSelectedCustomer(customerInfo));
        // 고객 선택 시 자동으로 구매이력/상담이력/마일리지이력 조회
        loadCustomerHistory(customerInfo.CUST_ID);
      } catch (e) {
        console.error('고객 상세 조회 실패', e);
        // fallback: 기존 동작
        dispatch(setSelectedCustomer(customer));
        loadCustomerHistory(customer.CUST_ID);
      }
    })();
  }, [dispatch]);

  // load customer-group (고객구분) options so we can display name when backend doesn't return CUST_GBN_NM
  const [custGbnOptions, setCustGbnOptions] = useState<CommonCodeOption[]>([]);
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const data = await commonCodeService.getCustGbn();
        if (mounted && Array.isArray(data)) setCustGbnOptions(data);
      } catch (e) {
        console.warn('Failed to load custGbn options', e);
      }
    })();
    return () => { mounted = false; };
  }, []);

  const getCustGbnLabel = useCallback((code?: any) => {
    if (!code) return undefined;
    const c = String(code);
    const found = custGbnOptions.find(o => String(o.value) === c || String(o.label) === c);
    return found ? found.label : undefined;
  }, [custGbnOptions]);

  // 국가 코드 라벨 로딩 및 헬퍼
  const [nationOptions, setNationOptions] = useState<CommonCodeOption[]>([]);
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const data = await commonCodeService.getNationGbn?.();
        if (mounted && Array.isArray(data)) setNationOptions(data);
      } catch (e) {
        console.warn('Failed to load nation options', e);
      }
    })();
    return () => { mounted = false; };
  }, []);

  const getNationLabel = useCallback((code?: any) => {
    if (!code) return undefined;
    const c = String(code);
    const found = nationOptions.find(o => String(o.value) === c || String(o.label) === c);
    return found ? found.label : undefined;
  }, [nationOptions]);

  const loadCustomerHistory = useCallback(async (_custId: number) => {
    try {
      const svc = await import('../services/salesService');
      // use current date-range state if available, otherwise defaults
      const from = purchaseStartDate || getDefaultStartDate();
      const to = purchaseEndDate || getDefaultEndDate();
      
      // 구매이력 조회
      const purchaseResp = await svc.fetchPurchaseHistory({
        SALE_D: normalizeSaleDForApi(salesHeader?.SALE_D),
        AGENT_ID: salesHeader?.AGENT_ID,
        CUST_ID: _custId,
        SEARCH_DATE_FROM: from,
        SEARCH_DATE_TO: to,
        SEARCH_GOODS_NM: purchaseProductName || ''
      });
      const purchaseRows = Array.isArray(purchaseResp) ? purchaseResp : [];
      dispatch(setPurchaseHistory(purchaseRows));

      // 마일리지 원장 조회 (MAIL_WONJANG 모드)
      try {
        const mileageResp = await svc.fetchMileageWonjang({
          SALE_D: normalizeSaleDForApi(salesHeader?.SALE_D),
          CUST_ID: _custId
        });
        const mileageRows = Array.isArray(mileageResp) ? mileageResp : [];
        dispatch(setMileageHistory(mileageRows));
      } catch (mileageErr) {
        console.error('마일리지 원장 조회 실패:', mileageErr);
        dispatch(setMileageHistory([]));
      }

      // 상담이력 조회
      try {
        const consultResp = await svc.fetchConsultHistory({
          CUST_ID: _custId,
          STORE_ID: salesHeader?.AGENT_ID
        });
        const consultRows = Array.isArray(consultResp) ? consultResp : [];
        dispatch(setConsultationHistory(consultRows));
      } catch (consultErr) {
        console.error('상담이력 조회 실패:', consultErr);
        dispatch(setConsultationHistory([]));
      }
    } catch (error) {
      console.error('고객 이력 조회 실패:', error);
      // fallback: 빈 이력
      dispatch(setPurchaseHistory([]));
      dispatch(setConsultationHistory([]));
      dispatch(setMileageHistory([]));
    }
  }, [dispatch, purchaseStartDate, purchaseEndDate, purchaseProductName, salesHeader]);

  // ========== 상담이력 관련 함수 ==========
  
  // 상담유형/처리상태 코드 로드
  const loadConsultCodes = useCallback(async () => {
    try {
      const [typeResp, statusResp] = await Promise.all([
        salesService.fetchConsultTypeList(),
        salesService.fetchProcStatusList()
      ]);
      setConsultTypeList(Array.isArray(typeResp) ? typeResp : []);
      setProcStatusList(Array.isArray(statusResp) ? statusResp : []);
    } catch (err) {
      console.error('상담 코드 로드 실패:', err);
    }
  }, []);

  // 컴포넌트 마운트 시 상담 코드 로드
  useEffect(() => {
    loadConsultCodes();
  }, [loadConsultCodes]);

  // 상담이력 새로고침
  const refreshConsultHistory = useCallback(async () => {
    if (!selectedCustomer) return;
    try {
      const resp = await salesService.fetchConsultHistory({
        CUST_ID: selectedCustomer.CUST_ID,
        STORE_ID: salesHeader?.AGENT_ID,
        PROC_STATUS: consultFilterStatus,
        CONSULT_TYPE: consultFilterType
      });
      dispatch(setConsultationHistory(Array.isArray(resp) ? resp : []));
    } catch (err) {
      console.error('상담이력 조회 실패:', err);
    }
  }, [selectedCustomer, salesHeader, consultFilterStatus, consultFilterType, dispatch]);

  // 상담 등록 모달 열기
  const openConsultModal = useCallback((isEdit = false, consult?: any) => {
    if (isEdit && consult) {
      setConsultFormData({
        CONSULT_ID: consult.CONSULT_ID || 0,
        CONSULT_D: consult.CONSULT_D || formatDateLocal(new Date()),
        CONSULT_TYPE: consult.CONSULT_TYPE || '',
        CONSULT_TITLE: consult.CONSULT_TITLE || '',
        CONSULT_CONTENT: consult.CONSULT_CONTENT || '',
        PROC_STATUS: consult.PROC_STATUS || 'P',
        PROC_CONTENT: consult.PROC_CONTENT || '',
        REL_TR_NO: consult.REL_TR_NO || ''
      });
      setIsConsultEditMode(true);
    } else {
      setConsultFormData({
        CONSULT_ID: 0,
        CONSULT_D: formatDateLocal(new Date()),
        CONSULT_TYPE: consultTypeList.length > 0 ? consultTypeList[0].CONSULT_TYPE : '',
        CONSULT_TITLE: '',
        CONSULT_CONTENT: '',
        PROC_STATUS: 'P',
        PROC_CONTENT: '',
        REL_TR_NO: ''
      });
      setIsConsultEditMode(false);
    }
    setIsConsultModalOpen(true);
  }, [consultTypeList]);

  // 상담 저장
  const handleSaveConsult = useCallback(async () => {
    if (!selectedCustomer || !authUser) {
      window.alert('고객을 먼저 선택해주세요.');
      return;
    }
    if (!consultFormData.CONSULT_TYPE) {
      window.alert('상담유형을 선택해주세요.');
      return;
    }
    if (!consultFormData.CONSULT_CONTENT.trim()) {
      window.alert('상담내용을 입력해주세요.');
      return;
    }

    try {
      if (isConsultEditMode && consultFormData.CONSULT_ID > 0) {
        // 수정
        await salesService.updateConsult({
          CONSULT_ID: consultFormData.CONSULT_ID,
          CONSULT_D: consultFormData.CONSULT_D,
          CONSULT_TYPE: consultFormData.CONSULT_TYPE,
          CONSULT_TITLE: consultFormData.CONSULT_TITLE,
          CONSULT_CONTENT: consultFormData.CONSULT_CONTENT,
          REL_TR_NO: consultFormData.REL_TR_NO,
          USER_ID: authUser.userId,
          STORE_ID: salesHeader?.AGENT_ID || '',
          CUST_ID: selectedCustomer.CUST_ID
        });
      } else {
        // 신규 등록
        await salesService.insertConsult({
          CONSULT_D: consultFormData.CONSULT_D,
          STORE_ID: salesHeader?.AGENT_ID || '',
          CUST_ID: selectedCustomer.CUST_ID,
          STAFF_ID: authUser.userId,
          CONSULT_TYPE: consultFormData.CONSULT_TYPE,
          CONSULT_TITLE: consultFormData.CONSULT_TITLE,
          CONSULT_CONTENT: consultFormData.CONSULT_CONTENT,
          PROC_STATUS: 'P',
          REL_TR_NO: consultFormData.REL_TR_NO,
          USER_ID: authUser.userId
        });
      }
      setIsConsultModalOpen(false);
      refreshConsultHistory();
    } catch (err) {
      console.error('상담 저장 실패:', err);
      window.alert('상담 저장에 실패했습니다.');
    }
  }, [selectedCustomer, authUser, consultFormData, isConsultEditMode, salesHeader, refreshConsultHistory]);

  // 상담 처리 모달 열기
  const openProcessModal = useCallback((consult: any) => {
    setProcessFormData({
      CONSULT_ID: consult.CONSULT_ID || 0,
      CONSULT_TITLE: consult.CONSULT_TITLE || '',
      CONSULT_CONTENT: consult.CONSULT_CONTENT || '',
      CONSULT_TYPE_NM: consult.CONSULT_TYPE_NM || consult.CONSULT_TYPE || '',
      CONSULT_D: consult.CONSULT_D || '',
      PROC_STATUS: consult.PROC_STATUS || 'P',
      PROC_CONTENT: consult.PROC_CONTENT || ''
    });
    setIsProcessModalOpen(true);
  }, []);

  // 상담 처리결과 저장
  const handleSaveProcess = useCallback(async () => {
    if (!authUser) return;
    if (!processFormData.PROC_STATUS) {
      window.alert('처리상태를 선택해주세요.');
      return;
    }
    try {
      await salesService.processConsult({
        CONSULT_ID: processFormData.CONSULT_ID,
        PROC_STATUS: processFormData.PROC_STATUS,
        PROC_CONTENT: processFormData.PROC_CONTENT,
        STAFF_ID: authUser.userId,
        USER_ID: authUser.userId
      });
      setIsProcessModalOpen(false);
      refreshConsultHistory();
      window.alert('처리결과가 저장되었습니다.');
    } catch (err) {
      console.error('상담 처리 업데이트 실패:', err);
      window.alert('처리결과 업데이트에 실패했습니다.');
    }
  }, [authUser, processFormData, refreshConsultHistory]);

  // 상담 처리결과 업데이트 (기존 - 바로 완료처리용)
  const handleProcessConsult = useCallback(async (consultId: number, newStatus: string, procContent: string) => {
    if (!authUser) return;
    try {
      await salesService.processConsult({
        CONSULT_ID: consultId,
        PROC_STATUS: newStatus,
        PROC_CONTENT: procContent,
        STAFF_ID: authUser.userId,
        USER_ID: authUser.userId
      });
      refreshConsultHistory();
    } catch (err) {
      console.error('상담 처리 업데이트 실패:', err);
      window.alert('처리결과 업데이트에 실패했습니다.');
    }
  }, [authUser, refreshConsultHistory]);

  // 상담 삭제
  const handleDeleteConsult = useCallback(async (consultId: number) => {
    if (!window.confirm('이 상담 내역을 삭제하시겠습니까?')) return;
    try {
      await salesService.deleteConsult(consultId);
      refreshConsultHistory();
    } catch (err) {
      console.error('상담 삭제 실패:', err);
      window.alert('상담 삭제에 실패했습니다.');
    }
  }, [refreshConsultHistory]);

  // 구매이력 검색 핸들러
  const handlePurchaseHistorySearch = useCallback(async () => {
    if (!selectedCustomer) return;
    try {
      const svc = await import('../services/salesService');
      const resp = await svc.fetchPurchaseHistory({
        SALE_D: normalizeSaleDForApi(salesHeader?.SALE_D),
        AGENT_ID: salesHeader?.AGENT_ID,
        CUST_ID: selectedCustomer.CUST_ID,
        SEARCH_DATE_FROM: purchaseStartDate,
        SEARCH_DATE_TO: purchaseEndDate,
        SEARCH_GOODS_NM: purchaseProductName
      });
      // Expecting array of rows from backend
      const rows = Array.isArray(resp) ? resp : [];
      dispatch(setPurchaseHistory(rows));
    } catch (err) {
      console.error('구매이력 조회 실패', err);
      // fallback to existing client-side filter when backend fails
      let filtered = purchaseHistory;
      if (purchaseStartDate || purchaseEndDate) {
        filtered = filtered.filter(item => {
          const itemDate = item.SALE_D || '';
          const start = purchaseStartDate || '00000000';
          const end = purchaseEndDate || '99999999';
          return itemDate >= start && itemDate <= end;
        });
      }
      if (purchaseProductName.trim()) {
        const searchTerm = purchaseProductName.toLowerCase();
        filtered = filtered.filter(item =>
          (item.GOODS_NM || '').toLowerCase().includes(searchTerm) || (item.TR_NO || '').toLowerCase().includes(searchTerm)
        );
      }
      dispatch(setPurchaseHistory(filtered));
    }
  }, [selectedCustomer, purchaseStartDate, purchaseEndDate, purchaseProductName, purchaseHistory, dispatch, salesHeader]);

  // 구매 이력 행 더블클릭: 영수증(TR_NO)으로 전표 불러오기
  const handlePurchaseRowDoubleClick = useCallback(async (row: any) => {
    if (!row) return;
    try {
      // use salesHeader.AGENT_ID and selectedCustomer.CUST_ID as STORE_ID/CUST_ID
      const storeId = salesHeader?.AGENT_ID || (selectedCustomer as any)?.AGENT_ID || '';
      const custId = (selectedCustomer as any)?.CUST_ID || salesHeader?.CUST_ID || '';
      if (!row.TR_NO) {
        console.warn('[salesRegistration] 선택된 구매 항목에 영수증번호(TR_NO)가 없습니다.');
        return;
      }

      try { dispatch(setIsLoading(true)); } catch (e) {}

      const resp = await salesService.getSaleDetailByReceipt({ SALE_D: row.SALE_D, STORE_ID: storeId, CUST_ID: custId, TR_NO: row.TR_NO });
      const rows = Array.isArray(resp) ? resp : [];

      // 초기화: 전표 영역을 비우고 헤더를 설정
      dispatch(resetSalesRegistration());
      // set local receipt input
      setReceiptNumber(row.TR_NO || '');
      dispatch(setSalesHeader({ SALE_D: row.SALE_D, TR_NO: row.TR_NO, AGENT_ID: storeId, CUST_ID: String(custId), STAFF_ID: rows.length > 0 ? (rows[0].STAFF_ID ?? salesHeader?.STAFF_ID) : salesHeader?.STAFF_ID } as any));

      // 판매 항목 추가 (저장된 값 그대로 사용 - SALE_SEQU 포함하여 업데이트 가능하게 함)
      // DB에서 가져온 데이터는 라인별로 SALE_SEQU가 있으므로 중복 병합하지 않고 그대로 추가
      for (const r of rows) {
        // SALE_SEQU를 명확히 숫자로 변환 (0, null, undefined 모두 처리)
        const saleSequ = r.SALE_SEQU !== null && r.SALE_SEQU !== undefined ? Number(r.SALE_SEQU) : undefined;
        const item: any = {
          SALE_SEQU: saleSequ, // DB에서 가져온 SALE_SEQU 값 명시적으로 포함
          GOODS_ID: r.GOODS_ID,
          GOODS_NM: r.GOODS_NM,
          BRAND_NM: r.BRAND_NM,
          BAR_CODE: r.BAR_CODE,
          SALE_QTY: Number(r.SALE_QTY) || 0,
          SALE_DANGA: Number(r.SALE_DANGA) || 0,
          TOT_AMT: Number(r.TOT_AMT) || Number(r.SALE_AMT) || 0,
          DISCOUNT_RATE: Number(r.DISCOUNT_RATE) || 0,
          DISCOUNT_AMT: Number(r.DISCOUNT_AMT) || 0,
          SALE_AMT: Number(r.SALE_AMT) || 0,
          // MAIL_POINT: DB 값 그대로 사용 (0이나 음수도 유지)
          MAIL_POINT: r.MAIL_POINT !== null && r.MAIL_POINT !== undefined ? Number(r.MAIL_POINT) : 0,
          P_MAIL_AMT: r.P_MAIL_AMT ?? null,
          P_MAIL_POINT: r.P_MAIL_POINT ?? null,
          EXP_D: r.EXP_D ?? r.EXPIRY_D ?? ''
        };
        console.debug('[handlePurchaseRowDoubleClick] Adding item with SALE_SEQU:', saleSequ, item);
        dispatch(addSalesItem(item as any));
      }

      // 요약 재계산 (탭은 이동하지 않음)
      dispatch(calculateSaleSummary());
      // mark receipt-loaded mode so delete column is hidden
      setIsReceiptLoaded(rows.length > 0);

      try { console.debug('[salesRegistration] loaded receipt rows count:', rows.length); } catch (e) {}
    } catch (err) {
      console.error('영수증 전표 조회 실패', err);
    } finally {
      try { dispatch(setIsLoading(false)); } catch (e) {}
    }
  }, [dispatch, salesHeader, selectedCustomer]);

  // ========== 반품 처리 함수 ==========
  
  // 반품 모달 열기 (영수증 단위)
  const handleOpenRefundModal = useCallback(async (row: any) => {
    if (!row || !row.TR_NO) {
      alert('영수증번호가 없는 항목입니다.');
      return;
    }
    
    try {
      dispatch(setIsLoading(true));
      
      // 해당 영수증의 모든 라인 조회
      const storeId = salesHeader?.AGENT_ID || (selectedCustomer as any)?.AGENT_ID || '';
      const custId = (selectedCustomer as any)?.CUST_ID || salesHeader?.CUST_ID || '';
      
      const resp = await salesService.getSaleDetailByReceipt({ 
        SALE_D: row.SALE_D, 
        STORE_ID: storeId, 
        CUST_ID: custId, 
        TR_NO: row.TR_NO 
      });
      const items = Array.isArray(resp) ? resp : [];
      
      // 마일리지 관련 상품(102, 103)은 제외하고 일반 상품만 표시
      const refundableItems = items.filter((item: any) => {
        const goodsId = Number(item.GOODS_ID);
        return goodsId !== MILEAGE_GOODS.CREDIT.GOODS_ID && 
               goodsId !== MILEAGE_GOODS.DEBIT.GOODS_ID &&
               Number(item.SALE_QTY) > 0; // 양수 수량만 (이미 반품된 건 제외)
      });
      
      if (refundableItems.length === 0) {
        alert('반품 가능한 상품이 없습니다.');
        return;
      }
      
      // 반품 선택 상태 초기화
      const initialSelections: typeof refundSelections = {};
      refundableItems.forEach((item: any) => {
        const key = `${item.SALE_SEQU}`;
        initialSelections[key] = {
          selected: false,
          refundQty: Number(item.SALE_QTY) || 1,
          maxQty: Number(item.SALE_QTY) || 1,
          wantMileageRefund: false // 기본값: 마일리지 환불 안 원함
        };
      });
      
      setRefundSelections(initialSelections);
      setRefundModal({
        isOpen: true,
        items: refundableItems,
        trNo: row.TR_NO,
        saleD: row.SALE_D
      });
      
    } catch (err) {
      console.error('반품 모달 데이터 조회 실패:', err);
      alert('영수증 정보를 불러오는 중 오류가 발생했습니다.');
    } finally {
      dispatch(setIsLoading(false));
    }
  }, [salesHeader, selectedCustomer, dispatch, MILEAGE_GOODS]);

  // 반품 선택 토글
  const handleRefundSelectionToggle = useCallback((saleSequ: string, checked: boolean) => {
    setRefundSelections(prev => ({
      ...prev,
      [saleSequ]: { ...prev[saleSequ], selected: checked }
    }));
  }, []);

  // 반품 수량 변경
  const handleRefundQtyChange = useCallback((saleSequ: string, qty: number) => {
    setRefundSelections(prev => {
      const item = prev[saleSequ];
      if (!item) return prev;
      const validQty = Math.max(1, Math.min(qty, item.maxQty));
      return {
        ...prev,
        [saleSequ]: { ...item, refundQty: validQty }
      };
    });
  }, []);

  // 마일리지 환불 선택 토글
  const handleMileageRefundToggle = useCallback((saleSequ: string, checked: boolean) => {
    setRefundSelections(prev => ({
      ...prev,
      [saleSequ]: { ...prev[saleSequ], wantMileageRefund: checked }
    }));
  }, []);

  // 반품 처리 확정
  const handleConfirmRefund = useCallback(async () => {
    const selectedItems = refundModal.items.filter(item => 
      refundSelections[String(item.SALE_SEQU)]?.selected
    );
    
    if (selectedItems.length === 0) {
      alert('반품할 상품을 선택해주세요.');
      return;
    }
    
    const confirmMsg = selectedItems.map(item => {
      const sel = refundSelections[String(item.SALE_SEQU)];
      const mileageNote = sel.wantMileageRefund ? ' (마일리지 환불)' : '';
      return `- ${item.GOODS_NM}: ${sel.refundQty}개${mileageNote}`;
    }).join('\n');
    
    if (!window.confirm(`다음 상품을 반품 처리하시겠습니까?\n\n${confirmMsg}`)) {
      return;
    }
    
    try {
      dispatch(setIsLoading(true));
      
      const saleDForApi = normalizeSaleDForApi(refundModal.saleD);
      const storeId = salesHeader?.AGENT_ID || (selectedCustomer as any)?.AGENT_ID || '';
      const custId = (selectedCustomer as any)?.CUST_ID || salesHeader?.CUST_ID || '';
      const staffId = salesHeader?.STAFF_ID || null;
      
      // 세션에서 사용자 ID 가져오기
      const sessionUserStr = sessionStorage.getItem('user');
      let effectiveUserId: string | null = null;
      if (sessionUserStr) {
        try {
          const su = JSON.parse(sessionUserStr);
          effectiveUserId = su.userId || su.USER_ID || su.id || null;
        } catch (e) {}
      }
      
      let totalRefundAmt = 0;
      let totalMileageRefund = 0;
      
      // 반품 라인 저장 (음수 수량으로)
      for (const item of selectedItems) {
        const sel = refundSelections[String(item.SALE_SEQU)];
        const refundQty = -Math.abs(sel.refundQty); // 음수로 변환
        const unitPrice = Number(item.SALE_DANGA) || 0;
        const discountRate = Number(item.DISCOUNT_RATE) || 0;
        const totAmt = refundQty * unitPrice;
        const discountAmt = Math.floor(Math.abs(totAmt) * discountRate / 100) * -1; // 음수
        const saleAmt = totAmt - discountAmt;
        
        // 반품에 의해 차감될 마일리지 (기존 적립분 취소)
        const originalMailPoint = Number(item.MAIL_POINT) || 0;
        const refundMailPoint = Math.floor(originalMailPoint * Math.abs(refundQty) / Math.abs(Number(item.SALE_QTY)));
        
        totalRefundAmt += Math.abs(saleAmt);
        
        // 1. 반품 라인 저장 (IO_ID = 220 - 자동 결정됨)
        const refundPayload = {
          MODE: 'CUST_SALE_SAVE_UPDATE',
          SALE_D: saleDForApi,
          STORE_ID: Number(storeId),
          CUST_ID: Number(custId),
          TR_NO: refundModal.trNo,
          STAFF_ID: staffId ? Number(staffId) : undefined,
          GOODS_ID: Number(item.GOODS_ID),
          SALE_QTY: refundQty, // 음수
          SALE_DANGA: unitPrice,
          TOT_AMT: totAmt, // 음수
          DISCOUNT_RATE: discountRate,
          DISCOUNT_AMT: discountAmt, // 음수
          SALE_AMT: saleAmt, // 음수
          EXP_D: item.EXP_D || '',
          MAIL_POINT: -refundMailPoint, // 기존 적립분 차감 (음수)
          IS_GENUINE: 'Y',
          USER_ID: effectiveUserId
        };
        
        console.debug('[반품처리] 반품 라인 저장:', refundPayload);
        await salesService.saveSaleLine(refundPayload);
        
        // 2. 마일리지 환불 선택한 경우 → 마일리지적립 상품(102) 라인 추가
        if (sel.wantMileageRefund) {
          const mileageRefundAmt = Math.abs(saleAmt); // 환불금액을 마일리지로 적립
          totalMileageRefund += mileageRefundAmt;
          
          const mileagePayload = {
            MODE: 'CUST_SALE_SAVE_UPDATE',
            SALE_D: saleDForApi,
            STORE_ID: Number(storeId),
            CUST_ID: Number(custId),
            TR_NO: refundModal.trNo,
            STAFF_ID: staffId ? Number(staffId) : undefined,
            GOODS_ID: MILEAGE_GOODS.CREDIT.GOODS_ID, // 102: 마일리지적립
            SALE_QTY: 1,
            SALE_DANGA: 0,
            TOT_AMT: 0,
            DISCOUNT_RATE: 0,
            DISCOUNT_AMT: 0,
            SALE_AMT: 0,
            MAIL_POINT: mileageRefundAmt, // 양수: 환불금액만큼 마일리지 적립
            IS_GENUINE: 'Y',
            USER_ID: effectiveUserId
          };
          
          console.debug('[반품처리] 마일리지 환불 라인 저장:', mileagePayload);
          await salesService.saveSaleLine(mileagePayload);
        }
      }
      
      // 월간집계 실행
      try {
        await salesService.aggregateMonth({
          SALE_D: saleDForApi,
          STORE_ID: storeId,
          CUST_ID: custId,
          TR_NO: refundModal.trNo
        });
        console.debug('[반품처리] 월간집계 완료');
      } catch (monthErr) {
        console.error('[반품처리] 월간집계 실패:', monthErr);
      }
      
      // 모달 닫기
      setRefundModal({ isOpen: false, items: [], trNo: '', saleD: '' });
      setRefundSelections({});
      
      // 성공 메시지
      let successMsg = `반품 처리가 완료되었습니다.\n환불금액: ${totalRefundAmt.toLocaleString()}원`;
      if (totalMileageRefund > 0) {
        successMsg += `\n마일리지 적립: ${totalMileageRefund.toLocaleString()}P`;
      }
      
      setSuccessModal({
        isOpen: true,
        type: 'save',
        message: '반품 처리 완료',
        details: successMsg
      });
      
      // 구매이력 새로고침
      if (selectedCustomer?.CUST_ID) {
        await loadCustomerHistory(Number(selectedCustomer.CUST_ID));
      }
      
    } catch (err) {
      console.error('반품 처리 실패:', err);
      alert('반품 처리 중 오류가 발생했습니다.');
    } finally {
      dispatch(setIsLoading(false));
    }
  }, [refundModal, refundSelections, salesHeader, selectedCustomer, dispatch, loadCustomerHistory, MILEAGE_GOODS]);

  // 반품 모달 닫기
  const handleCloseRefundModal = useCallback(() => {
    setRefundModal({ isOpen: false, items: [], trNo: '', saleD: '' });
    setRefundSelections({});
  }, []);

  // 통합화면 사용성: 고객 변경 시 이력 자동 갱신
  useEffect(() => {
    if (selectedCustomer) {
      const currentId = selectedCustomer.CUST_ID;
      // 이전에 같은 고객이 선택되어 있으면 기본 기간을 다시 덮어쓰지 않음
      if (lastCustomerIdRef.current !== currentId) {
        // 검색 필터 초기화 (기본: 2년 전 ~ 오늘) - 검색어는 유지
        setPurchaseStartDate(getDefaultStartDate());
        setPurchaseEndDate(getDefaultEndDate());
        // setPurchaseProductName(''); // 검색어는 유지하도록 주석 처리
        // 날짜 초기화 후 이력 로드
        // setState는 비동기적이므로 약간의 지연을 두고 호출하여 최신 날짜를 사용하게 함
        setTimeout(() => loadCustomerHistory(currentId), 50);
        lastCustomerIdRef.current = currentId;
      }
    } else {
      lastCustomerIdRef.current = null;
    }
  }, [selectedCustomer, loadCustomerHistory]);

  // 상품검색 모달 포커스
  useEffect(() => {
    if (showProductSearchModal && productSearchInputRef.current) {
      setTimeout(() => productSearchInputRef.current?.focus(), 100);
    }
  }, [showProductSearchModal]);

  // 드래그 핸들러
  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (isDragging) {
      requestAnimationFrame(() => {
        const newX = e.clientX - dragOffset.x;
        const newY = e.clientY - dragOffset.y;
        const maxX = window.innerWidth - 800;
        const maxY = window.innerHeight - 500;
        setModalPosition({
          x: Math.max(0, Math.min(newX, maxX)),
          y: Math.max(0, Math.min(newY, maxY))
        });
      });
    }
  }, [isDragging, dragOffset]);

  const handleMouseUp = useCallback(() => setIsDragging(false), []);

  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.body.style.userSelect = 'none';
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
        document.body.style.userSelect = '';
      };
    }
  }, [isDragging, handleMouseMove, handleMouseUp]);

  // ========== 상품검색 모달 함수 ==========
  const handleOpenProductSearch = useCallback(() => {
    // Require sale date and agent selection before opening product search
    if (!salesHeader || !salesHeader.SALE_D) {
      window.alert('판매일자를 선택해 주세요.');
      return;
    }
    if (!salesHeader.AGENT_ID) {
      window.alert('판매 매장을 선택해 주세요.');
      return;
    }

    setShowProductSearchModal(true);
    const popupWidth = 800;
    const popupHeight = 500;
    const centerX = Math.max(50, (window.innerWidth - popupWidth) / 2);
    const centerY = Math.max(50, (window.innerHeight - popupHeight) / 4);
    setModalPosition({ x: centerX, y: centerY });
  }, [salesHeader]);

  const handleCloseProductSearch = useCallback(() => {
    setShowProductSearchModal(false);
    setProductSearchTerm('');
    setModalProductResults([]);
    setSelectedProductsForAdd([]);
  }, []);

  const handleModalMouseDown = useCallback((e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    if (target.closest('.sales-product-search-modal-header') && !target.closest('.sales-modal-close-btn')) {
      e.preventDefault();
      setIsDragging(true);
      const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
      setDragOffset({ x: e.clientX - rect.left, y: e.clientY - rect.top });
    }
  }, []);

  const handleProductSearchInModal = useCallback(async () => {
    try {
      console.log('🔍 [salesRegistration] authUser 전체:', authUser);
      console.log('🔍 [salesRegistration] authUser.agentId:', authUser?.agentId);
      console.log('🔍 [salesRegistration] authUser.storeId:', authUser?.storeId);
      console.log('🔍 [salesRegistration] salesHeader.AGENT_ID:', salesHeader?.AGENT_ID);
      
      const products = await popupSearchService.searchProductsForPopup({
        searchText: productSearchTerm || undefined,
        excludeEndedProducts: true,
        storeId: salesHeader?.AGENT_ID,
        agentId: authUser?.agentId // 로그인 사용자의 agent_id 추가
      } as any);
      setModalProductResults(products || []);
    } catch (error) {
      console.error('상품 검색 실패:', error);
      setModalProductResults([]);
    }
  }, [productSearchTerm, salesHeader?.AGENT_ID, authUser]);

  const handleProductSelectionChange = useCallback(() => {
    if (productSearchGridRef.current) {
      setSelectedProductsForAdd(productSearchGridRef.current.getSelectedRows() || []);
    }
  }, []);

  const handleAddProductsToSales = useCallback(() => {
    // Ensure each selected product is added as a separate row when EXP_D differs.
    // Redux slice가 SALE_SEQU를 자동 할당하므로 0으로 전달
    selectedProductsForAdd.forEach(product => {
      const exp = product.EXP_D ?? product.EXPIRY_D ?? product.expiry ?? '';
      const existing = salesItems.find((it: any) => String(it.GOODS_ID) === String(product.GOODS_ID || product.id) && String(it.EXP_D || '') === String(exp));
      if (existing) {
        // increment quantity for existing item with same expiry
        dispatch(updateSalesItem({ sequ: existing.SALE_SEQU, data: { SALE_QTY: (existing.SALE_QTY || 0) + 1 } }));
      } else {
        const priceVal = product.CONSUMER_PRICE ?? product.consumerPrice ?? product.SALE_DANGA ?? 0;
        const newItem: SalesItem = {
          SALE_SEQU: 0, // Redux slice에서 자동 할당
          GOODS_ID: product.GOODS_ID || product.id,
          GOODS_NM: product.GOODS_NAME || product.productName || product.GOODS_NM || '',
          BRAND_NM: product.BRAND_NAME || product.brand || product.BRAND_NM || '',
          BAR_CODE: product.BAR_CODE || product.BARCODE || '',
          EXP_D: exp,
          SALE_QTY: 1,
          SALE_DANGA: priceVal,
          TOT_AMT: priceVal,
          DISCOUNT_RATE: 0,
          DISCOUNT_AMT: 0,
          SALE_AMT: priceVal,
          NET_TOT: priceVal,
          NET_AMT: Math.floor(Number(priceVal) / 1.1),
          NET_VAT: Math.floor(Number(priceVal)) - Math.floor(Number(priceVal) / 1.1),
          MAIL_POINT: undefined as any, // slice에서 자동 계산
          P_MAIL_AMT: product.P_MAIL_AMT ?? null,
          P_MAIL_POINT: product.P_MAIL_POINT ?? null
        };
        dispatch(addSalesItem(newItem));
      }
    });
    handleCloseProductSearch();
  }, [selectedProductsForAdd, salesItems, dispatch, handleCloseProductSearch]);

  const handleSearchKeyPress = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleProductSearchInModal();
  }, [handleProductSearchInModal]);

  // ========== 상품 관련 함수 ==========
  const handleProductSearch = useCallback(async () => {
    try {
      // TODO: 백엔드 API 호출
      // const results = await productService.searchProducts(productSearchCondition);
      // dispatch(setProductSearchResults(results));
      
      // 임시 데이터
      const mockProducts = [
        {
          GOODS_ID: 10001,
          GOODS_NM: '샤넬 No.5 향수 100ml',
          BRAND_NM: 'CHANEL',
          BAR_CODE: '8801234567890',
          SALE_DANGA: 180000,
          DISCOUNT_RATE: 0,
          MAIL_POINT_RATE: 1.0
        },
        {
          GOODS_ID: 10002,
          GOODS_NM: '디올 쿠션 파운데이션',
          BRAND_NM: 'DIOR',
          BAR_CODE: '8801234567891',
          SALE_DANGA: 85000,
          DISCOUNT_RATE: 10,
          MAIL_POINT_RATE: 1.5
        }
      ];
      dispatch(setProductSearchResults(mockProducts));
    } catch (error) {
      console.error('상품 검색 실패:', error);
    }
  }, [productSearchCondition, dispatch]);

  const handleAddProductFromSearch = useCallback((product: any) => {
    // When user adds product manually, ensure we are not in receipt-loaded mode
    try { setIsReceiptLoaded(false); } catch (e) {}
    // Normalize numeric fields to avoid NaN
    const rawPrice = product.CONSUMER_PRICE ?? product.SALE_DANGA ?? product.SOBIJA_DAN ?? product.consumerPrice ?? 0;
    const saleDanga = Number(rawPrice) || 0;
    const discountRateNum = Number(product.DISCOUNT_RATE ?? 0) || 0;
    const discountAmt = Math.floor(saleDanga * discountRateNum / 100) || 0;
    const saleAmt = saleDanga - discountAmt;
    const netAmt = Math.floor(saleAmt / 1.1) || 0;
    const netVat = saleAmt - netAmt;
    
    // Extract special mileage fields from product (if provided by popup)
    const pMailAmt = product.P_MAIL_AMT ?? null;
    const pMailPoint = product.P_MAIL_POINT ?? null;

    const newItem: SalesItem = {
      SALE_SEQU: 0, // Redux slice에서 자동 할당됨 (신규 항목용)
      GOODS_ID: product.GOODS_ID,
      GOODS_NM: product.GOODS_NM,
      BRAND_NM: product.BRAND_NM ?? product.BRAND_GBN_NM ?? '',
      BAR_CODE: product.BAR_CODE ?? product.BARCODE ?? product.BAR_CODE ?? '',
      EXP_D: product.EXP_D ?? product.EXPIRY_D ?? product.expiry ?? '',
      SALE_QTY: 1,
      SALE_DANGA: saleDanga,
      TOT_AMT: saleDanga,
      DISCOUNT_RATE: discountRateNum,
      DISCOUNT_AMT: discountAmt,
      SALE_AMT: saleAmt,
      NET_TOT: saleAmt,
      NET_AMT: netAmt,
      NET_VAT: netVat,
      MAIL_POINT: undefined as any, // slice에서 자동 계산
      P_MAIL_AMT: pMailAmt,
      P_MAIL_POINT: pMailPoint
    };

    dispatch(addSalesItem(newItem));
  }, [salesItems, dispatch]);

  const handleBarcodeInput = useCallback(async (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && barcodeInput.trim()) {
      try {
        // 실제: popupSearchService를 사용하여 바코드(또는 텍스트)로 조회
        const saleDForApi = normalizeSaleDForApi(salesHeader?.SALE_D);
        
        console.log('🔍 [바코드입력] authUser 전체:', authUser);
        console.log('🔍 [바코드입력] authUser.agentId:', authUser?.agentId);
        console.log('🔍 [바코드입력] authUser.storeId:', authUser?.storeId);
        console.log('🔍 [바코드입력] salesHeader.AGENT_ID:', salesHeader?.AGENT_ID);
        
        // Do not pass selected sales agentId here; backend requires the logged-in user's agent id (session)
        const rows = await popupSearchService.searchProductsForPopup({ 
          searchText: barcodeInput.trim(), 
          saleDate: saleDForApi, 
          storeId: salesHeader?.AGENT_ID,
          agentId: authUser?.agentId // 로그인 사용자의 agent_id 추가
        } as any);

        if (!rows || rows.length === 0) {
          setValidationModal({ isOpen: true, errors: [{ field: 'barcode', message: '해당 바코드의 상품을 찾을 수 없습니다.' }] });
        } else if (rows.length === 1) {
          // 단건인 경우 바로 장바구니(판매항목)에 추가
          handleAddProductFromSearch(rows[0]);
          setBarcodeInput('');
          setQuantityInput('1');
          setDiscountRate('0');
        } else {
          // 여러건인 경우 팝업을 열어 사용자가 선택하도록 함
          setProductSearchTerm(barcodeInput.trim());
          setShowProductSearchModal(true);
        }
      } catch (error) {
        console.error('상품 조회 실패:', error);
        setValidationModal({
          isOpen: true,
          errors: [{ field: 'barcode', message: '해당 바코드의 상품을 찾을 수 없습니다.' }]
        });
      }
    }
  }, [barcodeInput, quantityInput, discountRate, salesItems, dispatch, salesHeader, handleAddProductFromSearch, authUser]);

  // wrapper for popup selection (sales-specific popup returns minimal fields)
  

  // Updated wrapper to accept consumer price when provided by popup
  const handleSelectProductFromPopupWithPrice = useCallback((p: { GOODS_ID: number; GOODS_NM: string; CONSUMER_PRICE?: number; BRAND_NM?: string; BAR_CODE?: string; EXP_D?: string; P_MAIL_AMT?: number | null; P_MAIL_POINT?: number | null }) => {
    // user action -> clear receipt-loaded mode
    try { setIsReceiptLoaded(false); } catch (e) {}
    // If the product with same expiry already exists in the salesItems, increment quantity instead of adding duplicate
    const existing = salesItems.find((it: any) => String(it.GOODS_ID) === String(p.GOODS_ID) && (String(it.EXP_D || '') === String(p.EXP_D || '')));
    if (existing) {
      dispatch(updateSalesItem({ sequ: existing.SALE_SEQU, data: { SALE_QTY: (existing.SALE_QTY || 0) + 1 } }));
      return;
    }

    const productLike = {
      GOODS_ID: p.GOODS_ID,
      GOODS_NM: p.GOODS_NM,
      BRAND_NM: p.BRAND_NM ?? '',
      BAR_CODE: p.BAR_CODE ?? '',
      SALE_DANGA: p.CONSUMER_PRICE ?? 0,
      DISCOUNT_RATE: 0,
      MAIL_POINT_RATE: 0,
      EXP_D: p.EXP_D ?? '',
      P_MAIL_AMT: p.P_MAIL_AMT ?? null,
      P_MAIL_POINT: p.P_MAIL_POINT ?? null
    };
    handleAddProductFromSearch(productLike);
  }, [handleAddProductFromSearch, salesItems, dispatch]);

  // ========== 판매 관련 함수 ==========
  const handleRemoveItem = useCallback((sequ: number) => {
    dispatch(removeSalesItem(sequ));
  }, [dispatch]);

  const handleUpdateItemQty = useCallback((sequ: number, qty: number) => {
    console.debug('[handleUpdateItemQty] sequ:', sequ, 'qty:', qty);
    if (qty > 0) {
      dispatch(updateSalesItem({ sequ, data: { SALE_QTY: qty } }));
    }
  }, [dispatch]);

  const handleUpdateItemDiscount = useCallback((sequ: number, rate: number) => {
    if (rate >= 0 && rate <= 100) {
      dispatch(updateSalesItem({ sequ, data: { DISCOUNT_RATE: rate } }));
    }
  }, [dispatch]);

  const handleUpdateItemDiscountAmt = useCallback((sequ: number, amt: number) => {
    if (amt >= 0) {
      dispatch(updateSalesItem({ sequ, data: { DISCOUNT_AMT: Math.floor(amt) } }));
    }
  }, [dispatch]);

  const handlePayment = useCallback(() => {
    const errors: ValidationError[] = [];

    if (!salesHeader || !salesHeader.SALE_D) {
      errors.push({ field: 'SALE_D', message: '판매일자는 필수 입력 항목입니다.' });
    }

    if (!salesHeader || !salesHeader.AGENT_ID) {
      errors.push({ field: 'AGENT_ID', message: '매장은 필수 선택 항목입니다.' });
    }

    if (!salesHeader || !salesHeader.STAFF_ID || Number(salesHeader.STAFF_ID) === 0) {
      errors.push({ field: 'STAFF_ID', message: '판매사원은 필수 선택 항목입니다.' });
    }

    if (errors.length > 0) {
      setValidationModal({ isOpen: true, errors });
      // focus first missing field (STAFF -> AGENT -> SALE_D)
      const hasStaffError = errors.some(err => err.field === 'STAFF_ID');
      const hasAgentError = errors.some(err => err.field === 'AGENT_ID');
      if (hasStaffError) {
        setTimeout(() => staffSelectRef.current?.focus(), 100);
      } else if (hasAgentError) {
        setTimeout(() => agentSelectRef.current?.focus(), 100);
      } else {
        setTimeout(() => saleDateInputRef.current?.focus(), 100);
      }
      return;
    }

    // 판매일자가 오늘 날짜가 아닌 경우 사용자 확인
    try {
      const todayYmd = formatDateLocal(new Date()).replace(/-/g, ''); // 'YYYYMMDD' 형식
      const saleDateYmd = (salesHeader?.SALE_D || '').replace(/[^0-9]/g, ''); // 'YYYYMMDD' 형식으로 정규화
      if (saleDateYmd && saleDateYmd !== todayYmd) {
        const proceed = window.confirm('판매일자가 오늘이 아닙니다. 해당 날짜로 등록하시겠습니까?');
        if (!proceed) return; // 사용자가 취소하면 중단
      }
    } catch (e) {
      // ignore date check errors
    }

    // selectedCustomer may be empty (guest sale). We allow proceeding and will auto-register a pre-customer during confirm.
    
    if (salesItems.length === 0) {
      setValidationModal({
        isOpen: true,
        errors: [{ field: 'items', message: '판매할 상품을 추가해주세요.' }]
      });
      return;
    }
    
    setIsPaymentModalOpen(true);
  }, [selectedCustomer, salesItems, salesHeader]);

  const handleConfirmPayment = useCallback(async () => {
    try {
      // safety validation before confirm
      const errors: ValidationError[] = [];
      if (!salesHeader || !salesHeader.SALE_D) {
        errors.push({ field: 'SALE_D', message: '판매일자는 필수 입력 항목입니다.' });
      }
      if (!salesHeader || !salesHeader.AGENT_ID) {
        errors.push({ field: 'AGENT_ID', message: '매장은 필수 선택 항목입니다.' });
      }
      if (errors.length > 0) {
        setValidationModal({ isOpen: true, errors });
        return;
      }

      // 최종 저장 직전에도 판매일자가 오늘이 아닌지 재확인 (사용자가 모달 띄운 뒤 날짜 수정했을 가능성 대비)
      try {
        const todayYmd = formatDateLocal(new Date()).replace(/-/g, ''); // 'YYYYMMDD' 형식
        const saleDateYmd = (salesHeader?.SALE_D || '').replace(/[^0-9]/g, ''); // 'YYYYMMDD' 형식으로 정규화
        if (saleDateYmd && saleDateYmd !== todayYmd) {
          const proceed = window.confirm('판매일자가 오늘이 아닙니다. 해당 날짜로 등록하시겠습니까?');
          if (!proceed) return; // 취소 시 저장 중단
        }
      } catch (e) {
        // ignore
      }
      const payment: PaymentInfo = {
        paymentMethod,
        paymentAmt: saleSummary.paymentAmt,
        cardCompany: paymentMethod === 'CARD' ? '신한카드' : undefined,
        approvalNo: paymentMethod === 'CARD' ? `APPR${Date.now()}` : undefined
      };
      
      dispatch(setPaymentInfo(payment));

      // Extract logged-in user id from session to send as USER_ID
      const sessionUserStr = sessionStorage.getItem('user');
      let userIdFromSession: string | number | null = null;
      if (sessionUserStr) {
        try {
          const su = JSON.parse(sessionUserStr);
          userIdFromSession = su.userId || su.USER_ID || su.id || su.user_id || su.uid || null;
        } catch (e) {
          // ignore parse errors
          userIdFromSession = null;
        }
      }
      const effectiveUserId = userIdFromSession ? String(userIdFromSession) : null;

      // local effective store id & customer id, will be used when sending sale lines to backend
      let effectiveStoreId: any = salesHeader?.AGENT_ID || (agentSelectRef.current ? agentSelectRef.current.value : '') || '';
      let effectiveCustId: any = salesHeader?.CUST_ID || '';

      // If no customer selected, auto-register a pre-customer and use its CUST_ID for the sale
      if (!selectedCustomer) {
        try {
          // generate pre-customer name in format: 프리_YYMMDDHHMISS (fixed to KST timezone)
          const now = new Date();
          // Use Intl.DateTimeFormat with Asia/Seoul to ensure consistent KST values regardless of client timezone
          const df = new Intl.DateTimeFormat('ko-KR', {
            timeZone: 'Asia/Seoul',
            year: '2-digit',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: false
          });
          const parts = df.formatToParts(now).reduce((acc: any, p: any) => { acc[p.type] = p.value; return acc; }, {});
          const preCustName = `프리_${parts.year}${parts.month}${parts.day}${parts.hour}${parts.minute}${parts.second}`;

          const custPayload: any = {
            AGENT_ID: salesHeader?.AGENT_ID || '',
            CUST_NM: preCustName,
            CUST_GBN: '9', // '프리' 고객 등급 코드
            USER_ID: effectiveUserId || ''
          };
          const saveRes = await customerService.saveCustomer(custPayload);
          // backend may return various shapes: number/string id, { custId }, { newId }, { OUT_NEW_ID }, or wrapped with success flag.
          let maybeNewId: any = undefined;
          if (saveRes == null) {
            maybeNewId = undefined;
          } else if (typeof saveRes === 'number' || typeof saveRes === 'string') {
            maybeNewId = saveRes;
          } else if (typeof saveRes === 'object') {
            // prefer explicit id fields
            maybeNewId = (saveRes as any).custId ?? (saveRes as any).newId ?? (saveRes as any).OUT_NEW_ID ?? (saveRes as any).OUT_NEW_ID_VALUE ?? (saveRes as any).id;
            // some backends wrap payload inside data/result
            if (!maybeNewId) {
              maybeNewId = (saveRes as any).data?.custId ?? (saveRes as any).data?.newId ?? (saveRes as any).result?.newId ?? (saveRes as any).result?.custId;
            }
            // some backends use 'returnValue' (numeric) as the newly created id or status code
            if (!maybeNewId && typeof (saveRes as any).returnValue !== 'undefined') {
              const rv = (saveRes as any).returnValue;
              const rvNum = Number(rv);
              if (!Number.isNaN(rvNum) && rvNum > 0) {
                maybeNewId = rvNum;
              }
            }
            // if response uses success flag but returns id property even when success=false, accept it
            if (!maybeNewId && (saveRes as any).success && ((saveRes as any).custId || (saveRes as any).newId)) {
              maybeNewId = (saveRes as any).custId ?? (saveRes as any).newId;
            }
          }

          // If we still don't have an id but backend indicates success, try to locate the created customer via a quick search
          if (!maybeNewId && (saveRes as any).success) {
            try {
              const found = await customerService.searchCustomers({ custName: custPayload.CUST_NM, custGbn: [], agentId: salesHeader?.AGENT_ID || '', openDateFrom: '', openDateTo: '', phoneOrEmail: '' } as any);
              if (Array.isArray(found) && found.length > 0 && found[0].CUST_ID) {
                maybeNewId = found[0].CUST_ID;
              }
            } catch (e) {
              // ignore search failure; we'll fall back to error handling below
            }
          }

              if (maybeNewId) {
                const newCustId = maybeNewId;
                // Update header/customer in redux first with minimal info
                dispatch(setSalesHeader({ CUST_ID: String(newCustId) } as any));
                effectiveCustId = String(newCustId);
                dispatch(setSelectedCustomer({ CUST_ID: newCustId, CUST_NM: custPayload.CUST_NM } as any));

                // Try to fetch full customer detail to populate 기본정보 (and possibly AGENT_ID)
                try {
                  const custDetail = await customerService.getCustomerDetail(Number(newCustId));
                  console.debug('[salesRegistration] getCustomerDetail after pre-cust create', newCustId, custDetail);
                  const resolvedCust: any = Array.isArray(custDetail) && custDetail.length > 0 ? custDetail[0] : custDetail;
                  if (resolvedCust && typeof resolvedCust === 'object') {
                    // If AGENT_NM is missing, try to enrich from agentService
                    try {
                      if ((!resolvedCust.AGENT_NM || String(resolvedCust.AGENT_NM).trim() === '') && (resolvedCust.AGENT_ID || resolvedCust.STORE_ID || resolvedCust.STOREID)) {
                        const aid = resolvedCust.AGENT_ID || resolvedCust.STORE_ID || resolvedCust.STOREID;
                        const agentInfo = await agentService.getAgentDetail(String(aid), true).catch((e) => { console.warn('agentService.getAgentDetail failed:', e); return null; });
                        if (agentInfo && (agentInfo as any).AGENT_NM) resolvedCust.AGENT_NM = (agentInfo as any).AGENT_NM;
                      }
                    } catch (e) {
                      console.warn('Failed to enrich customer with agent name:', e);
                    }
                    // populate selected customer with detailed info
                    dispatch(setSelectedCustomer(resolvedCust as any));
                    // if backend returned an agent/store association and salesHeader lacks STORE_ID, set it
                    const currentAgentId = salesHeader?.AGENT_ID || '';
                    const agentFromDetail = (resolvedCust as any).AGENT_ID || (resolvedCust as any).STORE_ID || (resolvedCust as any).STOREID;
                    if (!currentAgentId && agentFromDetail) {
                      dispatch(setSalesHeader({ AGENT_ID: String(agentFromDetail) } as any));
                      // also update local effectiveStoreId variable so subsequent payloads use it
                      try {
                        // eslint-disable-next-line @typescript-eslint/no-unused-vars
                        effectiveStoreId = String(agentFromDetail);
                      } catch (err) {
                        // ignore
                      }
                    }
                  }
                } catch (err) {
                  // ignore detail fetch errors; proceed with whatever info we have
                  console.warn('프리 고객 생성 후 상세 조회 실패:', err);
                }
              } else {
            console.warn('saveCustomer returned unexpected response:', saveRes);
            setValidationModal({ isOpen: true, errors: [{ field: 'customer', message: '프리 고객 등록에 실패했습니다.' }] });
            return;
          }
        } catch (e) {
          console.error('프리 고객 등록 실패:', e);
          setValidationModal({ isOpen: true, errors: [{ field: 'customer', message: '프리 고객 등록 중 오류가 발생했습니다.' }] });
          return;
        }
      }

      // 판매 항목을 순차 저장: 첫 호출에서 TR_NO가 생성되어 반환되면 이후 호출에 사용
      const saleDForApi = normalizeSaleDForApi(salesHeader?.SALE_D);
      let localTrNo = salesHeader?.TR_NO && String(salesHeader.TR_NO).trim() !== '' ? String(salesHeader.TR_NO) : '';

      // Ensure effectiveStoreId/effectiveCustId are set before sending any payload
      if ((!effectiveStoreId || String(effectiveStoreId).trim() === '') && salesHeader?.AGENT_ID) {
        effectiveStoreId = salesHeader.AGENT_ID;
      }
      if ((!effectiveStoreId || String(effectiveStoreId).trim() === '') && agentSelectRef.current) {
        const v = (agentSelectRef.current.value || '').toString().trim();
        if (v) effectiveStoreId = v;
      }
      if (!effectiveStoreId || String(effectiveStoreId).trim() === '') {
        console.error('판매 저장 실패: STORE_ID(AGENT_ID)가 설정되지 않았습니다. salesHeader, select 값을 확인하세요.', { salesHeader, effectiveStoreId });
        setValidationModal({ isOpen: true, errors: [{ field: 'AGENT_ID', message: '판매매장이 선택되지 않았습니다. 상단 판매매장을 확인해주세요.' }] });
        return;
      }

      if ((!effectiveCustId || String(effectiveCustId).trim() === '') && salesHeader?.CUST_ID) {
        effectiveCustId = salesHeader.CUST_ID;
      }

      // 변경된 항목만 필터링 (영수증 조회 후 수정 시)
      // _isModified: 수정된 항목, _isNew: 신규 추가된 항목
      // 영수증 조회 항목(SALE_SEQU 있음): _isModified가 true인 것만
      // 신규 항목(SALE_SEQU 없음): 모두 전송
      const hasModifiedFlag = salesItems.some(item => item._isModified === true || item._isNew === true);
      const hasReceiptItems = salesItems.some(item => item.SALE_SEQU !== undefined && item.SALE_SEQU !== null && item.SALE_SEQU > 0);
      
      const itemsToSave = (hasModifiedFlag || hasReceiptItems) 
        ? salesItems.filter(item => {
            // 영수증 조회 항목: _isModified가 true인 것만
            if (item.SALE_SEQU !== undefined && item.SALE_SEQU !== null && item.SALE_SEQU > 0) {
              return item._isModified === true;
            }
            // 신규 항목: _isNew가 true이거나 플래그가 없으면 모두 전송
            return item._isNew === true || (!item._isModified && !item._isNew);
          })
        : salesItems; // 플래그가 없고 영수증 항목도 없으면 전체 전송(신규 등록)

      console.debug('[handleConfirmPayment] Total items:', salesItems.length, 'Items to save:', itemsToSave.length, 'Has modified flag:', hasModifiedFlag, 'Has receipt items:', hasReceiptItems);
      // 각 항목의 SALE_SEQU 상태 확인
      itemsToSave.forEach((it, idx) => {
        console.debug(`[handleConfirmPayment] Item[${idx}] SALE_SEQU=${it.SALE_SEQU}, GOODS_ID=${it.GOODS_ID}, _isModified=${it._isModified}, _isNew=${it._isNew}`);
      });

      for (let i = 0; i < itemsToSave.length; i++) {
        const item = itemsToSave[i];
        // Ensure numeric types for STORE_ID/CUST_ID to match backend expectation
        const storeIdNum = (typeof effectiveStoreId === 'number') ? effectiveStoreId : (effectiveStoreId && !Number.isNaN(Number(effectiveStoreId)) ? Number(effectiveStoreId) : undefined);
        const custIdCandidate = effectiveCustId || salesHeader?.CUST_ID;
        const custIdNum = (typeof custIdCandidate === 'number') ? custIdCandidate : (custIdCandidate && !Number.isNaN(Number(custIdCandidate)) ? Number(custIdCandidate) : undefined);
        const staffIdNum = salesHeader?.STAFF_ID && !Number.isNaN(Number(salesHeader.STAFF_ID)) ? Number(salesHeader.STAFF_ID) : undefined;
        const goodsIdNum = (item.GOODS_ID && !Number.isNaN(Number(item.GOODS_ID))) ? Number(item.GOODS_ID) : item.GOODS_ID;
        const saleQtyNum = (item.SALE_QTY && !Number.isNaN(Number(item.SALE_QTY))) ? Number(item.SALE_QTY) : item.SALE_QTY;
        const saleDangaNum = (item.SALE_DANGA && !Number.isNaN(Number(item.SALE_DANGA))) ? Number(item.SALE_DANGA) : item.SALE_DANGA;

        // SALE_SEQU 변환: null/undefined만 null로, 0은 신규 항목이므로 그대로 전송
        const saleSequNum = item.SALE_SEQU !== null && item.SALE_SEQU !== undefined ? Number(item.SALE_SEQU) : null;
        
        const payload = {
          MODE: 'CUST_SALE_SAVE_UPDATE',
          SALE_D: saleDForApi,
          STORE_ID: storeIdNum,
          CUST_ID: custIdNum,
          TR_NO: localTrNo || undefined,
          SALE_SEQU: saleSequNum, // SALE_SEQU 명시적 변환 (UPDATE 시 사용)
          STAFF_ID: staffIdNum || undefined,
          GOODS_ID: goodsIdNum,
          SALE_QTY: saleQtyNum,
          SALE_DANGA: saleDangaNum,
          TOT_AMT: item.TOT_AMT,
          DISCOUNT_RATE: item.DISCOUNT_RATE,
          DISCOUNT_AMT: item.DISCOUNT_AMT,
          SALE_AMT: item.SALE_AMT,
          EXP_D: item.EXP_D || undefined,
          MAIL_POINT: item.MAIL_POINT || 0,
          P_MAIL_AMT: item.P_MAIL_AMT ?? null,
          P_MAIL_POINT: item.P_MAIL_POINT ?? null,
          IS_GENUINE: (item as any).IS_GENUINE || 'Y',
          USER_ID: effectiveUserId || null
        } as any;

        // Log payload being sent for debugging (CUST_SALE_SAVE_UPDATE)
        try {
          console.debug('[CUST_SALE_SAVE_UPDATE] sending payload for item GOODS_ID:', item?.GOODS_ID, 'SALE_SEQU:', saleSequNum, '_isModified:', item._isModified, '_isNew:', item._isNew);
          console.debug('[CUST_SALE_SAVE_UPDATE] full payload:', JSON.stringify(payload));
        } catch (e) {
          // ignore logging errors
        }
        const res = await salesService.saveSaleLine(payload);

        // 백엔드가 단일 객체 또는 배열을 반환할 수 있으므로 안전하게 처리
        const row = Array.isArray(res) && res.length > 0 ? res[0] : res;
        if (row && row.TR_NO) {
          localTrNo = row.TR_NO;
          dispatch(setSalesHeader({ TR_NO: localTrNo } as any));
        }
        if (row && row.SALE_SEQU) {
          // 응답으로 전달된 SALE_SEQU를 로컬 항목에 반영
          dispatch(updateSalesItem({ sequ: item.SALE_SEQU, data: { SALE_SEQU: row.SALE_SEQU } }));
        }
      }

      // 마일리지 사용이 있는 경우, 마일리지 차감 라인 추가 저장 (GOODS_ID=103)
      if (saleSummary.usedMileage > 0) {
        try {
          const storeIdNum = (typeof effectiveStoreId === 'number') ? effectiveStoreId : (effectiveStoreId && !Number.isNaN(Number(effectiveStoreId)) ? Number(effectiveStoreId) : 0);
          const custIdCandidate = effectiveCustId || salesHeader?.CUST_ID;
          const custIdNum = (typeof custIdCandidate === 'number') ? custIdCandidate : (custIdCandidate && !Number.isNaN(Number(custIdCandidate)) ? Number(custIdCandidate) : 0);
          
          const mileageDebitPayload = {
            MODE: 'CUST_SALE_SAVE_UPDATE',
            SALE_D: saleDForApi,
            STORE_ID: storeIdNum,
            CUST_ID: custIdNum,
            TR_NO: localTrNo || undefined,
            SALE_SEQU: null, // 신규 라인
            STAFF_ID: salesHeader?.STAFF_ID ? Number(salesHeader.STAFF_ID) : undefined,
            GOODS_ID: MILEAGE_GOODS.DEBIT.GOODS_ID, // 103: 마일리지차감
            SALE_QTY: 1,
            SALE_DANGA: 0,
            TOT_AMT: 0,
            DISCOUNT_RATE: 0,
            DISCOUNT_AMT: 0,
            SALE_AMT: 0,
            MAIL_POINT: -saleSummary.usedMileage, // 음수로 차감
            USER_ID: effectiveUserId || null
          };

          console.debug('[마일리지 차감] 저장 시작:', mileageDebitPayload);
          const mileageRes = await salesService.saveSaleLine(mileageDebitPayload);
          console.debug('[마일리지 차감] 저장 완료:', mileageRes);
          
          // TR_NO 갱신 (첫 라인에서 받지 못했을 경우 대비)
          const mileageRow = Array.isArray(mileageRes) && mileageRes.length > 0 ? mileageRes[0] : mileageRes;
          if (mileageRow && mileageRow.TR_NO && !localTrNo) {
            localTrNo = mileageRow.TR_NO;
            dispatch(setSalesHeader({ TR_NO: localTrNo } as any));
          }
        } catch (mileageErr) {
          console.error('[마일리지 차감] 저장 실패:', mileageErr);
          // 마일리지 차감 실패 시에도 판매 자체는 진행 (경고만 표시)
          setValidationModal({
            isOpen: true,
            errors: [{ field: 'mileage', message: '마일리지 차감 처리 중 오류가 발생했습니다. 관리자에게 문의해주세요.' }]
          });
        }
      }

      // 모든 라인 저장 완료 후 월간집계 실행 (CUST_SALE_MONTH)
      try {
        console.debug('[CUST_SALE_MONTH] 월간집계 실행 시작', { SALE_D: saleDForApi, STORE_ID: effectiveStoreId, CUST_ID: effectiveCustId, TR_NO: localTrNo });
        await salesService.aggregateMonth({
          SALE_D: saleDForApi,
          STORE_ID: effectiveStoreId,
          CUST_ID: effectiveCustId,
          TR_NO: localTrNo
        });
        console.debug('[CUST_SALE_MONTH] 월간집계 완료');
      } catch (monthErr) {
        console.error('[CUST_SALE_MONTH] 월간집계 실패:', monthErr);
        // 월간집계 실패는 전체 판매를 롤백하지 않음 (이미 저장된 상태)
      }

      setSuccessModal({
        isOpen: true,
        type: 'save',
        message: '판매가 완료되었습니다.',
        details: `영수증번호: ${localTrNo || 'TR' + Date.now()}\n결제금액: ${saleSummary.paymentAmt.toLocaleString()}원`
      });

      setIsPaymentModalOpen(false);

      // 판매 완료 후: 판매전표(라인)만 초기화하고 고객정보는 유지하여
      // 기준정보에 고객을 표시하고 구매이력을 바로 조회하도록 함.
      setTimeout(async () => {
        // resetSalesRegistration preserves selectedCustomer and purchaseHistory
        dispatch(resetSalesRegistration());
        setPaymentMethod('CASH');
        setMileageInput('0');

        // Determine which customer id to use: prefer selectedCustomer (if present), otherwise salesHeader.CUST_ID
        const custIdToShow = selectedCustomer && (selectedCustomer as any).CUST_ID ? (selectedCustomer as any).CUST_ID : salesHeader?.CUST_ID;
        if (custIdToShow) {
          try {
            // refresh customer detail from backend to populate 기본정보
            const custDetail = await customerService.getCustomerDetail(Number(custIdToShow));
            const resolved = Array.isArray(custDetail) && custDetail.length > 0 ? custDetail[0] : custDetail;
            if (resolved) {
              // If AGENT_NM (소속매장명)가 not provided by customer detail, fetch agent detail and merge
              try {
                if ((!resolved.AGENT_NM || String(resolved.AGENT_NM).trim() === '') && resolved.AGENT_ID) {
                  const agentInfo = await agentService.getAgentDetail(String(resolved.AGENT_ID), true).catch((e) => {
                    console.warn('agentService.getAgentDetail failed:', e);
                    return null;
                  });
                  if (agentInfo && (agentInfo as any).AGENT_NM) {
                    resolved.AGENT_NM = (agentInfo as any).AGENT_NM;
                  }
                }
              } catch (e) {
                console.warn('Failed to enrich customer with agent name:', e);
              }
              dispatch(setSelectedCustomer(resolved as any));
            }
          } catch (e) {
            // ignore errors but keep existing selectedCustomer if any
            console.warn('판매후 고객 상세 조회 실패:', e);
          }

          try {
            // Load purchase history for this customer
            await loadCustomerHistory(Number(custIdToShow));
          } catch (e) {
            console.warn('판매후 구매이력 로드 실패:', e);
          }
        }
      }, 2000);
      
    } catch (error) {
      console.error('결제 처리 실패:', error);
      setValidationModal({
        isOpen: true,
        errors: [{ field: 'payment', message: '결제 처리 중 오류가 발생했습니다.' }]
      });
    }
  }, [paymentMethod, saleSummary, salesHeader, salesItems, dispatch]);

  // 판매등록 섹션 전용 초기화 (고객정보 및 구매이력은 유지)
  // 현재 판매 데이터 존재 여부 판단 (초기화/확인용)
  const hasSaleData = useCallback(() => {
    const itemsExist = Array.isArray(salesItems) && salesItems.length > 0;
    const summaryNonZero = !!(saleSummary && (saleSummary.saleAmt > 0 || saleSummary.totalQty > 0));
    const receiptFilled = !!receiptNumber;
    return itemsExist || summaryNonZero || receiptFilled;
  }, [salesItems, saleSummary, receiptNumber]);

  // 판매등록 섹션 전용 초기화 (고객정보 및 구매이력은 유지)
  const handleResetAll = useCallback(() => {
      const doReset = () => {
      dispatch(setSelectedCustomer(null));
      dispatch(setPurchaseHistory([]));
      dispatch(initializeNewSale());
      setReceiptNumber('');
      setIsReceiptLoaded(false);
      setConfirmationModal({ isOpen: false, type: 'reset', onConfirm: () => {} });
    };

    if (hasSaleData()) {
      setConfirmationModal({
        isOpen: true,
        type: 'reset',
        title: '초기화 확인',
        message: '기본정보, 구매이력 및 판매전표를 초기화하시겠습니까?',
        confirmText: '초기화',
        onConfirm: doReset,
      });
    } else {
      doReset();
    }
  }, [dispatch, hasSaleData]);

  // 판매전표(라인)만 초기화: 고객정보와 구매이력은 유지
  const handleResetSales = useCallback(() => {
    const doReset = () => {
      // Only reset the sales registration (lines, header.sale_d etc.) but keep selected customer/basic info
      dispatch(resetSalesRegistration());
      setReceiptNumber('');
        setIsReceiptLoaded(false);
      setPaymentMethod('CASH');
      setMileageInput('0');
      setValidationModal({ isOpen: false, errors: [] });
      setSuccessModal({ isOpen: false, type: 'save' });
      setConfirmationModal({ isOpen: false, type: 'reset', onConfirm: () => {} });
    };

    if (hasSaleData()) {
      setConfirmationModal({
        isOpen: true,
        type: 'reset',
        title: '판매전표 초기화 확인',
        message: '현재 판매중인 항목을 초기화하시겠습니까?',
        confirmText: '초기화',
        onConfirm: doReset,
      });
    } else {
      doReset();
    }
  }, [dispatch, hasSaleData]);

  // ========== 당일 판매 현황 조회 ==========
  const loadDailySales = useCallback(async () => {
    if (!salesHeader?.AGENT_ID || !salesHeader?.SALE_D) {
      dispatch(setDailySalesStatus([]));
      return;
    }
    try {
      // SALE_D를 YYYY-MM-DD 형식으로 변환
      const saleDateFormatted = salesHeader.SALE_D.replace(/(\d{4})(\d{2})(\d{2})/, '$1-$2-$3');
      const results = await salesService.fetchStaffSale({
        SALE_D: saleDateFormatted,
        STORE_ID: salesHeader.AGENT_ID
      });
      dispatch(setDailySalesStatus(Array.isArray(results) ? results : []));
    } catch (error) {
      console.error('당일 판매 현황 조회 실패:', error);
      dispatch(setDailySalesStatus([]));
    }
  }, [salesHeader?.SALE_D, salesHeader?.AGENT_ID, dispatch]);

  useEffect(() => {
    if (activeTab === 'daily') {
      loadDailySales();
    }
  }, [activeTab, loadDailySales]);

  // ========== AG-Grid 컬럼 정의 ==========
  const customerGridColumns = useMemo(() => [
    
    { field: 'CUST_NM' as const, headerName: '고객명', width: 120, cellStyle: (params: any) => ({ color: params.data?.AGENT_ID === salesHeader?.AGENT_ID ? '#10b981' : '#4b5563' }) },
    { field: 'C_HP' as const, headerName: '전화번호', width: 130, cellStyle: (params: any) => ({ color: params.data?.AGENT_ID === salesHeader?.AGENT_ID ? '#10b981' : '#4b5563' }) },
    { field: 'C_EMAIL' as const, headerName: '이메일', width: 180, cellStyle: (params: any) => ({ color: params.data?.AGENT_ID === salesHeader?.AGENT_ID ? '#10b981' : '#4b5563' }) },    
    { field: 'AGENT_ID' as const, headerName: '소속매장코드', hide: true },
    { field: 'AGENT_NM' as const, headerName: '소속매장', width: 150, cellStyle: (params: any) => ({ color: params.data?.AGENT_ID === salesHeader?.AGENT_ID ? '#10b981' : '#4b5563' }) },
    { 
      field: 'MAIL_P' as const, 
      headerName: '마일리지', 
      width: 100,
      valueFormatter: (params: any) => params.value?.toLocaleString() || '0',
      cellStyle: (params: any) => ({ color: params.data?.AGENT_ID === salesHeader?.AGENT_ID ? '#10b981' : '#4b5563' })
    },
    { field: 'CUST_ID' as const, headerName: '고객코드', hide: false, width: 110 }
  ], [salesHeader]);

  const productGridColumns = useMemo(() => [
    { field: 'GOODS_ID' as any, headerName: '상품코드', width: 100 },
    { field: 'BRAND_NM' as any, headerName: '브랜드', width: 100 },
    { field: 'GOODS_NM' as any, headerName: '상품명', width: 250 },
    { field: 'BAR_CODE' as any, headerName: '바코드', width: 130 },
    { 
      field: 'SALE_DANGA', 
      headerName: '판매가', 
      width: 100,
      valueFormatter: (params: any) => params.value?.toLocaleString() || '0'
    },
    { 
      field: 'DISCOUNT_RATE', 
      headerName: '할인율', 
      width: 80,
      valueFormatter: (params: any) => `${params.value || 0}%`
    }
  ], []);

  // (이전에는 클라이언트에서 매핑했으나, 현재는 백엔드 `CUST_GBN_NM`을 사용합니다.)

  // ========== 렌더링 ==========
  return (
    <div className="sales-registration">
      {/* 헤더 영역 */}
      <div className="sales-header">
        <div className="sales-header-left">
          <div className="sales-icon">
            {currentTab?.menuIcon
              ? React.createElement(getMenuIcon(currentTab.menuIcon) as any, { size: 16 })
              : React.createElement(getMenuIcon('book') as any, { size: 16 })}
          </div>
          <h2 className="sales-title">{currentTab?.title || '판매전표등록'}</h2>
        </div>
        <div className="sales-header-right">
          <div className="sales-date-info">
            <label style={{ fontSize: 12, marginRight: 8 }}>판매일자</label>
            <Calendar size={18} />
            <input
              ref={saleDateInputRef}
              type="date"
              className={`sales-date-input ${!salesHeader.SALE_D ? 'required-field' : ''}`}
              value={salesHeader.SALE_D.replace(/(\d{4})(\d{2})(\d{2})/, '$1-$2-$3')}
              onChange={(e) => dispatch(setSalesHeader({ SALE_D: e.target.value.replace(/-/g, '') } as any))}
              style={{ marginLeft: 8 }}
              required
            />
            {/* 판매일자 부가 텍스트 제거: 날짜 컨트롤 자체만 표시하도록 변경 */}
          </div>
          <div className="sales-store-info" style={{ marginLeft: 12 }}>
            <label className="sales-store-label">판매매장</label>
            {isAgentFixed ? (
              <div className="sales-store-badge">{selectedAgentName || salesHeader.AGENT_ID || '-'}</div>
            ) : (
              <select
                ref={agentSelectRef}
                value={salesHeader.AGENT_ID || ''}
                onChange={(e) => dispatch(setSalesHeader({ AGENT_ID: e.target.value } as any))}
                className={`sales-store-select-control ${!salesHeader.AGENT_ID ? 'required-field' : ''}`}
                required
              >
                <option value="">선택하세요</option>
                {agents.map(a => (
                  <option key={String(a.AGENT_ID)} value={String(a.AGENT_ID)}>
                    {a.AGENT_NM}
                  </option>
                ))}
              </select>
            )}
          </div>
          {selectedCustomer && (
            <div className="sales-customer-badge">
              <Users size={18} />
              <span style={{ marginRight: 8 }}>{selectedCustomer.CUST_NM}</span>
              {/* 고객등급별 몱지 색상 차별화 */}
              {(() => {
                const custGbn = (selectedCustomer as any).CUST_GBN;
                const custGbnNm = ((selectedCustomer as any).CUST_GBN_NM) || getCustGbnLabel(custGbn) || custGbn;
                // 등급별 색상 설정 (VVIP/VIP/우수/일반/프리 등)
                let badgeStyle = { background: '#f1f5f9', color: '#475569' }; // 기본 (gray)
                if (custGbn === '1' || custGbnNm?.includes('VVIP')) {
                  badgeStyle = { background: '#fef3c7', color: '#b45309' }; // gold
                } else if (custGbn === '2' || custGbnNm?.includes('VIP')) {
                  badgeStyle = { background: '#dbeafe', color: '#1d4ed8' }; // blue
                } else if (custGbn === '3' || custGbnNm?.includes('우수')) {
                  badgeStyle = { background: '#dcfce7', color: '#15803d' }; // green
                } else if (custGbn === '4' || custGbnNm?.includes('일반')) {
                  badgeStyle = { background: '#f1f5f9', color: '#475569' }; // gray
                } else if (custGbn === '9' || custGbnNm?.includes('프리')) {
                  badgeStyle = { background: '#fce7f3', color: '#be185d' }; // pink
                }
                return (
                  <span style={{ 
                    fontSize: 12, fontWeight: 600,
                    padding: '2px 8px', borderRadius: 6, marginRight: 8,
                    ...badgeStyle
                  }}>
                    {custGbnNm}
                  </span>
                );
              })()}
              <span className="mileage-badge">
                <Award size={14} />
                {selectedCustomer.MAIL_POINT?.toLocaleString() || 0}P
              </span>
            </div>
          )}
          {/* 헤더 초기화 버튼은 기본정보 섹션 우측에 배치하도록 이동함 */}
        </div>
      </div>

      {/* 탭 네비게이션 (책 인덱스 스타일) */}
      <div className="sales-tabs-container">
        <div className="sales-tabs">
          {uiTabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                className={`sales-tab ${activeTab === tab.id ? 'active' : ''}`}
                onClick={() => handleTabChange(tab.id)}
                style={{
                  borderLeftColor: activeTab === tab.id ? tab.color : 'transparent'
                }}
              >
                <Icon size={14} style={{ color: tab.color }} />
                <span>{tab.name}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 탭 컨텐츠 영역 */}
      <div className="sales-content">
        {/* 0. 통합 화면 탭 */}
        {activeTab === 'unified' && (
          <div className="sales-tab-content sales-unified-layout">
            {/* 좌측: 고객 검색 + 리스트 + 요약 */}
            <div className="sales-pane-left sales-section-customer">
              <div className="sales-section-header customer">
                <div className="title"><Users size={16} /> 고객</div>
              </div>
              <div className="sales-search-bar" style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                <div style={{ display: 'inline-block' }}>
                  <input
                    type="text"
                    placeholder="고객명 또는 전화번호 입력"
                    value={customerSearchCondition.searchText}
                    onChange={(e) => dispatch(setCustomerSearchCondition({ searchText: e.target.value }))}
                    onKeyPress={(e) => e.key === 'Enter' && handleCustomerSearch()}
                    className="sales-search-input"
                    style={{ display: 'block' }}
                  />
                  <div style={{ fontSize: 12, color: '#6b7280', marginTop: 2 }}>
                    <label style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                      <input type="checkbox" checked={includeOtherStore} onChange={(e) => setIncludeOtherStore(e.target.checked)} style={{ width: 12, height: 12 }} />
                      <span style={{ lineHeight: '12px' }}>타매장고객 포함</span>
                    </label>
                  </div>
                </div>

                <div style={{ display: 'inline-flex', gap: 8 }}>
                  <button onClick={handleCustomerSearch} className="sales-search-btn">
                    <Search size={18} />
                    조회
                  </button>
                  <button onClick={openCustFindModal} className="sales-search-btn" style={{ background: 'linear-gradient(135deg, #06b6d4 0%, #0891b2 100%)' }}>
                    <History size={16} />
                    검색이력
                  </button>
                </div>
              </div>
              <div className="sales-grid-container" style={{ flex: '1 1 auto', minHeight: 0 }}>
                <div className="ag-theme-alpine sales-grid" style={{ height: '100%' }}>
                  <AgGridReact
                    rowData={customerSearchResults}
                    columnDefs={customerGridColumns as any}
                    onRowClicked={(event) => event.data && handleCustomerSelect(event.data)}
                    pagination={true}
                    paginationPageSize={100}
                    domLayout="normal"
                    overlayNoRowsTemplate="<span style='padding: 20px; color: #64748b;'>조회된 데이터가 없습니다</span>"
                    localeText={localeText}
                  />
                </div>
              </div>
              {(() => {
                const genderName = (g?: string) => g === 'M' ? '남' : g === 'F' ? '여' : '-';
                const getAvatarSrc = (gender?: string) => {
                  if (gender === 'M') return '/images/avatars/m.png';
                  if (gender === 'F') return '/images/avatars/f1.png';
                  return '/images/avatars/default-avatar.png';
                };
                const sc = selectedCustomer;
                return (
                  <div className="sales-customer-details-grid">
                    <div className="sales-customer-card">
                      <div className="sales-subsection-header basic">
                        <div className="title">기본정보</div>
                        <div className="actions">
                          <button type="button" className="sales-reset-btn" onClick={handleResetAll} title="초기화">
                            <X size={14} />
                            <span style={{ marginLeft: 6, fontSize: 12 }}>초기화</span>
                          </button>
                        </div>
                      </div>
                      <div className="sales-subsection-body">
                        <div className="customer-avatar-row">
                          <img 
                            src={getAvatarSrc(sc?.GENDER_GBN)} 
                            alt="Customer Avatar" 
                            className="customer-avatar"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = '/images/avatars/default-avatar.png';
                            }}
                          />
                        </div>
                        <div className="info-row"><span>고객코드</span><span>{sc?.CUST_ID || '-'}</span></div>
                        <div className="info-row"><span>고객명</span><span>{sc?.CUST_NM || '-'}</span></div>
                        <div className="info-row"><span>성별</span><span>{genderName(sc?.GENDER_GBN)}</span></div>
                        <div className="info-row"><span>생년월일</span><span>{sc?.CUST_BIRTH_D || '-'}</span></div>
                          <div className="info-row"><span>고객구분</span><span>{(sc?.CUST_GBN_NM) || getCustGbnLabel(sc?.CUST_GBN) || sc?.CUST_GBN}</span></div>
                        <div className="info-row"><span>소속매장</span><span>{sc?.AGENT_NM || '-'}</span></div>
                      </div>
                    </div>
                    {/* Hidden fields to keep customer/store codes for save payloads */}
                    <input type="hidden" name="CUST_ID" value={salesHeader?.CUST_ID || ''} />
                    <input type="hidden" name="AGENT_ID" value={salesHeader?.AGENT_ID || ''} />
                    <div className="sales-customer-card">
                      <div className="sales-subsection-header contact">
                        <div className="title">연락/멤버십</div>
                      </div>
                      <div className="sales-subsection-body">
                        <div className="info-row"><span>연락처</span><span>{sc?.C_HP || '-'}</span></div>
                        <div className="info-row"><span>이메일</span><span>{sc?.C_EMAIL || '-'}</span></div>
                        <div className="info-row"><span>마일리지</span><span>{(sc?.MAIL_POINT ?? 0).toLocaleString()}P</span></div>
                      </div>
                    </div>
                  </div>
                );
              })()}
            </div>

            {/* 우측: 상단(구매이력) + 하단(판매등록) */}
            <div className="sales-pane-right">
              <div className="sales-pane-top sales-section-purchase">
                <div className="sales-section-header purchase">
                  <div className="title"><ShoppingCart size={18} /> 구매이력</div>
                  <div className="actions" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <select
                      className="purchase-range-select"
                      value={purchaseRangePreset}
                      onChange={(e) => {
                        const v = e.target.value;
                        if (v === 'custom') {
                          setPurchaseRangePreset('custom');
                        } else {
                          applyRangePreset(v);
                        }
                      }}
                      style={{ height: 28, fontSize: 12 }}
                    >
                      <option value="today">당일</option>
                      <option value="week">일주일</option>
                      <option value="monthThis">당월</option>
                      <option value="1m">1개월</option>
                      <option value="2m">2개월</option>
                      <option value="3m">3개월</option>
                      <option value="6m">6개월</option>
                      <option value="1y">1년</option>
                      <option value="2y">2년</option>
                      <option value="custom">직접입력</option>
                    </select>
                    <input
                      type="date"
                      className="sales-date-input"
                      placeholder="시작일"
                      value={purchaseStartDate}
                      onChange={(e) => setPurchaseStartDate(e.target.value)}
                      style={{ width: 96 }}
                    />
                    <span style={{ fontSize: 12, color: '#64748b' }}>~</span>
                    <input
                      type="date"
                      className="sales-date-input"
                      placeholder="종료일"
                      value={purchaseEndDate}
                      onChange={(e) => setPurchaseEndDate(e.target.value)}
                      style={{ width: 96 }}
                    />
                    <input
                      type="text"
                      className="sales-search-input"
                      placeholder="상품명 및 영수증번호 검색"
                      value={purchaseProductName}
                      onChange={(e) => setPurchaseProductName(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handlePurchaseHistorySearch()}
                      style={{ width: 360, height: 20, fontSize: 10, padding: '4px 8px' }}
                    />
                    <button
                      onClick={handlePurchaseHistorySearch}
                      className="sales-refresh-btn"
                    >
                      <Search size={14} />
                      검색
                    </button>
                  </div>
                </div>
                <div className="sales-grid" style={{ padding: '0 8px', maxHeight: 'calc(100% - 50px)', overflowY: 'auto', position: 'relative' }}>
                  <table className="purchase-table" role="table" ref={unifiedPurchaseTableRef} style={{ width: '100%' }}>
                    <thead style={{ position: 'sticky', top: 0, zIndex: 10 }}>
                      <tr style={{ background: 'linear-gradient(135deg, #667eea 0%, #a7d28eff 100%)' }}>
                        <th style={{ color: '#100f0fff', fontWeight: 600 }}>판매일자</th>
                        <th style={{ color: '#100f0fff', fontWeight: 600 }}>영수증번호</th>
                        <th style={{ color: '#100f0fff', fontWeight: 600 }}>순번</th>
                        <th style={{display: 'none'}}>판매사원코드</th>
                        <th style={{ color: '#100f0fff', fontWeight: 600 }}>판매사원</th>
                        <th style={{ color: '#100f0fff', fontWeight: 600 }}>브랜드</th>
                        <th style={{width: '35%', color: '#100f0fff', fontWeight: 600 }}>상품명</th>
                        <th style={{ color: '#100f0fff', fontWeight: 600 }}>수량</th>
                        <th style={{ color: '#100f0fff', fontWeight: 600 }}>판매금액</th>
                        <th style={{ color: '#100f0fff', fontWeight: 600 }}>마일리지</th>
                        <th style={{ width: 60, color: '#100f0fff', fontWeight: 600, textAlign: 'center' }}>반품</th>
                      </tr>
                    </thead>
                    <tbody>
                      {purchaseHistory.length === 0 ? (
                        <tr className="no-rows"><td colSpan={11}>조회된 데이터가 없습니다</td></tr>
                      ) : (
                        purchaseHistory.map((r: any, idx: number) => {
                          // 마일리지 관련 상품(102, 103)이거나 반품(음수 수량)인 경우 반품 버튼 숨김
                          const goodsId = Number(r.GOODS_ID);
                          const isRefundable = goodsId !== 102 && goodsId !== 103 && Number(r.SALE_QTY) > 0;
                          return (
                          <tr key={idx} className="purchase-row" data-staff-id={r.STAFF_ID ?? ''} onDoubleClick={() => handlePurchaseRowDoubleClick(r)}>
                            <td>{r.SALE_D || '-'}</td>
                            <td>{r.TR_NO || '-'}</td>
                            <td style={{textAlign: 'center'}}>{r.SALE_SEQU ?? '-'}</td>
                            <td style={{display: 'none'}}>{r.STAFF_ID ?? ''}</td>
                            <td>{r.STAFF_NM || '-'}</td>
                            <td>{r.BRAND_NM || '-'}</td>
                            <td className="goods-cell">{r.GOODS_NM || '-'}</td>
                            <td style={{textAlign: 'right'}}>{(r.SALE_QTY ?? 0).toLocaleString()}</td>
                            <td style={{textAlign: 'right'}}>{(r.SALE_AMT ?? 0).toLocaleString()}</td>
                            <td style={{textAlign: 'right'}}>{(r.MAIL_POINT ?? 0).toLocaleString()}</td>
                            <td style={{textAlign: 'center'}}>
                              {isRefundable && (
                                <button
                                  onClick={(e) => { e.stopPropagation(); handleOpenRefundModal(r); }}
                                  className="sales-refund-btn"
                                  style={{
                                    background: 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)',
                                    color: '#fff',
                                    border: 'none',
                                    borderRadius: 4,
                                    padding: '2px 8px',
                                    fontSize: 11,
                                    fontWeight: 600,
                                    cursor: 'pointer'
                                  }}
                                  title="반품처리"
                                >
                                  반품
                                </button>
                              )}
                            </td>
                          </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="sales-pane-bottom sales-section-sales" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                  <div className="sales-section-header sales" style={{ flex: '0 0 auto' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                      <div className="title"><DollarSign size={18} /> 판매등록</div>
                    </div>
                    <div className="actions" style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                      {/* 판매등록 파트의 일자 입력 제거 (요청에 따라 숨김) */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <label style={{ fontSize: 12, color: '#334155' }}>영수증번호</label>
                        <input
                          type="text"
                          className="sales-receipt-input"
                          placeholder="영수증번호"
                          value={receiptNumber}
                          readOnly
                          style={{ width: '36ch', maxWidth: '100%', height: 28, fontSize: 12, padding: '4px 8px', background: '#f8fafc', border: '1px solid #e2e8f0' }}
                        />
                        <label style={{ fontSize: 12, color: '#334155' }}>판매사원</label>
                        <select
                          ref={staffSelectRef}
                          className={`sales-staff-select ${(!salesHeader?.STAFF_ID || Number(salesHeader.STAFF_ID) === 0) ? 'required' : ''}`}
                          value={(salesHeader && salesHeader.STAFF_ID && Number(salesHeader.STAFF_ID) !== 0) ? String(salesHeader.STAFF_ID) : ''}
                          onChange={(e) => dispatch(setSalesHeader({ STAFF_ID: e.target.value ? Number(e.target.value) : 0 }))}
                          style={{ height: 28, fontSize: 12, padding: '2px 8px', minWidth: 120 }}
                        >
                          <option value="">사원선택</option>
                          {staffList.map(s => (
                            <option key={s.STAFF_ID} value={s.STAFF_ID}>{s.STAFF_NM}</option>
                          ))}
                        </select>
                        {/* 상품검색 버튼은 바코드 입력란 오른쪽으로 이동 */}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="sales-barcode-section compact" style={{ flex: '0 0 auto' }}>
                  <div className="sales-barcode-input-group">
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                      <label>바코드/상품명/상품코드</label>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <input
                          type="text"
                          placeholder="바코드를 스캔하거나 상품명,상품코드를 입력하세요"
                          value={barcodeInput}
                          onChange={(e) => setBarcodeInput(e.target.value)}
                          onKeyPress={handleBarcodeInput}
                          className="sales-barcode-input"
                          style={{ flex: 1 }}
                        />
                        <button onClick={handleOpenProductSearch} className="sales-product-search-btn"><Search size={14}/> 상품검색</button>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="sales-items-table-wrapper" style={{ flex: '1 1 auto', width: '100%', minHeight: 0, border: '1px solid #e5e7eb', borderRadius: '4px', overflowY: 'auto' }}>
                  <table className="sales-items-table" style={{ width: '100%', borderCollapse: 'collapse' }} role="table">
                    <thead style={{ position: 'sticky', top: 0, background: '#f1f5f9', zIndex: 1 }}>
                      <tr style={{ background: '#f1f5f9' }}>
                        <th style={{ width: 50, textAlign: 'center' }}>순번</th>
                        <th style={{ width: '40%', textAlign: 'left' }}>상품명</th>
                        <th style={{ width: 110, textAlign: 'center' }}>유통기한</th>
                        <th style={{ width: 70, textAlign: 'right' }}>수량</th>
                        <th style={{ width: 120, textAlign: 'right' }}>단가</th>
                        <th style={{ width: 70, textAlign: 'right' }}>할인율(%)</th>
                        <th style={{ width: 90, textAlign: 'right' }}>할인금액</th>
                        <th style={{ width: 110, textAlign: 'right' }}>판매금액</th>
                        <th style={{ width: 110, textAlign: 'right' }}>마일리지</th>
                        {!isReceiptLoaded && <th style={{ width: 60, textAlign: 'center' }}>삭제</th>}
                      </tr>
                    </thead>
                    <tbody>
                      {salesItems.length === 0 ? (
                        <tr>
                          <td colSpan={10} style={{ padding: 20, color: '#64748b', textAlign: 'center' }}>조회된 데이터가 없습니다</td>
                          </tr>
                      ) : (
                        salesItems.map((item: any, idx: number) => {
                          // 새 아이템은 _tempIndex 사용, 기존 아이템은 SALE_SEQU 사용
                          const itemKey = item.SALE_SEQU ?? item._tempIndex ?? idx;
                          return (
                          <tr key={itemKey} style={{ borderBottom: '1px solid #eef2f7' }}>
                            <td style={{ textAlign: 'center' }}>{item.SALE_SEQU || ''}</td>
                            <td style={{ textAlign: 'left' }} className="goods-cell">
                              <div className="goods-name">{item.GOODS_NM || '-'}</div>
                              <div className="goods-meta">{[item.GOODS_ID || '', item.BAR_CODE, item.BRAND_NM].filter(Boolean).join(' · ')}</div>
                            </td>
                            <td style={{ textAlign: 'center', width: 110 }}>{item.EXP_D ?? item.EXPIRY_D ?? '-'}</td>
                            <td style={{ textAlign: 'right' }}>
                              <input
                                type="number"
                                min={1}
                                value={item.SALE_QTY}
                                onChange={(e) => handleUpdateItemQty(item.SALE_SEQU ?? item._tempIndex, Number(e.target.value) || 0)}
                                style={{ width: 64, textAlign: 'right' }}
                              />
                            </td>
                            <td style={{ textAlign: 'right' }}>{(item.SALE_DANGA ?? 0).toLocaleString()}</td>
                            <td style={{ textAlign: 'right' }}>
                              <input
                                type="number"
                                min={0}
                                max={100}
                                value={item.DISCOUNT_RATE ?? 0}
                                onChange={(e) => handleUpdateItemDiscount(item.SALE_SEQU ?? item._tempIndex, Number(e.target.value) || 0)}
                                style={{ width: 56, textAlign: 'right' }}
                              />
                            </td>
                            <td style={{ textAlign: 'right' }}>
                              <input
                                type="text"
                                value={formatNumber(item.DISCOUNT_AMT ?? 0)}
                                onChange={(e) => handleUpdateItemDiscountAmt(item.SALE_SEQU ?? item._tempIndex, parseIntegerFromString(e.target.value))}
                                style={{ width: 76, textAlign: 'right' }}
                              />
                            </td>
                            <td style={{ textAlign: 'right' }}>{(item.SALE_AMT ?? 0).toLocaleString()}</td>
                            <td style={{ textAlign: 'right' }}>
                              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 6 }}>
                                <span>{(item.MAIL_POINT ?? 0).toLocaleString()}</span>
                                {(() => {
                                  const pAmt = item.P_MAIL_AMT ?? null;
                                  const pPoint = item.P_MAIL_POINT ?? null;
                                  if (pAmt != null && pPoint != null && Number(pAmt) > 0) {
                                    const mult = Math.floor(Number(pPoint) * 1000 / Number(pAmt));
                                    return (
                                      <span style={{ color: '#f59e0b', fontWeight: 700, fontSize: 11, background: '#fffbeb', padding: '2px 6px', borderRadius: 4 }}>
                                        {mult}x
                                      </span>
                                    );
                                  }
                                  return null;
                                })()}
                              </div>
                            </td>
                            {!isReceiptLoaded && (
                              <td style={{ textAlign: 'center' }}>
                                <button onClick={() => handleRemoveItem(item.SALE_SEQU ?? item._tempIndex)} className="sales-delete-btn" style={{ background: 'transparent', border: 0, color: '#ef4444', cursor: 'pointer' }}>삭제</button>
                              </td>
                            )}
                          </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>

                <div className="sales-summary-inline" style={{ flex: '0 0 auto', marginTop: 'auto', paddingTop: 8, borderTop: '1px solid #e5e7eb' }}>
                  <div className="sales-summary-item"><span className="label">총 수량</span><span className="value">{saleSummary.totalQty.toLocaleString()}</span></div>
                  <div className="sales-summary-item"><span className="label">총 금액</span><span className="value">{saleSummary.totalAmt.toLocaleString()}원</span></div>
                  <div className="sales-summary-item discount"><span className="label">할인 금액</span><span className="value">-{saleSummary.discountAmt.toLocaleString()}원</span></div>
                  <div className="sales-summary-item"><span className="label">판매 금액</span><span className="value">{saleSummary.saleAmt.toLocaleString()}원</span></div>
                  <div className="sales-summary-item mileage"><span className="label"><Award size={14} /> 마일리지</span><span className="value">{saleSummary.mileagePoint.toLocaleString()}P</span></div>
                  <div className="sales-summary-sep"></div>
                  <div className="sales-summary-actions">
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <button onClick={handleResetSales} className="sales-payment-btn sales-reset-btn" disabled={salesItems.length === 0 && saleSummary.saleAmt === 0} style={{ marginRight: 8 }} title="전표초기화">
                        <X size={14} /> 전표초기화
                      </button>
                      <button onClick={handlePayment} className="sales-payment-btn" disabled={salesItems.length === 0}>
                        <CreditCard size={16} /> 판매등록
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
        {/* 1. 고객 정보 탭 */}
        {activeTab === 'customer' && (
          <div className="sales-tab-content" style={{ display: 'flex', height: '100%', padding: '20px' }}>
            {/* 고객 상세 정보 - 전체 너비 */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflowY: 'auto', background: '#f8fafc', borderRadius: '12px', padding: '24px' }}>
              {selectedCustomer ? (
                <>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px', paddingBottom: '16px', borderBottom: '2px solid #e2e8f0' }}>
                    <div style={{ 
                      width: '48px', 
                      height: '48px', 
                      borderRadius: '12px', 
                      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#fff',
                      fontSize: '20px',
                      fontWeight: 700,
                      boxShadow: '0 4px 12px rgba(102, 126, 234, 0.4)'
                    }}>
                      <Users size={24} />
                    </div>
                    <div>
                      <h3 style={{ margin: 0, fontSize: '20px', fontWeight: 700, color: '#1e293b' }}>고객 상세 정보</h3>
                      <p style={{ margin: '4px 0 0', fontSize: '13px', color: '#64748b' }}>선택된 고객의 상세정보를 확인하세요</p>
                    </div>
                  </div>

                  {/* 기본 정보 (컴팩트 + 아이콘) */}
                  <div style={{ marginBottom: '16px' }}>
                    <h4 style={{
                      fontSize: '14px', fontWeight: 700, color: '#475569', margin: '0 0 8px 0',
                      paddingLeft: '8px', borderLeft: '3px solid #667eea'
                    }}>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                        <Users size={16} style={{ color: '#667eea' }} /> 기본 정보
                      </span>
                    </h4>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
                      <div style={{ background: '#fff', padding: '10px 12px', borderRadius: 8, border: '1px solid #e2e8f0' }}>
                        <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, fontWeight: 600, color: '#64748b', marginBottom: 4 }}>
                          <Receipt size={14} style={{ color: '#64748b' }} /> 고객코드
                        </label>
                        <span style={{ fontSize: 13, fontWeight: 600, color: '#1e293b' }}>{selectedCustomer.CUST_ID}</span>
                      </div>
                      <div style={{ background: '#fff', padding: '10px 12px', borderRadius: 8, border: '1px solid #e2e8f0' }}>
                        <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, fontWeight: 600, color: '#64748b', marginBottom: 4 }}>
                          <Users size={14} style={{ color: '#6366f1' }} /> 고객명
                        </label>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span style={{ fontSize: 13, fontWeight: 700, color: '#6366f1' }}>{selectedCustomer.CUST_NM}</span>
                          {(selectedCustomer.MAIL_POINT !== undefined && selectedCustomer.MAIL_POINT !== null) && (
                            <span style={{
                              display: 'inline-flex', alignItems: 'center', gap: 4,
                              padding: '2px 8px', fontSize: 11, fontWeight: 600,
                              color: '#fff', background: 'linear-gradient(90deg, #8b5cf6 0%, #7c3aed 100%)',
                              borderRadius: 12
                            }}>
                              <Award size={12} /> {selectedCustomer.MAIL_POINT?.toLocaleString() || 0}P
                            </span>
                          )}
                        </div>
                      </div>
                      <div style={{ background: '#fff', padding: '10px 12px', borderRadius: 8, border: '1px solid #e2e8f0' }}>
                        <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, fontWeight: 600, color: '#64748b', marginBottom: 4 }}>
                          <Tag size={14} style={{ color: '#64748b' }} /> 고객구분
                        </label>
                        <span style={{ fontSize: 13, fontWeight: 600, color: '#1e293b' }}>{selectedCustomer.CUST_GBN_NM || selectedCustomer.CUST_GBN || '-'}</span>
                      </div>
                      <div style={{ background: '#fff', padding: '10px 12px', borderRadius: 8, border: '1px solid #e2e8f0' }}>
                        <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, fontWeight: 600, color: '#64748b', marginBottom: 4 }}>
                          <Users size={14} style={{ color: '#64748b' }} /> 성별
                        </label>
                        <span style={{ fontSize: 13, fontWeight: 600, color: '#1e293b' }}>{selectedCustomer.GENDER_GBN === 'M' ? '남성' : selectedCustomer.GENDER_GBN === 'F' ? '여성' : selectedCustomer.GENDER_GBN || '-'}</span>
                      </div>
                      <div style={{ background: '#fff', padding: '10px 12px', borderRadius: 8, border: '1px solid #e2e8f0' }}>
                        <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, fontWeight: 600, color: '#64748b', marginBottom: 4 }}>
                          <Calendar size={14} style={{ color: '#64748b' }} /> 생년월일
                        </label>
                        <span style={{ fontSize: 13, fontWeight: 600, color: '#1e293b' }}>{selectedCustomer.C_BIRTH || '-'}</span>
                      </div>
                      <div style={{ background: '#fff', padding: '10px 12px', borderRadius: 8, border: '1px solid #e2e8f0' }}>
                        <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, fontWeight: 600, color: '#64748b', marginBottom: 4 }}>
                          <Calendar size={14} style={{ color: '#64748b' }} /> 등록일
                        </label>
                        <span style={{ fontSize: 13, fontWeight: 600, color: '#1e293b' }}>{selectedCustomer.OPEN_D || '-'}</span>
                      </div>
                      <div style={{ background: '#fff', padding: '10px 12px', borderRadius: 8, border: '1px solid #e2e8f0' }}>
                        <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, fontWeight: 600, color: '#64748b', marginBottom: 4 }}>
                          <Globe size={14} style={{ color: '#64748b' }} /> 국가
                        </label>
                        <span style={{ fontSize: 13, fontWeight: 600, color: '#1e293b' }}>{getNationLabel(selectedCustomer.NATION_ID) || '-'}</span>
                      </div>
                      <div style={{ background: '#fff', padding: '10px 12px', borderRadius: 8, border: '1px solid #e2e8f0' }}>
                        <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, fontWeight: 600, color: '#64748b', marginBottom: 4 }}>
                          <Building2 size={14} style={{ color: '#64748b' }} /> 소속 매장
                        </label>
                        <span style={{ fontSize: 13, fontWeight: 600, color: '#1e293b' }}>{selectedCustomer.AGENT_NM || '-'}</span>
                      </div>
                    </div>
                  </div>

                  {/* 연락처 + 주소 (한 줄 카드 구성) */}
                  <div style={{ marginBottom: '16px' }}>
                    <h4 style={{
                      fontSize: '14px', fontWeight: 700, color: '#475569', margin: '0 0 8px 0',
                      paddingLeft: '8px', borderLeft: '3px solid #10b981'
                    }}>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                        연락처 / 주소
                      </span>
                    </h4>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
                      <div style={{ background: '#fff', padding: '10px 12px', borderRadius: 8, border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: 8 }}>
                        <Phone size={16} style={{ color: '#10b981', flexShrink: 0 }} />
                        <div style={{ flex: 1 }}>
                          <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: '#64748b', marginBottom: 4 }}>전화번호</label>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <span style={{ fontSize: 13, fontWeight: 600, color: '#1e293b' }}>{selectedCustomer.C_HP || '-'}</span>
                            {/* SMS 수신 동의 + 핸드폰 번호(01x)인 경우에만 문자보내기 버튼 노출 */}
                            {selectedCustomer.SMS_CHK === 'Y' && 
                             selectedCustomer.C_HP && 
                             /^01[0-9]/.test(selectedCustomer.C_HP.replace(/-/g, '')) && (
                              <button
                                type="button"
                                onClick={() => {
                                  setSmsMessage('');
                                  setIsSmsModalOpen(true);
                                }}
                                style={{
                                  display: 'inline-flex', alignItems: 'center', gap: 4,
                                  padding: '3px 8px', fontSize: 11, fontWeight: 600,
                                  color: '#fff', background: 'linear-gradient(90deg, #10b981 0%, #059669 100%)',
                                  border: 'none', borderRadius: 6, cursor: 'pointer',
                                  boxShadow: '0 1px 3px rgba(16, 185, 129, 0.3)'
                                }}
                                title="문자 보내기"
                              >
                                <MessageSquare size={12} /> 문자
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                      <div style={{ background: '#fff', padding: '10px 12px', borderRadius: 8, border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: 8 }}>
                        <Mail size={16} style={{ color: '#3b82f6', flexShrink: 0 }} />
                        <div style={{ flex: 1 }}>
                          <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: '#64748b', marginBottom: 4 }}>이메일</label>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <span style={{ fontSize: 13, fontWeight: 600, color: '#1e293b', wordBreak: 'break-all' }}>{selectedCustomer.C_EMAIL || '-'}</span>
                            {selectedCustomer.C_EMAIL && (
                              <button
                                type="button"
                                onClick={() => {
                                  navigator.clipboard.writeText(selectedCustomer.C_EMAIL || '');
                                  alert('이메일 주소가 복사되었습니다.');
                                }}
                                style={{
                                  display: 'inline-flex', alignItems: 'center', gap: 4,
                                  padding: '3px 8px', fontSize: 11, fontWeight: 600,
                                  color: '#fff', background: 'linear-gradient(90deg, #3b82f6 0%, #2563eb 100%)',
                                  border: 'none', borderRadius: 6, cursor: 'pointer',
                                  boxShadow: '0 1px 3px rgba(59, 130, 246, 0.3)'
                                }}
                                title="이메일 복사"
                              >
                                <Copy size={12} /> 복사
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                      <div style={{ background: '#fff', padding: '10px 12px', borderRadius: 8, border: '1px solid #e2e8f0', display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                        <MapPin size={16} style={{ color: '#f59e0b', flexShrink: 0, marginTop: 2 }} />
                        <div style={{ flex: 1 }}>
                          <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: '#64748b', marginBottom: 4 }}>주소</label>
                          <span style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#1e293b' }}>{selectedCustomer.C_ADDR1 || '-'}</span>
                          {selectedCustomer.C_ADDR2 && (
                            <span style={{ display: 'block', fontSize: 12, color: '#475569', marginTop: 2 }}>{selectedCustomer.C_ADDR2}</span>
                          )}
                          {selectedCustomer.ZIP_ID && (
                            <span style={{ display: 'inline-block', marginTop: 6, fontSize: 11, color: '#64748b', background: '#f1f5f9', border: '1px solid #e2e8f0', borderRadius: 6, padding: '2px 6px' }}>우편번호: {selectedCustomer.ZIP_ID}</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* 추가 정보 (항상 표시) */}
                  <div style={{ marginBottom: '16px' }}>
                    <h4 style={{
                      fontSize: '14px',
                      fontWeight: 700,
                      color: '#475569',
                      margin: '0 0 8px 0',
                      paddingLeft: '8px',
                      borderLeft: '3px solid #06b6d4'
                    }}>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                        <Heart size={16} style={{ color: '#06b6d4' }} /> 추가 정보
                      </span>
                    </h4>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
                      <div style={{ background: '#fff', padding: '10px 12px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                        <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '11px', fontWeight: 600, color: '#64748b', marginBottom: '4px' }}>
                          <Heart size={14} style={{ color: '#ec4899' }} /> 취미
                        </label>
                        <span style={{ fontSize: '13px', fontWeight: 600, color: '#1e293b', minHeight: 18 }}>{selectedCustomer.CUST_HOBB || '-'}</span>
                      </div>
                      <div style={{ background: '#fff', padding: '10px 12px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                        <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '11px', fontWeight: 600, color: '#64748b', marginBottom: '4px' }}>
                          <Users size={14} style={{ color: '#6366f1' }} /> 담당 직원
                        </label>
                        <span style={{ fontSize: '13px', fontWeight: 600, color: '#1e293b', minHeight: 18 }}>{selectedCustomer.MNG_STAFF || '-'}</span>
                      </div>
                      <div style={{ background: '#fff', padding: '10px 12px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                        <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '11px', fontWeight: 600, color: '#64748b', marginBottom: '4px' }}>
                          <FileText size={14} style={{ color: '#64748b' }} /> 메모
                        </label>
                        <span style={{ fontSize: '13px', fontWeight: 600, color: '#475569', minHeight: 18, display: 'block', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {selectedCustomer.C_REMARK || '-'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* 마케팅 수신 동의 (항상 표시) */}
                  <div style={{ marginBottom: '16px' }}>
                      <h4 style={{ 
                        fontSize: '14px', 
                        fontWeight: 700, 
                        color: '#475569', 
                        margin: '0 0 8px 0',
                        paddingLeft: '8px',
                        borderLeft: '3px solid #10b981'
                      }}>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                          <Megaphone size={16} style={{ color: '#10b981' }} /> 마케팅 수신 동의
                        </span>
                      </h4>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px' }}>
                        {selectedCustomer.EMAIL_CHK && (
                          <div style={{ 
                            background: selectedCustomer.EMAIL_CHK === 'Y' ? '#d1fae5' : '#fee2e2', 
                            padding: '10px 14px', 
                            borderRadius: '8px', 
                            border: `1px solid ${selectedCustomer.EMAIL_CHK === 'Y' ? '#10b981' : '#ef4444'}`,
                            textAlign: 'center'
                          }}>
                            <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: '#64748b', marginBottom: '4px' }}>이메일</label>
                            <span style={{ 
                              fontSize: '12px', 
                              fontWeight: 700, 
                              color: selectedCustomer.EMAIL_CHK === 'Y' ? '#10b981' : '#ef4444' 
                            }}>
                              {selectedCustomer.EMAIL_CHK === 'Y' ? '수신' : '거부'}
                            </span>
                          </div>
                        )}
                        {selectedCustomer.DM_CHK && (
                          <div style={{ 
                            background: selectedCustomer.DM_CHK === 'Y' ? '#d1fae5' : '#fee2e2', 
                            padding: '10px 14px', 
                            borderRadius: '8px', 
                            border: `1px solid ${selectedCustomer.DM_CHK === 'Y' ? '#10b981' : '#ef4444'}`,
                            textAlign: 'center'
                          }}>
                            <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: '#64748b', marginBottom: '4px' }}>DM</label>
                            <span style={{ 
                              fontSize: '12px', 
                              fontWeight: 700, 
                              color: selectedCustomer.DM_CHK === 'Y' ? '#10b981' : '#ef4444' 
                            }}>
                              {selectedCustomer.DM_CHK === 'Y' ? '수신' : '거부'}
                            </span>
                          </div>
                        )}
                        {selectedCustomer.SMS_CHK && (
                          <div style={{ 
                            background: selectedCustomer.SMS_CHK === 'Y' ? '#d1fae5' : '#fee2e2', 
                            padding: '10px 14px', 
                            borderRadius: '8px', 
                            border: `1px solid ${selectedCustomer.SMS_CHK === 'Y' ? '#10b981' : '#ef4444'}`,
                            textAlign: 'center'
                          }}>
                            <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: '#64748b', marginBottom: '4px' }}>SMS</label>
                            <span style={{ 
                              fontSize: '12px', 
                              fontWeight: 700, 
                              color: selectedCustomer.SMS_CHK === 'Y' ? '#10b981' : '#ef4444' 
                            }}>
                              {selectedCustomer.SMS_CHK === 'Y' ? '수신' : '거부'}
                            </span>
                          </div>
                        )}
                        {selectedCustomer.CALL_CHK && (
                          <div style={{ 
                            background: selectedCustomer.CALL_CHK === 'Y' ? '#d1fae5' : '#fee2e2', 
                            padding: '10px 14px', 
                            borderRadius: '8px', 
                            border: `1px solid ${selectedCustomer.CALL_CHK === 'Y' ? '#10b981' : '#ef4444'}`,
                            textAlign: 'center'
                          }}>
                            <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: '#64748b', marginBottom: '4px' }}>전화</label>
                            <span style={{ 
                              fontSize: '12px', 
                              fontWeight: 700, 
                              color: selectedCustomer.CALL_CHK === 'Y' ? '#10b981' : '#ef4444' 
                            }}>
                              {selectedCustomer.CALL_CHK === 'Y' ? '수신' : '거부'}
                            </span>
                          </div>
                        )}
                      </div>
                  </div>

                  {/* 메모 상세 제거: 상단 추가 정보 섹션의 메모 카드만 표시 */}
                </>
              ) : (
                <div style={{ 
                  flex: 1, 
                  display: 'flex', 
                  flexDirection: 'column', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  color: '#94a3b8'
                }}>
                  <Users size={64} style={{ marginBottom: '16px', opacity: 0.3 }} />
                  <p style={{ fontSize: '16px', fontWeight: 600, margin: 0 }}>고객을 선택해주세요</p>
                  <p style={{ fontSize: '13px', margin: '8px 0 0', opacity: 0.7 }}>왼쪽 목록에서 고객을 선택하면 상세정보가 표시됩니다</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* 2. 구매 이력 탭 */}
        {activeTab === 'purchase' && (
          <div className="sales-tab-content">
            {!selectedCustomer ? (
              <div className="sales-empty-state">
                <ShoppingCart size={48} />
                <p>고객을 먼저 선택해주세요</p>
              </div>
            ) : (
              <>
                {/* 구매이력 요약 카드 - 파스텔톤 */}
                <div style={{ 
                  display: 'grid', 
                  gridTemplateColumns: 'repeat(4, 1fr)', 
                  gap: 12, 
                  marginBottom: 16 
                }}>
                  <div style={{
                    background: '#ecfdf5',
                    padding: '12px 16px', borderRadius: 8, color: '#047857',
                    border: '1px solid #a7f3d0'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                      <ShoppingCart size={16} />
                      <span style={{ fontSize: 11, fontWeight: 600 }}>총 구매건수</span>
                    </div>
                    <div style={{ fontSize: 18, fontWeight: 700 }}>{purchaseHistory.length}건</div>
                  </div>
                  <div style={{
                    background: '#eef2ff',
                    padding: '12px 16px', borderRadius: 8, color: '#4338ca',
                    border: '1px solid #c7d2fe'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                      <Package size={16} />
                      <span style={{ fontSize: 11, fontWeight: 600 }}>총 수량</span>
                    </div>
                    <div style={{ fontSize: 18, fontWeight: 700 }}>
                      {purchaseHistory.reduce((sum, item) => sum + (item.SALE_QTY || 0), 0).toLocaleString()}
                    </div>
                  </div>
                  <div style={{
                    background: '#fdf2f8',
                    padding: '12px 16px', borderRadius: 8, color: '#be185d',
                    border: '1px solid #fbcfe8'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                      <DollarSign size={16} />
                      <span style={{ fontSize: 11, fontWeight: 600 }}>총 구매금액</span>
                    </div>
                    <div style={{ fontSize: 18, fontWeight: 700 }}>
                      {purchaseHistory.reduce((sum, item) => sum + (item.SALE_AMT || 0), 0).toLocaleString()}원
                    </div>
                  </div>
                  <div style={{
                    background: '#f5f3ff',
                    padding: '12px 16px', borderRadius: 8, color: '#6d28d9',
                    border: '1px solid #ddd6fe'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                      <Award size={16} />
                      <span style={{ fontSize: 11, fontWeight: 600 }}>적립 마일리지</span>
                    </div>
                    <div style={{ fontSize: 18, fontWeight: 700 }}>
                      {purchaseHistory.reduce((sum, item) => sum + (item.MAIL_POINT || 0), 0).toLocaleString()}P
                    </div>
                  </div>
                </div>

                {/* 헤더 */}
                <div style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  marginBottom: 12, padding: '0 4px'
                }}>
                  <h3 style={{ 
                    margin: 0, fontSize: 16, fontWeight: 700, color: '#1e293b',
                    display: 'flex', alignItems: 'center', gap: 8
                  }}>
                    <ShoppingCart size={18} style={{ color: '#10b981' }} />
                    {selectedCustomer.CUST_NM}님의 구매 이력
                  </h3>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <button
                      onClick={() => selectedCustomer?.CUST_ID && loadCustomerHistory(Number(selectedCustomer.CUST_ID))}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 4,
                        padding: '4px 10px', borderRadius: 6,
                        border: '1px solid #e2e8f0', background: '#fff',
                        color: '#64748b', fontSize: 12, fontWeight: 500,
                        cursor: 'pointer', transition: 'all 0.15s'
                      }}
                      onMouseEnter={(e) => { e.currentTarget.style.background = '#f1f5f9'; e.currentTarget.style.color = '#10b981'; }}
                      onMouseLeave={(e) => { e.currentTarget.style.background = '#fff'; e.currentTarget.style.color = '#64748b'; }}
                      title="새로고침"
                    >
                      <RefreshCw size={14} />
                      <span>새로고침</span>
                    </button>
                    <span style={{
                      background: '#f1f5f9', padding: '4px 12px', borderRadius: 20,
                      fontSize: 13, fontWeight: 600, color: '#64748b'
                    }}>
                      총 {purchaseHistory.length}건
                    </span>
                  </div>
                </div>

                {/* 테이블 */}
                <div style={{ 
                  flex: '1 1 auto', 
                  overflow: 'auto', 
                  border: '1px solid #e2e8f0', 
                  borderRadius: 8,
                  background: '#fff'
                }}>
                  <table style={{ 
                    width: '100%', 
                    borderCollapse: 'collapse', 
                    fontSize: 13,
                    tableLayout: 'fixed'
                  }}>
                    <thead>
                      <tr style={{ 
                        background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)',
                        position: 'sticky',
                        top: 0,
                        zIndex: 1
                      }}>
                        <th style={{ padding: '10px 6px', textAlign: 'center', fontWeight: 700, color: '#475569', borderBottom: '2px solid #e2e8f0', width: '80px' }}>일자</th>
                        <th style={{ padding: '10px 6px', textAlign: 'center', fontWeight: 700, color: '#475569', borderBottom: '2px solid #e2e8f0', width: '130px' }}>영수증번호</th>
                        <th style={{ padding: '10px 6px', textAlign: 'center', fontWeight: 700, color: '#475569', borderBottom: '2px solid #e2e8f0', width: '70px' }}>브랜드</th>
                        <th style={{ padding: '10px 6px', textAlign: 'left', fontWeight: 700, color: '#475569', borderBottom: '2px solid #e2e8f0' }}>상품명</th>
                        <th style={{ padding: '10px 6px', textAlign: 'right', fontWeight: 700, color: '#475569', borderBottom: '2px solid #e2e8f0', width: '50px' }}>수량</th>
                        <th style={{ padding: '10px 6px', textAlign: 'right', fontWeight: 700, color: '#475569', borderBottom: '2px solid #e2e8f0', width: '85px' }}>금액</th>
                        <th style={{ padding: '10px 6px', textAlign: 'right', fontWeight: 700, color: '#475569', borderBottom: '2px solid #e2e8f0', width: '65px' }}>마일리지</th>
                        <th style={{ padding: '10px 6px', textAlign: 'center', fontWeight: 700, color: '#475569', borderBottom: '2px solid #e2e8f0', width: '70px' }}>판매사원</th>
                      </tr>
                    </thead>
                    <tbody>
                      {purchaseHistory.length === 0 ? (
                        <tr>
                          <td colSpan={8} style={{ padding: '40px 20px', textAlign: 'center', color: '#94a3b8', fontStyle: 'italic' }}>
                            조회된 구매 이력이 없습니다
                          </td>
                        </tr>
                      ) : (
                        purchaseHistory.map((row, idx) => (
                          <tr 
                            key={idx} 
                            style={{ background: idx % 2 === 0 ? '#fff' : '#f8fafc', transition: 'background 0.15s' }}
                            onMouseEnter={(e) => e.currentTarget.style.background = '#f0f9ff'}
                            onMouseLeave={(e) => e.currentTarget.style.background = idx % 2 === 0 ? '#fff' : '#f8fafc'}
                          >
                            <td style={{ padding: '6px', textAlign: 'center', borderBottom: '1px solid #f1f5f9', color: '#64748b', fontSize: 11 }}>
                              {row.SALE_D}
                            </td>
                            <td style={{ 
                              padding: '6px', textAlign: 'center', borderBottom: '1px solid #f1f5f9', color: '#475569', fontSize: 10,
                              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'
                            }} title={row.TR_NO}>
                              {row.TR_NO || '-'}
                            </td>
                            <td style={{ 
                              padding: '6px', textAlign: 'center', borderBottom: '1px solid #f1f5f9', color: '#475569', fontSize: 11,
                              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'
                            }} title={row.BRAND_NM}>
                              {row.BRAND_NM || '-'}
                            </td>
                            <td style={{ 
                              padding: '6px', textAlign: 'left', borderBottom: '1px solid #f1f5f9', color: '#1e293b', fontWeight: 500, fontSize: 12,
                              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'
                            }} title={row.GOODS_NM}>
                              {row.GOODS_NM || '-'}
                            </td>
                            <td style={{ padding: '6px', textAlign: 'right', borderBottom: '1px solid #f1f5f9', color: '#475569', fontSize: 12 }}>
                              {(row.SALE_QTY || 0).toLocaleString()}
                            </td>
                            <td style={{ padding: '6px', textAlign: 'right', borderBottom: '1px solid #f1f5f9', color: '#1e293b', fontWeight: 600, fontSize: 12 }}>
                              {(row.SALE_AMT || 0).toLocaleString()}
                            </td>
                            <td style={{ 
                              padding: '6px', textAlign: 'right', borderBottom: '1px solid #f1f5f9', fontWeight: 600, fontSize: 11,
                              color: (row.MAIL_POINT || 0) > 0 ? '#8b5cf6' : (row.MAIL_POINT || 0) < 0 ? '#ef4444' : '#94a3b8'
                            }}>
                              {(row.MAIL_POINT || 0) > 0 
                                ? `+${row.MAIL_POINT?.toLocaleString()}` 
                                : (row.MAIL_POINT || 0) < 0 
                                  ? row.MAIL_POINT?.toLocaleString() 
                                  : '0'}
                            </td>
                            <td style={{ 
                              padding: '6px', textAlign: 'center', borderBottom: '1px solid #f1f5f9', color: '#64748b', fontSize: 11,
                              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'
                            }} title={row.STAFF_NM}>
                              {row.STAFF_NM || '-'}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </div>
        )}

        {/* 3. 상담 이력 탭 */}
        {activeTab === 'consultation' && (
          <div className="sales-tab-content" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
            {!selectedCustomer ? (
              <div className="sales-empty-state">
                <MessageSquare size={48} />
                <p>고객을 먼저 선택해주세요</p>
              </div>
            ) : (
              <>
                {/* 헤더 */}
                <div style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  marginBottom: 12, padding: '0 4px', flexShrink: 0
                }}>
                  <h3 style={{ 
                    margin: 0, fontSize: 16, fontWeight: 700, color: '#1e293b',
                    display: 'flex', alignItems: 'center', gap: 8
                  }}>
                    <MessageSquare size={18} style={{ color: '#f59e0b' }} />
                    {selectedCustomer.CUST_NM}님의 상담 이력
                  </h3>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    {/* 상담유형 필터 */}
                    <select
                      value={consultFilterType}
                      onChange={(e) => { setConsultFilterType(e.target.value); }}
                      style={{
                        padding: '6px 12px', borderRadius: 6, border: '1px solid #e2e8f0',
                        fontSize: 13, background: '#fff'
                      }}
                    >
                      <option value="">전체 유형</option>
                      {consultTypeList.map(t => (
                        <option key={t.CONSULT_TYPE} value={t.CONSULT_TYPE}>{t.CONSULT_TYPE_NM}</option>
                      ))}
                    </select>
                    {/* 상태 필터 */}
                    <select
                      value={consultFilterStatus}
                      onChange={(e) => { setConsultFilterStatus(e.target.value); }}
                      style={{
                        padding: '6px 12px', borderRadius: 6, border: '1px solid #e2e8f0',
                        fontSize: 13, background: '#fff'
                      }}
                    >
                      <option value="">전체 상태</option>
                      {procStatusList.map(s => (
                        <option key={s.PROC_STATUS} value={s.PROC_STATUS}>{s.PROC_STATUS_NM}</option>
                      ))}
                    </select>
                    <button
                      onClick={() => refreshConsultHistory()}
                      style={{
                        padding: '6px 12px', borderRadius: 6, border: '1px solid #e2e8f0',
                        background: '#f8fafc', cursor: 'pointer', fontSize: 13
                      }}
                    >
                      조회
                    </button>
                    <button
                      onClick={() => openConsultModal(false)}
                      style={{
                        padding: '6px 16px', borderRadius: 6, border: 'none',
                        background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                        color: '#fff', fontWeight: 600, cursor: 'pointer',
                        display: 'flex', alignItems: 'center', gap: 4, fontSize: 13
                      }}
                    >
                      <Plus size={16} />
                      상담 추가
                    </button>
                  </div>
                </div>

                {/* 건수 표시 */}
                <div style={{ marginBottom: 8, flexShrink: 0 }}>
                  <span style={{
                    background: '#f1f5f9', padding: '4px 12px', borderRadius: 16,
                    fontSize: 12, fontWeight: 600, color: '#64748b'
                  }}>
                    총 {consultationHistory.length}건
                  </span>
                </div>

                {/* 상담 목록 테이블 */}
                <div style={{ 
                  flex: '1 1 auto', 
                  overflow: 'auto', 
                  border: '1px solid #e2e8f0', 
                  borderRadius: 8,
                  background: '#fff'
                }}>
                  <table style={{ 
                    width: '100%', 
                    borderCollapse: 'collapse', 
                    fontSize: 13,
                    tableLayout: 'fixed'
                  }}>
                    <thead>
                      <tr style={{ 
                        background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)',
                        position: 'sticky',
                        top: 0,
                        zIndex: 1
                      }}>
                        <th style={{ padding: '10px 8px', textAlign: 'center', fontWeight: 700, color: '#475569', borderBottom: '2px solid #e2e8f0', width: '90px' }}>일자</th>
                        <th style={{ padding: '10px 8px', textAlign: 'center', fontWeight: 700, color: '#475569', borderBottom: '2px solid #e2e8f0', width: '80px' }}>유형</th>
                        <th style={{ padding: '10px 8px', textAlign: 'left', fontWeight: 700, color: '#475569', borderBottom: '2px solid #e2e8f0', width: '140px' }}>제목</th>
                        <th style={{ padding: '10px 8px', textAlign: 'left', fontWeight: 700, color: '#475569', borderBottom: '2px solid #e2e8f0' }}>내용</th>
                        <th style={{ padding: '10px 8px', textAlign: 'center', fontWeight: 700, color: '#475569', borderBottom: '2px solid #e2e8f0', width: '80px' }}>상태</th>
                        <th style={{ padding: '10px 8px', textAlign: 'center', fontWeight: 700, color: '#475569', borderBottom: '2px solid #e2e8f0', width: '80px' }}>담당자</th>
                        <th style={{ padding: '10px 8px', textAlign: 'center', fontWeight: 700, color: '#475569', borderBottom: '2px solid #e2e8f0', width: '100px' }}>관리</th>
                      </tr>
                    </thead>
                    <tbody>
                      {consultationHistory.length === 0 ? (
                        <tr>
                          <td colSpan={7} style={{ padding: '40px 20px', textAlign: 'center', color: '#94a3b8', fontStyle: 'italic' }}>
                            등록된 상담 이력이 없습니다
                          </td>
                        </tr>
                      ) : (
                        consultationHistory.map((item: any, idx: number) => {
                          const statusColor = item.PROC_STATUS === 'C' ? '#10b981' : 
                                              item.PROC_STATUS === 'P' ? '#f59e0b' : 
                                              item.PROC_STATUS === 'W' ? '#6b7280' : '#64748b';
                          return (
                            <tr 
                              key={item.CONSULT_ID || idx} 
                              style={{ background: idx % 2 === 0 ? '#fff' : '#f8fafc', transition: 'background 0.15s' }}
                              onMouseEnter={(e) => e.currentTarget.style.background = '#fffbeb'}
                              onMouseLeave={(e) => e.currentTarget.style.background = idx % 2 === 0 ? '#fff' : '#f8fafc'}
                            >
                              <td style={{ padding: '8px', textAlign: 'center', borderBottom: '1px solid #f1f5f9', color: '#64748b', fontSize: 12 }}>
                                {item.CONSULT_D}
                              </td>
                              <td style={{ padding: '8px', textAlign: 'center', borderBottom: '1px solid #f1f5f9' }}>
                                <span style={{
                                  background: '#fef3c7', color: '#d97706', padding: '2px 8px',
                                  borderRadius: 12, fontSize: 11, fontWeight: 600
                                }}>
                                  {item.CONSULT_TYPE_NM || item.CONSULT_TYPE || '-'}
                                </span>
                              </td>
                              <td style={{ 
                                padding: '8px', textAlign: 'left', borderBottom: '1px solid #f1f5f9',
                                color: '#1e293b', fontWeight: 500,
                                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'
                              }} title={item.CONSULT_TITLE}>
                                {item.CONSULT_TITLE || '-'}
                              </td>
                              <td style={{ 
                                padding: '8px', textAlign: 'left', borderBottom: '1px solid #f1f5f9',
                                verticalAlign: 'top'
                              }}>
                                {/* 상담내용 */}
                                <div style={{ 
                                  color: '#475569', fontSize: 12,
                                  overflow: 'hidden', textOverflow: 'ellipsis', 
                                  display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical'
                                }} title={item.CONSULT_CONTENT}>
                                  {item.CONSULT_CONTENT || '-'}
                                </div>
                                {/* 처리내용 (답글 형태) */}
                                {item.PROC_CONTENT && (
                                  <div style={{ 
                                    marginTop: 6, paddingLeft: 10, borderLeft: '3px solid #3b82f6',
                                    background: '#eff6ff', padding: '6px 8px 6px 10px', borderRadius: '0 4px 4px 0',
                                    fontSize: 11
                                  }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 2 }}>
                                      <span style={{ color: '#3b82f6', fontWeight: 600 }}>↳ 처리내용</span>
                                      {item.PROC_D && <span style={{ color: '#94a3b8', fontSize: 10 }}>({item.PROC_D})</span>}
                                      {item.PROC_STAFF_NM && <span style={{ color: '#64748b', fontSize: 10 }}>- {item.PROC_STAFF_NM}</span>}
                                    </div>
                                    <div style={{ 
                                      color: '#1e40af', 
                                      overflow: 'hidden', textOverflow: 'ellipsis',
                                      display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical'
                                    }} title={item.PROC_CONTENT}>
                                      {item.PROC_CONTENT}
                                    </div>
                                  </div>
                                )}
                              </td>
                              <td style={{ padding: '8px', textAlign: 'center', borderBottom: '1px solid #f1f5f9' }}>
                                <span style={{
                                  background: `${statusColor}20`, color: statusColor, padding: '2px 8px',
                                  borderRadius: 12, fontSize: 11, fontWeight: 600
                                }}>
                                  {item.PROC_STATUS_NM || item.PROC_STATUS || '-'}
                                </span>
                              </td>
                              <td style={{ padding: '8px', textAlign: 'center', borderBottom: '1px solid #f1f5f9', color: '#64748b', fontSize: 12 }}>
                                {item.STAFF_NM || '-'}
                              </td>
                              <td style={{ padding: '8px', textAlign: 'center', borderBottom: '1px solid #f1f5f9' }}>
                                {item.PROC_STATUS === 'C' ? (
                                  <span style={{ fontSize: 11, color: '#94a3b8', fontStyle: 'italic' }}>완료됨</span>
                                ) : (
                                  <div style={{ display: 'flex', gap: 4, justifyContent: 'center' }}>
                                    <button
                                      onClick={() => openConsultModal(true, item)}
                                      style={{
                                        padding: '4px 8px', borderRadius: 4, border: '1px solid #e2e8f0',
                                        background: '#fff', cursor: 'pointer', fontSize: 11, color: '#475569'
                                      }}
                                      title="수정"
                                    >
                                      수정
                                    </button>
                                    <button
                                      onClick={() => openProcessModal(item)}
                                      style={{
                                        padding: '4px 8px', borderRadius: 4, border: 'none',
                                        background: '#3b82f6', color: '#fff', cursor: 'pointer', fontSize: 11
                                      }}
                                      title="처리결과 입력"
                                    >
                                      처리
                                    </button>
                                    <button
                                      onClick={() => handleDeleteConsult(item.CONSULT_ID)}
                                      style={{
                                        padding: '4px 8px', borderRadius: 4, border: 'none',
                                        background: '#ef4444', color: '#fff', cursor: 'pointer', fontSize: 11
                                      }}
                                      title="삭제"
                                    >
                                      삭제
                                    </button>
                                  </div>
                                )}
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </div>
        )}

        {/* 상담 등록/수정 모달 */}
        {isConsultModalOpen && (
          <div style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center',
            zIndex: 1000
          }}>
            <div style={{
              background: '#fff', borderRadius: 12, width: 500, maxHeight: '80vh',
              boxShadow: '0 20px 40px rgba(0,0,0,0.3)', overflow: 'hidden'
            }}>
              {/* 모달 헤더 */}
              <div style={{
                padding: '16px 20px', background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'space-between'
              }}>
                <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700 }}>
                  {isConsultEditMode ? '상담 수정' : '상담 등록'}
                </h3>
                <button onClick={() => setIsConsultModalOpen(false)} style={{
                  background: 'rgba(255,255,255,0.2)', border: 'none', borderRadius: '50%',
                  width: 28, height: 28, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}>
                  <X size={16} color="#fff" />
                </button>
              </div>

              {/* 모달 본문 */}
              <div style={{ padding: 20, maxHeight: 'calc(80vh - 120px)', overflow: 'auto' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  {/* 상담일자 */}
                  <div>
                    <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#475569', marginBottom: 6 }}>
                      상담일자
                    </label>
                    <input
                      type="date"
                      value={consultFormData.CONSULT_D}
                      onChange={(e) => setConsultFormData(prev => ({ ...prev, CONSULT_D: e.target.value }))}
                      style={{
                        width: '100%', padding: '10px 12px', borderRadius: 6,
                        border: '1px solid #e2e8f0', fontSize: 14
                      }}
                    />
                  </div>

                  {/* 상담유형 */}
                  <div>
                    <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#475569', marginBottom: 6 }}>
                      상담유형 <span style={{ color: '#ef4444' }}>*</span>
                    </label>
                    <select
                      value={consultFormData.CONSULT_TYPE}
                      onChange={(e) => setConsultFormData(prev => ({ ...prev, CONSULT_TYPE: e.target.value }))}
                      style={{
                        width: '100%', padding: '10px 12px', borderRadius: 6,
                        border: '1px solid #e2e8f0', fontSize: 14
                      }}
                    >
                      <option value="">선택하세요</option>
                      {consultTypeList.map(t => (
                        <option key={t.CONSULT_TYPE} value={t.CONSULT_TYPE}>{t.CONSULT_TYPE_NM}</option>
                      ))}
                    </select>
                  </div>

                  {/* 제목 */}
                  <div>
                    <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#475569', marginBottom: 6 }}>
                      제목
                    </label>
                    <input
                      type="text"
                      value={consultFormData.CONSULT_TITLE}
                      onChange={(e) => setConsultFormData(prev => ({ ...prev, CONSULT_TITLE: e.target.value }))}
                      placeholder="상담 제목을 입력하세요"
                      style={{
                        width: '100%', padding: '10px 12px', borderRadius: 6,
                        border: '1px solid #e2e8f0', fontSize: 14
                      }}
                    />
                  </div>

                  {/* 상담내용 */}
                  <div>
                    <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#475569', marginBottom: 6 }}>
                      상담내용 <span style={{ color: '#ef4444' }}>*</span>
                    </label>
                    <textarea
                      value={consultFormData.CONSULT_CONTENT}
                      onChange={(e) => setConsultFormData(prev => ({ ...prev, CONSULT_CONTENT: e.target.value }))}
                      placeholder="상담 내용을 입력하세요"
                      rows={5}
                      style={{
                        width: '100%', padding: '10px 12px', borderRadius: 6,
                        border: '1px solid #e2e8f0', fontSize: 14, resize: 'vertical'
                      }}
                    />
                  </div>

                  {/* 관련 영수증번호 */}
                  <div>
                    <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#475569', marginBottom: 6 }}>
                      관련 영수증번호
                    </label>
                    <input
                      type="text"
                      value={consultFormData.REL_TR_NO}
                      onChange={(e) => setConsultFormData(prev => ({ ...prev, REL_TR_NO: e.target.value }))}
                      placeholder="관련 영수증번호 (선택)"
                      style={{
                        width: '100%', padding: '10px 12px', borderRadius: 6,
                        border: '1px solid #e2e8f0', fontSize: 14
                      }}
                    />
                  </div>

                  {/* 수정 모드일 때 처리내용 표시 */}
                  {isConsultEditMode && consultFormData.PROC_CONTENT && (
                    <div>
                      <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#475569', marginBottom: 6 }}>
                        처리내용
                      </label>
                      <div style={{
                        padding: '10px 12px', borderRadius: 6, background: '#f8fafc',
                        border: '1px solid #e2e8f0', fontSize: 13, color: '#64748b'
                      }}>
                        {consultFormData.PROC_CONTENT}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* 모달 푸터 */}
              <div style={{
                padding: '12px 20px', borderTop: '1px solid #e2e8f0',
                display: 'flex', justifyContent: 'flex-end', gap: 8
              }}>
                <button
                  onClick={() => setIsConsultModalOpen(false)}
                  style={{
                    padding: '8px 20px', borderRadius: 6, border: '1px solid #e2e8f0',
                    background: '#fff', cursor: 'pointer', fontSize: 14, color: '#64748b'
                  }}
                >
                  취소
                </button>
                <button
                  onClick={handleSaveConsult}
                  style={{
                    padding: '8px 20px', borderRadius: 6, border: 'none',
                    background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                    color: '#fff', fontWeight: 600, cursor: 'pointer', fontSize: 14
                  }}
                >
                  {isConsultEditMode ? '수정' : '등록'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 상담 처리결과 입력 모달 */}
        {isProcessModalOpen && (
          <div style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center',
            zIndex: 1000
          }}>
            <div style={{
              background: '#fff', borderRadius: 12, width: 450, maxHeight: '70vh',
              boxShadow: '0 20px 40px rgba(0,0,0,0.3)', overflow: 'hidden'
            }}>
              {/* 모달 헤더 */}
              <div style={{
                padding: '16px 20px', background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'space-between'
              }}>
                <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700 }}>
                  처리결과 입력
                </h3>
                <button onClick={() => setIsProcessModalOpen(false)} style={{
                  background: 'rgba(255,255,255,0.2)', border: 'none', borderRadius: '50%',
                  width: 28, height: 28, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}>
                  <X size={16} color="#fff" />
                </button>
              </div>

              {/* 모달 본문 */}
              <div style={{ padding: 20, maxHeight: 'calc(70vh - 120px)', overflow: 'auto' }}>
                {/* 상담 정보 표시 (읽기 전용) */}
                <div style={{ 
                  marginBottom: 16, padding: 12, background: '#f8fafc', 
                  borderRadius: 8, border: '1px solid #e2e8f0'
                }}>
                  <div style={{ display: 'flex', gap: 12, marginBottom: 8 }}>
                    <div>
                      <span style={{ fontSize: 11, color: '#94a3b8' }}>상담일자</span>
                      <div style={{ fontSize: 13, color: '#1e293b', fontWeight: 500 }}>{processFormData.CONSULT_D || '-'}</div>
                    </div>
                    <div>
                      <span style={{ fontSize: 11, color: '#94a3b8' }}>상담유형</span>
                      <div style={{ fontSize: 13, color: '#1e293b', fontWeight: 500 }}>{processFormData.CONSULT_TYPE_NM || '-'}</div>
                    </div>
                  </div>
                  {processFormData.CONSULT_TITLE && (
                    <div style={{ marginBottom: 8 }}>
                      <span style={{ fontSize: 11, color: '#94a3b8' }}>제목</span>
                      <div style={{ fontSize: 13, color: '#1e293b', fontWeight: 500 }}>{processFormData.CONSULT_TITLE}</div>
                    </div>
                  )}
                  <div>
                    <span style={{ fontSize: 11, color: '#94a3b8' }}>상담내용</span>
                    <div style={{ 
                      fontSize: 13, color: '#475569', marginTop: 4,
                      padding: '8px 10px', background: '#fff', borderRadius: 4,
                      border: '1px solid #e2e8f0', whiteSpace: 'pre-wrap',
                      maxHeight: 100, overflow: 'auto'
                    }}>
                      {processFormData.CONSULT_CONTENT || '(내용 없음)'}
                    </div>
                  </div>
                </div>

                {/* 처리상태 */}
                <div style={{ marginBottom: 16 }}>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#475569', marginBottom: 6 }}>
                    처리상태 <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <select
                    value={processFormData.PROC_STATUS}
                    onChange={(e) => setProcessFormData(prev => ({ ...prev, PROC_STATUS: e.target.value }))}
                    style={{
                      width: '100%', padding: '10px 12px', borderRadius: 6,
                      border: '1px solid #e2e8f0', fontSize: 14
                    }}
                  >
                    <option value="">선택하세요</option>
                    {procStatusList.map(s => (
                      <option key={s.PROC_STATUS} value={s.PROC_STATUS}>{s.PROC_STATUS_NM}</option>
                    ))}
                  </select>
                </div>

                {/* 처리내용 */}
                <div>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#475569', marginBottom: 6 }}>
                    처리내용
                  </label>
                  <textarea
                    value={processFormData.PROC_CONTENT}
                    onChange={(e) => setProcessFormData(prev => ({ ...prev, PROC_CONTENT: e.target.value }))}
                    placeholder="처리 내용을 입력하세요"
                    rows={5}
                    style={{
                      width: '100%', padding: '10px 12px', borderRadius: 6,
                      border: '1px solid #e2e8f0', fontSize: 14, resize: 'vertical'
                    }}
                  />
                </div>
              </div>

              {/* 모달 푸터 */}
              <div style={{
                padding: '12px 20px', borderTop: '1px solid #e2e8f0',
                display: 'flex', justifyContent: 'flex-end', gap: 8
              }}>
                <button
                  onClick={() => setIsProcessModalOpen(false)}
                  style={{
                    padding: '8px 20px', borderRadius: 6, border: '1px solid #e2e8f0',
                    background: '#fff', cursor: 'pointer', fontSize: 14, color: '#64748b'
                  }}
                >
                  취소
                </button>
                <button
                  onClick={handleSaveProcess}
                  style={{
                    padding: '8px 20px', borderRadius: 6, border: 'none',
                    background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                    color: '#fff', fontWeight: 600, cursor: 'pointer', fontSize: 14
                  }}
                >
                  저장
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 판매등록 탭(독립 탭)은 제거되었습니다. 통합화면에서 판매등록 기능을 사용하세요. */}

        {/* 6. 마일리지 탭 */}
        {activeTab === 'mileage' && (
          <div className="sales-tab-content" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
            {!selectedCustomer ? (
              <div className="sales-empty-state">
                <Award size={48} />
                <p>고객을 먼저 선택해주세요</p>
              </div>
            ) : (
              <>
                {/* 마일리지 요약 카드 - 파스텔톤 */}
                <div style={{ 
                  display: 'flex', 
                  gap: 12, 
                  marginBottom: 16,
                  flexShrink: 0
                }}>
                  <div style={{
                    background: '#f5f3ff',
                    padding: '12px 16px', borderRadius: 8, color: '#6d28d9',
                    border: '1px solid #ddd6fe',
                    display: 'flex', alignItems: 'center', gap: 10,
                    flex: 1
                  }}>
                    <div style={{ 
                      width: 32, height: 32, borderRadius: '50%', 
                      background: '#ede9fe', 
                      display: 'flex', alignItems: 'center', justifyContent: 'center'
                    }}>
                      <Award size={16} />
                    </div>
                    <div>
                      <div style={{ fontSize: 10, fontWeight: 600, color: '#7c3aed' }}>현재 마일리지</div>
                      <div style={{ fontSize: 16, fontWeight: 700 }}>
                        {((selectedCustomer as any).MAIL_P ?? selectedCustomer.MAIL_POINT)?.toLocaleString() || 0}
                        <span style={{ fontSize: 11, fontWeight: 600, marginLeft: 2 }}>P</span>
                      </div>
                    </div>
                  </div>
                  <div style={{
                    background: '#ecfdf5',
                    padding: '12px 16px', borderRadius: 8, color: '#047857',
                    border: '1px solid #a7f3d0',
                    display: 'flex', alignItems: 'center', gap: 10,
                    flex: 1
                  }}>
                    <div style={{ 
                      width: 32, height: 32, borderRadius: '50%', 
                      background: '#d1fae5', 
                      display: 'flex', alignItems: 'center', justifyContent: 'center'
                    }}>
                      <TrendingUp size={16} />
                    </div>
                    <div>
                      <div style={{ fontSize: 10, fontWeight: 600, color: '#059669' }}>적립 합계</div>
                      <div style={{ fontSize: 16, fontWeight: 700 }}>
                        +{mileageHistory.filter(r => (r.SALE_AMT || 0) > 0).reduce((sum, r) => sum + (r.SALE_AMT || 0), 0).toLocaleString()}
                        <span style={{ fontSize: 11, fontWeight: 600, marginLeft: 2 }}>P</span>
                      </div>
                    </div>
                  </div>
                  <div style={{
                    background: '#fef2f2',
                    padding: '12px 16px', borderRadius: 8, color: '#b91c1c',
                    border: '1px solid #fecaca',
                    display: 'flex', alignItems: 'center', gap: 10,
                    flex: 1
                  }}>
                    <div style={{ 
                      width: 32, height: 32, borderRadius: '50%', 
                      background: '#fee2e2', 
                      display: 'flex', alignItems: 'center', justifyContent: 'center'
                    }}>
                      <Gift size={16} />
                    </div>
                    <div>
                      <div style={{ fontSize: 10, fontWeight: 600, color: '#dc2626' }}>사용 합계</div>
                      <div style={{ fontSize: 16, fontWeight: 700 }}>
                        {mileageHistory.filter(r => (r.SALE_AMT || 0) < 0).reduce((sum, r) => sum + Math.abs(r.SALE_AMT || 0), 0).toLocaleString()}
                        <span style={{ fontSize: 11, fontWeight: 600, marginLeft: 2 }}>P</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 헤더 */}
                <div style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  marginBottom: 8, padding: '0 4px',
                  flexShrink: 0
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <h3 style={{ 
                      margin: 0, fontSize: 15, fontWeight: 700, color: '#1e293b',
                      display: 'flex', alignItems: 'center', gap: 8
                    }}>
                      <Award size={18} style={{ color: '#8b5cf6' }} />
                      마일리지 내역
                    </h3>
                    <button
                      onClick={() => selectedCustomer?.CUST_ID && loadCustomerHistory(Number(selectedCustomer.CUST_ID))}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 4,
                        padding: '4px 10px', borderRadius: 6,
                        border: '1px solid #e2e8f0', background: '#fff',
                        color: '#64748b', fontSize: 12, fontWeight: 500,
                        cursor: 'pointer', transition: 'all 0.15s'
                      }}
                      onMouseEnter={(e) => { e.currentTarget.style.background = '#f1f5f9'; e.currentTarget.style.color = '#8b5cf6'; }}
                      onMouseLeave={(e) => { e.currentTarget.style.background = '#fff'; e.currentTarget.style.color = '#64748b'; }}
                      title="새로고침"
                    >
                      <RefreshCw size={14} />
                      <span>새로고침</span>
                    </button>
                  </div>
                  <span style={{
                    background: '#f1f5f9', padding: '4px 12px', borderRadius: 20,
                    fontSize: 12, fontWeight: 600, color: '#64748b'
                  }}>
                    총 {mileageHistory.length}건
                  </span>
                </div>

                {/* 테이블 */}
                <div style={{ 
                  flex: '1 1 auto', 
                  overflow: 'auto', 
                  border: '1px solid #e2e8f0', 
                  borderRadius: 8,
                  background: '#fff'
                }}>
                  <table style={{ 
                    width: '100%', 
                    borderCollapse: 'collapse', 
                    fontSize: 13,
                    tableLayout: 'fixed'
                  }}>
                    <thead>
                      <tr style={{ 
                        background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)',
                        position: 'sticky',
                        top: 0,
                        zIndex: 1
                      }}>
                        <th style={{ 
                          padding: '10px 8px', 
                          textAlign: 'center', 
                          fontWeight: 700, 
                          color: '#475569',
                          borderBottom: '2px solid #e2e8f0',
                          width: '90px'
                        }}>일자</th>
                        <th style={{ 
                          padding: '10px 8px', 
                          textAlign: 'center', 
                          fontWeight: 700, 
                          color: '#475569',
                          borderBottom: '2px solid #e2e8f0',
                          width: '90px'
                        }}>매장</th>
                        <th style={{ 
                          padding: '10px 8px', 
                          textAlign: 'left', 
                          fontWeight: 700, 
                          color: '#475569',
                          borderBottom: '2px solid #e2e8f0'
                        }}>상품/내역</th>
                        <th style={{ 
                          padding: '10px 8px', 
                          textAlign: 'right', 
                          fontWeight: 700, 
                          color: '#475569',
                          borderBottom: '2px solid #e2e8f0',
                          width: '70px'
                        }}>수량</th>
                        <th style={{ 
                          padding: '10px 8px', 
                          textAlign: 'right', 
                          fontWeight: 700, 
                          color: '#475569',
                          borderBottom: '2px solid #e2e8f0',
                          width: '90px'
                        }}>마일리지</th>
                        <th style={{ 
                          padding: '10px 8px', 
                          textAlign: 'right', 
                          fontWeight: 700, 
                          color: '#475569',
                          borderBottom: '2px solid #e2e8f0',
                          width: '90px'
                        }}>누적</th>
                      </tr>
                    </thead>
                    <tbody>
                      {mileageHistory.length === 0 ? (
                        <tr>
                          <td colSpan={6} style={{ 
                            padding: '40px 20px', 
                            textAlign: 'center', 
                            color: '#94a3b8',
                            fontStyle: 'italic'
                          }}>
                            조회된 마일리지 내역이 없습니다
                          </td>
                        </tr>
                      ) : (
                        mileageHistory.map((row, idx) => {
                          // 누적 계산
                          const cumulative = mileageHistory
                            .slice(0, idx + 1)
                            .reduce((sum, r) => sum + (r.BASE_MAIL || 0) + (r.SALE_AMT || 0), 0);
                          const isPositive = (row.SALE_AMT || 0) > 0;
                          const isNegative = (row.SALE_AMT || 0) < 0;
                          const isCarryOver = row.GOODS_NM === '이월';
                          
                          return (
                            <tr 
                              key={idx} 
                              style={{ 
                                background: isCarryOver ? '#fef3c7' : idx % 2 === 0 ? '#fff' : '#f8fafc',
                                transition: 'background 0.15s'
                              }}
                              onMouseEnter={(e) => e.currentTarget.style.background = '#f0f9ff'}
                              onMouseLeave={(e) => e.currentTarget.style.background = isCarryOver ? '#fef3c7' : idx % 2 === 0 ? '#fff' : '#f8fafc'}
                            >
                              <td style={{ 
                                padding: '8px', 
                                textAlign: 'center',
                                borderBottom: '1px solid #f1f5f9',
                                color: '#64748b',
                                fontSize: 12
                              }}>
                                {row.SALE_D}
                              </td>
                              <td style={{ 
                                padding: '8px', 
                                textAlign: 'center',
                                borderBottom: '1px solid #f1f5f9',
                                color: '#475569',
                                fontSize: 12
                              }}>
                                {row.AGENT_NM || '-'}
                              </td>
                              <td style={{ 
                                padding: '8px', 
                                textAlign: 'left',
                                borderBottom: '1px solid #f1f5f9',
                                color: '#1e293b',
                                fontWeight: isCarryOver ? 600 : 500,
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap'
                              }} title={row.GOODS_NM}>
                                {row.GOODS_NM || '-'}
                              </td>
                              <td style={{ 
                                padding: '8px', 
                                textAlign: 'right',
                                borderBottom: '1px solid #f1f5f9',
                                color: '#475569'
                              }}>
                                {(row.SALE_QTY || 0) > 0 ? row.SALE_QTY?.toLocaleString() : '-'}
                              </td>
                              <td style={{ 
                                padding: '8px', 
                                textAlign: 'right',
                                borderBottom: '1px solid #f1f5f9',
                                fontWeight: 700,
                                color: isCarryOver ? '#d97706' : isPositive ? '#059669' : isNegative ? '#dc2626' : '#475569'
                              }}>
                                {isCarryOver ? (
                                  <span style={{ 
                                    background: '#fef3c7', 
                                    padding: '2px 6px', 
                                    borderRadius: 4,
                                    fontSize: 12
                                  }}>
                                    {(row.BASE_MAIL || 0).toLocaleString()}
                                  </span>
                                ) : (
                                  <span>
                                    {isPositive ? '+' : ''}{(row.SALE_AMT || 0).toLocaleString()}
                                  </span>
                                )}
                              </td>
                              <td style={{ 
                                padding: '8px', 
                                textAlign: 'right',
                                borderBottom: '1px solid #f1f5f9',
                                fontWeight: 700,
                                color: cumulative >= 0 ? '#0ea5e9' : '#dc2626'
                              }}>
                                {cumulative.toLocaleString()}
                                <span style={{ fontSize: 10, marginLeft: 1, opacity: 0.7 }}>P</span>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </div>
        )}

        {/* 7. 당일 판매 현황 탭 */}
        {activeTab === 'daily' && (
          <div className="sales-tab-content">
            <div className="sales-daily-header">
              <h3>당일 판매 현황</h3>
              <button onClick={loadDailySales} className="sales-refresh-btn">
                <BarChart3 size={18} />
                새로고침
              </button>
            </div>
            
            {/* 요약 카드 - 파스텔톤 */}
            <div style={{ 
              display: 'flex', 
              gap: 12, 
              marginBottom: 16
            }}>
              <div style={{
                background: '#eff6ff',
                padding: '12px 16px', borderRadius: 8, color: '#1d4ed8',
                border: '1px solid #bfdbfe',
                display: 'flex', alignItems: 'center', gap: 10,
                flex: 1
              }}>
                <div style={{ 
                  width: 32, height: 32, borderRadius: '50%', 
                  background: '#dbeafe', 
                  display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}>
                  <Users size={16} />
                </div>
                <div>
                  <div style={{ fontSize: 10, fontWeight: 600, color: '#2563eb' }}>전체 고객수</div>
                  <div style={{ fontSize: 16, fontWeight: 700 }}>
                    {dailySalesStatus.reduce((sum, item) => sum + item.TOT_CUST_CNT, 0).toLocaleString()}
                    <span style={{ fontSize: 11, fontWeight: 600, marginLeft: 2 }}>명</span>
                  </div>
                </div>
              </div>
              <div style={{
                background: '#ecfdf5',
                padding: '12px 16px', borderRadius: 8, color: '#047857',
                border: '1px solid #a7f3d0',
                display: 'flex', alignItems: 'center', gap: 10,
                flex: 1
              }}>
                <div style={{ 
                  width: 32, height: 32, borderRadius: '50%', 
                  background: '#d1fae5', 
                  display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}>
                  <ShoppingCart size={16} />
                </div>
                <div>
                  <div style={{ fontSize: 10, fontWeight: 600, color: '#059669' }}>구매 고객수</div>
                  <div style={{ fontSize: 16, fontWeight: 700 }}>
                    {dailySalesStatus.reduce((sum, item) => sum + item.SALE_CUST_CNT, 0).toLocaleString()}
                    <span style={{ fontSize: 11, fontWeight: 600, marginLeft: 2 }}>명</span>
                  </div>
                </div>
              </div>
              <div style={{
                background: '#eef2ff',
                padding: '12px 16px', borderRadius: 8, color: '#4338ca',
                border: '1px solid #c7d2fe',
                display: 'flex', alignItems: 'center', gap: 10,
                flex: 1
              }}>
                <div style={{ 
                  width: 32, height: 32, borderRadius: '50%', 
                  background: '#e0e7ff', 
                  display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}>
                  <Package size={16} />
                </div>
                <div>
                  <div style={{ fontSize: 10, fontWeight: 600, color: '#4f46e5' }}>총 판매수량</div>
                  <div style={{ fontSize: 16, fontWeight: 700 }}>
                    {dailySalesStatus.reduce((sum, item) => sum + item.SALE_QTY, 0).toLocaleString()}
                    <span style={{ fontSize: 11, fontWeight: 600, marginLeft: 2 }}>개</span>
                  </div>
                </div>
              </div>
              <div style={{
                background: '#fdf2f8',
                padding: '12px 16px', borderRadius: 8, color: '#be185d',
                border: '1px solid #fbcfe8',
                display: 'flex', alignItems: 'center', gap: 10,
                flex: 1
              }}>
                <div style={{ 
                  width: 32, height: 32, borderRadius: '50%', 
                  background: '#fce7f3', 
                  display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}>
                  <DollarSign size={16} />
                </div>
                <div>
                  <div style={{ fontSize: 10, fontWeight: 600, color: '#db2777' }}>총 판매금액</div>
                  <div style={{ fontSize: 16, fontWeight: 700 }}>
                    {dailySalesStatus.reduce((sum, item) => sum + item.SALE_AMT, 0).toLocaleString()}
                    <span style={{ fontSize: 11, fontWeight: 600, marginLeft: 2 }}>원</span>
                  </div>
                </div>
              </div>
            </div>

            {/* 사원별 현황 테이블 */}
            {dailySalesStatus.length === 0 ? (
              <div className="sales-empty-state">
                <BarChart3 size={48} />
                <p>조회된 데이터가 없습니다</p>
              </div>
            ) : (
              <div className="sales-table-container">
                <table className="sales-daily-table">
                  <thead>
                    <tr>
                      <th style={{ width: '60px' }}>No</th>
                      <th style={{ width: '100px' }}>사원코드</th>
                      <th style={{ width: '100px' }}>사원명</th>
                      <th style={{ width: '100px', textAlign: 'right' }}>전체고객</th>
                      <th style={{ width: '100px', textAlign: 'right' }}>구매고객</th>
                      <th style={{ width: '100px', textAlign: 'right' }}>판매수량</th>
                      <th style={{ width: '120px', textAlign: 'right' }}>판매금액</th>
                      <th style={{ width: '100px', textAlign: 'right' }}>객단가</th>
                      <th style={{ width: '80px', textAlign: 'right' }}>IPT</th>
                    </tr>
                  </thead>
                  <tbody>
                    {dailySalesStatus.map((item, idx) => (
                      <tr key={item.STAFF_ID || idx}>
                        <td style={{ textAlign: 'center' }}>{idx + 1}</td>
                        <td style={{ textAlign: 'center' }}>{item.STAFF_ID}</td>
                        <td style={{ textAlign: 'center' }}>{item.STAFF_NM}</td>
                        <td style={{ textAlign: 'right' }}>{item.TOT_CUST_CNT.toLocaleString()}</td>
                        <td style={{ textAlign: 'right' }}>{item.SALE_CUST_CNT.toLocaleString()}</td>
                        <td style={{ textAlign: 'right' }}>{item.SALE_QTY.toLocaleString()}</td>
                        <td style={{ textAlign: 'right' }}>{item.SALE_AMT.toLocaleString()}</td>
                        <td style={{ textAlign: 'right' }}>{item.AUS.toLocaleString()}</td>
                        <td style={{ textAlign: 'right' }}>{item.IPT.toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="sales-daily-total-row">
                      <td colSpan={3} style={{ textAlign: 'center', fontWeight: 'bold' }}>합계</td>
                      <td style={{ textAlign: 'right', fontWeight: 'bold' }}>
                        {dailySalesStatus.reduce((sum, item) => sum + item.TOT_CUST_CNT, 0).toLocaleString()}
                      </td>
                      <td style={{ textAlign: 'right', fontWeight: 'bold' }}>
                        {dailySalesStatus.reduce((sum, item) => sum + item.SALE_CUST_CNT, 0).toLocaleString()}
                      </td>
                      <td style={{ textAlign: 'right', fontWeight: 'bold' }}>
                        {dailySalesStatus.reduce((sum, item) => sum + item.SALE_QTY, 0).toLocaleString()}
                      </td>
                      <td style={{ textAlign: 'right', fontWeight: 'bold' }}>
                        {dailySalesStatus.reduce((sum, item) => sum + item.SALE_AMT, 0).toLocaleString()}
                      </td>
                      <td style={{ textAlign: 'right', fontWeight: 'bold' }}>
                        {(() => {
                          const totalAmt = dailySalesStatus.reduce((sum, item) => sum + item.SALE_AMT, 0);
                          const totalCust = dailySalesStatus.reduce((sum, item) => sum + item.SALE_CUST_CNT, 0);
                          return totalCust > 0 ? Math.round(totalAmt / totalCust).toLocaleString() : '0';
                        })()}
                      </td>
                      <td style={{ textAlign: 'right', fontWeight: 'bold' }}>
                        {(() => {
                          const totalQty = dailySalesStatus.reduce((sum, item) => sum + item.SALE_QTY, 0);
                          const totalCust = dailySalesStatus.reduce((sum, item) => sum + item.SALE_CUST_CNT, 0);
                          return totalCust > 0 ? (totalQty / totalCust).toFixed(2) : '0.00';
                        })()}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            )}
          </div>
        )}
      </div>

      {/* 결제 모달 */}
      {isPaymentModalOpen && (
        <div className="sales-modal-overlay">
          <div className="sales-payment-modal">
            <div className="payment-modal-header">
              <h3>결제</h3>
              <button onClick={() => setIsPaymentModalOpen(false)} className="modal-close-btn">
                <X size={20} />
              </button>
            </div>
            
            <div className="payment-modal-content">
              <div className="payment-summary">
                <div className="payment-row">
                  <span>판매금액</span>
                  <span>{saleSummary.saleAmt.toLocaleString()}원</span>
                </div>
                
                <div className="payment-mileage-section">
                  <label>마일리지 사용</label>
                  <div className="mileage-input-group">
                    <input
                      type="number"
                      min="0"
                      max={selectedCustomer?.MAIL_POINT || 0}
                      value={mileageInput}
                      onChange={(e) => {
                        const value = parseInt(e.target.value) || 0;
                        setMileageInput(e.target.value);
                        dispatch(setUsedMileage(value));
                      }}
                      className="mileage-input"
                    />
                    <span className="mileage-available">
                      (사용가능: {selectedCustomer?.MAIL_POINT?.toLocaleString() || 0}P)
                    </span>
                  </div>
                </div>

                <div className="payment-row total">
                  <span>최종 결제금액</span>
                  <span className="final-amount">{saleSummary.paymentAmt.toLocaleString()}원</span>
                </div>
              </div>

              <div className="payment-method-section">
                <label>결제수단</label>
                <div className="payment-methods">
                  <button
                    className={`payment-method-btn ${paymentMethod === 'CASH' ? 'active' : ''}`}
                    onClick={() => setPaymentMethod('CASH')}
                  >
                    <Banknote size={24} />
                    <span>현금</span>
                  </button>
                  <button
                    className={`payment-method-btn ${paymentMethod === 'CARD' ? 'active' : ''}`}
                    onClick={() => setPaymentMethod('CARD')}
                  >
                    <CreditCard size={24} />
                    <span>카드</span>
                  </button>
                  <button
                    className={`payment-method-btn ${paymentMethod === 'MIXED' ? 'active' : ''}`}
                    onClick={() => setPaymentMethod('MIXED')}
                  >
                    <Gift size={24} />
                    <span>복합결제</span>
                  </button>
                </div>
              </div>
            </div>

            <div className="payment-modal-actions">
              <button onClick={() => setIsPaymentModalOpen(false)} className="payment-cancel-btn">
                취소
              </button>
              <button onClick={handleConfirmPayment} className="payment-confirm-btn">
                <Receipt size={18} />
                결제 완료
              </button>
            </div>
          </div>
          {/* (이전 하단에 있던) 전체 초기화 버튼을 헤더로 옮김 - 하단 버튼 제거 */}
        </div>
      )}

      {/* 모달들 */}
      
      {/* SMS 문자 보내기 모달 */}
      {isSmsModalOpen && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0, 0, 0, 0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 9999
        }}>
          <div style={{
            background: '#fff', borderRadius: 16, width: 400, maxWidth: '90vw',
            boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)'
          }}>
            {/* 헤더 */}
            <div style={{
              background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
              padding: '20px 24px', borderRadius: '16px 16px 0 0',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <MessageSquare size={24} style={{ color: '#fff' }} />
                <span style={{ fontSize: 18, fontWeight: 700, color: '#fff' }}>문자 보내기</span>
              </div>
              <button
                type="button"
                onClick={() => setIsSmsModalOpen(false)}
                style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: 4 }}
              >
                <X size={24} style={{ color: '#fff' }} />
              </button>
            </div>
            
            {/* 본문 */}
            <div style={{ padding: 24 }}>
              {/* 수신자 정보 */}
              <div style={{ marginBottom: 20 }}>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#475569', marginBottom: 8 }}>수신자</label>
                <div style={{
                  display: 'flex', alignItems: 'center', gap: 12,
                  background: '#f8fafc', padding: '12px 16px', borderRadius: 10, border: '1px solid #e2e8f0'
                }}>
                  <div style={{
                    width: 40, height: 40, borderRadius: '50%',
                    background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                  }}>
                    <Users size={20} style={{ color: '#fff' }} />
                  </div>
                  <div>
                    <span style={{ display: 'block', fontSize: 15, fontWeight: 700, color: '#1e293b' }}>{selectedCustomer?.CUST_NM || '-'}</span>
                    <span style={{ display: 'block', fontSize: 13, color: '#64748b' }}>{selectedCustomer?.C_HP || '-'}</span>
                  </div>
                </div>
              </div>
              
              {/* 메시지 입력 */}
              <div style={{ marginBottom: 20 }}>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#475569', marginBottom: 8 }}>메시지</label>
                <textarea
                  value={smsMessage}
                  onChange={(e) => setSmsMessage(e.target.value)}
                  placeholder="문자 내용을 입력하세요..."
                  style={{
                    width: '100%', minHeight: 150, padding: 16, fontSize: 14,
                    border: '1px solid #e2e8f0', borderRadius: 10, resize: 'vertical',
                    outline: 'none', transition: 'border-color 0.2s',
                    boxSizing: 'border-box'
                  }}
                  onFocus={(e) => e.target.style.borderColor = '#10b981'}
                  onBlur={(e) => e.target.style.borderColor = '#e2e8f0'}
                />
                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 8 }}>
                  <span style={{ fontSize: 12, color: '#94a3b8' }}>{smsMessage.length}/1000자</span>
                </div>
              </div>
              
              {/* 버튼 */}
              <div style={{ display: 'flex', gap: 12 }}>
                <button
                  type="button"
                  onClick={() => setIsSmsModalOpen(false)}
                  style={{
                    flex: 1, padding: '14px 20px', fontSize: 14, fontWeight: 600,
                    color: '#64748b', background: '#f1f5f9', border: 'none', borderRadius: 10,
                    cursor: 'pointer', transition: 'all 0.2s'
                  }}
                >
                  취소
                </button>
                <button
                  type="button"
                  onClick={() => {
                    // 프론트만 구현 - 실제 전송 로직은 나중에 추가
                    alert(`문자 보내기 기능은 추후 구현 예정입니다.\n\n수신자: ${selectedCustomer?.CUST_NM}\n전화번호: ${selectedCustomer?.C_HP}\n메시지: ${smsMessage}`);
                    setIsSmsModalOpen(false);
                    setSmsMessage('');
                  }}
                  disabled={!smsMessage.trim()}
                  style={{
                    flex: 1, padding: '14px 20px', fontSize: 14, fontWeight: 600,
                    color: '#fff', background: !smsMessage.trim() ? '#94a3b8' : 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                    border: 'none', borderRadius: 10,
                    cursor: !smsMessage.trim() ? 'not-allowed' : 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                    transition: 'all 0.2s'
                  }}
                >
                  <Send size={16} /> 보내기
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <ValidationModal
        isOpen={validationModal.isOpen}
        errors={validationModal.errors}
        onClose={() => setValidationModal({ isOpen: false, errors: [] })}
      />

      <ConfirmationModal
        isOpen={confirmationModal.isOpen}
        type={confirmationModal.type}
        onConfirm={confirmationModal.onConfirm ?? (() => {})}
        onCancel={() => setConfirmationModal({ isOpen: false, type: 'save', onConfirm: () => {} })}
      />

      <SuccessModal
        isOpen={successModal.isOpen}
        type={successModal.type}
        message={successModal.message}
        details={successModal.details}
        onClose={() => setSuccessModal({ isOpen: false, type: 'save' })}
      />

      {/* 상품검색 모달 (OrderRegistration의 팝업 디자인을 복사한 컴포넌트 사용) */}
      <SalesProductSearchPopup
        visible={showProductSearchModal}
        onClose={handleCloseProductSearch}
        onSelect={handleSelectProductFromPopupWithPrice}
        saleDate={normalizeSaleDForApi(salesHeader?.SALE_D)}
        storeId={salesHeader?.AGENT_ID}
        initialSearchText={productSearchTerm}
      />

      {/* 고객 검색 이력 모달 (프론트 전용) */}
      {showCustFindModal && (
        <div className="sales-modal-overlay">
          <div className="sales-product-search-modal" style={{ width: 720, maxWidth: '92vw' }}>
              <div className="sales-product-search-modal-content">
              <div className="sales-product-search-modal-header">
                <h3><History size={18} /> 고객 검색 이력</h3>
                <button onClick={closeCustFindModal} className="sales-modal-close-btn">
                  <X size={18} />
                </button>
              </div>
              <div className="sales-product-search-modal-body" style={{ gap: 10 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ fontSize: 12, color: '#64748b' }}>매장코드</div>
                  <div style={{ fontWeight: 700, color: '#334155' }}>{salesHeader.AGENT_ID || '-'}</div>
                  <div style={{ marginLeft: 'auto', fontSize: 12, color: '#94a3b8' }}>
                    {/* 당일 검색 이력 (샘플/프론트 전용) */}
                  </div>
                </div>

                <div className="sales-product-search-grid-wrapper" style={{ padding: 0 }}>
                  <div className="ag-theme-alpine" style={{ height: '360px' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                      <thead>
                        <tr style={{ background: '#f1f5f9' }}>
                          <th style={{ border: '1px solid #e5e7eb', padding: '6px', width: 160 }}>시간</th>
                          <th style={{ border: '1px solid #e5e7eb', padding: '6px', width: 90 }}>매장코드</th>
                          <th style={{ border: '1px solid #e5e7eb', padding: '6px' }}>검색어</th>
                          <th style={{ border: '1px solid #e5e7eb', padding: '6px', width: 80 }}>검색수</th>
                          <th style={{ border: '1px solid #e5e7eb', padding: '6px', width: 120 }}>포함구분</th>
                          <th style={{ border: '1px solid #e5e7eb', padding: '6px', width: 140 }}>사용자</th>
                        </tr>
                      </thead>
                      <tbody>
                        {custFindRows.length === 0 ? (
                          <tr>
                            <td colSpan={4} style={{ border: '1px solid #e5e7eb', padding: '16px', textAlign: 'center', color: '#94a3b8' }}>
                              표시할 검색 이력이 없습니다.
                            </td>
                          </tr>
                        ) : (
                          custFindRows.map((row, idx) => (
                            <tr key={idx}>
                              <td style={{ border: '1px solid #e5e7eb', padding: '6px', textAlign: 'center', whiteSpace: 'nowrap' }}>{row.FIND_TIME}</td>
                              <td style={{ border: '1px solid #e5e7eb', padding: '6px', textAlign: 'center' }}>{row.AGENT_ID || '-'}</td>
                              <td style={{ border: '1px solid #e5e7eb', padding: '6px' }}>{row.FIND_CUST}</td>
                              <td style={{ border: '1px solid #e5e7eb', padding: '6px', textAlign: 'right' }}>{row.FIND_CNT?.toLocaleString?.() ?? row.FIND_CNT}</td>
                              <td style={{ border: '1px solid #e5e7eb', padding: '6px', textAlign: 'center' }}>{row.P_GBN || '-'}</td>
                              <td style={{ border: '1px solid #e5e7eb', padding: '6px' }}>{row.USER_NAME || row.USER_ID || '-'}</td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
                  <button onClick={closeCustFindModal} className="sales-add-products-btn" style={{ background: '#e2e8f0', color: '#475569' }}>
                    닫기
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 반품 처리 모달 */}
      {refundModal.isOpen && (
        <div className="sales-product-search-modal-overlay" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div className="sales-product-search-modal" style={{ background: '#fff', borderRadius: 12, boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)', width: 800, maxWidth: '90vw', maxHeight: '80vh', display: 'flex', flexDirection: 'column' }}>
            {/* 헤더 */}
            <div style={{ padding: '16px 20px', borderBottom: '1px solid #e5e7eb', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)', borderRadius: '12px 12px 0 0' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <Package size={20} style={{ color: '#fff' }} />
                <span style={{ fontSize: 16, fontWeight: 700, color: '#fff' }}>반품 처리</span>
              </div>
              <button onClick={handleCloseRefundModal} style={{ background: 'transparent', border: 'none', color: '#fff', cursor: 'pointer', padding: 4 }}>
                <X size={20} />
              </button>
            </div>

            {/* 영수증 정보 */}
            <div style={{ padding: '12px 20px', background: '#fef3c7', borderBottom: '1px solid #fcd34d' }}>
              <div style={{ display: 'flex', gap: 24, fontSize: 13 }}>
                <div><span style={{ fontWeight: 600, color: '#92400e' }}>영수증번호:</span> <span style={{ color: '#78350f' }}>{refundModal.trNo}</span></div>
                <div><span style={{ fontWeight: 600, color: '#92400e' }}>판매일자:</span> <span style={{ color: '#78350f' }}>{refundModal.saleD}</span></div>
                <div><span style={{ fontWeight: 600, color: '#92400e' }}>고객:</span> <span style={{ color: '#78350f' }}>{selectedCustomer?.CUST_NM || '-'}</span></div>
              </div>
            </div>

            {/* 상품 목록 */}
            <div style={{ flex: 1, overflow: 'auto', padding: '16px 20px' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <thead>
                  <tr style={{ background: '#f8fafc' }}>
                    <th style={{ border: '1px solid #e5e7eb', padding: '10px 8px', width: 40, textAlign: 'center' }}>
                      <input
                        type="checkbox"
                        checked={refundModal.items.length > 0 && refundModal.items.every(item => refundSelections[String(item.SALE_SEQU)]?.selected)}
                        onChange={(e) => {
                          const checked = e.target.checked;
                          setRefundSelections(prev => {
                            const updated = { ...prev };
                            refundModal.items.forEach(item => {
                              const key = String(item.SALE_SEQU);
                              if (updated[key]) {
                                updated[key] = { ...updated[key], selected: checked };
                              }
                            });
                            return updated;
                          });
                        }}
                        style={{ width: 16, height: 16 }}
                      />
                    </th>
                    <th style={{ border: '1px solid #e5e7eb', padding: '10px 8px', textAlign: 'left' }}>상품명</th>
                    <th style={{ border: '1px solid #e5e7eb', padding: '10px 8px', width: 80, textAlign: 'right' }}>단가</th>
                    <th style={{ border: '1px solid #e5e7eb', padding: '10px 8px', width: 70, textAlign: 'center' }}>구매수량</th>
                    <th style={{ border: '1px solid #e5e7eb', padding: '10px 8px', width: 90, textAlign: 'center' }}>반품수량</th>
                    <th style={{ border: '1px solid #e5e7eb', padding: '10px 8px', width: 100, textAlign: 'right' }}>환불금액</th>
                    <th style={{ border: '1px solid #e5e7eb', padding: '10px 8px', width: 150, textAlign: 'center' }}>마일리지 환불</th>
                  </tr>
                </thead>
                <tbody>
                  {refundModal.items.map((item: any) => {
                    const key = String(item.SALE_SEQU);
                    const sel = refundSelections[key];
                    if (!sel) return null;
                    
                    const unitPrice = Number(item.SALE_DANGA) || 0;
                    const discountRate = Number(item.DISCOUNT_RATE) || 0;
                    const refundTotAmt = sel.refundQty * unitPrice;
                    const refundDiscountAmt = Math.floor(refundTotAmt * discountRate / 100);
                    const refundAmt = refundTotAmt - refundDiscountAmt;
                    
                    return (
                      <tr key={key} style={{ background: sel.selected ? '#fef3c7' : 'transparent' }}>
                        <td style={{ border: '1px solid #e5e7eb', padding: '8px', textAlign: 'center' }}>
                          <input
                            type="checkbox"
                            checked={sel.selected}
                            onChange={(e) => handleRefundSelectionToggle(key, e.target.checked)}
                            style={{ width: 16, height: 16 }}
                          />
                        </td>
                        <td style={{ border: '1px solid #e5e7eb', padding: '8px' }}>
                          <div style={{ fontWeight: 600 }}>{item.GOODS_NM}</div>
                          <div style={{ fontSize: 11, color: '#64748b' }}>{item.BRAND_NM || ''} {item.BAR_CODE ? `· ${item.BAR_CODE}` : ''}</div>
                        </td>
                        <td style={{ border: '1px solid #e5e7eb', padding: '8px', textAlign: 'right' }}>
                          {unitPrice.toLocaleString()}원
                        </td>
                        <td style={{ border: '1px solid #e5e7eb', padding: '8px', textAlign: 'center' }}>
                          {item.SALE_QTY}
                        </td>
                        <td style={{ border: '1px solid #e5e7eb', padding: '8px', textAlign: 'center' }}>
                          <input
                            type="number"
                            min={1}
                            max={sel.maxQty}
                            value={sel.refundQty}
                            onChange={(e) => handleRefundQtyChange(key, Number(e.target.value))}
                            disabled={!sel.selected}
                            style={{ width: 60, textAlign: 'center', padding: '4px', border: '1px solid #d1d5db', borderRadius: 4 }}
                          />
                        </td>
                        <td style={{ border: '1px solid #e5e7eb', padding: '8px', textAlign: 'right', fontWeight: 600, color: sel.selected ? '#dc2626' : '#64748b' }}>
                          {sel.selected ? `${refundAmt.toLocaleString()}원` : '-'}
                        </td>
                        <td style={{ border: '1px solid #e5e7eb', padding: '8px', textAlign: 'center' }}>
                          <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, cursor: sel.selected ? 'pointer' : 'default' }}>
                            <input
                              type="checkbox"
                              checked={sel.wantMileageRefund}
                              onChange={(e) => handleMileageRefundToggle(key, e.target.checked)}
                              disabled={!sel.selected}
                              style={{ width: 14, height: 14 }}
                            />
                            <span style={{ fontSize: 11, color: sel.selected && sel.wantMileageRefund ? '#7c3aed' : '#64748b' }}>
                              마일리지로 환불
                            </span>
                          </label>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* 요약 및 버튼 */}
            <div style={{ padding: '16px 20px', borderTop: '1px solid #e5e7eb', background: '#f8fafc' }}>
              {(() => {
                const selectedItems = refundModal.items.filter(item => refundSelections[String(item.SALE_SEQU)]?.selected);
                let totalRefundAmt = 0;
                let totalMileageRefund = 0;
                
                selectedItems.forEach(item => {
                  const sel = refundSelections[String(item.SALE_SEQU)];
                  const unitPrice = Number(item.SALE_DANGA) || 0;
                  const discountRate = Number(item.DISCOUNT_RATE) || 0;
                  const refundTotAmt = sel.refundQty * unitPrice;
                  const refundDiscountAmt = Math.floor(refundTotAmt * discountRate / 100);
                  const refundAmt = refundTotAmt - refundDiscountAmt;
                  totalRefundAmt += refundAmt;
                  if (sel.wantMileageRefund) {
                    totalMileageRefund += refundAmt;
                  }
                });
                
                return (
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', gap: 24, fontSize: 14 }}>
                      <div>
                        <span style={{ color: '#64748b' }}>선택 상품:</span>
                        <span style={{ fontWeight: 700, marginLeft: 6, color: '#1e293b' }}>{selectedItems.length}건</span>
                      </div>
                      <div>
                        <span style={{ color: '#64748b' }}>총 환불금액:</span>
                        <span style={{ fontWeight: 700, marginLeft: 6, color: '#dc2626', fontSize: 16 }}>{totalRefundAmt.toLocaleString()}원</span>
                      </div>
                      {totalMileageRefund > 0 && (
                        <div>
                          <span style={{ color: '#64748b' }}>마일리지 적립:</span>
                          <span style={{ fontWeight: 700, marginLeft: 6, color: '#7c3aed', fontSize: 16 }}>{totalMileageRefund.toLocaleString()}P</span>
                        </div>
                      )}
                    </div>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button
                        onClick={handleCloseRefundModal}
                        style={{ padding: '10px 20px', background: '#e2e8f0', color: '#475569', border: 'none', borderRadius: 6, fontWeight: 600, cursor: 'pointer' }}
                      >
                        취소
                      </button>
                      <button
                        onClick={handleConfirmRefund}
                        disabled={selectedItems.length === 0}
                        style={{
                          padding: '10px 20px',
                          background: selectedItems.length > 0 ? 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)' : '#e5e7eb',
                          color: selectedItems.length > 0 ? '#fff' : '#9ca3af',
                          border: 'none',
                          borderRadius: 6,
                          fontWeight: 600,
                          cursor: selectedItems.length > 0 ? 'pointer' : 'not-allowed'
                        }}
                      >
                        반품 처리
                      </button>
                    </div>
                  </div>
                );
              })()}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SalesRegistration;
