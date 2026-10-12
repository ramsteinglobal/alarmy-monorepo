/**
 * @format
 * Replace your project's index.js with this file (it adds one line:
 * the background notification handler).
 */
import { AppRegistry } from 'react-native';
import App from './App';
import { name as appName } from './app.json';
import { registerBackgroundHandler } from './src/services/alarmEvents';

registerBackgroundHandler();

AppRegistry.registerComponent(appName, () => App);