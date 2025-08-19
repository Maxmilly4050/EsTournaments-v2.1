# Email Verification Setup Guide

## The Issue
Verification emails are not being sent because Supabase requires an email provider (SMTP) to be configured in the dashboard.

## Required Setup Steps

### 1. Configure Email Provider in Supabase Dashboard

1. **Open your Supabase Dashboard**
   - Go to [app.supabase.com](https://app.supabase.com)
   - Select your project: `viefhctoekpdeyniubwi`

2. **Navigate to Authentication Settings**
   - Click on "Authentication" in the left sidebar
   - Click on "Settings" tab
   - Scroll down to "SMTP Settings"

3. **Configure SMTP Provider**
   Choose one of these options:

   **Option A: Use Gmail SMTP (Recommended for testing)**
   - SMTP Host: `smtp.gmail.com`
   - SMTP Port: `587`
   - SMTP User: `your-gmail@gmail.com`
   - SMTP Pass: `your-app-password` (not your regular password)
   - Sender Name: `EsTournaments`
   - Sender Email: `your-gmail@gmail.com`

   **Option B: Use SendGrid**
   - SMTP Host: `smtp.sendgrid.net`
   - SMTP Port: `587`
   - SMTP User: `apikey`
   - SMTP Pass: `your-sendgrid-api-key`
   - Sender Name: `EsTournaments`
   - Sender Email: `your-verified-sendgrid-email`

   **Option C: Use Mailgun**
   - SMTP Host: `smtp.mailgun.org`
   - SMTP Port: `587`
   - SMTP User: `your-mailgun-smtp-user`
   - SMTP Pass: `your-mailgun-smtp-password`
   - Sender Name: `EsTournaments`
   - Sender Email: `your-verified-mailgun-email`

4. **Enable Email Confirmation**
   - In the same Authentication Settings page
   - Find "Email confirmation" section
   - Toggle ON "Enable email confirmations"
   - Set "Confirmation redirect URL" to: `http://localhost:3000/auth/callback`

5. **Save Settings**
   - Click "Save" at the bottom of the page
   - Wait for the settings to be applied (may take a few minutes)

### 2. Test Email Configuration

After configuring SMTP, test the email functionality:

1. **Sign up a new user**
   - Go to your app: `http://localhost:3000`
   - Create a new account with a real email address
   - Check if you receive the confirmation email

2. **Test verification resend**
   - Log in to your app
   - Go to profile page
   - Click "Verify Email" if not already verified
   - Check your email for the verification message

### 3. Production Setup

For production, you should:
- Use a professional email service (SendGrid, Mailgun, Amazon SES)
- Set up a custom domain for your sender email
- Configure proper SPF/DKIM records for email deliverability
- Update `NEXT_PUBLIC_SITE_URL` to your production domain

## Troubleshooting

**If emails still don't arrive:**
1. Check your spam/junk folder
2. Verify SMTP credentials are correct
3. Ensure sender email is verified with your provider
4. Check Supabase logs for email errors
5. Try with a different email provider

**Common Issues:**
- Gmail requires app passwords (not regular password)
- SendGrid requires sender verification
- Some email providers require domain verification
- Rate limits may prevent immediate email sending

## Security Notes

- Never commit SMTP credentials to your repository
- Use environment variables for sensitive email settings
- Consider using app-specific passwords for Gmail
- Regularly rotate SMTP credentials for security
