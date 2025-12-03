import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useSelector } from 'react-redux';
import { AgGridReact } from 'ag-grid-react';
import type {
  ColDef,
  GetRowIdParams,
  GridApi,
  GridReadyEvent,
  ICellRendererParams,
  RowClassParams,
} from 'ag-grid-community';
import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-alpine.css';
import DateRangePicker from './common/DateRangePicker';
import Modal from './common/Modal';
import './common/ConfirmationModal.css';
import CommonMultiSelect from './CommonMultiSelect';
import { RootState } from '../store/store';
import {
  fetchStoreInventoryDetails,
  searchStoreInventorySummaries,
  checkSaveInboundPossible,
  saveStoreInventoryInboundGroup,
  checkCancelInboundPossible,
  cancelStoreInventoryInboundGroup,
  StoreInventoryDetail,
  StoreInventorySearchParams,
  StoreInventorySummary,
} from '../services/storeInventoryManagementService';
import './storeInventoryManagement.css';

type InboundStatus = StoreInventorySearchParams['inboundStatus'];

interface StoreInventorySearchState {
  outboundDateFrom: string;
  outboundDateTo: string;
  vendorIds: string[];
  brandIds: string[];
  storeIds: string[];
  goodsName: string;
  inboundStatus: InboundStatus;
}

const defaultDateRange = () => {
  const today = new Date();
  const end = today.toISOString().slice(0, 10);
  const startDate = new Date(today);
  startDate.setDate(startDate.getDate() - 365);
  const start = startDate.toISOString().slice(0, 10);
  return { start, end };
};

const INBOUND_STATUS_OPTIONS: Array<{ value: InboundStatus; label: string }> = [
  { value: 'ALL', label: '전체' },
  { value: 'PENDING', label: '입고대기' },
  { value: 'COMPLETED', label: '입고완료' },
];

const toPayloadDate = (value: string | null | undefined): string | undefined => {
  if (!value) return undefined;
  const trimmed = value.trim();
  if (!trimmed) return undefined;
  const digitsOnly = trimmed.replace(/[^0-9]/g, '');
  if (digitsOnly.length !== 8) return undefined;
  return `${digitsOnly.slice(0, 4)}-${digitsOnly.slice(4, 6)}-${digitsOnly.slice(6, 8)}`;
};

/**
 * 벤더 출고 기반 매장 입고 관리 화면
 * OrderConfirm 레이아웃을 참고하여 동일한 톤앤매너로 구성
 */
const StoreInventoryManagement: React.FC = () => {
  const { start, end } = useMemo(defaultDateRange, []);

  const [searchState, setSearchState] = useState<StoreInventorySearchState>({
    outboundDateFrom: start,
    outboundDateTo: end,
    vendorIds: [],
    brandIds: [],
    storeIds: [],
    goodsName: '',
    inboundStatus: 'ALL',
  });

  const [summaries, setSummaries] = useState<StoreInventorySummary[]>([]);
  const [selectedSummary, setSelectedSummary] = useState<StoreInventorySummary | null>(null);
  const [details, setDetails] = useState<StoreInventoryDetail[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isDetailLoading, setIsDetailLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [savingBulk, setSavingBulk] = useState(false);
  // 공통 Modal 사용
  const [modalState, setModalState] = useState<{
    open: boolean;
    title?: string;
    content?: React.ReactNode;
    footer?: React.ReactNode;
  }>({ open: false });

  const openModal = useCallback((title: string, content: React.ReactNode, footer?: React.ReactNode) => {
    setModalState({ open: true, title, content, footer });
  }, []);
  const closeModal = useCallback(() => {
    setModalState({ open: false });
  }, []);
  const [selectedDetailKeys, setSelectedDetailKeys] = useState<Set<string>>(new Set());
  // 각 상세 행의 원본 총입고수량을 기억
  const [originalInTotQtys, setOriginalInTotQtys] = useState<Record<string, number>>({});
  // 항상 최신 selectedDetailKeys를 참조하기 위한 useRef
  const selectedDetailKeysRef = useRef(selectedDetailKeys);
  useEffect(() => {
    selectedDetailKeysRef.current = selectedDetailKeys;
  }, [selectedDetailKeys]);
  const [isAllDetailsSelected, setIsAllDetailsSelected] = useState(false);
  // Bulk inbound date (for applying a single date to selected detail rows)
  const [bulkInboundDate, setBulkInboundDate] = useState<string>(new Date().toISOString().slice(0, 10));

  const { user } = useSelector((state: RootState) => state.auth);

  const loginUserId = useMemo(
    () =>
      user?.userId !== undefined && user?.userId !== null ? String(user.userId) : undefined,
    [user?.userId],
  );
  const loginRoleName = useMemo(
    () => (user?.roleName && user.roleName.trim().length > 0 ? user.roleName : undefined),
    [user?.roleName],
  );
  const loginAgentId = useMemo(() => {
    if (user?.agentId === undefined || user.agentId === null) {
      return undefined;
    }
    const numeric = Number(user.agentId);
    return Number.isFinite(numeric) ? numeric : undefined;
  }, [user?.agentId]);

  const summaryGridRef = useRef<AgGridReact<StoreInventorySummary>>(null);
  const summaryGridApiRef = useRef<GridApi<StoreInventorySummary> | null>(null);

  const autoSizeSummaryColumns = useCallback(() => {
    const api = summaryGridApiRef.current;
    if (!api) return;
    const columns = api.getColumns();
    if (!columns || columns.length === 0) return;
    const colIds = columns.map((col) => col.getId());
    api.autoSizeColumns(colIds, false);
  }, []);

  const formatSummaryDateValue = useCallback((value?: string | null) => {
    if (!value) return '';
    const digits = value.replace(/[^0-9]/g, '');
    if (digits.length === 8) {
      return `${digits.slice(0, 4)}-${digits.slice(4, 6)}-${digits.slice(6, 8)}`;
    }
    return value;
  }, []);

  const formatSummaryNumberValue = useCallback((value?: number | null) => {
    if (value === null || value === undefined) {
      return '0';
    }
    return new Intl.NumberFormat('ko-KR').format(value);
  }, []);

  const describePrimaryGoods = useCallback((data?: StoreInventorySummary | null) => {
    if (!data) return '-';
    const base = (data.firstGoodsNm ?? '').trim();
    const additional = data.additionalItemCount ?? 0;
    if (!base) {
      return additional > 0 ? `외 ${additional}건` : '-';
    }
    return additional > 0 ? `${base} 외 ${additional}건` : base;
  }, []);

  const renderStatusCell = useCallback(
    (params: ICellRendererParams<StoreInventorySummary, StoreInventorySummary['status']>) => {
      const status = (params.value ?? 'PENDING') as StoreInventorySummary['status'];
      const label =
        status === 'COMPLETED' ? '입고완료' : status === 'PARTIAL' ? '부분입고' : '입고대기';
      return <span className={`status-badge status-${status.toLowerCase()}`}>{label}</span>;
    },
    [],
  );

  const summaryColumnDefs = useMemo<ColDef<StoreInventorySummary>[]>(
    () => [
      {
        headerName: '발주일자',
        field: 'orderD',
        minWidth: 110,
        valueFormatter: (params) => formatSummaryDateValue(params.value as string | null | undefined),
        tooltipValueGetter: (params) => formatSummaryDateValue(params.value as string | null | undefined),
      },
      {
        headerName: '일련번호',
        field: 'orderSequ',
        minWidth: 80,
      },
      {
        headerName: '매장',
        field: 'agentNm',
        minWidth: 140,
        tooltipField: 'agentNm',
      },
      {
        headerName: '벤더',
        field: 'vendorNm',
        minWidth: 160,
        tooltipField: 'vendorNm',
      },
      {
        headerName: '브랜드',
        field: 'brandNm',
        minWidth: 120,
        tooltipField: 'brandNm',
      },
      {
        headerName: '주요 상품',
        field: 'firstGoodsNm',
        minWidth: 200,
        valueGetter: ({ data }) => describePrimaryGoods(data),
        tooltipValueGetter: ({ data }) => describePrimaryGoods(data),
      },
      {
        headerName: '발주수량',
        field: 'totalOrderQty',
        minWidth: 110,
        cellClass: 'inventory-number-cell ag-right-aligned-cell',
        valueFormatter: (params) => formatSummaryNumberValue(params.value as number | null | undefined),
        tooltipValueGetter: (params) => formatSummaryNumberValue(params.value as number | null | undefined),
      },
      {
        headerName: '출고수량',
        field: 'totalOutQty',
        minWidth: 110,
        cellClass: 'inventory-number-cell ag-right-aligned-cell',
        valueFormatter: (params) => formatSummaryNumberValue(params.value as number | null | undefined),
        tooltipValueGetter: (params) => formatSummaryNumberValue(params.value as number | null | undefined),
      },
      {
        headerName: '입고수량',
        field: 'totalInQty',
        minWidth: 110,
        cellClass: 'inventory-number-cell ag-right-aligned-cell',
        valueFormatter: (params) => formatSummaryNumberValue(params.value as number | null | undefined),
        tooltipValueGetter: (params) => formatSummaryNumberValue(params.value as number | null | undefined),
      },
      {
        headerName: '대기수량',
        field: 'pendingQty',
        minWidth: 110,
        cellClass: 'inventory-number-cell ag-right-aligned-cell',
        valueFormatter: (params) => formatSummaryNumberValue(params.value as number | null | undefined),
        tooltipValueGetter: (params) => formatSummaryNumberValue(params.value as number | null | undefined),
      },
      {
        headerName: '상태',
        field: 'status',
        minWidth: 110,
        cellRenderer: renderStatusCell,
        sortable: false,
        filter: false,
        resizable: false,
      },
    ],
    [describePrimaryGoods, formatSummaryDateValue, formatSummaryNumberValue, renderStatusCell],
  );

  const summaryDefaultColDef = useMemo<ColDef>(
    () => ({
      resizable: true,
      sortable: true,
      filter: true,
      suppressMenu: true,
    }),
    [],
  );

  const summaryRowClassRules = useMemo(
    () => ({
      'is-active': (params: RowClassParams<StoreInventorySummary>) => {
        if (!selectedSummary || !params.data) {
          return false;
        }
        return (
          params.data.orderD === selectedSummary.orderD &&
          params.data.orderSequ === selectedSummary.orderSequ &&
          params.data.vendorId === selectedSummary.vendorId &&
          params.data.agentId === selectedSummary.agentId
        );
      },
      'status-completed': (params: RowClassParams<StoreInventorySummary>) => {
        return params.data?.status === 'COMPLETED';
      },
    }),
    [selectedSummary],
  );

  const getSummaryRowId = useCallback(
    (params: GetRowIdParams<StoreInventorySummary>) => {
      const data = params.data;
      if (!data) return '';
      return `${data.orderD ?? ''}-${data.orderSequ ?? ''}-${data.agentId ?? ''}-${data.vendorId ?? ''}`;
    },
    [],
  );

  const loadDetails = useCallback(
    async (summary: StoreInventorySummary) => {
      setIsDetailLoading(true);
      setErrorMessage(null);
      try {
        const data = await fetchStoreInventoryDetails(
          summary.orderD,
          summary.orderSequ,
          summary.vendorId,
          {
            userId: loginUserId,
            roleName: loginRoleName,
            agentId: loginAgentId,
          },
        );
        // 각 상세에 summary의 orderD, orderSequ, vendorId를 할당 (히든 필드처럼)
        const detailsWithKeys = data.map((d) => ({
          ...d,
          orderD: summary.orderD,
          orderSequ: summary.orderSequ,
          vendorId: Number(summary.vendorId),
        }));
        setDetails(detailsWithKeys);
        // 원본 총입고수량 기억
        const qtyMap: Record<string, number> = {};
        detailsWithKeys.forEach((d) => {
          const key = `${String(d.orderNo)}-${String(d.goodsId)}`;
          qtyMap[key] = d.inTotQty ?? ((d.inGoodQty ?? 0) + (d.inBadQty ?? 0));
        });
        setOriginalInTotQtys(qtyMap);
        return detailsWithKeys;
      } catch (error) {
        console.error('입고 상세 조회 중 오류 발생:', error);
        setErrorMessage('입고 상세 정보를 불러오는 데 실패했습니다.');
        setDetails([]);
        return [];
      } finally {
        setIsDetailLoading(false);
      }
    },
    [loginUserId, loginRoleName, loginAgentId],
  );

  const handleSummaryGridReady = useCallback((event: GridReadyEvent<StoreInventorySummary>) => {
    summaryGridApiRef.current = event.api;
    autoSizeSummaryColumns();
  }, [autoSizeSummaryColumns]);

  const handleSearchStateChange = useCallback(
    (field: keyof StoreInventorySearchState, value: string | string[]) => {
      setSearchState((prev) => ({
        ...prev,
        [field]: value,
      }));
    },
    [],
  );

  const normalizedSearchParams = useMemo<StoreInventorySearchParams>(
    () => {
      const outboundDateFrom = toPayloadDate(searchState.outboundDateFrom);
      const outboundDateTo = toPayloadDate(searchState.outboundDateTo);

      const base: StoreInventorySearchParams = {
        vendorIds: searchState.vendorIds.map((value) => value.trim()).filter(Boolean),
        brandIds: searchState.brandIds.map((value) => value.trim()).filter(Boolean),
        storeIds: searchState.storeIds.map((value) => value.trim()).filter(Boolean),
        inboundStatus: searchState.inboundStatus,
      };

      const goodsName = searchState.goodsName.trim();
      if (goodsName.length > 0) {
        base.goodsName = goodsName;
      }

      if (outboundDateFrom) {
        base.outboundDateFrom = outboundDateFrom;
      }

      if (outboundDateTo) {
        base.outboundDateTo = outboundDateTo;
      }

      return base;
    },
    [searchState],
  );

  const handleSearch = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const result = await searchStoreInventorySummaries(normalizedSearchParams, {
        userId: loginUserId,
        roleName: loginRoleName,
        agentId: loginAgentId,
      });
      setSummaries(result);
      setSelectedSummary(null);
      setDetails([]);
    } catch (error) {
      console.error('매장 입고 내역 조회 중 오류 발생:', error);
      setErrorMessage('입고 내역을 불러오는 데 실패했습니다. 잠시 후 다시 시도해주세요.');
      setSummaries([]);
      setSelectedSummary(null);
      setDetails([]);
    } finally {
      setIsLoading(false);
    }
  }, [normalizedSearchParams, loginUserId, loginRoleName, loginAgentId]);

  const handleReset = useCallback(() => {
    const { start: defaultStart, end: defaultEnd } = defaultDateRange();
    setSearchState({
      outboundDateFrom: defaultStart,
      outboundDateTo: defaultEnd,
      vendorIds: [],
      brandIds: [],
      storeIds: [],
      goodsName: '',
      inboundStatus: 'ALL',
    });
    setSummaries([]);
    setSelectedSummary(null);
    setDetails([]);
    setErrorMessage(null);
  }, []);

  const handleDetailQuantityChange = useCallback(
    (index: number, field: 'inGoodQty' | 'inBadQty', rawValue: string) => {
      const normalized = rawValue.trim() === '' ? 0 : Number(rawValue);
      if (!Number.isFinite(normalized) || normalized < 0) {
        return;
      }
      setDetails((prev) => {
        const nextDetails = prev.map((item, idx) => {
          if (idx !== index) return item;
          const nextGood = field === 'inGoodQty' ? normalized : Number(item.inGoodQty ?? 0);
          const nextBad = field === 'inBadQty' ? normalized : Number(item.inBadQty ?? 0);
          return {
            ...item,
            [field]: normalized,
            inTotQty: nextGood + nextBad,
          };
        });
        // 체크박스 상태 갱신
        const changedKeys = nextDetails
          .map((item) => {
            const key = `${String(item.orderNo)}-${String(item.goodsId)}`;
            const original = originalInTotQtys[key] ?? 0;
            const now = item.inTotQty ?? ((item.inGoodQty ?? 0) + (item.inBadQty ?? 0));
            return now !== original ? key : null;
          })
          .filter(Boolean) as string[];
        setSelectedDetailKeys(new Set(changedKeys));
        return nextDetails;
      });
    },
    [details],
  );

  const handleApplyAllGoodEqual = useCallback(() => {
    setDetails((prev) => {
      const nextDetails = prev.map((detail) => {
        const nextGood = detail.outQty ?? 0;
        return {
          ...detail,
          inGoodQty: nextGood,
          inTotQty: nextGood + (detail.inBadQty ?? 0),
        };
      });
      // 하나라도 바뀌면 전체 체크, 모두 원래 값이면 해제
      const anyChanged = nextDetails.some((item) => {
        const key = `${String(item.orderNo)}-${String(item.goodsId)}`;
        const original = originalInTotQtys[key] ?? 0;
        const now = item.inTotQty ?? ((item.inGoodQty ?? 0) + (item.inBadQty ?? 0));
        return now !== original;
      });
      if (anyChanged) {
        const allKeys = nextDetails.map((item) => `${String(item.orderNo)}-${String(item.goodsId)}`);
        setSelectedDetailKeys(new Set(allKeys));
      } else {
        setSelectedDetailKeys(new Set());
      }
      return nextDetails;
    });
  }, [details, originalInTotQtys]);

  const handleApplyAllGoodReset = useCallback(() => {
    setDetails((prev) => {
      const nextDetails = prev.map((detail) => ({
        ...detail,
        inGoodQty: 0,
        inTotQty: detail.inBadQty ?? 0,
      }));
      const anyChanged = nextDetails.some((item) => {
        const key = `${String(item.orderNo)}-${String(item.goodsId)}`;
        const original = originalInTotQtys[key] ?? 0;
        const now = item.inTotQty ?? ((item.inGoodQty ?? 0) + (item.inBadQty ?? 0));
        return now !== original;
      });
      if (anyChanged) {
        const allKeys = nextDetails.map((item) => `${String(item.orderNo)}-${String(item.goodsId)}`);
        setSelectedDetailKeys(new Set(allKeys));
      } else {
        setSelectedDetailKeys(new Set());
      }
      return nextDetails;
    });
  }, [details, originalInTotQtys]);

  const handleApplyAllBadEqual = useCallback(() => {
    setDetails((prev) => {
      const nextDetails = prev.map((detail) => {
        const baseOut = detail.outQty ?? 0;
        const currentGood = detail.inGoodQty ?? 0;
        const nextBad = Math.max(baseOut - currentGood, 0);
        return {
          ...detail,
          inBadQty: nextBad,
          inTotQty: currentGood + nextBad,
        };
      });
      const anyChanged = nextDetails.some((item) => {
        const key = `${String(item.orderNo)}-${String(item.goodsId)}`;
        const original = originalInTotQtys[key] ?? 0;
        const now = item.inTotQty ?? ((item.inGoodQty ?? 0) + (item.inBadQty ?? 0));
        return now !== original;
      });
      if (anyChanged) {
        const allKeys = nextDetails.map((item) => `${String(item.orderNo)}-${String(item.goodsId)}`);
        setSelectedDetailKeys(new Set(allKeys));
      } else {
        setSelectedDetailKeys(new Set());
      }
      return nextDetails;
    });
  }, [details, originalInTotQtys]);

  const handleApplyAllBadReset = useCallback(() => {
    setDetails((prev) => {
      const nextDetails = prev.map((detail) => ({
        ...detail,
        inBadQty: 0,
        inTotQty: detail.inGoodQty ?? 0,
      }));
      const anyChanged = nextDetails.some((item) => {
        const key = `${String(item.orderNo)}-${String(item.goodsId)}`;
        const original = originalInTotQtys[key] ?? 0;
        const now = item.inTotQty ?? ((item.inGoodQty ?? 0) + (item.inBadQty ?? 0));
        return now !== original;
      });
      if (anyChanged) {
        const allKeys = nextDetails.map((item) => `${String(item.orderNo)}-${String(item.goodsId)}`);
        setSelectedDetailKeys(new Set(allKeys));
      } else {
        setSelectedDetailKeys(new Set());
      }
      return nextDetails;
    });
  }, [details, originalInTotQtys]);

  /*
  // 미사용: 선택된 상세 행에 일괄 입고일자 적용 함수
  const handleApplyBulkInboundDate = useCallback(() => {
    if (!bulkInboundDate) {
      openModal('입고일 선택', '적용할 입고일을 선택하세요.');
      return;
    }
    if (selectedDetailKeys.size === 0) {
      openModal('선택 필요', '입고일을 적용할 상세 행을 선택하세요.');
      return;
    }
    setDetails((prev) =>
      prev.map((d) => {
        const key = `${d.orderNo}-${d.goodsId}`;
        if (selectedDetailKeys.has(key)) {
          return { ...d, inD: bulkInboundDate };
        }
        return d;
      }),
    );
  }, [bulkInboundDate, selectedDetailKeys]);
  */

  const recalculateSummaryTotals = useCallback(
    (summary: StoreInventorySummary, detailList: StoreInventoryDetail[]) => {
      const totalInQty = detailList.reduce((acc, item) => {
        const good = item.inGoodQty ?? 0;
        const bad = item.inBadQty ?? 0;
        const total = item.inTotQty ?? good + bad;
        return acc + total;
      }, 0);

      const pendingQty = detailList.reduce((acc, item) => {
        const orderQty = item.orderQty ?? 0;
        const total = item.inTotQty ?? (item.inGoodQty ?? 0) + (item.inBadQty ?? 0);
        return acc + Math.max(0, orderQty - total);
      }, 0);

      const nextStatus: StoreInventorySummary['status'] =
        totalInQty >= Number(summary.totalOrderQty ?? 0)
          ? 'COMPLETED'
          : totalInQty > 0
          ? 'PARTIAL'
          : 'PENDING';

      return {
        totalInQty,
        pendingQty,
        status: nextStatus,
      };
    },
    [],
  );


  // YYYY-MM-DD 형식 및 유효한 날짜인지 검사
  const isValidInboundDate = (dateStr: string | undefined | null) => {
    if (!dateStr) return false;
    if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return false;
    const d = new Date(dateStr);
    return !isNaN(d.getTime()) && dateStr === d.toISOString().slice(0, 10);
  };

  // 입고확정 실제 처리 함수 (async)
  const doBulkSaveSelected = useCallback(async () => {
    const selectedKeys = selectedDetailKeysRef.current;
    const checkedDetails = details.filter((detail) => {
      const key = `${String(detail.orderNo)}-${String(detail.goodsId)}`;
      return selectedKeys.has(key);
    });
    if (!selectedSummary) {
      openModal('발주 건 선택', '발주 건을 먼저 선택해주세요.');
      return;
    }
    const checkedDetailsWithSummary = checkedDetails.map((d) => ({ ...d }));
    if (checkedDetailsWithSummary.length === 0) {
      openModal('선택 필요', '입고확정할 상세 행을 선택하세요.');
      return;
    }
    const validDetails = checkedDetailsWithSummary.filter(
      (d) =>
        d.orderNo != null &&
        d.goodsId != null && String(d.goodsId).trim() !== '' &&
        d.inGoodQty != null && d.inBadQty != null && d.inTotQty != null
    );
    if (validDetails.length === 0) {
      openModal('저장 불가', '선택된 상세 내역에 저장할 데이터가 없습니다.');
      return;
    }
    if (validDetails.length !== checkedDetailsWithSummary.length) {
      openModal('필수값 누락', '선택된 상세 내역 중 필수값이 누락된 라인이 있습니다.\n수량과 상품 정보를 모두 입력해 주세요.');
      return;
    }
    // 입고일자 유효성 검사
    if (!isValidInboundDate(bulkInboundDate)) {
      openModal('입고일자 오류', '유효한 입고일자를 입력하세요. (YYYY-MM-DD)');
      return;
    }
    const debugPayload = validDetails.map((d) => ({
      orderNo: d.orderNo,
      goodsId: d.goodsId,
      orderD: d.orderD ?? selectedSummary.orderD,
      orderSequ: d.orderSequ ?? selectedSummary.orderSequ,
      vendorId: d.vendorId ?? selectedSummary.vendorId,
      inMemo: d.inMemo || '',
      inGoodQty: d.inGoodQty ?? 0,
      inBadQty: d.inBadQty ?? 0,
      inTotQty: d.inTotQty ?? ((d.inGoodQty ?? 0) + (d.inBadQty ?? 0)),
    }));
    if (!loginUserId) {
      openModal('로그인 필요', '로그인 정보가 필요합니다. 다시 로그인해주세요.');
      return;
    }
    setSavingBulk(true);
    try {
      const canSave = await checkSaveInboundPossible(
        selectedSummary.orderD,
        selectedSummary.orderSequ,
        selectedSummary.vendorId,
        {
          userId: loginUserId,
          roleName: loginRoleName,
          agentId: loginAgentId,
        },
      );
      if (!canSave) {
        openModal('입고 불가', '이 발주 그룹에 이미 입고 확정된 항목이 있습니다.\n입고 취소 후 다시 시도해주세요.');
        return;
      }
      const response = await saveStoreInventoryInboundGroup(
        {
          orderDate: selectedSummary.orderD,
          orderSequ: selectedSummary.orderSequ,
          vendorId: selectedSummary.vendorId,
          inDate: bulkInboundDate,
          details: debugPayload,
        },
        {
          userId: loginUserId,
          roleName: loginRoleName,
          agentId: loginAgentId,
        },
      );
      if (!response.success) {
        openModal('입고 실패', response.message || '입고 처리 중 오류가 발생했습니다.');
        return;
      }
      const refreshedDetails = await loadDetails(selectedSummary);
      const totals = recalculateSummaryTotals(selectedSummary, refreshedDetails);
      setSummaries((prev) =>
        prev.map((item) =>
          item.orderD === selectedSummary.orderD && item.orderSequ === selectedSummary.orderSequ
            ? { ...item, ...totals }
            : item,
        ),
      );
      setSelectedSummary((prev) =>
        prev && prev.orderD === selectedSummary.orderD && prev.orderSequ === selectedSummary.orderSequ
          ? { ...prev, ...totals }
          : prev,
      );
      const resultList = (response.details && response.details.length > 0)
        ? response.details
        : validDetails.map((d) => ({ ...d, status: '확정' } as any));
      const contentNode = (
        <div className="result-summary">
          <p>{response.message || '입고 처리가 완료되었습니다.'}</p>
          <div className="result-table-wrapper">
            <table className="result-table">
              <thead>
                <tr>
                  <th>순번</th>
                  <th>상품코드</th>
                  <th>상품명</th>
                  <th>입고(양호)</th>
                  <th>입고(불량)</th>
                  <th>총입고</th>
                  <th>메모</th>
                  <th>상태</th>
                </tr>
              </thead>
              <tbody>
                {resultList.map((rd: any, idx: number) => {
                  const matched = validDetails.find((v) => v.orderNo === rd.orderNo && String(v.goodsId) === String(rd.goodsId));
                  const goodsNm = rd.goodsNm ?? matched?.goodsNm ?? '-';
                  const inGood = rd.inGoodQty ?? matched?.inGoodQty ?? 0;
                  const inBad = rd.inBadQty ?? matched?.inBadQty ?? 0;
                  const inTot = rd.inTotQty ?? matched?.inTotQty ?? (inGood + inBad);
                  const memo = rd.inMemo ?? matched?.inMemo ?? '';
                  const status = rd.status ?? (rd.RESULT || '확정');
                  return (
                    <tr key={`${rd.orderNo}-${rd.goodsId}-${idx}`}>
                      <td>{idx + 1}</td>
                      <td>{String(rd.goodsId)}</td>
                      <td>{goodsNm}</td>
                      <td className="number">{new Intl.NumberFormat('ko-KR').format(inGood)}</td>
                      <td className="number">{new Intl.NumberFormat('ko-KR').format(inBad)}</td>
                      <td className="number">{new Intl.NumberFormat('ko-KR').format(inTot)}</td>
                      <td>{memo}</td>
                      <td>{String(status)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      );
      openModal('입고 완료', contentNode);
    } catch (error) {
      console.error('그룹 입고 처리 중 오류:', error);
      openModal('입고 실패', '입고 처리 중 오류가 발생했습니다.');
    } finally {
      setSavingBulk(false);
    }
  }, [selectedSummary, loginUserId, loginRoleName, loginAgentId, bulkInboundDate, loadDetails, recalculateSummaryTotals, details]);

  // 입고확정 버튼 클릭 시: 확인 모달
  const handleBulkSaveSelected = useCallback(() => {
    openModal(
      '입고 확정',
      <div className="confirmation-content">
        <div className="confirmation-icon">
          <i className="fas fa-clipboard-check" style={{ color: '#2563eb' }}></i>
        </div>
        <div className="confirmation-message">
          <p>선택된 항목을 <b>입고확정</b> 처리하시겠습니까?</p>
        </div>
      </div>,
      <div className="confirmation-actions">
        <button className="btn-confirmation-cancel" onClick={closeModal}>
          <i className="fas fa-times"></i> 취소
        </button>
        <button className="btn-confirmation-confirm btn-confirm-update" onClick={() => { closeModal(); doBulkSaveSelected(); }}>
          <i className="fas fa-clipboard-check"></i> 확정
        </button>
      </div>
    );
  }, [doBulkSaveSelected, closeModal]);

  /**
   * 그룹 단위 입고 취소 (새로운 방식)
   * ORDER_D + ORDER_SEQU + VENDOR_ID 그룹 전체를 한 번에 취소
   */

  // 입고취소 실제 처리 함수 (async)
  const doCancelInboundGroup = useCallback(async () => {
    if (!selectedSummary) {
      openModal('발주 건 선택', '발주 건을 먼저 선택해주세요.');
      return;
    }
    if (!loginUserId) {
      openModal('로그인 필요', '로그인 정보가 필요합니다. 다시 로그인해주세요.');
      return;
    }
    // 입고일자 유효성 검사 (입고확정된 건에만 적용)
    if (!isValidInboundDate(bulkInboundDate)) {
      openModal('입고일자 오류', '유효한 입고일자를 입력하세요. (YYYY-MM-DD)');
      return;
    }
    setSavingBulk(true);
    try {
      const canCancel = await checkCancelInboundPossible(
        selectedSummary.orderD,
        selectedSummary.orderSequ,
        selectedSummary.vendorId,
        {
          userId: loginUserId,
          roleName: loginRoleName,
          agentId: loginAgentId,
        },
      );
      if (!canCancel) {
        openModal('취소 불가', '입고 확정된 항목이 없습니다. 취소할 항목이 없습니다.');
        return;
      }
      const response = await cancelStoreInventoryInboundGroup(
        {
          orderDate: selectedSummary.orderD,
          orderSequ: selectedSummary.orderSequ,
          vendorId: selectedSummary.vendorId,
        },
        {
          userId: loginUserId,
          roleName: loginRoleName,
          agentId: loginAgentId,
        },
      );
      if (!response.success) {
        openModal('입고 취소 실패', response.message || '입고 취소 중 오류가 발생했습니다.');
        return;
      }
      const refreshedDetails = await loadDetails(selectedSummary);
      const totals = recalculateSummaryTotals(selectedSummary, refreshedDetails);
      setSummaries((prev) =>
        prev.map((item) =>
          item.orderD === selectedSummary.orderD && item.orderSequ === selectedSummary.orderSequ
            ? { ...item, ...totals }
            : item,
        ),
      );
      setSelectedSummary((prev) =>
        prev && prev.orderD === selectedSummary.orderD && prev.orderSequ === selectedSummary.orderSequ
          ? { ...prev, ...totals }
          : prev,
      );
      openModal('입고 취소 완료', response.message || '입고 취소가 완료되었습니다.');
    } catch (error) {
      console.error('그룹 입고 취소 중 오류:', error);
      openModal('입고 취소 실패', '입고 취소 중 오류가 발생했습니다.');
    } finally {
      setSavingBulk(false);
    }
  }, [selectedSummary, loginUserId, loginRoleName, loginAgentId, loadDetails, recalculateSummaryTotals]);

  // 입고취소 버튼 클릭 시: 확인 모달
  const handleCancelInboundGroup = useCallback(() => {
    openModal(
      '입고 취소',
      <div className="confirmation-content">
        <div className="confirmation-icon">
          <i className="fas fa-times-circle" style={{ color: '#ef4444' }}></i>
        </div>
        <div className="confirmation-message">
          <p>이 발주건의 <b>입고확정</b>을 <span style={{color:'#ef4444'}}>취소</span>하시겠습니까?</p>
        </div>
      </div>,
      <div className="confirmation-actions">
        <button className="btn-confirmation-cancel" onClick={closeModal}>
          <i className="fas fa-times"></i> 취소
        </button>
        <button className="btn-confirmation-confirm btn-confirm-delete" onClick={() => { closeModal(); doCancelInboundGroup(); }}>
          <i className="fas fa-times-circle"></i> 취소확정
        </button>
      </div>
    );
  }, [doCancelInboundGroup, closeModal]);

  useEffect(() => {
    handleSearch().catch((error) => {
      console.error('초기 입고 내역 조회 중 오류 발생:', error);
    });
  }, [handleSearch]);

  useEffect(() => {
    autoSizeSummaryColumns();
  }, [autoSizeSummaryColumns, summaries]);

  // 입고확정(상세 중 inD가 하나라도 있으면) 시 대기수량은 0
  const pendingCount = useMemo(() => {
    if (details.length === 0) return 0;
    // 하나라도 확정된 상세가 있으면 대기수량 0
    if (details.some((d) => !!d.inD)) return 0;
    return details.reduce((acc, item) => {
      const orderQty = item.orderQty ?? 0;
      const total = item.inTotQty ?? (item.inGoodQty ?? 0) + (item.inBadQty ?? 0);
      return acc + Math.max(0, orderQty - total);
    }, 0);
  }, [details]);

  const toggleDetailSelection = useCallback((detail: StoreInventoryDetail) => {
    const key = `${String(detail.orderNo)}-${String(detail.goodsId)}`;
    setSelectedDetailKeys((prev) => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  }, []);

  const toggleSelectAllDetails = useCallback(
    (nextChecked: boolean) => {
      if (nextChecked) {
        const allKeys = details.map((detail) => `${String(detail.orderNo)}-${String(detail.goodsId)}`);
        setSelectedDetailKeys(new Set(allKeys));
        setIsAllDetailsSelected(true);
      } else {
        setSelectedDetailKeys(new Set());
        setIsAllDetailsSelected(false);
      }
    },
    [details],
  );

  useEffect(() => {
    // Avoid infinite re-render: only reset selection when there was something selected.
    if (details.length === 0) {
      if (selectedDetailKeys.size > 0) {
        setSelectedDetailKeys(new Set());
      }
      if (isAllDetailsSelected) {
        setIsAllDetailsSelected(false);
      }
      return;
    }
    const allKeys = details.map((detail) => `${String(detail.orderNo)}-${String(detail.goodsId)}`);
    const everySelected = allKeys.every((key) => selectedDetailKeys.has(key));
    if (everySelected !== isAllDetailsSelected) {
      setIsAllDetailsSelected(everySelected);
    }
  }, [details, selectedDetailKeys, isAllDetailsSelected]);

  // 상세 중 한 건이라도 inD(입고일자)가 있으면 true
  const anyConfirmed = details.some((d) => !!d.inD);
  const allPending = details.length > 0 && details.every((d) => !d.inD);

  return (
    <div className="order-confirm order-confirm--inventory">
      <div className="top-section">
        <h1 className="page-title">
          <i className="fas fa-dolly-flatbed" />
          입고 관리
        </h1>

        <div className="search-conditions">
          <div className="search-row">
            <div className="search-item">
              <label htmlFor="outbound-date-range">출고 일자</label>
              <DateRangePicker
                startDate={searchState.outboundDateFrom}
                endDate={searchState.outboundDateTo}
                onStartDateChange={(value) => handleSearchStateChange('outboundDateFrom', value)}
                onEndDateChange={(value) => handleSearchStateChange('outboundDateTo', value)}
              />
            </div>
            <div className="search-item">
              <label htmlFor="store-select">매장</label>
              <CommonMultiSelect
                commonCodeType="stores"
                selectedValues={searchState.storeIds}
                onSelectionChange={(values) => handleSearchStateChange('storeIds', values)}
                placeholder="입고 매장을 선택하세요"
                className="olm-multi-select"
              />
            </div>
            <div className="search-item">
              <label htmlFor="vendor-select">벤더</label>
              <CommonMultiSelect
                commonCodeType="vendors"
                selectedValues={searchState.vendorIds}
                onSelectionChange={(values) => handleSearchStateChange('vendorIds', values)}
                placeholder="벤더를 선택하세요"
                className="olm-multi-select"
              />
            </div>
          </div>

          <div className="search-row">
            <div className="search-item">
              <label htmlFor="brand-select">브랜드</label>
              <CommonMultiSelect
                commonCodeType="brands"
                selectedValues={searchState.brandIds}
                onSelectionChange={(values) => handleSearchStateChange('brandIds', values)}
                placeholder="브랜드를 선택하세요"
                className="olm-multi-select"
              />
            </div>
            <div className="search-item">
              <label htmlFor="goods-name">상품명 / 코드</label>
              <input
                id="goods-name"
                type="text"
                value={searchState.goodsName}
                onChange={(event) => handleSearchStateChange('goodsName', event.target.value)}
                placeholder="상품명 또는 코드"
              />
            </div>
            <div className="search-item">
              <label htmlFor="inbound-status">입고 상태</label>
              <select
                id="inbound-status"
                value={searchState.inboundStatus}
                onChange={(event) =>
                  handleSearchStateChange('inboundStatus', event.target.value as InboundStatus)
                }
              >
                {INBOUND_STATUS_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="action-buttons">
            <div className="left-info">
              <span>
                조회 결과: {summaries.length.toLocaleString()}건
                {selectedSummary ? ` / 선택: ${selectedSummary.orderSequ}` : ''}
              </span>
            </div>
            <div className="right-buttons">
              <button
                type="button"
                className="olm-btn olm-btn-secondary"
                onClick={handleReset}
                disabled={isLoading}
              >
                <i className="fas fa-undo" /> 초기화
              </button>
              <button
                type="button"
                className="olm-btn olm-btn-primary"
                onClick={handleSearch}
                disabled={isLoading}
              >
                <i className="fas fa-search" /> 조회
              </button>
            </div>
          </div>
        </div>

        {errorMessage && (
          <div className="store-inventory-alert" role="alert">
            <i className="fas fa-exclamation-triangle" />
            <span>{errorMessage}</span>
          </div>
        )}
      </div>

      <div className="main-section">
        <div className="left-section inventory-left-section">
          <h3>
            <i className="fas fa-clipboard-list" />
            입고 대기/완료 목록
            <span className="selected-count">
              {isLoading ? '로딩 중...' : `${summaries.length.toLocaleString()}건`}
            </span>
          </h3>
          <div className="grid-container">
            <div className="ag-theme-alpine inventory-grid">
              <AgGridReact<StoreInventorySummary>
                ref={summaryGridRef}
                theme="legacy"
                rowData={summaries}
                columnDefs={summaryColumnDefs}
                defaultColDef={summaryDefaultColDef}
                rowClassRules={summaryRowClassRules}
                getRowId={getSummaryRowId}
                pagination
                paginationPageSize={50}
                animateRows={false}
                headerHeight={34}
                rowHeight={28}
                suppressMovableColumns
                onGridReady={handleSummaryGridReady}
                onRowDoubleClicked={(event) => {
                  if (!event.data) return;
                  //console.debug('[Inventory] Row double click', event.data);
                  setSelectedSummary(event.data);
                  setDetails([]);
                  void loadDetails(event.data).then((result) => {
                    console.debug('[Inventory] Loaded detail count', result.length);
                  });
                }}
                localeText={{
                  noRowsToShow: isLoading
                    ? '데이터를 불러오는 중입니다...'
                    : '조회된 데이터가 없습니다.',
                }}
              />
            </div>
          </div>
          <div className="grid-status-info">
            <span>
              <i className="fas fa-layer-group" />
              총 {summaries.length.toLocaleString()}건
            </span>
            {selectedSummary ? (
              <span className="detail-info">
                <i className="fas fa-hand-pointer" />
                선택: {selectedSummary.vendorNm} / {selectedSummary.agentNm}
              </span>
            ) : (
              <span className="detail-info is-idle">
                {/* <i className="fas fa-mouse-pointer" /> */}
                {/* 상세 확인은 더블클릭으로 진행하세요 */}
              </span>
            )}
          </div>
        </div>

        <div className="right-section inventory-right-section">
          <h3>
            <i className="fas fa-box-open" />
            입고 상세 정보
          </h3>
          <div className="order-detail">
            {selectedSummary ? (
              <>

                <div className="selection-info selection-info--inventory">
                  <span>
                    <strong>발주일자</strong> {selectedSummary.orderD}
                  </span>
                  <span>
                    <strong>일련번호</strong> {selectedSummary.orderSequ}
                  </span>
                  <span>
                    <strong>매장</strong> {selectedSummary.agentNm}
                  </span>
                  <span>
                    <strong>벤더</strong> {selectedSummary.vendorNm}
                  </span>
                  <span className="selection-info__pending">
                    <i className="fas fa-clock" />
                    대기수량 {new Intl.NumberFormat('ko-KR').format(pendingCount)}
                  </span>
                </div>

                <div className="order-detail-section order-detail-section-products">
                  <div className="order-products-header">
                    <h4>
                      <i className="fas fa-list-ul" />
                      상세 내역
                    </h4>
                    <div className="detail-inline-tools">
                      <label htmlFor="bulkInboundDate" className="detail-date-label">
                        입고일자<span className="required-mark">*</span>
                      </label>
                      <input
                        id="bulkInboundDate"
                        type="date"
                        value={bulkInboundDate}
                        onChange={(e) => setBulkInboundDate(e.target.value)}
                        className="detail-bulk-date"
                        title="입고일자"
                        required
                        disabled={anyConfirmed}
                      />
                      <button
                        type="button"
                        className="detail-save-btn"
                        onClick={handleBulkSaveSelected}
                        disabled={!selectedSummary || savingBulk || isDetailLoading || anyConfirmed || details.length === 0}
                        title="발주 그룹 전체 입고 처리"
                      >
                        {savingBulk ? '확정중...' : <><i className="fas fa-clipboard-check" /> 입고확정</>}
                      </button>
                      <button
                        type="button"
                        className="detail-cancel-btn"
                        onClick={handleCancelInboundGroup}
                        disabled={!selectedSummary || savingBulk || isDetailLoading || allPending}
                        title="발주 그룹 전체 입고 취소"
                      >
                        {savingBulk ? '취소중...' : <><i className="fas fa-times" /> 입고취소</>}
                      </button>
                    </div>
                  </div>
                  <div className="order-products-table inventory-detail-table">
                    <table>
                      <thead>
                        <tr>
                          <th scope="col">
                            <input
                              type="checkbox"
                              checked={isAllDetailsSelected}
                              onChange={(event) => toggleSelectAllDetails(event.target.checked)}
                              aria-label="모든 상세 행 선택"
                            />
                          </th>
                          <th scope="col">순번</th>
                          <th scope="col" className="inventory-col-hidden">상품코드</th>
                          <th scope="col">상품명</th>
                          <th scope="col">브랜드</th>
                          <th scope="col">발주수량</th>
                          <th scope="col">출고수량</th>
                          <th scope="col">유통기한</th>
                          <th scope="col" className="inventory-col-narrow">
                            <div className="inventory-header-actions">
                              <span>입고수량(양호)</span>
                              <div className="inventory-mini-actions horizontal">
                                <button
                                  type="button"
                                  className="inventory-mini-btn"
                                  onClick={() => handleApplyAllGoodEqual()}
                                  title="모든 행을 출고수량과 동일하게"
                                  disabled={anyConfirmed}
                                >
                                  =
                                </button>
                                <button
                                  type="button"
                                  className="inventory-mini-btn"
                                  onClick={() => handleApplyAllGoodReset()}
                                  title="모든 행을 0으로 초기화"
                                  disabled={anyConfirmed}
                                >
                                  ≠
                                </button>
                              </div>
                            </div>
                          </th>
                          <th scope="col" className="inventory-col-narrow">
                            <div className="inventory-header-actions">
                              <span>입고수량(불량)</span>
                              <div className="inventory-mini-actions horizontal">
                                <button
                                  type="button"
                                  className="inventory-mini-btn"
                                  onClick={() => handleApplyAllBadEqual()}
                                  title="모든 행을 남은 수량으로 설정"
                                  disabled={anyConfirmed}
                                >
                                  =
                                </button>
                                <button
                                  type="button"
                                  className="inventory-mini-btn"
                                  onClick={() => handleApplyAllBadReset()}
                                  title="모든 행을 0으로 초기화"
                                  disabled={anyConfirmed}
                                >
                                  ≠
                                </button>
                              </div>
                            </div>
                          </th>
                          <th scope="col">총입고</th>
                          <th scope="col">입고금액</th>
                          <th scope="col">입고메모</th>
                          <th scope="col" className="inventory-col-hidden">LOT</th>
                          <th scope="col" className="inventory-col-hidden">유통기한</th>
                          {/* <th scope="col" /> 삭제: 합계 라인과 컬럼수 맞춤 */}
                        </tr>
                      </thead>
                      <tbody>
                        {isDetailLoading ? (
                          <tr>
                            <td colSpan={13} className="empty-row">
                              상세 정보를 불러오는 중입니다...
                            </td>
                          </tr>
                        ) : details.length === 0 ? (
                          <tr>
                            <td colSpan={13} className="empty-row">
                              조회된 상세 데이터가 없습니다.
                            </td>
                          </tr>
                        ) : (
                          details.map((detail, index) => {
                            const detailKey = `${String(detail.orderNo)}-${String(detail.goodsId)}`;
                            const isDetailSelected = selectedDetailKeys.has(detailKey);
                            // 입고금액 계산: inTotQty * inPrice (inPrice가 없으면 0)
                            const inTotQty = detail.inTotQty ?? (detail.inGoodQty ?? 0) + (detail.inBadQty ?? 0);
                            const inPrice = detail.sobijaDan ?? 0;
                            const inboundAmount = inTotQty * inPrice;
                            return (
                              <tr key={detailKey} className={isDetailSelected ? 'is-active-row' : undefined}>
                                <td className="select-cell">
                                  <input
                                    type="checkbox"
                                    checked={isDetailSelected}
                                    onChange={() => toggleDetailSelection(detail)}
                                    aria-label="상세 행 선택"
                                  />
                                </td>
                                <td>{detail.orderNo}</td>
                                <td className="inventory-col-hidden">{detail.goodsId}</td>
                                <td className="product-name-cell">{detail.goodsNm}</td>
                                <td>{detail.brandNm}</td>
                                <td className="number">
                                  {new Intl.NumberFormat('ko-KR').format(detail.orderQty || 0)}
                                </td>
                                <td className="number">
                                  {new Intl.NumberFormat('ko-KR').format(detail.outQty || 0)}
                                </td>
                                <td>{detail.inExpD || '-'}</td>
                                <td className="inventory-col-narrow">
                                  <div className="inventory-inline-actions">
                                    <input
                                      type="number"
                                      min={0}
                                      value={detail.inGoodQty ?? 0}
                                      onChange={(event) =>
                                        handleDetailQuantityChange(index, 'inGoodQty', event.target.value)
                                      }
                                      className="inventory-input is-number"
                                      disabled={!!detail.inD}
                                    />
                                    <div className="inventory-mini-actions">
                                      <button
                                        type="button"
                                        className="inventory-mini-btn"
                                        onClick={() =>
                                          handleDetailQuantityChange(
                                            index,
                                            'inGoodQty',
                                            String(detail.outQty ?? 0),
                                          )
                                        }
                                        title="출고수량과 동일하게"
                                        disabled={!!detail.inD}
                                      >
                                        =
                                      </button>
                                      <button
                                        type="button"
                                        className="inventory-mini-btn"
                                        onClick={() =>
                                          handleDetailQuantityChange(index, 'inGoodQty', '0')
                                        }
                                        title="0으로 설정"
                                        disabled={!!detail.inD}
                                      >
                                        ≠
                                      </button>
                                    </div>
                                  </div>
                                </td>
                                <td className="inventory-col-narrow">
                                  <div className="inventory-inline-actions">
                                    <input
                                      type="number"
                                      min={0}
                                      value={detail.inBadQty ?? 0}
                                      onChange={(event) =>
                                        handleDetailQuantityChange(index, 'inBadQty', event.target.value)
                                      }
                                      className="inventory-input is-number"
                                      disabled={!!detail.inD}
                                    />
                                    <div className="inventory-mini-actions">
                                      <button
                                        type="button"
                                        className="inventory-mini-btn"
                                        onClick={() => handleDetailQuantityChange(index, 'inBadQty', '0')}
                                        title="0으로 설정"
                                        disabled={!!detail.inD}
                                      >
                                        =
                                      </button>
                                      <button
                                        type="button"
                                        className="inventory-mini-btn"
                                        onClick={() => handleDetailQuantityChange(index, 'inBadQty', '0')}
                                        title="0으로 설정"
                                        disabled={!!detail.inD}
                                      >
                                        ≠
                                      </button>
                                    </div>
                                  </div>
                                </td>
                                <td className="number">
                                  {new Intl.NumberFormat('ko-KR').format(inTotQty)}
                                </td>
                                <td className="number">
                                  {new Intl.NumberFormat('ko-KR').format(inboundAmount)}
                                </td>
                                <td>
                                  <input
                                    type="text"
                                    value={detail.inMemo || ''}
                                    maxLength={100}
                                    onChange={e => {
                                      const value = e.target.value;
                                      setDetails(prev => prev.map((item, idx) => idx === index ? { ...item, inMemo: value } : item));
                                    }}
                                    placeholder="입고메모 입력"
                                    style={{ width: '100%' }}
                                  />
                                </td>
                                <td className="inventory-col-hidden">{detail.lotNo || '-'}</td>
                                <td className="inventory-col-hidden">{detail.expD || '-'}</td>
                                <td className="actions-cell" />
                              </tr>
                            );
                          })
                        )}
                      </tbody>
                        {/* 합계 라인 (tfoot) */}
                        <tfoot>
                          <tr style={{ background: '#f8fafc', fontWeight: 700 }}>
                            <td colSpan={7} style={{ textAlign: 'right' }}>합계</td>
                            <td className="inventory-col-narrow number">
                              {new Intl.NumberFormat('ko-KR').format(details.reduce((sum, d) => sum + (d.inGoodQty ?? 0), 0))}
                            </td>
                            <td className="inventory-col-narrow number">
                              {new Intl.NumberFormat('ko-KR').format(details.reduce((sum, d) => sum + (d.inBadQty ?? 0), 0))}
                            </td>
                            <td className="number">
                              {new Intl.NumberFormat('ko-KR').format(details.reduce((sum, d) => sum + ((d.inTotQty ?? ((d.inGoodQty ?? 0) + (d.inBadQty ?? 0)))), 0))}
                            </td>
                            <td className="number">
                              {new Intl.NumberFormat('ko-KR').format(details.reduce((sum, d) => {
                                const inTotQty = d.inTotQty ?? (d.inGoodQty ?? 0) + (d.inBadQty ?? 0);
                                const inPrice = d.sobijaDan ?? 0;
                                return sum + (inTotQty * inPrice);
                              }, 0))}
                            </td>
                            {/* <td></td> 삭제: 합계 라인과 컬럼수 맞춤 */}
                            <td className="inventory-col-hidden"></td>
                            <td className="inventory-col-hidden"></td>
                            <td></td>
                          </tr>
                        </tfoot>
                    </table>
                  </div>
                </div>
              </>
            ) : (
              <div className="shipment-no-selection">
                <i className="fas fa-clipboard-check" />
                <p>상단 목록에서 발주 건을 선택한 뒤 더블클릭하면 상세가 표시됩니다.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      <Modal
        isOpen={modalState.open}
        onClose={closeModal}
        title={modalState.title}
        size="small"
        showCloseButton={true}
      >
        <div>{modalState.content}</div>
        {modalState.footer ? (
          <div>{modalState.footer}</div>
        ) : (
          <div className="confirmation-actions">
            <button type="button" className="btn-confirmation-cancel" onClick={closeModal}>
              <i className="fas fa-times"></i> 확인
            </button>
          </div>
        )}
      </Modal>

    </div>
  );
};

export default StoreInventoryManagement;


