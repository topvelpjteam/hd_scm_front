/**
 * 한글을 영문으로 변환하는 유틸리티 함수
 * 메뉴명, URL 등에서 사용
 */

// 한글-영문 매핑 사전
const koreanToEnglishMap: { [key: string]: string } = {
  '사용자': 'user',
  '관리': 'management',
  '메뉴': 'menu',
  '권한': 'permission',
  '상품': 'product',
  '발주': 'order',
  '등록': 'registration',
  '조회': 'search',
  '수정': 'edit',
  '삭제': 'delete',
  '설정': 'settings',
  '시스템': 'system',
  '마스터': 'master',
  '코드': 'code',
  '공통': 'common',
  '업무': 'business',
  '관리자': 'admin',
  '일반': 'general',
  '고객': 'customer',
  '주문': 'order',
  '결제': 'payment',
  '배송': 'delivery',
  '재고': 'inventory',
  '매출': 'sales',
  '통계': 'statistics',
  '리포트': 'report',
  '알림': 'notification',
  '메시지': 'message',
  '파일': 'file',
  '업로드': 'upload',
  '다운로드': 'download',
  '내보내기': 'export',
  '가져오기': 'import',
  '백업': 'backup',
  '복원': 'restore',
  '로그': 'log',
  '이력': 'history',
  '변경': 'change',
  '이동': 'move',
  '복사': 'copy',
  '붙여넣기': 'paste',
  '새로고침': 'refresh',
  '초기화': 'reset',
  '저장': 'save',
  '취소': 'cancel',
  '확인': 'confirm',
  '닫기': 'close',
  '열기': 'open',
  '추가': 'add',
  '제거': 'remove',
  '선택': 'select',
  '필터': 'filter',
  '정렬': 'sort',
  '그룹': 'group',
  '분류': 'category',
  '태그': 'tag',
  '라벨': 'label',
  '이름': 'name',
  '제목': 'title',
  '내용': 'content',
  '설명': 'description',
  '비고': 'remark',
  '메모': 'memo',
  '주석': 'comment',
  '날짜': 'date',
  '시간': 'time',
  '시작': 'start',
  '종료': 'end',
  '완료': 'complete',
  '진행': 'progress',
  '대기': 'waiting',
  '승인': 'approve',
  '거부': 'reject',
  '활성': 'active',
  '비활성': 'inactive',
  '사용': 'use',
  '미사용': 'unused',
  '공개': 'public',
  '비공개': 'private',
  '전체': 'all',
  '부분': 'partial',
  '상세': 'detail',
  '요약': 'summary',
  '목록': 'list',
  '보기': 'view',
  '생성': 'create',
  '복제': 'duplicate',
  '출력': 'print',
  '미리보기': 'preview',
  '불러오기': 'load',
  '첨부': 'attach',
  '복구': 'recovery',
  '구성': 'configure',
  '옵션': 'option',
  '환경': 'environment',
  '역할': 'role',
  '조직': 'organization',
  '부서': 'department',
  '팀': 'team',
  '직급': 'position',
  '직책': 'title',
  '프로젝트': 'project',
  '일정': 'schedule',
  '계획': 'plan',
  '실행': 'execute',
  '보류': 'hold',
  '재시작': 'restart',
  '업데이트': 'update',
  '동기화': 'sync',
  '연결': 'connect',
  '연동': 'integration',
  '인터페이스': 'interface',
  'API': 'api',
  '서비스': 'service',
  '모듈': 'module',
  '컴포넌트': 'component',
  '페이지': 'page',
  '화면': 'screen',
  '폼': 'form',
  '테이블': 'table',
  '그리드': 'grid',
  '차트': 'chart',
  '그래프': 'graph',
  '대시보드': 'dashboard',
  '홈': 'home',
  '메인': 'main',
  '서브': 'sub',
  '상위': 'parent',
  '하위': 'child',
  '최상위': 'root',
  '최하위': 'leaf',
  '트리': 'tree',
  '노드': 'node',
  '브랜치': 'branch',
  '레벨': 'level',
  '깊이': 'depth',
  '순서': 'order',
  '우선순위': 'priority',
  '중요도': 'importance',
  '상태': 'status',
  '타입': 'type',
  '종류': 'kind',
  '구분': 'division',
  'ID': 'id',
  '번호': 'number',
  '키워드': 'keyword',
  '검색어': 'searchterm',
  '조건': 'condition',
  '기준': 'criteria',
  '규칙': 'rule',
  '정책': 'policy',
  '절차': 'procedure',
  '프로세스': 'process',
  '워크플로우': 'workflow',
  '단계': 'step',
  '단계별': 'stepwise',
  '순차': 'sequential',
  '병렬': 'parallel',
  '동시': 'concurrent',
  '실시간': 'realtime',
  '배치': 'batch',
  '스케줄': 'schedule',
  '크론': 'cron',
  '자동': 'auto',
  '수동': 'manual',
  '즉시': 'immediate',
  '지연': 'delay',
  '예약': 'reserve',
  '경고': 'warning',
  '오류': 'error',
  '예외': 'exception',
  '실패': 'failure',
  '성공': 'success',
  '진행중': 'processing',
  '준비': 'ready',
  '중지': 'stop',
  '일시정지': 'pause',
  '재개': 'resume',
  '리셋': 'reset',
  '클리어': 'clear',
  '삽입': 'insert',
  '보정': 'correct',
  '교정': 'calibrate',
  '조정': 'adjust',
  '설치': 'install',
  '업그레이드': 'upgrade',
  '다운그레이드': 'downgrade',
  '마이그레이션': 'migration',
  '이전': 'migrate',
  '전환': 'switch',
  '교체': 'replace',
  '대체': 'substitute',
  '대신': 'instead',
  '대표': 'representative',
  '대리': 'proxy',
  '위임': 'delegate',
  '위탁': 'entrust',
  '거절': 'decline',
  '중단': 'abort',
  '정지': 'halt',
  '늦음': 'late',
  '빠름': 'fast',
  '빠른': 'quick',
  '느림': 'slow',
  '당장': 'rightnow',
  '지금': 'now',
  '현재': 'current',
  '라이브': 'live',
  '온라인': 'online',
  '오프라인': 'offline',
  '연결됨': 'connected',
  '연결안됨': 'disconnected',
  '끊어짐': 'disconnected',
  '연결실패': 'connectionfailed',
  '연결성공': 'connectionsuccess',
  '연결중': 'connecting',
  '연결시도': 'attempting',
  '재연결': 'reconnect',
  '재시도': 'retry'
};

/**
 * 한글을 영문으로 변환하는 함수
 * @param korean - 변환할 한글 문자열
 * @returns 영문으로 변환된 문자열
 */
/**
 * Google Translate를 사용한 한글-영문 변환 함수
 * @param korean - 변환할 한글 문자열
 * @returns 영문으로 변환된 문자열
 */
export const convertKoreanToEnglishWithTranslate = async (korean: string): Promise<string> => {
  if (!korean || typeof korean !== 'string') {
    return 'menu';
  }

  try {
    // Google Translate API (무료 버전) 사용
    const response = await fetch(`https://translate.googleapis.com/translate_a/single?client=gtx&sl=ko&tl=en&dt=t&q=${encodeURIComponent(korean)}`);
    const data = await response.json();
    
    if (data && data[0] && data[0][0] && data[0][0][0]) {
      const translated = data[0][0][0];
      // 번역된 결과를 URL 친화적으로 변환
      const result = translated
        .toLowerCase()
        .replace(/[^a-z0-9\s]/g, '') // 영문, 숫자, 공백만 남김
        .replace(/\s+/g, '-') // 공백을 하이픈으로
        .replace(/-+/g, '-') // 연속된 하이픈을 하나로
        .replace(/^-|-$/g, ''); // 앞뒤 하이픈 제거
      
      console.log(`Google Translate: "${korean}" -> "${result}"`);
      return result || 'menu';
    }
  } catch (error) {
    console.warn('Google Translate 실패, 로컬 매핑 사용:', error);
  }
  
  // Google Translate 실패 시 기존 로컬 매핑 사용
  return convertKoreanToEnglish(korean);
};

/**
 * 로컬 매핑을 사용한 한글-영문 변환 함수 (기존 방식)
 * @param korean - 변환할 한글 문자열
 * @returns 영문으로 변환된 문자열
 */
export const convertKoreanToEnglish = (korean: string): string => {
  if (!korean || typeof korean !== 'string') {
    return 'menu';
  }

  console.log('입력:', korean);
  
  // 공백으로 단어 분리
  const words = korean.trim().split(/\s+/);
  console.log('분리된 단어들:', words);
  
  // 각 단어를 변환
  const convertedWords = words.map(word => {
    const lowerWord = word.toLowerCase();
    console.log(`변환 중인 단어: "${lowerWord}"`);
    console.log(`매핑 사전에서 찾기:`, koreanToEnglishMap[lowerWord]);
    
    // 매핑된 단어가 있으면 변환
    if (koreanToEnglishMap[lowerWord]) {
      const converted = koreanToEnglishMap[lowerWord];
      console.log(`  -> "${converted}"`);
      return converted;
    }
    
    // 매핑되지 않은 단어는 그대로 반환 (한글 제거)
    const cleaned = lowerWord.replace(/[가-힣]/g, '').replace(/[^a-z0-9]/g, '');
    console.log(`  -> (매핑 없음) "${cleaned}"`);
    return cleaned;
  });
  
  console.log('변환된 단어들:', convertedWords);
  
  // 하이픈으로 연결하고 정리
  const result = convertedWords
    .filter(word => word.length > 0) // 빈 문자열 제거
    .join('-')
    .replace(/-+/g, '-') // 연속된 하이픈을 하나로
    .replace(/^-|-$/g, ''); // 앞뒤 하이픈 제거
  
  console.log('최종 결과:', result);
  
  return result || 'menu'; // 빈 문자열이면 기본값
};

/**
 * 테스트용 함수 - 변환 결과를 확인
 */
export const testConversion = (korean: string): void => {
  const result = convertKoreanToEnglish(korean);
  console.log(`"${korean}" -> "${result}"`);
};

/**
 * 메뉴명을 URL로 변환하는 함수
 * @param menuName - 메뉴명
 * @param parentUrl - 부모 URL (선택사항)
 * @returns 완성된 URL
 */
export const generateMenuUrl = (menuName: string, parentUrl?: string): string => {
  const englishPath = convertKoreanToEnglish(menuName);
  const url = `/${englishPath}`;
  
  if (parentUrl) {
    return `${parentUrl}${url}`;
  }
  
  return url;
};
