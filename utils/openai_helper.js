const { OpenAI } = require("openai");
const xlsx = require("xlsx");
const KnowledgeChunk = require("../models/KnowledgeChunk");

// OpenRouter speaks the OpenAI Responses API; the SDK retries 429/5xx itself.
const openai = new OpenAI({
  baseURL: "https://openrouter.ai/api/v1",
  apiKey: process.env.OPENROUTER_API_KEY,
  maxRetries: 4,
});

const MODEL = process.env.OPENROUTER_MODEL;
const EMBEDDING_MODEL = "openai/text-embedding-3-small";

const KB_INSTRUCTIONS = `You are an expert text and data summarizer. You are given a markdown containing the company information. Always take context from it. If you don't find the answer there, use your general intelligence and the given data to construct a meaningful response.
Respond only with a JSON object following the format given in the user query.

Context:
`;

const generateText = async (input) => {
  const response = await openai.responses.create({ model: MODEL, input });
  return response.output_text;
};

// JSON mode: the model must return a valid JSON object, so no repair step.
// The shape comes from the format described in the prompt.
const generateJSON = async (input, instructions) => {
  const response = await openai.responses.create({
    model: MODEL,
    instructions,
    input,
    text: { format: { type: "json_object" } },
  });
  return JSON.parse(response.output_text);
};

const embed = async (input) => {
  const { data } = await openai.embeddings.create({
    model: EMBEDDING_MODEL,
    input,
    encoding_format: "float",
  });
  return data.map((item) => item.embedding);
};

// ponytail: fixed-size character windows, switch to a paragraph-aware splitter if retrieval quality suffers
const splitText = (text, size = 1000, overlap = 200) => {
  const chunks = [];
  for (let i = 0; i < text.length; i += size - overlap) {
    chunks.push(text.slice(i, i + size));
    if (i + size >= text.length) break;
  }
  return chunks;
};

// Re-indexing the same source replaces its old chunks.
const indexDocument = async (collectionId, source, text) => {
  await KnowledgeChunk.deleteMany({ collectionId, source });
  const chunks = splitText(text.trim());
  for (let i = 0; i < chunks.length; i += 100) {
    const batch = chunks.slice(i, i + 100);
    const embeddings = await embed(batch);
    await KnowledgeChunk.insertMany(
      batch.map((text, j) => ({ collectionId, source, text, embedding: embeddings[j] }))
    );
  }
};

// Spreadsheets (csv/xls/xlsx) become CSV text; text files are read as-is; anything else is skipped.
const indexFile = async (collectionId, source, buffer, filename) => {
  if (/\.(csv|xlsx?)$/i.test(filename)) {
    const workbook = xlsx.read(buffer, { type: "buffer" });
    const text = workbook.SheetNames.map((name) =>
      xlsx.utils.sheet_to_csv(workbook.Sheets[name])
    ).join("\n\n");
    return indexDocument(collectionId, source, text);
  }
  if (/\.(md|txt|json|html?)$/i.test(filename)) {
    return indexDocument(collectionId, source, buffer.toString("utf8"));
  }
  console.warn(`Skipping unsupported file type for knowledge base: ${filename}`);
};

const deleteDocument = (source) => KnowledgeChunk.deleteMany({ source });

// ponytail: brute-force scan of the collection in memory, fine for a few thousand chunks; use Atlas Vector Search beyond that
const retrieve = async (collectionId, query, k = 4) => {
  const [queryEmbedding] = await embed([query]);
  const chunks = await KnowledgeChunk.find({ collectionId }, "text embedding").lean();
  // OpenAI embeddings are unit length, so the dot product is the cosine similarity
  const score = (embedding) =>
    embedding.reduce((sum, value, i) => sum + value * queryEmbedding[i], 0);
  return chunks
    .map((chunk) => ({ text: chunk.text, score: score(chunk.embedding) }))
    .sort((a, b) => b.score - a.score)
    .slice(0, k)
    .map((chunk) => chunk.text);
};

// RAG: answer from the collection's closest chunks.
const createThreadAndRunonKnowledgeBase = async (collectionId, finalPrompt) => {
  const chunks = await retrieve(String(collectionId), finalPrompt);
  return generateJSON(finalPrompt, KB_INSTRUCTIONS + chunks.join("\n\n"));
};

module.exports = {
  generateText,
  generateJSON,
  indexDocument,
  indexFile,
  deleteDocument,
  createThreadAndRunonKnowledgeBase,
};
