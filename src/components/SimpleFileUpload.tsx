import React, { useCallback } from 'react';
import { ExcelDataRow } from './common/ExcelPreviewModal';

interface SimpleFileUploadProps {
  onDataParsed: (data: ExcelDataRow[]) => void;
}

interface UserBrandsResponse {
  success: boolean;
  brands: string[];
  isAdmin: boolean;
  roleLevel: number;
  agentId?: string;
  message: string;
}

export const useSimpleFileUpload = ({ onDataParsed }: SimpleFileUploadProps) => {
  const handleFileUpload = useCallback(async (file: File) => {
    console.log('📤 간단한 파일 업로드 시작:', file.name);
    
    try {
      // 동적 import로 xlsx 라이브러리 로드
      const XLSX = await import('xlsx');
      
      // 파일을 ArrayBuffer로 읽기
      const arrayBuffer = await file.arrayBuffer();
      
      // 엑셀 파일 파싱
      const workbook = XLSX.read(arrayBuffer, { type: 'array' });
      const firstSheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[firstSheetName];
      
      // 시트를 JSON 배열로 변환
      const jsonData = XLSX.utils.sheet_to_json(worksheet, { 
        header: 1,
        defval: ''
      }) as any[][];
      
      console.log('📊 원본 엑셀 데이터:', jsonData);
      
      if (jsonData.length < 2) {
        alert('파일에 데이터가 없습니다.');
        return;
      }

      // 헤더와 데이터 분리
      const headers = jsonData[0] as string[];
      const dataRows = jsonData.slice(1).filter(row => {
        // 빈 행 제외 - 첫 번째 셀에 값이 있는 행만
        return row && row[0] && row[0].toString().trim() !== '';
      });
      
      console.log('📋 헤더:', headers);
      console.log('📋 데이터 행 수:', dataRows.length);
      console.log('📋 첫 번째 데이터 행:', dataRows[0]);
      
      if (dataRows.length === 0) {
        alert('유효한 데이터가 없습니다.');
        return;
      }
      
      // 사용자 관리 브랜드 조회
      const userInfo = JSON.parse(sessionStorage.getItem('user') || '{}');
      const userId = userInfo.userId;
      const agentId = userInfo.agentId;
      
      console.log('👤 사용자 정보:', userInfo);
      console.log('🆔 사용자 ID:', userId, '(타입:', typeof userId, ')');
      console.log('🏢 Agent ID:', agentId, '(타입:', typeof agentId, ')');
      
      if (!userId) {
        alert('로그인 정보를 찾을 수 없습니다. 다시 로그인해주세요.');
        return;
      }
      
      console.log('🔐 사용자 관리 브랜드 조회 시작:', userId);
      
      let userBrandsData: UserBrandsResponse;
      try {
        // agentId가 있으면 agentId를 사용, 없으면 userId를 사용
        const identifier = agentId || userId;
        const brandsResponse = await fetch(`/api/products/user-brands/${identifier}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        });
        
        console.log('🌐 브랜드 권한 API 응답 상태:', brandsResponse.status, brandsResponse.statusText);
        
        if (!brandsResponse.ok) {
          throw new Error(`브랜드 권한 조회 실패: ${brandsResponse.status}`);
        }
        
        userBrandsData = await brandsResponse.json();
        console.log('🔐 사용자 브랜드 권한:', userBrandsData);
        
        if (!userBrandsData.success) {
          alert(`브랜드 권한 조회 실패: ${userBrandsData.message}`);
          return;
        }
        
      } catch (error) {
        console.error('❌ 브랜드 권한 조회 오류:', error);
        alert('브랜드 권한 확인 중 오류가 발생했습니다.');
        return;
      }
      
      // 데이터를 ExcelDataRow 형태로 변환
      const excelData: ExcelDataRow[] = dataRows.map((row, index) => {
        const rowData: any = {};
        
        console.log(`🔄 행 ${index + 1} 변환 시작:`, row);
        
        // 헤더를 기준으로 데이터 매핑
        headers.forEach((header, colIndex) => {
          if (header) {
            const cleanHeader = header.toString().replace('*', '').trim();
            let cellValue = row[colIndex];
            const originalValue = cellValue; // 원본 값 보존
            const originalType = typeof cellValue;
            
            // null, undefined 처리
            if (cellValue === null || cellValue === undefined) {
              cellValue = '';
            } else if (cleanHeader !== '등록일자') {
              // 등록일자가 아닌 경우에만 문자열로 변환
              cellValue = String(cellValue).trim();
            }
            
            console.log(`  📝 ${cleanHeader}: "${cellValue}" (원본 타입: ${typeof row[colIndex]})`);
            
            // 등록일자 특별 처리 확인 및 변환
            if (cleanHeader === '등록일자') {
              console.log(`  📅 등록일자 발견! 원본 값: "${originalValue}" (타입: ${originalType})`);
              
              // 엑셀 날짜 시리얼 번호를 실제 날짜로 변환
              if (originalType === 'number' && originalValue > 0) {
                const serialNumber = originalValue;
                
                // 엑셀 시리얼 번호를 JavaScript Date로 변환
                // 엑셀은 1900년 1월 1일을 1로 시작하지만, JavaScript는 1970년 1월 1일 기준
                // 엑셀의 1900년 2월 29일 버그를 고려하여 -2를 적용
                const excelBaseDate = new Date(1899, 11, 30); // 1899년 12월 30일
                const jsDate = new Date(excelBaseDate.getTime() + serialNumber * 24 * 60 * 60 * 1000);
                
                // YYYY-MM-DD 형식으로 변환
                const year = jsDate.getFullYear();
                const month = String(jsDate.getMonth() + 1).padStart(2, '0');
                const day = String(jsDate.getDate()).padStart(2, '0');
                cellValue = `${year}-${month}-${day}`;
                
                console.log(`  📅 엑셀 시리얼 번호 ${serialNumber} → 날짜 ${cellValue}로 변환`);
              } else if (originalType === 'string') {
                // 문자열 날짜 형식 처리
                let dateStr = String(originalValue).trim();
                
                if (dateStr.includes('/')) {
                  // MM/DD/YYYY 또는 DD/MM/YYYY 형식을 YYYY-MM-DD로 변환
                  const parts = dateStr.split('/');
                  if (parts.length === 3) {
                    let year, month, day;
                    
                    // 년도가 마지막에 있는 경우 (MM/DD/YYYY 또는 DD/MM/YYYY)
                    if (parts[2].length === 4) {
                      year = parts[2];
                      month = parts[0].padStart(2, '0');
                      day = parts[1].padStart(2, '0');
                    } else {
                      // YYYY/MM/DD 형식
                      year = parts[0];
                      month = parts[1].padStart(2, '0');
                      day = parts[2].padStart(2, '0');
                    }
                    
                    cellValue = `${year}-${month}-${day}`;
                    console.log(`  📅 슬래시 형식 날짜를 ${cellValue}로 변환`);
                  }
                } else if (dateStr.includes('-')) {
                  // 이미 YYYY-MM-DD 형식인 경우 그대로 사용
                  cellValue = dateStr;
                  console.log(`  📅 하이픈 형식 날짜 그대로 사용: ${cellValue}`);
                } else {
                  // 숫자 문자열인 경우 시리얼 번호로 처리
                  const numValue = parseFloat(dateStr);
                  if (!isNaN(numValue) && numValue > 0) {
                    const excelBaseDate = new Date(1899, 11, 30);
                    const jsDate = new Date(excelBaseDate.getTime() + numValue * 24 * 60 * 60 * 1000);
                    
                    const year = jsDate.getFullYear();
                    const month = String(jsDate.getMonth() + 1).padStart(2, '0');
                    const day = String(jsDate.getDate()).padStart(2, '0');
                    cellValue = `${year}-${month}-${day}`;
                    
                    console.log(`  📅 문자열 시리얼 번호 ${numValue} → 날짜 ${cellValue}로 변환`);
                  } else {
                    cellValue = dateStr;
                  }
                }
              } else {
                // 기타 타입은 문자열로 변환
                cellValue = String(originalValue);
              }
              
              console.log(`  📅 최종 등록일자 값: "${cellValue}"`);
            }
            
            // 드롭다운에서 선택한 "코드 명칭" 형태의 데이터에서 코드만 추출
            if (typeof cellValue === 'string' && cellValue.includes(' ')) {
              // 브랜드, 상품구분, 대분류, 중분류, 소분류, 원산지 등은 코드만 추출
              if (['브랜드', '상품구분', '대분류', '중분류', '소분류', '원산지', '통화구분', 'VAT여부', '로트관리여부'].includes(cleanHeader)) {
                const originalValue = cellValue;
                cellValue = cellValue.split(' ')[0];
                console.log(`  🔧 ${cleanHeader} 코드 추출: "${originalValue}" → "${cellValue}"`);
              }
            }
            
            rowData[cleanHeader] = cellValue;
          }
        });
        
        console.log(`  ✅ 행 ${index + 1} 매핑 결과:`, rowData);
        
        // 필수 필드 검증
        let hasError = false;
        let errorMessage = '';
        
        const requiredFields = ['상품코드', '상품명', '브랜드', '상품구분', '대분류', '중분류', '소분류'];
        const missingFields = requiredFields.filter(field => !rowData[field] || rowData[field].toString().trim() === '');
        
        if (missingFields.length > 0) {
          hasError = true;
          errorMessage = `필수 필드 누락: ${missingFields.join(', ')}`;
          console.log(`  ❌ 행 ${index + 1} 검증 실패:`, errorMessage);
        } else {
          // 브랜드 권한 검증
          const brandId = rowData['브랜드'];
          if (brandId && !userBrandsData.isAdmin && !userBrandsData.brands.includes(brandId)) {
            hasError = true;
            errorMessage = `관리 권한이 없는 브랜드입니다: ${brandId}`;
            console.log(`  🚫 행 ${index + 1} 브랜드 권한 없음:`, brandId);
          } else {
            console.log(`  ✅ 행 ${index + 1} 검증 성공 (브랜드: ${brandId})`);
          }
        }
        
        const result = {
          ...rowData,
          rowIndex: index + 2, // 엑셀 행 번호 (헤더 제외)
          hasError,
          errorMessage,
          isDuplicate: false,
          duplicateInfo: '미확인',
          isSelected: !hasError
        } as ExcelDataRow;
        
        console.log(`  🎯 행 ${index + 1} 최종 결과:`, result);
        console.log(`  🎯 행 ${index + 1} - 상품명 확인:`, result.상품명);
        console.log(`  🎯 행 ${index + 1} - 브랜드 확인:`, result.브랜드);
        console.log(`  🎯 행 ${index + 1} - 등록일자 확인:`, result.등록일자);
        console.log(`  🎯 행 ${index + 1} - 오류 상태:`, result.hasError, result.errorMessage);
        
        return result;
      });
      
      console.log('✅ 변환된 엑셀 데이터:', excelData);
      console.log('📊 변환된 데이터 샘플:', excelData[0]);
      
      // 콜백으로 데이터 전달
      onDataParsed(excelData);
      
    } catch (error) {
      console.error('❌ 파일 업로드 오류:', error);
      alert('파일 처리 중 오류가 발생했습니다: ' + error);
    }
  }, [onDataParsed]);

  return { handleFileUpload };
};
