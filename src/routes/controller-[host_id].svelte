<nav class="navbar navbar-expand-lg navbar-light bg-warning sticky-top">
  <div class="container">
    <div class="btn-toolbar">
      <button on:click={back} disabled={awaiting_response || quiz.state=="pre-quiz" || quiz.state=="post-quiz"} class="btn btn-lg btn-danger mr-2">Back</button>
      <button on:click={next} disabled={awaiting_response} class="btn btn-lg btn-success">{next_btn_text}</button>
    </div>

    <div class="d-block d-md-none">
      <span class="btn btn-sm btn-outline-dark no-hover">R: {quiz.current_round+1}/{quiz.rounds.length}</span>
      <span class="btn btn-sm btn-outline-dark no-hover">Q: {quiz.current_question+1}/{quiz.current_round == -1 ? 0 : questions_in_round}</span>
      <span class="btn btn-sm btn-outline-dark no-hover">T: {quiz.connected_teams}/{quiz.teams.length}</span>
      <span class="btn btn-sm btn-outline-dark no-hover">P: {quiz.connected_players}</span>
    </div>
    <div class="d-none d-md-block">
      <span class="btn btn-sm btn-outline-dark no-hover">Round: {quiz.current_round+1}/{quiz.rounds.length}</span>
      <span class="btn btn-sm btn-outline-dark no-hover">Question: {quiz.current_question+1}/{quiz.current_round == -1 ? 0 : questions_in_round}</span>
      <span class="btn btn-sm btn-outline-dark no-hover">Teams Connected: {quiz.connected_teams}/{quiz.teams.length}</span>
      <span class="btn btn-sm btn-outline-dark no-hover">Players Connected: {quiz.connected_players}</span>
    </div>
  </div>
</nav>

<div class="container mt-4">
  <div class="row">
    <div class="col">
      <div class="list-group mb-4">
        <h3 class="list-group-item">
          Invite Links
          <button on:click={swapInviteFormat} class="btn btn-dark float-right">{text_invite_format ? "Switch to form" : "Switch to text"}</button>
        </h3>
        {#if text_invite_format}
          <div class="list-group-item">
            <textarea class="form-control" rows={quiz.teams.length*3} value={quiz.teams.map(t => `${t.name}:\nhttp://notinthepubquiz.com/room-${t.id}`).join("\n\n")} style="font-family:monospace;"></textarea>
          </div>
        {:else}
          {#each quiz.teams as team}
            <div class="list-group-item">
              <div class="row">
                <label class="col-4 col-form-label">{team.name}</label>
                <div class="col-8">
                  <input type="text" value={`http://notinthepubquiz.com/room-${team.id}`} class="form-control" readonly>
                </div>
              </div>
            </div>
          {/each}
        {/if}
      </div>
    </div>
  </div>

  <div class="row">
    <div class="col-7">
      {#each [...quiz.rounds.entries()] as [i, round]} 
        <div class="list-group mb-4">
          <h3 class:list-group-item-primary={i==quiz.current_round && quiz.state=="round-marking"} class:list-group-item-secondary={quiz.state=="post-quiz" || quiz.current_round>i} class:list-group-item-dark={quiz.state=="round" && quiz.current_round==i} class="list-group-item">Round {i+1} - {round.name}</h3>
      
          {#each [...round.questions.entries()] as [j, question]}
            <div class="list-group-item" class:list-group-item-primary={i==quiz.current_round && quiz.state=="round-marking"} class:list-group-item-light={quiz.state=="post-quiz" || i<quiz.current_round || (i==quiz.current_round && j<quiz.current_question && quiz.state=="round")} class:list-group-item-success={quiz.state=="round" && i==quiz.current_round && j==quiz.current_question}>
              <p class="lead">
                Question {j+1}:
                <span class="badge badge-secondary float-right">{question.points} {question.points == 1 ? "point" : "points"}</span>
              </p>
              <h4>{question.question}</h4>
              <h4 style="font-weight:200;">{question.answer}</h4>

              <div class="list-group">
                {#each quiz.teams as team}
                  <div class="list-group-item">
                    <strong>{team.name}:</strong> &nbsp; {team.answers[i][j]}
                    {#if i<quiz.current_round || (quiz.state=="round-marking" && quiz.current_round==i)}
                      {#if question.points == 1}
                        <div class="form-check float-right">
                          <input type="checkbox" class="form-check-input" on:change={updateScore} data-teamid={team.id} data-round={i} data-question={j}>
                        </div>
                      {:else}
                        <div class="float-right">
                          <input type="number" class="form-control bg-light text-dark" on:input={updateScore} data-teamid={team.id} data-round={i} data-question={j} min=0 max={question.points} value=0>
                        </div>
                      {/if}
                    {/if}
                  </div>            
                {/each}
              </div>
            </div>
          {/each}
        </div>
      {/each}
    </div>
    <div class="col-5">
      <div class="card sticky-top" style="top: 90px;">
        <div class="card-body">
          <h3 class="card-title">Scores</h3>
        </div>
        <table class="table">
          <thead>
            <tr>
              <th>Team</th>
              {#each quiz.rounds as _, i}
                <th>R{i+1}</th>
              {/each}
              <th>Total</th>
            </tr>
          </thead>
          <tbody>
            {#each quiz.teams as team}
              <tr>
                <td><strong class:text-success={team.connections > 0}>{team.name}<strong></td>
                  {#each quiz.rounds as _, i}
                    <td>{team.round_scores[i]}</td>
                  {/each}
                <td>{team.total_score}</td>
              </tr>
            {/each}
          </tbody>
          {#if quiz.teams.length > 0}
            <tfoot>
              <tr>
                <td>(Average)</td>
                  {#each quiz.rounds as _, i}
                    <td>{quiz.average_round_scores[i].toFixed(1)}</td>
                  {/each}
                <td>{quiz.average_total_score.toFixed(1)}</td>
              </tr>
            </tfoot>
          {/if}
        </table>
      </div>
    </div>
  </div>
</div>


<script context="module">
let next_btn_text = ""


function generateNextBtnText(quiz) {
    if (quiz.state == "pre-quiz") {
        return "Start Quiz"
    }
    else if (quiz.state == "pre-round") {
        return "Start Round"
    }
    else if (quiz.state == "round") {
        return (quiz.current_question < quiz.rounds[quiz.current_round].questions.length-1) ? "Next Question" : "Mark Round"
    }
    else if (quiz.state == "round-marking") {
        return (quiz.current_round < quiz.rounds.length-1) ? "Next Round" : "Finish Quiz"
    }
    else if (quiz.state == "post-quiz") {
        return "Go To Results"
    }
}


export async function preload(page, session) {
    const response = await this.fetch(`/api/controller?host_id=${page.params.host_id}`, {
        method: "GET",
        headers: {"Content-Type": "application/json"},
    })

    if (response.status == 404) {
        this.error(404, "Quiz not found!")
        return
    }

    let quiz = await response.json()

    next_btn_text = generateNextBtnText(quiz)
    return { quiz, next_btn_text }
}
</script>


<script>
import { goto } from "@sapper/app"
import { onMount } from "svelte"

export let quiz
export let next_btn_text

let text_invite_format = false
let awaiting_response = false
let ws = null

$: questions_in_round = quiz.rounds[quiz.current_round].questions.length

onMount(() => {
    ws = new WebSocket(`ws://notinthepubquiz.com:8070?host_id=${quiz.host_id}`)

    ws.addEventListener("message", event => {
        const data = JSON.parse(event.data)

        if (data.type == "state") {
            quiz = data.quiz
            next_btn_text = generateNextBtnText(quiz)
            awaiting_response = false
        }
    })
})


function swapInviteFormat() {
    text_invite_format = !text_invite_format
}


function back() {
    awaiting_response = true
    ws.send(JSON.stringify({type: "back"}))
}


function next() {
    awaiting_response = true

    if (quiz.state == "post-quiz") {
        goto(`/results-${quiz.id}`)
    }
    else {
        ws.send(JSON.stringify({type: "next"}))
    }
}


function updateScore(e) {
    const data = e.target.dataset
    let score = (e.target.type == "checkbox") ? (e.target.checked ? 1 : 0) : Number(e.target.value)

    if (score > quiz.rounds[data.round].questions[data.question].points) {
        score = quiz.rounds[data.round].questions[data.question].points
        e.target.value = score
    }

    quiz.teams.find(t => t.id == data.teamid).scores[data.round][data.question] = score

    ws.send(JSON.stringify({
        type: "score-update",
        team_id: data.teamid,
        round: data.round,
        question: data.question,
        score: score,
    }))
}
</script>
