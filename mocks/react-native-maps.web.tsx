/**
 * Web stub for react-native-maps.
 * react-native-maps is a native-only module and cannot run on web.
 * Metro resolves this file instead when bundling for the web platform.
 */
import React from 'react';
import { View } from 'react-native';

const Noop = (props: any) => <View {...props} />;

const MapView = (props: any) => <View style={[{ flex: 1, backgroundColor: '#e8f5e9' }, props.style]} />;
MapView.Animated = Noop;

export const Marker = Noop;
export const Callout = Noop;
export const Polyline = Noop;
export const Polygon = Noop;
export const Circle = Noop;
export const Overlay = Noop;
export const Heatmap = Noop;
export const AnimatedRegion = class {};
export const PROVIDER_GOOGLE = 'google';
export const PROVIDER_DEFAULT = null;

export default MapView;
