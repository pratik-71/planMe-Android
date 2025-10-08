import React, {useMemo, useState} from 'react';
import {View, Text, TextInput, TouchableOpacity, StyleSheet} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import {theme} from '../../../stores/ThemeStore';

interface Props {
  onAdded: (amount: number) => void;
}

export default function ProteinIntakeInput({onAdded}: Props) {
  const [amount, setAmount] = useState<string>('');
  const canAdd = useMemo(() => {
    const n = Number(amount);
    return !Number.isNaN(n) && n > 0 && n < 1000;
  }, [amount]);

  return (
    <View>
      <TextInput
        keyboardType="numeric"
        value={amount}
        onChangeText={setAmount}
        placeholder="Add grams e.g. 25"
        placeholderTextColor={theme.textTertiary}
        style={styles.input}
      />
      <TouchableOpacity
        onPress={() => canAdd && onAdded(Number(amount))}
        disabled={!canAdd}
        style={[styles.btn, !canAdd && styles.btnDisabled]}>
        <LinearGradient
          colors={[theme.accent, theme.primary]}
          style={styles.btnGradient}
          start={{x: 0, y: 0}}
          end={{x: 1, y: 0}}>
          <Text style={styles.btnText}>Add to today</Text>
        </LinearGradient>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  input: {
    borderWidth: 1,
    borderColor: theme.borderLight,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: theme.textPrimary,
    backgroundColor: theme.surfaceVariant,
    marginTop: 8,
  },
  btn: {borderRadius: 12, overflow: 'hidden', marginTop: 12},
  btnDisabled: {opacity: 0.6},
  btnGradient: {paddingVertical: 12, alignItems: 'center'},
  btnText: {color: '#fff', fontWeight: '700'},
});


