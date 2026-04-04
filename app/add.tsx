import { Redirect } from 'expo-router';

// Deep link target for the iOS widget "Wasser hinzufügen" button.
// watertracker://add → öffnet die Home-Tab wo der User Wasser schnell hinzufügen kann.
export default function AddRoute() {
  return <Redirect href="/(tabs)/" />;
}
