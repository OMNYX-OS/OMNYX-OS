import React from 'react';
import { View, Text } from 'react-native';
import { THEMES } from '@/theme';
import type { RiskTier } from '@/types/permissions';

type RiskLegendProps = {
  themeId: string;
};

const RISK_LABELS: Record<RiskTier, string> = {
  safe: 'SAFE',
  low: 'LOW',
  medium: 'MEDIUM',
  high: 'HIGH',
  critical: 'CRITICAL',
};

const legendItems: { tier: RiskTier; desc: string }[] = [
  {
    tier: 'critical',
    desc: 'Immediate privacy threat',
  },
  {
    tier: 'high',
    desc: 'Serious privacy concern',
  },
  {
    tier: 'medium',
    desc: 'Needs attention',
  },
  {
    tier: 'low',
    desc: 'Minor concern',
  },
  {
    tier: 'safe',
    desc: 'No detected threat',
  },
];

function RiskLegend({ themeId }: RiskLegendProps) {
  const theme = THEMES[themeId as keyof typeof THEMES];
  const C = theme.colors;

  return (
    <View
      style={{
        marginHorizontal: 20,
        marginBottom: 12,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: C.borderDim,
        backgroundColor: C.surface1,
        padding: 16,
      }}
    >
      <Text
        style={{
          fontSize: 12,
          fontWeight: '700',
          color: C.textPrimary,
          marginBottom: 10,
        }}
      >
        Risk Legend
      </Text>

      {legendItems.map((item) => (
        <View
          key={item.tier}
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            marginBottom: 8,
          }}
        >
          <View
            style={{
              width: 10,
              height: 10,
              borderRadius: 5,
              backgroundColor: (
                {
                  critical: C.threat,
                  high: C.warning,
                  medium: C.accent,
                  low: C.primary,
                  safe: C.safe,
                } as Record<RiskTier, string>
              )[item.tier],
              marginRight: 10,
            }}
          />

          <Text
            style={{
              color: C.textPrimary,
              fontSize: 11,
              fontWeight: '600',
            }}
          >
            {RISK_LABELS[item.tier]}
          </Text>

          <Text
            style={{
              color: C.textDim,
              fontSize: 10,
              marginLeft: 6,
            }}
          >
            — {item.desc}
          </Text>
        </View>
      ))}
    </View>
  );
}

export default RiskLegend;