import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import "./index.css";
import App from "./App.jsx";
import { ThemeProvider } from "./context/ThemeContext.jsx";
import { WallpaperProvider } from "./context/WallpaperContext.jsx";
import { UserProvider } from "./context/UserContext.jsx";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60_000,   // data stays fresh for 60s — no background refetch during that window
      gcTime: 5 * 60_000,  // unused cache entries live for 5 min before garbage collected
      retry: 1,
    },
  },
});

createRoot(document.getElementById("root")).render(
  <BrowserRouter>
    <StrictMode>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider>
          <WallpaperProvider>
            <UserProvider>
              <App />
            </UserProvider>
          </WallpaperProvider>
        </ThemeProvider>
      </QueryClientProvider>
    </StrictMode>
  </BrowserRouter>,
);
