import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { resetAllStates, clearAllData } from './globalActions';

// 발주 상품 데이터 타입 정의
interface OrderProductData {
  GOODS_ID: number;
  GOODS_ID_BRAND: string;
  GOODS_NM: string;
  GOODS_KOR: string;
  GOODS_NM_EN: string;
  GOODS_NM_JP: string;
  GOODS_NM_CN: string;
  BAR_CODE: string;
  GOODS_NO: string;
  FOREIGN_ID: string;
  FOREIGN_NM: string;
  GOODS_GBN: string;
  GOODS_GBN_NM: string;
  BRAND_ID: string;
  BRAND_GBN_NM: string;
  MAKER_GBN: string;
  MAKER_GBN_NM: string;
  COLLECTION_GBN: string;
  COLLECTION_GBN_NM: string;
  COUNTRY_OF_ORIGIN: string;
  NATION_GBN?: string;
  HS_CODE: string;
  BTYPE_GBN: string;
  BTYPE_GBN_NM: string;
  MTYPE_GBN: string;
  MTYPE_GBN_NM: string;
  STYPE_GBN: string;
  STYPE_GBN_NM: string;
  USE_GBN: string;
  SET_GBN: string;
  GWP_GBN: string;
  CHANN_GBN: string;
  MANA_GBN: string;
  FUNC_GBN: string;
  BOX_GBN: string;
  ABC_CLASS: string;
  GOODS_CAPA: string;
  GOODS_UNIT: string;
  PACKING_SIZE: string;
  STORAGE_CONDITION: string;
  EXPIRY_PERIOD: string;
  SUPPLY_DAN: string;
  BUY_DAN: string;
  MONEY_GBN: string;
  TAX_RATE: string;
  VAT_YN: string;
  SUPPLIER_ID: string;
  LEAD_TIME: string;
  SAFETY_STOCK: string;
  MAX_STOCK: string;
  REORDER_POINT: string;
  ORDER_UNIT_QTY: string;
  MIN_ORDER_QTY: string;
  WAREHOUSE_LOCATION: string;
  LOT_MANAGEMENT_YN: string;
  STOCK_YN: string;
  QUALITY_GRADE: string;
  INSPECTION_CYCLE: string;
  RETURN_POLICY: string;
  WARRANTY_PERIOD: string;
  RUN_D: string;
  END_D: string;
  OPEN_D: string;
  CLOSE_D: string;
  ACCOUNT_CODE: string;
  COST_CENTER: string;
  PROFIT_CENTER: string;
  REMARKS: string;
  USER_ID: string;
  SYS_TIME: string;
  UPD_USER: string;
  UPD_TIME: string;
  // 발주 관련 추가 필드
  ORDER_QTY?: number;
  SUPPLY_AMOUNT?: number;
  BUY_AMOUNT?: number;
  VAT_AMOUNT?: number;
  TOTAL_AMOUNT?: number;
  // 인덱스 시그니처 추가 (동적 필드 접근용)
  [key: string]: any;
}

// 발주 마스터 데이터 타입 정의
interface OrderMasterData {
  orderDate: string;
  shipmentRequestDate: string;
  storeCode: string;
  saleRate: string;
  orderNumber: string;
  orderSequ: number;
  orderType: string;
  remarks: string;
  address: string;
  recipient: string;
  phoneNumber: string;
}

// 검색 조건 타입
interface SearchCondition {
  searchOrderDateFrom: string;
  searchOrderDateTo: string;
  shipmentRequestDateFrom: string;
  shipmentRequestDateTo: string;
  searchTerm: string;
  productSearchTerm: string;
  excludeEndedProducts: boolean;
  unreceivedOrdersOnly: boolean;
  selectedGoodsGbn: string[];
  selectedBrands: string[];
  selectedBtypes: string[];
}

// 발주 요약 정보 타입
interface OrderSummary {
  totalQuantity: number;
  totalSupplyAmount: number;
  totalBuyAmount: number;
  totalVatAmount: number;
  totalAmount: number;
  totalSalesAmount: number;
}

// 코드 데이터 타입
interface CodeData {
  code: string;
  codeNm: string;
}

// 발주등록 상태 타입
interface OrderRegistrationState {
  // 마스터 데이터
  masterData: OrderMasterData;
  
  // 검색 조건
  searchCondition: SearchCondition;
  
  // 상품 데이터
  selectedProducts: OrderProductData[];
  productList: OrderProductData[];
  
  // 발주 목록 데이터
  orderList: any[];
  orderSlipList: any[];
  
  // 발주 요약 정보
  orderSummary: OrderSummary;
  
  // 변화 감지 및 체크박스 관리
  changedRows: string[];
  
  // 마스터 필드 원본 값 저장 (변경 감지용)
  originalMasterData: OrderMasterData;
  
  // 필드 비활성화 상태
  isMasterFieldsDisabled: boolean;
  isOrderTypeDisabled: boolean;
  isOrderDateDisabled: boolean;
  isShipmentRequestDateDisabled: boolean;
  isStoreCodeDisabled: boolean;
  
  // 코드 데이터
  codeData: {
    goodsGbn: CodeData[];
    brandGbn: CodeData[];
    btypeGbn: CodeData[];
    claimGbn: CodeData[];
    storeOptions: CodeData[];
  };
  
  // 로딩 및 초기화 상태
  isLoading: boolean;
  isInitialized: boolean;
  
  // 포커스 관리
  focusTarget: { rowIndex: number; colKey: string } | null;
}

// 초기 상태
const getInitialMasterData = (): OrderMasterData => {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  const todayStr = `${year}-${month}-${day}`;
  
  // 일주일 후 날짜 계산 (주말이면 다음 평일로 조정)
  const oneWeekLater = new Date(today.getTime() + (7 * 24 * 60 * 60 * 1000));
  const dayOfWeek = oneWeekLater.getDay();
  if (dayOfWeek === 0) { // 일요일
    oneWeekLater.setDate(oneWeekLater.getDate() + 1);
  } else if (dayOfWeek === 6) { // 토요일
    oneWeekLater.setDate(oneWeekLater.getDate() + 2);
  }
  const shipmentDate = `${oneWeekLater.getFullYear()}-${String(oneWeekLater.getMonth() + 1).padStart(2, '0')}-${String(oneWeekLater.getDate()).padStart(2, '0')}`;
  
  return {
    orderDate: todayStr,
    shipmentRequestDate: shipmentDate,
    storeCode: '',
    saleRate: '0.00',
    orderNumber: '',
    orderSequ: 0,
    orderType: '210', // 정상발주
    remarks: '',
    address: '',
    recipient: '',
    phoneNumber: ''
  };
};

const getInitialSearchCondition = (): SearchCondition => {
  const today = new Date();
  const thirtyDaysAgo = new Date(today.getTime() - (30 * 24 * 60 * 60 * 1000));
  const thirtyDaysLater = new Date(today.getTime() + (30 * 24 * 60 * 60 * 1000));
  
  const formatDate = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };
  
  return {
    searchOrderDateFrom: formatDate(thirtyDaysAgo),
    searchOrderDateTo: formatDate(thirtyDaysLater),
    shipmentRequestDateFrom: '',
    shipmentRequestDateTo: '',
    searchTerm: '',
    productSearchTerm: '',
    excludeEndedProducts: true,
    unreceivedOrdersOnly: true,
    selectedGoodsGbn: [],
    selectedBrands: [],
    selectedBtypes: []
  };
};

const initialState: OrderRegistrationState = {
  masterData: getInitialMasterData(),
  searchCondition: getInitialSearchCondition(),
  selectedProducts: [],
  productList: [],
  orderList: [],
  orderSlipList: [],
  orderSummary: {
    totalQuantity: 0,
    totalSupplyAmount: 0,
    totalBuyAmount: 0,
    totalVatAmount: 0,
    totalAmount: 0,
    totalSalesAmount: 0
  },
  changedRows: [],
  originalMasterData: getInitialMasterData(),
  isMasterFieldsDisabled: false,
  isOrderTypeDisabled: false,
  isOrderDateDisabled: false,
  isShipmentRequestDateDisabled: false,
  isStoreCodeDisabled: false,
  codeData: {
    goodsGbn: [],
    brandGbn: [],
    btypeGbn: [],
    claimGbn: [],
    storeOptions: []
  },
  isLoading: false,
  isInitialized: false,
  focusTarget: null
};

// 발주등록 Slice 생성
const orderRegistrationSlice = createSlice({
  name: 'orderRegistration',
  initialState,
  reducers: {
    // 마스터 데이터 변경
    setMasterData: (state, action: PayloadAction<Partial<OrderMasterData>>) => {
      state.masterData = { ...state.masterData, ...action.payload };
    },
    
    // 검색 조건 변경
    setSearchCondition: (state, action: PayloadAction<Partial<SearchCondition>>) => {
      state.searchCondition = { ...state.searchCondition, ...action.payload };
    },
    
    // 선택된 상품 설정
    setSelectedProducts: (state, action: PayloadAction<OrderProductData[]>) => {
      state.selectedProducts = action.payload;
    },
    
    // 상품 목록 설정
    setProductList: (state, action: PayloadAction<OrderProductData[]>) => {
      state.productList = action.payload;
    },
    
    // 발주 목록 설정
    setOrderList: (state, action: PayloadAction<any[]>) => {
      state.orderList = action.payload;
    },
    
    // 발주 전표 목록 설정
    setOrderSlipList: (state, action: PayloadAction<any[]>) => {
      state.orderSlipList = action.payload;
    },
    
    // 발주 요약 정보 설정
    setOrderSummary: (state, action: PayloadAction<Partial<OrderSummary>>) => {
      state.orderSummary = { ...state.orderSummary, ...action.payload };
    },
    
    // 변화된 행 추가/제거
    addChangedRow: (state, action: PayloadAction<string>) => {
      if (!state.changedRows.includes(action.payload)) {
        state.changedRows.push(action.payload);
      }
    },
    
    removeChangedRow: (state, action: PayloadAction<string>) => {
      state.changedRows = state.changedRows.filter(rowId => rowId !== action.payload);
    },
    
    clearChangedRows: (state) => {
      state.changedRows = [];
    },
    
    // 원본 마스터 데이터 설정
    setOriginalMasterData: (state, action: PayloadAction<OrderMasterData>) => {
      state.originalMasterData = action.payload;
    },
    
    // 필드 비활성화 상태 설정
    setMasterFieldsDisabled: (state, action: PayloadAction<boolean>) => {
      state.isMasterFieldsDisabled = action.payload;
    },
    
    setOrderTypeDisabled: (state, action: PayloadAction<boolean>) => {
      state.isOrderTypeDisabled = action.payload;
    },
    
    setOrderDateDisabled: (state, action: PayloadAction<boolean>) => {
      state.isOrderDateDisabled = action.payload;
    },
    
    setShipmentRequestDateDisabled: (state, action: PayloadAction<boolean>) => {
      state.isShipmentRequestDateDisabled = action.payload;
    },
    
    setStoreCodeDisabled: (state, action: PayloadAction<boolean>) => {
      state.isStoreCodeDisabled = action.payload;
    },
    
    // 코드 데이터 설정
    setCodeData: (state, action: PayloadAction<Partial<OrderRegistrationState['codeData']>>) => {
      state.codeData = { ...state.codeData, ...action.payload };
    },
    
    // 로딩 상태 설정
    setIsLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },
    
    // 포커스 타겟 설정
    setFocusTarget: (state, action: PayloadAction<{ rowIndex: number; colKey: string } | null>) => {
      state.focusTarget = action.payload;
    },
    
    // 상품 추가
    addProduct: (state, action: PayloadAction<OrderProductData>) => {
      const existingIndex = state.selectedProducts.findIndex(
        product => product.GOODS_ID === action.payload.GOODS_ID
      );
      
      if (existingIndex >= 0) {
        // 이미 존재하는 상품이면 수량 증가
        state.selectedProducts[existingIndex].ORDER_QTY = 
          (state.selectedProducts[existingIndex].ORDER_QTY || 0) + 1;
      } else {
        // 새로운 상품 추가
        state.selectedProducts.push({
          ...action.payload,
          ORDER_QTY: 1,
          SUPPLY_AMOUNT: 0,
          BUY_AMOUNT: 0,
          VAT_AMOUNT: 0,
          TOTAL_AMOUNT: 0
        });
      }
    },
    
    // 상품 제거
    removeProduct: (state, action: PayloadAction<number>) => {
      state.selectedProducts = state.selectedProducts.filter(
        product => product.GOODS_ID !== action.payload
      );
    },
    
    // 상품 수량 변경
    updateProductQuantity: (state, action: PayloadAction<{ goodsId: number; quantity: number }>) => {
      const product = state.selectedProducts.find(p => p.GOODS_ID === action.payload.goodsId);
      if (product) {
        product.ORDER_QTY = action.payload.quantity;
      }
    },
    
    // 상품 금액 변경
    updateProductAmount: (state, action: PayloadAction<{ 
      goodsId: number; 
      field: 'SUPPLY_AMOUNT' | 'BUY_AMOUNT' | 'VAT_AMOUNT' | 'TOTAL_AMOUNT';
      amount: number;
    }>) => {
      const product = state.selectedProducts.find(p => p.GOODS_ID === action.payload.goodsId);
      if (product) {
        product[action.payload.field] = action.payload.amount;
      }
    },
    
    // 상태 초기화
    resetState: (state) => {
      state.masterData = getInitialMasterData();
      state.searchCondition = getInitialSearchCondition();
      state.selectedProducts = [];
      state.productList = [];
      state.orderList = [];
      state.orderSlipList = [];
      state.orderSummary = {
        totalQuantity: 0,
        totalSupplyAmount: 0,
        totalBuyAmount: 0,
        totalVatAmount: 0,
        totalAmount: 0,
        totalSalesAmount: 0
      };
      state.changedRows = [];
      state.originalMasterData = getInitialMasterData();
      state.isMasterFieldsDisabled = false;
      state.isOrderTypeDisabled = false;
      state.isOrderDateDisabled = false;
      state.isShipmentRequestDateDisabled = false;
      state.isStoreCodeDisabled = false;
      state.isLoading = false;
      state.isInitialized = false;
      state.focusTarget = null;
    },
    
    // 전체 상태 복원
    restoreState: (_, action: PayloadAction<OrderRegistrationState>) => {
      return action.payload;
    },
    
    // 화면 초기화
    initializeScreen: (state) => {
      state.isInitialized = true;
    }
  },
  extraReducers: (builder) => {
    builder
      // 글로벌 상태 초기화 처리 (로그아웃 시에만)
      .addCase(resetAllStates, () => initialState)
      // 브라우저 종료 시 데이터 정리 (상태 유지)
      .addCase(clearAllData, (state) => state);
  }
});

// 액션 생성자 내보내기
export const {
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
  setCodeData,
  setIsLoading,
  setFocusTarget,
  addProduct,
  removeProduct,
  updateProductQuantity,
  updateProductAmount,
  resetState,
  restoreState,
  initializeScreen
} = orderRegistrationSlice.actions;

// 리듀서 내보내기
export default orderRegistrationSlice.reducer;

// 타입 내보내기
export type { 
  OrderProductData, 
  OrderMasterData, 
  SearchCondition, 
  OrderSummary, 
  CodeData, 
  OrderRegistrationState 
};
