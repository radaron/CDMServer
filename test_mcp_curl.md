# Test MCP with curl

```bash
# 1) Login to get session cookie
curl -sS -c /tmp/cdm.cookie \
  -H "Content-Type: application/json" \
  -X POST http://localhost:8000/api/auth/login/ \
  -d '{"email":"admin@admin.hu","password":"admin","keepLoggedIn":true}'
```

```bash
# 2) Generate MCP API key (one-time plaintext return)
MCP_API_KEY=$(
  curl -sS -b /tmp/cdm.cookie \
    -H "Content-Type: application/json" \
    -X POST http://localhost:8000/api/users/me/mcp-api-key/regenerate/ \
  | jq -r '.apiKey'
)

echo "$MCP_API_KEY"
```

```bash
# 1) Initialize (new session)
HDRS=$(mktemp)
curl -sS -D "$HDRS" \
  -H "Authorization: Bearer $MCP_API_KEY" \
  -H "Content-Type: application/json" \
  -H "Accept: application/json, text/event-stream" \
  -X POST http://localhost:8000/mcp/ \
  -d '{
    "jsonrpc":"2.0",
    "id":"init-1",
    "method":"initialize",
    "params":{
      "protocolVersion":"2025-03-26",
      "capabilities":{},
      "clientInfo":{"name":"curl","version":"1.0.0"}
    }
  }'
SESSION_ID=$(awk 'BEGIN{IGNORECASE=1} /^mcp-session-id:/ {print $2}' "$HDRS" | tr -d '\r')
echo "SESSION_ID=$SESSION_ID"
```


Example resources:

```bash
# list resources
curl -sS \
  -H "Authorization: Bearer $MCP_API_KEY" \
  -H "mcp-session-id: $SESSION_ID" \
  -H "Content-Type: application/json" \
  -H "Accept: application/json, text/event-stream" \
  -X POST http://localhost:8000/mcp/ \
  -d '{"jsonrpc":"2.0","id":"1","method":"tools/list"}'


# read me context
curl -sS \
  -H "Authorization: Bearer $MCP_API_KEY" \
  -H "mcp-session-id: $SESSION_ID" \
  -H "Content-Type: application/json" \
  -H "Accept: application/json, text/event-stream" \
  -X POST http://localhost:8000/mcp/ \
  -d '{"jsonrpc":"2.0","id":"4","method":"resources/read","params":{"uri":"context://me"}}'

# read devices context
curl -sS \
  -H "Authorization: Bearer $MCP_API_KEY" \
  -H "mcp-session-id: $SESSION_ID" \
  -H "Content-Type: application/json" \
  -H "Accept: application/json, text/event-stream" \
  -X POST http://localhost:8000/mcp/ \
  -d '{"jsonrpc":"2.0","id":"4","method":"resources/read","params":{"uri":"context://devices"}}'
```

```bash
# Search on ncore
curl -sS \
  -H "Authorization: Bearer $MCP_API_KEY" \
  -H "mcp-session-id: $SESSION_ID" \
  -H "Content-Type: application/json" \
  -H "Accept: application/json, text/event-stream" \
  -X POST http://localhost:8000/mcp/ \
  -d '{
    "jsonrpc":"2.0",
    "id":"ncore-1",
    "method":"tools/call",
    "params":{
      "name":"ncore_search",
      "arguments":{
        "pattern":"dune",
        "category":"all_own",
        "where":"name",
        "page":1
      }
    }
  }'
```

```bash
# Add download
curl -sS \
  -H "Authorization: Bearer $MCP_API_KEY" \
  -H "mcp-session-id: $SESSION_ID" \
  -H "Content-Type: application/json" \
  -H "Accept: application/json, text/event-stream" \
  -X POST http://localhost:8000/mcp/ \
  -d '{
    "jsonrpc":"2.0",
    "id":"add-1",
    "method":"tools/call",
    "params":{
      "name":"add_download",
      "arguments":{
        "torrent_id":4105292,
        "device_id":4
      }
    }
  }'
```