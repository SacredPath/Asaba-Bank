Project Guidelines: Types and Vercel/Next.js Conventions
This document outlines the key TypeScript types/interfaces and essential Vercel/Next.js development conventions for the Asaba Bank project. Adhering to these guidelines will ensure consistency, improve maintainability, and prevent common build and runtime errors, especially when using automated tools like Windsurf.

1. Core TypeScript Interfaces
The following interfaces define the structure of key data entities within the application. Ensure these are consistently used across all components and data fetching operations.

Transaction Interface
Used for representing financial transactions.

interface Transaction {
  id: string;
  sender_user_id: string;
  receiver_account_number: string;
  amount: number;
  status: 'completed' | 'pending' | 'failed'; // Specific status types
  created_at: string; // ISO 8601 string
  type: 'deposit' | 'withdrawal' | 'transfer'; // Specific transaction types
  bank_name: string; // Required, default to '' if null/undefined from DB
  routing_number: string; // Required, default to '' if null/undefined from DB
  method: string; // Required, default to '' if null/undefined from DB
  account_number: string; // Required, used for display in TransactionList, often mapped from receiver_account_number
}

UserProfile Interface
Used for representing user profile data stored in the profiles table.

interface UserProfile {
  id: string; // Matches Supabase auth user ID
  full_name: string | null;
  username: string | null;
  avatar_url: string | null;
  bio?: string | null; // Optional
  contact_number?: string | null; // Optional
  // Add other profile fields as per your database schema
}

AuthHookResult Interface (for useAuth hook)
Defines the structure of the object returned by the custom useAuth hook. This explicitly includes loading for consistency.

interface AuthHookResult {
  user: {
    id: string;
    email: string | null;
    // Add other user properties you might use from Supabase auth
  } | null;
  loading: boolean; // Indicates if authentication state is being loaded (was 'isLoading' in some contexts, now standardized to 'loading')
  error: string | null; // Any authentication error message
}

Component-Specific Props Interfaces
Ensure all custom components have explicitly defined props interfaces.

NavbarProps
interface NavbarProps {
  showHome?: boolean; // Optional prop to conditionally show/hide a Home link
}

DepositFormProps
interface DepositFormProps {
  onDepositSuccess: () => void; // Callback to refresh data after a successful deposit
}

WithdrawalFormProps
interface WithdrawalFormProps {
  userId: string; // Required prop: ID of the current user
  onWithdrawSuccess: () => void; // Required prop: Callback to refresh data after a successful withdrawal
}

DepositModalProps
interface DepositModalProps {
  isOpen: boolean; // Controls modal visibility
  onClose: () => void; // Callback to close the modal
  onDeposit: () => Promise<void>; // Callback to trigger deposit logic in parent
  amount: number; // Amount to be confirmed
}

WithdrawModalProps
interface WithdrawModalProps {
  isOpen: boolean; // Controls modal visibility
  onClose: () => void; // Callback to close the modal
  onWithdraw: () => Promise<void>; // Callback to trigger withdrawal logic in parent
  amount: number; // Amount to be confirmed
}

TransactionListProps
interface TransactionListProps {
  transactions: Transaction[]; // Required prop: Array of Transaction objects to display
}

NewRecipientFormProps
interface NewRecipientFormProps {
  userId: string; // Required prop: ID of the current user
  onSuccess: () => void; // Callback after successfully adding a recipient
}

2. Vercel/Next.js Development Conventions
These conventions are crucial for successful builds and deployments on Vercel, especially with Next.js 14 and Supabase.

2.1. 'use client' Directive
Rule: Any React component or custom hook that uses client-side features (e.g., useState, useEffect, browser APIs, useRouter from next/navigation, createBrowserClient from @supabase/ssr) must include 'use client'; at the very top of the file.

Common Error Addressed: Components failing to render or throwing errors because they try to access browser-specific APIs or hooks during server-side rendering.

Example:

// components/MyClientComponent.tsx
'use client';
import { useState, useEffect } from 'react';
// ...

2.2. Supabase Client Initialization
Rule: Use the correct Supabase client creation function based on the component's execution environment.

Client Components ('use client'): Use createBrowserClient from @supabase/ssr.

import { createBrowserClient } from '@supabase/ssr';
const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

Server Components (Default in app directory): Use createServerComponentClient from @supabase/ssr with cookies().

import { createServerComponentClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
export default async function MyServerComponent() {
  const cookieStore = cookies();
  const supabase = createServerComponentClient({ cookies: cookieStore });
  // ...
}

API Routes (app/api/.../route.ts): Use createRouteHandlerClient from @supabase/ssr with cookies().

import { createRouteHandlerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
export async function GET(request: Request) {
  const cookieStore = cookies();
  const supabase = createRouteHandlerClient({ cookies: cookieStore });
  // ...
  return NextResponse.json({ message: 'Success' });
}

Common Errors Addressed:

Type error: Module '"@supabase/ssr"' has no exported member 'createClient'. (Incorrect import from @supabase/ssr).

Cannot find module '@supabase/auth-helpers-react' or Cannot find module '@/lib/supabaseClient'.

Avoid: Do not use @supabase/auth-helpers-react or @supabase/auth-helpers-nextjs for new client/server component integrations in the App Router. These are deprecated in favor of @supabase/ssr.

Remove: Eliminate any custom supabaseClient.ts files that export a global Supabase instance for client-side use, as this can lead to issues with Next.js's rendering model and module resolution.

2.3. Environment Variables
Rule:

Variables intended for use in client-side code (i.e., in files with 'use client') must be prefixed with NEXT_PUBLIC_.

Variables without NEXT_PUBLIC_ are only available on the server-side (e.g., in API routes, getServerSideProps, Server Components).

Common Error Addressed: ReferenceError: process is not defined or undefined Supabase client when deployed.

Vercel Configuration: Ensure all necessary environment variables are added to your Vercel project settings for all relevant environments (Production, Preview, Development).

2.4. next/navigation vs next/router
Rule: For Next.js App Router, always import useRouter from next/navigation.

Common Error Addressed: TypeError: useRouter is not a function or similar issues when using the wrong router import in App Router contexts.

Avoid: Do not use useRouter from next/router in App Router components/pages.

2.5. package.json Structure
Rule:

Ensure all required Supabase packages (@supabase/ssr, @supabase/supabase-js, and if still using Pages Router, @supabase/auth-helpers-nextjs, @supabase/auth-helpers-react) are listed in dependencies.

Crucially, package.json must be valid JSON. This means no comments (// or /* */) within the file.

Use stable or compatible version ranges (e.g., ^0.5.0 for @supabase/auth-helpers-react) to avoid npm error notarget (no matching version found) issues.

Common Errors Addressed:

Error: Can't parse json file ... package.json: Expected double-quoted property name in JSON... (due to comments).

npm error notarget No matching version found for... (due to outdated or non-existent package versions).

"Cannot find module" errors (if dependencies are missing).

Action: After modifying package.json, always run npm install (or yarn install) locally and commit both package.json and the updated lock file (package-lock.json or yarn.lock).

2.6. TypeScript Prop Type Consistency
Rule: Every component that accepts props must have a clearly defined TypeScript interface for those props. The props passed from a parent component must exactly match the types and names defined in the child component's props interface.

Common Errors Addressed:

Type error: Type '{}' is missing the following properties from type 'MyProps': propName

Property 'propName' does not exist on type 'IntrinsicAttributes & MyProps'.

Type 'string | undefined' is not assignable to type 'string'. (when an optional prop is passed to a component expecting a required one, or vice-versa).

Action: When a type error related to props occurs, first check the receiving component's prop interface, then check how the props are being passed from the parent. Ensure nullish coalescing (?? '') or optional chaining (?.) is used when handling potentially null or undefined values from API responses if the target type is non-nullable.

2.7. Avoiding alert() and confirm()
Rule: Do not use browser-blocking functions like alert() or confirm(). They provide a poor user experience and can cause issues in certain environments (like within an iFrame or during server-side rendering).

Solution: Implement custom modal components (like DepositModal, WithdrawModal) or use a toast notification library (react-hot-toast) for user feedback and confirmations.

2.8. key Prop in List Rendering
Rule: When rendering a list of elements using .map() in React, each item must have a unique key prop. This helps React efficiently update the UI and prevents potential runtime errors or warnings.

Example:

{items.map(item => (
  <div key={item.id}> {/* Use a stable, unique ID from your data */}
    {item.name}
  </div>
))}

Avoid: Using array index as key (key={index}) unless the list items are static and their order will never change.

2.9. Absolute Imports Configuration
Rule: If you are using absolute imports (e.g., @/components/Layout), ensure your tsconfig.json (for TypeScript) or jsconfig.json (for JavaScript) is correctly configured with baseUrl and paths.

Common Error Addressed: Cannot find module '@/components/Layout' or similar module resolution errors.

Example (tsconfig.json):

{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["./*"] // This maps @/ to your project root
    }
  }
}

2.10. Consistent Casing for File Paths
Rule: Ensure that the casing of your file names on your file system exactly matches the casing used in your import statements.

Common Error Addressed: Cannot find module '...' errors on Vercel (Linux-based, case-sensitive file system) even if it works locally (Windows/macOS, often case-insensitive).

Action: Double-check all file names and import paths for exact casing.