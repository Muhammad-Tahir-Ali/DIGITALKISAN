import React, { useState } from 'react';
import { View, Image, ImageProps, StyleSheet, Animated } from 'react-native';
import { Colors } from '@/constants/colors';

interface LazyImageProps extends Omit<ImageProps, 'source' | 'style'> {
  uri?: string | null;
  style?: any;
  fallback?: React.ReactNode;
  /** Background color shown while the image is loading. */
  bgColor?: string;
}

/**
 * Image with a fade-in placeholder + error fallback.
 * Use instead of <Image source={{uri}} /> to avoid flashing the wrong image
 * when the source changes (common when navigating between similar screens).
 */
export function LazyImage({
  uri,
  style,
  fallback,
  bgColor = '#F1F5F9',
  ...rest
}: LazyImageProps) {
  const [opacity] = useState(new Animated.Value(0));
  const [errored, setErrored] = useState(false);
  // Reset opacity & error each time the uri changes so we re-show the skeleton.
  React.useEffect(() => {
    opacity.setValue(0);
    setErrored(false);
  }, [uri]);

  if (!uri || errored) {
    return (
      <View style={[styles.fill, { backgroundColor: bgColor }, style]}>
        {fallback}
      </View>
    );
  }

  return (
    <View style={[styles.fill, { backgroundColor: bgColor }, style]}>
      <Animated.Image
        source={{ uri }}
        style={[StyleSheet.absoluteFill, { opacity }]}
        onLoad={() => Animated.timing(opacity, {
          toValue: 1, duration: 180, useNativeDriver: true,
        }).start()}
        onError={() => setErrored(true)}
        resizeMode="cover"
        {...rest}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  fill: { overflow: 'hidden', alignItems: 'center', justifyContent: 'center' },
});

export default LazyImage;
