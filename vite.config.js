export default {
  server: {
    proxy: {
      '/calc-generator': {
        target: 'https://fpece.com',
        changeOrigin: true,
        rewrite: path => path.replace(/^\/calc-generator/, '')
      }
    }
  }
}