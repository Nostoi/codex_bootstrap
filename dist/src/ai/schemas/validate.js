"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getTaskExtractionValidator = getTaskExtractionValidator;
exports.getTaskClassificationValidator = getTaskClassificationValidator;
const ajv_1 = require("ajv");
const fs = require("fs");
const path = require("path");
const ajv = new ajv_1.default({ allErrors: true, strict: false });
function loadSchema(schemaFile) {
    const schemaPath = path.join(__dirname, schemaFile);
    return JSON.parse(fs.readFileSync(schemaPath, "utf-8"));
}
function getTaskExtractionValidator() {
    const schema = loadSchema("task-extraction.schema.json");
    return ajv.compile(schema);
}
function getTaskClassificationValidator() {
    const schema = loadSchema("task-classification.schema.json");
    return ajv.compile(schema);
}
//# sourceMappingURL=validate.js.map