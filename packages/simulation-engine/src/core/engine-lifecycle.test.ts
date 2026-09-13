import { SimulationEngine } from './engine';

describe('career match lifecycle', () => {
  let now: number;
  let pending: Map<number, FrameRequestCallback>;
  let nextId: number;
  let engine: SimulationEngine;
  const originalRaf = globalThis.requestAnimationFrame;
  const originalCancel = globalThis.cancelAnimationFrame;
  const frame = (elapsed: number) => {
    now += elapsed;
    const callbacks = [...pending.values()]; pending.clear();
    callbacks.forEach(callback => callback(now));
  };
  beforeEach(() => {
    now = 0; pending = new Map(); nextId = 1;
    jest.spyOn(performance, 'now').mockImplementation(() => now);
    globalThis.requestAnimationFrame = callback => { const id = nextId++; pending.set(id, callback); return id; };
    globalThis.cancelAnimationFrame = id => { pending.delete(id); };
    engine = new SimulationEngine({ enablePhysics: false });
  });
  afterEach(() => {
    engine.destroy(); jest.restoreAllMocks();
    globalThis.requestAnimationFrame = originalRaf;
    globalThis.cancelAnimationFrame = originalCancel;
  });

  it('advances after pause and resume without counting time spent paused', () => {
    engine.start(); frame(1000);
    expect(engine.getState().currentTime).toBe(1);
    engine.pause(); frame(10000);
    expect(engine.getState().currentTime).toBe(1);
    engine.resume(); frame(1000);
    expect(engine.getState().currentTime).toBe(2);
    expect(engine.getState().isRunning).toBe(true);
  });

  it('stops exactly at half-time, resumes the second half, and ends once', () => {
    engine.start(); frame(2701000);
    expect(engine.getState().currentTime).toBe(2700);
    expect(engine.getState().isHalfTime).toBe(true);
    expect(pending.size).toBe(0);
    engine.resume();
    expect(engine.getState().isHalfTime).toBe(false);
    frame(2701000);
    expect(engine.getState().currentTime).toBe(5400);
    expect(engine.getState().isFullTime).toBe(true);
    expect(engine.getState().events.filter(e => e.type === 'full_time')).toHaveLength(1);
    engine.start(); frame(10000);
    expect(engine.getState().currentTime).toBe(5400);
    expect(pending.size).toBe(0);
  });

  it('applies speed controls to the clock and retains the same running match', () => {
    engine.start(); engine.setMatchSpeed('fast'); frame(1000);
    expect(engine.getState().currentTime).toBe(2);
    engine.setMatchSpeed('instant'); frame(1000);
    expect(engine.getState().currentTime).toBe(12);
    engine.setMatchSpeed('slow'); frame(1000);
    expect(engine.getState().currentTime).toBe(12.5);
  });
});
