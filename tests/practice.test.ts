import { describe, it, expect } from "vitest";
import {
  summarize,
  recordSchema,
  songSchema,
  planRequestSchema,
  weekDays,
  type PracticeRecord,
} from "../shared/practice";
const record = (date: string, minutes = 30): PracticeRecord => ({
  id: date,
  date,
  minutes,
  songId: "",
  category: "리듬",
  note: "",
});
describe("practice statistics", () => {
  it("handles an empty studio", () => {
    expect(summarize([], new Date(2026, 9, 27))).toMatchObject({
      total: 0,
      weekly: 0,
      streak: 0,
    });
  });
  it("groups multiple sessions and excludes older sessions from the week", () => {
    const result = summarize(
      [
        record("2026-10-20", 80),
        record("2026-10-21"),
        record("2026-10-27", 20),
        record("2026-10-27", 10),
      ],
      new Date(2026, 9, 27),
    );
    expect(result.total).toBe(140);
    expect(result.weekly).toBe(60);
    expect(result.daily.at(-1)?.minutes).toBe(30);
  });
  it("continues yesterday’s streak before today’s session", () => {
    expect(
      summarize(
        [record("2026-10-25"), record("2026-10-26")],
        new Date(2026, 9, 27),
      ).streak,
    ).toBe(2);
  });
  it("crosses month and year boundaries", () => {
    expect(weekDays(new Date(2026, 0, 2))[0]).toBe("2025-12-27");
    expect(
      summarize(
        [record("2025-12-31"), record("2026-01-01"), record("2026-01-02")],
        new Date(2026, 0, 2),
      ).streak,
    ).toBe(3);
  });
});
describe("input validation", () => {
  it("rejects impossible dates and unbounded durations", () => {
    expect(recordSchema.safeParse(record("2026-02-30")).success).toBe(false);
    expect(recordSchema.safeParse(record("2026-10-27", 0)).success).toBe(false);
    expect(recordSchema.safeParse(record("2026-10-27", 601)).success).toBe(
      false,
    );
  });
  it("rejects empty song names and invalid tempos", () => {
    expect(
      songSchema.safeParse({
        id: "1",
        title: " ",
        artist: "",
        bpm: 90,
        progress: 0,
      }).success,
    ).toBe(false);
    expect(
      songSchema.safeParse({
        id: "1",
        title: "Song",
        artist: "",
        bpm: 241,
        progress: 0,
      }).success,
    ).toBe(false);
  });
  it("bounds API payloads", () => {
    expect(
      planRequestSchema.safeParse({
        goal: "Test",
        dailyMinutes: 30,
        songs: [],
        records: [],
      }).success,
    ).toBe(true);
    expect(
      planRequestSchema.safeParse({
        goal: "Test",
        dailyMinutes: 300,
        songs: [],
        records: [],
      }).success,
    ).toBe(false);
  });
});
