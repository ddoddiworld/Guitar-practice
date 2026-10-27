export function useMetronome() {
  const bpm = ref(90),
    beats = ref(4),
    running = ref(false),
    beat = ref(0),
    error = ref("");
  let context: AudioContext | undefined,
    timer: ReturnType<typeof setInterval> | undefined;
  let nextTime = 0,
    nextBeat = 0,
    generation = 0;
  const nodes = new Set<OscillatorNode>();
  const visuals = new Set<ReturnType<typeof setTimeout>>();
  function stop() {
    generation++;
    if (timer) clearInterval(timer);
    timer = undefined;
    nodes.forEach((n) => {
      try {
        n.stop();
      } catch {}
    });
    nodes.clear();
    visuals.forEach(clearTimeout);
    visuals.clear();
    running.value = false;
    beat.value = 0;
  }
  function schedule() {
    if (!context) return;
    // Resume at the audio clock after a suspended/background tab; never replay missed clicks.
    if (nextTime < context.currentTime) {
      nextTime = context.currentTime + 0.02;
      nextBeat = 0;
    }
    while (nextTime < context.currentTime + 0.1) {
      const osc = context.createOscillator(),
        gain = context.createGain();
      nodes.add(osc);
      osc.frequency.value = nextBeat === 0 ? 1200 : 800;
      gain.gain.setValueAtTime(0.15, nextTime);
      gain.gain.exponentialRampToValueAtTime(0.001, nextTime + 0.04);
      osc.connect(gain);
      gain.connect(context.destination);
      osc.start(nextTime);
      osc.stop(nextTime + 0.05);
      osc.onended = () => {
        nodes.delete(osc);
        osc.disconnect();
        gain.disconnect();
      };
      const displayBeat = nextBeat + 1;
      const id = setTimeout(
        () => {
          beat.value = displayBeat;
          visuals.delete(id);
        },
        Math.max(0, (nextTime - context.currentTime) * 1000),
      );
      visuals.add(id);
      nextTime += 60 / bpm.value;
      nextBeat = (nextBeat + 1) % beats.value;
    }
  }
  async function start() {
    error.value = "";
    const attempt = ++generation;
    try {
      context ??= new AudioContext();
      await context.resume();
      if (attempt !== generation) return;
      running.value = true;
      nextTime = context.currentTime + 0.05;
      nextBeat = 0;
      schedule();
      timer = setInterval(schedule, 25);
    } catch {
      stop();
      error.value =
        "오디오를 시작할 수 없습니다. 브라우저 오디오 권한을 확인해 주세요.";
    }
  }
  watch([bpm, beats], () => {
    if (running.value) {
      stop();
      void start();
    }
  });
  onBeforeUnmount(() => {
    stop();
    void context?.close();
  });
  return { bpm, beats, running, beat, error, start, stop };
}
