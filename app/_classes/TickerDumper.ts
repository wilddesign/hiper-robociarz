import path from "path";
const fs = require("fs");

export class TickerDumper {
  /**
   * Saves an array of objects to a local file in JSON format.
   * This function uses synchronous file writing, which blocks the execution
   * until the file is written. The file will be overwritten if it exists.
   *
   * @template T - The type of objects in the array.
   * @param {string} filename - The name/path of the file to save (e.g., 'output.json').
   * @param {T[]} data - The array of objects to save.
   */
  static saveArrayToFileSync<T>(filename: string, data: T[]): void {
    try {
      // 1. Convert the array of objects into a formatted JSON string.
      // We use JSON.stringify with null and 2 for indentation, making the output readable.
      const jsonContent = JSON.stringify(data, null, 2);

      // 2. Determine the absolute path for saving the file (optional, but good practice).
      const filePath = path.resolve(filename);

      // 3. Use fs.writeFileSync to write the JSON content to the file.
      // If the file already exists, it is completely overwritten.
      fs.writeFileSync(filePath, jsonContent, { encoding: "utf-8" });

      console.log(`✅ Success: Data saved to file system at: ${filePath}`);
      console.log(`File size: ${fs.statSync(filePath).size} bytes`);
    } catch (error) {
      // Handle potential errors like permissions issues or invalid file paths.
      console.error(
        `❌ Error saving file ${filename}:`,
        error instanceof Error ? error.message : "An unknown error occurred."
      );
    }
  }

  /**
   * Reads a local JSON file and parses its contents back into an array of objects.
   * This function uses synchronous file reading.
   *
   * @template T - The expected type of objects in the array.
   * @param {string} filename - The name/path of the file to read.
   * @returns {T[] | null} The parsed array of objects, or null if loading failed.
   */
  static loadArrayFromFileSync<T>(filename: string): T[] | null {
    const filePath = path.resolve(filename);

    try {
      // 1. Read the file contents as a string.
      const fileContent = fs.readFileSync(filePath, { encoding: "utf-8" });

      // 2. Parse the JSON string back into a JavaScript array.
      const parsedData: T[] = JSON.parse(fileContent);

      console.log(`\n✅ Success: Data loaded and parsed from: ${filePath}`);

      // 3. Optional Date Revival: If an object has a 'timestamp' property that is a string,
      // convert it back into a JavaScript Date object for correct typing and usage.
      return parsedData.map((item) => {
        if ("timestamp" in item && typeof item.timestamp === "string") {
          // We use 'as unknown as T' to safely assert the type after modification
          return {
            ...item,
            timestamp: new Date(item.timestamp),
          } as unknown as T;
        }
        return item;
      });
    } catch (error) {
      // Handle common file system and parsing errors.
      if (error instanceof Error) {
        if ("code" in error && error.code === "ENOENT") {
          console.error(`❌ Error: File not found at ${filePath}.`);
        } else if (error instanceof SyntaxError) {
          console.error(`❌ Error: File content is not valid JSON.`);
        } else {
          console.error(
            `❌ An unexpected error occurred while loading ${filename}:`,
            error.message
          );
        }
      }
      return null;
    }
  }
}
