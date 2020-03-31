import fs from "fs"
import http from "http"
import sirv from "sirv"
import polka from "polka"
import compression from "compression"
import * as sapper from "@sapper/server"
import send from "@polka/send-type"
import randomstring from "randomstring"
import WebSocket from "ws"
import onchange from "on-change"
import querystring from "querystring"

const bodyparser = require("body-parser")

import { ControllerQuiz, ControllerTeam, PublicQuiz, PublicTeam, Question, Quiz, Round, Team } from "./types.js"

const { PORT, NODE_ENV } = process.env
const dev = NODE_ENV === "development"

const DATA_FILE = "data.json"


// Set up app

const app = polka().use(bodyparser.json())


// Set up API routes

app.post("/api/create-quiz", (req, res) => {
    // TODO: validate

    const rounds = req.body.rounds.map(r => {
        r.questions = r.questions.map(q => Object.assign(new Question, q))
        return Object.assign(new Round, r)
    })

    const quiz_length = rounds.map(r => r.questions.length)

    const teams = req.body.teams.map(t => {
        const id = randomstring.generate({length: 10, capitalization: "uppercase"})
        return new Team(id, t.name, quiz_length)
    })

    const quiz = makeQuizObject(req.body.name, rounds, teams, req.body.options, undefined)

    send(res, 200, {result: "ok", host_id: quiz.host_id})
})

app.get("/api/controller", (req, res) => {
    const quiz = Object.values(quizzes).find(q => q.host_id == req.query.host_id)

    if (quiz) {
        send(res, 200, new ControllerQuiz(quiz))
    }
    else {
        send(res, 404)
    }
})

app.post("/api/add-team", (req, res) => {
    if (!(req.body.quiz_id in quizzes)) {
        send(res, 404)
        return
    }

    const quiz = quizzes[req.body.quiz_id]

    if (!quiz.options.allow_signups) {
        send(res, 200, {state: "error", error: "This quiz does not allow team signups"})
    }
    else if (quiz.state != "pre") {
        send(res, 200, {state: "error", error: "Quiz has already started"})
    }
    else if (!checkTeamNameIsValid(req.body.quiz_id, req.body.name)) {
        send(res, 200, {state: "error", error: "Name is not valid"})
    }
    else {
        const id = randomstring.generate({length: 10, capitalization: "uppercase"})
        const team = new Team(id, name, quiz.quizLength())
        
        quiz.teams.append(team)

        send(res, 200, {state: "ok", id: id})
    }
})

app.get("/api/check-team-name", (req, res) => {
    send(res, 200, {valid: checkTeamNameIsValid(req.query.quiz_id, req.query.name)})
})

app.get("/api/results", (req, res) => {
    const quiz = quizzes[req.query.quiz_id]

    if (quiz.state == "post-quiz") {
        send(res, 200, quiz)
    }
    else {
        send(res, 404)

    }
})

app.get("/api/room", (req, res) => {
    for (const quiz of Object.values(quizzes)) {
        const team = quiz.teams.find(t => t.id == req.query.team_id)

        if (team) {
            send(res, 200, {
                quiz: new PublicQuiz(quiz),
                team: new PublicTeam(quiz, team),
            })
            return
        }
    }

    send(res, 404)
})

app.get("/api/priv", (req, res) => {
    send(res, 200, quizzes)
})


// Set up rest of app - this must come after API routes

app.use(
    compression({ threshold: 0 }),
    sirv("static", { dev }),
    sapper.middleware()
)


// Start server

app.listen(PORT, err => {
    if (err) console.log("error", err)
})


// Set up websocket servers

const host_wss = new WebSocket.Server({port: 8070})
const team_wss = new WebSocket.Server({port: 8080})

host_wss.on("connection", (ws, req) => {
    const params = querystring.parse(req.url.split("?")[1])
    
    ws.quiz = Object.values(quizzes).find(q => q.host_id == params.host_id)
    
    ws.on("message", (message) => {
        const data = JSON.parse(message)
        
        if ((data.type == "back" && ws.quiz.state != "post-quiz") || data.type == "next") {
            if (data.type == "back") ws.quiz.back()
            else                     ws.quiz.next()

            ws.send(JSON.stringify({type: "state", quiz: new ControllerQuiz(ws.quiz)}))

            const public_quiz = new PublicQuiz(ws.quiz)

            for (const team of ws.quiz.teams) {
                sendToTeam(team.id, {
                    type: "state",
                    quiz: public_quiz,
                    team: new PublicTeam(ws.quiz, team)
                })
            }

            if (ws.quiz.state == "post-quiz" && ws.quiz.options.save_quiz) {
                let q2 = JSON.parse(fs.readFileSync(DATA_FILE, "utf-8"))
                q2[ws.quiz.id] = ws.quiz
                fs.writeFileSync(DATA_FILE, JSON.stringify(q2, null, 2) , "utf-8")
            }
        }
        else if (data.type == "score-update") {
            ws.quiz.teams.find(t => t.id == data.team_id).scores[data.round][data.question] = data.score
        }
    })
})

team_wss.on("connection", (ws, req) => {
    const params = querystring.parse(req.url.split("?")[1])

    ws.quiz = quizzes[params.quiz_id]
    ws.team = ws.quiz.teams.find(t => t.id == params.team_id)
    
    ws.team.connections++
    ws.quiz.connected_players++
    
    if (ws.team.connections == 1)
    {
        ws.quiz.connected_teams++
    }

    ws.on("message", (message) => {
        const data = JSON.parse(message)

        if (data.type == "answer") {
            ws.team.answers[data.round][data.question] = data.answer

            sendToTeam(ws.team.id, {type: "team-state", team: new PublicTeam(ws.quiz, ws.team)})
        }
    })

    ws.on("close", () => {
        ws.team.connections--
        ws.quiz.connected_players--

        if (ws.team.connections == 0) {
            ws.quiz.connected_teams--
        }
    })
})


// Create state objects

let quizzes = JSON.parse(fs.readFileSync(DATA_FILE, "utf-8"))

for (let quiz_id in quizzes) {
    let quiz = quizzes[quiz_id]

    quiz.rounds = quiz.rounds.map(r => {
        r.questions = r.questions.map(q => Object.assign(new Question, q))
        return Object.assign(new Round, r)
    })

    quiz.teams = quiz.teams.map(t => Object.assign(new Team, t))

    quiz = Object.assign(new Quiz, quiz)

    quizzes[quiz_id] = onchange(quiz, (path, value, previous) => {
        if (path == "connected_teams") {
            sendToAllTeams(quiz.id, {type: "connected-teams", value: value})
        }
        else if (path == "connected_players") {
            sendToAllTeams(quiz.id, {type: "connected-players", value: value})
        }

        sendToQuizHost(quiz.id, {type: "state", quiz: new ControllerQuiz(quiz)})
    })
}


// Declare functions


function sendToAllTeams(quiz_id, data) {
    team_wss.clients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN && client.quiz.id == quiz_id) {
            client.send(JSON.stringify(data))
        }
    })
}


function sendToTeam(team_id, data) {
    team_wss.clients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN && client.team.id == team_id) {
            client.send(JSON.stringify(data))
        }
    })
}


function sendToQuizHost(quiz_id, data) {
    host_wss.clients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN && client.quiz.id == quiz_id) {
            client.send(JSON.stringify(data))
        }
    })
}


function makeQuizObject(name, rounds, teams, options, id=undefined) {
    let host_id = id

    if (id == undefined) {
        id = randomstring.generate({length: 6, capitalization: "uppercase"})
        host_id = randomstring.generate({length: 20, capitalization: "uppercase"})
    }

    const quiz = new Quiz(id, host_id, name, rounds, teams, options)

    const quizproxy = onchange(quiz, () => {
        sendToQuizHost(quiz.id, {type: "state", quiz: new ControllerQuiz(quiz)})
    })

    quizzes[quiz.id] = quizproxy

    if (options.save_quiz) {
        const q2 = JSON.parse(fs.readFileSync(DATA_FILE, "utf-8"))
        q2[quiz.id] = quizproxy
        fs.writeFileSync(DATA_FILE, JSON.stringify(q2, null, 2) , "utf-8")
    }

    return quizproxy
}


function checkTeamNameIsValid(quiz_id, team_name) {
    return (quiz_id in quizzes) && team_name.length >= 3 && team_name.length <= 60 && !quizzes[quiz_id].teams.find(t => t.id == team_name)
}
