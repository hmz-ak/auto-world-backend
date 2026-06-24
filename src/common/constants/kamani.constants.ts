export interface KamaniWeightSpec {
  kamaniType: string;
  weightKg: number;
}

export const CLIENT_KAMANI_WEIGHTS: Record<string, KamaniWeightSpec[]> = {
  'New Asia': [
    { kamaniType: 'Spring Leaf 4L', weightKg: 7.3 },
    { kamaniType: 'Spring Leaf 5L', weightKg: 8.5 },
    { kamaniType: 'Spring Leaf 7L', weightKg: 11.3 },
    { kamaniType: 'Spring Leaf KPK 5L', weightKg: 8.3 },
    { kamaniType: 'Spring Leaf Loader 5L', weightKg: 14.2 },
    { kamaniType: 'Spring Leaf Loader 6L', weightKg: 16 },
    { kamaniType: 'Spring Leaf Loader 7L', weightKg: 17 }
  ],
  'Pak Star': [
    { kamaniType: 'Spring Leaf 4L', weightKg: 6.8 },
    { kamaniType: 'Spring Leaf 5L', weightKg: 8.3 },
    { kamaniType: 'Spring Leaf 6L', weightKg: 9.4 },
    { kamaniType: 'Spring Leaf 7L', weightKg: 13.3 },
    { kamaniType: 'Spring Leaf Loader 8L', weightKg: 14.2 }
  ]
};

