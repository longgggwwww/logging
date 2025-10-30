import { getLogs, getProjects } from '@/services/log';
import type {
    ActionType,
    ProColumns,
    ProDescriptionsItemProps,
} from '@ant-design/pro-components';
import {
    PageContainer,
    ProDescriptions,
    ProTable,
} from '@ant-design/pro-components';
import { Badge, Cascader, DatePicker, Drawer, Tag } from 'antd';
import dayjs from 'dayjs';
import React, { useEffect, useRef, useState } from 'react';

const { SHOW_CHILD } = Cascader;
const { RangePicker } = DatePicker;

interface CascaderOption {
  value: string | number;
  label: string;
  projectId?: string;
  functionId?: string;
  children?: CascaderOption[];
}

const TableList: React.FC = () => {
  const actionRef = useRef<ActionType | null>(null);
  const formRef = useRef<any>(null);

  const [showDetail, setShowDetail] = useState<boolean>(false);
  const [currentRow, setCurrentRow] = useState<LOG.Log>();
  const [cascaderOptions, setCascaderOptions] = useState<CascaderOption[]>([]);
  const [selectedFilters, setSelectedFilters] = useState<any[]>([]);

  // Load projects with functions for cascader
  useEffect(() => {
    const loadProjectsAndFunctions = async () => {
      try {
        const response = await getProjects({ expand: 'functions' });
        const projects = response.data.data;
        
        // Convert to cascader structure
        const options: CascaderOption[] = projects.map((project: LOG.Project) => ({
          label: project.name,
          value: `project-${project.id}`,
          projectId: project.id,
          children: project.functions?.map((func: LOG.Function) => ({
            label: func.name,
            value: `function-${func.id}`,
            functionId: func.id,
            projectId: project.id,
          })) || [],
        }));
        
        setCascaderOptions(options);
      } catch (error) {
        console.error('Failed to load projects:', error);
      }
    };
    
    loadProjectsAndFunctions();
  }, []);

  // Ensure dateRange is cleared when timeRange has initial value
  useEffect(() => {
    if (formRef.current) {
      const formValues = formRef.current.getFieldsValue();
      if (formValues.timeRange && formValues.dateRange) {
        // If both have values, clear dateRange (prioritize timeRange with initialValue)
        formRef.current.setFieldsValue({ dateRange: undefined });
      }
    }
  }, []);

  // Convert log type to badge status
  const getTypeBadgeStatus = (type: string) => {
    const statusMap: Record<string, any> = {
      ERROR: 'error',
      WARNING: 'warning',
      INFO: 'processing',
      SUCCESS: 'success',
      DEBUG: 'default',
    };
    return statusMap[type] || 'default';
  };

  const columns: ProColumns<LOG.Log>[] = [
    {
      title: 'Project',
      dataIndex: ['project', 'name'],
      hideInSearch: true,
      render: (_, record) => {
        return <Tag color="blue">{record.project.name}</Tag>;
      },
    },
    {
      title: 'Function',
      dataIndex: ['function', 'name'],
      hideInSearch: true,
      render: (_, record) => {
        return <Tag color="cyan">{record.function.name}</Tag>;
      },
    },
    {
      title: 'Project Filter',
      dataIndex: 'filter',
      hideInTable: true,
      renderFormItem: () => {
        return (
          <Cascader
            style={{ width: '100%' }}
            options={cascaderOptions}
            value={selectedFilters}
            onChange={(selectedValues) => {
              console.log('✏️ Cascader onChange:', selectedValues);
              setSelectedFilters(selectedValues);
            }}
            multiple
            maxTagCount="responsive"
            showCheckedStrategy={SHOW_CHILD}
            placeholder="Select project or function"
            changeOnSelect
          />
        );
      },
    },
    {
      title: 'Method',
      dataIndex: 'method',
      valueType: 'select',
      valueEnum: {
        GET: { text: 'GET', status: 'Default' },
        POST: { text: 'POST', status: 'Processing' },
        PUT: { text: 'PUT', status: 'Warning' },
        PATCH: { text: 'PATCH', status: 'Default' },
        DELETE: { text: 'DELETE', status: 'Error' },
      },
      render: (_, record) => {
        const colorMap: Record<string, string> = {
          GET: 'green',
          POST: 'blue',
          PUT: 'orange',
          PATCH: 'purple',
          DELETE: 'red',
        };
        return <Tag color={colorMap[record.method] || 'default'}>{record.method}</Tag>;
      },
    },
    {
      title: 'Type',
      dataIndex: 'level',
      valueType: 'select',
      valueEnum: {
        DEBUG: { text: 'DEBUG', status: 'Default' },
        SUCCESS: { text: 'SUCCESS', status: 'Success' },
        INFO: { text: 'INFO', status: 'Processing' },
        WARNING: { text: 'WARNING', status: 'Warning' },
        ERROR: { text: 'ERROR', status: 'Error' },
      },
      render: (_, record) => {
        return <Badge status={getTypeBadgeStatus(record.type)} text={record.type} />;
      },
    },
    {
      title: 'URL',
      dataIndex: 'requestUrl',
      ellipsis: true,
      hideInSearch: true,
      render: (dom, entity) => {
        return (
          <a
            onClick={() => {
              setCurrentRow(entity);
              setShowDetail(true);
            }}
          >
            {dom}
          </a>
        );
      },
    },
    {
      title: 'Response Code',
      dataIndex: 'responseCode',
      hideInSearch: true,
      render: (_, record) => {
        const code = record.responseCode;
        let color = 'default';
        if (code >= 200 && code < 300) color = 'success';
        else if (code >= 300 && code < 400) color = 'processing';
        else if (code >= 400 && code < 500) color = 'warning';
        else if (code >= 500) color = 'error';
        return <Badge status={color as any} text={code} />;
      },
    },
    {
      title: 'Latency (ms)',
      dataIndex: 'latency',
      hideInSearch: true,
      sorter: true,
      render: (_, record) => {
        const latency = record.latency || 0;
        let color = 'green';
        if (latency > 1000) color = 'red';
        else if (latency > 500) color = 'orange';
        return <span style={{ color }}>{latency} ms</span>;
      },
    },
    {
      title: 'Time Range',
      dataIndex: 'timeRange',
      hideInTable: true,
      valueType: 'select',
      valueEnum: {
        '15m': { text: 'Last 15 minutes' },
        '30m': { text: 'Last 30 minutes' },
        '1h': { text: 'Last 1 hour' },
        '3h': { text: 'Last 3 hours' },
        '6h': { text: 'Last 6 hours' },
        '12h': { text: 'Last 12 hours' },
        '24h': { text: 'Last 24 hours' },
        '7d': { text: 'Last 7 days' },
        '30d': { text: 'Last 30 days' },
      },
      initialValue: '24h',
    },
    {
      title: 'Date Range',
      dataIndex: 'dateRange',
      hideInTable: true,
      renderFormItem: () => (
        <RangePicker
          format="YYYY-MM-DD"
          style={{ width: '100%' }}
        />
      ),
    },
    {
      title: 'Created At',
      dataIndex: 'createdAt',
      valueType: 'dateTime',
      hideInSearch: true,
      sorter: true,
    },
  ];


  return (
    <PageContainer>
      <ProTable<LOG.Log, LOG.LogListParams>
        headerTitle="Logs"
        actionRef={actionRef}
        formRef={formRef}
        rowKey="id"
        search={{
          labelWidth: 120,
          defaultCollapsed: false,
        }}
        form={{
          onValuesChange: (changedValues: any) => {
            // When timeRange changes, clear dateRange
            if (changedValues.timeRange !== undefined) {
              formRef.current?.setFieldsValue({ dateRange: undefined });
            }
            // When dateRange changes, clear timeRange
            if (changedValues.dateRange !== undefined) {
              formRef.current?.setFieldsValue({ timeRange: undefined });
            }
          },
        }}
        pagination={{
          defaultPageSize: 10,
          showSizeChanger: true,
          pageSizeOptions: ['10', '20', '50', '100'],
        }}
        request={async (params: any) => {
          console.log('📊 Filter params received:', params);
          console.log('🎯 Selected filters from state:', selectedFilters);
          
          // Use selectedFilters state instead of params.filter
          const filter = selectedFilters;
          const projectIds: string[] = [];
          const functionIds: string[] = [];

          if (filter && Array.isArray(filter) && filter.length > 0) {
            console.log('🔍 Filter array:', filter);
            
            // Cascader with multiple returns array of arrays like [["project-1"], ["project-2", "function-2"]]
            filter.forEach((path: any) => {
              if (Array.isArray(path)) {
                // Each path is an array like ["project-1"] or ["project-1", "function-1"]
                path.forEach((item: string) => {
                  if (typeof item === 'string') {
                    if (item.startsWith('project-')) {
                      const projectId = item.replace('project-', '');
                      if (!projectIds.includes(projectId)) {
                        projectIds.push(projectId);
                      }
                    } else if (item.startsWith('function-')) {
                      const functionId = item.replace('function-', '');
                      if (!functionIds.includes(functionId)) {
                        functionIds.push(functionId);
                      }
                    }
                  }
                });
              } else if (typeof path === 'string') {
                // Fallback for single values
                if (path.startsWith('project-')) {
                  const projectId = path.replace('project-', '');
                  if (!projectIds.includes(projectId)) {
                    projectIds.push(projectId);
                  }
                } else if (path.startsWith('function-')) {
                  const functionId = path.replace('function-', '');
                  if (!functionIds.includes(functionId)) {
                    functionIds.push(functionId);
                  }
                }
              }
            });
            
            console.log('📋 Parsed projectIds:', projectIds);
            console.log('📋 Parsed functionIds:', functionIds);
          }

          // Build request parameters
          const requestParams: LOG.LogListParams = {
            paginationType: 'offset',
            page: params.current || 1,
            take: params.pageSize || 50,
          };

          // Add filters only if they have values
          if (params.method) {
            requestParams.method = params.method;
          }

          if (params.level) {
            requestParams.type = params.level;
          }

          // Handle custom date range or time range
          if (params.dateRange && Array.isArray(params.dateRange) && params.dateRange.length === 2) {
            const startDate = dayjs(params.dateRange[0]).startOf('day');
            const endDate = dayjs(params.dateRange[1]).endOf('day');
            
            if (startDate.isValid() && endDate.isValid()) {
              requestParams.startTime = startDate.toISOString();
              requestParams.endTime = endDate.toISOString();
            }
          } else if (params.timeRange) {
            requestParams.timeRange = params.timeRange;
          } else {
            requestParams.timeRange = '24h'; // Default
          }

          if (projectIds.length > 0) {
            requestParams.projectIds = projectIds.join(',');
          }

          if (functionIds.length > 0) {
            requestParams.functionIds = functionIds.join(',');
          }

          console.log('🔍 API request params:', requestParams);

          try {
            const response = await getLogs(requestParams);
            console.log('✅ API response:', {
              count: response.data.data.length,
              hasMore: response.data.pagination.hasMore,
              filters: response.data.filters,
            });

            // Normalize API items to shape expected by the table.
            // The backend returns nested `request.url` and `response.code`,
            // but the table/typings expect flat `requestUrl` and `responseCode`.
            const mapped = (response.data.data || []).map((item: any) => ({
              ...item,
              // request.* -> flattened fields used by columns / drawer
              requestUrl: item.request?.url ?? item.requestUrl ?? '',
              requestHeaders: item.request?.headers ?? item.requestHeaders,
              requestUserAgent: item.request?.userAgent ?? item.requestUserAgent,
              requestParams: item.request?.params ?? item.requestParams,
              requestBody: item.request?.body ?? item.requestBody,
              // response.* -> flattened fields
              responseCode: item.response?.code ?? item.responseCode ?? 0,
              responseSuccess: item.response?.success ?? item.responseSuccess,
              responseMessage: item.response?.message ?? item.responseMessage,
              responseData: item.response?.data ?? item.responseData,
            }));

            return {
              data: mapped,
              success: true,
              total: response.data.pagination.total || 0,
            };
          } catch (error) {
            console.error('❌ Failed to fetch logs:', error);
            return {
              data: [],
              success: false,
              total: 0,
            };
          }
        }}
        columns={columns}
      />

      <Drawer
        width={200}
        open={showDetail}
        onClose={() => {
          setCurrentRow(undefined);
          setShowDetail(false);
        }}
        closable={false}
      >
        {currentRow?.requestUrl && (
          <ProDescriptions<LOG.Log>
            column={1}
            title={currentRow?.requestUrl}
            request={async () => ({
              data: currentRow || {},
            })}
            params={{
              id: currentRow?.id,
            }}
            columns={columns as ProDescriptionsItemProps<LOG.Log>[]}
          />
        )}
      </Drawer>
    </PageContainer>
  );
};

export default TableList;
