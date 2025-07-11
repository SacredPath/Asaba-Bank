# Asaba Bank Admin System Guide

## 🚀 How to Access Admin Pages

### 1. **Admin Dashboard** (`/admin/dashboard`)
- **URL**: `https://your-domain.vercel.app/admin/dashboard`
- **Access**: Only users with `admin` role in their profile
- **Features**: 
  - View all users, profiles, transactions, and recipients
  - Search and filter data
  - Edit user profiles and balances
  - Delete transactions and recipients
  - Ban/unban users

### 2. **User Management** (`/admin/users`)
- **URL**: `https://your-domain.vercel.app/admin/users`
- **Access**: Only admin users
- **Features**:
  - Create new user accounts
  - Ban/unban existing users
  - Delete user accounts
  - Search users by email, name, or ID

## 🔐 Setting Up Admin Access

### Step 1: Create an Admin User
1. Go to `/admin/users` (you'll need to manually set admin role in database first)
2. Click "Create User"
3. Fill in the form:
   - Email: admin@asababank.com
   - Password: (strong password)
   - Full Name: Admin User
   - Role: admin

### Step 2: Set Admin Role in Database
```sql
-- Run this in your Supabase SQL editor
UPDATE profiles 
SET role = 'admin' 
WHERE email = 'admin@asababank.com';
```

### Step 3: Verify Access
1. Log in with admin credentials
2. Navigate to `/admin/dashboard`
3. You should see the admin interface

## 📊 Admin Dashboard Features

### **Users Tab**
- View all registered users
- See user creation dates and last sign-in
- Ban/unban users
- Delete user accounts
- Search by email, name, or user ID

### **Profiles Tab**
- View user profile information
- Edit user details (name, email, phone)
- Update account balances
- Modify withdrawal counts
- Search profiles

### **Transactions Tab**
- View all transaction history
- See transaction amounts, types, and dates
- Delete transactions (for corrections)
- Filter by transaction type

### **Recipients Tab**
- View user recipient lists
- See bank account information (masked)
- Delete recipients
- Search by nickname or user

## 🛡️ Security Features

### **Authentication & Authorization**
- ✅ Role-based access control
- ✅ Admin-only routes protection
- ✅ Session validation
- ✅ Secure logout

### **Audit Logging**
- ✅ All admin actions logged
- ✅ User creation/deletion tracking
- ✅ Profile modifications recorded
- ✅ Transaction deletions tracked

### **Data Protection**
- ✅ SSN and sensitive data encrypted
- ✅ Secure password handling
- ✅ Input validation and sanitization
- ✅ SQL injection prevention

## 🔧 Admin Actions Guide

### **Creating Users**
1. Go to `/admin/users`
2. Click "Create User"
3. Fill in required fields:
   - Email (required)
   - Password (min 8 characters)
   - Full Name
   - Role (user/admin)
4. Click "Create User"

### **Managing User Status**
1. Find user in the users table
2. Click "Ban" to restrict access
3. Click "Unban" to restore access
4. Click "Delete" to permanently remove

### **Editing Profiles**
1. Go to `/admin/dashboard`
2. Click "Profiles" tab
3. Find user profile
4. Click "Edit"
5. Modify fields:
   - Full Name
   - Email
   - Phone
   - Checking Balance
   - Savings Balance
6. Click "Save Changes"

### **Managing Transactions**
1. Go to `/admin/dashboard`
2. Click "Transactions" tab
3. View transaction history
4. Click "Delete" to remove incorrect transactions

### **Managing Recipients**
1. Go to `/admin/dashboard`
2. Click "Recipients" tab
3. View user recipient lists
4. Click "Delete" to remove recipients

## 📱 Mobile Responsive

The admin interface is fully responsive and works on:
- ✅ Desktop computers
- ✅ Tablets
- ✅ Mobile phones
- ✅ All screen sizes

## 🚨 Important Notes

### **Security Best Practices**
1. **Never share admin credentials**
2. **Use strong passwords**
3. **Log out after admin sessions**
4. **Monitor audit logs regularly**
5. **Backup important data**

### **Data Management**
1. **Be careful with deletions** - they're permanent
2. **Verify changes before saving**
3. **Use search to find specific users**
4. **Check audit logs for suspicious activity**

### **Troubleshooting**
- **Can't access admin pages?** Check your user role in database
- **Actions not working?** Check browser console for errors
- **Data not loading?** Verify Supabase connection
- **Login issues?** Clear browser cache and cookies

## 🔄 Regular Maintenance

### **Daily Tasks**
- Check for new user registrations
- Monitor transaction activity
- Review audit logs

### **Weekly Tasks**
- Review banned users
- Check for suspicious activity
- Update admin passwords

### **Monthly Tasks**
- Review user growth
- Analyze transaction patterns
- Update security settings

## 📞 Support

If you need help with the admin system:
1. Check this guide first
2. Review audit logs for errors
3. Contact system administrator
4. Check Supabase dashboard for issues

---

**Remember**: The admin system has full access to all user data. Use it responsibly and always follow security best practices. 