export interface KamaniWeightSpec {
  kamaniType: string;
  weightKg: number;
}

export const CLIENT_KAMANI_WEIGHTS: Record<string, KamaniWeightSpec[]> = {
  'New Asia': [
    { kamaniType: '4L', weightKg: 7.3 },
    { kamaniType: '5L', weightKg: 8.5 },
    { kamaniType: '7L', weightKg: 11.3 },
    { kamaniType: 'KPK 5L', weightKg: 8.3 },
    { kamaniType: 'Loader 5L', weightKg: 14.2 },
    { kamaniType: 'Loader 6L', weightKg: 16 },
    { kamaniType: 'Loader 7L', weightKg: 17 }
  ],
  'Pak Star': [
    { kamaniType: '4L', weightKg: 6.8 },
    { kamaniType: '5L', weightKg: 8.3 },
    { kamaniType: '6L', weightKg: 9.4 },
    { kamaniType: '7L', weightKg: 13.3 },
    { kamaniType: '8L Loader', weightKg: 14.2 }
  ]
};

