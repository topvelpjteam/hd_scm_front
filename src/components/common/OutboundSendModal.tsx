import React, { useState, useEffect, useMemo } from 'react';
import { X, Mail, Package, Phone, AlertCircle, ChevronDown, ChevronRight, ChevronUp, Download } from 'lucide-react';
import { useSelector } from 'react-redux';
import { RootState } from '../../store';
import * as XLSX from 'xlsx-js-style';
import { saveAs } from 'file-saver';
import EmailPasswordModal from './EmailPasswordModal';
import './OrderSendModal.css';

// 출고확정 정보 타입
interface OutboundConfirmInfo {
  ORDER_D: string;
  ORDER_SEQU: number;
  ORDER_NO: number;
  OUT_D: string;
  OUTBOUND_NO: string; // 출고번호: OUT_D-ORDER_D-ORDER_SEQU
  REQUIRE_D: string;
  EST_D: string;
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
  OUT_QTY: number;
  ORDER_QTY: number;
  // 유통기한 정보
  EXP_SEQU?: number | null;
  EXP_D?: string | null;
  EXP_OUT_QTY?: number | null;
  LOT_NO?: string | null;
  SOBIJA_DAN: number;
  SOBIJA_AMT: number;
  SOBIJA_VAT: number;
  SOBIJA_TOT: number;
  ORDER_DAN: number;
  ORDER_AMT: number;
  ORDER_VAT: number;
  ORDER_TOT: number;
  ORDER_MEMO: string;
  SHIP_METHOD: string;
  SHIP_LOGIS_GBN: string;
  SHIP_LOGIS_GBN_NM: string;
  SHIP_TRANS_NO: string;
  SHIP_MEMO: string;
  VENDOR_ITEM_COUNT: number;
  VENDOR_TOTAL_QTY: number;
  VENDOR_TOTAL_OUT_QTY: number;
  VENDOR_TOTAL_AMT: number;
  AGENT_ID?: string;
  AGENT_NAME: string;  // 매장명
  AGENT_ADDR: string;  // 매장주소
  AGENT_TEL: string;   // 매장전화번호
  AGENT_EMAIL: string; // 매장 이메일 (이메일 수신자)
  AGENT_PERSON: string; // 매장 담당자명
}

interface OutboundSendModalProps {
  isOpen: boolean;
  onClose: () => void;
  outboundData: {
    orderDate: string;
    orderSequ: number;
    outDate: string;
    vendorIds?: string[]; // 출고확정된 벤더 ID 목록
  };
}

const OutboundSendModal: React.FC<OutboundSendModalProps> = ({ isOpen, onClose, outboundData }) => {
  const [vendorOutbounds, setVendorOutbounds] = useState<OutboundConfirmInfo[]>([]);
  
  // Redux store에서 사용자 정보 가져오기
  const user = useSelector((state: RootState) => state.auth.user);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedVendors, setSelectedVendors] = useState<Set<string>>(new Set());
  const [expandedVendors, setExpandedVendors] = useState<Set<string>>(new Set());
  const [allExpanded, setAllExpanded] = useState(true);
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [modalPosition, setModalPosition] = useState<{ x: number; y: number } | null>(null);
  
  // 이메일 전송 관련 상태
  const [showEmailPasswordModal, setShowEmailPasswordModal] = useState(false);
  const [emailSending, setEmailSending] = useState(false);

  // 참고: 일부 상태(setters)는 추후 데이터 로딩 로직에서 사용됩니다.
  // 현재 타입 검사(noUnusedLocals)를 통과하도록 의도적으로 참조합니다.
  // 데이터 로딩: 모달 열릴 때 출고 확정된 벤더별 상세 조회
  useEffect(() => {
    if (!isOpen) return;
    const load = async () => {
      try {
        setLoading(true);
        setError(null);
        const payload = {
          ORDER_D: outboundData.orderDate,
          ORDER_SEQU: outboundData.orderSequ,
          OUT_D: outboundData.outDate,
          VENDOR_IDS: outboundData.vendorIds || []
        };
        const res = await fetch('/api/outbound/vendor-outbounds', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        if (!res.ok) throw new Error('업체별 출고 데이터 조회 실패');
        const data = await res.json();
        setVendorOutbounds(data as OutboundConfirmInfo[]);
      } catch (e: any) {
        console.error('출고 데이터 로딩 오류:', e);
        setError(e.message || '출고 데이터 로딩 오류');
        setVendorOutbounds([]);
      } finally {
        setLoading(false);
      }
    };
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, outboundData.orderDate, outboundData.orderSequ, outboundData.outDate, JSON.stringify(outboundData.vendorIds)]);

  // 벤더별 그룹 데이터 구성
  type VendorGroup = {
    vendorInfo: {
      VENDOR_ID: string;
      VENDOR_NAME: string;
      VENDOR_EMAIL?: string | null;
      VENDOR_TEL?: string | null;
      VENDOR_ADDR?: string | null;
      AGENT_NAME?: string | null;
      AGENT_EMAIL?: string | null;
      AGENT_TEL?: string | null;
      AGENT_PERSON?: string | null;
      storeEmail?: string | null; // alias
      storePerson?: string | null; // alias
    };
    outbounds: OutboundConfirmInfo[];
    totalQty: number;
    totalAmt: number;
    itemCount: number;
  };

  const groupedVendors = useMemo<Record<string, VendorGroup>>(() => {
    const map: Record<string, VendorGroup> = {};
    vendorOutbounds.forEach(ob => {
      const key = String(ob.VENDOR_ID);
      if (!map[key]) {
        map[key] = {
          vendorInfo: {
            VENDOR_ID: key,
            VENDOR_NAME: ob.VENDOR_NAME,
            VENDOR_EMAIL: (ob as any).VENDOR_EMAIL || null,
            VENDOR_TEL: (ob as any).VENDOR_TEL || null,
            VENDOR_ADDR: (ob as any).VENDOR_ADDR || null,
            AGENT_NAME: ob.AGENT_NAME || null,
            AGENT_EMAIL: ob.AGENT_EMAIL || null,
            AGENT_TEL: ob.AGENT_TEL || null,
            AGENT_PERSON: ob.AGENT_PERSON || null,
            storeEmail: ob.AGENT_EMAIL || null,
            storePerson: ob.AGENT_PERSON || null,
          },
          outbounds: [],
          totalQty: 0,
          totalAmt: 0,
          itemCount: 0,
        };
      }
      map[key].outbounds.push(ob);
      map[key].totalQty += ob.OUT_QTY || 0;
      map[key].totalAmt += ob.SOBIJA_TOT || 0;
      map[key].itemCount += 1;
    });
    return map;
  }, [vendorOutbounds]);

  // 전체 선택/토글 핸들러
  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedVendors(new Set(Object.keys(groupedVendors)));
    } else {
      setSelectedVendors(new Set());
    }
  };

  const handleToggleAll = () => {
    setAllExpanded(prev => {
      const next = !prev;
      if (next) {
        setExpandedVendors(new Set(Object.keys(groupedVendors)));
      } else {
        setExpandedVendors(new Set());
      }
      return next;
    });
  };

  // 개별 벤더 선택/펼침 토글
  const handleVendorSelect = (vendorId: string | number) => {
    const key = String(vendorId);
    setSelectedVendors(prev => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key); else next.add(key);
      return next;
    });
  };

  const handleToggleVendor = (vendorId: string | number) => {
    const key = String(vendorId);
    setExpandedVendors(prev => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key); else next.add(key);
      return next;
    });
  };

  // 엑셀 내보내기 함수
  const handleExportToExcel = () => {
    if (!vendorOutbounds || vendorOutbounds.length === 0) {
      alert('내보낼 데이터가 없습니다.');
      return;
    }

    try {
      const workbook = XLSX.utils.book_new();
      const first = vendorOutbounds[0];
      const orderNumber = `${outboundData.orderDate}-${outboundData.orderSequ}`;

      // 공통 스타일
      const titleStyle: any = { font:{name:'맑은 고딕',bold:true,sz:16,color:{rgb:'FFFFFF'}}, alignment:{horizontal:'center',vertical:'center'}, fill:{fgColor:{rgb:'4A90E2'}} };
      const labelStyle: any = { font:{name:'맑은 고딕',bold:true}, fill:{fgColor:{rgb:'F2F4F7'}}, alignment:{horizontal:'left',vertical:'center'}, border:{top:{style:'thin',color:{rgb:'DDDDDD'}},bottom:{style:'thin',color:{rgb:'DDDDDD'}},left:{style:'thin',color:{rgb:'DDDDDD'}},right:{style:'thin',color:{rgb:'DDDDDD'}}} };
      const valueStyle: any = { font:{name:'맑은 고딕'}, alignment:{horizontal:'left',vertical:'center'}, border:{top:{style:'thin',color:{rgb:'DDDDDD'}},bottom:{style:'thin',color:{rgb:'DDDDDD'}},left:{style:'thin',color:{rgb:'DDDDDD'}},right:{style:'thin',color:{rgb:'DDDDDD'}}} };
      const tableHeaderStyle: any = { font:{name:'맑은 고딕',bold:true,color:{rgb:'FFFFFF'}}, alignment:{horizontal:'center',vertical:'center'}, fill:{fgColor:{rgb:'6B9BD2'}}, border:{top:{style:'thin',color:{rgb:'BBBBBB'}},bottom:{style:'thin',color:{rgb:'BBBBBB'}},left:{style:'thin',color:{rgb:'BBBBBB'}},right:{style:'thin',color:{rgb:'BBBBBB'}}} };
      const tableCellStyle: any = { font:{name:'맑은 고딕'}, alignment:{horizontal:'center',vertical:'center'}, border:{top:{style:'thin',color:{rgb:'EEEEEE'}},bottom:{style:'thin',color:{rgb:'EEEEEE'}},left:{style:'thin',color:{rgb:'EEEEEE'}},right:{style:'thin',color:{rgb:'EEEEEE'}}} };
      const tableLeftStyle: any = { ...tableCellStyle, alignment:{horizontal:'left',vertical:'center'} };
      const tableRightStyle: any = { ...tableCellStyle, alignment:{horizontal:'right',vertical:'center'} };
      const totalStyle: any = { font:{name:'맑은 고딕',bold:true}, fill:{fgColor:{rgb:'CCFFCC'}}, alignment:{horizontal:'center',vertical:'center'}, border:{top:{style:'medium',color:{rgb:'000000'}},bottom:{style:'medium',color:{rgb:'000000'}},left:{style:'thin',color:{rgb:'000000'}},right:{style:'thin',color:{rgb:'000000'}}} };
      const totalRightStyle: any = { ...totalStyle, alignment:{horizontal:'right',vertical:'center'} };
      const numberFmt = '#,##0';

      // ===== 통합 시트 =====
      const allRows: (string|number)[][] = [];
      allRows.push(['HD Sync 출고내역서 통합']);                                          // Row 1
      allRows.push(['']);                                                                  // Row 2
      allRows.push(['']);                                                                  // Row 3
      allRows.push(['출고번호', first?.OUTBOUND_NO || '']);                                // Row 4
      allRows.push(['출고일자', outboundData.outDate]);                                    // Row 5
      allRows.push(['발주일자', outboundData.orderDate]);                                  // Row 6
      allRows.push(['발주번호', orderNumber]);                                              // Row 7
      allRows.push(['입고요구일', first?.REQUIRE_D || '']);                                // Row 8
      allRows.push(['도착예정일', first?.EST_D || '']);                                    // Row 9
      allRows.push(['출고처', first?.AGENT_NAME || '']);                                   // Row 10
      allRows.push(['출고처 담당자', first?.AGENT_PERSON || '', '브랜드담당자', '']);      // Row 11
      allRows.push(['출고처 전화', first?.AGENT_TEL || '']);                               // Row 12
      allRows.push(['출고처 주소', first?.AGENT_ADDR || '']);                              // Row 13
      allRows.push(['생성일시', new Date().toLocaleString('ko-KR')]);                     // Row 14
      allRows.push(['']);                                                                  // Row 15
      allRows.push(['출고처','이메일','전화번호','NO.','상품명','브랜드코드','유통기한','출고수량','주문수량','소비자가단가(원)','소비자가금액(원)']); // Row 16 - TABLE HEADER
      let totalOut = 0, totalOrd = 0, totalAmt = 0;
      vendorOutbounds.forEach((ob, idx) => {
        const expOutQty = ob.EXP_OUT_QTY || ob.OUT_QTY || 0;
        totalOut += expOutQty; totalOrd += ob.ORDER_QTY || 0; totalAmt += ob.SOBIJA_TOT || 0;
        allRows.push([ob.AGENT_NAME, ob.AGENT_EMAIL || '', ob.AGENT_TEL || '', idx+1, ob.GOODS_NM, ob.GOODS_ID_BRAND, ob.EXP_D || '-', expOutQty, ob.ORDER_QTY || 0, ob.SOBIJA_DAN || 0, ob.SOBIJA_TOT || 0]);
      });
      allRows.push(['합계','','','','','','', totalOut, totalOrd, '', totalAmt]);

      const allSheet = XLSX.utils.aoa_to_sheet(allRows);
      allSheet['!cols'] = [{width:18},{width:28},{width:14},{width:6},{width:36},{width:16},{width:12},{width:12},{width:12},{width:16},{width:18}];
      allSheet['!merges'] = [{ s:{r:0,c:0}, e:{r:0,c:10} }];
      if (allSheet['A1']) allSheet['A1'].s = titleStyle;
      
      // 정보 라벨 스타일 (Row 4~14)
      for (let r=4;r<=14;r++) {
        const la=XLSX.utils.encode_cell({r:r-1,c:0});
        const va=XLSX.utils.encode_cell({r:r-1,c:1});
        if(allSheet[la]) allSheet[la].s=labelStyle; 
        if(allSheet[va]) allSheet[va].s=valueStyle;
      }
      
      // 테이블 헤더 스타일 (Row 16) - 11 columns (0-10)
      const hdrRow = 16; 
      for(let c=0;c<11;c++){ 
        const a=XLSX.utils.encode_cell({r:hdrRow-1,c}); 
        if(allSheet[a]) allSheet[a].s=tableHeaderStyle; 
      }
      
      // 데이터 행 스타일 (Row 17부터, 마지막 행은 합계) - 11 columns (0-10)
      const lastRowIdx = allRows.length;
      for (let r=17; r<=lastRowIdx; r++) {
        const isLastRow = (r === lastRowIdx);
        for (let c=0;c<11;c++) {
          const a=XLSX.utils.encode_cell({r:r-1,c}); if(!allSheet[a]) continue;
          if (isLastRow) {
            // 합계 행 스타일: 출고수량(7), 주문수량(8), 소비자가금액(10)은 우측정렬+숫자포맷
            if ([7,8,10].includes(c)) { allSheet[a].s = { ...totalRightStyle, numFmt: numberFmt }; }
            else { allSheet[a].s = totalStyle; }
          } else {
            // 일반 데이터 행: 상품명(4)은 좌측정렬, 출고수량(7), 주문수량(8), 소비자가단가(9), 소비자가금액(10)은 우측정렬+숫자포맷
            if (c===4) { allSheet[a].s = tableLeftStyle; continue; }
            if ([7,8,9,10].includes(c)) allSheet[a].s = { ...tableRightStyle, numFmt: numberFmt }; else allSheet[a].s = tableCellStyle;
          }
        }
      }
      XLSX.utils.book_append_sheet(workbook, allSheet, '전체출고내역');

      // ===== 벤더별 시트 =====
      Object.entries(groupedVendors).forEach(([_vid, v]: any) => {
        const ob = v.outbounds[0] || {};
        const rows: (string|number)[][] = [];
        rows.push([`${v.vendorInfo.VENDOR_NAME} 출고내역서`]); rows.push(['']);
        rows.push(['출고번호', ob.OUTBOUND_NO || '', '출고일자', outboundData.outDate]);
        rows.push(['발주번호', orderNumber, '발주일자', outboundData.orderDate]);
        rows.push(['입고요구일', ob.REQUIRE_D || '', '도착예정일', ob.EST_D || '']);
        rows.push(['출고처', ob.AGENT_NAME || '', '이메일', ob.AGENT_EMAIL || '']);
        rows.push(['담당자', ob.AGENT_PERSON || '', '전화번호', ob.AGENT_TEL || '']);
        rows.push(['주소', ob.AGENT_ADDR || '', '배송방법', ob.SHIP_LOGIS_GBN_NM || '']);
        rows.push(['송장번호', ob.SHIP_TRANS_NO || '', '', '']);
        rows.push(['']);
        rows.push(['NO.','상품명','브랜드코드','유통기한','출고수량','주문수량','소비자가단가(원)','소비자가금액(원)','비고']);
        v.outbounds.forEach((it: OutboundConfirmInfo, i: number) => rows.push([i+1, it.GOODS_NM, it.GOODS_ID_BRAND, it.EXP_D||'-', it.EXP_OUT_QTY||it.OUT_QTY||0, it.ORDER_QTY||0, it.SOBIJA_DAN||0, it.SOBIJA_TOT||0, it.ORDER_MEMO||'']));
        const vOut = v.outbounds.reduce((s: number, it: OutboundConfirmInfo)=>s+(it.EXP_OUT_QTY||it.OUT_QTY||0),0);
        const vOrd = v.outbounds.reduce((s: number, it: OutboundConfirmInfo)=>s+(it.ORDER_QTY||0),0);
        const vAmt = v.outbounds.reduce((s: number, it: OutboundConfirmInfo)=>s+(it.SOBIJA_TOT||0),0);
        rows.push(['총계','','','',vOut,vOrd,'',vAmt,'']);

        const ws = XLSX.utils.aoa_to_sheet(rows);
        ws['!cols'] = [{width:8},{width:36},{width:16},{width:12},{width:12},{width:12},{width:16},{width:18},{width:22}];
        ws['!merges'] = [{ s:{r:0,c:0}, e:{r:0,c:8} }];
        if (ws['A1']) ws['A1'].s = titleStyle;
        for (let r=3;r<=9;r++) {
          const la=XLSX.utils.encode_cell({r:r-1,c:0}), va=XLSX.utils.encode_cell({r:r-1,c:1});
          const lb=XLSX.utils.encode_cell({r:r-1,c:2}), vb=XLSX.utils.encode_cell({r:r-1,c:3});
          if(ws[la]) ws[la].s=labelStyle; if(ws[va]) ws[va].s=valueStyle;
          if(ws[lb]) ws[lb].s=labelStyle; if(ws[vb]) ws[vb].s=valueStyle;
        }
        const vh=11; for(let c=0;c<9;c++){ const a=XLSX.utils.encode_cell({r:vh-1,c}); if(ws[a]) ws[a].s=tableHeaderStyle; }
        const vLastRow = rows.length;
        for (let r=12; r<=vLastRow; r++) {
          const isVLastRow = (r === vLastRow);
          for (let c=0;c<9;c++) {
            const a=XLSX.utils.encode_cell({r:r-1,c}); if(!ws[a]) continue;
            if (isVLastRow) {
              // 총계 행 스타일: 출고수량(4), 주문수량(5), 소비자가금액(7)은 우측정렬+숫자포맷
              if ([4,5,7].includes(c)) { ws[a].s = { ...totalRightStyle, numFmt: numberFmt }; }
              else { ws[a].s = totalStyle; }
            } else {
              // 일반 데이터 행: 상품명(1)은 좌측정렬, 출고수량(4), 주문수량(5), 소비자가단가(6), 소비자가금액(7)은 우측정렬+숫자포맷
              if (c===1) { ws[a].s = tableLeftStyle; continue; }
              if ([4,5,6,7].includes(c)) ws[a].s = { ...tableRightStyle, numFmt: numberFmt }; else ws[a].s = tableCellStyle;
            }
          }
        }

        const sheetName = (v.vendorInfo.VENDOR_NAME || '출고내역서').replace(/[:\\\/\?\*\[\]]/g,'_').substring(0,31);
        XLSX.utils.book_append_sheet(workbook, ws, sheetName);
      });

      const outboundNo = first?.OUTBOUND_NO || `${outboundData.outDate}-${outboundData.orderDate}-${outboundData.orderSequ}`.replace(/-/g,'');
      const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
      const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      saveAs(blob, `출고내역서_${outboundNo}_${new Date().toISOString().split('T')[0]}.xlsx`);
      alert('엑셀 파일이 다운로드되었습니다.');
    } catch (error) {
      console.error('엑셀 내보내기 오류:', error);
      alert('엑셀 파일 내보내기에 실패했습니다.');
    }
  };

  // 이메일 전송 시작 (패스워드 모달 표시)
  const handleSendOutbounds = () => {
    if (selectedVendors.size === 0) {
      alert('출고내역서를 전송할 벤더를 선택해주세요.');
      return;
    }

    // 이메일 주소가 있는 벤더만 필터링
    const selectedVendorData: VendorGroup[] = Object.keys(groupedVendors)
      .filter((vendorId) => selectedVendors.has(vendorId))
      .map((vendorId) => groupedVendors[vendorId]);

    // 발주처(AGENT) 이메일 기준으로 필터
    const vendorsWithEmail = selectedVendorData.filter((vendor: any) => vendor.outbounds?.[0]?.AGENT_EMAIL);
    
    if (vendorsWithEmail.length === 0) {
      alert('선택한 벤더 중 발주처 이메일 주소가 있는 벤더가 없습니다.');
      return;
    }

    if (vendorsWithEmail.length < selectedVendorData.length) {
      const withoutEmail = selectedVendorData.length - vendorsWithEmail.length;
      if (!confirm(`${withoutEmail}개 벤더는 발주처 이메일 주소가 없어 제외됩니다. 계속하시겠습니까?`)) {
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
      const selectedVendorData: VendorGroup[] = Object.keys(groupedVendors)
        .filter((vendorId) => selectedVendors.has(vendorId))
        .map((vendorId) => groupedVendors[vendorId])
        .filter((vendor) => vendor.outbounds?.[0]?.AGENT_EMAIL);

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
        userId: user?.userId || 'SYSTEM',
        outboundInfo: {
          outboundNo: selectedVendorData.length > 0 ? selectedVendorData[0].outbounds[0]?.OUTBOUND_NO || '' : '',
          outDate: outboundData.outDate,
          orderDate: outboundData.orderDate,
          orderSequ: outboundData.orderSequ,
          orderNumber: `${outboundData.orderDate}-${outboundData.orderSequ}`,
          requireDate: selectedVendorData.length > 0 ? selectedVendorData[0].outbounds[0]?.REQUIRE_D || '' : '',
          estDate: selectedVendorData.length > 0 ? selectedVendorData[0].outbounds[0]?.EST_D || '' : '',
          storeName: selectedVendorData.length > 0 ? selectedVendorData[0].outbounds[0]?.AGENT_NAME || 'HD Sync 매장' : 'HD Sync 매장',
          address: selectedVendorData.length > 0 ? selectedVendorData[0].outbounds[0]?.AGENT_ADDR || '' : '',
          recipient: selectedVendorData.length > 0 ? selectedVendorData[0].outbounds[0]?.AGENT_NAME || '' : '',
          phoneNumber: selectedVendorData.length > 0 ? selectedVendorData[0].outbounds[0]?.AGENT_TEL || '' : ''
        },
        vendors: selectedVendorData.map((vendor) => ({
          vendorId: vendor.vendorInfo.VENDOR_ID,
          vendorName: vendor.vendorInfo.VENDOR_NAME,
          vendorEmail: vendor.vendorInfo.VENDOR_EMAIL || '',
          vendorTel: vendor.vendorInfo.VENDOR_TEL || '',
          vendorAddr: vendor.vendorInfo.VENDOR_ADDR || '',
          storeId: (vendor.outbounds as any)[0]?.AGENT_ID || '',
          storeName: vendor.vendorInfo.AGENT_NAME || vendor.outbounds[0]?.AGENT_NAME || 'HD Sync 매장',
          storeEmail: vendor.vendorInfo.AGENT_EMAIL || vendor.outbounds[0]?.AGENT_EMAIL || '',
          storePerson: vendor.vendorInfo.AGENT_PERSON || vendor.outbounds[0]?.AGENT_PERSON || '',
          storeAddress: vendor.outbounds[0]?.AGENT_ADDR || '',
          storePhone: vendor.vendorInfo.AGENT_TEL || vendor.outbounds[0]?.AGENT_TEL || '',
          recipient: vendor.vendorInfo.AGENT_NAME || vendor.outbounds[0]?.AGENT_NAME || '',
          shipMethod: vendor.outbounds[0]?.SHIP_METHOD || '',
          shipLogisGbn: vendor.outbounds[0]?.SHIP_LOGIS_GBN_NM || '',
          shipTransNo: vendor.outbounds[0]?.SHIP_TRANS_NO || '',
          shipMemo: vendor.outbounds[0]?.SHIP_MEMO || '',
          items: vendor.outbounds.map((outbound: OutboundConfirmInfo) => ({
            goodsId: outbound.GOODS_ID,
            goodsIdBrand: outbound.GOODS_ID_BRAND,
            goodsName: outbound.GOODS_NM,
            brandName: outbound.BRAND_NAME,
            expD: outbound.EXP_D || null,
            expOutQty: outbound.EXP_OUT_QTY || null,
            lotNo: outbound.LOT_NO || null,
            outQty: outbound.EXP_OUT_QTY || outbound.OUT_QTY,
            orderQty: outbound.ORDER_QTY,
            sobiJaDan: outbound.SOBIJA_DAN,
            sobiJaTot: outbound.SOBIJA_TOT,
            orderMemo: outbound.ORDER_MEMO
          })),
          totalOutQty: vendor.outbounds.reduce((sum: number, ob: OutboundConfirmInfo) => sum + (ob.EXP_OUT_QTY || ob.OUT_QTY || 0), 0),
          totalOrderQty: vendor.outbounds.reduce((sum: number, ob: OutboundConfirmInfo) => sum + (ob.ORDER_QTY || 0), 0),
          totalAmount: vendor.totalAmt,
          totalSobiJaAmount: vendor.outbounds.reduce((sum: number, ob: OutboundConfirmInfo) => sum + (ob.SOBIJA_TOT || 0), 0),
          itemCount: vendor.itemCount
        }))
      };

      const response = await fetch('/api/email/send-outbounds', {
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

      if (result.success) {
        alert(`${result.successCount}개 벤더에게 출고내역서가 성공적으로 전송되었습니다.`);
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

  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    } else {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    }
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging]);

  if (!isOpen) return null;

  return (
    <div className="order-send-modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div 
        className="order-send-modal"
        style={modalPosition ? {
          position: 'fixed',
          left: `${modalPosition.x}px`,
          top: `${modalPosition.y}px`,
          transform: 'none'
        } : {}}
      >
        <div 
          className="order-send-modal-header"
          onMouseDown={handleMouseDown}
          style={{ cursor: isDragging ? 'grabbing' : 'grab' }}
        >
          <div className="order-send-modal-title">
            <Mail className="order-send-modal-icon" size={20} />
            <h3>출고내역서 전송</h3>
          </div>
          <button className="order-send-modal-close" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        {/* 출고 정보 */}
        <div className="order-send-modal-order-info">
          <div className="order-send-modal-order-item">
            <span className="order-send-modal-label">출고번호:</span>
            <span className="order-send-modal-value">{vendorOutbounds[0]?.OUTBOUND_NO || '-'}</span>
          </div>
          <div className="order-send-modal-order-item">
            <span className="order-send-modal-label">출고일자:</span>
            <span className="order-send-modal-value">{outboundData.outDate}</span>
          </div>
          <div className="order-send-modal-order-item">
            <span className="order-send-modal-label">발주일자:</span>
            <span className="order-send-modal-value">{outboundData.orderDate}</span>
          </div>
          <div className="order-send-modal-order-item">
            <span className="order-send-modal-label">발주번호:</span>
            <span className="order-send-modal-value">{`${outboundData.orderDate}-${outboundData.orderSequ}`}</span>
          </div>
        </div>

        <div className="order-send-modal-content">
          {loading && (
            <div className="order-send-modal-loading">
              <div className="loading-spinner"></div>
              <p>출고 정보를 불러오는 중...</p>
            </div>
          )}

          {error && (
            <div className="order-send-modal-error">
              <AlertCircle size={20} />
              <p>{error}</p>
            </div>
          )}

          {!loading && !error && vendorOutbounds.length === 0 && (
            <div className="order-send-modal-empty">
              <Package size={48} />
              <p>출고 확정된 벤더 정보가 없습니다.</p>
            </div>
          )}

          {!loading && !error && vendorOutbounds.length > 0 && (
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

              <div className="order-send-modal-vendor-list">
                {Object.entries(groupedVendors).map(([_vendorId, vendor]) => {
                  const isExpanded = expandedVendors.has(vendor.vendorInfo.VENDOR_ID);
                  const isSelected = selectedVendors.has(vendor.vendorInfo.VENDOR_ID);

                  return (
                    <div key={vendor.vendorInfo.VENDOR_ID} className="order-send-modal-vendor-item">
                      <div className="order-send-modal-vendor-header">
                        <div className="order-send-modal-vendor-header-left">
                          <input
                            type="checkbox"
                            className="order-send-modal-vendor-checkbox"
                            checked={isSelected}
                            onChange={() => handleVendorSelect(vendor.vendorInfo.VENDOR_ID)}
                          />
                          <button
                            className="order-send-modal-vendor-toggle"
                            onClick={() => handleToggleVendor(vendor.vendorInfo.VENDOR_ID)}
                          >
                            {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                          </button>
                          <div className="order-send-modal-vendor-info">
                            <div className="order-send-modal-vendor-name">
                              {vendor.vendorInfo.AGENT_NAME || vendor.vendorInfo.VENDOR_NAME}
                            </div>
                            <div className="order-send-modal-vendor-contact">
                              <span className="order-send-modal-vendor-email">
                                <Mail size={14} />
                                {vendor.vendorInfo.AGENT_EMAIL || vendor.vendorInfo.VENDOR_EMAIL || '매장 이메일 없음'}
                              </span>
                              <span className="order-send-modal-vendor-phone">
                                <Phone size={14} />
                                {vendor.vendorInfo.AGENT_TEL || vendor.vendorInfo.VENDOR_TEL || '매장 전화 없음'}
                              </span>
                            </div>
                            {vendor.vendorInfo.AGENT_PERSON && (
                              <div className="order-send-modal-vendor-extra">
                                담당자: {vendor.vendorInfo.AGENT_PERSON}
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="order-send-modal-vendor-header-right">
                          <div className="order-send-modal-vendor-summary">
                            <span className="order-send-modal-vendor-items">
                              <Package size={14} />
                              {vendor.itemCount}개 품목
                            </span>
                            <span className="order-send-modal-vendor-total">
                              총 {formatCurrency(vendor.totalAmt)}원
                            </span>
                          </div>
                        </div>
                      </div>

                      {isExpanded && (
                        <div className="order-send-modal-vendor-items">
                          <table className="order-send-modal-vendor-items-table">
                            <thead>
                              <tr>
                                <th style={{ width: '50px' }}>NO.</th>
                                <th style={{ width: '250px' }}>상품명</th>
                                <th style={{ width: '120px' }}>브랜드코드</th>
                                <th style={{ width: '100px' }}>유통기한</th>
                                <th style={{ width: '80px' }}>출고수량</th>
                                <th style={{ width: '80px' }}>주문수량</th>
                                <th style={{ width: '100px' }}>소비자가단가</th>
                                <th style={{ width: '100px' }}>소비자가금액</th>
                                <th>비고</th>
                              </tr>
                            </thead>
                            <tbody>
                              {vendor.outbounds.map((outbound: OutboundConfirmInfo, index: number) => (
                                <tr key={index}>
                                  <td className="order-send-modal-vendor-table-center">{index + 1}</td>
                                  <td className="order-send-modal-vendor-table-left">{outbound.GOODS_NM}</td>
                                  <td className="order-send-modal-vendor-table-center">{outbound.GOODS_ID_BRAND}</td>
                                  <td className="order-send-modal-vendor-table-center">
                                    {outbound.EXP_D ? outbound.EXP_D : '-'}
                                  </td>
                                  <td className="order-send-modal-vendor-table-right">
                                    {formatCurrency(outbound.EXP_OUT_QTY || outbound.OUT_QTY || 0)}
                                  </td>
                                  <td className="order-send-modal-vendor-table-right">{formatCurrency(outbound.ORDER_QTY || 0)}</td>
                                  <td className="order-send-modal-vendor-table-right">{formatCurrency(outbound.SOBIJA_DAN || 0)}</td>
                                  <td className="order-send-modal-vendor-table-right">{formatCurrency(outbound.SOBIJA_TOT || 0)}</td>
                                  <td className="order-send-modal-vendor-table-left">{outbound.ORDER_MEMO || '-'}</td>
                                </tr>
                              ))}
                            </tbody>
                            <tfoot>
                              <tr className="order-send-modal-vendor-table-footer">
                                <td colSpan={3} className="order-send-modal-vendor-table-center">
                                  <strong>합계</strong>
                                </td>
                                <td className="order-send-modal-vendor-table-center">-</td>
                                <td className="order-send-modal-vendor-table-right">
                                  <strong>{formatCurrency(vendor.totalQty)}</strong>
                                </td>
                                <td className="order-send-modal-vendor-table-right">
                                  <strong>{formatCurrency(vendor.totalQty)}</strong>
                                </td>
                                <td className="order-send-modal-vendor-table-right">-</td>
                                <td className="order-send-modal-vendor-table-right">
                                  <strong>{formatCurrency(vendor.totalAmt)}</strong>
                                </td>
                                <td className="order-send-modal-vendor-table-left">-</td>
                              </tr>
                            </tfoot>
                          </table>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>

        <div className="order-send-modal-footer">
          <div className="order-send-modal-footer-left">
            <button 
              className="order-send-modal-btn-export"
              onClick={handleExportToExcel}
              disabled={vendorOutbounds.length === 0}
            >
              <Download size={16} />
              엑셀 내보내기
            </button>
          </div>
          <div className="order-send-modal-footer-right">
            <button 
              className="order-send-modal-btn-cancel"
              onClick={onClose}
            >
              취소
            </button>
            <button 
              className="order-send-modal-btn-send"
              onClick={handleSendOutbounds}
              disabled={selectedVendors.size === 0 || emailSending}
            >
              {emailSending ? (
                <>
                  <div className="order-send-modal-spinner"></div>
                  이메일 전송 중...
                </>
              ) : (
                <>
                  <Mail size={16} />
                  {selectedVendors.size}개 발주처에게 이메일 전송
                </>
              )}
            </button>
          </div>
        </div>
      </div>

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

export default OutboundSendModal;
