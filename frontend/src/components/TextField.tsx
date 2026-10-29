import {
  forwardRef,
  useImperativeHandle,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import {
  Pressable,
  StyleSheet,
  TextInput,
  View,
  type StyleProp,
  type TextInputInstance,
  type TextInputProps,
  type ViewStyle,
} from 'react-native';
import { AppText } from './AppText';
import { colors, radii, space } from '@/theme/tokens';

type TextFieldProps = TextInputProps & {
  label?: string;
  hint?: string;
  error?: string;
  leftText?: string;
  left?: ReactNode;
  right?: ReactNode;
  containerStyle?: StyleProp<ViewStyle>;
};

export const TextField = forwardRef<TextInputInstance, TextFieldProps>(
  function TextField(
    {
      label,
      hint,
      error,
      leftText,
      left,
      right,
      containerStyle,
      style,
      onFocus,
      onBlur,
      ...rest
    },
    ref,
  ) {
    const [focused, setFocused] = useState(false);
    const inputRef = useRef<TextInputInstance>(null);

    useImperativeHandle(ref, () => inputRef.current as TextInputInstance, []);

    return (
      <View style={containerStyle}>
        {label ? (
          <AppText variant="labelSm" weight="semiBold" color={colors.textMuted}>
            {label}
          </AppText>
        ) : null}
        <Pressable
          accessible={false}
          onPress={() => inputRef.current?.focus()}
          style={[
            styles.field,
            label ? styles.fieldWithLabel : null,
            focused ? styles.fieldFocused : null,
            error ? styles.fieldError : null,
          ]}
        >
          {left}
          {leftText ? (
            <AppText variant="bodyMd" weight="medium" color={colors.textMuted}>
              {leftText}
            </AppText>
          ) : null}
          <TextInput
            ref={inputRef}
            {...rest}
            accessibilityLabel={rest.accessibilityLabel ?? label}
            onFocus={(event) => {
              setFocused(true);
              onFocus?.(event);
            }}
            onBlur={(event) => {
              setFocused(false);
              onBlur?.(event);
            }}
            placeholderTextColor={colors.textDisabled}
            selectionColor={colors.selection}
            style={[styles.input, style]}
          />
          {right}
        </Pressable>
        {error ? (
          <AppText
            variant="labelSm"
            color={colors.danger}
            style={styles.helper}
            accessibilityLiveRegion="polite"
          >
            {error}
          </AppText>
        ) : hint ? (
          <AppText variant="labelSm" color={colors.textMuted} style={styles.helper}>
            {hint}
          </AppText>
        ) : null}
      </View>
    );
  },
);

const styles = StyleSheet.create({
  field: {
    minHeight: 48,
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    paddingHorizontal: space.lg,
    backgroundColor: colors.canvas,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.control,
  },
  fieldWithLabel: {
    marginTop: space.md,
  },
  fieldFocused: {
    borderColor: colors.primary,
    shadowColor: colors.focusRing,
    shadowOpacity: 0.32,
    shadowRadius: 3,
    shadowOffset: { width: 0, height: 0 },
  },
  fieldError: {
    borderColor: colors.danger,
  },
  input: {
    flex: 1,
    minWidth: 0,
    paddingVertical: space.md,
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    lineHeight: 20,
    color: colors.text,
  },
  helper: {
    marginTop: space.sm,
  },
});
