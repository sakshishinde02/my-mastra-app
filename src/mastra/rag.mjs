export default {
  async ingest({ request, response }) {
    try {
      const data = await request.json();
      console.log("✅ Received text:", data.text.slice(0, 100), "...");
      console.log("✅ Metadata:", data.metadata);

      response.status(200).json({ status: "ok", received: true });
    } catch (err) {
      console.error("❌ Error in ingest handler:", err);
      response.status(500).json({ error: "internal server error" });
    }
  },
};
