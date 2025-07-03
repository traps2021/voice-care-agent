import express from "express";
import dotenv from "dotenv";
import { Vapi } from "@vapi-ai/sdk";

dotenv.config();

const app = express();
app.use(express.json());

const vapi = new Vapi({ apiKey: process.env.VAPI_API_KEY });

async function setupAgent() {
  const agent = await vapi.createAgent({
    voice: "elevenlabs:Rachel",
    model: "gpt-4o",
    prompt: `
You are Hana, a warm and helpful care navigation assistant.
Ask for the caller's Patient ID, then use lookupPatient to fetch their case.
If unsure, escalate to a human.
Keep responses clear and short.
`,
    tools: [
      {
        name: "lookupPatient",
        description: "Lookup patient data by ID",
        parameters: {
          type: "object",
          properties: {
            id: { type: "string", description: "Patient ID" }
          },
          required: ["id"]
        },
        func: async ({ id }) => {
          const fakeDB = {
            "12345": {
              name: "John Doe",
              dischargeNotes: "Follow up with PCP in 5 days.",
              needsPriorAuth: true,
              inNetworkUrgentCare: "CityMed Urgent, 123 Main St"
            }
          };
          return fakeDB[id] || { error: "Patient not found." };
        }
      }
    ]
  });
  return agent;
}

let mainAgent;
app.get("/call", async (_, res) => {
  if (!mainAgent) mainAgent = await setupAgent();
  await vapi.call({ to: process.env.TEST_NUMBER, agentId: mainAgent.id });
  res.send("📞 Call initiated—check your phone!");
});

app.listen(3000, () =>
  console.log("🚀 Server running on port 3000. Hit '/call' to start.")
);
