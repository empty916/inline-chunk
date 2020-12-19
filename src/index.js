const sourceMappingURL = require('source-map-url');


class InlineChunk {
	constructor(options) {
		this.chunkName = options.chunkName;
		this.chunkNameReg = new RegExp(this.chunkName);
	}
	matchTargetChunk(str) {
		return this.chunkNameReg.test(str);
	}
	apply(compiler) {
		this.removeThemeAssetsBeforeEmit(compiler);
		this.addThemeAssetsIntoHtml(compiler);
	}
	removeThemeAssetsBeforeEmit(compiler) {
		compiler.hooks.emit.tapAsync("InlineTheme", (compilation, cb) => {
			Object.keys(compilation.assets).forEach(key => {
				if (this.matchTargetChunk(key)) {
					delete compilation.assets[key];
				}
			});
			cb();
		});
	}
	addThemeAssetsIntoHtml(compiler) {
		compiler.hooks.compilation.tap("HtmlWebpackInlineChunkPlugin", compilation => {
			compilation.hooks.htmlWebpackPluginAlterAssetTags.tapAsync(
				"HtmlWebpackInlineChunkPlugin",
				(htmlPluginData, callback) => {
					const targetChunk = compilation.chunks.find(i => this.matchTargetChunk(i.name));
					const jsFilePaths = targetChunk.files.filter(f => /\.js$/.test(f));
					const cssFilePaths = targetChunk.files.filter(f => /\.css$/.test(f));

					jsFilePaths.forEach(jsfilePath => {
						const jsfilePathReg = new RegExp(jsfilePath);
                        const jsSource = sourceMappingURL.removeFrom(compilation.assets[jsfilePath].source());
						let shouldInsert = false;
						htmlPluginData.body = htmlPluginData.body.filter(i => {
							const name = i.attributes.src;
							if (name) {
								if (!jsfilePathReg.test(name) === false) {
									shouldInsert = true;
								}
								return !jsfilePathReg.test(name);
							}
							return true;
						});
						htmlPluginData.head = htmlPluginData.head.filter(i => {
							const name = i.attributes.src;
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
									type:'text/javascript',
									id: `${this.chunkName}-js`
								},
								innerHTML: jsSource,
							})
						}

					});

					cssFilePaths.forEach(cssfilePath => {
						const cssfilePathReg = new RegExp(cssfilePath);
						const cssSource = sourceMappingURL.removeFrom(compilation.assets[cssfilePath].source());
						let shouldInsert = false;
						htmlPluginData.body = htmlPluginData.body.filter(i => {
							const name = i.attributes.href;
							if (name) {
								if (!cssfilePathReg.test(name) === false) {
									shouldInsert = true;
								}
								return !cssfilePathReg.test(name);
							}
							return true;
						});
						htmlPluginData.head = htmlPluginData.head.filter(i => {
							const name = i.attributes.href;
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
									id: `${this.chunkName}-css`
								},
								innerHTML: cssSource,
							});
						}
					});
					callback();
				}
			);
		});
	}
}

module.exports = InlineChunk;
