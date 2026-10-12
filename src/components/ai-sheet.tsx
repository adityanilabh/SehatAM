import * as Clipboard from 'expo-clipboard';
import { useState } from 'react';
import { Share, StyleSheet, TextInput, View } from 'react-native';

import { AppText } from './app-text';
import { Button } from './button';
import { notify } from './confirm';
import { Sheet } from './sheet';

import { Colors, Fonts, Radius, Spacing } from '@/constants/theme';
import { type FoodEntry } from '@/db/food';
import { setFoodCalories } from '@/db/food-totals';
import { rememberCalories } from '@/db/memory';
import { useDb } from '@/db/provider';
import { buildCaloriePrompt, parseCalorieReply } from '@/lib/ai-handoff';
import { formatNumber } from '@/lib/format';

export type AiSheetProps = {
  /** The items that have no calorie figure yet. */
  items: FoodEntry[];
  onClose: () => void;
};

/**
 * Gets calories from an AI app the user already has. The prompt is sent through
 * the phone's share sheet; the reply is pasted back and read here. What comes back
 * is saved on the items and remembered for next time.
 */
export function AiSheet({ items, onClose }: AiSheetProps) {
  const { db, invalidate } = useDb();
  const [reply, setReply] = useState('');
  const prompt = buildCaloriePrompt(items.map((item) => item.foodText));
  const parsed = parseCalorieReply(reply, items.length);
  const found = parsed.filter((kcal) => kcal !== null).length;

  const copyPrompt = async () => {
    await Clipboard.setStringAsync(prompt);
    notify('Prompt copied', 'Paste it into ChatGPT, Claude, Gemini or another AI app.');
  };

  const openAiApp = async () => {
    try {
      await Share.share({ message: prompt });
    } catch {
      // Browsers without a share sheet: copy the prompt instead.
      await copyPrompt();
    }
  };

  const pasteReply = async () => {
    const text = await Clipboard.getStringAsync();
    if (text.trim() === '') {
      notify('Nothing to paste', "Copy the AI app's reply first, then come back and paste.");
      return;
    }
    setReply(text);
  };

  const save = async () => {
    for (const [index, kcal] of parsed.entries()) {
      if (kcal === null) continue;
      await setFoodCalories(db, items[index].id, kcal, 'ai');
      await rememberCalories(db, items[index].foodText, kcal);
    }
    invalidate();
    onClose();
  };

  return (
    <Sheet visible title="Ask an AI app" onClose={onClose}>
      <View style={styles.step}>
        <AppText style={styles.stepTitle}>1. Send the question</AppText>
        <AppText type="caption">
          This sends a ready-made question about {items.length === 1 ? 'this food' : 'these foods'}{' '}
          to an AI app on your phone, such as ChatGPT, Claude or Gemini.
        </AppText>
        <View style={styles.buttons}>
          <Button label="Open an AI app" tone="accent" style={styles.grow} onPress={openAiApp} />
          <Button label="Copy" tone="outline" onPress={copyPrompt} />
        </View>
      </View>

      <View style={styles.step}>
        <AppText style={styles.stepTitle}>2. Paste the reply</AppText>
        <AppText type="caption">Copy the reply in the AI app, come back here, and paste it.</AppText>
        <TextInput
          aria-label="Reply from the AI app"
          value={reply}
          onChangeText={setReply}
          placeholder={'1 | 240\n2 | 180'}
          placeholderTextColor={Colors.muted}
          multiline
          style={styles.reply}
        />
        <Button label="Paste reply" tone="outline" onPress={pasteReply} />
      </View>

      {reply.trim() !== '' ? (
        <View style={styles.step}>
          <AppText style={styles.stepTitle}>3. Check and save</AppText>
          {items.map((item, index) => (
            <View key={item.id} style={styles.result}>
              <AppText style={styles.resultFood} numberOfLines={2}>
                {item.foodText}
              </AppText>
              <AppText style={parsed[index] === null ? styles.resultMissing : styles.resultKcal}>
                {parsed[index] === null ? 'Not in reply' : `${formatNumber(parsed[index]!)} kcal`}
              </AppText>
            </View>
          ))}
          {found === 0 ? (
            <AppText type="caption" color="danger">
              No calories could be read from that reply. It should have lines like &quot;1 | 240&quot;.
            </AppText>
          ) : null}
        </View>
      ) : null}

      <Button
        label={found > 0 ? `Save ${found} ${found === 1 ? 'figure' : 'figures'}` : 'Save'}
        tone="accent"
        disabled={found === 0}
        onPress={save}
      />
    </Sheet>
  );
}

const styles = StyleSheet.create({
  step: {
    gap: Spacing.two,
  },
  stepTitle: {
    fontFamily: Fonts.bold,
  },
  buttons: {
    flexDirection: 'row',
    gap: 10,
  },
  grow: {
    flex: 1,
  },
  reply: {
    minHeight: 96,
    borderWidth: 1.5,
    borderColor: Colors.border,
    borderRadius: Radius.field,
    padding: 14,
    fontFamily: Fonts.medium,
    fontSize: 15,
    color: Colors.ink,
    textAlignVertical: 'top',
  },
  result: {
    minHeight: 44,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.three,
    borderBottomWidth: 1,
    borderBottomColor: Colors.line,
  },
  resultFood: {
    flex: 1,
  },
  resultKcal: {
    fontFamily: Fonts.bold,
  },
  resultMissing: {
    fontSize: 13,
    color: Colors.muted,
  },
});
