"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  updatePageAction,
  publishPageAction,
  deletePageAction,
  createSectionAction,
  updateSectionAction,
  deleteSectionAction,
  reorderSectionsAction,
} from "@/actions/website";
import { toast } from "sonner";
import {
  Plus,
  Trash2,
  GripVertical,
  Eye,
  EyeOff,
  ArrowUp,
  ArrowDown,
  Save,
} from "lucide-react";
import { Textarea } from "@/components/ui/textarea";

type Section = {
  id: string;
  type: string;
  content: Record<string, unknown> | null;
  settings: Record<string, unknown> | null;
  sortOrder: number;
  isVisible: boolean;
};

type Page = {
  id: string;
  title: string;
  slug: string;
  status: string;
  isHomepage: boolean;
  showInNav: boolean;
  navLabel: string | null;
  seo: Record<string, unknown> | null;
};

const SECTION_TYPES = [
  { value: "hero", label: "Hero Banner", description: "Large hero section with heading and CTA" },
  { value: "services", label: "Services Grid", description: "Display your service catalog" },
  { value: "about", label: "About", description: "About your business" },
  { value: "testimonials", label: "Testimonials", description: "Customer reviews and testimonials" },
  { value: "gallery", label: "Gallery", description: "Image gallery" },
  { value: "contact_form", label: "Contact Form", description: "Contact form with map" },
  { value: "booking_widget", label: "Booking Widget", description: "Online booking form" },
  { value: "cta_banner", label: "CTA Banner", description: "Call-to-action banner" },
  { value: "faq", label: "FAQ", description: "Frequently asked questions" },
  { value: "team", label: "Team", description: "Team members" },
  { value: "map", label: "Map", description: "Location map" },
  { value: "features", label: "Features", description: "Feature highlights" },
  { value: "pricing", label: "Pricing", description: "Pricing plans" },
  { value: "custom_html", label: "Custom HTML", description: "Raw HTML content" },
];

export function PageEditorContent({
  page,
  initialSections,
}: {
  page: Page;
  initialSections: Section[];
}) {
  const router = useRouter();
  const [sections, setSections] = useState(initialSections);
  const [saving, setSaving] = useState(false);
  const [addSectionOpen, setAddSectionOpen] = useState(false);
  const [editingSectionId, setEditingSectionId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState("");
  const [pageTitle, setPageTitle] = useState(page.title);
  const [pageSlug, setPageSlug] = useState(page.slug);

  const handlePublish = async () => {
    const result = await publishPageAction(page.id);
    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success("Page published");
      router.refresh();
    }
  };

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this page?")) return;
    const result = await deletePageAction(page.id);
    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success("Page deleted");
      router.push("/website/pages");
    }
  };

  const handleSavePage = async () => {
    setSaving(true);
    const result = await updatePageAction({
      id: page.id,
      title: pageTitle,
      slug: pageSlug,
    });
    setSaving(false);
    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success("Page saved");
      router.refresh();
    }
  };

  const handleAddSection = async (type: string) => {
    const result = await createSectionAction({
      pageId: page.id,
      type,
      content: getDefaultContent(type),
    });
    if (result.error) {
      toast.error(result.error);
    } else {
      setSections([...sections, result.data as Section]);
      toast.success("Section added");
    }
    setAddSectionOpen(false);
  };

  const handleDeleteSection = async (sectionId: string) => {
    if (!confirm("Delete this section?")) return;
    const result = await deleteSectionAction(sectionId, page.id);
    if (result.error) {
      toast.error(result.error);
    } else {
      setSections(sections.filter((s) => s.id !== sectionId));
      toast.success("Section deleted");
    }
  };

  const handleToggleVisibility = async (section: Section) => {
    const result = await updateSectionAction({
      sectionId: section.id,
      pageId: page.id,
      isVisible: !section.isVisible,
    });
    if (result.error) {
      toast.error(result.error);
    } else {
      setSections(
        sections.map((s) =>
          s.id === section.id ? { ...s, isVisible: !s.isVisible } : s
        )
      );
    }
  };

  const handleMoveSection = async (index: number, direction: "up" | "down") => {
    const newSections = [...sections];
    const swapIndex = direction === "up" ? index - 1 : index + 1;
    if (swapIndex < 0 || swapIndex >= newSections.length) return;

    [newSections[index], newSections[swapIndex]] = [newSections[swapIndex], newSections[index]];
    setSections(newSections);

    await reorderSectionsAction(
      page.id,
      newSections.map((s) => s.id)
    );
  };

  const handleSaveContent = async (sectionId: string) => {
    try {
      const content = JSON.parse(editContent);
      const result = await updateSectionAction({
        sectionId,
        pageId: page.id,
        content,
      });
      if (result.error) {
        toast.error(result.error);
      } else {
        setSections(
          sections.map((s) =>
            s.id === sectionId ? { ...s, content } : s
          )
        );
        setEditingSectionId(null);
        toast.success("Section updated");
      }
    } catch {
      toast.error("Invalid JSON content");
    }
  };

  return (
    <div className="mt-6 space-y-6">
      {/* Page Settings Bar */}
      <Card>
        <CardContent className="flex items-center gap-4 py-4">
          <div className="flex-1 flex gap-4">
            <div className="flex-1">
              <Label htmlFor="page-title" className="sr-only">Title</Label>
              <Input
                id="page-title"
                value={pageTitle}
                onChange={(e) => setPageTitle(e.target.value)}
                className="font-semibold"
              />
            </div>
            <div className="w-48">
              <Label htmlFor="page-slug" className="sr-only">Slug</Label>
              <div className="flex items-center">
                <span className="text-sm text-muted-foreground mr-1">/</span>
                <Input
                  id="page-slug"
                  value={pageSlug}
                  onChange={(e) => setPageSlug(e.target.value)}
                />
              </div>
            </div>
          </div>
          <Badge variant={page.status === "published" ? "default" : "outline"}>
            {page.status}
          </Badge>
          <Button variant="outline" size="sm" onClick={handleSavePage} disabled={saving}>
            <Save className="mr-2 h-4 w-4" />
            {saving ? "Saving..." : "Save"}
          </Button>
          {page.status !== "published" && (
            <Button size="sm" onClick={handlePublish}>Publish</Button>
          )}
          <Button variant="destructive" size="sm" onClick={handleDelete}>
            <Trash2 className="h-4 w-4" />
          </Button>
        </CardContent>
      </Card>

      {/* Sections */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Sections</h3>
          <Dialog open={addSectionOpen} onOpenChange={setAddSectionOpen}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="mr-2 h-4 w-4" />
                Add Section
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Add Section</DialogTitle>
              </DialogHeader>
              <div className="grid gap-2 mt-4">
                {SECTION_TYPES.map((type) => (
                  <button
                    key={type.value}
                    onClick={() => handleAddSection(type.value)}
                    className="flex flex-col items-start gap-1 rounded-lg border p-3 text-left hover:bg-accent transition-colors"
                  >
                    <span className="font-medium text-sm">{type.label}</span>
                    <span className="text-xs text-muted-foreground">{type.description}</span>
                  </button>
                ))}
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {sections.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              No sections yet. Click &quot;Add Section&quot; to start building your page.
            </CardContent>
          </Card>
        ) : (
          sections.map((section, index) => (
            <Card key={section.id} className={!section.isVisible ? "opacity-50" : ""}>
              <CardContent className="flex items-center gap-3 py-3">
                <GripVertical className="h-4 w-4 text-muted-foreground cursor-grab" />
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="capitalize">
                      {section.type.replace(/_/g, " ")}
                    </Badge>
                    {!section.isVisible && (
                      <Badge variant="secondary">Hidden</Badge>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => handleMoveSection(index, "up")}
                    disabled={index === 0}
                  >
                    <ArrowUp className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => handleMoveSection(index, "down")}
                    disabled={index === sections.length - 1}
                  >
                    <ArrowDown className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => {
                      setEditingSectionId(editingSectionId === section.id ? null : section.id);
                      setEditContent(JSON.stringify(section.content ?? {}, null, 2));
                    }}
                  >
                    <Save className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => handleToggleVisibility(section)}
                  >
                    {section.isVisible ? (
                      <Eye className="h-4 w-4" />
                    ) : (
                      <EyeOff className="h-4 w-4" />
                    )}
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-destructive"
                    onClick={() => handleDeleteSection(section.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
              {editingSectionId === section.id && (
                <div className="border-t px-4 pb-4 pt-3">
                  <Label htmlFor={`content-${section.id}`}>Content (JSON)</Label>
                  <Textarea
                    id={`content-${section.id}`}
                    value={editContent}
                    onChange={(e) => setEditContent(e.target.value)}
                    className="mt-2 font-mono text-sm"
                    rows={10}
                  />
                  <div className="mt-3 flex gap-2">
                    <Button size="sm" onClick={() => handleSaveContent(section.id)}>
                      Save Content
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setEditingSectionId(null)}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              )}
            </Card>
          ))
        )}
      </div>
    </div>
  );
}

function getDefaultContent(type: string): Record<string, unknown> {
  switch (type) {
    case "hero":
      return { heading: "Welcome to Our Business", subheading: "Professional services you can trust", ctaText: "Get a Quote", ctaLink: "/book", alignment: "center" };
    case "services":
      return { heading: "Our Services", description: "What we offer", showPricing: true, layout: "grid" };
    case "about":
      return { heading: "About Us", content: "Tell your story here...", layout: "left" };
    case "testimonials":
      return { heading: "What Our Customers Say", items: [{ name: "John D.", text: "Great service!", rating: 5 }] };
    case "faq":
      return { heading: "Frequently Asked Questions", items: [{ question: "What areas do you serve?", answer: "We serve the greater metro area." }] };
    case "contact_form":
      return { heading: "Contact Us", showMap: true, showPhone: true, showEmail: true };
    case "booking_widget":
      return { heading: "Book a Service", description: "Schedule your appointment online", showServicePicker: true, showDatePicker: true };
    case "cta_banner":
      return { heading: "Ready to Get Started?", subheading: "Contact us today for a free estimate", ctaText: "Call Now", ctaLink: "tel:" };
    case "team":
      return { heading: "Our Team", members: [] };
    case "gallery":
      return { heading: "Our Work", images: [], columns: 3 };
    case "map":
      return { heading: "Find Us", showDirectionsLink: true };
    case "features":
      return { heading: "Why Choose Us", items: [{ title: "Licensed & Insured", description: "Fully certified professionals" }], columns: 3 };
    case "pricing":
      return { heading: "Our Pricing", items: [] };
    case "custom_html":
      return { html: "" };
    default:
      return {};
  }
}
