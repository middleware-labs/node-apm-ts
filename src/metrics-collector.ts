import * as v8 from 'v8';
import * as os from 'os';
import { OTLPMetricExporter } from '@opentelemetry/exporter-metrics-otlp-grpc';
import { SemanticResourceAttributes } from '@opentelemetry/semantic-conventions';
import { Resource } from '@opentelemetry/resources';
import { MeterProvider, PeriodicExportingMetricReader } from '@opentelemetry/sdk-metrics';
import {Config} from './config';


export function init(config: Config): void {
    let apm_pause_metrics = !!(config.pauseMetrics && config.pauseMetrics === true);
    if (!apm_pause_metrics) {
        const metricsExporter = new OTLPMetricExporter({ url: config.target });
        let time = process.hrtime();
        let enqueue :any = [] ;
        let cpuUsage:any = false;
        const meterProvider = new MeterProvider({
            resource: new Resource({
                [SemanticResourceAttributes.SERVICE_NAME]: config.serviceName,
                ['mw_agent']: true,
                ['project.name']: config.projectName,
                ['mw.account_key']: config.accessToken,
            }),
        });
        meterProvider.addMetricReader(
            new PeriodicExportingMetricReader({
                exporter: metricsExporter,
                exportIntervalMillis: 10000,
            })
        );
        const meter = meterProvider.getMeter('node-app-meter');
        setInterval(() => {
            if (process.cpuUsage) {
                const elapsedTime = process.hrtime(time);
                const elapsedUsage = process.cpuUsage(cpuUsage);
                time = process.hrtime();
                cpuUsage = process.cpuUsage();
                const elapsedMs = elapsedTime[0] * 1000 + elapsedTime[1] / 1000000;
                const userPercent = (100 * elapsedUsage.user) / 1000 / elapsedMs;
                const systemPercent = (100 * elapsedUsage.system) / 1000 / elapsedMs;
                const totalPercent = userPercent + systemPercent;
                enqueue['cpu.system'] = systemPercent.toFixed(2);
                enqueue['cpu.user'] = userPercent.toFixed(2);
                enqueue['cpu.total'] = totalPercent.toFixed(2);
                enqueue['cpu.uptime'] = Math.round(process.uptime());
            }
            const eventLoop = require('./../build/Release/eventLoopStats');
            const eventLoopMatric = eventLoop.sense();
            enqueue['event_loop.delay.min'] = eventLoopMatric.min.toFixed(2);
            enqueue['event_loop.delay.max'] = eventLoopMatric.max.toFixed(2);
            enqueue['event_loop.delay.sum'] = eventLoopMatric.sum.toFixed(2);
            if (v8.getHeapSpaceStatistics) {
                const stats = v8.getHeapSpaceStatistics();
                for (let i = 0, l = stats.length; i < l; i++) {
                    const tags = `${stats[i].space_name}`;
                    enqueue[`heap.size.by.space.${tags}`] = stats[i].space_size;
                    enqueue[`heap.used_size.by.space.${tags}`] = stats[i].space_used_size;
                    enqueue[`heap.available_size.by.space.${tags}`] = stats[i].space_available_size;
                    enqueue[`heap.physical_size.by.space.${tags}`] = stats[i].physical_space_size;
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
            Object.keys(enqueue).forEach((metric_name) => {
                if (enqueue[metric_name]) {
                    const counter = meter.createCounter(metric_name);
                    counter.add(parseFloat(enqueue[metric_name]));
                }
            });
        }, 10000);
    }
}
