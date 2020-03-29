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
        this.connected_observers = 0
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

    averageTotalScore() {
        return this.teams.reduce((acc, team) => team.totalScore() + acc, 0) / this.teams.length
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
            // WAT
        }
        else {
            // YOU DUN GOOFED
        }
    }
}



export class ObserverQuestion {
    constructor(question, points) {
        this.question = question
        this.points = points
    }
}


export class ObserverRound {
    constructor(name, questions, total_questions) {
        this.name = name
        this.questions = questions
        this.total_questions = total_questions
    }
}


export class ObserverQuiz {
    constructor(quiz) {
        if (quiz) {
            this.id = quiz.id
            this.name = quiz.name
            this.state = quiz.state

            this.rounds = [...quiz.rounds.slice(0, quiz.current_round+1).entries()].map(([i, round]) => {
                const questions = round.questions.slice(0, quiz.current_round<i ? round.questions.length : quiz.current_question+1).map((question) => {
                    return new ObserverQuestion(question.question, question.points)
                })
        
                return new ObserverRound(round.name, questions, round.questions.length)
            })
            
            this.total_rounds = quiz.rounds.length
            
            this.current_round = quiz.current_round
            this.current_question = quiz.current_question

            this.connected_teams = quiz.connected_teams
            this.connected_observers = quiz.connected_observers
        }
    }
}


export class Team {
    constructor(id, name, quiz_length) {
        this.id = id
        this.name = name

        this.answers = []
        this.scores = []

        this.connected = false
        
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

    totalScore() {
        return this.scores.reduce((a, b) => a + b.reduce((c, d) => c + d, 0), 0)
    }
}
