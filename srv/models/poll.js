///
/// @file   poll.js
/// @brief  The database model for our polls.
///

// Imports
const mongoose = require('mongoose');

// Choice Schema
const choiceSchema = new mongoose.Schema({
    // The choice's body. Limit 100 characters.
    body: {
        type: String,
        required: true,
        validate: {
            validator: v => v.length <= 140
        }
    },

    // An array of user IDs and IP addresses corespond to the users who
    // voted for this choice.
    voters: [String]
});

// Comment Schema
const commentSchema = new mongoose.Schema({
    // The user ID of the comment's author.
    authorId: { type: mongoose.Schema.Types.ObjectId, required: true, ref: 'user' },

    // The post date of the comment.
    postDate: { type: Date, default: Date.now },

    // The body of the comment.
    body: {
        type: String,
        required: true,
        validate: {
            validator: v => v.length <= 140
        }
    }
});

// Poll Schema
const pollSchema = new mongoose.Schema({
    // The user ID of the poll's author.
    authorId: { type: mongoose.Schema.Types.ObjectId, required: true, ref: 'user' },

    // The poll's post date.
    postDate: { type: Date, default: Date.now },

    // The issue at hand for this poll.
    issue: {
        type: String,
        required: true,
        validate: {
            validator: v => v.length <= 280
        }
    },

    // The array of choices available to vote on.
    choices: [choiceSchema],

    // The poll's comments.
    comments: [commentSchema],

    // If set to true, then only registered users can vote on this poll.
    requiresLogin: { type: Boolean, required: true },

    // If set to true, this poll will close after the given date, after which
    // no more votes can be cast.
    pollWillClose: { type: Boolean, required: true },
    closeDate: { type: Date, default: Date.now },

    // If set to true, registered users can add additional choices to the poll.
    canAddExtraChoices: { type: Boolean, required: true },

    // A series of keywords to assist with search results.
    searchKeywords: { type: String, required: true },

    // The last time the poll was interacted with.
    lastInteractionDate: { type: Date, default: Date.now },

    // How many times has this poll been edited?
    editCount: { type: Number, default: 0 }
});

// Index our poll issue and search keywords for easier searching.
pollSchema.index({ issue: 'text', searchKeywords: 'text' });

// Gets the number of votes that have been received in the poll.
pollSchema.virtual('voteCount').get(function () {
    return this.choices.reduce((total, choice) => {
        return total + choice.voters.length;
    }, 0);
});

// Gets the number of comments in our poll.
pollSchema.virtual('commentCount').get(function () {
    return this.comments.length;
});

// Calculates the 'heat' on a poll - how frequently users are voting
// and commenting on this poll.
pollSchema.virtual('heat').get(function () {
    return this.choices.reduce((total, choice) => {
        return total + choice.voters.length;
    }, 0) + this.comments.length;
});

// Has the poll been edited at all?
pollSchema.virtual('edited').get(function () {
    return this.editCount > 0;
});

// Is the poll closed?
pollSchema.virtual('closed').get(function () {
    return this.pollWillClose && Date.now() >= this.closeDate.getTime();
});

// Checks to see if the user with the given ID (or the IP address given,
// in the case of unregistered users) has already voted on the poll.
//
// Returns the ID of the choice that was voted for if they did vote,
// or -1 if they did not.
pollSchema.methods.votedFor = function (id) {
    for (const choice of this.choices) {
        if (choice.voters.indexOf(id) !== -1) {
            return choice._id.toString();
        }
    }

    return null;
};

// Casts a vote on the poll.
pollSchema.methods.castVote = function (userId, choiceId) {
    // Temporarly compile our choice schema.
    const choiceModel = mongoose.model('choice', choiceSchema);

    // Make sure that the poll is not closed.
    if (this.pollWillClose && Date.now() >= this.closeDate.getTime()) {
        return 'This poll is closed.';
    }

    // Make sure that the poll's author is not attempting to cast a vote.
    if (userId === this.authorId.toString()) {
        return 'You are the author of this poll!';
    }

    // Find the poll choice matching the given choice ID.
    for (const choice of this.choices) {
        if (choice._id.toString() === choiceId) {
            choice.voters.push(userId);
            this.lastInteractionDate = new Date();
            return '';
        }
    }

    // Choice not found.
    return 'A choice with the given ID was not found on this poll.';
};

// Adds a new choice to the poll, if it is allowed.
pollSchema.methods.addChoice = function (userId, choiceBody) {
    // Make sure our poll choice has 140 characters or fewer.
    if (choiceBody.length > 140) {
        return 'Poll choices must have 140 characters or fewer.';
    }

    // Check to see if the person adding this choice is the poll's author.
    if (userId === this.authorId.toString()) {
        // Add the choice to the poll.
        this.choices.push({ body: choiceBody, voters: [] });
    } else {
        // Check to see if the poll is closed.
        if (this.pollWillClose && Date.now() >= this.closeDate.getTime()) {
            return 'This poll is closed.';
        }
    
        // Check to see if the author has allowed new choices to be added.
        if (this.canAddExtraChoices === false) {
            return 'Adding extra choices is not allowed on this poll.';
        }

        // Add the choice to the poll and cast the vote on that choice.
        this.choices.push({ body: choiceBody, voters: [ userId ] });
        this.lastInteractionDate = new Date();
        this.editCount++;
    }

    return '';
};

// Edits a comment posted on a poll.
pollSchema.methods.editComment = function (userId, commentId, body) {
    for (let comment of this.comments) {
        if (comment._id.toString() === commentId) {
            if (comment.authorId.toString() !== userId && this.authorId.toString !== userId) {
                return 'You are not the author of this comment.';
            }

            comment.body = body;

            return '';
        }
    }

    return 'A comment with the given ID was not found on this poll.';
};

// Removes a comment from a poll.
pollSchema.methods.removeComment = function (userId, commentId) {
    for (let i = 0; i < this.comments.length; ++i) {
        if (this.comments[i]._id.toString() === commentId) {
            if (this.comments[i].authorId.toString() !== userId && this.authorId.toString !== userId) {
                return 'You are not the author of this comment.';
            }

            this.comments.splice(i, 1);

            return '';
        }
    }

    return 'A comment with the given ID was not found on this poll.';
};

// Compile and Export the Poll and Comment Models.
module.exports.pollModel = mongoose.model('poll', pollSchema);
module.exports.commentModel = mongoose.model('comment', commentSchema);