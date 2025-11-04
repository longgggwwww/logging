import { getProjects } from '@/services/log';
import { EyeOutlined } from '@ant-design/icons';
import type { ActionType, ProColumns } from '@ant-design/pro-components';
import { PageContainer } from '@ant-design/pro-components';
import {
    Badge,
    Card,
    Collapse,
    Descriptions,
    Drawer,
    Select,
    Space,
    Table,
    Tag,
    Typography,
} from 'antd';
import dayjs from 'dayjs';
import React, { useEffect, useRef, useState } from 'react';
import { io, type Socket } from 'socket.io-client';

const { Text, Paragraph } = Typography;

interface CascaderOption {
  value: string | number;
  label: string;
  projectId?: string;
  functionId?: string;
  children?: CascaderOption[];
}

const Realtime: React.FC = () => {
  const _actionRef = useRef<ActionType | null>(null);
  const _formRef = useRef<any>(null);
  const socketRef = useRef<Socket | null>(null);
  const isSubscribedRef = useRef<boolean>(false);

  const [showDetail, setShowDetail] = useState<boolean>(false);
  const [currentRow, setCurrentRow] = useState<LOG.RealtimeLog>();
  const [_cascaderOptions, setCascaderOptions] = useState<CascaderOption[]>([]);
  const [_selectedFilters, _setSelectedFilters] = useState<any[]>([]);
  const [socketConnected, setSocketConnected] = useState<boolean>(false);
  const [logs, setLogs] = useState<LOG.RealtimeLog[]>([]);
  const [loading, _setLoading] = useState<boolean>(false);
  const [methodFilter, setMethodFilter] = useState<string | undefined>(
    undefined,
  );
  const [levelFilter, setLevelFilter] = useState<string | undefined>(undefined);
  const [newLogIds, setNewLogIds] = useState<Set<string>>(new Set());

  // Socket.IO Connection
  useEffect(() => {
    // Prevent duplicate connections
    if (socketRef.current?.connected) {
      console.log('⚠️ Socket already connected, skipping...');
      return;
    }

    console.log('🔌 Connecting to Socket.IO server...');

    // Get WebSocket URL from environment variable or use default
    const websocketUrl = process.env.WEBSOCKET_URL || 'http://localhost:5000';

    // Connect to realtime-service
    const socket = io(websocketUrl, {
      transports: ['websocket', 'polling'],
      reconnectionDelay: 1000,
      reconnection: true,
      reconnectionAttempts: 10,
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      console.log('✅ Socket.IO connected! Socket ID:', socket.id);
      setSocketConnected(true);

      // Subscribe only once
      if (!isSubscribedRef.current) {
        socket.emit('subscribe');
        isSubscribedRef.current = true;
        console.log('📡 Subscribed to log updates');
      }
    });

    socket.on('connected', (data) => {
      console.log('🎉 Received connected event:', data);
    });

    socket.on('new-log', (log) => {
      console.log('📨 New log received:', log);
      // Add new log to the top of the list with animation
      setLogs((prevLogs) => {
        // Normalize the log data
        const normalizedLog = {
          ...log,
          requestUrl: log.request?.url ?? log.requestUrl ?? '',
          requestHeaders: log.request?.headers ?? log.requestHeaders,
          requestUserAgent: log.request?.userAgent ?? log.requestUserAgent,
          requestParams: log.request?.params ?? log.requestParams,
          requestBody: log.request?.body ?? log.requestBody,
          responseCode: log.response?.code ?? log.responseCode ?? 0,
          responseSuccess: log.response?.success ?? log.responseSuccess,
          responseMessage: log.response?.message ?? log.responseMessage,
          responseData: log.response?.data ?? log.responseData,
        };
        return [normalizedLog, ...prevLogs];
      });

      // Mark this log as new for animation
      setNewLogIds((prev) => {
        const newSet = new Set(prev);
        newSet.add(log.id);
        return newSet;
      });

      // Remove the "new" marker after animation completes
      setTimeout(() => {
        setNewLogIds((prev) => {
          const newSet = new Set(prev);
          newSet.delete(log.id);
          return newSet;
        });
      }, 1000);
    });

    socket.on('metrics', (metrics) => {
      console.log('📊 Metrics received:', metrics);
    });

    socket.on('disconnect', () => {
      console.log('❌ Socket.IO disconnected');
      setSocketConnected(false);
    });

    socket.on('connect_error', (error) => {
      console.error('⚠️ Socket.IO connection error:', error);
    });

    // Cleanup on unmount
    return () => {
      console.log('🔌 Disconnecting Socket.IO...');
      socket.emit('unsubscribe');
      socket.disconnect();
    };
  }, []);

  // Load projects with functions for cascader
  useEffect(() => {
    const loadProjectsAndFunctions = async () => {
      try {
        const response = await getProjects({ expand: 'functions' });
        const projects = response.data.data;

        // Convert to cascader structure
        const options: CascaderOption[] = projects.map(
          (project: LOG.Project) => ({
            label: project.name,
            value: `project-${project.id}`,
            projectId: project.id,
            children:
              project.functions?.map((func: LOG.Function) => ({
                label: func.name,
                value: `function-${func.id}`,
                functionId: func.id,
                projectId: project.id,
              })) || [],
          }),
        );

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

  const columns: ProColumns<LOG.RealtimeLog>[] = [
    {
      title: 'Project',
      dataIndex: 'projectName',
      hideInSearch: true,
      render: (_, record) => {
        const projectName = record.project || '-';
        return <Tag color="blue">{projectName}</Tag>;
      },
    },
    {
      title: 'Function',
      dataIndex: 'functionName',
      hideInSearch: true,
      render: (_, record) => {
        const functionName = record.function || '-';
        return <Tag color="cyan">{functionName}</Tag>;
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
        return (
          <Tag color={colorMap[record.method] || 'default'}>
            {record.method}
          </Tag>
        );
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
        return (
          <Badge status={getTypeBadgeStatus(record.type)} text={record.type} />
        );
      },
    },
    {
      title: 'URL',
      dataIndex: 'requestUrl',
      ellipsis: true,
      hideInSearch: true,
    },
    {
      title: 'Response Code',
      dataIndex: 'responseCode',
      hideInSearch: true,
      render: (_, record) => {
        const code = record.response.code;
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
      title: 'Created At',
      dataIndex: 'createdAt',
      hideInSearch: true,
      sorter: true,
      render: (_, record, index) => {
        const formattedDate = dayjs(record.createdAt).format(
          'YYYY-MM-DD HH:mm:ss',
        );
        return (
          <Space>
            <span>{formattedDate}</span>
            {index === 0 && (
              <Badge count="newest" style={{ backgroundColor: '#ff4d4f' }} />
            )}
            {index > 0 && index < 5 && <Badge status="error" />}
          </Space>
        );
      },
    },
    {
      title: 'Actions',
      dataIndex: 'actions',
      hideInSearch: true,
      width: 80,
      align: 'center',
      render: (_, record) => {
        return (
          <EyeOutlined
            style={{ fontSize: '16px', cursor: 'pointer', color: '#1890ff' }}
            onClick={() => {
              setCurrentRow(record);
              setShowDetail(true);
            }}
          />
        );
      },
    },
  ];
  // Filter logs based on selected filters
  const filteredLogs = logs.filter((log) => {
    // Apply method filter
    if (methodFilter && log.method !== methodFilter) {
      return false;
    }

    // Apply level filter
    if (levelFilter && log.type !== levelFilter) {
      return false;
    }

    return true;
  });

  // Convert columns to table columns format
  const tableColumns = columns
    .map((col) => {
      if (col.hideInSearch === false || col.hideInTable) {
        return null;
      }
      return {
        title: col.title,
        dataIndex: col.dataIndex,
        key: col.dataIndex as string,
        width: col.width,
        align: col.align,
        render: col.render,
        ellipsis: col.ellipsis,
      };
    })
    .filter(Boolean);

  return (
    <PageContainer
      header={{
        title: 'Realtime Logs',
        extra: [
          <Tag key="socket" color={socketConnected ? 'green' : 'red'}>
            {socketConnected ? '🟢 Connected' : '🔴 Disconnected'}
          </Tag>,
        ],
      }}
    >
      <Card>
        <Space
          direction="vertical"
          style={{ width: '100%', marginBottom: 16 }}
          size="middle"
        >
          <Space wrap>
            <Select
              style={{ width: 150 }}
              placeholder="Method"
              allowClear
              value={methodFilter}
              onChange={setMethodFilter}
              options={[
                { label: 'GET', value: 'GET' },
                { label: 'POST', value: 'POST' },
                { label: 'PUT', value: 'PUT' },
                { label: 'PATCH', value: 'PATCH' },
                { label: 'DELETE', value: 'DELETE' },
              ]}
            />
            <Select
              style={{ width: 150 }}
              placeholder="Type"
              allowClear
              value={levelFilter}
              onChange={setLevelFilter}
              options={[
                { label: 'DEBUG', value: 'DEBUG' },
                { label: 'SUCCESS', value: 'SUCCESS' },
                { label: 'INFO', value: 'INFO' },
                { label: 'WARNING', value: 'WARNING' },
                { label: 'ERROR', value: 'ERROR' },
              ]}
            />
          </Space>
        </Space>

        <style>
          {`
            @keyframes slideInFromTop {
              from {
                opacity: 0;
                transform: translateY(-20px);
              }
              to {
                opacity: 1;
                transform: translateY(0);
              }
            }
            
            .new-log-row {
              animation: slideInFromTop 0.5s ease-out;
              background-color: #e6f7ff;
            }
            
            .new-log-row td {
              background-color: #e6f7ff !important;
            }
          `}
        </style>

        <Table
          loading={loading}
          dataSource={filteredLogs}
          columns={tableColumns as any}
          rowKey="id"
          pagination={false}
          locale={{ emptyText: 'No logs available' }}
          scroll={{ x: 'max-content' }}
          rowClassName={(record) => {
            // Apply animation class to newly added logs
            return newLogIds.has(record.id) ? 'new-log-row' : '';
          }}
        />
      </Card>

      <Drawer
        title="Log Details"
        placement="right"
        width="100%"
        open={showDetail}
        onClose={() => {
          setCurrentRow(undefined);
          setShowDetail(false);
        }}
        styles={{ body: { paddingBottom: 80 } }}
      >
        {currentRow && (
          <Collapse
            defaultActiveKey={['basic']}
            size="large"
            items={[
              {
                key: 'basic',
                label: 'Basic Information',
                children: (
                  <Descriptions bordered column={2}>
                    <Descriptions.Item label="Project">
                      <Tag color="blue">{currentRow.project || '-'}</Tag>
                    </Descriptions.Item>
                    <Descriptions.Item label="Function">
                      <Tag color="cyan">{currentRow.function || '-'}</Tag>
                    </Descriptions.Item>
                    <Descriptions.Item label="Method">
                      {(() => {
                        const colorMap: Record<string, string> = {
                          GET: 'green',
                          POST: 'blue',
                          PUT: 'orange',
                          PATCH: 'purple',
                          DELETE: 'red',
                        };
                        return (
                          <Tag color={colorMap[currentRow.method] || 'default'}>
                            {currentRow.method}
                          </Tag>
                        );
                      })()}
                    </Descriptions.Item>
                    <Descriptions.Item label="Type">
                      <Badge
                        status={getTypeBadgeStatus(currentRow.type)}
                        text={currentRow.type}
                      />
                    </Descriptions.Item>
                    <Descriptions.Item label="URL" span={2}>
                      <Text copyable>{currentRow.request.url}</Text>
                    </Descriptions.Item>
                    <Descriptions.Item label="Latency">
                      {(() => {
                        const latency = currentRow.latency || 0;
                        let color = 'green';
                        if (latency > 1000) color = 'red';
                        else if (latency > 500) color = 'orange';
                        return <span style={{ color }}>{latency} ms</span>;
                      })()}
                    </Descriptions.Item>
                    <Descriptions.Item label="Created At">
                      {dayjs(currentRow.createdAt).format(
                        'YYYY-MM-DD HH:mm:ss',
                      )}
                    </Descriptions.Item>
                    <Descriptions.Item label="Created By" span={2}>
                      {currentRow.createdBy?.fullname} (
                      {currentRow.createdBy?.emplCode})
                    </Descriptions.Item>
                  </Descriptions>
                ),
              },
              {
                key: 'request',
                label: 'Request Details',
                children: (
                  <Descriptions bordered column={1}>
                    {currentRow.request.userAgent && (
                      <Descriptions.Item label="User Agent">
                        <Text copyable>{currentRow.request.userAgent}</Text>
                      </Descriptions.Item>
                    )}
                    {currentRow.request.headers && (
                      <Descriptions.Item label="Headers">
                        <Paragraph>
                          <pre
                            style={{
                              background: '#f5f5f5',
                              padding: '12px',
                              borderRadius: '4px',
                              maxHeight: '200px',
                              overflow: 'auto',
                            }}
                          >
                            {JSON.stringify(
                              currentRow.request.headers,
                              null,
                              2,
                            )}
                          </pre>
                        </Paragraph>
                      </Descriptions.Item>
                    )}
                    {currentRow.request.params && (
                      <Descriptions.Item label="Params">
                        <Paragraph>
                          <pre
                            style={{
                              background: '#f5f5f5',
                              padding: '12px',
                              borderRadius: '4px',
                              maxHeight: '200px',
                              overflow: 'auto',
                            }}
                          >
                            {JSON.stringify(currentRow.request.params, null, 2)}
                          </pre>
                        </Paragraph>
                      </Descriptions.Item>
                    )}
                    {currentRow.request.body && (
                      <Descriptions.Item label="Body">
                        <Paragraph>
                          <pre
                            style={{
                              background: '#f5f5f5',
                              padding: '12px',
                              borderRadius: '4px',
                              maxHeight: '300px',
                              overflow: 'auto',
                            }}
                          >
                            {JSON.stringify(currentRow.request.body, null, 2)}
                          </pre>
                        </Paragraph>
                      </Descriptions.Item>
                    )}
                  </Descriptions>
                ),
              },
              {
                key: 'response',
                label: 'Response Details',
                children: (
                  <Descriptions bordered column={1}>
                    <Descriptions.Item label="Status Code">
                      {(() => {
                        const code = currentRow.response.code;
                        let color = 'default';
                        if (code >= 200 && code < 300) color = 'success';
                        else if (code >= 300 && code < 400)
                          color = 'processing';
                        else if (code >= 400 && code < 500) color = 'warning';
                        else if (code >= 500) color = 'error';
                        return <Badge status={color as any} text={code} />;
                      })()}
                    </Descriptions.Item>
                    <Descriptions.Item label="Success">
                      <Tag
                        color={currentRow.response.success ? 'green' : 'red'}
                      >
                        {currentRow.response.success ? 'Yes' : 'No'}
                      </Tag>
                    </Descriptions.Item>
                    {currentRow.response.message && (
                      <Descriptions.Item label="Message">
                        {currentRow.response.message}
                      </Descriptions.Item>
                    )}
                    {currentRow.response.data && (
                      <Descriptions.Item label="Data">
                        <Paragraph>
                          <pre
                            style={{
                              background: '#f5f5f5',
                              padding: '12px',
                              borderRadius: '4px',
                              maxHeight: '300px',
                              overflow: 'auto',
                            }}
                          >
                            {JSON.stringify(currentRow.response.data, null, 2)}
                          </pre>
                        </Paragraph>
                      </Descriptions.Item>
                    )}
                  </Descriptions>
                ),
              },
              ...(currentRow.consoleLog || currentRow.additionalData
                ? [
                    {
                      key: 'additional',
                      label: 'Additional Information',
                      children: (
                        <Descriptions bordered column={1}>
                          {currentRow.consoleLog && (
                            <Descriptions.Item label="Console Log">
                              <Paragraph>
                                <pre
                                  style={{
                                    background: '#f5f5f5',
                                    padding: '12px',
                                    borderRadius: '4px',
                                    maxHeight: '200px',
                                    overflow: 'auto',
                                  }}
                                >
                                  {currentRow.consoleLog}
                                </pre>
                              </Paragraph>
                            </Descriptions.Item>
                          )}
                          {currentRow.additionalData && (
                            <Descriptions.Item label="Additional Data">
                              <Paragraph>
                                <pre
                                  style={{
                                    background: '#f5f5f5',
                                    padding: '12px',
                                    borderRadius: '4px',
                                    maxHeight: '200px',
                                    overflow: 'auto',
                                  }}
                                >
                                  {JSON.stringify(
                                    currentRow.additionalData,
                                    null,
                                    2,
                                  )}
                                </pre>
                              </Paragraph>
                            </Descriptions.Item>
                          )}
                        </Descriptions>
                      ),
                    },
                  ]
                : []),
            ]}
          />
        )}
      </Drawer>
    </PageContainer>
  );
};

export default Realtime;
