let renderer = require('./lib/renderer.js')

hexo.extend.renderer.register('scss', 'css', renderer)
hexo.extend.renderer.register('sass', 'css', renderer)