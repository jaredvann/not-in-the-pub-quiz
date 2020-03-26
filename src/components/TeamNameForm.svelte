<div class="row mt-2">
    <div class="col-8">
        <input type="text" bind:value={team.name} class="form-control" placeholder="Team Name" class:is-valid="{team_name_is_valid}" class:is-invalid="{!team_name_is_valid}" maxlength=60>
    </div>
    <div class="col-4">
        <button on:click={remove} class="btn btn-danger">Remove Team</button>
    </div>
</div>


<script>
import { createEventDispatcher } from "svelte"

export let i
export let team

let team_name_is_valid = false
$: team_name_is_valid = team.name.length > 0 && team.name.length <= 60

const dispatch = createEventDispatcher()

function remove() {
	dispatch("remove", { i: i })
}
</script>
