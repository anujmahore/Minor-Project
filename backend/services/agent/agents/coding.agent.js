import { checkAgentLimit } from "../config/agentLimit.js"
import { getReviewFeedback } from "../config/review.js"
import { getModel } from "../config/llmModels.js"
import { deductCredits } from "../utils/deductCredits.js"

const getText = (content) => {
    if (typeof content === "string") return content
    if (Array.isArray(content)) {
        return content
            .map((part) => typeof part === "string" ? part : part?.text || "")
            .join("\n")
    }
    return content == null ? "" : String(content)
}

const getLanguage = (fileName) => {
    const extension = fileName.split(".").pop()?.toLowerCase()
    return {
        cpp: "cpp",
        cc: "cpp",
        hpp: "cpp",
        c: "c",
        py: "python",
        java: "java",
        js: "javascript",
        ts: "typescript",
        go: "go",
        rs: "rust"
    }[extension] || ""
}

export const codingAgent=async (state) => {
try {
   await checkAgentLimit(state.userId,"coding")
   const intentLlm=await getModel("intent")
   const llm=await getModel("coding")
   const reviewFeedback = getReviewFeedback(state)
   const intentRes=await intentLlm.invoke(`
    You are an intent classifier.

Return ONLY one of these values.

CODE_GENERATION
CODE_REVIEW
CODE_EXPLANATION
DEBUGGING
OPTIMIZATION
CONVERSION
DOCUMENTATION

Classify requests containing "generate", "write", "implement", or "create"
followed by a programming task as CODE_GENERATION, even when they request a
specific language such as C++.

User Request:
${state.prompt}
${reviewFeedback}
    `)
    const intent=String(intentRes.content || "").trim().toUpperCase()
    if(intent=="CODE_GENERATION"){
        const prompt=`
        You are OrchestrAI Coding Agent.

Generate exactly what the user requested.

If the request is for an algorithm, data structure, function, or standalone code
snippet (for example "binary search in C++"), generate code in the requested
language. Return one source file with an appropriate extension, such as
"main.cpp" for C++.

If the request is for a website or frontend project, use the project defaults
below and return the requested project files.

Default stack:
- HTML
- CSS
- JavaScript

Use React / Next.js / Vue ONLY if explicitly requested.

Rules:

- Never replace a requested programming language with HTML, CSS, or JavaScript.
- For a standalone code request, do not create HTML/CSS/JavaScript files.
- Responsive
- Modern UI
- CSS Variables
- Flexbox/Grid
- Smooth Scroll
- Hover Effects
- Beautiful spacing
- Single page unless user asks otherwise.

IMAGES
=========================

Always use real Unsplash images.

Never use placeholders.

Return ONLY valid JSON.

Schema:

{
  "files":[
    {
      "name":"appropriate source filename",
      "content":"..."
    }
  ]
}

Rules:

- Output must start with {
- Output must end with }
- No markdown
- No explanation
- No extra text
- No \`\`\`
- Never mention intent

User Request:
${state.prompt}
${reviewFeedback}
        ` 
        const res=await llm.invoke(prompt)
        const data=JSON.parse(getText(res.content))
        if (!Array.isArray(data.files) || data.files.length === 0 ||
            data.files.some((file) => !file || typeof file.name !== "string" ||
                typeof file.content !== "string")) {
            throw new Error("Coding agent returned an invalid file list")
        }
        await deductCredits(state.userId,"coding")

        const isStandaloneCode = data.files.length === 1 &&
            !["index.html", "style.css", "script.js"].includes(data.files[0].name)
        const aiResponse = isStandaloneCode
            ? `Here is the generated code:\n\n\`\`\`${getLanguage(data.files[0].name)}\n${data.files[0].content}\n\`\`\``
            : "Code Generated Successfully."
        
        return {
            ...state,
            aiResponse,
            artifacts:[
                {
                    id:Date.now(),
                    type:"Project",
                    files:data.files || [],
                    title:state.prompt
                }
            ]
        }
    }

    const res=await llm.invoke(`
        The user's request is:

${intent}

Return Markdown only.

Never generate project files.

Use headings like:

# Overview

## Explanation

## Problems

## Improvements

## Best Practices

## Optimized Code (if needed)

User Request:

${state.prompt}
${reviewFeedback}
        `)

   const data=res.content   
   await deductCredits(state.userId,"coding")
   
   return {
    ...state,
    aiResponse:data,
    artifacts:[]
   }  
} catch (error) {
   console.log(error)
         return {
            ...state,
            aiResponse:error?.data?.message || "failed to generate code",
            artifacts:[]
        }
}
  
}