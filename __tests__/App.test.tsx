/**
 * @format
 */

import React from 'react';
import ReactTestRenderer from 'react-test-renderer';

jest.mock('../src/config/firebaseSetup', () => ({
  getAuthErrorMessage: jest.fn(),
  signIn: jest.fn(),
  signInWithGoogle: jest.fn(),
}));

jest.mock('../src/navigation/AppNavigator', () => () => null);

jest.mock('@react-navigation/native', () => ({
  NavigationContainer: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

import App from '../App';

test('renders correctly', async () => {
  await ReactTestRenderer.act(() => {
    ReactTestRenderer.create(<App />);
  });
});
