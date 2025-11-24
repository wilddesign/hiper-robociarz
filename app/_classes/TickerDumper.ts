import path from "path";
const fs = require("fs");

export class TickerDumper {
  /**
   * Loads and returns the string content from the 'inputstring.txt' file synchronously.
   * This is the reciprocal operation to saving the string to the file.
   *
   * @returns The string content of the file.
   * @throws An error if the file cannot be read (e.g., file not found or permission issues).
   */
  static loadStringFromInputFile(filename: string): string {
    // Resolve the absolute path to the file
    const absolutePath = path.resolve(filename);

    try {
      // Read the content from the file synchronously using 'utf8' encoding.
      const content = fs.readFileSync(absolutePath, "utf8");

      // console.log(`✅ Success: Content loaded from ${absolutePath}`);
      return content;
    } catch (error) {
      // Check for file-not-found specifically (often 'ENOENT')
      if (
        error &&
        typeof error === "object" &&
        "code" in error &&
        error.code === "ENOENT"
      ) {
        console.warn(
          `⚠️ Warning: File not found at ${absolutePath}. Returning empty string.`
        );
        return ""; // Return empty string if file is just missing
      }

      console.error(
        `❌ Error loading string from file ${filename}:`,
        error instanceof Error
          ? error.message
          : "An unknown error occurred during file reading."
      );
      // Re-throw the error for other types of failures (e.g., permissions)
      throw new Error(`Failed to load string content from: ${filename}`);
    }
  }

  /**
   * Saves a specified string to a file in the local filesystem using synchronous I/O.
   * NOTE: This function requires a Node.js environment to run and should be used
   * sparingly in server environments as it blocks the main thread.
   *
   * @param content The string content to be written to the file.
   * @param filename The name of the file to save (e.g., 'inputstring.txt').
   */
  static saveStringToFile(filename: string, content: string): void {
    try {
      // Using fs.writeFileSync as requested. This is a synchronous operation.
      // It creates the file if it doesn't exist or overwrites it if it does.
      fs.writeFileSync(filename, content, { encoding: "utf-8" });
      console.log(`Successfully saved ${content.length} bytes to ${filename}`);
    } catch (error) {
      console.error(`Error saving file ${filename}:`, error);
      // Throw the error immediately as synchronous functions do not return a Promise
      throw new Error(`Failed to write file: ${filename}`);
    }
  }
}
