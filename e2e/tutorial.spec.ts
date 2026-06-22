import { test, expect } from '@playwright/test';

test.describe('SpecialClean Interactive Tutorial E2E Tests', () => {
  
  test.beforeEach(async ({ page }) => {
    // Clear localStorage before each test to start from a clean state
    await page.goto('/');
    await page.evaluate(() => localStorage.clear());
  });

  test('Scenario 1: 최초 접속 시 튜토리얼 유도 모달 노출 확인 및 거절 시 모달 소멸 검증', async ({ page }) => {
    // 1. 최초 접속
    await page.goto('/');
    
    // 2. 모달 노출 확인
    const modalTitle = page.locator('text=클린 매칭 서비스에 오신 것을 환영합니다!');
    await expect(modalTitle).toBeVisible();
    
    const skipBtn = page.locator('#tutorial-skip-btn');
    await expect(skipBtn).toBeVisible();

    // 3. 거절(나중에 볼게요) 클릭
    await skipBtn.click();

    // 4. 모달 소멸 검증
    await expect(modalTitle).not.toBeVisible();

    // 5. 로컬스토리지에 저장되었는지 확인
    const tutorialShown = await page.evaluate(() => localStorage.getItem('tutorial_shown'));
    expect(tutorialShown).toBe('true');

    // 6. 재접속 시 모달이 다시 뜨지 않는지 검증
    await page.reload();
    await expect(modalTitle).not.toBeVisible();
  });

  test('Scenario 2: 튜토리얼 수동 실행 시 첫 번째 가이드 단계 말풍선과 하이라이트 레이어 출현 검증', async ({ page }) => {
    // 1. 모달을 거절하고 로컬스토리지를 채움
    await page.goto('/');
    await page.locator('#tutorial-skip-btn').click();

    // 2. 마이메뉴 버튼 클릭하여 드롭다운 오픈
    const menuBtn = page.locator('#mymenu-button');
    await expect(menuBtn).toBeVisible();
    await menuBtn.click();

    // 3. '서비스 튜토리얼 시작' 버튼 클릭
    const tourBtn = page.locator('text=서비스 튜토리얼 시작');
    await expect(tourBtn).toBeVisible();
    await tourBtn.click();

    // 4. 첫 번째 단계 말풍선(joyride-tooltip)과 제목 검증
    const tooltipTitle = page.locator('text=🔍 업체 검색');
    await expect(tooltipTitle).toBeVisible({ timeout: 5000 });

    // 5. 다음 단계 진행 테스트
    const nextBtn = page.locator('button[data-action="primary"]');
    await expect(nextBtn).toBeVisible();
    await nextBtn.click();

    // 6. 두 번째 단계 제목 검증
    const secondTitle = page.locator('text=📍 지역 · 서비스 · 업체특성 필터');
    await expect(secondTitle).toBeVisible({ timeout: 5000 });
  });

  test('Scenario 3: 말풍선 내부의 건너뛰기 클릭 시 튜토리얼 오버레이 정상 제거 검증', async ({ page }) => {
    // 1. 모달 거절 후 홈 진입
    await page.goto('/');
    await page.locator('#tutorial-skip-btn').click();

    // 2. 마이메뉴 -> 서비스 튜토리얼 시작
    await page.locator('#mymenu-button').click();
    await page.locator('text=서비스 튜토리얼 시작').click();

    // 3. 첫 번째 단계 말풍선 노출 확인
    const tooltipTitle = page.locator('text=🔍 업체 검색');
    await expect(tooltipTitle).toBeVisible({ timeout: 5000 });

    // 4. 건너뛰기 버튼(skip) 클릭
    const skipBtn = page.locator('button[data-action="skip"]');
    await expect(skipBtn).toBeVisible();
    await skipBtn.click();

    // 5. 말풍선과 오버레이가 완전히 제거되었는지 확인
    await expect(tooltipTitle).not.toBeVisible();
    await expect(page.locator('.joyride-tooltip')).not.toBeVisible();
  });
});
