import request
import response
import json

def handle_request():
    if request.method() == "POST" and request.pathname() == "/users":
        response.status(400)
        response.send(json.dumps({
            "error": "Bad Request",
            "message": "Missing required field: email"
        }))
        response.exit()