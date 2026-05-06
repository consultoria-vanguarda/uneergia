import { supabase } from "@/lib/supabaseClient";

const entityToTable = {
  Usina: "usina",
  Contato: "contato",
  Lead: "lead",
  Oportunidade: "oportunidade",
  UnidadeConsumidora: "unidade_consumidora",
  Proposta: "proposta",
  Contrato: "contrato",
  Boleto: "boleto",
  Transacao: "transacao",
  Atividade: "atividade",
  DocusignEnvelope: "docusign_envelope",
  IntegrationLog: "integration_log",
  UserPermission: "user_permission",
  FollowUpWorkflow: "follow_up_workflow",
  FollowUpTemplate: "follow_up_template",
  FollowUpTask: "follow_up_task",
  Cliente: "contato",
  User: "user_permission"
};

const applySort = (query, sort) => {
  if (!sort || typeof sort !== "string") return query;
  const isDesc = sort.startsWith("-");
  const column = isDesc ? sort.slice(1) : sort;
  if (!column) return query;
  return query.order(column, { ascending: !isDesc, nullsFirst: false });
};

const normalizeUser = (authUser) => {
  if (!authUser) return null;
  const role = authUser.user_metadata?.role || "user";
  return {
    id: authUser.id,
    email: authUser.email,
    role,
    full_name: authUser.user_metadata?.full_name || authUser.user_metadata?.name || authUser.email
  };
};

const isMissingSessionError = (error) =>
  error?.name === "AuthSessionMissingError" || error?.message?.toLowerCase?.().includes("auth session missing");

const createEntityClient = (entityName) => {
  const table = entityToTable[entityName] ?? entityName.toLowerCase();
  return {
    async list(sort, limit = 1000) {
      let query = supabase.from(table).select("*");
      query = applySort(query, sort).limit(limit);
      const { data, error } = await query;
      if (error) throw error;
      return data ?? [];
    },
    async filter(filters = {}, sort, limit = 1000) {
      let query = supabase.from(table).select("*");
      Object.entries(filters || {}).forEach(([key, value]) => {
        query = query.eq(key, value);
      });
      query = applySort(query, sort).limit(limit);
      const { data, error } = await query;
      if (error) throw error;
      return data ?? [];
    },
    async get(id) {
      const { data, error } = await supabase.from(table).select("*").eq("id", id).single();
      if (error) throw error;
      return data;
    },
    async create(payload) {
      const { data, error } = await supabase.from(table).insert(payload).select("*").single();
      if (error) throw error;
      return data;
    },
    async update(id, payload) {
      const { data, error } = await supabase
        .from(table)
        .update(payload)
        .eq("id", id)
        .select("*")
        .single();
      if (error) throw error;
      return data;
    },
    async delete(id) {
      const { error } = await supabase.from(table).delete().eq("id", id);
      if (error) throw error;
      return { success: true };
    }
  };
};

const callFunction = async (name, payload = {}) => {
  const {
    data: { session }
  } = await supabase.auth.getSession();

  const response = await fetch(`/api/functions/${name}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {})
    },
    body: JSON.stringify(payload || {})
  });

  const json = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(json?.error || `Falha ao executar função ${name}`);
    error.status = response.status;
    error.data = json;
    throw error;
  }
  return { data: json };
};

export const db = {
  auth: {
    async isAuthenticated() {
      const {
        data: { user }
      } = await supabase.auth.getUser();
      return Boolean(user);
    },
    async me() {
      const {
        data: { user },
        error
      } = await supabase.auth.getUser();
      if (error) {
        if (isMissingSessionError(error)) return null;
        throw error;
      }
      return normalizeUser(user);
    },
    async logout() {
      await supabase.auth.signOut();
    },
    async redirectToLogin() {
      if (window.location.pathname !== "/login") {
        window.location.assign("/login");
      }
    }
  },
  entities: new Proxy(
    {},
    {
      get: (_, entityName) => createEntityClient(entityName)
    }
  ),
  functions: {
    invoke: callFunction
  },
  integrations: {
    Core: {
      async UploadFile() {
        return { file_url: "" };
      }
    }
  }
};

globalThis.__B44_DB__ = db;

export const base44 = db;
export default db;