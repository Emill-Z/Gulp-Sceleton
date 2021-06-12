
const { series, parallel, src, dest, lastRun, watch } = require('gulp');
const browsersync = require("browser-sync").create();
const del = require('del');
// const sourcemaps = require('gulp-sourcemaps');
const gulpIf = require('gulp-if');
const sass = require('gulp-sass');
const notify = require("gulp-notify");
const autoprefixer = require('gulp-autoprefixer');
const imagemin = require('gulp-imagemin');
const babel = require('gulp-babel');
const newer = require('gulp-newer');
const concat = require('gulp-concat');
const debug = require('gulp-debug');

const isDevelopment = !process.env.NODE_ENV || process.env.NODE_ENV == 'development';

const _PATH = {
    base: 'src',
    root: 'dist',
    fonts: 'src/fonts/**',
    styles: ['src/styles/fonts.scss', 'src/styles/index.scss', 'src/styles/adaptive.scss'],
    html: 'src/*.html',
    img: 'src/img/**',
    script: 'src/js/*.js',
    lib: 'src/lib/**',
}

function browserSync() {
    return browsersync.init({
        server: {
            baseDir: _PATH.root
        },
        port: 3000
    });
}

// function browserSyncReload(done) {
//     browsersync.reload();
//     done();
// }

function clean() {
    return del(_PATH.root);
}

function copyHtml() {
    return src(_PATH.html).pipe(dest(_PATH.root)).pipe(browsersync.stream());
}

function buildCss() {
    return src(_PATH.styles, { base: _PATH.base })
        // .pipe(gulpIf(isDevelopment, sourcemaps.init()))
        .pipe(sass().on('error', sass.logError))
        .on('error', notify.onError(function (err) {
            return {
                title: 'sass',
                message: err.message
            }
        }))
        // .pipe(gulpIf(isDevelopment, sourcemaps.write()))
        .pipe(autoprefixer())
        .pipe(concat('styles/main.css'))
        // .pipe(gulpIf(!isDevelopment, minify_css())) --- is not implemented
        .pipe(dest(_PATH.root))
        .pipe(browsersync.stream());
}

function copyImages() {
    return src(_PATH.img, {
        base: _PATH.base,
        since: lastRun(copyImages)
    })
    .pipe(newer(_PATH.root))
    .pipe(debug({
        title: 'copyImages'
    }))
    .pipe(gulpIf(!isDevelopment, imagemin()))
    .pipe(dest(_PATH.root))
    .pipe(browsersync.stream());
}

function copyFonts() {
    return src(_PATH.fonts, {
        base: _PATH.base,
        since: lastRun(copyFonts)
    })
    .pipe(newer(_PATH.root))
    .pipe(debug({
        title: 'copyFonts'
    }))
    .pipe(dest(_PATH.root));
}

function scripts() {
    return src(_PATH.script, { base: _PATH.base })
        // .pipe(gulpIf(isDevelopment, sourcemaps.init()))
        .pipe(babel({
            presets: ['@babel/env']
        }))
        .pipe(concat('js/main.js'))
        // .pipe(gulpIf(isDevelopment, sourcemaps.write()))
        // .pipe(gulpIf(!isDevelopment, minify_js()))
        .pipe(dest(_PATH.root))
        .pipe(browsersync.stream());
}

function copyLibs() {
    return src(_PATH.lib, {
        base: _PATH.base,
        since: lastRun(copyLibs)
    })
    .pipe(newer(_PATH.root))
    .pipe(debug({
        title: 'copyLibs'
    }))
    .pipe(dest(_PATH.root));
}

function watchFiles() {
    watch(_PATH.html, copyHtml);
    watch(_PATH.fonts, copyFonts);
    watch(_PATH.img, copyImages);
    watch(_PATH.styles, buildCss);
    watch(_PATH.script, scripts);
}

const build = series(clean, parallel(copyHtml, buildCss, copyFonts, copyImages, scripts, copyLibs));
const watchAndSync = parallel(watchFiles, browserSync);

exports.clean = clean;
exports.build = build;
exports.default = series(build, watchAndSync);