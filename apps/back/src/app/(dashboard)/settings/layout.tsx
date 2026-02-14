import { SettingsNav } from "./settings-nav";

export default function SettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-6 lg:flex-row">
      <aside className="shrink-0 lg:w-56">
        <SettingsNav />
      </aside>
      <main className="flex-1 min-w-0">{children}</main>
    </div>
  );
}
