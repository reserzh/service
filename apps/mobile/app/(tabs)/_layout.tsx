import { useEffect } from "react";
import { Tabs } from "expo-router";
import { Home, Wrench, Calendar, Menu } from "lucide-react-native";
import { Platform, View, useColorScheme } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from "react-native-reanimated";

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
  const isDark = useColorScheme() === "dark";

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
            backgroundColor: isDark ? "#FB923C" : "#EA580C",
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
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: isDark ? "#FAFAF9" : "#1C1917",
        tabBarInactiveTintColor: isDark ? "#78716C" : "#A8A29E",
        tabBarStyle: {
          backgroundColor: isDark ? "#292524" : "#FFFFFF",
          borderTopColor: isDark ? "#44403C" : "#F5F0EB",
          height: Platform.OS === "ios" ? 96 : 72,
          paddingBottom: Platform.OS === "ios" ? 28 : 8,
          paddingTop: 8,
          shadowColor: "#000",
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: isDark ? 0.3 : 0.06,
          shadowRadius: 8,
          elevation: 8,
        },
        tabBarLabelStyle: {
          fontSize: 13,
          fontWeight: "800",
          letterSpacing: 0.3,
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
