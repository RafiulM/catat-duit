import { Pressable, StyleSheet, View } from 'react-native';
import { CloudOff, TriangleAlert } from 'lucide-react-native';
import { AppText } from './AppText';
import { CategoryBadge } from './CategoryBadge';
import { colors, radii, space } from '@/theme/tokens';
import type { Category, Transaction } from '@/data/types';
import { formatDateLabel, formatTime } from '@/utils/date';
import { formatRupiahSigned } from '@/utils/format';

type TransactionRowProps = {
  transaction: Transaction;
  category?: Category;
  onPress?: () => void;
  first?: boolean;
  showDate?: boolean;
  showSyncStatus?: boolean;
};

export function TransactionRow({
  transaction,
  category,
  onPress,
  first = false,
  showDate = false,
  showSyncStatus = false,
}: TransactionRowProps) {
  const isIncome = transaction.type === 'income';
  const categoryName = category?.name ?? 'Tanpa kategori';
  const noteIsCategory = transaction.note === categoryName;
  const metaParts: string[] = [];
  if (showDate) metaParts.push(formatDateLabel(transaction.transactionDate));
  if (!noteIsCategory) metaParts.push(categoryName);
  metaParts.push(formatTime(transaction.createdAt));

  const pending =
    showSyncStatus &&
    (transaction.syncStatus === 'pending' || transaction.syncStatus === 'failed');
  const failed = showSyncStatus && transaction.syncStatus === 'failed';

  return (
    <Pressable
      accessibilityRole={onPress ? 'button' : undefined}
      accessibilityLabel={
        onPress
          ? `Lihat detail ${transaction.note}, ${formatRupiahSigned(
              transaction.amount,
              transaction.type,
            )}, ${categoryName}`
          : undefined
      }
      onPress={onPress}
      disabled={!onPress}
      style={({ pressed }) => [
        styles.row,
        !first ? styles.divider : null,
        { opacity: pressed && onPress ? 0.65 : 1 },
      ]}
    >
      <CategoryBadge category={category} />
      <View style={styles.copy}>
        <AppText variant="bodySm" weight="semiBold" numberOfLines={1}>
          {transaction.note}
        </AppText>
        <View style={styles.metaRow}>
          <AppText variant="labelSm" color={colors.textMuted} numberOfLines={1}>
            {metaParts.join(' · ')}
          </AppText>
          {pending ? (
            <View
              style={[
                styles.statusChip,
                failed ? styles.statusFailed : styles.statusPending,
              ]}
              accessibilityLabel={
                failed
                  ? 'Gagal dikirim ke server'
                  : 'Menunggu koneksi untuk dikirim ke server'
              }
            >
              {failed ? (
                <TriangleAlert size={12} color={colors.danger} />
              ) : (
                <CloudOff size={12} color={colors.warning} />
              )}
              <AppText
                variant="labelSm"
                weight="medium"
                color={failed ? colors.danger : colors.warning}
              >
                {failed ? 'Belum terkirim' : 'Menunggu'}
              </AppText>
            </View>
          ) : null}
        </View>
      </View>
      <AppText
        variant="bodySm"
        weight="semiBold"
        color={isIncome ? colors.positive : colors.text}
        tabular
        numberOfLines={1}
        style={styles.amount}
      >
        {formatRupiahSigned(transaction.amount, transaction.type)}
      </AppText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    minHeight: 64,
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.lg,
    paddingVertical: space.lg,
  },
  divider: {
    borderTopWidth: 1,
    borderTopColor: colors.borderSubtle,
  },
  copy: {
    flex: 1,
    minWidth: 0,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.xs,
    flexWrap: 'wrap',
    marginTop: 2,
  },
  statusChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    paddingHorizontal: space.sm,
    paddingVertical: 1,
    borderRadius: radii.pill,
  },
  statusPending: {
    backgroundColor: colors.warningSoft,
  },
  statusFailed: {
    backgroundColor: colors.dangerSoft,
  },
  amount: {
    flexShrink: 0,
    textAlign: 'right',
  },
});
