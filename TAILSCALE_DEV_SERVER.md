# Accessing the development server over Tailscale

This project uses Vite and is configured to listen on all network interfaces.

1. Open a terminal in the project directory:

   ```bash
   cd /mnt/557377b4-8a41-467d-a6ab-9205ddc5becc/Documents/Projects/DeepSWE-view
   ```

2. Start Vite with the port supplied as an environment variable:

   ```bash
   env PORT=5173 npm run dev -- --host 0.0.0.0
   ```

   Keep this terminal open while using the site.

3. Find the host's Tailscale IPv4 address:

   ```bash
   tailscale ip -4
   ```

   On this machine it is `100.88.99.127`.

4. On another device connected to the same Tailscale network, open:

   ```text
   http://100.88.99.127:5173/
   ```

5. To verify the server locally, run:

   ```bash
   curl -I http://100.88.99.127:5173/
   ```

   A working server returns `HTTP/1.1 200 OK`.

## Important detail

Use `env PORT=5173 npm run dev`, not `npm run dev PORT=5173`. The latter passes
`PORT=5173` as a Vite argument and can cause Vite to select another port or
serve the wrong project root.
