import { Tabs } from 'expo-router/js-tabs';
import { BottomNav } from '@/components/BottomNav';
import { colors } from '@/theme/tokens';

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        sceneStyle: { backgroundColor: colors.surface },
      }}
      tabBar={(props) => <BottomNav {...props} />}
    >
      <Tabs.Screen name="index" options={{ title: 'Catat' }} />
      <Tabs.Screen name="riwayat" options={{ title: 'Riwayat' }} />
      <Tabs.Screen name="analisis" options={{ title: 'Analisis' }} />
      <Tabs.Screen name="pengaturan" options={{ title: 'Pengaturan' }} />
    </Tabs>
  );
}
