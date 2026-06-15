import { useState, useMemo } from 'react'
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
  App,
  Divider,
  Empty,
  Timeline,
  Tabs,
  List
} from 'antd'
import {
  EyeOutlined,
  FileTextOutlined,
  StarOutlined,
  CalendarOutlined,
  UserOutlined,
  CheckCircleOutlined,
  WarningOutlined,
  CloseCircleOutlined,
  InfoCircleOutlined,
  FileSearchOutlined,
  ExportOutlined,
  ImportOutlined
} from '@ant-design/icons'
import dayjs from 'dayjs'
import type { DizhangArchive, ProcessRecord } from '../types/dizhang'
import { useDizhangStore, usePersistence } from '../store/dizhangStore'
import { reviewArchive, type ReviewIssue } from '../utils/dizhangAlgorithm'

const ArchivePage = () => {
  const { message, modal } = App.useApp()
  const archives = useDizhangStore(state => state.archives)
  const currentArchive = useDizhangStore(state => state.currentArchive)
  const setCurrentArchive = useDizhangStore(state => state.setCurrentArchive)
  const addArchive = useDizhangStore(state => state.addArchive)
  const { exportArchive, importArchive } = usePersistence()

  const [detailVisible, setDetailVisible] = useState(false)
  const [activeTab, setActiveTab] = useState('detail')

  const handleViewDetail = (archive: DizhangArchive) => {
    setCurrentArchive(archive)
    setActiveTab('detail')
    setDetailVisible(true)
  }

  const handleExport = async (archive: DizhangArchive) => {
    const success = await exportArchive(archive.id)
    if (success) {
      message.success('档案已导出为验收报告')
    }
  }

  const handleImport = async () => {
    const result = await importArchive()
    if (result) {
      addArchive(result)
      message.success('档案导入成功')
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
    const stars = '★'.repeat(rating) + '☆'.repeat(5 - rating)
    return <span style={{ color: '#faad14' }}>{stars}</span>
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
      width: 120,
      render: (rating: number) => getQualityStars(rating)
    },
    {
      title: '麻/布层数',
      key: 'mabuCount',
      width: 100,
      render: (_: unknown, record: DizhangArchive) => (
        <Tag color="blue">{record.mabuLayers?.length || 0} 道</Tag>
      )
    },
    {
      title: '操作',
      key: 'action',
      width: 200,
      fixed: 'right' as const,
      render: (_: unknown, record: DizhangArchive) => (
        <Space>
          <Button
            type="link"
            icon={<EyeOutlined />}
            onClick={() => handleViewDetail(record)}
          >
            详情
          </Button>
          <Button
            type="link"
            icon={<FileTextOutlined />}
            onClick={() => handleExport(record)}
          >
            导出
          </Button>
        </Space>
      )
    }
  ]

  const tabItems = [
    {
      key: 'detail',
      label: (
        <Space>
          <FileTextOutlined />
          详情视图
        </Space>
      )
    },
    {
      key: 'review',
      label: (
        <Space>
          <FileSearchOutlined />
          复核视图
        </Space>
      )
    }
  ]

  return (
    <div className="page-container">
      <div className="page-header">
        <Space>
          <span className="page-icon">📋</span>
          <div>
            <h1 className="page-title">工艺档案库</h1>
            <p className="page-subtitle">记录每段地仗的灰层与披灰，追溯传统工艺质量</p>
          </div>
        </Space>
        <Space>
          <Button icon={<ImportOutlined />} onClick={handleImport}>
            导入档案
          </Button>
          <span style={{ color: '#8b7355' }}>共 {archives.length} 条档案记录</span>
        </Space>
      </div>

      {archives.length === 0 ? (
        <Empty
          description={
            <div>
              <p>暂无工艺档案</p>
              <p style={{ color: '#8b7355', fontSize: 12 }}>
                完成披灰工序后，系统将自动生成工艺档案
              </p>
            </div>
          }
          style={{ marginTop: 80 }}
        />
      ) : (
        <Card className="layer-card" size="small">
          <Table
            columns={columns}
            dataSource={archives}
            rowKey="id"
            scroll={{ x: 1200 }}
            pagination={{
              pageSize: 10,
              showSizeChanger: true,
              showTotal: (total) => `共 ${total} 条记录`
            }}
          />
        </Card>
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
          <>
            <Tabs
              activeKey={activeTab}
              onChange={setActiveTab}
              items={tabItems}
              style={{ marginBottom: 16 }}
            />
            
            {activeTab === 'detail' && (
              <ArchiveDetailView archive={currentArchive} />
            )}
            
            {activeTab === 'review' && (
              <ArchiveReviewView archive={currentArchive} />
            )}
          </>
        )}
      </Modal>
    </div>
  )
}

const ArchiveDetailView = ({ archive }: { archive: DizhangArchive }) => {
  const sortedRecords = useMemo(() => {
    return [...(archive.records || [])].sort(
      (a, b) => new Date(a.appliedAt).getTime() - new Date(b.appliedAt).getTime()
    )
  }, [archive.records])

  const getResultTag = (result: ProcessRecord['inspectionResult']) => {
    switch (result) {
      case 'pass': return <Tag color="green">合格</Tag>
      case 'warning': return <Tag color="orange">有偏差</Tag>
      case 'fail': return <Tag color="red">不合格</Tag>
      default: return null
    }
  }

  return (
    <div style={{ maxHeight: '68vh', overflowY: 'auto', paddingRight: 8 }}>
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
              {archive.componentCode || '未设置'}
            </code>
          </Descriptions.Item>
          <Descriptions.Item label="构件名称">
            {archive.componentName || '未命名'}
          </Descriptions.Item>
          <Descriptions.Item label="地仗等级">
            <Tag color="blue">{archive.gradeName || '未设置'}</Tag>
          </Descriptions.Item>
          <Descriptions.Item label="构件材质">
            {archive.component?.materialName || archive.component?.material || '未记录'}
          </Descriptions.Item>
          <Descriptions.Item label="所在位置">
            {archive.component?.position || '未记录'}
          </Descriptions.Item>
          <Descriptions.Item label="施工面积">
            {(archive.totalArea || 0).toFixed(2)} ㎡
          </Descriptions.Item>
          <Descriptions.Item label="质量评级">
            <span style={{ color: '#faad14' }}>
              {'★'.repeat(archive.qualityRating || 0)}{'☆'.repeat(5 - (archive.qualityRating || 0))}
            </span>
          </Descriptions.Item>
          <Descriptions.Item label="验收人员">
            {archive.inspector || '未记录'}
          </Descriptions.Item>
          <Descriptions.Item label="施工周期">
            {dayjs(archive.endDate).diff(dayjs(archive.startDate), 'day')} 天
          </Descriptions.Item>
          <Descriptions.Item label="开始时间">
            <Space><CalendarOutlined />{dayjs(archive.startDate).format('YYYY-MM-DD HH:mm')}</Space>
          </Descriptions.Item>
          <Descriptions.Item label="完成时间">
            <Space><CalendarOutlined />{dayjs(archive.endDate).format('YYYY-MM-DD HH:mm')}</Space>
          </Descriptions.Item>
          <Descriptions.Item label="风险预警">
            <Tag color={(archive.totalWarnings || 0) > 0 ? 'red' : 'green'}>
              {archive.totalWarnings || 0} 次
            </Tag>
          </Descriptions.Item>
        </Descriptions>
      </Card>

      {archive.component?.surfaceCondition && (
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
                  value={archive.component.surfaceCondition.hasCracks ? '有裂缝' : '无裂缝'}
                  valueStyle={{ 
                    color: archive.component.surfaceCondition.hasCracks ? '#ff4d4f' : '#52c41a',
                    fontSize: 16
                  }}
                />
                {archive.component.surfaceCondition.hasCracks && (
                  <div style={{ color: '#8b7355', fontSize: 12, marginTop: 4 }}>
                    裂缝宽度约 {archive.component.surfaceCondition.crackWidth || 0} mm
                  </div>
                )}
              </Card>
            </Col>
            <Col span={6}>
              <Card size="small" className="stat-card">
                <Statistic
                  title="腐朽情况"
                  value={archive.component.surfaceCondition.hasRot ? '有腐朽' : '无腐朽'}
                  valueStyle={{ 
                    color: archive.component.surfaceCondition.hasRot ? '#ff4d4f' : '#52c41a',
                    fontSize: 16
                  }}
                />
                {archive.component.surfaceCondition.hasRot && (
                  <div style={{ color: '#8b7355', fontSize: 12, marginTop: 4 }}>
                    腐朽面积约 {archive.component.surfaceCondition.rotArea || 0}%
                  </div>
                )}
              </Card>
            </Col>
            <Col span={6}>
              <Card size="small" className="stat-card">
                <Statistic
                  title="松动情况"
                  value={archive.component.surfaceCondition.hasLoose ? '有松动' : '无松动'}
                  valueStyle={{ 
                    color: archive.component.surfaceCondition.hasLoose ? '#faad14' : '#52c41a',
                    fontSize: 16
                  }}
                />
                {archive.component.surfaceCondition.hasLoose && (
                  <div style={{ color: '#8b7355', fontSize: 12, marginTop: 4 }}>
                    松动面积约 {archive.component.surfaceCondition.looseArea || 0}%
                  </div>
                )}
              </Card>
            </Col>
            <Col span={6}>
              <Card size="small" className="stat-card">
                <Statistic
                  title="含水率"
                  value={archive.component.surfaceCondition.moistureContent || 0}
                  suffix="%"
                  valueStyle={{ 
                    color: (archive.component.surfaceCondition.moistureContent || 0) > 15 ? '#ff4d4f' : '#52c41a',
                    fontSize: 16
                  }}
                />
                <div style={{ color: '#8b7355', fontSize: 12, marginTop: 4 }}>
                  平整度 {archive.component.surfaceCondition.smoothness || 0}%
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
              value={archive.materialList?.ash || 0}
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
              value={archive.materialList?.lime || 0}
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
              value={archive.materialList?.tungOil || 0}
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
              value={archive.materialList?.ma || 0}
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
              value={archive.materialList?.bu || 0}
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
              value={sortedRecords.length}
              suffix="层"
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
      </Row>

      {archive.ashLayers && archive.ashLayers.length > 0 && (
        <>
          <Divider orientation="left">
            <Space>
              <span>🧱</span>
              灰层详情 ({archive.ashLayers.length} 层)
            </Space>
          </Divider>
          <Row gutter={16} style={{ marginBottom: 16 }}>
            {archive.ashLayers.map((layer) => {
              const deviation = layer.deviation
              
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

      {archive.mabuLayers && archive.mabuLayers.length > 0 && (
        <>
          <Divider orientation="left">
            <Space>
              <span>🧵</span>
              麻/布层详情 ({archive.mabuLayers.length} 道)
            </Space>
          </Divider>
          <Row gutter={16} style={{ marginBottom: 16 }}>
            {archive.mabuLayers.map((layer) => (
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
          <Tag color="blue">{sortedRecords.length} 条记录</Tag>
        </Space>
      </Divider>
      {sortedRecords.length > 0 ? (
        <Timeline
          mode="left"
          style={{ marginTop: 16 }}
        >
          {sortedRecords.map((record) => (
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

      {archive.notes && (
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
            {archive.notes}
          </div>
        </>
      )}
    </div>
  )
}

const ArchiveReviewView = ({ archive }: { archive: DizhangArchive }) => {
  const reviewIssues = useMemo(() => {
    return reviewArchive({
      records: archive.records || [],
      ashLayers: archive.ashLayers || [],
      mabuLayers: archive.mabuLayers || [],
      materialList: archive.materialList || { ash: 0, lime: 0, tungOil: 0, water: 0, ma: 0, bu: 0 },
      component: archive.component || {}
    })
  }, [archive])

  const errorCount = reviewIssues.filter(i => i.severity === 'error').length
  const warningCount = reviewIssues.filter(i => i.severity === 'warning').length
  const infoCount = reviewIssues.filter(i => i.severity === 'info').length

  const getSeverityIcon = (severity: ReviewIssue['severity']) => {
    switch (severity) {
      case 'error': return <CloseCircleOutlined style={{ color: '#ff4d4f' }} />
      case 'warning': return <WarningOutlined style={{ color: '#faad14' }} />
      case 'info': return <CheckCircleOutlined style={{ color: '#52c41a' }} />
    }
  }

  const getSeverityColor = (severity: ReviewIssue['severity']) => {
    switch (severity) {
      case 'error': return '#ff4d4f'
      case 'warning': return '#faad14'
      case 'info': return '#52c41a'
    }
  }

  const getTypeLabel = (type: ReviewIssue['type']) => {
    switch (type) {
      case 'ash': return '灰层'
      case 'mabu': return '麻/布层'
      case 'material': return '材料'
      case 'general': return '总体'
    }
  }

  const totalMaFromLayers = (archive.mabuLayers || [])
    .filter(l => l.type === 'ma')
    .reduce((sum, l) => sum + l.usage, 0)
  const totalBuFromLayers = (archive.mabuLayers || [])
    .filter(l => l.type === 'bu')
    .reduce((sum, l) => sum + l.usage, 0)

  const ashWithRecords = (archive.ashLayers || []).map(layer => {
    const record = (archive.records || []).find(r => r.layerId === layer.id && r.layerType === 'ash')
    return { layer, record }
  })

  const mabuWithRecords = (archive.mabuLayers || []).map(layer => {
    const record = (archive.records || []).find(r => r.layerId === layer.id && r.layerType === 'mabu')
    return { layer, record }
  })

  return (
    <div style={{ maxHeight: '68vh', overflowY: 'auto', paddingRight: 8 }}>
      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col span={8}>
          <Card size="small" className="stat-card" style={{ borderLeft: '4px solid #ff4d4f' }}>
            <Statistic
              title="严重问题"
              value={errorCount}
              valueStyle={{ color: '#ff4d4f' }}
            />
          </Card>
        </Col>
        <Col span={8}>
          <Card size="small" className="stat-card" style={{ borderLeft: '4px solid #faad14' }}>
            <Statistic
              title="警告提示"
              value={warningCount}
              valueStyle={{ color: '#faad14' }}
            />
          </Card>
        </Col>
        <Col span={8}>
          <Card size="small" className="stat-card" style={{ borderLeft: '4px solid #52c41a' }}>
            <Statistic
              title="复核通过"
              value={infoCount}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
      </Row>

      {errorCount > 0 || warningCount > 0 ? (
        <Card 
          className="layer-card" 
          style={{ marginBottom: 16 }}
          title={
            <Space>
              <WarningOutlined style={{ color: '#faad14' }} />
              复核问题清单
            </Space>
          }
          size="small"
        >
          <List
            dataSource={reviewIssues.filter(i => i.severity !== 'info')}
            renderItem={(item) => (
              <List.Item style={{ borderBottom: '1px solid #f0e6d6' }}>
                <List.Item.Meta
                  avatar={getSeverityIcon(item.severity)}
                  title={
                    <Space>
                      <Tag color={getSeverityColor(item.severity)} style={{ margin: 0 }}>
                        {getTypeLabel(item.type)}
                      </Tag>
                      <span style={{ color: getSeverityColor(item.severity), fontWeight: 500 }}>
                        {item.message}
                      </span>
                    </Space>
                  }
                />
              </List.Item>
            )}
          />
        </Card>
      ) : (
        <div style={{ 
          textAlign: 'center', 
          padding: 24, 
          background: '#f6ffed', 
          borderRadius: 8,
          marginBottom: 16
        }}>
          <CheckCircleOutlined style={{ fontSize: 32, color: '#52c41a' }} />
          <div style={{ marginTop: 8, color: '#52c41a', fontWeight: 500 }}>
            档案数据完整，所有记录一致，复核通过
          </div>
        </div>
      )}

      <Divider orientation="left">
        <Space>
          <span>📊</span>
          材料对账
        </Space>
      </Divider>
      <Card className="layer-card" style={{ marginBottom: 16 }} size="small">
        <Row gutter={16}>
          <Col span={12}>
            <Descriptions size="small" column={1} title="麻丝用量核对">
              <Descriptions.Item label="各层用量合计">
                {totalMaFromLayers.toFixed(2)} kg
              </Descriptions.Item>
              <Descriptions.Item label="材料汇总用量">
                {archive.materialList?.ma?.toFixed(2) || '0.00'} kg
              </Descriptions.Item>
              <Descriptions.Item label="差值">
                <Tag color={Math.abs(totalMaFromLayers - (archive.materialList?.ma || 0)) > 0.01 ? 'red' : 'green'}>
                  {(totalMaFromLayers - (archive.materialList?.ma || 0)).toFixed(2)} kg
                </Tag>
              </Descriptions.Item>
            </Descriptions>
          </Col>
          <Col span={12}>
            <Descriptions size="small" column={1} title="麻布用量核对">
              <Descriptions.Item label="各层用量合计">
                {totalBuFromLayers.toFixed(2)} ㎡
              </Descriptions.Item>
              <Descriptions.Item label="材料汇总用量">
                {archive.materialList?.bu?.toFixed(2) || '0.00'} ㎡
              </Descriptions.Item>
              <Descriptions.Item label="差值">
                <Tag color={Math.abs(totalBuFromLayers - (archive.materialList?.bu || 0)) > 0.01 ? 'red' : 'green'}>
                  {(totalBuFromLayers - (archive.materialList?.bu || 0)).toFixed(2)} ㎡
                </Tag>
              </Descriptions.Item>
            </Descriptions>
          </Col>
        </Row>
      </Card>

      <Divider orientation="left">
        <Space>
          <span>🧱</span>
          灰层记录对账
        </Space>
      </Divider>
      <Card className="layer-card" style={{ marginBottom: 16 }} size="small">
        <List
          dataSource={ashWithRecords}
          renderItem={({ layer, record }) => {
            const hasIssue = layer.appliedAt && !record
            const missingOperator = record && !record.operator
            
            return (
              <List.Item style={{ borderBottom: '1px solid #f0e6d6' }}>
                <List.Item.Meta
                  avatar={
                    hasIssue 
                      ? <CloseCircleOutlined style={{ color: '#ff4d4f' }} />
                      : missingOperator
                      ? <WarningOutlined style={{ color: '#faad14' }} />
                      : <CheckCircleOutlined style={{ color: '#52c41a' }} />
                  }
                  title={
                    <Space>
                      <span style={{ fontWeight: 500 }}>{layer.name}</span>
                      {hasIssue && <Tag color="red">缺少记录</Tag>}
                      {!hasIssue && missingOperator && <Tag color="orange">缺施工人</Tag>}
                      {!hasIssue && !missingOperator && <Tag color="green">记录完整</Tag>}
                    </Space>
                  }
                  description={
                    <Space size={16}>
                      <span style={{ color: '#8b7355' }}>
                        厚度: {layer.thickness}mm
                      </span>
                      <span style={{ color: '#8b7355' }}>
                        施工人员: {record?.operator || '未记录'}
                      </span>
                      {layer.appliedAt && (
                        <span style={{ color: '#8b7355' }}>
                          施工时间: {dayjs(layer.appliedAt).format('MM-DD HH:mm')}
                        </span>
                      )}
                    </Space>
                  }
                />
              </List.Item>
            )
          }}
        />
      </Card>

      <Divider orientation="left">
        <Space>
          <span>🧵</span>
          麻/布层记录对账
        </Space>
      </Divider>
      <Card className="layer-card" size="small">
        <List
          dataSource={mabuWithRecords}
          renderItem={({ layer, record }) => {
            const hasIssue = layer.appliedAt && !record
            const missingOperator = record && !record.operator
            const usageMismatch = record?.mabuUsage !== undefined && 
                                  Math.abs(record.mabuUsage - layer.usage) > 0.01
            
            return (
              <List.Item style={{ borderBottom: '1px solid #f0e6d6' }}>
                <List.Item.Meta
                  avatar={
                    hasIssue 
                      ? <CloseCircleOutlined style={{ color: '#ff4d4f' }} />
                      : missingOperator || usageMismatch
                      ? <WarningOutlined style={{ color: '#faad14' }} />
                      : <CheckCircleOutlined style={{ color: '#52c41a' }} />
                  }
                  title={
                    <Space>
                      <Tag color={layer.type === 'ma' ? 'gold' : 'orange'}>
                        {layer.type === 'ma' ? '麻丝' : '麻布'}
                      </Tag>
                      <span style={{ fontWeight: 500 }}>{layer.name}</span>
                      {hasIssue && <Tag color="red">缺少记录</Tag>}
                      {!hasIssue && missingOperator && <Tag color="orange">缺施工人</Tag>}
                      {!hasIssue && usageMismatch && <Tag color="orange">用量不符</Tag>}
                      {!hasIssue && !missingOperator && !usageMismatch && <Tag color="green">记录完整</Tag>}
                    </Space>
                  }
                  description={
                    <Space size={16} wrap>
                      <span style={{ color: '#8b7355' }}>
                        幅宽: {layer.width}cm
                      </span>
                      <span style={{ color: '#8b7355' }}>
                        搭接: {layer.overlap}cm
                      </span>
                      <span style={{ color: '#8b7355' }}>
                        设计用量: {layer.usage.toFixed(2)}{layer.type === 'ma' ? 'kg' : '㎡'}
                      </span>
                      {record?.mabuUsage !== undefined && (
                        <span style={{ color: usageMismatch ? '#ff4d4f' : '#8b7355' }}>
                          记录用量: {record.mabuUsage.toFixed(2)}{layer.type === 'ma' ? 'kg' : '㎡'}
                        </span>
                      )}
                      <span style={{ color: '#8b7355' }}>
                        施工人员: {record?.operator || '未记录'}
                      </span>
                    </Space>
                  }
                />
              </List.Item>
            )
          }}
        />
      </Card>
    </div>
  )
}

export default ArchivePage
