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
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
});
