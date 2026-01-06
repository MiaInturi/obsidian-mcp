# Obsidian MCP Server

An MCP (Model Context Protocol) server for Obsidian that provides HTTP-based tools to read and write files in your Obsidian vault.

## Features

- List notes (optionally filtered by a query)
- Read note content by file name
- Create notes by file name and content
- Streamable HTTP-based MCP protocol

## MCP Endpoints

- `GET /mcp` - isn't supported yet
- `POST /mcp` - Streamable HTTP JSON-RPC endpoint
- `DELETE /mcp` - isn't supported yet

## Available Tools

The server exposes the following MCP tools:

### `get_notes`
Get a list of notes, optionally filtered by a query string.

**Parameters:**
- `query` (string, optional): The query to search for notes (default: "")

### `read_note`
Read a note from the Obsidian vault.

**Parameters:**
- `fileName` (string, required): The name of the note file (e.g., "My Note.md")

### `create_note`
Create a new note with the given file name and content.

**Parameters:**
- `fileName` (string, required): The name of the note file (e.g., "My Note.md")
- `content` (string, required): The content of the note in markdown format

## Usage with MCP Clients

Connect to this server using any MCP-compatible client. The server uses Streamable HTTP for the transport layer over HTTP.

Example connection URL: `http://127.0.0.1:3333/mcp`

## Environment Variables

- `HOST` (optional): Host interface to bind (default: `127.0.0.1`).
- `PORT` (optional): Port to listen on (default: `3333`).
- `NOTES_PATH` (required): Path to the directory with Obsidian notes. Must be non-empty.

## Docker

The Docker image is configured via environment variables. Provide `NOTES_PATH` at runtime.

## License

MIT
