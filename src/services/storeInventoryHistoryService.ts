import apiClient from './apiClient';

export interface StoreInventoryHistoryItem {
  AGENT_ID: number;
  AGENT_NM: string;
  GOODS_ID: number;
  GOODS_ID_BRAND: string;
  GOODS_NM: string;
  GOODS_GBN: string;
  GOODS_GBN_NM: string;
  BRAND_ID: number;
  BRAND_NM: string;
  TRX_DATE: string;
  IN_QTY: number;
  OUT_QTY: number;
  NET_QTY: number;
  TOTAL_COUNT?: number;
  TOTAL_PAGES?: number;
}

export interface StoreInventoryHistorySearchParams {
  dateFrom?: string;
  dateTo?: string;
  agentIds?: string[];
  brandIds?: string[];
  vendorIds?: string[];
  goodsName?: string;
  pageNum?: number;
  pageSize?: number;
}

export interface StoreInventoryHistoryResponse {
  items: StoreInventoryHistoryItem[];
  totalCount: number;
  totalPages: number;
  pageNum: number;
  pageSize: number;
}

export async function searchStoreInventoryHistory(
  params: StoreInventoryHistorySearchParams,
): Promise<StoreInventoryHistoryResponse> {
  const response = await apiClient.post(
    '/api/inventory/store-history/search',
    {
      dateFrom: params.dateFrom,
      dateTo: params.dateTo,
      agentIds: params.agentIds,
      brandIds: params.brandIds,
      vendorIds: params.vendorIds,
      goodsName: params.goodsName,
      pageNum: params.pageNum || 1,
      pageSize: params.pageSize || 50,
    },
  );

  const items = (await response.json()) as StoreInventoryHistoryItem[];
  const firstItem = items[0];

  return {
    items,
    totalCount: firstItem?.TOTAL_COUNT || 0,
    totalPages: firstItem?.TOTAL_PAGES || 0,
    pageNum: params.pageNum || 1,
    pageSize: params.pageSize || 50,
  };
}
