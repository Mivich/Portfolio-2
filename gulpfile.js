// const project_folder = require('path').basename(__dirname);
const project_folder = 'build';
const source_folder = "src";

const fs = require('fs');

const path = {
    build: {
        html: project_folder + "/",
        css: project_folder + "/css/",
        js: project_folder + "/js/",
        img: project_folder + "/img/",
        fonts: project_folder + "/fonts/",
    },
    src: {
        html: source_folder + "/*.html",
        css: source_folder + "/scss/styles.scss",
        js: source_folder + "/js/*.js",
        img: source_folder + "/img/**",
        fonts: source_folder + "/fonts/*.ttf",
    },
    watch: {
        html: source_folder + "/**/*.html",
        css: source_folder + "/scss/**/*.scss",
        js: source_folder + "/js/**/*.js",
        img: source_folder + "/img/**/",
    },
    clean: "./" + project_folder + "/"
}

const {src, dest} = require('gulp'),
    gulp = require('gulp'),
    browsersync = require("browser-sync").create(),
    fileInclude = require("gulp-file-include"),
    del = require("del"),
    scss = require("gulp-sass")(require('sass')),
    autoPrefixer = require("gulp-autoprefixer"),
    groupMedia = require('gulp-group-css-media-queries'),
    cleanCss = require('gulp-clean-css'),
    rename = require('gulp-rename'),
    uglify = require('gulp-uglify-es').default,
    imagemin = require('gulp-imagemin'),
    webp = require('gulp-webp'),
    webpHtml = require('gulp-webp-html'),
    ttf2woff = require('gulp-ttf2woff'),
    ttf2woff2 = require('gulp-ttf2woff2'),
    fonter = require('gulp-fonter'),
    svgSprite = require('gulp-svg-sprite'),
    svgStore = require('gulp-svgstore'),
    svgMin = require('gulp-svgmin');

    function fonts() {
        src(path.src.fonts)
            .pipe(ttf2woff())
            .pipe(dest(path.build.fonts));
        return src(path.src.fonts)
            .pipe(ttf2woff2())
            .pipe(dest(path.build.fonts));
    };

    gulp.task('otf2ttf', function () {
        return src([source_folder+ '/fonts/*.otf'])
            .pipe(fonter({
                formats: ['ttf']
            }))
            .pipe(dest(source_folder + '/fonts/'))
    })

    function browserSync(param) {
        browsersync.init({
            server: {
                baseDir: "./" + project_folder + "/"
            },
            port: 3000,
            notify: false
        })
    }

    function html() {
        return src(path.src.html)
            .pipe(fileInclude())
            .pipe(webpHtml())
            .pipe(dest(path.build.html))
            .pipe(browsersync.stream())
    }

    function images() {
        return src(path.src.img)
            .pipe(
                webp({
                    quality: 80
                })
            )
            .pipe(dest(path.build.img))
            .pipe(src(path.src.img))
            .pipe(imagemin({
                progressive: true,
                svgoPlugins: [{removeViewBox: false}],
                interlaced: true,
                optimizationLevel: 3
            }))
            .pipe(dest(path.build.img))
            .pipe(browsersync.stream())
    };

    

    function css() {
        return src(path.src.css)
            .pipe(
                scss({
                    outputStyle:"expanded"
                })
            )
            .pipe(
                groupMedia()
            )
            .pipe(
                autoPrefixer({
                    overrideBrowserslist: ["last 5 versions"],
                    cascade: true
                })
            )
            .pipe(dest(path.build.css))
            .pipe(cleanCss())
            .pipe(
                rename({
                    extname: ".min.css"
                })
            )
            .pipe(dest(path.build.css))
            .pipe(browsersync.stream())
    }

    function js() {
        return src(path.src.js)
            .pipe(fileInclude())
            .pipe(dest(path.build.js))
            .pipe(uglify())
            .pipe(
                rename({
                    extname: ".min.js"
                })
            )
            .pipe(dest(path.build.js))
            .pipe(browsersync.stream())
    }

    function fontsStyle(cb) {
        let file_content = fs.readFileSync(source_folder + '/scss/fonts.scss');
        if (file_content == '') {
          fs.writeFile(source_folder + '/scss/fonts.scss', '', cb);
          return fs.readdir(path.build.fonts, function (err, items) {
            if (items) {
              let c_fontname;
              for (var i = 0; i < items.length; i++) {
                let fontname = items[i].split('.');
                fontname = fontname[0];
                if (c_fontname != fontname) {
                  fs.appendFile(source_folder + '/scss/fonts.scss', '@include font("' + fontname + '", "' + fontname + '", "400", "normal");\r\n', cb);
                }
                c_fontname = fontname;
              }
            }
          })
        }
        cb()
      }

    gulp.task('svgSprite', function() {
        return gulp.src([source_folder + '/iconsprite/*.svg'])
            .pipe(svgSprite({
                mode: {
                    stack: {
                        sprite: "../icons/icons.svg",
                        example: true
                    }
                },
            }))
            .pipe(dest(path.build.img))
    })

    gulp.task('svgStore', function() {
        return src(path.src.img)
        .pipe(svgStore())
        .pipe(rename({basename:'sprite'}))
        .pipe(dest(path.build.img))
    })


    function watchFiles(params) {
        gulp.watch([path.watch.html], html);
        gulp.watch([path.watch.css], css);
        gulp.watch([path.watch.js], js);
        gulp.watch([path.watch.img], images )
    }

    function clean(params) {
        return del(path.clean);
    }


    let build = gulp.series(clean, gulp.parallel(js, css, html, images, fonts), fontsStyle);
    let watch = gulp.parallel(build, watchFiles, browserSync);

    exports.fontsStyle = fontsStyle;
    exports.fonts = fonts;
    exports.images = images;
    exports.js = js;
    exports.css = css;
    exports.build = build;
    exports.html = html;
    exports.watch = watch;
    exports.default = watch;