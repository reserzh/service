"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { deleteEquipmentAction } from "@/actions/company-equipment";
import { Button } from "@/components/ui/button";
import { Loader2, Trash2 } from "lucide-react";
import { showToast } from "@/lib/toast";

export function DeleteEquipmentButton({ itemId }: { itemId: string }) {
  const [isDeleting, setIsDeleting] = useState(false);
  const router = useRouter();

  async function handleDelete() {
    if (!confirm("Are you sure you want to delete this equipment? This action cannot be undone.")) {
      return;
    }
    setIsDeleting(true);
    const result = await deleteEquipmentAction(itemId);
    if (result.success) {
      showToast.deleted("Equipment");
      router.push("/settings/equipment");
    } else if (result.error) {
      showToast.error("Error", result.error);
    }
    setIsDeleting(false);
  }

  return (
    <Button
      variant="destructive"
      size="sm"
      onClick={handleDelete}
      disabled={isDeleting}
    >
      {isDeleting ? (
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
      ) : (
        <Trash2 className="mr-2 h-4 w-4" />
      )}
      Delete
    </Button>
  );
}
