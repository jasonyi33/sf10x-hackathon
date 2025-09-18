import React, { useEffect, useRef } from 'react';
import { Animated, ViewStyle } from 'react-native';
import {
  fadeIn,
  fadeOut,
  scaleIn,
  scaleOut,
  slideInFromBottom,
  slideOutToBottom,
  springIn,
  springOut,
  AnimationConfig,
} from '../../utils/animations';

type AnimationType = 'fade' | 'scale' | 'slide' | 'spring';
type AnimationDirection = 'in' | 'out';

interface AnimatedViewProps {
  children: React.ReactNode;
  animationType?: AnimationType;
  direction?: AnimationDirection;
  duration?: number;
  delay?: number;
  style?: ViewStyle;
  shouldAnimate?: boolean;
  onAnimationComplete?: () => void;
}

export const AnimatedView: React.FC<AnimatedViewProps> = ({
  children,
  animationType = 'fade',
  direction = 'in',
  duration = AnimationConfig.medium,
  delay = 0,
  style,
  shouldAnimate = true,
  onAnimationComplete,
}) => {
  const animatedValue = useRef(new Animated.Value(direction === 'in' ? 0 : 1)).current;
  const slideValue = useRef(new Animated.Value(direction === 'in' ? 100 : 0)).current;

  useEffect(() => {
    if (!shouldAnimate) {
      animatedValue.setValue(direction === 'in' ? 1 : 0);
      slideValue.setValue(direction === 'in' ? 0 : 100);
      return;
    }

    let animation: Animated.CompositeAnimation;

    switch (animationType) {
      case 'fade':
        animation = direction === 'in' ? fadeIn(animatedValue, duration) : fadeOut(animatedValue, duration);
        break;
      case 'scale':
        animation = direction === 'in' ? scaleIn(animatedValue, duration) : scaleOut(animatedValue, duration);
        break;
      case 'slide':
        animation = direction === 'in'
          ? slideInFromBottom(slideValue, duration)
          : slideOutToBottom(slideValue, 100, duration);
        break;
      case 'spring':
        animation = direction === 'in' ? springIn(animatedValue) : springOut(animatedValue);
        break;
      default:
        animation = direction === 'in' ? fadeIn(animatedValue, duration) : fadeOut(animatedValue, duration);
    }

    const timer = setTimeout(() => {
      animation.start(() => {
        onAnimationComplete?.();
      });
    }, delay);

    return () => {
      clearTimeout(timer);
      animation.stop();
    };
  }, [shouldAnimate, animationType, direction, duration, delay]);

  const getAnimatedStyle = (): ViewStyle => {
    const baseStyle: ViewStyle = {};

    switch (animationType) {
      case 'fade':
        return {
          ...baseStyle,
          opacity: animatedValue,
        };
      case 'scale':
        return {
          ...baseStyle,
          opacity: animatedValue,
          transform: [{ scale: animatedValue }],
        };
      case 'slide':
        return {
          ...baseStyle,
          transform: [{ translateY: slideValue }],
        };
      case 'spring':
        return {
          ...baseStyle,
          opacity: animatedValue,
          transform: [{ scale: animatedValue }],
        };
      default:
        return {
          ...baseStyle,
          opacity: animatedValue,
        };
    }
  };

  return (
    <Animated.View style={[getAnimatedStyle(), style]}>
      {children}
    </Animated.View>
  );
};

interface FadeInViewProps {
  children: React.ReactNode;
  duration?: number;
  delay?: number;
  style?: ViewStyle;
  shouldAnimate?: boolean;
  onAnimationComplete?: () => void;
}

export const FadeInView: React.FC<FadeInViewProps> = (props) => (
  <AnimatedView animationType="fade" direction="in" {...props} />
);

export const FadeOutView: React.FC<FadeInViewProps> = (props) => (
  <AnimatedView animationType="fade" direction="out" {...props} />
);

export const ScaleInView: React.FC<FadeInViewProps> = (props) => (
  <AnimatedView animationType="scale" direction="in" {...props} />
);

export const ScaleOutView: React.FC<FadeInViewProps> = (props) => (
  <AnimatedView animationType="scale" direction="out" {...props} />
);

export const SlideInView: React.FC<FadeInViewProps> = (props) => (
  <AnimatedView animationType="slide" direction="in" {...props} />
);

export const SlideOutView: React.FC<FadeInViewProps> = (props) => (
  <AnimatedView animationType="slide" direction="out" {...props} />
);

export const SpringInView: React.FC<FadeInViewProps> = (props) => (
  <AnimatedView animationType="spring" direction="in" {...props} />
);