import Link from "next/link";
import { type LucideIcon } from "lucide-react";

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: { label: string; href: string };
}

export function EmptyState({ icon: Icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="rounded-lg bg-gray-50 py-12 text-center">
      <Icon className="mx-auto h-12 w-12 text-gray-400" strokeWidth={1.5} />
      <h3 className="mt-4 text-sm font-semibold text-gray-900">{title}</h3>
      <p className="mt-1 text-sm text-gray-500">{description}</p>
      {action && (
        <div className="mt-6">
          <Link
            href={action.href}
            className="inline-flex items-center rounded-md portal-btn-primary px-3 py-2 text-sm font-semibold shadow-sm"
          >
            {action.label}
          </Link>
        </div>
      )}
    </div>
  );
}
