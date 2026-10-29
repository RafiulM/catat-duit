import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import * as Haptics from 'expo-haptics';
import { Pencil, Trash2 } from 'lucide-react-native';
import { AppText } from '@/components/AppText';
import { Button } from '@/components/Button';
import { CategoryBadge } from '@/components/CategoryBadge';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { Sheet } from '@/components/Sheet';
import type { Category, Transaction } from '@/data/types';
import { colors, radii, space } from '@/theme/tokens';
import { formatDateLong, formatTime } from '@/utils/date';
import { formatRupiahSigned } from '@/utils/format';

type TransactionDetailSheetProps = {
  visible: boolean;
  transaction: Transaction | null;
  category?: Category;
  onClose: () => void;
  onEdit: (transaction: Transaction) => void;
  onDelete: (transaction: Transaction) => Promise<void>;
};

function statusCopy(transaction: Transaction): { label: string; color: string; background: string } {
  switch (transaction.syncStatus) {
    case 'synced':
      return {
        label: 'Tersimpan di server',
        color: colors.positive,
        background: colors.positiveSoft,
      };
    case 'pending':
      return {
        label: 'Menunggu jaringan',
        color: colors.warning,
        background: colors.warningSoft,
      };
    case 'failed':
      return {
        label: 'Belum terkirim',
        color: colors.danger,
        background: colors.dangerSoft,
      };
    default:
      return {
        label: 'Tersimpan di perangkat',
        color: colors.textMuted,
        background: colors.surfaceMuted,
      };
  }
}

export function TransactionDetailSheet({
  visible,
  transaction,
  category,
  onClose,
  onEdit,
  onDelete,
}: TransactionDetailSheetProps) {
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState('');

  if (!transaction) return null;

  const status = statusCopy(transaction);
  const isIncome = transaction.type === 'income';

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await onDelete(transaction);
      setConfirmDelete(false);
      setDeleting(false);
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    } catch (deleteError) {
      setConfirmDelete(false);
      setDeleting(false);
      setError(
        deleteError instanceof Error
          ? deleteError.message
          : 'Transaksi gagal dihapus. Coba lagi.',
      );
    }
  };

  return (
    <>
      <Sheet
        visible={visible}
        onClose={() => {
          setConfirmDelete(false);
          setDeleting(false);
          setError('');
          onClose();
        }}
        title="Detail transaksi"
        subtitle="Lihat, perbaiki, atau hapus catatan ini."
        overlay={
          <ConfirmDialog
            inline
            visible={confirmDelete}
            title="Hapus transaksi ini?"
            message={`${transaction.note} akan dihapus. Tindakan ini tidak bisa dibatalkan.`}
            confirmLabel={deleting ? 'Menghapus…' : 'Hapus'}
            onConfirm={() => void handleDelete()}
            onCancel={() => setConfirmDelete(false)}
          />
        }
      >
        <View style={styles.amountBlock}>
          <AppText
            variant="labelSm"
            weight="medium"
            color={colors.textMuted}
            align="center"
          >
            {isIncome ? 'Pemasukan' : 'Pengeluaran'}
          </AppText>
          <AppText
            variant="headingMd"
            color={isIncome ? colors.positive : colors.text}
            tabular
            align="center"
            numberOfLines={1}
            adjustsFontSizeToFit
            style={styles.amount}
          >
            {formatRupiahSigned(transaction.amount, transaction.type)}
          </AppText>
          <View
            style={[
              styles.statusChip,
              { backgroundColor: status.background },
            ]}
          >
            <AppText variant="labelSm" weight="semiBold" color={status.color}>
              {status.label}
            </AppText>
          </View>
        </View>

        <View style={styles.details}>
          <View style={styles.detailRow}>
            <AppText variant="labelSm" color={colors.textMuted}>
              Kategori
            </AppText>
            <View style={styles.categoryValue}>
              <CategoryBadge category={category} size={24} radius={8} />
              <AppText variant="bodySm" weight="medium">
                {category?.name ?? 'Tanpa kategori'}
              </AppText>
            </View>
          </View>
          <View style={styles.detailRow}>
            <AppText variant="labelSm" color={colors.textMuted}>
              Tanggal transaksi
            </AppText>
            <AppText variant="bodySm" weight="medium" style={styles.detailValue}>
              {formatDateLong(transaction.transactionDate)}
            </AppText>
          </View>
          <View style={styles.detailRow}>
            <AppText variant="labelSm" color={colors.textMuted}>
              Dicatat
            </AppText>
            <AppText variant="bodySm" weight="medium" style={styles.detailValue}>
              {formatTime(transaction.createdAt)}
            </AppText>
          </View>
          <View style={[styles.detailRow, styles.noteRow]}>
            <AppText variant="labelSm" color={colors.textMuted}>
              Catatan
            </AppText>
            <AppText variant="bodySm" style={styles.detailValue}>
              {transaction.note || '—'}
            </AppText>
          </View>
        </View>

        {error ? (
          <AppText
            variant="labelSm"
            color={colors.danger}
            style={styles.error}
            accessibilityLiveRegion="polite"
          >
            {error}
          </AppText>
        ) : null}

        <View style={styles.actions}>
          <Button
            label="Edit"
            onPress={() => onEdit(transaction)}
            icon={Pencil}
            variant="secondary"
            testID="detail-edit"
            style={styles.action}
          />
          <Button
            label="Hapus"
            onPress={() => setConfirmDelete(true)}
            icon={Trash2}
            variant="danger"
            testID="detail-delete"
            style={styles.action}
          />
        </View>
      </Sheet>
    </>
  );
}

const styles = StyleSheet.create({
  amountBlock: {
    alignItems: 'center',
  },
  amount: {
    marginTop: space.xs,
  },
  statusChip: {
    marginTop: space.md,
    paddingHorizontal: space.lg,
    paddingVertical: space.xs,
    borderRadius: radii.pill,
  },
  details: {
    marginTop: space.xxl,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    borderRadius: radii.card,
    paddingHorizontal: space.xl,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: space.lg,
    paddingVertical: space.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderSubtle,
  },
  noteRow: {
    alignItems: 'flex-start',
    borderBottomWidth: 0,
  },
  detailValue: {
    flex: 1,
    textAlign: 'right',
  },
  categoryValue: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    flexShrink: 0,
  },
  error: {
    marginTop: space.lg,
  },
  actions: {
    flexDirection: 'row',
    gap: space.md,
    marginTop: space.xxl,
    marginBottom: space.md,
  },
  action: {
    flex: 1,
  },
});
