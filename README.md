# course-gpt-scraper

To install dependencies:

```bash
bun install
```

To run:

```bash
bun run index.ts
```

This project was created using `bun init` in bun v1.1.29. [Bun](https://bun.sh) is a fast all-in-one JavaScript runtime.


To run ChromaDB Instance Locally:

Run the following commands:
```
docker pull chromadb/chroma
docker run -p 8000:8000 chromadb/chroma
```

You should have it up and running. Double check with a
```
docker ps
```

If you run into any issues: Contact Jerome :D