declare namespace LOG {
  type Log = {
    id: string;
    project: {
      id: string;
      name: string;
    };
    function: {
      id: string;
      name: string;
    };
    method: string;
    type: 'DEBUG' | 'SUCCESS' | 'INFO' | 'WARNING' | 'ERROR';
    request: {
      userAgent?: string;
      url: string;
      body?: any;
      params?: any;
      headers?: any;
    };
    response: {
      code: number;
      success: boolean;
      message?: string;
      data?: any;
    };
    consoleLog?: string;
    additionalData?: any;
    latency?: number;
    createdBy: {
      id: string;
      fullname: string;
      emplCode: string;
    };
    createdAt: string;
  };

  type RealtimeLog = {
    id: string;
    project: string;
    function: string;
    method: string;
    type: 'DEBUG' | 'SUCCESS' | 'INFO' | 'WARNING' | 'ERROR';
    request: {
      userAgent?: string;
      url: string;
      body?: any;
      params?: any;
      headers?: any;
    };
    response: {
      code: number;
      success: boolean;
      message?: string;
      data?: any;
    };
    consoleLog?: string;
    additionalData?: any;
    latency?: number;
    createdBy?: {
      id: string;
      fullname: string;
      emplCode: string;
    };
    createdAt: string;
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
    project: string;
    createdAt: string;
    updatedAt: string;
  };

  type LogListParams = {
    projectIds?: string;
    functionIds?: string;
    method?: string;
    type?: string;
    timeRange?: string;
    startTime?: string;
    endTime?: string;
    paginationType?: 'cursor' | 'offset';
    page?: number;
    take?: number;
  };

  type LogListResponse = {
    data: Log[];
    pagination: {
      type: 'cursor' | 'offset';
      // Cursor pagination fields
      nextCursor?: string | null;
      // Offset pagination fields
      page?: number;
      pageSize?: number;
      total?: number;
      totalPages?: number;
      hasPrevious?: boolean;
      // Common fields
      hasMore: boolean;
      count: number;
    };
    filters: {
      projectIds?: string;
      functionIds?: string;
      method?: string;
      type?: string;
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
