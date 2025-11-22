# 공통 모달 시스템

이 디렉토리는 프로젝트 전체에서 사용할 수 있는 공통 모달 컴포넌트들을 포함합니다.

## 📋 컴포넌트 목록

### 1. Modal (기본 모달)
- **파일**: `Modal.tsx`, `Modal.css`
- **용도**: 모든 모달의 기본 컨테이너
- **특징**: 
  - ESC 키로 닫기
  - 오버레이 클릭으로 닫기 (옵션)
  - 3가지 크기 (small, medium, large)
  - 반응형 디자인

### 2. ValidationModal (필수입력 검증 모달)
- **파일**: `ValidationModal.tsx`, `ValidationModal.css`
- **용도**: 필수 입력 항목 누락 시 표시
- **특징**:
  - 누락된 필드명을 한글로 표시
  - 자릿수 및 입력방법 가이드
  - 예시 값 제공

### 3. ConfirmationModal (확인 모달)
- **파일**: `ConfirmationModal.tsx`, `ConfirmationModal.css`
- **용도**: 저장/수정/삭제 작업 확인
- **특징**:
  - 작업 타입별 아이콘 및 색상
  - 확인/취소 버튼
  - 커스텀 메시지 지원

### 4. UnsavedChangesModal (미저장 변경사항 모달)
- **파일**: `UnsavedChangesModal.tsx`, `UnsavedChangesModal.css`
- **용도**: 미저장 상태에서 다른 작업 시도 시 표시
- **특징**:
  - 3가지 선택지: 계속 작업, 저장 후 계속, 저장하지 않고 계속
  - 데이터 손실 방지

### 5. SuccessModal (성공 알림 모달)
- **파일**: `SuccessModal.tsx`, `SuccessModal.css`
- **용도**: 작업 완료 시 성공 알림
- **특징**:
  - 작업 타입별 아이콘 및 색상 (저장/수정/삭제)
  - 상세 정보 표시 옵션
  - 자동 닫기 애니메이션 지원

### 6. LogoutModal (로그아웃 모달)
- **파일**: `LogoutModal.css`
- **용도**: 로그아웃 확인 (기존 컴포넌트 스타일 업데이트)
- **특징**: 새로운 디자인 시스템과 일관성 유지

## 🎨 디자인 특징

### 최신 트렌드 적용
- **글래스모피즘**: `backdrop-filter: blur(8px)`
- **부드러운 애니메이션**: 페이드인, 슬라이드인, 바운스 효과
- **그라데이션 버튼**: 작업 타입별 색상 구분
- **둥근 모서리**: `border-radius: 16px`
- **그림자 효과**: 다층 박스 섀도우

### 색상 시스템
- **저장**: 초록색 그라데이션 (#10b981 → #059669)
- **수정**: 파란색 그라데이션 (#3b82f6 → #1d4ed8)
- **삭제**: 빨간색 그라데이션 (#ef4444 → #dc2626)
- **경고**: 주황색 (#f59e0b)
- **일반**: 보라색 그라데이션 (#6366f1 → #4f46e5)

### 반응형 디자인
- **데스크톱**: 고정 너비, 중앙 정렬
- **태블릿**: 최대 너비 90vw
- **모바일**: 전체 너비, 세로 버튼 배치

## 🚀 사용 방법

### 1. 기본 사용법
```tsx
import { ValidationModal, ConfirmationModal } from './common';

// 필수입력 검증
<ValidationModal
  isOpen={validationModal.isOpen}
  onClose={() => setValidationModal({ isOpen: false, errors: [] })}
  errors={validationErrors}
/>

// 저장 확인
<ConfirmationModal
  isOpen={confirmationModal.isOpen}
  onConfirm={handleConfirm}
  onCancel={handleCancel}
  type="save"
  itemName="상품"
/>

// 성공 알림
<SuccessModal
  isOpen={successModal.isOpen}
  onClose={handleClose}
  type="save"
  message="상품이 성공적으로 저장되었습니다."
  details="새로운 상품이 등록되었습니다."
  itemName="상품"
/>
```

### 2. ValidationError 타입
```tsx
interface ValidationError {
  field: string;        // 필드명
  fieldName: string;    // 한글 필드명
  message?: string;     // 커스텀 메시지
  maxLength?: number;   // 최대 길이
  inputType?: string;   // 입력 타입 가이드
  example?: string;     // 예시 값
}
```

### 3. 상태 관리 예시
```tsx
const [validationModal, setValidationModal] = useState<{
  isOpen: boolean;
  errors: ValidationError[];
}>({ isOpen: false, errors: [] });

const [confirmationModal, setConfirmationModal] = useState<{
  isOpen: boolean;
  type: 'save' | 'update' | 'delete';
  onConfirm: () => void;
}>({ isOpen: false, type: 'save', onConfirm: () => {} });
```

## 🔧 커스터마이징

### CSS 변수 오버라이드
각 모달의 CSS 파일에서 색상이나 크기를 수정할 수 있습니다.

### 새로운 모달 타입 추가
`ConfirmationModal`의 `ConfirmationType`에 새로운 타입을 추가하고 해당 스타일을 정의하면 됩니다.

## 📱 접근성

- **키보드 네비게이션**: ESC 키로 모달 닫기
- **포커스 관리**: 모달 열림/닫힘 시 포커스 이동
- **ARIA 레이블**: 스크린 리더 지원
- **색상 대비**: WCAG 2.1 AA 기준 준수

## 🎯 향후 개선사항

1. **애니메이션 라이브러리**: Framer Motion 도입 검토
2. **테마 시스템**: 라이트/다크 모드 지원
3. **다국어 지원**: i18n 시스템 연동
4. **모달 스택**: 여러 모달 동시 표시 지원
