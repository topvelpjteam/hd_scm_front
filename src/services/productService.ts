// 상품 검색 서비스
const API_BASE_URL = 'http://localhost:8080/api';

export interface ProductSearchRequest {
  searchTerm?: string;
  selectedGoodsGbn?: string[];
  selectedBrands?: string[];
  selectedBtypes?: string[];
  excludeEndedProducts?: boolean;
}

export interface Product {
  id: number;
  productCode: string;
  productName: string;
  brand: string;
  category: string;
  barcode?: string;
  consumerPrice: number;
  supplier?: string;
  storeInventory?: number;
  isEnded: boolean;
  createdAt: string;
  updatedAt: string;
}

// 상품 검색
export const searchProducts = async (request: ProductSearchRequest): Promise<Product[]> => {
  try {
    const response = await fetch(`${API_BASE_URL}/products/search`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const products = await response.json();
    console.log('상품 검색 결과:', products);
    return products;
  } catch (error) {
    console.error('상품 검색 중 오류 발생:', error);
    throw error;
  }
};

// 브랜드 목록 조회
export const getBrands = async (): Promise<string[]> => {
  try {
    const response = await fetch(`${API_BASE_URL}/products/brands`);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const brands = await response.json();
    console.log('브랜드 목록:', brands);
    return brands;
  } catch (error) {
    console.error('브랜드 목록 조회 중 오류 발생:', error);
    throw error;
  }
};

// 대분류 목록 조회
export const getCategories = async (): Promise<string[]> => {
  try {
    const response = await fetch(`${API_BASE_URL}/products/categories`);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const categories = await response.json();
    console.log('대분류 목록:', categories);
    return categories;
  } catch (error) {
    console.error('대분류 목록 조회 중 오류 발생:', error);
    throw error;
  }
};

// 모든 상품 조회
export const getAllProducts = async (): Promise<Product[]> => {
  try {
    const response = await fetch(`${API_BASE_URL}/products`);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const products = await response.json();
    console.log('모든 상품:', products);
    return products;
  } catch (error) {
    console.error('상품 조회 중 오류 발생:', error);
    throw error;
  }
};

// 상품 저장/업데이트
export const saveProduct = async (productData: any, userId: string): Promise<{success: boolean, message: string}> => {
  try {
    const response = await fetch(`${API_BASE_URL}/products/save`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ ...productData, userId }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    return result;
  } catch (error) {
    console.error('상품 저장 중 오류 발생:', error);
    throw error;
  }
};

// 상품 삭제
export const deleteProduct = async (productId: number, userId: string): Promise<{success: boolean, message: string}> => {
  try {
    const response = await fetch(`${API_BASE_URL}/products/delete`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ productId, userId }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    return result;
  } catch (error) {
    console.error('상품 삭제 중 오류 발생:', error);
    throw error;
  }
};

// 상품 중복 체크
export const checkProductExists = async (brandId: string, goodsIdBrand: string, userId: string): Promise<{exists: boolean, productData?: any}> => {
  try {
    const response = await fetch(`${API_BASE_URL}/products/check-exists`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ brandId, goodsIdBrand, userId }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    return result;
  } catch (error) {
    console.error('상품 중복 체크 중 오류 발생:', error);
    throw error;
  }
};

// ProductService 클래스로 모든 메서드들을 그룹화
export class ProductService {
  static async saveProduct(productData: any, userId: string) {
    return saveProduct(productData, userId);
  }

  static async deleteProduct(productId: number, userId: string) {
    return deleteProduct(productId, userId);
  }

  static async checkProductExists(brandId: string, goodsIdBrand: string, userId: string) {
    return checkProductExists(brandId, goodsIdBrand, userId);
  }
}