import { Chroma } from "@langchain/community/vectorstores/chroma";
import { OpenAIEmbeddings } from "@langchain/openai";
import path from 'path';
import dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config({ path: path.resolve(__dirname, '../.env') });

// Initialize the Chroma vector store
const embeddings = new OpenAIEmbeddings({
    model: "text-embedding-3-small",
    apiKey: process.env.OPENAI_API_KEY || ""
});

const vectorStore = new Chroma(embeddings, {
    collectionName: "uw-courses-test",
    url: "http://localhost:8080", // Optional, will default to this value
    collectionMetadata: {
      "hnsw:space": "cosine",
    }, // Optional, can be used to specify the distance method of the embedding space https://docs.trychroma.com/usage-guide#changing-the-distance-function
});

export async function queryCourseData(query: string) {
    const results = await vectorStore.similaritySearch(query, 5); // Adjust the number of results as needed
    return results;
}

console.log("Querying course data..."); 
console.log("Results:", await queryCourseData("chemistry"));
