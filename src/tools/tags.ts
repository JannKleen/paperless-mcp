import { McpServer } from "@modelcontextprotocol/sdk/server/mcp";
import { z } from "zod";
import { PaperlessAPI } from "../api/PaperlessAPI";
import {
  enhanceMatchingAlgorithmArray,
} from "../api/utils";
import { withErrorHandling } from "./utils/middlewares";
import { buildQueryString } from "./utils/queryString";

export function registerTagTools(server: McpServer, api: PaperlessAPI) {
  server.tool(
    "list_tags",
    "List all tags. IMPORTANT: When a user query may refer to a tag or document type, you should fetch all tags and all document types up front (with a large enough page_size), cache them for the session, and search locally for matches by name or slug before making further API calls. This reduces redundant requests and handles ambiguity between tags and document types efficiently.",
    {
      page: z.number().optional(),
      page_size: z.number().optional(),
      name__icontains: z.string().optional(),
      name__iendswith: z.string().optional(),
      name__iexact: z.string().optional(),
      name__istartswith: z.string().optional(),
      ordering: z.string().optional(),
    },
    withErrorHandling(async (args = {}) => {
      if (!api) throw new Error("Please configure API connection first");
      const queryString = buildQueryString(args);
      const tagsResponse = await api.request(
        `/tags/${queryString ? `?${queryString}` : ""}`
      );
      const enhancedResults = enhanceMatchingAlgorithmArray(
        tagsResponse.results || []
      );
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify({
              ...tagsResponse,
              results: enhancedResults,
            }),
          },
        ],
      };
    })
  );

  // DISABLED: All write/mutate tools commented out for read-only mode.
  // server.tool("create_tag", ...);
  // server.tool("update_tag", ...);
  // server.tool("delete_tag", ...);
  // server.tool("bulk_edit_tags", ...);
}
