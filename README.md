# Asaba Bank - Digital Banking Platform

## Admin Access Guide

### How to Access Admin Dashboard

1. **Login to your account** at `/auth/login`
2. **Set up admin role** in your Supabase database:
   ```sql
   -- Run this in your Supabase SQL Editor
   UPDATE profiles 
   SET role = 'admin' 
   WHERE id = 'your-user-id-here';
   ```
3. **Access admin dashboard** at `/admin/dashboard`

### Admin Features Available

- **User Management**: View, edit, ban/unban users
- **Transaction Monitoring**: View all user transactions
- **Recipient Management**: Manage user recipient accounts
- **Audit Logs**: View security and admin activity logs
- **Profile Management**: Update user profiles and balances

### Admin URLs

- **Main Dashboard**: `/admin/dashboard`
- **User Management**: `/admin/users`
- **User Dashboard**: `/dashboard` (switch back to user view)

### Security Notes

- Only users with `role = 'admin'` in the profiles table can access admin features
- All admin actions are logged in the audit_logs table
- Admin access is checked on every page load

## Getting Started

### Prerequisites

- Node.js 18+ 
- Supabase account
- Environment variables configured

### Installation

```bash
npm install
npm run dev
```

### Environment Variables

Create a `.env.local` file with:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

## Features

- **User Authentication**: Secure login with 2FA support
- **Account Management**: Checking and savings accounts
- **Money Transfers**: ACH and wire transfers
- **Recipient Management**: Add and manage external accounts
- **Transaction History**: Complete transaction tracking
- **Admin Dashboard**: Full administrative controls
- **Mobile Responsive**: Works on all devices

## Database Setup

Run the SQL migrations in your Supabase SQL Editor:

1. `20250710_create_accounts.sql`
2. `20250710_create_audit_logs.sql`
3. `20250710_add_account_fields.sql`
4. `20250710_add_2fa_fields.sql`

## Deployment

The app is configured for Vercel deployment with:
- TypeScript compilation
- ESLint disabled during builds
- Supabase functions excluded from build
