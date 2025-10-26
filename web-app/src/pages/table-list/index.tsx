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
import { useIntl } from '@umijs/max';
import { Badge, Cascader, DatePicker, Drawer, Input, Tag } from 'antd';
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
  const [searchParams, setSearchParams] = useState<LOG.LogListParams | null>(null);

  /**
   * @en-US International configuration
   * @zh-CN 国际化配置
   * */
  const intl = useIntl();

  // Load projects with functions for cascader
  useEffect(() => {
    const loadProjectsAndFunctions = async () => {
      try {
        const response = await getProjects({ expand: 'functions' });
        const projects = response.data;
        
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

  // Handle search input
  const handleSearch = (value: string) => {
    const parts = value.split('-').map(p => p.trim());
    const projectName = parts[0];
    const functionName = parts[1];
    const type = parts[2];
    const method = parts[3];

    // Find project (case-insensitive partial match)
    const projectOption = cascaderOptions.find(opt => 
      opt.label.toLowerCase().includes(projectName.toLowerCase())
    );
    if (!projectOption) {
      console.warn('Project not found:', projectName);
      return;
    }

    const projectId = projectOption.projectId;
    let functionId;
    if (functionName) {
      const funcOption = projectOption.children?.find(child => 
        child.label.toLowerCase().includes(functionName.toLowerCase())
      );
      if (funcOption) functionId = funcOption.functionId;
    }

    // Build search params
    const sp: LOG.LogListParams = {
      paginationType: 'offset',
      page: 1,
      take: 50,
    };
    if (projectId) sp.projectIds = projectId;
    if (functionId) sp.functionIds = functionId;
    if (type) sp.level = type;
    if (method) sp.method = method;

    setSearchParams(sp);

    // Reload table
    actionRef.current?.reload();
  };

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
        headerTitle={<Input.Search placeholder="Search: <project>-<function>-<type>-<method>" style={{ width: 400 }} onSearch={handleSearch} />}
        actionRef={actionRef}
        formRef={formRef}
        rowKey="id"
        search={{
          labelWidth: 120,
          defaultCollapsed: false,
        }}
        form={{
          onValuesChange: (changedValues: any) => {
            // Clear search params when form filters change
            setSearchParams(null);
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
          
          let requestParams: LOG.LogListParams;

          if (searchParams) {
            // Use search params
            requestParams = {
              ...searchParams,
              page: params.current || 1,
              take: params.pageSize || 50,
              timeRange: params.timeRange || '24h',
            };
            // Handle date range if present
            if (params.dateRange && Array.isArray(params.dateRange) && params.dateRange.length === 2) {
              const startDate = dayjs(params.dateRange[0]).startOf('day');
              const endDate = dayjs(params.dateRange[1]).endOf('day');
              if (startDate.isValid() && endDate.isValid()) {
                requestParams.startTime = startDate.toISOString();
                requestParams.endTime = endDate.toISOString();
              }
            }
          } else {
            // Normal logic
            // Use selectedFilters state instead of params.filter
            const filter = selectedFilters;
            let projectIds: string[] = [];
            let functionIds: string[] = [];

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
            requestParams = {
              paginationType: 'offset',
              page: params.current || 1,
              take: params.pageSize || 50,
            };

            // Add filters only if they have values
            if (params.method) {
              requestParams.method = params.method;
            }

            if (params.level) {
              requestParams.level = params.level;
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
          }

          console.log('🔍 API request params:', requestParams);

          try {
            const response = await getLogs(requestParams);
            console.log('✅ API response:', {
              count: response.data.length,
              hasMore: response.pagination.hasMore,
              filters: response.filters,
            });

            return {
              data: response.data,
              success: true,
              total: response.pagination.total || 0,
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
