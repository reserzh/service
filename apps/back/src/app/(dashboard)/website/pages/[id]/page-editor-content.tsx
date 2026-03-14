"use client";

import { useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  ResizablePanelGroup,
  ResizablePanel,
  ResizableHandle,
} from "@/components/ui/resizable";
import {
  updatePageAction,
  publishPageAction,
  deletePageAction,
  createSectionAction,
  updateSectionAction,
  deleteSectionAction,
  reorderSectionsAction,
} from "@/actions/website";
import { showToast } from "@/lib/toast";
import { Plus, Trash2, Save } from "lucide-react";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { SortableSectionCard } from "./sortable-section-card";
import { SectionPickerDialog } from "./section-picker-dialog";
import { PreviewPanel } from "./preview-panel";

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

type SiteTheme = {
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  fontHeading: string;
  fontBody: string;
  borderRadius: string;
};

export function PageEditorContent({
  page,
  initialSections,
  siteTheme,
}: {
  page: Page;
  initialSections: Section[];
  siteTheme?: SiteTheme | null;
}) {
  const router = useRouter();
  const [sections, setSections] = useState(initialSections);
  const [saving, setSaving] = useState(false);
  const [actionInProgress, setActionInProgress] = useState(false);
  const [addSectionOpen, setAddSectionOpen] = useState(false);
  const [pageTitle, setPageTitle] = useState(page.title);
  const [pageSlug, setPageSlug] = useState(page.slug);
  const [confirmDeletePage, setConfirmDeletePage] = useState(false);
  const [deleteSectionId, setDeleteSectionId] = useState<string | null>(null);
  const [dirtySections, setDirtySections] = useState<Set<string>>(new Set());

  // Ref to keep latest sections for drag rollback
  const sectionsRef = useRef(sections);
  sectionsRef.current = sections;

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const markDirty = useCallback((id: string) => {
    setDirtySections((prev) => new Set(prev).add(id));
  }, []);

  const markClean = useCallback((id: string) => {
    setDirtySections((prev) => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
  }, []);

  const handlePublish = async () => {
    if (actionInProgress) return;
    setActionInProgress(true);
    const result = await publishPageAction(page.id);
    setActionInProgress(false);
    if (result.error) {
      showToast.error(result.error);
    } else {
      showToast.saved("Page");
      router.refresh();
    }
  };

  const handleDelete = async () => {
    const result = await deletePageAction(page.id);
    if (result.error) {
      showToast.error(result.error);
    } else {
      showToast.deleted("Page");
      router.push("/website/pages");
    }
    setConfirmDeletePage(false);
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
      showToast.error(result.error);
    } else {
      showToast.saved("Page");
      router.refresh();
    }
  };

  const handleAddSection = async (type: string) => {
    if (actionInProgress) return;
    setActionInProgress(true);
    const result = await createSectionAction({
      pageId: page.id,
      type,
      content: getDefaultContent(type),
    });
    setActionInProgress(false);
    if (result.error) {
      showToast.error(result.error);
    } else {
      setSections((prev) => [...prev, result.data as Section]);
      showToast.created("Section");
    }
    setAddSectionOpen(false);
  };

  const handleDeleteSection = async () => {
    if (!deleteSectionId) return;
    const id = deleteSectionId;
    setDeleteSectionId(null);
    const result = await deleteSectionAction(id, page.id);
    if (result.error) {
      showToast.error(result.error);
    } else {
      setSections((prev) => prev.filter((s) => s.id !== id));
      markClean(id);
      showToast.deleted("Section");
    }
  };

  const handleToggleVisibility = useCallback(async (sectionId: string, currentlyVisible: boolean) => {
    const result = await updateSectionAction({
      sectionId,
      pageId: page.id,
      isVisible: !currentlyVisible,
    });
    if (result.error) {
      showToast.error(result.error);
    } else {
      setSections((prev) =>
        prev.map((s) =>
          s.id === sectionId ? { ...s, isVisible: !currentlyVisible } : s
        )
      );
    }
  }, [page.id]);

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const snapshot = sectionsRef.current;

    setSections((prev) => {
      const oldIndex = prev.findIndex((s) => s.id === active.id);
      const newIndex = prev.findIndex((s) => s.id === over.id);
      if (oldIndex === -1 || newIndex === -1) return prev;
      const next = [...prev];
      const [removed] = next.splice(oldIndex, 1);
      next.splice(newIndex, 0, removed);
      return next;
    });

    const reordered = (() => {
      const oldIndex = snapshot.findIndex((s) => s.id === active.id);
      const newIndex = snapshot.findIndex((s) => s.id === over.id);
      if (oldIndex === -1 || newIndex === -1) return null;
      const next = [...snapshot];
      const [removed] = next.splice(oldIndex, 1);
      next.splice(newIndex, 0, removed);
      return next;
    })();

    if (!reordered) return;

    const result = await reorderSectionsAction(
      page.id,
      reordered.map((s) => s.id)
    );
    if (result.error) {
      setSections(snapshot);
      showToast.error(result.error);
    }
  };

  const handleContentChange = useCallback((sectionId: string, content: Record<string, unknown>) => {
    setSections((prev) =>
      prev.map((s) => (s.id === sectionId ? { ...s, content } : s))
    );
    markDirty(sectionId);
  }, [markDirty]);

  const handleSettingsChange = useCallback((sectionId: string, settings: Record<string, unknown>) => {
    setSections((prev) =>
      prev.map((s) => (s.id === sectionId ? { ...s, settings } : s))
    );
    markDirty(sectionId);
  }, [markDirty]);

  const handleSaveSection = useCallback(async (sectionId: string) => {
    const section = sectionsRef.current.find((s) => s.id === sectionId);
    if (!section) return;
    const result = await updateSectionAction({
      sectionId: section.id,
      pageId: page.id,
      content: section.content ?? {},
      settings: section.settings ?? {},
    });
    if (result.error) {
      showToast.error(result.error);
    } else {
      markClean(section.id);
      showToast.saved("Section");
    }
  }, [page.id, markClean]);

  return (
    <div className="mt-6 space-y-4">
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
            <Button size="sm" onClick={handlePublish} disabled={actionInProgress}>Publish</Button>
          )}
          <Button
            variant="destructive"
            size="sm"
            onClick={() => setConfirmDeletePage(true)}
            aria-label="Delete page"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </CardContent>
      </Card>

      {/* Editor + Preview Split */}
      <ResizablePanelGroup orientation="horizontal" className="min-h-[600px] rounded-lg border">
        {/* Editor Panel */}
        <ResizablePanel defaultSize={55} minSize={35}>
          <div className="h-full overflow-y-auto p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Sections</h3>
              <Button size="sm" onClick={() => setAddSectionOpen(true)} disabled={actionInProgress}>
                <Plus className="mr-2 h-4 w-4" />
                Add Section
              </Button>
            </div>

            {sections.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center text-muted-foreground">
                  No sections yet. Click &quot;Add Section&quot; to start building your page.
                </CardContent>
              </Card>
            ) : (
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
              >
                <SortableContext
                  items={sections.map((s) => s.id)}
                  strategy={verticalListSortingStrategy}
                >
                  <div className="space-y-3">
                    {sections.map((section) => (
                      <SortableSectionCard
                        key={section.id}
                        section={section}
                        isDirty={dirtySections.has(section.id)}
                        onToggleVisibility={() => handleToggleVisibility(section.id, section.isVisible)}
                        onDelete={() => setDeleteSectionId(section.id)}
                        onContentChange={(content) => handleContentChange(section.id, content)}
                        onSettingsChange={(settings) => handleSettingsChange(section.id, settings)}
                        onSave={() => handleSaveSection(section.id)}
                      />
                    ))}
                  </div>
                </SortableContext>
              </DndContext>
            )}
          </div>
        </ResizablePanel>

        <ResizableHandle withHandle />

        {/* Preview Panel */}
        <ResizablePanel defaultSize={45} minSize={25}>
          <PreviewPanel sections={sections} siteTheme={siteTheme} />
        </ResizablePanel>
      </ResizablePanelGroup>

      <SectionPickerDialog
        open={addSectionOpen}
        onOpenChange={setAddSectionOpen}
        onSelect={handleAddSection}
      />

      <ConfirmDialog
        open={confirmDeletePage}
        onOpenChange={setConfirmDeletePage}
        title="Delete this page?"
        description="This page and all its sections will be permanently removed from your website."
        confirmLabel="Delete Page"
        onConfirm={handleDelete}
      />
      <ConfirmDialog
        open={deleteSectionId !== null}
        onOpenChange={(open) => { if (!open) setDeleteSectionId(null); }}
        title="Delete this section?"
        description="This section will be permanently removed from the page."
        confirmLabel="Delete Section"
        onConfirm={handleDeleteSection}
      />
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
