#!/bin/sh

sudo docker service ls --format '{{json . }}' | jq --slurp
