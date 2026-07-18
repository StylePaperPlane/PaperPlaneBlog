export interface ServiceWorkerControllerSource extends EventTarget {
    readonly controller: ServiceWorker | null;
}

export const waitForServiceWorkerController = (
    source: ServiceWorkerControllerSource,
    timeoutMs = 10_000,
): Promise<ServiceWorker> => new Promise((resolve, reject) => {
    let settled = false;
    const timeout = window.setTimeout(() => {
        finish(() => reject(new Error('安全媒体组件启动超时')));
    }, timeoutMs);
    const finish = (settle: () => void) => {
        if (settled) return;
        settled = true;
        window.clearTimeout(timeout);
        source.removeEventListener('controllerchange', onControllerChange);
        settle();
    };
    const resolveCurrentController = () => {
        const controller = source.controller;
        if (controller) finish(() => resolve(controller));
    };
    const onControllerChange = () => resolveCurrentController();

    source.addEventListener('controllerchange', onControllerChange);
    resolveCurrentController();
});
