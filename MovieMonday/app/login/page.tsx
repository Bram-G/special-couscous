"use client";
import { Suspense } from "react";

import AuthForm from "../../components/AuthForm";

// AuthForm reads ?next= / ?mode= with useSearchParams, which Next 14 requires
// to sit inside a Suspense boundary or the production build fails.
export default function AuthPage() {
  return (
    <Suspense fallback={null}>
      <AuthForm />
    </Suspense>
  );
}