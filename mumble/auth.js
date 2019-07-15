const spawn = require("child_process").spawn
let authProcess

exports.start = () => {
    authProcess = spawn('python3', [__dirname + '/auth.py'])
    console.log('[PYAUTH] Python authentication process has started')

    authProcess.stdout.on('data', data => console.log('[PYAUTH]', data.toString()))
    authProcess.stderr.on('data', data => console.error('[PYAUTH]', data.toString()))

    authProcess.on('exit', (code, signal) => {
        setTimeout(this.start, 1000)
        console.error('[PYAUTH] child has exited, restarting in 1s...')
    })
}