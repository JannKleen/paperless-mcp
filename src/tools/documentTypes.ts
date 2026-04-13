import { McpServer } from "@modelcontextprotocol/sdk/server/mcp";
import { z } from "zod";
import { PaperlessAPI } from "../api/PaperlessAPI";
import {
  enhanceMatchingAlgorithm,
  enhanceMatchingAlgorithmArray,
} from "../api/utils";
import { withErrorHandling } from "./utils/middlewares";
import { buildQueryString } from "./utils/queryString";

export function registerDocumentTypeTools(
  server: McpServer,
  api: PaperlessAPI
) {
  server.tool(
    "list_document_types",
    "List all document types. IMPORTANT: When a user query may refer to a document type or tag, you should fetch all document types and all tags up front (with a large enough page_size), cache them for the session, and search locally for matches by name or slug before making further API calls. This reduces redundant requests and handles ambiguity between tags and document types efficiently.",
    {
      page: z.number().optional(),
      page_size: z.number().optional(),
      name__icontains: z.string().optional(),
      name__iendswith: z.string().optional(),
      name__iexact: z.string().optional(),
      name__istartswith: z.string().optional(),
      ordering: z.string().optional(),
    },
    withErrorHandling(async (args = {}, extra) => {
      if (!api) throw new Error("Please configure API connection first");
      const queryString = buildQueryString(args);
      const response = await api.request(
        `/document_types/${queryString ? `?${queryString}` : ""}`
      );
      const enhancedResults = enhanceMatchingAlgorithmArray(
        response.results || []
      );
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify({
              ...response,
              results: enhancedResults,
            }),
          },
        ],
      };
    })
  );

  server.tool(
    "get_document_type",
    "Get a specific document type by ID with full details including matching rules.",
    { id: z.number() },
    withErrorHandling(async (args, extra) => {
      if (!api) throw new Error("Please configure API connection first");
      const response = await api.request(`/document_types/${args.id}/`);
      const enhancedDocumentType = enhanceMatchingAlgorithm(response);
      return {
        content: [{ type: "text", text: JSON.stringify(enhancedDocumentType) }],
      };
    })
  );

  // DISABLED: All write/mutate tools commented out for read-only mode.
  // server.tool("create_document_type", ...);
  // server.tool("update_document_type", ...);
  // server.tool("delete_document_type", ...);
  // server.tool("bulk_edit_document_types", ...);
}
