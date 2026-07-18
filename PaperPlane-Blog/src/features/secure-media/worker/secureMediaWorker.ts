/// <reference lib="webworker" />

import {mediaSourceTypeFor} from '../model/audioFormat';
import type {IssuedTrackKey, SecureTrackDescriptor} from '../model/types';
import {decryptPpm1Chunk, openPpm1Stream} from '../playback/ppm1Stream';
import type {SecureMediaWorkerMessage, WorkerAcknowledgement} from './protocol';
import {InvalidMediaRangeError, parsePlaintextRange} from './range';

declare const self: ServiceWorkerGlobalScope;

interface RegisteredAsset {
    descriptor: SecureTrackDescriptor;
    details: IssuedTrackKey;
    key: CryptoKey;
}

const assets = new Map<string, RegisteredAsset>();

self.addEventListener('install', event => event.waitUntil(self.skipWaiting()));
self.addEventListener('activate', event => event.waitUntil(self.clients.claim()));

self.addEventListener('message', event => {
    const message = event.data as SecureMediaWorkerMessage;
    if (message.type === 'claim-media-clients') {
        event.waitUntil(self.clients.claim());
        return;
    }
    if (message.type === 'release-media-asset') {
        assets.delete(message.assetId);
        return;
    }

    const acknowledgement: WorkerAcknowledgement = validateRegistration(message)
        ? (assets.set(message.descriptor.assetId, message), {ok: true})
        : {ok: false, error: '安全媒体描述与密钥不一致'};
    event.ports[0]?.postMessage(acknowledgement);
});

self.addEventListener('fetch', event => {
    const url = new URL(event.request.url);
    if (url.origin !== self.location.origin || !url.pathname.startsWith('/__media/')) return;
    event.respondWith(serveVirtualMedia(event.request, url));
});

function validateRegistration(message: Extract<SecureMediaWorkerMessage, {type: 'register-media-asset'}>): boolean {
    return message.descriptor.assetId === message.details.assetId
        && message.descriptor.audioFormat === message.details.audioFormat
        && message.descriptor.plaintextSize === message.details.plaintextSize
        && message.descriptor.chunkSize === message.details.chunkSize
        && message.descriptor.chunkCount === message.details.chunkCount;
}

async function serveVirtualMedia(request: Request, url: URL): Promise<Response> {
    if (request.method !== 'GET' && request.method !== 'HEAD') {
        return new Response(null, {status: 405, headers: {'Cache-Control': 'no-store'}});
    }
    const match = /^\/__media\/([0-9a-f-]{36})\.(mp3|flac)$/.exec(url.pathname.toLowerCase());
    const registered = match ? assets.get(match[1]) : undefined;
    if (!match || !registered || match[2] !== registered.descriptor.audioFormat) {
        return new Response(null, {status: 404, headers: {'Cache-Control': 'no-store'}});
    }
    if (Date.parse(registered.details.expiresAt) <= Date.now()) {
        assets.delete(registered.descriptor.assetId);
        return new Response(null, {status: 410, headers: {'Cache-Control': 'no-store'}});
    }

    const total = registered.descriptor.plaintextSize;
    let range;
    try {
        range = parsePlaintextRange(request.headers.get('Range'), total);
    } catch (error) {
        if (!(error instanceof InvalidMediaRangeError)) throw error;
        return new Response(null, {
            status: 416,
            headers: {'Content-Range': `bytes */${total}`, 'Cache-Control': 'no-store'},
        });
    }

    const headers = new Headers({
        'Accept-Ranges': 'bytes',
        'Cache-Control': 'no-store',
        'Content-Type': mediaSourceTypeFor(registered.descriptor.audioFormat),
        'Content-Length': String(range.end - range.start + 1),
    });
    if (range.partial) headers.set('Content-Range', `bytes ${range.start}-${range.end}/${total}`);
    if (request.method === 'HEAD') {
        return new Response(null, {status: range.partial ? 206 : 200, headers});
    }

    const stream = await createDecryptedStream(registered, range.start, range.end);
    return new Response(stream, {status: range.partial ? 206 : 200, headers});
}

async function createDecryptedStream(
    registered: RegisteredAsset,
    start: number,
    end: number,
): Promise<ReadableStream<Uint8Array>> {
    const abortController = new AbortController();
    const context = await openPpm1Stream(
        registered.descriptor,
        registered.details,
        registered.key,
        abortController.signal,
    );
    let chunkIndex = Math.floor(start / registered.descriptor.chunkSize);
    const finalChunkIndex = Math.floor(end / registered.descriptor.chunkSize);

    return new ReadableStream<Uint8Array>({
        async pull(controller) {
            if (chunkIndex > finalChunkIndex) {
                controller.close();
                return;
            }
            try {
                const plaintext = await decryptPpm1Chunk(context, chunkIndex, abortController.signal);
                const chunkStart = chunkIndex * registered.descriptor.chunkSize;
                const sliceStart = Math.max(0, start - chunkStart);
                const sliceEnd = Math.min(plaintext.byteLength, end - chunkStart + 1);
                controller.enqueue(plaintext.slice(sliceStart, sliceEnd));
                chunkIndex += 1;
            } catch (error) {
                controller.error(error);
            }
        },
        cancel(reason) {
            abortController.abort(reason);
        },
    });
}

export {};
