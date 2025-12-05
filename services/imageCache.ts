// A simple in-memory cache for generated images.
// The key is the image prompt, and the value is the base64 data URL.
const imageCache = new Map<string, string>();

/**
 * Retrieves an image URL from the cache.
 * @param prompt The prompt used to generate the image.
 * @returns The cached data URL string, or null if not found.
 */
export const getImageFromCache = (prompt: string): string | null => {
  return imageCache.get(prompt) || null;
};

/**
 * Stores an image URL in the cache.
 * @param prompt The prompt used to generate the image.
 * @param imageUrl The data URL of the generated image.
 */
export const setImageInCache = (prompt: string, imageUrl: string): void => {
  imageCache.set(prompt, imageUrl);
};

/**
 * Deletes an image from the cache.
 * @param prompt The prompt used to generate the image.
 */
export const deleteImageFromCache = (prompt: string): void => {
  if (imageCache.has(prompt)) {
    imageCache.delete(prompt);
    console.log(`Image cache deleted for prompt: ${prompt}`);
  }
};


/**
 * Clears the entire image cache.
 */
export const clearImageCache = (): void => {
    console.log("Image cache cleared.");
    imageCache.clear();
};