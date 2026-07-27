import { ReactNode, useEffect, useState } from "react";
import { LayoutChangeEvent, StyleSheet, ViewStyle } from "react-native";
import Animated, {
  Easing,
  FadeIn,
  FadeOut,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from "react-native-reanimated";
import Svg, { Defs, LinearGradient, Rect, Stop } from "react-native-svg";

const BASE_COLOR = "#2c2c2e";
const SHIMMER_COLOR = "#161616";

interface SkeletonProps {
  loading: boolean;
  children: ReactNode;
  style?: ViewStyle;
}

export function Skeleton({ loading, children, style }: SkeletonProps) {
  const [width, setWidth] = useState(0);
  const translateX = useSharedValue(0);

  useEffect(() => {
    if (!loading || width === 0) return;
    translateX.value = -width;
    translateX.value = withRepeat(withTiming(width, { duration: 1200, easing: Easing.linear }), -1);
  }, [loading, width, translateX]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  if (!loading)
    return (
      <Animated.View key="content" entering={FadeIn} exiting={FadeOut}>
        {children}
      </Animated.View>
    );

  const onLayout = (e: LayoutChangeEvent) => setWidth(e.nativeEvent.layout.width);

  return (
    <Animated.View
      key="skeleton"
      entering={FadeIn}
      exiting={FadeOut}
      style={[styles.base, style]}
      onLayout={onLayout}
    >
      {width > 0 && (
        <Animated.View style={[StyleSheet.absoluteFill, animatedStyle]}>
          <Svg width={width} height="100%">
            <Defs>
              <LinearGradient id="shimmer" x1="0" y1="0" x2="1" y2="0">
                <Stop offset="0" stopColor={SHIMMER_COLOR} stopOpacity={0} />
                <Stop offset="0.5" stopColor={SHIMMER_COLOR} stopOpacity={1} />
                <Stop offset="1" stopColor={SHIMMER_COLOR} stopOpacity={0} />
              </LinearGradient>
            </Defs>
            <Rect width={width} height="100%" fill="url(#shimmer)" />
          </Svg>
        </Animated.View>
      )}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  base: {
    backgroundColor: BASE_COLOR,
    overflow: "hidden",
  },
});
