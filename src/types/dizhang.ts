export type WoodMaterial = 
  | 'pine'      // 松木
  | 'cypress'   // 柏木
  | 'fir'       // 杉木
  | 'elm'       // 榆木
  | 'nanmu'     // 楠木
  | 'hardwood'  // 硬木
  | 'other'      // 其他

export type SurfaceCondition = {
  hasCracks: boolean
  crackWidth: number
  hasRot: boolean
  rotArea: number
  hasLoose: boolean
  looseArea: number
  smoothness: number
  moistureContent: number
}

export type DizhangGrade = 
  | 'yimawuhui'      // 一麻五灰
  | 'ermawuhui'     // 二麻五灰
  | 'sansanbuhui'    // 三麻三布灰
  | 'yimabuhui'     // 一麻布灰
  | 'yiwuhui'       // 一五灰（简易五灰
  | 'shansanbuhui'   // 单三布灰
  | 'sanhui'        // 三灰

export type HuicengType = 
  | 'zhuofenghui'    // 捉缝灰
  | 'tonghui'       // 通灰
  | 'zhonghui'      // 中灰
  | 'xihui'        // 细灰
  | 'zhuanghui'     // 灰

export type MabuType = 'ma' | 'bu'

export type MabuSpec = {
  type: MabuType
  width: number
  overlapRate: number
}

export type AshLayer = {
  id: string
  type: HuicengType
  name: string
  designThickness: number
  thickness: number
  targetRatio: {
    ash: number
    lime: number
    tungOil: number
    water: number
    other: Record<string, number>
  }
  actualRatio?: {
    ash: number
    lime: number
    tungOil: number
    water: number
    other: Record<string, number>
  }
  area: number
  appliedAt?: string
  operator?: string
  dryTime: number
  actualDryTime?: number
  isDry: boolean
  deviation?: {
    ash: number
    lime: number
    tungOil: number
    water: number
  }
  hasDeviation: boolean
  notes?: string
}

export type MabuLayer = {
  id: string
  type: MabuType
  name: string
  width: number
  overlap: number
  area: number
  usage: number
  appliedAt?: string
  operator?: string
  temperature?: number
  humidity?: number
  notes?: string
  isDry: boolean
  dryTime: number
  actualDryTime?: number
}

export type WoodenComponent = {
  id: string
  name: string
  code: string
  material: WoodMaterial
  materialName: string
  position: string
  length: number
  width: number
  height: number
  area: number
  surfaceCondition: SurfaceCondition
  targetGrade: DizhangGrade
  targetGradeName: string
  createdAt: string
  updatedAt: string
  status: 'pending' | 'in_progress' | 'completed'
}

export type DizhangProcess = {
  id: string
  componentId: string
  componentName: string
  grade: DizhangGrade
  gradeName: string
  layers: AshLayer[]
  mabuLayers: MabuLayer[]
  records: ProcessRecord[]
  temperature: number
  humidity: number
  environmentalNotes?: string
  startDate: string
  endDate?: string
  totalAshUsage: Record<string, number>
  totalMabuUsage: number
  riskWarnings: RiskWarning[]
  status: 'draft' | 'in_progress' | 'completed' | 'warning'
}

export type RiskWarning = {
  id: string
  type: 'dry_time' | 'ratio_deviation' | 'moisture' | 'temperature' | 'humidity'
  level: 'low' | 'medium' | 'high' | 'critical'
  message: string
  layerId?: string
  timestamp: string
}

export type MaterialList = {
  ash: number
  lime: number
  tungOil: number
  ma: number
  bu: number
  other: Record<string, number>
}

export type DizhangArchive = {
  id: string
  processId: string
  component: WoodenComponent
  componentName: string
  componentCode: string
  grade: DizhangGrade
  gradeName: string
  records: ProcessRecord[]
  ashLayers: AshLayer[]
  mabuLayers: MabuLayer[]
  materialList: MaterialList
  totalArea: number
  startDate: string
  endDate: string
  qualityRating: number
  avgTemperature: number
  avgHumidity: number
  totalWarnings: number
  inspector?: string
  notes?: string
}

export type ProcessRecord = {
  id: string
  layerId: string
  layerType: 'ash' | 'mabu'
  layerName: string
  appliedAt: string
  operator?: string
  thickness: number
  designThickness?: number
  ratio: Record<string, number>
  temperature: number
  humidity: number
  inspectionResult: 'pass' | 'fail' | 'warning'
  notes?: string
  deviation?: {
    ash: number
    lime: number
    tungOil: number
    water: number
  }
  mabuArea?: number
  mabuUsage?: number
  mabuOverlap?: number
  mabuWidth?: number
  mabuType?: 'ma' | 'bu'
}

export type DizhangParadigm = {
  id: string
  name: string
  grade: DizhangGrade
  gradeName: string
  description: string
  suitableMaterials: WoodMaterial[]
  suitableConditions: string[]
  layers: Array<{
    type: HuicengType | 'mabu'
    name: string
    order: number
    thickness: number
    ratio: Record<string, number>
    dryTime: number
    notes?: string
  }>
  mabuSpec?: MabuSpec
  totalThickness: number
  createdAt: string
  isDefault: boolean
}

export const WOOD_MATERIAL_OPTIONS: Array<{ value: WoodMaterial; label: string }> = [
  { value: 'pine', label: '松木' },
  { value: 'cypress', label: '柏木' },
  { value: 'fir', label: '杉木' },
  { value: 'elm', label: '榆木' },
  { value: 'nanmu', label: '楠木' },
  { value: 'hardwood', label: '硬木' },
  { value: 'other', label: '其他' }
]

export const DIZHANG_GRADE_OPTIONS: Array<{ value: DizhangGrade; label: string; description: string }> = [
  { value: 'yimawuhui', label: '一麻五灰', description: '传统最高等级，一麻五灰，适用于重要构件' },
  { value: 'ermawuhui', label: '二麻五灰', description: '二麻五灰，适用于次重要构件' },
  { value: 'sansanbuhui', label: '三麻三布灰', description: '三麻三布灰，适用于大构件' },
  { value: 'yimabuhui', label: '一麻布灰', description: '一麻布灰，中等要求' },
  { value: 'yiwuhui', label: '一五灰', description: '简易五灰，一般要求' },
  { value: 'shansanbuhui', label: '单三布灰', description: '单三布灰，简易做法' },
  { value: 'sanhui', label: '三灰', description: '三灰，最简易做法' }
]

export const HUICENG_TYPE_NAMES: Record<HuicengType, string> = {
  zhuofenghui: '捉缝灰',
  tonghui: '通灰',
  zhonghui: '中灰',
  xihui: '细灰',
  zhuanghui: '灰'
}

export const MABU_TYPE_NAMES: Record<MabuType, string> = {
  ma: '麻丝',
  bu: '麻布'
}
