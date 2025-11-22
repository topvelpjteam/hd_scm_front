import React, { useState, useEffect, useMemo } from 'react';
import { ChevronDown } from 'lucide-react';
import { commonCodeService, CommonCodeOption } from '../services/commonCodeService';
import './CommonMultiSelect.css';

interface Option {
  value: string;
  label: string;
}

// 공통 코드 타입 정의
type CommonCodeType = 
  | 'goodsGbn'      // 상품구분
  | 'brands'        // 브랜드
  | 'btypes'        // 대분류
  | 'mtypes'        // 중분류
  | 'stypes'        // 소분류
  | 'nations'       // 원산지 국가
  | 'makerGbn'      // 메이커구분
  | 'collectionGbn' // 컬렉션구분
  | 'channGbn'      // 채널구분
  | 'manaGbn'       // 운용구분
  | 'boxGbn'        // 포장단위
  | 'moneyGbn'      // 화폐구분
  | 'agentGbn'      // 거래처구분
  | 'bankGbn'       // 은행구분
  | 'stores'        // 매장
  | 'vendors'       // 납품업체
  | 'agents'        // 거래업체
  | 'emailStatus';  // 이메일 전송 상태

interface CommonMultiSelectProps {
  // 기존 방식: 직접 옵션 전달
  options?: Option[];
  // 새로운 방식: 공통 코드 타입으로 자동 로딩
  commonCodeType?: CommonCodeType;
  // 브랜드 조회 시 필요한 거래업체 ID
  agentId?: string;
  selectedValues: string[];
  onSelectionChange: (values: string[]) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  label?: string;
  disabled?: boolean;
  className?: string;
  // 로딩 상태 표시 여부
  showLoading?: boolean;
}

const CommonMultiSelect: React.FC<CommonMultiSelectProps> = ({
  options,
  commonCodeType,
  agentId,
  selectedValues,
  onSelectionChange,
  placeholder = "항목을 선택하세요",
  searchPlaceholder = "검색...",
  label,
  disabled = false,
  className = "",
  showLoading = true
}) => {
  // 안전한 기본값 설정
  const safeSelectedValues = Array.isArray(selectedValues) ? selectedValues : [];
  
  // 공통 코드 옵션 상태 관리
  const [commonCodeOptions, setCommonCodeOptions] = useState<Option[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  
  const [showDropdown, setShowDropdown] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [visibleCount, setVisibleCount] = useState(safeSelectedValues.length);

  // 공통 코드 로딩 함수
  const loadCommonCodeOptions = async (codeType: CommonCodeType, agentId?: string) => {
    if (!showLoading) return;
    
    setIsLoading(true);
    setLoadError(null);
    
    try {
      let loadedOptions: CommonCodeOption[] = [];
      
      switch (codeType) {
        case 'goodsGbn':
          loadedOptions = await commonCodeService.getGoodsGbn();
          break;
        case 'brands':
          loadedOptions = await commonCodeService.getBrands(agentId);
          break;
        case 'btypes':
          loadedOptions = await commonCodeService.getBTypes();
          break;
        case 'mtypes':
          loadedOptions = await commonCodeService.getMTypes();
          break;
        case 'stypes':
          loadedOptions = await commonCodeService.getSTypes();
          break;
        case 'nations':
          loadedOptions = await commonCodeService.getNations();
          break;
        case 'makerGbn':
          loadedOptions = await commonCodeService.getMakerGbn();
          break;
        case 'collectionGbn':
          loadedOptions = await commonCodeService.getCollectionGbn();
          break;
        case 'channGbn':
          loadedOptions = await commonCodeService.getChannGbn();
          break;
        case 'manaGbn':
          loadedOptions = await commonCodeService.getManaGbn();
          break;
        case 'boxGbn':
          loadedOptions = await commonCodeService.getBoxGbn();
          break;
        case 'moneyGbn':
          loadedOptions = await commonCodeService.getMoneyGbn();
          break;
        case 'agentGbn':
          loadedOptions = await commonCodeService.getAgentGbn();
          break;
        case 'bankGbn':
          loadedOptions = await commonCodeService.getBankGbn();
          break;
        case 'stores':
          loadedOptions = await commonCodeService.getStores();
          break;
        case 'vendors':
          loadedOptions = await commonCodeService.getVendors();
          break;
        case 'agents':
          loadedOptions = await commonCodeService.getAgents();
          break;
        case 'emailStatus':
          loadedOptions = await commonCodeService.getEmailStatus();
          break;
        default:
          throw new Error(`지원하지 않는 공통 코드 타입입니다: ${codeType}`);
      }
      
      setCommonCodeOptions(loadedOptions);
    } catch (error: any) {
      console.error('공통 코드 로딩 오류:', error);
      setLoadError(error.message || '데이터를 불러오는데 실패했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  // 공통 코드 타입이 변경되거나 agentId가 변경될 때 로딩
  useEffect(() => {
    if (commonCodeType) {
      loadCommonCodeOptions(commonCodeType, agentId);
    }
  }, [commonCodeType, agentId]);

  // 최종 옵션 결정 (공통 코드 우선, 없으면 직접 전달된 옵션 사용)
  const finalOptions = useMemo(() => {
    if (commonCodeType && commonCodeOptions.length > 0) {
      return commonCodeOptions;
    }
    return options || [];
  }, [commonCodeType, commonCodeOptions, options]);

  // 외부 클릭 시 드롭다운 닫기
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (!target.closest('.common-multi-select-container')) {
        setShowDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // 검색된 옵션 필터링
  const filteredOptions = useMemo(() => {
    if (!searchTerm) return finalOptions;
    return finalOptions.filter(option => 
      option.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
      option.value.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [finalOptions, searchTerm]);

  // 간단한 표시 개수 계산: 첫 번째 아이템만 표시
  const calculateVisibleCount = () => {
    if (safeSelectedValues.length === 0) {
      setVisibleCount(0);
      return;
    }
    
    // 첫 번째 아이템만 표시하고 나머지는 "외 N개"로 표시
    const count = safeSelectedValues.length > 1 ? 1 : safeSelectedValues.length;
    setVisibleCount(count);
  };

  useEffect(() => {
    calculateVisibleCount();
  }, [safeSelectedValues]);

  // 전체 선택
  const handleSelectAll = () => {
    const allValues = finalOptions.map(option => option.value);
    onSelectionChange(allValues);
  };

  // 전체 선택 취소
  const handleDeselectAll = () => {
    onSelectionChange([]);
  };

  // 개별 항목 선택/해제
  const handleOptionToggle = (value: string) => {
    const newSelected = safeSelectedValues.includes(value)
      ? safeSelectedValues.filter(v => v !== value)
      : [...safeSelectedValues, value];
    onSelectionChange(newSelected);
  };

  // 개별 항목 제거
  const handleRemoveItem = (value: string) => {
    const newSelected = safeSelectedValues.filter(v => v !== value);
    onSelectionChange(newSelected);
  };

  return (
    <div className={`common-multi-select-container ${className}`}>
      {label && <label className="multi-select-label">{label}</label>}
      
      <div 
        className={`multi-select-trigger ${disabled ? 'disabled' : ''}`}
        onClick={() => !disabled && setShowDropdown(!showDropdown)}
      >
        <div className="selected-items">
          {safeSelectedValues.length === 0 ? (
            <span className="placeholder">{placeholder}</span>
          ) : (
            <>
                             {/* 보이는 아이템만 렌더링 */}
               {safeSelectedValues.slice(0, visibleCount).map((value) => {
                 const option = finalOptions.find(opt => opt.value === value);
                 return (
                   <span 
                     key={value} 
                     className="selected-item"
                   >
                     {option?.label || value}
                     <button
                       type="button"
                       className="remove-btn"
                       onClick={(e) => {
                         e.stopPropagation();
                         handleRemoveItem(value);
                       }}
                     >
                       ×
                     </button>
                   </span>
                 );
               })}
              {/* "외 N개" 표시 */}
              {visibleCount < selectedValues.length && (
                <span className="selected-item overflow-indicator">
                  외 {selectedValues.length - visibleCount}개
                </span>
              )}
            </>
          )}
        </div>
        <ChevronDown size={12} className={`dropdown-icon ${showDropdown ? 'rotated' : ''}`} />
      </div>
      
      {showDropdown && (
        <div className="dropdown-menu">
          {/* 로딩 상태 표시 */}
          {isLoading && (
            <div className="loading-indicator">
              데이터를 불러오는 중...
            </div>
          )}
          
          {/* 에러 상태 표시 */}
          {loadError && (
            <div className="error-indicator">
              {loadError}
              <button 
                type="button"
                className="retry-btn"
                onClick={() => commonCodeType && loadCommonCodeOptions(commonCodeType, agentId)}
              >
                다시 시도
              </button>
            </div>
          )}
          
          {/* 정상 상태일 때만 검색 및 옵션 표시 */}
          {!isLoading && !loadError && (
            <>
              {/* 검색 입력 */}
              <div className="dropdown-search">
                <input
                  type="text"
                  placeholder={searchPlaceholder}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="search-input"
                  onClick={(e) => e.stopPropagation()}
                />
              </div>
              
              {/* 전체 선택/해제 버튼 */}
              <div className="dropdown-actions">
                <button
                  type="button"
                  className="action-btn select-all-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleSelectAll();
                  }}
                >
                  전체 선택
                </button>
                <button
                  type="button"
                  className="action-btn deselect-all-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeselectAll();
                  }}
                >
                  선택 취소
                </button>
              </div>
              
              {/* 옵션 목록 */}
              <div className="dropdown-options">
                {filteredOptions.length > 0 ? (
                  filteredOptions.map(option => (
                    <div
                      key={option.value}
                      className={`dropdown-option ${selectedValues.includes(option.value) ? 'selected' : ''}`}
                      onClick={() => handleOptionToggle(option.value)}
                    >
                      <input
                        type="checkbox"
                        checked={selectedValues.includes(option.value)}
                        readOnly
                      />
                      <span className="option-label">{option.label}</span>
                    </div>
                  ))
                ) : (
                  <div className="no-results">
                    {searchTerm ? '검색 결과가 없습니다.' : '데이터가 없습니다.'}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default CommonMultiSelect;
