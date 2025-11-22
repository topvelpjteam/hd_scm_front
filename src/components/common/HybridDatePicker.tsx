import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Calendar } from 'lucide-react';
import './HybridDatePicker.css';

interface HybridDatePickerProps {
  value: string;
  onChange: (value: string) => void;
  className?: string;
  required?: boolean;
  disabled?: boolean;
  placeholder?: string;
}

const HybridDatePicker: React.FC<HybridDatePickerProps> = ({
  value,
  onChange,
  className = '',
  required = false,
  disabled = false,
  placeholder = 'YYYY-MM-DD'
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [inputValue, setInputValue] = useState(value);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [isValid, setIsValid] = useState(true);
  
  const triggerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // value prop이 변경될 때 inputValue 동기화
  useEffect(() => {
    setInputValue(value);
    if (value) {
      const date = new Date(value);
      if (!isNaN(date.getTime())) {
        setSelectedDate(date);
        setCurrentDate(date);
      }
    } else {
      setSelectedDate(null);
    }
  }, [value]);

  // 날짜 유효성 검사
  const validateDate = (dateString: string): boolean => {
    if (!dateString) return true; // 빈 값은 유효
    
    const regex = /^\d{4}-\d{2}-\d{2}$/;
    if (!regex.test(dateString)) return false;
    
    const date = new Date(dateString);
    return !isNaN(date.getTime()) && dateString === formatDateToString(date);
  };

  // 날짜를 YYYY-MM-DD 형식으로 변환
  const formatDateToString = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // 입력값 변경 처리
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setInputValue(newValue);
    
    const valid = validateDate(newValue);
    setIsValid(valid);
    
    if (valid && newValue) {
      const date = new Date(newValue);
      if (!isNaN(date.getTime())) {
        setSelectedDate(date);
        setCurrentDate(date);
        onChange(newValue);
      }
    } else if (!newValue) {
      setSelectedDate(null);
      onChange('');
    }
  };

  // 달력 팝업 토글
  const toggleCalendar = () => {
    if (disabled) return;
    setIsOpen(!isOpen);
  };

  // 외부 클릭 시 팝업 닫기
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (triggerRef.current && !triggerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // 달력 관련 함수들
  const getDaysInMonth = (date: Date): number => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date: Date): number => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  };

  const goToPreviousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const goToNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const goToToday = () => {
    const today = new Date();
    setCurrentDate(today);
    setSelectedDate(today);
    const todayString = formatDateToString(today);
    setInputValue(todayString);
    onChange(todayString);
    setIsOpen(false);
  };

  const handleDateClick = (day: number) => {
    const newDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
    setSelectedDate(newDate);
    const dateString = formatDateToString(newDate);
    setInputValue(dateString);
    onChange(dateString);
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

  const todayString = formatDateToString(new Date());

  return (
    <div className={`hybrid-date-picker ${className}`} ref={triggerRef}>
      <div className={`hybrid-date-picker-trigger ${required ? 'required' : ''} ${disabled ? 'disabled' : ''} ${!isValid ? 'invalid' : ''}`}>
        <input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={handleInputChange}
          placeholder={placeholder}
          disabled={disabled}
          className="hybrid-date-picker-input"
        />
        <button
          type="button"
          className="hybrid-date-picker-calendar-btn"
          onClick={toggleCalendar}
          disabled={disabled}
        >
          <Calendar size={14} />
        </button>
      </div>

      {isOpen && triggerRef.current && createPortal(
        <div 
          className="hybrid-date-picker-dropdown"
          style={{ 
            zIndex: 9999999999,
            position: 'fixed',
            top: triggerRef.current.getBoundingClientRect().bottom + 2,
            left: triggerRef.current.getBoundingClientRect().left
          }}
        >
          {/* 오늘 날짜 표시 */}
          <div className="hybrid-date-picker-today-info">
            오늘: {todayString}
          </div>

          {/* 달력 헤더 */}
          <div className="hybrid-date-picker-header">
            <button 
              className="hybrid-date-picker-nav-btn" 
              onMouseDown={(e) => {
                e.stopPropagation();
                e.preventDefault();
                goToPreviousMonth();
              }}
            >
              <span className="hybrid-date-picker-arrow-text">‹</span>
            </button>
            <h3 className="hybrid-date-picker-month-year">
              {currentDate.getFullYear()}년 {String(currentDate.getMonth() + 1).padStart(2, '0')}월
            </h3>
            <button 
              className="hybrid-date-picker-nav-btn" 
              onMouseDown={(e) => {
                e.stopPropagation();
                e.preventDefault();
                goToNextMonth();
              }}
            >
              <span className="hybrid-date-picker-arrow-text">›</span>
            </button>
          </div>

          {/* 오늘 버튼 */}
          <div className="hybrid-date-picker-today-btn-container">
            <button 
              className="hybrid-date-picker-today-btn" 
              onMouseDown={(e) => {
                e.stopPropagation();
                e.preventDefault();
                goToToday();
              }}
            >
              오늘
            </button>
          </div>

          {/* 요일 헤더 */}
          <div className="hybrid-date-picker-weekdays">
            {['일', '월', '화', '수', '목', '금', '토'].map(day => (
              <div key={day} className="hybrid-date-picker-weekday">{day}</div>
            ))}
          </div>

          {/* 달력 그리드 */}
          <div className="hybrid-date-picker-calendar">
            {Array.from({ length: getFirstDayOfMonth(currentDate) }, (_, i) => (
              <div key={`empty-${i}`} className="hybrid-date-picker-day empty"></div>
            ))}
            {Array.from({ length: getDaysInMonth(currentDate) }, (_, i) => {
              const day = i + 1;
              return (
                <button
                  key={day}
                  className={`hybrid-date-picker-day ${
                    isToday(day) ? 'today' : ''
                  } ${
                    isSelected(day) ? 'selected' : ''
                  }`}
                  onMouseDown={(e) => {
                    e.stopPropagation();
                    e.preventDefault();
                    handleDateClick(day);
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

export default HybridDatePicker;
