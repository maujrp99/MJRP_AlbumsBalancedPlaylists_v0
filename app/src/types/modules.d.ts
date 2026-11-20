// The golden reference index, bundled as text (metro.config.js, tsvTransformer.js; jest/tsvTransform.js).
declare module '*.tsv' {
    const text: string
    export default text
}
