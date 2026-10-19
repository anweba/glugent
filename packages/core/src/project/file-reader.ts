import * as fs from "fs";

export type ReadFile = (file: string) => string;

export interface LoadOptions {
  /** Override how files are read (e.g. to see unsaved editor buffers). */
  readFile?: ReadFile;
}

export const readFromDisk: ReadFile = (file) => fs.readFileSync(file, "utf8");
