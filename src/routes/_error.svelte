<div class="container mt-4">
    <h1 class="display-3">Error: {status}</h1>

    <p class="lead">{error.message}</p>

    {#if dev && error.stack}
        <pre style="color: #EEEEEE;">{error.stack}</pre>
    {/if}
</div>


<script>
    export let status
    export let error

    const dev = process.env.NODE_ENV === 'development'
</script>
