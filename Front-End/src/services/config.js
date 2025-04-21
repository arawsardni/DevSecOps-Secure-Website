// Configuration file for API services

// Use different URLs based on environment
// - In user's browser: http://10.34.100.143:8000/api
// - Inside container: http://backend:8000/api
export const API_URL =
  typeof window !== "undefined"
    ? process.env.NEXT_PUBLIC_BROWSER_API_URL || "http://10.34.100.143:8000/api"
    : process.env.NEXT_PUBLIC_API_URL || "http://backend:8000/api";

// Additional configurations can be added here
export const DEFAULT_HEADERS = {
  "Content-Type": "application/json",
};

export const getAuthHeaders = (token) => {
  return {
    ...DEFAULT_HEADERS,
    Authorization: `Bearer ${token}`,
  };
};

// Utility function to handle API response
export const handleApiResponse = async (response) => {
  // Log for debugging
  console.log(`API response status: ${response.status}`);

  // Get the raw text first
  const responseText = await response.text();

  // Try to parse as JSON
  let data;
  try {
    data = JSON.parse(responseText);
  } catch (error) {
    console.error("Error parsing API response:", error);
    console.log("Raw response:", responseText);

    // If not JSON, return text
    return {
      ok: response.ok,
      status: response.status,
      data: responseText,
      isJson: false,
    };
  }

  // Return parsed JSON data
  return {
    ok: response.ok,
    status: response.status,
    data,
    isJson: true,
  };
};
