.PHONY: openapi openapi-yaml

## API spec を public/openapi.json に取得
openapi:
	@curl -sSf http://localhost:4001/api/v1/docs-json -o public/openapi.json && \
	echo "✅ public/openapi.json updated"

## JSON→YAML へ変換して差し替え
openapi-yaml: openapi
	@npx -y js-yaml public/openapi.json > public/openapi.yaml && \
	rm public/openapi.json && \
	echo "✅ public/openapi.yaml updated"
