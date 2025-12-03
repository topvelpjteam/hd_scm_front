import { apiClient } from './apiClient';

/**
 * 매장 입고 관리 조회 조건
 */
export interface StoreInventorySearchParams {
  outboundDateFrom?: string;
  outboundDateTo?: string;
  vendorIds: string[];
  brandIds: string[];
  storeIds: string[];
  goodsName?: string;
  inboundStatus: 'ALL' | 'PENDING' | 'COMPLETED';
}

/**
 * 벤더 출고 기준 매장 입고 요약 정보
 */
export interface StoreInventorySummary {
  orderD: string;
  orderSequ: number;
  agentId: number | string;
  agentNm: string;
  vendorId: number | string;
  vendorNm: string;
  brandId: string;
  brandNm: string;
  requireD?: string | null;
  outD?: string | null;
  estD?: string | null;
  totalOrderQty: number;
  totalOutQty: number;
  totalInQty: number;
  pendingQty: number;
  status: 'PENDING' | 'PARTIAL' | 'COMPLETED';
  firstGoodsNm?: string | null;
  additionalItemCount?: number;
}

/**
 * 매장 입고 상세 정보
 */
export interface StoreInventoryDetail {
    orderD?: string;
    orderSequ?: number;
  orderNo: number;
  goodsId: string;
  goodsNm: string;
  brandId: string;
  brandNm: string;
  vendorId?: number;
  orderQty: number | null;
  outQty: number | null;
  inGoodQty: number | null;
  inBadQty: number | null;
  inTotQty: number | null;
  inD?: string | null;
  inMemo?: string | null;
  lotNo?: string | null;
  expD?: string | null;
  orderMemo?: string | null;
  orderTot?: number | null;
  inTot?: number | null;
  sobijaDan?: number | null;
  // 출고 유통기한 정보
  outExpSequ?: number | null;
  outExpD?: string | null;
  outExpQty?: number | null;
  outLotNo?: string | null;
  // 입고 유통기한 정보
  inSequ?: number | null;
  inExpD?: string | null;
  inExpQty?: number | null;
  inExpGoodQty?: number | null;
  inExpBadQty?: number | null;
  inLotNo?: string | null;
  inGrade?: string | null;
}

interface StoreInventoryLoginContext {
  userId?: string;
  roleName?: string;
  agentId?: number;
}

interface StoreInventoryHandleResponse {
  success: boolean;
  message: string;
  masters?: StoreInventorySummary[];
  details?: StoreInventoryDetail[];
  result?: {
    RESULT?: string;
    MESSAGE?: string;
  };
}

const API_BASE_URL = 'http://localhost:8080/api/inventory/store-inbound';

const postHandle = async (
  payload: Record<string, unknown>,
  loadingMessage: string,
): Promise<StoreInventoryHandleResponse> => {
  return apiClient.postJson<StoreInventoryHandleResponse>(
    `${API_BASE_URL}/handle`,
    payload,
    { loadingMessage },
  );
};

const toPayloadDate = (value?: string | null) => {
  if (!value) return undefined;
  const digits = value.replace(/[^0-9]/g, '');
  if (digits.length === 8) {
    return `${digits.slice(0, 4)}-${digits.slice(4, 6)}-${digits.slice(6, 8)}`;
  }
  return undefined;
};

const normalizeIdList = (items: string[]) => items.map((item) => item?.trim()).filter(Boolean);

/**
 * 입고 대기/완료 목록 조회
 */
export const searchStoreInventorySummaries = async (
  params: StoreInventorySearchParams,
  login: StoreInventoryLoginContext,
): Promise<StoreInventorySummary[]> => {
  const response = await postHandle(
    {
      mode: 'GET_MASTER',
      outboundDateFrom: toPayloadDate(params.outboundDateFrom),
      outboundDateTo: toPayloadDate(params.outboundDateTo),
      storeIds: normalizeIdList(params.storeIds),
      vendorIds: normalizeIdList(params.vendorIds),
      brandIds: normalizeIdList(params.brandIds),
      goodsName: params.goodsName?.trim(),
      inboundStatus: params.inboundStatus,
      loginUserId: login.userId,
      loginRoleName: login.roleName,
      loginAgentId: login.agentId ?? null,
    },
    '입고 대기 내역을 불러오는 중입니다...',
  );
  return response.masters ?? [];
};

/**
 * 특정 발주건의 상세 상품 입고 내역 조회
 */
export const fetchStoreInventoryDetails = async (
  orderDate: string,
  orderSequ: number,
  vendorId: number | string,
  login: StoreInventoryLoginContext,
): Promise<StoreInventoryDetail[]> => {
  console.debug('[StoreInventory] GET_DETAIL payload', {
    mode: 'GET_DETAIL',
    targetOrderD: toPayloadDate(orderDate),
    targetOrderSequ: orderSequ,
    targetVendorId: vendorId,
    loginUserId: login.userId,
    loginRoleName: login.roleName,
    loginAgentId: login.agentId ?? null,
  });
  const response = await postHandle(
    {
      mode: 'GET_DETAIL',
      targetOrderD: toPayloadDate(orderDate),
      targetOrderSequ: orderSequ,
      targetVendorId: vendorId,
      loginUserId: login.userId,
      loginRoleName: login.roleName,
      loginAgentId: login.agentId ?? null,
    },
    '입고 상세 내역을 불러오는 중입니다...',
  );
  return response.details ?? [];
};

/**
 * 입고 내역 저장
 */
export const saveStoreInventoryInbound = async (
  payload: {
    orderDate: string;
    orderSequ: number;
    orderNo: number;
    inDate?: string;
    goodQty: number;
    badQty: number;
    inMemo?: string;
  },
  login: StoreInventoryLoginContext,
): Promise<StoreInventoryHandleResponse> => {
  return postHandle(
    {
      mode: 'SAVE_INBOUND',
      targetOrderD: toPayloadDate(payload.orderDate),
      targetOrderSequ: payload.orderSequ,
      targetOrderNo: payload.orderNo,
      inputInDate: toPayloadDate(payload.inDate),
      inputInGoodQty: payload.goodQty,
      inputInBadQty: payload.badQty,
      inputInMemo: payload.inMemo?.trim() || null,
      loginUserId: login.userId,
      loginRoleName: login.roleName,
      loginAgentId: login.agentId ?? null,
    },
    '입고 정보를 저장 중입니다...',
  );
};

/**
 * 입고 취소
 */
export const cancelStoreInventoryInbound = async (
  payload: {
    orderDate: string;
    orderSequ: number;
    orderNo: number;
  },
  login: StoreInventoryLoginContext,
): Promise<StoreInventoryHandleResponse> => {
  return postHandle(
    {
      mode: 'CANCEL_INBOUND',
      targetOrderD: toPayloadDate(payload.orderDate),
      targetOrderSequ: payload.orderSequ,
      targetOrderNo: payload.orderNo,
      loginUserId: login.userId,
      loginRoleName: login.roleName,
      loginAgentId: login.agentId ?? null,
    },
    '입고를 취소하는 중입니다...',
  );
};

/**
 * 그룹 입고 가능 여부 확인 (SAVE_INBOUND_CHK)
 * ORDER_D + ORDER_SEQU + VENDOR_ID 그룹이 입고 가능한지 체크
 */
export const checkSaveInboundPossible = async (
  orderD: string,
  orderSequ: number,
  vendorId: number | string,
  login: StoreInventoryLoginContext,
): Promise<boolean> => {
  try {
    const response = await postHandle(
      {
        mode: 'SAVE_INBOUND_CHK',
        targetOrderD: toPayloadDate(orderD),
        targetOrderSequ: orderSequ,
        targetVendorId: vendorId,
        loginUserId: login.userId,
        loginRoleName: login.roleName,
        loginAgentId: login.agentId ?? null,
      },
      '',
    );
    // 응답의 success 필드 또는 result.RESULT 필드로 확인
    const resultString = response.result?.RESULT || (response.success ? 'SUCCESS' : 'ERROR');
    return resultString === 'SUCCESS';
  } catch (error) {
    console.error('입고 가능 체크 중 오류:', error);
    return false;
  }
};

/**
 * 그룹 취소 가능 여부 확인 (CANCEL_INBOUND_CHK)
 * ORDER_D + ORDER_SEQU + VENDOR_ID 그룹이 취소 가능한지 체크
 */
export const checkCancelInboundPossible = async (
  orderD: string,
  orderSequ: number,
  vendorId: number | string,
  login: StoreInventoryLoginContext,
): Promise<boolean> => {
  try {
    const response = await postHandle(
      {
        mode: 'CANCEL_INBOUND_CHK',
        targetOrderD: toPayloadDate(orderD),
        targetOrderSequ: orderSequ,
        targetVendorId: vendorId,
        loginUserId: login.userId,
        loginRoleName: login.roleName,
        loginAgentId: login.agentId ?? null,
      },
      '',
    );
    // 응답의 success 필드 또는 result.RESULT 필드로 확인
    const resultString = response.result?.RESULT || (response.success ? 'SUCCESS' : 'ERROR');
    return resultString === 'SUCCESS';
  } catch (error) {
    console.error('취소 가능 체크 중 오류:', error);
    return false;
  }
};

/**
 * 그룹 단위 입고 처리 (SAVE_INBOUND)
 * ORDER_D + ORDER_SEQU + VENDOR_ID 그룹의 모든 미입고 항목을 일괄 처리
 */
export const saveStoreInventoryInboundGroup = async (
  payload: {
    orderDate: string;
    orderSequ: number;
    vendorId: number | string;
    inDate: string;
    details: Array<{
      orderNo: number;
      goodsId: string;
      inMemo?: string;
      inGoodQty: number;
      inBadQty: number;
      inTotQty: number;
    }>;
  },
  login: StoreInventoryLoginContext,
): Promise<StoreInventoryHandleResponse> => {
  return postHandle(
    {
      mode: 'SAVE_INBOUND',
      targetOrderD: toPayloadDate(payload.orderDate),
      targetOrderSequ: payload.orderSequ,
      targetVendorId: payload.vendorId,
      inputInDate: toPayloadDate(payload.inDate),
      details: payload.details?.map(d => ({
        orderNo: d.orderNo,
        goodsId: d.goodsId,
        inMemo: d.inMemo?.trim() || null,
        inGoodQty: d.inGoodQty,
        inBadQty: d.inBadQty,
        inTotQty: d.inTotQty,
      })),
      loginUserId: login.userId,
      loginRoleName: login.roleName,
      loginAgentId: login.agentId ?? null,
    },
    '입고 그룹을 처리하는 중입니다...',
  );
};

/**
 * 그룹 단위 입고 취소 (CANCEL_INBOUND)
 * ORDER_D + ORDER_SEQU + VENDOR_ID 그룹의 모든 항목 입고 취소
 */
export const cancelStoreInventoryInboundGroup = async (
  payload: {
    orderDate: string;
    orderSequ: number;
    vendorId: number | string;
  },
  login: StoreInventoryLoginContext,
): Promise<StoreInventoryHandleResponse> => {
  return postHandle(
    {
      mode: 'CANCEL_INBOUND',
      targetOrderD: toPayloadDate(payload.orderDate),
      targetOrderSequ: payload.orderSequ,
      targetVendorId: payload.vendorId,
      loginUserId: login.userId,
      loginRoleName: login.roleName,
      loginAgentId: login.agentId ?? null,
    },
    '입고 그룹을 취소하는 중입니다...',
  );
};



