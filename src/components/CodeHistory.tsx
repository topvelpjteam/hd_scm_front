import React, { useEffect, useRef } from 'react';
import { useSelector } from 'react-redux';
import { useButtonTextPermission } from '../hooks/usePermissions';
import { MENU_IDS } from '../constants/menuIds';
import { getMenuIcon } from '../utils/menuUtils';
import { 
  Search, 
  Plus, 
  Download, 
  Edit, 
  Trash2, 
  Eye,
  History,
  Hash,
  Calendar,
  User,
  Tag,
  CheckCircle,
  AlertCircle,
  Clock,
  ChevronDown,
  X,
  ArrowLeft,
  ArrowRight
} from 'lucide-react';
import { RootState } from '../store/store';
import { useTabState } from '../hooks/useTabState';
import './CodeHistory.css';

interface CodeHistoryItem {
  id: string;
  codeId: string;
  codeName: string;
  version: string;
  changeType: 'created' | 'modified' | 'deleted' | 'activated' | 'deactivated';
  description: string;
  changedBy: string;
  changedAt: string;
  previousValue?: string;
  newValue?: string;
  tags: string[];
}

const CodeHistory: React.FC = () => {
  const categoryDropdownRef = useRef<HTMLDivElement>(null);
  
  // 현재 활성 탭 ID 가져오기
  const activeTabId = useSelector((state: RootState) => state.tabs.activeTabId);
  const { tabs } = useSelector((state: RootState) => state.tabs);
  const currentTab = tabs.find(tab => tab.id === activeTabId);

  // 권한 체크 (코드이력 메뉴 ID 상수 사용 - 상품관리 하위)
  const exportPermission = useButtonTextPermission(MENU_IDS.INVENTORY_MANAGEMENT, '내보내기');
  
  // 탭 상태 관리 훅 사용
  const { state, setState } = useTabState(activeTabId || '');
  
  // 상태 값들 (기본값과 함께)
  const searchTerm = state.searchTerm || '';
  const selectedChangeTypes = state.selectedChangeTypes || [];
  const sortBy = state.sortBy || 'changedAt';
  const selectedItems = state.selectedItems || [];
  const selectAll = state.selectAll || false;
  const showChangeTypeDropdown = state.showChangeTypeDropdown || false;
  const changeTypeSearchTerm = state.changeTypeSearchTerm || '';
  const currentPage = state.currentPage || 1;
  const itemsPerPage = state.itemsPerPage || 10;

  // 샘플 데이터
  const codeHistoryItems: CodeHistoryItem[] = [
    {
      id: '1',
      codeId: 'CD001',
      codeName: '사용자 등급 코드',
      version: '1.2',
      changeType: 'modified',
      description: 'VIP 등급 기준 수정 (구매 금액 100만원 → 50만원)',
      changedBy: '김관리',
      changedAt: '2024-01-20 14:30:25',
      previousValue: '구매 금액 100만원 이상',
      newValue: '구매 금액 50만원 이상',
      tags: ['사용자', '등급', '수정']
    },
    {
      id: '2',
      codeId: 'CD002',
      codeName: '주문 상태 코드',
      version: '1.0',
      changeType: 'created',
      description: '새로운 주문 상태 코드 생성',
      changedBy: '박주문',
      changedAt: '2024-01-18 09:15:10',
      newValue: '주문 상태: 접수, 처리중, 완료, 취소',
      tags: ['주문', '상태', '생성']
    },
    {
      id: '3',
      codeId: 'CD003',
      codeName: '결제 방법 코드',
      version: '1.1',
      changeType: 'activated',
      description: '포인트 결제 방법 활성화',
      changedBy: '이결제',
      changedAt: '2024-01-15 16:45:30',
      newValue: '포인트 결제 활성화',
      tags: ['결제', '포인트', '활성화']
    },
    {
      id: '4',
      codeId: 'CD004',
      codeName: '상품 카테고리 코드',
      version: '1.3',
      changeType: 'deleted',
      description: '사용하지 않는 카테고리 삭제',
      changedBy: '최상품',
      changedAt: '2024-01-12 11:20:15',
      previousValue: '중고상품 카테고리',
      tags: ['상품', '카테고리', '삭제']
    },
    {
      id: '5',
      codeId: 'CD005',
      codeName: '배송 방법 코드',
      version: '1.0',
      changeType: 'deactivated',
      description: '방문배송 방법 비활성화',
      changedBy: '정배송',
      changedAt: '2024-01-10 13:55:40',
      previousValue: '방문배송 활성',
      newValue: '방문배송 비활성',
      tags: ['배송', '방문배송', '비활성화']
    },
    {
      id: '6',
      codeId: 'CD001',
      codeName: '사용자 등급 코드',
      version: '1.1',
      changeType: 'modified',
      description: '관리자 등급 추가',
      changedBy: '김관리',
      changedAt: '2024-01-08 10:30:20',
      previousValue: '일반, VIP',
      newValue: '일반, VIP, 관리자',
      tags: ['사용자', '등급', '추가']
    }
  ];

  // 드롭다운 외부 클릭 시 닫기
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (categoryDropdownRef.current && !categoryDropdownRef.current.contains(event.target as Node)) {
        setState('showChangeTypeDropdown', false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [setState]);

  // 변경 유형 옵션
  const changeTypeOptions = [
    'created',
    'modified', 
    'deleted',
    'activated',
    'deactivated'
  ];

  // 변경 유형 선택/해제
  const handleChangeTypeToggle = (changeType: string) => {
    const newSelectedChangeTypes = selectedChangeTypes.includes(changeType)
      ? selectedChangeTypes.filter((c: string) => c !== changeType)
      : [...selectedChangeTypes, changeType];
    setState('selectedChangeTypes', newSelectedChangeTypes);
  };

  // 전체 변경 유형 선택/해제
  const handleSelectAllChangeTypes = () => {
    const newSelectedChangeTypes = selectedChangeTypes.length === changeTypeOptions.length
      ? []
      : [...changeTypeOptions];
    setState('selectedChangeTypes', newSelectedChangeTypes);
  };

  // 드롭다운 열릴 때 검색어 초기화
  const handleDropdownToggle = () => {
    if (!showChangeTypeDropdown) {
      setState('changeTypeSearchTerm', '');
    }
    setState('showChangeTypeDropdown', !showChangeTypeDropdown);
  };

  // 변경 유형 선택 해제
  const handleRemoveChangeType = (changeType: string) => {
    const newSelectedChangeTypes = selectedChangeTypes.filter((c: string) => c !== changeType);
    setState('selectedChangeTypes', newSelectedChangeTypes);
  };

  // 검색어에 따른 변경 유형 필터링
  const filteredChangeTypeOptions = changeTypeOptions.filter(changeType =>
    changeType.toLowerCase().includes(changeTypeSearchTerm.toLowerCase())
  );

  // 필터링된 데이터
  const filteredItems = codeHistoryItems.filter(item => {
    const matchesSearch = item.codeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.codeId.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.changedBy.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesChangeType = selectedChangeTypes.length === 0 || selectedChangeTypes.includes(item.changeType);
    
    return matchesSearch && matchesChangeType;
  });

  // 정렬된 데이터
  const sortedItems = [...filteredItems].sort((a, b) => {
    switch (sortBy) {
      case 'changedAt':
        return new Date(b.changedAt).getTime() - new Date(a.changedAt).getTime();
      case 'codeName':
        return a.codeName.localeCompare(b.codeName);
      case 'changedBy':
        return a.changedBy.localeCompare(b.changedBy);
      case 'changeType':
        return a.changeType.localeCompare(b.changeType);
      default:
        return 0;
    }
  });

  // 페이지네이션
  const totalPages = Math.ceil(sortedItems.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedItems = sortedItems.slice(startIndex, endIndex);

  // 변경 유형별 색상
  const getChangeTypeColor = (changeType: string) => {
    switch (changeType) {
      case 'created':
        return '#10b981';
      case 'modified':
        return '#3b82f6';
      case 'deleted':
        return '#ef4444';
      case 'activated':
        return '#8b5cf6';
      case 'deactivated':
        return '#f59e0b';
      default:
        return '#6b7280';
    }
  };

  // 변경 유형별 아이콘
  const getChangeTypeIcon = (changeType: string) => {
    switch (changeType) {
      case 'created':
        return <Plus size={16} />;
      case 'modified':
        return <Edit size={16} />;
      case 'deleted':
        return <Trash2 size={16} />;
      case 'activated':
        return <CheckCircle size={16} />;
      case 'deactivated':
        return <AlertCircle size={16} />;
      default:
        return <Clock size={16} />;
    }
  };

  // 변경 유형별 한글명
  const getChangeTypeLabel = (changeType: string) => {
    switch (changeType) {
      case 'created':
        return '생성';
      case 'modified':
        return '수정';
      case 'deleted':
        return '삭제';
      case 'activated':
        return '활성화';
      case 'deactivated':
        return '비활성화';
      default:
        return changeType;
    }
  };

  // 개별 항목 선택/해제
  const handleItemSelect = (itemId: string) => {
    const newSelectedItems = selectedItems.includes(itemId)
      ? selectedItems.filter((id: string) => id !== itemId)
      : [...selectedItems, itemId];
    setState('selectedItems', newSelectedItems);
  };

  // 전체 선택/해제
  const handleSelectAll = () => {
    if (selectAll) {
      setState('selectedItems', []);
      setState('selectAll', false);
    } else {
      setState('selectedItems', paginatedItems.map(item => item.id));
      setState('selectAll', true);
    }
  };

  // 페이지 변경
  const handlePageChange = (page: number) => {
    setState('currentPage', page);
  };

  // 페이지 크기 변경
  const handleItemsPerPageChange = (size: number) => {
    setState('itemsPerPage', size);
    setState('currentPage', 1); // 첫 페이지로 리셋
  };

  return (
    <div className="code-history-container">
      {/* 헤더 */}
      <div className="code-history-header">
        <div className="header-left">
          <h1 className="page-title">
            {currentTab?.menuIcon ? (
              React.createElement(getMenuIcon(currentTab.menuIcon), { size: 24 })
            ) : (
              <History size={24} />
            )}
            코드 이력
          </h1>
          <p className="page-description">
            코드의 모든 변경 이력을 추적하고 관리합니다.
          </p>
        </div>
        <div className="header-right">
          <button 
            className="btn btn-secondary"
            disabled={!exportPermission.hasPermission}
          >
            <Download size={16} />
            이력 내보내기
          </button>
        </div>
      </div>

      {/* 필터 및 검색 */}
      <div className="code-history-filters">
        <div className="search-section">
          <div className="search-box">
            <Search size={18} />
            <input
              type="text"
              placeholder="코드명, 코드번호, 설명, 변경자로 검색..."
              value={searchTerm}
              onChange={(e) => setState('searchTerm', e.target.value)}
            />
          </div>
        </div>
        
        <div className="filter-section">
          <div className="filter-group">
            <label>변경 유형:</label>
            <div className="multi-select-container" ref={categoryDropdownRef}>
              <div 
                className="multi-select-display"
                onClick={handleDropdownToggle}
              >
                <div className="selected-items">
                  {selectedChangeTypes.length === 0 ? (
                    <span className="placeholder">전체 변경 유형</span>
                  ) : selectedChangeTypes.length === changeTypeOptions.length ? (
                    <span className="selected-item">전체 선택됨</span>
                  ) : (
                    selectedChangeTypes.map((changeType: string) => (
                      <span key={changeType} className="selected-item">
                        {getChangeTypeLabel(changeType)}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRemoveChangeType(changeType);
                          }}
                          className="remove-btn"
                        >
                          <X size={12} />
                        </button>
                      </span>
                    ))
                  )}
                </div>
                <ChevronDown 
                  size={16} 
                  className={`dropdown-icon ${showChangeTypeDropdown ? 'rotated' : ''}`}
                />
              </div>
              
              {showChangeTypeDropdown && (
                <div className="multi-select-dropdown">
                  <div className="dropdown-header">
                    <div className="search-container">
                      <Search size={14} />
                      <input
                        type="text"
                        placeholder="변경 유형 검색..."
                        value={changeTypeSearchTerm}
                        onChange={(e) => setState('changeTypeSearchTerm', e.target.value)}
                        className="category-search-input"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={handleSelectAllChangeTypes}
                      className="select-all-btn"
                    >
                      <input
                        type="checkbox"
                        checked={selectedChangeTypes.length === changeTypeOptions.length}
                        readOnly
                      />
                      전체 선택
                    </button>
                  </div>
                  <div className="dropdown-options">
                    {filteredChangeTypeOptions.map(changeType => (
                      <label key={changeType} className="option-item">
                        <input
                          type="checkbox"
                          checked={selectedChangeTypes.includes(changeType)}
                          onChange={() => handleChangeTypeToggle(changeType)}
                        />
                        <span>{getChangeTypeLabel(changeType)}</span>
                      </label>
                    ))}
                    {filteredChangeTypeOptions.length === 0 && (
                      <div className="no-results">
                        검색 결과가 없습니다
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
          
          <div className="filter-group">
            <label>정렬:</label>
            <select 
              value={sortBy} 
              onChange={(e) => setState('sortBy', e.target.value)}
            >
              <option value="changedAt">변경일시순</option>
              <option value="codeName">코드명순</option>
              <option value="changedBy">변경자순</option>
              <option value="changeType">변경유형순</option>
            </select>
          </div>

          <div className="filter-group">
            <label>페이지 크기:</label>
            <select 
              value={itemsPerPage} 
              onChange={(e) => handleItemsPerPageChange(Number(e.target.value))}
            >
              <option value={10}>10개</option>
              <option value={20}>20개</option>
              <option value={50}>50개</option>
              <option value={100}>100개</option>
            </select>
          </div>
        </div>
      </div>

      {/* 결과 통계 */}
      <div className="code-history-stats">
        <div className="stats-left">
          <span>총 {sortedItems.length}개의 이력</span>
          {searchTerm && <span>검색어: "{searchTerm}"</span>}
        </div>
        <div className="stats-right">
          <span>페이지 {currentPage} / {totalPages}</span>
        </div>
      </div>

      {/* 코드 이력 테이블 */}
      <div className="code-history-table-container">
        <table className="code-history-table">
          <thead>
            <tr>
              <th className="checkbox-header">
                <input
                  type="checkbox"
                  checked={selectAll}
                  onChange={handleSelectAll}
                  title="전체 선택"
                />
              </th>
              <th>코드</th>
              <th>버전</th>
              <th>변경 유형</th>
              <th>설명</th>
              <th>변경자</th>
              <th>변경일시</th>
              <th>이전 값</th>
              <th>새 값</th>
              <th>태그</th>
              <th>작업</th>
            </tr>
          </thead>
          <tbody>
            {paginatedItems.map((item) => (
              <tr key={item.id} className={selectedItems.includes(item.id) ? 'selected-row' : ''}>
                <td className="checkbox-cell">
                  <input
                    type="checkbox"
                    checked={selectedItems.includes(item.id)}
                    onChange={() => handleItemSelect(item.id)}
                    title="선택"
                  />
                </td>
                <td>
                  <div className="code-cell">
                    <Hash size={14} />
                    <span className="code-value">{item.codeId}</span>
                    <div className="code-name">{item.codeName}</div>
                  </div>
                </td>
                <td>
                  <span className="version-badge">{item.version}</span>
                </td>
                <td>
                  <div 
                    className="change-type-badge"
                    style={{ color: getChangeTypeColor(item.changeType) }}
                  >
                    {getChangeTypeIcon(item.changeType)}
                    <span>{getChangeTypeLabel(item.changeType)}</span>
                  </div>
                </td>
                <td>
                  <div className="description-cell">
                    {item.description}
                  </div>
                </td>
                <td>
                  <div className="user-cell">
                    <User size={14} />
                    <span>{item.changedBy}</span>
                  </div>
                </td>
                <td>
                  <div className="date-cell">
                    <Calendar size={14} />
                    <span>{item.changedAt}</span>
                  </div>
                </td>
                <td>
                  <div className="value-cell previous">
                    {item.previousValue || '-'}
                  </div>
                </td>
                <td>
                  <div className="value-cell new">
                    {item.newValue || '-'}
                  </div>
                </td>
                <td>
                  <div className="tags-cell">
                    {item.tags.map((tag, index) => (
                      <span key={index} className="tag">
                        <Tag size={12} />
                        {tag}
                      </span>
                    ))}
                  </div>
                </td>
                <td>
                  <div className="action-buttons">
                    <button className="action-btn" title="상세보기">
                      <Eye size={14} />
                    </button>
                    <button className="action-btn" title="되돌리기">
                      <ArrowLeft size={14} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* 페이지네이션 */}
      {totalPages > 1 && (
        <div className="pagination">
          <button 
            className="pagination-btn"
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
          >
            <ArrowLeft size={16} />
            이전
          </button>
          
          <div className="page-numbers">
            {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
              <button
                key={page}
                className={`page-btn ${currentPage === page ? 'active' : ''}`}
                onClick={() => handlePageChange(page)}
              >
                {page}
              </button>
            ))}
          </div>
          
          <button 
            className="pagination-btn"
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
          >
            다음
            <ArrowRight size={16} />
          </button>
        </div>
      )}

      {/* 빈 상태 */}
      {sortedItems.length === 0 && (
        <div className="empty-state">
          <History size={48} />
          <h3>변경 이력이 없습니다</h3>
          <p>검색 조건을 변경하거나 코드를 수정해보세요.</p>
        </div>
      )}
    </div>
  );
};

export default CodeHistory;
