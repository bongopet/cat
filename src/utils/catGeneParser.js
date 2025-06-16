/**
 * Cat Gene Parser - JavaScript Version
 * Based on the TypeScript implementation
 */

import { calculateRarityWithStrategy, RARITY_STRATEGIES } from './rarityController.js';

/**
 * Calculate rarity from gene using configurable probability distribution
 * @param {BigInt} geneBigInt - The cat gene value as BigInt
 * @param {string} strategy - Rarity distribution strategy
 * @returns {number} - Rarity index (0-15)
 */
function calculateRarityFromGene(geneBigInt, strategy = RARITY_STRATEGIES.REALISTIC) {
  return calculateRarityWithStrategy(geneBigInt, strategy);
}

/**
 * Parse gene into appearance and attributes
 * @param {number|string|BigInt} gene - The cat gene value
 * @returns {object} - Parsed gene features
 */
export function parseGene(gene) {
  // 使用 BigInt 处理大整数
  try {
    // 将输入转换为 BigInt
    const geneBigInt = typeof gene === 'bigint' ? gene : BigInt(gene || 0);
    // console.log('parseGene - 原始基因值:', gene, '类型:', typeof gene);
    // console.log('parseGene - BigInt转换后:', geneBigInt.toString(), '类型:', typeof geneBigInt);
    
    // 使用基因值的字符串表示来增加随机性
    const geneStr = geneBigInt.toString();
    const geneLength = geneStr.length;
    //console.log('parseGene - 基因字符串:', geneStr, '长度:', geneLength);
    
    // 使用字符串的不同部分来提取特征
    // 这样即使两个基因值在位运算后的结果相同，它们的字符串表示也可能不同
    const strFeature1 = geneLength > 2 ? parseInt(geneStr.charAt(geneLength - 1)) : 0;
    const strFeature2 = geneLength > 3 ? parseInt(geneStr.charAt(geneLength - 2)) : 0;
    const strFeature3 = geneLength > 4 ? parseInt(geneStr.charAt(geneLength - 3)) : 0;
    
    // 使用基因值的不同部分来确保不同的基因产生不同的外观
    // 1. Appearance part - using bit operations with BigInt
    const appearance = {
      // Base color (0-6: different color schemes)
      baseColor: Number(geneBigInt % 7n),

      // Fur length (0-3: short, medium, long, curly)
      furLength: Number((geneBigInt >> 4n) & 0x3n),

      // Ear shape (0-3: normal, folded down, folded up, round)
      earShape: Number((geneBigInt >> 6n) & 0x3n),

      // Eye color (0-7: different eye colors)
      eyeColor: Number((geneBigInt >> 8n) & 0x7n),

      // Pattern (0-15: various patterns like spots, stripes)
      pattern: Number((geneBigInt >> 11n) & 0xFn),
      
      // 额外的特征，用于增加随机性
      extraFeature1: Number((geneBigInt >> 15n) & 0xFFn),
      extraFeature2: Number((geneBigInt >> 23n) & 0xFFn),
      
      // 使用基因字符串的不同部分来提取额外特征
      strFeature1,
      strFeature2,
      strFeature3,
      
      // 使用基因值的高位来提取额外特征
      highFeature1: Number((geneBigInt >> 31n) & 0xFFn),
      highFeature2: Number((geneBigInt >> 39n) & 0xFFn),
      
      // 使用基因值的最高位来提取额外特征
      topFeature: Number((geneBigInt >> 47n) & 0xFFn),
    };
    
    // console.log('parseGene - 解析后的外观:', appearance);

    // 2. Attributes part - using different bit segments with BigInt
    const attributes = {
      // Personality (0-7: playful, gentle, curious, independent, cautious, brave, mischievous, aloof)
      personality: Number((geneBigInt >> 15n) & 0x7n),

      // Rarity (0-15: common, uncommon, rare, super rare...)
      rarity: calculateRarityFromGene(geneBigInt),

      // Growth potential (50-150 value, affects XP gain rate)
      growthPotential: 50 + (Number((geneBigInt >> 22n) & 0x3Fn) * 100 / 63),

      // Stamina recovery rate (0.5-1.5x)
      staminaRecovery: 0.5 + (Number((geneBigInt >> 28n) & 0x7n) / 10),

      // Luck (1-10: affects check event trigger probability)
      luck: 1 + Number((geneBigInt >> 31n) & 0x9n),
    };

    // 3. Special abilities - using high bits with BigInt
    const specialAbilities = {
      // Special abilities unlocked (each bit represents an ability)
      abilities: Number((geneBigInt >> 40n) & 0xFFn),

      // Hidden trait (very rare attribute combination)
      hiddenTrait: ((geneBigInt >> 48n) & 0xFFFFn) === 0x1234n,
    };
    
    return {
      appearance,
      attributes,
      specialAbilities,
    };
  } catch (error) {
    console.error('Error parsing gene:', error);
    // 如果发生错误，返回默认值
    return {
      appearance: {
        baseColor: 0,
        furLength: 0,
        earShape: 0,
        eyeColor: 0,
        pattern: 0,
        extraFeature1: 0,
        extraFeature2: 0,
        strFeature1: 0,
        strFeature2: 0,
        strFeature3: 0,
        highFeature1: 0,
        highFeature2: 0,
        topFeature: 0,
      },
      attributes: {
        personality: 0,
        rarity: 0,
        growthPotential: 50,
        staminaRecovery: 0.5,
        luck: 1,
      },
      specialAbilities: {
        abilities: 0,
        hiddenTrait: false,
      },
    };
  }
}

/**
 * Get color name
 * @param {number|string|BigInt} gene - Gene value
 * @returns {string} - Color name
 */
export function getColorName(gene) {
  try {
    const geneBigInt = typeof gene === 'bigint' ? gene : BigInt(gene || 0);
    const parsedGene = parseGene(geneBigInt);
    
    const baseColorIndex = parsedGene.appearance.baseColor;
    const patternFactor = parsedGene.appearance.pattern % 4;
    const furFactor = parsedGene.appearance.furLength;
    const extraFactor1 = parsedGene.appearance.extraFeature1 % 4;
    const extraFactor2 = parsedGene.appearance.extraFeature2 % 4;
    
    // 使用字符串特征和高位特征
    const strFactor1 = parsedGene.appearance.strFeature1 % 4;
    const strFactor2 = parsedGene.appearance.strFeature2 % 4;
    const strFactor3 = parsedGene.appearance.strFeature3 % 4;
    const highFactor1 = parsedGene.appearance.highFeature1 % 4;
    const highFactor2 = parsedGene.appearance.highFeature2 % 4;
    const topFactor = parsedGene.appearance.topFeature % 4;
    
    // 使用与 getCatAppearanceStyle 相同的逻辑计算颜色索引
    const colorIndex = (
      baseColorIndex * 16 + 
      patternFactor * 4 + 
      furFactor + 
      extraFactor1 + 
      extraFactor2 +
      strFactor1 * 2 +
      strFactor2 * 3 +
      strFactor3 * 5 +
      highFactor1 * 7 +
      highFactor2 * 11 +
      topFactor * 13
    ) % 16;
    
    // 扩展颜色名称数组，与 colorSchemes 对应
    const colorNames = [
      // 原始颜色
      'Orange',
      'Grey',
      'Brown',
      'White',
      'Yellow',
      'Black',
      'Blue-Grey',
      // 新增颜色
      'Pink',
      'Cream',
      'Lilac',
      'Cinnamon',
      'Silver',
      'Fawn',
      'Green',
      'Blue',
      'Purple',
    ];
    
    return colorNames[colorIndex] || 'Unknown';
  } catch (error) {
    console.error('getColorName 错误:', error);
    return 'Unknown';
  }
}

/**
 * Get fur length name
 * @param {number} furLengthIndex - Fur length index
 * @returns {string} - Fur length name
 */
export function getFurLengthName(furLengthIndex) {
  const furLengthNames = ['Short', 'Medium', 'Long', 'Curly'];
  return furLengthNames[furLengthIndex] || 'Unknown';
}

/**
 * Get ear shape name
 * @param {number} earShapeIndex - Ear shape index
 * @returns {string} - Ear shape name
 */
export function getEarShapeName(earShapeIndex) {
  const earShapeNames = ['Normal', 'Folded Down', 'Folded Up', 'Round'];
  return earShapeNames[earShapeIndex] || 'Unknown';
}

/**
 * Get eye color name
 * @param {number} eyeColorIndex - Eye color index
 * @returns {string} - Eye color name
 */
export function getEyeColorName(eyeColorIndex) {
  const eyeColorNames = ['Green', 'Blue', 'Yellow', 'Brown', 'Amber', 'Odd-eyed', 'Grey', 'Purple'];
  return eyeColorNames[eyeColorIndex] || 'Unknown';
}

/**
 * Get pattern name
 * @param {number} patternIndex - Pattern index
 * @returns {string} - Pattern name
 */
export function getPatternName(patternIndex) {
  const patternNames = [
    'Solid',
    'Tabby',
    'Spotted',
    'Bi-color',
    'Tri-color',
    'Tortoiseshell',
    'Colorpoint',
    'Smoke',
    'Silver',
    'Clouded',
    'Marble',
    'Ringed',
    'Flat-patterned',
    'Striped',
    'Single-colored',
    'Special',
  ];
  return patternNames[patternIndex] || 'Unknown';
}

/**
 * Get personality name
 * @param {number} personalityIndex - Personality index
 * @returns {string} - Personality name
 */
export function getPersonalityName(personalityIndex) {
  const personalityNames = ['Playful', 'Gentle', 'Curious', 'Independent', 'Cautious', 'Brave', 'Mischievous', 'Aloof'];
  return `${personalityNames[personalityIndex] || 'Unknown'} Type`;
}

/**
 * Get rarity name
 * @param {number} rarityIndex - Rarity index
 * @returns {string} - Rarity name
 */
/**
 * Get rarity configuration with probability and color
 * @param {number} rarityIndex - Rarity index
 * @returns {object} - Rarity configuration
 */
export function getRarityConfig(rarityIndex) {
  const rarityConfigs = [
    { name: 'Common', probability: 30.0, color: '#9E9E9E', tier: 'common' },
    { name: 'Ordinary', probability: 20.0, color: '#8BC34A', tier: 'common' },
    { name: 'Uncommon', probability: 15.0, color: '#4CAF50', tier: 'uncommon' },
    { name: 'Interesting', probability: 10.0, color: '#2196F3', tier: 'uncommon' },
    { name: 'Unusual', probability: 7.0, color: '#03A9F4', tier: 'rare' },
    { name: 'Rare', probability: 5.0, color: '#9C27B0', tier: 'rare' },
    { name: 'Scarce', probability: 4.0, color: '#673AB7', tier: 'rare' },
    { name: 'Curious', probability: 3.0, color: '#3F51B5', tier: 'epic' },
    { name: 'Very Rare', probability: 2.5, color: '#FF9800', tier: 'epic' },
    { name: 'Ultra Rare', probability: 1.5, color: '#FF5722', tier: 'epic' },
    { name: 'Legendary', probability: 1.0, color: '#F44336', tier: 'legendary' },
    { name: 'Mythical', probability: 0.5, color: '#E91E63', tier: 'legendary' },
    { name: 'Epic', probability: 0.3, color: '#9C27B0', tier: 'legendary' },
    { name: 'Unique', probability: 0.1, color: '#FFD700', tier: 'mythical' },
    { name: 'Limited', probability: 0.05, color: '#FF6B35', tier: 'mythical' },
    { name: 'Exclusive', probability: 0.05, color: '#FF1744', tier: 'mythical' },
  ];

  return rarityConfigs[rarityIndex] || { name: 'Unknown', probability: 0, color: '#000000', tier: 'unknown' };
}

export function getRarityName(rarityIndex) {
  return getRarityConfig(rarityIndex).name;
}

/**
 * Get growth potential description
 * @param {number} value - Growth potential value
 * @returns {string} - Growth potential description
 */
export function getGrowthPotentialDesc(value) {
  let level = '';
  if (value < 70) level = 'Low';
  else if (value < 100) level = 'Medium';
  else if (value < 120) level = 'High';
  else level = 'Very High';

  return `${Math.round(value)}% (${level})`;
}

/**
 * Get special abilities list
 * @param {number} abilities - Abilities bitmap
 * @returns {string[]} - Special abilities names array
 */
export function getSpecialAbilities(abilities) {
  const allAbilities = [
    'Extra XP Gain',
    'Quick Recovery',
    'Lucky Paws',
    'Double Rewards',
    'Rare Item Detection',
    'Reduced Consumption',
    'Combo Skills',
    'Hidden Treasure',
  ];

  const result = [];
  for (let i = 0; i < 8; i++) {
    if ((abilities & (1 << i)) !== 0) {
      result.push(allAbilities[i]);
    }
  }

  return result;
}

/**
 * Get cat gene details
 * @param {number} gene - Gene value
 * @returns {object} - Cat gene details
 */
export function getCatGeneDetails(gene) {
  const parsedGene = parseGene(gene);
  const appearance = getCatAppearanceStyle(gene);
  
  return {
    // Appearance
    baseColor: getColorName(gene),
    furLength: getFurLengthName(parsedGene.appearance.furLength),
    earShape: getEarShapeName(parsedGene.appearance.earShape),
    eyeColor: appearance.eyeColorName,
    pattern: getPatternName(parsedGene.appearance.pattern),

    // Personality and abilities
    personality: getPersonalityName(parsedGene.attributes.personality),
    rarity: getRarityName(parsedGene.attributes.rarity),
    growthPotential: getGrowthPotentialDesc(parsedGene.attributes.growthPotential),
    staminaRecovery: `${parsedGene.attributes.staminaRecovery.toFixed(1)}x`,
    luck: parsedGene.attributes.luck.toFixed(0),

    // Special abilities
    specialAbilities: getSpecialAbilities(parsedGene.specialAbilities.abilities),
    hiddenTrait: parsedGene.specialAbilities.hiddenTrait,

    // Raw parsed gene
    rawGene: parsedGene,
  };
}

/**
 * Get cat appearance style based on genes
 * @param {number|string|BigInt} gene - Gene value
 * @returns {object} - Cat appearance styles
 */
export function getCatAppearanceStyle(gene) {
  try {
    // 使用 BigInt 处理大整数
    const geneBigInt = typeof gene === 'bigint' ? gene : BigInt(gene || 0);
    //  console.log('getCatAppearanceStyle - 原始基因值:', gene, '类型:', typeof gene);
    // console.log('getCatAppearanceStyle - BigInt转换后:', geneBigInt.toString(), '类型:', typeof geneBigInt);
    
    const parsedGene = parseGene(geneBigInt);
    
    // console.log('getCatAppearanceStyle - 解析后的基因:', parsedGene);
    
    // 使用更多的基因位来决定基本颜色
    // 将原来的 baseColor 和其他特征组合起来，生成更多样化的颜色索引
    const baseColorIndex = parsedGene.appearance.baseColor;
    const patternFactor = parsedGene.appearance.pattern % 4; // 使用模式特征的部分信息
    const furFactor = parsedGene.appearance.furLength; // 使用毛发长度信息
    const extraFactor1 = parsedGene.appearance.extraFeature1 % 4; // 使用额外特征1
    const extraFactor2 = parsedGene.appearance.extraFeature2 % 4; // 使用额外特征2
    
    // 使用字符串特征和高位特征
    const strFactor1 = parsedGene.appearance.strFeature1 % 4;
    const strFactor2 = parsedGene.appearance.strFeature2 % 4;
    const strFactor3 = parsedGene.appearance.strFeature3 % 4;
    const highFactor1 = parsedGene.appearance.highFeature1 % 4;
    const highFactor2 = parsedGene.appearance.highFeature2 % 4;
    const topFactor = parsedGene.appearance.topFeature % 4;
    
    // 组合多个特征生成更多样化的颜色索引
    // 使用不同的组合方式，确保不同的基因值产生不同的外观
    // 将字符串特征和高位特征也纳入计算
    const colorIndex = (
      baseColorIndex * 16 + 
      patternFactor * 4 + 
      furFactor + 
      extraFactor1 + 
      extraFactor2 +
      strFactor1 * 2 +
      strFactor2 * 3 +
      strFactor3 * 5 +
      highFactor1 * 7 +
      highFactor2 * 11 +
      topFactor * 13
    ) % 16;
    
    console.log(`getCatAppearanceStyle - 颜色计算: baseColorIndex=${baseColorIndex}, patternFactor=${patternFactor}, furFactor=${furFactor}, extraFactor1=${extraFactor1}, extraFactor2=${extraFactor2}, strFactor1=${strFactor1}, strFactor2=${strFactor2}, strFactor3=${strFactor3}, highFactor1=${highFactor1}, highFactor2=${highFactor2}, topFactor=${topFactor}, colorIndex=${colorIndex}`);
    
    // 输出更详细的计算过程
    console.log(`getCatAppearanceStyle - 颜色索引计算: (${baseColorIndex}*16 + ${patternFactor}*4 + ${furFactor} + ${extraFactor1} + ${extraFactor2} + ${strFactor1}*2 + ${strFactor2}*3 + ${strFactor3}*5 + ${highFactor1}*7 + ${highFactor2}*11 + ${topFactor}*13) % 16 = ${colorIndex}`);
    
    const colorSchemes = [
      // 原始颜色
      { // Orange
        body1: '#ffb84d',
        body2: '#e67700',
        ear: '#ffb380',
        stroke: '#e09112',
      },
      { // Grey
        body1: '#b3b3cc',
        body2: '#666699',
        ear: '#d1d1e0',
        stroke: '#666699',
      },
      { // Brown
        body1: '#bf8040',
        body2: '#734d26',
        ear: '#d2a679',
        stroke: '#734d26',
      },
      { // White
        body1: '#ffffff',
        body2: '#e6e6e6',
        ear: '#f2f2f2',
        stroke: '#cccccc',
      },
      { // Yellow
        body1: '#ffff99',
        body2: '#e6e600',
        ear: '#ffffb3',
        stroke: '#e6e600',
      },
      { // Black
        body1: '#666666',
        body2: '#1a1a1a',
        ear: '#808080',
        stroke: '#333333',
      },
      { // Blue-Grey
        body1: '#99ccff',
        body2: '#3399ff',
        ear: '#cce6ff',
        stroke: '#3399ff',
      },
      // 新增颜色
      { // Pink
        body1: '#ffb6c1',
        body2: '#ff69b4',
        ear: '#ffc0cb',
        stroke: '#ff1493',
      },
      { // Cream
        body1: '#fff8dc',
        body2: '#f5deb3',
        ear: '#fffacd',
        stroke: '#daa520',
      },
      { // Lilac
        body1: '#e6e6fa',
        body2: '#d8bfd8',
        ear: '#f0f8ff',
        stroke: '#9370db',
      },
      { // Cinnamon
        body1: '#d2691e',
        body2: '#8b4513',
        ear: '#deb887',
        stroke: '#a0522d',
      },
      { // Silver
        body1: '#c0c0c0',
        body2: '#a9a9a9',
        ear: '#d3d3d3',
        stroke: '#808080',
      },
      { // Fawn
        body1: '#e5aa70',
        body2: '#cd853f',
        ear: '#f5deb3',
        stroke: '#b8860b',
      },
      { // Green
        body1: '#90ee90',
        body2: '#32cd32',
        ear: '#98fb98',
        stroke: '#006400',
      },
      { // Blue
        body1: '#87ceeb',
        body2: '#4169e1',
        ear: '#add8e6',
        stroke: '#0000cd',
      },
      { // Purple
        body1: '#dda0dd',
        body2: '#9932cc',
        ear: '#e6e6fa',
        stroke: '#800080',
      },
    ];
    
    // 使用组合后的索引获取颜色方案
    const colorScheme = colorSchemes[colorIndex];

    // Ear shape
    const earShapeIndex = parsedGene.appearance.earShape;
    const earShapes = [
      { // Normal
        left: 'M65,35 L60,10 Q75,15 85,30',
        right: 'M115,35 L120,10 Q105,15 95,30',
        leftInner: 'M67,30 L65,15 Q75,20 80,28',
        rightInner: 'M113,30 L115,15 Q105,20 100,28',
      },
      { // Folded Down
        left: 'M65,35 L60,20 Q65,10 75,15 Q80,25 85,30',
        right: 'M115,35 L120,20 Q115,10 105,15 Q100,25 95,30',
        leftInner: 'M67,30 L65,20 Q70,15 75,18 Q78,25 80,28',
        rightInner: 'M113,30 L115,20 Q110,15 105,18 Q102,25 100,28',
      },
      { // Folded Up
        left: 'M65,35 L55,15 Q65,5 75,10 Q80,20 85,30',
        right: 'M115,35 L125,15 Q115,5 105,10 Q100,20 95,30',
        leftInner: 'M67,30 L60,18 Q65,10 72,13 Q76,20 80,28',
        rightInner: 'M113,30 L120,18 Q115,10 108,13 Q104,20 100,28',
      },
      { // Round
        left: 'M65,35 Q55,20 60,10 Q70,5 80,15 Q85,25 85,30',
        right: 'M115,35 Q125,20 120,10 Q110,5 100,15 Q95,25 95,30',
        leftInner: 'M67,30 Q60,20 62,15 Q70,10 75,18 Q78,25 80,28',
        rightInner: 'M113,30 Q120,20 118,15 Q110,10 105,18 Q102,25 100,28',
      },
    ];
    // 使用模运算确保索引在有效范围内
    const safeEarShapeIndex = earShapeIndex % earShapes.length;
    const earShape = earShapes[safeEarShapeIndex];

    // Eye color - 使用额外特征来增加眼睛颜色的多样性
    // 使用字符串特征和高位特征来计算眼睛颜色
    const eyeColorIndex = (
      parsedGene.appearance.eyeColor + 
      extraFactor1 + 
      strFactor1 * 2 + 
      highFactor1 * 3
    ) % 8;
    
    const eyeColors = [
      '#4CAF50', // Green
      '#2196F3', // Blue
      '#FFEB3B', // Yellow
      '#795548', // Brown
      '#FF9800', // Amber
      '#9C27B0', // Purple (for odd-eyed left eye)
      '#607D8B', // Grey
      '#673AB7', // Purple
    ];
    
    // 使用模运算确保索引在有效范围内
    const safeEyeColorIndex = eyeColorIndex % eyeColors.length;
    
    // 获取眼睛颜色名称
    const eyeColorName = getEyeColorName(safeEyeColorIndex);
    
    // Special handling for odd-eyed cats - 使用额外特征2和字符串特征来决定是否为异瞳猫
    const isOddEyed = (extraFactor2 + strFactor2 + highFactor2) % 4 === 3; // 25%的概率为异瞳猫
    const leftEyeColor = isOddEyed ? eyeColors[5] : eyeColors[safeEyeColorIndex];
    const rightEyeColor = isOddEyed ? eyeColors[0] : eyeColors[safeEyeColorIndex];

    // Fur length
    const furLengthIndex = parsedGene.appearance.furLength;
    const furTypes = ['short', 'medium', 'long', 'curly'];
    // 使用模运算确保索引在有效范围内
    const safeFurLengthIndex = furLengthIndex % furTypes.length;
    const furType = furTypes[safeFurLengthIndex];

    // Pattern - 使用额外特征和字符串特征来增加图案的多样性
    const patternIndex = (
      parsedGene.appearance.pattern + 
      extraFactor1 + 
      extraFactor2 + 
      strFactor1 + 
      strFactor2 + 
      strFactor3 + 
      highFactor1
    ) % 16;
    
    const hasPattern = patternIndex > 0;

    return {
      colors: colorScheme,
      ears: earShape,
      eyes: {
        leftColor: leftEyeColor,
        rightColor: rightEyeColor,
      },
      fur: {
        type: furType,
        strokeWidth: safeFurLengthIndex === 0
          ? 1.5
          : safeFurLengthIndex === 1
            ? 2
            : safeFurLengthIndex === 2 ? 2.5 : 3,
      },
      pattern: {
        type: patternIndex,
        hasPattern,
      },
      eyeColorName: isOddEyed ? 'Odd-eyed' : eyeColorName,
    };
  } catch (error) {
    console.error('getCatAppearanceStyle 错误:', error);
    // 返回默认样式
    return {
      colors: {
        body1: '#ffb84d',
        body2: '#e67700',
        ear: '#ffb380',
        stroke: '#e09112',
      },
      ears: {
        left: 'M65,35 L60,10 Q75,15 85,30',
        right: 'M115,35 L120,10 Q105,15 95,30',
        leftInner: 'M67,30 L65,15 Q75,20 80,28',
        rightInner: 'M113,30 L115,15 Q105,20 100,28',
      },
      eyes: {
        leftColor: '#4CAF50',
        rightColor: '#4CAF50',
      },
      fur: {
        type: 'short',
        strokeWidth: 1.5,
      },
      pattern: {
        type: 0,
        hasPattern: false,
      },
      eyeColorName: 'Green',
    };
  }
}

/**
 * Get cat color CSS class
 * @param {number|string|BigInt} gene - Gene value
 * @returns {string} - CSS class name
 */
export function getCatColorClass(gene) {
  try {
    const geneBigInt = typeof gene === 'bigint' ? gene : BigInt(gene || 0);
    const parsedGene = parseGene(geneBigInt);
    
    const baseColorIndex = parsedGene.appearance.baseColor;
    const patternFactor = parsedGene.appearance.pattern % 4;
    const furFactor = parsedGene.appearance.furLength;
    const extraFactor1 = parsedGene.appearance.extraFeature1 % 4;
    const extraFactor2 = parsedGene.appearance.extraFeature2 % 4;
    
    // 使用字符串特征和高位特征
    const strFactor1 = parsedGene.appearance.strFeature1 % 4;
    const strFactor2 = parsedGene.appearance.strFeature2 % 4;
    const strFactor3 = parsedGene.appearance.strFeature3 % 4;
    const highFactor1 = parsedGene.appearance.highFeature1 % 4;
    const highFactor2 = parsedGene.appearance.highFeature2 % 4;
    const topFactor = parsedGene.appearance.topFeature % 4;
    
    // 使用与 getCatAppearanceStyle 相同的逻辑计算颜色索引
    const colorIndex = (
      baseColorIndex * 16 + 
      patternFactor * 4 + 
      furFactor + 
      extraFactor1 + 
      extraFactor2 +
      strFactor1 * 2 +
      strFactor2 * 3 +
      strFactor3 * 5 +
      highFactor1 * 7 +
      highFactor2 * 11 +
      topFactor * 13
    ) % 16;
    
    const colors = [
      // 原始颜色
      'bg-orange-500',
      'bg-gray-400',
      'bg-amber-700',
      'bg-white',
      'bg-yellow-300',
      'bg-gray-800',
      'bg-blue-300',
      // 新增颜色
      'bg-pink-400',
      'bg-amber-100',
      'bg-purple-200',
      'bg-amber-600',
      'bg-gray-300',
      'bg-amber-400',
      'bg-green-400',
      'bg-blue-500',
      'bg-purple-500',
    ];
    
    return colors[colorIndex] || colors[0];
  } catch (error) {
    console.error('getCatColorClass 错误:', error);
    return 'bg-orange-500'; // 默认颜色
  }
} 