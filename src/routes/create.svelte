<div class="container mt-4">
    <div id="alert" class="alert alert-danger" role="alert" hidden={error_text == ""}>
        {error_text}
        <button type="button" class="close" data-dismiss="alert" aria-label="Close">
            <span aria-hidden="true">&times;</span>
        </button>
    </div>

    <h1 class="mb-4">Create Quiz</h1>

    <div class="form-group">
        <label for="quiz_name_input">Quiz Name:</label>
        <input type="text" id="quiz_name_input" class="form-control" bind:value="{quiz_name}" class:is-valid="{name_is_valid}" class:is-invalid="{!name_is_valid}" placeholder="Round Name"/>
    </div>

    <label>Options:</label>

    <div class="form-group form-check">
        <input type="checkbox" bind:checked={save_quiz} class="form-check-input">
        <label class="form-check-label">Save quiz.</label>
    </div>

    <div class="form-group form-check">
        <input type="checkbox" class="form-check-input" disabled checked>
        <label class="form-check-label">Host marks questions at the end of each round.</label>
    </div>

    <div class="form-group form-check">
        <input type="checkbox" bind:checked={allow_signups} class="form-check-input">
        <label class="form-check-label">Allow additional signups from people who have been given the quiz ID.</label>
    </div>

    <div class="card mb-3">
        <div class="card-header">
            <span class="lead">Teams</span>
        </div>
        <div class="card-body">
            {#each teams as team, i}
                <TeamNameForm i={i} team={team} on:remove={removeTeam}/>
            {/each}

            <button on:click={addTeam} class="btn btn-primary mt-3">Add Team</button>
        </div>
    </div>

    {#each [...rounds.entries()] as [i, round]}
        <RoundForm i={i+1} bind:round on:remove={removeRound} allowdeletion={rounds.length > 1}/>
    {/each}

    <button on:click={addRound} class="btn btn-primary mt-2">Add Round</button>
    <button on:click={submit} disabled="{!is_valid}" class="btn btn-success mt-2 float-right">Submit</button>
    <br/>
    <br/>
</div>


<script>
import { goto } from "@sapper/app"

import RoundForm from "../components/RoundForm.svelte"
import TeamNameForm from "../components/TeamNameForm.svelte"
import { Round } from "../types.js"

let error_text = ""

// Quiz name
let quiz_name = ""
let name_is_valid = false
$: name_is_valid = quiz_name.length > 0

// Quiz options
let save_quiz = false
let allow_signups = false

// Validation
let is_valid = false
$: is_valid = name_is_valid && rounds.length > 0 && rounds.every(r => r.isValid())


let rounds = [new Round()]
let teams = [{name: ""}]

function addRound() {
    rounds = [...rounds, new Round()]
}

function removeRound(e) {
    rounds.splice(e.detail.id-1, 1)
    rounds = rounds
}

function addTeam() {
    teams = [...teams, {name: ""}]
}

function removeTeam(e) {
    teams.splice(e.detail.id-1, 1)
    teams = teams
}


async function submit() {
    const data = {
        name: quiz_name,
        rounds: rounds,
        teams: teams,
        options: {
            save_quiz: save_quiz,
            allow_signups: allow_signups,
        },
    }

    const response = await fetch("/api/create-quiz", {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify(data)
    })

    let reply = await response.json()

    if (reply.result == "error") {
        error_text = reply.msg
        // TODO: reset form
    } else {
        goto(`/controller-${reply.host_id}`)
    }
}
</script>
