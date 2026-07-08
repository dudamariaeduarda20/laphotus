"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/hooks/useAuth";
import { useTranslation } from "@/lib/hooks/useTranslation";
import { UserRole } from "@/lib/types";

type PhotographerType = "iniciante" | "amador" | "semi-profissional" | "profissional";
type PhotographerInterest = "fotografar" | "organizar" | "ambos";

const COUNTRIES = [
  "Portugal", "Espanha", "França", "Itália", "Alemanha", "Bélgica", "Holanda",
  "Áustria", "Suíça", "Suécia", "Noruega", "Dinamarca", "Finlândia", "Polónia",
  "República Checa", "Eslováquia", "Hungria", "Roménia", "Bulgária", "Grécia",
  "Irlanda", "Reino Unido", "Islândia", "Lituânia", "Letônia", "Estônia",
  "Luxemburgo", "Chipre", "Malta", "Croácia", "Eslovênia", "Bósnia e Herzegovina",
  "Sérvia", "Montenegro", "Macedónia", "Albânia", "Brasil", "Argentina", "México",
  "Canadá", "Estados Unidos", "Chile", "Colômbia", "Peru", "Equador", "Uruguai",
  "Paraguai", "Bolívia", "Índia", "Japão", "China", "Austrália", "Nova Zelândia",
  "Tailândia", "Vietnã", "Filipinas", "Indonésia", "Malásia", "Singapura",
  "Hong Kong", "Taiwan", "Coreia do Sul", "Vietnã", "Indonésia", "Paquistão",
  "Bangladexe", "Irão", "Iraque", "Israel", "Arábia Saudita", "Emirados Árabes Unidos",
  "Egito", "África do Sul", "Nigéria", "Gana", "Quénia", "Marrocos", "Argélia",
  "Tunísia", "Líbia", "Etiópia", "Senegal", "Costa do Marfim", "Camarões",
  "Angola", "Moçambique", "Zimbabué", "Namíbia", "Botsuana", "Maurício",
];


export default function PhotographerRegistrationForm() {
  const router = useRouter();
  const { register } = useAuth();
  const { t } = useTranslation();

  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    photographerType: "" as PhotographerType,
    interest: "" as PhotographerInterest,
    country: "",
    password: "",
    confirmPassword: "",
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const validateStep = (currentStep: number): boolean => {
    switch (currentStep) {
      case 1:
        return !!(formData.name && formData.email && formData.phone);
      case 2:
        return !!formData.photographerType;
      case 3:
        return !!formData.interest;
      case 4:
        return !!formData.country;
      case 5:
        return !!(
          formData.password &&
          formData.confirmPassword &&
          formData.password === formData.confirmPassword &&
          formData.password.length >= 6
        );
      default:
        return false;
    }
  };

  const handleNext = () => {
    if (validateStep(step)) {
      setError(null);
      if (step < 5) setStep(step + 1);
    } else {
      setError(t("auth.err.fillRequired") || "Por favor, preencha todos os campos");
    }
  };

  const handlePrev = () => {
    if (step > 1) setStep(step - 1);
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateStep(5)) {
      setError(t("auth.err.fillRequired") || "Por favor, preencha todos os campos");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await register(formData.email, formData.password, formData.name, UserRole.PHOTOGRAPHER);
      router.push("/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : t("auth.err.fail") || "Erro ao registrar");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 w-full">
      {/* Progress bar */}
      <div className="flex gap-2">
        {[1, 2, 3, 4, 5].map((s) => (
          <div
            key={s}
            className={`h-2 flex-1 rounded-full transition ${
              s === step ? "bg-[#09419b]" : s < step ? "bg-[#09419b]" : "bg-gray-300"
            }`}
          />
        ))}
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-800 text-sm">
          {error}
        </div>
      )}

      {/* Step 1: Name, Email, Phone */}
      {step === 1 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900">Informações Pessoais</h3>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t("auth.fullName")}
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Maria Silva"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t("auth.email")}
            </label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="maria@example.com"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Telemóvel
            </label>
            <input
              type="tel"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="+351 91 234 5678"
            />
          </div>
        </div>
      )}

      {/* Step 2: Photographer Type */}
      {step === 2 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900">Tipo de Fotógrafo</h3>
          <select
            name="photographerType"
            value={formData.photographerType}
            onChange={handleChange}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">Selecione seu perfil...</option>
            <option value="profissional">Profissional - Trabalho como fotógrafo(a) profissional</option>
            <option value="semi-profissional">Semi-profissional - Ainda não trabalho exclusivamente com fotografia, mas já tenho experiência consistente</option>
            <option value="amador">Amador(a) - Estou começando, mas já possuo equipamento e alguma prática</option>
            <option value="iniciante">Iniciante - Ainda não tenho experiência e gostaria de começar do zero</option>
          </select>
        </div>
      )}

      {/* Step 3: Interest */}
      {step === 3 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900">Qual é o seu interesse na LAPHOTUS?</h3>
          <select
            name="interest"
            value={formData.interest}
            onChange={handleChange}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">Selecione uma opção...</option>
            <option value="fotografar">Fotografar eventos pela LAPHOTUS - Quero atuar como fotógrafo(a) em eventos desportivos e sociais da plataforma</option>
            <option value="organizar">Criar e gerenciar meus próprios eventos - Quero organizar eventos e gerenciar minha própria operação de fotografia</option>
            <option value="ambos">Ambos - Tenho interesse em fotografar eventos e também criar e gerenciar meus próprios eventos</option>
          </select>
        </div>
      )}

      {/* Step 4: Country */}
      {step === 4 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900">Selecione seu país</h3>
          <select
            name="country"
            value={formData.country}
            onChange={handleChange}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent max-h-60"
          >
            <option value="">Selecione seu país...</option>
            {COUNTRIES.map((country) => (
              <option key={country} value={country}>
                {country}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Step 5: Password */}
      {step === 5 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900">Crie sua senha</h3>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t("auth.password")}
            </label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              minLength={6}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="••••••"
            />
            <p className="text-xs text-gray-500 mt-1">Mínimo 6 caracteres</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Confirme sua senha
            </label>
            <input
              type="password"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              minLength={6}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="••••••"
            />
          </div>
          <div className="flex items-start gap-2">
            <input
              type="checkbox"
              id="terms"
              className="mt-1"
              required
            />
            <label htmlFor="terms" className="text-xs text-gray-600">
              Concordo com os Termos de Uso e Política de Privacidade
            </label>
          </div>
        </div>
      )}

      {/* Navigation buttons */}
      <div className="flex gap-3 pt-4">
        <button
          type="button"
          onClick={handlePrev}
          className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition font-medium"
          style={{ display: step === 1 ? "none" : "block" }}
        >
          Voltar
        </button>
        {step < 5 ? (
          <button
            type="button"
            onClick={handleNext}
            className="flex-1 px-4 py-3 bg-[#09419b] text-white rounded-lg hover:bg-[#09419b] transition font-medium"
          >
            Próximo
          </button>
        ) : (
          <button
            type="submit"
            disabled={loading}
            className="flex-1 px-4 py-3 bg-[#09419b] text-white rounded-lg hover:bg-[#09419b] disabled:opacity-50 transition font-medium"
          >
            {loading ? t("common.loading") : "Criar Conta"}
          </button>
        )}
      </div>

      <div className="text-center text-sm text-gray-600 pt-2">
        Já tem conta?{" "}
        <a href="/auth/login" className="text-[#09419b] hover:underline font-medium">
          Entrar
        </a>
      </div>
    </form>
  );
}
