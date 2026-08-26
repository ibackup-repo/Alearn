// ────────────────────────── audio ─────────────────────────────
let Audio_Context: AudioContext | null = null;

export function Play_Move_Sound(kind: "move" | "capture" = "move") {
  try {
    Audio_Context ??= new (window.AudioContext || (window as any).webkitAudioContext)();
    const ctx = Audio_Context;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain); gain.connect(ctx.destination);
    osc.type = "triangle";
    osc.frequency.value = kind === "capture" ? 220 : 380;
    gain.gain.value = 0.0001;
    gain.gain.exponentialRampToValueAtTime(0.18, ctx.currentTime + 0.005);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.12);
    osc.start();
    osc.stop(ctx.currentTime + 0.13);
  } catch { /* noop */ }
}