import * as DocumentPicker from 'expo-document-picker';
import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';

/**
 * Saving and opening backup files on a phone. The browser version of these two
 * functions is in `backup-file.web.ts`.
 */

/** Writes the backup and opens the share sheet so it can be saved or sent somewhere safe. */
export async function saveBackupFile(name: string, text: string): Promise<void> {
  const file = new File(Paths.cache, name);
  if (file.exists) {
    file.delete();
  }
  file.create();
  file.write(text);

  await Sharing.shareAsync(file.uri, {
    mimeType: 'application/json',
    dialogTitle: 'Save your SehatAM backup',
  });
}

/** Lets the user choose a backup file and returns its text, or null if they cancel. */
export async function pickBackupFile(): Promise<string | null> {
  const result = await DocumentPicker.getDocumentAsync({
    // Some file managers label .json files as plain text or as unknown.
    type: ['application/json', 'text/plain', 'application/octet-stream'],
    copyToCacheDirectory: true,
  });
  if (result.canceled) return null;

  return new File(result.assets[0].uri).textSync();
}
