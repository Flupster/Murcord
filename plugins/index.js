const fs = require('fs');

exports.load = (discord, mumble, redis) => {
    fs.readdir(__dirname, (err, files) => {
        files.forEach(file => {
            if (file.endsWith('.js') && file !== 'index.js') {
                const filename = file.replace('.js', '')

                console.log('[PLUGINS] Loading', filename)
                const plugin = require('./' + filename)
                if (plugin.use) plugin.use(discord, mumble, redis)
                if (plugin.run) plugin.run()
            }
        })
    })
}