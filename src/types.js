export class Question {
    constructor(question="", answer="", points=1) {
        this.question = question
        this.answer = answer
        this.points = points
    }

    questionIsValid() {
        return this.question.length > 0
    }

    answerIsValid() {
        return this.answer.length > 0
    }

    isValid() {
        return this.questionIsValid() && this.answerIsValid()
    }
}


export class Round {
    constructor(name="", questions=[new Question()]) {
        this.name = name
        this.questions = questions
    }

    nameIsValid() {
        return this.name.length > 0
    }

    isValid() {
        return this.nameIsValid() && this.questions.length > 0 && this.questions.every((q) => q.isValid())
    }
}


export class Quiz {
    /**
     * Quiz state options:
     *  - "pre-quiz"        - before a quiz has started - new teams can only be created in this state
     *  - "pre-round"       - before a round has begun - round title will be displayed
     *  - "round"           - during a quiz round when questions are answered
     *  - "round-marking"   - during marking at the end of a round
     *  - "post-quiz"       - at the end of the quiz after all marking is complete - scores will be displayed here
     * 
     *  NOTE: currently only geared for marking at the end of each round.
     */

    constructor(id, host_id, name, rounds, teams, options) {
        this.id = id
        this.host_id = host_id
        
        this.name = name
        this.rounds = rounds
        this.teams = teams
        this.options = options

        this.state = "pre-quiz"
        this.current_round = -1
        this.current_question = -1

        this.connected_teams = 0
        this.connected_players = 0
    }

    quizLength() {
        return this.rounds.map(r => r.questions.length)
    }

    questionsInRound() {
        return this.rounds[this.current_round].questions.length
    }

    averageRoundScore(i) {
        return this.teams.reduce((acc, team) => team.roundScore(i) + acc, 0) / this.teams.length
    }

    averageRoundScores() {
        let scores = []

        for (let i = 0; i < this.rounds.length; i++) {
            scores.push(this.teams.reduce((acc, team) => team.roundScore(i) + acc, 0) / this.teams.length)
        }

        return scores
    }

    averageTotalScore() {
        return this.teams.reduce((acc, team) => team.totalScore() + acc, 0) / this.teams.length
    }

    back() {
        if (this.state == "pre-round") {
            if (this.current_round == 0) {
                this.state = "pre-quiz"
            }
            else {
                this.state = "round-marking"
                this.current_round--
                this.current_question = this.rounds[this.current_round].questions.length-1
            }
        }
        else if (this.state == "round") {
            if (this.current_question == 0) {
                this.state = "pre-round"
            }
            else {
                this.current_question--
            }
        }
        else if (this.state == "round-marking") {
            this.state = "round"
        }
        else if (this.state == "post-quiz") {
            // NO CAN DO
        }
    }

    next() {
        if (this.state == "pre-quiz") {
            this.state = "pre-round"
            this.current_round = 0
        }
        else if (this.state == "pre-round") {
            this.state = "round"
            this.current_question = 0
        }
        else if (this.state == "round") {
            if (this.current_question < this.questionsInRound()-1) {
                this.current_question++
            }
            else {
                this.state = "round-marking"
            }
        }
        else if (this.state == "round-marking") {
            if (this.current_round < this.rounds.length-1) {
                this.state = "pre-round"
                this.current_round++
                this.current_question = -1
            }
            else {
                this.state = "post-quiz"
            }
        }
        else if (this.state == "post-quiz") {
        }
        else {
        }
    }
}


export class Team {
    constructor(id, name, quiz_length) {
        this.id = id
        this.name = name

        this.answers = []
        this.scores = []

        this.connections = 0
        
        if (quiz_length != undefined) {
            for (const round_length of quiz_length) {
                this.answers.push([...Array(round_length)].map(_ => ""))
                this.scores.push([...Array(round_length)].map(_ => 0))
            }
        }
    }

    roundScore(i) {
        return this.scores[i].reduce((a, b) => a + b, 0)
    }

    roundScores() {
        return this.scores.map(r => r.reduce((a, b) => a + b, 0))
    }

    totalScore() {
        return this.scores.reduce((a, b) => a + b.reduce((c, d) => c + d, 0), 0)
    }
}



export class ControllerQuiz {
    constructor(quiz) {
        this.id = quiz.id
        this.host_id = quiz.host_id
        this.name = quiz.name
        this.state = quiz.state

        this.rounds = quiz.rounds
        this.teams = quiz.teams.map(t => new ControllerTeam(t))
        
        this.total_rounds = quiz.rounds.length
        
        this.current_round = quiz.current_round
        this.current_question = quiz.current_question

        this.connected_teams = quiz.connected_teams
        this.connected_players = quiz.connected_players

        this.average_round_scores = quiz.averageRoundScores()
        this.average_total_score = quiz.averageTotalScore()
    }
}


export class ControllerTeam {
    constructor(team) {
        this.id = team.id
        this.name = team.name
        this.answers = team.answers
        this.scores = team.scores
        this.connections = team.connections

        this.round_scores = team.roundScores()
        this.total_score = team.totalScore()
    }
}



export class PublicQuestion {
    constructor(question) {
        this.question = question.question
        this.points = question.points
    }
}


export class PublicRound {
    constructor(round, max=undefined) {
        this.name = round.name
        this.questions = round.questions.slice(0, (max == undefined) ? round.questions.length : max).map(q => new PublicQuestion(q))
        this.total_questions = round.questions.length
    }
}


export class PublicQuiz {
    constructor(quiz) {
        this.id = quiz.id
        this.name = quiz.name
        this.state = quiz.state
        this.n_teams = quiz.teams.length

        this.rounds = [...quiz.rounds.slice(0, quiz.current_round+1).entries()].map(([i, r]) => {new PublicRound(r, quiz.current_round<i ? round.questions.length : quiz.current_question+1)})

        this.total_rounds = quiz.rounds.length
        
        this.current_round = quiz.current_round
        this.current_question = quiz.current_question

        this.connected_teams = quiz.connected_teams
        this.connected_players = quiz.connected_players
    }
}


export class PublicTeam {
    constructor(quiz, team) {
        this.id = team.id
        this.name = team.name
        this.answers = team.answers[quiz.current_round]
    }
}


export class Results {
    constructor(quiz) {
        this.id = quiz.id
        this.name = quiz.name

        this.teams = quiz.teams.map(t => {
            return {
                name: t.name,
                answers: t.answers,
                scores: t.scores,
                round_scores: t.roundScores(),
                total_score: t.totalScore()
            }
        }).sort((a, b) => a.total_score < b.total_score)

        this.rounds = quiz.rounds.map(r => {
            return {
                name: r.name,
                questions: r.questions.map(q => { return {question: q.question, answer: q.answer, points: q.points}})
            }
        })
        
        this.average_round_scores = quiz.averageRoundScores()
        this.average_total_score = quiz.averageTotalScore()
    }
}
