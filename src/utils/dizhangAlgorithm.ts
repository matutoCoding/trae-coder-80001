import type { 
  DizhangGrade, HuicengType, AshLayer, MabuLayer, 
  MabuType, MaterialList, RiskWarning, SurfaceCondition,
  DizhangParadigm, ProcessRecord
} from '../types/dizhang'

const ASH_DENSITY = 1.8
const LIME_DENSITY = 2.2
const OIL_CONSUMPTION_PER_AREA = 0.15
const MA_USAGE_PER_AREA = 0.08
const BU_USAGE_PER_AREA = 1.1

const GRADE_LAYER_CONFIG: Record<DizhangGrade, Array<{
  type: HuicengType | 'mabu'
  name: string
  order: number
  thickness: number
  ratio: { ash: number; lime: number; tungOil: number; water: number }
  dryTime: number
  mabuType?: MabuType
}>> = {
  yimawuhui: [
    { type: 'zhuofenghui', name: '捉缝灰', order: 1, thickness: 2, ratio: { ash: 5, lime: 1, tungOil: 1.5, water: 2 }, dryTime: 24 },
    { type: 'tonghui', name: '通灰（压麻灰底层', order: 2, thickness: 5, ratio: { ash: 4, lime: 1, tungOil: 1.2, water: 2.5 }, dryTime: 36 },
    { type: 'mabu', name: '糊麻', order: 3, thickness: 0, ratio: { ash: 0, lime: 0, tungOil: 0, water: 0 }, dryTime: 12, mabuType: 'ma' },
    { type: 'zhonghui', name: '中灰', order: 4, thickness: 4, ratio: { ash: 3, lime: 1, tungOil: 1, water: 2 }, dryTime: 24 },
    { type: 'xihui', name: '细灰', order: 5, thickness: 2, ratio: { ash: 2, lime: 1, tungOil: 0.8, water: 1.5 }, dryTime: 36 },
    { type: 'zhuanghui', name: '灰', order: 6, thickness: 1, ratio: { ash: 1, lime: 1, tungOil: 0.6, water: 1 }, dryTime: 48 }
  ],
  ermawuhui: [
    { type: 'zhuofenghui', name: '捉缝灰', order: 1, thickness: 2, ratio: { ash: 5, lime: 1, tungOil: 1.5, water: 2 }, dryTime: 24 },
    { type: 'tonghui', name: '通灰', order: 2, thickness: 5, ratio: { ash: 4, lime: 1, tungOil: 1.2, water: 2.5 }, dryTime: 36 },
    { type: 'mabu', name: '头道糊麻', order: 3, thickness: 0, ratio: { ash: 0, lime: 0, tungOil: 0, water: 0 }, dryTime: 12, mabuType: 'ma' },
    { type: 'zhonghui', name: '中灰', order: 4, thickness: 4, ratio: { ash: 3, lime: 1, tungOil: 1, water: 2 }, dryTime: 24 },
    { type: 'mabu', name: '二道糊麻', order: 5, thickness: 0, ratio: { ash: 0, lime: 0, tungOil: 0, water: 0 }, dryTime: 12, mabuType: 'ma' },
    { type: 'xihui', name: '细灰', order: 6, thickness: 2, ratio: { ash: 2, lime: 1, tungOil: 0.8, water: 1.5 }, dryTime: 36 },
    { type: 'zhuanghui', name: '灰', order: 7, thickness: 1, ratio: { ash: 1, lime: 1, tungOil: 0.6, water: 1 }, dryTime: 48 }
  ],
  sansanbuhui: [
    { type: 'zhuofenghui', name: '捉缝灰', order: 1, thickness: 2, ratio: { ash: 5, lime: 1, tungOil: 1.5, water: 2 }, dryTime: 24 },
    { type: 'tonghui', name: '通灰', order: 2, thickness: 5, ratio: { ash: 4, lime: 1, tungOil: 1.2, water: 2.5 }, dryTime: 36 },
    { type: 'mabu', name: '头道糊麻', order: 3, thickness: 0, ratio: { ash: 0, lime: 0, tungOil: 0, water: 0 }, dryTime: 12, mabuType: 'ma' },
    { type: 'zhonghui', name: '中灰', order: 4, thickness: 4, ratio: { ash: 3, lime: 1, tungOil: 1, water: 2 }, dryTime: 24 },
    { type: 'mabu', name: '二道糊麻', order: 5, thickness: 0, ratio: { ash: 0, lime: 0, tungOil: 0, water: 0 }, dryTime: 12, mabuType: 'ma' },
    { type: 'zhonghui', name: '中灰', order: 6, thickness: 3, ratio: { ash: 3, lime: 1, tungOil: 1, water: 2 }, dryTime: 24 },
    { type: 'mabu', name: '三道糊麻', order: 7, thickness: 0, ratio: { ash: 0, lime: 0, tungOil: 0, water: 0 }, dryTime: 12, mabuType: 'bu' },
    { type: 'xihui', name: '细灰', order: 8, thickness: 2, ratio: { ash: 2, lime: 1, tungOil: 0.8, water: 1.5 }, dryTime: 36 },
    { type: 'zhuanghui', name: '灰', order: 9, thickness: 1, ratio: { ash: 1, lime: 1, tungOil: 0.6, water: 1 }, dryTime: 48 }
  ],
  yimabuhui: [
    { type: 'zhuofenghui', name: '捉缝灰', order: 1, thickness: 2, ratio: { ash: 5, lime: 1, tungOil: 1.5, water: 2 }, dryTime: 24 },
    { type: 'tonghui', name: '通灰', order: 2, thickness: 5, ratio: { ash: 4, lime: 1, tungOil: 1.2, water: 2.5 }, dryTime: 36 },
    { type: 'mabu', name: '糊麻', order: 3, thickness: 0, ratio: { ash: 0, lime: 0, tungOil: 0, water: 0 }, dryTime: 12, mabuType: 'ma' },
    { type: 'zhonghui', name: '中灰', order: 4, thickness: 4, ratio: { ash: 3, lime: 1, tungOil: 1, water: 2 }, dryTime: 24 },
    { type: 'mabu', name: '糊布', order: 5, thickness: 0, ratio: { ash: 0, lime: 0, tungOil: 0, water: 0 }, dryTime: 12, mabuType: 'bu' },
    { type: 'xihui', name: '细灰', order: 6, thickness: 2, ratio: { ash: 2, lime: 1, tungOil: 0.8, water: 1.5 }, dryTime: 36 },
    { type: 'zhuanghui', name: '灰', order: 7, thickness: 1, ratio: { ash: 1, lime: 1, tungOil: 0.6, water: 1 }, dryTime: 48 }
  ],
  yiwuhui: [
    { type: 'zhuofenghui', name: '捉缝灰', order: 1, thickness: 2, ratio: { ash: 5, lime: 1, tungOil: 1.5, water: 2 }, dryTime: 24 },
    { type: 'tonghui', name: '通灰', order: 2, thickness: 5, ratio: { ash: 4, lime: 1, tungOil: 1.2, water: 2.5 }, dryTime: 36 },
    { type: 'zhonghui', name: '中灰', order: 3, thickness: 4, ratio: { ash: 3, lime: 1, tungOil: 1, water: 2 }, dryTime: 24 },
    { type: 'xihui', name: '细灰', order: 4, thickness: 2, ratio: { ash: 2, lime: 1, tungOil: 0.8, water: 1.5 }, dryTime: 36 },
    { type: 'zhuanghui', name: '灰', order: 5, thickness: 1, ratio: { ash: 1, lime: 1, tungOil: 0.6, water: 1 }, dryTime: 48 }
  ],
  shansanbuhui: [
    { type: 'zhuofenghui', name: '捉缝灰', order: 1, thickness: 2, ratio: { ash: 5, lime: 1, tungOil: 1.5, water: 2 }, dryTime: 24 },
    { type: 'tonghui', name: '通灰', order: 2, thickness: 4, ratio: { ash: 4, lime: 1, tungOil: 1.2, water: 2.5 }, dryTime: 36 },
    { type: 'mabu', name: '糊布', order: 3, thickness: 0, ratio: { ash: 0, lime: 0, tungOil: 0, water: 0 }, dryTime: 12, mabuType: 'bu' },
    { type: 'mabu', name: '糊布', order: 4, thickness: 0, ratio: { ash: 0, lime: 0, tungOil: 0, water: 0 }, dryTime: 12, mabuType: 'bu' },
    { type: 'mabu', name: '糊布', order: 5, thickness: 0, ratio: { ash: 0, lime: 0, tungOil: 0, water: 0 }, dryTime: 12, mabuType: 'bu' },
    { type: 'xihui', name: '细灰', order: 6, thickness: 2, ratio: { ash: 2, lime: 1, tungOil: 0.8, water: 1.5 }, dryTime: 36 }
  ],
  sanhui: [
    { type: 'zhuofenghui', name: '捉缝灰', order: 1, thickness: 2, ratio: { ash: 5, lime: 1, tungOil: 1.5, water: 2 }, dryTime: 24 },
    { type: 'zhonghui', name: '中灰', order: 2, thickness: 4, ratio: { ash: 3, lime: 1, tungOil: 1, water: 2 }, dryTime: 24 },
    { type: 'xihui', name: '细灰', order: 3, thickness: 2, ratio: { ash: 2, lime: 1, tungOil: 0.8, water: 1.5 }, dryTime: 36 }
  ]
}

export function generateAshLayers(
  grade: DizhangGrade,
  area: number,
  surfaceCondition: SurfaceCondition
): { ashLayers: AshLayer[], mabuLayers: MabuLayer[] } {
  const config = GRADE_LAYER_CONFIG[grade]
  const ashLayers: AshLayer[] = []
  const mabuLayers: MabuLayer[] = []
  
  let areaMultiplier = 1
  if (surfaceCondition.hasCracks && surfaceCondition.crackWidth > 5) {
    areaMultiplier += 0.15
  }
  if (surfaceCondition.hasRot) {
    areaMultiplier += 0.1
  }
  if (surfaceCondition.smoothness < 60) {
    areaMultiplier += 0.1
  }
  const adjustedArea = area * areaMultiplier

  config.forEach((layerConfig) => {
    const id = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    
    if (layerConfig.type === 'mabu') {
      const mabuLayer: MabuLayer = {
        id,
        type: layerConfig.mabuType!,
        name: layerConfig.name,
        width: layerConfig.mabuType === 'ma' ? 10 : 80,
        overlap: layerConfig.mabuType === 'ma' ? 3 : 10,
        area: adjustedArea,
        usage: calculateMabuUsage(adjustedArea, layerConfig.mabuType!, layerConfig.mabuType === 'ma' ? 10 : 80, layerConfig.mabuType === 'ma' ? 3 : 10),
        isDry: false,
        dryTime: layerConfig.dryTime
      }
      mabuLayers.push(mabuLayer)
    } else {
      let thicknessMultiplier = 1
      if (layerConfig.type === 'zhuofenghui' && surfaceCondition.hasCracks) {
        thicknessMultiplier = 1 + Math.min(surfaceCondition.crackWidth / 20, 0.5)
      }
      if (layerConfig.type === 'tonghui' && surfaceCondition.smoothness < 50) {
        thicknessMultiplier = 1.2
      }

      const designThickness = Math.round(layerConfig.thickness * thicknessMultiplier * 10) / 10
      const ashLayer: AshLayer = {
        id,
        type: layerConfig.type,
        name: layerConfig.name,
        designThickness,
        thickness: designThickness,
        targetRatio: {
          ash: layerConfig.ratio.ash,
          lime: layerConfig.ratio.lime,
          tungOil: layerConfig.ratio.tungOil,
          water: layerConfig.ratio.water,
          other: {}
        },
        area: adjustedArea,
        dryTime: layerConfig.dryTime,
        isDry: false,
        hasDeviation: false
      }
      ashLayers.push(ashLayer)
    }
  })

  return { ashLayers, mabuLayers }
}

export function calculateMabuUsage(
  area: number,
  type: MabuType,
  width: number,
  overlap: number
): number {
  const baseUsage = type === 'ma' ? MA_USAGE_PER_AREA : BU_USAGE_PER_AREA
  const overlapFactor = 1 + (overlap / width)
  return Math.ceil(area * baseUsage * overlapFactor * 100) / 100
}

export function calculateAshUsage(
  area: number,
  thickness: number,
  ratio: { ash: number; lime: number; tungOil: number; water: number }
): { ash: number; lime: number; tungOil: number; water: number } {
  const volume = area * (thickness / 1000)
  const totalRatio = ratio.ash + ratio.lime + ratio.tungOil + ratio.water
  
  return {
    ash: Math.round(volume * ASH_DENSITY * (ratio.ash / totalRatio) * 100) / 100,
    lime: Math.round(volume * LIME_DENSITY * (ratio.lime / totalRatio) * 100) / 100,
    tungOil: Math.round(volume * OIL_CONSUMPTION_PER_AREA * (ratio.tungOil / totalRatio) * 100) / 100,
    water: Math.round(volume * (ratio.water / totalRatio) * 1000) / 1000
  }
}

export function calculateTotalMaterialList(
  layers: AshLayer[],
  mabuLayers: MabuLayer[]
): MaterialList {
  const total: MaterialList = {
    ash: 0,
    lime: 0,
    tungOil: 0,
    ma: 0,
    bu: 0,
    other: {}
  }

  layers.forEach(layer => {
    const ratio = layer.actualRatio || layer.targetRatio
    const usage = calculateAshUsage(layer.area, layer.thickness, ratio)
    total.ash += usage.ash
    total.lime += usage.lime
    total.tungOil += usage.tungOil
  })

  mabuLayers.forEach(layer => {
    if (layer.type === 'ma') {
      total.ma += layer.usage
    } else {
      total.bu += layer.usage
    }
  })

  total.ash = Math.round(total.ash * 100) / 100
  total.lime = Math.round(total.lime * 100) / 100
  total.tungOil = Math.round(total.tungOil * 100) / 100
  total.ma = Math.round(total.ma * 100) / 100
  total.bu = Math.round(total.bu * 100) / 100

  return total
}

export function calculateRatioDeviation(
  target: { ash: number; lime: number; tungOil: number; water: number },
  actual: { ash: number; lime: number; tungOil: number; water: number }
): { deviation: { ash: number; lime: number; tungOil: number; water: number }; hasDeviation: boolean } {
  const normalize = (r: typeof target) => {
    const total = r.ash + r.lime + r.tungOil + r.water
    return {
      ash: r.ash / total,
      lime: r.lime / total,
      tungOil: r.tungOil / total,
      water: r.water / total
    }
  }

  const targetNorm = normalize(target)
  const actualNorm = normalize(actual)

  const deviation = {
    ash: Math.round((actualNorm.ash - targetNorm.ash) * 10000) / 100,
    lime: Math.round((actualNorm.lime - targetNorm.lime) * 10000) / 100,
    tungOil: Math.round((actualNorm.tungOil - targetNorm.tungOil) * 10000) / 100,
    water: Math.round((actualNorm.water - targetNorm.water) * 10000) / 100
  }

  const hasDeviation = 
    Math.abs(deviation.ash) > 5 ||
    Math.abs(deviation.lime) > 5 ||
    Math.abs(deviation.tungOil) > 5 ||
    Math.abs(deviation.water) > 5

  return { deviation, hasDeviation }
}

export function calculateDryTime(
  baseDryTime: number,
  temperature: number,
  humidity: number
): { adjustedDryTime: number; factor: number } {
  let tempFactor = 1
  if (temperature < 10) {
    tempFactor = 2.5
  } else if (temperature < 15) {
    tempFactor = 1.8
  } else if (temperature < 20) {
    tempFactor = 1.3
  } else if (temperature < 25) {
    tempFactor = 1
  } else if (temperature < 30) {
    tempFactor = 0.8
  } else if (temperature < 35) {
    tempFactor = 0.6
  } else {
    tempFactor = 0.5
  }

  let humidityFactor = 1
  if (humidity < 40) {
    humidityFactor = 0.8
  } else if (humidity < 60) {
    humidityFactor = 1
  } else if (humidity < 75) {
    humidityFactor = 1.3
  } else if (humidity < 85) {
    humidityFactor = 1.8
  } else {
    humidityFactor = 2.5
  }

  const factor = tempFactor * humidityFactor
  const adjustedDryTime = Math.round(baseDryTime * factor * 10) / 10

  return { adjustedDryTime, factor }
}

export function checkDryTimeConnection(
  layers: AshLayer[],
  currentLayerIndex: number
): RiskWarning | null {
  if (currentLayerIndex <= 0) return null

  const prevLayer = layers[currentLayerIndex - 1]
  const currentLayer = layers[currentLayerIndex]

  if (!prevLayer.appliedAt || !currentLayer.appliedAt) return null

  const prevApplyTime = new Date(prevLayer.appliedAt).getTime()
  const currentApplyTime = new Date(currentLayer.appliedAt).getTime()
  const timeDiffHours = (currentApplyTime - prevApplyTime) / (1000 * 60 * 60)

  const requiredDryTime = prevLayer.actualDryTime || prevLayer.dryTime

  if (timeDiffHours < requiredDryTime * 0.8) {
    return {
      id: `risk-${Date.now()}`,
      type: 'dry_time',
      level: timeDiffHours < requiredDryTime * 0.5 ? 'critical' : 'high',
      message: `${prevLayer.name}未完全干燥即进行${currentLayer.name}施工，间隔${Math.round(timeDiffHours)}小时，需${requiredDryTime}小时，可能导致空鼓开裂！`,
      layerId: currentLayer.id,
      timestamp: new Date().toISOString()
    }
  }

  return null
}

export function simulateCuringEffect(
  temperature: number,
  humidity: number
): {
  qualityIndex: number
  curingSpeed: number
  riskLevel: 'low' | 'medium' | 'high'
  suggestions: string[]
} {
  const suggestions: string[] = []
  let qualityIndex = 100
  let curingSpeed = 1

  if (temperature < 5) {
    qualityIndex -= 30
    curingSpeed *= 0.3
    suggestions.push('温度过低，油满固化极慢，建议加温或停工')
  } else if (temperature < 10) {
    qualityIndex -= 15
    curingSpeed *= 0.5
    suggestions.push('温度偏低，固化时间延长，注意防冻')
  } else if (temperature > 35) {
    qualityIndex -= 20
    curingSpeed *= 1.8
    suggestions.push('温度过高，表面易结皮开裂，建议早晚施工')
  } else if (temperature > 30) {
    qualityIndex -= 10
    curingSpeed *= 1.3
    suggestions.push('温度偏高，注意及时养护')
  }

  if (humidity < 30) {
    qualityIndex -= 15
    curingSpeed *= 1.2
    suggestions.push('湿度过低，灰层易干裂，需洒水养护')
  } else if (humidity > 85) {
    qualityIndex -= 25
    curingSpeed *= 0.4
    suggestions.push('湿度过高，油满难以固化，建议通风除湿')
  } else if (humidity > 75) {
    qualityIndex -= 10
    curingSpeed *= 0.7
    suggestions.push('湿度偏高，注意通风')
  }

  if (temperature >= 15 && temperature <= 25 && humidity >= 45 && humidity <= 65) {
    suggestions.push('温湿度条件理想，适合施工')
  }

  qualityIndex = Math.max(0, Math.min(100, qualityIndex))

  let riskLevel: 'low' | 'medium' | 'high' = 'low'
  if (qualityIndex < 60) riskLevel = 'high'
  else if (qualityIndex < 80) riskLevel = 'medium'

  return {
    qualityIndex: Math.round(qualityIndex),
    curingSpeed: Math.round(curingSpeed * 100) / 100,
    riskLevel,
    suggestions
  }
}

export function checkAllRisks(
  layers: AshLayer[],
  temperature: number,
  humidity: number
): RiskWarning[] {
  const warnings: RiskWarning[] = []

  const curingEffect = simulateCuringEffect(temperature, humidity)
  if (curingEffect.riskLevel !== 'low') {
    warnings.push({
      id: `env-${Date.now()}`,
      type: curingEffect.qualityIndex < 60 ? 'temperature' : 'humidity',
      level: curingEffect.riskLevel === 'high' ? 'high' : 'medium',
      message: `环境条件${curingEffect.riskLevel === 'high' ? '严重' : ''}影响固化质量，质量指数${curingEffect.qualityIndex}`,
      timestamp: new Date().toISOString()
    })
  }

  layers.forEach((layer, index) => {
    if (layer.actualRatio && layer.deviation) {
      if (Math.abs(layer.deviation.ash) > 10 || Math.abs(layer.deviation.lime) > 10) {
        warnings.push({
          id: `ratio-${layer.id}`,
          type: 'ratio_deviation',
          level: 'high',
          message: `${layer.name}灰料配比偏差过大（灰${layer.deviation.ash > 0 ? '+' : ''}${layer.deviation.ash}%，灰${layer.deviation.lime > 0 ? '+' : ''}${layer.deviation.lime}%）`,
          layerId: layer.id,
          timestamp: new Date().toISOString()
        })
      }
    }

    const dryTimeWarning = checkDryTimeConnection(layers, index)
    if (dryTimeWarning) {
      warnings.push(dryTimeWarning)
    }
  })

  return warnings
}

export function getDefaultParadigms(): DizhangParadigm[] {
  return Object.entries(GRADE_LAYER_CONFIG).map(([grade, config]) => {
    const gradeInfo = {
      yimawuhui: { name: '一麻五灰', desc: '传统最高等级做法，一麻五灰，质量最优' },
      ermawuhui: { name: '二麻五灰', desc: '二道麻线五灰，次高等级' },
      sansanbuhui: { name: '三麻三布灰', desc: '三道麻线三道布，适用于大构件' },
      yimabuhui: { name: '一麻布灰', desc: '一麻一布，中等做法' },
      yiwuhui: { name: '一五灰', desc: '五道灰无麻，简易做法' },
      shansanbuhui: { name: '单三布灰', desc: '单三遍布，简易做法' },
      sanhui: { name: '三灰', desc: '三道灰，最简易做法' }
    }[grade as DizhangGrade]

    const totalThickness = config.reduce((sum, l) => sum + l.thickness, 0)

    return {
      id: `paradigm-${grade}`,
      name: gradeInfo.name,
      grade: grade as DizhangGrade,
      gradeName: gradeInfo.name,
      description: gradeInfo.desc,
      suitableMaterials: ['pine', 'cypress', 'fir', 'elm', 'nanmu', 'hardwood'],
      suitableConditions: ['一般条件', '重要建筑', '大构件'],
      layers: config.map(c => ({
        type: c.type,
        name: c.name,
        order: c.order,
        thickness: c.thickness,
        ratio: c.ratio,
        dryTime: c.dryTime,
        notes: c.type === 'mabu' ? (c.mabuType === 'ma' ? '麻丝' : '麻布') : undefined
      })),
      mabuSpec: config.some(c => c.type === 'mabu') ? {
        type: config.find(c => c.type === 'mabu')?.mabuType || 'ma',
        width: config.find(c => c.type === 'mabu')?.mabuType === 'ma' ? 10 : 80,
        overlapRate: config.find(c => c.type === 'mabu')?.mabuType === 'ma' ? 30 : 12.5
      } : undefined,
      totalThickness,
      createdAt: new Date().toISOString(),
      isDefault: true
    }
  })
}

export function createProcessRecord(
  layer: AshLayer,
  temperature: number,
  humidity: number,
  operator?: string,
  notes?: string
): ProcessRecord {
  const ratio = layer.actualRatio || layer.targetRatio
  const inspectionResult = layer.hasDeviation ? 'warning' : 'pass'
  const { other, ...ratioWithoutOther } = ratio

  return {
    id: `record-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    layerId: layer.id,
    layerType: 'ash',
    layerName: layer.name,
    appliedAt: layer.appliedAt || new Date().toISOString(),
    operator: operator || layer.operator,
    designThickness: layer.designThickness,
    thickness: layer.thickness,
    ratio: { ...ratioWithoutOther },
    temperature,
    humidity,
    inspectionResult,
    notes: notes || layer.notes,
    deviation: layer.deviation
  }
}

export function createMabuProcessRecord(
  layer: MabuLayer,
  temperature: number,
  humidity: number,
  operator?: string,
  notes?: string
): ProcessRecord {
  return {
    id: `record-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    layerId: layer.id,
    layerType: 'mabu',
    layerName: layer.name,
    appliedAt: layer.appliedAt || new Date().toISOString(),
    operator: operator || layer.operator,
    thickness: 0,
    ratio: {
      幅宽: layer.width,
      搭接量: layer.overlap,
      用量: Math.round(layer.usage * 100) / 100
    },
    temperature: layer.temperature || temperature,
    humidity: layer.humidity || humidity,
    inspectionResult: 'pass',
    notes: notes || layer.notes,
    mabuArea: layer.area,
    mabuUsage: layer.usage,
    mabuOverlap: layer.overlap,
    mabuWidth: layer.width,
    mabuType: layer.type
  }
}

export type ReviewIssue = {
  id: string
  type: 'ash' | 'mabu' | 'material' | 'general'
  severity: 'error' | 'warning' | 'info'
  message: string
  layerId?: string
  layerName?: string
}

export function reviewArchive(archive: {
  records: ProcessRecord[]
  ashLayers: AshLayer[]
  mabuLayers: MabuLayer[]
  materialList: MaterialList
  component: { surfaceCondition?: SurfaceCondition }
}): ReviewIssue[] {
  const issues: ReviewIssue[] = []

  const ashRecords = archive.records.filter(r => r.layerType === 'ash')
  const mabuRecords = archive.records.filter(r => r.layerType === 'mabu')

  archive.ashLayers.forEach((layer, index) => {
    const record = ashRecords.find(r => r.layerId === layer.id)
    
    if (layer.appliedAt && !record) {
      issues.push({
        id: `ash-missing-record-${layer.id}`,
        type: 'ash',
        severity: 'error',
        message: `${layer.name}已施工但缺少施工记录`,
        layerId: layer.id,
        layerName: layer.name
      })
    }

    if (record && !record.operator) {
      issues.push({
        id: `ash-missing-operator-${layer.id}`,
        type: 'ash',
        severity: 'warning',
        message: `${layer.name}缺少施工人员记录`,
        layerId: layer.id,
        layerName: layer.name
      })
    }

    if (index > 0) {
      const prevLayer = archive.ashLayers[index - 1]
      if (layer.appliedAt && prevLayer.appliedAt && !prevLayer.isDry) {
        issues.push({
          id: `ash-dry-order-${layer.id}`,
          type: 'ash',
          severity: 'warning',
          message: `${prevLayer.name}未干燥即进行${layer.name}施工`,
          layerId: layer.id,
          layerName: layer.name
        })
      }
    }
  })

  archive.mabuLayers.forEach((layer) => {
    const record = mabuRecords.find(r => r.layerId === layer.id)
    
    if (layer.appliedAt && !record) {
      issues.push({
        id: `mabu-missing-record-${layer.id}`,
        type: 'mabu',
        severity: 'error',
        message: `${layer.name}已施工但缺少施工记录`,
        layerId: layer.id,
        layerName: layer.name
      })
    }

    if (record && !record.operator) {
      issues.push({
        id: `mabu-missing-operator-${layer.id}`,
        type: 'mabu',
        severity: 'warning',
        message: `${layer.name}缺少施工人员记录`,
        layerId: layer.id,
        layerName: layer.name
      })
    }

    if (record && record.mabuUsage !== undefined && Math.abs(record.mabuUsage - layer.usage) > 0.01) {
      issues.push({
        id: `mabu-usage-mismatch-${layer.id}`,
        type: 'mabu',
        severity: 'warning',
        message: `${layer.name}记录用量(${record.mabuUsage.toFixed(2)})与汇总用量(${layer.usage.toFixed(2)})不一致`,
        layerId: layer.id,
        layerName: layer.name
      })
    }
  })

  const totalMaFromLayers = archive.mabuLayers
    .filter(l => l.type === 'ma')
    .reduce((sum, l) => sum + l.usage, 0)
  const totalBuFromLayers = archive.mabuLayers
    .filter(l => l.type === 'bu')
    .reduce((sum, l) => sum + l.usage, 0)

  if (Math.abs(totalMaFromLayers - archive.materialList.ma) > 0.01) {
    issues.push({
      id: 'material-ma-mismatch',
      type: 'material',
      severity: 'error',
      message: `麻丝用量汇总不一致：各层合计${totalMaFromLayers.toFixed(2)}kg，材料汇总${archive.materialList.ma.toFixed(2)}kg`
    })
  }

  if (Math.abs(totalBuFromLayers - archive.materialList.bu) > 0.01) {
    issues.push({
      id: 'material-bu-mismatch',
      type: 'material',
      severity: 'error',
      message: `麻布用量汇总不一致：各层合计${totalBuFromLayers.toFixed(2)}㎡，材料汇总${archive.materialList.bu.toFixed(2)}㎡`
    })
  }

  if (issues.length === 0) {
    issues.push({
      id: 'all-good',
      type: 'general',
      severity: 'info',
      message: '档案数据完整，所有记录一致，复核通过'
    })
  }

  return issues
}
