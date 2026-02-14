import { Metadata } from "next";
import { notFound } from "next/navigation";
import { requireAuth } from "@/lib/auth";
import { getCustomerWithRelations } from "@/lib/services/customers";
import { PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import {
  Phone,
  Mail,
  MapPin,
  Building2,
  Pencil,
  Briefcase,
  FileText,
  Receipt,
  Cpu,
} from "lucide-react";
import Link from "next/link";

interface PageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  return { title: "Customer Details" };
}

export default async function CustomerDetailPage({ params }: PageProps) {
  const { id } = await params;
  const ctx = await requireAuth();

  let customer;
  try {
    customer = await getCustomerWithRelations(ctx, id);
  } catch {
    notFound();
  }

  const fullName = `${customer.firstName} ${customer.lastName}`;

  return (
    <div className="space-y-6">
      <PageHeader
        title={fullName}
        breadcrumbs={[
          { label: "Customers", href: "/customers" },
          { label: fullName },
        ]}
      >
        <Badge variant={customer.type === "commercial" ? "default" : "secondary"}>
          {customer.type}
        </Badge>
        <Button variant="outline" size="sm">
          <Pencil className="mr-2 h-3.5 w-3.5" />
          Edit
        </Button>
      </PageHeader>

      {/* Contact info cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="flex items-center gap-3 pt-6">
            <div className="rounded-md bg-muted p-2">
              <Phone className="h-4 w-4 text-muted-foreground" />
            </div>
            <div>
              <p className="text-sm font-medium">{customer.phone}</p>
              {customer.altPhone && (
                <p className="text-xs text-muted-foreground">{customer.altPhone}</p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center gap-3 pt-6">
            <div className="rounded-md bg-muted p-2">
              <Mail className="h-4 w-4 text-muted-foreground" />
            </div>
            <div>
              <p className="text-sm font-medium">{customer.email || "No email"}</p>
            </div>
          </CardContent>
        </Card>

        {customer.companyName && (
          <Card>
            <CardContent className="flex items-center gap-3 pt-6">
              <div className="rounded-md bg-muted p-2">
                <Building2 className="h-4 w-4 text-muted-foreground" />
              </div>
              <div>
                <p className="text-sm font-medium">{customer.companyName}</p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Tabs */}
      <Tabs defaultValue="properties" className="space-y-4">
        <TabsList>
          <TabsTrigger value="properties">
            <MapPin className="mr-1.5 h-3.5 w-3.5" />
            Properties ({customer.properties.length})
          </TabsTrigger>
          <TabsTrigger value="equipment">
            <Cpu className="mr-1.5 h-3.5 w-3.5" />
            Equipment ({customer.equipment.length})
          </TabsTrigger>
          <TabsTrigger value="jobs">
            <Briefcase className="mr-1.5 h-3.5 w-3.5" />
            Jobs
          </TabsTrigger>
          <TabsTrigger value="estimates">
            <FileText className="mr-1.5 h-3.5 w-3.5" />
            Estimates
          </TabsTrigger>
          <TabsTrigger value="invoices">
            <Receipt className="mr-1.5 h-3.5 w-3.5" />
            Invoices
          </TabsTrigger>
        </TabsList>

        <TabsContent value="properties" className="space-y-3">
          {customer.properties.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center text-sm text-muted-foreground">
                No properties yet. Add a property to start scheduling jobs.
              </CardContent>
            </Card>
          ) : (
            customer.properties.map((prop) => (
              <Card key={prop.id}>
                <CardContent className="flex items-start gap-3 pt-6">
                  <div className="rounded-md bg-muted p-2">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div>
                    {prop.name && <p className="text-sm font-medium">{prop.name}</p>}
                    <p className="text-sm">
                      {prop.addressLine1}
                      {prop.addressLine2 && `, ${prop.addressLine2}`}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {prop.city}, {prop.state} {prop.zip}
                    </p>
                    {prop.accessNotes && (
                      <p className="mt-1 text-xs text-muted-foreground">
                        Access: {prop.accessNotes}
                      </p>
                    )}
                    {prop.isPrimary && (
                      <Badge variant="outline" className="mt-1 text-xs">
                        Primary
                      </Badge>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        <TabsContent value="equipment" className="space-y-3">
          {customer.equipment.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center text-sm text-muted-foreground">
                No equipment tracked for this customer yet.
              </CardContent>
            </Card>
          ) : (
            customer.equipment.map((equip) => (
              <Card key={equip.id}>
                <CardContent className="flex items-start gap-3 pt-6">
                  <div className="rounded-md bg-muted p-2">
                    <Cpu className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">{equip.type}</p>
                    <p className="text-sm text-muted-foreground">
                      {[equip.brand, equip.model].filter(Boolean).join(" ") || "No details"}
                    </p>
                    {equip.serialNumber && (
                      <p className="text-xs text-muted-foreground">
                        S/N: {equip.serialNumber}
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        <TabsContent value="jobs">
          <Card>
            <CardContent className="py-8 text-center text-sm text-muted-foreground">
              No jobs for this customer yet.
              <div className="mt-3">
                <Button size="sm" asChild>
                  <Link href={`/jobs?customerId=${id}`}>Create Job</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="estimates">
          <Card>
            <CardContent className="py-8 text-center text-sm text-muted-foreground">
              No estimates for this customer yet.
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="invoices">
          <Card>
            <CardContent className="py-8 text-center text-sm text-muted-foreground">
              No invoices for this customer yet.
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Notes */}
      {customer.notes && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Notes</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm whitespace-pre-wrap">{customer.notes}</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
