/**
 * TODO(paul): Actually use this
 */
export class DebugInfo {
  constructor(readonly position: string | undefined) {}

  static ENABLED = false;

  static capture(depth: number) {
    let position: string | undefined;
    if (this.ENABLED) {
      const { stack } = new Error();
      position = stack!.split("\n")[depth + 1].replace(/^\s+at\s+/, "");
    }
    return new DebugInfo(position);
  }
}
