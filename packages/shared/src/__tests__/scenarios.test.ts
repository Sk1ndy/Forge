import { describe, it, expect, beforeAll } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import { runWeeklySimulation } from '../engine';
import { UserProfile, WeeklyBlueprint } from '../types';
import { DEFAULT_EXERCISE_LIBRARY, MUSCLE_DETAILS } from '../constants';

const RESULTS_DIR = path.resolve(__dirname, '../../../../tests/results');

describe('Forge Engine - Deterministic Test Scenarios', () => {
  beforeAll(() => {
    if (!fs.existsSync(RESULTS_DIR)) {
      fs.mkdirSync(RESULTS_DIR, { recursive: true });
    }
  });

  const baseProfile: UserProfile = {
    pdc: 80,
    prs: { squat: 140, bench: 100, deadlift: 180, ohp: 60 },
    maxSnc: 15,
    isBeginner: false,
    age: 25,
    sleepHours: 8
  };

  function exportResult(scenarioId: string, status: string, input: any, result: any, metrics: any) {
    const data = {
      scenarioId,
      status,
      input,
      output: {
        sncScore: result ? Number((result.sncScore || 0).toFixed(4)) : 0,
        readiness: result ? Number((result.systemicReadiness || 0).toFixed(4)) : 0,
        injuryRisk: (result && result.injuryPredictions && result.injuryPredictions.length > 0) ? "HIGH" : "LOW",
        metrics: {
          chronicSncStress: result ? Number((result.chronicSncStress || 0).toFixed(4)) : 0,
          globalWorkCapacity: result ? Number((result.globalWorkCapacity || 0).toFixed(4)) : 0,
          cnsFailure: result ? result.cnsFailure : false,
          ...metrics
        }
      },
      assertions: [{ key: 'snapshot_match', expected: 1, actual: 1, delta: 0 }]
    };
    fs.writeFileSync(path.join(RESULTS_DIR, `${scenarioId}.json`), JSON.stringify(data, null, 2));
  }

  it('beginner_full_body', () => {
    const blueprint: WeeklyBlueprint = {
      'mon': [
        { id: '1', exerciseId: 'squat', active: true, sets: [{ series: 3, reps: 10, poids: 60, rpe: 7, active: true }] },
        { id: '2', exerciseId: 'bench_press', active: true, sets: [{ series: 3, reps: 10, poids: 50, rpe: 7, active: true }] }
      ],
      'tue': [],
      'wed': [
        { id: '3', exerciseId: 'deadlift', active: true, sets: [{ series: 3, reps: 8, poids: 80, rpe: 7, active: true }] },
        { id: '4', exerciseId: 'pull_ups', active: true, sets: [{ series: 3, reps: 8, poids: 0, rpe: 7, active: true }] }
      ],
      'thu': [],
      'fri': [
        { id: '5', exerciseId: 'squat', active: true, sets: [{ series: 3, reps: 10, poids: 65, rpe: 8, active: true }] },
        { id: '6', exerciseId: 'ohp', active: true, sets: [{ series: 3, reps: 10, poids: 30, rpe: 7, active: true }] }
      ],
      'sat': [],
      'sun': []
    };

    const input = { blueprint, profile: baseProfile, totalWeeks: 4 };
    const result = runWeeklySimulation(blueprint, baseProfile, {}, undefined, DEFAULT_EXERCISE_LIBRARY, 4, []);
    
    try {
      expect(result).toMatchSnapshot();
      exportResult('beginner_full_body', 'PASS', input, result, {});
    } catch(e) {
      exportResult('beginner_full_body', 'FAIL', input, result, {});
      throw e;
    }
  });

  it('advanced_ppl_high_volume', () => {
    const blueprint: WeeklyBlueprint = {
      'mon': [
        { id: '1', exerciseId: 'bench_press', active: true, sets: [{ series: 4, reps: 8, poids: 90, rpe: 8.5, active: true }] },
        { id: '2', exerciseId: 'incline_db_press', active: true, sets: [{ series: 3, reps: 10, poids: 35, rpe: 8, active: true }] },
        { id: '3', exerciseId: 'triceps_pushdown', active: true, sets: [{ series: 4, reps: 12, poids: 25, rpe: 9, active: true }] }
      ],
      'tue': [
        { id: '4', exerciseId: 'pull_ups', active: true, sets: [{ series: 4, reps: 8, poids: 10, rpe: 8, active: true }] },
        { id: '5', exerciseId: 'barbell_row', active: true, sets: [{ series: 4, reps: 10, poids: 70, rpe: 8, active: true }] },
        { id: '6', exerciseId: 'biceps_curl', active: true, sets: [{ series: 3, reps: 12, poids: 15, rpe: 9, active: true }] }
      ],
      'wed': [
        { id: '7', exerciseId: 'squat', active: true, sets: [{ series: 4, reps: 8, poids: 120, rpe: 8.5, active: true }] },
        { id: '8', exerciseId: 'leg_press', active: true, sets: [{ series: 3, reps: 12, poids: 200, rpe: 8, active: true }] }
      ],
      'thu': [
        { id: '9', exerciseId: 'ohp', active: true, sets: [{ series: 4, reps: 8, poids: 55, rpe: 8.5, active: true }] },
        { id: '10', exerciseId: 'dips', active: true, sets: [{ series: 3, reps: 10, poids: 20, rpe: 8, active: true }] }
      ],
      'fri': [
        { id: '11', exerciseId: 'deadlift', active: true, sets: [{ series: 3, reps: 5, poids: 160, rpe: 9, active: true }] },
        { id: '12', exerciseId: 'lat_pulldown', active: true, sets: [{ series: 3, reps: 10, poids: 60, rpe: 8, active: true }] }
      ],
      'sat': [
        { id: '13', exerciseId: 'romanian_deadlift', active: true, sets: [{ series: 3, reps: 8, poids: 120, rpe: 8, active: true }] },
        { id: '14', exerciseId: 'leg_curl', active: true, sets: [{ series: 3, reps: 12, poids: 50, rpe: 9, active: true }] }
      ],
      'sun': []
    };

    const input = { blueprint, profile: baseProfile, totalWeeks: 4 };
    const result = runWeeklySimulation(blueprint, baseProfile, {}, undefined, DEFAULT_EXERCISE_LIBRARY, 4, []);
    
    try {
      expect(result).toMatchSnapshot();
      exportResult('advanced_ppl_high_volume', 'PASS', input, result, {});
    } catch(e) {
      exportResult('advanced_ppl_high_volume', 'FAIL', input, result, {});
      throw e;
    }
  });

  it('extreme_fatigue_deadlift', () => {
    const blueprint: WeeklyBlueprint = {
      'mon': [
        { id: '1', exerciseId: 'deadlift', active: true, sets: [
          { series: 5, reps: 3, poids: 175, rpe: 10, active: true },
          { series: 3, reps: 5, poids: 160, rpe: 9.5, active: true }
        ]}
      ],
      'tue': [], 'wed': [], 'thu': [], 'fri': [], 'sat': [], 'sun': []
    };

    const input = { blueprint, profile: baseProfile, totalWeeks: 2 };
    const result = runWeeklySimulation(blueprint, baseProfile, {}, undefined, DEFAULT_EXERCISE_LIBRARY, 2, []);
    
    try {
      expect(result).toMatchSnapshot();
      exportResult('extreme_fatigue_deadlift', 'PASS', input, result, {});
    } catch(e) {
      exportResult('extreme_fatigue_deadlift', 'FAIL', input, result, {});
      throw e;
    }
  });

  it('sarcopenic_insomniac', () => {
    const blueprint: WeeklyBlueprint = {
      'mon': [{ id: '1', exerciseId: 'squat', active: true, sets: [{ series: 4, reps: 10, poids: 80, rpe: 8, active: true }] }],
      'tue': [], 'wed': [], 'thu': [], 'fri': [], 'sat': [], 'sun': []
    };
    const youngProfile: UserProfile = { ...baseProfile, age: 20, sleepHours: 9 };
    const oldProfile: UserProfile = { ...baseProfile, age: 65, sleepHours: 4 };

    const resYoung = runWeeklySimulation(blueprint, youngProfile, {}, undefined, DEFAULT_EXERCISE_LIBRARY, 4, []);
    const resOld = runWeeklySimulation(blueprint, oldProfile, {}, undefined, DEFAULT_EXERCISE_LIBRARY, 4, []);
    
    const metrics = { resYoung, resOld };

    try {
      expect(metrics).toMatchSnapshot();
      exportResult('sarcopenic_insomniac', 'PASS', { blueprint, youngProfile, oldProfile }, resYoung, metrics);
    } catch(e) {
      exportResult('sarcopenic_insomniac', 'FAIL', { blueprint }, resYoung, metrics);
      throw e;
    }
  });

  it('junk_volume', () => {
    const blueprint5: WeeklyBlueprint = {
      'mon': [{ id: '1', exerciseId: 'bench_press', active: true, sets: [{ series: 5, reps: 10, poids: 80, rpe: 8, active: true }] }],
      'tue': [], 'wed': [], 'thu': [], 'fri': [], 'sat': [], 'sun': []
    };
    const blueprint30: WeeklyBlueprint = {
      'mon': [{ id: '1', exerciseId: 'bench_press', active: true, sets: [{ series: 30, reps: 10, poids: 80, rpe: 8, active: true }] }],
      'tue': [], 'wed': [], 'thu': [], 'fri': [], 'sat': [], 'sun': []
    };

    const res5 = runWeeklySimulation(blueprint5, baseProfile, {}, undefined, DEFAULT_EXERCISE_LIBRARY, 1, []);
    const res30 = runWeeklySimulation(blueprint30, baseProfile, {}, undefined, DEFAULT_EXERCISE_LIBRARY, 1, []);
    
    const metrics = { res5, res30 };

    try {
      expect(metrics).toMatchSnapshot();
      exportResult('junk_volume', 'PASS', { blueprint5, blueprint30 }, res30, metrics);
    } catch(e) {
      exportResult('junk_volume', 'FAIL', { blueprint5, blueprint30 }, res30, metrics);
      throw e;
    }
  });

  it('catabolic_melt', () => {
    const blueprint: WeeklyBlueprint = {
      'mon': [{ id: '1', exerciseId: 'deadlift', active: true, sets: [{ series: 10, reps: 5, poids: 160, rpe: 10, active: true }] }],
      'tue': [{ id: '2', exerciseId: 'squat', active: true, sets: [{ series: 10, reps: 5, poids: 130, rpe: 10, active: true }] }],
      'wed': [{ id: '3', exerciseId: 'bench_press', active: true, sets: [{ series: 10, reps: 5, poids: 90, rpe: 10, active: true }] }],
      'thu': [{ id: '4', exerciseId: 'deadlift', active: true, sets: [{ series: 10, reps: 5, poids: 160, rpe: 10, active: true }] }],
      'fri': [{ id: '5', exerciseId: 'squat', active: true, sets: [{ series: 10, reps: 5, poids: 130, rpe: 10, active: true }] }],
      'sat': [{ id: '6', exerciseId: 'bench_press', active: true, sets: [{ series: 10, reps: 5, poids: 90, rpe: 10, active: true }] }],
      'sun': []
    };

    const res = runWeeklySimulation(blueprint, baseProfile, {}, undefined, DEFAULT_EXERCISE_LIBRARY, 8, []);
    
    try {
      expect(res).toMatchSnapshot();
      exportResult('catabolic_melt', 'PASS', { blueprint }, res, {});
    } catch(e) {
      exportResult('catabolic_melt', 'FAIL', { blueprint }, res, {});
      throw e;
    }
  });

  it('supercompensation_deload', () => {
    const blueprint: WeeklyBlueprint = {
      'mon': [{ id: '1', exerciseId: 'squat', active: true, sets: [{ series: 4, reps: 8, poids: 100, rpe: 8, active: true }] }],
      'tue': [], 'wed': [], 'thu': [], 'fri': [], 'sat': [], 'sun': []
    };

    const res = runWeeklySimulation(blueprint, baseProfile, {}, undefined, DEFAULT_EXERCISE_LIBRARY, 4, [4]);
    
    try {
      expect(res).toMatchSnapshot();
      exportResult('supercompensation_deload', 'PASS', { blueprint }, res, {});
    } catch(e) {
      exportResult('supercompensation_deload', 'FAIL', { blueprint }, res, {});
      throw e;
    }
  });

  it('asymmetrical_bro_split', () => {
    const blueprint: WeeklyBlueprint = {
      'mon': [{ id: '1', exerciseId: 'bench_press', active: true, sets: [{ series: 5, reps: 10, poids: 80, rpe: 8, active: true }] }],
      'tue': [],
      'wed': [{ id: '2', exerciseId: 'ohp', active: true, sets: [{ series: 5, reps: 10, poids: 50, rpe: 8, active: true }] }],
      'thu': [],
      'fri': [{ id: '3', exerciseId: 'dips', active: true, sets: [{ series: 5, reps: 10, poids: 20, rpe: 8, active: true }] }],
      'sat': [], 'sun': []
    };

    const res = runWeeklySimulation(blueprint, baseProfile, {}, undefined, DEFAULT_EXERCISE_LIBRARY, 4, []);
    
    try {
      expect(res).toMatchSnapshot();
      exportResult('asymmetrical_bro_split', 'PASS', { blueprint }, res, {});
    } catch(e) {
      exportResult('asymmetrical_bro_split', 'FAIL', { blueprint }, res, {});
      throw e;
    }
  });

  it('monotony_assembly_line', () => {
    const blueprint: WeeklyBlueprint = {
      'mon': [{ id: '1', exerciseId: 'squat', active: true, sets: [{ series: 5, reps: 10, poids: 100, rpe: 8, active: true }] }],
      'tue': [{ id: '2', exerciseId: 'squat', active: true, sets: [{ series: 5, reps: 10, poids: 100, rpe: 8, active: true }] }],
      'wed': [{ id: '3', exerciseId: 'squat', active: true, sets: [{ series: 5, reps: 10, poids: 100, rpe: 8, active: true }] }],
      'thu': [{ id: '4', exerciseId: 'squat', active: true, sets: [{ series: 5, reps: 10, poids: 100, rpe: 8, active: true }] }],
      'fri': [{ id: '5', exerciseId: 'squat', active: true, sets: [{ series: 5, reps: 10, poids: 100, rpe: 8, active: true }] }],
      'sat': [{ id: '6', exerciseId: 'squat', active: true, sets: [{ series: 5, reps: 10, poids: 100, rpe: 8, active: true }] }],
      'sun': [{ id: '7', exerciseId: 'squat', active: true, sets: [{ series: 5, reps: 10, poids: 100, rpe: 8, active: true }] }]
    };

    const res = runWeeklySimulation(blueprint, baseProfile, {}, undefined, DEFAULT_EXERCISE_LIBRARY, 2, []); // 14 jours
    
    try {
      expect(res).toMatchSnapshot();
      exportResult('monotony_assembly_line', 'PASS', { blueprint }, res, {});
    } catch(e) {
      exportResult('monotony_assembly_line', 'FAIL', { blueprint }, res, {});
      throw e;
    }
  });

  it('biceps_vs_deadlift_cns_impact', () => {
    const blueprintBiceps: WeeklyBlueprint = {
      'mon': [{ id: '1', exerciseId: 'biceps_curl', active: true, sets: [{ series: 10, reps: 10, poids: 20, rpe: 8, active: true }] }],
      'tue': [], 'wed': [], 'thu': [], 'fri': [], 'sat': [], 'sun': []
    };
    const blueprintDeadlift: WeeklyBlueprint = {
      'mon': [{ id: '1', exerciseId: 'deadlift', active: true, sets: [{ series: 10, reps: 10, poids: 100, rpe: 8, active: true }] }],
      'tue': [], 'wed': [], 'thu': [], 'fri': [], 'sat': [], 'sun': []
    };

    const resBiceps = runWeeklySimulation(blueprintBiceps, baseProfile, {}, undefined, DEFAULT_EXERCISE_LIBRARY, 1, []);
    const resDeadlift = runWeeklySimulation(blueprintDeadlift, baseProfile, {}, undefined, DEFAULT_EXERCISE_LIBRARY, 1, []);

    const metrics = { resBiceps, resDeadlift };

    try {
      expect(metrics).toMatchSnapshot();
      exportResult('biceps_vs_deadlift_cns_impact', 'PASS', { blueprintBiceps, blueprintDeadlift }, resDeadlift, metrics);
    } catch(e) {
      exportResult('biceps_vs_deadlift_cns_impact', 'FAIL', { blueprintBiceps, blueprintDeadlift }, resDeadlift, metrics);
      throw e;
    }
  });

  it('rapid_recovery_calves_vs_lower_back', () => {
    const customLibrary = [...DEFAULT_EXERCISE_LIBRARY, 
      { id: 'iso_calves', nom: 'Iso Calves', tier_snc: 3 as const, muscle_primaire: 'calves' as const, muscles_secondaires: [], equipment: 'machine' as const, ppl_category: 'legs' as const, tension_matrix: { calves: 1.0 } },
      { id: 'iso_lower_back', nom: 'Iso Lower Back', tier_snc: 3 as const, muscle_primaire: 'lowerBack' as const, muscles_secondaires: [], equipment: 'machine' as const, ppl_category: 'pull' as const, tension_matrix: { lowerBack: 1.0 } }
    ];
    const blueprint: WeeklyBlueprint = {
      'mon': [
        { id: '1', exerciseId: 'iso_calves', active: true, sets: [{ series: 5, reps: 10, poids: 50, rpe: 8, active: true }] },
        { id: '2', exerciseId: 'iso_lower_back', active: true, sets: [{ series: 5, reps: 10, poids: 50, rpe: 8, active: true }] }
      ],
      'tue': [], 'wed': [], 'thu': [], 'fri': [], 'sat': [], 'sun': []
    };

    const res = runWeeklySimulation(blueprint, baseProfile, {}, undefined, customLibrary, 1, []);
    
    try {
      expect(res).toMatchSnapshot();
      exportResult('rapid_recovery', 'PASS', { blueprint }, res, {});
    } catch(e) {
      exportResult('rapid_recovery', 'FAIL', { blueprint }, res, {});
      throw e;
    }
  });

  it('biquotidien_double_session', () => {
    const blueprint: WeeklyBlueprint = {
      'mon': [
        { id: '1', exerciseId: 'squat', active: true, sets: [{ series: 4, reps: 8, poids: 100, rpe: 8, active: true }] },
        { id: '2', exerciseId: 'leg_press', active: true, sets: [{ series: 4, reps: 12, poids: 150, rpe: 8, active: true }] }
      ],
      'tue': [], 'wed': [], 'thu': [], 'fri': [], 'sat': [], 'sun': []
    };

    const res = runWeeklySimulation(blueprint, baseProfile, {}, undefined, DEFAULT_EXERCISE_LIBRARY, 1, []);
    
    try {
      expect(res).toMatchSnapshot();
      exportResult('biquotidien', 'PASS', { blueprint }, res, {});
    } catch(e) {
      exportResult('biquotidien', 'FAIL', { blueprint }, res, {});
      throw e;
    }
  });

  it('bodyweight_efficiency', () => {
    const blueprintPullups: WeeklyBlueprint = {
      'mon': [{ id: '1', exerciseId: 'pull_ups', active: true, sets: [{ series: 3, reps: 10, poids: 0, rpe: 8, active: true }] }],
      'tue': [], 'wed': [], 'thu': [], 'fri': [], 'sat': [], 'sun': []
    };
    const blueprintPulldown: WeeklyBlueprint = {
      'mon': [{ id: '1', exerciseId: 'lat_pulldown', active: true, sets: [{ series: 3, reps: 10, poids: 60, rpe: 8, active: true }] }],
      'tue': [], 'wed': [], 'thu': [], 'fri': [], 'sat': [], 'sun': []
    };

    const resPullups = runWeeklySimulation(blueprintPullups, baseProfile, {}, undefined, DEFAULT_EXERCISE_LIBRARY, 1, []);
    const resPulldown = runWeeklySimulation(blueprintPulldown, baseProfile, {}, undefined, DEFAULT_EXERCISE_LIBRARY, 1, []);
    
    const metrics = { resPullups, resPulldown };

    try {
      expect(metrics).toMatchSnapshot();
      exportResult('bodyweight_efficiency', 'PASS', { blueprintPullups, blueprintPulldown }, resPullups, metrics);
    } catch(e) {
      exportResult('bodyweight_efficiency', 'FAIL', { blueprintPullups, blueprintPulldown }, resPullups, metrics);
      throw e;
    }
  });

  it('undulating_periodization', () => {
    const blueprint: WeeklyBlueprint = {
      'mon': [{ id: '1', exerciseId: 'squat', active: true, sets: [{ series: 4, reps: 5, poids: 120, rpe: 9.5, active: true }] }], 
      'tue': [],
      'wed': [{ id: '2', exerciseId: 'squat', active: true, sets: [{ series: 4, reps: 12, poids: 70, rpe: 6, active: true }] }], 
      'thu': [],
      'fri': [{ id: '3', exerciseId: 'squat', active: true, sets: [{ series: 4, reps: 8, poids: 95, rpe: 8, active: true }] }], 
      'sat': [], 'sun': []
    };

    const res = runWeeklySimulation(blueprint, baseProfile, {}, undefined, DEFAULT_EXERCISE_LIBRARY, 4, []);
    
    try {
      expect(res).toMatchSnapshot();
      exportResult('undulating_periodization', 'PASS', { blueprint }, res, {});
    } catch(e) {
      exportResult('undulating_periodization', 'FAIL', { blueprint }, res, {});
      throw e;
    }
  });

  it('never_skip_leg_day_extreme', () => {
    const blueprint: WeeklyBlueprint = {
      'mon': [{ id: '1', exerciseId: 'squat', active: true, sets: [{ series: 5, reps: 10, poids: 100, rpe: 8, active: true }] }],
      'tue': [{ id: '2', exerciseId: 'squat', active: true, sets: [{ series: 5, reps: 10, poids: 100, rpe: 8, active: true }] }],
      'wed': [{ id: '3', exerciseId: 'leg_press', active: true, sets: [{ series: 5, reps: 10, poids: 200, rpe: 8, active: true }] }],
      'thu': [{ id: '4', exerciseId: 'leg_extension', active: true, sets: [{ series: 5, reps: 15, poids: 60, rpe: 9, active: true }] }],
      'fri': [{ id: '5', exerciseId: 'lunges', active: true, sets: [{ series: 5, reps: 12, poids: 40, rpe: 8, active: true }] }],
      'sat': [], 'sun': []
    };

    const res = runWeeklySimulation(blueprint, baseProfile, {}, undefined, DEFAULT_EXERCISE_LIBRARY, 4, []);
    
    try {
      expect(res).toMatchSnapshot();
      exportResult('never_skip_leg_day_extreme', 'PASS', { blueprint }, res, {});
    } catch(e) {
      exportResult('never_skip_leg_day_extreme', 'FAIL', { blueprint }, res, {});
      throw e;
    }
  });

});
