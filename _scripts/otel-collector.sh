#!/bin/bash -ex


if [ "$TRACING_OTEL_COLLECTOR_ENABLED" == "true" ]
then

  # Outputs traces to console/stdout
  EXPORTERS="logging"

  if [ "$TRACING_OTEL_COLLECTOR_GCP_ENABLED" == "true" ]
  then
    EXPORTERS="$EXPORTERS,googlecloud"
  fi

  if [ "$TRACING_OTEL_COLLECTOR_JAEGER_ENABLED" == "true" ]
  then
    EXPORTERS="$EXPORTERS,jaeger"
  fi

  echo -e "Starting otel collector to capture client traces.\n exporters=$EXPORTERS\n gcp-proj-id=$TRACING_GCP_PROJECT"

  docker run --rm --name otel-collector \
    --net fxa \
    -v $(pwd)/_scripts/configs/otel-collector-config.yaml:/etc/otel/config.yaml \
    -v $HOME/.config/gcloud/application_default_credentials.json:/etc/otel/key.json \
    -e GOOGLE_APPLICATION_CREDENTIALS=/etc/otel/key.json \
    -e EXPORTERS=$EXPORTERS \
    -e TRACING_GCP_PROJECT=$TRACING_GCP_PROJECT \
    -p 1888:1888 \
    -p 8888:8888 \
    -p 8889:8889 \
    -p 13133:13133 \
    -p 4317:4317 \
    -p 4318:4318 \
    -p 55679:55679 \
    otel/opentelemetry-collector-contrib:0.88.0 --config=/etc/otel/config.yaml
else
  echo -e "The open telemtry collector did not start, because it is not enabled. Set env TRACING_OTEL_COLLECTOR_ENABLED=true to enable. Running an open telemetry collector is optional! \n"
fi
