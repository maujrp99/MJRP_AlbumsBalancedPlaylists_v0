// Metro's Babel transformer, with one addition: a `.tsv` file becomes a module whose default export
// is its text. Used for the golden reference index (test/fixtures/golden-core/reference/cases.tsv),
// so the app's self-test reads the committed file itself. Every other file goes to Expo's
// transformer unchanged.
const upstream = require('@expo/metro-config/build/babel-transformer')

module.exports = {
    ...upstream,
    transform(props) {
        if (props.filename.endsWith('.tsv')) {
            return upstream.transform({ ...props, src: `module.exports = ${JSON.stringify(props.src)};` })
        }
        return upstream.transform(props)
    }
}
