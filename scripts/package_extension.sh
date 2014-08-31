#!/bin/sh

set -eu

CURRENT_DIR=$(cd $(dirname $0); pwd)
BASE_DIR=$(dirname $CURRENT_DIR)
TARGET_DIR=$BASE_DIR/target
TARGET_PATH=$TARGET_DIR/find-ebook-edition.zip

mkdir -p $TARGET_DIR
rm $TARGET_PATH
(cd $BASE_DIR; zip -r $TARGET_PATH . -x .\* dashboard/\*)
