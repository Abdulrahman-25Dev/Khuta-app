import React, { forwardRef, type ReactNode } from 'react';
import {
  StyleSheet,
  Text,
  type TextProps,
  type TextStyle,
} from 'react-native';
import { useTranslation } from 'react-i18next';

type AppTextProps = TextProps & {
  children?: ReactNode;
  className?: string;
};

const AppText = forwardRef<React.ElementRef<typeof Text>, AppTextProps>(
  ({ children, className, style, ...props }, ref) => {
    const { i18n } = useTranslation();
    const flattenedStyle = StyleSheet.flatten(style) as TextStyle | undefined;
    const classes = className?.split(/\s+/) ?? [];
    const fontWeight = flattenedStyle?.fontWeight;
    const isBlack =
      fontWeight === '900' || fontWeight === 900 || classes.includes('font-black');
    const isBold =
      isBlack ||
      fontWeight === 'bold' ||
      (typeof fontWeight === 'number' && fontWeight >= 600) ||
      (typeof fontWeight === 'string' && Number(fontWeight) >= 600) ||
      classes.some((name) =>
        ['font-semibold', 'font-bold', 'font-extrabold'].includes(name)
      );
    const isArabic = (i18n.resolvedLanguage ?? i18n.language)
      .toLowerCase()
      .startsWith('ar');
    const fontFamily = isArabic
      ? isBlack
        ? 'Tajawal-Black'
        : isBold
          ? 'Tajawal-Bold'
          : 'Tajawal'
      : isBold
        ? 'Inter-Bold'
        : 'Inter';

    return (
      <Text
        {...props}
        ref={ref}
        className={className}
        style={[style, { fontFamily }]}
      >
        {children}
      </Text>
    );
  }
);

AppText.displayName = 'AppText';

export default AppText;
