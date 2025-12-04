# Sending OTP Emails via Supabase

## ✅ Corrected cURL Command

**Important:** Replace `${SERVICE_ROLE_KEY}` with your actual service role key from `.env.local`

```bash
curl -X POST 'https://jykafoyljnhhemisxwse.supabase.co/auth/v1/otp' \
  -H "apikey: YOUR_SERVICE_ROLE_KEY_HERE" \
  -H "Authorization: Bearer YOUR_SERVICE_ROLE_KEY_HERE" \
  -H "Content-Type: application/json" \
  -d '{"email":"shellymcclenny@gmail.com"}'
```

## 🔒 Security Note

**NEVER expose your service role key in:**
- Public repositories
- Client-side code
- Browser console
- Public documentation

The service role key has admin privileges and should only be used server-side.

## 📝 Methods to Send OTP

### Method 1: Using the Script (Recommended)

```bash
node scripts/send-otp-email.js <email>
```

Example:
```bash
node scripts/send-otp-email.js shellymcclenny@gmail.com
```

### Method 2: Using the API Route

```bash
curl -X POST 'http://localhost:3000/api/send-otp' \
  -H "Content-Type: application/json" \
  -d '{"email":"shellymcclenny@gmail.com"}'
```

### Method 3: Direct cURL (Server-side only)

```bash
curl -X POST 'https://jykafoyljnhhemisxwse.supabase.co/auth/v1/otp' \
  -H "apikey: $(grep SUPABASE_SERVICE_ROLE_KEY .env.local | cut -d '=' -f2)" \
  -H "Authorization: Bearer $(grep SUPABASE_SERVICE_ROLE_KEY .env.local | cut -d '=' -f2)" \
  -H "Content-Type: application/json" \
  -d '{"email":"shellymcclenny@gmail.com"}'
```

## 📧 What Happens

1. Supabase sends an OTP email to the specified address
2. The email contains a magic link or OTP code
3. User clicks the link or enters the code to authenticate
4. User is signed in automatically

## 🔍 Testing

The script `scripts/send-otp-email.js` will:
- ✅ Validate environment variables
- ✅ Send the OTP email
- ✅ Show success/error messages
- ✅ Display response details

## ⚠️ Common Issues

1. **Invalid email format**: Ensure email is properly formatted
2. **Rate limiting**: Supabase may rate limit OTP requests
3. **Email not received**: Check spam folder, verify email address
4. **Service role key missing**: Ensure `.env.local` has `SUPABASE_SERVICE_ROLE_KEY`

