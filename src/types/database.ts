// ---------------------------------------------------------------------------
// Status unions — match the CHECK constraints in schema.sql exactly
// ---------------------------------------------------------------------------

export type ParkingSessionStatus = 'active' | 'finished' | 'cancelled';
export type QueueStatus = 'waiting' | 'served' | 'cancelled';
export type RequestStatus = 'planned' | 'done' | 'cancelled';

// ---------------------------------------------------------------------------
// Row types — field names and nullability mirror the database schema exactly.
// timestamptz columns come back from Supabase as ISO 8601 strings.
// Nullable columns (no NOT NULL in schema) are typed as `string | null`.
// ---------------------------------------------------------------------------

export type Profile = {
  id: string;
  full_name: string;
  email: string;
  created_at: string;
};

export type ParkingSession = {
  id: string;
  user_id: string;
  start_time: string;
  planned_end_time: string | null;
  actual_end_time: string | null;
  status: ParkingSessionStatus;
  note: string | null;
  created_at: string;
};

export type ParkingQueueItem = {
  id: string;
  user_id: string;
  joined_at: string;
  status: QueueStatus;
};

export type ParkingRequest = {
  id: string;
  user_id: string;
  start_time: string;
  end_time: string;
  note: string | null;
  status: RequestStatus;
  created_at: string;
};

export type Notification = {
  id: string;
  user_id: string;
  title: string;
  message: string;
  is_read: boolean;
  created_at: string;
};

// ---------------------------------------------------------------------------
// Join variants — rows with their related profile embedded.
// Produced by Supabase's foreign-key join syntax: profile:profiles!inner(...)
// ---------------------------------------------------------------------------

export type ParkingSessionWithProfile = ParkingSession & {
  profile: Profile;
};

export type ParkingQueueItemWithProfile = ParkingQueueItem & {
  profile: Profile;
};

export type ParkingRequestWithProfile = ParkingRequest & {
  profile: Profile;
};

// ---------------------------------------------------------------------------
// Input types — used by repositories/services for write operations.
// Keeping inputs separate from row types prevents callers from accidentally
// passing DB-generated fields (id, created_at) into insert payloads.
// ---------------------------------------------------------------------------

export type CreateSessionInput = {
  userId: string;
  plannedEndTime?: string;
  note?: string;
};

export type CreateRequestInput = {
  userId: string;
  startTime: string;
  endTime: string;
  note?: string;
};

export type UpdateRequestInput = {
  startTime?: string;
  endTime?: string;
  note?: string;
  status?: RequestStatus;
};
