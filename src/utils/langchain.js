import { TextLoader } from "langchain/document_loaders/fs/text";
import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";
import { OpenAIEmbeddings } from "@langchain/openai";
import { MongoDBAtlasVectorSearch } from "@langchain/mongodb";
import { MongoClient } from "mongodb";

const loadTextDocument = async (filePath) => {
  try {
    const loader = new TextLoader(filePath);
    const documents = await loader.load();
    return documents;
  } catch (error) {
    console.error("Error loading text document", error);
    throw error;
  }
};

const splitDocument = async (
  documents,
  chunkSize = 1000,
  chunkOverlap = 200
) => {
  try {
    const splitter = new RecursiveCharacterTextSplitter({
      chunkSize,
      chunkOverlap,
    });
    const splitDocuments = await splitter.splitDocuments(documents);
    return splitDocuments;
  } catch (error) {
    console.error("Error splitting document", error);
    throw error;
  }
};

const createEmbeddingAndStore = async (documents, collectionName) => {
  try {
    // Initialize OpenAI Embeddings
    const embeddings = new OpenAIEmbeddings();

    // Create embeddings for the documents
    const documentEmbeddings = await embeddings.embedDocuments(documents);

    // Connect to MongoDB
    const client = new MongoClient(process.env.MONGODB_URI);
    await client.connect();
    const db = client.db(process.env.MONGODB_DB_NAME);
    const collection = db.collection(collectionName);

    // Initialize MongoDB Atlas Vector Search
    const vectorSearch = new MongoDBAtlasVectorSearch(collection);

    // Store embeddings in the vector store
    await vectorSearch.storeEmbeddings(documentEmbeddings);

    console.log("Embeddings created and stored successfully.");
  } catch (error) {
    console.error(
      "Error creating embeddings and storing in vector store",
      error
    );
    throw error;
  } finally {
    // Ensure the client is closed
    if (client) {
      await client.close();
    }
  }
};

const getRetriever = async (collectionName) => {
  try {
    // Connect to MongoDB
    const client = new MongoClient(process.env.MONGODB_URI);
    await client.connect();
    const db = client.db(process.env.MONGODB_DB_NAME);
    const collection = db.collection(collectionName);

    // Initialize MongoDB Atlas Vector Search
    const vectorSearch = new MongoDBAtlasVectorSearch(collection);

    // Return the retriever
    return vectorSearch.getRetriever();
  } catch (error) {
    console.error("Error getting retriever", error);
    throw error;
  } finally {
    // Ensure the client is closed
    if (client) {
      await client.close();
    }
  }
};
