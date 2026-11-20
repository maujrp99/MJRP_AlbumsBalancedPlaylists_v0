// Jest's side of tsvTransformer.js: a `.tsv` file is a module whose export is its text.
module.exports = {
    process(src) {
        return { code: `module.exports = ${JSON.stringify(src)};` }
    }
}
