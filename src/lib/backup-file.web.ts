import * as DocumentPicker from 'expo-document-picker';

/** Downloads the backup through the browser. */
export async function saveBackupFile(name: string, text: string): Promise<void> {
  const url = URL.createObjectURL(new Blob([text], { type: 'application/json' }));
  const link = document.createElement('a');
  link.href = url;
  link.download = name;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

/** Lets the user choose a backup file and returns its text, or null if they cancel. */
export async function pickBackupFile(): Promise<string | null> {
  const result = await DocumentPicker.getDocumentAsync({ type: ['application/json', '.json'] });
  if (result.canceled) return null;

  const file = result.assets[0].file;
  return file ? file.text() : null;
}
