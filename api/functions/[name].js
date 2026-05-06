export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const name = req.query.name;
  if (!name) {
    return res.status(400).json({ error: "Function name is required" });
  }

  const notImplementedYet = ["dynamicsSyncUCs", "dynamicsSyncPropostas", "dynamicsSyncContratos"];
  if (notImplementedYet.includes(name)) {
    return res.status(200).json({
      success: true,
      migrated: false,
      message: `${name} ainda nao foi implementada no backend Supabase.`
    });
  }

  const supabaseFunctionsUrl = process.env.SUPABASE_FUNCTIONS_URL;
  if (!supabaseFunctionsUrl) {
    return res.status(500).json({ error: "SUPABASE_FUNCTIONS_URL is not configured" });
  }

  try {
    const response = await fetch(`${supabaseFunctionsUrl.replace(/\/$/, "")}/${name}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(req.headers.authorization ? { Authorization: req.headers.authorization } : {}),
        ...(process.env.SUPABASE_SERVICE_ROLE_KEY
          ? { "x-service-role": process.env.SUPABASE_SERVICE_ROLE_KEY }
          : {})
      },
      body: JSON.stringify(req.body ?? {})
    });

    const data = await response.json().catch(() => ({}));
    return res.status(response.status).json(data);
  } catch (error) {
    return res.status(500).json({ error: error.message || "Unexpected function proxy error" });
  }
}

