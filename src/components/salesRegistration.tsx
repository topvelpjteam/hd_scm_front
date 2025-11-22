import React, { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { AgGridReact } from 'ag-grid-react';
import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-alpine.css';
import { 
  Users, ShoppingCart, MessageSquare, Package, 
  DollarSign, Award, TrendingUp, Search, Plus, 
  Trash2, X, Receipt, CreditCard, Banknote,
  Gift, Phone, Mail, Calendar, BarChart3, History
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
  initializeNewSale,
  type TabType,
  type SalesItem,
  type CustomerInfo,
  type PaymentInfo
} from '../store/salesRegistrationSlice';
import { RootState, AppDispatch } from '../store/store';
import './salesRegistration.css';

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

  // 로컬 상태
  const [barcodeInput, setBarcodeInput] = useState('');
  const [quantityInput, setQuantityInput] = useState('1');
  const [discountRate, setDiscountRate] = useState('0');
  const [mileageInput, setMileageInput] = useState('0');
  const [paymentMethod, setPaymentMethod] = useState('CASH');
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  
  // 구매이력 검색 필터 상태 (1년 전 ~ 오늘)
  const getDefaultStartDate = () => {
    const date = new Date();
    date.setFullYear(date.getFullYear() - 1);
    return date.toISOString().split('T')[0];
  };
  const getDefaultEndDate = () => {
    return new Date().toISOString().split('T')[0];
  };
  
  const [purchaseStartDate, setPurchaseStartDate] = useState(getDefaultStartDate());
  const [purchaseEndDate, setPurchaseEndDate] = useState(getDefaultEndDate());
  const [purchaseProductName, setPurchaseProductName] = useState('');

  // 고객 검색 이력 모달 상태 (TB_ZA_CUST_FIND 기반)
  type CustFindRow = {
    AGENT_ID: string;
    FIND_TIME: string; // yyyy-MM-dd HH:mm:ss
    FIND_CUST: string; // 검색어
    FIND_CNT: number;  // 검색된 수
    P_GBN?: string;    // 포함구분 (ALL 등)
  };
  const [showCustFindModal, setShowCustFindModal] = useState(false);
  const [custFindRows, setCustFindRows] = useState<CustFindRow[]>([]);
  const openCustFindModal = () => {
    // 프론트 전용: 샘플 데이터 또는 빈 상태로 표시
    // 오늘 날짜 문자열
    const now = new Date();
    const pad = (n: number) => (n < 10 ? `0${n}` : `${n}`);
    const ts = `${now.getFullYear()}-${pad(now.getMonth()+1)}-${pad(now.getDate())} ${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;

    // 검색어가 있으면 한 건 샘플로 채워서 레이아웃 확인이 쉽도록 함
    if (customerSearchCondition.searchText?.trim()) {
      setCustFindRows([
        {
          AGENT_ID: salesHeader.AGENT_ID || '0000',
          FIND_TIME: ts,
          FIND_CUST: customerSearchCondition.searchText.trim(),
          FIND_CNT: (customerSearchResults?.length ?? 0),
          P_GBN: ''
        }
      ]);
    } else {
      setCustFindRows([]);
    }
    setShowCustFindModal(true);
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
    type: 'save' | 'update' | 'delete';
    onConfirm: () => void;
  }>({ isOpen: false, type: 'save', onConfirm: () => {} });
  
  const [successModal, setSuccessModal] = useState<{
    isOpen: boolean;
    type: 'save' | 'update' | 'delete';
    message?: string;
    details?: string;
  }>({ isOpen: false, type: 'save' });

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
    { id: 'unified' as TabType, name: '통합화면', icon: BarChart3, color: '#14b8a6' },
    { id: 'customer' as TabType, name: '고객정보', icon: Users, color: '#667eea' },
    { id: 'purchase' as TabType, name: '구매이력', icon: ShoppingCart, color: '#10b981' },
    { id: 'consultation' as TabType, name: '상담이력', icon: MessageSquare, color: '#f59e0b' },
    { id: 'product' as TabType, name: '상품검색', icon: Package, color: '#06b6d4' },
    { id: 'sales' as TabType, name: '판매등록', icon: DollarSign, color: '#ec4899' },
    { id: 'mileage' as TabType, name: '마일리지', icon: Award, color: '#8b5cf6' },
    { id: 'daily' as TabType, name: '당일판매', icon: TrendingUp, color: '#ef4444' }
  ], []);

  // 탭 변경
  const handleTabChange = useCallback((tabId: TabType) => {
    dispatch(setActiveTab(tabId));
  }, [dispatch]);

  // 초기화
  useEffect(() => {
    dispatch(initializeNewSale());
    // TODO: 로그인 사원 정보로 초기화
  }, [dispatch]);

  // 합계 자동 계산
  useEffect(() => {
    dispatch(calculateSaleSummary());
  }, [salesItems, dispatch]);


  // ========== 고객 관련 함수 ==========
  const handleCustomerSearch = useCallback(async () => {
    try {
      // TODO: 백엔드 API 호출
      // const results = await customerService.searchCustomers(customerSearchCondition);
      // dispatch(setCustomerSearchResults(results));
      
      // 임시 데이터
      const mockResults: CustomerInfo[] = [
        {
          CUST_ID: 1001,
          CUST_NM: '홍길동',
          C_HP: '010-1234-5678',
          C_EMAIL: 'hong@example.com',
          CUST_GBN: 'A',
          GENDER_GBN: 'M',
          MAIL_POINT: 5000
        },
        {
          CUST_ID: 1002,
          CUST_NM: '김영희',
          C_HP: '010-9876-5432',
          C_EMAIL: 'kim@example.com',
          CUST_GBN: 'B',
          GENDER_GBN: 'F',
          MAIL_POINT: 12000
        }
      ];
      dispatch(setCustomerSearchResults(mockResults));
    } catch (error) {
      console.error('고객 검색 실패:', error);
    }
  }, [customerSearchCondition, dispatch]);

  const handleCustomerSelect = useCallback((customer: CustomerInfo) => {
    dispatch(setSelectedCustomer(customer));
    // 고객 선택 시 자동으로 구매이력/상담이력/마일리지이력 조회
    loadCustomerHistory(customer.CUST_ID);
  }, [dispatch]);

  const loadCustomerHistory = useCallback(async (_custId: number) => {
    try {
      // TODO: 백엔드 API 호출
      // const [purchase, consultation, mileage] = await Promise.all([
      //   salesService.getPurchaseHistory(_custId),
      //   salesService.getConsultationHistory(_custId),
      //   salesService.getMileageHistory(_custId)
      // ]);
      
      // 임시 데이터
      dispatch(setPurchaseHistory([
        {
          SALE_D: '20250115',
          SALE_SEQU: 1,
          GOODS_NM: '샤넬 No.5 향수',
          BRAND_NM: 'CHANEL',
          SALE_QTY: 1,
          SALE_AMT: 180000,
          MAIL_POINT: 1800,
          TR_NO: 'TR20250115001'
        }
      ]));
      
      dispatch(setConsultationHistory([
        {
          CONSULT_D: '20250110',
          CONSULT_TYPE: '상품문의',
          CONSULT_CONTENT: '신제품 입고 문의',
          CONSULT_RESULT: '상담완료',
          STAFF_NM: '이상담'
        }
      ]));
      
      dispatch(setMileageHistory([
        {
          POINT_D: '20250115',
          POINT_TYPE: '적립',
          POINT_AMT: 1800,
          SALE_AMT: 180000,
          BALANCE: 5000,
          MEMO: '샤넬 No.5 향수 구매'
        }
      ]));
    } catch (error) {
      console.error('고객 이력 조회 실패:', error);
    }
  }, [dispatch]);

  // 구매이력 검색 핸들러
  const handlePurchaseHistorySearch = useCallback(() => {
    if (!selectedCustomer) return;
    
    // TODO: 실제 API 호출로 대체
    // const filtered = await purchaseHistoryService.search({
    //   custId: selectedCustomer.CUST_ID,
    //   startDate: purchaseStartDate,
    //   endDate: purchaseEndDate,
    //   productName: purchaseProductName
    // });
    
    // 임시: 현재 이력 필터링
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
        (item.GOODS_NM || '').toLowerCase().includes(searchTerm)
      );
    }
    
    dispatch(setPurchaseHistory(filtered));
  }, [selectedCustomer, purchaseStartDate, purchaseEndDate, purchaseProductName, purchaseHistory, dispatch]);

  // 통합화면 사용성: 고객 변경 시 이력 자동 갱신
  useEffect(() => {
    if (selectedCustomer) {
      loadCustomerHistory(selectedCustomer.CUST_ID);
      // 검색 필터 초기화 (1년 전 ~ 오늘)
      setPurchaseStartDate(getDefaultStartDate());
      setPurchaseEndDate(getDefaultEndDate());
      setPurchaseProductName('');
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
    setShowProductSearchModal(true);
    const popupWidth = 800;
    const popupHeight = 500;
    const centerX = Math.max(50, (window.innerWidth - popupWidth) / 2);
    const centerY = Math.max(50, (window.innerHeight - popupHeight) / 4);
    setModalPosition({ x: centerX, y: centerY });
  }, []);

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
      const products = await popupSearchService.searchProductsForPopup({
        searchText: productSearchTerm || undefined,
        excludeEndedProducts: true
      });
      setModalProductResults(products || []);
    } catch (error) {
      console.error('상품 검색 실패:', error);
      setModalProductResults([]);
    }
  }, [productSearchTerm]);

  const handleProductSelectionChange = useCallback(() => {
    if (productSearchGridRef.current) {
      setSelectedProductsForAdd(productSearchGridRef.current.getSelectedRows() || []);
    }
  }, []);

  const handleAddProductsToSales = useCallback(() => {
    selectedProductsForAdd.forEach(product => {
      const newItem: SalesItem = {
        SALE_SEQU: salesItems.length + 1,
        GOODS_ID: product.GOODS_ID || product.id,
        GOODS_NM: product.GOODS_NAME || product.productName || '',
        BRAND_NM: product.BRAND_NAME || product.brand || '',
        BAR_CODE: product.BAR_CODE || '',
        SALE_QTY: 1,
        SALE_DANGA: product.CONSUMER_PRICE || product.consumerPrice || 0,
        TOT_AMT: product.CONSUMER_PRICE || product.consumerPrice || 0,
        DISCOUNT_RATE: 0,
        DISCOUNT_AMT: 0,
        SALE_AMT: product.CONSUMER_PRICE || product.consumerPrice || 0,
        NET_TOT: product.CONSUMER_PRICE || product.consumerPrice || 0,
        NET_AMT: Math.floor((product.CONSUMER_PRICE || product.consumerPrice || 0) / 1.1),
        NET_VAT: (product.CONSUMER_PRICE || product.consumerPrice || 0) - Math.floor((product.CONSUMER_PRICE || product.consumerPrice || 0) / 1.1),
        MAIL_POINT: Math.floor((product.CONSUMER_PRICE || product.consumerPrice || 0) * 0.01)
      };
      dispatch(addSalesItem(newItem));
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

  const handleBarcodeInput = useCallback(async (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && barcodeInput.trim()) {
      try {
        // TODO: 바코드로 상품 조회
        // const product = await productService.getProductByBarcode(barcodeInput);
        
        // 임시: 상품 추가
        const mockProduct: SalesItem = {
          SALE_SEQU: salesItems.length + 1,
          GOODS_ID: 10001,
          GOODS_NM: '샤넬 No.5 향수 100ml',
          BRAND_NM: 'CHANEL',
          BAR_CODE: barcodeInput,
          SALE_QTY: parseInt(quantityInput) || 1,
          SALE_DANGA: 180000,
          TOT_AMT: 180000,
          DISCOUNT_RATE: parseFloat(discountRate) || 0,
          DISCOUNT_AMT: 0,
          SALE_AMT: 180000,
          NET_TOT: 180000,
          NET_AMT: 163636,
          NET_VAT: 16364,
          MAIL_POINT: 1800
        };
        
        dispatch(addSalesItem(mockProduct));
        setBarcodeInput('');
        setQuantityInput('1');
        setDiscountRate('0');
      } catch (error) {
        console.error('상품 조회 실패:', error);
        setValidationModal({
          isOpen: true,
          errors: [{ field: 'barcode', message: '해당 바코드의 상품을 찾을 수 없습니다.' }]
        });
      }
    }
  }, [barcodeInput, quantityInput, discountRate, salesItems, dispatch]);

  const handleAddProductFromSearch = useCallback((product: any) => {
    const newItem: SalesItem = {
      SALE_SEQU: salesItems.length + 1,
      GOODS_ID: product.GOODS_ID,
      GOODS_NM: product.GOODS_NM,
      BRAND_NM: product.BRAND_NM,
      BAR_CODE: product.BAR_CODE,
      SALE_QTY: 1,
      SALE_DANGA: product.SALE_DANGA,
      TOT_AMT: product.SALE_DANGA,
      DISCOUNT_RATE: product.DISCOUNT_RATE || 0,
      DISCOUNT_AMT: Math.floor(product.SALE_DANGA * (product.DISCOUNT_RATE || 0) / 100),
      SALE_AMT: product.SALE_DANGA - Math.floor(product.SALE_DANGA * (product.DISCOUNT_RATE || 0) / 100),
      NET_TOT: product.SALE_DANGA,
      NET_AMT: Math.floor(product.SALE_DANGA / 1.1),
      NET_VAT: product.SALE_DANGA - Math.floor(product.SALE_DANGA / 1.1),
      MAIL_POINT: Math.floor(product.SALE_DANGA * (product.MAIL_POINT_RATE || 1) / 100)
    };
    
    dispatch(addSalesItem(newItem));
  }, [salesItems, dispatch]);

  // ========== 판매 관련 함수 ==========
  const handleRemoveItem = useCallback((sequ: number) => {
    dispatch(removeSalesItem(sequ));
  }, [dispatch]);

  const handleUpdateItemQty = useCallback((sequ: number, qty: number) => {
    if (qty > 0) {
      dispatch(updateSalesItem({ sequ, data: { SALE_QTY: qty } }));
    }
  }, [dispatch]);

  const handleUpdateItemDiscount = useCallback((sequ: number, rate: number) => {
    if (rate >= 0 && rate <= 100) {
      dispatch(updateSalesItem({ sequ, data: { DISCOUNT_RATE: rate } }));
    }
  }, [dispatch]);

  const handlePayment = useCallback(() => {
    if (!selectedCustomer) {
      setValidationModal({
        isOpen: true,
        errors: [{ field: 'customer', message: '고객을 먼저 선택해주세요.' }]
      });
      return;
    }
    
    if (salesItems.length === 0) {
      setValidationModal({
        isOpen: true,
        errors: [{ field: 'items', message: '판매할 상품을 추가해주세요.' }]
      });
      return;
    }
    
    setIsPaymentModalOpen(true);
  }, [selectedCustomer, salesItems]);

  const handleConfirmPayment = useCallback(async () => {
    try {
      const payment: PaymentInfo = {
        paymentMethod,
        paymentAmt: saleSummary.paymentAmt,
        cardCompany: paymentMethod === 'CARD' ? '신한카드' : undefined,
        approvalNo: paymentMethod === 'CARD' ? `APPR${Date.now()}` : undefined
      };
      
      dispatch(setPaymentInfo(payment));
      
      // TODO: 백엔드 저장 API 호출
      // const result = await salesService.saveSales({
      //   header: salesHeader,
      //   items: salesItems,
      //   payment: payment
      // });
      
      setSuccessModal({
        isOpen: true,
        type: 'save',
        message: '판매가 완료되었습니다.',
        details: `영수증번호: ${salesHeader.TR_NO || 'TR' + Date.now()}\n결제금액: ${saleSummary.paymentAmt.toLocaleString()}원`
      });
      
      setIsPaymentModalOpen(false);
      
      // 판매 완료 후 초기화
      setTimeout(() => {
        dispatch(initializeNewSale());
        setPaymentMethod('CASH');
        setMileageInput('0');
      }, 2000);
      
    } catch (error) {
      console.error('결제 처리 실패:', error);
      setValidationModal({
        isOpen: true,
        errors: [{ field: 'payment', message: '결제 처리 중 오류가 발생했습니다.' }]
      });
    }
  }, [paymentMethod, saleSummary, salesHeader, salesItems, dispatch]);

  // ========== 당일 판매 현황 조회 ==========
  const loadDailySales = useCallback(async () => {
    try {
      // TODO: 백엔드 API 호출
      // const results = await salesService.getDailySalesStatus(salesHeader.SALE_D);
      
      // 임시 데이터
      dispatch(setDailySalesStatus([
        {
          STAFF_ID: 1,
          STAFF_NM: '김판매',
          SALE_COUNT: 15,
          SALE_QTY: 28,
          SALE_AMT: 3850000,
          DISCOUNT_AMT: 250000,
          NET_AMT: 3600000,
          MAIL_POINT: 36000
        },
        {
          STAFF_ID: 2,
          STAFF_NM: '이상담',
          SALE_COUNT: 12,
          SALE_QTY: 20,
          SALE_AMT: 2950000,
          DISCOUNT_AMT: 150000,
          NET_AMT: 2800000,
          MAIL_POINT: 28000
        }
      ]));
    } catch (error) {
      console.error('당일 판매 현황 조회 실패:', error);
    }
  }, [salesHeader.SALE_D, dispatch]);

  useEffect(() => {
    if (activeTab === 'daily') {
      loadDailySales();
    }
  }, [activeTab, loadDailySales]);

  // ========== AG-Grid 컬럼 정의 ==========
  const customerGridColumns = useMemo(() => [
    { field: 'CUST_ID' as const, headerName: '고객코드', width: 100 },
    { field: 'CUST_NM' as const, headerName: '고객명', width: 120 },
    { field: 'C_HP' as const, headerName: '전화번호', width: 130 },
    { field: 'C_EMAIL' as const, headerName: '이메일', width: 180 },
    { 
      field: 'MAIL_POINT' as const, 
      headerName: '마일리지', 
      width: 100,
      valueFormatter: (params: any) => params.value?.toLocaleString() || '0'
    }
  ], []);

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

  const salesItemsGridColumns = useMemo(() => [
    { 
      field: 'actions' as any, 
      headerName: '', 
      width: 50,
      cellRenderer: (params: any) => (
        <button 
          className="sales-delete-btn"
          onClick={() => handleRemoveItem(params.data.SALE_SEQU)}
          title="삭제"
        >
          <Trash2 size={16} />
        </button>
      )
    },
    { field: 'SALE_SEQU' as any, headerName: '순번', width: 60 },
    { field: 'BRAND_NM' as any, headerName: '브랜드', width: 100 },
    { field: 'GOODS_NM' as any, headerName: '상품명', width: 200 },
    { 
      field: 'SALE_QTY' as any, 
      headerName: '수량', 
      width: 80,
      editable: true,
      cellEditor: 'agNumberCellEditor',
      onCellValueChanged: (params: any) => {
        handleUpdateItemQty(params.data.SALE_SEQU, params.newValue);
      }
    },
    { 
      field: 'SALE_DANGA' as any, 
      headerName: '단가', 
      width: 100,
      valueFormatter: (params: any) => params.value?.toLocaleString() || '0'
    },
    { 
      field: 'DISCOUNT_RATE' as any, 
      headerName: '할인율', 
      width: 80,
      editable: true,
      cellEditor: 'agNumberCellEditor',
      onCellValueChanged: (params: any) => {
        handleUpdateItemDiscount(params.data.SALE_SEQU, params.newValue);
      },
      valueFormatter: (params: any) => `${params.value || 0}%`
    },
    { 
      field: 'SALE_AMT' as any, 
      headerName: '판매금액', 
      width: 120,
      valueFormatter: (params: any) => params.value?.toLocaleString() || '0'
    },
    { 
      field: 'MAIL_POINT' as any, 
      headerName: '마일리지', 
      width: 100,
      valueFormatter: (params: any) => params.value?.toLocaleString() || '0'
    }
  ], [handleRemoveItem, handleUpdateItemQty, handleUpdateItemDiscount]);

  const purchaseHistoryColumns = useMemo(() => [
    { field: 'SALE_D' as any, headerName: '판매일자', width: 100 },
    { field: 'TR_NO' as any, headerName: '영수증번호', width: 130 },
    { field: 'BRAND_NM' as any, headerName: '브랜드', width: 100 },
    { field: 'GOODS_NM' as any, headerName: '상품명', width: 200 },
    { 
      field: 'SALE_QTY' as any, 
      headerName: '수량', 
      width: 80,
      valueFormatter: (params: any) => params.value?.toLocaleString() || '0'
    },
    { 
      field: 'SALE_AMT' as any, 
      headerName: '판매금액', 
      width: 120,
      valueFormatter: (params: any) => params.value?.toLocaleString() || '0'
    },
    { 
      field: 'MAIL_POINT' as any, 
      headerName: '마일리지', 
      width: 100,
      valueFormatter: (params: any) => params.value?.toLocaleString() || '0'
    }
  ], []);

  const mileageHistoryColumns = useMemo(() => [
    { field: 'POINT_D' as any, headerName: '일자', width: 100 },
    { field: 'POINT_TYPE' as any, headerName: '유형', width: 80 },
    { 
      field: 'POINT_AMT' as any, 
      headerName: '포인트', 
      width: 100,
      cellStyle: (params: any) => {
        return params.data.POINT_TYPE === '사용' 
          ? { color: '#ef4444' } 
          : { color: '#10b981' };
      },
      valueFormatter: (params: any) => {
        const value = params.value || 0;
        return params.data.POINT_TYPE === '사용' 
          ? `-${value.toLocaleString()}` 
          : `+${value.toLocaleString()}`;
      }
    },
    { 
      field: 'SALE_AMT' as any, 
      headerName: '판매금액', 
      width: 120,
      valueFormatter: (params: any) => params.value?.toLocaleString() || '-'
    },
    { 
      field: 'BALANCE' as any, 
      headerName: '잔액', 
      width: 100,
      valueFormatter: (params: any) => params.value?.toLocaleString() || '0'
    },
    { field: 'MEMO' as any, headerName: '메모', width: 200 }
  ], []);

  const dailySalesColumns = useMemo(() => [
    { field: 'STAFF_NM' as any, headerName: '판매사원', width: 100 },
    { 
      field: 'SALE_COUNT' as any, 
      headerName: '판매건수', 
      width: 100,
      valueFormatter: (params: any) => `${params.value || 0}건`
    },
    { 
      field: 'SALE_QTY' as any, 
      headerName: '판매수량', 
      width: 100,
      valueFormatter: (params: any) => params.value?.toLocaleString() || '0'
    },
    { 
      field: 'SALE_AMT' as any, 
      headerName: '판매금액', 
      width: 130,
      valueFormatter: (params: any) => params.value?.toLocaleString() || '0'
    },
    { 
      field: 'DISCOUNT_AMT' as any, 
      headerName: '할인금액', 
      width: 130,
      valueFormatter: (params: any) => params.value?.toLocaleString() || '0'
    },
    { 
      field: 'NET_AMT' as any, 
      headerName: '순매출', 
      width: 130,
      valueFormatter: (params: any) => params.value?.toLocaleString() || '0'
    },
    { 
      field: 'MAIL_POINT', 
      headerName: '마일리지', 
      width: 100,
      valueFormatter: (params: any) => params.value?.toLocaleString() || '0'
    }
  ], []);

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
            <Calendar size={18} />
            <span>{salesHeader.SALE_D.replace(/(\d{4})(\d{2})(\d{2})/, '$1-$2-$3')}</span>
          </div>
          {selectedCustomer && (
            <div className="sales-customer-badge">
              <Users size={18} />
              <span>{selectedCustomer.CUST_NM}</span>
              <span className="mileage-badge">
                <Award size={14} />
                {selectedCustomer.MAIL_POINT?.toLocaleString() || 0}P
              </span>
            </div>
          )}
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
              <div className="sales-search-bar">
                <input
                  type="text"
                  placeholder="고객명 또는 전화번호 입력"
                  value={customerSearchCondition.searchText}
                  onChange={(e) => dispatch(setCustomerSearchCondition({ searchText: e.target.value }))}
                  onKeyPress={(e) => e.key === 'Enter' && handleCustomerSearch()}
                  className="sales-search-input"
                />
                <button onClick={handleCustomerSearch} className="sales-search-btn">
                  <Search size={18} />
                  조회
                </button>
                <button onClick={openCustFindModal} className="sales-search-btn" style={{ background: 'linear-gradient(135deg, #06b6d4 0%, #0891b2 100%)' }}>
                  <History size={16} />
                  검색이력
                </button>
              </div>
              <div className="sales-grid-container" style={{ flex: '1 1 auto', minHeight: 0 }}>
                <div className="ag-theme-alpine sales-grid" style={{ height: '100%' }}>
                  <AgGridReact
                    rowData={customerSearchResults}
                    columnDefs={customerGridColumns as any}
                    onRowClicked={(event) => event.data && handleCustomerSelect(event.data)}
                    pagination={true}
                    paginationPageSize={8}
                    domLayout="normal"
                    overlayNoRowsTemplate="<span style='padding: 20px; color: #64748b;'>조회된 데이터가 없습니다</span>"
                    localeText={localeText}
                  />
                </div>
              </div>
              {(() => {
                const genderName = (g?: string) => g === 'M' ? '남' : g === 'F' ? '여' : '-';
                const custGbnName = (c?: string) => {
                  if (!c) return '-';
                  const map: Record<string, string> = { A: '일반', B: '도매', C: '임직원', D: 'VIP' };
                  return map[c] || c;
                };
                const getAvatarSrc = (gender?: string) => {
                  if (gender === 'M') return '/images/avatars/m.png';
                  if (gender === 'F') return '/images/avatars/f.png';
                  return '/images/avatars/default-avatar.png';
                };
                const sc = selectedCustomer;
                return (
                  <div className="sales-customer-details-grid">
                    <div className="sales-customer-card">
                      <div className="sales-subsection-header basic">
                        <div className="title">기본정보</div>
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
                        <div className="info-row"><span>고객명</span><span>{sc?.CUST_NM || '-'}</span></div>
                        <div className="info-row"><span>성별</span><span>{genderName(sc?.GENDER_GBN)}</span></div>
                        <div className="info-row"><span>생년월일</span><span>{sc?.CUST_BIRTH_D || '-'}</span></div>
                        <div className="info-row"><span>구분</span><span>{custGbnName(sc?.CUST_GBN)}</span></div>
                      </div>
                    </div>
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
                    <input
                      type="date"
                      className="sales-date-input"
                      placeholder="시작일"
                      value={purchaseStartDate}
                      onChange={(e) => setPurchaseStartDate(e.target.value)}
                      style={{ width: 120 }}
                    />
                    <span style={{ fontSize: 12, color: '#64748b' }}>~</span>
                    <input
                      type="date"
                      className="sales-date-input"
                      placeholder="종료일"
                      value={purchaseEndDate}
                      onChange={(e) => setPurchaseEndDate(e.target.value)}
                      style={{ width: 120 }}
                    />
                    <input
                      type="text"
                      className="sales-search-input"
                      placeholder="상품명 검색"
                      value={purchaseProductName}
                      onChange={(e) => setPurchaseProductName(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handlePurchaseHistorySearch()}
                      style={{ width: 150, height: 26, fontSize: 11, padding: '3px 8px' }}
                    />
                    <button 
                      onClick={handlePurchaseHistorySearch} 
                      className="sales-search-btn"
                      style={{ height: 26, padding: '0 10px', fontSize: 11 }}
                    >
                      <Search size={14} />
                      검색
                    </button>
                    <button onClick={() => {
                      setPurchaseStartDate('');
                      setPurchaseEndDate('');
                      setPurchaseProductName('');
                      selectedCustomer && loadCustomerHistory(selectedCustomer.CUST_ID);
                    }} className="sales-refresh-btn">새로고침</button>
                  </div>
                </div>
                <div className="ag-theme-alpine sales-grid">
                  <AgGridReact
                    rowData={purchaseHistory}
                    columnDefs={purchaseHistoryColumns as any}
                    domLayout="autoHeight"
                    overlayNoRowsTemplate="<span style='padding: 20px; color: #64748b;'>조회된 데이터가 없습니다</span>"
                    localeText={localeText}
                  />
                </div>
              </div>

              <div className="sales-pane-bottom sales-section-sales">
                <div className="sales-section-header sales">
                  <div className="title"><DollarSign size={18} /> 판매등록</div>
                  <div className="actions" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <input
                      type="date"
                      className="sales-date-input"
                      value={salesHeader.SALE_D.replace(/(\d{4})(\d{2})(\d{2})/, '$1-$2-$3')}
                      onChange={(e) => dispatch(setSalesHeader({ SALE_D: e.target.value.replace(/-/g, '') }))}
                    />
                    <button onClick={handleOpenProductSearch} className="sales-product-search-btn"><Search size={16}/> 상품검색</button>
                    <button onClick={() => dispatch(initializeNewSale())} className="sales-cancel-btn"><X size={16}/> 취소</button>
                  </div>
                </div>

                <div className="sales-barcode-section compact">
                  <div className="sales-barcode-input-group">
                    <label>바코드/상품명/상품코드</label>
                    <input
                      type="text"
                      placeholder="바코드를 스캔하거나 상품명,상품코드를 입력하세요"
                      value={barcodeInput}
                      onChange={(e) => setBarcodeInput(e.target.value)}
                      onKeyPress={handleBarcodeInput}
                      className="sales-barcode-input"
                    />
                  </div>
                  <div className="sales-quick-inputs">
                    <div className="sales-quick-input-item">
                      <label>수량</label>
                      <input type="number" min="1" value={quantityInput} onChange={(e) => setQuantityInput(e.target.value)} className="sales-qty-input" />
                    </div>
                    <div className="sales-quick-input-item">
                      <label>할인율(%)</label>
                      <input type="number" min="0" max="100" value={discountRate} onChange={(e) => setDiscountRate(e.target.value)} className="sales-discount-input" />
                    </div>
                  </div>
                </div>

                <div className="ag-theme-alpine sales-grid" style={{ height: '100%' }}>
                  <AgGridReact
                    rowData={salesItems}
                    columnDefs={salesItemsGridColumns as any}                    
                    suppressMovableColumns={true}
                    overlayNoRowsTemplate="<span style='padding: 20px; color: #64748b;'>조회된 데이터가 없습니다</span>"
                    localeText={localeText}
                  />
                </div>

                <div className="sales-summary-inline">
                  <div className="sales-summary-item"><span className="label">총 수량</span><span className="value">{saleSummary.totalQty.toLocaleString()}</span></div>
                  <div className="sales-summary-item"><span className="label">총 금액</span><span className="value">{saleSummary.totalAmt.toLocaleString()}원</span></div>
                  <div className="sales-summary-item discount"><span className="label">할인 금액</span><span className="value">-{saleSummary.discountAmt.toLocaleString()}원</span></div>
                  <div className="sales-summary-item"><span className="label">판매 금액</span><span className="value">{saleSummary.saleAmt.toLocaleString()}원</span></div>
                  <div className="sales-summary-item mileage"><span className="label"><Award size={14} /> 마일리지</span><span className="value">{saleSummary.mileagePoint.toLocaleString()}P</span></div>
                  <div className="sales-summary-sep"></div>
                  <div className="sales-summary-item total"><span className="label">최종</span><span className="value total-amount">{saleSummary.paymentAmt.toLocaleString()}원</span></div>
                  <div className="sales-summary-actions">
                    <button onClick={handlePayment} className="sales-payment-btn" disabled={salesItems.length === 0 || !selectedCustomer}>
                      <CreditCard size={16} /> 결제
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
        {/* 1. 고객 정보 탭 */}
        {activeTab === 'customer' && (
          <div className="sales-tab-content">
            <div className="sales-search-bar">
              <input
                type="text"
                placeholder="고객명 또는 전화번호 입력"
                value={customerSearchCondition.searchText}
                onChange={(e) => dispatch(setCustomerSearchCondition({ searchText: e.target.value }))}
                onKeyPress={(e) => e.key === 'Enter' && handleCustomerSearch()}
                className="sales-search-input"
              />
              <button onClick={handleCustomerSearch} className="sales-search-btn">
                <Search size={18} />
                조회
              </button>
            </div>
            
            <div className="sales-grid-container">
              <div className="ag-theme-alpine sales-grid">
                <AgGridReact
                  rowData={customerSearchResults}
                  columnDefs={customerGridColumns}
                  onRowClicked={(event) => event.data && handleCustomerSelect(event.data)}
                  pagination={true}
                  paginationPageSize={10}
                  domLayout="autoHeight"
                  overlayNoRowsTemplate="<span style='padding: 20px; color: #64748b;'>조회된 데이터가 없습니다</span>"
                  localeText={localeText}
                />
              </div>
            </div>

            {selectedCustomer && (
              <div className="sales-customer-detail">
                <h3>선택 고객 정보</h3>
                <div className="sales-detail-grid">
                  <div className="sales-detail-item">
                    <label>고객코드</label>
                    <span>{selectedCustomer.CUST_ID}</span>
                  </div>
                  <div className="sales-detail-item">
                    <label>고객명</label>
                    <span>{selectedCustomer.CUST_NM}</span>
                  </div>
                  <div className="sales-detail-item">
                    <label>전화번호</label>
                    <span className="phone-text">
                      <Phone size={14} />
                      {selectedCustomer.C_HP}
                    </span>
                  </div>
                  <div className="sales-detail-item">
                    <label>이메일</label>
                    <span className="email-text">
                      <Mail size={14} />
                      {selectedCustomer.C_EMAIL}
                    </span>
                  </div>
                  <div className="sales-detail-item">
                    <label>마일리지 잔액</label>
                    <span className="mileage-text">
                      <Award size={14} />
                      {selectedCustomer.MAIL_POINT?.toLocaleString() || 0} P
                    </span>
                  </div>
                </div>
              </div>
            )}
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
                <div className="sales-history-header">
                  <h3>{selectedCustomer.CUST_NM}님의 구매 이력</h3>
                  <span className="sales-history-count">총 {purchaseHistory.length}건</span>
                </div>
                <div className="sales-grid-container">
                  <div className="ag-theme-alpine sales-grid">
                    <AgGridReact
                      rowData={purchaseHistory}
                      columnDefs={purchaseHistoryColumns}
                      pagination={true}
                      paginationPageSize={15}
                      domLayout="autoHeight"
                      overlayNoRowsTemplate="<span style='padding: 20px; color: #64748b;'>조회된 데이터가 없습니다</span>"
                      localeText={localeText}
                    />
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        {/* 3. 상담 이력 탭 */}
        {activeTab === 'consultation' && (
          <div className="sales-tab-content">
            {!selectedCustomer ? (
              <div className="sales-empty-state">
                <MessageSquare size={48} />
                <p>고객을 먼저 선택해주세요</p>
              </div>
            ) : (
              <>
                <div className="sales-history-header">
                  <h3>{selectedCustomer.CUST_NM}님의 상담 이력</h3>
                  <button className="sales-add-consultation-btn">
                    <Plus size={18} />
                    상담 추가
                  </button>
                </div>
                <div className="sales-consultation-list">
                  {consultationHistory.map((item, index) => (
                    <div key={index} className="sales-consultation-card">
                      <div className="consultation-header">
                        <span className="consultation-date">{item.CONSULT_D}</span>
                        <span className={`consultation-type ${item.CONSULT_TYPE}`}>
                          {item.CONSULT_TYPE}
                        </span>
                        <span className="consultation-staff">{item.STAFF_NM}</span>
                      </div>
                      <div className="consultation-content">
                        <p>{item.CONSULT_CONTENT}</p>
                      </div>
                      <div className="consultation-result">
                        <span className="result-label">처리결과:</span>
                        <span className="result-value">{item.CONSULT_RESULT}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        )}

        {/* 4. 상품 검색 탭 */}
        {activeTab === 'product' && (
          <div className="sales-tab-content">
            <div className="sales-search-bar">
              <input
                type="text"
                placeholder="상품명 또는 바코드 입력"
                value={productSearchCondition.searchText}
                onChange={(e) => dispatch(setProductSearchCondition({ searchText: e.target.value }))}
                onKeyPress={(e) => e.key === 'Enter' && handleProductSearch()}
                className="sales-search-input"
              />
              <button onClick={handleProductSearch} className="sales-search-btn">
                <Search size={18} />
                조회
              </button>
            </div>
            
            <div className="sales-grid-container">
              <div className="ag-theme-alpine sales-grid">
                <AgGridReact
                  rowData={productSearchResults}
                  columnDefs={productGridColumns}
                  onRowDoubleClicked={(event) => handleAddProductFromSearch(event.data)}
                  pagination={true}
                  paginationPageSize={15}
                  domLayout="autoHeight"
                  overlayNoRowsTemplate="<span style='padding: 20px; color: #64748b;'>조회된 데이터가 없습니다</span>"
                  localeText={localeText}
                />
              </div>
            </div>
            <div className="sales-hint">
              💡 상품을 더블클릭하면 판매 전표에 추가됩니다
            </div>
          </div>
        )}

        {/* 5. 판매 등록 탭 */}
        {activeTab === 'sales' && (
          <div className="sales-tab-content sales-main">
            {/* 판매일자 변경 */}
            <div className="sales-section-header" style={{ marginBottom: 8 }}>
              <div className="title"><Calendar size={16} /> 판매일자</div>
              <div className="actions" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <input
                  type="date"
                  className="sales-date-input"
                  value={salesHeader.SALE_D.replace(/(\d{4})(\d{2})(\d{2})/, '$1-$2-$3')}
                  onChange={(e) => dispatch(setSalesHeader({ SALE_D: e.target.value.replace(/-/g, '') }))}
                />
              </div>
            </div>
            {/* 바코드 스캔 영역 */}
            <div className="sales-barcode-section">
              <div className="sales-barcode-input-group">
                <label>바코드 스캔</label>
                <input
                  type="text"
                  placeholder="바코드를 스캔하거나 입력하세요"
                  value={barcodeInput}
                  onChange={(e) => setBarcodeInput(e.target.value)}
                  onKeyPress={handleBarcodeInput}
                  className="sales-barcode-input"
                  autoFocus
                />
              </div>
              <div className="sales-quick-inputs">
                <div className="sales-quick-input-item">
                  <label>수량</label>
                  <input
                    type="number"
                    min="1"
                    value={quantityInput}
                    onChange={(e) => setQuantityInput(e.target.value)}
                    className="sales-qty-input"
                  />
                </div>
                <div className="sales-quick-input-item">
                  <label>할인율(%)</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={discountRate}
                    onChange={(e) => setDiscountRate(e.target.value)}
                    className="sales-discount-input"
                  />
                </div>
              </div>
            </div>

            {/* 판매 항목 그리드 */}
            <div className="sales-items-grid-container">
              <div className="ag-theme-alpine sales-grid">
                <AgGridReact
                  rowData={salesItems}
                  columnDefs={salesItemsGridColumns as any}
                  domLayout="autoHeight"
                  suppressMovableColumns={true}
                  overlayNoRowsTemplate="<span style='padding: 20px; color: #64748b;'>조회된 데이터가 없습니다</span>"
                  localeText={localeText}
                />
              </div>
            </div>

            {/* 합계 영역 */}
            <div className="sales-summary-panel">
              <div className="sales-summary-row">
                <span className="sales-summary-label">총 수량</span>
                <span className="sales-summary-value">{saleSummary.totalQty.toLocaleString()}</span>
              </div>
              <div className="sales-summary-row">
                <span className="sales-summary-label">총 금액</span>
                <span className="sales-summary-value">{saleSummary.totalAmt.toLocaleString()}원</span>
              </div>
              <div className="sales-summary-row discount">
                <span className="sales-summary-label">할인 금액</span>
                <span className="sales-summary-value">-{saleSummary.discountAmt.toLocaleString()}원</span>
              </div>
              <div className="sales-summary-row">
                <span className="sales-summary-label">판매 금액</span>
                <span className="sales-summary-value">{saleSummary.saleAmt.toLocaleString()}원</span>
              </div>
              <div className="sales-summary-row mileage">
                <span className="sales-summary-label">
                  <Award size={16} />
                  적립 마일리지
                </span>
                <span className="sales-summary-value">{saleSummary.mileagePoint.toLocaleString()}P</span>
              </div>
              <div className="sales-summary-divider"></div>
              <div className="sales-summary-row total">
                <span className="sales-summary-label">최종 결제금액</span>
                <span className="sales-summary-value total-amount">
                  {saleSummary.paymentAmt.toLocaleString()}원
                </span>
              </div>
            </div>

            {/* 결제 버튼 */}
            <div className="sales-action-buttons">
              <button 
                onClick={() => dispatch(initializeNewSale())} 
                className="sales-cancel-btn"
              >
                <X size={18} />
                취소
              </button>
              <button 
                onClick={handlePayment} 
                className="sales-payment-btn"
                disabled={salesItems.length === 0 || !selectedCustomer}
              >
                <CreditCard size={18} />
                결제
              </button>
            </div>
          </div>
        )}

        {/* 6. 마일리지 탭 */}
        {activeTab === 'mileage' && (
          <div className="sales-tab-content">
            {!selectedCustomer ? (
              <div className="sales-empty-state">
                <Award size={48} />
                <p>고객을 먼저 선택해주세요</p>
              </div>
            ) : (
              <>
                <div className="sales-mileage-summary">
                  <div className="mileage-card">
                    <h3>현재 마일리지</h3>
                    <div className="mileage-amount">
                      {selectedCustomer.MAIL_POINT?.toLocaleString() || 0} P
                    </div>
                  </div>
                </div>
                <div className="sales-history-header">
                  <h3>마일리지 내역</h3>
                </div>
                <div className="sales-grid-container">
                  <div className="ag-theme-alpine sales-grid">
                    <AgGridReact
                      rowData={mileageHistory}
                      columnDefs={mileageHistoryColumns}
                      pagination={true}
                      paginationPageSize={15}
                      domLayout="autoHeight"
                      overlayNoRowsTemplate="<span style='padding: 20px; color: #64748b;'>조회된 데이터가 없습니다</span>"
                      localeText={localeText}
                    />
                  </div>
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
            
            {/* 요약 카드 */}
            <div className="sales-daily-summary-cards">
              <div className="summary-card">
                <div className="card-icon" style={{ backgroundColor: '#10b981' }}>
                  <ShoppingCart size={24} />
                </div>
                <div className="card-content">
                  <div className="card-label">총 판매건수</div>
                  <div className="card-value">
                    {dailySalesStatus.reduce((sum, item) => sum + item.SALE_COUNT, 0)}건
                  </div>
                </div>
              </div>
              <div className="summary-card">
                <div className="card-icon" style={{ backgroundColor: '#667eea' }}>
                  <Package size={24} />
                </div>
                <div className="card-content">
                  <div className="card-label">총 판매수량</div>
                  <div className="card-value">
                    {dailySalesStatus.reduce((sum, item) => sum + item.SALE_QTY, 0).toLocaleString()}
                  </div>
                </div>
              </div>
              <div className="summary-card">
                <div className="card-icon" style={{ backgroundColor: '#ec4899' }}>
                  <DollarSign size={24} />
                </div>
                <div className="card-content">
                  <div className="card-label">총 판매금액</div>
                  <div className="card-value">
                    {dailySalesStatus.reduce((sum, item) => sum + item.SALE_AMT, 0).toLocaleString()}원
                  </div>
                </div>
              </div>
              <div className="summary-card">
                <div className="card-icon" style={{ backgroundColor: '#8b5cf6' }}>
                  <Award size={24} />
                </div>
                <div className="card-content">
                  <div className="card-label">적립 마일리지</div>
                  <div className="card-value">
                    {dailySalesStatus.reduce((sum, item) => sum + item.MAIL_POINT, 0).toLocaleString()}P
                  </div>
                </div>
              </div>
            </div>

            {/* 사원별 현황 그리드 */}
            <div className="sales-grid-container">
              <div className="ag-theme-alpine sales-grid">
                <AgGridReact
                  rowData={dailySalesStatus}
                  columnDefs={dailySalesColumns as any}
                  domLayout="autoHeight"
                  overlayNoRowsTemplate="<span style='padding: 20px; color: #64748b;'>조회된 데이터가 없습니다</span>"
                  localeText={localeText}
                />
              </div>
            </div>
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
        </div>
      )}

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

      <SuccessModal
        isOpen={successModal.isOpen}
        type={successModal.type}
        message={successModal.message}
        details={successModal.details}
        onClose={() => setSuccessModal({ isOpen: false, type: 'save' })}
      />

      {/* 상품검색 모달 */}
      {showProductSearchModal && (
        <div 
          className={`sales-product-search-modal ${isDragging ? 'dragging' : ''}`}
          style={{
            position: 'fixed',
            left: `${modalPosition.x}px`,
            top: `${modalPosition.y}px`,
            zIndex: 9999
          }}
          onMouseDown={handleModalMouseDown}
        >
          <div className="sales-product-search-modal-content">
            <div className="sales-product-search-modal-header">
              <h3><Search size={18} /> 상품 검색</h3>
              <button onClick={handleCloseProductSearch} className="sales-modal-close-btn">
                <X size={18} />
              </button>
            </div>

            <div className="sales-product-search-modal-body">
              <div className="sales-product-search-toolbar">
                <div className="sales-product-search-input-group">
                  <input
                    ref={productSearchInputRef}
                    type="text"
                    placeholder="상품명 또는 바코드 입력"
                    value={productSearchTerm}
                    onChange={(e) => setProductSearchTerm(e.target.value)}
                    onKeyPress={handleSearchKeyPress}
                    className="sales-product-search-input"
                  />
                  <button onClick={handleProductSearchInModal} className="sales-product-search-btn-modal">
                    <Search size={16} /> 검색
                  </button>
                </div>
              </div>

              <div className="sales-product-search-grid-wrapper">
                <CommonAgGrid
                  ref={productSearchGridRef}
                  rowData={modalProductResults}
                  columnDefs={[
                    { headerName: '상품코드', field: 'GOODS_ID', width: 100 },
                    { headerName: '상품명', field: 'GOODS_NAME', width: 200 },
                    { headerName: '브랜드', field: 'BRAND_NAME', width: 120 },
                    { headerName: '바코드', field: 'BAR_CODE', width: 150 },
                    { 
                      headerName: '판매가', 
                      field: 'CONSUMER_PRICE',
                      width: 100,
                      valueFormatter: (params: any) => params.value?.toLocaleString() || '0'
                    },
                    { headerName: '재고', field: 'STOCK_QTY', width: 80 }
                  ]}
                  enableCheckbox={true}
                  checkboxField="selected"
                  onSelectionChanged={handleProductSelectionChange}
                  height="350px"
                  className="sales-product-modal-grid"
                />
              </div>

              <div className="sales-product-search-modal-footer">
                <div className="selected-count">
                  선택한 상품: {selectedProductsForAdd.length}개
                </div>
                <button 
                  onClick={handleAddProductsToSales}
                  className="sales-add-products-btn"
                  disabled={selectedProductsForAdd.length === 0}
                >
                  <Plus size={16} /> 판매목록에 추가
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

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
                    당일 검색 이력 (샘플/프론트 전용)
                  </div>
                </div>

                <div className="sales-product-search-grid-wrapper" style={{ padding: 0 }}>
                  <div className="ag-theme-alpine" style={{ height: '360px' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                      <thead>
                        <tr style={{ background: '#f1f5f9' }}>
                          <th style={{ border: '1px solid #e5e7eb', padding: '6px' }}>시간</th>
                          <th style={{ border: '1px solid #e5e7eb', padding: '6px' }}>검색어</th>
                          <th style={{ border: '1px solid #e5e7eb', padding: '6px', width: 80 }}>검색수</th>
                          <th style={{ border: '1px solid #e5e7eb', padding: '6px', width: 120 }}>포함구분</th>
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
                              <td style={{ border: '1px solid #e5e7eb', padding: '6px' }}>{row.FIND_CUST}</td>
                              <td style={{ border: '1px solid #e5e7eb', padding: '6px', textAlign: 'right' }}>{row.FIND_CNT?.toLocaleString?.() ?? row.FIND_CNT}</td>
                              <td style={{ border: '1px solid #e5e7eb', padding: '6px', textAlign: 'center' }}>{row.P_GBN || '-'}</td>
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
    </div>
  );
};

export default SalesRegistration;
