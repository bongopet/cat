import React, { useState, useMemo } from 'react';
import './CatRenderer.css';
import { getCatAppearanceStyle } from '../utils/catGeneParser';

/**
 * Cat Renderer Component
 * Renders a cat SVG based on genes
 */
const CatRenderer = ({parent, gene, onClick }) => {
  const [isPatting, setIsPatting] = useState(false);
  const [isHovering, setIsHovering] = useState(false);

  // 为每个实例生成唯一的ID
  const uniqueId = useMemo(() => {
    // 使用parent参数和gene值的组合作为唯一标识
    return `${parent || 'cat'}-${gene || 0}`;
  }, [parent, gene]);

  // 输出基因值的原始值和 BigInt 转换后的值
  // console.log(`基因值调试信息 - parent: ${parent}, gene: ${gene}, gene类型: ${typeof gene}`);
  // try {
  //   const geneBigInt = BigInt(gene || 0);
  //   console.log(`BigInt转换后: ${geneBigInt}, BigInt类型: ${typeof geneBigInt}`);
    
  //   // 测试基本位运算
  //   console.log(`基本位运算测试 - baseColor: ${geneBigInt % 7n}, furLength: ${(geneBigInt >> 4n) & 0x3n}, earShape: ${(geneBigInt >> 6n) & 0x3n}`);
    
  //   // 测试额外特征的计算
  //   const extraFeature1 = (geneBigInt >> 15n) & 0xFFn;
  //   const extraFeature2 = (geneBigInt >> 23n) & 0xFFn;
  //   console.log(`额外特征测试 - extraFeature1: ${extraFeature1}, extraFeature2: ${extraFeature2}`);
    
  //   // 测试完整的位运算
  //   const appearance = {
  //     baseColor: Number(geneBigInt % 7n),
  //     furLength: Number((geneBigInt >> 4n) & 0x3n),
  //     earShape: Number((geneBigInt >> 6n) & 0x3n),
  //     eyeColor: Number((geneBigInt >> 8n) & 0x7n),
  //     pattern: Number((geneBigInt >> 11n) & 0xFn),
  //     extraFeature1: Number((geneBigInt >> 15n) & 0xFFn),
  //     extraFeature2: Number((geneBigInt >> 23n) & 0xFFn),
  //   };
  //   console.log('解析后的外观对象:', appearance);
  // } catch (error) {
  //   console.error('BigInt转换错误:', error);
  // }

  // Parse cat appearance from genes - use useMemo to ensure consistent rendering
  const catAppearance = useMemo(() => {
    // 直接传递基因值，不进行类型转换
    return getCatAppearanceStyle(gene);
  }, [gene]); // 只依赖于 gene 参数，不依赖于 parent
  
  // console.log(`详细信息 - parent: ${parent}, gene: ${gene}, 颜色方案:`, 
  //             catAppearance?.colors, 
  //             '耳朵形状:', catAppearance?.ears,
  //             '眼睛颜色:', catAppearance?.eyes);
 
  // Handle pat animation
  const handlePat = () => {
    if (isPatting) return;
    
    setIsPatting(true);
    
    // Reset after animation completes
    setTimeout(() => {
      setIsPatting(false);
    }, 1500);
    
    // Call onClick handler if provided
    if (onClick) onClick();
  };

  return (
    <div className="cat-renderer">
      <div className="relative">
        {isHovering && (
          <div className="cat-tooltip">
            摸摸我
          </div>
        )}
        
        <svg
          width="180"
          height="140"
          viewBox="0 0 180 140"
          xmlns="http://www.w3.org/2000/svg"
          className={isPatting ? 'pat-animation' : ''}
          onClick={handlePat}
          onMouseEnter={() => setIsHovering(true)}
          onMouseLeave={() => setIsHovering(false)}
        >
          {/* Gradient definitions */}
          <defs>
            <linearGradient
              id={`cat-body-gradient-${uniqueId}`}
              x1="0%"
              y1="0%"
              x2="100%"
              y2="100%"
            >
              <stop
                offset="0%"
                style={{
                  stopColor: catAppearance?.colors?.body1 || '#ffb84d',
                  stopOpacity: 1
                }}
              />
              <stop
                offset="100%"
                style={{
                  stopColor: catAppearance?.colors?.body2 || '#e67700',
                  stopOpacity: 1
                }}
              />
            </linearGradient>

            <linearGradient
              id={`cat-head-gradient-${uniqueId}`}
              x1="0%"
              y1="0%"
              x2="100%"
              y2="100%"
            >
              <stop
                offset="0%"
                style={{
                  stopColor: catAppearance?.colors?.body1 || '#ffb84d',
                  stopOpacity: 1
                }}
              />
              <stop
                offset="100%"
                style={{
                  stopColor: catAppearance?.colors?.body2 || '#e67700',
                  stopOpacity: 1
                }}
              />
            </linearGradient>

            {/* Pattern definition */}
            {catAppearance?.pattern?.hasPattern && (
              <pattern
                id={`cat-pattern-${uniqueId}`}
                width="20"
                height="20"
                patternUnits="userSpaceOnUse"
              >
                <rect
                  width="20"
                  height="20"
                  fill="none"
                />
                {catAppearance?.pattern?.type === 1 && (
                  /* Tiger stripes */
                  <>
                    <path
                      d="M0,0 L20,20"
                      stroke="rgba(0,0,0,0.2)"
                      strokeWidth="4"
                    />
                    <path
                      d="M20,0 L0,20"
                      stroke="rgba(0,0,0,0.2)"
                      strokeWidth="4"
                    />
                  </>
                )}
                {catAppearance?.pattern?.type === 2 && (
                  /* Spots */
                  <>
                    <circle
                      cx="5"
                      cy="5"
                      r="3"
                      fill="rgba(0,0,0,0.2)"
                    />
                    <circle
                      cx="15"
                      cy="15"
                      r="3"
                      fill="rgba(0,0,0,0.2)"
                    />
                  </>
                )}
                {catAppearance?.pattern?.type === 3 && (
                  /* Bi-color */
                  <rect
                    x="0"
                    y="0"
                    width="10"
                    height="20"
                    fill="rgba(0,0,0,0.15)"
                  />
                )}
              </pattern>
            )}
          </defs>

          {/* Cat body */}
          <ellipse
            className="cat-body"
            cx="90"
            cy="95"
            rx="55"
            ry="40"
            fill={catAppearance?.pattern?.hasPattern ? `url(#cat-pattern-${uniqueId})` : `url(#cat-body-gradient-${uniqueId})`}
            stroke={catAppearance?.colors?.stroke || '#e09112'}
            strokeWidth={catAppearance?.fur?.strokeWidth || 2}
          />

          {/* Cat head */}
          <circle
            className="cat-head"
            cx="90"
            cy="60"
            r="38"
            fill={catAppearance?.pattern?.hasPattern ? `url(#cat-pattern-${uniqueId})` : `url(#cat-head-gradient-${uniqueId})`}
            stroke={catAppearance?.colors?.stroke || '#e09112'}
            strokeWidth={catAppearance?.fur?.strokeWidth || 2}
          />

          {/* Tail */}
          <path
            className="cat-tail"
            d="M30,90 Q35,60 45,80 Q55,95 40,105"
            fill={catAppearance?.pattern?.hasPattern ? `url(#cat-pattern-${uniqueId})` : `url(#cat-body-gradient-${uniqueId})`}
            stroke={catAppearance?.colors?.stroke || '#e09112'}
            strokeWidth={catAppearance?.fur?.strokeWidth || 2}
            strokeLinecap="round"
          />

          {/* Ears */}
          <path
            className="cat-body"
            d={catAppearance?.ears?.left || 'M65,35 L60,10 Q75,15 85,30'}
            fill={catAppearance?.pattern?.hasPattern ? `url(#cat-pattern-${uniqueId})` : `url(#cat-body-gradient-${uniqueId})`}
            stroke={catAppearance?.colors?.stroke || '#e09112'}
            strokeWidth={catAppearance?.fur?.strokeWidth || 2}
          />
          <path
            className="cat-body"
            d={catAppearance?.ears?.right || 'M115,35 L120,10 Q105,15 95,30'}
            fill={catAppearance?.pattern?.hasPattern ? `url(#cat-pattern-${uniqueId})` : `url(#cat-body-gradient-${uniqueId})`}
            stroke={catAppearance?.colors?.stroke || '#e09112'}
            strokeWidth={catAppearance?.fur?.strokeWidth || 2}
          />

          {/* Inner ears */}
          <path
            className="cat-body"
            d={catAppearance?.ears?.leftInner || 'M67,30 L65,15 Q75,20 80,28'}
            fill={catAppearance?.colors?.ear || '#ffb380'}
          />
          <path
            className="cat-body"
            d={catAppearance?.ears?.rightInner || 'M113,30 L115,15 Q105,20 100,28'}
            fill={catAppearance?.colors?.ear || '#ffb380'}
          />

          {/* Cheeks */}
          <ellipse
            className="cat-body"
            cx="65"
            cy="70"
            rx="12"
            ry="10"
            fill={catAppearance?.colors?.ear || '#ffb380'}
            opacity="0.6"
          />
          <ellipse
            className="cat-body"
            cx="115"
            cy="70"
            rx="12"
            ry="10"
            fill={catAppearance?.colors?.ear || '#ffb380'}
            opacity="0.6"
          />

          {/* Eyes */}
          <g className="cat-eyes">
            <ellipse
              cx="75"
              cy="55"
              rx="9"
              ry="11"
              fill="white"
              stroke="#333"
              strokeWidth="1.5"
            />
            <ellipse
              cx="105"
              cy="55"
              rx="9"
              ry="11"
              fill="white"
              stroke="#333"
              strokeWidth="1.5"
            />

            {/* Eye highlights */}
            <circle
              cx="73"
              cy="51"
              r="3"
              fill="white"
            />
            <circle
              cx="103"
              cy="51"
              r="3"
              fill="white"
            />

            {/* Pupils */}
            <ellipse
              cx="75"
              cy="55"
              rx="4"
              ry="8"
              fill={catAppearance?.eyes?.leftColor || '#333'}
            />
            <ellipse
              cx="105"
              cy="55"
              rx="4"
              ry="8"
              fill={catAppearance?.eyes?.rightColor || '#333'}
            />
          </g>

          {/* Nose */}
          <path
            className="cat-body"
            d="M87,65 Q90,67 93,65 L93,68 Q90,70 87,68 Z"
            fill="#ff9999"
            stroke="#d67979"
            strokeWidth="0.5"
          />

          {/* Mouth */}
          <path
            className="cat-body"
            d="M85,72 Q90,77 95,72"
            fill="none"
            stroke="#333"
            strokeWidth="1.5"
          />
          <path
            className="cat-body"
            d="M90,68 L90,72"
            fill="none"
            stroke="#333"
            strokeWidth="1"
          />

          {/* Whiskers */}
          <g className="cat-whiskers">
            <path
              d="M65,70 Q72,71 78,70"
              fill="none"
              stroke="#333"
              strokeWidth="1"
            />
            <path
              d="M65,75 Q73,75 80,74"
              fill="none"
              stroke="#333"
              strokeWidth="1"
            />
            <path
              d="M65,80 Q72,79 78,78"
              fill="none"
              stroke="#333"
              strokeWidth="1"
            />

            <path
              d="M115,70 Q108,71 102,70"
              fill="none"
              stroke="#333"
              strokeWidth="1"
            />
            <path
              d="M115,75 Q107,75 100,74"
              fill="none"
              stroke="#333"
              strokeWidth="1"
            />
            <path
              d="M115,80 Q108,79 102,78"
              fill="none"
              stroke="#333"
              strokeWidth="1"
            />
          </g>

          {/* Front paws */}
          <path
            className="cat-body"
            d="M65,110 C60,115 62,125 70,125 Q72,120 70,115"
            fill={catAppearance?.pattern?.hasPattern ? `url(#cat-pattern-${uniqueId})` : `url(#cat-body-gradient-${uniqueId})`}
            stroke={catAppearance?.colors?.stroke || '#e09112'}
            strokeWidth={catAppearance?.fur?.strokeWidth || 2}
          />
          <path
            className="cat-body"
            d="M115,110 C120,115 118,125 110,125 Q108,120 110,115"
            fill={catAppearance?.pattern?.hasPattern ? `url(#cat-pattern-${uniqueId})` : `url(#cat-body-gradient-${uniqueId})`}
            stroke={catAppearance?.colors?.stroke || '#e09112'}
            strokeWidth={catAppearance?.fur?.strokeWidth || 2}
          />

          {/* Paw details */}
          <path
            className="cat-body"
            d="M65,123 L67,119"
            stroke={catAppearance?.colors?.stroke || '#e09112'}
            strokeWidth="1.5"
          />
          <path
            className="cat-body"
            d="M68,123 L69,119"
            stroke={catAppearance?.colors?.stroke || '#e09112'}
            strokeWidth="1.5"
          />
          <path
            className="cat-body"
            d="M115,123 L113,119"
            stroke={catAppearance?.colors?.stroke || '#e09112'}
            strokeWidth="1.5"
          />
          <path
            className="cat-body"
            d="M112,123 L111,119"
            stroke={catAppearance?.colors?.stroke || '#e09112'}
            strokeWidth="1.5"
          />

          {/* Fur effects */}
          {catAppearance?.fur?.type === 'long' && (
            <g className="cat-fur-effect">
              <path
                d="M65,40 Q60,35 58,30"
                fill="none"
                stroke={catAppearance?.colors?.stroke || '#e09112'}
                strokeWidth="1"
              />
              <path
                d="M115,40 Q120,35 122,30"
                fill="none"
                stroke={catAppearance?.colors?.stroke || '#e09112'}
                strokeWidth="1"
              />
              <path
                d="M50,90 Q45,85 40,83"
                fill="none"
                stroke={catAppearance?.colors?.stroke || '#e09112'}
                strokeWidth="1"
              />
              <path
                d="M130,90 Q135,85 140,83"
                fill="none"
                stroke={catAppearance?.colors?.stroke || '#e09112'}
                strokeWidth="1"
              />
            </g>
          )}
          
          {catAppearance?.fur?.type === 'curly' && (
            <g className="cat-fur-effect">
              <path
                d="M65,40 Q60,38 62,32 Q64,30 66,32"
                fill="none"
                stroke={catAppearance?.colors?.stroke || '#e09112'}
                strokeWidth="1"
              />
              <path
                d="M115,40 Q120,38 118,32 Q116,30 114,32"
                fill="none"
                stroke={catAppearance?.colors?.stroke || '#e09112'}
                strokeWidth="1"
              />
              <path
                d="M50,90 Q45,88 47,83 Q49,80 51,82"
                fill="none"
                stroke={catAppearance?.colors?.stroke || '#e09112'}
                strokeWidth="1"
              />
              <path
                d="M130,90 Q135,88 133,83 Q131,80 129,82"
                fill="none"
                stroke={catAppearance?.colors?.stroke || '#e09112'}
                strokeWidth="1"
              />
            </g>
          )}
        </svg>
      </div>
    </div>
  );
};

export default CatRenderer; 