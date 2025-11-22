import { useState, useEffect, useCallback, useRef, forwardRef, useImperativeHandle } from 'react';
import { AgGridReact } from 'ag-grid-react';
import { ColDef } from 'ag-grid-community';
import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-alpine.css';
import './CommonAgGrid.css';

interface CommonAgGridProps {
  rowData: any[];
  columnDefs: ColDef[];
  onSelectionChanged?: (selectedRows: any[]) => void;
  onRowDoubleClicked?: (rowData: any) => void;
  onCellValueChanged?: (event: any) => void;
  height?: string;
  className?: string;
  enableCheckbox?: boolean;
  checkboxField?: string;
  isRowSelected?: (rowData: any) => boolean; // 외부에서 체크박스 상태를 제어하는 함수
  getRowId?: (params: any) => string; // 행의 고유 ID를 생성하는 함수
}

export interface CommonAgGridRef {
  deselectAll: () => void;
  selectAll: () => void;
  getSelectedRows: () => any[];
  setFocusedCell: (rowIndex: number, colKey: string) => void;
  startEditingCell: (params: { rowIndex: number; colKey: string }) => void;
}

const CommonAgGrid = forwardRef<CommonAgGridRef, CommonAgGridProps>(({
  rowData,
  columnDefs,
  onSelectionChanged,
  onRowDoubleClicked,
  onCellValueChanged,
  height = '400px',
  className = '',
  enableCheckbox = true,
  checkboxField = 'selected',
  isRowSelected,
  getRowId
}, ref) => {
  // 체크박스가 활성화된 경우 데이터에 selected 필드 추가
  const [gridData, setGridData] = useState(() => {
    if (!enableCheckbox) return rowData;
    
    return rowData.map(item => ({
      ...item,
      [checkboxField]: item[checkboxField] || false
    }));
  });

  // rowData가 변경될 때 gridData 업데이트
  useEffect(() => {
    if (!enableCheckbox) {
      setGridData(rowData);
    } else {
      setGridData(rowData.map(item => ({
        ...item,
        [checkboxField]: isRowSelected ? isRowSelected(item) : (item[checkboxField] || false)
      })));
    }
  }, [rowData, enableCheckbox, checkboxField, isRowSelected]);

  // 개별 행 선택 토글
  const toggleRowSelection = (identifier: any) => {
    if (!enableCheckbox) return;
    
    console.log('🔍 체크박스 클릭:', { identifier, checkboxField });
    
    setGridData(prev => {
      const updated = prev.map(row => {
        // uniqueId를 우선으로 사용하여 정확한 행 식별 (발주 디테일에서 상품코드+순번 조합으로 고유성 보장)
        const rowId = row.uniqueId || row.id || row.productCode || row.goodsId || row.GOODS_ID;
        const isMatch = rowId === identifier;
        
        if (isMatch) {
          console.log('🔍 매칭된 행:', { 
            rowId, 
            uniqueId: row.uniqueId,
            currentValue: row[checkboxField], 
            newValue: !row[checkboxField] 
          });
        }
        
        return isMatch ? { ...row, [checkboxField]: !row[checkboxField] } : row;
      });
      
      console.log('🔍 업데이트된 그리드 데이터:', updated);
      return updated;
    });
  };

  // 전체 선택/해제
  const toggleSelectAll = () => {
    if (!enableCheckbox) return;
    
    const allSelected = gridData.every(row => row[checkboxField]);
    
    // 모든 행이 선택되어 있으면 전체 해제, 그렇지 않으면 전체 선택
    const shouldSelectAll = !allSelected;
    setGridData(prev => prev.map(row => ({ ...row, [checkboxField]: shouldSelectAll })));
  };

  // 체크박스 렌더러
  const CheckboxRenderer = (params: any) => {
    const isSelected = params.data[checkboxField];
    // uniqueId를 우선으로 사용하여 정확한 행 식별
    const identifier = params.data.uniqueId || params.data.id || params.data.productCode || params.data.goodsId || params.data.GOODS_ID;
    
    return (
      <div 
        className={`common-checkbox ${isSelected ? 'checked' : ''}`}
        onClick={() => toggleRowSelection(identifier)}
      >
        {isSelected && <span className="checkmark">✓</span>}
      </div>
    );
  };

  // 헤더 체크박스 렌더러
  const HeaderCheckboxRenderer = () => {
    const allSelected = gridData.every(row => row[checkboxField]);
    const someSelected = gridData.some(row => row[checkboxField]);
    
    return (
      <div 
        className={`common-checkbox header-checkbox ${allSelected ? 'checked' : ''} ${someSelected && !allSelected ? 'indeterminate' : ''}`}
        onClick={toggleSelectAll}
        title={allSelected ? '전체 해제' : '전체 선택'}
      >
        {allSelected && <span className="checkmark">✓</span>}
        {someSelected && !allSelected && <span className="checkmark">−</span>}
      </div>
    );
  };

  // 체크박스 컬럼 정의
  const checkboxColumn: ColDef = {
    headerName: '',
    field: checkboxField,
    width: 50,
    pinned: 'left',
    cellRenderer: CheckboxRenderer,
    headerComponent: HeaderCheckboxRenderer,
    sortable: false,
    filter: false,
    resizable: false
  };

  // 최종 컬럼 정의 (체크박스 활성화 시 체크박스 컬럼 추가)
  const finalColumnDefs = enableCheckbox ? [checkboxColumn, ...columnDefs] : columnDefs;

  // 선택된 행 데이터 반환
  const getSelectedRows = useCallback(() => {
    if (!enableCheckbox) return [];
    return gridData.filter(row => row[checkboxField]);
  }, [gridData, enableCheckbox, checkboxField]);

  // 선택 변경 시 콜백 호출
  useEffect(() => {
    if (onSelectionChanged && enableCheckbox) {
      const selectedRows = gridData.filter(row => row[checkboxField]);
      onSelectionChanged(selectedRows);
    }
  }, [gridData, enableCheckbox, checkboxField]);

  // 그리드 참조를 위한 ref
  const gridRef = useRef<HTMLDivElement>(null);
  const agGridRef = useRef<AgGridReact>(null);

  // ref를 통해 노출할 메서드들
  useImperativeHandle(ref, () => ({
    deselectAll: () => {
      if (enableCheckbox) {
        setGridData(prev => prev.map(row => ({ ...row, [checkboxField]: false })));
      }
    },
    selectAll: () => {
      if (enableCheckbox) {
        setGridData(prev => prev.map(row => ({ ...row, [checkboxField]: true })));
      }
    },
    getSelectedRows: () => {
      return getSelectedRows();
    },
    setFocusedCell: (rowIndex: number, colKey: string) => {
      if (agGridRef.current?.api) {
        console.log('🔍 setFocusedCell 호출:', { rowIndex, colKey });
        agGridRef.current.api.setFocusedCell(rowIndex, colKey);
        
        // 포커스 후 약간의 지연을 두고 편집 모드 시작
        setTimeout(() => {
          if (agGridRef.current?.api) {
            agGridRef.current.api.startEditingCell({
              rowIndex,
              colKey
            });
            console.log('✅ 편집 모드 자동 시작');
          }
        }, 50);
      }
    },
    startEditingCell: (params: { rowIndex: number; colKey: string }) => {
      if (agGridRef.current?.api) {
        console.log('🔍 startEditingCell 호출:', params);
        agGridRef.current.api.startEditingCell(params);
      }
    }
  }), [enableCheckbox, checkboxField, getSelectedRows]);

  return (
    <div className={`common-ag-grid-container ${className}`} style={{ height }}>
      <div ref={gridRef} className="ag-theme-alpine common-ag-grid">
        <AgGridReact
          ref={agGridRef}
          rowData={gridData}
          columnDefs={finalColumnDefs}
          getRowId={getRowId}
          onRowDoubleClicked={onRowDoubleClicked}
          onCellValueChanged={onCellValueChanged}
          headerHeight={25}
          rowHeight={24}
          suppressRowClickSelection={true}
          suppressScrollOnNewData={true}
          maintainColumnOrder={true}
          getRowClass={(params: any) => {
            return params.data[checkboxField] ? 'row-selected' : '';
          }}
          defaultColDef={{
            sortable: true,
            resizable: true,
            filter: false,
            valueFormatter: (params: any) => {
              if (params.value == null || params.value === '') return '';
              const numValue = Number(params.value);
              if (isNaN(numValue)) return params.value;
              
              // 마이너스 기호를 앞에 강제로 표시
              if (numValue < 0) {
                return `-${Math.abs(numValue).toLocaleString('ko-KR')}`;
              } else {
                return numValue.toLocaleString('ko-KR');
              }
            }
          }}
          stopEditingWhenCellsLoseFocus={true}
          suppressClickEdit={false}
          noRowsOverlayComponent={() => (
            <div className="ag-overlay-no-rows-center">
              <div>조회된 데이터가 없습니다</div>
            </div>
          )}
        />
      </div>
    </div>
  );
});

CommonAgGrid.displayName = 'CommonAgGrid';

export default CommonAgGrid;
