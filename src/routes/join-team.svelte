<div class="container mt-4">
    <div id="alert" class="alert alert-danger" role="alert" hidden={error_text == ""}>
        {error_text}
        <button type="button" class="close" data-dismiss="alert" aria-label="Close">
            <span aria-hidden="true">&times;</span>
        </button>
    </div>

    <h1>Join quiz with new team</h1>

    <p class="lead">Enter the quiz ID given by your quiz host to get started. It should be 6 mixed letters and numbers (eg. 'SJHG2N').</p>

    <div class="form-group">
        <input type="text" on:input={checkQuizID} value={quiz_id} class:is-valid="{quiz_id_is_valid}" class:is-invalid="{!quiz_id_is_valid}" placeholder="Quiz ID" class="form-control form-control-lg" required/>
        <div class="invalid-feedback">Quiz ID not valid!</div>
        <div class="valid-feedback">Quiz found!</div>
    </div>

    <div class="form-group" class:d-none="{!quiz_id_is_valid}">
        <input type="text" on:input={checkTeamName} value={team_name} class:is-valid="{team_name_is_valid}" class:is-invalid="{!team_name_is_valid}" placeholder="Team Name" class="form-control form-control-lg" required/>
        <div class="invalid-feedback">Name already taken or not valid!</div>
        <div class="valid-feedback">Name accepted!</div>
    </div>

    <button type="submit" on:click={submit} class:d-none="{!team_name_is_valid}" class="btn btn-primary btn-block btn-lg">Join!</button>
</div>


<script>
import { goto } from "@sapper/app"

let error_text = ""

let quiz_id = ""
let quiz_id_is_valid = false

let team_name = ""
let team_name_is_valid = false

async function submit() {
    const response = await fetch("/api/add-team", {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify({ quiz_id: quiz_id, name: team_name }),
    })

    const reply = await response.json()

    if (reply.status == "ok") {
        goto(`/room-${reply.id}`)
    }
    else {
        error_text = reply.error
    }
}


async function checkQuizID(e) {
    quiz_id = e.target.value

    if (quiz_id.length != 6) {
        quiz_id_is_valid = false
    }
    else {
        const response = await fetch(`/api/check-quiz-id?id=${quiz_id}`, {
            method: "GET",
            headers: {"Content-Type": "application/json"},
        })

        // if (response.status != 200) {
        //     goto(`/${response.status}`)
        // }
    
        quiz_id_is_valid = (await response.json()).valid
    }
}


async function checkTeamName(e) {
    team_name = e.target.value

    if (team_name.length < 3 || team_name.length > 30) {
        team_name_is_valid = false
    }
    else {
        const response = await fetch(`/api/check-team-name?quiz_id=${quiz_id}&name=${team_name}`, {
            method: "GET",
            headers: {"Content-Type": "application/json"},
        })

        // if (response.status != 200) {
        //     goto(`/${response.status}`)
        // }
    
        team_name_is_valid = (await response.json()).valid
    }
}
</script>
