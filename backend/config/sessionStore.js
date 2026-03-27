const memoryStore = {
  sessions: new Map(),
  sessionMeta: new Map(),
  blacklist: new Map(),
  activities: new Map(),
  bruteForce: new Map()
};

const nowMs = () => Date.now();
const ttlToExpiry = (ttl) => nowMs() + (ttl * 1000);

const setMemoryWithExpiry = (map, key, value, ttl) => {
  map.set(key, {
    value,
    expiresAt: ttlToExpiry(ttl)
  });
};

const getMemoryValue = (map, key) => {
  const entry = map.get(key);
  if (!entry) {
    return null;
  }
  if (entry.expiresAt <= nowMs()) {
    map.delete(key);
    return null;
  }
  return entry.value;
};

const validateSessionId = (sessionId) => {
  if (!sessionId || typeof sessionId !== 'string') {
    throw new Error('Invalid session ID');
  }
  if (sessionId.length < 1 || sessionId.length > 200) {
    throw new Error('Session ID length invalid');
  }
  if (!/^[a-zA-Z0-9\-_\.]+$/.test(sessionId)) {
    throw new Error('Session ID contains invalid characters');
  }
  return true;
};

const validateSessionData = (data) => {
  if (!data || typeof data !== 'object') {
    throw new Error('Invalid session data');
  }
  if (!data.userId || !data.sessionId) {
    throw new Error('Session data missing required fields');
  }
  return true;
};

export const sessionManager = {
  async setSession(sessionId, data, ttl = 86400) {
    try {
      validateSessionId(sessionId);
      validateSessionData(data);

      setMemoryWithExpiry(memoryStore.sessions, sessionId, data, ttl);
      setMemoryWithExpiry(memoryStore.sessionMeta, sessionId, {
        createdAt: new Date().toISOString(),
        lastAccess: new Date().toISOString(),
        ip: data.ip || 'unknown',
        userAgent: data.userAgent || 'unknown'
      }, ttl);
      return true;
    } catch (error) {
      return false;
    }
  },

  async getSession(sessionId) {
    try {
      validateSessionId(sessionId);

      const sessionData = getMemoryValue(memoryStore.sessions, sessionId);
      if (!sessionData) {
        return null;
      }

      const meta = getMemoryValue(memoryStore.sessionMeta, sessionId) || {};
      setMemoryWithExpiry(memoryStore.sessionMeta, sessionId, {
        ...meta,
        lastAccess: new Date().toISOString()
      }, 86400);

      return sessionData;
    } catch (error) {
      return null;
    }
  },

  async deleteSession(sessionId) {
    try {
      validateSessionId(sessionId);
      memoryStore.sessions.delete(sessionId);
      memoryStore.sessionMeta.delete(sessionId);
      return true;
    } catch (error) {
      return false;
    }
  },

  async extendSession(sessionId, ttl = 86400) {
    try {
      validateSessionId(sessionId);

      const sessionData = getMemoryValue(memoryStore.sessions, sessionId);
      if (!sessionData) {
        return false;
      }

      const meta = getMemoryValue(memoryStore.sessionMeta, sessionId) || {};
      setMemoryWithExpiry(memoryStore.sessions, sessionId, sessionData, ttl);
      setMemoryWithExpiry(memoryStore.sessionMeta, sessionId, {
        ...meta,
        lastAccess: new Date().toISOString()
      }, ttl);

      return true;
    } catch (error) {
      return false;
    }
  },

  async blacklistToken(token, ttl = 86400) {
    try {
      if (!token || typeof token !== 'string') {
        throw new Error('Invalid token');
      }

      setMemoryWithExpiry(memoryStore.blacklist, token, true, ttl);
      return true;
    } catch (error) {
      return false;
    }
  },

  async isTokenBlacklisted(token) {
    try {
      if (!token || typeof token !== 'string') {
        return false;
      }

      return Boolean(getMemoryValue(memoryStore.blacklist, token));
    } catch (error) {
      return false;
    }
  },

  async logUserActivity(userId, activity, metadata = {}) {
    try {
      const activityData = {
        userId,
        activity,
        metadata,
        timestamp: new Date().toISOString(),
        ip: metadata.ip || 'unknown'
      };

      const current = memoryStore.activities.get(userId) || [];
      current.unshift(activityData);
      memoryStore.activities.set(userId, current.slice(0, 100));
      return true;
    } catch (error) {
      return false;
    }
  },

  async getSessionMetadata(sessionId) {
    try {
      validateSessionId(sessionId);
      return getMemoryValue(memoryStore.sessionMeta, sessionId);
    } catch (error) {
      return null;
    }
  },

  async getBruteForceAttempts(key) {
    try {
      const attempts = getMemoryValue(memoryStore.bruteForce, key);
      return attempts || 0;
    } catch (error) {
      return 0;
    }
  },

  async recordBruteForceAttempt(key) {
    try {
      const current = await this.getBruteForceAttempts(key);
      setMemoryWithExpiry(memoryStore.bruteForce, key, current + 1, 3600);
      return true;
    } catch (error) {
      return false;
    }
  },

  async clearBruteForceAttempts(key) {
    try {
      memoryStore.bruteForce.delete(key);
      return true;
    } catch (error) {
      return false;
    }
  },

  async getUserActivity(userId, limit = 10) {
    try {
      return (memoryStore.activities.get(userId) || []).slice(0, limit);
    } catch (error) {
      return [];
    }
  }
};
