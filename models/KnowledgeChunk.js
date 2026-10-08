const mongoose = require("mongoose");

// One embedded chunk of a document. collectionId groups a company's (or a prospect's) documents,
// source identifies the document so it can be replaced or deleted.
const knowledgeChunkSchema = new mongoose.Schema({
  collectionId: { type: String, required: true, index: true },
  source: { type: String, required: true },
  text: { type: String, required: true },
  embedding: { type: [Number], required: true },
});

module.exports = mongoose.model("KnowledgeChunk", knowledgeChunkSchema);
