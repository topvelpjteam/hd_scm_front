import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import './SingleDatePicker.css';

interface SingleDatePickerProps {
  value: string;
  onChange: (date: string) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  required?: boolean; // 필수입력 여부
}

const SingleDatePicker: React.FC<SingleDatePickerProps> = ({
  value,
  onChange,
  placeholder = "날짜를 선택하세요",
  disabled = false,
  className = "",
  required = false
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(
    value ? new Date(value) : null
  );
  const [dropdownPosition, setDropdownPosition] = useState<'left' | 'right'>('left');
  const dropdownRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLDivElement>(null);

  // 외부 클릭 시 닫기
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // value 변경 시 selectedDate 업데이트
  useEffect(() => {
    if (value) {
      setSelectedDate(new Date(value));
    } else {
      setSelectedDate(null);
    }
  }, [value]);

  const formatDateToString = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const goToToday = () => {
    console.log('🔍 오늘 버튼 클릭');
    const today = new Date();
    setCurrentDate(today);
    setSelectedDate(today);
    onChange(formatDateToString(today));
    setIsOpen(false);
  };

  const handleDateClick = (day: number) => {
    console.log('🔍 날짜 클릭:', day);
    const newDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
    setSelectedDate(newDate);
    onChange(formatDateToString(newDate));
    setIsOpen(false);
  };

  const isToday = (day: number): boolean => {
    const today = new Date();
    const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
    return formatDateToString(date) === formatDateToString(today);
  };

  const isSelected = (day: number): boolean => {
    if (!selectedDate) return false;
    const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
    return formatDateToString(date) === formatDateToString(selectedDate);
  };

  const getDaysInMonth = (date: Date): number => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date: Date): number => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  };

  const goToPreviousMonth = () => {
    console.log('🔍 이전 월 버튼 클릭');
    console.log('🔍 현재 날짜:', currentDate);
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const goToNextMonth = () => {
    console.log('🔍 다음 월 버튼 클릭');
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const getDisplayText = (): string => {
    if (selectedDate) {
      return formatDateToString(selectedDate);
    }
    return placeholder;
  };

  const today = new Date();
  const todayString = formatDateToString(today);

  return (
    <div className={`single-date-picker ${className}`} ref={dropdownRef}>
      <div 
        ref={triggerRef}
        className={`single-date-picker-trigger ${disabled ? 'disabled' : ''} ${required ? 'required' : ''}`}
        onClick={() => {
          if (!disabled) {
            if (!isOpen && triggerRef.current) {
              // 성능 최적화: requestAnimationFrame으로 위치 계산 지연
              requestAnimationFrame(() => {
                if (triggerRef.current) {
                  // 달력이 열릴 때 위치 계산 (fixed position용)
                  const triggerRect = triggerRef.current.getBoundingClientRect();
                  const viewportWidth = window.innerWidth;
                  const dropdownWidth = 280; // 달력 드롭다운의 예상 너비
                  
                  // 오른쪽 여백이 부족하면 왼쪽으로 정렬
                  if (triggerRect.right + dropdownWidth > viewportWidth) {
                    setDropdownPosition('right');
                  } else {
                    setDropdownPosition('left');
                  }
                }
              });
            }
            setIsOpen(!isOpen);
          }
        }}
      >
        <span className="single-date-picker-text">{getDisplayText()}</span>
        <span className={`single-date-picker-arrow ${isOpen ? 'open' : ''}`}>›</span>
      </div>

      {isOpen && triggerRef.current && createPortal(
        <div 
          className={`single-date-picker-dropdown ${dropdownPosition === 'right' ? 'position-right' : 'position-left'}`}
          style={{ 
            zIndex: 9999999999,
            position: 'fixed',
            // 성능 최적화: getBoundingClientRect 호출 최소화
            ...(triggerRef.current ? {
              top: triggerRef.current.getBoundingClientRect().bottom + 2,
              left: dropdownPosition === 'right' 
                ? triggerRef.current.getBoundingClientRect().right - 280 
                : triggerRef.current.getBoundingClientRect().left
            } : {})
          }}
        >
          {/* 오늘 날짜 표시 */}
          <div className="single-date-picker-today-info">
            오늘: {todayString}
          </div>

          {/* 달력 헤더 */}
          <div className="single-date-picker-header">
            <button 
              className="single-date-picker-nav-btn" 
              onMouseDown={(e) => {
                console.log('🔍 이전 월 버튼 마우스 다운 이벤트 발생!');
                e.stopPropagation();
                e.preventDefault();
                console.log('🔍 이전 월 버튼 마우스 다운에서 함수 호출 시도');
                goToPreviousMonth();
              }}
              onMouseUp={() => {
                console.log('🔍 이전 월 버튼 마우스 업 이벤트 발생!');
              }}
            >
              <span className="single-date-picker-arrow-text">‹</span>
            </button>
            <h3 className="single-date-picker-month-year">
              {currentDate.getFullYear()}년 {String(currentDate.getMonth() + 1).padStart(2, '0')}월
            </h3>
            <button 
              className="single-date-picker-nav-btn" 
              onMouseDown={(e) => {
                console.log('🔍 다음 월 버튼 마우스 다운 이벤트 발생!');
                e.stopPropagation();
                e.preventDefault();
                console.log('🔍 다음 월 버튼 마우스 다운에서 함수 호출 시도');
                goToNextMonth();
              }}
              onMouseUp={() => {
                console.log('🔍 다음 월 버튼 마우스 업 이벤트 발생!');
              }}
            >
              <span className="single-date-picker-arrow-text">›</span>
            </button>
          </div>

          {/* 오늘 버튼 */}
          <div className="single-date-picker-today-btn-container">
            <button 
              className="single-date-picker-today-btn" 
              onMouseDown={(e) => {
                console.log('🔍 오늘 버튼 마우스 다운 이벤트 발생!');
                e.stopPropagation();
                e.preventDefault();
                console.log('🔍 오늘 버튼 마우스 다운에서 함수 호출 시도');
                goToToday();
              }}
              onMouseUp={() => {
                console.log('🔍 오늘 버튼 마우스 업 이벤트 발생!');
              }}
            >
              오늘
            </button>
          </div>

          {/* 요일 헤더 */}
          <div className="single-date-picker-weekdays">
            {['일', '월', '화', '수', '목', '금', '토'].map(day => (
              <div key={day} className="single-date-picker-weekday">{day}</div>
            ))}
          </div>

          {/* 달력 그리드 */}
          <div className="single-date-picker-calendar">
            {Array.from({ length: getFirstDayOfMonth(currentDate) }, (_, i) => (
              <div key={`empty-${i}`} className="single-date-picker-day empty"></div>
            ))}
            {Array.from({ length: getDaysInMonth(currentDate) }, (_, i) => {
              const day = i + 1;
              return (
                <button
                  key={day}
                  className={`single-date-picker-day ${
                    isToday(day) ? 'today' : ''
                  } ${
                    isSelected(day) ? 'selected' : ''
                  }`}
                  onMouseDown={(e) => {
                    console.log(`🔍 날짜 ${day} 마우스 다운 이벤트 발생!`);
                    e.stopPropagation();
                    e.preventDefault();
                    console.log(`🔍 날짜 ${day} 마우스 다운에서 함수 호출 시도`);
                    handleDateClick(day);
                  }}
                  onMouseUp={() => {
                    console.log(`🔍 날짜 ${day} 마우스 업 이벤트 발생!`);
                  }}
                >
                  {day}
                </button>
              );
            })}
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

export default SingleDatePicker;
