// hooks/useOnlineGuard.js
import toast from "react-hot-toast";

const useOnlineGuard = () => {
  const showOfflineToast = () => {
    toast.error("No internet connection. Please check and try again.");
  };

  const isOnline = () => {
    if (!navigator.onLine) {
      showOfflineToast();
      return false;
    }
    return true;
  };

  return { isOnline };
};

export default useOnlineGuard;