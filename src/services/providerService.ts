import { apiRequest } from "./api";

export interface ProviderProfile {
  id:         number;
  first_name: string;
  last_name:  string;
  email:      string;
  phone:      string;
  [key: string]: any;   // any extra fields the API returns
}

export const getProviderProfile = (token: string) =>
  apiRequest<ProviderProfile>("/providers/profile/", {
    method: "GET",
  }, token);