import React from 'react'
import ReactDOM from 'react-dom/client'
import { HashRouter } from 'react-router-dom'
import { ConfigProvider, App as AntdApp } from 'antd'
import zhCN from 'antd/locale/zh_CN'
import App from './App'
import './styles/global.css'

const theme = {
  token: {
    colorPrimary: '#8B4513',
    colorInfo: '#8B4513',
    colorSuccess: '#52c41a',
    colorWarning: '#faad14',
    colorError: '#ff4d4f',
    fontFamily: "'Microsoft YaHei', 'SimSun', sans-serif",
    borderRadius: 6,
    colorBgContainer: '#fffef9',
    colorBgElevated: '#fffef9',
    colorBorder: '#d4c4a8',
    colorSplit: '#e8dcc8'
  },
  components: {
    Layout: {
      headerBg: '#5c3d2e',
      headerColor: '#f5e6d3',
      siderBg: '#3d2817',
      bodyBg: '#f5f0e8'
    },
    Menu: {
      darkItemBg: '#3d2817',
      darkSubMenuItemBg: '#4a3525',
      darkItemSelectedBg: '#8B4513'
    },
    Table: {
      headerBg: '#f0e6d6',
      borderColor: '#d4c4a8'
    },
    Card: {
      headerBg: '#f0e6d6'
    }
  }
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ConfigProvider locale={zhCN} theme={theme}>
      <AntdApp>
        <HashRouter>
          <App />
        </HashRouter>
      </AntdApp>
    </ConfigProvider>
  </React.StrictMode>
)
