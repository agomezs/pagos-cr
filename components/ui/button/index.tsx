import React from "react";
import { Pressable, Text, ActivityIndicator, View } from "react-native";
import { createButton } from "@gluestack-ui/button";
import { tva } from "@gluestack-ui/nativewind-utils/tva";
import {
  withStyleContext,
  useStyleContext,
} from "@gluestack-ui/nativewind-utils/withStyleContext";
import { cssInterop } from "nativewind";

const SCOPE = "BUTTON";

const buttonStyle = tva({
  base: "flex-row items-center justify-center rounded-md gap-2",
  variants: {
    action: {
      primary: "bg-primary-500",
      secondary: "bg-secondary-500",
      positive: "bg-success-500",
      negative: "bg-error-500",
    },
    variant: {
      solid: "",
      outline: "border border-current bg-transparent",
      link: "bg-transparent",
    },
    size: {
      xs: "px-3 py-1.5",
      sm: "px-4 py-2",
      md: "px-5 py-2.5",
      lg: "px-6 py-3",
      xl: "px-7 py-3.5",
    },
    isDisabled: {
      true: "opacity-40",
    },
  },
  defaultVariants: {
    action: "primary",
    variant: "solid",
    size: "md",
  },
});

const buttonTextStyle = tva({
  base: "text-white font-semibold",
  variants: {
    size: {
      xs: "text-xs",
      sm: "text-sm",
      md: "text-base",
      lg: "text-lg",
      xl: "text-xl",
    },
  },
  defaultVariants: {
    size: "md",
  },
});

const PressableStyled = withStyleContext(Pressable, SCOPE);

cssInterop(PressableStyled, { className: "style" });
cssInterop(Text, { className: "style" });
cssInterop(ActivityIndicator, { className: "style" });
cssInterop(View, { className: "style" });

const ButtonBase = createButton({
  Root: PressableStyled,
  Text,
  Group: View,
  Spinner: ActivityIndicator,
  Icon: View,
});

type ButtonProps = React.ComponentPropsWithoutRef<typeof Pressable> & {
  action?: "primary" | "secondary" | "positive" | "negative";
  variant?: "solid" | "outline" | "link";
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  isDisabled?: boolean;
  className?: string;
};

const Button = React.forwardRef<
  React.ElementRef<typeof Pressable>,
  ButtonProps
>(
  (
    {
      className,
      action = "primary",
      variant = "solid",
      size = "md",
      isDisabled = false,
      ...props
    },
    ref
  ) => {
    return (
      <ButtonBase
        ref={ref}
        disabled={isDisabled}
        className={buttonStyle({ action, variant, size, isDisabled, class: className })}
        context={{ action, variant, size, isDisabled }}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

const ButtonText = React.forwardRef<
  React.ElementRef<typeof Text>,
  React.ComponentPropsWithoutRef<typeof Text> & {
    size?: "xs" | "sm" | "md" | "lg" | "xl";
    className?: string;
  }
>(({ className, size = "md", ...props }, ref) => {
  const { size: ctxSize } = useStyleContext(SCOPE);
  return (
    <ButtonBase.Text
      ref={ref}
      className={buttonTextStyle({ size: size ?? ctxSize, class: className })}
      {...props}
    />
  );
});
ButtonText.displayName = "ButtonText";

export { Button, ButtonText };
