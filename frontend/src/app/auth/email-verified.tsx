import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { CircleAlert, CircleCheck } from 'lucide-react-native';
import { AuthCard, AuthHeading } from '@/components/AuthBits';
import { AuthScaffold } from '@/components/AuthScaffold';
import { AppText } from '@/components/AppText';
import { Button } from '@/components/Button';
import { useAuthStore } from '@/stores/auth-store';
import { colors, radii, space } from '@/theme/tokens';

export default function EmailVerifiedScreen() {
  const params = useLocalSearchParams<{
    error?: string | string[];
    error_description?: string | string[];
  }>();
  const status = useAuthStore((state) => state.status);
  const refreshUser = useAuthStore((state) => state.refreshUser);

  const error = Array.isArray(params.error) ? params.error[0] : params.error;
  const errorDescription = Array.isArray(params.error_description)
    ? params.error_description[0]
    : params.error_description;

  useEffect(() => {
    // The backend has already verified the address. Wait for bootstrap to load
    // the stored token, then refresh the cached profile so Pengaturan reflects
    // the new email/verified status immediately.
    if (!error && status === 'authed') {
      void refreshUser();
    }
  }, [error, refreshUser, status]);

  const success = !error;

  return (
    <AuthScaffold>
      <AuthCard>
        <View style={styles.content}>
          <View
            style={[
              styles.icon,
              {
                backgroundColor: success ? colors.positiveSoft : colors.dangerSoft,
              },
            ]}
          >
            {success ? (
              <CircleCheck size={22} color={colors.positive} />
            ) : (
              <CircleAlert size={22} color={colors.danger} />
            )}
          </View>

          <AuthHeading
            eyebrow="Verifikasi email"
            title={success ? 'Email berhasil diverifikasi' : 'Verifikasi gagal'}
            subtitle={
              success
                ? 'Alamat email akunmu sekarang sudah aktif. Perubahan email langsung berlaku.'
                : 'Tautan verifikasi tidak valid atau sudah kedaluwarsa. Minta tautan baru dari halaman pengaturan.'
            }
          />

          {!success ? (
            <AppText
              variant="labelSm"
              color={colors.textMuted}
              align="center"
              style={styles.detail}
            >
              {errorDescription ?? error}
            </AppText>
          ) : null}

          <Button
            label={success ? 'Kembali ke pengaturan' : 'Buka pengaturan'}
            onPress={() => router.replace('/pengaturan')}
            fullWidth
            style={styles.action}
          />
        </View>
      </AuthCard>
    </AuthScaffold>
  );
}

const styles = StyleSheet.create({
  content: {
    alignItems: 'center',
  },
  icon: {
    width: 52,
    height: 52,
    borderRadius: radii.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  detail: {
    marginTop: space.lg,
  },
  action: {
    marginTop: space.xl,
  },
});
