import React, { useState, useEffect } from 'react';
import { X, Mail, Package, Phone, AlertCircle, ChevronDown, ChevronRight, ChevronUp, Download } from 'lucide-react';
import { useSelector } from 'react-redux';
import { RootState } from '../../store';
import * as XLSX from 'xlsx-js-style';
import { saveAs } from 'file-saver';
import EmailPasswordModal from './EmailPasswordModal';
import './OrderSendModal.css';

// 벤더별 주문 정보 타입
interface VendorOrderInfo {
  ORDER_D: string;
  ORDER_SEQU: number;
  SLIP_NO: string;
  REQUIRE_D: string;
  RECV_ADDR: string;
  RECV_TEL: string;
  RECV_PERSON: string;
  RECV_MEMO: string;
  VENDOR_ID: string;
  VENDOR_EMAIL: string;
  VENDOR_NAME: string;
  VENDOR_TEL: string;
  VENDOR_ADDR: string;
  BRAND_ID: string;
  BRAND_NAME: string;
  GOODS_ID: string;
  GOODS_ID_BRAND: string;
  GOODS_NM: string;
  IO_ID: string;
  IO_NM: string;
  ORDER_QTY: number;
  SOBIJA_DAN: number;
  SOBIJA_AMT: number;
  SOBIJA_VAT: number;
  SOBIJA_TOT: number;
  ORDER_DAN: number;
  ORDER_AMT: number;
  ORDER_VAT: number;
  ORDER_TOT: number;
  ORDER_MEMO: string;
  CLAIM_ID: string;
  VENDOR_ITEM_COUNT: number;
  VENDOR_TOTAL_QTY: number;
  VENDOR_TOTAL_AMT: number;
  ORDER_STATUS: string;
  USER_ID: string;
  SYS_TIME: string;
  UPD_USER: string;
  UPD_TIME: string;
  AGENT_NAME: string;  // 매장명
  AGENT_ADDR: string;  // 매장주소
  AGENT_TEL: string;   // 매장전화번호
}

interface OrderSendModalProps {
  isOpen: boolean;
  onClose: () => void;
  orderData: {
    orderDate: string;
    orderSequ: number;
    orderNumber: string;
  };
}

const OrderSendModal: React.FC<OrderSendModalProps> = ({ isOpen, onClose, orderData }) => {
  const [vendorOrders, setVendorOrders] = useState<VendorOrderInfo[]>([]);
  
  // Redux store에서 사용자 정보 가져오기
  const user = useSelector((state: RootState) => state.auth.user);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedVendors, setSelectedVendors] = useState<Set<string>>(new Set());
  const [expandedVendors, setExpandedVendors] = useState<Set<string>>(new Set());
  const [allExpanded, setAllExpanded] = useState(true);
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [modalPosition, setModalPosition] = useState({ x: 0, y: 0 });
  
  // 이메일 전송 관련 상태
  const [showEmailPasswordModal, setShowEmailPasswordModal] = useState(false);
  const [emailSending, setEmailSending] = useState(false);

  // 벤더별로 그룹화된 데이터
  const groupedVendors = vendorOrders.reduce((acc, order) => {
    const vendorId = order.VENDOR_ID;
    if (!acc[vendorId]) {
      acc[vendorId] = {
        vendorInfo: {
          VENDOR_ID: order.VENDOR_ID,
          VENDOR_NAME: order.VENDOR_NAME,
          VENDOR_EMAIL: order.VENDOR_EMAIL,
          VENDOR_TEL: order.VENDOR_TEL,
          VENDOR_ADDR: order.VENDOR_ADDR,
        },
        orders: [],
        totalQty: order.VENDOR_TOTAL_QTY,
        totalAmt: order.VENDOR_TOTAL_AMT,
        itemCount: order.VENDOR_ITEM_COUNT,
      };
    }
    acc[vendorId].orders.push(order);
    return acc;
  }, {} as Record<string, any>);

  // 데이터 로드
  useEffect(() => {
    if (isOpen && orderData.orderDate && orderData.orderSequ) {
      loadVendorOrders();
    }
  }, [isOpen, orderData]);

  const loadVendorOrders = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // 발주일자는 YYYY-MM-DD 형식 그대로 사용
      console.log('벤더 주문 정보 요청 파라미터:', {
        ORDER_D: orderData.orderDate,
        ORDER_SEQU: orderData.orderSequ
      });
      
      const response = await fetch('/api/orders/vendor-orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ORDER_D: orderData.orderDate,  // YYYY-MM-DD 형식 그대로
          ORDER_SEQU: orderData.orderSequ,
        }),
      });

      if (!response.ok) {
        throw new Error('벤더 주문 정보를 가져오는데 실패했습니다.');
      }

      const data = await response.json();
      console.log('벤더 주문 정보 응답:', data);
      
      if (data && Array.isArray(data)) {
        setVendorOrders(data);
        // 모든 벤더를 기본 선택
        const allVendorIds = new Set(data.map((item: VendorOrderInfo) => item.VENDOR_ID));
        setSelectedVendors(allVendorIds as Set<string>);
        // 모든 벤더를 펼친 상태로 초기화
        setExpandedVendors(allVendorIds as Set<string>);
        setAllExpanded(true);
      } else {
        throw new Error('벤더 주문 정보가 없습니다.');
      }
    } catch (error) {
      console.error('벤더 주문 정보 로드 실패:', error);
      setError(error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleVendorSelect = (vendorId: string) => {
    const newSelected = new Set(selectedVendors);
    if (newSelected.has(vendorId)) {
      newSelected.delete(vendorId);
    } else {
      newSelected.add(vendorId);
    }
    setSelectedVendors(newSelected);
  };

  const handleSelectAll = () => {
    if (selectedVendors.size === Object.keys(groupedVendors).length) {
      setSelectedVendors(new Set());
    } else {
      setSelectedVendors(new Set(Object.keys(groupedVendors)));
    }
  };

  const handleToggleVendor = (vendorId: string) => {
    const newExpanded = new Set(expandedVendors);
    if (newExpanded.has(vendorId)) {
      newExpanded.delete(vendorId);
    } else {
      newExpanded.add(vendorId);
    }
    setExpandedVendors(newExpanded);
  };

  const handleToggleAll = () => {
    if (allExpanded) {
      setExpandedVendors(new Set());
      setAllExpanded(false);
    } else {
      setExpandedVendors(new Set(Object.keys(groupedVendors)));
      setAllExpanded(true);
    }
  };

  // 엑셀 내보내기 함수
  const handleExportToExcel = () => {
    if (!vendorOrders || vendorOrders.length === 0) {
      alert('내보낼 데이터가 없습니다.');
      return;
    }

    try {
      // 워크북 생성
      const workbook = XLSX.utils.book_new();

      // 1. 통합 시트 생성 (모든 벤더의 주문 내역)
      const allData = [
        ['HD Sync 발주서 통합 내역'],
        [''],
        ['발주일자', orderData.orderDate],
        ['발주번호', `${orderData.orderDate}-${orderData.orderSequ}`],
        ['입고요구일', vendorOrders.length > 0 ? vendorOrders[0].REQUIRE_D : ''],
        ['생성일시', new Date().toLocaleString('ko-KR')],
        [''],
        ['벤더명', '이메일', '전화번호', 'NO.', '상품명', '브랜드코드', '수량', '소비자가단가(원)', '소비자가금액(원)']
      ];

      // 모든 주문 데이터 추가
      vendorOrders.forEach((order, index) => {
        allData.push([
          order.VENDOR_NAME,
          order.VENDOR_EMAIL || '',
          order.VENDOR_TEL || '',
          (index + 1).toString(), // NO. 일련번호
          order.GOODS_NM,
          order.GOODS_ID_BRAND,
          (order.ORDER_QTY || 0).toString(),
          (order.SOBIJA_DAN || 0).toString(),
          (order.SOBIJA_TOT || 0).toString()
        ]);
      });

      // 통합 시트 총계 추가 (한 줄 위에)
      const totalQty = vendorOrders.reduce((sum, order) => sum + (order.ORDER_QTY || 0), 0);
      const totalAmount = vendorOrders.reduce((sum, order) => sum + (order.SOBIJA_TOT || 0), 0);
      allData.push(['총계', '', '', '', '', '', totalQty, '', totalAmount]);

      const allSheet = XLSX.utils.aoa_to_sheet(allData);
      
      // 통합 시트 스타일링 및 병합
      allSheet['!cols'] = [
        { width: 20 }, // 벤더명
        { width: 25 }, // 이메일
        { width: 15 }, // 전화번호
        { width: 8 },  // NO.
        { width: 35 }, // 상품명
        { width: 15 }, // 브랜드코드
        { width: 10 }, // 수량
        { width: 15 }, // 단가
        { width: 15 }  // 금액
      ];

      // 통합 시트 병합 범위 설정
      allSheet['!merges'] = [
        { s: { r: 0, c: 0 }, e: { r: 0, c: 8 } }  // 제목 병합 (A1:I1)
      ];

      // 통합 시트 스타일 적용
      const allRange = XLSX.utils.decode_range(allSheet['!ref'] || 'A1');
      
      // 제목 스타일 (A1)
      if (!allSheet['A1']) allSheet['A1'] = { v: 'HD Sync 발주서 통합 내역' };
      allSheet['A1'].s = {
        font: { name: '맑은 고딕', sz: 16, bold: true, color: { rgb: 'FFFFFF' } },
        fill: { fgColor: { rgb: '4A90E2' } },
        alignment: { horizontal: 'center', vertical: 'center' },
        border: {
          top: { style: 'thin', color: { rgb: '000000' } },
          bottom: { style: 'thin', color: { rgb: '000000' } },
          left: { style: 'thin', color: { rgb: '000000' } },
          right: { style: 'thin', color: { rgb: '000000' } }
        }
      };

      // 발주번호 셀에 왼쪽 정렬 적용
      if (allSheet['B4']) {
        allSheet['B4'].s = {
          ...allSheet['B4'].s,
          alignment: { horizontal: 'left', vertical: 'center' }
        };
      }

      // 헤더 스타일 (8행) - 개별 셀에 적용
      const headerRow = 8;
      const headerCols = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I'];
      const headerTexts = ['벤더명', '이메일', '전화번호', 'NO.', '상품명', '브랜드코드', '수량', '소비자가단가(원)', '소비자가금액(원)'];
      
      headerCols.forEach((col, index) => {
        const cellRef = col + headerRow;
        if (allSheet[cellRef]) {
          allSheet[cellRef].v = headerTexts[index];
          allSheet[cellRef].s = {
            font: { name: '맑은 고딕', sz: 9, bold: true, color: { rgb: 'FFFFFF' } },
            fill: { fgColor: { rgb: '6B9BD2' } },
            alignment: { horizontal: 'center', vertical: 'center' },
            border: {
              top: { style: 'thin', color: { rgb: '000000' } },
              bottom: { style: 'thin', color: { rgb: '000000' } },
              left: { style: 'thin', color: { rgb: '000000' } },
              right: { style: 'thin', color: { rgb: '000000' } }
            }
          };
        }
      });

      // 데이터 행 스타일 (총계 행 제외)
      for (let row = 9; row < allRange.e.r+1; row++) {
        ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I'].forEach((col, colIndex) => {
          const cellRef = col + row;
          if (allSheet[cellRef]) {
            const baseStyle = {
              font: { name: '맑은 고딕', sz: 9 },
              alignment: { horizontal: 'center', vertical: 'center' },
              border: {
                top: { style: 'thin', color: { rgb: '000000' } },
                bottom: { style: 'thin', color: { rgb: '000000' } },
                left: { style: 'thin', color: { rgb: '000000' } },
                right: { style: 'thin', color: { rgb: '000000' } }
              }
            };

            // 수량(G), 단가(H), 금액(I) 컬럼에 숫자 서식 적용
            if (colIndex === 6) { // G 컬럼 (수량) - 천단위 콤마
              allSheet[cellRef].s = {
                ...baseStyle,
                numFmt: 3 // 천단위 콤마 서식 (Excel 내장 서식)
              };
            } else if (colIndex === 7) { // H 컬럼 (단가) - 천단위 콤마만
              allSheet[cellRef].s = {
                ...baseStyle,
                numFmt: 3 // 천단위 콤마 서식 (Excel 내장 서식)
              };
            } else if (colIndex === 8) { // I 컬럼 (금액) - 천단위 콤마
              allSheet[cellRef].s = {
                ...baseStyle,
                numFmt: 3 // 천단위 콤마 서식 (Excel 내장 서식)
              };
            } else {
              allSheet[cellRef].s = baseStyle;
            }
          }
        });
      }

      // 총계 행 스타일 (초록색 배경)
      const totalRow = allRange.e.r + 1;
      const totalRowStyle = {
        font: { name: '맑은 고딕', sz: 9, bold: true, color: { rgb: 'FFFFFF' } },
        fill: { fgColor: { rgb: '8FBC8F' } },
        alignment: { horizontal: 'center', vertical: 'center' },
        border: {
          top: { style: 'medium', color: { rgb: '000000' } },
          bottom: { style: 'medium', color: { rgb: '000000' } },
          left: { style: 'thin', color: { rgb: '000000' } },
          right: { style: 'thin', color: { rgb: '000000' } }
        }
      };
      
      // 총계 행의 각 셀에 스타일 적용
      for (let col = 0; col < 9; col++) {
        const cellRef = String.fromCharCode(65 + col) + totalRow; // A, B, C, D, E, F, G, H, I
        if (allSheet[cellRef]) {
          // 수량(G), 단가(H), 금액(I) 컬럼에 숫자 서식 추가
          if (col === 6) { // G 컬럼 (수량) - 천단위 콤마
            allSheet[cellRef].s = {
              ...totalRowStyle,
              numFmt: 3 // 천단위 콤마 서식 (Excel 내장 서식)
            };
          } else if (col === 7) { // H 컬럼 (단가) - 천단위 콤마만
            allSheet[cellRef].s = {
              ...totalRowStyle,
              numFmt: 3 // 천단위 콤마 서식 (Excel 내장 서식)
            };
          } else if (col === 8) { // I 컬럼 (금액) - 천단위 콤마
            allSheet[cellRef].s = {
              ...totalRowStyle,
              numFmt: 3 // 천단위 콤마 서식 (Excel 내장 서식)
            };
          } else {
            allSheet[cellRef].s = totalRowStyle;
          }
        }
      }

      XLSX.utils.book_append_sheet(workbook, allSheet, '통합내역');

      // 2. 벤더별 개별 시트 생성
      Object.entries(groupedVendors).forEach(([, vendorData]) => {
        const vendorSheetData = [
          [`HD Sync 발주서 - ${vendorData.vendorInfo.VENDOR_NAME}`],
          [''],
          ['발주일자', orderData.orderDate],
          ['발주번호', `${orderData.orderDate}-${orderData.orderSequ}`],
          ['입고요구일', vendorData.orders.length > 0 ? vendorData.orders[0].REQUIRE_D : ''],
          ['벤더명', vendorData.vendorInfo.VENDOR_NAME],
          ['이메일', vendorData.vendorInfo.VENDOR_EMAIL || ''],
          ['전화번호', vendorData.vendorInfo.VENDOR_TEL || ''],
          ['생성일시', new Date().toLocaleString('ko-KR')],
          [''],
          ['NO.', '상품명', '브랜드코드', '수량', '소비자가단가(원)', '소비자가금액(원)']
        ];

        // 해당 벤더의 주문 데이터 추가 (No. 라인넘버 포함)
        vendorData.orders.forEach((order: VendorOrderInfo, index: number) => {
          vendorSheetData.push([
            (index + 1).toString(), // No. 라인넘버
            order.GOODS_NM,
            order.GOODS_ID_BRAND,
          (order.ORDER_QTY || 0).toString(),
          (order.SOBIJA_DAN || 0).toString(),
          (order.SOBIJA_TOT || 0).toString()
          ]);
        });

        // 벤더별 총계 추가 (한 줄 위에)
        const vendorTotalQty = vendorData.orders.reduce((sum: number, order: VendorOrderInfo) => sum + (order.ORDER_QTY || 0), 0);
        const vendorTotalAmount = vendorData.orders.reduce((sum: number, order: VendorOrderInfo) => sum + (order.SOBIJA_TOT || 0), 0);
        vendorSheetData.push(['총계', '', '', vendorTotalQty, '', vendorTotalAmount]);

        const vendorSheet = XLSX.utils.aoa_to_sheet(vendorSheetData);
        
        // 벤더 시트 스타일링 및 병합
        vendorSheet['!cols'] = [
          { width: 12 },  // NO.
          { width: 40 }, // 상품명
          { width: 15 }, // 브랜드코드
          { width: 10 }, // 수량
          { width: 15 }, // 단가
          { width: 15 }  // 금액
        ];

        // 벤더 시트 병합 범위 설정 (헤더 병합 제거)
        vendorSheet['!merges'] = [
          { s: { r: 0, c: 0 }, e: { r: 0, c: 5 } }  // 제목 병합 (A1:F1)
        ];

        // 벤더 시트 스타일 적용
        const vendorRange = XLSX.utils.decode_range(vendorSheet['!ref'] || 'A1');
        
        // 제목 스타일 (A1)
        if (!vendorSheet['A1']) vendorSheet['A1'] = { v: `HD Sync 발주서 - ${vendorData.vendorInfo.VENDOR_NAME}` };
        vendorSheet['A1'].s = {
          font: { name: '맑은 고딕', sz: 14, bold: true, color: { rgb: 'FFFFFF' } },
          fill: { fgColor: { rgb: '4A90E2' } },
          alignment: { horizontal: 'center', vertical: 'center' },
          border: {
            top: { style: 'thin', color: { rgb: '000000' } },
            bottom: { style: 'thin', color: { rgb: '000000' } },
            left: { style: 'thin', color: { rgb: '000000' } },
            right: { style: 'thin', color: { rgb: '000000' } }
          }
        };

        // 벤더 시트 발주번호 셀에 왼쪽 정렬 적용
        if (vendorSheet['B4']) {
          vendorSheet['B4'].s = {
            ...vendorSheet['B4'].s,
            alignment: { horizontal: 'left', vertical: 'center' }
          };
        }

        // 헤더 스타일 (11행) - 개별 셀에 적용
        const vendorHeaderRow = 11;
        const vendorHeaderCols = ['A', 'B', 'C', 'D', 'E', 'F'];
        const vendorHeaderTexts = ['NO.', '상품명', '브랜드코드', '수량', '소비자가단가(원)', '소비자가금액(원)'];
        
        vendorHeaderCols.forEach((col, index) => {
          const cellRef = col + vendorHeaderRow;
          if (vendorSheet[cellRef]) {
            vendorSheet[cellRef].v = vendorHeaderTexts[index];
            vendorSheet[cellRef].s = {
              font: { name: '맑은 고딕', sz: 9, bold: true, color: { rgb: 'FFFFFF' } },
              fill: { fgColor: { rgb: '6B9BD2' } },
              alignment: { horizontal: 'center', vertical: 'center' },
              border: {
                top: { style: 'thin', color: { rgb: '000000' } },
                bottom: { style: 'thin', color: { rgb: '000000' } },
                left: { style: 'thin', color: { rgb: '000000' } },
                right: { style: 'thin', color: { rgb: '000000' } }
              }
            };
          }
        });

        // 데이터 행 스타일 (총계 행 제외)
        for (let row = 12; row < vendorRange.e.r+1; row++) {
          ['A', 'B', 'C', 'D', 'E', 'F'].forEach((col, colIndex) => {
            const cellRef = col + row;
            if (vendorSheet[cellRef]) {
              const baseStyle = {
                font: { name: '맑은 고딕', sz: 9 },
                alignment: { horizontal: 'center', vertical: 'center' },
                border: {
                  top: { style: 'thin', color: { rgb: '000000' } },
                  bottom: { style: 'thin', color: { rgb: '000000' } },
                  left: { style: 'thin', color: { rgb: '000000' } },
                  right: { style: 'thin', color: { rgb: '000000' } }
                }
              };

              // 수량(D), 단가(E), 금액(F) 컬럼에 숫자 서식 적용
              if (colIndex === 3) { // D 컬럼 (수량) - 천단위 콤마
                vendorSheet[cellRef].s = {
                  ...baseStyle,
                  numFmt: 3 // 천단위 콤마 서식 (Excel 내장 서식)
                };
              } else if (colIndex === 4) { // E 컬럼 (단가) - 천단위 콤마만
                vendorSheet[cellRef].s = {
                  ...baseStyle,
                  numFmt: 3 // 천단위 콤마 서식 (Excel 내장 서식)
                };
              } else if (colIndex === 5) { // F 컬럼 (금액) - 천단위 콤마
                vendorSheet[cellRef].s = {
                  ...baseStyle,
                  numFmt: 3 // 천단위 콤마 서식 (Excel 내장 서식)
                };
              } else {
                vendorSheet[cellRef].s = baseStyle;
              }
            }
          });
        }

        // 총계 행 스타일
        const vendorTotalRow = vendorRange.e.r + 1;
        const vendorTotalRowStyle = {
          font: { name: '맑은 고딕', sz: 9, bold: true, color: { rgb: 'FFFFFF' } },
          fill: { fgColor: { rgb: '8FBC8F' } },
          alignment: { horizontal: 'center', vertical: 'center' },
          border: {
            top: { style: 'medium', color: { rgb: '000000' } },
            bottom: { style: 'medium', color: { rgb: '000000' } },
            left: { style: 'thin', color: { rgb: '000000' } },
            right: { style: 'thin', color: { rgb: '000000' } }
          }
        };
        
        // 벤더 시트 총계 행의 각 셀에 스타일 적용
        for (let col = 0; col < 6; col++) {
          const cellRef = String.fromCharCode(65 + col) + vendorTotalRow; // A, B, C, D, E, F
          if (vendorSheet[cellRef]) {
            // 수량(D), 단가(E), 금액(F) 컬럼에 숫자 서식 추가
            if (col === 3) { // D 컬럼 (수량) - 천단위 콤마
              vendorSheet[cellRef].s = {
                ...vendorTotalRowStyle,
                numFmt: 3 // 천단위 콤마 서식 (Excel 내장 서식)
              };
            } else if (col === 4) { // E 컬럼 (단가) - 천단위 콤마만
              vendorSheet[cellRef].s = {
                ...vendorTotalRowStyle,
                numFmt: 3 // 천단위 콤마 서식 (Excel 내장 서식)
              };
            } else if (col === 5) { // F 컬럼 (금액) - 천단위 콤마
              vendorSheet[cellRef].s = {
                ...vendorTotalRowStyle,
                numFmt: 3 // 천단위 콤마 서식 (Excel 내장 서식)
              };
            } else {
              vendorSheet[cellRef].s = vendorTotalRowStyle;
            }
          }
        }

        // 시트명은 벤더명으로 설정 (Excel 시트명 제한 고려)
        const sheetName = vendorData.vendorInfo.VENDOR_NAME.length > 31 
          ? vendorData.vendorInfo.VENDOR_NAME.substring(0, 31) 
          : vendorData.vendorInfo.VENDOR_NAME;
        
        XLSX.utils.book_append_sheet(workbook, vendorSheet, sheetName);
      });

      // 파일명 생성 (발주일자_발주번호_벤더주문내역.xlsx)
      const fileName = `발주서_${orderData.orderDate}_${orderData.orderSequ}_벤더주문내역.xlsx`;
      
      // 엑셀 파일 생성 및 다운로드 (스타일 포함)
      const excelBuffer = XLSX.write(workbook, { 
        bookType: 'xlsx', 
        type: 'array',
        cellStyles: true 
      });
      const data = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      saveAs(data, fileName);

      alert('엑셀 파일이 성공적으로 다운로드되었습니다.');
    } catch (error) {
      console.error('엑셀 내보내기 오류:', error);
      alert('엑셀 파일 내보내기에 실패했습니다.');
    }
  };

  // 이메일 전송 시작 (패스워드 모달 표시)
  const handleSendOrders = () => {
    if (selectedVendors.size === 0) {
      alert('발주서를 전송할 벤더를 선택해주세요.');
      return;
    }

    // 이메일 주소가 있는 벤더만 필터링
    const selectedVendorData = Object.entries(groupedVendors)
      .filter(([vendorId]) => selectedVendors.has(vendorId))
      .map(([, data]) => data);

    const vendorsWithEmail = selectedVendorData.filter(vendor => vendor.vendorInfo.VENDOR_EMAIL);
    
    if (vendorsWithEmail.length === 0) {
      alert('선택한 벤더 중 이메일 주소가 있는 벤더가 없습니다.');
      return;
    }

    if (vendorsWithEmail.length < selectedVendorData.length) {
      const withoutEmail = selectedVendorData.length - vendorsWithEmail.length;
      if (!confirm(`${withoutEmail}개 벤더는 이메일 주소가 없어 제외됩니다. 계속하시겠습니까?`)) {
        return;
      }
    }

    setShowEmailPasswordModal(true);
  };

  // 이메일 패스워드 확인 후 실제 전송
  const handleEmailPasswordConfirm = async (password: string) => {
    setEmailSending(true);
    setShowEmailPasswordModal(false);
    
    try {
      const selectedVendorData = Object.entries(groupedVendors)
        .filter(([vendorId]) => selectedVendors.has(vendorId))
        .map(([, data]) => data)
        .filter(vendor => vendor.vendorInfo.VENDOR_EMAIL); // 이메일이 있는 벤더만

      // 이메일 전송 요청 데이터 구성
      const emailRequest = {
        serverConfig: {
          smtpServer: "mail.topvel.co.kr",
          smtpPort: 25,
          username: "topvel@topvel.co.kr",
          password: password,
          useSSL: false,
          fromEmail: "topvel@topvel.co.kr",
          fromName: "topvel@topvel.co.kr"
        },
        userId: user?.userId || 'SYSTEM', // 사용자 ID 추가
        orderInfo: {
          orderDate: orderData.orderDate,
          orderSequ: orderData.orderSequ,
          orderNumber: orderData.orderNumber,
          requireDate: selectedVendorData.length > 0 ? selectedVendorData[0].orders[0]?.REQUIRE_D || '' : '',
          storeName: selectedVendorData.length > 0 ? selectedVendorData[0].orders[0]?.AGENT_NAME || 'HD Sync 매장' : 'HD Sync 매장',
          address: selectedVendorData.length > 0 ? selectedVendorData[0].orders[0]?.AGENT_ADDR || '' : '',
          recipient: selectedVendorData.length > 0 ? selectedVendorData[0].orders[0]?.AGENT_NAME || '' : '',
          phoneNumber: selectedVendorData.length > 0 ? selectedVendorData[0].orders[0]?.AGENT_TEL || '' : ''
        },
        vendors: selectedVendorData.map(vendor => ({
          vendorId: vendor.vendorInfo.VENDOR_ID,
          vendorName: vendor.vendorInfo.VENDOR_NAME,
          vendorEmail: vendor.vendorInfo.VENDOR_EMAIL,
          vendorTel: vendor.vendorInfo.VENDOR_TEL,
          vendorAddr: vendor.vendorInfo.VENDOR_ADDR,
          // 매장 정보 (배송지 정보)
          storeId: vendor.orders[0]?.AGENT_ID || '',
          storeName: vendor.orders[0]?.AGENT_NAME || 'HD Sync 매장',
          storeAddress: vendor.orders[0]?.AGENT_ADDR || '',
          storePhone: vendor.orders[0]?.AGENT_TEL || '',
          recipient: vendor.orders[0]?.AGENT_NAME || '',
          items: vendor.orders.map((order: VendorOrderInfo) => ({
            goodsId: order.GOODS_ID,
            goodsIdBrand: order.GOODS_ID_BRAND,
            goodsName: order.GOODS_NM,
            brandName: order.BRAND_NAME,
            orderQty: order.ORDER_QTY,
            sobiJaDan: order.SOBIJA_DAN,
            sobiJaTot: order.SOBIJA_TOT,
            orderMemo: order.ORDER_MEMO
          })),
          totalQty: vendor.totalQty,
          totalAmount: vendor.totalAmt,
          totalSobiJaAmount: vendor.orders.reduce((sum: number, order: VendorOrderInfo) => sum + (order.SOBIJA_TOT || 0), 0),
          itemCount: vendor.itemCount
        }))
      };

      const response = await fetch('/api/email/send-orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(emailRequest),
      });

      if (!response.ok) {
        throw new Error('이메일 전송에 실패했습니다.');
      }

      const result = await response.json();

      // 성공/실패 메시지 표시
      if (result.success) {
        alert(`${result.successCount}개 벤더에게 발주서가 성공적으로 전송되었습니다.`);
        if (result.failureCount > 0) {
          alert(`실패한 벤더: ${result.failureCount}개\n자세한 내용은 결과를 확인해주세요.`);
        }
      } else {
        alert(`이메일 전송에 실패했습니다: ${result.message}`);
      }

    } catch (error) {
      console.error('이메일 전송 실패:', error);
      alert(error instanceof Error ? error.message : '이메일 전송 중 오류가 발생했습니다.');
    } finally {
      setEmailSending(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ko-KR').format(amount);
  };

  // 드래그 핸들러
  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget || (e.target as HTMLElement).closest('.order-send-modal-header')) {
      setIsDragging(true);
      const modal = document.querySelector('.order-send-modal') as HTMLElement;
      if (modal) {
        const rect = modal.getBoundingClientRect();
        setDragOffset({
          x: e.clientX - rect.left,
          y: e.clientY - rect.top
        });
      }
    }
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (isDragging) {
      const newX = e.clientX - dragOffset.x;
      const newY = e.clientY - dragOffset.y;
      setModalPosition({ x: newX, y: newY });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // 드래그 이벤트 리스너 등록/해제
  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, dragOffset]);

  if (!isOpen) return null;

  return (
    <div className="order-send-modal-overlay">
      <div 
        className="order-send-modal"
        style={{
          position: 'fixed',
          left: modalPosition.x || '50%',
          top: modalPosition.y || '20%',
          transform: modalPosition.x || modalPosition.y ? 'none' : 'translate(-50%, 0)',
          transition: isDragging ? 'none' : 'all 0.2s ease-out'
        }}
      >
        {/* 헤더 */}
        <div 
          className="order-send-modal-header"
          onMouseDown={handleMouseDown}
          style={{ cursor: isDragging ? 'grabbing' : 'grab' }}
        >
          <div className="order-send-modal-title">
            <Mail className="order-send-modal-icon" />
            <h3>발주서 전송</h3>
          </div>
          <button className="order-send-modal-close" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        {/* 발주 정보 */}
        <div className="order-send-modal-order-info">
          <div className="order-send-modal-order-item">
            <span className="order-send-modal-label">발주번호:</span>
            <span className="order-send-modal-value">{orderData.orderNumber}</span>
          </div>
          <div className="order-send-modal-order-item">
            <span className="order-send-modal-label">발주일자:</span>
            <span className="order-send-modal-value">{orderData.orderDate}</span>
          </div>
        </div>

        {/* 컨텐츠 */}
        <div className="order-send-modal-content">
          {loading && (
            <div className="order-send-modal-loading">
              <div className="order-send-modal-spinner"></div>
              <span>벤더 주문 정보를 불러오는 중...</span>
            </div>
          )}

          {error && (
            <div className="order-send-modal-error">
              <AlertCircle className="order-send-modal-error-icon" />
              <span>{error}</span>
            </div>
          )}

          {!loading && !error && vendorOrders.length > 0 && (
            <>
              {/* 전체 선택 */}
              <div className="order-send-modal-select-all">
                <label className="order-send-modal-checkbox-label">
                  <input
                    type="checkbox"
                    checked={selectedVendors.size === Object.keys(groupedVendors).length}
                    onChange={handleSelectAll}
                    className="order-send-modal-checkbox"
                  />
                  <span className="order-send-modal-checkbox-text">
                    전체 선택 ({Object.keys(groupedVendors).length}개 벤더)
                  </span>
                </label>
                <button 
                  className="order-send-modal-toggle-all-btn"
                  onClick={handleToggleAll}
                  title={allExpanded ? "전체 접기" : "전체 펼치기"}
                >
                  {allExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                </button>
              </div>

              {/* 벤더 목록 */}
              <div className="order-send-modal-vendor-list">
                {Object.entries(groupedVendors).map(([vendorId, vendorData]) => (
                  <div key={vendorId} className="order-send-modal-vendor-card">
                    <div className="order-send-modal-vendor-header">
                      <div className="order-send-modal-vendor-header-left">
                        <label className="order-send-modal-checkbox-label">
                          <input
                            type="checkbox"
                            checked={selectedVendors.has(vendorId)}
                            onChange={() => handleVendorSelect(vendorId)}
                            className="order-send-modal-checkbox"
                          />
                          <div className="order-send-modal-vendor-name-container">
                            <span className="order-send-modal-vendor-name">{vendorData.vendorInfo.VENDOR_NAME}</span>
                            <div className="order-send-modal-vendor-contact">
                              {vendorData.vendorInfo.VENDOR_EMAIL && (
                                <>
                                  <Mail size={10} />
                                  <span>{vendorData.vendorInfo.VENDOR_EMAIL}</span>
                                </>
                              )}
                              {vendorData.vendorInfo.VENDOR_EMAIL && vendorData.vendorInfo.VENDOR_TEL && (
                                <span className="order-send-modal-contact-separator">|</span>
                              )}
                              {vendorData.vendorInfo.VENDOR_TEL && (
                                <>
                                  <Phone size={10} />
                                  <span>{vendorData.vendorInfo.VENDOR_TEL}</span>
                                </>
                              )}
                            </div>
                          </div>
                        </label>
                        <button 
                          className="order-send-modal-toggle-btn"
                          onClick={() => handleToggleVendor(vendorId)}
                          title={expandedVendors.has(vendorId) ? "접기" : "펼치기"}
                        >
                          {expandedVendors.has(vendorId) ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                        </button>
                      </div>
                      <div className="order-send-modal-vendor-stats">
                        <span className="order-send-modal-stat">
                          <Package size={14} />
                          {vendorData.itemCount}개 품목
                        </span>
                        <span className="order-send-modal-stat">
                          총 {formatCurrency(vendorData.orders.reduce((sum: number, order: VendorOrderInfo) => sum + (order.SOBIJA_TOT || 0), 0))}원
                        </span>
                      </div>
                    </div>

                    {expandedVendors.has(vendorId) && (
                      <div className="order-send-modal-vendor-details">
                        {/* 품목 목록 (모든 품목 표시) */}
                        <div className="order-send-modal-items">
                          {vendorData.orders.map((order: VendorOrderInfo, index: number) => (
                            <div key={index} className="order-send-modal-item">
                              <div className="order-send-modal-item-info">
                                <span className="order-send-modal-item-name">
                                  {order.GOODS_NM}
                                  {order.GOODS_ID_BRAND && (
                                    <span className="order-send-modal-item-code"> [{order.GOODS_ID_BRAND}]</span>
                                  )}
                                </span>
                              </div>
                              <span className="order-send-modal-item-qty">{order.ORDER_QTY}개</span>
                              <span className="order-send-modal-item-price">{formatCurrency(order.SOBIJA_TOT)}원</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </>
          )}

          {!loading && !error && vendorOrders.length === 0 && (
            <div className="order-send-modal-empty">
              <Package size={48} />
              <span>전송할 벤더 주문 정보가 없습니다.</span>
            </div>
          )}
        </div>

        {/* 푸터 */}
        <div className="order-send-modal-footer">
          <button 
            className="order-send-modal-btn-excel" 
            onClick={handleExportToExcel}
            disabled={!vendorOrders || vendorOrders.length === 0}
            title="엑셀 파일로 내보내기"
          >
            <Download size={16} />
            엑셀 내보내기
          </button>
          <div className="order-send-modal-footer-right">
            <button className="order-send-modal-btn-cancel" onClick={onClose}>
              취소
            </button>
            <button 
              className="order-send-modal-btn-send" 
              onClick={handleSendOrders}
              disabled={selectedVendors.size === 0 || emailSending}
            >
              {emailSending ? (
                <>
                  <div className="order-send-modal-spinner-small"></div>
                  이메일 전송 중...
                </>
              ) : (
                <>
                  <Mail size={16} />
                  {selectedVendors.size}개 벤더에게 이메일 전송
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* 이메일 패스워드 입력 모달 */}
      <EmailPasswordModal
        isOpen={showEmailPasswordModal}
        onClose={() => setShowEmailPasswordModal(false)}
        onConfirm={handleEmailPasswordConfirm}
        emailAddress="topvel@topvel.co.kr"
        loading={emailSending}
      />
    </div>
  );
};

export default OrderSendModal;
