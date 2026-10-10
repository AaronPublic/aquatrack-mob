import { Dimensions, PixelRatio, Platform } from 'react-native';
import { useState, useEffect } from 'react';

// Standard mobile baseline viewport (iPhone 11/12/13/14 baseline)
const GUIDELINE_BASE_WIDTH = 375;
const GUIDELINE_BASE_HEIGHT = 812;

let { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

/**
 * Standard Swirl Wave Divider Height across the entire AquaTrack app.
 * Configured to exactly 52px per user specification.
 */
export const HEADER_SWIRL_HEIGHT = 52;

/**
 * Linear horizontal scaling based on screen width.
 */
export const scale = (size) => {
  const currentWidth = Dimensions.get('window').width;
  return (currentWidth / GUIDELINE_BASE_WIDTH) * size;
};

/**
 * Linear vertical scaling based on screen height.
 */
export const verticalScale = (size) => {
  const currentHeight = Dimensions.get('window').height;
  return (currentHeight / GUIDELINE_BASE_HEIGHT) * size;
};

/**
 * Moderate horizontal scale with customizable damping factor.
 * Default factor = 0.5 prevents extreme scaling on tablets and large screens.
 */
export const moderateScale = (size, factor = 0.5) => {
  const currentWidth = Dimensions.get('window').width;
  return size + ((currentWidth / GUIDELINE_BASE_WIDTH) * size - size) * factor;
};

/**
 * Moderate vertical scale with customizable damping factor.
 */
export const moderateVerticalScale = (size, factor = 0.5) => {
  const currentHeight = Dimensions.get('window').height;
  return size + ((currentHeight / GUIDELINE_BASE_HEIGHT) * size - size) * factor;
};

/**
 * Convert width percentage string or number to dp.
 * e.g., wp(90) => 90% of screen width
 */
export const wp = (percentage) => {
  const currentWidth = Dimensions.get('window').width;
  const value = typeof percentage === 'string' ? parseFloat(percentage) : percentage;
  return PixelRatio.roundToNearestPixel((currentWidth * value) / 100);
};

/**
 * Convert height percentage string or number to dp.
 * e.g., hp(50) => 50% of screen height
 */
export const hp = (percentage) => {
  const currentHeight = Dimensions.get('window').height;
  const value = typeof percentage === 'string' ? parseFloat(percentage) : percentage;
  return PixelRatio.roundToNearestPixel((currentHeight * value) / 100);
};

/**
 * Responsive font scaler that respects accessibility settings without breaking layout.
 */
export const responsiveFontSize = (fontSize, maxScale = 1.25) => {
  const fontScale = PixelRatio.getFontScale();
  const clampedScale = Math.min(Math.max(fontScale, 0.85), maxScale);
  const scaledSize = moderateScale(fontSize, 0.35);
  return Math.round(scaledSize * (clampedScale > 1 ? (1 + (clampedScale - 1) * 0.5) : clampedScale));
};

/**
 * Helper to clamp a value between a min and max bounds.
 */
export const clamp = (val, min, max) => Math.min(Math.max(val, min), max);

/**
 * Breakpoint flags for dynamic conditional styling.
 */
export const getDeviceMetrics = () => {
  const { width, height } = Dimensions.get('window');
  return {
    width,
    height,
    isSmallDevice: width < 375, // iPhone SE, iPhone 8, 4.7" Androids
    isMediumDevice: width >= 375 && width < 414, // iPhone 13/14/15/16, Standard Android
    isLargeDevice: width >= 414 && width < 768, // iPhone Pro Max, Plus, Galaxy Ultra
    isTablet: width >= 768, // iPad, Android Tablets
    isLandscape: width > height,
  };
};

export const isSmallDevice = SCREEN_WIDTH < 375;
export const isMediumDevice = SCREEN_WIDTH >= 375 && SCREEN_WIDTH < 414;
export const isLargeDevice = SCREEN_WIDTH >= 414 && SCREEN_WIDTH < 768;
export const isTablet = SCREEN_WIDTH >= 768;

/**
 * React Hook for dynamic dimension awareness (e.g. rotation, split-screen, foldables).
 */
export const useResponsive = () => {
  const [metrics, setMetrics] = useState(getDeviceMetrics());

  useEffect(() => {
    const subscription = Dimensions.addEventListener('change', () => {
      setMetrics(getDeviceMetrics());
    });

    return () => {
      subscription?.remove?.();
    };
  }, []);

  return {
    ...metrics,
    scale,
    verticalScale,
    moderateScale,
    moderateVerticalScale,
    responsiveFontSize,
    wp,
    hp,
    swirlHeight: HEADER_SWIRL_HEIGHT,
  };
};

export default {
  scale,
  verticalScale,
  moderateScale,
  moderateVerticalScale,
  responsiveFontSize,
  wp,
  hp,
  clamp,
  getDeviceMetrics,
  isSmallDevice,
  isMediumDevice,
  isLargeDevice,
  isTablet,
  HEADER_SWIRL_HEIGHT,
  useResponsive,
};
