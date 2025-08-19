# How to Make a User an Admin

This guide explains how to grant admin privileges to users in the EsTournaments application.

## Overview

The application supports **two methods** for making users admins:

1. **By User ID** - Add the user's Supabase UUID to the environment variable
2. **By Email Domain** - Use an email address ending with `@admin.com`

## Method 1: Add User ID to Environment Variable

### Step 1: Find the User's Supabase ID

1. Go to your Supabase Dashboard: https://supabase.com/dashboard
2. Navigate to your project
3. Go to **Authentication** > **Users**
4. Find the user you want to make an admin
5. Copy their **User UID** (it looks like: `12345678-1234-1234-1234-123456789abc`)

### Step 2: Update the Environment Variable

1. Open the `.env.local` file in your project root
2. Find the line: `NEXT_PUBLIC_ADMIN_USER_IDS=""`
3. Add the user ID(s) inside the quotes:

**Single admin:**
```
NEXT_PUBLIC_ADMIN_USER_IDS="12345678-1234-1234-1234-123456789abc"
```

**Multiple admins (comma-separated):**
```
NEXT_PUBLIC_ADMIN_USER_IDS="12345678-1234-1234-1234-123456789abc,87654321-4321-4321-4321-cba987654321"
```

### Step 3: Restart the Application

After updating the environment variable, restart your Next.js development server:

```bash
npm run dev
# or
pnpm dev
# or
yarn dev
```

## Method 2: Use Admin Email Domain

### Option A: Create New Account with Admin Email

1. Have the user sign up with an email ending in `@admin.com`
2. Examples: `john@admin.com`, `admin@admin.com`, `manager@admin.com`
3. The user will automatically have admin privileges

### Option B: Change Existing User's Email

1. Go to Supabase Dashboard > Authentication > Users
2. Find the user and click on them
3. Update their email to end with `@admin.com`
4. The user will need to verify the new email address

## Verification

After making a user an admin, they should:

1. **See the Admin button** in the header navigation
2. **See "Admin Dashboard" in the user dropdown menu**
3. **Be able to access `/admin` routes** without being redirected
4. **Have access to admin-only features** like:
   - Tournament management
   - User management
   - Dispute resolution
   - Match result management

## Testing Admin Access

1. Sign in as the newly created admin user
2. Check if the red "Admin" button appears in the header
3. Click the user profile dropdown - "Admin Dashboard" should be visible
4. Navigate to `/admin` - you should see the admin dashboard
5. Non-admin users should be redirected to the home page when accessing `/admin`

## Security Notes

- **Environment Variable Method**: More secure as IDs are not visible to users
- **Email Domain Method**: Easier to manage but requires specific email addresses
- **No Development Mode**: The system no longer grants admin access to all users in development mode
- **Route Protection**: All `/admin/*` routes are protected by middleware

## Troubleshooting

### Admin Button Not Showing
1. Verify the user ID is correctly added to `NEXT_PUBLIC_ADMIN_USER_IDS`
2. Ensure there are no extra spaces or formatting issues
3. Restart the development server after environment changes
4. Check browser console for any authentication errors

### Access Denied to Admin Routes
1. Confirm the user is properly authenticated
2. Verify the email ends with `@admin.com` or ID is in the environment variable
3. Check that middleware is not blocking the request
4. Clear browser cookies and sign in again

### Multiple Admins Not Working
1. Ensure user IDs are separated by commas with no spaces
2. Each ID should be a valid Supabase UUID
3. Example: `"id1,id2,id3"` not `"id1, id2, id3"`

## Example Configuration

Here's an example of a properly configured `.env.local` file:

```env
# Other environment variables...
NEXT_PUBLIC_SUPABASE_URL="https://your-project.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="your-anon-key"

# Admin user configuration
NEXT_PUBLIC_ADMIN_USER_IDS="a1b2c3d4-e5f6-7890-abcd-ef1234567890,f9e8d7c6-b5a4-3210-9876-543210fedcba"
```

This configuration makes two users admins by their Supabase UUIDs, plus any user with an email ending in `@admin.com`.
