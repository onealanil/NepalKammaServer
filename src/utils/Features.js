/**
 * @file Features.js
 * @description This file contains utility functions for handling file uploads and data URIs.
 * It includes functions to convert files to data URIs and to handle file metadata.
 * @module Features
 * @requires datauri/parser.js
 */
import DataURIParser from "datauri/parser.js";
import { v4 as uuidv4 } from "uuid";

import path from "path";
/**
 * @function getDataUri
 * @param {*} file - The file object containing the file data and metadata. 
 * @returns - The data URI string representing the file.
 * @description This function takes a file object and converts it to a data URI format.
 */
export const getDataUri = (file) => {
  const parser = new DataURIParser();
  const extName = path.extname(file.originalname).toString();
  return parser.format(extName, file.buffer);
};

/**
 * 
 * @param {*} files - The files array containing file objects with data and metadata.
 * @description This function takes an array of file objects and converts each file to a data URI format.
 * It returns an array of data URI strings representing the files. 
 * @returns {Array} - An array of data URI strings representing the files.
 */
export const getDataUris = (files) => {
  return files.map((file) => {
    const dataUri = `data:${file.mimetype};base64,${file.buffer.toString(
      "base64"
    )}`;
    return dataUri;
  });
};
