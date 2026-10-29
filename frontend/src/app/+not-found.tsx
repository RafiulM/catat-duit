import { StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import { Compass } from 'lucide-react-native';
import { AppScaffold } from '@/components/AppScaffold';
import { EmptyState } from '@/components/EmptyState';
import { space } from '@/theme/tokens';

export default function NotFoundScreen() {
  return (
    <AppScaffold showTopBar>
      <View style={styles.container}>
        <EmptyState
          icon={Compass}
          title="Halaman tidak ditemukan"
          description="Tautannya mungkin sudah berubah. Kembali ke beranda untuk lanjut mencatat."
          actionLabel="Kembali ke beranda"
          onAction={() => router.replace('/')}
        />
      </View>
    </AppScaffold>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: space.xxxl,
  },
});
