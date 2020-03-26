<div class="card mb-3">
    <div class="card-header">
        <span class="lead">Text Round <span class="text-muted">(Round {i})</span></span>
        <div class="btn-toolbar float-right">
            <!-- <button class="btn btn-sm btn-secondary mr-2">Move Up</button>
            <button class="btn btn-sm btn-secondary mr-2">Move Down</button> -->
            {#if allowdeletion}
                <button class="btn btn-sm btn-danger" on:click={remove}>Remove</button>
            {/if}
        </div>
    </div>
    <div class="card-body">
        <label for="round_name_input">Round Name:</label>
        <input type="text" id="round_name_input" class="form-control mb-4" bind:value="{round.name}" class:is-valid="{name_is_valid}" class:is-invalid="{!name_is_valid}" placeholder="Round Name"/>
    
        {#each [...round.questions.entries()] as [i, question]}
            <QuestionForm i={i+1} bind:question on:remove={removeQuestion} allowdeletion={round.questions.length > 1}/>
        {/each}

        <button on:click={addQuestion} class="btn btn-primary mt-2">Add Question</button>
    </div>
</div>


<script>
import { createEventDispatcher } from "svelte"
import QuestionForm from "../components/QuestionForm.svelte"
import { Round, Question } from "../types.js"

export let i = 0
export let round
export let allowdeletion


let name_is_valid = false
$: name_is_valid = round.nameIsValid()


const dispatch = createEventDispatcher()

function remove() {
	dispatch("remove", { i: i })
}

function addQuestion() {
    round.questions = [...round.questions, new Question()]
}

function removeQuestion(e) {
    round.questions.splice(e.detail.i-1, 1)
    round.questions = round.questions
}
</script>
