# course-gpt-scraper

This project was created using `bun init` in bun v1.1.29. [Bun](https://bun.sh) is a fast all-in-one JavaScript runtime.

### To run ChromaDB Instance Locally:

Run the following commands:
```
docker pull chromadb/chroma
docker run -p 8000:8000 chromadb/chroma
```

You should have the DB up and running. Double check with a `docker ps`

### Populating the DB
In the main dir, run `npm i` to install all dependencies (make sure to have the latest version of chromadb)

Next, run `cd writer` and then `bun writer.ts`. In your console, you should see UW course data fetched and upserted into the DB

