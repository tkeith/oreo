#!/bin/bash

set -e
cd `dirname $0`
cd .. # project root

scripts/docker-compose build
scripts/docker-compose run --rm -it app bash
