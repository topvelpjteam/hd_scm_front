import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { resetAllStates, clearAllData } from './globalActions';

// 상품 데이터 타입 정의
interface ProductData {
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
  NATION_GBN?: string; // 원산지 (스토어드 프로시저용)
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
  // 인덱스 시그니처 추가 (동적 필드 접근용)
  [key: string]: any;
}

// 검색 조건 타입
interface SearchCondition {
  goodsGbn: string[];
  brandId: string[];
  btypeGbn: string[];
  mtypeGbn: string[];
  stypeGbn: string[];
  goodsNm: string;
  excludeClosed: boolean;
  BTYPE_GBN: string;
  MTYPE_GBN: string;
  STYPE_GBN: string;
}

// 코드 데이터 타입
interface CodeData {
  code: string;
  codeNm: string;
}

// 상품등록 상태 타입
interface ProductRegistrationState {
  searchCondition: SearchCondition;
  productData: ProductData[];
  selectedProduct: ProductData | null;
  isNewMode: boolean;
  isLoading: boolean;
  isInitialized: boolean; // 화면 초기화 여부
  codeData: {
    goodsGbn: CodeData[];
    brandGbn: CodeData[];
    btypeGbn: CodeData[];
    mtypeGbn: CodeData[];
    stypeGbn: CodeData[];
    makerGbn: CodeData[];
    collectionGbn: CodeData[];
  };
}

// 초기 상태
const initialState: ProductRegistrationState = {
  searchCondition: {
    goodsGbn: [],
    brandId: [],
    btypeGbn: [],
    mtypeGbn: [],
    stypeGbn: [],
    goodsNm: '',
    excludeClosed: true, // 기본적으로 종료상품 제외
    BTYPE_GBN: '',
    MTYPE_GBN: '',
    STYPE_GBN: ''
  },
  productData: [],
  selectedProduct: null,
  isNewMode: false,
  isLoading: false,
  isInitialized: false, // 화면 초기화 여부
  codeData: {
    goodsGbn: [],
    brandGbn: [],
    btypeGbn: [],
    mtypeGbn: [],
    stypeGbn: [],
    makerGbn: [],
    collectionGbn: []
  }
};

// 상품등록 Slice 생성
const productRegistrationSlice = createSlice({
  name: 'productRegistration',
  initialState,
  reducers: {
    // 검색 조건 변경
    setSearchCondition: (state, action: PayloadAction<Partial<SearchCondition>>) => {
      state.searchCondition = { ...state.searchCondition, ...action.payload };
    },
    
    // 상품 데이터 설정
    setProductData: (state, action: PayloadAction<ProductData[]>) => {
      state.productData = action.payload;
    },
    
    // 선택된 상품 설정
    setSelectedProduct: (state, action: PayloadAction<ProductData | null>) => {
      state.selectedProduct = action.payload;
    },
    
    // 신규 모드 설정
    setIsNewMode: (state, action: PayloadAction<boolean>) => {
      state.isNewMode = action.payload;
    },
    
    // 로딩 상태 설정
    setIsLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },
    
    // 코드 데이터 설정
    setCodeData: (state, action: PayloadAction<Partial<ProductRegistrationState['codeData']>>) => {
      state.codeData = { ...state.codeData, ...action.payload };
    },
    
    // 상품 상세 정보 변경
    updateProductDetail: (state, action: PayloadAction<{ field: keyof ProductData; value: string }>) => {
      if (state.selectedProduct) {
        state.selectedProduct = {
          ...state.selectedProduct,
          [action.payload.field]: action.payload.value
        };
      }
    },
    
    // 상태 초기화
    resetState: (state) => {
      state.searchCondition = initialState.searchCondition;
      state.productData = [];
      state.selectedProduct = null;
      state.isNewMode = false;
      state.isLoading = false;
      state.isInitialized = false; // 화면 초기화 여부 초기화
    },
    
    // 전체 상태 복원
    restoreState: (state, action: PayloadAction<ProductRegistrationState>) => {
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
  setSearchCondition,
  setProductData,
  setSelectedProduct,
  setIsNewMode,
  setIsLoading,
  setCodeData,
  updateProductDetail,
  resetState,
  restoreState,
  initializeScreen
} = productRegistrationSlice.actions;

// 리듀서 내보내기
export default productRegistrationSlice.reducer;

// 타입 내보내기
export type { ProductData, SearchCondition, CodeData, ProductRegistrationState };
