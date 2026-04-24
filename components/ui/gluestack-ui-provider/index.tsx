import { OverlayProvider } from "@gluestack-ui/overlay";
import { ToastProvider } from "@gluestack-ui/toast";

export function GluestackUIProvider({ children }: { children: React.ReactNode }) {
  return (
    <OverlayProvider>
      <ToastProvider>{children}</ToastProvider>
    </OverlayProvider>
  );
}
