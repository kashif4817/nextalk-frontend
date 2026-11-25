const KEY = "nextalk:redirect-to";

export const rememberRedirect = (path) => {
  try {
    if (path && path !== "/login") sessionStorage.setItem(KEY, path);
  } catch {
    // Private mode / blocked storage — deep-link restore just won't happen.
  }
};

export const takeRedirect = () => {
  try {
    const path = sessionStorage.getItem(KEY);
    sessionStorage.removeItem(KEY);
    return path;
  } catch {
    return null;
  }
};
