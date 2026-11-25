import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import "./index.css";
import App from "./App.jsx";
import { UserProvider } from "./context/UserContext.jsx";
import { ThemeProvider } from "./context/ThemeContext.jsx";
import { WallpaperProvider } from "./context/WallpaperContext.jsx";
import { PreferencesProvider } from "./context/PreferencesContext.jsx";
import { PersistQueryClientProvider } from "@tanstack/react-query-persist-client";
import { persistOptions, queryClient } from "./lib/queryClient.js";

createRoot(document.getElementById("root")).render(
  <BrowserRouter>
    <StrictMode>
      {/* Chat cache, restored from IndexedDB on load (see lib/queryClient.js). */}
      <PersistQueryClientProvider client={queryClient} persistOptions={persistOptions}>
        <UserProvider>
          <ThemeProvider>
            <PreferencesProvider>
              <WallpaperProvider>
                <App />
              </WallpaperProvider>
            </PreferencesProvider>
          </ThemeProvider>
        </UserProvider>
      </PersistQueryClientProvider>
    </StrictMode>
  </BrowserRouter>,
);
