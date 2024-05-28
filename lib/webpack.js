/*
	MIT License http://www.opensource.org/licenses/mit-license.php
	Author Tobias Koppers @sokra
*/

"use strict";

const util = require("util");
const webpackOptionsSchemaCheck = require("../schemas/WebpackOptions.check.js");
const webpackOptionsSchema = require("../schemas/WebpackOptions.json");
const Compiler = require("./Compiler");
const MultiCompiler = require("./MultiCompiler");
const WebpackOptionsApply = require("./WebpackOptionsApply");
const {
	applyWebpackOptionsDefaults,
	applyWebpackOptionsBaseDefaults
} = require("./config/defaults");
const { getNormalizedWebpackOptions } = require("./config/normalization");
const NodeEnvironmentPlugin = require("./node/NodeEnvironmentPlugin");
const memoize = require("./util/memoize");

/** @typedef {import("../declarations/WebpackOptions").WebpackOptions} WebpackOptions */
/** @typedef {import("../declarations/WebpackOptions").WebpackPluginFunction} WebpackPluginFunction */
/** @typedef {import("./Compiler").WatchOptions} WatchOptions */
/** @typedef {import("./MultiCompiler").MultiCompilerOptions} MultiCompilerOptions */
/** @typedef {import("./MultiStats")} MultiStats */
/** @typedef {import("./Stats")} Stats */

const getValidateSchema = memoize(() => require("./validateSchema"));

/**
 * @template T
 * @callback Callback
 * @param {Error | null} err
 * @param {T=} stats
 * @returns {void}
 */

/**
 * @param {ReadonlyArray<WebpackOptions>} childOptions options array
 * @param {MultiCompilerOptions} options options
 * @returns {MultiCompiler} a multi-compiler
 */
const createMultiCompiler = (childOptions, options) => {
	const compilers = childOptions.map((options, index) =>
		createCompiler(options, index)
	);
	const compiler = new MultiCompiler(compilers, options);
	for (const childCompiler of compilers) {
		if (childCompiler.options.dependencies) {
			compiler.setDependencies(
				childCompiler,
				childCompiler.options.dependencies
			);
		}
	}
	return compiler;
};

/**
 * @param {WebpackOptions} rawOptions options object
 * @param {number} [compilerIndex] index of compiler
 * @returns {Compiler} a compiler
 */
const createCompiler = (rawOptions, compilerIndex) => {
	// TODO-初始化3：合并配置getNormalizedWebpackOptions + applyWebpackOptionsBaseDefaults
	const options = getNormalizedWebpackOptions(rawOptions);
	console.log("✅ ✅ ✅ ~  options:", options);
	// 应用webpack的一些基本默认配置
	applyWebpackOptionsBaseDefaults(options);
	// 创建编译器对象：用上一步得到的参数创建 Compiler 对象
	// TODO-初始化4：创建Compiler对象
	const compiler = new Compiler(
		/** @type {string} */ (options.context),
		options
	);
	// 注入内置插件
	new NodeEnvironmentPlugin({
		infrastructureLogging: options.infrastructureLogging
	}).apply(compiler);

	// TODO-初始化5：遍历用户定义的 plugins 集合，执行插件的 apply 方法
	if (Array.isArray(options.plugins)) {
		for (const plugin of options.plugins) {
			if (typeof plugin === "function") {
				/** @type {WebpackPluginFunction} */
				(plugin).call(compiler, compiler);
			} else if (plugin) {
				plugin.apply(compiler);
			}
		}
	}
	applyWebpackOptionsDefaults(options, compilerIndex);
	console.log("✅ ✅ ✅ ~  environment:");
	compiler.hooks.environment.call();
	console.log("✅ ✅ ✅ ~  afterEnvironment:");
	compiler.hooks.afterEnvironment.call();
	// TODO-初始化6：调用 new WebpackOptionsApply().process 方法，加载各种内置插件
	// TODO  WebpackOptionsApply 类，webpack 内置了数百个插件，这些插件并不需要我们手动配置，WebpackOptionsApply 会在初始化阶段根据配置内容动态注入对应的插件
	new WebpackOptionsApply().process(options, compiler);
	compiler.hooks.initialize.call();
	return compiler;
};

/**
 * @callback WebpackFunctionSingle
 * @param {WebpackOptions} options options object
 * @param {Callback<Stats>=} callback callback
 * @returns {Compiler} the compiler object
 */

/**
 * @callback WebpackFunctionMulti
 * @param {ReadonlyArray<WebpackOptions> & MultiCompilerOptions} options options objects
 * @param {Callback<MultiStats>=} callback callback
 * @returns {MultiCompiler} the multi compiler object
 */

/**
 * @template T
 * @param {Array<T> | T} options options
 * @returns {Array<T>} array of options
 */
const asArray = options =>
	Array.isArray(options) ? Array.from(options) : [options];

const webpack = /** @type {WebpackFunctionSingle & WebpackFunctionMulti} */ (
	/**
	 * @param {WebpackOptions | (ReadonlyArray<WebpackOptions> & MultiCompilerOptions)} options options
	 * @param {Callback<Stats> & Callback<MultiStats>=} callback callback
	 * @returns {Compiler | MultiCompiler | null} Compiler or MultiCompiler
	 */
	(options, callback) => {
		// TODO-objectX: 调试起点
		debugger;
		const create = () => {
			if (!asArray(options).every(webpackOptionsSchemaCheck)) {
				// TODO-初始化输入2：validateSchema，校验配置
				getValidateSchema()(webpackOptionsSchema, options);
				util.deprecate(
					() => {},
					"webpack bug: Pre-compiled schema reports error while real schema is happy. This has performance drawbacks.",
					"DEP_WEBPACK_PRE_COMPILED_SCHEMA_INVALID"
				)();
			}
			/** @type {MultiCompiler|Compiler} */
			let compiler;
			/** @type {boolean | undefined} */
			let watch = false;
			/** @type {WatchOptions|WatchOptions[]} */
			let watchOptions;
			if (Array.isArray(options)) {
				/** @type {MultiCompiler} */
				compiler = createMultiCompiler(
					options,
					/** @type {MultiCompilerOptions} */ (options)
				);
				watch = options.some(options => options.watch);
				// 1.初始化阶段-初始化参数：从配置文件、 配置对象、Shell 参数中读取，与默认配置结合得出最终的参数
				watchOptions = options.map(options => options.watchOptions || {});
			} else {
				// 1.初始化阶段-初始化参数：从配置文件、 配置对象、Shell 参数中读取，与默认配置结合得出最终的参数
				const webpackOptions = /** @type {WebpackOptions} */ (options);
				console.trace("✅ ✅ ✅ ~  webpackOptions:", webpackOptions);
				/** @type {Compiler} */
				// 2.创建编译器对象：用上一步得到的参数创建 Compiler 对象
				compiler = createCompiler(webpackOptions);
				watch = webpackOptions.watch;
				watchOptions = webpackOptions.watchOptions || {};
			}
			return { compiler, watch, watchOptions };
		};
		if (callback) {
			try {
				debugger;
				const { compiler, watch, watchOptions } = create();
				if (watch) {
					compiler.watch(watchOptions, callback);
				} else {
					compiler.run((err, stats) => {
						compiler.close(err2 => {
							callback(
								err || err2,
								/** @type {options extends WebpackOptions ? Stats : MultiStats} */
								(stats)
							);
						});
					});
				}
				return compiler;
			} catch (err) {
				process.nextTick(() => callback(/** @type {Error} */ (err)));
				return null;
			}
		} else {
			const { compiler, watch } = create();
			if (watch) {
				util.deprecate(
					() => {},
					"A 'callback' argument needs to be provided to the 'webpack(options, callback)' function when the 'watch' option is set. There is no way to handle the 'watch' option without a callback.",
					"DEP_WEBPACK_WATCH_WITHOUT_CALLBACK"
				)();
			}
			return compiler;
		}
	}
);

module.exports = webpack;
