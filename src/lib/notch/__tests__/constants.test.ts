import { describe, it, expect } from 'vitest';
import {
  CIRCLE_SIZE,
  CIRCLE_R,
  BAR_SIZE_DEFAULT,
  NOTCH_GAP,
  RC_DEFAULT,
  CORNER_RADIUS,
  FILET_DEG,
  EXP_O,
  ARC_TAN,
  PAD,
  CENTER_OFFSET,
  DURATION_DEFAULT,
  DEFAULT_COLORS,
} from '../constants';

describe('NotchNavbar constants', () => {
  it('circle defaults', () => {
    expect(CIRCLE_SIZE).toBe(56);
    expect(CIRCLE_R).toBe(28); // size / 2
    expect(CIRCLE_R).toBe(CIRCLE_SIZE / 2);
  });

  it('bar defaults', () => {
    expect(BAR_SIZE_DEFAULT).toBe(56);
  });

  it('cutout geometry: rc = CIRCLE_R + NOTCH_GAP', () => {
    expect(NOTCH_GAP).toBe(7);
    expect(RC_DEFAULT).toBe(35);
    expect(RC_DEFAULT).toBe(CIRCLE_R + NOTCH_GAP);
  });

  it('corners and fillet constants', () => {
    expect(CORNER_RADIUS).toBe(10);
    expect(FILET_DEG).toBe(4);
    expect(EXP_O).toBe(0.35);
    expect(ARC_TAN).toBe(2.0);
  });

  it('layout and circle center offset', () => {
    expect(PAD).toBe(8);
    expect(CENTER_OFFSET).toBe(6);
  });

  it('animation duration', () => {
    expect(DURATION_DEFAULT).toBe(350);
  });

  it('default colors', () => {
    expect(DEFAULT_COLORS.activeIconColor).toBe('#007AFF');
    expect(DEFAULT_COLORS.inactiveIconColor).toBe('#6B7280');
    expect(DEFAULT_COLORS.circleFillColor).toBe('#FFFFFF');
    expect(DEFAULT_COLORS.barBackground).toBe('#FFFFFF');
  });
});
