# 클린 매칭 — 디자인 가이드

> 이 파일은 Perplexity AI가 새로운 화면을 만들 때 **일관된 디자인**으로 구현하기 위한 참고 문서입니다.  
> 모든 코드는 **React + TypeScript + Tailwind CSS v4 + Headless UI + Heroicons** 기반입니다.

---

## 1. 기술 스택

| 항목 | 라이브러리 |
|------|----------|
| 프레임워크 | React 18 + TypeScript |
| 스타일 | Tailwind CSS v4 (`@import 'tailwindcss'`) |
| 컴포넌트 | Headless UI (`@headlessui/react`) |
| 아이콘 | Heroicons (`@heroicons/react/24/outline`, `/solid`) |
| 라우팅 | TanStack Router (`@tanstack/react-router`) |
| 백엔드 | Firebase (Auth, Firestore) |

---

## 2. 컬러 팔레트

> **원칙**: 포인트 컬러는 Blue 단일 계열만 사용. 배경은 White 또는 Gray-50. 에러는 Red.

| 역할 | Tailwind 클래스 | HEX |
|------|----------------|-----|
| **Primary (브랜드, 버튼, 아이콘)** | `blue-500` | `#3b82f6` |
| **Primary 강조 (로고 텍스트)** | `text-[#1d4ed8]` (blue-700) | `#1d4ed8` |
| **Primary Hover** | `blue-600` | `#2563eb` |
| **Primary Light (배지, hover bg)** | `blue-50` / `blue-100` | `#eff6ff` / `#dbeafe` |
| **페이지 배경** | `bg-white` / `bg-gray-50` | `#ffffff` / `#f9fafb` |
| **카드/패널 배경** | `bg-white` | `#ffffff` |
| **기본 텍스트** | `text-gray-900` | `#111827` |
| **본문 텍스트** | `text-gray-700` | `#374151` |
| **보조 텍스트** | `text-gray-500` | `#6b7280` |
| **비활성/힌트 텍스트** | `text-gray-400` | `#9ca3af` |
| **테두리** | `border-gray-300` / `border-gray-200` | `#d1d5db` / `#e5e7eb` |
| **메뉴 hover 배경** | `bg-gray-100` | `#f3f4f6` |
| **에러 메시지** | `text-red-500` | `#ef4444` |
| **위험 버튼 (탈퇴 등)** | `text-red-400 hover:text-red-600` | — |
| **성공 배지** | `bg-green-100 text-green-700` | — |
| **별점** | `text-yellow-500` | `#eab308` |

---

## 3. 타이포그래피

```css
/* 로고 전용 폰트 */
.logo_text {
    font-family: 'KerisKedyuche', sans-serif;
    font-weight: 600;
}

/* 전체 body 기본 폰트 */
body {
    font-family: 'Pretendard', sans-serif;
    font-weight: 500;
}
```

| 용도 | 클래스 |
|------|-------|
| 페이지 제목 | `text-xl font-semibold` 또는 `text-lg font-semibold` |
| 섹션 제목 | `text-sm font-semibold text-gray-700` |
| 본문 | `text-sm` (Pretendard 500 자동 적용) |
| 보조 설명 | `text-xs text-gray-400` 또는 `text-sm text-gray-500` |
| 로고 텍스트 | `logo_text text-[25px] text-[#1d4ed8]` (헤더: `text-[30px]`) |

---

## 4. 레이아웃 구조

### 공통 페이지 뼈대
```jsx
<div className="min-h-screen bg-gray-50">
  {/* 헤더 */}
  <header className="border-b bg-white">
    <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
      {/* 로고 (좌측) */}
      <div className="flex items-center gap-[2px]">
        <img src="/images/로고.png" alt="로고" className="w-[40px] h-auto"/>
        <div className="logo_text text-[25px] text-[#1d4ed8] pt-1">클린 매칭</div>
      </div>
      {/* 메뉴 (우측) */}
      <Mymenu />
    </div>
  </header>

  {/* 메인 콘텐츠 */}
  <main className="mx-auto max-w-6xl px-4 py-8">
    {/* 페이지 내용 */}
  </main>

  {/* 푸터 */}
  <Footer />
</div>
```

### 홈 페이지 헤더 (더 넓은 패딩)
```jsx
<div className="flex justify-between px-90 py-2">
```

---

## 5. 공통 컴포넌트 패턴

### 5-1. 버튼

```jsx
{/* Primary 버튼 (파란 배경) */}
<button className="w-full rounded bg-blue-500 py-2 text-sm font-semibold text-white hover:bg-blue-600 cursor-pointer">
  버튼 텍스트
</button>

{/* Secondary 버튼 (테두리) */}
<button className="rounded border px-4 py-2 text-sm text-gray-600 hover:bg-gray-50">
  버튼 텍스트
</button>

{/* 텍스트 버튼 (링크형) */}
<button className="text-sm text-gray-500 hover:text-gray-700 underline-offset-2 hover:underline cursor-pointer">
  텍스트 버튼
</button>

{/* 위험 버튼 (탈퇴, 삭제) */}
<button className="text-sm text-red-400 hover:text-red-600">
  회원 탈퇴
</button>

{/* 소형 아웃라인 버튼 */}
<button className="rounded border px-3 py-1 text-xs text-blue-500 hover:bg-blue-50">
  상세보기
</button>

{/* Google 로그인 버튼 */}
<button className="w-full flex items-center justify-center gap-2 rounded border border-gray-300 bg-white py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50">
  Google 계정으로 로그인
</button>
```

### 5-2. 태그 (필터 칩)

```jsx
{/* 활성 태그 */}
<button className="h-10 bg-white border-2 border-blue-500 rounded-full text-[18px] text-center px-5 pt-1 cursor-pointer text-blue-500 font-medium">
  청소
</button>

{/* 비활성 태그 */}
<button className="h-10 bg-white border-2 border-gray-400 rounded-full px-5 pt-1 text-[18px] cursor-pointer hover:text-blue-400 hover:border-blue-400">
  청소
</button>

{/* 인라인 소형 태그 (카드 내부) */}
<span className="rounded-full bg-gray-100 px-2.5 py-0.5 text-xs text-gray-600">
  특수청소
</span>
```

### 5-3. 입력 필드

```jsx
{/* 기본 input */}
<input
  className="w-full rounded border px-3 py-2 text-sm"
  placeholder="이메일"
/>

{/* 포커스 효과 있는 input (검색, 폼) */}
<input
  className="w-full rounded-md border border-gray-300 bg-white py-2 pl-9 pr-3 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
  placeholder="검색어를 입력하세요..."
/>

{/* 읽기 전용 필드 */}
<div className="w-full max-w-sm rounded border bg-gray-100 px-3 py-2 text-sm">
  값
</div>

{/* 인라인 편집 input (밑줄만) */}
<input
  className="border-b border-gray-400 focus:outline-none text-xl font-semibold"
/>
```

### 5-4. 카드 / 패널

```jsx
{/* 기본 카드 */}
<div className="rounded-xl bg-white p-5 shadow-sm">
  내용
</div>

{/* 섹션 카드 (여백 더 넓음) */}
<section className="rounded-xl bg-white p-6 shadow-sm">
  내용
</section>

{/* 사이드바 카드 */}
<div className="rounded-xl bg-white p-4 shadow-sm">
  내용
</div>

{/* 리스트 아이템 카드 (hover) */}
<li className="cursor-pointer rounded-lg border p-3 text-sm hover:bg-gray-50">
  내용
</li>
```

### 5-5. 탭 네비게이션

```jsx
type Tab = '북마크' | '내 리뷰' | '프로필'
const [activeTab, setActiveTab] = useState<Tab>('북마크')
const tabs: Tab[] = ['프로필', '북마크', '내 리뷰']

<nav className="mt-6 flex gap-1 border-b">
  {tabs.map((tab) => (
    <button
      key={tab}
      onClick={() => setActiveTab(tab)}
      className={`cursor-pointer px-5 py-2.5 text-sm font-medium transition ${
        activeTab === tab
          ? 'border-b-2 border-blue-500 text-blue-600'
          : 'text-gray-500 hover:text-gray-700'
      }`}
    >
      {tab}
    </button>
  ))}
</nav>
```

### 5-6. 배지 / 레이블

```jsx
{/* 이메일 로그인 배지 */}
<span className="inline-block rounded bg-blue-100 px-2 py-1 text-xs font-medium text-blue-700">
  이메일 로그인
</span>

{/* 구글 로그인 배지 */}
<span className="inline-block rounded bg-green-100 px-2 py-1 text-xs font-medium text-green-700">
  구글 로그인
</span>
```

### 5-7. 모달 / 다이얼로그 (Headless UI)

```jsx
import { Dialog, DialogPanel, DialogTitle, Transition } from '@headlessui/react'
import { Fragment } from 'react'

<Transition show={isOpen} as={Fragment}>
  <Dialog onClose={closeModal} className="fixed inset-0 z-50">
    {/* 배경 오버레이 */}
    <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
    <div className="fixed inset-0 flex items-center justify-center">
      <Transition.Child
        as={Fragment}
        enter="transition ease-out duration-150"
        enterFrom="opacity-0 scale-95 translate-y-2"
        enterTo="opacity-100 scale-100 translate-y-0"
        leave="transition ease-in duration-100"
        leaveFrom="opacity-100 scale-100 translate-y-0"
        leaveTo="opacity-0 scale-95 translate-y-2"
      >
        <DialogPanel className="w-full max-w-sm rounded-xl bg-white p-6 shadow-lg">
          <DialogTitle className="text-lg font-semibold mb-4">
            모달 제목
          </DialogTitle>
          <div className="space-y-3">
            {/* 내용 */}
          </div>
        </DialogPanel>
      </Transition.Child>
    </div>
  </Dialog>
</Transition>
```

### 5-8. 드롭다운 메뉴 (Headless UI)

```jsx
import { Menu, Transition } from '@headlessui/react'
import { Bars3Icon, HomeIcon } from '@heroicons/react/24/outline'

const itemClass = (active: boolean) =>
  `${active ? 'bg-gray-100 text-gray-900' : 'text-gray-700'} block px-4 py-2 text-[15px] w-full cursor-pointer`

<Menu as="div" className="relative inline-block text-left">
  <Menu.Button className="inline-flex items-center gap-1 rounded-md bg-white px-1 py-1 text-sm font-medium text-gray-700 shadow hover:bg-gray-50 cursor-pointer">
    <Bars3Icon className="w-9 h-9 text-black" />
  </Menu.Button>
  <Transition
    as={Fragment}
    enter="transition ease-out duration-100"
    enterFrom="transform opacity-0 scale-95"
    enterTo="transform opacity-100 scale-100"
    leave="transition ease-in duration-75"
    leaveFrom="transform opacity-100 scale-100"
    leaveTo="transform opacity-0 scale-95"
  >
    <Menu.Items className="absolute right-0 mt-2 w-45 origin-top-right rounded-md bg-white shadow-lg ring-1 ring-black/5 focus:outline-none z-40">
      <Menu.Item>
        {({ active }) => (
          <button className={itemClass(active)}>
            <HomeIcon className="w-5 h-5 inline-block mr-3 text-blue-500" />
            메뉴 항목
          </button>
        )}
      </Menu.Item>
    </Menu.Items>
  </Transition>
</Menu>
```

### 5-9. 검색창 (Headless UI Combobox)

```jsx
import { Combobox } from '@headlessui/react'
import { MagnifyingGlassIcon } from '@heroicons/react/24/solid'

<div className="w-full max-w-md">
  <Combobox value={query} onChange={setQuery}>
    <div className="relative">
      <Combobox.Input
        className="w-full rounded-md border border-gray-300 bg-white py-2 pl-9 pr-3 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        placeholder="태그를 선택하거나 검색하세요..."
        onChange={(e) => setQuery(e.target.value)}
      />
      <MagnifyingGlassIcon
        className="pointer-events-none absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-blue-500"
      />
      <Combobox.Options className="absolute z-40 mt-1 max-h-60 w-full overflow-auto rounded-md bg-white py-1 text-sm shadow-lg ring-1 ring-black/5 focus:outline-none">
        <Combobox.Option
          value="항목"
          className={({ active }) =>
            `${active ? 'bg-blue-500 text-white' : 'text-gray-900'} cursor-pointer select-none px-3 py-2`
          }
        >
          항목
        </Combobox.Option>
      </Combobox.Options>
    </div>
  </Combobox>
</div>
```

### 5-10. 푸터

```jsx
import { Link } from '@tanstack/react-router'

const footerLinkClass = "text-gray-500 hover:underline hover:underline-offset-4 text-sm transition-colors duration-200 cursor-pointer"

<footer className="w-full border-t py-4 text-center">
  <div className="flex justify-center gap-4 flex-wrap">
    <Link to="/info" className={footerLinkClass} search={{ menu: 'privacy' }}>개인정보 처리방침</Link>
    <Link to="/info" className={footerLinkClass} search={{ menu: 'terms' }}>이용약관</Link>
    <Link to="/info" className={footerLinkClass} search={{ menu: 'contact' }}>문의하기</Link>
    <p className="text-sm text-gray-500">© 2026 클린 매칭 서비스. All rights reserved.</p>
  </div>
</footer>
```

---

## 6. 아이콘 사용 규칙

- **라이브러리**: `@heroicons/react/24/outline` (기본) / `@heroicons/react/24/solid` (강조)
- **색상**: 메뉴 아이콘 `text-blue-500`, 햄버거 버튼 `text-black`, 보조 아이콘 `text-gray-400`
- **크기**: 메뉴 아이템 내 `w-5 h-5`, 햄버거 `w-9 h-9`, 검색 `h-4 w-4`, 편집 `w-4 h-4`

```jsx
// 자주 쓰는 아이콘
import {
  HomeIcon,                    // 홈
  Bars3Icon,                   // 햄버거 메뉴
  MagnifyingGlassIcon,         // 검색 (solid)
  PencilIcon,                  // 편집
  UserIcon,                    // 사용자
  InformationCircleIcon,       // 정보
  ArrowRightOnRectangleIcon,   // 로그인
  ArrowLeftOnRectangleIcon,    // 로그아웃
} from '@heroicons/react/24/outline'
```

---

## 7. 반응형 가이드

- **모바일 퍼스트**: 기본(모바일) → `sm:` → `md:` → `lg:` → `xl:` 순서
- 사이드바: `hidden lg:block` (모바일에서 숨김)
- 최대 너비: `max-w-6xl mx-auto` (메인 콘텐츠 영역)
- 패딩: `px-4` (모바일) / 홈 헤더만 `px-90`

---

## 8. 간격 / 그림자 / 테두리 규칙

| 요소 | 클래스 |
|------|-------|
| 카드 그림자 | `shadow-sm` |
| 모달 그림자 | `shadow-lg` |
| 카드 모서리 | `rounded-xl` |
| 버튼/입력 모서리 | `rounded-md` 또는 `rounded` |
| 태그 모서리 | `rounded-full` |
| 섹션 구분선 | `border-t` 또는 `border-b` |
| 카드 내부 여백 | `p-4` (소) / `p-5` (중) / `p-6` (대) |
| 항목 간격 | `space-y-3` 또는 `space-y-4` |
| flex 간격 | `gap-2` / `gap-4` / `gap-6` |

---

## 9. 애니메이션 / 트랜지션 규칙

```jsx
// 드롭다운 메뉴
enter="transition ease-out duration-100"
enterFrom="transform opacity-0 scale-95"
enterTo="transform opacity-100 scale-100"
leave="transition ease-in duration-75"

// 모달
enter="transition ease-out duration-150"
enterFrom="opacity-0 scale-95 translate-y-2"
enterTo="opacity-100 scale-100 translate-y-0"
leave="transition ease-in duration-100"

// 버튼/링크 hover
"transition-colors duration-200"
```

---

## 10. Perplexity에게 전달할 컨텍스트 (복붙용)

새 화면 컴포넌트를 요청할 때 아래 문장을 **요청 앞에 붙여서** 사용하세요:

```
이 프로젝트는 DESIGN_GUIDE.md의 디자인 시스템을 따릅니다.
- 기술 스택: React + TypeScript + Tailwind CSS v4 + Headless UI + Heroicons
- 색상: Blue-500 단일 포인트, 배경 white/gray-50, 텍스트 gray-700/900
- 폰트: 전체 Pretendard, 로고만 KerisKedyuche (.logo_text 클래스)
- 카드: rounded-xl bg-white shadow-sm
- Primary 버튼: bg-blue-500 hover:bg-blue-600 text-white rounded
- 모달: Headless UI Dialog + Transition, max-w-sm rounded-xl p-6
- 아이콘: Heroicons만 사용, 메뉴 아이콘 text-blue-500
- 레이아웃: min-h-screen bg-gray-50 / 헤더 border-b bg-white / main max-w-6xl mx-auto px-4 py-8
- 모바일 퍼스트 반응형
```
