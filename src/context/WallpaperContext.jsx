import { createContext, useContext, useEffect, useState } from "react";
import { DEFAULT_WALLPAPER_ID, getWallpaper } from "../data/wallpapers";

const WallpaperContext = createContext(null);

export const WallpaperProvider = ({ children }) => {
  const [wallpaperId, setWallpaperId] = useState(
    () => localStorage.getItem("nextalk-wallpaper") || DEFAULT_WALLPAPER_ID
  );

  useEffect(() => {
    localStorage.setItem("nextalk-wallpaper", wallpaperId);
  }, [wallpaperId]);

  const wallpaper = getWallpaper(wallpaperId);

  return (
    <WallpaperContext.Provider value={{ wallpaperId, setWallpaperId, wallpaper }}>
      {children}
    </WallpaperContext.Provider>
  );
};

export const useWallpaper = () => {
  const ctx = useContext(WallpaperContext);
  if (!ctx) throw new Error("useWallpaper must be used inside WallpaperProvider");
  return ctx;
};
