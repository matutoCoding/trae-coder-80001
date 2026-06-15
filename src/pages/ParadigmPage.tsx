import { useState } from 'react'
import {
  Card,
  Row,
  Col,
  Button,
  Modal,
  Form,
  Input,
  InputNumber,
  Select,
  Table,
  Tag,
  Space,
  Descriptions,
  List,
  Avatar,
  App,
  Divider,
  Popconfirm,
  Switch,
  Statistic,
  message as AntMessage
} from 'antd'
import {
  DatabaseOutlined,
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  EyeOutlined,
  StarOutlined,
  CopyOutlined,
  SafetyCertificateOutlined,
  ExperimentOutlined
} from '@ant-design/icons'
import dayjs from 'dayjs'
import type { DizhangParadigm, DizhangGrade, HuicengType, WoodMaterial } from '../types/dizhang'
import { DIZHANG_GRADE_OPTIONS, HUICENG_TYPE_NAMES, WOOD_MATERIAL_OPTIONS } from '../types/dizhang'
import { useDizhangStore } from '../store/dizhangStore'

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

const ParadigmPage = () => {
  const { message } = App.useApp()
  const paradigms = useDizhangStore(state => state.paradigms)
  const addParadigm = useDizhangStore(state => state.addParadigm)
  const updateParadigm = useDizhangStore(state => state.updateParadigm)
  const deleteParadigm = useDizhangStore(state => state.deleteParadigm)

  const [detailVisible, setDetailVisible] = useState(false)
  const [editVisible, setEditVisible] = useState(false)
  const [selectedParadigm, setSelectedParadigm] = useState<DizhangParadigm | null>(null)
  const [isEditing, setIsEditing] = useState(false)

  const [form] = Form.useForm<{
    name: string
    grade: DizhangGrade
    description: string
    suitableMaterials: WoodMaterial[]
    suitableConditions: string[]
    totalThickness: number
    isDefault: boolean
  }>()

  const [layersForm] = Form.useForm()

  const handleViewDetail = (paradigm: DizhangParadigm) => {
    setSelectedParadigm(paradigm)
    setDetailVisible(true)
  }

  const handleAdd = () => {
    setSelectedParadigm(null)
    setIsEditing(false)
    form.resetFields()
    form.setFieldsValue({
      suitableMaterials: ['pine', 'cypress', 'fir'],
      suitableConditions: ['一般条件'],
      isDefault: false
    })
    layersForm.setFieldsValue({
      layers: [
        { type: 'zhuofenghui', name: '捉缝灰', thickness: 2, dryTime: 24, ash: 5, lime: 1, tungOil: 1.5, water: 2 },
        { type: 'tonghui', name: '通灰', thickness: 5, dryTime: 36, ash: 4, lime: 1, tungOil: 1.2, water: 2.5 },
        { type: 'zhonghui', name: '中灰', thickness: 4, dryTime: 24, ash: 3, lime: 1, tungOil: 1, water: 2 },
        { type: 'xihui', name: '细灰', thickness: 2, dryTime: 36, ash: 2, lime: 1, tungOil: 0.8, water: 1.5 }
      ]
    })
    setEditVisible(true)
  }

  const handleEdit = (paradigm: DizhangParadigm) => {
    setSelectedParadigm(paradigm)
    setIsEditing(true)
    form.setFieldsValue({
      name: paradigm.name,
      grade: paradigm.grade,
      description: paradigm.description,
      suitableMaterials: paradigm.suitableMaterials,
      suitableConditions: paradigm.suitableConditions,
      totalThickness: paradigm.totalThickness,
      isDefault: paradigm.isDefault
    })
    
    const layers = paradigm.layers.map((l, i) => ({
      id: l.type,
      type: l.type,
      name: l.name,
      order: l.order,
      thickness: l.thickness,
      dryTime: l.dryTime,
      ash: l.ratio.ash,
      lime: l.ratio.lime,
      tungOil: l.ratio.tungOil,
      water: l.ratio.water,
      notes: l.notes
    }))
    layersForm.setFieldsValue({ layers })
    
    setEditVisible(true)
  }

  const handleCopy = (paradigm: DizhangParadigm) => {
    const newParadigm: DizhangParadigm = {
      ...paradigm,
      id: `paradigm-${Date.now()}`,
      name: `${paradigm.name} (副本)`,
      isDefault: false,
      createdAt: new Date().toISOString()
    }
    addParadigm(newParadigm)
    message.success('范式已复制')
  }

  const handleDelete = (id: string) => {
    deleteParadigm(id)
    message.success('范式已删除')
  }

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields()
      const layersValues = await layersForm.validateFields()
      
      const layers = layersValues.layers.map((l: any, index: number) => ({
        type: l.type as HuicengType | 'mabu',
        name: l.name,
        order: index + 1,
        thickness: l.thickness,
        ratio: {
          ash: l.ash,
          lime: l.lime,
          tungOil: l.tungOil,
          water: l.water
        },
        dryTime: l.dryTime,
        notes: l.notes
      }))

      const totalThickness = layers.reduce((sum: number, l: any) => sum + l.thickness, 0)

      const gradeInfo = DIZHANG_GRADE_OPTIONS.find(g => g.value === values.grade)

      const paradigmData: DizhangParadigm = {
        id: selectedParadigm?.id || `paradigm-${Date.now()}`,
        name: values.name,
        grade: values.grade,
        gradeName: gradeInfo?.label || values.grade,
        description: values.description,
        suitableMaterials: values.suitableMaterials,
        suitableConditions: values.suitableConditions,
        layers,
        totalThickness,
        createdAt: selectedParadigm?.createdAt || new Date().toISOString(),
        isDefault: selectedParadigm?.isDefault || false
      }

      if (isEditing && selectedParadigm) {
        updateParadigm(selectedParadigm.id, paradigmData)
        message.success('范式已更新')
      } else {
        addParadigm(paradigmData)
        message.success('范式已创建')
      }

      setEditVisible(false)
    } catch {
      // 验证失败
    }
  }

  const columns = [
    {
      title: '范式名称',
      dataIndex: 'name',
      key: 'name',
      width: 150,
      render: (text: string, record: DizhangParadigm) => (
        <Space>
          {record.isDefault && (
            <Tag color="gold" icon={<StarOutlined />}>标准</Tag>
          )}
          <span style={{ fontWeight: record.isDefault ? 'bold' : 'normal' }}>
            {text}
          </span>
        </Space>
      )
    },
    {
      title: '地仗等级',
      dataIndex: 'gradeName',
      key: 'gradeName',
      width: 120
    },
    {
      title: '灰层数量',
      key: 'layerCount',
      width: 100,
      render: (_: unknown, record: DizhangParadigm) => record.layers.length
    },
    {
      title: '总厚度',
      dataIndex: 'totalThickness',
      key: 'totalThickness',
      width: 100,
      render: (t: number) => `${t} mm`
    },
    {
      title: '适用材质',
      key: 'materials',
      width: 200,
      render: (_: unknown, record: DizhangParadigm) => (
        <Space size={4} wrap>
          {record.suitableMaterials.map(m => (
            <Tag key={m} color="blue">
              {WOOD_MATERIAL_OPTIONS.find(o => o.value === m)?.label || m}
            </Tag>
          ))}
        </Space>
      )
    },
    {
      title: '说明',
      dataIndex: 'description',
      key: 'description',
      ellipsis: true
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
      width: 240,
      fixed: 'right' as const,
      render: (_: unknown, record: DizhangParadigm) => (
        <Space size="small">
          <Button
            type="primary"
            size="small"
            icon={<EyeOutlined />}
            onClick={() => handleViewDetail(record)}
          >
            查看
          </Button>
          <Button
            size="small"
            icon={<CopyOutlined />}
            onClick={() => handleCopy(record)}
          >
            复制
          </Button>
          {!record.isDefault && (
            <>
              <Button
                size="small"
                icon={<EditOutlined />}
                onClick={() => handleEdit(record)}
              >
                编辑
              </Button>
              <Popconfirm
                title="确定删除此范式？"
                onConfirm={() => handleDelete(record.id)}
                okText="确定"
                cancelText="取消"
              >
                <Button size="small" danger icon={<DeleteOutlined />}>
                  删除
                </Button>
              </Popconfirm>
            </>
          )}
        </Space>
      )
    }
  ]

  return (
    <div>
      <div className="page-title">
        <span>📚 范式库</span>
        <div className="page-subtitle">管理不同等级的地仗做法标准，可自定义创建新工艺范式</div>
      </div>

      <Card
        title="范式列表"
        extra={
          <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
            创建新范式
          </Button>
        }
      >
        <Table
          columns={columns}
          dataSource={paradigms}
          rowKey="id"
          scroll={{ x: 1300 }}
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showTotal: (total) => `共 ${total} 条范式`
          }}
        />
      </Card>

      <Modal
        title="范式详情"
        open={detailVisible}
        onCancel={() => setDetailVisible(false)}
        footer={null}
        width={900}
      >
        {selectedParadigm && (
          <div>
            <Descriptions title="基本信息" bordered size="small" column={2} style={{ marginBottom: 16 }}>
              <Descriptions.Item label="范式名称">
                <Space>
                  {selectedParadigm.name}
                  {selectedParadigm.isDefault && (
                    <Tag color="gold" icon={<StarOutlined />}>标准范式</Tag>
                  )}
                </Space>
              </Descriptions.Item>
              <Descriptions.Item label="地仗等级">
                {selectedParadigm.gradeName}
              </Descriptions.Item>
              <Descriptions.Item label="总厚度">
                {selectedParadigm.totalThickness} mm
              </Descriptions.Item>
              <Descriptions.Item label="灰层数量">
                {selectedParadigm.layers.length} 层
              </Descriptions.Item>
              <Descriptions.Item label="适用材质" span={2}>
                <Space size={4} wrap>
                  {selectedParadigm.suitableMaterials.map(m => (
                    <Tag key={m} color="blue">
                      {WOOD_MATERIAL_OPTIONS.find(o => o.value === m)?.label || m}
                    </Tag>
                  ))}
                </Space>
              </Descriptions.Item>
              <Descriptions.Item label="适用条件" span={2}>
                <Space size={4} wrap>
                  {selectedParadigm.suitableConditions.map((c, i) => (
                    <Tag key={i} color="green">{c}</Tag>
                  ))}
                </Space>
              </Descriptions.Item>
              <Descriptions.Item label="说明" span={2}>
                {selectedParadigm.description}
              </Descriptions.Item>
            </Descriptions>

            <Divider orientation="left">
              <Space>
                <ExperimentOutlined />
                工艺层详情
              </Space>
            </Divider>

            <List
              dataSource={selectedParadigm.layers}
              renderItem={(layer, index) => (
                <List.Item key={index}>
                  <Card
                    size="small"
                    style={{ width: '100%', borderLeft: `4px solid ${LAYER_COLORS[index % LAYER_COLORS.length]}` }}
                    title={
                      <Space>
                        <Tag color="blue">第 {layer.order} 层</Tag>
                        <strong>{layer.name}</strong>
                        {layer.type === 'mabu' && (
                          <Tag color="orange">
                            {layer.notes || (selectedParadigm.mabuSpec?.type === 'ma' ? '麻丝' : '麻布')}
                          </Tag>
                        )}
                      </Space>
                    }
                    extra={
                      <Space>
                        <Tag>厚度: {layer.thickness}mm</Tag>
                        <Tag color="processing">干燥: {layer.dryTime}h</Tag>
                      </Space>
                    }
                  >
                    {layer.type !== 'mabu' && (
                      <Row gutter={16}>
                        <Col span={6}>
                          <Statistic
                            title="灰"
                            value={layer.ratio.ash}
                            suffix="份"
                            valueStyle={{ fontSize: 14, color: '#8B4513' }}
                          />
                        </Col>
                        <Col span={6}>
                          <Statistic
                            title="灰（灰）"
                            value={layer.ratio.lime}
                            suffix="份"
                            valueStyle={{ fontSize: 14, color: '#d4a574' }}
                          />
                        </Col>
                        <Col span={6}>
                          <Statistic
                            title="桐油"
                            value={layer.ratio.tungOil}
                            suffix="份"
                            valueStyle={{ fontSize: 14, color: '#8B4513' }}
                          />
                        </Col>
                        <Col span={6}>
                          <Statistic
                            title="水"
                            value={layer.ratio.water}
                            suffix="份"
                            valueStyle={{ fontSize: 14, color: '#1890ff' }}
                          />
                        </Col>
                      </Row>
                    )}
                    {layer.type === 'mabu' && selectedParadigm.mabuSpec && (
                      <Row gutter={16}>
                        <Col span={8}>
                          <Statistic
                            title="类型"
                            value={selectedParadigm.mabuSpec.type === 'ma' ? '麻丝' : '麻布'}
                            valueStyle={{ fontSize: 14, color: '#8B4513' }}
                          />
                        </Col>
                        <Col span={8}>
                          <Statistic
                            title="幅宽"
                            value={selectedParadigm.mabuSpec.width}
                            suffix="cm"
                            valueStyle={{ fontSize: 14, color: '#d4a574' }}
                          />
                        </Col>
                        <Col span={8}>
                          <Statistic
                            title="搭接率"
                            value={selectedParadigm.mabuSpec.overlapRate}
                            suffix="%"
                            valueStyle={{ fontSize: 14, color: '#1890ff' }}
                          />
                        </Col>
                      </Row>
                    )}
                  </Card>
                </List.Item>
              )}
            />

            <div style={{ marginTop: 16, padding: 16, background: '#f0e6d6', borderRadius: 8 }}>
              <Space direction="vertical" size="small" style={{ width: '100%' }}>
                <div style={{ color: '#5c3d2e', fontWeight: 'bold' }}>
                  <SafetyCertificateOutlined /> 工艺总览
                </div>
                <div style={{ color: '#5c3d2e' }}>
                  本范式共 {selectedParadigm.layers.length} 层，总厚度 {selectedParadigm.totalThickness}mm，
                  标准施工周期约 {selectedParadigm.layers.reduce((sum, l) => sum + l.dryTime, 0)} 小时
                  （约 {Math.ceil(selectedParadigm.layers.reduce((sum, l) => sum + l.dryTime, 0) / 24)} 天）。
                </div>
                <div style={{ color: '#8b7355', fontSize: 12 }}>
                  * 实际施工周期受环境温湿度影响，以上为标准条件下的参考值
                </div>
              </Space>
            </div>
          </div>
        )}
      </Modal>

      <Modal
        title={isEditing ? '编辑范式' : '创建新范式'}
        open={editVisible}
        onOk={handleSubmit}
        onCancel={() => setEditVisible(false)}
        width={1000}
        okText="保存"
        cancelText="取消"
      >
        <Form form={form} layout="vertical">
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="name"
                label="范式名称"
                rules={[{ required: true, message: '请输入范式名称' }]}
              >
                <Input placeholder="如：官式一麻五灰" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="grade"
                label="地仗等级"
                rules={[{ required: true, message: '请选择地仗等级' }]}
              >
                <Select>
                  {DIZHANG_GRADE_OPTIONS.map(opt => (
                    <Option key={opt.value} value={opt.value}>{opt.label}</Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            name="description"
            label="范式说明"
            rules={[{ required: true, message: '请输入范式说明' }]}
          >
            <TextArea rows={2} placeholder="描述此范式的特点、适用场景等" />
          </Form.Item>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="suitableMaterials"
                label="适用材质"
                rules={[{ required: true, message: '请选择适用材质' }]}
              >
                <Select mode="multiple">
                  {WOOD_MATERIAL_OPTIONS.map(opt => (
                    <Option key={opt.value} value={opt.value}>{opt.label}</Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="suitableConditions"
                label="适用条件"
                rules={[{ required: true, message: '请输入适用条件' }]}
              >
                <Select
                  mode="tags"
                  placeholder="输入后回车添加，如：重要建筑、大构件、一般条件"
                />
              </Form.Item>
            </Col>
          </Row>

          <Divider orientation="left">工艺层配置</Divider>

          <Form form={layersForm} layout="vertical">
            <Form.List
              name="layers"
              rules={[
                {
                  validator: async (_, layers) => {
                    if (!layers || layers.length < 2) {
                      return Promise.reject(new Error('至少需要2层工艺'))
                    }
                  }
                }
              ]}
            >
              {(fields, { add, remove }, { errors }) => (
                <>
                  {fields.map(({ key, name, ...restField }, index) => (
                    <Card
                      key={key}
                      size="small"
                      style={{ marginBottom: 12, borderLeft: `4px solid ${LAYER_COLORS[index % LAYER_COLORS.length]}` }}
                      title={
                        <Space>
                          <Tag color="blue">第 {index + 1} 层</Tag>
                          <Form.Item
                            {...restField}
                            name={[name, 'type']}
                            rules={[{ required: true }]}
                            style={{ marginBottom: 0, display: 'inline-block', width: 150 }}
                          >
                            <Select size="small">
                              <Option value="zhuofenghui">捉缝灰</Option>
                              <Option value="tonghui">通灰</Option>
                              <Option value="zhonghui">中灰</Option>
                              <Option value="xihui">细灰</Option>
                              <Option value="zhuanghui">灰</Option>
                              <Option value="mabu">麻/布层</Option>
                            </Select>
                          </Form.Item>
                          <Form.Item
                            {...restField}
                            name={[name, 'name']}
                            rules={[{ required: true }]}
                            style={{ marginBottom: 0, display: 'inline-block', width: 150 }}
                          >
                            <Input size="small" placeholder="层名称" />
                          </Form.Item>
                        </Space>
                      }
                      extra={
                        fields.length > 2 && (
                          <Button
                            type="text"
                            danger
                            size="small"
                            icon={<DeleteOutlined />}
                            onClick={() => remove(name)}
                          >
                            删除
                          </Button>
                        )
                      }
                    >
                      <Row gutter={8} align="bottom">
                        <Col span={4}>
                          <Form.Item
                            {...restField}
                            name={[name, 'thickness']}
                            label="厚度 (mm)"
                            rules={[{ required: true }]}
                            style={{ marginBottom: 0 }}
                          >
                            <InputNumber min={0} step={0.5} size="small" style={{ width: '100%' }} />
                          </Form.Item>
                        </Col>
                        <Col span={4}>
                          <Form.Item
                            {...restField}
                            name={[name, 'dryTime']}
                            label="干燥 (h)"
                            rules={[{ required: true }]}
                            style={{ marginBottom: 0 }}
                          >
                            <InputNumber min={1} size="small" style={{ width: '100%' }} />
                          </Form.Item>
                        </Col>
                        <Col span={4}>
                          <Form.Item
                            {...restField}
                            name={[name, 'ash']}
                            label="灰 (份)"
                            rules={[{ required: true }]}
                            style={{ marginBottom: 0 }}
                          >
                            <InputNumber min={0} step={0.1} size="small" style={{ width: '100%' }} />
                          </Form.Item>
                        </Col>
                        <Col span={4}>
                          <Form.Item
                            {...restField}
                            name={[name, 'lime']}
                            label="灰 (份)"
                            rules={[{ required: true }]}
                            style={{ marginBottom: 0 }}
                          >
                            <InputNumber min={0} step={0.1} size="small" style={{ width: '100%' }} />
                          </Form.Item>
                        </Col>
                        <Col span={4}>
                          <Form.Item
                            {...restField}
                            name={[name, 'tungOil']}
                            label="油 (份)"
                            rules={[{ required: true }]}
                            style={{ marginBottom: 0 }}
                          >
                            <InputNumber min={0} step={0.1} size="small" style={{ width: '100%' }} />
                          </Form.Item>
                        </Col>
                        <Col span={4}>
                          <Form.Item
                            {...restField}
                            name={[name, 'water']}
                            label="水 (份)"
                            rules={[{ required: true }]}
                            style={{ marginBottom: 0 }}
                          >
                            <InputNumber min={0} step={0.1} size="small" style={{ width: '100%' }} />
                          </Form.Item>
                        </Col>
                      </Row>
                    </Card>
                  ))}
                  <Form.Item>
                    <Button
                      type="dashed"
                      onClick={() => add()}
                      icon={<PlusOutlined />}
                      style={{ width: '100%' }}
                    >
                      添加工艺层
                    </Button>
                    <Form.ErrorList errors={errors} />
                  </Form.Item>
                </>
              )}
            </Form.List>
          </Form>
        </Form>
      </Modal>
    </div>
  )
}

export default ParadigmPage
