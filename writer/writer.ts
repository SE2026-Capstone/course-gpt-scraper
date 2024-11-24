import { Chroma } from "@langchain/community/vectorstores/chroma";
import { getCourseDataForChroma, type ChromaDocumentData } from "../fetcher/course-document-fetcher";
import type { Document } from "@langchain/core/documents";
import { OpenAIEmbeddings } from "@langchain/openai";
import fs from "fs";
import path from "path";
import dotenv from "dotenv";

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, "../.env") });

// Initialize the embeddings
const embeddings = new OpenAIEmbeddings({
    model: "text-embedding-3-small",
    apiKey: process.env.OPENAI_API_KEY || "",
});

// Initialize Chroma vector store
const vectorStore = new Chroma(embeddings, {
    collectionName: "uw-courses-test-4",
    url: "http://localhost:8000",
    collectionMetadata: {
        "hnsw:space": "cosine",
    },
});

const dataFilePath = path.join(__dirname, "../", "course-data.json");

// Fetch and store course data locally
async function fetchAndStoreCourseData() {
    console.log("Fetching course data...");
    const courseData = await getCourseDataForChroma();
    console.log("Course data fetched:", courseData);

    fs.writeFileSync(dataFilePath, JSON.stringify(courseData, null, 2));
    console.log("Course data stored in course-data.json");

    return courseData;
}

// Retrieve course data locally or fetch fresh data
async function getCourseData() {
    if (fs.existsSync(dataFilePath)) {
        console.log("Reading course data from course-data.json");
        const courseData = JSON.parse(fs.readFileSync(dataFilePath, "utf-8"));
        return courseData;
    } else {
        return await fetchAndStoreCourseData();
    }
}

// Sanitize text for documents
const sanitize = (text: string) => {
    if (text === "") return " ";
    return text.replace(/\r?\n|\r/g, ""); // Remove newlines
};

// Main execution
(async () => {
    try {
        let ids = 1;

        // Fetch course data
        const courseData = await getCourseData();
        console.log("Done fetching course data.");

        // Prepare documents
        const documents: Document[] = courseData.map((course: ChromaDocumentData) => {
            return {
                pageContent: sanitize(course.documentData),
                metadata: { id: course.id, metadata: course.metadata.courseName },
            };
        });
        console.log("Prepared documents:", JSON.stringify(documents, null, 2));

        // Generate numeric IDs
        const idsArray = courseData.map((_, index) => `${index + 1}`);
        console.log("Generated numeric IDs:", idsArray);

        // Verify alignment
        console.log("Number of documents:", documents.length);
        console.log("Number of IDs:", idsArray.length);

        // Add documents to Chroma
        console.log("Adding documents to Chroma...");
        const response = await vectorStore.addDocuments(documents, { ids: idsArray });
        console.log("addDocuments response:", response);

        // Query the collection to verify added documents
        console.log("Querying collection to verify...");
        const queryResult = await vectorStore.similaritySearch("Artificial Intelligence courses in the CS department offered in third year", 5);
        console.log("Query result:", JSON.stringify(queryResult, null, 2));
    } catch (error: unknown) {
        console.error("An error occurred during execution.");
        if (error instanceof Error) {
            console.error("Error message:", error.message);
            console.error("Stack trace:", error.stack);
        } else if (typeof error === "object" && error !== null && "response" in error) {
            const responseError = error as { response: { status: number; data: any } };
            console.error("Response status:", responseError.response.status);
            console.error("Response data:", responseError.response.data);
        } else {
            console.error("Unknown error type:", JSON.stringify(error));
        }
    }
})();
