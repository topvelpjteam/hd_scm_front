// GOODS_LIST 모드: 상품리스트(신규등록용) 전용 API
export const goodsListProductPrices = async (params: Record<string, any> = {}): Promise<ProductPriceData[]> => {
  return apiClient.postJson<ProductPriceData[]>('/api/product-prices/goods-list', params);
};
import apiClient from './apiClient';

export interface ProductPriceData {
  GOODS_ID: string;
  GOODS_NM?: string;
  BRAND_ID?: string;
  BRAND_GBN_NM?: string;
  BTYPE_GBN?: string;
  MTYPE_GBN?: string;
  STYPE_GBN?: string;
  OPEN_D: string;
  CLOSE_D?: string;
  SOBIJA_DAN: number;
  MEMO?: string;
  USER_ID?: string;
  SYS_TIME?: string;
  UPD_USER?: string;
  UPD_TIME?: string;
}

export interface ProductPriceSearchParams {
  brandIds?: string[];
  btypeGbns?: string[];
  mtypeGbns?: string[];
  stypeGbns?: string[];
  goodsNm?: string;
  openDateFrom?: string;
  openDateTo?: string;
  goodsIds?: string[];
  mode?: string; // GOODS_LIST 등 특수 모드 지원
  searchAgentId?: string; // 로그인 유저의 agentId
}

export const searchProductPrices = async (params: ProductPriceSearchParams): Promise<ProductPriceData[]> => {
  // 파라미터 변환 (배열 → 콤마)
  const payload: any = {
    searchGoodsId: params.goodsIds?.join(',') || undefined,
    searchGoodsNm: params.goodsNm || undefined,
    searchBrandId: params.brandIds?.join(',') || undefined,
    searchBtypeGbn: params.btypeGbns?.join(',') || undefined,
    searchMtypeGbn: params.mtypeGbns?.join(',') || undefined,
    searchStypeGbn: params.stypeGbns?.join(',') || undefined,
    searchOpenD: params.openDateFrom || undefined,
    searchCloseD: params.openDateTo || undefined,
    searchAgentId: params.searchAgentId || undefined,
  };
  if (params.mode) {
    payload.mode = params.mode;
  }
  // Expect new fields from backend: BRAND_ID, BRAND_GBN_NM, etc.
  return apiClient.postJson<ProductPriceData[]>('/api/product-prices/search', payload);
};

// 저장용: ProductPriceData가 아니라 실제 API에 맞는 camelCase 객체를 받음
export const saveProductPrice = async (payload: {
  goodsId: string;
  openD: string;
  closeD?: string;
  sobijaDan: number;
  memo?: string;
  userId?: string;
}) => {
  return apiClient.postJson('/api/product-prices/save', payload);
};


export const deleteProductPrice = async (goodsId: string, openD: string) => {
  return apiClient.postJson('/api/product-prices/delete', { goodsId, openD });
};

// 중복 체크: 상품코드 + 적용일자
export const duplCheckProductPrice = async (goodsId: string, openD: string) => {
  return apiClient.postJson<any[]>('/api/product-prices/dupl-check', { goodsId, openD });
};
