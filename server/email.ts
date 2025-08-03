import { TransactionalEmailsApi, TransactionalEmailsApiApiKeys, SendSmtpEmail } from '@getbrevo/brevo';

if (!process.env.BREVO_API_KEY) {
  throw new Error("BREVO_API_KEY environment variable must be set");
}

const apiInstance = new TransactionalEmailsApi();
apiInstance.setApiKey(TransactionalEmailsApiApiKeys.apiKey, process.env.BREVO_API_KEY);

interface EmailParams {
  to: string;
  subject: string;
  htmlContent: string;
  textContent?: string;
}

export async function sendEmail(params: EmailParams): Promise<boolean> {
  try {
    const sendSmtpEmail = new SendSmtpEmail();
    sendSmtpEmail.subject = params.subject;
    sendSmtpEmail.htmlContent = params.htmlContent;
    sendSmtpEmail.textContent = params.textContent;
    sendSmtpEmail.to = [{ email: params.to }];
    sendSmtpEmail.sender = { name: "Delivery Order System", email: "noreply@deliveryorders.com" };

    await apiInstance.sendTransacEmail(sendSmtpEmail);
    return true;
  } catch (error) {
    console.error('Brevo email error:', error);
    return false;
  }
}

export function generatePasswordSetupEmailTemplate(username: string, setupUrl: string): { subject: string; htmlContent: string; textContent: string } {
  const subject = "Set up your password - Delivery Order System";
  
  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <title>Set up your password</title>
        <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background-color: #f4f4f4; padding: 20px; text-align: center; }
            .content { padding: 20px; }
            .button { display: inline-block; padding: 12px 24px; background-color: #007cba; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
            .footer { background-color: #f4f4f4; padding: 15px; text-align: center; font-size: 12px; color: #666; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>Welcome to Delivery Order System</h1>
            </div>
            <div class="content">
                <p>Hello ${username},</p>
                <p>Your account has been created in the Delivery Order Management System. To get started, please set up your password by clicking the button below:</p>
                <p><a href="${setupUrl}" class="button">Set Up Password</a></p>
                <p>If the button doesn't work, you can copy and paste this link into your browser:</p>
                <p>${setupUrl}</p>
                <p>This link will expire in 24 hours for security reasons.</p>
                <p>If you didn't expect this email, please contact your administrator.</p>
            </div>
            <div class="footer">
                <p>Delivery Order Management System</p>
            </div>
        </div>
    </body>
    </html>
  `;

  const textContent = `
    Welcome to Delivery Order System
    
    Hello ${username},
    
    Your account has been created in the Delivery Order Management System. To get started, please set up your password by visiting this link:
    
    ${setupUrl}
    
    This link will expire in 24 hours for security reasons.
    
    If you didn't expect this email, please contact your administrator.
    
    Delivery Order Management System
  `;

  return { subject, htmlContent, textContent };
}

export function generatePasswordResetEmailTemplate(username: string, resetUrl: string): { subject: string; htmlContent: string; textContent: string } {
  const subject = "Reset your password - Delivery Order System";
  
  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <title>Reset your password</title>
        <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background-color: #f4f4f4; padding: 20px; text-align: center; }
            .content { padding: 20px; }
            .button { display: inline-block; padding: 12px 24px; background-color: #007cba; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
            .footer { background-color: #f4f4f4; padding: 15px; text-align: center; font-size: 12px; color: #666; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>Password Reset Request</h1>
            </div>
            <div class="content">
                <p>Hello ${username},</p>
                <p>You requested to reset your password for the Delivery Order Management System. Click the button below to set a new password:</p>
                <p><a href="${resetUrl}" class="button">Reset Password</a></p>
                <p>If the button doesn't work, you can copy and paste this link into your browser:</p>
                <p>${resetUrl}</p>
                <p>This link will expire in 24 hours for security reasons.</p>
                <p>If you didn't request a password reset, please ignore this email.</p>
            </div>
            <div class="footer">
                <p>Delivery Order Management System</p>
            </div>
        </div>
    </body>
    </html>
  `;

  const textContent = `
    Password Reset Request
    
    Hello ${username},
    
    You requested to reset your password for the Delivery Order Management System. Visit this link to set a new password:
    
    ${resetUrl}
    
    This link will expire in 24 hours for security reasons.
    
    If you didn't request a password reset, please ignore this email.
    
    Delivery Order Management System
  `;

  return { subject, htmlContent, textContent };
}