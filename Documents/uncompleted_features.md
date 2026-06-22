# 미완성 및 오류 기능 명세서 (Uncompleted & Error Features Specification)

이 문서는 클린 매칭 서비스의 현재 미완성이거나 개선이 필요한 주요 기능 및 오류 사항에 대해 정리한 명세서입니다. 각 기능의 목적, 현재 상태, 그리고 향후 구현 및 해결 방안을 기술합니다.

---

## 1. 회원가입 및 회원탈퇴 기능 (Signup & Account Withdrawal)

### [기능 설명]
- **회원가입**: 신규 사용자가 이메일/비밀번호를 입력하여 계정을 생성하고, 인증 이메일을 발송받은 뒤 로그인을 진행하는 기능입니다.
- **회원탈퇴**: 가입된 사용자가 자신의 계정을 삭제하고, Firestore에 기록된 유저 데이터(`users/{uid}`)를 함께 정리하는 기능입니다.

### [현재 상태 및 문제점]
- **회원가입 시 레이스 컨디션(Race Condition) 발생 가능성**:
  - `signup.tsx`에서 `createUserWithEmailAndPassword`로 계정을 생성하면 Firebase Auth에서 즉시 로그인 상태가 되며, 이는 `logincontext.tsx`의 `onAuthStateChanged` 리스너를 실행시킵니다.
  - 이 리스너는 Firestore의 `users/{uid}` 경로에 사용자 정보를 생성하는 `syncUserDocument` 함수를 비동기로 호출합니다.
  - 그러나 `signup.tsx`에서는 가입 완료 직후 `signOut(auth)`를 동기/비동기적으로 즉시 실행하여 강제 로그아웃을 시킵니다.
  - 이로 인해 Firestore에 유저 문서가 정상적으로 생성되기 전에 세션이 끊어져 `syncUserDocument`가 실패하거나 권한 오류가 발생할 수 있습니다.
- **회원탈퇴 시 재인증(Reauthentication) 문제**:
  - Firebase Auth는 계정 삭제(`deleteUser`)와 같이 민감한 작업을 수행할 때 최근 로그인 정보가 없으면 `auth/requires-recent-login` 에러를 반환합니다.
  - 이 에러 발생 시 사용자에게 재인증을 요구하고 올바르게 세션을 갱신해야 하나, 현재 구글 로그인 등 소셜 계정의 경우 팝업 차단 등의 이유로 재인증 단계에서 예외가 발생할 위험이 있습니다.
  - 또한 탈퇴 프로세스 진행 시 Firestore 문서(`users/{uid}`)를 먼저 삭제한 후 계정을 삭제해야 하며, 이 과정의 예외 처리가 완벽해야 합니다.

### [구현 및 해결 방안]
- **회원가입 로직 개선**:
  - 회원가입 후 즉시 `signOut`을 호출하는 대신, `createUserWithEmailAndPassword` 호출 성공 후 클라이언트 단에서 수동으로 `syncUserDocument`를 호출하여 성공한 것을 보장한 후에 `signOut`을 실행하는 방식으로 동기화 순서를 보장합니다.
- **회원탈퇴 및 재인증 예외 처리 강화**:
  - `deleteUser` 실행 중 `auth/requires-recent-login` 에러 발생 시 사용자에게 명확한 다이얼로그나 안내 창을 통해 재인증 프로세스(이메일 사용자는 비밀번호 입력 재인증, 구글 사용자는 구글 로그인 재시도)를 정상적으로 거치도록 설계합니다.
  - 회원탈퇴 성공 시, 로컬 스토리지 및 전역 컨텍스트(`AuthContext`) 초기화를 확실하게 마친 후 루트 경로(`/`)로 즉시 안전하게 리다이렉트합니다.

---

## 2. 검색창 및 SearchContext 연동 (Search Box & Context) - [완료]

### [기능 설명]
- 홈 화면 상단에 있는 검색창에 키워드를 입력하거나 최근/추천 검색어를 클릭했을 때, 해당 검색어 정보를 전역 상태에 반영하여 하단의 업체 목록(`BusinessList`)을 실시간 필터링하는 기능입니다.

### [현재 상태 및 구현 완료 내역]
- **구현 완료**:
  * [searchbox.tsx](file:///c:/project/specialclean/src/home_parts/searchbox.tsx) 컴포넌트가 `useSearch()` 훅의 전역 `query`/`setQuery`와 완벽히 바인딩되었습니다.
  * 검색 범위를 설명문 제외, 오직 **업체명(`name`)**으로 한정하여 검색 정확도를 높였습니다. ([filterBusinesses.ts](file:///c:/project/specialclean/src/lib/filterBusinesses.ts) 수정)
  * 인풋 창에서 실시간으로 불필요한 필터 연산이 일어나는 것을 막고자 `Enter` 키 입력 혹은 `돋보기 버튼`을 클릭할 때 최종적으로 검색이 전역 반영되는 트리거를 적용했습니다.
  * 검색 확정 시 중복 없이 최근 5개 키워드를 로컬 스토리지에 저장하고, 드롭다운에 **[최근 검색어]**(X 버튼 개별 삭제 가능)와 **[추천 키워드]**를 나누어 노출하는 세련된 검색 UX를 완성했습니다.


---

## 3. 마이페이지 북마크 및 리뷰 Firestore 연동 (Bookmarks & Reviews)

### [기능 설명]
- 사용자가 마음에 드는 업체를 즐겨찾기(북마크) 하거나, 서비스를 이용한 후 후기를 남기는 기능입니다.
- 마이페이지(`mypage.tsx`)의 '북마크' 탭과 '내 리뷰' 탭에서 자신이 관리하는 내역을 확인할 수 있어야 합니다.

### [현재 상태 및 문제점]
- **더미 데이터 사용**:
  - `mypage.tsx` 상단에 `dummyBookmarks`, `dummyReviews` 배열이 하드코딩되어 있습니다.
  - 사용자가 실제 가입하거나 활동하더라도 이 정보는 업데이트되지 않으며 조회할 수 없습니다.

### [구현 및 해결 방안]
- **Firestore 컬렉션 설계**:
  - `users/{uid}/bookmarks` (서브컬렉션) 혹은 `bookmarks` 공용 컬렉션에 `{ uid, businessId, createdAt }` 형태로 설계합니다.
  - `reviews` 공용 컬렉션을 신설하고 `{ reviewId, uid, businessId, rating, content, createdAt }` 스키마로 설계합니다.
- **데이터 바인딩 및 쿼리**:
  - `mypage.tsx` 로드 시 현재 로그인한 사용자의 `uid`를 기준으로 Firestore에 쿼리를 실행하여 실제 북마크와 리뷰 목록을 가져오도록 `useEffect`와 `getDocs`를 구현합니다.
  - 리뷰 작성/수정/삭제 시 Firestore 문서를 업데이트하고, 해당 업체의 평균 별점(`ratingAvg`)과 리뷰 개수(`reviewCount`)를 집계하여 해당 업체 문서(`businessApplications/{businessId}`)에도 함께 업데이트하는 트랜잭션 또는 Cloud Functions를 구축합니다.

---

## 4. 고객센터 상세 페이지 구현 (FAQ & Notice) - [완료]

### [기능 설명]
- 정보 페이지(`/info`) 내에서 사용자가 자주 묻는 질문(FAQ) 및 공지사항(Notice) 내용을 확인하는 기능입니다.

### [현재 상태 및 구현 완료 내역]
- **구현 완료**:
  - `src/home_parts/menu_parts/info_parts/faq.tsx` 및 [notice.tsx](file:///c:/project/specialclean/src/home_parts/menu_parts/info_parts/notice.tsx) 컴포넌트를 작성하여 [info.tsx](file:///c:/project/specialclean/src/home_parts/menu_parts/info_parts/info.tsx) 탭에 연결 완료했습니다.
  - 공지사항을 클릭했을 때 아코디언 방식이 아닌, URL 쿼리 파라미터 `id` 매핑을 통해 별도의 단독 상세 페이지 형태로 화면이 깔끔하게 전환되도록 구현을 마쳤습니다.
  - 어드민 계정(`role === 'admin'`)에 대해서만 공지사항의 등록, 수정, 삭제 버튼을 노출하고 Firestore의 `updateDoc` 및 `deleteDoc`과 연계하여 권한이 제한된 CRUD 조작을 지원하도록 완성했습니다.

