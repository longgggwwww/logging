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
import { Badge, Cascader, Drawer, Tag } from 'antd';
import type { CascaderProps } from 'antd';
import React, { useEffect, useRef, useState } from 'react';
import { getLogs, getProjects } from '@/services/log';

const { SHOW_CHILD } = Cascader;

interface CascaderOption {
  value: string | number;
  label: string;
  projectId?: string;
  functionId?: string;
  children?: CascaderOption[];
}

const TableList: React.FC = () => {
  const actionRef = useRef<ActionType | null>(null);

  const [showDetail, setShowDetail] = useState<boolean>(false);
  const [currentRow, setCurrentRow] = useState<LOG.Log>();
  const [cascaderOptions, setCascaderOptions] = useState<CascaderOption[]>([]);

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
        const onChange: CascaderProps<CascaderOption, 'value', true>['onChange'] = (value) => {
          console.log('Cascader value changed:', value);
        };
        
        return (
          <Cascader
            style={{ width: '100%' }}
            options={cascaderOptions}
            onChange={onChange}
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
        rowKey="id"
        search={{
          labelWidth: 120,
        }}
        request={async (params: any) => {
          console.log('📊 Filter params received:', params);
          
          // Parse filter to extract projectIds and functionIds
          const filter = params.filter;
          let projectIds: string[] = [];
          let functionIds: string[] = [];

          if (filter && Array.isArray(filter)) {
            filter.forEach((item: string) => {
              if (item.startsWith('project-')) {
                const projectId = item.replace('project-', '');
                projectIds.push(projectId);
              } else if (item.startsWith('function-')) {
                const functionId = item.replace('function-', '');
                functionIds.push(functionId);
              }
            });
          }

          // Build request parameters
          const requestParams: LOG.LogListParams = {
            take: params.pageSize || 50,
          };

          // Add filters only if they have values
          if (params.method) {
            requestParams.method = params.method;
          }

          if (params.level) {
            requestParams.level = params.level;
          }

          if (params.timeRange) {
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
              count: response.data.length,
              hasMore: response.pagination.hasMore,
              filters: response.filters,
            });

            return {
              data: response.data,
              success: true,
              total: response.pagination.count,
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
        width={800}
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
