declare namespace LOG {
  type Log = {
    id: string;
    projectId: string;
    functionId: string;
    method: string;
    type: 'DEBUG' | 'SUCCESS' | 'INFO' | 'WARNING' | 'ERROR';
    requestHeaders?: any;
    requestUserAgent?: string;
    requestUrl: string;
    requestParams?: any;
    requestBody?: any;
    responseCode: number;
    responseSuccess: boolean;
    responseMessage?: string;
    responseData?: any;
    consoleLog?: string;
    additionalData?: any;
    latency?: number;
    createdById?: string;
    createdByFullname?: string;
    createdByEmplCode?: string;
    createdAt: string;
    updatedAt: string;
    project: {
      id: string;
      name: string;
    };
    function: {
      id: string;
      name: string;
    };
  };

  type Project = {
    id: string;
    name: string;
    createdAt: string;
    updatedAt: string;
    functions?: Function[];
  };

  type Function = {
    id: string;
    name: string;
    projectId: string;
    createdAt: string;
    updatedAt: string;
    project?: {
      id: string;
      name: string;
    };
  };

  type LogListParams = {
    projectIds?: string;
    functionIds?: string;
    method?: string;
    level?: string;
    timeRange?: string;
    startTime?: string;
    endTime?: string;
    cursorId?: string;
    take?: number;
  };

  type LogListResponse = {
    data: Log[];
    pagination: {
      nextCursor: string | null;
      hasMore: boolean;
      count: number;
    };
    filters: {
      projectIds?: string;
      functionIds?: string;
      method?: string;
      level?: string;
      timeRange?: string;
      startTime?: string;
      endTime?: string;
    };
  };

  type ProjectListResponse = {
    data: Project[];
    total: number;
  };

  type FunctionListResponse = {
    data: Function[];
    total: number;
  };
}
