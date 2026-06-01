import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { chunkSplitPlugin } from 'vite-plugin-chunk-split';
import compressionPlugin from 'vite-plugin-compression';
import { visualizer } from 'rollup-plugin-visualizer';

const compressedAssetPattern = /\.(js|mjs|json|css|html)$/i;

const manualChunks = {
    'react-vendor': [/node_modules\/(?:react|react-dom)\//],
    'router-vendor': [/node_modules\/react-router-dom\//],
    'redux-vendor': [/node_modules\/(?:@reduxjs\/toolkit|react-redux)\//],
    'antd-vendor': [/node_modules\/(?:antd|@ant-design\/icons)\//],
    'mui-vendor': [/node_modules\/(?:@mui\/material|@mui\/icons-material|@emotion\/react|@emotion\/styled)\//],
    'charts-vendor': [/node_modules\/(?:@ant-design\/charts|@ant-design\/plots)\//],
    'markdown-vendor': [
        /node_modules\/(?:@bytemd|bytemd)\//,
        /node_modules\/github-markdown-css\//,
        /node_modules\/katex\//,
        /node_modules\/markdown-navbar\//,
        /node_modules\/react-markdown\//,
        /node_modules\/react-syntax-highlighter\//,
        /node_modules\/(?:rehype-katex|rehype-raw|remark-gfm|remark-math|remark-toc)\//,
    ],
    'motion-vendor': [/node_modules\/(?:framer-motion|gsap)\//],
    'utility-vendor': [/node_modules\/(?:axios|dayjs|lodash|typed\.js)\//],
};

export default defineConfig({
    base: '/',
    mode: 'production',
    plugins: [
        react(),
        chunkSplitPlugin({
            customSplitting: manualChunks,
        }),
        compressionPlugin({
            algorithm: 'gzip',
            ext: '.gz',
            filter: compressedAssetPattern,
            threshold: 1025,
            verbose: false,
            deleteOriginFile: false,
        }),
    ],
    server: {
        proxy: {
            '/uploads': {
                target: 'http://127.0.0.1:8080',
                changeOrigin: true,
            },
        },
    },

    build: {
        cssCodeSplit: true,
        terserOptions: {
            compress: {
                drop_console: true, // 生产环境下去除console
                drop_debugger: true, // 生产环境下去除debugger
            }
        },
        assetsDir: 'assets', // 指定生成静态资源的存放路径,相对于outDir
        assetsInlineLimit: 4096,// 小于此阈值的导入或引用资源将内联为 base64 编码，以避免额外的 http 请求。
        sourcemap: false, // 是否生成map文件
        reportCompressedSize: true, //  gzip 压缩大小报告。
        rollupOptions: {
            plugins: [
                visualizer({
                    open: false,
                    filename: 'dist/stats.html', // 输出文件的名称
                    gzipSize: true, // 显示gzip后的大小
                    brotliSize: true, // 显示brotli压缩后的大小
                })
            ],
            output: {
                chunkFileNames: 'vendor/[name]-[hash].js',
                entryFileNames: 'js/[name]-[hash].js',
                assetFileNames: '[ext]/[name]-[hash].[ext]',
            },
        }
    },
});
