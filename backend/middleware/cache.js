const store = new Map();

const get = (key) => {
  const entry = store.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    store.delete(key);
    return null;
  }
  return entry.data;
};

const set = (key, data, ttlMs) => {
  store.set(key, { data, expiresAt: Date.now() + ttlMs });
};

const clear = () => store.clear();

module.exports = { get, set, clear };
