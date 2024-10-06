import { getCourseDataForChroma } from "./course-document-fetcher";

// Example of using the course document fetcher script to get the course data needed for chromadb document.
try {
    const chromaData = await getCourseDataForChroma();
    console.log(chromaData);
} catch (error) {
    console.error('There was an error running the fetching script: ', error);
}
