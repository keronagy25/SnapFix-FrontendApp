import { apiRequest } from "./api";

export interface ProviderProfile {
  id:                   string;
  email:                string;
  first_name:           string;
  last_name:            string;
  phone:                string;
  profile_picture:      string | null;
  address:              string;
  latitude:             number | null;
  longitude:            number | null;
  business_name:        string;
  bio:                  string;
  hourly_rate:          string;
  years_of_experience:  number;
  region:               number;
  categories:           number[];
  verification_status:  string;
  is_available:         boolean;
  average_rating:       string;
  total_reviews:        number;
  total_jobs:           number;
  completed_jobs:       number;
  completion_rate:      number;
  available_balance:    string;
  total_earnings:       string;
  date_joined:          string;
  role?:                string;
}

export interface UpdateProviderPayload {
  first_name?:          string;
  last_name?:           string;
  phone?:               string;
  bio?:                 string;
  address?:             string;
  latitude?:            number;
  longitude?:           number;
  business_name?:       string;
  hourly_rate?:         string;
  years_of_experience?: number;
  is_available?:        boolean;
  profile_picture?:     any;
}

export interface ProviderLocation {
  latitude:  number;
  longitude: number;
}

// GET /api/v1/providers/me/
export const getProviderProfile = (token: string) =>
  apiRequest<ProviderProfile>("/providers/me/", { method: "GET" }, token);

// PATCH /api/v1/providers/me/ - For text fields
export const updateProviderProfile = (payload: UpdateProviderPayload, token: string) =>
  apiRequest<ProviderProfile>("/providers/me/", {
    method: "PATCH",
    body: JSON.stringify(payload),
  }, token);

// PATCH /api/v1/providers/me/ - For profile picture upload
export const updateProviderProfilePicture = async (imageUri: string, token: string): Promise<ProviderProfile> => {
  const formData = new FormData();
  const uriParts = imageUri.split('.');
  const fileType = uriParts[uriParts.length - 1];
  const fileName = `profile_${Date.now()}.${fileType}`;
  
  formData.append('profile_picture', {
    uri: imageUri,
    name: fileName,
    type: `image/${fileType}`,
  } as any);
  
  return apiRequest<ProviderProfile>("/providers/me/", {
    method: "PATCH",
    body: formData,
  }, token);
};

// PATCH /api/v1/providers/me/location/ - For live location tracking
export const updateProviderLocation = (latitude: number, longitude: number, token: string) =>
  apiRequest<ProviderLocation>("/providers/me/location/", {
    method: "PATCH",
    body: JSON.stringify({ latitude, longitude }),
  }, token);