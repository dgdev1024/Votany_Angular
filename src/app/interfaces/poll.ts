export interface PollChoice {
    choiceId: string,
    body: string,
    votes: number
}

export interface PollComment {
    commentId: string,
    authorId: string,
    authorName: string,
    body: string,
    postDate: Date,
    deleted?: boolean
}

export interface Poll {
    authorId: string,
    authorName: string,
    postDate: Date,
    issue: string,
    choices: PollChoice[],
    choiceVotedFor: string,
    requiresLogin: boolean,
    canAddExtraChoices: boolean,
    pollWillClose: boolean,
    closeDate: Date,
    closed: boolean,
    searchKeywords: string,
    edited: boolean,
    editCount: number,
    isAuthor: boolean,
    hasVoted: boolean
}

export interface PollEditorOptions {
    issue: string,
    choices: string[],
    keywords: string,
    requiresLogin: boolean,
    canAddExtraChoices: boolean,
    pollWillClose: boolean,
    closeDate?: Date
}

export interface PollSearchResult {
    pollId: string,
    issue: string,
    authorId: string,
    authorName: string,
    postDate: Date,
    voteCount: number,
    commentCount: number,
    editCount: number,
    closed: boolean
}