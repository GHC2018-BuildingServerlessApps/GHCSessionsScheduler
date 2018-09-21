export class Session {
  id: number;
  name: string;
  location?: string;
  startTime: Date;
  endTime: Date;

  speakers?: string;
  description: string;
  isSelected?: boolean;
  hasConflict?: boolean;

  audienceLevel?: string;
  focusArea?: string;
  track?: string;

  startDate?: string;
}
