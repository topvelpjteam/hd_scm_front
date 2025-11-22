import React, { useState, useEffect } from 'react';
import { Wifi, Zap, Clock, Info, Search, Save, Trash2, Download, RefreshCw } from 'lucide-react';
import '../styles/Footer.css';

const Footer: React.FC = () => {
  const [currentTime, setCurrentTime] = useState(new Date());

  // 시간 업데이트
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // 시간 포맷팅
  const formatTime = (date: Date) => {
    const hours = date.getHours();
    const minutes = date.getMinutes();
    const seconds = date.getSeconds();
    const ampm = hours >= 12 ? '오후' : '오전';
    const formattedHours = hours % 12 || 12;
    const formattedMinutes = minutes.toString().padStart(2, '0');
    const formattedSeconds = seconds.toString().padStart(2, '0');
    
    return `${ampm} ${formattedHours}:${formattedMinutes}:${formattedSeconds}`;
  };

  // 날짜 포맷팅
  const formatDate = (date: Date) => {
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    
    return `${year}. ${month}. ${day}.`;
  };

  // 버튼 클릭 핸들러들
  const handleSearch = () => {
    console.log('조회 버튼 클릭');
    // 조회 기능 구현
  };

  const handleSave = () => {
    console.log('저장 버튼 클릭');
    // 저장 기능 구현
  };

  const handleDelete = () => {
    console.log('삭제 버튼 클릭');
    // 삭제 기능 구현
  };

  const handleExport = () => {
    console.log('내보내기 버튼 클릭');
    // 내보내기 기능 구현
  };

  const handleRefresh = () => {
    console.log('새로고침 버튼 클릭');
    // 새로고침 기능 구현
    window.location.reload();
  };

  return (
    <footer className="footer">
      {/* 좌측 영역 - 시간 및 시스템 상태 */}
      <div className="footer-left">
        <div className="time-display">
          <Clock size={14} />
          <span>{formatTime(currentTime)} {formatDate(currentTime)}</span>
        </div>
        
        <div className="status-indicator">
          <Zap size={14} />
          <span>시스템 정상</span>
          <div className="status-dot"></div>
        </div>
      </div>

      {/* 중앙 영역 - 액션 버튼들 */}
      <div className="footer-center">
        <button className="footer-button primary" onClick={handleSearch} title="조회">
          <Search size={14} />
          <span>조회</span>
        </button>
        
        <button className="footer-button success" onClick={handleSave} title="저장">
          <Save size={14} />
          <span>저장</span>
        </button>
        
        <button className="footer-button danger" onClick={handleDelete} title="삭제">
          <Trash2 size={14} />
          <span>삭제</span>
        </button>
        
        <button className="footer-button info" onClick={handleExport} title="내보내기">
          <Download size={14} />
          <span>내보내기</span>
        </button>
        
        <button className="footer-button secondary" onClick={handleRefresh} title="새로고침">
          <RefreshCw size={14} />
          <span>새로고침</span>
        </button>
      </div>

      {/* 우측 영역 - 버전 정보 */}
      <div className="footer-right">
        <div className="system-info">
          <Info size={14} />
          <span>100%</span>
        </div>
        
        <div className="version-info">
          HD SYNC v1.0.0
        </div>
      </div>
    </footer>
  );
};

export default Footer;
