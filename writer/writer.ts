import { Chroma } from "@langchain/community/vectorstores/chroma";
import { getCourseDataForChroma, type ChromaDocumentData } from "../fetcher/course-document-fetcher";
import type { Document } from "@langchain/core/documents";
import { OpenAIEmbeddings } from "@langchain/openai";
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config({ path: path.resolve(__dirname, '../.env') });

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
  
const dataFilePath = path.join(__dirname, '../', 'course-data.json');

async function fetchAndStoreCourseData() {
    console.log("Fetching course data...");
    const courseData = await getCourseDataForChroma();
    console.log("Course data fetched:", courseData);

    fs.writeFileSync(dataFilePath, JSON.stringify(courseData, null, 2));
    console.log("Course data stored in courseData.json");

    return courseData;
}

// get course data locally so we don't have to keep pulling from uwaterloo api
async function getCourseData() {
    if (fs.existsSync(dataFilePath)) {
        console.log("Reading course data from courseData.json");
        const courseData = JSON.parse(fs.readFileSync(dataFilePath, 'utf-8'));
        return courseData;
    } else {
        return await fetchAndStoreCourseData();
    }
}

// Method for removing empty strings. Documents are not allowed to have empty strings, OpenAI complains.
const sanitize = (text: string) => {
  if (text === "") return " ";
  return text.replace(/\r?\n|\r/g, ''); // Remove newlines
}

let ids = 1;

const courseData = await getCourseData();
console.log("Done fetching course data.");

const documents: Document[] = courseData.map((course: ChromaDocumentData) => {
    return {
        pageContent: sanitize(course.documentData),
        metadata: { id: course.id, metadata: course.metadata.courseName },
    };
});

console.log("Adding documents...");
// addDocuments() Ensures that a collection exists in the Chroma database. If the collection does not exist, it is created.
await vectorStore.addDocuments(documents, { ids: courseData.map(() => `${ids++}`) });
console.log("Done adding documents.");


