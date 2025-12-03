import React from 'react';
import './OrderDocumentPopup.css';

interface OrderDocumentPopupProps {
  isOpen: boolean;
  order: any | null;
  onClose: () => void;
}

const OrderDocumentPopup: React.FC<OrderDocumentPopupProps> = ({ isOpen, order, onClose }) => {
  if (!isOpen || !order) return null;

  // 디버깅용 로그
  console.log('🔍 [OrderDocumentPopup] order 전체 데이터:', order);
  console.log('🔍 [OrderDocumentPopup] order.products:', order.products);

  const formatDate = (dateString: string): string => {
    if (!dateString) return '';
    
    let date: Date;
    
    // YYYYMMDD 형식 처리
    if (dateString.length === 8 && /^\d{8}$/.test(dateString)) {
      const year = dateString.substring(0, 4);
      const month = dateString.substring(4, 6);
      const day = dateString.substring(6, 8);
      date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
    } else {
      // 일반 날짜 형식 처리
      date = new Date(dateString);
    }
    
    if (isNaN(date.getTime())) return '';
    
    // 요일 배열
    const weekdays = ['일', '월', '화', '수', '목', '금', '토'];
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const weekday = weekdays[date.getDay()];
    
    return `${year}-${month}-${day}(${weekday})`;
  };

  const formatCurrency = (amount: number): string => {
    if (amount === null || amount === undefined) return '0';
    return amount.toLocaleString('ko-KR');
  };

  const formatNumber = (num: number): string => {
    if (num === null || num === undefined) return '0';
    return num.toLocaleString('ko-KR');
  };

  // 이메일 마스킹 함수 (일부만 표시)
  const maskEmail = (email: string): string => {
    if (!email) return '이메일 정보 없음';
    
    const parts = email.split('@');
    if (parts.length !== 2) return '***';
    
    const [localPart, domain] = parts;
    
    // 로컬 부분: 첫 글자만 표시하고 나머지는 *로 표시
    const maskedLocal = localPart.length > 0 
      ? localPart[0] + '*'.repeat(Math.max(1, localPart.length - 1))
      : '***';
    
    return `${maskedLocal}@${domain}`;
  };

  const handlePrint = () => {
    // 팝업 내용만 인쇄하기 위한 새 창 생성
    const printWindow = window.open('', '_blank', 'width=800,height=600');
    
    if (printWindow) {
      // 팝업 내용을 새 창에 복사
      const popupContent = document.querySelector('.odp-popup');
      
      if (popupContent) {
        // 발주번호와 벤더명 추출
        const orderNo = order.SLIP_NO || '';
        const vendorName = order.VENDOR_NM || '';
        // 인쇄용 HTML 생성 (페이지별 헤더 반복)
        const printHTML = `
          <!DOCTYPE html>
          <html>
            <head>
              <title>발주서</title>
              <meta charset="UTF-8">
              <style>
                body {
                  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                  margin: 0;
                  padding: 20px;
                  font-size: 12px;
                  line-height: 1.4;
                }
                
                /* URL 숨기기 - 모든 링크 */
                a {
                  text-decoration: none !important;
                }
                
                a:after {
                  content: none !important;
                }
                
                .odp-header {
                  background: #f8f9fa;
                  color: #000;
                  padding: 12px 16px;
                  display: flex;
                  align-items: center;
                  justify-content: space-between;
                  border-bottom: 2px solid #dee2e6;
                }
                
                .odp-title {
                  display: flex;
                  align-items: center;
                  gap: 8px;
                }
                
                .odp-title h2 {
                  margin: 0;
                  font-size: 18px;
                  font-weight: 600;
                }
                
                .odp-content {
                  padding: 16px 0;
                }
                
                .odp-order-header {
                  background: #f8f9fa;
                  border-radius: 6px;
                  padding: 12px;
                  margin-bottom: 16px;
                  display: flex;
                  justify-content: space-between;
                  align-items: flex-start;
                }
                
                .odp-order-main {
                  display: flex;
                  align-items: center;
                  gap: 8px;
                }
                
                .odp-order-main .odp-label {
                  font-weight: 600;
                  color: #495057;
                  font-size: 12px;
                }
                
                .odp-order-main .odp-value {
                  font-size: 16px;
                  font-weight: 700;
                  color: #2563eb;
                }
                
                .odp-separator {
                  color: #6c757d;
                  font-weight: 300;
                  margin: 0 4px;
                }
                
                .odp-status {
                  padding: 8px 16px;
                  border-radius: 20px;
                  font-weight: 600;
                  font-size: 14px;
                  text-transform: uppercase;
                  letter-spacing: 0.5px;
                }
                
                .odp-status.completed {
                  background: #d4edda;
                  color: #155724;
                  border: 1px solid #c3e6cb;
                }
                
                .odp-company-info {
                  display: grid;
                  grid-template-columns: 1fr 1fr;
                  gap: 16px;
                  margin-bottom: 16px;
                }
                
                .odp-vendor-info,
                .odp-store-info {
                  background: white;
                  border: 1px solid #e9ecef;
                  border-radius: 6px;
                  padding: 12px;
                }
                
                .odp-vendor-info h3,
                .odp-store-info h3 {
                  margin: 0 0 10px 0;
                  font-size: 13px;
                  font-weight: 600;
                  color: #495057;
                  border-bottom: 1px solid #e9ecef;
                  padding-bottom: 6px;
                }
                
                .odp-vendor-info h3 {
                  color: #2563eb;
                }
                
                .odp-store-info h3 {
                  color: #059669;
                }
                
                .odp-info-grid {
                  display: flex;
                  flex-direction: column;
                  gap: 6px;
                }
                
                .odp-info-item {
                  display: flex;
                  align-items: center;
                }
                
                .odp-info-item .odp-label {
                  font-weight: 500;
                  color: #6c757d;
                  margin-right: 8px;
                  min-width: 60px;
                  font-size: 10px;
                }
                
                .odp-info-item .odp-value {
                  font-weight: 600;
                  color: #212529;
                  font-size: 11px;
                }
                
                .odp-summary {
                  background: #f8f9fa;
                  border-radius: 6px;
                  padding: 12px;
                  margin-bottom: 16px;
                }
                
                .odp-summary h3 {
                  margin: 0 0 10px 0;
                  font-size: 13px;
                  font-weight: 600;
                  color: #495057;
                  border-bottom: 1px solid #e9ecef;
                  padding-bottom: 6px;
                }
                
                .odp-summary-grid {
                  display: grid;
                  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
                  gap: 8px;
                }
                
                .odp-summary-item {
                  display: flex;
                  align-items: center;
                  justify-content: space-between;
                  padding: 8px;
                  background: white;
                  border-radius: 4px;
                  border: 1px solid #e9ecef;
                }
                
                .odp-summary-item .odp-label {
                  font-weight: 500;
                  color: #6c757d;
                  font-size: 10px;
                }
                
                .odp-summary-item .odp-value {
                  font-weight: 700;
                  color: #212529;
                  font-size: 12px;
                }
                
                .odp-product-list {
                  background: #f8f9fa;
                  border-radius: 6px;
                  padding: 12px;
                  margin-bottom: 16px;
                }
                
                .odp-product-list h3 {
                  margin: 0 0 12px 0;
                  font-size: 14px;
                  font-weight: 600;
                  color: #495057;
                  border-bottom: 1px solid #e9ecef;
                  padding-bottom: 6px;
                }
                
                .odp-product-table table {
                  width: 100%;
                  border-collapse: collapse;
                  font-size: 11px;
                  background: white;
                  border-radius: 4px;
                  overflow: hidden;
                }
                
                .odp-product-table th {
                  background: #e9ecef;
                  color: #495057;
                  font-weight: 600;
                  padding: 6px 8px;
                  text-align: left;
                  border: 1px solid #dee2e6;
                  font-size: 10px;
                }
                
                .odp-product-table td {
                  padding: 4px 8px;
                  border: 1px solid #dee2e6;
                  font-size: 11px;
                }
                
                .odp-product-table .text-right {
                  text-align: right;
                }
                
                .odp-product-table .negative {
                  color: #dc3545;
                  font-weight: 600;
                }
                
                .odp-product-table tbody tr:nth-child(even) {
                  background: #f8f9fa;
                }
                
                .odp-product-table .negative {
                  color: #dc3545;
                  font-weight: 600;
                }
                
                .odp-total-row {
                  background: #e9ecef !important;
                  font-weight: 700;
                }
                
                .odp-total-row td {
                  border-top: 2px solid #495057;
                  font-size: 12px;
                }
                
                .odp-email-info {
                  background: #f8f9fa;
                  border-radius: 6px;
                  padding: 12px;
                  margin-bottom: 16px;
                }
                
                .odp-email-info h3 {
                  margin: 0 0 10px 0;
                  font-size: 13px;
                  font-weight: 600;
                  color: #495057;
                  border-bottom: 1px solid #e9ecef;
                  padding-bottom: 6px;
                }
                
                .odp-email-grid {
                  display: grid;
                  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
                  gap: 8px;
                }
                
                .odp-email-item {
                  display: flex;
                  align-items: center;
                  justify-content: space-between;
                  padding: 8px;
                  background: white;
                  border-radius: 4px;
                  border: 1px solid #e9ecef;
                }
                
                .odp-email-item .odp-label {
                  font-weight: 500;
                  color: #6c757d;
                  font-size: 10px;
                }
                
                .odp-email-item .odp-value {
                  font-weight: 600;
                  font-size: 11px;
                }
                
                .odp-email-item .odp-value.sent {
                  color: #28a745;
                }
                
                .odp-email-item .odp-value.not-sent {
                  color: #dc3545;
                }
                
                .odp-email-item .odp-value.error {
                  color: #dc3545;
                }
                
                .odp-remarks {
                  background: #f8f9fa;
                  border-radius: 6px;
                  padding: 12px;
                  margin-bottom: 16px;
                }
                
                .odp-remarks h3 {
                  margin: 0 0 10px 0;
                  font-size: 13px;
                  font-weight: 600;
                  color: #495057;
                  border-bottom: 1px solid #e9ecef;
                  padding-bottom: 6px;
                }
                
                .odp-remarks-content {
                  background: white;
                  border: 1px solid #e9ecef;
                  border-radius: 4px;
                  padding: 10px;
                  font-style: italic;
                  color: #6c757d;
                  line-height: 1.4;
                  font-size: 11px;
                }
                
                /* 확인란 스타일 */
                .odp-signature-section {
                  background: #f8f9fa;
                  border-radius: 4px;
                  padding: 8px;
                  margin-bottom: 12px;
                  margin-top: 15px;
                }
                
                .odp-signature-section h3 {
                  margin: 0 0 8px 0;
                  font-size: 12px;
                  font-weight: 600;
                  color: #495057;
                  border-bottom: 1px solid #e9ecef;
                  padding-bottom: 4px;
                }
                
                .odp-signature-grid {
                  display: grid;
                  grid-template-columns: 1fr 1fr;
                  gap: 15px;
                  margin-bottom: 10px;
                }
                
                .odp-signature-item {
                  display: flex;
                  flex-direction: column;
                  align-items: center;
                  gap: 4px;
                }
                
                .odp-signature-label {
                  font-size: 10px;
                  font-weight: 600;
                  color: #495057;
                }
                
                .odp-signature-line {
                  width: 80px;
                  height: 1px;
                  border-bottom: 1px solid #000;
                  margin: 3px 0;
                }
                
                .odp-signature-name {
                  font-size: 9px;
                  color: #6c757d;
                  font-style: italic;
                }
                
                .odp-signature-date {
                  display: flex;
                  align-items: center;
                  justify-content: center;
                  gap: 8px;
                  margin-top: 8px;
                }
                
                .odp-signature-date .odp-signature-label {
                  font-size: 10px;
                  font-weight: 600;
                  color: #495057;
                }
                
                .odp-signature-date .odp-signature-line {
                  width: 80px;
                  height: 1px;
                  border-bottom: 1px solid #000;
                }
                
                @media print {
                  body {
                    margin: 0;
                    padding: 0;
                    -webkit-print-color-adjust: exact;
                    print-color-adjust: exact;
                  }
                  
                  .odp-order-header,
                  .odp-company-info,
                  .odp-summary,
                  .odp-product-list,
                  .odp-email-info,
                  .odp-remarks {
                    break-inside: avoid;
                    page-break-inside: avoid;
                    border: 1px solid #000 !important;
                    margin-bottom: 10px !important;
                  }
                  
                  .odp-order-header {
                    background: #f0f0f0 !important;
                    border: 2px solid #000 !important;
                  }
                  
                  .odp-vendor-info,
                  .odp-store-info {
                    border: 1px solid #000 !important;
                    margin-bottom: 5px !important;
                  }
                  
                  .odp-vendor-info h3,
                  .odp-store-info h3 {
                    border-bottom: 1px solid #000 !important;
                    background: #e0e0e0 !important;
                    margin: 0 !important;
                    padding: 5px !important;
                  }
                  
                  .odp-info-item {
                    border-bottom: 1px dotted #666 !important;
                    padding: 2px 0 !important;
                  }
                  
                  .odp-summary-item {
                    border: 1px solid #000 !important;
                    margin-bottom: 3px !important;
                  }
                  
                  .odp-product-table {
                    overflow: visible;
                    border: 2px solid #000 !important;
                  }
                  
                  .odp-product-table table {
                    font-size: 10px;
                    border-collapse: collapse !important;
                    width: 100% !important;
                  }
                  
                  .odp-product-table th {
                    border: 1px solid #000 !important;
                    background: #e0e0e0 !important;
                    padding: 4px 6px !important;
                    font-weight: bold !important;
                  }
                  
                  .odp-product-table td {
                    border: 1px solid #000 !important;
                    padding: 4px 6px !important;
                  }
                  
                  .odp-total-row {
                    border-top: 2px solid #000 !important;
                    background: #f0f0f0 !important;
                  }
                  
                  .odp-email-item {
                    border: 1px solid #000 !important;
                    margin-bottom: 3px !important;
                  }
                  
                  .odp-remarks-content {
                    border: 1px solid #000 !important;
                  }
                  
                  /* 확인란 스타일 */
                  .odp-signature-section {
                    border: 1px solid #000 !important;
                    margin-top: 15px !important;
                    page-break-inside: avoid !important;
                  }
                  
                  .odp-signature-section h3 {
                    border-bottom: 1px solid #000 !important;
                    background: #e0e0e0 !important;
                    margin: 0 !important;
                    padding: 3px !important;
                    font-size: 11px !important;
                  }
                  
                  .odp-signature-grid {
                    display: grid !important;
                    grid-template-columns: 1fr 1fr !important;
                    gap: 15px !important;
                    margin-bottom: 10px !important;
                  }
                  
                  .odp-signature-item {
                    display: flex !important;
                    flex-direction: column !important;
                    align-items: center !important;
                    gap: 4px !important;
                  }
                  
                  .odp-signature-label {
                    font-size: 9px !important;
                    font-weight: bold !important;
                  }
                  
                  .odp-signature-line {
                    width: 80px !important;
                    height: 1px !important;
                    border-bottom: 1px solid #000 !important;
                    margin: 3px 0 !important;
                  }
                  
                  .odp-signature-name {
                    font-size: 8px !important;
                    font-style: italic !important;
                  }
                  
                  .odp-signature-date {
                    display: flex !important;
                    align-items: center !important;
                    justify-content: center !important;
                    gap: 8px !important;
                    margin-top: 8px !important;
                  }
                  
                  .odp-signature-date .odp-signature-line {
                    width: 80px !important;
                    height: 1px !important;
                    border-bottom: 1px solid #000 !important;
                  }
                  
                  /* URL 숨기기 */
                  a[href]:after {
                    content: none !important;
                  }
                  
                  /* 발주서 헤더 정보가 각 페이지마다 반복되도록 설정 */
                  .odp-order-header {
                    page-break-after: avoid !important;
                  }
                  
                  .odp-company-info {
                    page-break-after: avoid !important;
                  }
                  
                  .odp-summary {
                    page-break-after: avoid !important;
                  }
                  
                  /* 상품 리스트 제목과 테이블 헤더를 함께 유지 */
                  .odp-product-list h3 {
                    page-break-after: avoid !important;
                  }
                  
                  /* 테이블 헤더가 각 페이지마다 반복되도록 설정 */
                  .odp-product-table thead {
                    display: table-header-group !important;
                  }
                  
                  .odp-product-table tbody {
                    display: table-row-group !important;
                  }
                  
                  /* 페이지 나누기 시 행이 분리되지 않도록 */
                  .odp-product-table tbody tr {
                    page-break-inside: avoid !important;
                  }
                  
                  /* 첫 번째 행이 페이지 하단에 혼자 남지 않도록 */
                  .odp-product-table tbody tr:first-child {
                    page-break-before: avoid !important;
                  }
                  
                  /* 확인란은 마지막 페이지에만 표시 */
                  .odp-signature-section {
                    page-break-before: avoid !important;
                  }
                  
                  /* 합계 행은 마지막 페이지에만 표시 */
                  .odp-total-row {
                    page-break-before: avoid !important;
                    page-break-after: avoid !important;
                    page-break-inside: avoid !important;
                    orphans: 3 !important;
                    widows: 3 !important;
                  }
                  
                  /* 테이블의 마지막 행이 페이지를 넘어가지 않도록 */
                  .odp-product-table tbody tr:last-child {
                    page-break-after: avoid !important;
                  }
                  
                  /* 합계 행 앞의 행들도 페이지를 넘어가지 않도록 */
                  .odp-product-table tbody tr:nth-last-child(2) {
                    page-break-after: avoid !important;
                  }
                  
                  /* 페이지 나누기 시 헤더 정보가 함께 이동하도록 설정 */
                  .odp-order-header,
                  .odp-company-info,
                  .odp-summary {
                    page-break-inside: avoid !important;
                  }
                  
                  /* 모든 페이지에 발주 헤더 반복 표시 */
                  .odp-order-header {
                    page-break-after: avoid !important;
                    page-break-inside: avoid !important;
                  }
                  
                  /* 페이지 헤더 반복 설정 */
                  @page {
                    margin-top: 40px;
                    @top-right {
                      content: "발주번호: ${orderNo} | 벤더: ${vendorName}";
                      font-size: 10px;
                      font-weight: bold;
                      color: #666;
                    }
                  }
                  
                  /* 상품 테이블이 페이지를 넘어갈 때 적절한 위치에서 나누기 */
                  .odp-product-table {
                    page-break-inside: auto !important;
                  }
                  
                  /* 상품 리스트 섹션 전체가 페이지를 넘어갈 때 */
                  .odp-product-list {
                    page-break-inside: auto !important;
                  }
                  
                  
                  /* 브라우저 기본 URL 숨기기 */
                  @page {
                    margin: 0.5in;
                  }
                  
                  /* about:blank 숨기기 */
                  body:before {
                    content: none !important;
                  }
                }
              </style>
            </head>
            <body>
              ${popupContent.innerHTML}
            </body>
          </html>
        `;
        
        printWindow.document.write(printHTML);
        printWindow.document.close();
        
        // URL을 발주서로 변경 (about:blank 숨기기)
        try {
          printWindow.history.replaceState(null, '발주서', 'data:text/html,발주서');
        } catch (e) {
          // URL 변경이 실패해도 계속 진행
          console.log('URL 변경 실패:', e);
        }
        
        // 인쇄 대화상자 열기
        printWindow.focus();
        printWindow.print();
        
        // 인쇄 후 창 닫기
        printWindow.onafterprint = () => {
          printWindow.close();
        };
      }
    }
  };

  // 벤더 정보 디버깅 로그
  console.log('🔍 [OrderDocumentPopup] order 데이터:', order);
  console.log('🔍 [OrderDocumentPopup] 벤더 정보:');
  console.log('  - VENDOR_NM:', order.VENDOR_NM);
  console.log('  - VENDOR_EMAIL:', order.VENDOR_EMAIL);
  console.log('  - VENDOR_TEL:', order.VENDOR_TEL);
  console.log('  - AGENT_EMAIL:', order.AGENT_EMAIL);
  console.log('  - AGENT_TEL:', order.AGENT_TEL);
  console.log('  - 모든 키:', Object.keys(order));

  return (
    <div className="odp-overlay" onClick={onClose}>
      <div className="odp-popup" onClick={(e) => e.stopPropagation()}>
        {/* 헤더 */}
        <div className="odp-header">
          <div className="odp-title">
            <i className="fas fa-file-alt"></i>
            <h2>발주서</h2>
          </div>
          <button className="odp-close-btn" onClick={onClose}>
            <i className="fas fa-times"></i>
          </button>
        </div>

        {/* 발주서 내용 */}
        <div className="odp-content">
          {/* 발주 정보 헤더 */}
          <div className="odp-order-header">
            <div className="odp-order-info">
              <div className="odp-order-main">
                <span className="odp-label">발주번호:</span>
                <span className="odp-value">{order.SLIP_NO}</span>
                <span className="odp-separator">|</span>
                <span className="odp-label">발주일자:</span>
                <span className="odp-value">{formatDate(order.ORDER_D)}</span>
              </div>
            </div>
            <div className="odp-status-badge">
              <span className={`odp-status ${order.ORDER_STATUS === '완료' ? 'completed' : order.ORDER_STATUS === '진행중' ? 'in-progress' : 'pending'}`}>
                {order.ORDER_STATUS}
              </span>
            </div>
          </div>

          {/* 벤더 및 매장 정보 */}
          <div className="odp-company-info">
            <div className="odp-vendor-info">
              <h3>벤더 정보</h3>
              <div className="odp-info-grid">
                <div className="odp-info-item">
                  <span className="odp-label">벤더명:</span>
                  <span className="odp-value">{order.VENDOR_NM}</span>
                </div>
                <div className="odp-info-item">
                  <span className="odp-label">이메일:</span>
                  <span className="odp-value">{maskEmail(order.VENDOR_EMAIL || order.AGENT_EMAIL)}</span>
                </div>
                <div className="odp-info-item">
                  <span className="odp-label">전화번호:</span>
                  <span className="odp-value">{order.VENDOR_TEL || order.AGENT_TEL || '전화번호 정보 없음'}</span>
                </div>
              </div>
            </div>

            <div className="odp-store-info">
              <h3>매장 정보</h3>
              <div className="odp-info-grid">
                <div className="odp-info-item">
                  <span className="odp-label">매장명:</span>
                  <span className="odp-value">{order.STORE_NM}</span>
                </div>
                <div className="odp-info-item">
                  <span className="odp-label">주소:</span>
                  <span className="odp-value">{order.STORE_ADDR || '-'}</span>
                </div>
                <div className="odp-info-item">
                  <span className="odp-label">전화번호:</span>
                  <span className="odp-value">{order.STORE_TEL || '-'}</span>
                </div>
                <div className="odp-info-item">
                  <span className="odp-label">담당자:</span>
                  <span className="odp-value">{order.RECV_PERSON || '-'}</span>
                </div>
              </div>
            </div>
          </div>

          {/* 발주 요약 정보 */}
          <div className="odp-summary">
            <h3>발주 요약</h3>
            <div className="odp-summary-grid">
              <div className="odp-summary-item">
                <span className="odp-label">입고요구일:</span>
                <span className="odp-value">{formatDate(order.REQUIRE_D)}</span>
              </div>
              <div className="odp-summary-item">
                <span className="odp-label">총 수량:</span>
                <span className="odp-value">{formatNumber(order.TOTAL_QTY || 0)}개</span>
              </div>
              <div className="odp-summary-item">
                <span className="odp-label">총 금액:</span>
                <span className="odp-value">{formatCurrency(order.SOBIJA_TOT || 0)}원</span>
              </div>
              <div className="odp-summary-item">
                <span className="odp-label">상품 수:</span>
                <span className="odp-value">{order.ORDER_COUNT || 0}종</span>
              </div>
            </div>
          </div>

          {/* 이메일 전송 정보 */}
          {order.EMAIL_SEND_YN && (
            <div className="odp-email-info">
              <h3>이메일 전송 정보</h3>
              <div className="odp-email-grid">
                <div className="odp-email-item">
                  <span className="odp-label">전송 상태:</span>
                  <span className={`odp-value ${order.EMAIL_SEND_YN === 'Y' ? 'sent' : 'not-sent'}`}>
                    {order.EMAIL_SEND_YN === 'Y' ? '전송완료' : '미전송'}
                  </span>
                </div>
                {order.EMAIL_SEND_DT && (
                  <div className="odp-email-item">
                    <span className="odp-label">전송일시:</span>
                    <span className="odp-value">{order.EMAIL_SEND_DT}</span>
                  </div>
                )}
                {order.EMAIL_SEND_CNT && (
                  <div className="odp-email-item">
                    <span className="odp-label">전송횟수:</span>
                    <span className="odp-value">{order.EMAIL_SEND_CNT}회</span>
                  </div>
                )}
                {order.EMAIL_FAIL_CNT && order.EMAIL_FAIL_CNT > 0 && (
                  <div className="odp-email-item">
                    <span className="odp-label">실패횟수:</span>
                    <span className="odp-value error">{order.EMAIL_FAIL_CNT}회</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* 상품 리스트 */}
          {(() => {
            console.log('🔍 [OrderDocumentPopup] order.products 확인:', order.products);
            console.log('🔍 [OrderDocumentPopup] order.products 길이:', order.products?.length);
            return order.products && order.products.length > 0;
          })() && (
            <div className="odp-product-list">
              <h3>상품 리스트</h3>
              <div className="odp-product-table">
                <table>
                  <thead>
                    <tr>
                      <th>상품코드</th>
                      <th>상품명</th>
                      <th>브랜드</th>
                      <th>수량</th>
                      <th>단가</th>
                      <th>금액</th>
                    </tr>
                  </thead>
                  <tbody>
                    {order.products.map((product: any, index: number) => {
                      // 디버깅용 로그
                      console.log('🔍 [OrderDocumentPopup] 상품 데이터:', product);
                      console.log('🔍 [OrderDocumentPopup] GOODS_ID_BRAND:', product.GOODS_ID_BRAND);
                      console.log('🔍 [OrderDocumentPopup] GOODS_ID:', product.GOODS_ID);
                      console.log('🔍 [OrderDocumentPopup] BRAND_ID:', product.BRAND_ID);
                      return (
                        <tr key={index}>
                          <td>{product.GOODS_ID_BRAND || 'N/A'}</td>
                          <td>{product.GOODS_NM || 'N/A'}</td>
                          <td>{product.BRAND_NAME || 'N/A'}</td>
                          <td className={`text-right ${product.ORDER_QTY < 0 ? 'negative' : ''}`}>
                            {formatNumber(product.ORDER_QTY || 0)}
                          </td>
                          <td className={`text-right ${product.SOBIJA_DAN < 0 ? 'negative' : ''}`}>
                            {formatCurrency(product.SOBIJA_DAN || 0)}
                          </td>
                          <td className={`text-right ${product.SOBIJA_TOT < 0 ? 'negative' : ''}`}>
                            {formatCurrency(product.SOBIJA_TOT || 0)}
                          </td>
                        </tr>
                      );
                    })}
                    {/* 합계 행을 tbody 안에 추가 */}
                    <tr className="odp-total-row">
                      <td colSpan={3}><strong>합계</strong></td>
                      <td className="text-right"><strong>{formatNumber(order.TOTAL_QTY || 0)}</strong></td>
                      <td></td>
                      <td className="text-right"><strong>{formatCurrency(order.SOBIJA_TOT || 0)}</strong></td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* 상품 데이터가 없는 경우 */}
          {(!order.products || order.products.length === 0) && (
            <div className="odp-product-list">
              <h3>상품 리스트</h3>
              <div className="odp-no-products">
                <p>상품 정보를 불러오는 중입니다...</p>
                <p>상품 데이터: {JSON.stringify(order.products)}</p>
              </div>
            </div>
          )}

          {/* 비고 */}
          {order.REMARKS && (
            <div className="odp-remarks">
              <h3>비고</h3>
              <div className="odp-remarks-content">
                {order.REMARKS}
              </div>
            </div>
          )}

          {/* 확인란 - 마지막 페이지에만 표시 */}
          <div className="odp-signature-section">
            <h3>확인</h3>
            <div className="odp-signature-grid">
              <div className="odp-signature-item">
                <div className="odp-signature-label">발주자</div>
                <div className="odp-signature-line"></div>
                <div className="odp-signature-name">(인)</div>
              </div>
              <div className="odp-signature-item">
                <div className="odp-signature-label">납품업체</div>
                <div className="odp-signature-line"></div>
                <div className="odp-signature-name">(인)</div>
              </div>
            </div>
            <div className="odp-signature-date">
              <div className="odp-signature-label">날짜</div>
              <div className="odp-signature-line"></div>
            </div>
          </div>
        </div>

        {/* 푸터 */}
        <div className="odp-footer">
          <button className="odp-btn odp-btn-secondary" onClick={onClose}>
            닫기
          </button>
          <button className="odp-btn odp-btn-primary" onClick={handlePrint}>
            <i className="fas fa-print"></i>
            인쇄
          </button>
        </div>
      </div>
    </div>
  );
};

export default OrderDocumentPopup;
