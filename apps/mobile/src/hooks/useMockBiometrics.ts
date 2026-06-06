export interface BiometricsData {
  cnsFatigue: number;
  recentSessions: number;
  connectedSensors: string[];
  status: 'optimal' | 'warning' | 'critical';
}

export const useMockBiometrics = (): BiometricsData => {
  return {
    cnsFatigue: 82,
    recentSessions: 4,
    connectedSensors: ['Apple Watch', 'Garmin'],
    status: 'warning',
  };
};
