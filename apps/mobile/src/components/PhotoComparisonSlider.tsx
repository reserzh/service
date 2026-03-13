import { useState, useCallback } from "react";
import { View, Image, Text, useWindowDimensions } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  runOnJS,
} from "react-native-reanimated";

interface Props {
  beforeUri: string;
  afterUri: string;
  height?: number;
}

export function PhotoComparisonSlider({ beforeUri, afterUri, height = 300 }: Props) {
  const { width: screenWidth } = useWindowDimensions();
  const containerWidth = screenWidth - 32; // Account for padding
  const sliderX = useSharedValue(containerWidth / 2);
  const [sliderPos, setSliderPos] = useState(containerWidth / 2);

  const updatePos = useCallback((x: number) => {
    setSliderPos(x);
  }, []);

  const pan = Gesture.Pan()
    .onUpdate((e) => {
      const clamped = Math.max(0, Math.min(e.x, containerWidth));
      sliderX.value = clamped;
      runOnJS(updatePos)(clamped);
    })
    .hitSlop({ horizontal: 20 });

  const tap = Gesture.Tap().onEnd((e) => {
    const clamped = Math.max(0, Math.min(e.x, containerWidth));
    sliderX.value = clamped;
    runOnJS(updatePos)(clamped);
  });

  const gesture = Gesture.Race(pan, tap);

  const sliderLineStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: sliderX.value }],
  }));

  const beforeClipStyle = useAnimatedStyle(() => ({
    width: sliderX.value,
  }));

  return (
    <View className="rounded-xl overflow-hidden bg-black" style={{ height }}>
      <GestureDetector gesture={gesture}>
        <View style={{ width: containerWidth, height, position: "relative" }}>
          {/* After image (full width, behind) */}
          <Image
            source={{ uri: afterUri }}
            style={{ width: containerWidth, height, position: "absolute" }}
            resizeMode="cover"
          />

          {/* Before image (clipped) */}
          <Animated.View style={[{ height, overflow: "hidden", position: "absolute" }, beforeClipStyle]}>
            <Image
              source={{ uri: beforeUri }}
              style={{ width: containerWidth, height }}
              resizeMode="cover"
            />
          </Animated.View>

          {/* Slider line */}
          <Animated.View
            style={[
              {
                position: "absolute",
                top: 0,
                bottom: 0,
                width: 3,
                backgroundColor: "white",
                marginLeft: -1.5,
              },
              sliderLineStyle,
            ]}
          >
            {/* Handle */}
            <View
              style={{
                position: "absolute",
                top: "50%",
                marginTop: -16,
                marginLeft: -14,
                width: 32,
                height: 32,
                borderRadius: 16,
                backgroundColor: "white",
                alignItems: "center",
                justifyContent: "center",
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.3,
                shadowRadius: 4,
                elevation: 5,
              }}
            >
              <Text style={{ fontSize: 12, color: "#64748b" }}>{"◀▶"}</Text>
            </View>
          </Animated.View>

          {/* Labels */}
          <View className="absolute top-2 left-2 bg-black/60 px-2 py-0.5 rounded">
            <Text className="text-white text-xs font-medium">Before</Text>
          </View>
          <View className="absolute top-2 right-2 bg-black/60 px-2 py-0.5 rounded">
            <Text className="text-white text-xs font-medium">After</Text>
          </View>
        </View>
      </GestureDetector>
    </View>
  );
}
