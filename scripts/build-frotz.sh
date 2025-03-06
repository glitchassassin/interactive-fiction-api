#!/bin/bash
set -e

# Create a temporary directory for building
BUILD_DIR=$(mktemp -d)
cd $BUILD_DIR

# Clone the frotz repository
git clone https://gitlab.com/DavidGriffith/frotz.git
cd frotz

# Build dfrotz
make dumb

# Copy the binary to /usr/local/bin
cp dfrotz /usr/local/bin/

# Clean up
cd /
rm -rf $BUILD_DIR

echo "dfrotz has been installed successfully." 