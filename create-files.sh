#!/bin/bash

a=0
b=48

destination="/metadata"


for ((i=a; i<=b; i++))
do
  echo "{}" > "${destination}/${i}.json"
done


# chmod +x create_files.sh
