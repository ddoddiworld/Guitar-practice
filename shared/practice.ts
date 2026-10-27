import { z } from "zod";
export const songSchema = z.object({
  id: z.string().max(80),
  title: z.string().trim().min(1).max(100),
  artist: z.string().trim().max(100),
  bpm: z.number().int().min(30).max(240),
  progress: z.number().int().min(0).max(100),
});
export const recordSchema = z.object({
  id: z.string().max(80),
  date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .refine((v) => {
      const d = new Date(v);
      return Number.isFinite(d.getTime()) && d.toISOString().slice(0, 10) === v;
    }),
  songId: z.string().max(80),
  minutes: z.number().int().min(1).max(600),
  category: z.enum(["테크닉", "연습곡", "리듬", "이론"]),
  note: z.string().trim().max(500),
});
export type Song = z.infer<typeof songSchema>;
export type PracticeRecord = z.infer<typeof recordSchema>;
export const planRequestSchema = z.object({
  goal: z.string().trim().min(1).max(500),
  dailyMinutes: z.number().int().min(10).max(180),
  songs: z.array(songSchema).max(50),
  records: z.array(recordSchema).max(100),
});
export function localDate(date = new Date()) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}
export function weekDays(today = new Date()) {
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(today);
    d.setDate(d.getDate() - 6 + i);
    return localDate(d);
  });
}
export function summarize(records: PracticeRecord[], today = new Date()) {
  const days = weekDays(today);
  const daily = days.map((date) => ({
    date,
    minutes: records
      .filter((r) => r.date === date)
      .reduce((n, r) => n + r.minutes, 0),
  }));
  const dates = new Set(records.map((r) => r.date));
  let streak = 0;
  const cursor = new Date(today);
  if (!dates.has(localDate(cursor))) cursor.setDate(cursor.getDate() - 1);
  while (dates.has(localDate(cursor))) {
    streak++;
    cursor.setDate(cursor.getDate() - 1);
  }
  return {
    daily,
    total: records.reduce((n, r) => n + r.minutes, 0),
    weekly: daily.reduce((n, d) => n + d.minutes, 0),
    streak,
  };
}
