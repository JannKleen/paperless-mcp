import { McpServer } from "@modelcontextprotocol/sdk/server/mcp";
import { z } from "zod";
import { PaperlessAPI } from "../api/PaperlessAPI";
import { withErrorHandling } from "./utils/middlewares";
import { buildQueryString } from "./utils/queryString";

export function registerCustomFieldTools(server: McpServer, api: PaperlessAPI) {
  server.tool(
    "list_custom_fields",
    "List all custom fields. IMPORTANT: When a user query may refer to a custom field, you should fetch all custom fields up front (with a large enough page_size), cache them for the session, and search locally for matches by name before making further API calls. This reduces redundant requests and handles ambiguity efficiently.",
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
      const response = await api.request(
        `/custom_fields/${queryString ? `?${queryString}` : ""}`
      );
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(response),
          },
        ],
      };
    })
  );

  server.tool(
    "get_custom_field",
    "Get a specific custom field by ID with full details including data type and extra configuration.",
    { id: z.number() },
    withErrorHandling(async (args, extra) => {
      if (!api) throw new Error("Please configure API connection first");
      const response = await api.getCustomField(args.id);
      return {
        content: [{ type: "text", text: JSON.stringify(response) }],
      };
    })
  );

  // DISABLED: All write/mutate tools commented out for read-only mode.
  // server.tool("create_custom_field", ...);
  // server.tool("update_custom_field", ...);
  // server.tool("delete_custom_field", ...);
  // server.tool("bulk_edit_custom_fields", ...);
} 