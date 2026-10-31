import { getModel } from "../config/llmModels.js"

export const supervisorAgent = async (state) => {
  if (state.agent && state.agent !== "auto") {
    return {
      ...state,
      agent: state.agent
    }
  }

  if (state.file) {
    if (state.file.mimetype === "application/pdf") {
      return {
        ...state,
        agent: "pdfRag"
      }
    }

    if (state.file.mimetype.startsWith("image/")) {
      return {
        ...state,
        agent: "imageAnalyzer"
      }
    }
  }

  const llm = await getModel("router")
  const prompt = `You are the Supervisor Agent for OrchestrAI.

Your responsibility is to understand the user's request and delegate it to exactly one specialized agent.

Available agents:

- chat
- search
- coding
- pdf
- ppt
- vision

Rules:

chat:
General conversation, explanations, learning and questions.

search:
Current events, latest information, news, recent developments and internet lookup.

coding:
Code generation, debugging, project building, architecture and API design.

pdf:
Requests to generate PDFs or document content.

ppt:
Requests to generate presentations or PPT content.

vision:
Requests to generate or create an image.

Return ONLY one word:
chat
search
coding
pdf
ppt
vision

User Query:
${state.prompt}
`

  const response = await llm.invoke(prompt)

  return {
    ...state,
    agent: response.content.trim().toLowerCase()
  }
}
