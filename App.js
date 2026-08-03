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

// Hook into React Native's Text render method to apply Plus Jakarta Sans globally
const oldTextRender = Text.render;
Text.render = function (props, ref) {
  const origin = oldTextRender.call(this, props, ref);
  if (origin && origin.props) {
    const style = origin.props.style;
    const flatStyle = StyleSheet.flatten(style) || {};
    
    // Intercept GeistMono font family weight mapping
    if (flatStyle.fontFamily === 'GeistMono-Regular') {
      if (flatStyle.fontWeight === 'bold' || flatStyle.fontWeight === '700' || flatStyle.fontWeight === '800' || flatStyle.fontWeight === '900') {
        return React.cloneElement(origin, {
          style: [style, { fontFamily: 'GeistMono-Bold' }]
        });
      }
      return origin;
    }

    if (!flatStyle.fontFamily) {
      let family = 'PlusJakartaSans_400Regular';
      if (flatStyle.fontWeight === 'bold' || flatStyle.fontWeight === '700') {
        family = 'PlusJakartaSans_700Bold';
      } else if (flatStyle.fontWeight === '800' || flatStyle.fontWeight === '900') {
        family = 'PlusJakartaSans_800ExtraBold';
      } else if (flatStyle.fontWeight === '500' || flatStyle.fontWeight === '600') {
        family = 'PlusJakartaSans_600SemiBold';
      }
      return React.cloneElement(origin, {
        style: [style, { fontFamily: family }]
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
    const style = origin.props.style;
    const flatStyle = StyleSheet.flatten(style) || {};

    // Intercept GeistMono font family weight mapping
    if (flatStyle.fontFamily === 'GeistMono-Regular') {
      if (flatStyle.fontWeight === 'bold' || flatStyle.fontWeight === '700' || flatStyle.fontWeight === '800' || flatStyle.fontWeight === '900') {
        return React.cloneElement(origin, {
          style: [style, { fontFamily: 'GeistMono-Bold' }]
        });
      }
      return origin;
    }

    if (!flatStyle.fontFamily) {
      let family = 'PlusJakartaSans_400Regular';
      if (flatStyle.fontWeight === 'bold' || flatStyle.fontWeight === '700') {
        family = 'PlusJakartaSans_700Bold';
      } else if (flatStyle.fontWeight === '800' || flatStyle.fontWeight === '900') {
        family = 'PlusJakartaSans_800ExtraBold';
      } else if (flatStyle.fontWeight === '500' || flatStyle.fontWeight === '600') {
        family = 'PlusJakartaSans_600SemiBold';
      }
      return React.cloneElement(origin, {
        style: [style, { fontFamily: family }]
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
