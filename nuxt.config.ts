export default defineNuxtConfig({
  compatibilityDate: "2026-01-01",
  devtools: { enabled: false },
  nitro: {
    cloudflare: { nodeCompat: process.env.FRET_LAB_TARGET === "cloudflare" },
  },
  css: ["~/assets/main.css"],
  app: {
    head: {
      title: "Fret Lab · 매일, 한 마디 더",
      meta: [
        {
          name: "description",
          content: "기타 연습 기록, 레퍼토리와 연습 대시보드",
        },
      ],
      htmlAttrs: { lang: "ko" },
    },
  },
});
