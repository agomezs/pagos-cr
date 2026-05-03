// Gluestack UI v3 Actionsheet — do not edit manually.
// Import the named exports (Actionsheet, ActionsheetContent, etc.) into your own components.
import React from 'react';
import {
  Pressable,
  View,
  Text,
  ScrollView,
  VirtualizedList,
  FlatList,
  SectionList,
} from 'react-native';
import { createActionsheet } from '@gluestack-ui/actionsheet';
import { tva } from '@gluestack-ui/nativewind-utils/tva';
import { cssInterop } from 'nativewind';
import {
  Motion,
  AnimatePresence,
  createMotionAnimatedComponent,
} from '@legendapp/motion';

const AnimatedPressable = createMotionAnimatedComponent(Pressable);

const UIActionsheet = createActionsheet({
  Root: View,
  Content: Motion.View,
  Item: Pressable,
  ItemText: Text,
  DragIndicator: View,
  IndicatorWrapper: View,
  Backdrop: AnimatedPressable,
  ScrollView: ScrollView,
  VirtualizedList: VirtualizedList,
  FlatList: FlatList,
  SectionList: SectionList,
  SectionHeaderText: Text,
  Icon: View,
  AnimatePresence: AnimatePresence,
});

cssInterop(UIActionsheet, { className: 'style' });
cssInterop(UIActionsheet.Content, { className: 'style' });
cssInterop(UIActionsheet.Item, { className: 'style' });
cssInterop(UIActionsheet.ItemText, { className: 'style' });
cssInterop(UIActionsheet.DragIndicator, { className: 'style' });
cssInterop(UIActionsheet.DragIndicatorWrapper, { className: 'style' });
cssInterop(UIActionsheet.Backdrop, { className: 'style' });

const actionsheetStyle = tva({ base: 'w-full h-full' });

const actionsheetContentStyle = tva({
  base: 'items-center rounded-tl-3xl rounded-tr-3xl p-5 pt-2 bg-white dark:bg-gray-900 shadow-lg border border-b-0 border-gray-100 dark:border-gray-700',
});

const actionsheetItemStyle = tva({
  base: 'w-full flex-row items-center p-3 rounded-lg active:bg-gray-100 dark:active:bg-gray-800 gap-2',
});

const actionsheetItemTextStyle = tva({
  base: 'text-gray-700 dark:text-gray-300 text-sm font-normal',
});

const actionsheetDragIndicatorStyle = tva({
  base: 'w-10 h-1 bg-gray-300 dark:bg-gray-600 rounded-full',
});

const actionsheetDragIndicatorWrapperStyle = tva({
  base: 'w-full py-1 items-center',
});

const actionsheetBackdropStyle = tva({
  base: 'absolute left-0 top-0 right-0 bottom-0 bg-black/50',
});

const Actionsheet = React.forwardRef<
  React.ComponentRef<typeof UIActionsheet>,
  React.ComponentPropsWithoutRef<typeof UIActionsheet> & { className?: string }
>(function Actionsheet({ className, ...props }, ref) {
  return (
    <UIActionsheet
      className={actionsheetStyle({ class: className })}
      ref={ref}
      {...props}
    />
  );
});

const ActionsheetContent = React.forwardRef<
  React.ComponentRef<typeof UIActionsheet.Content>,
  React.ComponentPropsWithoutRef<typeof UIActionsheet.Content> & { className?: string }
>(function ActionsheetContent({ className, ...props }, ref) {
  return (
    <UIActionsheet.Content
      className={actionsheetContentStyle({ class: className })}
      ref={ref}
      {...props}
    />
  );
});

const ActionsheetItem = React.forwardRef<
  React.ComponentRef<typeof UIActionsheet.Item>,
  React.ComponentPropsWithoutRef<typeof UIActionsheet.Item> & { className?: string }
>(function ActionsheetItem({ className, ...props }, ref) {
  return (
    <UIActionsheet.Item
      className={actionsheetItemStyle({ class: className })}
      ref={ref}
      {...props}
    />
  );
});

const ActionsheetItemText = React.forwardRef<
  React.ComponentRef<typeof UIActionsheet.ItemText>,
  React.ComponentPropsWithoutRef<typeof UIActionsheet.ItemText> & { className?: string }
>(function ActionsheetItemText({ className, ...props }, ref) {
  return (
    <UIActionsheet.ItemText
      className={actionsheetItemTextStyle({ class: className })}
      ref={ref}
      {...props}
    />
  );
});

const ActionsheetDragIndicator = React.forwardRef<
  React.ComponentRef<typeof UIActionsheet.DragIndicator>,
  React.ComponentPropsWithoutRef<typeof UIActionsheet.DragIndicator> & { className?: string }
>(function ActionsheetDragIndicator({ className, ...props }, ref) {
  return (
    <UIActionsheet.DragIndicator
      className={actionsheetDragIndicatorStyle({ class: className })}
      ref={ref}
      {...props}
    />
  );
});

const ActionsheetDragIndicatorWrapper = React.forwardRef<
  React.ComponentRef<typeof UIActionsheet.DragIndicatorWrapper>,
  React.ComponentPropsWithoutRef<typeof UIActionsheet.DragIndicatorWrapper> & { className?: string }
>(function ActionsheetDragIndicatorWrapper({ className, ...props }, ref) {
  return (
    <UIActionsheet.DragIndicatorWrapper
      className={actionsheetDragIndicatorWrapperStyle({ class: className })}
      ref={ref}
      {...props}
    />
  );
});

const ActionsheetBackdrop = React.forwardRef<
  React.ComponentRef<typeof UIActionsheet.Backdrop>,
  React.ComponentPropsWithoutRef<typeof UIActionsheet.Backdrop> & { className?: string }
>(function ActionsheetBackdrop({ className, ...props }, ref) {
  return (
    <UIActionsheet.Backdrop
      className={actionsheetBackdropStyle({ class: className })}
      ref={ref}
      {...props}
    />
  );
});

export {
  Actionsheet,
  ActionsheetContent,
  ActionsheetItem,
  ActionsheetItemText,
  ActionsheetDragIndicator,
  ActionsheetDragIndicatorWrapper,
  ActionsheetBackdrop,
};
