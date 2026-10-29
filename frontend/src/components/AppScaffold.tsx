import type { ReactNode, RefObject } from 'react';
import {
  ScrollView,
  StyleSheet,
  View,
  type RefreshControlProps,
  type ScrollViewInstance,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { TopBar } from './TopBar';
import { colors, layout, space } from '@/theme/tokens';

type AppScaffoldProps = {
  children: ReactNode;
  scroll?: boolean;
  contentStyle?: StyleProp<ViewStyle>;
  refreshControl?: React.ReactElement<RefreshControlProps>;
  showTopBar?: boolean;
  noPadding?: boolean;
  scrollRef?: RefObject<ScrollViewInstance | null>;
};

export function AppScaffold({
  children,
  scroll = true,
  contentStyle,
  refreshControl,
  showTopBar = true,
  noPadding = false,
  scrollRef,
}: AppScaffoldProps) {
  return (
    <SafeAreaView edges={['top']} style={styles.safeArea}>
      <View style={styles.shell}>
        {showTopBar ? <TopBar /> : null}
        {scroll ? (
          <ScrollView
            ref={scrollRef}
            style={styles.scroll}
            contentContainerStyle={[
              styles.content,
              noPadding ? styles.noPadding : null,
              contentStyle,
            ]}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
            refreshControl={refreshControl}
          >
            {children}
          </ScrollView>
        ) : (
          <View style={[styles.flex, contentStyle]}>{children}</View>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.surfaceMuted,
  },
  shell: {
    flex: 1,
    width: '100%',
    maxWidth: layout.pageMaxWidth,
    alignSelf: 'center',
    backgroundColor: colors.surface,
  },
  scroll: {
    flex: 1,
  },
  content: {
    paddingHorizontal: space.xl,
    paddingTop: space.lg,
    paddingBottom: space.xxl,
  },
  noPadding: {
    paddingHorizontal: 0,
    paddingTop: 0,
  },
  flex: {
    flex: 1,
  },
});
