# 클린 매칭 서비스 구현 기록 아카이브 (Implementation History Archive)

이 문서는 클린 매칭 서비스의 주요 기능 구현 사항, 결정 내용, 기술적 한계 및 향후 예상되는 문제와 해결 방안을 기록하는 아카이브입니다. 지속적으로 변경 사항이 있을 때마다 업데이트하여 프로젝트의 유지보수 가이드를 확보합니다.

---

## 1. Firebase 업체 권한(manager) 자동 부여 및 예외 안전 장치 (2026-06-22)

### 1) 목적 및 요구사항
* 회원가입 시 모든 사용자는 기본적으로 `user` 권한을 부여받습니다.
* 일반 사용자가 '업체 등록 신청'을 접수하고, 관리자가 이 신청을 승인(`status: 'approved'`)하면 해당 유저의 역할을 자동으로 `'manager'`로 승급시켜 업체 관리자 전용 기능을 이용할 수 있도록 자동화합니다.

### 2) 세부 구현 사항
* **업체 신청 정보 보강**:
  * [application.tsx](file:///c:/project/specialclean/src/home_parts/menu_parts/info_parts/application.tsx)에서 신청서 저장 시 `ownerUid: user!.uid` 필드를 추가하여 유저 정보와 직접 매칭할 수 있도록 최적화했습니다.
* **클라이언트 기반 자동 권한 동기화**:
  * [firebaseuser.ts](file:///c:/project/specialclean/src/lib/firebaseuser.ts)의 `syncUserDocument` 함수에 자동 권한 업데이트 로직을 배치했습니다.
  * 로그인 세션 생성 시 유저의 기존 권한이 `user`이면, `businessApplications` 컬렉션에서 `ownerUid`가 일치하고 `status === 'approved'`인 문서가 존재하는지 동적으로 확인합니다. (하위 호환성을 위해 `ownerEmail` 2차 체크 제공)
  * 일치하는 문서가 존재하면 앱의 로컬 유저 상태(`AppUser.role`)를 `'manager'`로 격상하고, Firestore `users/{uid}` 문서의 `role`을 `'manager'`로 업데이트를 시도합니다.
* **Context 및 UI 반영**:
  * [logincontext.tsx](file:///c:/project/specialclean/src/logincontext.tsx)에 `isManager` 권한 상태를 노출하여 앱 전역에서 활용하도록 했습니다.
  * [mypage.tsx](file:///c:/project/specialclean/src/home_parts/menu_parts/mypage.tsx)에서 업체 관리자 권한을 가진 계정의 경우 상단 프로필 및 상세 정보 영역에 초록색의 **'업체 관리자'** 배지가 표시되도록 대응했습니다.

### 3) 발생 가능한 향후 문제 및 한계점
* **보안 규칙에 의한 DB 업데이트 실패 (Missing or insufficient permissions)**:
  * 안전한 데이터 관리를 위해 Firestore Security Rules는 일반 사용자(`user`)가 클라이언트 사이드에서 직접 본인의 권한(`role`) 필드를 수정하는 행위를 차단합니다. 
  * 이로 인해 클라이언트 앱에서 `updateDoc(userRef, { role: 'manager' })`를 호출할 때 권한 부족 오류가 콘솔에 출력되며 실제 데이터베이스의 `role` 값은 `user`로 유지됩니다.

### 4) 해결 방법 및 장단점 비교
* **프론트엔드 단 메모리 우회**: 승인 조건 충족 시, DB 수정에 실패하더라도 프론트엔드 유저 상태 객체의 `role` 값을 임시로 `'manager'`로 채워 리턴하여 UI와 권한 체크가 정상 동작하도록 설계했습니다.
* **Firebase Cloud Functions 도입 (장기 권장)**: `status === 'approved'` 트리거를 사용하여 서버 사이드에서 안전하게 `role`을 업데이트하는 방안입니다. (Blaze 요금제 필요)

---

## 2. 회원가입 레이스 컨디션 해결 (2026-06-22)

### 1) 목적 및 요구사항
* 회원가입 직후, 아직 유저 정보가 Firestore(`users/{uid}`)에 저장되기 전에 강제로 로그아웃(`signOut`)이 수행되면서 세션이 만료되어 문서 생성이 실패하는 레이스 컨디션 문제를 해결합니다.

### 2) 세부 구현 사항
* **동기화 순서 보장**:
  * [signup.tsx](file:///c:/project/specialclean/src/home_parts/menu_parts/signup.tsx)에서 회원가입 처리 시, `createUserWithEmailAndPassword` 및 `sendEmailVerification` 완료 직후 즉시 `signOut`을 수행하지 않고 `await syncUserDocument(cred.user)`를 호출하여 Firestore에 사용자 문서가 정상 기록될 때까지 대기하도록 변경했습니다.
  * 문서 작성이 안전하게 끝난 후 `await signOut(auth)`가 호출되어 비인증 상태로 인한 쓰기 권한 에러(Missing or insufficient permissions)를 원천 차단했습니다.

---

## 3. 공지사항 CRUD 권한 제한 및 단독 상세 페이지 구현 (2026-06-22)

### 1) 목적 및 요구사항
* 공지사항 목록에서 제목을 클릭하면 아래로 아코디언 형태로 열리는 연출을 폐지하고, 전용 상세 페이지로 이동(URL 쿼리 파라미터 매핑)하도록 개편합니다.
* 어드민 권한(`role === 'admin'`)을 가진 사용자만 공지사항을 등록/수정/삭제할 수 있도록 하고, 클라이언트 UI 및 Firestore 보안 규칙과 연계하여 권한 관리를 철저히 합니다.

### 2) 세부 구현 사항
* **쿼리 파라미터 라우팅 연동**:
  * [routes.tsx](file:///c:/project/specialclean/src/routes/routes.tsx)의 `/info` 경로 `validateSearch`를 수정하여 `id?: string` 파라미터를 지원하도록 설정했습니다.
  * [info.tsx](file:///c:/project/specialclean/src/home_parts/menu_parts/info_parts/info.tsx)에서 `useSearch`로 가져온 `id` 값을 하위 `NoticePage`에 `noticeId` prop으로 전달하도록 구현했습니다.
* **상세 페이지 및 목록 전환**:
  * [notice.tsx](file:///c:/project/specialclean/src/home_parts/menu_parts/info_parts/notice.tsx)에서 `noticeId`가 존재하면 상세 뷰를 렌더링하고, 존재하지 않으면 전체 목록을 렌더링합니다.
  * 공지사항 클릭 시 `navigate({ search: (prev) => ({ ...prev, id }) })`를 통해 상세 페이지로 라우팅하며, 상세 페이지의 `[목록으로]` 버튼 클릭 시 `id` 파라미터를 비우고 목록으로 회귀하게 처리했습니다.
* **어드민 전용 수정 및 삭제**:
  * `notice.tsx`에서 로그인 세션의 `isAdmin` 값에 따라 [수정], [삭제] 버튼 노출을 제어합니다.
  * **수정**: 등록 시 사용하던 모달을 재사용하여 공지의 기존 값들로 채워 넣고, `updateDoc`을 호출해 Firestore 문서를 수정합니다.
  * **삭제**: `window.confirm`을 거쳐 `deleteDoc`을 호출해 삭제하며, 현재 상세 뷰에 있던 공지가 삭제되면 자동으로 목록 화면으로 돌려보냅니다.

### 3) 발생 가능한 향후 문제 및 한계점
* **동시성 수정 제어**: 두 명 이상의 어드민이 동시에 하나의 공지사항을 수정하는 경우 덮어쓰기 문제가 발생할 수 있습니다.
* **이미지 첨부 미지원**: 현재 본문은 텍스트 영역(`textarea`)으로만 입력받으므로 마크다운 이미지나 리치 텍스트 서식을 표현할 수 없습니다.

### 4) 해결 방법 및 장단점 비교
* **수정 덮어쓰기**: 현재 프로젝트 규모에서는 어드민 수가 극소수이므로 수동 충돌 방지(수정 시각 비교 등)로 대응 가능하며, 향후 필요 시 Firestore Transaction 도입을 고려합니다.
* **리치 텍스트 에디터 도입**: 마크다운 에디터(React Quill 등)나 Firebase Storage 연동을 구현하여 이미지 업로드가 가능한 공지사항으로 업그레이드할 수 있습니다.

---

## 4. 읽지 않은 공지사항 알림 뱃지 표시 기능 (2026-06-22)

### 1) 목적 및 요구사항
* 일반 유저(비어드민 및 비로그인 유저)가 사이트에 접속했을 때, 아직 읽지 않은 새 공지사항이 있다면 메인 메뉴(햄버거 버튼), 정보 페이지 탭, 그리고 공지사항 목록 내 제목 옆에 빨간색 알림 뱃지를 노출하여 조회를 유도합니다.

### 2) 세부 구현 사항
* **전역 상태 연동**:
  * [logincontext.tsx](file:///c:/project/specialclean/src/logincontext.tsx)에 `hasUnreadNotice` 상태와 이를 동적으로 갱신할 수 있는 `checkUnreadNotice` 유틸리티 함수를 제공했습니다.
  * Firestore의 `notices` 컬렉션에서 최신 10개의 공지사항 ID 목록을 조회하여, 로컬 스토리지의 `read_notice_ids`에 누락된 ID가 하나라도 있는 경우 `hasUnreadNotice`를 `true`로 격상합니다. (단, 어드민 계정의 경우 알림을 스킵합니다)
* **메인 헤더 & 상단 탭 뱃지 노출**:
  * [mymenu.tsx](file:///c:/project/specialclean/src/home_parts/mymenu.tsx)의 우측 상단 햄버거 버튼(`Bars3Icon`) 영역을 `relative` 구조로 포장하여, 읽지 않은 공지가 있을 때 우측 상단에 펄스 애니메이션이 적용된 빨간 점을 표시합니다.
  * 햄버거 메뉴를 눌러 메뉴가 펼쳐졌을 때, '정보' 텍스트 옆에 펄스 애니메이션이 포함된 빨간 점 뱃지를 노출합니다.
  * [info.tsx](file:///c:/project/specialclean/src/home_parts/menu_parts/info_parts/info.tsx)의 상단 탭 중 '공지사항' 탭 우측에 `hasUnreadNotice` 상태에 따라 부드러운 애니메이션이 들어간 원형 빨간 점 알림을 배치했습니다.
* **공지 목록 강조 및 상세 뷰 읽음 기록**:
  * [notice.tsx](file:///c:/project/specialclean/src/home_parts/menu_parts/info_parts/notice.tsx)의 **목록 뷰**에서 각 공지사항 제목 우측에 `!isAdmin`이고 로컬 스토리지에 기록이 없을 시(읽지 않은 경우) 작은 빨간 점을 노출하여 목록에서도 눈에 띄게 처리했습니다.
  * **상세 뷰**에서 사용자가 공지를 클릭해 상세 뷰로 진입하면 `useEffect` 훅을 통해 해당 공지 ID를 로컬 스토리지 `read_notice_ids`에 기록하고, 즉시 전역 `checkUnreadNotice` 상태를 새로고침하여 뱃지를 실시간으로 소멸/갱신하게 연동했습니다.

### 3) 발생 가능한 향후 문제 및 한계점
* **기기 간 상태 비동기화**: 로컬 스토리지(`localStorage`) 기반의 저장 방식이므로, 동일한 유저가 기기를 변경하거나 다른 브라우저를 사용하여 접속할 경우 이미 읽은 공지사항이 다시 읽지 않은 상태로 노출될 수 있습니다.
* **비로그인 사용자 캐시 삭제**: 브라우저의 쿠키/사이트 데이터를 지우거나 시크릿 창으로 접속하는 비로그인 사용자는 매번 모든 공지사항을 '안 읽음' 상태로 인식하게 됩니다.

### 4) 해결 방법 및 장단점 비교
* **Firestore User Profile 서브컬렉션 연계**: 로그인한 유저에 한해 읽은 공지 정보를 DB에 기록(예: `/users/{uid}/read_notices`)하여 멀티 기기 간의 싱크를 구현할 수 있습니다. 다만, 비로그인 방문자 대상으로는 여전히 로컬 스토리지 등의 클라이언트 캐시 제어가 필요합니다.

---

## 5. 검색창 전역 필터 연동 및 최근 검색어 기능 구현 (2026-06-22)

### 1) 목적 및 요구사항
* 홈 화면 상단의 검색 인풋 키워드가 실제 하단 업체 목록의 필터링에 반영되도록 전역 `SearchContext`와 연동합니다.
* 사용자가 검색창에 입력하는 키워드의 매칭 대상 범위를 업체 소개글을 제외하고 오직 업체명(`name`)으로만 한정합니다.
* 사용자가 검색창에 포커스를 주었을 때 최근 검색한 목록(최대 5개, 개별 삭제 지원)을 제공하는 드롭다운 구조를 확립합니다. (의도된 업체명 매칭에 혼선을 주던 '이사 청소' 등의 고정 카테고리형 추천 키워드는 의도적으로 제외합니다)

### 2) 세부 구현 사항
* **검색 범위 업체명 한정**:
  * [filterBusinesses.ts](file:///c:/project/specialclean/src/lib/filterBusinesses.ts)의 `filterByText` 함수 내에서 `shortDescription` 매칭을 제거하고 `biz.name`이 검색 질의어(`query`)를 포함하고 있는지만 필터링하도록 축소했습니다.
* **입력 확정 및 트리거 제어**:
  * [searchbox.tsx](file:///c:/project/specialclean/src/home_parts/searchbox.tsx)에서 사용자가 키보드로 타이핑하는 입력 값은 로컬 `inputValue`로 통제합니다.
  * 입력 중에 매 타이핑마다 비싼 필터링 루프가 반복되는 것을 제어하기 위해, `Enter` 키 입력 혹은 우측 돋보기 아이콘 버튼 클릭 시에만 전역 `setQuery`가 동작하도록 이벤트 흐름을 최적화했습니다.
* **최근 검색어 로컬 캐싱 및 UI 연동**:
  * 검색이 트리거될 때마다 브라우저 로컬 스토리지의 `recent_searches` 배열에 해당 키워드를 중복 없이 추가하고 최신 순 5개만 필터해 보관합니다.
  * 검색창 영역 하단에 커스텀 드롭다운 컨테이너를 배치하여, [최근 검색어] 목록을 깔끔하게 출력했습니다.
  * 최근 검색어 목록 우측의 X 버튼을 클릭하면 `recentSearches` 상태 및 로컬 스토리지 목록에서 실시간으로 해당 키워드 기록이 제거되도록 핸들러(`deleteRecentSearch`)를 마련했습니다.
  * 드롭다운의 키워드 항목을 누르면 인풋창의 글자가 채워짐과 동시에 즉시 전역 검색이 실행됩니다.

### 3) 발생 가능한 향후 문제 및 한계점
* **결과 없음 상태 개선 필요**: 현재 검색 결과가 0개인 경우 하단 목록에 단순 텍스트 안내만 출력되므로, 추천 키워드 재검색 링크 등 사용자 이탈을 방지할 장치가 미비합니다.
* **초성 검색 미지원**: 한글 자모음 분리가 구현되어 있지 않아 '청소'를 검색할 때 'ㅊㅅ'과 같은 초성만 입력하면 일치하는 업체 이름이 매칭되지 않습니다.

### 4) 해결 방법 및 장단점 비교
* **초성 및 자음 분리 검색 라이브러리 도입 (Hangul-JS 등)**: 사용자가 초성 검색을 즐겨 사용할 경우, 한글 자모 코드를 분리 매칭하는 필터링 유틸리티를 `filterByText`에 도입하여 검색 편의성을 비약적으로 향상시킬 수 있습니다.

---

## 6. 협력 업체 노출 순위, 사용자 지정 정렬, 모바일 최적화 및 크로스플랫폼 규칙 등록 (2026-06-24)

### 1) 목적 및 요구사항
- 협력 업체를 기본 검색 목록 상단에 투명하게 배치하되, 이 정렬 방식을 정보 탭에 상세히 고지하여 노출의 투명성을 담보합니다.
- 사용자에게 `기본순(가입순)`, `북마크 많은 순`, `리뷰 많은 순` 정렬 기준을 제공합니다.
- 관리자 페이지의 업체 신청 승인 팝업에서 협력 업체 지정 기능(`isPartner`)을 구현하고, 기존 협력 업체 개수 `n`에 대해 자동으로 `n+1` 순위(`partnerRank`)를 자동 산정하여 저장합니다.
- 모바일 뷰포트에서 총 개수 안내 영역과 정렬 드롭다운이 겹치거나 왜곡되지 않도록 반응형 층 쌓기 (`flex-col`) 및 텍스트 간소화를 보장하며, 프로젝트 전역의 UI/UX 크로스플랫폼 지침 규칙을 명문화합니다.

### 2) 세부 구현 사항
- **노출 투명성 정보 고지**:
  - [about.tsx](file:///c:/project/specialclean/src/home_parts/menu_parts/info_parts/about.tsx) 내에 3단계 노출 우선순위 기준과 "협력 업체 우선 노출 고지"를 신설하여 사용자가 투명하게 인지할 수 있도록 하였습니다.
- **정렬 옵션 드롭다운 및 뱃지 구현**:
  - [BusinessList.tsx](file:///c:/project/specialclean/src/home_parts/BusinessList.tsx) 리스트 상단에 `sortBy` 전역 상태와 연계된 셀렉트 박스를 렌더링하고, 모바일 화면에서는 세로 정렬(`flex-col`)로 전환되어 겹침을 방지하고 옵션명을 축약(`기본순`, `북마크 많은 순`, `리뷰 많은 순`)하여 레이아웃 어그러짐을 해소했습니다.
  - 리스트 카드에 `🤝 협력 업체` 뱃지 UI를 도입하여 제휴 상태를 시각화했습니다.
- **자동 순위 계산 및 승인 로직 변경**:
  - [ApplicationDetailModal.tsx](file:///c:/project/specialclean/src/home_parts/menu_parts/mypage_parts/ApplicationDetailModal.tsx) 하단에 "협력 업체로 등록" 체크박스를 구현했습니다.
  - [mypage.tsx](file:///c:/project/specialclean/src/home_parts/menu_parts/mypage.tsx)의 `handleApprove`에서 `isPartnerSelected` 플래그를 수신하여 `true`일 경우, `businessApplications` 컬렉션에서 `status == 'approved'` 및 `isPartner == true` 조건을 만족하는 기존 협력 업체 문서 개수 `n`을 조회한 후 `partnerRank = n + 1`을 동적 할당하여 저장합니다.
- **프로젝트 UI/UX 규칙 명문화**:
  - [.agents/AGENTS.md](file:///c:/project/specialclean/.agents/AGENTS.md)를 생성하여 향후 모든 UI 수정 요구 시 데스크톱과 모바일 레이아웃의 상호 작용 및 반응형 깨짐 문제를 예방하는 크로스플랫폼 설계를 의무 규정으로 명시했습니다.




