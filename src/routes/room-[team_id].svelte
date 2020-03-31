<nav class="navbar navbar-expand-lg navbar-light bg-warning sticky-top">
    <div class="container">
        <span class="navbar-brand">{quiz.name}</span>
        <div class="d-block d-md-none">
            {#if quiz.state != "pre-quiz"}
                <span class="btn btn-sm btn-outline-dark no-hover">R {quiz.current_round+1}/{quiz.total_rounds}</span>
                <span class="btn btn-sm btn-outline-dark no-hover">Q {quiz.current_question+1}/{round.total_questions}</span>
            {/if}
            <span class="btn btn-sm btn-outline-dark no-hover">T: {quiz.connected_teams}/{quiz.n_teams}</span>
            <span class="btn btn-sm btn-outline-dark no-hover">P: {quiz.connected_players}</span>
        </div>
        <div class="d-none d-md-block">
            {#if quiz.state != "pre-quiz"}
                <span class="btn btn-sm btn-outline-dark no-hover">Round {quiz.current_round+1}/{quiz.total_rounds}</span>
                <span class="btn btn-sm btn-outline-dark no-hover">Question {quiz.current_question+1}/{round.total_questions}</span>
            {/if}
            <span class="btn btn-sm btn-outline-dark no-hover">Teams Connected: {quiz.connected_teams}/{quiz.n_teams}</span>
            <span class="btn btn-sm btn-outline-dark no-hover">Players Connected: {quiz.connected_players}</span>
        </div>
    </div>
</nav>


<div class="container mt-4">
    <h3><small class="text-muted">Playing as:</small></h3>
    <h3 class="mb-4">{team.name}</h3>

    <hr/>

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
                <div class="card-footer">
                    <input type="text" on:input={answerEdited} data-q={i} class="form-control" value={team.answers[i]} placeholder="Type answer here..."/>
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
export async function preload(page, session) {
    const res = await this.fetch(`/api/room?team_id=${page.params.team_id}`, {
        method: "GET",
        headers: {"Content-Type": "application/json"},
    })

    if (res.status == 404) {
        this.error(404, "Team not found!")
        return
    }

    const data = await res.json()

    const team = data.team
    const quiz = data.quiz

    return { team, quiz }
}
</script>


<script>
import { onMount } from "svelte"

export let team
export let quiz

let team_ws

$: round = quiz.rounds[quiz.rounds.length-1]

onMount(() => {
    team_ws = new WebSocket(`ws://notinthepubquiz.com:8080?quiz_id=${quiz.id}&team_id=${team.id}`)

    team_ws.addEventListener("message", event => {
        const data = JSON.parse(event.data)

        if (data.type == "state") {
            quiz = data.quiz
            team = data.team
        }
        else if (data.type == "team-state") {
            team = data.team
        }
        else if (data.type == "connected-players") {
            quiz.connected_players = data.value
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
