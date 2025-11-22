import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { resetAllStates, clearAllData } from './globalActions';

// 고객 정보 타입 (간략화)
interface CustomerInfo {
  CUST_ID: number;
  CUST_NM: string;
  C_HP?: string;
  C_EMAIL?: string;
  CUST_GBN?: string;
  GENDER_GBN?: string;
  CUST_BIRTH_D?: string;
  MAIL_POINT?: number; // 마일리지 잔액
}

// 판매 전표 헤더 (TB_ZA_SALEDETAIL 기반)
interface SalesHeader {
  SALE_D: string; // 판매일자
  AGENT_ID: string; // 매장코드
  CUST_ID: string; // 고객코드
  SALE_SEQU?: number; // 순번
  TR_NO?: string; // 영수증번호
  STAFF_ID?: number; // 판매사원코드
}

// 판매 상품 항목
interface SalesItem {
  SALE_SEQU: number; // 순번
  GOODS_ID: number; // 상품코드
  GOODS_NM: string; // 상품명
  BRAND_NM?: string; // 브랜드명
  BAR_CODE?: string; // 바코드
  LOT_NO?: string; // LOT번호
  EXP_D?: string; // 유통기한
  SALE_QTY: number; // 판매수량
  SALE_DANGA: number; // 판매단가(소비자가)
  TOT_AMT: number; // 판매금액total(수량*단가)
  DISCOUNT_RATE: number; // 할인율
  DISCOUNT_AMT: number; // 할인금액
  SALE_AMT: number; // 실판매금액
  NET_TOT: number; // 마진율적용총금액
  NET_AMT: number; // 마진율적용공급가
  NET_VAT: number; // 마진율적용부가세
  MAIL_POINT: number; // 마일리지 포인트
  COUPON_YN?: string; // 쿠폰사용yn
  COUPON_ID?: string; // 쿠폰아이디
  P_MAIL_AMT?: number; // 마일리지적용단위 기본금액
  P_MAIL_POINT?: number; // 포인트
  MEMO?: string; // 판매메모
}

// 구매 이력 항목
interface PurchaseHistory {
  SALE_D: string; // 판매일자
  SALE_SEQU: number; // 순번
  GOODS_NM: string; // 상품명
  BRAND_NM: string; // 브랜드명
  SALE_QTY: number; // 수량
  SALE_AMT: number; // 판매금액
  MAIL_POINT: number; // 마일리지
  TR_NO?: string; // 영수증번호
}

// 상담 이력 항목
interface ConsultationHistory {
  CONSULT_D: string; // 상담일자
  CONSULT_TYPE: string; // 상담유형
  CONSULT_CONTENT: string; // 상담내용
  CONSULT_RESULT: string; // 상담결과
  STAFF_NM: string; // 상담사원
}

// 마일리지 이력 항목
interface MileageHistory {
  POINT_D: string; // 포인트일자
  POINT_TYPE: string; // 유형 (적립/사용)
  POINT_AMT: number; // 포인트
  SALE_AMT?: number; // 판매금액
  BALANCE: number; // 잔액
  MEMO?: string; // 메모
}

// 당일 판매 현황 (사원별)
interface DailySalesStatus {
  STAFF_ID: number; // 사원코드
  STAFF_NM: string; // 사원명
  SALE_COUNT: number; // 판매건수
  SALE_QTY: number; // 판매수량
  SALE_AMT: number; // 판매금액
  DISCOUNT_AMT: number; // 할인금액
  NET_AMT: number; // 순매출
  MAIL_POINT: number; // 마일리지 지급
}

// 상품 검색 조건
interface ProductSearchCondition {
  searchText: string; // 상품명/바코드
  brandId?: string; // 브랜드
  categoryId?: string; // 카테고리
}

// 고객 검색 조건
interface CustomerSearchCondition {
  searchText: string; // 고객명/전화번호
  custGbn?: string; // 고객구분
}

// 전표 합계
interface SaleSummary {
  totalQty: number; // 총 수량
  totalAmt: number; // 총 금액
  discountAmt: number; // 할인 금액
  saleAmt: number; // 실판매금액
  mileagePoint: number; // 마일리지
  usedMileage: number; // 사용 마일리지
  paymentAmt: number; // 실결제금액
}

// 결제 정보
interface PaymentInfo {
  paymentMethod: string; // 결제수단 (CASH, CARD, POINT 등)
  paymentAmt: number; // 결제금액
  cardCompany?: string; // 카드사
  cardNo?: string; // 카드번호
  approvalNo?: string; // 승인번호
}

// 탭 타입 정의
type TabType = 'unified' | 'customer' | 'purchase' | 'consultation' | 'product' | 'sales' | 'mileage' | 'daily';

// 상태 타입 정의
interface SalesRegistrationState {
  // 현재 활성 탭
  activeTab: TabType;
  
  // 고객 정보
  selectedCustomer: CustomerInfo | null;
  customerSearchCondition: CustomerSearchCondition;
  customerSearchResults: CustomerInfo[];
  
  // 상품 정보
  productSearchCondition: ProductSearchCondition;
  productSearchResults: any[]; // 상품 검색 결과
  
  // 판매 전표
  salesHeader: SalesHeader;
  salesItems: SalesItem[];
  saleSummary: SaleSummary;
  paymentInfo: PaymentInfo | null;
  
  // 구매 이력
  purchaseHistory: PurchaseHistory[];
  
  // 상담 이력
  consultationHistory: ConsultationHistory[];
  
  // 마일리지 이력
  mileageHistory: MileageHistory[];
  
  // 당일 판매 현황
  dailySalesStatus: DailySalesStatus[];
  
  // UI 상태
  isLoading: boolean;
  isNewSale: boolean;
  selectedSalesItem: SalesItem | null;
}

// 초기 상태
const initialState: SalesRegistrationState = {
  activeTab: 'unified',
  
  selectedCustomer: null,
  customerSearchCondition: {
    searchText: '',
    custGbn: ''
  },
  customerSearchResults: [],
  
  productSearchCondition: {
    searchText: '',
    brandId: '',
    categoryId: ''
  },
  productSearchResults: [],
  
  salesHeader: {
    SALE_D: new Date().toISOString().split('T')[0].replace(/-/g, ''),
    AGENT_ID: '',
    CUST_ID: '',
    STAFF_ID: 0
  },
  salesItems: [],
  saleSummary: {
    totalQty: 0,
    totalAmt: 0,
    discountAmt: 0,
    saleAmt: 0,
    mileagePoint: 0,
    usedMileage: 0,
    paymentAmt: 0
  },
  paymentInfo: null,
  
  purchaseHistory: [],
  consultationHistory: [],
  mileageHistory: [],
  dailySalesStatus: [],
  
  isLoading: false,
  isNewSale: true,
  selectedSalesItem: null
};

// Slice 정의
const salesRegistrationSlice = createSlice({
  name: 'salesRegistration',
  initialState,
  reducers: {
    // 활성 탭 변경
    setActiveTab: (state, action: PayloadAction<TabType>) => {
      state.activeTab = action.payload;
    },
    
    // 고객 선택
    setSelectedCustomer: (state, action: PayloadAction<CustomerInfo | null>) => {
      state.selectedCustomer = action.payload;
      if (action.payload) {
        state.salesHeader.CUST_ID = action.payload.CUST_ID.toString();
      }
    },
    
    // 고객 검색 조건 설정
    setCustomerSearchCondition: (state, action: PayloadAction<Partial<CustomerSearchCondition>>) => {
      state.customerSearchCondition = {
        ...state.customerSearchCondition,
        ...action.payload
      };
    },
    
    // 고객 검색 결과 설정
    setCustomerSearchResults: (state, action: PayloadAction<CustomerInfo[]>) => {
      state.customerSearchResults = action.payload;
    },
    
    // 상품 검색 조건 설정
    setProductSearchCondition: (state, action: PayloadAction<Partial<ProductSearchCondition>>) => {
      state.productSearchCondition = {
        ...state.productSearchCondition,
        ...action.payload
      };
    },
    
    // 상품 검색 결과 설정
    setProductSearchResults: (state, action: PayloadAction<any[]>) => {
      state.productSearchResults = action.payload;
    },
    
    // 판매 헤더 설정
    setSalesHeader: (state, action: PayloadAction<Partial<SalesHeader>>) => {
      state.salesHeader = {
        ...state.salesHeader,
        ...action.payload
      };
    },
    
    // 판매 항목 추가
    addSalesItem: (state, action: PayloadAction<SalesItem>) => {
      const existingIndex = state.salesItems.findIndex(
        item => item.GOODS_ID === action.payload.GOODS_ID
      );
      
      if (existingIndex >= 0) {
        // 기존 항목 수량 증가
        state.salesItems[existingIndex].SALE_QTY += action.payload.SALE_QTY;
        // 금액 재계산
        const item = state.salesItems[existingIndex];
        item.TOT_AMT = item.SALE_QTY * item.SALE_DANGA;
        item.DISCOUNT_AMT = Math.floor(item.TOT_AMT * item.DISCOUNT_RATE / 100);
        item.SALE_AMT = item.TOT_AMT - item.DISCOUNT_AMT;
        item.NET_AMT = Math.floor(item.SALE_AMT / 1.1);
        item.NET_VAT = item.SALE_AMT - item.NET_AMT;
        item.NET_TOT = item.SALE_AMT;
      } else {
        // 새 항목 추가
        const newSequ = state.salesItems.length + 1;
        state.salesItems.push({
          ...action.payload,
          SALE_SEQU: newSequ
        });
      }
    },
    
    // 판매 항목 수정
    updateSalesItem: (state, action: PayloadAction<{ sequ: number; data: Partial<SalesItem> }>) => {
      const index = state.salesItems.findIndex(item => item.SALE_SEQU === action.payload.sequ);
      if (index >= 0) {
        state.salesItems[index] = {
          ...state.salesItems[index],
          ...action.payload.data
        };
        
        // 금액 재계산
        const item = state.salesItems[index];
        item.TOT_AMT = item.SALE_QTY * item.SALE_DANGA;
        item.DISCOUNT_AMT = Math.floor(item.TOT_AMT * item.DISCOUNT_RATE / 100);
        item.SALE_AMT = item.TOT_AMT - item.DISCOUNT_AMT;
        item.NET_AMT = Math.floor(item.SALE_AMT / 1.1);
        item.NET_VAT = item.SALE_AMT - item.NET_AMT;
        item.NET_TOT = item.SALE_AMT;
      }
    },
    
    // 판매 항목 삭제
    removeSalesItem: (state, action: PayloadAction<number>) => {
      state.salesItems = state.salesItems.filter(item => item.SALE_SEQU !== action.payload);
      // 순번 재정렬
      state.salesItems.forEach((item, index) => {
        item.SALE_SEQU = index + 1;
      });
    },
    
    // 전표 합계 계산
    calculateSaleSummary: (state) => {
      const summary = state.salesItems.reduce((acc, item) => ({
        totalQty: acc.totalQty + item.SALE_QTY,
        totalAmt: acc.totalAmt + item.TOT_AMT,
        discountAmt: acc.discountAmt + item.DISCOUNT_AMT,
        saleAmt: acc.saleAmt + item.SALE_AMT,
        mileagePoint: acc.mileagePoint + item.MAIL_POINT,
        usedMileage: acc.usedMileage,
        paymentAmt: acc.paymentAmt
      }), {
        totalQty: 0,
        totalAmt: 0,
        discountAmt: 0,
        saleAmt: 0,
        mileagePoint: 0,
        usedMileage: state.saleSummary.usedMileage,
        paymentAmt: 0
      });
      
      summary.paymentAmt = summary.saleAmt - summary.usedMileage;
      state.saleSummary = summary;
    },
    
    // 결제 정보 설정
    setPaymentInfo: (state, action: PayloadAction<PaymentInfo | null>) => {
      state.paymentInfo = action.payload;
    },
    
    // 사용 마일리지 설정
    setUsedMileage: (state, action: PayloadAction<number>) => {
      state.saleSummary.usedMileage = action.payload;
      state.saleSummary.paymentAmt = state.saleSummary.saleAmt - action.payload;
    },
    
    // 구매 이력 설정
    setPurchaseHistory: (state, action: PayloadAction<PurchaseHistory[]>) => {
      state.purchaseHistory = action.payload;
    },
    
    // 상담 이력 설정
    setConsultationHistory: (state, action: PayloadAction<ConsultationHistory[]>) => {
      state.consultationHistory = action.payload;
    },
    
    // 마일리지 이력 설정
    setMileageHistory: (state, action: PayloadAction<MileageHistory[]>) => {
      state.mileageHistory = action.payload;
    },
    
    // 당일 판매 현황 설정
    setDailySalesStatus: (state, action: PayloadAction<DailySalesStatus[]>) => {
      state.dailySalesStatus = action.payload;
    },
    
    // 선택된 판매 항목 설정
    setSelectedSalesItem: (state, action: PayloadAction<SalesItem | null>) => {
      state.selectedSalesItem = action.payload;
    },
    
    // 로딩 상태 설정
    setIsLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },
    
    // 신규 판매 초기화
    initializeNewSale: (state) => {
      state.isNewSale = true;
      state.selectedCustomer = null;
      state.salesHeader = {
        SALE_D: new Date().toISOString().split('T')[0].replace(/-/g, ''),
        AGENT_ID: state.salesHeader.AGENT_ID,
        CUST_ID: '',
        STAFF_ID: state.salesHeader.STAFF_ID
      };
      state.salesItems = [];
      state.saleSummary = {
        totalQty: 0,
        totalAmt: 0,
        discountAmt: 0,
        saleAmt: 0,
        mileagePoint: 0,
        usedMileage: 0,
        paymentAmt: 0
      };
      state.paymentInfo = null;
      state.selectedSalesItem = null;
    },
    
    // 전체 초기화
    resetState: (state) => {
      return {
        ...initialState,
        salesHeader: {
          ...initialState.salesHeader,
          AGENT_ID: state.salesHeader.AGENT_ID,
          STAFF_ID: state.salesHeader.STAFF_ID
        }
      };
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(resetAllStates, () => initialState)
      .addCase(clearAllData, () => initialState);
  }
});

// Export actions
export const {
  setActiveTab,
  setSelectedCustomer,
  setCustomerSearchCondition,
  setCustomerSearchResults,
  setProductSearchCondition,
  setProductSearchResults,
  setSalesHeader,
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
  setSelectedSalesItem,
  setIsLoading,
  initializeNewSale,
  resetState
} = salesRegistrationSlice.actions;

// Export types
export type {
  CustomerInfo,
  SalesHeader,
  SalesItem,
  PurchaseHistory,
  ConsultationHistory,
  MileageHistory,
  DailySalesStatus,
  ProductSearchCondition,
  CustomerSearchCondition,
  SaleSummary,
  PaymentInfo,
  TabType,
  SalesRegistrationState
};

// Export reducer
export default salesRegistrationSlice.reducer;
