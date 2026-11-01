import React, { useEffect } from 'react';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import Svg, {
  Circle,
  Defs,
  Line,
  Path,
  Polygon,
  RadialGradient,
  Stop,
} from 'react-native-svg';
import type { RingStyle } from '../data/storeCatalog';

interface ProgressRingProps {
  progress: number;
  style: RingStyle;
  isDarkMode: boolean;
  accent: string;
}

interface PulseRingProps {
  progress: number;
  activeColor: string;
  inactiveColor: string;
}

function PulseRing({
  progress,
  activeColor,
  inactiveColor,
}: PulseRingProps) {
  const scale = useSharedValue(0.98);
  const opacity = useSharedValue(0.85);

  useEffect(() => {
    scale.value = withRepeat(
      withTiming(1.04, {
        duration: 1300,
        easing: Easing.inOut(Easing.ease),
      }),
      -1,
      true
    );
    opacity.value = withRepeat(
      withTiming(1, {
        duration: 1300,
        easing: Easing.inOut(Easing.ease),
      }),
      -1,
      true
    );
  }, [opacity, scale]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  const pulseRadius = 80;
  const circumference = 2 * Math.PI * pulseRadius;
  const dashOffset = circumference * (1 - progress);

  return (
    <Animated.View style={animatedStyle}>
      <Svg height="240" width="240" viewBox="0 0 200 200">
        <Defs>
          <RadialGradient id="pulseGlow" cx="50%" cy="50%" r="50%">
            <Stop offset="0%" stopColor="#00F0FF" stopOpacity={1} />
            <Stop offset="55%" stopColor="#00F0FF" stopOpacity={0.8} />
            <Stop offset="100%" stopColor="#00F0FF" stopOpacity={0} />
          </RadialGradient>
        </Defs>
        <Circle
          cx={100}
          cy={100}
          r={pulseRadius + 12}
          fill="none"
          stroke="url(#pulseGlow)"
          strokeWidth="12"
          opacity={0.5}
        />
        <Circle
          cx={100}
          cy={100}
          r={pulseRadius}
          fill="none"
          stroke={inactiveColor}
          strokeWidth="8"
          strokeDasharray="16 12"
          strokeLinecap="round"
          opacity={0.7}
        />
        <Circle
          cx={100}
          cy={100}
          r={pulseRadius}
          fill="none"
          stroke={activeColor}
          strokeWidth="8"
          strokeDasharray="16 12"
          strokeDashoffset={dashOffset}
          strokeLinecap="round"
          transform="rotate(-90 100 100)"
          opacity={0.95}
        />
      </Svg>
    </Animated.View>
  );
}

export default function ProgressRing({
  progress,
  style,
  isDarkMode,
  accent,
}: ProgressRingProps) {
  const radius = 100;
  const center = 120;
  const inactiveColor = isDarkMode ? '#334155' : '#CBD5E1';
  const activeColor = accent;

  switch (style.kind) {
    case 'wave': {
      const totalBars = 34;
      const activeBars = Math.floor(progress * totalBars);

      return (
        <Svg height="240" width="240">
          {Array.from({ length: totalBars }).map((_, index) => {
            const angle = (index * 360) / totalBars - 90;
            const rad = (angle * Math.PI) / 180;
            const baseRadius = 92;
            const gapFromCenter = 14;
            const waveLength = [
              9, 14, 18, 13, 15, 11, 17, 13, 20, 12, 15, 10, 18, 12, 16, 11,
              19, 13, 14, 10, 17, 15, 12, 9, 18, 12, 16, 10, 15, 11, 13, 9,
              17, 11,
            ][index];
            const x1 = center + (baseRadius - gapFromCenter) * Math.cos(rad);
            const y1 = center + (baseRadius - gapFromCenter) * Math.sin(rad);
            const x2 = center + (baseRadius + waveLength - 8) * Math.cos(rad);
            const y2 = center + (baseRadius + waveLength - 8) * Math.sin(rad);
            const isActive = index < activeBars;

            return (
              <Line
                key={index}
                x1={x1}
                y1={y1}
                x2={x2}
                y2={y2}
                stroke={isActive ? activeColor : inactiveColor}
                strokeWidth={isActive ? '4' : '2.2'}
                strokeLinecap="round"
                opacity={isActive ? 1 : 0.7}
              />
            );
          })}
        </Svg>
      );
    }
    case 'solid': {
      const ringRadius = radius - 4;
      const circumference = 2 * Math.PI * ringRadius;
      const offset = circumference * (1 - progress);

      return (
        <Svg height="240" width="240">
          <Circle
            cx={center}
            cy={center}
            r={ringRadius}
            fill="none"
            stroke={inactiveColor}
            strokeWidth="16"
            opacity={0.75}
          />
          <Circle
            cx={center}
            cy={center}
            r={ringRadius}
            fill="none"
            stroke={activeColor}
            strokeWidth="16"
            strokeDasharray={`${circumference} ${circumference}`}
            strokeDashoffset={offset}
            strokeLinecap="round"
            transform={`rotate(-90 ${center} ${center})`}
          />
        </Svg>
      );
    }
    case 'dots': {
      const totalDots = 26;
      const activeDots = Math.round(progress * totalDots);

      return (
        <Svg height="240" width="240">
          {Array.from({ length: totalDots }).map((_, index) => {
            const angle = (index * 360) / totalDots - 90;
            const rad = (angle * Math.PI) / 180;
            const x = center + (radius - 8) * Math.cos(rad);
            const y = center + (radius - 8) * Math.sin(rad);
            const isActive = index < activeDots;

            return (
              <Circle
                key={index}
                cx={x}
                cy={y}
                r={isActive ? 4.5 : 2.8}
                fill={isActive ? activeColor : inactiveColor}
              />
            );
          })}
        </Svg>
      );
    }
    case 'double': {
      const outerRadius = 84;
      const innerRadius = 72;
      const outerCircumference = 2 * Math.PI * outerRadius;
      const innerCircumference = 2 * Math.PI * innerRadius;
      const outerOffset = outerCircumference * (1 - progress);
      const innerOffset = innerCircumference * (1 - progress);

      return (
        <Svg height="240" width="240" viewBox="0 0 200 200">
          <Circle
            cx={100}
            cy={100}
            r={outerRadius}
            fill="none"
            stroke={inactiveColor}
            strokeWidth="4"
            strokeDasharray="12 10"
            strokeLinecap="round"
            strokeOpacity={1}
          />
          <Circle
            cx={100}
            cy={100}
            r={innerRadius}
            fill="none"
            stroke={inactiveColor}
            strokeWidth="3"
            strokeDasharray="12 10"
            strokeLinecap="round"
            strokeOpacity={0.6}
          />
          <Circle
            cx={100}
            cy={100}
            r={outerRadius}
            fill="none"
            stroke={activeColor}
            strokeWidth="4"
            strokeDasharray="12 10"
            strokeDashoffset={outerOffset}
            strokeLinecap="round"
            transform="rotate(-90 100 100)"
            strokeOpacity={1}
          />
          <Circle
            cx={100}
            cy={100}
            r={innerRadius}
            fill="none"
            stroke={activeColor}
            strokeWidth="3"
            strokeDasharray="12 10"
            strokeDashoffset={innerOffset}
            strokeLinecap="round"
            transform="rotate(-90 100 100)"
            strokeOpacity={0.8}
          />
        </Svg>
      );
    }
    case 'dash': {
      const dashRadius = 80;
      const circumference = 2 * Math.PI * dashRadius;
      const dashOffset = circumference * (1 - progress);

      return (
        <Svg height="240" width="240" viewBox="0 0 200 200">
          <Circle
            cx={100}
            cy={100}
            r={dashRadius}
            fill="none"
            stroke={inactiveColor}
            strokeWidth="10"
            strokeDasharray="16 12"
            strokeLinecap="round"
          />
          <Circle
            cx={100}
            cy={100}
            r={dashRadius}
            fill="none"
            stroke={activeColor}
            strokeWidth="10"
            strokeDasharray="16 12"
            strokeDashoffset={dashOffset}
            strokeLinecap="round"
            transform="rotate(-90 100 100)"
          />
        </Svg>
      );
    }
    case 'pulse':
      return (
        <PulseRing
          progress={progress}
          activeColor={activeColor}
          inactiveColor={inactiveColor}
        />
      );
    case 'arc': {
      const arcRadius = 88;
      const strokeLength = progress * 220;

      return (
        <Svg height="240" width="240">
          <Circle
            cx={center}
            cy={center}
            r={arcRadius}
            fill="none"
            stroke={inactiveColor}
            strokeWidth="8"
            strokeDasharray="12 16"
            opacity={0.85}
          />
          <Circle
            cx={center}
            cy={center}
            r={arcRadius}
            fill="none"
            stroke={activeColor}
            strokeWidth="8"
            strokeDasharray={`${strokeLength} 300`}
            strokeLinecap="round"
            transform={`rotate(-115 ${center} ${center})`}
          />
        </Svg>
      );
    }
    case 'infinity': {
      const outerRadius = 84;
      const innerRadius = 74;
      const outerCircumference = 2 * Math.PI * outerRadius;
      const innerCircumference = 2 * Math.PI * innerRadius;

      return (
        <Svg height="240" width="240" viewBox="0 0 200 200">
          <Circle
            cx={100}
            cy={100}
            r={outerRadius}
            fill="none"
            stroke={inactiveColor}
            strokeWidth="3"
            strokeDasharray="20 12"
            opacity={0.7}
          />
          <Circle
            cx={100}
            cy={100}
            r={innerRadius}
            fill="none"
            stroke={inactiveColor}
            strokeWidth="3"
            strokeDasharray="20 12"
            opacity={0.7}
          />
          <Circle
            cx={100}
            cy={100}
            r={outerRadius}
            fill="none"
            stroke={activeColor}
            strokeWidth="3"
            strokeDasharray={`${Math.max(20, progress * outerCircumference)} ${outerCircumference}`}
            strokeLinecap="round"
            transform="rotate(-90 100 100)"
          />
          <Circle
            cx={100}
            cy={100}
            r={innerRadius}
            fill="none"
            stroke={activeColor}
            strokeWidth="3"
            strokeDasharray={`${Math.max(20, progress * innerCircumference)} ${innerCircumference}`}
            strokeLinecap="round"
            transform="rotate(-90 100 100)"
          />
        </Svg>
      );
    }
    case 'dotted-flow': {
      const totalDiamonds = 28;

      return (
        <Svg height="240" width="240" viewBox="0 0 200 200">
          {Array.from({ length: totalDiamonds }).map((_, index) => {
            const angle = (index / totalDiamonds) * Math.PI * 2 - Math.PI / 2;
            const cx = 100 + 80 * Math.cos(angle);
            const cy = 100 + 80 * Math.sin(angle);
            const isActive = index / totalDiamonds <= progress;
            const points = [
              `${cx},${cy - 4}`,
              `${cx + 4},${cy}`,
              `${cx},${cy + 4}`,
              `${cx - 4},${cy}`,
            ].join(' ');

            return (
              <Polygon
                key={index}
                points={points}
                fill={isActive ? '#00F0FF' : '#1E293B'}
                fillOpacity={isActive ? 1 : 0.3}
                stroke={isActive ? '#00E5FF' : '#334155'}
                strokeWidth={isActive ? 1 : 1}
              />
            );
          })}
        </Svg>
      );
    }
    case 'spiral': {
      const ringProgress = Math.max(0, Math.min(progress, 1));
      const pointCount = 180;
      const pathPoints = Array.from({ length: pointCount + 1 }, (_, index) => {
        const progressAlongSpiral = index / pointCount;
        const angle = -Math.PI / 2 + progressAlongSpiral * Math.PI * 4;
        const spiralRadius = 82 + 16 * progressAlongSpiral;
        return {
          x: center + spiralRadius * Math.cos(angle),
          y: center + spiralRadius * Math.sin(angle),
        };
      });
      const spiralPath = pathPoints
        .map(({ x, y }, index) => `${index === 0 ? 'M' : 'L'} ${x} ${y}`)
        .join(' ');
      const pathLength = pathPoints.reduce((length, point, index) => {
        if (index === 0) return length;
        const previous = pathPoints[index - 1];
        return length + Math.hypot(point.x - previous.x, point.y - previous.y);
      }, 0);

      return (
        <Svg height="240" width="240" viewBox="0 0 240 240">
          <Path
            d={spiralPath}
            fill="none"
            stroke={inactiveColor}
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
            opacity={0.8}
          />
          {ringProgress > 0 && (
            <Path
              d={spiralPath}
              fill="none"
              stroke={activeColor}
              strokeWidth="3"
              strokeDasharray={`${pathLength} ${pathLength}`}
              strokeDashoffset={pathLength * (1 - ringProgress)}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          )}
        </Svg>
      );
    }
    case 'star': {
      const ringProgress = Math.max(0, Math.min(progress, 1));
      const starCount = 12;

      return (
        <Svg height="240" width="240" viewBox="0 0 240 240">
          {Array.from({ length: starCount }, (_, starIndex) => {
            const angle =
              (starIndex / starCount) * Math.PI * 2 - Math.PI / 2;
            const starCenterX = center + 88 * Math.cos(angle);
            const starCenterY = center + 88 * Math.sin(angle);
            const points = Array.from({ length: 10 }, (_, pointIndex) => {
              const pointAngle = angle + (pointIndex * Math.PI) / 5;
              const pointRadius = pointIndex % 2 === 0 ? 13 : 5.8;
              const x = starCenterX + pointRadius * Math.cos(pointAngle);
              const y = starCenterY + pointRadius * Math.sin(pointAngle);
              return `${x},${y}`;
            }).join(' ');
            const isActive = starIndex < ringProgress * starCount;

            return (
              <Polygon
                key={starIndex}
                points={points}
                fill={isActive ? activeColor : inactiveColor}
                fillOpacity={isActive ? 0.95 : 0.5}
                stroke={isActive ? activeColor : inactiveColor}
                strokeWidth="1"
                strokeLinejoin="round"
              />
            );
          })}
        </Svg>
      );
    }
    case 'cube': {
      const ringProgress = Math.max(0, Math.min(progress, 1));
      const cornerPaths = [
        'M 20 50 V 20 H 50',
        'M 190 20 H 220 V 50',
        'M 220 190 V 220 H 190',
        'M 50 220 H 20 V 190',
      ];
      const cornerPathLength = 60;

      return (
        <Svg height="240" width="240" viewBox="0 0 240 240">
          {cornerPaths.map((path, index) => {
            const cornerProgress = Math.max(
              0,
              Math.min(ringProgress * cornerPaths.length - index, 1)
            );

            return (
              <React.Fragment key={path}>
                <Path
                  d={path}
                  fill="none"
                  stroke={inactiveColor}
                  strokeWidth="4"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  opacity={0.75}
                />
                {cornerProgress > 0 && (
                  <Path
                    d={path}
                    fill="none"
                    stroke={activeColor}
                    strokeWidth="4"
                    strokeDasharray={`${cornerPathLength} ${cornerPathLength}`}
                    strokeDashoffset={
                      cornerPathLength * (1 - cornerProgress)
                    }
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                )}
              </React.Fragment>
            );
          })}
        </Svg>
      );
    }
    case 'zigzag': {
      const ringProgress = Math.max(0, Math.min(progress, 1));
      const pointCount = 64;
      const pathPoints = Array.from({ length: pointCount }, (_, index) => {
        const angle = -Math.PI / 2 + (index * Math.PI * 2) / pointCount;
        const pointRadius = index % 2 === 0 ? 97 : 85;
        return {
          x: center + pointRadius * Math.cos(angle),
          y: center + pointRadius * Math.sin(angle),
        };
      });
      const zigzagPath = `${pathPoints
        .map(({ x, y }, index) => `${index === 0 ? 'M' : 'L'} ${x} ${y}`)
        .join(' ')} Z`;
      const pathLength = pathPoints.reduce((length, point, index) => {
        const nextPoint = pathPoints[(index + 1) % pointCount];
        return length + Math.hypot(nextPoint.x - point.x, nextPoint.y - point.y);
      }, 0);

      return (
        <Svg height="240" width="240" viewBox="0 0 240 240">
          <Path
            d={zigzagPath}
            fill="none"
            stroke={inactiveColor}
            strokeWidth="4"
            strokeLinejoin="round"
            strokeLinecap="round"
            opacity={0.8}
          />
          {ringProgress > 0 && (
            <Path
              d={zigzagPath}
              fill="none"
              stroke={activeColor}
              strokeWidth="4"
              strokeDasharray={`${pathLength} ${pathLength}`}
              strokeDashoffset={pathLength * (1 - ringProgress)}
              strokeLinejoin="round"
              strokeLinecap="round"
            />
          )}
        </Svg>
      );
    }
    case 'ticks':
    default: {
      const totalTicks = 60;
      const activeTicksCount = Math.floor(progress * totalTicks);

      return (
        <Svg height="240" width="240">
          {Array.from({ length: totalTicks }).map((_, index) => {
            const angle =
              (index * (360 / totalTicks) - 90) * (Math.PI / 180);
            const x1 = center + (radius - 10) * Math.cos(angle);
            const y1 = center + (radius - 10) * Math.sin(angle);
            const x2 = center + radius * Math.cos(angle);
            const y2 = center + radius * Math.sin(angle);
            const isActive = index < activeTicksCount;

            return (
              <Line
                key={index}
                x1={x1}
                y1={y1}
                x2={x2}
                y2={y2}
                stroke={isActive ? activeColor : inactiveColor}
                strokeWidth={isActive ? '3.5' : '2'}
                strokeLinecap="round"
              />
            );
          })}
        </Svg>
      );
    }
  }
}
