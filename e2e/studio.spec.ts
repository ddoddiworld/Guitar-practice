import { test, expect } from "@playwright/test";
test("songs, records, persistence, dashboard and metronome", async ({
  page,
}) => {
  await page.goto("/");
  await expect(
    page.getByRole("heading", { name: "좋은 연습이 쌓이는 곳." }),
  ).toBeVisible();
  await page.getByRole("button", { name: "♫ 연습곡", exact: true }).click();
  await page.getByLabel("곡 제목").fill("Blackbird");
  await page.getByLabel("아티스트").fill("The Beatles");
  await page
    .getByRole("button", { name: "＋ 연습곡 추가", exact: true })
    .click();
  await expect(page.getByText("Blackbird", { exact: true })).toBeVisible();
  await page.getByLabel("Blackbird 완성도").fill("45");
  await page.reload();
  await page.getByRole("button", { name: "♫ 연습곡", exact: true }).click();
  await expect(page.getByLabel("Blackbird 완성도")).toHaveValue("45");
  await page.getByRole("button", { name: "▤ 연습 기록", exact: true }).click();
  await page
    .getByRole("combobox", { name: "연습곡", exact: true })
    .selectOption({ label: "Blackbird" });
  await page.getByLabel("연습 시간 (분)").fill("25");
  await page.getByLabel("연습 메모").fill("코드 전환 연습");
  await page.getByRole("button", { name: "기록 저장" }).click();
  await expect(page.getByText("코드 전환 연습", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "◫ 대시보드", exact: true }).click();
  await expect(page.locator(".stat-card").nth(1)).toContainText("25");
  await expect(page.locator(".stat-card").nth(2)).toContainText("1");
  await page.getByRole("button", { name: "▶ 시작" }).click();
  await expect(page.getByRole("button", { name: "■ 정지" })).toBeVisible();
  await expect(page.locator(".beats .lit")).toHaveCount(1);
  await page.getByRole("button", { name: "■ 정지" }).click();
  await page
    .getByRole("button", { name: "주간 계획", exact: false })
    .first()
    .click();
  await page.getByRole("button", { name: "✧ 주간 계획 생성" }).click();
  await expect(page.getByRole("alert")).toContainText("API 키");
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
});
test("generated plan is displayed safely and API receives history", async ({
  page,
}) => {
  await page.route("**/api/plan", async (route) => {
    expect(route.request().postDataJSON().dailyMinutes).toBe(30);
    await route.fulfill({
      json: {
        plan: "월요일: 준비운동 5분, 코드 10분, 연습곡 10분, 회고 5분\n<script>alert(1)</script>",
      },
    });
  });
  await page.goto("/");
  await page
    .getByRole("button", { name: "주간 계획", exact: false })
    .first()
    .click();
  await page.getByRole("button", { name: "✧ 주간 계획 생성" }).click();
  await expect(page.locator(".plan-result pre")).toContainText(
    "<script>alert(1)</script>",
  );
});
