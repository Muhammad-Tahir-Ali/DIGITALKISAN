import React, { useState } from 'react';
import { View, Image, ImageProps, StyleSheet, Animated, Platform } from 'react-native';

interface LazyImageProps extends Omit<ImageProps, 'source' | 'style'> {
  uri?: string | null;
  style?: any;
  fallback?: React.ReactNode;
  /** Background color shown while the image is loading. */
  bgColor?: string;
}

export function LazyImage({
  uri,
  style,
  fallback,
  bgColor = '#F1F5F9',
  ...rest
}: LazyImageProps) {
  const [opacity] = useState(() => new Animated.Value(0));
  const [errored, setErrored] = useState(false);

  // Reset opacity & error each time the uri changes so we re-show the skeleton.
  React.useEffect(() => {
    opacity.setValue(0);
    setErrored(false);
    // Fallback: reveal image after 2s even if onLoad never fires (RN edge case)
    const t = setTimeout(() => opacity.setValue(1), 2000);
    return () => clearTimeout(t);
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
      {/*
       * Wrap Image in Animated.View instead of using Animated.Image.
       * In RN 0.81+ (Fabric/new arch), Animated.createAnimatedComponent(Image)
       * does not reliably forward onLoad / onError, so the image stays at
       * opacity 0 forever. Regular Image inside Animated.View fires both
       * callbacks correctly on all architectures.
       */}
      <Animated.View style={[StyleSheet.absoluteFill, { opacity }]}>
        <Image
          source={{ uri }}
          style={StyleSheet.absoluteFill}
          onLoad={() =>
            Animated.timing(opacity, {
              toValue: 1,
              duration: 200,
              useNativeDriver: Platform.OS !== 'web',
            }).start()
          }
          onError={() => setErrored(true)}
          resizeMode="cover"
          {...rest}
        />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  fill: { overflow: 'hidden', alignItems: 'center', justifyContent: 'center' },
});

export default LazyImage;
