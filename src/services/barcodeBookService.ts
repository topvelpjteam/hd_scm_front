/**
 * 바코드책 서비스
 * 상품 데이터를 가져와서 바코드책을 생성하는 서비스
 */

import { apiClient } from './apiClient';

export interface ProductData {
  GOODS_ID: string;
  GOODS_ID_BRAND: string;
  GOODS_NM: string;
  BAR_CODE: string;
  SUPPLY_DAN: number;
  BRAND_ID: string;
  GOODS_GBN: string;
  BTYPE_GBN: string;
  STOCK_YN: string;
  RUN_D: string;
  END_D: string;
  VENDOR_ID?: string;
  VENDOR_NM?: string;
}

export interface BarcodeBookRequest {
  goodsIds?: string[];
  brandIds?: string[];
  goodsGbn?: string[];
  includeNoBarcode?: boolean;
}

export interface BarcodeBookResponse {
  success: boolean;
  data: ProductData[];
  message?: string;
}

class BarcodeBookService {
  private baseUrl = 'http://localhost:8080/api/barcode-book';

  /**
   * 상품 데이터 조회 (바코드책용)
   */
  async getProductData(request: BarcodeBookRequest = {}): Promise<BarcodeBookResponse> {
    try {
      console.log('📤 [바코드책] 상품 데이터 조회 요청:', request);
      
      const data = await apiClient.postJson<BarcodeBookResponse>(
        `${this.baseUrl}/products`,
        request,
        { loadingMessage: '상품 데이터를 불러오는 중...' }
      );
      
      console.log('📥 [바코드책] 상품 데이터 조회 응답:', data);
      return data;
    } catch (error) {
      console.error('❌ [바코드책] 상품 데이터 조회 실패:', error);
      throw error;
    }
  }

  /**
   * 바코드책 인쇄 데이터 생성
   */
  async generatePrintData(productIds: string[]): Promise<any> {
    try {
      console.log('📤 [바코드책] 인쇄 데이터 생성 요청:', productIds);
      
      const data = await apiClient.postJson(
        `${this.baseUrl}/generate-print`,
        { productIds },
        { loadingMessage: '바코드 인쇄 데이터를 생성하는 중...' }
      );
      
      console.log('📥 [바코드책] 인쇄 데이터 생성 응답:', data);
      return data;
    } catch (error) {
      console.error('❌ [바코드책] 인쇄 데이터 생성 실패:', error);
      throw error;
    }
  }

  /**
   * 바코드책 엑셀 다운로드
   */
  async downloadExcel(productIds: string[]): Promise<Blob> {
    try {
      console.log('📤 [바코드책] 엑셀 다운로드 요청:', productIds);
      
      const response = await apiClient.post(
        `${this.baseUrl}/download-excel`,
        { productIds },
        { loadingMessage: '엑셀 파일을 생성하는 중...' }
      );
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const blob = await response.blob();
      console.log('📥 [바코드책] 엑셀 다운로드 완료');
      return blob;
    } catch (error) {
      console.error('❌ [바코드책] 엑셀 다운로드 실패:', error);
      throw error;
    }
  }

  /**
   * 브랜드 목록 조회
   */
  async getBrands(): Promise<Array<{brandId: string, brandName: string}>> {
    try {
      console.log('📤 [바코드책] 브랜드 목록 조회 요청');
      
      const data = await apiClient.getJson<Array<{brandId: string, brandName: string}>>(
        `${this.baseUrl}/brands`,
        { loadingMessage: '브랜드 목록을 불러오는 중...' }
      );
      
      console.log('📥 [바코드책] 브랜드 목록 조회 응답:', data);
      return data;
    } catch (error) {
      console.error('❌ [바코드책] 브랜드 목록 조회 실패:', error);
      throw error;
    }
  }

  /**
   * 상품구분 목록 조회
   */
  async getGoodsGbnList(): Promise<Array<{goodsGbn: string, goodsGbnName: string}>> {
    try {
      console.log('📤 [바코드책] 상품구분 목록 조회 요청');
      
      const data = await apiClient.getJson<Array<{goodsGbn: string, goodsGbnName: string}>>(
        `${this.baseUrl}/goods-gbn`,
        { loadingMessage: '상품구분 목록을 불러오는 중...' }
      );
      
      console.log('📥 [바코드책] 상품구분 목록 조회 응답:', data);
      return data;
    } catch (error) {
      console.error('❌ [바코드책] 상품구분 목록 조회 실패:', error);
      throw error;
    }
  }
}

export const barcodeBookService = new BarcodeBookService();
export default barcodeBookService;
