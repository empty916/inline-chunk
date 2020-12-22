const sourceMappingURL = require('source-map-url');


interface InlineChunkArg {
	name: string;
	test: RegExp | Array<RegExp>;
	priority?: number;
}

class InlineChunk {

	chunkName: InlineChunkArg['name'];
	test: InlineChunkArg['test'];
	priority: number;
	chunkNameReg: RegExp;

	constructor(options: InlineChunkArg) {

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
	matchTargetChunk(str: string) {
		return this.chunkNameReg.test(str);
	}
	apply(compiler: any) {
		this.addChunkConfig(compiler);
		this.removeThemeAssetsBeforeEmit(compiler);
		this.addThemeAssetsIntoHtml(compiler);
	}
	addChunkConfig(compiler: any) {
		compiler.options.optimization = compiler.options.optimization || {};
		compiler.options.optimization.splitChunks = compiler.options.optimization.splitChunks || {};
		compiler.options.optimization.splitChunks.cacheGroups = compiler.options.optimization.splitChunks.cacheGroups || {};
		if (!!compiler.options.optimization.splitChunks.cacheGroups[this.chunkName]) {
			console.warn(`You have configured a module named ${this.chunkName}!`);
		}
		compiler.options.optimization.splitChunks.cacheGroups[this.chunkName] = {
			priority: this.priority,
			test: this.test,
			name: this.chunkName,
		};
	}
	removeThemeAssetsBeforeEmit(compiler: any) {
		compiler.hooks.emit.tapAsync("InlineTheme", (compilation: any, cb: any) => {
			Object.keys(compilation.assets).forEach(key => {
				if (this.matchTargetChunk(key)) {
					delete compilation.assets[key];
				}
			});
			cb();
		});
	}
	addThemeAssetsIntoHtml(compiler: any) {
		compiler.hooks.compilation.tap("HtmlWebpackInlineChunkPlugin", (compilation: any) => {
			compilation.hooks.htmlWebpackPluginAlterAssetTags.tapAsync(
				"HtmlWebpackInlineChunkPlugin",
				(htmlPluginData: any, callback: any) => {
					try {
						const targetChunk = compilation.chunks.find((i: any) => this.matchTargetChunk(i.name));
						const jsFilePaths = targetChunk.files.filter((f: string) => /\.js$/.test(f));
						const cssFilePaths = targetChunk.files.filter((f: string) => /\.css$/.test(f));
	
						jsFilePaths.forEach((jsfilePath: string) => {
							const jsfilePathReg = new RegExp(jsfilePath);
							const jsSource = sourceMappingURL.removeFrom(compilation.assets[jsfilePath].source());
							let shouldInsert = false;
							htmlPluginData.body = htmlPluginData.body.filter((i: any) => {
								const name = i.attributes.src;
								if (name) {
									if (!jsfilePathReg.test(name) === false) {
										shouldInsert = true;
									}
									return !jsfilePathReg.test(name);
								}
								return true;
							});
							htmlPluginData.head = htmlPluginData.head.filter((i: any) => {
								const name = i.attributes.src;
								if (name) {
									if (!jsfilePathReg.test(name) === false) {
										shouldInsert = true;
									}
									return !jsfilePathReg.test(name);
								}
								return true;
							});
							
							if ((shouldInsert as boolean) === true) {
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
						cssFilePaths.forEach((cssfilePath: string) => {
							const cssfilePathReg = new RegExp(cssfilePath);
							const cssSource = sourceMappingURL.removeFrom(compilation.assets[cssfilePath].source());
							let shouldInsert = false;
							htmlPluginData.body = htmlPluginData.body.filter((i: any) => {
								const name = i.attributes.href;
								if (name) {
									if (!cssfilePathReg.test(name) === false) {
										shouldInsert = true;
									}
									return !cssfilePathReg.test(name);
								}
								return true;
							});
							htmlPluginData.head = htmlPluginData.head.filter((i: any) => {
								const name = i.attributes.href;
								if (name) {
									if (!cssfilePathReg.test(name) === false) {
										shouldInsert = true;
									}
									return !cssfilePathReg.test(name);
								}
								return true;
							});
							if ((shouldInsert as boolean) === true) {
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
					} finally {
						callback();
					}
				}
			);
		});
	}
}

module.exports = InlineChunk;
