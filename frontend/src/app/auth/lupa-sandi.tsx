import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import { zodResolver } from '@hookform/resolvers/zod';
import { Controller, useForm } from 'react-hook-form';
import { z } from 'zod';
import { ArrowLeft, Clock3, MailCheck, Send, ShieldCheck } from 'lucide-react-native';
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
import { TextField } from '@/components/TextField';
import { ApiError, apiRequestPasswordReset } from '@/services/api';
import { colors, radii, space } from '@/theme/tokens';

const schema = z.object({
  email: z
    .string()
    .trim()
    .min(1, 'Email wajib diisi.')
    .email('Format email belum benar.'),
});

type FormValues = z.infer<typeof schema>;

export default function ForgotPasswordScreen() {
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [apiError, setApiError] = useState('');
  const { control, handleSubmit, getValues } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { email: '' },
  });

  const onSubmit = async (values: FormValues) => {
    setBusy(true);
    setApiError('');
    try {
      await apiRequestPasswordReset(values.email);
      setSent(true);
    } catch (error) {
      setApiError(
        error instanceof ApiError
          ? error.message
          : 'Tautan reset gagal dikirim. Coba lagi.',
      );
    } finally {
      setBusy(false);
    }
  };

  if (sent) {
    return (
      <AuthScaffold>
        <AuthCard>
          <View style={styles.success}>
            <View style={styles.successIcon}>
              <MailCheck size={20} color={colors.positive} />
            </View>
            <AppText
              variant="labelSm"
              weight="semiBold"
              color={colors.textSubtle}
              style={styles.successEyebrow}
            >
              TAUTAN TERKIRIM
            </AppText>
            <AppText variant="headingSm" align="center" style={styles.successTitle}>
              Cek emailmu
            </AppText>
            <AppText variant="bodySm" color={colors.textMuted} align="center">
              Kami sudah mengirim tautan reset ke {getValues('email')}.
            </AppText>
            <View style={styles.successNote}>
              <AuthNote icon={Clock3}>
                Tautan berlaku 1 jam. Cek folder spam jika belum masuk.
              </AuthNote>
            </View>
            <Button
              label="Kembali ke masuk"
              onPress={() => router.replace('/auth/masuk')}
              icon={ArrowLeft}
              fullWidth
              style={styles.successAction}
            />
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Kirim ulang tautan"
              onPress={() => setSent(false)}
              hitSlop={6}
              style={({ pressed }) => [styles.retry, { opacity: pressed ? 0.6 : 1 }]}
            >
              <AppText variant="labelSm" weight="semiBold" color={colors.primary}>
                Kirim ulang tautan
              </AppText>
            </Pressable>
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
          eyebrow="Pemulihan akun"
          title="Lupa kata sandi?"
          subtitle="Masukkan email akunmu. Kami akan mengirim tautan untuk membuat kata sandi baru."
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
                returnKeyType="done"
                onSubmitEditing={() => void handleSubmit(onSubmit)()}
              />
            )}
          />

          <AuthError message={apiError} />

          <Button
            label="Kirim tautan reset"
            onPress={() => void handleSubmit(onSubmit)()}
            icon={Send}
            loading={busy}
            fullWidth
          />

          <AuthNote icon={ShieldCheck}>
            Kami tidak akan pernah meminta kata sandi kamu lewat email.
          </AuthNote>
        </View>

        <AuthFooterLink
          prefix="Ingat kata sandimu?"
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
  retry: {
    marginTop: space.lg,
    paddingVertical: space.xs,
  },
});
