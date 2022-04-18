#!/usr/bin/env bash

######################
# Script: local-env.sh
# Collection of common env-vars used across the pipeline

uname -rma
echo
java -version
echo
echo "Node version"
node --version
echo

dotcms_src="${GITHUB_WORKSPACE}/dotCMS"
[[ -f ${dotcms_src}/gradlew && -f ${dotcms_src}/build.gradle ]] && gradle_env=true
[[ -f ${GITHUB_WORKSPACE}/mvnw && -f ${GITHUB_WORKSPACE}/pom.xml ]] && maven_env=true

if [[ "${gradle_env}" == 'true' ]]; then
  export BUILD_ENV=gradle
  export BUILD_TOOL=./gradlew
elif [[ "${maven_env}" == 'true' ]]; then
  export BUILD_ENV=maven
  export BUILD_TOOL=./mvnw
else
  echo "Build tool cannot be found, aborting"
  exit 1
fi
echo "BUILD_ENV=${BUILD_ENV}" >> $GITHUB_ENV
echo "BUILD_TOOL=${BUILD_TOOL}" >> $GITHUB_ENV

if [[ "${GITHUB_EVENT_NAME}" == 'pull_request' ]]; then
  export BUILD_ID=${GITHUB_HEAD_REF}
else
  export BUILD_ID=$(basename "${GITHUB_REF}")
fi
export BUILD_HASH=$(git log -1 --pretty=%h)
echo "BUILD_ID=${BUILD_ID}" >> $GITHUB_ENV
echo "BUILD_HASH=${BUILD_HASH}" >> $GITHUB_ENV

echo "##########
Build vars
##########
BUILD_ENV: ${BUILD_ENV}
BUILD_TOOL: ${BUILD_TOOL}
BUILD_ID: ${BUILD_ID}
BUILD_HASH: ${BUILD_HASH}
"
