import DataURIParser from "datauri/parser.js";
import { v4 as uuidv4 } from "uuid";

import path from "path";

export const getDataUri = (file) => {
  const parser = new DataURIParser();
  const extName = path.extname(file.originalname).toString();
  return parser.format(extName, file.buffer);
};

export const getDataUris = (files) => {
  return files.map((file) => {
    const dataUri = `data:${file.mimetype};base64,${file.buffer.toString(
      "base64"
    )}`;
    return dataUri;
  });
};
