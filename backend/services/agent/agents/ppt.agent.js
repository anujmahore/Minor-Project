import { getModel } from "../config/llmModels.js"
import { generatePpt } from "../utils/generatePpt.js"
import { getFromStorage } from "../utils/getFromStorage.js"
import { uploadToStorage } from "../utils/uploadToStorage.js"
import { deductCredits } from "../utils/deductCredits.js"
import { checkAgentLimit } from "../config/agentLimit.js"
import { getReviewFeedback } from "../config/review.js"

export const pptAgent = async (state) => {
    try {
        await checkAgentLimit(state.userId, "ppt")

        const llm = await getModel("ppt")

        const prompt = `You are a professional presentation designer.

Return ONLY valid JSON.

Format:

{
"title":"",
"subtitle":"",
"slides":[
{
"title":"",
"points":[
"",
"",
"",
""
]
}
]
}

Rules:

- Generate exactly 6 content slides.
- Each slide should have 4-6 concise bullet points.
- No markdown.
- No explanation.
- No code block.
- Return ONLY JSON.

Topic:

${state.prompt}
${getReviewFeedback(state)}`

        const res = await llm.invoke(prompt)

        // Clean LLM response before JSON.parse()
        let content = res.content.trim()

        // Remove markdown code fences if model adds them
        content = content
            .replace(/^```json\s*/i, "")
            .replace(/^```\s*/i, "")
            .replace(/\s*```$/i, "")
            .trim()

        // Extract JSON object
        const start = content.indexOf("{")
        const end = content.lastIndexOf("}")

        if (start === -1 || end === -1) {
            throw new Error("LLM did not return valid JSON")
        }

        content = content.slice(start, end + 1)

        const data = JSON.parse(content)

        await deductCredits(state.userId, "ppt")

        const ppt = await generatePpt(data)

        const buffer = await ppt.write({
            outputType: "nodebuffer"
        })

        const filename = `ppt-${Date.now()}.pptx`

        await uploadToStorage(
            filename,
            buffer,
            "application/vnd.openxmlformats-officedocument.presentationml.presentation"
        )

        // 10 minutes
        const downloadUrl = await getFromStorage(
            filename,
            10 * 60
        )

        return {
            ...state,
            aiResponse: `# ✅ Presentation Generated

**${data.title}**

📥 [Download PPT](${downloadUrl})

_Link expires in 10 minutes._`
        }

    } catch (error) {
        console.log(error)

        return {
            ...state,
            aiResponse: error?.data?.message || "failed to generate ppt"
        }
    }
}