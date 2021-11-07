/** 
 * 参考：
 * https://github.com/sass/node-sass
 * https://github.com/mamboer/hexo-renderer-scss
 * https://github.com/next-theme/hexo-renderer-ruby-sass
 */
const sass = require("sass")
const magicImporter = require("node-sass-magic-importer")
const rgba = require("color-rgba")


function getProperty(obj, ckey) {
    ckey = ckey.replace(/\[(\w+)\]/g, ".$1").replace(/^\./, "")
    if (!Object.prototype.hasOwnProperty.call(obj, ckey)) return ""
    else return eval(`obj.${ckey}`)
}

function returnValue(value) {
    // 此函数仅进行判断并输出，不进行排误
    // 如果一些数据类型（比如 List 和 Map）中嵌套的数据不是允许的，会导致 sass 报错
    if (Array.isArray(value)) {
        result = new sass.types.List(value.length)
        value.forEach((val, i) => {
            result.setValue(i, returnValue(val))
        })
    } else if (typeof value === "object") {
        result = new sass.types.Map(Object.keys(value).length)
        Object.keys(value).forEach((key, i) => {
            let val = value[key]
            result.setKey(i, returnValue(key))
            result.setValue(i, returnValue(val))
        })
    } else if (typeof value === "boolean") {
        result = sass.types.Boolean[value ? "TRUE" : "FALSE"]
    } else if (typeof value === "number") {
        result = new sass.types.Number(value)
    } else if (rgba(value).length === 4) {
        let color = rgba(value)
        result = new sass.types.Color(...color)
    } else if (value !== "") {
        result = new sass.types.String(value)
    } else {
        result = new sass.types.Null.NULL
    }
}

module.exports = function(data, options) {
    const config = Object.assign({
        debug: false,
        outputStyle: "compressed",
        sourceComments: false,
        sourceMapEmbed: false
    }, this.config.sass, this.theme.config.sass)
    try {
        let result = sass.renderSync({
            ...config,
            data: data.text,
            file: data.path,
            importer: magicImporter(),
            functions: {
                "hexo-config($ckey)": function(ckey) {
                    let value = getProperty(this.config, ckey.getValue())
                    let result = returnValue(value)
                    if (config.debug) {
                        this.log.info(`[sass-renderer-debug] >>> hexo-config.${ckey.getValue()}: ${value}`)
                    }
                    return result
                },
                "hexo-theme-config($ckey)": function(ckey) {
                    let value = getProperty(this.theme.config, ckey.getValue())
                    let result = returnValue(value)
                    if (config.debug) {
                        this.log.info(`[sass-renderer-debug] >>> hexo-theme-config.${ckey.getValue()}: ${value}`)
                    }
                    return result
                }
            }
        })
        return result.css.toString()
    } catch (error) {
        this.log.error(error.toString())
        throw error
    }
}