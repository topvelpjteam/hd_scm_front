// 공통 코드 서비스 (통합)
import { apiClient } from './apiClient';

export interface CommonCodeOption {
    value: string;
    label: string;
}

class CommonCodeService {
    private baseUrl = 'http://localhost:8080/api/common';

    // 상품구분 조회 (코드 기준 정렬, 자동 로딩 적용)
    async getGoodsGbn(): Promise<CommonCodeOption[]> {
        try {
            const data = await apiClient.getJson<any[]>(
                `${this.baseUrl}/goods-gbn`,
                { loadingMessage: '상품구분을 불러오는 중...' }
            );
            
            // 응답 데이터를 옵션 형태로 변환 (코드 기준 정렬)
            return data.map((item: any) => ({
                value: item.goodsGbn,
                label: item.goodsGbnNm
            })).sort((a: CommonCodeOption, b: CommonCodeOption) => a.value.localeCompare(b.value));
            
        } catch (error) {
            console.error('상품구분 조회 오류:', error);
            throw new Error('상품구분 조회에 실패했습니다.');
        }
    }

    // 브랜드 조회 (거래업체별 필터링, 자동 로딩 적용)
    async getBrands(agentId?: string): Promise<CommonCodeOption[]> {
        try {
            const url = agentId ? `${this.baseUrl}/brands?agentId=${agentId}` : `${this.baseUrl}/brands`;
            const data = await apiClient.getJson<any[]>(
                url,
                { loadingMessage: '브랜드를 불러오는 중...' }
            );
            
            // 응답 데이터를 옵션 형태로 변환 (코드 기준 정렬)
            return data.map((item: any) => ({
                value: item.brandId,
                label: item.brandGbnNm
            })).sort((a: CommonCodeOption, b: CommonCodeOption) => a.value.localeCompare(b.value));
            
        } catch (error) {
            console.error('브랜드 조회 오류:', error);
            throw new Error('브랜드 조회에 실패했습니다.');
        }
    }

    // 대분류 조회
    async getBTypes(): Promise<CommonCodeOption[]> {
        try {
            const response = await fetch(`${this.baseUrl}/btypes`);
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const data = await response.json();
            
            // 응답 데이터를 옵션 형태로 변환 (코드 기준 정렬)
            return data.map((item: any) => ({
                value: item.btypeGbn,
                label: item.btypeGbnNm
            })).sort((a: CommonCodeOption, b: CommonCodeOption) => a.value.localeCompare(b.value));
            
        } catch (error) {
            console.error('대분류 조회 오류:', error);
            throw new Error('대분류 조회에 실패했습니다.');
        }
    }

    // 중분류 조회
    async getMTypes(): Promise<CommonCodeOption[]> {
        try {
            const response = await fetch(`${this.baseUrl}/mtypes`);
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const data = await response.json();
            
            // 응답 데이터를 옵션 형태로 변환 (코드 기준 정렬)
            return data.map((item: any) => ({
                value: item.mtypeGbn,
                label: item.mtypeGbnNm
            })).sort((a: CommonCodeOption, b: CommonCodeOption) => a.value.localeCompare(b.value));
            
        } catch (error) {
            console.error('중분류 조회 오류:', error);
            throw new Error('중분류 조회에 실패했습니다.');
        }
    }

    // 소분류 조회
    async getSTypes(): Promise<CommonCodeOption[]> {
        try {
            const response = await fetch(`${this.baseUrl}/stypes`);
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const data = await response.json();
            
            // 응답 데이터를 옵션 형태로 변환 (코드 기준 정렬)
            return data.map((item: any) => ({
                value: item.stypeGbn,
                label: item.stypeGbnNm
            })).sort((a: CommonCodeOption, b: CommonCodeOption) => a.value.localeCompare(b.value));
            
        } catch (error) {
            console.error('소분류 조회 오류:', error);
            throw new Error('소분류 조회에 실패했습니다.');
        }
    }

    // 원산지 국가 조회
    async getNations(): Promise<CommonCodeOption[]> {
        try {
            const response = await fetch(`${this.baseUrl}/nations`);
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const data = await response.json();
            
            // 응답 데이터를 옵션 형태로 변환 (코드 기준 정렬)
            return data.map((item: any) => ({
                value: item.nationGbn,
                label: item.nationGbnNm
            })).sort((a: CommonCodeOption, b: CommonCodeOption) => a.value.localeCompare(b.value));
            
        } catch (error) {
            console.error('원산지 국가 조회 오류:', error);
            throw new Error('원산지 국가 조회에 실패했습니다.');
        }
    }
    
    // 메이커구분 조회
    async getMakerGbn(): Promise<CommonCodeOption[]> {
        try {
            const response = await fetch(`${this.baseUrl}/maker-gbn`);
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const data = await response.json();
            
            return data.map((item: any) => ({
                value: item.makerGbn,
                label: item.makerGbnNm
            })).sort((a: CommonCodeOption, b: CommonCodeOption) => a.value.localeCompare(b.value));
            
        } catch (error) {
            console.error('메이커구분 조회 오류:', error);
            throw new Error('메이커구분 조회에 실패했습니다.');
        }
    }
    
    // 컬렉션구분 조회
    async getCollectionGbn(): Promise<CommonCodeOption[]> {
        try {
            const response = await fetch(`${this.baseUrl}/collection-gbn`);
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const data = await response.json();
            
            return data.map((item: any) => ({
                value: item.collectionGbn,
                label: item.collectionGbnNm
            })).sort((a: CommonCodeOption, b: CommonCodeOption) => 
                (a.value || '').localeCompare(b.value || '')
            );
            
        } catch (error) {
            console.error('컬렉션구분 조회 오류:', error);
            throw new Error('컬렉션구분 조회에 실패했습니다.');
        }
    }
    
    // 채널구분 조회
    async getChannGbn(): Promise<CommonCodeOption[]> {
        try {
            const response = await fetch(`${this.baseUrl}/chann-gbn`);
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const data = await response.json();
            
            return data.map((item: any) => ({
                value: item.channGbn,
                label: item.channGbnNm
            })).sort((a: CommonCodeOption, b: CommonCodeOption) => a.value.localeCompare(b.value));
            
        } catch (error) {
            console.error('채널구분 조회 오류:', error);
            throw new Error('채널구분 조회에 실패했습니다.');
        }
    }
    
    // 운용구분 조회
    async getManaGbn(): Promise<CommonCodeOption[]> {
        try {
            const response = await fetch(`${this.baseUrl}/mana-gbn`);
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const data = await response.json();
            
            return data.map((item: any) => ({
                value: item.manaGbn,
                label: item.manaGbnNm
            })).sort((a: CommonCodeOption, b: CommonCodeOption) => a.value.localeCompare(b.value));
            
        } catch (error) {
            console.error('운용구분 조회 오류:', error);
            throw new Error('운용구분 조회에 실패했습니다.');
        }
    }
    
    // 포장단위 조회
    async getBoxGbn(): Promise<CommonCodeOption[]> {
        try {
            const response = await fetch(`${this.baseUrl}/box-gbn`);
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const data = await response.json();
            
            return data.map((item: any) => ({
                value: item.boxGbn,
                label: item.boxGbnNm
            })).sort((a: CommonCodeOption, b: CommonCodeOption) => a.value.localeCompare(b.value));
            
        } catch (error) {
            console.error('포장단위 조회 오류:', error);
            throw new Error('포장단위 조회에 실패했습니다.');
        }
    }
    
    // 화폐구분 조회
    async getMoneyGbn(): Promise<CommonCodeOption[]> {
        try {
            const response = await fetch(`${this.baseUrl}/money-gbn`);
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const data = await response.json();
            
            return data.map((item: any) => ({
                value: item.moneyGbn,
                label: item.moneyGbnNm
            })).sort((a: CommonCodeOption, b: CommonCodeOption) => a.value.localeCompare(b.value));
            
        } catch (error) {
            console.error('화폐구분 조회 오류:', error);
            throw new Error('화폐구분 조회에 실패했습니다.');
        }
    }

    // 배송방법 조회
    async getShipMethods(): Promise<CommonCodeOption[]> {
        try {
            const data = await apiClient.getJson<any[]>(
                `${this.baseUrl}/ship-methods`,
                { loadingMessage: '배송방법을 불러오는 중...' }
            );

            const sorted = [...data].sort((a, b) => {
                const aKey = typeof a.sortKey === 'number' ? a.sortKey : Number.MAX_SAFE_INTEGER;
                const bKey = typeof b.sortKey === 'number' ? b.sortKey : Number.MAX_SAFE_INTEGER;
                if (aKey !== bKey) {
                    return aKey - bKey;
                }
                return (a.shipMethodNm || '').localeCompare(b.shipMethodNm || '');
            });

            return sorted.map((item: any) => ({
                value: item.shipMethod,
                label: item.shipMethodNm
            }));

        } catch (error) {
            console.error('배송방법 조회 오류:', error);
            throw new Error('배송방법 조회에 실패했습니다.');
        }
    }

    // 배송회사(물류사) 조회
    async getLogisCompanies(): Promise<CommonCodeOption[]> {
        try {
            const data = await apiClient.getJson<any[]>(
                `${this.baseUrl}/logis-companies`,
                { loadingMessage: '배송회사를 불러오는 중...' }
            );

            const sorted = [...data].sort((a, b) => {
                const aKey = typeof a.sortKey === 'number' ? a.sortKey : Number.MAX_SAFE_INTEGER;
                const bKey = typeof b.sortKey === 'number' ? b.sortKey : Number.MAX_SAFE_INTEGER;
                if (aKey !== bKey) {
                    return aKey - bKey;
                }
                return (a.logisGbnNm || '').localeCompare(b.logisGbnNm || '');
            });

            return sorted.map((item: any) => ({
                value: item.logisGbn,
                label: item.logisGbnNm
            }));

        } catch (error) {
            console.error('배송회사 조회 오류:', error);
            throw new Error('배송회사 조회에 실패했습니다.');
        }
    }

    // 거래처구분 조회
    async getAgentGbn(): Promise<CommonCodeOption[]> {
        try {
            const response = await fetch(`${this.baseUrl}/agent-gbn`);
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const data = await response.json();
            
            return data.map((item: any) => ({
                value: item.agentGbn,
                label: item.agentGbnNm
            })).sort((a: CommonCodeOption, b: CommonCodeOption) => a.value.localeCompare(b.value));
            
        } catch (error) {
            console.error('거래처구분 조회 오류:', error);
            throw new Error('거래처구분 조회에 실패했습니다.');
        }
    }

    // 은행구분 조회
    async getBankGbn(): Promise<CommonCodeOption[]> {
        try {
            const response = await fetch(`${this.baseUrl}/bank-gbn`);
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const data = await response.json();
            
            return data.map((item: any) => ({
                value: item.bankGbn,
                label: item.bankGbnNm
            })).sort((a: CommonCodeOption, b: CommonCodeOption) => a.value.localeCompare(b.value));
            
        } catch (error) {
            console.error('은행구분 조회 오류:', error);
            throw new Error('은행구분 조회에 실패했습니다.');
        }
    }

    // 매장 목록 조회 (VW_STORE_GBN 뷰 사용)
    async getStores(): Promise<CommonCodeOption[]> {
        try {
            const response = await fetch(`${this.baseUrl}/stores`);
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const data = await response.json();
            
            // 응답 데이터를 옵션 형태로 변환 (매장명만 표시, 코드는 히든)
            return data.map((item: any) => ({
                value: item.storeId,
                label: item.storeNm  // 매장명만 표시
            })).sort((a: CommonCodeOption, b: CommonCodeOption) => a.label.localeCompare(b.label));
            
        } catch (error) {
            console.error('매장 목록 조회 오류:', error);
            throw new Error('매장 목록 조회에 실패했습니다.');
        }
    }

    // 납품업체 목록 조회 (CommonCodeService 사용)
    async getVendors(): Promise<CommonCodeOption[]> {
        try {
            const data = await apiClient.getJson<any[]>(
                `${this.baseUrl}/vendors`,
                { loadingMessage: '납품업체를 불러오는 중...' }
            );
            
            // 응답 데이터를 옵션 형태로 변환 (납품업체명 기준 정렬)
            return data.map((item: any) => ({
                value: item.vendorId,
                label: item.vendorNm
            })).sort((a: CommonCodeOption, b: CommonCodeOption) => a.label.localeCompare(b.label));
            
        } catch (error) {
            console.error('납품업체 목록 조회 오류:', error);
            throw new Error('납품업체 목록 조회에 실패했습니다.');
        }
    }

    // 거래업체 목록 조회 (CommonCodeService 사용)
    async getAgents(): Promise<CommonCodeOption[]> {
        try {
            const data = await apiClient.getJson<any[]>(
                `${this.baseUrl}/agents`,
                { loadingMessage: '거래업체를 불러오는 중...' }
            );
            
            // 응답 데이터를 옵션 형태로 변환 (거래업체명 기준 정렬)
            return data.map((item: any) => ({
                value: item.agentId,
                label: item.agentNm
            })).sort((a: CommonCodeOption, b: CommonCodeOption) => a.label.localeCompare(b.label));
            
        } catch (error) {
            console.error('거래업체 목록 조회 오류:', error);
            throw new Error('거래업체 목록 조회에 실패했습니다.');
        }
    }

    // 이메일 전송 상태 조회 (CommonCodeService 사용)
    async getEmailStatus(): Promise<CommonCodeOption[]> {
        try {
            const data = await apiClient.getJson<any[]>(
                `${this.baseUrl}/email-status`,
                { loadingMessage: '이메일 전송 상태를 불러오는 중...' }
            );
            
            // 응답 데이터를 옵션 형태로 변환 (정렬 키 기준 정렬)
            return data.map((item: any) => ({
                value: item.emailStatus,
                label: item.emailStatusNm
            })).sort((a: CommonCodeOption, b: CommonCodeOption) => {
                // sortKey가 있으면 sortKey 기준으로, 없으면 label 기준으로 정렬
                const aSortKey = data.find(d => d.emailStatus === a.value)?.sortKey || 999;
                const bSortKey = data.find(d => d.emailStatus === b.value)?.sortKey || 999;
                return aSortKey - bSortKey;
            });
            
        } catch (error) {
            console.error('이메일 전송 상태 조회 오류:', error);
            throw new Error('이메일 전송 상태 조회에 실패했습니다.');
        }
    }

    // 고객구분 조회 (CommonCodeService 사용)
    async getCustGbn(): Promise<CommonCodeOption[]> {
        try {
            const data = await apiClient.getJson<any[]>(
                `${this.baseUrl}/cust-gbn`,
                { loadingMessage: '고객구분을 불러오는 중...' }
            );
            
            // 응답 데이터를 옵션 형태로 변환 (코드 기준 정렬)
            return data.map((item: any) => ({
                value: item.custGbn,
                label: item.custGbnNm
            })).sort((a: CommonCodeOption, b: CommonCodeOption) => a.value.localeCompare(b.value));
            
        } catch (error) {
            console.error('고객구분 조회 오류:', error);
            throw new Error('고객구분 조회에 실패했습니다.');
        }
    }

    // 국가 조회 (CommonCodeService 사용)
    async getNationGbn(): Promise<CommonCodeOption[]> {
        try {
            const data = await apiClient.getJson<any[]>(
                `${this.baseUrl}/nation-gbn`,
                { loadingMessage: '국가 정보를 불러오는 중...' }
            );
            
            // 응답 데이터를 옵션 형태로 변환 (코드 기준 정렬)
            return data.map((item: any) => ({
                value: item.nationGbn,
                label: item.nationGbnNm
            })).sort((a: CommonCodeOption, b: CommonCodeOption) => a.value.localeCompare(b.value));
            
        } catch (error) {
            console.error('국가 정보 조회 오류:', error);
            throw new Error('국가 정보 조회에 실패했습니다.');
        }
    }
}

export const commonCodeService = new CommonCodeService();
