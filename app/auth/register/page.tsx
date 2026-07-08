import { Suspense } from "react";
import RegisterHeader from "@/components/RegisterHeader";
import RegisterContent from "@/components/RegisterContent";

export const metadata = {
  title: "Registar - Fotos Desporto",
  description: "Criar uma nova conta para comprar ou vender fotos de desporto",
};

export default function RegisterPage() {
  return (
    <div>
      <RegisterHeader />
      <Suspense fallback={null}>
        <RegisterContent />
      </Suspense>
    </div>
  );
}
