if [ -z $(grep version package.json |grep -o '[0-9.]*') ]; then echo Version must be specified in package.json; exit 1; fi
