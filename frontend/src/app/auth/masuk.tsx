import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import { zodResolver } from '@hookform/resolvers/zod';
import { Controller, useForm } from 'react-hook-form';
import { z } from 'zod';
import { ArrowRight, CloudCheck, LogIn } from 'lucide-react-native';
import {
  AuthCard,
  AuthDivider,
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
import { useToast } from '@/components/Toast';
import { ApiError } from '@/services/api';
import { syncNow } from '@/services/sync';
import { useAuthStore } from '@/stores/auth-store';
import { colors, space } from '@/theme/tokens';

const schema = z.object({
  email: z
    .string()
    .trim()
    .min(1, 'Email wajib diisi.')
    .email('Format email belum benar.'),
  password: z.string().min(1, 'Kata sandi wajib diisi.'),
});

type FormValues = z.infer<typeof schema>;

export default function LoginScreen() {
  const { showToast } = useToast();
  const signIn = useAuthStore((state) => state.signIn);
  const busy = useAuthStore((state) => state.busy);
  const [showPassword, setShowPassword] = useState(false);
  const [apiError, setApiError] = useState('');

  const {
    control,
    handleSubmit,
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { email: '', password: '' },
  });

  const onSubmit = async (values: FormValues) => {
    setApiError('');
    try {
      await signIn(values.email, values.password);
      void syncNow();
      const name = useAuthStore.getState().user?.name;
      showToast({
        title: name ? `Selamat datang, ${name.split(/\s+/)[0]}` : 'Selamat datang',
        detail: 'Catatan lokal mulai dicadangkan ke server.',
      });
      if (router.canGoBack()) router.back();
      else router.replace('/pengaturan');
    } catch (error) {
      setApiError(
        error instanceof ApiError
          ? error.message
          : 'Tidak bisa masuk. Periksa email dan kata sandi.',
      );
    }
  };

  return (
    <AuthScaffold>
      <AuthCard>
        <AuthHeading
          eyebrow="Selamat datang"
          title="Masuk ke akunmu"
          subtitle="Lanjutkan catatan keuanganmu dari perangkat mana pun."
        />

        <View style={styles.form}>
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

          <View>
            <View style={styles.passwordHeader}>
              <AppText variant="labelSm" weight="semiBold" color={colors.textMuted}>
                Kata sandi
              </AppText>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Lupa kata sandi"
                onPress={() => router.push('/auth/lupa-sandi')}
                hitSlop={6}
                style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1 })}
              >
                <AppText variant="labelSm" weight="semiBold" color={colors.primary}>
                  Lupa kata sandi?
                </AppText>
              </Pressable>
            </View>
            <Controller
              control={control}
              name="password"
              render={({ field, fieldState }) => (
                <TextField
                  accessibilityLabel="Kata sandi akun"
                  value={field.value}
                  onChangeText={field.onChange}
                  onBlur={field.onBlur}
                  error={fieldState.error?.message}
                  placeholder="Masukkan kata sandi"
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                  autoComplete="current-password"
                  textContentType="password"
                  returnKeyType="done"
                  onSubmitEditing={() => void handleSubmit(onSubmit)()}
                  containerStyle={styles.passwordField}
                  right={
                    <PasswordToggle
                      visible={showPassword}
                      onPress={() => setShowPassword((current) => !current)}
                    />
                  }
                />
              )}
            />
          </View>

          <AuthError message={apiError} />

          <Button
            label="Masuk"
            accessibilityLabel="Masuk ke akun"
            onPress={() => void handleSubmit(onSubmit)()}
            icon={LogIn}
            loading={busy}
            fullWidth
          />

          <AuthDivider />

          <Button
            label="Lanjut tanpa akun"
            onPress={() => router.replace('/')}
            icon={ArrowRight}
            variant="secondary"
            fullWidth
          />

          <AuthNote icon={CloudCheck}>
            Semua transaksi dan kategori akan dimuat otomatis setelah masuk.
          </AuthNote>
        </View>

        <AuthFooterLink
          prefix="Belum punya akun?"
          actionLabel="Daftar"
          onAction={() => router.push('/auth/daftar')}
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
  passwordHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: space.md,
    marginBottom: space.md,
  },
  passwordField: {
    marginTop: 0,
  },
});
