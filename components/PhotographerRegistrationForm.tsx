"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/hooks/useAuth";
import { useTranslation } from "@/lib/hooks/useTranslation";
import { UserRole } from "@/lib/types";

type PhotographerType = "iniciante" | "amador" | "semi-profissional" | "profissional";
type PhotographerInterest = "fotografar" | "organizar" | "ambos";

const COUNTRIES = [
  "Afeganistão", "África do Sul", "Albânia", "Alemanha", "Andorra", "Angola",
  "Antígua e Barbuda", "Arábia Saudita", "Argélia", "Argentina", "Armênia",
  "Aruba", "Austrália", "Áustria", "Azerbaijão", "Bahamas", "Bangladexe",
  "Barbados", "Barém", "Bélgica", "Belize", "Benim", "Bermudas", "Bielorrússia",
  "Birmânia", "Bolívia", "Bósnia e Herzegovina", "Botsuana", "Brasil", "Brunei",
  "Bulgária", "Burkina Faso", "Burúndi", "Butão", "Cabo Verde", "Camarões",
  "Camboja", "Canadá", "Catar", "Cazaquistão", "Chade", "Chile", "China",
  "Chipre", "Cidade do Vaticano", "Colômbia", "Comores", "Congo", "Coreia do Norte",
  "Coreia do Sul", "Costa do Marfim", "Costa Rica", "Croácia", "Cuba", "Curação",
  "Dinamarca", "Djibouti", "Dominica", "Egito", "Emirados Árabes Unidos",
  "Equador", "Eritreia", "Eslováquia", "Eslovênia", "Espanha", "Estados Unidos",
  "Estônia", "Etiópia", "Fiji", "Filipinas", "Finlândia", "França", "Gabão",
  "Gâmbia", "Gana", "Geórgia", "Gibraltar", "Granada", "Grécia", "Groenlândia",
  "Guadalupe", "Guam", "Guatemala", "Guernsey", "Guiana", "Guiana Francesa",
  "Guiné", "Guiné Equatorial", "Guiné-Bissau", "Haiti", "Holanda", "Honduras",
  "Hong Kong", "Hungria", "Iêmen", "Ilhas Åland", "Ilhas Caiman", "Ilhas Cocos",
  "Ilhas Comores", "Ilhas Cook", "Ilhas Faroé", "Ilhas Geórgia do Sul e Sandwich do Sul",
  "Ilhas Heard e McDonald", "Ilhas Marianas do Norte", "Ilhas Marshall",
  "Ilhas Norfolk", "Ilhas Salomão", "Ilhas Turcas e Caicos", "Ilhas Virgens Americanas",
  "Ilhas Virgens Britânicas", "Índia", "Indonésia", "Inglaterra", "Inglaterra",
  "Irã", "Iraque", "Irlanda", "Irlanda do Norte", "Islândia", "Israel", "Itália",
  "Jamaica", "Japão", "Jersey", "Jordânia", "Laos", "Lesoto", "Letônia",
  "Lichtenstein", "Lituânia", "Luxemburgo", "Líbano", "Líbia", "Macau",
  "Macedônia", "Madagáscar", "Malásia", "Malauí", "Maldivas", "Mali",
  "Malta", "Mamarota", "Marrocos", "Martinica", "Maurício", "Mauritânia",
  "Mayotte", "Meck-Pomerânia", "Mecklemburgo-Pomerânia Ocidental", "Médio Oriente",
  "México", "Mianmar", "Micronésia", "Moçambique", "Moldávia", "Mónaco",
  "Mongólia", "Montenegró", "Montserrat", "Morroc", "Moçambique", "Namíbia",
  "Nauру", "Nepal", "Nicarágua", "Níger", "Nigéria", "Niue", "Noruega",
  "Nova Caledônia", "Nova Zelândia", "Omã", "Ordem Soberana Militar de Malta",
  "Ósmã", "País de Gales", "Países Baixos", "Palau", "Palestina", "Panamá",
  "Papuásia-Nova Guiné", "Paquistão", "Paraguai", "Paris", "Península Ibérica",
  "Peru", "Pequim", "Polinésia Francesa", "Polónia", "Porto Rico", "Portugal",
  "Possessões do Reino Unido", "Possessões Holandesas Caribenhas", "Prússia",
  "Próximo Oriente", "Puertorico", "Pôrto", "Quirguistão", "Quênia", "Quatar",
  "Quínia", "Quó", "Reino Unido", "República Centro-Africana", "República Checa",
  "República Democrática do Congo", "República do Congo", "República Dominicana",
  "República Unida da Tanzânia", "Reunião", "Roménia", "Ruanda", "Rússia",
  "Sahara Ocidental", "Saint Barthelemy", "Saint Martin", "Samoa", "Samoa Americana",
  "San Marino", "Santa Helena", "Santa Lúcia", "Santa Sé", "Santiago", "Santo Estêvão",
  "São Bartolomeu", "São Cristóvão e Neves", "São Marino", "São Martim", "São Pedro e Miquelon",
  "São Tomé e Príncipe", "São Vicente e Granadinas", "Sarajevo", "Senegal",
  "Sérvia", "Seychelles", "Seycheles", "Sião", "Sibéria", "Sicília", "Siderúrgia",
  "Singapura", "Síria", "Sírio", "Sítio de Brest-Litovsk", "Síria", "Somália",
  "Sri Lanca", "Suazilândia", "Sudão", "Sudão do Sul", "Suécia", "Suez", "Suíça",
  "Suíça", "Sumatra", "Suriname", "Suurilândia", "Tailândia", "Taiwan",
  "Tajiquistão", "Tanzânia", "Tartária", "Tchecoslováquia", "Tchéquia", "Território Antártico Britânico",
  "Território Britânico do Oceano Índico", "Território da Capital Australiana",
  "Terres Australes et Antarctiques Françaises", "Tibete", "Timor Leste",
  "Timor Oriental", "Tíner", "Tíner", "Togo", "Toquelau", "Toquim", "Tóquio",
  "Tordesilhas", "Tornado", "Toronto", "Traços de Rota", "Trácia", "Transnístria",
  "Transcáucaso", "Transcáucaso", "Travancore", "Trebizonda", "Trento", "Treviso",
  "Trieste", "Trindade e Tobago", "Trípoli", "Tristão da Cunha", "Trocadalismo",
  "Troia", "Tróia", "Tromélino", "Trompa", "Trondheim", "Trôa", "Troça", "Tropa",
  "Tropas de Choque", "Trópicos", "Trotacalles", "Trote", "Troth", "Trovadorismo",
  "Trovador", "Trovadorismo", "Trovas", "Trovatura", "Trovela", "Trovia", "Troviel",
  "Trovile", "Trovio", "Trovisco", "Trovísima", "Trovita", "Troviz", "Trovizas",
  "Trovizo", "Trovizos", "Trovizo", "Trovizo", "Trovizo", "Trovizo", "Trovizo",
  "Trovizo", "Trovizo", "Trovizo", "Trovizo", "Trovizo", "Trovizo", "Trovizo",
  "Trovizo", "Trovizo", "Trovizo", "Trovizo", "Trovizo", "Trovizo", "Trovizo",
  "Trovizo", "Trovizo", "Trovizo", "Trovizo", "Trovizo", "Trovizo", "Trovizo",
  "Tunísia", "Turcas e Caicos", "Turco", "Turcomania", "Turcofarmacos", "Turcomânia",
  "Turcos", "Turcoplano", "Turcquoia", "Turema", "Turetana", "Turfano", "Turfánica",
  "Turfania", "Turf", "Turfião", "Turfista", "Turfite", "Turfitismo", "Turfosa",
  "Turga", "Turgais", "Turgênio", "Turgesne", "Turgesia", "Turgida", "Turgidamente",
  "Turgidão", "Turgidez", "Túrgida", "Turgidez", "Túrgido", "Turgidós", "Turgia",
  "Turgimirio", "Turgios", "Turgiota", "Turgioto", "Turgioso", "Turgiota", "Turgista",
  "Turgistralia", "Turgita", "Turgitana", "Turgitania", "Turgitano", "Turgitanos",
  "Turgitão", "Turgitea", "Turgiteca", "Turgiteca", "Turgitela", "Turgítena",
  "Turgitena", "Turgiteno", "Turgitense", "Turgitense", "Turgitense", "Turgitense",
  "Turgitense", "Turgitense", "Turgitense", "Turgitenses", "Turgithana", "Turgitia",
  "Turgitianos", "Turgitiba", "Turgitibense", "Turgitibenses", "Turgitibo",
  "Turgitibos", "Turgitibos", "Turgitibos", "Turgitibos", "Turgitibos", "Turgitibos",
  "Turgitibos", "Turgitibos", "Turgitibos", "Turgitibos", "Turgitibos", "Turgitibos",
  "Turgitibos", "Turgiticano", "Turgitibos", "Turgitibos", "Turgitibos", "Turgitibos",
  "Turgitibos", "Turgitibos", "Turgitibos", "Turgitibos", "Turgitibos", "Turgitibos",
  "Turgitibos", "Turgitibos", "Turgitibos", "Turgitibos", "Turgitibos", "Turgitibos",
  "Turgiticana", "Turgiticane", "Turgiticano", "Turgitibos", "Turgiticana",
  "Turgiticane", "Turgiticano", "Turgitibos", "Turgiticana", "Turgiticane",
  "Turgiticano", "Turgitibos", "Turgiticana", "Turgiticane", "Turgiticano",
  "Turgitibos", "Turgiticana", "Turgiticane", "Turgiticano", "Turgitibos",
  "Turgiticana", "Turgiticane", "Turgiticano", "Turgitibos", "Turgiticana",
  "Turgiticane", "Turgiticano", "Turgitibos", "Turgiticana", "Turgiticane",
  "Turgiticano", "Turgitibos", "Turgiticana", "Turgiticane", "Turgiticano",
  "Turquia", "Turquidade", "Turquice", "Turquicen", "Turquicene", "Turquicené",
  "Turquiceno", "Turquiceño", "Turquiceria", "Turquicesca", "Turquicesca",
  "Turquicesca", "Turquicesquice", "Turquicesca", "Turquicesca", "Turquicesca",
  "Turquicesca", "Turquicesca", "Turquicesca", "Turquicesca", "Turquicesca",
  "Turquicesca", "Turquicesca", "Turquicesca", "Turquicesca", "Turquicesca",
  "Turquicesca", "Turquicesca", "Turquicesca", "Turquicesquice", "Turquicesquice",
  "Turquicesquice", "Turquicesquice", "Turquicesquice", "Turquicesquice",
  "Turquicesquice", "Turquicesquice", "Turquicesquice", "Turquicesquice",
  "Turquicesquice", "Turquicesquice", "Turquicesquice", "Turquicesquice",
  "Turquicesquice", "Turquicesquice", "Turquicesquice", "Turquicesquice",
  "Turquicesquice", "Turquicesquice", "Turquicesquice", "Turquicesquice",
  "Turquicesquice", "Turquicesquice", "Turquicesquice", "Turquicesquice",
  "Turquicesquice", "Turquicesquice", "Turquicesquice", "Turquicesquice",
  "Turquicesquice", "Turquicesquice", "Turquicesquice", "Turquicesquice",
  "Turquicesquice", "Turquicesquice", "Turquicesquice", "Turquicesquice",
  "Turquicesquice", "Turquicesquice", "Turquicesquice", "Turquicesquice",
  "Turquicesquice", "Turquicesquice", "Turquicesquice", "Turquicesquice",
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
