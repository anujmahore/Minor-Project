import { Annotation } from "@langchain/langgraph";


export const agentState=Annotation.Root({
    prompt:Annotation(),
    aiResponse:Annotation(),
    agent:Annotation(),
    conversationId:Annotation(),
    searchResults:Annotation(),
    images:Annotation(),
    artifacts:Annotation(),
    reviewStatus:Annotation(),
    reviewFeedback:Annotation(),
    retryCount:Annotation({
        reducer: (_, value) => value,
        default: () => 0
    }),
    maxRetries:Annotation({
        reducer: (_, value) => value,
        default: () => 2
    }),
    userId:Annotation(),
    file:Annotation()
})  
