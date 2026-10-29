import { useEffect, useRef, useState } from 'react';
import {
  Pressable,
  StyleSheet,
  TextInput,
  View,
  type TextInputInstance,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import {
  ArrowDownLeft,
  ArrowUpRight,
  CalendarDays,
  Check,
  Shapes,
  Trash2,
} from 'lucide-react-native';
import { AppText } from '@/components/AppText';
import { Button } from '@/components/Button';
import { Chip } from '@/components/Chip';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { DatePickerModal } from '@/components/DatePickerModal';
import { SegmentedControl } from '@/components/SegmentedControl';
import { Sheet } from '@/components/Sheet';
import { TextField } from '@/components/TextField';
import { CATEGORY_ICONS, categoriesForType } from '@/data/categories';
import type {
  Category,
  NewTransactionInput,
  Transaction,
  TransactionType,
} from '@/data/types';
import { colors, radii, space } from '@/theme/tokens';
import {
  formatDateLong,
  todayISO,
} from '@/utils/date';
import {
  formatAmountInput,
  formatCompactRupiah,
  parseAmountInput,
} from '@/utils/format';

type TransactionFormSheetProps = {
  visible: boolean;
  mode: TransactionType;
  initial?: Transaction | null;
  categories: Category[];
  onClose: () => void;
  onSave: (input: NewTransactionInput) => Promise<void>;
  onDelete?: (transaction: Transaction) => Promise<void>;
};

const QUICK_AMOUNTS: Record<TransactionType, number[]> = {
  expense: [10_000, 25_000, 50_000, 100_000],
  income: [500_000, 1_000_000, 2_000_000, 5_000_000],
};

export function TransactionFormSheet({
  visible,
  mode,
  initial,
  categories,
  onClose,
  onSave,
  onDelete,
}: TransactionFormSheetProps) {
  const editing = Boolean(initial);
  const [type, setType] = useState<TransactionType>(initial?.type ?? mode);
  const [amount, setAmount] = useState(initial?.amount ?? 0);
  const [categoryId, setCategoryId] = useState(initial?.categoryId ?? '');
  const [note, setNote] = useState(initial?.note ?? '');
  const [date, setDate] = useState(initial?.transactionDate ?? todayISO());
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [amountFocused, setAmountFocused] = useState(false);
  const [datePickerOpen, setDatePickerOpen] = useState(false);
  const amountRef = useRef<TextInputInstance>(null);

  const available = categoriesForType(categories, type);

  useEffect(() => {
    if (!visible) return;
    const nextType = initial?.type ?? mode;
    // Reset the form for each new/edited transaction session.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setType(nextType);
    setAmount(initial?.amount ?? 0);
    setNote(initial?.note ?? '');
    setDate(initial?.transactionDate ?? todayISO());
    setError('');
    setSaving(false);
    setDeleting(false);
    setConfirmDelete(false);
    const initialCategory = categoriesForType(categories, nextType).find(
      (category) => category.id === initial?.categoryId,
    );
    setCategoryId(
      initialCategory?.id ??
        categoriesForType(categories, nextType)[0]?.id ??
        '',
    );
    const timer = setTimeout(() => amountRef.current?.focus(), 420);
    return () => clearTimeout(timer);
    // Resetting only when the sheet opens (or the edited record changes) keeps
    // the form stable while the categories query refreshes in the background.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible, initial, mode]);

  const effectiveCategoryId = available.some(
    (category) => category.id === categoryId,
  )
    ? categoryId
    : (available[0]?.id ?? '');

  const handleSave = async () => {
    if (saving) return;
    if (!amount) {
      setError('Masukkan nominal dulu, ya.');
      amountRef.current?.focus();
      return;
    }
    if (!effectiveCategoryId) {
      setError('Pilih kategori untuk transaksi ini.');
      return;
    }

    setSaving(true);
    setError('');
    try {
      await onSave({
        categoryId: effectiveCategoryId,
        type,
        amount,
        note: note.trim(),
        transactionDate: date,
      });
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (saveError) {
      setError(
        saveError instanceof Error
          ? saveError.message
          : 'Transaksi gagal disimpan. Coba lagi.',
      );
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!initial || !onDelete) return;
    setDeleting(true);
    try {
      await onDelete(initial);
      setConfirmDelete(false);
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    } catch (deleteError) {
      setConfirmDelete(false);
      setError(
        deleteError instanceof Error
          ? deleteError.message
          : 'Transaksi gagal dihapus. Coba lagi.',
      );
      setDeleting(false);
    }
  };

  const title = editing
    ? 'Edit transaksi'
    : type === 'expense'
      ? 'Catat pengeluaran'
      : 'Catat pemasukan';

  const dateLabel =
    date === todayISO()
      ? `Hari ini · ${formatDateLong(date)}`
      : formatDateLong(date);

  return (
    <>
      <Sheet
        visible={visible}
        onClose={onClose}
        title={title}
        subtitle={editing ? 'Perbaiki catatan tanpa mengubah riwayat lain.' : 'Tiga ketukan, selesai.'}
        accessibilityLabel={title}
        footer={
          <View>
            {error ? (
              <AppText
                variant="labelSm"
                color={colors.danger}
                style={styles.footerError}
                accessibilityLiveRegion="polite"
              >
                {error}
              </AppText>
            ) : null}
            <Button
              label={
                editing
                  ? 'Simpan perubahan'
                  : type === 'expense'
                    ? 'Simpan pengeluaran'
                    : 'Simpan pemasukan'
              }
              onPress={() => void handleSave()}
              icon={Check}
              loading={saving}
              testID="transaction-save"
              fullWidth
            />
          </View>
        }
        overlay={
          <>
            <DatePickerModal
              inline
              visible={datePickerOpen}
              value={date}
              onSelect={setDate}
              onClose={() => setDatePickerOpen(false)}
            />
            <ConfirmDialog
              inline
              visible={confirmDelete}
              title="Hapus transaksi ini?"
              message={`${initial?.note ?? 'Transaksi'} akan dihapus. Tindakan ini tidak bisa dibatalkan.`}
              confirmLabel={deleting ? 'Menghapus…' : 'Hapus'}
              onConfirm={() => void handleDelete()}
              onCancel={() => setConfirmDelete(false)}
            />
          </>
        }
      >
        <SegmentedControl
          label="Jenis transaksi"
          value={type}
          onChange={(nextType) => {
            setType(nextType);
            const nextCategories = categoriesForType(categories, nextType);
            if (!nextCategories.some((category) => category.id === categoryId)) {
              setCategoryId(nextCategories[0]?.id ?? '');
            }
            setError('');
          }}
          options={[
            { value: 'expense', label: 'Pengeluaran', icon: ArrowUpRight },
            { value: 'income', label: 'Pemasukan', icon: ArrowDownLeft },
          ]}
        />

        <View style={styles.block}>
          <AppText variant="labelSm" weight="semiBold" color={colors.textMuted}>
            Nominal
          </AppText>
          <Pressable
            onPress={() => amountRef.current?.focus()}
            style={[
              styles.amountBox,
              amountFocused ? styles.amountBoxFocused : null,
              error && !amount ? styles.amountBoxError : null,
            ]}
          >
            <AppText
              variant="bodyLg"
              weight="medium"
              color={colors.textMuted}
              style={styles.rupiahPrefix}
            >
              Rp
            </AppText>
            <TextInput
              ref={amountRef}
              testID="transaction-amount"
              accessibilityLabel="Nominal transaksi dalam Rupiah"
              keyboardType="number-pad"
              inputMode="numeric"
              value={amount ? formatAmountInput(amount) : ''}
              onChangeText={(text) => {
                setAmount(parseAmountInput(text));
                if (error) setError('');
              }}
              onFocus={() => setAmountFocused(true)}
              onBlur={() => setAmountFocused(false)}
              placeholder="0"
              placeholderTextColor={colors.textDisabled}
              selectionColor={colors.selection}
              maxLength={16}
              style={styles.amountInput}
            />
          </Pressable>

          <View style={styles.quickRow}>
            {QUICK_AMOUNTS[type].map((value) => (
              <Chip
                key={value}
                label={formatCompactRupiah(value).replace('Rp', '')}
                selected={amount === value}
                onPress={() => {
                  setAmount(value);
                  setError('');
                }}
              />
            ))}
          </View>

          <AppText variant="labelSm" color={colors.textMuted} style={styles.helper}>
            {amount
              ? 'Tekan simpan untuk mencatat transaksi ini.'
              : 'Isi nominal, pilih kategori, lalu simpan.'}
          </AppText>
        </View>

        <View style={styles.block}>
          <AppText variant="labelSm" weight="semiBold" color={colors.textMuted}>
            Kategori
          </AppText>
          {available.length > 0 ? (
            <View style={styles.categoryGrid}>
              {available.map((category) => {
                const selected = category.id === effectiveCategoryId;
                const Icon = CATEGORY_ICONS[category.icon] ?? Shapes;
                return (
                  <Pressable
                    key={category.id}
                    accessibilityRole="button"
                    accessibilityLabel={`Kategori ${category.name}`}
                    testID={`category-${category.id}`}
                    accessibilityState={{ selected }}
                    onPress={() => {
                      setCategoryId(category.id);
                      setError('');
                    }}
                    style={({ pressed }) => [
                      styles.categoryButton,
                      selected ? styles.categorySelected : null,
                      { opacity: pressed ? 0.7 : 1 },
                    ]}
                  >
                    {selected ? (
                      <View style={styles.categoryCheck}>
                        <Check size={12} color={colors.primary} />
                      </View>
                    ) : null}
                    <View
                      style={[
                        styles.categoryIcon,
                        { backgroundColor: category.color },
                      ]}
                    >
                      <Icon size={16} color={colors.text} />
                    </View>
                    <AppText
                      variant="labelSm"
                      weight="medium"
                      align="center"
                      numberOfLines={2}
                    >
                      {category.name}
                    </AppText>
                  </Pressable>
                );
              })}
            </View>
          ) : (
            <AppText variant="bodySm" color={colors.textMuted} style={styles.helper}>
              Kategori belum tersedia. Coba buka lagi sebentar.
            </AppText>
          )}
        </View>

        <View style={styles.block}>
          <TextField
            label="Catatan (opsional)"
            value={note}
            onChangeText={setNote}
            placeholder="Mis. kopi pagi"
            maxLength={60}
            returnKeyType="done"
          />
        </View>

        <View style={styles.block}>
          <AppText variant="labelSm" weight="semiBold" color={colors.textMuted}>
            Tanggal
          </AppText>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Tanggal transaksi ${dateLabel}. Ubah tanggal`}
            onPress={() => setDatePickerOpen(true)}
            style={({ pressed }) => [
              styles.dateField,
              { opacity: pressed ? 0.7 : 1 },
            ]}
          >
            <View style={styles.dateIcon}>
              <CalendarDays size={16} color={colors.primary} />
            </View>
            <AppText variant="bodySm" style={styles.dateText} numberOfLines={1}>
              {dateLabel}
            </AppText>
            <AppText variant="labelSm" weight="semiBold" color={colors.primary}>
              Ubah
            </AppText>
          </Pressable>
        </View>

        {editing && onDelete ? (
          <Button
            label="Hapus transaksi"
            onPress={() => setConfirmDelete(true)}
            icon={Trash2}
            variant="danger"
            fullWidth
            style={styles.delete}
          />
        ) : null}
      </Sheet>
    </>
  );
}

const styles = StyleSheet.create({
  block: {
    marginTop: space.lg,
  },
  amountBox: {
    marginTop: space.md,
    minHeight: 56,
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    paddingHorizontal: space.xl,
    paddingVertical: space.sm,
    backgroundColor: colors.canvas,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.card,
  },
  amountBoxFocused: {
    borderColor: colors.primary,
    shadowColor: colors.focusRing,
    shadowOpacity: 0.3,
    shadowRadius: 3,
    shadowOffset: { width: 0, height: 0 },
  },
  amountBoxError: {
    borderColor: colors.danger,
  },
  rupiahPrefix: {
    fontFamily: 'CalSans-Medium',
  },
  amountInput: {
    flex: 1,
    minWidth: 0,
    padding: 0,
    fontFamily: 'CalSans-Medium',
    fontSize: 34,
    lineHeight: 40,
    letterSpacing: -0.4,
    color: colors.text,
    fontVariant: ['tabular-nums'],
  },
  quickRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: space.md,
    marginTop: space.md,
  },
  helper: {
    marginTop: space.md,
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: space.xs,
    marginTop: space.md,
  },
  categoryButton: {
    width: '31.4%',
    minHeight: 62,
    paddingVertical: space.xs,
    paddingHorizontal: space.xs,
    alignItems: 'center',
    justifyContent: 'center',
    gap: space.xs,
    backgroundColor: colors.canvas,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    borderRadius: radii.control,
  },
  categorySelected: {
    backgroundColor: colors.surface,
    borderColor: colors.primary,
  },
  categoryCheck: {
    position: 'absolute',
    top: space.xs,
    right: space.xs,
  },
  categoryIcon: {
    width: 28,
    height: 28,
    borderRadius: radii.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dateField: {
    marginTop: space.md,
    minHeight: 48,
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    paddingHorizontal: space.lg,
    backgroundColor: colors.canvas,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.control,
  },
  dateIcon: {
    width: 28,
    height: 28,
    borderRadius: radii.pill,
    backgroundColor: colors.mint,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  dateText: {
    flex: 1,
    minWidth: 0,
  },
  footerError: {
    marginBottom: space.md,
  },
  delete: {
    marginTop: space.lg,
    marginBottom: space.md,
  },
});
