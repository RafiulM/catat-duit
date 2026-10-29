import { useDeferredValue, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import { ReceiptText, Search, X } from 'lucide-react-native';
import { AppScaffold } from '@/components/AppScaffold';
import { AppText } from '@/components/AppText';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { Chip } from '@/components/Chip';
import { EmptyState } from '@/components/EmptyState';
import { SegmentedControl } from '@/components/SegmentedControl';
import { TextField } from '@/components/TextField';
import { TransactionRow } from '@/components/TransactionRow';
import { useToast } from '@/components/Toast';
import {
  editTransaction,
  removeTransaction,
} from '@/features/transactions/actions';
import { TransactionDetailSheet } from '@/features/transactions/TransactionDetailSheet';
import { TransactionFormSheet } from '@/features/transactions/TransactionFormSheet';
import { useCategories, useTransactions } from '@/hooks/useData';
import { useAuthStore } from '@/stores/auth-store';
import { categoriesForType } from '@/data/categories';
import type {
  NewTransactionInput,
  Transaction,
  TransactionFilters,
  TransactionType,
} from '@/data/types';
import { colors, radii, space } from '@/theme/tokens';
import {
  addDays,
  currentMonthKey,
  formatGroupDate,
  todayISO,
} from '@/utils/date';
import { formatCount, formatRupiah } from '@/utils/format';

type PeriodFilter = 'all' | '7d' | 'month';
type TypeFilter = 'all' | TransactionType;

export default function HistoryScreen() {
  const { showToast } = useToast();
  const today = todayISO();
  const { data: categories = [] } = useCategories();
  const status = useAuthStore((state) => state.status);
  const authed = status === 'authed';

  const [search, setSearch] = useState('');
  const deferredSearch = useDeferredValue(search);
  const [typeFilter, setTypeFilter] = useState<TypeFilter>('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [periodFilter, setPeriodFilter] = useState<PeriodFilter>('all');
  const [selected, setSelected] = useState<Transaction | null>(null);
  const [formVisible, setFormVisible] = useState(false);
  const [formInitial, setFormInitial] = useState<Transaction | null>(null);
  const [formMode, setFormMode] = useState<TransactionType>('expense');

  const filters = useMemo<TransactionFilters>(() => {
    const next: TransactionFilters = {
      search: deferredSearch || undefined,
      type: typeFilter,
      categoryId: categoryFilter,
      limit: 500,
    };
    if (periodFilter === '7d') {
      next.from = addDays(today, -6);
      next.to = today;
    }
    if (periodFilter === 'month') {
      next.month = currentMonthKey();
    }
    return next;
  }, [deferredSearch, typeFilter, categoryFilter, periodFilter, today]);

  const { data: transactions = [] } = useTransactions(filters);

  const categoryById = useMemo(
    () => new Map(categories.map((category) => [category.id, category])),
    [categories],
  );

  const filterCategories = useMemo(() => {
    if (typeFilter === 'all') {
      return categories.filter((category) => !category.isArchived);
    }
    return categoriesForType(categories, typeFilter);
  }, [categories, typeFilter]);

  const grouped = useMemo(() => {
    const groups: { date: string; items: Transaction[] }[] = [];
    for (const transaction of transactions) {
      const last = groups[groups.length - 1];
      if (last && last.date === transaction.transactionDate) {
        last.items.push(transaction);
      } else {
        groups.push({ date: transaction.transactionDate, items: [transaction] });
      }
    }
    return groups;
  }, [transactions]);

  const hasFilters =
    Boolean(search) ||
    typeFilter !== 'all' ||
    categoryFilter !== 'all' ||
    periodFilter !== 'all';

  const totalExpense = transactions
    .filter((transaction) => transaction.type === 'expense')
    .reduce((total, transaction) => total + transaction.amount, 0);

  const resetFilters = () => {
    setSearch('');
    setTypeFilter('all');
    setCategoryFilter('all');
    setPeriodFilter('all');
  };

  const openEdit = (transaction: Transaction) => {
    setSelected(null);
    setFormInitial(transaction);
    setFormMode(transaction.type);
    setFormVisible(true);
  };

  const closeForm = () => {
    setFormVisible(false);
    setFormInitial(null);
  };

  const handleSave = async (input: NewTransactionInput) => {
    if (!formInitial) return;
    const category = categoryById.get(input.categoryId);
    await editTransaction(formInitial.id, input);
    showToast({
      title: 'Transaksi diperbarui',
      detail: `${formatRupiah(input.amount)} · ${category?.name ?? 'Kategori'}`,
    });
    closeForm();
  };

  const handleDelete = async (transaction: Transaction) => {
    await removeTransaction(transaction.id);
    showToast({
      title: 'Transaksi dihapus',
      detail: `${transaction.note} · ${formatRupiah(transaction.amount)}`,
    });
    setSelected(null);
    closeForm();
  };

  return (
    <AppScaffold>
      <View>
        <AppText
          variant="labelSm"
          weight="medium"
          color={colors.textSubtle}
          style={styles.eyebrow}
        >
          CATATAN KEUANGAN
        </AppText>
        <AppText variant="headingSm" style={styles.title}>
          Riwayat
        </AppText>
        <AppText variant="bodySm" color={colors.textMuted}>
          Cari, filter, dan rapikan semua catatan uangmu.
        </AppText>
      </View>

      <Card style={styles.filterCard}>
        <AppText variant="labelSm" weight="semiBold" color={colors.textMuted}>
          Cari transaksi
        </AppText>
        <TextField
          value={search}
          onChangeText={setSearch}
          placeholder="Kata kunci atau kategori"
          returnKeyType="search"
          autoCorrect={false}
          containerStyle={styles.searchField}
          left={<Search size={16} color={colors.textMuted} />}
          right={
            search ? (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Bersihkan pencarian"
                onPress={() => setSearch('')}
                hitSlop={8}
                style={styles.clearSearch}
              >
                <X size={14} color={colors.textMuted} />
              </Pressable>
            ) : null
          }
        />

        <View style={styles.filterBlock}>
          <AppText variant="labelSm" weight="semiBold" color={colors.textMuted}>
            Jenis
          </AppText>
          <SegmentedControl
            label="Filter jenis transaksi"
            value={typeFilter}
            onChange={(nextType) => {
              setTypeFilter(nextType);
              if (
                nextType !== 'all' &&
                categoryFilter !== 'all' &&
                !categoriesForType(categories, nextType).some(
                  (category) => category.id === categoryFilter,
                )
              ) {
                setCategoryFilter('all');
              }
            }}
            options={[
              { value: 'all', label: 'Semua' },
              { value: 'income', label: 'Masuk' },
              { value: 'expense', label: 'Keluar' },
            ]}
            style={styles.typeControl}
          />
        </View>

        <View style={styles.filterBlock}>
          <AppText variant="labelSm" weight="semiBold" color={colors.textMuted}>
            Kategori
          </AppText>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.chipScroll}
            contentContainerStyle={styles.chipRow}
          >
            <Chip
              label="Semua kategori"
              selected={categoryFilter === 'all'}
              onPress={() => setCategoryFilter('all')}
            />
            {filterCategories.map((category) => (
              <Chip
                key={category.id}
                label={category.name}
                selected={categoryFilter === category.id}
                onPress={() => setCategoryFilter(category.id)}
              />
            ))}
          </ScrollView>
        </View>

        <View style={styles.filterBlock}>
          <AppText variant="labelSm" weight="semiBold" color={colors.textMuted}>
            Periode
          </AppText>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.chipScroll}
            contentContainerStyle={styles.chipRow}
          >
            {(
              [
                { value: 'all', label: 'Semua waktu' },
                { value: '7d', label: '7 hari terakhir' },
                { value: 'month', label: 'Bulan ini' },
              ] as { value: PeriodFilter; label: string }[]
            ).map((option) => (
              <Chip
                key={option.value}
                label={option.label}
                selected={periodFilter === option.value}
                onPress={() => setPeriodFilter(option.value)}
              />
            ))}
          </ScrollView>
        </View>

        {hasFilters ? (
          <Button
            label="Reset filter"
            onPress={resetFilters}
            variant="ghost"
            size="sm"
            style={styles.reset}
          />
        ) : null}
      </Card>

      <View style={styles.listHeader}>
        <AppText variant="bodySm" color={colors.textMuted}>
          {formatCount(transactions.length, 'transaksi')} ditemukan
        </AppText>
        {transactions.length > 0 ? (
          <AppText variant="bodySm" weight="medium" tabular>
            Keluar {formatRupiah(totalExpense)}
          </AppText>
        ) : null}
      </View>

      {grouped.length > 0 ? (
        grouped.map((group) => (
          <View key={group.date} style={styles.group}>
            <View style={styles.groupHeader}>
              <AppText variant="bodyMd" weight="medium">
                {formatGroupDate(group.date)}
              </AppText>
              <AppText variant="labelSm" color={colors.textSubtle}>
                {group.items.length} transaksi
              </AppText>
            </View>
            <View style={styles.listCard}>
              {group.items.map((transaction, index) => (
                <TransactionRow
                  key={transaction.id}
                  transaction={transaction}
                  category={categoryById.get(transaction.categoryId)}
                  first={index === 0}
                  onPress={() => setSelected(transaction)}
                  showSyncStatus={authed}
                />
              ))}
            </View>
          </View>
        ))
      ) : (
        <View style={styles.empty}>
          <EmptyState
            icon={ReceiptText}
            title={hasFilters ? 'Transaksi tidak ditemukan' : 'Belum ada catatan'}
            description={
              hasFilters
                ? 'Coba kata kunci lain atau reset filter untuk melihat semua catatan.'
                : 'Catatan pertamamu akan muncul di sini setelah disimpan.'
            }
            actionLabel={hasFilters ? 'Reset filter' : 'Catat sekarang'}
            onAction={hasFilters ? resetFilters : () => router.navigate('/')}
          />
        </View>
      )}

      <TransactionFormSheet
        visible={formVisible}
        mode={formMode}
        initial={formInitial}
        categories={categories}
        onClose={closeForm}
        onSave={handleSave}
        onDelete={formInitial ? handleDelete : undefined}
      />

      <TransactionDetailSheet
        visible={Boolean(selected)}
        transaction={selected}
        category={selected ? categoryById.get(selected.categoryId) : undefined}
        onClose={() => setSelected(null)}
        onEdit={openEdit}
        onDelete={handleDelete}
      />
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
  filterCard: {
    marginTop: space.lg,
  },
  searchField: {
    marginTop: space.md,
  },
  clearSearch: {
    width: 24,
    height: 24,
    borderRadius: radii.pill,
    backgroundColor: colors.surfaceMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterBlock: {
    marginTop: space.lg,
  },
  typeControl: {
    marginTop: space.md,
  },
  chipScroll: {
    marginTop: space.md,
    marginHorizontal: -space.xl,
  },
  chipRow: {
    flexDirection: 'row',
    gap: space.md,
    paddingHorizontal: space.xl,
  },
  reset: {
    alignSelf: 'flex-start',
    marginTop: space.lg,
    paddingHorizontal: 0,
  },
  listHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: space.md,
    marginTop: space.xxl,
    marginBottom: space.md,
  },
  group: {
    marginBottom: space.xl,
  },
  groupHeader: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    gap: space.md,
    marginBottom: space.md,
  },
  listCard: {
    backgroundColor: colors.canvas,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    borderRadius: radii.card,
    paddingHorizontal: space.xl,
  },
  empty: {
    marginTop: space.md,
  },
});
