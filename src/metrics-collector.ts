import { OTLPMetricExporter } from '@opentelemetry/exporter-metrics-otlp-grpc';
import { SemanticResourceAttributes } from '@opentelemetry/semantic-conventions';
import { Resource } from '@opentelemetry/resources';
import {
    MeterProvider,
    PeriodicExportingMetricReader,
} from '@opentelemetry/sdk-metrics';

import {Config} from './config';

export const init = (config: Config): void => {
    const metricsExporter = new OTLPMetricExporter({ url: config.target });
    const serviceName = config.serviceName;
    const projectName = config.projectName;
    const meterProvider = new MeterProvider({
        resource: new Resource({
            [SemanticResourceAttributes.SERVICE_NAME]: serviceName,
            ['mw_agent']: true,
            ['project.name']: projectName,
            ['mw.account_key']: config.accessToken,
            ['runtime.metrics.nodejs']: true,
            ['mw.app.lang']: 'nodejs',
            ['mw_serverless']:config.isServerless ? 1 : 0,
        }),
    });
    // @ts-ignore
    meterProvider.addMetricReader(
        new PeriodicExportingMetricReader({
            exporter: metricsExporter,
            exportIntervalMillis: 10000,
        })
    );
   config.meterProvider = meterProvider;
   const apmPauseMetrics = config.pauseMetrics && config.pauseMetrics === 1;
    if (!apmPauseMetrics) {
        const v8 = require('v8');
        const os = require('os');
        let time = process.hrtime();
        let cpuUsage:any = false;
        if (config.collectMetrics) {
            setInterval(() => {
                const enqueue: Record<string, any> = {};
                if (process.cpuUsage) {
                    const elapsedTime = process.hrtime(time);
                    const elapsedUsage = process.cpuUsage(cpuUsage);
                    time = process.hrtime();
                    cpuUsage = process.cpuUsage();

                    const elapsedMs = elapsedTime[0] * 1000 + elapsedTime[1] / 1000000;
                    const userPercent =
                        (100 * elapsedUsage.user) / 1000 / elapsedMs;
                    const systemPercent =
                        (100 * elapsedUsage.system) / 1000 / elapsedMs;
                    const totalPercent = userPercent + systemPercent;

                    enqueue['cpu.system'] = systemPercent.toFixed(2);
                    enqueue['cpu.user'] = userPercent.toFixed(2);
                    enqueue['cpu.total'] = totalPercent.toFixed(2);
                    enqueue['cpu.uptime'] = Math.round(process.uptime());
                }

                if (v8.getHeapSpaceStatistics) {
                    const stats = v8.getHeapSpaceStatistics();
                    for (let i = 0, l = stats.length; i < l; i++) {
                        const tags = `${stats[i].space_name}`;
                        enqueue[`heap.size.by.space.${tags}`] = stats[i].space_size;
                        enqueue[`heap.used_size.by.space.${tags}`] =
                            stats[i].space_used_size;
                        enqueue[`heap.available_size.by.space.${tags}`] =
                            stats[i].space_available_size;
                        enqueue[`heap.physical_size.by.space.${tags}`] =
                            stats[i].physical_space_size;
                    }
                }

                const memoryStats = process.memoryUsage();
                enqueue[`mem.heap_total`] = memoryStats.heapTotal;
                enqueue[`mem.heap_used`] = memoryStats.heapUsed;
                enqueue[`mem.total`] = os.totalmem();
                enqueue[`mem.rss`] = os.freemem();
                if (memoryStats.external) {
                    enqueue[`mem.external`] = memoryStats.external;
                }

                const heapStats = v8.getHeapStatistics();
                enqueue[`heap.total_heap_size`] = heapStats.heapTotal;
                enqueue[`heap.total_heap_size_executable`] =
                    heapStats.total_heap_size_executable;
                enqueue[`heap.total_physical_size`] = heapStats.total_physical_size;
                enqueue[`heap.total_available_size`] = heapStats.total_available_size;
                enqueue[`heap.heap_size_limit`] = heapStats.heap_size_limit;
                if (heapStats.malloced_memory) {
                    enqueue[`heap.malloced_memory`] = heapStats.malloced_memory;
                }
                if (heapStats.peak_malloced_memory) {
                    enqueue[`heap.peak_malloced_memory`] =
                        heapStats.peak_malloced_memory;
                }

                Object.keys(enqueue).forEach((metricName) => {
                    if (enqueue[metricName]) {
                        const meter = meterProvider.getMeter(serviceName);
                        const counter = meter.createCounter(metricName);
                        let val = enqueue[metricName]
                        counter.add(parseFloat(val));
                    }
                });
            }, 10000);
        }
    }
};
