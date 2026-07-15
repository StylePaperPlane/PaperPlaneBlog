import workerUrl from './secureMediaWorker.ts?worker&url';
import type {IssuedTrackKey, SecureTrackDescriptor} from '../model/types';
import type {RegisterMediaAssetMessage, WorkerAcknowledgement} from './protocol';
import {SecureMediaSessionError} from '../model/errors';

let controllerPromise: Promise<ServiceWorker> | null = null;

export async function registerMediaAsset(
    descriptor: SecureTrackDescriptor,
    details: IssuedTrackKey,
    key: CryptoKey,
    signal: AbortSignal,
): Promise<{url: string; release: () => void}> {
    const controller = await getController(signal);
    const message: RegisterMediaAssetMessage = {type: 'register-media-asset', descriptor, details, key};
    await sendWithAcknowledgement(controller, message, signal);
    return {
        url: `/__media/${descriptor.assetId}.${descriptor.audioFormat}`,
        release: () => controller.postMessage({type: 'release-media-asset', assetId: descriptor.assetId}),
    };
}

async function getController(signal: AbortSignal): Promise<ServiceWorker> {
    if (!('serviceWorker' in navigator)) {
        throw new SecureMediaSessionError('当前浏览器不支持安全媒体组件');
    }
    controllerPromise ??= installAndClaimWorker().catch(error => {
        controllerPromise = null;
        throw error;
    });
    return abortable(controllerPromise, signal);
}

async function installAndClaimWorker(): Promise<ServiceWorker> {
    await navigator.serviceWorker.register(workerUrl, {scope: '/', type: 'module'});
    await navigator.serviceWorker.ready;
    if (navigator.serviceWorker.controller) return navigator.serviceWorker.controller;

    return new Promise((resolve, reject) => {
        const timeout = window.setTimeout(() => finish(() => reject(new Error('安全媒体组件启动超时'))), 10_000);
        const onControllerChange = () => {
            const controller = navigator.serviceWorker.controller;
            if (controller) finish(() => resolve(controller));
        };
        const finish = (settle: () => void) => {
            window.clearTimeout(timeout);
            navigator.serviceWorker.removeEventListener('controllerchange', onControllerChange);
            settle();
        };
        navigator.serviceWorker.addEventListener('controllerchange', onControllerChange);
    });
}

function sendWithAcknowledgement(
    controller: ServiceWorker,
    message: RegisterMediaAssetMessage,
    signal: AbortSignal,
): Promise<void> {
    return new Promise((resolve, reject) => {
        const channel = new MessageChannel();
        const onAbort = () => finish(() => reject(signal.reason ?? new DOMException('安全媒体注册已中止', 'AbortError')));
        const finish = (settle: () => void) => {
            signal.removeEventListener('abort', onAbort);
            channel.port1.close();
            settle();
        };
        channel.port1.onmessage = (event: MessageEvent<WorkerAcknowledgement>) => {
            if (event.data.ok) finish(resolve);
            else finish(() => reject(new Error(event.data.error || '安全媒体注册失败')));
        };
        signal.addEventListener('abort', onAbort, {once: true});
        if (signal.aborted) {
            onAbort();
            return;
        }
        controller.postMessage(message, [channel.port2]);
    });
}

function abortable<T>(promise: Promise<T>, signal: AbortSignal): Promise<T> {
    if (signal.aborted) return Promise.reject(signal.reason ?? new DOMException('操作已中止', 'AbortError'));
    return new Promise((resolve, reject) => {
        const onAbort = () => reject(signal.reason ?? new DOMException('操作已中止', 'AbortError'));
        signal.addEventListener('abort', onAbort, {once: true});
        void promise.then(resolve, reject).finally(() => signal.removeEventListener('abort', onAbort));
    });
}
