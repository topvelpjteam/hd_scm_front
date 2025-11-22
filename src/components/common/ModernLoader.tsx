import React from 'react';
import './ModernLoader.css';

interface ModernLoaderProps {
  message?: string;
  size?: 'small' | 'medium' | 'large';
  overlay?: boolean;
}

const ModernLoader: React.FC<ModernLoaderProps> = ({ 
  message = "로딩 중...", 
  size = 'medium',
  overlay = true
}) => {
  return (
    <div className={`modern-loader ${overlay ? 'overlay' : ''}`}>
      <div className={`loader-container ${size}`}>
        {/* 메인 스피너 */}
        <div className="spinner">
          <div className="spinner-ring"></div>
          <div className="spinner-ring"></div>
          <div className="spinner-ring"></div>
        </div>
        
        {/* 펄스 애니메이션 */}
        <div className="pulse-dots">
          <div className="pulse-dot"></div>
          <div className="pulse-dot"></div>
          <div className="pulse-dot"></div>
        </div>
        
        {/* 로딩 텍스트 */}
        <div className="loading-text">{message}</div>
      </div>
    </div>
  );
};

export default ModernLoader;
