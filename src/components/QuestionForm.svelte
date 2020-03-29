<div class="card mb-2">
    <div class="card-body">
        <div class="card-title">
            <span class="lead">Question {i+1}</span>
            <div class="btn-toolbar float-right">
                <!-- <button class="btn btn-sm btn-outline-secondary mb-2 mr-2">Move Up</button>
                <button class="btn btn-sm btn-outline-secondary mb-2 mr-2">Move Down</button> -->
                {#if allowdeletion}
                    <button class="btn btn-sm btn-outline-danger mb-2" on:click={remove}>Remove</button>
                {/if}
            </div>
        </div>
        <input type="text" class="form-control mt-4" bind:value="{question.question}" class:is-valid="{q_is_valid}" class:is-invalid="{!q_is_valid}" placeholder="Question"/>
        <input type="text" class="form-control mt-2" bind:value="{question.answer}" class:is-valid="{a_is_valid}" class:is-invalid="{!a_is_valid}" placeholder="Answer"/>
        
        <div class="form-group row mt-2">
            <label class="col-9 col-form-label">Available points: </label>
            <div class="col-3">
                <input type="number" class="form-control is-valid" bind:value="{question.points}" min=1 max=10/>
            </div>
        </div>
    </div>
</div>


<script>
import { createEventDispatcher } from "svelte"
import { Question } from "../types.js"

export let i
export let question
export let allowdeletion

let q_is_valid = false
$: q_is_valid = question.questionIsValid()

let a_is_valid = false
$: a_is_valid = question.answerIsValid()


const dispatch = createEventDispatcher()

function remove() {
	dispatch("remove", { i: i })
}
</script>
