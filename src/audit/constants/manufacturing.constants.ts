export enum ManufacturingRecordStatus {
  PENDING = 'PENDING',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED'
}

export enum ManufacturingProcessStepStatus {
  PENDING = 'PENDING',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED'
}

export const MANUFACTURING_PROCESS_PHASES = [
  { phase: 'BLANK_CUTTING', label: 'Blank cutting' },
  { phase: 'EYE_ROLLING', label: 'Eye rolling (both sides)' },
  { phase: 'CENTER_BOLT_HOLE_DRILLING', label: 'Center bolt hole drilling' },
  { phase: 'HARDENING_TEMPERING', label: 'Hardening + tempering' },
  { phase: 'SHOT_PEENING', label: 'Shot peening' },
  { phase: 'ASSEMBLY', label: 'Assembly' },
  { phase: 'CLAMPING', label: 'Clamping' },
  { phase: 'ALIGNMENT', label: 'Alignment' },
  { phase: 'FINAL_INSPECTION', label: 'Final inspection' },
  { phase: 'PAINTING', label: 'Painting' },
  { phase: 'DISPATCH', label: 'Dispatch' }
] as const;
