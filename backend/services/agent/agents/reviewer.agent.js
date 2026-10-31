import { getModel } from "../config/llmModels.js"

const getText = (content) => {
    if (typeof content === "string") return content
    if (Array.isArray(content)) {
        return content
            .map((part) => typeof part === "string" ? part : part?.text || "")
            .join("\n")
    }
    return content == null ? "" : String(content)
}

export const reviewerAgent = async (state) => {
    const originalResponse = getText(state.aiResponse)
    if (!originalResponse.trim()) {
        console.info("Reviewer skipped: specialist response is empty")
        return { ...state, reviewStatus: "skipped" }
    }

    try {
        const llm = await getModel("reviewer")
        const artifactContext = state.artifacts?.length
            ? JSON.stringify(state.artifacts)
            : "No structured artifacts were produced."
        const searchContext = state.searchResults
            ? JSON.stringify(state.searchResults)
            : "No web search results were produced."

        const response = await llm.invoke(`
You are the independent quality reviewer for OrchestrAI. Review the specialist agent's completed response before it is shown to the user.

Specialist agent: ${state.agent}
User request: ${state.prompt}
Specialist response:
${originalResponse}

Web search context (if present, use this to check factual support):
${searchContext}

Structured artifact context (for checking consistency with the response; do not replace or expose this JSON):
${artifactContext}

Check that the response addresses the request, is clear, internally consistent, and does not claim unsupported facts. For search answers, check that claims are supported by the supplied search context when present.

Return ONLY valid JSON:
{
  "status": "approved" or "needs_revision",
  "feedback": "specific, actionable feedback for the specialist agent",
  "response": "the best current user-facing response"
}

Use "needs_revision" only when another specialist attempt is genuinely needed. Preserve every URL, download link, image link, and artifact reference exactly. Do not claim to have changed or regenerated files. Do not add commentary about the review process.
`)

        let parsed
        try {
            const content = getText(response.content).trim()
            const start = content.indexOf("{")
            const end = content.lastIndexOf("}")
            if (start === -1 || end === -1) {
                throw new Error("Reviewer did not return valid JSON")
            }
            parsed = JSON.parse(content.slice(start, end + 1))
        } catch (parseError) {
            console.error("Reviewer response parsing failed:", parseError)
            return {
                ...state,
                reviewStatus: "failed",
                reviewFeedback: ""
            }
        }

        const status = parsed.status === "needs_revision"
            ? "needs_revision"
            : "approved"
        const retryCount = status === "needs_revision"
            ? state.retryCount + 1
            : state.retryCount
        const finalStatus = status === "needs_revision" &&
            retryCount >= state.maxRetries
            ? "max-retries-reached"
            : status
        const reviewedResponse = getText(parsed.response).trim() || originalResponse
        console.info(`Reviewer completed for ${state.agent || "unknown"} agent`)
        return {
            ...state,
            aiResponse: reviewedResponse,
            reviewStatus: finalStatus,
            reviewFeedback: finalStatus === "needs_revision" ? parsed.feedback || "" : "",
            retryCount
        }
    } catch (error) {
        // Reviewing is a quality pass; if it fails, preserve the specialist's answer.
        console.error("Reviewer agent failed:", error)
        return {
            ...state,
            aiResponse: originalResponse,
            reviewStatus: "failed"
        }
    }
}
