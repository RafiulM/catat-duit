import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import {
  Check,
  LockKeyhole,
  Plus,
  Shapes,
  Tags,
} from 'lucide-react-native';
import { AppText } from '@/components/AppText';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { CategoryBadge } from '@/components/CategoryBadge';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { SegmentedControl } from '@/components/SegmentedControl';
import { Sheet } from '@/components/Sheet';
import { SubpageScaffold } from '@/components/SubpageScaffold';
import { TextField } from '@/components/TextField';
import { useToast } from '@/components/Toast';
import {
  CATEGORY_COLOR_CHOICES,
  CATEGORY_ICON_CHOICES,
  CATEGORY_ICONS,
  DEFAULT_CATEGORIES,
} from '@/data/categories';
import { upsertRemoteCategory } from '@/data/repository';
import { invalidateLocalData, queryKeys } from '@/data/query-keys';
import type { Category, CategoryType } from '@/data/types';
import { useCategories } from '@/hooks/useData';
import {
  ApiError,
  apiCreateCategory,
  apiUpdateCategory,
} from '@/services/api';
import { queryClient } from '@/services/query-client';
import { useAuthStore } from '@/stores/auth-store';
import { colors, radii, space } from '@/theme/tokens';

const DEFAULT_IDS = new Set(DEFAULT_CATEGORIES.map((category) => category.id));

export default function CategoryScreen() {
  const { showToast } = useToast();
  const token = useAuthStore((state) => state.token);
  const status = useAuthStore((state) => state.status);
  const authed = status === 'authed' && Boolean(token);
  const { data: categories = [] } = useCategories();

  const [sheetOpen, setSheetOpen] = useState(false);
  const [name, setName] = useState('');
  const [type, setType] = useState<CategoryType>('expense');
  const [icon, setIcon] = useState<string>(CATEGORY_ICON_CHOICES[0]);
  const [color, setColor] = useState<string>(CATEGORY_COLOR_CHOICES[0]);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [archiveTarget, setArchiveTarget] = useState<Category | null>(null);

  const grouped = useMemo(
    () => [
      {
        key: 'expense',
        label: 'Pengeluaran',
        items: categories.filter((category) => category.type === 'expense'),
      },
      {
        key: 'income',
        label: 'Pemasukan',
        items: categories.filter((category) => category.type === 'income'),
      },
      {
        key: 'both',
        label: 'Keduanya',
        items: categories.filter((category) => category.type === 'both'),
      },
    ],
    [categories],
  );

  const openCreate = () => {
    if (!authed) {
      showToast({
        title: 'Masuk dulu untuk menambah kategori',
        detail: 'Kategori buatan sendiri ikut tersimpan di server.',
        tone: 'info',
      });
      return;
    }
    setName('');
    setType('expense');
    setIcon(CATEGORY_ICON_CHOICES[0]);
    setColor(CATEGORY_COLOR_CHOICES[0]);
    setError('');
    setSheetOpen(true);
  };

  const handleCreate = async () => {
    const trimmed = name.trim();
    if (!token) return;
    if (trimmed.length < 2) {
      setError('Nama kategori minimal 2 karakter.');
      return;
    }

    setSaving(true);
    setError('');
    try {
      const remote = await apiCreateCategory(token, {
        name: trimmed,
        type,
        icon,
        color,
      });
      await upsertRemoteCategory({
        id: remote.id,
        name: remote.name,
        type: remote.type,
        icon: remote.icon,
        color: remote.color,
        isDefault: remote.isDefault,
        isArchived: remote.isArchived,
      });
      queryClient.invalidateQueries({ queryKey: queryKeys.categories });
      invalidateLocalData();
      setSheetOpen(false);
      showToast({
        title: 'Kategori dibuat',
        detail: `${remote.name} siap dipakai untuk transaksi baru.`,
      });
    } catch (createError) {
      setError(
        createError instanceof ApiError
          ? createError.message
          : 'Kategori gagal dibuat. Coba lagi.',
      );
    } finally {
      setSaving(false);
    }
  };

  const handleArchive = async () => {
    if (!archiveTarget || !token) return;
    try {
      const remote = await apiUpdateCategory(token, archiveTarget.id, {
        isArchived: true,
      });
      await upsertRemoteCategory({
        id: remote.id,
        name: remote.name,
        type: remote.type,
        icon: remote.icon,
        color: remote.color,
        isDefault: remote.isDefault,
        isArchived: remote.isArchived,
      });
      queryClient.invalidateQueries({ queryKey: queryKeys.categories });
      invalidateLocalData();
      setArchiveTarget(null);
      showToast({
        title: 'Kategori diarsipkan',
        detail: 'Riwayat transaksi lama tetap utuh.',
      });
    } catch (archiveError) {
      setArchiveTarget(null);
      showToast({
        title: 'Kategori gagal diarsipkan',
        detail:
          archiveError instanceof ApiError
            ? archiveError.message
            : 'Coba lagi sebentar.',
        tone: 'error',
      });
    }
  };

  const PreviewIcon = CATEGORY_ICONS[icon] ?? Shapes;

  return (
    <SubpageScaffold title="Kategori" subtitle="Kelompokkan transaksi agar mudah dianalisis">
      <Card tone="mint">
        <View style={styles.introRow}>
          <View style={styles.introIcon}>
            <Tags size={20} color={colors.primary} />
          </View>
          <View style={styles.introCopy}>
            <AppText variant="bodySm" weight="semiBold">
              Kategori bawaan sudah siap
            </AppText>
            <AppText variant="labelSm" color={colors.textMuted} style={styles.introText}>
              Tambah kategori sendiri dengan ikon dan warna supaya mudah dikenali.
            </AppText>
          </View>
        </View>
        <Button
          label="Tambah kategori"
          onPress={openCreate}
          icon={authed ? Plus : LockKeyhole}
          variant={authed ? 'primary' : 'outline'}
          size="sm"
          fullWidth
          style={styles.addButton}
        />
        {!authed ? (
          <AppText variant="labelSm" color={colors.textMuted} align="center" style={styles.guestNote}>
            Masuk dulu supaya kategori ikut tersimpan di server.
          </AppText>
        ) : null}
      </Card>

      {grouped.map((group) =>
        group.items.length > 0 ? (
          <View key={group.key} style={styles.group}>
            <AppText variant="labelSm" weight="semiBold" color={colors.textSubtle} style={styles.groupLabel}>
              {group.label.toUpperCase()}
            </AppText>
            <Card padded={false}>
              {group.items.map((category, index) => {
                const isDefault = DEFAULT_IDS.has(category.id) || category.isDefault;
                return (
                  <View
                    key={category.id}
                    style={[styles.row, index > 0 ? styles.rowDivider : null]}
                  >
                    <CategoryBadge category={category} size={40} />
                    <View style={styles.rowCopy}>
                      <AppText variant="bodySm" weight="medium">
                        {category.name}
                      </AppText>
                      <AppText variant="labelSm" color={colors.textMuted}>
                        {isDefault ? 'Bawaan · tidak bisa diubah' : 'Milikmu'}
                      </AppText>
                    </View>
                    {!isDefault && authed ? (
                      <Pressable
                        accessibilityRole="button"
                        accessibilityLabel={`Arsipkan kategori ${category.name}`}
                        onPress={() => setArchiveTarget(category)}
                        hitSlop={8}
                        style={({ pressed }) => [
                          styles.archiveButton,
                          { opacity: pressed ? 0.6 : 1 },
                        ]}
                      >
                        <AppText variant="labelSm" color={colors.danger}>
                          Arsipkan
                        </AppText>
                      </Pressable>
                    ) : (
                      <LockKeyhole size={14} color={colors.textDisabled} />
                    )}
                  </View>
                );
              })}
            </Card>
          </View>
        ) : null,
      )}

      <Sheet
        visible={sheetOpen}
        onClose={() => setSheetOpen(false)}
        title="Kategori baru"
        subtitle="Beri nama, ikon, dan warna yang mudah dikenali."
      >
        <TextField
          label="Nama kategori"
          value={name}
          onChangeText={(text) => {
            setName(text);
            if (error) setError('');
          }}
          placeholder="Mis. Kopi & camilan"
          maxLength={40}
          autoFocus
        />

        <View style={styles.formBlock}>
          <AppText variant="labelSm" weight="semiBold" color={colors.textMuted}>
            Jenis
          </AppText>
          <SegmentedControl
            label="Jenis kategori"
            value={type}
            onChange={setType}
            options={[
              { value: 'expense', label: 'Keluar' },
              { value: 'income', label: 'Masuk' },
              { value: 'both', label: 'Keduanya' },
            ]}
            style={styles.segment}
          />
        </View>

        <View style={styles.formBlock}>
          <AppText variant="labelSm" weight="semiBold" color={colors.textMuted}>
            Ikon
          </AppText>
          <View style={styles.iconGrid}>
            {CATEGORY_ICON_CHOICES.map((iconName) => {
              const Icon = CATEGORY_ICONS[iconName] ?? Shapes;
              const selected = iconName === icon;
              return (
                <Pressable
                  key={iconName}
                  accessibilityRole="button"
                  accessibilityLabel={`Ikon ${iconName}`}
                  accessibilityState={{ selected }}
                  onPress={() => setIcon(iconName)}
                  style={[
                    styles.iconOption,
                    selected ? styles.iconSelected : null,
                  ]}
                >
                  <Icon size={18} color={colors.text} />
                  {selected ? (
                    <View style={styles.iconCheck}>
                      <Check size={10} color={colors.primary} />
                    </View>
                  ) : null}
                </Pressable>
              );
            })}
          </View>
        </View>

        <View style={styles.formBlock}>
          <AppText variant="labelSm" weight="semiBold" color={colors.textMuted}>
            Warna
          </AppText>
          <View style={styles.colorRow}>
            {CATEGORY_COLOR_CHOICES.map((choice) => (
              <Pressable
                key={choice}
                accessibilityRole="button"
                accessibilityLabel={`Warna ${choice}`}
                accessibilityState={{ selected: choice === color }}
                onPress={() => setColor(choice)}
                style={[
                  styles.colorOption,
                  { backgroundColor: choice },
                  choice === color ? styles.colorSelected : null,
                ]}
              >
                {choice === color ? <Check size={14} color={colors.text} /> : null}
              </Pressable>
            ))}
          </View>
        </View>

        <View style={styles.preview}>
          <AppText variant="labelSm" weight="semiBold" color={colors.textMuted}>
            Pratinjau
          </AppText>
          <View style={styles.previewRow}>
            <View style={[styles.previewIcon, { backgroundColor: color }]}>
              <PreviewIcon size={18} color={colors.text} />
            </View>
            <AppText variant="bodySm" weight="medium">
              {name.trim() || 'Nama kategori'}
            </AppText>
            <Shapes size={16} color={colors.textDisabled} style={styles.previewSpacer} />
          </View>
        </View>

        {error ? (
          <AppText
            variant="labelSm"
            color={colors.danger}
            style={styles.formBlock}
            accessibilityLiveRegion="polite"
          >
            {error}
          </AppText>
        ) : null}

        <Button
          label="Simpan kategori"
          onPress={() => void handleCreate()}
          icon={Check}
          loading={saving}
          fullWidth
          style={styles.saveButton}
        />
      </Sheet>

      <ConfirmDialog
        visible={Boolean(archiveTarget)}
        title="Arsipkan kategori?"
        message={`${archiveTarget?.name ?? 'Kategori'} tidak akan muncul saat mencatat transaksi baru, tetapi riwayat lama tetap utuh.`}
        confirmLabel="Arsipkan"
        onConfirm={() => void handleArchive()}
        onCancel={() => setArchiveTarget(null)}
      />
    </SubpageScaffold>
  );
}

const styles = StyleSheet.create({
  introRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: space.md,
  },
  introIcon: {
    width: 36,
    height: 36,
    borderRadius: radii.pill,
    backgroundColor: colors.canvas,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  introCopy: {
    flex: 1,
    minWidth: 0,
  },
  introText: {
    marginTop: 2,
  },
  addButton: {
    marginTop: space.lg,
  },
  guestNote: {
    marginTop: space.md,
  },
  group: {
    marginTop: space.xxl,
  },
  groupLabel: {
    letterSpacing: 0.7,
    marginBottom: space.md,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    padding: space.lg,
  },
  rowDivider: {
    borderTopWidth: 1,
    borderTopColor: colors.borderSubtle,
  },
  rowCopy: {
    flex: 1,
    minWidth: 0,
  },
  archiveButton: {
    paddingVertical: space.xs,
    paddingHorizontal: space.md,
    borderRadius: radii.pill,
    backgroundColor: colors.dangerSoft,
  },
  formBlock: {
    marginTop: space.xl,
  },
  segment: {
    marginTop: space.md,
  },
  iconGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: space.md,
    marginTop: space.md,
  },
  iconOption: {
    width: 48,
    height: 48,
    borderRadius: radii.control,
    backgroundColor: colors.surfaceMuted,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconSelected: {
    backgroundColor: colors.mint,
    borderColor: colors.primary,
  },
  iconCheck: {
    position: 'absolute',
    top: 2,
    right: 2,
  },
  colorRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: space.md,
    marginTop: space.md,
  },
  colorOption: {
    width: 40,
    height: 40,
    borderRadius: radii.pill,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.transparent,
  },
  colorSelected: {
    borderColor: colors.text,
  },
  preview: {
    marginTop: space.xl,
    padding: space.lg,
    backgroundColor: colors.surfaceMuted,
    borderRadius: radii.control,
  },
  previewRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    marginTop: space.md,
  },
  previewIcon: {
    width: 36,
    height: 36,
    borderRadius: radii.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  previewSpacer: {
    marginLeft: 'auto',
  },
  saveButton: {
    marginTop: space.xxl,
    marginBottom: space.md,
  },
});
