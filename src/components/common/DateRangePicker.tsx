import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Calendar, ChevronRight, AlertTriangle } from 'lucide-react';
import './DateRangePicker.css';

interface DateRangePickerProps {
  startDate: string;
  endDate: string;
  onStartDateChange: (date: string) => void;
  onEndDateChange: (date: string) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}

const DateRangePicker: React.FC<DateRangePickerProps> = ({
  startDate,
  endDate,
  onStartDateChange,
  onEndDateChange,
  placeholder = "날짜 범위를 선택하세요",
  className = "",
  disabled = false
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [leftMonth, setLeftMonth] = useState(new Date());
  const [rightMonth, setRightMonth] = useState(new Date(new Date().setMonth(new Date().getMonth() + 1)));
  const [tempStartDate, setTempStartDate] = useState<string>(startDate);
  const [tempEndDate, setTempEndDate] = useState<string>(endDate);
  const [alertMessage, setAlertMessage] = useState<string>('');
  const [showAlert, setShowAlert] = useState<boolean>(false);
  const [dropdownPosition, setDropdownPosition] = useState<'left' | 'right'>('left');
  const dropdownRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLDivElement>(null);

  // 날짜 포맷팅 함수 (YYYY-MM-DD 형식)
  const formatDate = (date: string) => {
    if (!date) return '';
    const d = new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // 오늘 날짜로 이동하는 함수
  const goToToday = (isLeftCalendar: boolean) => {
    const today = new Date();
    if (isLeftCalendar) {
      setLeftMonth(new Date(today.getFullYear(), today.getMonth()));
    } else {
      setRightMonth(new Date(today.getFullYear(), today.getMonth()));
    }
  };

  // 선택한 날짜를 완전히 클리어하는 함수
  const clearDates = () => {
    setTempStartDate('');
    setTempEndDate('');
    onStartDateChange('');
    onEndDateChange('');
    setIsOpen(false);
  };

  // 알림 표시 함수
  const showAlertMessage = (message: string) => {
    setAlertMessage(message);
    setShowAlert(true);
    // 3초 후 자동으로 사라지게 함
    setTimeout(() => {
      setShowAlert(false);
      setAlertMessage('');
    }, 3000);
  };

  // 날짜 유효성 검사
  const validateDateRange = (startDate: string, endDate: string) => {
    if (!startDate || !endDate) return { isValid: true, message: '' };
    
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    if (end < start) {
      return { 
        isValid: false, 
        message: '종료일은 시작일보다 이후여야 합니다.' 
      };
    }
    
    return { isValid: true, message: '' };
  };

  // 달력 날짜 생성 (특정 월 기준)
  const generateCalendarDays = (targetMonth: Date) => {
    const year = targetMonth.getFullYear();
    const month = targetMonth.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startDateOfWeek = firstDay.getDay();
    const daysInMonth = lastDay.getDate();

    const days = [];
    
    // 이전 달의 빈 날짜들
    for (let i = 0; i < startDateOfWeek; i++) {
      days.push(null);
    }
    
    // 현재 달의 날짜들
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(new Date(year, month, day));
    }
    
    return days;
  };

  // 날짜를 YYYY-MM-DD 형식으로 변환 (로컬 시간대 기준)
  const formatDateToString = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // 날짜 클릭 핸들러
  const handleDateClick = (date: Date) => {
    const dateStr = formatDateToString(date);
    
    if (!tempStartDate || (tempStartDate && tempEndDate)) {
      // 시작 날짜 선택 또는 재선택
      setTempStartDate(dateStr);
      setTempEndDate('');
    } else if (tempStartDate && !tempEndDate) {
      // 종료 날짜 선택 - 유효성 검사
      const validation = validateDateRange(tempStartDate, dateStr);
      if (validation.isValid) {
        setTempEndDate(dateStr);
      } else {
        // 오류 표시
        showAlertMessage(validation.message);
        return;
      }
    }
  };

  // 적용 버튼 클릭
  const handleApply = () => {
    onStartDateChange(tempStartDate);
    onEndDateChange(tempEndDate);
    setIsOpen(false);
  };

  // 취소 버튼 클릭
  const handleCancel = () => {
    setTempStartDate(startDate);
    setTempEndDate(endDate);
    setIsOpen(false);
  };

  // 왼쪽 달력 이전 달
  const goToPreviousLeftMonth = () => {
    setLeftMonth(new Date(leftMonth.getFullYear(), leftMonth.getMonth() - 1));
  };

  // 왼쪽 달력 다음 달
  const goToNextLeftMonth = () => {
    setLeftMonth(new Date(leftMonth.getFullYear(), leftMonth.getMonth() + 1));
  };

  // 오른쪽 달력 이전 달
  const goToPreviousRightMonth = () => {
    setRightMonth(new Date(rightMonth.getFullYear(), rightMonth.getMonth() - 1));
  };

  // 오른쪽 달력 다음 달
  const goToNextRightMonth = () => {
    setRightMonth(new Date(rightMonth.getFullYear(), rightMonth.getMonth() + 1));
  };

  // 날짜가 범위 내에 있는지 확인
  const isDateInRange = (date: Date) => {
    if (!tempStartDate || !tempEndDate) return false;
    const dateStr = formatDateToString(date);
    return dateStr >= tempStartDate && dateStr <= tempEndDate;
  };

  // 날짜가 시작/종료 날짜인지 확인
  const isStartDate = (date: Date) => {
    const dateStr = formatDateToString(date);
    return dateStr === tempStartDate;
  };

  const isEndDate = (date: Date) => {
    const dateStr = formatDateToString(date);
    return dateStr === tempEndDate;
  };

  // 같은 날짜인지 확인
  const isSameDate = (date: Date) => {
    return tempStartDate && tempEndDate && tempStartDate === tempEndDate && isStartDate(date);
  };

  // props 변경 시 temp 값 동기화
  useEffect(() => {
    setTempStartDate(startDate);
    setTempEndDate(endDate);
  }, [startDate, endDate]);

  // 외부 클릭 감지하여 드롭다운 닫기
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
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

  const displayText = startDate && endDate 
    ? `${formatDate(startDate)} ~ ${formatDate(endDate)}`
    : placeholder;

  return (
    <div className={`date-range-picker ${className}`}>
      <div 
        ref={triggerRef}
        className={`date-range-picker-trigger ${disabled ? 'disabled' : ''}`}
        onClick={() => {
          if (!disabled) {
            if (!isOpen && triggerRef.current) {
              // 성능 최적화: requestAnimationFrame으로 위치 계산 지연
              requestAnimationFrame(() => {
                if (triggerRef.current) {
                  // 달력이 열릴 때 위치 계산 (fixed position용)
                  const triggerRect = triggerRef.current.getBoundingClientRect();
                  const viewportWidth = window.innerWidth;
                  const dropdownWidth = 450; // 기간달력 드롭다운의 예상 너비
                  
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
        <Calendar size={16} />
        <span className="date-range-picker-text">{displayText}</span>
        <ChevronRight 
          size={16} 
          className={`date-range-picker-arrow ${isOpen ? 'open' : ''}`}
        />
      </div>

      {isOpen && triggerRef.current && createPortal(
        <div 
          ref={dropdownRef}
          className={`date-range-picker-dropdown ${dropdownPosition === 'right' ? 'position-right' : 'position-left'}`}
          style={{ 
            zIndex: 999999999,
            // 성능 최적화: getBoundingClientRect 호출 최소화
            ...(triggerRef.current ? {
              top: triggerRef.current.getBoundingClientRect().bottom + 2,
              left: dropdownPosition === 'right' 
                ? triggerRef.current.getBoundingClientRect().right - 450 
                : triggerRef.current.getBoundingClientRect().left
            } : {})
          }}
        >
          {/* 알림창 */}
          {showAlert && (
            <div className="date-range-picker-alert">
              <AlertTriangle size={16} />
              <span>{alertMessage}</span>
            </div>
          )}
          
          <div className="date-range-picker-today-info">
            오늘: {formatDate(formatDateToString(new Date()))}
          </div>
          <div className="date-range-picker-calendars">
            {/* 왼쪽 달력 */}
            <div className="date-range-picker-calendar-container">
              <div className="date-range-picker-header">
                <button 
                  type="button" 
                  className="date-range-picker-nav-btn"
                  onClick={goToPreviousLeftMonth}
                >
                  <span className="date-range-picker-arrow-text">‹</span>
                </button>
                <span className="date-range-picker-month">
                  {leftMonth.getFullYear()}년 {leftMonth.getMonth() + 1}월
                </span>
                <button 
                  type="button" 
                  className="date-range-picker-nav-btn"
                  onClick={goToNextLeftMonth}
                >
                  <span className="date-range-picker-arrow-text">›</span>
                </button>
              </div>
              <div className="date-range-picker-today-btn-container">
                <button 
                  type="button" 
                  className="date-range-picker-today-btn"
                  onClick={() => goToToday(true)}
                >
                  오늘
                </button>
              </div>

              <div className="date-range-picker-calendar">
                <div className="date-range-picker-weekdays">
                  {['일', '월', '화', '수', '목', '금', '토'].map(day => (
                    <div key={day} className="date-range-picker-weekday">{day}</div>
                  ))}
                </div>
                <div className="date-range-picker-days">
                  {generateCalendarDays(leftMonth).map((date, index) => {
                    if (!date) {
                      return <div key={`left-${index}`} className="date-range-picker-day empty"></div>;
                    }
                    
                    const dateStr = formatDateToString(date);
                    const isToday = dateStr === formatDateToString(new Date());
                    const isSelected = isStartDate(date) || isEndDate(date);
                    const isInRange = isDateInRange(date);
                    const isSame = isSameDate(date);
                    
                    return (
                      <div
                        key={`left-${index}`}
                        className={`date-range-picker-day ${
                          isSelected ? 'selected' : ''
                        } ${
                          isInRange ? 'in-range' : ''
                        } ${
                          isToday ? 'today' : ''
                        } ${
                          isStartDate(date) ? 'start-date' : ''
                        } ${
                          isEndDate(date) ? 'end-date' : ''
                        } ${
                          isSame ? 'same-date' : ''
                        }`}
                        onClick={() => handleDateClick(date)}
                        title={isSelected ? `${dateStr} ${isStartDate(date) ? '(시작일)' : '(종료일)'}` : dateStr}
                      >
                        {date.getDate()}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* 오른쪽 달력 */}
            <div className="date-range-picker-calendar-container">
              <div className="date-range-picker-header">
                <button 
                  type="button" 
                  className="date-range-picker-nav-btn"
                  onClick={goToPreviousRightMonth}
                >
                  <span className="date-range-picker-arrow-text">‹</span>
                </button>
                <span className="date-range-picker-month">
                  {rightMonth.getFullYear()}년 {rightMonth.getMonth() + 1}월
                </span>
                <button 
                  type="button" 
                  className="date-range-picker-nav-btn"
                  onClick={goToNextRightMonth}
                >
                  <span className="date-range-picker-arrow-text">›</span>
                </button>
              </div>
              <div className="date-range-picker-today-btn-container">
                <button 
                  type="button" 
                  className="date-range-picker-today-btn"
                  onClick={() => goToToday(false)}
                >
                  오늘
                </button>
              </div>

              <div className="date-range-picker-calendar">
                <div className="date-range-picker-weekdays">
                  {['일', '월', '화', '수', '목', '금', '토'].map(day => (
                    <div key={day} className="date-range-picker-weekday">{day}</div>
                  ))}
                </div>
                <div className="date-range-picker-days">
                  {generateCalendarDays(rightMonth).map((date, index) => {
                    if (!date) {
                      return <div key={`right-${index}`} className="date-range-picker-day empty"></div>;
                    }
                    
                    const dateStr = formatDateToString(date);
                    const isToday = dateStr === formatDateToString(new Date());
                    const isSelected = isStartDate(date) || isEndDate(date);
                    const isInRange = isDateInRange(date);
                    const isSame = isSameDate(date);
                    
                    return (
                      <div
                        key={`right-${index}`}
                        className={`date-range-picker-day ${
                          isSelected ? 'selected' : ''
                        } ${
                          isInRange ? 'in-range' : ''
                        } ${
                          isToday ? 'today' : ''
                        } ${
                          isStartDate(date) ? 'start-date' : ''
                        } ${
                          isEndDate(date) ? 'end-date' : ''
                        } ${
                          isSame ? 'same-date' : ''
                        }`}
                        onClick={() => handleDateClick(date)}
                        title={isSelected ? `${dateStr} ${isStartDate(date) ? '(시작일)' : '(종료일)'}` : dateStr}
                      >
                        {date.getDate()}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          <div className="date-range-picker-footer">
            <div className="date-range-picker-selection-info">
              {tempStartDate && tempEndDate ? (
                <span className="date-range-picker-selection-text">
                  선택된 기간: {formatDate(tempStartDate)} ~ {formatDate(tempEndDate)}
                </span>
              ) : tempStartDate ? (
                <span className="date-range-picker-selection-text">
                  시작일: {formatDate(tempStartDate)} (종료일을 선택하세요)
                </span>
              ) : (
                <span className="date-range-picker-selection-text">
                  날짜 범위를 선택하세요
                </span>
              )}
            </div>
            <div className="date-range-picker-buttons">
              <button 
                type="button" 
                className="date-range-picker-btn date-range-picker-btn-cancel"
                onClick={handleCancel}
              >
                취소
              </button>
              <button 
                type="button" 
                className="date-range-picker-btn date-range-picker-btn-clear"
                onClick={clearDates}
                disabled={!tempStartDate && !tempEndDate}
              >
                클리어
              </button>
              <button 
                type="button" 
                className="date-range-picker-btn date-range-picker-btn-apply"
                onClick={handleApply}
                disabled={!tempStartDate || !tempEndDate}
              >
                적용
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

export default DateRangePicker;
