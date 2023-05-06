#!/bin/bash

input_dir="./metadata" # Path to the metadata directory
output_dir="./weeks" # Path to the output directory

# Create the output directory if it doesn't exist
mkdir -p "$output_dir"

# Loop through the subdirectories
for ((i=0; i<24; i++)); do
  weekNb=$(($i+1))
  subdir="$output_dir/tlw-week-$weekNb"
  mkdir -p "$subdir"

  # Copy the appropriate JSON files
  for ((j=1; j<=i*2+2; j++)); do
    cp "$input_dir/$j.json" "$subdir/"
  done
done
