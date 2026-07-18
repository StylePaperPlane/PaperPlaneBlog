import {afterEach, describe, expect, it, vi} from 'vitest';
import {waitForServiceWorkerController, type ServiceWorkerControllerSource} from './waitForController';

class ControllerSource extends EventTarget implements ServiceWorkerControllerSource {
    controller: ServiceWorker | null = null;
    onListenerAdded?: () => void;

    override addEventListener(type: string, callback: EventListenerOrEventListenerObject | null, options?: boolean | AddEventListenerOptions) {
        super.addEventListener(type, callback, options);
        if (type === 'controllerchange') this.onListenerAdded?.();
    }
}

describe('waitForServiceWorkerController', () => {
    afterEach(() => {
        vi.useRealTimers();
    });

    it('resolves when control is acquired between the initial check and listener registration', async () => {
        const source = new ControllerSource();
        const controller = {} as ServiceWorker;
        source.onListenerAdded = () => {
            source.controller = controller;
        };

        await expect(waitForServiceWorkerController(source)).resolves.toBe(controller);
    });

    it('resolves from a later controllerchange event', async () => {
        const source = new ControllerSource();
        const controller = {} as ServiceWorker;
        const result = waitForServiceWorkerController(source);
        source.controller = controller;
        source.dispatchEvent(new Event('controllerchange'));

        await expect(result).resolves.toBe(controller);
    });

    it('times out without leaving a pending listener', async () => {
        vi.useFakeTimers();
        const source = new ControllerSource();
        const result = waitForServiceWorkerController(source, 50);
        const rejection = expect(result).rejects.toThrow('安全媒体组件启动超时');
        await vi.advanceTimersByTimeAsync(50);

        await rejection;
    });
});
