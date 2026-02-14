"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { createPageAction } from "@/actions/website";
import { toast } from "sonner";

export function CreatePageForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [isHomepage, setIsHomepage] = useState(false);
  const [showInNav, setShowInNav] = useState(true);

  const handleTitleChange = (value: string) => {
    setTitle(value);
    // Auto-generate slug from title
    setSlug(
      value
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, "")
        .replace(/\s+/g, "-")
        .replace(/-+/g, "-")
        .trim()
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const result = await createPageAction({
        title,
        slug,
        isHomepage,
        showInNav,
      });

      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success("Page created successfully");
        const page = result.data as { id: string };
        router.push(`/website/pages/${page.id}`);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="mt-6 max-w-2xl">
      <CardHeader>
        <CardTitle>Page Details</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="title">Page Title</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => handleTitleChange(e.target.value)}
              placeholder="e.g., About Us"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="slug">URL Slug</Label>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">/</span>
              <Input
                id="slug"
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                placeholder="about-us"
                required
              />
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Homepage</Label>
              <p className="text-sm text-muted-foreground">
                Set this as your site&apos;s homepage
              </p>
            </div>
            <Switch checked={isHomepage} onCheckedChange={setIsHomepage} />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Show in Navigation</Label>
              <p className="text-sm text-muted-foreground">
                Display this page in the site navigation menu
              </p>
            </div>
            <Switch checked={showInNav} onCheckedChange={setShowInNav} />
          </div>

          <div className="flex gap-3">
            <Button type="submit" disabled={loading}>
              {loading ? "Creating..." : "Create Page"}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
            >
              Cancel
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
