/**
 * Download an image from a data URI or remote URL.
 */
export async function downloadImage(url: string): Promise<void> {
  if (url.startsWith("data:")) {
    const a = document.createElement("a");
    a.href = url;
    a.download = "generated-image.jpg";
    a.click();
  } else {
    const response = await fetch(url);
    const blob = await response.blob();
    const objectUrl = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = objectUrl;
    a.download = "generated-image.jpg";
    a.click();
    URL.revokeObjectURL(objectUrl);
  }
}
