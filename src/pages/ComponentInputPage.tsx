import { useState } from 'react'
import {
  Card,
  Form,
  Input,
  InputNumber,
  Select,
  Button,
  Table,
  Space,
  Modal,
  Row,
  Col,
  Switch,
  Slider,
  Tag,
  Popconfirm,
  App,
  Divider,
  Statistic
} from 'antd'
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  PlayCircleOutlined,
  InfoCircleOutlined
} from '@ant-design/icons'
import dayjs from 'dayjs'
import type { WoodenComponent, SurfaceCondition, DizhangGrade, WoodMaterial } from '../types/dizhang'
import { WOOD_MATERIAL_OPTIONS, DIZHANG_GRADE_OPTIONS } from '../types/dizhang'
import { useDizhangStore } from '../store/dizhangStore'
import { useNavigate } from 'react-router-dom'

const { Option } = Select
const { TextArea } = Input

const ComponentInputPage = () => {
  const { message } = App.useApp()
  const navigate = useNavigate()
  const components = useDizhangStore(state => state.components)
  const addComponent = useDizhangStore(state => state.addComponent)
  const updateComponent = useDizhangStore(state => state.updateComponent)
  const deleteComponent = useDizhangStore(state => state.deleteComponent)
  const setCurrentComponent = useDizhangStore(state => state.setCurrentComponent)
  const createProcess = useDizhangStore(state => state.createProcess)

  const [modalVisible, setModalVisible] = useState(false)
  const [editingComponent, setEditingComponent] = useState<WoodenComponent | null>(null)
  const [form] = Form.useForm<{
    name: string
    code: string
    material: WoodMaterial
    position: string
    length: number
    width: number
    height: number
    surfaceCondition: SurfaceCondition
    targetGrade: DizhangGrade
    notes?: string
  }>()

  const calculateArea = (length: number, width: number, height: number) => {
    return Math.round((length * width * 2 + length * height * 2 + width * height * 2) * 100) / 100
  }

  const handleAdd = () => {
    setEditingComponent(null)
    form.resetFields()
    form.setFieldsValue({
      surfaceCondition: {
        hasCracks: false,
        crackWidth: 0,
        hasRot: false,
        rotArea: 0,
        hasLoose: false,
        looseArea: 0,
        smoothness: 70,
        moistureContent: 12
      }
    })
    setModalVisible(true)
  }

  const handleEdit = (component: WoodenComponent) => {
    setEditingComponent(component)
    form.setFieldsValue({
      ...component,
      surfaceCondition: component.surfaceCondition
    })
    setModalVisible(true)
  }

  const handleDelete = (id: string) => {
    deleteComponent(id)
    message.success('删除成功')
  }

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields()
      const area = calculateArea(values.length, values.width, values.height)
      const gradeInfo = DIZHANG_GRADE_OPTIONS.find(g => g.value === values.targetGrade)
      const materialInfo = WOOD_MATERIAL_OPTIONS.find(m => m.value === values.material)

      const componentData: WoodenComponent = {
        id: editingComponent?.id || `component-${Date.now()}`,
        ...values,
        materialName: materialInfo?.label || values.material,
        area,
        targetGradeName: gradeInfo?.label || values.targetGrade,
        createdAt: editingComponent?.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        status: editingComponent?.status || 'pending'
      }

      if (editingComponent) {
        updateComponent(editingComponent.id, componentData)
        message.success('更新成功')
      } else {
        addComponent(componentData)
        message.success('添加成功')
      }

      setModalVisible(false)
    } catch {
      // 表单验证失败
    }
  }

  const handleStartProcess = (component: WoodenComponent) => {
    setCurrentComponent(component)
    const process = createProcess(component.id)
    if (process) {
      message.success('工序已创建，正在跳转...')
      navigate('/ratio')
    }
  }

  const getStatusTag = (status: WoodenComponent['status']) => {
    const colors = {
      pending: 'default',
      in_progress: 'processing',
      completed: 'success'
    }
    const labels = {
      pending: '待施工',
      in_progress: '施工中',
      completed: '已完成'
    }
    return <Tag color={colors[status]}>{labels[status]}</Tag>
  }

  const columns = [
    {
      title: '构件编号',
      dataIndex: 'code',
      key: 'code',
      width: 120,
      render: (text: string) => <code style={{ background: '#f0e6d6', padding: '2px 6px', borderRadius: 4 }}>{text}</code>
    },
    {
      title: '构件名称',
      dataIndex: 'name',
      key: 'name',
      width: 150
    },
    {
      title: '材质',
      dataIndex: 'materialName',
      key: 'materialName',
      width: 100
    },
    {
      title: '位置',
      dataIndex: 'position',
      key: 'position',
      width: 150
    },
    {
      title: '尺寸 (长×宽×高)',
      key: 'size',
      width: 180,
      render: (_: unknown, record: WoodenComponent) => 
        `${record.length}m × ${record.width}m × ${record.height}m`
    },
    {
      title: '表面积 (㎡)',
      dataIndex: 'area',
      key: 'area',
      width: 120,
      render: (text: number) => <strong style={{ color: '#8B4513' }}>{text.toFixed(2)}</strong>
    },
    {
      title: '表面状况',
      key: 'condition',
      width: 180,
      render: (_: unknown, record: WoodenComponent) => {
        const sc = record.surfaceCondition
        const tags = []
        if (sc.hasCracks) tags.push(<Tag key="crack" color="orange">有裂缝 {sc.crackWidth}mm</Tag>)
        if (sc.hasRot) tags.push(<Tag key="rot" color="red">有腐朽 {sc.rotArea}%</Tag>)
        if (sc.hasLoose) tags.push(<Tag key="loose" color="gold">有松动 {sc.looseArea}%</Tag>)
        if (tags.length === 0) tags.push(<Tag key="good" color="green">良好</Tag>)
        return <Space size={4} wrap>{tags}</Space>
      }
    },
    {
      title: '目标地仗等级',
      dataIndex: 'targetGradeName',
      key: 'targetGradeName',
      width: 120
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: WoodenComponent['status']) => getStatusTag(status)
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 160,
      render: (text: string) => dayjs(text).format('YYYY-MM-DD HH:mm')
    },
    {
      title: '操作',
      key: 'action',
      width: 200,
      fixed: 'right' as const,
      render: (_: unknown, record: WoodenComponent) => (
        <Space size="small">
          <Button
            type="primary"
            size="small"
            icon={<PlayCircleOutlined />}
            onClick={() => handleStartProcess(record)}
            disabled={record.status === 'completed'}
          >
            开始施工
          </Button>
          <Button
            size="small"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
          >
            编辑
          </Button>
          <Popconfirm
            title="确定删除此构件？"
            onConfirm={() => handleDelete(record.id)}
            okText="确定"
            cancelText="取消"
          >
            <Button size="small" danger icon={<DeleteOutlined />}>
              删除
            </Button>
          </Popconfirm>
        </Space>
      )
    }
  ]

  const stats = [
    { label: '总构件数', value: components.length, color: '#8B4513' },
    { label: '待施工', value: components.filter(c => c.status === 'pending').length, color: '#faad14' },
    { label: '施工中', value: components.filter(c => c.status === 'in_progress').length, color: '#1890ff' },
    { label: '已完成', value: components.filter(c => c.status === 'completed').length, color: '#52c41a' }
  ]

  return (
    <div>
      <div className="page-title">
        <span>🏗️ 构件录入</span>
        <div className="page-subtitle">录入木构件的材质、尺寸、表面状况及目标地仗等级</div>
      </div>

      <Row gutter={16} style={{ marginBottom: 16 }}>
        {stats.map((stat, index) => (
          <Col span={6} key={index}>
            <Card className="stat-card">
              <div className="stat-value" style={{ color: stat.color }}>{stat.value}</div>
              <div className="stat-label">{stat.label}</div>
            </Card>
          </Col>
        ))}
      </Row>

      <Card
        extra={
          <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
            添加构件
          </Button>
        }
      >
        <Table
          columns={columns}
          dataSource={components}
          rowKey="id"
          scroll={{ x: 1400 }}
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showTotal: (total) => `共 ${total} 条记录`
          }}
        />
      </Card>

      <Modal
        title={editingComponent ? '编辑构件' : '添加构件'}
        open={modalVisible}
        onOk={handleSubmit}
        onCancel={() => setModalVisible(false)}
        width={900}
        okText="保存"
        cancelText="取消"
      >
        <Form form={form} layout="vertical">
          <Row gutter={16}>
            <Col span={8}>
              <Form.Item
                name="code"
                label="构件编号"
                rules={[{ required: true, message: '请输入构件编号' }]}
              >
                <Input placeholder="如：L-001" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                name="name"
                label="构件名称"
                rules={[{ required: true, message: '请输入构件名称' }]}
              >
                <Input placeholder="如：梁枋、柱头、斗拱" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                name="material"
                label="材质"
                rules={[{ required: true, message: '请选择材质' }]}
              >
                <Select>
                  {WOOD_MATERIAL_OPTIONS.map(opt => (
                    <Option key={opt.value} value={opt.value}>{opt.label}</Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="position"
                label="所在位置"
                rules={[{ required: true, message: '请输入所在位置' }]}
              >
                <Input placeholder="如：正殿明间东缝、前廊西次间" />
              </Form.Item>
            </Col>
            <Col span={4}>
              <Form.Item
                name="length"
                label="长度 (m)"
                rules={[{ required: true, message: '请输入长度' }]}
              >
                <InputNumber min={0} step={0.01} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={4}>
              <Form.Item
                name="width"
                label="宽度 (m)"
                rules={[{ required: true, message: '请输入宽度' }]}
              >
                <InputNumber min={0} step={0.01} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={4}>
              <Form.Item
                name="height"
                label="高度 (m)"
                rules={[{ required: true, message: '请输入高度' }]}
              >
                <InputNumber min={0} step={0.01} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>

          <Divider orientation="left">
            <Space>
              <span>表面状况检测</span>
              <InfoCircleOutlined style={{ color: '#8b7355' }} />
            </Space>
          </Divider>

          <Row gutter={16}>
            <Col span={6}>
              <Form.Item
                name={['surfaceCondition', 'hasCracks']}
                label="是否有裂缝"
                valuePropName="checked"
              >
                <Switch />
              </Form.Item>
              <Form.Item
                noStyle
                shouldUpdate={(prev, curr) => 
                  prev.surfaceCondition?.hasCracks !== curr.surfaceCondition?.hasCracks
                }
              >
                {({ getFieldValue }) => 
                  getFieldValue(['surfaceCondition', 'hasCracks']) ? (
                    <Form.Item name={['surfaceCondition', 'crackWidth']} label="裂缝宽度 (mm)">
                      <InputNumber min={0} step={0.5} style={{ width: '100%' }} />
                    </Form.Item>
                  ) : null
                }
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item
                name={['surfaceCondition', 'hasRot']}
                label="是否有腐朽"
                valuePropName="checked"
              >
                <Switch />
              </Form.Item>
              <Form.Item
                noStyle
                shouldUpdate={(prev, curr) => 
                  prev.surfaceCondition?.hasRot !== curr.surfaceCondition?.hasRot
                }
              >
                {({ getFieldValue }) => 
                  getFieldValue(['surfaceCondition', 'hasRot']) ? (
                    <Form.Item name={['surfaceCondition', 'rotArea']} label="腐朽面积 (%)">
                      <InputNumber min={0} max={100} style={{ width: '100%' }} />
                    </Form.Item>
                  ) : null
                }
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item
                name={['surfaceCondition', 'hasLoose']}
                label="是否有松动"
                valuePropName="checked"
              >
                <Switch />
              </Form.Item>
              <Form.Item
                noStyle
                shouldUpdate={(prev, curr) => 
                  prev.surfaceCondition?.hasLoose !== curr.surfaceCondition?.hasLoose
                }
              >
                {({ getFieldValue }) => 
                  getFieldValue(['surfaceCondition', 'hasLoose']) ? (
                    <Form.Item name={['surfaceCondition', 'looseArea']} label="松动面积 (%)">
                      <InputNumber min={0} max={100} style={{ width: '100%' }} />
                    </Form.Item>
                  ) : null
                }
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item name={['surfaceCondition', 'moistureContent']} label="含水率 (%)">
                <InputNumber min={5} max={30} step={0.5} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={24}>
              <Form.Item name={['surfaceCondition', 'smoothness']} label="表面平整度">
                <Slider
                  min={0}
                  max={100}
                  marks={{
                    0: '粗糙',
                    30: '较粗糙',
                    50: '一般',
                    70: '较平整',
                    100: '平整'
                  }}
                />
              </Form.Item>
            </Col>
          </Row>

          <Divider orientation="left">施工要求</Divider>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="targetGrade"
                label="目标地仗等级"
                rules={[{ required: true, message: '请选择地仗等级' }]}
              >
                <Select
                  options={DIZHANG_GRADE_OPTIONS.map(opt => ({
                    value: opt.value,
                    label: opt.label,
                    title: opt.description
                  }))}
                />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item name="notes" label="备注">
            <TextArea rows={3} placeholder="其他需要说明的情况..." />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}

export default ComponentInputPage
