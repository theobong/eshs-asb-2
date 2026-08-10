# Email Notification System Setup (Postfix + Nodemailer)

## Overview
The ESHS ASB system includes comprehensive email notifications for the complete activity approval workflow using **Postfix** for local mail delivery and **Nodemailer** for sending emails.

### Complete Email Flow
1. **On Submission**: Student receives receipt, Admin receives notification (both with attachments)
2. **On Approval**: Student receives approval email with checkout link
3. **On Rejection**: Student receives rejection email with reason and retry link

## Features

### 1. Form Submission Notification (Admin)
When a student submits a form for an activity requiring approval:
- **Recipient**: Admin email (configured via environment variables)
- **Content**: 
  - Student details (name, email)
  - Event information
  - Submission date
  - **Ticket type information** (name, price, description)
  - Quantity and total amount
  - Notes (if any)
- **Attachments**: All submitted forms are attached to the email
- **Enhanced Design**: Modern HTML template with school branding

### 2. Form Submission Receipt (Student)
When a student submits a form, they automatically receive a receipt:
- **Recipient**: Student's email address
- **Content**:
  - Confirmation of submission receipt
  - Event details with **ticket type information**
  - Quantity and total amount
  - Status indicator (Pending Review)
  - Next steps and expected timeline
  - All submission details for records
- **Attachments**: All submitted forms are attached as a receipt
- **Subject**: Form Submission Receipt - [Event Name]
- **Design**: Purple gradient theme with clear status tracking

### 3. Approval Notification
When an admin approves a form submission:
- **Recipient**: Student's email
- **Content**:
  - Congratulatory message with approval confirmation
  - Event details with **ticket type information**
  - Quantity and total amount
  - Call-to-action button for ticket purchase
  - 48-hour deadline notice
- **Subject**: Form Submission Approved - [Event Name]
- **Design**: Green gradient theme with professional styling

### 4. Rejection Notification
When an admin rejects a form submission:
- **Recipient**: Student's email
- **Content**:
  - Professional rejection notification
  - Clear reason for rejection in highlighted box
  - Encouragement to resubmit with guidelines
  - Call-to-action button to try again
- **Subject**: Form Submission Update - [Event Name]
- **Design**: Professional layout with helpful resources

## Setup Instructions

### Prerequisites
- Debian/Ubuntu Linux server
- Root or sudo access
- Node.js application with environment variable support

### Installation Steps

#### 1. Install and Configure Postfix

```bash
sudo bash server/setup-postfix.sh
```

This script will:
- Install Postfix and required packages
- Configure Postfix for local mail delivery only
- Create necessary configuration files
- Enable and start the Postfix service

#### 2. Configure Local Delivery

No additional credentials needed - Postfix is configured for local delivery only.

#### 3. Configure Application Environment

Create a `.env` file in your project root (copy from `.env.example`):

```bash
cp .env.example .env
nano .env
```

**Postfix Configuration:**
```env
FROM_EMAIL=noreply@eshsasb.org
ADMIN_EMAIL=admin@eshsasb.org
```

The email service automatically uses `localhost:25` for Postfix.

### 4. Test Email Functionality

The system includes a comprehensive testing endpoint:

```bash
# Test basic email
curl -X POST http://localhost:3000/api/test-email \
  -H "Content-Type: application/json" \
  -d '{"to": "test@example.com", "type": "test"}'

# Test approval email
curl -X POST http://localhost:3000/api/test-email \
  -H "Content-Type: application/json" \
  -d '{"to": "test@example.com", "type": "approval"}'

# Test rejection email
curl -X POST http://localhost:3000/api/test-email \
  -H "Content-Type: application/json" \
  -d '{"to": "test@example.com", "type": "rejection"}'

# Test submission notification (admin)
curl -X POST http://localhost:3000/api/test-email \
  -H "Content-Type: application/json" \
  -d '{"to": "admin@example.com", "type": "submission"}'

# Test submission receipt (student)
curl -X POST http://localhost:3000/api/test-email \
  -H "Content-Type: application/json" \
  -d '{"to": "student@example.com", "type": "receipt"}'
```

## API Integration

### Automatic Email Triggers

#### Form Submission
`POST /api/form-submissions`
- Automatically sends notification to admin with all submission details
- Automatically sends receipt to student with their submitted forms
- Includes form attachments in both emails
- Professional HTML templates with school branding

#### Status Updates
`PUT /api/form-submissions/:id`
- Triggers email when status changes from 'pending'
- **Approved**: Sends celebration email with checkout link (placeholder: `https://eshsasb.org/checkout/{submissionId}`)
- **Rejected**: Sends professional rejection with reason and retry link

### Custom Rejection Reasons
Include a custom rejection reason in the update request:
```json
{
  "status": "rejected",
  "rejectionReason": "Missing required parent signature. Please ensure all forms are completely filled out and signed."
}
```

## Email Templates

### Design Features
- **Responsive Design**: Works on mobile and desktop
- **Professional Branding**: ESHS ASB colors and styling
- **Modern Layout**: Gradient backgrounds and rounded corners
- **Clear CTAs**: Prominent buttons for important actions
- **Accessibility**: High contrast and readable fonts
- **Emojis**: Strategic use for visual appeal and quick recognition

### Template Types

1. **Submission Template**: Clean, informative design for admin notifications
2. **Approval Template**: Celebratory green theme with success messaging
3. **Rejection Template**: Professional, helpful design with clear guidance
4. **Test Template**: Simple design for testing functionality

## Troubleshooting

### Email Not Sending
```bash
# Check Postfix status
sudo systemctl status postfix

# View mail logs
sudo tail -f /var/log/mail.log

# Test Postfix directly
echo "Test message" | mail -s "Test Subject" test@example.com

# Check queue
mailq

# Verify configuration
postfix check
```

### Connection Issues
```bash
# Test SMTP connection
telnet localhost 25

# Check network configuration
netstat -tlnp | grep :25

# Verify hostname
hostname -f
```

### Application Issues
```bash
# Check Node.js logs
npm run dev

# Test email service directly
node -e "
const { emailService } = require('./server/email-service');
emailService.sendTestEmail('test@example.com')
  .then(() => console.log('Success'))
  .catch(console.error);
"
```

## Security Considerations

### Best Practices
1. **Environment Variables**: Never commit email configuration to version control
2. **Local Network**: Configure Postfix to only accept local connections
3. **Rate Limiting**: Consider implementing email rate limiting
4. **Input Validation**: All email addresses are validated before sending
5. **Error Handling**: Email failures don't break application functionality

### Postfix Security
```bash
# Restrict network access
postconf inet_interfaces=loopback-only

# Disable unnecessary services
postconf smtpd_banner='$myhostname ESMTP'

# Set size limits
postconf message_size_limit=25600000
```

## Production Deployment

### Systemd Service
Create a systemd service for your Node.js application:

```bash
sudo nano /etc/systemd/system/eshsasb.service
```

```ini
[Unit]
Description=ESHS ASB Application
After=network.target postfix.service
Wants=postfix.service

[Service]
Type=simple
User=www-data
WorkingDirectory=/opt/eshsasb
ExecStart=/usr/bin/node server/index.js
Restart=always
RestartSec=10
Environment=NODE_ENV=production
EnvironmentFile=/etc/default/eshsasb-email

[Install]
WantedBy=multi-user.target
```

### Monitoring
```bash
# Monitor email queue
watch mailq

# Monitor application logs
journalctl -u eshsasb -f

# Monitor mail logs
tail -f /var/log/mail.log
```

## Configuration Details

### Postfix Local Delivery
- **Host**: localhost
- **Port**: 25
- **Security**: None (local delivery)
- **Authentication**: Not required
- **TLS**: Disabled for local connections

## Future Enhancements

- [ ] Email queue system for better reliability
- [ ] Email delivery tracking and analytics
- [ ] Template management interface
- [ ] Multi-language email support
- [ ] Automated email scheduling
- [ ] Integration with calendar systems
- [ ] Student email preferences management
- [ ] Email performance monitoring