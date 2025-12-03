import React, { useMemo, useCallback, useRef } from 'react';
import { AgGridReact } from 'ag-grid-react';
import { ColDef, GridOptions, GridApi, ICellRendererParams } from 'ag-grid-community';
import { 
  Download, 
  Upload, 
  Search, 
  RefreshCw, 
  Eye,
  Edit,
  Trash2,
  Plus
} from 'lucide-react';
//import { useButtonTextPermission } from '../hooks/usePermissions';
import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-alpine.css';
import './AgGridWrapper.css';

interface AgGridWrapperProps {
  // 데이터 관련
  rowData: any[];
  columnDefs: ColDef[];
  
  // 권한 관련
 // menuId?: number; // 메뉴 ID (권한 체크용)
  
  // 기능 설정
  enableMultiSelect?: boolean;
  enableExcelExport?: boolean;
  enableExcelImport?: boolean;
  enableSearch?: boolean;
  enableFilter?: boolean;
  enablePagination?: boolean;
  enableSorting?: boolean;
  enableResizing?: boolean;
  enableColumnMenu?: boolean;
  enableRowSelection?: boolean;
  enableRowGrouping?: boolean;
  enableColumnPinning?: boolean;
  
  // UI 설정
  height?: string;
  width?: string;
  theme?: 'alpine' | 'alpine-dark' | 'balham' | 'balham-dark' | 'material';
  
  // 이벤트 핸들러
  onRowSelected?: (event: any) => void;
  onCellClicked?: (event: any) => void;
  onRowDoubleClicked?: (event: any) => void;
  onGridReady?: (params: any) => void;
  onSelectionChanged?: (event: any) => void;
  
  // 액션 버튼
  showActionButtons?: boolean;
  onAdd?: () => void;
  onEdit?: (data: any) => void;
  onDelete?: (data: any) => void;
  onView?: (data: any) => void;
  
  // 검색 및 필터
  searchPlaceholder?: string;
  onSearch?: (value: string) => void;
  
  // 페이지네이션
  paginationPageSize?: number;
  paginationPageSizeSelector?: number[];
  
  // 코드목록 메뉴 전용 설정
  isCodeListMode?: boolean;
  excelTitle?: string;
}

const AgGridWrapper: React.FC<AgGridWrapperProps> = ({
  rowData,
  columnDefs,
//  menuId,
  enableExcelExport = true,
  enableExcelImport = true,
  enableSearch = true,
  enableFilter = true,
  enablePagination = true,
  enableSorting = true,
  enableResizing = true,
  enableRowSelection = true,
  height = '500px',
  width = '100%',
  theme = 'alpine',
  onRowSelected,
  onCellClicked,
  onRowDoubleClicked,
  onGridReady,
  onSelectionChanged,
  showActionButtons = true,
  onAdd,
  onEdit,
  onDelete,
  onView,
  searchPlaceholder = '검색어를 입력하세요...',
  onSearch,
  paginationPageSize = 20,
  paginationPageSizeSelector = [10, 20, 50, 100],
  isCodeListMode = false,
  excelTitle = '상품 목록'
}) => {
  const gridRef = useRef<AgGridReact>(null);
  const gridApiRef = useRef<GridApi | null>(null);
  const searchValueRef = useRef<string>('');

  // 권한 체크 (menuId가 제공된 경우에만)
//  const refreshPermission = menuId ? useButtonTextPermission(menuId, '새로고침') : { hasPermission: true };
//  const exportPermission = menuId ? useButtonTextPermission(menuId, '내보내기') : { hasPermission: true };
//  const addPermission = menuId ? useButtonTextPermission(menuId, '추가') : { hasPermission: true };

  // 액션 컬럼 렌더러
  const ActionCellRenderer = useCallback((params: ICellRendererParams) => {
    return (
      <div className="action-buttons">
        {onView && (
          <button 
            className="action-btn view-btn" 
            onClick={() => onView(params.data)}
            title="보기"
          >
            <Eye size={14} />
          </button>
        )}
        {onEdit && (
          <button 
            className="action-btn edit-btn" 
            onClick={() => onEdit(params.data)}
            title="수정"
          >
            <Edit size={14} />
          </button>
        )}
        {onDelete && (
          <button 
            className="action-btn delete-btn" 
            onClick={() => onDelete(params.data)}
            title="삭제"
          >
            <Trash2 size={14} />
          </button>
        )}
      </div>
    );
  }, [onView, onEdit, onDelete]);

  // 기본 컬럼 정의에 공통 설정 추가
  const enhancedColumnDefs = useMemo(() => {
    // 체크박스 컬럼 추가 (AG Grid 34+에서 행 선택을 위해 필요)
    const checkboxColumn = enableRowSelection ? {
      headerCheckboxSelection: true,
      checkboxSelection: true,
      width: 50,
      pinned: 'left' as const,
      lockPosition: true,
      suppressMenu: true,
      sortable: false,
      filter: false,
      resizable: false,
    } : null;

    const baseColumns = columnDefs.map(col => ({
      ...col,
      sortable: enableSorting,
      resizable: enableResizing,
      filter: enableFilter,
      pinned: col.pinned || undefined,
    }));

    // 체크박스 컬럼을 맨 앞에 추가
    if (checkboxColumn) {
      baseColumns.unshift(checkboxColumn);
    }

    // 액션 버튼 컬럼 추가
    if (showActionButtons) {
      baseColumns.push({
        headerName: '액션',
        field: 'actions',
        width: 120,
        cellRenderer: ActionCellRenderer,
        pinned: 'right',
        lockPosition: true,
        sortable: false,
        filter: false,
        resizable: false,
      });
    }

    return baseColumns;
  }, [columnDefs, enableSorting, enableResizing, enableFilter, showActionButtons, ActionCellRenderer]);

  // Grid 옵션 설정
  const gridOptions: GridOptions = useMemo(() => ({
    // 기본 설정
    rowData,
    columnDefs: enhancedColumnDefs,
    theme: 'legacy', // 레거시 테마 사용
    defaultColDef: {
      flex: 1,
      minWidth: 100,
      sortable: enableSorting,
      resizable: enableResizing,
      filter: enableFilter,
    },

    // 선택 설정 (AG Grid 34+ 호환)
    rowSelection: enableRowSelection ? { 
      mode: 'multiRow', 
      enableClickSelection: true 
    } : undefined,
    suppressCellFocus: false,

    // 페이지네이션 설정
    pagination: enablePagination,
    paginationPageSize: paginationPageSize,
    paginationPageSizeSelector: enablePagination ? paginationPageSizeSelector : undefined,

    // 기타 설정
    animateRows: true,
    suppressRowHoverHighlight: false,
    suppressColumnVirtualisation: false,
    suppressRowVirtualisation: false,

    // 이벤트 핸들러
    onGridReady: (params) => {
      gridApiRef.current = params.api;
      onGridReady?.(params);
    },
    onRowSelected,
    onCellClicked,
    onRowDoubleClicked,
    onSelectionChanged,
  }), [
    rowData, 
    enhancedColumnDefs, 
    enableSorting, 
    enableResizing, 
    enableFilter, 
    enableRowSelection, 
    enablePagination, 
    paginationPageSize, 
    paginationPageSizeSelector,
    onGridReady, 
    onRowSelected, 
    onCellClicked, 
    onRowDoubleClicked, 
    onSelectionChanged
  ]);

  // CSV 내보내기 (Community Edition 호환)
  const handleExportExcel = useCallback(() => {
    if (gridApiRef.current) {
      try {
        const fileName = isCodeListMode ? '상품목록.csv' : 'grid-export.csv';
        
        // CSV 내보내기
        gridApiRef.current.exportDataAsCsv({
          fileName: fileName,
        });
        
        console.log('CSV 내보내기 성공:', fileName);
      } catch (error) {
        console.error('CSV 내보내기 오류:', error);
        alert('CSV 내보내기 중 오류가 발생했습니다.');
      }
    } else {
      console.error('Grid API가 초기화되지 않았습니다.');
      alert('그리드가 준비되지 않았습니다. 잠시 후 다시 시도해주세요.');
    }
  }, [isCodeListMode, excelTitle, rowData]);

  // Excel 가져오기
  const handleImportExcel = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && gridApiRef.current) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const data = e.target?.result;
        console.log('Excel import:', data);
      };
      reader.readAsText(file);
    }
  }, []);

  // 검색 처리
  const handleSearch = useCallback((value: string) => {
    searchValueRef.current = value;
    onSearch?.(value);
  }, [onSearch]);

  // 새로고침
  const handleRefresh = useCallback(() => {
    if (gridApiRef.current) {
      gridApiRef.current.refreshCells();
    }
  }, []);

  // 모든 행 선택/해제
  const handleSelectAll = useCallback(() => {
    if (gridApiRef.current) {
      gridApiRef.current.selectAll();
    }
  }, []);

  const handleDeselectAll = useCallback(() => {
    if (gridApiRef.current) {
      gridApiRef.current.deselectAll();
    }
  }, []);

  return (
    <div className="ag-grid-wrapper">
      {/* 툴바 */}
      <div className="grid-toolbar">
        <div className="toolbar-left">
          {enableSearch && !isCodeListMode && (
            <div className="search-container">
              <Search size={16} />
              <input
                type="text"
                placeholder={searchPlaceholder}
                onChange={(e) => handleSearch(e.target.value)}
                className="search-input"
              />
            </div>
          )}
          
          {enableFilter && (
            <button 
              className="toolbar-btn" 
              onClick={handleRefresh} 
              title="새로고침"
              //disabled={!refreshPermission.hasPermission}
            >
              <RefreshCw size={16} />
            </button>
          )}
        </div>

        <div className="toolbar-right">
          {enableRowSelection && !isCodeListMode && (
            <>
              <button className="toolbar-btn" onClick={handleSelectAll} title="전체 선택">
                전체 선택
              </button>
              <button className="toolbar-btn" onClick={handleDeselectAll} title="전체 해제">
                전체 해제
              </button>
            </>
          )}

          {enableExcelExport && (
            <button 
              className="toolbar-btn export-btn" 
              onClick={handleExportExcel} 
              title="CSV 내보내기"
              //disabled={!exportPermission.hasPermission}
            >
              <Download size={16} />
              내보내기
            </button>
          )}

          {enableExcelImport && !isCodeListMode && (
            <label className="toolbar-btn import-btn" title="Excel 가져오기">
              <Upload size={16} />
              가져오기
              <input
                type="file"
                accept=".xlsx,.xls,.csv"
                onChange={handleImportExcel}
                style={{ display: 'none' }}
              />
            </label>
          )}

          {onAdd && !isCodeListMode && (
            <button 
              className="toolbar-btn add-btn" 
              onClick={onAdd} 
              title="추가"
              //disabled={!addPermission.hasPermission}
            >
              <Plus size={16} />
              추가
            </button>
          )}
        </div>
      </div>

      {/* 그리드 */}
      <div 
        className={`ag-theme-${theme}`}
        style={{ height, width }}
      >
        <AgGridReact
          ref={gridRef}
          {...gridOptions}
        />
      </div>
    </div>
  );
};

export default AgGridWrapper;
