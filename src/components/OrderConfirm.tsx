import React, { useEffect, useState, useCallback, useRef, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { AgGridReact } from 'ag-grid-react';
import 'ag-grid-community/styles/ag-theme-alpine.css';
import DateRangePicker from './common/DateRangePicker';
import CommonMultiSelect from './CommonMultiSelect';
import { getMenuIcon } from '../utils/menuUtils';
import { RootState, AppDispatch } from '../store/store';
import { commonCodeService, CommonCodeOption } from '../services/commonCodeService';
import './OrderConfirm.css';
import ConfirmationModal from './common/ConfirmationModal';
import OutboundSendModal from './common/OutboundSendModal';
import CancelShipmentModal from './common/CancelShipmentModal.tsx';
import PartialConfirmModal from './common/PartialConfirmModal.tsx';
import {
  searchOrderConfirm,
  getOrderConfirmDetails,
  confirmOrderShipment,
  cancelOrderShipment,
  OrderSummary
} from '../services/orderConfirmService';
import {
  setSearchCondition as setSearchConditionAction,
  setOrderSummaries,
  setSelectedSummary,
  updateSelectedSummary,
  setOrderLines,
  setOriginalOrderLines,
  updateOrderLine,
  updateOrderLinesField,
  resetSelection,
  initializeScreen
} from '../store/orderConfirmSlice';
import type { OrderData, SearchCondition, ShipmentField } from '../types/orderConfirm';
import { createDefaultSearchCondition } from '../types/orderConfirm';

// 출고 상태 옵션
const OUT_STATUS_OPTIONS = [
  { value: 'ALL', label: '전체' },
  { value: 'PENDING', label: '미출고' },
  { value: 'COMPLETED', label: '출고완료' }
];

const OrderConfirm: React.FC = React.memo(() => {
  const dispatch = useDispatch<AppDispatch>();
  const {
    searchCondition,
    orderSummaries,
    selectedSummary,
    orderLines,
    originalOrderLines,
    isInitialized
  } = useSelector((state: RootState) => state.orderConfirm);

  // 현재 활성 탭 정보 가져오기
  const { tabs, activeTabId } = useSelector((state: RootState) => state.tabs);
  const currentTab = tabs.find(tab => tab.id === activeTabId);

  // 현재 로그인한 사용자 정보 (벤더 정보)
  const user = useSelector((state: RootState) => state.auth.user);
  const currentVendorId = user?.agentId || ''; // 벤더사의 AGENT_ID

  // 배송 관련 옵션 (DB 연동)
  const [shipMethodOptions, setShipMethodOptions] = useState<CommonCodeOption[]>([]);
  const [logisCompanyOptions, setLogisCompanyOptions] = useState<CommonCodeOption[]>([]);
  
  // 로딩 상태
  const [isLoading, setIsLoading] = useState(false);
  const [overQtyModalIndex, setOverQtyModalIndex] = useState<number | null>(null);
  const [selectedLineIndexes, setSelectedLineIndexes] = useState<Set<number>>(new Set());
  
  // 출고내역서 전송 모달 상태
  const [showOutboundSendModal, setShowOutboundSendModal] = useState<boolean>(false);
  // 출고취소(전체취소 고지) 모달 상태
  const [showCancelModal, setShowCancelModal] = useState<boolean>(false);
  const [cancelModalLines, setCancelModalLines] = useState<OrderData[]>([]);
  const [cancelModalOutDate, setCancelModalOutDate] = useState<string>('');
  const [cancelModalHasInbound, setCancelModalHasInbound] = useState<boolean>(false);
  const [cancelSelection, setCancelSelection] = useState<Set<string>>(new Set());
  // 부분확정 안내 모달 상태
  const [showPartialConfirmModal, setShowPartialConfirmModal] = useState(false);
  const [partialMissingLines, setPartialMissingLines] = useState<number[]>([]); // 출고수량 미입력 라인 ORDER_NO 목록

  // AG Grid 참조
  const gridRef = useRef<AgGridReact>(null);
  const selectAllRef = useRef<HTMLInputElement>(null);

  // AG Grid API 상태
  const [, setGridApi] = useState<any>(null);

  // 날짜 포맷 변환 (YYYY-MM-DD -> YYYYMMDD)
  const toDashedDate = useCallback((value?: string | null): string => {
    if (!value) return '';
    const trimmed = value.trim();
    if (trimmed.length === 8 && /^\d{8}$/.test(trimmed)) {
      return `${trimmed.substring(0, 4)}-${trimmed.substring(4, 6)}-${trimmed.substring(6, 8)}`;
    }
    if (trimmed.length === 10 && /^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
      return trimmed;
    }
    return trimmed;
  }, []);

  const toDateInputValue = useCallback((value?: string | null): string => {
    const dashed = toDashedDate(value);
    return /^\d{4}-\d{2}-\d{2}$/.test(dashed) ? dashed : '';
  }, [toDashedDate]);

  // 요약행 고유키 (확정 여부 추적용)
  const summaryKey = useCallback((s: { ORDER_D?: string; ORDER_SEQU?: number }): string => {
    const orderD = toDashedDate(s.ORDER_D || '');
    return `${orderD}|${s.ORDER_SEQU ?? ''}`;
  }, [toDashedDate]);

  // 실제 "출고확정" 완료된 발주요약 키 집합
  // - 최초 조회 시 서버에서 OUT_D가 존재하는 행만 확정 처리된 것으로 간주
  // - 사용자가 화면에서 OUT_D를 입력만 한 경우에는 여기 포함되지 않으므로 색상 변경되지 않음
  const [confirmedSummaryKeys, setConfirmedSummaryKeys] = useState<Set<string>>(new Set());

  // 출고번호 생성 함수: OUT_D-ORDER_D-ORDER_SEQU (yyyymmdd-yyyymmdd-12345)
  const generateOutboundNo = useCallback((outD: string, orderD: string, orderSequ: number): string => {
    const formatDate = (date: string) => {
      // YYYY-MM-DD 또는 YYYYMMDD → YYYYMMDD
      return date.replace(/-/g, '');
    };
    return `${formatDate(outD)}-${formatDate(orderD)}-${orderSequ}`;
  }, []);

  // 발주번호별로 그룹핑된 요약 데이터 (그리드용)
  // 컬럼 정의 - 발주번호별 요약 정보
  const columnDefs: any[] = [
    { 
      headerName: '발주일자', 
      field: 'ORDER_D', 
      width: 100, 
      minWidth: 90,
      valueFormatter: (params: any) => {
        if (!params.value) return '';
        const str = params.value.toString();
        if (str.length === 8) {
          return `${str.substring(0, 4)}-${str.substring(4, 6)}-${str.substring(6, 8)}`;
        }
        return params.value;
      }
    },
    { 
      headerName: '일련번호', 
      field: 'ORDER_SEQU', 
      width: 60, 
      minWidth: 50 
    },
    { 
      headerName: '거래처명', 
      field: 'AGENT_NM', 
      width: 100, 
      minWidth: 80 
    },
    { 
      headerName: '벤더명', 
      field: 'VENDOR_NAME', 
      width: 100, 
      minWidth: 80 
    },
    { 
      headerName: '상품명', 
      field: 'FIRST_GOODS_NAME', 
      width: 200, 
      minWidth: 140, 
      flex: 1,
      valueGetter: (params: any) => {
        const baseName = params.data?.FIRST_GOODS_NAME || '';
        const additional = params.data?.ADDITIONAL_ITEM_COUNT ? Number(params.data.ADDITIONAL_ITEM_COUNT) : 0;
        return additional > 0 ? `${baseName} 외 ${additional}건` : baseName;
      }
    },
    { 
      headerName: '브랜드명', 
      field: 'BRAND_NM', 
      width: 90, 
      minWidth: 70 
    },
    { 
      headerName: '수량', 
      field: 'TOTAL_QTY', 
      width: 70, 
      minWidth: 60,
      type: 'numericColumn',
      valueFormatter: (params: any) => {
        if (params.value === null || params.value === undefined) return '';
        return new Intl.NumberFormat('ko-KR').format(params.value);
      }
    },
    { 
      headerName: '입고요구일', 
      field: 'REQUIRE_D', 
      width: 100, 
      minWidth: 90,
      valueFormatter: (params: any) => {
        if (!params.value) return '';
        const str = params.value.toString();
        if (str.length === 8) {
          return `${str.substring(0, 4)}-${str.substring(4, 6)}-${str.substring(6, 8)}`;
        }
        return params.value;
      }
    },
    { 
      headerName: '주문금액', 
      field: 'TOTAL_ORDER_AMT', 
      width: 100, 
      minWidth: 90,
      type: 'numericColumn',
      valueFormatter: (params: any) => {
        if (params.value === null || params.value === undefined) return '';
        return new Intl.NumberFormat('ko-KR').format(params.value);
      }
    },
    { 
      headerName: '출고일자', 
      field: 'OUT_D', 
      width: 100, 
      minWidth: 90,
      valueFormatter: (params: any) => {
        if (!params.value) return '-';
        const str = params.value.toString();
        if (str.length === 8) {
          return `${str.substring(0, 4)}-${str.substring(4, 6)}-${str.substring(6, 8)}`;
        }
        return params.value;
      },
      cellStyle: (params: any) => {
        // 확정 상태이면서 출고일자가 실제로 존재할 때만 초록색 표시
        // 출고일자(OUT_D)가 비어있거나 null이면 기본색 유지
        const key = summaryKey(params.data || {});
        const hasOutDate = !!params.value && typeof params.value === 'string' && params.value.trim() !== '';
        if (hasOutDate && confirmedSummaryKeys.has(key)) {
          return { color: '#28a745', fontWeight: 600 };
        }
        return { color: '#212529' }; // 기본 텍스트 색상
      }
    },
    { 
      headerName: '도착예정일', 
      field: 'EST_D', 
      width: 100, 
      minWidth: 90,
      valueFormatter: (params: any) => {
        if (!params.value) return '-';
        const str = params.value.toString();
        if (str.length === 8) {
          return `${str.substring(0, 4)}-${str.substring(4, 6)}-${str.substring(6, 8)}`;
        }
        return params.value;
      }
    }
  ];

  const masterRowClassRules = useMemo(
    () => ({
      'order-master-shipped': (params: { data?: OrderSummary | null }) => {
        if (!params.data) return false;
        // 실제 확정된 행이면서 유효한 출고일자(YYYYMMDD or YYYY-MM-DD)가 존재할 때만 강조
        const key = summaryKey(params.data);
        const rawOut = (params.data as any).OUT_D as string | undefined;
        if (!rawOut) return false;
        const digits = rawOut.replace(/[^0-9]/g, '');
        const hasValidOutDate = digits.length === 8; // YYYYMMDD 형식 확인
        return hasValidOutDate && confirmedSummaryKeys.has(key);
      }
    }),
    [summaryKey, confirmedSummaryKeys]
  );

  // AG Grid 준비 완료 이벤트
  const onGridReady = useCallback((params: any) => {
    setGridApi(params.api);
    console.log('✅ AG Grid 준비 완료');
  }, []);

  // 그리드 행 더블클릭 이벤트 (상세보기)
  const onRowDoubleClicked = useCallback(async (event: any) => {
    const summary = event.data as OrderSummary | undefined;
    if (!summary) {
      return;
    }

    try {
      setIsLoading(true);
      const normalizedSummary: OrderSummary = {
        ...summary,
        ORDER_D: toDashedDate(summary.ORDER_D),
        REQUIRE_D: toDashedDate(summary.REQUIRE_D),
        OUT_D: toDashedDate(summary.OUT_D),
        EST_D: toDashedDate(summary.EST_D)
      };

      const details = await getOrderConfirmDetails(
        summary.ORDER_D,
        summary.ORDER_SEQU,
        // 벤더 분리된 마스터 기준: 선택한 행의 VENDOR_ID가 우선
        (summary as any).VENDOR_ID || currentVendorId
      );
      
      console.log('📦 상세 조회 원본 데이터:', details);

      const normalized: OrderData[] = details.map((lineData) => {
        const line: any = lineData;
        const outD = toDashedDate(line.OUT_D ?? normalizedSummary.OUT_D ?? '');
        const orderD = toDashedDate(line.ORDER_D ?? normalizedSummary.ORDER_D);
        const orderSequ = line.ORDER_SEQU || normalizedSummary.ORDER_SEQU;
        
        return {
          ORDER_D: orderD,
          ORDER_SEQU: orderSequ,
          ORDER_NO: Number(line.ORDER_NO ?? 0),
          AGENT_ID: (line.AGENT_ID ?? line.AGENTID ?? normalizedSummary.AGENT_ID ?? '') as string,
          AGENT_NM: (line.AGENT_NM ?? line.AGENT_NAME ?? normalizedSummary.AGENT_NM ?? '') as string,
          VENDOR_ID: (line.VENDOR_ID ?? (summary as any).VENDOR_ID ?? '') as string,
          BRAND_ID: (line.BRAND_ID ?? normalizedSummary.BRAND_ID ?? '') as string,
          BRAND_NM: (line.BRAND_NM ?? line.BRAND_NAME ?? normalizedSummary.BRAND_NM ?? '') as string,
          GOODS_ID: (line.GOODS_ID ?? '') as string,
          GOODS_NM: (line.GOODS_NM ?? '') as string,
          ORDER_QTY: Number(line.ORDER_QTY ?? 0),
          REQUIRE_D: toDashedDate(line.REQUIRE_D ?? line.REQUIRE_DATE ?? normalizedSummary.REQUIRE_D ?? ''),
          SOBIJA_DAN: Number(line.SOBIJA_DAN ?? 0),
          SOBIJA_AMT: Number(line.SOBIJA_AMT ?? 0),
          SOBIJA_VAT: Number(line.SOBIJA_VAT ?? 0),
          SOBIJA_TOT: Number(line.SOBIJA_TOT ?? 0),
          SALE_RATE: Number(line.SALE_RATE ?? 0),
          ORDER_DAN: Number(line.ORDER_DAN ?? 0),
          ORDER_AMT: Number(line.ORDER_AMT ?? 0),
          ORDER_VAT: Number(line.ORDER_VAT ?? 0),
          ORDER_TOT: Number(line.ORDER_TOT ?? 0),
          ORDER_MEMO: (line.ORDER_MEMO ?? '') as string,
          OUT_D: outD,
          OUT_QTY: Number(line.OUT_QTY ?? line.OUTQTY ?? 0),
          EST_D: toDashedDate(line.EST_D ?? normalizedSummary.EST_D ?? ''),
          RECV_ADDR: (line.RECV_ADDR ?? '') as string,
          RECV_TEL: (line.RECV_TEL ?? '') as string,
          RECV_PERSON: (line.RECV_PERSON ?? '') as string,
          RECV_MEMO: (line.RECV_MEMO ?? '') as string,
          SHIP_METHOD: (line.SHIP_METHOD ?? line.SHIPMETHOD ?? normalizedSummary.SHIP_METHOD ?? '') as string,
          SHIP_TRANS_NO: (line.SHIP_TRANS_NO ?? line.SHIPTRANSNO ?? normalizedSummary.SHIP_TRANS_NO ?? '') as string,
          SHIP_MEMO: (line.SHIP_MEMO ?? line.SHIPMEMO ?? normalizedSummary.SHIP_MEMO ?? '') as string,
          SHIP_LOGIS_GBN: (line.SHIP_LOGIS_GBN ?? line.SHIPLOGISGBN ?? normalizedSummary.SHIP_LOGIS_GBN ?? '') as string,
          SHIP_LOGIS_GBN_NM: (line.SHIP_LOGIS_GBN_NM ?? line.SHIPLOGISGBNNM ?? normalizedSummary.SHIP_LOGIS_GBN_NM ?? '') as string,
          IN_TOT_QTY: Number(line.IN_TOT_QTY ?? 0),
          IN_D: toDashedDate(line.IN_D ?? ''),
          ORDER_SEND_YN: (line.ORDER_SEND_YN ?? '') as string,
          USER_ID: (line.USER_ID ?? '') as string,
          SYS_TIME: (line.SYS_TIME ?? '') as string,
          OUTBOUND_NO: (outD && /^\d{4}-\d{2}-\d{2}$/.test(outD)) ? generateOutboundNo(outD, orderD, orderSequ) : '',
          // 유통기한 데이터 (서비스에서 그룹핑됨)
          expiryDetails: (() => {
            console.log(`📝 ORDER_NO ${line.ORDER_NO} 유통기한 원본:`, line.expiryDetails);
            const mappedDetails = (line.expiryDetails || []).map((e: any) => ({
              EXP_SEQU: e.EXP_SEQU,
              EXP_D: toDashedDate(e.EXP_D || ''),
              EXP_QTY: Number(e.EXP_QTY || 0),
              LOT_NO: e.LOT_NO || ''
            }));
            // 기본 유통기한 1개 항목 추가 (서버에서 받은 데이터가 없으면)
            const finalDetails = mappedDetails.length > 0 ? mappedDetails : [{ EXP_D: '', EXP_QTY: 0, LOT_NO: '' }];
            console.log(`✅ ORDER_NO ${line.ORDER_NO} 최종 유통기한:`, finalDetails);
            return finalDetails;
          })(),
          deletedExpirySequ: []
        };
      });

      const sortedLines = [...normalized].sort((a, b) => (a.ORDER_NO ?? 0) - (b.ORDER_NO ?? 0));
      
      // selectedSummary에 VENDOR_ID 포함 (벤더별 마스터 데이터)
      const summaryWithVendor = {
        ...normalizedSummary,
        VENDOR_ID: (summary as any).VENDOR_ID,
        VENDOR_NAME: (summary as any).VENDOR_NAME
      };
      
      dispatch(setSelectedSummary(summaryWithVendor as any));
      const originalLines = sortedLines.map(line => ({ ...line }));
      const editableLines = sortedLines.map(line => ({ ...line }));
      dispatch(setOriginalOrderLines(originalLines));
      dispatch(setOrderLines(editableLines));
    } catch (error) {
      console.error('❌ 출고 상세 조회 오류:', error);
      alert('발주 상세 정보를 불러오지 못했습니다.');
    } finally {
      setIsLoading(false);
    }
  }, [currentVendorId]);


  // 검색 조건 변경 핸들러
  const handleSearchConditionChange = (field: keyof SearchCondition, value: string | string[]) => {
    let processedValue: string | string[] = value;
    if (field === 'orderDateFrom' || field === 'orderDateTo') {
      processedValue = typeof value === 'string' ? toDashedDate(value) : value;
    }

    dispatch(
      setSearchConditionAction({
        [field]: processedValue
      } as Partial<SearchCondition>)
    );
  };

  // 조회 버튼 클릭 핸들러
  const handleSearch = useCallback(async () => {
    try {
      setIsLoading(true);
      const results = await searchOrderConfirm({
        orderDateFrom: searchCondition.orderDateFrom,
        orderDateTo: searchCondition.orderDateTo,
        brandIds: searchCondition.brandIds,
        goodsNm: searchCondition.goodsNm,
        agentNm: searchCondition.agentNm,
        outStatus: searchCondition.outStatus,
        vendorId: currentVendorId
      });

      const normalizedSummaries = results.map(summary => ({
        ...summary,
        ORDER_D: toDashedDate(summary.ORDER_D),
        REQUIRE_D: toDashedDate(summary.REQUIRE_D),
        OUT_D: toDashedDate(summary.OUT_D),
        EST_D: toDashedDate(summary.EST_D)
      }));

      // 서버에서 이미 OUT_D가 존재하는 행만 확정된 것으로 간주하여 집합 갱신
      const confirmedKeys = normalizedSummaries
        .filter(s => s.OUT_D && /^\d{4}-\d{2}-\d{2}$/.test(s.OUT_D))
        .map(s => summaryKey(s));
      setConfirmedSummaryKeys(new Set(confirmedKeys));

      dispatch(setOrderSummaries(normalizedSummaries));
      dispatch(resetSelection());
      dispatch(initializeScreen());
    } catch (error) {
      console.error('❌ 출고 목록 조회 오류:', error);
      alert('출고 목록을 조회하지 못했습니다.');
    } finally {
      setIsLoading(false);
    }
  }, [dispatch, searchCondition, currentVendorId, toDashedDate, summaryKey]);

  const handleResetSearch = useCallback(() => {
    const defaultCondition = createDefaultSearchCondition();
    dispatch(setSearchConditionAction(defaultCondition));
    dispatch(setOrderSummaries([]));
    dispatch(resetSelection());
    dispatch(setSelectedSummary(null));
    dispatch(setOrderLines([]));
    dispatch(setOriginalOrderLines([]));
    setSelectedLineIndexes(() => new Set());

    const gridInstance = gridRef.current as unknown as { api?: { deselectAll?: () => void } } | null;
    gridInstance?.api?.deselectAll?.();
  }, [dispatch]);

  useEffect(() => {
    setSelectedLineIndexes(new Set());
  }, [orderLines]);

  // 출고확정 버튼 클릭 핸들러
  const executeConfirmShipment = async () => {
    if (!selectedSummary) {
      alert('출고확정할 발주 정보를 찾을 수 없습니다. 다시 선택해주세요.');
      return;
    }

    if (confirmableIndexes.length === 0) {
      alert('출고확정할 항목을 선택해주세요. (입고 완료된 항목은 제외됩니다)');
      return;
    }

    const baseIndex = confirmableIndexes[0];
    const baseLine = orderLines[baseIndex];

    if (!baseLine) {
      alert('출고확정할 데이터를 찾을 수 없습니다.');
      return;
    }

    if (!baseLine.OUT_D) {
      alert('출고일자를 입력해주세요.');
      return;
    }
    if (!baseLine.EST_D) {
      alert('도착예정일을 입력해주세요.');
      return;
    }
    if (!baseLine.SHIP_METHOD) {
      alert('배송방법을 선택해주세요.');
      return;
    }
    if (!baseLine.SHIP_LOGIS_GBN) {
      alert('배송회사를 선택해주세요.');
      return;
    }

    const selectedCount = confirmableIndexes.length;
    const totalCount = orderLines.filter((_, idx) => !isLineLocked(idx) && !shippedLineFlags[idx]).length;
    const unselectedCount = totalCount - selectedCount;
    
    let confirmMsg = `선택한 ${selectedCount}개 항목을 출고확정 하시겠습니까?`;
    if (unselectedCount > 0) {
      confirmMsg += `\n\n※ 선택하지 않은 ${unselectedCount}개 항목도 출고수량 0으로 자동 확정됩니다.`;
    }
    
    if (!window.confirm(confirmMsg)) {
      return;
    }

    // 유통기한 수량 합계 검증: 확정 대상 라인만 검사 (유통기한 합계 == 출고수량)
    const invalidLines: number[] = [];
    confirmableIndexes.forEach(i => {
      const l = orderLines[i];
      if (!l) return;
      const totalExpiry = (l.expiryDetails || []).reduce((s, e) => s + (e.EXP_QTY || 0), 0);
      const outQty = l.OUT_QTY || 0;
      if (totalExpiry !== outQty) {
        invalidLines.push(l.ORDER_NO);
      }
    });
    if (invalidLines.length > 0) {
      alert(`유통기한 수량 합계가 출고수량과 다른 행이 있습니다: ${invalidLines.join(', ')}`);
      return;
    }

    try {
      setIsLoading(true);
      
      // 모든 미확정/미입고 라인을 대상으로 확정 처리 (선택 안 한 라인은 OUT_QTY=0)
      const allConfirmableIndexes = orderLines.reduce<number[]>((acc, _, idx) => {
        if (!isLineLocked(idx) && !shippedLineFlags[idx]) {
          acc.push(idx);
        }
        return acc;
      }, []);
      
      const linesByVendor = new Map<string, number[]>();
      allConfirmableIndexes.forEach(index => {
        const line = orderLines[index];
        const vendorId = line.VENDOR_ID || '';
        if (!linesByVendor.has(vendorId)) {
          linesByVendor.set(vendorId, []);
        }
        linesByVendor.get(vendorId)!.push(index);
      });

      console.log('📦 벤더별 출고확정 그룹:', Array.from(linesByVendor.entries()).map(([v, idxs]) => ({ vendor: v, count: idxs.length })));

      let successCount = 0;
      let failCount = 0;
      const errorMessages: string[] = [];
      
      // 각 벤더별로 출고확정 요청 전송
      for (const [vendorId, vendorIndexes] of linesByVendor.entries()) {
        if (!vendorId) {
          const problemLines = vendorIndexes.map(idx => {
            const line = orderLines[idx];
            return `${line.GOODS_NM} (주문번호: ${line.ORDER_NO})`;
          }).join(', ');
          console.warn('⚠️ VENDOR_ID가 없는 라인:', problemLines);
          failCount++;
          errorMessages.push(`벤더 정보 누락: ${problemLines}`);
          continue;
        }

        const vendorBaseLine = orderLines[vendorIndexes[0]];
        
        const requestData = {
          orderD: selectedSummary.ORDER_D,
          orderSequ: selectedSummary.ORDER_SEQU,
          vendorId: vendorId,
          outDate: vendorBaseLine.OUT_D || '',
          estDate: vendorBaseLine.EST_D || '',
          shipMethod: vendorBaseLine.SHIP_METHOD || '',
          shipLogisGbn: vendorBaseLine.SHIP_LOGIS_GBN || '',
          shipTransNo: vendorBaseLine.SHIP_TRANS_NO || '',
          shipMemo: vendorBaseLine.SHIP_MEMO || '',
          userId: String(user?.userId ?? ''),
          lines: vendorIndexes.map(index => {
            const line = orderLines[index];
            const isSelected = selectedLineIndexes.has(index);
            const totalExpiry = (line.expiryDetails || []).reduce((s, e) => s + (e.EXP_QTY || 0), 0);
            // 선택된 라인: 입력된 수량으로, 선택 안 된 라인: 0으로 확정
            const finalQty = isSelected ? totalExpiry : 0;
            return {
              orderNo: line.ORDER_NO,
              vendorId: String(line.VENDOR_ID),  // 문자열로 변환하여 Jackson 파싱 보장
              outQty: finalQty,
              expiryDetails: isSelected ? (line.expiryDetails || []) : [],
              deletedExpirySequ: isSelected ? (line.deletedExpirySequ || []) : []
            };
          })
        };
        
        console.log(`🚀 출고확정 요청 [벤더: ${vendorId}]:`, JSON.stringify(requestData, null, 2));
        console.log(`🔍 라인 데이터 상세:`, requestData.lines.map(l => ({ 
          orderNo: l.orderNo, 
          vendorId: l.vendorId, 
          hasVendorId: !!l.vendorId,
          vendorIdType: typeof l.vendorId 
        })));
        
        try {
          const result = await confirmOrderShipment(requestData);
          
          if (result.success) {
            successCount++;
            console.log(`✅ 벤더 ${vendorId} 출고확정 성공`);
          } else {
            failCount++;
            errorMessages.push(`벤더 ${vendorId}: ${result.message || '실패'}`);
            console.error(`❌ 벤더 ${vendorId} 출고확정 실패:`, result.message);
          }
        } catch (err) {
          failCount++;
          const errMsg = err instanceof Error ? err.message : String(err);
          errorMessages.push(`벤더 ${vendorId}: ${errMsg}`);
          console.error(`❌ 벤더 ${vendorId} 출고확정 중 오류:`, err);
        }
      }

      // 결과 메시지 표시
      if (failCount === 0) {
        alert(`출고확정이 완료되었습니다.\n성공: ${successCount}개 벤더`);
      } else if (successCount === 0) {
        alert(`출고확정에 실패했습니다.\n${errorMessages.join('\n')}`);
      } else {
        alert(`출고확정이 부분적으로 완료되었습니다.\n성공: ${successCount}개 벤더\n실패: ${failCount}개 벤더\n\n실패 내역:\n${errorMessages.join('\n')}`);
      }

      await handleSearch();
      setSelectedLineIndexes(new Set());
      dispatch(resetSelection());
    } catch (error) {
      console.error('❌ 출고확정 중 오류:', error);
      alert('출고확정 중 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
      setShowPartialConfirmModal(false);
    }
  };

  // 출고확정 버튼 클릭 (부분확정 안내 처리 포함)
  const handleConfirmShipment = () => {
    if (!selectedSummary) {
      alert('출고확정할 발주 정보를 찾을 수 없습니다. 다시 선택해주세요.');
      return;
    }
    // 현재 선택된 라인 중 출고수량 > 0 인 라인
    const confirmable = selectedIndexesArray.filter(idx => {
      const line = orderLines[idx];
      if (!line || isLineLocked(idx)) return false;
      return (line.OUT_QTY || 0) > 0;
    });
    if (confirmable.length === 0) {
      alert('출고확정할 항목을 선택해주세요. (출고수량을 입력 후 선택하세요)');
      return;
    }
    const missing = selectedIndexesArray.filter(idx => {
      const line = orderLines[idx];
      if (!line || isLineLocked(idx)) return false;
      return (line.OUT_QTY || 0) === 0;
    });
    if (missing.length > 0) {
      const missingOrderNos = missing.map(i => orderLines[i]?.ORDER_NO).filter(v => v !== undefined) as number[];
      setPartialMissingLines(missingOrderNos);
      setShowPartialConfirmModal(true);
      return;
    }
    void executeConfirmShipment();
  };

  // 부분확정 모달에서 최종 진행
  const handlePartialConfirmProceed = () => {
    void executeConfirmShipment();
  };

  // 출고취소 준비: 모달 오픈 및 대상 라인 계산
  const prepareCancelShipment = () => {
    if (!selectedSummary) {
      alert('출고취소할 발주 정보를 찾을 수 없습니다. 다시 선택해주세요.');
      return;
    }
    if (cancellableIndexes.length === 0) {
      alert('출고취소할 항목을 선택해주세요. (출고된 항목만 취소할 수 있습니다)');
      return;
    }
    const firstLine = orderLines[cancellableIndexes[0]];
    const targetOutDateRaw = firstLine.OUT_D;
    const batchLines = orderLines.filter(line => {
      const lineOutD = toDashedDate(line.OUT_D);
      const targetOutD = toDashedDate(targetOutDateRaw);
      return lineOutD === targetOutD && lineOutD && /^\d{4}-\d{2}-\d{2}$/.test(lineOutD);
    });
    const inboundExists = batchLines.some(line => {
      const inD = toDashedDate(line.IN_D);
      return inD && /^\d{4}-\d{2}-\d{2}$/.test(inD);
    });
    setCancelModalLines(batchLines);
    setCancelModalOutDate(toDashedDate(targetOutDateRaw));
    setCancelModalHasInbound(inboundExists);
    setCancelSelection(new Set(batchLines.map(l => String(l.ORDER_NO))));
    setShowCancelModal(true);
  };

  // 실제 출고취소 실행
  const performCancelShipment = async () => {
    if (!selectedSummary) return;
    try {
      setIsLoading(true);
      const result = await cancelOrderShipment({
        orderD: selectedSummary.ORDER_D,
        orderSequ: selectedSummary.ORDER_SEQU,
        vendorId: currentVendorId,
        userId: String(user?.userId ?? ''),
        lines: cancelModalLines.map(line => ({ 
          orderNo: line.ORDER_NO,
          vendorId: String(line.VENDOR_ID)  // 문자열로 변환하여 Jackson 파싱 보장
        }))
      });
      if (!result.success) {
        throw new Error(result.message || '출고취소에 실패했습니다.');
      }
      // 모달 닫기 및 갱신
      setShowCancelModal(false);
      alert(result.message || '출고취소가 완료되었습니다.');
      await handleSearch();
      setSelectedLineIndexes(new Set());
      dispatch(resetSelection());
    } catch (error) {
      console.error('❌ 출고취소 중 오류:', error);
      alert('출고취소 중 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  // 출고 처리 입력값을 모든 상세 라인에 동기화 (마스터 정보 공유)
  const updateShipmentField = useCallback(
    (field: ShipmentField, value: string) => {
      dispatch(updateOrderLinesField({ field, value }));
      dispatch(updateSelectedSummary({ [field]: value } as Partial<OrderSummary>));
    },
    [dispatch]
  );

  // 숫자 포맷 (천단위 콤마)
  const formatNumber = (num: number | undefined | null): string => {
    if (num === null || num === undefined) return '0';
    return new Intl.NumberFormat('ko-KR').format(num);
  };

  const totalStoreStock = orderLines.reduce((sum, line) => sum + (line.IN_TOT_QTY || 0), 0);
  const totalOrderAmount = orderLines.reduce((sum, line) => sum + (line.ORDER_TOT || 0), 0);
  const totalOrderQty = orderLines.reduce((sum, line) => sum + (line.ORDER_QTY || 0), 0);
  const totalOutQty = orderLines.reduce((sum, line) => sum + (line.OUT_QTY || 0), 0);
  const primaryLine = orderLines[0];

  type MasterInfo = Partial<OrderSummary> & Partial<OrderData>;

  const masterInfo = useMemo<MasterInfo | null>(() => {
    if (!primaryLine && !selectedSummary) {
      return null;
    }
    return {
      ...(selectedSummary ?? {}),
      ...(primaryLine ?? {})
    };
  }, [primaryLine, selectedSummary]);

  const shippedLineFlags = useMemo(
    () =>
      originalOrderLines.map(line => {
        const dashed = toDashedDate(line.OUT_D);
        return !!(dashed && /^\d{4}-\d{2}-\d{2}$/.test(dashed));
      }),
    [originalOrderLines, toDashedDate]
  );


  const lockedLineFlags = useMemo(
    () =>
      originalOrderLines.map(line => {
        const dashed = toDashedDate(line.IN_D);
        return !!(dashed && /^\d{4}-\d{2}-\d{2}$/.test(dashed));
      }),
    [originalOrderLines, toDashedDate]
  );

  const hasConfirmedShipment = useMemo(
    () => shippedLineFlags.some(flag => flag),
    [shippedLineFlags]
  );

  const isLineLocked = useCallback(
    (index: number) => lockedLineFlags[index] ?? false,
    [lockedLineFlags]
  );

  // 출고 예정 플래그: 확정 전 + 유통기한(Expiry) 수량 입력됨 (합계 > 0)
  const plannedLineFlags = useMemo(
    () => orderLines.map((line, idx) => {
      if (!line) return false;
      if (shippedLineFlags[idx]) return false;
      if (lockedLineFlags[idx]) return false;
      const expiryTotal = (line.expiryDetails || []).reduce((s,e)=>s + (e.EXP_QTY || 0), 0);
      return expiryTotal > 0;
    }),
    [orderLines, shippedLineFlags, lockedLineFlags]
  );

  // 출고 준비 완료 플래그: 확정 전 + (expiry 합계 == OUT_QTY) + OUT_QTY>0
  const readyLineFlags = useMemo(
    () => orderLines.map((line, idx) => {
      if (!line) return false;
      if (shippedLineFlags[idx]) return false;
      if (lockedLineFlags[idx]) return false;
      const outQty = line.OUT_QTY || 0;
      if (outQty <= 0) return false;
      const expiryTotal = (line.expiryDetails || []).reduce((s,e)=>s + (e.EXP_QTY || 0), 0);
      return expiryTotal === outQty;
    }),
    [orderLines, shippedLineFlags, lockedLineFlags]
  );

  // 선택 가능 라인: 입고완료(IN_D)되지 않은 라인 (출고확정 전이므로 모두 선택 가능)
  const selectableIndexes = useMemo(() => {
    return orderLines.reduce<number[]>((acc, _, index) => {
      if (!isLineLocked(index)) {
        acc.push(index);
      }
      return acc;
    }, []);
  }, [isLineLocked, orderLines]);

  const selectedIndexesArray = useMemo(
    () => Array.from(selectedLineIndexes).sort((a, b) => a - b),
    [selectedLineIndexes]
  );

  // Commented out - buttons removed from UI
  // const hasEditableLines = useMemo(() => {
  //   if (selectedIndexesArray.length > 0) {
  //     return selectedIndexesArray.some(index => !isLineLocked(index));
  //   }
  //   return selectableIndexes.length > 0;
  // }, [isLineLocked, selectableIndexes, selectedIndexesArray]);

  const isAllSelected = useMemo(() => {
    if (selectableIndexes.length === 0) return false;
    return selectableIndexes.every(index => selectedLineIndexes.has(index));
  }, [selectableIndexes, selectedLineIndexes]);

  const toggleSelectAll = useCallback(() => {
    setSelectedLineIndexes(prev => {
      const isCurrentlyAllSelected =
        selectableIndexes.length > 0 &&
        selectableIndexes.every(index => prev.has(index));

      if (isCurrentlyAllSelected) {
        return new Set();
      }

      const next = new Set<number>();
      selectableIndexes.forEach(index => next.add(index));
      return next;
    });
  }, [selectableIndexes]);

  const toggleLineSelection = useCallback(
    (index: number) => {
      if (isLineLocked(index)) {
        return;
      }
      setSelectedLineIndexes(prev => {
        const next = new Set(prev);
        if (next.has(index)) {
          next.delete(index);
        } else {
          next.add(index);
        }
        return next;
      });
    },
    [isLineLocked]
  );

  const isLineSelected = useCallback(
    (index: number) => selectedLineIndexes.has(index),
    [selectedLineIndexes]
  );

  // 확정 대상: 선택 + OUT_QTY > 0 + 미확정 + 잠금 아님
  const confirmableIndexes = useMemo(
    () => selectedIndexesArray.filter(index => {
      if (hasConfirmedShipment) return false;
      if (isLineLocked(index)) return false;
      if (shippedLineFlags[index]) return false;
      const line = orderLines[index];
      if (!line) return false;
      const expiryTotal = (line.expiryDetails || []).reduce((s,e)=>s + (e.EXP_QTY || 0), 0);
      return expiryTotal > 0; // 유통기한 수량이 입력된 라인만 확정 가능
    }),
    [selectedIndexesArray, hasConfirmedShipment, isLineLocked, shippedLineFlags, orderLines]
  );

  // 자동 선택: 유통기한 수량 합계(expiryTotal) > 0 인 미확정 라인 -> 버튼 활성화 유도
  useEffect(() => {
    if (hasConfirmedShipment) return;
    const autoSelectable = orderLines.reduce<number[]>((acc, line, idx) => {
      if (!line) return acc;
      if (isLineLocked(idx)) return acc;
      if (shippedLineFlags[idx]) return acc;
      const expiryTotal = (line.expiryDetails || []).reduce((s,e)=>s + (e.EXP_QTY || 0), 0);
      if (expiryTotal > 0) acc.push(idx);
      return acc;
    }, []);
    setSelectedLineIndexes(prev => {
      const prevArr = Array.from(prev).sort((a,b)=>a-b);
      const nextArr = autoSelectable.sort((a,b)=>a-b);
      const isSame = prevArr.length === nextArr.length && prevArr.every((v,i)=>v===nextArr[i]);
      if (isSame) return prev;
      return new Set(nextArr);
    });
  }, [orderLines, hasConfirmedShipment, isLineLocked, shippedLineFlags]);

  const cancellableIndexes = useMemo(
    () => {
      // 출고확정된 라인이 하나라도 있고 아무 선택이 없으면 전체 라인 기준으로 취소 가능
      const baseIndexes = (hasConfirmedShipment && selectedIndexesArray.length === 0)
        ? orderLines.map((_, i) => i)
        : selectedIndexesArray;
      return baseIndexes.filter(index => {
        if (isLineLocked(index)) return false; // 입고된 라인은 취소 불가
        const line = orderLines[index];
        if (!line) return false;
        const dashed = toDashedDate(line.OUT_D);
        return !!(dashed && /^\d{4}-\d{2}-\d{2}$/.test(dashed)); // 출고일자 존재(출고된 라인)만 취소 대상
      });
    },
    [hasConfirmedShipment, isLineLocked, orderLines, selectedIndexesArray, toDashedDate]
  );

  useEffect(() => {
    if (!selectAllRef.current) return;
    selectAllRef.current.indeterminate =
      selectedIndexesArray.length > 0 && !isAllSelected;
  }, [isAllSelected, selectedIndexesArray]);


  // Commented out - buttons removed from UI
  // const handleApplyFullShipmentAll = useCallback(() => {
  //   const baseTargets =
  //     selectedIndexesArray.length > 0
  //       ? selectedIndexesArray
  //       : orderLines.map((_, index) => index);
  //   const targetSet = new Set(
  //     baseTargets.filter(index => !isLineLocked(index))
  //   );
  //   if (targetSet.size === 0) {
  //     return;
  //   }
  //   const nextLines = orderLines.map((line, index) => {
  //     if (!targetSet.has(index)) {
  //       return line;
  //     }
  //     const orderQty = line.ORDER_QTY ?? 0;
  //     return {
  //       ...line,
  //       OUT_QTY: orderQty
  //     };
  //   });
  //   dispatch(setOrderLines(nextLines));
  // }, [dispatch, isLineLocked, orderLines, selectedIndexesArray]);

  // const handleResetShipmentAll = useCallback(() => {
  //   const baseTargets =
  //     selectedIndexesArray.length > 0
  //       ? selectedIndexesArray
  //       : orderLines.map((_, index) => index);
  //   const targetSet = new Set(
  //     baseTargets.filter(index => !isLineLocked(index))
  //   );
  //   if (targetSet.size === 0) {
  //     return;
  //   }
  //   const nextLines = orderLines.map((line, index) => {
  //     if (!targetSet.has(index)) {
  //       return line;
  //     }
  //     return {
  //       ...line,
  //       OUT_QTY: 0
  //     };
  //   });
  //   dispatch(setOrderLines(nextLines));
  // }, [dispatch, isLineLocked, orderLines, selectedIndexesArray]);



  const handleOverQtyConfirm = useCallback(() => {
    setOverQtyModalIndex(null);
  }, []);

  const handleOverQtyCancel = useCallback(() => {
    if (overQtyModalIndex === null) {
      return;
    }
    dispatch(updateOrderLine({ index: overQtyModalIndex, changes: { OUT_QTY: 0 } }));
    setOverQtyModalIndex(null);
  }, [dispatch, overQtyModalIndex]);

  // 배송 관련 공통 코드 로드
  useEffect(() => {
    const loadShipmentOptions = async () => {
      try {
        const [methodData, logisData] = await Promise.all([
          commonCodeService.getShipMethods(),
          commonCodeService.getLogisCompanies()
        ]);

        setShipMethodOptions(methodData);
        setLogisCompanyOptions(logisData);
      } catch (error) {
        console.error('배송 관련 코드 조회 오류:', error);
      }
    };

    loadShipmentOptions();
  }, []);

  // 컴포넌트 마운트 시 초기 조회 (미초기화 상태에서만 실행)
  useEffect(() => {
    if (!isInitialized && orderSummaries.length === 0) {
      console.log('📦 OrderConfirm 컴포넌트 초기 조회 실행');
      handleSearch();
    }
  }, [handleSearch, isInitialized, orderSummaries.length]);

  return (
    <div className="order-confirm">
      {/* 로딩 오버레이 */}
      {isLoading && (
        <div className="loading-overlay">
          <div className="loading-spinner"></div>
          <div className="loading-text">처리 중...</div>
        </div>
      )}
      
      {/* TOP 섹션 - 검색 조건 및 버튼 */}
      <div className="top-section">
        <h1 className="page-title">
          {currentTab?.menuIcon ? (
            React.createElement(getMenuIcon(currentTab.menuIcon), { size: 16 })
          ) : (
            <i className="fas fa-truck"></i>
          )}
          {currentTab?.title || '출고확정 처리'}
        </h1>

        {/* 검색 조건 */}
        <div className="search-conditions">
          <div className="search-row">
            <div className="search-item">
              <label>발주일자</label>
              <DateRangePicker
                startDate={searchCondition.orderDateFrom}
                endDate={searchCondition.orderDateTo}
                onStartDateChange={(date: string) => handleSearchConditionChange('orderDateFrom', date)}
                onEndDateChange={(date: string) => handleSearchConditionChange('orderDateTo', date)}
              />
            </div>
            <div className="search-item search-item-out-status">
              <label>출고상태</label>
              <select
                value={searchCondition.outStatus}
                onChange={(e) => handleSearchConditionChange('outStatus', e.target.value)}
              >
                {OUT_STATUS_OPTIONS.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="search-item order-search-item">
              <label>브랜드</label>
              <CommonMultiSelect
                commonCodeType="brands"
                selectedValues={searchCondition.brandIds}
                onSelectionChange={(values: string[]) => handleSearchConditionChange('brandIds', values)}
                placeholder="브랜드 선택"
                className="order-multi-select"
              />
            </div>
{/* 
            <div className="agent-search-item">
              <CommonMultiSelect
                label="거래처구분"
                options={agentGbnOptions}
                selectedValues={searchCondition.brandIds}
                onSelectionChange={(values) => handleSearchConditionChange('brandIds', values)}
                placeholder="거래처구분을 선택하세요"
              />
            </div>
 */}


          </div>
          <div className="search-row">
            <div className="search-item">
              <label>거래처명</label>
              <input
                type="text"
                placeholder="거래처명"
                value={searchCondition.agentNm}
                onChange={(e) => handleSearchConditionChange('agentNm', e.target.value)}
              />
            </div>
            <div className="search-item">
              <label>상품명</label>
              <input
                type="text"
                placeholder="상품명"
                value={searchCondition.goodsNm}
                onChange={(e) => handleSearchConditionChange('goodsNm', e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* 액션 버튼 */}
        <div className="action-buttons single-action">
          <div className="right-buttons">
            <button className="btn-new" onClick={handleResetSearch}>
              <i className="fas fa-undo"></i> 초기화
            </button>
            <button className="btn-search" onClick={handleSearch}>
              <i className="fas fa-search"></i> 조회
            </button>
          </div>
        </div>
      </div>

      {/* MAIN 섹션 - LEFT(그리드) + RIGHT(상세정보) */}
      <div className="main-section">
        {/* LEFT 섹션 - 발주 목록 그리드 */}
        <div className="left-section">
          <h3>
            <i className="fas fa-list"></i>
            발주 목록
          </h3>
          
          <div className="grid-container">
            <div className="ag-theme-alpine">
              <AgGridReact
                ref={gridRef}
                columnDefs={columnDefs}
                rowData={orderSummaries}
                rowClassRules={masterRowClassRules}
                onGridReady={onGridReady}
                onRowDoubleClicked={onRowDoubleClicked}
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
          <div className="grid-status-info">
            <span>총 <strong>{orderSummaries.length}</strong>건</span>
            {orderLines.length > 0 && (
              <span className="detail-info">
                <i className="fas fa-info-circle"></i> 선택된 발주 ({orderLines.length}개 상품)
              </span>
            )}
          </div>
        </div>

        {/* RIGHT 섹션 - 발주 상세 정보 및 출고 처리 */}
        <div className="right-section">
          <h3>
            <i className="fas fa-info-circle"></i>
            발주 상세정보
          </h3>

          {orderLines.length > 0 ? (
            <div className="order-detail">
              <div className="order-detail-grid">
                <div className="order-detail-column">
                  {/* 발주 기본 정보 섹션 */}
                  <div className="order-detail-section">
                    <h4>발주 기본 정보</h4>
                    
                    <div className="order-form-compact">
                      <div className="order-inline-grid order-inline-grid-pair">
                        <div className="order-form-item-compact">
                          <label>발주일자</label>
                          <input
                            type="text"
                            value={masterInfo?.ORDER_D ? toDashedDate(masterInfo.ORDER_D) : ''}
                            readOnly
                          />
                        </div>
                        <div className="order-form-item-compact">
                          <label>일련번호</label>
                          <input
                            type="text"
                            value={masterInfo?.ORDER_SEQU != null ? String(masterInfo.ORDER_SEQU) : ''}
                            readOnly
                          />
                        </div>
                      </div>
                      <div className="order-inline-grid order-inline-grid-pair">
                        <div className="order-form-item-compact">
                          <label>거래처명</label>
                          <input
                            type="text"
                            value={masterInfo?.AGENT_NM ?? ''}
                            readOnly
                          />
                        </div>
                        <div className="order-form-item-compact">
                          <label>입고요구일</label>
                          <input
                            type="text"
                            value={masterInfo?.REQUIRE_D ? toDashedDate(masterInfo.REQUIRE_D) : ''}
                            readOnly
                          />
                        </div>
                      </div>
                    </div>

                    {masterInfo?.ORDER_MEMO && (
                      <div className="order-form-row">
                        <div className="order-form-item order-full-width">
                          <label>발주메모</label>
                          <textarea
                            value={masterInfo.ORDER_MEMO}
                            readOnly
                            rows={2}
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  {/* 배송지 정보 섹션 */}
                  <div className="order-detail-section">
                    <h4>배송지 정보</h4>
                    
                    <div className="order-form-compact">
                      <div className="order-inline-grid order-inline-grid-pair">
                        <div className="order-form-item-compact">
                          <label>받는사람</label>
                          <input
                            type="text"
                            value={masterInfo?.RECV_PERSON ?? ''}
                            readOnly
                          />
                        </div>
                        <div className="order-form-item-compact">
                          <label>전화번호</label>
                          <input
                            type="text"
                            value={masterInfo?.RECV_TEL ?? ''}
                            readOnly
                          />
                        </div>
                      </div>
                      <div className="order-form-item-compact order-full-width">
                        <label>배송지주소</label>
                        <input
                          type="text"
                          value={masterInfo?.RECV_ADDR ?? ''}
                          readOnly
                        />
                      </div>
                    </div>

                    {masterInfo?.RECV_MEMO && (
                      <div className="order-form-row">
                        <div className="order-form-item order-full-width">
                          <label>배송메모</label>
                          <textarea
                            value={masterInfo.RECV_MEMO}
                            readOnly
                            rows={2}
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  {/* 출고 처리 정보 섹션 */}
                  <div className="order-detail-section shipment-section">
                    <h4>
                      <i className="fas fa-shipping-fast"></i>
                      출고 처리 정보
                    </h4>
                    
                    <div className="order-form-compact">
                      {/* 출고번호 표시 (출고일이 있을 때만) */}
                      {primaryLine?.OUT_D && primaryLine?.OUTBOUND_NO && (
                        <div className="order-form-row">
                          <div className="order-form-item-compact order-full-width">
                            <label>출고번호</label>
                            <input
                              type="text"
                              value={primaryLine.OUTBOUND_NO}
                              readOnly
                              style={{ backgroundColor: '#f0f8ff', fontWeight: 'bold', color: '#2c5aa0' }}
                            />
                          </div>
                        </div>
                      )}
                      
                      <div className="order-inline-grid order-inline-grid-pair">
                        <div className="order-form-item-compact order-required">
                          <label>
                            출고일자
                            <span className="order-required-mark">*</span>
                          </label>
                          <input
                            type="date"
                            value={toDateInputValue(primaryLine?.OUT_D)}
                            onChange={(e) => {
                              const newDate = toDashedDate(e.target.value);
                              dispatch(
                                setOrderLines(
                                  orderLines.map((line, index) =>
                                    isLineLocked(index) ? line : { ...line, OUT_D: newDate }
                                  )
                                )
                              );
                              dispatch(updateSelectedSummary({ OUT_D: newDate }));
                            }}
                            disabled={hasConfirmedShipment}
                          />
                        </div>
                        <div className="order-form-item-compact order-required">
                          <label>
                            도착예정일
                            <span className="order-required-mark">*</span>
                          </label>
                          <input
                            type="date"
                            value={toDateInputValue(primaryLine?.EST_D)}
                            onChange={(e) => {
                              const newDate = toDashedDate(e.target.value);
                              dispatch(
                                setOrderLines(
                                  orderLines.map((line, index) =>
                                    isLineLocked(index) ? line : { ...line, EST_D: newDate }
                                  )
                                )
                              );
                              dispatch(updateSelectedSummary({ EST_D: newDate }));
                            }}
                            disabled={hasConfirmedShipment}
                          />
                        </div>
                      </div>

                      <div className="order-inline-grid">
                        <div className="order-form-item-compact order-required">
                          <label>
                            배송방법
                            <span className="order-required-mark">*</span>
                          </label>
                          <select
                            value={primaryLine?.SHIP_METHOD || ''}
                            onChange={(e) => updateShipmentField('SHIP_METHOD', e.target.value)}
                            disabled={hasConfirmedShipment}
                          >
                            <option value="">선택하세요</option>
                            {shipMethodOptions.map(option => (
                              <option key={option.value} value={option.value}>
                                {option.label}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div className="order-form-item-compact order-required">
                          <label>
                            배송회사
                            <span className="order-required-mark">*</span>
                          </label>
                          <select
                            value={primaryLine?.SHIP_LOGIS_GBN || ''}
                            onChange={(e) => {
                              const code = e.target.value;
                              const found = logisCompanyOptions.find(option => option.value === code);
                              updateShipmentField('SHIP_LOGIS_GBN', code);
                              updateShipmentField('SHIP_LOGIS_GBN_NM', found?.label || '');
                            }}
                            disabled={hasConfirmedShipment}
                          >
                            <option value="">선택하세요</option>
                            {logisCompanyOptions.map(option => (
                              <option key={option.value} value={option.value}>
                                {option.label}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div className="order-form-item-compact">
                          <label>배송송장번호</label>
                          <input
                            type="text"
                            value={primaryLine?.SHIP_TRANS_NO || ''}
                            maxLength={50}
                            onChange={(e) => updateShipmentField('SHIP_TRANS_NO', e.target.value)}
                            disabled={hasConfirmedShipment}
                          />
                        </div>
                      </div>

                      <div className="order-form-item-compact order-full-width">
                        <label>배송특이사항</label>
                        <textarea
                          value={primaryLine?.SHIP_MEMO || ''}
                          onChange={(e) => updateShipmentField('SHIP_MEMO', e.target.value)}
                          rows={2}
                          maxLength={100}
                          disabled={hasConfirmedShipment}
                        />
                      </div>
                    </div>

                    {hasConfirmedShipment ? (
                      <div className="shipment-status-completed">
                        <i className="fas fa-check-circle"></i>
                        <span>출고 완료</span>
                      </div>
                    ) : readyLineFlags.some(f => f) ? (
                      <div className="shipment-status-ready">
                        <i className="fas fa-clipboard-check"></i>
                        <span>출고 준비 완료</span>
                      </div>
                    ) : plannedLineFlags.some(f => f) ? (
                      <div className="shipment-status-planned">
                        <i className="fas fa-hourglass-half"></i>
                        <span>출고 예정</span>
                      </div>
                    ) : null}
                  </div>
                </div>

                <div className="order-detail-column order-detail-column-products">
                  {/* 발주 상품 목록 섹션 */}
                  <div className="order-detail-section order-detail-section-products full-width">
                    <div className="order-products-header">
                      <h4>
                        <i className="fas fa-boxes"></i>
                        발주 상품 목록 ({orderLines.length}건)
                      </h4>
                      <div className="order-products-actions">
                        <span className="selection-info">
                          선택 <strong>{selectedIndexesArray.length}</strong>건
                        </span>
                        {hasConfirmedShipment && orderLines.length > 0 && orderLines[0]?.OUT_D && (
                          <button
                            className="shipment-btn-send"
                            onClick={() => setShowOutboundSendModal(true)}
                            disabled={isLoading}
                          >
                            <i className="fas fa-envelope"></i> 출고내역서전송
                          </button>
                        )}
                        <button
                          className="shipment-btn-cancel"
                          onClick={prepareCancelShipment}
                          disabled={cancellableIndexes.length === 0}
                        >
                          <i className="fas fa-undo"></i> 출고취소
                        </button>
                        <button
                          className="shipment-btn-save"
                          onClick={handleConfirmShipment}
                          disabled={confirmableIndexes.length === 0 || hasConfirmedShipment}
                          title={hasConfirmedShipment
                            ? '이미 출고확정된 발주입니다.'
                            : (confirmableIndexes.length === 0 ? '유통기한(EXP_QTY)을 1개 이상 입력하면 활성화됩니다.' : '출고확정 가능합니다')}
                        >
                          <i className="fas fa-save"></i> 출고확정
                        </button>
                      </div>
                    </div>
                    
                    <div className="order-products-table">
                      <table>
                        <colgroup>
                          <col className="col-select" />
                          <col className="col-seq" />
                          <col className="col-store-stock" />
                          <col className="col-order-amount" />
                          <col className="col-order-qty" />
                          <col className="col-expiry" />
                          <col className="col-out-qty-sum" />
                          <col className="col-brand" />
                        </colgroup>
                        <thead>
                          <tr>
                            <th rowSpan={2} className="select-cell">
                              <input
                                type="checkbox"
                                ref={selectAllRef}
                                checked={isAllSelected}
                                onChange={toggleSelectAll}
                                disabled={selectableIndexes.length === 0}
                                aria-label="전체 선택"
                              />
                            </th>
                            <th rowSpan={2} className="col-seq">순번</th>
                            <th colSpan={5} className="col-product-name">상품명</th>
                            <th rowSpan={2} className="col-brand">브랜드</th>
                          </tr>
                          <tr>
                            <th className="col-store-stock">매장재고</th>
                            <th className="col-order-amount">발주금액</th>
                            <th className="col-order-qty">발주수량</th>
                            <th className="col-expiry">유통기한일자/출고수량</th>
                            <th className="col-out-qty-sum">
                              <div className="out-qty-header">
                                {/* <div className="out-qty-actions">
                                  <button
                                    type="button"
                                    className="out-qty-btn"
                                    onClick={handleApplyFullShipmentAll}
                                    disabled={!hasEditableLines}
                                    aria-label="발주수량과 동일하게 적용"
                                  >
                                    =
                                  </button>
                                  <button
                                    type="button"
                                    className="out-qty-btn"
                                    onClick={handleResetShipmentAll}
                                    disabled={!hasEditableLines}
                                    aria-label="출고수량 초기화"
                                  >
                                    ≠
                                  </button>
                                </div> */}
                                <span>출고수량계</span>
                              </div>
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {orderLines.map((line, index) => {
                            // 편집 중 입력한 OUT_D는 즉시 확정으로 간주하지 않기 위해 originalOrderLines 기반 플래그 사용
                            const isShipped = shippedLineFlags[index];
                            const isPlanned = plannedLineFlags[index];
                            const isReady = readyLineFlags[index];
                            const expiryDetails = line.expiryDetails || [];
                            const totalExpiryQty = expiryDetails.reduce((sum, exp) => sum + (exp.EXP_QTY || 0), 0);

                            const handleAddExpiry = () => {
                              if (isLineLocked(index) || hasConfirmedShipment) return;
                              const newExpiry: import('../types/orderConfirm').ExpiryDetail = { EXP_D: '', EXP_QTY: 0, LOT_NO: '' };
                              const nextList = [...expiryDetails, newExpiry];
                              const nextTotal = nextList.reduce((s,e)=>s + (e.EXP_QTY || 0), 0);
                              dispatch(updateOrderLine({ index, changes: { expiryDetails: nextList, OUT_QTY: nextTotal } }));
                            };
                            const handleRemoveExpiry = (expIndex: number) => {
                              if (isLineLocked(index) || hasConfirmedShipment) return;
                              const target = expiryDetails[expIndex];
                              const remaining = expiryDetails.filter((_, i) => i !== expIndex);
                              const deletedList = (line.deletedExpirySequ || []).slice();
                              if (target?.EXP_SEQU != null) deletedList.push(target.EXP_SEQU);
                              const nextTotal = remaining.reduce((s,e)=>s + (e.EXP_QTY || 0), 0);
                              dispatch(updateOrderLine({ index, changes: { expiryDetails: remaining, deletedExpirySequ: deletedList, OUT_QTY: nextTotal } }));
                            };
                            const handleUpdateExpiry = (expIndex: number, field: string, value: string | number) => {
                              if (isLineLocked(index) || hasConfirmedShipment) return;
                              const updated = expiryDetails.map((exp, i) => i === expIndex ? { ...exp, [field]: value } : exp);
                              const nextTotal = updated.reduce((s,e)=>s + (e.EXP_QTY || 0), 0);
                              dispatch(updateOrderLine({ index, changes: { expiryDetails: updated, OUT_QTY: nextTotal } }));
                            };

                            return (
                              <React.Fragment key={index}>
                                <tr className={`order-line-row order-line-row-title ${isShipped ? 'order-line-shipped' : (isReady ? 'order-line-ready' : (isPlanned ? 'order-line-planned' : ''))}`}>
                                  <td rowSpan={2} className="select-cell">
                                    <input
                                      type="checkbox"
                                      checked={isLineSelected(index)}
                                      onChange={() => toggleLineSelection(index)}
                                      disabled={isLineLocked(index) || hasConfirmedShipment}
                                      aria-label={`라인 ${line.ORDER_NO} 선택`}
                                    />
                                  </td>
                                  <td rowSpan={2} className="col-seq">{line.ORDER_NO}</td>
                                  <td colSpan={5} className="product-name-merged">{line.GOODS_NM}</td>
                                  <td rowSpan={2} className="brand-cell">{line.BRAND_NM}</td>
                                </tr>
                                <tr className={`order-line-row order-line-row-values ${isShipped ? 'order-line-shipped' : (isReady ? 'order-line-ready' : (isPlanned ? 'order-line-planned' : ''))}`}>
                                  <td className="number store-stock-cell">{formatNumber(line.IN_TOT_QTY || 0)}</td>
                                  <td className="number order-amount-cell">{formatNumber(line.ORDER_TOT || 0)}</td>
                                  <td className="number order-qty-cell">{formatNumber(line.ORDER_QTY || 0)}</td>
                                  <td className="expiry-cell">
                                    <div className="expiry-container">
                                      {expiryDetails.length === 0 ? (
                                        <button type="button" className="btn-add-expiry" onClick={handleAddExpiry} disabled={isLineLocked(index) || hasConfirmedShipment}>
                                          <i className="fas fa-plus"></i> 유통기한 추가
                                        </button>
                                      ) : (
                                        <>
                                          {expiryDetails.map((expiry, expIndex) => (
                                            <div key={expIndex} className="expiry-item">
                                              <input
                                                type="date"
                                                className="expiry-date-input"
                                                value={expiry.EXP_D}
                                                onChange={(e) => handleUpdateExpiry(expIndex, 'EXP_D', e.target.value)}
                                                disabled={isLineLocked(index) || hasConfirmedShipment}
                                                placeholder="유통기한"
                                              />
                                              <input
                                                type="number"
                                                className="expiry-qty-input"
                                                value={expiry.EXP_QTY}
                                                onChange={(e) => handleUpdateExpiry(expIndex, 'EXP_QTY', Number(e.target.value))}
                                                disabled={isLineLocked(index) || hasConfirmedShipment}
                                                placeholder="수량"
                                                min="0"
                                              />
                                              {/* <input
                                                type="text"
                                                className="expiry-lot-input"
                                                value={expiry.LOT_NO || ''}
                                                onChange={(e) => handleUpdateExpiry(expIndex, 'LOT_NO', e.target.value)}
                                                disabled={isLineLocked(index) || hasConfirmedShipment}
                                                placeholder="LOT"
                                                maxLength={50}
                                              /> */}
                                              <button
                                                type="button"
                                                className="btn-remove-expiry"
                                                onClick={() => handleRemoveExpiry(expIndex)}
                                                disabled={isLineLocked(index) || hasConfirmedShipment || (line.expiryDetails?.length ?? 0) <= 1}
                                              >
                                                <i className="fas fa-times"></i>
                                              </button>
                                            </div>
                                          ))}
                                          <button type="button" className="btn-add-expiry-small" onClick={handleAddExpiry} disabled={isLineLocked(index) || hasConfirmedShipment}>
                                            <i className="fas fa-plus"></i>
                                          </button>
                                        </>
                                      )}
                                    </div>
                                  </td>
                                  <td className={`number out-qty-sum-cell ${totalExpiryQty !== (line.ORDER_QTY || 0) ? 'qty-mismatch' : ''}`}>
                                    <div className="out-qty-sum-display">
                                      {formatNumber(totalExpiryQty)}
                                    </div>
                                  </td>
                                </tr>
                              </React.Fragment>
                            );
                          })}
                          <tr>
                            <td className="select-cell"></td>
                            <td className="col-seq">합계</td>
                            <td className="number total">{formatNumber(totalStoreStock)}</td>
                            <td className="number total">{formatNumber(totalOrderAmount)}</td>
                            <td className="number total">{formatNumber(totalOrderQty)}</td>
                            <td className="expiry-cell"></td>
                            <td className="number total">{formatNumber(totalOutQty)}</td>
                            <td className="brand-cell"></td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="shipment-no-selection">
              <i className="fas fa-hand-pointer"></i>
              <p>발주 목록을 더블클릭하면 상세 정보가 표시됩니다</p>
            </div>
          )}
        </div>
      </div>
      <ConfirmationModal
        isOpen={overQtyModalIndex !== null}
        onConfirm={handleOverQtyConfirm}
        onCancel={handleOverQtyCancel}
        type="custom"
        title="출고수량 확인"
        message="출고수량이 발주수량보다 많습니다. 계속 진행하시겠습니까?"
        confirmText="계속"
        cancelText="취소"
      />
      
      {/* 출고내역서전송 모달 */}
      {selectedSummary && orderLines.length > 0 && orderLines[0]?.OUT_D && (
        <OutboundSendModal
          isOpen={showOutboundSendModal}
          onClose={() => setShowOutboundSendModal(false)}
          outboundData={{
            orderDate: selectedSummary.ORDER_D,
            orderSequ: selectedSummary.ORDER_SEQU,
            outDate: orderLines[0].OUT_D || '',
            vendorIds: (() => {
              // 시스템관리자 계정 지원: orderLines에서 모든 VENDOR_ID 수집
              const vendorIdSet = new Set<string>();
              orderLines.forEach(line => {
                if (line.VENDOR_ID) vendorIdSet.add(line.VENDOR_ID);
              });
              return Array.from(vendorIdSet);
            })()
          }}
        />
      )}
      {/* 출고취소 모달 */}
      {showCancelModal && (
        <CancelShipmentModal
          isOpen={showCancelModal}
          onClose={() => setShowCancelModal(false)}
          outDate={cancelModalOutDate}
          lines={cancelModalLines}
          hasInboundLines={cancelModalHasInbound}
          selection={cancelSelection}
          onToggleLine={(orderNo: string) => {
            setCancelSelection(prev => {
              const next = new Set(prev);
              if (next.has(orderNo)) next.delete(orderNo); else next.add(orderNo);
              return next;
            });
          }}
          onSelectAll={() => {
            setCancelSelection(new Set(cancelModalLines.map(l => String(l.ORDER_NO))));
          }}
          onClearSelection={() => setCancelSelection(new Set())}
          onConfirm={performCancelShipment}
        />
      )}
      {showPartialConfirmModal && (
        <PartialConfirmModal
          isOpen={showPartialConfirmModal}
          onClose={() => setShowPartialConfirmModal(false)}
          missingOrderNos={partialMissingLines}
          totalSelectedCount={selectedIndexesArray.length}
          confirmableCount={confirmableIndexes.length}
          onProceed={handlePartialConfirmProceed}
        />
      )}
    </div>
  );
});

OrderConfirm.displayName = 'OrderConfirm';

export default OrderConfirm;

