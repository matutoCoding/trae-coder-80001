import { useState, useMemo } from 'react'
import {
  Card,
  Select,
  Table,
  Row,
  Col,
  Statistic,
  Form,
  InputNumber,
  Button,
  Modal,
  Tag,
  Space,
  Alert,
  App,
  Divider,
  Progress,
  Descriptions
} from 'antd'
import {
  CalculatorOutlined,
  AlertOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  FileTextOutlined,
  RightOutlined
} from '@ant-design/icons'
import ReactECharts from 'echarts-for-react'
import type { AshLayer, MabuLayer, DizhangProcess } from '../types/dizhang'
import { useDizhangStore } from '../store/dizhangStore'
import { 
  calculateRatioDeviation, 
  calculateAshUsage, 
  calculateMabuUsage,
  calculateTotalMaterialList
} from '../utils/dizhangAlgorithm'
import { useNavigate } from 'react-router-dom'

const { Option } = Select

const AshRatioPage = () => {
  const { message } = App.useApp()
  const navigate = useNavigate()
  const components = useDizhangStore(state => state.components)
  const processes = useDizhangStore(state => state.processes)
  const currentProcess = useDizhangStore(state => state.currentProcess)
  const setCurrentProcess = useDizhangStore(state => state.setCurrentProcess)
  const updateProcess = useDizhangStore(state => state.updateProcess)
  const updateProcessLayer = useDizhangStore(state => state.updateProcessLayer)
  const updateMabuLayer = useDizhangStore(state => state.updateMabuLayer)
  const recalculateProcess = useDizhangStore(state => state.recalculateProcess)

  const [ratioModalVisible, setRatioModalVisible] = useState(false)
  const [editingLayer, setEditingLayer] = useState<AshLayer | null>(null)
  const [ratioForm] = Form.useForm<{
    ash: number
    lime: number
    tungOil: number
    water: number
  }>()

  const [mabuModalVisible, setMabuModalVisible] = useState(false)
  const [editingMabu, setEditingMabu] = useState<MabuLayer | null>(null)
  const [mabuForm] = Form.useForm<{
    width: number
    overlap: number
  }>()

  const handleProcessChange = (processId: string) => {
    const process = processes.find(p => p.id === processId)
    if (process) {
      setCurrentProcess(process)
    }
  }

  const handleEditRatio = (layer: AshLayer) => {
    setEditingLayer(layer)
    const ratio = layer.actualRatio || layer.targetRatio
    ratioForm.setFieldsValue(ratio)
    setRatioModalVisible(true)
  }

  const handleRatioSubmit = async () => {
    if (!editingLayer || !currentProcess) return

    try {
      const actualRatio = await ratioForm.validateFields()
      const fullRatio = { ...actualRatio, other: {} }
      
      const { deviation, hasDeviation } = calculateRatioDeviation(
        editingLayer.targetRatio,
        fullRatio
      )

      updateProcessLayer(currentProcess.id, editingLayer.id, {
        actualRatio: fullRatio,
        deviation,
        hasDeviation
      })

      recalculateProcess(currentProcess.id)

      if (hasDeviation) {
        message.warning('配比已保存，但存在偏差，请注意核对')
      } else {
        message.success('配比已保存')
      }

      setRatioModalVisible(false)
    } catch {
      // 验证失败
    }
  }

  const handleEditMabu = (layer: MabuLayer) => {
    setEditingMabu(layer)
    mabuForm.setFieldsValue({
      width: layer.width,
      overlap: layer.overlap
    })
    setMabuModalVisible(true)
  }

  const handleMabuSubmit = async () => {
    if (!editingMabu || !currentProcess) return

    try {
      const values = await mabuForm.validateFields()
      const usage = calculateMabuUsage(
        editingMabu.area,
        editingMabu.type,
        values.width,
        values.overlap
      )

      updateMabuLayer(currentProcess.id, editingMabu.id, {
        ...values,
        usage
      })

      recalculateProcess(currentProcess.id)
      message.success('麻布/麻丝参数已更新')
      setMabuModalVisible(false)
    } catch {
      // 验证失败
    }
  }

  const deviationColorClass = (value: number) => {
    if (Math.abs(value) > 10) return 'deviation-high'
    if (Math.abs(value) > 5) return 'deviation-medium'
    return 'deviation-low'
  }

  const deviationTag = (value: number) => {
    if (Math.abs(value) > 10) {
      return <Tag color="red">严重偏差</Tag>
    }
    if (Math.abs(value) > 5) {
      return <Tag color="orange">轻度偏差</Tag>
    }
    return <Tag color="green">合格</Tag>
  }

  const ratioChartOption = useMemo(() => {
    if (!currentProcess) return {}

    const layers = currentProcess.layers.filter(l => l.type !== 'zhuofenghui')
    
    return {
      tooltip: {
        trigger: 'axis',
        axisPointer: { type: 'shadow' }
      },
      legend: {
        data: ['灰', '灰', '桐油', '水']
      },
      grid: {
        left: '3%',
        right: '4%',
        bottom: '3%',
        containLabel: true
      },
      xAxis: {
        type: 'category',
        data: layers.map(l => l.name)
      },
      yAxis: {
        type: 'value',
        name: '配比比例'
      },
      series: [
        {
          name: '灰',
          type: 'bar',
          stack: 'total',
          data: layers.map(l => (l.actualRatio || l.targetRatio).ash),
          itemStyle: { color: '#d4a574' }
        },
        {
          name: '灰',
          type: 'bar',
          stack: 'total',
          data: layers.map(l => (l.actualRatio || l.targetRatio).lime),
          itemStyle: { color: '#e8e0d0' }
        },
        {
          name: '桐油',
          type: 'bar',
          stack: 'total',
          data: layers.map(l => (l.actualRatio || l.targetRatio).tungOil),
          itemStyle: { color: '#8B4513' }
        },
        {
          name: '水',
          type: 'bar',
          stack: 'total',
          data: layers.map(l => (l.actualRatio || l.targetRatio).water),
          itemStyle: { color: '#87CEEB' }
        }
      ]
    }
  }, [currentProcess])

  const materialList = useMemo(() => {
    if (!currentProcess) return null
    return calculateTotalMaterialList(currentProcess.layers, currentProcess.mabuLayers)
  }, [currentProcess])

  const layerColumns = [
    {
      title: '灰层名称',
      dataIndex: 'name',
      key: 'name',
      width: 120,
      render: (text: string, record: AshLayer) => (
        <Space>
          {record.hasDeviation && <AlertOutlined style={{ color: '#ff4d4f' }} />}
          <span style={record.hasDeviation ? { color: '#ff4d4f', fontWeight: 'bold' } : {}}>
            {text}
          </span>
        </Space>
      )
    },
    {
      title: '设计厚度',
      dataIndex: 'thickness',
      key: 'thickness',
      width: 100,
      render: (t: number) => `${t} mm`
    },
    {
      title: '施工面积',
      dataIndex: 'area',
      key: 'area',
      width: 100,
      render: (a: number) => `${a.toFixed(2)} ㎡`
    },
    {
      title: '设计配比 (灰:灰:油:水)',
      key: 'targetRatio',
      width: 180,
      render: (_: unknown, record: AshLayer) => {
        const r = record.targetRatio
        return `${r.ash}:${r.lime}:${r.tungOil}:${r.water}`
      }
    },
    {
      title: '实际配比',
      key: 'actualRatio',
      width: 180,
      render: (_: unknown, record: AshLayer) => {
        const r = record.actualRatio
        if (!r) return <Tag color="default">未录入</Tag>
        const ratioText = `${r.ash}:${r.lime}:${r.tungOil}:${r.water}`
        return (
          <Space>
            <span style={record.hasDeviation ? { color: '#ff4d4f', fontWeight: 'bold' } : {}}>
              {ratioText}
            </span>
            {deviationTag(Math.abs(record.deviation?.ash || 0) + Math.abs(record.deviation?.lime || 0))}
          </Space>
        )
      }
    },
    {
      title: '配比偏差 (%)',
      key: 'deviation',
      width: 200,
      render: (_: unknown, record: AshLayer) => {
        if (!record.deviation) return '-'
        return (
          <Space size={8}>
            <span className={deviationColorClass(record.deviation.ash)}>
              灰{record.deviation.ash > 0 ? '+' : ''}{record.deviation.ash}%
            </span>
            <span className={deviationColorClass(record.deviation.lime)}>
              灰{record.deviation.lime > 0 ? '+' : ''}{record.deviation.lime}%
            </span>
            <span className={deviationColorClass(record.deviation.tungOil)}>
              油{record.deviation.tungOil > 0 ? '+' : ''}{record.deviation.tungOil}%
            </span>
          </Space>
        )
      }
    },
    {
      title: '预计用料 (kg)',
      key: 'usage',
      width: 180,
      render: (_: unknown, record: AshLayer) => {
        const ratio = record.actualRatio || record.targetRatio
        const usage = calculateAshUsage(record.area, record.thickness, ratio)
        return (
          <Space size={6} wrap>
            <span>灰:{usage.ash}</span>
            <span>灰:{usage.lime}</span>
            <span>油:{usage.tungOil}</span>
          </Space>
        )
      }
    },
    {
      title: '操作',
      key: 'action',
      width: 100,
      fixed: 'right' as const,
      render: (_: unknown, record: AshLayer) => (
        <Button
          type={record.hasDeviation ? 'primary' : 'default'}
          danger={record.hasDeviation}
          size="small"
          onClick={() => handleEditRatio(record)}
        >
          {record.actualRatio ? '修改配比' : '录入配比'}
        </Button>
      )
    }
  ]

  const mabuColumns = [
    {
      title: '类型',
      dataIndex: 'type',
      key: 'type',
      width: 100,
      render: (type: 'ma' | 'bu') => type === 'ma' ? '麻丝' : '麻布'
    },
    {
      title: '名称',
      dataIndex: 'name',
      key: 'name',
      width: 150
    },
    {
      title: '幅宽',
      dataIndex: 'width',
      key: 'width',
      width: 100,
      render: (w: number) => `${w} cm`
    },
    {
      title: '搭接量',
      dataIndex: 'overlap',
      key: 'overlap',
      width: 100,
      render: (o: number) => `${o} cm`
    },
    {
      title: '搭接率',
      key: 'overlapRate',
      width: 100,
      render: (_: unknown, record: MabuLayer) => 
        `${Math.round((record.overlap / record.width) * 100)}%`
    },
    {
      title: '施工面积',
      dataIndex: 'area',
      key: 'area',
      width: 120,
      render: (a: number) => `${a.toFixed(2)} ㎡`
    },
    {
      title: '预计用量',
      dataIndex: 'usage',
      key: 'usage',
      width: 120,
      render: (u: number, record: MabuLayer) => 
        `${u.toFixed(2)} ${record.type === 'ma' ? 'kg' : '㎡'}`
    },
    {
      title: '操作',
      key: 'action',
      width: 100,
      render: (_: unknown, record: MabuLayer) => (
        <Button size="small" onClick={() => handleEditMabu(record)}>
          修改参数
        </Button>
      )
    }
  ]

  if (!currentProcess && processes.length === 0) {
    return (
      <div>
        <div className="page-title">
          <span>🧪 灰层配比</span>
          <div className="page-subtitle">按地仗等级计算各灰层配比，识别偏差并生成备料清单</div>
        </div>
        <Alert
          message="暂无施工工序"
          description="请先在「构件录入」页面添加构件并开始施工"
          type="info"
          showIcon
          action={
            <Button type="primary" size="small" onClick={() => navigate('/component')}>
              前往构件录入 <RightOutlined />
            </Button>
          }
        />
      </div>
    )
  }

  const availableProcesses = processes.filter(p => p.status !== 'completed')

  return (
    <div>
      <div className="page-title">
        <span>🧪 灰层配比</span>
        <div className="page-subtitle">按地仗等级计算各灰层配比，识别偏差并生成备料清单</div>
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
              <Tag color="green">面积: {currentProcess.layers[0]?.area.toFixed(2)} ㎡</Tag>
            </Space>
          )}
        </Space>
      </Card>

      {currentProcess && (
        <>
          {currentProcess.riskWarnings.length > 0 && (
            <Alert
              message="存在配比偏差风险"
              description={
                <ul>
                  {currentProcess.riskWarnings
                    .filter(w => w.type === 'ratio_deviation')
                    .map(w => (
                      <li key={w.id} style={{ color: '#ff4d4f' }}>{w.message}</li>
                    ))}
                </ul>
              }
              type="warning"
              showIcon
              style={{ marginBottom: 16 }}
            />
          )}

          <Row gutter={16} style={{ marginBottom: 16 }}>
            <Col span={6}>
              <Card className="stat-card">
                <Statistic
                  title="灰层数量"
                  value={currentProcess.layers.length}
                  suffix="层"
                  valueStyle={{ color: '#8B4513' }}
                />
              </Card>
            </Col>
            <Col span={6}>
              <Card className="stat-card">
                <Statistic
                  title="灰/灰总用量"
                  value={(currentProcess.totalAshUsage.ash || 0) + (currentProcess.totalAshUsage.lime || 0)}
                  suffix="kg"
                  precision={2}
                  valueStyle={{ color: '#d4a574' }}
                />
              </Card>
            </Col>
            <Col span={6}>
              <Card className="stat-card">
                <Statistic
                  title="桐油用量"
                  value={currentProcess.totalAshUsage.tungOil || 0}
                  suffix="kg"
                  precision={2}
                  valueStyle={{ color: '#8B4513' }}
                />
              </Card>
            </Col>
            <Col span={6}>
              <Card className="stat-card">
                <Statistic
                  title="麻/布用量"
                  value={currentProcess.totalMabuUsage || 0}
                  suffix={currentProcess.mabuLayers.some(m => m.type === 'bu') ? 'kg/㎡' : 'kg'}
                  precision={2}
                  valueStyle={{ color: '#5c3d2e' }}
                />
              </Card>
            </Col>
          </Row>

          <Card
            title="灰层配比详情"
            extra={
              <Space>
                <Button icon={<CalculatorOutlined />} onClick={() => recalculateProcess(currentProcess.id)}>
                  重新计算
                </Button>
              </Space>
            }
            style={{ marginBottom: 16 }}
          >
            <Table
              columns={layerColumns}
              dataSource={currentProcess.layers}
              rowKey="id"
              pagination={false}
              scroll={{ x: 1300 }}
              rowClassName={(record) => record.hasDeviation ? 'deviation-row' : ''}
            />
          </Card>

          {currentProcess.mabuLayers.length > 0 && (
            <Card
              title="麻布/麻丝层"
              style={{ marginBottom: 16 }}
            >
              <Table
                columns={mabuColumns}
                dataSource={currentProcess.mabuLayers}
                rowKey="id"
                pagination={false}
              />
            </Card>
          )}

          <Row gutter={16}>
            <Col span={12}>
              <Card title="配比分布图表" className="layer-card">
                <ReactECharts
                  option={ratioChartOption}
                  style={{ height: 350 }}
                  notMerge={true}
                  lazyUpdate={true}
                />
              </Card>
            </Col>
            <Col span={12}>
              <Card 
                title="备料清单" 
                className="layer-card"
                extra={
                  <Button
                    type="primary"
                    icon={<FileTextOutlined />}
                    size="small"
                    onClick={() => {
                      message.info('备料清单已生成')
                    }}
                  >
                    导出清单
                  </Button>
                }
              >
                {materialList && (
                  <Descriptions column={1} size="small" bordered>
                    <Descriptions.Item label="灰">
                      <strong style={{ color: '#8B4513' }}>{materialList.ash.toFixed(2)} kg</strong>
                    </Descriptions.Item>
                    <Descriptions.Item label="灰（灰）">
                      <strong style={{ color: '#8B4513' }}>{materialList.lime.toFixed(2)} kg</strong>
                    </Descriptions.Item>
                    <Descriptions.Item label="桐油">
                      <strong style={{ color: '#8B4513' }}>{materialList.tungOil.toFixed(2)} kg</strong>
                    </Descriptions.Item>
                    <Descriptions.Item label="麻丝">
                      <strong style={{ color: '#8B4513' }}>{materialList.ma.toFixed(2)} kg</strong>
                    </Descriptions.Item>
                    <Descriptions.Item label="麻布">
                      <strong style={{ color: '#8B4513' }}>{materialList.bu.toFixed(2)} ㎡</strong>
                    </Descriptions.Item>
                    <Descriptions.Item label="损耗系数">
                      <Tag color="orange">建议加购 10% 以防损耗</Tag>
                    </Descriptions.Item>
                  </Descriptions>
                )}
                
                <Divider />
                
                <div style={{ textAlign: 'center' }}>
                  <Progress
                    type="dashboard"
                    percent={
                      currentProcess.layers.filter(l => l.actualRatio).length /
                      currentProcess.layers.length * 100
                    }
                    format={(percent) => `配比录入 ${percent?.toFixed(0)}%`}
                    strokeColor={{
                      '0%': '#108ee9',
                      '100%': '#87d068',
                    }}
                  />
                </div>
              </Card>
            </Col>
          </Row>
        </>
      )}

      <Modal
        title={editingLayer ? `录入${editingLayer.name}实际配比` : '录入配比'}
        open={ratioModalVisible}
        onOk={handleRatioSubmit}
        onCancel={() => setRatioModalVisible(false)}
        width={600}
        okText="保存"
        cancelText="取消"
      >
        {editingLayer && (
          <div style={{ marginBottom: 16 }}>
            <Alert
              message={`设计配比: 灰 ${editingLayer.targetRatio.ash} : 灰 ${editingLayer.targetRatio.lime} : 油 ${editingLayer.targetRatio.tungOil} : 水 ${editingLayer.targetRatio.water}`}
              type="info"
              showIcon
            />
          </div>
        )}
        <Form form={ratioForm} layout="vertical">
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="ash"
                label="灰 (份)"
                rules={[{ required: true, message: '请输入灰比例' }]}
              >
                <InputNumber min={0} step={0.1} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="lime"
                label="灰 (份)"
                rules={[{ required: true, message: '请输入灰比例' }]}
              >
                <InputNumber min={0} step={0.1} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="tungOil"
                label="桐油 (份)"
                rules={[{ required: true, message: '请输入桐油比例' }]}
              >
                <InputNumber min={0} step={0.1} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="water"
                label="水 (份)"
                rules={[{ required: true, message: '请输入水比例' }]}
              >
                <InputNumber min={0} step={0.1} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>
          <Alert
            message="系统将自动计算实际配比与设计配比的偏差，偏差超过±5%将标红警示"
            type="warning"
            showIcon
            icon={<AlertOutlined />}
          />
        </Form>
      </Modal>

      <Modal
        title={editingMabu ? `修改${editingMabu.type === 'ma' ? '麻丝' : '麻布'}参数` : '修改参数'}
        open={mabuModalVisible}
        onOk={handleMabuSubmit}
        onCancel={() => setMabuModalVisible(false)}
        width={500}
        okText="保存"
        cancelText="取消"
      >
        {editingMabu && (
          <div style={{ marginBottom: 16 }}>
            <Tag color="blue">施工面积: {editingMabu.area.toFixed(2)} ㎡</Tag>
            <Tag color="green">当前用量: {editingMabu.usage.toFixed(2)} {editingMabu.type === 'ma' ? 'kg' : '㎡'}</Tag>
          </div>
        )}
        <Form form={mabuForm} layout="vertical">
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="width"
                label={editingMabu?.type === 'ma' ? '麻丝幅宽 (cm)' : '麻布幅宽 (cm)'}
                rules={[{ required: true, message: '请输入幅宽' }]}
              >
                <InputNumber min={5} max={200} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="overlap"
                label="搭接量 (cm)"
                rules={[{ required: true, message: '请输入搭接量' }]}
              >
                <InputNumber min={0} max={100} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>
          <Alert
            message="搭接量越大，材料用量越多，传统工艺麻丝搭接一般为3-5cm，麻布搭接一般为8-12cm"
            type="info"
            showIcon
          />
        </Form>
      </Modal>
    </div>
  )
}

export default AshRatioPage
