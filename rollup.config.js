import babel from "rollup-plugin-babel";

export default {
  entry: "./src/Store.js",
  dest: "./dist/Store.js",
  plugins: [
    babel({
      exclude: "node_modules/**",
      presets: ["es2015-rollup"]
    })
  ],
  format: "umd",
  moduleName: "Store"
};
