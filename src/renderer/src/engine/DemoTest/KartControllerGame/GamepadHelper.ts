// GamepadHelper.ts
export type PadState = { steer: number; throttle: number; brake: number; rt: number; lt: number };

const dz = (v: number, d = 0.12) => (Math.abs(v) < d ? 0 : v);

export default class GamepadHelper {
  private padIndex: number | null = null;

  constructor() {
    window.addEventListener("gamepadconnected", (e: GamepadEvent) => {
      if (this.padIndex === null) this.padIndex = e.gamepad.index;
        console.log("Gamepad connected:", e.gamepad.id, "index:", e.gamepad.index);
    });
    window.addEventListener("gamepaddisconnected", (e: GamepadEvent) => {
      if (this.padIndex === e.gamepad.index) this.padIndex = null;
    });
  }

  /** Renvoie l’état normalisé du pad (ou undefined si rien branché) */
  getState(): PadState | undefined {
    const pads = navigator.getGamepads?.();
    if (!pads) return;
    const pad = (this.padIndex !== null ? pads[this.padIndex] : pads.find(p => p)) || undefined;
    if (!pad) return;

    // Axes standard (Xbox/DS4): left stick X = axes[0]
    const steer = dz(pad.axes[0] || 0);

    // Triggers : la voie la plus fiable est via buttons[6] (LT) et buttons[7] (RT)
    const ltBtn = pad.buttons[6];
    const rtBtn = pad.buttons[7];
    const lt = ltBtn ? ltBtn.value : 0;      // 0..1
    const rt = rtBtn ? rtBtn.value : 0;      // 0..1

    // throttle = RT, brake = LT (garde aussi les valeurs brutes si tu veux d’autres mappings)
    return { steer, throttle: rt, brake: lt, rt, lt };
  }
}
