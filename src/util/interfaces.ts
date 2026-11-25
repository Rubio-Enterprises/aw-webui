interface EventData {
  [key: string]: unknown;
  app?: string;
  classname?: string;
  title?: string;
  url?: string;
  file?: string;
  project?: string;
  language?: string;
  label?: string;
  running?: boolean;
  status?: string;
  subevents?: IEvent[];
  $category?: string[];
  $color?: string;
  $domain?: string;
  $score?: number;
  $total_score?: number;
}

export interface IEvent {
  id?: number;
  timestamp: string;
  duration: number;
  data: EventData;
}

export interface IBucket {
  id: string;
  hostname?: string;
  device_id?: string;
  // The watcher that created the bucket (e.g. aw-watcher-window)
  client?: string;
  type: string;
  data: {
    [key: string]: unknown;
    hostname?: string;
    device_id?: string;
  };
  metadata?: { start?: Date | string; end?: Date | string };
  last_updated?: Date | string;
  first_seen?: Date | string;
  created?: Date | string;
  // Filled in by the bucket store when a view loads a bucket's events.
  events?: IEvent[];
}
