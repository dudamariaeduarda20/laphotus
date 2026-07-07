/**
 * Taxonomia de modalidades/categorias de eventos (molde FOTOP).
 * Usada na home (chips + filtro), no modal de busca avançada e na lista /photos.
 * `value` casa com `Event.sport` no DB.
 */
export interface EventCategory {
  value: string;
  labelKey: string;
  icon: string;
}

export const EVENT_CATEGORIES: EventCategory[] = [
  { value: "Corrida de Rua", labelKey: "category.corridaDeRua", icon: "🏃" },
  { value: "Futebol", labelKey: "category.futebol", icon: "⚽" },
  { value: "Ciclismo", labelKey: "category.ciclismo", icon: "🚴" },
  { value: "Triathlon", labelKey: "category.triathlon", icon: "🏊" },
  { value: "Crossfit", labelKey: "category.crossfit", icon: "🏋️" },
  { value: "Beach Tennis", labelKey: "category.beachTennis", icon: "🎾" },
  { value: "Padel", labelKey: "category.padel", icon: "🎾" },
  { value: "Natação", labelKey: "category.natacao", icon: "🏊" },
  { value: "Atletismo", labelKey: "category.atletismo", icon: "🏅" },
  { value: "Vôlei", labelKey: "category.voleibol", icon: "🏐" },
  { value: "Basquete", labelKey: "category.basquetebol", icon: "🏀" },
  { value: "Shows/Festival", labelKey: "category.shows", icon: "🎤" },
  { value: "Formatura", labelKey: "category.formatura", icon: "🎓" },
  { value: "Escolar", labelKey: "category.escolar", icon: "🏫" },
  { value: "Social", labelKey: "category.social", icon: "🥂" },
];
