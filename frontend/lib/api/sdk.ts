class CustomSDK {
  async request(endpoint: string, options: RequestInit = {}) {
    const baseUrl = typeof window !== 'undefined'
      ? ''
      : (process.env.NEXT_PUBLIC_SITE_URL || process.env.SITE_BASE_URL || 'http://localhost:3000');

    const normalizedBaseUrl = baseUrl.replace(/\/$/, "");
    const normalizedEndpoint = endpoint.replace(/^\//, "");
    const url = `${normalizedBaseUrl}/api/${normalizedEndpoint}`;

    const res = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });
    if (!res.ok) {
      const errorText = await res.text();
      let errorData;
      try {
        errorData = JSON.parse(errorText);
      } catch (e) {
        throw new Error(errorText || "API Error");
      }
      throw { error: errorData || { message: "API Error" } };
    }
    return res.json();
  }

  async login(payload: any) {
    return this.request('auth/login', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  async register(payload: any) {
    return this.request('auth/register', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  async create(collection: string, data: any) {
    return this.request(collection, {
      method: 'POST',
      body: JSON.stringify({ data }),
    });
  }

  async update(collection: string, id: string, data: any) {
    return this.request(`${collection}?id=${id}`, {
      method: 'PUT',
      body: JSON.stringify({ data }),
    });
  }

  async find(collection: string, query: any = {}) {
    const qs = new URLSearchParams();
    if (query.filters?.user) qs.set('user', query.filters.user);
    if (query.filters?.documentId) qs.set('documentId', query.filters.documentId);
    // Add pagination limit
    if (query.pagination?.limit) qs.set('limit', query.pagination.limit);
    // Add sort
    if (query.sort && query.sort.length > 0) {
      qs.set('sort', query.sort[0]);
    }
    const queryString = qs.toString();
    return this.request(`${collection}${queryString ? '?' + queryString : ''}`);
  }
}

export const strapi = new CustomSDK();