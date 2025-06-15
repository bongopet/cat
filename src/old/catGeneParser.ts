/**
 * 猫咪基因解析工具
 * 用于解析和处理猫咪基因数据，生成外观和属性特征
 */

// 基因解析结果接口
export interface GeneParseResult {
  appearance: {
    baseColor: number
    furLength: number
    earShape: number
    eyeColor: number
    pattern: number
  }
  attributes: {
    personality: number
    rarity: number
    growthPotential: number
    staminaRecovery: number
    luck: number
  }
  specialAbilities: {
    abilities: number
    hiddenTrait: boolean
  }
}

// 猫咪外观样式接口
export interface CatAppearance {
  colors: {
    body1: string
    body2: string
    ear: string
    stroke: string
  }
  ears: {
    left: string
    right: string
    leftInner: string
    rightInner: string
  }
  eyes: {
    leftColor: string
    rightColor: string
  }
  fur: {
    type: string
    strokeWidth: number
  }
  pattern: {
    type: number
    hasPattern: boolean
  }
}

// 猫咪基因详情接口
export interface CatGeneDetails {
  baseColor: string
  furLength: string
  earShape: string
  eyeColor: string
  pattern: string
  personality: string
  rarity: string
  growthPotential: string
  staminaRecovery: string
  luck: string
  specialAbilities: string[]
  hiddenTrait: boolean
  rawGene: GeneParseResult
}

/**
 * 基因解析函数 - 将基因值解析为各种特征
 * @param gene 基因值
 * @returns 解析后的基因特征
 */
export function parseGene(gene: number): GeneParseResult {
  // 1. 外观部分 - 位操作提取
  const appearance = {
    // 基础颜色 (当前已实现的模7算法)
    baseColor: gene % 7,

    // 毛发长度 (0-3: 短毛、中毛、长毛、卷毛)
    furLength: (gene >> 4) & 0x3,

    // 耳朵形状 (0-3: 正常、下折、上折、圆形)
    earShape: (gene >> 6) & 0x3,

    // 眼睛颜色 (0-7: 不同的眼睛颜色)
    eyeColor: (gene >> 8) & 0x7,

    // 特殊标记 (0-15: 多种图案，如斑点、条纹等)
    pattern: (gene >> 11) & 0xF,
  }

  // 2. 属性部分 - 使用基因的不同位段
  const attributes = {
    // 性格倾向 (0-7: 活泼、温顺、好奇、独立、谨慎、勇敢、调皮、高冷)
    personality: (gene >> 15) & 0x7,

    // 稀有度 (0-15: 普通、少见、罕见、稀有、超稀有...)
    rarity: (gene >> 18) & 0xF,

    // 成长潜力系数 (50-150之间的值，影响经验获取速率)
    growthPotential: 50 + ((gene >> 22) & 0x3F) * 100 / 63,

    // 体力恢复速率 (0.5-1.5倍)
    staminaRecovery: 0.5 + ((gene >> 28) & 0x7) / 10,

    // 幸运值 (1-10: 影响检查事件触发概率)
    luck: 1 + ((gene >> 31) & 0x9),
  }

  // 3. 特殊能力部分 - 使用基因的高位部分
  const specialAbilities = {
    // 特殊能力解锁 (每个位代表一种特殊能力)
    abilities: (gene >> 40) & 0xFF,

    // 隐藏特质 (非常罕见的属性组合)
    hiddenTrait: ((gene >> 48) & 0xFFFF) === 0x1234,
  }

  return {
    appearance,
    attributes,
    specialAbilities,
  }
}

/**
 * 获取颜色名称
 * @param colorIndex 颜色索引
 * @returns 颜色名称
 */
export function getColorName(colorIndex: number): string {
  const colorNames = [
    '橙色系',
    '灰色系',
    '棕色系',
    '白色系',
    '黄色系',
    '黑色系',
    '蓝灰系',
  ]
  return colorNames[colorIndex]
}

/**
 * 获取毛发长度名称
 * @param furLengthIndex 毛发长度索引
 * @returns 毛发长度名称
 */
export function getFurLengthName(furLengthIndex: number): string {
  const furLengthNames = ['短毛', '中等长度', '长毛', '卷毛']
  return furLengthNames[furLengthIndex]
}

/**
 * 获取耳朵形状名称
 * @param earShapeIndex 耳朵形状索引
 * @returns 耳朵形状名称
 */
export function getEarShapeName(earShapeIndex: number): string {
  const earShapeNames = ['正常', '下折', '上折', '圆形']
  return earShapeNames[earShapeIndex]
}

/**
 * 获取眼睛颜色名称
 * @param eyeColorIndex 眼睛颜色索引
 * @returns 眼睛颜色名称
 */
export function getEyeColorName(eyeColorIndex: number): string {
  const eyeColorNames = ['绿色', '蓝色', '黄色', '棕色', '琥珀色', '异色', '灰色', '紫色']
  return eyeColorNames[eyeColorIndex]
}

/**
 * 获取花纹名称
 * @param patternIndex 花纹索引
 * @returns 花纹名称
 */
export function getPatternName(patternIndex: number): string {
  const patternNames = [
    '无花纹',
    '虎斑',
    '斑点',
    '双色',
    '三色',
    '玳瑁',
    '重点色',
    '烟色',
    '银色',
    '云纹',
    '大理石纹',
    '环纹',
    '扁平面纹',
    '条形',
    '单色',
    '特殊图案',
  ]
  return patternNames[patternIndex]
}

/**
 * 获取性格名称
 * @param personalityIndex 性格索引
 * @returns 性格名称
 */
export function getPersonalityName(personalityIndex: number): string {
  const personalityNames = ['活泼', '温顺', '好奇', '独立', '谨慎', '勇敢', '调皮', '高冷']
  return `${personalityNames[personalityIndex]}型`
}

/**
 * 获取稀有度名称
 * @param rarityIndex 稀有度索引
 * @returns 稀有度名称
 */
export function getRarityName(rarityIndex: number): string {
  const rarityNames = [
    '普通',
    '常见',
    '少见',
    '有趣',
    '不寻常',
    '稀有',
    '罕见',
    '珍奇',
    '非常稀有',
    '超稀有',
    '传奇',
    '神话',
    '史诗',
    '独特',
    '限量',
    '绝版',
  ]
  return rarityNames[rarityIndex]
}

/**
 * 获取成长潜力描述
 * @param value 成长潜力值
 * @returns 成长潜力描述
 */
export function getGrowthPotentialDesc(value: number): string {
  let level = ''
  if (value < 70) level = '低'
  else if (value < 100) level = '中'
  else if (value < 120) level = '高'
  else level = '极高'

  return `${Math.round(value)}% (${level})`
}

/**
 * 获取特殊能力列表
 * @param abilities 能力位图
 * @returns 特殊能力名称数组
 */
export function getSpecialAbilities(abilities: number): string[] {
  const allAbilities = [
    '额外经验获取',
    '快速恢复',
    '幸运猫爪',
    '双倍奖励',
    '稀有物品探测',
    '降低消耗',
    '连击技能',
    '隐藏宝藏',
  ]

  const result: string[] = []
  for (let i = 0; i < 8; i++) {
    if ((abilities & (1 << i)) !== 0) {
      result.push(allAbilities[i])
    }
  }

  return result
}

/**
 * 获取猫咪基因详情
 * @param gene 基因值
 * @returns 猫咪基因详情
 */
export function getCatGeneDetails(gene: number): CatGeneDetails {
  const parsedGene = parseGene(gene)

  return {
    // 外观特征
    baseColor: getColorName(parsedGene.appearance.baseColor),
    furLength: getFurLengthName(parsedGene.appearance.furLength),
    earShape: getEarShapeName(parsedGene.appearance.earShape),
    eyeColor: getEyeColorName(parsedGene.appearance.eyeColor),
    pattern: getPatternName(parsedGene.appearance.pattern),

    // 性格与能力
    personality: getPersonalityName(parsedGene.attributes.personality),
    rarity: getRarityName(parsedGene.attributes.rarity),
    growthPotential: getGrowthPotentialDesc(parsedGene.attributes.growthPotential),
    staminaRecovery: `${parsedGene.attributes.staminaRecovery.toFixed(1)}x`,
    luck: parsedGene.attributes.luck.toFixed(0),

    // 特殊能力
    specialAbilities: getSpecialAbilities(parsedGene.specialAbilities.abilities),
    hiddenTrait: parsedGene.specialAbilities.hiddenTrait,

    // 原始解析数据
    rawGene: parsedGene,
  }
}

/**
 * 获取猫咪外观样式
 * @param gene 基因值
 * @returns 猫咪外观样式
 */
export function getCatAppearanceStyle(gene: number): CatAppearance {
  const parsedGene = parseGene(gene)

  // 基础颜色
  const baseColorIndex = parsedGene.appearance.baseColor
  const colorSchemes = [
    { // 橙色系
      body1: '#ffb84d',
      body2: '#e67700',
      ear: '#ffb380',
      stroke: '#e09112',
    },
    { // 灰色系
      body1: '#b3b3cc',
      body2: '#666699',
      ear: '#d1d1e0',
      stroke: '#666699',
    },
    { // 棕色系
      body1: '#bf8040',
      body2: '#734d26',
      ear: '#d2a679',
      stroke: '#734d26',
    },
    { // 白色系
      body1: '#ffffff',
      body2: '#e6e6e6',
      ear: '#f2f2f2',
      stroke: '#cccccc',
    },
    { // 黄色系
      body1: '#ffff99',
      body2: '#e6e600',
      ear: '#ffffb3',
      stroke: '#e6e600',
    },
    { // 黑色系
      body1: '#666666',
      body2: '#1a1a1a',
      ear: '#808080',
      stroke: '#333333',
    },
    { // 蓝灰系
      body1: '#99ccff',
      body2: '#3399ff',
      ear: '#cce6ff',
      stroke: '#3399ff',
    },
  ]
  const colorScheme = colorSchemes[baseColorIndex]

  // 耳朵形状
  const earShapeIndex = parsedGene.appearance.earShape
  const earShapes = [
    { // 正常
      left: 'M65,35 L60,10 Q75,15 85,30',
      right: 'M115,35 L120,10 Q105,15 95,30',
      leftInner: 'M67,30 L65,15 Q75,20 80,28',
      rightInner: 'M113,30 L115,15 Q105,20 100,28',
    },
    { // 下折
      left: 'M65,35 L60,20 Q65,10 75,15 Q80,25 85,30',
      right: 'M115,35 L120,20 Q115,10 105,15 Q100,25 95,30',
      leftInner: 'M67,30 L65,20 Q70,15 75,18 Q78,25 80,28',
      rightInner: 'M113,30 L115,20 Q110,15 105,18 Q102,25 100,28',
    },
    { // 上折
      left: 'M65,35 L55,15 Q65,5 75,10 Q80,20 85,30',
      right: 'M115,35 L125,15 Q115,5 105,10 Q100,20 95,30',
      leftInner: 'M67,30 L60,18 Q65,10 72,13 Q76,20 80,28',
      rightInner: 'M113,30 L120,18 Q115,10 108,13 Q104,20 100,28',
    },
    { // 圆形
      left: 'M65,35 Q55,20 60,10 Q70,5 80,15 Q85,25 85,30',
      right: 'M115,35 Q125,20 120,10 Q110,5 100,15 Q95,25 95,30',
      leftInner: 'M67,30 Q60,20 62,15 Q70,10 75,18 Q78,25 80,28',
      rightInner: 'M113,30 Q120,20 118,15 Q110,10 105,18 Q102,25 100,28',
    },
  ]
  const earShape = earShapes[earShapeIndex]

  // 眼睛颜色
  const eyeColorIndex = parsedGene.appearance.eyeColor
  const eyeColors = [
    '#4CAF50', // 绿色
    '#2196F3', // 蓝色
    '#FFEB3B', // 黄色
    '#795548', // 棕色
    '#FF9800', // 琥珀色
    '#9C27B0', // 紫色 (异色瞳时左眼)
    '#607D8B', // 灰色
    '#673AB7', // 紫色
  ]
  // 异色瞳特殊处理
  const leftEyeColor = eyeColorIndex === 5 ? eyeColors[5] : eyeColors[eyeColorIndex]
  const rightEyeColor = eyeColorIndex === 5 ? eyeColors[0] : eyeColors[eyeColorIndex]

  // 毛发长度
  const furLengthIndex = parsedGene.appearance.furLength
  // 0-短毛，1-中毛，2-长毛，3-卷毛
  const furLength = ['short', 'medium', 'long', 'curly'][furLengthIndex]

  // 花纹
  const patternIndex = parsedGene.appearance.pattern
  // 花纹样式，0表示无花纹
  const hasPattern = patternIndex > 0

  return {
    colors: colorScheme,
    ears: earShape,
    eyes: {
      leftColor: leftEyeColor,
      rightColor: rightEyeColor,
    },
    fur: {
      type: furLength,
      strokeWidth: furLengthIndex === 0
        ? 1.5
        : furLengthIndex === 1
          ? 2
          : furLengthIndex === 2 ? 2.5 : 3,
    },
    pattern: {
      type: patternIndex,
      hasPattern,
    },
  }
}

/**
 * 获取猫咪颜色CSS类
 * @param gene 基因值
 * @returns CSS类名
 */
export function getCatColorClass(gene: number): string {
  const parsedGene = parseGene(gene)
  const baseColorIndex = parsedGene.appearance.baseColor
  const colors = [
    'bg-orange-500',
    'bg-blue-400',
    'bg-yellow-500',
    'bg-purple-400',
    'bg-green-500',
    'bg-red-400',
    'bg-indigo-500',
  ]
  return colors[baseColorIndex]
}
