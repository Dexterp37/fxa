import sentryMetrics from './sentry';
import { SeverityLevel } from '@sentry/browser';

interface FlowEventParams {
  device_id?: string;
  flow_id?: string;
  flow_begin_time?: number;
}
interface FlowEventData {
  deviceId: string;
  flowBeginTime: number;
  flowId: string;
}

let initialized = false;
let optEventData: FlowEventData;

function shouldSend() {
  if (!initialized) {
    sentryMetrics.captureMessage(
      'Flow events not initialized - Metrics not captured for checkout flow',
      'flowEvents.initializationError',
      { referrer: document.referrer, url: document.URL },
      'warning' as SeverityLevel
    );
  }
  return initialized && window.navigator.sendBeacon;
}

function postMetrics(eventData: object) {
  // This is not an Action insofar that it has no bearing on the app state.
  window.navigator.sendBeacon('/metrics', JSON.stringify(eventData));
}

export function init(eventData: FlowEventParams) {
  if (
    !initialized &&
    eventData.device_id &&
    eventData.flow_begin_time &&
    eventData.flow_id
  ) {
    optEventData = {
      deviceId: eventData.device_id,
      flowBeginTime: eventData.flow_begin_time,
      flowId: eventData.flow_id,
    };
    initialized = true;
  }
}

export function getFlowData() {
  if (initialized) {
    return optEventData;
  }
  return undefined;
}

export function logAmplitudeEvent(
  groupName: string,
  eventName: string,
  eventProperties: object
) {
  if (!shouldSend()) {
    return;
  }

  try {
    const now = Date.now();
    const eventData = {
      events: [
        {
          offset: now - optEventData.flowBeginTime || 0,
          type: `amplitude.${groupName}.${eventName}`,
        },
      ],
      data: {
        flushTime: now,
        ...optEventData,
        ...eventProperties,
      },
    };

    postMetrics(eventData);
  } catch (e) {
    console.error('AppError', e);
    sentryMetrics.captureException(e);
  }
}

// eslint-disable-next-line import/no-anonymous-default-export
export default {
  init,
  logAmplitudeEvent,
  getFlowData,
};
