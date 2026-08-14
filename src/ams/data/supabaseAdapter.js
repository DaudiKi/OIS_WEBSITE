// Thin Supabase adapter using the REST (PostgREST) and GoTrue HTTP APIs
// directly — no SDK dependency needed. Activated when public/ams-config.js
// defines window.OIS_AMS_CONFIG. The matching database schema lives in
// supabase/schema.sql.

const ACCESS_TOKEN_KEY = 'ois.ams.supabase.token';

export function createAdapter(config) {
  if (!config) throw new Error('Supabase configuration missing');
  const { supabaseUrl, supabaseAnonKey } = config;
  const restUrl = `${supabaseUrl.replace(/\/$/, '')}/rest/v1`;
  const authUrl = `${supabaseUrl.replace(/\/$/, '')}/auth/v1`;

  function storedToken() {
    try {
      return JSON.parse(localStorage.getItem(ACCESS_TOKEN_KEY) || 'null');
    } catch {
      return null;
    }
  }

  function setToken(token) {
    try {
      if (token) localStorage.setItem(ACCESS_TOKEN_KEY, JSON.stringify(token));
      else localStorage.removeItem(ACCESS_TOKEN_KEY);
    } catch {
      // ignore
    }
  }

  function headers(extra = {}) {
    const token = storedToken();
    return {
      apikey: supabaseAnonKey,
      Authorization: `Bearer ${token?.access_token || supabaseAnonKey}`,
      'Content-Type': 'application/json',
      ...extra,
    };
  }

  async function request(url, options = {}) {
    const response = await fetch(url, { ...options, headers: headers(options.headers) });
    if (!response.ok) {
      let message = `Request failed (${response.status})`;
      try {
        const body = await response.json();
        message = body.msg || body.message || body.error_description || body.error || message;
      } catch {
        // keep default message
      }
      throw new Error(message);
    }
    if (response.status === 204) return null;
    const text = await response.text();
    return text ? JSON.parse(text) : null;
  }

  async function fetchProfile(userId) {
    const rows = await request(`${restUrl}/profiles?id=eq.${userId}&select=*`);
    return rows?.[0] || null;
  }

  return {
    /* Auth */
    async signIn(email, password) {
      const data = await request(`${authUrl}/token?grant_type=password`, {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });
      setToken(data);
      const profile = await fetchProfile(data.user.id);
      if (profile?.status === 'pending') {
        setToken(null);
        throw new Error('Your account is awaiting approval by the school administrator.');
      }
      return { id: data.user.id, email: data.user.email, ...profile };
    },

    async signUp({ name, email, password, role, phone }) {
      const data = await request(`${authUrl}/signup`, {
        method: 'POST',
        body: JSON.stringify({ email, password, data: { name, role, phone } }),
      });
      const needsApproval = role === 'teacher' || role === 'admin';
      if (data.access_token) setToken(data);
      return { user: { id: data.user?.id || data.id, email, name, role }, needsApproval };
    },

    async signOut() {
      try {
        await request(`${authUrl}/logout`, { method: 'POST' });
      } catch {
        // ignore network errors on logout
      }
      setToken(null);
      return true;
    },

    async currentUser() {
      const token = storedToken();
      if (!token) return null;
      try {
        const user = await request(`${authUrl}/user`);
        const profile = await fetchProfile(user.id);
        return { id: user.id, email: user.email, ...profile };
      } catch {
        setToken(null);
        return null;
      }
    },

    /* Generic table access */
    async list(table) {
      return (await request(`${restUrl}/${table}?select=*&order=createdAt.desc.nullslast`)) || [];
    },

    async save(table, record) {
      if (record.id) {
        const { id, ...patch } = record;
        const rows = await request(`${restUrl}/${table}?id=eq.${id}`, {
          method: 'PATCH',
          headers: { Prefer: 'return=representation' },
          body: JSON.stringify(patch),
        });
        if (rows?.length) return rows[0];
      }
      const { id, ...insert } = record;
      const rows = await request(`${restUrl}/${table}`, {
        method: 'POST',
        headers: { Prefer: 'return=representation' },
        body: JSON.stringify(insert),
      });
      return rows?.[0];
    },

    async update(table, id, patch) {
      const rows = await request(`${restUrl}/${table}?id=eq.${id}`, {
        method: 'PATCH',
        headers: { Prefer: 'return=representation' },
        body: JSON.stringify(patch),
      });
      return rows?.[0] || null;
    },

    async remove(table, id) {
      await request(`${restUrl}/${table}?id=eq.${id}`, { method: 'DELETE' });
      return true;
    },

    /* Attendance */
    async listAttendance({ classId, date } = {}) {
      const filters = ['select=*'];
      if (classId) filters.push(`classId=eq.${classId}`);
      if (date) filters.push(`date=eq.${date}`);
      return (await request(`${restUrl}/attendance?${filters.join('&')}`)) || [];
    },

    async saveAttendance(classId, date, records) {
      await request(`${restUrl}/attendance?classId=eq.${classId}&date=eq.${date}`, { method: 'DELETE' });
      if (records.length) {
        await request(`${restUrl}/attendance`, {
          method: 'POST',
          body: JSON.stringify(records.map(({ studentId, status }) => ({ classId, date, studentId, status }))),
        });
      }
      return true;
    },

    /* School settings — a single row keyed 'school'. */
    async getSettings() {
      const rows = await request(`${restUrl}/settings?id=eq.school&select=*`);
      return rows?.[0]?.value || null;
    },

    async saveSettings(patch) {
      const current = (await request(`${restUrl}/settings?id=eq.school&select=*`))?.[0]?.value || {};
      const value = { ...current, ...patch };
      await request(`${restUrl}/settings`, {
        method: 'POST',
        headers: { Prefer: 'resolution=merge-duplicates' },
        body: JSON.stringify({ id: 'school', value }),
      });
      return value;
    },

    /* Report cards */
    async listReports({ termId, studentId } = {}) {
      const filters = ['select=*'];
      if (termId) filters.push(`termId=eq.${termId}`);
      if (studentId) filters.push(`studentId=eq.${studentId}`);
      // Row-level security in schema.sql decides which rows come back: staff
      // see their classes, families only their own published reports.
      return (await request(`${restUrl}/reports?${filters.join('&')}`)) || [];
    },

    async getReport(id) {
      const rows = await request(`${restUrl}/reports?id=eq.${id}&select=*`);
      return rows?.[0] || null;
    },

    async saveReport(record) {
      return this.save('reports', record);
    },

    async deleteReport(id) {
      return this.remove('reports', id);
    },

    async transitionReport(id, action, { actor, note } = {}) {
      // Runs server-side so the state machine and audit trail cannot be
      // bypassed by a modified client.
      const rows = await request(`${restUrl}/rpc/transition_report`, {
        method: 'POST',
        body: JSON.stringify({ report_id: id, action, actor: actor || null, note: note || null }),
      });
      return Array.isArray(rows) ? rows[0] : rows;
    },
  };
}
