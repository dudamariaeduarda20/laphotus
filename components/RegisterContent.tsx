"use client";

import { useSearchParams } from "next/navigation";
import AuthForm from "@/components/AuthForm";
import PhotographerRegistrationForm from "@/components/PhotographerRegistrationForm";

export default function RegisterContent() {
  const searchParams = useSearchParams();
  const type = searchParams.get("type");
  const isPhotographer = type === "fotografo";

  return isPhotographer ? (
    <PhotographerRegistrationForm />
  ) : (
    <AuthForm mode="register" />
  );
}
