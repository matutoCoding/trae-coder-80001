import { useEffect, useState } from 'react'
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom'
import { Layout, Menu, Button, Badge, App as AntdApp } from 'antd'
import {
  DashboardOutlined,
  ExperimentOutlined,
  ToolOutlined,
  FolderOpenOutlined,
  DatabaseOutlined,
  SaveOutlined,
  ImportOutlined,
  ExportOutlined
} from '@ant-design/icons'
import type { MenuProps } from 'antd'
import ComponentInputPage from './pages/ComponentInputPage'
import AshRatioPage from './pages/AshRatioPage'
import PlasteringPage from './pages/PlasteringPage'
import ArchivePage from './pages/ArchivePage'
import ParadigmPage from './pages/ParadigmPage'
import { useDizhangStore, usePersistence } from './store/dizhangStore'

const { Header, Sider, Content } = Layout

type MenuItem = Required<MenuProps>['items'][number]

const App = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const { message } = AntdApp.useApp()
  const { saveAll, loadAll, exportData, importData } = usePersistence()
  const processes = useDizhangStore(state => state.processes)
  const [collapsed, setCollapsed] = useState(false)

  useEffect(() => {
    const init = async () => {
      const success = await loadAll()
      if (success) {
        message.success('数据加载成功')
      }
    }
    init()
  }, [])

  useEffect(() => {
    const interval = setInterval(() => {
      saveAll()
    }, 30000)
    return () => clearInterval(interval)
  }, [processes])

  const warningCount = processes.filter(p => p.status === 'warning').length

  const menuItems: MenuItem[] = [
    {
      key: '/component',
      icon: <DashboardOutlined />,
      label: '构件录入'
    },
    {
      key: '/ratio',
      icon: <ExperimentOutlined />,
      label: '灰层配比'
    },
    {
      key: '/plastering',
      icon: <ToolOutlined />,
      label: (
        <span>
          披灰工序
          {warningCount > 0 && (
            <Badge
              count={warningCount}
              size="small"
              style={{ marginLeft: 8 }}
              className="warning-badge"
            />
          )}
        </span>
      )
    },
    {
      key: '/archive',
      icon: <FolderOpenOutlined />,
      label: '工艺档案'
    },
    {
      key: '/paradigm',
      icon: <DatabaseOutlined />,
      label: '范式库'
    }
  ]

  const handleMenuClick: MenuProps['onClick'] = ({ key }) => {
    navigate(key)
  }

  const handleSave = async () => {
    await saveAll()
    message.success('数据已保存')
  }

  const handleExport = async () => {
    const success = await exportData('all')
    if (success) {
      message.success('导出成功')
    }
  }

  const handleImport = async () => {
    const success = await importData()
    if (success) {
      message.success('导入成功')
    } else {
      message.error('导入失败或已取消')
    }
  }

  return (
    <Layout style={{ height: '100vh' }}>
      <Header style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ fontSize: 20, fontWeight: 'bold', color: '#f5e6d3' }}>
            🏛️ 传统古建油饰地仗工艺系统
          </div>
          <div style={{ fontSize: 12, color: '#c9b896' }}>
            灰层配比 · 披灰工序 · 质量管控
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <Button icon={<ImportOutlined />} onClick={handleImport} size="small">
            导入
          </Button>
          <Button icon={<ExportOutlined />} onClick={handleExport} size="small">
            导出
          </Button>
          <Button type="primary" icon={<SaveOutlined />} onClick={handleSave} size="small">
            保存
          </Button>
        </div>
      </Header>
      <Layout>
        <Sider
          width={200}
          collapsible
          collapsed={collapsed}
          onCollapse={setCollapsed}
          theme="dark"
        >
          <Menu
            mode="inline"
            selectedKeys={[location.pathname]}
            items={menuItems}
            onClick={handleMenuClick}
            style={{ height: '100%', borderRight: 0 }}
            theme="dark"
          />
        </Sider>
        <Layout style={{ padding: '16px', overflow: 'auto' }}>
          <Content
            style={{
              padding: 24,
              margin: 0,
              minHeight: 280,
              background: '#fffef9',
              borderRadius: 8,
              border: '1px solid #e8dcc8'
            }}
          >
            <Routes>
              <Route path="/" element={<ComponentInputPage />} />
              <Route path="/component" element={<ComponentInputPage />} />
              <Route path="/ratio" element={<AshRatioPage />} />
              <Route path="/plastering" element={<PlasteringPage />} />
              <Route path="/archive" element={<ArchivePage />} />
              <Route path="/paradigm" element={<ParadigmPage />} />
            </Routes>
          </Content>
        </Layout>
      </Layout>
    </Layout>
  )
}

export default App
