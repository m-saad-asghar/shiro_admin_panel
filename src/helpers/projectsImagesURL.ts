const projectsImagesUrl = (dynamicPath?: string) => {
  // If path is undefined or null, return empty string
  if (!dynamicPath) return "";

  // If already a full URL, return as is
  if (
    dynamicPath.startsWith("http://") ||
    dynamicPath.startsWith("https://")
  ) {
    return dynamicPath;
  }

  // Base URL (must start with NEXT_PUBLIC_ to be accessible on client)
  const baseURL =
    process.env.NEXT_PUBLIC_IMAGE_BASE_URL ||
    "https://admin.shiroproperties.ae";

  // Ensure no double slashes
  const cleanBase = baseURL.replace(/\/$/, "");
  const cleanPath = dynamicPath.replace(/^\//, "");

  return `${cleanBase}/projects/${cleanPath}`;
};

export default projectsImagesUrl;