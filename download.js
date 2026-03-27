const https = require('https');
const fs = require('fs');
const url = "https://contribution.usercontent.google.com/download?c=CgthaWRhX2NvZGVmeBJ7Eh1hcHBfY29tcGFuaW9uX2dlbmVyYXRlZF9maWxlcxpaCiVodG1sXzgyZGVjYjY2NjYyYzRhOWI5ZTYxYTQ0OGMyNTgwMTA1EgsSBxDdteuEixsYAZIBIwoKcHJvamVjdF9pZBIVQhMyMzAwMTQ5MzE0ODE5MzQ1NzM1&filename=&opi=89354086";
https.get(url, (res) => {
  const path = "temp_stitch_screen.html";
  const filePath = fs.createWriteStream(path);
  res.pipe(filePath);
  filePath.on('finish',() => {
      filePath.close();
      console.log('Download Completed');
  });
});
