import Animated, { FadeInDown } from "react-native-reanimated";

interface AnimatedListItemProps {
  index: number;
  children: React.ReactNode;
}

export function AnimatedListItem({ index, children }: AnimatedListItemProps) {
  return (
    <Animated.View entering={FadeInDown.delay(index * 50).duration(400).springify()}>
      {children}
    </Animated.View>
  );
}
