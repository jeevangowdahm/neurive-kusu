import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

interface ChatRequest {
  message: string;
  history?: ChatMessage[];
}

// Mock streaming chat responses for demo without requiring API keys
function mockStreamResponse(message: string): string[] {
  const responses: Record<string, string[]> = {
    "survey": [
      "I found information about ",
      "survey settlement records in Karnataka archives. ",
      "These are important historical documents from ",
      "the British colonial era that document land ownership ",
      "and revenue details across districts like Mysuru and Bengaluru."
    ],
    "land": [
      "Land-related documents in our archives include ",
      "revenue records, property deeds, and settlement papers. ",
      "These documents span from the 19th century to modern times ",
      "and cover all 30 districts of Karnataka, providing valuable ",
      "information about historical land transactions and ownership patterns."
    ],
    "default": [
      "Based on your query, I searched through ",
      "over 1 million archival records in the Karnataka archives. ",
      "The documents provide insights into the state's history across ",
      "multiple categories including land records, court judgments, ",
      "temple grants, and administrative documents."
    ]
  };

  const lowerMsg = message.toLowerCase();
  let responseChunks = responses.default;

  if (lowerMsg.includes("survey")) responseChunks = responses.survey;
  else if (lowerMsg.includes("land") || lowerMsg.includes("property")) responseChunks = responses.land;

  return responseChunks;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const body: ChatRequest = await req.json();
    const { message, history = [] } = body;

    if (!message || !message.trim()) {
      return new Response(
        JSON.stringify({ error: "Message is required" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // For streaming, return chunks of the response
    const chunks = mockStreamResponse(message);

    // Create a readable stream that emits chunks with delays
    const stream = new ReadableStream({
      async start(controller) {
        try {
          for (const chunk of chunks) {
            controller.enqueue(
              new TextEncoder().encode(
                JSON.stringify({ content: chunk, done: false }) + "\n"
              )
            );
            // Small delay between chunks for realistic streaming effect
            await new Promise(resolve => setTimeout(resolve, 100));
          }
          // Send final message to signal completion
          controller.enqueue(
            new TextEncoder().encode(
              JSON.stringify({ content: "", done: true }) + "\n"
            )
          );
          controller.close();
        } catch (err) {
          controller.error(err);
        }
      },
    });

    return new Response(stream, {
      headers: {
        ...corsHeaders,
        "Content-Type": "application/x-ndjson",
        "Transfer-Encoding": "chunked",
      },
    });
  } catch (err) {
    const error = err instanceof Error ? err.message : String(err);
    return new Response(
      JSON.stringify({ error }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
