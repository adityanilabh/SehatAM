import { AppText } from '@/components/app-text';
import { Card } from '@/components/card';
import { Screen } from '@/components/screen';

export default function SettingsScreen() {
  return (
    <Screen title="Settings">
      <Card>
        <AppText type="caption">Goals, reminders and your data options will appear here.</AppText>
      </Card>
    </Screen>
  );
}
