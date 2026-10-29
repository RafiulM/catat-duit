import { useCallback, useRef, useState } from 'react';
import { RefreshControl, StyleSheet, View, type ScrollViewInstance } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { ReceiptText, ShieldCheck } from 'lucide-react-native';
import { AppScaffold } from '@/components/AppScaffold';
import { AppText } from '@/components/AppText';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { EmptyState } from '@/components/EmptyState';
import { SectionHeader } from '@/components/SectionHeader';
import { TransactionRow } from '@/components/TransactionRow';
import { useToast } from '@/components/Toast';
import { BalanceCard } from '@/features/home/BalanceCard';
import { QuickActions } from '@/features/home/QuickActions';
import { SyncFooter } from '@/features/home/SyncFooter';
import { TrendSection } from '@/features/home/TrendSection';
import {
  addTransaction,
  editTransaction,
  removeTransaction,
} from '@/features/transactions/actions';
import { TransactionDetailSheet } from '@/features/transactions/TransactionDetailSheet';
import { TransactionFormSheet } from '@/features/transactions/TransactionFormSheet';
import {
  useBudget,
  useCategories,
  useMonthSummary,
  usePendingCount,
  useTransactions,
} from '@/hooks/useData';
import { useSyncNow } from '@/hooks/useSync';
import { useAuthStore } from '@/stores/auth-store';
import { useNetworkStore } from '@/stores/network-store';
import { colors, radii, shadow, space } from '@/theme/tokens';
import type {
  MonthSummary,
  NewTransactionInput,
  Transaction,
  TransactionType,
} from '@/data/types';
import {
  addDays,
  currentMonthKey,
  formatDateLong,
  formatDateRangeLabel,
  lastNDaysISO,
  todayISO,
  weekdayShort,
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

export default function HomeScreen() {
  const { showToast } = useToast();
  const today = todayISO();
  const month = currentMonthKey();
  const weekStart = addDays(today, -6);

  const { data: categories = [] } = useCategories();
  const { data: summary } = useMonthSummary(month);
  const { data: todayTransactions = [] } = useTransactions({
    from: today,
    to: today,
    limit: 200,
  });
  const { data: weekTransactions = [] } = useTransactions({
    from: weekStart,
    to: today,
    limit: 500,
  });
  const { data: otherTransactions = [] } = useTransactions({
    to: addDays(today, -1),
    limit: 4,
  });
  const { data: budget } = useBudget();
  const { data: pendingCount = 0 } = usePendingCount();
  const { mutateAsync: sync, isPending: syncing } = useSyncNow();
  const status = useAuthStore((state) => state.status);
  const user = useAuthStore((state) => state.user);
  const online = useNetworkStore((state) => state.online);
  const authed = status === 'authed';

  const [formVisible, setFormVisible] = useState(false);
  const [formMode, setFormMode] = useState<TransactionType>('expense');
  const [formInitial, setFormInitial] = useState<Transaction | null>(null);
  const [selected, setSelected] = useState<Transaction | null>(null);
  const [showBackupPrompt, setShowBackupPrompt] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const scrollRef = useRef<ScrollViewInstance>(null);

  useFocusEffect(
    useCallback(() => {
      scrollRef.current?.scrollTo({ y: 0, animated: false });
    }, []),
  );

  const categoryById = new Map(
    categories.map((category) => [category.id, category]),
  );

  const safeSummary = summary ?? { ...EMPTY_SUMMARY, month };
  const todayExpense = todayTransactions
    .filter((transaction) => transaction.type === 'expense')
    .reduce((total, transaction) => total + transaction.amount, 0);

  const weekPoints = lastNDaysISO(7, today).map((date) => {
    const value = weekTransactions
      .filter(
        (transaction) =>
          transaction.type === 'expense' &&
          transaction.transactionDate === date,
      )
      .reduce((total, transaction) => total + transaction.amount, 0);
    return {
      value,
      label: weekdayShort(date),
      accessibilityLabel: `${formatDateLong(date)} ${formatRupiah(value)}`,
    };
  });

  const weekTotal = weekPoints.reduce((total, point) => total + point.value, 0);
  const weekAverage = Math.round(weekTotal / 7);
  const firstName = user?.name?.trim().split(/\s+/)[0];
  const greeting = firstName ? `Halo, ${firstName}` : 'Halo!';

  const openNew = (type: TransactionType) => {
    setFormInitial(null);
    setFormMode(type);
    setFormVisible(true);
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
    const category = categoryById.get(input.categoryId);
    if (formInitial) {
      await editTransaction(formInitial.id, input);
      showToast({
        title: 'Transaksi diperbarui',
        detail: `${formatRupiah(input.amount)} · ${category?.name ?? 'Kategori'}`,
      });
    } else {
      await addTransaction(input);
      showToast({
        title:
          input.type === 'expense'
            ? 'Pengeluaran tersimpan'
            : 'Pemasukan tersimpan',
        detail:
          input.transactionDate === today
            ? `${formatRupiah(input.amount)} · ${category?.name ?? 'Kategori'}`
            : `${formatDateLong(input.transactionDate)} · ${formatRupiah(
                input.amount,
              )}`,
      });
      if (!authed) setShowBackupPrompt(true);
    }
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

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      if (authed && online) {
        const result = await sync();
        if (result?.error && !result.skipped) {
          showToast({ title: 'Sinkronisasi tertunda', detail: result.error, tone: 'error' });
        }
      }
    } finally {
      setRefreshing(false);
    }
  };

  return (
    <AppScaffold
      scrollRef={scrollRef}
      refreshControl={
        <RefreshControl
          refreshing={refreshing || syncing}
          onRefresh={() => void handleRefresh()}
          tintColor={colors.primary}
          colors={[colors.primary]}
        />
      }
    >
      <View style={styles.greeting}>
        <AppText
          variant="labelSm"
          weight="medium"
          color={colors.textSubtle}
          style={styles.dateLabel}
        >
          {formatDateLong(today).toUpperCase()}
        </AppText>
        <AppText variant="headingSm" style={styles.hello}>
          {greeting}
        </AppText>
        <AppText variant="bodySm" color={colors.textMuted}>
          Mau catat apa hari ini?
        </AppText>
      </View>

      <BalanceCard
        summary={safeSummary}
        month={month}
        budget={budget}
        onBudgetPress={() => router.push('/pengaturan')}
        onMonthPress={() => router.push('/analisis')}
      />

      <View style={styles.quickSection}>
        <SectionHeader title="Catat cepat" subtitle="Tiga ketukan, selesai." />
        <QuickActions
          onExpense={() => openNew('expense')}
          onIncome={() => openNew('income')}
        />
      </View>

      <TrendSection
        points={weekPoints}
        total={weekTotal}
        average={weekAverage}
        rangeLabel={formatDateRangeLabel(weekStart, today)}
        pendingCount={authed ? pendingCount : 0}
        onViewAnalytics={() => router.push('/analisis')}
      />

      <View style={styles.section}>
        <View style={styles.todayHeader}>
          <View style={styles.todayCopy}>
            <AppText variant="headingSm">Hari ini</AppText>
            <AppText variant="bodySm" color={colors.textMuted}>
              {formatDateLong(today)}
            </AppText>
          </View>
          <View style={styles.todayTotal}>
            <AppText variant="bodySm" weight="semiBold" tabular>
              {formatRupiah(todayExpense)}
            </AppText>
            <AppText variant="labelSm" color={colors.textMuted}>
              total keluar
            </AppText>
          </View>
        </View>

        {todayTransactions.length > 0 ? (
          <View style={styles.listCard}>
            {todayTransactions.map((transaction, index) => (
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
        ) : (
          <View style={styles.emptyWrap}>
            <EmptyState
              icon={ReceiptText}
              title="Belum ada transaksi hari ini"
              description="Mulai dari pengeluaran pertama, nggak sampai 10 detik."
              actionLabel="Catat sekarang"
              onAction={() => openNew('expense')}
            />
          </View>
        )}

        <SyncFooter
          authed={authed}
          pending={pendingCount}
          onPress={() => router.push('/pengaturan')}
        />
      </View>

      {showBackupPrompt && !authed ? (
        <Card tone="mint" style={styles.backupCard}>
          <View style={styles.backupHeader}>
            <View style={styles.backupIcon}>
              <ShieldCheck size={18} color={colors.primary} />
            </View>
            <View style={styles.backupCopy}>
              <AppText variant="bodySm" weight="semiBold">
                Cadangkan catatanmu
              </AppText>
              <AppText variant="labelSm" color={colors.textMuted} style={styles.backupText}>
                Buat akun supaya catatan tetap ada walau ganti ponsel.
              </AppText>
            </View>
          </View>
          <View style={styles.backupActions}>
            <Button
              label="Buat akun"
              onPress={() => router.push('/auth/daftar')}
              variant="primary"
              size="sm"
              style={styles.backupButton}
            />
            <Button
              label="Nanti saja"
              onPress={() => setShowBackupPrompt(false)}
              variant="ghost"
              size="sm"
              style={styles.backupButton}
            />
          </View>
        </Card>
      ) : null}

      {otherTransactions.length > 0 ? (
        <View style={styles.section}>
          <SectionHeader
            title="Tanggal lain"
            subtitle="Catatan terbaru di luar hari ini."
            actionLabel="Lihat semua"
            onAction={() => router.push('/riwayat')}
          />
          <View style={styles.listCard}>
            {otherTransactions.map((transaction, index) => (
              <TransactionRow
                key={transaction.id}
                transaction={transaction}
                category={categoryById.get(transaction.categoryId)}
                first={index === 0}
                showDate
                onPress={() => setSelected(transaction)}
                showSyncStatus={authed}
              />
            ))}
          </View>
        </View>
      ) : null}

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
  greeting: {
    marginTop: space.xs,
  },
  dateLabel: {
    letterSpacing: 0.6,
  },
  hello: {
    marginTop: 2,
  },
  quickSection: {
    marginTop: space.xxl,
  },
  section: {
    marginTop: space.xxl,
  },
  todayHeader: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    gap: space.lg,
    marginBottom: space.lg,
  },
  todayCopy: {
    flex: 1,
    minWidth: 0,
  },
  todayTotal: {
    alignItems: 'flex-end',
    flexShrink: 0,
  },
  listCard: {
    backgroundColor: colors.canvas,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    borderRadius: radii.card,
    paddingHorizontal: space.xl,
    ...shadow,
  },
  emptyWrap: {
    marginBottom: space.md,
  },
  backupCard: {
    marginTop: space.xxl,
  },
  backupHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: space.md,
  },
  backupIcon: {
    width: 36,
    height: 36,
    borderRadius: radii.pill,
    backgroundColor: colors.canvas,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  backupCopy: {
    flex: 1,
    minWidth: 0,
  },
  backupText: {
    marginTop: 2,
  },
  backupActions: {
    flexDirection: 'row',
    gap: space.md,
    marginTop: space.lg,
  },
  backupButton: {
    flex: 1,
  },
});
