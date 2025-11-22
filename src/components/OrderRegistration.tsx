import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { AgGridReact } from 'ag-grid-react';
import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-alpine.css';
import { useButtonTextPermission } from '../hooks/usePermissions';
import { MENU_IDS } from '../constants/menuIds';
import { RootState } from '../store/store';
import { getMenuIcon } from '../utils/menuUtils';
import {
  setMasterData,
  setSearchCondition,
  setSelectedProducts,
  setProductList,
  setOrderList,
  setOrderSlipList,
  setOrderSummary,
  addChangedRow,
  removeChangedRow,
  clearChangedRows,
  setOriginalMasterData,
  setMasterFieldsDisabled,
  setOrderTypeDisabled,
  setOrderDateDisabled,
  setShipmentRequestDateDisabled,
  setStoreCodeDisabled,
  setFocusTarget,
  setCodeData,
  initializeScreen
} from '../store/orderRegistrationSlice';
import { List, FileText, Receipt, Mail } from 'lucide-react';
import DateRangePicker from './common/DateRangePicker';
import HybridDatePicker from './common/HybridDatePicker';
import CommonAgGrid, { CommonAgGridRef } from './CommonAgGrid';
import CommonMultiSelect from './CommonMultiSelect';
import { commonCodeService, CommonCodeOption } from '../services/commonCodeService';
import OrderSendModal from './common/OrderSendModal';
import { popupSearchService } from '../services/popupSearchService';
import { getPreviousOrders, getOrderDetails, OrderService } from '../services/orderService';
import { orderService } from '../services/orderService';
import { calculatePricesRounded, PriceCalculationInput } from '../utils/priceCalculationUtils';
import ConfirmationModal from './common/ConfirmationModal';
import SuccessModal from './common/SuccessModal';
import './OrderRegistration.css';

// 발주등록 컴포넌트
const OrderRegistration: React.FC = () => {
  
  // Redux dispatch 및 상태 선택
  const dispatch = useDispatch();
  const { user } = useSelector((state: RootState) => state.auth);
  const orderState = useSelector((state: RootState) => state.orderRegistration);
  const currentAgentId = user?.agentId;
  const currentStoreId = user?.storeId;
  
  // 현재 활성 탭 정보 가져오기
  const { tabs, activeTabId } = useSelector((state: RootState) => state.tabs);
  const currentTab = tabs.find(tab => tab.id === activeTabId);
    
  // 버튼별 권한 체크 (메뉴 ID 상수 사용)
  const savePermission = useButtonTextPermission(MENU_IDS.ORDER_REGISTRATION, '저장');
  const deletePermission = useButtonTextPermission(MENU_IDS.ORDER_REGISTRATION, '삭제');
  const viewPermission = useButtonTextPermission(MENU_IDS.ORDER_REGISTRATION, '조회');
  // const exportPermission = useButtonTextPermission(MENU_IDS.ORDER_REGISTRATION, '내보내기');
  
  // 권한 체크 완료

  // 권한 로딩 중일 때는 버튼을 비활성화
  const isPermissionLoading = savePermission.loading || deletePermission.loading || viewPermission.loading;
  
  // Redux 상태에서 데이터 가져오기
  const {
    masterData,
    searchCondition,
    selectedProducts,
    productList,
    orderList,
    orderSlipList,
    orderSummary,
    changedRows,
    originalMasterData,
    isMasterFieldsDisabled,
    isOrderTypeDisabled,
    isOrderDateDisabled,
    isShipmentRequestDateDisabled,
    isStoreCodeDisabled,
    codeData,
    isInitialized,
    focusTarget
  } = orderState;

  // 마스터 데이터 개별 변수들 (편의를 위해)
  const {
    orderDate,
    shipmentRequestDate,
    storeCode,
    saleRate,
    orderNumber,
    orderSequ,
    orderType,
    remarks,
    address,
    recipient,
    phoneNumber
  } = masterData;

  // 검색 조건 개별 변수들 (편의를 위해)
  const {
    searchOrderDateFrom,
    searchOrderDateTo,
    shipmentRequestDateFrom,
    shipmentRequestDateTo,
    searchTerm,
    productSearchTerm,
    excludeEndedProducts,
    unreceivedOrdersOnly,
    selectedGoodsGbn,
    selectedBrands,
    selectedBtypes
  } = searchCondition;
  
  // 팝업 관련 상태는 로컬 상태로 유지 (상태관리 제외)
  const [showProductSearchModal, setShowProductSearchModal] = useState<boolean>(false);
  
  // 상품검색 팝업 검색창 포커스용 ref
  const productSearchInputRef = useRef<HTMLInputElement>(null);
  
  // 바코드 센싱 감지용 상태 (팝업 관련)
  const [isBarcodeScanning, setIsBarcodeScanning] = useState<boolean>(false);
  
  // 컴포넌트 초기화
  useEffect(() => {
    if (!isInitialized) {
      dispatch(initializeScreen());
    }
  }, [dispatch, isInitialized]);

  // 상품검색 팝업이 열릴 때 검색창에 포커스
  useEffect(() => {
    if (showProductSearchModal && productSearchInputRef.current) {
      // 팝업이 완전히 렌더링된 후 포커스 설정
      setTimeout(() => {
        productSearchInputRef.current?.focus();        
      }, 100);
    }
  }, [showProductSearchModal]);
  
  // 팝업 관련 상태들 (상태관리 제외)
  const [goodsGbnOptions, setGoodsGbnOptions] = useState<CommonCodeOption[]>([]);
  const [brandOptions, setBrandOptions] = useState<CommonCodeOption[]>([]);
  const [btypeOptions, setBtypeOptions] = useState<CommonCodeOption[]>([]);
  const [modalPosition, setModalPosition] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [dragOffset, setDragOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  
  // 모달 관련 상태들 (팝업 관련 - 상태관리 제외)
  const [showResetConfirmModal, setShowResetConfirmModal] = useState<boolean>(false);
  const [showOrderSendModal, setShowOrderSendModal] = useState<boolean>(false);
  const [confirmationModal, setConfirmationModal] = useState<{
    isOpen: boolean;
    type: 'save' | 'update';
    onConfirm: () => void;
  }>({ isOpen: false, type: 'save', onConfirm: () => {} });
  const [successModal, setSuccessModal] = useState<{
    isOpen: boolean;
    type: 'save' | 'update';
    message: string;
    details: string;
    changedFields?: Array<{field: string, name: string, oldValue: any, newValue: any}>;
    onClose?: () => void;
  }>({ isOpen: false, type: 'save', message: '', details: '' });
  
  // 변화된 행을 체크박스에 체크하는 함수
  const markRowAsChanged = (rowId: string) => {
    dispatch(addChangedRow(rowId));
  };

  // 신규 저장 후 디테일 데이터만 재조회하는 함수 (발주번호 유지)
  const refreshDetailDataOnly = async (orderNo: string) => {
    try {      
      if (!orderNo || orderNo.trim() === '') {
        return;
      }

      // 디테일 그리드만 초기화 (발주번호는 유지)
      dispatch(setOrderSlipList([]));
      dispatch(clearChangedRows());
      
      // AgGrid 체크박스 선택 해제
      if (orderSlipGridRef.current) {
        try {
          orderSlipGridRef.current.deselectAll();
          
        } catch (error) {
          // AgGrid 체크박스 선택 해제 실패
        }
      }

      // 발주 상세 정보를 데이터베이스에서 다시 조회      
      const response = await getOrderDetails(orderNo);
      
      if (response && response.success && response.data && Array.isArray(response.data) && response.data.length > 0) {        
        // 디테일 데이터 매핑 및 설정 (refreshOrderDataBeforeModal과 동일한 로직)
        const detailItems = response.data.map((item: any, index: number) => ({
          orderNo: item.orderNo, // 백엔드에서 전달받은 실제 order_no 사용
          seqNo: item.orderNo, // 백엔드에서 전달받은 실제 order_no 사용
          uniqueId: `${item.goodsId || 'unknown'}-${item.orderNo || 'unknown'}-${index}`,
          brandName: item.brandName || item.brandId || '', // 브랜드명 추가 (브랜드명이 없으면 브랜드코드 사용)
          goodsName: item.goodsName,
          vendorName: item.vendorName || item.vendorId || '', // 납품처명 추가 (납품처명이 없으면 납품처코드 사용)
          goodsId: item.goodsId,
          orderQty: item.orderQty,
          sobiJaDan: item.sobiJaDan,
          sobiJaAmt: item.sobiJaAmt,
          sobiJaVat: item.sobiJaVat,
          sobiJaTot: item.sobiJaTot,
          saleRate: item.saleRate,
          orderDan: item.orderDan,
          orderAmt: item.orderAmt,
          orderVat: item.orderVat,
          orderTot: item.orderTot,
          claimId: item.claimId || '',
          orderMemo: item.orderMemo || '', // 발주메모 추가
          brandId: item.brandId || '', // 브랜드코드 추가
          vendorId: item.vendorId || '', // 납품처코드 추가
          // 출고일자, 입고예정일, 입고일자 필드 추가
          outDate: item.outD || item.out_d || item.outDate || '', // 출고일자
          expectedInDate: item.estD || item.est_d || item.expectedInDate || '', // 입고예정일
          inDate: item.inD || item.in_d || item.inDate || '', // 입고일자
          wasChanged: false // 새로 조회한 데이터는 변경되지 않은 상태
        }));
        
        dispatch(setOrderSlipList(detailItems));
        // 디테일 데이터 설정 완료
      } else {
        // 디테일 데이터가 없음 (신규 발주)
        dispatch(setOrderSlipList([]));        
      }      
      // 신규 저장 후에는 마스터 정보를 그대로 유지 (발주번호만 새로 설정됨)
            
      // 변경된 행 상태 초기화
      dispatch(clearChangedRows());
           
      // 이전발주정보 목록 갱신
      try {      
        console.log('🔄 이전발주정보 목록 갱신 시작');
        await handleSearch();      
        console.log('✅ 이전발주정보 목록 갱신 완료');
      } catch (error) {
        console.error('❌ 이전발주정보 목록 갱신 실패:', error);
      }      
    } catch (error) {
      console.error('❌ refreshDetailDataOnly 전체 오류:', error);
    }
  };

  // 저장 성공 모달 전에 화면을 초기화하고 재조회하는 함수
  const refreshOrderDataBeforeModal = async (orderNo: string) => {
    try {
      if (!orderNo || orderNo.trim() === '') {
        return;
      }

      // 1. 먼저 화면 초기화 (이전발주정보 더블클릭처럼)
      // 디테일 그리드 초기화
      dispatch(setOrderSlipList([]));
      dispatch(clearChangedRows());
      // AgGrid 체크박스 선택 해제
      if (orderSlipGridRef.current) {
        try {
          orderSlipGridRef.current.deselectAll();
        } catch (error) {
          // AgGrid 체크박스 선택 해제 실패
        }
      }
      // 2. 발주 상세 정보를 데이터베이스에서 다시 조회
      const response = await getOrderDetails(orderNo);
      
      if (response.success && response.data && Array.isArray(response.data) && response.data.length > 0) {
        
        // 마스터 정보도 함께 갱신 (필요한 경우)
        if (response.masterData) {
          // 마스터 정보가 있으면 화면에 반영
          if (response.masterData.orderDate) dispatch(setMasterData({ orderDate: response.masterData.orderDate }));
          if (response.masterData.requireDate) dispatch(setMasterData({ shipmentRequestDate: response.masterData.requireDate }));
          if (response.masterData.recvMemo) dispatch(setMasterData({ remarks: response.masterData.recvMemo }));
          if (response.masterData.recvAddr) dispatch(setMasterData({ address: response.masterData.recvAddr }));
          if (response.masterData.recvPerson) dispatch(setMasterData({ recipient: response.masterData.recvPerson }));
          if (response.masterData.recvTel) dispatch(setMasterData({ phoneNumber: response.masterData.recvTel }));
          if (response.masterData.agentId) dispatch(setMasterData({ storeCode: response.masterData.agentId }));
        }

        // 디테일 정보 갱신
        const detailItems = response.data.map((item: any, index: number) => ({
          orderNo: item.orderNo, // 백엔드에서 전달받은 실제 order_no 사용
          seqNo: item.orderNo, // 백엔드에서 전달받은 실제 order_no 사용
          uniqueId: `${item.goodsId || 'unknown'}-${item.orderNo || 'unknown'}-${index}`,
          brandName: item.brandName || item.brandId || '', // 브랜드명 추가 (브랜드명이 없으면 브랜드코드 사용)
          goodsName: item.goodsName,
          vendorName: item.vendorName || item.vendorId || '', // 납품처명 추가 (납품처명이 없으면 납품처코드 사용)
          goodsId: item.goodsId,
          orderQty: item.orderQty,
          sobiJaDan: item.sobiJaDan,
          sobiJaAmt: item.sobiJaAmt,
          sobiJaVat: item.sobiJaVat,
          sobiJaTot: item.sobiJaTot,
          saleRate: item.saleRate,
          orderDan: item.orderDan,
          orderAmt: item.orderAmt,
          orderVat: item.orderVat,
          orderTot: item.orderTot,
          claimId: item.claimId || '',
          orderMemo: item.orderMemo || '', // 발주메모 추가
          brandId: item.brandId || '', // 브랜드코드 추가
          vendorId: item.vendorId || '', // 납품처코드 추가
          // 출고일자, 입고예정일, 입고일자 필드 추가
          outDate: item.outD || item.out_d || item.outDate || '', // 출고일자
          expectedInDate: item.estD || item.est_d || item.expectedInDate || '', // 입고예정일
          inDate: item.inD || item.in_d || item.inDate || '', // 입고일자
          wasChanged: false // 새로 조회한 데이터는 변경되지 않은 상태
        }));

        dispatch(setOrderSlipList(detailItems));
        
        // 마스터 필드 원본 값 업데이트
        dispatch(setOriginalMasterData({
          orderDate: response.masterData?.orderDate || orderDate,
          shipmentRequestDate: response.masterData?.requireDate || shipmentRequestDate,
          remarks: response.masterData?.recvMemo || remarks,
          address: response.masterData?.recvAddr || address,
          recipient: response.masterData?.recvPerson || recipient,
          phoneNumber: response.masterData?.recvTel || phoneNumber,
          storeCode: response.masterData?.agentId || storeCode,
          saleRate: '0.00', // 기본값
          orderType: orderType,
          orderNumber: orderNumber,
          orderSequ: orderSequ
        }));
      } else {
        
        // 디테일 데이터가 없어도 마스터 정보는 유지 (업데이트 후에는 발주번호가 있어야 함)
        // 발주번호가 있으면 마스터 정보를 유지하고, 없으면 초기화
        if (!orderNumber || orderNumber.trim() === '') {
          dispatch(setMasterData({ orderNumber: '', orderSequ: 0 }));
          dispatch(setMasterData({
            orderDate: getInitialOrderDate(),
            storeCode: getInitialStoreCode(),
            shipmentRequestDate: getInitialShipmentRequestDate(),
            remarks: '',
            address: '',
            recipient: '',
            phoneNumber: '',
            saleRate: '0.00',
            orderType: '210'
          }));
          dispatch(setOrderTypeDisabled(false)); // 발주구분 활성화
          
          // 마스터 필드 원본 값 초기화
        dispatch(setOriginalMasterData({
          orderDate: getInitialOrderDate(),
          shipmentRequestDate: getInitialShipmentRequestDate(),
          remarks: '',
          address: '',
          recipient: '',
          phoneNumber: '',
          storeCode: getInitialStoreCode(),
          saleRate: '0.00',
          orderType: '210',
          orderNumber: '',
          orderSequ: 0
        }));
        } else {
          //console.log('✅ 발주번호가 있어서 마스터 정보 유지:', orderNumber);
        }        
        //console.log('✅ 마스터 구역 처리 완료');
      }
      
      // 이전발주정보 목록 갱신 (디테일 데이터 유무와 관계없이)
        try {
          await handleSearch();// console.log('✅ 이전발주정보 목록 갱신 완료');
        } catch (error) {
          // 이전발주정보 목록 갱신 실패
      }
    } catch (error) {
      // 저장 성공 모달 전 화면 초기화 및 재조회 중 오류
    }
  };

  
  // 변화된 행 체크박스 해제 함수
  const unmarkRowAsChanged = (rowId: string) => {
    dispatch(removeChangedRow(rowId));
    //console.log('❌ 행 변화 해제:', rowId);
  };
  // AgGrid refs
  const orderSlipGridRef = useRef<CommonAgGridRef>(null);
  const productSearchGridRef = useRef<CommonAgGridRef>(null);

  // 개별 상품 금액 재계산 함수
  const recalculateItemAmounts = useCallback((item: any) => {
    const consumerPrice = Number(item.sobiJaDan) || 0;
    const quantity = Number(item.orderQty) || 0;
    const saleRateValue = parseFloat(masterData.saleRate.toString()) || 0;
    
    const calculationInput: PriceCalculationInput = {
      consumerPrice,
      quantity,
      saleRate: saleRateValue
    };
    
    const calculatedPrices = calculatePricesRounded(calculationInput);
    
    return {
      ...item,
      sobiJaAmt: calculatedPrices.consumerSupplyAmount,
      sobiJaVat: calculatedPrices.consumerVat,
      sobiJaTot: calculatedPrices.consumerTotalAmount,
      orderDan: calculatedPrices.orderUnitPrice,
      orderAmt: calculatedPrices.orderSupplyAmount,
      orderVat: calculatedPrices.orderVat,
      orderTot: calculatedPrices.orderTotalAmount
    };
  }, [masterData.saleRate]);

  // 전표합계 계산 함수
  const calculateOrderSummary = useCallback((orderList: any[]) => {
    const summary = orderList.reduce((acc, item) => {
      const quantity = Number(item.orderQty) || 0;
      const supplyAmount = Number(item.orderAmt) || 0;
      const vat = Number(item.orderVat) || 0;
      const totalAmount = Number(item.orderTot) || 0;
      const salesAmount = Number(item.sobiJaTot) || 0;
      
      return {
        totalQuantity: acc.totalQuantity + quantity,
        totalSupplyAmount: acc.totalSupplyAmount + supplyAmount,
        totalVatAmount: acc.totalVatAmount + vat,
        totalAmount: acc.totalAmount + totalAmount,
        totalSalesAmount: acc.totalSalesAmount + salesAmount
      };
    }, {
      totalQuantity: 0,
      totalSupplyAmount: 0,
      totalVatAmount: 0,
      totalAmount: 0,
      totalSalesAmount: 0
    });           //    console.log('💰 전표합계 계산 완료:', summary);
    dispatch(setOrderSummary(summary));
  }, [dispatch]);

  // 숫자 포맷터 함수
  const numberFormatter = (params: any) => {
    // 값이 없거나 빈 값인 경우 0 반환
    if (params.value == null || params.value === '' || params.value === undefined) return '0';
    
    // 문자열인 경우 공백 제거
    const cleanValue = typeof params.value === 'string' ? params.value.trim() : params.value;
    
    // 공백 제거 후에도 빈 값인 경우 0 반환
    if (cleanValue === '') return '0';
    
    // 숫자로 변환 시도
    const numValue = Number(cleanValue);
    
    // NaN이거나 Infinity인 경우 0 반환
    if (isNaN(numValue) || !isFinite(numValue)) return '0';
    
    // 0인 경우 마이너스 기호 없이 0 반환
    if (numValue === 0) return '0';
    
    // 마이너스 기호를 앞에 강제로 표시
    if (numValue < 0) {
      return `-${Math.abs(numValue).toLocaleString('ko-KR')}`;
    } else {
      return numValue.toLocaleString('ko-KR');
    }
  };



  // 할인율 포맷터 함수
  const rateFormatter = (params: any) => {
    // 값이 없거나 빈 값인 경우 0.00% 반환
    if (params.value == null || params.value === '' || params.value === undefined) return '0.00%';
    
    // 문자열인 경우 공백 제거
    const cleanValue = typeof params.value === 'string' ? params.value.trim() : params.value;
    
    // 공백 제거 후에도 빈 값인 경우 0.00% 반환
    if (cleanValue === '') return '0.00%';
    
    // 숫자로 변환 시도
    const numValue = Number(cleanValue);
    
    // NaN이거나 Infinity인 경우 0.00% 반환
    if (isNaN(numValue) || !isFinite(numValue)) return '0.00%';
    
    return numValue.toFixed(2) + '%';
  };

  // 발주 내역 테이블 컬럼 정의 (백엔드 필드명에 맞춤)
  const orderListColumnDefs = [
    { headerName: '발주일자', field: 'ORDER_D', width: 100, sortable: true, cellClass: 'text-left' },
    { headerName: '발주번호', field: 'SLIP_NO', width: 100, sortable: true, cellClass: 'text-left' },
    { headerName: '매장명', field: 'CUSTOMER_NAME', width: 120, sortable: true, cellClass: 'text-left' },
    { 
      headerName: '발주구분', 
      field: 'IO_NM', 
      width: 80, 
      sortable: true, 
      cellClass: 'text-center',
      cellStyle: { textAlign: 'center' },
      headerClass: 'text-center'
    },
    { headerName: '발주수량', field: 'TOTAL_QTY', width: 80, sortable: true, valueFormatter: numberFormatter, cellStyle: { textAlign: 'right' }, headerClass: 'text-right' },
    { headerName: '발주총금액', field: 'ORDER_AMOUNT', width: 100, sortable: true, valueFormatter: numberFormatter, cellStyle: { textAlign: 'right' }, headerClass: 'text-right' },
    { headerName: '소비자가총금액', field: 'SALES_AMOUNT', width: 120, sortable: true, valueFormatter: numberFormatter, cellStyle: { textAlign: 'right' }, headerClass: 'text-right' }
  ];


  // 상품 검색 테이블 컬럼 정의 (발주상세내역 그리드와 동일한 스타일)
  const productListColumnDefs = [    
    { headerName: '브랜드상품코드', field: 'productCode', width: 100, sortable: true, cellClass: 'text-left' },
    { headerName: '상품명', field: 'productName', width: 200, sortable: true, cellClass: 'text-left' },
    { headerName: '브랜드', field: 'brand', width: 80, sortable: true, cellClass: 'text-left' },
    { headerName: '상품구분명', field: 'category', width: 80, sortable: true, cellClass: 'text-left' },
    { headerName: '소비자가격', field: 'consumerPrice', width: 80, sortable: true, valueFormatter: numberFormatter, cellStyle: { textAlign: 'right' }, headerClass: 'text-right' },    
    { headerName: '납품처명', field: 'vendorName', width: 120, sortable: true, cellClass: 'text-left' },    
    { headerName: '상품코드', field: 'id', width: 80, sortable: true, cellClass: 'text-left' }    ,
    { headerName: '납품처코드', field: 'vendorId', width: 0, hide: true }, // 히든 처리하지만 데이터 보유
    { headerName: '브랜드코드', field: 'brandId', width: 80 }, // 히든 처리하지만 데이터 보유
    { headerName: '할인율(%)', field: 'saleRate', width: 0, hide: true, sortable: true, valueFormatter: rateFormatter, cellStyle: { textAlign: 'right' }, headerClass: 'text-right' }
  ];

  // 출고일자, 입고예정일, 입고일자 중 하나라도 데이터가 있으면 수정불가 상태로 만드는 함수
  const isRowEditable = (params: any): boolean => {
    const data = params.data;
    if (!data) return true;
    
    // 출고일자, 입고예정일, 입고일자 중 하나라도 데이터가 있으면 수정불가
    const hasDateData = (data.outDate && data.outDate.trim() !== '') ||
                       (data.expectedInDate && data.expectedInDate.trim() !== '') ||
                       (data.inDate && data.inDate.trim() !== '');
    
    return !hasDateData;
  };

  // 발주전표 테이블 컬럼 정의 
  const orderSlipColumnDefs = [
    { headerName: '전표순번', field: 'orderNo', width: 60, sortable: true, cellClass: 'text-center' },
    { headerName: '브랜드명', field: 'brandName', width: 100, sortable: true, cellClass: 'text-left' },
    { headerName: '상품명', field: 'goodsName', width: 200, sortable: true, cellClass: 'text-left' },
    { headerName: '납품처명', field: 'vendorName', width: 150, sortable: true, cellClass: 'text-left' },
    { 
      headerName: '발주수량',       
      field: 'orderQty', 
      width: 80, 
      sortable: true, 
      editable: isRowEditable,
      cellEditor: 'agTextCellEditor',
      valueParser: (params: any) => {
        const value = params.newValue;
        if (typeof value === 'string' && value.endsWith('-')) {
          // "7-" 형태를 "-7"로 변환
          return parseFloat('-' + value.slice(0, -1));
        }
        return parseFloat(value) || 0;
      },
      cellRenderer: (params: any) => {
        if (params.value == null || params.value === '') return '0';
        const numValue = Number(params.value);
        if (isNaN(numValue)) return '0';
        
        // 마이너스 기호를 앞에 강제로 표시
        if (numValue < 0) {
          return `-${Math.abs(numValue).toLocaleString('ko-KR')}`;
        } else {
          return numValue.toLocaleString('ko-KR');
        }
      },
      cellClass: (params: any) => {
        // 음수인 경우 CSS 클래스 적용 (0은 제외)
        if (params.value < 0) {
          return 'negative-quantity';
        }
        return '';
      },
      onCellValueChanged: (params: any) => {
        // 발주구분이 반품(220)이고 수량이 양수인 경우 마이너스로 변경
        if (orderType === '220' && params.newValue > 0) {
          params.data.orderQty = -Math.abs(params.newValue);
          params.api.refreshCells({ rowNodes: [params.node], columns: ['orderQty'] });
        }
        // 발주구분이 정상(210)이고 수량이 음수인 경우 양수로 변경
        else if (orderType === '210' && params.newValue < 0) {
          params.data.orderQty = Math.abs(params.newValue);
          params.api.refreshCells({ rowNodes: [params.node], columns: ['orderQty'] });
        }
      },
      cellStyle: { textAlign: 'right' },
      headerClass: 'text-right'      
    },
    { 
      headerName: '소비자가격단가', 
      field: 'sobiJaDan', 
      width: 100, 
      sortable: true, 
      valueFormatter: numberFormatter,
      cellClass: (params: any) => {
        if (params.value < 0) return 'negative-quantity';
        return '';
      },
      cellStyle: { textAlign: 'right' },
      headerClass: 'text-right'
    },
    { 
      headerName: '소비자가공급가', 
      field: 'sobiJaAmt', 
      width: 100, 
      sortable: true, 
      hide: true,  // 히든 처리
      valueFormatter: numberFormatter,
      cellClass: (params: any) => {
        if (params.value < 0) return 'negative-quantity';
        return '';
      },
      cellStyle: { textAlign: 'right' },
      headerClass: 'text-right'
    },
    { 
      headerName: '소비자가부가세', 
      field: 'sobiJaVat', 
      width: 100, 
      sortable: true, 
      hide: true,  // 히든 처리
      valueFormatter: numberFormatter,
      cellClass: (params: any) => {
        if (params.value < 0) return 'negative-quantity';
        return '';
      },
      cellStyle: { textAlign: 'right' },
      headerClass: 'text-right'
    },
    { 
      headerName: '소비자가총금액', 
      field: 'sobiJaTot', 
      width: 100, 
      sortable: true, 
      valueFormatter: numberFormatter,
      cellClass: (params: any) => {
        if (params.value < 0) return 'negative-quantity';
        return '';
      },
      cellStyle: { textAlign: 'right' },
      headerClass: 'text-right'
    },

    { 
      headerName: '할인율(%)', 
      field: 'saleRate', 
      width: 80, 
      sortable: true, 
      //editable: isRowEditable,
      //cellEditor: 'agNumberCellEditor',
      cellEditorParams: {
        min: 0,
        max: 100,
        precision: 2
      },
      valueFormatter: rateFormatter,
      cellStyle: { textAlign: 'right' },
      headerClass: 'text-right'
    },
    { 
      headerName: '발주단가', 
      field: 'orderDan', 
      width: 100, 
      sortable: true, 
      valueFormatter: numberFormatter,
      cellClass: (params: any) => {
        if (params.value < 0) return 'negative-quantity';
        return '';
      },
      cellStyle: { textAlign: 'right' },
      headerClass: 'text-right'
    },
    { 
      headerName: '발주공급가', 
      field: 'orderAmt', 
      width: 100, 
      sortable: true, 
      valueFormatter: numberFormatter,
      cellClass: (params: any) => {
        if (params.value < 0) return 'negative-quantity';
        return '';
      },
      cellStyle: { textAlign: 'right' },
      headerClass: 'text-right'
    },
    { 
      headerName: '발주부가세', 
      field: 'orderVat', 
      width: 100, 
      sortable: true, 
      valueFormatter: numberFormatter,
      cellClass: (params: any) => {
        if (params.value < 0) return 'negative-quantity';
        return '';
      },
      cellStyle: { textAlign: 'right' },
      headerClass: 'text-right'
    },
    { 
      headerName: '발주총금액', 
      field: 'orderTot', 
      width: 100, 
      sortable: true, 
      valueFormatter: numberFormatter,
      cellClass: (params: any) => {
        if (params.value < 0) return 'negative-quantity';
        return '';
      },
      cellStyle: { textAlign: 'right' },
      headerClass: 'text-right'
    },

    { 
      headerName: '클레임코드', 
      field: 'claimId', 
      width: 100, 
      sortable: true, 
      editable: isRowEditable, 
      cellStyle: { textAlign: 'left' },
      cellEditor: 'agSelectCellEditor',
      cellEditorParams: {
        values: ['', ...codeData.claimGbn.map((item: any) => item.claimGbn)]  // 맨 앞에 공백 옵션 추가
      },
      valueFormatter: (params: any) => {
        if (!params.value || params.value === '') return '';  // 공백 값 처리
        const claimGbn = codeData.claimGbn.find((item: any) => item.claimGbn === params.value);
        return claimGbn ? (claimGbn as any).claimGbnNm : params.value;
      }
    },
    { headerName: '발주메모', field: 'orderMemo', width: 150, sortable: true, editable: isRowEditable, cellStyle: { textAlign: 'left' } },
    { headerName: '브랜드코드', field: 'brandId', width: 80, sortable: true, cellStyle: { textAlign: 'left' } },
    { headerName: '상품코드', field: 'goodsId', width: 100, sortable: true, cellStyle: { textAlign: 'left' } },
    { headerName: '납품처코드', field: 'vendorId', width: 80, sortable: true, cellStyle: { textAlign: 'left' } },
    { 
      headerName: '출고일자', 
      field: 'outDate', 
      width: 100, 
      sortable: true, 
      editable: true,
      cellEditor: 'agDateCellEditor',
      cellEditorParams: {
        format: 'yyyy-mm-dd'
      },
      valueFormatter: (params: any) => {
        if (!params.value) return '';
        return params.value;
      },
      cellStyle: { textAlign: 'center' },
      headerClass: 'text-center'
    },
    { 
      headerName: '입고예정일', 
      field: 'expectedInDate', 
      width: 100, 
      sortable: true, 
      editable: true,
      cellEditor: 'agDateCellEditor',
      cellEditorParams: {
        format: 'yyyy-mm-dd'
      },
      valueFormatter: (params: any) => {
        if (!params.value) return '';
        return params.value;
      },
      cellStyle: { textAlign: 'center' },
      headerClass: 'text-center'
    },
    { 
      headerName: '입고일자', 
      field: 'inDate', 
      width: 100, 
      sortable: true, 
      editable: true,
      cellEditor: 'agDateCellEditor',
      cellEditorParams: {
        format: 'yyyy-mm-dd'
      },
      valueFormatter: (params: any) => {
        if (!params.value) return '';
        return params.value;
      },
      cellStyle: { textAlign: 'center' },
      headerClass: 'text-center'
    }
  ];

  // 기본 컬럼 정의
  const defaultColDef = {
    resizable: true,
    sortable: true,
    minWidth: 60
  };

  // 이벤트 핸들러
  const handleSearch = async () => {

    try {
      // 조회 조건 검증 (기본 발주일자 범위가 설정되어 있으므로 검증 제거)
      // if (!searchOrderDateFrom && !searchOrderDateTo && !shipmentRequestDateFrom && !shipmentRequestDateTo && !searchTerm) {
      //   alert('조회 조건을 하나 이상 입력해주세요.');
      //   return;
      // }

      // API 호출을 위한 파라미터 구성
      const searchParams = {
        mode: 'GET_PREVIOUS',
        orderDateFrom: searchOrderDateFrom || null,
        orderDateTo: searchOrderDateTo || null,
        shipmentRequestDateFrom: shipmentRequestDateFrom || null,
        shipmentRequestDateTo: shipmentRequestDateTo || null,
        searchTerm: searchTerm || null,
        unreceivedOnly: unreceivedOrdersOnly ? 'Y' : 'N',
        agentId: (safeTrim(currentStoreId) !== '') ? safeTrim(currentStoreId) : null  // 매장코드가 비활성화된 경우에만 필터링
      };

      //console.log('📤 조회 파라미터:', searchParams);

      // 실제 API 호출
      const response = await getPreviousOrders(searchParams);
      
      if (response && Array.isArray(response)) {
        dispatch(setOrderList(response));
        //console.log('✅ 조회된 발주 내역:', response.length, '건');
      } else {
        // 조회 결과 실패
        dispatch(setOrderList([]));
        alert('조회에 실패했습니다.');
      }
      
      //console.log('✅ 이전발주정보 조회 완료');
    } catch (error) {
      // 이전발주정보 조회 실패
      alert('조회 중 오류가 발생했습니다.');
    }
  };

  const handleProductSearch = async () => {
    // console.log('🔍 팝업 상품 검색 시작', {
    //   searchTerm: productSearchTerm,
    //   selectedGoodsGbn,
    //   selectedBrands,
    //   selectedBtypes,
    //   excludeEndedProducts,
    //   userRoleId: user?.roleId,
    //   userRoleName: user?.roleName
    // });
    
    try {
      // 사용자 롤에 따라 적절한 userId 결정
      // 거래업체 롤(5)인 경우에만 agentId 사용, 그 외에는 공백 사용
      const searchUserId = (user?.roleId === 5 && currentAgentId) ? currentAgentId : '';
      
      // console.log('🔍 검색에 사용할 userId:', searchUserId);
      // console.log('🔍 사용자 롤 ID:', user?.roleId);
      // console.log('🔍 거래업체 롤인가?', user?.roleId === 5);
      
      const products = await popupSearchService.searchProductsForPopup({
        selectedGoodsGbn: selectedGoodsGbn.length > 0 ? selectedGoodsGbn : undefined,
        selectedBrands: selectedBrands.length > 0 ? selectedBrands : undefined,
        selectedBtypes: selectedBtypes.length > 0 ? selectedBtypes : undefined,
        searchText: productSearchTerm || undefined,
        excludeEndedProducts: excludeEndedProducts,
        userId: searchUserId // 롤에 따라 결정된 userId 사용
      });
      
      // 백엔드에서 이미 변환된 데이터를 그대로 사용
      dispatch(setProductList(products as any));
      // console.log('🔍 팝업 검색 결과:', products);
      
      // 바코드 센싱 판단: 검색어가 바코드 패턴이면
      const isBarcodePattern = detectBarcodeScanning(productSearchTerm);
      if (isBarcodePattern) {
        setIsBarcodeScanning(true);
        // console.log('📱 바코드 센싱으로 판단됨:', productSearchTerm);
        
        // 바코드 센싱 표시기를 2초간 유지
        setTimeout(() => {
          setIsBarcodeScanning(false);
          // console.log('📱 바코드 센싱 표시기 숨김');
        }, 2000);
        
        // 바코드 센싱이지만 검색 결과가 2건 이상이면 자동 추가하지 않음
        if (products && products.length > 1) {
          // console.log('📱 바코드 센싱이지만 검색 결과가 2건 이상:', products.length, '건');
          // 바코드 센싱 후 입력값 초기화 (다음 센싱을 위해)
          setTimeout(() => {
            dispatch(setSearchCondition({ productSearchTerm: '' }));
            // 포커스 유지 (다음 바코드 스캔을 위해)
            if (productSearchInputRef.current) {
              productSearchInputRef.current.focus();
            }
            // console.log('🧹 바코드 센싱 후 입력값 초기화, 포커스 유지');
          }, 100);
          return; // 자동 추가 로직 실행하지 않음
        }
      }
      
      // 검색 결과가 1건이면 자동으로 디테일 그리드에 추가
      if (products && products.length === 1) {
        // 바코드 센싱인 경우에만 자동 추가
        if (isBarcodePattern) {
          // console.log('🔍 바코드 센싱으로 검색 결과 1건 발견, 자동으로 디테일 그리드에 추가');
          
          // 바코드 센싱 후 입력값 초기화 (다음 센싱을 위해)
          setTimeout(() => {
            dispatch(setSearchCondition({ productSearchTerm: '' }));
            // 포커스 유지 (다음 바코드 스캔을 위해)
            if (productSearchInputRef.current) {
              productSearchInputRef.current.focus();
            }
            // console.log('🧹 바코드 센싱 후 입력값 초기화, 포커스 유지');
          }, 100);
        } else {
        // console.log('🔍 일반 검색으로 결과 1건 발견, 자동으로 디테일 그리드에 추가');
        }
        const singleProduct = products[0];
        // console.log('🔍 자동 추가할 상품 정보:', singleProduct);
        
        try {
          // USP_ZA_HELP MODE=GOODS로 상세 정보 가져오기
          const detailedProduct = await popupSearchService.searchProductsForPopup({
            brandProductCode: singleProduct.GOODS_ID_BRAND || singleProduct.GOODS_ID_BRAND,
            brandId: singleProduct.BRAND_ID || singleProduct.BRAND_ID,
            goodsId: singleProduct.GOODS_ID?.toString() || singleProduct.GOODS_ID?.toString(),
            excludeEndedProducts: true
          });
          
          if (detailedProduct && detailedProduct.length > 0) {
            const productDetail = detailedProduct[0];
            // console.log('✅ 자동 추가할 상품 상세 정보:', productDetail);
            // console.log('🔍 현재 디테일 그리드 상품 목록:', orderSlipList.map(item => ({ goodsId: item.goodsId, goodsName: item.goodsName })));
            await addProductToOrderSlip(productDetail, false); // false는 자동 추가임을 의미
          } else {
            // 자동 추가할 상품 상세 정보를 찾을 수 없습니다
            // console.log('🔍 현재 디테일 그리드 상품 목록:', orderSlipList.map(item => ({ goodsId: item.goodsId, goodsName: item.goodsName })));
            
            // 팝업 검색 결과를 상세 정보 구조로 변환
            const convertedProduct = {
              ...singleProduct,
              GOODS_ID: singleProduct.GOODS_ID,
              GOODS_NM: singleProduct.GOODS_NM,
              BRAND_NM: singleProduct.BRAND_GBN_NM,
              VENDOR_NM: singleProduct.VENDOR_NM,
              SUPPLY_DAN: singleProduct.SUPPLY_DAN || 0,
              SALE_RATE: 0 // 기본 할인율 0%
            };
            // console.log('🔍 변환된 상품 정보:', convertedProduct);
            await addProductToOrderSlip(convertedProduct, false);
          }
        } catch (error) {
          // 자동 상품 추가 중 오류 발생
          // console.log('🔍 현재 디테일 그리드 상품 목록:', orderSlipList.map(item => ({ goodsId: item.goodsId, goodsName: item.goodsName })));
          
          // 오류 발생 시에도 팝업 검색 결과를 상세 정보 구조로 변환
          const convertedProduct = {
            ...singleProduct,
            GOODS_ID: singleProduct.GOODS_ID,
            GOODS_NM: singleProduct.GOODS_NM,
            BRAND_NM: singleProduct.BRAND_GBN_NM,
            VENDOR_NM: singleProduct.VENDOR_NM,
            SUPPLY_DAN: singleProduct.SUPPLY_DAN || 0,
            SALE_RATE: 0 // 기본 할인율 0%
          };
          // console.log('🔍 오류 시 변환된 상품 정보:', convertedProduct);
          await addProductToOrderSlip(convertedProduct, false);
        }
      }
    } catch (error) {
      // 팝업 상품 검색 중 오류 발생
      // 오류 발생 시 기존 데이터 유지
    }
  };

  // 바코드 센싱 감지 함수 (검색 결과 기반)
  const detectBarcodeScanning = (value: string) => {
    // 바코드 패턴 판단:
    // 1. 길이가 6자 이상
    // 2. 숫자와 영문자로만 구성
    // 3. 특수문자나 공백이 없음
    const isLongEnough = value.length >= 6;
    const isBarcodePattern = /^[A-Za-z0-9]+$/.test(value);
    
    if (isLongEnough && isBarcodePattern) {
      // console.log('📱 바코드 패턴 감지:', value, '길이:', value.length);
      return true;
    }
    
    return false;
  };

  // 날짜 형식 검증 함수 (YYYY-MM-DD)
  const validateDateFormat = (dateString: string): boolean => {
    if (!dateString || dateString.trim() === '') {
      return false;
    }
    
    // YYYY-MM-DD 형식 검증
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(dateString)) {
      return false;
    }
    
    // 실제 날짜 유효성 검증
    const date = new Date(dateString);
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    const day = date.getDate();
    
    // 입력된 문자열을 다시 조합해서 원본과 비교
    const formattedDate = `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
    
    return formattedDate === dateString && date.getTime() === date.getTime();
  };

  // 날짜 비교 함수 (date1이 date2보다 이전인지 확인)
  const isDateBefore = (date1: string, date2: string): boolean => {
    const d1 = new Date(date1);
    const d2 = new Date(date2);
    return d1 < d2;
  };

  // 안전한 trim 처리 (문자열이 아닐 수도 있는 값 대응)
  const safeTrim = (value: any): string => {
    if (value === null || value === undefined) return '';
    return typeof value === 'string' ? value.trim() : String(value).trim();
  };

  // 초기 발주일자 계산 함수
  const getInitialOrderDate = (): string => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // 초기 입고요구일 계산 함수
  const getInitialShipmentRequestDate = (): string => {
    // 현재 날짜에서 일주일 후를 계산하고, 주말이면 다음 평일로 조정
    const today = new Date();
    let targetDate = new Date(today.getTime() + (7 * 24 * 60 * 60 * 1000));
    
    // 주말(토요일: 6, 일요일: 0)이면 다음 월요일로 조정
    const dayOfWeek = targetDate.getDay();
    if (dayOfWeek === 0) { // 일요일
      targetDate.setDate(targetDate.getDate() + 1); // 월요일로
    } else if (dayOfWeek === 6) { // 토요일
      targetDate.setDate(targetDate.getDate() + 2); // 월요일로
    }
    
    const year = targetDate.getFullYear();
    const month = String(targetDate.getMonth() + 1).padStart(2, '0');
    const day = String(targetDate.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // 초기 매장코드 계산 함수
  const getInitialStoreCode = (): string => {
    // 로그인한 유저의 store_id가 있으면 그것을 사용, 없으면 빈 문자열
    return safeTrim(currentStoreId) !== '' ? safeTrim(currentStoreId) : '';
  };

  // 데이터 변화 감지 함수
  const hasDataChanges = (): boolean => {
    // 마스터 섹션 변화 감지 (원본 값과 현재 값 비교)
    const hasMasterChanges = 
      orderDate !== originalMasterData.orderDate ||
      shipmentRequestDate !== originalMasterData.shipmentRequestDate ||
      remarks !== originalMasterData.remarks ||
      address !== originalMasterData.address ||
      recipient !== originalMasterData.recipient ||
      phoneNumber !== originalMasterData.phoneNumber ||
      // 매장직원(role_id: 4)이고 로그인 시 매장코드를 가지고 있는 경우 매장코드는 초기화 대상에서 제외
      (user?.roleId === 4 && safeTrim(currentStoreId) !== '' ? false : storeCode !== originalMasterData.storeCode) ||
      saleRate !== originalMasterData.saleRate ||
      orderType !== originalMasterData.orderType;
    
    // 디테일 섹션 변화 감지 (체크된 행이 있는지만 확인)
    const hasDetailChanges = changedRows.length > 0;
    
    return hasMasterChanges || hasDetailChanges;
  };

  // 저장 가능 여부 확인 함수 (발주번호가 없고 디테일 데이터도 없으면 저장 불가)
  const canSave = (): boolean => {
    // 마스터 섹션 변경 여부 확인
    const hasMasterChanges = 
      orderDate !== originalMasterData.orderDate ||
      shipmentRequestDate !== originalMasterData.shipmentRequestDate ||
      remarks !== originalMasterData.remarks ||
      address !== originalMasterData.address ||
      recipient !== originalMasterData.recipient ||
      phoneNumber !== originalMasterData.phoneNumber ||
      (user?.roleId === 4 && safeTrim(currentStoreId) !== '' ? false : storeCode !== originalMasterData.storeCode) ||
      saleRate !== originalMasterData.saleRate ||
      orderType !== originalMasterData.orderType;
    
    // 디테일 섹션 변경 여부 확인 (체크된 행이 있는지)
    const hasDetailChanges = changedRows.length > 0;
    
    // 발주번호가 있는 경우 (기존 발주 수정)
    if (orderNumber && orderNumber.trim() !== '') {
      // 마스터만 변경, 디테일만 변경, 둘 다 변경 중 하나라도 있으면 저장 가능
      return hasMasterChanges || hasDetailChanges;
    }
    
    // 발주번호가 없는 경우 (신규 발주)
    // 신규는 마스터 변경이 있거나 디테일 데이터(체크 여부 무관)가 있어야 저장 가능
    const hasDetailData = orderSlipList.length > 0;
    return hasMasterChanges || hasDetailData;
  };

  // 변경 사항 설명 함수
  const getChangeDescription = (): string => {
    const hasMasterChanges = 
      orderDate !== originalMasterData.orderDate ||
      shipmentRequestDate !== originalMasterData.shipmentRequestDate ||
      remarks !== originalMasterData.remarks ||
      address !== originalMasterData.address ||
      recipient !== originalMasterData.recipient ||
      phoneNumber !== originalMasterData.phoneNumber ||
      (user?.roleId === 4 && safeTrim(currentStoreId) !== '' ? false : storeCode !== originalMasterData.storeCode) ||
      saleRate !== originalMasterData.saleRate ||
      orderType !== originalMasterData.orderType;
    
    const parts = [];
    if (hasMasterChanges) parts.push('마스터');
    if (changedRows.length > 0) parts.push(`${changedRows.length}건 디테일`);
    
    // 변경 사항이 없으면 빈 문자열 반환
    if (parts.length === 0) return '';
    
    return ` (${parts.join(', ')} 변경됨)`;
  };


  // 검색어 변경 핸들러
  const handleSearchTermChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    dispatch(setSearchCondition({ productSearchTerm: value }));
  };

  // 엔터키 검색 핸들러
  const handleSearchKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {      
      handleProductSearch();
    }
  };


  const handleSave = async () => {
    try {
      // 1. 발주일자 검증
      if (!validateDateFormat(orderDate)) {
        alert('발주일자를 올바른 형식(YYYY-MM-DD)으로 입력해주세요.');
        return;
      }
      
      // 2. 입고요구일 검증
      if (!validateDateFormat(shipmentRequestDate)) {
        alert('입고요구일을 올바른 형식(YYYY-MM-DD)으로 입력해주세요.');
        return;
      }
      
      // 3. 입고요구일이 발주일자보다 이전인지 검증
      if (isDateBefore(shipmentRequestDate, orderDate)) {
        alert('입고요구일은 발주일자보다 이전일 수 없습니다.');
        return;
      }
      
      // 4. 매장 선택 검증
      if (!storeCode || safeTrim(storeCode) === '') {
        alert('매장을 선택해주세요.');
        return;
      }
      
      // 5. 상세내역 그리드 체크 항목 검증 (Array/Set 모두 처리)
      const changedItems = orderSlipList.filter((item, index) => {
        const rowId = item.uniqueId || `${item.goodsId}-${item.seqNo || index}`;
        const rows: any = changedRows as any;
        if (Array.isArray(rows)) return rows.includes(rowId);
        if (rows && typeof rows.has === 'function') return rows.has(rowId);
        return false;
      });
    
      // 마스터 섹션 변경 여부 확인 (원본 값과 현재 값 비교)
      const hasMasterChanges = 
      orderDate !== originalMasterData.orderDate ||
      shipmentRequestDate !== originalMasterData.shipmentRequestDate ||
      remarks !== originalMasterData.remarks ||
      address !== originalMasterData.address ||
      recipient !== originalMasterData.recipient ||
      phoneNumber !== originalMasterData.phoneNumber ||
      (user?.roleId === 4 && safeTrim(currentStoreId) !== '' ? false : storeCode !== originalMasterData.storeCode) ||
      saleRate !== originalMasterData.saleRate ||
      orderType !== originalMasterData.orderType;
    
      // 기존 발주 여부 확인
      const isExistingOrder = !!(orderNumber && safeTrim(orderNumber) !== '');
      // 마스터 업데이트 여부 (기존 발주이면서 마스터 변경이 있는 경우)
      const isMasterUpdate = isExistingOrder && hasMasterChanges;
        
      // 발주번호에서 orderSequ 파싱
      let currentOrderSequ = orderSequ;
      if (orderNumber && orderNumber.includes('-')) {
        const parts = orderNumber.split('-');
        if (parts.length >= 4) {
          currentOrderSequ = parseInt(parts[3]) || 0;
          dispatch(setMasterData({ orderSequ: currentOrderSequ }));
        }
      }
    
    // console.log('🔍 저장 로직 분석:', {
    //   changedItemsLength: changedItems.length,
    //   hasMasterChanges: hasMasterChanges,
    //   isMasterUpdate: isMasterUpdate,
    //   isExistingOrder: isExistingOrder,
    //   orderNumber: orderNumber,
    //   currentOrderSequ: currentOrderSequ,
    //   changedRows: Array.from(changedRows),
    //   originalMasterData: originalMasterData,
    //   currentMasterData: {
    //     orderDate,
    //     shipmentRequestDate,
    //     remarks,
    //     address,
    //     recipient,
    //     phoneNumber,
    //     storeCode,
    //     saleRate
    //   }
    // });
    
      // 변경 사항이 전혀 없는 경우에만 경고
      if (changedItems.length === 0 && !hasMasterChanges) {
        alert('변경된 데이터가 없습니다.');
        return;
      }
      
      // 저장/수정 확인 모달 표시
      const isUpdate = orderNumber && orderNumber !== '';
      const modalType = isUpdate ? 'update' : 'save';
      
      setConfirmationModal({
        isOpen: true,
        type: modalType,
        onConfirm: async () => {
          try {
          // 상세내역이 없고 마스터만 변경된 경우
          if (changedItems.length === 0 && isMasterUpdate) {    // console.log('📝 마스터 섹션만 변경됨 - 마스터 업데이트'); 
            await handleMasterUpdate(currentOrderSequ, orderNumber);
            return;
          }
          
          // 신규 저장 시 마스터만 변경된 경우
          if (changedItems.length === 0 && !isMasterUpdate && hasMasterChanges) {
            
            // console.log('🔍 신규 저장 조건 확인:', {
            //   changedItemsLength: changedItems.length,
            //   isMasterUpdate: isMasterUpdate,
            //   hasMasterChanges: hasMasterChanges,
            //   orderNumber: orderNumber
            // });
            //console.log('🚀 handleMasterSave 호출 시작');
            await handleMasterSave();

            //console.log('✅ handleMasterSave 호출 완료');
            return;
          }
          
          // 상세내역이 있는 경우
          if (changedItems.length > 0) {            
            // 발주 마스터가 없으면 먼저 마스터를 저장
            if (!currentOrderSequ || currentOrderSequ === 0) {              
              try {
                const savedOrderSequ = await handleMasterSave();
                currentOrderSequ = savedOrderSequ; // 저장된 orderSequ로 업데이트
                // 신규 저장의 경우 새로 생성된 발주번호 생성
                const newOrderNumber = `${orderDate}-${savedOrderSequ}`;
                // console.log('🔍 마스터 저장 후 currentOrderSequ 업데이트:', currentOrderSequ);
                // console.log('🔍 신규 저장 후 생성된 발주번호:', newOrderNumber);
                await handleDetailSave(changedItems, currentOrderSequ, currentOrderSequ, newOrderNumber);
              } catch (error) {
                // 마스터 저장 실패로 인한 상세 저장 중단
                return; // 마스터 저장이 실패하면 상세 저장을 중단
              }
            } else if (hasMasterChanges) {
              // 마스터와 디테일이 동시에 변경된 경우 - 마스터 먼저 업데이트
              try {
                await handleMasterUpdate(currentOrderSequ, orderNumber);
                await handleDetailSave(changedItems, currentOrderSequ, currentOrderSequ, orderNumber);
              } catch (error) {
                // 마스터 업데이트 실패로 인한 상세 저장 중단
                return; // 마스터 업데이트가 실패하면 상세 저장을 중단
              }
            } else {
              // 기존 발주에 디테일만 변경된 경우
              await handleDetailSave(changedItems, currentOrderSequ, currentOrderSequ, orderNumber);
            }
            return;
          }
          } catch (error) {
            // 저장 처리 중 오류
            alert('저장 중 오류가 발생했습니다.');
          }
        }
      });
    } catch (e) {
      alert(`저장 준비 중 오류가 발생했습니다.\n\n${e instanceof Error ? e.message : String(e)}`);
    }
  };

  // 마스터 저장 처리 (신규)
  const handleMasterSave = async () => {
    try {
     
      // 유저 정보 가져오기
      const userInfo = JSON.parse(sessionStorage.getItem('user') || '{}');
      
      const masterData = {
        orderDate: orderDate,
        requireDate: shipmentRequestDate,
        recvAddr: address,
        recvTel: phoneNumber,
        recvPerson: recipient,
        recvMemo: remarks,
        agentId: storeCode,
        userId: userInfo.userId
      };
      
      const result = await OrderService.saveOrderMaster(masterData);
      
      if (result.success) {
        // 저장된 orderSequ를 상태에 설정
        dispatch(setMasterData({ orderSequ: result.orderSequ }));
        // 발주번호 형식: yyyy-mm-dd-전표번호
        // orderDate는 이미 "YYYY-MM-DD" 형식이므로 그대로 사용
        const newOrderNumber = `${orderDate}-${result.orderSequ}`;
        dispatch(setMasterData({ orderNumber: newOrderNumber }));
        
        // 마스터 저장 완료 후 화면 갱신은 성공 모달에서 처리
        // 마스터 정보 원본 데이터 갱신 (변경 감지를 위해) - 새로운 발주번호 사용
        dispatch(setOriginalMasterData({
          orderDate: orderDate,
          shipmentRequestDate: shipmentRequestDate,
          remarks: remarks,
          address: address,
          recipient: recipient,
          phoneNumber: phoneNumber,
          storeCode: storeCode,
          saleRate: saleRate,
          orderType: orderType,
          orderNumber: newOrderNumber, // 새로 생성된 발주번호 사용
          orderSequ: result.orderSequ // 새로 생성된 orderSequ 사용
        }));
        
        // 성공 모달 표시 (모달 닫힐 때 화면 갱신)
        setSuccessModal({
          isOpen: true,
          type: 'save',
          message: '발주 마스터가 성공적으로 저장되었습니다.',
          details: `발주번호: ${newOrderNumber}`,
          onClose: async () => {
            // 모달 닫힐 때 발주번호로 디테일 갱신
            console.log('🔄 마스터 저장 성공 모달 닫힘 - 디테일 갱신 시작:', newOrderNumber);
            try {
              await refreshDetailDataOnly(newOrderNumber);
              console.log('✅ 마스터 저장 후 디테일 갱신 완료');
            } catch (error) {
              console.error('❌ 마스터 저장 후 디테일 갱신 실패:', error);
            }
          }
        });        
        return result.orderSequ; // 저장된 orderSequ 반환
      } else {
        throw new Error(result.message || '마스터 저장 실패');
      }
    } catch (error) {
      // 마스터 저장 실패
      alert(`마스터 저장 중 오류가 발생했습니다.\n\n${error instanceof Error ? error.message : String(error)}`);
      throw error; // 상위 함수에서 처리할 수 있도록 에러를 다시 던짐
    }
  };

  // 마스터 업데이트 처리
  const handleMasterUpdate = async (sequOverride?: number, orderNoOverride?: string) => {
    try {
      
      // 유저 정보 가져오기
      const userInfo = JSON.parse(sessionStorage.getItem('user') || '{}');
      
      const masterData = {
        orderNo: orderNoOverride || orderNumber,
        orderSequ: sequOverride || orderSequ, // order_sequ 추가 (override 우선)
        orderDate: orderDate,
        requireDate: shipmentRequestDate,
        recvAddr: address,
        recvTel: phoneNumber,
        recvPerson: recipient,
        recvMemo: remarks,
        userId: userInfo.userId
      };
      
      
      const result = await OrderService.updateOrderMaster(masterData);
      
      if (result.success) {
        dispatch(setOriginalMasterData({
          orderDate: orderDate,
          shipmentRequestDate: shipmentRequestDate,
          remarks: remarks,
          address: address,
          recipient: recipient,
          phoneNumber: phoneNumber,
          storeCode: storeCode,
          saleRate: saleRate,
          orderType: orderType,
          orderNumber: orderNoOverride || orderNumber,
          orderSequ: sequOverride || orderSequ
        }));
        
        // 마스터 업데이트 완료 후 화면 갱신은 성공 모달에서 처리
        
        // 성공 모달 표시 (모달 닫힐 때 화면 갱신)
        setSuccessModal({
          isOpen: true,
          type: 'update',
          message: '발주 마스터 정보가 성공적으로 업데이트되었습니다.',
          details: `발주번호: ${orderNoOverride || orderNumber}`,
          onClose: async () => {
            // 모달 닫힐 때 발주번호로 디테일 갱신
            console.log('🔄 마스터 업데이트 성공 모달 닫힘 - 디테일 갱신 시작:', orderNoOverride || orderNumber);
            if (orderNoOverride || orderNumber) {
              try {
                await refreshDetailDataOnly(orderNoOverride || orderNumber);
                console.log('✅ 마스터 업데이트 후 디테일 갱신 완료');
              } catch (error) {
                console.error('❌ 마스터 업데이트 후 디테일 갱신 실패:', error);
              }
            }
          }
        });
      } else {
        throw new Error(result.message || '마스터 업데이트 실패');
      }      
    } catch (error) {
      // 마스터 업데이트 실패
      alert(`마스터 업데이트 중 오류가 발생했습니다.\n\n${error instanceof Error ? error.message : String(error)}`);
    }
  };

  // 디테일 저장 처리
  const handleDetailSave = async (changedItems: any[], orderSequValue?: number, currentOrderSequ?: number, currentOrderNumber?: string) => {
    try {
      // 유저 정보 가져오기
      const userInfo = JSON.parse(sessionStorage.getItem('user') || '{}');
      
      // 신규/업데이트 구분하여 저장
      // 각 아이템별로 seqNo(ORDER_NO)가 있으면 업데이트, 없으면 신규 저장
      const newItems = changedItems.filter(item => !item.seqNo || item.seqNo === '' || item.seqNo === 0);
      const updateItems = changedItems.filter(item => item.seqNo && item.seqNo !== '' && item.seqNo !== 0);
      
      let successCount = 0;
      let errorCount = 0;
      const errorDetails: string[] = []; // 오류 상세 정보 저장
      
      // 신규 항목 저장
      for (const item of newItems) {
        try {
          const detailData = {
            orderDate: orderDate,
            orderSequ: orderSequValue || orderSequ, // 발주 마스터의 일련번호 필요
            // orderNo는 SAVE_DETAIL에서 자동생성되므로 전달하지 않음
            ioId: orderType, // 마스터에서 선택한 발주구분 사용
            claimId: item.claimId,
            vendorId: item.vendorId,
            brandId: item.brandId,
            goodsId: item.goodsId,
            orderQty: item.orderQty,
            sobiJaDan: item.sobiJaDan || 0,
            saleRate: item.saleRate || 0,
            orderMemo: item.orderMemo || '',
            userId: userInfo.userId
          };
          
          const result = await OrderService.saveOrderDetail(detailData);
          
          if (result.success) {
            successCount++;
            console.log(`✅ 신규 저장 성공: ${item.goodsName || item.brandProductCode} (${item.goodsId})`);
            // 저장 성공 시 서버에서 받은 데이터로 아이템 업데이트
            if (result.data) {
              // 불변성을 위해 새로운 객체 생성하여 seqNo 업데이트
              const updatedItem = {
                ...item,
                seqNo: result.data.seqNo || result.data.orderNo
              };
              // 배열에서 해당 아이템을 찾아서 교체
              const itemIndex = newItems.indexOf(item);
              if (itemIndex >= 0) {
                newItems[itemIndex] = updatedItem;
              }
            }
          } else {
            errorCount++;
            const errorMsg = `신규 저장 실패: ${item.goodsName || item.brandProductCode} (${item.goodsId}) - ${result.message || '알 수 없는 오류'}`;
            errorDetails.push(errorMsg);
            console.error(`❌ ${errorMsg}`);
          }
        } catch (error) {
          errorCount++;
          const errorMsg = `신규 저장 오류: ${item.goodsName || item.brandProductCode} (${item.goodsId}) - ${error instanceof Error ? error.message : String(error)}`;
          errorDetails.push(errorMsg);
          console.error(`❌ ${errorMsg}`);
        }
      }
      
      // 업데이트 항목 저장
      for (const item of updateItems) {
        try {
          const detailData = {
            orderDate: orderDate,
            orderSequ: currentOrderSequ || orderSequValue || orderSequ, // 발주 마스터의 일련번호
            orderNo: item.seqNo, // UPDATE_DETAIL에서는 ORDER_NO가 필요
            ioId: orderType, // 마스터에서 선택한 발주구분 사용
            claimId: item.claimId,
            vendorId: item.vendorId,
            brandId: item.brandId,
            goodsId: item.goodsId,
            orderQty: item.orderQty,
            sobiJaDan: item.sobiJaDan || 0,
            saleRate: item.saleRate || 0,
            orderMemo: item.orderMemo || '',
            userId: userInfo.userId
          };
          
          const result = await OrderService.updateOrderDetail(detailData);
          
          if (result.success) {
            successCount++;
            console.log(`✅ 업데이트 성공: ${item.goodsName || item.brandProductCode} (${item.goodsId}) - seqNo: ${item.seqNo}`);
            // 업데이트 성공 시 서버에서 받은 데이터로 아이템 업데이트
            if (result.data) {
              // 불변성을 위해 새로운 객체 생성하여 seqNo 업데이트
              const updatedItem = {
                ...item,
                seqNo: result.data.seqNo || result.data.orderNo
              };
              // 배열에서 해당 아이템을 찾아서 교체
              const itemIndex = updateItems.indexOf(item);
              if (itemIndex >= 0) {
                updateItems[itemIndex] = updatedItem;
              }
            }
          } else {
            errorCount++;
            const errorMsg = `업데이트 실패: ${item.goodsName || item.brandProductCode} (${item.goodsId}) - seqNo: ${item.seqNo} - ${result.message || '알 수 없는 오류'}`;
            errorDetails.push(errorMsg);
            console.error(`❌ ${errorMsg}`);
          }
        } catch (error) {
          errorCount++;
          const errorMsg = `업데이트 오류: ${item.goodsName || item.brandProductCode} (${item.goodsId}) - seqNo: ${item.seqNo} - ${error instanceof Error ? error.message : String(error)}`;
          errorDetails.push(errorMsg);
          console.error(`❌ ${errorMsg}`);
        }
      }
      
      // 저장 완료 후 화면 갱신
      if (errorCount > 0) {
        // 일부 실패한 경우 - 알럿만 표시하고 성공 모달은 표시하지 않음
        const errorSummary = errorDetails.length > 0 ? 
          `\n\n실패 상세:\n${errorDetails.slice(0, 3).join('\n')}${errorDetails.length > 3 ? `\n... 외 ${errorDetails.length - 3}건` : ''}` : '';
        
        alert(`${successCount}건이 저장되었습니다.\n${errorCount}건 저장에 실패했습니다.${errorSummary}\n\n자세한 내용은 콘솔을 확인해주세요.`);
        
        // 실패가 있어도 성공한 항목들은 체크박스 상태 초기화
        if (successCount > 0) {
          dispatch(clearChangedRows());
        }
      } else {
        // 모든 저장이 성공한 경우에만 성공 모달 표시
        // 1. 체크박스 상태 초기화 (변화 감지 해제) - 먼저 실행
        dispatch(clearChangedRows());        
        
        // AgGrid의 체크박스 선택도 해제하여 행 스타일 초기화
        if (orderSlipGridRef.current) {
          try {
            orderSlipGridRef.current.deselectAll();                        
            // 강제로 그리드 리프레시하여 스타일 초기화
            setTimeout(() => {
              if (orderSlipGridRef.current) {
                // AgGrid 강제 리렌더링을 위해 데이터를 다시 설정
                const currentData = orderSlipList;
                dispatch(setOrderSlipList([...currentData]));
              }
            }, 50);
          } catch (error) {
            // AgGrid 체크박스 선택 해제 실패
          }
        }
        
        // 2. 저장 완료 후 화면 재조회는 성공 모달에서 처리
        //console.log('✅ 디테일 저장 완료 - 성공 모달에서 화면 재조회 예정');
        
        // 성공 모달 표시 (모달 닫힐 때 화면 갱신)
        const isUpdate = orderNumber && orderNumber !== '';
        const orderNumberForModal = currentOrderNumber || orderNumber;
        // console.log('🔍 handleDetailSave - orderNumberForModal 설정:', orderNumberForModal);
        // console.log('🔍 handleDetailSave - currentOrderNumber:', currentOrderNumber);
        // console.log('🔍 handleDetailSave - orderNumber:', orderNumber);
        
        // 현재 발주번호를 명시적으로 사용 (신규 저장과 기존 발주 업데이트 구분)
        const currentOrderNumberForRefresh = currentOrderNumber || orderNumber || '';
        
        setSuccessModal({
          isOpen: true,
          type: isUpdate ? 'update' : 'save',
          message: `${successCount}건의 발주 상세 데이터가 성공적으로 저장되었습니다.`,
          details: `발주번호: ${orderNumberForModal || '신규'}`,
          onClose: async () => {
            // 모달 닫힐 때 발주번호로 디테일 갱신
            console.log('🔄 디테일 저장완료 모달 닫힘 - 발주번호로 디테일 갱신:', currentOrderNumberForRefresh);
            if (currentOrderNumberForRefresh) {
              try {
                await refreshDetailDataOnly(currentOrderNumberForRefresh);
                console.log('✅ 디테일 저장 후 갱신 완료');
              } catch (error) {
                console.error('❌ 디테일 저장 후 갱신 실패:', error);
              }
            }
          }
        });
      }
      
    } catch (error) {
      // 디테일 저장 실패
      alert(`데이터 저장 중 오류가 발생했습니다.\n\n${error instanceof Error ? error.message : String(error)}`);
    }
  };

  const handleOpenProductSearch = () => {
    // console.log('상품검색 버튼 클릭됨');
    setShowProductSearchModal(true);
    // 팝업을 화면 상단에 가깝게 위치시키기 위해 초기 위치 설정
    const popupWidth = 700;
    const popupHeight = 450;
    const centerX = Math.max(50, (window.innerWidth - popupWidth) / 2);
    const centerY = Math.max(50, (window.innerHeight - popupHeight) / 4); // 화면 상단 1/4 지점으로 조정
    setModalPosition({ x: centerX, y: centerY });
    // console.log('showProductSearchModal 상태:', true);
    // console.log('팝업 위치:', { x: centerX, y: centerY });
  };

  const handleCloseProductSearch = () => {
    setShowProductSearchModal(false);
    setModalPosition({ x: 0, y: 0 }); // 모달 닫을 때 위치 초기화
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    // 헤더 영역에서만 드래그 시작 (닫기 버튼 제외)
    const target = e.target as HTMLElement;
    if (target.closest('.order-product-search-popup-header') && !target.closest('.order-popup-close-btn')) {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(true);
      const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
      setDragOffset({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
      });
    }
  };

  const handleMouseMove = React.useCallback((e: MouseEvent) => {
    if (isDragging) {
      e.preventDefault();
      
      // requestAnimationFrame으로 성능 최적화 - 리플로우 방지
      requestAnimationFrame(() => {
        const newX = e.clientX - dragOffset.x;
        const newY = e.clientY - dragOffset.y;
        
        // 화면 경계 내에서만 이동 가능
        const maxX = window.innerWidth - 1000; // 팝업 최대 너비
        const maxY = window.innerHeight - 400; // 팝업 예상 높이
        
        const clampedX = Math.max(0, Math.min(newX, maxX));
        const clampedY = Math.max(0, Math.min(newY, maxY));
        
        // 실제 위치 업데이트 (CSS Transform 대신 직접 위치 설정)
        setModalPosition({
          x: clampedX,
          y: clampedY
        });
      });
    }
  }, [isDragging, dragOffset]);

  const handleMouseUp = React.useCallback(() => {
    setIsDragging(false);
  }, []);

  // 드래그 이벤트 리스너 등록
  React.useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.body.style.userSelect = 'none';
      document.body.style.cursor = 'grabbing';
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.userSelect = '';
      document.body.style.cursor = '';
    };
  }, [isDragging, handleMouseMove, handleMouseUp]);

  // 삭제 확인 모달 상태
  const [showDeleteConfirmModal, setShowDeleteConfirmModal] = useState(false);
  const [deleteConfirmMessage, setDeleteConfirmMessage] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [selectedItemsForDelete, setSelectedItemsForDelete] = useState<any[]>([]);

  const handleDelete = () => {
      // console.log('🗑️ 삭제 버튼 클릭됨');
      // console.log('🔍 orderSlipGridRef.current:', orderSlipGridRef.current);
      // console.log('🔍 orderSlipList 길이:', orderSlipList.length);
    
    // AG-Grid에서 선택된 행들을 가져오기
    let checkedItems = [];
    if (orderSlipGridRef.current) {
      checkedItems = orderSlipGridRef.current.getSelectedRows();
      //console.log('🔍 AG-Grid에서 선택된 행들:', checkedItems);
    } else {
      //console.log('❌ orderSlipGridRef.current가 null입니다.');
    }
    
    if (checkedItems.length === 0) {
      alert('삭제할 항목을 선택해주세요.');
      return;
    }

    // 발주번호가 있는지 확인
    if (!orderNumber || orderNumber.trim() === '') {
      alert('발주번호가 없어 삭제할 수 없습니다.');
      return;
    }

    // 발주번호 파싱 (형식: yyyy-mm-dd-전표번호)
    const orderNumberParts = orderNumber.split('-');
    if (orderNumberParts.length !== 4) {
      //console.error('❌ 발주번호 형식이 올바르지 않습니다:', orderNumber);
      alert('발주번호 형식이 올바르지 않습니다.');
      return;
    }
    
    // const orderD = `${orderNumberParts[0]}-${orderNumberParts[1]}-${orderNumberParts[2]}`; // 발주일자 (yyyy-mm-dd)
    // const orderSequ = String(orderNumberParts[3]);   // 발주일련번호 (전표번호)
    // const userId = user?.userId || '';

    // 삭제 파라미터를 알럿으로 표시
    // const deleteParams = {
    //   originalOrderNumber: orderNumber,
    //   orderD: orderD,
    //   orderSequ: orderSequ,
    //   userId: userId,
    //   checkedItemsCount: checkedItems.length,
    //   checkedItems: checkedItems.map(item => ({
    //     goodsId: item.goodsId,
    //     goodsName: item.goodsName,
    //     orderNo: item.orderNo,
    //     uniqueId: item.uniqueId
    //   }))
    // };

    // 선택된 항목을 상태로 저장 (모달이 닫혀도 유지되도록)
    setSelectedItemsForDelete(checkedItems);
    // 삭제 확인 메시지 생성
    const message = `선택된 ${checkedItems.length}건의 발주 상세를 삭제하시겠습니까?\n\n삭제 후에는 복구할 수 없습니다.`;
    setDeleteConfirmMessage(message);
    setShowDeleteConfirmModal(true);
  };

  const handleDeleteConfirm = async () => {
    setIsDeleting(true);
    setShowDeleteConfirmModal(false);

    try {
      // 저장된 선택된 항목 사용 (모달이 닫혀도 유지됨)
      const checkedItems = selectedItemsForDelete;
      // 발주번호 파싱 (형식: yyyy-mm-dd-전표번호)
      const orderNumberParts = orderNumber.split('-');
      if (orderNumberParts.length !== 4) {
        // 발주번호 형식이 올바르지 않습니다
        alert('발주번호 형식이 올바르지 않습니다.');
        return;
      }
      
      const orderD = `${orderNumberParts[0]}-${orderNumberParts[1]}-${orderNumberParts[2]}`; // 발주일자 (yyyy-mm-dd)
      const orderSequ = String(orderNumberParts[3]);   // 발주일련번호 (전표번호)
      const userId = user?.userId || '';

      // 1. 디테일 삭제 (체크된 항목들)
      
      const deleteResults = [];
      
      if (checkedItems.length === 0) {
//        console.log('⚠️ 체크된 항목이 없어서 디테일 삭제를 건너뜁니다.');
      } else {
//        console.log('🔄 디테일 삭제 루프 시작 - 총', checkedItems.length, '개 항목');
      }
      
      for (const item of checkedItems) {
        
        try {
          
          const result = await orderService.deleteOrderDetail(orderD, String(orderSequ || ''), String(item.orderNo || ''), String(userId || ''));
          deleteResults.push({ item, result });
        } catch (error) {
          // 디테일 삭제 실패
          deleteResults.push({ item, result: { RESULT: 'ERROR', MESSAGE: (error as Error).message } });
        }
      }
      // 2. 마스터 삭제 시도 (디테일이 모두 삭제된 경우)
      let masterDeleteResult = null;
      
      // 디테일 삭제가 성공한 경우에만 마스터 삭제 시도
      const successCount = deleteResults.filter(r => r.result.RESULT === 'SUCCESS').length;
      if (successCount > 0) {
        try {
          masterDeleteResult = await orderService.deleteOrderMaster(orderD, String(orderSequ || ''), String(userId || ''));
        } catch (error) {
          masterDeleteResult = { RESULT: 'ERROR', MESSAGE: (error as Error).message };
        }
      } else {
        //console.log('⚠️ 디테일 삭제가 성공하지 않아서 마스터 삭제를 건너뜁니다.');
      }

      // 3. 결과 처리
      const failCount = deleteResults.filter(r => r.result.RESULT === 'ERROR').length;
      
      let resultMessage = '';
      if (successCount > 0) {
        resultMessage += `✅ ${successCount}건 삭제 완료\n`;
      }
      if (failCount > 0) {
        resultMessage += `❌ ${failCount}건 삭제 실패\n`;
      }
      if (masterDeleteResult?.RESULT === 'SUCCESS') {
        resultMessage += '✅ 발주 마스터도 삭제되었습니다.';
      } else if (masterDeleteResult?.RESULT === 'ERROR') {
        resultMessage += 'ℹ️ 발주 마스터는 상세 내역이 남아있어 삭제되지 않았습니다.';
      }

      // 4. 화면 갱신
      if (masterDeleteResult?.RESULT === 'SUCCESS') {
        // 마스터 삭제가 성공한 경우 마스터 섹션 클리어
        dispatch(setMasterData({
          orderNumber: '',
          orderSequ: 0,
          orderDate: getInitialOrderDate(),
          storeCode: getInitialStoreCode(),
          shipmentRequestDate: getInitialShipmentRequestDate(),
          remarks: '',
          address: '',
          recipient: '',
          phoneNumber: '',
          saleRate: '0.00',
          orderType: '210'
        }));
        dispatch(setOrderTypeDisabled(false)); // 발주구분 활성화
        
        // 마스터 필드 원본 값 초기화
        dispatch(setOriginalMasterData({
          orderDate: getInitialOrderDate(),
          shipmentRequestDate: getInitialShipmentRequestDate(),
          remarks: '',
          address: '',
          recipient: '',
          phoneNumber: '',
          storeCode: getInitialStoreCode(),
          saleRate: '0.00',
          orderType: '210',
          orderNumber: '',
          orderSequ: 0
        }));
        
        // 디테일 그리드 초기화
        dispatch(setOrderSlipList([]));
        dispatch(clearChangedRows());
        
        // 이전발주정보 목록 갱신
        await handleSearch();// console.log('✅ 마스터 섹션 클리어 완료');
      } else {
        // 마스터 삭제가 실패한 경우 기존 로직 사용
        await refreshOrderDataBeforeModal(orderNumber);
      }

      // 5. AG-Grid 선택 상태 초기화
      if (orderSlipGridRef.current) {
        try {
          orderSlipGridRef.current.deselectAll();          
        } catch (error) {
          // AG-Grid 선택 상태 초기화 실패
        }
      }

      // 6. 선택된 항목 상태 초기화
      setSelectedItemsForDelete([]);

      // 7. 결과 모달 표시
      if (successCount > 0) {
        setSuccessModal({
          isOpen: true,
          type: 'update', // 삭제는 업데이트로 분류
          message: '삭제 완료',
          details: resultMessage,
          changedFields: []
        });
      } else {
        setSuccessModal({
          isOpen: true,
          type: 'update', // 삭제는 업데이트로 분류
          message: '삭제 실패',
          details: resultMessage,
          changedFields: []
        });
      }

    } catch (error) {
      // 삭제 처리 중 오류
      setSuccessModal({
        isOpen: true,
        type: 'update', // 삭제는 업데이트로 분류
        message: '삭제 오류',
        details: '삭제 처리 중 오류가 발생했습니다: ' + (error as Error).message,
        changedFields: []
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const handleDeleteCancel = () => {
    setShowDeleteConfirmModal(false);
    setDeleteConfirmMessage('');
    setSelectedItemsForDelete([]); // 선택된 항목 상태 초기화
  };
  const handleNew = () => {
    // 데이터 변화가 있는지 확인
    if (hasDataChanges()) {
      setShowResetConfirmModal(true);
    } else {
      performReset();
    }
  };

  // 실제 초기화 수행 함수
  const performReset = () => {
    // 마스터 필드 활성화 (현재는 항상 활성화 상태)
    // setIsMasterFieldsDisabled(false); // 주석 처리 - 항상 활성화
    // 모든 상태를 초기값으로 재설정
    dispatch(setMasterData({
      orderNumber: '',
      orderSequ: 0, // 발주 일련번호 초기화
      orderDate: getInitialOrderDate(), // 현재 날짜로 초기화
      storeCode: getInitialStoreCode(), // 로그인 유저의 매장코드로 초기화
      shipmentRequestDate: getInitialShipmentRequestDate(), // 일주일 후 평일로 초기화
      remarks: '',
      address: '',
      recipient: '',
      phoneNumber: '',
      saleRate: '0.00',
      orderType: '210' // 발주구분 초기화 (정상발주)
    }));
    dispatch(setOrderTypeDisabled(false)); // 발주구분 활성화
    dispatch(setOrderDateDisabled(false)); // 발주일자 활성화
    dispatch(setShipmentRequestDateDisabled(false)); // 납기요구일 활성화
    dispatch(setStoreCodeDisabled(false)); // 매장코드 활성화
    dispatch(setOrderSlipList([]));
    dispatch(clearChangedRows());
    
    // 마스터 필드 원본 값 초기화 (현재 설정된 값으로)
    dispatch(setOriginalMasterData({
      orderDate: getInitialOrderDate(),
      shipmentRequestDate: getInitialShipmentRequestDate(),
      remarks: '',
      address: '',
      recipient: '',
      phoneNumber: '',
      storeCode: getInitialStoreCode(),
      saleRate: '0.00',
      orderType: '210',
      orderNumber: '',
      orderSequ: 0
    }));    
    // 모달 닫기
    setShowResetConfirmModal(false);
  };

  // 초기화 취소 함수
  const handleResetCancel = () => {
    setShowResetConfirmModal(false);
  };


  const handleMoveToOrderSlip = async () => {
    // 선택된 상품들을 발주전표에 추가
    if (selectedProducts.length > 0) {
      // 체크된 상품들을 순차적으로 처리
      for (const product of selectedProducts) {
        try {
          const detailedProduct = await popupSearchService.searchProductsForPopup({
            brandProductCode: product.GOODS_ID_BRAND || product.productCode, // 브랜드상품코드 (원본 필드 우선)
            brandId: product.BRAND_ID || product.brandId, // 브랜드코드 (원본 필드 우선)
            goodsId: product.GOODS_ID || product.id, // 상품코드 (원본 필드 우선)
            excludeEndedProducts: true
          });
          
          if (detailedProduct && detailedProduct.length > 0) {
            const productDetail = detailedProduct[0];
            await addProductToOrderSlip(productDetail, false); // false는 버튼 클릭으로 추가됨을 의미
          } else {
            await addProductToOrderSlip(product, false);
          }
        } catch (error) {
          // 체크된 상품 처리 중 오류 발생
          await addProductToOrderSlip(product, false);
        }
      }
      
      // 선택된 상품 목록 초기화
      dispatch(setSelectedProducts([]));
      
      // AG-Grid에서 체크박스 선택 해제
      if (productSearchGridRef.current) {
        productSearchGridRef.current.deselectAll();
      }
      
      // 팝업은 유지 (사용자가 직접 닫을 때까지)
      // setShowProductSearchModal(false);
    }
  };

  // 상품을 발주상세 그리드에 추가하는 공통 함수
  const addProductToOrderSlip = async (product: any, isDoubleClick: boolean) => {
    try {
      // USP_ZA_HELP에서 받은 상세 정보에서 상품코드 추출 (GOODS_ID 우선 사용)
      const productCode = product.GOODS_ID || product.productCode || product.id;
      
      // 기존 상품이 있는지 확인 (여러 필드로 비교)
      
      // 팝업 검색인지 기존 데이터 로드인지 구분
      const isFromPopup = !product.ORDER_NO && !product.orderNo; // 순번이 없으면 팝업에서 온 것으로 판단
      
      let existingProductIndex = -1;
      
      if (isFromPopup) {
        // 팝업 검색: 같은 상품코드의 맨 마지막 라인을 찾아서 수량 증가
        for (let i = orderSlipList.length - 1; i >= 0; i--) {
          const item = orderSlipList[i];
          const isSameGoodsId = item.goodsId === productCode;
          
          if (isSameGoodsId) {
            existingProductIndex = i;
            break; // 맨 마지막 일치하는 라인을 찾았으므로 중단
          }
        }
      } else {
        // 기존 데이터 로드: 상품코드와 순번을 모두 비교하여 정확한 라인 식별
        for (let i = orderSlipList.length - 1; i >= 0; i--) {
          const item = orderSlipList[i];
          
          // 상품코드와 순번을 모두 비교하여 정확한 라인 식별
          const isSameGoodsId = item.goodsId === productCode;
          const isSameOrderNo = item.orderNo === (product.ORDER_NO || product.orderNo || '');
          
          // 상품코드와 순번이 모두 일치하는 경우만 같은 라인으로 인식
          const isSameLine = isSameGoodsId && isSameOrderNo;
          
        
          if (isSameLine) {
          existingProductIndex = i;
            break; // 정확히 일치하는 라인을 찾았으므로 중단
          }
        }
      }
      
      
      if (existingProductIndex >= 0) {
        // 기존 상품이 있으면 해당 라인의 발주수량 +1
        const updatedList = [...orderSlipList];
        // 발주구분에 따라 수량 조정: 정상발주(210)는 +1, 반품발주(220)는 -1
        const quantityChange = orderType === '210' ? 1 : -1;
        
        // 수량이 undefined나 null인 경우 0으로 초기화
        if (updatedList[existingProductIndex].orderQty === undefined || updatedList[existingProductIndex].orderQty === null) {
          updatedList[existingProductIndex].orderQty = 0;
        }
        
        // 더 안전한 방식으로 수량 변경
        const currentQty = updatedList[existingProductIndex].orderQty;
        
        // 문자열인 경우 숫자로 변환
        const numericQty = parseFloat(currentQty) || 0;
        
        const newQty = numericQty + quantityChange;
        
        // 직접 할당 방식으로 변경
        updatedList[existingProductIndex] = {
          ...updatedList[existingProductIndex],
          orderQty: newQty
        };
        
        // 금액 재계산 (금액계산방법.TXT 로직 적용)
        const updatedItem = updatedList[existingProductIndex];
        const calculationInput: PriceCalculationInput = {
          consumerPrice: updatedItem.sobiJaDan,
          quantity: updatedItem.orderQty,
          saleRate: parseFloat(saleRate) || 0
        };
        
        const calculatedPrices = calculatePricesRounded(calculationInput);
        
        // 계산된 금액으로 업데이트
        updatedItem.sobiJaTot = calculatedPrices.consumerTotalAmount;
        updatedItem.orderDan = calculatedPrices.orderUnitPrice;
        updatedItem.orderAmt = calculatedPrices.orderSupplyAmount;
        updatedItem.orderVat = calculatedPrices.orderVat;
        updatedItem.orderTot = calculatedPrices.orderTotalAmount;
        
        // 변화 감지: 기존 상품 수량 변경 시 체크박스 체크 (먼저 실행)
        const existingOrderNo = updatedList[existingProductIndex].orderNo || '';
        const existingRowId = updatedList[existingProductIndex].uniqueId || 
          (isFromPopup ? 
            `${productCode}-popup-${existingProductIndex}` : // 팝업 검색
            `${productCode}-${existingOrderNo}-${existingProductIndex}` // 기존 데이터
          );
        
        markRowAsChanged(existingRowId);
        dispatch(setOrderSlipList(updatedList));
        
        // 더블클릭인 경우 발주수량 컬럼에 입력커서 넣기 (색상 변화 후)
        if (isDoubleClick) {
          setTimeout(() => {
          dispatch(setFocusTarget({ rowIndex: existingProductIndex, colKey: 'orderQty' }));
          }, 200); // 200ms 지연으로 색상 변화가 먼저 보이도록
        }
      } else {
        // 신규 상품이면 새 행 추가
        
        // 금액 계산을 위한 입력값 준비
        const consumerPrice = product.SUPPLY_DAN || product.consumerPrice || 0;
        // 발주구분에 따라 초기 수량 설정: 정상발주(210)는 1, 반품발주(220)는 -1
        const quantity = orderType === '210' ? 1 : -1;
        const saleRate = product.SALE_RATE || product.saleRate || 0.00;
        const saleRateValue = parseFloat(saleRate) || 0;
        
        const calculationInput: PriceCalculationInput = {
          consumerPrice,
          quantity,
          saleRate: saleRateValue
        };
        
        // 금액 계산 (금액계산방법.TXT 로직 적용)
        const calculatedPrices = calculatePricesRounded(calculationInput);
        
        
        // USP_ZA_HELP에서 받은 상세 정보 사용
        const newOrderItem = {
          orderNo: isFromPopup ? '' : (product.ORDER_NO || product.orderNo || ''), // 팝업 검색은 순번 없음, 기존 데이터는 순번 사용
          seqNo: null, // 신규 상품은 seqNo가 없음
          uniqueId: isFromPopup ? 
            `${productCode}-popup-${Date.now()}` : // 팝업 검색: 상품코드+팝업+타임스탬프
            `${productCode}-${product.ORDER_NO || product.orderNo || 'new'}-${Date.now()}`, // 기존 데이터: 상품코드+순번+타임스탬프
          brandName: product.BRAND_GBN_NM || product.brand || '',
          goodsName: product.GOODS_NM || product.productName,
          vendorName: product.VENDOR_NM || product.vendorName || '',
          orderQty: quantity,
          sobiJaDan: consumerPrice,
          sobiJaAmt: calculatedPrices.consumerSupplyAmount, // 소비자가공급가
          sobiJaVat: calculatedPrices.consumerVat, // 소비자가부가세
          sobiJaTot: calculatedPrices.consumerTotalAmount, // 소비자가총금액
          saleRate: saleRateValue,
          orderDan: calculatedPrices.orderUnitPrice, // 발주단가
          orderAmt: calculatedPrices.orderSupplyAmount, // 발주공급가
          orderVat: calculatedPrices.orderVat, // 발주부가세
          orderTot: calculatedPrices.orderTotalAmount, // 발주총금액
          claimId: '',
          orderMemo: '',
          brandId: product.BRAND_ID || product.brand || '',
          goodsId: productCode, // 위에서 추출한 상품코드 사용
          vendorId: product.VENDOR_ID || product.vendorId || ''
        };
        
        const newList = [...orderSlipList, newOrderItem];
        const newRowId = newOrderItem.uniqueId;
        
        // 변화 감지: 신규 상품 추가 시 체크박스 체크 (먼저 실행)
        markRowAsChanged(newRowId);
        
        // 더블클릭인 경우 새로 추가된 행의 발주수량 컬럼에 입력커서 넣기 (색상 변화 후)
        if (isDoubleClick) {
          const newIndex = newList.length - 1;
          setTimeout(() => {
            dispatch(setFocusTarget({ rowIndex: newIndex, colKey: 'orderQty' }));
          }, 200); // 200ms 지연으로 색상 변화가 먼저 보이도록
        }
        
        dispatch(setOrderSlipList(newList));
      }
    } catch (error) {
      // 상품 추가 중 오류 발생
    }
  };

  const handleProductSelectionChange = useCallback((selectedRows: any[]) => {
    dispatch(setSelectedProducts(selectedRows));
    
    // 체크만 했을 때는 발주상세내역에 추가하지 않음
    // "발주상세에 추가" 버튼을 눌렀을 때만 추가됨
  }, [orderSlipList]);

  // 이전발주정보 더블클릭 핸들러
  const handlePreviousOrderDoubleClick = async (event: any) => {
    
    if (!event.data) {
      return;
    }

    const selectedOrder = event.data;
    
    try {
      // 1. 먼저 마스터와 디테일을 초기화
      
      // 마스터 필드 활성화 (초기화 후 비활성화할 예정)
      dispatch(setMasterFieldsDisabled(false));
      
      // 모든 상태를 초기값으로 재설정
      dispatch(setMasterData({
        orderNumber: '',
        orderDate: getInitialOrderDate() // 현재 날짜로 초기화
      }));
      dispatch(setMasterData({
        storeCode: getInitialStoreCode(), // 로그인 유저의 매장코드로 초기화
        shipmentRequestDate: getInitialShipmentRequestDate(), // 일주일 후 평일로 초기화
        remarks: '',
        address: '',
        recipient: '',
        phoneNumber: '',
        saleRate: '0.00',
        orderType: '210'
      }));
      dispatch(setOrderTypeDisabled(false)); // 발주구분 활성화
      dispatch(setOrderDateDisabled(false)); // 발주일자 활성화
      dispatch(setShipmentRequestDateDisabled(false)); // 납기요구일 활성화
      dispatch(setStoreCodeDisabled(false)); // 매장코드 활성화
      dispatch(setOrderSlipList([]));
      dispatch(clearChangedRows());
      
      
      // 2. 선택된 발주의 상세 정보를 가져오기
      const orderId = `${selectedOrder.ORDER_D}-${selectedOrder.ORDER_SEQU || 1}`;
      
      
      const response = await getOrderDetails(orderId);
      
        if (response.success && response.data) {
          
          // 3. 마스터 정보 설정
        dispatch(setMasterData({
          orderNumber: selectedOrder.SLIP_NO || '', // 발주번호 설정
          orderSequ: selectedOrder.ORDER_SEQU || 0, // 발주 일련번호 설정
          orderDate: selectedOrder.ORDER_D || '',
          storeCode: selectedOrder.AGENT_ID || '',
          shipmentRequestDate: selectedOrder.REQUIRE_D || '' // 입고요구일 설정
        }));
        dispatch(setMasterData({
          remarks: selectedOrder.RECV_MEMO || '',
          address: selectedOrder.RECV_ADDR || '',
          recipient: selectedOrder.RECV_PERSON || '',
          phoneNumber: selectedOrder.RECV_TEL || ''
        }));
        
        // 4. 이전발주정보 더블클릭 시 마스터 필드는 활성화 상태 유지 (수정 가능하도록)
        // setIsMasterFieldsDisabled(true); // 주석 처리 - 마스터 필드 수정 허용
        
        // 발주구분 설정 (이전발주정보의 IO_ID 사용)
        const orderTypeValue = selectedOrder.IO_ID || '210'; // 기본값은 정상발주
        dispatch(setMasterData({ orderType: orderTypeValue }));
        
        // 이전발주정보 더블클릭 시 특정 필드들 비활성화 (수정 불가)
        dispatch(setOrderTypeDisabled(true)); // 발주구분 비활성화
        dispatch(setOrderDateDisabled(true)); // 발주일자 비활성화
        dispatch(setShipmentRequestDateDisabled(true)); // 납기요구일 비활성화
        dispatch(setStoreCodeDisabled(true)); // 매장코드 비활성화
        
        // 5. 마스터 필드 원본 값 저장 (변경 감지용)
        dispatch(setOriginalMasterData({
          orderDate: selectedOrder.ORDER_D || '',
          shipmentRequestDate: selectedOrder.REQUIRE_D || '',
          remarks: selectedOrder.RECV_MEMO || '',
          address: selectedOrder.RECV_ADDR || '',
          recipient: selectedOrder.RECV_PERSON || '',
          phoneNumber: selectedOrder.RECV_TEL || '',
          storeCode: selectedOrder.AGENT_ID || '',
          saleRate: '0.00', // 기본값
          orderType: orderTypeValue,
          orderNumber: selectedOrder.SLIP_NO || '',
          orderSequ: selectedOrder.ORDER_SEQU || 0
        }));
        
        // 디테일 정보 설정 (발주상세내역 그리드에 표시)
        
        if (Array.isArray(response.data)) {
          
          const detailItems = response.data.map((item: any, index: number) => ({
            orderNo: item.orderNo, // 백엔드에서 전달받은 실제 order_no 사용
            seqNo: item.orderNo, // 백엔드에서 전달받은 실제 order_no 사용
            uniqueId: `${item.goodsId || 'unknown'}-${item.orderNo || 'unknown'}-${index}`, // 고유 ID (상품코드-순번-인덱스)
            brandName: item.brandName || item.brandId || '', // 브랜드명이 없으면 브랜드코드 사용
            goodsName: item.goodsName || '',
            vendorName: item.vendorName || item.vendorId || '', // 납품처명이 없으면 납품처코드 사용
            orderQty: item.orderQty || 0,
            sobiJaDan: item.sobiJaDan || 0,
            sobiJaTot: item.sobiJaTot || 0,
            saleRate: item.saleRate || 0,
            orderDan: item.orderDan || 0,
            orderAmt: item.orderAmt || 0,
            orderVat: item.orderVat || 0,
            orderTot: item.orderTot || 0,
            claimId: item.claimId || '',
            orderMemo: item.orderMemo || '',
            brandId: item.brandId || '',
            goodsId: item.goodsId || '',
            vendorId: item.vendorId || '',
            // 출고일자, 입고예정일, 입고일자 필드 추가
            outDate: item.outD || item.out_d || item.outDate || '', // 출고일자
            expectedInDate: item.estD || item.est_d || item.expectedInDate || '', // 입고예정일
            inDate: item.inD || item.in_d || item.inDate || '' // 입고일자
          }));
          
          dispatch(setOrderSlipList(detailItems));
        }
        
      } else {
        // 발주 상세 정보 조회 실패
        alert('발주 상세 정보를 가져오는데 실패했습니다.');
      }
    } catch (error) {
      // 이전발주정보 더블클릭 처리 실패
      alert('발주 상세 정보를 가져오는 중 오류가 발생했습니다.');
    }
  };


  const handleProductRowDoubleClick = async (event: any) => {
    const rowData = event.data;
    
    if (!rowData) {
      console.log('❌ rowData가 없습니다');
      return;
    }
    
    try {
      // 상품코드 추출 (여러 필드명 시도)
      const goodsId = rowData.GOODS_ID || rowData.id || rowData.productCode;
      const brandId = rowData.BRAND_ID || rowData.brandId;
      const brandProductCode = rowData.GOODS_ID_BRAND || rowData.productCode;
      
      if (!goodsId) {
        // 상품코드가 없으면 기존 데이터로 처리
        await addProductToOrderSlip(rowData, true);
        return;
      }
      
      // 여러 방법으로 상세 정보 가져오기 시도
      let detailedProduct = null;
      
      // 방법 1: goodsId로 검색
      try {
        detailedProduct = await popupSearchService.searchProductsForPopup({
          goodsId: goodsId.toString(),
          excludeEndedProducts: false
        });
      } catch (error) {
        // 방법1 실패
      }
      
      // 방법 2: brandProductCode로 검색 (방법 1이 실패한 경우)
      if (!detailedProduct || detailedProduct.length === 0) {
        try {
          detailedProduct = await popupSearchService.searchProductsForPopup({
            brandProductCode: brandProductCode,
            excludeEndedProducts: false
          });
        } catch (error) {
          // 방법2 실패
        }
      }
      
      // 방법 3: brandId와 goodsId 조합으로 검색 (방법 2도 실패한 경우)
      if (!detailedProduct || detailedProduct.length === 0) {
        try {
          detailedProduct = await popupSearchService.searchProductsForPopup({
            brandId: brandId,
            goodsId: goodsId.toString(),
            excludeEndedProducts: false
          });
        } catch (error) {
          // 방법3 실패
        }
      }
      
      // 방법 4: 상품명으로 검색 (방법 3도 실패한 경우)
      if (!detailedProduct || detailedProduct.length === 0) {
        try {
          const productName = rowData.productName || rowData.GOODS_NM;
          if (productName) {
            detailedProduct = await popupSearchService.searchProductsForPopup({
              searchText: productName,
              excludeEndedProducts: false
            });
          }
        } catch (error) {
          // 방법4 실패
        }
      }
      
      if (detailedProduct && detailedProduct.length > 0) {
        const productDetail = detailedProduct[0];
        await addProductToOrderSlip(productDetail, true);
      } else {
        // 상세 정보 조회 실패. 기존 데이터를 변환하여 처리
        
        // 기존 데이터를 상세 정보 형태로 변환하여 처리
        const fallbackProduct = {
          ...rowData,
          GOODS_ID: goodsId,
          GOODS_NM: rowData.productName || rowData.GOODS_NM || '상품명 없음',
          BRAND_GBN_NM: rowData.brand || rowData.BRAND_GBN_NM || brandId,
          VENDOR_NM: rowData.vendorName || rowData.VENDOR_NM || '납품처 없음',
          SUPPLY_DAN: rowData.consumerPrice || rowData.SUPPLY_DAN || 0,
          SALE_RATE: 0, // 기본 할인율 0%
          BRAND_ID: brandId,
          VENDOR_ID: rowData.vendorId || rowData.VENDOR_ID || '',
          GOODS_ID_BRAND: brandProductCode
        };
        
        await addProductToOrderSlip(fallbackProduct, true);
      }
    } catch (error) {
      console.error('상품 더블클릭 처리 실패:', error);
      // 오류 발생 시에도 기존 데이터로 처리
      try {
        const fallbackProduct = {
          ...rowData,
          GOODS_ID: rowData.GOODS_ID || rowData.id || rowData.productCode,
          GOODS_NM: rowData.productName || rowData.GOODS_NM || '상품명 없음',
          BRAND_GBN_NM: rowData.brand || rowData.BRAND_GBN_NM || '브랜드 없음',
          VENDOR_NM: rowData.vendorName || rowData.VENDOR_NM || '납품처 없음',
          SUPPLY_DAN: rowData.consumerPrice || rowData.SUPPLY_DAN || 0,
          SALE_RATE: 0, // 기본 할인율 0%
          BRAND_ID: rowData.BRAND_ID || rowData.brandId || '',
          VENDOR_ID: rowData.vendorId || rowData.VENDOR_ID || '',
          GOODS_ID_BRAND: rowData.GOODS_ID_BRAND || rowData.productCode
        };
        
        await addProductToOrderSlip(fallbackProduct, true);
      } catch (fallbackError) {
        console.error('기존 데이터로도 처리 실패:', fallbackError);
        alert('상품을 발주상세에 추가하는 중 오류가 발생했습니다.');
      }
    }
  };

  // orderSlipList 변경 시 전표합계 자동 계산
  useEffect(() => {
    calculateOrderSummary(orderSlipList);
  }, [orderSlipList, calculateOrderSummary]);
    
  // 포커스 처리 (별도 useEffect로 분리)
  useEffect(() => {
    if (focusTarget && orderSlipGridRef.current) {
      setTimeout(() => {
        try {
          // setFocusedCell에서 자동으로 편집 모드가 시작되므로 별도 호출 불필요
          orderSlipGridRef.current?.setFocusedCell(focusTarget.rowIndex, focusTarget.colKey);
          dispatch(setFocusTarget(null)); // 포커스 완료 후 초기화
        } catch (error) {
          console.error('포커스 실행 중 오류:', error);
          dispatch(setFocusTarget(null));
        }
      }, 300); // 포커스 실행 지연을 늘림
    }
  }, [focusTarget]); // focusTarget만 의존성으로 설정


  // 할인율 변경 시 모든 상품 금액 재계산 (수동 호출)
  const recalculateAllItems = useCallback(() => {
    if (orderSlipList.length > 0) {
      const recalculatedList = orderSlipList.map(item => recalculateItemAmounts(item));
      dispatch(setOrderSlipList(recalculatedList));
    }
  }, [orderSlipList, recalculateItemAmounts, dispatch]);

  // 컴포넌트 마운트 시 초기화
  useEffect(() => {
    
    // 모든 필드 활성화 (컴포넌트 마운트 시)
        dispatch(setOrderTypeDisabled(false)); // 발주구분 활성화
        dispatch(setOrderDateDisabled(false)); // 발주일자 활성화
        dispatch(setShipmentRequestDateDisabled(false)); // 납기요구일 활성화
        dispatch(setStoreCodeDisabled(false)); // 매장코드 활성화
    
    // 마스터 필드 원본 값 초기화 (컴포넌트 마운트 시)
    dispatch(setOriginalMasterData({
      orderDate: getInitialOrderDate(),
      shipmentRequestDate: getInitialShipmentRequestDate(),
      remarks: '',
      address: '',
      recipient: '',
      phoneNumber: '',
      storeCode: getInitialStoreCode(),
      saleRate: '0.00',
      orderType: '210',
      orderNumber: '',
      orderSequ: 0
    }));
    // 마스터 필드 원본 값 초기화 완료
    
    // 크레임코드 데이터 가져오기
    fetchClaimGbnData();
    
    // 브랜드와 대분류 데이터 가져오기
    loadFilterData();
    
    // 매장 목록 데이터 가져오기
    loadStoreData();
  }, []);


  // 브랜드, 대분류, 상품구분 데이터 로드
  const loadFilterData = async () => {
    try {
      const [brands, categories, goodsGbnList] = await Promise.all([
        commonCodeService.getBrands(),
        commonCodeService.getBTypes(),
        commonCodeService.getGoodsGbn()
      ]);
      
      // 모든 데이터는 이미 CommonCodeOption 형식으로 반환됨
      setBrandOptions(brands);
      setBtypeOptions(categories);
      setGoodsGbnOptions(goodsGbnList);
      
      // 필터 데이터 로드 완료
    } catch (error) {
      console.error('필터 데이터 로드 실패:', error);
    }
  };

  // 크레임코드 데이터 가져오기
  const fetchClaimGbnData = async () => {
    try {
      const response = await fetch('/api/common/claim-gbn');
      if (response.ok) {
        const data = await response.json();
        dispatch(setCodeData({ claimGbn: data }));
        // 크레임코드 데이터 로드 완료
      } else {
        console.error('크레임코드 데이터 로드 실패:', response.status);
      }
    } catch (error) {
      console.error('크레임코드 데이터 로드 중 오류:', error);
    }
  };

  // 매장 목록 데이터 로드
  const loadStoreData = async () => {
    try {
      const stores = await commonCodeService.getStores();
      dispatch(setCodeData({ storeOptions: stores as any }));
      // 매장 목록 데이터 로드 완료
      
      // 로그인한 유저의 store_id가 있으면 자동으로 선택
      if (safeTrim(currentStoreId) !== '') {
        dispatch(setMasterData({ storeCode: safeTrim(currentStoreId) }));
      }
    } catch (error) {
      console.error('매장 목록 데이터 로드 실패:', error);
    }
  };

  return (
    <div className="order-registration-container">
      {/* 페이지 타이틀 */}
      <h1 className="order-page-title">
        {currentTab?.menuIcon ? (
          React.createElement(getMenuIcon(currentTab.menuIcon), { size: 16 })
        ) : (
          <i className="fas fa-shopping-cart"></i>
        )}
        발주등록
      </h1>

      {/* 상단 버튼 영역 */}
      <div className="order-registration-header">
        <div className="order-header-buttons">
          <div className="order-header-left-buttons">
        {deletePermission.hasPermission && (
          <button 
                  className="order-btn-delete" 
                  onClick={handleDelete}
                  disabled={isDeleting || isPermissionLoading}
          >
                  <i className="fas fa-trash"></i> {isDeleting ? '삭제 중...' : '삭제'}
          </button>
        )}
            {/* <button 
                className="order-btn-search" 
                onClick={handleSearch}
                disabled={!viewPermission.hasPermission || isPermissionLoading}
            >
                <i className="fas fa-search"></i> 조회
            </button> */}
          </div>
          <div className="order-header-right-buttons">
        <button 
                className="order-btn-new" 
                onClick={handleNew}
        >
                <i className="fas fa-undo"></i> 초기화
        </button>
          </div>
        </div>
      </div>

      <div className="order-registration-content">
        {/* 왼쪽 패널 - 발주 정보 */}
        <div className="order-left-panel">
          <div className="order-panel-header">
            <h4>
              <List size={16} />
              이전 발주 정보
            </h4>
      </div>

          <div className="order-search-section">
              <div className="order-search-row">
              <label>발주일자</label>
              <DateRangePicker
                startDate={searchOrderDateFrom}
                endDate={searchOrderDateTo}
                onStartDateChange={(date) => dispatch(setSearchCondition({ searchOrderDateFrom: date }))}
                onEndDateChange={(date) => dispatch(setSearchCondition({ searchOrderDateTo: date }))}
                placeholder="발주일자 범위를 선택하세요"
                className="order-form-control"
              />
              <label>입고요구일</label>
              <DateRangePicker
                startDate={shipmentRequestDateFrom}
                endDate={shipmentRequestDateTo}
                onStartDateChange={(date) => dispatch(setSearchCondition({ shipmentRequestDateFrom: date }))}
                onEndDateChange={(date) => dispatch(setSearchCondition({ shipmentRequestDateTo: date }))}
                placeholder="입고요구일 범위를 선택하세요"
                className="order-form-control"
              />
              </div>

            <div className="order-search-row">
              <label>검색어</label>
              <input 
                type="text" 
                value={searchTerm} 
                onChange={(e) => dispatch(setSearchCondition({ searchTerm: e.target.value }))}
                className="order-previous-form-control"
                placeholder="검색어를 입력하세요"
              />
              <div className="order-search-controls">
                <label className="order-checkbox-label">
                  <input 
                    type="checkbox" 
                    checked={unreceivedOrdersOnly}
                    onChange={(e) => dispatch(setSearchCondition({ unreceivedOrdersOnly: e.target.checked }))}
                  />
                  미입고 발주내역
                </label>
                {viewPermission.hasPermission && (
                  <button 
                      className="order-btn-search" 
                      onClick={handleSearch}
                      disabled={isPermissionLoading}
                  >
                  <i className="fas fa-search"></i> 조회
                  </button>
                )}
              </div>
              </div>
            </div>

            {/* 발주 내역 테이블 */}
            <div className="order-table-container">
                <AgGridReact
                rowData={orderList}
                columnDefs={orderListColumnDefs}
                defaultColDef={defaultColDef}
                // domLayout="autoHeight"                
                //headerHeight={35}
                rowHeight={30}
                suppressRowClickSelection={true}
                onRowDoubleClicked={handlePreviousOrderDoubleClick}
                className="ag-theme-alpine order-list-grid"
                noRowsOverlayComponent={() => (
                  <div className="ag-overlay-no-rows-center">
                    <div>조회된 데이터가 없습니다</div>
                  </div>
                )}
                />
            </div>
          </div>

        {/* 오른쪽 패널 - 발주 요약 정보 */}
        <div className="order-right-panel">
          <div className="order-panel-header order-panel-header-green">
            <h4>
              <FileText size={16} />
              발주 기본 정보(마스터)
            </h4>
          </div>
          
          <div className="order-summary-section">
            <div className="order-form-group">
              <label>발주번호</label>
              <input 
                type="text" 
                value={orderNumber} 
                className="order-master-form-control"
                disabled
                placeholder="발주 저장 시 자동 생성됩니다"
              />
            </div>
            
            <div className="order-form-group order-form-group-inline">
              <div className="order-form-field order-date-field">
                <label>발주일자 <span className="order-required">*</span></label>
                <HybridDatePicker
                  value={orderDate}
                  onChange={(value) => {
                    dispatch(setMasterData({ orderDate: value }));
                  }}
                  className="order-master-form-control-required"
                  required={true}
                  disabled={isOrderDateDisabled}
                  placeholder="YYYY-MM-DD"
                />
              </div>
              <div className="order-form-field order-date-field">
                <label>입고요구일 <span className="order-required">*</span></label>
                <HybridDatePicker
                  value={shipmentRequestDate}
                  onChange={(value) => {
                    dispatch(setMasterData({ shipmentRequestDate: value }));
                  }}
                  className="order-master-form-control-required"
                  required={true}
                  disabled={isShipmentRequestDateDisabled}
                  placeholder="YYYY-MM-DD"
                />
            </div>
          </div>
            
            <div className="order-form-group">
              <label>매장코드 <span className="order-required">*</span></label>
              <select 
                value={storeCode}
                onChange={(e) => dispatch(setMasterData({ storeCode: e.target.value }))}
                className="order-master-form-control order-master-form-control-required"
                required
                disabled={!!(safeTrim(currentStoreId) !== '') || isMasterFieldsDisabled || isStoreCodeDisabled}
              >
                <option value="">매장을 선택하세요</option>
                {codeData.storeOptions.map((store: any) => (
                  <option key={store.value} value={store.value}>
                    {store.label}
                  </option>
                ))}
              </select>
            </div>
            
            <div className="order-form-group order-form-group-inline">
              <div className="order-form-field" style={{ display: 'none' }}>
                <label>할인율</label>
                <input 
                  type="text" 
                  value={saleRate} 
                  onChange={(e) => {
                    dispatch(setMasterData({ saleRate: e.target.value }));
                    // 할인율 변경 시 모든 상품 금액 재계산
                    setTimeout(() => recalculateAllItems(), 100);
                  }}
                  className="order-master-form-control"
                />
              </div>
              <div className="order-form-field order-type-field">
                <label>발주구분 <span className="order-required">*</span></label>
                <div className="order-radio-group">
                  <label className="order-radio-label">
                    <input 
                      type="radio" 
                      name="orderType" 
                      value="210" 
                      checked={orderType === '210'}
                      disabled={isOrderTypeDisabled}
                      onChange={(e) => {
                        dispatch(setMasterData({ orderType: e.target.value }));
                      }}
                    />
                    <span className="order-radio-text">정상발주</span>
                  </label>
                  <label className="order-radio-label">
                    <input 
                      type="radio" 
                      name="orderType" 
                      value="220" 
                      checked={orderType === '220'}
                      disabled={isOrderTypeDisabled}
                      onChange={(e) => {
                        dispatch(setMasterData({ orderType: e.target.value }));
                      }}
                    />
                    <span className="order-radio-text">반품발주</span>
                  </label>
                </div>
              </div>
            </div>

            <div className="order-form-group order-form-group-textarea">
              <label>비고</label>
              <textarea 
                value={remarks} 
                onChange={(e) => {
                  dispatch(setMasterData({ remarks: e.target.value }));
                }}
                className="order-master-form-control"
                rows={2}
              />
            </div>
            
            <div className="order-form-group">
              <label>주소</label>
              <input 
                type="text" 
                value={address} 
                onChange={(e) => {
                  dispatch(setMasterData({ address: e.target.value }));
                }}
                className="order-master-form-control"
              />
            </div>
            
            <div className="order-form-group">
              <label>받는 사람</label>
              <input 
                type="text" 
                value={recipient} 
                onChange={(e) => {
                  dispatch(setMasterData({ recipient: e.target.value }));
                }}
                className="order-master-form-control"
              />
            </div>
            
            <div className="order-form-group">
              <label>전화번호</label>
              <input 
                type="text" 
                value={phoneNumber} 
                onChange={(e) => {
                  dispatch(setMasterData({ phoneNumber: e.target.value }));
                }}
                className="order-master-form-control"
              />
            </div>
          </div>
                </div>
              </div>

      {/* 상품검색 영역 - 주석처리 */}
      {/* 
      <div className="order-product-search-section">
        <div className="order-slip-title-section">
          <h4>
            <Receipt size={16} />
            상품검색
          </h4>
        </div>
        
        <div className="order-search-controls">
          <div className="order-search-input-group">
            <label>상품</label>
            <input 
              type="text" 
              value={productSearchTerm} 
              onChange={(e) => dispatch(setSearchCondition({ productSearchTerm: e.target.value }))}
              className="order-form-control"
              placeholder="(상품코드/상품명/바코드 검색)"
            />
            {viewPermission.hasPermission && (
              <button 
                className="order-btn order-btn-primary" 
                onClick={handleProductSearch}
                disabled={isPermissionLoading}
              >
                검색
              </button>
            )}
          </div>
          
          <div className="order-search-options">
            <label className="order-checkbox-label">
              <input 
                type="checkbox" 
                checked={excludeEndedProducts} 
                onChange={(e) => dispatch(setSearchCondition({ excludeEndedProducts: e.target.checked }))}
              />
              종료 상품 제외
            </label>
          </div>
          
          <button 
            className="order-btn order-btn-secondary" 
            onClick={handleMoveToOrderSlip}
          >
            #발주상세내역↓
          </button>
        </div>

        <div className="order-table-container">
                <AgGridReact
            rowData={productList}
            columnDefs={productListColumnDefs}
            defaultColDef={defaultColDef}
            domLayout="autoHeight"
            headerHeight={35}
            rowHeight={30}
            suppressRowClickSelection={true}
            onRowDoubleClicked={handleProductDoubleClick}
            className="ag-theme-alpine order-product-list-grid"
                />
              </div>
            </div>
      */}

      {/* 발주전표내역 내용 */}
      <div className="order-slip-content-section">
        {/* 발주전표내역 타이틀 */}
        <div className="order-slip-title-section order-slip-title-section-green">
          <h4>
            <Receipt size={16} />
            발주 상세 내역(디테일)
          </h4>
        </div>
        <div className="order-slip-controls">
          <div className="order-slip-left-controls">
            {/* <button 
              className="order-btn order-btn-outline-primary" 
              onClick={handleSelectAll}
            >
              전체선택
            </button>
            <button 
              className="order-btn order-btn-outline-secondary" 
              onClick={handleCancelAll}
            >
              선택취소
            </button> */}
            <div className="order-slip-summary-container">
              <div className="order-slip-summary-horizontal">
                <div className="summary-title">
                  전표 합계 <span className="summary-count">({orderSlipList.length}건)</span>
                </div>
                <div className="summary-items">
                  <div className="summary-item">
                    <span className="summary-label">수량</span>
                    <span className="summary-value">{orderSummary.totalQuantity.toLocaleString('ko-KR')}</span>
                  </div>
                  <div className="summary-divider"></div>
                  <div className="summary-item">
                    <span className="summary-label">공급가</span>
                    <span 
                      className="summary-value" 
                      style={orderSummary.totalSupplyAmount < 0 ? { color: '#e74c3c', fontWeight: '500' } : {}}
                    >
                      {orderSummary.totalSupplyAmount.toLocaleString('ko-KR')}원
                    </span>
                  </div>
                  <div className="summary-divider"></div>
                  <div className="summary-item">
                    <span className="summary-label">부가세</span>
                    <span 
                      className="summary-value" 
                      style={orderSummary.totalVatAmount < 0 ? { color: '#e74c3c', fontWeight: '500' } : {}}
                    >
                      {orderSummary.totalVatAmount.toLocaleString('ko-KR')}원
                    </span>
                  </div>
                  <div className="summary-divider"></div>
                     <div className="summary-item highlight">
                       <span className="summary-label">발주총금액</span>
                       <span 
                         className="summary-value" 
                         style={orderSummary.totalAmount < 0 ? { color: '#e74c3c', fontWeight: '500' } : {}}
                       >
                         {orderSummary.totalAmount.toLocaleString('ko-KR')}원
                       </span>
                     </div>
                     <div className="summary-divider"></div>
                     <div className="summary-item highlight-secondary">
                       <span className="summary-label">소비자가총금액</span>
                       <span 
                         className="summary-value" 
                         style={orderSummary.totalAmount < 0 ? { color: '#e74c3c', fontWeight: '500' } : {}}
                       >
                         {orderSummary.totalAmount.toLocaleString('ko-KR')}원
                       </span>
                     </div>
                </div>
              </div>
              
              {/* 발주서전송 버튼 - 전표합계 판넬 바로 옆 */}
              <div className="order-send-button-wrapper">
                <button 
                  className="order-btn-send" 
                  onClick={() => setShowOrderSendModal(true)}
                  disabled={!orderNumber || orderSlipList.length === 0}
                  title={!orderNumber ? '발주번호가 필요합니다' : orderSlipList.length === 0 ? '발주 상품이 필요합니다' : '벤더에게 발주서를 전송합니다'}
                >
                  <Mail size={12} />
                  발주서전송
                </button>
              </div>
            </div>
          </div>
          <div className="order-slip-right-controls">
            <button 
              className="order-btn-search-modal" 
              onClick={handleOpenProductSearch}
            >
              <i className="fas fa-search"></i> 상품검색
            </button>
            {savePermission.hasPermission && (
              <button 
                className="order-btn-save" 
                onClick={handleSave}
                disabled={!canSave() || isPermissionLoading}
              >
                <i className="fas fa-save"></i> 저장
                {getChangeDescription()}
              </button>
            )}
      </div>
        </div>

        {/* 발주전표 테이블 */}        
        <div className="order-table-container order-slip-table-container">
          <CommonAgGrid
            ref={orderSlipGridRef}
            rowData={orderSlipList}
            columnDefs={orderSlipColumnDefs}
            height="100%"
            className="ag-theme-alpine order-slip-grid"
            enableCheckbox={true}
            getRowId={(params) => {
              // uniqueId가 있으면 사용하고, 없으면 기존 로직 사용
              const uniqueId = params.data.uniqueId || `${params.data.goodsId}-${params.data.seqNo || 'unknown'}`;
              // console.log('🔍 getRowId 생성:', {
              //   goodsId: params.data.goodsId,
              //   seqNo: params.data.seqNo,
              //   uniqueId: params.data.uniqueId,
              //   finalId: uniqueId
              // });
              return uniqueId;
            }}
            isRowSelected={(rowData) => {
              // getRowId와 동일한 로직 사용
              const rowId = rowData.uniqueId || `${rowData.goodsId}-${rowData.seqNo || 'unknown'}`;
              // console.log('🔍 isRowSelected 체크:', { 
              //   goodsId: rowData.goodsId, 
              //   seqNo: rowData.seqNo, 
              //   uniqueId: rowData.uniqueId,
              //   rowId, 
              //   hasChanged: changedRows.includes(rowId) 
              // });
              return changedRows.includes(rowId);
            }}
            onSelectionChanged={(selectedRows) => {
              //console.log('선택된 행:', selectedRows);
              
              // 체크박스가 해제된 행들의 변화 상태도 해제
              const selectedRowIds = new Set(selectedRows.map(row => 
                row.uniqueId || `${row.goodsId}-${row.seqNo || 'unknown'}`
              ));
              const allRowIds = new Set(orderSlipList.map(item => 
                item.uniqueId || `${item.goodsId}-${item.seqNo || 'unknown'}`
              ));
              
              // 체크 해제된 행들 찾기
              allRowIds.forEach(rowId => {
                if (!selectedRowIds.has(rowId) && changedRows.includes(rowId)) {
                  unmarkRowAsChanged(rowId);
                }
              });
            }}
            onRowDoubleClicked={(rowData) => {
              console.log('행 더블클릭:', rowData);
            }}
            onCellValueChanged={(event) => {
              console.log('셀 값 변경:', event);
              // 셀 값이 변경되면 금액 재계산 및 전표합계 업데이트
              if (event.data) {
                const changedField = event.colDef.field;
                //console.log('변경된 필드:', changedField);
                const rowId = event.data.uniqueId || `${event.data.goodsId}-${event.data.seqNo || 'unknown'}`;
                //console.log('🔍 셀 변경 상세:', {
                //   goodsId: event.data.goodsId,
                //   seqNo: event.data.seqNo,
                //   rowIndex: event.rowIndex,
                //   rowId: rowId,
                //   changedField: changedField,
                //   newValue: event.newValue,
                //   oldValue: event.oldValue
                // });
                //console.log('현재 changedRows:', Array.from(changedRows));
                //console.log('전체 orderSlipList의 goodsId들:', orderSlipList.map(item => ({ goodsId: item.goodsId, goodsName: item.goodsName, seqNo: item.seqNo })));
                
                // 변화 감지: 사용자가 직접 수정한 경우 체크박스 체크
                markRowAsChanged(rowId);
                
                // 수량이나 할인율이 변경된 경우 금액 재계산
                if (changedField === 'orderQty' || changedField === 'saleRate') {
                  //console.log('수량 또는 할인율 변경으로 인한 금액 재계산');
                  const recalculatedItem = recalculateItemAmounts(event.data);
                  //console.log('🔍 재계산된 아이템:', recalculatedItem);
                  
                  const updatedList = orderSlipList.map(item => {
                    const isTarget = item.uniqueId === event.data.uniqueId;
                    console.log('🔍 아이템 비교:', {
                      itemUniqueId: item.uniqueId,
                      eventUniqueId: event.data.uniqueId,
                      isTarget: isTarget,
                      itemGoodsId: item.goodsId,
                      eventGoodsId: event.data.goodsId
                    });
                    return isTarget ? recalculatedItem : item;
                  });
                  console.log('🔍 업데이트된 리스트 길이:', updatedList.length);
                  console.log('🔍 업데이트된 리스트 uniqueId들:', updatedList.map(item => item.uniqueId));
                  dispatch(setOrderSlipList(updatedList));
                } else {
                  // 다른 필드 변경 시 단순 업데이트
                  const updatedList = orderSlipList.map(item => 
                    item.uniqueId === event.data.uniqueId ? event.data : item
                  );
                  dispatch(setOrderSlipList(updatedList));
                }
              }
            }}
          />
        </div>

            </div>

      {/* 상품검색 팝업 */}
      {showProductSearchModal && (
        <div className="order-product-search-popup">
          <div 
            className={`order-product-search-popup-content ${isDragging ? 'dragging' : ''}`}
            style={{
              left: `${modalPosition.x}px`,
              top: `${modalPosition.y}px`,
              cursor: isDragging ? 'grabbing' : 'default'
            }}
            onMouseDown={handleMouseDown}
          >
            <div className="order-product-search-popup-header">
              <h3>
                <i className="fas fa-search"></i>
                상품검색
              </h3>
              <button 
                className="order-popup-close-btn" 
                onClick={handleCloseProductSearch}
              >
                <i className="fas fa-times"></i>
              </button>
            </div>
            
            <div className="order-product-search-popup-body">
              {/* 검색 및 필터 영역 */}
              <div className="product-search-toolbar">
                {/* 1라인: 상품구분, 브랜드, 대분류 */}
                <div className="search-row">
                  <div className="filter-item">
                    <CommonMultiSelect
                      options={goodsGbnOptions}
                      selectedValues={selectedGoodsGbn}
                      onSelectionChange={(selected) => dispatch(setSearchCondition({ selectedGoodsGbn: selected }))}
                      placeholder="상품구분"
                    />
                  </div>
                  
                  <div className="filter-item">
                    <CommonMultiSelect
                      options={brandOptions}
                      selectedValues={selectedBrands}
                      onSelectionChange={(selected) => dispatch(setSearchCondition({ selectedBrands: selected }))}
                      placeholder="브랜드"
                    />
                  </div>
                  
                  <div className="filter-item">
                    <CommonMultiSelect
                      options={btypeOptions}
                      selectedValues={selectedBtypes}
                      onSelectionChange={(selected) => dispatch(setSearchCondition({ selectedBtypes: selected }))}
                      placeholder="대분류"
                    />
                  </div>
                </div>
                
                {/* 2라인: 상품코드검색어, 종료상품제외, 발주상세에추가 */}
                <div className="search-row">
                  <div className="search-input-container">
                    <input 
                      ref={productSearchInputRef}
                      type="text" 
                      value={productSearchTerm} 
                      onChange={handleSearchTermChange}
                      onKeyPress={handleSearchKeyPress}
                      className={`modern-search-input ${isBarcodeScanning ? 'barcode-scanning' : ''}`}
                      placeholder="상품코드, 상품명, 바코드로 검색..."
                    />
                    {isBarcodeScanning && (
                      <div className="barcode-indicator">
                        <i className="fas fa-barcode"></i>
                        <span>바코드 센싱</span>
                      </div>
                    )}
                    {viewPermission.hasPermission && (
                      <button 
                        className="search-btn" 
                        onClick={handleProductSearch}
                        disabled={isPermissionLoading}
                      >
                        <i className="fas fa-search"></i>
                      </button>
                    )}
                  </div>
                  
                  <div className="search-options">
                    <label className="modern-checkbox">
                      <input 
                        type="checkbox" 
                        checked={excludeEndedProducts} 
                        onChange={(e) => dispatch(setSearchCondition({ excludeEndedProducts: e.target.checked }))}
                      />
                      <span className="checkmark"></span>
                      종료 상품 제외
                    </label>
                  </div>
                  
                  <button 
                    className="add-to-order-btn" 
                    onClick={handleMoveToOrderSlip}
                    disabled={selectedProducts.length === 0}
                    title="선택된 상품을 발주상세에 추가하세요"
                  >
                    <i className="fas fa-plus"></i>
                    발주상세에 추가 {selectedProducts.length > 0 && `(${selectedProducts.length}개 선택됨)`}
                  </button>
                </div>
              </div>

              {/* 상품 목록 그리드 */}
              <div className="product-grid-container">
                <CommonAgGrid
                  ref={productSearchGridRef}
                  rowData={productList}
                  columnDefs={productListColumnDefs}
                  height="300px"
                  className="ag-theme-alpine order-slip-grid"
                  enableCheckbox={true}
                  onSelectionChanged={handleProductSelectionChange}
                  onRowDoubleClicked={handleProductRowDoubleClick}
                />
              </div>
            </div>
            </div>
          </div>
        )}

        {/* 초기화 확인 모달 */}
        {showResetConfirmModal && (
          <div className="order-reset-confirm-modal-overlay">
            <div className="order-reset-confirm-modal">
              <div className="order-reset-confirm-modal-header">
                <h3>초기화 확인</h3>
                <button 
                  className="order-reset-confirm-modal-close"
                  onClick={handleResetCancel}
                >
                  <i className="fas fa-times"></i>
                </button>
              </div>
              
              <div className="order-reset-confirm-modal-body">
                <div className="order-reset-confirm-icon">
                  <i className="fas fa-exclamation-triangle"></i>
                </div>
                <div className="order-reset-confirm-message">
                  <p>마스터 구역과 디테일 구역에 입력된 데이터가 있습니다.</p>
                  {user?.roleId === 4 && currentStoreId && currentStoreId.trim() !== '' && (
                    <p className="order-reset-confirm-store-note">
                      <i className="fas fa-info-circle"></i>
                      매장코드는 유지됩니다.
                    </p>
                  )}
                  <p>정말로 초기화하시겠습니까?</p>
                </div>
              </div>
              
              <div className="order-reset-confirm-modal-footer">
                <button 
                  className="order-reset-confirm-btn order-reset-confirm-btn-cancel"
                  onClick={handleResetCancel}
                >
                  취소
                </button>
                <button 
                  className="order-reset-confirm-btn order-reset-confirm-btn-confirm"
                  onClick={performReset}
                >
                  초기화
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 저장/수정 확인 모달 */}
        <ConfirmationModal
          isOpen={confirmationModal.isOpen}
          onConfirm={() => {
            setConfirmationModal({ isOpen: false, type: 'save', onConfirm: () => {} });
            confirmationModal.onConfirm();
          }}
          onCancel={() => setConfirmationModal({ isOpen: false, type: 'save', onConfirm: () => {} })}
          type={confirmationModal.type}
          title={confirmationModal.type === 'save' ? '저장 확인' : '수정 확인'}
          message={confirmationModal.type === 'save' ? '발주 정보를 저장하시겠습니까?' : '발주 정보를 수정하시겠습니까?'}
        />

        {/* 성공 모달 */}
        <SuccessModal
          isOpen={successModal.isOpen}
          onClose={() => {
            // 커스텀 onClose 콜백이 있으면 실행
            console.log('🔍 SuccessModal onClose 호출됨');
            console.log('🔍 successModal.onClose 존재 여부:', !!successModal.onClose);
            if (successModal.onClose) {
              console.log('🚀 successModal.onClose 실행 시작');
              successModal.onClose();
              console.log('✅ successModal.onClose 실행 완료');
            }
            
            setSuccessModal({ isOpen: false, type: 'save', message: '', details: '' });
            // 성공 모달 닫힐 때 확인 모달도 함께 정리
            setConfirmationModal({ isOpen: false, type: 'save', onConfirm: () => {} });
            
            // 저장/업데이트 완료 후 화면 상태 정리
            console.log('🎉 성공 모달 닫힘 - 화면 상태 정리 완료');
          }}
          type={successModal.type}
          message={successModal.message}
          details={successModal.details}
          changedFields={successModal.changedFields}
        />

        {/* 삭제 확인 모달 */}
        {showDeleteConfirmModal && (
          <div className="order-delete-confirm-modal-overlay">
            <div className="order-delete-confirm-modal">
              <div className="order-delete-confirm-modal-header">
                <h3>삭제 확인</h3>
                <button 
                  className="order-delete-confirm-modal-close"
                  onClick={handleDeleteCancel}
                >
                  <i className="fas fa-times"></i>
                </button>
              </div>
              
              <div className="order-delete-confirm-modal-body">
                <div className="order-delete-confirm-icon">
                  <i className="fas fa-exclamation-triangle"></i>
                </div>
                <div className="order-delete-confirm-content">
                  <p className="order-delete-confirm-message">
                    {deleteConfirmMessage.split('\n').map((line, index) => (
                      <span key={index}>
                        {line}
                        {index < deleteConfirmMessage.split('\n').length - 1 && <br />}
                      </span>
                    ))}
                  </p>
                </div>
              </div>
              
              <div className="order-delete-confirm-modal-footer">
                <button 
                  className="order-delete-confirm-btn order-delete-confirm-btn-cancel"
                  onClick={handleDeleteCancel}
                >
                  취소
                </button>
                <button 
                  className="order-delete-confirm-btn order-delete-confirm-btn-confirm"
                  onClick={handleDeleteConfirm}
                  disabled={isDeleting}
                >
                  {isDeleting ? '삭제 중...' : '삭제'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 발주서전송 모달 */}
        <OrderSendModal
          isOpen={showOrderSendModal}
          onClose={() => setShowOrderSendModal(false)}
          orderData={{
            orderDate: orderDate,
            orderSequ: orderSequ,
            orderNumber: orderNumber
          }}
        />

    </div>
  );
};

export default OrderRegistration;
