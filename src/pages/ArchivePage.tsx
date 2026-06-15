import { useState } from 'react'
import {
  Card,
  Table,
  Row,
  Col,
  Statistic,
  Button,
  Modal,
  Tag,
  Space,
  Descriptions,
  List,
  Avatar,
  Rate,
  App,
  Divider,
  Empty,
  Timeline
} from 'antd'
import {
  FolderOpenOutlined,
  EyeOutlined,
  FileTextOutlined,
  StarOutlined,
  CalendarOutlined,
  UserOutlined,
  SafetyCertificateOutlined
} from '@ant-design/icons'
import dayjs from 'dayjs'
import type { DizhangArchive, ProcessRecord } from '../types/dizhang'
import { useDizhangStore, usePersistence } from '../store/dizhangStore'

const ArchivePage = () => {
  const { message } = App.useApp()
  const archives = useDizhangStore(state => state.archives)
  const components = useDizhangStore(state => state.components)
  const currentArchive = useDizhangStore(state => state.currentArchive)
  const setCurrentArchive = useDizhangStore(state => state.setCurrentArchive)
  const { exportData } = usePersistence()

  const [detailVisible, setDetailVisible] = useState(false)

  const handleViewDetail = (archive: DizhangArchive) => {
    setCurrentArchive(archive)
    setDetailVisible(true)
  }

  const handleExport = async (archive: DizhangArchive) => {
    const success = await exportData('archive', archive.id)
    if (success) {
      message.success('档案已导出')
    }
  }

  const getResultTag = (result: ProcessRecord['inspectionResult']) => {
    switch (result) {
      case 'pass': return <Tag color="green">合格</Tag>
      case 'warning': return <Tag color="orange">有偏差</Tag>
      case 'fail': return <Tag color="red">不合格</Tag>
      default: return null
    }
  }

  const getQualityStars = (rating: number) => {
    return <Rate disabled value={rating} character={<StarOutlined />} />
  }

  const columns = [
    {
      title: '构件编号',
      dataIndex: 'componentCode',
      key: 'componentCode',
      width: 120,
      render: (text: string) => <code style={{ background: '#f0e6d6', padding: '2px 6px', borderRadius: 4 }}>{text}</code>
    },
    {
      title: '构件名称',
      dataIndex: 'componentName',
      key: 'componentName',
      width: 150
    },
    {
      title: '地仗等级',
      dataIndex: 'gradeName',
      key: 'gradeName',
      width: 120
    },
    {
      title: '施工面积',
      dataIndex: 'totalArea',
      key: 'totalArea',
      width: 120,
      render: (a: number) => `${a.toFixed(2)} ㎡`
    },
    {
      title: '施工周期',
      key: 'period',
      width: 180,
      render: (_: unknown, record: DizhangArchive) => (
        <Space direction="vertical" size={0}>
          <span>{dayjs(record.startDate).format('YYYY-MM-DD')}</span>
          <span style={{ color: '#8b7355' }}>至</span>
          <span>{dayjs(record.endDate).format('YYYY-MM-DD')}</span>
        </Space>
      )
    },
    {
      title: '质量评级',
      dataIndex: 'qualityRating',
      key: 'qualityRating',
      width: 150,
      render: (rating: number) => getQualityStars(rating)
    },
    {
      title: '灰料用量 (kg)',
      key: 'ashUsage',
      width: 180,
      render: (_: unknown, record: DizhangArchive) => (
        <Space size={8} wrap>
          <span>灰:{record.materialList.ash.toFixed(1)}</span>
          <span>灰:{record.materialList.lime.toFixed(1)}</span>
          <span>油:{record.materialList.tungOil.toFixed(1)}</span>
        </Space>
      )
    },
    {
      title: '麻布用量',
      key: 'mabuUsage',
      width: 120,
      render: (_: unknown, record: DizhangArchive) => (
        <Space size={8}>
          {record.materialList.ma > 0 && <span>麻:{record.materialList.ma.toFixed(1)}kg</span>}
          {record.materialList.bu > 0 && <span>布:{record.materialList.bu.toFixed(1)}㎡</span>}
        </Space>
      )
    },
    {
      title: '验收人员',
      dataIndex: 'inspector',
      key: 'inspector',
      width: 100,
      render: (text?: string) => text || '-'
    },
    {
      title: '操作',
      key: 'action',
      width: 180,
      fixed: 'right' as const,
      render: (_: unknown, record: DizhangArchive) => (
        <Space size="small">
          <Button
            type="primary"
            size="small"
            icon={<EyeOutlined />}
            onClick={() => handleViewDetail(record)}
          >
            查看详情
          </Button>
          <Button
            size="small"
            icon={<FileTextOutlined />}
            onClick={() => handleExport(record)}
          >
            导出
          </Button>
        </Space>
      )
    }
  ]

  const stats = [
    { label: '总档案数', value: archives.length, icon: <FolderOpenOutlined />, color: '#8B4513' },
    { 
      label: '平均质量评级', 
      value: archives.length > 0 
        ? (archives.reduce((sum, a) => sum + a.qualityRating, 0) / archives.length).toFixed(1) 
        : 0, 
      icon: <StarOutlined />, 
      color: '#faad14' 
    },
    { 
      label: '总施工面积', 
      value: archives.reduce((sum, a) => sum + a.totalArea, 0).toFixed(1), 
      suffix: '㎡',
      icon: <SafetyCertificateOutlined />, 
      color: '#52c41a' 
    },
    { 
      label: '总灰料用量', 
      value: archives.reduce((sum, a) => sum + a.materialList.ash + a.materialList.lime, 0).toFixed(0), 
      suffix: 'kg',
      icon: <FileTextOutlined />, 
      color: '#d4a574' 
    }
  ]

  return (
    <div>
      <div className="page-title">
        <span>📁 工艺档案</span>
        <div className="page-subtitle">查看和管理已完成的地仗工艺档案，追溯施工历史</div>
      </div>

      {archives.length === 0 ? (
        <Card>
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description="暂无工艺档案"
          >
            <div style={{ color: '#8b7355', marginBottom: 16 }}>
              完成披灰工序后，系统将自动生成工艺档案
            </div>
          </Empty>
        </Card>
      ) : (
        <>
          <Row gutter={16} style={{ marginBottom: 16 }}>
            {stats.map((stat, index) => (
              <Col span={6} key={index}>
                <Card className="stat-card">
                  <Space direction="vertical" size={0} style={{ width: '100%' }}>
                    <Avatar 
                      style={{ 
                        backgroundColor: stat.color + '20', 
                        color: stat.color,
                        marginBottom: 8
                      }}
                      size={40}
                    >
                      {stat.icon}
                    </Avatar>
                    <div className="stat-value" style={{ color: stat.color }}>
                      {stat.value}{stat.suffix || ''}
                    </div>
                    <div className="stat-label">{stat.label}</div>
                  </Space>
                </Card>
              </Col>
            ))}
          </Row>

          <Card
            title="档案列表"
            extra={
              <Space>
                <span style={{ color: '#8b7355' }}>共 {archives.length} 条档案记录</span>
              </Space>
            }
          >
            <Table
              columns={columns}
              dataSource={archives}
              rowKey="id"
              scroll={{ x: 1400 }}
              pagination={{
                pageSize: 10,
                showSizeChanger: true,
                showTotal: (total) => `共 ${total} 条记录`
              }}
            />
          </Card>
        </>
      )}

      <Modal
        title="工艺档案详情"
        open={detailVisible}
        onCancel={() => setDetailVisible(false)}
        footer={null}
        width={1100}
        style={{ top: 20 }}
      >
        {currentArchive && (
          <div style={{ maxHeight: '80vh', overflowY: 'auto', paddingRight: 8 }}>
            <Card 
              className="layer-card" 
              style={{ marginBottom: 16 }}
              title={
                <Space>
                  <span>🏛️</span>
                  构件信息
                </Space>
              }
            >
              <Descriptions bordered size="small" column={3}>
                <Descriptions.Item label="构件编号">
                  <code style={{ background: '#f0e6d6', padding: '2px 6px', borderRadius: 4 }}>
                    {currentArchive.componentCode}
                  </code>
                </Descriptions.Item>
                <Descriptions.Item label="构件名称">
                  {currentArchive.componentName}
                </Descriptions.Item>
                <Descriptions.Item label="地仗等级">
                  <Tag color="blue">{currentArchive.gradeName}</Tag>
                </Descriptions.Item>
                {currentArchive.component && (
                  <>
                    <Descriptions.Item label="构件材质">
                      {currentArchive.component.material}
                    </Descriptions.Item>
                    <Descriptions.Item label="表面状况">
                      {currentArchive.component.surfaceCondition}
                    </Descriptions.Item>
                    <Descriptions.Item label="位置">
                      {currentArchive.component.location || '未记录'}
                    </Descriptions.Item>
                  </>
                )}
                <Descriptions.Item label="施工面积">
                  {currentArchive.totalArea.toFixed(2)} ㎡
                </Descriptions.Item>
                <Descriptions.Item label="质量评级">
                  {getQualityStars(currentArchive.qualityRating)}
                </Descriptions.Item>
                <Descriptions.Item label="验收人员">
                  {currentArchive.inspector || '未记录'}
                </Descriptions.Item>
                <Descriptions.Item label="开始日期">
                  <Space><CalendarOutlined />{dayjs(currentArchive.startDate).format('YYYY-MM-DD HH:mm')}</Space>
                </Descriptions.Item>
                <Descriptions.Item label="完成日期">
                  <Space><CalendarOutlined />{dayjs(currentArchive.endDate).format('YYYY-MM-DD HH:mm')}</Space>
                </Descriptions.Item>
                <Descriptions.Item label="施工周期">
                  {dayjs(currentArchive.endDate).diff(dayjs(currentArchive.startDate), 'day')} 天
                </Descriptions.Item>
                {typeof currentArchive.avgTemperature === 'number' && (
                  <Descriptions.Item label="平均温度">
                    {currentArchive.avgTemperature.toFixed(1)}°C
                  </Descriptions.Item>
                )}
                {typeof currentArchive.avgHumidity === 'number' && (
                  <Descriptions.Item label="平均湿度">
                    {currentArchive.avgHumidity.toFixed(1)}%
                  </Descriptions.Item>
                )}
                {typeof currentArchive.totalWarnings === 'number' && (
                  <Descriptions.Item label="风险预警">
                    <Tag color={currentArchive.totalWarnings > 0 ? 'red' : 'green'}>
                      {currentArchive.totalWarnings} 次
                    </Tag>
                  </Descriptions.Item>
                )}
              </Descriptions>
            </Card>

            <Divider orientation="left">
              <Space>
                <span>📦</span>
                材料用量汇总
              </Space>
            </Divider>
            <Row gutter={16} style={{ marginBottom: 16 }}>
              <Col span={4}>
                <Card size="small" className="stat-card">
                  <Statistic
                    title="砖灰"
                    value={currentArchive.materialList.ash}
                    suffix="kg"
                    precision={2}
                    valueStyle={{ color: '#8B4513' }}
                  />
                </Card>
              </Col>
              <Col span={4}>
                <Card size="small" className="stat-card">
                  <Statistic
                    title="石灰"
                    value={currentArchive.materialList.lime}
                    suffix="kg"
                    precision={2}
                    valueStyle={{ color: '#d4a574' }}
                  />
                </Card>
              </Col>
              <Col span={4}>
                <Card size="small" className="stat-card">
                  <Statistic
                    title="桐油"
                    value={currentArchive.materialList.tungOil}
                    suffix="kg"
                    precision={2}
                    valueStyle={{ color: '#8B4513' }}
                  />
                </Card>
              </Col>
              <Col span={4}>
                <Card size="small" className="stat-card">
                  <Statistic
                    title="麻丝"
                    value={currentArchive.materialList.ma}
                    suffix="kg"
                    precision={2}
                    valueStyle={{ color: '#5c3d2e' }}
                  />
                </Card>
              </Col>
              <Col span={4}>
                <Card size="small" className="stat-card">
                  <Statistic
                    title="麻布"
                    value={currentArchive.materialList.bu}
                    suffix="㎡"
                    precision={2}
                    valueStyle={{ color: '#5c3d2e' }}
                  />
                </Card>
              </Col>
              <Col span={4}>
                <Card size="small" className="stat-card">
                  <Statistic
                    title="总层数"
                    value={currentArchive.records.length}
                    suffix="层"
                    valueStyle={{ color: '#1890ff' }}
                  />
                </Card>
              </Col>
            </Row>

            {currentArchive.ashLayers && currentArchive.ashLayers.length > 0 && (
              <>
                <Divider orientation="left">
                  <Space>
                    <span>🧱</span>
                    灰层详情 ({currentArchive.ashLayers.length} 层)
                  </Space>
                </Divider>
                <Row gutter={16} style={{ marginBottom: 16 }}>
                  {currentArchive.ashLayers.map((layer) => (
                    <Col span={8} key={layer.id}>
                      <Card
                        size="small"
                        className="layer-card"
                        style={{ marginBottom: 8 }}
                        title={
                          <Space>
                            <div 
                              style={{ 
                                width: 30, 
                                height: 15, 
                                backgroundColor: '#d4a574',
                                borderRadius: 2
                              }}
                            />
                            <span>{layer.name}</span>
                          </Space>
                        }
                      >
                        <Descriptions size="small" column={2}>
                          <Descriptions.Item label="设计厚度">
                            {layer.designThickness} mm
                          </Descriptions.Item>
                          <Descriptions.Item label="实际厚度">
                            {layer.thickness} mm
                          </Descriptions.Item>
                          <Descriptions.Item label="干燥时间">
                            {layer.actualDryTime?.toFixed(1) || layer.dryTime} h
                          </Descriptions.Item>
                          <Descriptions.Item label="配比偏差">
                            <Tag color={layer.deviation && Math.abs(layer.deviation) > 10 ? 'red' : 
                                       layer.deviation && Math.abs(layer.deviation) > 5 ? 'orange' : 'green'}>
                              {layer.deviation ? `${layer.deviation > 0 ? '+' : ''}${layer.deviation.toFixed(1)}%` : '0%'}
                            </Tag>
                          </Descriptions.Item>
                        </Descriptions>
                      </Card>
                    </Col>
                  ))}
                </Row>
              </>
            )}

            {currentArchive.mabuLayers && currentArchive.mabuLayers.length > 0 && (
              <>
                <Divider orientation="left">
                  <Space>
                    <span>🧵</span>
                    麻/布层详情 ({currentArchive.mabuLayers.length} 道)
                  </Space>
                </Divider>
                <Row gutter={16} style={{ marginBottom: 16 }}>
                  {currentArchive.mabuLayers.map((layer) => (
                    <Col span={12} key={layer.id}>
                      <Card
                        size="small"
                        className="layer-card"
                        style={{ 
                          marginBottom: 8,
                          borderColor: layer.type === 'ma' ? '#d4a574' : '#c4956a'
                        }}
                        title={
                          <Space>
                            <Tag color={layer.type === 'ma' ? 'gold' : 'orange'}>
                              {layer.type === 'ma' ? '麻丝' : '麻布'}
                            </Tag>
                            {layer.name}
                            {layer.operator && (
                              <span style={{ color: '#8b7355', fontSize: 12 }}>
                                施工: {layer.operator}
                              </span>
                            )}
                          </Space>
                        }
                      >
                        <Descriptions size="small" column={3}>
                          <Descriptions.Item label="幅宽">
                            {layer.width} cm
                          </Descriptions.Item>
                          <Descriptions.Item label="搭接">
                            {layer.overlap} cm
                          </Descriptions.Item>
                          <Descriptions.Item label="用量">
                            {layer.usage.toFixed(2)} {layer.type === 'ma' ? 'kg' : '㎡'}
                          </Descriptions.Item>
                          <Descriptions.Item label="施工面积">
                            {layer.area.toFixed(2)} ㎡
                          </Descriptions.Item>
                          <Descriptions.Item label="施工环境">
                            {layer.temperature}°C / {layer.humidity}%
                          </Descriptions.Item>
                          <Descriptions.Item label="干燥时间">
                            {layer.actualDryTime?.toFixed(1) || layer.dryTime} h
                          </Descriptions.Item>
                        </Descriptions>
                      </Card>
                    </Col>
                  ))}
                </Row>
              </>
            )}

            <Divider orientation="left">
              <Space>
                <span>📋</span>
                完整施工时间线
                <Tag color="blue">{currentArchive.records.length} 条记录</Tag>
              </Space>
            </Divider>
            {currentArchive.records.length > 0 ? (
              <Timeline
                mode="left"
                style={{ marginTop: 16 }}
              >
                {[...currentArchive.records]
                  .sort((a, b) => new Date(a.appliedAt).getTime() - new Date(b.appliedAt).getTime())
                  .map((record) => (
                  <Timeline.Item
                    key={record.id}
                    color={record.inspectionResult === 'pass' ? 'green' : 
                           record.inspectionResult === 'warning' ? 'orange' : 'red'}
                    dot={record.layerType === 'mabu' ? (
                      <div style={{ 
                        width: 12, 
                        height: 12, 
                        borderRadius: '50%',
                        backgroundColor: record.inspectionResult === 'pass' ? '#52c41a' : 
                                        record.inspectionResult === 'warning' ? '#faad14' : '#ff4d4f',
                        border: '2px solid #fff',
                        boxShadow: '0 0 0 1px ' + (record.inspectionResult === 'pass' ? '#52c41a' : 
                                  record.inspectionResult === 'warning' ? '#faad14' : '#ff4d4f')
                      }} />
                    ) : undefined}
                  >
                    <Card
                      size="small"
                      className="layer-card"
                      style={{ marginBottom: 8 }}
                      title={
                        <Space>
                          {record.layerType === 'mabu' && (
                            <Tag color={record.layerName.includes('麻') ? 'gold' : 'orange'}>
                              {record.layerName.includes('麻') ? '麻丝' : '麻布'}
                            </Tag>
                          )}
                          <span>{record.layerName}</span>
                          {getResultTag(record.inspectionResult)}
                        </Space>
                      }
                      extra={
                        <Space size={16}>
                          <span style={{ color: '#8b7355' }}>
                            <CalendarOutlined /> {dayjs(record.appliedAt).format('YYYY-MM-DD HH:mm')}
                          </span>
                          {record.operator && (
                            <span style={{ color: '#8b7355' }}>
                              <UserOutlined /> {record.operator}
                            </span>
                          )}
                        </Space>
                      }
                    >
                      <Descriptions size="small" column={3}>
                        {record.layerType === 'ash' && (
                          <>
                            <Descriptions.Item label="施工厚度">
                              {record.thickness} mm
                            </Descriptions.Item>
                            <Descriptions.Item label="环境温度">
                              {record.temperature}°C
                            </Descriptions.Item>
                            <Descriptions.Item label="相对湿度">
                              {record.humidity}%
                            </Descriptions.Item>
                            <Descriptions.Item label="配比 (砖灰:石灰:桐油:水)" span={3}>
                              <code style={{ background: '#f0e6d6', padding: '2px 6px', borderRadius: 4 }}>
                                {record.ratio.ash}:{record.ratio.lime}:{record.ratio.tungOil}:{record.ratio.water}
                              </code>
                            </Descriptions.Item>
                            {record.deviation !== undefined && (
                              <Descriptions.Item label="配比偏差" span={3}>
                                <Tag color={Math.abs(record.deviation) > 10 ? 'red' : 
                                           Math.abs(record.deviation) > 5 ? 'orange' : 'green'}>
                                  {record.deviation > 0 ? '+' : ''}{record.deviation.toFixed(1)}%
                                  {Math.abs(record.deviation) > 10 ? ' (超标)' : Math.abs(record.deviation) > 5 ? ' (偏高)' : ' (合格)'}
                                </Tag>
                              </Descriptions.Item>
                            )}
                          </>
                        )}
                        {record.layerType === 'mabu' && (
                          <>
                            <Descriptions.Item label="类型">
                              {record.layerName.includes('麻') ? '麻丝' : '麻布'}
                            </Descriptions.Item>
                            <Descriptions.Item label="环境温度">
                              {record.temperature}°C
                            </Descriptions.Item>
                            <Descriptions.Item label="相对湿度">
                              {record.humidity}%
                            </Descriptions.Item>
                            <Descriptions.Item label="施工面积" span={3}>
                              {record.mabuArea?.toFixed(2)} ㎡
                            </Descriptions.Item>
                            {record.mabuUsage !== undefined && (
                              <Descriptions.Item label="实际用量" span={3}>
                                {record.mabuUsage.toFixed(2)} {record.layerName.includes('麻') ? 'kg' : '㎡'}
                              </Descriptions.Item>
                            )}
                          </>
                        )}
                        {record.notes && (
                          <Descriptions.Item label="施工备注" span={3}>
                            <div style={{ 
                              padding: '8px 12px', 
                              background: '#fffbe6', 
                              borderRadius: 4,
                              borderLeft: '3px solid #faad14'
                            }}>
                              {record.notes}
                            </div>
                          </Descriptions.Item>
                        )}
                      </Descriptions>
                    </Card>
                  </Timeline.Item>
                ))}
              </Timeline>
            ) : (
              <div style={{ textAlign: 'center', padding: 40, color: '#8b7355' }}>
                暂无详细施工记录
              </div>
            )}

            {currentArchive.notes && (
              <>
                <Divider orientation="left">
                  <Space>
                    <span>📝</span>
                    验收备注
                  </Space>
                </Divider>
                <div style={{ 
                  padding: 16, 
                  background: '#f0e6d6', 
                  borderRadius: 8,
                  borderLeft: '4px solid #8B4513'
                }}>
                  {currentArchive.notes}
                </div>
              </>
            )}
          </div>
        )}
      </Modal>
    </div>
  )
}

export default ArchivePage
