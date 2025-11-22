/**
 * 독립적인 페이지네이션 컴포넌트
 * 새로고침이나 서버 상태에 영향받지 않는 로컬 상태를 가집니다.
 */

import React, { useState, useEffect, useCallback } from 'react';
import './Pagination.css';

interface PaginationProps {
  totalCount: number;
  currentPage: number;
  pageSize: number;
  onPageChange: (page: number, pageSize: number) => void;
  pageSizeOptions?: number[];
  showPageSizeSelector?: boolean;
  showPageInfo?: boolean;
  className?: string;
}

const Pagination: React.FC<PaginationProps> = ({
  totalCount,
  currentPage,
  pageSize,
  onPageChange,
  pageSizeOptions = [10, 20, 50, 100],
  showPageSizeSelector = true,
  showPageInfo = true,
  className = ''
}) => {
  // 로컬 상태로 페이지네이션 관리
  const [localCurrentPage, setLocalCurrentPage] = useState(currentPage);
  const [localPageSize, setLocalPageSize] = useState(pageSize);
  
  // 총 페이지 수 계산
  const totalPages = Math.ceil(totalCount / localPageSize);
  
  // props 변경 시 로컬 상태 동기화
  useEffect(() => {
    setLocalCurrentPage(currentPage);
  }, [currentPage]);
  
  useEffect(() => {
    setLocalPageSize(pageSize);
  }, [pageSize]);

  // 페이지 변경 핸들러
  const handlePageChange = useCallback((newPage: number) => {
    if (newPage < 1 || newPage > totalPages || newPage === localCurrentPage) {
      return;
    }
    
    setLocalCurrentPage(newPage);
    onPageChange(newPage, localPageSize);
  }, [localCurrentPage, localPageSize, totalPages, onPageChange]);

  // 페이지 크기 변경 핸들러
  const handlePageSizeChange = useCallback((newPageSize: number) => {
    if (newPageSize === localPageSize) {
      return;
    }
    
    setLocalPageSize(newPageSize);
    // 페이지 크기 변경 시 첫 페이지로 이동
    setLocalCurrentPage(1);
    onPageChange(1, newPageSize);
  }, [localPageSize, onPageChange]);

  // 페이지 번호 배열 생성 (현재 페이지 주변 5개씩)
  const getPageNumbers = () => {
    const pages = [];
    const startPage = Math.max(1, localCurrentPage - 2);
    const endPage = Math.min(totalPages, localCurrentPage + 2);
    
    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }
    
    return pages;
  };

  // 이전 페이지로 이동
  const goToPreviousPage = () => {
    handlePageChange(localCurrentPage - 1);
  };

  // 다음 페이지로 이동
  const goToNextPage = () => {
    handlePageChange(localCurrentPage + 1);
  };

  // 첫 페이지로 이동
  const goToFirstPage = () => {
    handlePageChange(1);
  };

  // 마지막 페이지로 이동
  const goToLastPage = () => {
    handlePageChange(totalPages);
  };

  // 페이지 정보 텍스트
  const getPageInfo = () => {
    if (totalCount === 0) return '0개 표시';
    
    const startItem = (localCurrentPage - 1) * localPageSize + 1;
    const endItem = Math.min(localCurrentPage * localPageSize, totalCount);
    
    return `${totalCount.toLocaleString()}개 중 ${startItem.toLocaleString()}-${endItem.toLocaleString()}개 표시`;
  };

  if (totalPages <= 1) {
    return (
      <div className={`pagination-comp-container ${className}`}>
        {/* 왼쪽 영역: 페이지 크기 선택 (항상 표시) */}
        {showPageSizeSelector && (
          <div className="pagination-comp-left">
            <div className="pagination-comp-page-size-selector">
              <label htmlFor="pageSize" title="한 페이지에 표시할 항목 수">
                페이지 크기:
              </label>
              <select
                id="pageSize"
                value={localPageSize}
                onChange={(e) => handlePageSizeChange(Number(e.target.value))}
                className="pagination-comp-page-size-select"
                title="한 페이지에 표시할 항목 수를 선택하세요"
              >
                {pageSizeOptions.map(size => (
                  <option key={size} value={size} title={`한 페이지에 ${size}개 항목 표시`}>
                    {size}개
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}

        {/* 중앙 영역: 빈 공간 */}
        <div className="pagination-comp-center">
          {/* 페이지가 1개 이하일 때는 버튼 표시하지 않음 */}
        </div>

        {/* 오른쪽 영역: 페이지 정보 */}
        {showPageInfo && (
          <div className="pagination-comp-right">
            <div className="pagination-comp-page-info">
              <span>{getPageInfo()}</span>
            </div>
          </div>
        )}
      </div>
    );
  }

  const pageNumbers = getPageNumbers();

  return (
    <div className={`pagination-comp-container ${className}`}>
      {/* 왼쪽 영역: 페이지 크기 선택 */}
      {showPageSizeSelector && (
        <div className="pagination-comp-left">
          <div className="pagination-comp-page-size-selector">
            <label htmlFor="pageSize" title="한 페이지에 표시할 항목 수">
              페이지 크기:
            </label>
            <select
              id="pageSize"
              value={localPageSize}
              onChange={(e) => handlePageSizeChange(Number(e.target.value))}
              className="pagination-comp-page-size-select"
              title="한 페이지에 표시할 항목 수를 선택하세요"
            >
              {pageSizeOptions.map(size => (
                <option key={size} value={size} title={`한 페이지에 ${size}개 항목 표시`}>
                  {size}개
                </option>
              ))}
            </select>
          </div>
        </div>
      )}

      {/* 중앙 영역: 페이지네이션 버튼들 */}
      <div className="pagination-comp-center">
        <div className="pagination-comp-buttons">
          {/* 첫 페이지 버튼 */}
          <button
            className="pagination-comp-btn first-page"
            onClick={goToFirstPage}
            disabled={localCurrentPage === 1}
            title="첫 페이지로 이동"
          >
            <i className="fas fa-angle-double-left"></i>
          </button>

          {/* 이전 페이지 버튼 */}
          <button
            className="pagination-comp-btn prev-page"
            onClick={goToPreviousPage}
            disabled={localCurrentPage === 1}
            title="이전 페이지로 이동"
          >
            <i className="fas fa-angle-left"></i>
          </button>

          {/* 페이지 번호 버튼들 */}
          {pageNumbers.map(pageNum => (
            <button
              key={pageNum}
              className={`pagination-comp-btn page-number ${pageNum === localCurrentPage ? 'active' : ''}`}
              onClick={() => handlePageChange(pageNum)}
              title={`${pageNum}페이지로 이동`}
            >
              {pageNum}
            </button>
          ))}

          {/* 다음 페이지 버튼 */}
          <button
            className="pagination-comp-btn next-page"
            onClick={goToNextPage}
            disabled={localCurrentPage === totalPages}
            title="다음 페이지로 이동"
          >
            <i className="fas fa-angle-right"></i>
          </button>

          {/* 마지막 페이지 버튼 */}
          <button
            className="pagination-comp-btn last-page"
            onClick={goToLastPage}
            disabled={localCurrentPage === totalPages}
            title="마지막 페이지로 이동"
          >
            <i className="fas fa-angle-double-right"></i>
          </button>
        </div>
      </div>

      {/* 오른쪽 영역: 페이지 정보 */}
      {showPageInfo && (
        <div className="pagination-comp-right">
          <div className="pagination-comp-page-info">
            <span>{getPageInfo()}</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default Pagination;
