export PATH := $(PATH):node_modules/.bin

TS_SRC := $(find src -name '*.ts')

.PHONY: compile
compile: target/lib.target

target/lib.target: tsconfig.json target/node_modules.target $(TS_SRC)
	tsc -p .
	mkdir -p $(@D)
	> $@

.PHONY: format
format: target/node_modules.target
	prettier --write .

target/node_modules.target: package.json yarn.lock
	yarn install
	mkdir -p $(@D)
	> $@

.PHONY: package
package: target/package.tgz

.PHONY: publish
publish: target/package.tgz
	npm publish --access $@

target/package.tgz: package.json target/lib.target
	rm -fr target/package
	mkdir target/package
	rsync -r --exclude='*.spec.js' --exclude='*.spec.js.map' src/ target/package/
	rsync -r --exclude='*.spec.js' --exclude='*.spec.js.map' lib/ target/package/
	cp package.json target/package
	cd target/package && npm pack && mv *.tgz ../package.tgz

.PHONY: test
test: target/node_modules.target
	jest
