import { PageHeader } from "@/components/layout/page-header";
import { CreatePageForm } from "./create-page-form";

export default function NewPagePage() {
  return (
    <>
      <PageHeader title="Create Page" description="Add a new page to your website" />
      <CreatePageForm />
    </>
  );
}
