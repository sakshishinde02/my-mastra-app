import { createTool } from "@mastra/core/tools";
import { z } from "zod";
import { pool } from "../db"; // assuming you exported your pg.Pool in db.ts

const inputSchema = z.object({
  query: z.string().describe("User question or keywords to search in shareholder letters"),
});

export const berkshireTool = createTool({
  id: "berkshire_retriever",
  description: "Retrieve relevant chunks from mdocument in Postgres for financial questions.",
  inputSchema,
  outputSchema: z.object({
    message: z.string(),
    chunks: z.array(
      z.object({
        text: z.string(),
        source: z.string(),
        year: z.number(),
        chunk_index: z.number(),
      })
    ),
  }),
  execute: async (context) => {
    // context.input is the parsed validated input
    const { query } = context.input;

    const res = await pool.query(
      `SELECT text, source, year, chunk_index
       FROM mdocument
       WHERE text ILIKE $1
       LIMIT 5`,
      [`%${query}%`]
    );

    if (res.rows.length === 0) {
      return {
        message: "No relevant chunks found in the shareholder letters.",
        chunks: [],
      };
    }

    return {
      message: "Results found",
      chunks: res.rows.map((row) => ({
        text: row.text,
        source: row.source,
        year: row.year,
        chunk_index: row.chunk_index,
      })),
    };
  },
});
