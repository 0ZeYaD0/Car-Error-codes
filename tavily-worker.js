/**
 * Cloudflare Worker — Tavily proxy
 * -------------------------------
 * Keeps your Tavily API key secret on the server.
 * The public web page calls THIS worker instead of Tavily directly.
 *
 * Setup:
 * 1. Go to https://dash.cloudflare.com -> Workers & Pages -> Create -> Worker
 * 2. Paste this code in, replacing the default.
 * 3. Go to Settings -> Variables -> add a secret named TAVILY_API_KEY
 *    with your real Tavily key as the value.
 * 4. Deploy. You'll get a URL like https://your-worker-name.yoursubdomain.workers.dev
 * 5. Put that URL in the front-end (see index.html changes).
 */

export default {
  async fetch(request, env) {
    // Allow the browser to call this worker from any page (CORS)
    const corsHeaders = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    };

    if (request.method === "OPTIONS") {
      return new Response(null, { headers: corsHeaders });
    }

    if (request.method !== "POST") {
      return new Response("Method not allowed", { status: 405, headers: corsHeaders });
    }

    try {
      const body = await request.json();

      const tavilyRes = await fetch("https://api.tavily.com/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          api_key: env.TAVILY_API_KEY, // secret, never exposed to the browser
          query: body.query,
          search_depth: "advanced",
          include_answer: "advanced",
          max_results: 5
        })
      });

      const data = await tavilyRes.json();

      return new Response(JSON.stringify(data), {
        headers: { "Content-Type": "application/json", ...corsHeaders }
      });

    } catch (err) {
      return new Response(JSON.stringify({ error: err.message }), {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders }
      });
    }
  }
};
