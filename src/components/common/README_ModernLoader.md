# ModernLoader 사용법

## 개요
ModernLoader는 최신 트렌드에 맞는 로딩 컴포넌트로, 화면 전체를 가리지 않고 브라우저 가운데에 표시되는 모던한 디자인의 로딩 스피너입니다.

## 주요 특징
- 🎨 모던하고 세련된 디자인
- 🌈 그라데이션과 애니메이션 효과
- 📱 반응형 디자인
- 🌙 다크 모드 지원
- ♿ 접근성 고려 (애니메이션 감소 옵션)
- 🔧 다양한 크기 옵션

## 사용 방법

### 1. 전역 로딩 (권장)
```tsx
import { useGlobalLoading } from '../contexts/LoadingContext';

const MyComponent = () => {
  const { startLoading, stopLoading, setLoadingMessage } = useGlobalLoading();

  const handleApiCall = async () => {
    startLoading('데이터를 불러오는 중...');
    try {
      await fetchData();
    } finally {
      stopLoading();
    }
  };

  return (
    <button onClick={handleApiCall}>
      데이터 불러오기
    </button>
  );
};
```

### 2. 로컬 로딩
```tsx
import { useLoading } from '../hooks/useLoading';
import { ModernLoader } from '../components/common';

const MyComponent = () => {
  const { isLoading, message, startLoading, stopLoading } = useLoading('로딩 중...');

  const handleApiCall = async () => {
    startLoading('처리 중...');
    try {
      await processData();
    } finally {
      stopLoading();
    }
  };

  return (
    <div>
      {isLoading && <ModernLoader message={message} size="medium" overlay={false} />}
      <button onClick={handleApiCall}>처리하기</button>
    </div>
  );
};
```

### 3. 직접 사용
```tsx
import { ModernLoader } from '../components/common';

const MyComponent = () => {
  const [isLoading, setIsLoading] = useState(false);

  return (
    <div>
      {isLoading && (
        <ModernLoader 
          message="데이터 저장 중..." 
          size="large" 
          overlay={true} 
        />
      )}
    </div>
  );
};
```

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `message` | `string` | `'로딩 중...'` | 로딩 메시지 |
| `size` | `'small' \| 'medium' \| 'large'` | `'medium'` | 로딩 스피너 크기 |
| `overlay` | `boolean` | `true` | 전체 화면 오버레이 여부 |

## 크기별 특징

### Small
- 스피너: 16px ~ 24px
- 텍스트: 12px
- 용도: 버튼 내부, 작은 영역

### Medium (기본)
- 스피너: 24px ~ 40px
- 텍스트: 14px
- 용도: 일반적인 로딩

### Large
- 스피너: 32px ~ 48px
- 텍스트: 16px
- 용도: 전체 페이지 로딩

## 스타일링

### CSS 변수 커스터마이징
```css
:root {
  --loader-primary-color: #3b82f6;
  --loader-secondary-color: #8b5cf6;
  --loader-tertiary-color: #06b6d4;
  --loader-text-color: #374151;
  --loader-background: rgba(255, 255, 255, 0.95);
  --loader-border-radius: 16px;
}
```

### 다크 모드
```css
@media (prefers-color-scheme: dark) {
  :root {
    --loader-background: rgba(31, 41, 55, 0.95);
    --loader-text-color: #d1d5db;
  }
}
```

## 접근성

### 애니메이션 감소
```css
@media (prefers-reduced-motion: reduce) {
  .spinner-ring,
  .pulse-dot,
  .loading-text {
    animation: none;
  }
}
```

## 사용 예시

### API 호출 시
```tsx
const fetchUserData = async () => {
  startLoading('사용자 정보를 불러오는 중...');
  try {
    const response = await api.getUserData();
    setUserData(response.data);
  } catch (error) {
    console.error('Error:', error);
  } finally {
    stopLoading();
  }
};
```

### 파일 업로드 시
```tsx
const handleFileUpload = async (file: File) => {
  setLoadingMessage('파일을 업로드하는 중...');
  startLoading();
  try {
    await uploadFile(file);
    setLoadingMessage('업로드 완료!');
    setTimeout(stopLoading, 1000);
  } catch (error) {
    stopLoading();
    alert('업로드 실패');
  }
};
```

### 폼 제출 시
```tsx
const handleSubmit = async (formData: FormData) => {
  startLoading('저장 중...');
  try {
    await saveData(formData);
    setLoadingMessage('저장 완료!');
    setTimeout(stopLoading, 1000);
  } catch (error) {
    stopLoading();
    alert('저장 실패');
  }
};
```

## 주의사항

1. **전역 로딩 사용 시**: `LoadingProvider`로 앱을 감싸야 합니다.
2. **로딩 종료**: `finally` 블록에서 반드시 `stopLoading()`을 호출하세요.
3. **메시지 변경**: `setLoadingMessage()`로 로딩 중 메시지를 변경할 수 있습니다.
4. **성능**: 불필요한 리렌더링을 방지하기 위해 `useCallback`을 사용하세요.

## 마이그레이션 가이드

### 기존 BeetleLoader에서 변경
```tsx
// Before
import BeetleLoader from './BeetleLoader';
<BeetleLoader message="로딩 중..." subMessage="잠시만 기다려주세요" />

// After
import { useGlobalLoading } from '../contexts/LoadingContext';
const { startLoading, stopLoading } = useGlobalLoading();
startLoading('로딩 중...');
```
