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
  CUST_GBN_NM?: string;
  MAIL_POINT?: number; // 마일리지 잔액
  AGENT_ID?: number | string; // 소속 매장 코드
  AGENT_NM?: string; // 소속 매장 명
  OPEN_D?: string; // 등록일
  C_BIRTH?: string; // 생년월일
  C_ADDR1?: string; // 주소
  C_ADDR2?: string; // 상세주소
  C_REMARK?: string; // 비고
  NATION_ID?: string; // 국가코드
  ZIP_ID?: string; // 우편번호
  CUST_D_GBN?: string; // 고객구분상세
  CUST_HOBB?: string; // 취미
  EMAIL_CHK?: string; // 이메일수신동의
  DM_CHK?: string; // DM수신동의
  SMS_CHK?: string; // SMS수신동의
  CALL_CHK?: string; // 전화수신동의
  MNG_STAFF?: string; // 담당직원
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
  SALE_SEQU: number; // 순번 (DB에서 가져온 값, 신규 항목은 undefined)
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
  P_MAIL_AMT?: number | null; // 특별마일리지 지급 기준금액 (TB_ZA_SPECMAIL)
  P_MAIL_POINT?: number | null; // 특별마일리지 지급 포인트 (TB_ZA_SPECMAIL)
  MEMO?: string; // 판매메모
  _isModified?: boolean; // 변경 추적 플래그 (영수증 조회 후 수정 여부)
  _isNew?: boolean; // 신규 항목 플래그 (영수증 조회가 아닌 새로 추가된 항목)
  _tempIndex?: number; // 화면 표시용 임시 인덱스 (신규 항목용)
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
  STAFF_ID?: number; // 판매사원코드
  STAFF_NM?: string; // 판매사원명
}

// 상담 이력 항목
interface ConsultationHistory {
  CONSULT_ID: number; // 상담 고유번호
  CONSULT_D: string; // 상담일자
  CONSULT_TIME: string; // 상담시간
  AGENT_ID: number; // 매장코드
  AGENT_NM: string; // 매장명
  CUST_ID: number; // 고객코드
  STAFF_ID: number; // 상담사원코드
  STAFF_NM: string; // 상담사원명
  CONSULT_TYPE: string; // 상담유형코드
  CONSULT_TYPE_NM: string; // 상담유형명
  CONSULT_TITLE: string; // 상담제목
  CONSULT_CONTENT: string; // 상담내용
  PROC_STATUS: string; // 처리상태코드
  PROC_STATUS_NM: string; // 처리상태명
  PROC_D: string; // 처리일자
  PROC_STAFF_ID: number; // 처리사원코드
  PROC_STAFF_NM: string; // 처리사원명
  PROC_CONTENT: string; // 처리내용
  REL_TR_NO: string; // 관련영수증번호
  REL_GOODS_ID: number; // 관련상품코드
  REL_GOODS_NM: string; // 관련상품명
  REG_TIME: string; // 등록일시
  MOD_TIME: string; // 수정일시
}

// 마일리지 이력 항목 (MAIL_WONJANG SP 결과)
interface MileageHistory {
  SALE_D: string; // 일자
  AGENT_ID: string; // 매장코드
  AGENT_NM: string; // 매장명
  GOODS_ID: string; // 상품코드 (또는 '마일리지상품지급', '수기지급')
  GOODS_NM: string; // 상품명 (또는 '이월')
  BASE_MAIL: number; // 이월 마일리지
  SALE_QTY: number; // 수량
  SALE_AMT: number; // 마일리지 증감 (+적립, -사용)
  CUST_ID: number; // 고객코드
  // 기존 호환 필드
  POINT_D?: string;
  POINT_TYPE?: string;
  POINT_AMT?: number;
  BALANCE?: number;
  MEMO?: string;
}

// 당일 판매 현황 (사원별) - SP STAFF_SALE 결과
interface DailySalesStatus {
  STAFF_ID: string; // 사원코드
  STAFF_NM: string; // 사원명
  TOT_CUST_CNT: number; // 전체고객수
  SALE_CUST_CNT: number; // 구매고객수
  SALE_QTY: number; // 구매수량
  SALE_AMT: number; // 구매금액
  AUS: number; // 구매금액/구매고객수
  IPT: number; // 구매수량/구매고객수
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

// Helper: Calculate mileage points
// 1) 기본지급: sale_amt 기준 1000원당 1점
// 2) 특별지급: P_MAIL_AMT와 P_MAIL_POINT가 있는 경우는 P_MAIL_AMT당 P_MAIL_POINT 지급
const calculateMileagePoint = (saleAmt: number, pMailAmt?: number | null, pMailPoint?: number | null): number => {
  if (pMailAmt != null && pMailPoint != null && Number(pMailAmt) > 0) {
    // 특별마일리지 지급: sale_amt / P_MAIL_AMT * P_MAIL_POINT
    return Math.floor(saleAmt / Number(pMailAmt) * Number(pMailPoint));
  }
  // 기본마일리지 지급: 1000원당 1점
  return Math.floor(saleAmt / 1000);
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
        // set customer id in header if provided; otherwise keep existing (hidden) value
        if (action.payload.CUST_ID !== undefined && action.payload.CUST_ID !== null) {
          state.salesHeader.CUST_ID = String(action.payload.CUST_ID);
        }
        // AGENT_ID가 명시적으로 제공된 경우에만 업데이트 (undefined는 무시)
        const agentId = (action.payload as any).AGENT_ID;
        if (agentId !== undefined && agentId !== null) {
          state.salesHeader.AGENT_ID = String(agentId);
        }
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
      // SALE_SEQU가 유효하게 제공된 경우 (영수증 조회 등): 중복 병합 없이 그대로 추가
      // 0은 신규 항목으로 간주 (Redux에서 자동 할당)
      if (action.payload.SALE_SEQU !== undefined && action.payload.SALE_SEQU !== null && action.payload.SALE_SEQU > 0) {
        const newItem = {
          ...action.payload
        };
        // 마일리지는 DB에서 가져온 값 그대로 사용 (0, 음수 포함)
        // MAIL_POINT가 전달되지 않은 경우(undefined/null)에만 계산
        if (newItem.MAIL_POINT === undefined || newItem.MAIL_POINT === null) {
          newItem.MAIL_POINT = calculateMileagePoint(newItem.SALE_AMT, newItem.P_MAIL_AMT, newItem.P_MAIL_POINT);
        }
        state.salesItems.push(newItem);
        return;
      }

      // SALE_SEQU가 없는 경우 (신규 추가): 기존 로직대로 중복 병합
      // Merge key: GOODS_ID + EXP_D (treat empty/null as '')
      const payloadExp = action.payload.EXP_D ?? '';
      const existingIndex = state.salesItems.findIndex(
        item => item.GOODS_ID === action.payload.GOODS_ID && (item.EXP_D ?? '') === payloadExp
      );
      
      if (existingIndex >= 0) {
        // 기존 항목 수량 증가
        state.salesItems[existingIndex].SALE_QTY += action.payload.SALE_QTY;
        state.salesItems[existingIndex]._isModified = true; // 수량 증가도 변경으로 표시
        // 금액 재계산
        const item = state.salesItems[existingIndex];
        item.TOT_AMT = item.SALE_QTY * item.SALE_DANGA;
        item.DISCOUNT_AMT = Math.floor(item.TOT_AMT * item.DISCOUNT_RATE / 100);
        item.SALE_AMT = item.TOT_AMT - item.DISCOUNT_AMT;
        item.NET_AMT = Math.floor(item.SALE_AMT / 1.1);
        item.NET_VAT = item.SALE_AMT - item.NET_AMT;
        item.NET_TOT = item.SALE_AMT;
        // 마일리지 재계산 (기본 + 특별)
        item.MAIL_POINT = calculateMileagePoint(item.SALE_AMT, item.P_MAIL_AMT, item.P_MAIL_POINT);
      } else {
        // 새 항목 추가 - SALE_SEQU는 null로 설정 (DB에서 자동 생성)
        // 화면 표시용 임시 인덱스는 _tempIndex 사용
        const tempIndex = state.salesItems.length + 1;
        const newItem = {
          ...action.payload,
          // SALE_SEQU는 신규 항목이므로 undefined (저장 시 null로 전송되어 DB에서 생성)
          SALE_SEQU: undefined as unknown as number,
          _isNew: true, // 신규 항목 플래그
          _tempIndex: tempIndex // 화면 표시용 임시 인덱스
        };
        // 마일리지 계산:
        // 1) MAIL_POINT가 이미 제공된 경우 (영수증 불러오기 등) -> 그대로 사용 (0, 음수 포함)
        // 2) MAIL_POINT가 undefined/null인 경우에만 계산
        if (newItem.MAIL_POINT === undefined || newItem.MAIL_POINT === null) {
          newItem.MAIL_POINT = calculateMileagePoint(newItem.SALE_AMT, newItem.P_MAIL_AMT, newItem.P_MAIL_POINT);
        }
        state.salesItems.push(newItem);
      }
    },
    
    // 판매 항목 수정 (sequ: SALE_SEQU 또는 _tempIndex)
    updateSalesItem: (state, action: PayloadAction<{ sequ: number; data: Partial<SalesItem> }>) => {
      // SALE_SEQU로 먼저 찾고, 없으면 _tempIndex로 찾기
      let index = state.salesItems.findIndex(item => item.SALE_SEQU === action.payload.sequ);
      if (index < 0) {
        index = state.salesItems.findIndex(item => item._tempIndex === action.payload.sequ);
      }
      if (index >= 0) {
        // merge updates
        state.salesItems[index] = {
          ...state.salesItems[index],
          ...action.payload.data,
          _isModified: true // 변경 플래그 설정
        };

        // 금액 재계산
        const item = state.salesItems[index];
        item.TOT_AMT = item.SALE_QTY * item.SALE_DANGA;

        // If caller provided DISCOUNT_AMT explicitly, prefer it and recompute DISCOUNT_RATE
        if (action.payload.data.DISCOUNT_AMT !== undefined) {
          // ensure discount amount doesn't exceed total
          item.DISCOUNT_AMT = Math.min(Math.max(Math.floor(action.payload.data.DISCOUNT_AMT || 0), 0), item.TOT_AMT);
          item.DISCOUNT_RATE = item.TOT_AMT > 0 ? Math.round(item.DISCOUNT_AMT * 100 / item.TOT_AMT) : 0;
        } else {
          // otherwise compute discount amount from rate
          item.DISCOUNT_AMT = Math.floor(item.TOT_AMT * item.DISCOUNT_RATE / 100);
        }

        item.SALE_AMT = item.TOT_AMT - item.DISCOUNT_AMT;
        item.NET_AMT = Math.floor(item.SALE_AMT / 1.1);
        item.NET_VAT = item.SALE_AMT - item.NET_AMT;
        item.NET_TOT = item.SALE_AMT;
        // 마일리지 재계산 (기본 + 특별)
        item.MAIL_POINT = calculateMileagePoint(item.SALE_AMT, item.P_MAIL_AMT, item.P_MAIL_POINT);
      }
    },
    
    // 판매 항목 삭제 (sequ: SALE_SEQU 또는 _tempIndex)
    removeSalesItem: (state, action: PayloadAction<number>) => {
      state.salesItems = state.salesItems.filter(item => 
        item.SALE_SEQU !== action.payload && item._tempIndex !== action.payload
      );
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
      // Use local date (YYYYMMDD) instead of UTC-based toISOString which may produce previous day in some timezones
      const now = new Date();
      const localYmd = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}`;
      state.salesHeader = {
        SALE_D: localYmd,
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

    // 판매 등록(전표)만 초기화: 고객정보와 구매이력은 유지
    resetSalesRegistration: (state) => {
      const now = new Date();
      const localYmd = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}`;
      state.salesHeader = {
        SALE_D: localYmd,
        AGENT_ID: state.salesHeader.AGENT_ID,
        CUST_ID: state.selectedCustomer ? String((state.selectedCustomer as any).CUST_ID) : state.salesHeader.CUST_ID,
        STAFF_ID: state.salesHeader.STAFF_ID
      } as any;
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
  resetSalesRegistration,
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
