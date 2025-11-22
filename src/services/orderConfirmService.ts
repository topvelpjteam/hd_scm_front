import { apiClient } from './apiClient';
import type { ExpiryDetail } from '../types/orderConfirm';

export interface OrderConfirmSearchParams {
  orderDateFrom?: string;
  orderDateTo?: string;
  brandIds?: string[];
  goodsNm?: string;
  agentNm?: string;
  outStatus?: string;
  vendorId?: string;
}

export interface OrderSummary {
  ORDER_D: string;
  ORDER_SEQU: number;
  AGENT_ID: string;
  AGENT_NM: string;
  VENDOR_ID?: string;
  VENDOR_NAME?: string;
  FIRST_GOODS_NAME: string;
  ADDITIONAL_ITEM_COUNT: number;
  TOTAL_QTY: number;
  TOTAL_ORDER_AMT: number;
  TOTAL_CONSUMER_AMT: number;
  REQUIRE_D: string;
  OUT_D?: string;
  EST_D?: string;
  SHIP_METHOD?: string;
  SHIP_TRANS_NO?: string;
  SHIP_MEMO?: string;
  SHIP_LOGIS_GBN?: string;
  SHIP_LOGIS_GBN_NM?: string;
  OUT_STATUS: string;
  BRAND_ID?: string;
  BRAND_NM?: string;
}

export interface OrderConfirmLine {
  ORDER_D: string;
  ORDER_SEQU: number;
  ORDER_NO: number;
  GOODS_ID?: string;
  GOODS_NM?: string;
  BRAND_ID?: string;
  BRAND_NAME?: string;
  BRAND_NM?: string;
  ORDER_QTY?: number;
  ORDER_DAN?: number;
  ORDER_AMT?: number;
  ORDER_VAT?: number;
  ORDER_TOT?: number;
  OUT_QTY?: number;
  OUT_D?: string;
  EST_D?: string;
  SHIP_METHOD?: string;
  SHIP_LOGIS_GBN?: string;
  SHIP_LOGIS_GBN_NM?: string;
  SHIP_TRANS_NO?: string;
  SHIP_MEMO?: string;
  REQUIRE_D?: string;
  AGENT_NM?: string;
  RECV_ADDR?: string;
  RECV_TEL?: string;
  RECV_PERSON?: string;
  RECV_MEMO?: string;
  // 유통기한 목록 (중복 라인 그룹핑 후)
  expiryDetails?: ExpiryDetail[];
  // 삭제된 기존 EXP_SEQU 목록 (프론트 diff 계산용)
  deletedExpirySequ?: number[];
}

export interface ConfirmOutboundRequest {
  orderD: string;
  orderSequ: number;
  vendorId?: string;
  outDate: string;
  estDate: string;
  shipMethod: string;
  shipLogisGbn: string;
  shipTransNo?: string;
  shipMemo?: string;
  userId: string;
  lines: Array<{ 
    orderNo: number; 
    outQty?: number; 
    expiryDetails?: ExpiryDetail[]; 
    deletedExpirySequ?: number[]; 
  }>;
}

export interface ConfirmOutboundResponse {
  success: boolean;
  message?: string;
  results?: Array<Record<string, unknown>>;
}

export interface CancelOutboundRequest {
  orderD: string;
  orderSequ: number;
  vendorId?: string;
  userId: string;
  lines: Array<{ orderNo: number }>;
}

export interface CancelOutboundResponse {
  success: boolean;
  message?: string;
  results?: Array<Record<string, unknown>>;
}

const ensureDateWithDash = (value?: string | null): string | undefined => {
  if (!value) return undefined;
  const trimmed = value.toString().trim();
  if (/^\d{8}$/.test(trimmed)) {
    return `${trimmed.slice(0, 4)}-${trimmed.slice(4, 6)}-${trimmed.slice(6, 8)}`;
  }
  return trimmed;
};

const toOrderSummary = (row: any): OrderSummary => ({
  ORDER_D: row.ORDER_D ?? '',
  ORDER_SEQU: Number(row.ORDER_SEQU ?? 0),
  AGENT_ID: row.AGENT_ID ?? '',
  AGENT_NM: row.AGENT_NM ?? row.AGENT_NAME ?? '',
  VENDOR_ID: row.VENDOR_ID ?? row.VENDORID ?? '',
  VENDOR_NAME: row.VENDOR_NAME ?? row.VENDOR_NM ?? row.VENDOR ?? row.AGENT_NM_VENDOR ?? '',
  FIRST_GOODS_NAME: row.FIRST_GOODS_NAME ?? row.GOODS_NM ?? '',
  ADDITIONAL_ITEM_COUNT: Number(row.ADDITIONAL_ITEM_COUNT ?? row.ADDITIONAL_COUNT ?? 0),
  TOTAL_QTY: Number(row.TOTAL_QTY ?? row.ORDER_QTY ?? 0),
  TOTAL_ORDER_AMT: Number(row.TOTAL_ORDER_AMT ?? row.ORDER_TOT ?? 0),
  TOTAL_CONSUMER_AMT: Number(row.TOTAL_CONSUMER_AMT ?? row.SOBIJA_TOT ?? 0),
  REQUIRE_D: row.REQUIRE_D ?? '',
  OUT_D: row.OUT_D ?? '',
  EST_D: row.EST_D ?? '',
  SHIP_METHOD: row.SHIP_METHOD ?? '',
  SHIP_TRANS_NO: row.SHIP_TRANS_NO ?? '',
  SHIP_MEMO: row.SHIP_MEMO ?? '',
  SHIP_LOGIS_GBN: row.SHIP_LOGIS_GBN ?? '',
  SHIP_LOGIS_GBN_NM: row.SHIP_LOGIS_GBN_NM ?? '',
  OUT_STATUS: row.OUT_STATUS ?? '',
  BRAND_ID: row.BRAND_ID ?? '',
  BRAND_NM: row.BRAND_NM ?? row.BRAND_NAME ?? ''
});

const toOrderLine = (row: any): OrderConfirmLine => ({
  ORDER_D: row.ORDER_D ?? '',
  ORDER_SEQU: Number(row.ORDER_SEQU ?? 0),
  ORDER_NO: Number(row.ORDER_NO ?? 0),
  GOODS_ID: row.GOODS_ID ?? '',
  GOODS_NM: row.GOODS_NM ?? '',
  BRAND_ID: row.BRAND_ID ?? '',
  BRAND_NAME: row.BRAND_NAME ?? row.BRAND_NM ?? '',
  BRAND_NM: row.BRAND_NM ?? row.BRAND_NAME ?? '',
  ORDER_QTY: row.ORDER_QTY != null ? Number(row.ORDER_QTY) : undefined,
  ORDER_DAN: row.ORDER_DAN != null ? Number(row.ORDER_DAN) : undefined,
  ORDER_AMT: row.ORDER_AMT != null ? Number(row.ORDER_AMT) : undefined,
  ORDER_VAT: row.ORDER_VAT != null ? Number(row.ORDER_VAT) : undefined,
  ORDER_TOT: row.ORDER_TOT != null ? Number(row.ORDER_TOT) : undefined,
  OUT_QTY: row.OUT_QTY != null ? Number(row.OUT_QTY) : row.OUTQTY != null ? Number(row.OUTQTY) : undefined,
  OUT_D: row.OUT_D ?? '',
  EST_D: row.EST_D ?? '',
  SHIP_METHOD: row.SHIP_METHOD ?? '',
  SHIP_LOGIS_GBN: row.SHIP_LOGIS_GBN ?? '',
  SHIP_LOGIS_GBN_NM: row.SHIP_LOGIS_GBN_NM ?? '',
  SHIP_TRANS_NO: row.SHIP_TRANS_NO ?? '',
  SHIP_MEMO: row.SHIP_MEMO ?? '',
  REQUIRE_D: row.REQUIRE_D ?? '',
  AGENT_NM: row.AGENT_NM ?? '',
  RECV_ADDR: row.RECV_ADDR ?? '',
  RECV_TEL: row.RECV_TEL ?? '',
  RECV_PERSON: row.RECV_PERSON ?? '',
  RECV_MEMO: row.RECV_MEMO ?? ''
});

export const searchOrderConfirm = async (params: OrderConfirmSearchParams): Promise<OrderSummary[]> => {
  const payload: Record<string, any> = {
    orderDateFrom: ensureDateWithDash(params.orderDateFrom),
    orderDateTo: ensureDateWithDash(params.orderDateTo),
    outStatus: params.outStatus ?? 'ALL'
  };

  if (params.vendorId) {
    payload.vendorId = params.vendorId;
  }

  if (params.goodsNm) {
    payload.goodsName = params.goodsNm;
  }

  if (params.agentNm) {
    payload.agentName = params.agentNm;
  }

  if (params.brandIds && params.brandIds.length > 0) {
    payload.brandId = params.brandIds[0];
  }

  const response = await apiClient.postJson<{ success: boolean; orders: any[] }>(
    '/api/order-confirm/search',
    payload
  );

  return (response.orders || []).map(toOrderSummary);
};

// 상세 조회 결과(유통기한 포함 중복 라인)를 그룹핑하여 라인별 expiryDetails 배열 구성
export const getOrderConfirmDetails = async (
  orderD: string,
  orderSequ: number,
  vendorId?: string
): Promise<OrderConfirmLine[]> => {
  const normalizedOrderD = ensureDateWithDash(orderD) ?? '';
  const query = vendorId ? `?vendorId=${encodeURIComponent(vendorId)}` : '';
  const response = await apiClient.getJson<{ success: boolean; lines: any[] }>(
    `/api/order-confirm/${encodeURIComponent(normalizedOrderD)}/${orderSequ}/details${query}`
  );

  const raw = response.lines || [];
  const grouped = new Map<string, OrderConfirmLine>();

  for (const row of raw) {
    const key = String(row.ORDER_NO ?? row.orderNo ?? '0');
    let base = grouped.get(key);
    if (!base) {
      base = { ...toOrderLine(row), expiryDetails: [], deletedExpirySequ: [] };
      grouped.set(key, base);
    }
    // 유통기한 컬럼 존재 시 추가
    const expDate = row.EXP_D ?? row.EXPDATE ?? row.EXP_DT;
    const expQtyRaw = row.EXP_QTY ?? row.EXPQTY ?? row.EXP_OUT_QTY;
    if (expDate || expQtyRaw != null) {
      const expQty = expQtyRaw != null ? Number(expQtyRaw) : 0;
      const expSequ = row.EXP_SEQU != null ? Number(row.EXP_SEQU) : undefined;
      const lotNo = row.LOT_NO ?? row.LOTNO ?? undefined;
      if (expDate) {
        (base.expiryDetails ||= []).push({
          EXP_SEQU: expSequ,
            EXP_D: ensureDateWithDash(expDate) || '',
            EXP_QTY: expQty,
            LOT_NO: lotNo
        });
      }
    }
  }

  return Array.from(grouped.values()).sort((a, b) => (a.ORDER_NO ?? 0) - (b.ORDER_NO ?? 0));
};

export const confirmOrderShipment = async (
  request: ConfirmOutboundRequest
): Promise<ConfirmOutboundResponse> => {
  const payload = {
    orderD: ensureDateWithDash(request.orderD),
    orderSequ: request.orderSequ,
    vendorId: request.vendorId,
    outDate: ensureDateWithDash(request.outDate),
    estDate: ensureDateWithDash(request.estDate),
    shipMethod: request.shipMethod,
    shipLogisGbn: request.shipLogisGbn,
    shipTransNo: request.shipTransNo,
    shipMemo: request.shipMemo,
    userId: request.userId,
    lines: request.lines.map((line) => ({
      orderNo: line.orderNo,
      outQty: line.outQty ?? null,
      expiryDetails: (line.expiryDetails || []).map(ed => ({
        EXP_SEQU: ed.EXP_SEQU,
        EXP_D: ensureDateWithDash(ed.EXP_D),
        EXP_QTY: ed.EXP_QTY,
        LOT_NO: ed.LOT_NO || undefined
      })),
      deletedExpirySequ: line.deletedExpirySequ || []
    }))
  };

  return apiClient.postJson<ConfirmOutboundResponse>('/api/order-confirm/confirm', payload);
};

export const cancelOrderShipment = async (
  request: CancelOutboundRequest
): Promise<CancelOutboundResponse> => {
  const payload = {
    orderD: ensureDateWithDash(request.orderD),
    orderSequ: request.orderSequ,
    vendorId: request.vendorId,
    userId: request.userId,
    lines: request.lines.map(line => ({ orderNo: line.orderNo }))
  };

  return apiClient.postJson<CancelOutboundResponse>('/api/order-confirm/cancel', payload);
};

