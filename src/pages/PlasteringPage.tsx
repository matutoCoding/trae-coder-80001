import { useState, useEffect, useMemo } from 'react'
import {
  Card,
  Select,
  Row,
  Col,
  Slider,
  Statistic,
  Button,
  Modal,
  Form,
  Input,
  InputNumber,
  Tag,
  Space,
  Alert,
  App,
  Timeline,
  Progress,
  Descriptions,
  List,
  Avatar,
  Badge,
  Tooltip,
  Popconfirm,
  Divider
} from 'antd'
import {
  ThunderboltOutlined,
  CloudOutlined,
  ClockCircleOutlined,
  WarningOutlined,
  CheckCircleOutlined,
  PlayCircleOutlined,
  StopOutlined,
  SafetyOutlined,
  FileAddOutlined,
  EnvironmentOutlined
} from '@ant-design/icons'
import dayjs from 'dayjs'
import ReactECharts from 'echarts-for-react'
import type { DizhangProcess, AshLayer, RiskWarning, ProcessRecord, MabuLayer } from '../types/dizhang'
import { useDizhangStore } from '../store/dizhangStore'
import { 
  calculateDryTime, 
  simulateCuringEffect, 
  checkAllRisks
} from '../utils/dizhangAlgorithm'
import { useNavigate } from 'react-router-dom'

const { Option } = Select
const { TextArea } = Input

const LAYER_COLORS = [
  '#d4a574',
  '#c4956a',
  '#b08050',
  '#8B4513',
  '#5c3d2e',
  '#3d2817',
  '#d4a574',
  '#c4956a',
  '#b08050'
]

const PlasteringPage = () => {
  const { message, modal } = App.useApp()
  const navigate = useNavigate()
  const components = useDizhangStore(state => state.components)
  const processes = useDizhangStore(state => state.processes)
  const currentProcess = useDizhangStore(state => state.currentProcess)
  const setCurrentProcess = useDizhangStore(state => state.setCurrentProcess)
  const updateProcess = useDizhangStore(state => state.updateProcess)
  const updateProcessLayer = useDizhangStore(state => state.updateProcessLayer)
  const updateMabuLayer = useDizhangStore(state => state.updateMabuLayer)
  const completeProcess = useDizhangStore(state => state.completeProcess)
  const recalculateProcess = useDizhangStore(state => state.recalculateProcess)
  const addAshLayerRecord = useDizhangStore(state => state.addAshLayerRecord)
  const addMabuLayerRecord = useDizhangStore(state => state.addMabuLayerRecord)
  const markMabuLayerDry = useDizhangStore(state => state.markMabuLayerDry)
  const checkCanCompleteProcess = useDizhangStore(state => state.checkCanCompleteProcess)

  const [recordModalVisible, setRecordModalVisible] = useState(false)
  const [recordingLayer, setRecordingLayer] = useState<AshLayer | null>(null)
  const [recordForm] = Form.useForm<{
    operator: string
    actualThickness: number
    notes: string
  }>()

  const [mabuRecordModalVisible, setMabuRecordModalVisible] = useState(false)
  const [recordingMabuLayer, setRecordingMabuLayer] = useState<MabuLayer | null>(null)
  const [mabuRecordForm] = Form.useForm<{
    operator: string
    notes: string
  }>()

  const [completeModalVisible, setCompleteModalVisible] = useState(false)
  const [completeForm] = Form.useForm<{
    inspector: string
    notes: string
  }>()

  const [temperature, setTemperature] = useState(currentProcess?.temperature || 20)
  const [humidity, setHumidity] = useState(currentProcess?.humidity || 55)

  useEffect(() => {
    if (currentProcess) {
      setTemperature(currentProcess.temperature)
      setHumidity(currentProcess.humidity)
    }
  }, [currentProcess?.id])

  const handleProcessChange = (processId: string) => {
    const process = processes.find(p => p.id === processId)
    if (process) {
      setCurrentProcess(process)
      setTemperature(process.temperature)
      setHumidity(process.humidity)
    }
  }

  const handleEnvironmentChange = (temp: number, hum: number) => {
    if (!currentProcess) return
    
    updateProcess(currentProcess.id, {
      temperature: temp,
      humidity: hum
    })
    
    currentProcess.layers.forEach((layer, index) => {
      if (layer.appliedAt && !layer.isDry) {
        const { adjustedDryTime } = calculateDryTime(layer.dryTime, temp, hum)
        updateProcessLayer(currentProcess.id, layer.id, {
          actualDryTime: adjustedDryTime
        })
      }
    })
    
    recalculateProcess(currentProcess.id)
  }

  const curingEffect = useMemo(() => {
    return simulateCuringEffect(temperature, humidity)
  }, [temperature, humidity])

  const dryingChartOption = useMemo(() => {
    if (!currentProcess) return {}

    const layers = [...currentProcess.layers]
    
    return {
      tooltip: {
        trigger: 'axis',
        formatter: (params: unknown) => {
          const p = params as Array<{ seriesName: string; value: number; axisValue: string }>
          return `${p[0].axisValue}<br/>${p[0].seriesName}: ${p[0].value} 小时`
        }
      },
      grid: {
        left: '3%',
        right: '4%',
        bottom: '3%',
        containLabel: true
      },
      xAxis: {
        type: 'category',
        data: layers.map(l => l.name),
        axisLabel: { rotate: 30 }
      },
      yAxis: {
        type: 'value',
        name: '干燥时间 (小时)'
      },
      series: [
        {
          name: '标准干燥时间',
          type: 'bar',
          data: layers.map(l => l.dryTime),
          itemStyle: { color: '#d4a574' }
        },
        {
          name: '环境调整后时间',
          type: 'bar',
          data: layers.map(l => {
            const { adjustedDryTime } = calculateDryTime(l.dryTime, temperature, humidity)
            return adjustedDryTime
          }),
          itemStyle: { 
            color: curingEffect.riskLevel === 'high' ? '#ff4d4f' : 
                   curingEffect.riskLevel === 'medium' ? '#faad14' : '#52c41a' 
          }
        }
      ]
    }
  }, [currentProcess, temperature, humidity, curingEffect.riskLevel])

  const handleRecordLayer = (layer: AshLayer) => {
    setRecordingLayer(layer)
    recordForm.resetFields()
    recordForm.setFieldsValue({
      actualThickness: layer.thickness
    })
    setRecordModalVisible(true)
  }

  const handleRecordSubmit = async () => {
    if (!recordingLayer || !currentProcess) return

    try {
      const values = await recordForm.validateFields()
      const now = new Date().toISOString()
      const { adjustedDryTime } = calculateDryTime(recordingLayer.dryTime, temperature, humidity)

      updateProcessLayer(currentProcess.id, recordingLayer.id, {
        appliedAt: now,
        actualDryTime: adjustedDryTime,
        thickness: values.actualThickness,
        notes: values.notes
      })

      setTimeout(() => {
        addAshLayerRecord(currentProcess.id, recordingLayer.id, values.operator, values.notes)
        recalculateProcess(currentProcess.id)
      }, 100)

      message.success(`${recordingLayer.name}施工记录已保存，已进入工艺档案`)
      setRecordModalVisible(false)
    } catch {
      // 验证失败
    }
  }

  const handleMarkDry = (layer: AshLayer) => {
    if (!currentProcess) return
    
    updateProcessLayer(currentProcess.id, layer.id, {
      isDry: true
    })
    message.success(`${layer.name}已标记为干燥`)
  }

  const handleMabuRecord = (layer: MabuLayer) => {
    setRecordingMabuLayer(layer)
    mabuRecordForm.resetFields()
    setMabuRecordModalVisible(true)
  }

  const handleMabuRecordSubmit = async () => {
    if (!recordingMabuLayer || !currentProcess) return

    try {
      const values = await mabuRecordForm.validateFields()
      const now = new Date().toISOString()
      const { adjustedDryTime } = calculateDryTime(recordingMabuLayer.dryTime, temperature, humidity)

      updateMabuLayer(currentProcess.id, recordingMabuLayer.id, {
        appliedAt: now,
        actualDryTime: adjustedDryTime,
        operator: values.operator,
        temperature,
        humidity,
        notes: values.notes
      })

      setTimeout(() => {
        addMabuLayerRecord(currentProcess.id, recordingMabuLayer.id, values.operator, values.notes)
      }, 100)

      message.success(`${recordingMabuLayer.name}施工记录已保存，已进入工艺档案`)
      setMabuRecordModalVisible(false)
    } catch {
      // 验证失败
    }
  }

  const handleMarkMabuDry = (layer: MabuLayer) => {
    if (!currentProcess) return
    
    markMabuLayerDry(currentProcess.id, layer.id)
    message.success(`${layer.name}已标记为干燥`)
  }

  const getMabuLayerStatus = (layer: MabuLayer, index: number) => {
    if (!layer.appliedAt) {
      const prevAshLayer = currentProcess?.layers.find((_, i) => i === index)
      if (index === 0 || prevAshLayer?.isDry) {
        return { status: 'pending', text: '待施工', color: 'default', canStart: true }
      }
      return { status: 'blocked', text: '等待前层干燥', color: 'default', canStart: false }
    }
    if (!layer.isDry) {
      return { status: 'drying', text: '干燥中', color: 'processing', canStart: false }
    }
    return { status: 'done', text: '已完成', color: 'success', canStart: false }
  }

  const handleCompleteProcess = () => {
    if (!currentProcess) return

    const { canComplete, missingItems } = checkCanCompleteProcess(currentProcess.id)
    
    if (!canComplete) {
      modal.error({
        title: '无法完成工序',
        content: (
          <div>
            <p>还有以下内容未完成：</p>
            <ul style={{ marginTop: 8 }}>
              {missingItems.map((item, i) => (
                <li key={i} style={{ color: '#ff4d4f', marginBottom: 4 }}>• {item}</li>
              ))}
            </ul>
          </div>
        )
      })
      return
    }

    completeForm.resetFields()
    setCompleteModalVisible(true)
  }

  const handleCompleteSubmit = async () => {
    if (!currentProcess) return

    try {
      const values = await completeForm.validateFields()
      const archive = completeProcess(currentProcess.id, values.inspector, values.notes)
      
      if (archive) {
        message.success('工序已完成，完整工艺档案已生成')
        setCompleteModalVisible(false)
        navigate('/archive')
      } else {
        message.error('生成档案失败，请检查所有工序是否完成')
      }
    } catch {
      // 验证失败
    }
  }

  const getLayerStatus = (layer: AshLayer, index: number) => {
    if (!layer.appliedAt) {
      if (index === 0 || currentProcess?.layers[index - 1]?.isDry) {
        return { status: 'pending', text: '待施工', color: 'default', canStart: true }
      }
      return { status: 'blocked', text: '等待前层干燥', color: 'default', canStart: false }
    }
    if (!layer.isDry) {
      return { status: 'drying', text: '干燥中', color: 'processing', canStart: false }
    }
    return { status: 'done', text: '已完成', color: 'success', canStart: false }
  }

  const getRiskIcon = (level: RiskWarning['level']) => {
    switch (level) {
      case 'critical': return <StopOutlined style={{ color: '#ff4d4f' }} />
      case 'high': return <WarningOutlined style={{ color: '#ff4d4f' }} />
      case 'medium': return <WarningOutlined style={{ color: '#faad14' }} />
      default: return <SafetyOutlined style={{ color: '#52c41a' }} />
    }
  }

  const getRiskColor = (level: RiskWarning['level']) => {
    switch (level) {
      case 'critical': return 'red'
      case 'high': return 'red'
      case 'medium': return 'orange'
      default: return 'green'
    }
  }

  if (!currentProcess && processes.length === 0) {
    return (
      <div>
        <div className="page-title">
          <span>🔨 披灰工序</span>
          <div className="page-subtitle">管理施工进度、校验干燥时间、模拟环境影响、风险预警</div>
        </div>
        <Alert
          message="暂无施工工序"
          description="请先在「构件录入」页面添加构件并开始施工"
          type="info"
          showIcon
        />
      </div>
    )
  }

  const availableProcesses = processes.filter(p => p.status !== 'completed')
  const progress = currentProcess 
    ? Math.round((currentProcess.layers.filter(l => l.isDry).length / currentProcess.layers.length) * 100)
    : 0

  return (
    <div>
      <div className="page-title">
        <span>🔨 披灰工序</span>
        <div className="page-subtitle">管理施工进度、校验干燥时间、模拟环境影响、风险预警</div>
      </div>

      <Card style={{ marginBottom: 16 }}>
        <Space style={{ width: '100%', justifyContent: 'space-between' }} wrap>
          <Space wrap>
            <span style={{ color: '#8b7355' }}>选择工序：</span>
            <Select
              style={{ width: 300 }}
              value={currentProcess?.id}
              onChange={handleProcessChange}
              placeholder="请选择施工工序"
            >
              {availableProcesses.map(p => (
                <Option key={p.id} value={p.id}>
                  {p.componentName} - {p.gradeName}
                </Option>
              ))}
            </Select>
          </Space>
          {currentProcess && (
            <Space>
              <Tag color="blue">{currentProcess.gradeName}</Tag>
              <Tag color="processing">进度: {progress}%</Tag>
            </Space>
          )}
        </Space>
      </Card>

      {currentProcess && (
        <>
          {currentProcess.riskWarnings.length > 0 && (
            <Alert
              message="存在施工风险"
              description={
                <List
                  size="small"
                  dataSource={currentProcess.riskWarnings}
                  renderItem={(item) => (
                    <List.Item>
                      <List.Item.Meta
                        avatar={<Avatar icon={getRiskIcon(item.level)} style={{ backgroundColor: 'transparent' }} />}
                        title={
                          <Tag color={getRiskColor(item.level)}>
                            {item.level === 'critical' ? '严重' : item.level === 'high' ? '高危' : item.level === 'medium' ? '中等' : '轻微'}
                          </Tag>
                        }
                        description={item.message}
                      />
                    </List.Item>
                  )}
                />
              }
              type="error"
              showIcon
              icon={<WarningOutlined />}
              style={{ marginBottom: 16 }}
            />
          )}

          <Row gutter={16} style={{ marginBottom: 16 }}>
            <Col span={16}>
              <Card 
                title={
                  <Space>
                    <EnvironmentOutlined />
                    施工环境模拟
                  </Space>
                }
                className="layer-card"
              >
                <Row gutter={24}>
                  <Col span={12}>
                    <div style={{ marginBottom: 16 }}>
                      <Space>
                        <ThunderboltOutlined style={{ color: '#ff7a45', fontSize: 20 }} />
                        <span style={{ fontWeight: 'bold' }}>温度: {temperature}°C</span>
                      </Space>
                    </div>
                    <Slider
                      min={-10}
                      max={45}
                      value={temperature}
                      onChange={(v) => {
                        setTemperature(v)
                        handleEnvironmentChange(v, humidity)
                      }}
                      marks={{
                        '-10': '-10°',
                        0: '0°',
                        10: '10°',
                        20: '20°',
                        30: '30°',
                        40: '40°'
                      }}
                    />
                    <div style={{ marginTop: 8, color: '#8b7355', fontSize: 12 }}>
                      最佳施工温度: 15°C - 25°C
                    </div>
                  </Col>
                  <Col span={12}>
                    <div style={{ marginBottom: 16 }}>
                      <Space>
                        <CloudOutlined style={{ color: '#1890ff', fontSize: 20 }} />
                        <span style={{ fontWeight: 'bold' }}>相对湿度: {humidity}%</span>
                      </Space>
                    </div>
                    <Slider
                      min={10}
                      max={100}
                      value={humidity}
                      onChange={(v) => {
                        setHumidity(v)
                        handleEnvironmentChange(temperature, v)
                      }}
                      marks={{
                        20: '20%',
                        40: '40%',
                        60: '60%',
                        80: '80%',
                        100: '100%'
                      }}
                    />
                    <div style={{ marginTop: 8, color: '#8b7355', fontSize: 12 }}>
                      最佳施工湿度: 45% - 65%
                    </div>
                  </Col>
                </Row>

                <Divider />

                <Row gutter={16}>
                  <Col span={8}>
                    <Statistic
                      title="固化质量指数"
                      value={curingEffect.qualityIndex}
                      suffix="/100"
                      valueStyle={{ 
                        color: curingEffect.qualityIndex >= 80 ? '#52c41a' : 
                               curingEffect.qualityIndex >= 60 ? '#faad14' : '#ff4d4f' 
                      }}
                    />
                  </Col>
                  <Col span={8}>
                    <Statistic
                      title="固化速率系数"
                      value={curingEffect.curingSpeed}
                      valueStyle={{ color: '#1890ff' }}
                    />
                  </Col>
                  <Col span={8}>
                    <Statistic
                      title="环境风险等级"
                      value={curingEffect.riskLevel === 'low' ? '低' : curingEffect.riskLevel === 'medium' ? '中' : '高'}
                      valueStyle={{ 
                        color: curingEffect.riskLevel === 'low' ? '#52c41a' : 
                               curingEffect.riskLevel === 'medium' ? '#faad14' : '#ff4d4f' 
                      }}
                    />
                  </Col>
                </Row>

                {curingEffect.suggestions.length > 0 && (
                  <div style={{ marginTop: 16 }}>
                    <div style={{ color: '#8b7355', marginBottom: 8 }}>施工建议：</div>
                    {curingEffect.suggestions.map((s, i) => (
                      <div key={i} style={{ padding: '4px 0', color: '#5c3d2e' }}>
                        • {s}
                      </div>
                    ))}
                  </div>
                )}
              </Card>
            </Col>
            <Col span={8}>
              <Card 
                title={
                  <Space>
                    <ClockCircleOutlined />
                    干燥时间对比
                  </Space>
                }
                className="layer-card"
                style={{ height: '100%' }}
              >
                <ReactECharts
                  option={dryingChartOption}
                  style={{ height: 280 }}
                  notMerge={true}
                />
              </Card>
            </Col>
          </Row>

          <Row gutter={16} style={{ marginBottom: 16 }}>
            <Col span={24}>
              <Card 
                title={
                  <Space>
                    <PlayCircleOutlined />
                    施工进度管理
                  </Space>
                }
                className="layer-card"
                extra={
                  <Space>
                    <Progress 
                      percent={progress} 
                      size="small"
                      style={{ width: 150 }}
                    />
                    <Popconfirm
                      title="确认完成此工序？"
                      description="完成后将生成工艺档案，且不可再修改"
                      onConfirm={handleCompleteProcess}
                      okText="确认完成"
                      cancelText="取消"
                      okButtonProps={{ danger: true }}
                    >
                      <Button type="primary" danger icon={<FileAddOutlined />}>
                        完成工序，生成档案
                      </Button>
                    </Popconfirm>
                  </Space>
                }
              >
                <Timeline
                  mode="left"
                  style={{ marginTop: 16 }}
                >
                  {currentProcess.layers.map((layer, index) => {
                    const status = getLayerStatus(layer, index)
                    const prevLayer = index > 0 ? currentProcess.layers[index - 1] : null
                    const { adjustedDryTime } = calculateDryTime(layer.dryTime, temperature, humidity)
                    
                    const canStart = status.canStart
                    const isDrying = layer.appliedAt && !layer.isDry
                    const timeSinceApplied = layer.appliedAt 
                      ? (Date.now() - new Date(layer.appliedAt).getTime()) / (1000 * 60 * 60)
                      : 0
                    const dryProgress = isDrying 
                      ? Math.min(100, Math.round((timeSinceApplied / (layer.actualDryTime || adjustedDryTime)) * 100))
                      : 0

                    return (
                      <Timeline.Item
                        key={layer.id}
                        color={
                          status.status === 'done' ? 'green' :
                          status.status === 'drying' ? 'blue' :
                          status.status === 'blocked' ? 'gray' : '#8B4513'
                        }
                        dot={
                          status.status === 'done' ? <CheckCircleOutlined /> :
                          status.status === 'drying' ? <ClockCircleOutlined spin /> :
                          <Badge status={status.status === 'blocked' ? 'default' : 'processing'} />
                        }
                      >
                        <Card
                          size="small"
                          className="layer-card"
                          style={{ 
                            marginBottom: 8,
                            borderColor: layer.hasDeviation ? '#ff4d4f' : undefined
                          }}
                          title={
                            <Space>
                              <div 
                                className="layer-visual" 
                                style={{ 
                                  width: 40, 
                                  height: 20, 
                                  backgroundColor: LAYER_COLORS[index % LAYER_COLORS.length] 
                                }}
                              />
                              <span style={layer.hasDeviation ? { color: '#ff4d4f' } : {}}>
                                {layer.name}
                              </span>
                              {layer.hasDeviation && (
                                <Tooltip title="配比存在偏差，请注意">
                                  <WarningOutlined style={{ color: '#ff4d4f' }} />
                                </Tooltip>
                              )}
                              <Tag color={status.color}>{status.text}</Tag>
                            </Space>
                          }
                          extra={
                            <Space>
                              <span style={{ color: '#8b7355', fontSize: 12 }}>
                                厚度: {layer.thickness}mm | 
                                标准干燥: {layer.dryTime}h | 
                                预计干燥: {adjustedDryTime.toFixed(1)}h
                              </span>
                            </Space>
                          }
                        >
                          <Row gutter={16} align="middle">
                            <Col span={16}>
                              <Space direction="vertical" size="small" style={{ width: '100%' }}>
                                {layer.appliedAt && (
                                  <Descriptions size="small" column={3}>
                                    <Descriptions.Item label="施工时间">
                                      {dayjs(layer.appliedAt).format('YYYY-MM-DD HH:mm')}
                                    </Descriptions.Item>
                                    <Descriptions.Item label="实际干燥时间">
                                      {(layer.actualDryTime || adjustedDryTime).toFixed(1)}h
                                    </Descriptions.Item>
                                    {layer.notes && (
                                      <Descriptions.Item label="备注">
                                        {layer.notes}
                                      </Descriptions.Item>
                                    )}
                                  </Descriptions>
                                )}
                                {isDrying && (
                                  <Progress
                                    percent={dryProgress}
                                    size="small"
                                    strokeColor={dryProgress >= 100 ? '#52c41a' : '#1890ff'}
                                    format={(p) => `干燥进度 ${p}%`}
                                  />
                                )}
                              </Space>
                            </Col>
                            <Col span={8} style={{ textAlign: 'right' }}>
                              {canStart && (
                                <Button
                                  type="primary"
                                  icon={<PlayCircleOutlined />}
                                  onClick={() => handleRecordLayer(layer)}
                                >
                                  开始施工
                                </Button>
                              )}
                              {isDrying && dryProgress >= 100 && (
                                <Button
                                  type="primary"
                                  icon={<CheckCircleOutlined />}
                                  onClick={() => handleMarkDry(layer)}
                                >
                                  确认干燥
                                </Button>
                              )}
                              {isDrying && dryProgress < 100 && (
                                <Tag color="processing">
                                  还需 {(adjustedDryTime - timeSinceApplied).toFixed(1)} 小时
                                </Tag>
                              )}
                              {status.status === 'blocked' && (
                                <Tooltip title={prevLayer ? `等待「${prevLayer.name}」干燥` : '等待施工条件'}>
                                  <Button disabled>
                                    等待中
                                  </Button>
                                </Tooltip>
                              )}
                              {status.status === 'done' && (
                                <Tag color="success">
                                  完成于 {dayjs(layer.appliedAt!).format('MM-DD HH:mm')}
                                </Tag>
                              )}
                            </Col>
                          </Row>
                        </Card>
                      </Timeline.Item>
                    )
                  })}
                </Timeline>
              </Card>
            </Col>
          </Row>

          {currentProcess.mabuLayers.length > 0 && (
            <Row gutter={16} style={{ marginBottom: 16 }}>
              <Col span={24}>
                <Card 
                  title={
                    <Space>
                      <span>🧵</span>
                      麻布/麻丝层施工记录
                      <Tag color="blue">{currentProcess.mabuLayers.length} 道</Tag>
                    </Space>
                  }
                  className="layer-card"
                >
                  <Row gutter={16}>
                    {currentProcess.mabuLayers.map((layer, index) => {
                      const status = getMabuLayerStatus(layer, index)
                      const { adjustedDryTime } = calculateDryTime(layer.dryTime, temperature, humidity)
                      const timeSinceApplied = layer.appliedAt 
                        ? (Date.now() - new Date(layer.appliedAt).getTime()) / (1000 * 60 * 60)
                        : 0
                      const dryProgress = layer.appliedAt && !layer.isDry
                        ? Math.min(100, Math.round((timeSinceApplied / (layer.actualDryTime || adjustedDryTime)) * 100))
                        : 0
                      const isDrying = layer.appliedAt && !layer.isDry
                      const canStart = status.canStart

                      return (
                        <Col span={12} key={layer.id}>
                          <Card
                            size="small"
                            type={!layer.appliedAt ? 'inner' : undefined}
                            style={{ 
                              borderColor: layer.type === 'ma' ? '#d4a574' : '#c4956a'
                            }}
                            title={
                              <Space>
                                <div 
                                  className="layer-visual" 
                                  style={{ 
                                    width: 40, 
                                    height: 20, 
                                    backgroundColor: layer.type === 'ma' ? '#d4a574' : '#c4956a' 
                                  }}
                                />
                                <Tag color={layer.type === 'ma' ? 'gold' : 'orange'}>
                                  {layer.type === 'ma' ? '麻丝' : '麻布'}
                                </Tag>
                                {layer.name}
                                <Tag color={status.color}>{status.text}</Tag>
                              </Space>
                            }
                            extra={
                              <Space>
                                <span style={{ color: '#8b7355', fontSize: 12 }}>
                                  标准干燥: {layer.dryTime}h | 预计: {adjustedDryTime.toFixed(1)}h
                                </span>
                              </Space>
                            }
                          >
                            <Descriptions size="small" column={2}>
                              <Descriptions.Item label="幅宽">{layer.width} cm</Descriptions.Item>
                              <Descriptions.Item label="搭接">{layer.overlap} cm</Descriptions.Item>
                              <Descriptions.Item label="用量">
                                {layer.usage.toFixed(2)} {layer.type === 'ma' ? 'kg' : '㎡'}
                              </Descriptions.Item>
                              <Descriptions.Item label="施工面积">
                                {layer.area.toFixed(2)} ㎡
                              </Descriptions.Item>
                              {layer.operator && (
                                <Descriptions.Item label="施工人员">
                                  {layer.operator}
                                </Descriptions.Item>
                              )}
                              {layer.appliedAt && (
                                <Descriptions.Item label="施工时间">
                                  {dayjs(layer.appliedAt).format('MM-DD HH:mm')}
                                </Descriptions.Item>
                              )}
                            </Descriptions>

                            {isDrying && (
                              <div style={{ marginTop: 12 }}>
                                <Progress
                                  percent={dryProgress}
                                  size="small"
                                  strokeColor={dryProgress >= 100 ? '#52c41a' : '#1890ff'}
                                  format={(p) => `干燥进度 ${p}%`}
                                />
                              </div>
                            )}

                            <div style={{ marginTop: 12, textAlign: 'right' }}>
                              {canStart && (
                                <Button
                                  type="primary"
                                  icon={<PlayCircleOutlined />}
                                  onClick={() => handleMabuRecord(layer)}
                                >
                                  开始施工
                                </Button>
                              )}
                              {isDrying && dryProgress >= 100 && (
                                <Button
                                  type="primary"
                                  icon={<CheckCircleOutlined />}
                                  onClick={() => handleMarkMabuDry(layer)}
                                >
                                  确认干燥
                                </Button>
                              )}
                              {isDrying && dryProgress < 100 && (
                                <Tag color="processing">
                                  还需 {(adjustedDryTime - timeSinceApplied).toFixed(1)} 小时
                                </Tag>
                              )}
                              {status.status === 'blocked' && (
                                <Tooltip title="等待前层干燥">
                                  <Button disabled>等待中</Button>
                                </Tooltip>
                              )}
                              {status.status === 'done' && (
                                <Space direction="vertical" size={0} style={{ textAlign: 'left' }}>
                                  <Tag color="success">
                                    完成于 {dayjs(layer.appliedAt!).format('MM-DD HH:mm')}
                                  </Tag>
                                  {layer.temperature && layer.humidity && (
                                    <span style={{ color: '#8b7355', fontSize: 12 }}>
                                      施工环境: {layer.temperature}°C / {layer.humidity}%
                                    </span>
                                  )}
                                </Space>
                              )}
                            </div>
                          </Card>
                        </Col>
                      )
                    })}
                  </Row>
                </Card>
              </Col>
            </Row>
          )}
        </>
      )}

      <Modal
        title={recordingLayer ? `记录${recordingLayer.name}施工` : '施工记录'}
        open={recordModalVisible}
        onOk={handleRecordSubmit}
        onCancel={() => setRecordModalVisible(false)}
        width={550}
        okText="保存记录"
        cancelText="取消"
      >
        {recordingLayer && (
          <div style={{ marginBottom: 16 }}>
            <Alert
              message={`设计厚度 ${recordingLayer.thickness}mm，预计干燥时间 ${calculateDryTime(recordingLayer.dryTime, temperature, humidity).adjustedDryTime.toFixed(1)} 小时`}
              type="info"
              showIcon
            />
          </div>
        )}
        <Form form={recordForm} layout="vertical">
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="operator"
                label="施工人员"
                rules={[{ required: true, message: '请输入施工人员姓名' }]}
              >
                <Input placeholder="请输入姓名" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="actualThickness"
                label="实际厚度 (mm)"
                rules={[{ required: true, message: '请输入实际厚度' }]}
              >
                <InputNumber min={0.5} max={20} step={0.1} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Alert
                message={`当前环境温度 ${temperature}°C`}
                type="info"
                showIcon
                icon={<ThunderboltOutlined />}
              />
            </Col>
            <Col span={12}>
              <Alert
                message={`当前环境湿度 ${humidity}%`}
                type="info"
                showIcon
                icon={<CloudOutlined />}
              />
            </Col>
          </Row>
          <Form.Item
            name="notes"
            label="施工备注"
            style={{ marginTop: 16 }}
          >
            <TextArea rows={3} placeholder="记录施工情况、天气情况、特殊处理等..." />
          </Form.Item>
          <Alert
            message="请注意：若前一层未完全干燥即施工，系统将发出空鼓开裂风险预警"
            type="warning"
            showIcon
          />
        </Form>
      </Modal>

      <Modal
        title={recordingMabuLayer ? `记录${recordingMabuLayer.name}施工` : '麻/布层施工记录'}
        open={mabuRecordModalVisible}
        onOk={handleMabuRecordSubmit}
        onCancel={() => setMabuRecordModalVisible(false)}
        width={550}
        okText="保存记录"
        cancelText="取消"
      >
        {recordingMabuLayer && (
          <div style={{ marginBottom: 16 }}>
            <Alert
              message={`${recordingMabuLayer.type === 'ma' ? '麻丝' : '麻布'}用量 ${recordingMabuLayer.usage.toFixed(2)} ${recordingMabuLayer.type === 'ma' ? 'kg' : '㎡'}，搭接宽度 ${recordingMabuLayer.overlap}cm，预计干燥时间 ${calculateDryTime(recordingMabuLayer.dryTime, temperature, humidity).adjustedDryTime.toFixed(1)} 小时`}
              type="info"
              showIcon
            />
          </div>
        )}
        <Form form={mabuRecordForm} layout="vertical">
          <Form.Item
            name="operator"
            label="施工人员"
            rules={[{ required: true, message: '请输入施工人员姓名' }]}
          >
            <Input placeholder="请输入姓名" />
          </Form.Item>
          <Row gutter={16}>
            <Col span={12}>
              <Alert
                message={`当前环境温度 ${temperature}°C`}
                type="info"
                showIcon
                icon={<ThunderboltOutlined />}
              />
            </Col>
            <Col span={12}>
              <Alert
                message={`当前环境湿度 ${humidity}%`}
                type="info"
                showIcon
                icon={<CloudOutlined />}
              />
            </Col>
          </Row>
          <Form.Item
            name="notes"
            label="施工备注"
            style={{ marginTop: 16 }}
          >
            <TextArea rows={3} placeholder="记录糊麻/糊布的情况，包括搭接是否整齐、是否有空鼓等..." />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="完成工序并生成工艺档案"
        open={completeModalVisible}
        onOk={handleCompleteSubmit}
        onCancel={() => setCompleteModalVisible(false)}
        width={550}
        okText="确认完成并生成档案"
        cancelText="取消"
      >
        <Alert
          message="所有灰层和麻/布层均已施工并确认干燥，完成后将生成完整的工艺档案"
          type="success"
          showIcon
          style={{ marginBottom: 16 }}
        />
        <Form form={completeForm} layout="vertical">
          <Form.Item
            name="inspector"
            label="验收人员"
            rules={[{ required: true, message: '请输入验收人员姓名' }]}
          >
            <Input placeholder="请输入验收人员姓名" />
          </Form.Item>
          <Form.Item
            name="notes"
            label="验收备注"
          >
            <TextArea rows={3} placeholder="记录整体质量情况、验收意见等..." />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}

export default PlasteringPage
