
import { NavigationContainer } from '@react-navigation/native';
import { RootNavigator } from './navigation/RootNavigator';
import { AuthProvider } from './store/AuthContext';
import { StatusBar } from 'react-native';

export default function App() {
  return (
    <AuthProvider>
      <NavigationContainer>
        <RootNavigator />
      </NavigationContainer>
      <StatusBar barStyle="auto" />
    </AuthProvider>
  );
}
