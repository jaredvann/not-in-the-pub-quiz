<div class="container mt-4">
    <div id="alert" class="alert alert-danger" role="alert" hidden={error_text == ""}>
        {error_text}
        <button type="button" class="close" data-dismiss="alert" aria-label="Close">
            <span aria-hidden="true">&times;</span>
        </button>
    </div>

    <h1>Join quiz as a participant</h1>

    <p class="lead">Enter the quiz ID given by your quiz host to get started. It should be 6 mixed letters and numbers (eg. 'SJHG2N').</p>

    <div class="form-group">
        <input type="text" on:input={checkQuizID} value={quiz_id} class:is-valid="{quiz_id_is_valid}" class:is-invalid="{!quiz_id_is_valid}" placeholder="Quiz ID" class="form-control form-control-lg" required/>
        <div class="invalid-feedback">Quiz ID not valid!</div>
        <div class="valid-feedback">Quiz found!</div>
    </div>

    <button type="submit" on:click={submit} class:d-none="{!quiz_id_is_valid}" class="btn btn-primary btn-block btn-lg">Join!</button>
</div>


<script>
import { goto } from "@sapper/app"

let error_text = ""

let quiz_id = ""
let quiz_id_is_valid = false

async function submit() {
    goto(`/observe-${quiz_id}`)
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

        quiz_id_is_valid = (await response.json()).valid
    }
}
</script>
