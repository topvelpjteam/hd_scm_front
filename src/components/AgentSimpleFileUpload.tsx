import { useCallback } from 'react';
import { ExcelDataRow } from './AgentRegistration';

interface AgentSimpleFileUploadProps {
  onDataParsed: (data: ExcelDataRow[]) => void;
}

export const useAgentSimpleFileUpload = ({ onDataParsed }: AgentSimpleFileUploadProps) => {
  const handleFileUpload = useCallback(async (file: File) => {
    console.log('📤 거래처 간단한 파일 업로드 시작:', file.name);
    
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
      
      // 거래처 등록은 브랜드 권한 체크 불필요
      console.log('📋 거래처 일괄등록 - 브랜드 권한 체크 생략');
      
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
            } else if (cleanHeader !== '거래시작일자' && cleanHeader !== '거래종료일자') {
              // 날짜 필드가 아닌 경우에만 문자열로 변환
              cellValue = String(cellValue).trim();
            }
            
            console.log(`  📝 ${cleanHeader}: "${cellValue}" (원본 타입: ${typeof row[colIndex]})`);
            
            // 거래시작일자, 거래종료일자 특별 처리 확인 및 변환
            if (cleanHeader === '거래시작일자' || cleanHeader === '거래종료일자') {
              console.log(`  📅 ${cleanHeader} 발견! 원본 값: "${originalValue}" (타입: ${originalType})`);
              
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
              
              console.log(`  📅 최종 ${cleanHeader} 값: "${cellValue}"`);
            }
            
            // 드롭다운에서 선택한 "코드 명칭" 형태의 데이터에서 코드만 추출
            if (typeof cellValue === 'string' && cellValue.includes(' ')) {
              // 거래처구분, 채널구분, 은행명 등은 코드만 추출 (브랜드 제외)
              if (['거래처구분', '채널구분', '통화구분', 'VAT여부', '로트관리여부', '은행명'].includes(cleanHeader)) {
                const originalValue = cellValue;
                cellValue = cellValue.split(' ')[0];
                console.log(`  🔧 ${cleanHeader} 코드 추출: "${originalValue}" → "${cellValue}"`);
              }
            }
            
            // 소수점반올림구분 필드 특별 처리 (Y/N 한 글자만 저장)
            if (cleanHeader === '소수점반올림구분') {
              if (typeof cellValue === 'string') {
                const originalValue = cellValue;
                // "Y 예", "N 아니오" 형태에서 첫 글자만 추출
                if (cellValue.includes(' ')) {
                  cellValue = cellValue.split(' ')[0];
                }
                // Y 또는 N이 아닌 경우 N으로 기본값 설정
                if (cellValue !== 'Y' && cellValue !== 'N') {
                  cellValue = 'N';
                }
                console.log(`  🔧 소수점반올림구분 처리: "${originalValue}" → "${cellValue}"`);
              } else if (cellValue === null || cellValue === undefined || cellValue === '') {
                cellValue = 'N'; // 값이 없을 때는 N으로 기본값 설정
                console.log(`  🔧 소수점반올림구분 기본값 설정: "${cellValue}"`);
              }
            }
            
            // 부가세구분 필드 특별 처리 (과세/면세만 허용)
            if (cleanHeader === '부가세구분') {
              if (typeof cellValue === 'string') {
                const originalValue = cellValue;
                // "과세", "면세" 형태에서 첫 글자만 추출하지 않고 전체 값 사용
                // 과세 또는 면세가 아닌 경우 과세로 기본값 설정
                if (cellValue !== '과세' && cellValue !== '면세') {
                  cellValue = '과세';
                }
                console.log(`  🔧 부가세구분 처리: "${originalValue}" → "${cellValue}"`);
              } else if (cellValue === null || cellValue === undefined || cellValue === '') {
                cellValue = '과세'; // 값이 없을 때는 과세로 기본값 설정
                console.log(`  🔧 부가세구분 기본값 설정: "${cellValue}"`);
              }
            }
            
            // 할인율 필드 특별 처리 (숫자만 허용)
            if (cleanHeader === '할인율') {
              if (typeof cellValue === 'string') {
                const originalValue = cellValue;
                // "Y", "N" 등의 잘못된 값이 들어온 경우 0으로 설정
                if (cellValue === 'Y' || cellValue === 'N' || cellValue === '예' || cellValue === '아니오') {
                  cellValue = '0';
                  console.log(`  ⚠️ 할인율에 잘못된 값 감지: "${originalValue}" → "${cellValue}"`);
                } else if (cellValue === '' || cellValue === null || cellValue === undefined) {
                  cellValue = '0'; // 값이 없을 때는 0으로 기본값 설정
                  console.log(`  🔧 할인율 기본값 설정: "${cellValue}"`);
                } else {
                  // 숫자인지 확인
                  const numValue = parseFloat(cellValue);
                  if (isNaN(numValue)) {
                    cellValue = '0';
                    console.log(`  ⚠️ 할인율 숫자 변환 실패: "${originalValue}" → "${cellValue}"`);
                  }
                }
                console.log(`  🔧 할인율 처리: "${originalValue}" → "${cellValue}"`);
              }
            }
            
            rowData[cleanHeader] = cellValue;
          }
        });
        
        console.log(`  ✅ 행 ${index + 1} 매핑 결과:`, rowData);
        
        // 필수 필드 검증
        let hasError = false;
        let errorMessage = '';
        
        const requiredFields = ['거래처명', '거래처구분', '채널구분'];
        const missingFields = requiredFields.filter(field => !rowData[field] || rowData[field].toString().trim() === '');
        
        if (missingFields.length > 0) {
          hasError = true;
          errorMessage = `필수 필드 누락: ${missingFields.join(', ')}`;
          console.log(`  ❌ 행 ${index + 1} 검증 실패:`, errorMessage);
        } else {
          console.log(`  ✅ 행 ${index + 1} 검증 성공`);
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
        console.log(`  🎯 행 ${index + 1} - 거래처명 확인:`, result.거래처명);
        console.log(`  🎯 행 ${index + 1} - 거래처구분 확인:`, result.거래처구분);
        console.log(`  🎯 행 ${index + 1} - 채널구분 확인:`, result.채널구분);
        console.log(`  🎯 행 ${index + 1} - 거래시작일자 확인:`, result.거래시작일자);
        console.log(`  🎯 행 ${index + 1} - 거래종료일자 확인:`, result.거래종료일자);
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
