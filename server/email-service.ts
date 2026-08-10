import nodemailer from 'nodemailer';
import path from 'path';
import fs from 'fs';

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  attachments?: Array<{
    filename: string;
    content?: Buffer;
    path?: string;
    contentType?: string;
  }>;
}

interface TicketTypeSummary {
  name?: string | null;
  price?: number | null;
  description?: string | null;
}

interface FormSubmissionEmailData {
  eventName: string;
  studentName: string;
  email: string;
  submissionDate: Date;
  quantity: number;
  totalAmount: number;
  notes?: string;
  forms?: Array<{
    fileName: string;
    fileUrl: string;
    fileType: string;
  }>;
  ticketType?: TicketTypeSummary | null;
}

interface ApprovalEmailData {
  eventName: string;
  studentName: string;
  ticketPurchaseUrl: string;
  quantity: number;
  totalAmount: number;
  ticketType?: TicketTypeSummary | null;
}

interface RejectionEmailData {
  eventName: string;
  studentName: string;
  reason: string;
  retryUrl: string;
}

interface PurchaseConfirmationData {
  orderNumber: string;
  items: Array<{
    name: string;
    quantity: number;
    price: number;
    size?: string;
    color?: string;
  }>;
  total: number;
  paymentMethod: string;
  last4?: string;
}

class EmailService {
  private fromEmail: string;
  private adminEmail: string;
  private formNotificationEmails: string[];
  private transporter: nodemailer.Transporter;

  constructor() {
    this.fromEmail = process.env.FROM_EMAIL || 'noreply@eshsasb.org';
    this.adminEmail = process.env.ADMIN_EMAIL || 'theo@bongbong.com';

    const notificationEmailsStr = process.env.FORM_NOTIFICATION_EMAILS || '';
    this.formNotificationEmails = notificationEmailsStr
      .split(',')
      .map(email => email.trim())
      .filter(email => email.length > 0);

    this.transporter = nodemailer.createTransport({
      host: 'localhost',
      port: 25,
      secure: false,
      auth: {
        user: '',
        pass: ''
      },
      tls: {
        rejectUnauthorized: false
      },
      pool: true,
      maxConnections: 5,
      maxMessages: 100
    });

    this.transporter.verify((error) => {
      if (error) {
        console.error('Email transporter configuration error:', error);
      } else {
        console.log('Email server is ready to send messages');
      }
    });
  }

  private async sendEmail(options: EmailOptions): Promise<void> {
    const { to, subject, html, attachments = [] } = options;

    try {
      const mailOptions = {
        from: `El Segundo High ASB <${this.fromEmail}>`,
        to,
        subject,
        html,
        attachments
      };

      const info = await this.transporter.sendMail(mailOptions);
      console.log(`Email sent successfully to ${to}:`, info.messageId);
    } catch (error) {
      console.error('Failed to send email:', error);
      throw error;
    }
  }

  async sendFormSubmissionReceipt(to: string, data: FormSubmissionEmailData, attachments?: Array<{
    filename: string;
    content: Buffer;
    contentType: string;
  }>): Promise<void> {
    const html = `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
    h2 { color: #003366; border-bottom: 1px solid #ccc; padding-bottom: 10px; }
    .info-section { margin: 20px 0; }
    .info-row { margin: 8px 0; }
    .label { font-weight: bold; }
    .footer { margin-top: 30px; padding-top: 15px; border-top: 1px solid #ccc; font-size: 12px; color: #666; }
  </style>
</head>
<body>
  <h2>Submission Receipt</h2>

  <p>Dear ${data.studentName},</p>

  <p>Thank you for submitting your forms for <strong>${data.eventName}</strong>. This email confirms that we have received your submission.</p>

  <div class="info-section">
    <h3>Submission Details</h3>
    <div class="info-row"><span class="label">Event:</span> ${data.eventName}</div>
    <div class="info-row"><span class="label">Submission Date:</span> ${new Date(data.submissionDate).toLocaleString()}</div>
    <div class="info-row"><span class="label">Ticket Type:</span> ${data.ticketType?.name || 'Not specified'}</div>
    <div class="info-row"><span class="label">Quantity:</span> ${data.quantity}</div>
    <div class="info-row"><span class="label">Total Amount:</span> $${data.totalAmount.toFixed(2)}</div>
    ${data.notes ? `<div class="info-row"><span class="label">Your Notes:</span> ${data.notes}</div>` : ''}
    <div class="info-row"><span class="label">Status:</span> Pending Review</div>
  </div>

  <div class="info-section">
    <h3>Submitted Forms</h3>
    <p>The following forms have been submitted and are attached to this email:</p>
    <ul>
      ${data.forms?.map(form => `<li>${form.fileName}</li>`).join('') || '<li>No forms attached</li>'}
    </ul>
  </div>

  <div class="info-section">
    <h3>What happens next?</h3>
    <ol>
      <li>Your submission will be reviewed by an administrator</li>
      <li>You will receive an email notification once your request is approved or if additional information is needed</li>
      <li>If approved, you'll receive instructions for completing your purchase</li>
    </ol>
    <p>Expected review time: Within 1-2 business days</p>
  </div>

  <p>Please keep this email for your records. If you have any questions, please contact the ASB office.</p>

  <div class="footer">
    <p>El Segundo High School ASB</p>
    <p>This is an automated receipt. Please do not reply to this email.</p>
  </div>
</body>
</html>
    `;

    const emailAttachments = attachments ?? [];

    await this.sendEmail({
      to,
      subject: `Form Submission Receipt - ${data.eventName}`,
      html,
      attachments: emailAttachments
    });
  }

  async sendFormSubmissionNotification(data: FormSubmissionEmailData, attachments?: Array<{
    filename: string;
    content: Buffer;
    contentType: string;
  }>): Promise<void> {
    const html = `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
    h2 { color: #003366; border-bottom: 1px solid #ccc; padding-bottom: 10px; }
    .info-row { margin: 8px 0; }
    .label { font-weight: bold; }
    .footer { margin-top: 30px; padding-top: 15px; border-top: 1px solid #ccc; font-size: 12px; color: #666; }
  </style>
</head>
<body>
  <h2>New Activity Form Submission</h2>

  <p>A new form submission has been received for review:</p>

  <div class="info-row"><span class="label">Event:</span> ${data.eventName}</div>
  <div class="info-row"><span class="label">Student Name:</span> ${data.studentName}</div>
  <div class="info-row"><span class="label">Email:</span> ${data.email}</div>
  <div class="info-row"><span class="label">Submission Date:</span> ${new Date(data.submissionDate).toLocaleString()}</div>
  <div class="info-row"><span class="label">Ticket Type:</span> ${data.ticketType?.name || 'Not specified'}</div>
  <div class="info-row"><span class="label">Quantity:</span> ${data.quantity}</div>
  <div class="info-row"><span class="label">Total Amount:</span> $${data.totalAmount.toFixed(2)}</div>
  ${data.notes ? `<div class="info-row"><span class="label">Notes:</span> ${data.notes}</div>` : ''}

  <h3>Attached Forms</h3>
  <ul>
    ${data.forms?.map(form => `<li>${form.fileName} (${form.fileType})</li>`).join('') || '<li>No forms attached</li>'}
  </ul>

  <p><strong>Action Required:</strong> Please review this submission in the admin panel and approve or reject it.</p>

  <div class="footer">
    <p>This is an automated message from the ESHS ASB System</p>
  </div>
</body>
</html>
    `;

    const emailAttachments = attachments ?? [];

    const recipients = this.formNotificationEmails.length > 0
      ? this.formNotificationEmails
      : [this.adminEmail];

    console.log(`EmailService: Sending form notification to ${recipients.length} recipients: ${recipients.join(', ')}`);

    for (const recipient of recipients) {
      await this.sendEmail({
        to: recipient,
        subject: `New Activity Form Submission - ${data.eventName} - ${data.studentName}`,
        html,
        attachments: emailAttachments
      });
    }
  }

  async sendApprovalNotification(to: string, data: ApprovalEmailData): Promise<void> {
    console.log(`EmailService: Sending approval notification to ${to} for event ${data.eventName}`);
    const html = `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
    h2 { color: #003366; border-bottom: 1px solid #ccc; padding-bottom: 10px; }
    .info-row { margin: 8px 0; }
    .label { font-weight: bold; }
    .button { display: inline-block; padding: 12px 24px; background: #003366; color: white; text-decoration: none; border-radius: 4px; margin: 20px 0; }
    .footer { margin-top: 30px; padding-top: 15px; border-top: 1px solid #ccc; font-size: 12px; color: #666; }
  </style>
</head>
<body>
  <h2>Your Activity Request Has Been Approved</h2>

  <p>Dear ${data.studentName},</p>

  <p>Your request for <strong>${data.eventName}</strong> has been approved by the ASB team.</p>

  <h3>Details</h3>
  <div class="info-row"><span class="label">Event:</span> ${data.eventName}</div>
  <div class="info-row"><span class="label">Ticket Type:</span> ${data.ticketType?.name || 'Not specified'}</div>
  <div class="info-row"><span class="label">Quantity:</span> ${data.quantity}</div>
  <div class="info-row"><span class="label">Total Amount:</span> $${data.totalAmount.toFixed(2)}</div>

  <p>You can now proceed to complete your payment using the link below:</p>

  <p><a href="${data.ticketPurchaseUrl}" class="button" style="color: white !important;">Complete Payment</a></p>

  <p><strong>Important:</strong> Please complete your payment within 48 hours to secure your spot. If you have any questions, contact the ASB office.</p>

  <div class="footer">
    <p>Thank you for participating in school activities!</p>
    <p>El Segundo High School ASB</p>
  </div>
</body>
</html>
    `;

    await this.sendEmail({
      to,
      subject: `Form Submission Approved - ${data.eventName}`,
      html
    });
    console.log(`EmailService: Approval email sent successfully to ${to}`);
  }

  async sendRejectionNotification(to: string, data: RejectionEmailData): Promise<void> {
    console.log(`EmailService: Sending rejection notification to ${to} for event ${data.eventName}`);
    const html = `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
    h2 { color: #003366; border-bottom: 1px solid #ccc; padding-bottom: 10px; }
    .reason-box { background: #f5f5f5; border-left: 3px solid #999; padding: 15px; margin: 20px 0; }
    .button { display: inline-block; padding: 12px 24px; background: #003366; color: white; text-decoration: none; border-radius: 4px; margin: 20px 0; }
    .footer { margin-top: 30px; padding-top: 15px; border-top: 1px solid #ccc; font-size: 12px; color: #666; }
  </style>
</head>
<body>
  <h2>Form Submission Update</h2>

  <p>Dear ${data.studentName},</p>

  <p>We were unable to approve your submission for <strong>${data.eventName}</strong>.</p>

  <div class="reason-box">
    <strong>Reason:</strong><br>
    ${data.reason}
  </div>

  <p>You may resubmit your forms with the necessary corrections using the link below:</p>

  <p><a href="${data.retryUrl}" class="button" style="color: white !important;">Submit New Request</a></p>

  <p>If you have questions about this decision or need guidance, please contact the ASB office during school hours.</p>

  <div class="footer">
    <p>El Segundo High School ASB</p>
  </div>
</body>
</html>
    `;

    await this.sendEmail({
      to,
      subject: `Form Submission Update - ${data.eventName}`,
      html
    });
    console.log(`EmailService: Rejection email sent successfully to ${to}`);
  }

  async sendPurchaseConfirmation(to: string, data: PurchaseConfirmationData): Promise<void> {
    console.log(`EmailService: Sending purchase confirmation to ${to} for order ${data.orderNumber}`);
    const html = `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
    h2 { color: #003366; border-bottom: 1px solid #ccc; padding-bottom: 10px; }
    .info-row { margin: 8px 0; }
    .label { font-weight: bold; }
    table { width: 100%; border-collapse: collapse; margin: 20px 0; }
    th, td { padding: 10px; text-align: left; border-bottom: 1px solid #ddd; }
    th { background: #f5f5f5; }
    .total-row { font-weight: bold; border-top: 2px solid #333; }
    .footer { margin-top: 30px; padding-top: 15px; border-top: 1px solid #ccc; font-size: 12px; color: #666; }
  </style>
</head>
<body>
  <h2>Payment Confirmation</h2>

  <p>Your payment has been successfully processed.</p>

  <h3>Order Details</h3>
  <div class="info-row"><span class="label">Order Number:</span> #${data.orderNumber}</div>
  <div class="info-row"><span class="label">Order Date:</span> ${new Date().toLocaleDateString()}</div>

  <h3>Items Ordered</h3>
  <table>
    <tr>
      <th>Item</th>
      <th>Qty</th>
      <th>Price</th>
    </tr>
    ${data.items.map(item => `
      <tr>
        <td>${item.name}${item.size ? ` (Size: ${item.size})` : ''}${item.color ? ` (Color: ${item.color})` : ''}</td>
        <td>${item.quantity}</td>
        <td>$${(item.price * item.quantity).toFixed(2)}</td>
      </tr>
    `).join('')}
    <tr class="total-row">
      <td colspan="2">Total</td>
      <td>$${data.total.toFixed(2)}</td>
    </tr>
  </table>

  <h3>Payment Information</h3>
  <div class="info-row"><span class="label">Payment Method:</span> ${data.paymentMethod.toUpperCase()}${data.last4 ? ` ending in ${data.last4}` : ''}</div>
  <div class="info-row"><span class="label">Status:</span> Completed</div>

  <p>Your order will be processed and you will be contacted when it's ready for pickup.</p>

  <p>If you have any questions about your order, please contact the ASB office.</p>

  <div class="footer">
    <p>Thank you for supporting ESHS activities!</p>
    <p>El Segundo High School ASB</p>
    <p>Please keep this email for your records.</p>
  </div>
</body>
</html>
    `;

    await this.sendEmail({
      to,
      subject: `Payment Confirmation - Order #${data.orderNumber}`,
      html
    });
    console.log(`EmailService: Purchase confirmation email sent successfully to ${to}`);
  }

  async sendTestEmail(to: string): Promise<void> {
    const html = `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
    h2 { color: #003366; border-bottom: 1px solid #ccc; padding-bottom: 10px; }
  </style>
</head>
<body>
  <h2>Test Email</h2>
  <p>This is a test email from the ESHS ASB System.</p>
  <p>If you received this email, the email service is working correctly.</p>
  <p><strong>Timestamp:</strong> ${new Date().toISOString()}</p>
</body>
</html>
    `;

    await this.sendEmail({
      to,
      subject: 'Test Email from ESHS ASB System',
      html
    });
  }
}

export const emailService = new EmailService();
