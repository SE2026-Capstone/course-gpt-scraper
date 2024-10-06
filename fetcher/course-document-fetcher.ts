const API_KEY = process.env.UWATERLOO_API_KEY;

// This defines the interface for the data within a ChromaDB document, to be consumed by the writer script.
export interface ChromaDocumentData {
    id: string; // Course code.
    metadata: { [key: string]: string }; // Metadata object (only course name for now).
    documentData: string; // Course description.
};

// Represents a term (simply a term code for now).
interface Term {
    termCode: string;
}

// This contains all info needed from a course in order to construct the ChromaDocumentData.
interface Course {
    subjectCode: string;
    catalogNumber: string;
    title: string;
    description: string;
};

// Helps check if the API key is valid in case it is not set.
function isApiKeyValid(apiKey: string): boolean {
    const apiKeyPattern = /^[A-Fa-f0-9]{32}$/;
    return apiKeyPattern.test(apiKey);
}

// Since the UWaterloo api needs a termCode for getting the courses (ex. /v3/Courses/{termCode} endpoint),
// we need to get the most recent term code. This will be done by hitting the /v3/Terms/current endpoint.
// Note: the current term code will allow us to see ALL courses offered by the university at that point.
async function getMostRecentTermCode(): Promise<string> {
    try {
        if (!isApiKeyValid(API_KEY)) {
            throw new Error('API key is invalid / not set correctly');
        }

        const recentTermHttpResponse = await fetch('https://openapi.data.uwaterloo.ca/v3/Terms/current', {
            method: 'GET',
            headers: {
                'x-api-key': API_KEY,
            },
        });

        if (!recentTermHttpResponse.ok) {
            throw new Error('/v3/Terms/current GET request failed');
        }

        const recentTermData: Term = await recentTermHttpResponse.json();
        // console.info('Recent term json data:');
        // console.info(recentTermData);

        const recentTermCode = recentTermData.termCode;
        // console.info(`Recent term code: ${recentTermCode}`);

        return recentTermCode;
    } catch (error) {
        console.error('Error in fetching term data', error);

        throw error;
    }
}

// Once we have the recent term code, we need to hit the /v3/Courses/{termCode} endpoint in order to
// get all the courses offered and their data.
async function getCourseDataForRecentTerm(recentTermCode: string): Promise<Course[]> {
    try {
        const coursesHttpResponse = await fetch(`https://openapi.data.uwaterloo.ca/v3/Courses/${recentTermCode}`, {
            method: 'GET',
            headers: {
                'x-api-key': API_KEY,
            },
        });

        if (!coursesHttpResponse.ok) {
            throw new Error(`/v3/Courses/${recentTermCode} GET request failed`);
        }

        const courseData: Course[] = await coursesHttpResponse.json();

        return courseData;
    } catch (error) {
        console.error('Error in fetching course data', error);

        throw error;
    }
}

async function formatCourseDataForChroma(unformattedCourseData: Course[]): Promise<ChromaDocumentData[]> {
    const formattedData: ChromaDocumentData[] = unformattedCourseData.map((course): ChromaDocumentData => {
        return {
            id: course.subjectCode + " " + course.catalogNumber,
            metadata: {
                courseName: course.title,
            },
            documentData: course.description
        };
    });

    return formattedData;
}

// Driver for this script which can be exported / called by the chroma db writer script to fetch document data.
export async function getCourseDataForChroma(): Promise<ChromaDocumentData[]> {
    try {
        const recentTermCode = await getMostRecentTermCode();

        const recentTermCourseData = await getCourseDataForRecentTerm(recentTermCode);
    
        const formattedData = await formatCourseDataForChroma(recentTermCourseData);
    
        return formattedData;
    } catch(error) {
        console.error('Script failed to run: ', error);

        throw error;
    }
}
