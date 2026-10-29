import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import { zodResolver } from '@hookform/resolvers/zod';
import { Controller, useForm } from 'react-hook-form';
import { z } from 'zod';
import { ArrowRight, Check, CloudUpload, UserPlus } from 'lucide-react-native';
import {
  AuthBackLink,
  AuthCard,
  AuthError,
  AuthFooterLink,
  AuthHeading,
  AuthNote,
} from '@/components/AuthBits';
import { AuthScaffold } from '@/components/AuthScaffold';
import { AppText } from '@/components/AppText';
import { Button } from '@/components/Button';
import { PasswordToggle } from '@/components/PasswordToggle';
import { TextField } from '@/components/TextField';
import { ApiError } from '@/services/api';
import { syncNow } from '@/services/sync';
import { useAuthStore } from '@/stores/auth-store';
import { colors, radii, space } from '@/theme/tokens';

const schema = z
  .object({
    name: z
      .string()
      .trim()
      .min(2, 'Nama minimal 2 karakter.')
      .max(80, 'Nama terlalu panjang.'),
    email: z
      .string()
      .trim()
      .min(1, 'Email wajib diisi.')
      .email('Format email belum benar.'),
    password: z.string().min(8, 'Kata sandi minimal 8 karakter.'),
    confirmPassword: z.string().min(1, 'Ulangi kata sandi dulu.'),
  })
  .refine((values) => values.password === values.confirmPassword, {
    message: 'Kata sandi belum sama.',
    path: ['confirmPassword'],
  });

type FormValues = z.infer<typeof schema>;

export default function RegisterScreen() {
  const signUp = useAuthStore((state) => state.signUp);
  const busy = useAuthStore((state) => state.busy);
  const [showPassword, setShowPassword] = useState(false);
  const [apiError, setApiError] = useState('');
  const [success, setSuccess] = useState(false);

  const { control, handleSubmit } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { name: '', email: '', password: '', confirmPassword: '' },
  });

  const onSubmit = async (values: FormValues) => {
    setApiError('');
    try {
      await signUp(values.name, values.email, values.password);
      setSuccess(true);
      void syncNow();
    } catch (error) {
      setApiError(
        error instanceof ApiError
          ? error.message
          : 'Akun gagal dibuat. Coba lagi sebentar.',
      );
    }
  };

  if (success) {
    return (
      <AuthScaffold>
        <AuthCard>
          <View style={styles.success}>
            <View style={styles.successIcon}>
              <Check size={20} color={colors.positive} />
            </View>
            <AppText
              variant="labelSm"
              weight="semiBold"
              color={colors.textSubtle}
              style={styles.successEyebrow}
            >
              AKUN SIAP
            </AppText>
            <AppText variant="headingSm" align="center" style={styles.successTitle}>
              Akun berhasil dibuat
            </AppText>
            <AppText variant="bodySm" color={colors.textMuted} align="center">
              Data lokalmu sedang disiapkan untuk diunggah ke server.
            </AppText>
            <View style={styles.successNote}>
              <AuthNote icon={CloudUpload}>
                Transaksi, kategori, dan pengaturan akan tersedia di perangkat lain
                setelah sinkronisasi.
              </AuthNote>
            </View>
            <Button
              label="Mulai mencatat"
              onPress={() => router.replace('/')}
              icon={ArrowRight}
              fullWidth
              style={styles.successAction}
            />
            <AuthFooterLink
              prefix="Sudah punya akun?"
              actionLabel="Masuk"
              onAction={() => router.replace('/auth/masuk')}
            />
          </View>
        </AuthCard>
      </AuthScaffold>
    );
  }

  return (
    <AuthScaffold>
      <AuthCard>
        <AuthBackLink onPress={() => router.replace('/auth/masuk')} />
        <AuthHeading
          eyebrow="Akun baru"
          title="Buat akun"
          subtitle="Simpan catatanmu aman di server."
        />

        <View style={styles.form}>
          <Controller
            control={control}
            name="name"
            render={({ field, fieldState }) => (
              <TextField
                label="Nama"
                accessibilityLabel="Nama lengkap"
                value={field.value}
                onChangeText={field.onChange}
                onBlur={field.onBlur}
                error={fieldState.error?.message}
                placeholder="Nama kamu"
                autoCapitalize="words"
                autoComplete="name"
                textContentType="name"
                returnKeyType="next"
              />
            )}
          />

          <Controller
            control={control}
            name="email"
            render={({ field, fieldState }) => (
              <TextField
                label="Email"
                accessibilityLabel="Email akun"
                value={field.value}
                onChangeText={field.onChange}
                onBlur={field.onBlur}
                error={fieldState.error?.message}
                placeholder="nama@email.com"
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                autoComplete="email"
                textContentType="emailAddress"
                returnKeyType="next"
              />
            )}
          />

          <Controller
            control={control}
            name="password"
            render={({ field, fieldState }) => (
              <TextField
                label="Kata sandi"
                accessibilityLabel="Kata sandi akun"
                value={field.value}
                onChangeText={field.onChange}
                onBlur={field.onBlur}
                error={fieldState.error?.message}
                placeholder="Minimal 8 karakter"
                secureTextEntry={!showPassword}
                autoCapitalize="none"
                autoComplete="new-password"
                textContentType="newPassword"
                returnKeyType="next"
                right={
                  <PasswordToggle
                    visible={showPassword}
                    onPress={() => setShowPassword((current) => !current)}
                  />
                }
              />
            )}
          />

          <Controller
            control={control}
            name="confirmPassword"
            render={({ field, fieldState }) => (
              <TextField
                label="Ulangi kata sandi"
                accessibilityLabel="Ulangi kata sandi akun"
                value={field.value}
                onChangeText={field.onChange}
                onBlur={field.onBlur}
                error={fieldState.error?.message}
                placeholder="Ketik ulang kata sandi"
                secureTextEntry={!showPassword}
                autoCapitalize="none"
                autoComplete="new-password"
                textContentType="newPassword"
                returnKeyType="done"
                onSubmitEditing={() => void handleSubmit(onSubmit)()}
              />
            )}
          />

          <AuthError message={apiError} />

          <Button
            label="Buat akun"
            onPress={() => void handleSubmit(onSubmit)()}
            icon={UserPlus}
            loading={busy}
            fullWidth
          />

          <AuthNote icon={CloudUpload}>
            Data lokal yang sudah kamu catat akan diunggah otomatis setelah akun dibuat.
          </AuthNote>
        </View>

        <AuthFooterLink
          prefix="Sudah punya akun?"
          actionLabel="Masuk"
          onAction={() => router.replace('/auth/masuk')}
        />
      </AuthCard>
    </AuthScaffold>
  );
}

const styles = StyleSheet.create({
  form: {
    marginTop: space.xl,
    gap: space.lg,
  },
  success: {
    alignItems: 'center',
  },
  successIcon: {
    width: 48,
    height: 48,
    borderRadius: radii.pill,
    backgroundColor: colors.positiveSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  successEyebrow: {
    marginTop: space.lg,
    letterSpacing: 0.6,
  },
  successTitle: {
    marginTop: 2,
    marginBottom: space.xs,
  },
  successNote: {
    width: '100%',
    marginTop: space.lg,
  },
  successAction: {
    marginTop: space.xl,
  },
});
