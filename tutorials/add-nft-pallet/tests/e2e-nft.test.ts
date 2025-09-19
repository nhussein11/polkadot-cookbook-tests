import { describe, it, expect } from 'vitest';
import { ApiPromise, WsProvider } from '@polkadot/api';
import net from 'node:net';
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

async function isPortReachable(host: string, port: number, timeoutMs: number): Promise<boolean> {
  return new Promise((resolve) => {
    const socket = new net.Socket();
    const done = (ok: boolean) => { try { socket.destroy(); } catch {} ; resolve(ok); };
    socket.setTimeout(timeoutMs);
    socket.once('error', () => done(false));
    socket.once('timeout', () => done(false));
    socket.connect(port, host, () => done(true));
  });
}

describe('pallet-nfts integration', () => {
  it('connects and sees pallet_nfts metadata', async () => {
    const endpoint = process.env.POLKADOT_WS || 'ws://127.0.0.1:9944';
    const { hostname, port } = new URL(endpoint.replace('ws://', 'http://'));

    let nodeProc: ReturnType<typeof spawn> | null = null;
    let started = false;

    try {
      // If not reachable, try to spawn polkadot-omni-node using an existing chain_spec.json
      if (!(await isPortReachable(hostname, Number(port || 9944), 1000))) {
        const repoRoot = path.resolve(__dirname, '../../../');
        const chainSpec = path.join(repoRoot, 'kitchensink-parachain', 'chain_spec.json');
        const omni = 'polkadot-omni-node';
        if (fs.existsSync(chainSpec)) {
          try {
            nodeProc = spawn(omni, ['--chain', chainSpec, '--dev', '--dev-block-time', '1000'], {
              cwd: repoRoot,
              stdio: 'ignore',
              detached: true,
            });
            started = true;
          } catch {}

          // Wait for RPC to come up (max ~20s)
          for (let i = 0; i < 10; i++) {
            const ok = await isPortReachable(hostname, Number(port || 9944), 1000);
            if (ok) break;
            await new Promise((r) => setTimeout(r, 2000));
          }
        }
      }

      // If still unreachable, it should fail
      expect(await isPortReachable(hostname, Number(port || 9944), 1000)).toBe(true);


      const api = await ApiPromise.create({ provider: new WsProvider(endpoint, 1) });
      const pallets = api.runtimeMetadata.asLatest.pallets.map((p) => p.name.toString().toLowerCase());
      const hasNfts = pallets.includes('nfts') || pallets.includes('pallet_nfts');
      expect(hasNfts).toBe(true);
      await api.disconnect();
    } finally {
      if (started && nodeProc && nodeProc.pid) {
        try { process.kill(-nodeProc.pid, 'SIGTERM'); } catch {}
      }
    }
  });
});
