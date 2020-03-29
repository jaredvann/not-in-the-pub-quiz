<nav class="navbar navbar-expand-lg navbar-light bg-warning sticky-top">
    <div class="container">
        <span class="navbar-brand">{quiz.name}</span>
        <div class="d-block d-md-none">
            {#if quiz.state != "pre-quiz"}
                <span class="btn btn-sm btn-outline-dark no-hover">R {quiz.current_round+1}/{quiz.total_rounds}</span>
                <span class="btn btn-sm btn-outline-dark no-hover">Q {quiz.current_question+1}/{round.total_questions}</span>
            {/if}
            <span class="btn btn-sm btn-outline-dark no-hover">C: {quiz.connected_teams}</span>
            <span class="btn btn-sm btn-outline-dark no-hover">P: {quiz.connected_observers}</span>
        </div>
        <div class="d-none d-md-block">
            {#if quiz.state != "pre-quiz"}
                <span class="btn btn-sm btn-outline-dark no-hover">Round {quiz.current_round+1}/{quiz.total_rounds}</span>
                <span class="btn btn-sm btn-outline-dark no-hover">Question {quiz.current_question+1}/{round.total_questions}</span>
            {/if}
            <span class="btn btn-sm btn-outline-dark no-hover">Captains Connected: {quiz.connected_teams}</span>
            <span class="btn btn-sm btn-outline-dark no-hover">Players Connected: {quiz.connected_observers}</span>
        </div>
    </div>
</nav>


<div class="container mt-4">
    {#if quiz.state == "pre-quiz"}
        <div class="card mb-4">
            <div class="card-body">
                <h4>Waiting for the host to start the quiz.</h4>
            </div>
        </div>

    {:else if quiz.state == "pre-round"}
        <h2 class="mb-4">Round {quiz.current_round+1} - {round.name}</h2>

        <div class="card mb-4">
            <div class="card-body">
                <h4>Waiting for the host to start the round.</h4>
            </div>
        </div>

    {:else if quiz.state == "round"}
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
            </div>
        {/each}

    {:else if quiz.state == "round-marking"}
        <div class="card mb-4">
            <div class="card-body">
                <h4>Host is now marking answers from this round.</h4>
            </div>
        </div>

    {:else if quiz.state == "post-quiz"}
        <div class="card mb-4">
            <div class="card-body">
                <h4>Thank-you for playing! Your host can now share the results.</h4>
            </div>
        </div>
    {/if}
</div>


<script context="module">
import { ObserverQuiz, ObserverRound } from "../types.js"

export async function preload(page, session) {
    const res = await this.fetch(`/api/observe?quiz_id=${page.params.quiz_id}`, {
        method: "GET",
        headers: {"Content-Type": "application/json"},
    })

    if (res.status == 404) {
        this.error(404, "Quiz not found!")
        return
    }

    let data = await res.json()
    let quiz = Object.assign(new ObserverQuiz, data.quiz)

    return { quiz }
}
</script>


<script>
import { onMount } from "svelte"

let ws
export let quiz

let round
$: round = quiz.rounds[quiz.rounds.length-1]

onMount(() => {
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:"

    ws = new WebSocket(`${protocol}//163.172.140.148:8090?quiz_id=${quiz.id}`)

    ws.addEventListener("message", event => {
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
</script>
