// Files a bug in Bugzilla through its REST API (server-side only; key never reaches the browser)
export async function createBug(summary: string, description: string) {
  const url = process.env.BUGZILLA_URL;
  const apiKey = process.env.BUGZILLA_API_KEY;
  const product = process.env.BUGZILLA_PRODUCT;
  const component = process.env.BUGZILLA_COMPONENT;

  if (!url || !apiKey || !product || !component) {
    throw new Error("Bugzilla configuration incomplete: missing BUGZILLA_URL, BUGZILLA_API_KEY, BUGZILLA_PRODUCT, or BUGZILLA_COMPONENT");
  }

  const res = await fetch(`${url}/rest/bug`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-BUGZILLA-API-KEY": apiKey,
    },
    body: JSON.stringify({
      product,
      component,
      version: "unspecified",
      summary,
      description,
      op_sys: "All",
      platform: "All",
    }),
  });

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.message || `Bugzilla error ${res.status}`);
  }
  return (await res.json()).id as number;
}