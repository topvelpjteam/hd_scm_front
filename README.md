# HD Sync 프로젝트

탭 기반 UI와 상태 유지를 지원하는 종합 비즈니스 관리 웹 애플리케이션입니다.

## 기술 스택

### 프론트엔드
- **React 18.2.0** + **TypeScript 5.0.2**
- **Vite 4.4.5** (빠른 개발 환경)
- **Redux Toolkit 1.9.5** (상태 관리)
- **React Router DOM 6.8.1** (라우팅)
- **Lucide React 0.263.1** (아이콘)
- **AG-Grid Community 34.1.2** (고성능 데이터 그리드)
- **XLSX 0.18.5** + **XLSX-JS-Style 1.2.0** (Excel 파일 처리)
- **Axios 1.4.0** (HTTP 클라이언트)
- **File-Saver 2.0.5** (파일 다운로드)

### 백엔드
- **Spring Boot 3.1.0**
- **Java 17** (OpenJDK)
- **Spring Data JPA** (JPA 구현)
- **Spring Boot JDBC** (JDBC 지원)
- **MyBatis Spring Boot Starter 3.0.2** (SQL 매핑)
- **Apache POI 5.2.4** (Excel 파일 처리)
- **Spring Boot Mail** (이메일 발송)
- **MSSQL JDBC Driver** (데이터베이스 연결)
- **Lombok** (코드 간소화)
- **Spring Boot Validation** (입력 검증)

## 주요 기능

### 🎯 핵심 시스템
- ✅ **탭 기반 UI**: 메뉴 클릭 시 새 탭 생성 및 상태 유지
- ✅ **반응형 디자인**: 모던하고 직관적인 UI/UX
- ✅ **RESTful API**: 백엔드와 프론트엔드 완전 분리
- ✅ **권한 관리**: 역할 기반 메뉴 접근 제어
- ✅ **세션 관리**: 보안 강화된 로그인/로그아웃 시스템

### 📦 상품 관리
- ✅ **상품등록**: 상품 정보 등록, 수정, 삭제
- ✅ **일괄등록**: Excel 템플릿을 통한 대량 상품 등록
- ✅ **상품검색**: 팝업 기반 상품 검색 및 선택
- ✅ **가격관리**: 상품 가격 정보 관리

### 🏢 거래처 관리
- ✅ **거래처등록**: 거래처 정보 등록, 수정, 삭제
- ✅ **일괄등록**: Excel 템플릿을 통한 대량 거래처 등록
- ✅ **브랜드 관리**: 거래처별 브랜드 정보 관리

### 📋 발주 관리
- ✅ **발주등록**: 발주서 작성 및 관리
- ✅ **이전발주 조회**: 과거 발주 내역 조회
- ✅ **발주상세**: 발주 상세 항목 관리
- ✅ **클레임 관리**: 클레임 구분 및 처리

### 📊 코드 관리
- ✅ **공통코드**: 시스템 공통 코드 관리
- ✅ **코드분류**: 코드 카테고리 관리
- ✅ **코드이력**: 코드 변경 이력 추적

### 📈 대시보드
- ✅ **실시간 현황**: 주문, 재고, 매출 현황 대시보드
- ✅ **통계 정보**: 일/월별 매출 분석
- ✅ **알림 시스템**: 재고 부족, 주문 현황 알림

## 개발 환경 설정

### 1. 필수 요구사항

#### 시스템 요구사항
- **Node.js 18.0.0 이상** (프론트엔드)
- **Java 17** (OpenJDK 또는 Oracle JDK) (백엔드)
- **Maven 3.6.0 이상** (백엔드 빌드)
- **MSSQL Server 2008 이상** (데이터베이스)
- **Git** (버전 관리)

#### 권장 개발 도구
- **Visual Studio Code** (프론트엔드 개발)
- **IntelliJ IDEA** 또는 **Eclipse** (백엔드 개발)
- **SQL Server Management Studio** (데이터베이스 관리)
- **Postman** (API 테스트)

### 2. 프로젝트 클론 및 초기 설정

```bash
# 프로젝트 클론
git clone [프로젝트-저장소-URL]
cd hdsync

# 프론트엔드 의존성 설치
npm install

# 백엔드 의존성 설치 (Maven이 자동으로 처리)
cd backend
mvn clean install
cd ..
```

### 3. 프론트엔드 설정

```bash
# 개발 서버 실행 (포트 3000)
npm run dev

# TypeScript 컴파일 및 빌드
npm run build

# 린트 검사
npm run lint

# 빌드 결과 미리보기
npm run preview
```

#### 프론트엔드 주요 스크립트
- `npm run dev`: 개발 서버 실행 (Hot Reload 지원)
- `npm run build`: 프로덕션 빌드 생성
- `npm run lint`: ESLint를 통한 코드 품질 검사
- `npm run preview`: 빌드 결과 로컬 서버로 미리보기

### 4. 백엔드 설정

```bash
# 백엔드 디렉토리로 이동
cd backend

# Maven으로 의존성 다운로드 및 빌드
mvn clean install

# Spring Boot 애플리케이션 실행 (포트 8080)
mvn spring-boot:run

# 또는 JAR 파일로 실행
mvn clean package
java -jar target/hdsync-backend-0.0.1-SNAPSHOT.jar
```

#### 백엔드 주요 Maven 명령어
- `mvn clean`: 빌드 결과물 정리
- `mvn compile`: 소스 코드 컴파일
- `mvn test`: 단위 테스트 실행
- `mvn package`: JAR 파일 생성
- `mvn spring-boot:run`: Spring Boot 애플리케이션 실행

### 5. 데이터베이스 설정

#### 1. MSSQL Server 설치 및 설정
```bash
# MSSQL Server 2008 이상 설치 필요
# SQL Server Management Studio (SSMS) 설치 권장
```

#### 2. 데이터베이스 연결 정보 설정
`backend/src/main/resources/e.tx` 파일에 데이터베이스 연결 정보를 설정:

```txt
DB_Name = "HD_SALES"
Uid = "your_username"
Passwd = "your_password"
Server_Name = "your_server_ip"
port = "1433"
```

> ⚠️ **보안 주의사항**: 실제 데이터베이스 연결 정보는 보안상 README에 포함하지 않습니다. 개발 환경에 맞게 설정하세요.

#### 3. 데이터베이스 스키마 및 초기 데이터 설정
```bash
# sql-script 디렉토리의 스크립트들을 순서대로 실행
# 1. 테이블 생성: 01_table_structure.sql
# 2. 기본 데이터: 02_basic_data.sql
# 3. 샘플 데이터: 04_sample_users.sql
# 4. 기타 필요한 스크립트들
```

#### 4. 데이터베이스 연결 확인
애플리케이션 실행 후 다음 API로 연결 상태 확인:
- `GET /api/database/status` - 연결 상태 확인
- `GET /api/database/config` - 설정 정보 조회 (비밀번호 제외)
- `GET /api/test/database` - 데이터베이스 연결 테스트

#### 5. 보안 고려사항
- **e.tx 파일 보안**: 민감한 정보가 포함되어 있으므로 `.gitignore`에 추가되어 있음
- **환경별 설정**: 개발/운영 환경별로 다른 설정 파일 사용 권장
- **접근 권한**: 데이터베이스 사용자 권한을 최소한으로 제한
- **비밀번호 보호**: 실제 비밀번호는 README에 포함하지 않음
- **설정 파일 분리**: 민감한 정보는 별도 설정 파일로 관리

### 6. 개발 환경 확인

#### 애플리케이션 실행 확인
1. **백엔드 서버 실행 확인**:
   ```bash
   # 백엔드가 정상 실행되면 다음 메시지 확인
   # "Started HdsyncBackendApplication in X.XXX seconds"
   ```

2. **프론트엔드 서버 실행 확인**:
   ```bash
   # 프론트엔드가 정상 실행되면 다음 URL 접속 가능
   # http://localhost:3000
   ```

3. **API 연결 테스트**:
   ```bash
   # 브라우저에서 다음 URL 접속하여 API 응답 확인
   # http://localhost:8080/api/test/ping
   ```

#### 개발 도구 설정
- **VS Code 확장 프로그램 권장**:
  - ES7+ React/Redux/React-Native snippets
  - TypeScript Importer
  - Auto Rename Tag
  - Bracket Pair Colorizer
  - GitLens

## 프로젝트 구조

```
hdsync/
├── src/                           # 프론트엔드 소스
│   ├── components/                # React 컴포넌트
│   │   ├── ProductRegistration.tsx    # 상품등록 화면
│   │   ├── AgentRegistration.tsx      # 거래처등록 화면
│   │   ├── OrderRegistration.tsx      # 발주등록 화면
│   │   ├── Dashboard.tsx              # 대시보드
│   │   ├── CodeList.tsx               # 코드 관리
│   │   ├── CodeHistory.tsx            # 코드 이력
│   │   ├── BarcodeBook.tsx            # 바코드북 기능
│   │   ├── TabContainer.tsx           # 탭 컨테이너
│   │   ├── TabContent.tsx             # 탭 콘텐츠
│   │   ├── Sidebar.tsx                # 사이드바
│   │   ├── Header.tsx                 # 헤더
│   │   ├── Footer.tsx                 # 푸터
│   │   ├── LoginPage.tsx              # 로그인 페이지
│   │   ├── MainApp.tsx                # 메인 앱
│   │   ├── MainLayout.tsx             # 메인 레이아웃
│   │   ├── AgGridWrapper.tsx          # AG-Grid 래퍼
│   │   ├── CommonAgGrid.tsx           # 공통 그리드
│   │   ├── CommonMultiSelect.tsx      # 다중 선택
│   │   ├── CommonSingleSelect.tsx     # 단일 선택
│   │   ├── SimpleFileUpload.tsx       # 파일 업로드
│   │   ├── AgentSimpleFileUpload.tsx  # 거래처 파일 업로드
│   │   ├── LogoutModal.tsx            # 로그아웃 모달
│   │   ├── ApiTest.tsx                # API 테스트 컴포넌트
│   │   └── common/                    # 공통 컴포넌트
│   │       ├── Modal.tsx              # 기본 모달
│   │       ├── ValidationModal.tsx    # 검증 모달
│   │       ├── ConfirmationModal.tsx  # 확인 모달
│   │       ├── SuccessModal.tsx       # 성공 모달
│   │       ├── UnsavedChangesModal.tsx # 미저장 변경사항 모달
│   │       ├── ExcelPreviewModal.tsx  # Excel 미리보기 모달
│   │       ├── ExcelUploadResultModal.tsx # Excel 업로드 결과 모달
│   │       ├── BatchUploadModal.tsx   # 일괄 업로드 모달
│   │       ├── DateRangePicker.tsx    # 날짜 범위 선택기
│   │       ├── SingleDatePicker.tsx   # 단일 날짜 선택기
│   │       ├── PopupSearchModal.tsx   # 팝업 검색 모달
│   │       ├── ProductSearchModal.tsx # 상품 검색 모달
│   │       ├── AgentSearchModal.tsx   # 거래처 검색 모달
│   │       ├── LoadingSpinner.tsx     # 로딩 스피너
│   │       ├── ErrorBoundary.tsx      # 에러 바운더리
│   │       └── index.ts               # 공통 컴포넌트 export
│   ├── store/                    # Redux 상태 관리
│   │   ├── store.ts              # Redux 스토어 설정
│   │   ├── authSlice.ts          # 인증 상태
│   │   ├── tabSlice.ts           # 탭 상태
│   │   ├── tabStateSlice.ts      # 탭 상태 관리
│   │   ├── menuSlice.ts          # 메뉴 상태
│   │   ├── productRegistrationSlice.ts # 상품등록 상태
│   │   ├── agentRegistrationSlice.ts   # 거래처등록 상태
│   │   ├── codeListSlice.ts      # 코드 목록 상태
│   │   └── globalActions.ts      # 전역 액션
│   ├── services/                 # API 서비스
│   │   ├── apiClient.ts          # API 클라이언트 설정
│   │   ├── productService.ts     # 상품 서비스
│   │   ├── agentService.ts       # 거래처 서비스
│   │   ├── orderService.ts       # 발주 서비스
│   │   ├── commonCodeService.ts  # 공통코드 서비스
│   │   ├── permissionService.ts  # 권한 서비스
│   │   ├── permissionApi.ts      # 권한 API
│   │   ├── popupSearchService.ts # 팝업 검색 서비스
│   │   └── barcodeBookService.ts # 바코드북 서비스
│   ├── hooks/                    # 커스텀 훅
│   │   ├── useLoading.ts         # 로딩 훅
│   │   ├── usePermissions.ts     # 권한 훅
│   │   └── useTabState.ts        # 탭 상태 훅
│   ├── contexts/                 # React 컨텍스트
│   │   └── LoadingContext.tsx    # 로딩 컨텍스트
│   ├── utils/                    # 유틸리티
│   │   ├── menuUtils.ts          # 메뉴 유틸리티
│   │   ├── stateCleanup.ts       # 상태 정리
│   │   ├── validation.ts         # 검증 유틸리티
│   │   ├── dateUtils.ts          # 날짜 유틸리티
│   │   └── excelUtils.ts         # Excel 유틸리티
│   ├── styles/                   # 스타일 파일
│   │   ├── Header.css            # 헤더 스타일
│   │   ├── Footer.css            # 푸터 스타일
│   │   ├── Sidebar.css           # 사이드바 스타일
│   │   ├── MainLayout.css        # 메인 레이아웃 스타일
│   │   ├── TabContainer.css      # 탭 컨테이너 스타일
│   │   └── LogoutModal.css       # 로그아웃 모달 스타일
│   ├── App.tsx                   # 앱 컴포넌트
│   ├── App.css                   # 앱 스타일
│   ├── main.tsx                  # 앱 진입점
│   └── index.css                 # 전역 스타일
├── backend/                      # 백엔드 소스
│   ├── src/main/java/com/hdsync/ # Java 소스
│   │   ├── controller/           # REST 컨트롤러
│   │   │   ├── AuthController.java
│   │   │   ├── UserController.java
│   │   │   ├── ProductController.java
│   │   │   ├── AgentController.java
│   │   │   ├── OrderController.java
│   │   │   ├── CommonCodeController.java
│   │   │   ├── PermissionController.java
│   │   │   ├── MenuController.java
│   │   │   ├── PopupSearchController.java
│   │   │   ├── DatabaseController.java
│   │   │   └── TestController.java
│   │   ├── service/              # 비즈니스 로직
│   │   │   ├── AuthService.java
│   │   │   ├── UserService.java
│   │   │   ├── ProductService.java
│   │   │   ├── AgentService.java
│   │   │   ├── OrderService.java
│   │   │   ├── CommonCodeService.java
│   │   │   ├── PermissionService.java
│   │   │   ├── MenuService.java
│   │   │   ├── PopupSearchService.java
│   │   │   ├── DatabaseService.java
│   │   │   └── EmailService.java
│   │   ├── repository/           # 데이터 접근
│   │   ├── model/                # 엔티티 모델
│   │   ├── dto/                  # 데이터 전송 객체
│   │   ├── config/               # 설정
│   │   └── mapper/               # MyBatis 매퍼
│   ├── src/main/resources/       # 리소스 파일
│   │   ├── application.yml       # 애플리케이션 설정
│   │   ├── e.tx                  # 데이터베이스 연결 정보
│   │   └── mapper/               # MyBatis XML 매퍼
│   ├── target/                   # 빌드 결과물
│   └── pom.xml                   # Maven 설정
├── docs/                         # 프로젝트 문서
│   ├── HD_Sync_종합_개발_가이드.md
│   ├── 거래처등록_기술구현_가이드.md
│   ├── 거래처등록_트러블슈팅_가이드.md
│   ├── 기능개발.md
│   └── 바코드책_기능개발_성공사례.md
├── sql-script/                   # 데이터베이스 스크립트
│   ├── old_data/                 # 기존 데이터 스크립트
│   ├── hd_sales_data/            # HD_SALES 데이터
│   └── *.sql                     # 각종 SQL 스크립트
├── 작업내역/                     # 작업 내역 문서
│   └── 2025-09-08_작업내역.txt
├── public/                       # 정적 파일
│   └── images/                   # 이미지 파일
├── dist/                         # 빌드 결과물
├── node_modules/                 # Node.js 의존성
├── package.json                  # 프론트엔드 의존성
├── package-lock.json             # 의존성 잠금 파일
├── tsconfig.json                 # TypeScript 설정
├── tsconfig.node.json            # Node.js TypeScript 설정
├── vite.config.ts                # Vite 설정
├── start-dev.bat                 # 개발 서버 실행 배치 파일
├── 서버실행.txt                  # 서버 실행 가이드
├── 상품일괄등록_템플릿 (12).xlsx  # Excel 템플릿
└── README.md                     # 프로젝트 문서
```

## 사용법

### 1. 애플리케이션 실행

1. **백엔드 실행**:
   ```bash
   cd backend
   mvn spring-boot:run
   ```

2. **프론트엔드 실행**:
   ```bash
   npm run dev
   ```

3. **브라우저에서 접속**: `http://localhost:3000`

### 2. 로그인 시스템

#### 로그인 화면
- 최신 디자인의 로그인 화면이 첫 화면으로 표시됩니다
- 그라데이션 배경과 애니메이션 효과
- 반응형 디자인 지원 (모바일, 태블릿, 데스크톱)
- 다크 모드 자동 지원

#### 테스트 계정
- **시스템 관리자**: `admin` / `admin123!`
- **일반 관리자**: `manager1` / `manager123!`
- **일반 사용자**: `user1` / `user123!`
- **매장 직원**: `store1` / `store123!`
- **거래업체**: `partner1` / `partner123!`

#### 보안 기능
- 로그인 시도 횟수 추적 (5회 실패 시 계정 잠금)
- 비밀번호 표시/숨김 토글
- 로그인 상태 유지 옵션
- 세션 관리 및 자동 로그아웃
- 로그인 히스토리 기록

#### 로그인 성공 후
- 메인 애플리케이션으로 자동 이동
- 사용자 정보 표시 (이름, 역할)
- 로그아웃 기능
- 탭 기반 UI 시스템

### 3. 탭 사용법

- **새 탭 생성**: 왼쪽 사이드바의 메뉴 클릭
- **탭 전환**: 탭 헤더 클릭
- **탭 닫기**: 탭의 X 버튼 클릭
- **상태 유지**: 탭 간 이동 시 입력한 데이터가 보존됨

### 4. API 엔드포인트

#### 🔐 인증 및 권한 관리
- `POST /api/auth/login` - 사용자 로그인
- `POST /api/auth/logout` - 사용자 로그아웃
- `POST /api/auth/validate-session` - 세션 유효성 검증
- `GET /api/permissions/user/{userId}/menu/{menuId}` - 사용자 메뉴 권한 조회
- `GET /api/menus/user/{userId}` - 사용자별 메뉴 목록 조회

#### 👥 사용자 관리
- `GET /api/users` - 모든 사용자 조회
- `GET /api/users/{id}` - 특정 사용자 조회
- `POST /api/users` - 새 사용자 생성
- `PUT /api/users/{id}` - 사용자 정보 수정
- `DELETE /api/users/{id}` - 사용자 삭제

#### 📦 상품 관리
- `GET /api/products` - 상품 목록 조회
- `GET /api/products/{id}` - 상품 상세 조회
- `POST /api/products` - 상품 등록
- `PUT /api/products/{id}` - 상품 수정
- `DELETE /api/products/{id}` - 상품 삭제
- `POST /api/products/batch-upload` - 상품 일괄 등록
- `GET /api/products/search` - 상품 검색

#### 🏢 거래처 관리
- `GET /api/agents` - 거래처 목록 조회
- `GET /api/agents/{id}` - 거래처 상세 조회
- `POST /api/agents` - 거래처 등록
- `PUT /api/agents/{id}` - 거래처 수정
- `DELETE /api/agents/{id}` - 거래처 삭제
- `POST /api/agents/batch-upload` - 거래처 일괄 등록
- `GET /api/agents/brands` - 브랜드 목록 조회

#### 📋 발주 관리
- `GET /api/orders` - 발주 목록 조회
- `POST /api/orders/previous` - 이전 발주 정보 조회
- `POST /api/orders/master` - 발주 마스터 저장
- `GET /api/orders/{id}` - 발주 상세 조회
- `POST /api/orders` - 발주 등록
- `PUT /api/orders/{id}` - 발주 수정

#### 📊 공통 코드 관리
- `GET /api/common/codes` - 공통 코드 목록 조회
- `GET /api/common/claim-gbn` - 클레임 구분 코드 조회
- `GET /api/common/brand-gbn` - 브랜드 구분 코드 조회
- `GET /api/common/categories` - 코드 카테고리 조회

#### 🔍 팝업 검색
- `POST /api/popup/products` - 상품 팝업 검색
- `POST /api/popup/agents` - 거래처 팝업 검색

#### 🗄️ 데이터베이스 관리
- `GET /api/database/status` - 데이터베이스 연결 상태 확인
- `GET /api/database/config` - 데이터베이스 설정 정보 조회

#### 🧪 API 테스트
- `GET /api/test/ping` - 서버 연결 테스트
- `POST /api/test/echo` - POST 요청 테스트
- `GET /api/test/database` - 데이터베이스 연결 테스트
- `GET /api/test/users` - 사용자 목록 조회 테스트
- `GET /api/test/error` - 에러 처리 테스트

## 개발 가이드

### 프론트엔드 개발

1. **새 컴포넌트 추가**:
   - `src/components/` 디렉토리에 컴포넌트 생성
   - `TabContent.tsx`에 컴포넌트 매핑 추가

2. **상태 관리**:
   - Redux Toolkit 사용
   - `src/store/tabSlice.ts`에서 탭 상태 관리

3. **스타일링**:
   - CSS 모듈 또는 인라인 스타일 사용
   - `src/index.css`에서 전역 스타일 정의

### 백엔드 개발

1. **새 엔티티 추가**:
   - `model/` 패키지에 엔티티 클래스 생성
   - `repository/` 패키지에 리포지토리 인터페이스 생성
   - `service/` 패키지에 서비스 클래스 생성
   - `controller/` 패키지에 REST 컨트롤러 생성

2. **데이터베이스 마이그레이션**:
   - JPA의 `ddl-auto: update` 사용
   - 필요시 수동으로 SQL 스크립트 실행

## 🚀 최근 개발 성과

### 📅 2025-09-08 주요 업데이트

#### 발주등록 시스템 고도화
- ✅ **클레임 컬럼 데이터 바인딩**: 클레임 구분 코드 API 엔드포인트 추가 및 정상 작동
- ✅ **체크박스 선택 로직 개선**: 개별/전체 선택 기능 완벽 구현
- ✅ **상품검색 자동 추가**: 검색 결과 1건 시 자동으로 디테일 그리드에 추가
- ✅ **성능 최적화**: GPU 가속 애니메이션 및 리플로우 방지로 부드러운 UI 구현
- ✅ **가독성 개선**: 모든 텍스트 색상을 순수한 검은색(#000000)으로 통일

#### 기술적 개선사항
- ✅ **백엔드 API 확장**: `/api/common/claim-gbn` 엔드포인트 추가
- ✅ **행 식별자 로직 강화**: `id`, `productCode`, `goodsId`, `GOODS_ID` 다중 지원
- ✅ **중복 상품 체크 개선**: 상품코드 + 상품명 + 브랜드명 조합으로 정확한 중복 감지
- ✅ **TypeScript 타입 안전성**: PopupSearchResult 타입 에러 완전 해결
- ✅ **디버깅 로그 강화**: 문제 추적 및 해결을 위한 상세 로그 추가

### 상품등록 시스템 구축
- ✅ **완전한 CRUD 기능**: 상품 정보 등록, 수정, 삭제, 조회
- ✅ **일괄등록 시스템**: Excel 템플릿을 통한 대량 상품 등록
- ✅ **권한 관리**: 버튼별 세밀한 권한 제어 시스템
- ✅ **상품코드 검증**: 영문대문자, 숫자, 특수문자만 허용하는 입력 검증
- ✅ **데이터 검증**: 실시간 유효성 검사 및 오류 처리
- ✅ **상품검색**: 팝업 기반 상품 검색 및 선택 기능

### 거래처등록 시스템 구축
- ✅ **완전한 CRUD 기능**: 거래처 정보 등록, 수정, 삭제, 조회
- ✅ **일괄등록 시스템**: Excel 템플릿을 통한 대량 거래처 등록
- ✅ **중복체크 로직**: 거래처명, 사업자등록번호 기준 중복 확인
- ✅ **SuccessModal**: 변경사항 추적 및 표시 기능
- ✅ **데이터 포맷팅**: 숫자 필드 콤마 처리 및 사용자 친화적 표시
- ✅ **브랜드 관리**: 거래처별 브랜드 정보 관리

### 발주등록 기능 고도화
- ✅ **클레임 관리**: 클레임 구분 코드 시스템 구축
- ✅ **체크박스 선택**: 개선된 그리드 선택 로직
- ✅ **자동 추가**: 상품 검색 결과 1건 시 자동 추가
- ✅ **성능 최적화**: GPU 가속 애니메이션 및 리플로우 방지
- ✅ **가독성 개선**: 폰트 색상 최적화
- ✅ **상품코드 + 순번 기반 고유라인 인식**: 정확한 라인 식별 시스템
- ✅ **저장 완료 플래그(책갈피) 시스템**: 저장 완료 시점의 상태 보존

### 🎯 핵심 성공 요인
1. **참조 기반 개발**: 기존 성공 사례를 참조하여 일관성 유지
2. **단계별 검증**: 각 기능별 독립 테스트 및 사용자 피드백 반영
3. **데이터 일관성**: 철저한 데이터 검증 및 오류 처리
4. **사용자 중심 설계**: 직관적인 UI/UX 및 빠른 응답성
5. **모듈화된 구조**: 재사용 가능한 컴포넌트 설계
6. **성능 최적화**: GPU 가속 및 리플로우 방지 기법 적용
7. **디버깅 친화적**: 상세한 로그로 문제 추적 및 해결 지원

## 📊 프로젝트 현황

### 구현 완료 기능
- ✅ **인증 시스템**: 로그인/로그아웃, 세션 관리, 권한 제어
- ✅ **상품 관리**: CRUD, 일괄등록, 검색, 가격 관리
- ✅ **거래처 관리**: CRUD, 일괄등록, 브랜드 관리
- ✅ **발주 관리**: 발주서 작성, 이전발주 조회, 클레임 관리
- ✅ **코드 관리**: 공통코드, 코드분류, 코드이력
- ✅ **대시보드**: 실시간 현황, 통계, 알림 시스템
- ✅ **탭 시스템**: 다중 탭, 상태 유지, 히스토리 관리

### 개발 중인 기능
- 🔄 **주문 관리**: 주문 생성, 상태 관리, 배송 처리
- 🔄 **매출 분석**: 일/월별 매출 통계, 분석 리포트
- 🔄 **재고 관리**: 재고 현황, 알림, 리포트

## 문제 해결

### 🚨 일반적인 문제 및 해결방법

#### 1. 포트 충돌 문제
**문제**: 포트가 이미 사용 중이어서 서버가 시작되지 않음
```bash
# 에러 메시지 예시
Error: listen EADDRINUSE: address already in use :::3000
```

**해결방법**:
- **프론트엔드 포트 변경**: `vite.config.ts`에서 포트 변경
  ```typescript
  export default defineConfig({
    server: {
      port: 3001, // 3000 → 3001로 변경
    }
  })
  ```
- **백엔드 포트 변경**: `backend/src/main/resources/application.yml`에서 포트 변경
  ```yaml
  server:
    port: 8081  # 8080 → 8081로 변경
  ```
- **프로세스 종료**: 사용 중인 포트의 프로세스 강제 종료
  ```bash
  # Windows
  netstat -ano | findstr :3000
  taskkill /PID [PID번호] /F
  
  # macOS/Linux
  lsof -ti:3000 | xargs kill -9
  ```

#### 2. 데이터베이스 연결 실패
**문제**: 백엔드에서 데이터베이스 연결 오류 발생
```bash
# 에러 메시지 예시
Connection refused: connect
Login failed for user 'hdagent'
```

**해결방법**:
1. **MSSQL 서비스 상태 확인**:
   ```bash
   # Windows 서비스에서 SQL Server 서비스가 실행 중인지 확인
   services.msc
   ```

2. **연결 정보 확인**: `backend/src/main/resources/e.tx` 파일 검증
   ```txt
   DB_Name = "HD_SALES"
   Uid = "your_username"
   Passwd = "your_password"
   Server_Name = "your_server_ip"
   port = "1433"
   ```

3. **방화벽 설정**: 1433 포트가 열려있는지 확인
4. **SQL Server 인증 모드**: 혼합 인증 모드로 설정 확인

#### 3. CORS 오류
**문제**: 브라우저에서 CORS 정책 위반 오류
```bash
# 에러 메시지 예시
Access to XMLHttpRequest at 'http://localhost:8080/api/...' from origin 'http://localhost:3000' has been blocked by CORS policy
```

**해결방법**:
1. **백엔드 CORS 설정 확인**: 컨트롤러에 `@CrossOrigin` 어노테이션 확인
2. **프록시 설정 확인**: `vite.config.ts`의 프록시 설정 확인
   ```typescript
   proxy: {
     '/api': {
       target: 'http://localhost:8080',
       changeOrigin: true
     }
   }
   ```

#### 4. TypeScript 컴파일 오류
**문제**: TypeScript 타입 오류로 빌드 실패
```bash
# 에러 메시지 예시
Type 'string' is not assignable to type 'number'
Property 'xxx' does not exist on type 'yyy'
```

**해결방법**:
1. **타입 정의 확인**: 인터페이스와 실제 데이터 구조 일치 확인
2. **타입 단언 사용**: `as` 키워드로 타입 강제 변환
3. **옵셔널 체이닝**: `?.` 연산자로 안전한 접근
4. **ESLint 규칙 확인**: `npm run lint`로 코드 품질 검사

#### 5. AG-Grid 관련 문제
**문제**: 그리드에서 체크박스 선택이 정상 작동하지 않음

**해결방법**:
1. **행 식별자 확인**: `getRowId` 함수가 올바른 고유값 반환하는지 확인
2. **체크박스 상태 동기화**: `onSelectionChanged` 이벤트 핸들러 확인
3. **데이터 구조 확인**: 그리드 데이터에 필요한 필드가 포함되어 있는지 확인

#### 6. Redux 상태 관리 문제
**문제**: 상태가 예상대로 업데이트되지 않음

**해결방법**:
1. **Redux DevTools 사용**: 브라우저 확장 프로그램으로 상태 변화 추적
2. **불변성 확인**: 상태 업데이트 시 새로운 객체 생성 확인
3. **액션 타입 확인**: 액션 타입이 올바르게 정의되어 있는지 확인

#### 7. Excel 파일 업로드 문제
**문제**: Excel 파일 업로드 시 오류 발생

**해결방법**:
1. **파일 형식 확인**: `.xlsx` 형식인지 확인
2. **템플릿 형식 확인**: 제공된 템플릿과 동일한 구조인지 확인
3. **파일 크기 확인**: 너무 큰 파일은 분할하여 업로드
4. **네트워크 상태 확인**: 업로드 중 네트워크 연결 상태 확인

### 🔧 개발 도구 활용

#### 브라우저 개발자 도구
- **Console**: JavaScript 오류 및 로그 확인
- **Network**: API 요청/응답 상태 확인
- **Application**: LocalStorage, SessionStorage 상태 확인
- **Elements**: DOM 구조 및 CSS 스타일 확인

#### VS Code 확장 프로그램
- **ES7+ React/Redux/React-Native snippets**: 코드 자동 완성
- **TypeScript Importer**: 자동 import 관리
- **Auto Rename Tag**: HTML 태그 자동 이름 변경
- **Bracket Pair Colorizer**: 괄호 색상 구분
- **GitLens**: Git 히스토리 및 변경사항 추적

### 📞 추가 지원

문제가 지속될 경우:
1. **로그 확인**: 브라우저 콘솔과 백엔드 로그 확인
2. **문서 참조**: `docs/` 디렉토리의 기술 가이드 참조
3. **작업내역 확인**: `작업내역/` 디렉토리의 이전 해결 사례 참조
4. **API 테스트**: `http://localhost:8080/api/test/ping`으로 서버 연결 확인

## 📚 추가 문서

### 📖 기술 문서
- [HD Sync 종합 개발 가이드](docs/HD_Sync_종합_개발_가이드.md) - 전체 시스템 아키텍처 및 개발 가이드
- [거래처등록 기술구현 가이드](docs/거래처등록_기술구현_가이드.md) - 거래처등록 기능 구현 상세 가이드
- [거래처등록 트러블슈팅 가이드](docs/거래처등록_트러블슈팅_가이드.md) - 거래처등록 관련 문제 해결 가이드
- [바코드책 기능개발 성공사례](docs/바코드책_기능개발_성공사례.md) - 바코드북 기능 개발 사례
- [기능개발 가이드](docs/기능개발.md) - 일반적인 기능 개발 가이드

### 📋 작업 내역
- [2025-09-08 작업내역](작업내역/2025-09-08_작업내역.txt) - 발주등록 시스템 고도화 작업 내역

### 🗄️ 데이터베이스 관련
- [SQL 스크립트 모음](sql-script/) - 데이터베이스 스키마 및 샘플 데이터
- [기존 데이터 스크립트](sql-script/old_data/) - 레거시 데이터 마이그레이션 스크립트
- [HD_SALES 데이터](sql-script/hd_sales_data/) - 실제 운영 데이터 샘플

### 🛠️ 개발 도구 및 설정
- [서버 실행 가이드](서버실행.txt) - 서버 실행 방법 상세 가이드
- [Excel 템플릿](상품일괄등록_템플릿%20(12).xlsx) - 상품 일괄등록용 Excel 템플릿
- [개발 서버 실행 배치 파일](start-dev.bat) - Windows용 개발 서버 자동 실행 스크립트

## 🔒 보안 가이드

### 민감한 정보 관리
- **데이터베이스 연결 정보**: `backend/src/main/resources/e.tx` 파일에 실제 연결 정보 저장
- **환경 변수**: 가능한 경우 환경 변수 사용 권장
- **버전 관리**: 민감한 정보는 Git에 커밋하지 않음 (`.gitignore` 설정됨)
- **문서화**: README에는 예시 값만 포함, 실제 값은 별도 관리

### 개발 환경 보안 체크리스트
- [ ] `e.tx` 파일이 `.gitignore`에 포함되어 있는지 확인
- [ ] 실제 데이터베이스 비밀번호가 README에 노출되지 않았는지 확인
- [ ] 개발/운영 환경별로 다른 설정 파일 사용
- [ ] 데이터베이스 사용자 권한을 최소한으로 제한
- [ ] API 응답에서 민감한 정보 제외

## 라이선스

이 프로젝트는 MIT 라이선스 하에 배포됩니다.
