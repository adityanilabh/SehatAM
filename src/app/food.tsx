import { AppText } from '@/components/app-text';
import { Card } from '@/components/card';
import { Screen } from '@/components/screen';

export default function FoodScreen() {
  return (
    <Screen title="Food">
      <Card>
        <AppText type="caption">Your food log for the day will appear here.</AppText>
      </Card>
    </Screen>
  );
}
