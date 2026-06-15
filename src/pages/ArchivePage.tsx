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
        destroyOnClose={false}
      >
        {currentArchive && (
          <div style={{ maxHeight: '78vh', overflowY: 'auto', paddingRight: 8 }}>
            <Card 
              className="layer-card" 
              style={{ marginBottom: 16 }}
              title={
                <Space>
                  <span>🏛️</span>
                  构件基本信息
                </Space>
              }
            >
              <Descriptions bordered size="small" column={3}>
                <Descriptions.Item label="构件编号">
                  <code style={{ background: '#f0e6d6', padding: '2px 6px', borderRadius: 4 }}>
                    {currentArchive.componentCode || '未设置'}
                  </code>
                </Descriptions.Item>
                <Descriptions.Item label="构件名称">
                  {currentArchive.componentName || '未命名'}
                </Descriptions.Item>
                <Descriptions.Item label="地仗等级">
                  <Tag color="blue">{currentArchive.gradeName || '未设置'}</Tag>
                </Descriptions.Item>
                <Descriptions.Item label="构件材质">
                  {currentArchive.component?.materialName || currentArchive.component?.material || '未记录'}
                </Descriptions.Item>
                <Descriptions.Item label="所在位置">
                  {currentArchive.component?.position || '未记录'}
                </Descriptions.Item>
                <Descriptions.Item label="施工面积">
                  {(currentArchive.totalArea || 0).toFixed(2)} ㎡
                </Descriptions.Item>
                <Descriptions.Item label="质量评级">
                  {getQualityStars(currentArchive.qualityRating || 0)}
                </Descriptions.Item>
                <Descriptions.Item label="验收人员">
                  {currentArchive.inspector || '未记录'}
                </Descriptions.Item>
                <Descriptions.Item label="施工周期">
                  {dayjs(currentArchive.endDate).diff(dayjs(currentArchive.startDate), 'day')} 天
                </Descriptions.Item>
                <Descriptions.Item label="开始时间">
                  <Space><CalendarOutlined />{dayjs(currentArchive.startDate).format('YYYY-MM-DD HH:mm')}</Space>
                </Descriptions.Item>
                <Descriptions.Item label="完成时间">
                  <Space><CalendarOutlined />{dayjs(currentArchive.endDate).format('YYYY-MM-DD HH:mm')}</Space>
                </Descriptions.Item>
                <Descriptions.Item label="风险预警">
                  <Tag color={(currentArchive.totalWarnings || 0) > 0 ? 'red' : 'green'}>
                    {currentArchive.totalWarnings || 0} 次
                  </Tag>
                </Descriptions.Item>
              </Descriptions>
            </Card>

            {currentArchive.component?.surfaceCondition && (
              <Card 
                className="layer-card" 
                style={{ marginBottom: 16 }}
                title={
                  <Space>
                    <span>🔍</span>
                    表面状况详情
                  </Space>
                }
                size="small"
              >
                <Row gutter={16}>
                  <Col span={6}>
                    <Card size="small" className="stat-card">
                      <Statistic
                        title="裂缝情况"
                        value={currentArchive.component.surfaceCondition.hasCracks ? '有裂缝' : '无裂缝'}
                        valueStyle={{ 
                          color: currentArchive.component.surfaceCondition.hasCracks ? '#ff4d4f' : '#52c41a',
                          fontSize: 16
                        }}
                        suffix=""
                      />
                      {currentArchive.component.surfaceCondition.hasCracks && (
                        <div style={{ color: '#8b7355', fontSize: 12, marginTop: 4 }}>
                          裂缝宽度约 {currentArchive.component.surfaceCondition.crackWidth || 0} mm
                        </div>
                      )}
                    </Card>
                  </Col>
                  <Col span={6}>
                    <Card size="small" className="stat-card">
                      <Statistic
                        title="腐朽情况"
                        value={currentArchive.component.surfaceCondition.hasRot ? '有腐朽' : '无腐朽'}
                        valueStyle={{ 
                          color: currentArchive.component.surfaceCondition.hasRot ? '#ff4d4f' : '#52c41a',
                          fontSize: 16
                        }}
                      />
                      {currentArchive.component.surfaceCondition.hasRot && (
                        <div style={{ color: '#8b7355', fontSize: 12, marginTop: 4 }}>
                          腐朽面积约 {currentArchive.component.surfaceCondition.rotArea || 0}%
                        </div>
                      )}
                    </Card>
                  </Col>
                  <Col span={6}>
                    <Card size="small" className="stat-card">
                      <Statistic
                        title="松动情况"
                        value={currentArchive.component.surfaceCondition.hasLoose ? '有松动' : '无松动'}
                        valueStyle={{ 
                          color: currentArchive.component.surfaceCondition.hasLoose ? '#faad14' : '#52c41a',
                          fontSize: 16
                        }}
                      />
                      {currentArchive.component.surfaceCondition.hasLoose && (
                        <div style={{ color: '#8b7355', fontSize: 12, marginTop: 4 }}>
                          松动面积约 {currentArchive.component.surfaceCondition.looseArea || 0}%
                        </div>
                      )}
                    </Card>
                  </Col>
                  <Col span={6}>
                    <Card size="small" className="stat-card">
                      <Statistic
                        title="含水率"
                        value={currentArchive.component.surfaceCondition.moistureContent || 0}
                        suffix="%"
                        valueStyle={{ 
                          color: (currentArchive.component.surfaceCondition.moistureContent || 0) > 15 ? '#ff4d4f' : '#52c41a',
                          fontSize: 16
                        }}
                      />
                      <div style={{ color: '#8b7355', fontSize: 12, marginTop: 4 }}>
                        平整度 {currentArchive.component.surfaceCondition.smoothness || 0}%
                      </div>
                    </Card>
                  </Col>
                </Row>
              </Card>
            )}

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
                  {currentArchive.ashLayers.map((layer) => {
                    const deviation = layer.deviation
                    const hasDeviation = layer.hasDeviation
                    
                    return (
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
                              {layer.operator && (
                                <Tag color="blue" style={{ fontSize: 11 }}>
                                  施工: {layer.operator}
                                </Tag>
                              )}
                            </Space>
                          }
                        >
                          <Descriptions size="small" column={2}>
                            <Descriptions.Item label="设计厚度">
                              {layer.designThickness || layer.thickness} mm
                            </Descriptions.Item>
                            <Descriptions.Item label="实际厚度">
                              {layer.thickness} mm
                            </Descriptions.Item>
                            <Descriptions.Item label="标准干燥">
                              {layer.dryTime} h
                            </Descriptions.Item>
                            <Descriptions.Item label="实际干燥">
                              {layer.actualDryTime?.toFixed(1) || layer.dryTime} h
                            </Descriptions.Item>
                          </Descriptions>
                          
                          <Divider style={{ margin: '8px 0' }} />
                          
                          <div style={{ fontSize: 12, color: '#8b7355', marginBottom: 4 }}>
                            配比偏差分析
                          </div>
                          <Row gutter={8}>
                            <Col span={6}>
                              <div style={{ 
                                textAlign: 'center', 
                                padding: '4px 0',
                                background: '#f9f5f0',
                                borderRadius: 4
                              }}>
                                <div style={{ fontSize: 11, color: '#8b7355' }}>砖灰</div>
                                <div style={{ 
                                  fontSize: 13, 
                                  fontWeight: 'bold',
                                  color: deviation && Math.abs(deviation.ash) > 10 ? '#ff4d4f' :
                                         deviation && Math.abs(deviation.ash) > 5 ? '#faad14' : '#52c41a'
                                }}>
                                  {deviation?.ash !== undefined 
                                    ? `${deviation.ash > 0 ? '+' : ''}${deviation.ash.toFixed(1)}%`
                                    : '0%'}
                                </div>
                              </div>
                            </Col>
                            <Col span={6}>
                              <div style={{ 
                                textAlign: 'center', 
                                padding: '4px 0',
                                background: '#f9f5f0',
                                borderRadius: 4
                              }}>
                                <div style={{ fontSize: 11, color: '#8b7355' }}>石灰</div>
                                <div style={{ 
                                  fontSize: 13, 
                                  fontWeight: 'bold',
                                  color: deviation && Math.abs(deviation.lime) > 10 ? '#ff4d4f' :
                                         deviation && Math.abs(deviation.lime) > 5 ? '#faad14' : '#52c41a'
                                }}>
                                  {deviation?.lime !== undefined 
                                    ? `${deviation.lime > 0 ? '+' : ''}${deviation.lime.toFixed(1)}%`
                                    : '0%'}
                                </div>
                              </div>
                            </Col>
                            <Col span={6}>
                              <div style={{ 
                                textAlign: 'center', 
                                padding: '4px 0',
                                background: '#f9f5f0',
                                borderRadius: 4
                              }}>
                                <div style={{ fontSize: 11, color: '#8b7355' }}>桐油</div>
                                <div style={{ 
                                  fontSize: 13, 
                                  fontWeight: 'bold',
                                  color: deviation && Math.abs(deviation.tungOil) > 10 ? '#ff4d4f' :
                                         deviation && Math.abs(deviation.tungOil) > 5 ? '#faad14' : '#52c41a'
                                }}>
                                  {deviation?.tungOil !== undefined 
                                    ? `${deviation.tungOil > 0 ? '+' : ''}${deviation.tungOil.toFixed(1)}%`
                                    : '0%'}
                                </div>
                              </div>
                            </Col>
                            <Col span={6}>
                              <div style={{ 
                                textAlign: 'center', 
                                padding: '4px 0',
                                background: '#f9f5f0',
                                borderRadius: 4
                              }}>
                                <div style={{ fontSize: 11, color: '#8b7355' }}>水</div>
                                <div style={{ 
                                  fontSize: 13, 
                                  fontWeight: 'bold',
                                  color: deviation && Math.abs(deviation.water) > 10 ? '#ff4d4f' :
                                         deviation && Math.abs(deviation.water) > 5 ? '#faad14' : '#52c41a'
                                }}>
                                  {deviation?.water !== undefined 
                                    ? `${deviation.water > 0 ? '+' : ''}${deviation.water.toFixed(1)}%`
                                    : '0%'}
                                </div>
                              </div>
                            </Col>
                          </Row>
                        </Card>
                      </Col>
                    )
                  })}
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
                            <Tag color={record.mabuType === 'ma' ? 'gold' : 'orange'}>
                              {record.mabuType === 'ma' ? '麻丝' : '麻布'}
                            </Tag>
                          )}
                          <span>{record.layerName || '未命名'}</span>
                          {getResultTag(record.inspectionResult)}
                        </Space>
                      }
                      extra={
                        <Space size={16}>
                          <span style={{ color: '#8b7355', fontSize: 12 }}>
                            <CalendarOutlined /> {dayjs(record.appliedAt).format('YYYY-MM-DD HH:mm')}
                          </span>
                          {record.operator && (
                            <span style={{ color: '#8b7355', fontSize: 12 }}>
                              <UserOutlined /> {record.operator}
                            </span>
                          )}
                        </Space>
                      }
                    >
                      <Descriptions size="small" column={3}>
                        {record.layerType === 'ash' && (
                          <>
                            <Descriptions.Item label="设计厚度">
                              {record.designThickness || record.thickness} mm
                            </Descriptions.Item>
                            <Descriptions.Item label="实际厚度">
                              {record.thickness || 0} mm
                            </Descriptions.Item>
                            <Descriptions.Item label="偏差">
                              {record.designThickness 
                                ? `${((record.thickness - record.designThickness) / record.designThickness * 100).toFixed(1)}%`
                                : '0%'}
                            </Descriptions.Item>
                            <Descriptions.Item label="施工温度">
                              {record.temperature || 0}°C
                            </Descriptions.Item>
                            <Descriptions.Item label="相对湿度">
                              {record.humidity || 0}%
                            </Descriptions.Item>
                            <Descriptions.Item label="质量结果">
                              {getResultTag(record.inspectionResult)}
                            </Descriptions.Item>
                            <Descriptions.Item label="配比 (砖灰:石灰:桐油:水)" span={3}>
                              <code style={{ background: '#f0e6d6', padding: '2px 8px', borderRadius: 4, fontSize: 13 }}>
                                {record.ratio?.ash ?? 0}:{record.ratio?.lime ?? 0}:{record.ratio?.tungOil ?? 0}:{record.ratio?.water ?? 0}
                              </code>
                            </Descriptions.Item>
                            
                            {record.deviation && (
                              <Descriptions.Item label="分项偏差" span={3}>
                                <Row gutter={8}>
                                  <Col span={6}>
                                    <Tag color={Math.abs(record.deviation.ash) > 10 ? 'red' : 
                                               Math.abs(record.deviation.ash) > 5 ? 'orange' : 'green'}
                                         style={{ width: '100%', textAlign: 'center' }}>
                                      砖灰 {record.deviation.ash > 0 ? '+' : ''}{record.deviation.ash.toFixed(1)}%
                                    </Tag>
                                  </Col>
                                  <Col span={6}>
                                    <Tag color={Math.abs(record.deviation.lime) > 10 ? 'red' : 
                                               Math.abs(record.deviation.lime) > 5 ? 'orange' : 'green'}
                                         style={{ width: '100%', textAlign: 'center' }}>
                                      石灰 {record.deviation.lime > 0 ? '+' : ''}{record.deviation.lime.toFixed(1)}%
                                    </Tag>
                                  </Col>
                                  <Col span={6}>
                                    <Tag color={Math.abs(record.deviation.tungOil) > 10 ? 'red' : 
                                               Math.abs(record.deviation.tungOil) > 5 ? 'orange' : 'green'}
                                         style={{ width: '100%', textAlign: 'center' }}>
                                      桐油 {record.deviation.tungOil > 0 ? '+' : ''}{record.deviation.tungOil.toFixed(1)}%
                                    </Tag>
                                  </Col>
                                  <Col span={6}>
                                    <Tag color={Math.abs(record.deviation.water) > 10 ? 'red' : 
                                               Math.abs(record.deviation.water) > 5 ? 'orange' : 'green'}
                                         style={{ width: '100%', textAlign: 'center' }}>
                                      水 {record.deviation.water > 0 ? '+' : ''}{record.deviation.water.toFixed(1)}%
                                    </Tag>
                                  </Col>
                                </Row>
                              </Descriptions.Item>
                            )}
                          </>
                        )}
                        {record.layerType === 'mabu' && (
                          <>
                            <Descriptions.Item label="材料类型">
                              <Tag color={record.mabuType === 'ma' ? 'gold' : 'orange'}>
                                {record.mabuType === 'ma' ? '麻丝' : '麻布'}
                              </Tag>
                            </Descriptions.Item>
                            <Descriptions.Item label="幅宽">
                              {record.mabuWidth || 0} cm
                            </Descriptions.Item>
                            <Descriptions.Item label="搭接宽度">
                              {record.mabuOverlap || 0} cm
                            </Descriptions.Item>
                            <Descriptions.Item label="施工面积">
                              {record.mabuArea?.toFixed(2) || '0.00'} ㎡
                            </Descriptions.Item>
                            <Descriptions.Item label="实际用量">
                              {record.mabuUsage?.toFixed(2) || '0.00'} {record.mabuType === 'ma' ? 'kg' : '㎡'}
                            </Descriptions.Item>
                            <Descriptions.Item label="施工环境">
                              {record.temperature || 0}°C / {record.humidity || 0}%
                            </Descriptions.Item>
                          </>
                        )}
                        {record.notes && (
                          <Descriptions.Item label="施工备注" span={3}>
                            <div style={{ 
                              padding: '8px 12px', 
                              background: '#fffbe6', 
                              borderRadius: 4,
                              borderLeft: '3px solid #faad14',
                              fontSize: 12,
                              lineHeight: 1.6
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
