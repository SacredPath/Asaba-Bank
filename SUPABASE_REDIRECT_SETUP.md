# Supabase Redirect URL Configuration

## Important: Password Reset Redirect URLs

To ensure password reset links work correctly in production, you need to configure Supabase's Site URL and Redirect URLs.

### Steps to Configure:

1. **Go to your Supabase Dashboard**
   - Navigate to: Authentication → URL Configuration

2. **Set the Site URL**
   - This should be your production domain (e.g., `https://asaba-bank.vercel.app`)
   - **NOT** `http://localhost:3000`

3. **Add Redirect URLs**
   - Add your production reset password URL: `https://asaba-bank.vercel.app/auth/reset-password`
   - Add your localhost URL for development: `http://localhost:3000/auth/reset-password`
   - Add wildcard if needed: `https://*.vercel.app/auth/reset-password`

4. **Save the configuration**

### Environment Variables

Make sure you have these set in Vercel (or your hosting platform):

```env
NEXT_PUBLIC_SITE_URL=https://asaba-bank.vercel.app
VERCEL_URL=asaba-bank.vercel.app  # Auto-set by Vercel
```

### Why This Matters

Supabase validates redirect URLs against the configured list. If the redirect URL in the email doesn't match what's configured in Supabase, it will:
- Redirect to the Site URL instead
- Or fail with an invalid redirect error

### Testing

After configuring:
1. Request a password reset from production
2. Check the email link - it should point to your production domain
3. Click the link - it should redirect to `/auth/reset-password` on your production site

