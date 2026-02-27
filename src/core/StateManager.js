export class StateManager {
  constructor(initialState) {
    this.current = initialState;
    this.previous = null;
    this.meta = null;
  }

  set(state, meta = null) {
    if (state === this.current) {
      this.meta = meta;
      return;
    }
    this.previous = this.current;
    this.current = state;
    this.meta = meta;
  }

  is(state) {
    return this.current === state;
  }

  get() {
    return this.current;
  }
}
