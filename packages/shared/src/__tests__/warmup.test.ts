import { describe, it, expect } from 'vitest';
import { generateWarmupProtocol } from '../engine/algorithms/warmup-protocol';

describe('Engine: Warmup Protocol (D-03)', () => {
  it('generates a 3-step pyramidal protocol for Tier 1 exercises (squat)', () => {
    // Squat: 1RM = 100, Target = 85
    const protocol = generateWarmupProtocol('squat', 85, 100);
    
    // Expect: 20 (barre), 40 (40%), 60 (60%), 80 (80%)
    expect(protocol.length).toBe(4);
    expect(protocol[0].weight).toBe(20);
    expect(protocol[0].reps).toBe(10);
    
    expect(protocol[1].weight).toBe(40);
    expect(protocol[1].reps).toBe(5);
    
    expect(protocol[2].weight).toBe(60);
    expect(protocol[2].reps).toBe(3);
    
    expect(protocol[3].weight).toBe(80);
    expect(protocol[3].reps).toBe(1);
    expect(protocol[3].note).toContain('potentiation');
  });

  it('generates a 2-step protocol for Tier 2 exercises (bench_press)', () => {
    // Bench: 1RM = 80, Target = 65
    const protocol = generateWarmupProtocol('bench_press', 65, 80);
    
    // Expect: 20 (barre), 40 (50%), 60 (75%)
    expect(protocol.length).toBe(3);
    expect(protocol[0].weight).toBe(20);
    expect(protocol[1].weight).toBe(40);
    expect(protocol[1].reps).toBe(5);
    expect(protocol[2].weight).toBe(60);
    expect(protocol[2].reps).toBe(2);
  });

  it('generates a single step for Tier 3 isolation exercises (biceps_curl)', () => {
    // Biceps Curl: 1RM = 30, Target = 25
    const protocol = generateWarmupProtocol('biceps_curl', 25, 30);
    
    // Tier 3 en poids_libre => Pas de barre à vide par défaut si la cible est < 40kg
    expect(protocol.length).toBe(1);
    expect(protocol[0].weight).toBe(15);
    expect(protocol[0].reps).toBe(8);
  });

  it('handles bodyweight exercises with a mobility note (pull_ups)', () => {
    const protocol = generateWarmupProtocol('pull_ups', 0, 0);
    
    expect(protocol.length).toBe(1);
    expect(protocol[0].weight).toBe(0);
    expect(protocol[0].reps).toBe(10);
    expect(protocol[0].note).toContain('articulaire');
  });

  it('handles very light targets by returning minimal warmup', () => {
    const protocol = generateWarmupProtocol('squat', 15, 20);
    
    expect(protocol.length).toBe(1);
    expect(protocol[0].weight).toBe(0);
    expect(protocol[0].note).toContain('articulaire');
  });

  it('does not prescribe empty bar (20kg) for machines (lat_pulldown)', () => {
    // Lat Pulldown est Tier 2 mais Machine, pas de barre à vide de 20kg
    const protocol = generateWarmupProtocol('lat_pulldown', 60, 80);
    
    const hasEmptyBar = protocol.some(p => p.weight === 20 && p.reps === 10);
    expect(hasEmptyBar).toBe(false);
    // Mais on a bien les 50% (40) et 75% (60, sauf que 60 === targetWeight donc il saute)
    expect(protocol.some(p => p.weight === 40)).toBe(true);
  });
});
