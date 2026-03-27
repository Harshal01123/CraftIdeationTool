const fs = require('fs');
fetch("https://contribution.usercontent.google.com/download?c=CgthaWRhX2NvZGVmeBJ7Eh1hcHBfY29tcGFuaW9uX2dlbmVyYXRlZF9maWxlcxpaCiVodG1sXzgyZGVjYjY2NjYyYzRhOWI5ZTYxYTQ0OGMyNTgwMTA1EgsSBxDdteuEixsYAZIBIwoKcHJvamVjdF9pZBIVQhMyMzAwMTQ5MzE0ODE5MzQ1NzM1&filename=&opi=89354086")
.then(r => r.text())
.then(t => {fs.writeFileSync('temp_stitch_screen.html', t); console.log("Done");})
.catch(console.error);
