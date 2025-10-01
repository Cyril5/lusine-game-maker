// Red.ts (string TS)
export const RedTs = `
export default class RedState {
  private t = 0;

  onEnter() { this.t = 0; this.console.log("🔴 Red: ON"); }
  onUpdate(dt: number) {
    this.t += dt;
    if ((this.t % 1) < dt) this.console.log("🔴 tick", this.t.toFixed(1));
    if (this.t >= 4) this.requestTransition("Feu vert");
  }
  onExit()  { this.console.log("🔴 Red: OFF"); }
}
`;

// Green.ts
export const GreenTs = `
export default class GreenState {
  private t = 0;
  constructor(private api: any) {}
  onEnter() { this.t = 0; this.console.log("🟢 Green: ON"); }
  onUpdate(dt: number) {
    this.t += dt;
    if ((this.t % 1) < dt) this.console.log("🟢 tick", this.t.toFixed(1));
    if (this.t >= 4) this.requestTransition("Yellow");
  }
  onExit()  { this.console.log("🟢 Green: OFF"); }
}
`;

// Yellow.ts
export const YellowTs = `
export default class YellowState {
  private t = 0;
  constructor(private api: any) {}
  onEnter() { this.t = 0; this.api.console.log("🟡 Yellow: ON"); }
  onUpdate(dt: number) {
    this.t += dt;
    if ((this.t % 1) < dt) this.api.console.log("🟡 tick", this.t.toFixed(1));
    if (this.t >= 1) this.api.requestTransition("Red");
  }
  onExit()  { this.api.console.log("🟡 Yellow: OFF"); }
}
`;