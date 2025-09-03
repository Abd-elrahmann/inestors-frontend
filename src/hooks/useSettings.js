// hooks/useSettings.js
import { useQuery } from "react-query";
import Api from "../services/api";

export const useSettings = () => {
  return useQuery(
    "settings",
    async () => {
      const response = await Api.get("/api/settings");
      return response.data;
    },
    {
      staleTime: 1000 * 60 * 10,
      cacheTime: 1000 * 60 * 30,
    }
  );
};
