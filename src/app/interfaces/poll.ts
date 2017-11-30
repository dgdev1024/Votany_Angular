export interface PollChoice {
    choiceId: string,
    body: string,
    votes: number
}

export interface EditedChoice {
    choiceId: string,
    body: string
}

export interface PollComment {
    commentId: string,
    authorId: string,
    authorName: string,
    body: string,
    postDate: Date,
    postDateStr?: string,
    deleted?: boolean
}

export interface Poll {
    pollUrl: string,
    authorId: string,
    authorName: string,
    postDate: Date,
    postDateStr?: string,
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
    removedChoices?: string[],
    editedChoices?: EditedChoice[],
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
    postDateStr?: string,
    voteCount: number,
    commentCount: number,
    editCount: number,
    closed: boolean
}