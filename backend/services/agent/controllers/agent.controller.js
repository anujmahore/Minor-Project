import axios from "axios"
import fs from "fs/promises"
import { graph } from "../graph/graph.js"
import { addMessage } from "../config/memory.js"
import redis from "../../../shared/redis/redis.js"


export const agent=async (req,res,next) => {
    try {
        const {prompt,conversationId,agent}=req.body
        const file=req.file
        console.log("file",file)
        const userId=req.headers["x-user-id"]
        await axios.post(`${process.env.CHAT_SERVICE}/save-message`,{
            conversationId,role:"user",content:prompt
        })
        const result=await graph.invoke({
            prompt,conversationId,agent,userId,file,
            maxRetries:Number(process.env.MAX_REVIEW_RETRIES || 2)
        })
        console.log("result",result)
       await addMessage(conversationId,"user",prompt)
        await addMessage(conversationId,"assistant",result.aiResponse)
        await axios.post(`${process.env.CHAT_SERVICE}/save-message`,{
            conversationId,role:"assistant",content:result?.aiResponse,images:result?.images,artifacts:result?.artifacts
        })
        return res.status(200).json({
            answer:result?.aiResponse,
            images:result?.images,
            artifacts:result?.artifacts,
            reviewStatus:result?.reviewStatus || "not-run"
        })
       
    } catch (error) {
       next(error)
    } finally {
       if (file?.path) {
          await fs.unlink(file.path).catch(() => {})
       }
    }
}
