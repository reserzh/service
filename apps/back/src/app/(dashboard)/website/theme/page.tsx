import { requireAuth } from "@/lib/auth";
import { getSiteSettings } from "@/lib/services/website";
import { PageHeader } from "@/components/layout/page-header";
import { ThemeEditorForm } from "./theme-editor-form";

export default async function ThemeEditorPage() {
  const ctx = await requireAuth();
  const settings = await getSiteSettings(ctx);

  return (
    <>
      <PageHeader
        title="Theme & Branding"
        description="Customize the look and feel of your website"
      />
      <ThemeEditorForm settings={settings} />
    </>
  );
}
