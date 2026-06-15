import { create } from 'zustand'
import type { 
  WoodenComponent, DizhangProcess, DizhangArchive, DizhangParadigm,
  AshLayer, MabuLayer, RiskWarning
} from '../types/dizhang'
import { 
  generateAshLayers, calculateTotalMaterialList, 
  calculateDryTime, checkAllRisks, getDefaultParadigms 
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
  addProcessWarning: (processId: string, warning: RiskWarning) => void
  completeProcess: (processId: string) => DizhangArchive | null
  addParadigm: (paradigm: DizhangParadigm) => void
  updateParadigm: (id: string, paradigm: Partial<DizhangParadigm>) => void
  deleteParadigm: (id: string) => void
  initDefaultParadigms: () => void
  recalculateProcess: (processId: string) => void
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
      temperature: 20,
      humidity: 55,
      startDate: new Date().toISOString(),
      totalAshUsage: {},
      totalMabuUsage: 0,
      riskWarnings: [],
      status: 'draft'
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
        
        const mabuLayers = p.mabuLayers.map(layer => 
          layer.id === layerId ? { ...layer, ...updates } : layer
        )
        
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

  addProcessWarning: (processId, warning) =>
    set((state) => ({
      processes: state.processes.map(p => 
        p.id === processId 
          ? { ...p, riskWarnings: [...p.riskWarnings, warning] }
          : p
      )
    })),

  completeProcess: (processId) => {
    const state = get()
    const process = state.processes.find(p => p.id === processId)
    if (!process) return null

    const component = state.components.find(c => c.id === process.componentId)
    const materialList = calculateTotalMaterialList(process.layers, process.mabuLayers)
    
    const archive: DizhangArchive = {
      id: `archive-${Date.now()}`,
      processId: process.id,
      componentName: process.componentName,
      componentCode: component?.code || '',
      gradeName: process.gradeName,
      records: [],
      materialList,
      totalArea: component?.area || 0,
      startDate: process.startDate,
      endDate: new Date().toISOString(),
      qualityRating: process.riskWarnings.length === 0 ? 5 : 
                     process.riskWarnings.filter(w => w.level === 'critical').length > 0 ? 2 :
                     process.riskWarnings.filter(w => w.level === 'high').length > 0 ? 3 : 4
    }

    set((state) => ({
      archives: [...state.archives, archive],
      processes: state.processes.map(p => 
        p.id === processId ? { ...p, status: 'completed' as const, endDate: archive.endDate } : p
      )
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
