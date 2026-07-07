import { Suspense } from "react";
import AuthForm from "@/components/AuthForm";
import RegisterHeader from "@/components/RegisterHeader";

export const metadata = {
  title: "Registar - Fotos Desporto",
  description: "Criar uma nova conta para comprar ou vender fotos de desporto",
};

export default function RegisterPage() {
  return (
    <div>
      <RegisterHeader />
      <Suspense fallback={null}>
        <AuthForm mode="register" />
      </Suspense>
    </div>
  );
}
