// import { defineConfig } from 'vite'
// import path from "path"
// import react from '@vitejs/plugin-react'

// export default defineConfig({
//   plugins: [react()],
//   resolve: {
//     alias: {
//       "@": path.resolve(__dirname, "./src"),
//     },
//   },
// })
import { defineConfig } from 'vite'
import path from "path"
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  // AÑADE ESTA SECCIÓN PARA EL PROXY
  server: {
    proxy: {
      // Las solicitudes a '/portalMIDDT' desde tu frontend (localhost:5173/portalMIDDT/...)
      // serán redirigidas al destino 'http://middtintranet/portalMIDDT/...'
      '/portalMIDDT': {
        target: 'http://middtintranet', // ¡Asegúrate de que este protocolo (http/https) sea el correcto para tu intranet!
        changeOrigin: true, // Esto es importante para el mayoría de los servidores
        secure: false, // Pon esto en 'false' si tu intranet usa HTTP y no tiene un certificado SSL válido. Si usa HTTPS y tiene uno válido, puedes quitarlo o ponerlo en true.
      },
    },
  },
})