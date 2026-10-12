/**
 * The browser version: an AI app is opened as its website in a new tab, with the
 * question filled in where the site supports that.
 */

export type AiApp = {
  name: string;
  packageName: string;
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

export async function sendToAiApp(app: AiApp, prompt: string): Promise<boolean> {
  return window.open(webAddressFor(app, prompt), '_blank', 'noopener') !== null;
}
