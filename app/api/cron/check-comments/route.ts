// Helper function to check if comment is still live
async function checkCommentStatus(url: string): Promise<boolean> {
  try {
    // Create an AbortController for the timeout
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 5000) // 5 second timeout

    const response = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; v0-reddit-tracker/1.0)",
      },
      signal: controller.signal, // Use the signal here
      // Remove the invalid 'timeout' property
    })

    // Clear the timeout if the request completes successfully
    clearTimeout(timeoutId)

    // Reddit returns 404 or 403 for removed/deleted comments
    if (response.status === 404 || response.status === 403) {
      return false
    }

    // Check if we got a redirect to r/removed or similar
    if (response.redirected) {
      const finalUrl = response.url.toLowerCase()
      if (finalUrl.includes("/removed") || finalUrl.includes("/delete")) {
        return false
      }
    }

    // If we got 200, assume it's live
    return response.status === 200
  } catch (error) {
    console.error(`Error checking ${url}:`, error)
    // If we can't reach it (or it timed out), assume it's down/unverifiable
    return false
  }
}