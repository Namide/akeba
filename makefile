dev:
	@docker run -ti --rm \
		-u "node" \
		-v $(shell pwd):/usr/src/app \
		-w /usr/src/app \
		-p 5173:5173 \
		node \
		npm run dev

build:
	@docker run -ti --rm \
		-u "node" \
		-v $(shell pwd):/usr/src/app \
		-w /usr/src/app \
		-p 3000:3000 \
		node \
		npm run build

install:
	@docker run -ti --rm \
		-u "node" \
		-v $(shell pwd):/usr/src/app \
		-w /usr/src/app \
		-u "node" \
		node \
		npm run i

code:
	@docker run -ti --rm \
		-v $(shell pwd):/usr/src/app \
		-p 4321:4321 \
		-p 3333:3333 \
		-p 3001:3000 \
		-w /usr/src/app \
		-u "node" \
		-e NPM_CONFIG_PREFIX=/home/node/.npm-global \
		node \
		bash
