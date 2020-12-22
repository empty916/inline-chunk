"use strict";
var sourceMappingURL = require('source-map-url');
var InlineChunk = /** @class */ (function () {
    function InlineChunk(options) {
        if (!options.name) {
            throw new Error('InlineChunk: name is undefined!');
        }
        if (!options.test) {
            throw new Error('InlineChunk: test is undefined!');
        }
        this.chunkName = options.name;
        this.test = options.test;
        this.priority = options.priority || 10;
        this.chunkNameReg = new RegExp(this.chunkName);
    }
    InlineChunk.prototype.matchTargetChunk = function (str) {
        return this.chunkNameReg.test(str);
    };
    InlineChunk.prototype.apply = function (compiler) {
        this.addChunkConfig(compiler);
        this.removeThemeAssetsBeforeEmit(compiler);
        this.addThemeAssetsIntoHtml(compiler);
    };
    InlineChunk.prototype.addChunkConfig = function (compiler) {
        compiler.options.optimization = compiler.options.optimization || {};
        compiler.options.optimization.splitChunks = compiler.options.optimization.splitChunks || {};
        compiler.options.optimization.splitChunks.cacheGroups = compiler.options.optimization.splitChunks.cacheGroups || {};
        if (!!compiler.options.optimization.splitChunks.cacheGroups[this.chunkName]) {
            console.warn("You have configured a module named " + this.chunkName + "!");
        }
        compiler.options.optimization.splitChunks.cacheGroups[this.chunkName] = {
            priority: this.priority,
            test: this.test,
            name: this.chunkName,
        };
    };
    InlineChunk.prototype.removeThemeAssetsBeforeEmit = function (compiler) {
        var _this = this;
        compiler.hooks.emit.tapAsync("InlineTheme", function (compilation, cb) {
            Object.keys(compilation.assets).forEach(function (key) {
                if (_this.matchTargetChunk(key)) {
                    delete compilation.assets[key];
                }
            });
            cb();
        });
    };
    InlineChunk.prototype.addThemeAssetsIntoHtml = function (compiler) {
        var _this = this;
        compiler.hooks.compilation.tap("HtmlWebpackInlineChunkPlugin", function (compilation) {
            compilation.hooks.htmlWebpackPluginAlterAssetTags.tapAsync("HtmlWebpackInlineChunkPlugin", function (htmlPluginData, callback) {
                try {
                    var targetChunk = compilation.chunks.find(function (i) { return _this.matchTargetChunk(i.name); });
                    var jsFilePaths = targetChunk.files.filter(function (f) { return /\.js$/.test(f); });
                    var cssFilePaths = targetChunk.files.filter(function (f) { return /\.css$/.test(f); });
                    jsFilePaths.forEach(function (jsfilePath) {
                        var jsfilePathReg = new RegExp(jsfilePath);
                        var jsSource = sourceMappingURL.removeFrom(compilation.assets[jsfilePath].source());
                        var shouldInsert = false;
                        htmlPluginData.body = htmlPluginData.body.filter(function (i) {
                            var name = i.attributes.src;
                            if (name) {
                                if (!jsfilePathReg.test(name) === false) {
                                    shouldInsert = true;
                                }
                                return !jsfilePathReg.test(name);
                            }
                            return true;
                        });
                        htmlPluginData.head = htmlPluginData.head.filter(function (i) {
                            var name = i.attributes.src;
                            if (name) {
                                if (!jsfilePathReg.test(name) === false) {
                                    shouldInsert = true;
                                }
                                return !jsfilePathReg.test(name);
                            }
                            return true;
                        });
                        if (shouldInsert === true) {
                            htmlPluginData.head.push({
                                tagName: 'script',
                                closeTag: true,
                                attributes: {
                                    type: 'text/javascript',
                                    id: _this.chunkName + "-js"
                                },
                                innerHTML: jsSource,
                            });
                        }
                    });
                    cssFilePaths.forEach(function (cssfilePath) {
                        var cssfilePathReg = new RegExp(cssfilePath);
                        var cssSource = sourceMappingURL.removeFrom(compilation.assets[cssfilePath].source());
                        var shouldInsert = false;
                        htmlPluginData.body = htmlPluginData.body.filter(function (i) {
                            var name = i.attributes.href;
                            if (name) {
                                if (!cssfilePathReg.test(name) === false) {
                                    shouldInsert = true;
                                }
                                return !cssfilePathReg.test(name);
                            }
                            return true;
                        });
                        htmlPluginData.head = htmlPluginData.head.filter(function (i) {
                            var name = i.attributes.href;
                            if (name) {
                                if (!cssfilePathReg.test(name) === false) {
                                    shouldInsert = true;
                                }
                                return !cssfilePathReg.test(name);
                            }
                            return true;
                        });
                        if (shouldInsert === true) {
                            htmlPluginData.head.push({
                                tagName: "style",
                                closeTag: true,
                                attributes: {
                                    type: "text/css",
                                    id: _this.chunkName + "-css"
                                },
                                innerHTML: cssSource,
                            });
                        }
                    });
                }
                finally {
                    callback();
                }
            });
        });
    };
    return InlineChunk;
}());
module.exports = InlineChunk;
