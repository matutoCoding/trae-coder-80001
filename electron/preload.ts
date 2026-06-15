import { contextBridge, ipcRenderer } from 'electron'

contextBridge.exposeInMainWorld('electronAPI', {
  saveData: (fileName: string, data: string) => 
    ipcRenderer.invoke('save-data', fileName, data),
  loadData: (fileName: string) => 
    ipcRenderer.invoke('load-data', fileName),
  exportFile: (data: string, defaultName: string) => 
    ipcRenderer.invoke('export-file', data, defaultName),
  importFile: () => 
    ipcRenderer.invoke('import-file')
})

declare global {
  interface Window {
    electronAPI: {
      saveData: (fileName: string, data: string) => Promise<{ success: boolean; filePath?: string; error?: string }>
      loadData: (fileName: string) => Promise<{ success: boolean; data?: string | null; error?: string }>
      exportFile: (data: string, defaultName: string) => Promise<{ success: boolean; filePath?: string; error?: string; canceled?: boolean }>
      importFile: () => Promise<{ success: boolean; data?: string; error?: string; canceled?: boolean }>
    }
  }
}

export {}
