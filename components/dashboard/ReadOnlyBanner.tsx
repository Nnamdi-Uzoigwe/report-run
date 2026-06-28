import { Lock } from "lucide-react";

interface ReadOnlyBannerProps {
  message?: string;
}

export function ReadOnlyBanner({
  message = "Your role has view-only access to this section.",
}: ReadOnlyBannerProps) {
  return (
    <div className="flex items-center gap-3 px-4 py-3 bg-warning-light border border-warning rounded-lg mb-6">
      <Lock size={15} className="text-warning shrink-0" />
      <p className="text-sm text-warning font-medium">{message}</p>
    </div>
  );
}