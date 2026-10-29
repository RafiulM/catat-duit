import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { zodResolver } from '@hookform/resolvers/zod';
import { Controller, useForm } from 'react-hook-form';
import { z } from 'zod';
import { Check, ShieldCheck } from 'lucide-react-native';
import {
  AuthBackLink,
  AuthCard,
  AuthError,
  AuthHeading,
  AuthNote,
} from '@/components/AuthBits';
import { AuthScaffold } from '@/components/AuthScaffold';
import { Button } from '@/components/Button';
import { PasswordToggle } from '@/components/PasswordToggle';
import { TextField } from '@/components/TextField';
import { useToast } from '@/components/Toast';
import { ApiError, apiResetPassword } from '@/services/api';
import { space } from '@/theme/tokens';

const schema = z
  .object({
    password: z.string().min(8, 'Kata sandi minimal 8 karakter.'),
    confirmPassword: z.string().min(1, 'Ulangi kata sandi dulu.'),
  })
  .refine((values) => values.password === values.confirmPassword, {
    message: 'Kata sandi belum sama.',
    path: ['confirmPassword'],
  });

type FormValues = z.infer<typeof schema>;

export default function ResetPasswordScreen() {
  const { showToast } = useToast();
  const params = useLocalSearchParams<{ token?: string | string[] }>();
  const token = Array.isArray(params.token) ? params.token[0] : params.token;
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);
  const [apiError, setApiError] = useState('');

  const { control, handleSubmit } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { password: '', confirmPassword: '' },
  });

  const onSubmit = async (values: FormValues) => {
    if (!token) {
      setApiError('Tautan reset tidak lengkap. Minta tautan baru dari halaman lupa kata sandi.');
      return;
    }
    setBusy(true);
    setApiError('');
    try {
      await apiResetPassword({ token, newPassword: values.password });
      showToast({
        title: 'Kata sandi diperbarui',
        detail: 'Masuk lagi dengan kata sandi baru.',
      });
      router.replace('/auth/masuk');
    } catch (error) {
      setApiError(
        error instanceof ApiError
          ? error.message
          : 'Kata sandi gagal diperbarui. Minta tautan baru.',
      );
    } finally {
      setBusy(false);
    }
  };

  return (
    <AuthScaffold>
      <AuthCard>
        <AuthBackLink onPress={() => router.replace('/auth/masuk')} />
        <AuthHeading
          eyebrow="Pemulihan akun"
          title="Kata sandi baru"
          subtitle="Buat kata sandi yang kuat dan mudah kamu ingat."
        />

        <View style={styles.form}>
          {!token ? (
            <AuthError message="Tautan reset tidak lengkap. Minta tautan baru lewat halaman lupa kata sandi." />
          ) : null}

          <Controller
            control={control}
            name="password"
            render={({ field, fieldState }) => (
              <TextField
                label="Kata sandi baru"
                accessibilityLabel="Kata sandi baru akun"
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
                accessibilityLabel="Ulangi kata sandi baru akun"
                value={field.value}
                onChangeText={field.onChange}
                onBlur={field.onBlur}
                error={fieldState.error?.message}
                placeholder="Ulangi kata sandi baru"
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
            label="Simpan kata sandi"
            onPress={() => void handleSubmit(onSubmit)()}
            icon={Check}
            loading={busy}
            disabled={!token}
            fullWidth
          />

          <AuthNote icon={ShieldCheck}>
            Setelah kata sandi diubah, semua sesi lama dicabut dan kamu masuk lagi.
          </AuthNote>
        </View>
      </AuthCard>
    </AuthScaffold>
  );
}

const styles = StyleSheet.create({
  form: {
    marginTop: space.xl,
    gap: space.lg,
  },
});
