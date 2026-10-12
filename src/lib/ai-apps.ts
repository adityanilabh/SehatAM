import * as IntentLauncher from 'expo-intent-launcher';
import { Linking, Platform } from 'react-native';

/**
 * The AI apps offered for a calorie question, and how to hand the question to one.
 * On Android the text is sent straight into the chosen app. The browser version of
 * `sendToAiApp` is in `ai-apps.web.ts`.
 */

export type AiApp = {
  name: string;
  /** The app's Android package name. */
  packageName: string;
  /** The app's website. Where `prefill` is true, adding the question to it fills it in. */
  url: string;
  prefill: boolean;
};

export const AI_APPS: AiApp[] = [
  { name: 'ChatGPT', packageName: 'com.openai.chatgpt', url: 'https://chatgpt.com/?q=', prefill: true },
  { name: 'Claude', packageName: 'com.anthropic.claude', url: 'https://claude.ai/new?q=', prefill: true },
  { name: 'Gemini', packageName: 'com.google.android.apps.bard', url: 'https://gemini.google.com/app', prefill: false },
  { name: 'Grok', packageName: 'ai.x.grok', url: 'https://grok.com/?q=', prefill: true },
  { name: 'DeepSeek', packageName: 'com.deepseek.chat', url: 'https://chat.deepseek.com/', prefill: false },
  { name: 'Copilot', packageName: 'com.microsoft.copilot', url: 'https://copilot.microsoft.com/?q=', prefill: true },
  { name: 'Perplexity', packageName: 'ai.perplexity.app.android', url: 'https://www.perplexity.ai/search?q=', prefill: true },
];

export function webAddressFor(app: AiApp, prompt: string): string {
  return app.prefill ? app.url + encodeURIComponent(prompt) : app.url;
}

/**
 * Sends the question to one AI app. Returns false when the app is not installed
 * (Android) or could not be opened.
 */
export async function sendToAiApp(app: AiApp, prompt: string): Promise<boolean> {
  try {
    if (Platform.OS === 'android') {
      // The same "send text" request the share sheet makes, aimed at one app.
      await IntentLauncher.startActivityAsync('android.intent.action.SEND', {
        type: 'text/plain',
        packageName: app.packageName,
        extra: { 'android.intent.extra.TEXT': prompt },
      });
      return true;
    }
    await Linking.openURL(webAddressFor(app, prompt));
    return true;
  } catch {
    return false;
  }
}
