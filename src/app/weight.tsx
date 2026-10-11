import { AppText } from '@/components/app-text';
import { Card } from '@/components/card';
import { Screen } from '@/components/screen';

export default function WeightScreen() {
  return (
    <Screen title="Weight" eyebrow="Optional, log when you like">
      <Card>
        <AppText type="caption">Your weight entries and graph will appear here.</AppText>
      </Card>
    </Screen>
  );
}
