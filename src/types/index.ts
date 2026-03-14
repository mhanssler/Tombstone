// Type definitions for the Baby Sleep Tracker app

export type SyncStatus = 'synced' | 'pending' | 'conflict';

export type SleepType = 'nap' | 'night';

export type FeedingType = 'breast_left' | 'breast_right' | 'bottle' | 'solids';

export type DiaperType = 'wet' | 'dirty' | 'both' | 'dry';

export type ActivityType = 'sleep' | 'feeding' | 'diaper' | 'pump' | 'solid_food';

export type FoodCategory = 'fruit' | 'vegetable' | 'grain' | 'protein' | 'dairy' | 'other';

export type AllergenGroup = 'milk' | 'egg' | 'peanut' | 'tree_nut' | 'wheat' | 'soy' | 'fish' | 'shellfish' | 'sesame';

export type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack';

export type ReactionSeverity = 'none' | 'mild' | 'moderate' | 'severe';

export type OwletSleepState = 'awake' | 'asleep' | 'light_sleep' | 'deep_sleep' | 'unknown';

// Base interface for all syncable entities
export interface SyncableEntity {
  id: string;
  createdAt: number;
  updatedAt: number;
  syncStatus: SyncStatus;
  _deleted: boolean;
}

// Child profile
export interface Child extends SyncableEntity {
  name: string;
  birthDate: string; // ISO date string
  photoUri?: string;
}

// Sleep session
export interface SleepSession extends SyncableEntity {
  childId: string;
  startTime: number; // Unix timestamp ms
  endTime?: number; // null if in progress
  type: SleepType;
  location?: string;
  notes?: string;
}

// Feeding session
export interface FeedingSession extends SyncableEntity {
  childId: string;
  startTime: number;
  endTime?: number;
  type: FeedingType;
  amount?: number; // ml for bottle
  vitaminD?: boolean; // whether vitamin D was added to the bottle
  notes?: string;
}

// Pump session
export interface PumpSession extends SyncableEntity {
  childId: string;
  startTime: number;
  endTime?: number;
  amount?: number; // ml pumped
  notes?: string;
}

// Diaper change
export interface DiaperChange extends SyncableEntity {
  childId: string;
  time: number;
  type: DiaperType;
  notes?: string;
}

// Growth measurement
export interface GrowthMeasurement extends SyncableEntity {
  childId: string;
  date: string; // ISO date string
  weightKg?: number;
  heightCm?: number;
  headCircumferenceCm?: number;
}

// Owlet reading snapshot
export interface OwletReading extends SyncableEntity {
  childId: string;
  recordedAt: number; // Unix timestamp ms when the reading was captured
  heartRateBpm?: number;
  oxygenSaturationPct?: number;
  movementLevel?: number;
  sleepState?: OwletSleepState;
  sockConnected?: boolean;
  batteryPct?: number;
  sourceDeviceId?: string;
  sourceSessionId?: string;
  rawPayload?: Record<string, unknown>;
}

// Solid food log entry
export interface SolidFoodLog extends SyncableEntity {
  childId: string;
  time: number; // Unix timestamp ms
  mealType: MealType;
  foodItems: SolidFoodItem[]; // embedded list of foods eaten
  notes?: string;
  reaction?: ReactionSeverity;
  reactionNotes?: string;
}

// Individual food item within a log (embedded, not a separate table)
export interface SolidFoodItem {
  foodId: string; // references the food database
  name: string; // denormalized for display
  category: FoodCategory;
  isAllergen: boolean;
  allergenGroup?: AllergenGroup;
}

// Static food reference (not synced — lives in code)
export interface FoodDefinition {
  id: string;
  name: string;
  category: FoodCategory;
  isAllergen: boolean;
  allergenGroup?: AllergenGroup;
}

// Active timer state (stored separately for quick access)
export interface ActiveTimer {
  id: string;
  activityType: ActivityType;
  activityId: string;
  startTime: number;
  feedingSide?: 'left' | 'right';
}

// App settings
export interface AppSettings {
  id: string;
  defaultChildId?: string;
  timeFormat: '12h' | '24h';
  theme: 'dark' | 'light' | 'system';
  notificationsEnabled: boolean;
  lastSyncTime?: number;
}

// Unified activity for timeline display
export interface TimelineActivity {
  id: string;
  type: ActivityType;
  startTime: number;
  endTime?: number;
  details: SleepSession | FeedingSession | DiaperChange | SolidFoodLog;
}

// Stats summary
export interface DaySummary {
  date: string;
  totalSleepMinutes: number;
  napCount: number;
  nightSleepMinutes: number;
  feedingCount: number;
  diaperCount: number;
  longestSleepMinutes: number;
  longestWakeMinutes: number;
}
