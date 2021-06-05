import { series, parallel, src, dest, watch as gulpWatch } from "gulp"
import babel from "gulp-babel"
import sass from "gulp-sass"
import autoprefixer from "gulp-autoprefixer"
import fileInclude from "gulp-file-include"
import clean from "gulp-clean"
import notify from "gulp-notify"
import sourceMaps from "gulp-sourcemaps"
import uglify from "gulp-uglify"
import gulpIf from "gulp-if"
import { create } from "browser-sync"

const HTML_PATH = { src: "./src/**/*.html", dist: "dist" }
const CSS_PATH = { src: ["./src/**/*.scss", "./src/**/*.css"], dist: "dist" }
const JS_PATH = { src: "./src/**/*.js", dist: "dist", sourceMapDist: "map" }

const browserSync = create()

const clear = () => src("dist", { allowEmpty: true }).pipe(clean())

const html = (isCompile) => {
	const html = () =>
		src(HTML_PATH.src)
			.pipe(
				fileInclude({
					prefix: "@@",
					basepath: "src",
				})
			)
			.pipe(dest(HTML_PATH.dist))
			.pipe(gulpIf(!isCompile, notify({ message: "html complete" })))
	return html
}

const script = (isCompile) => {
	const script = () =>
		src(JS_PATH.src)
			.pipe(sourceMaps.init())
			.pipe(babel())
			.pipe(gulpIf(isCompile, uglify()))
			.pipe(sourceMaps.write(JS_PATH.sourceMapDist))
			.pipe(dest(JS_PATH.dist))
			.pipe(gulpIf(!isCompile, notify({ message: "script complete" })))

	return script
}

const css = (isCompile) => {
	const css = () =>
		src(CSS_PATH.src)
			.pipe(sass())
			.on("error", sass.logError)
			.pipe(autoprefixer())
			.pipe(dest(CSS_PATH.dist))
			.pipe(gulpIf(!isCompile, notify({ message: "css complete" })))
	return css
}

const server = (cb) => {
	browserSync.init(
		{
			server: "./dist",
		},
		(err, bs) => {
			if (err) {
				console.error("bs error", err)
				cb(err)
				return
			}
			cb()
		}
	)
}

const watchFile = (isCompile) => {
	const watchFile = () => {
		gulpWatch(HTML_PATH.src, html(isCompile)).on("change", browserSync.reload)
		gulpWatch(CSS_PATH.src, css(isCompile)).on("change", browserSync.reload)
		gulpWatch(JS_PATH.src, script(isCompile)).on("change", browserSync.reload)
	}
	return watchFile
}

const compile = (isCompile) => series(clear, parallel(html(isCompile), script(isCompile), css(isCompile)))

export const watch = series(compile(false), server, watchFile(false))
export default compile(true)
