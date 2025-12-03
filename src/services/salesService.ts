import { apiClient } from './apiClient';

const API_BASE = '/api/sales'; // 백엔드 컨트롤러에 맞춰 조정하세요

export interface CustSearchParams {
  SALE_D?: string;
  AGENT_ID: number | string;
  SEARCH?: string;
  USER_ID?: number | string;
  FIND_CNT?: number;
  INCLUDE_OTHER_STORE?: boolean;
}

export interface CustDetailParams {
  SALE_D?: string;
  AGENT_ID: number | string;
  CUST_ID: number | string;
}

// 고객 검색 (MODE = CUST_SEARCH)
export async function customerSearch(params: CustSearchParams) {
  const body = {
    MODE: 'CUST_SEARCH',
    SALE_D: params.SALE_D,
    AGENT_ID: params.AGENT_ID,
    SEARCH: params.SEARCH || '',
    INCLUDE_OTHER_STORE: params.INCLUDE_OTHER_STORE ? 'Y' : 'N'
  };
  // 컨트롤러는 POST /api/sales/registration 같은 엔드포인트에서 처리하도록 구현되어야 합니다.
  return apiClient.postJson<any[]>('/api/sales/registration', body);
}

// 영수증 기반 판매전표 조회 (MODE = TR_DISPLAY)
export async function getSaleDetailByReceipt(params: { SALE_D: string; STORE_ID: number | string; CUST_ID: number | string; TR_NO: string }) {
  const body: any = {
    MODE: 'TR_DISPLAY',
    SALE_D: params.SALE_D,
    STORE_ID: (typeof params.STORE_ID === 'number' || !Number.isNaN(Number(params.STORE_ID))) ? Number(params.STORE_ID) : params.STORE_ID,
    CUST_ID: (typeof params.CUST_ID === 'number' || !Number.isNaN(Number(params.CUST_ID))) ? Number(params.CUST_ID) : params.CUST_ID,
    TR_NO: params.TR_NO || ''
  };

  try { console.debug('[salesService] getSaleDetailByReceipt request body:', body); } catch (e) {}
  const resp = await apiClient.postJson<any[]>('/api/sales/registration', body);
  try { console.debug('[salesService] getSaleDetailByReceipt response length:', Array.isArray(resp) ? resp.length : typeof resp); } catch (e) {}
  return resp;
}

// 검색 이력 저장 (MODE = CUST_SEARCH_HIST)
export async function saveCustomerSearchHistory(params: CustSearchParams) {
  const body = {
    MODE: 'CUST_SEARCH_HIST',
    SALE_D: params.SALE_D,
    AGENT_ID: params.AGENT_ID,
    USER_ID: params.USER_ID,
    SEARCH: params.SEARCH || '',
    FIND_CNT: params.FIND_CNT ?? 0,
    INCLUDE_OTHER_STORE: params.INCLUDE_OTHER_STORE ? 'Y' : 'N'
  };
  return apiClient.postJson<any>('/api/sales/registration', body);
}

// 검색 이력 조회 (MODE = CUST_SEARCH_HIST_DISPLAY)
export async function fetchCustomerSearchHistory(params: { SALE_D?: string; AGENT_ID?: number | string }) {
  const body = {
    MODE: 'CUST_SEARCH_HIST_DISPLAY',
    SALE_D: params.SALE_D,
    AGENT_ID: params.AGENT_ID
  };
  return apiClient.postJson<any[]>('/api/sales/registration', body);
}

// 매장 사원 리스트 조회
export async function fetchStaffList(params: { AGENT_ID?: number | string }) {
  const body = {
    MODE: 'STAFF_LIST',
    AGENT_ID: params.AGENT_ID
  };
  return apiClient.postJson<any[]>('/api/sales/registration', body);
}

// 고객 상세 (MODE = CUST_SEARCH_DETAIL)
export async function customerDetail(params: CustDetailParams) {
  const body = {
    MODE: 'CUST_SEARCH_DETAIL',
    SALE_D: params.SALE_D,
    AGENT_ID: params.AGENT_ID,
    CUST_ID: params.CUST_ID
  };
  return apiClient.postJson<any>('/api/sales/registration', body);
}

// 구매 이력 조회 (MODE = CUST_SALE_HIST)
export async function fetchPurchaseHistory(params: { SALE_D?: string; AGENT_ID?: number | string; CUST_ID?: number | string; SEARCH_DATE_FROM?: string; SEARCH_DATE_TO?: string; SEARCH_GOODS_NM?: string }) {
  const body = {
    MODE: 'CUST_SALE_HIST',
    SALE_D: params.SALE_D,
    AGENT_ID: params.AGENT_ID,
    CUST_ID: params.CUST_ID,
    SEARCH_DATE_FROM: params.SEARCH_DATE_FROM,
    SEARCH_DATE_TO: params.SEARCH_DATE_TO,
    SEARCH_GOODS_NM: params.SEARCH_GOODS_NM
  };
  return apiClient.postJson<any[]>('/api/sales/registration', body);
}

// 판매전표 라인 저장 (MODE = CUST_SALE_SAVE_UPDATE)
export async function saveSaleLine(params: {
  SALE_D: string;
  STORE_ID: number | string;
  CUST_ID: number | string;
  TR_NO?: string | null;
  SALE_SEQU?: number | null; // 순번 (UPDATE 시 필요)
  STAFF_ID?: number | string | null;
  GOODS_ID: number | string;
  SALE_QTY: number;
  SALE_DANGA: number;
  TOT_AMT?: number;
  DISCOUNT_RATE?: number;
  DISCOUNT_AMT?: number;
  SALE_AMT?: number;
  EXP_D?: string | null;
  MAIL_POINT?: number;
  P_MAIL_AMT?: number | null; // 특별마일리지 기준금액
  P_MAIL_POINT?: number | null; // 특별마일리지 포인트
  IS_GENUINE?: string; // 'Y'|'N'
  USER_ID?: number | string | null;
  // optional flag to request running monthly aggregation after saving this line
  RUN_MONTH_AFTER_SAVE?: boolean | number | string | null;
  // alternative camelCase alias sometimes used by callers
  runMonthAfterSave?: boolean | number | string | null;
}) {
  const body: any = {
    MODE: 'CUST_SALE_SAVE_UPDATE',
    SALE_D: params.SALE_D,
    // Ensure numeric values are sent when possible (backend expects numeric STORE_ID/CUST_ID)
    STORE_ID: (typeof params.STORE_ID === 'number' || !Number.isNaN(Number(params.STORE_ID))) ? Number(params.STORE_ID) : params.STORE_ID,
    CUST_ID: (typeof params.CUST_ID === 'number' || !Number.isNaN(Number(params.CUST_ID))) ? Number(params.CUST_ID) : params.CUST_ID,
    TR_NO: params.TR_NO || '',
    SALE_SEQU: params.SALE_SEQU ?? null, // SALE_SEQU 추가 (UPDATE 시 사용)
    // propagate optional flag if present
    RUN_MONTH_AFTER_SAVE: params.RUN_MONTH_AFTER_SAVE ?? params.runMonthAfterSave ?? undefined,
    STAFF_ID: params.STAFF_ID || null,
    GOODS_ID: params.GOODS_ID,
    SALE_QTY: params.SALE_QTY,
    SALE_DANGA: params.SALE_DANGA,
    TOT_AMT: params.TOT_AMT ?? (params.SALE_QTY * params.SALE_DANGA),
    DISCOUNT_RATE: params.DISCOUNT_RATE ?? 0,
    DISCOUNT_AMT: params.DISCOUNT_AMT ?? 0,
    SALE_AMT: params.SALE_AMT ?? ( (params.SALE_QTY * params.SALE_DANGA) - (params.DISCOUNT_AMT ?? 0) ),
    EXP_D: params.EXP_D || '',
    MAIL_POINT: params.MAIL_POINT ?? 0,
    P_MAIL_AMT: params.P_MAIL_AMT ?? null,
    P_MAIL_POINT: params.P_MAIL_POINT ?? null,
    IS_GENUINE: params.IS_GENUINE || 'Y',
    USER_ID: params.USER_ID || null
  };

  try {
    console.debug('[salesService] saveSaleLine request body:', JSON.stringify(body));
  } catch (e) {
    // ignore console errors in older browsers
  }

  const resp = await apiClient.postJson<any>('/api/sales/registration', body);

  try {
    console.debug('[salesService] saveSaleLine response:', JSON.stringify(resp));
  } catch (e) {}

  return resp;
}

// 월간 집계 호출 (MODE = CUST_SALE_MONTH)
export async function aggregateMonth(params: { TR_NO?: string; SALE_D?: string; STORE_ID?: number | string; CUST_ID?: number | string }) {
  const body: any = {
    MODE: 'CUST_SALE_MONTH',
    TR_NO: params.TR_NO || '',
    SALE_D: params.SALE_D || '',
    STORE_ID: params.STORE_ID || null,
    CUST_ID: params.CUST_ID || null
  };
  try { console.debug('[salesService] aggregateMonth request body:', body); } catch (e) {}
  const resp = await apiClient.postJson<any>('/api/sales/registration', body);
  try { console.debug('[salesService] aggregateMonth response:', resp); } catch (e) {}
  return resp;
}

// 마일리지 원장 조회 (MODE = MAIL_WONJANG)
export async function fetchMileageWonjang(params: { SALE_D?: string; CUST_ID: number | string }) {
  // CUST_ID를 숫자로 변환 (SP가 numeric 타입을 기대함)
  const custIdNum = typeof params.CUST_ID === 'number' ? params.CUST_ID : 
                    (!isNaN(Number(params.CUST_ID)) ? Number(params.CUST_ID) : params.CUST_ID);
  const body = {
    MODE: 'MAIL_WONJANG',
    SALE_D: params.SALE_D,
    CUST_ID: custIdNum
  };
  return apiClient.postJson<any[]>('/api/sales/registration', body);
}

// ============================================================
// 상담이력 관련 API
// ============================================================

export interface ConsultSearchParams {
  CUST_ID: number | string;
  STORE_ID?: number | string;
  PROC_STATUS?: string;
  CONSULT_TYPE?: string;
}

export interface ConsultSaveParams {
  CONSULT_ID?: number;
  CONSULT_D?: string;
  STORE_ID: number | string;
  CUST_ID: number | string;
  STAFF_ID?: number | string;
  CONSULT_TYPE: string;
  CONSULT_TITLE?: string;
  CONSULT_CONTENT: string;
  PROC_STATUS?: string;
  PROC_CONTENT?: string;
  REL_TR_NO?: string;
  REL_GOODS_ID?: number;
  USER_ID: number | string;
}

// 상담이력 조회 (MODE = CONSULT_SEARCH)
export async function fetchConsultHistory(params: ConsultSearchParams) {
  const body = {
    MODE: 'CONSULT_SEARCH',
    CUST_ID: Number(params.CUST_ID),
    STORE_ID: params.STORE_ID ? Number(params.STORE_ID) : null,
    PROC_STATUS: params.PROC_STATUS || '',
    CONSULT_TYPE: params.CONSULT_TYPE || ''
  };
  return apiClient.postJson<any[]>('/api/sales/registration', body);
}

// 상담 상세 조회 (MODE = CONSULT_DETAIL)
export async function fetchConsultDetail(consultId: number) {
  const body = {
    MODE: 'CONSULT_DETAIL',
    CONSULT_ID: consultId
  };
  return apiClient.postJson<any[]>('/api/sales/registration', body);
}

// 상담 등록 (MODE = CONSULT_INSERT)
export async function insertConsult(params: ConsultSaveParams) {
  const body = {
    MODE: 'CONSULT_INSERT',
    CONSULT_D: params.CONSULT_D,
    STORE_ID: Number(params.STORE_ID),
    CUST_ID: Number(params.CUST_ID),
    STAFF_ID: params.STAFF_ID ? Number(params.STAFF_ID) : null,
    CONSULT_TYPE: params.CONSULT_TYPE,
    CONSULT_TITLE: params.CONSULT_TITLE || '',
    CONSULT_CONTENT: params.CONSULT_CONTENT,
    PROC_STATUS: params.PROC_STATUS || 'P',
    REL_TR_NO: params.REL_TR_NO || null,
    REL_GOODS_ID: params.REL_GOODS_ID || null,
    USER_ID: Number(params.USER_ID)
  };
  return apiClient.postJson<any>('/api/sales/registration', body);
}

// 상담 수정 (MODE = CONSULT_UPDATE)
export async function updateConsult(params: ConsultSaveParams) {
  const body = {
    MODE: 'CONSULT_UPDATE',
    CONSULT_ID: params.CONSULT_ID,
    CONSULT_D: params.CONSULT_D,
    CONSULT_TYPE: params.CONSULT_TYPE,
    CONSULT_TITLE: params.CONSULT_TITLE,
    CONSULT_CONTENT: params.CONSULT_CONTENT,
    REL_TR_NO: params.REL_TR_NO || null,
    REL_GOODS_ID: params.REL_GOODS_ID || null,
    USER_ID: Number(params.USER_ID)
  };
  return apiClient.postJson<any>('/api/sales/registration', body);
}

// 상담 처리결과 등록 (MODE = CONSULT_PROC)
export async function processConsult(params: { CONSULT_ID: number; PROC_STATUS: string; PROC_CONTENT?: string; STAFF_ID?: number; USER_ID: number }) {
  const body = {
    MODE: 'CONSULT_PROC',
    CONSULT_ID: params.CONSULT_ID,
    PROC_STATUS: params.PROC_STATUS,
    PROC_CONTENT: params.PROC_CONTENT || '',
    STAFF_ID: params.STAFF_ID || null,
    USER_ID: params.USER_ID
  };
  return apiClient.postJson<any>('/api/sales/registration', body);
}

// 상담 삭제 (MODE = CONSULT_DELETE)
export async function deleteConsult(consultId: number) {
  const body = {
    MODE: 'CONSULT_DELETE',
    CONSULT_ID: consultId
  };
  return apiClient.postJson<any>('/api/sales/registration', body);
}

// 상담유형 코드 조회 (MODE = CONSULT_TYPE_LIST)
export async function fetchConsultTypeList() {
  const body = { MODE: 'CONSULT_TYPE_LIST' };
  return apiClient.postJson<any[]>('/api/sales/registration', body);
}

// 처리상태 코드 조회 (MODE = PROC_STATUS_LIST)
export async function fetchProcStatusList() {
  const body = { MODE: 'PROC_STATUS_LIST' };
  return apiClient.postJson<any[]>('/api/sales/registration', body);
}

// 당일 판매사원 실적 조회 (MODE = STAFF_SALE)
export interface StaffSaleParams {
  SALE_D: string;
  STORE_ID: number | string;
}

export async function fetchStaffSale(params: StaffSaleParams) {
  const body = {
    MODE: 'STAFF_SALE',
    SALE_D: params.SALE_D,
    STORE_ID: Number(params.STORE_ID)
  };
  return apiClient.postJson<any[]>('/api/sales/registration', body);
}

export default {
  customerSearch,
  saveCustomerSearchHistory,
  customerDetail,
  fetchCustomerSearchHistory,
  fetchStaffList,
  fetchPurchaseHistory,
  fetchMileageWonjang,
  saveSaleLine,
  aggregateMonth,
  getSaleDetailByReceipt,
  // 상담이력
  fetchConsultHistory,
  fetchConsultDetail,
  insertConsult,
  updateConsult,
  processConsult,
  deleteConsult,
  fetchConsultTypeList,
  fetchProcStatusList,
  // 당일판매
  fetchStaffSale
};
