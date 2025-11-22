/**
 * 발주 리스트 관리 컴포넌트
 * 벤더별 발주 이력, 이메일 전송 관리, 발주 상태 관리 기능을 제공합니다.
 */

import React, { useState, useEffect, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '../store/store';
import { getMenuIcon } from '../utils/menuUtils';
// AgGrid 제거 - 순수 HTML 테이블로 교체
import DateRangePicker from './common/DateRangePicker';
import CommonMultiSelect from './CommonMultiSelect';
import Pagination from './Pagination';
import EmailPasswordModal from './common/EmailPasswordModal';

// Redux 관련
import {
  searchOrderList,
  getOrderStatistics,
  getCancelReasons,
  cancelOrder,
  setSearchParams,
  setPage,
  setPageSize,
  setSelectedOrders,
  setShowCancelModal,
  setShowStatisticsModal,
  clearError,
  saveState,
} from '../store/orderListManagementSlice';
import {
  selectSearchParams,
  selectOrderList,
  selectSelectedOrders,
  selectStatistics,
  // selectCancelReasons, // 향후 취소 기능에서 사용 예정
  selectIsLoading,
  selectIsSearching,
  selectError,
  selectPagination,
  selectModalStates,
} from '../store/orderListManagementSlice';

// 타입 정의
import { OrderCancelParams, getOrderDetails } from '../services/orderListManagementService';

// 날짜 유틸리티 함수
const getDefaultDateRange = () => {
  const today = new Date();
  const thirtyDaysAgo = new Date(today);
  thirtyDaysAgo.setDate(today.getDate() - 120);
  
  const thirtyDaysLater = new Date(today);
  thirtyDaysLater.setDate(today.getDate() + 30);
  
  return {
    from: thirtyDaysAgo.toISOString().split('T')[0], // YYYY-MM-DD 형식
    to: thirtyDaysLater.toISOString().split('T')[0]
  };
};

// 스타일
import './OrderListManagement.css';
import OrderDocumentPopup from './OrderDocumentPopup';

// 유틸리티 함수
const formatDate = (dateString: string): string => {
  if (!dateString) return '';
  
  let date: Date;
  
  // YYYYMMDD 형식 처리
  if (dateString.length === 8 && /^\d{8}$/.test(dateString)) {
    const year = dateString.substring(0, 4);
    const month = dateString.substring(4, 6);
    const day = dateString.substring(6, 8);
    date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
  } else {
    // 일반 날짜 형식 처리
    date = new Date(dateString);
  }
  
  if (isNaN(date.getTime())) return '';
  
  // 요일 배열
  const weekdays = ['일', '월', '화', '수', '목', '금', '토'];
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const weekday = weekdays[date.getDay()];
  
  return `${year}-${month}-${day}(${weekday})`;
};

// D+- nday 포맷 함수
const formatDateDifference = (targetDateStr: string, baseDateStr?: string): string => {
  if (!targetDateStr) return '';
  
  const targetDate = new Date(
    targetDateStr.length === 8 
      ? `${targetDateStr.substring(0, 4)}-${targetDateStr.substring(4, 6)}-${targetDateStr.substring(6, 8)}`
      : targetDateStr
  );
  const baseDate = baseDateStr 
    ? new Date(baseDateStr.length === 8 
        ? `${baseDateStr.substring(0, 4)}-${baseDateStr.substring(4, 6)}-${baseDateStr.substring(6, 8)}`
        : baseDateStr)
    : new Date();
  
  const diffTime = targetDate.getTime() - baseDate.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  if (diffDays === 0) return 'D-Day';
  if (diffDays > 0) return `D-${diffDays}`; // 미래일 때 D-
  return `D+${Math.abs(diffDays)}`; // 과거일 때 D+
};

const formatCurrency = (amount: number): string => {
  if (!amount) return '0';
  return new Intl.NumberFormat('ko-KR').format(amount);
};

const formatNumber = (num: number): string => {
  if (!num) return '0';
  return new Intl.NumberFormat('ko-KR').format(num);
};

// 이메일 전송일시를 YYYY-MM-DD 시:분 형식으로 포맷팅하는 함수
const formatEmailSendDateTime = (dateTimeStr: string | Date): string => {
  if (!dateTimeStr) return '';
  
  try {
    // 다양한 날짜 형식 처리
    let date: Date;
    
    // 이미 Date 객체인 경우
    if (dateTimeStr instanceof Date) {
      date = dateTimeStr;
    }
    // ISO 형식 (YYYY-MM-DDTHH:mm:ss.sssZ)인 경우
    else if (dateTimeStr.includes('T')) {
      date = new Date(dateTimeStr);
    }
    // 공백으로 구분된 형식 (YYYY-MM-DD HH:mm:ss)인 경우
    else if (dateTimeStr.includes(' ')) {
      date = new Date(dateTimeStr);
    }
    // YYYYMMDDHHmmss 형식인 경우
    else if (dateTimeStr.length >= 14) {
      const year = dateTimeStr.substring(0, 4);
      const month = dateTimeStr.substring(4, 6);
      const day = dateTimeStr.substring(6, 8);
      const hour = dateTimeStr.substring(8, 10);
      const minute = dateTimeStr.substring(10, 12);
      date = new Date(`${year}-${month}-${day}T${hour}:${minute}:00`);
    }
    // YYYYMMDD 형식인 경우 (시간 정보 없음)
    else if (dateTimeStr.length === 8) {
      const year = dateTimeStr.substring(0, 4);
      const month = dateTimeStr.substring(4, 6);
      const day = dateTimeStr.substring(6, 8);
      date = new Date(`${year}-${month}-${day}T00:00:00`);
    }
    // 기타 형식 시도
    else {
      date = new Date(dateTimeStr);
    }
    
    // 유효하지 않은 날짜인 경우
    if (isNaN(date.getTime())) {
      return String(dateTimeStr); // 원본을 문자열로 변환하여 반환
    }
    
    // YYYY-MM-DD 시:분 형식으로 포맷팅 (24시간 형식)
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hour = String(date.getHours()).padStart(2, '0');
    const minute = String(date.getMinutes()).padStart(2, '0');
    
    return `${year}-${month}-${day} ${hour}:${minute}`;
  } catch (error) {
    console.warn('이메일 전송일시 포맷팅 오류:', error, '원본:', dateTimeStr);
    return String(dateTimeStr); // 오류 시 원본을 문자열로 변환하여 반환
  }
};

// 발주상태를 CSS 클래스명으로 변환하는 함수
const getStatusClass = (status: string): string => {
  switch (status) {
    case '주문접수': return 'pending';
    case '진행중': return 'progress';
    case '완료': return 'completed';
    case '취소됨': return 'cancelled';
    default: return 'pending';
  }
};

// 긴급 상태 판단 함수 (발주일과 입고요구일의 간격 기준)
const isUrgentOrder = (orderDate: string, requireDate: string): boolean => {
  if (!orderDate || !requireDate) return false;
  
  // YYYYMMDD 형식 처리
  const formatDate = (dateStr: string) => {
    if (dateStr.length === 8) {
      return `${dateStr.substring(0, 4)}-${dateStr.substring(4, 6)}-${dateStr.substring(6, 8)}`;
    }
    return dateStr;
  };
  
  const orderDateObj = new Date(formatDate(orderDate));
  const requireDateObj = new Date(formatDate(requireDate));
  
  // 시간을 00:00:00으로 설정하여 정확한 날짜 비교
  orderDateObj.setHours(0, 0, 0, 0);
  requireDateObj.setHours(0, 0, 0, 0);
  
  // 발주일과 입고요구일의 간격 계산 (일 단위)
  const diffTime = requireDateObj.getTime() - orderDateObj.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  // 간격이 3일 이내면 긴급 (0, 1, 2, 3일)
  return diffDays >= 0 && diffDays <= 3;
};

// OrderCard 컴포넌트 제거 - 테이블 형태로 변경

// 취소 사유 옵션
const CANCEL_REASONS = [
  { code: 'CUSTOMER_REQUEST', name: '고객 요청' },
  { code: 'INVENTORY_SHORTAGE', name: '재고 부족' },
  { code: 'PRICE_CHANGE', name: '가격 변경' },
  { code: 'VENDOR_ISSUE', name: '공급업체 문제' },
  { code: 'OTHER', name: '기타' },
];

// 발주 상태 옵션 (멀티선택용)
const ORDER_STATUS_OPTIONS = [
  { value: '주문접수', label: '주문접수' },
  { value: '진행중', label: '진행중' },
  { value: '완료', label: '완료' },
  { value: '취소됨', label: '취소됨' },
];

// 이메일 전송 상태는 공통코드에서 동적으로 로드

// 벤더 옵션 (동적으로 로드)

const normalizeSearchParams = (rawParams: Record<string, any>) => {
  const normalized = { ...rawParams };

  if (!normalized.agentId) {
    delete normalized.agentId;
  }
  if (!normalized.vendorId) {
    delete normalized.vendorId;
  }

  if (!Array.isArray(normalized.orderStatus) || normalized.orderStatus.length === 0) {
    delete normalized.orderStatus;
  }
  if (!Array.isArray(normalized.emailStatus) || normalized.emailStatus.length === 0) {
    delete normalized.emailStatus;
  }
  if (!Array.isArray(normalized.agentIds) || normalized.agentIds.length === 0) {
    delete normalized.agentIds;
  }
  if (!Array.isArray(normalized.vendorIds) || normalized.vendorIds.length === 0) {
    delete normalized.vendorIds;
  }

  if (!normalized.searchText) {
    delete normalized.searchText;
  }

  return normalized;
};

const OrderListManagement: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  
  // Redux 상태 (안전한 접근)
  const searchParams = useSelector(selectSearchParams) || {};
  const orderList = useSelector(selectOrderList) || [];
  const selectedOrders = useSelector(selectSelectedOrders) || [];
  const statistics = useSelector(selectStatistics);
  // const cancelReasons = useSelector(selectCancelReasons); // 향후 취소 기능에서 사용 예정
  const isLoading = useSelector(selectIsLoading) || false;
  const isSearching = useSelector(selectIsSearching) || false;
  const error = useSelector(selectError);
  const pagination = useSelector(selectPagination) || { pageNum: 1, pageSize: 20, totalCount: 0, totalPages: 1 };
  const modalStates = useSelector(selectModalStates) || {};
  
  // 현재 활성 탭 정보 가져오기
  const { tabs, activeTabId } = useSelector((state: RootState) => state.tabs);
  const currentTab = tabs.find(tab => tab.id === activeTabId);
  
  // 현재 로그인한 사용자 정보 가져오기
  const { user } = useSelector((state: RootState) => state.auth);
  
  // 이메일 전송 관련 상태
  const [showEmailPasswordModal, setShowEmailPasswordModal] = useState(false);
  const [emailSending, setEmailSending] = useState(false);
  const [currentOrderForEmail, setCurrentOrderForEmail] = useState<any>(null);
  
  // 디버깅용 로그
  console.log('🔍 [OrderListManagement] Redux state:', {
    orderListLength: orderList.length,
    totalCount: pagination.totalCount,
    pageNum: pagination.pageNum,
    pageSize: pagination.pageSize,
    totalPages: pagination.totalPages,
    isSearching,
    isLoading,
    statistics: statistics
  });
  
  // 실제 orderList 데이터 확인
  if (orderList.length > 0) {
    console.log('🔍 [OrderListManagement] 첫 번째 order 데이터:', orderList[0]);
  }
  
  // 상품 상세 정보 저장
  const [orderDetails, setOrderDetails] = useState<Map<string, any[]>>(new Map());
  
  // 발주서 팝업 상태
  const [orderPopup, setOrderPopup] = useState<{
    isOpen: boolean;
    order: any | null;
  }>({
    isOpen: false,
    order: null
  });
  
  // 카드 접기/펼치기 상태 관리 - 초기 로딩시 모든 카드가 접힌 상태
  const [collapsedCards, setCollapsedCards] = useState<Set<string>>(new Set());
  
  // 선택된 상품들 관리 (상품별 고유 식별자: ORDER_D-ORDER_SEQU-ORDER_NO)
  const [selectedProducts, setSelectedProducts] = useState<Set<string>>(new Set());

  // orderList가 변경될 때마다 모든 카드를 접힌 상태로 초기화
  useEffect(() => {
    const newCollapsedCards = new Set(orderList.map((order: any, index) => 
      `${order.ORDER_D || 'unknown'}-${order.ORDER_SEQU || index}-${order.VENDOR_ID || 'unknown'}`
    ));
    setCollapsedCards(newCollapsedCards);
  }, [orderList]);

  // 상품 상세 정보 가져오기
  const fetchOrderDetails = async (orderD: string, orderSequ: number, vendorId: string): Promise<any[]> => {
    const orderKey = `${orderD}-${orderSequ}-${vendorId}`;
    
    console.log('🔍 [OrderListManagement] fetchOrderDetails 호출됨:', { orderD, orderSequ, vendorId, orderKey });
    
    // 이미 가져온 정보가 있으면 중복 요청 방지
    if (orderDetails.has(orderKey)) {
      console.log('🔍 [OrderListManagement] 이미 가져온 정보가 있음, 중복 요청 방지');
      return orderDetails.get(orderKey) || [];
    }
    
    try {
      console.log('🔍 [OrderListManagement] 상품 상세 정보 요청 시작:', { orderD, orderSequ, vendorId });
      const details = await getOrderDetails(orderD, orderSequ, vendorId);
      console.log('🔍 [OrderListManagement] 상품 상세 정보 응답:', details);
      
      if (details.success && details.data) {
        console.log('🔍 [OrderListManagement] 상품 데이터 상세:', details.data);
        console.log('🔍 [OrderListManagement] 첫 번째 상품 데이터:', details.data[0]);
        // 백엔드에서 이미 VENDOR_ID로 필터링된 데이터를 받음
        setOrderDetails(prev => new Map(prev.set(orderKey, details.data)));
        return details.data;
      } else {
        console.log('❌ [OrderListManagement] 상품 데이터 없음:', details);
        return [];
      }
    } catch (error) {
      console.error('❌ [OrderListManagement] 상품 상세 정보 조회 실패:', error);
      return [];
    }
  };

  // 테스트 데이터 제거 - 빈 배열로 초기화
  // 백엔드에서 벤더별로 별도 행을 반환하므로 중복 제거 불필요
  const baseOrderList = orderList;

  
  // 기본 날짜 범위 가져오기
  const defaultDateRange = getDefaultDateRange();
  
  // 로컬 상태 (Redux 상태와 동기화)
  const [searchForm, setSearchForm] = useState<any>(() => {
    const defaultForm = {
      orderDateFrom: defaultDateRange.from,
      orderDateTo: defaultDateRange.to,
      requireDateFrom: '',
      requireDateTo: '',
      searchText: '', // 항상 빈 문자열로 초기화
      unreceivedOnly: false,
      agentId: '',
      vendorId: '',
      emailStatus: [],
      orderStatus: [],
      pageSize: 20,
      pageNum: 1,
      sortColumn: 'orderD',
      sortDirection: 'DESC',
    };
    
    // Redux 상태에서 searchText가 'admin'이면 빈 문자열로 강제 설정
    const cleanSearchParams = { ...searchParams };
    if (cleanSearchParams.searchText === 'admin') {
      cleanSearchParams.searchText = '';
      // Redux 상태도 즉시 업데이트
      setTimeout(() => {
        dispatch(setSearchParams({ searchText: '' }));
      }, 0);
    }
    
    return {
      ...defaultForm,
      ...cleanSearchParams, // Redux 상태를 덮어쓰기
    };
  });
  
  // Redux 상태와 로컬 상태 동기화
  useEffect(() => {
    setSearchForm((prev: any) => {
      // Redux 상태에서 searchText가 'admin'이면 빈 문자열로 강제 설정
      const cleanSearchParams = { ...searchParams };
      if (cleanSearchParams.searchText === 'admin') {
        cleanSearchParams.searchText = '';
        // Redux 상태도 즉시 업데이트
        dispatch(setSearchParams({ searchText: '' }));
      }
      
      return {
        ...prev,
        ...cleanSearchParams,
        orderDateFrom: cleanSearchParams.orderDateFrom || defaultDateRange.from,
        orderDateTo: cleanSearchParams.orderDateTo || defaultDateRange.to,
      };
    });
  }, [searchParams, defaultDateRange.from, defaultDateRange.to, dispatch]);
  
  // 컴포넌트 언마운트 시 상태 저장
  useEffect(() => {
    return () => {
      dispatch(saveState());
    };
  }, [dispatch]);

  // localStorage 초기화 함수 (개발용)
  const clearLocalStorage = () => {
    localStorage.removeItem('orderListManagement');
    console.log('localStorage 초기화 완료');
    window.location.reload(); // 페이지 새로고침
  };

  // 개발자 도구에서 사용할 수 있도록 전역 함수로 등록
  useEffect(() => {
    (window as any).clearOrderListStorage = clearLocalStorage;
    return () => {
      delete (window as any).clearOrderListStorage;
    };
  }, []);
  
  
  const [cancelForm, setCancelForm] = useState<OrderCancelParams>({
    orderD: '',
    orderSequ: 0,
    cancelReason: '',
    cancelDetail: '',
    userId: '',
  });
  
  // const [gridApi, setGridApi] = useState<any>(null);
  
  // 컴포넌트 마운트 시 초기화
  useEffect(() => {
    // 취소 사유 목록 로드
    dispatch(getCancelReasons());
    
    // 초기 검색 실행
    handleSearch();
  }, [dispatch]);

  // 발주상세가 펼쳐진 발주들의 상품 정보 가져오기
  useEffect(() => {
    baseOrderList.forEach((order: any, index: number) => {
      const orderId = `${order.ORDER_D || 'unknown'}-${order.ORDER_SEQU || index}-${order.VENDOR_ID || 'unknown'}`;
      const orderKey = `${order.ORDER_D}-${order.ORDER_SEQU}-${order.VENDOR_ID}`;
      
      // 발주상세가 펼쳐져 있고, 상품 정보가 없으면 가져오기
      if (!collapsedCards.has(orderId) && !orderDetails.has(orderKey)) {
        fetchOrderDetails(order.ORDER_D, order.ORDER_SEQU, order.VENDOR_ID);
      }
    });
  }, [collapsedCards]); // collapsedCards만 의존성으로 설정


  // 상태 변경 시 자동 저장
  useEffect(() => {
    // 상태가 변경될 때마다 저장 (debounce 적용)
    const timeoutId = setTimeout(() => {
      dispatch(saveState());
    }, 500); // 500ms 지연

    return () => clearTimeout(timeoutId);
  }, [searchParams, pagination.pageNum, pagination.pageSize, dispatch]);
  
  // 검색 실행
  const handleSearch = useCallback(() => {
    const mergedParams = { ...searchForm, ...searchParams, pageNum: 1 };

    setSearchForm((prev: any) => ({ ...prev, pageNum: 1 }));
    dispatch(setPage(1));

    const normalizedParams = normalizeSearchParams(mergedParams);
    dispatch(searchOrderList(normalizedParams));
    // dispatch(getOrderStatistics(normalizedParams));
  }, [dispatch, searchForm, searchParams]);
  
  // 검색 조건 변경
  const handleSearchFormChange = (field: string, value: any) => {
    setSearchForm((prev: any) => {
      const next = { ...prev, [field]: value };
      if (field !== 'pageNum') {
        next.pageNum = 1;
      }
      return next;
    });

    const updates: Record<string, any> = { [field]: value };
    if (field !== 'pageNum') {
      updates.pageNum = 1;
      dispatch(setPage(1));
    }

    dispatch(setSearchParams(updates));
  };
  
  
  // 검색 조건 초기화
  const handleResetSearch = () => {
    const currentDefaultDateRange = getDefaultDateRange(); // 현재 시점의 기본 날짜 범위
    const resetForm: any = {
      orderDateFrom: currentDefaultDateRange.from,
      orderDateTo: currentDefaultDateRange.to,
      requireDateFrom: '',
      requireDateTo: '',
      searchText: '',
      unreceivedOnly: false,
      agentId: '',
      agentIds: [],
      vendorId: '',
      vendorIds: [],
      emailStatus: [],
      orderStatus: [],
      pageSize: 20,
      pageNum: 1,
      sortColumn: 'orderD',
      sortDirection: 'DESC',
    };
    setSearchForm(resetForm);
    dispatch(setSearchParams(resetForm));
    dispatch(setPageSize(20));
    dispatch(setPage(1));
  };
  
  // 체크박스 선택 처리
  const handleRowSelect = (orderId: string, isMainRow: boolean) => {
    if (!isMainRow) return; // 상세 행은 선택 불가
    
    const isSelected = selectedOrders.includes(orderId);
    if (isSelected) {
      dispatch(setSelectedOrders(selectedOrders.filter(id => id !== orderId)));
    } else {
      dispatch(setSelectedOrders([...selectedOrders, orderId]));
    }
  };
  
  // 전체 접기/펼치기 상태
  const [allCollapsed, setAllCollapsed] = useState(true); // 첫 로딩시 접힌 상태로 시작

  // 카드 토글 함수
  const toggleCardCollapse = (orderId: string) => {
    const newCollapsed = new Set(collapsedCards);
    if (newCollapsed.has(orderId)) {
      newCollapsed.delete(orderId);
    } else {
      newCollapsed.add(orderId);
    }
    setCollapsedCards(newCollapsed);
    
    // 스크롤 이동 기능
    setTimeout(() => {
      const element = document.getElementById(`order-card-${orderId}`);
      if (element) {
        const isCollapsing = newCollapsed.has(orderId);
        
        element.scrollIntoView({ 
          behavior: 'smooth', 
          block: isCollapsing ? 'start' : 'center', // 접힐 때는 상단, 펼칠 때는 중앙
          inline: 'nearest'
        });
      }
    }, 150); // 애니메이션 완료 후 스크롤
  };

  // 발주서 보기
  const handleViewOrder = (order: any) => {
    console.log('발주서 보기:', order);
    console.log('🔍 [OrderListManagement] 발주서 벤더 정보:');
    console.log('  - VENDOR_NM:', order.VENDOR_NM);
    console.log('  - VENDOR_EMAIL:', order.VENDOR_EMAIL);
    console.log('  - VENDOR_TEL:', order.VENDOR_TEL);
    console.log('🔍 [OrderListManagement] order 객체의 모든 키:', Object.keys(order));
    
    // 상품 정보가 있는지 확인하고 없으면 가져오기
    const orderKey = `${order.ORDER_D}-${order.ORDER_SEQU}-${order.VENDOR_ID}`;
    const existingDetails = orderDetails.get(orderKey);
    
    if (existingDetails && existingDetails.length > 0) {
      // 이미 상품 정보가 있으면 그대로 사용
      setOrderPopup({
        isOpen: true,
        order: {
          ...order,
          products: existingDetails
        }
      });
    } else {
      // 상품 정보가 없으면 먼저 가져오기
      fetchOrderDetails(order.ORDER_D, order.ORDER_SEQU, order.VENDOR_ID);
      setOrderPopup({
        isOpen: true,
        order: order
      });
    }
  };

  // 발주서 팝업 닫기
  const handleCloseOrderPopup = () => {
    setOrderPopup({
      isOpen: false,
      order: null
    });
  };

  // 상품 정보가 업데이트되면 팝업도 업데이트
  useEffect(() => {
    if (orderPopup.isOpen && orderPopup.order) {
      const orderKey = `${orderPopup.order.ORDER_D}-${orderPopup.order.ORDER_SEQU}-${orderPopup.order.VENDOR_ID}`;
      const updatedDetails = orderDetails.get(orderKey);
      
      if (updatedDetails && updatedDetails.length > 0) {
        setOrderPopup(prev => ({
          ...prev,
          order: {
            ...prev.order,
            products: updatedDetails
          }
        }));
      }
    }
  }, [orderDetails, orderPopup.isOpen, orderPopup.order]);

  // 전체 접기 함수
  const collapseAllCards = () => {
    const allOrderIds = baseOrderList.map((order: any, index: number) => `${order.ORDER_D || 'unknown'}-${order.ORDER_SEQU || index}-${order.VENDOR_ID || 'unknown'}`);
    setCollapsedCards(new Set(allOrderIds));
    setAllCollapsed(true);
  };

  // 전체 펼치기 함수
  const expandAllCards = () => {
    setCollapsedCards(new Set());
    setAllCollapsed(false);
  };

  // 상품 선택 핸들러
  const handleProductSelection = (productUniqueId: string, isSelected: boolean) => {
    setSelectedProducts(prev => {
      const newSet = new Set(prev);
      if (isSelected) {
        newSet.add(productUniqueId);
      } else {
        newSet.delete(productUniqueId);
      }
      return newSet;
    });
  };

  // 상품이 출고되었거나 입고되었는지 확인하는 함수
  const isValidDateValue = (value: unknown): boolean => {
    if (value === null || value === undefined) return false;

    // 숫자값은 문자열로 변환 후 검증
    const normalized = String(value).trim();

    if (normalized === '' || normalized === '0') return false;

    // 특정 자리수 날짜 포맷(YYYYMMDD)일 때 0으로 채워진 값은 무효 처리
    if (normalized === '00000000' || normalized === '19000101') return false;

    return true;
  };

  const isProductDelivered = (product: any) => {
    const isOutDateValid = isValidDateValue(product.OUT_D);
    const isInDateValid = isValidDateValue(product.IN_D);

    // OUT_D (출고일자) 또는 IN_D (입고일자)가 유효한 날짜면 출고/입고된 것으로 간주
    return isOutDateValid || isInDateValid;
  };

  // =============================================
  // 발주상세 액션 핸들러들
  // =============================================

  // 선택된 상품들 취소 핸들러
  const handleCancelSelectedProducts = async (order: any) => {
    try {
      if (selectedProducts.size === 0) {
        alert('취소할 상품을 선택해주세요.');
        return;
      }

      console.log('선택된 상품들 취소 요청:', { order, selectedProducts: Array.from(selectedProducts) });
      
      const cancelReason = prompt('취소 사유를 입력하세요:');
      if (!cancelReason) return;

      // 선택된 상품들의 ORDER_NO 추출
      const selectedOrderNos = Array.from(selectedProducts)
        .filter(productId => productId.startsWith(`${order.ORDER_D}-${order.ORDER_SEQU}-`))
        .map(productId => productId.split('-')[2]); // ORDER_NO 부분만 추출

      if (selectedOrderNos.length === 0) {
        alert('이 발주의 상품이 선택되지 않았습니다.');
        return;
      }

      // 선택된 상품 중 출고/입고된 상품이 있는지 확인
      const orderKey = `${order.ORDER_D}-${order.ORDER_SEQU}-${order.VENDOR_ID}`;
      const productDetails = orderDetails.get(orderKey) || [];
      
      const deliveredProducts = selectedOrderNos.filter(orderNo => {
        const product = productDetails.find((p: any) => p.ORDER_NO === orderNo);
        return product && isProductDelivered(product);
      });

      if (deliveredProducts.length > 0) {
        alert('출고되었거나 입고된 상품은 취소할 수 없습니다.');
        return;
      }

      const response = await fetch('/api/order-list-management', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          MODE: 'CANCEL_ORDER_PRODUCTS',
          ORDER_D: order.ORDER_D,
          ORDER_SEQU: order.ORDER_SEQU,
          ORDER_NOS: selectedOrderNos,
          CANCEL_REASON_CODE: '01', // 기본 취소 사유 코드
          CANCEL_REASON_DETAIL: cancelReason,
          VENDOR_NOTIFY_YN: 'N',
          USER_ID: user?.userId || 'system'
        })
      });

      const result = await response.json();
      
      if (result.RESULT === 'SUCCESS') {
        alert(`${selectedOrderNos.length}개 상품이 성공적으로 취소되었습니다.`);
        // 선택된 상품들 초기화
        setSelectedProducts(new Set());
        // 발주 리스트 새로고침
        handleSearch();
      } else {
        alert(`상품 취소 실패: ${result.MESSAGE}`);
      }
    } catch (error) {
      console.error('상품 취소 오류:', error);
      alert('상품 취소 중 오류가 발생했습니다.');
    }
  };

  // 선택된 상품들 복구 핸들러
  const handleRestoreSelectedProducts = async (order: any) => {
    try {
      if (selectedProducts.size === 0) {
        alert('복구할 상품을 선택해주세요.');
        return;
      }

      console.log('선택된 상품들 복구 요청:', { order, selectedProducts: Array.from(selectedProducts) });
      
      if (!confirm('선택된 취소된 상품들을 복구하시겠습니까?')) return;

      // 선택된 상품들의 ORDER_NO 추출
      const selectedOrderNos = Array.from(selectedProducts)
        .filter(productId => productId.startsWith(`${order.ORDER_D}-${order.ORDER_SEQU}-`))
        .map(productId => productId.split('-')[2]); // ORDER_NO 부분만 추출

      if (selectedOrderNos.length === 0) {
        alert('이 발주의 상품이 선택되지 않았습니다.');
        return;
      }

      const response = await fetch('/api/order-list-management', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          MODE: 'RESTORE_ORDER_PRODUCTS',
          ORDER_D: order.ORDER_D,
          ORDER_SEQU: order.ORDER_SEQU,
          ORDER_NOS: selectedOrderNos,
          USER_ID: user?.userId || 'system'
        })
      });

      const result = await response.json();
      
      if (result.RESULT === 'SUCCESS') {
        alert(`${selectedOrderNos.length}개 상품이 성공적으로 복구되었습니다.`);
        // 선택된 상품들 초기화
        setSelectedProducts(new Set());
        // 발주 리스트 새로고침
        handleSearch();
      } else {
        alert(`상품 복구 실패: ${result.MESSAGE}`);
      }
    } catch (error) {
      console.error('상품 복구 오류:', error);
      alert('상품 복구 중 오류가 발생했습니다.');
    }
  };

  // 이메일 전송 핸들러 (비밀번호 입력 모달 표시)
  const handleResendEmail = (order: any) => {
    setCurrentOrderForEmail(order);
    setShowEmailPasswordModal(true);
  };

  // 이메일 패스워드 확인 후 실제 전송
  const handleEmailPasswordConfirm = async (password: string) => {
    if (!currentOrderForEmail) return;
    
    setEmailSending(true);
    setShowEmailPasswordModal(false);

    try {
      // 취소되지 않고 출고/입고되지 않은 상품만 필터링
      // 🔐 필수 키 정보 정규화
      const normalizedOrderDate = currentOrderForEmail.ORDER_D ?? currentOrderForEmail.orderD ?? '';
      const normalizedOrderSequ = String(currentOrderForEmail.ORDER_SEQU ?? currentOrderForEmail.orderSequ ?? '');
      const normalizedVendorId = String(currentOrderForEmail.VENDOR_ID ?? currentOrderForEmail.vendorId ?? '');

      if (!normalizedOrderDate || !normalizedOrderSequ || !normalizedVendorId) {
        alert('발주 기본 정보가 올바르지 않아 이메일을 전송할 수 없습니다.');
        return;
      }

      const orderKey = `${normalizedOrderDate}-${normalizedOrderSequ}-${normalizedVendorId}`;

      let productDetails = orderDetails.get(orderKey) || [];

      // 📦 상품 정보가 아직 로딩되지 않았다면 즉시 조회 시도
      if (productDetails.length === 0) {
        productDetails = await fetchOrderDetails(
          normalizedOrderDate,
          Number.isNaN(Number(normalizedOrderSequ)) ? 0 : Number(normalizedOrderSequ),
          normalizedVendorId
        );
      }
      
      const sendableProducts = productDetails.filter((product: any) => {
        // 취소되지 않고 출고/입고되지 않은 상품만
        return !isProductDelivered(product);
      });

      if (sendableProducts.length === 0) {
        alert('전송 가능한 상품이 없습니다. (모든 상품이 취소되었거나 출고/입고 완료됨)');
        return;
      }

      // 이메일 전송 요청 데이터 구성 (OrderSendModal과 동일한 구조)
      const emailRequest = {
        serverConfig: {
          smtpServer: "mail.topvel.co.kr",
          smtpPort: 25,
          username: "topvel@topvel.co.kr",
          password: password,
          useSSL: false,
          fromEmail: "topvel@topvel.co.kr",
          fromName: "topvel@topvel.co.kr"
        },
        userId: user?.userId || 'SYSTEM', // 사용자 ID 추가
        orderInfo: {
          orderDate: currentOrderForEmail.ORDER_D || '',
          orderSequ: currentOrderForEmail.ORDER_SEQU || '',
          orderNumber: currentOrderForEmail.SLIP_NO || '',
          requireDate: currentOrderForEmail.REQUIRE_D || '',
          storeName: currentOrderForEmail.STORE_NM || 'HD Sync 매장',
          address: currentOrderForEmail.STORE_ADDR || '',
          recipient: currentOrderForEmail.RECV_PERSON || '',
          phoneNumber: currentOrderForEmail.STORE_TEL || ''
        },
        vendors: [{
          vendorId: currentOrderForEmail.VENDOR_ID || '',
          vendorName: currentOrderForEmail.VENDOR_NM || '',
          vendorEmail: currentOrderForEmail.VENDOR_EMAIL || '',
          vendorTel: currentOrderForEmail.VENDOR_TEL || '',
          vendorAddr: currentOrderForEmail.VENDOR_ADDR || '',
          // 매장 정보 (배송지 정보)
          storeId: currentOrderForEmail.AGENT_ID || '',
          storeName: currentOrderForEmail.STORE_NM || 'HD Sync 매장',
          storeAddress: currentOrderForEmail.STORE_ADDR || '',
          storePhone: currentOrderForEmail.STORE_TEL || '',
          recipient: currentOrderForEmail.RECV_PERSON || '',
          items: sendableProducts.map((product: any) => ({
            goodsId: product.GOODS_ID || '',
            goodsIdBrand: product.GOODS_ID_BRAND || '',
            goodsName: product.GOODS_NM || '',
            brandName: product.BRAND_NAME || '',
            orderQty: product.ORDER_QTY || 0,
            sobiJaDan: product.SOBIJA_DAN || 0,
            sobiJaTot: product.SOBIJA_TOT || 0,
            orderMemo: product.ORDER_MEMO || ''
          })),
          totalQty: sendableProducts.reduce((sum: number, p: any) => sum + (p.ORDER_QTY || 0), 0),
          totalAmount: sendableProducts.reduce((sum: number, p: any) => sum + (p.SOBIJA_TOT || 0), 0),
          totalSobiJaAmount: sendableProducts.reduce((sum: number, p: any) => sum + (p.SOBIJA_TOT || 0), 0),
          itemCount: sendableProducts.length
        }]
      };

      // 디버깅을 위한 로그 출력
      console.log('🔍 [OrderListManagement] 이메일 전송 요청 데이터:', {
        orderInfo: emailRequest.orderInfo,
        vendorCount: emailRequest.vendors.length,
        vendorInfo: emailRequest.vendors[0] ? {
          vendorId: emailRequest.vendors[0].vendorId,
          vendorName: emailRequest.vendors[0].vendorName,
          vendorEmail: emailRequest.vendors[0].vendorEmail,
          storeName: emailRequest.vendors[0].storeName,
          storeAddress: emailRequest.vendors[0].storeAddress,
          recipient: emailRequest.vendors[0].recipient,
          itemCount: emailRequest.vendors[0].items.length,
          items: emailRequest.vendors[0].items.slice(0, 2) // 처음 2개만 로그
        } : null
      });

      // 원본 데이터도 로그 출력
      console.log('🔍 [OrderListManagement] 원본 발주 데이터:', {
        VENDOR_NM: currentOrderForEmail.VENDOR_NM,
        VENDOR_EMAIL: currentOrderForEmail.VENDOR_EMAIL,
        STORE_NM: currentOrderForEmail.STORE_NM,
        STORE_ADDR: currentOrderForEmail.STORE_ADDR,
        STORE_TEL: currentOrderForEmail.STORE_TEL,
        RECV_PERSON: currentOrderForEmail.RECV_PERSON,
        모든키: Object.keys(currentOrderForEmail)
      });

      const response = await fetch('/api/email/send-orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(emailRequest),
      });

      if (!response.ok) {
        throw new Error('이메일 전송에 실패했습니다.');
      }

      const result = await response.json();

      if (result.success) {
        alert('이메일이 성공적으로 전송되었습니다.');
        // 발주 리스트 새로고침
        handleSearch();
      } else {
        alert(`이메일 전송 실패: ${result.message}`);
      }
    } catch (error) {
      console.error('이메일 전송 오류:', error);
      alert('이메일 전송 중 오류가 발생했습니다.');
    } finally {
      setEmailSending(false);
      setCurrentOrderForEmail(null);
    }
  };


  // 상태 배지 렌더링 함수
  const renderStatusBadge = (status: string) => {
    const getBadgeClass = (status: string) => {
      switch (status) {
        case '주문접수': return 'status-badge status-pending';
        case '진행중': return 'status-badge status-progress';
        case '완료': return 'status-badge status-completed';
        case '취소됨': return 'status-badge status-cancelled';
        default: return 'status-badge status-default';
      }
    };
    
    return (
      <span className={getBadgeClass(status)}>
        {status}
      </span>
    );
  };

  // 이메일 상태 렌더링 함수
  const renderEmailStatus = (order: any) => {
    const { EMAIL_SEND_YN: emailSendYn, EMAIL_FAIL_CNT: emailFailCnt } = order;
    
    const getEmailStatusClass = () => {
      if (emailSendYn === 'Y' && emailFailCnt === 0) {
        return 'email-badge email-sent';
      } else if (emailSendYn === 'N' || emailFailCnt > 0) {
        return 'email-badge email-failed';
      } else {
        return 'email-badge email-not-sent';
      }
    };
    
    const getEmailStatusText = () => {
      if (emailSendYn === 'Y' && emailFailCnt === 0) {
        return '전송완료';
      } else if (emailSendYn === 'N' || emailFailCnt > 0) {
        return `실패(${emailFailCnt})`;
      } else {
        return '미전송';
      }
    };
    
    return (
      <span className={getEmailStatusClass()}>
        {getEmailStatusText()}
      </span>
    );
  };




  
  // 그리드 준비 완료
  // const onGridReady = (_params: GridReadyEvent) => {
  //   // setGridApi(params.api);
  // };
  
  // 선택 변경
  // const onSelectionChanged = (event: SelectionChangedEvent) => {
  //   const selectedNodes = event.api.getSelectedNodes();
  //   const selectedIds = selectedNodes.map(node => `${node.data.orderD}-${node.data.orderSequ}`);
  //   dispatch(setSelectedOrders(selectedIds));
  // };

  // 체크박스 클릭 이벤트 처리
  // const handleCheckboxClick = (event: React.MouseEvent, orderId: string) => {
  //   event.stopPropagation();
  //   const isSelected = selectedOrders.includes(orderId);
  //   if (isSelected) {
  //     dispatch(setSelectedOrders(selectedOrders.filter(id => id !== orderId)));
  //   } else {
  //     dispatch(setSelectedOrders([...selectedOrders, orderId]));
  //   }
  // };
  
  // 상세보기
  // const handleShowDetail = (order: OrderListItem) => {
  //   dispatch(setSelectedOrderForDetail(order));
  //   dispatch(setShowDetailModal(true));
  // };
  
  // 취소 모달 표시
  // const handleShowCancelModal = (order: OrderListItem) => {
  //   setCancelForm({
  //     orderD: order.orderD,
  //     orderSequ: order.orderSequ,
  //     cancelReason: '',
  //     cancelDetail: '',
  //     userId: 'current_user', // 실제로는 현재 사용자 ID
  //   });
  //   dispatch(setSelectedOrderForCancel(order));
  //   dispatch(setShowCancelModal(true));
  // };
  
  // 취소 실행 (모달용)
  const handleCancelOrderModal = () => {
    if (!cancelForm.cancelReason) {
      alert('취소 사유를 선택해주세요.');
      return;
    }
    
    dispatch(cancelOrder(cancelForm));
  };
  
  // 이메일 전송
  // const handleSendEmail = (order: OrderListItem) => {
  //   dispatch(sendOrderEmail({
  //     orderD: order.orderD,
  //     orderSequ: order.orderSequ,
  //   }));
  // };
  
  // 인쇄
  // const handlePrint = (order: OrderListItem) => {
  //   // 인쇄 로직 구현
  //   console.log('인쇄:', order);
  // };
  
  // 엑셀 다운로드
  const handleExcelDownload = () => {
    // 엑셀 다운로드 로직 구현
    console.log('엑셀 다운로드');
  };
  
  // const handleShowStatistics = () => {
  //   // 통계 모달을 열기 전에 최신 통계 데이터를 다시 로드
  //   const params = { ...searchForm, ...searchParams };
  //   dispatch(getOrderStatistics(params));
  //   dispatch(setShowStatisticsModal(true));
  // };
  
  // 페이지 변경 (새로운 페이지네이션 컴포넌트용)
  const handlePageChange = useCallback((page: number, pageSize: number) => {
    console.log('페이지 변경 요청:', page, '페이지 크기:', pageSize);

    const isPageSizeChanged = pageSize !== searchParams.pageSize;
    const nextPage = isPageSizeChanged ? 1 : page;
    const mergedParams = { ...searchForm, ...searchParams, pageNum: nextPage, pageSize };
    const normalizedParams = normalizeSearchParams(mergedParams);

    setSearchForm((prev: any) => ({ ...prev, pageNum: nextPage, pageSize }));

    if (isPageSizeChanged) {
      dispatch(setPageSize(pageSize));
      dispatch(setPage(1));
    } else {
      dispatch(setPage(page));
    }

    dispatch(searchOrderList(normalizedParams));
  }, [dispatch, searchForm, searchParams]);
  
  // 발주 선택/해제 - AgGrid에서 자동 처리됨
  // const handleOrderSelect = (orderId: string) => {
  //   const isSelected = selectedOrders.includes(orderId);
  //   if (isSelected) {
  //     dispatch(setSelectedOrders(selectedOrders.filter(id => id !== orderId)));
  //   } else {
  //     dispatch(setSelectedOrders([...selectedOrders, orderId]));
  //   }
  // };
  
  


  

  
  // 페이지 크기 변경 (현재 미사용)
  // const handlePageSizeChange = (size: number) => {
  //   dispatch(setPageSize(size));
  //   handleSearch();
  // };
  
  // 정렬 변경 (현재 미사용)
  // const handleSortChange = (column: string, direction: 'ASC' | 'DESC') => {
  //   dispatch(setSorting({ column, direction }));
  //   handleSearch();
  // };
  
  // 에러 표시
  if (error) {
    return (
      <div className="olm-container">
        <div style={{ 
          padding: '20px', 
          textAlign: 'center', 
          color: '#dc3545',
          backgroundColor: '#f8d7da',
          border: '1px solid #f5c6cb',
          borderRadius: '4px',
          margin: '20px'
        }}>
          <h3>오류가 발생했습니다</h3>
          <p>{error}</p>
          <button 
            className="olm-btn olm-btn-primary"
            onClick={() => dispatch(clearError())}
          >
            다시 시도
          </button>
        </div>
      </div>
    );
  }
  
  return (
    <div className="olm-container order-list-management">
      {/* 탑 구역 - 검색 조건 및 버튼 */}
      <div className="top-section">
        {/* 페이지 타이틀 */}
        <h1 className="page-title">
          {currentTab?.menuIcon ? (
            React.createElement(getMenuIcon(currentTab.menuIcon), { size: 16 })
          ) : (
            <i className="fas fa-list"></i>
          )}
          발주 리스트 관리
        </h1>
        
        {/* 검색 조건 */}
        <div className="search-conditions">
          <div className="search-row">
            <div className="search-item">
              <label>발주일자:</label>
              <DateRangePicker
                startDate={searchForm.orderDateFrom || ''}
                endDate={searchForm.orderDateTo || ''}
                onStartDateChange={(date) => handleSearchFormChange('orderDateFrom', date)}
                onEndDateChange={(date) => handleSearchFormChange('orderDateTo', date)}
                placeholder="발주일자 범위를 선택하세요"
                className="olm-date-range-picker"
              />
            </div>
            <div className="search-item">
              <label>매장:</label>
              <CommonMultiSelect
                commonCodeType="stores"
                selectedValues={searchForm.agentIds || []}
                onSelectionChange={(values) => handleSearchFormChange('agentIds', values)}
                placeholder="매장을 선택하세요"
                className="olm-multi-select"
              />
            </div>
            <div className="search-item">
              <label>납품업체:</label>
              <CommonMultiSelect
                commonCodeType="vendors"
                selectedValues={searchForm.vendorIds || []}
                onSelectionChange={(values) => handleSearchFormChange('vendorIds', values)}
                placeholder="납품업체를 선택하세요"
                className="olm-multi-select"
              />
            </div>
            <div className="search-item">
              <label>발주상태:</label>
              <CommonMultiSelect
                options={ORDER_STATUS_OPTIONS}
                selectedValues={searchForm.orderStatus || []}
                onSelectionChange={(values) => handleSearchFormChange('orderStatus', values)}
                placeholder="발주상태를 선택하세요"
                className="olm-multi-select"
              />
            </div>
          </div>
          <div className="search-row">
            <div className="search-item">
              <label>이메일전송상태:</label>
              <CommonMultiSelect
                commonCodeType="emailStatus"
                selectedValues={searchForm.emailStatus || []}
                onSelectionChange={(values) => handleSearchFormChange('emailStatus', values)}
                placeholder="이메일전송상태를 선택하세요"
                className="olm-multi-select"
              />
            </div>
            <div className="search-item">
              <label>키워드:</label>
              <input
                type="text"
                className="olm-form-control"
                placeholder="발주번호, 매장명, 벤더명 검색"
                value={searchForm.searchText || ''}
                onChange={(e) => handleSearchFormChange('searchText', e.target.value)}
              />
            </div>
            <div className="search-item checkbox">
              <label>
                <input
                  type="checkbox"
                  checked={searchForm.unreceivedOnly || false}
                  onChange={(e) => handleSearchFormChange('unreceivedOnly', e.target.checked)}
                />
                미입고/미완료자료만
              </label>
            </div>
          </div>
        </div>
        
        {/* 액션 버튼 */}
        <div className="action-buttons">
          <div className="right-buttons">
            <button
              className="olm-btn olm-btn-secondary"
              onClick={handleResetSearch}
            >
              <i className="fas fa-undo"></i> 초기화
            </button>
            <button
              className="olm-btn olm-btn-primary"
              onClick={handleSearch}
              disabled={isSearching}
            >
              <i className="fas fa-search"></i> 조회
            </button>
            {/* <button
              className="olm-btn olm-btn-info"
              onClick={handleShowStatistics}
              disabled
              title="통계 기능 비활성화됨"
            >
              <i className="fas fa-chart-bar"></i> 통계
            </button> */}
            {/* <button
              className="olm-btn olm-btn-excel"
              onClick={handleExcelDownload}
              disabled
              title="엑셀 다운로드 비활성화됨"
            >
              <i className="fas fa-file-excel"></i> 엑셀
            </button> */}
          </div>
        </div>
      </div>
      
      {/* 메인 테이블 영역 */}
      <div className="olm-main-section">
        <h3>
          <i className="fas fa-list"></i>
          발주 리스트 ({baseOrderList.length}건)
        </h3>
        
        <div className="olm-grid-summary">
          <span>선택된 건수: {selectedOrders.length}건</span>
          <span>총 건수: {formatNumber(baseOrderList.length)}건</span>
          <span>페이지: {pagination.pageNum}/{pagination.totalPages}</span>
          
          {/* 전체 접기/펼치기 버튼 */}
          <div className="bulk-toggle-buttons">
            <button
              className="bulk-toggle-btn collapse-all"
              onClick={collapseAllCards}
              disabled={allCollapsed}
              title="모든 발주 카드를 한번에 접기"
            >
              <i className="fas fa-chevron-up"></i>
              전체 접기
            </button>
            <button
              className="bulk-toggle-btn expand-all"
              onClick={expandAllCards}
              disabled={!allCollapsed && collapsedCards.size === 0}
              title="모든 발주 카드를 한번에 펼치기"
            >
              <i className="fas fa-chevron-down"></i>
              전체 펼치기
            </button>
          </div>
        </div>
        
        {/* 발주 내역 리스트 */}
        <div className="order-list-container">
          {baseOrderList.length === 0 ? (
            <div className="no-data-message">
              <i className="fas fa-inbox"></i>
              <p>조회된 발주 데이터가 없습니다.</p>
            </div>
          ) : (
            <div className="order-list">
              {baseOrderList.map((order: any, index: number) => {
                const orderId = `${order.ORDER_D || 'unknown'}-${order.ORDER_SEQU || index}-${order.VENDOR_ID || 'unknown'}`;
                return (
                <div
                  key={orderId}
                  id={`order-card-${orderId}`}
                  className={`order-list-item ${selectedOrders.includes(orderId) ? 'selected' : ''} ${!collapsedCards.has(orderId) ? 'expanded' : ''}`}
                >
                  {/* 리스트 헤더 */}
                  <div 
                    className="order-list-header"
                    onClick={() => toggleCardCollapse(orderId)}
                    title="클릭하여 상세 정보 펼치기/접기"
                  >
                    <div className="order-list-content">
                      {/* 디스플레이 넘버 */}
                      <div className="display-number-section" title="순번">
                        <span className={`display-number status-${getStatusClass(order.ORDER_STATUS)}`}>
                          {(pagination.pageNum - 1) * pagination.pageSize + index + 1}
                        </span>
                      </div>

                      <input
                        type="checkbox"
                        checked={selectedOrders.includes(orderId)}
                        onChange={(e) => {
                          e.stopPropagation();
                          handleRowSelect(orderId, true);
                        }}
                        onClick={(e) => {
                          e.stopPropagation();
                        }}
                        className="order-checkbox"
                        title="발주 선택/해제"
                      />
                      
                      {/* 발주번호 및 상태 */}
                      <div className="order-number-section" title="발주번호, 발주상태">
                        <span className="order-number">{order.SLIP_NO}</span>
                        {renderStatusBadge(order.ORDER_STATUS)}
                      </div>

                      {/* 벤더 정보 */}
                      <div className="vendor-section" title="벤더명">
                        <span className="vendor-name">
                          <i className="fas fa-building vendor-icon"></i>
                          {order.VENDOR_NM}
                        </span>
                        {(order.VENDOR_TEL || order.AGENT_TEL) && (
                          <span className="vendor-tel">{order.VENDOR_TEL || order.AGENT_TEL}</span>
                        )}
                        {/* 디버깅용 로그 */}
                        {console.log('🔍 [OrderListManagement] 마스터 테이블 벤더 정보:', {
                          VENDOR_NM: order.VENDOR_NM,
                          VENDOR_EMAIL: order.VENDOR_EMAIL,
                          VENDOR_TEL: order.VENDOR_TEL,
                          AGENT_EMAIL: order.AGENT_EMAIL,
                          AGENT_TEL: order.AGENT_TEL,
                          모든키: Object.keys(order)
                        })}
                      </div>

                      {/* 매장 정보 */}
                      <div className="store-section" title="매장명">
                        <span className="store-name">
                          <i className="fas fa-store store-icon"></i>
                          {order.STORE_NM}
                        </span>
                      </div>

                      {/* 총금액 및 수량 */}
                      <div className="amount-qty-section" title="발주 총금액 및 총 수량">
                        <span className={`amount-value ${(order.SOBIJA_TOT || 0) < 0 ? 'negative' : ''}`}>
                          {formatCurrency(order.SOBIJA_TOT || 0)}원
                        </span>
                        <span className={`total-qty ${(order.TOTAL_QTY || 0) < 0 ? 'negative' : ''}`}>
                          {formatNumber(order.TOTAL_QTY || 0)}개
                        </span>
                      </div>

                      {/* 날짜 정보 */}
                      <div className="date-section" title="발주일 및 입고요구일 (D-Day 기준)">
                        <span className="order-date">발주: {formatDate(order.ORDER_D)}</span>
                        <span className="require-date">
                          요구: {formatDate(order.REQUIRE_D)}
                        </span>
                        <span className={`d-day ${formatDateDifference(order.REQUIRE_D).includes('D+') ? 'd-plus' : 'd-minus'}`}>
                          {formatDateDifference(order.REQUIRE_D)}
                        </span>
                      </div>

                      {/* 긴급 상태 */}
                      <div className="urgent-section" title="긴급 여부">
                        {(order.PRIORITY === '긴급' || isUrgentOrder(order.ORDER_D, order.REQUIRE_D)) && (
                          <span className="urgent-badge" title="긴급 발주">긴급</span>
                        )}
                      </div>

                      {/* 이메일 전송일시 */}
                      <div className="email-datetime-section" title="이메일 전송일시 및 횟수">
                        {order.EMAIL_SEND_DT && (
                          <div className="email-datetime">
                            <span className="email-send-date">
                              {formatEmailSendDateTime(order.EMAIL_SEND_DT).split(' ')[0]}
                            </span>
                            <span className="email-send-time">
                              {formatEmailSendDateTime(order.EMAIL_SEND_DT).split(' ')[1]}
                              ({order.EMAIL_SEND_CNT || 1}회전송)
                            </span>
                          </div>
                        )}
                      </div>

                      {/* 이메일 전송 상태 */}
                      <div className="email-status-section" title="이메일 전송 상태">
                        {renderEmailStatus(order)}
                      </div>

                      {/* 발주서 버튼 */}
                      <div className="document-section">
                        <button
                          className="olm-btn olm-btn-secondary document-btn"
                          title="발주서 보기"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleViewOrder(order);
                          }}
                        >
                          <i className="fas fa-file-alt"></i>
                          발주서
                        </button>
                      </div>

                      {/* 펼치기/접기 버튼 */}
                      <div className="expand-section">
                        <button
                          className="expand-toggle"
                          title={collapsedCards.has(orderId) ? '펼치기' : '접기'}
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleCardCollapse(orderId);
                          }}
                        >
                          <i className={`fas ${collapsedCards.has(orderId) ? 'fa-chevron-right' : 'fa-chevron-down'}`}></i>
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* 아코디언 상세 내용 */}
                  {!collapsedCards.has(orderId) && (
                    <div className="order-list-details">

                      {/* 상품 정보 테이블 */}
                      <div className="products-section">
                        <div className="products-title-row">
                          <h4 className="products-title">
                            <i className="fas fa-box"></i>
                            발주 상품 정보
                          </h4>
                          <div className="products-action-buttons">
                            {/* 취소 버튼 - 완료되지 않고 취소되지 않은 발주에만 표시 */}
                            {order.ORDER_STATUS !== '완료' && order.CANCEL_GBN !== 'CA' && (
                              <button
                                className="olm-btn olm-btn-danger"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleCancelSelectedProducts(order);
                                }}
                                disabled={selectedProducts.size === 0}
                                title="선택된 상품 취소"
                              >
                                <i className="fas fa-times-circle"></i>
                                취소
                              </button>
                            )}

                            {/* 복구 버튼 - 취소된 발주에만 표시 */}
                            {(order.CANCEL_GBN === 'CA' || order.CANCEL_GBN === 'CP') && (
                              <button
                                className="olm-btn olm-btn-success"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleRestoreSelectedProducts(order);
                                }}
                                disabled={selectedProducts.size === 0}
                                title="선택된 상품 복구"
                              >
                                <i className="fas fa-undo"></i>
                                복구
                              </button>
                            )}

                            {/* 전송/재전송 버튼 - 미전송이거나 전송 실패한 경우 표시 */}
                            {(() => {
                              // 출고확정 여부: 미입고 여부가 'N'이면 모든 상품이 출고됨
                              const hasUnshippedProducts = order.UNRECEIVED_YN !== 'N';
                              
                              // 이메일 전송 조건: 미전송이거나 전송 실패했거나 전송일시가 없는 경우
                              const canSendEmail = (order.EMAIL_SEND_YN === 'N' || order.EMAIL_FAIL_CNT > 0 || !order.EMAIL_SEND_DT);
                              
                              // 재전송 조건: 이미 전송한 적이 있고 아직 출고확정되지 않은 경우
                              const canResendEmail = (order.EMAIL_SEND_YN === 'Y' && order.EMAIL_SEND_DT && hasUnshippedProducts);
                              
                              const shouldShow = hasUnshippedProducts && (canSendEmail || canResendEmail);
                              
                              console.log('🔍 [OrderListManagement] 이메일 버튼 표시 조건 확인:', {
                                orderId: `${order.ORDER_D}-${order.ORDER_SEQU}`,
                                EMAIL_SEND_YN: order.EMAIL_SEND_YN,
                                EMAIL_FAIL_CNT: order.EMAIL_FAIL_CNT,
                                EMAIL_SEND_DT: order.EMAIL_SEND_DT,
                                UNRECEIVED_YN: order.UNRECEIVED_YN,
                                hasUnshippedProducts,
                                canSendEmail,
                                canResendEmail,
                                shouldShow
                              });
                              
                              return shouldShow;
                            })() && (
                              <button
                                className="olm-btn olm-btn-primary"
                                disabled={order.UNRECEIVED_YN === 'N'}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleResendEmail(order);
                                }}
                                title={(() => {
                                  const hasUnshippedProducts = order.UNRECEIVED_YN !== 'N';
                                  const canSendEmail = (order.EMAIL_SEND_YN === 'N' || order.EMAIL_FAIL_CNT > 0 || !order.EMAIL_SEND_DT);
                                  const canResendEmail = (order.EMAIL_SEND_YN === 'Y' && order.EMAIL_SEND_DT && hasUnshippedProducts);
                                  
                                  if (!hasUnshippedProducts) {
                                    return '출고확정된 발주입니다.';
                                  } else if (canSendEmail) {
                                    return "발주서 전송";
                                  } else if (canResendEmail) {
                                    return "발주서 재전송";
                                  } else {
                                    return "발주서 전송";
                                  }
                                })()}
                              >
                                <i className="fas fa-envelope"></i>
                                {(() => {
                                  const hasUnshippedProducts = order.UNRECEIVED_YN !== 'N';
                                  const canSendEmail = (order.EMAIL_SEND_YN === 'N' || order.EMAIL_FAIL_CNT > 0 || !order.EMAIL_SEND_DT);
                                  const canResendEmail = (order.EMAIL_SEND_YN === 'Y' && order.EMAIL_SEND_DT && hasUnshippedProducts);
                                  
                                  if (!hasUnshippedProducts) {
                                    return '출고확정됨';
                                  } else if (canSendEmail) {
                                    return '발주서전송';
                                  } else if (canResendEmail) {
                                    return '발주서재전송';
                                  } else {
                                    return '발주서전송';
                                  }
                                })()}
                              </button>
                            )}
                          </div>
                        </div>
                        <div className="products-table-container">
                          <table className="products-table">
                            <thead>
                              <tr>
                                <th title="상품 선택" className="text-center">
                                  <input
                                    type="checkbox"
                                    checked={(() => {
                                      const orderKey = `${order.ORDER_D}-${order.ORDER_SEQU}-${order.VENDOR_ID}`;
                                      const productDetails = orderDetails.get(orderKey) || [];
                                      const selectableProducts = productDetails.filter((p: any) => !isProductDelivered(p));
                                      const selectedCount = selectableProducts.filter((p: any) => {
                                        const productUniqueId = `${order.ORDER_D}-${order.ORDER_SEQU}-${p.ORDER_NO}`;
                                        return selectedProducts.has(productUniqueId);
                                      }).length;
                                      return selectableProducts.length > 0 && selectedCount === selectableProducts.length;
                                    })()}
                                    onChange={(e) => {
                                      e.stopPropagation();
                                      const orderKey = `${order.ORDER_D}-${order.ORDER_SEQU}-${order.VENDOR_ID}`;
                                      const productDetails = orderDetails.get(orderKey) || [];
                                      const selectableProducts = productDetails.filter((p: any) => !isProductDelivered(p));
                                      
                                      if (e.target.checked) {
                                        // 전체 선택
                                        selectableProducts.forEach((product: any) => {
                                          const productUniqueId = `${order.ORDER_D}-${order.ORDER_SEQU}-${product.ORDER_NO}`;
                                          setSelectedProducts(prev => new Set([...prev, productUniqueId]));
                                        });
                                      } else {
                                        // 전체 해제
                                        selectableProducts.forEach((product: any) => {
                                          const productUniqueId = `${order.ORDER_D}-${order.ORDER_SEQU}-${product.ORDER_NO}`;
                                          setSelectedProducts(prev => {
                                            const newSet = new Set(prev);
                                            newSet.delete(productUniqueId);
                                            return newSet;
                                          });
                                        });
                                      }
                                    }}
                                    title="전체 선택/해제 (출고/입고된 상품 제외)"
                                  />
                                </th>
                                <th title="상품의 브랜드명">브랜드명</th>
                                <th title="브랜드에서 관리하는 상품 고유 코드">브랜드상품코드</th>
                                <th title="상품의 정식 명칭">상품명</th>
                                <th title="발주한 상품의 수량" className="text-right">발주수량</th>
                                <th title="소비자에게 판매하는 가격" className="text-right">소비자가</th>
                                <th title="소비자가 × 발주수량" className="text-right">소비자금액</th>
                                <th title="상품의 출고일자" className="text-center">출고일자</th>
                                <th title="상품의 입고일자" className="text-center">입고일자</th>
                                <th title="발주 시 특이사항이나 요청사항">발주메모</th>
                              </tr>
                            </thead>
                            <tbody>
                              {(() => {
                                const productDetails = orderDetails.get(orderId) || [];
                                console.log('🔍 [OrderListManagement] 상품 데이터 렌더링:', { orderId, productDetails });
                                
                                if (productDetails.length === 0) {
                                  return (
                                    <tr>
                                      <td colSpan={10} className="no-products-message">
                                        <i className="fas fa-box-open"></i>
                                        상품 정보를 불러오는 중...
                                      </td>
                                    </tr>
                                  );
                                }
                                
                                return productDetails.map((product: any, index: number) => {
                                  // 상품별 고유 식별자: ORDER_D + ORDER_SEQU + ORDER_NO
                                  const productUniqueId = `${order.ORDER_D}-${order.ORDER_SEQU}-${product.ORDER_NO}`;
                                  
                                  return (
                                    <tr key={index}>
                                      <td className="product-checkbox">
                                        <input
                                          type="checkbox"
                                          id={`product-${productUniqueId}`}
                                          checked={selectedProducts.has(productUniqueId)}
                                          disabled={isProductDelivered(product)}
                                          onChange={(e) => {
                                            e.stopPropagation();
                                            if (!isProductDelivered(product)) {
                                              handleProductSelection(productUniqueId, e.target.checked);
                                            }
                                          }}
                                          title={isProductDelivered(product) ? 
                                            `출고/입고 완료된 상품은 취소할 수 없습니다. (출고: ${product.OUT_D || '-'}, 입고: ${product.IN_D || '-'})` : 
                                            '상품 선택/해제'
                                          }
                                        />
                                      </td>
                                      <td className="product-brand">{product.BRAND_NAME || '-'}</td>
                                      <td className="product-code">{product.GOODS_ID_BRAND || '-'}</td>
                                      <td className="product-name">{product.GOODS_NM || '-'}</td>
                                      <td className={`product-qty text-right ${(product.ORDER_QTY || 0) < 0 ? 'negative' : ''}`}>
                                        {formatNumber(product.ORDER_QTY || 0)}
                                      </td>
                                      <td className={`product-price text-right ${(product.SOBIJA_DAN || 0) < 0 ? 'negative' : ''}`}>
                                        {formatCurrency(product.SOBIJA_DAN || 0)}원
                                      </td>
                                      <td className={`product-total text-right ${(product.SOBIJA_TOT || 0) < 0 ? 'negative' : ''}`}>
                                        {formatCurrency(product.SOBIJA_TOT || 0)}원
                                      </td>
                                      <td className="product-out-date">{product.OUT_D || '-'}</td>
                                      <td className="product-in-date">{product.IN_D || '-'}</td>
                                      <td className="product-memo">{product.ORDER_MEMO || '-'}</td>
                                    </tr>
                                  );
                                });
                              })()}
                              <tr className="total-row">
                                <td colSpan={4} className="total-label">총계</td>
                                {(() => {
                                  const totalQty = (orderDetails.get(orderId) || []).reduce((sum: number, p: any) => sum + (p.ORDER_QTY || 0), 0);
                                  const totalAmount = (orderDetails.get(orderId) || []).reduce((sum: number, p: any) => sum + (p.SOBIJA_TOT || 0), 0);
                                  return (
                                    <>
                                      <td className={`total-qty text-right ${totalQty < 0 ? 'negative' : ''}`}>{formatNumber(totalQty)}</td>
                                      <td className="total-price text-right">-</td>
                                      <td className={`total-amount text-right ${totalAmount < 0 ? 'negative' : ''}`}>{formatCurrency(totalAmount)}원</td>
                                      <td className="total-out-date">-</td>
                                      <td className="total-in-date">-</td>
                                      <td className="total-memo">-</td>
                                    </>
                                  );
                                })()}
                              </tr>
                            </tbody>
                          </table>
                        </div>
                      </div>

                      {/* 기타 정보 */}
                      <div className="details-grid">
                        {/* 상품 정보 */}
                        {order.detailType === 'product' && (
                          <div className="detail-section product-detail">
                            <h4 className="detail-title">
                              <i className="fas fa-box"></i>
                              상품 정보
                            </h4>
                            <div className="detail-content">
                              <p><strong>상품명:</strong> {order.goodsNm}</p>
                              <p><strong>상품코드:</strong> {order.goodsId}</p>
                              <p><strong>발주수량:</strong> {order.orderQty}</p>
                              <p><strong>소비자가:</strong> {order.sobiJaDan?.toLocaleString()}원</p>
                              <p><strong>발주단가:</strong> {order.orderDan?.toLocaleString()}원</p>
                              <p><strong>발주금액:</strong> {order.orderTot?.toLocaleString()}원</p>
                              {order.orderMemo && (
                                <p><strong>메모:</strong> {order.orderMemo}</p>
                              )}
                              <div className="status-info">
                                <p><strong>출고일:</strong> {order.outD || '미출고'}</p>
                                <p><strong>예정일:</strong> {order.estD || '미정'}</p>
                                <p><strong>입고일:</strong> {order.inD || '미입고'}</p>
                              </div>
                            </div>
                          </div>
                        )}

                        <div className="detail-section">
                          <h4 className="detail-title">
                            <i className="fas fa-building"></i>
                            벤더 정보
                          </h4>
                          <div className="detail-content">
                            <p><strong>{order.VENDOR_NM}</strong> ({order.VENDOR_ID})</p>
                            <p>브랜드: {order.BRAND_NM}</p>
                            <p><i className="fas fa-envelope"></i> {order.VENDOR_EMAIL || 'N/A'}</p>
                            <p><i className="fas fa-phone"></i> {order.VENDOR_TEL || 'N/A'}</p>
                          </div>
                        </div>

                        <div className="detail-section">
                          <h4 className="detail-title">
                            <i className="fas fa-store"></i>
                            매장 정보
                          </h4>
                          <div className="detail-content">
                            <p><strong>{order.STORE_NM}</strong></p>
                            <p>{order.STORE_ADDR}</p>
                            <p><i className="fas fa-phone"></i> {order.STORE_TEL}</p>
                            <p><i className="fas fa-user"></i> 담당: {order.RECV_PERSON}</p>
                          </div>
                        </div>

                        <div className="detail-section">
                          <h4 className="detail-title">
                            <i className="fas fa-envelope"></i>
                            이메일 상태
                          </h4>
                          <div className="detail-content">
                            {renderEmailStatus(order)}
                            {order.EMAIL_SEND_DT && (
                              <p>전송일시: {formatEmailSendDateTime(order.EMAIL_SEND_DT)}</p>
                            )}
                            {order.FAIL_REASON && (
                              <p className="error-text">실패사유: {order.FAIL_REASON}</p>
                            )}
                          </div>
                        </div>

                        {order.REMARKS && (
                          <div className="detail-section">
                            <h4 className="detail-title">
                              <i className="fas fa-sticky-note"></i>
                              비고
                            </h4>
                            <div className="detail-content">
                              <p>{order.REMARKS}</p>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* 액션 버튼들 - 조회 버튼 라인으로 이동됨 */}
                    </div>
                  )}
                </div>
                );
              })}
            </div>
          )}
        </div>
        
        {/* 독립적인 페이지네이션 */}
        <Pagination
          totalCount={pagination.totalCount}
          currentPage={pagination.pageNum}
          pageSize={pagination.pageSize}
          onPageChange={handlePageChange}
          pageSizeOptions={[10, 20, 50, 100]}
          showPageSizeSelector={true}
          showPageInfo={true}
          className="olm-pagination"
        />
      </div>
      

      {/* 취소 모달 */}
      {modalStates.showCancelModal && (
        <div className="olm-modal-overlay">
          <div className="olm-modal">
            <div className="olm-modal-header">
              <h3>발주 취소</h3>
              <button
                className="olm-modal-close"
                onClick={() => dispatch(setShowCancelModal(false))}
              >
                <i className="fas fa-times"></i>
              </button>
            </div>
            <div className="olm-modal-body">
              <div style={{ marginBottom: '16px' }}>
                <strong>발주번호:</strong> {(modalStates.selectedOrderForCancel as any)?.SLIP_NO}
              </div>
              <div style={{ marginBottom: '16px' }}>
                <label>취소 사유:</label>
                <select
                  className="olm-select"
                  value={cancelForm.cancelReason || ''}
                  onChange={(e) => setCancelForm(prev => ({ ...prev, cancelReason: e.target.value }))}
                  style={{ width: '100%', marginTop: '4px' }}
                >
                  <option value="">선택해주세요</option>
                  {CANCEL_REASONS.map(reason => (
                    <option key={reason.code} value={reason.code}>
                      {reason.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label>상세 사유:</label>
                <textarea
                  className="olm-form-control"
                  value={cancelForm.cancelDetail || ''}
                  onChange={(e) => setCancelForm(prev => ({ ...prev, cancelDetail: e.target.value }))}
                  placeholder="취소 사유를 상세히 입력해주세요"
                  rows={3}
                  style={{ width: '100%', marginTop: '4px' }}
                />
              </div>
            </div>
            <div className="olm-modal-footer">
              <button
                className="olm-modal-btn olm-modal-btn-cancel"
                onClick={() => dispatch(setShowCancelModal(false))}
              >
                취소
              </button>
              <button
                className="olm-modal-btn olm-modal-btn-confirm"
                onClick={handleCancelOrderModal}
                disabled={isLoading}
              >
                확인
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* 통계 모달 (비활성화됨) */}
      {/*
      {modalStates.showStatisticsModal && (
        <div className="olm-modal-overlay">
          ...
        </div>
      )}
      */}

      {/* 발주서 팝업 */}
      <OrderDocumentPopup
        isOpen={orderPopup.isOpen}
        order={orderPopup.order}
        onClose={handleCloseOrderPopup}
      />

      {/* 이메일 패스워드 입력 모달 */}
      <EmailPasswordModal
        isOpen={showEmailPasswordModal}
        onClose={() => setShowEmailPasswordModal(false)}
        onConfirm={handleEmailPasswordConfirm}
        emailAddress="topvel@topvel.co.kr"
        loading={emailSending}
      />
    </div>
  );
};

export default OrderListManagement;
