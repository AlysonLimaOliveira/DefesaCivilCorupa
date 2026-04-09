export type IncidentCategory = "Hidrológica" | "Geológica" | "Meteorológica" | "Climatológica" | "Estrutural" | "Incêndio" | "Tecnológica" | "Risco Potencial";
export type IncidentStatus = "Pendente" | "Em Atendimento" | "Resolvido";

export interface Location {
  lat: number;
  lng: number;
}

export interface Incident {
  id: string;
  category: IncidentCategory;
  type: string; // Subcategory
  status: IncidentStatus;
  description: string;
  location: Location;
  address?: string;
  city?: string;
  reporterName?: string;
  reporterPhone?: string;
  reporterCPF?: string;
  photos?: string[]; // URLs or base64
  reporterUid?: string; // UID of the user who reported
  createdAt: any; // Firestore Timestamp
  updatedAt?: any; // Firestore Timestamp
}

export interface UserProfile {
  uid: string;
  email: string;
  displayName?: string;
  role: "admin" | "operator";
}

export interface Stats {
  total: number;
  pending: number;
  inProgress: number;
  resolved: number;
  byType: Record<IncidentCategory, number>;
}
