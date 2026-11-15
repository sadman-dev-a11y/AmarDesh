import fs from 'node:fs';
// Original source photos remain in Git for attribution and future edits, not in the app.
for(const name of fs.readdirSync('dist/photos')) if(name.endsWith('.jpg')) fs.unlinkSync('dist/photos/'+name);
