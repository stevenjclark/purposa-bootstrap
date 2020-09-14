var gulp  = require('gulp'),
  sass = require('gulp-sass'),
  sourcemaps = require('gulp-sourcemaps'),
  concat = require('gulp-concat'),
  cleanCss = require('gulp-clean-css'),
  rename = require('gulp-rename'),
  postcss      = require('gulp-postcss'),
  autoprefixer = require('autoprefixer');


function buildCss() {
  return gulp.src(['assets/scss/*.scss'])
    .pipe(sourcemaps.init())
    .pipe(sass().on('error', sass.logError))
    .pipe(postcss([ autoprefixer({ browsers: [
      'Chrome >= 35',
      'Firefox >= 38',
      'Edge >= 12',
      'Explorer >= 10',
      'iOS >= 8',
      'Safari >= 8',
      'Android 2.3',
      'Android >= 4',
      'Opera >= 12']})]))
    .pipe(sourcemaps.write())
    .pipe(concat('purposa-bootstrap.css'))
    .pipe(cleanCss())
    .pipe(rename({suffix: '.min'}))
    .pipe(gulp.dest('dist/assets/css/'));
}

function buildJS(){    
  return gulp.src(
    ['node_modules/jquery/dist/jquery.min.js',
     'node_modules/bootstrap/dist/js/bootstrap.bundle.min.js',
     'assets/js/*.js'])
    .pipe(concat('purposa-bootstrap.min.js'))
    .pipe(gulp.dest('dist/assets/js'));
}

function movefonts(){ 
  return gulp.src(
  	['assets/fonts/*',
  	 'node_modules/@fortawesome/fontawesome-pro/webfonts/fa-light-300.eot',
  	 'node_modules/@fortawesome/fontawesome-pro/webfonts/fa-light-300.ttf',
  	 'node_modules/@fortawesome/fontawesome-pro/webfonts/fa-light-300.woff',
  	 'node_modules/@fortawesome/fontawesome-pro/webfonts/fa-light-300.woff2',
  	 'node_modules/@fortawesome/fontawesome-pro/webfonts/fa-brands-400.eot',
  	 'node_modules/@fortawesome/fontawesome-pro/webfonts/fa-brands-400.ttf',
  	 'node_modules/@fortawesome/fontawesome-pro/webfonts/fa-brands-400.woff',
  	 'node_modules/@fortawesome/fontawesome-pro/webfonts/fa-brands-400.woff2']  	 
  	 )
    .pipe(gulp.dest('dist/assets/fonts/'));
}

function moveImages(){ 
  return gulp.src(['assets/images/*'])
    .pipe(gulp.dest('dist/assets/images/'))
}

function copyDist(){ 
  return gulp.src(['dist/assets/**/*'])
  .pipe(gulp.dest('landing-page/assets'));
}

function watcher() {
  gulp.watch(['assets/scss/**/*'], gulp.series(buildCss, copyDist));
}

exports.watch = gulp.series(watcher, buildCss, copyDist);
exports.default = gulp.series(buildCss, buildJS, movefonts, moveImages, copyDist);

