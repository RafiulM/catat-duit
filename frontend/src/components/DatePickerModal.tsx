import { useEffect, useMemo, useState } from 'react';
import { Modal, Pressable, StyleSheet, View } from 'react-native';
import { ChevronLeft, ChevronRight } from 'lucide-react-native';
import { AppText } from './AppText';
import { Button } from './Button';
import { colors, radii, shadowRaised, space } from '@/theme/tokens';
import {
  addMonths,
  daysInMonth,
  formatDateLong,
  formatMonthLabel,
  monthKey,
  parseISODate,
  todayISO,
} from '@/utils/date';

type DatePickerModalProps = {
  visible: boolean;
  value: string;
  inline?: boolean;
  onSelect: (isoDate: string) => void;
  onClose: () => void;
};

const WEEK_START_MONDAY = ['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min'];

export function DatePickerModal({
  visible,
  value,
  inline = false,
  onSelect,
  onClose,
}: DatePickerModalProps) {
  const [viewMonth, setViewMonth] = useState(monthKey(value || todayISO()));

  useEffect(() => {
    // Reset the displayed month each time the picker opens.
    if (visible) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setViewMonth(monthKey(value || todayISO()));
    }
  }, [visible, value]);

  const days = useMemo(() => daysInMonth(viewMonth), [viewMonth]);
  const firstDayOffset = useMemo(() => {
    const first = parseISODate(`${viewMonth}-01`);
    return (first.getDay() + 6) % 7;
  }, [viewMonth]);
  const today = todayISO();

  const content = (
    <View style={inline ? styles.inlineOverlay : styles.overlay}>
      <Pressable
        style={StyleSheet.absoluteFill}
        onPress={onClose}
        accessibilityRole="button"
        accessibilityLabel="Tutup pemilih tanggal"
      />
        <View accessibilityViewIsModal style={styles.card}>
          <View style={styles.header}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Bulan sebelumnya"
              onPress={() => setViewMonth(addMonths(viewMonth, -1))}
              hitSlop={8}
              style={styles.nav}
            >
              <ChevronLeft size={20} color={colors.textMuted} />
            </Pressable>
            <AppText variant="bodyLg" weight="medium">
              {formatMonthLabel(viewMonth)}
            </AppText>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Bulan berikutnya"
              onPress={() => setViewMonth(addMonths(viewMonth, 1))}
              hitSlop={8}
              style={styles.nav}
            >
              <ChevronRight size={20} color={colors.textMuted} />
            </Pressable>
          </View>

          <View style={styles.weekdays}>
            {WEEK_START_MONDAY.map((day) => (
              <View key={day} style={styles.cell}>
                <AppText variant="labelSm" weight="medium" color={colors.textSubtle}>
                  {day}
                </AppText>
              </View>
            ))}
          </View>

          <View style={styles.grid}>
            {Array.from({ length: firstDayOffset }).map((_, index) => (
              <View key={`blank-${index}`} style={styles.cell} />
            ))}
            {days.map((date) => {
              const day = Number(date.slice(8, 10));
              const selected = date === value;
              const isToday = date === today;
              return (
                <Pressable
                  key={date}
                  accessibilityRole="button"
                  accessibilityLabel={formatDateLong(date)}
                  accessibilityState={{ selected }}
                  onPress={() => {
                    onSelect(date);
                    onClose();
                  }}
                  style={({ pressed }) => [
                    styles.cell,
                    styles.dayCell,
                    selected ? styles.daySelected : null,
                    !selected && isToday ? styles.dayToday : null,
                    { opacity: pressed ? 0.6 : 1 },
                  ]}
                >
                  <AppText
                    variant="bodySm"
                    weight={selected ? 'semiBold' : 'regular'}
                    color={selected ? colors.onPrimary : colors.text}
                  >
                    {day}
                  </AppText>
                </Pressable>
              );
            })}
          </View>

          <View style={styles.footer}>
            <AppText variant="labelSm" color={colors.textMuted}>
              Pilih tanggal
            </AppText>
            <Button
              label="Hari ini"
              onPress={() => {
                onSelect(todayISO());
                onClose();
              }}
              variant="ghost"
              size="sm"
            />
          </View>
        </View>
    </View>
  );

  if (inline) {
    return visible ? content : null;
  }

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      {content}
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: colors.overlay,
    alignItems: 'center',
    justifyContent: 'center',
    padding: space.xxl,
  },
  inlineOverlay: {
    ...StyleSheet.absoluteFill,
    zIndex: 100,
    backgroundColor: 'rgba(0, 31, 31, 0.42)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: space.xl,
  },
  card: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: colors.canvas,
    borderRadius: radii.card,
    padding: space.xl,
    ...shadowRaised,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: space.md,
  },
  nav: {
    width: 40,
    height: 40,
    borderRadius: radii.pill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surfaceMuted,
  },
  weekdays: {
    flexDirection: 'row',
    marginTop: space.xl,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: space.xs,
  },
  cell: {
    width: '14.2857%',
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayCell: {
    borderRadius: radii.pill,
  },
  daySelected: {
    backgroundColor: colors.primary,
  },
  dayToday: {
    borderWidth: 1,
    borderColor: colors.primary,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: space.md,
    paddingTop: space.md,
    borderTopWidth: 1,
    borderTopColor: colors.borderSubtle,
  },
});
