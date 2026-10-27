<script setup lang="ts">
import {
  localDate,
  summarize,
  songSchema,
  recordSchema,
} from "#shared/practice";
const { songs, records, storageError } = usePractice();
const metro = useMetronome();
const { bpm, beats, running, beat } = metro;
const tab = ref("대시보드"),
  tabs = ["대시보드", "연습 기록", "연습곡", "주간 계획"];
const today = useState("today", () => localDate());
onMounted(() => {
  today.value = localDate();
  recordForm.date = today.value;
});
const stats = computed(() =>
  summarize(records.value, new Date(`${today.value}T12:00:00`)),
);
const songForm = reactive({ title: "", artist: "", bpm: 90, progress: 0 });
const recordForm = reactive({
  date: today.value,
  songId: "",
  minutes: 30,
  category: "연습곡" as "연습곡" | "테크닉" | "리듬" | "이론",
  note: "",
});
const formError = ref(""),
  notice = ref(""),
  goal = ref("코드 전환을 부드럽게 하고 좋아하는 곡 한 곡 완주하기"),
  dailyMinutes = ref(30),
  accessToken = ref(""),
  plan = ref(""),
  pending = ref(false),
  planError = ref("");
const sortedRecords = computed(() =>
  [...records.value].sort((a, b) => b.date.localeCompare(a.date)),
);
function addSong() {
  const result = songSchema.safeParse({ ...songForm, id: crypto.randomUUID() });
  if (!result.success) {
    formError.value = "곡 제목과 BPM(30~240), 완성도(0~100)를 확인해 주세요.";
    return;
  }
  songs.value.push(result.data);
  Object.assign(songForm, { title: "", artist: "", bpm: 90, progress: 0 });
  formError.value = "";
  notice.value = "연습곡을 추가했습니다.";
}
function addRecord() {
  const result = recordSchema.safeParse({
    ...recordForm,
    id: crypto.randomUUID(),
  });
  if (!result.success || recordForm.date > today.value) {
    formError.value =
      "날짜와 연습 시간(1~600분)을 확인해 주세요. 미래 날짜는 기록할 수 없습니다.";
    return;
  }
  records.value.push(result.data);
  recordForm.note = "";
  formError.value = "";
  notice.value = "오늘의 한 걸음을 기록했습니다.";
}
function deleteSong(id: string) {
  if (!confirm("연습곡을 삭제할까요? 기존 연습 기록은 유지됩니다.")) return;
  songs.value = songs.value.filter((s) => s.id !== id);
}
function deleteRecord(id: string) {
  if (confirm("이 연습 기록을 삭제할까요?"))
    records.value = records.value.filter((r) => r.id !== id);
}
async function generatePlan() {
  pending.value = true;
  planError.value = "";
  try {
    const result = await $fetch("/api/plan", {
      method: "POST",
      headers: { "x-plan-token": accessToken.value },
      body: {
        goal: goal.value,
        dailyMinutes: dailyMinutes.value,
        songs: songs.value.slice(0, 50),
        records: sortedRecords.value.slice(0, 100),
      },
    });
    plan.value = result.plan;
  } catch (e: any) {
    planError.value =
      e.data?.statusMessage ||
      "계획을 생성하지 못했습니다. 잠시 후 다시 시도해 주세요.";
  } finally {
    pending.value = false;
  }
}
function exportData() {
  const blob = new Blob(
    [JSON.stringify({ songs: songs.value, records: records.value }, null, 2)],
    { type: "application/json" },
  );
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `fret-lab-${today.value}.json`;
  a.click();
  URL.revokeObjectURL(url);
}
function downloadPlan() {
  const url = URL.createObjectURL(
    new Blob([plan.value], { type: "text/plain;charset=utf-8" }),
  );
  const a = document.createElement("a");
  a.href = url;
  a.download = "fret-lab-weekly-plan.txt";
  a.click();
  URL.revokeObjectURL(url);
}
watch(tab, () => {
  formError.value = "";
  notice.value = "";
});
</script>

<template>
  <div class="shell">
    <aside class="sidebar">
      <a class="brand" href="/" aria-label="Fret Lab 홈"
        ><span class="brand-icon">♮</span> Fret<span>Lab</span
        ><small>PRACTICE MAKES PROGRESS</small></a
      >
      <div class="nav-label">MY STUDIO</div>
      <nav aria-label="주 메뉴">
        <button
          v-for="(item, i) in tabs"
          :key="item"
          :class="{ active: tab === item }"
          @click="tab = item"
        >
          <span>{{ ["◫", "▤", "♫", "✧"][i] }}</span
          >{{ item }}<b v-if="item === '주간 계획'">AI</b>
        </button>
      </nav>
      <div class="sidebar-bottom">
        <div class="mini-guitar">♬</div>
        <strong>조금씩, 매일.</strong>
        <p>오늘의 작은 연습이<br />내일의 음악이 됩니다.</p>
        <button class="text-button" @click="exportData">데이터 백업 ↗</button>
      </div>
      <div class="profile">
        <span>G</span>
        <div>나의 연습실<small>LOCAL WORKSPACE</small></div>
        <span class="online">●</span>
      </div>
    </aside>
    <main>
      <header class="topbar">
        <span
          >나의 연습실 <span class="muted">/ {{ tab }}</span></span
        ><span class="date"
          >{{ today }} <span class="status-dot">●</span> Let's play</span
        >
      </header>
      <div class="content">
        <div class="page-heading">
          <div>
            <div class="eyebrow">YOUR DAILY DOSE OF MUSIC</div>
            <h1>{{ tab === "대시보드" ? "좋은 연습이 쌓이는 곳." : tab }}</h1>
            <p>
              {{
                tab === "대시보드"
                  ? "어제보다 한 마디 더. 오늘도 나만의 리듬으로 시작해요."
                  : "작은 진전을 기록하고, 다음 연습을 준비하세요."
              }}
            </p>
          </div>
          <button
            v-if="tab === '대시보드'"
            class="primary"
            @click="tab = '연습 기록'"
          >
            ＋ 연습 기록하기
          </button>
        </div>
        <p v-if="storageError" class="error" role="alert">{{ storageError }}</p>
        <p v-if="notice" class="success" role="status">{{ notice }}</p>
        <p v-if="formError" class="error" role="alert">{{ formError }}</p>
        <template v-if="tab === '대시보드'">
          <div class="stats-grid">
            <article class="stat-card">
              <span>총 연습 시간 <i>◷</i></span
              ><strong
                >{{ Math.floor(stats.total / 60) }}<small>시간</small>
                {{ stats.total % 60 }}<small>분</small></strong
              >
              <p>차곡차곡 쌓인 나의 노력</p>
            </article>
            <article class="stat-card">
              <span>이번 주 연습 <i>▥</i></span
              ><strong>{{ stats.weekly }}<small>분</small></strong>
              <p>최근 7일의 연습 시간</p>
            </article>
            <article class="stat-card">
              <span>연속 연습 <i>♨</i></span
              ><strong>{{ stats.streak }}<small>일</small></strong>
              <p>꾸준함이 만드는 변화</p>
            </article>
            <article class="stat-card">
              <span>나의 레퍼토리 <i>♫</i></span
              ><strong>{{ songs.length }}<small>곡</small></strong>
              <p>
                {{ songs.filter((s) => s.progress === 100).length }}곡 완주 ·
                계속 도전 중
              </p>
            </article>
          </div>
          <div class="dashboard-grid">
            <section class="card chart-card">
              <div class="section-heading">
                <div>
                  <h2>연습의 리듬</h2>
                  <p>작은 시간도 모이면 큰 변화가 돼요.</p>
                </div>
                <span class="chip">최근 7일</span>
              </div>
              <div
                class="chart"
                role="img"
                :aria-label="
                  stats.daily.map((d) => `${d.date}: ${d.minutes}분`).join(', ')
                "
              >
                <div class="chart-axis">분</div>
                <div
                  v-for="day in stats.daily"
                  :key="day.date"
                  class="bar-column"
                >
                  <span>{{ day.minutes }}</span>
                  <div class="bar-track">
                    <div
                      class="bar"
                      :class="{ current: day.date === today }"
                      :style="{
                        height:
                          Math.max(
                            2,
                            (day.minutes /
                              Math.max(
                                60,
                                ...stats.daily.map((d) => d.minutes),
                              )) *
                              100,
                          ) + '%',
                      }"
                    ></div>
                  </div>
                  <small>{{ day.date.slice(5).replace("-", "/") }}</small>
                </div>
              </div>
              <div class="chart-footer">
                <span><i class="legend"></i> 일별 연습 시간</span
                ><span>이번 주도 한 걸음씩 ↗</span>
              </div>
            </section>
            <section class="card metronome">
              <div class="section-heading">
                <div>
                  <h2>메트로놈</h2>
                  <p>흔들림 없는 나만의 템포</p>
                </div>
                <span>◉</span>
              </div>
              <div class="tempo-value">{{ bpm }}<small>BPM</small></div>
              <input
                v-model.number="bpm"
                aria-label="BPM"
                type="range"
                min="30"
                max="240"
              />
              <div class="tempo-controls">
                <button
                  aria-label="템포 줄이기"
                  @click="bpm = Math.max(30, bpm - 1)"
                >
                  −</button
                ><span>30 <span class="muted">—</span> 240</span
                ><button
                  aria-label="템포 늘리기"
                  @click="bpm = Math.min(240, bpm + 1)"
                >
                  ＋
                </button>
              </div>
              <div class="beats">
                <span
                  v-for="n in beats"
                  :key="n"
                  :class="{ lit: beat === n }"
                ></span>
              </div>
              <div class="metronome-bottom">
                <label
                  >박자
                  <select v-model.number="beats">
                    <option :value="3">3/4</option>
                    <option :value="4">4/4</option>
                    <option :value="6">6/8</option>
                  </select></label
                ><button
                  class="primary"
                  @click="running ? metro.stop() : metro.start()"
                >
                  {{ running ? "■ 정지" : "▶ 시작" }}
                </button>
              </div>
              <p v-if="metro.error.value" class="error">
                {{ metro.error.value }}
              </p>
            </section>
            <section class="card repertoire">
              <div class="section-heading">
                <div>
                  <h2>연습 중인 곡</h2>
                  <p>완주를 향해, 한 소절씩.</p>
                </div>
                <button class="text-button" @click="tab = '연습곡'">
                  전체 보기 ↗
                </button>
              </div>
              <div v-if="!songs.length" class="empty">
                <span>♫</span>
                <h3>어떤 곡을 연주하고 싶나요?</h3>
                <p>첫 연습곡을 추가하고 완주를 시작해 보세요.</p>
                <button class="secondary" @click="tab = '연습곡'">
                  ＋ 연습곡 추가
                </button>
              </div>
              <div
                v-for="song in songs.slice(0, 3)"
                :key="song.id"
                class="song-row"
              >
                <div class="song-icon">♫</div>
                <div class="song-info">
                  <strong>{{ song.title }}</strong
                  ><small
                    >{{ song.artist || "아티스트 미입력" }} ·
                    {{ song.bpm }} BPM</small
                  >
                </div>
                <div class="progress-wrapper">
                  <span>{{ song.progress }}%</span
                  ><progress :value="song.progress" max="100"></progress>
                </div>
              </div>
            </section>
            <section class="plan-teaser">
              <span class="chip">✧ AI PRACTICE COACH</span>
              <h2>다음 한 주,<br />어떻게 연습할까요?</h2>
              <p>
                나의 연습 기록과 목표를 바탕으로<br />Claude가 맞춤 연습 계획을
                만들어 줘요.
              </p>
              <button @click="tab = '주간 계획'">
                나만의 계획 만들기 <span>↗</span>
              </button>
            </section>
          </div>
        </template>
        <template v-else-if="tab === '연습 기록'"
          ><section class="card">
            <h2>오늘의 연습 남기기</h2>
            <form class="form-grid" @submit.prevent="addRecord">
              <label
                >연습 날짜<input
                  v-model="recordForm.date"
                  type="date"
                  :max="today"
                  required /></label
              ><label
                >연습 시간 (분)<input
                  v-model.number="recordForm.minutes"
                  type="number"
                  min="1"
                  max="600"
                  required /></label
              ><label
                >연습곡<select v-model="recordForm.songId">
                  <option value="">자유 연습</option>
                  <option v-for="song in songs" :key="song.id" :value="song.id">
                    {{ song.title }}
                  </option>
                </select></label
              ><label
                >분류<select v-model="recordForm.category">
                  <option
                    v-for="c in ['연습곡', '테크닉', '리듬', '이론']"
                    :key="c"
                  >
                    {{ c }}
                  </option>
                </select></label
              ><label class="full"
                >연습 메모<textarea
                  v-model="recordForm.note"
                  maxlength="500"
                  placeholder="오늘 잘된 점, 다음에 도전할 부분을 적어 보세요."
                ></textarea></label
              ><button class="primary" type="submit">기록 저장</button>
            </form>
          </section>
          <section class="card spaced">
            <h2>연습 타임라인</h2>
            <p v-if="!records.length" class="empty">
              아직 기록이 없어요. 첫 연습을 남겨 주세요.
            </p>
            <article
              v-for="record in sortedRecords"
              :key="record.id"
              class="record-row"
            >
              <div>
                <small>{{ record.date }} · {{ record.category }}</small>
                <h3>
                  {{
                    songs.find((s) => s.id === record.songId)?.title ||
                    (record.songId ? "삭제된 연습곡" : "자유 연습")
                  }}
                  <span class="chip">{{ record.minutes }}분</span>
                </h3>
                <p>{{ record.note }}</p>
              </div>
              <button
                class="text-button danger"
                @click="deleteRecord(record.id)"
              >
                삭제
              </button>
            </article>
          </section></template
        >
        <template v-else-if="tab === '연습곡'"
          ><section class="card">
            <h2>새로운 레퍼토리</h2>
            <form class="form-grid" @submit.prevent="addSong">
              <label
                >곡 제목<input
                  v-model="songForm.title"
                  maxlength="100"
                  required
                  placeholder="연주하고 싶은 곡" /></label
              ><label
                >아티스트<input
                  v-model="songForm.artist"
                  maxlength="100"
                  placeholder="아티스트 이름" /></label
              ><label
                >목표 BPM<input
                  v-model.number="songForm.bpm"
                  type="number"
                  min="30"
                  max="240"
                  required /></label
              ><label
                >완성도 (%)<input
                  v-model.number="songForm.progress"
                  type="number"
                  min="0"
                  max="100"
                  required /></label
              ><button class="primary" type="submit">＋ 연습곡 추가</button>
            </form>
          </section>
          <section class="card spaced">
            <h2>나의 연습곡 · {{ songs.length }}</h2>
            <p v-if="!songs.length" class="empty">새로운 곡을 추가해 보세요.</p>
            <article v-for="song in songs" :key="song.id" class="song-row">
              <div class="song-icon">♫</div>
              <div class="song-info">
                <strong>{{ song.title }}</strong
                ><small>{{ song.artist }} · {{ song.bpm }} BPM</small>
              </div>
              <label class="song-slider"
                >완성도 {{ song.progress }}%<input
                  v-model.number="song.progress"
                  :aria-label="`${song.title} 완성도`"
                  type="range"
                  min="0"
                  max="100" /></label
              ><button class="text-button danger" @click="deleteSong(song.id)">
                삭제
              </button>
            </article>
          </section></template
        >
        <template v-else
          ><div class="plan-layout">
            <section class="card">
              <span class="eyebrow">POWERED BY CLAUDE</span>
              <h2>나에게 맞는 일주일</h2>
              <p class="muted">
                최근 100개의 연습 기록과 최대 50개의 연습곡이 Claude에
                전송됩니다.
              </p>
              <form class="plan-form" @submit.prevent="generatePlan">
                <label
                  >이번 주 목표<textarea
                    v-model="goal"
                    maxlength="500"
                    required
                  ></textarea></label
                ><label
                  >하루 연습 시간 (분)<input
                    v-model.number="dailyMinutes"
                    type="number"
                    min="10"
                    max="180"
                    required /></label
                ><label
                  >접근 토큰 (서버에서 설정한 경우)<input
                    v-model="accessToken"
                    type="password"
                    autocomplete="off"
                    placeholder="토큰은 저장되지 않습니다" /></label
                ><button class="primary" :disabled="pending">
                  {{ pending ? "계획을 만들고 있어요…" : "✧ 주간 계획 생성" }}
                </button>
                <p class="muted">
                  계획 생성 시 Claude API 사용 요금이 발생할 수 있습니다.
                </p>
              </form>
              <p v-if="planError" class="error" role="alert">{{ planError }}</p>
            </section>
            <section class="card plan-result" aria-live="polite">
              <div class="section-heading">
                <h2>이번 주 연습 가이드</h2>
                <button v-if="plan" class="text-button" @click="downloadPlan">
                  저장 ↓
                </button>
              </div>
              <pre v-if="plan">{{ plan }}</pre>
              <div v-else class="empty">
                <span>✧</span>
                <h3>좋은 연습에는 방향이 있어요.</h3>
                <p>목표를 입력하고 나만의 계획을 만들어 보세요.</p>
              </div>
            </section>
          </div></template
        >
        <footer>
          FRET LAB <span>매일의 연습이, 나만의 음악으로.</span
          ><span>브라우저에 저장됨 · 기기 간 동기화 없음</span>
        </footer>
      </div>
    </main>
  </div>
</template>
