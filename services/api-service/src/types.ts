// Type definitions for the API service

export interface TimeFilter {
  $gte?: Date;
  $lte?: Date;
}

export interface CacheParams {
  projectIds: string;
  functionIds: string;
  method?: string;
  level?: string;
  timeRange?: string;
  startTime?: string;
  endTime?: string;
  cursorId?: string;
  page: number;
  take: number;
  paginationType: string;
}

export interface LogQueryParams {
  projectIds?: string | string[];
  functionIds?: string | string[];
  method?: string;
  type?: string;
  timeRange?: string;
  startTime?: string;
  endTime?: string;
  cursorId?: string;
  page?: string;
  take?: string;
  paginationType?: string;
}

export interface StatsQueryParams {
  projectId?: string;
  timeRange?: string;
}

export interface ProjectQueryParams {
  expand?: string;
}
