import { describe, it, expect } from 'vitest';
import { ApiPromise, WsProvider } from '@polkadot/api';
import net from 'node:net';

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
    if (!(await isPortReachable(hostname, Number(port || 9944), 1000))) return;

    const api = await ApiPromise.create({ provider: new WsProvider(endpoint, 1) });
    const pallets = api.runtimeMetadata.asLatest.pallets.map((p) => p.name.toString().toLowerCase());
    const hasNfts = pallets.includes('nfts')
    expect(hasNfts).toBe(true);
    await api.disconnect();
  });
});
