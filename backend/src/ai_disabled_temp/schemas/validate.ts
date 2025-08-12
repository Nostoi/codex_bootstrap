import Ajv, { ValidateFunction } from 'ajv';
import * as fs from 'fs';
import * as path from 'path';

const ajv = new Ajv({ allErrors: true, strict: false });

function loadSchema(schemaFile: string) {
  // Use path relative to backend source directory to work around build/dist path issues
  const schemaPath = path.join(process.cwd(), 'src', 'ai', 'schemas', schemaFile);
  return JSON.parse(fs.readFileSync(schemaPath, 'utf-8'));
}

export function getTaskExtractionValidator(): ValidateFunction {
  const schema = loadSchema('task-extraction.schema.json');
  return ajv.compile(schema);
}

export function getTaskClassificationValidator(): ValidateFunction {
  const schema = loadSchema('task-classification.schema.json');
  return ajv.compile(schema);
}
