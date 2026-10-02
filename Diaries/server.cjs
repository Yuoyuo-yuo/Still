const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const files = {'/':['index.html','text/html'], '/styles.css':['styles.css','text/css'], '/app.js':['app.js','text/javascript']};
const server = http.createServer((req,res)=>{
  const file = files[new URL(req.url,'http://localhost').pathname];
  if(!file){res.writeHead(404);res.end('Not found');return;}
  fs.readFile(path.join(__dirname,file[0]),(error,data)=>{if(error){res.writeHead(500);res.end('Could not read application file');return;}res.writeHead(200,{'Content-Type':file[1]+'; charset=utf-8','Cache-Control':'no-cache'});res.end(data);});
});
server.on('error',error=>{console.error(error.code==='EADDRINUSE'?'Port 4317 is already in use. If Still is running, open http://localhost:4317.':error.message);process.exitCode=1;});
server.listen(4317,'127.0.0.1',()=>console.log('Still is running at http://localhost:4317. Keep this window open while using the journal.'));
