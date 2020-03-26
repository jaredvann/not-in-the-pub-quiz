<nav class="navbar navbar-expand-lg navbar-light bg-warning sticky-top">
    <div class="container">
        <span class="navbar-brand">{quiz.name} - {team.name}</span>
        <div class="d-block d-lg-none">
            <span class="btn btn-sm btn-outline-dark no-hover">R: {quiz.current_round+1}/{quiz.total_rounds}</span>
            <span class="btn btn-sm btn-outline-dark no-hover">Q: {round.questions.length}/{round.total_questions}</span>
            <span class="btn btn-sm btn-outline-dark no-hover">T: {quiz.connected_teams}</span>
            <span class="btn btn-sm btn-outline-dark no-hover">O: {quiz.connected_observers}</span>
        </div>
        <div class="d-none d-lg-block">
            <span class="btn btn-sm btn-outline-dark no-hover">Round {quiz.current_round+1}/{quiz.total_rounds}</span>
            <span class="btn btn-sm btn-outline-dark no-hover">Question {round.questions.length}/{round.total_questions}</span>
            <span class="btn btn-sm btn-outline-dark no-hover">Teams Connected: {quiz.connected_teams}</span>
            <span class="btn btn-sm btn-outline-dark no-hover">Observers Connected: {quiz.connected_observers}</span>
        </div>
    </div>
</nav>


<div class="container mt-4">
    {#if quiz.status == "pre"}
        <div class="card mb-4">
            <div class="card-body">
                <h4>Waiting for the host to start the quiz.</h4>
            </div>
        </div>

    {:else if quiz.status == "post"}
        <div class="card mb-4">
            <div class="card-body">
                <h4>Host is now marking answers.</h4>
            </div>
        </div>

    {:else if round.questions.length == 0}
        <h2 class="mb-4">Round {quiz.current_round+1} - {round.name}</h2>

        <div class="card mb-4">
            <div class="card-body">
                <h4>Waiting for the host to start the round.</h4>
            </div>
        </div>
    
    {:else}
        <h2 class="mb-4">Round {quiz.current_round+1} - {round.name}</h2>

        {#each [...round.questions.entries()] as [i, question]}
            <div class="card mb-4">
                <div class="card-body">
                    <p class="lead">
                        Question {i+1}:
                        <span class="badge badge-primary float-right">{question.points} {question.points == 1 ? "point" : "points"}</span>
                    </p>
                    <h4>{question.question}</h4>
                </div>
                <div class="card-footer">
                    <input type="text" on:input={answerEdited} data-q={i} class="form-control" placeholder="Type answer here..."/>
                </div>
            </div>
        {/each}
    {/if}
</div>


<script context="module">
import { ObserverQuiz, ObserverRound, Team } from "../types.js"

export async function preload(page, session) {
    const res = await this.fetch(`/api/room?team_id=${page.params.team_id}`, {
        method: "GET",
        headers: {"Content-Type": "application/json"},
    })

    if (res.status == 404) {
        this.error(404, "Team not found!")
        return
    }
    else if (res.status == 409) {
        this.error(409, "Only one person can view the team page at a time!")
        return
    }

    let data = await res.json()

    let team = Object.assign(new Team, data.team)
    let quiz = Object.assign(new ObserverQuiz, data.quiz)

    quiz.connected_teams++

    return { team, quiz }
}
</script>


<script>
import { onMount } from "svelte"

export let team
export let quiz

let team_ws

let round
$: round = quiz.rounds[quiz.rounds.length-1]

onMount(() => {
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:"

    team_ws = new WebSocket(`${protocol}//163.172.140.148:8080?quiz_id=${quiz.id}&team_id=${team.id}`)

    team_ws.addEventListener("message", event => {
        const data = JSON.parse(event.data)

        if (data.type == "quiz-state") {
            quiz = data.quiz
        }
        else if (data.type == "connected-observers") {
            quiz.connected_observers = data.value
        }
        else if (data.type == "connected-teams") {
            quiz.connected_teams = data.value
        }
    })
})

function answerEdited(e) {
    team_ws.send(JSON.stringify({
        type: "answer",
        round: quiz.current_round,
        question: Number(e.target.dataset.q),
        answer: e.target.value,
    }))
}
</script>
