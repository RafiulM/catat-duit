import { StyleSheet, View } from 'react-native';
import { CalendarRange } from 'lucide-react-native';
import { AppText } from '@/components/AppText';
import { Card } from '@/components/Card';
import { Chip } from '@/components/Chip';
import { LineChart, type ChartPoint } from '@/components/LineChart';
import { colors, space } from '@/theme/tokens';
import { formatRupiah } from '@/utils/format';

type TrendSectionProps = {
  points: ChartPoint[];
  total: number;
  average: number;
  rangeLabel: string;
  pendingCount: number;
  onViewAnalytics: () => void;
};

export function TrendSection({
  points,
  total,
  average,
  rangeLabel,
  pendingCount,
  onViewAnalytics,
}: TrendSectionProps) {
  const description = points
    .map((point) => `${point.label} ${formatRupiah(point.value)}`)
    .join(', ');

  return (
    <View style={styles.section}>
      <View style={styles.header}>
        <View style={styles.headerCopy}>
          <AppText variant="headingSm">Tren pengeluaran</AppText>
          <AppText variant="bodySm" color={colors.textMuted}>
            {rangeLabel}
          </AppText>
        </View>
        <Chip
          label="7 hari"
          icon={CalendarRange}
          selected
          onPress={onViewAnalytics}
          accessibilityLabel="Lihat analisis pengeluaran"
        />
      </View>
      <Card style={styles.card}>
        <View style={styles.totals}>
          <View style={styles.totalCell}>
            <AppText variant="labelSm" color={colors.textMuted}>
              Total 7 hari
            </AppText>
            <AppText variant="bodyMd" weight="semiBold" tabular style={styles.value}>
              {formatRupiah(total)}
            </AppText>
          </View>
          <View style={styles.divider} />
          <View style={styles.totalCell}>
            <AppText variant="labelSm" color={colors.textMuted}>
              Rata-rata/hari
            </AppText>
            <AppText variant="bodyMd" weight="semiBold" tabular style={styles.value}>
              {formatRupiah(average)}
            </AppText>
          </View>
        </View>

        <View style={styles.chart}>
          <LineChart
            points={points}
            height={116}
            accessibilityLabel={`Tren pengeluaran tujuh hari terakhir. ${description}. Total ${formatRupiah(
              total,
            )}, rata-rata ${formatRupiah(average)} per hari.`}
          />
        </View>

        {total === 0 ? (
          <AppText variant="labelSm" color={colors.textSubtle} style={styles.empty}>
            Belum ada pengeluaran minggu ini. Grafik terisi begitu kamu mencatat.
          </AppText>
        ) : null}

        {pendingCount > 0 ? (
          <AppText variant="labelSm" color={colors.textSubtle} style={styles.empty}>
            Termasuk {pendingCount} perubahan yang menunggu jaringan.
          </AppText>
        ) : null}
      </Card>
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    marginTop: space.xxl,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    gap: space.md,
  },
  headerCopy: {
    flex: 1,
    minWidth: 0,
  },
  card: {
    marginTop: space.lg,
  },
  totals: {
    flexDirection: 'row',
    gap: space.lg,
  },
  totalCell: {
    flex: 1,
    minWidth: 0,
  },
  divider: {
    width: 1,
    backgroundColor: colors.borderSubtle,
  },
  value: {
    marginTop: 2,
  },
  chart: {
    marginTop: space.lg,
  },
  empty: {
    marginTop: space.md,
  },
});
