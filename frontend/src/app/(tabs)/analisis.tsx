import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import {
  ArrowDownLeft,
  ArrowUpRight,
  ChevronLeft,
  ChevronRight,
  CircleAlert,
  ReceiptText,
  ShieldCheck,
  TriangleAlert,
} from 'lucide-react-native';
import { AppScaffold } from '@/components/AppScaffold';
import { AppText } from '@/components/AppText';
import { Card } from '@/components/Card';
import { DonutChart } from '@/components/DonutChart';
import { EmptyState } from '@/components/EmptyState';
import { LineChart } from '@/components/LineChart';
import {
  useAvailableMonths,
  useCategoryBreakdown,
  useDailyTrend,
  useMonthSummary,
} from '@/hooks/useData';
import type { MonthSummary } from '@/data/types';
import { colors, radii, space } from '@/theme/tokens';
import {
  currentMonthKey,
  dayNumber,
  formatMonthLabel,
  todayISO,
} from '@/utils/date';
import { formatRupiah } from '@/utils/format';

const EMPTY_SUMMARY: MonthSummary = {
  month: currentMonthKey(),
  income: 0,
  expense: 0,
  balance: 0,
  transactionCount: 0,
  incomeCount: 0,
  expenseCount: 0,
  todayExpense: 0,
};

type WarningLevel = 'safe' | 'warning' | 'over';

function getWarning(summary: MonthSummary) {
  if (summary.expense === 0) {
    return {
      level: 'safe' as WarningLevel,
      ratio: 0,
      title: 'Keuangan aman',
      detail: 'Belum ada pengeluaran bulan ini.',
    };
  }
  if (summary.income <= 0) {
    return {
      level: 'over' as WarningLevel,
      ratio: null,
      title: 'Lewat batas',
      detail: `Belum ada pemasukan bulan ini, tetapi pengeluaran sudah ${formatRupiah(
        summary.expense,
      )}.`,
    };
  }
  const ratio = (summary.expense / summary.income) * 100;
  const rounded = Math.round(ratio);
  if (ratio >= 100) {
    return {
      level: 'over' as WarningLevel,
      ratio,
      title: 'Lewat batas',
      detail: `Pengeluaran ${rounded}% dari pemasukan. Defisit ${formatRupiah(
        Math.abs(summary.balance),
      )}.`,
    };
  }
  if (ratio >= 80) {
    return {
      level: 'warning' as WarningLevel,
      ratio,
      title: 'Hampir boncos',
      detail: `Pengeluaran ${rounded}% dari pemasukan. Sisa ${formatRupiah(
        summary.balance,
      )}.`,
    };
  }
  return {
    level: 'safe' as WarningLevel,
    ratio,
    title: 'Keuangan aman',
    detail: `Pengeluaran ${rounded}% dari pemasukan. Sisa ${formatRupiah(
      summary.balance,
    )}.`,
  };
}

function WarningCard({
  level,
  title,
  detail,
}: {
  level: WarningLevel;
  title: string;
  detail: string;
}) {
  const tone =
    level === 'over'
      ? {
          background: colors.dangerSoft,
          border: colors.danger,
          color: colors.danger,
          Icon: CircleAlert,
        }
      : level === 'warning'
        ? {
            background: colors.warningSoft,
            border: colors.warning,
            color: colors.warning,
            Icon: TriangleAlert,
          }
        : {
            background: colors.positiveSoft,
            border: colors.positive,
            color: colors.positive,
            Icon: ShieldCheck,
          };
  const Icon = tone.Icon;
  return (
    <View
      accessibilityRole="alert"
      style={[
        styles.warningCard,
        { backgroundColor: tone.background, borderColor: tone.border },
      ]}
    >
      <View style={styles.warningHeader}>
        <Icon size={20} color={tone.color} />
        <AppText variant="bodySm" weight="semiBold" color={tone.color}>
          {title}
        </AppText>
      </View>
      <AppText variant="labelSm" color={tone.color} style={styles.warningDetail}>
        {detail}
      </AppText>
    </View>
  );
}

function SectionTitle({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <View>
      <AppText variant="bodyLg" style={styles.sectionTitle}>
        {title}
      </AppText>
      <AppText variant="labelSm" color={colors.textMuted}>
        {subtitle}
      </AppText>
    </View>
  );
}

export default function AnalyticsScreen() {
  const [month, setMonth] = useState(currentMonthKey());
  const { data: months } = useAvailableMonths();
  const { data: summary } = useMonthSummary(month);
  const { data: breakdown } = useCategoryBreakdown(month, 'expense');
  const { data: trend } = useDailyTrend(month);

  const safeSummary = summary ?? { ...EMPTY_SUMMARY, month };
  const warning = getWarning(safeSummary);
  const balance = safeSummary.balance;

  const monthIndex = months?.findIndex((item) => item.month === month) ?? -1;
  const canGoOlder = Boolean(
    months && monthIndex >= 0 && monthIndex < months.length - 1,
  );
  const canGoNewer = Boolean(months && monthIndex > 0);

  const goOlder = () => {
    if (!months || monthIndex < 0 || monthIndex >= months.length - 1) return;
    setMonth(months[monthIndex + 1]!.month);
  };
  const goNewer = () => {
    if (!months || monthIndex <= 0) return;
    setMonth(months[monthIndex - 1]!.month);
  };

  const trendDays = trend?.days ?? [];
  const trendPoints = trendDays.map((day) => ({
    value: day.expense,
    label: String(dayNumber(day.date)),
  }));
  const trendTotal = trend?.totalExpense ?? 0;
  const elapsedDays =
    month === currentMonthKey()
      ? Math.max(1, Number(todayISO().slice(8, 10)))
      : Math.max(1, trendDays.length);
  const dailyAverage = Math.round(trendTotal / elapsedDays);
  const highest = trendDays.reduce<{
    date: string;
    value: number;
    index: number;
  } | null>((best, day, index) => {
    if (day.expense <= 0) return best;
    if (!best || day.expense > best.value) {
      return { date: day.date, value: day.expense, index };
    }
    return best;
  }, null);
  const labelIndexes = [0, 7, 14, 21, 28].filter(
    (index) => index < trendPoints.length,
  );

  const comparisonMax = Math.max(
    safeSummary.income,
    safeSummary.expense,
    1,
  );
  const incomeWidth = (safeSummary.income / comparisonMax) * 100;
  const expenseWidth = (safeSummary.expense / comparisonMax) * 100;

  return (
    <AppScaffold>
      <View>
        <AppText
          variant="labelSm"
          weight="medium"
          color={colors.textSubtle}
          style={styles.eyebrow}
        >
          REKAP & GRAFIK
        </AppText>
        <AppText variant="headingSm" style={styles.title}>
          Analisis
        </AppText>
        <AppText variant="bodySm" color={colors.textMuted}>
          Lihat ke mana uangmu pergi dan jaga agar tidak boncos.
        </AppText>
      </View>

      <Card style={styles.monthCard} padded={false}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Bulan sebelumnya"
          onPress={goOlder}
          disabled={!canGoOlder}
          style={({ pressed }) => [
            styles.monthButton,
            { opacity: !canGoOlder ? 0.35 : pressed ? 0.6 : 1 },
          ]}
        >
          <ChevronLeft size={20} color={colors.textMuted} />
        </Pressable>
        <View style={styles.monthCopy} accessibilityLiveRegion="polite">
          <AppText variant="bodyLg" style={styles.monthLabel}>
            {formatMonthLabel(month)}
          </AppText>
          <AppText variant="labelSm" color={colors.textMuted}>
            Rekap bulanan
          </AppText>
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Bulan berikutnya"
          onPress={goNewer}
          disabled={!canGoNewer}
          style={({ pressed }) => [
            styles.monthButton,
            { opacity: !canGoNewer ? 0.35 : pressed ? 0.6 : 1 },
          ]}
        >
          <ChevronRight size={20} color={colors.textMuted} />
        </Pressable>
      </Card>

      {safeSummary.transactionCount === 0 ? (
        <View style={styles.empty}>
          <EmptyState
            icon={ReceiptText}
            title={`Belum ada catatan di ${formatMonthLabel(month)}`}
            description="Pilih bulan lain, atau catat transaksi pertamamu untuk melihat grafik dan rekap."
            actionLabel="Catat sekarang"
            onAction={() => router.navigate('/')}
          />
        </View>
      ) : (
        <>
          <View
            accessible
            accessibilityLabel={`Ringkasan ${formatMonthLabel(
              month,
            )}. Sisa ${formatRupiah(balance)}, pemasukan ${formatRupiah(
              safeSummary.income,
            )}, pengeluaran ${formatRupiah(safeSummary.expense)}.`}
            style={styles.summaryCard}
          >
            <AppText variant="labelSm" weight="semiBold" color={colors.onPrimary}>
              Sisa uang bulan ini
            </AppText>
            <AppText
              variant="headingMd"
              color={colors.canvas}
              tabular
              numberOfLines={1}
              adjustsFontSizeToFit
              style={styles.summaryAmount}
            >
              {formatRupiah(balance)}
            </AppText>
            <View style={styles.summaryTotals}>
              <View style={styles.summaryCell}>
                <View style={styles.summaryLabel}>
                  <ArrowDownLeft size={12} color={colors.onPrimary} />
                  <AppText variant="labelSm" weight="medium" color={colors.onPrimary}>
                    Masuk
                  </AppText>
                </View>
                <AppText variant="bodyMd" weight="semiBold" color={colors.canvas} tabular>
                  {formatRupiah(safeSummary.income)}
                </AppText>
              </View>
              <View style={[styles.summaryCell, styles.summaryDivider]}>
                <View style={styles.summaryLabel}>
                  <ArrowUpRight size={12} color={colors.onPrimary} />
                  <AppText variant="labelSm" weight="medium" color={colors.onPrimary}>
                    Keluar
                  </AppText>
                </View>
                <AppText variant="bodyMd" weight="semiBold" color={colors.canvas} tabular>
                  {formatRupiah(safeSummary.expense)}
                </AppText>
              </View>
            </View>
          </View>

          <WarningCard
            level={warning.level}
            title={warning.title}
            detail={warning.detail}
          />

          <View style={styles.section}>
            <SectionTitle
              title="Pengeluaran per kategori"
              subtitle={formatMonthLabel(month)}
            />
            <Card style={styles.sectionCard}>
              {breakdown && breakdown.items.length > 0 ? (
                <>
                  <View style={styles.donutWrap}>
                    <DonutChart
                      items={breakdown.items}
                      total={breakdown.total}
                      size={148}
                      label="Pengeluaran per kategori"
                    />
                  </View>
                  <View style={styles.legendGrid}>
                    {breakdown.items.map((item) => (
                      <View key={item.categoryId} style={styles.legendItem}>
                        <View
                          style={[styles.legendDot, { backgroundColor: item.color }]}
                        />
                        <View style={styles.legendCopy}>
                          <View style={styles.legendTop}>
                            <AppText
                              variant="labelSm"
                              weight="semiBold"
                              numberOfLines={1}
                              style={styles.legendName}
                            >
                              {item.name}
                            </AppText>
                            <AppText variant="labelSm" weight="semiBold" color={colors.textMuted}>
                              {Math.round(item.percentage)}%
                            </AppText>
                          </View>
                          <AppText variant="labelSm" color={colors.textMuted} tabular>
                            {formatRupiah(item.total)}
                          </AppText>
                        </View>
                      </View>
                    ))}
                  </View>
                </>
              ) : (
                <EmptyState
                  compact
                  icon={ReceiptText}
                  title="Belum ada pengeluaran"
                  description={`Tidak ada pengeluaran per kategori di ${formatMonthLabel(month)}.`}
                />
              )}
            </Card>
          </View>

          <View style={styles.section}>
            <SectionTitle title="Tren harian" subtitle={formatMonthLabel(month)} />
            <Card style={styles.sectionCard}>
              <View style={styles.metricRow}>
                <View style={styles.metricCell}>
                  <AppText variant="labelSm" color={colors.textMuted}>
                    Rata-rata/hari
                  </AppText>
                  <AppText variant="bodyMd" weight="semiBold" tabular style={styles.metricValue}>
                    {formatRupiah(dailyAverage)}
                  </AppText>
                </View>
                <View style={[styles.metricCell, styles.metricDivider]}>
                  <AppText variant="labelSm" color={colors.textMuted}>
                    Tertinggi
                  </AppText>
                  <AppText variant="bodyMd" weight="semiBold" tabular style={styles.metricValue}>
                    {formatRupiah(highest?.value ?? 0)}
                  </AppText>
                </View>
              </View>
              {trendPoints.length > 0 ? (
                <View style={styles.chart}>
                  <LineChart
                    points={trendPoints}
                    height={120}
                    labelIndexes={labelIndexes}
                    highlightIndex={highest?.index}
                    accessibilityLabel={`Tren pengeluaran harian ${formatMonthLabel(
                      month,
                    )}. Rata-rata ${formatRupiah(
                      dailyAverage,
                    )} per hari, tertinggi ${formatRupiah(highest?.value ?? 0)}.`}
                  />
                </View>
              ) : null}
            </Card>
          </View>

          <View style={styles.section}>
            <SectionTitle title="Masuk vs keluar" subtitle={formatMonthLabel(month)} />
            <Card style={styles.sectionCard}>
              <View>
                <View style={styles.flowHeader}>
                  <View style={styles.flowLabel}>
                    <View style={[styles.flowDot, { backgroundColor: colors.primary }]} />
                    <AppText variant="bodySm" weight="semiBold">
                      Masuk
                    </AppText>
                  </View>
                  <AppText variant="bodySm" weight="semiBold" tabular>
                    {formatRupiah(safeSummary.income)}
                  </AppText>
                </View>
                <View style={styles.flowTrack}>
                  <View
                    style={[
                      styles.flowFill,
                      { width: `${incomeWidth}%`, backgroundColor: colors.primary },
                    ]}
                  />
                </View>
              </View>
              <View style={styles.flowSecondRow}>
                <View style={styles.flowHeader}>
                  <View style={styles.flowLabel}>
                    <View style={[styles.flowDot, { backgroundColor: colors.pink }]} />
                    <AppText variant="bodySm" weight="semiBold">
                      Keluar
                    </AppText>
                  </View>
                  <AppText variant="bodySm" weight="semiBold" tabular>
                    {formatRupiah(safeSummary.expense)}
                  </AppText>
                </View>
                <View style={styles.flowTrack}>
                  <View
                    style={[
                      styles.flowFill,
                      { width: `${expenseWidth}%`, backgroundColor: colors.pink },
                    ]}
                  />
                </View>
              </View>
            </Card>
          </View>
        </>
      )}
    </AppScaffold>
  );
}

const styles = StyleSheet.create({
  eyebrow: {
    letterSpacing: 0.6,
  },
  title: {
    marginTop: 2,
  },
  monthCard: {
    marginTop: space.lg,
    padding: space.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: space.md,
  },
  monthButton: {
    width: 40,
    height: 40,
    borderRadius: radii.pill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
  },
  monthCopy: {
    flex: 1,
    alignItems: 'center',
    minWidth: 0,
  },
  monthLabel: {
    fontFamily: 'CalSans-Medium',
    textAlign: 'center',
  },
  empty: {
    marginTop: space.xl,
  },
  summaryCard: {
    marginTop: space.lg,
    padding: space.xxl,
    backgroundColor: colors.primary,
    borderRadius: radii.panel,
  },
  summaryAmount: {
    marginTop: space.md,
  },
  summaryTotals: {
    flexDirection: 'row',
    marginTop: space.xxl,
    paddingTop: space.xl,
    borderTopWidth: 1,
    borderTopColor: colors.primaryActive,
  },
  summaryCell: {
    flex: 1,
    gap: 2,
  },
  summaryDivider: {
    borderLeftWidth: 1,
    borderLeftColor: colors.primaryActive,
    paddingLeft: space.lg,
    marginLeft: space.lg,
  },
  summaryLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.xs,
  },
  warningCard: {
    marginTop: space.lg,
    padding: space.lg,
    borderRadius: radii.card,
    borderWidth: 1,
  },
  warningHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
  },
  warningDetail: {
    marginTop: space.sm,
  },
  section: {
    marginTop: space.xxl,
  },
  sectionTitle: {
    fontFamily: 'CalSans-Medium',
  },
  sectionCard: {
    marginTop: space.lg,
  },
  donutWrap: {
    alignItems: 'center',
  },
  legendGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: space.lg,
    marginTop: space.xl,
  },
  legendItem: {
    width: '47%',
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: space.xs,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: radii.pill,
    marginTop: 4,
    flexShrink: 0,
  },
  legendCopy: {
    flex: 1,
    minWidth: 0,
  },
  legendTop: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    gap: space.xs,
  },
  legendName: {
    flex: 1,
    minWidth: 0,
  },
  metricRow: {
    flexDirection: 'row',
    gap: space.lg,
  },
  metricCell: {
    flex: 1,
    gap: 2,
  },
  metricDivider: {
    borderLeftWidth: 1,
    borderLeftColor: colors.borderSubtle,
    paddingLeft: space.lg,
  },
  metricValue: {
    marginTop: space.xs,
  },
  chart: {
    marginTop: space.xl,
  },
  flowHeader: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    gap: space.md,
  },
  flowLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.xs,
  },
  flowDot: {
    width: 8,
    height: 8,
    borderRadius: radii.pill,
  },
  flowTrack: {
    marginTop: space.md,
    height: 8,
    borderRadius: radii.pill,
    backgroundColor: colors.surfaceMuted,
    overflow: 'hidden',
  },
  flowFill: {
    height: '100%',
    borderRadius: radii.pill,
  },
  flowSecondRow: {
    marginTop: space.xl,
  },
});
