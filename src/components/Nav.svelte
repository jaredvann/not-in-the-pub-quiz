<script>
    export let segment;
</script>


<nav class="navbar navbar-expand-lg navbar-dark bg-dark">
    <div class="container">
        <a class="navbar-brand" href=".">Not In The Pub Quiz <span class="text-muted">(beta)</span></a>
        <button class="navbar-toggler" type="button" data-toggle="collapse" data-target="#navbar" aria-controls="navbar" aria-expanded="false" aria-label="Toggle navigation">
            <span class="navbar-toggler-icon"></span>
        </button>
        <div class="collapse navbar-collapse" id="navbar">
            <div class="navbar-nav">
                <a class="nav-item nav-link {segment === undefined ? 'active' : ''}" href=".">Home <span class="sr-only">(current)</span></a>
                <a class="nav-item nav-link {segment === 'create' ? 'active' : ''}" href="create">Create Quiz</a>
                <a class="nav-item nav-link {segment === 'join-team' ? 'active' : ''}" href="join-team">Join As Team Captain</a>
                <a class="nav-item nav-link {segment === 'join-observe' ? 'active' : ''}" href="join-observe">Join As Team Player</a>
            </div>
        </div>
    </div>
</nav>
