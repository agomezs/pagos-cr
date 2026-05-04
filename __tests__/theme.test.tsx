import React from 'react';
import { Text } from 'react-native';
import { render, act, screen } from '@testing-library/react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ThemeProvider, useTheme } from '../lib/theme';

// Mutable ref shared between mock factory and tests.
// Must be declared before jest.mock() but the factory closes over the reference, not the value.
const mockNativewind = {
  scheme: 'light' as 'light' | 'dark',
  setColorScheme: jest.fn(),
};

jest.mock('nativewind', () => ({
  useColorScheme: () => ({ colorScheme: mockNativewind.scheme, setColorScheme: mockNativewind.setColorScheme }),
}));

jest.mock('@react-native-async-storage/async-storage', () => ({
  __esModule: true,
  default: {
    multiGet: jest.fn(),
    multiSet: jest.fn(),
  },
}));

const mockMultiGet = AsyncStorage.multiGet as jest.Mock;
const mockMultiSet = AsyncStorage.multiSet as jest.Mock;

function TestConsumer() {
  const { colorScheme, toggleColorScheme } = useTheme();
  return (
    <Text testID="scheme" onPress={toggleColorScheme}>
      {colorScheme}
    </Text>
  );
}

beforeEach(() => {
  jest.clearAllMocks();
  mockNativewind.scheme = 'light';
  mockNativewind.setColorScheme.mockImplementation((s: 'light' | 'dark') => {
    mockNativewind.scheme = s;
  });
  mockMultiGet.mockResolvedValue([['colorScheme', null], ['colorSchemeOverride', null]]);
  mockMultiSet.mockResolvedValue(undefined);
});

describe('ThemeProvider', () => {
  it('defaults to light when system is light and no saved value', async () => {
    mockNativewind.scheme = 'light';
    render(<ThemeProvider><TestConsumer /></ThemeProvider>);
    await act(async () => {});
    expect(screen.getByTestId('scheme').props.children).toBe('light');
  });

  it('defaults to dark when system is dark and no saved value', async () => {
    mockNativewind.scheme = 'dark';
    render(<ThemeProvider><TestConsumer /></ThemeProvider>);
    await act(async () => {});
    expect(screen.getByTestId('scheme').props.children).toBe('dark');
  });

  it('overrides light system with persisted dark', async () => {
    mockNativewind.scheme = 'light';
    mockMultiGet.mockResolvedValue([['colorScheme', 'dark'], ['colorSchemeOverride', 'true']]);
    render(<ThemeProvider><TestConsumer /></ThemeProvider>);
    await act(async () => {});
    expect(mockNativewind.setColorScheme).toHaveBeenCalledWith('dark');
  });

  it('overrides dark system with persisted light', async () => {
    mockNativewind.scheme = 'dark';
    mockMultiGet.mockResolvedValue([['colorScheme', 'light'], ['colorSchemeOverride', 'true']]);
    render(<ThemeProvider><TestConsumer /></ThemeProvider>);
    await act(async () => {});
    expect(mockNativewind.setColorScheme).toHaveBeenCalledWith('light');
  });

  it('ignores invalid persisted values', async () => {
    mockNativewind.scheme = 'light';
    mockMultiGet.mockResolvedValue([['colorScheme', 'banana'], ['colorSchemeOverride', 'true']]);
    render(<ThemeProvider><TestConsumer /></ThemeProvider>);
    await act(async () => {});
    expect(mockNativewind.setColorScheme).not.toHaveBeenCalled();
    expect(screen.getByTestId('scheme').props.children).toBe('light');
  });

  it('toggleColorScheme switches light → dark and persists', async () => {
    mockNativewind.scheme = 'light';
    render(<ThemeProvider><TestConsumer /></ThemeProvider>);
    await act(async () => {});
    act(() => { screen.getByTestId('scheme').props.onPress(); });
    expect(mockNativewind.setColorScheme).toHaveBeenCalledWith('dark');
    expect(mockMultiSet).toHaveBeenCalledWith([
      ['colorScheme', 'dark'],
      ['colorSchemeOverride', 'true'],
    ]);
  });

  it('toggleColorScheme switches dark → light and persists', async () => {
    mockNativewind.scheme = 'dark';
    mockMultiGet.mockResolvedValue([['colorScheme', 'dark'], ['colorSchemeOverride', 'true']]);
    render(<ThemeProvider><TestConsumer /></ThemeProvider>);
    await act(async () => {});
    act(() => { screen.getByTestId('scheme').props.onPress(); });
    expect(mockNativewind.setColorScheme).toHaveBeenCalledWith('light');
    expect(mockMultiSet).toHaveBeenCalledWith([
      ['colorScheme', 'light'],
      ['colorSchemeOverride', 'true'],
    ]);
  });

  it('follows system changes when no override exists', async () => {
    mockNativewind.scheme = 'light';
    const { rerender } = render(<ThemeProvider><TestConsumer /></ThemeProvider>);
    await act(async () => {});
    expect(screen.getByTestId('scheme').props.children).toBe('light');

    mockNativewind.scheme = 'dark';
    rerender(<ThemeProvider><TestConsumer /></ThemeProvider>);

    expect(screen.getByTestId('scheme').props.children).toBe('dark');
  });
});
