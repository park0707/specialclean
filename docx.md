> **프로젝트 개요**  
> 특수 청소가 필요한 사용자와 전문 업체를 연결하는 중개 플랫폼 (클린 매칭 서비스).  
> React 18 + TypeScript + Firebase(Auth/Firestore) + TanStack Router + Tailwind CSS + Vite 스택으로 구성됩니다.

---

## 목차

1. [프로젝트 구조 개요](#프로젝트-구조-개요)
2. [전역 상태(Context) 사용 가이드](#전역-상태context-사용-가이드)
3. [환경변수 사용 현황](#환경변수-사용-현황)
4. [외부 API 의존성](#외부-api-의존성)
5. [필터 로직 동작 조건](#필터-로직-동작-조건)
6. [핵심 타입 및 인터페이스 정의](#핵심-타입-및-인터페이스-정의)
7. [파일별 상세 문서](#파일별-상세-문서)

---

## 프로젝트 구조 개요

```
specialclean/
├── index.html
├── vite.config.ts
├── tsconfig*.json
├── package.json
├── firebase.json / .firebaserc
├── public/
│   └── images/로고.png
└── src/
    ├── main.tsx                     # 앱 진입점
    ├── App.tsx                      # 루트 레이아웃 컴포넌트
    ├── index.css                    # 전역 스타일
    ├── logincontext.tsx             # Firebase Auth 전역 Context
    ├── searchcontext.tsx            # 검색/필터 전역 Context
    ├── footer.tsx                   # 공통 푸터
    ├── routes/
    │   ├── routes.tsx               # TanStack Router 라우트 정의
    │   └── home.tsx                 # 홈 페이지 컴포넌트
    ├── home_parts/
    │   ├── header.tsx               # 홈 헤더 (로고 + 메뉴)
    │   ├── body.tsx                 # 홈 바디 (검색박스 + 태그필터 + 업체목록)
    │   ├── searchbox.tsx            # 텍스트 검색 컴보박스
    │   ├── tags.tsx                 # 필터 탭 (지역/서비스/업체특성)
    │   ├── LocationSearchInput.tsx  # 카카오 주소 자동완성 입력
    │   ├── BusinessList.tsx         # 업체 목록 + 카드 렌더링
    │   ├── mymenu.tsx               # 우측 상단 드롭다운 메뉴
    │   └── menu_parts/
    │       ├── login.tsx            # 로그인 다이얼로그
    │       ├── signup.tsx           # 회원가입 다이얼로그
    │       ├── signuplogic.ts       # 회원가입 유효성 검사 커스텀 훅
    │       ├── mypage.tsx           # 마이페이지
    │       ├── ChangePasswordDialog.tsx   # 비밀번호 변경 다이얼로그
    │       ├── ForgotPasswordDialog.tsx   # 비밀번호 찾기 다이얼로그
    │       └── info_parts/
    │           ├── info.tsx         # /info 라우트 레이아웃
    │           ├── about.tsx        # 사이트 소개 콘텐츠
    │           ├── contact.tsx      # 문의하기 + 업체 신청 진입점
    │           ├── application.tsx  # 업체 등록 신청 폼
    │           ├── privacypolicy.tsx    # 개인정보처리방침
    │           └── termsofservice.tsx   # 서비스 이용약관
    └── lib/
        ├── firebase.ts          # Firebase 초기화 및 인스턴스 export
        ├── firebaseuser.ts      # Firestore 유저 문서 동기화
        ├── geocode.ts           # 카카오 로컬 API (주소 검색, 거리 계산)
        ├── regionNormalize.ts   # 시/도명 정규화 매핑
        ├── regions.ts           # 전국 시/도 목록 상수
        ├── filterBusinesses.ts  # 업체 필터링 순수 함수 모음
        └── companyFormOptions.ts # 서비스 카테고리 & 태그 상수 데이터
```

---

## 전역 상태(Context) 사용 가이드

프로젝트에는 두 개의 전역 Context가 존재합니다.

### Provider 계층 구조

```
RouterProvider
  └── App (루트 컴포넌트)
        ├── AuthProvider        ← 인증 상태 (외부)
        │   └── SearchProvider  ← 검색/필터 상태 (내부)
        │       └── Outlet (각 페이지)
        └── Footer
```

> **중요:** `SearchProvider`는 `AuthProvider` 안에 위치합니다.  
> `SearchContext`에서 `AuthContext`를 참조할 경우를 대비한 구조입니다.  
> 반대 방향(AuthProvider 안에서 SearchContext 사용)은 불가합니다.

### AuthContext (`logincontext.tsx`)

| 값 | 타입 | 설명 |
|---|---|---|
| `user` | `User \| null` | Firebase Auth 유저 객체 |
| `appUser` | `AppUser \| null` | Firestore에 저장된 앱 전용 유저 정보 |
| `loading` | `boolean` | 인증 상태 로딩 중 여부 |
| `isAdmin` | `boolean` | `appUser.role === 'admin'` 여부 |

**사용법:**
```tsx
import { useAuth } from '../logincontext';
const { user, isAdmin, loading } = useAuth();
```

**주의:** `useAuth()`는 반드시 `<AuthProvider>` 하위 컴포넌트에서만 호출해야 합니다.

### SearchContext (`searchcontext.tsx`)

| 값 | 타입 | 설명 |
|---|---|---|
| `query` | `string` | 텍스트 검색어 |
| `locationQuery` | `string` | 사용자가 입력한 주소 원문 |
| `locationResult` | `GeoResult \| null` | 카카오 API로 확정된 위치 결과 |
| `selectedServices` | `string[]` | 선택된 서비스 종류 목록 |
| `selectedTags` | `string[]` | 선택된 업체 특성 태그 목록 |
| `resetFilters()` | `() => void` | 모든 필터 초기화 |

**사용법:**
```tsx
import { useSearch } from '../searchcontext';
const { selectedServices, setSelectedServices, resetFilters } = useSearch();
```

---

## 환경변수 사용 현황

`.env` 파일에 아래 변수를 모두 설정해야 합니다.

| 환경변수 | 사용 파일 | 용도 |
|---|---|---|
| `VITE_FIREBASE_API_KEY` | `src/lib/firebase.ts` | Firebase 프로젝트 API 키 |
| `VITE_FIREBASE_AUTH_DOMAIN` | `src/lib/firebase.ts` | Firebase Auth 도메인 |
| `VITE_FIREBASE_PROJECT_ID` | `src/lib/firebase.ts` | Firebase 프로젝트 ID |
| `VITE_FIREBASE_STORAGE_BUCKET` | `src/lib/firebase.ts` | Firebase Storage 버킷 |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | `src/lib/firebase.ts` | FCM Sender ID |
| `VITE_FIREBASE_APP_ID` | `src/lib/firebase.ts` | Firebase 앱 ID |
| `VITE_FIREBASE_MEASUREMENT_ID` | `src/lib/firebase.ts` | Firebase Analytics 측정 ID |
| `VITE_KAKAO_REST_API_KEY` | `src/lib/geocode.ts` | 카카오 로컬 REST API 키 |
| `VITE_EMAILJS_SERVICE_ID` | `src/home_parts/menu_parts/info_parts/application.tsx`, `contact.tsx` | EmailJS 서비스 ID |
| `VITE_EMAILJS_TEMPLATE_ID` | `src/home_parts/menu_parts/info_parts/contact.tsx` | EmailJS 문의 이메일 템플릿 ID |
| `VITE_EMAILJS_TEMPLATE2_ID` | `src/home_parts/menu_parts/info_parts/application.tsx` | EmailJS 업체 신청 이메일 템플릿 ID |
| `VITE_EMAILJS_PUBLIC_KEY` | `src/home_parts/menu_parts/info_parts/application.tsx`, `contact.tsx` | EmailJS 공개 키 |

---

## 외부 API 의존성

### Firebase (Google)

| 서비스 | 사용 파일 | 용도 |
|---|---|---|
| **Firebase Auth** | `firebase.ts`, `logincontext.tsx`, `login.tsx`, `signup.tsx`, `ChangePasswordDialog.tsx`, `ForgotPasswordDialog.tsx`, `mymenu.tsx` | 이메일/Google 로그인, 회원가입, 비밀번호 변경/재설정, 이메일 인증 |
| **Firestore** | `firebase.ts`, `firebaseuser.ts`, `BusinessList.tsx`, `application.tsx` | 유저 문서 동기화, 업체 목록 조회, 업체 신청 저장 |
| **Analytics** | `firebase.ts` | 웹 분석 (초기화만, 직접 사용 없음) |

**Firestore 컬렉션 구조:**
- `users/{uid}` — AppUser 문서 (`uid`, `email`, `role`)
- `businessApplications/{docId}` — 업체 신청/등록 문서 (`status: 'submitted' | 'approved'` 등)

### 카카오 로컬 API

| 엔드포인트 | 사용 파일 | 용도 |
|---|---|---|
| `dapi.kakao.com/v2/local/search/address.json` | `src/lib/geocode.ts` | 도로명·지번 주소 검색 (1차) |
| `dapi.kakao.com/v2/local/search/keyword.json` | `src/lib/geocode.ts` | 건물명·아파트명 키워드 검색 (2차 fallback) |

### EmailJS

| 템플릿 | 사용 파일 | 용도 |
|---|---|---|
| `VITE_EMAILJS_TEMPLATE_ID` | `contact.tsx` | 사용자 문의 이메일 전송 |
| `VITE_EMAILJS_TEMPLATE2_ID` | `application.tsx` | 업체 등록 신청 접수 알림 이메일 전송 |

---

## 필터 로직 동작 조건

`src/lib/filterBusinesses.ts`의 `applyAllFilters()`가 아래 순서로 필터를 적용합니다.

```
filterByLocation → filterByServices → filterByTags → filterByText
```

| 필터 | 미선택 시 | 적용 조건 | 논리 연산 |
|---|---|---|---|
| 위치 (`locationResult`) | 전체 반환 | GeoResult가 null이 아닐 때 | — |
| 서비스 종류 (`selectedServices`) | 전체 반환 | 배열 length > 0 | **OR** (하나라도 포함) |
| 업체 특성 태그 (`selectedTags`) | 전체 반환 | 배열 length > 0 | **AND** (모두 포함) |
| 텍스트 검색 (`query`) | 전체 반환 | 공백 제거 후 length > 0 | name 또는 shortDescription 포함 |

**위치 필터 세부 동작:**

| coverageType | 통과 조건 |
|---|---|
| `nationwide` | 항상 통과 |
| `regional` | `coverageSido` 배열에 `loc.sido` 포함 |
| `radius` | `getDistanceKm(loc, biz.geoPoint) <= biz.serviceRadiusKm` |

> **서비스 필터는 OR, 태그 필터는 AND** 임에 주의하세요.  
> 새 필터 추가 시 이 규칙을 준수하거나, 변경 이유를 문서에 기록하세요.

---

## 핵심 타입 및 인터페이스 정의

| 타입/인터페이스 | 정의 파일 | 설명 |
|---|---|---|
| `AppUser` | `src/lib/firebaseuser.ts` | Firestore에 저장되는 유저 정보 (`uid`, `email`, `role`) |
| `AuthContextType` | `src/logincontext.tsx` | AuthContext 값 타입 |
| `SearchState` / `SearchContextValue` | `src/searchcontext.tsx` | SearchContext 상태 및 setter 타입 |
| `GeoPoint` | `src/lib/geocode.ts` | 위도/경도 좌표 (`lat`, `lng`) |
| `GeoResult` | `src/lib/geocode.ts` | 주소 검색 결과 (`lat`, `lng`, `sido`, `fullAddress`) |
| `Business` | `src/lib/filterBusinesses.ts` | 업체 Firestore 문서 타입 (전체 필드 정의) |
| `ServiceCategory` | `src/lib/companyFormOptions.ts` | 서비스 카테고리 (`category`, `items`) |
| `TagGroup` | `src/lib/companyFormOptions.ts` | 태그 그룹 (`group`, `description`, `tags`) |
| `Sido` | `src/lib/regions.ts` | `SIDO_LIST`에서 추출된 시/도 union 타입 |
| `CoverageType` | `src/home_parts/menu_parts/info_parts/application.tsx` | `'nationwide' | 'regional' | 'radius'` |

---

## 파일별 상세 문서

---

### `src/main.tsx`

**간단 요약:** 앱의 최초 진입점. React DOM 렌더링과 TanStack Router 연결을 담당합니다.

| 항목 | 내용 |
|---|---|
| **위치** | `src/main.tsx` |
| **사용하는 파일** | `src/routes/routes.tsx` (router 인스턴스), `src/index.css` |
| **이 파일을 사용하는 파일** | 없음 (최상위 진입점) |

**제공하는 기능:**
- `createRoot()`로 `#root` DOM 노드에 앱을 마운트
- `<RouterProvider router={router}>`로 TanStack Router 활성화
- `<StrictMode>` 래핑으로 개발 시 이중 렌더링 경고 활성화

---

### `src/App.tsx`

**간단 요약:** 모든 페이지의 공통 레이아웃 셸. 전역 Provider 2개를 마운트하고 `<Outlet />`으로 자식 라우트를 렌더링합니다.

| 항목 | 내용 |
|---|---|
| **위치** | `src/App.tsx` |
| **사용하는 파일** | `src/logincontext.tsx`, `src/searchcontext.tsx`, `src/footer.tsx` |
| **이 파일을 사용하는 파일** | `src/routes/routes.tsx` (rootRoute의 component) |

**제공하는 기능:**
- `AuthProvider` → `SearchProvider` 순으로 전역 상태 제공
- `<Outlet />`을 통해 현재 라우트 컴포넌트를 렌더링
- `<Footer />`를 페이지 하단에 항상 표시 (`flex-col`, `min-h-screen` 레이아웃)

**구현 방법:**
```tsx
// Provider 래핑 구조
<AuthProvider>
  <SearchProvider>
    <Outlet />  {/* 현재 라우트의 컴포넌트가 여기 렌더링됨 */}
  </SearchProvider>
</AuthProvider>
```

---

### `src/index.css`

**간단 요약:** Tailwind CSS 디렉티브와 전역 폰트(`logo_text`) 커스텀 스타일을 정의합니다.

| 항목 | 내용 |
|---|---|
| **위치** | `src/index.css` |
| **사용하는 파일** | 없음 |
| **이 파일을 사용하는 파일** | `src/main.tsx` |

**제공하는 기능:**
- Tailwind CSS 전역 주입 (`@tailwind base/components/utilities`)
- `.logo_text` 커스텀 클래스: 로고 텍스트 전용 폰트 스타일

---

### `src/logincontext.tsx`

**간단 요약:** Firebase Auth 인증 상태를 전역으로 관리하는 Context. 로그인 여부, 관리자 여부, Firestore 유저 문서를 앱 전체에 공급합니다.

| 항목 | 내용 |
|---|---|
| **위치** | `src/logincontext.tsx` |
| **사용하는 파일** | `src/lib/firebase.ts` (auth), `src/lib/firebaseuser.ts` (syncUserDocument) |
| **이 파일을 사용하는 파일** | `src/App.tsx`, `src/home_parts/mymenu.tsx`, `src/home_parts/menu_parts/mypage.tsx`, `src/home_parts/menu_parts/ChangePasswordDialog.tsx`, `src/home_parts/menu_parts/info_parts/application.tsx` |

**제공하는 기능:**

| export | 설명 |
|---|---|
| `AuthProvider` | Context 공급자 컴포넌트. `onAuthStateChanged`로 인증 상태 구독 |
| `useAuth()` | `AuthContextType` 반환. Provider 외부에서 호출 시 Error throw |

**사용법:**
```tsx
// 1. App.tsx에서 Provider 마운트 (이미 완료)
<AuthProvider> ... </AuthProvider>

// 2. 하위 컴포넌트에서 훅 사용
const { user, appUser, loading, isAdmin } = useAuth();
```

**구현 방법:**
- `onAuthStateChanged(auth, callback)` 구독으로 Firebase 인증 상태 변화 감지
- 로그인 시 `syncUserDocument(firebaseUser)`를 호출해 Firestore `users` 컬렉션과 동기화
- `isAdmin`은 `appUser?.role === 'admin'` 파생 값 (Firestore에서 role 관리)

---

### `src/searchcontext.tsx`

**간단 요약:** 검색어, 위치, 서비스/태그 필터 상태를 전역으로 관리하는 Context. `tags.tsx`, `LocationSearchInput.tsx`, `BusinessList.tsx` 간의 상태를 공유합니다.

| 항목 | 내용 |
|---|---|
| **위치** | `src/searchcontext.tsx` |
| **사용하는 파일** | `src/lib/geocode.ts` (GeoResult 타입만) |
| **이 파일을 사용하는 파일** | `src/App.tsx`, `src/home_parts/tags.tsx`, `src/home_parts/LocationSearchInput.tsx`, `src/home_parts/BusinessList.tsx` |

**제공하는 기능:**

| export | 설명 |
|---|---|
| `SearchProvider` | 검색 상태 공급자 컴포넌트 |
| `useSearch()` | `SearchContextValue` 반환. Provider 외부 호출 시 Error throw |

**사용법:**
```tsx
const { query, setQuery, locationResult, resetFilters } = useSearch();
```

---

### `src/footer.tsx`

**간단 요약:** 모든 페이지 하단에 렌더링되는 공통 푸터. 정보 페이지(`/info`) 각 섹션으로의 링크를 제공합니다.

| 항목 | 내용 |
|---|---|
| **위치** | `src/footer.tsx` |
| **사용하는 파일** | 없음 (`@tanstack/react-router`의 `Link` 사용) |
| **이 파일을 사용하는 파일** | `src/App.tsx` |

**제공하는 기능:**
- 개인정보처리방침 / 이용약관 / 문의하기 / FAQ / 사이트 소개 / 공지사항 링크
- 각 링크는 `/info?menu={id}` 쿼리 파라미터로 이동

> ⚠️ **TODO 주석 있음:** FAQ, 공지사항 등 일부 링크는 실제 페이지 미구현 상태

---

### `src/routes/routes.tsx`

**간단 요약:** TanStack Router의 라우트 트리 전체를 정의하고 `router` 인스턴스를 export합니다.

| 항목 | 내용 |
|---|---|
| **위치** | `src/routes/routes.tsx` |
| **사용하는 파일** | `src/App.tsx`, `src/routes/home.tsx`, `src/home_parts/menu_parts/mypage.tsx`, `src/home_parts/menu_parts/info_parts/info.tsx` |
| **이 파일을 사용하는 파일** | `src/main.tsx` |

**제공하는 기능:**

| export | 설명 |
|---|---|
| `router` | `RouterProvider`에 전달하는 라우터 인스턴스 |

**라우트 구조:**

| 경로 | 컴포넌트 | 비고 |
|---|---|---|
| (root) | `App` | 모든 라우트의 부모. Outlet으로 자식 렌더링 |
| `/` | `Home` | 메인 홈 페이지 |
| `/mypage` | `MyPage` | 마이페이지 (로그인 불필요하지만 비로그인 시 빈 화면) |
| `/info` | `InfoLayout` | 정보 페이지. `?menu=` 쿼리 파라미터 유효성 검사 포함 |

**`/info` 라우트 쿼리 파라미터:**
```ts
// validateSearch로 타입 보장
{ menu: string }  // 기본값: 'privacy'
```

---

### `src/routes/home.tsx`

**간단 요약:** `/` 경로의 홈 페이지 컴포넌트. `Header`와 `Body`를 조합해 렌더링합니다.

| 항목 | 내용 |
|---|---|
| **위치** | `src/routes/home.tsx` |
| **사용하는 파일** | `src/home_parts/header.tsx`, `src/home_parts/body.tsx` |
| **이 파일을 사용하는 파일** | `src/routes/routes.tsx` |

---

### `src/home_parts/header.tsx`

**간단 요약:** 홈 페이지 상단 헤더. 로고(이미지 + 텍스트)와 우측 드롭다운 메뉴(`Mymenu`)로 구성됩니다.

| 항목 | 내용 |
|---|---|
| **위치** | `src/home_parts/header.tsx` |
| **사용하는 파일** | `src/home_parts/mymenu.tsx` |
| **이 파일을 사용하는 파일** | `src/routes/home.tsx` |

**제공하는 기능:**
- 로고 이미지(`/images/로고.png`) + "클린 매칭" 텍스트 표시
- `<Mymenu />` 컴포넌트를 우측에 배치

---

### `src/home_parts/body.tsx`

**간단 요약:** 홈 페이지의 메인 콘텐츠 영역. 서비스 슬로건과 검색박스, 필터 탭, 업체 목록을 수직으로 배치합니다.

| 항목 | 내용 |
|---|---|
| **위치** | `src/home_parts/body.tsx` |
| **사용하는 파일** | `src/home_parts/searchbox.tsx`, `src/home_parts/tags.tsx`, `src/home_parts/BusinessList.tsx` |
| **이 파일을 사용하는 파일** | `src/routes/home.tsx` |

---

### `src/home_parts/searchbox.tsx`

**간단 요약:** Headless UI `Combobox`를 사용한 텍스트 검색 입력 컴포넌트. 현재 로컬 상태로만 동작하며 SearchContext 연동이 미완성입니다.

| 항목 | 내용 |
|---|---|
| **위치** | `src/home_parts/searchbox.tsx` |
| **사용하는 파일** | 없음 (외부 라이브러리만 사용) |
| **이 파일을 사용하는 파일** | `src/home_parts/body.tsx` |

**제공하는 기능:**
- `@headlessui/react Combobox`로 드롭다운 자동완성 UI 구현
- 돋보기 아이콘 (`@heroicons/react`)

> ⚠️ **TODO 주석 있음:**  
> - 검색 예시 데이터(`items`)가 하드코딩되어 있음 → 별도 파일로 분리 또는 실제 데이터 연동 필요  
> - SearchContext의 `setQuery`와 아직 미연동  
> - 돋보기 버튼 클릭 시 검색 기능 미구현, 엔터 키 검색 미구현

---

### `src/home_parts/tags.tsx`

**간단 요약:** 지역 / 서비스 종류 / 업체 특성 3개 탭으로 구성된 필터 UI. SearchContext에 필터 상태를 기록합니다.

| 항목 | 내용 |
|---|---|
| **위치** | `src/home_parts/tags.tsx` |
| **사용하는 파일** | `src/searchcontext.tsx`, `src/lib/companyFormOptions.ts`, `src/home_parts/LocationSearchInput.tsx` |
| **이 파일을 사용하는 파일** | `src/home_parts/body.tsx` |

**제공하는 기능:**

| 탭 | 기능 |
|---|---|
| 지역 | `LocationSearchInput` 컴포넌트 렌더링 |
| 서비스 종류 | `SERVICE_CATEGORIES` 기반 칩 토글. `setSelectedServices` 업데이트 |
| 업체 특성 | `TAG_GROUPS` 기반 칩 토글. `setSelectedTags` 업데이트 |

**사용법:**
- 선택된 항목 수는 탭 헤더 뱃지로 표시
- 각 탭 우측 하단 "초기화" 버튼으로 해당 필터만 초기화 가능

---

### `src/home_parts/LocationSearchInput.tsx`

**간단 요약:** 카카오 로컬 API를 이용한 주소 자동완성 입력 컴포넌트. 디바운싱(300ms)과 외부 클릭 감지를 구현합니다.

| 항목 | 내용 |
|---|---|
| **위치** | `src/home_parts/LocationSearchInput.tsx` |
| **사용하는 파일** | `src/lib/geocode.ts` (searchAddressWithMeta, GeoResult), `src/searchcontext.tsx` |
| **이 파일을 사용하는 파일** | `src/home_parts/tags.tsx` |

**제공하는 기능:**
- 300ms 디바운스 후 카카오 API 호출 (불필요한 API 요청 최소화)
- 도로명·지번 1차 검색 → 결과 없으면 키워드 2차 검색 (geocode.ts 위임)
- 주소 선택 시 `setLocationResult(GeoResult)` → SearchContext 업데이트
- 확정된 위치 표시 영역 (`📍 전체주소 (시도) 기준으로 검색 중`)
- "초기화" 버튼으로 `locationQuery`, `locationResult` 모두 초기화
- `mousedown` 이벤트로 외부 클릭 시 드롭다운 닫기

**구현 방법:**
```tsx
// 디바운싱 패턴
const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
useEffect(() => {
  debounceRef.current = setTimeout(async () => { /* API 호출 */ }, 300);
  return () => clearTimeout(debounceRef.current);
}, [locationQuery]);
```

---

### `src/home_parts/BusinessList.tsx`

**간단 요약:** Firestore `businessApplications` 컬렉션에서 `status === 'approved'` 업체를 조회하고, SearchContext의 필터를 적용해 카드 목록으로 렌더링합니다.

| 항목 | 내용 |
|---|---|
| **위치** | `src/home_parts/BusinessList.tsx` |
| **사용하는 파일** | `src/lib/firebase.ts` (db), `src/searchcontext.tsx`, `src/lib/filterBusinesses.ts` |
| **이 파일을 사용하는 파일** | `src/home_parts/body.tsx` |

**제공하는 기능:**
- 컴포넌트 마운트 시 1회 Firestore에서 업체 전체 목록 fetch
- 필터값 변경 시마다 `applyAllFilters()`로 클라이언트 사이드 필터링
- 로딩 / 에러 / 결과 없음 상태 UI 각각 처리
- `BusinessCard`: 업체 이름, 한 줄 소개, 서비스 태그(최대 4개), 업체 특성 태그(최대 4개), 연락처, 별점 표시
- `CoverageBadge`: `nationwide(🌐전국)` / `regional(📍시도명)` / `radius(🏠거점반경)` 뱃지

**구현 방법:**
```tsx
// 데이터 fetch (최초 1회)
useEffect(() => { fetchBusinesses(); }, []);

// 필터 적용 (필터 상태 변경 시마다)
useEffect(() => {
  setFiltered(applyAllFilters(allBusinesses, { loc, selectedServices, selectedTags, query }));
}, [allBusinesses, locationResult, selectedServices, selectedTags, textQuery]);
```

---

### `src/home_parts/mymenu.tsx`

**간단 요약:** 헤더 우측의 햄버거 드롭다운 메뉴. 인증 상태에 따라 "로그인/회원가입" 또는 "로그아웃 + 마이페이지"를 동적으로 표시합니다.

| 항목 | 내용 |
|---|---|
| **위치** | `src/home_parts/mymenu.tsx` |
| **사용하는 파일** | `src/logincontext.tsx`, `src/lib/firebase.ts` (auth), `src/home_parts/menu_parts/login.tsx` |
| **이 파일을 사용하는 파일** | `src/home_parts/header.tsx`, `src/home_parts/menu_parts/mypage.tsx`, `src/home_parts/menu_parts/info_parts/info.tsx` |

**제공하는 기능:**

| 메뉴 항목 | 조건 |
|---|---|
| 홈으로 (`/`) | 항상 표시 |
| 정보 (`/info`) | 항상 표시 |
| 로그인/회원가입 | `user === null` |
| 로그아웃 | `user !== null` → `signOut(auth)` 호출 |
| 마이페이지 | `user !== null` |

---

### `src/home_parts/menu_parts/login.tsx`

**간단 요약:** 이메일/비밀번호 로그인, Google 소셜 로그인, 이메일 인증 재전송, 비밀번호 찾기를 지원하는 모달 다이얼로그입니다.

| 항목 | 내용 |
|---|---|
| **위치** | `src/home_parts/menu_parts/login.tsx` |
| **사용하는 파일** | `src/lib/firebase.ts` (auth), `src/home_parts/menu_parts/signup.tsx`, `src/home_parts/menu_parts/ForgotPasswordDialog.tsx` |
| **이 파일을 사용하는 파일** | `src/home_parts/mymenu.tsx` |

**Props:**
```ts
interface loginprops {
  isOpen: boolean;
  closeModal: () => void;
}
```

**제공하는 기능:**

| 기능 | 구현 |
|---|---|
| 이메일 로그인 | `signInWithEmailAndPassword` + 이메일 미인증 시 로그아웃 처리 |
| Google 로그인 | `signInWithPopup(GoogleAuthProvider)` + `prompt: 'select_account'` |
| 인증메일 재전송 | `sendEmailVerification(lastuser)` |
| 비밀번호 찾기 | `ForgotPasswordDialog` 열기 |
| 회원가입 | `SignUpDialog` 열기 |

**에러 코드 처리:**
- `auth/user-not-found`, `auth/wrong-password`, `auth/invalid-credential` → "이메일 또는 비밀번호 확인"
- `auth/invalid-email` → "이메일 형식 오류"

---

### `src/home_parts/menu_parts/signup.tsx`

**간단 요약:** 이메일/비밀번호 회원가입 모달. `useSignUpLogic` 훅으로 실시간 유효성 검사를 수행하고, 가입 후 이메일 인증 발송 + 즉시 로그아웃합니다.

| 항목 | 내용 |
|---|---|
| **위치** | `src/home_parts/menu_parts/signup.tsx` |
| **사용하는 파일** | `src/home_parts/menu_parts/signuplogic.ts`, `src/lib/firebase.ts` (auth) |
| **이 파일을 사용하는 파일** | `src/home_parts/menu_parts/login.tsx` |

**Props:**
```ts
interface signupprops {
  isOpen: boolean;
  closeModal: () => void;
}
```

**`idok` 상태 코드:**

| 값 | 의미 |
|---|---|
| `0` | 초기값 |
| `1` | 이미 사용 중인 이메일 |
| `2` | 이메일 형식 불일치 |
| `3` | 사용 가능 (현재 미사용) |

**`pwok` 상태 코드:**

| 값 | 의미 |
|---|---|
| `0` | 문제 없음 |
| `1` | 비밀번호 미입력 |
| `2` | 비밀번호 확인 미입력 |
| `3` | 비밀번호 불일치 |

---

### `src/home_parts/menu_parts/signuplogic.ts`

**간단 요약:** 회원가입 비밀번호 유효성 검사를 담당하는 커스텀 훅. pw/pwcon 변경 시 `pwok` 상태를 업데이트합니다.

| 항목 | 내용 |
|---|---|
| **위치** | `src/home_parts/menu_parts/signuplogic.ts` |
| **사용하는 파일** | 없음 |
| **이 파일을 사용하는 파일** | `src/home_parts/menu_parts/signup.tsx` |

**제공하는 기능:**

```ts
useSignUpLogic(
  id: string,
  pw: string,
  pwcon: string,
  setpwok: React.Dispatch<React.SetStateAction<number>>
): void
```

**구현 방법:**
- `useEffect`로 `pw`, `pwcon` 변화 감지
- 빈 값 → 1 또는 2, 불일치 → 3, 정상 → 0

---

### `src/home_parts/menu_parts/ForgotPasswordDialog.tsx`

**간단 요약:** 이메일을 입력받아 Firebase `sendPasswordResetEmail`로 비밀번호 재설정 링크를 발송하는 모달입니다.

| 항목 | 내용 |
|---|---|
| **위치** | `src/home_parts/menu_parts/ForgotPasswordDialog.tsx` |
| **사용하는 파일** | `src/lib/firebase.ts` (auth) |
| **이 파일을 사용하는 파일** | `src/home_parts/menu_parts/login.tsx` |

**Props:**
```ts
interface ForgotPasswordDialogProps {
  isOpen: boolean;
  closeModal: () => void;
}
```

**제공하는 기능:**
- 이메일 입력 → `sendPasswordResetEmail(auth, email)` 호출
- 성공 시 초록색 안내 메시지, 실패 시 빨간색 에러 메시지 표시
- 에러 코드: `auth/user-not-found`, `auth/invalid-email`, `auth/invalid-credential` → 통합 메시지

---

### `src/home_parts/menu_parts/ChangePasswordDialog.tsx`

**간단 요약:** 현재 비밀번호로 재인증 후 새 비밀번호로 변경하는 모달. 비로그인 상태에서 접근 시 홈으로 리다이렉트합니다.

| 항목 | 내용 |
|---|---|
| **위치** | `src/home_parts/menu_parts/ChangePasswordDialog.tsx` |
| **사용하는 파일** | `src/logincontext.tsx` (useAuth), `firebase/auth` 직접 import |
| **이 파일을 사용하는 파일** | `src/home_parts/menu_parts/mypage.tsx` |

**Props:**
```ts
interface ChangePasswordDialogProps {
  isOpen: boolean;
  closeModal: () => void;
}
```

**제공하는 기능:**
- `EmailAuthProvider.credential(email, currentPw)` → `reauthenticateWithCredential()` → `updatePassword()` 순서 실행
- 현재 비밀번호 == 새 비밀번호 차단
- 에러 코드: `auth/wrong-password` / `auth/weak-password` / `auth/requires-recent-login` 각각 처리

> ⚠️ Google 로그인 사용자는 `mypage.tsx`에서 이 버튼을 숨겨야 함 (이미 적용됨)

---

### `src/home_parts/menu_parts/mypage.tsx`

**간단 요약:** `/mypage` 라우트의 마이페이지. 프로필 정보 확인/닉네임 수정, 북마크, 내 리뷰 탭 UI를 제공합니다. 북마크/리뷰는 현재 더미 데이터 사용 중입니다.

| 항목 | 내용 |
|---|---|
| **위치** | `src/home_parts/menu_parts/mypage.tsx` |
| **사용하는 파일** | `src/logincontext.tsx`, `src/home_parts/mymenu.tsx`, `src/home_parts/menu_parts/ChangePasswordDialog.tsx` |
| **이 파일을 사용하는 파일** | `src/routes/routes.tsx` |

**제공하는 기능:**

| 탭 | 기능 |
|---|---|
| 프로필 | 닉네임 인라인 수정 (`updateProfile`), 이메일/계정유형/로그인방식 표시, 비밀번호 변경(이메일 로그인만), 회원 탈퇴 버튼(미구현) |
| 북마크 | 더미 데이터 카드 목록 (Firebase 연동 예정) |
| 내 리뷰 | 더미 데이터 리뷰 목록 (Firebase 연동 예정) |

> ⚠️ **TODO:** 북마크·리뷰 Firestore 연동, 회원 탈퇴 기능 구현 필요

---

### `src/home_parts/menu_parts/info_parts/info.tsx`

**간단 요약:** `/info` 라우트의 레이아웃 컴포넌트. 상단 탭 네비게이션(6개 메뉴)과 좌측 섹션 사이드바, 우측 콘텐츠 영역으로 구성됩니다.

| 항목 | 내용 |
|---|---|
| **위치** | `src/home_parts/menu_parts/info_parts/info.tsx` |
| **사용하는 파일** | `./privacypolicy`, `./termsofservice`, `./about`, `./contact`, `src/home_parts/mymenu.tsx` |
| **이 파일을 사용하는 파일** | `src/routes/routes.tsx` |

**MENUS 구조:**

| id | label | 구현 여부 |
|---|---|---|
| `privacy` | 개인정보처리방침 | ✅ |
| `terms` | 서비스 이용약관 | ✅ |
| `about` | 사이트 소개 | ✅ |
| `contact` | 문의하기 | ✅ |
| `faq` | 자주 묻는 질문 | ⚠️ 미구현 |
| `notice` | 공지사항 | ⚠️ 미구현 |

**쿼리 파라미터 연동:**
- URL의 `?menu=` 파라미터를 `useSearch({ from: '/info' })`로 읽어 초기 탭 결정
- `useEffect`로 URL 변경 시 탭 상태 동기화

---

### `src/home_parts/menu_parts/info_parts/about.tsx`

**간단 요약:** 사이트 소개 정보(서비스 소개 / 운영자 소개 / 서비스 방향성)를 정적 콘텐츠로 렌더링합니다.

| 항목 | 내용 |
|---|---|
| **위치** | `src/home_parts/menu_parts/info_parts/about.tsx` |
| **사용하는 파일** | 없음 |
| **이 파일을 사용하는 파일** | `src/home_parts/menu_parts/info_parts/info.tsx` |

**Props:** `{ activeSection: string }` — `info.tsx`에서 현재 사이드바 섹션 전달

---

### `src/home_parts/menu_parts/info_parts/contact.tsx`

**간단 요약:** 문의하기 레이아웃 컴포넌트. `activeSection`에 따라 문의 안내 / 문의 양식(EmailJS) / 업체 신청(`Application`) 중 하나를 렌더링합니다.

| 항목 | 내용 |
|---|---|
| **위치** | `src/home_parts/menu_parts/info_parts/contact.tsx` |
| **사용하는 파일** | `src/home_parts/menu_parts/info_parts/application.tsx`, `@emailjs/browser` |
| **이 파일을 사용하는 파일** | `src/home_parts/menu_parts/info_parts/info.tsx` |

**Props:** `{ activeSection: string }`

**제공하는 기능:**

| activeSection 값 | 렌더링 내용 |
|---|---|
| `'문의 안내'` | 운영 이메일 등 안내 텍스트 |
| `'문의 양식'` | EmailJS `sendForm()` 기반 문의 폼 |
| `'업체 신청'` | `<Application />` 컴포넌트 |

**EmailJS 템플릿 변수 (`VITE_EMAILJS_TEMPLATE_ID`):**
- `from_name`, `from_email`, `subject`, `message`

---

### `src/home_parts/menu_parts/info_parts/application.tsx`

**간단 요약:** 업체 등록 신청 폼 컴포넌트. 서비스 범위 유형, 서비스 종류, 태그, 운영시간 등을 입력받아 Firestore에 저장하고 EmailJS로 접수 알림을 전송합니다.

| 항목 | 내용 |
|---|---|
| **위치** | `src/home_parts/menu_parts/info_parts/application.tsx` |
| **사용하는 파일** | `src/lib/firebase.ts` (db), `src/logincontext.tsx`, `src/lib/regions.ts`, `src/lib/geocode.ts` (geocodeAddress), `src/lib/companyFormOptions.ts` |
| **이 파일을 사용하는 파일** | `src/home_parts/menu_parts/info_parts/contact.tsx` |

**제공하는 기능:**
- 비로그인 시 잠금 화면 표시 (미제출 방지)
- 서비스 범위 3가지 유형: `nationwide` / `regional(시도 복수선택)` / `radius(주소+반경km)`
- `radius` 선택 시 `geocodeAddress(baseAddress)`로 좌표 변환 후 Firestore에 저장
- Firestore 문서 ID: `YYYY_MM_DD_HH_mm_업체명` 형식
- EmailJS `VITE_EMAILJS_TEMPLATE2_ID`로 신청 접수 알림 발송

**저장되는 Firestore 필드:**
```
name, phone, businessRegNumber, ownerEmail, shortDescription, description,
services, tags, coverageType, [coverageSido | geoPoint + serviceRadiusKm],
openingHours: { weekday: {open, close, closed}, weekend: {open, close, closed} },
ratingAvg, ratingCount, reviewCount, bookmarkCount,
status: 'submitted', createdAt, updatedAt
```

---

### `src/home_parts/menu_parts/info_parts/privacypolicy.tsx`

**간단 요약:** 개인정보처리방침 정적 콘텐츠 컴포넌트. `activeSection` 값에 따라 각 항목을 렌더링합니다.

| 항목 | 내용 |
|---|---|
| **위치** | `src/home_parts/menu_parts/info_parts/privacypolicy.tsx` |
| **사용하는 파일** | 없음 |
| **이 파일을 사용하는 파일** | `src/home_parts/menu_parts/info_parts/info.tsx` |

**Props:** `{ activeSection: string }`

---

### `src/home_parts/menu_parts/info_parts/termsofservice.tsx`

**간단 요약:** 서비스 이용약관 정적 콘텐츠 컴포넌트. `activeSection` 값에 따라 각 항목을 렌더링합니다.

| 항목 | 내용 |
|---|---|
| **위치** | `src/home_parts/menu_parts/info_parts/termsofservice.tsx` |
| **사용하는 파일** | 없음 |
| **이 파일을 사용하는 파일** | `src/home_parts/menu_parts/info_parts/info.tsx` |

**Props:** `{ activeSection: string }`

---

### `src/lib/firebase.ts`

**간단 요약:** Firebase 앱 초기화 및 `auth`, `db` 인스턴스를 생성해 export하는 싱글턴 모듈입니다.

| 항목 | 내용 |
|---|---|
| **위치** | `src/lib/firebase.ts` |
| **사용하는 파일** | 없음 (환경변수만 사용) |
| **이 파일을 사용하는 파일** | `src/logincontext.tsx`, `src/lib/firebaseuser.ts`, `src/home_parts/mymenu.tsx`, `src/home_parts/menu_parts/login.tsx`, `src/home_parts/menu_parts/signup.tsx`, `src/home_parts/menu_parts/ChangePasswordDialog.tsx`, `src/home_parts/menu_parts/ForgotPasswordDialog.tsx`, `src/home_parts/BusinessList.tsx`, `src/home_parts/menu_parts/info_parts/application.tsx` |

**제공하는 기능:**

| export | 타입 | 설명 |
|---|---|---|
| `auth` | `Auth` | Firebase Authentication 인스턴스 |
| `db` | `Firestore` | Firebase Firestore 인스턴스 |

**구현 방법:**
- `initializeApp(firebaseConfig)`로 Firebase 앱 초기화 (모듈 최초 import 시 1회 실행)
- 모든 설정값은 `import.meta.env.VITE_*` 환경변수에서 읽음

---

### `src/lib/firebaseuser.ts`

**간단 요약:** Firebase Auth 유저를 기반으로 Firestore `users` 컬렉션에 앱 전용 유저 문서를 동기화하는 유틸리티 함수를 제공합니다.

| 항목 | 내용 |
|---|---|
| **위치** | `src/lib/firebaseuser.ts` |
| **사용하는 파일** | `src/lib/firebase.ts` (db) |
| **이 파일을 사용하는 파일** | `src/logincontext.tsx` |

**제공하는 기능:**

| export | 설명 |
|---|---|
| `AppUser` (interface) | `{ uid, email, role: 'admin' \| 'user' }` |
| `syncUserDocument(firebaseUser)` | Firestore에 유저 문서 없으면 생성(`role: 'user'`), 있으면 반환 |

**사용법:**
```ts
const appUser = await syncUserDocument(firebaseUser);
// appUser.role === 'admin' 이면 관리자
```

---

### `src/lib/geocode.ts`

**간단 요약:** 카카오 로컬 REST API를 이용한 주소 검색, 좌표 변환, 두 지점 간 거리 계산 함수를 제공합니다.

| 항목 | 내용 |
|---|---|
| **위치** | `src/lib/geocode.ts` |
| **사용하는 파일** | `src/lib/regionNormalize.ts` (normalizeSido) |
| **이 파일을 사용하는 파일** | `src/home_parts/LocationSearchInput.tsx`, `src/lib/filterBusinesses.ts`, `src/home_parts/menu_parts/info_parts/application.tsx` |

**제공하는 기능:**

| export | 설명 |
|---|---|
| `GeoPoint` | `{ lat: number, lng: number }` |
| `GeoResult` | `{ lat, lng, sido, fullAddress }` |
| `geocodeAddress(address)` | 주소 문자열 → `GeoPoint` 변환 (1차 주소 검색만, application.tsx에서 사용) |
| `searchAddressWithMeta(query)` | 주소/키워드 검색 → `GeoResult[]` 반환 (1차 주소 API → 2차 키워드 API fallback) |
| `getDistanceKm(lat1, lng1, lat2, lng2)` | Haversine 공식으로 두 좌표 간 직선 거리(km) 반환 |

**구현 방법 (`getDistanceKm` — Haversine 공식):**
```ts
R = 6371 (지구 반지름 km)
a = sin²(Δlat/2) + cos(lat1)·cos(lat2)·sin²(Δlng/2)
distance = R · 2 · atan2(√a, √(1-a))
```

---

### `src/lib/regionNormalize.ts`

**간단 요약:** 카카오 API가 반환하는 전체 시/도명("경기도", "서울특별시" 등)을 앱 내부 축약형("경기", "서울")으로 변환하는 매핑 테이블과 함수를 제공합니다.

| 항목 | 내용 |
|---|---|
| **위치** | `src/lib/regionNormalize.ts` |
| **사용하는 파일** | 없음 |
| **이 파일을 사용하는 파일** | `src/lib/geocode.ts` |

**제공하는 기능:**

| export | 설명 |
|---|---|
| `normalizeSido(raw: string)` | SIDO_MAP 조회 → 매핑 있으면 축약형 반환, 없으면 원본 반환 |

> 새로운 시/도 명칭이 추가되거나 카카오 API 응답 형식이 변경되면 이 파일의 `SIDO_MAP`을 업데이트해야 합니다.

---

### `src/lib/regions.ts`

**간단 요약:** 앱 전체에서 사용하는 전국 시/도 목록 상수(`SIDO_LIST`)와 타입(`Sido`)을 정의합니다.

| 항목 | 내용 |
|---|---|
| **위치** | `src/lib/regions.ts` |
| **사용하는 파일** | 없음 |
| **이 파일을 사용하는 파일** | `src/home_parts/menu_parts/info_parts/application.tsx` |

**제공하는 기능:**

| export | 설명 |
|---|---|
| `SIDO_LIST` | 17개 시/도 축약명 `as const` 배열 |
| `Sido` | `typeof SIDO_LIST[number]` union 타입 |

---

### `src/lib/filterBusinesses.ts`

**간단 요약:** 업체 목록에 위치/서비스/태그/텍스트 필터를 적용하는 순수 함수 모음. 모든 함수는 부작용 없이 새 배열을 반환합니다.

| 항목 | 내용 |
|---|---|
| **위치** | `src/lib/filterBusinesses.ts` |
| **사용하는 파일** | `src/lib/geocode.ts` (getDistanceKm, GeoResult) |
| **이 파일을 사용하는 파일** | `src/home_parts/BusinessList.tsx` |

**제공하는 기능:**

| export | 설명 |
|---|---|
| `Business` (interface) | 업체 Firestore 문서의 전체 타입 정의 |
| `filterByLocation(businesses, loc)` | coverageType 기반 위치 필터 |
| `filterByServices(businesses, selectedServices)` | OR 조건 서비스 필터 |
| `filterByTags(businesses, selectedTags)` | AND 조건 태그 필터 |
| `filterByText(businesses, query)` | name + shortDescription 텍스트 검색 |
| `applyAllFilters(businesses, filters)` | 위 4개 필터를 순서대로 모두 적용 |

**사용법:**
```ts
const result = applyAllFilters(allBusinesses, {
  loc: locationResult,
  selectedServices,
  selectedTags,
  query: textQuery,
});
```

---

### `src/lib/companyFormOptions.ts`

**간단 요약:** 업체 신청 폼과 검색 필터 UI에서 공통으로 사용하는 서비스 카테고리 목록과 태그 그룹 데이터를 상수로 정의합니다.

| 항목 | 내용 |
|---|---|
| **위치** | `src/lib/companyFormOptions.ts` |
| **사용하는 파일** | 없음 |
| **이 파일을 사용하는 파일** | `src/home_parts/tags.tsx`, `src/home_parts/menu_parts/info_parts/application.tsx` |

**제공하는 기능:**

| export | 설명 |
|---|---|
| `ServiceCategory` (interface) | `{ category: string, items: string[] }` |
| `SERVICE_CATEGORIES` | 7개 카테고리(고독사·사망/유품정리/쓰레기집/화재재해/입주이사/방역소독/특수환경) |
| `TagGroup` (interface) | `{ group: string, description: string, tags: string[] }` |
| `TAG_GROUPS` | 3개 그룹(긴급성·출동 / 신뢰·자격 / 서비스방식·팀특성) |
| `TAG_OPTIONS` | `TAG_GROUPS`에서 추출한 모든 태그 문자열 1차원 배열 |

> 서비스 항목이나 태그를 추가/수정할 때는 이 파일만 변경하면 폼과 필터 UI 모두에 자동 반영됩니다.

---

*문서 최종 업데이트: 2026-03-31*
'''