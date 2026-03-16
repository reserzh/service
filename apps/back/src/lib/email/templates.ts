// Variable substitution engine for communication templates.
// Templates use {{variable}} placeholders that get replaced with actual values.

export interface TemplateVariables {
  [key: string]: string | number | undefined | null;
}

/**
 * Replace {{variable}} placeholders in a template string with actual values.
 * Unmatched variables are left as-is (rendered as empty string in final output).
 */
export function renderTemplate(template: string, variables: TemplateVariables): string {
  return template.replace(/\{\{(\w+)\}\}/g, (match, key) => {
    const value = variables[key];
    if (value === undefined || value === null) return "";
    return String(value);
  });
}

// Available variables per trigger type
export const TEMPLATE_VARIABLES: Record<string, string[]> = {
  invoice_sent: [
    "customerFirstName",
    "customerLastName",
    "customerEmail",
    "invoiceNumber",
    "invoiceTotal",
    "invoiceDueDate",
    "companyName",
    "portalUrl",
  ],
  estimate_sent: [
    "customerFirstName",
    "customerLastName",
    "customerEmail",
    "estimateNumber",
    "estimateTotal",
    "estimateValidUntil",
    "companyName",
    "portalUrl",
  ],
  job_scheduled: [
    "customerFirstName",
    "customerLastName",
    "jobNumber",
    "jobSummary",
    "scheduledDate",
    "scheduledTime",
    "technicianName",
    "companyName",
  ],
  job_dispatched: [
    "customerFirstName",
    "customerLastName",
    "jobNumber",
    "jobSummary",
    "technicianName",
    "companyName",
  ],
  tech_en_route: [
    "customerFirstName",
    "customerLastName",
    "jobNumber",
    "jobSummary",
    "technicianName",
    "trackingUrl",
    "companyName",
  ],
  job_completed: [
    "customerFirstName",
    "customerLastName",
    "jobNumber",
    "jobSummary",
    "companyName",
  ],
  appointment_reminder: [
    "customerFirstName",
    "customerLastName",
    "jobNumber",
    "jobSummary",
    "scheduledDate",
    "scheduledTime",
    "technicianName",
    "companyName",
  ],
  custom: [
    "customerFirstName",
    "customerLastName",
    "customerEmail",
    "companyName",
  ],
};

// Default template library for each trigger
export const DEFAULT_TEMPLATES: Record<string, { subject: string; body: string }> = {
  invoice_sent: {
    subject: "Invoice {{invoiceNumber}} from {{companyName}}",
    body: `<p>Hi {{customerFirstName}},</p>
<p>Your invoice <strong>{{invoiceNumber}}</strong> for <strong>\${{invoiceTotal}}</strong> is ready.</p>
<p>Due date: {{invoiceDueDate}}</p>
<p>Thank you for your business!</p>
<p>— {{companyName}}</p>`,
  },
  estimate_sent: {
    subject: "Estimate {{estimateNumber}} from {{companyName}}",
    body: `<p>Hi {{customerFirstName}},</p>
<p>We've prepared an estimate <strong>{{estimateNumber}}</strong> for your review.</p>
<p>Total: <strong>\${{estimateTotal}}</strong></p>
<p>Valid until: {{estimateValidUntil}}</p>
<p>Please review and let us know if you'd like to proceed.</p>
<p>— {{companyName}}</p>`,
  },
  job_scheduled: {
    subject: "Your appointment has been scheduled — {{companyName}}",
    body: `<p>Hi {{customerFirstName}},</p>
<p>Your service appointment <strong>{{jobNumber}}</strong> has been scheduled.</p>
<p><strong>Date:</strong> {{scheduledDate}}<br><strong>Time:</strong> {{scheduledTime}}</p>
<p><strong>Service:</strong> {{jobSummary}}</p>
<p>We look forward to helping you!</p>
<p>— {{companyName}}</p>`,
  },
  job_dispatched: {
    subject: "Your technician has been dispatched — {{companyName}}",
    body: `<p>Hi {{customerFirstName}},</p>
<p>A technician has been dispatched for job <strong>{{jobNumber}}</strong>.</p>
<p><strong>Service:</strong> {{jobSummary}}</p>
<p>We'll notify you when they're on their way.</p>
<p>— {{companyName}}</p>`,
  },
  tech_en_route: {
    subject: "Your technician is on the way — {{companyName}}",
    body: `<p>Hi {{customerFirstName}},</p>
<p>Great news! <strong>{{technicianName}}</strong> is on the way for job <strong>{{jobNumber}}</strong>.</p>
<p><strong>Service:</strong> {{jobSummary}}</p>
<p style="margin: 24px 0;"><a href="{{trackingUrl}}" style="background-color: #4f46e5; color: #ffffff; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: bold; display: inline-block;">Track Your Technician Live</a></p>
<p>You can follow their progress in real time using the link above.</p>
<p>— {{companyName}}</p>`,
  },
  job_completed: {
    subject: "Service completed — {{companyName}}",
    body: `<p>Hi {{customerFirstName}},</p>
<p>We're pleased to let you know that job <strong>{{jobNumber}}</strong> has been completed.</p>
<p><strong>Service:</strong> {{jobSummary}}</p>
<p>Thank you for choosing {{companyName}}!</p>
<p>— {{companyName}}</p>`,
  },
  appointment_reminder: {
    subject: "Reminder: Your appointment tomorrow — {{companyName}}",
    body: `<p>Hi {{customerFirstName}},</p>
<p>This is a friendly reminder that you have a service appointment scheduled for tomorrow.</p>
<p><strong>Date:</strong> {{scheduledDate}}<br><strong>Time:</strong> {{scheduledTime}}</p>
<p><strong>Service:</strong> {{jobSummary}}</p>
<p><strong>Technician:</strong> {{technicianName}}</p>
<p>If you need to reschedule or have any questions, please give us a call.</p>
<p>— {{companyName}}</p>`,
  },
};
