<nav class="navbar navbar-expand-lg navbar-light bg-warning sticky-top">
  <div class="container">
    <span class="navbar-brand">{quiz.name} Results</span>
  </div>
</nav>

<div class="container">
  <div class="card mt-4">
    <div class="card-header">
      <h3>Overall Scores</h3>
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
            <td>{team.name}</td>
              {#each quiz.rounds as _, i}
                <td>{team.round_scores[i]}</td>
              {/each}
            <td>{team.total_score}</td>
          </tr>
        {/each}
      </tbody>
      <tfoot>
        <tr>
          <td>(Average)</td>
            {#each quiz.rounds as _, i}
              <td>{quiz.average_round_scores[i].toFixed(1)}</td>
            {/each}
          <td>{quiz.average_total_score.toFixed(1)}</td>
        </tr>
      </tfoot>
    </table>
  </div>

  {#each [...quiz.rounds.entries()] as [i, round]} 
    <div class="card mt-4">
      <div class="card-header">
        <h3>Round {i+1} - {round.name}</h3>
      </div>
  
      {#each [...round.questions.entries()] as [j, question]}
        <div class="card-body">
          <p class="lead">Question {j+1}:</p>
          <h4>{question.question}</h4>
          <h4 style="font-weight:200;">{question.answer}</h4>
        </div>

        <table class="table" style="border-bottom: 1px solid #343a40;">
          <thead>
            <tr>
              <th>Team</th>
              <th>Answer</th>
              <th>Score</th>
            </tr>
          </thead>
          <tbody>
            {#each quiz.teams as team}
              <tr>
                <td>{team.name}</td>
                <td>{team.answers[i][j]}</td>
                <td>{team.scores[i][j]}/{question.points}</td>
              </tr>
            {/each}
          </tbody>
        </table>
      {/each}
    </div>
  {/each}
  <br/>
</div>



<script context="module">

export async function preload(page, session) {
    const response = await this.fetch(`/api/results?quiz_id=${page.params.quiz_id}`, {
        method: "GET",
        headers: {"Content-Type": "application/json"},
    })

    if (response.status == 404) {
        this.error(404, "Quiz results not found!")
        return
    }

    const quiz = await response.json()

    return { quiz }
}
</script>


<script>
export let quiz
</script>
