import requests
from flask import Flask, request, jsonify, Response
import os

app = Flask(__name__)

# The actual Groq API endpoint
GROQ_API_URL = "https://api.groq.com/openai/v1"

@app.route('/v1/chat/completions', methods=['POST'])
def proxy_chat_completions():
    try:
        data = request.get_json()
        
        # Strip unsupported 'reasoning_content' from messages
        if 'messages' in data:
            for msg in data['messages']:
                if 'reasoning_content' in msg:
                    del msg['reasoning_content']
                    
        # Forward the cleaned payload to Groq
        headers = {
            'Authorization': request.headers.get('Authorization'),
            'Content-Type': 'application/json'
        }
        
        # Make the request to Groq, passing stream=True to support streaming
        stream = data.get('stream', False)
        groq_resp = requests.post(
            f"{GROQ_API_URL}/chat/completions",
            json=data,
            headers=headers,
            stream=stream
        )
        
        if stream:
            def generate():
                for line in groq_resp.iter_lines():
                    if line:
                        yield line + b'\n\n'
                        
            return Response(
                generate(),
                content_type=groq_resp.headers.get('Content-Type', 'text/event-stream')
            )
        else:
            return jsonify(groq_resp.json()), groq_resp.status_code
            
    except Exception as e:
        print(f"Proxy Error: {e}")
        return jsonify({"error": str(e)}), 500

@app.route('/', defaults={'path': ''})
@app.route('/<path:path>', methods=['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'])
def catch_all(path):
    # Pass through any other endpoints without modification
    headers = {
        'Authorization': request.headers.get('Authorization'),
        'Content-Type': request.headers.get('Content-Type')
    }
    groq_resp = requests.request(
        method=request.method,
        url=f"{GROQ_API_URL}/{path}",
        headers=headers,
        data=request.get_data(),
        params=request.args
    )
    return Response(groq_resp.content, status=groq_resp.status_code, headers=dict(groq_resp.headers))

if __name__ == '__main__':
    print("Starting Groq API Proxy on http://0.0.0.0:8080")
    print("This proxy intercepts requests and removes 'reasoning_content' to prevent 400 errors.")
    app.run(host='0.0.0.0', port=8080)
