import { getModel } from "../config/llmModels.js"
import { GoogleGenAI } from "@google/genai"
import { uploadToStorage } from "../utils/uploadToStorage.js"
import { getFromStorage } from "../utils/getFromStorage.js"
import { deductCredits } from "../utils/deductCredits.js"
import { checkAgentLimit } from "../config/agentLimit.js"
import { getReviewFeedback } from "../config/review.js"

const getText = (content) => {
    if (typeof content === "string") return content
    if (Array.isArray(content)) {
        return content
            .map((part) => typeof part === "string" ? part : part?.text || "")
            .join("\n")
    }
    return content == null ? "" : String(content)
}

export const visionAgent=async (state) => {

    try {
        await checkAgentLimit(state.userId,"image")
        const llm=await getModel("image")
        const res=await llm.invoke(`
        You are an elite AI image prompt engineer.

Convert the user request into a highly detailed image generation prompt.

Requirements:

- Cinematic lighting
- Professional composition
- Ultra realistic
- High detail
- Beautiful color palette
- Sharp focus
- 8K quality
- Photorealistic
- Depth of field
- Professional photography
- Stunning visuals

Return only the image prompt.

User Request:
${state.prompt}
${getReviewFeedback(state)}

        `)

        const prompt=getText(res.content).trim()
        if (!prompt) {
            throw new Error("Image prompt generation returned an empty prompt")
        }

        if (!process.env.GOOGLE_API_KEY) {
            throw new Error("GOOGLE_API_KEY is not configured")
        }

        const ai = new GoogleGenAI({
            apiKey: process.env.GOOGLE_API_KEY
        })
        const interaction = await ai.interactions.create({
            model: process.env.GEMINI_IMAGE_MODEL || "gemini-nano-banana-2.1",
            input: prompt
        })
        const generatedImage = interaction.output_image
        if (!generatedImage?.data) {
            throw new Error("Gemini did not return an image")
        }

        const mimeType = generatedImage.mime_type || "image/png"
        const extension = mimeType === "image/jpeg" ? "jpg" : "png"
        const buffer = Buffer.from(generatedImage.data, "base64")
        const filename=`image-${Date.now()}.${extension}`

        await deductCredits(state.userId,"vision")
        await uploadToStorage(filename,buffer,mimeType)
        const downloadUrl=await getFromStorage(filename,24*60)

        return {
            ...state,
            aiResponse:`
![Generated Image](${downloadUrl})

📥 [Download Image](${downloadUrl})

⏳ Link expires in 10 minutes.`
        }
    } catch (error) {
       console.error("Image generation failed:", {
           message: error?.message
       })
         return {
            ...state,
            aiResponse: "Image generation failed. Please check the Gemini configuration and try again."
        }
    }
   


}
