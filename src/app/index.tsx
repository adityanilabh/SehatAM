import { AppText } from '@/components/app-text';
import { Card } from '@/components/card';
import { Screen } from '@/components/screen';
import { greetingFor } from '@/lib/greeting';

export default function HomeScreen() {
  const now = new Date();
  const today = now.toLocaleDateString('en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });

  return (
    <Screen title={greetingFor(now.getHours())} eyebrow={today}>
      <Card>
        <AppText type="caption">
          Today&apos;s summary, your latest weight and recent items will appear here.
        </AppText>
      </Card>
    </Screen>
  );
}
