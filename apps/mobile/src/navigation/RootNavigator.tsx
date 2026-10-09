import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { HomeScreen } from '../screens/HomeScreen';
import { CreateAlarmScreen } from '../screens/CreateAlarmScreen';
import { RingingScreen } from '../screens/RingingScreen';
import { LoginScreen } from '../screens/LoginScreen';

export type RootStackParamList = {
  Home: undefined;
  CreateAlarm: undefined;
  Ringing: { alarmId: string };
  Login: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export function RootNavigator() {
  return (
    <Stack.Navigator initialRouteName="Home">
      <Stack.Screen name="Home" component={HomeScreen} options={{ title: 'Alarme' }} />
      <Stack.Screen
        name="CreateAlarm"
        component={CreateAlarmScreen}
        options={{ title: 'New alarm' }}
      />
      <Stack.Screen
        name="Ringing"
        component={RingingScreen}
        options={{ headerShown: false, gestureEnabled: false }}
      />
      <Stack.Screen name="Login" component={LoginScreen} options={{ title: 'Sign in' }} />
    </Stack.Navigator>
  );
}
