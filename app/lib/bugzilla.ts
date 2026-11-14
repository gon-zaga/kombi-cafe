// Files bugs and attachments in Bugzilla through its REST API using the API key
// as a query parameter.

interface BugzillaConfig {
  url: string;
  apiKey: string;
  product: string;
  component: string;
}

function getBugzillaConfig(): BugzillaConfig {
  const url = process.env.BUGZILLA_URL;
  const apiKey = process.env.BUGZILLA_API_KEY;
  const product = process.env.BUGZILLA_PRODUCT;
  const component = process.env.BUGZILLA_COMPONENT;

  if (!url || !apiKey || !product || !component) {
    throw new Error("Bugzilla configuration incomplete: missing BUGZILLA_URL, BUGZILLA_API_KEY, BUGZILLA_PRODUCT, or BUGZILLA_COMPONENT");
  }

  return { url, apiKey, product, component };
}

function authQuery(apiKey: string): string {
  return `?api_key=${encodeURIComponent(apiKey)}`;
}

async function bugzillaError(res: Response): Promise<never> {
  const data = await res.json().catch(() => ({}));
  throw new Error(data.message || data.error || `Bugzilla error ${res.status}`);
}

export async function createBug(summary: string, description: string): Promise<number> {
  const { url, apiKey, product, component } = getBugzillaConfig();

  const res = await fetch(`${url}/rest/bug${authQuery(apiKey)}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      product,
      component,
      version: "unspecified",
      summary,
      description,
      op_sys: "All",
      platform: "All",
      priority: "Normal",
    }),
  });

  if (!res.ok) {
    await bugzillaError(res);
  }
  return (await res.json()).id as number;
}

export interface BugzillaAttachment {
  fileName: string;
  contentType: string;
  dataBase64: string;
  summary?: string;
}

export async function addAttachment(bugId: number, attachment: BugzillaAttachment): Promise<void> {
  const { url, apiKey } = getBugzillaConfig();

  const res = await fetch(`${url}/rest/bug/${bugId}/attachment${authQuery(apiKey)}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      ids: [bugId],
      file_name: attachment.fileName,
      summary: attachment.summary ?? attachment.fileName,
      content_type: attachment.contentType,
      data: attachment.dataBase64,
      is_patch: false,
    }),
  });

  if (!res.ok) {
    await bugzillaError(res);
  }
}