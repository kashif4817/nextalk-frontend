// utils/withTimeout.js
export const withTimeout = (promise, ms = 10000) => {
  const timeout = new Promise((_, reject) =>
    setTimeout(() => reject(new Error("Server is not responding. Please try again later.")), ms)
  );
  return Promise.race([promise, timeout]);
};