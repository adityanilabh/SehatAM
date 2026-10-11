import { StyleSheet, TextInput, View, type TextInputProps } from 'react-native';

import { AppText } from './app-text';

import { Colors, Fonts, Radius, Spacing } from '@/constants/theme';

export type FieldProps = TextInputProps & {
  label: string;
  /** Shown in red under the input, and marks it invalid. */
  error?: string | null;
};

/** A labelled text input. */
export function Field({ label, error, style, ...rest }: FieldProps) {
  return (
    <View style={styles.field}>
      <AppText type="caption" style={styles.label}>
        {label}
      </AppText>
      <TextInput
        aria-label={label}
        placeholderTextColor={Colors.muted}
        style={[styles.input, error ? styles.inputError : null, style]}
        {...rest}
      />
      {error ? (
        <AppText type="caption" color="danger">
          {error}
        </AppText>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  field: {
    gap: Spacing.two,
  },
  label: {
    fontFamily: Fonts.semiBold,
  },
  input: {
    height: 52,
    borderWidth: 1.5,
    borderColor: Colors.border,
    borderRadius: Radius.field,
    paddingHorizontal: 16,
    backgroundColor: Colors.card,
    fontFamily: Fonts.medium,
    fontSize: 16,
    color: Colors.ink,
  },
  inputError: {
    borderColor: Colors.danger,
  },
});
