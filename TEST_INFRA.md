# E2E Test Infra: SpecialClean Interactive Tutorial

## Test Philosophy
- Opaque-box, requirement-driven. No dependency on implementation design.
- Methodology: Category-Partition + BVA + Pairwise + Workload Testing.

## Feature Inventory
| # | Feature | Source (requirement) | Tier 1 | Tier 2 | Tier 3 |
|---|---------|---------------------|:------:|:------:|:------:|
| 1 | First-time Visitor Modal | ORIGINAL_REQUEST R2 | 5      | 5      | ✓      |
| 2 | Interactive Guide Tour | ORIGINAL_REQUEST R1 | 5      | 5      | ✓      |
| 3 | Manual Dropdown Trigger | ORIGINAL_REQUEST R3 | 5      | 5      | ✓      |

## Test Architecture
- Test runner: Playwright (using `@playwright/test`)
- Test command: `npx playwright test`
- Directory layout:
  - Configuration: `playwright.config.ts`
  - Test files: `tests/tutorial.spec.ts`

## Coverage Details
### Tier 1 - Feature Coverage (15 tests total)
- **Modal Features**:
  - `T1.1.1`: Shows modal on first visit (no localStorage key).
  - `T1.1.2`: Clicking "나중에 볼게요" (Reject) closes the modal.
  - `T1.1.3`: Rejecting the modal sets `tutorial_shown` to true in localStorage.
  - `T1.1.4`: Confirming the modal ("✨ 투어 시작하기") closes the modal.
  - `T1.1.5`: Confirming the modal starts the Home tour.
- **Tour Features**:
  - `T1.2.1`: Joyride tour runs on Home page when activeTour is 'home'.
  - `T1.2.2`: Joyride tour runs on Mypage when activeTour is 'mypage'.
  - `T1.2.3`: Home tour steps are defined and rendered.
  - `T1.2.4`: Mypage tour steps are defined and rendered.
  - `T1.2.5`: Highlighting first target step on Home page.
- **Manual Trigger**:
  - `T1.3.1`: MyMenu dropdown has the "서비스 튜토리얼 시작" button.
  - `T1.3.2`: Clicking "서비스 튜토리얼 시작" on Home page starts the Home tour.
  - `T1.3.3`: Clicking "서비스 튜토리얼 시작" on MyPage starts the MyPage tour.
  - `T1.3.4`: Clicking it on another page (e.g. `/info`) redirects to Home page and starts the tour.
  - `T1.3.5`: Dropdown menu closes after clicking the tutorial button.

### Tier 2 - Boundary & Corner Cases (15 tests total)
- **Modal Boundaries**:
  - `T2.1.1`: When `tutorial_shown` is "true" in localStorage, the modal does NOT show on load.
  - `T2.1.2`: When `tutorial_shown` is "false" or empty string, shows modal.
  - `T2.1.3`: User clears localStorage and reloads -> modal shows again.
  - `T2.1.4`: Clicking the backdrop of the modal does not close it.
  - `T2.1.5`: Clicking close 'X' button on modal acts same as reject.
- **Tour Boundaries**:
  - `T2.2.1`: Clicking "건너뛰기" (Skip) in Joyride tooltip terminates the tour.
  - `T2.2.2`: Clicking "완료" (Last) on the last step of the tour terminates it.
  - `T2.2.3`: Refreshing page mid-tour resets/stops the tour.
  - `T2.2.4`: Missing elements do not crash the Joyride component.
  - `T2.2.5`: Verify Tour elements are layered on top with correct z-index.
- **Manual Trigger Boundaries**:
  - `T2.3.1`: Triggering tutorial manually when the modal is still open is prevented.
  - `T2.3.2`: Triggering tour manually when already in a tour restarts or ignores.
  - `T2.3.3`: Triggering tour manually as non-logged-in user vs logged-in user.
  - `T2.3.4`: Triggering tour from MyPage when not logged in redirects.
  - `T2.3.5`: Triggering tour from a route that doesn't exist redirects to Home and starts Home tour.

### Tier 3 - Cross-Feature Combinations (3 tests)
- `T3.1`: First-time user modal -> accept -> starts tour -> click skip -> then click manual trigger -> tour starts again.
- `T3.2`: First-time user modal -> reject -> then click manual trigger on Home -> tour starts -> complete tour -> click manual trigger on MyPage -> MyPage tour starts.
- `T3.3`: Direct navigation to MyPage as first-time visitor -> modal shows -> accept -> navigates to Home, starts Home tour.

### Tier 4 - Real-World Application Scenarios (5 tests)
- `T4.1`: Happy path: New user visits -> welcomes modal -> click "나중에 볼게요" -> explores site -> clicks MyMenu dropdown -> clicks "서비스 튜토리얼 시작" -> walks through all Home tour steps (clicks Next for all) -> completes tour.
- `T4.2`: Login and Mypage Tour: User logs in -> navigates to MyPage -> clicks MyMenu -> clicks "서비스 튜토리얼 시작" -> walks through all MyPage tour steps (clicks Next for all) -> completes tour.
- `T4.3`: Skip and restart: User starts Home tour via MyMenu -> clicks Next twice -> clicks "건너뛰기" -> goes to MyPage -> starts MyPage tour via MyMenu -> clicks "건너뛰기" -> goes back to Home -> starts Home tour via MyMenu again.
- `T4.4`: Responsive/Mobile: User accesses on mobile screen -> welcome modal shown -> user accepts -> Home tour starts -> verify tour tooltip is readable.
- `T4.5`: Multiple tours in a single session: First-time user completes Home tour, logs in, goes to MyPage, completes MyPage tour, logs out, checks if modal is shown (no).
