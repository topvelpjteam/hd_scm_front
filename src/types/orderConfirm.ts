// 출고 유통기한 정보
export interface ExpiryDetail {
  EXP_SEQU?: number;
  EXP_D: string; // 유통기한 (YYYY-MM-DD)
  EXP_QTY: number; // 유통기한별 출고수량
  LOT_NO?: string; // LOT 번호
}

export interface OrderData {
  ORDER_D: string;
  ORDER_SEQU: number;
  ORDER_NO: number;
  AGENT_ID: string;
  AGENT_NM?: string;
  VENDOR_ID: string;
  BRAND_ID: string;
  BRAND_NM?: string;
  GOODS_ID: string;
  GOODS_NM?: string;
  ORDER_QTY: number;
  REQUIRE_D: string;
  SOBIJA_DAN: number;
  SOBIJA_AMT: number;
  SOBIJA_VAT: number;
  SOBIJA_TOT: number;
  SALE_RATE: number;
  ORDER_DAN: number;
  ORDER_AMT: number;
  ORDER_VAT: number;
  ORDER_TOT: number;
  ORDER_MEMO?: string;
  OUT_D?: string;
  EST_D?: string;
  RECV_ADDR?: string;
  RECV_TEL?: string;
  RECV_PERSON?: string;
  RECV_MEMO?: string;
  SHIP_METHOD?: string;
  SHIP_TRANS_NO?: string;
  SHIP_MEMO?: string;
  SHIP_LOGIS_GBN?: string;
  SHIP_LOGIS_GBN_NM?: string;
  IN_TOT_QTY?: number;
  OUT_QTY?: number;
  IN_D?: string;
  ORDER_SEND_YN?: string;
  USER_ID?: string;
  SYS_TIME?: string;
  OUTBOUND_NO?: string; // 출고번호: OUT_D-ORDER_D-ORDER_SEQU (yyyymmdd-yyyymmdd-12345)
  // 유통기한 관리
  expiryDetails?: ExpiryDetail[]; // 출고 유통기한 목록
  deletedExpirySequ?: number[]; // 삭제된 기존 EXP_SEQU 목록 (백엔드 DELETE_EXPIRY 호출용)
  [key: string]: unknown;
}

export interface SearchCondition {
  orderDateFrom: string;
  orderDateTo: string;
  brandIds: string[];
  goodsNm: string;
  agentNm: string;
  outStatus: string;
}

export const getDefaultOrderConfirmDateRange = () => ({
  from: '2025-07-01',
  to: '2025-12-31'
});

export const createDefaultSearchCondition = (): SearchCondition => {
  const defaultRange = getDefaultOrderConfirmDateRange();
  return {
    orderDateFrom: defaultRange.from,
    orderDateTo: defaultRange.to,
    brandIds: [],
    goodsNm: '',
    agentNm: '',
    outStatus: 'ALL'
  };
};

export type ShipmentField =
  | 'SHIP_METHOD'
  | 'SHIP_TRANS_NO'
  | 'SHIP_MEMO'
  | 'SHIP_LOGIS_GBN'
  | 'SHIP_LOGIS_GBN_NM';

