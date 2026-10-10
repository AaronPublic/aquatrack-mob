import './global.css';
import React from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import { View, ActivityIndicator, Text, TextInput, StyleSheet } from 'react-native';
import { 
  useFonts, 
  PlusJakartaSans_400Regular, 
  PlusJakartaSans_600SemiBold, 
  PlusJakartaSans_700Bold, 
  PlusJakartaSans_800ExtraBold 
} from '@expo-google-fonts/plus-jakarta-sans';
import RootNavigator from './src/navigation/RootNavigator';
import { navigationRef } from './src/navigation/navigationRef';

// Fast font resolver to eliminate object allocation & StyleSheet.flatten overhead on high-frequency renders
function getAppliedStyle(style) {
  if (!style) {
    return { fontFamily: 'PlusJakartaSans_400Regular' };
  }

  const flatStyle = Array.isArray(style) ? StyleSheet.flatten(style) || {} : style;
  const { fontFamily, fontWeight } = flatStyle;

  if (fontFamily === 'GeistMono-Regular') {
    if (fontWeight === 'bold' || fontWeight === '700' || fontWeight === '800' || fontWeight === '900') {
      return { fontFamily: 'GeistMono-Bold' };
    }
    return null;
  }

  if (!fontFamily) {
    if (fontWeight === 'bold' || fontWeight === '700') {
      return { fontFamily: 'PlusJakartaSans_700Bold' };
    }
    if (fontWeight === '800' || fontWeight === '900') {
      return { fontFamily: 'PlusJakartaSans_800ExtraBold' };
    }
    if (fontWeight === '500' || fontWeight === '600') {
      return { fontFamily: 'PlusJakartaSans_600SemiBold' };
    }
    return { fontFamily: 'PlusJakartaSans_400Regular' };
  }

  return null;
}

// Hook into React Native's Text render method to apply Plus Jakarta Sans globally
const oldTextRender = Text.render;
Text.render = function (props, ref) {
  const origin = oldTextRender.call(this, props, ref);
  if (origin && origin.props) {
    const override = getAppliedStyle(origin.props.style);
    if (override) {
      return React.cloneElement(origin, {
        style: [origin.props.style, override]
      });
    }
  }
  return origin;
};

// Hook into TextInput as well to ensure consistent input text fonts
const oldTextInputRender = TextInput.render;
TextInput.render = function (props, ref) {
  const origin = oldTextInputRender.call(this, props, ref);
  if (origin && origin.props) {
    const override = getAppliedStyle(origin.props.style);
    if (override) {
      return React.cloneElement(origin, {
        style: [origin.props.style, override]
      });
    }
  }
  return origin;
};

export default function App() {
  const [fontsLoaded] = useFonts({
    PlusJakartaSans_400Regular,
    PlusJakartaSans_600SemiBold,
    PlusJakartaSans_700Bold,
    PlusJakartaSans_800ExtraBold,
    'GeistMono-Regular': require('./assets/fonts/GeistMono-Regular.ttf'),
    'GeistMono-Bold': require('./assets/fonts/GeistMono-Bold.ttf'),
  });

  if (!fontsLoaded) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F2F5FA' }}>
        <ActivityIndicator size="large" color="#0B2240" />
      </View>
    );
  }

  return (
    <SafeAreaProvider>
      <NavigationContainer ref={navigationRef}>
        <RootNavigator />
        <StatusBar style="auto" />
      </NavigationContainer>
    </SafeAreaProvider>
  );
}
