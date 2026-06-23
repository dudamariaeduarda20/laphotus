import AuthForm from "@/components/AuthForm";

export const metadata = {
  title: "Registar - Fotos Desporto",
  description: "Criar uma nova conta para comprar ou vender fotos de desporto",
};

export default function RegisterPage() {
  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-900 mb-2">Criar Conta</h2>
      <p className="text-gray-600 mb-8">
        Junte-se à nossa comunidade de fotógrafos e entusiastas de fotografia
      </p>
      <AuthForm mode="register" />
    </div>
  );
}
