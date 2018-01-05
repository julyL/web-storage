import babel from "rollup-plugin-babel";
import resolve from 'rollup-plugin-node-resolve';
import commonjs from 'rollup-plugin-commonjs';
import uglify from 'rollup-plugin-uglify';

var prod = process.env.NODE_ENV=='production',
  distPath;
if (prod) {
  distPath = "./dist/lStore.min.js";
} else {
  distPath = "./dist/lStore.js";
}
export default {
  entry : "./index.js",
  dest : distPath,
  plugins : [
    resolve({jsnext: true, main: true, browser: true}),
    commonjs(),
    babel({exclude: "node_modules/**", presets: ["es2015-rollup"]}),
    prod&&uglify()
  ],
  format : "umd",
  moduleName : "lStore"
};
