import { create } from 'zustand'
import type { 
  WoodenComponent, DizhangProcess, DizhangArchive, DizhangParadigm,
  AshLayer, MabuLayer, RiskWarning, ProcessRecord
} from '../types/dizhang'
import { 
  generateAshLayers, calculateTotalMaterialList, 
  calculateDryTime, checkAllRisks, getDefaultParadigms,
  createProcessRecord, createMabuProcessRecord
} from '../utils/dizhangAlgorithm'

interface DizhangState {
  components: WoodenComponent[]
  processes: DizhangProcess[]
  archives: DizhangArchive[]
  paradigms: DizhangParadigm[]
  currentComponent: WoodenComponent | null
  currentProcess: DizhangProcess | null
  currentArchive: DizhangArchive | null
  setComponents: (components: WoodenComponent[]) => void
  setProcesses: (processes: DizhangProcess[]) => void
  setArchives: (archives: DizhangArchive[]) => void
  setParadigms: (paradigms: DizhangParadigm[]) => void
  setCurrentComponent: (component: WoodenComponent | null) => void
  setCurrentProcess: (process: DizhangProcess | null) => void
  setCurrentArchive: (archive: DizhangArchive | null) => void
  addComponent: (component: WoodenComponent) => void
  updateComponent: (id: string, component: Partial<WoodenComponent>) => void
  deleteComponent: (id: string) => void
  createProcess: (componentId: string) => DizhangProcess | null
  updateProcess: (id: string, process: Partial<DizhangProcess>) => void
  updateProcessLayer: (processId: string, layerId: string, updates: Partial<AshLayer>) => void
  updateMabuLayer: (processId: string, layerId: string, updates: Partial<MabuLayer>) => void
  addProcessRecord: (processId: string, record: ProcessRecord) => void
  addAshLayerRecord: (processId: string, layerId: string, operator?: string, notes?: string) => ProcessRecord | null
  addMabuLayerRecord: (processId: string, layerId: string, operator?: string, notes?: string) => ProcessRecord | null
  markMabuLayerDry: (processId: string, layerId: string) => void
  addProcessWarning: (processId: string, warning: RiskWarning) => void
  completeProcess: (processId: string, inspector?: string, notes?: string) => DizhangArchive | null
  addParadigm: (paradigm: DizhangParadigm) => void
  updateParadigm: (id: string, paradigm: Partial<DizhangParadigm>) => void
  deleteParadigm: (id: string) => void
  initDefaultParadigms: () => void
  recalculateProcess: (processId: string) => void
  checkCanCompleteProcess: (processId: string) => { canComplete: boolean; missingItems: string[] }
}

export const useDizhangStore = create<DizhangState>((set, get) => ({
  components: [],
  processes: [],
  archives: [],
  paradigms: [],
  currentComponent: null,
  currentProcess: null,
  currentArchive: null,

  setComponents: (components) => set({ components }),
  setProcesses: (processes) => set({ processes }),
  setArchives: (archives) => set({ archives }),
  setParadigms: (paradigms) => set({ paradigms }),
  setCurrentComponent: (component) => set({ currentComponent: component }),
  setCurrentProcess: (process) => set({ currentProcess: process }),
  setCurrentArchive: (archive) => set({ currentArchive: archive }),

  addComponent: (component) => 
    set((state) => ({ 
      components: [...state.components, component] 
    })),

  updateComponent: (id, updates) =>
    set((state) => ({
      components: state.components.map(c => 
        c.id === id ? { ...c, ...updates, updatedAt: new Date().toISOString() } : c
      )
    })),

  deleteComponent: (id) =>
    set((state) => ({
      components: state.components.filter(c => c.id !== id)
    })),

  createProcess: (componentId) => {
    const state = get()
    const component = state.components.find(c => c.id === componentId)
    if (!component) return null

    const existingProcess = state.processes.find(
      p => p.componentId === componentId && p.status !== 'completed'
    )
    if (existingProcess) {
      set({ currentProcess: existingProcess })
      return existingProcess
    }

    const { ashLayers, mabuLayers } = generateAshLayers(
      component.targetGrade,
      component.area,
      component.surfaceCondition
    )

    const process: DizhangProcess = {
      id: `process-${Date.now()}`,
      componentId: component.id,
      componentName: component.name,
      grade: component.targetGrade,
      gradeName: component.targetGradeName,
      layers: ashLayers,
      mabuLayers,
      records: [],
      temperature: 20,
      humidity: 55,
      startDate: new Date().toISOString(),
      totalAshUsage: {},
      totalMabuUsage: 0,
      riskWarnings: [],
      status: 'in_progress'
    }

    const materialList = calculateTotalMaterialList(ashLayers, mabuLayers)
    process.totalAshUsage = {
      ash: materialList.ash,
      lime: materialList.lime,
      tungOil: materialList.tungOil
    }
    process.totalMabuUsage = materialList.ma + materialList.bu
    process.riskWarnings = checkAllRisks(ashLayers, process.temperature, process.humidity)

    set((state) => ({
      components: state.components.map(c =>
        c.id === componentId ? { ...c, status: 'in_progress' as const, updatedAt: new Date().toISOString() } : c
      ),
      processes: [...state.processes, process],
      currentProcess: process
    }))

    return process
  },

  updateProcess: (id, updates) =>
    set((state) => ({
      processes: state.processes.map(p => 
        p.id === id ? { ...p, ...updates } : p
      ),
      currentProcess: state.currentProcess?.id === id 
        ? { ...state.currentProcess, ...updates }
        : state.currentProcess
    })),

  updateProcessLayer: (processId, layerId, updates) =>
    set((state) => {
      const processes = state.processes.map(p => {
        if (p.id !== processId) return p
        
        const layers = p.layers.map(layer => {
          if (layer.id !== layerId) return layer
          
          const updated = { ...layer, ...updates }
          
          if (updates.appliedAt) {
            const { adjustedDryTime } = calculateDryTime(
              layer.dryTime,
              p.temperature,
              p.humidity
            )
            updated.actualDryTime = adjustedDryTime
          }
          
          return updated
        })
        
        const warnings = checkAllRisks(layers, p.temperature, p.humidity)
        const materialList = calculateTotalMaterialList(layers, p.mabuLayers)
        
        return {
          ...p,
          layers,
          riskWarnings: warnings,
          totalAshUsage: {
            ash: materialList.ash,
            lime: materialList.lime,
            tungOil: materialList.tungOil
          },
          status: warnings.length > 0 ? 'warning' : p.status
        }
      })
      
      return {
        processes,
        currentProcess: processes.find(p => p.id === processId) || state.currentProcess
      }
    }),

  updateMabuLayer: (processId, layerId, updates) =>
    set((state) => {
      const processes = state.processes.map(p => {
        if (p.id !== processId) return p
        
        const mabuLayers = p.mabuLayers.map(layer => {
          const updated = { ...layer, ...updates }
          if (updates.appliedAt) {
            const { adjustedDryTime } = calculateDryTime(
              layer.dryTime,
              p.temperature,
              p.humidity
            )
            updated.actualDryTime = adjustedDryTime
          }
          return updated
        })
        
        const materialList = calculateTotalMaterialList(p.layers, mabuLayers)
        
        return {
          ...p,
          mabuLayers,
          totalMabuUsage: materialList.ma + materialList.bu
        }
      })
      
      return {
        processes,
        currentProcess: processes.find(p => p.id === processId) || state.currentProcess
      }
    }),

  addProcessRecord: (processId, record) =>
    set((state) => ({
      processes: state.processes.map(p =>
        p.id === processId
          ? { ...p, records: [...p.records, record] }
          : p
      ),
      currentProcess: state.currentProcess?.id === processId
        ? { ...state.currentProcess, records: [...state.currentProcess.records, record] }
        : state.currentProcess
    })),

  addAshLayerRecord: (processId, layerId, operator, notes) => {
    const state = get()
    const process = state.processes.find(p => p.id === processId)
    if (!process) return null

    const layer = process.layers.find(l => l.id === layerId)
    if (!layer || !layer.appliedAt) return null

    const record = createProcessRecord(
      layer,
      process.temperature,
      process.humidity,
      operator,
      notes
    )

    state.addProcessRecord(processId, record)
    return record
  },

  addMabuLayerRecord: (processId, layerId, operator, notes) => {
    const state = get()
    const process = state.processes.find(p => p.id === processId)
    if (!process) return null

    const layer = process.mabuLayers.find(l => l.id === layerId)
    if (!layer || !layer.appliedAt) return null

    const record = createMabuProcessRecord(
      layer,
      process.temperature,
      process.humidity,
      operator,
      notes
    )

    state.addProcessRecord(processId, record)
    return record
  },

  markMabuLayerDry: (processId, layerId) =>
    set((state) => ({
      processes: state.processes.map(p =>
        p.id === processId
          ? {
              ...p,
              mabuLayers: p.mabuLayers.map(l =>
                l.id === layerId ? { ...l, isDry: true } : l
              )
            }
          : p
      ),
      currentProcess: state.currentProcess?.id === processId
        ? {
            ...state.currentProcess,
            mabuLayers: state.currentProcess.mabuLayers.map(l =>
              l.id === layerId ? { ...l, isDry: true } : l
            )
          }
        : state.currentProcess
    })),

  addProcessWarning: (processId, warning) =>
    set((state) => ({
      processes: state.processes.map(p => 
        p.id === processId 
          ? { ...p, riskWarnings: [...p.riskWarnings, warning] }
          : p
      )
    })),

  checkCanCompleteProcess: (processId) => {
    const state = get()
    const process = state.processes.find(p => p.id === processId)
    if (!process) return { canComplete: false, missingItems: ['工序不存在'] }

    const missingItems: string[] = []

    const undoneAshLayers = process.layers.filter(l => !l.appliedAt)
    if (undoneAshLayers.length > 0) {
      missingItems.push(`未施工的灰层: ${undoneAshLayers.map(l => l.name).join('、')}`)
    }

    const undryAshLayers = process.layers.filter(l => l.appliedAt && !l.isDry)
    if (undryAshLayers.length > 0) {
      missingItems.push(`未确认干燥的灰层: ${undryAshLayers.map(l => l.name).join('、')}`)
    }

    const undoneMabuLayers = process.mabuLayers.filter(l => !l.appliedAt)
    if (undoneMabuLayers.length > 0) {
      missingItems.push(`未施工的麻/布层: ${undoneMabuLayers.map(l => l.name).join('、')}`)
    }

    const undryMabuLayers = process.mabuLayers.filter(l => l.appliedAt && !l.isDry)
    if (undryMabuLayers.length > 0) {
      missingItems.push(`未确认干燥的麻/布层: ${undryMabuLayers.map(l => l.name).join('、')}`)
    }

    return {
      canComplete: missingItems.length === 0,
      missingItems
    }
  },

  completeProcess: (processId, inspector, notes) => {
    const state = get()
    const process = state.processes.find(p => p.id === processId)
    if (!process) return null

    const { canComplete, missingItems } = state.checkCanCompleteProcess(processId)
    if (!canComplete) {
      return null
    }

    const component = state.components.find(c => c.id === process.componentId)
    if (!component) return null

    const materialList = calculateTotalMaterialList(process.layers, process.mabuLayers)
    
    const allRecords = [...process.records].sort((a, b) => 
      new Date(a.appliedAt).getTime() - new Date(b.appliedAt).getTime()
    )

    const avgTemp = allRecords.length > 0
      ? Math.round(allRecords.reduce((sum, r) => sum + r.temperature, 0) / allRecords.length * 10) / 10
      : process.temperature

    const avgHumidity = allRecords.length > 0
      ? Math.round(allRecords.reduce((sum, r) => sum + r.humidity, 0) / allRecords.length * 10) / 10
      : process.humidity

    const totalWarnings = process.riskWarnings.length

    let qualityRating = 5
    if (totalWarnings > 0) {
      const criticalCount = process.riskWarnings.filter(w => w.level === 'critical').length
      const highCount = process.riskWarnings.filter(w => w.level === 'high').length
      if (criticalCount > 0) qualityRating = 2
      else if (highCount > 0) qualityRating = 3
      else qualityRating = 4
    }

    const archive: DizhangArchive = {
      id: `archive-${Date.now()}`,
      processId: process.id,
      component: { ...component },
      componentName: process.componentName,
      componentCode: component.code,
      grade: process.grade,
      gradeName: process.gradeName,
      records: allRecords,
      ashLayers: [...process.layers],
      mabuLayers: [...process.mabuLayers],
      materialList,
      totalArea: component.area,
      startDate: process.startDate,
      endDate: new Date().toISOString(),
      qualityRating,
      avgTemperature: avgTemp,
      avgHumidity,
      totalWarnings,
      inspector,
      notes
    }

    set((state) => ({
      components: state.components.map(c =>
        c.id === process.componentId
          ? { ...c, status: 'completed' as const, updatedAt: new Date().toISOString() }
          : c
      ),
      archives: [...state.archives, archive],
      processes: state.processes.map(p => 
        p.id === processId
          ? { ...p, status: 'completed' as const, endDate: archive.endDate }
          : p
      ),
      currentComponent: state.currentComponent?.id === process.componentId
        ? { ...state.currentComponent, status: 'completed' as const }
        : state.currentComponent,
      currentProcess: state.currentProcess?.id === processId
        ? { ...state.currentProcess, status: 'completed' as const }
        : state.currentProcess
    }))

    return archive
  },

  addParadigm: (paradigm) =>
    set((state) => ({
      paradigms: [...state.paradigms, paradigm]
    })),

  updateParadigm: (id, updates) =>
    set((state) => ({
      paradigms: state.paradigms.map(p => 
        p.id === id ? { ...p, ...updates } : p
      )
    })),

  deleteParadigm: (id) =>
    set((state) => ({
      paradigms: state.paradigms.filter(p => p.id !== id && !p.isDefault)
    })),

  initDefaultParadigms: () => {
    const state = get()
    if (state.paradigms.length === 0) {
      const defaults = getDefaultParadigms()
      set({ paradigms: defaults })
    }
  },

  recalculateProcess: (processId) => {
    const state = get()
    const process = state.processes.find(p => p.id === processId)
    if (!process) return

    const warnings = checkAllRisks(process.layers, process.temperature, process.humidity)
    const materialList = calculateTotalMaterialList(process.layers, process.mabuLayers)

    set((state) => ({
      processes: state.processes.map(p => 
        p.id === processId ? {
          ...p,
          riskWarnings: warnings,
          totalAshUsage: {
            ash: materialList.ash,
            lime: materialList.lime,
            tungOil: materialList.tungOil
          },
          totalMabuUsage: materialList.ma + materialList.bu,
          status: warnings.length > 0 ? 'warning' : p.status
        } : p
      )
    }))
  }
}))

export const usePersistence = () => {
  const store = useDizhangStore()

  const saveAll = async () => {
    const data = {
      components: store.components,
      processes: store.processes,
      archives: store.archives,
      paradigms: store.paradigms
    }
    
    if (window.electronAPI) {
      await window.electronAPI.saveData('dizhang-data.json', JSON.stringify(data, null, 2))
    }
  }

  const loadAll = async () => {
    if (window.electronAPI) {
      const result = await window.electronAPI.loadData('dizhang-data.json')
      if (result.success && result.data) {
        try {
          const data = JSON.parse(result.data)
          store.setComponents(data.components || [])
          store.setProcesses(data.processes || [])
          store.setArchives(data.archives || [])
          store.setParadigms(data.paradigms || [])
          
          if (!data.paradigms || data.paradigms.length === 0) {
            store.initDefaultParadigms()
          }
          return true
        } catch {
          store.initDefaultParadigms()
          return false
        }
      } else {
        store.initDefaultParadigms()
        return false
      }
    }
    return false
  }

  const exportData = async (type: 'all' | 'process' | 'archive', id?: string) => {
    let data: unknown
    let fileName = `dizhang-export-${Date.now()}.json`

    if (type === 'all') {
      data = {
        components: store.components,
        processes: store.processes,
        archives: store.archives,
        paradigms: store.paradigms,
        exportTime: new Date().toISOString()
      }
      fileName = `dizhang-full-export-${Date.now()}.json`
    } else if (type === 'process' && id) {
      const process = store.processes.find(p => p.id === id)
      if (process) {
        data = { process, exportTime: new Date().toISOString() }
        fileName = `process-${process.componentName}-${Date.now()}.json`
      } else {
        return false
      }
    } else if (type === 'archive' && id) {
      const archive = store.archives.find(a => a.id === id)
      if (archive) {
        data = { archive, exportTime: new Date().toISOString() }
        fileName = `archive-${archive.componentName}-${Date.now()}.json`
      } else {
        return false
      }
    }

    if (window.electronAPI && data) {
      const result = await window.electronAPI.exportFile(JSON.stringify(data, null, 2), fileName)
      return result.success
    }
    return false
  }

  const importData = async () => {
    if (window.electronAPI) {
      const result = await window.electronAPI.importFile()
      if (result.success && result.data) {
        try {
          const data = JSON.parse(result.data)
          if (data.process) {
            store.setProcesses([...store.processes, data.process])
          } else if (data.archive) {
            store.setArchives([...store.archives, data.archive])
          } else if (data.components) {
            store.setComponents(data.components || store.components)
            store.setProcesses(data.processes || store.processes)
            store.setArchives(data.archives || store.archives)
            store.setParadigms(data.paradigms || store.paradigms)
          }
          return true
        } catch {
          return false
        }
      }
    }
    return false
  }

  return { saveAll, loadAll, exportData, importData }
}
