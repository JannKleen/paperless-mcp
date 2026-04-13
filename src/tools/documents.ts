import { McpServer } from "@modelcontextprotocol/sdk/server/mcp";
import { z } from "zod";
import { convertDocsWithNames } from "../api/documentEnhancer";
import { PaperlessAPI } from "../api/PaperlessAPI";
import { withErrorHandling } from "./utils/middlewares";

export function registerDocumentTools(server: McpServer, api: PaperlessAPI) {
  // DISABLED: All write/mutate tools commented out for read-only mode.
  // To re-enable, uncomment the tool registrations below.

  // server.tool("bulk_edit_documents", ...);
  // server.tool("post_document", ...);

  server.tool(
    "list_documents",
    "List and filter documents by fields such as title, correspondent, document type, tag, storage path, creation date, and more. IMPORTANT: For queries like 'the last 3 contributions' or when searching by tag, correspondent, document type, or storage path, you should FIRST use the relevant tool (e.g., 'list_tags', 'list_correspondents', 'list_document_types', 'list_storage_paths') to find the correct ID, and then use that ID as a filter here. Only use the 'search' argument for free-text search when no specific field applies. Using the correct ID filter will yield much more accurate results. Note: Document content is excluded from results by default. Use 'get_document_content' to retrieve content when needed.",
    {
      page: z.number().optional(),
      page_size: z.number().optional(),
      search: z.string().optional(),
      correspondent: z.number().optional(),
      document_type: z.number().optional(),
      tag: z.number().optional(),
      storage_path: z.number().optional(),
      created__date__gte: z.string().optional(),
      created__date__lte: z.string().optional(),
      ordering: z.string().optional(),
    },
    withErrorHandling(async (args, extra) => {
      if (!api) throw new Error("Please configure API connection first");
      const query = new URLSearchParams();
      if (args.page) query.set("page", args.page.toString());
      if (args.page_size) query.set("page_size", args.page_size.toString());
      if (args.search) query.set("search", args.search);
      if (args.correspondent)
        query.set("correspondent__id", args.correspondent.toString());
      if (args.document_type)
        query.set("document_type__id", args.document_type.toString());
      if (args.tag) query.set("tags__id", args.tag.toString());
      if (args.storage_path)
        query.set("storage_path__id", args.storage_path.toString());
      if (args.created__date__gte) query.set("created__date__gte", args.created__date__gte);
      if (args.created__date__lte) query.set("created__date__lte", args.created__date__lte);
      if (args.ordering) query.set("ordering", args.ordering);

      const docsResponse = await api.getDocuments(
        query.toString() ? `?${query.toString()}` : ""
      );
      return convertDocsWithNames(docsResponse, api);
    })
  );

  server.tool(
    "get_document",
    "Get a specific document by ID with full details including correspondent, document type, tags, and custom fields. Note: Document content is excluded from results by default. Use 'get_document_content' to retrieve content when needed.",
    {
      id: z.number(),
    },
    withErrorHandling(async (args, extra) => {
      if (!api) throw new Error("Please configure API connection first");
      const doc = await api.getDocument(args.id);
      return convertDocsWithNames(doc, api);
    })
  );

  server.tool(
    "get_document_content",
    "Get the text content of a specific document by ID. Use this when you need to read or analyze the actual document text.",
    {
      id: z.number(),
    },
    withErrorHandling(async (args, extra) => {
      if (!api) throw new Error("Please configure API connection first");
      const doc = await api.getDocument(args.id);
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify({
              id: doc.id,
              title: doc.title,
              content: doc.content,
            }),
          },
        ],
      };
    })
  );

  server.tool(
    "search_documents",
    "Full text search for documents. This tool is for searching document content, title, and metadata using a full text query. For general document listing or filtering by fields, use 'list_documents' instead. Note: Document content is excluded from results by default. Use 'get_document_content' to retrieve content when needed.",
    {
      query: z.string(),
    },
    withErrorHandling(async (args, extra) => {
      if (!api) throw new Error("Please configure API connection first");
      const docsResponse = await api.searchDocuments(args.query);
      return convertDocsWithNames(docsResponse, api);
    })
  );

  server.tool(
    "download_document",
    "Download a document file by ID. Returns the document as a base64-encoded resource.",
    {
      id: z.number(),
      original: z.boolean().optional(),
    },
    withErrorHandling(async (args, extra) => {
      if (!api) throw new Error("Please configure API connection first");
      const response = await api.downloadDocument(args.id, args.original);
      const filename =
        (typeof response.headers.get === "function"
          ? response.headers.get("content-disposition")
          : response.headers["content-disposition"]
        )
          ?.split("filename=")[1]
          ?.replace(/"/g, "") || `document-${args.id}`;
      return {
        content: [
          {
            type: "resource",
            resource: {
              uri: filename,
              blob: Buffer.from(response.data).toString("base64"),
              mimeType: "application/pdf",
            },
          },
        ],
      };
    })
  );

  server.tool(
    "get_document_thumbnail",
    "Get a document thumbnail (image preview) by ID. Returns the thumbnail as a base64-encoded WebP image resource.",
    {
      id: z.number(),
    },
    withErrorHandling(async (args, extra) => {
      if (!api) throw new Error("Please configure API connection first");
      const response = await api.getThumbnail(args.id);
      return {
        content: [
          {
            type: "resource",
            resource: {
              uri: `document-${args.id}-thumb.webp`,
              blob: Buffer.from(response.data).toString("base64"),
              mimeType: "image/webp",
            },
          },
        ],
      };
    })
  );

  // server.tool("update_document", ...);
}
