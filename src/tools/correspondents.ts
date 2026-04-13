import { McpServer } from "@modelcontextprotocol/sdk/server/mcp";
import { z } from "zod";
import { PaperlessAPI } from "../api/PaperlessAPI";
import {
  enhanceMatchingAlgorithm,
  enhanceMatchingAlgorithmArray,
} from "../api/utils";
import { withErrorHandling } from "./utils/middlewares";
import { buildQueryString } from "./utils/queryString";

export function registerCorrespondentTools(
  server: McpServer,
  api: PaperlessAPI
) {
  server.tool(
    "list_correspondents",
    "List all correspondents with optional filtering and pagination. Correspondents represent entities that send or receive documents.",
    {
      page: z.number().optional(),
      page_size: z.number().optional(),
      name__icontains: z.string().optional(),
      name__iendswith: z.string().optional(),
      name__iexact: z.string().optional(),
      name__istartswith: z.string().optional(),
      ordering: z.string().optional(),
    },
    withErrorHandling(async (args, extra) => {
      if (!api) throw new Error("Please configure API connection first");
      const queryString = buildQueryString(args);
      const response = await api.getCorrespondents(queryString);
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
    "get_correspondent",
    "Get a specific correspondent by ID with full details including matching rules.",
    { id: z.number() },
    withErrorHandling(async (args, extra) => {
      if (!api) throw new Error("Please configure API connection first");
      const response = await api.getCorrespondent(args.id);
      const enhancedCorrespondent = enhanceMatchingAlgorithm(response);
      return {
        content: [
          { type: "text", text: JSON.stringify(enhancedCorrespondent) },
        ],
      };
    })
  );

  // DISABLED: All write/mutate tools commented out for read-only mode.
  // server.tool("create_correspondent", ...);
  // server.tool("update_correspondent", ...);
  // server.tool("delete_correspondent", ...);
  // server.tool("bulk_edit_correspondents", ...);
}
