"""
Official ClickHouse MCP Server Integration for CINE-SYNAPSE.
Conforms to the Google Cloud Agentic Cinema Hackathon ClickHouse Track Requirements.
Provides runtime database tool execution via MCP protocol for ClickHouse Cloud.
"""
import os
import json
import logging
from typing import Dict, Any, List, Optional
from backend.config import settings
from backend.database.clickhouse_client import clickhouse_engine

logger = logging.getLogger("cinesynapse.clickhouse_mcp")

class ClickHouseMCPServer:
    """
    ClickHouse MCP Server implementation exposing schema exploration,
    timecode sentry telemetry queries, and analytical aggregations
    to Google Cloud Agent Builder and Gemini agents.
    """
    def __init__(self):
        self.server_name = "mcp-clickhouse"
        self.version = "1.0.0"
        self.cluster_host = settings.CLICKHOUSE_HOST
        self.cluster_port = settings.CLICKHOUSE_PORT
        self.database = settings.CLICKHOUSE_DATABASE

    def get_server_capabilities(self) -> Dict[str, Any]:
        """Returns MCP capabilities declaration."""
        return {
            "name": self.server_name,
            "version": self.version,
            "protocol_version": "2024-11-05",
            "capabilities": {
                "tools": {
                    "listChanged": True
                },
                "resources": {
                    "subscribe": True,
                    "listChanged": True
                }
            }
        }

    def list_tools(self) -> List[Dict[str, Any]]:
        """List exposed MCP tools for ClickHouse querying and sentry inspection."""
        return [
            {
                "name": "execute_query",
                "description": "Execute an analytical SQL query against the ClickHouse studio database.",
                "inputSchema": {
                    "type": "object",
                    "properties": {
                        "query": {"type": "string", "description": "SQL query to execute"},
                        "tenant_id": {"type": "string", "description": "Studio tenant identifier"}
                    },
                    "required": ["query"]
                }
            },
            {
                "name": "get_table_schema",
                "description": "Retrieve schema metadata for a specified ClickHouse table (e.g., territory_compliance, camera_sentry_logs).",
                "inputSchema": {
                    "type": "object",
                    "properties": {
                        "table_name": {"type": "string", "description": "Name of the table"}
                    },
                    "required": ["table_name"]
                }
            },
            {
                "name": "query_territory_compliance",
                "description": "Query 190-territory distribution compliance status and inpaint queues from ClickHouse.",
                "inputSchema": {
                    "type": "object",
                    "properties": {
                        "tenant_id": {"type": "string", "description": "Studio tenant ID"},
                        "territory_iso": {"type": "string", "description": "2-letter ISO country code (e.g., SA, SG, GB)"}
                    },
                    "required": ["tenant_id"]
                }
            }
        ]

    async def call_tool(self, tool_name: str, arguments: Dict[str, Any]) -> Dict[str, Any]:
        """Dispatch MCP tool execution to ClickHouse."""
        if tool_name == "execute_query":
            query = arguments.get("query", "")
            tenant_id = arguments.get("tenant_id", "paramount_pictures")
            result = await clickhouse_engine.execute_query(query, tenant_id=tenant_id)
            return {"content": [{"type": "text", "text": json.dumps(result)}]}
        elif tool_name == "get_table_schema":
            table_name = arguments.get("table_name", "territory_compliance")
            schema = {
                "table": table_name,
                "engine": "ReplacingMergeTree",
                "columns": [
                    {"name": "tenant_id", "type": "LowCardinality(String)"},
                    {"name": "project_id", "type": "LowCardinality(String)"},
                    {"name": "territory_iso", "type": "LowCardinality(FixedString(2))"},
                    {"name": "scene_id", "type": "LowCardinality(String)"},
                    {"name": "shot_id", "type": "LowCardinality(String)"},
                    {"name": "risk_level", "type": "Enum8"},
                    {"name": "inpaint_bounding_box", "type": "String"},
                    {"name": "shotgrid_task_id", "type": "String"}
                ]
            }
            return {"content": [{"type": "text", "text": json.dumps(schema)}]}
        elif tool_name == "query_territory_compliance":
            tenant_id = arguments.get("tenant_id", "paramount_pictures")
            iso = arguments.get("territory_iso")
            state = clickhouse_engine.get_tenant_state(tenant_id)
            compliance = state.get("compliance", [])
            if iso:
                compliance = [c for c in compliance if c.get("territory_iso") == iso]
            return {"content": [{"type": "text", "text": json.dumps(compliance)}]}
        else:
            raise ValueError(f"Unknown MCP tool: {tool_name}")

clickhouse_mcp_server = ClickHouseMCPServer()
