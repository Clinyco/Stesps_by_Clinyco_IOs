export type Step = {
  id: string;                 // UUID estable del paso
  title: string;
  desc?: string;
  href?: string;              // link “Más info”
  note?: string;              // nota del agente por paso (privada)
  status: 'pending' | 'done';
  order: number;
  support_ticket_id?: number; // opcional
  updated_by: string;         // email agente
  updated_at: string;         // ISO
};

export type ChecklistMeta = {
  key: string;                        // p.ej. "client-onboarding-v1"
  status?: 'draft' | 'published';
  support_view_id?: string;           // opcional
  doc_url?: string;                   // opcional (Google Doc)
};
