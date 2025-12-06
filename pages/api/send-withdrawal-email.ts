import type { NextApiRequest, NextApiResponse } from 'next';
import nodemailer from 'nodemailer';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { 
    accountOwnerEmail, 
    recipientEmail, 
    amount, 
    accountType, 
    transferType, 
    recipientName,
    accountOwnerName,
    description 
  } = req.body;

  if (!accountOwnerEmail) {
    return res.status(400).json({ error: 'Account owner email is required' });
  }

  try {
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT) || 587,
      secure: Number(process.env.SMTP_PORT) === 465,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    const formattedAmount = `$${parseFloat(amount).toFixed(2)}`;
    const accountTypeDisplay = accountType === 'checking' ? 'Life Green Checking' : 'BigTree Savings';
    const transferTypeDisplay = transferType?.toUpperCase() || 'ACH';

    // Email to account owner
    const ownerEmailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9fafb;">
        <div style="background-color: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
          <h1 style="color: #ef4444; margin-top: 0;">💸 Withdrawal Notification</h1>
          <p>Hello ${accountOwnerName || 'Valued Customer'},</p>
          <p>This email confirms that a withdrawal has been processed from your account:</p>
          <div style="background-color: #fef2f2; border-left: 4px solid #ef4444; padding: 15px; margin: 20px 0;">
            <p style="margin: 0;"><strong>Amount:</strong> ${formattedAmount}</p>
            <p style="margin: 5px 0;"><strong>From Account:</strong> ${accountTypeDisplay}</p>
            <p style="margin: 5px 0;"><strong>Transfer Method:</strong> ${transferTypeDisplay}</p>
            <p style="margin: 5px 0;"><strong>Recipient:</strong> ${recipientName || 'N/A'}</p>
            ${description ? `<p style="margin: 5px 0;"><strong>Description:</strong> ${description}</p>` : ''}
          </div>
          <p>The funds have been debited from your account and will be transferred to the recipient's account within 1-2 business days.</p>
          <p style="color: #6b7280; font-size: 14px; margin-top: 30px;">
            If you did not initiate this withdrawal, please contact our support team immediately at 
            <a href="mailto:support@asababank.com" style="color: #4f46e5;">support@asababank.com</a> or call 1-800-ASABA-BANK.
          </p>
          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
          <p style="color: #6b7280; font-size: 12px; margin: 0;">
            This is an automated notification from Asaba Bank. Please do not reply to this email.
          </p>
        </div>
      </div>
    `;

    // Send email to account owner
    await transporter.sendMail({
      from: process.env.SMTP_FROM || `"Asaba Bank" <${process.env.SMTP_USER}>`,
      to: accountOwnerEmail,
      subject: `Withdrawal Notification - ${formattedAmount}`,
      html: ownerEmailHtml,
    });

    // Email to recipient (if email is provided)
    if (recipientEmail) {
      const recipientEmailHtml = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9fafb;">
          <div style="background-color: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
            <h1 style="color: #4f46e5; margin-top: 0;">💰 Incoming Transfer Notification</h1>
            <p>Hello ${recipientName || 'Valued Customer'},</p>
            <p>You are receiving this notification because a transfer has been initiated to your account:</p>
            <div style="background-color: #eff6ff; border-left: 4px solid #4f46e5; padding: 15px; margin: 20px 0;">
              <p style="margin: 0;"><strong>Amount:</strong> ${formattedAmount}</p>
              <p style="margin: 5px 0;"><strong>Transfer Method:</strong> ${transferTypeDisplay}</p>
              <p style="margin: 5px 0;"><strong>From:</strong> ${accountOwnerName || 'Asaba Bank Customer'}</p>
              ${description ? `<p style="margin: 5px 0;"><strong>Description:</strong> ${description}</p>` : ''}
            </div>
            <p>The funds will be deposited into your account within 1-2 business days.</p>
            <p style="color: #6b7280; font-size: 14px; margin-top: 30px;">
              If you have any questions, please contact your bank or 
              <a href="mailto:support@asababank.com" style="color: #4f46e5;">support@asababank.com</a>.
            </p>
            <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
            <p style="color: #6b7280; font-size: 12px; margin: 0;">
              This is an automated notification from Asaba Bank. Please do not reply to this email.
            </p>
          </div>
        </div>
      `;

      await transporter.sendMail({
        from: process.env.SMTP_FROM || `"Asaba Bank" <${process.env.SMTP_USER}>`,
        to: recipientEmail,
        subject: `Incoming Transfer - ${formattedAmount}`,
        html: recipientEmailHtml,
      });
    }

    return res.status(200).json({ 
      success: true, 
      message: 'Withdrawal emails sent successfully',
      sentToOwner: true,
      sentToRecipient: !!recipientEmail
    });
  } catch (error: any) {
    console.error('Error sending withdrawal emails:', error);
    return res.status(500).json({ 
      error: 'Failed to send withdrawal emails',
      message: error.message 
    });
  }
}

