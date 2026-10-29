import { useEffect, useMemo, useState } from 'react';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';
import { router } from 'expo-router';
import Constants from 'expo-constants';
import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import {
  ArrowUpRight,
  BadgeCheck,
  ChevronRight,
  CircleAlert,
  CloudCheck,
  CloudOff,
  Download,
  HardDrive,
  KeyRound,
  LogOut,
  Mail,
  RefreshCw,
  ShieldCheck,
  Tags,
  Target,
  TriangleAlert,
  UserRound,
  WifiOff,
} from 'lucide-react-native';
import { AppScaffold } from '@/components/AppScaffold';
import { AppText } from '@/components/AppText';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { ProgressBar } from '@/components/ProgressBar';
import { SegmentedControl } from '@/components/SegmentedControl';
import { Sheet } from '@/components/Sheet';
import { TextField } from '@/components/TextField';
import { useToast } from '@/components/Toast';
import {
  deleteSetting,
  listTransactionsForExport,
  saveBudget,
} from '@/data/repository';
import { invalidateLocalData } from '@/data/query-keys';
import type { Budget, BudgetPeriod } from '@/data/types';
import {
  useBudget,
  useCategories,
  useLastSyncAt,
  useMonthSummary,
  usePendingCount,
} from '@/hooks/useData';
import { useRemoveBudget, useSyncBudget, useSyncNow } from '@/hooks/useSync';
import { ApiError, apiChangeEmail } from '@/services/api';
import { useAuthStore } from '@/stores/auth-store';
import { useNetworkStore } from '@/stores/network-store';
import { colors, radii, space } from '@/theme/tokens';
import { buildTransactionsCsv } from '@/utils/csv';
import {
  addMonths,
  currentMonthKey,
  formatDateWithYear,
  formatTime,
  startOfMonth,
  todayISO,
} from '@/utils/date';
import {
  formatAmountInput,
  formatCompactRupiah,
  formatPercent,
  formatRupiah,
  initialOf,
  parseAmountInput,
} from '@/utils/format';

type ExportRange = 'month' | '3m' | 'all';

const QUICK_MONTHLY = [1_000_000, 2_000_000, 4_000_000, 5_000_000];
const QUICK_DAILY = [50_000, 100_000, 150_000, 200_000];

export default function SettingsScreen() {
  const { showToast } = useToast();
  const status = useAuthStore((state) => state.status);
  const user = useAuthStore((state) => state.user);
  const token = useAuthStore((state) => state.token);
  const signOut = useAuthStore((state) => state.signOut);
  const updateProfile = useAuthStore((state) => state.updateProfile);
  const busy = useAuthStore((state) => state.busy);
  const authed = status === 'authed';
  const online = useNetworkStore((state) => state.online);

  const { data: budget } = useBudget();
  const { data: categories = [] } = useCategories();
  const { data: summary } = useMonthSummary(currentMonthKey());
  const { data: pending = 0 } = usePendingCount();
  const { data: lastSyncAt } = useLastSyncAt();
  const { mutateAsync: sync, isPending: syncing } = useSyncNow();
  const syncBudget = useSyncBudget();
  const removeBudget = useRemoveBudget();

  const [budgetSheetOpen, setBudgetSheetOpen] = useState(false);
  const [budgetAmount, setBudgetAmount] = useState(0);
  const [budgetPeriod, setBudgetPeriod] = useState<BudgetPeriod>('monthly');
  const [budgetError, setBudgetError] = useState('');
  const [savingBudget, setSavingBudget] = useState(false);

  const [profileSheetOpen, setProfileSheetOpen] = useState(false);
  const [profileName, setProfileName] = useState('');
  const [profileEmail, setProfileEmail] = useState('');
  const [profileError, setProfileError] = useState('');
  const [savingProfile, setSavingProfile] = useState(false);

  const [logoutSheetOpen, setLogoutSheetOpen] = useState(false);
  const [exportRange, setExportRange] = useState<ExportRange>('month');
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    // Keep the editor aligned when the stored budget changes after a sync.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setBudgetAmount(budget?.amount ?? 0);
    setBudgetPeriod(budget?.period ?? 'monthly');
  }, [budget?.amount, budget?.period]);

  const used =
    budget?.period === 'daily'
      ? summary?.todayExpense ?? 0
      : summary?.expense ?? 0;
  const budgetPercent = budget && budget.amount > 0 ? (used / budget.amount) * 100 : 0;
  const budgetRemaining = budget ? budget.amount - used : 0;
  const budgetTone =
    budgetPercent >= 100
      ? {
          color: colors.danger,
          background: colors.dangerSoft,
          label: 'Lewat batas',
          Icon: CircleAlert,
        }
      : budgetPercent >= 80
        ? {
            color: colors.warning,
            background: colors.warningSoft,
            label: 'Hampir batas',
            Icon: TriangleAlert,
          }
        : {
            color: colors.positive,
            background: colors.positiveSoft,
            label: 'Aman',
            Icon: ShieldCheck,
          };

  const version = Constants.expoConfig?.version ?? '1.0.0';
  const lastSyncLabel = useMemo(() => {
    if (!lastSyncAt) return 'Belum pernah sinkron';
    const date = lastSyncAt.slice(0, 10);
    if (date === todayISO()) return `Hari ini, ${formatTime(lastSyncAt)}`;
    return `${formatDateWithYear(date)}, ${formatTime(lastSyncAt)}`;
  }, [lastSyncAt]);

  const quickAmounts = budgetPeriod === 'monthly' ? QUICK_MONTHLY : QUICK_DAILY;

  const openBudgetSheet = () => {
    setBudgetAmount(budget?.amount ?? 0);
    setBudgetPeriod(budget?.period ?? 'monthly');
    setBudgetError('');
    setBudgetSheetOpen(true);
  };

  const handleSaveBudget = async () => {
    if (!budgetAmount || budgetAmount <= 0) {
      setBudgetError('Masukkan nominal batas dulu, ya.');
      return;
    }
    setSavingBudget(true);
    setBudgetError('');
    try {
      const next: Budget = {
        period: budgetPeriod,
        amount: budgetAmount,
        month: null,
        isActive: true,
        serverId: budget?.serverId ?? null,
      };
      await saveBudget(next);
      if (authed) {
        const synced = await syncBudget.mutateAsync({
          budget: next,
          previous: budget,
        });
        await saveBudget(synced);
      }
      invalidateLocalData();
      setBudgetSheetOpen(false);
      showToast({
        title: 'Batas pengeluaran diperbarui',
        detail: `${budgetPeriod === 'daily' ? 'Harian' : 'Bulanan'} · ${formatRupiah(
          budgetAmount,
        )}`,
      });
    } catch (error) {
      setBudgetError(
        error instanceof Error ? error.message : 'Batas gagal disimpan. Coba lagi.',
      );
    } finally {
      setSavingBudget(false);
    }
  };

  const handleRemoveBudget = async () => {
    await removeBudget.mutateAsync(budget ?? null);
    await deleteSetting('budget');
    invalidateLocalData();
    setBudgetSheetOpen(false);
    showToast({
      title: 'Batas pengeluaran dihapus',
      detail: 'Kamu tetap bisa mencatat seperti biasa.',
    });
  };

  const openProfileSheet = () => {
    setProfileName(user?.name ?? '');
    setProfileEmail(user?.email ?? '');
    setProfileError('');
    setProfileSheetOpen(true);
  };

  const handleSaveProfile = async () => {
    const name = profileName.trim();
    const email = profileEmail.trim().toLowerCase();
    if (!name) {
      setProfileError('Nama tidak boleh kosong.');
      return;
    }
    if (!email || !email.includes('@')) {
      setProfileError('Masukkan email yang valid.');
      return;
    }

    setSavingProfile(true);
    setProfileError('');
    try {
      if (name !== user?.name) {
        await updateProfile(name);
      }
      let emailMessage = '';
      if (token && email !== user?.email.toLowerCase()) {
        emailMessage = await apiChangeEmail(token, email);
      }
      setProfileSheetOpen(false);
      showToast({
        title: 'Profil diperbarui',
        detail: emailMessage || `${name} · ${email}`,
      });
    } catch (error) {
      setProfileError(
        error instanceof ApiError || error instanceof Error
          ? error.message
          : 'Profil gagal diubah. Coba lagi.',
      );
    } finally {
      setSavingProfile(false);
    }
  };

  const handleExport = async () => {
    setExporting(true);
    try {
      const today = todayISO();
      const month = currentMonthKey();
      const from =
        exportRange === 'month'
          ? startOfMonth(month)
          : exportRange === '3m'
            ? startOfMonth(addMonths(month, -2))
            : '2000-01-01';
      const rows = await listTransactionsForExport(from, today);
      if (rows.length === 0) {
        showToast({
          title: 'Belum ada data untuk diekspor',
          detail:
            exportRange === 'month'
              ? 'Bulan ini belum ada transaksi.'
              : 'Catat transaksi dulu, lalu coba lagi.',
          tone: 'info',
        });
        return;
      }

      const csv = buildTransactionsCsv(rows);
      const file = new File(Paths.cache, `catat-duit-${today}.csv`);
      if (file.exists) file.delete();
      file.create();
      await file.write(csv);

      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(file.uri, {
          mimeType: 'text/csv',
          dialogTitle: 'Bagikan catatan keuangan',
          UTI: 'public.comma-separated-values-text',
        });
      }
      showToast({
        title: 'CSV disiapkan',
        detail: `${rows.length} transaksi siap diunduh.`,
      });
    } catch (error) {
      showToast({
        title: 'Ekspor gagal',
        detail: error instanceof Error ? error.message : 'Coba lagi.',
        tone: 'error',
      });
    } finally {
      setExporting(false);
    }
  };

  const handleSync = async () => {
    if (!authed) {
      router.push('/auth/masuk');
      return;
    }
    const result = await sync();
    if (result?.error) {
      showToast({
        title: result.skipped ? 'Belum bisa sinkron' : 'Sinkronisasi tertunda',
        detail: result.error,
        tone: 'error',
      });
      return;
    }
    showToast({
      title: 'Sinkronisasi selesai',
      detail:
        result && result.pushed + result.pulled > 0
          ? `${result.pushed} dikirim · ${result.pulled} diambil dari server`
          : 'Semua catatan sudah terbaru.',
    });
  };

  const handleSignOut = async () => {
    await signOut();
    setLogoutSheetOpen(false);
    showToast({
      title: 'Kamu sudah keluar',
      detail: 'Data lokal dibersihkan. Catatan yang sudah tersinkron tetap aman di server.',
    });
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
          PREFERENSI
        </AppText>
        <AppText variant="headingSm" style={styles.title}>
          Pengaturan
        </AppText>
        <AppText variant="bodySm" color={colors.textMuted}>
          Atur profil, batas, dan data keuanganmu.
        </AppText>
      </View>

      <Card style={styles.profileCard}>
        <View style={styles.profileRow}>
          <View style={styles.avatar}>
            {authed ? (
              <AppText variant="bodyLg" weight="medium" color={colors.primary} style={styles.avatarText}>
                {initialOf(user?.name)}
              </AppText>
            ) : (
              <UserRound size={24} color={colors.primary} />
            )}
          </View>
          <View style={styles.profileCopy}>
            <AppText variant="bodyMd" weight="medium" numberOfLines={1} style={styles.profileName}>
              {authed ? user?.name ?? 'Memuat profil…' : 'Belum masuk'}
            </AppText>
            <AppText variant="labelSm" color={colors.textMuted} numberOfLines={1}>
              {authed
                ? user?.email ?? 'Profil sedang dimuat'
                : 'Catatanmu masih di perangkat ini.'}
            </AppText>
            {authed && user?.emailVerified ? (
              <View style={styles.verified}>
                <BadgeCheck size={12} color={colors.positive} />
                <AppText variant="labelSm" weight="medium" color={colors.positive}>
                  Email terverifikasi
                </AppText>
              </View>
            ) : null}
          </View>
          {authed ? (
            <Button
              label="Edit"
              onPress={openProfileSheet}
              variant="secondary"
              size="sm"
              testID="edit-profile"
              style={styles.editProfile}
            />
          ) : null}
        </View>

        {!authed ? (
          <View style={styles.guestActions}>
            <Button
              label="Masuk"
              onPress={() => router.push('/auth/masuk')}
              variant="primary"
              size="sm"
              style={styles.guestAction}
            />
            <Button
              label="Daftar"
              onPress={() => router.push('/auth/daftar')}
              variant="outline"
              size="sm"
              style={styles.guestAction}
            />
          </View>
        ) : null}
      </Card>

      <Card style={styles.sectionCard}>
        <View style={styles.sectionHeader}>
          <View style={styles.sectionHeaderCopy}>
            <AppText variant="bodyMd" weight="medium" style={styles.sectionHeading}>
              Batas pengeluaran
            </AppText>
            <AppText variant="labelSm" color={colors.textMuted}>
              Pengingat supaya belanja tetap terkendali.
            </AppText>
          </View>
          <Button
            label="Atur"
            onPress={openBudgetSheet}
            variant="secondary"
            size="sm"
            testID="edit-budget"
            style={styles.smallAction}
          />
        </View>

        {budget ? (
          <>
            <View style={styles.budgetAmountRow}>
              <AppText variant="labelSm" color={colors.textMuted}>
                {budget.period === 'daily' ? 'Batas harian' : 'Batas bulanan'}
              </AppText>
              <AppText variant="bodyLg" weight="medium" tabular style={styles.budgetAmount}>
                {formatRupiah(budget.amount)}
              </AppText>
            </View>
            <ProgressBar
              percent={budgetPercent}
              trackColor={colors.surfaceMuted}
              height={6}
            />
            <View style={styles.budgetStatusRow}>
              <AppText variant="labelSm" color={colors.textMuted} style={styles.budgetStatusCopy}>
                {formatPercent(budgetPercent)} terpakai ·{' '}
                {budgetRemaining >= 0
                  ? `sisa ${formatRupiah(budgetRemaining)}`
                  : `lewat ${formatRupiah(Math.abs(budgetRemaining))}`}
              </AppText>
              <View style={styles.budgetTone}>
                <budgetTone.Icon size={12} color={budgetTone.color} />
                <AppText variant="labelSm" weight="semiBold" color={budgetTone.color}>
                  {budgetTone.label}
                </AppText>
              </View>
            </View>
          </>
        ) : (
          <View style={styles.budgetEmpty}>
            <Target size={18} color={colors.primary} />
            <AppText variant="bodySm" color={colors.textMuted} style={styles.budgetEmptyCopy}>
              Belum ada batas aktif. Atur pengingat agar pengeluaran tetap terkendali.
            </AppText>
          </View>
        )}
      </Card>

      {authed ? (
        pending > 0 ? (
          <View style={styles.syncWarning}>
            <View style={styles.syncRow}>
              <View style={styles.syncWarningIcon}>
                <CloudOff size={18} color={colors.warningSoft} />
              </View>
              <View style={styles.syncCopy}>
                <AppText variant="bodyMd" weight="medium" color={colors.warning} style={styles.syncTitle}>
                  {pending} transaksi menunggu
                </AppText>
                <AppText variant="labelSm" color={colors.warning} style={styles.syncText}>
                  Data tetap aman di perangkat ini. Antrian dikirim otomatis saat online.
                </AppText>
              </View>
            </View>
            <Button
              label={online ? 'Coba sinkronkan lagi' : 'Menunggu koneksi'}
              onPress={() => void handleSync()}
              variant="outline"
              size="sm"
              loading={syncing}
              disabled={!online}
              fullWidth
              style={styles.syncAction}
            />
          </View>
        ) : online ? (
          <View style={styles.syncPositive}>
            <View style={styles.syncRow}>
              <View style={styles.syncPositiveIcon}>
                <CloudCheck size={18} color={colors.positive} />
              </View>
              <View style={styles.syncCopy}>
                <AppText variant="bodyMd" weight="medium" color={colors.positive} style={styles.syncTitle}>
                  Semua catatan tersimpan
                </AppText>
                <AppText variant="labelSm" color={colors.textMuted} style={styles.syncText}>
                  Terakhir sinkron: {lastSyncLabel}
                </AppText>
              </View>
            </View>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Sinkronkan sekarang"
              onPress={() => void handleSync()}
              style={({ pressed }) => [styles.syncLink, { opacity: pressed ? 0.6 : 1 }]}
            >
              <RefreshCw size={13} color={colors.primary} />
              <AppText variant="labelSm" weight="semiBold" color={colors.primary}>
                Sinkronkan sekarang
              </AppText>
            </Pressable>
          </View>
        ) : (
          <View style={styles.syncOffline}>
            <View style={styles.syncRow}>
              <View style={styles.syncOfflineIcon}>
                <WifiOff size={18} color={colors.textMuted} />
              </View>
              <View style={styles.syncCopy}>
                <AppText variant="bodyMd" weight="medium" style={styles.syncTitle}>
                  Sedang offline
                </AppText>
                <AppText variant="labelSm" color={colors.textMuted} style={styles.syncText}>
                  Data tetap aman di perangkat. Terakhir sinkron: {lastSyncLabel}.
                </AppText>
              </View>
            </View>
          </View>
        )
      ) : (
        <View style={styles.syncGuest}>
          <View style={styles.syncRow}>
            <View style={styles.syncGuestIcon}>
              <HardDrive size={18} color={colors.textMuted} />
            </View>
            <View style={styles.syncCopy}>
              <AppText variant="bodyMd" weight="medium" style={styles.syncTitle}>
                Belum tersambung ke server
              </AppText>
              <AppText variant="labelSm" color={colors.textMuted} style={styles.syncText}>
                Masuk untuk mencadangkan catatan dan membukanya di ponsel lain.
              </AppText>
            </View>
          </View>
          <Button
            label="Masuk"
            onPress={() => router.push('/auth/masuk')}
            variant="secondary"
            size="sm"
            fullWidth
            style={styles.syncAction}
          />
        </View>
      )}

      <Card style={styles.sectionCard}>
        <AppText variant="bodyMd" weight="medium" style={styles.sectionHeading}>
          Ekspor data
        </AppText>
        <AppText variant="labelSm" color={colors.textMuted}>
          Unduh catatan transaksi dalam format CSV.
        </AppText>
        <View style={styles.exportControls}>
          <SegmentedControl
            label="Rentang data"
            value={exportRange}
            onChange={setExportRange}
            options={[
              { value: 'month', label: 'Bulan ini' },
              { value: '3m', label: '3 bulan' },
              { value: 'all', label: 'Semua' },
            ]}
            style={styles.exportRange}
          />
          <Button
            label="Unduh CSV"
            onPress={() => void handleExport()}
            icon={Download}
            variant="primary"
            size="sm"
            loading={exporting}
            testID="export-csv"
            fullWidth
            style={styles.downloadButton}
          />
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Kelola kategori transaksi"
          onPress={() => router.push('/pengaturan/kategori')}
          style={({ pressed }) => [styles.categoryRow, { opacity: pressed ? 0.6 : 1 }]}
        >
          <View style={styles.categoryIcon}>
            <Tags size={18} color={colors.primary} />
          </View>
          <View style={styles.categoryCopy}>
            <AppText variant="bodySm" weight="medium">
              Kategori
            </AppText>
            <AppText variant="labelSm" color={colors.textMuted}>
              {categories.length} kategori aktif
            </AppText>
          </View>
          <ChevronRight size={18} color={colors.textMuted} />
        </Pressable>
      </Card>

      {authed ? (
        <Card style={styles.sectionCard}>
          <AppText variant="bodyMd" weight="medium" style={styles.sectionHeading}>
            Akun
          </AppText>
          <AppText variant="labelSm" color={colors.textMuted}>
            Kelola akses dan keamanan akunmu.
          </AppText>
          <View style={styles.accountRow}>
            <View style={styles.accountCopy}>
              <View style={styles.accountEmailRow}>
                <Mail size={13} color={colors.textMuted} />
                <AppText variant="bodySm" weight="semiBold" numberOfLines={1}>
                  {user?.email ?? 'Email akun'}
                </AppText>
              </View>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Reset kata sandi"
                onPress={() => router.push('/auth/lupa-sandi')}
                hitSlop={6}
                style={({ pressed }) => [styles.resetLink, { opacity: pressed ? 0.6 : 1 }]}
              >
                <KeyRound size={13} color={colors.primary} />
                <AppText variant="labelSm" weight="semiBold" color={colors.primary}>
                  Reset kata sandi
                </AppText>
                <ArrowUpRight size={12} color={colors.primary} />
              </Pressable>
            </View>
            <Button
              label="Keluar"
              onPress={() => setLogoutSheetOpen(true)}
              variant="danger"
              size="sm"
              icon={LogOut}
              testID="open-logout"
              style={styles.logoutButton}
            />
          </View>
        </Card>
      ) : null}

      <AppText variant="labelSm" color={colors.textSubtle} align="center" style={styles.footer}>
        Catat Duit v{version} · Data keuanganmu, aman dan rapi.
      </AppText>

      <Sheet
        visible={profileSheetOpen}
        onClose={() => setProfileSheetOpen(false)}
        title="Edit profil"
        subtitle="Perbarui nama dan email akunmu."
        footer={
          <View>
            {profileError ? (
              <AppText variant="labelSm" color={colors.danger} style={styles.sheetError}>
                {profileError}
              </AppText>
            ) : null}
            <Button
              label="Simpan profil"
              onPress={() => void handleSaveProfile()}
              loading={savingProfile}
              fullWidth
            />
          </View>
        }
      >
        <TextField
          label="Nama"
          accessibilityLabel="Nama profil"
          value={profileName}
          onChangeText={setProfileName}
          placeholder="Nama kamu"
          maxLength={80}
          autoFocus
        />
        <TextField
          label="Email"
          accessibilityLabel="Email profil"
          value={profileEmail}
          onChangeText={setProfileEmail}
          placeholder="nama@email.com"
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
          containerStyle={styles.sheetField}
          hint="Perubahan email dikonfirmasi lewat tautan verifikasi."
        />
      </Sheet>

      <Sheet
        visible={budgetSheetOpen}
        onClose={() => setBudgetSheetOpen(false)}
        title="Atur batas pengeluaran"
        subtitle="Tentukan batas harian atau bulanan."
        footer={
          <View>
            {budgetError ? (
              <AppText variant="labelSm" color={colors.danger} style={styles.sheetError}>
                {budgetError}
              </AppText>
            ) : null}
            <Button
              label="Simpan batas"
              onPress={() => void handleSaveBudget()}
              loading={savingBudget}
              fullWidth
            />
            {budget ? (
              <Button
                label="Hapus batas"
                onPress={() => void handleRemoveBudget()}
                variant="ghost"
                size="sm"
                style={styles.deleteBudget}
              />
            ) : null}
          </View>
        }
      >
        <SegmentedControl
          label="Periode batas pengeluaran"
          value={budgetPeriod}
          onChange={setBudgetPeriod}
          options={[
            { value: 'daily', label: 'Harian' },
            { value: 'monthly', label: 'Bulanan' },
          ]}
        />
        <View style={styles.sheetField}>
          <AppText variant="labelSm" weight="semiBold" color={colors.textMuted}>
            Nominal batas
          </AppText>
          <View style={styles.amountBox}>
            <AppText variant="bodyLg" weight="medium" color={colors.textMuted}>
              Rp
            </AppText>
            <TextInput
              accessibilityLabel="Nominal batas pengeluaran"
              keyboardType="number-pad"
              inputMode="numeric"
              value={budgetAmount ? formatAmountInput(budgetAmount) : ''}
              onChangeText={(text) => {
                setBudgetAmount(parseAmountInput(text));
                if (budgetError) setBudgetError('');
              }}
              placeholder="0"
              placeholderTextColor={colors.textDisabled}
              selectionColor={colors.selection}
              maxLength={16}
              style={styles.amountInput}
            />
          </View>
          <AppText variant="labelSm" color={colors.textMuted} style={styles.amountHint}>
            {budgetPeriod === 'monthly'
              ? `Pengeluaran bulan ini ${formatRupiah(summary?.expense ?? 0)}.`
              : `Pengeluaran hari ini ${formatRupiah(summary?.todayExpense ?? 0)}.`}
          </AppText>
        </View>
        <View style={styles.quickRow}>
          {quickAmounts.map((value) => (
            <Pressable
              key={value}
              accessibilityRole="button"
              accessibilityState={{ selected: budgetAmount === value }}
              onPress={() => setBudgetAmount(value)}
              style={[
                styles.quickChip,
                budgetAmount === value ? styles.quickChipSelected : null,
              ]}
            >
              <AppText
                variant="labelSm"
                weight="medium"
                color={budgetAmount === value ? colors.primary : colors.text}
              >
                {formatCompactRupiah(value).replace('Rp', '')}
              </AppText>
            </Pressable>
          ))}
        </View>
      </Sheet>

      <Sheet
        visible={logoutSheetOpen}
        onClose={() => setLogoutSheetOpen(false)}
        title="Keluar dari akun?"
        subtitle="Kamu bisa masuk lagi kapan saja."
        footer={
          <View style={styles.logoutActions}>
            <Button
              label="Batal"
              onPress={() => setLogoutSheetOpen(false)}
              variant="secondary"
              testID="logout-cancel"
              style={styles.logoutAction}
            />
            <Button
              label={busy ? 'Keluar…' : 'Keluar'}
              onPress={() => void handleSignOut()}
              variant="dangerSolid"
              loading={busy}
              testID="logout-confirm"
              style={styles.logoutAction}
            />
          </View>
        }
      >
        <View style={styles.logoutContent}>
          <View style={styles.logoutIcon}>
            <LogOut size={22} color={colors.danger} />
          </View>
          <AppText variant="bodySm" color={colors.textMuted} align="center">
            Data di perangkat ini akan dibersihkan. Catatan yang sudah tersinkron tetap
            aman di server.
          </AppText>
        </View>
      </Sheet>
    </AppScaffold>
  );
}

const styles = StyleSheet.create({
  eyebrow: { letterSpacing: 0.6 },
  title: { marginTop: 2 },
  profileCard: { marginTop: space.lg },
  profileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.lg,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: radii.pill,
    backgroundColor: colors.mint,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  avatarText: {
    fontFamily: 'CalSans-Medium',
  },
  profileCopy: { flex: 1, minWidth: 0 },
  profileName: {
    fontFamily: 'CalSans-Medium',
  },
  verified: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.xs,
    marginTop: space.xs,
  },
  editProfile: {
    minWidth: 64,
  },
  guestActions: {
    flexDirection: 'row',
    gap: space.md,
    marginTop: space.lg,
  },
  guestAction: { flex: 1 },
  sectionCard: { marginTop: space.xl },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: space.md,
  },
  sectionHeaderCopy: { flex: 1, minWidth: 0 },
  sectionHeading: {
    fontFamily: 'CalSans-Medium',
    marginBottom: 2,
  },
  smallAction: { minWidth: 64 },
  budgetAmountRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    gap: space.md,
    marginTop: space.lg,
  },
  budgetAmount: {
    fontFamily: 'CalSans-Medium',
    fontVariant: ['tabular-nums'],
  },
  budgetStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: space.md,
    marginTop: space.md,
  },
  budgetStatusCopy: { flex: 1 },
  budgetTone: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.xs,
    flexShrink: 0,
  },
  budgetEmpty: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    marginTop: space.lg,
    padding: space.lg,
    backgroundColor: colors.surfaceMuted,
    borderRadius: radii.control,
  },
  budgetEmptyCopy: { flex: 1 },
  syncWarning: {
    marginTop: space.xl,
    padding: space.xl,
    backgroundColor: colors.warningSoft,
    borderWidth: 1,
    borderColor: colors.warning,
    borderRadius: radii.card,
  },
  syncPositive: {
    marginTop: space.xl,
    padding: space.xl,
    backgroundColor: colors.positiveSoft,
    borderWidth: 1,
    borderColor: colors.positive,
    borderRadius: radii.card,
  },
  syncOffline: {
    marginTop: space.xl,
    padding: space.xl,
    backgroundColor: colors.surfaceMuted,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    borderRadius: radii.card,
  },
  syncGuest: {
    marginTop: space.xl,
    padding: space.xl,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    borderRadius: radii.card,
  },
  syncRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: space.md,
  },
  syncWarningIcon: {
    width: 32,
    height: 32,
    borderRadius: radii.pill,
    backgroundColor: colors.warning,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  syncPositiveIcon: {
    width: 32,
    height: 32,
    borderRadius: radii.pill,
    backgroundColor: colors.canvas,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  syncOfflineIcon: {
    width: 32,
    height: 32,
    borderRadius: radii.pill,
    backgroundColor: colors.canvas,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  syncGuestIcon: {
    width: 32,
    height: 32,
    borderRadius: radii.pill,
    backgroundColor: colors.surfaceMuted,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  syncCopy: { flex: 1, minWidth: 0 },
  syncTitle: { marginBottom: 2 },
  syncText: { lineHeight: 18 },
  syncAction: { marginTop: space.lg },
  syncLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.xs,
    alignSelf: 'flex-start',
    marginTop: space.lg,
    paddingVertical: space.xs,
  },
  exportControls: {
    marginTop: space.lg,
  },
  exportRange: {},
  downloadButton: {
    marginTop: space.md,
    alignSelf: 'flex-start',
  },
  categoryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    marginTop: space.xl,
    paddingTop: space.xl,
    borderTopWidth: 1,
    borderTopColor: colors.borderSubtle,
  },
  categoryIcon: {
    width: 36,
    height: 36,
    borderRadius: radii.control,
    backgroundColor: colors.surfaceMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  categoryCopy: { flex: 1, minWidth: 0 },
  accountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: space.md,
    marginTop: space.lg,
  },
  accountCopy: { flex: 1, minWidth: 0 },
  accountEmailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.xs,
  },
  resetLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.xs,
    marginTop: space.sm,
    alignSelf: 'flex-start',
    paddingVertical: space.xs,
  },
  logoutButton: { flexShrink: 0 },
  footer: { marginTop: space.xxl },
  sheetField: { marginTop: space.lg },
  sheetError: { marginBottom: space.md },
  amountBox: {
    marginTop: space.md,
    minHeight: 64,
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    paddingHorizontal: space.xl,
    paddingVertical: space.md,
    backgroundColor: colors.canvas,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.card,
  },
  amountInput: {
    flex: 1,
    minWidth: 0,
    padding: 0,
    fontFamily: 'CalSans-Medium',
    fontSize: 34,
    lineHeight: 40,
    color: colors.text,
    fontVariant: ['tabular-nums'],
  },
  amountHint: { marginTop: space.md },
  quickRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: space.md,
    marginTop: space.lg,
  },
  quickChip: {
    minHeight: 36,
    paddingHorizontal: space.lg,
    paddingVertical: space.sm,
    borderRadius: radii.pill,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    backgroundColor: colors.canvas,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickChipSelected: {
    backgroundColor: colors.mint,
    borderColor: colors.mint,
  },
  deleteBudget: { marginTop: space.sm },
  logoutContent: {
    alignItems: 'center',
    paddingVertical: space.md,
  },
  logoutIcon: {
    width: 52,
    height: 52,
    borderRadius: radii.pill,
    backgroundColor: colors.dangerSoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: space.lg,
  },
  logoutActions: {
    flexDirection: 'row',
    gap: space.md,
  },
  logoutAction: { flex: 1 },
});
