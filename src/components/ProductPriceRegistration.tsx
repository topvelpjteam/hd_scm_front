import React, { useEffect, useState, useCallback, useRef } from 'react';
import ProductSearchPopup from './common/ProductSearchPopup';
import { useSelector } from 'react-redux';
import { useGlobalLoading } from '../contexts/LoadingContext';
import { AgGridReact } from 'ag-grid-react';
import 'ag-grid-community/styles/ag-theme-alpine.css';
import DateRangePicker from './common/DateRangePicker';
import CommonMultiSelect from './CommonMultiSelect';
import { getMenuIcon } from '../utils/menuUtils';
import { RootState } from '../store/store';
import './ProductPriceRegistration.css';
import ProductPriceModal from './ProductPriceModal';
import SuccessModal from './common/SuccessModal';
import ConfirmationModal from './common/ConfirmationModal';
import BatchUploadModal from './common/BatchUploadModal';
import ExcelPreviewModal, { ExcelDataRow } from './common/ExcelPreviewModal';
import ExcelUploadResultModal, { ExcelUploadResult } from './common/ExcelUploadResultModal';
import type { ProductPriceData } from '../services/productPriceService';
        // setIsNewMode(false); // Removed as part of the patch
// 검색 조건 타입
interface SearchCondition {
  brandIds: string[];      // 브랜드 (다중선택)
  btypeGbns: string[];     // 대분류 (다중선택)
  mtypeGbns: string[];     // 중분류 (다중선택)
  stypeGbns: string[];     // 소분류 (다중선택)
  goodsNm: string;         // 상품명
  openDateFrom: string;    // 적용일자(시작)
  openDateTo: string;      // 적용일자(종료)
}

const ProductPriceRegistration: React.FC = React.memo(() => {
        // 상품검색 팝업 오픈 상태
        const [productSearchPopupOpen, setProductSearchPopupOpen] = useState(false);

        // 상품검색 팝업에서 상품 선택 시 처리
        const handleProductSelect = (product: { GOODS_ID: number; GOODS_NM: string }) => {
          setSelectedPrice(prev => {
            if (!prev) {
              return {
                GOODS_ID: String(product.GOODS_ID),
                GOODS_NM: product.GOODS_NM,
                BRAND_ID: '',
                BRAND_GBN_NM: '',
                BTYPE_GBN: '',
                MTYPE_GBN: '',
                STYPE_GBN: '',
                OPEN_D: '',
                CLOSE_D: '',
                SOBIJA_DAN: 0,
                MEMO: '',
                USER_ID: '',
                SYS_TIME: '',
                UPD_USER: '',
                UPD_TIME: ''
              };
            }
            return {
              ...prev,
              GOODS_ID: String(product.GOODS_ID),
              GOODS_NM: product.GOODS_NM,
              BRAND_ID: prev.BRAND_ID ?? '',
              BRAND_GBN_NM: prev.BRAND_GBN_NM ?? '',
              BTYPE_GBN: prev.BTYPE_GBN ?? '',
              MTYPE_GBN: prev.MTYPE_GBN ?? '',
              STYPE_GBN: prev.STYPE_GBN ?? '',
              OPEN_D: prev.OPEN_D ?? '',
              CLOSE_D: prev.CLOSE_D ?? '',
              SOBIJA_DAN: prev.SOBIJA_DAN ?? 0,
              MEMO: prev.MEMO ?? '',
              USER_ID: prev.USER_ID ?? '',
              SYS_TIME: prev.SYS_TIME ?? '',
              UPD_USER: prev.UPD_USER ?? '',
              UPD_TIME: prev.UPD_TIME ?? ''
            };
          });
        };
      // 공통 안내 모달 상태
      const [modal, setModal] = useState<{
        open: boolean;
        type: 'save' | 'update' | 'delete' | 'custom';
        message: string;
        details?: string;
        changedFields?: Array<{ field: string; name: string; oldValue: any; newValue: any }>;
      }>({ open: false, type: 'custom', message: '' });

      // 저장/삭제 전 확인 모달 상태
      const [confirm, setConfirm] = useState<{
        open: boolean;
        type: 'save' | 'delete';
        changedFields?: Array<{ field: string; name: string; oldValue: any; newValue: any }>;
      }>({ open: false, type: 'save' });
    // 일괄등록 모달 상태
    const [batchUploadModal, setBatchUploadModal] = useState<{ isOpen: boolean }>({ isOpen: false });
    // 엑셀 미리보기 모달 상태
    const [excelPreviewModal, setExcelPreviewModal] = useState<{ isOpen: boolean; data: ExcelDataRow[]; type?: 'product' | 'agent' | 'productPrice' }>({ isOpen: false, data: [], type: 'productPrice' });
    // 엑셀 업로드 결과 모달 상태
    const [uploadResultModal, setUploadResultModal] = useState<{ isOpen: boolean; result: ExcelUploadResult | null }>({ isOpen: false, result: null });

    // 로그인 유저의 agentId 추출 함수 (공통)
    const getLoginAgentId = () => {
      try {
        const userStr = sessionStorage.getItem('user');
        if (userStr) {
          const userObj = JSON.parse(userStr);
          return userObj.agentId || userObj.AGENT_ID || '';
        }
      } catch {}
      return '';
    };

    // 로그인 유저의 userId 추출 함수 (공통)
    const getLoginUserId = () => {
      try {
        const userStr = sessionStorage.getItem('user');
        if (userStr) {
          const userObj = JSON.parse(userStr);
          return userObj.userId != null ? String(userObj.userId) : '';
        }
      } catch {}
      return '';
    };

    // 템플릿 다운로드 핸들러 (상품가격관리용)
    // 엑셀 템플릿 다운로드: 현재 컬럼 헤더 기준으로 빈 엑셀 파일 생성
    const handleTemplateDownload = async () => {
      try {
        const headers = [
          '브랜드',        // BRAND_GBN_NM
          '상품코드',      // GOODS_ID
          '상품명',        // GOODS_NM
          '현재적용일자',  // OPEN_D
          '현재종료일자',  // CLOSE_D
          '현재소비자가',  // SOBIJA_DAN
          '적요'           // remark
        ];
        // 1. GOODS_LIST 모드로 데이터 조회 (goods-list API 직접 호출)
        const agentId = getLoginAgentId();
        // 권한이 있는 브랜드 상품만 조회
        const data = await import('../services/productPriceService').then(m => m.goodsListProductPrices({ searchAgentId: agentId }));
        // 2. 데이터 변환 (신규등록 모달 그리드와 동일한 필드 순서 + 적요)
        const dataRows = (data || []).map((row: any) => [
          row.BRAND_GBN_NM ?? '',
          row.GOODS_ID ?? '',
          row.GOODS_NM ?? '',
          row.OPEN_D ?? '',
          row.CLOSE_D ?? '',
          row.SOBIJA_DAN ?? '',
          row.REMARK ?? ''
          //'' // 적요(remark) 입력란 비워둠
        ]);
        // 3. 스타일 적용 util로 내보내기
        const { exportProductPriceTemplateExcel } = await import('../utils/exportProductPriceTemplateExcel');
        await exportProductPriceTemplateExcel(dataRows, headers, '상품가격일괄등록_템플릿.xlsx');
      } catch (error) {
        alert('템플릿 다운로드 중 오류가 발생했습니다.');
      }
    };

    // 파일 업로드 핸들러 (엑셀 파싱 및 미리보기)
    const handleFileUpload = async (file: File) => {
      try {
        const XLSX = await import('xlsx');
        const arrayBuffer = await file.arrayBuffer();
        const workbook = XLSX.read(arrayBuffer, { type: 'array' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '' });
        if (jsonData.length < 2) {
          alert('파일에 데이터가 없습니다.');
          return;
        }
        const headers = jsonData[0] as string[];
        const dataRows = jsonData.slice(1).filter(row => (row as any[])[0] && (row as any[])[0].toString().trim() !== '') as any[];
        // 필수 헤더 검증 (상품코드, 적용일자, 소비자단가 등)
        // '소비자단가*' 대신 '현재소비자가*'도 허용
        const requiredHeaders = ['상품코드*', '적용일자*', '소비자단가*'];
        const headerAliasMap: Record<string, string[]> = {
          '소비자단가*': ['소비자단가*', '현재소비자가*'],
          '소비자단가': ['소비자단가', '현재소비자가']
        };
        const missingHeaders = requiredHeaders.filter(required => {
          const aliases = headerAliasMap[required] || [required];
          return !headers.some(header => header && aliases.some(alias => header.toString().includes(alias.replace('*', ''))));
        });
        if (missingHeaders.length > 0) {
          let msg = `필수 헤더가 누락되었습니다:\n${missingHeaders.join(', ')}`;
          msg += `\n\n[업로드된 헤더]\n${headers.join(', ')}`;
          if (dataRows.length > 0) {
            msg += `\n\n[샘플 데이터]\n${JSON.stringify(dataRows[0])}`;
          }
          alert(msg);
          return;
        }
        // 데이터 변환 및 필수값 체크
        console.log('[엑셀 업로드] headers:', headers);
        const excelData: ExcelDataRow[] = dataRows.map((row, idx) => {
          const rowData: Record<string, any> = {};

          headers.forEach((header, colIdx) => {
            const cleanHeader = header.replace('*', '');
            let key = cleanHeader;
            // '현재소비자가'는 내부적으로 '소비자단가'로 매핑
            if (key === '현재소비자가') key = '소비자단가';
            if (key === '현재적용일자') key = '적용일자';
            rowData[key] = (row as any[])[colIdx] ?? '';
          });
          // 혹시라도 '현재소비자가'가 남아있으면 '소비자단가'로 복사
          if (!rowData['소비자단가'] && rowData['현재소비자가']) {
            rowData['소비자단가'] = rowData['현재소비자가'];
          }
          // 혹시라도 '현재적용일자'가 남아있으면 '적용일자'로 복사
          if (!rowData['적용일자'] && rowData['현재적용일자']) {
            rowData['적용일자'] = rowData['현재적용일자'];
          }
          delete rowData['현재소비자가'];
          delete rowData['현재적용일자'];

          // 디버깅: 매핑 결과 출력
          console.log(`[엑셀업로드][${idx + 2}행] 매핑결과:`, JSON.stringify(rowData));

          let hasError = false;
          let errorMessage = '';

          if (excelPreviewModal.type === 'productPrice') {
            const missing: string[] = [];
            if (!rowData['상품코드'] || rowData['상품코드'].toString().trim() === '') missing.push('상품코드');
            if (!rowData['적용일자'] || rowData['적용일자'].toString().trim() === '') missing.push('적용일자');
            if (
              rowData['소비자단가'] === undefined || rowData['소비자단가'] === null || rowData['소비자단가'].toString().trim() === ''
            ) missing.push('소비자단가');
            if (missing.length > 0) {
              hasError = true;
              errorMessage = `${missing.join(', ')} 필수`;
            } else {
              // 숫자형 체크
              const sobijaValue = rowData['소비자단가'];
              if (sobijaValue !== undefined && sobijaValue !== null && sobijaValue.toString().trim() !== '') {
                if (isNaN(Number(sobijaValue))) {
                  hasError = true;
                  errorMessage = '소비자단가는 숫자만 입력';
                } else if (Number(sobijaValue) < 0) {
                  hasError = true;
                  errorMessage = '소비자단가는 0 이상이어야 함';
                }
              }
              // 날짜형 체크 (YYYYMMDD 또는 YYYY-MM-DD)
              const openD = rowData['적용일자']?.toString();
              if (openD && !/^\d{8}$|^\d{4}-\d{2}-\d{2}$/.test(openD)) {
                hasError = true;
                errorMessage = '적용일자는 YYYYMMDD 또는 YYYY-MM-DD 형식';
              }
            }
          } else {
            // 기존(상품등록 등) 검증 로직 유지
            const sobijaDan = rowData['소비자단가'];
            if (!rowData['상품코드'] || !rowData['적용일자'] || !sobijaDan) {
              hasError = true;
              errorMessage = '상품코드, 적용일자, 소비자단가 필수';
            }
          }

          // 디버깅: 오류 체크 결과 출력
          if (hasError) {
            console.warn(`[엑셀업로드][${idx + 2}행] 오류: ${errorMessage}`);
          } else {
            console.log(`[엑셀업로드][${idx + 2}행] 정상`);
          }

          return {
            ...rowData,
            rowIndex: idx + 2,
            hasError,
            errorMessage,
            isDuplicate: false,
            duplicateInfo: '',
            isSelected: !hasError
          } as ExcelDataRow;
        });
        setBatchUploadModal({ isOpen: false });
        setExcelPreviewModal({ isOpen: true, data: excelData, type: 'productPrice' });
      } catch (error) {
        alert('엑셀 파일 처리 중 오류가 발생했습니다.');
      }
    };

    // 미리보기 저장 핸들러 (서버 일괄등록 API 호출)
    const handleExcelPreviewSave = async (selectedRows: ExcelDataRow[]) => {
      try {
        // 단건 저장 API를 여러 번 호출 (실제 대량 저장 API가 필요하다면 백엔드 확장 필요)
        // 세션에서 userId, agentId 추출 (공통 함수 사용)

        const agentId = getLoginAgentId();
        const userId = getLoginUserId();

        const payloads = selectedRows.map(row => {
          const r = row as Record<string, any>;
          // 적용일자 변환: yyyymmdd -> yyyy-mm-dd
          let openD = r['적용일자'];
          if (/^\d{8}$/.test(openD)) {
            openD = `${openD.slice(0,4)}-${openD.slice(4,6)}-${openD.slice(6,8)}`;
          }
          let closeD = r['종료일자'] || '';
          if (closeD && /^\d{8}$/.test(closeD)) {
            closeD = `${closeD.slice(0,4)}-${closeD.slice(4,6)}-${closeD.slice(6,8)}`;
          }
          return {
            goodsId: r['상품코드'],
            openD,
            closeD,
            sobijaDan: r['소비자단가'],
            memo: r['적요'] || '',
            userId,
            searchAgentId: agentId
          };
        });
        let successCount = 0;
        let failCount = 0;
        let errors: string[] = [];
        for (const payload of payloads) {
          try {
            // 서비스 함수 사용 (POST /api/product-prices/save)
            await import('../services/productPriceService').then(m => m.saveProductPrice(payload));
            successCount++;
          } catch (err: any) {
            failCount++;
            errors.push(err?.message || '저장 실패');
          }
        }
        setExcelPreviewModal({ isOpen: false, data: [] });
        const uploadResult: ExcelUploadResult = {
          success: failCount === 0,
          successCount,
          failCount,
          totalCount: selectedRows.length,
          errors,
          message: failCount === 0 ? `총 ${selectedRows.length}개 중 ${successCount}개 성공` : `${failCount}개 실패`
        };
        setUploadResultModal({ isOpen: true, result: uploadResult });
        if (successCount > 0) {
          handleSearch();
        }
      } catch (error) {
        setExcelPreviewModal({ isOpen: false, data: [] });
        setUploadResultModal({
          isOpen: true,
          result: {
            success: false,
            successCount: 0,
            failCount: selectedRows.length,
            totalCount: selectedRows.length,
            errors: [error instanceof Error ? error.message : '알 수 없는 오류'],
            message: '네트워크 오류 또는 서버 오류'
          }
        });
      }
    };

    const handleExcelPreviewCancel = () => {
      setExcelPreviewModal({ isOpen: false, data: [] });
    };
  // 날짜 범위 기본값 설정 (최근 30일)
  const getDefaultDateRange = () => {
    const today = new Date();
    const thirtyDaysAgo = new Date(today);
    thirtyDaysAgo.setDate(today.getDate() - 30);
    
    return {
      from: thirtyDaysAgo.toISOString().split('T')[0],
      to: today.toISOString().split('T')[0]
    };
  };

  const defaultDateRange = getDefaultDateRange();
  // 검색 조건 상태 (초기 적용일자 빈값)
  const [searchCondition, setSearchCondition] = useState<SearchCondition>({
    brandIds: [],
    btypeGbns: [],
    mtypeGbns: [],
    stypeGbns: [],
    goodsNm: '',
    openDateFrom: '',
    openDateTo: ''
  });
  // 현재 활성 탭 정보 가져오기
  const { tabs, activeTabId } = useSelector((state: RootState) => state.tabs);
  const currentTab = tabs.find(tab => tab.id === activeTabId);

  // 그리드 데이터 상태
  const [priceData, setPriceData] = useState<ProductPriceData[]>([]);
  
  // 선택된 상품가격 정보
  const [selectedPrice, setSelectedPrice] = useState<ProductPriceData | null>(null);
  // 상품코드+적용일자 조합이 존재하면 편집금지(상품코드, 검색버튼, 적용일자)
  const [isLockedFields, setIsLockedFields] = useState<boolean>(false);
  
  // 신규 등록 모달 오픈 상태
  const [showPriceModal, setShowPriceModal] = useState(false);

  // 검색조건 초기화 핸들러
  const handleReset = () => {
    setSearchCondition({
      brandIds: [],
      btypeGbns: [],
      mtypeGbns: [],
      stypeGbns: [],
      goodsNm: '',
      openDateFrom: '',
      openDateTo: ''
    });
    setSelectedPrice(null);
    setIsLockedFields(false);
  };
  
  // 전역 로딩 컨텍스트 사용
  const { startLoading, stopLoading } = useGlobalLoading();

  // AG Grid 참조
  const gridRef = useRef<AgGridReact>(null);

  // AG Grid API 상태
  const [, setGridApi] = useState<any>(null);

  // 컬럼 정의 - TB_ZA_GOODSPRICE 기준 (상품등록과 동일한 스타일)
  const columnDefs: any[] = [

    
    { headerName: '브랜드명', field: 'BRAND_GBN_NM', flex: 1.1, minWidth: 120, maxWidth: 180 },
    { headerName: '상품명', field: 'GOODS_NM', flex: 2, minWidth: 140, maxWidth: 220 },
    { headerName: '적용일자', field: 'OPEN_D', flex: 1, minWidth: 90, maxWidth: 120 },
    { headerName: '종료일자', field: 'CLOSE_D', flex: 1, minWidth: 90, maxWidth: 120 },
    {
      headerName: '소비자단가',
      field: 'SOBIJA_DAN',
      flex: 1,
      minWidth: 110,
      maxWidth: 140,
      valueFormatter: (params: any) =>
        params.value !== undefined && params.value !== null && params.value !== ''
          ? params.value.toLocaleString()
          : '',
      cellStyle: { textAlign: 'right', fontVariantNumeric: 'tabular-nums' }
    },
    { headerName: '적요', field: 'MEMO', flex: 2, minWidth: 120, maxWidth: 200 },
    { headerName: '상품코드', field: 'GOODS_ID', flex: 1, minWidth: 90, maxWidth: 120 }
  ];

  // AG Grid 준비 완료 이벤트
  const onGridReady = useCallback((params: any) => {
    setGridApi(params.api);
    console.log('✅ AG Grid 준비 완료');
  }, []);

  // 그리드 행 클릭 이벤트 (상품등록과 동일)
  const onRowClicked = useCallback((event: any) => {
    if (event.data) {
      setSelectedPrice(event.data);
      // setIsNewMode(false); // 제거됨
    }
  }, []);

  // 검색 조건 변경 핸들러
  const handleSearchConditionChange = (field: keyof SearchCondition, value: string | string[]) => {
    setSearchCondition(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // 조회 버튼 클릭 핸들러 (API 연동)
  const handleSearch = async () => {
    try {
      startLoading('조회 중...');
      // 로그인 유저의 agentId 추출 함수 (중복 방지)
      const getLoginAgentId = () => {
        try {
          const userStr = sessionStorage.getItem('user');
          if (userStr) {
            const userObj = JSON.parse(userStr);
            return userObj.agentId || userObj.AGENT_ID || '';
          }
        } catch {}
        return '';
      };
      const agentId = getLoginAgentId();
      // API 호출하여 데이터 조회 (mode, searchAgentId 명시)
      const params = {
        brandIds: searchCondition.brandIds,
        btypeGbns: searchCondition.btypeGbns,
        mtypeGbns: searchCondition.mtypeGbns,
        stypeGbns: searchCondition.stypeGbns,
        goodsNm: searchCondition.goodsNm,
        openDateFrom: searchCondition.openDateFrom,
        openDateTo: searchCondition.openDateTo,
        mode: 'SEARCH',
        searchAgentId: agentId
      };
      const data = await import('../services/productPriceService').then(m => m.searchProductPrices(params));
      // Ensure all fields are defined as required by ProductPriceData
      const normalizedData: ProductPriceData[] = data.map((item: any) => ({
        GOODS_ID: item.GOODS_ID ?? '',
        GOODS_NM: item.GOODS_NM ?? '',
        BRAND_ID: item.BRAND_ID ?? '',
        BRAND_GBN_NM: item.BRAND_GBN_NM ?? '',
        BTYPE_GBN: item.BTYPE_GBN ?? '',
        MTYPE_GBN: item.MTYPE_GBN ?? '',
        STYPE_GBN: item.STYPE_GBN ?? '',
        OPEN_D: item.OPEN_D ?? '',
        CLOSE_D: item.CLOSE_D ?? '',
        SOBIJA_DAN: item.SOBIJA_DAN ?? 0,
        MEMO: item.MEMO ?? '',
        USER_ID: item.USER_ID ?? '',
        SYS_TIME: item.SYS_TIME ?? '',
        UPD_USER: item.UPD_USER ?? '',
        UPD_TIME: item.UPD_TIME ?? ''
      }));
      setPriceData(normalizedData);
    } catch (error) {
      console.error('❌ 조회 중 오류:', error);
      alert('조회 중 오류가 발생했습니다.');
    } finally {
      stopLoading();
    }
  };

  // 신규등록 버튼 클릭 시 모달 오픈
  const handleNew = () => {
    setShowPriceModal(true);
  };

  // 모달 저장 핸들러 (data: GoodsItem[])
  // 상품가격 신규등록 모달 저장 핸들러 (data: GoodsItem[])
  const handleModalSave = async (changedRows: any[]) => {
    if (!changedRows || changedRows.length === 0) {
      setShowPriceModal(false);
      return;
    }
    try {
      startLoading('저장 중...');
      // 세션에서 userId, agentId 추출 (공통 함수 사용)
      const agentId = getLoginAgentId();
      const userId = getLoginUserId();
      let hasError = false;
      for (const row of changedRows) {
        // 변환: GoodsItem → ProductPriceData (백엔드가 기대하는 camelCase로 변환)
        const payload = {
          goodsId: String(row.GOODS_ID),
          openD: row.newStartDate,
          closeD: row.newEndDate || '',
          sobijaDan: row.newPrice,
          memo: row.remark ?? '', // 'remark'를 'MEMO'로 매핑
          userId,
          searchAgentId: agentId
        };
        try {
          await import('../services/productPriceService').then(m => m.saveProductPrice(payload));
        } catch (e) {
          hasError = true;
          console.error('❌ 저장 실패:', e);
        }
      }
      setShowPriceModal(false);
      await handleSearch();
      if (hasError) {
        setModal({ open: true, type: 'custom', message: '일부 행 저장에 실패했습니다.' });
      } else {
        setModal({ open: true, type: 'save', message: '저장되었습니다.' });
      }
    } catch (error) {
      alert('저장 중 오류가 발생했습니다.');
    } finally {
      stopLoading();
    }
  };

  // 모달 닫기 핸들러
  const handleModalClose = () => {
    setShowPriceModal(false);
  };

  // 저장 버튼 클릭 핸들러 (API 연동)
  // 저장/수정 버튼 클릭 시(1단계: diff 추출 후 확인 모달)
  const handleSaveClick = () => {
    if (!selectedPrice) {
      alert('저장할 데이터가 없습니다.');
      return;
    }
    // 유효성 검사
    if (!selectedPrice.GOODS_ID) {
      alert('상품코드를 입력해주세요.');
      return;
    }
    if (!selectedPrice.OPEN_D) {
      alert('적용일자를 입력해주세요.');
      return;
    }
    if (!selectedPrice.SOBIJA_DAN) {
      alert('소비자단가를 입력해주세요.');
      return;
    }
    // 변경 필드 diff 추출
    const toDashDate = (str: string) => {
      if (!str) return '';
      if (str.length === 10 && str[4] === '-' && str[7] === '-') return str;
      if (str.length === 8) return `${str.substring(0, 4)}-${str.substring(4, 6)}-${str.substring(6, 8)}`;
      return str;
    };
    let changedFields: Array<{ field: string; name: string; oldValue: any; newValue: any }> = [];
    const prev = priceData.find(
      d => d.GOODS_ID === selectedPrice.GOODS_ID &&
        (d.OPEN_D === selectedPrice.OPEN_D || toDashDate(d.OPEN_D) === toDashDate(selectedPrice.OPEN_D))
    );
    if (prev) {
      if ((prev.CLOSE_D || '') !== toDashDate(selectedPrice.CLOSE_D || '')) {
        changedFields.push({ field: 'CLOSE_D', name: '종료일자', oldValue: prev.CLOSE_D || '', newValue: toDashDate(selectedPrice.CLOSE_D || '') });
      }
      if (Number(prev.SOBIJA_DAN) !== Number(selectedPrice.SOBIJA_DAN)) {
        changedFields.push({ field: 'SOBIJA_DAN', name: '소비자단가', oldValue: prev.SOBIJA_DAN, newValue: selectedPrice.SOBIJA_DAN });
      }
      if ((prev.MEMO || '') !== (selectedPrice.MEMO || '')) {
        changedFields.push({ field: 'MEMO', name: '적요', oldValue: prev.MEMO || '', newValue: selectedPrice.MEMO || '' });
      }
    } else {
      changedFields = [
        { field: 'CLOSE_D', name: '종료일자', oldValue: '', newValue: toDashDate(selectedPrice.CLOSE_D || '') },
        { field: 'SOBIJA_DAN', name: '소비자단가', oldValue: '', newValue: selectedPrice.SOBIJA_DAN },
        { field: 'MEMO', name: '적요', oldValue: '', newValue: selectedPrice.MEMO || '' }
      ];
    }
    setConfirm({ open: true, type: 'save' });
  };

  // 실제 저장 실행(2단계)
  const handleSave = async () => {
    if (!selectedPrice) {
      alert('저장할 데이터가 없습니다.');
      return;
    }

    // 유효성 검사
    if (!selectedPrice.GOODS_ID) {
      alert('상품코드를 입력해주세요.');
      return;
    }
    if (!selectedPrice.OPEN_D) {
      alert('적용일자를 입력해주세요.');
      return;
    }
    if (!selectedPrice.SOBIJA_DAN) {
      alert('소비자단가를 입력해주세요.');
      return;
    }

    try {
      startLoading('저장 중...');
      // API 호출하여 데이터 저장/수정 (INSERT_OR_UPDATE)
      const agentId = getLoginAgentId();
      const userId = getLoginUserId();
      // 날짜를 yyyy-mm-dd 형태로 변환
      const toDashDate = (str: string) => {
        if (!str) return '';
        if (str.length === 10 && str[4] === '-' && str[7] === '-') return str;
        if (str.length === 8) return `${str.substring(0, 4)}-${str.substring(4, 6)}-${str.substring(6, 8)}`;
        return str;
      };
      // 변경 필드 추출: 기존 데이터와 비교
      let changedFields: Array<{ field: string; name: string; oldValue: any; newValue: any }> = [];
      let isUpdate = false;
      let prev = null;
      if (selectedPrice) {
        prev = priceData.find(
          d => d.GOODS_ID === selectedPrice.GOODS_ID &&
            (d.OPEN_D === selectedPrice.OPEN_D || toDashDate(d.OPEN_D) === toDashDate(selectedPrice.OPEN_D))
        );
        if (prev) {
          isUpdate = true;
          if ((prev.CLOSE_D || '') !== toDashDate(selectedPrice.CLOSE_D || '')) {
            changedFields.push({ field: 'CLOSE_D', name: '종료일자', oldValue: prev.CLOSE_D || '', newValue: toDashDate(selectedPrice.CLOSE_D || '') });
          }
          if (Number(prev.SOBIJA_DAN) !== Number(selectedPrice.SOBIJA_DAN)) {
            changedFields.push({ field: 'SOBIJA_DAN', name: '소비자단가', oldValue: prev.SOBIJA_DAN, newValue: selectedPrice.SOBIJA_DAN });
          }
          if ((prev.MEMO || '') !== (selectedPrice.MEMO || '')) {
            changedFields.push({ field: 'MEMO', name: '적요', oldValue: prev.MEMO || '', newValue: selectedPrice.MEMO || '' });
          }
        } else {
          changedFields = [
            { field: 'CLOSE_D', name: '종료일자', oldValue: '', newValue: toDashDate(selectedPrice.CLOSE_D || '') },
            { field: 'SOBIJA_DAN', name: '소비자단가', oldValue: '', newValue: selectedPrice.SOBIJA_DAN },
            { field: 'MEMO', name: '적요', oldValue: '', newValue: selectedPrice.MEMO || '' }
          ];
        }
      }
      const payload = {
        goodsId: selectedPrice.GOODS_ID,
        openD: toDashDate(selectedPrice.OPEN_D),
        closeD: toDashDate(selectedPrice.CLOSE_D || ''),
        sobijaDan: selectedPrice.SOBIJA_DAN,
        memo: selectedPrice.MEMO,
        userId: userId,
        searchAgentId: agentId
      };
      await import('../services/productPriceService').then(m => m.saveProductPrice(payload));
      setModal({
        open: true,
        type: isUpdate ? 'update' : 'save',
        message: isUpdate
          ? (changedFields.length > 0 ? '상품이 수정되었습니다.' : '상품 정보가 업데이트되었습니다.')
          : '상품이 등록되었습니다.',
        details: isUpdate
          ? (changedFields.length > 0 ? `${changedFields.length}개 항목이 변경되었습니다.` : undefined)
          : undefined,
        changedFields: isUpdate ? changedFields : undefined
      });
      setConfirm({ open: false, type: 'save' });
      // 조회 새로고침
      await handleSearch();
    } catch (error) {
      console.error('❌ 저장 중 오류:', error);
      alert('저장 중 오류가 발생했습니다.');
    } finally {
      stopLoading();
    }
  };

  // 삭제 버튼 클릭 핸들러 (API 연동)
  // 삭제 버튼 클릭 시(1단계: 확인 모달)
  const handleDeleteClick = () => {
    if (!selectedPrice) {
      alert('삭제할 데이터를 선택해주세요.');
      return;
    }
    setConfirm({ open: true, type: 'delete' });
  };

  // 실제 삭제 실행(2단계)
  const handleDelete = async () => {
    if (!selectedPrice) {
      alert('삭제할 데이터를 선택해주세요.');
      return;
    }
    try {
      startLoading('삭제 중...');
      // API 호출하여 데이터 삭제
      await import('../services/productPriceService').then(m => m.deleteProductPrice(selectedPrice.GOODS_ID, selectedPrice.OPEN_D));
      setModal({ open: true, type: 'delete', message: '삭제되었습니다.' });
      setConfirm({ open: false, type: 'delete' });
      // 조회 새로고침
      await handleSearch();
      setSelectedPrice(null);
      setIsLockedFields(false);
      // setIsNewMode(false); // 제거됨
    } catch (error) {
      console.error('❌ 삭제 중 오류:', error);
      alert('삭제 중 오류가 발생했습니다.');
    } finally {
      stopLoading();
    }
  };

  // 상세 정보 변경 핸들러
  const handleDetailChange = (field: keyof ProductPriceData, value: any) => {
    setSelectedPrice(prev => {
      if (!prev) {
        // selectedPrice가 아직 없을 때 최소한의 필수 필드로 생성
        const base: ProductPriceData = {
          GOODS_ID: '',
          GOODS_NM: '',
          BRAND_ID: '',
          BRAND_GBN_NM: '',
          BTYPE_GBN: '',
          MTYPE_GBN: '',
          STYPE_GBN: '',
          OPEN_D: '',
          CLOSE_D: '',
          SOBIJA_DAN: 0,
          MEMO: '',
          USER_ID: '',
          SYS_TIME: '',
          UPD_USER: '',
          UPD_TIME: ''
        };
        return { ...base, [field]: value };
      }
      return {
        ...prev,
        [field]: value
      };
    });
  };

  // 날짜 포맷 변환 (YYYY-MM-DD -> YYYYMMDD)
  const formatDateToString = (dateStr: string): string => {
    if (!dateStr) return '';
    return dateStr.replace(/-/g, '');
  };

  // 날짜 포맷 변환 (YYYYMMDD -> YYYY-MM-DD), 이미 YYYY-MM-DD면 그대로 반환
  const formatStringToDate = (str: string): string => {
    if (!str) return '';
    if (str.length === 10 && str[4] === '-' && str[7] === '-') return str;
    if (str.length === 8) return `${str.substring(0, 4)}-${str.substring(4, 6)}-${str.substring(6, 8)}`;
    return '';
  };

  // 컴포넌트 마운트 시 초기화
  useEffect(() => {
    console.log('📦 ProductPriceRegistration 컴포넌트 마운트');
  }, []);

  // selectedPrice의 GOODS_ID와 OPEN_D가 모두 있을 때 중복체크 호출
  useEffect(() => {
    const gid = selectedPrice?.GOODS_ID;
    const openDraw = selectedPrice?.OPEN_D;
    // OPEN_D는 내부적으로 YYYYMMDD 또는 YYYY-MM-DD로 관리될 수 있으므로
    // 백엔드로는 YYYY-MM-DD 형식으로 전달
    const openD = openDraw ? formatStringToDate(openDraw) : '';
    if (!gid || !openD) {
      setIsLockedFields(false);
      return;
    }

    let cancelled = false;
    const doCheck = async () => {
      try {
        startLoading('중복체크 중...');
        const svc = await import('../services/productPriceService');
        console.log('[DUPL_CHECK] 요청 payload:', { goodsId: gid, openD });
        const rows = await svc.duplCheckProductPrice(gid, openD);
        console.log('[DUPL_CHECK] 응답 rows:', rows);
        if (cancelled) return;
        if (rows && rows.length > 0) {
          const row = rows[0];
          const normalized: ProductPriceData = {
            GOODS_ID: (row.GOODS_ID ?? gid) as string,
            GOODS_NM: (row.GOODS_NM ?? selectedPrice?.GOODS_NM ?? '') as string,
            BRAND_ID: (row.BRAND_ID ?? '') as string,
            BRAND_GBN_NM: (row.BRAND_GBN_NM ?? '') as string,
            BTYPE_GBN: (row.BTYPE_GBN ?? '') as string,
            MTYPE_GBN: (row.MTYPE_GBN ?? '') as string,
            STYPE_GBN: (row.STYPE_GBN ?? '') as string,
            OPEN_D: (row.OPEN_D ?? openD) as string,
            CLOSE_D: (row.CLOSE_D ?? '') as string,
            SOBIJA_DAN: (row.SOBIJA_DAN ?? 0) as number,
            MEMO: (row.MEMO ?? '') as string,
            USER_ID: (row.USER_ID ?? '') as string,
            SYS_TIME: (row.SYS_TIME ?? '') as string,
            UPD_USER: (row.UPD_USER ?? '') as string,
            UPD_TIME: (row.UPD_TIME ?? '') as string
          };
          // selectedPrice를 덮어쓰되, 실제 값이 변경될 때만 set
          const before = selectedPrice ? JSON.stringify(selectedPrice) : '';
          const after = JSON.stringify(normalized);
          if (before !== after) setSelectedPrice(normalized);
          setIsLockedFields(true);
        } else {
          console.log('[DUPL_CHECK] 동일 레코드 없음 - 편집 가능');
          setIsLockedFields(false);
        }
      } catch (error) {
        console.error('중복체크 오류', error);
        setIsLockedFields(false);
      } finally {
        stopLoading();
      }
    };
    doCheck();
    return () => {
      cancelled = true;
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedPrice?.GOODS_ID, selectedPrice?.OPEN_D]);

  return (
    <div className="price-registration">
      {/* 전역 ModernLoader가 App에서 자동 처리됨 */}
      
      {/* TOP 섹션 - 검색 조건 및 버튼 */}
      <div className="price-top-section">
        <h1 className="price-page-title">
          {currentTab?.menuIcon ? (
            React.createElement(getMenuIcon(currentTab.menuIcon), { size: 16 })
          ) : (
            <i className="fas fa-tag"></i>
          )}
          {currentTab?.title || '상품 소비자가(매가) 관리'}
        </h1>

        {/* 검색 조건 */}
        <div className="price-search-conditions">
          <div className="price-search-row">
            <div className="price-search-item">
              <label>브랜드</label>
              <CommonMultiSelect
                commonCodeType="brands"
                selectedValues={searchCondition.brandIds}
                onSelectionChange={(values: string[]) => handleSearchConditionChange('brandIds', values)}
                placeholder="브랜드 선택"
              />
            </div>
            <div className="price-search-item">
              <label>대분류</label>
              <CommonMultiSelect
                commonCodeType="btypes"
                selectedValues={searchCondition.btypeGbns}
                onSelectionChange={(values: string[]) => handleSearchConditionChange('btypeGbns', values)}
                placeholder="대분류 선택"
              />
            </div>
            <div className="price-search-item">
              <label>중분류</label>
              <CommonMultiSelect
                commonCodeType="mtypes"
                selectedValues={searchCondition.mtypeGbns}
                onSelectionChange={(values: string[]) => handleSearchConditionChange('mtypeGbns', values)}
                placeholder="중분류 선택"
              />
            </div>
            <div className="price-search-item">
              <label>소분류</label>
              <CommonMultiSelect
                commonCodeType="stypes"
                selectedValues={searchCondition.stypeGbns}
                onSelectionChange={(values: string[]) => handleSearchConditionChange('stypeGbns', values)}
                placeholder="소분류 선택"
              />
            </div>
          </div>
          <div className="price-search-row">
            <div className="price-search-item">
              <label>상품명</label>
              <input
                type="text"
                placeholder="상품명"
                value={searchCondition.goodsNm}
                onChange={(e) => handleSearchConditionChange('goodsNm', e.target.value)}
              />
            </div>
            <div className="price-search-item">
              <label>적용일자</label>
              <DateRangePicker
                startDate={searchCondition.openDateFrom}
                endDate={searchCondition.openDateTo}
                onStartDateChange={(date: string) => handleSearchConditionChange('openDateFrom', date)}
                onEndDateChange={(date: string) => handleSearchConditionChange('openDateTo', date)}
              />
            </div>
          </div>
        </div>

        {/* 액션 버튼 - 상품등록과 동일한 구조 */}
        <div className="price-action-buttons">
          <div className="price-left-buttons">
            <button className="price-btn-delete" onClick={handleDeleteClick}>
              <i className="fas fa-trash"></i> 삭제
            </button>
          </div>
          <div className="price-right-buttons">
            <button className="price-btn-insert" onClick={handleNew}>
              <i className="fas fa-plus-circle"></i> 신규등록
            </button>
            <button className="price-btn-new" onClick={handleReset}>
              <i className="fas fa-undo"></i> 초기화
            </button>
            <button className="price-btn-search" onClick={handleSearch}>
              <i className="fas fa-search"></i> 조회
            </button>
          </div>
        </div>
      </div>

      {/* MAIN 섹션 - LEFT(그리드) + RIGHT(상세정보) */}
      <div className="price-main-section">
        {/* LEFT 섹션 - 상품 가격 목록 그리드 */}
        <div className="price-left-section">
          <h3>
            <i className="fas fa-list"></i>
            상품 가격 목록
          </h3>
          
          <div className="price-grid-container">
            <div className="ag-theme-alpine">
              <AgGridReact
                ref={gridRef}
                columnDefs={columnDefs}
                rowData={priceData}
                onGridReady={onGridReady}
                onRowClicked={onRowClicked}
                pagination={true}
                paginationPageSize={50}
                animateRows={false}
                suppressMovableColumns={true}
                headerHeight={34}
                rowHeight={26}
                suppressHorizontalScroll={false}
                noRowsOverlayComponent={() => (
                  <div className="ag-overlay-no-rows-center">
                    <div>조회된 데이터가 없습니다</div>
                  </div>
                )}
              />
            </div>
          </div>

          {/* 그리드 하단 상태 정보 */}
          <div className="price-grid-status-info">
            <span>총 <strong>{priceData.length}</strong>건</span>
            {selectedPrice && (
              <span>선택: <strong>1</strong>건</span>
            )}
          </div>
        </div>

        {/* RIGHT 섹션 - 상품 가격 상세 정보 */}
        <div className="price-right-section">
          <h3>
            <i className="fas fa-info-circle"></i>
            상품 가격 상세정보
          </h3>

          <div className="price-product-detail">
            {/* 기본 정보 섹션 */}
            <div className="price-detail-section">
              <h4>기본 정보</h4>
              

              <div className="price-form-row">
                <div className="price-form-item price-required" 
                style={{ display: 'flex'
                        //,alignItems: 'center'
                        ,gap: 0 }}>
                  <label style={{ marginRight: 0 }}>
                    상품코드
                    <span className="price-required-mark">*</span>
                  </label>
                  <div style={{ display: 'flex', 
                    // alignItems: 'center', 
                    marginLeft: 1, 
                    //width: 370 
                    }}>
                     <input
                       type="text"
                       placeholder="상품코드 입력"
                       value={selectedPrice?.GOODS_ID || ''}
                       onChange={(e) => handleDetailChange('GOODS_ID', e.target.value.toUpperCase())}
                       disabled={isLockedFields}
                       required
                       style={{ height: 28, flex: 37, minWidth: 0, borderTopRightRadius: 0, borderBottomRightRadius: 0, width: 0 }}
                     />
                     <button
                       type="button"
                       className="price-btn-search-product"
                       style={{
                         height: 28,
                         flex: 1,
                         minWidth: 0,
                         maxWidth: 40,
                         padding: '0 6px',
                         fontSize: 13,
                         borderTopLeftRadius: 0,
                         borderBottomLeftRadius: 0,
                         borderLeft: '1px solid #d9d9d9',
                         background: '#f7f7f7',
                         display: 'flex',
                         alignItems: 'center',
                         justifyContent: 'center',
                         whiteSpace: 'nowrap',
                         fontWeight: 500
                       }}
                       onClick={() => setProductSearchPopupOpen(true)}
                       disabled={isLockedFields}
                     >
                       <i className="fas fa-search" style={{ marginRight: 0 }}></i>
                     </button>
                        {/* 상품검색 팝업 */}
                        <ProductSearchPopup
                          visible={productSearchPopupOpen}
                          onClose={() => setProductSearchPopupOpen(false)}
                          onSelect={handleProductSelect}
                        />
                  </div>
                </div>
                <div className="price-form-item">
                  <label>상품명</label>
                  <input
                    type="text"
                    value={selectedPrice?.GOODS_NM || ''}
                    readOnly
                    placeholder="상품명 자동입력"
                  />
                </div>
              </div>

              <div className="price-form-row">
                <div className="price-form-item price-required">
                  <label>
                    적용일자
                    <span className="price-required-mark">*</span>
                  </label>
                  <input
                    type="date"
                    value={formatStringToDate(selectedPrice?.OPEN_D || '')}
                    onChange={(e) => handleDetailChange('OPEN_D', formatDateToString(e.target.value))}
                    disabled={isLockedFields}
                    required
                  />
                </div>
                <div className="price-form-item">
                  <label>종료일자</label>
                  <input
                    type="date"
                    value={formatStringToDate(selectedPrice?.CLOSE_D || '')}
                    onChange={(e) => handleDetailChange('CLOSE_D', formatDateToString(e.target.value))}
                  />
                </div>                
              </div>

              <div className="price-form-row">
                <div className="price-form-item price-required">
                  <label>
                    소비자단가
                    <span className="price-required-mark">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="0"
                    style={{ textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}
                    value={
                      selectedPrice?.SOBIJA_DAN !== undefined && selectedPrice?.SOBIJA_DAN !== null
                        ? selectedPrice.SOBIJA_DAN.toLocaleString()
                        : ''
                    }
                    onChange={e => {
                      
                      // 숫자만 추출 후 저장
                      const raw = e.target.value.replace(/[^\d]/g, '');
                      handleDetailChange('SOBIJA_DAN', raw ? Number(raw) : '');
                    }}
                    min="0"
                    inputMode="numeric"
                  />
                </div>
              </div>

              <div className="price-form-row">
                <div className="price-form-item price-full-width">
                  <label>적요</label>
                  <textarea
                    placeholder="적요 입력"
                    value={selectedPrice?.MEMO || ''}
                    onChange={(e) => handleDetailChange('MEMO', e.target.value)}
                    rows={3}
                  />
                </div>
              </div>
            </div>

            {/* 시스템 정보 섹션 */}
            {selectedPrice && (
              <div className="price-detail-section">
                <h4>시스템 정보</h4>
                
                <div className="price-form-row">
                  <div className="price-form-item">
                    <label>등록유저</label>
                    <input
                      type="text"
                      value={selectedPrice?.USER_ID || ''}
                      readOnly
                    />
                  </div>
                  <div className="price-form-item">
                    <label>등록일시</label>
                    <input
                      type="text"
                      value={selectedPrice?.SYS_TIME || ''}
                      readOnly
                    />
                  </div>
                </div>

                <div className="price-form-row">
                  <div className="price-form-item">
                    <label>수정유저</label>
                    <input
                      type="text"
                      value={selectedPrice?.UPD_USER || ''}
                      readOnly
                    />
                  </div>
                  <div className="price-form-item">
                    <label>수정일시</label>
                    <input
                      type="text"
                      value={selectedPrice?.UPD_TIME || ''}
                      readOnly
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* 하단 버튼 - 상품등록과 동일한 구조 */}
          <div className="price-detail-bottom-buttons">
            <div className="price-left-buttons">
              <button className="price-btn-help">
                <i className="fas fa-question-circle"></i> 도움말
              </button>
              <button className="price-btn-batch" onClick={() => setBatchUploadModal({ isOpen: true })}>
                <i className="fas fa-upload"></i> 일괄등록
              </button>
            </div>
            <div className="price-right-buttons">
              <button className="price-btn-save" onClick={handleSaveClick}>
                <i className="fas fa-save"></i> 저장
              </button>
                  {/* 저장/삭제 전 확인 모달 - 버튼 바깥, 최상위에 위치 */}
                  <ConfirmationModal
                    isOpen={confirm.open}
                    onConfirm={confirm.type === 'save' ? handleSave : handleDelete}
                    onCancel={() => setConfirm({ open: false, type: confirm.type })}
                    type={confirm.type}
                    title={confirm.type === 'save' ? '저장 확인' : '삭제 확인'}
                    message={confirm.type === 'save' ? '저장하시겠습니까?' : '삭제하시겠습니까?'}
                    itemName="상품가격 정보"
                  />
            </div>
          </div>
        </div>
      </div>

      {/* 상품가격 신규등록 모달 */}
      <ProductPriceModal
        open={showPriceModal}
        onClose={handleModalClose}
        onSave={handleModalSave}
        searchCondition={searchCondition}
      />

      {/* 일괄등록 모달 */}
      <BatchUploadModal
        isOpen={batchUploadModal.isOpen}
        onClose={() => setBatchUploadModal({ isOpen: false })}
        onTemplateDownload={handleTemplateDownload}
        onFileUpload={handleFileUpload}
        title="상품가격 일괄등록"
      />

      {/* 엑셀 미리보기 모달 */}
      <ExcelPreviewModal
        isOpen={excelPreviewModal.isOpen}
        data={excelPreviewModal.data}
        type={excelPreviewModal.type}
        onSave={handleExcelPreviewSave}
        onClose={handleExcelPreviewCancel}
        onCancel={handleExcelPreviewCancel}
      />

      {/* 엑셀 업로드 결과 모달 */}
      <ExcelUploadResultModal
        isOpen={uploadResultModal.isOpen}
        onClose={() => setUploadResultModal({ isOpen: false, result: null })}
        result={uploadResultModal.result}
      />

      {/* 공통 안내 모달 */}
      <SuccessModal
        isOpen={modal.open}
        onClose={() => setModal({ ...modal, open: false, changedFields: undefined })}
        type={modal.type}
        message={modal.message}
        changedFields={modal.changedFields}
      />
    </div>
  );
});

ProductPriceRegistration.displayName = 'ProductPriceRegistration';

export default ProductPriceRegistration;

