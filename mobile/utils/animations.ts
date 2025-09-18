import { Animated, Easing } from 'react-native';

export const AnimationConfig = {
  // Timing configurations
  fast: 200,
  medium: 400,
  slow: 600,

  // Easing curves
  easeOut: Easing.out(Easing.quad),
  easeIn: Easing.in(Easing.quad),
  easeInOut: Easing.inOut(Easing.quad),
  spring: Easing.elastic(1.2),
  bounce: Easing.bounce,
};

export const createFadeAnimation = (
  animatedValue: Animated.Value,
  toValue: number,
  duration: number = AnimationConfig.medium,
  easing: any = AnimationConfig.easeOut
) => {
  return Animated.timing(animatedValue, {
    toValue,
    duration,
    easing,
    useNativeDriver: true,
  });
};

export const createScaleAnimation = (
  animatedValue: Animated.Value,
  toValue: number,
  duration: number = AnimationConfig.medium,
  easing: any = AnimationConfig.easeOut
) => {
  return Animated.timing(animatedValue, {
    toValue,
    duration,
    easing,
    useNativeDriver: true,
  });
};

export const createSlideAnimation = (
  animatedValue: Animated.Value,
  toValue: number,
  duration: number = AnimationConfig.medium,
  easing: any = AnimationConfig.easeOut
) => {
  return Animated.timing(animatedValue, {
    toValue,
    duration,
    easing,
    useNativeDriver: true,
  });
};

export const createSpringAnimation = (
  animatedValue: Animated.Value,
  toValue: number,
  tension: number = 100,
  friction: number = 8
) => {
  return Animated.spring(animatedValue, {
    toValue,
    tension,
    friction,
    useNativeDriver: true,
  });
};

export const createPulseAnimation = (
  animatedValue: Animated.Value,
  minValue: number = 1,
  maxValue: number = 1.1,
  duration: number = 1000
) => {
  return Animated.loop(
    Animated.sequence([
      Animated.timing(animatedValue, {
        toValue: maxValue,
        duration: duration / 2,
        easing: AnimationConfig.easeInOut,
        useNativeDriver: true,
      }),
      Animated.timing(animatedValue, {
        toValue: minValue,
        duration: duration / 2,
        easing: AnimationConfig.easeInOut,
        useNativeDriver: true,
      }),
    ])
  );
};

export const createRotateAnimation = (
  animatedValue: Animated.Value,
  duration: number = 2000
) => {
  return Animated.loop(
    Animated.timing(animatedValue, {
      toValue: 1,
      duration,
      easing: Easing.linear,
      useNativeDriver: true,
    })
  );
};

export const createWaveAnimation = (
  animatedValue: Animated.Value,
  minValue: number = 0.3,
  maxValue: number = 1,
  duration: number = 600,
  delay: number = 0
) => {
  return Animated.loop(
    Animated.sequence([
      Animated.timing(animatedValue, {
        toValue: maxValue,
        duration,
        delay,
        easing: AnimationConfig.easeInOut,
        useNativeDriver: true,
      }),
      Animated.timing(animatedValue, {
        toValue: minValue,
        duration,
        easing: AnimationConfig.easeInOut,
        useNativeDriver: true,
      }),
    ])
  );
};

export const createStaggeredAnimation = (
  animations: Animated.CompositeAnimation[],
  stagger: number = 100
) => {
  return Animated.stagger(stagger, animations);
};

export const createSequenceAnimation = (
  animations: Animated.CompositeAnimation[]
) => {
  return Animated.sequence(animations);
};

export const createParallelAnimation = (
  animations: Animated.CompositeAnimation[]
) => {
  return Animated.parallel(animations);
};

// Common animation presets
export const fadeIn = (animatedValue: Animated.Value, duration?: number) =>
  createFadeAnimation(animatedValue, 1, duration);

export const fadeOut = (animatedValue: Animated.Value, duration?: number) =>
  createFadeAnimation(animatedValue, 0, duration);

export const scaleIn = (animatedValue: Animated.Value, duration?: number) =>
  createScaleAnimation(animatedValue, 1, duration);

export const scaleOut = (animatedValue: Animated.Value, duration?: number) =>
  createScaleAnimation(animatedValue, 0, duration);

export const slideInFromBottom = (
  animatedValue: Animated.Value,
  duration?: number
) => createSlideAnimation(animatedValue, 0, duration);

export const slideOutToBottom = (
  animatedValue: Animated.Value,
  slideDistance: number,
  duration?: number
) => createSlideAnimation(animatedValue, slideDistance, duration);

export const springIn = (animatedValue: Animated.Value) =>
  createSpringAnimation(animatedValue, 1);

export const springOut = (animatedValue: Animated.Value) =>
  createSpringAnimation(animatedValue, 0);

// Screen transition animations
export const screenTransitions = {
  slideFromRight: {
    cardStyleInterpolator: ({ current, layouts }: any) => {
      return {
        cardStyle: {
          transform: [
            {
              translateX: current.progress.interpolate({
                inputRange: [0, 1],
                outputRange: [layouts.screen.width, 0],
              }),
            },
          ],
        },
      };
    },
    transitionSpec: {
      open: {
        animation: 'timing',
        config: {
          duration: AnimationConfig.medium,
          easing: AnimationConfig.easeOut,
        },
      },
      close: {
        animation: 'timing',
        config: {
          duration: AnimationConfig.medium,
          easing: AnimationConfig.easeIn,
        },
      },
    },
  },

  slideFromBottom: {
    cardStyleInterpolator: ({ current, layouts }: any) => {
      return {
        cardStyle: {
          transform: [
            {
              translateY: current.progress.interpolate({
                inputRange: [0, 1],
                outputRange: [layouts.screen.height, 0],
              }),
            },
          ],
        },
      };
    },
    transitionSpec: {
      open: {
        animation: 'timing',
        config: {
          duration: AnimationConfig.medium,
          easing: AnimationConfig.easeOut,
        },
      },
      close: {
        animation: 'timing',
        config: {
          duration: AnimationConfig.medium,
          easing: AnimationConfig.easeIn,
        },
      },
    },
  },

  fade: {
    cardStyleInterpolator: ({ current }: any) => {
      return {
        cardStyle: {
          opacity: current.progress,
        },
      };
    },
    transitionSpec: {
      open: {
        animation: 'timing',
        config: {
          duration: AnimationConfig.medium,
          easing: AnimationConfig.easeOut,
        },
      },
      close: {
        animation: 'timing',
        config: {
          duration: AnimationConfig.fast,
          easing: AnimationConfig.easeIn,
        },
      },
    },
  },

  scale: {
    cardStyleInterpolator: ({ current }: any) => {
      return {
        cardStyle: {
          opacity: current.progress,
          transform: [
            {
              scale: current.progress.interpolate({
                inputRange: [0, 1],
                outputRange: [0.9, 1],
              }),
            },
          ],
        },
      };
    },
    transitionSpec: {
      open: {
        animation: 'timing',
        config: {
          duration: AnimationConfig.medium,
          easing: AnimationConfig.easeOut,
        },
      },
      close: {
        animation: 'timing',
        config: {
          duration: AnimationConfig.fast,
          easing: AnimationConfig.easeIn,
        },
      },
    },
  },
};