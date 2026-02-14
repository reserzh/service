import { toast } from "sonner";

export const showToast = {
  success(title: string, description?: string) {
    toast.success(title, { description });
  },
  error(title: string, description?: string) {
    toast.error(title, { description, duration: 6000 });
  },
  deleted(entityName: string) {
    toast.success(`${entityName} deleted`, { description: "This action cannot be undone." });
  },
  saved(entityName: string) {
    toast.success(`${entityName} saved`, { description: "Your changes have been saved." });
  },
  created(entityName: string) {
    toast.success(`${entityName} created`, { description: "You'll be redirected shortly." });
  },
};
