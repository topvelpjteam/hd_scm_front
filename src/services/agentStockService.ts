import { apiClient } from './apiClient';

/**
 * 매장 재고 조회 파라미터
 */
export interface AgentStockSearchParams {
  targetMonth?: string;
  brandIds?: string[];
  goodsGbns?: string[];
  mtypeList?: string[];
  stypeList?: string[];
  goodsIds?: string[];
  channelGbns?: string[];
  storeIds?: string[];
  loginAgentId?: string;
}

/**
 * 매장 재고 컬럼 메타 정보
 */
export interface AgentStockColumn {
  key: string;
  label: string;
  storeColumn: boolean;
  totalColumn: boolean;
}

/**
 * 매장 재고 응답 구조
 */
export interface AgentStockResponse {
  success: boolean;
  message: string;
  columns: AgentStockColumn[];
  rows: Array<Record<string, string | number | null>>;
}

/**
 * 조회 파라미터 정규화
 */
const normalizeParams = (params: AgentStockSearchParams): AgentStockSearchParams => {
  const normalizeMonth = (value?: string) => {
    if (!value) return undefined;
    const digits = value.replace(/[^0-9]/g, '');
    if (digits.length < 6) return undefined;
    return digits.substring(0, 6);
  };

  const normalizeArray = (values?: string[]) => {
    if (!values || values.length === 0) return undefined;
    const filtered = values
      .map((item) => item?.trim())
      .filter((item): item is string => !!item);
    return filtered.length > 0 ? filtered : undefined;
  };

  return {
    targetMonth: normalizeMonth(params.targetMonth),
    brandIds: normalizeArray(params.brandIds),
    goodsGbns: normalizeArray(params.goodsGbns),
    mtypeList: normalizeArray(params.mtypeList),
    stypeList: normalizeArray(params.stypeList),
    goodsIds: normalizeArray(params.goodsIds),
    channelGbns: normalizeArray(params.channelGbns),
    storeIds: normalizeArray(params.storeIds),
    loginAgentId: params.loginAgentId?.trim() || undefined,
  };
};

/**
 * 매장 재고 조회
 */
export const fetchAgentStock = async (
  params: AgentStockSearchParams,
): Promise<AgentStockResponse> => {
  const normalized = normalizeParams(params);
  return apiClient.postJson<AgentStockResponse>(
    'http://localhost:8080/api/inventory/agent-stock/search',
    normalized,
    { loadingMessage: '매장 재고를 불러오는 중...' },
  );
};

