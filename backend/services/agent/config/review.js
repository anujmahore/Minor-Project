export const getReviewFeedback = (state) => {
    if (!state.reviewFeedback) {
        return ""
    }

    return `
Reviewer feedback from the previous attempt:
${state.reviewFeedback}

Revise the response to address this feedback. Do not mention the reviewer or the revision process.
`
}
