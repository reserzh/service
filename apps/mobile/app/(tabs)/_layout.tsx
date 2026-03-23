import { useEffect } from "react";
import { Tabs } from "expo-router";
import { Home, Wrench, Calendar, Menu } from "lucide-react-native";
import { Platform, View } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from "react-native-reanimated";
import { useSignalColors } from "@/hooks/useSignalColors";

function AnimatedTabIcon({
  Icon,
  color,
  size,
  focused,
}: {
  Icon: typeof Home;
  color: string;
  size: number;
  focused: boolean;
}) {
  const scale = useSharedValue(1);
  const colors = useSignalColors();

  useEffect(() => {
    scale.value = withSpring(focused ? 1.15 : 1, {
      damping: 12,
      stiffness: 200,
    });
  }, [focused, scale]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  // Signal design: active tab gets orange circle background
  if (focused) {
    return (
      <Animated.View style={animatedStyle}>
        <View
          style={{
            width: 44,
            height: 44,
            borderRadius: 22,
            backgroundColor: colors.accent,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Icon size={size - 2} color="#FFFFFF" />
        </View>
      </Animated.View>
    );
  }

  return (
    <Animated.View style={animatedStyle}>
      <Icon size={size} color={color} />
    </Animated.View>
  );
}

export default function TabsLayout() {
  const colors = useSignalColors();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.text,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarStyle: {
          backgroundColor: colors.card,
          borderTopColor: colors.border,
          height: Platform.OS === "ios" ? 96 : 72,
          paddingBottom: Platform.OS === "ios" ? 28 : 8,
          paddingTop: 8,
          shadowColor: "#000",
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 0.08,
          shadowRadius: 8,
          elevation: 8,
        },
        tabBarLabelStyle: {
          fontSize: 16,
          fontWeight: "700",
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Home",
          tabBarIcon: ({ color, size, focused }) => (
            <AnimatedTabIcon Icon={Home} color={color} size={size} focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="jobs"
        options={{
          title: "Jobs",
          tabBarIcon: ({ color, size, focused }) => (
            <AnimatedTabIcon Icon={Wrench} color={color} size={size} focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="schedule"
        options={{
          title: "Schedule",
          tabBarIcon: ({ color, size, focused }) => (
            <AnimatedTabIcon Icon={Calendar} color={color} size={size} focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="more"
        options={{
          title: "More",
          tabBarIcon: ({ color, size, focused }) => (
            <AnimatedTabIcon Icon={Menu} color={color} size={size} focused={focused} />
          ),
        }}
      />
    </Tabs>
  );
}
