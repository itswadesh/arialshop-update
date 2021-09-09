const shell = require('shelljs')

shell.rm('-Rf', 'prod')
shell.mkdir('prod')
shell.mkdir('prod/server')
shell.cp('-R', 'dist/*', 'prod/server')
shell.cp('-R', 'package.json', 'prod/package.json')
shell.cp('-R', 'devops/pm2.config.js', 'prod/pm2.config.js')
