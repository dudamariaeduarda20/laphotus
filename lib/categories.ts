/**
 * Taxonomia de modalidades/categorias de eventos (molde FOTOP).
 * Usada na home (chips + filtro), no modal de busca avançada e na lista /photos.
 * `value` casa com `Event.sport` no DB.
 */
export interface EventCategory {
  value: string;
  label: string;
  icon: string;
}

export const EVENT_CATEGORIES: EventCategory[] = [
  { value: "Corrida de Rua", label: "Corrida de Rua", icon: "🏃" },
  { value: "Futebol", label: "Futebol", icon: "⚽" },
  { value: "Ciclismo", label: "Ciclismo", icon: "🚴" },
  { value: "Triathlon", label: "Triathlon", icon: "🏊" },
  { value: "Crossfit", label: "Crossfit", icon: "🏋️" },
  { value: "Beach Tennis", label: "Beach Tennis", icon: "🎾" },
  { value: "Padel", label: "Padel", icon: "🎾" },
  { value: "Natação", label: "Natação", icon: "🏊" },
  { value: "Atletismo", label: "Atletismo", icon: "🏅" },
  { value: "Vôlei", label: "Voleibol", icon: "🏐" },
  { value: "Basquete", label: "Basquetebol", icon: "🏀" },
  { value: "Shows/Festival", label: "Shows & Festivais", icon: "🎤" },
  { value: "Formatura", label: "Formatura", icon: "🎓" },
  { value: "Escolar", label: "Escolar", icon: "🏫" },
  { value: "Social", label: "Social", icon: "🥂" },
];
