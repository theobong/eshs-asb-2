import { emailService } from './server/email-service.js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

async function testEmail() {
  const testEmail = process.argv[2] || 'theo@bongbong.com';
  
  console.log('Testing email service...');
  console.log(`Sending test email to: ${testEmail}`);
  console.log(`FROM_EMAIL: ${process.env.FROM_EMAIL}`);
  console.log(`ADMIN_EMAIL: ${process.env.ADMIN_EMAIL}`);
  
  try {
    await emailService.sendTestEmail(testEmail);
    console.log('✅ Test email sent successfully!');
    console.log('Check your inbox and spam folder.');
  } catch (error) {
    console.error('❌ Failed to send test email:', error);
  }
  
  process.exit(0);
}

testEmail();