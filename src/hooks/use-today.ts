import { useEffect, useState } from 'react';
import { AppState } from 'react-native';

import { useDb } from '@/db/provider';
import { logDateFor, type LogDate } from '@/lib/day';

/**
 * The current log date, honouring the day-start setting. It refreshes each minute
 * and whenever the app returns to the foreground, so a screen left open overnight
 * rolls over to the new day.
 */
export function useToday(): LogDate {
  const { settings } = useDb();
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const refresh = () => setNow(new Date());
    const timer = setInterval(refresh, 60_000);
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') refresh();
    });
    return () => {
      clearInterval(timer);
      subscription.remove();
    };
  }, []);

  return logDateFor(now, settings.dayStartHour);
}
