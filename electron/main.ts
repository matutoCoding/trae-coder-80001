import { app, BrowserWindow, ipcMain, dialog } from 'electron'
import path from 'path'
import fs from 'fs'

let mainWindow: BrowserWindow | null = null

const createWindow = () => {
  mainWindow = new BrowserWindow({
    width: 1440,
    height: 900,
    minWidth: 1280,
    minHeight: 800,
    title: '传统古建油饰地仗灰层配比与披灰工序生产力系统',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    },
    icon: path.join(__dirname, '../build/icon.png'),
    backgroundColor: '#f5f0e8',
    frame: true,
    autoHideMenuBar: true
  })

  if (process.env.VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL)
    mainWindow.webContents.openDevTools()
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'))
  }

  mainWindow.on('closed', () => {
    mainWindow = null
  })
}

app.whenReady().then(() => {
  createWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow()
    }
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

ipcMain.handle('save-data', async (_event, fileName: string, data: string) => {
  const userDataPath = app.getPath('userData')
  const filePath = path.join(userDataPath, fileName)
  try {
    fs.writeFileSync(filePath, data, 'utf-8')
    return { success: true, filePath }
  } catch (error) {
    return { success: false, error: (error as Error).message }
  }
})

ipcMain.handle('load-data', async (_event, fileName: string) => {
  const userDataPath = app.getPath('userData')
  const filePath = path.join(userDataPath, fileName)
  try {
    if (fs.existsSync(filePath)) {
      const data = fs.readFileSync(filePath, 'utf-8')
      return { success: true, data }
    }
    return { success: false, data: null }
  } catch (error) {
    return { success: false, error: (error as Error).message, data: null }
  }
})

ipcMain.handle('export-file', async (_event, data: string, defaultName: string) => {
  const result = await dialog.showSaveDialog(mainWindow!, {
    title: '导出文件',
    defaultPath: defaultName,
    filters: [{ name: 'JSON 文件', extensions: ['json'] }]
  })

  if (!result.canceled && result.filePath) {
    try {
      fs.writeFileSync(result.filePath, data, 'utf-8')
      return { success: true, filePath: result.filePath }
    } catch (error) {
      return { success: false, error: (error as Error).message }
    }
  }
  return { success: false, canceled: true }
})

ipcMain.handle('import-file', async () => {
  const result = await dialog.showOpenDialog(mainWindow!, {
    title: '导入文件',
    filters: [{ name: 'JSON 文件', extensions: ['json'] }],
    properties: ['openFile']
  })

  if (!result.canceled && result.filePaths.length > 0) {
    try {
      const data = fs.readFileSync(result.filePaths[0], 'utf-8')
      return { success: true, data }
    } catch (error) {
      return { success: false, error: (error as Error).message }
    }
  }
  return { success: false, canceled: true }
})
