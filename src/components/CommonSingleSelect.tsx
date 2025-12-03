import React, { useState, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';
import './CommonSingleSelect.css';

interface Option {
  value: string;
  label: string;
}

interface CommonSingleSelectProps {
  options: Option[];
  value?: string;
  onChange: (value: string) => void;
  placeholder?: string;
  label?: string;
  disabled?: boolean;
  className?: string;
  required?: boolean;
}

const CommonSingleSelect: React.FC<CommonSingleSelectProps> = ({
  options,
  value,
  onChange,
  placeholder = "항목을 선택하세요",
  label,
  disabled = false,
  className = "",
  required = false
}) => {
  const [showDropdown, setShowDropdown] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // 외부 클릭 시 드롭다운 닫기
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (!target.closest('.common-single-select-container')) {
        setShowDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // 검색된 옵션 필터링
  const filteredOptions = options.filter(option => 
    option.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
    option.value.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // 선택된 옵션의 라벨 찾기
  const selectedOption = options.find(option => option.value === value);

  // 옵션 선택 처리
  const handleOptionSelect = (optionValue: string) => {
    onChange(optionValue);
    setShowDropdown(false);
    setSearchTerm('');
  };

  // 드롭다운 토글
  const toggleDropdown = () => {
    if (!disabled) {
      setShowDropdown(!showDropdown);
      if (!showDropdown) {
        setSearchTerm('');
      }
    }
  };

  return (
    <div className={`common-single-select-container ${className}`}>
      {label && (
        <label className="select-label">
          {label}
          {required && <span className="required-mark">*</span>}
        </label>
      )}
      
      <div 
        className={`select-display ${disabled ? 'disabled' : ''} ${showDropdown ? 'active' : ''}`}
        onClick={toggleDropdown}
      >
        <span className={`selected-value ${!selectedOption ? 'placeholder' : ''}`}>
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <ChevronDown className={`chevron-icon ${showDropdown ? 'rotated' : ''}`} />
      </div>

      {showDropdown && (
        <div className="dropdown-menu">
          <div className="search-container">
            <input
              type="text"
              placeholder="검색..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
              autoFocus
            />
          </div>
          
          <div className="options-list">
            {filteredOptions.length > 0 ? (
              filteredOptions.map((option) => (
                <div
                  key={option.value}
                  className={`option-item ${option.value === value ? 'selected' : ''}`}
                  onClick={() => handleOptionSelect(option.value)}
                >
                  {option.label}
                </div>
              ))
            ) : (
              <div className="no-options">검색 결과가 없습니다.</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default CommonSingleSelect;
