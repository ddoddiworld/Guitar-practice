import { z } from "zod";
import {
  songSchema,
  recordSchema,
  type Song,
  type PracticeRecord,
} from "#shared/practice";
export function usePractice() {
  const songs = useState<Song[]>("songs", () => []);
  const records = useState<PracticeRecord[]>("records", () => []);
  const storageError = useState("storage-error", () => "");
  const ready = useState("storage-ready", () => false);
  onMounted(() => {
    if (ready.value) return;
    try {
      const raw = localStorage.getItem("fret-lab-v1");
      if (raw) {
        const parsed = z
          .object({
            songs: z.array(songSchema),
            records: z.array(recordSchema),
          })
          .parse(JSON.parse(raw));
        songs.value = parsed.songs;
        records.value = parsed.records;
      }
    } catch {
      storageError.value =
        "저장된 데이터를 읽지 못했습니다. 기존 저장값을 보호하기 위해 자동 저장을 중지했습니다.";
      return;
    }
    ready.value = true;
  });
  watch(
    [songs, records],
    () => {
      if (!ready.value) return;
      try {
        localStorage.setItem(
          "fret-lab-v1",
          JSON.stringify({ songs: songs.value, records: records.value }),
        );
        storageError.value = "";
      } catch {
        storageError.value =
          "저장 공간에 접근할 수 없습니다. 현재 변경 내용은 새로고침하면 사라질 수 있습니다.";
      }
    },
    { deep: true },
  );
  return { songs, records, storageError };
}
