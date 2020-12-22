# inline-chunk
webpack plugin，insert chunk code into html




```ts
import InlineChunk from 'inline-chunk';

// webpack config
plugins: {

    new HtmlWebpackPlugin({/* ... */}),
    // put it after HtmlWebpackPlugin config
    new InlineChunk({
        name: 'chunkName',
        test: /chunkReg/,
        priority: 0, // default: 10
    }),
}
```