import { redirect } from 'next/navigation'

/**
 * Root page — redirects to /dashboard.
 * In a production app with auth, this would check the session
 * and redirect to /login if unauthenticated.
 */
export default function RootPage() {
  redirect('/dashboard')
}
